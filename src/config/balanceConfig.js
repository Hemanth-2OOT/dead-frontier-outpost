/**
 * DEAD FRONTIER: OUTPOST
 * Complete Gameplay Balance & Wave Configuration (Section 11 Compliant)
 */

export const BALANCE = {
  // Initial starting resources
  STARTING_RESOURCES: {
    scrap: 120,
    metal: 45,
    fuel: 40,
    ammunition: 80
  },

  // Player Stats
  PLAYER: {
    maxHealth: 100,
    speed: 180,
    weapon: {
      damage: 28,
      fireRateMs: 160,
      magazineSize: 24,
      startingMagazines: 4,
      reloadTimeMs: 1100,
      bulletSpeed: 650,
      range: 480
    },
    weapons: {
      rifle: {
        id: 'rifle',
        name: 'Assault Rifle',
        shortName: 'RIFLE',
        damage: 28,
        fireRateMs: 160,
        magazineSize: 24,
        reloadTimeMs: 1100,
        bulletSpeed: 650,
        range: 480,
        pellets: 1,
        spread: 0.03,
        knockback: 40,
        projectileType: 'rifle'
      },
      shotgun: {
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
      }
    },
    interactRadius: 65
  },

  // Outpost Command Center Research Upgrades
  UPGRADES: {
    armor: {
      id: 'armor',
      name: 'Reinforced Armor',
      description: '+30% HP to all walls, buildings & Command Center',
      maxLevel: 3,
      levels: [
        { cost: { scrap: 35, metal: 10 }, hpMultiplier: 1.3 },
        { cost: { scrap: 60, metal: 25 }, hpMultiplier: 1.6 },
        { cost: { scrap: 100, metal: 45 }, hpMultiplier: 2.0 }
      ]
    },
    turrets: {
      id: 'turrets',
      name: 'Heavy Caliber',
      description: '+25% Turret damage & +15% range',
      maxLevel: 3,
      levels: [
        { cost: { scrap: 30, metal: 15 }, damageMultiplier: 1.25, rangeMultiplier: 1.15 },
        { cost: { scrap: 55, metal: 30 }, damageMultiplier: 1.5, rangeMultiplier: 1.3 },
        { cost: { scrap: 90, metal: 50 }, damageMultiplier: 1.8, rangeMultiplier: 1.45 }
      ]
    },
    automation: {
      id: 'automation',
      name: 'Rapid Logistics',
      description: '+40% Ammo Factory production speed & +2 Ammo yield',
      maxLevel: 3,
      levels: [
        { cost: { scrap: 20, metal: 20 }, intervalMultiplier: 0.75, bonusAmmo: 2 },
        { cost: { scrap: 40, metal: 40 }, intervalMultiplier: 0.55, bonusAmmo: 4 },
        { cost: { scrap: 70, metal: 65 }, intervalMultiplier: 0.4, bonusAmmo: 8 }
      ]
    },
    speed: {
      id: 'speed',
      name: 'Alloy Boots',
      description: '+20% Player movement speed & +25% faster reload',
      maxLevel: 3,
      levels: [
        { cost: { scrap: 25, metal: 10 }, speedMultiplier: 1.2, reloadMultiplier: 0.8 },
        { cost: { scrap: 45, metal: 20 }, speedMultiplier: 1.4, reloadMultiplier: 0.65 },
        { cost: { scrap: 75, metal: 35 }, speedMultiplier: 1.65, reloadMultiplier: 0.5 }
      ]
    }
  },

  // Command Centre Headquarters
  COMMAND_CENTER: {
    maxHealth: 1600,
    sizeTiles: 3,
    repairRate: 50,
    repairCostScrap: 4
  },

  // Buildings Configuration
  BUILDINGS: {
    scrap_collector: {
      name: 'Scrap Collector',
      description: 'Mines scrap over time (+3 near deposits, +1 elsewhere)',
      cost: { scrap: 30, metal: 0, fuel: 0, ammunition: 0 },
      health: 260,
      requiresPower: false,
      productionIntervalMs: 3500,
      outputAmount: 3,
      maxStorage: 60
    },
    generator: {
      name: 'Generator',
      description: 'Burns fuel to generate electric power for the base',
      cost: { scrap: 45, metal: 12, fuel: 0, ammunition: 0 },
      health: 320,
      powerOutput: 40,
      fuelBurnIntervalMs: 4000,
      fuelPerTick: 1,
      startingFuel: 20,
      maxFuelStorage: 100
    },
    ammo_factory: {
      name: 'Ammo Factory',
      description: 'Refines scrap and metal into ammunition (Requires power)',
      cost: { scrap: 55, metal: 25, fuel: 0, ammunition: 0 },
      health: 420,
      powerDemand: 15,
      productionIntervalMs: 4500,
      inputCost: { scrap: 2, metal: 1 },
      outputAmmunition: 16,
      maxAmmoStorage: 160
    },
    machine_gun_turret: {
      name: 'Machine Gun Turret',
      description: 'Automated rapid-fire turret for suppressing horde lines',
      cost: { scrap: 35, metal: 15, fuel: 0, ammunition: 0 },
      health: 220,
      attackRange: 190,
      fireRateMs: 220,
      damage: 16,
      ammoPerShot: 1,
      maxAmmoStorage: 80,
      bulletSpeed: 560
    },
    cannon_turret: {
      name: 'Cannon Turret',
      description: 'Heavy artillery turret dealing devastating splash damage',
      cost: { scrap: 65, metal: 30, fuel: 0, ammunition: 0 },
      health: 360,
      attackRange: 270,
      fireRateMs: 1400,
      damage: 110,
      splashRadius: 65,
      ammoPerShot: 3,
      maxAmmoStorage: 45,
      bulletSpeed: 380
    },
    repair_station: {
      name: 'Repair Station',
      description: 'Repairs nearby damaged walls and buildings using scrap (Requires power)',
      cost: { scrap: 50, metal: 18, fuel: 0, ammunition: 0 },
      health: 280,
      powerDemand: 10,
      repairRadius: 180,
      intervalMs: 1500,
      scrapCostPerTick: 1,
      repairAmountPerTick: 25
    },
    wall: {
      name: 'Defensive Wall',
      description: 'Reinforced barricade that stops and channels zombies',
      cost: { scrap: 15, metal: 0, fuel: 0, ammunition: 0 },
      health: 500
    },
    mine: {
      name: 'Mine Trap',
      description: 'Proximity explosive that obliterates dense clusters of infected',
      cost: { scrap: 12, metal: 6, fuel: 0, ammunition: 0 },
      health: 40,
      armDelayMs: 800,
      triggerRadius: 36,
      explosionRadius: 75,
      damage: 150
    }
  },

  // Zombie Types
  ZOMBIES: {
    walker: {
      name: 'Walker',
      maxHealth: 60,
      speed: 52,
      damage: 12,
      attackIntervalMs: 1000,
      attackRange: 32,
      scoreValue: 10,
      scrapDropChance: 0.45,
      scrapAmount: 2
    },
    runner: {
      name: 'Runner',
      maxHealth: 36,
      speed: 125,
      damage: 9,
      attackIntervalMs: 650,
      attackRange: 30,
      scoreValue: 15,
      scrapDropChance: 0.35,
      scrapAmount: 2
    },
    brute: {
      name: 'Brute',
      maxHealth: 280,
      speed: 38,
      damage: 32,
      wallDamageMultiplier: 2.2,
      attackIntervalMs: 1400,
      attackRange: 40,
      scoreValue: 50,
      scrapDropChance: 0.95,
      scrapAmount: 9
    }
  },

  // 10-Wave Campaign Progression (Strictly Section 11 Compliant)
  WAVES: [
    { wave: 1, prepTimeSeconds: 20, walkers: 8, runners: 0, brutes: 0, spawnIntervalMs: 2000 },
    { wave: 2, prepTimeSeconds: 25, walkers: 14, runners: 0, brutes: 0, spawnIntervalMs: 1700 },
    { wave: 3, prepTimeSeconds: 25, walkers: 20, runners: 0, brutes: 0, spawnIntervalMs: 1400 },
    { wave: 4, prepTimeSeconds: 25, walkers: 28, runners: 0, brutes: 0, spawnIntervalMs: 1200 },
    { wave: 5, prepTimeSeconds: 30, walkers: 18, runners: 10, brutes: 0, spawnIntervalMs: 1000 },
    { wave: 6, prepTimeSeconds: 30, walkers: 24, runners: 16, brutes: 0, spawnIntervalMs: 900 },
    { wave: 7, prepTimeSeconds: 30, walkers: 30, runners: 22, brutes: 0, spawnIntervalMs: 800 },
    { wave: 8, prepTimeSeconds: 35, walkers: 26, runners: 20, brutes: 4, spawnIntervalMs: 750 },
    { wave: 9, prepTimeSeconds: 35, walkers: 35, runners: 28, brutes: 7, spawnIntervalMs: 650 },
    { wave: 10, prepTimeSeconds: 40, walkers: 45, runners: 35, brutes: 12, spawnIntervalMs: 500 }
  ]
};
