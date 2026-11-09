/**
 * DEAD FRONTIER: OUTPOST
 * GameScene: Primary gameplay loop, world generation, player controls & system orchestration
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { Player } from '../entities/Player.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { BuildingSystem } from '../systems/BuildingSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { PowerSystem } from '../systems/PowerSystem.js';
import { AutomationSystem } from '../systems/AutomationSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(data) {
    // 1. Setup World Boundaries
    const worldW = GAME_CONFIG.WORLD_WIDTH;
    const worldH = GAME_CONFIG.WORLD_HEIGHT;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // 2. Build Industrial Environment
    this.createWorldEnvironment();

    // 3. Spawn Player near Command Center
    const spawnX = GAME_CONFIG.BASE_CENTER_TILE.x * GAME_CONFIG.TILE_SIZE + 16;
    const spawnY = (GAME_CONFIG.BASE_CENTER_TILE.y + 3) * GAME_CONFIG.TILE_SIZE + 16;
    this.player = new Player(this, spawnX, spawnY);
    this.player.setDepth(10);

    // Player collides with strategic environmental props
    this.physics.add.collider(this.player, this.propGroup);

    // 4. Initialize Core Systems & Tech Upgrades
    this.upgrades = {
      armor: 0,
      turrets: 0,
      automation: 0,
      speed: 0
    };

    this.combatSystem = new CombatSystem(this);
    this.resourceSystem = new ResourceSystem(this);
    this.buildingSystem = new BuildingSystem(this);
    this.powerSystem = new PowerSystem(this);
    this.automationSystem = new AutomationSystem(this);
    this.waveSystem = new WaveSystem(this);
    this.saveSystem = new SaveSystem(this);

    // Setup Atmospheric Lighting Layer
    this.setupAtmosphericLighting();

    // 5. Camera Follow
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 6. Launch parallel UIScene
    this.scene.launch('UIScene');

    // 7. Check if loading saved game
    if (data && data.loadSave) {
      this.time.delayedCall(100, () => {
        this.saveSystem.loadGame();
      });
    }

    // Initial event emissions for HUD sync
    this.time.delayedCall(50, () => {
      this.resourceSystem.emitResourceChange();
      this.events.emit('player-health-changed', {
        current: this.player.health,
        max: this.player.maxHealth
      });
      this.events.emit('player-ammo-changed', {
        current: this.player.currentAmmo,
        reserve: this.resourceSystem.resources.ammunition
      });
      if (this.buildingSystem.commandCenter) {
        this.events.emit('command-center-health-changed', {
          current: this.buildingSystem.commandCenter.health,
          max: this.buildingSystem.commandCenter.maxHealth
        });
      }
    });

    // 8. Shooting Input Listener
    this.input.on('pointerdown', (pointer) => {
      const isLeft = pointer.button === 0 || (pointer.leftButtonDown && pointer.leftButtonDown());
      if (isLeft && !this.buildingSystem.selectedBuildingType) {
        if (!this.isPointerOverUI(pointer.x, pointer.y)) {
          this.tryPlayerShoot();
        }
      }
    });
  }

  isPointerOverUI(screenX, screenY) {
    const uiScene = this.scene.get('UIScene');
    if (uiScene && typeof uiScene.isPointerOverUI === 'function') {
      return uiScene.isPointerOverUI(screenX, screenY);
    }
    return screenY <= 48 || screenY >= GAME_CONFIG.HEIGHT - 64;
  }

  tryPlayerShoot() {
    if (this.buildingSystem.selectedBuildingType) return;
    const pointer = this.input.activePointer;
    if (this.isPointerOverUI(pointer.x, pointer.y)) return;

    const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.player.shoot(wp.x, wp.y, this.time.now);
  }

  createWorldEnvironment() {
    const ts = GAME_CONFIG.TILE_SIZE;
    const mw = GAME_CONFIG.MAP_WIDTH_TILES;
    const mh = GAME_CONFIG.MAP_HEIGHT_TILES;

    // Ground tile layer
    for (let ty = 0; ty < mh; ty++) {
      for (let tx = 0; tx < mw; tx++) {
        const x = tx * ts + ts / 2;
        const y = ty * ts + ts / 2;

        let tileKey = 'dirt_0';

        // Base outpost central compound (tiles 20 to 44)
        if (tx >= 22 && tx <= 42 && ty >= 22 && ty <= 42) {
          if ((tx + ty) % 2 === 0) {
            tileKey = 'industrial_floor_0';
          } else {
            tileKey = 'concrete_0';
          }
          // Center pad under command center
          if (tx >= 28 && tx <= 33 && ty >= 28 && ty <= 33) {
            tileKey = 'concrete_slab';
          }
        }
        // Main crossroad asphalt
        else if (tx >= 29 && tx <= 32) {
          tileKey = 'road_center_v';
        } else if (ty >= 29 && ty <= 32) {
          tileKey = 'road_center_h';
        }
        // Perimeter wasteland
        else {
          const rand = (Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453) % 1;
          if (rand > 0.65) tileKey = 'grass_0';
          else if (rand > 0.45) tileKey = 'dirt_1';
          else if (rand > 0.25) tileKey = 'cracked_concrete';
          else tileKey = 'dirt_0';
        }

        const t = this.add.image(x, y, tileKey);
        t.setDepth(0);
      }
    }

    // Static environmental props group with collision
    this.propGroup = this.physics.add.staticGroup();

    // Place strategic props, scrap deposits & obstacles
    const props = [
      // Base perimeter sandbags & barriers
      { x: 23 * ts, y: 24 * ts, key: 'sandbags_line' },
      { x: 41 * ts, y: 24 * ts, key: 'sandbags_line' },
      { x: 23 * ts, y: 40 * ts, key: 'sandbags_line' },
      { x: 41 * ts, y: 40 * ts, key: 'sandbags_line' },
      { x: 22 * ts, y: 23 * ts, key: 'sandbags_corner' },
      { x: 42 * ts, y: 23 * ts, key: 'sandbags_corner' },

      // Scrap deposits around the outpost
      { x: 20 * ts, y: 28 * ts, key: 'scrap_pile_0' },
      { x: 20 * ts, y: 35 * ts, key: 'scrap_pile_1' },
      { x: 44 * ts, y: 27 * ts, key: 'scrap_pile_1' },
      { x: 44 * ts, y: 36 * ts, key: 'scrap_pile_0' },

      // Barrels
      { x: 25 * ts, y: 26 * ts, key: 'barrel_rust' },
      { x: 25 * ts + 16, y: 26 * ts, key: 'barrel_green' },
      { x: 39 * ts, y: 38 * ts, key: 'barrel_toxic' },

      // Machinery & Streetlights
      { x: 27 * ts, y: 24 * ts, key: 'streetlight' },
      { x: 37 * ts, y: 24 * ts, key: 'streetlight' },
      { x: 27 * ts, y: 40 * ts, key: 'streetlight' },
      { x: 37 * ts, y: 40 * ts, key: 'streetlight' },
      { x: 18 * ts, y: 22 * ts, key: 'ruined_machine_0' },
      { x: 46 * ts, y: 42 * ts, key: 'ruined_machine_1' },

      // Vehicle wrecks on roads
      { x: 31 * ts, y: 16 * ts, key: 'car_wreck' },
      { x: 15 * ts, y: 31 * ts, key: 'van_wreck' },
      { x: 48 * ts, y: 30 * ts, key: 'jeep_burnt' },

      // Supply Crates
      { x: 26 * ts, y: 36 * ts, key: 'crate_wood_l' },
      { x: 38 * ts, y: 26 * ts, key: 'military_box_l' }
    ];

    props.forEach((p) => {
      const prop = this.propGroup.create(p.x, p.y, p.key);
      prop.setDepth(1);
      // Mark tile cells as blocked in building system
      const tx = Math.floor(p.x / ts);
      const ty = Math.floor(p.y / ts);
      this.time.delayedCall(10, () => {
        if (this.buildingSystem) {
          this.buildingSystem.blockedCells.add(`${tx},${ty}`);
        }
      });
    });
  }

  update(time, delta) {
    if (this.player && !this.player.isDead) {
      this.player.update(time, delta);

      // Continuous firing if left mouse held down and not over UI
      const pointer = this.input.activePointer;
      const isLeft = pointer.button === 0 || (pointer.leftButtonDown && pointer.leftButtonDown());
      if (pointer.isDown && isLeft && !this.buildingSystem.selectedBuildingType) {
        if (!this.isPointerOverUI(pointer.x, pointer.y)) {
          if (this.player.canShoot(time)) {
            this.tryPlayerShoot();
          }
        }
      }
    }

    if (this.combatSystem) this.combatSystem.update();
    if (this.resourceSystem) this.resourceSystem.update(time, delta);
    if (this.buildingSystem) this.buildingSystem.update(time, delta);
    if (this.powerSystem) this.powerSystem.update(time, delta);
    if (this.automationSystem) this.automationSystem.update(time, delta);
    if (this.waveSystem) this.waveSystem.update(time, delta);

    this.updateAtmosphericLighting();
  }

  setupAtmosphericLighting() {
    this.ambientDarkness = 0.35;
    this.ambientGraphics = this.add.graphics();
    this.ambientGraphics.setDepth(15);
    this.ambientGraphics.setScrollFactor(0);

    this.lightGraphics = this.add.graphics();
    this.lightGraphics.setDepth(16);
    this.lightGraphics.setBlendMode(Phaser.BlendModes.ADD);
  }

  updateAtmosphericLighting() {
    if (!this.ambientGraphics || !this.lightGraphics) return;

    const cam = this.cameras.main;
    const isWaveActive = this.waveSystem?.isWaveActive;
    const targetDarkness = isWaveActive ? 0.62 : 0.32;
    this.ambientDarkness = Phaser.Math.Linear(this.ambientDarkness, targetDarkness, 0.04);

    // 1. Draw smooth ambient darkness over screen
    this.ambientGraphics.clear();
    this.ambientGraphics.fillStyle(0x06080e, this.ambientDarkness);
    this.ambientGraphics.fillRect(0, 0, cam.width, cam.height);

    // 2. Draw additive lights in world coordinates
    this.lightGraphics.clear();

    // Player flashlight cone & personal lantern
    if (this.player && !this.player.isDead) {
      const px = this.player.x;
      const py = this.player.y;

      // Personal lantern
      this.lightGraphics.fillStyle(0xfff3d6, 0.18);
      this.lightGraphics.fillCircle(px, py, 50);

      // Flashlight cone in aiming direction
      const pointer = this.input.activePointer;
      const wp = cam.getWorldPoint(pointer.x, pointer.y);
      const aimAngle = Phaser.Math.Angle.Between(px, py, wp.x, wp.y);
      const coneLength = 260;
      const halfAngle = 0.32; // ~18 degrees half-width

      this.lightGraphics.fillStyle(0xfff5d8, 0.14);
      this.lightGraphics.beginPath();
      this.lightGraphics.moveTo(px, py);
      this.lightGraphics.lineTo(
        px + Math.cos(aimAngle - halfAngle) * coneLength,
        py + Math.sin(aimAngle - halfAngle) * coneLength
      );
      this.lightGraphics.arc(px, py, coneLength, aimAngle - halfAngle, aimAngle + halfAngle, false);
      this.lightGraphics.closePath();
      this.lightGraphics.fillPath();
    }

    // Command Center floodlight glow
    if (this.buildingSystem?.commandCenter && !this.buildingSystem.commandCenter.isDestroyed) {
      const cc = this.buildingSystem.commandCenter;
      this.lightGraphics.fillStyle(0x38bdf8, 0.12);
      this.lightGraphics.fillCircle(cc.x, cc.y, 130);
      this.lightGraphics.fillStyle(0xffffff, 0.08);
      this.lightGraphics.fillCircle(cc.x, cc.y, 80);
    }

    // Active generators electric amber glow
    if (this.buildingSystem) {
      const buildings = this.buildingSystem.getActiveBuildings();
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        if (b.buildingType === 'generator' && b.internalInventory.fuel > 0) {
          this.lightGraphics.fillStyle(0xffa834, 0.22);
          this.lightGraphics.fillCircle(b.x, b.y, 90);
        }
      }
    }
  }

  getUpgradeLevel(id) {
    return this.upgrades?.[id] || 0;
  }

  getUpgradeMultiplier(id, propName) {
    const lvl = this.upgrades?.[id] || 0;
    if (lvl <= 0) return 1.0;
    const upgradeData = BALANCE.UPGRADES[id];
    if (!upgradeData || !upgradeData.levels[lvl - 1]) return 1.0;
    return upgradeData.levels[lvl - 1][propName] ?? 1.0;
  }

  getUpgradeBonus(id, propName) {
    const lvl = this.upgrades?.[id] || 0;
    if (lvl <= 0) return 0;
    const upgradeData = BALANCE.UPGRADES[id];
    if (!upgradeData || !upgradeData.levels[lvl - 1]) return 0;
    return upgradeData.levels[lvl - 1][propName] ?? 0;
  }

  researchUpgrade(id) {
    const upgrade = BALANCE.UPGRADES[id];
    if (!upgrade) return false;
    const currentLvl = this.upgrades[id] || 0;
    if (currentLvl >= upgrade.maxLevel) return false;

    const nextTier = upgrade.levels[currentLvl];
    if (!this.resourceSystem.canAfford(nextTier.cost)) {
      soundSystem.playError();
      return false;
    }

    // Deduct cost
    if (nextTier.cost.scrap) this.resourceSystem.deductResource('scrap', nextTier.cost.scrap);
    if (nextTier.cost.metal) this.resourceSystem.deductResource('metal', nextTier.cost.metal);

    this.upgrades[id] = currentLvl + 1;
    const newLvl = this.upgrades[id];

    // Apply specific upgrade effects
    if (id === 'armor') {
      const prevHpMult = currentLvl > 0 ? upgrade.levels[currentLvl - 1].hpMultiplier : 1.0;
      const newHpMult = nextTier.hpMultiplier;
      const ratio = newHpMult / prevHpMult;
      const activeBuildings = this.buildingSystem.getActiveBuildings();
      activeBuildings.forEach((b) => {
        b.maxHealth = Math.round(b.maxHealth * ratio);
        b.health = Math.round(b.health * ratio);
        b.updateHealthBar();
      });
      if (this.buildingSystem.commandCenter) {
        this.events.emit('command-center-health-changed', {
          current: this.buildingSystem.commandCenter.health,
          max: this.buildingSystem.commandCenter.maxHealth
        });
      }
    } else if (id === 'turrets') {
      const activeTurrets = this.buildingSystem.getActiveBuildings().filter((b) => b.isTurret);
      activeTurrets.forEach((t) => {
        t.range = t.getRange ? t.getRange() : Math.round(t.balanceMeta.attackRange * nextTier.rangeMultiplier);
      });
    } else if (id === 'speed') {
      if (this.player) {
        this.player.speedMultiplier = nextTier.speedMultiplier;
        this.player.reloadMultiplier = nextTier.reloadMultiplier;
      }
    }

    soundSystem.playUpgrade();
    if (this.buildingSystem.commandCenter) {
      this.combatSystem.spawnFloatingText(
        this.buildingSystem.commandCenter.x,
        this.buildingSystem.commandCenter.y - 45,
        `TECH RESEARCHED: ${upgrade.name} (LVL ${newLvl})!`,
        '#6bae3a'
      );
    }

    this.events.emit('upgrade-unlocked', { id, level: newLvl });
    return true;
  }
}
