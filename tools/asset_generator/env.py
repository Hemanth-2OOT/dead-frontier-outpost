"""Seamless 32x32 terrain tiles, overlays and props."""
import math, random
from core import *
from buildings import bevel, plate, stripes, tline, weather

T = 32
def wpx(im, x, y, c): im.putpixel((x % im.width, y % im.height), c)
def wblob(im, cx, cy, r, c, rng, dens=.8):
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r and rng.random() < dens: wpx(im, cx + x, cy + y, c)
def fill(c): im = new(T, T); rect(im, 0, 0, T - 1, T - 1, c); return im
def noise_tile(base, cols, seed, n, blobs=None, bc=None):
    rng = random.Random(seed); im = fill(base)
    if blobs:
        for _ in range(blobs): wblob(im, rng.randrange(T), rng.randrange(T), rng.randint(3, 6), bc[rng.randrange(len(bc))], rng, .55)
    for _ in range(n): wpx(im, rng.randrange(T), rng.randrange(T), rng.choice(cols))
    return im, rng
def crack(im, rng, c=None, n=1, lo=5, hi=26):
    for _ in range(n):
        x, y = rng.randint(lo, hi), rng.randint(lo, hi); a = rng.random() * 6.28
        for _ in range(rng.randint(10, 18)):
            if lo <= x <= hi and lo <= y <= hi: px(im, x, y, c or C['conc_d']); px(im, x + 1, y + 1, C['conc_l']) if im.getpixel((min(x + 1, 31), min(y + 1, 31))) != (c or C['conc_d']) else None
            a += rng.uniform(-.7, .7); x += round(math.cos(a) * 1.3); y += round(math.sin(a) * 1.3)

def grass(v):
    im, rng = noise_tile(C['grass_m'], [C['grass_m']], 10 + v, 0, blobs=7, bc=[C['grass_d'], C['grass_l']])
    for _ in range(46 + v * 6):
        x, y = rng.randrange(T), rng.randrange(T); c = rng.choice((C['grass_l'], C['grass_d'], C['grass_d'], C['grass_h']))
        wpx(im, x, y, c); wpx(im, x, y - 1, mixc(c, 1.15)); 
        if rng.random() < .4: wpx(im, x + 1, y, c)
    for _ in range(3 + v): wpx(im, rng.randrange(T), rng.randrange(T), C['dirt_l'])
    return im
def dirt(v):
    im, rng = noise_tile(C['dirt_m'], [C['dirt_d'], C['dirt_l'], C['dirt_d'], C['dirt_m']], 20 + v, 180, blobs=8, bc=[C['dirt_d'], C['dirt_l']])
    for _ in range(5 + v * 2):
        x, y = rng.randrange(T), rng.randrange(T); wpx(im, x, y, C['conc_l']); wpx(im, x + 1, y, C['conc_m']); wpx(im, x, y + 1, C['dirt_d']); wpx(im, x + 1, y + 1, C['dirt_d'])
    return im
def concrete(v):
    im, rng = noise_tile(C['conc_m'], [C['conc_l'], C['conc_d'], C['conc_m'], C['conc_m']], 30 + v, 220, blobs=6, bc=[C['conc_l'], C['conc_d']])
    for _ in range(3): wblob(im, rng.randrange(T), rng.randrange(T), 4, mixc(C['conc_m'], .85), rng, .3)
    return im
def concrete_slab():
    im = concrete(2); rect(im, 0, 0, T - 1, 0, C['conc_d']); rect(im, 0, 0, 0, T - 1, C['conc_d']); rect(im, 1, 1, T - 1, 1, C['conc_l']); rect(im, 1, 1, 1, T - 1, C['conc_l']); return im
def asphalt(v=0):
    im, rng = noise_tile(C['asph_m'], [C['asph_l'], C['asph_d'], C['asph_h'], C['asph_m'], C['asph_d']], 40 + v, 260, blobs=7, bc=[C['asph_d'], C['asph_l']])
    return im
def cracked():
    im = concrete(3); rng = random.Random(51); crack(im, rng, n=3); 
    for _ in range(2): wblob(im, rng.randint(8, 24), rng.randint(8, 24), 2, C['conc_d'], rng, .7)
    return im
def industrial(v):
    im = fill(C['metal_m'])
    for y in range(T):
        for x in range(T):
            cell = ((x // 8) + (y // 8)) % 2; k = (x + y) % 4 if cell else (x - y) % 4
            if k == 0: im.putpixel((x, y), C['metal_l'])
            elif k == 1: im.putpixel((x, y), C['metal_d'])
    rng = random.Random(60 + v)
    if v:
        for _ in range(40): wpx(im, rng.randrange(T), rng.randrange(T), rng.choice((C['rust_m'], C['rust_d'])))
    return im
def grate():
    im = fill(C['asph_d'])
    for y in range(T):
        for x in range(T):
            if x % 4 in (0, 1) or y % 8 == 0: im.putpixel((x, y), C['metal_m'] if x % 4 == 0 and y % 8 else C['metal_l'] if y % 8 == 0 else C['metal_d'])
    for y in range(0, T, 8): rect(im, 0, y, T - 1, y, C['metal_l'])
    return im
def metal_floor(v):
    rng = random.Random(70 + v); im = fill(C['metal_m'])
    for y in range(T):
        for x in range(T):
            if (x % 16 == 0) or (y % 16 == 0): im.putpixel((x, y), C['metal_d'])
            elif (x % 16 == 1) or (y % 16 == 1): im.putpixel((x, y), C['metal_l'])
            elif (x % 16 == 15) or (y % 16 == 15): im.putpixel((x, y), mixc(C['metal_m'], .85))
    for ox in (0, 16):
        for oy in (0, 16):
            for (rx, ry) in ((3, 3), (12, 3), (3, 12), (12, 12)): wpx(im, ox + rx, oy + ry, C['metal_h']); wpx(im, ox + rx + 1, oy + ry + 1, C['metal_d'])
    for _ in range(60): wpx(im, rng.randrange(T), rng.randrange(T), rng.choice((C['metal_l'], C['metal_d'], C['rust_m'] if v else C['metal_m'])))
    if v:
        for _ in range(6): wblob(im, rng.randrange(T), rng.randrange(T), 3, rng.choice((C['rust_d'], C['rust_m'])), rng, .6)
    return im
def rubble():
    im = concrete(4); rng = random.Random(80)
    for _ in range(14):
        x, y = rng.randint(2, 26), rng.randint(2, 26); w, h = rng.randint(3, 6), rng.randint(2, 5)
        L = new(T, T); rect(L, x + 1, y + 1, x + w + 1, y + h + 1, C['conc_d']); rect(L, x, y, x + w, y + h, rng.choice((C['conc_l'], C['conc_h'], C['conc_m']))); corners(L, x, y, x + w, y + h); shade(L, 1.15, .75); im.alpha_composite(L)
    for _ in range(3): x, y = rng.randint(4, 24), rng.randint(4, 24); tline(im, x, y, x + rng.randint(-6, 6), y + rng.randint(3, 8), C['rust_m'], 1)
    return im
def road_mark(kind):
    im = asphalt(1)
    if kind == 'center_h': 
        for x0 in (2, 18): rect(im, x0, 14, x0 + 11, 15, C['road_y'])
    elif kind == 'center_v':
        for y0 in (2, 18): rect(im, 14, y0, 15, y0 + 11, C['road_y'])
    elif kind == 'edge_h': rect(im, 0, 5, T - 1, 6, C['road_w'])
    elif kind == 'edge_v': rect(im, 5, 0, 6, T - 1, C['road_w'])
    elif kind == 'crosswalk':
        for x in range(2, 30, 8): rect(im, x, 0, x + 4, T - 1, C['road_w'])
    elif kind == 'stop':
        rect(im, 0, 12, T - 1, 15, C['road_w'])
    rng = random.Random(90)
    for _ in range(40):
        x, y = rng.randrange(T), rng.randrange(T)
        if im.getpixel((x, y)) in (C['road_y'], C['road_w']): wpx(im, x, y, C['asph_l'])
    return im
def damaged_road(v):
    im = asphalt(2 + v); rng = random.Random(95 + v)
    if v == 1:
        for x0 in (2, 18): rect(im, x0, 14, x0 + 11, 15, C['road_y'])
        for _ in range(16): wpx(im, rng.randint(2, 29), rng.randint(14, 15), C['asph_m'])
    crack(im, rng, C['asph_d'], 3); 
    cx, cy = 14 + v * 3, 17 - v * 4
    ell(im, cx, cy, 5, 3, C['asph_d']); ell(im, cx, cy + 1, 4, 2, C['dirt_d']); ell(im, cx - 1, cy + 1, 2, 1, C['dirt_m'])
    for dx, dy in ((-6, -2), (6, -3), (-5, 3), (5, 3)): px(im, cx + dx, cy + dy, C['asph_h'])
    return im

def overlay(draw, w=T, h=T, seed=1, shadow=True):
    im = new(w, h); rng = random.Random(seed); draw(im, rng); outline(im); return im
def bush(v):
    def d(im, rng):
        cols = (C['grass_d'], C['grass_m'], C['grass_l'])
        for i in range(7):
            x, y, r = rng.randint(8, 22), rng.randint(9, 22), rng.randint(4, 6)
            part(im, lambda L: disc(L, x, y, r, cols[i % 3]))
        for _ in range(26):
            x, y = rng.randint(6, 25), rng.randint(6, 25)
            if im.getpixel((x, y))[3]: px(im, x, y, rng.choice((C['grass_h'], C['grass_d'])))
        if v:
            for _ in range(7): px(im, rng.randint(8, 23), rng.randint(8, 23), C['rust_h'])
    return overlay(d, seed=100 + v)
def bush_dead():
    def d(im, rng):
        for _ in range(11):
            x, y = 16, 16; a = rng.random() * 6.28; l = rng.randint(6, 12)
            tline(im, x, y, round(x + math.cos(a) * l), round(y + math.sin(a) * l), rng.choice((C['brown_m'], C['brown_l'], C['wood_d'])), 1)
        disc(im, 16, 16, 2, C['brown_d'])
    return overlay(d, seed=7)
def tuft(kind):
    def d(im, rng):
        for i in range(9 if kind == 'tall' else 6):
            x = 8 + i * (16 // 8) + rng.randint(-1, 1); l = rng.randint(7, 13) if kind == 'tall' else rng.randint(3, 6)
            for k in range(l): px(im, x + round(math.sin(i - 4 + k / 5) * k / 4), 26 - k, C['grass_l'] if k > l // 2 else C['grass_m'])
            px(im, x, 26, C['grass_d'])
    return overlay(d, seed=3)
def weeds():
    def d(im, rng):
        for _ in range(5):
            cx, cy = rng.randint(7, 24), rng.randint(9, 24)
            for k in range(5):
                a = k * 1.25 + rng.random(); tline(im, cx, cy, round(cx + math.cos(a) * 4), round(cy + math.sin(a) * 3), rng.choice((C['grass_l'], C['grass_h'], C['grass_d'])), 1)
    return overlay(d, seed=4)

def pile(w, h, seed, cols, n=26):
    im = new(w, h); rng = random.Random(seed)
    ell(im, w // 2, h // 2 + 2, w * .4, h * .3, (0, 0, 0, 90))
    for _ in range(n):
        x = int(w / 2 + rng.gauss(0, w * .17)); y = int(h / 2 + rng.gauss(0, h * .15)); sw, sh = rng.randint(2, 6), rng.randint(2, 4)
        L = new(w, h); rect(L, x, y, x + sw, y + sh, rng.choice(cols)); corners(L, x, y, x + sw, y + sh); shade(L); im.alpha_composite(L)
    for _ in range(3):
        x, y = int(w / 2 + rng.gauss(0, w * .12)), int(h / 2 + rng.gauss(0, h * .1)); a = rng.random() * 6.28
        tline(im, x, y, round(x + math.cos(a) * 8), round(y + math.sin(a) * 6), C['metal_h'], 1)
    outline(im); return im
def barrel(body, ring, band=None, seed=0):
    im = new(16, 16); rng = random.Random(seed)
    part(im, lambda L: disc(L, 8, 8, 6, body)); 
    disc(im, 8, 8, 4, mixc(body, .85)); 
    for a in range(12): px(im, round(8 + math.cos(a * math.pi / 6) * 5), round(8 + math.sin(a * math.pi / 6) * 5), ring)
    rect(im, 6, 6, 9, 9, mixc(body, .65)); px(im, 7, 7, C['metal_h']); px(im, 10, 11, C['metal_d'])
    if band: 
        for a in range(8): px(im, round(8 + math.cos(a * math.pi / 4) * 3), round(8 + math.sin(a * math.pi / 4) * 3), band)
    speckle(im, rng, [C['rust_m'], C['rust_d']], 8); outline(im); return im
def crate(size, wood=True, seed=0):
    im = new(size, size); rng = random.Random(seed); m = C['wood'] if wood else C['olive_m']
    plate(im, 1, 1, size - 2, size - 2, m, rng, rivets=size > 16, grain=.12)
    if wood:
        for k in range(4, size - 2, 4): rect(im, 2, k, size - 3, k, C['wood_d'])
        tline(im, 2, 2, size - 3, size - 3, C['wood_d'], 1); tline(im, size - 3, 2, 2, size - 3, C['wood_d'], 1)
        rect(im, 1, 1, size - 2, 2, C['brown_l']); rect(im, 1, 1, 2, size - 2, C['brown_l'])
    else:
        rect(im, 3, size // 2 - 2, size - 4, size // 2 + 1, C['tan_m']); rect(im, 3, size // 2 - 2, size - 4, size // 2 - 2, C['tan_l'])
        rect(im, size // 2 - 1, 3, size // 2, 5, C['metal_l']); rect(im, size // 2 - 1, size - 5, size // 2, size - 4, C['metal_l'])
        for x in range(4, size - 4, 3): px(im, x, size // 2, C['olive_d'])
    outline(im); return im
def sandbags(w, h, seed, rows=2):
    im = new(w, h); rng = random.Random(seed)
    for r in range(h // 6):
        off = 3 if r % 2 else 0
        for x in range(-off, w, 7):
            L = new(w, h); y = 1 + r * 6; rect(L, x, y, x + 6, y + 5, rng.choice((C['tan_m'], C['tan_l'], mixc(C['tan_m'], .85)))); corners(L, x, y, x + 6, y + 5); shade(L, 1.15, .7)
            rect(L, x + 2, y + 2, x + 4, y + 2, mixc(C['tan_m'], .7)); im.alpha_composite(L)
    outline(im); return im
def barrier(vertical=False, seed=0):
    im = new(32, 12); rng = random.Random(seed)
    plate(im, 1, 1, 30, 10, C['conc_l'], rng, rivets=False, grain=.1); rect(im, 2, 5, 29, 6, C['conc_m']); rect(im, 2, 4, 29, 4, C['conc_h'])
    for x in (2, 29): rect(im, x, 2, x, 9, C['conc_d'])
    for _ in range(4): px(im, rng.randint(3, 28), rng.randint(2, 9), C['conc_d'])
    px(im, 14, 1, C['rust_m']); px(im, 15, 0, C['rust_m']); stripes(im, 4, 8, 9, 9, C['road_w'], C['conc_d'], 2)
    outline(im); return transpose(im) if vertical else im
def machine(seed):
    im = new(32, 32); rng = random.Random(seed)
    plate(im, 3, 6, 20, 24, C['metal_m'], rng); plate(im, 6, 9, 16, 15, C['rust_m'], rng, rivets=False); disc(im, 24, 18, 5, C['metal_l']); disc(im, 24, 18, 3, C['asph_d'])
    for i in range(6): a = i * 1.05; px(im, round(24 + math.cos(a) * 3), round(18 + math.sin(a) * 3), C['metal_m'])
    tline(im, 20, 10, 30, 8, C['metal_h'], 2); tline(im, 6, 25, 14, 29, C['rust_m'], 2); vent(im, 6, 18, 14, 22)
    for x, y in ((12, 4), (26, 26), (8, 28)): px(im, x, y, C['fire_m'])
    speckle(im, rng, [C['asph_d']], 20); weather(im, rng, .06); outline(im); return im
def vent(im, x0, y0, x1, y1):
    rect(im, x0, y0, x1, y1, C['metal_d'])
    for y in range(y0 + 1, y1, 2): rect(im, x0 + 1, y, x1 - 1, y, C['metal_l'])
def streetlight():
    im = new(32, 32)
    part(im, lambda L: disc(L, 8, 24, 4, C['metal_m'])); disc(im, 8, 24, 2, C['metal_d']); px(im, 8, 24, C['metal_h'])
    part(im, lambda L: tline(L, 8, 24, 21, 11, C['metal_l'], 2)); 
    part(im, lambda L: rect(L, 19, 5, 28, 12, C['metal_m'])); rect(im, 21, 7, 26, 10, C['road_y']); rect(im, 21, 7, 22, 8, C['fire_w']); px(im, 25, 9, C['rust_m'])
    rect(im, 27, 11, 28, 12, C['metal_d']); outline(im); return im
def fence(vertical=False):
    im = new(32, 8); rng = random.Random(5)
    for x in range(1, 31):
        for y in (2, 3, 4, 5): 
            if (x + y) % 3 == 0: px(im, x, y, C['metal_l'])
            elif (x - y) % 3 == 0: px(im, x, y, C['metal_m'])
    rect(im, 1, 2, 30, 2, C['metal_l']); rect(im, 1, 5, 30, 5, C['metal_m'])
    for x in (1, 15, 29): rect(im, x, 1, x + 1, 6, C['metal_h']); rect(im, x + 1, 1, x + 1, 6, C['metal_d'])
    for _ in range(6): px(im, rng.randint(2, 29), rng.randint(2, 5), C['rust_m'])
    for x in range(8, 13): clr(im, x, 3); clr(im, x, 4)
    outline(im); return transpose(im) if vertical else im
def vehicle(kind, seed):
    W, H = 64, 32; im = new(W, H); rng = random.Random(seed)
    body, roof = {'car': (C['rust_m'], C['rust_l']), 'van': (C['cloth_gray'], C['cloth_gray']), 'jeep': (C['olive_d'], C['olive_m'])}[kind]
    if kind == 'jeep': body = mixc(body, .75)
    for x in (9, 42):
        for y in (2, 26): part(im, lambda L, x=x, y=y: rect(L, x, y, x + 11, y + 3, C['asph_d']))
    def shell(L): rect(L, 3, 5, 60, 26, body); corners(L, 3, 5, 60, 26); clr(L, 3, 6); clr(L, 60, 6); clr(L, 3, 25); clr(L, 60, 25)
    part(im, shell)
    if kind == 'car':
        part(im, lambda L: rect(L, 22, 8, 43, 23, roof)); rect(im, 43, 9, 47, 22, C['glass_d']); rect(im, 18, 10, 21, 21, C['glass_d']); rect(im, 44, 10, 46, 12, C['glass'])
        rect(im, 49, 8, 57, 23, mixc(body, 1.1)); tline(im, 51, 12, 55, 16, C['asph_d'], 1); rect(im, 24, 10, 41, 21, mixc(roof, .9))
    elif kind == 'van':
        part(im, lambda L: rect(L, 6, 7, 46, 24, roof)); rect(im, 47, 9, 52, 22, C['glass_d']); rect(im, 48, 10, 50, 12, C['glass']); rect(im, 53, 8, 59, 23, mixc(body, 1.1))
        for x in (14, 26, 38): rect(im, x, 8, x, 23, mixc(roof, .7))
        rect(im, 10, 11, 20, 16, C['rust_d'])
    else:
        part(im, lambda L: rect(L, 12, 8, 42, 23, C['asph_d'])); rect(im, 14, 10, 40, 21, C['smoke_d']); rect(im, 43, 9, 46, 22, C['glass_d']); rect(im, 47, 8, 57, 23, mixc(body, 1.1))
        disc(im, 8, 15, 4, C['asph_d']); disc(im, 8, 15, 2, C['metal_m']); rect(im, 22, 11, 26, 14, C['metal_m'])
    if kind != 'jeep': speckle(im, rng, [C['rust_d'], C['rust_h'], C['rust_l']], 70)
    else: speckle(im, rng, [C['asph_d'], C['smoke_d'], C['rust_d']], 90)
    for x, y in ((60, 8), (60, 23)): rect(im, x - 1, y, x, y + 1, C['road_y'] if kind != 'jeep' else C['rust_d'])
    for _ in range(5): rect(im, rng.randint(6, 56), rng.randint(6, 24), rng.randint(6, 56), rng.randint(6, 24), body) if False else None
    tline(im, rng.randint(24, 40), 6, rng.randint(24, 40), 12, C['outline'], 1)
    outline(im); return im

def stain(color, seed, size=32):
    im = new(size, size); rng = random.Random(seed)
    for i in range(7): ell(im, rng.randint(10, 22), rng.randint(10, 22), rng.randint(3, 7), rng.randint(2, 5), color)
    for _ in range(12): px(im, rng.randint(2, 29), rng.randint(2, 29), color)
    return im
def small_debris(kind):
    im = new(16, 16); rng = random.Random(len(kind) * 13)
    if kind == 'paper':
        for _ in range(4): x, y = rng.randint(2, 11), rng.randint(2, 11); rect(im, x, y, x + 3, y + 2, rng.choice((C['conc_h'], C['tan_l'], C['road_w']))); px(im, x + 1, y + 1, C['conc_m'])
    elif kind == 'scrap':
        for _ in range(7): x, y = rng.randint(2, 12), rng.randint(2, 12); rect(im, x, y, x + rng.randint(1, 3), y + rng.randint(0, 2), rng.choice((C['metal_l'], C['rust_m'], C['metal_m'])))
    elif kind == 'rubble':
        for _ in range(7): x, y = rng.randint(2, 11), rng.randint(2, 11); rect(im, x, y, x + rng.randint(1, 3), y + rng.randint(1, 2), rng.choice((C['conc_l'], C['conc_m'], C['conc_h'])))
    elif kind == 'glass':
        for _ in range(9): x, y = rng.randint(2, 13), rng.randint(2, 13); px(im, x, y, rng.choice((C['glass'], C['white'], C['glass_d']))); px(im, x + 1, y, C['glass'])
    elif kind == 'tire':
        disc(im, 8, 8, 6, C['asph_d']); disc(im, 8, 8, 3, C['smoke_m']); disc(im, 8, 8, 1, C['asph_d']); px(im, 5, 4, C['smoke_l']); px(im, 6, 3, C['smoke_l'])
    elif kind == 'planks':
        for i in range(3): tline(im, 2, 3 + i * 4, 13, 5 + i * 4 - (i % 2) * 2, rng.choice((C['wood'], C['brown_l'], C['wood_d'])), 2)
    if kind != 'glass': shade(im, 1.12, .78)
    outline(im); return im

def generate():
    cat = "environment"; tiles = []
    def tile(name, im, folder, use, tileable=True):
        reg_static(name, f"environment/{folder}/{name}.png", im, use, cat, (16, 16), extra=dict(tileable=tileable))
    for v in range(3): tile(f"grass_{v}", grass(v), "terrain", "Ground tile: grass (seamless)")
    for v in range(2): tile(f"dirt_{v}", dirt(v), "terrain", "Ground tile: dirt (seamless)")
    for v in range(2): tile(f"concrete_{v}", concrete(v), "terrain", "Ground tile: concrete (seamless)")
    tile("concrete_slab", concrete_slab(), "terrain", "Concrete with slab joints (joints are intentional on tile edges)")
    tile("asphalt", asphalt(0), "terrain", "Ground tile: asphalt (seamless)")
    tile("cracked_concrete", cracked(), "terrain", "Ground tile: cracked concrete")
    tile("industrial_floor_0", industrial(0), "terrain", "Diamond-plate industrial floor")
    tile("industrial_floor_1", industrial(1), "terrain", "Diamond-plate industrial floor, rusty")
    tile("industrial_grate", grate(), "terrain", "Drain/grate floor")
    tile("metal_floor_0", metal_floor(0), "terrain", "Metal panel floor"); tile("metal_floor_1", metal_floor(1), "terrain", "Metal panel floor, rusty")
    tile("rubble", rubble(), "terrain", "Rubble on concrete")
    for k in ('center_h', 'center_v', 'edge_h', 'edge_v', 'crosswalk', 'stop'): tile(f"road_{k}", road_mark(k), "roads", f"Road marking: {k}")
    tile("road_damaged_0", damaged_road(0), "roads", "Damaged road with pothole", False); tile("road_damaged_1", damaged_road(1), "roads", "Damaged road with centre line remnant", False)
    ov = lambda n, im, f, u: reg_static(n, f"environment/{f}/{n}.png", im, u, cat, (im.width // 2, im.height // 2), extra=dict(tileable=False))
    ov("bush_0", bush(0), "vegetation", "Overlay: bush"); ov("bush_1", bush(1), "vegetation", "Overlay: berry bush"); ov("bush_dead", bush_dead(), "vegetation", "Overlay: dead bush")
    ov("grass_tuft_tall", tuft('tall'), "vegetation", "Overlay: tall grass"); ov("grass_tuft_short", tuft('short'), "vegetation", "Overlay: short grass"); ov("weeds", weeds(), "vegetation", "Overlay: weeds")
    for k in ('paper', 'scrap', 'rubble', 'glass', 'tire', 'planks'): ov(f"debris_{k}", small_debris(k), "debris", f"Overlay: small debris ({k})")
    ov("stain_oil", stain((20, 20, 24, 170), 1), "debris", "Overlay: oil stain (semi-transparent)"); ov("stain_blood", stain((100, 20, 20, 190), 2), "debris", "Overlay: old blood stain (semi-transparent)")
    ov("barrel_rust", barrel(C['rust_m'], C['rust_l'], seed=1), "props", "Prop: rusty barrel"); ov("barrel_green", barrel(C['olive_m'], C['olive_h'], seed=2), "props", "Prop: military barrel")
    ov("barrel_toxic", barrel(C['road_y'], C['rust_h'], C['asph_d'], seed=3), "props", "Prop: toxic barrel")
    ov("scrap_pile_0", pile(32, 32, 1, [C['metal_m'], C['rust_m'], C['metal_l'], C['rust_d'], C['metal_d']]), "props", "Prop: scrap pile")
    ov("scrap_pile_1", pile(32, 32, 2, [C['rust_l'], C['rust_m'], C['metal_m'], C['conc_m'], C['metal_d']], 34), "props", "Prop: scrap pile (large)")
    ov("sandbags_corner", sandbags(32, 32, 1), "props", "Prop: sandbag stack"); ov("sandbags_line", sandbags(32, 12, 2), "props", "Prop: sandbag line (horizontal)")
    ov("concrete_barrier_h", barrier(False, 1), "props", "Prop: concrete barrier (horizontal)"); ov("concrete_barrier_v", barrier(True, 1), "props", "Prop: concrete barrier (vertical)")
    ov("ruined_machine_0", machine(1), "props", "Prop: ruined machinery"); ov("ruined_machine_1", machine(2), "props", "Prop: ruined machinery")
    ov("streetlight", streetlight(), "props", "Prop: streetlight"); ov("fence_h", fence(False), "props", "Prop: chain-link fence (horizontal)"); ov("fence_v", fence(True), "props", "Prop: chain-link fence (vertical)")
    ov("crate_wood_s", crate(16, True, 1), "props", "Prop: wooden crate small"); ov("crate_wood_l", crate(32, True, 2), "props", "Prop: wooden crate large")
    ov("military_box_s", crate(16, False, 3), "props", "Prop: military supply box small"); ov("military_box_l", crate(32, False, 4), "props", "Prop: military supply box large")
    ov("car_wreck", vehicle('car', 1), "props", "Prop: wrecked car"); ov("van_wreck", vehicle('van', 2), "props", "Prop: wrecked van"); ov("jeep_burnt", vehicle('jeep', 3), "props", "Prop: burnt military jeep")
