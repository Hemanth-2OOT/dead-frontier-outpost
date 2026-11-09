/**
 * DEAD FRONTIER: OUTPOST
 * Bottom Construction Bar: 8 Buildable Structures, Tooltips & Hotkeys
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BALANCE } from '../config/balanceConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class BuildMenu extends Phaser.GameObjects.Container {
  constructor(scene) {
    super(scene, 0, 0);
    this.scene = scene;

    this.buildingTypes = [
      'scrap_collector',
      'generator',
      'ammo_factory',
      'machine_gun_turret',
      'cannon_turret',
      'repair_station',
      'wall',
      'mine'
    ];

    this.slots = [];
    this.selectedType = null;

    this.createToolbar();
    this.createTooltip();
    this.setupHotkeys();

    scene.add.existing(this);
  }

  createToolbar() {
    const totalSlots = this.buildingTypes.length;
    const slotWidth = 48;
    const totalWidth = totalSlots * slotWidth + 20;
    const startX = (GAME_CONFIG.WIDTH - totalWidth) / 2;
    const y = GAME_CONFIG.HEIGHT - 38;

    // Background panel
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x171a1c, 0.9);
    bg.fillRoundedRect(startX, y - 24, totalWidth, 54, 8);
    bg.lineStyle(2, 0x5b676d, 1);
    bg.strokeRoundedRect(startX, y - 24, totalWidth, 54, 8);
    this.add(bg);

    // Header label
    const header = this.scene.add.text(startX + 12, y - 20, 'CONSTRUCTION [B]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#d6893c',
      fontStyle: 'bold'
    });
    this.add(header);

    // Build slots
    this.buildingTypes.forEach((type, idx) => {
      const sx = startX + 24 + idx * slotWidth;
      const slotContainer = this.scene.add.container(sx, y + 6);

      // Slot frame
      const frame = this.scene.add.image(0, 0, `select_${type}`);
      frame.setScale(0.85);
      slotContainer.add(frame);

      // Icon
      const icon = this.scene.add.image(0, 0, `icon_${type}`);
      icon.setScale(0.8);
      slotContainer.add(icon);

      // Hotkey badge (1-8)
      const hotkeyTxt = this.scene.add.text(14, -14, `${idx + 1}`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffd24a',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      slotContainer.add(hotkeyTxt);

      // Make slot interactive
      frame.setInteractive({ useHandCursor: true });
      frame.on('pointerdown', () => {
        soundSystem.playClick();
        this.selectBuilding(type);
      });

      frame.on('pointerover', () => {
        this.showTooltip(type, sx, y - 48);
      });

      frame.on('pointerout', () => {
        this.hideTooltip();
      });

      this.slots.push({
        type,
        container: slotContainer,
        frame,
        icon
      });

      this.add(slotContainer);
    });
  }

  createTooltip() {
    this.tooltip = this.scene.add.container(0, 0);
    this.tooltip.setDepth(200);
    this.tooltip.setVisible(false);

    this.tooltipBg = this.scene.add.graphics();
    this.tooltip.add(this.tooltipBg);

    this.tooltipTitle = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#d6893c',
      fontStyle: 'bold'
    });
    this.tooltip.add(this.tooltipTitle);

    this.tooltipDesc = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#d9dacf',
      wordWrap: { width: 180 }
    });
    this.tooltip.add(this.tooltipDesc);

    this.tooltipCost = this.scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffd24a',
      fontStyle: 'bold'
    });
    this.tooltip.add(this.tooltipCost);

    this.add(this.tooltip);
  }

  showTooltip(type, x, y) {
    const meta = BALANCE.BUILDINGS[type];
    if (!meta) return;

    this.tooltipTitle.setText(meta.name);
    this.tooltipDesc.setText(meta.description);

    let costStr = 'Cost: ';
    if (meta.cost.scrap > 0) costStr += `${meta.cost.scrap} Scrap  `;
    if (meta.cost.metal > 0) costStr += `${meta.cost.metal} Metal  `;
    this.tooltipCost.setText(costStr);

    const w = 200;
    const h = 70;

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x171a1c, 0.95);
    this.tooltipBg.fillRoundedRect(-w / 2, -h, w, h, 6);
    this.tooltipBg.lineStyle(1, 0x5b676d, 1);
    this.tooltipBg.strokeRoundedRect(-w / 2, -h, w, h, 6);

    this.tooltipTitle.setPosition(-w / 2 + 10, -h + 8);
    this.tooltipDesc.setPosition(-w / 2 + 10, -h + 24);
    this.tooltipCost.setPosition(-w / 2 + 10, -h + 52);

    this.tooltip.setPosition(x, y);
    this.tooltip.setVisible(true);
  }

  hideTooltip() {
    this.tooltip.setVisible(false);
  }

  setupHotkeys() {
    const keyCodes = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
      Phaser.Input.Keyboard.KeyCodes.SEVEN,
      Phaser.Input.Keyboard.KeyCodes.EIGHT
    ];

    const numpadCodes = [
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_SIX,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_SEVEN,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_EIGHT
    ];

    keyCodes.forEach((code, idx) => {
      this.scene.input.keyboard.on(`keydown-${code}`, () => {
        if (this.buildingTypes[idx]) {
          soundSystem.playClick();
          this.selectBuilding(this.buildingTypes[idx]);
        }
      });
    });

    numpadCodes.forEach((code, idx) => {
      this.scene.input.keyboard.on(`keydown-${code}`, () => {
        if (this.buildingTypes[idx]) {
          soundSystem.playClick();
          this.selectBuilding(this.buildingTypes[idx]);
        }
      });
    });
  }

  selectBuilding(type) {
    if (this.selectedType === type) {
      this.deselect();
      this.scene.events.emit('cancel-building-placement');
      return;
    }

    this.selectedType = type;
    this.slots.forEach((s) => {
      if (s.type === type) {
        s.frame.setTexture(`select_${s.type}_selected`);
      } else {
        s.frame.setTexture(`select_${s.type}`);
      }
    });

    this.scene.events.emit('select-building-to-place', type);
  }

  deselect() {
    this.selectedType = null;
    this.slots.forEach((s) => {
      s.frame.setTexture(`select_${s.type}`);
    });
  }

  updateAffordability(resources) {
    this.slots.forEach((s) => {
      const cost = BALANCE.BUILDINGS[s.type]?.cost;
      if (!cost) return;

      let canAfford = true;
      if (cost.scrap > resources.scrap) canAfford = false;
      if (cost.metal > resources.metal) canAfford = false;

      s.icon.setAlpha(canAfford ? 1.0 : 0.35);
      s.frame.setAlpha(canAfford ? 1.0 : 0.45);
    });
  }
}
