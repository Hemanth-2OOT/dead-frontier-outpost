/**
 * DEAD FRONTIER: OUTPOST
 * Engine & Game Configuration
 */

export const GAME_CONFIG = {
  // Screen and viewport
  WIDTH: 1024,
  HEIGHT: 576,

  // Map and Grid
  TILE_SIZE: 32,
  MAP_WIDTH_TILES: 64,
  MAP_HEIGHT_TILES: 64,
  
  get WORLD_WIDTH() {
    return this.MAP_WIDTH_TILES * this.TILE_SIZE; // 2048 px
  },
  
  get WORLD_HEIGHT() {
    return this.MAP_HEIGHT_TILES * this.TILE_SIZE; // 2048 px
  },

  // Base / Command Center Tile Placement (center of map)
  BASE_CENTER_TILE: { x: 30, y: 30 },

  // Palette hex colors from Art Bible for UI and canvas drawing
  COLORS: {
    bg: 0x13151a,
    panel: 0x262c30,
    panelLight: 0x364046,
    border: 0x5b676d,
    text: 0xd9dacf,
    accent: 0xd6893c,
    good: 0x6bae3a,
    bad: 0xc13a2b,
    dim: 0x7b8489,
    energy: 0x7fe3b4,
    ammo: 0xc8a024,
    health: 0xae2b25
  }
};
