/** Runde 16 E (10.10.2026): Challenge-Regelwerk, Code, Modi als Sonderfaelle. */
import { describe, expect, it } from 'vitest';
import './setup';
import {
  ChallengeError, DATA, MODE_IDS, createGame, decodeChallenge, defaultRules, describeRules, encodeChallenge, modeRules, normalizeRules, tryDecodeChallenge,
  challengeLink, challengeFromQuery, type ChallengeRules, type Game,
} from '../src/index';
import { run } from './helpers';

const mk = (over: Partial<ChallengeRules> = {}, extra: Partial<Parameters<typeof createGame>[0]> = {}): Game =>
  createGame({ map: 'meadow', difficulty: 'medium', seed: 1, rules: { ...defaultRules('meadow'), ...over }, ...extra });
/** Erster Punkt, an dem irgendein Turm der Liste (Rasterlauf) steht; Regeln werden vor der Geometrie geprueft. */
function spot(g: Game): { x: number; y: number } {
  for (let y = 40_000; y < 340_000; y += 10_000) for (let x = 40_000; x < 600_000; x += 10_000) if (g.canPlace('ranger', x, y).ok || g.canPlace('longshot', x, y).ok) return { x, y };
  throw new Error('kein Bauplatz');
}
const put = (g: Game, type: 'ranger' | 'wren' | 'longshot' | 'market'): { ok: boolean; id?: number; reason?: string } => {
  const s = spot(g);
  return g.apply({ type: 'place', tower: type, x: s.x, y: s.y }) as { ok: boolean; id?: number; reason?: string };
};

describe('Challenge-Regeln greifen', () => {
  it('Startrunde, Endrunde, Geld, Leben', () => {
    const g = mk({ startRound: 10, endRound: 12, startCash: 1234, lives: 7 });
    expect(g.state.round).toBe(9);
    expect(g.info.maxRound).toBe(12);
    expect(g.info.baseRound).toBe(9);
    expect(g.state.cash).toBe(1234);
    expect(g.state.lives).toBe(7);
    expect(g.apply({ type: 'startRound' })).toEqual({ ok: true, id: 10 });
  });

  it('Sieg nach der Endrunde, kein Freeplay', () => {
    const g = mk({ startRound: 1, endRound: 2 }, { mods: { startCash: 100000 } });
    const t = put(g, 'ranger');
    expect(t.ok).toBe(true);
    for (let r = 0; r < 2; r++) {
      expect(g.apply({ type: 'startRound' }).ok).toBe(true);
      run(g, 60 * 120, () => g.state.phase !== 'wave');
    }
    expect(g.state.phase).toBe('won');
    expect(g.apply({ type: 'continue' }).ok).toBe(false);
    expect(g.state.freeplay).toBe(false);
  });

  it('erlaubte Tuerme und Held', () => {
    const g = mk({ towers: ['ranger'], hero: 'none' });
    expect(put(g, 'longshot')).toEqual({ ok: false, reason: 'mode-locked' });
    expect(put(g, 'wren')).toEqual({ ok: false, reason: 'mode-locked' });
    expect(put(g, 'ranger').ok).toBe(true);
    const h = mk({ towers: ['ranger'], hero: 'wren' });
    expect(put(h, 'wren').reason).not.toBe('mode-locked'); // Held erlaubt (die Wiese hat dort evtl. keinen Platz)
  });

  it('Hoechststufe je Pfad', () => {
    const g = mk({ maxTier: [2, 5, 0] }, { mods: { startCash: 100000 } });
    const id = put(g, 'ranger').id!;
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 }).ok).toBe(true);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 0 })).toEqual({ ok: false, reason: 'rule-cap' });
    expect(g.apply({ type: 'upgrade', towerId: id, path: 2 })).toEqual({ ok: false, reason: 'rule-cap' });
    expect(g.upgradeInfo(id)[2].canBuy).toBe(false);
    expect(g.apply({ type: 'upgrade', towerId: id, path: 1 }).ok).toBe(true);
  });

  it('kein Verkaufen, keine Powers', () => {
    const g = mk({ noSell: true, noPowers: true }, { powers: { goldDrop: 3 } });
    const id = put(g, 'ranger').id!;
    expect(g.apply({ type: 'sell', towerId: id })).toEqual({ ok: false, reason: 'no-sell' });
    expect(g.apply({ type: 'power', power: 'goldDrop' })).toEqual({ ok: false, reason: 'mode-locked' });
    // ohne die Schalter geht beides
    const f = mk({}, { powers: { goldDrop: 3 } });
    const fid = put(f, 'ranger').id!;
    expect(f.apply({ type: 'sell', towerId: fid }).ok).toBe(true);
    expect(f.apply({ type: 'power', power: 'goldDrop' }).ok).toBe(true);
  });

  it('keine Wissensbaum-Boni', () => {
    expect(mk({}, { mods: { startCash: 5000, lives: 50 } }).state.cash).toBe(5650);
    const g = mk({ noKnowledge: true }, { mods: { startCash: 5000, lives: 50 } });
    expect(g.state.cash).toBe(650);
    expect(g.state.lives).toBe(150);
  });

  it('kein Einkommen / halbes Einkommen', () => {
    const none = mk({ incomePct: 0, startCash: 5000 }, { mods: {} });
    const half = mk({ incomePct: 50, startCash: 5000 }, { mods: {} });
    const full = mk({ startCash: 5000 }, { mods: {} });
    const earned: number[] = [];
    for (const g of [none, half, full]) {
      put(g, 'ranger');
      const c0 = g.state.cash;
      g.apply({ type: 'startRound' });
      run(g, 60 * 90, () => g.state.phase !== 'wave');
      earned.push(g.state.cash - c0);
    }
    expect(earned[0]).toBe(0);
    expect(earned[2]).toBeGreaterThan(0);
    expect(Math.abs(earned[1] - earned[2] / 2)).toBeLessThanOrEqual(1);
  });

  it('Gegner-HP und -Tempo in Prozent', () => {
    const base = mk({}), tough = mk({ hpPct: 200, speedPct: 150 });
    const a = base.state.enemies.length;
    const eb = base.sandbox.spawn('ironshell'), et = tough.sandbox.spawn('ironshell');
    expect(a).toBe(0);
    const hb = base.state.enemies.find((e) => e.id === eb)!.maxHp, ht = tough.state.enemies.find((e) => e.id === et)!.maxHp;
    expect(ht).toBe(hb * 2);
    base.step(60); tough.step(60);
    const pb = base.state.enemies.find((e) => e.id === eb)!.progress, pt = tough.state.enemies.find((e) => e.id === et)!.progress;
    expect(pt / pb).toBeGreaterThan(1.45);
    expect(pt / pb).toBeLessThan(1.55);
  });

  it('eigene Wellen', () => {
    const g = mk({ startRound: 3, waves: [[{ type: 'red', n: 4 }], [{ type: 'blue', n: 2, camo: true }, { type: 'green', n: 1 }]] });
    expect(g.info.maxRound).toBe(4);
    expect(g.roundPreview(3)!.groups).toEqual([{ type: 'red', n: 4, camo: false, regrow: false, fortified: false }]);
    expect(g.roundPreview(4)!.groups.map((x) => [x.type, x.n, x.camo])).toEqual([['blue', 2, true], ['green', 1, false]]);
    g.apply({ type: 'startRound' });
    run(g, 60 * 5);
    expect(g.state.enemies.filter((e) => e.type === 'red')).toHaveLength(4);
  });

  it('Regeln und Modus schliessen sich aus', () => {
    expect(() => createGame({ map: 'meadow', difficulty: 'easy', seed: 1, mode: 'deflation', rules: defaultRules() })).toThrow();
  });

  it('Pruefung der Regeln: englische Meldungen', () => {
    expect(() => normalizeRules({ map: 'nowhere' })).toThrow(ChallengeError);
    expect(() => normalizeRules({ startRound: 30, endRound: 20 })).toThrow(/End round/);
    expect(() => normalizeRules({ towers: [] })).toThrow(/at least one tower/);
    expect(() => normalizeRules({ maxTier: [6, 5, 5] })).toThrow(/Max tier/);
    expect(() => normalizeRules({ lives: 0 })).toThrow(/lives/);
    expect(describeRules(normalizeRules({ noSell: true, towers: ['ranger'] }))).toContain('No selling');
  });
});

describe('Modi als Sonderfaelle der Regeln', () => {
  for (const mode of MODE_IDS) {
    for (const difficulty of ['easy', 'hard'] as const) {
      it(`${mode} (${difficulty}) spielt sich wie der Modus`, () => {
        const a = createGame({ map: 'meadow', difficulty, seed: 5, mode });
        const b = createGame({ map: 'meadow', difficulty, seed: 5, rules: modeRules(mode, 'meadow', difficulty, 5) });
        expect(b.info.maxRound).toBe(a.info.maxRound);
        expect(b.info.baseRound).toBe(a.info.baseRound);
        expect(b.state.cash).toBe(a.state.cash);
        expect(b.state.lives).toBe(a.state.lives);
        for (const type of ['ranger', 'longshot', 'wren'] as const) expect(b.canPlace(type, 60_000, 122_000)).toEqual(a.canPlace(type, 60_000, 122_000));
        for (const g of [a, b]) {
          g.sandbox.setCash(50_000);
          put(g, mode === 'specialists-only' ? 'longshot' : 'ranger');
          g.apply({ type: 'startRound' });
          run(g, 60 * 40);
        }
        expect(b.state.cash).toBe(a.state.cash);
        expect(b.state.enemies.length).toBe(a.state.enemies.length);
        expect(b.state.round).toBe(a.state.round);
        if (mode !== 'half-cash') expect(b.hash()).toBe(a.hash());
      });
    }
  }
});

describe('Code', () => {
  const samples: Partial<ChallengeRules>[] = [
    {},
    { map: 'quarry', difficulty: 'hard', seed: 4_000_000_000, startRound: 10, endRound: 30, towers: ['ranger', 'market'], hero: 'none', maxTier: [3, 3, 3], startCash: 12_500, lives: 40, incomePct: 50, noSell: true, noPowers: true, noKnowledge: true, hpPct: 125, speedPct: 90 },
    { map: 'frostfen', maxTier: [0, 5, 2], towers: ['thornweaver'], hero: 'wren', lives: 1 },
    { startRound: 5, waves: [[{ type: 'red', n: 20, gapMs: 300 }], [{ type: 'ironshell', n: 3, camo: true, regrow: true, fortified: true, startMs: 1500, gapMs: 700 }, { type: 'leviathan', n: 1 }]] },
  ];
  it('Rundreise Regeln -> Code -> Regeln', () => {
    for (const s of samples) {
      const rules = normalizeRules({ ...defaultRules(), ...s });
      const code = encodeChallenge(rules);
      expect(code).toMatch(/^DW1-[0-9A-HJKMNP-TV-Z]{5}(-[0-9A-HJKMNP-TV-Z]{1,5})*$/);
      expect(decodeChallenge(code)).toEqual(rules);
      expect(decodeChallenge(code.toLowerCase().replace(/-/g, ' '))).toEqual(rules);
    }
  });
  it('Standardregeln sind kurz', () => {
    expect(encodeChallenge(defaultRules()).length).toBeLessThanOrEqual(44);
  });
  it('kaputte Codes: englische Meldung, nie eine andere Ausnahme', () => {
    const good = encodeChallenge(normalizeRules({ ...defaultRules(), ...samples[1] }));
    const bad = ['', '   ', 'hello', 'DW1', 'DW1-', 'DW1-0', 'DW2-AAAAA-AAAAA', 'XY1-ABCDE', good.slice(0, -4), good.slice(0, 6) + (good[6] === 'A' ? 'B' : 'A') + good.slice(7), good + '-0000', 'DW1-!!!!!-#####', 'DW1-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ'];
    for (const c of bad) {
      const res = tryDecodeChallenge(c);
      expect(res.ok, c).toBe(false);
      if (!res.ok) expect(res.error).toMatch(/^[A-Z]/);
      expect(() => decodeChallenge(c)).toThrow(ChallengeError);
    }
  });
  it('jede einzelne Zeichenaenderung wird erkannt', () => {
    const code = encodeChallenge(normalizeRules({ ...defaultRules(), ...samples[1] }));
    let flagged = 0, total = 0;
    for (let i = 4; i < code.length; i++) {
      if (code[i] === '-') continue;
      total++;
      const other = code[i] === '7' ? '8' : '7';
      const res = tryDecodeChallenge(code.slice(0, i) + other + code.slice(i + 1));
      if (!res.ok) flagged++;
    }
    expect(flagged).toBe(total);
  });
  it('Link und Query', () => {
    const code = encodeChallenge(defaultRules());
    expect(challengeFromQuery(challengeLink(code, '/play'))).toBeNull();
    expect(challengeFromQuery(challengeLink(code).replace(/^[^?]*/, ''))).toBe(code);
    expect(challengeFromQuery('?x=1')).toBeNull();
  });
  it('Daten sind Quelle der Reihenfolge (append-only)', () => {
    expect(Object.keys(DATA.towers).slice(0, 7)).toEqual(['ranger', 'bombardier', 'frostcaller', 'longshot', 'market', 'thornweaver', 'alchemist']);
    expect(Object.keys(DATA.hero)[0]).toBe('wren');
    expect(Object.keys(DATA.enemies)[0]).toBe('red');
  });
});

describe('Challenge und Held (Runde 16 T + E)', () => {
  it('fester Held der Challenge schlaegt die Wahl des Spielers, andere Helden sind gesperrt', () => {
    const g = mk({ hero: 'sela', startCash: 5000 }, { hero: 'bram' });
    expect(g.info.hero).toBe('sela');
    expect(put(g, 'wren')).toMatchObject({ ok: false });
  });
  it("'any' nimmt den Helden des Spielers, Code-Rundlauf mit Bram/Sela", () => {
    expect(mk({ hero: 'any' }, { hero: 'bram' }).info.hero).toBe('bram');
    expect(mk({ hero: 'any' }).info.hero).toBe('wren');
    for (const hero of ['bram', 'sela'] as const) {
      const r = { ...defaultRules('marsh'), hero };
      expect(decodeChallenge(encodeChallenge(r)).hero).toBe(hero);
    }
  });
});
