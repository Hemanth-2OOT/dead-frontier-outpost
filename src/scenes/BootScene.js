/**
 * DEAD FRONTIER: OUTPOST
 * BootScene: Engine initialization and transition to Preload
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Nothing heavy needed here - immediately proceed to preload all assets
  }

  create() {
    // Configure crisp pixel scaling
    this.game.canvas.style.imageRendering = 'pixelated';
    this.scene.start('PreloadScene');
  }
}
