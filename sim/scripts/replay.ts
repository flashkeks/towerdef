/**
 * Replay-Prüfer (Runde 5 / P2): spielt eine im Client exportierte Runde (`duskwardens-*.json`) tick-genau nach,
 * prüft den End-Hash und druckt einen Bericht (Wellen mit Leaks, Münzkurve, gekaufte Units, Upgrades).
 *
 *   npm run replay -- DATEI [--compare] [--bot mono-goku_ssj3] [--quiet]
 *
 * Exit-Code 0 = Hash und Ergebnis stimmen, 1 = Abweichung, 2 = Datei/Aufruf unbrauchbar, 3 = altes Regelwerk (Format v1 bis v3).
 *
 * Formatversionen: v4 (Runde 8 / P1, AA-Baukasten) = wie v3, aber die Units kommen aus dem AA-Datenformat (`sim/data/units/*.json`, Maßstab in
 * `economy.json`); `unitMods` im Kopf wie in v3 (fehlt es, gilt neutral). v3 = Level/Sterne-Mods (Runde 7), v2 = `place` mit Position `x`, `y` (freie
 * Platzierung, Runde 6), v1 = `place` mit Slot-ID (bis Runde 5). v1 bis v3 lassen sich nicht mehr nachspielen: andere Unit-Daten, anderer
 * Zustand, kein Hash stimmt. Sie bleiben als Dokument lesbar (Bericht aus den Wellen-Daten der Datei, `--compare` geht weiter).
 * `--compare`: legt den Bot-Lauf (gleiche Stufe, gleicher Seed, Standard `mono-goku_ssj3`) daneben.
 * Befehle gelten zu Tick-Beginn: Der Client protokolliert `sim.state.tick` unmittelbar VOR `apply`, hier wird genau so
 * lange gesteppt, bis dieser Tick erreicht ist, und dann angewendet (auch abgelehnte Befehle, ihr Ergebnis wird verglichen).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMatch, type MatchResult } from '../src/bots/index.js';
import { createSim, type Command, type DifficultyId, type SimEvent, type UnitMod } from '../src/index.js';

export interface ReplayCommand {
  tick: number;
  player: number;
  /** v2: `place` mit `x`/`y`; v1: `place` mit `slot` (Altbestand, wird nicht abgespielt). */
  cmd: Command | { type: 'place'; unitId: string; slot: number };
  ok: boolean;
  reason?: string;
}

/** Aktuelles Format (v4: AA-Baukasten, Positionen + Unit-Mods im Kopf). Der Client schreibt es in `client/src/game/recorder.ts`. */
export const REPLAY_FORMAT_VERSION = 4;
/** Ältestes Format, das sich noch nachspielen lässt. */
export const REPLAY_MIN_PLAYABLE_VERSION = 4;
export const OLD_RULES_MESSAGE = 'altes Regelwerk (v1-v3, vor dem AA-Baukasten)';

export interface ReplayFile {
  format: string;
  formatVersion: number;
  gameVersion?: string;
  stage: string;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  team?: string[] | null;
  /** v3/v4: Level-/Sterne-Mods je Spieler und Unit (`createSim({ unitMods })`); fehlt = neutral. */
  unitMods?: UnitMod[];
  complete?: boolean;
  result: 'win' | 'loss' | null;
  endTick: number;
  endHash: string;
  endWave?: number;
  endLives?: number;
  commands: ReplayCommand[];
  waves?: unknown[];
  feedback?: string;
  date?: string;
  durationMs?: number;
}

export interface WaveRow {
  wave: number;
  startTick: number;
  coins: number;
  lives: number;
  leaks: number;
  leaksByEnemy: Record<string, number>;
  kills: number;
}

export interface ReplayReport {
  ok: boolean;
  /** Datei im alten Format (v1 bis v3): nicht nachgespielt, `problems` nennt es. */
  oldRules?: boolean;
  problems: string[];
  hash: string;
  expectedHash: string;
  tick: number;
  result: 'win' | 'loss' | null;
  lives: number;
  waves: WaveRow[];
  bought: Record<string, number>;
  upgrades: Record<string, number>;
  sold: number;
  rejected: number;
  coinCurve: { wave: number; coins: number }[];
}

export function parseReplay(text: string): ReplayFile {
  const r = JSON.parse(text) as Partial<ReplayFile>;
  if (r.format !== 'towerdef-replay') throw new Error('Keine Duskwardens-Replay-Datei (format fehlt/falsch)');
  if (typeof r.formatVersion !== 'number' || !Number.isInteger(r.formatVersion) || r.formatVersion < 1 || r.formatVersion > REPLAY_FORMAT_VERSION) {
    throw new Error(`Replay-Format ${String(r.formatVersion)} wird nicht unterstützt (bekannt: 1 bis 3 = ${OLD_RULES_MESSAGE}, ${REPLAY_FORMAT_VERSION})`);
  }
  for (const k of ['stage', 'difficulty', 'players', 'seed', 'endTick', 'endHash', 'commands'] as const) {
    if (r[k] === undefined) throw new Error(`Feld "${k}" fehlt`);
  }
  if (!Array.isArray(r.commands)) throw new Error('commands ist keine Liste');
  return r as ReplayFile;
}

/** Spielt die Datei nach. Wirft nur bei kaputten Eingaben, Abweichungen stehen in `problems`. */
export function replay(file: ReplayFile): ReplayReport {
  if (file.formatVersion < REPLAY_MIN_PLAYABLE_VERSION) return oldRulesReport(file);
  const unitMods = validMods(file.unitMods);
  const sim = createSim({ stage: file.stage, difficulty: file.difficulty, players: file.players, seed: file.seed, unitMods });
  const st = sim.state;
  const problems: string[] = [];
  const waves: WaveRow[] = [];
  const bought: Record<string, number> = {};
  const upgrades: Record<string, number> = {};
  let sold = 0;
  let rejected = 0;

  const row = (n: number): WaveRow | undefined => {
    for (let i = waves.length - 1; i >= 0; i--) if (waves[i].wave === n) return waves[i];
    return waves[waves.length - 1];
  };
  const take = (events: SimEvent[]): void => {
    for (const e of events) {
      if (e.type === 'waveStart') {
        waves.push({ wave: e.wave, startTick: e.tick, coins: st.players[0]?.coins ?? 0, lives: st.lives, leaks: 0, leaksByEnemy: {}, kills: 0 });
      } else if (e.type === 'leak') {
        const w = row(e.wave);
        if (w) {
          w.leaks++;
          w.leaksByEnemy[e.enemy] = (w.leaksByEnemy[e.enemy] ?? 0) + 1;
        }
      } else if (e.type === 'kill') {
        const w = row(e.wave);
        if (w) w.kills++;
      } else if (e.type === 'place') bought[e.unit] = (bought[e.unit] ?? 0) + 1;
      else if (e.type === 'sell') sold++;
    }
  };
  const unitName = (id: number): string => st.units.find((u) => u.id === id)?.defId ?? `#${id}`;

  let last = -1;
  for (const c of file.commands) {
    if (c.tick < last) {
      problems.push(`Befehlsliste nicht aufsteigend bei Tick ${c.tick}`);
      break;
    }
    last = c.tick;
    while (st.tick < c.tick && !sim.isOver()) {
      sim.step(1);
      take(sim.drainEvents());
    }
    if (st.tick !== c.tick) {
      problems.push(`Befehl für Tick ${c.tick}, aber die Runde endet bei Tick ${st.tick}`);
      break;
    }
    if (c.cmd.type === 'upgrade') {
      const name = unitName(c.cmd.entityId);
      const r = sim.apply(c.player, c.cmd as Command);
      if (r.ok) upgrades[name] = (upgrades[name] ?? 0) + 1;
      check(c, r, problems);
      if (!r.ok) rejected++;
    } else {
      const r = sim.apply(c.player, c.cmd as Command);
      check(c, r, problems);
      if (!r.ok) rejected++;
    }
    take(sim.drainEvents());
  }
  while (st.tick < file.endTick && !sim.isOver()) {
    sim.step(1);
    take(sim.drainEvents());
  }
  // Beendete Runde: Der letzte Schritt einer Niederlage zählt den Tick nicht mehr hoch (siehe sim.ts `stepOnce`),
  // der Client protokolliert aber erst nach diesem Schritt. Also bis zum Ende weiterlaufen, solange der Tick passt.
  if (file.complete !== false && file.result) {
    while (!sim.isOver() && st.tick <= file.endTick) {
      sim.step(1);
      take(sim.drainEvents());
    }
  }
  take(sim.drainEvents());

  const hash = sim.hash();
  if (st.tick !== file.endTick) problems.push(`Endtick ${st.tick}, Datei sagt ${file.endTick}`);
  if (hash !== file.endHash) problems.push(`End-Hash weicht ab: ${hash} (Replay) gegen ${file.endHash} (Datei)`);
  if (file.complete !== false && file.result !== undefined && sim.result() !== file.result) {
    problems.push(`Ergebnis ${String(sim.result())} (Replay) gegen ${String(file.result)} (Datei)`);
  }
  return {
    ok: problems.length === 0,
    problems,
    hash,
    expectedHash: file.endHash,
    tick: st.tick,
    result: sim.result(),
    lives: st.lives,
    waves,
    bought,
    upgrades,
    sold,
    rejected,
    coinCurve: waves.map((w) => ({ wave: w.wave, coins: w.coins })),
  };
}

function validMods(m: unknown): UnitMod[] | undefined {
  if (m === undefined) return undefined;
  if (!Array.isArray(m)) throw new Error('unitMods ist keine Liste');
  for (const x of m as Partial<UnitMod>[]) {
    if (!Number.isInteger(x?.player) || typeof x?.unit !== 'string') throw new Error('unitMods: Eintrag ohne player/unit');
    for (const k of ['lvlBp', 'traitBp', 'yieldBp', 'rangeBp', 'spaBp'] as const) if (x[k] !== undefined && !Number.isInteger(x[k])) throw new Error(`unitMods: ${k} keine ganze Zahl`);
  }
  return m as UnitMod[];
}

/** Datei im alten Format: nichts nachspielen, Wellen und Käufe aus den Daten der Datei selbst lesen. */
function oldRulesReport(file: ReplayFile): ReplayReport {
  const bought: Record<string, number> = {};
  const upgrades: Record<string, number> = {};
  let sold = 0;
  let rejected = 0;
  const owner = new Map<number, string>();
  let nextId = 1;
  for (const c of file.commands) {
    if (!c.ok) {
      rejected++;
      continue;
    }
    if (c.cmd.type === 'place') {
      bought[c.cmd.unitId] = (bought[c.cmd.unitId] ?? 0) + 1;
      owner.set(nextId++, c.cmd.unitId);
    } else if (c.cmd.type === 'upgrade') {
      const n = owner.get(c.cmd.entityId) ?? `#${c.cmd.entityId}`;
      upgrades[n] = (upgrades[n] ?? 0) + 1;
    } else if (c.cmd.type === 'sell') sold++;
  }
  const waves: WaveRow[] = ((file.waves ?? []) as Record<string, unknown>[]).map((w) => ({
    wave: Number(w.wave),
    startTick: Number(w.startTick),
    coins: Number(w.coinsStart),
    lives: Number(w.livesStart),
    leaks: Number(w.leaks),
    leaksByEnemy: (w.leaksByEnemy ?? {}) as Record<string, number>,
    kills: Number(w.kills),
  }));
  return {
    ok: false,
    oldRules: true,
    problems: [OLD_RULES_MESSAGE],
    hash: '',
    expectedHash: file.endHash,
    tick: file.endTick,
    result: file.result,
    lives: file.endLives ?? 0,
    waves,
    bought,
    upgrades,
    sold,
    rejected,
    coinCurve: waves.map((w) => ({ wave: w.wave, coins: w.coins })),
  };
}

function check(c: ReplayCommand, r: { ok: boolean; reason?: string }, problems: string[]): void {
  if (r.ok !== c.ok) problems.push(`Befehl ${c.cmd.type} bei Tick ${c.tick}: Datei ${c.ok ? 'ok' : `abgelehnt (${c.reason ?? '?'})`}, Replay ${r.ok ? 'ok' : `abgelehnt (${r.reason ?? '?'})`}`);
}

const fmtMap = (m: Record<string, number>): string => Object.entries(m).map(([k, v]) => `${k} x${v}`).join(', ') || '-';

export function formatReport(file: ReplayFile, rep: ReplayReport, cmp?: MatchResult): string {
  const out: string[] = [];
  out.push(`Replay ${file.difficulty}, Seed ${file.seed}, Spiel ${file.gameVersion ?? '?'}, ${file.date ?? ''}`);
  if (file.formatVersion >= 3) {
    const bps = (file.unitMods ?? []).map((m) => m.lvlBp ?? 10000);
    out.push(bps.length ? `Mods: ${bps.length} Einträge, Schadens-Faktor ${(Math.min(...bps) / 10000).toFixed(3)} bis ${(Math.max(...bps) / 10000).toFixed(3)}` : 'Mods: keine (neutral)');
  }
  const secs = Math.round(rep.tick / 20);
  out.push(`Ergebnis: ${rep.result ?? 'läuft noch (Zwischenstand)'}, Tick ${rep.tick} (${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} Spielzeit), Leben ${rep.lives}`);
  if (rep.oldRules) out.push(`Hash: nicht geprüft, ${OLD_RULES_MESSAGE}. Die Zahlen unten stammen aus der Datei (Aufnahme des Clients), nicht aus dem Simulator.`);
  else out.push(`Hash: ${rep.ok ? 'OK' : 'ABWEICHUNG'} (${rep.hash})`);
  if (!rep.oldRules) for (const p of rep.problems) out.push(`  ! ${p}`);
  out.push('', 'Welle | Tick  | Münzen | Leben | Kills | Leaks');
  for (const w of rep.waves) {
    out.push(`${String(w.wave).padStart(5)} | ${String(w.startTick).padStart(5)} | ${String(w.coins).padStart(6)} | ${String(w.lives).padStart(5)} | ${String(w.kills).padStart(5)} | ${w.leaks}${w.leaks ? ` (${fmtMap(w.leaksByEnemy)})` : ''}`);
  }
  out.push('', `Münzkurve (Start je Welle): ${rep.coinCurve.map((c) => c.coins).join(' ')}`);
  out.push(`Gekauft: ${fmtMap(rep.bought)}`, `Upgrades: ${fmtMap(rep.upgrades)}`, `Verkauft: ${rep.sold}, abgelehnte Befehle: ${rep.rejected}`);
  if (file.feedback) out.push('', `Feedback: ${file.feedback}`);
  if (cmp) {
    out.push('', `Bot-Lauf ${cmp.bots[0]} (Seed ${cmp.seed}): ${cmp.result}, Tick ${cmp.ticks}, Leben ${cmp.baseHp}`);
    out.push('Welle | Mensch Münzen/Leben/Leaks | Bot Münzen/Leben/Leaks');
    const n = Math.max(rep.waves.length, cmp.waves.length - 1);
    for (let i = 0; i < n; i++) {
      const h = rep.waves[i];
      const b = cmp.waves[i + 1];
      const hs = h ? `${h.coins}/${h.lives}/${h.leaks}` : '-';
      const bs = b ? `${b.coins[0]}/${b.baseHpEnd}/${Object.values(b.leaks).reduce((a, x) => a + x, 0)}` : '-';
      out.push(`${String(i + 1).padStart(5)} | ${hs.padEnd(24)} | ${bs}`);
    }
    const bu: Record<string, number> = {};
    for (const u of cmp.finalUnits) bu[u.unit] = (bu[u.unit] ?? 0) + 1;
    out.push(`Bot-Units am Ende: ${fmtMap(bu)}`);
  }
  return out.join('\n');
}

function main(argv: string[]): number {
  const files: string[] = [];
  let compare = false;
  let bot = 'mono-goku_ssj3';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--compare') compare = true;
    else if (a === '--bot') bot = argv[++i] ?? bot;
    else if (a.startsWith('--')) {
      console.error(`Unbekannte Option ${a}`);
      return 2;
    } else files.push(a);
  }
  if (files.length !== 1) {
    console.error('Aufruf: npm run replay -- DATEI [--compare] [--bot NAME]');
    return 2;
  }
  let file: ReplayFile;
  try {
    file = parseReplay(readFileSync(resolve(process.env.INIT_CWD ?? process.cwd(), files[0]), 'utf8'));
  } catch (e) {
    console.error(`Datei unbrauchbar: ${(e as Error).message}`);
    return 2;
  }
  const rep = replay(file);
  const cmp = compare ? runMatch({ stage: file.stage, difficulty: file.difficulty, players: file.players, seed: file.seed, bots: [bot] }) : undefined;
  console.log(formatReport(file, rep, cmp));
  if (rep.oldRules) {
    console.error(`Replay: ${OLD_RULES_MESSAGE} - Format v${file.formatVersion}, nicht nachspielbar (Exit 3). Aktuelles Format: v${REPLAY_FORMAT_VERSION}.`);
    return 3;
  }
  return rep.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
