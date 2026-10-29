# Heroic Shopping Quest — Handoff

**Live:** https://uptonr3421.github.io/food-plan/quest/  
**Repo:** `Uptonr3421/food-plan` → folder `/quest/` → branch `main` (GitHub Pages)  
**Asset list:** [`assets/ASSET-MANIFEST.json`](assets/ASSET-MANIFEST.json)

---

## 1. What this is
A 16-bit (SNES-style) shopping checklist game. Upton and Gabe open it on their phones in the store, check items off, earn XP and badges, beat a final boss by photographing the receipt, and claim rewards. It must be reusable for **any store and any trip**.

## 2. Your job
Take the working first pass and make it polished and complete. There are four workstreams. Each one ends with a checklist.

---

## 3. The golden rule
The images in `assets/concept/` and `assets/sprites/concept/` are **reference only**.  
👉 **Isolate → clip → redraw every element clean.** Use a consistent pixel grid, transparent backgrounds, and `image-rendering: pixelated`. Save to `assets/final/<category>/`.  
Never ship the reference crops or the placeholder `assets/sprites/*.png`.

---

## 4. Hard rules (never break)
| # | Rule |
|---|------|
| 1 | No prices anywhere in `/quest`. |
| 2 | No medication or health words anywhere. |
| 3 | Don't add, remove or rename food items. ("Snap peas" appears twice; ask Upton.) |
| 4 | Don't touch root `data.js` or break the root food page. |
| 5 | Receipts stay on the phone. Never upload or sync them. They leave only through the user's own Share tap. |
| 6 | No frameworks or big libraries. Phone-first, works offline, sprites under ~1 MB total. |
| 7 | Commit as `Uptonr3421 <onew100110@gmail.com>`. Free hosting only. |

---

## 5. Style guide
| Thing | Spec |
|---|---|
| Frames | Gold `#f2c230` / `#b8860b`, ornate corners |
| Panels | Maroon `#7a1f2b` / `#4a0f1a` |
| Backgrounds | Blue `#2b4c9b` → purple `#5b2a86` → night `#2a1648` |
| Text | Cream `#fff6d8`, Press Start 2P (self-hosted) |
| Pride accents | `#e40303 #ff8c00 #ffed00 #008026 #004dff #750787` |
| Cart hero | Burly, beard, white tank, chain necklace, wrist cuffs, jeans |
| Scroll hero | Smiling, short hair, blue tunic, leather straps and pouch, holds the list scroll |
| Pug | Brown backpack, rainbow heart tag |
| Food art | Generic packaged pixel items like the milk, bread and produce crops. No real brand logos. |

LGBT flair should be joyful, not overpowering: rainbow XP bar, rainbow coin trails and confetti, pride banner on victory, "Fabulous Forager" badge.

---

## 6. Workstreams

### A. Visuals (73 assets, listed in the manifest)
- [ ] Portraits: cart hero, scroll hero, pug (128×128)
- [ ] Full-body animated sprite sheets: heroes (idle, push, cheer), pug (idle, wag, victory dance)
- [ ] Receipt Dragon boss (idle, hit, defeated)
- [ ] UI kit: 9-slice panel frame, Start and Claim buttons (normal and pressed), checkbox, sword, star, XP bar, coin (4 frames), coin pile, loot bag, title banner, pride banner, rainbow heart
- [ ] Backgrounds: generic store, Aldi, Walmart, aisle, boss arena
- [ ] Badges: Protein Paladin, Produce Ranger, Fabulous Forager
- [ ] Food art: one per list item, plus breakfast, lunch and dinner plates
- [ ] Mark each manifest entry `"status": "done"`

### B. Audio (WebAudio synth, no files; `js/audio.js`)
| Sound | When | Status |
|---|---|---|
| start | Start Dungeon Run | ✅ polish |
| check | Item checked, pitch rises with combo | ✅ polish |
| uncheck | Item unchecked | ✅ polish |
| coin | After each check | ✅ polish |
| combo | Combo x3+ | ✅ polish |
| level | Level up | ✅ polish |
| badge | Badge unlocked | ✅ polish |
| roar / hit / fanfare | Boss appears / photo hits / victory | ✅ polish |
| bgm_store, bgm_boss | Optional loops, off by default, respect mute | ❌ build |
| pug_bark | On pug quip | ❌ build |

### C. Gameplay (`js/main.js`): keep these rules, then deepen
| System | Current rule | Add |
|---|---|---|
| XP | 10 per item, level every 60 | — |
| Titles | Cart Squire → Aisle Scout → Shelf Knight → Basket Baron → Grocery Hero → Loot Legend → Fabulous Monarch of the List | Level-up animation |
| Combo | Checks within 12 s chain. +2 XP per step (cap 5). x3+ gives an extra coin, an arpeggio and a big "xN COMBO!" pop | Visible timer ring, rainbow streak meter |
| Badges | One per section that has a `badge`, plus Fabulous Forager for finishing everything | Speed run, no-uncheck, perfect combo |
| Pug | Random quips on check, combo, uncheck | Bark and animation |
| **Final boss** | Receipt Dragon appears when all items are checked: roar, HP bar, camera capture, then hits, shake, HP drain, defeat, fanfare, confetti and coin shower | Multi-hit animation |
| Rewards | Framed receipt, date, items, XP, level, badges, pride banner, pug dance. **Send receipt** uses the Web Share API, with Download plus `mailto:onew100110@gmail.com` as fallbacks | — |
| Past Quests | On-device log with receipt thumbnails | — |
| Other | New Quest reset, mute, progress survives reload | — |

### D. Reusability and reliability
- [ ] New trip for any store in under 5 minutes (copy `trips/template.json`, set store and theme, list items), documented in `README.md`
- [ ] Themes swap palette, background, store label and section names only. No hard-coded store.
- [ ] Item art lookup: `item.image`, then `assets/final/food/food_<slug>.png`, then a section icon
- [ ] Fix `tests/smoke.mjs` (it hangs)
- [ ] Verify ntfy.sh party sync on two real phones, or report that it doesn't work. The app must work with sync off.

---

## 7. Code map
| File | Does |
|---|---|
| `index.html`, `css/quest.css` | Screens: title, list, boss, rewards, past |
| `js/main.js` | Game loop, HUD, XP, combos, badges, quips, boss, rewards |
| `js/audio.js` | Chiptune synth (`sfx.*`) |
| `js/fx.js` | `pop`, `coinTrail`, `confetti`, `shake` (reduced-motion aware) |
| `js/storage.js` | localStorage progress and history |
| `js/receipt.js` | IndexedDB receipts, downscale, share, download |
| `js/sync.js` | Optional ntfy.sh sync (`#party=<topic>`) |
| `js/loader.js`, `js/adapter.js` | Load trip and theme (`?trip=`), build a trip from `../data.js` |
| `themes/*.json`, `trips/*.json` | Store themes; trips (current Aldi list has 43 items) |
| `tools/` | Sprite, crop and trip build scripts |

---

## 8. Done means
- [ ] Live URL returns 200 with no console errors on mobile Safari and Chrome
- [ ] Full run works: title → list → combo, level, badge → boss → photo → rewards → past quests
- [ ] A Walmart trip from the template works
- [ ] Every manifest asset is `done`
- [ ] Smoke test passes. Grep finds no prices and no health words.

## 9. Report back in exactly this format
```
LIVE LINK:
COMMIT(S):
FILES CHANGED:
ASSETS DONE / REMAINING:
AUDIO DONE:
HOW TO START A NEW TRIP:
SYNC STATUS:
KNOWN ISSUES:
```
