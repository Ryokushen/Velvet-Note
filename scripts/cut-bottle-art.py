"""Cut a bottle photo's background to transparency for The Note's dark UI.

Usage:
    python scripts/cut-bottle-art.py <image-url-or-path> <out-slug>

Produces <out-slug>.png (transparent) and <out-slug>-preview.png (composited
on the app surface color) in the current directory. Upload the transparent
PNG to the public 'bottle-art' Supabase bucket and set the fragrance row's
image_url to .../storage/v1/object/public/bottle-art/<out-slug>.png.
See docs/bottle-art-originals.json for the 2026-07-17 batch and revert info.

Requires: pip install rembg onnxruntime pillow pillow-avif-plugin requests
"""
import sys
from pathlib import Path

import pillow_avif  # noqa: F401  (registers AVIF decoder)
from PIL import Image
from rembg import new_session, remove

APP_SURFACE = (26, 25, 23)  # theme/colors.ts surface #1A1917


def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    source, slug = sys.argv[1], sys.argv[2]

    if source.startswith("http"):
        import requests

        resp = requests.get(source, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        tmp = Path(f"{slug}-src.bin")
        tmp.write_bytes(resp.content)
        img = Image.open(tmp).convert("RGBA")
    else:
        img = Image.open(source).convert("RGBA")

    cut = remove(img, session=new_session("u2net"))
    cut.save(f"{slug}.png")

    board = Image.new("RGBA", cut.size, APP_SURFACE + (255,))
    board.alpha_composite(cut)
    board.convert("RGB").save(f"{slug}-preview.png")
    print(f"wrote {slug}.png and {slug}-preview.png")
    return 0


if __name__ == "__main__":
    sys.exit(main())
