import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { unknownEffects } from '../src/data/compile.js';
import { runMatch } from '../src/bots/index.js';
import { data } from './helpers.js';

const read = (rel: string): any => JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8'));
const aa = read('../data/units/aa.json');

describe('AA-Import (tools/aa-import, Runde 8 / P2)', () => {
  it('550 Units + 11 Beschwoerungen = die 561 AA-Eintraege; keine Doppel-IDs; sample liegt nur als Fixture', () => {
    const src = read('../../docs/anime-adventures/data/units.json');
    expect(src.units.length).toBe(561);
    expect(aa.units.length).toBe(550);
    expect(new Set(aa.units.map((u: any) => u.id)).size).toBe(550);
    expect(data.units.units.length).toBe(575);
    const fixture = read('./fixtures/sample-units.json');
    expect(fixture.units.length).toBe(26);
    for (const u of fixture.units) expect(aa.units.some((x: any) => x.id === u.id), u.id).toBe(true);
  });
  it('alle Units und Angriffe parsen (data), alle Effekte stehen im Katalog', () => {
    for (const u of data.units.units) expect(u.levels[0].cost, u.id).toBeGreaterThan(0);
    expect(unknownEffects(data)).toEqual([]);
  });
  it('mindestens 95 % spielbar, ausgeblendete tragen Flag und Grund', () => {
    const by = { full: 0, limited: 0, hidden: 0 } as Record<string, number>;
    for (const u of aa.units) {
      by[u.support]++;
      if (u.support !== 'full') expect(u.supportNotes?.length, u.id).toBeGreaterThan(0);
    }
    expect(by.hidden / 550).toBeLessThan(0.05);
    expect(by.full + by.limited + by.hidden).toBe(550);
  });
  it('Bild-Manifest: je Unit Wiki-Datei und Pfad', () => {
    const m = read('../../client/public/aa/manifest.json');
    expect(Object.keys(m.units).length).toBe(575);
    expect(m.units['rokuhira']).toMatchObject({ name: 'Vengeful Swordsman', wiki: 'Vengeful_Swordsman.png', path: '/aa/units/rokuhira.webp', wikiShiny: 'Vengeful_Swordsman_(Shiny).png' });
  });
  it('Rauchtest: Bot auto (zufaellige Units) laeuft eine Stage ohne Absturz, deterministisch', () => {
    for (const seed of [11, 12]) {
      const a = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed, bots: ['auto'] });
      expect(['win', 'loss']).toContain(a.result);
    }
    expect(runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 11, bots: ['auto'] }).hash).toBe(runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 11, bots: ['auto'] }).hash);
  });
  it('Trait-Mods wirken: mehr Schaden, mehr Tempo, mehr Reichweite', () => {
    const base = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 2, bots: ['mono-goku_ssj3'], maxTicks: 3000 });
    const mod = (m: object) => runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 2, bots: ['mono-goku_ssj3'], maxTicks: 3000, unitMods: [{ player: 0, unit: 'goku_ssj3', ...m }] });
    expect(mod({ traitBp: 30000 }).damageByPlayer[0]).toBeGreaterThan(base.damageByPlayer[0]);
    expect(mod({ spaBp: -5000 }).damageByPlayer[0]).toBeGreaterThan(base.damageByPlayer[0]);
    expect(mod({ rangeBp: 5000 }).damageByPlayer[0]).toBeGreaterThanOrEqual(base.damageByPlayer[0]);
  });
});
