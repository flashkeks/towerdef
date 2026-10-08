/** Testhilfe (P5): echte Replays aus Bot-Laeufen der Sim, im Format v4 wie der Client-Recorder (ohne Tempo-Wechsel und Wellen-Tabelle). */
import { runMatch } from '../../sim/src/bots/index';
import type { DifficultyId } from '../../sim/src/index';

export interface FixtureOptions {
  bot?: string;
  difficulty?: DifficultyId;
  seed?: number;
  /** Nur diese Units kauft der Bot (`mono-A,B`); ohne `only` und `bot`: Goku SSJ3 + Rikka (gewinnt Normal) */
  only?: string[];
  formatVersion?: number;
  /** Stage-ID (Standard `standard20`); Runde 8 / P3: auch Welten wie `greenie-1` */
  stage?: string;
  maxWaves?: number;
  maxTicks?: number;
  team?: string[] | null;
  extra?: Record<string, unknown>;
}

export function botReplay(o: FixtureOptions = {}): Record<string, any> {
  const bot = o.only ? `mono-${o.only.join(',')}` : (o.bot ?? 'mono-goku_ssj3,rikka_evo');
  const difficulty = o.difficulty ?? 'normal';
  const seed = o.seed ?? 7;
  const commands: { tick: number; player: number; cmd: unknown; ok: boolean; reason?: string }[] = [];
    const r = runMatch({ stage: o.stage ?? 'standard20', difficulty, players: 1, seed, bots: [bot], ...(o.maxWaves ? { maxWaves: o.maxWaves } : {}), ...(o.maxTicks ? { maxTicks: o.maxTicks } : {}), onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }) });
    return {
      format: 'towerdef-replay',
      formatVersion: o.formatVersion ?? 4,
      gameVersion: 'test',
      stage: o.stage ?? 'standard20',
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
}
