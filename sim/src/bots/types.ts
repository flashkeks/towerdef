/**
 * Bot-Schnittstelle (vom Koordinator festgelegt; P2b implementiert Bots, P2c nutzt sie).
 * Ein Bot spielt ausschließlich über `sim.apply()` – genau wie ein Mensch oder Server.
 * Zufall nur über den übergebenen eigenen PRNG (RngState), nie über Math.random().
 */
import type { Sim } from '../sim.js';
import type { RngState } from '../prng.js';

export interface BotContext {
  sim: Sim;
  playerId: number;
  /** Eigener, seeded PRNG des Bots (unabhängig vom Sim-PRNG). */
  rng: RngState;
}

export interface Bot {
  readonly name: string;
  /** Wird vom Runner einmal je Entscheidungsintervall aufgerufen (Standard: jede Sekunde = 20 Ticks und zu Beginn jeder Wave). */
  decide(ctx: BotContext): void;
}

export type BotFactory = () => Bot;
