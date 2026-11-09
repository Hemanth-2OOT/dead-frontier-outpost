/**
 * DEAD FRONTIER: OUTPOST
 * UIScene: Dedicated UI layer managing HUD, Build Menu, Building Panel, and Menus
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { HUD } from '../ui/HUD.js';
import { Minimap } from '../ui/Minimap.js';
import { BuildMenu } from '../ui/BuildMenu.js';
import { BuildingPanel } from '../ui/BuildingPanel.js';
import { GameMenus } from '../ui/GameMenus.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.gameScene = this.scene.get('GameScene');

    this.hud = new HUD(this);
    this.minimap = new Minimap(this);
    this.buildMenu = new BuildMenu(this);
    this.buildingPanel = new BuildingPanel(this);
    this.gameMenus = new GameMenus(this);

    this.setupEventListeners();

    // Clean up event listeners when UIScene shuts down
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupEventListeners();
    });
  }

  update(time, delta) {
    if (this.minimap) {
      this.minimap.update(time, delta);
    }
  }

  isPointerOverUI(screenX, screenY) {
    // 1. Any active modal
    if (this.gameMenus && this.gameMenus.activeModal) return true;

    // 2. Top HUD main banner & buttons
    if (screenY <= 44) return true;
    // Skip prep button in top center
    if (screenY <= 62 && Math.abs(screenX - 512) <= 70) return true;

    // Minimap radar panel on top-left
    if (this.minimap && this.minimap.visible) {
      const mh = this.minimap.isExpanded ? this.minimap.panelHeight : 24;
      if (screenX >= 10 && screenX <= 14 + this.minimap.panelWidth &&
          screenY >= 48 && screenY <= 50 + mh) {
        return true;
      }
    }

    // 3. Bottom construction bar (only within the toolbar horizontal bounds)
    if (this.buildMenu && this.buildMenu.visible && screenY >= GAME_CONFIG.HEIGHT - 68) {
      if (screenX >= 290 && screenX <= 734) {
        return true;
      }
    }

    // 4. Building Inspection Panel (if visible)
    if (this.buildingPanel && this.buildingPanel.visible) {
      const bx = this.buildingPanel.x;
      const by = this.buildingPanel.y;
      const halfW = (this.buildingPanel.panelWidth || 240) / 2;
      const halfH = (this.buildingPanel.panelHeight || 280) / 2;
      if (Math.abs(screenX - bx) <= halfW + 6 && Math.abs(screenY - by) <= halfH + 6) {
        return true;
      }
    }

    return false;
  }

  setupEventListeners() {
    // 1. Health & Ammo
    this.onHealthChanged = ({ current, max }) => {
      this.hud.updateHealth(current, max);
    };
    this.gameScene.events.on('player-health-changed', this.onHealthChanged);

    this.onAmmoChanged = ({ current, reserve, weapon }) => {
      this.hud.updateAmmo(current, reserve, weapon);
    };
    this.gameScene.events.on('player-ammo-changed', this.onAmmoChanged);

    // 2. Resources
    this.onResourcesChanged = (resources) => {
      this.hud.updateResources(resources);
      this.buildMenu.updateAffordability(resources);
    };
    this.gameScene.events.on('resources-changed', this.onResourcesChanged);

    // 3. Waves
    this.onWavePrepTick = ({ wave, secondsRemaining }) => {
      this.hud.updateWave(wave, 'PREP', secondsRemaining, true);
    };
    this.gameScene.events.on('wave-prep-tick', this.onWavePrepTick);

    this.onWaveStarted = ({ wave, totalEnemies }) => {
      this.hud.updateWave(wave, 'ACTIVE', totalEnemies, false);
    };
    this.gameScene.events.on('wave-started', this.onWaveStarted);

    this.onWaveEnemiesUpdated = ({ remaining }) => {
      this.hud.updateWave(this.gameScene.waveSystem.currentWaveNumber, 'ACTIVE', remaining, false);
    };
    this.gameScene.events.on('wave-enemies-updated', this.onWaveEnemiesUpdated);

    this.onWaveCompleted = ({ wave }) => {
      this.hud.updateWave(wave + 1, 'PREP', 25, true);
    };
    this.gameScene.events.on('wave-completed', this.onWaveCompleted);

    // 4. Power & Command Center
    this.onPowerChanged = ({ capacity, demand, isSufficient }) => {
      this.hud.updatePower(capacity, demand, isSufficient);
    };
    this.gameScene.events.on('power-status-changed', this.onPowerChanged);

    this.onHQHealthChanged = ({ current, max }) => {
      this.hud.updateCommandCenter(current, max);
      if (this.minimap) {
        this.minimap.updateHQBar(current, max);
      }
    };
    this.gameScene.events.on('command-center-health-changed', this.onHQHealthChanged);

    // 5. Building interaction
    this.onBuildingSelected = (building) => {
      this.buildingPanel.showBuilding(building);
    };
    this.gameScene.events.on('building-selected', this.onBuildingSelected);

    this.onSelectToPlace = (type) => {
      this.gameScene.buildingSystem.startPlacement(type);
    };
    this.events.on('select-building-to-place', this.onSelectToPlace);

    this.onCancelPlacement = () => {
      this.gameScene.buildingSystem.cancelPlacement();
    };
    this.events.on('cancel-building-placement', this.onCancelPlacement);

    this.onPlacementCancelled = () => {
      this.buildMenu.deselect();
    };
    this.gameScene.events.on('placement-cancelled', this.onPlacementCancelled);

    this.onDeconstruct = (building) => {
      this.gameScene.buildingSystem.deconstructBuilding(building);
    };
    this.events.on('deconstruct-building', this.onDeconstruct);

    this.onSkipPrep = () => {
      this.gameScene.waveSystem.skipPreparation();
    };
    this.events.on('skip-prep-clicked', this.onSkipPrep);

    this.onToggleBuild = () => {
      this.buildMenu.setVisible(!this.buildMenu.visible);
    };
    this.gameScene.events.on('toggle-build-menu', this.onToggleBuild);

    // 6. Pause & Game End Modals
    this.onTogglePause = () => {
      if (this.gameScene.scene.isPaused()) {
        this.gameScene.scene.resume();
        this.gameMenus.closeModal();
      } else {
        this.gameScene.scene.pause();
        this.gameMenus.showPauseMenu(
          () => this.gameScene.scene.resume(),
          () => this.restartGame(),
          () => this.returnToMainMenu()
        );
      }
    };
    this.gameScene.events.on('toggle-pause', this.onTogglePause);

    this.onPlayerDied = () => {
      this.gameScene.scene.pause();
      this.gameMenus.showDefeatMenu(
        this.gameScene.waveSystem.currentWaveNumber,
        () => this.restartGame(),
        () => this.returnToMainMenu()
      );
    };
    this.gameScene.events.on('player-died', this.onPlayerDied);

    this.onHQDestroyed = () => {
      this.gameScene.scene.pause();
      this.gameMenus.showDefeatMenu(
        this.gameScene.waveSystem.currentWaveNumber,
        () => this.restartGame(),
        () => this.returnToMainMenu()
      );
    };
    this.gameScene.events.on('command-center-destroyed', this.onHQDestroyed);

    this.onVictory = () => {
      this.gameScene.scene.pause();
      this.gameMenus.showVictoryMenu(
        () => this.restartGame(),
        () => this.returnToMainMenu()
      );
    };
    this.gameScene.events.on('victory', this.onVictory);
  }

  cleanupEventListeners() {
    if (!this.gameScene || !this.gameScene.events) return;
    this.gameScene.events.off('player-health-changed', this.onHealthChanged);
    this.gameScene.events.off('player-ammo-changed', this.onAmmoChanged);
    this.gameScene.events.off('resources-changed', this.onResourcesChanged);
    this.gameScene.events.off('wave-prep-tick', this.onWavePrepTick);
    this.gameScene.events.off('wave-started', this.onWaveStarted);
    this.gameScene.events.off('wave-enemies-updated', this.onWaveEnemiesUpdated);
    this.gameScene.events.off('wave-completed', this.onWaveCompleted);
    this.gameScene.events.off('power-status-changed', this.onPowerChanged);
    this.gameScene.events.off('command-center-health-changed', this.onHQHealthChanged);
    this.gameScene.events.off('building-selected', this.onBuildingSelected);
    this.gameScene.events.off('placement-cancelled', this.onPlacementCancelled);
    this.gameScene.events.off('toggle-build-menu', this.onToggleBuild);
    this.gameScene.events.off('toggle-pause', this.onTogglePause);
    this.gameScene.events.off('player-died', this.onPlayerDied);
    this.gameScene.events.off('command-center-destroyed', this.onHQDestroyed);
    this.gameScene.events.off('victory', this.onVictory);
  }

  restartGame() {
    this.cleanupEventListeners();
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.start('GameScene');
  }

  returnToMainMenu() {
    this.cleanupEventListeners();
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }
}
