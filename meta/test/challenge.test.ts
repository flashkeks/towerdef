/** Runde 16 E (10.10.2026): Tages-Challenge, Belohnung einmal je Tag, Bestwerte. */
import { describe, expect, it } from 'vitest';
import { createGame, decodeChallenge, encodeChallenge } from '../../sim/src/index';
import { DAILY_EMBERS, applyChallenge, dailyChallenge, dailyStatus, isDay, loadProfile, newProfile, utcDay, MAP_IDS } from '../src/index';

const day = (i: number): string => new Date(Date.UTC(2026, 9, 10 + i)).toISOString().slice(0, 10);

describe('Tages-Challenge: Generator', () => {
  it('gleicher Tag gleiche Regeln, ohne Zustand', () => {
    for (let i = 0; i < 40; i++) expect(dailyChallenge(day(i))).toEqual(dailyChallenge(day(i)));
  });
  it('gueltig, Code-Rundreise, spielbar angelegt, Karte aus der Liste', () => {
    const names = new Set<string>(), maps = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const d = dailyChallenge(day(i));
      expect(decodeChallenge(d.code)).toEqual(d.rules);
      expect(encodeChallenge(d.rules)).toBe(d.code);
      expect(MAP_IDS).toContain(d.rules.map);
      expect(d.rules.noPowers && d.rules.noKnowledge).toBe(true);
      expect(d.rules.endRound - d.rules.startRound).toBeGreaterThanOrEqual(9);
      const g = createGame({ map: d.rules.map, difficulty: d.rules.difficulty, seed: d.rules.seed, rules: d.rules });
      expect(g.state.round).toBe(d.rules.startRound - 1);
      names.add(d.name);
      maps.add(d.rules.map);
    }
    expect(names.size).toBeGreaterThan(5);
    expect(maps.size).toBe(MAP_IDS.length);
  });
  it('aufeinanderfolgende Tage unterscheiden sich', () => {
    expect(new Set(Array.from({ length: 30 }, (_, i) => dailyChallenge(day(i)).code)).size).toBe(30);
  });
  it('Tag: Format und UTC', () => {
    expect(utcDay(Date.UTC(2026, 9, 10, 23, 59))).toBe('2026-10-10');
    expect(utcDay(Date.UTC(2026, 9, 11, 0, 1))).toBe('2026-10-11');
    expect(isDay('2026-02-30')).toBe(false);
    expect(() => dailyChallenge('heute')).toThrow();
  });
});

describe('Tages-Challenge: Belohnung und Bestwerte', () => {
  const win = (id: string, over: Record<string, unknown> = {}) => ({ matchId: id, kind: 'daily' as const, key: '2026-10-10', won: true, roundsCleared: 25, spent: 5000, livesLost: 3, ticks: 40000, ...over });
  it('Embers genau einmal je Tag', () => {
    const p = newProfile();
    const a = applyChallenge(p, win('m1'), '2026-10-10');
    expect(a.report.embersGained).toBe(DAILY_EMBERS);
    expect(a.profile.embers).toBe(p.embers + DAILY_EMBERS);
    expect(dailyStatus(a.profile, '2026-10-10').claimed).toBe(true);
    const b = applyChallenge(a.profile, win('m2', { spent: 4000 }), '2026-10-10');
    expect(b.report.embersGained).toBe(0);
    expect(b.profile.embers).toBe(a.profile.embers);
    expect(b.report.best.spent).toBe(4000);
    expect(b.report.best.plays).toBe(2);
    // naechster Tag zahlt wieder
    const c = applyChallenge(b.profile, win('m3', { key: '2026-10-11' }), '2026-10-11');
    expect(c.report.embersGained).toBe(DAILY_EMBERS);
  });
  it('keine Belohnung bei Niederlage, altem Tag oder Doppelmeldung', () => {
    const p = newProfile();
    expect(applyChallenge(p, win('m1', { won: false }), '2026-10-10').report.embersGained).toBe(0);
    expect(applyChallenge(p, win('m1'), '2026-10-12').report.embersGained).toBe(0);
    const a = applyChallenge(p, win('m1'), '2026-10-10');
    const again = applyChallenge(a.profile, win('m1'), '2026-10-10');
    expect(again.report.duplicate).toBe(true);
    expect(again.profile).toBe(a.profile);
  });
  it('Bestwerte: Minimum bei Siegen, Runden hoechste', () => {
    let p = applyChallenge(newProfile(), win('a', { won: false, roundsCleared: 12 }), '2026-10-10').profile;
    p = applyChallenge(p, win('b', { spent: 9000, livesLost: 1, ticks: 50000 }), '2026-10-10').profile;
    p = applyChallenge(p, win('c', { spent: 7000, livesLost: 5, ticks: 30000 }), '2026-10-10').profile;
    expect(p.challenges.daily['2026-10-10']).toEqual({ plays: 3, won: true, rounds: 25, spent: 7000, livesLost: 1, ticks: 30000 });
  });
  it('alte Profile ohne Feld laden weiter; Tage werden begrenzt', () => {
    const raw = JSON.parse(JSON.stringify(newProfile()));
    delete raw.challenges;
    const l = loadProfile(raw);
    expect(l.reset).toBe(false);
    expect(l.profile.challenges).toEqual({ dailyClaimed: '', daily: {}, custom: {} });
    let p = newProfile();
    for (let i = 0; i < 45; i++) p = applyChallenge(p, win(`x${i}`, { key: day(i) }), day(i)).profile;
    expect(Object.keys(p.challenges.daily)).toHaveLength(30);
    expect(p.challenges.daily[day(44)]).toBeDefined();
    expect(p.challenges.daily[day(0)]).toBeUndefined();
  });
  it('custom: Bestwert je Code', () => {
    const code = encodeChallenge(dailyChallenge('2026-10-10').rules);
    const r = applyChallenge(newProfile(), { matchId: 'q', kind: 'custom', key: code, won: false, roundsCleared: 7, spent: 100, livesLost: 9, ticks: 1000 });
    expect(r.profile.challenges.custom[code].rounds).toBe(7);
    expect(r.report.embersGained).toBe(0);
  });
});
