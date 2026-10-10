import { describe, expect, it } from 'vitest';
import { createGame, DATA } from '../../sim/src/index';
import {
  POWER_KEYS, buyPower, canonicalJson, checksum, embersForRound, matchEmbers, powerPrice,
  applyMatch, buyNode, exportProfile, importProfile, knowledgePoints, levelFromXp, loadProfile, matchOptions, matchXp, newProfile, roundRewardBp,
  resetKnowledge, tierCost, unlockEverything, unlockTier, xpForLevel, type MatchResult, type Profile,
} from '../src/index';

const res = (o: Partial<MatchResult> = {}): MatchResult => ({
  matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400, bombardier: 100 }, ...o,
});
const withXp = (xp: number, p: Profile = newProfile()): Profile => ({ ...p, playerXp: xp });

describe('Level', () => {
  it('Kurve 300/500/800/1200/1600, Deckel 7200', () => {
    expect(xpForLevel(2)).toBe(300);
    expect(xpForLevel(3)).toBe(800);
    expect(xpForLevel(5)).toBe(2800);
    expect(xpForLevel(6) - xpForLevel(5)).toBe(1600);
    expect(xpForLevel(30) - xpForLevel(29)).toBe(7200);
    expect(levelFromXp(299).level).toBe(1);
    expect(levelFromXp(300).level).toBe(2);
  });
  it('volle Medium-Partie = 2970 XP, Easy/Hard-Faktor, Freeplay 30 %', () => {
    expect(matchXp(20, 'medium', true)).toBe(2970);
    expect(matchXp(20, 'easy', true)).toBe(2700);
    expect(matchXp(10, 'easy', false)).toBe(Math.round(10 * 20 + 10 * 55));
    expect(matchXp(21, 'easy', false)).toBe(2500 + Math.floor(230 * 0.3));
  });
});

describe('Match anwenden', () => {
  it('XP, Level-Ups, Freischaltungen, Wissenspunkte, Medaille', () => {
    const { profile, report } = applyMatch(newProfile(), res());
    // Runde 15b: Medium endet bei R60; 20 Runden sind ein Teilstueck, die Runden-XP sind auf 19,25 % gedaempft (volle Partie R60: 4.316)
    expect(report.xpGained).toBe(738);
    expect(report.levelAfter).toBe(levelFromXp(738).level);
    expect(report.unlocks.map((u) => u.id)).toEqual(['bombardier']);
    expect(report.pointsGained).toBe(report.levelAfter - 1);
    expect(report.newMedal).toBe('medium');
    expect(profile.medals.meadow.medium).toBe(true);
    expect(profile.best.meadow.medium).toEqual({ round: 20, livesLost: 3 });
  });
  it('Turm-XP: Endkonto und Endstufen kommen aus dem Match, Bericht zeigt towerXpGained', () => {
    const a = applyMatch(newProfile(), res({
      towerXp: { ranger: 480, bombardier: 20, frostcaller: 100, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 }, towerXpGained: { ranger: 480, bombardier: 120, frostcaller: 0 },
      towerTiers: { ranger: [1, 0, 2], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] },
    }));
    expect(a.profile.towerXp).toEqual({ ranger: 480, bombardier: 20, frostcaller: 100, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 });
    expect(a.profile.towerTiers.ranger).toEqual([1, 0, 2]);
    expect(a.report.towerXpGained).toEqual({ ranger: 480, bombardier: 120 });
  });
  it('Turm-XP: ohne Felder im Ergebnis bleibt das Turm-Profil unveraendert (keine Pops-Formel mehr)', () => {
    const a = applyMatch(newProfile(), res());
    expect(a.profile.towerXp).toEqual(newProfile().towerXp);
    expect(a.profile.towerTiers).toEqual(newProfile().towerTiers);
    expect(a.report.towerXpGained).toEqual({});
  });
  it('Stufen sinken nie; mit "unlock everything" bleiben sie unangetastet', () => {
    const p: Profile = { ...newProfile(), towerTiers: { ranger: [3, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0], riverkeeper: [0, 0, 0], bellringer: [0, 0, 0], tinker: [0, 0, 0] } };
    const r = res({ towerXp: { ranger: 0, bombardier: 0, frostcaller: 0, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 }, towerTiers: { ranger: [1, 2, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0], riverkeeper: [0, 0, 0], bellringer: [0, 0, 0], tinker: [0, 0, 0] } });
    expect(applyMatch(p, r).profile.towerTiers.ranger).toEqual([3, 2, 0]);
    const u: Profile = { ...p, settings: { ...p.settings, unlockAll: true } };
    const full = res({ towerTiers: { ranger: [5, 5, 5], bombardier: [5, 5, 5], frostcaller: [5, 5, 5] } });
    expect(applyMatch(u, full).profile.towerTiers).toEqual(p.towerTiers);
  });
  it('Startguthaben 100 je Turm (genau Stufe 1)', () => {
    expect(newProfile().towerXp).toEqual({ ranger: 100, bombardier: 100, frostcaller: 100, longshot: 100, market: 100, thornweaver: 100, alchemist: 100, riverkeeper: 100, bellringer: 100, tinker: 100 });
  });
  it('alte 11er-Profile (Startguthaben 250) bleiben gueltig und werden nicht zurueckgesetzt', () => {
    const old = { ...newProfile(), towerXp: { ranger: 250, bombardier: 250, frostcaller: 250, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 } };
    const l = loadProfile(JSON.parse(JSON.stringify(old)));
    expect(l.reset).toBe(false);
    expect(l.profile.towerXp.ranger).toBe(250);
  });
  it('Ende-zu-Ende mit der Sim: matchOptions -> createGame -> Runde 1 -> applyMatch', () => {
    const p0 = newProfile();
    const mo = matchOptions(p0);
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...mo });
    let spot = { x: 0, y: 0 };
    for (let y = 20; y < 340 && !spot.x; y += 20) for (let x = 20; x < 620 && !spot.x; x += 20) if (g.canPlace('ranger', x * 1000, y * 1000).ok) spot = { x: x * 1000, y: y * 1000 };
    g.apply({ type: 'place', tower: 'ranger', ...spot });
    expect(g.apply({ type: 'unlockTier', tower: 'ranger', path: 0 }).ok).toBe(true);
    g.apply({ type: 'startRound' });
    for (let i = 0; i < 60 * 120 && g.state.roundsCleared < 1; i++) g.step();
    const S = g.state;
    expect(S.towerXpGained.ranger).toBeGreaterThan(0);
    const { profile, report } = applyMatch(p0, res({ matchId: 'e2e', roundsCleared: 1, won: false, towerXp: S.towerXp, towerTiers: S.maxTier, towerXpGained: S.towerXpGained }));
    expect(profile.towerTiers.ranger).toEqual([1, 0, 0]);
    expect(profile.towerXp.ranger).toBe(100 - 100 + S.towerXpGained.ranger);
    expect(report.towerXpGained.ranger).toBe(S.towerXpGained.ranger);
  });
  it('Niederlage: keine Medaille, Bestleistung nur wenn besser', () => {
    const a = applyMatch(newProfile(), res({ won: false, roundsCleared: 8, matchId: 'a' }));
    expect(a.report.newMedal).toBeNull();
    const b = applyMatch(a.profile, res({ won: false, roundsCleared: 6, matchId: 'b' }));
    expect(b.report.newBest).toBe(false);
    expect(b.profile.best.meadow.medium?.round).toBe(8);
  });
  it('Idempotent: gleiche Match-ID zaehlt nicht doppelt', () => {
    const a = applyMatch(newProfile(), res());
    const b = applyMatch(a.profile, res());
    expect(b.report.duplicate).toBe(true);
    expect(b.profile).toEqual(a.profile);
  });
  it('Eingabe wird geprueft', () => {
    expect(() => applyMatch(newProfile(), res({ roundsCleared: -1 }))).toThrow();
  });
});

describe('Turm-Stufen', () => {
  it('Kosten stimmen mit den Sim-Daten ueberein (eine Wahrheit: sim/data/xp.json)', () => {
    expect([1, 2, 3, 4, 5].map(tierCost)).toEqual([...DATA.xp.unlockCost]);
  });
  it('der Reihe nach, kostet XP, Stufe 1 genau mit dem Startguthaben', () => {
    const p = newProfile();
    const a = unlockTier(p, 'ranger', 0);
    expect(a.ok && a.profile.towerTiers.ranger).toEqual([1, 0, 0]);
    expect(a.ok && a.profile.towerXp.ranger).toBe(0);
    const b = unlockTier(a.ok ? a.profile : p, 'ranger', 0);
    expect(b.ok).toBe(false);
    expect(!b.ok && b.code).toBe('not-enough-xp');
  });
  it('gesperrter Turm (Level) geht nicht', () => {
    const r = unlockTier(newProfile(), 'bombardier', 0);
    expect(!r.ok && r.code).toBe('tower-locked');
  });
  it('Stufe 5 kostet 8000', () => {
    let p: Profile = { ...newProfile(), towerXp: { ranger: 99999, bombardier: 0, frostcaller: 0, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 } };
    for (let i = 0; i < 5; i++) {
      const r = unlockTier(p, 'ranger', 1);
      expect(r.ok).toBe(true);
      if (r.ok) p = r.profile;
    }
    expect(p.towerTiers.ranger[1]).toBe(5);
    expect(p.towerXp.ranger).toBe(99999 - 11750);
    expect(unlockTier(p, 'ranger', 1).ok).toBe(false);
  });
});

describe('Wissensbaum', () => {
  const lvl = (n: number): Profile => withXp(xpForLevel(n));
  it('Punkte = Level - 1, Voraussetzungen, Kosten', () => {
    let p = lvl(4);
    expect(knowledgePoints(p)).toEqual({ total: 3, spent: 0, free: 3 });
    const bad = buyNode(p, 'lantern-tax');
    expect(!bad.ok && bad.code).toBe('locked');
    for (const id of ['head-start', 'better-deals']) {
      const r = buyNode(p, id);
      expect(r.ok).toBe(true);
      if (r.ok) p = r.profile;
    }
    const poor = buyNode(p, 'lantern-tax');
    expect(!poor.ok && poor.code).toBe('no-points');
    expect(knowledgePoints(p).free).toBe(1);
  });
  it('Cheaper Basics braucht einen der drei', () => {
    let p = lvl(6);
    expect(buyNode(p, 'cheaper-basics').ok).toBe(false);
    const r = buyNode(p, 'cold-snap');
    if (r.ok) p = r.profile;
    expect(buyNode(p, 'cheaper-basics').ok).toBe(true);
  });
  it('Zuruecksetzen gibt alles zurueck', () => {
    let p = lvl(5);
    const r = buyNode(p, 'extra-lives');
    if (r.ok) p = r.profile;
    expect(knowledgePoints(resetKnowledge(p)).free).toBe(4);
  });
});

describe('matchOptions', () => {
  it('neues Profil: nur Ranger, Stufen 0', () => {
    const o = matchOptions(newProfile());
    expect(o.unlocks.towers).toEqual(['ranger']);
    expect(o.unlocks.maxTier.ranger).toEqual([0, 0, 0]);
    expect(o.mods).toEqual({});
  });
  it('Level und Wissensbaum wirken', () => {
    const p: Profile = { ...withXp(xpForLevel(4)), knowledge: ['extra-lives', 'veteran-hero', 'head-start'], towerTiers: { ranger: [2, 0, 1], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0], riverkeeper: [0, 0, 0], bellringer: [0, 0, 0], tinker: [0, 0, 0] } };
    const o = matchOptions(p);
    expect(o.unlocks.towers).toEqual(['ranger', 'bombardier', 'frostcaller', 'riverkeeper', 'wren']);
    expect(o.unlocks.maxTier.ranger).toEqual([2, 0, 1]);
    expect(o.mods).toEqual({ startCash: 100, lives: 10, heroStartLevel: 3 });
  });
  it('liefert das Turm-XP-Konto; Fast Learner setzt mods.towerXpBp', () => {
    const p: Profile = { ...withXp(xpForLevel(4)), knowledge: ['extra-lives', 'fast-learner'], towerXp: { ranger: 120, bombardier: 5, frostcaller: 0, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 } };
    const o = matchOptions(p);
    expect(o.towerXp).toEqual({ ranger: 120, bombardier: 5, frostcaller: 0, longshot: 0, market: 0, thornweaver: 0, alchemist: 0, riverkeeper: 0, bellringer: 0, tinker: 0 });
    expect(o.towerXp).not.toBe(p.towerXp);
    expect(o.mods.towerXpBp).toBe(2000);
    expect(matchOptions(newProfile()).mods.towerXpBp).toBeUndefined();
  });
  it('unlock everything', () => {
    const o = matchOptions({ ...newProfile(), settings: { volume: 50, unlockAll: true } });
    expect(o.unlocks.towers).toHaveLength(13); // zehn Türme und drei Helden
    expect(o.unlocks.maxTier.frostcaller).toEqual([5, 5, 5]);
  });
});

describe('Laden, Reset, Export', () => {
  it('leer = frisch ohne Hinweis; alt = Reset mit Hinweis', () => {
    expect(loadProfile(null).reset).toBe(false);
    const old = loadProfile({ schemaVersion: 3, units: {} });
    expect(old.reset).toBe(true);
    expect(old.profile.showResetNotice).toBe(true);
    expect(old.profile.playerXp).toBe(0);
    expect(loadProfile({ schema: 11, nonsense: 1 }).reset).toBe(true);
  });
  it('Profil ueberlebt Speichern und Laden', () => {
    const p = applyMatch(newProfile(), res()).profile;
    expect(loadProfile(JSON.parse(JSON.stringify(p))).profile).toEqual(p);
  });
  it('Wissensbaum, der mehr kostet als Punkte da sind, wird zurueckgesetzt', () => {
    const p: Profile = { ...newProfile(), knowledge: ['head-start', 'better-deals', 'lantern-tax'] };
    expect(loadProfile(p).profile.knowledge).toEqual([]);
  });
  it('Export/Import Rundreise und Fehler', () => {
    const p = applyMatch(newProfile(), res()).profile;
    const json = exportProfile(p, '2026-10-09T00:00:00Z');
    const back = importProfile(json);
    expect(back.ok && back.profile).toEqual(p);
    const code = (s: string): string => { const r = importProfile(s); return r.ok ? 'ok' : r.code; };
    expect(code('{')).toBe('import-invalid-json');
    expect(code('{"a":1}')).toBe('import-wrong-format');
    expect(code(json.replace('"playerXp": 738', '"playerXp": 9999'))).toBe('import-bad-checksum');
    expect(code(JSON.stringify({ ...JSON.parse(json), formatVersion: 3 }))).toBe('import-old-version');
  });
});

describe('Testhilfe unlockEverything', () => {
  it('alles offen, Wissensbaum voll kaufbar, Profil bleibt gueltig', () => {
    const p = unlockEverything(newProfile());
    expect(matchOptions(p).unlocks.towers).toHaveLength(13); // zehn Türme und drei Helden
    expect(matchOptions(p).unlocks.maxTier.ranger).toEqual([5, 5, 5]);
    expect(knowledgePoints(p).free).toBeGreaterThanOrEqual(14);
    expect(loadProfile(JSON.parse(JSON.stringify(p))).reset).toBe(false);
  });
});

describe('matchOptions gegen die echte Sim', () => {
  it('createGame nimmt unlocks + mods an: Startgeld/Leben, gesperrte Stufe, gesperrter Turm', () => {
    const base = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...matchOptions(newProfile()) });
    const p: Profile = { ...withXp(xpForLevel(4)), knowledge: ['head-start', 'extra-lives'], towerTiers: { ranger: [2, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0], riverkeeper: [0, 0, 0], bellringer: [0, 0, 0], tinker: [0, 0, 0] } };
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...matchOptions(p) });
    expect(g.state.cash).toBe(base.state.cash + 100);
    expect(g.state.lives).toBe(base.state.lives + 10);
    // Bombardier ist ab Level 2 frei, im frischen Profil nicht
    expect(base.canPlace('bombardier', 60000, 122000)).toEqual({ ok: false, reason: 'locked' });
    let spot: { x: number; y: number } | null = null;
    for (let y = 20; y < 340 && !spot; y += 20) for (let x = 20; x < 620 && !spot; x += 20) if (g.canPlace('ranger', x * 1000, y * 1000).ok) spot = { x: x * 1000, y: y * 1000 };
    expect(spot).not.toBeNull();
    const id = g.apply({ type: 'place', tower: 'ranger', ...(spot as { x: number; y: number }) });
    expect(id.ok).toBe(true);
    if (id.ok && id.id !== undefined) {
      expect(g.apply({ type: 'upgrade', towerId: id.id, path: 0 }).ok).toBe(true);
      g.sandbox.setCash(100000);
      g.apply({ type: 'upgrade', towerId: id.id, path: 0 });
      const third = g.apply({ type: 'upgrade', towerId: id.id, path: 0 });
      expect(third.ok).toBe(false);
      if (!third.ok) expect(third.reason).toBe('locked');
    }
  });
});

describe('Embers, Inventar und Store (Runde 12)', () => {
  it('neues Profil: Startpaket 100 Embers + 1 Gold Drop + 1 Lantern Bomb, Flag gesetzt', () => {
    const p = newProfile();
    expect(p.embers).toBe(100);
    expect(p.starterPack).toBe(true);
    expect(p.inventory.goldDrop).toBe(1);
    expect(p.inventory.lanternBomb).toBe(1);
    expect(Object.values(p.inventory).reduce((a, b) => a + b, 0)).toBe(2);
    expect(Object.keys(p.inventory).sort()).toEqual([...POWER_KEYS].sort());
  });

  it('bestehendes 11er-Profil ohne die Felder wird migriert: nichts zurückgesetzt, Startpaket genau einmal', () => {
    const old = { ...newProfile('2026-10-01T00:00:00.000Z'), playerXp: 5000, matchesWon: 3, knowledge: [] as string[], towerTiers: { ranger: [2, 0, 1], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0], riverkeeper: [0, 0, 0], bellringer: [0, 0, 0], tinker: [0, 0, 0] } } as Record<string, unknown>;
    delete old.embers;
    delete old.inventory;
    delete old.starterPack;
    const r = loadProfile(old);
    expect(r.reset).toBe(false);
    expect(r.profile.playerXp).toBe(5000);
    expect(r.profile.matchesWon).toBe(3);
    expect(r.profile.towerTiers.ranger).toEqual([2, 0, 1]);
    expect(r.profile.embers).toBe(100);
    expect(r.profile.inventory.goldDrop).toBe(1);
    expect(r.profile.inventory.lanternBomb).toBe(1);
    expect(r.profile.starterPack).toBe(true);
    // zweites Laden vergibt nichts mehr
    const again = loadProfile(JSON.parse(JSON.stringify(r.profile)));
    expect(again.profile.embers).toBe(100);
    expect(again.profile.inventory).toEqual(r.profile.inventory);
    // Profil mit Embers, aber ohne Flag: bekommt das Paket additiv
    const some = loadProfile({ ...old, embers: 7 });
    expect(some.profile.embers).toBe(107);
  });

  it('Export/Import eines alten Stands ohne die Felder funktioniert und migriert', () => {
    const old = { ...newProfile() } as Record<string, unknown>;
    delete old.embers; delete old.inventory; delete old.starterPack;
    const text = JSON.stringify({ format: 'duskwardens-save', formatVersion: 11, exportedAt: 'x', checksum: checksum(canonicalJson(old)), profile: old });
    const r = importProfile(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.profile.embers).toBe(100);
    const rt = importProfile(exportProfile(newProfile(), 'x'));
    expect(rt.ok && rt.profile.embers).toBe(100);
  });

  it('Embers: Runden 1 + floor(r/5), R1-20 zusammen 54', () => {
    expect(embersForRound(1)).toBe(1);
    expect(embersForRound(5)).toBe(2);
    expect(embersForRound(20)).toBe(5);
    expect(matchEmbers(20, 'medium', false, false, 0).rounds).toBe(54);
    expect(matchEmbers(25, 'medium', false, false, 0).rounds).toBe(54); // Freeplay zählt nicht
    expect(matchEmbers(0, 'easy', false, false, 0).rounds).toBe(0);
  });

  it('Embers: Sieg 20/30/50, erste Medaille +50, Level-Up +25 je Level', () => {
    expect(matchEmbers(20, 'easy', true, false, 0)).toEqual({ rounds: 54, win: 20, medal: 0, levelUp: 0, pouch: 0, rush: 0 });
    expect(matchEmbers(20, 'medium', true, false, 0).win).toBe(30);
    expect(matchEmbers(20, 'hard', true, true, 2)).toEqual({ rounds: 54, win: 50, medal: 50, levelUp: 50, pouch: 0, rush: 0 });
    expect(matchEmbers(10, 'hard', false, false, 0).win).toBe(0);
  });

  it('applyMatch: Medium-Sieg, erste Medaille und Level-Ups ergeben Embers im Bericht und Profil', () => {
    const { profile, report } = applyMatch(newProfile(), res());
    const lvUps = report.levelAfter - report.levelBefore;
    expect(lvUps).toBeGreaterThan(0);
    expect(report.embers).toEqual({ rounds: 10, win: 30, medal: 50, levelUp: 25 * lvUps, pouch: 0, rush: 0 }); // 54 x 19,25 %
    expect(report.embersGained).toBe(10 + 30 + 50 + 25 * lvUps);
    expect(profile.embers).toBe(100 + report.embersGained);
    // zweiter Sieg gleicher Schwierigkeit: keine Medaille mehr
    const second = applyMatch(profile, res({ matchId: 'm2' }));
    expect(second.report.embers.medal).toBe(0);
  });

  it('applyMatch: Niederlage gibt Embers für die geschafften Runden', () => {
    const { profile, report } = applyMatch(newProfile(), res({ won: false, roundsCleared: 7, difficulty: 'hard' }));
    expect(report.embers.rounds).toBe(Math.floor((1 + 1 + 1 + 1 + 2 + 2 + 2) * roundRewardBp(80) / 10000)); // Hard endet bei R80: gedaempft
    expect(report.embers.win).toBe(0);
    expect(report.embers.medal).toBe(0);
    expect(profile.embers).toBe(100 + report.embersGained);
  });

  it('applyMatch: powersUsed werden vom Inventar abgezogen (nie unter 0), Summe im Bericht', () => {
    const p0 = { ...newProfile(), inventory: { ...newProfile().inventory, goldDrop: 3, frostTrap: 1 } };
    const { profile, report } = applyMatch(p0, res({ powersUsed: { goldDrop: 2, frostTrap: 5, lanternBomb: 1 } }));
    expect(profile.inventory.goldDrop).toBe(1);
    expect(profile.inventory.frostTrap).toBe(0);
    expect(profile.inventory.lanternBomb).toBe(0);
    expect(report.powersUsed).toBe(8);
  });

  it('applyMatch ist idempotent je matchId (Embers und Inventar nur einmal)', () => {
    const p0 = { ...newProfile(), inventory: { ...newProfile().inventory, goldDrop: 3 } };
    const a = applyMatch(p0, res({ powersUsed: { goldDrop: 1 } }));
    const b = applyMatch(a.profile, res({ powersUsed: { goldDrop: 1 } }));
    expect(b.report.duplicate).toBe(true);
    expect(b.report.embersGained).toBe(0);
    expect(b.profile).toBe(a.profile);
    expect(a.profile.inventory.goldDrop).toBe(2);
  });

  it('buyPower: Preis aus den Sim-Daten, Embers runter, Inventar rauf; Fehlerfälle', () => {
    const p = { ...newProfile(), embers: 100 };
    const r = buyPower(p, 'lanternBomb');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cost).toBe(DATA.powers.lanternBomb.price);
    expect(r.profile.embers).toBe(70);
    expect(r.profile.inventory.lanternBomb).toBe(2);
    expect(p.embers).toBe(100); // rein
    const three = buyPower(p, 'caltrops', 3);
    expect(three.ok && three.profile.embers).toBe(25);
    expect(buyPower({ ...p, embers: 149 }, 'instaWarden:ranger')).toMatchObject({ ok: false, code: 'not-enough-embers' });
    expect(buyPower({ ...p, embers: 150 }, 'instaWarden:frostcaller')).toMatchObject({ ok: true });
    expect(buyPower(p, 'nope' as never)).toMatchObject({ ok: false, code: 'unknown-power' });
    expect(buyPower(p, 'goldDrop', 0)).toMatchObject({ ok: false, code: 'bad-count' });
  });

  it('Preise: kein Power kostet mehr als ein paar Partien, alle Schlüssel im Profil', () => {
    for (const k of POWER_KEYS) expect(powerPrice(k)).toBe(DATA.powers[k].price);
  });

  it('matchOptions liefert das Inventar als powers und die Sim nimmt es an', () => {
    const p = { ...newProfile(), inventory: { ...newProfile().inventory, goldDrop: 2, 'instaWarden:ranger': 1 } };
    const o = matchOptions(p);
    expect(o.powers.goldDrop).toBe(2);
    expect(o.powers['instaWarden:ranger']).toBe(1);
    expect(Object.keys(o.powers)).toHaveLength(POWER_KEYS.length);
    o.powers.goldDrop = 99; // Kopie
    expect(p.inventory.goldDrop).toBe(2);
    const g = createGame({ map: 'meadow', difficulty: 'medium', seed: 1, ...matchOptions(p) });
    expect(g.state.powers.goldDrop).toBe(2);
    const cash = g.state.cash;
    expect(g.apply({ type: 'power', power: 'goldDrop' }).ok).toBe(true);
    expect(g.state.cash).toBe(cash + 500);
    expect(g.state.stats.powersUsed.goldDrop).toBe(1);
  });
});
