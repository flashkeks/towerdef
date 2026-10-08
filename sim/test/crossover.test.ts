import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/index.js';
import { UnitFileSchema } from '../src/data/schema.js';
import { unknownEffects } from '../src/data/compile.js';
import { data } from './helpers.js';
import { bandErrors, buildVorlagen } from '../../tools/aa-import/vorlage.js';

const read = (p: string): any => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const file = read('../data/units/crossover.json');
const aa = read('../data/units/aa.json');

describe('Crossover-Figuren (Runde 8 / P6)', () => {
  it('alle 25 parsen im Unit-Schema, Flavor und Bild-Suchhinweis sind gesetzt, keine Doppelungen mit AA', () => {
    const f = UnitFileSchema.parse(file);
    expect(f.units).toHaveLength(25);
    const aaIds = new Set(aa.units.map((u: any) => u.id));
    const aaNames = new Set(aa.units.map((u: any) => String(u.name).toLowerCase()));
    for (const u of f.units) {
      expect(u.id.startsWith('x_'), u.id).toBe(true);
      expect(aaIds.has(u.id) || aaNames.has(u.name.toLowerCase()), u.id).toBe(false);
      expect(u.flavor, u.id).toBeTruthy();
      expect(u.imageQuery, u.id).toBeTruthy();
      expect(u.source).toBe('custom');
    }
    expect(unknownEffects(data)).toEqual([]);
    expect(new Set(f.units.map((u) => u.rarity))).toEqual(new Set(['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret']));
  });
  it('Werte im AA-Band P5..P95 der Seltenheit', () => {
    expect(bandErrors(file.units, buildVorlagen(aa.units))).toEqual([]);
  });
  it('die Fähigkeiten nutzen Baukasten: alle Formen, Confused (Rick), Slow-Fläche (Shrek), Hybrid-Strahl + Salve (Iron Man)', () => {
    const forms = new Set(Object.values(file.attacks).map((a: any) => a.aoe ?? 'single'));
    expect([...forms].sort()).toEqual(['circle', 'cone', 'full', 'line', 'single']);
    expect(file.attacks['x_rick:never_gonna'].special.name).toBe('Confused');
    expect(file.attacks['x_shrek:swamp'].special.name).toBe('Slow');
    expect(file.attacks['x_ironman:repulsor'].aoe).toBe('line');
    expect(file.attacks['x_ironman:salvo']).toMatchObject({ aoe: 'circle' });
    expect(file.attacks['x_ironman:salvo'].hits).toBeGreaterThan(1);
  });
  it('Stage-Rauchprobe: mono-<id> läuft je Figur 2 Waves ohne Absturz', () => {
    for (const u of file.units) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, bots: [`mono-${u.id}`], maxTicks: 2 * 900 });
      expect(r.ticks, u.id).toBeGreaterThan(0);
    }
  });
  it('Bild-Manifest: 25 Einträge mit source custom und imageQuery', () => {
    const m = read('../../client/public/aa/manifest.json');
    const x = Object.entries<any>(m.units).filter(([, e]) => e.source === 'custom');
    expect(x).toHaveLength(25);
    for (const [id, e] of x) expect(e.imageQuery && e.path === `/aa/units/${id}.webp`, id).toBeTruthy();
  });
});
