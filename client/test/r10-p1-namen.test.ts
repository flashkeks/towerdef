/** Runde 10 / P1: echte Namen und Serien in der UI, keine AA-Parodienamen mehr sichtbar. */
import { describe, expect, it } from 'vitest';
import { UNIT_CATALOG } from '../../meta/src';
import { unitName, unitSeries } from '../src/ui/meta-model';
import { unitMeta } from '../src/ui/unit-card';
import { unitDefs } from '../src/ui/unit-defs';
import figuren from '../../docs/aa-import/figuren.json';

describe('Namen und Serien (Runde 10 / P1)', () => {
  it('unitName/unitSeries liefern den echten Namen (Form in Klammern) und die Serie', () => {
    expect(unitName('kakashi')).toBe('Kakashi Hatake');
    expect(unitSeries('kakashi')).toBe('Naruto');
    expect(unitName('goku_ssb')).toBe('Son Goku (Super Saiyan Blue)');
    expect(unitSeries('goku_ssb')).toBe('Dragon Ball');
    expect(unitName('p_trump')).toBe('Donald Trump');
    expect(unitSeries('p_trump')).toBe('Legends of Earth');
    expect(unitMeta('kakashi').series).toBe('Naruto');
    expect(unitSeries('no_such_unit')).toBe('');
  });
  it('jede Unit hat eine Serie; kein sichtbarer Name ist ein AA-Parodiename (Copy Ninja, Joykid, Carrot (Super III))', () => {
    const real = new Set(figuren.figuren.map((f) => f.name.toLowerCase()));
    const shown = new Set<string>();
    for (const d of unitDefs().values()) {
      expect(unitSeries(d.id), d.id).toBeTruthy();
      shown.add(unitName(d.id).toLowerCase());
    }
    for (const u of UNIT_CATALOG) {
      expect(u.series, u.id).toBeTruthy();
      expect(shown.has(u.name.toLowerCase()), u.id).toBe(true);
    }
    for (const f of figuren.figuren) {
      const a = f.aaName.toLowerCase();
      if (a === f.name.toLowerCase() || real.has(a) || a.startsWith(f.name.toLowerCase())) continue;
      expect(shown.has(a), `${f.id}: ${f.aaName}`).toBe(false);
    }
    for (const n of ['copy ninja', 'joykid', 'carrot (super iii)']) expect(shown.has(n), n).toBe(false);
  });
});
