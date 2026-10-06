import type { Bot } from './types.js';
import { policyBot } from './util.js';

/** Farm in Prep/Wave 1, weitere Farm-Käufe im §12-Fenster (Grenz-Payback <= Restwaves), sonst wie greedy. */
export const farm = (): Bot => policyBot('farm', { farm: { share: 0.45, sellLate: true } });
