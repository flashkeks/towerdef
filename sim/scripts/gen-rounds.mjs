/**
 * Erzeugt sim/data/rounds.json: die EINE Rundenliste fuer alle Karten (Runde 15b, Max 10.10.2026), 120 feste Runden.
 * Aufruf: node scripts/gen-rounds.mjs   (aus sim/). Die Datei rounds.json ist das Ergebnis und wird eingecheckt;
 * hier stehen die Kurve (RBE-Ziel je Runde), die Themen-Rotation und die Einfuehrungsrunden der Gegner.
 * R1-20 sind die alte Meadow-Liste (unveraendert, ausser einer Pink-Gruppe in R15) und werden aus der vorhandenen Datei uebernommen.
 *
 * Umgebung: RBE_SCALE=1.0 (Faktor auf die ganze Kurve), zum Kalibrieren.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const E = JSON.parse(readFileSync(join(dir, 'enemies.json'), 'utf8'));
const old = JSON.parse(readFileSync(join(dir, 'rounds.json'), 'utf8')).slice(0, 20).map((r) => ({ ...r, groups: r.groups.filter((g) => g.type !== 'pink') }));
const SCALE = Number(process.env.RBE_SCALE ?? 1);

const bossHp = { leviathan: 300, wyrm: 900, colossus: 2500, dreadnought: 20000 };
const hpOf = (t, fort) => (bossHp[t] ?? E[t].hp) * (fort && E[t].heavy ? 2 : 1);
const tree = (t, fort) => hpOf(t, fort) + E[t].children.reduce((a, c) => a + tree(c, fort), 0);

// RBE-Ziel je Runde: stueckweise exponentiell zwischen den Ankern (ohne feste Bosse, die kommen obendrauf)
const ANCH = process.env.ANCH ? JSON.parse(process.env.ANCH) : [[20, 900], [40, 8000], [60, 34000], [80, 120000], [100, 400000], [120, 1500000]];
function target(r) {
  for (let i = 1; i < ANCH.length; i++) {
    if (r <= ANCH[i][0]) {
      const [r0, v0] = ANCH[i - 1], [r1, v1] = ANCH[i];
      return SCALE * v0 * Math.pow(v1 / v0, (r - r0) / (r1 - r0));
    }
  }
  return SCALE * ANCH[ANCH.length - 1][1];
}

// Zeitrahmen (ms) einer Gruppe nach Typ: Dauer des Spawns grob, Abstand begrenzt
const DUR = { red: 15000, blue: 15000, green: 15000, gold: 16000, pink: 16000, ironshell: 20000, ember: 20000, brute: 24000, frostling: 18000, crystal: 26000, gloomship: 30000, cruiser: 34000, duskrunner: 16000, dreadnought: 20000 };
const GAP = { gold: [60, 400], pink: [60, 400], ironshell: [250, 700], ember: [150, 600], brute: [300, 1200], frostling: [150, 600], crystal: [500, 1800], gloomship: [400, 5000], cruiser: [1200, 8000], duskrunner: [250, 1200], dreadnought: [6000, 12000] };
const NMAX = { gold: 200, pink: 200, ironshell: 120, ember: 120, brute: 100, frostling: 120, crystal: 200, gloomship: 160, cruiser: 60, duskrunner: 100, dreadnought: 3 };

function grp(type, share, r, opts = {}) {
  const fort = !!opts.fortified;
  let n = Math.round((target(r) * share * (opts.mul ?? 1)) / tree(type, fort));
  // Duskrunner: Schwarmgroesse fest nach Runde (schnell, getarnt, explosions-immun: jeder Durchbruch kostet 444 Leben), nicht nach RBE-Ziel
  if (type === 'duskrunner') n = Math.round((7 + 0.9 * (r - 90)) * Math.min(1.4, share / 0.4));
  n = Math.max(opts.min ?? 1, Math.min(NMAX[type], n));
  const [g0, g1] = GAP[type];
  let gap = Math.round(DUR[type] / n / 10) * 10;
  gap = Math.max(g0, Math.min(g1, gap));
  const g = { type, n, gapMs: gap, startMs: opts.start ?? 0 };
  if (opts.camo) g.camo = true;
  if (opts.regrow) g.regrow = true;
  if (fort) g.fortified = true;
  return g;
}
const raw = (type, n, gapMs, startMs, flags = {}) => ({ type, n, gapMs, startMs, ...flags });

// Themen je Phase: [typ, Anteil am RBE-Ziel, Merkmale]; "c" camo, "g" regrow, "f" fortified (nur wenn die Runde es zulaesst)
const P1 = [ // R21-37
  [['pink', 0.55, 'g'], ['brute', 0.45, '']],
  [['ironshell', 0.5, ''], ['ember', 0.5, 'c']],
  [['gold', 0.5, 'cg'], ['brute', 0.5, '']],
  [['ember', 0.4, ''], ['ironshell', 0.3, ''], ['pink', 0.3, 'c']],
  [['frostling', 0.6, ''], ['brute', 0.4, '']],
  [['gold', 0.6, 'g'], ['ironshell', 0.4, '']],
];
const P2 = [ // R38-59 (Crystal ab 38, Gloomship ab 45)
  [['crystal', 0.5, ''], ['frostling', 0.5, '']],
  [['brute', 0.5, 'f'], ['crystal', 0.3, ''], ['ember', 0.2, 'c']],
  [['gloomship', 0.55, ''], ['ironshell', 0.45, 'f']],
  [['frostling', 0.4, ''], ['crystal', 0.6, 'f']],
  [['brute', 0.45, 'f'], ['frostling', 0.3, 'c'], ['crystal', 0.25, '']],
  [['gloomship', 0.4, 'f'], ['ember', 0.2, 'c'], ['crystal', 0.4, '']],
];
const P3 = [ // R60-81
  [['gloomship', 0.6, 'f'], ['crystal', 0.4, 'f']],
  [['frostling', 0.3, 'cf'], ['crystal', 0.4, 'f'], ['brute', 0.3, 'f']],
  [['crystal', 0.5, 'f'], ['gloomship', 0.3, ''], ['ironshell', 0.2, 'f']],
  [['gloomship', 0.5, 'f'], ['frostling', 0.5, 'c']],
  [['gloomship', 0.75, 'f'], ['ember', 0.25, 'c']],
  [['crystal', 0.4, 'f'], ['gloomship', 0.6, '']],
];
const P4 = [ // R82-99 (Cruiser ab 82, Duskrunner ab 90)
  [['cruiser', 0.55, ''], ['gloomship', 0.45, 'f']],
  [['gloomship', 0.6, 'f'], ['crystal', 0.4, 'f']],
  [['cruiser', 0.5, 'f'], ['frostling', 0.3, 'cf'], ['brute', 0.2, 'f']],
  [['gloomship', 0.6, 'f'], ['crystal', 0.2, 'f'], ['frostling', 0.2, 'c']],
  [['cruiser', 0.7, 'f'], ['crystal', 0.3, 'f']],
];
const P5 = [ // R100-119 (Dreadnought nur in den festen Runden 100/110/120)
  [['cruiser', 0.7, 'f'], ['duskrunner', 0.3, '']],
  [['gloomship', 0.4, 'f'], ['cruiser', 0.6, 'f']],
  [['duskrunner', 0.3, ''], ['gloomship', 0.7, 'f']],
  [['cruiser', 0.8, 'f'], ['crystal', 0.2, 'f']],
  [['cruiser', 0.5, 'f'], ['duskrunner', 0.3, ''], ['gloomship', 0.2, 'f']],
];

function build(r, theme0, mul = 1) {
  const out = [];
  let start = 0;
  // Variation: Anteile der Gruppen verschieben sich je Runde (deterministisch), Summe bleibt 1
  const v = [1.25, 1, 0.8][r % 3];
  let theme = theme0.map(([t, sh, f], i) => [t, i === 0 ? sh * v : sh, f]);
  const sum = theme.reduce((a, x) => a + x[1], 0);
  theme = theme.map(([t, sh, f]) => [t, sh / sum, f]);
  // duenne Tarn-/Regrow-Beigabe, damit Erkennung und Regrow bis zum Ende gefragt bleiben
  if (r >= 30 && r % 3 === 0 && r !== 40 && r !== 60 && r !== 80) theme.push([r >= 70 ? 'pink' : 'gold', 0.05, 'cg']);
  theme.forEach(([type, share, fl], i) => {
    const heavy = !!E[type].heavy;
    const fort = fl.includes('f') && r >= 55 && heavy;
    const regrow = fl.includes('g') && r >= 30 && ['gold', 'pink'].includes(type);
    const camo = fl.includes('c') && r >= 13 && type !== 'duskrunner';
    out.push(grp(type, share, r, { camo, regrow, fortified: fort, start, mul }));
    start += i === 0 ? 5000 + (r % 4) * 1000 : 4000;
  });
  return out;
}

const rounds = [];
for (let r = 1; r <= 120; r++) {
  if (r <= 20) {
    const o = JSON.parse(JSON.stringify(old[r - 1]));
    // R1-20 bleiben exakt die alte Meadow-Liste (Pink Glim erscheint erst ab R21; ein Pink in R15 kippte Hard)
    rounds.push(o);
    continue;
  }
  let groups;
  if (r === 40) groups = [raw('wyrm', 1, 0, 0), ...build(r, [['frostling', 0.5, ''], ['crystal', 0.5, '']], 0.6).map((g) => ({ ...g, startMs: g.startMs + 12000 }))];
  else if (r === 60) groups = [raw('colossus', 1, 0, 0), ...build(r, [['gloomship', 0.5, 'f'], ['crystal', 0.5, 'f']], 0.5).map((g) => ({ ...g, startMs: g.startMs + 10000 }))];
  else if (r === 80) groups = [raw('leviathan', 1, 0, 0, { fortified: true }), raw('wyrm', 1, 0, 9000, { fortified: true }), raw('colossus', 1, 0, 18000, { fortified: true }), ...build(r, [['gloomship', 0.5, 'f'], ['crystal', 0.5, 'f']], 0.5).map((g) => ({ ...g, startMs: g.startMs + 6000 }))];
  else if (r === 100) groups = [raw('dreadnought', 1, 0, 0), ...build(r, [['cruiser', 0.5, 'f'], ['gloomship', 0.5, 'f']]).map((g) => ({ ...g, startMs: g.startMs + 10000 }))];
  else if (r === 110) groups = [raw('dreadnought', 1, 0, 0), raw('dreadnought', 1, 0, 20000, { fortified: true }), ...build(r, [['duskrunner', 0.6, ''], ['cruiser', 0.4, 'f']])];
  else if (r === 120) groups = [raw('dreadnought', 2, 14000, 0, { fortified: true }), ...build(r, [['duskrunner', 0.6, ''], ['cruiser', 0.4, 'f']]).map((g) => ({ ...g, startMs: g.startMs + 8000 })), raw('duskrunner', 60, 300, 40000)];
  else if (r === 90) groups = build(r, [['duskrunner', 0.7, ''], ['gloomship', 0.3, 'f']], 0.6); // erste Duskrunner: kleiner Schwarm (Max: "diese schwarzen, extrem schnellen Schiffe")
  else {
    let pool, k;
    if (r <= 37) { pool = P1; k = r - 21; if (r < 25) k = k % 4 === 3 ? 3 : k % 4; }
    else if (r <= 59) { pool = P2; k = r - 38; }
    else if (r <= 81) { pool = P3; k = r - 60; }
    else if (r <= 99) { pool = P4; k = r - 82; }
    else { pool = P5; k = r - 100; }
    let theme = pool[k % pool.length];
    // Einfuehrungen / Verfuegbarkeit
    const ok = (t) => !((t === 'frostling' && r < 25) || (t === 'crystal' && r < 38) || (t === 'gloomship' && r < 45) || (t === 'cruiser' && r < 82) || (t === 'duskrunner' && r < 90) || (t === 'dreadnought' && r < 100));
    theme = theme.map(([t, s, f]) => (ok(t) ? [t, s, f] : [t === 'dreadnought' ? 'cruiser' : t === 'cruiser' ? 'gloomship' : t === 'duskrunner' ? 'frostling' : t === 'gloomship' ? 'crystal' : t === 'crystal' ? 'brute' : 'pink', s, f]));
    if (r === 25) theme = [['frostling', 0.6, ''], ['brute', 0.4, '']];
    if (r === 30) theme = [['pink', 0.35, 'g'], ['gold', 0.25, 'g'], ['brute', 0.4, '']];
    if (r === 38) theme = [['crystal', 0.5, ''], ['brute', 0.5, '']];
    if (r === 45) theme = [['gloomship', 0.6, ''], ['ironshell', 0.4, '']];
    if (r === 55) theme = [['brute', 0.5, 'f'], ['ironshell', 0.5, 'f']];
    if (r === 82) theme = [['cruiser', 0.6, ''], ['gloomship', 0.4, 'f']];
    // gleiche Typen in einer Theme-Liste zusammenfuehren geht nicht noetig; Duplikate sind erlaubt
    groups = build(r, theme);
  }
  rounds.push({ round: r, groups });
}
writeFileSync(join(dir, 'rounds.json'), JSON.stringify(rounds, null, 1) + '\n');
const rbe = (g) => g.n * tree(g.type, !!g.fortified);
console.log(rounds.filter((_, i) => process.env.ALL || (i + 1) % 10 === 0 || i === 14).map((r) => `R${r.round}: ${Math.round(r.groups.reduce((a, g) => a + rbe(g), 0))} RBE, ${r.groups.map((g) => g.n + 'x' + g.type + (g.fortified ? 'F' : '') + (g.camo ? 'c' : '') + (g.regrow ? 'g' : '')).join(' ')}`).join('\n'));
