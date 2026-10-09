/** Welcher Klang gehoert zu welchem Sim-Ereignis der Runde 14? Reine Funktion (testbar), die Engine spielt das Ergebnis ab. Leise bei niedrigen Stufen (tower-vol). */
import type { SimEvent, TowerState } from '../sim';
import type { SoundPick } from './r13-map';
import { topTier } from './tower-vol';

export function r14Sound(ev: SimEvent, towers: readonly TowerState[]): SoundPick | null {
  switch (ev.type) {
    case 'fire': {
      const t = towers.find((q) => q.id === ev.tower);
      if (t?.type === 'thornweaver' && ev.kind !== 'chain') return { id: 'shoot.thorn', tower: { key: 'fire.thornweaver', top: topTier(t.tiers), base: 0.8 } };
      if (t?.type === 'alchemist') return { id: 'shoot.potion', tower: { key: 'fire.alchemist', top: topTier(t.tiers), base: 0.9 } };
      return null;
    }
    case 'explode': {
      if (ev.kind === 'acid') return { id: 'splash.acid', gain: 0.55 };
      if (ev.kind === 'unstable') return { id: 'burst.unstable', gain: 0.8 };
      return null;
    }
    case 'whirlwind': return { id: 'whirlwind', gain: 0.8 };
    case 'vine': return { id: 'vine', gain: 0.6 };
    case 'zone': return ev.hits > 0 ? { id: 'zone', gain: 0.5 } : null;
    case 'wall': return { id: 'wall' };
    case 'wallEat': return { id: 'wall.eat', gain: 0.6 };
    case 'wallGone': return { id: 'wall.gone', gain: 0.8 };
    case 'brew': return { id: 'brew', gain: 0.8 };
    case 'monster': return { id: 'monster', gain: 0.7 };
    case 'shrink': return { id: 'shrink', gain: 0.7 };
    case 'bounty': return { id: 'bounty', gain: 0.8 };
    case 'heal': return { id: 'heal' };
    case 'gate': return { id: 'gate' };

    default: return null;
  }
}
