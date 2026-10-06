/** Markdown- und CSV-Ausgabe der aggregierten Zellen. */
import type { CellStats, WaveStats } from './types.js';

const pct = (v: number, d = 0): string => `${(v * 100).toFixed(d)} %`;
const f1 = (v: number): string => (Number.isFinite(v) ? v.toFixed(1) : '-');
const f2 = (v: number): string => (Number.isFinite(v) ? v.toFixed(2) : '-');
const i0 = (v: number): string => Math.round(v).toString();

export interface ReportMeta {
  title: string;
  /** Kommandozeile / Parameter zur Reproduktion. */
  params: Record<string, string | number | boolean>;
}

export const DEFINITIONS = `## Definitionen

- **Siegquote**: Anteil der Runs mit Ergebnis \`win\`. Infinite hat keinen Sieg; dort zählen Median-Endwave und P10/P90 (Endwave = zuletzt gestartete Wave bei Ende; abgebrochene Runs (\`maxWaves\`) zählen mit der Abbruchwave und sind als "abgebrochen" ausgewiesen).
- **Verlustrate Wave n**: Anteil *aller* Runs, die in Wave n verlieren; "Verlust-Wave" ist die Wave des Gegners, dessen Leak die Base auf <= 0 bringt (Waves überlappen). **Hazard** = Verluste in Wave n / Runs, die Wave n erreicht haben. **Leak-Rate** = Anteil der erreichenden Runs mit mindestens einem Leak von Gegnern der Wave n.
- **Geldkurve**: Münzen des gesamten Teams am Ende der Wave n (nach Wave-Bonus/Farm, vor den Käufen der nächsten Wave; bei Verlust: Stand beim Ende); P10/Median/P90 über die Runs, die Wave n erreicht haben. **Einkommen** = Kill-Bounty + Wave-Bonus + Farm, die während der Wave n (Zeitraum zwischen Start Wave n und Start Wave n+1) eingehen; Quellen als Medianwerte. Münzen/Einkommen sind Team-Summen.
- **Pool/Münze** (Kapazitätsmaß, je Wave): Pool-HP der Wave (Summe Max-HP aller gespawnten Gegner inkl. Splitter-Kinder, mit Schwierigkeits- und Koop-Faktor, ohne Rüstung) geteilt durch die netto eingesetzten Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös bis einschließlich Wave n, Teamsumme). Referenz aus recommendations §4: 0,025 DPS je Münze x 20 s = 0,5 HP Pool je Münze entspricht Pool/Kapazität 1,0 (Näherung, Anlage der Münzen unterschiedlich wirksam). Median über Runs.
- **Leak-Quellen**: Anzahl, Anteil und Base-Schaden aller Leaks nach Gegnertyp über alle Runs der Zelle.
- **Farm-Anteil** = Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). **Payback** = je Run (Summe der Farm-Investitionen: Platzierung + Upgrades) / (mittlerer Farm-Ertrag je Wave mit Ertrag) in Waves, Median über Runs mit Farm.
- **Upgrade-Anteil** = Upgrade-Münzen / (Platzierungs- + Upgrade-Münzen).
- **Spielminuten** = Ticks / 20 / 60 (Median, P10, P90).
`;

function waveRows(c: CellStats): string[] {
  const head =
    '| Wave | erreicht | Verlustrate | Hazard | Leak-Rate | Münzen P10 | Median | P90 | Einkommen P10 | Median | P90 | kill | wave | farm | Pool/Münze |';
  const sep = '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|';
  const rows = c.waves.map(
    (w: WaveStats) =>
      `| ${w.n} | ${pct(w.reachedFrac)} | ${pct(w.lossRate, 1)} | ${pct(w.hazard, 1)} | ${pct(w.leakRate)} | ${i0(w.coins.p10)} | ${i0(w.coins.med)} | ${i0(w.coins.p90)} | ${i0(w.income.p10)} | ${i0(w.income.med)} | ${i0(w.income.p90)} | ${i0(w.incKill)} | ${i0(w.incWave)} | ${i0(w.incFarm)} | ${f2(w.poolPerCoin)} |`,
  );
  return [head, sep, ...rows];
}

export function cellLabel(c: CellStats): string {
  return `${c.stage} / ${c.bot} / ${c.difficulty} / ${c.players} Spieler`;
}

export function toMarkdown(cells: CellStats[], meta: ReportMeta, charts: Record<string, string[]> = {}): string {
  const L: string[] = [];
  L.push(`# ${meta.title}`, '');
  L.push('Erzeugt mit `npm run sim` (sim/scripts/sim-cli.ts). Parameter: ' + Object.entries(meta.params).map(([k, v]) => `\`${k}=${v}\``).join(', '), '');
  L.push('## Übersicht', '');
  L.push('| Stage | Bot | Schwierigkeit | Spieler | Runs | Siegquote | Verloren | Abgebrochen | Endwave Median (P10-P90) | Minuten Median (P10-P90) | Farm-Anteil | Payback (Waves) | Upgrade-Anteil |');
  L.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const c of cells) {
    L.push(
      `| ${c.stage} | ${c.bot} | ${c.difficulty} | ${c.players} | ${c.runs} | ${pct(c.winRate, 1)} | ${c.losses} | ${c.capped} | ${f1(c.endWave.med)} (${i0(c.endWave.p10)}-${i0(c.endWave.p90)}) | ${f1(c.minutes.med)} (${f1(c.minutes.p10)}-${f1(c.minutes.p90)}) | ${pct(c.farmShareIncome, 1)} | ${c.farmPayback.n ? f1(c.farmPayback.med) : '-'} | ${pct(c.upgradeShare)} |`,
    );
  }
  L.push('');
  for (const c of cells) {
    L.push(`## ${cellLabel(c)}`, '');
    L.push(
      `Runs ${c.runs}, Siegquote ${pct(c.winRate, 1)} (${c.wins} Siege, ${c.losses} Niederlagen, ${c.capped} abgebrochen). Endwave Median ${f1(c.endWave.med)} (P10 ${i0(c.endWave.p10)}, P90 ${i0(c.endWave.p90)}), Dauer Median ${f1(c.minutes.med)} min.`,
      '',
    );
    for (const svg of charts[c.key] ?? []) L.push(`![${svg}](${svg})`, '');
    L.push(...waveRows(c), '');
    if (c.leakSources.length) {
      L.push('Leak-Quellen:', '', '| Typ | Leaks | Anteil | Base-Schaden |', '|---|---:|---:|---:|');
      for (const s of c.leakSources) L.push(`| ${s.type} | ${s.count} | ${pct(s.share, 1)} | ${s.damage} |`);
      L.push('');
    }
  }
  L.push(DEFINITIONS);
  return L.join('\n');
}

const csvCell = (v: string | number): string => {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const WAVE_CSV_HEADER = [
  'stage', 'bot', 'difficulty', 'players', 'runs', 'wave', 'reached', 'reached_frac', 'lost_here', 'loss_rate', 'hazard', 'leak_rate',
  'coins_p10', 'coins_med', 'coins_p90', 'income_p10', 'income_med', 'income_p90', 'inc_kill_med', 'inc_wave_med', 'inc_farm_med',
  'farm_share', 'pool_per_coin', 'base_loss_mean',
];

export function wavesCsv(cells: CellStats[]): string {
  const L = [WAVE_CSV_HEADER.join(',')];
  const r = (v: number): string => (Math.round(v * 10000) / 10000).toString();
  for (const c of cells) {
    for (const w of c.waves) {
      L.push(
        [
          c.stage, c.bot, c.difficulty, c.players, c.runs, w.n, w.reached, r(w.reachedFrac), w.lostHere, r(w.lossRate), r(w.hazard), r(w.leakRate),
          r(w.coins.p10), r(w.coins.med), r(w.coins.p90), r(w.income.p10), r(w.income.med), r(w.income.p90), r(w.incKill), r(w.incWave), r(w.incFarm),
          r(w.farmShare), r(w.poolPerCoin), r(w.baseLossMean),
        ].map(csvCell).join(','),
      );
    }
  }
  return L.join('\n') + '\n';
}

export const SUMMARY_CSV_HEADER = [
  'stage', 'bot', 'difficulty', 'players', 'runs', 'wins', 'losses', 'capped', 'win_rate', 'endwave_p10', 'endwave_med', 'endwave_p90',
  'minutes_p10', 'minutes_med', 'minutes_p90', 'farm_share_income', 'upgrade_share', 'farm_payback_med', 'farm_payback_n',
];

export function summaryCsv(cells: CellStats[]): string {
  const L = [SUMMARY_CSV_HEADER.join(',')];
  const r = (v: number): string => (Math.round(v * 10000) / 10000).toString();
  for (const c of cells) {
    L.push(
      [
        c.stage, c.bot, c.difficulty, c.players, c.runs, c.wins, c.losses, c.capped, r(c.winRate), r(c.endWave.p10), r(c.endWave.med), r(c.endWave.p90),
        r(c.minutes.p10), r(c.minutes.med), r(c.minutes.p90), r(c.farmShareIncome), r(c.upgradeShare), r(c.farmPayback.med), c.farmPayback.n,
      ].map(csvCell).join(','),
    );
  }
  return L.join('\n') + '\n';
}
