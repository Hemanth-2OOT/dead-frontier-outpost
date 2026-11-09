"""Generate Command Centre assets for DEAD FRONTIER: OUTPOST
Uses core palette and styling conventions from ART_BIBLE.md."""
import os, sys, math, random
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import C, new, rect, disc, ell, line, px, outline, shade, speckle, mixc
from buildings import pad, plate, stripes, vent, tline, damage, ruin

def b_command_center(frame=0):
    im = new(96, 96)
    rng = random.Random(505 + frame)
    # Concrete base foundation (3x3 tiles = 96x96)
    pad(im, 2, 2, 93, 93, rng, C['conc_d'])
    
    # Outer armored bunker perimeter
    plate(im, 6, 6, 89, 89, C['olive_d'], rng)
    
    # Inner reinforced HQ plating
    plate(im, 12, 12, 83, 83, C['metal_d'], rng, grain=0.08)
    
    # Corner reinforced concrete pillboxes / supports
    for cx, cy in [(14, 14), (81, 14), (14, 81), (81, 81)]:
        disc(im, cx, cy, 6, C['metal_m'])
        disc(im, cx, cy, 3, C['metal_h'])
        px(im, cx, cy, C['rust_d'])

    # Central Command Hub (circular tactical dome / armored room)
    disc(im, 48, 48, 22, C['conc_m'])
    disc(im, 48, 48, 20, C['metal_m'])
    disc(im, 48, 48, 16, C['olive_m'])
    disc(im, 48, 48, 12, C['asph_d'])
    
    # Radar / Comms Dish scanning in center
    ang = frame * (math.pi / 2) # rotates 4 frames
    for r in range(2, 10):
        dx = int(round(math.cos(ang) * r))
        dy = int(round(math.sin(ang) * r))
        px(im, 48 + dx, 48 + dy, C['metal_h'])
    disc(im, 48, 48, 3, C['energy_l'] if frame % 2 == 0 else C['energy_d'])
    
    # Comms mast / antenna on top right
    rect(im, 70, 16, 72, 38, C['metal_l'])
    rect(im, 68, 20, 74, 21, C['metal_h'])
    rect(im, 69, 28, 73, 29, C['metal_h'])
    px(im, 71, 15, C['fire_h'] if frame % 2 == 1 else C['fire_d']) # blinking beacon
    
    # Solar / Energy panels on left side
    plate(im, 16, 26, 28, 68, C['glass_d'], rng, rivets=False)
    for y in range(28, 68, 8):
        rect(im, 18, y, 26, y + 5, C['glass'])
        rect(im, 18, y, 26, y, C['energy_l'])
        
    # Command Terminal Screens on right side
    plate(im, 66, 44, 80, 68, C['metal_m'], rng)
    rect(im, 68, 46, 78, 66, C['asph_d'])
    # Status holographic displays
    disp_col = (C['energy_l'], C['road_y'], C['energy_d'], C['ui_good'])[frame % 4]
    rect(im, 70, 48, 76, 52, disp_col)
    rect(im, 70, 56, 76, 62, C['energy_l'] if frame % 2 == 0 else C['metal_l'])
    
    # Heavy Blast Doors at bottom center
    rect(im, 40, 76, 56, 91, C['metal_d'])
    stripes(im, 40, 76, 56, 80, C['road_y'], C['metal_d'])
    rect(im, 42, 82, 47, 90, C['metal_m'])
    rect(im, 49, 82, 54, 90, C['metal_m'])
    rect(im, 47, 82, 48, 90, C['outline'])
    
    # Hazard stripes around base
    stripes(im, 12, 10, 83, 13, C['road_y'], C['metal_d'])
    
    # Vents & cooling
    vent(im, 34, 18, 44, 24)
    vent(im, 52, 18, 62, 24)
    
    # Base perimeter lights
    for lx, ly in [(8, 8), (87, 8), (8, 87), (87, 87)]:
        rect(im, lx - 1, ly - 1, lx + 1, ly + 1, C['metal_m'])
        px(im, lx, ly, C['energy_l'] if frame % 2 == 0 else C['road_y'])

    # Shading, speckle weathering and outline
    speckle(im, rng, [C['rust_m'], C['rust_d'], C['conc_l']], 20)
    shade(im)
    outline(im)
    return im

def generate():
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "buildings", "command_center"))
    os.makedirs(out_dir, exist_ok=True)
    sheet_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "spritesheets", "buildings"))
    os.makedirs(sheet_dir, exist_ok=True)
    icons_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "ui", "icons"))
    os.makedirs(icons_dir, exist_ok=True)
    
    frames = [b_command_center(i) for i in range(4)]
    base = frames[0]
    
    # Static normal
    base.save(os.path.join(out_dir, "command_center_normal.png"))
    
    # Spritesheet active
    sheet = Image.new("RGBA", (96 * 4, 96), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f, (i * 96, 0))
    sheet.save(os.path.join(sheet_dir, "command_center_active.png"))
    
    # Damaged
    dm = damage(base, 999, 1)
    outline(dm)
    dm.save(os.path.join(out_dir, "command_center_damaged.png"))
    
    # Destroyed
    cols = [C['metal_m'], C['rust_m'], C['conc_m'], C['conc_d'], C['olive_m'], C['rust_d']]
    dest = ruin(96, 96, 888, cols, scale=1.0)
    dest.save(os.path.join(out_dir, "command_center_destroyed.png"))
    
    # Icon (32x32)
    icon = base.resize((32, 32), Image.Resampling.NEAREST)
    icon.save(os.path.join(icons_dir, "icon_command_center.png"))
    
    # Also save in DEAD_FRONTIER_ASSETS for consistency
    df_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "DEAD_FRONTIER_ASSETS", "buildings", "command_center"))
    os.makedirs(df_dir, exist_ok=True)
    base.save(os.path.join(df_dir, "command_center_normal.png"))
    dm.save(os.path.join(df_dir, "command_center_damaged.png"))
    dest.save(os.path.join(df_dir, "command_center_destroyed.png"))
    
    df_sheet_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "DEAD_FRONTIER_ASSETS", "spritesheets", "buildings"))
    sheet.save(os.path.join(df_sheet_dir, "command_center_active.png"))
    
    df_icons = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "DEAD_FRONTIER_ASSETS", "ui", "icons"))
    icon.save(os.path.join(df_icons, "icon_command_center.png"))
    
    print("Command center generated successfully!")

if __name__ == '__main__':
    generate()
