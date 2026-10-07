/** Testhilfe (P5): echte Replays aus Bot-Laeufen der Sim, im Format v2/v3 wie der Client-Recorder (ohne Tempo-Wechsel und Wellen-Tabelle). */
import { runMatch } from '../../sim/src/bots/index';
import { botTuning } from '../../sim/src/bots/util';
import type { DifficultyId } from '../../sim/src/index';
import { unitIds } from '../src/catalog';

export interface FixtureOptions {
  bot?: string;
  difficulty?: DifficultyId;
  seed?: number;
  /** Nur diese Units darf der Bot kaufen (Verbotsliste im Bot) */
  only?: string[];
  formatVersion?: number;
  team?: string[] | null;
  extra?: Record<string, unknown>;
}

// Runde 7 / P6: alle Units des Katalogs (14 statt 8), sonst liessen `only`-Laeufe die neuen Units durch.
const ALL = unitIds();

export function botReplay(o: FixtureOptions = {}): Record<string, any> {
  const bot = o.bot ?? 'wide@normal';
  const difficulty = o.difficulty ?? 'normal';
  const seed = o.seed ?? 7;
  const commands: { tick: number; player: number; cmd: unknown; ok: boolean; reason?: string }[] = [];
  const saved = botTuning.banned;
  if (o.only) botTuning.banned = ALL.filter((u) => !o.only!.includes(u));
  try {
    const r = runMatch({ stage: 'standard20', difficulty, players: 1, seed, bots: [bot], onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }) });
    return {
      format: 'towerdef-replay',
      formatVersion: o.formatVersion ?? 2,
      gameVersion: 'test',
      stage: 'standard20',
      difficulty,
      players: 1,
      seed,
      team: o.team ?? null,
      cards: [],
      complete: true,
      result: r.result === 'timeout' ? null : r.result,
      endTick: r.ticks,
      endHash: r.hash,
      endWave: r.endWave,
      endLives: r.baseHp,
      commands,
      controls: [],
      waves: [],
      feedback: '',
      ...(o.extra ?? {}),
    };
  } finally {
    botTuning.banned = saved;
  }
}
