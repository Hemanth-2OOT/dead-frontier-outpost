# Validation Report

- Manifest entries: 238
- PNG files (excluding previews): 699
- Animation frames (individual files inside animations): 461
- Static sprites: 136
- Sprite sheets (horizontal strips): 102
- **Errors: 0**  /  Warnings: 0

## Errors
- none

## Warnings
- none

## Checks performed
file existence, PNG validity, RGBA mode, frame dimensions vs manifest, sheet width = frames x frame width and sheet pixels == frame pixels, manifest paths resolve, blank frames, pivot inside frame, character clipping at canvas edge, foot/centre drift across frames, duplicate frames, tile transparency and wrap-around seam metric, padding heuristic, required animations per direction, docs/preview files present.

Not checked: in-engine import (Godot is not installed here); visual quality beyond what the preview sheets show.