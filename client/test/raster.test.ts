import { describe, expect, it } from 'vitest';
import { compose, flipX, outline, recolor, toRGBA } from '../src/pixel/raster';
import { PAL, PAL_NAMES } from '../src/pixel/palette';

describe('pixel raster', () => {
  it('Palette hat genau 32 Farben, alle verschieden', () => {
    expect(PAL_NAMES.length).toBe(32);
    expect(new Set(Object.values(PAL)).size).toBe(32);
  });
  it('compose legt Teile uebereinander, Punkt ist durchsichtig', () => {
    const r = compose(3, 2, [{ rows: ['aaa', 'aaa'] }, { rows: ['.b'], dx: 1, dy: 1 }]);
    expect(r).toEqual(['aaa', 'aab']);
  });
  it('outline umrandet sichtbare Pixel', () => {
    expect(outline(['...', '.a.', '...'])).toEqual(['.#.', '#a#', '.#.']);
  });
  it('flipX und recolor', () => {
    expect(flipX(['ab.'])).toEqual(['.ba']);
    expect(recolor(['ab'], { a: 'c' })).toEqual(['cb']);
  });
  it('toRGBA wirft bei unbekanntem Zeichen', () => {
    expect(() => toRGBA(['z'], {})).toThrow();
    const { data } = toRGBA(['a'], { a: 'red' });
    expect([...data]).toEqual([0xe4, 0x3b, 0x44, 255]);
  });
});
