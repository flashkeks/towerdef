/** Runde 13: Wissensbaum (Runde 14: 40 Knoten, 77 Punkte), Punkte aus Medaillen, Freischalt-Level, Migration, Store/Embers/XP-Knoten. */
import { describe, expect, it } from 'vitest';
import { createGame } from '../../sim/src/index';
import {
  BRANCHES, BRANCH_NAMES, KNOWLEDGE, LEVEL_UNLOCKS, TOWER_TYPES, applyMatch, buyNode, buyPower, isTowerUnlocked, knowledgePoints, loadProfile, matchEmbers,
  matchOptions, matchXp, newProfile, nodeById, nodeState, powerCost, powerPrice, unlockEverything, unlockLevel, xpForLevel, type MatchResult, type Profile,
} from '../src/index';

const withLevel = (n: number, p: Profile = newProfile()): Profile => ({ ...p, playerXp: xpForLevel(n) });
const know = (p: Profile, ...ids: string[]): Profile => ({ ...p, knowledge: ids });
const res = (o: Partial<MatchResult> = {}): MatchResult => ({
  matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400 }, ...o,
});

describe('Wissensbaum: Struktur', () => {
  it('46 Knoten in 5 Ästen (R13: 28/52, R14: +12/+25, R16: +6/+9), Summe 86 Punkte, Kosten 1-3, eindeutige IDs', () => {
    expect(KNOWLEDGE).toHaveLength(46);
    expect(new Set(KNOWLEDGE.map((n) => n.id)).size).toBe(46);
    expect(KNOWLEDGE.reduce((s, n) => s + n.cost, 0)).toBe(86);
    expect(BRANCHES).toEqual(['economy', 'primary', 'specialists', 'wardens', 'powers']);
    const per = Object.fromEntries(BRANCHES.map((b) => [b, KNOWLEDGE.filter((n) => n.branch === b).length]));
    expect(per).toEqual({ economy: 8, primary: 10, specialists: 15, wardens: 8, powers: 5 });
    for (const n of KNOWLEDGE) {
      expect(n.cost).toBeGreaterThanOrEqual(1);
      expect(n.cost).toBeLessThanOrEqual(3);
      expect(n.name.length).toBeGreaterThan(2);
      expect(n.desc).toMatch(/^[A-Z]/);
      expect(BRANCH_NAMES[n.branch]).toBeTruthy();
    }
  });

  it('alte IDs bleiben, Voraussetzungen zeigen auf frühere Knoten desselben Asts', () => {
    for (const id of ['head-start', 'better-deals', 'lantern-tax', 'sharp-eyes', 'bigger-barrels', 'cold-snap', 'cheaper-basics', 'extra-lives', 'veteran-hero', 'fast-learner']) {
      expect(nodeById(id)).toBeDefined();
    }
    expect(nodeById('sharp-eyes')!.branch).toBe('primary'); // früher 'towers'
    const seen = new Set<string>();
    for (const n of KNOWLEDGE) {
      for (const r of n.requires) {
        expect(seen.has(r)).toBe(true);
        expect(nodeById(r)!.branch).toBe(n.branch);
      }
      seen.add(n.id);
    }
    // Plätze im Ast eindeutig
    for (const b of BRANCHES) {
      const cells = KNOWLEDGE.filter((n) => n.branch === b).map((n) => `${n.col}/${n.row}`);
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it('Kette Economy und Wardens: Big Head Start, Thick Walls (einer der beiden Vorgänger), Scholar am Ende', () => {
    let p = withLevel(30);
    expect(nodeState(p, 'thick-walls')).toBe('locked');
    for (const id of ['extra-lives', 'fast-learner']) p = (buyNode(p, id) as { profile: Profile }).profile;
    expect(nodeState(p, 'thick-walls')).toBe('available');
    expect(nodeState(p, 'legendary')).toBe('locked');
    expect(nodeState(p, 'big-head-start')).toBe('locked');
  });
});

describe('Wissenspunkte', () => {
  it('ein Punkt je Level-Up plus einer je erster Medaille', () => {
    let p = withLevel(4);
    expect(knowledgePoints(p).total).toBe(3);
    p = { ...p, medals: { meadow: { easy: true, medium: true, hard: false } } };
    expect(knowledgePoints(p)).toEqual({ total: 5, spent: 0, free: 5 });
    p = { ...p, medals: { meadow: { easy: true, medium: true, hard: true } } };
    expect(knowledgePoints(p).total).toBe(6);
  });

  it('eine Medaille bringt einen Punkt, auch ohne Level-Up (applyMatch)', () => {
    const p = newProfile();
    const a = applyMatch(p, res({ won: false, roundsCleared: 1 }));
    const b = applyMatch(p, res());
    expect(knowledgePoints(b.profile).total).toBe(knowledgePoints(a.profile).total + (b.report.levelAfter - a.report.levelAfter) + 1);
  });

  it('sanitize setzt zurück, wenn mehr ausgegeben als Punkte da sind; Medaillen zählen mit', () => {
    const poor = loadProfile(JSON.parse(JSON.stringify(know(withLevel(2), 'head-start', 'better-deals'))));
    expect(poor.profile.knowledge).toEqual([]);
    const rich = loadProfile(JSON.parse(JSON.stringify({ ...know(withLevel(2), 'head-start', 'better-deals'), medals: { meadow: { easy: true, medium: false, hard: false } } })));
    expect(rich.profile.knowledge).toEqual(['head-start', 'better-deals']);
  });
});

describe('Freischalt-Level und Migration', () => {
  it('Longshot ab 5, Market ab 6', () => {
    expect(unlockLevel('longshot')).toBe(5);
    expect(unlockLevel('market')).toBe(6);
    expect(LEVEL_UNLOCKS.filter((u) => u.kind === 'tower').map((u) => u.id)).toEqual(['bombardier', 'frostcaller', 'riverkeeper', 'longshot', 'market', 'thornweaver', 'alchemist', 'tinker', 'bellringer']);
    expect(isTowerUnlocked(withLevel(4), 'longshot')).toBe(false);
    expect(isTowerUnlocked(withLevel(5), 'longshot')).toBe(true);
    expect(isTowerUnlocked(withLevel(5), 'market')).toBe(false);
    expect(matchOptions(withLevel(6)).unlocks.towers).toEqual(['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'riverkeeper', 'wren']);
  });

  it('Level-Up in einem Match meldet die neuen Türme', () => {
    const r = applyMatch(newProfile(), res({ roundsCleared: 20 }));
    expect(r.report.unlocks.map((u) => u.id)).toContain('longshot');
  });

  it('Profil aus Runde 12 (ohne longshot/market) lädt ohne Reset, bekommt Startwerte, alles andere bleibt', () => {
    const old = JSON.parse(JSON.stringify({ ...withLevel(7), embers: 40, knowledge: ['head-start'] }));
    for (const k of ['towerXp', 'towerTiers']) { delete old[k].longshot; delete old[k].market; delete old[k].thornweaver; delete old[k].alchemist; }
    old.towerXp.ranger = 333;
    old.towerTiers.ranger = [2, 0, 1];
    const r = loadProfile(old);
    expect(r.reset).toBe(false);
    expect(r.profile.towerXp).toEqual({ ranger: 333, bombardier: 100, frostcaller: 100, longshot: 100, market: 100, thornweaver: 100, alchemist: 100, riverkeeper: 100, bellringer: 100, tinker: 100 });
    expect(r.profile.towerTiers.ranger).toEqual([2, 0, 1]);
    expect(r.profile.towerTiers.longshot).toEqual([0, 0, 0]);
    expect(r.profile.knowledge).toEqual(['head-start']);
    expect(r.profile.embers).toBe(40);
    const o = matchOptions(r.profile);
    expect(o.unlocks.towers).toContain('market');
    expect(o.unlocks.maxTier.market).toEqual([0, 0, 0]);
  });

  it('neue Profile: Startguthaben 100 für alle sieben Türme; Match-Ergebnis ohne neue Typen lässt sie unverändert', () => {
    expect(newProfile().towerXp).toEqual({ ranger: 100, bombardier: 100, frostcaller: 100, longshot: 100, market: 100, thornweaver: 100, alchemist: 100, riverkeeper: 100, bellringer: 100, tinker: 100 });
    const r = applyMatch(newProfile(), res({ towerXp: { ranger: 200, bombardier: 100, frostcaller: 100 } as never }));
    expect(r.profile.towerXp.ranger).toBe(200);
    expect(r.profile.towerXp.longshot).toBe(0); // Sim meldet 0 Konto bei fehlendem Schlüssel
  });

  it('Match mit Sim: Turm-XP und Stufen der neuen Typen kommen im Profil an', () => {
    const p = withLevel(6);
    const opts = matchOptions(p);
    const g = createGame({ map: 'meadow', difficulty: 'easy', seed: 1, ...opts, mods: { ...opts.mods, startCash: 5000 } });
    g.apply({ type: 'place', tower: 'longshot', x: 560000, y: 40000 });
    g.apply({ type: 'unlockTier', tower: 'longshot', path: 0 });
    expect(g.state.maxTier.longshot).toEqual([1, 0, 0]);
    const S = g.state;
    const out = applyMatch(p, { matchId: 'x', map: 'meadow', difficulty: 'easy', won: false, roundsCleared: 3, livesLost: 0, pops: S.stats.pops, towerXp: S.towerXp, towerTiers: S.maxTier, towerXpGained: S.towerXpGained });
    expect(out.profile.towerTiers.longshot).toEqual([1, 0, 0]);
    expect(out.profile.towerXp.longshot).toBe(0);
  });

  it('unlockEverything öffnet alle sieben Türme', () => {
    const p = unlockEverything(newProfile());
    expect(TOWER_TYPES).toHaveLength(10);
    expect(p.towerTiers.market).toEqual([5, 5, 5]);
    expect(matchOptions(p).unlocks.towers).toHaveLength(13);
    for (const n of KNOWLEDGE) expect(n.cost).toBeLessThanOrEqual(3);
    expect(knowledgePoints(p).free).toBeGreaterThanOrEqual(29);
  });
});

describe('Wirkung der Knoten in matchOptions', () => {
  const all = (...ids: string[]): ReturnType<typeof matchOptions> => matchOptions(know(withLevel(40), ...ids));
  it('Economy: Startgold 100 + 200, Lantern Tax, Market Savvy, Compound Interest', () => {
    expect(all('head-start').mods.startCash).toBe(100);
    expect(all('head-start', 'better-deals', 'lantern-tax', 'big-head-start').mods).toMatchObject({ startCash: 300, earlyBonus: 20, sellBp: 7500 });
    expect(all('head-start', 'better-deals', 'lantern-tax', 'big-head-start', 'market-savvy', 'compound-interest').mods).toMatchObject({ marketBp: 1000, bankRateBp: 500 });
  });
  it('Primary: Quick Hands, Deep Freeze, Veteran Primaries', () => {
    const m = all('sharp-eyes', 'cheaper-basics', 'quick-hands', 'deep-freeze', 'veteran-primaries').mods;
    expect(m).toMatchObject({ t1DiscountBp: 1000, t2DiscountBp: 1000, freezeAddTicks: 30, tempoBp: { ranger: 500, bombardier: 500 }, rangeBp: { ranger: 800 } });
  });
  it('Specialists: Steady Aim (Longshot-Tempo), Supply Lines, Wide Aura, Bulk Orders', () => {
    const m = all('steady-aim', 'supply-lines', 'wide-aura', 'bulk-orders').mods;
    expect(m).toMatchObject({ tempoBp: { longshot: 1000 }, supplyBonus: 200, marketRadiusBp: 1500, marketPriceBp: 1000 });
    expect(all('steady-aim', 'quick-hands').mods.tempoBp).toEqual({ ranger: 500, bombardier: 500, longshot: 1000 });
  });
  it('Wardens: Thick Walls +15 Leben (zusätzlich zu +10), Hero Training, Legendary Level 5 vor Veteran 3', () => {
    expect(all('extra-lives').mods.lives).toBe(10);
    expect(all('extra-lives', 'veteran-hero', 'thick-walls').mods).toMatchObject({ lives: 25, heroStartLevel: 3 });
    expect(all('extra-lives', 'veteran-hero', 'thick-walls', 'hero-training', 'legendary').mods).toMatchObject({ heroXpBp: 1500, heroStartLevel: 5 });
  });
  it('Powers: Spare Pocket und Starter Kit gehen als Mods in die Sim', () => {
    const m = all('ember-pouch', 'bulk-buyer', 'spare-pocket', 'starter-kit').mods;
    expect(m).toMatchObject({ powerUses: 2, freePowers: { goldDrop: 1 } });
    expect(all().mods).toEqual({});
  });
  it('die Mods wirken in der Sim', () => {
    const o = all('head-start', 'big-head-start', 'better-deals', 'lantern-tax', 'extra-lives', 'veteran-hero', 'thick-walls', 'hero-training', 'legendary', 'spare-pocket', 'starter-kit', 'bulk-buyer', 'ember-pouch');
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...o });
    expect(g.state.cash).toBe(650 + 300);
    expect(g.state.lives).toBe(150 + 25);
    expect(g.state.powers.goldDrop).toBe(2); // Startpaket 1 + Starter Kit 1
    // Legendary: Wren startet auf Level 5
    let placed = false;
    for (let y = 20000; y < 340000 && !placed; y += 20000) {
      for (let x = 20000; x < 600000 && !placed; x += 20000) placed = g.apply({ type: 'place', tower: 'wren', x, y }).ok;
    }
    expect(placed).toBe(true);
    expect(g.state.towers[0].heroLevel).toBe(5);
  });
});

describe('Matches: Scholar, Ember Pouch, Starter Kit; Store: Bulk Buyer', () => {
  it('Scholar +10 % Spieler-XP', () => {
    const plain = applyMatch(newProfile(), res());
    const sch = applyMatch(know(withLevel(30), 'scholar'), res());
    const base = applyMatch(withLevel(30), res());
    expect(plain.report.xpGained).toBe(matchXp(20, 'medium', true));
    expect(base.report.xpGained).toBe(2970);
    expect(sch.report.xpGained).toBe(3267);
    expect(matchXp(20, 'medium', true, 1000)).toBe(3267);
  });
  it('Ember Pouch +10 % Embers (abgerundet auf die Summe), eigene Zeile im Bericht', () => {
    expect(matchEmbers(20, 'medium', true, false, 0, 1000)).toEqual({ rounds: 54, win: 30, medal: 0, levelUp: 0, pouch: 8, rush: 0 });
    const lv = withLevel(30, { ...newProfile(), medals: { meadow: { easy: true, medium: true, hard: true } } });
    const a = applyMatch(lv, res({ matchId: 'a' }));
    const b = applyMatch(know(lv, 'ember-pouch'), res({ matchId: 'b' }));
    expect(b.report.embers.pouch).toBe(Math.floor((54 + 30) * 0.1));
    expect(b.report.embersGained).toBe(a.report.embersGained + b.report.embers.pouch);
    expect(b.profile.embers).toBe(100 + b.report.embersGained);
  });
  it('Starter Kit: das erste Gold Drop des Matches kostet kein Inventar', () => {
    const p = know(withLevel(30), 'starter-kit');
    expect(p.inventory.goldDrop).toBe(1);
    const one = applyMatch(p, res({ powersUsed: { goldDrop: 1 } }));
    expect(one.profile.inventory.goldDrop).toBe(1); // das gratis Exemplar
    expect(one.report.powersUsed).toBe(1);
    const two = applyMatch(p, res({ matchId: 'm2', powersUsed: { goldDrop: 2, lanternBomb: 1 } }));
    expect(two.profile.inventory.goldDrop).toBe(0);
    expect(two.profile.inventory.lanternBomb).toBe(0);
    const without = applyMatch(withLevel(30), res({ matchId: 'm3', powersUsed: { goldDrop: 1 } }));
    expect(without.profile.inventory.goldDrop).toBe(0);
  });
  it('Bulk Buyer: Store −10 % (aufgerundet), Kauf zieht den Rabattpreis ab', () => {
    const p = know(withLevel(30), 'bulk-buyer');
    expect(powerCost(newProfile(), 'lanternBomb')).toBe(powerPrice('lanternBomb'));
    expect(powerCost(p, 'lanternBomb')).toBe(Math.ceil(powerPrice('lanternBomb') * 0.9));
    const r = buyPower(p, 'lanternBomb', 2);
    expect(r.ok && r.cost).toBe(powerCost(p, 'lanternBomb') * 2);
    expect(r.ok && r.profile.embers).toBe(100 - powerCost(p, 'lanternBomb') * 2);
  });
});
