/** Runde 14: Thornweaver/Alchemist freischalten, Migration, 12 neue Wissensknoten samt Mods. */
import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE, applyMatch, buyNode, isTowerUnlocked, knowledgePoints, loadProfile, matchEmbers, matchOptions, newProfile, nodeById, unlockEverything, unlockLevel, xpForLevel,
  type MatchResult, type Profile,
} from '../src/index';

const withLevel = (n: number, p: Profile = newProfile()): Profile => ({ ...p, playerXp: xpForLevel(n) });
const know = (p: Profile, ...ids: string[]): Profile => ({ ...p, knowledge: ids });
const res = (o: Partial<MatchResult> = {}): MatchResult => ({ matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400 }, ...o });
const NEW_IDS = ['investor', 'pop-bonus', 'sharper-arrows', 'fused-shells', 'icicle-edge', 'deep-roots', 'bountiful-grove', 'potent-brews', 'midas-hands', 'field-medic', 'sturdy-gate', 'ember-rush'];

describe('Freischaltung und Migration', () => {
  it('Thornweaver ab Level 7, Alchemist ab Level 9', () => {
    expect(unlockLevel('thornweaver')).toBe(7);
    expect(unlockLevel('alchemist')).toBe(9);
    expect(isTowerUnlocked(withLevel(6), 'thornweaver')).toBe(false);
    expect(isTowerUnlocked(withLevel(7), 'thornweaver')).toBe(true);
    expect(isTowerUnlocked(withLevel(8), 'alchemist')).toBe(false);
    expect(isTowerUnlocked(withLevel(9), 'alchemist')).toBe(true);
    expect(matchOptions(withLevel(9)).unlocks.towers).toContain('alchemist');
  });
  it('Profil aus Runde 13 laedt ohne Reset: Wissen, Tuerme, XP bleiben, neue Tuerme bekommen Startwerte', () => {
    const old = JSON.parse(JSON.stringify({ ...withLevel(12), embers: 5, knowledge: ['head-start', 'better-deals'] }));
    for (const k of ['towerXp', 'towerTiers']) { delete old[k].thornweaver; delete old[k].alchemist; }
    old.towerXp.longshot = 777;
    old.towerTiers.longshot = [3, 1, 0];
    const r = loadProfile(old);
    expect(r.reset).toBe(false);
    expect(r.profile.towerXp.longshot).toBe(777);
    expect(r.profile.towerXp.thornweaver).toBe(100);
    expect(r.profile.towerTiers.alchemist).toEqual([0, 0, 0]);
    expect(r.profile.knowledge).toEqual(['head-start', 'better-deals']);
  });
  it('Match-Ergebnis mit neuen Tuermen: Stufen und XP landen im Profil, nichts faellt zurueck', () => {
    const r = applyMatch(withLevel(10), res({
      towerTiers: { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [2, 1, 0], alchemist: [0, 0, 3] },
      towerXp: { ranger: 100, bombardier: 100, frostcaller: 100, longshot: 100, market: 100, thornweaver: 450, alchemist: 130 },
    }));
    expect(r.profile.towerTiers.thornweaver).toEqual([2, 1, 0]);
    expect(r.profile.towerTiers.alchemist).toEqual([0, 0, 3]);
    expect(r.profile.towerXp.thornweaver).toBe(450);
    const again = applyMatch(r.profile, res({ matchId: 'm2', towerTiers: { ranger: [0, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [1, 0, 0], alchemist: [0, 0, 0] } }));
    expect(again.profile.towerTiers.thornweaver).toEqual([2, 1, 0]); // nie niedriger
  });
  it('unlockEverything oeffnet Thornweaver und Alchemist komplett', () => {
    const p = unlockEverything(newProfile());
    expect(p.towerTiers.thornweaver).toEqual([5, 5, 5]);
    expect(matchOptions(p).unlocks.maxTier.alchemist).toEqual([5, 5, 5]);
  });
});

describe('Neue Wissensknoten', () => {
  it('12 neue Knoten mit Feldern branch/col/row/requires/cost/desc, Plaetze eindeutig', () => {
    for (const id of NEW_IDS) {
      const n = nodeById(id)!;
      expect(n, id).toBeDefined();
      expect(n.desc.length).toBeGreaterThan(10);
      expect(Number.isInteger(n.col) && Number.isInteger(n.row)).toBe(true);
    }
    expect(KNOWLEDGE.filter((n) => NEW_IDS.includes(n.id))).toHaveLength(12);
    const slots = new Set(KNOWLEDGE.map((n) => `${n.branch}:${n.col}:${n.row}`));
    expect(slots.size).toBe(KNOWLEDGE.length);
  });
  it('Mods aus den neuen Knoten', () => {
    const all = (...ids: string[]) => matchOptions(know(withLevel(40), ...ids)).mods;
    expect(all('deep-roots').rangeBp).toEqual({ thornweaver: 1000 });
    expect(all('sharp-eyes', 'deep-roots').rangeBp).toEqual({ ranger: 800, thornweaver: 1000 });
    expect(all('market-savvy', 'bulk-orders', 'investor').marketPriceBp).toBe(2000);
    expect(all('pop-bonus').popCashBp).toBe(500);
    expect(all('sharper-arrows').pierceAdd).toEqual({ ranger: 1 });
    expect(all('fused-shells').fragAdd).toEqual({ bombardier: 2 });
    expect(all('icicle-edge').icicleDmg).toBe(1);
    expect(all('bountiful-grove').bountyGold).toBe(50);
    expect(all('potent-brews').brewDurBp).toBe(2500);
    expect(all('midas-hands').leadGoldAdd).toBe(20);
    expect(all('field-medic').roundLives).toBe(1);
    expect(all('sturdy-gate').gate).toBe(1);
  });
  it('Kauf folgt Voraussetzung und Punkten; Ember Rush gibt +1 Ember je geschaffter Runde', () => {
    const p = withLevel(10);
    expect(buyNode(p, 'bountiful-grove').ok).toBe(false); // deep-roots fehlt
    const a = buyNode(p, 'deep-roots');
    expect(a.ok).toBe(true);
    expect(knowledgePoints(p).free).toBeGreaterThan(0);
    expect(matchEmbers(20, 'medium', true, false, 0, 0, true).rush).toBe(20);
    expect(matchEmbers(20, 'medium', true, false, 0, 0).rush).toBe(0);
    const base = applyMatch(withLevel(30), res());
    const rush = applyMatch(know(withLevel(30), 'ember-pouch', 'ember-rush'), res({ matchId: 'x' }));
    expect(rush.report.embers.rush).toBe(20);
    expect(rush.report.embersGained).toBe(base.report.embersGained + 20 + Math.floor((base.report.embersGained + 20) * 0.1));
  });
});
