"""Industrial military UI assets (kept separate from world sprites)."""
import math, random
from core import *
from buildings import bevel, tline, stripes

def icon(fn):
    im = new(32, 32); fn(im); outline(im); return im
def P_(im, shape, detail=None): part(im, shape, detail)

def i_scrap(im):
    rng = random.Random(3)
    for x, y, w, h, c in ((6, 18, 12, 8, 'metal_m'), (14, 14, 11, 9, 'rust_m'), (9, 10, 9, 7, 'metal_l'), (18, 20, 8, 6, 'rust_l'), (12, 5, 6, 6, 'rust_d')):
        P_(im, lambda L, x=x, y=y, w=w, h=h, c=c: (rect(L, x, y, x + w, y + h, C[c]), corners(L, x, y, x + w, y + h)))
    tline(im, 5, 8, 12, 14, C['metal_h'], 1); tline(im, 24, 12, 27, 22, C['metal_h'], 1); px(im, 20, 22, C['metal_d']); px(im, 11, 22, C['metal_d'])
def i_metal(im):
    for y, x in ((20, 4), (13, 8), (6, 6)):
        P_(im, lambda L, x=x, y=y: rect(L, x, y, x + 20, y + 6, C['metal_l']), lambda L, x=x, y=y: (rect(L, x + 2, y + 2, x + 18, y + 3, C['metal_h']), rect(L, x + 14, y + 4, x + 19, y + 5, C['metal_m'])))
def i_fuel(im):
    P_(im, lambda L: (rect(L, 7, 9, 24, 27, C['olive_m']), corners(L, 7, 9, 24, 27)), lambda L: (rect(L, 9, 14, 22, 15, C['olive_d']), rect(L, 9, 21, 22, 22, C['olive_d']), tline(L, 9, 14, 21, 22, C['olive_l'], 1)))
    P_(im, lambda L: rect(L, 10, 4, 14, 9, C['metal_l'])); P_(im, lambda L: (rect(L, 16, 5, 23, 8, C['metal_m']), rect(L, 16, 8, 18, 12, C['metal_m'])), None); rect(im, 17, 6, 22, 6, C['metal_d'])
    rect(im, 12, 17, 18, 19, C['rust_h']); px(im, 15, 16, C['rust_h'])
def i_ammo(im):
    for x in (5, 13, 21):
        P_(im, lambda L, x=x: (rect(L, x, 12, x + 5, 27, C['rust_h']), rect(L, x, 6 + 0, x + 5, 12, C['metal_m']), clr(L, x, 6), clr(L, x + 5, 6), clr(L, x, 7), clr(L, x + 5, 7)), lambda L, x=x: (rect(L, x, 24, x + 5, 25, C['rust_m']), rect(L, x + 1, 13, x + 1, 22, C['fire_h'])))
def i_health(im):
    P_(im, lambda L: (rect(L, 4, 4, 27, 27, C['white']), corners(L, 4, 4, 27, 27)), None)
    rect(im, 13, 7, 18, 24, C['blood_l']); rect(im, 7, 13, 24, 18, C['blood_l']); rect(im, 13, 7, 18, 7, C['fire_l']); rect(im, 7, 13, 7, 18, C['fire_l']); rect(im, 18, 18, 24, 18, C['blood_m'])
def i_wave(im):
    P_(im, lambda L: (disc(L, 16, 13, 10, C['zomb_p']), rect(L, 10, 20, 21, 27, C['zomb_p']), corners(L, 10, 20, 21, 27)))
    rect(im, 9, 11, 14, 16, C['asph_d']); rect(im, 18, 11, 23, 16, C['asph_d']); px(im, 11, 12, C['fire_m']); px(im, 20, 12, C['fire_m']); rect(im, 15, 17, 16, 19, C['asph_d'])
    for x in range(12, 21, 2): rect(im, x, 23, x, 26, C['asph_d'])
def i_mg(im):
    P_(im, lambda L: (rect(L, 3, 12, 22, 16, C['metal_m']), rect(L, 22, 13, 29, 14, C['metal_l']), rect(L, 9, 16, 12, 24, C['metal_d']), rect(L, 15, 16, 18, 21, C['metal_d'])))
    rect(im, 3, 11, 12, 11, C['metal_h']); rect(im, 4, 13, 20, 13, C['metal_l']); rect(im, 3, 17, 7, 20, C['wood']); rect(im, 24, 11, 26, 12, C['metal_m'])
    for x in range(8, 16, 2): rect(im, x + 5, 25, x + 5, 25, C['rust_h']) if False else None
def i_cannon(im):
    P_(im, lambda L: (tline(L, 7, 22, 25, 8, C['metal_m'], 6), disc(L, 10, 23, 5, C['wood'])), lambda L: (disc(L, 10, 23, 2, C['wood_d']), tline(L, 24, 6, 27, 4, C['metal_h'], 1)))
    disc(im, 22, 22, 4, C['metal_d']); disc(im, 22, 22, 2, C['metal_l'])
def i_generator(im):
    P_(im, lambda L: (rect(L, 4, 5, 27, 27, C['metal_m']), corners(L, 4, 5, 27, 27)))
    rect(im, 7, 8, 24, 24, C['asph_d'])
    for (x, y) in ((17, 9), (14, 13), (18, 13), (11, 17), (15, 17), (13, 21)): pass
    pts = [(17, 9), (11, 17), (15, 17), (13, 24), (21, 14), (17, 14)]
    for a, b in zip(pts, pts[1:] + pts[:1]): line(im, a[0], a[1], b[0], b[1], C['energy_l'])
    rect(im, 14, 14, 16, 15, C['energy_l'])
def i_factory(im):
    P_(im, lambda L: (rect(L, 3, 14, 28, 27, C['olive_m']), corners(L, 3, 14, 28, 27), rect(L, 21, 4, 25, 14, C['metal_m'])))
    rect(im, 5, 17, 9, 20, C['asph_d']); rect(im, 12, 17, 16, 20, C['asph_d']); stripes(im, 3, 25, 28, 27); rect(im, 21, 3, 25, 4, C['smoke_l'])
    P_(im, lambda L: (rect(L, 9, 21, 12, 25, C['rust_h']), rect(L, 9, 19, 12, 21, C['metal_m'])), None)
def i_repair(im):
    P_(im, lambda L: (tline(L, 7, 25, 22, 10, C['metal_l'], 4), disc(L, 23, 9, 6, C['metal_l'])), lambda L: (clr(L, 24, 3), clr(L, 24, 4), clr(L, 25, 5), clr(L, 26, 6)))
    disc(im, 8, 25, 2, C['metal_d']); rect(im, 22, 4, 27, 8, CLEAR); px(im, 7, 26, C['ui_accent']); tline(im, 9, 23, 20, 12, C['metal_h'], 1)
    rect(im, 4, 3, 9, 5, C['blood_l']); rect(im, 6, 1, 7, 7, C['blood_l'])
def i_wall(im):
    P_(im, lambda L: rect(L, 3, 5, 28, 27, C['conc_m']))
    for y in (11, 17, 23): rect(im, 3, y, 28, y, C['conc_d'])
    for r, y in enumerate((5, 12, 18, 24)):
        for x in range(3 + (r % 2) * 6, 29, 12): rect(im, x, y, x, y + 5, C['conc_d'])
    for x, y in ((6, 8), (18, 14), (10, 20), (22, 26)): px(im, x, y, C['conc_h'])
def i_mine(im):
    for i in range(8): a = i * math.pi / 4; tline(im, 16, 16, round(16 + math.cos(a) * 13), round(16 + math.sin(a) * 13), C['metal_m'], 2)
    P_(im, lambda L: disc(L, 16, 16, 10, C['olive_m'])); disc(im, 16, 16, 6, C['metal_m']); disc(im, 16, 16, 3, C['blood_l']); px(im, 15, 15, C['fire_h'])
def i_build(im):
    P_(im, lambda L: (tline(L, 7, 26, 20, 13, C['wood'], 3)), None)
    P_(im, lambda L: (rect(L, 14, 4, 27, 11, C['metal_m'])), lambda L: (rect(L, 15, 5, 26, 5, C['metal_h']), rect(L, 24, 6, 26, 10, C['metal_d'])))
    tline(im, 8, 25, 18, 15, C['brown_l'], 1)
def i_remove(im):
    P_(im, lambda L: (tline(L, 6, 6, 25, 25, C['blood_l'], 4), tline(L, 25, 6, 6, 25, C['blood_l'], 4)))
    tline(im, 7, 6, 24, 23, C['fire_m'], 1)
def i_upgrade(im):
    for y, c in ((5, 'ui_good'), (14, 'ui_good'), (22, 'energy_l')):
        P_(im, lambda L, y=y, c=c: ([rect(L, 16 - k, y + k, 16 + k, y + k + 2, C[c]) for k in range(0, 9)]), None)
        rect(im, 12, y + 7, 20, y + 9, CLEAR) if False else None
def i_collector(im):
    P_(im, lambda L: (rect(L, 4, 18, 27, 27, C['olive_m']), corners(L, 4, 18, 27, 27)))
    P_(im, lambda L: [rect(L, 5 + k, 4 + k, 26 - k, 5 + k, C['metal_l']) for k in range(0, 13)], None)
    rect(im, 12, 17, 19, 19, C['asph_d']); disc(im, 16, 24, 3, C['metal_d']); disc(im, 16, 24, 1, C['metal_h']); px(im, 10, 8, C['rust_l']); px(im, 20, 9, C['rust_m']); px(im, 15, 12, C['rust_h'])

ICONS = dict(scrap=i_scrap, metal=i_metal, fuel=i_fuel, ammunition=i_ammo, health=i_health, wave=i_wave, machine_gun=i_mg, cannon=i_cannon,
             generator=i_generator, ammo_factory=i_factory, repair_station=i_repair, walls=i_wall, mine=i_mine, build=i_build, remove=i_remove,
             upgrade=i_upgrade, scrap_collector=i_collector)
SEL = ['machine_gun', 'cannon', 'generator', 'ammo_factory', 'repair_station', 'walls', 'mine', 'scrap_collector']

def panel(w, h, base=None, border=None, seed=1):
    im = new(w, h); rng = random.Random(seed); base = base or C['ui_panel']
    rect(im, 0, 0, w - 1, h - 1, C['outline']); bevel(im, 1, 1, w - 2, h - 2, C['ui_border']); bevel(im, 3, 3, w - 4, h - 4, base, 1.2, .75)
    for _ in range(w * h // 18): px(im, rng.randint(4, w - 5), rng.randint(4, h - 5), mixc(base, rng.choice((.9, 1.1))))
    for x, y in ((2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)): px(im, x, y, C['metal_h']); px(im, x + 0, y + 1, C['metal_d']) if y < h - 4 else None
    corners(im, 0, 0, w - 1, h - 1); return im
def button(state, w=48, h=24):
    base = {'normal': C['ui_panel_l'], 'hover': mixc(C['ui_panel_l'], 1.3), 'pressed': mixc(C['ui_panel'], .8), 'disabled': mixc(C['ui_panel'], .9)}[state]
    im = new(w, h); rect(im, 0, 0, w - 1, h - 1, C['outline']); corners(im, 0, 0, w - 1, h - 1)
    if state == 'pressed': bevel(im, 1, 1, w - 2, h - 2, base, .75, 1.2)
    else: bevel(im, 1, 1, w - 2, h - 2, base, 1.3, .7)
    if state == 'hover': rect(im, 2, h - 3, w - 3, h - 3, C['ui_accent'])
    if state == 'disabled':
        for y in range(2, h - 2):
            for x in range(2, w - 2):
                if (x + y) % 4 == 0: px(im, x, y, mixc(base, .8))
    return im
def slot(selected):
    im = panel(40, 40, C['ui_bg'] if not selected else mixc(C['ui_panel_l'], .8), seed=5)
    if selected:
        for i in range(2, 38): 
            for (x, y) in ((i, 1), (i, 38), (1, i), (38, i)): px(im, x, y, C['ui_accent'])
    return im
def select_tile(size, f):
    im = new(size, size); c = C['ui_accent']; k = size // 4 + (f // 2); o = f % 2
    for (x0, y0, sx, sy) in ((o, o, 1, 1), (size - 1 - o, o, -1, 1), (o, size - 1 - o, 1, -1), (size - 1 - o, size - 1 - o, -1, -1)):
        for i in range(k): px(im, x0 + sx * i, y0, c); px(im, x0, y0 + sy * i, c); px(im, x0 + sx * i, y0 + sy, mixc(c, .6)) if i else None
    return im
def placement(size, ok):
    im = new(size, size); col = C['ui_good'] if ok else C['ui_bad']
    for y in range(size):
        for x in range(size):
            edge = x in (0, size - 1) or y in (0, size - 1)
            if edge: im.putpixel((x, y), (*col[:3], 255))
            elif x in (1, size - 2) or y in (1, size - 2): im.putpixel((x, y), (*col[:3], 160))
            else: im.putpixel((x, y), (*col[:3], 70 if (x + y) % 4 else 105))
    if not ok:
        for i in range(size // 3, size - size // 3): px(im, i, i, (255, 220, 210, 230)); px(im, size - 1 - i, i, (255, 220, 210, 230)); px(im, i + 1, i, (255, 220, 210, 230)); px(im, size - 2 - i, i, (255, 220, 210, 230))
    else:
        pts = [(size // 2 - 5, size // 2), (size // 2 - 2, size // 2 + 3), (size // 2 + 5, size // 2 - 4)]
        for a, b in zip(pts, pts[1:]): line(im, a[0], a[1], b[0], b[1], (230, 255, 220, 230)); line(im, a[0], a[1] + 1, b[0], b[1] + 1, (230, 255, 220, 230))
    return im

def generate():
    cat = "ui"
    for n, fn in ICONS.items(): reg_static(f"icon_{n}", f"ui/icons/icon_{n}.png", icon(fn), f"UI icon: {n.replace('_', ' ')}", cat, (16, 16))
    for n in SEL:
        base = icon(ICONS[n])
        for sel in (False, True):
            s = slot(sel); s.alpha_composite(base, (4, 4)); reg_static(f"select_{n}{'_selected' if sel else ''}", f"ui/icons/select_{n}{'_selected' if sel else ''}.png", s, f"Building selection slot: {n}", cat, (20, 20))
    reg_static("panel_small", "ui/panels/panel_small.png", panel(32, 32), "9-slice panel, margin 5px", cat, (16, 16), extra=dict(nine_slice=5))
    reg_static("panel_medium", "ui/panels/panel_medium.png", panel(64, 48, seed=2), "9-slice panel, margin 5px", cat, (32, 24), extra=dict(nine_slice=5))
    reg_static("panel_dark", "ui/panels/panel_dark.png", panel(32, 32, C['ui_bg'], seed=3), "9-slice dark panel (tooltips), margin 5px", cat, (16, 16), extra=dict(nine_slice=5))
    h = panel(64, 16, mixc(C['ui_accent'], .55), seed=4); stripes(h, 4, 12, 59, 12, C['road_y'], C['asph_d'], 2)
    reg_static("panel_header", "ui/panels/panel_header.png", h, "Panel header bar", cat, (32, 8))
    for s in ('normal', 'hover', 'pressed', 'disabled'): reg_static(f"button_{s}", f"ui/buttons/button_{s}.png", button(s), f"9-slice button ({s}), margin 4px", cat, (24, 12), extra=dict(nine_slice=4))
    reg_anim("tile_select", "ui/buttons", "ui/buttons", [select_tile(32, i) for i in range(4)], "pulse", 150, "none", (16, 16), "1-tile selection cursor", cat)
    reg_anim("tile_select_2x2", "ui/buttons", "ui/buttons", [select_tile(64, i) for i in range(4)], "pulse", 150, "none", (32, 32), "2x2 selection cursor (64px buildings)", cat)
    for size in (32, 64):
        for ok in (True, False): reg_static(f"placement_{'valid' if ok else 'invalid'}_{size}", f"ui/buttons/placement_{'valid' if ok else 'invalid'}_{size}.png", placement(size, ok), f"Placement overlay ({'valid' if ok else 'invalid'}) for {size}px footprint", cat, (size // 2, size // 2))
