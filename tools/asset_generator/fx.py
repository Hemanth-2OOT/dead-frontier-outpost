"""Combat and visual effects (frame-by-frame)."""
import math, random
from core import *

def band(v):  # heat value -> fire colour
    return C['fire_w'] if v > .85 else C['fire_h'] if v > .6 else C['fire_l'] if v > .4 else C['fire_m'] if v > .22 else C['fire_d'] if v > .1 else C['smoke_d']
SMK = [C['smoke_d'], C['smoke_m'], C['smoke_l'], C['smoke_h']]

def rifle(f):
    im = new(16, 16); L = (6, 8)[f % 2]
    rect(im, 15 - 3, 7, 14, 8, C['fire_w']); rect(im, 15 - 7, 7, 15 - 4, 8, C['fire_h']); rect(im, 15 - L - 4, 7, 15 - 8, 8, C['fire_m']); px(im, 15 - L - 5, 8, C['fire_d'])
    px(im, 15, 7, C['white']); px(im, 15, 8, C['white']); return im
def shotgun(f):
    im = new(16, 16)
    for i, (x, y) in enumerate(((11, 4), (13, 7), (12, 10), (10, 7))):
        y += (f + i) % 2 - 0; rect(im, x, y, x + 1, y + 1, C['tan_l']); px(im, x, y, C['fire_w']); px(im, x - 2, y, C['fire_m']); px(im, x - 3, y, C['fire_d'])
    return im
def cannon(f):
    im = new(16, 16)
    part(im, lambda L: rect(L, 6, 5, 13, 10, C['metal_m'])); rect(im, 13, 6, 14, 9, C['rust_m']); rect(im, 14, 7, 14, 8, C['rust_l']); rect(im, 8, 5, 8, 10, C['rust_d']); rect(im, 6, 6, 12, 6, C['metal_h'])
    for k, x in enumerate(range(5, 0, -1)):
        h = 3 - k // 2 + (f + k) % 3; rect(im, x, 8 - h // 2, x, 7 + h // 2 + 1, band(.8 - k * .17))
    outline(im); return im

def muzzle(f, big=False, n=4):
    im = new(32, 32); s = ([10, 15, 11, 6] if not big else [12, 18, 24, 20, 12][:n])[f] ; h = (3 if not big else 6) + (f % 2)
    rng = random.Random(f * 5 + 3)
    for x in range(2, 2 + s):
        q = (x - 2) / s; hh = round(h * (1 - q) ** .8)
        for y in range(16 - hh, 16 + hh + 1):
            v = (1 - q) * 1.1 - abs(y - 16) / (h + 1) * .5; px(im, x, y, band(v))
    for k in range(3 if big else 2):
        a = rng.uniform(-.7, .7); l = s * .7
        line(im, 4, 16, round(4 + math.cos(a) * l), round(16 + math.sin(a) * l), C['fire_h'])
    rect(im, 0, 15, 4, 17, C['fire_w'])
    if big and f >= 2:
        for i in range(8): ell(im, 12 + i * 2 + f, 16 + rng.randint(-6, 6), 2 + f // 2, 2 + f // 2, SMK[1 + i % 2] if f > 2 else C['fire_d'])
    return im
def impact(f, N=5):
    im = new(32, 32); rng = random.Random(7); t = f / (N - 1)
    for i in range(9):
        a = i * 2 * math.pi / 9 + rng.random() * .4; r0 = 2 + t * 6; r1 = r0 + 3 - t * 2
        line(im, round(16 + math.cos(a) * r0), round(16 + math.sin(a) * r0), round(16 + math.cos(a) * r1), round(16 + math.sin(a) * r1), band(1 - t * 1.1))
    if f < 3: disc(im, 16, 16, 3 - f, C['fire_w'])
    for i in range(10):
        a = rng.random() * 6.28; r = 3 + t * 9 * rng.random() + 2; px(im, round(16 + math.cos(a) * r), round(16 + math.sin(a) * r), SMK[1 + (i % 3)] if f > 1 else C['conc_h'])
    return im
def blood(f, N=5):
    im = new(32, 32); rng = random.Random(11); t = f / (N - 1)
    for i in range(16):
        a = rng.random() * 6.28; sp = rng.uniform(3, 11); r = sp * (1 - (1 - t) ** 2); x, y = round(16 + math.cos(a) * r), round(16 + math.sin(a) * r + t * 3)
        c = rng.choice((C['blood_l'], C['blood_m'], C['blood_m'], C['blood_d'])); px(im, x, y, c)
        if t < .6: px(im, x + 1, y, c)
    if f < 3: disc(im, 16, 16, 3 - f, C['blood_l'])
    if f >= 2: ell(im, 16, 18, 2 + f * 1.5, 1.5 + f, C['blood_d']); 
    return im
def zdeath(f, N=6):
    im = new(32, 32); rng = random.Random(13); t = f / (N - 1); ich = lerp(C['blood_d'], C['ichor'], .6)
    r = 3 + t * 9; ell(im, 16, 17, r, r * .7, C['blood_d']); ell(im, 15, 16, r * .75, r * .5, C['blood_m']); ell(im, 14, 15, r * .35, r * .22, ich)
    for _ in range(int(14 * t) + 4): a = rng.random() * 6.28; d = rng.uniform(r * .6, r * 1.4); px(im, round(16 + math.cos(a) * d), round(17 + math.sin(a) * d * .7), rng.choice((C['blood_m'], ich, C['blood_d'])))
    if f < 4:
        for i in range(6): ell(im, 16 + rng.randint(-5, 5), 12 - f * 2 + rng.randint(-3, 3), 2 + f // 2, 2 + f // 2, (*SMK[1 + i % 2][:3], 200 - f * 40))
    outline_pool = None; return im

def explosion(f, N=8, size=64, dirt=False):
    im = new(size, size); c = size // 2; rng = random.Random(f * 17 + 1 + dirt); t = f / (N - 1)
    R = size * .42 * math.sin(min((t + .14) * 1.7, 1) * math.pi / 2) * (1 if not dirt else .85)
    for y in range(size):
        for x in range(size):
            dx, dy = x - c, y - c; d = math.hypot(dx, dy); a = math.atan2(dy, dx)
            Rm = R * (1 + .12 * math.sin(3 * a + f * .9) + .14 * math.sin(5 * a - f * 1.3) + .1 * math.sin(8 * a + f))
            if d <= Rm:
                q = d / max(Rm, 1); v = (1 - q) * (1.25 - t * 1.05) + rng.uniform(-.06, .06)
                col = band(v)
                if t > .55 and rng.random() < (t - .4) * 1.1: col = SMK[min(3, max(0, int(v * 6) + 1))] if not dirt else rng.choice((C['dirt_d'], C['dirt_m'], C['smoke_m']))
                px(im, x, y, col)
    if 1 <= f <= 4 and not dirt:
        for i in range(60): a = i * math.pi / 30; px(im, round(c + math.cos(a) * R * 1.3), round(c + math.sin(a) * R * 1.3), C['smoke_h'] if i % 2 else C['white'])
    for i in range(14 if not dirt else 22):
        a = rng.random() * 6.28; sp = rng.uniform(.5, 1); r = t * size * .46 * sp; x, y = round(c + math.cos(a) * r), round(c + math.sin(a) * r - (math.sin(t * 3.1) * 6 if dirt else 0))
        col = rng.choice((C['rust_m'], C['metal_l'], C['metal_d'])) if not dirt else rng.choice((C['dirt_m'], C['dirt_l'], C['dirt_d'], C['conc_m']))
        rect(im, x, y, x + (i % 2), y + 1, col)
    fade = max(0, (t - .65) / .35)
    if fade:
        p = im.load()
        for y in range(size):
            for x in range(size):
                if p[x, y][3] and rng.random() < fade * .8: p[x, y] = CLEAR
    return im
def smoke(f, N=6):
    im = new(32, 32); rng = random.Random(21); t = f / (N - 1); A = int(235 * (1 - t * .88))
    for i in range(6):
        ox = rng.randint(-5, 5); r = 4 + t * 5 + rng.random() * 2 - i * .3; cy = 25 - t * 14 - i * 1.5 * (1 + t); cx = 16 + ox * (1 + t * .8)
        for k, col in enumerate((C['smoke_m'], C['smoke_l'], C['smoke_h'])):
            ell(im, cx - k * .8, cy - k * .8, r - k * 1.2, r - k * 1.2, (*col[:3], A))
    return im
def fire(f, N=6):
    im = new(32, 32); rng = random.Random(31)
    for x in range(6, 26):
        c = abs(x - 16) / 10; h = (1 - c ** 1.4) * (17 + 5 * math.sin(x * .9 + f * 1.8) + 3 * math.sin(x * 2.1 - f * 2.6)); h = max(0, h)
        for k in range(int(h)):
            y = 28 - k; rel = k / max(h, 1); jit = rng.uniform(-.05, .05)
            px(im, x, y, band(1.05 - rel * 1.0 + jit - c * .25))
    for i in range(4): px(im, rng.randint(8, 23), rng.randint(4, 14) - f % 3, C['fire_h'])
    return im
def bld_damage(f, N=4):
    im = new(32, 32); rng = random.Random(41 + f)
    for i in range(7): px(im, rng.randint(6, 25), rng.randint(6, 25), C['fire_h']); px(im, rng.randint(6, 25), rng.randint(6, 25), C['fire_w'])
    for i in range(3):
        x, y = rng.randint(10, 22), 24 - f * 2 - i * 3; ell(im, x, y, 2 + i * .5, 2 + i * .5, (*C['smoke_m'][:3], 200 - f * 30 - i * 20))
    for x in range(12, 20):
        h = int(4 + 3 * math.sin(x + f * 1.7)); [px(im, x, 28 - k, band(1 - k / max(h, 1) * .9)) for k in range(h)]
    return im
def particle(kind):
    im = new(16, 16)
    if kind == 'stone': ell(im, 8, 8, 3, 2, C['conc_m']); shade(im)
    elif kind == 'shard':
        for i in range(5): rect(im, 6 + i, 10 - i, 9 + i // 2, 11 - i + 1, C['metal_l'])
        shade(im)
    elif kind == 'wood': rect(im, 4, 7, 11, 9, C['wood']); rect(im, 4, 7, 11, 7, C['brown_l']); px(im, 10, 8, C['wood_d']); shade(im, 1.1, .8)
    elif kind == 'bolt': disc(im, 8, 8, 3, C['rust_m']); disc(im, 8, 8, 1, C['asph_d']); shade(im)
    outline(im); return im

def generate():
    cat = "effects"; sd = "spritesheets/effects"
    def anim(name, frames, folder, dur, pivot, use, loop=False, anim_name=None):
        reg_anim(name, f"effects/{folder}", sd, frames, anim_name or "play", dur, "none", pivot, use, cat, loop=loop)
    anim("rifle_projectile", [rifle(i) for i in range(2)], "projectiles", 60, (15, 8), "Rifle/MG tracer, faces EAST", True, "fly")
    anim("shotgun_projectile", [shotgun(i) for i in range(2)], "projectiles", 60, (12, 8), "Shotgun pellets, faces EAST", True, "fly")
    anim("cannon_projectile", [cannon(i) for i in range(3)], "projectiles", 60, (14, 8), "Cannon shell with trail, faces EAST", True, "fly")
    anim("muzzle_flash_mg", [muzzle(i) for i in range(4)], "muzzle_flash", 40, (2, 16), "MG/rifle muzzle flash, faces EAST, origin at left-centre")
    anim("muzzle_flash_cannon", [muzzle(i, True, 5) for i in range(5)], "muzzle_flash", 50, (2, 16), "Cannon muzzle flash, faces EAST, origin at left-centre")
    anim("bullet_impact", [impact(i) for i in range(5)], "impacts", 50, (16, 16), "Bullet hit on wall/ground")
    anim("blood_impact", [blood(i) for i in range(5)], "impacts", 55, (16, 16), "Bullet hit on zombie")
    anim("zombie_death", [zdeath(i) for i in range(6)], "impacts", 90, (16, 17), "Zombie death burst, last frame = stain (hold)")
    anim("building_damage", [bld_damage(i) for i in range(4)], "impacts", 100, (16, 16), "Looping spark/smoke on damaged structure", True, "loop")
    anim("explosion", [explosion(i) for i in range(8)], "explosions", 70, (32, 32), "Cannon/turret/building explosion")
    anim("mine_explosion", [explosion(i, 7, 64, True) for i in range(7)], "explosions", 70, (32, 32), "Mine detonation with dirt plume")
    anim("smoke", [smoke(i) for i in range(6)], "smoke", 120, (16, 28), "Rising smoke puff (semi-transparent)")
    anim("fire", [fire(i) for i in range(6)], "smoke", 90, (16, 28), "Looping flame", True, "loop")
    for k in ('stone', 'shard', 'wood', 'bolt'):
        reg_static(f"debris_particle_{k}", f"effects/impacts/debris_particle_{k}.png", particle(k), "Small debris particle for GPUParticles2D/Sprite spawning", cat, (8, 8))
