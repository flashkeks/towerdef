import { describe, expect, it } from 'vitest';
import { RECIPES, SOUND_IDS } from '../src/audio/recipes';
import { crowdGain, effectiveVolume, HIT_STYLE_GAP_MS, RateLimiter, shotSound, soundsFor } from '../src/audio/logic';
import { BossTracker } from '../src/view/telegraph';
import { castMessageKey } from '../src/ui/boss-banner';
import { blinkAlpha, cueFor, DamageNumbers, deathParticles, formatDamage, hitStyle, leakBlink, pickTarget, ShotDetector } from '../src/view/feel';
import { hasKey } from '../src/i18n/t';
import { createSim, loadBrowserData, STAGE_ID } from '../src/sim';
import type { SimEvent } from '../src/sim';

const ev = (e: Record<string, unknown>): SimEvent => e as unknown as SimEvent;

describe('Lautstaerke', () => {
  it('master x sfx / master x music, quadratisch', () => {
    expect(effectiveVolume({ master: 1, sfx: 1, music: 0.5 }, 'sfx', false)).toBe(1);
    expect(effectiveVolume({ master: 0.5, sfx: 1, music: 1 }, 'sfx', false)).toBeCloseTo(0.25);
    expect(effectiveVolume({ master: 0.8, sfx: 0.5, music: 0.5 }, 'music', false)).toBeCloseTo(0.16);
  });
  it('stumm und kaputte Werte geben 0', () => {
    expect(effectiveVolume({ master: 1, sfx: 1, music: 1 }, 'sfx', true)).toBe(0);
    expect(effectiveVolume({ master: NaN, sfx: 1, music: 1 }, 'sfx', false)).toBe(0);
    expect(effectiveVolume({ master: 3, sfx: 3, music: 1 }, 'sfx', false)).toBe(1);
  });
  it('Gedraenge macht leiser, nie stumm', () => {
    expect(crowdGain(0)).toBe(1);
    expect(crowdGain(10)).toBeLessThan(crowdGain(2));
    expect(crowdGain(50)).toBeGreaterThan(0.2);
  });
});

describe('Drosselung', () => {
  it('Treffer teilen sich einen Topf mit Mindestabstand und Burst-Grenze', () => {
    const r = new RateLimiter();
    expect(r.allow('hit.bolt', 0)).toBe(true);
    expect(r.allow('hit.blast', 20)).toBe(false); // Topf-Abstand 55 ms
    expect(r.allow('hit.blast', 60)).toBe(true);
    expect(r.allow('hit.bolt', 60 + 40)).toBe(false);
    expect(r.allow('hit.bolt', HIT_STYLE_GAP_MS + 130)).toBe(true);
  });
  it('bei 3x kein Klangbrei: viele Schuesse in kurzer Zeit werden begrenzt', () => {
    const r = new RateLimiter();
    let ok = 0;
    for (let t = 0; t < 400; t += 10) if (r.allow(t % 20 === 0 ? 'hit.bolt' : 'hit.tracer', t)) ok++;
    expect(ok).toBeLessThanOrEqual(5);
    expect(ok).toBeGreaterThan(0);
  });
  it('nach dem Fenster geht es wieder, reset leert', () => {
    const r = new RateLimiter();
    for (let t = 0; t < 400; t += 60) r.allow('hit.bolt', t);
    expect(r.allow('hit.slash', 900)).toBe(true);
    r.reset();
    expect(r.allow('kill', 0)).toBe(true);
    expect(r.allow('kill', 10)).toBe(false);
  });
  it('andere Klaenge sind unabhaengig vom Treffer-Topf', () => {
    const r = new RateLimiter();
    expect(r.allow('hit.bolt', 0)).toBe(true);
    expect(r.allow('leak', 1)).toBe(true);
    expect(r.allow('place', 2)).toBe(true);
  });
});

describe('Ereignis -> Klang und Effekt', () => {
  it('Bau- und Wirtschaftsereignisse', () => {
    expect(soundsFor(ev({ type: 'place' }))).toEqual(['place']);
    expect(soundsFor(ev({ type: 'upgrade' }))).toEqual(['upgrade']);
    expect(soundsFor(ev({ type: 'sell' }))).toEqual(['sell']);
    expect(soundsFor(ev({ type: 'over', result: 'win' }))).toEqual(['win']);
    expect(soundsFor(ev({ type: 'over', result: 'loss' }))).toEqual(['lose']);
    expect(soundsFor(ev({ type: 'waveStart', wave: 3 }))).toEqual(['wave']);
    expect(soundsFor(ev({ type: 'leak', enemyId: 1, damage: 2, fatal: false }))).toEqual(['leak']);
    expect(soundsFor(ev({ type: 'kill', enemyId: 1, enemy: 'grunt', bounty: 3 }))).toEqual(['kill']);
    expect(soundsFor(ev({ type: 'income' }))).toEqual([]);
  });
  it('Boss-Ereignisse', () => {
    expect(soundsFor(ev({ type: 'spawn', enemy: 'boss', enemyId: 9 }))).toEqual(['bossEnter']);
    expect(soundsFor(ev({ type: 'spawn', enemy: 'grunt', enemyId: 9 }))).toEqual([]);
    expect(soundsFor(ev({ type: 'spawn', enemy: 'boss', enemyId: 9, summon: true }))).toEqual([]);
    expect(soundsFor(ev({ type: 'bossPhase', enemyId: 9, phase: 0 }))).toEqual([]);
    expect(soundsFor(ev({ type: 'bossPhase', enemyId: 9, phase: 2 }))).toEqual(['bossPhase']);
    expect(soundsFor(ev({ type: 'bossTelegraph', enemyId: 9, warnTicks: 40 }))).toEqual(['bossWarn']);
    expect(soundsFor(ev({ type: 'bossCast', enemyId: 9, interrupted: true }))).toEqual(['bossBreak']);
    expect(soundsFor(ev({ type: 'bossCast', enemyId: 9, interrupted: false }))).toEqual(['bossCast']);
    expect(soundsFor(ev({ type: 'bossWindow', enemyId: 9, open: true }))).toEqual(['windowOpen']);
    expect(soundsFor(ev({ type: 'bossWindow', enemyId: 9, open: false }))).toEqual(['windowClose']);
    expect(soundsFor(ev({ type: 'bossWard', enemyId: 9, state: 'broken' }))).toEqual(['wardBreak']);
    expect(soundsFor(ev({ type: 'bossWard', enemyId: 9, state: 'up' }))).toEqual([]);
  });
  it('Fenster-Cue traegt die Ruestung (P3), fehlend = -1', () => {
    expect(cueFor(ev({ type: 'bossWindow', enemyId: 1, open: true, armor: 0 }))).toMatchObject({ kind: 'windowOpen', armor: 0 });
    expect(cueFor(ev({ type: 'bossWindow', enemyId: 1, open: true }))).toMatchObject({ armor: -1 });
  });
  it('jeder Klang hat ein Rezept mit gueltigen Werten, jeder Unit-Stil einen Klang', () => {
    for (const id of SOUND_IDS) {
      expect(RECIPES[id].length, id).toBeGreaterThan(0);
      for (const v of RECIPES[id]) {
        expect(v.dur, id).toBeGreaterThan(0.02);
        expect(v.dur, id).toBeLessThan(2);
        expect(v.vol, id).toBeGreaterThan(0);
        expect(v.vol, id).toBeLessThanOrEqual(0.5);
        expect(v.f0, id).toBeGreaterThan(20);
        expect(v.f1, id).toBeGreaterThan(20);
      }
    }
    for (const style of ['slash', 'tracer', 'shell', 'bolt', 'blast', 'cone', 'line', 'full'] as const) expect(RECIPES[shotSound(style)]).toBeDefined();
    expect(SOUND_IDS.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Trefferstil je Unit', () => {
  const data = loadBrowserData();
  const defs = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
  const style = (id: string, level = 0) => hitStyle(defs.find((u) => u.id === id)!, level);
  it('Stil aus den Daten der Stufe: Kreis = blast, Kegel = cone, Linie = line, Nahkampf-Einzelziel = slash, weites = tracer, sonst bolt', () => {
    expect(style('stain')).toBe('blast');
    expect(style('monet')).toBe('cone');
    expect(style('kimimaro')).toBe('line');
    expect(style('ichigo')).toBe('slash'); // 6 Studs = 1,2 Kacheln
    const single = (rangeMilli: number) => hitStyle({ levels: [{ attack: { kind: 'single' }, rangeMilli }] } as never);
    expect(single(1500)).toBe('slash');
    expect(single(3000)).toBe('bolt');
    expect(single(5000)).toBe('tracer');
  });
  it('Farm greift nicht an', () => {
    expect(style('speedwagon')).toBeNull();
  });
});

describe('Schuss erkennen', () => {
  it('cd steigt = gefeuert; neue Units erst ab dem naechsten Mal; entfernte vergessen', () => {
    const d = new ShotDetector();
    expect(d.detect([{ id: 1, cd: 0 }])).toEqual([]);
    expect(d.detect([{ id: 1, cd: 0 }])).toEqual([]);
    expect(d.detect([{ id: 1, cd: 39 }])).toEqual([1]);
    expect(d.detect([{ id: 1, cd: 38 }])).toEqual([]);
    expect(d.detect([{ id: 1, cd: 37 }, { id: 2, cd: 10 }])).toEqual([]);
    expect(d.detect([{ id: 2, cd: 40 }])).toEqual([2]);
    expect(d.detect([{ id: 1, cd: 5 }])).toEqual([]); // 1 war weg, gilt als neu
  });
});

describe('Zielwahl', () => {
  const en = [
    { id: 1, x: 3000, y: 0, flying: false, hp: 100, progress: 50 },
    { id: 2, x: 1000, y: 0, flying: false, hp: 500, progress: 90 },
    { id: 3, x: 2000, y: 0, flying: true, hp: 50, progress: 70 },
    { id: 4, x: 9000, y: 0, flying: false, hp: 900, progress: 99 },
  ];
  const o = { x: 0, y: 0 };
  it('Modi', () => {
    expect(pickTarget(o, 4000, true, 'first', en)?.id).toBe(2);
    expect(pickTarget(o, 4000, true, 'last', en)?.id).toBe(1);
    expect(pickTarget(o, 4000, true, 'close', en)?.id).toBe(2);
    expect(pickTarget(o, 4000, true, 'strongest', en)?.id).toBe(2);
  });
  it('Luft und Reichweite', () => {
    expect(pickTarget(o, 2200, false, 'last', en)?.id).toBe(2); // 3 fliegt, 1 zu weit
    expect(pickTarget(o, 500, true, 'first', en)).toBeNull();
  });
});

describe('Schadenszahlen', () => {
  const e = (id: number, hp: number, extra: Record<string, unknown> = {}) => ({ id, hp, maxHp: 1000, shield: 0, boss: false, ...extra });
  it('buendelt je Gegner und zeigt die Differenz', () => {
    const d = new DamageNumbers(250);
    expect(d.step([e(1, 1000)], new Map(), 0)).toEqual([]);
    expect(d.step([e(1, 900)], new Map(), 100)).toEqual([{ enemyId: 1, centi: 100, heal: false, kill: false }]);
    expect(d.step([e(1, 850)], new Map(), 200)).toEqual([]); // noch gedrosselt
    const out = d.step([e(1, 800)], new Map(), 400);
    expect(out).toEqual([{ enemyId: 1, centi: 100, heal: false, kill: false }]);
  });
  it('Kill zeigt den Rest, Leak nichts', () => {
    const d = new DamageNumbers();
    d.step([e(1, 300), e(2, 300)], new Map(), 0);
    const out = d.step([], new Map([[1, 'kill'], [2, 'leak']]), 50);
    expect(out).toEqual([{ enemyId: 1, centi: 300, heal: false, kill: true }]);
  });
  it('Heilung nur beim Boss und ab 1 % Max-HP', () => {
    const d = new DamageNumbers();
    d.step([e(1, 500, { boss: true }), e(2, 500)], new Map(), 0);
    const out = d.step([e(1, 600, { boss: true }), e(2, 600)], new Map(), 50);
    expect(out).toEqual([{ enemyId: 1, centi: 100, heal: true, kill: false }]);
  });
  it('Schild zaehlt mit', () => {
    const d = new DamageNumbers();
    d.step([e(1, 500, { shield: 200 })], new Map(), 0);
    expect(d.step([e(1, 500, { shield: 100 })], new Map(), 300)).toEqual([{ enemyId: 1, centi: 100, heal: false, kill: false }]);
  });
  it('Anzeige', () => {
    expect(formatDamage(40)).toBe('1');
    expect(formatDamage(1550)).toBe('16');
    expect(formatDamage(250000)).toBe('2.5k');
  });
});

describe('Leak, Tod', () => {
  it('Blinken wird mit Schaden staerker, toedlich voll, und klingt ab', () => {
    expect(leakBlink(1, false).strength).toBeLessThan(leakBlink(5, false).strength);
    expect(leakBlink(1, true).strength).toBe(1);
    const b = leakBlink(3, false);
    expect(blinkAlpha(0, b.seconds, b.strength)).toBeGreaterThan(0);
    expect(blinkAlpha(b.seconds + 0.1, b.seconds, b.strength)).toBe(0);
  });
  it('Splitter nach Groesse', () => {
    expect(deathParticles('boss')).toBeGreaterThan(deathParticles('elite'));
    expect(deathParticles('elite')).toBeGreaterThan(deathParticles('grunt'));
    expect(deathParticles('splitter_child')).toBeLessThan(deathParticles('grunt'));
  });
});

describe('Boss-Tracker (P3-Felder)', () => {
  it('staggerNeed, armor, cause, bossArmor', () => {
    const t = new BossTracker();
    t.consume([
      ev({ type: 'bossTelegraph', tick: 10, enemyId: 1, kit: 'c', ability: 'mend', kind: 'mend', warnTicks: 80, fireTick: 90, interruptible: true, staggerNeed: 5600 }),
      ev({ type: 'bossWindow', tick: 20, enemyId: 1, open: true, damageBp: 20000, ticks: 160, cause: 'interrupt', armor: 0 }),
      ev({ type: 'bossArmor', tick: 20, enemyId: 1, armor: 30, base: 10 }),
    ]);
    expect(t.telegraphs.get(1)?.staggerNeed).toBe(5600);
    expect(t.windows.get(1)?.armor).toBe(0);
    expect(t.armors.get(1)).toEqual({ armor: 30, base: 10 });
    t.consume([ev({ type: 'bossCast', tick: 30, enemyId: 1, kit: 'c', ability: 'mend', kind: 'mend', interrupted: true, cause: 'damage' })]);
    expect(t.telegraphs.has(1)).toBe(false);
    expect(t.lastCast.get(1)).toMatchObject({ interrupted: true, cause: 'damage' });
  });
  it('alte Ereignisse ohne neue Felder funktionieren', () => {
    const t = new BossTracker();
    t.consume([
      ev({ type: 'bossTelegraph', tick: 1, enemyId: 2, kit: 'w', ability: 'call', kind: 'summon', warnTicks: 40, fireTick: 41, interruptible: false }),
      ev({ type: 'bossWindow', tick: 2, enemyId: 2, open: true, damageBp: 15000, ticks: 80, cause: 'cast' }),
      ev({ type: 'bossCast', tick: 41, enemyId: 2, kit: 'w', ability: 'call', kind: 'summon', interrupted: false }),
    ]);
    expect(t.windows.get(2)?.armor).toBe(-1);
    expect(t.lastCast.get(2)?.cause).toBeNull();
  });
  it('Text zur letzten Wirkung', () => {
    expect(castMessageKey({ interrupted: true, cause: 'stun' }).key).toBe('boss.cast.stun');
    expect(castMessageKey({ interrupted: true, cause: 'damage' }).key).toBe('boss.cast.damage');
    expect(castMessageKey({ interrupted: true, cause: null }).key).toBe('boss.cast.broken');
    expect(castMessageKey({ interrupted: false, cause: null })).toEqual({ key: 'boss.cast.landed', mode: 'bad' });
    for (const k of ['boss.cast.stun', 'boss.cast.damage', 'boss.cast.broken', 'boss.cast.landed', 'boss.tag.open', 'boss.tag.winded', 'boss.break', 'boss.window.armor', 'audio.muted', 'audio.unmuted']) expect(hasKey(k), k).toBe(true);
  });
});
