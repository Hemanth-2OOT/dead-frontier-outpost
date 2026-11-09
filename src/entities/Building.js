/**
 * DEAD FRONTIER: OUTPOST
 * Base Building Entity: Grid Placement, Static Physics Body, Health, Production
 */

import Phaser from 'phaser';
import { ASSET_CONFIG } from '../config/assetConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';
import { GridUtils } from '../utils/GridUtils.js';

export class Building extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, tileX, tileY, buildingType) {
    const assetMeta = ASSET_CONFIG.BUILDINGS[buildingType];
    const balanceMeta = buildingType === 'command_center'
      ? BALANCE.COMMAND_CENTER
      : BALANCE.BUILDINGS[buildingType];

    const center = GridUtils.tileToWorldCenter(tileX, tileY, assetMeta.gridWidth, assetMeta.gridHeight);
    const initialTexture = assetMeta.isTurret ? `${buildingType}_base` : `${buildingType}_normal`;
    super(scene, center.x, center.y, initialTexture);

    scene.add.existing(this);
    if (buildingType !== 'mine') {
      scene.physics.add.existing(this, true); // Static arcade body only for solid obstacles
    }

    this.tileX = tileX;
    this.tileY = tileY;
    this.buildingType = buildingType;
    this.assetMeta = assetMeta;
    this.balanceMeta = balanceMeta;

    this.gridWidth = assetMeta.gridWidth;
    this.gridHeight = assetMeta.gridHeight;
    this.width = assetMeta.width;
    this.height = assetMeta.height;

    // Health
    this.maxHealth = balanceMeta.health ?? balanceMeta.maxHealth ?? 300;
    this.health = this.maxHealth;
    this.isDestroyed = false;

    // Power & Automation state
    this.hasPower = true;
    this.powerDemand = balanceMeta.powerDemand ?? 0;
    this.powerOutput = balanceMeta.powerOutput ?? 0;
    this.productionTimer = 0;
    this.internalInventory = {
      scrap: 0,
      metal: 0,
      fuel: balanceMeta.startingFuel ?? 0,
      ammunition: balanceMeta.maxAmmoStorage ?? 0
    };

    // Configure static physics body
    if (this.body) {
      this.body.setSize(this.width - 4, this.height - 4);
      this.body.setOffset(2, 2);
    }

    // Interactive bounds for clicking building inspection (unless currently placing another structure)
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', (pointer) => {
      const isLeft = pointer.button === 0 || (pointer.leftButtonDown && pointer.leftButtonDown());
      if (isLeft && !this.scene.buildingSystem?.selectedBuildingType) {
        this.scene.events.emit('building-selected', this);
      }
    });

    // If active anim exists, start playing
    if (assetMeta.hasActiveAnim && scene.anims.exists(`${buildingType}_active_anim`)) {
      this.play(`${buildingType}_active_anim`);
    }

    // Health bar graphics positioned above building
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(12);
    this.healthBar.setVisible(false);

    // Mine specific setup
    if (buildingType === 'mine') {
      this.isArmed = false;
      this.scene.time.delayedCall(balanceMeta.armDelayMs, () => {
        this.isArmed = true;
        if (this.scene && this.scene.anims.exists('mine_active_anim')) {
          this.play('mine_active_anim');
        }
      });
    }
  }

  update(time, delta) {
    if (this.isDestroyed || !this.active) return;

    // Building specific logic
    switch (this.buildingType) {
      case 'scrap_collector':
        this.updateScrapCollector(delta);
        break;
      case 'generator':
        this.updateGenerator(delta);
        break;
      case 'ammo_factory':
        this.updateAmmoFactory(delta);
        break;
      case 'repair_station':
        this.updateRepairStation(delta);
        break;
      case 'mine':
        this.updateMine();
        break;
    }
  }

  updateScrapCollector(delta) {
    this.productionTimer += delta;
    if (this.productionTimer >= this.balanceMeta.productionIntervalMs) {
      this.productionTimer = 0;

      // Check proximity to scrap deposits
      const isNearDeposit = this.checkNearDeposit();
      const amount = isNearDeposit ? this.balanceMeta.outputAmount : 1;

      this.scene.resourceSystem.addResource('scrap', amount);
      this.scene.combatSystem.spawnFloatingText(
        this.x,
        this.y - 20,
        `+${amount} Scrap`,
        '#d6893c'
      );
    }
  }

  checkNearDeposit() {
    if (!this.scene.propGroup) return true;
    const props = this.scene.propGroup.getChildren();
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      if (p.texture && p.texture.key && p.texture.key.startsWith('scrap_pile')) {
        const d = GridUtils.distance(this.x, this.y, p.x, p.y);
        if (d <= 140) return true;
      }
    }
    return false;
  }

  updateGenerator(delta) {
    // Burn fuel to provide electricity
    if (this.internalInventory.fuel > 0) {
      this.productionTimer += delta;
      if (this.productionTimer >= this.balanceMeta.fuelBurnIntervalMs) {
        this.productionTimer = 0;
        this.internalInventory.fuel = Math.max(0, this.internalInventory.fuel - this.balanceMeta.fuelPerTick);
      }
      this.isGeneratingPower = true;
      if (this.anims && !this.anims.isPlaying) {
        this.play('generator_active_anim');
      }
    } else {
      // Auto-refuel from global resource supply if available
      const rs = this.scene.resourceSystem;
      if (rs && rs.resources.fuel >= 5) {
        rs.deductResource('fuel', 5);
        this.internalInventory.fuel += 5;
        this.isGeneratingPower = true;
        this.scene.combatSystem.spawnFloatingText(this.x, this.y - 20, '+5 Fuel (Auto)', '#ffd24a');
        if (this.anims && !this.anims.isPlaying) {
          this.play('generator_active_anim');
        }
      } else {
        this.isGeneratingPower = false;
        if (this.anims && this.anims.isPlaying) {
          this.stop();
          this.setTexture('generator_normal');
        }
      }
    }
  }

  updateAmmoFactory(delta) {
    if (!this.hasPower) {
      if (this.anims && this.anims.isPlaying) {
        this.stop();
        this.setTexture('ammo_factory_normal');
      }
      return;
    }

    const intervalMult = this.scene.getUpgradeMultiplier ? this.scene.getUpgradeMultiplier('automation', 'intervalMultiplier') : 1.0;
    const bonusAmmo = this.scene.getUpgradeBonus ? this.scene.getUpgradeBonus('automation', 'bonusAmmo') : 0;
    const effectiveInterval = Math.round(this.balanceMeta.productionIntervalMs * intervalMult);

    this.productionTimer += delta;
    if (this.productionTimer >= effectiveInterval) {
      this.productionTimer = 0;

      // Check global resources
      const rs = this.scene.resourceSystem;
      const cost = this.balanceMeta.inputCost;
      if (rs.canAfford(cost)) {
        rs.deductResource('scrap', cost.scrap);
        rs.deductResource('metal', cost.metal);
        const totalYield = this.balanceMeta.outputAmmunition + bonusAmmo;
        rs.addResource('ammunition', totalYield);
        this.scene.combatSystem.spawnFloatingText(this.x, this.y - 20, `+${totalYield} Ammo`, '#c8a024');

        if (this.anims && !this.anims.isPlaying) {
          this.play('ammo_factory_active_anim');
        }
      }
    }
  }

  updateRepairStation(delta) {
    if (!this.hasPower) return;

    this.productionTimer += delta;
    if (this.productionTimer >= this.balanceMeta.intervalMs) {
      this.productionTimer = 0;
      const rs = this.scene.resourceSystem;

      // Find nearest damaged structure in repair radius
      const targets = this.scene.buildingSystem.getActiveBuildings();
      let bestTarget = null;
      let lowestHealthPct = 1.0;

      for (let i = 0; i < targets.length; i++) {
        const b = targets[i];
        if (b === this || b.isDestroyed) continue;
        const d = GridUtils.distance(this.x, this.y, b.x, b.y);
        if (d <= this.balanceMeta.repairRadius && b.health < b.maxHealth) {
          const pct = b.health / b.maxHealth;
          if (pct < lowestHealthPct) {
            lowestHealthPct = pct;
            bestTarget = b;
          }
        }
      }

      if (bestTarget && rs.resources.scrap >= this.balanceMeta.scrapCostPerTick) {
        rs.deductResource('scrap', this.balanceMeta.scrapCostPerTick);
        bestTarget.repair(this.balanceMeta.repairAmountPerTick);
        this.scene.combatSystem.spawnRepairBeam(this.x, this.y - 12, bestTarget.x, bestTarget.y);
        this.scene.combatSystem.spawnFloatingText(bestTarget.x, bestTarget.y - 15, `+${this.balanceMeta.repairAmountPerTick} HP`, '#6bae3a');
      }
    }
  }

  updateMine() {
    if (!this.isArmed || this.isDestroyed) return;

    // Check if any zombie stepped inside trigger radius
    const zombies = this.scene.waveSystem.getActiveZombies();
    for (let i = 0; i < zombies.length; i++) {
      const z = zombies[i];
      if (z.isDead) continue;
      const d = GridUtils.distance(this.x, this.y, z.x, z.y);
      if (d <= this.balanceMeta.triggerRadius) {
        this.detonateMine();
        break;
      }
    }
  }

  detonateMine() {
    this.isDestroyed = true;
    soundSystem.playExplosion();

    // Spawn explosion fx
    this.scene.combatSystem.spawnMineExplosion(this.x, this.y);

    // Area damage
    const zombies = this.scene.waveSystem.getActiveZombies();
    const rad = this.balanceMeta.explosionRadius;
    zombies.forEach((z) => {
      if (z.isDead) return;
      const d = GridUtils.distance(this.x, this.y, z.x, z.y);
      if (d <= rad) {
        const falloff = 1 - (d / rad) * 0.4;
        z.takeDamage(Math.round(this.balanceMeta.damage * falloff));
      }
    });

    // Texture to triggered crater
    this.stop();
    this.setTexture('mine_triggered');
    if (this.body) this.body.enable = false;

    // Remove from active buildings list
    this.scene.buildingSystem.removeBuilding(this);

    // Fade crater after 8s
    this.scene.time.delayedCall(8000, () => {
      if (this.scene) {
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 1000,
          onComplete: () => this.destroy()
        });
      }
    });
  }

  takeDamage(amount) {
    if (this.isDestroyed) return;

    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();

    // Visual damage smoke / impact
    this.scene.combatSystem.spawnBuildingDamageImpact(this.x, this.y);

    // Sync Command Center health with HUD
    if (this.buildingType === 'command_center') {
      this.scene.events.emit('command-center-health-changed', {
        current: this.health,
        max: this.maxHealth
      });
    }

    // Update texture based on damage state
    const pct = this.health / this.maxHealth;
    if (pct <= 0) {
      this.destroyBuilding();
    } else if (pct < 0.35) {
      if (this.buildingType === 'wall') {
        this.setTexture('wall_critical');
      } else {
        const damagedKey = `${this.buildingType}_damaged`;
        if (this.scene.textures.exists(damagedKey)) {
          this.setTexture(damagedKey);
        }
      }
    } else if (pct < 0.7) {
      const damagedKey = `${this.buildingType}_damaged`;
      if (this.scene.textures.exists(damagedKey)) {
        this.setTexture(damagedKey);
      }
    }
  }

  repair(amount) {
    if (this.isDestroyed) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.updateHealthBar();

    // Sync Command Center health with HUD
    if (this.buildingType === 'command_center') {
      this.scene.events.emit('command-center-health-changed', {
        current: this.health,
        max: this.maxHealth
      });
    }

    const pct = this.health / this.maxHealth;
    if (pct >= 0.7) {
      if (this.assetMeta.hasActiveAnim && this.scene.anims.exists(`${this.buildingType}_active_anim`)) {
        this.play(`${this.buildingType}_active_anim`, true);
      } else {
        this.setTexture(`${this.buildingType}_normal`);
      }
    }
  }

  updateHealthBar() {
    if (!this.healthBar) return;
    this.healthBar.clear();
    if (this.health >= this.maxHealth || this.isDestroyed) {
      this.healthBar.setVisible(false);
      return;
    }
    this.healthBar.setVisible(true);
    const barWidth = this.width - 12;
    const barHeight = 4;
    const pct = this.health / this.maxHealth;

    const bx = this.x - barWidth / 2;
    const by = this.y - this.height / 2 - 8;

    // Background
    this.healthBar.fillStyle(0x13151a, 0.8);
    this.healthBar.fillRect(bx, by, barWidth, barHeight);

    // Foreground
    const color = pct > 0.5 ? 0x6bae3a : (pct > 0.25 ? 0xc8a024 : 0xae2b25);
    this.healthBar.fillStyle(color, 1.0);
    this.healthBar.fillRect(bx, by, barWidth * pct, barHeight);
  }

  destroyBuilding() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.health = 0;
    if (this.body) this.body.enable = false;
    if (this.healthBar) this.healthBar.setVisible(false);

    soundSystem.playExplosion();
    this.scene.combatSystem.spawnBuildingExplosion(this.x, this.y);

    const destroyedKey = `${this.buildingType}_destroyed`;
    if (this.scene.textures.exists(destroyedKey)) {
      this.stop();
      this.setTexture(destroyedKey);
    }

    if (this.buildingType === 'command_center') {
      this.scene.events.emit('command-center-destroyed');
    }

    this.scene.buildingSystem.removeBuilding(this);

    // Fade rubble after 15 seconds so placement can be reclaimed
    if (this.buildingType !== 'command_center') {
      this.scene.time.delayedCall(15000, () => {
        if (this.scene) {
          this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 1000,
            onComplete: () => this.destroy()
          });
        }
      });
    }
  }

  destroy(fromScene) {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    super.destroy(fromScene);
  }
}
