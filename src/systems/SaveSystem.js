/**
 * DEAD FRONTIER: OUTPOST
 * Local Save & Persistence System (Versioned & Error-Resilient)
 */

import { Turret } from '../entities/Turret.js';
import { Building } from '../entities/Building.js';
import { ASSET_CONFIG } from '../config/assetConfig.js';
import { BALANCE } from '../config/balanceConfig.js';

const SAVE_KEY = 'dead_frontier_outpost_save';
const SAVE_VERSION = 1;

export class SaveSystem {
  constructor(scene) {
    this.scene = scene;
  }

  hasValidSave() {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return false;
      const parsed = JSON.parse(data);
      return parsed && parsed.version === SAVE_VERSION;
    } catch (e) {
      return false;
    }
  }

  saveGame() {
    if (!this.scene.player || this.scene.player.isDead) return;

    try {
      const buildingsData = this.scene.buildingSystem.getActiveBuildings().map((b) => ({
        tileX: b.tileX,
        tileY: b.tileY,
        type: b.buildingType,
        health: b.health,
        maxHealth: b.maxHealth,
        currentAmmo: b.isTurret ? b.currentAmmo : undefined,
        internalInventory: { ...b.internalInventory }
      }));

      const saveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        player: {
          x: this.scene.player.x,
          y: this.scene.player.y,
          health: this.scene.player.health,
          currentAmmo: this.scene.player.currentAmmo
        },
        resources: { ...this.scene.resourceSystem.resources },
        upgrades: { ...(this.scene.upgrades || {}) },
        wave: {
          number: this.scene.waveSystem.currentWaveNumber
        },
        buildings: buildingsData
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      this.scene.events.emit('game-saved');
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.version !== SAVE_VERSION) return false;

      // Restore resources
      if (data.resources && typeof data.resources === 'object') {
        this.scene.resourceSystem.resources = {
          scrap: Number(data.resources.scrap) || 0,
          metal: Number(data.resources.metal) || 0,
          fuel: Number(data.resources.fuel) || 0,
          ammunition: Number(data.resources.ammunition) || 0
        };
        this.scene.resourceSystem.emitResourceChange();
      }

      // Restore upgrades
      if (data.upgrades && typeof data.upgrades === 'object') {
        this.scene.upgrades = {
          armor: Number(data.upgrades.armor) || 0,
          turrets: Number(data.upgrades.turrets) || 0,
          automation: Number(data.upgrades.automation) || 0,
          speed: Number(data.upgrades.speed) || 0
        };
        const speedLvl = this.scene.upgrades.speed;
        if (speedLvl > 0 && BALANCE.UPGRADES.speed?.levels[speedLvl - 1]) {
          const tier = BALANCE.UPGRADES.speed.levels[speedLvl - 1];
          if (this.scene.player) {
            this.scene.player.speedMultiplier = tier.speedMultiplier;
            this.scene.player.reloadMultiplier = tier.reloadMultiplier;
          }
        }
      }

      // Restore wave
      if (data.wave && typeof data.wave.number === 'number') {
        this.scene.waveSystem.currentWaveNumber = Math.max(1, Math.min(10, data.wave.number));
      }

      // Restore player
      if (data.player && this.scene.player) {
        if (typeof data.player.x === 'number' && typeof data.player.y === 'number') {
          this.scene.player.setPosition(data.player.x, data.player.y);
        }
        if (typeof data.player.health === 'number') {
          this.scene.player.health = Math.max(1, data.player.health);
        }
        if (typeof data.player.currentAmmo === 'number') {
          this.scene.player.currentAmmo = data.player.currentAmmo;
        }
        this.scene.events.emit('player-health-changed', {
          current: this.scene.player.health,
          max: this.scene.player.maxHealth
        });
        this.scene.events.emit('player-ammo-changed', {
          current: this.scene.player.currentAmmo,
          reserve: this.scene.resourceSystem.resources.ammunition
        });
      }

      // Restore buildings
      if (data.buildings && Array.isArray(data.buildings)) {
        const existing = [...this.scene.buildingSystem.buildings];
        existing.forEach((b) => {
          if (b.buildingType !== 'command_center') {
            this.scene.buildingSystem.removeBuilding(b);
            b.destroy();
          }
        });

        data.buildings.forEach((bData) => {
          if (!bData || !bData.type) return;

          if (bData.type === 'command_center') {
            if (this.scene.buildingSystem.commandCenter) {
              this.scene.buildingSystem.commandCenter.health = Math.max(1, bData.health || 1600);
              this.scene.buildingSystem.commandCenter.updateHealthBar();
              this.scene.events.emit('command-center-health-changed', {
                current: this.scene.buildingSystem.commandCenter.health,
                max: this.scene.buildingSystem.commandCenter.maxHealth
              });
            }
          } else {
            const meta = ASSET_CONFIG.BUILDINGS[bData.type];
            if (!meta) return;

            let b;
            if (meta.isTurret) {
              b = new Turret(this.scene, bData.tileX, bData.tileY, bData.type);
              if (typeof bData.currentAmmo === 'number') {
                b.currentAmmo = bData.currentAmmo;
              }
            } else {
              b = new Building(this.scene, bData.tileX, bData.tileY, bData.type);
            }

            if (typeof bData.health === 'number') {
              b.health = Math.max(1, bData.health);
            }
            if (bData.internalInventory) {
              b.internalInventory = { ...bData.internalInventory };
            }
            b.updateHealthBar();
            this.scene.buildingSystem.registerBuilding(b);
          }
        });
      }

      return true;
    } catch (e) {
      console.error('Failed to load save data:', e);
      return false;
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  }
}
