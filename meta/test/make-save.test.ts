/**
 * Werkzeug, kein Test: erzeugt einen Speicherstand-Export mit geschafften Acts fuer Screenshots und Handtests.
 * `SAVE_OUT=/pfad/save.json [SAVE_WORLDS=9] npx vitest run test/make-save.test.ts` (ohne SAVE_OUT uebersprungen).
 * Import danach ueber Einstellungen -> Import. `SAVE_WORLDS` = Zahl der Welten, deren 6 Acts als geschafft eingetragen werden (Standard: alle).
 */
import { writeFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { WORLDS, exportProfile, newProfile, testEnv } from '../src';

it.skipIf(!process.env.SAVE_OUT)('Speicherstand mit geschafften Acts schreiben', () => {
  const env = testEnv(7);
  const p = newProfile(env);
  const n = process.env.SAVE_WORLDS ? Number(process.env.SAVE_WORLDS) : WORLDS.length;
  for (const w of WORLDS.slice(0, n)) {
    for (const a of w.acts) p.stages[a.stageId] = { normal: { clears: 1, firstClearAt: '2026-10-08T00:00:00.000Z', bestWave: a.waves } };
  }
  writeFileSync(process.env.SAVE_OUT!, exportProfile(p, env));
  expect(Object.keys(p.stages).length).toBe(Math.min(n, WORLDS.length) * 6);
});
