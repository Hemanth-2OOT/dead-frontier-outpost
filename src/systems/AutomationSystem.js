/**
 * DEAD FRONTIER: OUTPOST
 * Light Automation Logistics: Auto-Feeding Ammo to Turrets, Fuel Distribution & Visual Supply Conduits
 */

import Phaser from 'phaser';
import { GridUtils } from '../utils/GridUtils.js';

export class AutomationSystem {
  constructor(scene) {
    this.scene = scene;
    this.tickTimer = 0;
    this.pulsePhase = 0;

    // Visual supply conduit graphics layer on ground
    this.conduitGraphics = scene.add.graphics();
    this.conduitGraphics.setDepth(2);
  }

  update(time, delta) {
    this.pulsePhase = (this.pulsePhase + delta * 0.003) % 1;

    // Redraw logistics conduits every frame or so
    this.drawSupplyConduits();

    this.tickTimer += delta;
    if (this.tickTimer >= 1000) {
      this.tickTimer = 0;
      this.performAutomationTick();
    }
  }

  drawSupplyConduits() {
    this.conduitGraphics.clear();
    const buildings = this.scene.buildingSystem?.getActiveBuildings() || [];
    const ammoFactories = buildings.filter((b) => b.buildingType === 'ammo_factory' && b.hasPower);
    const turrets = buildings.filter((b) => b.isTurret);

    if (ammoFactories.length === 0 || turrets.length === 0) return;

    ammoFactories.forEach((factory) => {
      turrets.forEach((turret) => {
        const dist = GridUtils.distance(factory.x, factory.y, turret.x, turret.y);
        if (dist <= 320) {
          // Draw subtle supply line
          this.conduitGraphics.lineStyle(1.5, 0x38bdf8, 0.25);
          this.conduitGraphics.lineBetween(factory.x, factory.y, turret.x, turret.y);

          // Moving pulse dot along the conduit
          const pulseX = Phaser.Math.Linear(factory.x, turret.x, this.pulsePhase);
          const pulseY = Phaser.Math.Linear(factory.y, turret.y, this.pulsePhase);
          this.conduitGraphics.fillStyle(0x38bdf8, 0.6);
          this.conduitGraphics.fillCircle(pulseX, pulseY, 2.5);

          // Connection nodes at terminals
          this.conduitGraphics.fillStyle(0x38bdf8, 0.4);
          this.conduitGraphics.fillCircle(turret.x, turret.y, 4);
        }
      });
    });
  }

  performAutomationTick() {
    const buildings = this.scene.buildingSystem?.getActiveBuildings() || [];
    const ammoFactories = buildings.filter((b) => b.buildingType === 'ammo_factory' && b.hasPower);
    const turrets = buildings.filter((b) => b.isTurret);
    const generators = buildings.filter((b) => b.buildingType === 'generator');
    const rs = this.scene.resourceSystem;

    // 1. Auto ammo delivery: Ammo factories deliver ammo to nearby low-ammo turrets
    ammoFactories.forEach((factory) => {
      turrets.forEach((turret) => {
        const dist = GridUtils.distance(factory.x, factory.y, turret.x, turret.y);
        if (dist <= 320 && turret.currentAmmo < turret.ammoCapacity - 10) {
          if (rs.resources.ammunition >= 10) {
            const transfer = Math.min(10, turret.ammoCapacity - turret.currentAmmo);
            rs.deductResource('ammunition', transfer);
            turret.currentAmmo += transfer;

            // Visual ammo supply packet
            this.spawnSupplyPacket(factory.x, factory.y, turret.x, turret.y, 'icon_ammunition', () => {
              this.scene.combatSystem.spawnFloatingText(turret.x, turret.y - 20, `+${transfer} Ammo Restocked`, '#c8a024');
            });
          }
        }
      });
    });

    // 2. Auto fuel delivery: If base has fuel reserves and generator is low (<25)
    generators.forEach((gen) => {
      if (gen.internalInventory.fuel <= 20 && rs.resources.fuel >= 10) {
        rs.deductResource('fuel', 10);
        gen.internalInventory.fuel += 10;
        this.scene.combatSystem.spawnFloatingText(gen.x, gen.y - 20, '+10 Fuel Auto-Supplied', '#ffd24a');
      }
    });
  }

  spawnSupplyPacket(startX, startY, targetX, targetY, iconKey, onComplete) {
    if (!this.scene.textures.exists(iconKey)) {
      if (onComplete) onComplete();
      return;
    }

    const packet = this.scene.add.sprite(startX, startY, iconKey);
    packet.setScale(0.5);
    packet.setDepth(14);
    packet.setAlpha(0.9);

    this.scene.tweens.add({
      targets: packet,
      x: targetX,
      y: targetY,
      duration: 420,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        // Small arrival flash
        const flash = this.scene.add.circle(targetX, targetY, 6, 0xffd24a, 0.8);
        flash.setDepth(15);
        this.scene.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 1.8,
          duration: 200,
          onComplete: () => flash.destroy()
        });

        packet.destroy();
        if (onComplete) onComplete();
      }
    });
  }

  destroy() {
    if (this.conduitGraphics) {
      this.conduitGraphics.destroy();
      this.conduitGraphics = null;
    }
  }
}
