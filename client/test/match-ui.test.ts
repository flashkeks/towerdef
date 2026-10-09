import { describe, expect, it } from 'vitest';
import { hasKey, t } from '../src/i18n/t';
import { AudioEngine } from '../src/audio/engine';
import { RECIPES } from '../src/audio/recipes';
import { R11_RECIPES } from '../src/audio/recipes-r11';
import { createGame, DATA, type SimEvent, type TowerState } from '../src/sim';
import { HERO_TYPES, HOTKEY, TOWER_TYPES } from '../src/match/tower-text';
import { baseRangePx, footMilli } from '../src/match/info';

const sources = import.meta.glob('../src/{match,app}/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('Texte', () => {
  it('jeder im Quelltext benutzte Schluessel t(\'...\') existiert', () => {
    const missing: string[] = [];
    for (const [f, src] of Object.entries(sources)) {
      for (const m of src.matchAll(/\bt\('([a-zA-Z0-9_.-]+)'/g)) if (!hasKey(m[1])) missing.push(`${f}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });

  it('jeder Ablehnungsgrund der Sim hat einen englischen Text', () => {
    for (const r of ['out-of-bounds', 'on-path', 'water', 'blocked', 'overlap', 'no-cash', 'locked', 'hero-limit', 'crosspath', 'maxed', 'hero', 'cooldown', 'no-ability', 'no-target', 'spawning', 'game-over', 'no-more-rounds', 'no-tower'])
      expect(hasKey(`reason.${r}`), r).toBe(true);
    expect(t('match.round', { n: 3, max: 20 })).toBe('Round 3/20');
  });
});

describe('Hotkeys und Daten', () => {
  it('Hotkeys sind eindeutig und decken alle Tuerme und den Helden ab', () => {
    const all = [...TOWER_TYPES, ...HERO_TYPES];
    const keys = all.map((x) => HOTKEY[x]);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('Fussabdruck und Reichweite kommen aus den Sim-Daten', () => {
    for (const ty of [...TOWER_TYPES, ...HERO_TYPES]) {
      expect(footMilli(ty)).toBeGreaterThan(5000);
      expect(baseRangePx(ty)).toBeGreaterThan(40);
    }
  });
});

describe('Sim-Anbindung fuer das Panel', () => {
  it('upgradeInfo liefert drei Pfade mit Name und Preis; Crosspath sperrt den dritten Pfad', () => {
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1 });
    g.sandbox.setCash(100000);
    const r = g.apply({ type: 'place', tower: 'ranger', x: 150000, y: 150000 });
    expect(r.ok).toBe(true);
    const id = (r as { id: number }).id;
    let info = g.upgradeInfo(id);
    expect(info).toHaveLength(3);
    expect(info.every((i) => i.next === 1 && i.name.length > 0 && i.price > 0 && i.canBuy)).toBe(true);
    for (let i = 0; i < 3; i++) g.apply({ type: 'upgrade', towerId: id, path: 0 });
    for (let i = 0; i < 2; i++) g.apply({ type: 'upgrade', towerId: id, path: 1 });
    info = g.upgradeInfo(id);
    expect(info[2].canBuy).toBe(false);
    expect(info[2].reason).toBe('crosspath');
    expect(DATA.towers.ranger.paths[0].tiers).toHaveLength(5);
  });
});

describe('Ton: Events -> Klaenge', () => {
  const tower = (type: TowerState['type'], tiers: [number, number, number] = [0, 0, 0]): TowerState => ({ id: 1, type, tiers } as TowerState);
  const ids = (evs: SimEvent[], towers: TowerState[]): string[] => {
    const a = new AudioEngine();
    for (const e of evs) a.onEvent(e, towers);
    return a.log;
  };
  it('jeder Turm hat seinen eigenen Abschuss', () => {
    const out = ids([{ type: 'fire', tick: 0, tower: 1, kind: 'arrow' }], [tower('ranger')])
      .concat(ids([{ type: 'fire', tick: 0, tower: 1, kind: 'bomb' }], [tower('bombardier')]))
      .concat(ids([{ type: 'fire', tick: 0, tower: 1, kind: 'frost' }], [tower('frostcaller')]))
      .concat(ids([{ type: 'fire', tick: 0, tower: 1, kind: 'lantern' }], [tower('wren')]))
      .concat(ids([{ type: 'fire', tick: 0, tower: 1, kind: 'chain' }], [tower('frostcaller')]));
    expect(out).toEqual(['shoot.ranger', 'shoot.bomb', 'shoot.frost', 'shoot.hero', 'shoot.chain']);
  });
  it('Platzen, Explosion, Leck, Kauf, Runden, Boss, Ende', () => {
    const evs: SimEvent[] = [
      { type: 'pop', tick: 0, enemy: 1, etype: 'red', x: 0, y: 0, children: [], cash: 1 },
      { type: 'pop', tick: 0, enemy: 1, etype: 'brute', x: 0, y: 0, children: [], cash: 1 },
      { type: 'explode', tick: 0, x: 0, y: 0, radius: 24000, kind: 'bomb' },
      { type: 'leak', tick: 0, enemy: 1, etype: 'red', lives: 1 },
      { type: 'place', tick: 0, tower: 1, ttype: 'ranger', cash: 0 },
      { type: 'upgrade', tick: 0, tower: 1, ttype: 'ranger', tiers: [1, 0, 0], cash: 0 },
      { type: 'roundStart', tick: 0, round: 3 },
      { type: 'roundEnd', tick: 0, round: 3, bonus: 103 },
      { type: 'roundStart', tick: 0, round: 20 },
      { type: 'gameOver', tick: 0, result: 'won', round: 20 },
      { type: 'gameOver', tick: 0, result: 'lost', round: 12 },
    ];
    expect(ids(evs, [])).toEqual(['pop', 'pop.big', 'explode', 'leak', 'buy', 'upgrade', 'roundStart', 'roundEnd', 'boss', 'win', 'lose']);
  });
  it('alle Klaenge haben ein Rezept', () => {
    const all = { ...RECIPES, ...R11_RECIPES };
    for (const id of ['shoot.ranger', 'shoot.bomb', 'shoot.frost', 'shoot.hero', 'shoot.chain', 'pop', 'pop.big', 'tink', 'explode', 'quake', 'nova', 'freeze', 'leak', 'buy', 'upgrade', 'sell', 'roundStart', 'roundEnd', 'boss', 'bossPlate', 'levelup', 'ability', 'flare', 'win', 'lose', 'error', 'click'])
      expect(all[id], id).toBeTruthy();
  });
});
