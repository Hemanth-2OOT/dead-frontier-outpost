/**
 * DEAD FRONTIER: OUTPOST
 * Top HUD Overlay: Player Health, Ammo, Resources, Wave Tracker & Power Status
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class HUD extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.scene = scene;

    this.createTopBar();
    this.createWaveBar();
    this.createPowerBar();

    scene.add.existing(this);
  }

  createTopBar() {
    // Semi-transparent top banner background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.85);
    bg.fillRect(0, 0, GAME_CONFIG.WIDTH, 44);
    bg.lineStyle(1, 0x5b676d, 0.8);
    bg.lineBetween(0, 44, GAME_CONFIG.WIDTH, 44);
    this.add(bg);

    let x = 16;
    const y = 22;

    // 1. Player Health Bar
    const hpIcon = this.scene.add.image(x + 10, y, 'icon_health').setScale(0.8);
    this.add(hpIcon);

    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.fillStyle(0x262c30, 1);
    this.hpBarBg.fillRect(x + 24, y - 8, 100, 16);
    this.hpBarBg.lineStyle(1, 0x5b676d, 1);
    this.hpBarBg.strokeRect(x + 24, y - 8, 100, 16);
    this.add(this.hpBarBg);

    this.hpBarFill = this.scene.add.graphics();
    this.add(this.hpBarFill);

    this.hpText = this.scene.add.text(x + 74, y, '100/100', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.add(this.hpText);

    this.updateHealth(100, 100);
    x += 140;

    // 2. Weapon Magazine & Reserve Ammo with [Q] switch indicator
    const ammoIcon = this.scene.add.image(x + 10, y, 'icon_ammunition').setScale(0.8);
    this.add(ammoIcon);

    this.weaponLabel = this.scene.add.text(x + 24, y - 8, 'RIFLE [Q]', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffd24a',
      fontStyle: 'bold'
    });
    this.add(this.weaponLabel);

    this.ammoText = this.scene.add.text(x + 24, y + 5, '24 / 80', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.add(this.ammoText);
    x += 115;

    // Divider
    this.createDivider(x, 8, 28);
    x += 16;

    // 3. Resources (Scrap, Metal, Fuel)
    this.resourceDisplays = {};

    const resList = [
      { key: 'scrap', icon: 'icon_scrap', color: '#d6893c' },
      { key: 'metal', icon: 'icon_metal', color: '#929fa5' },
      { key: 'fuel', icon: 'icon_fuel', color: '#ffd24a' }
    ];

    resList.forEach((r) => {
      const icon = this.scene.add.image(x + 10, y, r.icon).setScale(0.75);
      this.add(icon);

      const txt = this.scene.add.text(x + 24, y, '0', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: r.color,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      this.add(txt);

      this.resourceDisplays[r.key] = txt;
      x += 80;
    });

    // 4. Audio mute & pause buttons on top right
    const pauseBtn = this.scene.add.image(GAME_CONFIG.WIDTH - 24, y, 'panel_small')
      .setScale(0.7)
      .setInteractive({ useHandCursor: true });
    const pauseTxt = this.scene.add.text(GAME_CONFIG.WIDTH - 24, y, '||', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d9dacf'
    }).setOrigin(0.5, 0.5);
    pauseBtn.on('pointerdown', () => {
      soundSystem.playClick();
      this.scene.events.emit('toggle-pause');
    });
    this.add(pauseBtn);
    this.add(pauseTxt);

    const soundBtn = this.scene.add.image(GAME_CONFIG.WIDTH - 60, y, 'panel_small')
      .setScale(0.7)
      .setInteractive({ useHandCursor: true });
    this.soundTxt = this.scene.add.text(GAME_CONFIG.WIDTH - 60, y, soundSystem.muted ? 'MUTE' : 'SFX', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: soundSystem.muted ? '#c13a2b' : '#6bae3a'
    }).setOrigin(0.5, 0.5);
    soundBtn.on('pointerdown', () => {
      soundSystem.setMuted(!soundSystem.muted);
      this.soundTxt.setText(soundSystem.muted ? 'MUTE' : 'SFX');
      this.soundTxt.setColor(soundSystem.muted ? '#c13a2b' : '#6bae3a');
    });
    this.add(soundBtn);
    this.add(this.soundTxt);
  }

  createDivider(x, y, height) {
    const d = this.scene.add.graphics();
    d.lineStyle(1, 0x364046, 1);
    d.lineBetween(x, y, x, y + height);
    this.add(d);
  }

  createWaveBar() {
    const x = GAME_CONFIG.WIDTH / 2;
    const y = 64;

    this.waveBanner = this.scene.add.container(x, y);

    const bannerBg = this.scene.add.graphics();
    bannerBg.fillStyle(0x171a1c, 0.9);
    bannerBg.fillRoundedRect(-140, -14, 280, 28, 6);
    bannerBg.lineStyle(1, 0x5b676d, 0.9);
    bannerBg.strokeRoundedRect(-140, -14, 280, 28, 6);
    this.waveBanner.add(bannerBg);

    this.waveText = this.scene.add.text(-125, 0, 'WAVE 1 / 10', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d6893c',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.waveBanner.add(this.waveText);

    this.waveSubText = this.scene.add.text(125, 0, 'PREP: 20s', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    this.waveBanner.add(this.waveSubText);

    this.add(this.waveBanner);

    // Skip prep button
    this.skipButton = this.scene.add.container(x, y + 26);
    const skipBg = this.scene.add.graphics();
    skipBg.fillStyle(0xd6893c, 0.9);
    skipBg.fillRoundedRect(-60, -10, 120, 20, 4);
    skipBg.lineStyle(1, 0xffd24a, 1);
    skipBg.strokeRoundedRect(-60, -10, 120, 20, 4);
    this.skipButton.add(skipBg);

    const skipTxt = this.scene.add.text(0, 0, 'START WAVE >', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#13151a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.skipButton.add(skipTxt);

    this.skipButton.setSize(120, 20);
    this.skipButton.setInteractive(new Phaser.Geom.Rectangle(-60, -10, 120, 20), Phaser.Geom.Rectangle.Contains);
    this.skipButton.on('pointerdown', () => {
      soundSystem.playClick();
      this.scene.events.emit('skip-prep-clicked');
    });

    this.add(this.skipButton);
  }

  createPowerBar() {
    const x = GAME_CONFIG.WIDTH - 150;
    const y = 22;

    this.powerText = this.scene.add.text(x, y, '⚡ 0 / 0 KW', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#7fe3b4',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.add(this.powerText);
  }

  createCommandCenterBar() {
    const x = 16;
    const y = 64;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.85);
    bg.fillRoundedRect(x, y - 12, 180, 24, 4);
    bg.lineStyle(1, 0x5b676d, 0.8);
    bg.strokeRoundedRect(x, y - 12, 180, 24, 4);
    this.add(bg);

    const hqIcon = this.scene.add.image(x + 14, y, 'icon_command_center').setScale(0.65);
    this.add(hqIcon);

    this.hqText = this.scene.add.text(x + 30, y - 4, 'HQ: 1600 / 1600', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d9dacf',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.add(this.hqText);

    this.hqBarFill = this.scene.add.graphics();
    this.add(this.hqBarFill);
    this.updateCommandCenter(1600, 1600);
  }

  updateHealth(curr, max) {
    this.hpText.setText(`${Math.max(0, Math.round(curr))}/${max}`);
    this.hpBarFill.clear();
    const pct = Math.max(0, Math.min(1, curr / max));
    const col = pct > 0.5 ? 0x6bae3a : (pct > 0.25 ? 0xc8a024 : 0xae2b25);
    this.hpBarFill.fillStyle(col, 1);
    this.hpBarFill.fillRect(40, 14, 100 * pct, 16);
  }

  updateCommandCenter(curr, max) {
    if (this.hqText) {
      this.hqText.setText(`HQ: ${Math.max(0, Math.round(curr))} / ${max}`);
    }
    if (this.hqBarFill) {
      this.hqBarFill.clear();
      const pct = Math.max(0, Math.min(1, curr / max));
      const col = pct > 0.5 ? 0x6bae3a : (pct > 0.25 ? 0xc8a024 : 0xae2b25);
      this.hqBarFill.fillStyle(col, 1);
      this.hqBarFill.fillRect(46, 70, 144 * pct, 4);
    }
  }

  updateAmmo(current, reserve, weapon = null) {
    this.ammoText.setText(`${current} / ${reserve}`);
    if (weapon && this.weaponLabel) {
      this.weaponLabel.setText(`${weapon.shortName || weapon.name} [Q]`);
    }
  }

  updateResources(res) {
    if (this.resourceDisplays.scrap) this.resourceDisplays.scrap.setText(`${res.scrap}`);
    if (this.resourceDisplays.metal) this.resourceDisplays.metal.setText(`${res.metal}`);
    if (this.resourceDisplays.fuel) this.resourceDisplays.fuel.setText(`${res.fuel}`);
  }

  updatePower(capacity, demand, isSufficient) {
    this.powerText.setText(`⚡ ${capacity}/${demand} KW`);
    this.powerText.setColor(isSufficient ? '#7fe3b4' : '#c13a2b');
  }

  updateWave(wave, status, count, isPrep) {
    this.waveText.setText(`WAVE ${wave} / 10`);
    if (isPrep) {
      this.waveSubText.setText(`PREP: ${count}s`);
      this.waveSubText.setColor('#ffd24a');
      this.skipButton.setVisible(true);
    } else {
      this.waveSubText.setText(`ENEMIES: ${count}`);
      this.waveSubText.setColor('#ae2b25');
      this.skipButton.setVisible(false);
    }
  }
}
