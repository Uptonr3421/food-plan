#!/usr/bin/env python3
"""Cut reusable sprites from the 4 concept images and write assets/manifest.json.

1. Put the originals in quest/assets/concept/ with these names (any of .png/.jpg/.webp):
     banner_heroes   (1024x576 title banner + 3 heroes, purple bg)
     aldi_storefront (1024x576 storefront scene)
     phone_ui        (576x1024 phone UI mock)
     aisle           (1024x576 aisle scene)
2. Run: python3 quest/tools/cut_concepts.py
Crop boxes are (left, top, right, bottom) in source pixels and are scaled automatically
if the source is a different size than the reference size. Missing sources are skipped
and the generated pixel fallbacks (tools/make_sprites.py) stay in use.
"""
import json, os, glob
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(HERE, '..', 'assets')
REF = {'banner_heroes': (1024, 576), 'aldi_storefront': (1024, 576), 'phone_ui': (576, 1024), 'aisle': (1024, 576)}
CUTS = [  # name, source, box, use
 ('title_banner', 'banner_heroes', (150, 10, 890, 124), 'title screen logo'),
 ('art_hero_cart', 'banner_heroes', (25, 130, 410, 565), 'full-body hero with cart'),
 ('art_cart', 'banner_heroes', (125, 335, 410, 565), 'shopping cart prop'),
 ('art_scroll', 'banner_heroes', (415, 190, 535, 500), 'quest scroll prop'),
 ('art_hero_scroll', 'banner_heroes', (415, 125, 715, 565), 'full-body hero with scroll'),
 ('art_pug', 'banner_heroes', (740, 315, 960, 560), 'pug companion'),
 ('portrait_cart', 'phone_ui', (55, 32, 200, 158), 'party portrait 1'),
 ('portrait_scroll', 'phone_ui', (220, 32, 352, 158), 'party portrait 2'),
 ('portrait_pug', 'phone_ui', (370, 32, 522, 158), 'party portrait 3 (pug)'),
 ('art_loot_bag', 'phone_ui', (440, 232, 576, 480), 'loot bag (rewards)'),
 ('art_coin_pile', 'phone_ui', (440, 565, 576, 850), 'coin pile (rewards)'),
 ('art_panel_frame', 'phone_ui', (28, 190, 302, 322), 'gold/maroon item panel frame'),
 ('art_btn_start', 'phone_ui', (12, 868, 282, 1002), 'Start Dungeon Run button'),
 ('art_btn_claim', 'phone_ui', (296, 868, 566, 1002), 'Claim Rewards button'),
 ('bg_title', 'banner_heroes', (0, 0, 1024, 576), 'title screen background'),
 ('bg_aldi', 'aldi_storefront', (0, 0, 1024, 576), 'aldi theme background'),
 ('bg_aisle', 'aisle', (0, 0, 1024, 576), 'list screen background'),
 ('bg_phone', 'phone_ui', (0, 0, 576, 1024), 'portrait background / reference'),
]
def find(src):
    for f in glob.glob(os.path.join(A, 'concept', src + '.*')):
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')): return f
manifest = json.load(open(os.path.join(HERE, 'generated_manifest.json')))
for name, src, box, use in CUTS:
    entry = {'name': name, 'file': None, 'source': f'concept/{src}', 'crop': list(box), 'use': use, 'status': 'pending: source missing'}
    f = find(src)
    if f:
        im = Image.open(f).convert('RGB'); rw, rh = REF[src]; sx, sy = im.width / rw, im.height / rh
        b = (round(box[0]*sx), round(box[1]*sy), round(box[2]*sx), round(box[3]*sy))
        out = im.crop(b)
        if out.width > 1200: out = out.resize((1200, round(out.height*1200/out.width)), Image.LANCZOS)
        fn = f'sprites/{name}.webp'; out.save(os.path.join(A, fn), 'WEBP', quality=82, method=6)
        entry.update(file=fn, source=os.path.relpath(f, A), status='ok')
    manifest.append(entry)
json.dump({'note': 'Generated pixel fallbacks + concept-art cuts. Regenerate with tools/make_sprites.py then tools/cut_concepts.py.', 'sprites': manifest}, open(os.path.join(A, 'manifest.json'), 'w'), indent=1)
print('manifest written;', sum(1 for m in manifest if m.get('status') == 'ok'), 'concept cuts made')
