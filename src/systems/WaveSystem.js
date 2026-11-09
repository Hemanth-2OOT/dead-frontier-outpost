/**
 * DEAD FRONTIER: OUTPOST
 * Wave & Horde Progression System (10 Waves)
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { Walker } from '../entities/Walker.js';
import { Runner } from '../entities/Runner.js';
import { Brute } from '../entities/Brute.js';
import { soundSystem } from './SoundSystem.js';

export const WAVE_STATE = {
  PREPARATION: 'PREPARATION',
  WAVE_ACTIVE: 'WAVE_ACTIVE',
  VICTORY: 'VICTORY'
};

export class WaveSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentWaveNumber = 1;
    this.state = WAVE_STATE.PREPARATION;
    this.prepTimerSeconds = BALANCE.WAVES[0].prepTimeSeconds;

    // Active zombies physics group
    this.zombieGroup = scene.physics.add.group();

    // Spawning queue
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.totalEnemiesInWave = 0;
    this.remainingEnemies = 0;

    // Preparation countdown timer
    this.prepClock = 0;

    // Connect collisions with player bullets
    this.scene.combatSystem.setupCollisions(this.zombieGroup);

    // Collisions between zombies so they don't occupy exact same space
    this.scene.physics.add.collider(this.zombieGroup, this.zombieGroup);

    // Physical collision between player and zombies
    if (this.scene.player) {
      this.scene.physics.add.collider(this.zombieGroup, this.scene.player);
    }

    // Single unified collider between zombies and all buildings/walls
    this.scene.physics.add.collider(
      this.zombieGroup,
      this.scene.buildingSystem.buildingGroup,
      (zombie, building) => {
        if (typeof zombie.onCollideBuilding === 'function') {
          zombie.onCollideBuilding(building);
        }
      }
    );

    // Listen for enemy kills to update remaining counts in real-time
    this.onEnemyKilled = () => {
      this.remainingEnemies = Math.max(0, this.remainingEnemies - 1);
      this.scene.events.emit('wave-enemies-updated', {
        remaining: this.remainingEnemies,
        total: this.totalEnemiesInWave
      });
    };
    this.scene.events.on('enemy-killed', this.onEnemyKilled);
  }

  update(time, delta) {
    if (this.state === WAVE_STATE.PREPARATION) {
      this.prepClock += delta;
      if (this.prepClock >= 1000) {
        this.prepClock -= 1000;
        this.prepTimerSeconds--;

        this.scene.events.emit('wave-prep-tick', {
          wave: this.currentWaveNumber,
          secondsRemaining: this.prepTimerSeconds
        });

        if (this.prepTimerSeconds <= 0) {
          this.startWave();
        }
      }
    } else if (this.state === WAVE_STATE.WAVE_ACTIVE) {
      // Spawn queued zombies
      if (this.spawnQueue.length > 0) {
        this.spawnTimer += delta;
        const interval = BALANCE.WAVES[this.currentWaveNumber - 1].spawnIntervalMs;
        if (this.spawnTimer >= interval) {
          this.spawnTimer = 0;
          const nextType = this.spawnQueue.shift();
          this.spawnPerimeterZombie(nextType);
        }
      }

      // Update all active zombies
      const zombies = this.zombieGroup.getChildren();
      for (let i = 0; i < zombies.length; i++) {
        zombies[i].update(time, delta);
      }

      // Check wave completion
      if (this.spawnQueue.length === 0 && this.getActiveCount() === 0) {
        this.completeWave();
      }
    }
  }

  startWave() {
    this.state = WAVE_STATE.WAVE_ACTIVE;
    const waveConfig = BALANCE.WAVES[this.currentWaveNumber - 1];

    // Build spawn queue
    this.spawnQueue = [];
    for (let i = 0; i < waveConfig.walkers; i++) this.spawnQueue.push('walker');
    for (let i = 0; i < waveConfig.runners; i++) this.spawnQueue.push('runner');
    for (let i = 0; i < waveConfig.brutes; i++) this.spawnQueue.push('brute');

    // Shuffle queue for varied horde waves
    Phaser.Utils.Array.Shuffle(this.spawnQueue);

    this.totalEnemiesInWave = this.spawnQueue.length;
    this.remainingEnemies = this.totalEnemiesInWave;
    this.spawnTimer = 0;

    soundSystem.playWaveStart();

    this.scene.events.emit('wave-started', {
      wave: this.currentWaveNumber,
      totalEnemies: this.totalEnemiesInWave
    });
  }

  skipPreparation() {
    if (this.state === WAVE_STATE.PREPARATION) {
      this.prepTimerSeconds = 0;
      this.startWave();
    }
  }

  spawnPerimeterZombie(type) {
    const pos = this.getPerimeterSpawnPosition();
    let zombie;
    if (type === 'runner') {
      zombie = new Runner(this.scene, pos.x, pos.y);
    } else if (type === 'brute') {
      zombie = new Brute(this.scene, pos.x, pos.y);
    } else {
      zombie = new Walker(this.scene, pos.x, pos.y);
    }

    this.zombieGroup.add(zombie);
  }

  getPerimeterSpawnPosition() {
    const margin = 40;
    const w = GAME_CONFIG.WORLD_WIDTH;
    const h = GAME_CONFIG.WORLD_HEIGHT;

    // Pick a random edge: 0=top, 1=bottom, 2=left, 3=right
    const edge = Phaser.Math.Between(0, 3);
    switch (edge) {
      case 0: // top
        return { x: Phaser.Math.Between(margin, w - margin), y: margin };
      case 1: // bottom
        return { x: Phaser.Math.Between(margin, w - margin), y: h - margin };
      case 2: // left
        return { x: margin, y: Phaser.Math.Between(margin, h - margin) };
      case 3: // right
      default:
        return { x: w - margin, y: Phaser.Math.Between(margin, h - margin) };
    }
  }

  getActiveCount() {
    let count = 0;
    const children = this.zombieGroup.getChildren();
    for (let i = 0; i < children.length; i++) {
      if (children[i].active && !children[i].isDead) {
        count++;
      }
    }
    return count;
  }

  getActiveZombies() {
    return this.zombieGroup.getChildren().filter((z) => z.active && !z.isDead);
  }

  completeWave() {
    soundSystem.playWaveComplete();

    // Reward player with end-of-wave resources
    this.scene.resourceSystem.addResource('scrap', 30);
    this.scene.resourceSystem.addResource('metal', 15);
    this.scene.resourceSystem.addResource('fuel', 15);
    this.scene.resourceSystem.addResource('ammunition', 40);

    this.scene.events.emit('wave-completed', {
      wave: this.currentWaveNumber
    });

    if (this.currentWaveNumber >= 10) {
      this.state = WAVE_STATE.VICTORY;
      this.scene.events.emit('victory');
    } else {
      this.currentWaveNumber++;
      this.state = WAVE_STATE.PREPARATION;
      this.prepTimerSeconds = BALANCE.WAVES[this.currentWaveNumber - 1].prepTimeSeconds;
      this.prepClock = 0;

      // Auto-save progression after wave completion
      this.scene.saveSystem.saveGame();
    }
  }

  destroy() {
    this.scene.events.off('enemy-killed', this.onEnemyKilled);
  }
}
