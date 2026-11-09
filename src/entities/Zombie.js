/**
 * DEAD FRONTIER: OUTPOST
 * Base Zombie Entity: Navigation, Target Pursuit, Wall Obstacle Attack & Death Handling
 */

import Phaser from 'phaser';
import { soundSystem } from '../systems/SoundSystem.js';
import { GridUtils } from '../utils/GridUtils.js';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, typeKey, stats) {
    super(scene, x, y, `${typeKey}_idle_down`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.typeKey = typeKey;
    this.stats = { ...stats };
    this.health = this.stats.maxHealth;
    this.maxHealth = this.stats.maxHealth;
    this.speed = this.stats.speed;

    // Set pivot from Art Bible (16, 27)
    this.setOrigin(16 / 32, 27 / 32);

    // Collision box
    this.body.setSize(18, 16);
    this.body.setOffset(7, 16);
    this.body.setCollideWorldBounds(true);

    this.direction = 'down';
    this.currentTarget = null;
    this.blockingObstacle = null;
    this.isAttacking = false;
    this.isDead = false;
    this.isHit = false;
    this.lastAttackTime = 0;

    // AI path update throttle
    this.aiUpdateTimer = Math.random() * 200;

    // Stuck detector: if stuck against a wall or obstacle for > 1 sec
    this.stuckTimer = 0;
    this.lastX = x;
    this.lastY = y;

    this.play(`${this.typeKey}_idle_down`);
  }

  update(time, delta) {
    if (this.isDead || !this.active) return;
    if (this.isHit) return;

    // Stuck detection: check progress
    const distMoved = GridUtils.distance(this.x, this.y, this.lastX, this.lastY);
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.isAttacking && distMoved < 0.5) {
      this.stuckTimer += delta;
      if (this.stuckTimer >= 1000) {
        this.stuckTimer = 0;
        this.resolveStuckState();
      }
    } else {
      this.stuckTimer = 0;
    }

    // Throttle AI target determination
    this.aiUpdateTimer -= delta;
    if (this.aiUpdateTimer <= 0) {
      this.aiUpdateTimer = 300 + Math.random() * 150;
      this.updateTarget();
    }

    // Move toward target or attack
    this.moveTowardsTarget(time);
  }

  updateTarget() {
    // If currently engaging a blocking obstacle that still exists, continue attacking it
    if (this.blockingObstacle && this.blockingObstacle.active && !this.blockingObstacle.isDestroyed) {
      const d = GridUtils.distance(this.x, this.y, this.blockingObstacle.x, this.blockingObstacle.y);
      if (d <= this.stats.attackRange + 36) {
        this.currentTarget = this.blockingObstacle;
        return;
      }
    }

    this.blockingObstacle = null;

    const player = this.scene.player;
    const commandCenter = this.scene.buildingSystem.commandCenter;

    if (!player || player.isDead) {
      this.currentTarget = commandCenter;
    } else if (!commandCenter || commandCenter.isDestroyed) {
      this.currentTarget = player;
    } else {
      // Prioritize player if within aggro range (220px), else march towards base HQ
      const distToPlayer = GridUtils.distance(this.x, this.y, player.x, player.y);
      if (distToPlayer < 240) {
        this.currentTarget = player;
      } else {
        this.currentTarget = commandCenter;
      }
    }
  }

  onCollideBuilding(building) {
    if (this.isDead || !building || building.isDestroyed) return;

    // Check if building is blocking route to target
    this.blockingObstacle = building;
    this.currentTarget = building;
  }

  resolveStuckState() {
    // Look for nearest building in front of zombie within attack reach
    const searchRadius = this.stats.attackRange + 36;
    const buildings = this.scene.buildingSystem.getActiveBuildings();
    let closestObstacle = null;
    let closestDist = searchRadius;

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (b.isDestroyed) continue;
      const d = GridUtils.distance(this.x, this.y, b.x, b.y);
      if (d <= closestDist) {
        closestDist = d;
        closestObstacle = b;
      }
    }

    if (closestObstacle) {
      this.blockingObstacle = closestObstacle;
      this.currentTarget = closestObstacle;
    } else {
      // Nudge slightly perpendicular to unstick
      const perpAngle = this.rotation + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
      this.setVelocity(Math.cos(perpAngle) * this.speed, Math.sin(perpAngle) * this.speed);
    }
  }

  moveTowardsTarget(time) {
    if (!this.currentTarget || this.isAttacking) {
      this.setVelocity(0, 0);
      return;
    }

    const tx = this.currentTarget.x;
    const ty = this.currentTarget.y;
    const dist = GridUtils.distance(this.x, this.y, tx, ty);

    // If target is a building, account for building size (half-width ~ 32px)
    const targetHalfSize = (this.currentTarget.width ? this.currentTarget.width / 2 : 12);
    const effectiveRange = this.stats.attackRange + targetHalfSize;

    // If within attack range, trigger attack
    if (dist <= effectiveRange) {
      this.setVelocity(0, 0);
      this.tryAttack(time);
      return;
    }

    // Compute movement vector
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const vx = Math.cos(angle) * this.speed;
    const vy = Math.sin(angle) * this.speed;

    this.setVelocity(vx, vy);

    // Update 4-way direction
    this.direction = GridUtils.getCardinalDirection(vx, vy);

    // Play walk/run animation
    const moveAnim = this.typeKey === 'runner'
      ? `runner_run_${this.direction}`
      : `${this.typeKey}_walk_${this.direction}`;

    if (this.anims.currentAnim?.key !== moveAnim) {
      this.play(moveAnim, true);
    }
  }

  tryAttack(time) {
    if (time - this.lastAttackTime < this.stats.attackIntervalMs) return;
    this.lastAttackTime = time;
    this.isAttacking = true;

    // Face target
    const dx = this.currentTarget.x - this.x;
    const dy = this.currentTarget.y - this.y;
    this.direction = GridUtils.getCardinalDirection(dx, dy);

    // Attack anim
    const attackAnim = `${this.typeKey}_attack_${this.direction}`;
    this.play(attackAnim, true);

    soundSystem.playZombieAttack();

    // Damage timing at midpoint of attack animation
    this.scene.time.delayedCall(250, () => {
      if (this.isDead || !this.currentTarget) return;

      const targetHalfSize = (this.currentTarget.width ? this.currentTarget.width / 2 : 12);
      const effectiveRange = this.stats.attackRange + targetHalfSize + 12;
      const d = GridUtils.distance(this.x, this.y, this.currentTarget.x, this.currentTarget.y);

      if (d <= effectiveRange) {
        let dmg = this.stats.damage;
        // Brutes do bonus damage to walls
        if (this.stats.wallDamageMultiplier && this.currentTarget.buildingType === 'wall') {
          dmg = Math.round(dmg * this.stats.wallDamageMultiplier);
        }
        if (typeof this.currentTarget.takeDamage === 'function') {
          this.currentTarget.takeDamage(dmg);
        }
      }
    });

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      // If obstacle was destroyed, clear it
      if (this.blockingObstacle && this.blockingObstacle.isDestroyed) {
        this.blockingObstacle = null;
        this.updateTarget();
      }
    });
  }

  takeDamage(amount, hitAngle = null, knockback = 0) {
    if (this.isDead) return;

    this.health -= amount;
    this.isHit = true;

    // Apply knockback impulse away from bullet impact
    if (hitAngle !== null && knockback > 0 && this.body) {
      const kx = Math.cos(hitAngle) * knockback;
      const ky = Math.sin(hitAngle) * knockback;
      this.setVelocity(kx, ky);
    }

    // Blood splatter fx
    this.scene.combatSystem.spawnBloodImpact(this.x, this.y);

    // Floating damage number
    this.scene.combatSystem.spawnFloatingText(
      this.x + (Math.random() * 12 - 6),
      this.y - 14,
      `-${amount}`,
      amount >= 35 ? '#ef4444' : '#d9dacf'
    );

    // Hit flash
    this.setTint(0xff6666);
    this.scene.time.delayedCall(80, () => {
      if (this.active && !this.isDead) {
        this.clearTint();
        this.isHit = false;
      }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    soundSystem.playZombieDeath();

    // Death animation
    const deathAnim = `${this.typeKey}_death_${this.direction}`;
    this.play(deathAnim);

    // Zombie death particles/splatter fx
    this.scene.combatSystem.spawnZombieDeathFx(this.x, this.y);

    // Drop scrap resource
    if (Math.random() < this.stats.scrapDropChance) {
      this.scene.resourceSystem.spawnGroundScrap(this.x, this.y, this.stats.scrapAmount);
    }

    // Emit enemy-killed for score and real-time HUD wave updates
    this.scene.events.emit('enemy-killed', {
      type: this.typeKey,
      score: this.stats.scoreValue
    });

    // Fade corpse after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (this.scene && this.scene.tweens) {
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            this.destroy();
          }
        });
      } else {
        this.destroy();
      }
    });
  }
}
