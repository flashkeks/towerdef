// Bilder Runde 15 B1 (Pixel-Karten): node scripts/shots-r15-b1.mjs
// Malt Frostfen und Quarry (leer, x2, mit Schnee/Funken/Rauch) und die Kartenwahl-Vorschaubilder nach docs/r15/.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(resolve(root, 'docs/r15'), { recursive: true });
const run = (...a) => execFileSync(process.execPath, [resolve(root, 'scripts/run-ts.mjs'), 'scripts/map-shot.ts', ...a], { cwd: root, stdio: 'inherit' });
run('frostfen', 'docs/r15/b1-frostfen.png', '2', '0', 'live');
run('quarry', 'docs/r15/b1-quarry.png', '2', '0', 'live');
run('x', 'docs/r15/b1-vorschau.png', '4', '0', 'previews');
