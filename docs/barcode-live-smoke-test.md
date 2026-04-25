# Barcode Live Smoke Test

Repeatable manual check for the live barcode loop:
unknown scan submission -> admin review approval -> repeat scan resolves as catalog match.

## Prerequisites

- [ ] Dev build is pointed at a live Supabase project with current barcode migrations applied.
- [ ] Tester account is authenticated and is not using customer or production user data.
- [ ] Admin reviewer account is authenticated and allowlisted in `app_admins`.
- [ ] The catalog contains a safe test target row, for example `Dior` / `Sauvage`; use a seeded catalog row, not a real user's shelf item.
- [ ] The test barcode is synthetic and unused in `catalog_barcodes`.
- [ ] Camera access is available, or a generated barcode image can be scanned from another screen/device.

## Synthetic Barcode Convention

Use a synthetic numeric Code 128 barcode so it cannot be confused with a real UPC/EAN label:

`900000YYMMDDNN`

Example for April 25, 2026 first run: `90000026042501`.

Increment `NN` for each rerun. Do not reuse a barcode unless the cleanup step removed it from `catalog_barcodes` and `catalog_barcode_submissions`.

## Routes

- Add tab route: `/add`
- Scanner route: `/scan`
- Hidden admin review route: `/barcode-review`

## Checklist

1. Open `/add`.
   - Expected: Add screen is visible and the `Scan barcode` entry point opens `/scan`.

2. Open `/scan` and scan the synthetic barcode.
   - Expected initial state: `Ready` with scanner camera.
   - Expected lookup state: `Looking up <barcode>`.
   - Expected unknown state: `No catalog match yet`, the scanned barcode value, and the catalog search field `Search catalog to link this barcode`.

3. Search for the known catalog target.
   - Enter a non-customer query such as `sauvage`.
   - Expected: catalog rows render from shared catalog data.
   - Select the intended row.
   - Expected: `Selected: <brand> <name>` appears and `Submit barcode link` is enabled.

4. Submit the pending link.
   - Tap `Submit barcode link`.
   - Expected: `Barcode link submitted`.
   - Expected note: `This code is queued for review before it becomes a shared scanner match.`

5. As the allowlisted admin, open `/barcode-review`.
   - Expected header: `Admin` / `Barcode review`.
   - Expected queue state: the pending synthetic barcode appears with `Proposed catalog match`, the selected brand/name, optional `Review note`, `Reject`, and `Approve`.

6. Approve the pending link.
   - Optional review note: `Live smoke test approval`.
   - Tap `Approve`.
   - Expected: the queue refreshes and the approved item disappears. If it was the only item, the screen shows `No pending links`.

7. Repeat the scan on `/scan` with the same synthetic barcode.
   - Expected lookup state: `Looking up <barcode>`.
   - Expected matched state: `Catalog match`, selected catalog brand/name, the synthetic barcode value, `Scan again`, and `Use this match`.

8. Validate Add prefill handoff.
   - Tap `Use this match`.
   - Expected: app returns to `/add` with the approved catalog metadata prefilled for the selected catalog row.

## Cleanup

- Remove the synthetic row from `catalog_barcodes` after the run if the shared dev database should stay clean.
- Remove or archive related synthetic rows from `catalog_barcode_submissions` if they are not needed for audit/debugging.
- Record the barcode value, catalog row, tester account, admin account, and cleanup action in the test notes.
- Never use customer shelf rows, customer photos, customer email addresses, or real product barcodes for this smoke test.
