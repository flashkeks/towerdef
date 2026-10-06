/**
 * Runde 5 / P3: Siegquoten, Leave-one-out und Boss-Diagnose in einem Werkzeug (Profil standardmäßig `normal`).
 *   --part rates  Siegquote je Bot und Stufe            (--bots wide,aoe --difficulty hard --n 100)
 *   --part loo    Leave-one-out je Unit für einen Bot    (--bot wide, Verbot über botTuning.banned, --units titan,frost ...)
 *   --part boss   Boss-Diagnose: Leak-Wave, Fenster, Antworten (--bot wide)
 * Seeds: --seed0 (Standard 1) bis seed0+n-1; je Teilbereich ein Prozess ist möglich (siehe r5-p3.sh).
 * Ausgabe zeilenweise JSON-frei als Markdown; `--raw` gibt "win n" je Zeile für das Zusammenfügen.
 */
import type { DifficultyId } from '../../src/index.js';
import { BOTS } from '../../src/bots/index.js';
import { botTuning } from '../../src/bots/util.js';
import { argNum, argStr, ARGS, play, table } from './lib.js';

if (!process.env.BOT_PROFILE) botTuning.profile = 'normal';
const part = argStr('part', 'rates');
const diffs = argStr('difficulty', 'normal').split(',') as DifficultyId[];
const n = argNum('n', 60);
const seed0 = argNum('seed0', 1);
const players = argNum('players', 1);
const UNITS = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost', 'titan', 'farm'];

const wins = (d: DifficultyId, bot: string, ban: string[]): { win: number; n: number; bossLeak: number; waves: number[] } => {
  botTuning.banned = ban;
  let win = 0;
  let bossLeak = 0;
  const waves: number[] = [];
  for (let s = seed0; s < seed0 + n; s++) {
    const r = play({ difficulty: d, players, seed: s, bots: BOTS[bot] });
    if (r.result === 'win') win++;
    else if (Object.keys(r.leaks).some((k) => k.startsWith('boss@'))) bossLeak++;
    waves.push(r.endWave);
  }
  botTuning.banned = [];
  return { win, n, bossLeak, waves };
};
const pct = (x: { win: number; n: number }): number => Math.round((x.win / x.n) * 1000) / 10;

if (part === 'rates') {
  const bots = argStr('bots', Object.keys(BOTS).join(',')).split(',');
  for (const d of diffs) {
    const rows = bots.map((b) => {
      const r = wins(d, b, []);
      return [b, pct(r), `${r.win}/${r.n}`, r.bossLeak];
    });
    if (ARGS.includes('--raw')) for (const r of rows) console.log(`RAW ${d} ${r[0]} ${r[2]} ${r[3]}`);
    else console.log(`\n### ${d} ${players}P (n=${n}, Profil ${botTuning.profile})\n\n` + table(['Bot', 'Sieg %', 'Siege', 'Boss-Tod'], rows));
  }
} else if (part === 'loo') {
  const bot = argStr('bot', 'wide');
  const units = argStr('units', UNITS.filter((u) => u !== 'farm').join(',')).split(',');
  for (const d of diffs) {
    const base = wins(d, bot, []);
    if (ARGS.includes('--raw')) console.log(`RAW ${d} ${bot} none ${base.win}/${base.n} ${base.bossLeak}`);
    const rows: (string | number)[][] = [['(keine)', pct(base), '', base.bossLeak]];
    for (const u of units) {
      const r = wins(d, bot, [u]);
      if (ARGS.includes('--raw')) console.log(`RAW ${d} ${bot} ${u} ${r.win}/${r.n} ${r.bossLeak}`);
      rows.push([`ohne ${u}`, pct(r), (pct(r) - pct(base) >= 0 ? '+' : '') + (Math.round((pct(r) - pct(base)) * 10) / 10), r.bossLeak]);
    }
    if (!ARGS.includes('--raw')) console.log(`\n### LOO ${d} ${bot} (n=${n}, Profil ${botTuning.profile})\n\n` + table(['Variante', 'Sieg %', 'Delta', 'Boss-Tod'], rows));
  }
} else if (part === 'diag') {
  // Boss-Diagnose: Rest-HP des Bosses beim Leak, Team bei Wave 19, Fenster-Treffer. --ban titan,...
  const bot = argStr('bot', 'wide');
  const ban = argStr('ban', '').split(',').filter(Boolean);
  for (const d of diffs) {
    botTuning.banned = ban;
    const rest: number[] = [];
    const teams: Record<string, number> = {};
    const endW: Record<number, number> = {};
    const evc: Record<string, number> = {};
    let win = 0;
    for (let s = seed0; s < seed0 + n; s++) {
      let hooked = false;
      const r = play({
        difficulty: d,
        players,
        seed: s,
        bots: BOTS[bot],
        beforeTick: (sim) => {
          if (hooked) return;
          hooked = true;
          const orig = sim.drainEvents.bind(sim);
          sim.drainEvents = () => {
            const ev = orig();
            for (const e of ev) {
              if (e.type === 'bossWindow' && e.open) evc[`win:${e.cause}`] = (evc[`win:${e.cause}`] ?? 0) + 1;
              else if (e.type === 'bossCast') evc[`cast:${e.ability}:${e.interrupted ? e.cause : 'ok'}`] = (evc[`cast:${e.ability}:${e.interrupted ? e.cause : 'ok'}`] ?? 0) + 1;
              else if (e.type === 'bossWard') evc[`ward:${e.state}`] = (evc[`ward:${e.state}`] ?? 0) + 1;
            }
            return ev;
          };
        },
      });
      if (r.result === 'win') win++;
      else endW[r.endWave] = (endW[r.endWave] ?? 0) + 1;
      for (const l of r.leakLog) if (l.type === 'boss') rest.push(Math.round((l.hp / l.maxHp) * 100));
      const key = [...new Set(r.sim.state.units.map((u) => u.defId))].sort().join('+');
      teams[key] = (teams[key] ?? 0) + 1;
    }
    botTuning.banned = [];
    rest.sort((a, b) => a - b);
    console.log(`\n### diag ${d} ${bot} ban=[${ban}] n=${n}: Sieg ${win}/${n}; Boss-Leaks ${rest.length}, Rest-HP % ${rest.join(',')}`);
    console.log('Boss-Ereignisse je Lauf: ' + Object.entries(evc).sort().map(([k, v]) => `${k}=${(v / n).toFixed(2)}`).join(' '));
    console.log('Verlust-Wave: ' + Object.entries(endW).map(([k, v]) => `W${k}:${v}`).join(' '));
    console.log(Object.entries(teams).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${v}x ${k}`).join('\n'));
  }
} else throw new Error('--part unbekannt');
