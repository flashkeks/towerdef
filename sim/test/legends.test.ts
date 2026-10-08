import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/index.js';
import { UnitFileSchema } from '../src/data/schema.js';
import { unknownEffects } from '../src/data/compile.js';
import { ctxFor, data } from './helpers.js';
import { bandErrors, buildVorlagen } from '../../tools/aa-import/vorlage.js';

const read = (p: string): any => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const file = read('../data/units/legends.json');
const aa = read('../data/units/aa.json');
const cross = read('../data/units/crossover.json');
const figuren: { id: string; aaName: string; name: string; series: string; form?: string }[] = read('../../docs/aa-import/figuren.json').figuren;

describe('Legends of Earth (Runde 10 / P1)', () => {
  it('25 Figuren parsen, Praefix p_, Flavor, Wikipedia-Titel, source legends, Serie, keine Doppelungen mit AA/Crossover', () => {
    const f = UnitFileSchema.parse(file);
    expect(f.units).toHaveLength(25);
    const others = new Set([...aa.units, ...cross.units].map((u: any) => u.id));
    const names = new Set([...aa.units, ...cross.units].map((u: any) => String(u.name).toLowerCase()));
    for (const u of f.units) {
      expect(u.id.startsWith('p_'), u.id).toBe(true);
      expect(others.has(u.id) || names.has(u.name.toLowerCase()), u.id).toBe(false);
      expect(u.flavor, u.id).toBeTruthy();
      expect(u.imageQuery, u.id).toBeTruthy();
      expect(u.source, u.id).toBe('legends');
      expect(u.series, u.id).toBe('Legends of Earth');
    }
    expect(unknownEffects(data)).toEqual([]);
  });
  it('Seltenheiten laut Tabelle: 5 Rare, 5 Epic, 7 Legendary, 5 Mythic, 3 Secret', () => {
    const n: Record<string, number> = {};
    for (const u of file.units) n[u.rarity] = (n[u.rarity] ?? 0) + 1;
    expect(n).toEqual({ Rare: 5, Epic: 5, Legendary: 7, Mythic: 5, Secret: 3 });
    for (const [id, r] of [['p_trump', 'Secret'], ['p_musk', 'Secret'], ['p_arnold', 'Secret'], ['p_rock', 'Mythic'], ['p_merkel', 'Mythic'], ['p_messi', 'Legendary'], ['p_swift', 'Epic'], ['p_irwin', 'Rare']]) {
      expect(file.units.find((u: any) => u.id === id)?.rarity, id).toBe(r);
    }
  });
  it('Werte im AA-Band P5..P95 der Seltenheit', () => {
    expect(bandErrors(file.units, buildVorlagen(aa.units))).toEqual([]);
  });
  it('Faehigkeiten nur aus Bausteinen: Trump Tariff (Slow + Muenzen), Bezos Muenzen, Arnold ruft Terminator, Napoleon buffed Nachbarn', () => {
    const u = (id: string): any => file.units.find((x: any) => x.id === id);
    expect(file.attacks['p_trump:tariff'].special.name).toBe('Slow');
    expect(u('p_trump').abilities[0]).toMatchObject({ id: 'tariff', scope: 'global', coins: 500 });
    expect(u('p_bezos').abilities[0].coins).toBeGreaterThan(0);
    expect(u('p_arnold').abilities[0].summon.id).toBe('p_terminator');
    expect(file.summons.p_terminator.blocks).toBe(true);
    expect(u('p_napoleon').abilities[0].buff).toMatchObject({ self: false });
    const compiled = ctxFor();
    for (const x of file.units) expect(compiled.units[x.id], x.id).toBeTruthy();
  });
  it('Stage-Rauchprobe: mono-<id> laeuft je Figur 2 Waves ohne Absturz', () => {
    for (const u of file.units) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: [`mono-${u.id}`], maxTicks: 2 * 900 });
      expect(r.ticks, u.id).toBeGreaterThan(0);
    }
  });
  it('Bild-Manifest: 25 Eintraege mit source custom, Serie und imageQuery', () => {
    const m = read('../../client/public/aa/manifest.json');
    const x = Object.entries<any>(m.units).filter(([id]) => id.startsWith('p_'));
    expect(x).toHaveLength(25);
    for (const [id, e] of x) expect(e.imageQuery && e.series === 'Legends of Earth' && e.source === 'custom' && e.path === `/aa/units/${id}.webp`, id).toBeTruthy();
  });
});

describe('Echte Namen statt AA-Parodienamen (Runde 10 / P1)', () => {
  it('Unit-Daten tragen name/series/form aus figuren.json; Anzeige "Name (Form)"', () => {
    const byId = new Map(figuren.map((f) => [f.id, f]));
    const defs = ctxFor().units;
    for (const u of data.units.units) {
      const f = byId.get(u.id)!;
      expect(u.name, u.id).toBe(f.name);
      expect(u.series, u.id).toBe(f.series);
      expect(defs[u.id]!.name, u.id).toBe(f.form ? `${f.name} (${f.form})` : f.name);
      expect(defs[u.id]!.series, u.id).toBe(f.series);
    }
    expect(defs['goku_ssb']!.name).toBe('Son Goku (Super Saiyan Blue)');
  });
  it('kein sichtbarer Name ist ein AA-Parodiename (Carrot, Copy Ninja, Joykid ...)', () => {
    const real = new Set(figuren.map((f) => f.name.toLowerCase()));
    const defs = Object.values(ctxFor().units);
    const shown = new Set(defs.flatMap((d) => [d.name.toLowerCase(), d.name.replace(/ \(.*\)$/, '').toLowerCase()]));
    const parodies = figuren.filter((f) => f.aaName.toLowerCase() !== f.name.toLowerCase() && !real.has(f.aaName.toLowerCase()) && !f.aaName.toLowerCase().startsWith(f.name.toLowerCase()));
    expect(parodies.length).toBeGreaterThan(200);
    for (const f of parodies) expect(shown.has(f.aaName.toLowerCase()), `${f.id}: ${f.aaName}`).toBe(false);
    for (const n of ['copy ninja', 'joykid', 'carrot (super iii)']) expect(shown.has(n), n).toBe(false);
  });
});
