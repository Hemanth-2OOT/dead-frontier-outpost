# Importing into Godot 4 (not yet tested inside Godot)
1. Copy `DEAD_FRONTIER_ASSETS/` into the project (e.g. `res://assets/`).
2. Project Settings > Rendering > Textures > Default Texture Filter = **Nearest**. Select the PNGs > Import dock: Filter Off, Mipmaps Off, Compress Lossless.
3. Animated sprites: use `spritesheets/*` strips. AnimatedSprite2D > SpriteFrames > "Add frames from sprite sheet" with Horizontal = `frames`, Vertical = 1 (values in `manifest.json`), FPS = 1000 / `frame_duration_ms`. Or load the individual frames from the asset folders.
4. Pivots: `manifest.json` gives `pivot` in pixels from the top-left. Set `Sprite2D.offset = Vector2(size/2) - pivot` (characters: pivot (16,27)).
5. Turrets: Node2D with `_base` Sprite2D (static) + `_barrel` Sprite2D (centered, rotate it). Play the `recoil` strip on firing. Position the muzzle flash at barrel tip (~ +30,0 from the pivot, rotate with the barrel).
6. TileSet: tile size 32x32, import terrain PNGs as individual atlas sources (or build one atlas). Overlays (vegetation/debris/props) are free-standing Sprite2D.
7. 9-slice UI: StyleBoxTexture with `nine_slice` margin from the manifest.
8. Left-facing frames already exist; do not flip in code.
