/**
 * Zentrale Verteilung: Sim-Ereignisse und gesendete Befehle gehen hier an beliebig viele Abonnenten.
 * Wer etwas aus der Sim mitlesen will (Replay-Aufzeichnung, Effekte, Ton, Statistik), haengt sich hier ein,
 * statt `session.ts` oder `renderer.ts` zu aendern. Abonnenten duerfen den Sim-Zustand nur LESEN.
 *
 * Ein Bus lebt fuer die ganze Seite (main.ts), nicht je Runde: Abonnement einmal, Rundenwechsel ueber `onRunStart`/`onRunEnd`.
 */
import type { Command, CommandResult, SimEvent } from '../sim';
import type { Session } from './session';

/** Ein an die Sim geschickter Befehl samt Tick, in dem er angewendet wurde (Grundlage fuer Replays). */
export interface CommandRecord {
  /** `sim.state.tick` unmittelbar VOR `apply` */
  tick: number;
  player: number;
  cmd: Command;
  result: CommandResult;
}

/** Bedienung ausserhalb der Sim (aendert den Sim-Zustand nicht, ist aber fuer Statistik/Replay von Belang). */
export type ControlRecord =
  | { type: 'speed'; tick: number; speed: number }
  | { type: 'pause'; tick: number; paused: boolean };

type Handler<T> = (value: T) => void;

class Channel<T> {
  private readonly handlers = new Set<Handler<T>>();
  on(fn: Handler<T>): () => void {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }
  emit(value: T): void {
    for (const fn of [...this.handlers]) fn(value);
  }
  get size(): number {
    return this.handlers.size;
  }
}

export class GameBus {
  private readonly events = new Channel<{ events: readonly SimEvent[]; tick: number }>();
  private readonly commands = new Channel<CommandRecord>();
  private readonly controls = new Channel<ControlRecord>();
  private readonly runStart = new Channel<Session>();
  private readonly runEnd = new Channel<Session>();

  /** Alle vom Session-Tick geleerten Sim-Ereignisse (Stapel je Tick, nie leer). Gibt die Abmeldung zurueck. */
  onEvents(fn: (events: readonly SimEvent[], tick: number) => void): () => void {
    return this.events.on((p) => fn(p.events, p.tick));
  }
  /** Jeder Befehl, der an die Sim geht (auch abgelehnte, mit `result`). */
  onCommand(fn: Handler<CommandRecord>): () => void {
    return this.commands.on(fn);
  }
  /** Geschwindigkeit- und Pause-Wechsel. */
  onControl(fn: Handler<ControlRecord>): () => void {
    return this.controls.on(fn);
  }
  /** Neue Runde gebaut (vor dem ersten Tick). */
  onRunStart(fn: Handler<Session>): () => void {
    return this.runStart.on(fn);
  }
  /** Runde zu Ende (Sieg oder Niederlage), genau einmal je Runde. */
  onRunEnd(fn: Handler<Session>): () => void {
    return this.runEnd.on(fn);
  }

  emitEvents(events: readonly SimEvent[], tick: number): void {
    if (events.length > 0) this.events.emit({ events, tick });
  }
  emitCommand(rec: CommandRecord): void {
    this.commands.emit(rec);
  }
  emitControl(rec: ControlRecord): void {
    this.controls.emit(rec);
  }
  emitRunStart(run: Session): void {
    this.runStart.emit(run);
  }
  emitRunEnd(run: Session): void {
    this.runEnd.emit(run);
  }
}
