/**
 * DEAD FRONTIER: OUTPOST
 * Walker Zombie Entity
 */

import { Zombie } from './Zombie.js';
import { BALANCE } from '../config/balanceConfig.js';

export class Walker extends Zombie {
  constructor(scene, x, y) {
    super(scene, x, y, 'walker', BALANCE.ZOMBIES.walker);
  }
}
