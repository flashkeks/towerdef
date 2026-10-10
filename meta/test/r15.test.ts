/** Runde 15: Karten, Modi, Freischaltung, Medaillen je Karte x Schwierigkeit x Modus, Bestleistung, Belohnungsfaktoren, Migration. */
import { describe, expect, it } from 'vitest';
import {
  MAPS, MAP_IDS, MAP_NAMES, MODE_IDS, MODE_META, allMedalCount, applyMatch, bestOf, exportProfile, importProfile, isMapUnlocked, isModeUnlocked, knowledgePoints, loadProfile,
  mapLock, matchEmbers, matchOptions, matchXp, maxRoundOf, medalCount, medalsOf, modeLock, newProfile, rewardFactors, unlockLevel, unlockedMaps, xpForLevel,
  type MatchResult, type Profile,
} from '../src/index';

const withLevel = (n: number, p: Profile = newProfile()): Profile => ({ ...p, playerXp: xpForLevel(n) });
const res = (o: Partial<MatchResult> = {}): MatchResult => ({ matchId: 'm1', map: 'meadow', difficulty: 'medium', won: true, roundsCleared: 20, livesLost: 3, pops: { ranger: 400 }, ...o });
const medal = (p: Profile, map: string, ...ds: ('easy' | 'medium' | 'hard')[]): Profile => ({ ...p, medals: { ...p.medals, [map]: { easy: ds.includes('easy'), medium: ds.includes('medium'), hard: ds.includes('hard') } } });

describe('Karten: Export MAPS', () => {
  it('drei Karten mit Runden 20 / 25 / 30, Stufen, Faktoren', () => {
    expect(MAP_IDS).toEqual(['meadow', 'frostfen', 'quarry']);
    expect(MAPS.map((m) => m.maxRound)).toEqual([20, 25, 30]);
    expect(MAPS.map((m) => m.tierName)).toEqual(['Beginner', 'Intermediate', 'Advanced']);
    expect(MAPS.map((m) => m.xpBp)).toEqual([10000, 11500, 13000]);
    expect(MAPS.map((m) => m.embersBp)).toEqual([10000, 12000, 14000]);
    expect(MAP_NAMES).toMatchObject({ meadow: 'Lanternfall Meadow', frostfen: 'Frostfen Crossing', quarry: 'Ember Quarry' });
    expect(maxRoundOf('quarry')).toBe(30);
    expect(maxRoundOf('unbekannt')).toBe(20);
  });
});

describe('Karten-Freischaltung', () => {
  it('Meadow immer offen, Frostfen ab Level 8, Quarry ab Level 12', () => {
    expect(isMapUnlocked(newProfile(), 'meadow')).toBe(true);
    expect(isMapUnlocked(withLevel(7), 'frostfen')).toBe(false);
    expect(isMapUnlocked(withLevel(8), 'frostfen')).toBe(true);
    expect(isMapUnlocked(withLevel(11), 'quarry')).toBe(false);
    expect(isMapUnlocked(withLevel(12), 'quarry')).toBe(true);
    expect(unlockLevel('frostfen')).toBe(8);
    expect(unlockLevel('quarry')).toBe(12);
  });
  it('oder Medium-Medaille auf der Vorgaengerkarte (Easy genuegt nicht, Hard zaehlt mit)', () => {
    expect(isMapUnlocked(medal(newProfile(), 'meadow', 'easy'), 'frostfen')).toBe(false);
    expect(isMapUnlocked(medal(newProfile(), 'meadow', 'medium'), 'frostfen')).toBe(true);
    expect(isMapUnlocked(medal(newProfile(), 'meadow', 'hard'), 'frostfen')).toBe(true);
    const p = medal(newProfile(), 'meadow', 'medium');
    expect(isMapUnlocked(p, 'quarry')).toBe(false);
    expect(isMapUnlocked(medal(p, 'frostfen', 'medium'), 'quarry')).toBe(true);
    const l = mapLock(newProfile(), 'quarry');
    expect(l.unlocked).toBe(false);
    expect(l.text).toContain('level 12');
    expect(l.text).toContain('Frostfen Crossing');
  });
  it('unlockAll oeffnet alles; unlockedMaps listet die offenen', () => {
    expect(unlockedMaps(newProfile()).map((m) => m.id)).toEqual(['meadow']);
    expect(unlockedMaps({ ...newProfile(), settings: { volume: 70, unlockAll: true } })).toHaveLength(3);
  });
});

describe('Modus-Freischaltung (je Karte)', () => {
  it('Standard immer frei; Primary Only ab Easy-, Specialists/No Hero ab Medium-, Half Cash/Deflation ab Hard-Medaille derselben Karte', () => {
    const p0 = newProfile();
    expect(MODE_IDS).toEqual(['standard', 'primary-only', 'specialists-only', 'no-hero', 'half-cash', 'deflation']);
    expect(isModeUnlocked(p0, 'frostfen', 'standard')).toBe(true);
    for (const m of MODE_IDS.slice(1)) expect(isModeUnlocked(p0, 'frostfen', m)).toBe(false);
    const easy = medal(p0, 'frostfen', 'easy');
    expect(isModeUnlocked(easy, 'frostfen', 'primary-only')).toBe(true);
    expect(isModeUnlocked(easy, 'frostfen', 'no-hero')).toBe(false);
    const med = medal(p0, 'frostfen', 'medium');
    for (const m of ['primary-only', 'specialists-only', 'no-hero'] as const) expect(isModeUnlocked(med, 'frostfen', m)).toBe(true);
    expect(isModeUnlocked(med, 'frostfen', 'half-cash')).toBe(false);
    const hard = medal(p0, 'frostfen', 'hard');
    for (const m of MODE_IDS) expect(isModeUnlocked(hard, 'frostfen', m)).toBe(true);
    // andere Karte bleibt zu
    expect(isModeUnlocked(hard, 'meadow', 'primary-only')).toBe(false);
    expect(modeLock(p0, 'meadow', 'deflation').text).toContain('Hard');
  });
  it('Modus-Medaillen schalten andere Modi nicht frei', () => {
    const p = { ...newProfile(), modeMedals: { meadow: { 'primary-only': { easy: true, medium: true, hard: true } } } };
    expect(isModeUnlocked(p, 'meadow', 'half-cash')).toBe(false);
  });
  it('Modus-Metadaten: Bonus +20 % ausser Standard', () => {
    expect(MODE_META.standard.bonusBp).toBe(0);
    for (const m of MODE_IDS.slice(1)) expect(MODE_META[m].bonusBp).toBe(2000);
    expect(MODE_META.deflation.name).toBe('Deflation');
  });
});

describe('Medaillen und Bestleistung je Karte x Schwierigkeit x Modus', () => {
  it('Sieg im Standard auf Frostfen: Medaille nur dort, newMedal, Meadow unberuehrt', () => {
    const p = withLevel(8, medal(newProfile(), 'meadow', 'easy', 'medium'));
    const r = applyMatch(p, res({ map: 'frostfen', roundsCleared: 25 }));
    expect(r.report.newMedal).toBe('medium');
    expect(medalsOf(r.profile, 'frostfen')).toEqual({ easy: false, medium: true, hard: false });
    expect(r.profile.medals.meadow).toEqual({ easy: true, medium: true, hard: false });
    expect(r.profile.modeMedals).toEqual({});
  });
  it('Sieg in einem Modus: Medaille in modeMedals, Standard unberuehrt, Modus unterscheidet sich', () => {
    const r = applyMatch(newProfile(), res({ mode: 'no-hero' }));
    expect(r.report.newMedal).toBe('medium');
    expect(r.report.mode).toBe('no-hero');
    expect(medalsOf(r.profile, 'meadow', 'no-hero').medium).toBe(true);
    expect(medalsOf(r.profile, 'meadow').medium).toBe(false);
    expect(medalsOf(r.profile, 'meadow', 'half-cash').medium).toBe(false);
    expect(r.profile.medals).toEqual({});
    expect(medalCount(r.profile)).toBe(0);
    expect(allMedalCount(r.profile)).toBe(1);
    // zweiter Sieg gleicher Kombination: keine neue Medaille
    const r2 = applyMatch(r.profile, res({ matchId: 'm2', mode: 'no-hero' }));
    expect(r2.report.newMedal).toBeNull();
    // anderer Modus: neue Medaille
    expect(applyMatch(r.profile, res({ matchId: 'm3', mode: 'half-cash' })).report.newMedal).toBe('medium');
  });
  it('Niederlage gibt keine Medaille, aber Bestleistung je Modus getrennt', () => {
    let p = newProfile();
    p = applyMatch(p, res({ won: false, roundsCleared: 12, livesLost: 150 })).profile;
    p = applyMatch(p, res({ matchId: 'b', won: false, roundsCleared: 9, livesLost: 150, mode: 'deflation' })).profile;
    expect(bestOf(p, 'meadow', 'medium')).toEqual({ round: 12, livesLost: 150 });
    expect(bestOf(p, 'meadow', 'medium', 'deflation')).toEqual({ round: 9, livesLost: 150 });
    expect(bestOf(p, 'meadow', 'medium', 'half-cash')).toBeUndefined();
    expect(allMedalCount(p)).toBe(0);
    // besser: mehr Runden; gleiche Runden: weniger verlorene Leben
    const a = applyMatch(p, res({ matchId: 'c', won: false, roundsCleared: 12, livesLost: 100 }));
    expect(a.report.newBest).toBe(true);
    expect(bestOf(a.profile, 'meadow', 'medium')!.livesLost).toBe(100);
    const b = applyMatch(a.profile, res({ matchId: 'd', won: false, roundsCleared: 11, livesLost: 1 }));
    expect(b.report.newBest).toBe(false);
  });
  it('Wissenspunkte zaehlen nur Standard-Medaillen (je Karte und Schwierigkeit eine)', () => {
    let p = withLevel(3);
    expect(knowledgePoints(p).total).toBe(2);
    p = applyMatch(p, res({ map: 'frostfen', difficulty: 'easy' })).profile;
    p = applyMatch(p, res({ matchId: 'x', mode: 'no-hero' })).profile;
    expect(knowledgePoints(p).total).toBe(2 + 1);
  });
  it('Idempotent je matchId (auch mit Modus)', () => {
    const a = applyMatch(newProfile(), res({ mode: 'half-cash' }));
    const b = applyMatch(a.profile, res({ mode: 'half-cash' }));
    expect(b.report.duplicate).toBe(true);
    expect(b.profile).toBe(a.profile);
  });
});

describe('Belohnungsfaktoren', () => {
  it('Faktoren je Karte und Modus', () => {
    expect(rewardFactors('meadow')).toEqual({ xpBp: 10000, embersBp: 10000, modeBp: 0 });
    expect(rewardFactors('frostfen')).toEqual({ xpBp: 11500, embersBp: 12000, modeBp: 0 });
    expect(rewardFactors('quarry', 'deflation')).toEqual({ xpBp: 13000, embersBp: 14000, modeBp: 2000 });
  });
  it('XP: Meadow unveraendert, Frostfen x1,15, Quarry x1,3, Modus +20 %', () => {
    const base = matchXp(20, 'medium', true);
    expect(base).toBe(matchXp(20, 'medium', true, 0, { maxRound: 20, mapBp: 10000, modeBp: 0 }));
    const f = matchXp(20, 'medium', true, 0, { maxRound: 25, mapBp: 11500 });
    expect(f).toBe(Math.round(base * 1.15));
    expect(matchXp(20, 'medium', true, 0, { mapBp: 13000 })).toBe(Math.round(base * 1.3));
    expect(matchXp(20, 'medium', true, 0, { modeBp: 2000 })).toBe(Math.round(base * 1.2));
    expect(matchXp(20, 'medium', true, 0, { mapBp: 13000, modeBp: 2000 })).toBe(Math.round(base * 1.3 * 1.2));
  });
  it('XP: Freeplay beginnt nach der letzten Runde der Karte', () => {
    const a = matchXp(25, 'medium', false, 0, { maxRound: 25 });
    const b = matchXp(25, 'medium', false, 0, { maxRound: 20 });
    expect(a).toBeGreaterThan(b);
  });
  it('Embers: Meadow wie bisher (54 + Sieg), Karte und Modus skalieren, Level-Ups nicht', () => {
    expect(matchEmbers(20, 'medium', true, false, 0)).toEqual({ rounds: 54, win: 30, medal: 0, levelUp: 0, pouch: 0, rush: 0 });
    const f = matchEmbers(25, 'medium', true, false, 2, 0, false, { maxRound: 25, mapBp: 12000 });
    let rounds = 0;
    for (let r = 1; r <= 25; r++) rounds += 1 + Math.floor(r / 5);
    expect(f.rounds).toBe(rounds);
    expect(f.bonus).toBe(Math.floor((rounds + 30) * 1.2) - (rounds + 30));
    expect(f.levelUp).toBe(50);
    const q = matchEmbers(30, 'hard', true, true, 0, 0, false, { maxRound: 30, mapBp: 14000, modeBp: 2000 });
    const core = q.rounds + q.win + q.medal;
    expect(q.bonus).toBe(Math.floor(core * 1.4 * 1.2) - core);
  });
  it('applyMatch rechnet Karte und Modus ein und meldet die Faktoren', () => {
    const plain = applyMatch(newProfile(), res({ matchId: 'p' }));
    const fr = applyMatch(newProfile(), res({ matchId: 'f', map: 'frostfen', roundsCleared: 25 }));
    expect(fr.report.rewardBp).toEqual({ xp: 11500, embers: 12000, mode: 0 });
    expect(fr.report.xpGained).toBe(matchXp(25, 'medium', true, 0, { maxRound: 25, mapBp: 11500 }));
    expect(fr.report.xpGained).toBeGreaterThan(plain.report.xpGained);
    const mo = applyMatch(newProfile(), res({ matchId: 'm', mode: 'deflation' }));
    expect(mo.report.xpGained).toBe(matchXp(20, 'medium', true, 0, { modeBp: 2000 }));
    expect(mo.report.embers.bonus).toBeGreaterThan(0);
    expect(mo.report.embersGained).toBe(mo.profile.embers - newProfile().embers);
  });
  it('Scholar, Ember Pouch und Rush wirken weiter zusammen mit den neuen Faktoren', () => {
    const p = { ...withLevel(30), knowledge: ['ember-pouch'] };
    const e = applyMatch(p, res({ map: 'quarry', roundsCleared: 30 }));
    const no = applyMatch(withLevel(30), res({ map: 'quarry', roundsCleared: 30 }));
    expect(e.report.embers.pouch).toBeGreaterThan(0);
    expect(e.report.embersGained).toBeGreaterThan(no.report.embersGained);
  });
});

describe('Neu geoeffnet im Bericht', () => {
  it('Medium-Sieg auf Meadow oeffnet Frostfen und Standard-Modi dort nicht (nur Meadow)', () => {
    const r = applyMatch(newProfile(), res());
    expect(r.report.unlockedMaps).toEqual(['frostfen']);
    expect(r.report.unlockedModes.map((m) => `${m.map}:${m.mode}`).sort()).toEqual(['meadow:no-hero', 'meadow:primary-only', 'meadow:specialists-only']);
  });
  it('Level-Up auf 8 oeffnet Frostfen', () => {
    const p = { ...newProfile(), playerXp: xpForLevel(8) - 1 };
    const r = applyMatch(p, res({ won: false, roundsCleared: 5, difficulty: 'easy' }));
    expect(r.report.levelAfter).toBeGreaterThanOrEqual(8);
    expect(r.report.unlockedMaps).toContain('frostfen');
    expect(r.report.unlocks.some((u) => u.kind === 'map' && u.id === 'frostfen')).toBe(true);
  });
});

describe('Migration und Speichern', () => {
  it('Profil aus Runde 14 (ohne modeMedals/modeBest) laedt ohne Reset, Meadow-Medaillen und Bestleistung bleiben', () => {
    const old = JSON.parse(JSON.stringify(withLevel(10, { ...newProfile(), medals: { meadow: { easy: true, medium: true, hard: false } }, best: { meadow: { medium: { round: 20, livesLost: 4 } } } })));
    delete old.modeMedals;
    delete old.modeBest;
    const r = loadProfile(old);
    expect(r.reset).toBe(false);
    expect(r.profile.medals.meadow).toEqual({ easy: true, medium: true, hard: false });
    expect(bestOf(r.profile, 'meadow', 'medium')).toEqual({ round: 20, livesLost: 4 });
    expect(r.profile.modeMedals).toEqual({});
    expect(r.profile.modeBest).toEqual({});
    expect(medalsOf(r.profile, 'frostfen')).toEqual({ easy: false, medium: false, hard: false });
    expect(isMapUnlocked(r.profile, 'frostfen')).toBe(true);
  });
  it('Export/Import erhaelt Modus-Medaillen', () => {
    const a = applyMatch(newProfile(), res({ mode: 'primary-only', map: 'quarry', difficulty: 'hard' }));
    const out = importProfile(exportProfile(a.profile, '2026-10-10T00:00:00Z'));
    expect(out.ok).toBe(true);
    if (out.ok) expect(medalsOf(out.profile, 'quarry', 'primary-only').hard).toBe(true);
  });
  it('Match-Ergebnis ohne mode = Standard (altes Format)', () => {
    const r = applyMatch(newProfile(), res());
    expect(r.report.mode).toBe('standard');
    expect(r.report.map).toBe('meadow');
  });
  it('matchOptions traegt den Modus', () => {
    expect(matchOptions(newProfile()).mode).toBe('standard');
    expect(matchOptions(newProfile(), 'no-hero').mode).toBe('no-hero');
  });
});
