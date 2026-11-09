/**
 * DEAD FRONTIER: OUTPOST
 * Projectile Entity: Physics, Lifetime, Collision & Splash Area Damage
 */

import Phaser from 'phaser';
import { GridUtils } from '../utils/GridUtils.js';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'rifle_projectile');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(8, 8);
    this.body.setOffset(4, 4);

    this.damage = 0;
    this.maxRange = 0;
    this.startX = 0;
    this.startY = 0;
    this.isCannon = false;
    this.splashRadius = 0;
  }

  spawn(x, y, angle, speed, damage, maxRange, isCannon = false, splashRadius = 0, projectileType = 'rifle', knockback = 40) {
    this.setPosition(x, y);
    this.startX = x;
    this.startY = y;
    this.damage = damage;
    this.maxRange = maxRange;
    this.isCannon = isCannon;
    this.splashRadius = splashRadius;
    this.projectileType = projectileType;
    this.knockback = knockback;

    // Sprite texture & anim
    let textureKey = 'rifle_projectile';
    if (isCannon) {
      textureKey = 'cannon_projectile';
    } else if (projectileType === 'shotgun') {
      textureKey = 'shotgun_projectile';
    }

    this.setTexture(textureKey);
    const animKey = `${textureKey}_anim`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
    }

    // Set rotation and depth
    this.setRotation(angle);
    this.setDepth(15);
    this.setActive(true);
    this.setVisible(true);

    // Physics body activation and velocity
    if (this.body) {
      this.body.enable = true;
      this.body.reset(x, y);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.body.setVelocity(vx, vy);
    }
  }

  update() {
    if (!this.active) return;

    // Check if reached max range
    const dist = GridUtils.distance(this.startX, this.startY, this.x, this.y);
    if (dist >= this.maxRange) {
      this.explodeOrImpact();
    }
  }

  onHitZombie(zombie) {
    if (!this.active) return;

    if (this.isCannon) {
      this.explodeOrImpact();
    } else {
      zombie.takeDamage(this.damage, this.rotation, this.knockback);
      this.scene.combatSystem.spawnBulletImpact(this.x, this.y);
      this.scene.combatSystem.releaseProjectile(this);
    }
  }

  explodeOrImpact() {
    if (!this.active) return;

    if (this.isCannon) {
      this.scene.combatSystem.spawnExplosion(this.x, this.y);
      // Area of effect damage to all zombies within splashRadius
      const zombies = this.scene.waveSystem.getActiveZombies();
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        if (z.isDead) continue;
        const d = GridUtils.distance(this.x, this.y, z.x, z.y);
        if (d <= this.splashRadius) {
          const falloff = 1 - (d / this.splashRadius) * 0.5;
          z.takeDamage(Math.round(this.damage * falloff));
        }
      }
    } else {
      this.scene.combatSystem.spawnBulletImpact(this.x, this.y);
    }

    this.scene.combatSystem.releaseProjectile(this);
  }

  reset() {
    if (this.body) {
      this.body.setVelocity(0, 0);
      this.body.enable = false;
    }
    this.setActive(false);
    this.setVisible(false);
  }
}
