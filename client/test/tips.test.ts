import { describe, expect, it } from 'vitest';
import { hasKey } from '../src/i18n/t';
import { loadBrowserData } from '../src/sim';
import { createSim, STAGE_ID } from '../src/sim';
import { defeatTips, type TipInput } from '../src/view/tips';
import { registerUnitColors } from '../src/view/model';
import { airCapable, bossHelpers } from '../src/view/readability';

const data = loadBrowserData();
const defs = createSim({ stage: STAGE_ID, difficulty: 'normal', players: 1, seed: 1, data }).catalog();
registerUnitColors(defs); // Anzeigenamen aus den Unit-Daten
const priciest = [...defs].sort((a, b) => b.placeCost - a.placeCost)[0];
const place = (unitId: string, n = 1) => Array.from({ length: n }, () => ({ cmd: { type: 'place', unitId }, ok: true }));
const base = (over: Partial<TipInput> = {}): TipInput => ({ result: 'loss', endWave: 16, endCoins: 0, waves: [], commands: [], team: defs, bossWaves: [10, 20], ...over });

describe('Niederlage-Tipps (reine Regeln)', () => {
  it('Sieg: keine Tipps', () => expect(defeatTips(base({ result: 'win' }))).toEqual([]));

  it('immer genau drei Tipps, gleiche Eingabe gleiche Tipps', () => {
    const a = defeatTips(base());
    expect(a).toHaveLength(3);
    expect(defeatTips(base())).toEqual(a);
  });

  it('Flieger-Leaks nennen Welle, Anzahl und Luft-Units aus den Daten', () => {
    const tips = defeatTips(base({ waves: [{ wave: 16, leaks: 10, leaksByEnemy: { flyer: 10 } }], commands: [...place('krillin'), ...place('ichigo')] }));
    expect(tips[0].id).toBe('air-leak');
    expect(tips[0].text).toContain('10 flyers leaked in wave 16');
    for (const d of airCapable(defs).slice(0, 3)) expect(tips[0].text).toContain(d.name); // Namen aus den Unit-Daten
    expect(tips[0].text).not.toContain(defs.find((d) => d.id === 'ichigo')!.name); // Boden-Unit
  });

  it('keine Luftabwehr je gesetzt: eigene Variante', () => {
    const tips = defeatTips(base({ waves: [{ wave: 8, leaks: 4, leaksByEnemy: { flyer: 4 } }], commands: place('ichigo', 3) }));
    expect(tips[0].id).toBe('air-never');
  });

  it('unter der Schwelle (1 Flieger) kein Flieger-Tipp', () => {
    const ids = defeatTips(base({ waves: [{ wave: 8, leaks: 1, leaksByEnemy: { flyer: 1 } }] })).map((t) => t.id);
    expect(ids).not.toContain('air-leak');
    expect(ids).not.toContain('air-never');
  });

  it('Muenzen am Ende: ab mehr als 1,5 x guenstigste Unit', () => {
    const cheapest = Math.min(...defs.map((d) => d.placeCost));
    const hi = defeatTips(base({ endCoins: 1100 })).find((t) => t.id === 'coins');
    expect(hi?.text).toContain('1100 unspent coins');
    expect(defeatTips(base({ endCoins: Math.floor(cheapest * 1.5) })).some((t) => t.id === 'coins')).toBe(false);
  });

  it('teuerste nie gesetzte Team-Unit', () => {
    const tips = defeatTips(base({ commands: [...place('ichigo'), ...place('krillin')], endCoins: 1100 }));
    const u = tips.find((t) => t.id === 'unplaced');
    expect(u?.text).toContain(`Your ${priciest.name} was never placed`);
    const withIt = defeatTips(base({ commands: [...place(priciest.id), ...place('ichigo')], endCoins: 1100 }));
    expect(withIt.find((t) => t.id === 'unplaced')?.text).not.toContain(priciest.name);
  });

  it('abgelehnte Kaeufe zaehlen nicht als gesetzt', () => {
    const tips = defeatTips(base({ commands: [{ cmd: { type: 'place', unitId: priciest.id }, ok: false }] }));
    expect(tips.find((t) => t.id === 'unplaced')?.text).toContain(priciest.name);
  });

  it('Boss durchgekommen: nennt Units, die den Boss festsetzen koennen (Stun, Freeze, Timestop)', () => {
    const tips = defeatTips(base({ endWave: 10, waves: [{ wave: 10, leaks: 1, leaksByEnemy: { boss: 1 } }] }));
    const b = tips.find((t) => t.id === 'boss');
    expect(b?.text).toContain('wave 10');
    for (const d of bossHelpers(defs).stun.slice(0, 3)) expect(b?.text).toContain(d.name);
  });

  it('Pulks anderer Typen: Flaechen-Units', () => {
    const tips = defeatTips(base({ endWave: 6, waves: [{ wave: 6, leaks: 5, leaksByEnemy: { grunt: 5 } }], bossWaves: [] }));
    const s = tips.find((t) => t.id === 'swarm');
    expect(s?.text).toContain('5x Grunt leaked in wave 6');
    expect(s?.text).toContain(defs.find((d) => d.levels.some((l) => l.attack && l.attack.kind !== 'single'))!.name);
  });

  it('kaum Upgrades', () => {
    const cmds = [...place('rikka_evo'), ...place('ichigo', 3)];
    const ids = defeatTips(base({ commands: cmds, team: defs.filter((d) => d.id !== 'goku_ssj3') })).map((t) => t.id);
    expect(ids).toContain('upgrades');
    const used = [...cmds, { cmd: { type: 'upgrade' }, ok: true }, { cmd: { type: 'upgrade' }, ok: true }];
    const ids2 = defeatTips(base({ commands: used, team: defs.filter((d) => d.id !== 'goku_ssj3') })).map((t) => t.id);
    expect(ids2).not.toContain('upgrades');
  });

  it('Prioritaet: Flieger vor Muenzen vor nie gesetzt', () => {
    const tips = defeatTips(base({ endCoins: 1100, waves: [{ wave: 16, leaks: 10, leaksByEnemy: { flyer: 10 } }], commands: place('krillin') }));
    expect(tips.map((t) => t.id)).toEqual(['air-leak', 'coins', 'unplaced']);
  });

  it('Texte stehen in en.ts (Fallbacks, Titel)', () => {
    for (const k of ['tips.title', 'tips.fallback.preview', 'tips.fallback.pause', 'tips.fallback.shift']) expect(hasKey(k)).toBe(true);
    const tips = defeatTips(base({ commands: place('goku_ssj3', 1), team: defs.filter((d) => d.id === 'goku_ssj3') }));
    expect(tips.every((t) => !t.text.startsWith('tips.') || hasKey(t.text))).toBe(true);
  });
});
