/** Welcher Klang gehoert zu welchem Sim-Ereignis der Runde 13? Reine Funktion (testbar), die Engine spielt das Ergebnis ab. */
import type { SimEvent, TowerState } from '../sim';
import { topTier } from './tower-vol';

export interface SoundPick {
  id: string;
  /** Turm-Klang (laut nach Stufe, mit Mindestabstand) oder normaler Klang */
  tower?: { key: string; top: number; base: number };
  gain?: number;
}

export function r13Sound(ev: SimEvent, towers: readonly TowerState[]): SoundPick | null {
  switch (ev.type) {
    case 'fire': {
      const t = towers.find((q) => q.id === ev.tower);
      if (t?.type !== 'longshot') return null;
      return { id: 'shoot.snipe', tower: { key: 'fire.longshot', top: topTier(t.tiers), base: 1 } };
    }
    case 'ricochet': return { id: 'ricochet', gain: 0.8 };
    case 'status': return ev.kind === 'mark' ? { id: 'mark' } : null;
    case 'income': {
      const t = towers.find((q) => q.id === ev.tower);
      return { id: 'income', tower: { key: 'income', top: t ? topTier(t.tiers) : 0, base: 1.8 } };
    }
    case 'withdraw': return { id: 'withdraw' };
    case 'ability':
      if (ev.id === 'focus') return { id: 'focus' };
      if (ev.id === 'supplyDrop') return { id: 'supply' };
      if (ev.id === 'grant') return { id: 'grant' };
      return null;
    default: return null;
  }
}
