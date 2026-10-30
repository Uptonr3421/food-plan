# Audio pack verification (Oct 30, 2026)

Source: two split zips merged into `/workspace/quest-audio/merged/` (45 wav, 45 ogg, 45 mp3, 4 loop-checks, 1 demo, REPORT.txt; both halves carried an identical REPORT.txt).
Measured with ffprobe/ffmpeg (ebur128 true peak + gated LUFS) and numpy (ungated K-weighted LUFS, RMS, clipping, DC, onset, FFT pitch, loop seam). No human listening.

**Result: 45/45 pass.** Fail = missing, silent, wrong channels/rate, length off by >10% (music: not sample-exact), clipping, or seam click.

| file | pass | sec (spec) | samples | ch | peak dBFS | true peak | LUFS ungated / gated | notes |
|---|---|---|---|---|---|---|---|---|
| sfx_start | pass | 1.200 (1.2) | 52920 | 1 | -3.00 | -3.0 | -17.8 / -17.5 |  |
| sfx_tap | pass | 0.060 (0.06) | 2646 | 1 | -9.00 | -9.0 | -18.5 / -70.0 |  |
| sfx_back | pass | 0.100 (0.1) | 4410 | 1 | -9.00 | -9.0 | -18.7 / -70.0 |  |
| sfx_screen | pass | 0.350 (0.35) | 15435 | 1 | -9.00 | -9.0 | -17.6 / -70.0 |  |
| sfx_toggle_on | pass | 0.120 (0.12) | 5292 | 1 | -9.00 | -9.0 | -17.3 / -70.0 |  |
| sfx_toggle_off | pass | 0.120 (0.12) | 5292 | 1 | -9.00 | -9.0 | -18.4 / -70.0 |  |
| sfx_check_1 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -3.0 | -17.3 / -70.0 | f0 524 Hz (+2 c) |
| sfx_check_2 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -3.0 | -17.4 / -70.0 | f0 586 Hz (-3 c) |
| sfx_check_3 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -3.0 | -17.6 / -70.0 | f0 659 Hz (+0 c) |
| sfx_check_4 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -3.0 | -17.5 / -70.0 | f0 740 Hz (-1 c) |
| sfx_check_5 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -3.0 | -17.4 / -70.0 | f0 829 Hz (-3 c) |
| sfx_check_6 | pass | 0.140 (0.14) | 6174 | 1 | -3.00 | -2.9 | -17.5 / -70.0 | f0 930 Hz (-4 c) |
| sfx_uncheck | pass | 0.160 (0.16) | 7056 | 1 | -3.00 | -3.0 | -17.7 / -70.0 |  |
| sfx_coin | pass | 0.220 (0.22) | 9702 | 1 | -3.00 | -2.9 | -17.5 / -70.0 |  |
| sfx_coin_small | pass | 0.100 (0.1) | 4410 | 1 | -9.00 | -8.9 | -18.2 / -70.0 |  |
| sfx_exp | pass | 0.200 (0.2) | 8820 | 1 | -9.00 | -9.0 | -17.8 / -70.0 |  |
| sfx_combo_3 | pass | 0.450 (0.45) | 19845 | 1 | -3.00 | -3.0 | -17.7 / -17.5 |  |
| sfx_combo_5 | pass | 0.600 (0.6) | 26460 | 1 | -3.00 | -2.8 | -17.9 / -17.5 |  |
| sfx_combo_end | pass | 0.300 (0.3) | 13230 | 1 | -9.00 | -9.0 | -18.5 / -70.0 |  |
| sfx_streak_tick | pass | 0.050 (0.05) | 2205 | 1 | -9.00 | -8.9 | -18.2 / -70.0 |  |
| sfx_level | pass | 1.600 (1.6) | 70560 | 1 | -3.00 | -2.9 | -17.9 / -17.6 |  |
| sfx_badge | pass | 1.300 (1.3) | 57330 | 1 | -3.00 | -3.0 | -17.4 / -17.3 |  |
| sfx_section_clear | pass | 0.900 (0.9) | 39690 | 1 | -3.00 | -3.0 | -17.7 / -16.9 |  |
| sfx_claim | pass | 1.000 (1.0) | 44100 | 1 | -3.00 | -2.9 | -17.7 / -17.4 | onset 50.0ms |
| sfx_confetti | pass | 0.800 (0.8) | 35280 | 1 | -9.00 | -9.0 | -18.0 / -17.2 |  |
| sfx_pug_1 | pass | 0.350 (0.35) | 15435 | 1 | -3.00 | -3.0 | -17.4 / -70.0 |  |
| sfx_pug_2 | pass | 0.400 (0.4) | 17640 | 1 | -3.00 | -3.0 | -17.6 / -17.6 |  |
| sfx_roar | pass | 1.100 (1.1) | 48510 | 1 | -3.00 | -3.0 | -18.2 / -17.9 |  |
| sfx_hit_1 | pass | 0.200 (0.2) | 8820 | 1 | -3.00 | -3.0 | -17.6 / -70.0 |  |
| sfx_hit_2 | pass | 0.200 (0.2) | 8820 | 1 | -3.00 | -3.0 | -17.7 / -70.0 |  |
| sfx_hit_3 | pass | 0.200 (0.2) | 8820 | 1 | -3.00 | -3.0 | -17.3 / -70.0 |  |
| sfx_paper | pass | 0.300 (0.3) | 13230 | 1 | -9.00 | -9.0 | -17.8 / -70.0 |  |
| sfx_photo | pass | 0.250 (0.25) | 11025 | 1 | -3.00 | -3.0 | -17.8 / -70.0 |  |
| sfx_boss_defeat | pass | 1.800 (1.8) | 79380 | 1 | -3.00 | -2.9 | -17.8 / -19.1 |  |
| sfx_fanfare | pass | 4.500 (4.5) | 198450 | 1 | -3.00 | -3.0 | -17.6 / -17.7 |  |
| sfx_party_join | pass | 0.600 (0.6) | 26460 | 1 | -3.00 | -2.9 | -17.7 / -17.0 |  |
| sfx_party_check | pass | 0.120 (0.12) | 5292 | 1 | -9.00 | -9.0 | -17.2 / -70.0 |  |
| sfx_text_blip_1 | pass | 0.030 (0.03) | 1323 | 1 | -9.00 | -9.0 | -17.7 / -70.0 |  |
| sfx_text_blip_2 | pass | 0.030 (0.03) | 1323 | 1 | -9.00 | -9.0 | -17.6 / -70.0 |  |
| sfx_text_blip_3 | pass | 0.030 (0.03) | 1323 | 1 | -9.00 | -9.0 | -18.5 / -70.0 |  |
| sfx_error | pass | 0.250 (0.25) | 11025 | 1 | -3.00 | -3.0 | -17.8 / -70.0 |  |
| bgm_title | pass | 40.000 (1764000 smp) | 1764000 | 2 | -11.78 | -11.8 | -23.0 / -23.2 | edge rms -26.0/-25.0 dB; seam step 0.03x p99.9 |
| bgm_store | pass | 73.846 (3256615 smp) | 3256615 | 2 | -12.37 | -12.4 | -23.0 / -23.1 | edge rms -24.7/-26.2 dB; seam step 0.05x p99.9 |
| bgm_boss | pass | 50.526 (2228211 smp) | 2228211 | 2 | -12.44 | -12.4 | -23.0 / -23.1 | edge rms -26.2/-27.0 dB; seam step 0.00x p99.9 |
| bgm_victory | pass | 42.667 (1881600 smp) | 1881600 | 2 | -11.80 | -11.8 | -23.0 / -23.1 | edge rms -26.8/-25.1 dB; seam step 0.04x p99.9 |

## Deviations and REPORT.txt claims vs measurement

- All 45 names present in ogg, mp3 and wav; 44.1 kHz; effects mono, music stereo; no clipping, no DC, nothing silent. Music sample counts match the spec exactly (title 1764000, store 3256615, boss 2228211, victory 1881600).
- check_1..6 fundamentals ascend C5 D5 E5 F#5 G#5 A#5 within a few cents (524/586/659/740/829/930 Hz).
- Loops: |first-last| sample jump is below the 99.9th-percentile sample step on all four tracks (no seam click). Edge RMS shows no dip at the seam.
- **QUIET effects are not quieter in loudness.** They peak at -9 dBFS as ordered, but measure -17.2 to -18.7 LUFS (ungated), the same as normal effects (dense/low crest). Fixed in game: QUIET sounds play at -6 dB gain. REPORT is accurate about the numbers but this defeats the intent.
- **sfx_claim onset is ~50 ms, not within 5 ms** (first 50 ms is a constant -44 dBFS bed). REPORT claims all onsets within 5 ms: not true for this file. Minor; left as is.
- Gated LUFS reads -70 for effects shorter than 400 ms (EBU gating needs 400 ms blocks). REPORT states its LUFS is ungated; ungated numbers match REPORT within ~0.3 LU.
- "mp3 CBR 160 kbps": stream is 160 kbps; container bit_rate on very short files reads 168-213 kbps (header/padding overhead), not a deviation.
- Music true peak -11.8 to -12.4 dBTP, gated LUFS -23.1 to -23.2: matches REPORT's own cross-check. Effect true peak up to -2.8 dBTP (REPORT says -2.89; ffmpeg rounds to 0.1).

## Shipped to `quest/assets/audio/`

- 41 effects: delivered ogg (Vorbis q5) + mp3 (160k) copied as is (no normalization needed: effects sit within -17.2..-18.7 LUFS).
- 4 music loops re-encoded from the wav masters to ogg 96 kbps and mp3 112 kbps to cut size. Decoded sample counts and seams re-checked:
  - bgm_title.ogg: 1764000 samples, seam step 0.19x, 381 KB
  - bgm_title.mp3: 1764000 samples, seam step 0.04x, 547 KB
  - bgm_store.ogg: 3256615 samples, seam step 0.09x, 679 KB
  - bgm_store.mp3: 3256615 samples, seam step 0.07x, 1010 KB
  - bgm_boss.ogg: 2228211 samples, seam step 0.20x, 455 KB
  - bgm_boss.mp3: 2228211 samples, seam step 0.06x, 691 KB
  - bgm_victory.ogg: 1881600 samples, seam step 0.34x, 405 KB
  - bgm_victory.mp3: 1881600 samples, seam step 0.26x, 584 KB
- Total in repo: 5.8 MB (a browser downloads only one format; music loads only when music is switched on).
