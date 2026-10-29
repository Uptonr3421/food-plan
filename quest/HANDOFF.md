# Heroic Shopping Quest — Full Handoff (cloud agents)

Owner: Upton (Owen). Players: Upton + Gabe, shopping together on two phones. Live: https://uptonr3421.github.io/food-plan/quest/  Repo: `Uptonr3421/food-plan`, folder `/quest/`, branch `main`, GitHub Pages.

## Mission
Turn the working first pass into a polished, reusable 16-bit (SNES-era) shopping-quest library that works for **any store** (Aldi today; Walmart and others later) and every future trip. Lightweight, fun, in depth.

## Rule zero: the art is reference only
`assets/concept/*.jpg` (Upton's 3 concept images) and `assets/sprites/concept/*.webp` (rough crops) are **style reference only**. Isolate every element, clip it and **redraw it clean**: consistent pixel grid, limited palette, transparent backgrounds, crisp at 2x/3x (`image-rendering: pixelated`). Output goes to `assets/final/<category>/`. Never ship the reference crops or the placeholder `assets/sprites/*.png`. The full labeled list of what to make (73 assets + audio) is in **`assets/ASSET-MANIFEST.json`**. Update each entry's `status` to `done` and keep its `file` path as you go.

## Art direction
- Palette (see manifest): gold #f2c230 / #b8860b frames, maroon #7a1f2b / #4a0f1a panels, purple #5b2a86 → night #2a1648 gradients, blue sky #2b4c9b, cream ink #fff6d8.
- Font: Press Start 2P (or an equivalent pixel font, self-hosted).
- Cast: **cart hero** (burly, beard, white tank, chain, wrist cuffs, jeans), **scroll hero** (smiling, short hair, blue tunic with leather straps and pouch, reads the list scroll), **pug** (brown backpack, rainbow heart tag). Portraits as framed busts plus full-body animated sprites.
- Food: generic packaged-goods pixel art like `food_milk`, `food_bread` and `food_produce`. No real brand logos except the store theme's storefront.
- LGBT flair, joyful not overpowering: rainbow segmented XP bar, rainbow coin trails, rainbow confetti, pride banner on victory, pug's rainbow heart, "Fabulous Forager" badge, "Fabulous Monarch of the List" top title.

## Current code (vanilla ES modules, no build step, ~600 lines)
- `index.html`, `css/quest.css`: screens are title, list, boss, rewards and past quests.
- `js/main.js`: game loop, HUD, checklist, XP/levels/coins, combos, badges, quips, boss, rewards, past quests.
- `js/audio.js`: WebAudio square/triangle/saw synth, no files. `sfx.start/check(combo)/uncheck/coin/combo/level/badge/roar/hit/fanfare`.
- `js/fx.js`: `pop()` floating text, `coinTrail()` rainbow coins, `confetti()`, `shake()`. Respects prefers-reduced-motion.
- `js/storage.js`: localStorage progress and history. `js/receipt.js`: IndexedDB receipts, `downscale()` to 1200px, `shareReceipt()` (Web Share API), `downloadBlob()`.
- `js/sync.js`: optional ntfy.sh party sync. Topic in URL hash `#party=<topic>`, check/uncheck events over SSE. **Not verified on two real phones.**
- `js/loader.js` loads trip + theme (`?trip=<file>`). `js/adapter.js` builds a trip from root `../data.js`.
- `themes/default|aldi|walmart.json`: colors, background, storeLabel, section names.
- `trips/aldi-week-of-oct-29.json` (43 items; sections For Gabe, For Owen, Shared staples, Fresh produce), `trips/template.json`.
- `tools/make_sprites.py`, `tools/cut_concepts.py`, `tools/build_trip_from_datajs.mjs`. `tests/smoke.mjs` **hangs; fix it**.

## Game design (keep, then deepen)
- **Title**: banner "HEROIC SHOPPING QUEST / LEVEL UP YOUR GROCERIES", store background from theme, START DUNGEON RUN, Past Quests, Share Party Link.
- **List**: items grouped by section (themed names like Forest of Greens, Hall of Protein, Pantry Keep, Ice Caverns, Potion Shelf), each row is item art + name + amount + checkbox/sword. Tap to check, tap again to uncheck.
- **XP**: 10 XP per item, level every 60 XP. Titles in order: Cart Squire, Aisle Scout, Shelf Knight, Basket Baron, Grocery Hero, Loot Legend, Fabulous Monarch of the List. HUD shows Quest x/N, level and title, coins, and the combo counter.
- **Combos**: checks within 12 s chain. Bonus is +2 XP per chain step (cap 5). At x3+ you get an extra coin, the combo arpeggio, a big "xN COMBO!" pop and a combo quip, and the check blip pitch rises with the combo. Track best combo. Deepen it with a visible combo timer ring, a rainbow streak meter and combo-tier sounds.
- **Badges**: one per section that defines `badge` (Produce Ranger, Protein Paladin…), earned when that section is complete, plus Fabulous Forager when all items are done. Unlock sound + confetti. Add more (speed run, no-uncheck, perfect combo).
- **Pug quips**: random on check (e.g. "Bork! Critical hit on that shelf!", "Slay, hero. Slay."), combo quips, and an uncheck line "Put it back? No worries, hero." Add pug bark/snort audio and animation.
- **Final boss: Receipt Dragon**: opens when all items are checked (also reachable any time). Roar, HP bar, camera capture (`input type=file accept=image/* capture=environment`). On photo: hits + screen shake, HP drains, dragon defeated, fanfare, rainbow confetti and coin shower. Then go to Rewards.
- **Rewards / Claim**: framed receipt photo, date, items checked, XP, level, badges, pride banner, pug victory dance. **Send receipt** uses the Web Share API with the image file (Upton sends it to his assistant for spend analysis), falling back to Download plus `mailto:onew100110@gmail.com?subject=<Store> receipt`. Claim saves to Past Quests.
- **Past Quests**: on-device log (store, date, x/N, level, badges, receipt thumbnail).
- **New Quest** resets. Mute toggle. Progress survives reloads.

## Audio
Keep it synth-only (WebAudio, no files) unless tiny. Polish each `sfx`, then add optional looping BGM for the store and the boss (off by default, respects mute, starts only after a user gesture) and a pug bark. All of these are in the manifest `audio` list.

## Reusability
- New trip for any store in under 5 minutes: copy `trips/template.json`, set store and theme, list sections and items. Or run the adapter on `data.js`.
- Themes only swap palette, background, store label and section names. Add `walmart` and `generic` storefront backgrounds. No store is hard-coded.
- Item art lookup: `item.image`, then `assets/final/food/food_<slug>.png`, then a section icon fallback.
- Write `README.md` with the how-to.

## Hard rules
1. **No prices anywhere** in `/quest` (grep for `$` digits before every push).
2. **No medication or health words** anywhere.
3. Don't add, remove or rename food items. Note: the trip has "Snap peas" listed twice (from data.js); ask Upton, don't fix silently.
4. Don't change root `data.js` or break the root food page.
5. Receipts never leave the device except through the user's own share action. Never upload them, never sync them.
6. No frameworks or big libraries. Phone-first, big tap targets, readable in bright store light, works offline. Keep total page weight small (sprites under ~1 MB).
7. Commit as `user.name=Uptonr3421`, `user.email=onew100110@gmail.com`. Free hosting only.

## Acceptance
- https://uptonr3421.github.io/food-plan/quest/ returns 200 with no console errors on mobile Safari and Chrome.
- Items render from the trip. A Walmart trip from the template works.
- Full run: title → list → combos/level/badge → boss → photo → rewards → past quests.
- Sync tested on two devices (or clearly reported as not working). The app works with sync off.
- `assets/ASSET-MANIFEST.json`: every asset has status `done` with its real file.
- `tests/smoke.mjs` passes. Grep shows no prices and no health words.

## Report back in exactly this format
- LIVE LINK:
- COMMIT(S):
- FILES CHANGED:
- ASSETS DONE / REMAINING (from manifest):
- AUDIO DONE:
- HOW TO START A NEW TRIP:
- SYNC STATUS:
- KNOWN ISSUES:
