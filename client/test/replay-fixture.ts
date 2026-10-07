/** Testhilfe: echtes Replay aus einem Bot-Lauf der Sim (Format v3 wie der Recorder, ohne Mods, ohne Tempo-Wechsel). */
import { runMatch } from '../../sim/src/bots/index';
import { loadBrowserData } from '../src/sim';
import { botTuning } from '../../sim/src/bots/util';
import type { ReplayFile } from '../src/game/recorder';
import type { UnitMod } from '../src/sim';
import { claimStarterGift, newProfile, testEnv, unitModsFor } from '../src/backend/meta';

const ALL = ['striker', 'gunner', 'blaster', 'banner', 'farm', 'lancer', 'frost', 'titan'];

/** `team` und `unitMods` (Runde 7, P4): wie der Client sie aus `Backend.matchSetup` in die Session und den Recorder gibt; der Bot spielt mit genau diesen Mods. */
export function botReplay(o: { bot?: string; seed?: number; difficulty?: 'normal' | 'hard' | 'nightmare'; only?: string[]; team?: string[] | null; unitMods?: UnitMod[] } = {}): ReplayFile {
  const bot = o.bot ?? 'wide';
  const seed = o.seed ?? 7;
  const difficulty = o.difficulty ?? 'normal';
  const commands: ReplayFile['commands'] = [];
  const saved = botTuning.banned;
  if (o.only) botTuning.banned = ALL.filter((u) => !o.only!.includes(u));
  try {
    const r = runMatch({ stage: 'standard20', difficulty, players: 1, seed, bots: [bot], data: loadBrowserData(), unitMods: o.unitMods, onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }) });
    return {
      format: 'towerdef-replay',
      formatVersion: 3,
      gameVersion: 'test',
      stage: 'standard20',
      difficulty,
      players: 1,
      seed,
      team: o.team ?? null,
      unitMods: o.unitMods ?? [],
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

/** Das Team und die Mods eines frisch abgeholten Starter-Geschenks (deterministisch: Katalogreihenfolge). */
export function starterSetup(): { team: string[]; unitMods: UnitMod[] } {
  const env = testEnv(1);
  const g = claimStarterGift(newProfile(env), env);
  if (!g.ok) throw new Error(g.message);
  return { team: g.profile.team, unitMods: unitModsFor(g.profile, g.profile.team) };
}

/** Replay, wie ihn der Client nach einem Match mit dem Starter-Team meldet (Bot spielt nur Units des Teams, Mods wie `matchSetup`). */
export function starterReplay(o: { bot?: string; seed?: number; difficulty?: 'normal' | 'hard' | 'nightmare'; only?: string[]; team?: string[]; unitMods?: UnitMod[] } = {}): ReplayFile {
  const s = starterSetup();
  return botReplay({ ...o, only: o.only ?? s.team, team: o.team ?? s.team, unitMods: o.unitMods ?? s.unitMods });
}
