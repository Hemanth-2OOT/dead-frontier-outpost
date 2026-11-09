/**
 * DEAD FRONTIER: OUTPOST
 * Resource Management System: Scrap, Metal, Fuel, Ammunition & Ground Pickups
 */

import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig.js';
import { soundSystem } from './SoundSystem.js';
import { GridUtils } from '../utils/GridUtils.js';

export class ResourceSystem {
  constructor(scene) {
    this.scene = scene;
    this.resources = { ...BALANCE.STARTING_RESOURCES };

    // Group for ground scrap pickups dropped by zombies
    this.groundPickups = scene.physics.add.group();

    // Collision check between player and ground pickups
    scene.physics.add.overlap(
      scene.player,
      this.groundPickups,
      (player, pickup) => {
        this.collectGroundPickup(pickup);
      },
      null,
      this
    );
  }

  addResource(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
      this.emitResourceChange();
    }
  }

  deductResource(type, amount) {
    if (this.resources[type] !== undefined && this.resources[type] >= amount) {
      this.resources[type] -= amount;
      this.emitResourceChange();
      return true;
    }
    return false;
  }

  canAfford(costObj) {
    for (const [res, amount] of Object.entries(costObj)) {
      if ((this.resources[res] ?? 0) < amount) {
        return false;
      }
    }
    return true;
  }

  deductCost(costObj) {
    if (!this.canAfford(costObj)) return false;
    for (const [res, amount] of Object.entries(costObj)) {
      this.resources[res] -= amount;
    }
    this.emitResourceChange();
    return true;
  }

  emitResourceChange() {
    this.scene.events.emit('resources-changed', { ...this.resources });
  }

  spawnGroundScrap(x, y, amount) {
    const pickup = this.groundPickups.create(x, y, 'debris_scrap');
    pickup.setOrigin(0.5, 0.5);
    pickup.amount = amount;
    pickup.body.setCircle(10);

    // Floating bounce tween
    this.scene.tweens.add({
      targets: pickup,
      y: y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Auto despawn after 45 seconds if uncollected
    this.scene.time.delayedCall(45000, () => {
      if (pickup.active) pickup.destroy();
    });
  }

  collectGroundPickup(pickup) {
    if (!pickup.active) return;
    const amount = pickup.amount || 2;
    pickup.destroy();

    this.addResource('scrap', amount);
    soundSystem.playCollect();

    this.scene.combatSystem.spawnFloatingText(
      this.scene.player.x,
      this.scene.player.y - 20,
      `+${amount} Scrap`,
      '#d6893c'
    );
  }

  update(time, delta) {
    // Check pickup proximity if player is walking near items
    const player = this.scene.player;
    if (!player || player.isDead) return;

    const pickups = this.groundPickups.getChildren();
    for (let i = 0; i < pickups.length; i++) {
      const p = pickups[i];
      if (!p.active) continue;
      const d = GridUtils.distance(player.x, player.y, p.x, p.y);
      if (d < 36) {
        this.collectGroundPickup(p);
      }
    }
  }
}
