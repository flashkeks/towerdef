/** Runde 16 TP: Pixel-Figuren von Bram und Sela, eigene Geschosse und Faehigkeits-Icons, Cache-Schluessel mit Held. */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { HERO_ICONS } from '../src/pixel/sprites/icons-heroes';
import { heroRaster, HERO_FRAMES, heroStage } from '../src/pixel/sprites/hero';
import { iconAbilityRaster } from '../src/pixel/sprites/icons';
import { projectileRaster } from '../src/pixel/sprites/projectiles';
import { rowsToRGBA } from '../src/pixel/sprites/canvas';
import { PROJECTILE_KINDS, type HeroType } from '../src/pixel/sprites/types';
import { projectileLook } from '../src/match/r13';

const sig = (rows: string[]): string => rows.join('/');
const LV = [1, 5, 10, 15, 20];
const NEW: HeroType[] = ['bram', 'sela'];

describe('Helden Bram und Sela: Raster', () => {
  it('jede Stufe und jeder Frame liefert ein gueltiges, nicht leeres Raster in allen Richtungen', () => {
    for (const hero of NEW) for (const l of LV) for (const f of HERO_FRAMES) for (const d of [0, 2, 3, 6, 7]) {
      const r = heroRaster(hero, l, d, f);
      expect(() => rowsToRGBA(r.rows), `${hero} L${l} ${f} ${d}`).not.toThrow();
      expect(r.rows.join('').replace(/\./g, '').length).toBeGreaterThan(80);
    }
  });
  it('fuenf sichtbare Stufen sehen verschieden aus, Level innerhalb einer Stufe gleich', () => {
    for (const hero of NEW) {
      expect(new Set(LV.map((l) => sig(heroRaster(hero, l, 0, 'idle0').rows))).size, hero).toBe(5);
      expect(sig(heroRaster(hero, 1, 0, 'idle0').rows)).toBe(sig(heroRaster(hero, heroStage(4) === 0 ? 4 : 1, 0, 'idle0').rows));
    }
  });
  it('Bram, Sela und Wren unterscheiden sich auf jeder Stufe', () => {
    for (const l of LV) {
      const s = ['wren', 'bram', 'sela'].map((h) => sig(heroRaster(h as HeroType, l, 0, 'idle0').rows));
      expect(new Set(s).size).toBe(3);
    }
  });
  it('Frames: Idle, Angriff und Cast verschieden, Cast hebt die Waffe hoch (Bild reicht weiter nach oben)', () => {
    const top = (rows: string[]): number => rows.findIndex((r) => /[^.]/.test(r));
    for (const hero of NEW) {
      expect(new Set(HERO_FRAMES.map((f) => sig(heroRaster(hero, 12, 0, f).rows))).size, hero).toBeGreaterThanOrEqual(8);
      expect(top(heroRaster(hero, 12, 0, 'cast1').rows)).toBeLessThan(top(heroRaster(hero, 12, 0, 'idle0').rows));
    }
  });
  it('Muendung/Hammerkopf ist je Held ein eigener Punkt, im Bild und ueber dem Boden', () => {
    for (const hero of NEW) {
      const r = heroRaster(hero, 20, 0, 'idle0');
      expect(r.my).toBeLessThan(-8);
      expect(Math.abs(r.mx)).toBeLessThan(40);
    }
  });
});

describe('Geschosse und Icons Runde 16', () => {
  it('hammer und starlight sind echte ProjectileKinds und haben Bilder (starlight in 16 Richtungen verschieden, hammer dreht)', () => {
    expect(PROJECTILE_KINDS).toContain('hammer');
    expect(PROJECTILE_KINDS).toContain('starlight');
    expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster('starlight', d).rows))).size).toBe(16);
    expect(new Set(Array.from({ length: 16 }, (_, d) => sig(projectileRaster('hammer', 0, d).rows))).size).toBeGreaterThanOrEqual(12);
  });
  it('projectileLook nimmt hammer/starlight nicht mehr auf Platzhalter', () => {
    expect(projectileLook('hammer', { type: 'bram', tiers: [0, 0, 0] })).toBe('hammer');
    expect(projectileLook('starlight', { type: 'sela', tiers: [0, 0, 0] })).toBe('starlight');
  });
  it('vier eigene Faehigkeits-Icons, alle verschieden und nicht die Vorbilder', () => {
    const own = ['anvilDrop', 'forgeOfDawn', 'starfall', 'eclipse'] as const;
    const rows = own.map((a) => sig(iconAbilityRaster(a).rows));
    expect(new Set(rows).size).toBe(4);
    for (const a of own) {
      expect(HERO_ICONS[a]).toBeTypeOf('function');
      for (const o of ['flare', 'dawnbreak', 'absoluteZero', 'focus', 'arrowRain'] as const) expect(sig(iconAbilityRaster(a).rows)).not.toBe(sig(iconAbilityRaster(o).rows));
    }
  });
});

describe('Sprite-API mit Held', () => {
  const made: unknown[] = [];
  beforeAll(() => {
    vi.stubGlobal('document', { createElement: () => { const c = { width: 0, height: 0, getContext: () => ({ putImageData: () => undefined }) }; made.push(c); return c; } });
    vi.stubGlobal('ImageData', class { constructor(public data: Uint8ClampedArray, public width: number, public height: number) {} });
  });
  afterAll(() => { vi.unstubAllGlobals(); });
  it('Cache-Schluessel enthaelt den Helden: Bram, Sela und Wren sind drei verschiedene Sprites, derselbe Aufruf gibt dasselbe zurueck', async () => {
    const api = await import('../src/pixel/sprites/index');
    const a = api.heroSprite('bram', 5, 0, 'idle0'), b = api.heroSprite('sela', 5, 0, 'idle0'), w = api.heroSprite('wren', 5, 0, 'idle0');
    expect(a).not.toBe(b); expect(a).not.toBe(w); expect(b).not.toBe(w);
    expect(api.heroSprite('bram', 7, 0, 'idle0')).toBe(a); // gleiche Stufe
    expect(api.heroSprite('bram', 5, 0, 'idle0')).toBe(a);
    const p = ['wren', 'bram', 'sela'].map((h) => api.heroPortrait(h as HeroType));
    expect(new Set(p).size).toBe(3);
    expect(api.heroPortrait()).toBe(p[0]);
    expect(api.heroMuzzle('bram', 20, 0)).not.toEqual(api.heroMuzzle('sela', 20, 0));
  });
});
