/**
 * Replay nachrechnen. Besitzer: P5. Die Belohnung kommt aus DIESER Funktion, nicht aus Angaben des Clients: Seed, Stufe und Befehle gehen
 * in die Sim, heraus kommen Ergebnis, erreichte Welle und End-Hash. Stimmt der End-Hash der Datei nicht, gibt es nichts.
 *
 * Gleiche Schleife wie `sim/scripts/replay.ts` (dort mit Bericht fuer Menschen), hier ohne Bericht und ohne Dateizugriff, damit sie im
 * Browser (LocalBackend) und auf dem Server (M2) laeuft. Sie darf Sekunden dauern, nicht Minuten: 20 Waves sind ca. 19 000 Ticks.
 *
 * Formate: v2 (Runde 6, Positionen) und v3 (Runde 7, zusaetzlich `unitMods` im Kopf, P2). v1 (Slots) laesst sich nicht nachspielen.
 * `unitMods` kommen aus `opts.unitMods` (Vorrang) oder aus dem Kopf der Datei und gehen unveraendert in `createSim`. Ob sie zum Profil
 * des Spielers passen, prueft der Aufrufer (`unitModsFor(profile, team)` aus `unit-mods.ts`), nicht diese Funktion.
 */
import { createSim, type Command, type DifficultyId, type GameData, type UnitMod } from '../../sim/src/index';
import { fail, type Fail } from './result';

/** Obergrenzen gegen Muell-Replays (eine echte Partie hat ~19 000 Ticks und wenige hundert Befehle). */
export const MAX_REPLAY_TICKS = 60_000;
export const MAX_REPLAY_COMMANDS = 20_000;
const SUPPORTED_VERSIONS = [4];
const DIFFICULTIES: readonly string[] = ['normal', 'hard', 'nightmare'];

export interface VerifiedMatch {
  stageId: string;
  difficulty: string;
  outcome: 'win' | 'loss';
  /** vom Simulator gezaehlt (`state.wave`), nicht aus der Datei */
  waveReached: number;
  /** Gehaltene Wellen (alle Gegner getötet, kein Leak); bei Sieg = erreichte Welle. Grundlage der Wellen-Belohnung. */
  wavesHeld: number;
  /** eindeutige Kennung des Laufs; Ledger-Referenz `match/<replayId>` */
  replayId: string;
  endTick: number;
  endHash: string;
  seed: number;
  /** Team laut Kopf (v2/v3), `null` = keine Auswahl */
  team: string[] | null;
  /** alle platzierten Unit-IDs (aus den angenommenen Befehlen) */
  placedUnits: string[];
  /** Mods, mit denen nachgerechnet wurde (Kopf der Datei bzw. `opts.unitMods`); P4: `rewardFromReplay` gleicht sie mit dem Profil ab */
  unitMods: UnitMod[];
  /** Rechenzeit in Millisekunden (grob, nur zur Anzeige/Messung) */
  ms: number;
}

export interface VerifyOptions {
  /** Spieldaten (Browser: `loadBrowserData()`); ohne Angabe liest die Sim die JSON-Dateien (nur Node). */
  data?: GameData;
  /** Mods fuer `createSim`; ohne Angabe die aus dem Kopf der Datei (v3), sonst keine. */
  unitMods?: UnitMod[];
  /** Uhr fuer die Zeitmessung (Tests); Standard `performance.now`. */
  clock?: () => number;
}

interface Head {
  format?: unknown;
  formatVersion?: unknown;
  stage?: unknown;
  difficulty?: unknown;
  players?: unknown;
  seed?: unknown;
  team?: unknown;
  complete?: unknown;
  result?: unknown;
  endTick?: unknown;
  endHash?: unknown;
  unitMods?: unknown;
  commands?: unknown;
}

const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);

function readMods(raw: unknown): UnitMod[] | Fail {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > 64) return fail('invalid-replay', 'Replay unit mods are malformed.');
  const out: UnitMod[] = [];
  for (const m of raw as Record<string, unknown>[]) {
    if (!m || typeof m !== 'object' || !isInt(m.player) || typeof m.unit !== 'string') return fail('invalid-replay', 'Replay unit mods are malformed.');
    for (const k of ['lvlBp', 'traitBp', 'yieldBp', 'rangeBp', 'spaBp'] as const) if (m[k] !== undefined && !isInt(m[k])) return fail('invalid-replay', 'Replay unit mods are malformed.');
    out.push(m as unknown as UnitMod);
  }
  return out;
}

/** Nachrechnen. Wirft nie; jeder Fehler ist ein `Fail` mit Code (`replay-*`, `invalid-replay`, `replay-mismatch`). */
export function verifyReplay(replay: unknown, opts: VerifyOptions = {}): { ok: true; match: VerifiedMatch } | Fail {
  const clock = opts.clock ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  if (!replay || typeof replay !== 'object') return fail('invalid-replay', 'Replay is missing.');
  const r = replay as Head;
  if (r.format !== 'towerdef-replay') return fail('invalid-replay', 'This is not a replay file.');
  if (isInt(r.formatVersion) && r.formatVersion >= 1 && r.formatVersion <= 3) return fail('replay-old-rules', 'This replay is from older rules and cannot be checked.');
  if (!isInt(r.formatVersion) || !SUPPORTED_VERSIONS.includes(r.formatVersion)) return fail('replay-unsupported', 'This replay format is not supported.');
  if (r.complete !== true || (r.result !== 'win' && r.result !== 'loss')) return fail('replay-incomplete', 'The match is not finished.');
  if (typeof r.stage !== 'string' || !r.stage) return fail('invalid-replay', 'Replay has no stage.');
  if (typeof r.difficulty !== 'string' || !DIFFICULTIES.includes(r.difficulty)) return fail('unknown-difficulty', `Unknown difficulty ${String(r.difficulty)}.`);
  if (r.players !== 1) return fail('replay-unsupported', 'Only solo matches count for rewards for now.');
  if (!isInt(r.seed) || !isInt(r.endTick) || r.endTick < 0 || r.endTick > MAX_REPLAY_TICKS) return fail('invalid-replay', 'Replay seed or length is invalid.');
  if (typeof r.endHash !== 'string' || !r.endHash) return fail('invalid-replay', 'Replay has no end hash.');
  if (!Array.isArray(r.commands) || r.commands.length > MAX_REPLAY_COMMANDS) return fail('invalid-replay', 'Replay commands are invalid.');
  const team = Array.isArray(r.team) && r.team.every((x) => typeof x === 'string') ? (r.team as string[]) : null;
  const mods = opts.unitMods ?? readMods(r.unitMods);
  if (!Array.isArray(mods)) return mods;

  const t0 = clock();
  try {
    const sim = createSim({ stage: r.stage, difficulty: r.difficulty as DifficultyId, players: 1, seed: r.seed, unitMods: mods, ...(opts.data ? { data: opts.data } : {}) });
    const st = sim.state;
    const placed: string[] = [];
    // Gehaltene Wellen: alle Gegner einer Welle getötet, keiner durchgekommen. Gerufene Wellen zählen nicht
    // (sonst bringt „alle Wellen vorrufen ohne Verteidigung" die volle Wellen-Belohnung, Befund P4).
    const spawned = new Map<number, number>();
    const killed = new Map<number, number>();
    const leaked = new Set<number>();
    const tally = (): void => {
      for (const e of sim.drainEvents()) {
        if (e.type === 'spawn') spawned.set(e.wave, (spawned.get(e.wave) ?? 0) + 1);
        else if (e.type === 'kill') killed.set(e.wave, (killed.get(e.wave) ?? 0) + 1);
        else if (e.type === 'leak') leaked.add(e.wave);
      }
    };
    let last = -1;
    for (const c of r.commands as { tick: unknown; player: unknown; cmd: unknown; ok: unknown }[]) {
      if (!c || !isInt(c.tick) || c.tick < last || c.tick > MAX_REPLAY_TICKS || !isInt(c.player) || !c.cmd || typeof c.cmd !== 'object' || typeof c.ok !== 'boolean') return fail('invalid-replay', 'Replay commands are invalid.');
      last = c.tick;
      while (st.tick < c.tick && !sim.isOver()) { sim.step(1); tally(); }
      if (st.tick !== c.tick) return fail('replay-mismatch', 'The replay does not match the game rules.');
      const res = sim.apply(c.player, c.cmd as Command);
      if (res.ok !== c.ok) return fail('replay-mismatch', 'The replay does not match the game rules.');
      const cmd = c.cmd as { type?: string; unitId?: string };
      if (res.ok && cmd.type === 'place' && typeof cmd.unitId === 'string') placed.push(cmd.unitId);
    }
    while (st.tick < r.endTick && !sim.isOver()) { sim.step(1); tally(); }
    // Der letzte Schritt einer Niederlage zaehlt den Tick nicht mehr hoch (siehe replay.ts): bis zum Ende weiterlaufen, solange der Tick passt.
    while (!sim.isOver() && st.tick <= r.endTick) { sim.step(1); tally(); }
    tally();
    const hash = sim.hash();
    if (st.tick !== r.endTick || hash !== r.endHash || sim.result() !== r.result) return fail('replay-mismatch', 'The replay does not match the game rules.');
    const outcome = sim.result() as 'win' | 'loss';
    let wavesHeld = 0;
    for (const [wave, n] of spawned) if (n > 0 && !leaked.has(wave) && (killed.get(wave) ?? 0) >= n) wavesHeld++;
    return {
      ok: true,
      match: {
        stageId: r.stage,
        difficulty: r.difficulty,
        outcome,
        waveReached: Math.max(0, st.wave),
        wavesHeld: outcome === 'win' ? Math.max(0, st.wave) : wavesHeld,
        replayId: `${r.stage}-${r.difficulty}-${r.seed}-${st.tick}-${hash}`,
        endTick: st.tick,
        endHash: hash,
        seed: r.seed,
        team,
        placedUnits: placed,
        unitMods: mods,
        ms: Math.round(clock() - t0),
      },
    };
  } catch (e) {
    return fail('invalid-replay', `Replay could not be played (${e instanceof Error ? e.message : 'unknown'}).`);
  }
}
