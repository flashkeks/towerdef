import { describe, expect, it } from 'vitest';
import { DATA, createGame, MAX_ROUND } from '../src/sim';
import { ALL_KEYS, POWERS, POWER_IDS, TRAP_CHARGES, baseOf, cycleTab, keyOf, nearestOnPath, powerSlots, priceOf, slotHint, slotUsable, trapPieces, trapSpot, type PowerKey } from '../src/powers/info';
import { previewRound, totalEnemies, waveRows, warnings } from '../src/powers/wave';
import { PATH, PATH_HW } from '../src/pixel/map/layout';

const inv = (o: Partial<Record<PowerKey, number>>): Partial<Record<PowerKey, number>> => o;

describe('Reiter', () => {
  it('Tab wechselt reihum, Shift+Tab rueckwaerts', () => {
    expect(cycleTab('towers')).toBe('powers');
    expect(cycleTab('powers')).toBe('wave');
    expect(cycleTab('wave')).toBe('towers');
    expect(cycleTab('towers', -1)).toBe('wave');
  });
});

describe('Powers-Platten', () => {
  const base = { round: 3, heroPlaced: true };
  it('Bestand 0 = leer mit Hinweis "Buy in the Store"', () => {
    const s = powerSlots({ ...base, inventory: inv({}), usedRound: {} }).find((x) => x.key === 'goldDrop')!;
    expect(s.state).toBe('empty');
    expect(slotHint(s)).toBe('Buy in the Store');
    expect(slotUsable(s)).toBe(false);
  });
  it('in dieser Runde benutzt = ausgegraut, naechste Runde wieder frei', () => {
    const i = inv({ goldDrop: 2 });
    expect(powerSlots({ ...base, inventory: i, usedRound: { goldDrop: 3 } }).find((x) => x.key === 'goldDrop')!.state).toBe('used');
    expect(powerSlots({ ...base, round: 4, inventory: i, usedRound: { goldDrop: 3 } }).find((x) => x.key === 'goldDrop')!.state).toBe('ready');
    // -1 = nie; Runde 0 (vor dem ersten Start) darf nicht als benutzt gelten
    expect(powerSlots({ round: 0, heroPlaced: true, inventory: i, usedRound: { goldDrop: -1 } }).find((x) => x.key === 'goldDrop')!.state).toBe('ready');
  });
  it('Hero Boost braucht den Helden', () => {
    const s = (placed: boolean) => powerSlots({ round: 1, heroPlaced: placed, inventory: inv({ heroBoost: 1 }), usedRound: {} }).find((x) => x.key === 'heroBoost')!;
    expect(s(false).state).toBe('needhero');
    expect(s(true).state).toBe('ready');
  });
  it('Insta-Warden: je Variante mit Bestand eine Platte, ohne Bestand eine leere', () => {
    const none = powerSlots({ ...base, inventory: inv({}), usedRound: {} }).filter((x) => x.id === 'instaWarden');
    expect(none).toHaveLength(1);
    expect(none[0].state).toBe('empty');
    const two = powerSlots({ ...base, inventory: inv({ 'instaWarden:ranger': 1, 'instaWarden:frostcaller': 2 }), usedRound: {} }).filter((x) => x.id === 'instaWarden');
    expect(two.map((x) => x.key)).toEqual(['instaWarden:ranger', 'instaWarden:frostcaller']);
    expect(two[1].count).toBe(2);
  });
  it('Einsatzart je Power passt zu den Daten der Sim', () => {
    const map = { button: 'button', target: 'point', path: 'path', place: 'place' } as const;
    for (const k of ALL_KEYS) expect(POWERS[baseOf(k)].target, k).toBe(map[DATA.powers[k].use]);
  });
  it('Preise im Client = Preise der Sim', () => {
    for (const id of POWER_IDS) expect(POWERS[id].price).toBe(priceOf(keyOf(id, 'ranger')));
    expect(priceOf('goldDrop')).toBe(40);
  });
});

describe('Fallen auf dem Weg', () => {
  it('Punkt auf der Wegmitte ist gueltig, wird gerastet; 30 px daneben nicht', () => {
    expect(nearestOnPath(PATH, 70, 92).d).toBe(0);
    expect(trapSpot(PATH, PATH_HW, 70, 100)).toEqual({ ok: true, x: 70, y: 92 });
    expect(trapSpot(PATH, PATH_HW, 70, 92 + PATH_HW + 1).ok).toBe(false);
    expect(trapSpot(PATH, PATH_HW, 70, 92 + PATH_HW).ok).toBe(true);
    // Ecke: Abstand zur naechsten Strecke
    expect(trapSpot(PATH, PATH_HW, 125, 87).ok).toBe(true);
  });
  it('Anzeige und Sim sind sich einig (canUsePower)', () => {
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, powers: { frostTrap: 1 } });
    for (const [x, y] of [[70, 92], [70, 110], [70, 130], [200, 200], [120, 200], [300, 68]]) {
      expect(g.canUsePower('frostTrap', x * 1000, y * 1000).ok, `${x},${y}`).toBe(trapSpot(PATH, PATH_HW, x, y).ok);
    }
  });
  it('Zacken/Kristalle nehmen mit den Ladungen ab, mindestens einer solange die Falle liegt', () => {
    const full = trapPieces(20, TRAP_CHARGES.caltrops, 6);
    expect(full).toBe(6);
    expect(trapPieces(10, 20, 6)).toBe(3);
    expect(trapPieces(1, 20, 6)).toBe(1);
    expect(trapPieces(0, 20, 6)).toBe(0);
    let prev = 99;
    for (let c = 15; c >= 0; c--) { const n = trapPieces(c, 15, 5); expect(n).toBeLessThanOrEqual(prev); prev = n; }
  });
});

describe('Wave-Vorschau', () => {
  it('zeigt vor dem Start die naechste, in der Welle die laufende Runde, nach Runde 20 nichts', () => {
    expect(previewRound('build', 0, MAX_ROUND)).toBe(1);
    expect(previewRound('build', 4, MAX_ROUND)).toBe(5);
    expect(previewRound('wave', 5, MAX_ROUND)).toBe(5);
    expect(previewRound('build', 20, MAX_ROUND)).toBeNull();
    expect(previewRound('won', 20, MAX_ROUND)).toBeNull();
  });
  it('Sim-Vorschau: Warnungen und Zeilen stimmen fuer alle 20 Runden', () => {
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1 });
    let sawCamo = false, sawArmor = false, sawEmber = false;
    for (let r = 1; r <= MAX_ROUND; r++) {
      const pv = g.roundPreview(r)!;
      expect(pv.round).toBe(r);
      expect(totalEnemies(pv)).toBeGreaterThan(0);
      expect(pv.rbe).toBeGreaterThan(0);
      const rows = waveRows(pv);
      expect(rows.reduce((a, x) => a + x.n, 0)).toBe(totalEnemies(pv));
      const w = warnings(pv);
      expect(w.includes('camo')).toBe(pv.hasCamo);
      expect(w.includes('boss')).toBe(pv.hasBoss);
      sawCamo ||= pv.hasCamo; sawArmor ||= pv.hasArmor; sawEmber ||= pv.hasEmber;
    }
    expect(g.roundPreview(20)!.hasBoss).toBe(true);
    expect(g.roundPreview(1)!.hasBoss).toBe(false);
    expect(g.roundPreview(0)).toBeNull();
    expect(sawCamo && sawArmor && sawEmber).toBe(true);
  });
  it('gleiche Typ/Camo-Gruppen werden in einer Zeile zusammengefasst', () => {
    const rows = waveRows({ round: 1, rbe: 1, hasCamo: false, hasArmor: false, hasEmber: false, hasBoss: false, hasFrostling: false, hasBlimp: false, hasRegrow: false, hasFortified: false, groups: [{ type: 'red', n: 5, camo: false, regrow: false, fortified: false }, { type: 'blue', n: 2, camo: false, regrow: false, fortified: false }, { type: 'red', n: 3, camo: false, regrow: false, fortified: false }, { type: 'red', n: 1, camo: true, regrow: false, fortified: false }] });
    expect(rows.map((r) => [r.type, r.camo, r.n])).toEqual([['red', false, 8], ['blue', false, 2], ['red', true, 1]]);
  });
});
