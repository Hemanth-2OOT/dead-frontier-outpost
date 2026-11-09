"""Core helpers for the DEAD FRONTIER: OUTPOST procedural asset generator.
Deterministic: every random source is a seeded random.Random."""
import os, json, math, random
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.environ.get(
    "DF_ROOT", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "DEAD_FRONTIER_ASSETS")))

# ---------------------------------------------------------------- palette
PAL_GROUPS = {
 "Terrain: grass": {'grass_d':'#2c3a1d','grass_m':'#41562a','grass_l':'#5a7234','grass_h':'#7a8f42'},
 "Terrain: dirt": {'dirt_d':'#392a1c','dirt_m':'#574129','dirt_l':'#75583a','dirt_h':'#917350'},
 "Concrete and stone": {'conc_d':'#46494a','conc_m':'#666a69','conc_l':'#868983','conc_h':'#a5a79c'},
 "Asphalt and road paint": {'asph_d':'#1d1f21','asph_m':'#2b2e31','asph_l':'#3a3e42','asph_h':'#4c5156','road_y':'#c8a024','road_w':'#cdcdc0'},
 "Metal and machinery": {'metal_d':'#262a2d','metal_m':'#434a4f','metal_l':'#68737a','metal_h':'#929fa5'},
 "Rust and damage": {'rust_d':'#582a13','rust_m':'#88491e','rust_l':'#b3662a','rust_h':'#d6893c'},
 "Olive and brown (clothing, crates)": {'olive_d':'#27311f','olive_m':'#3c4a2e','olive_l':'#566643','olive_h':'#73845a',
        'brown_d':'#352417','brown_m':'#573e28','brown_l':'#7a5836','tan_m':'#8b7550','tan_l':'#ad966a','wood':'#6c4b2c','wood_d':'#47301b'},
 "Survivor skin": {'skin_d':'#8f6b4d','skin_m':'#c29873','skin_l':'#dcb591'},
 "Zombie skin": {'zomb_d':'#44523b','zomb_m':'#6f8059','zomb_l':'#93a37a','zomb_p':'#a8a890'},
 "Zombie clothing": {'cloth_blue_d':'#3c4a5a','cloth_blue':'#566b80','cloth_red':'#74413b','cloth_red_d':'#4e2a27','cloth_gray':'#6b6e6c','cloth_gray_d':'#484b4a'},
 "Blood and ichor": {'blood_d':'#45100f','blood_m':'#7a1a19','blood_l':'#ae2b25','ichor':'#4e5e1c'},
 "Fire and explosion": {'fire_d':'#6e1c0b','fire_m':'#c0410f','fire_l':'#f08c1e','fire_h':'#ffd24a','fire_w':'#fff4b8'},
 "Smoke": {'smoke_d':'#2a2b2c','smoke_m':'#4b4c4e','smoke_l':'#74757a','smoke_h':'#a2a3a6'},
 "Energy and glass": {'energy_d':'#2f8a67','energy_l':'#7fe3b4','glass':'#5f8d9c','glass_d':'#2c4650'},
 "UI": {'ui_bg':'#171a1c','ui_panel':'#262c30','ui_panel_l':'#364046','ui_border':'#5b676d','ui_text':'#d9dacf',
        'ui_accent':'#d6893c','ui_good':'#6bae3a','ui_bad':'#c13a2b','ui_dim':'#7b8489'},
 "Outline": {'outline':'#13151a','white':'#f2f2e6'},
}
PAL = {k: v for g in PAL_GROUPS.values() for k, v in g.items()}
def hexrgba(h, a=255): h = h.lstrip('#'); return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), a)
C = {k: hexrgba(v) for k, v in PAL.items()}
CLEAR = (0, 0, 0, 0)

# ---------------------------------------------------------------- primitives
def new(w, h): return Image.new("RGBA", (w, h), CLEAR)
def px(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height: im.putpixel((x, y), c)
def get(im, x, y): return im.getpixel((x, y)) if 0 <= x < im.width and 0 <= y < im.height else CLEAR
def rect(im, x0, y0, x1, y1, c):
    for y in range(max(0, y0), min(im.height - 1, y1) + 1):
        for x in range(max(0, x0), min(im.width - 1, x1) + 1): im.putpixel((x, y), c)
def ell(im, cx, cy, rx, ry, c):
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            if ((x - cx) / (rx + .35)) ** 2 + ((y - cy) / (ry + .35)) ** 2 <= 1: px(im, x, y, c)
def disc(im, cx, cy, r, c): ell(im, cx, cy, r, r, c)
def line(im, x0, y0, x1, y1, c):
    dx, dy = abs(x1 - x0), -abs(y1 - y0); sx = 1 if x0 < x1 else -1; sy = 1 if y0 < y1 else -1; e = dx + dy
    while True:
        px(im, x0, y0, c)
        if x0 == x1 and y0 == y1: break
        e2 = 2 * e
        if e2 >= dy: e += dy; x0 += sx
        if e2 <= dx: e += dx; y0 += sy
def clr(im, x, y): px(im, x, y, CLEAR)
def clr_rect(im, x0, y0, x1, y1): rect(im, x0, y0, x1, y1, CLEAR)
def corners(im, x0, y0, x1, y1):
    for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)): clr(im, x, y)
def mixc(c, k): return (max(0, min(255, int(c[0]*k))), max(0, min(255, int(c[1]*k))), max(0, min(255, int(c[2]*k))), c[3])
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))
def tint(im, col, amt):
    o = im.copy(); p = o.load()
    for y in range(o.height):
        for x in range(o.width):
            if p[x, y][3]: p[x, y] = lerp(p[x, y], col + (255,) if len(col) == 3 else col, amt)
    return o
def flip_h(im): return im.transpose(Image.FLIP_LEFT_RIGHT)
def flip_v(im): return im.transpose(Image.FLIP_TOP_BOTTOM)
def transpose(im): return im.transpose(Image.TRANSPOSE)

def shade(im, hi=1.22, lo=0.74):
    """Light from top-left: top/left silhouette edge pixels lighter, bottom/right darker."""
    src = im.copy(); sp = src.load(); dp = im.load(); w, h = im.size
    op = lambda x, y: 0 <= x < w and 0 <= y < h and sp[x, y][3] > 0
    for y in range(h):
        for x in range(w):
            p = sp[x, y]
            if not p[3]: continue
            if not op(x, y + 1) or not op(x + 1, y): dp[x, y] = mixc(p, lo)
            elif not op(x, y - 1) or not op(x - 1, y): dp[x, y] = mixc(p, hi)
def outline(im, col=None):
    col = col or C['outline']; src = im.copy(); sp = src.load(); dp = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w):
            if sp[x, y][3]: continue
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                if 0 <= x+dx < w and 0 <= y+dy < h and sp[x+dx, y+dy][3] > 0: dp[x, y] = col; break
def part(base, shape, detail=None, sh=True):
    L = new(*base.size); shape(L)
    if sh: shade(L)
    if detail: detail(L)
    base.alpha_composite(L)
def mask_of(im): return [[im.getpixel((x, y))[3] > 0 for x in range(im.width)] for y in range(im.height)]
def speckle(im, rng, cols, n, mask_only=True, size=1):
    for _ in range(n):
        x, y = rng.randrange(im.width), rng.randrange(im.height)
        if mask_only and get(im, x, y)[3] == 0: continue
        c = rng.choice(cols)
        for i in range(size):
            for j in range(size):
                if not mask_only or get(im, x+i, y+j)[3]: px(im, x+i, y+j, c)

# ---------------------------------------------------------------- saving / manifest
MAN = []
def _abs(rel): return os.path.join(ROOT, rel)
def save(im, rel):
    p = _abs(rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p); return rel
def sheet_of(frames):
    w, h = frames[0].size; s = new(w * len(frames), h)
    for i, f in enumerate(frames): s.paste(f, (i * w, 0))
    return s
def reg_static(name, rel, im, use, cat, pivot=None, direction="none", extra=None):
    save(im, rel); w, h = im.size
    d = dict(name=name, category=cat, kind="static", file=rel, frame_files=[rel], frame_width=w, frame_height=h, frames=1,
             animation="static", frame_duration_ms=0, direction=direction, pivot=list(pivot or (w // 2, h // 2)), use=use)
    if extra: d.update(extra)
    MAN.append(d); return d
def reg_anim(name, folder, sheet_dir, frames, anim, dur, direction, pivot, use, cat, loop=True):
    base = f"{name}_{anim}" + ("" if direction == "none" else f"_{direction}")
    files = [save(f, f"{folder}/{base}_{i:02d}.png") for i, f in enumerate(frames)]
    sheet = save(sheet_of(frames), f"{sheet_dir}/{base}.png"); w, h = frames[0].size
    d = dict(name=name, category=cat, kind="animation", file=sheet, frame_files=files, frame_width=w, frame_height=h,
             frames=len(frames), animation=anim, frame_duration_ms=dur, direction=direction, pivot=list(pivot), use=use, loop=loop)
    MAN.append(d); return d
def write_manifest():
    save_path = _abs("docs/manifest.json"); os.makedirs(os.path.dirname(save_path), exist_ok=True)
    json.dump(dict(project="DEAD FRONTIER: OUTPOST", version=1, assets=MAN), open(save_path, "w"), indent=1)

# ---------------------------------------------------------------- previews
def contact(items, cols, scale=2, pad=4, label=True, bg=(34, 38, 41, 255), cellw=None, cellh=None):
    """items: list of (label, image). Nearest-neighbour scaled contact sheet."""
    sc = [(l, im.resize((im.width * scale, im.height * scale), Image.NEAREST)) for l, im in items]
    cw = cellw or max(i.width for _, i in sc); ch = cellh or max(i.height for _, i in sc); th = 10 if label else 0
    rows = (len(sc) + cols - 1) // cols
    out = Image.new("RGBA", (cols * (cw + pad) + pad, rows * (ch + th + pad) + pad), bg); d = ImageDraw.Draw(out)
    for n, (l, im) in enumerate(sc):
        x = pad + (n % cols) * (cw + pad); y = pad + (n // cols) * (ch + th + pad)
        d.rectangle([x, y + th, x + cw - 1, y + th + ch - 1], fill=(48, 53, 57, 255))
        out.alpha_composite(im, (x, y + th))
        if label: d.text((x + 1, y), l[:int(cw / 5.5)], fill=(200, 205, 190, 255))
    return out
