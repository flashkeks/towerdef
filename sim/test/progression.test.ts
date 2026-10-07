import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/index.js';
import { ProgressionSchema } from '../src/data/schema.js';
import { loadGameData, loadProgression } from '../src/data/load.js';
import { createSim, damageBpFor, metaProfileLevels, metaProfileMods, starsForCopies, unitModFor } from '../src/index.js';
import { parseReplay, replay, REPLAY_FORMAT_VERSION } from '../scripts/replay.js';

const prog = loadProgression();
const data = loadGameData();
const ids = data.units.units.map((u) => u.id);

describe('Progression (Level-/Sterne-Kurven als Daten)', () => {
  it('Datei laedt, Schema prueft Laenge, Neutralitaet und Monotonie', () => {
    expect(prog.maxLevel).toBe(40);
    expect(() => ProgressionSchema.parse({ ...prog, starDamageBp: [100, 500, 1000, 1500, 2000] })).toThrow();
    expect(() => ProgressionSchema.parse({ ...prog, starCopies: [1, 2, 2, 8, 16] })).toThrow();
    expect(() => ProgressionSchema.parse({ ...prog, starDamageBp: [0, 500] })).toThrow();
  });
  it('Faktoren: Level 1/Stern 1 = x1, Level 40 = 1,975, max = 2,175, Faktor max/fresh <= 2,5', () => {
    expect(damageBpFor(prog, 1, 1)).toBe(10000);
    expect(damageBpFor(prog, 40, 1)).toBe(19750);
    expect(damageBpFor(prog, 40, 5)).toBe(21750);
    expect(damageBpFor(prog, 40, 5) / damageBpFor(prog, 1, 1)).toBeLessThanOrEqual(2.5);
    for (let l = 2; l <= 40; l++) expect(damageBpFor(prog, l, 1)).toBeGreaterThan(damageBpFor(prog, l - 1, 1));
  });
  it('Begrenzung und Sterne aus Kopien', () => {
    expect(damageBpFor(prog, 0, 0)).toBe(10000);
    expect(damageBpFor(prog, 500, 500)).toBe(21750);
    expect(starsForCopies(prog, 1)).toBe(1);
    expect(starsForCopies(prog, 16)).toBe(5);
  });
  it('Meta-Profile: fresh neutral, mid 20/3, max 40/5, fuer jede Unit und jeden Spieler', () => {
    expect(metaProfileLevels(prog, 'mid')).toEqual({ level: 20, stars: 3 });
    const m = metaProfileMods(prog, 'max', ids, 2);
    expect(m).toHaveLength(ids.length * 2);
    expect(m.every((x) => x.lvlBp === 21750)).toBe(true);
    expect(metaProfileMods(prog, 'fresh', ids, 1).every((x) => x.lvlBp === 10000)).toBe(true);
  });
  it('fresh (neutrale Mods) = ohne Mods: gleicher Hash; max aendert den Lauf', () => {
    const args = { stage: 'standard20', difficulty: 'normal' as const, players: 1, seed: 3, bots: ['wide'], maxTicks: 6000 };
    const none = runMatch(args);
    const fresh = runMatch({ ...args, unitMods: metaProfileMods(prog, 'fresh', ids, 1) });
    const max = runMatch({ ...args, unitMods: metaProfileMods(prog, 'max', ids, 1) });
    expect(fresh.hash).toBe(none.hash);
    expect(max.hash).not.toBe(none.hash);
    expect(max.damageByPlayer[0]).toBeGreaterThan(none.damageByPlayer[0]);
  });
  it('Mod wirkt auf die platzierte Unit (lvlBp), andere Units bleiben neutral', () => {
    const groundIds = data.units.units.filter((u) => !u.farm && u.placement !== 'hill').map((u) => u.id);
    const [a, b] = [groundIds[0], groundIds[1]];
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, unitMods: [unitModFor(prog, 0, a, 40, 5)] });
    const slots = sim.slotCenters().filter((s) => s.kind === 'ground' && s.size === 1);
    expect(sim.apply(0, { type: 'place', unitId: a, x: slots[0].x, y: slots[0].y }).ok).toBe(true);
    expect(sim.apply(0, { type: 'place', unitId: b, x: slots[1].x, y: slots[1].y }).ok).toBe(true);
    expect(sim.state.units.map((u) => u.lvlBp)).toEqual([21750, 10000]);
  });
});

describe('Replay v3 (Mods im Kopf)', () => {
  const dir = new URL('../../docs/balancing/playtests/', import.meta.url).pathname;
  const f = readdirSync(dir).find((x) => /^beispiel-v3-.*\.json$/.test(x));
  it('Format ist v3, Beispiel mit Mods liegt da', () => {
    expect(REPLAY_FORMAT_VERSION).toBe(3);
    expect(f).toBeDefined();
  });
  if (f) {
    const file = parseReplay(readFileSync(join(dir, f), 'utf8'));
    it('v3 mit Mods ist bit-genau nachspielbar', () => {
      expect(file.formatVersion).toBe(3);
      expect(file.unitMods?.length).toBeGreaterThan(0);
      const rep = replay(file);
      expect(rep.problems).toEqual([]);
      expect(rep.hash).toBe(file.endHash);
    });
    it('ohne Mods anderer Hash (Mods aendern das Ergebnis)', () => {
      const bare = { ...structuredClone(file), unitMods: [] };
      const rep = replay(bare);
      expect(rep.hash).not.toBe(file.endHash);
      expect(rep.ok).toBe(false);
    });
    it('v2 bleibt lesbar: gleiche Datei ohne unitMods als v2 = neutral', () => {
      const v2 = { ...structuredClone(file), formatVersion: 2 as number };
      delete v2.unitMods;
      expect(() => replay(v2)).not.toThrow();
    });
  }
});
