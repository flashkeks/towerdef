import { describe, expect, it } from 'vitest';
import { buffLines, glowKind, monsterScale, monsterText, wallWear, zoneView } from '../src/match/r14';
import { projectileLook } from '../src/match/r13';
import { ABILITY_TEXT, HOTKEY, ROLE, TOWER_TYPES } from '../src/match/tower-text';
import { r14Sound } from '../src/audio/r14-map';
import { R14_RECIPES } from '../src/audio/recipes-r14';
import { towerGapMs, towerLoudness } from '../src/audio/tower-vol';
import { DATA, type SimEvent, type TowerBuff, type TowerState } from '../src/sim';

const buff = (o: Partial<TowerBuff> = {}): TowerBuff => ({ dmg: 0, rangeBp: 0, speedBp: 0, groveSpeedBp: 0, permanent: false, ticks: 0, ...o });
const tw = (type: string, tiers: [number, number, number] = [0, 0, 0], id = 1): TowerState => ({ id, type, tiers } as unknown as TowerState);

describe('Turm-Leiste Runde 14', () => {
  it('sieben Tuerme, Thornweaver D, Alchemist A, Hotkeys eindeutig', () => {
    expect(TOWER_TYPES).toHaveLength(7);
    expect(TOWER_TYPES.slice(5)).toEqual(['thornweaver', 'alchemist']);
    expect(HOTKEY.thornweaver).toBe('D');
    expect(HOTKEY.alchemist).toBe('A');
    expect(new Set(Object.values(HOTKEY)).size).toBe(Object.keys(HOTKEY).length);
    for (const t of TOWER_TYPES) { expect(ROLE[t].length).toBeGreaterThan(5); expect(DATA.towers[t].name.length).toBeGreaterThan(3); }
  });
  it('Faehigkeitstexte fuer Wall of Trees und Tonic', () => {
    expect(ABILITY_TEXT.wallOfTrees.name).toBe('Wall of Trees');
    expect(ABILITY_TEXT.tonic.name).toBe('Transforming Tonic');
  });
});

describe('Buff-Glanz und Panel-Zeilen', () => {
  it('Glanzart: permanent, Stimulant, Trank, keiner', () => {
    expect(glowKind(null)).toBeNull();
    expect(glowKind(buff())).toBeNull();
    expect(glowKind(buff({ dmg: 1, rangeBp: 1500, speedBp: 1000, ticks: 300 }))).toBe('brew');
    expect(glowKind(buff({ dmg: 2, rangeBp: 1500, speedBp: 2500, ticks: 300 }))).toBe('stimulant');
    expect(glowKind(buff({ permanent: true }))).toBe('permanent');
    expect(glowKind(buff({ groveSpeedBp: 1500 }))).toBeNull(); // Spring Blessing allein: kein Trank-Glanz
  });
  it('Panel-Zeilen nennen Wirkung und Restzeit', () => {
    expect(buffLines(buff({ dmg: 1, rangeBp: 1500, speedBp: 1000, ticks: 300 }))).toEqual(['+1 damage (5s)', '+15% range (5s)', '+10% attack speed (5s)']);
    expect(buffLines(buff({ speedBp: 2500, permanent: true }))).toEqual(['+25% attack speed (permanent)']);
    expect(buffLines(buff({ groveSpeedBp: 1500 }))).toEqual(['+15% speed (Grove)']);
    expect(buffLines(null)).toEqual([]);
  });
});

describe('Baumwand, Zone, Monster', () => {
  it('Abnutzung in vier Stufen', () => {
    expect([150, 120, 80, 20, 0].map((l) => wallWear(l))).toEqual([0, 0, 1, 3, 3]);
  });
  it('Zone: Radius in px, Weltenbaum ab B5', () => {
    expect(zoneView({ zone: 0, tiers: [0, 0, 0] })).toBeNull();
    expect(zoneView({ zone: 48000, tiers: [0, 4, 0] })).toEqual({ r: 48, world: false });
    expect(zoneView({ zone: 144000, tiers: [0, 5, 0] })).toEqual({ r: 144, world: true });
  });
  it('Monster: Alchemist gross, verwandelte Tuerme klein', () => {
    expect(monsterScale('alchemist')).toBe(1);
    expect(monsterScale('ranger')).toBe(0.6);
    expect(monsterText(0)).toBe('');
    expect(monsterText(61)).toBe('MONSTER 2s');
  });
});

describe('Projektil-Look', () => {
  it('Dorn, magischer Dorn ab Grove Guardian, Trank, Goldtrank ab Lead to Gold', () => {
    expect(projectileLook('thorn', { type: 'thornweaver', tiers: [0, 0, 0] })).toBe('thorn');
    expect(projectileLook('thorn', { type: 'thornweaver', tiers: [0, 0, 5] })).toBe('thornMagic');
    expect(projectileLook('potion', { type: 'alchemist', tiers: [2, 0, 2] })).toBe('potion');
    expect(projectileLook('potion', { type: 'alchemist', tiers: [0, 0, 3] })).toBe('potionGold');
  });
});

describe('Toene Runde 14', () => {
  const ev = (o: object): SimEvent => o as SimEvent;
  it('jeder gewaehlte Klang hat ein Rezept', () => {
    const towers = [tw('thornweaver', [0, 0, 0], 1), tw('alchemist', [0, 0, 0], 2)];
    const evs = [
      ev({ type: 'fire', tower: 1, kind: 'thorn' }), ev({ type: 'fire', tower: 2, kind: 'potion' }),
      ev({ type: 'explode', kind: 'acid' }), ev({ type: 'explode', kind: 'unstable' }), ev({ type: 'whirlwind' }), ev({ type: 'vine' }),
      ev({ type: 'zone', hits: 2 }), ev({ type: 'wall' }), ev({ type: 'wallEat' }), ev({ type: 'wallGone' }), ev({ type: 'brew' }),
      ev({ type: 'monster' }), ev({ type: 'shrink' }), ev({ type: 'bounty' }), ev({ type: 'heal' }), ev({ type: 'gate' }),
    ];
    for (const e of evs) { const p = r14Sound(e, towers); expect(p, e.type).not.toBeNull(); expect(R14_RECIPES[p!.id], p!.id).toBeDefined(); }
  });
  it('Ketten-Fire des Thornweavers bleibt beim Kettenblitz-Klang, Zone ohne Treffer ist still', () => {
    expect(r14Sound(ev({ type: 'fire', tower: 1, kind: 'chain' }), [tw('thornweaver')])).toBeNull();
    expect(r14Sound(ev({ type: 'zone', hits: 0 }), [])).toBeNull();
    expect(r14Sound(ev({ type: 'explode', kind: 'bomb' }), [])).toBeNull();
  });
  it('niedrige Stufen leise (tower-vol), Schuesse als Turm-Klang', () => {
    const p = r14Sound(ev({ type: 'fire', tower: 1, kind: 'thorn' }), [tw('thornweaver', [1, 0, 0])]);
    expect(p?.tower?.top).toBe(1);
    expect(towerLoudness(1)).toBeLessThan(towerLoudness(5));
    expect(towerGapMs(1)).toBeGreaterThan(towerGapMs(5));
    expect(p!.tower!.base).toBeLessThanOrEqual(1);
  });
});
