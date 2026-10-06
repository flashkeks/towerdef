// Erzeugt alle Quellbilder (PNG, 1:1) nach client/assets/src/. Eigene Werke (code-generiert), deterministisch.
// Aufruf: node scripts/gen-sprites.mjs   (danach node scripts/build-atlas.mjs)
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENEMIES, shadow } from './lib/enemies.mjs';
import * as tiles from './lib/tiles.mjs';
import { UNITS } from './lib/units.mjs';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'src');
rmSync(out, { recursive: true, force: true });
const save = (name, img) => {
  const file = resolve(out, `${name}.png`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, img.png());
  return img;
};

let n = 0;
const over = [];
const put = (name, img, budget = 16) => {
  save(name, img);
  n++;
  if (img.colors() > budget) over.push(`${name} (${img.colors()} Farben)`);
};

for (let v = 0; v < 4; v++) put(`tiles/grass_${v}`, tiles.grass(v));
for (let m = 0; m < 16; m++) put(`tiles/path_${m.toString(2).padStart(4, '0')}`, tiles.path(m), 24);
put('tiles/slot_ground', tiles.slotGround());
put('tiles/slot_hill', tiles.slotHill());
put('tiles/slot_big', tiles.slotBig());
put('tiles/deco_bush', tiles.decoBush());
put('tiles/deco_rock', tiles.decoRock());
put('tiles/deco_flowers', tiles.decoFlowers());
put('tiles/deco_tree', tiles.decoTree());
put('tiles/spawn', tiles.spawnRift());
put('tiles/base', tiles.baseGate());
for (const [id, fn] of Object.entries(UNITS)) put(`units/${id}`, fn());
for (const [id, fn] of Object.entries(ENEMIES)) for (const f of [0, 1]) put(`enemies/${id}_${f}`, fn(f));
put('enemies/shadow', shadow());
console.log(`${n} Quellbilder nach ${out}`);
if (over.length) {
  console.error(`Farbbudget ueberschritten: ${over.join(', ')}`);
  process.exitCode = 1;
}
