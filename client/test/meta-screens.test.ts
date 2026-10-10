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
  it('Niederlage in Runde 12 = 11 Runden geschafft, Leben verloren, Turm-XP-Felder aus dem Match werden durchgereicht', () => {
    const r = toMetaResult(outcome(), ctx);
    expect(r.roundsCleared).toBe(11);
    expect(r.livesLost).toBe(50);
    expect(r.towerXp).toBeUndefined();
    const full = toMetaResult(outcome({ towerXp: { ranger: 5, bombardier: 0, frostcaller: 9, longshot: 0, market: 0, thornweaver: 0, alchemist: 0 }, towerTiers: { ranger: [1, 0, 0], bombardier: [0, 0, 0], frostcaller: [0, 0, 0], longshot: [0, 0, 0], market: [0, 0, 0], thornweaver: [0, 0, 0], alchemist: [0, 0, 0] }, towerXpGained: { ranger: 40, bombardier: 0, frostcaller: 9, longshot: 0, market: 0, thornweaver: 0, alchemist: 0 } }), ctx);
    expect(full.towerXp).toEqual({ ranger: 5, bombardier: 0, frostcaller: 9, longshot: 0, market: 0, thornweaver: 0, alchemist: 0 });
    expect(full.towerTiers?.ranger).toEqual([1, 0, 0]);
    expect(full.towerXpGained?.ranger).toBe(40);
    expect(r.pops).toEqual({ ranger: 500, wren: 200 });
    expect(r.matchId).toBe('id-1');
  });
  it('Sieg = Endrunde der Schwierigkeit (Runde 15b: Medium 60), nie mehr aus `round`', () => {
    expect(toMetaResult(outcome({ won: true, round: 60 }), ctx).roundsCleared).toBe(60);
    expect(toMetaResult(outcome({ won: true, round: 65 }), ctx).roundsCleared).toBe(60);
    // Freeplay: der Client liefert die exakte Zahl (state.roundsCleared), auch ueber der Endrunde
    expect(toMetaResult(outcome({ won: true, round: 70, roundsCleared: 69 }), ctx).roundsCleared).toBe(69);
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
    expect(a.report.xpGained).toBe(738); // 20 von 60 Runden, gedaempft (Runde 15b)
    expect(applyMatch(a.profile, r).report.duplicate).toBe(true);
  });
});

describe('Bildschirm-Logik', () => {
  it('readyUnlocks zaehlt freischaltbare Stufen aus dem Vorrat (billigste zuerst)', () => {
    const p: Profile = newProfile(); // Startguthaben 100 je Turm, nur Ranger frei
    expect(readyUnlocks(p)).toBe(1); // genau Stufe 1 eines Pfads
    expect(readyUnlocks({ ...p, towerXp: { ...p.towerXp, ranger: 99 } })).toBe(0);
    expect(readyUnlocks({ ...p, playerXp: xpForLevel(4) })).toBe(3);
    expect(readyUnlocks({ ...p, settings: { ...p.settings, unlockAll: true } })).toBe(0);
  });
  it('legalTiers: Hauptpfad voll, ein Nebenpfad bis 2, der dritte 0', () => {
    expect(legalTiers([5, 5, 5])).toEqual([5, 2, 0]);
    expect(legalTiers([1, 4, 3])).toEqual([0, 4, 2]);
    expect(legalTiers([0, 0, 0])).toEqual([0, 0, 0]);
  });
  it('lockInfo nennt Freischalt-Level fuer gesperrte Tuerme', () => {
    expect(lockInfo(newProfile())).toEqual({ bombardier: 'Unlocks at level 2', frostcaller: 'Unlocks at level 4', longshot: 'Unlocks at level 5', market: 'Unlocks at level 6', thornweaver: 'Unlocks at level 7', alchemist: 'Unlocks at level 9', wren: 'Unlocks at level 3' });
    expect(lockInfo({ ...newProfile(), playerXp: xpForLevel(4) })).toEqual({ longshot: 'Unlocks at level 5', market: 'Unlocks at level 6', thornweaver: 'Unlocks at level 7', alchemist: 'Unlocks at level 9' });
    expect(lockInfo({ ...newProfile(), playerXp: xpForLevel(9) })).toEqual({});
  });
});
