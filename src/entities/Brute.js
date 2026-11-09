/**
 * DEAD FRONTIER: OUTPOST
 * Brute Zombie Entity (Heavy health, high damage, wall crusher)
 */

import { Zombie } from './Zombie.js';
import { BALANCE } from '../config/balanceConfig.js';

export class Brute extends Zombie {
  constructor(scene, x, y) {
    super(scene, x, y, 'brute', BALANCE.ZOMBIES.brute);
    // Larger collision box for brute
    this.body.setSize(24, 20);
    this.body.setOffset(4, 12);
  }
}
