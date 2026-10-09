import { describe, expect, it } from 'vitest';
import { commitHit, towerGapMs, towerLoudness, towerPitch, topTier, windowGain, type Hit } from '../src/audio/tower-vol';
import { DEFAULT_AUDIO } from '../src/audio/settings';
import { MENU_THEMES } from '../src/audio/recipes-ui';
import { AudioEngine } from '../src/audio/engine';
import type { TowerState } from '../src/sim';

describe('Turm-Lautstaerke nach Stufe (Runde 12b)', () => {
  it('hoechste Stufe ueber alle Pfade', () => {
    expect(topTier([0, 0, 0])).toBe(0);
    expect(topTier([2, 5, 1])).toBe(5);
    expect(topTier([9, 0, 0])).toBe(5);
  });
  it('Stufe 0-2 rund -60 %, 3-4 mittel, 5 voll, streng steigend', () => {
    for (const t of [0, 1, 2]) expect(towerLoudness(t)).toBeCloseTo(0.4, 5);
    expect(towerLoudness(3)).toBeGreaterThan(towerLoudness(2));
    expect(towerLoudness(4)).toBeGreaterThan(towerLoudness(3));
    expect(towerLoudness(5)).toBeGreaterThan(towerLoudness(4));
    expect(towerLoudness(5)).toBeGreaterThanOrEqual(1);
    expect(towerLoudness(1)).toBeLessThan(0.5);
  });
  it('hohe Stufen schiessen dichter und klingen tiefer', () => {
    expect(towerGapMs(0)).toBeGreaterThan(towerGapMs(3));
    expect(towerGapMs(3)).toBeGreaterThan(towerGapMs(5));
    expect(towerPitch(5)).toBeLessThan(towerPitch(0));
  });
  it('Summenbegrenzung: das Fenster deckelt die Lautstaerke', () => {
    const rec: Hit[] = [];
    let total = 0;
    for (let i = 0; i < 20; i++) { const g = windowGain(rec, 1000 + i, 0.4); if (g > 0) { commitHit(rec, 1000 + i, g); total += g; } }
    expect(total).toBeLessThanOrEqual(1.0001);
    // nach dem Fenster geht es wieder
    expect(windowGain(rec, 1300, 0.4)).toBe(0.4);
  });
  it('Engine: Rate-Limit je Turmtyp verwirft zu dichte Schuesse', () => {
    const a = new AudioEngine();
    const tw = [{ id: 1, type: 'ranger', tiers: [0, 0, 0], x: 0, y: 0 } as unknown as TowerState];
    for (let i = 0; i < 10; i++) a.onEvent({ type: 'fire', tick: 0, tower: 1, kind: 'arrow' }, tw);
    expect(a.log.length).toBe(1);
  });
  it('Standard-Effektlautstaerke 60 %', () => { expect(DEFAULT_AUDIO.sfxVol).toBe(0.6); });
});

describe('Menue-Musik dusk: hell und froehlich', () => {
  const d = MENU_THEMES.dusk;
  it('Dur-Akkorde, hoeher als vorher, flotter, mit Melodie', () => {
    expect(d.rootHz).toBeGreaterThanOrEqual(196);
    expect(d.bpm).toBeGreaterThanOrEqual(96);
    expect(d.chords[0]).toEqual(expect.arrayContaining([0, 4, 7]));
    expect(d.arpLp).toBeGreaterThanOrEqual(2000);
    expect(d.lead?.length).toBe(d.bass.length);
    for (const bar of d.lead!) expect(bar).toHaveLength(8);
  });
});

import { figureScale } from '../src/match/panel';
describe('Buehne im Turm-Panel (12b)', () => {
  it('Massstab ganzzahlig, passt immer in den Rahmen', () => {
    expect(figureScale(26, 27, 300, 100)).toBe(3);
    expect(figureScale(60, 70, 300, 100)).toBe(1);
    expect(figureScale(10, 10, 300, 100)).toBe(4);
    expect(figureScale(400, 400, 300, 100)).toBe(1);
  });
});
