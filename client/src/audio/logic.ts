/**
 * Ton, reine Logik (P5): Lautstaerke, Drosselung, Ereignis -> Klang. Kein WebAudio hier, damit alles ohne Browser testbar ist.
 * Die Klaenge selbst stehen in `recipes.ts`, das Abspielen in `engine.ts`.
 */
import type { SimEvent } from '../sim';
import { cueFor, type HitStyle } from '../view/feel';

export type SoundId =
  | 'place'
  | 'upgrade'
  | 'sell'
  | 'error'
  | 'hit.slash'
  | 'hit.tracer'
  | 'hit.shell'
  | 'hit.bolt'
  | 'hit.blast'
  | 'hit.cone'
  | 'hit.line'
  | 'kill'
  | 'leak'
  | 'wave'
  | 'frost'
  | 'nuke'
  | 'bossEnter'
  | 'bossPhase'
  | 'bossWarn'
  | 'bossCast'
  | 'bossBreak'
  | 'windowOpen'
  | 'windowClose'
  | 'wardBreak'
  | 'win'
  | 'lose';

export interface VolumeSettings {
  master: number;
  sfx: number;
  music: number;
}

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/**
 * Wirksame Lautstaerke (Gain) fuer Effekte (`master * sfx`) bzw. Musik (`master * music`). Stumm = 0.
 * Quadratische Kurve: der Regler 50 % klingt etwa halb so laut, nicht fast so laut wie 100 %.
 */
export function effectiveVolume(s: VolumeSettings, bus: 'sfx' | 'music', muted: boolean): number {
  if (muted) return 0;
  const lin = clamp01(s.master) * clamp01(bus === 'sfx' ? s.sfx : s.music);
  return lin * lin;
}

// ---- Drosselung -----------------------------------------------------------------------------------------------------

export interface LimitRule {
  /** Mindestabstand zwischen zwei Klaengen dieser Gruppe (ms). */
  gapMs: number;
  /** Hoechstens `count` Klaenge innerhalb `windowMs` (optional). */
  burst?: { count: number; windowMs: number };
}

/** Gruppe fuer die Drosselung: alle Treffer-Klaenge teilen sich einen Topf, damit 8 Units bei 3x kein Klangbrei werden. */
export const soundGroup = (id: SoundId): string => (id.startsWith('hit.') ? `hit` : id);

export const LIMITS: Record<string, LimitRule> = {
  hit: { gapMs: 55, burst: { count: 5, windowMs: 400 } },
  kill: { gapMs: 70, burst: { count: 4, windowMs: 500 } },
  error: { gapMs: 150 },
  place: { gapMs: 60 },
  upgrade: { gapMs: 60 },
  sell: { gapMs: 60 },
  leak: { gapMs: 120, burst: { count: 3, windowMs: 800 } },
};
/** Je Stil ein eigener Mindestabstand innerhalb des Treffer-Topfs (zwei Blaster-Schuesse dicht hintereinander sind ein Klang). */
export const HIT_STYLE_GAP_MS = 90;
const DEFAULT_RULE: LimitRule = { gapMs: 40 };

/** Zeitfenster-Drossel. Zeit kommt von aussen (testbar). `allow` verbraucht einen Platz, wenn es true liefert. */
export class RateLimiter {
  private readonly last = new Map<string, number>();
  private readonly times = new Map<string, number[]>();

  constructor(private readonly rules: Record<string, LimitRule> = LIMITS) {}

  allow(id: SoundId, nowMs: number): boolean {
    const group = soundGroup(id);
    const rule = this.rules[group] ?? DEFAULT_RULE;
    const last = this.last.get(group);
    if (last !== undefined && nowMs - last < rule.gapMs) return false;
    if (id.startsWith('hit.')) {
      const ls = this.last.get(id);
      if (ls !== undefined && nowMs - ls < HIT_STYLE_GAP_MS) return false;
    }
    if (rule.burst) {
      const list = (this.times.get(group) ?? []).filter((t) => nowMs - t < rule.burst!.windowMs);
      if (list.length >= rule.burst.count) {
        this.times.set(group, list);
        return false;
      }
      list.push(nowMs);
      this.times.set(group, list);
    }
    this.last.set(group, nowMs);
    if (id.startsWith('hit.')) this.last.set(id, nowMs);
    return true;
  }

  reset(): void {
    this.last.clear();
    this.times.clear();
  }
}

/** Leiser, wenn viele Klaenge kurz hintereinander kommen: 1 bei Ruhe, bis ~0.55 bei Dauerfeuer. */
export const crowdGain = (recent: number): number => 1 / Math.sqrt(1 + Math.max(0, recent) * 0.35);

// ---- Ereignis -> Klang ----------------------------------------------------------------------------------------------

/** Klaenge zu einem Sim-Ereignis (Schuesse kommen nicht aus Ereignissen, sondern aus `shotSound`). */
export function soundsFor(e: SimEvent): SoundId[] {
  switch (e.type) {
    case 'place':
      return ['place'];
    case 'upgrade':
      return ['upgrade'];
    case 'sell':
      return ['sell'];
    case 'over':
      return [e.result === 'win' ? 'win' : 'lose'];
    default:
      break;
  }
  const c = cueFor(e);
  if (!c) return [];
  switch (c.kind) {
    case 'kill':
      return ['kill'];
    case 'leak':
      return ['leak'];
    case 'waveStart':
      return ['wave'];
    case 'bossEnter':
      return ['bossEnter'];
    case 'bossPhase':
      return ['bossPhase'];
    case 'bossWarn':
      return ['bossWarn'];
    case 'bossCast':
      return [c.interrupted ? 'bossBreak' : 'bossCast'];
    case 'windowOpen':
      return ['windowOpen'];
    case 'windowClose':
      return ['windowClose'];
    case 'wardBreak':
      return ['wardBreak'];
    default:
      return [];
  }
}

/** Flaechen-Voll-Angriffe (`full`) klingen wie die Explosion; alle anderen Stile haben einen eigenen Klang. */
export const shotSound = (style: HitStyle): SoundId => (style === 'full' ? 'hit.blast' : (`hit.${style}` as SoundId));
