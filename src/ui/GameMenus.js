/**
 * DEAD FRONTIER: OUTPOST
 * Menus and Modal Dialogs: Pause, Victory, Defeat & Settings
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class GameMenus {
  constructor(scene) {
    this.scene = scene;
    this.activeModal = null;
  }

  showPauseMenu(onResume, onRestart, onMenu) {
    this.closeModal();

    const container = this.scene.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    container.setDepth(300);

    const w = 300;
    const h = 260;

    // Dark backdrop
    const blocker = this.scene.add.graphics();
    blocker.fillStyle(0x000000, 0.6);
    blocker.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    container.add(blocker);

    // Modal frame
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, 0xd6893c, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    // Title
    const title = this.scene.add.text(0, -h / 2 + 30, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#d6893c',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    container.add(title);

    // Buttons: Resume, Restart, Main Menu
    this.createButton(container, 0, -20, 'RESUME [ESC]', () => {
      this.closeModal();
      if (onResume) onResume();
    });

    this.createButton(container, 0, 35, 'RESTART MATCH', () => {
      this.closeModal();
      if (onRestart) onRestart();
    });

    this.createButton(container, 0, 90, 'MAIN MENU', () => {
      this.closeModal();
      if (onMenu) onMenu();
    });

    this.activeModal = container;
  }

  showDefeatMenu(wave, onRetry, onMenu) {
    this.closeModal();
    soundSystem.playError();

    const container = this.scene.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    container.setDepth(300);

    const w = 340;
    const h = 260;

    const blocker = this.scene.add.graphics();
    blocker.fillStyle(0x000000, 0.7);
    blocker.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    container.add(blocker);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, 0xc13a2b, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    const title = this.scene.add.text(0, -h / 2 + 32, 'OUTPOST FALLEN', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#c13a2b',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    container.add(title);

    const subtitle = this.scene.add.text(0, -h / 2 + 65, `The horde breached defenses on Wave ${wave}`, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d9dacf'
    }).setOrigin(0.5, 0.5);
    container.add(subtitle);

    this.createButton(container, 0, 15, 'TRY AGAIN', () => {
      this.closeModal();
      if (onRetry) onRetry();
    }, 0xc13a2b);

    this.createButton(container, 0, 75, 'MAIN MENU', () => {
      this.closeModal();
      if (onMenu) onMenu();
    });

    this.activeModal = container;
  }

  showVictoryMenu(onPlayAgain, onMenu) {
    this.closeModal();
    soundSystem.playWaveComplete();

    const container = this.scene.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    container.setDepth(300);

    const w = 360;
    const h = 280;

    const blocker = this.scene.add.graphics();
    blocker.fillStyle(0x000000, 0.7);
    blocker.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    container.add(blocker);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, 0x6bae3a, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    const title = this.scene.add.text(0, -h / 2 + 32, 'VICTORY ACHIEVED!', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#6bae3a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    container.add(title);

    const subtitle = this.scene.add.text(0, -h / 2 + 65, 'All 10 infected hordes repelled!\nThe outpost stands resilient.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d9dacf',
      align: 'center'
    }).setOrigin(0.5, 0.5);
    container.add(subtitle);

    this.createButton(container, 0, 25, 'PLAY AGAIN', () => {
      this.closeModal();
      if (onPlayAgain) onPlayAgain();
    }, 0x6bae3a);

    this.createButton(container, 0, 85, 'MAIN MENU', () => {
      this.closeModal();
      if (onMenu) onMenu();
    });

    this.activeModal = container;
  }

  createButton(parent, x, y, label, onClick, color = 0xd6893c) {
    const btn = this.scene.add.container(x, y);

    const w = 200;
    const h = 36;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x262c30, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    bg.lineStyle(1, color, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
    btn.add(bg);

    const txt = this.scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    btn.add(txt);

    btn.setSize(w, h);
    btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      txt.setColor('#13151a');
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x262c30, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      bg.lineStyle(1, color, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
      txt.setColor('#ffffff');
    });

    btn.on('pointerdown', () => {
      soundSystem.playClick();
      onClick();
    });

    parent.add(btn);
  }

  closeModal() {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }
}
