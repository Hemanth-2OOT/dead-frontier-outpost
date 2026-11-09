/**
 * DEAD FRONTIER: OUTPOST
 * PreloadScene: Robust asset loading and animation registry
 */

import Phaser from 'phaser';
import { ASSET_CONFIG } from '../config/assetConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const base = ASSET_CONFIG.BASE_PATH;

    // Hook HTML progress bar
    const progressBar = document.getElementById('loading-progress');
    this.load.on('progress', (value) => {
      if (progressBar) {
        progressBar.style.width = `${Math.floor(value * 100)}%`;
      }
    });

    // 1. Load Characters (Spritesheets for each animation & direction)
    const dirs = ASSET_CONFIG.DIRECTIONS;
    Object.values(ASSET_CONFIG.CHARACTERS).forEach((char) => {
      char.animations.forEach((anim) => {
        dirs.forEach((dir) => {
          const key = `${char.key}_${anim.key}_${dir}`;
          const file = `${base}spritesheets/characters/${char.key}_${anim.key}_${dir}.png`;
          this.load.spritesheet(key, file, {
            frameWidth: char.frameWidth,
            frameHeight: char.frameHeight
          });
        });
      });
    });

    // 2. Load Buildings
    Object.values(ASSET_CONFIG.BUILDINGS).forEach((b) => {
      if (b.isTurret) {
        this.load.image(`${b.key}_base`, `${base}${b.base}`);
        this.load.image(`${b.key}_barrel`, `${base}${b.barrel}`);
        this.load.image(`${b.key}_baseDamaged`, `${base}${b.baseDamaged}`);
        this.load.image(`${b.key}_barrelDamaged`, `${base}${b.barrelDamaged}`);
        this.load.image(`${b.key}_destroyed`, `${base}${b.destroyed}`);
        if (b.recoilSheet) {
          this.load.spritesheet(`${b.key}_recoil`, `${base}${b.recoilSheet}`, {
            frameWidth: b.width,
            frameHeight: b.height
          });
        }
      } else {
        if (b.normal) this.load.image(`${b.key}_normal`, `${base}${b.normal}`);
        if (b.damaged) this.load.image(`${b.key}_damaged`, `${base}${b.damaged}`);
        if (b.critical) this.load.image(`${b.key}_critical`, `${base}${b.critical}`);
        if (b.destroyed) this.load.image(`${b.key}_destroyed`, `${base}${b.destroyed}`);
        if (b.triggered) this.load.image(`${b.key}_triggered`, `${base}${b.triggered}`);
        if (b.hasActiveAnim && b.activeSheet) {
          this.load.spritesheet(`${b.key}_active`, `${base}${b.activeSheet}`, {
            frameWidth: b.width,
            frameHeight: b.height
          });
        }
      }
    });

    // 3. Load Effects
    ASSET_CONFIG.EFFECTS.forEach((fx) => {
      this.load.spritesheet(fx.key, `${base}${fx.file}`, {
        frameWidth: fx.frameWidth,
        frameHeight: fx.frameHeight
      });
    });

    // 4. Load Environment
    ASSET_CONFIG.TERRAIN.forEach((t) => {
      this.load.image(t, `${base}environment/terrain/${t}.png`);
    });
    ASSET_CONFIG.ROADS.forEach((r) => {
      this.load.image(r, `${base}environment/roads/${r}.png`);
    });
    ASSET_CONFIG.VEGETATION.forEach((v) => {
      this.load.image(v, `${base}environment/vegetation/${v}.png`);
    });
    ASSET_CONFIG.DEBRIS.forEach((d) => {
      this.load.image(d, `${base}environment/debris/${d}.png`);
    });
    ASSET_CONFIG.PROPS.forEach((p) => {
      this.load.image(p, `${base}environment/props/${p}.png`);
    });

    // 5. Load UI Elements & Icons
    ASSET_CONFIG.UI_ICONS.forEach((icon) => {
      this.load.image(icon, `${base}ui/icons/${icon}.png`);
    });
    ASSET_CONFIG.UI_ELEMENTS.forEach((el) => {
      this.load.image(el.key, `${base}${el.file}`);
    });
    ASSET_CONFIG.UI_ANIMATED.forEach((uiAnim) => {
      this.load.spritesheet(uiAnim.key, `${base}${uiAnim.file}`, {
        frameWidth: uiAnim.frameWidth,
        frameHeight: uiAnim.frameHeight
      });
    });
  }

  create() {
    this.createCharacterAnimations();
    this.createBuildingAnimations();
    this.createEffectAnimations();
    this.createUIAnimations();

    // Hide HTML loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 300);
    }

    // Start with MenuScene
    this.scene.start('MenuScene');
  }

  createCharacterAnimations() {
    const dirs = ASSET_CONFIG.DIRECTIONS;
    Object.values(ASSET_CONFIG.CHARACTERS).forEach((char) => {
      char.animations.forEach((anim) => {
        dirs.forEach((dir) => {
          const animKey = `${char.key}_${anim.key}_${dir}`;
          if (!this.anims.exists(animKey)) {
            this.anims.create({
              key: animKey,
              frames: this.anims.generateFrameNumbers(animKey, {
                start: 0,
                end: anim.frames - 1
              }),
              frameRate: anim.fps,
              repeat: anim.loop ? -1 : 0
            });
          }
        });
      });
    });
  }

  createBuildingAnimations() {
    Object.values(ASSET_CONFIG.BUILDINGS).forEach((b) => {
      if (b.hasActiveAnim && b.activeSheet) {
        const key = `${b.key}_active_anim`;
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(`${b.key}_active`, {
              start: 0,
              end: b.activeFrames - 1
            }),
            frameRate: b.key === 'mine' ? 2 : 6,
            repeat: -1
          });
        }
      }
      if (b.isTurret && b.recoilSheet) {
        const key = `${b.key}_recoil_anim`;
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(`${b.key}_recoil`, {
              start: 0,
              end: b.recoilFrames - 1
            }),
            frameRate: 16,
            repeat: 0
          });
        }
      }
    });
  }

  createEffectAnimations() {
    ASSET_CONFIG.EFFECTS.forEach((fx) => {
      const animKey = `${fx.key}_anim`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(fx.key, {
            start: 0,
            end: fx.frames - 1
          }),
          frameRate: fx.fps,
          repeat: fx.loop ? -1 : 0
        });
      }
    });
  }

  createUIAnimations() {
    ASSET_CONFIG.UI_ANIMATED.forEach((uiAnim) => {
      const animKey = `${uiAnim.key}_anim`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(uiAnim.key, {
            start: 0,
            end: uiAnim.frames - 1
          }),
          frameRate: uiAnim.fps,
          repeat: -1
        });
      }
    });
  }
}
