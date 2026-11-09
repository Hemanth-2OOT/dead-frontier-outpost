# DEAD FRONTIER: OUTPOST
> **Build. Automate. Fortify. Survive.**

A 2D top-down zombie survival, automated base-defence, and light factory automation game built with **Phaser 3**, **Vite**, **JavaScript ES Modules**, and packaged for desktop with **Electron**.

---

## 1. Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended, tested on v24)
- npm

### Installation
```bash
npm install
```

### Running Local Development Server (Browser)
```bash
npm run dev
```
Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

### Building Production Web Version
```bash
npm run build
```
The compiled, minified bundle with all assets will be generated in `dist/`.

### Previewing Production Build
```bash
npm run preview
```

### Running Electron Desktop Application
```bash
npm run electron
```

---

## 2. Controls

| Key / Input | Action |
|---|---|
| **W, A, S, D** | Move Survivor character |
| **Mouse Cursor** | Aim weapon independently of movement |
| **Left Mouse Button** | Fire equipped weapon / confirm build placement |
| **R** | Reload ammunition from reserve |
| **B** | Open / close construction menu |
| **1 – 8 Number Keys** | Quick-select building structure |
| **Left Click on Structure** | Inspect structure (health, power, stats, deconstruct) |
| **Right Mouse Button / ESC** | Cancel placement / close inspection / pause menu |

---

## 3. Core Gameplay Loop

1. **Explore the Outpost**: Scour the perimeter for scrap piles, barrels, and abandoned machinery while defending against lurking infected.
2. **Collect Resources**: Gather **Scrap**, **Metal**, **Fuel**, and **Ammunition**. Slain zombies also drop ground scrap deposits.
3. **Build & Fortify**: Construct defensive walls to funnel enemy hordes, set up machine gun turrets and heavy cannons, and plant proximity mines.
4. **Automate Production**:
   - **Scrap Collector**: Mines scrap continuously.
   - **Generator**: Burns fuel to power the electric grid.
   - **Ammo Factory**: Converts scrap and metal into ammunition (requires power).
   - **Repair Station**: Automatically repairs nearby damaged defenses using scrap (requires power).
5. **Survive 10 Escalating Horde Waves**:
   - **Walkers**: Standard horde infected.
   - **Runners**: Swift, agile ambushers.
   - **Brutes**: Massive armored behemoths that tear through barricades.
6. **Protect the Command Centre**: The central HQ dome must survive. If it falls, the outpost is lost.

---

## 4. Structures & Base Automation

| Structure | Cost | Power | Function |
|---|---|---|---|
| **Scrap Collector** | 30 Scrap | 0 KW | Mines +3 scrap every 3.5s |
| **Generator** | 45 Scrap, 12 Metal | +40 KW | Burns fuel to generate electric power |
| **Ammo Factory** | 55 Scrap, 25 Metal | 15 KW | Converts 2 Scrap + 1 Metal into 16 Ammunition |
| **Machine Gun Turret** | 35 Scrap, 15 Metal | 0 KW | Rapid-fire anti-infantry turret (Range: 190px) |
| **Cannon Turret** | 65 Scrap, 30 Metal | 0 KW | Heavy explosive artillery with 65px splash radius |
| **Repair Station** | 50 Scrap, 18 Metal | 10 KW | Automatically heals damaged buildings in 180px radius |
| **Defensive Wall** | 15 Scrap | 0 KW | 500 HP obstacle that redirects and halts zombies |
| **Mine Trap** | 12 Scrap, 6 Metal | 0 KW | 150 Area damage explosive triggered by enemy proximity |

---

## 5. Architecture & Project Structure

```
DEAD_FRONTIER_OUTPOST/
├── index.html                   # HTML entry point with pixelated canvas viewport
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Vite build configuration (base: './')
├── public/assets/               # Complete game art assets
│   ├── buildings/               # Building textures & damaged variants
│   ├── characters/              # 4-direction character sprites
│   ├── spritesheets/            # Character & building animations
│   ├── environment/             # Terrain, roads, vegetation, debris & props
│   ├── effects/                 # Projectiles, explosions, flashes & impacts
│   └── ui/                      # Icons, panels, buttons & placement guides
├── src/
│   ├── main.js                  # Phaser game bootstrap
│   ├── config/
│   │   ├── gameConfig.js        # Screen resolution, tiles, colors
│   │   ├── balanceConfig.js     # Health, damage, costs, 10 waves
│   │   └── assetConfig.js       # Texture & spritesheet asset registry
│   ├── scenes/
│   │   ├── BootScene.js         # Canvas scale initialization
│   │   ├── PreloadScene.js      # Texture loading & animation generation
│   │   ├── MenuScene.js         # Main menu, controls modal, continue game
│   │   ├── GameScene.js         # World map, player, systems orchestration
│   │   └── UIScene.js           # HUD, construction bar, building inspection
│   ├── entities/
│   │   ├── Player.js            # WASD movement, mouse aim, firing, reload
│   │   ├── Zombie.js            # Base zombie AI, attack, damage, death
│   │   ├── Walker.js            # Standard zombie
│   │   ├── Runner.js            # Fast sprinting zombie
│   │   ├── Brute.js             # High-HP wall-destroying heavy zombie
│   │   ├── Building.js          # Base building, power, production, health
│   │   ├── Turret.js            # Target tracking, barrel rotation, recoil, fire
│   │   └── Projectile.js        # Bullets, cannon shells, splash damage
│   ├── systems/
│   │   ├── ResourceSystem.js    # Resources, ground pickups, affordability
│   │   ├── BuildingSystem.js    # Grid placement, preview, validation, deconstruct
│   │   ├── CombatSystem.js      # Projectile pooling, collisions, VFX
│   │   ├── WaveSystem.js        # 10-wave horde spawner & prep timer
│   │   ├── PowerSystem.js       # Generator grid balancing & consumer supply
│   │   ├── AutomationSystem.js  # Factory-to-turret ammunition logistics
│   │   ├── SoundSystem.js       # Procedural Web Audio synthesizer (zero external files)
│   │   └── SaveSystem.js        # Local persistence & game state restoration
│   ├── ui/
│   │   ├── HUD.js               # Health, ammo, resources, wave, power
│   │   ├── BuildMenu.js         # 8-slot building toolbar with tooltips & hotkeys
│   │   ├── BuildingPanel.js     # Structure inspector & deconstruct refund
│   │   └── GameMenus.js         # Pause, Victory, and Defeat screens
│   └── utils/
│       ├── GridUtils.js         # Tile math, coordinate translation, distance
│       └── ObjectPool.js        # High-performance object pooling
├── electron/
│   └── main.js                  # Electron desktop application window
├── ASSET_INVENTORY.md           # Full asset verification & substitutes inventory
└── README.md
```

---

## 6. Technical Notes

- **Pixel Perfection**: 1 art pixel = 1 texture pixel with nearest-neighbour interpolation (`imageRendering: pixelated`).
- **Art Bible Compliance**: All sprite pivots match specification (Characters: `16, 27` between feet; Turrets: `32, 32` rotation center facing East; Projectiles and Muzzle Flashes face East).
- **Zero Asset Drop Errors**: Missing Command Centre asset was synthesized using the exact Art Bible palette, lighting, outline, and shading rules via the included Python generator.
- **Synthesized Audio Engine**: Authentic retro-industrial sound effects are produced on the fly via Web Audio API oscillators, noise buffers, and resonant filters with volume sliders and instantaneous mute toggling.
