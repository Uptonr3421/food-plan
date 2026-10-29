# Concept art drop folder

The four AI concept images (title banner + heroes, Aldi storefront, phone UI mock, aisle scene) were
not readable from the build machine on the first pass, so they are not in the repo yet.
Drop them here as `banner_heroes.jpg`, `aldi_storefront.jpg`, `phone_ui.jpg`, `aisle.jpg`
(JPEG/WebP, under ~300 KB each), then run `python3 quest/tools/cut_concepts.py`.
The app automatically prefers `sprites/*.webp` cuts listed with `"status": "ok"` in `../manifest.json`.
