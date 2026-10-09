/**
 * Powers (Runde 12) im Client: Anzeigedaten, Reiter-Logik und Inventar-Platten als reine Funktionen (ohne DOM, in Node testbar).
 * Die Regeln (Preise, Wirkung) gehoeren der Sim und `meta/`; hier stehen nur Namen, Texte, Zieltyp und Piktogramm.
 * Spezifikation: docs/design/powers.md. Ein Test haelt die Preise gegen `DATA.powers`.
 */

import { DATA, type PowerKey } from '../sim';
export type { PowerKey };

export type InstaVariant = 'ranger' | 'bombardier' | 'frostcaller';
export const INSTA_VARIANTS: readonly InstaVariant[] = ['ranger', 'bombardier', 'frostcaller'];
/** Ausbau der Insta-Warden-Varianten (Anzeige). */
export const INSTA_TIERS: Record<InstaVariant, string> = { ranger: '2-0-3', bombardier: '3-0-1', frostcaller: '0-2-3' };
export const INSTA_NAMES: Record<InstaVariant, string> = { ranger: 'Ranger', bombardier: 'Bombardier', frostcaller: 'Frostcaller' };

/** Wie ein Power eingesetzt wird: Knopf, Punkt auf der Karte (Bombe), auf den Weg legen (Fallen), wie ein Turm platzieren. */
export type PowerTarget = 'button' | 'point' | 'path' | 'place';

/** Basis-Power (ohne Variante). */
export type PowerId = 'goldDrop' | 'lanternBomb' | 'caltrops' | 'frostTrap' | 'timeWarp' | 'lanternOil' | 'extraLives' | 'heroBoost' | 'instaWarden';

export interface PowerInfo {
  id: PowerId;
  name: string;
  price: number;
  target: PowerTarget;
  /** Kurzbeschreibung fuer Store und Inventar (Englisch, Spielertext) */
  desc: string;
  /** Wo der Einsatz scheitert, wenn er nur mit gesetztem Helden geht */
  needsHero?: boolean;
}

export const POWER_IDS: readonly PowerId[] = ['goldDrop', 'lanternBomb', 'caltrops', 'frostTrap', 'timeWarp', 'lanternOil', 'extraLives', 'heroBoost', 'instaWarden'];

const TARGET_OF = { button: 'button', target: 'point', path: 'path', place: 'place' } as const;
/** Anzeigedaten je Basis-Power, aus `DATA.powers` (Preis, Text, Einsatzart kommen aus den Daten der Sim). */
export const POWERS: Record<PowerId, PowerInfo> = Object.fromEntries(POWER_IDS.map((id) => {
  const d = DATA.powers[(id === 'instaWarden' ? 'instaWarden:ranger' : id) as PowerKey];
  return [id, {
    id, name: id === 'instaWarden' ? 'Insta-Warden' : d.name, price: d.price, target: TARGET_OF[d.use],
    desc: id === 'instaWarden' ? 'A fully upgraded tower, placed for free. Pick the build when you buy.' : d.desc, needsHero: id === 'heroBoost',
  }];
})) as Record<PowerId, PowerInfo>;

/** Preis eines Schluessels (Embers) */
export const priceOf = (k: PowerKey): number => DATA.powers[k].price;

export const keyOf = (id: PowerId, variant?: InstaVariant): PowerKey => (id === 'instaWarden' ? `instaWarden:${variant ?? 'ranger'}` : id) as PowerKey;
export const baseOf = (k: PowerKey): PowerId => (k.startsWith('instaWarden') ? 'instaWarden' : (k as PowerId));
export const variantOf = (k: PowerKey): InstaVariant | undefined => (k.startsWith('instaWarden:') ? (k.slice(12) as InstaVariant) : undefined);
export const ALL_KEYS: readonly PowerKey[] = POWER_IDS.flatMap((id) => (id === 'instaWarden' ? INSTA_VARIANTS.map((v) => keyOf(id, v)) : [keyOf(id)]));

export function displayName(k: PowerKey): string {
  const v = variantOf(k);
  return v ? `${POWERS.instaWarden.name}: ${INSTA_NAMES[v]} ${INSTA_TIERS[v]}` : POWERS[baseOf(k)].name;
}

// ---------------------------------------------------------------- Reiter

export type SideTab = 'towers' | 'powers' | 'wave';
export const SIDE_TABS: readonly SideTab[] = ['towers', 'powers', 'wave'];

/** Tab-Taste: naechster (oder vorheriger) Reiter, reihum. */
export function cycleTab(cur: SideTab, dir: 1 | -1 = 1): SideTab {
  const i = SIDE_TABS.indexOf(cur);
  return SIDE_TABS[(i + dir + SIDE_TABS.length) % SIDE_TABS.length];
}

// ---------------------------------------------------------------- Inventar-Platten

export type SlotState = 'ready' | 'used' | 'empty' | 'needhero';
export interface PowerSlot {
  key: PowerKey;
  id: PowerId;
  variant?: InstaVariant;
  name: string;
  count: number;
  state: SlotState;
  target: PowerTarget;
  desc: string;
}

export interface SlotCtx {
  inventory: Partial<Record<PowerKey, number>>;
  /** je Art die Runde des letzten Einsatzes (`state.powerUsedRound`, -1 = nie) */
  usedRound: Partial<Record<PowerKey, number>>;
  round: number;
  heroPlaced: boolean;
}

/**
 * Platten des Powers-Reiters: alle acht Arten, Insta-Warden je Variante mit Bestand (ohne Bestand eine leere Platte).
 * Reihenfolge fest, damit sich nichts verschiebt, wenn ein Bestand auf 0 faellt.
 */
export function powerSlots(c: SlotCtx): PowerSlot[] {
  const out: PowerSlot[] = [];
  const make = (key: PowerKey): PowerSlot => {
    const id = baseOf(key), info = POWERS[id];
    const count = Math.max(0, Math.floor(c.inventory[key] ?? 0));
    const used = c.usedRound[key] === c.round;
    const state: SlotState = count <= 0 ? 'empty' : used ? 'used' : info.needsHero && !c.heroPlaced ? 'needhero' : 'ready';
    return { key, id, variant: variantOf(key), name: displayName(key), count, state, target: info.target, desc: info.desc };
  };
  for (const id of POWER_IDS) {
    if (id !== 'instaWarden') { out.push(make(keyOf(id))); continue; }
    const owned = INSTA_VARIANTS.filter((v) => (c.inventory[keyOf(id, v)] ?? 0) > 0);
    if (!owned.length) out.push({ ...make(keyOf(id, 'ranger')), name: POWERS.instaWarden.name, variant: undefined });
    else for (const v of owned) out.push(make(keyOf(id, v)));
  }
  return out;
}

/** Ist die Platte jetzt klickbar? (Bestand, nicht schon in dieser Runde benutzt, Held da) */
export const slotUsable = (s: PowerSlot): boolean => s.state === 'ready';

/** Hinweistext unter der Platte (Englisch). */
export function slotHint(s: PowerSlot): string {
  switch (s.state) {
    case 'empty': return 'Buy in the Store';
    case 'used': return 'Used this round';
    case 'needhero': return 'Place Wren first';
    default: return s.target === 'button' ? 'Click to use' : s.target === 'place' ? 'Click, then place' : 'Click, then pick a spot';
  }
}

// ---------------------------------------------------------------- Weg-Treffer fuer Fallen

export type Pt = [number, number];
/** Naechster Punkt der Polylinie zu (x, y) in px, samt Abstand. */
export function nearestOnPath(path: readonly Pt[], x: number, y: number): { x: number; y: number; d: number } {
  let best = { x: path[0][0], y: path[0][1], d: Infinity };
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const px = ax + dx * t, py = ay + dy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { x: px, y: py, d };
  }
  return best;
}

/** Falle legen: Zielpunkt liegt auf dem Weg, wenn der Abstand zur Wegmitte <= halbe Wegbreite (wie die Sim). */
export function trapSpot(path: readonly Pt[], halfWidth: number, x: number, y: number): { ok: boolean; x: number; y: number } {
  const n = nearestOnPath(path, x, y);
  return { ok: n.d <= halfWidth, x: Math.round(n.x), y: Math.round(n.y) };
}

/** Wie viele Zacken/Kristalle eine Falle mit `charges` von `max` zeigt (mindestens 1, solange sie existiert). */
export function trapPieces(charges: number, max: number, top: number): number {
  if (charges <= 0) return 0;
  return Math.max(1, Math.min(top, Math.ceil((charges / Math.max(1, max)) * top)));
}
export const TRAP_CHARGES: Record<'caltrops' | 'frostTrap', number> = { caltrops: 20, frostTrap: 15 };
