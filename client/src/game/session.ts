/**
 * Eine Spielrunde im Browser: haelt die Sim, taktet sie mit festem Tick (20/s, Akkumulator) und verwaltet Auswahl/Bedienung.
 * Spielregeln gibt es hier nicht - jede Aktion ist ein `sim.apply(...)`, jede Zahl kommt aus `sim.state`.
 */
import { createSim, loadBrowserData, STAGE_ID, type CommandResult, type DifficultyId, type Sim, type TargetMode, type UnitDef, type WavePreview } from '../sim';
import { keyOr } from '../i18n/t';
import { TICK_MS } from '../view/model';
import { BossTracker } from '../view/telegraph';
import { GameBus } from './events';

export type Speed = 1 | 2 | 3;
export const SPEEDS: readonly Speed[] = [1, 2, 3];
const TARGET_MODES: readonly TargetMode[] = ['first', 'last', 'close', 'strongest'];
/** Obergrenze je Frame, damit ein langer Tab-Wechsel nicht minutenlang nachrechnet. */
const MAX_TICKS_PER_FRAME = 60;
const PLAYER = 0;

export interface Toast {
  /** i18n-Schluessel */
  key: string;
  until: number;
}

export class Session {
  readonly sim: Sim;
  readonly difficulty: DifficultyId;
  readonly seed: number;
  /** Ereignis- und Befehls-Verteilung (siehe events.ts); von main.ts geteilt, im Test eigener Bus. */
  readonly bus: GameBus;
  readonly totalWaves: number;
  readonly waveTimerTicks: number;
  readonly tracker = new BossTracker();
  /** Positionen jedes Gegners VOR dem letzten Tick (fuer die Interpolation, rein visuell). */
  readonly prevPos = new Map<number, { x: number; y: number }>();
  speed: Speed = 1;
  paused = false;
  /** Von der Desktop-Sperre gesetzt: Sim steht, bis das Fenster wieder gross genug ist. */
  blocked = false;
  /** Anteil 0..1 des naechsten Ticks, der schon vergangen ist. */
  alpha = 0;
  selectedUnit: number | null = null;
  placing: string | null = null;
  /** Gewaehltes Team (Unit-Ids, P6 Team-Auswahl); null = alle. Reiner Client-Filter, die Sim kennt keine Teams. */
  team: string[] | null = null;
  toast: Toast | null = null;
  private acc = 0;
  private previewCache: { key: string; value: WavePreview | null } | null = null;

  constructor(difficulty: DifficultyId, seed: number = Math.floor(Math.random() * 0x7fffffff), bus: GameBus = new GameBus()) {
    this.seed = seed;
    this.bus = bus;
    const data = loadBrowserData();
    this.difficulty = difficulty;
    this.sim = createSim({ stage: STAGE_ID, difficulty, players: 1, seed, data });
    const stage = data.stages[STAGE_ID];
    this.totalWaves = stage.waves.length;
    this.waveTimerTicks = stage.waveTimerTicks ?? data.economy.waveTimerTicks;
  }

  get over(): boolean {
    return this.sim.state.phase === 'over';
  }

  get running(): boolean {
    return !this.paused && !this.blocked && !this.over;
  }

  /** Taktet die Sim um `dtMs` echte Millisekunden (mal Geschwindigkeit). */
  advance(dtMs: number): void {
    if (!this.running) return;
    this.acc += Math.min(dtMs, 250) * this.speed;
    let ticks = 0;
    while (this.acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME && !this.over) {
      this.snapshotPositions();
      this.sim.step(1);
      const events = this.sim.drainEvents();
      if (events.length > 0) {
        this.tracker.consume(events);
        this.bus.emitEvents(events, this.sim.state.tick);
      }
      this.acc -= TICK_MS;
      ticks++;
    }
    if (ticks === MAX_TICKS_PER_FRAME) this.acc = 0;
    this.alpha = this.over ? 1 : this.acc / TICK_MS;
    const alive = new Set(this.sim.state.enemies.map((e) => e.id));
    this.tracker.prune(this.sim.state.tick, alive);
    for (const id of this.prevPos.keys()) if (!alive.has(id)) this.prevPos.delete(id);
  }

  private snapshotPositions(): void {
    for (const e of this.sim.state.enemies) this.prevPos.set(e.id, { x: e.x, y: e.y });
  }

  // ---- Bedienung -----------------------------------------------------------------------------------------------

  private run(cmd: Parameters<Sim['apply']>[1]): CommandResult {
    const tick = this.sim.state.tick;
    const r = this.sim.apply(PLAYER, cmd);
    this.bus.emitCommand({ tick, player: PLAYER, cmd, result: r });
    if (!r.ok) this.toast = { key: keyOr(`error.${r.reason}`, 'error.generic'), until: performance.now() + 2500 };
    return r;
  }

  /** Klick auf einen Slot: platzieren (wenn eine Unit gewaehlt ist) oder die dort stehende Unit auswaehlen. */
  clickSlot(slotId: number): void {
    const occupant = this.sim.state.units.find((u) => u.slot === slotId);
    if (occupant) {
      this.placing = null;
      this.selectedUnit = occupant.id;
      return;
    }
    if (!this.placing) {
      this.selectedUnit = null;
      return;
    }
    const r = this.run({ type: 'place', unitId: this.placing, slot: slotId });
    if (r.ok && r.entityId !== undefined) this.selectedUnit = null;
  }

  /** Units der Leiste: das Team (in Katalog-Reihenfolge) oder alle. */
  teamCatalog(): UnitDef[] {
    const all = this.sim.catalog();
    const team = this.team;
    return team ? all.filter((d) => team.includes(d.id)) : all;
  }

  choosePlacing(unitId: string | null): void {
    if (unitId !== null && this.team && !this.team.includes(unitId)) return;
    this.placing = this.placing === unitId ? null : unitId;
    if (this.placing) this.selectedUnit = null;
  }

  upgrade(): void {
    if (this.selectedUnit !== null) this.run({ type: 'upgrade', entityId: this.selectedUnit });
  }

  sell(): void {
    if (this.selectedUnit === null) return;
    if (this.run({ type: 'sell', entityId: this.selectedUnit }).ok) this.selectedUnit = null;
  }

  useAbility(): void {
    if (this.selectedUnit !== null) this.run({ type: 'useAbility', entityId: this.selectedUnit });
  }

  cycleTargeting(): void {
    const u = this.selectedUnit === null ? undefined : this.sim.state.units.find((x) => x.id === this.selectedUnit);
    if (!u) return;
    const next = TARGET_MODES[(TARGET_MODES.indexOf(u.targeting) + 1) % TARGET_MODES.length];
    this.run({ type: 'setTargeting', entityId: u.id, mode: next });
  }

  startNextWave(): void {
    this.run({ type: 'skipWave' });
  }

  chooseCard(cardId: string | null): void {
    this.run({ type: 'chooseCard', cardId });
  }

  setSpeed(s: Speed): void {
    this.speed = s;
    this.bus.emitControl({ type: 'speed', tick: this.sim.state.tick, speed: s });
  }

  togglePause(): void {
    if (this.over) return;
    this.paused = !this.paused;
    this.bus.emitControl({ type: 'pause', tick: this.sim.state.tick, paused: this.paused });
  }

  cancel(): void {
    this.placing = null;
    this.selectedUnit = null;
  }

  /** Vorschau der Welle, die als naechste startet (gecacht, solange Welle/Karte gleich bleiben). */
  nextPreview(n: number): WavePreview | null {
    const key = `${n}|${this.sim.state.nextCard ?? ''}`;
    if (this.previewCache?.key !== key) this.previewCache = { key, value: this.sim.previewWave(n) };
    return this.previewCache.value;
  }
}
