// Sprite-Atlas-Pipeline: client/assets/src/**/*.png -> client/assets/atlas/atlas.png + atlas.json.
// Reproduzierbar: sortierte Eingabe, feste Packreihenfolge, feste Kompression. Pixi-kompatibles JSON (Spritesheet), 1 px Rand um jedes Bild,
// `meta.scaleMode = "nearest"`; der Lader setzt das auf die Textur. Aufruf: node scripts/build-atlas.mjs
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng, encodePng } from './lib/png.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const srcDir = resolve(root, 'src');
const outDir = resolve(root, 'atlas');
const PAD = 1;
const ATLAS_W = 512;

const walk = (d) => readdirSync(d).sort().flatMap((f) => {
  const p = resolve(d, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.png') ? [p] : [];
});

const imgs = walk(srcDir).map((p) => ({ name: relative(srcDir, p).replace(/\\/g, '/').replace(/\.png$/, ''), ...decodePng(readFileSync(p)) }));
if (!imgs.length) throw new Error(`keine Quellbilder in ${srcDir} (erst gen-sprites.mjs)`);
// Hoehe absteigend, dann Name: stabile Regalpackung (shelf)
imgs.sort((a, b) => b.h - a.h || (a.name < b.name ? -1 : 1));
let x = PAD;
let y = PAD;
let shelf = 0;
const place = new Map();
for (const im of imgs) {
  if (x + im.w + PAD > ATLAS_W) {
    x = PAD;
    y += shelf + PAD;
    shelf = 0;
  }
  place.set(im.name, { x, y });
  x += im.w + PAD;
  shelf = Math.max(shelf, im.h);
}
const H = y + shelf + PAD;
const atlasH = 1 << Math.ceil(Math.log2(H));
const data = new Uint8Array(ATLAS_W * atlasH * 4);
const frames = {};
for (const im of [...imgs].sort((a, b) => (a.name < b.name ? -1 : 1))) {
  const p = place.get(im.name);
  for (let j = 0; j < im.h; j++) data.set(im.data.subarray(j * im.w * 4, (j + 1) * im.w * 4), ((p.y + j) * ATLAS_W + p.x) * 4);
  frames[im.name] = { frame: { x: p.x, y: p.y, w: im.w, h: im.h }, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: im.w, h: im.h }, sourceSize: { w: im.w, h: im.h } };
}
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'atlas.png'), encodePng(ATLAS_W, atlasH, data));
writeFileSync(resolve(outDir, 'atlas.json'), `${JSON.stringify({ frames, meta: { image: 'atlas.png', format: 'RGBA8888', size: { w: ATLAS_W, h: atlasH }, scale: '1', scaleMode: 'nearest' } }, null, 1)}\n`);
console.log(`Atlas ${ATLAS_W}x${atlasH}, ${imgs.length} Bilder`);
