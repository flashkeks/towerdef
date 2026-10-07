/** Runde 7 / P6: sechs neue Units im Client (Texte, Symbole, Werte-Anzeige, Atlas, Team-Wahl mit 14 Units). */
import atlasJson from '../assets/atlas/atlas.json';
import { describe, expect, it } from 'vitest';
import { hasKey } from '../src/i18n/t';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import { unitTags } from '../src/view/readability';
import { reachMilli, statValues, upgradeEffect } from '../src/view/unit-info';
import { unitColor } from '../src/view/model';

const data = loadBrowserData();
const defs = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
const def = (id: string) => defs.find((d) => d.id === id)!;
const NEW = ['warden', 'mortar', 'broker', 'stormcaller', 'seer', 'weaver'];

describe('Sechs neue Units', () => {
  it('jede Unit des Katalogs hat Name, Kuerzel, Kurztext und Rolle in en.ts, eine eigene Farbe und ein Atlas-Bild', () => {
    const atlas = atlasJson as { frames: Record<string, unknown> };
    expect(defs).toHaveLength(14);
    for (const d of defs) {
      for (const k of ['name', 'abbr']) expect(hasKey(`unit.${d.id}.${k}`), `${d.id} ${k}`).toBe(true);
      expect(hasKey(`team.info.${d.id}`), `${d.id} info`).toBe(true);
      expect(hasKey(`role.${d.id}`), `${d.id} role`).toBe(true);
      expect(atlas.frames, d.id).toHaveProperty([`units/${d.id}`]);
    }
    expect(new Set(defs.map((d) => unitColor(d.id))).size).toBe(14);
  });

  it('Symbole aus den Daten', () => {
    expect(unitTags(def('mortar'))).toEqual(expect.arrayContaining(['area', 'air']));
    expect(unitTags(def('stormcaller'))).toEqual(expect.arrayContaining(['area', 'air']));
    expect(unitTags(def('warden'))).toEqual(['support']);
    expect(unitTags(def('weaver'))).toEqual(['support']);
    expect(unitTags(def('broker'))).toEqual(['income']);
    expect(unitTags(def('seer'))).toEqual(expect.arrayContaining(['boss', 'support']));
  });

  it('Werte-Anzeige und Reichweite der Support-Units, Upgrade-Wirkung zeigt Aenderungen', () => {
    expect(statValues(def('warden'), 0)).toEqual([{ key: 'stat.guard', value: '1' }]);
    expect(statValues(def('broker'), 0)[0]).toEqual({ key: 'stat.bounty', value: '+20%' });
    expect(statValues(def('weaver'), 0)[0]).toEqual({ key: 'stat.slow', value: '-20%' });
    expect(statValues(def('seer'), 0).some((r) => r.key === 'stat.window')).toBe(true);
    expect(reachMilli(def('weaver'), 0)).toBe(3500);
    expect(reachMilli(def('broker'), 0)).toBe(4000);
    for (const id of NEW) expect(upgradeEffect(def(id), id === 'warden' ? 1 : 0).length, id).toBeGreaterThan(0); // Warden: Stufe 0 -> 1 bleibt bei 1 Ladung
  });

});
