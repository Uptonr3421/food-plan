# Heroic Shopping Quest

Open `/quest/` from the food plan to use the current list. To make a new trip:

1. Copy `trips/template.json` to a new file in `trips/`.
2. Give the trip a unique `id`, title, store, theme and date. Use `default`, `aldi`, or `walmart` as the theme.
3. Edit the sections and items. Each item needs a unique `id`, `name`, `amount`, and a `section` matching a section's `id`. An `image` is optional and should point to an asset in this repository.
4. Open `quest/?trip=your-file.json`. Sharing the resulting link preserves the selected trip. A party link is optional.

The default trip reads the current root `data.js`. Progress is stored on the phone per trip ID. The receipt photo is stored on the phone; use the share button or download it to send it yourself. Two-phone synchronization requires an internet connection and has not been verified on two physical devices.

For a local test, run `node quest/tests/smoke.mjs`. The smoke test needs Playwright and a Chromium browser; neither is required by the app itself. Offline support is not required per Owen's October 30 direction.
