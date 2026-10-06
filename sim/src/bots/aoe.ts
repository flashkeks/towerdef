import type { Bot } from './types.js';
import { policyBot } from './util.js';

const AOE = new Set(['blaster', 'lancer', 'frost']);

/** Bevorzugt AoE-Units (Blaster, Lancer, Frost). */
export const aoe = (): Bot =>
  policyBot('aoe', { weight: (d) => (AOE.has(d.id) ? 2.2 : d.id === 'banner' ? 1 : 0.6) });
