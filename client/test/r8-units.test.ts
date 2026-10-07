/** Runde 8 / P1: Units sind reine Daten. Der Client zeigt jede Unit aus `sim/data/units/*.json` ohne Code, ohne Sprite, ohne Text. */
import { describe, expect, it } from 'vitest';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import { initials, registerUnitColors, unitColor } from '../src/view/model';
import { hitStyle } from '../src/view/feel';
import { unitName, unitAbbr, roleCat } from '../src/ui/meta-model';
import { unitTags } from '../src/view/readability';
import { attackEffects, attackForm, reachMilli, statValues, upgradeEffect } from '../src/view/unit-info';

const data = loadBrowserData();
const defs = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
registerUnitColors(defs);
const def = (id: string) => defs.find((d) => d.id === id)!;

describe('Units aus den Datendateien', () => {
  it('der Browser-Lader sieht alle Dateien in sim/data/units (mindestens das Beispiel-Set)', () => {
    expect(defs.length).toBeGreaterThanOrEqual(20);
    expect(defs.map((d) => d.id)).toEqual(expect.arrayContaining(['rokuhira', 'stain', 'goku_ssj3', 'speedwagon']));
  });
  it('Name kommt aus den Daten, Kuerzel sind Initialen, jede Unit hat eine Farbe (Element), unbekannte IDs eine stabile', () => {
    expect(unitName('rokuhira')).toBe('Vengeful Swordsman');
    expect(unitAbbr('rokuhira')).toBe('VS');
    expect(initials('Krillin')).toBe('KR');
    expect(unitColor('stain')).toBe(unitColor('stain'));
    expect(unitColor('no_such_unit')).toBe(unitColor('no_such_unit'));
    expect(unitColor('no_such_unit')).not.toBe(unitColor('another_unit'));
    expect(new Set(defs.map((d) => unitColor(d.id))).size).toBeGreaterThan(4);
  });
  it('Werte-Anzeige jeder Unit auf jeder Stufe: Zeilen vorhanden, Upgrade-Wirkung nur mit echten Aenderungen (ausgeblendete Units ausgenommen)', () => {
    const hidden = new Set(data.units.units.filter((u) => u.support === 'hidden' || u.supportNotes?.includes('partial-levels')).map((u) => u.id));
    for (const d of defs.filter((x) => !hidden.has(x.id))) {
      for (let k = 0; k <= d.maxLevel; k++) {
        const rows = statValues(d, k);
        expect(rows.length, `${d.id} L${k}`).toBeGreaterThan(0);
      }
      for (let k = 0; k < d.maxLevel; k++) for (const r of upgradeEffect(d, k)) expect(r.from, `${d.id} L${k} ${r.key}`).not.toBe(r.to);
      expect(upgradeEffect(d, d.maxLevel)).toEqual([]);
    }
  });
  it('Form, Treffer und Effekte stehen in der Anzeige (Rokuhira wechselt den Angriff je Stufe)', () => {
    const rok = def('rokuhira');
    expect(attackForm(rok.levels[0])).toMatch(/^Circle \d/);
    expect(rok.levels[0].attack?.id).toBe('rokuhira:one');
    expect(rok.levels[8].attack?.id).toBe('rokuhira:three'); // Angriff wechselt je Stufe
    expect(attackForm(def('ichigo').levels[0])).toBe('Single target');
    const stain = def('stain');
    expect(attackForm(stain.levels[0])).toMatch(/^Circle \d/);
    expect(attackEffects(stain.levels[0])).toEqual(['Bleed']);
    expect(statValues(stain, 0).map((r) => r.key)).toEqual(expect.arrayContaining(['stat.damage', 'stat.cooldown', 'stat.range', 'stat.form', 'stat.effects']));
    const goku = def('goku_ssj3');
    expect(statValues(goku, 0).find((r) => r.key === 'stat.hits')?.value).toBe('3');
    expect(reachMilli(def('speedwagon'), 0)).toBe(0);
    expect(statValues(def('speedwagon'), 0)[0].key).toBe('stat.yield');
  });
  it('Angriffsstil je Stufe aus den Daten: Kreis = blast, Kegel = cone, Linie = line, Voll = full, Farm = keiner', () => {
    expect(hitStyle(def('stain'))).toBe('blast');
    expect(hitStyle(def('speedwagon'))).toBeNull();
    const forms = new Set(defs.flatMap((d) => d.levels.map((_, k) => hitStyle(d, k))));
    for (const s of ['blast', 'cone', 'line', 'full'] as const) expect(forms.has(s), s).toBe(true);
  });
  it('Rolle und Symbole aus den Daten', () => {
    expect(roleCat(def('speedwagon'))).toBe('economy');
    expect(roleCat(def('tatsumaki_evolved'))).toBe('control'); // Knockback
    expect(roleCat(def('stain'))).toBe('area');
    expect(roleCat(def('ichigo'))).toBe('single');
    expect(unitTags(def('speedwagon'))).toEqual(['income']);
  });
});
