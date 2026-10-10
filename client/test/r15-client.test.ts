import { describe, expect, it } from 'vitest';
import { ENEMY_LOOK, BOSS_NAMES, isBoss, spriteStage } from '../src/match/enemy-info';
import { mapGeometry } from '../src/match/map-info';
import { waveRows, warnings, ENEMY_NAMES, WARNING_TEXT, type RoundPreview } from '../src/powers/wave';
import { toMetaResult, type MatchOutcome } from '../src/meta/types';
import { hasKey } from '../src/i18n/t';
import { createGame, DATA, MODES, modeAllows } from '../src/sim';
import { MAPS, applyMatch, mapLock, newProfile, modeLock, rewardFactors, xpForLevel, type Profile } from '../src/meta';
import { mapLockText, countModeMedals } from '../src/screens/home';

const ALL = Object.keys(DATA.enemies) as (keyof typeof ENEMY_LOOK)[];

describe('Gegner-Darstellung (Runde 15 C)', () => {
  it('jeder Gegnertyp hat Darstellungsdaten und einen Namen', () => {
    for (const t of ALL) {
      expect(ENEMY_LOOK[t], t).toBeTruthy();
      expect(ENEMY_NAMES[t], t).toBeTruthy();
    }
    expect(ALL).toHaveLength(17);
    for (const t of ['cruiser', 'duskrunner', 'dreadnought'] as const) expect(ENEMY_LOOK[t].barAlways, t).toBe(true);
  });
  it('Bosse und Blimps zeigen den Lebensbalken immer, Gloomship hat einen eigenen Schatten', () => {
    for (const t of ['leviathan', 'wyrm', 'colossus', 'gloomship'] as const) expect(ENEMY_LOOK[t].barAlways, t).toBe(true);
    expect(ENEMY_LOOK.gloomship.shadow).toEqual([0, 0]);
    expect(isBoss('wyrm') && isBoss('colossus') && isBoss('leviathan') && !isBoss('gloomship')).toBe(true);
    expect(BOSS_NAMES.wyrm).toBe('Frost Wyrm');
  });
  it('Gloomship-Schadensstufen kommen aus den Lebenspunkten, die anderen aus der Sim', () => {
    const g = (hp: number) => spriteStage({ type: 'gloomship', hp, maxHp: 200, damageStage: 0 });
    expect([g(200), g(120), g(60)]).toEqual([0, 1, 2]);
    expect(spriteStage({ type: 'crystal', hp: 5, maxHp: 20, damageStage: 3 })).toBe(3);
  });
});

describe('Wellen-Vorschau mit Merkmalen', () => {
  const pv = (o: Partial<RoundPreview>): RoundPreview => ({ round: 1, groups: [], rbe: 0, hasCamo: false, hasArmor: false, hasEmber: false, hasBoss: false, hasFrostling: false, hasBlimp: false, hasRegrow: false, hasFortified: false, ...o });
  it('Regrow und Fortified trennen Zeilen gleichen Typs', () => {
    const rows = waveRows(pv({ groups: [
      { type: 'green', n: 4, camo: false, regrow: false, fortified: false },
      { type: 'green', n: 3, camo: false, regrow: true, fortified: false },
      { type: 'brute', n: 2, camo: false, regrow: false, fortified: true },
      { type: 'brute', n: 1, camo: false, regrow: false, fortified: true },
      { type: 'brute', n: 5, camo: false, regrow: false, fortified: false },
    ] }));
    expect(rows.map((r) => `${r.type}${r.regrow ? '+rg' : ''}${r.fortified ? '+fo' : ''}:${r.n}`)).toEqual(['green:4', 'green+rg:3', 'brute+fo:3', 'brute:5']);
  });
  it('Warnungen fuer Frostling, Blimp, Regrow, Fortified (mit englischem Text)', () => {
    const w = warnings(pv({ hasBoss: true, hasFrostling: true, hasBlimp: true, hasRegrow: true, hasFortified: true }));
    expect(w).toEqual(['boss', 'frostling', 'blimp', 'regrow', 'fortified']);
    for (const k of w) expect(WARNING_TEXT[k].tip.length).toBeGreaterThan(20);
  });
  it('die echte Vorschau der Karten meldet die neuen Merkmale', () => {
    const g = createGame({ map: 'frostfen', difficulty: 'medium', seed: 1 });
    const flags = Array.from({ length: g.info.maxRound }, (_, i) => g.roundPreview(i + 1)!);
    expect(flags.some((p) => p.hasFrostling)).toBe(true);
    expect(flags.some((p) => p.hasBlimp)).toBe(true);
    expect(flags.some((p) => p.hasRegrow)).toBe(true);
    const q = createGame({ map: 'quarry', difficulty: 'medium', seed: 1 });
    expect(Array.from({ length: q.info.maxRound }, (_, i) => q.roundPreview(i + 1)!).some((p) => p.hasFortified)).toBe(true);
  });
});

describe('Kartenwege', () => {
  it('Frostfen hat zwei Aeste, Meadow und Quarry einen; Ausgang im Bild', () => {
    expect(mapGeometry('frostfen').paths).toHaveLength(2);
    expect(mapGeometry('meadow').paths).toHaveLength(1);
    expect(mapGeometry('quarry').paths).toHaveLength(1);
    expect(mapGeometry('meadow').exit).toEqual({ x: 628, y: 160 });
    for (const m of ['meadow', 'frostfen', 'quarry']) {
      const e = mapGeometry(m).exit;
      expect(e.x >= 0 && e.x <= 640 && e.y >= 0 && e.y <= 360, m).toBe(true);
    }
  });
});

describe('Kartenwahl und Modi (Meta im Client)', () => {
  const p0 = newProfile('2026-10-10T00:00:00Z');
  it('Schloss-Text nennt Level und Medaille auf Englisch', () => {
    const f = MAPS.find((m) => m.id === 'frostfen')!;
    expect(mapLockText(f)).toBe('Reach level 8 or earn Medium on Lanternfall Meadow');
    expect(mapLockText(MAPS[0])).toBe('');
    expect(mapLockText(MAPS.find((m) => m.id === 'quarry')!)).toBe('Reach level 12 or earn Medium on Frostfen Crossing');
  });
  it('neue Spieler: nur Meadow offen; Level 8 oeffnet Frostfen; Medium-Medaille ebenso', () => {
    expect([mapLock(p0, 'meadow').unlocked, mapLock(p0, 'frostfen').unlocked, mapLock(p0, 'quarry').unlocked]).toEqual([true, false, false]);
    const lv8: Profile = { ...p0, playerXp: xpForLevel(8) };
    expect(mapLock(lv8, 'frostfen').unlocked).toBe(true);
    const med: Profile = { ...p0, medals: { meadow: { easy: true, medium: true, hard: false } } };
    expect(mapLock(med, 'frostfen').unlocked).toBe(true);
    expect(mapLock(med, 'quarry').unlocked).toBe(false);
  });
  it('Modi sind je Karte gesperrt, bis die Standard-Medaille da ist', () => {
    expect(modeLock(p0, 'meadow', 'standard').unlocked).toBe(true);
    expect(modeLock(p0, 'meadow', 'primary-only').unlocked).toBe(false);
    expect(modeLock(p0, 'meadow', 'primary-only').text).toMatch(/Easy/);
    const p1: Profile = { ...p0, medals: { meadow: { easy: true, medium: false, hard: false } } };
    expect(modeLock(p1, 'meadow', 'primary-only').unlocked).toBe(true);
    expect(modeLock(p1, 'frostfen', 'primary-only').unlocked).toBe(false);
  });
  it('Modus-Medaillen werden je Karte gezaehlt', () => {
    const p1: Profile = { ...p0, modeMedals: { frostfen: { deflation: { easy: true, medium: true, hard: false }, 'no-hero': { easy: true, medium: false, hard: false } } } };
    expect(countModeMedals(p1, 'frostfen')).toBe(3);
    expect(countModeMedals(p1, 'meadow')).toBe(0);
  });
  it('Ergebnis geht mit Karte und Modus an die Meta, Medaille landet im Modus', () => {
    const o: MatchOutcome = { won: true, round: 25, difficulty: 'easy', livesLeft: 150, pops: { ranger: 100 }, roundsCleared: 25 };
    const res = toMetaResult(o, { matchId: 'm1', map: 'frostfen', mode: 'primary-only', startLives: 200 });
    expect(res).toMatchObject({ map: 'frostfen', mode: 'primary-only', roundsCleared: 25, livesLost: 50 });
    const { profile, report } = applyMatch(p0, res);
    expect(report.map).toBe('frostfen');
    expect(report.mode).toBe('primary-only');
    expect(profile.modeMedals.frostfen?.['primary-only']?.easy).toBe(true);
    expect(profile.medals.frostfen?.easy).toBeFalsy();
    expect(report.rewardBp.mode).toBe(2000);
    expect(rewardFactors('frostfen', 'primary-only').xpBp).toBe(11500);
  });
  it('Sieg ohne roundsCleared zaehlt bis zur letzten Runde der Karte (nicht 20)', () => {
    const o: MatchOutcome = { won: true, round: 30, difficulty: 'easy', livesLeft: 100, pops: {} };
    expect(toMetaResult(o, { matchId: 'm2', map: 'quarry', startLives: 200 }).roundsCleared).toBe(30);
  });
});

describe('Modus-Regeln im Match', () => {
  it('Primary Only und No Hero sperren in der Sim; Deflation startet spaet ohne Powers', () => {
    expect(modeAllows('primary-only', 'longshot')).toBe(false);
    expect(modeAllows('primary-only', 'ranger')).toBe(true);
    expect(modeAllows('no-hero', 'wren')).toBe(false);
    expect(MODES.deflation.powers).toBe(false);
    const g = createGame({ map: 'quarry', mode: 'deflation', difficulty: 'medium', seed: 1 });
    expect(g.info.baseRound).toBe(49); // Runde 15b: Medium endet bei R60, Deflation startet bei R50
    expect(g.state.cash).toBe(20000);
  });
  it('Texte fuer Modus-Sperren und Boss-Banner existieren', () => {
    for (const k of ['reason.mode-locked', 'powers.off', 'match.bossIncoming']) expect(hasKey(k), k).toBe(true);
  });
});
