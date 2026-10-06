import type { Bot } from './types.js';
import { policyBot } from './util.js';

/** Kauft stets die Option mit dem besten erwarteten DPS-Gewinn je Münze (Platzierung oder Upgrade). */
export const greedy = (): Bot => policyBot('greedy', {});
