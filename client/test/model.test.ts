import { describe, expect, it } from 'vitest';
import { createSim, loadBrowserData, STAGE_ID, type SimEvent } from '../src/sim';
import { compactNumber, enemyStyle, hudModel, modifierLabel, previewModel, sellPreview, ticksToSeconds, unitColor } from '../src/view/model';

const data = loadBrowserData();
const stage = data.stages[STAGE_ID];
const mk = (difficulty: 'normal' | 'hard' | 'nightmare' = 'normal') => createSim({ stage: STAGE_ID, difficulty, players: 1, seed: 7, data });

describe('hudModel', () => {
  it('Prep: Welle 0, Countdown aus prepTicksLeft, Start fuer Welle 1', () => {
    const sim = mk();
    const h = hudModel(sim.state, stage.waves.length, stage.waveTimerTicks ?? 900);
    expect(h.phase).toBe('prep');
    expect(h.wave).toBe(0);
    expect(h.nextWave).toBe(1);
    expect(h.canStartWave).toBe(true);
    expect(h.countdownSeconds).toBe(ticksToSeconds(sim.state.prepTicksLeft));
    expect(h.coins).toBe(sim.state.players[0].coins);
    expect(h.lives).toBe(sim.state.lives);
    expect(h.livesRatio).toBe(1);
  });
  it('nach Wellenstart: Wave 1, naechste = 2', () => {
    const sim = mk();
    sim.apply(0, { type: 'skipWave' });
    sim.step(2);
    const h = hudModel(sim.state, 20, 900);
    expect(h.wave).toBe(1);
    expect(h.nextWave).toBe(2);
    expect(h.countdownSeconds).toBeGreaterThan(0);
  });
  it('Nightmare hat weniger Leben als Normal', () => {
    expect(hudModel(mk('nightmare').state, 20, 900).maxLives).toBeLessThan(hudModel(mk('normal').state, 20, 900).maxLives);
  });
  it('Ende: kein Start mehr', () => {
    const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data });
    while (!sim.isOver()) sim.step(200);
    const h = hudModel(sim.state, 20, 900);
    expect(h.phase).toBe('over');
    expect(h.canStartWave).toBe(false);
    expect(h.nextWave).toBeNull();
  });
});

describe('previewModel', () => {
  it('bildet previewWave ab, Boss-Wave 10 mit Kit und ohne Karten', () => {
    const sim = mk();
    const p1 = previewModel(sim.previewWave(1)!);
    expect(p1.rows.length).toBeGreaterThan(0);
    expect(p1.enemyCount).toBe(p1.rows.reduce((s, r) => s + r.count, 0));
    expect(p1.cardAllowed).toBe(true);
    const p10 = previewModel(sim.previewWave(10)!);
    expect(p10.boss).toBe(true);
    expect(p10.bossKit?.id).toBe('warden');
    expect(p10.cardAllowed).toBe(false);
  });
});

describe('Hilfen', () => {
  it('modifierLabel', () => {
    expect(modifierLabel('shield:2')).toEqual({ key: 'modifier.shield', params: { n: 2 } });
    expect(modifierLabel('regen')).toEqual({ key: 'modifier.regen' });
  });
  it('jeder Gegnertyp und jede Unit hat einen Stil/eine Farbe', () => {
    for (const a of data.enemies.archetypes) expect(enemyStyle(a.id).radius, a.id).toBeGreaterThan(0);
    expect(enemyStyle('boss').radius).toBeGreaterThan(enemyStyle('grunt').radius);
    for (const u of data.units.units) expect(unitColor(u.id), u.id).not.toBe(0xc3c7d6);
  });
  it('compactNumber', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(1500)).toBe('1.5k');
    expect(compactNumber(25000)).toBe('25k');
  });
  it('Verkaufsvorschau stimmt mit dem sell-Event der Sim ueberein (auch nach Upgrade)', () => {
    const sim = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 3, data, godMode: true });
    sim.state.players[0].coins = 100000;
    const placed = sim.apply(0, { type: 'place', unitId: 'ichigo', x: 3000, y: 3000 });
    expect(placed.ok).toBe(true);
    const id = (placed as { entityId: number }).entityId;
    expect(sim.apply(0, { type: 'upgrade', entityId: id }).ok).toBe(true);
    const u = sim.state.units.find((x) => x.id === id)!;
    const def = sim.catalog().find((d) => d.id === 'ichigo')!;
    const predicted = sellPreview(def, u);
    sim.drainEvents();
    expect(sim.apply(0, { type: 'sell', entityId: id }).ok).toBe(true);
    const ev = sim.drainEvents().find((e): e is Extract<SimEvent, { type: 'sell' }> => e.type === 'sell')!;
    expect(ev.refund).toBe(predicted);
  });
});
