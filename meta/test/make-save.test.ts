/**
 * Werkzeug, kein Test: erzeugt einen Speicherstand-Export mit geschafften Acts fuer Screenshots und Handtests.
 * `SAVE_OUT=/pfad/save.json [SAVE_WORLDS=9] npx vitest run test/make-save.test.ts` (ohne SAVE_OUT uebersprungen).
 * Import danach ueber Einstellungen -> Import. `SAVE_WORLDS` = Zahl der Welten, deren 6 Acts als geschafft eingetragen werden (Standard: alle).
 * Runde 9 / P3: `SAVE_P3=1` legt zusaetzlich Raid-Marken, Material und etwas Fortschritt in Legend Stages und Raids an (Screenshots, Handtests).
 */
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { KIND, WORLDS, book, exportProfile, newProfile, testEnv } from '../src';

it.skipIf(!process.env.SAVE_OUT)('Speicherstand mit geschafften Acts schreiben', () => {
  const env = testEnv(7);
  let p = newProfile(env);
  const n = process.env.SAVE_WORLDS ? Number(process.env.SAVE_WORLDS) : WORLDS.length;
  for (const w of WORLDS.slice(0, n)) {
    for (const a of w.acts) p.stages[a.stageId] = { normal: { clears: 1, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: a.waves } };
  }
  if (process.env.SAVE_P3) {
    const done = (bestWave: number) => ({ normal: { clears: 2, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave } });
    for (const [currency, delta] of [['crystals', 1200], ['gold', 6000]] as const) {
      const b = book(p, { currency, delta, kind: KIND.grant, refType: 'test', refId: `save-${currency}` }, env);
      if (!b.ok) throw new Error(b.message);
      p = b.profile;
    }
    p.inventory = { raidMarks: 340, materials: { disc_fragment: 12, commandment_sigil: 9, ninja_scroll: 14, crystallite: 15, quirk_shard: 6, worthy_soul: 4 } };
    p.stages['legend-space-center-1'] = done(20);
    p.stages['legend-space-center-2'] = done(20);
    p.stages['legend-spirit-invasion-1'] = done(20);
    p.stages['raid-sacred-planet-1'] = done(20);
    p.stages['raid-sacred-planet-2'] = done(20);
    p.stages['raid-sand-village-midnight-attack'] = { normal: { clears: 9, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: 20 } };
    p.stages['raid-ant-kingdom-midnight'] = { normal: { clears: 4, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: 20 } };
  }
  writeFileSync(process.env.SAVE_OUT!, exportProfile(p, env));
  expect(Object.keys(p.stages).length).toBe(Math.min(n, WORLDS.length) * 6 + (process.env.SAVE_P3 ? 7 : 0));
});
