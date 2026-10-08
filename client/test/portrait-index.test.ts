/** Portrait-Index (Runde 8, P4 x P2): tolerantes Lesen von /aa/index.json, Manifest-Pruefung. */
import { describe, expect, it } from 'vitest';
import { parseIndex, portraitKnown } from '../src/view/portrait';

describe('Portrait-Index', () => {
  it('Array, { units: [] }, Objekt und Pfade werden zu IDs', () => {
    expect([...parseIndex(['a', 'b'])]).toEqual(['a', 'b']);
    expect([...parseIndex({ units: ['x.webp', '/aa/units/y.webp'] })]).toEqual(['x', 'y']);
    expect([...parseIndex({ units: { p: 1, q: 2 } })]).toEqual(['p', 'q']);
    expect(parseIndex(null).size).toBe(0);
    expect(parseIndex(42).size).toBe(0);
  });
  it('ohne Manifest-Eintrag sicher kein Bild, mit Eintrag unbekannt (Ladeversuch)', () => {
    expect(portraitKnown('keine_solche_unit')).toBe(false);
    expect(portraitKnown('rokuhira')).toBeNull();
  });
});
