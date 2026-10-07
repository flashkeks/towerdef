/** Testhilfe: echtes Replay aus einem Bot-Lauf der Sim (Format v3 wie der Recorder, ohne Mods, ohne Tempo-Wechsel). */
import { runMatch } from '../../sim/src/bots/index';
import { loadBrowserData } from '../src/sim';
import { botTuning } from '../../sim/src/bots/util';
import type { ReplayFile } from '../src/game/recorder';

const ALL = ['striker', 'gunner', 'blaster', 'banner', 'farm', 'lancer', 'frost', 'titan'];

export function botReplay(o: { bot?: string; seed?: number; difficulty?: 'normal' | 'hard' | 'nightmare'; only?: string[] } = {}): ReplayFile {
  const bot = o.bot ?? 'wide';
  const seed = o.seed ?? 7;
  const difficulty = o.difficulty ?? 'normal';
  const commands: ReplayFile['commands'] = [];
  const saved = botTuning.banned;
  if (o.only) botTuning.banned = ALL.filter((u) => !o.only!.includes(u));
  try {
    const r = runMatch({ stage: 'standard20', difficulty, players: 1, seed, bots: [bot], data: loadBrowserData(), onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }) });
    return {
      format: 'towerdef-replay',
      formatVersion: 3,
      gameVersion: 'test',
      stage: 'standard20',
      difficulty,
      players: 1,
      seed,
      team: null,
      unitMods: [],
      cards: [],
      complete: true,
      result: r.result === 'timeout' ? null : r.result,
      endTick: r.ticks,
      endHash: r.hash,
      endWave: r.endWave,
      endLives: r.baseHp,
      endCoins: r.finalCoins[0],
      durationTicks: r.ticks,
      durationMs: 0,
      date: '2026-10-07',
      commands,
      controls: [],
      waves: [],
      feedback: '',
    } as ReplayFile;
  } finally {
    botTuning.banned = saved;
  }
}
