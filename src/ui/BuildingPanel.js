/**
 * DEAD FRONTIER: OUTPOST
 * Building Inspection & Outpost Tech Research Terminal
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class BuildingPanel extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, GAME_CONFIG.WIDTH - 140, GAME_CONFIG.HEIGHT / 2);
    this.scene = scene;
    this.currentBuilding = null;
    this.panelWidth = 240;
    this.panelHeight = 280;

    // Sub-containers for standard vs HQ views
    this.panelBg = this.scene.add.graphics();
    this.add(this.panelBg);

    this.standardContainer = this.scene.add.container(0, 0);
    this.add(this.standardContainer);

    this.researchContainer = this.scene.add.container(0, 0);
    this.add(this.researchContainer);

    this.createStandardView();
    this.createResearchView();

    this.setVisible(false);
    scene.add.existing(this);
  }

  createStandardView() {
    const w = 240;
    const h = 280;

    // Title
    this.titleText = this.scene.add.text(-w / 2 + 16, -h / 2 + 14, 'BUILDING INFO', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#d6893c',
      fontStyle: 'bold'
    });
    this.standardContainer.add(this.titleText);

    // Close button
    const closeBtn = this.scene.add.text(w / 2 - 20, -h / 2 + 14, 'X', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#c13a2b',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundSystem.playClick();
      this.close();
    });
    this.standardContainer.add(closeBtn);

    // Divider
    const div = this.scene.add.graphics();
    div.lineStyle(1, 0x364046, 1);
    div.lineBetween(-w / 2 + 10, -h / 2 + 36, w / 2 - 10, -h / 2 + 36);
    this.standardContainer.add(div);

    // Building Icon
    this.iconImage = this.scene.add.image(-w / 2 + 36, -h / 2 + 66, 'icon_scrap');
    this.standardContainer.add(this.iconImage);

    // Status details text
    this.detailsText = this.scene.add.text(-w / 2 + 68, -h / 2 + 48, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d9dacf',
      lineSpacing: 4
    });
    this.standardContainer.add(this.detailsText);

    // Context Action Button (e.g. Repair, Reload, Refuel)
    this.actionBtn = this.scene.add.container(0, h / 2 - 58);
    const aBtnBg = this.scene.add.graphics();
    aBtnBg.fillStyle(0x262c30, 1);
    aBtnBg.fillRoundedRect(-90, -12, 180, 24, 4);
    aBtnBg.lineStyle(1, 0x6bae3a, 1);
    aBtnBg.strokeRoundedRect(-90, -12, 180, 24, 4);
    this.actionBtn.add(aBtnBg);

    this.actionBtnTxt = this.scene.add.text(0, 0, 'REPAIR (5 SCRAP)', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6bae3a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.actionBtn.add(this.actionBtnTxt);

    this.actionBtn.setSize(180, 24);
    this.actionBtn.setInteractive(new Phaser.Geom.Rectangle(-90, -12, 180, 24), Phaser.Geom.Rectangle.Contains);
    this.actionBtn.on('pointerdown', () => {
      this.performAction();
    });
    this.standardContainer.add(this.actionBtn);

    // Deconstruct button
    this.deconstructBtn = this.scene.add.container(0, h / 2 - 24);
    const dBtnBg = this.scene.add.graphics();
    dBtnBg.fillStyle(0xc13a2b, 0.85);
    dBtnBg.fillRoundedRect(-90, -12, 180, 24, 4);
    dBtnBg.lineStyle(1, 0xae2b25, 1);
    dBtnBg.strokeRoundedRect(-90, -12, 180, 24, 4);
    this.deconstructBtn.add(dBtnBg);

    const dBtnTxt = this.scene.add.text(0, 0, 'DECONSTRUCT (50% REFUND)', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.deconstructBtn.add(dBtnTxt);

    this.deconstructBtn.setSize(180, 24);
    this.deconstructBtn.setInteractive(new Phaser.Geom.Rectangle(-90, -12, 180, 24), Phaser.Geom.Rectangle.Contains);
    this.deconstructBtn.on('pointerdown', () => {
      if (this.currentBuilding) {
        this.scene.events.emit('deconstruct-building', this.currentBuilding);
        this.close();
      }
    });
    this.standardContainer.add(this.deconstructBtn);
  }

  createResearchView() {
    const w = 310;
    const h = 420;

    // Header Title
    this.hqTitleText = this.scene.add.text(-w / 2 + 16, -h / 2 + 14, 'COMMAND CENTRE (HQ)', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#38bdf8',
      fontStyle: 'bold'
    });
    this.researchContainer.add(this.hqTitleText);

    // Close button
    const closeBtn = this.scene.add.text(w / 2 - 20, -h / 2 + 14, 'X', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#c13a2b',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundSystem.playClick();
      this.close();
    });
    this.researchContainer.add(closeBtn);

    // Divider
    const div1 = this.scene.add.graphics();
    div1.lineStyle(1, 0x364046, 1);
    div1.lineBetween(-w / 2 + 10, -h / 2 + 34, w / 2 - 10, -h / 2 + 34);
    this.researchContainer.add(div1);

    // HQ Status (Health + Repair)
    this.hqStatusText = this.scene.add.text(-w / 2 + 16, -h / 2 + 42, 'Health: 1600/1600', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d9dacf'
    });
    this.researchContainer.add(this.hqStatusText);

    // HQ Repair button
    this.hqRepairBtn = this.scene.add.container(w / 2 - 65, -h / 2 + 48);
    const repBg = this.scene.add.graphics();
    repBg.fillStyle(0x262c30, 1);
    repBg.fillRoundedRect(-50, -10, 100, 20, 3);
    repBg.lineStyle(1, 0x6bae3a, 1);
    repBg.strokeRoundedRect(-50, -10, 100, 20, 3);
    this.hqRepairBtn.add(repBg);

    this.hqRepairTxt = this.scene.add.text(0, 0, 'REPAIR (5 SCRAP)', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#6bae3a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.hqRepairBtn.add(this.hqRepairTxt);
    this.hqRepairBtn.setSize(100, 20);
    this.hqRepairBtn.setInteractive(new Phaser.Geom.Rectangle(-50, -10, 100, 20), Phaser.Geom.Rectangle.Contains);
    this.hqRepairBtn.on('pointerdown', () => {
      this.performHQRepair();
    });
    this.researchContainer.add(this.hqRepairBtn);

    // Subheader: Tech Tree
    const techSub = this.scene.add.text(0, -h / 2 + 74, '── OUTPOST TECH RESEARCH ──', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);
    this.researchContainer.add(techSub);

    // 4 Upgrade Cards
    this.upgradeCards = [];
    const upgradeKeys = ['armor', 'turrets', 'automation', 'speed'];
    const startY = -h / 2 + 96;
    const cardHeight = 72;

    upgradeKeys.forEach((key, index) => {
      const cy = startY + index * cardHeight;
      const card = this.createUpgradeCard(key, -w / 2 + 10, cy, w - 20, 66);
      this.researchContainer.add(card.container);
      this.upgradeCards.push(card);
    });
  }

  createUpgradeCard(upgradeId, x, y, width, height) {
    const container = this.scene.add.container(x, y);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1c2126, 0.9);
    bg.fillRoundedRect(0, 0, width, height, 4);
    bg.lineStyle(1, 0x364046, 1);
    bg.strokeRoundedRect(0, 0, width, height, 4);
    container.add(bg);

    // Title & Level text
    const titleText = this.scene.add.text(8, 6, '', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#38bdf8',
      fontStyle: 'bold'
    });
    container.add(titleText);

    // Description
    const descText = this.scene.add.text(8, 22, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#9aa0a6'
    });
    container.add(descText);

    // Cost text
    const costText = this.scene.add.text(8, 44, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#e5e7eb'
    });
    container.add(costText);

    // Research Button
    const btnContainer = this.scene.add.container(width - 55, height - 18);
    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(0x262c30, 1);
    btnBg.fillRoundedRect(-45, -11, 90, 22, 3);
    btnBg.lineStyle(1, 0x6bae3a, 1);
    btnBg.strokeRoundedRect(-45, -11, 90, 22, 3);
    btnContainer.add(btnBg);

    const btnText = this.scene.add.text(0, 0, 'RESEARCH', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#6bae3a',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    btnContainer.add(btnText);

    btnContainer.setSize(90, 22);
    btnContainer.setInteractive(new Phaser.Geom.Rectangle(-45, -11, 90, 22), Phaser.Geom.Rectangle.Contains);
    btnContainer.on('pointerdown', () => {
      this.researchUpgrade(upgradeId);
    });
    container.add(btnContainer);

    return {
      upgradeId,
      container,
      bg,
      titleText,
      descText,
      costText,
      btnContainer,
      btnBg,
      btnText
    };
  }

  showBuilding(building) {
    this.currentBuilding = building;
    const isHQ = building.buildingType === 'command_center';

    if (isHQ) {
      this.panelWidth = 310;
      this.panelHeight = 420;
      this.setPosition(GAME_CONFIG.WIDTH - 170, GAME_CONFIG.HEIGHT / 2);

      this.standardContainer.setVisible(false);
      this.researchContainer.setVisible(true);
    } else {
      this.panelWidth = 240;
      this.panelHeight = 280;
      this.setPosition(GAME_CONFIG.WIDTH - 140, GAME_CONFIG.HEIGHT / 2);

      const type = building.buildingType;
      const name = BALANCE.BUILDINGS[type]?.name ?? type;
      this.titleText.setText(name);

      const iconKey = `icon_${type}`;
      if (this.scene.textures.exists(iconKey)) {
        this.iconImage.setTexture(iconKey);
      }

      this.deconstructBtn.setVisible(true);
      this.standardContainer.setVisible(true);
      this.researchContainer.setVisible(false);
    }

    this.redrawBackground();
    this.updateDetails();
    this.setVisible(true);
  }

  redrawBackground() {
    this.panelBg.clear();
    const w = this.panelWidth;
    const h = this.panelHeight;
    this.panelBg.fillStyle(0x13171a, 0.96);
    this.panelBg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.panelBg.lineStyle(2, 0x4a555c, 1);
    this.panelBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  }

  performHQRepair() {
    if (!this.currentBuilding || this.currentBuilding.buildingType !== 'command_center') return;
    const b = this.currentBuilding;
    const rs = this.scene.gameScene.resourceSystem;

    if (b.health < b.maxHealth) {
      if (rs.resources.scrap >= 5) {
        rs.deductResource('scrap', 5);
        b.repair(60);
        soundSystem.playBuild();
        this.updateDetails();
      } else {
        soundSystem.playError();
      }
    }
  }

  researchUpgrade(upgradeId) {
    const success = this.scene.gameScene.researchUpgrade(upgradeId);
    if (success) {
      this.updateDetails();
    }
  }

  performAction() {
    if (!this.currentBuilding || !this.currentBuilding.active) return;
    const b = this.currentBuilding;
    const rs = this.scene.gameScene.resourceSystem;

    // Turret: reload ammo
    if (b.isTurret && b.currentAmmo < b.ammoCapacity) {
      if (rs.resources.ammunition >= 10) {
        const transfer = Math.min(20, b.ammoCapacity - b.currentAmmo, rs.resources.ammunition);
        rs.deductResource('ammunition', transfer);
        b.currentAmmo += transfer;
        soundSystem.playReload();
        this.updateDetails();
      } else {
        soundSystem.playError();
      }
      return;
    }

    // Generator: add fuel
    if (b.buildingType === 'generator' && b.internalInventory.fuel < 80) {
      if (rs.resources.fuel >= 10) {
        rs.deductResource('fuel', 10);
        b.internalInventory.fuel += 10;
        soundSystem.playBuild();
        this.updateDetails();
      } else {
        soundSystem.playError();
      }
      return;
    }

    // Any damaged structure: repair using scrap
    if (b.health < b.maxHealth) {
      if (rs.resources.scrap >= 5) {
        rs.deductResource('scrap', 5);
        b.repair(50);
        soundSystem.playBuild();
        this.updateDetails();
      } else {
        soundSystem.playError();
      }
    }
  }

  updateDetails() {
    if (!this.currentBuilding || !this.currentBuilding.active) {
      this.close();
      return;
    }

    const b = this.currentBuilding;

    // HQ Research view update
    if (b.buildingType === 'command_center') {
      this.hqStatusText.setText(`Health: ${Math.round(b.health)}/${b.maxHealth}`);
      this.hqRepairBtn.setVisible(b.health < b.maxHealth);

      const rs = this.scene.gameScene.resourceSystem;
      const gs = this.scene.gameScene;

      this.upgradeCards.forEach((card) => {
        const upg = BALANCE.UPGRADES[card.upgradeId];
        if (!upg) return;

        const currentLvl = gs.getUpgradeLevel(card.upgradeId);
        card.titleText.setText(`${upg.name} [LVL ${currentLvl}/${upg.maxLevel}]`);
        card.descText.setText(upg.description);

        if (currentLvl >= upg.maxLevel) {
          card.costText.setText('STATUS: MAX LEVEL ACHIEVED');
          card.costText.setColor('#ffd24a');
          card.btnText.setText('MAXED');
          card.btnText.setColor('#ffd24a');
          card.btnBg.clear();
          card.btnBg.fillStyle(0x383424, 0.9);
          card.btnBg.fillRoundedRect(-45, -11, 90, 22, 3);
          card.btnBg.lineStyle(1, 0x8a7024, 1);
          card.btnBg.strokeRoundedRect(-45, -11, 90, 22, 3);
        } else {
          const nextTier = upg.levels[currentLvl];
          const costStr = `Cost: ${nextTier.cost.scrap ?? 0} Scrap, ${nextTier.cost.metal ?? 0} Metal`;
          card.costText.setText(costStr);

          const canAfford = rs.canAfford(nextTier.cost);
          card.costText.setColor(canAfford ? '#e5e7eb' : '#ef4444');
          card.btnText.setText('RESEARCH');
          card.btnText.setColor(canAfford ? '#6bae3a' : '#757d82');

          card.btnBg.clear();
          card.btnBg.fillStyle(canAfford ? 0x223524 : 0x262c30, 1);
          card.btnBg.fillRoundedRect(-45, -11, 90, 22, 3);
          card.btnBg.lineStyle(1, canAfford ? 0x6bae3a : 0x50575c, 1);
          card.btnBg.strokeRoundedRect(-45, -11, 90, 22, 3);
        }
      });
      return;
    }

    // Standard building view update
    let str = `Health: ${Math.round(b.health)}/${b.maxHealth}\n`;

    if (b.isTurret) {
      str += `Ammo: ${b.currentAmmo}/${b.ammoCapacity}\n`;
      str += `Range: ${b.range} px\n`;
      str += `Fire Rate: ${b.fireRateMs} ms\n`;
      this.actionBtnTxt.setText(b.currentAmmo < b.ammoCapacity ? 'RELOAD (10-20 AMMO)' : 'AMMO FULL');
      this.actionBtn.setVisible(true);
    } else if (b.buildingType === 'generator') {
      str += `Fuel: ${b.internalInventory.fuel}/100\n`;
      str += `Output: ${b.powerOutput} KW\n`;
      str += `Status: ${b.internalInventory.fuel > 0 ? 'ACTIVE' : 'NO FUEL'}\n`;
      this.actionBtnTxt.setText(b.internalInventory.fuel < 80 ? 'ADD FUEL (10 FUEL)' : 'FUEL FULL');
      this.actionBtn.setVisible(true);
    } else if (b.buildingType === 'ammo_factory') {
      str += `Power: ${b.hasPower ? 'POWERED (15KW)' : 'UNPOWERED'}\n`;
      str += `Consumes: 2 Scrap, 1 Metal\n`;
      str += `Produces: 16 Ammunition\n`;
      this.actionBtnTxt.setText(b.health < b.maxHealth ? 'REPAIR (5 SCRAP)' : 'REPAIRED');
      this.actionBtn.setVisible(b.health < b.maxHealth);
    } else if (b.buildingType === 'scrap_collector') {
      str += `Yield: +3 Scrap / 3.5s\n`;
      str += `Power: NOT REQUIRED\n`;
      this.actionBtnTxt.setText(b.health < b.maxHealth ? 'REPAIR (5 SCRAP)' : 'REPAIRED');
      this.actionBtn.setVisible(b.health < b.maxHealth);
    } else if (b.buildingType === 'repair_station') {
      str += `Power: ${b.hasPower ? 'POWERED (10KW)' : 'UNPOWERED'}\n`;
      str += `Repairs: Nearby structures\n`;
      this.actionBtnTxt.setText(b.health < b.maxHealth ? 'REPAIR (5 SCRAP)' : 'REPAIRED');
      this.actionBtn.setVisible(b.health < b.maxHealth);
    } else {
      this.actionBtnTxt.setText(b.health < b.maxHealth ? 'REPAIR (5 SCRAP)' : 'REPAIRED');
      this.actionBtn.setVisible(b.health < b.maxHealth);
    }

    this.detailsText.setText(str);
  }

  close() {
    this.currentBuilding = null;
    this.setVisible(false);
  }
}
