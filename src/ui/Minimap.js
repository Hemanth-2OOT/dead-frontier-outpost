/**
 * DEAD FRONTIER: OUTPOST
 * Tactical Radar Minimap Widget (Factorio-style Outpost Radar)
 * Top-left corner surveillance screen: terrain zones, real-time horde tracking,
 * buildings, player location, camera viewport, and click-to-pan.
 */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { soundSystem } from '../systems/SoundSystem.js';

export class Minimap extends Phaser.GameObjects.Container {
  constructor(scene) {
    // Top-left position under the main status banner
    super(scene, 14, 50);
    this.scene = scene;
    this.gameScene = scene.scene.get('GameScene');

    // Dimensions
    this.mapWidth = 128;
    this.mapHeight = 128;
    this.panelWidth = 144;
    this.panelHeight = 186;

    // Scale from 2048 world to 128 minimap (1:16 scale, 1 tile = 2px)
    this.scaleFactor = this.mapWidth / GAME_CONFIG.WORLD_WIDTH; // 128 / 2048 = 0.0625

    this.isExpanded = true;
    this.sweepAngle = 0;
    this.hqHealth = { current: 1600, max: 1600 };

    this.createPanel();
    this.setupInteractivity();
    this.setupHotkeys();

    scene.add.existing(this);
  }

  createPanel() {
    // Outer frame container
    this.frameBg = this.scene.add.graphics();
    this.add(this.frameBg);

    // Header elements
    this.headerTitle = this.scene.add.text(8, 5, 'RADAR SURVEY [M]', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#d6893c',
      fontStyle: 'bold'
    });
    this.add(this.headerTitle);

    this.coordText = this.scene.add.text(this.panelWidth - 8, 5, 'LOC 30,33', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#929fa5',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.add(this.coordText);

    // Radar screen graphics display (128x128)
    this.radarGraphics = this.scene.add.graphics();
    this.add(this.radarGraphics);

    // Radar sweep line graphics
    this.sweepGraphics = this.scene.add.graphics();
    this.add(this.sweepGraphics);

    // Interactive hit area over the 128x128 radar screen for click-to-pan
    this.radarZone = this.scene.add.zone(8, 22, this.mapWidth, this.mapHeight)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    this.add(this.radarZone);

    // Footer HQ Health Bar elements
    this.hqBarBg = this.scene.add.graphics();
    this.add(this.hqBarBg);

    this.hqBarFill = this.scene.add.graphics();
    this.add(this.hqBarFill);

    this.hqLabel = this.scene.add.text(this.panelWidth / 2, 168, 'HQ: 1600/1600', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.add(this.hqLabel);

    this.redrawFrame();
    this.updateHQBar(1600, 1600);
  }

  redrawFrame() {
    this.frameBg.clear();

    if (this.isExpanded) {
      // Full frame
      this.frameBg.fillStyle(0x13151a, 0.94);
      this.frameBg.fillRoundedRect(0, 0, this.panelWidth, this.panelHeight, 6);
      this.frameBg.lineStyle(1, 0x364046, 1);
      this.frameBg.strokeRoundedRect(0, 0, this.panelWidth, this.panelHeight, 6);

      // Industrial corner tabs (amber)
      this.frameBg.fillStyle(0xd6893c, 0.9);
      this.frameBg.fillRect(0, 0, 4, 4);
      this.frameBg.fillRect(this.panelWidth - 4, 0, 4, 4);
      this.frameBg.fillRect(0, this.panelHeight - 4, 4, 4);
      this.frameBg.fillRect(this.panelWidth - 4, this.panelHeight - 4, 4, 4);

      // Header divider
      this.frameBg.lineStyle(1, 0x262c30, 1);
      this.frameBg.lineBetween(4, 18, this.panelWidth - 4, 18);

      // Radar screen border
      this.frameBg.fillStyle(0x0a1013, 1);
      this.frameBg.fillRect(8, 22, this.mapWidth, this.mapHeight);
      this.frameBg.lineStyle(1, 0x26343b, 1);
      this.frameBg.strokeRect(8, 22, this.mapWidth, this.mapHeight);

      // Footer divider
      this.frameBg.lineStyle(1, 0x262c30, 1);
      this.frameBg.lineBetween(4, 154, this.panelWidth - 4, 154);
    } else {
      // Collapsed frame: compact 24px header
      this.frameBg.fillStyle(0x13151a, 0.94);
      this.frameBg.fillRoundedRect(0, 0, this.panelWidth, 24, 6);
      this.frameBg.lineStyle(1, 0x364046, 1);
      this.frameBg.strokeRoundedRect(0, 0, this.panelWidth, 24, 6);

      this.frameBg.fillStyle(0xd6893c, 0.9);
      this.frameBg.fillRect(0, 0, 4, 4);
      this.frameBg.fillRect(this.panelWidth - 4, 0, 4, 4);
    }
  }

  setupInteractivity() {
    // Click on header title toggles expand/collapse
    this.headerTitle.setInteractive({ useHandCursor: true });
    this.headerTitle.on('pointerdown', () => {
      soundSystem.playClick();
      this.toggleExpand();
    });

    // Click on radar screen to pan camera
    this.radarZone.on('pointerdown', (pointer) => {
      if (!this.isExpanded) return;
      const localX = pointer.x - this.x - 8;
      const localY = pointer.y - this.y - 22;

      if (localX >= 0 && localX <= this.mapWidth && localY >= 0 && localY <= this.mapHeight) {
        const targetWorldX = localX / this.scaleFactor;
        const targetWorldY = localY / this.scaleFactor;

        // Pan main camera smoothly to target
        if (this.gameScene && this.gameScene.cameras.main) {
          soundSystem.playClick();
          this.gameScene.cameras.main.pan(targetWorldX, targetWorldY, 300, 'Power2');
        }
      }
    });
  }

  setupHotkeys() {
    // 'M' key toggles minimap
    this.scene.input.keyboard.on('keydown-M', () => {
      soundSystem.playClick();
      this.toggleExpand();
    });
  }

  toggleExpand() {
    const now = Date.now();
    if (this.lastToggleTime && now - this.lastToggleTime < 250) return;
    this.lastToggleTime = now;

    this.isExpanded = !this.isExpanded;
    this.radarGraphics.setVisible(this.isExpanded);
    this.sweepGraphics.setVisible(this.isExpanded);
    this.radarZone.input.enabled = this.isExpanded;
    this.hqBarBg.setVisible(this.isExpanded);
    this.hqBarFill.setVisible(this.isExpanded);
    this.hqLabel.setVisible(this.isExpanded);

    this.headerTitle.setText(this.isExpanded ? 'RADAR SURVEY [M]' : 'RADAR [M] (MIN)');
    this.redrawFrame();
  }

  updateHQBar(current, max) {
    this.hqHealth = { current, max };
    if (!this.hqBarBg || !this.hqBarFill) return;

    const x = 12;
    const y = 160;
    const w = this.panelWidth - 24;
    const h = 14;

    this.hqBarBg.clear();
    this.hqBarBg.fillStyle(0x1a2126, 1);
    this.hqBarBg.fillRoundedRect(x, y, w, h, 3);
    this.hqBarBg.lineStyle(1, 0x364046, 1);
    this.hqBarBg.strokeRoundedRect(x, y, w, h, 3);

    const pct = Math.max(0, Math.min(1, current / max));
    this.hqBarFill.clear();
    const color = pct > 0.5 ? 0x6bae3a : (pct > 0.25 ? 0xd6893c : 0xc13a2b);
    this.hqBarFill.fillStyle(color, 1);
    this.hqBarFill.fillRoundedRect(x + 1, y + 1, (w - 2) * pct, h - 2, 2);

    this.hqLabel.setText(`HQ: ${Math.round(current)}/${max}`);
  }

  update(time, delta) {
    if (!this.visible || !this.isExpanded) return;
    if (!this.gameScene || !this.gameScene.scene.isActive()) return;

    const gs = this.gameScene;
    const g = this.radarGraphics;
    const s = this.scaleFactor; // 0.0625
    const ox = 8;
    const oy = 22;

    g.clear();

    // 1. Base Environment / Compound Ground (tiles 22 to 42)
    // In minimap coords: 22*32*0.0625 = 44, size 20*32*0.0625 = 40
    g.fillStyle(0x152026, 1);
    g.fillRect(ox + 44, oy + 44, 40, 40);

    // Center concrete pad (tiles 28 to 33)
    g.fillStyle(0x1e2c33, 1);
    g.fillRect(ox + 56, oy + 56, 16, 16);

    // Crossroad axes (road centers)
    g.fillStyle(0x233138, 1);
    g.fillRect(ox + 58, oy, 12, this.mapHeight); // vertical road
    g.fillRect(ox, oy + 58, this.mapWidth, 12); // horizontal road

    // Subtle 32px radar grid lines
    g.lineStyle(1, 0x111c21, 0.7);
    for (let x = 16; x < this.mapWidth; x += 16) {
      g.lineBetween(ox + x, oy, ox + x, oy + this.mapHeight);
    }
    for (let y = 16; y < this.mapHeight; y += 16) {
      g.lineBetween(ox, oy + y, ox + this.mapWidth, oy + y);
    }

    // 2. Camera Viewport Box (Frustum)
    const cam = gs.cameras.main;
    if (cam) {
      const vx = ox + cam.scrollX * s;
      const vy = oy + cam.scrollY * s;
      const vw = cam.width * s;
      const vh = cam.height * s;

      g.fillStyle(0x7fe3b4, 0.08);
      g.fillRect(vx, vy, vw, vh);
      g.lineStyle(1, 0x7fe3b4, 0.75);
      g.strokeRect(vx, vy, vw, vh);
    }

    // 3. Strategic Scrap Deposits
    if (gs.propGroup) {
      g.fillStyle(0xd6893c, 0.85);
      const props = gs.propGroup.getChildren();
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        if (p.texture && p.texture.key && p.texture.key.startsWith('scrap_pile')) {
          g.fillRect(ox + Math.floor(p.x * s) - 1, oy + Math.floor(p.y * s) - 1, 3, 3);
        }
      }
    }

    // 4. Buildings & Defenses
    if (gs.buildingSystem) {
      const buildings = gs.buildingSystem.buildings;
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        if (!b.active || b.isDestroyed) continue;

        const bx = ox + Math.floor((b.x - b.width / 2) * s);
        const by = oy + Math.floor((b.y - b.height / 2) * s);
        const bw = Math.max(2, Math.floor(b.width * s));
        const bh = Math.max(2, Math.floor(b.height * s));

        if (b.buildingType === 'command_center') {
          // Central HQ: pulsing amber/gold marker
          g.fillStyle(0xd6893c, 1);
          g.fillRect(bx, by, bw, bh);
          g.fillStyle(0xffd24a, 1);
          g.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
        } else if (b.isTurret) {
          // Turrets: bright cyan dot
          g.fillStyle(0x38bdf8, 1);
          g.fillRect(bx, by, bw, bh);
        } else if (b.buildingType === 'wall') {
          // Walls: solid metallic slate
          g.fillStyle(0x94a3b8, 1);
          g.fillRect(bx, by, bw, bh);
        } else if (b.buildingType === 'generator' || b.buildingType === 'ammo_factory') {
          // Power & Factory: bright yellow
          g.fillStyle(0xeab308, 1);
          g.fillRect(bx, by, bw, bh);
        } else if (b.buildingType === 'repair_station') {
          // Repair station: lime green
          g.fillStyle(0x22c55e, 1);
          g.fillRect(bx, by, bw, bh);
        } else if (b.buildingType === 'mine') {
          // Landmine: tiny red/orange pip
          g.fillStyle(0xf97316, 1);
          g.fillRect(bx, by, 2, 2);
        } else {
          // Scrap collector / other
          g.fillStyle(0xd6893c, 1);
          g.fillRect(bx, by, bw, bh);
        }
      }
    }

    // 5. Hostile Horde (Zombies)
    if (gs.waveSystem && gs.waveSystem.zombieGroup) {
      const zombies = gs.waveSystem.zombieGroup.getChildren();
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        if (!z.active || z.isDead) continue;

        const zx = ox + Math.floor(z.x * s);
        const zy = oy + Math.floor(z.y * s);

        if (z.typeKey === 'brute') {
          // Brute: larger crimson square
          g.fillStyle(0xb91c1c, 1);
          g.fillRect(zx - 2, zy - 2, 4, 4);
        } else if (z.typeKey === 'runner') {
          // Runner: orange-red dot
          g.fillStyle(0xf87171, 1);
          g.fillRect(zx - 1, zy - 1, 2, 2);
        } else {
          // Walker: bright red dot
          g.fillStyle(0xef4444, 1);
          g.fillRect(zx - 1, zy - 1, 2, 2);
        }
      }
    }

    // 6. Player Character
    const p = gs.player;
    if (p && !p.isDead) {
      const px = ox + Math.floor(p.x * s);
      const py = oy + Math.floor(p.y * s);

      // Player green dot
      g.fillStyle(0x22c55e, 1);
      g.fillCircle(px, py, 3);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(px, py, 1);

      // Direction indicator pip
      let dx = 0;
      let dy = 0;
      if (p.direction === 'right') dx = 5;
      else if (p.direction === 'left') dx = -5;
      else if (p.direction === 'down') dy = 5;
      else if (p.direction === 'up') dy = -5;

      g.lineStyle(2, 0x22c55e, 1);
      g.lineBetween(px, py, px + dx, py + dy);

      // Update coordinates display in header
      const tileX = Math.floor(p.x / 32);
      const tileY = Math.floor(p.y / 32);
      this.coordText.setText(`X:${tileX} Y:${tileY}`);
    }

    // 7. Radar Sweep Scanline
    this.sweepAngle += delta * 0.0018; // ~3.5s per rotation
    this.sweepGraphics.clear();
    const cx = ox + this.mapWidth / 2;
    const cy = oy + this.mapHeight / 2;
    const rayLen = this.mapWidth * 0.7;

    const sx = cx + Math.cos(this.sweepAngle) * rayLen;
    const sy = cy + Math.sin(this.sweepAngle) * rayLen;

    this.sweepGraphics.lineStyle(1, 0x34d399, 0.45);
    this.sweepGraphics.lineBetween(cx, cy, sx, sy);
  }
}
