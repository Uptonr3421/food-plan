# Heroic Shopping Quest — Handoff for the visual design agent

You're finishing the front end for **Heroic Shopping Quest**, a reusable 16-bit (SNES-style) shopping checklist that Upton and Gabe use on their phones while shopping together. It must work for any store (Aldi, Walmart, others) and be reusable for every future trip.

## Repo and hosting
- Repo: `Uptonr3421/food-plan` (GitHub Pages: https://uptonr3421.github.io/food-plan/). App lives in `/quest/` → https://uptonr3421.github.io/food-plan/quest/
- Root `index.html` + `data.js` hold the current food plan. Don't change `data.js` contents or break the root page.
- Commit as `user.name=Uptonr3421`, `user.email=onew100110@gmail.com`. Free hosting and services only. All assets live in the repo (no hotlinking).

## Current state (first working pass, rough edges expected)
- `index.html`, `css/quest.css`
- `js/main.js` (screens, checklist, XP, badges), `js/audio.js` (WebAudio chiptunes), `js/fx.js` (pops, confetti, shake), `js/storage.js` (localStorage/IndexedDB), `js/sync.js` (optional ntfy.sh party sync, topic in `#party=`), `js/receipt.js` (Receipt Dragon finale), `js/loader.js` (loads trip + theme), `js/adapter.js` (builds a trip from `../data.js`)
- `themes/` default, aldi, walmart. `trips/` the current Aldi trip + `template.json`
- `assets/sprites/` pixel sprites + `assets/manifest.json`. `assets/concept/` is for the 4 original concept images (not yet in the repo; ask Upton for them).
- `tools/` sprite and trip build scripts. `tests/smoke.mjs` (currently hangs, needs fixing).

## Art direction
Gold-framed maroon panels, purple and blue gradients, Press Start 2P font, chunky pixel UI. Cast: a burly cart-pushing hero, a scroll-reading hero in a blue tunic, and a pug with a backpack and rainbow heart tag. LGBT flair, joyful not overpowering: rainbow segmented XP bar, rainbow coin trails and confetti, pride banner on victory, "Fabulous Forager" badge.

## Data model
Trip JSON: `{store, theme, date, sections:[...], items:[{id,name,amount,section,image?}]}`. Themes only swap colors, background and section names. Load with `?trip=<file>`; default is the data.js trip. A new trip for any store should take under 5 minutes.

## Features to finish and polish
Title screen ("Level up your groceries", Start Dungeon Run). Sectioned rows with name and amount, optional product thumbnail in a gold frame with a pixel fallback, tap to check. Blips, +EXP and coin pops, combo streaks, XP bar, Quest x/N, level titles, badges (Protein Paladin, Produce Ranger, Fabulous Forager), pug quips. Final boss "Defeat the Receipt Dragon": camera capture, shake, fanfare, confetti, Claim Rewards screen with the framed receipt, date and count, and a "Send receipt" share button (Web Share API, with download + mailto fallbacks). The receipt stays on the device and is never uploaded or synced. Past Quests log, New Quest reset, mute, saved progress. Optional live sync between two phones; the app must work fully without it.

## Hard rules
- No prices anywhere in `/quest`.
- No medication or health words anywhere.
- Don't add or remove food items.
- No frameworks or big libraries; fast on a phone; big tap targets; readable in a bright store.
- Receipts are never uploaded.

## Acceptance
The live `/quest/` URL returns 200 with no console errors; items render from the trip; there's no "$" in the rendered page; it works offline; a new store trip works from `template.json`.

## Still to do
Fix the smoke test, add the original concept art, product thumbnails per store, verify sync on two real phones, add a link from the root page, and general visual polish.

## Report back in this exact format
- LIVE LINK:
- COMMIT:
- FILES CHANGED:
- HOW TO START A NEW TRIP:
- SYNC STATUS:
- ASSET MANIFEST SUMMARY:
- KNOWN ISSUES:
