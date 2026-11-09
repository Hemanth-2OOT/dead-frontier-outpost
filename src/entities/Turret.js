/**
 * DEAD FRONTIER: OUTPOST
 * Turret Entity (Machine Gun & Cannon): Targeting, Rotation, Recoil, Projectile Firing
 */

import Phaser from 'phaser';
import { Building } from './Building.js';
import { soundSystem } from '../systems/SoundSystem.js';
import { GridUtils } from '../utils/GridUtils.js';

export class Turret extends Building {
  constructor(scene, tileX, tileY, buildingType) {
    super(scene, tileX, tileY, buildingType);

    this.isTurret = true;
    this.range = this.balanceMeta.attackRange;
    this.fireRateMs = this.balanceMeta.fireRateMs;
    this.lastShotTime = 0;
    this.ammoCapacity = this.balanceMeta.maxAmmoStorage;
    this.currentAmmo = this.ammoCapacity;
    this.ammoPerShot = this.balanceMeta.ammoPerShot;

    // Set base texture for turret base
    this.setTexture(`${buildingType}_base`);

    // Barrel sprite added on top, pivot at center (32, 32)
    this.barrelSprite = scene.add.sprite(this.x, this.y, `${buildingType}_barrel`);
    this.barrelSprite.setOrigin(0.5, 0.5);
    this.barrelSprite.setDepth(this.depth + 1);

    this.currentTarget = null;
    this.currentAngle = 0; // facing East initially
  }

  getDamage() {
    const mult = this.scene.getUpgradeMultiplier ? this.scene.getUpgradeMultiplier('turrets', 'damageMultiplier') : 1.0;
    return Math.round(this.balanceMeta.damage * mult);
  }

  getRange() {
    const mult = this.scene.getUpgradeMultiplier ? this.scene.getUpgradeMultiplier('turrets', 'rangeMultiplier') : 1.0;
    return Math.round(this.balanceMeta.attackRange * mult);
  }

  update(time, delta) {
    if (this.isDestroyed || !this.active) return;

    this.range = this.getRange();

    // Ensure barrel follows turret position
    if (this.barrelSprite) {
      this.barrelSprite.setPosition(this.x, this.y);
    }

    // Find and track nearest zombie
    this.updateTarget();

    if (this.currentTarget && !this.currentTarget.isDead) {
      // Rotate barrel towards target
      const targetAngle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        this.currentTarget.x,
        this.currentTarget.y
      );

      // Smooth rotation
      this.currentAngle = Phaser.Math.Angle.RotateTo(
        this.currentAngle,
        targetAngle,
        this.buildingType === 'cannon_turret' ? 0.05 : 0.12
      );
      this.barrelSprite.rotation = this.currentAngle;

      // Check if barrel is reasonably facing target (within ~20 degrees)
      const diff = Math.abs(Phaser.Math.Angle.Wrap(this.currentAngle - targetAngle));
      if (diff < 0.35 && time - this.lastShotTime >= this.fireRateMs) {
        // Can only fire if turret actually has ammunition
        if (this.currentAmmo >= this.ammoPerShot) {
          this.fire(time);
        }
      }
    }
  }

  updateTarget() {
    // If current target is invalid, dead, or out of range, search new target
    if (
      !this.currentTarget ||
      this.currentTarget.isDead ||
      !this.currentTarget.active ||
      GridUtils.distance(this.x, this.y, this.currentTarget.x, this.currentTarget.y) > this.range
    ) {
      this.currentTarget = this.findNearestZombie();
    }
  }

  findNearestZombie() {
    const zombies = this.scene.waveSystem.getActiveZombies();
    let nearest = null;
    let minDist = this.range;

    for (let i = 0; i < zombies.length; i++) {
      const z = zombies[i];
      if (z.isDead || !z.active) continue;
      const d = GridUtils.distance(this.x, this.y, z.x, z.y);
      if (d <= minDist) {
        minDist = d;
        nearest = z;
      }
    }
    return nearest;
  }

  fire(time) {
    if (this.currentAmmo < this.ammoPerShot) {
      return; // Cannot fire without ammunition
    }

    this.currentAmmo -= this.ammoPerShot;
    this.lastShotTime = time;

    // Recoil animation
    const recoilAnim = `${this.buildingType}_recoil_anim`;
    if (this.scene.anims.exists(recoilAnim)) {
      this.barrelSprite.play(recoilAnim);
      this.barrelSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.barrelSprite.setTexture(`${this.buildingType}_barrel`);
      });
    }

    // Sound
    if (this.buildingType === 'cannon_turret') {
      soundSystem.playCannon();
    } else {
      soundSystem.playShoot();
    }

    // Muzzle position at barrel tip (forward ~26px)
    const tipDist = 26;
    const mx = this.x + Math.cos(this.currentAngle) * tipDist;
    const my = this.y + Math.sin(this.currentAngle) * tipDist;

    // Spawn muzzle flash
    this.scene.combatSystem.spawnMuzzleFlash(
      mx,
      my,
      this.currentAngle,
      this.buildingType === 'cannon_turret' ? 'cannon' : 'mg'
    );

    const effectiveDmg = this.getDamage();
    const effectiveRng = this.getRange();

    // Spawn projectile
    if (this.buildingType === 'cannon_turret') {
      this.scene.combatSystem.spawnCannonShell(
        mx,
        my,
        this.currentAngle,
        this.balanceMeta.bulletSpeed,
        effectiveDmg,
        this.balanceMeta.splashRadius,
        effectiveRng
      );
    } else {
      this.scene.combatSystem.spawnTurretBullet(
        mx,
        my,
        this.currentAngle,
        this.balanceMeta.bulletSpeed,
        effectiveDmg,
        effectiveRng
      );
    }
  }

  restockAmmo(amount) {
    const needed = this.ammoCapacity - this.currentAmmo;
    const actual = Math.min(needed, amount);
    this.currentAmmo += actual;
    return actual;
  }

  destroyBuilding() {
    super.destroyBuilding();
    if (this.barrelSprite) {
      this.barrelSprite.setVisible(false);
    }
  }

  destroy(fromScene) {
    if (this.barrelSprite) {
      this.barrelSprite.destroy();
      this.barrelSprite = null;
    }
    super.destroy(fromScene);
  }
}
