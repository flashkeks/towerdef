import { describe, expect, it } from 'vitest';
import { newProfile, toMetaResult, applyMatch, xpForLevel, type Profile, type MatchOutcome } from '../src/meta';
import { readyUnlocks } from '../src/screens/home';
import { legalTiers } from '../src/screens/towers';
import { lockInfo } from '../src/screens/app';

const outcome = (o: Partial<MatchOutcome> = {}): MatchOutcome => ({
  won: false, round: 12, difficulty: 'medium', livesLeft: 100, pops: { ranger: 500, wren: 200 }, upgrades: [
    { tower: 'ranger', path: 0, tier: 1 }, { tower: 'ranger', path: 0, tier: 2 }, { tower: 'bombardier', path: 1, tier: 1 }, { tower: 'wren', path: 0, tier: 1 },
  ], ...o,
});
const ctx = { matchId: 'id-1', map: 'meadow', startLives: 150 };

describe('MatchOutcome -> MatchResult', () => {
  it('Niederlage in Runde 12 = 11 Runden geschafft, Leben und Stufen je Turm', () => {
    const r = toMetaResult(outcome(), ctx);
    expect(r.roundsCleared).toBe(11);
    expect(r.livesLost).toBe(50);
    expect(r.tierBuys).toEqual({ ranger: 2, bombardier: 1 });
    expect(r.pops).toEqual({ ranger: 500, wren: 200 });
    expect(r.matchId).toBe('id-1');
  });
  it('Sieg = 20 Runden, nie mehr als MAX_ROUND aus `round`', () => {
    expect(toMetaResult(outcome({ won: true, round: 20 }), ctx).roundsCleared).toBe(20);
    expect(toMetaResult(outcome({ won: true, round: 25 }), ctx).roundsCleared).toBe(20);
  });
  it('exakte Felder von P3 gewinnen; Niederlage in Runde 1 = 0 Runden', () => {
    const r = toMetaResult(outcome({ roundsCleared: 7, livesLost: 9, matchId: 'x' }), ctx);
    expect([r.roundsCleared, r.livesLost, r.matchId]).toEqual([7, 9, 'x']);
    expect(toMetaResult(outcome({ round: 1 }), ctx).roundsCleared).toBe(0);
    expect(toMetaResult(outcome({ livesLeft: 999 }), ctx).livesLost).toBe(0);
  });
  it('Ergebnis laesst sich verbuchen, doppelt nicht', () => {
    const r = toMetaResult(outcome({ won: true, round: 20 }), ctx);
    const a = applyMatch(newProfile(), r);
    expect(a.report.xpGained).toBe(2970);
    expect(applyMatch(a.profile, r).report.duplicate).toBe(true);
  });
});

describe('Bildschirm-Logik', () => {
  it('readyUnlocks zaehlt freischaltbare Stufen aus dem Vorrat (billigste zuerst)', () => {
    const p: Profile = newProfile(); // Startguthaben 250 je Turm, nur Ranger frei
    expect(readyUnlocks(p)).toBe(2); // 100 + 100 (Stufe 1 zweier Pfade); Rest 50
    expect(readyUnlocks({ ...p, towerXp: { ...p.towerXp, ranger: 99 } })).toBe(0);
    expect(readyUnlocks({ ...p, playerXp: xpForLevel(4) })).toBe(6);
    expect(readyUnlocks({ ...p, settings: { ...p.settings, unlockAll: true } })).toBe(0);
  });
  it('legalTiers: Hauptpfad voll, ein Nebenpfad bis 2, der dritte 0', () => {
    expect(legalTiers([5, 5, 5])).toEqual([5, 2, 0]);
    expect(legalTiers([1, 4, 3])).toEqual([0, 4, 2]);
    expect(legalTiers([0, 0, 0])).toEqual([0, 0, 0]);
  });
  it('lockInfo nennt Freischalt-Level fuer gesperrte Tuerme', () => {
    expect(lockInfo(newProfile())).toEqual({ bombardier: 'Unlocks at level 2', frostcaller: 'Unlocks at level 4', wren: 'Unlocks at level 3' });
    expect(lockInfo({ ...newProfile(), playerXp: xpForLevel(4) })).toEqual({});
  });
});
