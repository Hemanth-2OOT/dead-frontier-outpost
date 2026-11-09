/**
 * DEAD FRONTIER: OUTPOST
 * Player Entity: Movement, Aiming, Shooting, Reloading, E-Interaction & Health
 */

import Phaser from 'phaser';
import { BALANCE } from '../config/balanceConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';
import { GridUtils } from '../utils/GridUtils.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_idle_down');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup pivot from Art Bible (16, 27 in 32x32 frame)
    this.setOrigin(16 / 32, 27 / 32);

    // Physics body (centered at feet, smooth navigation)
    this.body.setSize(18, 16);
    this.body.setOffset(7, 16);
    this.body.setCollideWorldBounds(true);

    // Stats
    this.stats = { ...BALANCE.PLAYER };
    this.health = this.stats.maxHealth;
    this.maxHealth = this.stats.maxHealth;
    this.speed = this.stats.speed;

    // Upgrades modifiers
    this.speedMultiplier = 1.0;
    this.reloadMultiplier = 1.0;

    // Dual Weapon Arsenal: Assault Rifle & Combat Shotgun
    this.weaponArsenal = {
      rifle: {
        ...(BALANCE.PLAYER.weapons?.rifle ?? BALANCE.PLAYER.weapon),
        currentAmmo: (BALANCE.PLAYER.weapons?.rifle ?? BALANCE.PLAYER.weapon).magazineSize
      },
      shotgun: {
        ...(BALANCE.PLAYER.weapons?.shotgun ?? {
          id: 'shotgun',
          name: 'Combat Shotgun',
          shortName: 'SHOTGUN',
          damage: 18,
          fireRateMs: 560,
          magazineSize: 8,
          reloadTimeMs: 1400,
          bulletSpeed: 580,
          range: 330,
          pellets: 5,
          spread: 0.26,
          knockback: 180,
          projectileType: 'shotgun'
        }),
        currentAmmo: 8
      }
    };
    this.currentWeaponId = 'rifle';
    this.weapon = this.weaponArsenal.rifle;
    this.currentAmmo = this.weapon.currentAmmo;

    this.isReloading = false;
    this.lastShotTime = 0;

    // Movement & Aiming state
    this.direction = 'down'; // down, up, left, right
    this.isMoving = false;
    this.isShooting = false;
    this.isDead = false;

    // Keys (WASD + Arrow Keys + R + E + Q + F)
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      UP: Phaser.Input.Keyboard.KeyCodes.UP,
      LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
      DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      F: Phaser.Input.Keyboard.KeyCodes.F
    });

    // Flash timer for damage feedback
    this.invulnerableTimer = 0;

    this.play('player_idle_down');
  }

  update(time, delta) {
    if (this.isDead) return;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.alpha = Math.floor(time / 80) % 2 === 0 ? 0.4 : 1.0;
      if (this.invulnerableTimer <= 0) this.alpha = 1.0;
    }

    // Aim calculation from mouse in world space
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    const deg = Phaser.Math.RadToDeg(angle);

    // Convert angle to 4-way direction
    if (deg >= -45 && deg <= 45) {
      this.direction = 'right';
    } else if (deg > 45 && deg < 135) {
      this.direction = 'down';
    } else if (deg >= 135 || deg <= -135) {
      this.direction = 'left';
    } else {
      this.direction = 'up';
    }

    // Movement (WASD + Arrows)
    let vx = 0;
    let vy = 0;

    if (this.keys.A.isDown || this.keys.LEFT.isDown) vx -= 1;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) vx += 1;
    if (this.keys.W.isDown || this.keys.UP.isDown) vy -= 1;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) vy += 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const invSqrt2 = 0.70710678;
      vx *= invSqrt2;
      vy *= invSqrt2;
    }

    const effectiveSpeed = this.speed * (this.speedMultiplier || 1.0);
    this.setVelocity(vx * effectiveSpeed, vy * effectiveSpeed);
    this.isMoving = vx !== 0 || vy !== 0;

    // Weapon Switch check (Q key)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.switchWeapon();
    }

    // Quick repair check (F key)
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
      this.quickRepairNearby();
    }

    // Reload check (R key)
    if (Phaser.Input.Keyboard.JustDown(this.keys.R) && !this.isReloading) {
      this.startReload();
    }

    // Interact check (E key)
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.interactNearby();
    }

    // Update animations if not shooting/reloading
    if (!this.isShooting && !this.isReloading) {
      const animKey = this.isMoving
        ? `player_walk_${this.direction}`
        : `player_idle_${this.direction}`;
      if (this.anims.currentAnim?.key !== animKey) {
        this.play(animKey, true);
      }
    }
  }

  interactNearby() {
    const rs = this.scene.resourceSystem;
    const bs = this.scene.buildingSystem;
    const ir = this.stats.interactRadius;

    // 1. Check ground pickups
    if (rs && rs.groundPickups) {
      const pickups = rs.groundPickups.getChildren();
      for (let i = 0; i < pickups.length; i++) {
        const p = pickups[i];
        if (p.active && GridUtils.distance(this.x, this.y, p.x, p.y) <= ir) {
          rs.collectGroundPickup(p);
          return;
        }
      }
    }

    // 2. Check nearby buildings
    if (bs) {
      const buildings = bs.getActiveBuildings();
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        if (GridUtils.distance(this.x, this.y, b.x, b.y) <= ir + (b.width / 2)) {
          // If damaged, repair using 2 scrap
          if (b.health < b.maxHealth && rs.resources.scrap >= 2) {
            rs.deductResource('scrap', 2);
            b.repair(35);
            soundSystem.playBuild();
            this.scene.combatSystem.spawnFloatingText(b.x, b.y - 20, '+35 HP Repaired', '#6bae3a');
            return;
          }

          // If turret needs ammo, restock from reserves
          if (b.isTurret && b.currentAmmo < b.ammoCapacity && rs.resources.ammunition >= 10) {
            const transfer = Math.min(20, b.ammoCapacity - b.currentAmmo, rs.resources.ammunition);
            rs.deductResource('ammunition', transfer);
            b.currentAmmo += transfer;
            soundSystem.playReload();
            this.scene.combatSystem.spawnFloatingText(b.x, b.y - 20, `+${transfer} Ammo Loaded`, '#c8a024');
            return;
          }

          // If generator needs fuel, refuel from reserves
          if (b.buildingType === 'generator' && b.internalInventory.fuel < 80 && rs.resources.fuel >= 10) {
            rs.deductResource('fuel', 10);
            b.internalInventory.fuel += 10;
            soundSystem.playBuild();
            this.scene.combatSystem.spawnFloatingText(b.x, b.y - 20, '+10 Fuel Added', '#ffd24a');
            return;
          }
        }
      }
    }
  }

  canShoot(time) {
    return (
      !this.isDead &&
      !this.isReloading &&
      time - this.lastShotTime >= this.weapon.fireRateMs &&
      this.currentAmmo > 0
    );
  }

  shoot(targetX, targetY, time) {
    if (this.isDead) return null;

    if (this.currentAmmo <= 0) {
      soundSystem.playEmptyClip();
      if (!this.isReloading) this.startReload();
      return null;
    }

    if (time - this.lastShotTime < this.weapon.fireRateMs) return null;
    this.lastShotTime = time;
    this.currentAmmo--;
    this.weaponArsenal[this.currentWeaponId].currentAmmo = this.currentAmmo;

    // Play weapon sound & camera shake
    if (this.currentWeaponId === 'shotgun') {
      soundSystem.playShotgun();
      this.scene.cameras.main.shake(120, 0.007);
    } else {
      soundSystem.playShoot();
      this.scene.cameras.main.shake(60, 0.002);
    }

    // Play shoot animation
    this.isShooting = true;
    const shootAnim = `player_shoot_${this.direction}`;
    this.play(shootAnim, true);
    this.scene.time.delayedCall(160, () => {
      this.isShooting = false;
    });

    // Compute base shoot angle
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y - 10, targetX, targetY);

    // Muzzle flash effect
    const muzzleOffset = 18;
    const fx = this.x + Math.cos(baseAngle) * muzzleOffset;
    const fy = (this.y - 10) + Math.sin(baseAngle) * muzzleOffset;
    this.scene.combatSystem.spawnMuzzleFlash(fx, fy, baseAngle, 'mg');

    // Notify ammo change
    this.scene.events.emit('player-ammo-changed', {
      current: this.currentAmmo,
      reserve: this.scene.resourceSystem.resources.ammunition,
      weapon: this.weapon
    });

    // Spawn projectiles (single precise round or multi-pellet shotgun spread)
    const pellets = this.weapon.pellets || 1;
    const spread = this.weapon.spread || 0;
    let firstProj = null;

    for (let i = 0; i < pellets; i++) {
      const pelletAngle = baseAngle + (Math.random() - 0.5) * spread;
      const proj = this.scene.combatSystem.spawnPlayerBullet(
        fx,
        fy,
        pelletAngle,
        this.weapon.bulletSpeed,
        this.weapon.damage,
        this.weapon.range,
        this.weapon.projectileType || 'rifle',
        this.weapon.knockback || 40
      );
      if (i === 0) firstProj = proj;
    }

    return firstProj;
  }

  switchWeapon(weaponId = null) {
    if (this.isReloading || this.isDead) return;

    if (weaponId && this.weaponArsenal[weaponId]) {
      this.currentWeaponId = weaponId;
    } else {
      this.currentWeaponId = this.currentWeaponId === 'rifle' ? 'shotgun' : 'rifle';
    }

    this.weapon = this.weaponArsenal[this.currentWeaponId];
    this.currentAmmo = this.weapon.currentAmmo;
    soundSystem.playReload();

    this.scene.combatSystem.spawnFloatingText(
      this.x,
      this.y - 28,
      `[Q] ${this.weapon.name}`,
      '#ffd24a'
    );

    this.scene.events.emit('player-ammo-changed', {
      current: this.currentAmmo,
      reserve: this.scene.resourceSystem.resources.ammunition,
      weapon: this.weapon
    });
  }

  quickRepairNearby() {
    const bs = this.scene.buildingSystem;
    const rs = this.scene.resourceSystem;
    if (!bs || !rs) return;

    const buildings = bs.getActiveBuildings();
    let repairedAny = false;

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (b.isDestroyed || b.health >= b.maxHealth) continue;
      const d = GridUtils.distance(this.x, this.y, b.x, b.y);
      if (d <= this.stats.interactRadius + b.width / 2) {
        if (rs.resources.scrap >= 2) {
          rs.deductResource('scrap', 2);
          b.repair(45);
          soundSystem.playBuild();
          this.scene.combatSystem.spawnFloatingText(b.x, b.y - 20, '+45 HP (Quick Repair)', '#6bae3a');
          repairedAny = true;
          break;
        } else {
          soundSystem.playError();
          this.scene.combatSystem.spawnFloatingText(this.x, this.y - 25, 'Need 2 Scrap', '#ef4444');
          return;
        }
      }
    }

    if (!repairedAny) {
      this.scene.combatSystem.spawnFloatingText(this.x, this.y - 25, 'No damaged structures near', '#7b8489');
    }
  }

  startReload() {
    if (this.isReloading || this.isDead) return;

    // Check reserve ammo in resource system
    const reserve = this.scene.resourceSystem.resources.ammunition;
    if (reserve <= 0 || this.currentAmmo >= this.weapon.magazineSize) {
      return;
    }

    this.isReloading = true;
    soundSystem.playReload();

    const reloadAnim = `player_reload_${this.direction}`;
    this.play(reloadAnim, true);

    const actualReloadMs = Math.round(this.weapon.reloadTimeMs * (this.reloadMultiplier || 1.0));
    this.scene.time.delayedCall(actualReloadMs, () => {
      if (this.isDead) return;
      const needed = this.weapon.magazineSize - this.currentAmmo;
      const actual = Math.min(needed, this.scene.resourceSystem.resources.ammunition);
      this.scene.resourceSystem.resources.ammunition -= actual;
      this.currentAmmo += actual;
      this.weaponArsenal[this.currentWeaponId].currentAmmo = this.currentAmmo;
      this.isReloading = false;
      this.scene.events.emit('player-ammo-changed', {
        current: this.currentAmmo,
        reserve: this.scene.resourceSystem.resources.ammunition,
        weapon: this.weapon
      });
    });
  }

  takeDamage(amount) {
    if (this.isDead || this.invulnerableTimer > 0) return;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 500; // 0.5s i-frame
    soundSystem.playHit();

    // Camera shake for impactful hit feedback
    this.scene.cameras.main.shake(150, 0.005);

    // Blood impact fx
    this.scene.combatSystem.spawnBloodImpact(this.x, this.y);

    this.scene.events.emit('player-health-changed', {
      current: this.health,
      max: this.maxHealth
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.scene.events.emit('player-health-changed', {
      current: this.health,
      max: this.maxHealth
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocity(0, 0);
    this.body.enable = false;

    const deathAnim = `player_death_${this.direction}`;
    this.play(deathAnim);

    soundSystem.playZombieDeath();

    this.scene.time.delayedCall(1200, () => {
      this.scene.events.emit('player-died');
    });
  }
}
