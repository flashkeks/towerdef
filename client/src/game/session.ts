/**
 * Eine Spielrunde im Browser: haelt die Sim, taktet sie mit festem Tick (20/s, Akkumulator) und verwaltet Auswahl/Bedienung.
 * Spielregeln gibt es hier nicht - jede Aktion ist ein `sim.apply(...)`, jede Zahl kommt aus `sim.state`.
 */
import { createSim, loadBrowserData, STAGE_ID, type CommandResult, type DifficultyId, type Sim, type TargetMode, type UnitDef, type UnitMod, type WavePreview } from '../sim';
import { keyOr, t } from '../i18n/t';
import { registerStageNames, registerUnitColors, TICK_MS } from '../view/model';
import { failureToast, ghostStatus, placingAfterClick, unitAt, type GhostStatus, type ToastSpec } from '../view/placement';
import { BossTracker } from '../view/telegraph';
import { GameBus } from './events';
import { unitName } from '../ui/meta-model';

export type Speed = 1 | 2 | 3;
export const SPEEDS: readonly Speed[] = [1, 2, 3];
const TARGET_MODES: readonly TargetMode[] = ['first', 'last', 'close', 'strongest'];
/** Obergrenze je Frame, damit ein langer Tab-Wechsel nicht minutenlang nachrechnet. */
const MAX_TICKS_PER_FRAME = 60;
const PLAYER = 0;

export interface Toast {
  /** i18n-Schluessel */
  key: string;
  /** Parameter fuer den Text (Namen schon uebersetzt) */
  params?: Record<string, string | number>;
  until: number;
  /** Mausposition in Canvas-Pixeln beim Ausloesen: der Toast erscheint dort; ohne Position unten mittig. */
  at?: { x: number; y: number } | null;
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
  /** Mauszeiger in Canvas-Pixeln (null = ausserhalb des Spielfelds); setzt `ui/board-input.ts`, liest der Toast. */
  pointer: { x: number; y: number } | null = null;
  /** Dieselbe Position als Sim-Koordinate (ganze Milli-Tiles); setzt `ui/board-input.ts`, liest der Platzier-Geist. */
  cursor: { x: number; y: number } | null = null;
  private acc = 0;
  private previewCache: { key: string; value: WavePreview | null } | null = null;

  /** Unit-Mods (Level/Sterne aus dem Profil, `meta/unit-mods.ts`); leer = neutral. Der Recorder schreibt sie ins Replay (v3). */
  readonly unitMods: UnitMod[];

  /** Stage-ID dieser Runde (Welt-Act, Infinite oder `standard20`). */
  readonly stageId: string;

  constructor(difficulty: DifficultyId, seed: number = Math.floor(Math.random() * 0x7fffffff), bus: GameBus = new GameBus(), unitMods: UnitMod[] = [], stageId: string = STAGE_ID) {
    this.stageId = stageId;
    this.unitMods = unitMods;
    this.seed = seed;
    this.bus = bus;
    const data = loadBrowserData();
    this.difficulty = difficulty;
    this.sim = createSim({ stage: stageId, difficulty, players: 1, seed, data, unitMods });
    registerUnitColors(this.sim.catalog());
    registerStageNames(data.stages[stageId]);
    const stage = data.stages[stageId];
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
    if (!r.ok) this.fail(cmd, r.reason);
    return r;
  }

  /** Ablehnung der Sim als Toast mit Grund, nahe am Mauszeiger. */
  private fail(cmd: Parameters<Sim['apply']>[1], reason: string): void {
    const unit = cmd.type === 'upgrade' ? this.sim.state.units.find((u) => u.id === cmd.entityId) : undefined;
    const unitId = cmd.type === 'place' ? cmd.unitId : unit?.defId;
    const def = unitId ? this.sim.catalog().find((d) => d.id === unitId) : undefined;
    const caps = loadBrowserData().economy.caps;
    const spec = failureToast(cmd, reason, {
      name: def ? unitName(def.id) : undefined,
      def,
      cost: unit ? (this.sim.upgradeCost(unit.id) ?? 0) : def ? this.sim.placeCost(PLAYER, def.id) : undefined,
      coins: this.sim.state.players[PLAYER]?.coins ?? 0,
      teamUnits: caps.teamUnits,
      teamSlots: caps.teamSlots,
    });
    this.notify(spec);
  }

  /** Toast anzeigen (nahe am Mauszeiger). */
  notify(spec: ToastSpec): void {
    this.toast = { ...spec, until: performance.now() + 2500, at: this.pointer ? { ...this.pointer } : null };
  }

  /** Geist am Zeiger: Status der Unit, die gerade gesetzt wuerde (gruen/rot mit Grund aus `sim.canPlace`); null ohne Wahl oder Zeiger. */
  ghost(): (GhostStatus & { unitId: string; x: number; y: number }) | null {
    if (!this.placing || !this.cursor) return null;
    const { x, y } = this.cursor;
    return { unitId: this.placing, x, y, ...ghostStatus(this.sim.canPlace(PLAYER, this.placing, x, y)) };
  }

  /**
   * Klick aufs Spielfeld an einer Sim-Position (Milli-Tiles). Reihenfolge: gesetzte Unit unter dem Zeiger waehlen;
   * sonst mit gewaehlter Unit setzen (Ablehnung -> Toast mit Grund, nie ein toter Klick); sonst abwaehlen bzw. Hinweis.
   * `shift`: nach dem Setzen bleibt dieselbe Unit gewaehlt (naechste platzieren ohne neue Wahl).
   */
  clickBoard(x: number, y: number, shift = false): void {
    this.cursor = { x, y };
    const hit = unitAt(this.sim.state.units, (id) => this.sim.catalog().find((d) => d.id === id)?.radiusMilli ?? 0, x, y);
    if (hit !== null) {
      this.placing = null;
      this.selectedUnit = hit;
      return;
    }
    if (!this.placing) {
      if (this.selectedUnit !== null) this.selectedUnit = null;
      else this.notify({ key: 'toast.hint.empty' });
      return;
    }
    const r = this.run({ type: 'place', unitId: this.placing, x, y });
    this.placing = placingAfterClick(this.placing, r.ok, shift);
    if (r.ok) this.selectedUnit = null;
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

  cycleTargeting(): void {
    const u = this.selectedUnit === null ? undefined : this.sim.state.units.find((x) => x.id === this.selectedUnit);
    if (!u) return;
    const next = TARGET_MODES[(TARGET_MODES.indexOf(u.targeting) + 1) % TARGET_MODES.length];
    this.run({ type: 'setTargeting', entityId: u.id, mode: next });
  }

  /** Fähigkeit der gewählten Unit (oder `entityId`) auslösen; eine Ablehnung der Sim erscheint als Toast mit Grund. */
  useAbility(entityId: number | null = this.selectedUnit, index?: number): CommandResult | null {
    if (entityId === null) return null;
    return this.run(index === undefined ? { type: 'ability', entityId } : { type: 'ability', entityId, index });
  }

  /** Die erste Knopf-Fähigkeit aller gesetzten Units dieser Art, die jetzt geht (Knopf in der Unit-Leiste). Gibt die Zahl der ausgelösten zurück. */
  useAbilityType(defId: string): number {
    const def = this.sim.catalog().find((d) => d.id === defId);
    if (!def) return 0;
    const index = def.abilities.findIndex((a) => a.trigger === 'button');
    if (index < 0) return 0;
    const mine = this.sim.state.units.filter((u) => u.defId === defId);
    if (mine.length === 0) return 0;
    const go = mine.filter((u) => this.sim.abilityBlocked(u.id, index) === null);
    // Nichts geht: ein Versuch an der ersten Unit liefert den Grund als Toast (Abklingzeit, kein Ziel ...)
    if (go.length === 0) {
      this.run({ type: 'ability', entityId: mine[0].id, index });
      return 0;
    }
    for (const u of go) this.run({ type: 'ability', entityId: u.id, index });
    return go.length;
  }

  /** Auto-Schalter der Unit umlegen (an, wenn er aus ist). */
  toggleAuto(entityId: number | null = this.selectedUnit): void {
    const u = entityId === null ? undefined : this.sim.state.units.find((x) => x.id === entityId);
    if (u) this.run({ type: 'autoAbility', entityId: u.id, on: !u.auto });
  }

  /** Auto-Schalter für alle gesetzten Units einer Art (Unit-Leiste): an, wenn nicht alle an sind, sonst aus. */
  toggleAutoType(defId: string): void {
    const mine = this.sim.state.units.filter((u) => u.defId === defId);
    const on = mine.some((u) => !u.auto);
    for (const u of mine) if (!!u.auto !== on) this.run({ type: 'autoAbility', entityId: u.id, on });
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
