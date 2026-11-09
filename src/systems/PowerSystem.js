/**
 * DEAD FRONTIER: OUTPOST
 * Electrical Power Grid System: Supply, Demand, Capacity & Grid Balancing
 */

export class PowerSystem {
  constructor(scene) {
    this.scene = scene;
    this.totalCapacity = 0;
    this.totalDemand = 0;
    this.isSufficient = true;
    this.updateTimer = 0;
  }

  update(time, delta) {
    this.updateTimer += delta;
    if (this.updateTimer >= 500) {
      this.updateTimer = 0;
      this.recalculateGrid();
    }
  }

  recalculateGrid() {
    const buildings = this.scene.buildingSystem.getActiveBuildings();
    let capacity = 0;
    let demand = 0;

    const consumers = [];

    // Sum power generators
    buildings.forEach((b) => {
      if (b.isDestroyed) return;
      if (b.buildingType === 'generator' && b.internalInventory.fuel > 0) {
        capacity += b.powerOutput;
      }
      if (b.powerDemand > 0) {
        demand += b.powerDemand;
        consumers.push(b);
      }
    });

    this.totalCapacity = capacity;
    this.totalDemand = demand;
    this.isSufficient = capacity >= demand;

    // Distribute power to consumers
    let available = capacity;
    consumers.forEach((b) => {
      if (available >= b.powerDemand) {
        b.hasPower = true;
        available -= b.powerDemand;
      } else {
        b.hasPower = false;
      }
    });

    this.scene.events.emit('power-status-changed', {
      capacity: this.totalCapacity,
      demand: this.totalDemand,
      isSufficient: this.isSufficient
    });
  }
}
