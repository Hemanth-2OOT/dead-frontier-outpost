# DEAD FRONTIER: OUTPOST asset generator
Pure Python 3 + Pillow, deterministic (seeded). From this folder:
    python3 build_all.py   # wipes and regenerates ../../DEAD_FRONTIER_ASSETS (override with DF_ROOT=...)
    python3 validate.py    # writes docs/VALIDATION_REPORT.md, exit code 1 on errors
Modules: core (palette, primitives, manifest), chars, buildings, env, fx, ui.
