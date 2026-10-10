// Startet ein TypeScript-Skript ohne tsx: buendelt mit rolldown (liegt im Workspace) und fuehrt es mit node aus.
//   node scripts/run-ts.mjs scripts/gen-maps.ts [ARGS...]
// Arbeitsverzeichnis bleibt `client/`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [src, ...args] = process.argv.slice(2);
const out = join(mkdtempSync(join(tmpdir(), 'run-ts-')), 'bundle.mjs');
execFileSync(resolve(root, '../node_modules/.bin/rolldown'), [resolve(root, src), '-o', out, '-f', 'esm', '--platform', 'node'], { cwd: root, stdio: 'ignore' });
execFileSync(process.execPath, [out, ...args], { cwd: root, stdio: 'inherit' });
