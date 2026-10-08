/** Testhilfe: echtes Replay aus einem Bot-Lauf der Sim (Format v4 wie der Recorder, ohne Mods, ohne Tempo-Wechsel). */
import { runMatch } from '../../sim/src/bots/index';
import { loadBrowserData } from '../src/sim';
import type { ReplayFile } from '../src/game/recorder';
import type { UnitMod } from '../src/sim';
import { claimStarterGift, newProfile, testEnv, unitModsFor } from '../src/backend/meta';

/** `team` und `unitMods` (Runde 7, P4): wie der Client sie aus `Backend.matchSetup` in die Session und den Recorder gibt; der Bot spielt mit genau diesen Mods. */
export function botReplay(o: { bot?: string; seed?: number; difficulty?: 'normal' | 'hard' | 'nightmare'; only?: string[]; team?: string[] | null; unitMods?: UnitMod[]; stage?: string } = {}): ReplayFile {
  const bot = o.only ? `mono-${o.only.join(',')}` : (o.bot ?? 'mono-goku_ssj3,rikka_evo');
  const seed = o.seed ?? 7;
  const difficulty = o.difficulty ?? 'normal';
  const commands: ReplayFile['commands'] = [];
    const r = runMatch({ stage: o.stage ?? 'standard20', difficulty, players: 1, seed, bots: [bot], data: loadBrowserData(), unitMods: o.unitMods, onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }) });
    return {
      format: 'towerdef-replay',
      formatVersion: 4,
      gameVersion: 'test',
      stage: o.stage ?? 'standard20',
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
}

/** Das Team und die Mods eines frisch abgeholten Starter-Geschenks (deterministisch: Katalogreihenfolge). */
export function starterSetup(): { team: string[]; unitMods: UnitMod[] } {
  const env = testEnv(1);
  const g = claimStarterGift(newProfile(env), env);
  if (!g.ok) throw new Error(g.message);
  return { team: g.profile.team, unitMods: unitModsFor(g.profile, g.profile.team) };
}

/** Replay, wie ihn der Client nach einem Match mit dem Starter-Team meldet (Bot spielt nur Units des Teams, Mods wie `matchSetup`). */
export function starterReplay(o: { bot?: string; seed?: number; difficulty?: 'normal' | 'hard' | 'nightmare'; only?: string[]; team?: string[]; unitMods?: UnitMod[]; stage?: string } = {}): ReplayFile {
  const s = starterSetup();
  return botReplay({ ...o, only: o.only ?? s.team, team: o.team ?? s.team, unitMods: o.unitMods ?? s.unitMods });
}
