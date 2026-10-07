/**
 * Bot-Lauf als Replay exportieren (Format v3: Positionen + Unit-Mods; ohne --meta ist `unitMods` leer = neutral): so entsteht ein vom Simulator selbst erzeugtes Beispiel,
 * dessen End-Hash `npm run replay` und `test/replay.test.ts` prüfen. Kein Client, kein Browser.
 *
 *   npx tsx scripts/export-replay.ts --bot wide@normal --difficulty normal --seed 7 --out ../docs/balancing/playtests/beispiel-v3-bot-normal.json
 *   npx tsx scripts/export-replay.ts --bot wide --difficulty hard --seed 7 --meta mid --out ../docs/balancing/playtests/beispiel-v3-bot-hard-mid.json
 *   --format 2 schreibt das alte v2 (ohne unitMods; nur ohne --meta), z. B. fuer das v2-Beispiel.
 *
 * Das Format entspricht dem, was `client/src/game/recorder.ts` schreibt (nur ohne Tempo-Wechsel, Wellen-Tabelle und Freitext).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runMatch } from '../src/bots/index.js';
import { loadGameData, loadProgression } from '../src/data/load.js';
import { metaProfileMods, type MetaProfileName } from '../src/progression.js';
import type { DifficultyId } from '../src/index.js';
import { REPLAY_FORMAT_VERSION, type ReplayCommand } from './replay.js';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const bot = arg('bot', 'wide@normal');
const difficulty = arg('difficulty', 'normal') as DifficultyId;
const seed = Number(arg('seed', '7'));
const out = arg('out', '');
const meta = arg('meta', '') as MetaProfileName | '';
const format = Number(arg('format', String(REPLAY_FORMAT_VERSION)));
if (meta && !['fresh', 'mid', 'max'].includes(meta)) throw new Error(`--meta ${meta} unbekannt (fresh, mid, max)`);
if (format === 2 && meta) throw new Error('--format 2 kennt keine Mods');
const unitMods = meta ? metaProfileMods(loadProgression(), meta, loadGameData().units.units.map((u) => u.id), 1) : [];

const commands: ReplayCommand[] = [];
const r = runMatch({
  stage: 'standard20',
  difficulty,
  players: 1,
  seed,
  bots: [bot],
  unitMods,
  onCommand: (c) => commands.push({ tick: c.tick, player: c.player, cmd: c.cmd, ok: c.ok, ...(c.reason ? { reason: c.reason } : {}) }),
});
const file = {
  format: 'towerdef-replay',
  formatVersion: format,
  gameVersion: `sim-bot ${bot}`,
  stage: 'standard20',
  difficulty,
  players: 1,
  seed,
  team: null,
  ...(format >= 3 ? { unitMods } : {}),
  cards: [],
  complete: true,
  result: r.result === 'timeout' ? null : r.result,
  endTick: r.ticks,
  endHash: r.hash,
  endWave: r.endWave,
  endLives: r.baseHp,
  endCoins: r.finalCoins[0],
  durationTicks: r.ticks,
  durationMs: 0,
  date: '2026-10-07',
  commands,
  controls: [],
  waves: [],
  feedback: `Vom Simulator erzeugt: Bot ${bot}, ${difficulty}, Seed ${seed}${meta ? `, Meta-Profil ${meta}` : ''}. Kein Mensch.`,
};
const text = JSON.stringify(file, null, 1) + '\n';
if (out) {
  writeFileSync(resolve(process.env.INIT_CWD ?? process.cwd(), out), text);
  console.log(`${out}: ${r.result}, Tick ${r.ticks}, ${commands.length} Befehle, Hash ${r.hash}`);
} else process.stdout.write(text);
