/**
 * DEAD FRONTIER: OUTPOST
 * MenuScene: Atmospheric Title Screen, New Game, Continue, Settings & Controls
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

const SAVE_KEY = 'dead_frontier_outpost_save';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const cx = GAME_CONFIG.WIDTH / 2;
    const cy = GAME_CONFIG.HEIGHT / 2;

    // Background tile wallpaper
    for (let y = 0; y < GAME_CONFIG.HEIGHT; y += 32) {
      for (let x = 0; x < GAME_CONFIG.WIDTH; x += 32) {
        const t = (x + y) % 64 === 0 ? 'industrial_floor_0' : 'concrete_0';
        this.add.image(x + 16, y + 16, t).setAlpha(0.45);
      }
    }

    // Dark vignette overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(0x13151a, 0.7);
    vignette.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    // Hazard stripe decorative border at top and bottom
    const hazard = this.add.graphics();
    for (let x = 0; x < GAME_CONFIG.WIDTH; x += 24) {
      hazard.fillStyle(x % 48 === 0 ? 0xc8a024 : 0x262a2d, 0.85);
      hazard.fillRect(x, 0, 24, 8);
      hazard.fillRect(x, GAME_CONFIG.HEIGHT - 8, 24, 8);
    }

    // Central Base Structure graphic
    const hq = this.add.sprite(cx, cy - 100, 'command_center_normal').setScale(1.2);
    if (this.anims.exists('command_center_active_anim')) {
      hq.play('command_center_active_anim');
    }

    // Game Title
    const title = this.add.text(cx, cy - 16, 'DEAD FRONTIER', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#d6893c',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const subtitle = this.add.text(cx, cy + 20, 'O U T P O S T', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ae2b25',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const tagline = this.add.text(cx, cy + 46, 'BUILD. AUTOMATE. FORTIFY. SURVIVE.', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#7b8489',
      letterSpacing: 2
    }).setOrigin(0.5, 0.5);

    // Check for save data
    const hasSave = this.checkValidSave();

    let btnY = cy + 90;

    // 1. Continue Button (if save exists)
    if (hasSave) {
      this.createMenuButton(cx, btnY, 'CONTINUE CAMPAIGN', () => {
        this.scene.start('GameScene', { loadSave: true });
      }, 0x6bae3a);
      btnY += 46;
    }

    // 2. New Game Button
    this.createMenuButton(cx, btnY, 'NEW GAME', () => {
      this.scene.start('GameScene', { loadSave: false });
    }, 0xd6893c);
    btnY += 46;

    // 3. Settings / Controls Button
    this.createMenuButton(cx, btnY, 'CONTROLS & SETTINGS', () => {
      this.showSettingsModal();
    });

    // Version label
    this.add.text(GAME_CONFIG.WIDTH - 12, GAME_CONFIG.HEIGHT - 16, 'v1.0.0 (Phaser 3)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#5b676d'
    }).setOrigin(1, 0.5);
  }

  createMenuButton(x, y, text, onClick, borderColor = 0x5b676d) {
    const btn = this.add.container(x, y);
    const w = 240;
    const h = 36;

    const bg = this.add.graphics();
    bg.fillStyle(0x171a1c, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    bg.lineStyle(1, borderColor, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
    btn.add(bg);

    const label = this.add.text(0, 0, text, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    btn.add(label);

    btn.setSize(w, h);
    btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(borderColor, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      label.setColor('#13151a');
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x171a1c, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
      bg.lineStyle(1, borderColor, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);
      label.setColor('#ffffff');
    });

    btn.on('pointerdown', () => {
      soundSystem.playClick();
      onClick();
    });
  }

  showSettingsModal() {
    const modal = this.add.container(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2);
    modal.setDepth(100);

    const w = 420;
    const h = 340;

    // Dark backdrop
    const blocker = this.add.graphics();
    blocker.fillStyle(0x000000, 0.7);
    blocker.fillRect(-GAME_CONFIG.WIDTH / 2, -GAME_CONFIG.HEIGHT / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    modal.add(blocker);

    // Frame
    const bg = this.add.graphics();
    bg.fillStyle(0x171a1c, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, 0xd6893c, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    modal.add(bg);

    // Header
    const title = this.add.text(0, -h / 2 + 26, 'CONTROLS & AUDIO SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#d6893c',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    modal.add(title);

    // Controls list
    const controlsText = [
      'WASD          : Move Survivor',
      'Mouse Aim     : Rotate / Target Weapon',
      'Left Click    : Fire Weapon',
      'R             : Reload Weapon',
      'B             : Toggle Construction Menu',
      '1 - 8 Keys    : Quick Select Building',
      'Left Click    : Place Building / Inspect',
      'Right Click   : Cancel Placement',
      'Escape        : Pause Game / Cancel'
    ].join('\n');

    const list = this.add.text(-w / 2 + 30, -h / 2 + 60, controlsText, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d9dacf',
      lineSpacing: 5
    });
    modal.add(list);

    // Audio toggle button
    const audioBtn = this.add.container(0, h / 2 - 60);
    const aBg = this.add.graphics();
    aBg.fillStyle(0x262c30, 1);
    aBg.fillRoundedRect(-80, -14, 160, 28, 4);
    aBg.lineStyle(1, 0x5b676d, 1);
    aBg.strokeRoundedRect(-80, -14, 160, 28, 4);
    audioBtn.add(aBg);

    const aTxt = this.add.text(0, 0, soundSystem.muted ? 'AUDIO: MUTED' : 'AUDIO: ENABLED', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: soundSystem.muted ? '#c13a2b' : '#6bae3a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    audioBtn.add(aTxt);

    audioBtn.setSize(160, 28);
    audioBtn.setInteractive(new Phaser.Geom.Rectangle(-80, -14, 160, 28), Phaser.Geom.Rectangle.Contains);
    audioBtn.on('pointerdown', () => {
      soundSystem.setMuted(!soundSystem.muted);
      aTxt.setText(soundSystem.muted ? 'AUDIO: MUTED' : 'AUDIO: ENABLED');
      aTxt.setColor(soundSystem.muted ? '#c13a2b' : '#6bae3a');
    });
    modal.add(audioBtn);

    // Close button
    const closeBtn = this.add.text(w / 2 - 24, -h / 2 + 16, 'X', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#c13a2b',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundSystem.playClick();
      modal.destroy();
    });
    modal.add(closeBtn);
  }

  checkValidSave() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      return parsed && parsed.version === 1;
    } catch (e) {
      return false;
    }
  }
}
