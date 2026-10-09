import { describe, expect, it } from 'vitest';
import {
  applyMatch, buyNode, exportProfile, importProfile, knowledgePoints, levelFromXp, loadProfile, matchOptions, matchXp, newProfile,
  resetKnowledge, unlockTier, xpForLevel, type MatchResult, type Profile,
} from '../src/index';

const res = (o: Partial<MatchResult> = {}): MatchResult => ({
  matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400, bombardier: 100 }, tierBuys: { ranger: 4 }, ...o,
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
    expect(report.xpGained).toBe(2970);
    expect(report.levelAfter).toBe(levelFromXp(2970).level);
    expect(report.unlocks.map((u) => u.id)).toEqual(['bombardier', 'wren', 'frostcaller', 'hard']);
    expect(report.pointsGained).toBe(report.levelAfter - 1);
    expect(report.newMedal).toBe('medium');
    expect(profile.medals.meadow.medium).toBe(true);
    expect(profile.best.meadow.medium).toEqual({ round: 20, livesLost: 3 });
  });
  it('Turm-XP: Pops + 20 je Stufe, Fast Learner +20 %', () => {
    const a = applyMatch(newProfile(), res());
    expect(a.report.towerXpGained).toEqual({ ranger: 480, bombardier: 100 });
    expect(a.profile.towerXp.ranger).toBe(250 + 480);
    let p = withXp(xpForLevel(4), newProfile());
    p = { ...p, knowledge: ['extra-lives', 'fast-learner'] };
    expect(applyMatch(p, res()).report.towerXpGained.ranger).toBe(576);
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
  it('der Reihe nach, kostet XP, Stufe 1 mit Startguthaben', () => {
    const p = newProfile();
    const a = unlockTier(p, 'ranger', 0);
    expect(a.ok && a.profile.towerTiers.ranger).toEqual([1, 0, 0]);
    expect(a.ok && a.profile.towerXp.ranger).toBe(150);
    const b = unlockTier(a.ok ? a.profile : p, 'ranger', 0);
    expect(b.ok).toBe(false);
    expect(!b.ok && b.code).toBe('not-enough-xp');
  });
  it('gesperrter Turm (Level) geht nicht', () => {
    const r = unlockTier(newProfile(), 'bombardier', 0);
    expect(!r.ok && r.code).toBe('tower-locked');
  });
  it('Stufe 5 kostet 8000', () => {
    let p: Profile = { ...newProfile(), towerXp: { ranger: 99999, bombardier: 0, frostcaller: 0 } };
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
    const p: Profile = { ...withXp(xpForLevel(4)), knowledge: ['extra-lives', 'veteran-hero', 'head-start'], towerTiers: { ranger: [2, 0, 1], bombardier: [0, 0, 0], frostcaller: [0, 0, 0] } };
    const o = matchOptions(p);
    expect(o.unlocks.towers).toEqual(['ranger', 'bombardier', 'frostcaller', 'wren']);
    expect(o.unlocks.maxTier.ranger).toEqual([2, 0, 1]);
    expect(o.mods).toEqual({ startCash: 100, lives: 10, heroStartLevel: 3 });
  });
  it('unlock everything', () => {
    const o = matchOptions({ ...newProfile(), settings: { volume: 50, unlockAll: true } });
    expect(o.unlocks.towers).toHaveLength(4);
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
    expect(code(json.replace('"playerXp": 2970', '"playerXp": 9999'))).toBe('import-bad-checksum');
    expect(code(JSON.stringify({ ...JSON.parse(json), formatVersion: 3 }))).toBe('import-old-version');
  });
});
