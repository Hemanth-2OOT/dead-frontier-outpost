/**
 * DEAD FRONTIER: OUTPOST
 * Runner Zombie Entity (High speed, lower health)
 */

import { Zombie } from './Zombie.js';
import { BALANCE } from '../config/balanceConfig.js';

export class Runner extends Zombie {
  constructor(scene, x, y) {
    super(scene, x, y, 'runner', BALANCE.ZOMBIES.runner);
  }
}
