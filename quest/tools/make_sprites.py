#!/usr/bin/env python3
"""Generate 16-bit style pixel sprites (fallback art) into ../assets/sprites.
Run: python3 quest/tools/make_sprites.py   (needs Pillow)
Each sprite is an ASCII grid; one char = one pixel, scaled up with nearest-neighbour.
"""
import json, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'sprites')
os.makedirs(OUT, exist_ok=True)
P = {'.': None, 'k': '#1a1025', 'g': '#f2c230', 'G': '#b8860b', 'y': '#ffe680', 'm': '#7a1f2b', 'M': '#4a0f1a',
     'p': '#5b2a86', 's': '#f0c8a0', 'S': '#c98e64', 'b': '#6b3e1f', 'B': '#3d2410', 'w': '#ffffff', 'W': '#c9d1d9',
     'n': '#2b4c9b', 'N': '#18306b', 'c': '#efe0b4', 'C': '#c9b27a', 'r': '#e40303', 'o': '#ff8c00', 'e': '#ffed00',
     'v': '#008026', 'u': '#004dff', 'i': '#750787', 'h': '#8a8f98', 'H': '#555a63', 't': '#e46a8a', 'f': '#d9b38c', 'F': '#a67c52'}
S = {
 'coin': ["..kkkk..", ".kggggk.", "kgyggGGk", "kgyGgGGk", "kgyGgGGk", "kgggGGGk", ".kGGGGk.", "..kkkk.."],
 'heart_rainbow': [".kk.kk.", "krrkrrk", "kooooo k".replace(' ', ''), "keeeeek", ".kvvvk.", "..kuk..", "...k..."],
 'cart': ["k...........", "kk..........", ".khhhhhhhhhk", ".khWhWhWhWhk", ".khhhhhhhhhk", "..khWhWhWhk.", "..khhhhhhhk.", "...kkkkkkk..", "...k.....k..", "..kHk...kHk.", "...k.....k.."],
 'scroll': [".CCCCCCCC.", "CccccccccC", ".CckkkkcC.", ".Ccccccc C".replace(' ', 'c'), ".CckkkkcC.", ".CccccccC.", ".CckkkccC.", ".CccccccC.", "CccccccccC", ".CCCCCCCC."],
 'loot_bag': ["...bbbb...", "....BB....", "...bggb...", "..bbbbbb..", ".bbFbbbbb.", "bbbbbgbbbb", "bbbbgygbbb", "bbbbbgbbbb", ".bbbbbbbb.", "..BBBBBB.."],
 'coin_pile': ["....kkk.....", "...kgyGk....", "..kkgggkkk..", ".kgyGkkgyGk.", ".kgggkgggGk.", "kkgyGkgyGkkk", "kgggkgggkgGk", "kGGGkGGGkGGk", ".kkkkkkkkkk."],
 'hero_cart': ["....BBBB....", "...BBBBBB...", "..BBssssBB..", "..BssssssB..", "..skwsskws..", "..ssssSsss..", "..BBssssBB..", "..BBBttBBB..", "...BBBBBB...", ".sswWWWWwss.", "ssswwhhwwsss", "sssww..wwsss"],
 'hero_scroll': ["............", "....bbbb....", "...bbbbbb...", "...ssssss...", "..skwsskws..", "..ssssSsss..", "...sBttBs...", "....ssss....", "..nnnnnnnn..", ".nngnnnngnn.", ".nnnbnnbnnn.", ".nnnnBBnnnn."],
 'hero_pug': [".kk......kk.", "kFFffffffFFk", ".ffffffffff.", ".fkwffffwkf.", ".ffffFFffff.", ".fFkkkkkkFf.", ".fFkttttkFf.", "..fFkkkkFf..", "..bbbbbbbb..", "..ff.rk.ff..", "..ff.eu.ff..", "..ff....ff.."],
 'sword': ["......W", ".....WW", "....WW.", "...WW..", "G.WW...", ".GW....", "bGG....", "b......"],
 'star': ["...g...", "...g...", "ggyyygg", ".gyygg.", ".ggggg.", "gg...gg"],
 'receipt_dragon': ["....v...v...", "...vvv.vvv..", "..vvvvvvvvv.", "..vkwvvvkwv.", "..vvvvvvvvv.", "...vrrrrrv..", "..vvwcwcwvv.", ".vvvcccccvvv", "vvvvcckccvvv", "v.vvcccccvv.", "...vcccccv..", "...vv...vv.."],
}
SCALE = 8
manifest = []
for name, rows in S.items():
    w = max(len(r) for r in rows); h = len(rows)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            col = P.get(ch)
            if col: im.putpixel((x, y), tuple(int(col[i:i+2], 16) for i in (1, 3, 5)) + (255,))
    im = im.resize((w*SCALE, h*SCALE), Image.NEAREST)
    f = f'{name}.png'; im.save(os.path.join(OUT, f), optimize=True)
    manifest.append({'name': name, 'file': f'sprites/{f}', 'source': 'generated:tools/make_sprites.py', 'crop': None, 'use': name.replace('_', ' ')})

def frame(name, fill, border, inner, size=48, use=''):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, size-1, size-1], fill=P['k'])
    d.rectangle([3, 3, size-4, size-4], fill=border)
    d.rectangle([6, 6, size-7, size-7], fill=P['G'])
    d.rectangle([9, 9, size-10, size-10], fill=fill)
    for (x, y) in [(3, 3), (size-6, 3), (3, size-6), (size-6, size-6)]:
        d.rectangle([x, y, x+2, y+2], fill=inner)
    im.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    manifest.append({'name': name, 'file': f'sprites/{name}.png', 'source': 'generated:tools/make_sprites.py', 'crop': None, 'use': use})
frame('panel_frame', P['m'], P['g'], P['y'], use='9-slice gold frame (border-image, slice 12)')
frame('button', P['m'], P['g'], P['y'], use='9-slice maroon button (border-image, slice 12)')
frame('button_press', P['M'], P['G'], P['g'], use='pressed button state')
json.dump(manifest, open(os.path.join(HERE, 'generated_manifest.json'), 'w'), indent=1)
print('wrote', len(manifest), 'sprites')
