# Heroic Shopping Quest

Open `/quest/` from the food plan to use the current list. To make a new trip:

1. Copy `trips/template.json` to a new file in `trips/`.
2. Give the trip a unique `id`, title, store, theme and date. Use `default`, `aldi`, or `walmart` as the theme.
3. Edit the sections and items. Each item needs a unique `id`, `name`, `amount`, and a `section` matching a section's `id`. An `image` is optional and should point to an asset in this repository.
4. Open `quest/?trip=your-file.json`. Sharing the resulting link preserves the selected trip. A party link is optional.

The default trip reads the current root `data.js`. Progress is stored on the phone per trip ID. The receipt photo is stored on the phone; use the share button or download it to send it yourself. Two-phone synchronization requires an internet connection and has not been verified on two physical devices.

For a local test, run `node quest/tests/smoke.mjs`. The smoke test needs Playwright and a Chromium browser; neither is required by the app itself. Offline support is not required per Owen's October 30 direction.

## How to start a new week / add a store

New week (normal case): edit root `data.js` as usual. Set `store` (for example `"Aldi"`) and keep a date in `week` such as `"Week of Nov 5"`. The trip ID becomes `<store>-<date>`, so the new week starts with no checks, and earlier weeks stay in Past Quests. If `week` has no "Mon D" date, the ID uses the current week's Sunday.

Any store name works. Stores without their own theme use the default colors and the generic storefront.

To give a store its own look:
1. Copy `themes/aldi.json` to `themes/<slug>.json`, where slug is the store name in lowercase with non-letters/digits replaced by `-` (for example "Giant Eagle" becomes `giant-eagle`). Set `"id"` to the same slug and edit the colors.
2. Add the slug to `THEMES` in `js/loader.js`.
3. Optional: add `assets/final/backgrounds/bg_store_<slug>.png` and an entry with id `bg_store_<slug>` and status `in_review` in `assets/ASSET-MANIFEST.json`. Without it, the generic storefront is used.
