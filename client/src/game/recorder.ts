/**
 * Replay-Aufzeichnung (Runde 5 / P2). Haengt NUR am `GameBus` (onRunStart, onCommand, onControl, onEvents, onRunEnd),
 * liest den Sim-Zustand nur und aendert ihn nie. Seed + Befehlsliste mit Tick = ganze Runde (Sim ist deterministisch);
 * `sim/scripts/replay.ts` spielt die Datei nach und prueft `endHash`. Keine personenbezogenen Daten: kein Name,
 * keine IP, kein Geraet, nur Spieldaten und der freiwillige Freitext.
 */
import type { Command, DifficultyId, SimEvent } from '../sim';
import { STAGE_ID } from '../sim';
import { t } from '../i18n/t';
import type { GameBus } from './events';
import type { Session } from './session';

export const REPLAY_FORMAT = 'towerdef-replay';
export const REPLAY_FORMAT_VERSION = 2;

declare const __APP_VERSION__: string | undefined;

/** Spiel-Version: Vite-`define` (`__APP_VERSION__`, von P1) bzw. `VITE_APP_VERSION`, sonst Platzhalter. Nie werfen. */
export function appVersion(): string {
  try {
    if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) return String(__APP_VERSION__);
  } catch {
    /* nicht definiert */
  }
  try {
    const v = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_APP_VERSION;
    if (v) return v;
  } catch {
    /* kein Vite */
  }
  return 'dev';
}

export interface ReplayCommand {
  tick: number;
  player: number;
  cmd: Command;
  ok: boolean;
  /** nur bei abgelehnten Befehlen */
  reason?: string;
}

export type ReplayControl = { type: 'speed'; tick: number; speed: number } | { type: 'pause'; tick: number; paused: boolean };

export interface ReplayWave {
  wave: number;
  startTick: number;
  coinsStart: number;
  coinsEnd: number;
  livesStart: number;
  livesEnd: number;
  leaks: number;
  /** Leaks nach Gegnertyp */
  leaksByEnemy: Record<string, number>;
  kills: number;
}

export interface ReplayFile {
  format: typeof REPLAY_FORMAT;
  formatVersion: number;
  gameVersion: string;
  stage: string;
  difficulty: DifficultyId;
  players: number;
  seed: number;
  /** Team-Wahl (6 aus 8), `null` solange es im Spiel keine Wahl gibt */
  team: string[] | null;
  /** Gewaehlte Risikokarten (aus den chooseCard-Befehlen, in Reihenfolge) */
  cards: { tick: number; card: string | null }[];
  /** false = Zwischenstand (z. B. aus der Pause), `endHash` gilt dann fuer `endTick` */
  complete: boolean;
  result: 'win' | 'loss' | null;
  endTick: number;
  endHash: string;
  endWave: number;
  endLives: number;
  endCoins: number;
  /** Dauer in Ticks (= endTick) und in Echtzeit (Millisekunden, inkl. Pausen) */
  durationTicks: number;
  durationMs: number;
  /** Tag der Aufzeichnung (YYYY-MM-DD, UTC) */
  date: string;
  commands: ReplayCommand[];
  controls: ReplayControl[];
  waves: ReplayWave[];
  /** Freitext "What felt bad?" (leer, wenn nichts eingegeben) */
  feedback: string;
}

let current: Recorder | null = null;
/** Die aktive Aufzeichnung (fuer den Download-Knopf); `null`, solange kein Recorder angelegt ist. */
export function getRecorder(): Recorder | null {
  return current;
}

export class Recorder {
  private session: Session | null = null;
  private rec: ReplayFile | null = null;
  private startedAt = 0;
  private endedAt = 0;
  private offs: (() => void)[] = [];

  constructor(bus: GameBus) {
    current = this;
    this.offs.push(
      bus.onRunStart((s) => this.start(s)),
      bus.onCommand((r) => this.command(r.tick, r.player, r.cmd, r.result)),
      bus.onControl((c) => this.rec?.controls.push({ ...c })),
      bus.onEvents((ev) => this.events(ev)),
      bus.onRunEnd((s) => this.end(s)),
    );
  }

  dispose(): void {
    for (const off of this.offs) off();
    this.offs = [];
    if (current === this) current = null;
  }

  /** Gibt es eine Runde, die man herunterladen koennte? */
  get hasRun(): boolean {
    return this.rec !== null;
  }

  /** Runde schon zu Ende (nicht nur Zwischenstand)? */
  get finished(): boolean {
    return this.rec?.complete === true;
  }

  setFeedback(text: string): void {
    if (this.rec) this.rec.feedback = text.slice(0, 4000);
  }

  get feedback(): string {
    return this.rec?.feedback ?? '';
  }

  /** Momentaufnahme als Datei-Inhalt: bei laufender Runde Zwischenstand (`complete: false`) mit Hash des aktuellen Ticks. */
  snapshot(): ReplayFile | null {
    const s = this.session;
    const r = this.rec;
    if (!s || !r) return null;
    if (r.complete) return structuredClone(r);
    const out = structuredClone(r);
    this.fillEnd(out, s, false);
    return out;
  }

  private start(s: Session): void {
    this.session = s;
    this.startedAt = Date.now();
    this.endedAt = 0;
    const team = (s as unknown as { team?: unknown }).team;
    this.rec = {
      format: REPLAY_FORMAT,
      formatVersion: REPLAY_FORMAT_VERSION,
      gameVersion: appVersion(),
      stage: STAGE_ID,
      difficulty: s.difficulty,
      players: s.sim.state.players.length,
      seed: s.seed,
      team: Array.isArray(team) ? team.map(String) : null,
      cards: [],
      complete: false,
      result: null,
      endTick: 0,
      endHash: '',
      endWave: 0,
      endLives: 0,
      endCoins: 0,
      durationTicks: 0,
      durationMs: 0,
      date: new Date().toISOString().slice(0, 10),
      commands: [],
      controls: [],
      waves: [],
      feedback: '',
    };
  }

  private command(tick: number, player: number, cmd: Command, result: { ok: boolean; reason?: string }): void {
    const r = this.rec;
    if (!r) return;
    const c: ReplayCommand = { tick, player, cmd: structuredClone(cmd), ok: result.ok };
    if (!result.ok && result.reason) c.reason = result.reason;
    r.commands.push(c);
    if (cmd.type === 'chooseCard' && result.ok) r.cards.push({ tick, card: cmd.cardId });
  }

  private events(events: readonly SimEvent[]): void {
    const r = this.rec;
    const s = this.session;
    if (!r || !s) return;
    const st = s.sim.state;
    for (const e of events) {
      if (e.type === 'waveStart') {
        r.waves.push({
          wave: e.wave,
          startTick: e.tick,
          coinsStart: st.players[0]?.coins ?? 0,
          coinsEnd: st.players[0]?.coins ?? 0,
          livesStart: st.lives,
          livesEnd: st.lives,
          leaks: 0,
          leaksByEnemy: {},
          kills: 0,
        });
      } else if (e.type === 'leak') {
        const w = this.waveRow(e.wave);
        if (w) {
          w.leaks++;
          w.leaksByEnemy[e.enemy] = (w.leaksByEnemy[e.enemy] ?? 0) + 1;
        }
      } else if (e.type === 'kill') {
        const w = this.waveRow(e.wave);
        if (w) w.kills++;
      }
    }
    const last = r.waves[r.waves.length - 1];
    if (last) {
      last.coinsEnd = st.players[0]?.coins ?? last.coinsEnd;
      last.livesEnd = st.lives;
    }
  }

  private waveRow(wave: number): ReplayWave | undefined {
    const w = this.rec?.waves;
    if (!w) return undefined;
    for (let i = w.length - 1; i >= 0; i--) if (w[i].wave === wave) return w[i];
    return w[w.length - 1];
  }

  private fillEnd(r: ReplayFile, s: Session, complete: boolean): void {
    const st = s.sim.state;
    r.complete = complete;
    r.result = st.result ?? null;
    r.endTick = st.tick;
    r.endHash = s.sim.hash();
    r.endWave = st.wave;
    r.endLives = st.lives;
    r.endCoins = st.players[0]?.coins ?? 0;
    r.durationTicks = st.tick;
    r.durationMs = (this.endedAt || Date.now()) - this.startedAt;
  }

  private end(s: Session): void {
    if (!this.rec || s !== this.session) return;
    this.endedAt = Date.now();
    this.fillEnd(this.rec, s, true);
  }
}

/** Dateiname `TITEL-STUFE-ERGEBNIS-DATUM.json` (Titel aus `game.title`) (Ergebnis: win, loss oder pause). */
export function replayFileName(r: ReplayFile): string {
  const res = r.result ?? 'pause';
  return `${t('game.title').toLowerCase().replace(/[^a-z0-9]+/g, '')}-${r.difficulty}-${res}-${r.date}.json`;
}
