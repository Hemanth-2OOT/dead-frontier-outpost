/**
 * DEAD FRONTIER: OUTPOST
 * Complete Asset Configuration & Registry
 */

export const ASSET_CONFIG = {
  // Base path for public assets
  BASE_PATH: 'assets/',

  // Characters
  CHARACTERS: {
    player: {
      key: 'player',
      frameWidth: 32,
      frameHeight: 32,
      pivot: { x: 16, y: 27 },
      animations: [
        { key: 'idle', frames: 4, fps: 6, loop: true },
        { key: 'walk', frames: 6, fps: 10, loop: true },
        { key: 'shoot', frames: 3, fps: 12, loop: false },
        { key: 'reload', frames: 6, fps: 8, loop: false },
        { key: 'death', frames: 6, fps: 8, loop: false }
      ]
    },
    walker: {
      key: 'walker',
      frameWidth: 32,
      frameHeight: 32,
      pivot: { x: 16, y: 27 },
      animations: [
        { key: 'idle', frames: 4, fps: 4, loop: true },
        { key: 'walk', frames: 6, fps: 6, loop: true },
        { key: 'attack', frames: 4, fps: 8, loop: false },
        { key: 'hit', frames: 2, fps: 10, loop: false },
        { key: 'death', frames: 6, fps: 8, loop: false }
      ]
    },
    runner: {
      key: 'runner',
      frameWidth: 32,
      frameHeight: 32,
      pivot: { x: 16, y: 27 },
      animations: [
        { key: 'idle', frames: 4, fps: 5, loop: true },
        { key: 'run', frames: 6, fps: 12, loop: true },
        { key: 'attack', frames: 4, fps: 10, loop: false },
        { key: 'hit', frames: 2, fps: 10, loop: false },
        { key: 'death', frames: 6, fps: 10, loop: false }
      ]
    },
    brute: {
      key: 'brute',
      frameWidth: 32,
      frameHeight: 32,
      pivot: { x: 16, y: 27 },
      animations: [
        { key: 'idle', frames: 4, fps: 3, loop: true },
        { key: 'walk', frames: 6, fps: 5, loop: true },
        { key: 'attack', frames: 4, fps: 6, loop: false },
        { key: 'hit', frames: 2, fps: 8, loop: false },
        { key: 'death', frames: 6, fps: 6, loop: false }
      ]
    }
  },

  DIRECTIONS: ['down', 'up', 'left', 'right'],

  // Buildings & Structures
  BUILDINGS: {
    command_center: {
      key: 'command_center',
      width: 96,
      height: 96,
      gridWidth: 3,
      gridHeight: 3,
      hasActiveAnim: true,
      activeFrames: 4,
      normal: 'buildings/command_center/command_center_normal.png',
      damaged: 'buildings/command_center/command_center_damaged.png',
      destroyed: 'buildings/command_center/command_center_destroyed.png',
      activeSheet: 'spritesheets/buildings/command_center_active.png'
    },
    scrap_collector: {
      key: 'scrap_collector',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      hasActiveAnim: true,
      activeFrames: 4,
      normal: 'buildings/scrap_collector/scrap_collector_normal.png',
      damaged: 'buildings/scrap_collector/scrap_collector_damaged.png',
      destroyed: 'buildings/scrap_collector/scrap_collector_destroyed.png',
      activeSheet: 'spritesheets/buildings/scrap_collector_active.png'
    },
    generator: {
      key: 'generator',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      hasActiveAnim: true,
      activeFrames: 4,
      normal: 'buildings/generator/generator_normal.png',
      damaged: 'buildings/generator/generator_damaged.png',
      destroyed: 'buildings/generator/generator_destroyed.png',
      activeSheet: 'spritesheets/buildings/generator_active.png'
    },
    ammo_factory: {
      key: 'ammo_factory',
      width: 96,
      height: 96,
      gridWidth: 3,
      gridHeight: 3,
      hasActiveAnim: true,
      activeFrames: 4,
      normal: 'buildings/ammo_factory/ammo_factory_normal.png',
      damaged: 'buildings/ammo_factory/ammo_factory_damaged.png',
      destroyed: 'buildings/ammo_factory/ammo_factory_destroyed.png',
      activeSheet: 'spritesheets/buildings/ammo_factory_active.png'
    },
    machine_gun_turret: {
      key: 'machine_gun_turret',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      isTurret: true,
      base: 'buildings/machine_gun_turret/machine_gun_turret_base.png',
      barrel: 'buildings/machine_gun_turret/machine_gun_turret_barrel.png',
      baseDamaged: 'buildings/machine_gun_turret/machine_gun_turret_base_damaged.png',
      barrelDamaged: 'buildings/machine_gun_turret/machine_gun_turret_barrel_damaged.png',
      destroyed: 'buildings/machine_gun_turret/machine_gun_turret_destroyed.png',
      recoilSheet: 'spritesheets/buildings/machine_gun_turret_recoil.png',
      recoilFrames: 4
    },
    cannon_turret: {
      key: 'cannon_turret',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      isTurret: true,
      base: 'buildings/cannon_turret/cannon_turret_base.png',
      barrel: 'buildings/cannon_turret/cannon_turret_barrel.png',
      baseDamaged: 'buildings/cannon_turret/cannon_turret_base_damaged.png',
      barrelDamaged: 'buildings/cannon_turret/cannon_turret_barrel_damaged.png',
      destroyed: 'buildings/cannon_turret/cannon_turret_destroyed.png',
      recoilSheet: 'spritesheets/buildings/cannon_turret_recoil.png',
      recoilFrames: 4
    },
    repair_station: {
      key: 'repair_station',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      hasActiveAnim: true,
      activeFrames: 4,
      normal: 'buildings/repair_station/repair_station_normal.png',
      damaged: 'buildings/repair_station/repair_station_damaged.png',
      destroyed: 'buildings/repair_station/repair_station_destroyed.png',
      activeSheet: 'spritesheets/buildings/repair_station_active.png'
    },
    wall: {
      key: 'wall',
      width: 64,
      height: 64,
      gridWidth: 2,
      gridHeight: 2,
      normal: 'buildings/wall/wall_normal.png',
      damaged: 'buildings/wall/wall_damaged.png',
      critical: 'buildings/wall/wall_critical.png',
      destroyed: 'buildings/wall/wall_destroyed.png'
    },
    mine: {
      key: 'mine',
      width: 32,
      height: 32,
      gridWidth: 1,
      gridHeight: 1,
      hasActiveAnim: true,
      activeFrames: 2,
      normal: 'buildings/mine/mine_normal.png',
      triggered: 'buildings/mine/mine_triggered.png',
      activeSheet: 'spritesheets/buildings/mine_active.png'
    }
  },

  // Effects & Spritesheets
  EFFECTS: [
    { key: 'rifle_projectile', file: 'spritesheets/effects/rifle_projectile_fly.png', frameWidth: 16, frameHeight: 16, frames: 2, fps: 12 },
    { key: 'shotgun_projectile', file: 'spritesheets/effects/shotgun_projectile_fly.png', frameWidth: 16, frameHeight: 16, frames: 2, fps: 12 },
    { key: 'cannon_projectile', file: 'spritesheets/effects/cannon_projectile_fly.png', frameWidth: 16, frameHeight: 16, frames: 3, fps: 12 },
    { key: 'muzzle_flash_mg', file: 'spritesheets/effects/muzzle_flash_mg_play.png', frameWidth: 32, frameHeight: 32, frames: 4, fps: 20 },
    { key: 'muzzle_flash_cannon', file: 'spritesheets/effects/muzzle_flash_cannon_play.png', frameWidth: 32, frameHeight: 32, frames: 5, fps: 18 },
    { key: 'bullet_impact', file: 'spritesheets/effects/bullet_impact_play.png', frameWidth: 32, frameHeight: 32, frames: 5, fps: 18 },
    { key: 'blood_impact', file: 'spritesheets/effects/blood_impact_play.png', frameWidth: 32, frameHeight: 32, frames: 5, fps: 16 },
    { key: 'zombie_death_fx', file: 'spritesheets/effects/zombie_death_play.png', frameWidth: 32, frameHeight: 32, frames: 6, fps: 12 },
    { key: 'building_damage_fx', file: 'spritesheets/effects/building_damage_loop.png', frameWidth: 32, frameHeight: 32, frames: 4, fps: 8, loop: true },
    { key: 'explosion', file: 'spritesheets/effects/explosion_play.png', frameWidth: 64, frameHeight: 64, frames: 8, fps: 16 },
    { key: 'mine_explosion', file: 'spritesheets/effects/mine_explosion_play.png', frameWidth: 64, frameHeight: 64, frames: 7, fps: 16 },
    { key: 'smoke', file: 'spritesheets/effects/smoke_play.png', frameWidth: 32, frameHeight: 32, frames: 6, fps: 10 },
    { key: 'fire', file: 'spritesheets/effects/fire_loop.png', frameWidth: 32, frameHeight: 32, frames: 6, fps: 10, loop: true }
  ],

  // Environment & Terrain
  TERRAIN: [
    'grass_0', 'grass_1', 'grass_2',
    'dirt_0', 'dirt_1',
    'concrete_0', 'concrete_1', 'concrete_slab', 'cracked_concrete',
    'asphalt',
    'industrial_floor_0', 'industrial_floor_1', 'industrial_grate',
    'metal_floor_0', 'metal_floor_1',
    'rubble'
  ],

  ROADS: [
    'road_center_h', 'road_center_v',
    'road_edge_h', 'road_edge_v',
    'road_crosswalk', 'road_stop',
    'road_damaged_0', 'road_damaged_1'
  ],

  VEGETATION: [
    'bush_0', 'bush_1', 'bush_dead',
    'grass_tuft_tall', 'grass_tuft_short', 'weeds'
  ],

  DEBRIS: [
    'debris_paper', 'debris_scrap', 'debris_rubble',
    'debris_glass', 'debris_tire', 'debris_planks',
    'stain_oil', 'stain_blood'
  ],

  PROPS: [
    'barrel_rust', 'barrel_green', 'barrel_toxic',
    'scrap_pile_0', 'scrap_pile_1',
    'sandbags_corner', 'sandbags_line',
    'concrete_barrier_h', 'concrete_barrier_v',
    'ruined_machine_0', 'ruined_machine_1',
    'streetlight',
    'fence_h', 'fence_v',
    'crate_wood_s', 'crate_wood_l',
    'military_box_s', 'military_box_l',
    'car_wreck', 'van_wreck', 'jeep_burnt'
  ],

  // UI Icons & Controls
  UI_ICONS: [
    'icon_scrap', 'icon_metal', 'icon_fuel', 'icon_ammunition',
    'icon_health', 'icon_wave', 'icon_command_center',
    'icon_scrap_collector', 'icon_generator', 'icon_ammo_factory',
    'icon_machine_gun', 'icon_cannon', 'icon_repair_station',
    'icon_walls', 'icon_mine', 'icon_build', 'icon_remove', 'icon_upgrade',
    'select_scrap_collector', 'select_scrap_collector_selected',
    'select_generator', 'select_generator_selected',
    'select_ammo_factory', 'select_ammo_factory_selected',
    'select_machine_gun', 'select_machine_gun_selected',
    'select_cannon', 'select_cannon_selected',
    'select_repair_station', 'select_repair_station_selected',
    'select_walls', 'select_walls_selected',
    'select_mine', 'select_mine_selected'
  ],

  UI_ELEMENTS: [
    { key: 'panel_small', file: 'ui/panels/panel_small.png' },
    { key: 'panel_medium', file: 'ui/panels/panel_medium.png' },
    { key: 'panel_dark', file: 'ui/panels/panel_dark.png' },
    { key: 'panel_header', file: 'ui/panels/panel_header.png' },
    { key: 'button_normal', file: 'ui/buttons/button_normal.png' },
    { key: 'button_hover', file: 'ui/buttons/button_hover.png' },
    { key: 'button_pressed', file: 'ui/buttons/button_pressed.png' },
    { key: 'button_disabled', file: 'ui/buttons/button_disabled.png' },
    { key: 'placement_valid_32', file: 'ui/buttons/placement_valid_32.png' },
    { key: 'placement_invalid_32', file: 'ui/buttons/placement_invalid_32.png' },
    { key: 'placement_valid_64', file: 'ui/buttons/placement_valid_64.png' },
    { key: 'placement_invalid_64', file: 'ui/buttons/placement_invalid_64.png' }
  ],

  UI_ANIMATED: [
    { key: 'tile_select_pulse', file: 'ui/buttons/tile_select_pulse.png', frameWidth: 32, frameHeight: 32, frames: 4, fps: 4 },
    { key: 'tile_select_2x2_pulse', file: 'ui/buttons/tile_select_2x2_pulse.png', frameWidth: 64, frameHeight: 64, frames: 4, fps: 4 }
  ]
};
