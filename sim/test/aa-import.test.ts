import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { unknownEffects } from '../src/data/compile.js';
import { runMatch } from '../src/bots/index.js';
import { checkFiguren, loadFiguren } from '../../tools/aa-import/figuren.js';
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
  it('Bild-Manifest: je Unit echter Name, Serie, anilistQuery, Wiki-Rueckfall und Pfad', () => {
    const m = read('../../client/public/aa/manifest.json');
    expect(Object.keys(m.units).length).toBe(575);
    expect(m.units['rokuhira']).toMatchObject({ name: 'Gintoki Sakata', series: 'Gintama', anilistQuery: 'Gintoki Sakata', source: 'anilist', wiki: 'Vengeful_Swordsman.png', path: '/aa/units/rokuhira.webp', wikiShiny: 'Vengeful_Swordsman_(Shiny).png' });
    expect(m.units['kakashi']).toMatchObject({ name: 'Kakashi Hatake', series: 'Naruto', anilistQuery: 'Kakashi Hatake', source: 'anilist' });
    expect(m.units['goku_ssb']).toMatchObject({ name: 'Son Goku', form: 'Super Saiyan Blue', series: 'Dragon Ball' });
    for (const [id, e] of Object.entries<any>(m.units)) {
      expect(e.name && e.series, id).toBeTruthy();
      if (e.source === 'anilist') expect(e.anilistQuery, id).toBeTruthy();
      else expect(e.imageQuery, id).toBeTruthy();
    }
  });
  it('figuren.json (Runde 10 / P1): genau ein Eintrag je Unit, keine doppelte (name, form), Manifest stimmt damit ueberein', () => {
    const fig = loadFiguren(new URL('../../docs/aa-import/figuren.json', import.meta.url).pathname);
    const cross = read('../data/units/crossover.json').units.map((u: any) => u.id);
    expect(checkFiguren(fig, aa.units.map((u: any) => u.id), cross)).toEqual([]);
    expect(fig.length).toBe(575);
    const m = read('../../client/public/aa/manifest.json');
    for (const f of fig) {
      expect(m.units[f.id].name, f.id).toBe(f.name);
      expect(m.units[f.id].series, f.id).toBe(f.series);
      expect(m.units[f.id].form, f.id).toBe(f.form);
    }
    // Der Pruefer schlaegt wirklich an
    const dup = [...fig, { ...fig[0], id: 'zz_dup' }];
    expect(checkFiguren(dup, aa.units.map((u: any) => u.id), cross).length).toBeGreaterThan(0);
    expect(checkFiguren(fig.slice(1), aa.units.map((u: any) => u.id), cross)).toEqual([`fehlt: ${fig[0].id}`]);
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

  it('Kits (Runde 9 / P1): unter 10 eingeschraenkte Units, hoechstens 3 ausgeblendet; die 11 AA-Beschwoerungen stehen als Wesen im Katalog', () => {
    const by = { full: 0, limited: 0, hidden: 0 } as Record<string, number>;
    for (const u of aa.units) by[u.support]++;
    expect(by.limited).toBeLessThan(10);
    expect(by.hidden).toBeLessThanOrEqual(3);
    const src = read('../../docs/anime-adventures/data/units.json');
    for (const sm of src.units.filter((u: any) => u.kind === 'summon')) expect(aa.summons[sm.id], sm.id).toBeDefined();
    expect(Object.keys(aa.summons).length).toBeGreaterThanOrEqual(11);
  });
  it('Kits: Fähigkeiten stehen in den kompilierten Units, Knopf-Fähigkeiten haben Namen und Abklingzeit', () => {
    const withAbility = data.units.units.filter((u) => (u.abilities?.length ?? 0) > 0);
    expect(withAbility.length).toBeGreaterThanOrEqual(25);
    for (const u of withAbility) for (const a of u.abilities ?? []) expect(a.cooldown, `${u.id}:${a.id}`).toBeGreaterThan(0);
    const armin = data.units.units.find((u) => u.id === 'armin')!;
    expect(armin.support).toBe('full'); // vorher ausgeblendet: nur Aktiv-Faehigkeit
    expect(data.units.units.find((u) => u.id === 'griffith_reincarnation')?.aura?.[0].damagePct).toBe(100);
  });
  it('Zweitangriffe: Units mit mehreren AA-Angriffen fuehren sie im Wechsel (also), Rokuhira "+ Scatter", "+ Kaminari"', () => {
    const roku = data.units.units.find((u) => u.id === 'rokuhira')!;
    expect(roku.levels[3].also).toEqual(['rokuhira:one']);
    expect(roku.levels[6].also).toEqual(['rokuhira:one', 'rokuhira:two']);
  });
  it('Rauchtest: Bot-Lauf mit Beschwoerer, Aura- und Fähigkeits-Units laeuft ohne Absturz', () => {
    for (const unit of ['erwin', 'lucy_evolved', 'eren', 'griffith_reincarnation']) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 4, bots: [`mono-${unit}`], maxTicks: 6000 });
      expect(r.hash, unit).toMatch(/^[0-9a-f]{16}$/);
    }
  });
});
