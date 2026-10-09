import { describe, expect, it, vi } from 'vitest';

import { MAP_IDS, PREVIEW_H, PREVIEW_W, composeMap, mapArt, mapPreview } from '../src/pixel/map/maps';
import { PAL_NAMES } from '../src/pixel/palette';

vi.setConfig({ testTimeout: 60000 });

describe('Kartenwahl ueber die ID', () => {
  it('drei Karten, jede mit gemeinsamer Form', () => {
    expect(MAP_IDS).toEqual(['meadow', 'frostfen', 'quarry']);
    for (const id of MAP_IDS) {
      const a = mapArt(id);
      expect(a.id).toBe(id);
      expect(a.name.length).toBeGreaterThan(3);
      expect(a.ground.w).toBe(640);
      expect(a.anim.length).toBeGreaterThan(0);
      expect(a.animMs).toBeGreaterThan(0);
      expect(a.props.length).toBeGreaterThan(10);
      expect(mapArt(id)).toBe(a); // gecacht
    }
  });

  it('Vorschaubilder 160 x 90, nur Palette, deutlich verschieden', () => {
    const imgs = MAP_IDS.map((id) => mapPreview(id));
    for (const p of imgs) {
      expect(p.w).toBe(PREVIEW_W);
      expect(p.h).toBe(PREVIEW_H);
      expect(p.d.every((c) => c >= 1 && c <= PAL_NAMES.length)).toBe(true);
    }
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      let diff = 0;
      for (let k = 0; k < imgs[i].d.length; k++) if (imgs[i].d[k] !== imgs[j].d[k]) diff++;
      expect(diff / imgs[i].d.length).toBeGreaterThan(0.5);
    }
  });

  it('composeMap setzt Boden, Ebene, Deko und Dinge zusammen (kein durchsichtiges Pixel)', () => {
    for (const id of MAP_IDS) expect(composeMap(id, 2).d.every((c) => c > 0)).toBe(true);
  });
});
