/**
 * DEAD FRONTIER: OUTPOST
 * Generic Object Pool for high-frequency game objects (projectiles, damage texts, particles)
 */

export class ObjectPool {
  constructor(factoryFn, initialSize = 20) {
    this.factoryFn = factoryFn;
    this.pool = [];
    this.active = new Set();

    for (let i = 0; i < initialSize; i++) {
      const obj = this.factoryFn();
      obj.setActive(false);
      obj.setVisible(false);
      this.pool.push(obj);
    }
  }

  get(...args) {
    let obj = null;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.factoryFn();
    }

    this.active.add(obj);
    obj.setActive(true);
    obj.setVisible(true);
    if (typeof obj.spawn === 'function') {
      obj.spawn(...args);
    }
    return obj;
  }

  release(obj) {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    obj.setActive(false);
    obj.setVisible(false);
    if (typeof obj.reset === 'function') {
      obj.reset();
    }
    this.pool.push(obj);
  }

  releaseAll() {
    for (const obj of Array.from(this.active)) {
      this.release(obj);
    }
  }

  getActiveList() {
    return Array.from(this.active);
  }
}
