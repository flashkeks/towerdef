/**
 * Runde 16 (Paket T): Platzhalter-Look im Client. Riverkeeper, Bellringer, Tinker und die Helden Bram/Sela sind in Sim und Meta fertig;
 * hier steht nur, dass sie auf vorhandene Figuren/Icons abgebildet werden und nichts bricht. Echte Pixel-Art und UI: Paket TP.
 */
import { describe, expect, it } from 'vitest';
import { iconAbilityRaster } from '../src/pixel/sprites/icons';
import { towerRaster } from '../src/pixel/sprites/towers';
import { iconUpgradeRaster } from '../src/pixel/sprites/icons';
import { ABILITY_LOOK, baseLook, type AbilityId } from '../src/pixel/sprites/types';
import { projectileLook } from '../src/match/r13';
import { ABILITY_TEXT, HERO_KEY, HOTKEY, ROLE } from '../src/match/tower-text';
import { isHero, displayName, footMilli } from '../src/match/info';
import { DATA, createGame, type TowerType } from '../src/sim';

const NEW: TowerType[] = ['riverkeeper', 'bellringer', 'tinker'];

describe('Platzhalter-Look Runde 16', () => {
  it('neue Tuerme zeichnen wie ein vorhandener Turm (Riverkeeper = Longshot, Bellringer = Market, Tinker = Bombardier)', () => {
    expect(NEW.map(baseLook)).toEqual(['longshot', 'market', 'bombardier']);
    for (const t of NEW) {
      const a = towerRaster(t, [0, 0, 0], 0, 'idle0');
      const b = towerRaster(baseLook(t), [0, 0, 0], 0, 'idle0');
      expect(a.rows).toEqual(b.rows);
      const i = iconUpgradeRaster(t, 0, 1);
      expect(i.rows.length).toBeGreaterThan(0);
    }
  });

  it('Faehigkeits-Icons der neuen Faehigkeiten existieren (Vorbild-Icons)', () => {
    for (const id of ['alarm', 'overclock', 'anvilDrop', 'forgeOfDawn', 'starfall', 'eclipse'] as AbilityId[]) {
      expect(iconAbilityRaster(id).rows.length, id).toBeGreaterThan(0);
      expect(ABILITY_LOOK[id]).not.toBe(id);
      expect(ABILITY_TEXT[id].name.length, id).toBeGreaterThan(2);
    }
  });

  it('neue Geschosse haben ein Bild', () => {
    for (const k of ['harpoon', 'cannonball', 'nail', 'hammer', 'starlight'] as const) {
      expect(projectileLook(k, { type: 'riverkeeper', tiers: [0, 0, 0] })).toBeTypeOf('string');
    }
    expect(projectileLook('harpoon', undefined)).toBe('bolt');
    expect(projectileLook('nail', undefined)).toBe('arrow');
  });

  it('Texte und Hotkeys fuer neue Tuerme und Helden', () => {
    for (const t of [...NEW, 'bram', 'sela'] as const) {
      expect(ROLE[t].length).toBeGreaterThan(5);
      expect(HOTKEY[t]).toMatch(/^[A-Z]$/);
    }
    expect(HERO_KEY).toBe('R');
    expect(new Set(Object.values(HOTKEY)).size).toBe(Object.keys(HOTKEY).length);
  });

  it('isHero/displayName/footMilli kennen Bram und Sela', () => {
    expect(isHero('bram')).toBe(true);
    expect(isHero('sela')).toBe(true);
    expect(isHero('tinker')).toBe(false);
    expect(displayName('bram')).toBe(DATA.hero.bram.name);
    expect(footMilli('sela')).toBe(DATA.hero.sela.radius * 1000);
    expect(footMilli('riverkeeper')).toBe(DATA.towers.riverkeeper.radius * 1000);
  });

  it('Match-Start: createGame mit hero setzt den Helden der Partie', () => {
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1, hero: 'sela' });
    expect(g.info.hero).toBe('sela');
  });
});
