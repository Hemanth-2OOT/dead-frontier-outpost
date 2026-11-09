"""Validate the asset pack. Exit code 1 if any ERROR. Writes docs/VALIDATION_REPORT.md"""
import os, sys, json, statistics
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ROOT

errors, warns, stats = [], [], dict(files=0, frames=0)
man = json.load(open(os.path.join(ROOT, "docs/manifest.json")))['assets']
cache = {}
def img(rel):
    if rel not in cache:
        p = os.path.join(ROOT, rel)
        if not os.path.isfile(p): errors.append(f"missing file: {rel}"); cache[rel] = None
        else:
            try: im = Image.open(p); im.load(); cache[rel] = im
            except Exception as e: errors.append(f"invalid PNG {rel}: {e}"); cache[rel] = None
    return cache[rel]
def bbox(im): return im.getchannel('A').point(lambda a: 255 if a else 0).getbbox()

for m in man:
    fw, fh, n = m['frame_width'], m['frame_height'], m['frames']
    if len(m['frame_files']) != n: errors.append(f"{m['name']}/{m['animation']}: frame_files != frames")
    ims = [img(f) for f in m['frame_files']]
    for f, im in zip(m['frame_files'], ims):
        if im is None: continue
        if im.format != 'PNG': errors.append(f"not PNG: {f}")
        if im.mode != 'RGBA': errors.append(f"not RGBA: {f} ({im.mode})")
        if im.size != (fw, fh): errors.append(f"dimension mismatch {f}: {im.size} != {(fw, fh)}")
        if bbox(im) is None: errors.append(f"blank frame: {f}")
    if m['kind'] == 'animation':
        sh = img(m['file'])
        if sh is not None:
            if sh.size != (fw * n, fh): errors.append(f"sheet layout wrong {m['file']}: {sh.size} != {(fw * n, fh)}")
            else:
                for i, im in enumerate(ims):
                    if im is not None and sh.crop((i * fw, 0, (i + 1) * fw, fh)).tobytes() != im.tobytes(): errors.append(f"sheet != frame {i}: {m['file']}")
        px_, py_ = m['pivot']
        if not (0 <= px_ <= fw and 0 <= py_ <= fh): errors.append(f"pivot outside frame: {m['file']}")
        if n > 1 and len({im.tobytes() for im in ims if im is not None}) < n and m['animation'] not in ('death',):
            warns.append(f"duplicate frames in {m['file']} (animation may be partly static)")
        if m['category'] == 'characters':
            bbs = [bbox(im) for im in ims if im is not None]
            for fi, (im, b) in enumerate(zip(ims, bbs)):
                if b and (b[0] == 0 or b[1] == 0 or b[2] == fw or b[3] == fh): errors.append(f"sprite touches/clips canvas edge: {m['frame_files'][fi]} bbox={b}")
            if m['animation'] in ('idle', 'walk', 'run', 'shoot', 'reload'):
                bot = [b[3] for b in bbs]; cx = [(b[0] + b[2]) / 2 for b in bbs]
                if max(bot) - min(bot) > 3: warns.append(f"vertical foot drift {max(bot) - min(bot)}px: {m['file']}")
                if max(cx) - min(cx) > 5: warns.append(f"horizontal drift {max(cx) - min(cx):.1f}px: {m['file']}")
    else:
        if m['category'] == 'environment' and m.get('tileable'):
            im = ims[0]
            if im is not None:
                px = im.load(); w, h = im.size
                if any(px[x, y][3] != 255 for x in range(w) for y in range(h)): errors.append(f"tile has transparency: {m['file']}")
                d = lambda a, b: sum(sum(abs(a[i] - b[i]) for i in range(3)) for a, b in zip(a, b)) / len(a)
                cols = [[px[x, y] for y in range(h)] for x in range(w)]; rows = [[px[x, y] for x in range(w)] for y in range(h)]
                for name, seq in (("horizontal", cols), ("vertical", rows)):
                    inner = [d(seq[i], seq[i + 1]) for i in range(len(seq) - 1)]; wrap = d(seq[-1], seq[0])
                    if wrap > max(inner) * 1.15 + 1: warns.append(f"{name} seam metric {wrap:.1f} > max internal {max(inner):.1f}: {m['file']}")
        if m['category'] in ('buildings', 'characters') and ims[0] is not None:
            b = bbox(ims[0]); 
            if b and (b[2] - b[0]) < fw * .5 and m.get('state') != 'destroyed': warns.append(f"possible unwanted padding: {m['file']} (content {b[2]-b[0]}x{b[3]-b[1]} in {fw}x{fh})")

# every file on disk is in the manifest or is a sheet
listed = {f for m in man for f in m['frame_files']} | {m['file'] for m in man}
allpng = [os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/') for dp, _, fs in os.walk(ROOT) for f in fs if f.endswith('.png') and not dp.endswith('previews')]
for f in allpng:
    if f not in listed: warns.append(f"PNG not in manifest: {f}")
for f in ("docs/ART_BIBLE.md", "docs/ASSET_MANIFEST.md", "docs/palette.gpl", "docs/manifest.json", "docs/GODOT_IMPORT.md",
          "previews/asset_overview.png", "previews/characters.png", "previews/buildings.png", "previews/environment.png", "previews/effects.png", "previews/ui.png"):
    if not os.path.isfile(os.path.join(ROOT, f)): errors.append(f"expected file missing: {f}")
# required coverage
need = {'characters': ['player', 'walker', 'runner', 'brute'], 'buildings': ['scrap_collector', 'generator', 'ammo_factory', 'machine_gun_turret', 'cannon_turret', 'repair_station', 'wall', 'mine']}
for cat, names in need.items():
    have = {m['name'] for m in man if m['category'] == cat}
    for n in names:
        if n not in have: errors.append(f"missing {cat}: {n}")
anims = {(m['name'], m['animation'], m['direction']) for m in man if m['category'] == 'characters'}
for k, a in {'player': ['idle', 'walk', 'shoot', 'reload', 'death'], 'walker': ['idle', 'walk', 'attack', 'hit', 'death'], 'runner': ['idle', 'run', 'attack', 'hit', 'death'], 'brute': ['idle', 'walk', 'attack', 'hit', 'death']}.items():
    for an in a:
        for d in ('down', 'up', 'left', 'right'):
            if (k, an, d) not in anims: errors.append(f"missing animation {k}/{an}/{d}")

total_png = len(allpng); total_frames = sum(m['frames'] for m in man if m['kind'] == 'animation') + sum(1 for m in man if m['kind'] == 'static')
anim_frames = sum(m['frames'] for m in man if m['kind'] == 'animation')
rep = ["# Validation Report", "", f"- Manifest entries: {len(man)}", f"- PNG files (excluding previews): {total_png}",
       f"- Animation frames (individual files inside animations): {anim_frames}", f"- Static sprites: {sum(1 for m in man if m['kind']=='static')}",
       f"- Sprite sheets (horizontal strips): {sum(1 for m in man if m['kind']=='animation')}", f"- **Errors: {len(errors)}**  /  Warnings: {len(warns)}", ""]
rep += ["## Errors"] + ([f"- {e}" for e in errors] or ["- none"]) + ["", "## Warnings"] + ([f"- {w}" for w in warns] or ["- none"]) + ["", "## Checks performed",
        "file existence, PNG validity, RGBA mode, frame dimensions vs manifest, sheet width = frames x frame width and sheet pixels == frame pixels, manifest paths resolve, blank frames, pivot inside frame, character clipping at canvas edge, foot/centre drift across frames, duplicate frames, tile transparency and wrap-around seam metric, padding heuristic, required animations per direction, docs/preview files present.",
        "", "Not checked: in-engine import (Godot is not installed here); visual quality beyond what the preview sheets show."]
open(os.path.join(ROOT, "docs/VALIDATION_REPORT.md"), "w").write("\n".join(rep))
print("\n".join(rep[:9])); print("ERRORS:", *errors[:30], sep="\n  "); print("WARNINGS:", *warns[:40], sep="\n  ")
sys.exit(1 if errors else 0)
