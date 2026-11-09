"""Procedural humanoid sprite renderer (32x32, light from top-left, bottom-centre pivot)."""
import math
from core import *

DIRS = ['down', 'up', 'left', 'right']
PIVOT = (16, 27)

def P(**kw):
    d = dict(bob=0, lean=0, leg=(0, 0), lift=(0, 0), arm=(0, 0), reach=0, flash=0, recoil=0, reload=None, gy=0,
             tintc=None, tinta=0, hdy=0)
    d.update(kw); return d

GUN = (C['metal_d'], C['metal_m'], C['metal_l'])
STYLES = {
 'player': dict(skin=C['skin_m'], shirt=C['olive_m'], sleeve=C['olive_m'], pants=C['brown_m'], boots=C['brown_d'],
    vest=C['brown_l'], head='helmet', helmet=C['olive_l'], pack=C['brown_l'], pack2=C['olive_d'], gun=True,
    tw=10, tws=7, th=9, lw=4, ll=6, aw=3, hr=4, hdy=0, lean=0, reach=0, amp=2, zombie=False, marks=[]),
 'walker': dict(skin=C['zomb_m'], shirt=C['cloth_blue'], sleeve=C['cloth_blue_d'], pants=C['brown_m'], boots=C['metal_d'],
    vest=None, head='hair', helmet=C['brown_d'], pack=None, pack2=None, gun=False,
    tw=10, tws=7, th=9, lw=4, ll=6, aw=3, hr=4, hdy=1, lean=1, reach=2, amp=1, zombie=True,
    marks=[(2, 2, C['zomb_m']), (3, 2, C['zomb_m']), (3, 3, C['zomb_d']), (6, 5, C['blood_m']), (7, 5, C['blood_l']), (6, 6, C['blood_d']), (1, 7, C['zomb_m']), (8, 6, C['zomb_m'])]),
 'runner': dict(skin=C['zomb_p'], shirt=C['cloth_red'], sleeve=C['cloth_red_d'], pants=C['cloth_gray_d'], boots=C['rust_d'],
    vest=None, head='hood', helmet=C['cloth_red_d'], pack=None, pack2=None, gun=False,
    tw=8, tws=5, th=9, lw=3, ll=7, aw=2, hr=3, hdy=1, lean=2, reach=3, amp=3, zombie=True,
    marks=[(1, 3, C['zomb_p']), (2, 3, C['zomb_p']), (5, 5, C['blood_l']), (4, 6, C['blood_m']), (6, 2, C['cloth_red_d'])]),
 'brute': dict(skin=C['zomb_d'], shirt=C['olive_d'], sleeve=C['zomb_d'], pants=C['cloth_gray_d'], boots=C['metal_d'],
    vest=C['metal_m'], head='plate', helmet=C['metal_m'], pack=None, pack2=None, gun=False,
    tw=16, tws=12, th=10, lw=6, ll=6, aw=5, hr=5, hdy=0, lean=0, reach=1, amp=1, zombie=True,
    marks=[(3, 3, C['rust_m']), (4, 3, C['rust_l']), (11, 6, C['blood_m']), (12, 7, C['blood_d']), (7, 8, C['rust_d']), (13, 2, C['zomb_m'])]),
}
EYE = (236, 226, 130, 255)

def _head(im, st, cx, cy, view, pose):
    hr = st['hr']; kind = st['head']
    part(im, lambda L: disc(L, cx, cy, hr, st['skin']))
    if view == 'back':
        if kind == 'helmet':
            part(im, lambda L: (disc(L, cx, cy, hr, st['helmet']), rect(L, cx - hr, cy + 1, cx + hr, cy + 1, C['olive_d'])))
        elif kind == 'plate':
            part(im, lambda L: (disc(L, cx, cy, hr, st['skin']), rect(L, cx - 2, cy - hr + 1, cx + 1, cy + 1, st['helmet'])))
        else:
            part(im, lambda L: disc(L, cx, cy, hr, st['helmet']))
        return
    if kind == 'helmet':
        def hs(L):
            disc(L, cx, cy - 1, hr, st['helmet'])
            for y in range(cy + 1, cy + hr + 2): rect(L, cx - hr - 1, y, cx + hr + 1, y, CLEAR)
        part(im, hs)
        rect(im, cx - hr + 1, cy, cx + hr - 1, cy + 1, C['glass_d']); px(im, cx - 1, cy, C['glass']); px(im, cx + 2, cy, C['glass'])
        rect(im, cx - hr + 1, cy + 2, cx + hr - 1, cy + hr, C['olive_d'])
    elif kind == 'plate':
        part(im, lambda L: rect(L, cx - 3, cy - hr + 1, cx + 2, cy - 1, st['helmet']))
        px(im, cx - 2, cy + 1, EYE); px(im, cx + 1, cy + 1, EYE); rect(im, cx - 2, cy + 3, cx + 1, cy + 3, C['blood_d'])
        px(im, cx - 1, cy + 3, C['zomb_p']); px(im, cx + 1, cy - 2, C['rust_l'])
    else:
        def hs(L):
            disc(L, cx, cy - 1, hr, st['helmet'])
            for y in range(cy + (1 if kind == 'hair' else 0), cy + hr + 2): rect(L, cx - hr - 1, y, cx + hr + 1, y, CLEAR)
        part(im, hs)
        ey = cy + 1; ex = (cx - 2, cx + 1) if hr >= 4 else (cx - 1, cx + 1)
        for x in ex: px(im, x, ey, EYE); px(im, x, ey - 1, C['outline'])
        rect(im, cx - 1, cy + hr - 1, cx + 1, cy + hr - 1, C['blood_d'])
        if st['zombie']: px(im, cx, cy + hr - 1, C['zomb_p'])

def _marks(im, st, ox, oy, wmax):
    for dx, dy, c in st['marks']:
        if dx < wmax: px(im, ox + dx, oy + dy, c)

def hum_fb(st, pose, back):
    im = new(32, 32); sg = -1 if back else 1
    tw, th, lw, ll, aw, hr = (st[k] for k in ('tw', 'th', 'lw', 'll', 'aw', 'hr'))
    x0 = 16 - tw // 2; x1 = x0 + tw - 1; ty = 12
    lean = pose['lean'] + st['lean']; dy = pose['bob'] + sg * lean
    reach = (st['reach'] + pose['reach']) if st['zombie'] else 0
    if st['pack'] and not back:
        part(im, lambda L: rect(L, x0 + 1, ty - 2 + dy, x1 - 1, ty + 6 + dy, st['pack']))
    for i, lx in enumerate((x0 + 1, x1 - lw + 1)):
        bot = min(28, 27 + pose['leg'][i] * sg - pose['lift'][i])
        part(im, lambda L, lx=lx, bot=bot: rect(L, lx, 19, lx + lw - 1, bot, st['pants']))
        part(im, lambda L, lx=lx, bot=bot: rect(L, lx, bot - 1, lx + lw - 1, bot, st['boots']))
    def tor(L):
        rect(L, x0, ty + dy, x1, ty + th - 1 + dy, st['shirt']); corners(L, x0, ty + dy, x1, ty + th - 1 + dy)
    def tor_d(L):
        if st['vest']:
            rect(L, x0 + 1, ty + 1 + dy, x1 - 1, ty + th - 3 + dy, st['vest'])
            if tw >= 10:
                for px_ in (x0 + 2, x1 - 3): rect(L, px_, ty + 4 + dy, px_ + 1, ty + 6 + dy, mixc(st['vest'], .65))
            rect(L, 16, ty + 1 + dy, 16, ty + th - 3 + dy, mixc(st['vest'], .7))
        rect(L, x0, ty + th - 2 + dy, x1, ty + th - 2 + dy, C['brown_d'] if not st['zombie'] else mixc(st['pants'], .8))
        if not back: _marks(L, st, x0, ty + dy, tw)
    part(im, tor, tor_d)
    # arms
    for i, ax in enumerate((x0 - aw, x1 + 1)):
        sw = pose['arm'][i] * sg if not st['gun'] else 0
        if reach and st['zombie']:
            if back: ya, yb = ty - 5 + dy - reach, ty + 3 + dy
            else: ya, yb = ty + 1 + dy, ty + 8 + dy + reach
        else: ya, yb = ty + 1 + dy + sw, ty + 8 + dy + sw
        ya = max(ya, 3); yb = min(yb, 28)
        part(im, lambda L, ax=ax, ya=ya, yb=yb: rect(L, ax, ya, ax + aw - 1, yb, st['sleeve']))
        hy = ya if back and reach else yb - 1
        if reach and back: hy = ya
        part(im, lambda L, ax=ax, hy=hy: rect(L, ax, hy, ax + aw - 1, hy + 1, st['skin']), sh=False)
    # gun
    if st['gun']:
        gy = pose['gy'] - pose['recoil']; gx = 16
        if not back:
            part(im, lambda L: (rect(L, gx, ty + 4 + dy - pose['recoil'] + pose['gy'], gx + 1, ty + 9 + dy + pose['gy'] - pose['recoil'], C['metal_m']),
                                rect(L, gx, ty + 10 + dy + pose['gy'] - pose['recoil'], gx + 1, ty + 13 + dy + pose['gy'] - pose['recoil'], C['metal_l'])))
            rect(im, gx - 1, ty + 4 + dy + pose['gy'], gx - 1, ty + 5 + dy + pose['gy'], st['skin'])
            rect(im, gx, ty + 8 + dy + pose['gy'], gx + 1, ty + 8 + dy + pose['gy'], st['skin'])
            if pose['flash']:
                fy = ty + 14 + dy + pose['gy']
                for dx_, dy_, c in ((0, 0, C['fire_w']), (1, 0, C['fire_w']), (-1, 1, C['fire_h']), (0, 1, C['fire_h']), (1, 1, C['fire_h']), (2, 1, C['fire_h']), (0, 2, C['fire_l']), (1, 2, C['fire_l'])):
                    px(im, gx + dx_, fy + dy_, c)
        else:
            part(im, lambda L: rect(L, x1 + 2, ty - 6 + dy + gy, x1 + 3, ty + 4 + dy + gy, C['metal_m']))
            if pose['flash']:
                for dx_, dy_, c in ((0, 0, C['fire_w']), (1, 0, C['fire_w']), (-1, -1, C['fire_h']), (0, -1, C['fire_h']), (1, -1, C['fire_h']), (2, -1, C['fire_h']), (0, -2, C['fire_l']), (1, -2, C['fire_l'])):
                    px(im, x1 + 2 + dx_, ty - 7 + dy + gy + dy_, c)
    if st['gun'] and pose['reload'] is not None:
        rs = pose['reload']; mx = 19 if not back else x1 + 4; my = ty + 7 + dy + pose['gy']
        if rs in (0, 4, 5): rect(im, mx, my, mx + 1, my + 2, C['rust_h'])
        elif rs == 1: rect(im, mx, my + 5, mx + 1, my + 7, C['rust_h'])
        elif rs == 2: rect(im, mx - 1, my + 7, mx, my + 8, st['skin'])
        elif rs == 3: rect(im, mx, my + 3, mx + 1, my + 5, C['rust_h'])
    if st['pack'] and back:
        def pk(L):
            rect(L, x0 + 1, ty + 1 + dy, x1 - 1, ty + th + 1 + dy, st['pack']); corners(L, x0 + 1, ty + 1 + dy, x1 - 1, ty + th + 1 + dy)
            rect(L, x0 + 1, ty - 2 + dy, x1 - 1, ty + 0 + dy, st['pack2'])
        def pkd(L):
            rect(L, x0 + 2, ty + 5 + dy, x1 - 2, ty + 7 + dy, mixc(st['pack'], .7)); rect(L, 16, ty + 1 + dy, 16, ty + 4 + dy, C['brown_d'])
            for xx in (x0 + 3, x1 - 3): px(L, xx, ty - 1 + dy, C['brown_d'])
        part(im, pk, pkd)
    _head(im, st, 16, max(hr + 2, 8 + dy + st['hdy'] + pose['hdy']), 'back' if back else 'front', pose)
    return im

def hum_side(st, pose):
    im = new(32, 32)
    tws, th, lw, ll, aw, hr = (st[k] for k in ('tws', 'th', 'lw', 'll', 'aw', 'hr'))
    ty = 12; dy = pose['bob']; lean = pose['lean'] + st['lean']
    tx0 = 15 - tws // 2 + lean; tx1 = tx0 + tws - 1
    reach = (st['reach'] + pose['reach']) if st['zombie'] else 0
    reach = min(reach, 28 - tx1 - 6)
    for i in (1, 0):
        s = pose['leg'][i]; bot = 27 - pose['lift'][i]; lx = 15 - lw // 2 + s
        k = .8 if i == 1 else 1
        part(im, lambda L, lx=lx, bot=bot, k=k: rect(L, lx, 19, lx + lw - 1, bot, mixc(st['pants'], k)))
        part(im, lambda L, lx=lx, bot=bot, k=k: rect(L, lx, bot - 1, lx + lw, bot, mixc(st['boots'], k)))
    if st['pack']:
        def pk(L):
            rect(L, tx0 - 4, ty + dy, tx0 - 1, ty + th - 2 + dy, st['pack']); rect(L, tx0 - 4, ty - 2 + dy, tx0 - 1, ty - 1 + dy, st['pack2'])
            corners(L, tx0 - 4, ty - 2 + dy, tx0 - 1, ty + th - 2 + dy)
        part(im, pk, lambda L: rect(L, tx0 - 3, ty + 4 + dy, tx0 - 2, ty + 6 + dy, C['brown_d']))
    # far arm (zombie) behind torso
    if reach:
        part(im, lambda L: rect(L, tx1 - 2, ty + dy + 1, tx1 + 3 + reach, ty + dy + aw, mixc(st['sleeve'], .8)))
    def tor(L):
        rect(L, tx0, ty + dy, tx1, ty + th - 1 + dy, st['shirt']); corners(L, tx0, ty + dy, tx1, ty + th - 1 + dy)
    def tord(L):
        if st['vest']: rect(L, tx0 + 1, ty + 1 + dy, tx1 - 1, ty + th - 3 + dy, st['vest']); rect(L, tx1 - 2, ty + 4 + dy, tx1 - 1, ty + 5 + dy, mixc(st['vest'], .65))
        rect(L, tx0, ty + th - 2 + dy, tx1, ty + th - 2 + dy, C['brown_d'] if not st['zombie'] else mixc(st['pants'], .8))
        _marks(L, st, tx0, ty + dy, tws)
    part(im, tor, tord)
    hx = (tx0 + tx1) // 2 + 1
    if st['gun']:
        gy = ty + 3 + dy + pose['gy']; gx0 = tx1 - 4 - pose['recoil']; gx1 = gx0 + 11
        part(im, lambda L: rect(L, tx1 - 3, gy, gx0 + 8, gy + 2, st['sleeve']))
        part(im, lambda L: (rect(L, gx0, gy, gx0 + 2, gy + 1, C['wood']), rect(L, gx0 + 3, gy, gx0 + 6, gy + 1, C['metal_d']), rect(L, gx0 + 7, gy, gx1, gy, C['metal_l']), rect(L, gx0 + 7, gy + 1, gx1, gy + 1, C['metal_m'])), sh=False)
        rect(im, gx0 + 3, gy - 1, gx0 + 5, gy - 1, C['metal_m'])
        st_ = pose['reload']
        magx = gx0 + 4
        if st_ in (None, 0, 4, 5): rect(im, magx, gy + 2, magx + 1, gy + 4, C['brass'] if 'brass' in C else C['rust_l'])
        if st_ == 1: rect(im, magx, gy + 6, magx + 1, gy + 8, C['rust_l'])
        if st_ == 3: rect(im, magx, gy + 5, magx + 1, gy + 7, C['rust_l'])
        px(im, gx0 + 8, gy + 1, st['skin']); px(im, gx0 + 8, gy + 2, st['skin']); px(im, gx0 + 3, gy + 2, st['skin'])
        if st_ in (1, 2, 3): rect(im, magx - 1, gy + 3, magx, gy + 4 + (st_ == 2) * 2, st['skin'])
        if pose['flash']:
            for dx_, dy_, c in ((0, 0, C['fire_w']), (0, 1, C['fire_w']), (1, -1, C['fire_h']), (1, 0, C['fire_h']), (1, 1, C['fire_h']), (1, 2, C['fire_h']), (2, 0, C['fire_l']), (2, 1, C['fire_l']), (3, 0, C['fire_m'])):
                px(im, gx1 + 1 + dx_, gy + dy_, c)
    elif reach:
        part(im, lambda L: rect(L, tx1 - 1, ty + dy + 2, tx1 + 3 + reach, ty + dy + 1 + aw, st['sleeve']))
        part(im, lambda L: rect(L, tx1 + 3 + reach, ty + dy + 2, tx1 + 5 + reach, ty + dy + 3 + aw - 1, st['skin']), sh=False)
        px(im, tx1 + 6 + reach, ty + dy + 2, st['skin'])
    else:
        part(im, lambda L: rect(L, tx1 - 3, ty + 2 + dy + pose['arm'][0], tx1 - 1, ty + 8 + dy + pose['arm'][0], st['sleeve']))
    _head_side(im, st, hx, max(hr + 2, 8 + dy + st['hdy'] + pose['hdy']), pose)
    return im

def _head_side(im, st, cx, cy, pose):
    hr = st['hr']; kind = st['head']
    part(im, lambda L: disc(L, cx, cy, hr, st['skin']))
    def cover(L):
        disc(L, cx - 1, cy - 1, hr, st['helmet'])
        for y in range(cy + (0 if kind in ('helmet', 'hood') else 1), cy + hr + 2):
            for x in range(cx + (1 if kind != 'hair' else 0), cx + hr + 3): clr(L, x, y)
    if kind == 'plate':
        part(im, lambda L: rect(L, cx - 3, cy - hr + 1, cx + 1, cy - 1, st['helmet']))
        px(im, cx + hr - 1, cy + 1, EYE); rect(im, cx + 1, cy + hr - 1, cx + hr - 1, cy + hr - 1, C['blood_d'])
    else:
        part(im, cover)
        if kind == 'helmet':
            rect(im, cx + 1, cy, cx + hr - 1, cy + 1, C['glass_d']); px(im, cx + hr - 1, cy, C['glass'])
            rect(im, cx, cy + 2, cx + hr - 1, cy + hr, C['olive_d'])
        else:
            px(im, cx + hr - 2, cy + 1, EYE); px(im, cx + hr - 2, cy, C['outline'])
            px(im, cx + hr - 1, cy + hr - 1, C['blood_d'])

def lying(st, stage, back_dir):
    """Horizontal corpse, head at left; stage 2..5 -> pool grows. Returns 32x32 facing-right fall."""
    im = new(32, 32); tw, th, lw, ll, aw, hr = (st[k] for k in ('tw', 'th', 'lw', 'll', 'aw', 'hr'))
    cy = 18; pool = {2: 0, 3: 3, 4: 5, 5: 7}[stage]
    pc = C['blood_m'] if not st['zombie'] else lerp(C['blood_d'], C['ichor'], .5)
    L_t = th + 2; T = tw - 1; hx = 1 + hr; tx0 = 2 * hr; tx1 = tx0 + L_t - 1
    if pool:
        pr = 4 + pool * 0.8; ell(im, tx0 + 4, cy + 1, pr, 3 + pool * .5, pc); ell(im, tx0 + 3, cy + 1, pr * .6, 2 + pool * .3, mixc(pc, .75))
    lt = cy - T // 2
    for i, off in enumerate((-lw - 1 if stage == 2 else -lw, 1)):
        ly = cy - lw // 2 + off + (1 if i else 0) - (0 if stage > 2 else 0) + 1
        part(im, lambda L, ly=ly: rect(L, tx1 - 1, ly, tx1 + ll + 1, ly + lw - 1, st['pants']))
        part(im, lambda L, ly=ly: rect(L, tx1 + ll, ly, tx1 + ll + 1, ly + lw - 1, st['boots']))
    if st['pack']: part(im, lambda L: rect(L, tx0 + 1, lt - 3, tx0 + 5, lt, st['pack']))
    def tor(L): rect(L, tx0, lt, tx1, lt + T - 1, st['shirt']); corners(L, tx0, lt, tx1, lt + T - 1)
    def tord(L):
        if st['vest']: rect(L, tx0 + 2, lt + 1, tx1 - 2, lt + T - 2, st['vest'])
        rect(L, tx1 - 1, lt, tx1 - 1, lt + T - 1, C['brown_d'] if not st['zombie'] else mixc(st['pants'], .8))
        _marks(L, st, tx0 + 1, lt, 5)
    part(im, tor, tord)
    ay = lt + T if stage == 2 else lt + T - 1
    part(im, lambda L: rect(L, tx0 + 1 - (3 if stage == 2 else 0), ay - (6 if stage == 2 else 0), tx0 + 8, ay + aw - 1 - (6 if stage == 2 else 0), st['sleeve']))
    part(im, lambda L: rect(L, tx0 - 3, ay - (6 if stage == 2 else 0), tx0 - 1, ay + 1 - (6 if stage == 2 else 0), st['skin']), sh=False)
    part(im, lambda L: disc(L, hx, cy, hr, st['skin']))
    kind = st['head']
    if kind == 'plate':
        part(im, lambda L: rect(L, hx - 3, cy - hr + 1, hx + 1, cy + 1, st['helmet']))
    else:
        part(im, lambda L: (disc(L, hx + 1, cy, hr, st['helmet']), [rect(L, hx - hr - 1, y, hx - hr + 1, y, CLEAR) for y in range(cy - hr - 1, cy + hr + 2)]))
    px(im, hx - hr + 2, cy + 1, EYE if st['zombie'] else C['glass_d'])
    if stage >= 3: px(im, hx - hr + 1, cy + 2, st['skin'])
    if st['gun']: part(im, lambda L: (rect(L, tx0 - 1, cy + T // 2 + 2, tx0 + 10, cy + T // 2 + 3, C['metal_m'])))
    return im

def centre(im, cx=16, cy=19):
    b = im.getchannel('A').point(lambda a: 255 if a else 0).getbbox()
    dx = cx - (b[0] + b[2]) // 2; dy = cy - (b[1] + b[3]) // 2
    dx = max(2 - b[0], min(dx, 30 - b[2])); dy = max(2 - b[1], min(dy, 30 - b[3]))
    o = new(32, 32); o.paste(im, (dx, dy)); return o

def tint_pose(pose, a=.55): pose['tintc'] = C['white']; pose['tinta'] = a; return pose

def render(st, d, pose, lie=None):
    if lie is not None:
        base = lying(st, lie, d)
        if d == 'right': im = base
        elif d == 'left': im = flip_h(base)
        elif d == 'down': im = transpose(base)
        else: im = flip_v(transpose(base))
        im = centre(im)
    else:
        if d in ('down', 'up'): im = hum_fb(st, pose, d == 'up')
        else:
            im = hum_side(st, pose)
            if d == 'left': im = flip_h(im)
    if pose['tinta']: im = tint(im, pose['tintc'], pose['tinta'])
    outline(im); return im

def poses(kind, anim):
    st = STYLES[kind]; amp = st['amp']; out = []
    if anim == 'idle':
        for i in range(4):
            b = (0, -1, -1, 0)[i] if not st['zombie'] else 0
            out.append(P(gy=(0, 0, 1, 1)[i] if not st['zombie'] else 0, bob=b, lean=(0, 1, 0, -1)[i] if st['zombie'] and kind != 'brute' else 0, hdy=(0, 0, 1, 0)[i] if st['zombie'] else 0,
                         reach=(0, 1, 0, -1)[i] if st['zombie'] else 0))
    elif anim in ('walk', 'run'):
        for i in range(6):
            t = 2 * math.pi * i / 6; s = round(amp * math.sin(t)); c = math.cos(t)
            out.append(P(leg=(s, -s), lift=(1 if c > .2 else 0, 1 if c < -.2 else 0), arm=(-s, s),
                         bob=-1 if abs(math.sin(t)) < .4 else 0, lean=0, reach=round(math.sin(t + 1)) if st['zombie'] else 0))
    elif anim == 'shoot':
        out = [P(flash=1, recoil=2, lean=-1), P(flash=0, recoil=1), P(recoil=0)]
    elif anim == 'reload':
        out = [P(gy=1, reload=0), P(gy=2, reload=1), P(gy=2, reload=2, bob=0), P(gy=2, reload=3), P(gy=1, reload=4, lean=1), P(gy=0, reload=5)]
    elif anim == 'attack':
        out = [P(lean=-1, reach=-1, hdy=-1), P(lean=1, reach=1, bob=0), P(lean=2, reach=2), P(lean=0, reach=0)]
    elif anim == 'hit':
        out = [tint_pose(P(lean=-3, bob=1, hdy=1), .6), P(lean=-1, hdy=1)]
    return out

ANIMS = {  # name: (frames-from-poses?, duration ms)
 'idle': 200, 'walk': 130, 'run': 90, 'shoot': 70, 'reload': 150, 'attack': 110, 'hit': 100, 'death': 130}
PLAN = {
 'player': ['idle', 'walk', 'shoot', 'reload', 'death'],
 'walker': ['idle', 'walk', 'attack', 'hit', 'death'],
 'runner': ['idle', 'run', 'attack', 'hit', 'death'],
 'brute': ['idle', 'walk', 'attack', 'hit', 'death'],
}
USE = {'idle': 'loop when stationary', 'walk': 'loop while moving', 'run': 'loop while chasing', 'shoot': 'one-shot on fire',
       'reload': 'one-shot reload', 'attack': 'one-shot melee attack', 'hit': 'one-shot hit reaction', 'death': 'one-shot death, hold last frame'}

def generate():
    for kind, anims in PLAN.items():
        st = STYLES[kind]
        for anim in anims:
            for d in DIRS:
                if anim == 'death':
                    frames = [render(st, d, tint_pose(P(lean=-1, bob=0), .5)), render(st, d, P(lean=-2, bob=2, lift=(2, 2), tintc=C['white'], tinta=0))]
                    frames += [render(st, d, P(), lie=s) for s in (2, 3, 4, 5)]
                else:
                    frames = [render(st, d, p) for p in poses(kind, anim)]
                reg_anim(kind, f"characters/{kind}", "spritesheets/characters", frames, anim, ANIMS[anim], d, PIVOT,
                         f"{kind} {USE[anim]}", "characters", loop=anim in ('idle', 'walk', 'run'))
