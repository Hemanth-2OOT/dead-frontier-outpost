/**
 * DEAD FRONTIER: OUTPOST
 * Combat System: Projectile Pooling, Collision Detection & Visual VFX
 */

import Phaser from 'phaser';
import { Projectile } from '../entities/Projectile.js';
import { ObjectPool } from '../utils/ObjectPool.js';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;

    // Group for active projectiles - defaults cleared so group never wipes velocity
    this.projectileGroup = scene.physics.add.group();
    this.projectileGroup.defaults = {};

    // Projectile object pool: all pooled projectiles are members of projectileGroup
    this.projectilePool = new ObjectPool(() => {
      const proj = new Projectile(scene);
      this.projectileGroup.add(proj);
      return proj;
    }, 60);

    // Floating text pool / container
    this.floatingTexts = scene.add.group();
  }

  update() {
    // Zero-allocation loop directly over active Set
    for (const proj of this.projectilePool.active) {
      if (proj && proj.active) {
        proj.update();
      }
    }
  }

  setupCollisions(zombieGroup) {
    this.scene.physics.add.overlap(
      this.projectileGroup,
      zombieGroup,
      (projectile, zombie) => {
        if (projectile.active && zombie.active && !zombie.isDead) {
          projectile.onHitZombie(zombie);
        }
      },
      null,
      this
    );
  }

  spawnPlayerBullet(x, y, angle, speed, damage, range, projectileType = 'rifle', knockback = 40) {
    return this.projectilePool.get(x, y, angle, speed, damage, range, false, 0, projectileType, knockback);
  }

  spawnTurretBullet(x, y, angle, speed, damage, range) {
    return this.projectilePool.get(x, y, angle, speed, damage, range, false, 0);
  }

  spawnCannonShell(x, y, angle, speed, damage, splashRadius, range) {
    return this.projectilePool.get(x, y, angle, speed, damage, range, true, splashRadius);
  }

  releaseProjectile(projectile) {
    this.projectilePool.release(projectile);
  }

  // --- VFX Spawners ---

  spawnMuzzleFlash(x, y, angle, type = 'mg') {
    const key = type === 'cannon' ? 'muzzle_flash_cannon' : 'muzzle_flash_mg';
    const flash = this.scene.add.sprite(x, y, key);
    flash.setRotation(angle);
    flash.setDepth(20);
    flash.play(`${key}_anim`);
    flash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      flash.destroy();
    });
  }

  spawnBulletImpact(x, y) {
    const fx = this.scene.add.sprite(x, y, 'bullet_impact');
    fx.setDepth(15);
    fx.play('bullet_impact_anim');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnBloodImpact(x, y) {
    const fx = this.scene.add.sprite(x, y, 'blood_impact');
    fx.setDepth(15);
    fx.play('blood_impact_anim');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnZombieDeathFx(x, y) {
    const fx = this.scene.add.sprite(x, y, 'zombie_death_fx');
    fx.setDepth(5);
    fx.play('zombie_death_fx_anim');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnBuildingDamageImpact(x, y) {
    const fx = this.scene.add.sprite(x + (Math.random() * 20 - 10), y + (Math.random() * 20 - 10), 'smoke');
    fx.setDepth(25);
    fx.play('smoke_anim');
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnExplosion(x, y) {
    const fx = this.scene.add.sprite(x, y, 'explosion');
    fx.setDepth(30);
    fx.play('explosion_anim');
    this.scene.cameras.main.shake(200, 0.008);
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnMineExplosion(x, y) {
    const fx = this.scene.add.sprite(x, y, 'mine_explosion');
    fx.setDepth(30);
    fx.play('mine_explosion_anim');
    this.scene.cameras.main.shake(250, 0.01);
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  }

  spawnBuildingExplosion(x, y) {
    this.spawnExplosion(x, y);
    // Add smoke puff afterwards
    this.scene.time.delayedCall(150, () => {
      if (this.scene) {
        const smoke = this.scene.add.sprite(x, y - 10, 'smoke');
        smoke.setDepth(28);
        smoke.play('smoke_anim');
        smoke.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => smoke.destroy());
      }
    });
  }

  spawnFloatingText(x, y, text, color = '#d9dacf') {
    const label = this.scene.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: color,
      stroke: '#13151a',
      strokeThickness: 3
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(150);

    this.scene.tweens.add({
      targets: label,
      y: y - 24,
      alpha: 0,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => label.destroy()
    });
  }

  spawnRepairBeam(x1, y1, x2, y2) {
    const beam = this.scene.add.graphics();
    beam.setDepth(22);
    // Outer neon-green glow
    beam.lineStyle(3, 0x6bae3a, 0.75);
    beam.lineBetween(x1, y1, x2, y2);
    // Inner bright white/green core
    beam.lineStyle(1.5, 0xdcfce7, 1);
    beam.lineBetween(x1, y1, x2, y2);

    // Target spark flash
    const spark = this.scene.add.circle(x2, y2, 4, 0xa3e635, 0.9);
    spark.setDepth(23);

    this.scene.tweens.add({
      targets: [beam, spark],
      alpha: 0,
      duration: 280,
      ease: 'Power2',
      onComplete: () => {
        beam.destroy();
        spark.destroy();
      }
    });
  }
}
