/**
 * DEAD FRONTIER: OUTPOST
 * Grid Coordinate & Math Utilities
 */

import { GAME_CONFIG } from '../config/gameConfig.js';

export const GridUtils = {
  TILE_SIZE: GAME_CONFIG.TILE_SIZE,

  /**
   * Converts world coordinates to grid tile coordinates.
   */
  worldToTile(x, y) {
    return {
      tileX: Math.floor(x / this.TILE_SIZE),
      tileY: Math.floor(y / this.TILE_SIZE)
    };
  },

  /**
   * Converts tile coordinates to center-point world coordinates.
   */
  tileToWorldCenter(tileX, tileY, tileWidth = 1, tileHeight = 1) {
    return {
      x: tileX * this.TILE_SIZE + (tileWidth * this.TILE_SIZE) / 2,
      y: tileY * this.TILE_SIZE + (tileHeight * this.TILE_SIZE) / 2
    };
  },

  /**
   * Converts tile coordinates to top-left world coordinates.
   */
  tileToWorldTopLeft(tileX, tileY) {
    return {
      x: tileX * this.TILE_SIZE,
      y: tileY * this.TILE_SIZE
    };
  },

  /**
   * Snap world position to top-left of tile.
   */
  snapToGrid(x, y) {
    return {
      x: Math.floor(x / this.TILE_SIZE) * this.TILE_SIZE,
      y: Math.floor(y / this.TILE_SIZE) * this.TILE_SIZE
    };
  },

  /**
   * Returns list of all tile cells covered by an area.
   */
  getOccupiedCells(tileX, tileY, widthTiles, heightTiles) {
    const cells = [];
    for (let dy = 0; dy < heightTiles; dy++) {
      for (let dx = 0; dx < widthTiles; dx++) {
        cells.push({
          tileX: tileX + dx,
          tileY: tileY + dy,
          key: `${tileX + dx},${tileY + dy}`
        });
      }
    }
    return cells;
  },

  /**
   * Check if tile coordinate is inside world map bounds.
   */
  isWithinBounds(tileX, tileY, margin = 0) {
    return (
      tileX >= margin &&
      tileX < GAME_CONFIG.MAP_WIDTH_TILES - margin &&
      tileY >= margin &&
      tileY < GAME_CONFIG.MAP_HEIGHT_TILES - margin
    );
  },

  /**
   * Distance between two world positions.
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Manhattan distance between two tile positions.
   */
  manhattanTileDistance(t1X, t1Y, t2X, t2Y) {
    return Math.abs(t1X - t2X) + Math.abs(t1Y - t2Y);
  },

  /**
   * Determine cardinal direction string from angle or vector (down, up, left, right).
   */
  getCardinalDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }
};
