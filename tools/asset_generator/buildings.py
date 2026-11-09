"""Buildings (top-down, light from top-left). 64x64 unless noted."""
import math, random
from core import *

def bevel(im, x0, y0, x1, y1, base, hi=1.25, lo=.7):
    rect(im, x0, y0, x1, y1, base)
    rect(im, x0, y0, x1, y0, mixc(base, hi)); rect(im, x0, y0, x0, y1, mixc(base, hi))
    rect(im, x0, y1, x1, y1, mixc(base, lo)); rect(im, x1, y0, x1, y1, mixc(base, lo))
def plate(im, x0, y0, x1, y1, base, rng, rivets=True, grain=.06):
    bevel(im, x0, y0, x1, y1, base)
    n = int((x1 - x0) * (y1 - y0) * grain)
    for _ in range(n):
        x, y = rng.randint(x0 + 1, x1 - 1), rng.randint(y0 + 1, y1 - 1); px(im, x, y, mixc(base, rng.choice((.85, 1.12))))
    if rivets:
        for x, y in ((x0 + 2, y0 + 2), (x1 - 2, y0 + 2), (x0 + 2, y1 - 2), (x1 - 2, y1 - 2)):
            px(im, x, y, mixc(base, 1.45)); px(im, x + 1, y + 1, mixc(base, .55))
def stripes(im, x0, y0, x1, y1, a=C['road_y'], b=C['metal_d'], k=3):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1): px(im, x, y, a if ((x + y) // k) % 2 == 0 else b)
def tline(im, x0, y0, x1, y1, c, t=2):
    for o in range(t): line(im, x0, y0 + o, x1, y1 + o, c)
def pad(im, x0, y0, x1, y1, rng, base=None):
    plate(im, x0, y0, x1, y1, base or C['conc_m'], rng, rivets=False, grain=.12)
    for _ in range(6):
        x, y = rng.randint(x0 + 3, x1 - 8), rng.randint(y0 + 3, y1 - 3); line(im, x, y, x + rng.randint(2, 5), y + rng.randint(-1, 1), C['conc_d'])
def vent(im, x0, y0, x1, y1):
    rect(im, x0, y0, x1, y1, C['metal_d'])
    for y in range(y0 + 1, y1, 2): rect(im, x0 + 1, y, x1 - 1, y, C['metal_l'])
def fan(im, cx, cy, r, ang, blades=4):
    disc(im, cx, cy, r, C['metal_d']); disc(im, cx, cy, r - 2, C['asph_d'])
    for b in range(blades):
        a = ang + b * 2 * math.pi / blades
        for k in range(1, r - 2):
            x = round(cx + math.cos(a) * k); y = round(cy + math.sin(a) * k)
            px(im, x, y, C['metal_l']); px(im, x + 1, y, C['metal_m']); px(im, x, y + 1, C['metal_m'])
    disc(im, cx, cy, 2, C['metal_h']); px(im, cx, cy, C['metal_d'])
    for i in range(12):
        a = i * math.pi / 6; px(im, round(cx + math.cos(a) * r), round(cy + math.sin(a) * r), C['metal_l'])
def weather(im, rng, amt=.04):
    w, h = im.size; m = mask_of(im)
    for _ in range(int(w * h * amt)):
        x, y = rng.randrange(w), rng.randrange(h)
        if not m[y][x]: continue
        edge = not (0 < y < h - 1 and 0 < x < w - 1 and m[y + 1][x] and m[y][x + 1])
        px(im, x, y, rng.choice((C['rust_m'], C['rust_d'], C['rust_l'])) if edge or rng.random() < .35 else mixc(im.getpixel((x, y)), .8))

def damage(src, seed, heavy=1):
    im = src.copy(); rng = random.Random(seed); w, h = im.size; m = mask_of(src)
    pts = [(x, y) for y in range(h) for x in range(w) if m[y][x]]
    for _ in range(3 + 2 * heavy):
        cx, cy = rng.choice(pts); r = rng.randint(3, 6)
        for y in range(cy - r, cy + r + 1):
            for x in range(cx - r, cx + r + 1):
                if 0 <= x < w and 0 <= y < h and m[y][x] and (x - cx) ** 2 + (y - cy) ** 2 <= r * r and rng.random() < .75: px(im, x, y, mixc(im.getpixel((x, y)), .5))
    for _ in range(4):
        cx, cy = rng.choice(pts)
        for _ in range(10):
            x, y = cx + rng.randint(-3, 3), cy + rng.randint(-3, 3)
            if 0 <= x < w and 0 <= y < h and m[y][x]: px(im, x, y, rng.choice((C['rust_m'], C['rust_l'], C['rust_d'])))
    for _ in range(3 + heavy):
        x, y = rng.choice(pts)
        for _ in range(rng.randint(12, 22)):
            if 0 <= x < w and 0 <= y < h and m[y][x]: px(im, x, y, C['outline'])
            x += rng.choice((-1, 0, 1, 1)); y += rng.choice((-1, 0, 1, 1))
    edge = [(x, y) for (x, y) in pts if any(not (0 <= x + dx < w and 0 <= y + dy < h and m[y + dy][x + dx]) for dx, dy in ((3, 0), (-3, 0), (0, 3), (0, -3)))]
    for _ in range(6 + 3 * heavy):
        cx, cy = rng.choice(edge)
        for y in range(cy - 1, cy + 2):
            for x in range(cx - 1, cx + 2):
                if rng.random() < .8: clr(im, x, y)
    for _ in range(2):
        cx, cy = rng.choice(pts); rect(im, cx, cy, cx + 2, cy + 1, C['outline'])
    for _ in range(3):
        cx, cy = rng.choice(pts)
        if m[cy][cx]: px(im, cx, cy, C['fire_m']); px(im, cx + 1, cy, C['fire_d'])
    return im
def ruin(w, h, seed, cols, scale=1.0):
    im = new(w, h); rng = random.Random(seed); cx, cy = w // 2, h // 2
    ell(im, cx, cy, w * .42, h * .42, C['asph_d']); ell(im, cx - 2, cy - 2, w * .33, h * .33, C['smoke_d'])
    for _ in range(int(w * h / 55 * scale)):
        x = int(cx + rng.gauss(0, w * .2)); y = int(cy + rng.gauss(0, h * .2)); sw, sh = rng.randint(2, 6), rng.randint(2, 5)
        L = new(w, h); rect(L, x, y, x + sw, y + sh, rng.choice(cols)); corners(L, x, y, x + sw, y + sh); shade(L); im.alpha_composite(L)
    for _ in range(4):
        x, y = int(cx + rng.gauss(0, w * .15)), int(cy + rng.gauss(0, h * .15)); a = rng.random() * 6.28; l = rng.randint(8, 16)
        tline(im, x, y, int(x + math.cos(a) * l), int(y + math.sin(a) * l), rng.choice((C['metal_m'], C['rust_m'])), 2)
    for _ in range(int(w * h / 300)):
        x, y = int(cx + rng.gauss(0, w * .18)), int(cy + rng.gauss(0, h * .18)); px(im, x, y, C['fire_m']); px(im, x + 1, y, C['fire_l'])
    outline(im); return im

# ---------------------------------------------------------------- individual buildings
def b_scrap_collector(frame=0):
    im = new(64, 64); rng = random.Random(101)
    pad(im, 2, 2, 61, 61, rng); stripes(im, 2, 2, 61, 5); stripes(im, 2, 58, 61, 61)
    plate(im, 5, 9, 17, 54, C['metal_m'], rng)
    rect(im, 7, 11, 15, 52, C['metal_d'])
    for y in range(11 + (frame % 4), 53, 4): rect(im, 7, y, 15, y, C['metal_l'])
    for y in (16, 27, 40):
        for x in range(8, 15, 2):
            if rng.random() < .8: px(im, x, y + (frame % 3), rng.choice((C['rust_m'], C['rust_l'], C['metal_h'])))
    plate(im, 21, 11, 57, 53, C['olive_m'], rng)
    disc(im, 38, 32, 15, C['metal_l']); disc(im, 38, 32, 13, C['metal_d']); disc(im, 38, 32, 11, C['asph_d'])
    for i in range(14):
        a = i * 2.4; r = rng.uniform(3, 9); px(im, round(38 + math.cos(a) * r), round(32 + math.sin(a) * r), rng.choice((C['rust_m'], C['rust_l'], C['metal_m'], C['rust_d'])))
    for i in range(16):
        a = i * math.pi / 8; px(im, round(38 + math.cos(a) * 14), round(32 + math.sin(a) * 14), C['metal_h'])
    ang = frame * math.pi / 8
    for b in range(4):
        a = ang + b * math.pi / 2
        ex, ey = 38 + math.cos(a) * 11, 32 + math.sin(a) * 11
        tline(im, 38, 32, round(ex), round(ey), C['metal_h'], 2); disc(im, round(ex), round(ey), 2, C['rust_l'])
    disc(im, 38, 32, 3, C['metal_m']); disc(im, 38, 32, 1, C['metal_h'])
    plate(im, 50, 24, 61, 40, C['metal_m'], rng); rect(im, 52, 28, 61, 36, C['metal_d'])
    vent(im, 24, 14, 32, 18); vent(im, 24, 46, 32, 50)
    px(im, 54, 14, C['energy_l'] if frame % 2 == 0 else C['energy_d']); px(im, 55, 14, C['energy_d']); px(im, 54, 15, C['energy_d'])
    weather(im, rng, .05); outline(im); return im

def b_generator(frame=0):
    im = new(64, 64); rng = random.Random(202)
    plate(im, 2, 2, 61, 61, C['metal_d'], rng, grain=.1)
    plate(im, 5, 8, 40, 42, C['olive_m'], rng)
    for i, x in enumerate((9, 18, 27)):
        plate(im, x, 12, x + 8, 22, C['metal_m'], rng, rivets=False); disc(im, x + 4, 17, 2, C['metal_h']); px(im, x + 4, 17, C['metal_d'])
        plate(im, x, 27, x + 8, 37, C['metal_m'], rng, rivets=False); disc(im, x + 4, 32, 2, C['metal_h']); px(im, x + 4, 32, C['metal_d'])
    for x in (5, 36): stripes(im, x, 42, x + 4, 46)
    plate(im, 44, 8, 60, 24, C['metal_m'], rng); fan(im, 52, 16, 6, frame * math.pi / 8 * 1.0)
    plate(im, 44, 28, 60, 42, C['asph_m'], rng, rivets=False)
    glow = (C['energy_l'], C['energy_d'], C['energy_l'], C['energy_l'])[frame % 4]
    for x in range(46, 59, 4): rect(im, x, 31, x + 2, 39, glow); rect(im, x, 31, x + 2, 31, C['metal_h'])
    plate(im, 6, 47, 36, 60, C['rust_m'], rng); rect(im, 8, 49, 34, 49, C['rust_l']); rect(im, 8, 55, 34, 55, C['rust_d'])
    disc(im, 14, 53, 3, C['metal_l']); disc(im, 14, 53, 1, C['metal_d']); rect(im, 22, 51, 32, 57, C['road_y']); rect(im, 22, 51, 32, 51, C['rust_l']); px(im, 25, 54, C['metal_d']); px(im, 29, 54, C['metal_d'])
    for x in (42, 50):
        rect(im, x, 47, x + 3, 60, C['metal_l']); rect(im, x, 47, x, 60, C['metal_h']); rect(im, x + 3, 47, x + 3, 60, C['metal_d']); rect(im, x, 47, x + 3, 49, C['smoke_d'])
    tline(im, 40, 25, 44, 26, C['outline'], 1); tline(im, 40, 44, 44, 32, C['rust_d'], 1)
    weather(im, rng, .05); outline(im); return im

def b_ammo_factory(frame=0):
    im = new(96, 96); rng = random.Random(303)
    pad(im, 2, 2, 93, 93, rng, C['conc_d'])
    plate(im, 5, 6, 58, 60, C['olive_m'], rng)
    for x in range(10, 54, 11): rect(im, x, 8, x, 58, C['olive_d']); rect(im, x + 1, 8, x + 1, 58, C['olive_l'])
    vent(im, 8, 12, 20, 18); vent(im, 38, 12, 50, 18); vent(im, 8, 46, 20, 54)
    plate(im, 24, 24, 42, 42, C['metal_m'], rng); disc(im, 33, 33, 6, C['metal_d']); disc(im, 33, 33, 4, C['metal_m']); px(im, 33, 33, C['rust_l'])
    plate(im, 62, 8, 91, 60, C['metal_m'], rng)
    rect(im, 66, 12, 87, 22, C['metal_d']); rect(im, 66, 12, 87, 12, C['metal_l'])
    py = 24 + (0, 6, 12, 6)[frame % 4]
    rect(im, 72, 22, 81, py, C['metal_h']); rect(im, 72, 22, 72, py, C['metal_h']); rect(im, 81, 22, 81, py, C['metal_l']); rect(im, 69, py, 84, py + 5, C['rust_m']); rect(im, 69, py, 84, py, C['rust_l'])
    rect(im, 66, 42, 87, 56, C['asph_d']); rect(im, 66, 56, 87, 56, C['metal_l']); stripes(im, 62, 8, 65, 60)
    px(im, 88, 14, C['energy_l'] if frame % 2 == 0 else C['fire_m']); px(im, 89, 14, C['energy_d'])
    plate(im, 4, 66, 91, 84, C['metal_d'], rng, grain=.02)
    for x in range(6 + (frame * 5) % 10, 90, 10): rect(im, x, 67, x, 83, C['metal_m'])
    for x in range(12 + frame * 5, 80, 20):
        plate(im, x, 70, x + 10, 80, C['tan_m'], rng, rivets=False); rect(im, x + 2, 73, x + 8, 73, C['rust_m'])
        for k in range(3): rect(im, x + 2 + k * 3, 75, x + 3 + k * 3, 78, C['rust_h'])
    stripes(im, 4, 86, 91, 91)
    for (x, y) in ((8, 63), (86, 63)): disc(im, x, y, 1, C['metal_h'])
    rect(im, 40, 3, 52, 6, C['metal_l']); rect(im, 41, 3, 51, 3, C['metal_h']); rect(im, 41, 5, 51, 6, C['smoke_m'])
    for k in range(5): rect(im, 44 + k, 3 - 0, 44 + k, 4, C['smoke_d'])
    weather(im, rng, .045); outline(im); return im

def mg_base():
    im = new(64, 64); rng = random.Random(404)
    disc(im, 32, 32, 29, C['conc_d']); disc(im, 32, 32, 27, C['metal_m']); disc(im, 32, 32, 22, C['metal_d']); disc(im, 32, 32, 20, C['conc_m'])
    for i in range(8):
        a = i * math.pi / 4 + math.pi / 8; x, y = round(32 + math.cos(a) * 24.5), round(32 + math.sin(a) * 24.5)
        disc(im, x, y, 1, C['metal_h']); px(im, x + 1, y + 1, C['metal_d'])
    for a in (math.pi / 4, 3 * math.pi / 4, 5 * math.pi / 4, 7 * math.pi / 4):
        x, y = round(32 + math.cos(a) * 17), round(32 + math.sin(a) * 17); rect(im, x - 2, y - 2, x + 2, y + 2, C['rust_m']); rect(im, x - 2, y - 2, x + 2, y - 2, C['rust_l']); px(im, x, y, C['metal_d'])
    speckle(im, rng, [C['conc_l'], C['conc_d']], 80)
    plate(im, 44, 42, 58, 56, C['olive_m'], rng); rect(im, 47, 47, 55, 47, C['tan_l']); rect(im, 47, 50, 53, 50, C['tan_l'])
    for x in (46, 52): rect(im, x, 52, x + 1, 54, C['rust_h'])
    disc(im, 32, 32, 11, C['metal_l']); disc(im, 32, 32, 9, C['metal_d'])
    weather(im, rng, .04); outline(im); return im

def mg_barrel(recoil=0):
    im = new(64, 64); r = recoil
    rect(im, 44 - r, 29, 62 - r, 34, C['metal_d'])
    for x in range(46 - r, 60 - r, 2): rect(im, x, 29, x, 34, C['metal_m']); rect(im, x + 1, 29, x + 1, 30, C['metal_h'])
    rect(im, 59 - r, 28, 62 - r, 35, C['metal_m']); rect(im, 60 - r, 29, 61 - r, 34, C['asph_d'])
    # feed belt
    for i in range(7): rect(im, 18 + i * 2, 39 + (i % 2), 19 + i * 2, 40 + (i % 2), C['rust_h'])
    def body(L):
        rect(L, 17 - r // 2, 24, 42 - r // 2, 40, C['olive_m']); corners(L, 17 - r // 2, 24, 42 - r // 2, 40)
    def bd(L):
        rect(L, 20 - r // 2, 27, 38 - r // 2, 29, C['metal_m']); vent(L, 21 - r // 2, 33, 30 - r // 2, 37)
    part(im, body, bd)
    part(im, lambda L: rect(L, 38 - r, 20, 43 - r, 44, C['metal_m']))
    rect(im, 40 - r, 28, 41 - r, 35, C['asph_d'])
    part(im, lambda L: rect(L, 24, 19, 32, 24, C['metal_l']))
    rect(im, 31, 20, 31, 22, C['glass']); px(im, 25, 20, C['metal_h'])
    px(im, 19, 26, C['fire_m']); disc(im, 20, 32, 3, C['metal_l']); disc(im, 20, 32, 1, C['metal_d'])
    outline(im); return im

def cannon_base():
    im = new(64, 64); rng = random.Random(505)
    pts = [(32 + math.cos(i * math.pi / 4 + math.pi / 8) * 30, 32 + math.sin(i * math.pi / 4 + math.pi / 8) * 30) for i in range(8)]
    L = Image.new("L", (64, 64), 0); ImageDraw.Draw(L).polygon(pts, fill=255)
    for y in range(64):
        for x in range(64):
            if L.getpixel((x, y)): im.putpixel((x, y), C['metal_d'])
    for y in range(64):
        for x in range(64):
            if im.getpixel((x, y))[3] and math.hypot(x - 32, y - 32) < 27: im.putpixel((x, y), C['conc_d'] if math.hypot(x - 32, y - 32) > 22 else C['metal_m'])
    for i in range(8):
        a = i * math.pi / 4; x, y = round(32 + math.cos(a) * 25), round(32 + math.sin(a) * 25)
        plate(im, x - 2, y - 2, x + 2, y + 2, C['rust_m'], rng, rivets=False)
    disc(im, 32, 32, 18, C['metal_m']); disc(im, 32, 32, 16, C['metal_d'])
    for i in range(16): a = i * math.pi / 8; px(im, round(32 + math.cos(a) * 17), round(32 + math.sin(a) * 17), C['metal_h'])
    stripes(im, 4, 29, 8, 35); stripes(im, 56, 29, 60, 35)
    for (x, y) in ((10, 10), (53, 10), (10, 53), (53, 53)): rect(im, x, y, x + 1, y + 1, C['rust_h'])
    plate(im, 46, 48, 58, 58, C['olive_m'], rng); rect(im, 48, 51, 56, 51, C['tan_l']); rect(im, 48, 54, 54, 54, C['rust_l'])
    speckle(im, rng, [C['conc_l'], C['conc_d']], 60); weather(im, rng, .04); outline(im); return im

def cannon_barrel(recoil=0):
    im = new(64, 64); r = recoil
    def barrel(L):
        rect(L, 32 - r, 28, 58 - r, 36, C['metal_m']); rect(L, 54 - r, 26, 61 - r, 38, C['metal_m'])
    def bd(L):
        for x in range(36 - r, 53 - r, 5): rect(L, x, 28, x, 36, C['metal_d'])
        rect(L, 56 - r, 30, 60 - r, 34, C['asph_d']); rect(L, 57 - r, 26, 57 - r, 38, C['metal_l']); rect(L, 33 - r, 29, 52 - r, 29, C['metal_h'])
    part(im, barrel, bd)
    def tur(L): disc(L, 28, 32, 15, C['olive_m']); rect(L, 12, 24, 22, 40, C['olive_m'])
    def td(L):
        disc(L, 28, 32, 11, C['olive_d']); disc(L, 28, 32, 9, C['olive_m'])
        rect(L, 21, 30, 33, 34, C['metal_d']); disc(L, 25, 24, 3, C['metal_m']); px(L, 25, 24, C['glass'])
        rect(L, 8, 28, 12, 36, C['rust_m']); rect(L, 8, 28, 12, 28, C['rust_l'])
        for i in range(8): a = i * math.pi / 4; px(L, round(28 + math.cos(a) * 14), round(32 + math.sin(a) * 14), C['metal_h'])
        px(L, 28, 32, C['rust_h'])
    part(im, tur, td)
    outline(im); return im

def b_repair(frame=0):
    im = new(64, 64); rng = random.Random(606)
    pad(im, 2, 2, 61, 61, rng); stripes(im, 2, 2, 61, 4, C['road_y']); stripes(im, 2, 59, 61, 61)
    stripes(im, 2, 2, 4, 61); stripes(im, 59, 2, 61, 61)
    disc(im, 32, 34, 20, C['metal_d']); disc(im, 32, 34, 18, C['metal_m']); disc(im, 32, 34, 15, C['conc_m'])
    rect(im, 28, 25, 36, 43, C['road_w']); rect(im, 23, 30, 41, 38, C['road_w']); rect(im, 29, 26, 35, 42, C['blood_l']); rect(im, 24, 31, 40, 37, C['blood_l'])
    for i in range(12): a = i * math.pi / 6; px(im, round(32 + math.cos(a) * 19), round(34 + math.sin(a) * 19), C['metal_h'])
    plate(im, 5, 6, 17, 18, C['metal_m'], rng); disc(im, 11, 12, 3, C['metal_h']); disc(im, 11, 12, 1, C['metal_d'])
    sw = (-12, 0, 12, 0)[frame % 4] * math.pi / 180 + math.pi / 4
    ex, ey = 11 + math.cos(sw) * 30, 12 + math.sin(sw) * 30
    tline(im, 11, 12, round(ex * .55 + 11 * .45), round(ey * .55 + 12 * .45), C['road_y'], 3)
    mx, my = round(11 + math.cos(sw) * 16), round(12 + math.sin(sw) * 16)
    tline(im, mx, my, round(11 + math.cos(sw) * 27), round(12 + math.sin(sw) * 27), C['metal_l'], 2)
    tx, ty = round(11 + math.cos(sw) * 28), round(12 + math.sin(sw) * 28); disc(im, tx, ty, 3, C['metal_m']); disc(im, tx, ty, 1, C['energy_l'] if frame % 2 == 0 else C['energy_d'])
    if frame % 2 == 0:
        for dx, dy in ((4, 2), (-3, 4), (5, -3)): px(im, tx + dx, ty + dy, C['fire_h'])
    plate(im, 48, 8, 59, 22, C['olive_m'], rng); rect(im, 51, 12, 56, 12, C['tan_l']); rect(im, 51, 16, 56, 16, C['tan_l'])
    plate(im, 46, 50, 59, 58, C['rust_m'], rng, rivets=False); rect(im, 48, 52, 52, 53, C['metal_h']); rect(im, 54, 52, 57, 56, C['metal_l'])
    px(im, 8, 56, C['energy_l'] if frame < 2 else C['energy_d']); px(im, 11, 56, C['fire_m'] if frame >= 2 else C['fire_d'])
    weather(im, rng, .04); outline(im); return im

def b_wall():
    im = new(64, 64); rng = random.Random(707)
    plate(im, 2, 2, 61, 61, C['metal_m'], rng, grain=.03)
    plate(im, 7, 7, 56, 56, C['conc_m'], rng, rivets=False, grain=.12)
    for k in range(7, 57, 7): rect(im, 7, k, 56, k, C['conc_d']); rect(im, 7, k + 1, 56, k + 1, C['conc_l'])
    for k, row in enumerate(range(7, 57, 7)):
        for x in range(10 + (k % 2) * 8, 56, 16): rect(im, x, row, x, row + 6, C['conc_d'])
    for a in ((10, 10, 53, 53), (53, 10, 10, 53)): tline(im, *a, C['rust_d'], 2); tline(im, a[0], a[1] - 1, a[2], a[3] - 1, C['rust_m'], 1)
    for x, y in ((4, 4), (59, 4), (4, 59), (59, 59), (32, 4), (32, 59), (4, 32), (59, 32)): disc(im, x, y, 1, C['metal_h']); px(im, x + 1, y + 1, C['metal_d'])
    stripes(im, 2, 2, 12, 5); stripes(im, 51, 58, 61, 61); stripes(im, 2, 58, 12, 61); stripes(im, 51, 2, 61, 5)
    speckle(im, rng, [C['conc_h'], C['conc_d']], 120)
    weather(im, rng, .03); outline(im); return im

def b_mine(frame=0):
    im = new(32, 32); rng = random.Random(808)
    for i in range(10):
        a = i * math.pi / 5; x, y = 16 + math.cos(a) * 12, 16 + math.sin(a) * 12
        tline(im, 16, 16, round(x), round(y), C['metal_m'], 2)
    disc(im, 16, 16, 11, C['olive_d']); disc(im, 16, 16, 9, C['olive_m']); disc(im, 16, 16, 6, C['metal_m']); disc(im, 16, 16, 4, C['metal_l'])
    rect(im, 14, 13, 17, 18, C['metal_d']); rect(im, 13, 15, 18, 16, C['metal_d'])
    for i in range(10): a = i * math.pi / 5 + .3; px(im, round(16 + math.cos(a) * 11), round(16 + math.sin(a) * 11), C['road_y'])
    px(im, 16, 16, C['blood_l'] if frame == 0 else C['blood_d']); px(im, 17, 16, C['blood_m'] if frame == 0 else C['blood_d'])
    shade(im); speckle(im, rng, [C['rust_m'], C['rust_d']], 12); outline(im); return im

# ---------------------------------------------------------------- generation
SPECS = {  # name: (fn, frames, folder, kind)
 'scrap_collector': (b_scrap_collector, 4), 'generator': (b_generator, 4), 'ammo_factory': (b_ammo_factory, 4),
 'repair_station': (b_repair, 4), 'mine': (b_mine, 2)}
USE = {'scrap_collector': 'Mines/collects scrap from nearby deposits', 'generator': 'Produces power', 'ammo_factory': 'Converts metal to ammunition',
       'repair_station': 'Repairs nearby structures', 'wall': 'Defensive wall block', 'mine': 'Proximity trap'}

def generate():
    for name, (fn, n) in SPECS.items():
        folder = f"buildings/{name}"; sd = "spritesheets/buildings"; base = fn(0); w, h = base.size
        reg_static(name, f"{folder}/{name}_normal.png", base, USE[name], "buildings", (w // 2, h // 2), extra=dict(state="normal"))
        reg_anim(name, folder, sd, [fn(i) for i in range(n)], "active", 150 if name != 'mine' else 500, "none", (w // 2, h // 2), USE[name] + " (working animation)", "buildings")
        if name != 'mine':
            dm = damage(base, sum(map(ord, name)) % 1000 + len(name), 1); outline(dm)
            reg_static(name, f"{folder}/{name}_damaged.png", dm, USE[name] + " (damaged)", "buildings", (w // 2, h // 2), extra=dict(state="damaged"))
            cols = [C['metal_m'], C['rust_m'], C['conc_m'], C['metal_d'], C['olive_m'], C['rust_d']]
            reg_static(name, f"{folder}/{name}_destroyed.png", ruin(w, h, len(name) * 7, cols), USE[name] + " (destroyed)", "buildings", (w // 2, h // 2), extra=dict(state="destroyed"))
        else:
            reg_static(name, f"{folder}/{name}_triggered.png", ruin(32, 32, 9, [C['dirt_m'], C['dirt_d'], C['metal_m'], C['rust_m']], .6), "Mine after detonation (crater)", "buildings", (16, 16), extra=dict(state="destroyed"))
    # wall
    wall = b_wall(); folder = "buildings/wall"
    reg_static('wall', f"{folder}/wall_normal.png", wall, USE['wall'], "buildings", (32, 32), extra=dict(state="normal"))
    d1 = damage(wall, 31, 1); outline(d1); reg_static('wall', f"{folder}/wall_damaged.png", d1, USE['wall'] + " (damaged)", "buildings", (32, 32), extra=dict(state="damaged"))
    d2 = damage(wall, 32, 3); outline(d2); reg_static('wall', f"{folder}/wall_critical.png", d2, USE['wall'] + " (heavily damaged)", "buildings", (32, 32), extra=dict(state="critical"))
    reg_static('wall', f"{folder}/wall_destroyed.png", ruin(64, 64, 33, [C['conc_m'], C['conc_d'], C['conc_l'], C['rust_m'], C['metal_m']]), USE['wall'] + " (rubble)", "buildings", (32, 32), extra=dict(state="destroyed"))
    # turrets
    for name, base, barrel, rc, role in (('machine_gun_turret', mg_base, mg_barrel, (3, 2, 1), 'Machine gun'), ('cannon_turret', cannon_base, cannon_barrel, (5, 3, 1), 'Cannon')):
        folder = f"buildings/{name}"; b = base(); rb = barrel(0)
        reg_static(name, f"{folder}/{name}_base.png", b, f"{role} turret static base (does not rotate)", "buildings", (32, 32), extra=dict(state="normal", part="base"))
        reg_static(name, f"{folder}/{name}_barrel.png", rb, f"{role} turret rotating head+barrel, faces EAST (+X); rotate around pivot", "buildings", (32, 32), extra=dict(state="normal", part="barrel", faces="east"))
        reg_anim(name, folder, "spritesheets/buildings", [barrel(r) for r in rc] + [barrel(0)], "recoil", 50, "none", (32, 32), f"{role} barrel recoil one-shot (faces east, rotate in Godot)", "buildings", loop=False)
        d = damage(b, len(name), 1); outline(d); reg_static(name, f"{folder}/{name}_base_damaged.png", d, f"{role} turret damaged base", "buildings", (32, 32), extra=dict(state="damaged", part="base"))
        db = damage(rb, len(name) + 5, 1); outline(db); reg_static(name, f"{folder}/{name}_barrel_damaged.png", db, f"{role} turret damaged barrel", "buildings", (32, 32), extra=dict(state="damaged", part="barrel"))
        reg_static(name, f"{folder}/{name}_destroyed.png", ruin(64, 64, len(name) * 3, [C['metal_m'], C['rust_m'], C['conc_d'], C['metal_d'], C['olive_m']]), f"{role} turret wreck (hide barrel)", "buildings", (32, 32), extra=dict(state="destroyed", part="base"))
