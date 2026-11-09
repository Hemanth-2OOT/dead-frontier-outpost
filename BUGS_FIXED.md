# DEAD FRONTIER: OUTPOST — Bugs Discovered & Fixed

The following issues were identified during code auditing and playtest verification, and have been resolved:

---

### Bug 1: Command Centre Health Bar Desynchronization in HUD
- **Symptom**: When the Command Centre took damage or was repaired, its health bar in the top-left HUD did not update.
- **Root Cause**: `Building.takeDamage` and `Building.repair` only updated the in-world floating health bar above the sprite, but omitted emitting `command-center-health-changed` to `UIScene`.
- **Fix**: Added explicit event emission `command-center-health-changed` inside `Building.takeDamage` and `Building.repair` when `this.buildingType === 'command_center'`.

---

### Bug 2: Redundant Collider Accumulation & Missing Zombie-Building Colliders
- **Symptom**: Physics collisions between newly placed player walls and existing zombies failed, and zombie spawning created $N \times M$ collider references.
- **Root Cause**: Every zombie spawn looped through buildings and added individual `scene.physics.add.collider(zombie, building)`. Furthermore, when a player placed a new building, it was only collidable with the player, not with existing zombies.
- **Fix**: Created a single unified `this.buildingGroup = scene.physics.add.staticGroup()` in `BuildingSystem`. Global colliders for player and zombies are registered once. All buildings are added to this group upon construction and removed upon destruction.

---

### Bug 3: Zombies Getting Stuck against Barricades Without Attacking
- **Symptom**: Zombies colliding with solid walls or buildings sometimes became permanently stuck against obstacles rather than attacking them.
- **Root Cause**: `checkNearbyObstacle` used a center-to-center distance check (`d <= attackRange + 12`), which did not account for building half-widths (32px for 64x64 walls), causing zombies at wall corners or edges to fail the proximity threshold.
- **Fix**: Implemented `onCollideBuilding(building)` callback on the zombie arcade collider and integrated an active obstacle engagement system with a 1.0s stuck detector that triggers attacks or redirects the zombie around obstacle edges.

---

### Bug 4: Weapon Firing When Clicking UI Buttons (UI Click-Through)
- **Symptom**: Clicking buttons on the HUD, Build Menu, or Pause Dialog fired bullets into the game world and consumed ammunition.
- **Root Cause**: In multi-scene setups, Phaser's `input.activePointer.leftButtonDown()` in `GameScene` captured mouse clicks even when the pointer was interacting with UI elements in `UIScene`.
- **Fix**: Implemented `isPointerOverUI(screenX, screenY)` in `UIScene` and integrated checks in `GameScene.tryPlayerShoot()` and `BuildingSystem.tryPlaceBuilding()` to ignore input when interacting with HUD, toolbars, or modals.

---

### Bug 5: Remaining Enemies Counter Frozen on HUD
- **Symptom**: The HUD enemy counter showed the total starting count (e.g. `ENEMIES: 20`) throughout the entire wave without counting down.
- **Root Cause**: `WaveSystem` tracked `totalEnemiesInWave` upon wave start, but never emitted remaining enemy count updates as zombies were killed.
- **Fix**: Hooked `enemy-killed` event in `WaveSystem`, decremented `remainingEnemies`, and emitted `wave-enemies-updated` to dynamically refresh the HUD counter in real time.

---

### Bug 6: Turrets Bypassing Ammunition Mechanics
- **Symptom**: Turrets with 0 ammunition continued firing indefinitely by silently drawing directly from the player's global reserve without range limits.
- **Root Cause**: `Turret.fire()` included a fallback that automatically deducted ammo from global storage if local capacity was 0.
- **Fix**: Enforced that turrets can only fire if `this.currentAmmo >= this.ammoPerShot`. Turrets must now be stocked either by Ammo Factory automation or by manual player reload ('E' key / inspection panel).

---

### Bug 7: Generator Fuel Starvation Without Automated Refueling
- **Symptom**: Generators permanently stopped producing power once their initial 20 fuel burned out, with no mechanism to refuel them.
- **Root Cause**: `Building.updateGenerator` lacked an auto-refueling hook into the global fuel supply.
- **Fix**: Implemented automated refueling (consumes 5 fuel from reserves when generator fuel drops to 0) and added manual "ADD FUEL" controls in both the Building Panel and via the 'E' interact key.

---

### Bug 8: Wave Difficulty Progression Mismatch with Brief Specifications
- **Symptom**: Wave 4 spawned Runners prematurely and Wave 6 spawned Brutes prematurely.
- **Root Cause**: Hardcoded initial wave arrays deviated from the strict progression table in Section 11.
- **Fix**: Refactored `BALANCE.WAVES` to strictly follow Section 11: Waves 1–4 Walkers only, Wave 5 introduces Runners, Wave 8 introduces Brutes, and Wave 10 features the final 92-enemy mega horde.

---

### Bug 9: Save System Dropping Turret Ammunition
- **Symptom**: Loading a saved game reset all turret ammunition to full capacity, ignoring previous combat consumption.
- **Root Cause**: `saveGame()` did not serialize `b.currentAmmo` for turret entities.
- **Fix**: Added `currentAmmo` to the serialized building payload and restored it accurately upon loading.

---

### Bug 10: Memory Leak from Per-Frame Array Allocation
- **Symptom**: `CombatSystem.update()` called `projectilePool.getActiveList()` every frame, creating 60 new array instances per second.
- **Root Cause**: `getActiveList()` called `Array.from(this.active)` on every tick.
- **Fix**: Replaced array cloning with zero-allocation iteration directly over the active Set: `for (const proj of this.projectilePool.active)`.

---

### Bug 11: Event Listener Accumulation on Scene Restart
- **Symptom**: Restarting a match accumulated duplicate event listeners on `gameScene.events`, causing multiple sound triggers and state errors.
- **Root Cause**: `UIScene` did not detach listeners when stopped or restarted.
- **Fix**: Implemented `cleanupEventListeners()` in `UIScene` bound to the `SHUTDOWN` lifecycle event.

---

### Bug 12: Missing 'E' Interaction Key Functionality
- **Symptom**: The 'E' key defined in controls was unhandled in gameplay.
- **Root Cause**: Event listener was bound in `Player.keys` but never called in `update()`.
- **Fix**: Implemented `interactNearby()` in `Player.js` allowing contextual collection of ground scrap, manual building repairs, turret ammo reloading, and generator refueling.

---

### Bug 13: Title Screen Crash on MenuScene Load
- **Symptom**: After the loading screen, the game displayed a blank dark screen with `Uncaught TypeError: hq.play is not a function at MenuScene.create (MenuScene.js:45:10)`.
- **Root Cause**: The central Command Centre asset on the title screen was created using `this.add.image(...)` rather than `this.add.sprite(...)`. Phaser `Image` game objects do not possess animation playback methods (`.play()`).
- **Fix**: Updated instantiation to `this.add.sprite(...)`, allowing `command_center_active_anim` to play smoothly.

---

### Bug 14: Premature Collider Registration Freezing Player Controls
- **Symptom**: Player controls (WASD movement, mouse aiming, shooting, hotkeys) were completely unresponsive upon starting a new game.
- **Root Cause**: Inside `GameScene.create()`, `createWorldEnvironment()` was invoked before `this.player = new Player(...)`. At the end of `createWorldEnvironment()`, `this.physics.add.collider(this.player, this.propGroup)` was registered with `this.player === undefined`. In Phaser Arcade Physics, `Collider.update()` attempted to check `this.object1.isParent`, throwing `Uncaught TypeError: Cannot read properties of undefined (reading 'isParent')` on every frame of `World.update()`. This unhandled exception crashed Phaser's physics and update loop instantly on frame 1, freezing all player input and movement.
- **Fix**: Relocated `this.physics.add.collider(this.player, this.propGroup)` to execute strictly after `this.player = new Player(...)` is instantiated.

---

### Bug 15: Building Static Physics Origin Desynchronization & Turret Structure Refactor
- **Symptom**: Player and zombie coordinates turned into `NaN` upon colliding with buildings, causing entities to vanish and movement to seize.
- **Root Cause**: `Building` originally extended `Phaser.GameObjects.Container` with a static body. Containers lack native `originX`/`originY`, causing Arcade Physics `separate()` calculations to yield `NaN`. Furthermore, `Turret` called `this.baseSprite.setTexture()` and `this.add(this.barrelSprite)`.
- **Fix**: Refactored `Building` to extend `Phaser.Physics.Arcade.Sprite` with valid integer origins (`0.5, 0.5`). Updated `Turret` to manage `barrelSprite` as a separate sprite synced to `(this.x, this.y)` with depth offset. Landmines now bypass static body registration to allow smooth traversal.

---

### Bug 16: Mouse Shooting Blocked on Bottom Viewport & Missing Turret Base Previews
- **Symptom**: Shooting towards the bottom of the screen was ignored even when aiming at zombies, and selecting a turret for construction showed missing texture warnings.
- **Root Cause**: `UIScene.isPointerOverUI` treated the entire horizontal width of the screen below $y \ge 508$ as UI, blocking mouse clicks aimed at the south perimeter. Additionally, `BuildingSystem.startPlacement` attempted to load `${buildingType}_normal` for turrets, which only exist as `${buildingType}_base`.
- **Fix**: Restricted bottom UI detection strictly to the horizontal bounds of the construction toolbar ($x \in [290, 734]$). Updated placement preview and initial building textures to dynamically select `${buildingType}_base` for turret structures.

---

### Bug 17: Bullets Spawning Stationary Without Moving Forward
- **Symptom**: Bullets hovered in place at the weapon barrel playing their flying animation without moving forward.
- **Root Cause**: `CombatSystem` called `this.projectileGroup.add(proj)` upon every shot. In Phaser Arcade Physics, `Group.add()` applies `this.defaults`, which defaults `setVelocityX: 0` and `setVelocityY: 0`, wiping the newly computed trajectory velocity back to $(0, 0)$.
- **Fix**:
  1. Cleared `this.projectileGroup.defaults = {}`.
  2. Pre-registered all pool projectile instances with `this.projectileGroup` during pool construction rather than modifying group membership on every shot.
  3. In `Projectile.spawn()`, added explicit `this.body.reset(x, y)` and `this.body.setVelocity(vx, vy)` so bullets fly at full speed (650 px/s) along their aim vector.

---

### Feature: Factorio-Style Tactical Radar Minimap Added
- **Requirement**: Add a Factorio-style minimap on the top-left corner.
- **Implementation**:
  1. Created [`src/ui/Minimap.js`](file:///c:/Users/HEMANTH/Desktop/game/src/ui/Minimap.js) situated at $(x=14, y=50)$.
  2. Features an industrial beveled surveillance terminal frame with hazard corner tabs.
  3. 128x128 px radar grid showing the complete $2048 \times 2048$ world at exact 1:16 scale.
  4. Real-time rendering of terrain zones, crossroads, Command Center (HQ), buildings (color-coded turrets, walls, generators, factories, repair stations), scrap piles, and real-time red zombie horde blips.
  5. Live player position dot with directional aiming tick and live coordinates (`X:30 Y:33`).
  6. Camera viewport bounding box showing visible frustum.
  7. Rotating radar scanline with fading phosphor trail.
  8. Integrated Command Center HQ Health Bar (`HQ: 1600/1600`) in footer.
  9. Click-to-pan camera navigation and `[M]` key toggle (expand / collapse) with UI click-through protection.

---

### Feature: Command Center Outpost Tech Tree Research Terminal
- **Requirement**: Deepen gameplay progression through persistent outpost tech research at the Command Center.
- **Implementation**:
  1. Extended `BuildingPanel.js` with a dedicated Command Center view displaying the Outpost Tech Tree ($w=310, h=420$).
  2. Four upgrade research branches:
     - **Reinforced Armor (Lvl 0/3)**: +30%/60%/100% max HP to all walls, defense structures, and Command Center.
     - **Heavy Caliber (Lvl 0/3)**: +25%/50%/80% Turret damage & +15%/30%/45% attack range.
     - **Rapid Logistics (Lvl 0/3)**: +40%/70%/100% Ammo Factory production speed & +2/+4/+8 ammo yield bonus.
     - **Alloy Boots (Lvl 0/3)**: +20%/40%/65% Player movement speed & +25%/35%/50% faster reload speed.
  3. Researching deducts required scrap and metal, plays Web Audio fanfare chime, spawns floating upgrade text at HQ, and updates all active and future structures immediately.
  4. Upgrade levels persist across saves in `SaveSystem.js`.

---

### Feature: Dual Weapon Arsenal (Combat Shotgun & Assault Rifle)
- **Requirement**: Expand player combat capabilities and crowd control against dense zombie waves.
- **Implementation**:
  1. Added dual weapon system in `Player.js` switched via the `[Q]` key.
  2. **Combat Shotgun**: Fires 5-pellet spread blasts, deals 18 damage per pellet, and applies 180 physics knockback to push zombies away from the player.
  3. Added procedural shotgun audio blast and mechanical pump-action sound effect in `SoundSystem.js`.
  4. Real-time weapon badge indicator in top HUD (`RIFLE [Q]` / `SHOTGUN [Q]`).

---

### Feature: Visual Automation Supply Lines & Energy Conduits
- **Requirement**: Provide clear visual feedback for factory automation and logistics.
- **Implementation**:
  1. Added animated glowing supply conduits in `AutomationSystem.js` connecting active Ammo Factories to supplied Turrets within 320px.
  2. When ammo is transferred, an animated supply pod slides smoothly along the conduit from the factory to the turret, concluding in an arrival flash.
  3. Added automated base fuel delivery to generators running low on fuel ($<20$ fuel).

---

### Feature: Atmospheric Night Lighting & Tactical Flashlight
- **Requirement**: Enhance the post-apocalyptic atmosphere and defensive visual clarity.
- **Implementation**:
  1. Implemented ambient darkness layer in `GameScene.js` (deep night during zombie attacks, dusk during preparation).
  2. Additive illumination halos for HQ security floodlights, streetlights, and running generators.
  3. Dynamic forward-pointing tactical flashlight cone following the player's mouse aim with personal lantern halo.

---

### Feature: Quick Repair & Restock Key `[F]`
- **Requirement**: Allow rapid battlefield maintenance during intense zombie defense.
- **Implementation**:
  1. Pressing `[F]` instantly repairs the nearest damaged structure (costs 2 scrap, repairs 35 HP).
  2. Restocks low-ammo turrets directly from reserve ammunition.
  3. Refuels low-fuel generators directly from reserve fuel.
  4. Spawns floating feedback text and plays appropriate audio cues.

---

### Feature: Repair Station Nano-Laser Beams
- **Requirement**: Visual feedback when Repair Stations fix structures.
- **Implementation**:
  1. `CombatSystem.spawnRepairBeam(x1, y1, x2, y2)` renders an animated neon-green nanite laser beam from the repair station to the target structure.
  2. Emits welding sparks and floating healing text at the repaired building.
