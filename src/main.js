/**
 * DEAD FRONTIER: OUTPOST
 * Main Application Entry Point
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { soundSystem } from './systems/SoundSystem.js';

// Prevent right-click context menu inside the game canvas
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Initialize audio context on first user interaction
const initAudioOnGesture = () => {
  soundSystem.ensureContext();
  window.removeEventListener('pointerdown', initAudioOnGesture);
  window.removeEventListener('keydown', initAudioOnGesture);
};
window.addEventListener('pointerdown', initAudioOnGesture);
window.addEventListener('keydown', initAudioOnGesture);

const phaserConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, UIScene]
};

const game = new Phaser.Game(phaserConfig);
window.__PHASER_GAME__ = game;
window.__DEAD_FRONTIER_GAME__ = game;
