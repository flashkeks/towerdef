/**
 * Runde 4 / P1: Unit-Rebalance-Messung.
 *  --part matrix : je Bot und Zelle Siegquote, Kaufquote je Unit (Anteil Läufe mit >= 1 Platzierung), Schaden je Münze je Unit.
 *  --part loo    : Leave-one-out für den besten Registry-Bot je Zelle (Verbot einer Unit, Proxy lehnt place ab).
 *  --part static : Kosten, DPS (Level 0 / max), Schaden je Münze bei Vollausbau je Unit (ohne Simulation).
 * Aufruf: npx tsx scripts/sanity/q7-p1.ts --part matrix [--n 40] [--difficulty normal] [--players 1,4] [--bots greedy,wide]
 */
import { type DifficultyId, type Sim } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import type { BotFactory } from '../../src/bots/types.js';
import { writeFileSync, readFileSync } from 'node:fs';
import { argNum, argStr, baseData, f1, play, restricted, table } from './lib.js';

const UNITS = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost', 'titan', 'farm'];
const DPS_UNITS = ['striker', 'gunner', 'blaster', 'lancer', 'frost', 'titan'];
const part = argStr('part', 'matrix');
const n = argNum('n', 40);
const diffs = argStr('difficulty', 'normal,hard,nightmare').split(',') as DifficultyId[];
const players = argStr('players', '1,4').split(',').map(Number);
const botNames = argStr('bots', Object.keys(BOTS).join(',')).split(',');

/** Wrapper: der Bot darf eine Unit nicht platzieren. */
const banned = (f: BotFactory, ban: string): BotFactory => () => {
  const b = f();
  return {
    name: `${b.name}-ohne-${ban}`,
    decide: (ctx) => {
      const sim = new Proxy(ctx.sim, {
        get: (t, k) =>
          k === 'apply'
            ? (p: number, c: { type: string; unitId?: string }) =>
                c.type === 'place' && c.unitId === ban ? { ok: false, reason: 'verboten' } : t.apply(p, c as never)
            : (t as unknown as Record<string | symbol, unknown>)[k],
      }) as Sim;
      b.decide({ ...ctx, sim });
    },
  };
};

if (part === 'static') {
  const rows = baseData.units.units.map((u) => {
    const r = baseData.units.rarities[u.rarity];
    const up = u.upgradeCosts ?? r.upgradeCosts;
    const cost = (u.placeCost ?? r.placeCost) + up.reduce((a, b) => a + b, 0);
    const share = u.dpsShareBp / 10000;
    const mult = u.attack?.kind === 'circle' || u.attack?.kind === 'line' ? 1.6 : 1; // grober Mehrziel-Faktor
    return [u.id, u.placeCost ?? r.placeCost, cost, f1((r.dpsCenti[0] * share) / 100), f1((r.dpsCenti[1] * share) / 100), f1(((r.dpsCenti[1] * share) / 100) / cost * 1000), mult];
  });
  console.log(table(['Unit', 'Platz.', 'Vollausbau', 'DPS L0', 'DPS max', 'DPS/1000 Münzen', 'Mehrziel-F'], rows));
} else if (part === 'mono') {
  // Mono-Messung (godMode, kein Verlust): jede DPS-Unit allein, gleiche Slots/Münzen -> Schaden je Münze (Korridor-Metrik).
  const rows: (string | number)[][] = [];
  const res: Record<string, number> = {};
  for (const u of DPS_UNITS) {
    let dmg = 0, spent = 0, leaks = 0;
    for (let seed = 1; seed <= n; seed++) {
      const r = play({ difficulty: 'normal', players: 1, seed, bots: restricted(`mono-${u}`, [u]), godMode: true });
      dmg += r.dmg[u] ?? 0;
      spent += r.spent[u] ?? 0;
      leaks += Object.values(r.leaks).reduce((a, b) => a + b, 0);
    }
    res[u] = dmg / spent;
    rows.push([u, Math.round(spent / n), f1(dmg / n / 1000), f1(dmg / spent), f1(leaks / n)]);
  }
  console.log(table(['Unit (mono, godMode, normal 1P)', 'Münzen/Lauf', 'Schaden/Lauf (kHP)', 'Schaden je Münze', 'Leaks/Lauf'], rows));
  const v = Object.values(res);
  console.log(`\nFaktor max/min: ${f1(Math.max(...v) / Math.min(...v))}`);
} else if (part === 'phase') {
  // Schaden je investierter Münze nach Spielphase (Wave 1-6 / 7-13 / 14-20), greedy, 1P: zeigt Early-/Late-Profil je Unit.
  const bn = argStr('bot', 'greedy');
  const phases: [number, number][] = [[1, 6], [7, 13], [14, 20]];
  for (const d of diffs) {
    const rows: (string | number)[][] = [];
    for (const u of DPS_UNITS) {
      const dm = [0, 0, 0], inv = [0, 0, 0];
      let runs = 0;
      for (let seed = 1; seed <= n; seed++) {
        const r = play({ difficulty: d, players: 1, seed, bots: BOTS[bn] });
        const b = r.byWave[u];
        if (!b) continue;
        runs++;
        let cum = 0;
        for (let w = 0; w <= 20; w++) {
          cum += b.invested[w];
          phases.forEach(([a, z], i) => {
            if (w >= a && w <= z) { dm[i] += b.dmg[w]; inv[i] += cum; }
          });
        }
      }
      rows.push([u, `${runs}/${n}`, ...dm.map((x, i) => (inv[i] > 0 ? f1(x / inv[i] * 6.5) : '-'))]);
    }
    console.log(`\n### Schaden je investierter Münze nach Phase, ${bn} ${d} 1P (n=${n}); Wert = Schaden/(Münzen im Bestand) je Wave, x Phasenlänge normiert\n`);
    console.log(table(['Unit', 'Läufe mit Kauf', 'Wave 1-6', 'Wave 7-13', 'Wave 14-20'], rows));
  }
} else if (part === 'raw') {
  // Rohdaten je (Bot, Stufe, Spieler) als JSON: --out datei
  const out: Record<string, unknown> = {};
  for (const d of diffs) for (const p of players) for (const bn of botNames) {
    const dmg: Record<string, number> = {}, spent: Record<string, number> = {}, bought: Record<string, number> = {};
    let win = 0;
    for (let seed = 1; seed <= n; seed++) {
      const r = play({ difficulty: d, players: p, seed, bots: BOTS[bn] });
      if (r.result === 'win') win++;
      for (const u of UNITS) {
        dmg[u] = (dmg[u] ?? 0) + (r.dmg[u] ?? 0);
        spent[u] = (spent[u] ?? 0) + (r.spent[u] ?? 0);
        if ((r.placed[u] ?? 0) > 0) bought[u] = (bought[u] ?? 0) + 1;
      }
    }
    out[`${bn}|${d}|${p}`] = { n, win, dmg, spent, bought };
  }
  writeFileSync(argStr('out', 'raw.json'), JSON.stringify(out));
} else if (part === 'sum') {
  // Auswertung mehrerer Rohdateien: --files a.json,b.json
  const all: Record<string, { n: number; win: number; dmg: Record<string, number>; spent: Record<string, number>; bought: Record<string, number> }> = {};
  for (const f of argStr('files', '').split(',')) Object.assign(all, JSON.parse(readFileSync(f, 'utf8')));
  const pool = (pl: number): Record<string, number> => {
    const dm: Record<string, number> = {}, sp: Record<string, number> = {};
    for (const [k, v] of Object.entries(all)) {
      if (Number(k.split('|')[2]) !== pl) continue;
      for (const u of UNITS) { dm[u] = (dm[u] ?? 0) + v.dmg[u]; sp[u] = (sp[u] ?? 0) + v.spent[u]; }
    }
    return Object.fromEntries(UNITS.map((u) => [u, sp[u] > 0 ? dm[u] / sp[u] : 0]));
  };
  const p1 = pool(1), p4 = pool(4);
  const maxBuy = (u: string): string => {
    let best = 0, who = '';
    const per: Record<string, number[]> = {};
    for (const [k, v] of Object.entries(all)) { const [bn] = k.split('|'); (per[bn] ??= []).push(((v.bought[u] ?? 0) / v.n) * 100); }
    for (const [bn, a] of Object.entries(per)) { const m = a.reduce((x, y) => x + y, 0) / a.length; if (m > best) { best = m; who = bn; } }
    return `${Math.round(best)}% (${who})`;
  };
  console.log(table(['Unit', 'Schaden/Münze 1P', 'Schaden/Münze 4P', 'max. mittlere Kaufquote (Bot)'], UNITS.map((u) => [u, f1(p1[u]), f1(p4[u]), maxBuy(u)])));
  const dps1 = DPS_UNITS.map((u) => p1[u]).filter((x) => x > 0);
  console.log(`\nFaktor max/min DPS-Units 1P: ${f1(Math.max(...dps1) / Math.min(...dps1))}`);
  const dps4 = DPS_UNITS.map((u) => p4[u]).filter((x) => x > 0);
  console.log(`Faktor max/min DPS-Units 4P: ${f1(Math.max(...dps4) / Math.min(...dps4))}`);
  const cells = new Map<string, string[]>();
  for (const [k, v] of Object.entries(all)) { const [bn, d, p] = k.split('|'); const c = `${d} ${p}P`; if (!cells.has(bn)) cells.set(bn, []); cells.get(bn)!.push(`${c} ${f1((v.win / v.n) * 100)}`); }
  for (const [bn, a] of cells) console.log(`${bn}: ${a.join(' | ')}`);
} else if (part === 'matrix') {
  for (const d of diffs) {
    for (const p of players) {
      const rows: (string | number)[][] = [];
      for (const bn of botNames) {
        const dmg: Record<string, number> = {};
        const spent: Record<string, number> = {};
        const bought: Record<string, number> = {};
        let win = 0;
        for (let seed = 1; seed <= n; seed++) {
          const r = play({ difficulty: d, players: p, seed, bots: BOTS[bn] });
          if (r.result === 'win') win++;
          for (const u of UNITS) {
            dmg[u] = (dmg[u] ?? 0) + (r.dmg[u] ?? 0);
            spent[u] = (spent[u] ?? 0) + (r.spent[u] ?? 0);
            if ((r.placed[u] ?? 0) > 0) bought[u] = (bought[u] ?? 0) + 1;
          }
        }
        rows.push([bn, f1((win / n) * 100), ...UNITS.map((u) => `${Math.round(((bought[u] ?? 0) / n) * 100)}% / ${(spent[u] ?? 0) > 0 && !['banner', 'farm'].includes(u) ? f1(dmg[u] / spent[u]) : '-'}`)]);
      }
      console.log(`\n### ${d} ${p}P (n=${n}) - Sieg %, dann je Unit: Kaufquote / Schaden je Münze\n`);
      console.log(table(['Bot', 'Sieg %', ...UNITS], rows));
    }
  }
} else {
  // loo: bester Registry-Bot je Zelle (n/2 Vorlauf), dann Verbot je Unit
  for (const d of diffs) {
    for (const p of players) {
      const win = (f: BotFactory, m: number): number => {
        let w = 0;
        for (let seed = 1; seed <= m; seed++) if (play({ difficulty: d, players: p, seed, bots: f }).result === 'win') w++;
        return (w / m) * 100;
      };
      const base = botNames.map((bn) => [bn, win(BOTS[bn], n)] as [string, number]).sort((a, b) => b[1] - a[1]);
      const best = base[0];
      const rows = UNITS.filter((u) => u !== 'farm').map((u) => {
        const w = win(banned(BOTS[best[0]], u), n);
        return [`ohne ${u}`, f1(w), (w - best[1] >= 0 ? '+' : '') + f1(w - best[1])];
      });
      console.log(`\n### LOO ${d} ${p}P (n=${n}), bester Bot ${best[0]} = ${f1(best[1])} % (alle: ${base.map((b) => `${b[0]} ${f1(b[1])}`).join(', ')})\n`);
      console.log(table(['Variante', 'Sieg %', 'Delta'], rows));
    }
  }
}
