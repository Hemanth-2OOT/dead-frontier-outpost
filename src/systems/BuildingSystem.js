/**
 * DEAD FRONTIER: OUTPOST
 * Grid Building & Construction System: Placement, Validation, Physics Colliders
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { ASSET_CONFIG } from '../config/assetConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { Building } from '../entities/Building.js';
import { Turret } from '../entities/Turret.js';
import { GridUtils } from '../utils/GridUtils.js';
import { soundSystem } from './SoundSystem.js';

export class BuildingSystem {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.commandCenter = null;

    // Grid tracking: maps "tileX,tileY" to building reference
    this.grid = new Map();

    // Map bounds / obstacle cells (props, water, border margin)
    this.blockedCells = new Set();

    // Unified static physics group for all buildings (except landmines)
    this.buildingGroup = scene.physics.add.staticGroup();

    // Setup global colliders
    scene.physics.add.collider(scene.player, this.buildingGroup);

    // Build Preview state
    this.selectedBuildingType = null;
    this.previewSprite = null;
    this.previewIndicator = null;
    this.isPlacementValid = false;

    // Create central Command Centre
    this.createCommandCenter();

    // Setup input listeners for building placement preview
    this.setupInputListeners();
  }

  createCommandCenter() {
    const centerTile = GAME_CONFIG.BASE_CENTER_TILE;
    this.commandCenter = new Building(
      this.scene,
      centerTile.x - 1,
      centerTile.y - 1,
      'command_center'
    );
    this.registerBuilding(this.commandCenter);
  }

  setupInputListeners() {
    // Left-click to place building when in build mode
    this.scene.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown() || pointer.button === 2) {
        this.cancelPlacement();
        return;
      }

      const isLeft = pointer.button === 0 || (pointer.leftButtonDown && pointer.leftButtonDown());
      if (isLeft && this.selectedBuildingType) {
        // Prevent placing if pointer is over UI elements
        if (this.scene.isPointerOverUI && this.scene.isPointerOverUI(pointer.x, pointer.y)) {
          return;
        }
        this.tryPlaceBuilding(pointer);
      }
    });

    // Right-click or ESC to cancel placement
    this.scene.input.keyboard.on('keydown-ESC', () => {
      if (this.selectedBuildingType) {
        this.cancelPlacement();
      } else {
        this.scene.events.emit('toggle-pause');
      }
    });

    // B key to toggle build menu
    this.scene.input.keyboard.on('keydown-B', () => {
      this.scene.events.emit('toggle-build-menu');
    });
  }

  startPlacement(buildingType) {
    this.selectedBuildingType = buildingType;
    const meta = ASSET_CONFIG.BUILDINGS[buildingType];
    const size = meta.gridWidth * GAME_CONFIG.TILE_SIZE;
    const previewTexture = meta.isTurret ? `${buildingType}_base` : `${buildingType}_normal`;

    // Create preview visual if not existing
    if (!this.previewIndicator) {
      this.previewIndicator = this.scene.add.sprite(0, 0, size === 32 ? 'placement_valid_32' : 'placement_valid_64');
      this.previewIndicator.setOrigin(0.5, 0.5);
      this.previewIndicator.setDepth(100);
      this.previewIndicator.setAlpha(0.75);
    } else {
      this.previewIndicator.setTexture(size === 32 ? 'placement_valid_32' : 'placement_valid_64');
      this.previewIndicator.setVisible(true);
    }

    if (!this.previewSprite) {
      this.previewSprite = this.scene.add.sprite(0, 0, previewTexture);
      this.previewSprite.setOrigin(0.5, 0.5);
      this.previewSprite.setDepth(99);
      this.previewSprite.setAlpha(0.65);
    } else {
      this.previewSprite.setTexture(previewTexture);
      this.previewSprite.setVisible(true);
    }
  }

  cancelPlacement() {
    this.selectedBuildingType = null;
    if (this.previewIndicator) this.previewIndicator.setVisible(false);
    if (this.previewSprite) this.previewSprite.setVisible(false);
    this.scene.events.emit('placement-cancelled');
  }

  update(time, delta) {
    // Update preview position under mouse cursor
    if (this.selectedBuildingType && this.previewIndicator) {
      const pointer = this.scene.input.activePointer;
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

      const meta = ASSET_CONFIG.BUILDINGS[this.selectedBuildingType];
      const gw = meta.gridWidth;
      const gh = meta.gridHeight;

      const tile = GridUtils.worldToTile(worldPoint.x - (gw * 16), worldPoint.y - (gh * 16));
      const center = GridUtils.tileToWorldCenter(tile.tileX, tile.tileY, gw, gh);

      this.previewIndicator.setPosition(center.x, center.y);
      this.previewSprite.setPosition(center.x, center.y);

      // Validate placement
      this.isPlacementValid = this.canPlaceBuilding(tile.tileX, tile.tileY, gw, gh, this.selectedBuildingType);
      const indKey = (gw === 1)
        ? (this.isPlacementValid ? 'placement_valid_32' : 'placement_invalid_32')
        : (this.isPlacementValid ? 'placement_valid_64' : 'placement_invalid_64');
      this.previewIndicator.setTexture(indKey);
    }

    // Update all active buildings
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.active && !b.isDestroyed) {
        b.update(time, delta);
      }
    }
  }

  canPlaceBuilding(tileX, tileY, widthTiles, heightTiles, buildingType) {
    // Check bounds
    if (!GridUtils.isWithinBounds(tileX, tileY, 2) ||
        !GridUtils.isWithinBounds(tileX + widthTiles - 1, tileY + heightTiles - 1, 2)) {
      return false;
    }

    // Check resource affordability
    const cost = BALANCE.BUILDINGS[buildingType]?.cost;
    if (cost && !this.scene.resourceSystem.canAfford(cost)) {
      return false;
    }

    // Check cells overlap
    const cells = GridUtils.getOccupiedCells(tileX, tileY, widthTiles, heightTiles);
    for (let i = 0; i < cells.length; i++) {
      const key = cells[i].key;
      if (this.grid.has(key) || this.blockedCells.has(key)) {
        return false;
      }
    }

    // Check collision with player
    const center = GridUtils.tileToWorldCenter(tileX, tileY, widthTiles, heightTiles);
    const playerDist = GridUtils.distance(center.x, center.y, this.scene.player.x, this.scene.player.y);
    if (playerDist < (widthTiles * GAME_CONFIG.TILE_SIZE) / 2 + 16) {
      return false;
    }

    return true;
  }

  tryPlaceBuilding(pointer) {
    if (!this.selectedBuildingType || !this.isPlacementValid) {
      soundSystem.playError();
      return;
    }

    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const meta = ASSET_CONFIG.BUILDINGS[this.selectedBuildingType];
    const gw = meta.gridWidth;
    const gh = meta.gridHeight;
    const tile = GridUtils.worldToTile(worldPoint.x - (gw * 16), worldPoint.y - (gh * 16));

    if (!this.canPlaceBuilding(tile.tileX, tile.tileY, gw, gh, this.selectedBuildingType)) {
      soundSystem.playError();
      return;
    }

    // Deduct cost exactly once
    const cost = BALANCE.BUILDINGS[this.selectedBuildingType].cost;
    this.scene.resourceSystem.deductCost(cost);

    // Instantiate Building or Turret
    let building;
    if (meta.isTurret) {
      building = new Turret(this.scene, tile.tileX, tile.tileY, this.selectedBuildingType);
    } else {
      building = new Building(this.scene, tile.tileX, tile.tileY, this.selectedBuildingType);
    }

    this.registerBuilding(building);
    soundSystem.playBuild();

    // Floating text indicator
    this.scene.combatSystem.spawnFloatingText(
      building.x,
      building.y - 20,
      `+ ${BALANCE.BUILDINGS[this.selectedBuildingType].name}`,
      '#6bae3a'
    );

    // Cancel placement if shift is not held
    if (!this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown) {
      this.cancelPlacement();
    }
  }

  registerBuilding(building) {
    this.buildings.push(building);
    const cells = GridUtils.getOccupiedCells(
      building.tileX,
      building.tileY,
      building.gridWidth,
      building.gridHeight
    );
    cells.forEach((cell) => {
      this.grid.set(cell.key, building);
    });

    // Add to unified physics static group (except landmines)
    if (building.buildingType !== 'mine') {
      this.buildingGroup.add(building);
    }
  }

  removeBuilding(building) {
    const idx = this.buildings.indexOf(building);
    if (idx !== -1) {
      this.buildings.splice(idx, 1);
    }
    const cells = GridUtils.getOccupiedCells(
      building.tileX,
      building.tileY,
      building.gridWidth,
      building.gridHeight
    );
    cells.forEach((cell) => {
      this.grid.delete(cell.key);
    });

    if (this.buildingGroup.contains(building)) {
      this.buildingGroup.remove(building);
    }
  }

  deconstructBuilding(building) {
    if (!building || building.buildingType === 'command_center') {
      soundSystem.playError();
      return;
    }

    // Refund 50% scrap
    const cost = building.balanceMeta.cost;
    if (cost && cost.scrap) {
      const refund = Math.floor(cost.scrap * 0.5);
      this.scene.resourceSystem.addResource('scrap', refund);
      this.scene.combatSystem.spawnFloatingText(building.x, building.y - 20, `+${refund} Scrap`, '#d6893c');
    }

    soundSystem.playDeconstruct();
    this.removeBuilding(building);
    building.destroy();
  }

  getActiveBuildings() {
    return this.buildings.filter((b) => b.active && !b.isDestroyed);
  }
}
