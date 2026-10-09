import { describe, expect, it } from 'vitest';
import { auraLines, canWithdraw, coinCount, coinPath, cooldownText, hasAura, isMarked, marketLines, marketRadiusPx, projectileLook, rangeView } from '../src/match/r13';
import { TOWER_TYPES, HOTKEY, ABILITY_TEXT } from '../src/match/tower-text';
import { r13Sound } from '../src/audio/r13-map';
import { R13_RECIPES } from '../src/audio/recipes-r13';
import { AudioEngine, MIX_MUSIC, MIX_SFX } from '../src/audio/engine';
import { DEFAULT_OPTS, layoutTree } from '../src/screens/knowledge-layout';
import { BRANCHES, KNOWLEDGE } from '../src/meta';
import type { MarketInfo, TowerAura, TowerState } from '../src/sim';

const noAura: TowerAura = { rangeBp: 0, camo: false, speedBp: 0, armor: false, pierce: 0, dmg: 0, discountBp: 0 };
const mi = (o: Partial<MarketInfo> = {}): MarketInfo => ({ income: 80, hasBank: false, bank: 0, bankRateBp: 0, bankCap: 0, nextInterest: 0, grantCash: 0, radius: 80000, ...o });

describe('Turm-Leiste', () => {
  it('Reihenfolge und Hotkeys', () => {
    expect(TOWER_TYPES).toEqual(['ranger', 'bombardier', 'frostcaller', 'longshot', 'market']);
    expect(HOTKEY.longshot).toBe('T');
    expect(HOTKEY.market).toBe('Z');
    expect(new Set(Object.values(HOTKEY)).size).toBe(Object.keys(HOTKEY).length);
  });
  it('Faehigkeitstexte fuer die neuen Faehigkeiten', () => {
    for (const id of ['focus', 'supplyDrop', 'grant']) expect(ABILITY_TEXT[id].name.length).toBeGreaterThan(2);
  });
});

describe('Reichweite: Ring, Aura oder nichts', () => {
  it('Schiessende bekommen einen Ring, Longshot keinen, Market die Aura', () => {
    expect(rangeView('ranger', 90)).toEqual({ kind: 'ring', r: 90 });
    expect(rangeView('longshot', 1000)).toEqual({ kind: 'none' });
    expect(rangeView('market', 80)).toEqual({ kind: 'aura', r: 80 });
  });
  it('Wide Aura vergroessert den Radius', () => {
    expect(marketRadiusPx(80000, 0)).toBe(80);
    expect(marketRadiusPx(80000, 1500)).toBe(92);
  });
});

describe('Projektil-Look', () => {
  it('Longshot-Bolzen nach Pfad A, Splitter, fremde unveraendert', () => {
    expect(projectileLook('snipe', { type: 'longshot', tiers: [0, 2, 0] })).toBe('snipe');
    expect(projectileLook('snipe', { type: 'longshot', tiers: [1, 0, 0] })).toBe('snipeHeavy');
    expect(projectileLook('snipe', { type: 'longshot', tiers: [5, 0, 0] })).toBe('snipeGold');
    expect(projectileLook('frag', { type: 'longshot', tiers: [0, 0, 1] })).toBe('splinter');
    expect(projectileLook('frag', { type: 'bombardier', tiers: [0, 0, 0] })).toBe('frag');
    expect(projectileLook('arrow', undefined)).toBe('arrow');
  });
});

describe('Market-Texte', () => {
  it('Ertrag ohne Bank, mit Bank samt Fuellstand', () => {
    expect(marketLines(mi()).income).toBe('+80 per round');
    expect(marketLines(mi()).bank).toBeUndefined();
    const l = marketLines(mi({ hasBank: true, bank: 1500, bankCap: 3000, bankRateBp: 1000, nextInterest: 150 }));
    expect(l.bank?.fill).toBe(0.5);
    expect(l.bank?.rate).toBe('10% interest');
    expect(l.bank?.next).toBe('+150');
    expect(marketLines(mi({ grantCash: 2000 })).grant).toBe('Grant: +2000 gold');
  });
  it('Withdraw nur mit Bank und Guthaben', () => {
    expect(canWithdraw(null)).toBe(false);
    expect(canWithdraw(mi({ hasBank: true, bank: 0 }))).toBe(false);
    expect(canWithdraw(mi({ hasBank: true, bank: 10 }))).toBe(true);
  });
  it('Aura-Zeilen', () => {
    expect(hasAura(noAura)).toBe(false);
    const a: TowerAura = { ...noAura, rangeBp: 1000, camo: true, speedBp: 1500, dmg: 1, discountBp: 1000 };
    expect(hasAura(a)).toBe(true);
    expect(auraLines(a)).toEqual(['+10% range', 'Sees camo', '+15% attack speed', '+1 damage', 'Upgrades 10% cheaper']);
    expect(auraLines(noAura)).toEqual([]);
  });
});

describe('Muenzflug und Markierung', () => {
  it('Anzahl waechst mit dem Betrag, gedeckelt', () => {
    expect(coinCount(10)).toBe(3);
    expect(coinCount(500)).toBe(10);
    expect(coinCount(99999)).toBe(14);
  });
  it('Bahn beginnt am Start, endet am Ziel', () => {
    const a = { x: 100, y: 200 }, b = { x: 20, y: 4 };
    expect(coinPath(a, b, 0, 0, 5)).toEqual({ x: 100 + (0 - 0.5) * 18 * 1 * 1 + 0, y: 200 });
    const end = coinPath(a, b, 1, 2, 5);
    expect(end.x).toBeCloseTo(20, 5);
    expect(end.y).toBeCloseTo(4, 5);
    expect(coinPath(a, b, 0.5, 2, 5).y).toBeLessThan(102);
  });
  it('Markierung nur solange markTicks > 0', () => {
    expect(isMarked({ markTicks: 0 })).toBe(false);
    expect(isMarked({ markTicks: 3 })).toBe(true);
  });
  it('Abklingzeit als Sekunden', () => {
    expect(cooldownText(0)).toBe('');
    expect(cooldownText(61)).toBe('2s');
  });
});

describe('Ton Runde 13', () => {
  const tw = (type: string, tiers: [number, number, number]): TowerState => ({ id: 1, type, tiers } as unknown as TowerState);
  it('Longshot-Schuss ist ein Turm-Klang nach Stufe, Rest bleibt unberuehrt', () => {
    const p = r13Sound({ type: 'fire', tick: 0, tower: 1, kind: 'snipe' }, [tw('longshot', [0, 3, 1])]);
    expect(p?.id).toBe('shoot.snipe');
    expect(p?.tower?.top).toBe(3);
    expect(r13Sound({ type: 'fire', tick: 0, tower: 1, kind: 'arrow' }, [tw('ranger', [0, 0, 0])])).toBeNull();
  });
  it('Einkommen, Abheben, Faehigkeiten, Markierung', () => {
    expect(r13Sound({ type: 'income', tick: 0, tower: 1, round: 1, amount: 80, cash: 80, bank: 0 }, [tw('market', [0, 0, 0])])?.id).toBe('income');
    expect(r13Sound({ type: 'withdraw', tick: 0, tower: 1, amount: 5 }, [])?.id).toBe('withdraw');
    expect(r13Sound({ type: 'ability', tick: 0, id: 'grant', cash: 2000 }, [])?.id).toBe('grant');
    expect(r13Sound({ type: 'ability', tick: 0, id: 'supplyDrop', cash: 800 }, [])?.id).toBe('supply');
    expect(r13Sound({ type: 'ability', tick: 0, id: 'flare' }, [])).toBeNull();
    expect(r13Sound({ type: 'status', tick: 0, enemy: 1, kind: 'mark' }, [])?.id).toBe('mark');
    expect(r13Sound({ type: 'status', tick: 0, enemy: 1, kind: 'slow' }, [])).toBeNull();
  });
  it('jedes Ergebnis hat ein Rezept', () => {
    for (const id of ['shoot.snipe', 'ricochet', 'mark', 'income', 'withdraw', 'focus', 'supply', 'grant', 'coin.land']) expect(R13_RECIPES[id]?.length).toBeGreaterThan(0);
  });
  it('Longshot-Schuesse niedriger Stufe sind leiser als hohe (Regel tower-vol)', () => {
    const lo = r13Sound({ type: 'fire', tick: 0, tower: 1, kind: 'snipe' }, [tw('longshot', [0, 0, 0])])!;
    const hi = r13Sound({ type: 'fire', tick: 0, tower: 1, kind: 'snipe' }, [tw('longshot', [5, 0, 0])])!;
    expect(hi.tower!.top).toBeGreaterThan(lo.tower!.top);
  });
  it('Engine: Mischfaktoren und Klick vor dem ersten Match', () => {
    expect(MIX_SFX).toBe(0.7);
    expect(MIX_MUSIC).toBe(0.8);
    const a = new AudioEngine();
    expect(a.ctxState).toBeNull(); // ohne Browser kein Kontext, aber play() darf nicht werfen
    expect(() => a.play('ui.click')).not.toThrow();
    expect(a.log).toContain('ui.click');
  });
});

describe('Wissensbaum-Layout', () => {
  const lay = layoutTree(KNOWLEDGE, BRANCHES);
  it('alle 28 Knoten platziert, fuenf Aeste nebeneinander ohne Ueberlappung', () => {
    expect(lay.branches.length).toBe(5);
    expect(lay.branches.reduce((n, b) => n + b.nodes.length, 0)).toBe(KNOWLEDGE.length);
    for (let i = 1; i < lay.branches.length; i++) expect(lay.branches[i].x).toBeGreaterThanOrEqual(lay.branches[i - 1].x + lay.branches[i - 1].w);
  });
  it('passt in 1280 px Breite', () => { expect(lay.width).toBeLessThan(1280 - 72); });
  it('Hoehe: Knoten stehen ohne Ueberlappung im Raster', () => {
    for (const b of lay.branches) {
      const seen = new Set<string>();
      for (const n of b.nodes) { const k = `${n.x}|${n.y}`; expect(seen.has(k)).toBe(false); seen.add(k); }
    }
  });
  it('jede Voraussetzung innerhalb des Asts hat eine Linie', () => {
    const want = KNOWLEDGE.reduce((n, k) => n + k.requires.length, 0);
    expect(lay.branches.reduce((n, b) => n + b.lines.length, 0)).toBe(want);
    for (const b of lay.branches) for (const l of b.lines) expect(l.y2).toBeGreaterThan(l.y1 - 1);
  });
  it('Knoten haben die Groesse aus den Optionen', () => { expect(DEFAULT_OPTS.nodeW).toBeLessThanOrEqual(DEFAULT_OPTS.cellW); });
});
