"""Nightly bottle-art processor for The Note.

Finds fragrances whose effective image is not yet a processed transparent PNG
in the 'bottle-art' bucket, cuts the background with rembg, uploads the PNG,
and repoints fragrances.image_url. The phone is never involved: everything
reads and writes the cloud Supabase project, so bottles added on the phone
are picked up on the next run.

Detection rule: a bottle needs processing when its own image_url does not
contain '/bottle-art/' — either it points at a raw external/catalog image, or
it is NULL and the app is falling back to a catalog_fragrances image via the
list_fragrances_with_catalog_images RPC coalesce (ebay -> fragrantica ->
image_url). Personal photos (user-fragrance-photos bucket) are skipped by
default; run with --include-personal to process them too.

Config: C:\\Users\\<user>\\.velvet-note\\service.env with
    SUPABASE_URL=https://aekzcttzqfwlxbsueqrf.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=<service role key>
The service role uploads without any storage policy and bypasses RLS.

Usage: python process-new-bottle-art.py [--dry-run] [--include-personal]
Run log: ~/.velvet-note/bottle-art-runs.jsonl (one JSON line per action).
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests

CONFIG_DIR = Path.home() / ".velvet-note"
ENV_FILE = CONFIG_DIR / "service.env"
RUN_LOG = CONFIG_DIR / "bottle-art-runs.jsonl"
BUCKET = "bottle-art"
PERSONAL_BUCKET_MARKER = "/user-fragrance-photos/"


def load_config() -> dict:
    if not ENV_FILE.exists():
        sys.exit(f"Config missing: {ENV_FILE}\nCreate it with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY lines.")
    env = {}
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()
    url = env.get("SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key or "PASTE" in key.upper():
        sys.exit(
            f"Service key not configured in {ENV_FILE}.\n"
            "Paste the service_role key from Supabase dashboard -> Project Settings -> API keys."
        )
    return {"url": url, "key": key}


def rest_headers(cfg: dict) -> dict:
    return {"Authorization": f"Bearer {cfg['key']}", "apikey": cfg["key"]}


def fetch_candidates(cfg: dict, include_personal: bool) -> list[dict]:
    headers = rest_headers(cfg)
    frags = requests.get(
        f"{cfg['url']}/rest/v1/fragrances",
        headers=headers,
        params={"select": "id,brand,name,image_url,catalog_id"},
        timeout=30,
    )
    frags.raise_for_status()
    catalog_ids = sorted({f["catalog_id"] for f in frags.json() if f.get("catalog_id")})
    catalog = {}
    if catalog_ids:
        resp = requests.get(
            f"{cfg['url']}/rest/v1/catalog_fragrances",
            headers=headers,
            params={
                "select": "id,ebay_image_url,fragrantica_image_url,image_url",
                "id": f"in.({','.join(catalog_ids)})",
            },
            timeout=30,
        )
        resp.raise_for_status()
        catalog = {str(row["id"]): row for row in resp.json()}

    candidates = []
    for f in frags.json():
        own = f.get("image_url")
        if own and f"/{BUCKET}/" in own:
            continue  # already processed
        if own and PERSONAL_BUCKET_MARKER in own and not include_personal:
            continue  # user's own photo — deliberate, leave alone unless opted in
        source = own
        if not source and f.get("catalog_id"):
            c = catalog.get(str(f["catalog_id"]), {})
            source = c.get("ebay_image_url") or c.get("fragrantica_image_url") or c.get("image_url")
        if not source:
            continue  # nothing to process (no image anywhere)
        candidates.append({**f, "source": source})
    return candidates


def slug_for(candidate: dict) -> str:
    # Catalog images are shared between duplicate bottles: name by source stem
    # so they process once. Anything else is named by the fragrance id.
    stem = candidate["source"].rsplit("/", 1)[-1].rsplit(".", 1)[0]
    safe = "".join(ch for ch in stem if ch.isalnum() or ch in "-_")
    return safe or candidate["id"]


def process(candidate: dict, cfg: dict, session) -> str:
    from io import BytesIO

    from PIL import Image
    from rembg import remove

    resp = requests.get(candidate["source"], timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    resp.raise_for_status()
    img = Image.open(BytesIO(resp.content)).convert("RGBA")
    cut = remove(img, session=session)

    buf = BytesIO()
    cut.save(buf, "PNG")
    path = f"{slug_for(candidate)}.png"
    upload = requests.post(
        f"{cfg['url']}/storage/v1/object/{BUCKET}/{path}",
        headers={**rest_headers(cfg), "Content-Type": "image/png", "x-upsert": "true"},
        data=buf.getvalue(),
        timeout=120,
    )
    upload.raise_for_status()

    public_url = f"{cfg['url']}/storage/v1/object/public/{BUCKET}/{path}"
    patch = requests.patch(
        f"{cfg['url']}/rest/v1/fragrances",
        headers={**rest_headers(cfg), "Content-Type": "application/json", "Prefer": "return=minimal"},
        params={"id": f"eq.{candidate['id']}"},
        json={"image_url": public_url},
        timeout=30,
    )
    patch.raise_for_status()
    return public_url


def log_line(entry: dict) -> None:
    CONFIG_DIR.mkdir(exist_ok=True)
    entry["ts"] = datetime.now(timezone.utc).isoformat()
    with RUN_LOG.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--include-personal", action="store_true")
    args = parser.parse_args()

    cfg = load_config()
    candidates = fetch_candidates(cfg, args.include_personal)
    if not candidates:
        print("Nothing to process — all bottle art is current.")
        log_line({"event": "run", "processed": 0})
        return 0

    print(f"{len(candidates)} bottle(s) need processing:")
    for c in candidates:
        print(f"  - {c['brand']} {c['name']}")
    if args.dry_run:
        return 0

    # Import lazily so no-op runs stay fast.
    from rembg import new_session

    session = new_session("u2net")
    ok = failed = 0
    for c in candidates:
        try:
            url = process(c, cfg, session)
            ok += 1
            print(f"  done {c['brand']} {c['name']}")
            log_line({"event": "processed", "id": c["id"], "brand": c["brand"],
                      "name": c["name"], "source": c["source"], "dest": url})
        except Exception as exc:  # keep going; retried next run
            failed += 1
            print(f"  FAILED {c['brand']} {c['name']}: {exc}")
            log_line({"event": "failed", "id": c["id"], "brand": c["brand"],
                      "name": c["name"], "source": c["source"], "error": str(exc)})

    print(f"Processed {ok}, failed {failed}.")
    log_line({"event": "run", "processed": ok, "failed": failed})
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
