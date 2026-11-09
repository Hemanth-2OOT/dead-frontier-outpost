# DEAD FRONTIER: OUTPOST — Asset Inventory & Verification

## 1. Characters (32x32 spritesheets, 4-direction coverage: down, up, left, right)
- **Player Character**:
  - `player_idle`: 4 frames per direction
  - `player_walk`: 6 frames per direction
  - `player_shoot`: 3 frames per direction
  - `player_reload`: 6 frames per direction
  - `player_death`: 6 frames per direction (final frame = corpse)
- **Walker Zombie**:
  - `walker_idle`: 4 frames per direction
  - `walker_walk`: 6 frames per direction
  - `walker_attack`: 4 frames per direction
  - `walker_hit`: 2 frames per direction
  - `walker_death`: 6 frames per direction
- **Runner Zombie**:
  - `runner_idle`: 4 frames per direction
  - `runner_run`: 6 frames per direction
  - `runner_attack`: 4 frames per direction
  - `runner_hit`: 2 frames per direction
  - `runner_death`: 6 frames per direction
- **Brute Zombie**:
  - `brute_idle`: 4 frames per direction
  - `brute_walk`: 6 frames per direction
  - `brute_attack`: 4 frames per direction
  - `brute_hit`: 2 frames per direction
  - `brute_death`: 6 frames per direction

## 2. Buildings & Structures
- **Scrap Collector** (64x64, 2x2 tiles): `scrap_collector_normal`, `scrap_collector_active` (4 frames), `scrap_collector_damaged`, `scrap_collector_destroyed`
- **Generator** (64x64, 2x2 tiles): `generator_normal`, `generator_active` (4 frames), `generator_damaged`, `generator_destroyed`
- **Ammo Factory** (96x96, 3x3 tiles): `ammo_factory_normal`, `ammo_factory_active` (4 frames), `ammo_factory_damaged`, `ammo_factory_destroyed`
- **Machine Gun Turret** (64x64, 2x2 tiles): `machine_gun_turret_base`, `machine_gun_turret_barrel` (faces east), `machine_gun_turret_recoil` (4 frames), damaged and destroyed variants
- **Cannon Turret** (64x64, 2x2 tiles): `cannon_turret_base`, `cannon_turret_barrel` (faces east), `cannon_turret_recoil` (4 frames), damaged and destroyed variants
- **Repair Station** (64x64, 2x2 tiles): `repair_station_normal`, `repair_station_active` (4 frames), `repair_station_damaged`, `repair_station_destroyed`
- **Defensive Wall** (64x64, 2x2 tiles): `wall_normal`, `wall_damaged`, `wall_critical`, `wall_destroyed`
- **Land Mine** (32x32, 1x1 tile): `mine_normal`, `mine_active` (2 frames), `mine_triggered` (crater)
- **Command Centre (Base HQ)**: *Identified as missing from original building catalog*. Generated a 96x96 (3x3 tiles) fortified outpost bunker (`command_center_normal`, `command_center_active`, `command_center_damaged`, `command_center_destroyed`, `icon_command_center`) using the exact deterministic Art Bible palette, lighting, outline, and shading rules via Python Pillow generator.

## 3. Environment & Terrain
- **Terrain Tiles (32x32)**: `grass_0`, `grass_1`, `grass_2`, `dirt_0`, `dirt_1`, `concrete_0`, `concrete_1`, `concrete_slab`, `asphalt`, `cracked_concrete`, `industrial_floor_0`, `industrial_floor_1`, `industrial_grate`, `metal_floor_0`, `metal_floor_1`, `rubble`
- **Road Tiles (32x32)**: `road_center_h`, `road_center_v`, `road_edge_h`, `road_edge_v`, `road_crosswalk`, `road_stop`, `road_damaged_0`, `road_damaged_1`
- **Vegetation (32x32)**: `bush_0`, `bush_1`, `bush_dead`, `grass_tuft_tall`, `grass_tuft_short`, `weeds`
- **Debris & Stains**: `debris_paper`, `debris_scrap`, `debris_rubble`, `debris_glass`, `debris_tire`, `debris_planks` (16x16), `stain_oil`, `stain_blood` (32x32)
- **Props & Obstacles**:
  - Barrels: `barrel_rust`, `barrel_green`, `barrel_toxic` (16x16)
  - Scrap Piles: `scrap_pile_0`, `scrap_pile_1` (32x32)
  - Fortifications: `sandbags_corner` (32x32), `sandbags_line` (32x12), `concrete_barrier_h` (32x12), `concrete_barrier_v` (12x32), `fence_h` (32x8), `fence_v` (8x32)
  - Machinery: `ruined_machine_0`, `ruined_machine_1`, `streetlight` (32x32)
  - Crates: `crate_wood_s`, `military_box_s` (16x16), `crate_wood_l`, `military_box_l` (32x32)
  - Vehicle Wrecks: `car_wreck`, `van_wreck`, `jeep_burnt` (64x32)

## 4. Visual Effects & Projectiles
- **Projectiles**: `rifle_projectile_fly` (16x16, 2 frames), `shotgun_projectile_fly` (16x16, 2 frames), `cannon_projectile_fly` (16x16, 3 frames)
- **Muzzle Flashes**: `muzzle_flash_mg_play` (32x32, 4 frames), `muzzle_flash_cannon_play` (32x32, 5 frames)
- **Impacts & Explosions**:
  - `bullet_impact_play` (32x32, 5 frames)
  - `blood_impact_play` (32x32, 5 frames)
  - `zombie_death_play` (32x32, 6 frames)
  - `building_damage_loop` (32x32, 4 frames)
  - `explosion_play` (64x64, 8 frames)
  - `mine_explosion_play` (64x64, 7 frames)
  - `smoke_play` (32x32, 6 frames)
  - `fire_loop` (32x32, 6 frames)
  - Static Debris: `debris_particle_stone`, `debris_particle_shard`, `debris_particle_wood`, `debris_particle_bolt` (16x16)

## 5. User Interface (UI)
- **Resource Icons (32x32)**: `icon_scrap`, `icon_metal`, `icon_fuel`, `icon_ammunition`, `icon_health`, `icon_wave`, `icon_command_center`
- **Building Selector Icons (32x32 / 40x40)**: `icon_machine_gun`, `icon_cannon`, `icon_generator`, `icon_ammo_factory`, `icon_repair_station`, `icon_walls`, `icon_mine`, `icon_scrap_collector`, `icon_build`, `icon_remove`, `icon_upgrade` + 40x40 normal and selected button states
- **Panels & Headers**: `panel_small` (32x32), `panel_medium` (64x48), `panel_dark` (32x32), `panel_header` (64x16)
- **Buttons**: `button_normal`, `button_hover`, `button_pressed`, `button_disabled` (48x24)
- **Grid Placement**: `placement_valid_32`, `placement_invalid_32`, `placement_valid_64`, `placement_invalid_64`, `tile_select_pulse`, `tile_select_2x2_pulse`

## 6. Audio Interface
- *Asset pack status*: No audio files provided in zip archive.
- *Solution*: Built-in high-performance procedural Web Audio synthesizer (`SoundSystem.js`) generating crisp retro effects (gunfire, heavy cannon blast, explosions, hit thuds, zombie groans, reloads, construction impacts, emergency sirens, UI clicks) with master volume, SFX volume, music volume sliders and instantaneous mute toggling.
