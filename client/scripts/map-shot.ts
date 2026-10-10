// Vorschau jeder Karte als PNG (ohne Browser): bundeln mit rolldown, dann node. Siehe scripts/shots-r15-b1.mjs.
import { writeFileSync } from 'node:fs';
import { mapArt, composeMap, mapPreview, type MapId } from '../src/pixel/map/maps';
import { png } from './png';
import { Buf } from '../src/pixel/map/buf';
import { QUARRY_PROPS, lavaAt, Q_BRANCHES, Q_HW } from '../src/pixel/map/quarry';
import { pathDistAll } from '../src/pixel/map/kit';
import * as ff from '../src/pixel/map/frostfen';
const [id = 'frostfen', out = '/tmp/map.png', sc = '2', fr = '0', what = 'full'] = process.argv.slice(2);
if (what === 'check') {
  for (const q of QUARRY_PROPS) {
    const bad = [];
    if (lavaAt(q.x, q.y) < Math.max(q.r - 1, 2)) bad.push('Lava');
    if (q.r > 0 && pathDistAll(Q_BRANCHES, q.x, q.y - 2) < Q_HW + q.r - 0.5) bad.push('Weg');
    if (bad.length) console.log('quarry', q.kind, q.x, q.y, bad.join('+'));
  }
  for (const q of ff.FROST_PROPS) {
    const bad = [];
    if (ff.lakeAt(q.x, q.y) < Math.max(q.r - 1, 0) && !(q.kind === 'shanty' || q.kind === 'lamp' || q.kind === 'reeds')) bad.push('See');
    if (q.r > 0 && pathDistAll(ff.FF_BRANCHES, q.x, q.y - 2) < ff.FF_HW + q.r - 0.5) bad.push('Weg');
    if (q.r > 0 && ff.onFloe(q.x, q.y)) bad.push('Scholle');
    if (bad.length) console.log('frost', q.kind, q.x, q.y, bad.join('+'));
  }
  process.exit(0);
}
if (what === 'previews') {
  // alle Kartenwahl-Vorschaubilder nebeneinander (je 160 x 90, 8 px Luecke)
  const ids = (process.env.PREVIEW_IDS ?? 'meadow,frostfen,quarry').split(',') as MapId[];
  const sheet = new Buf(ids.length * 168 - 8, 90);
  ids.forEach((m, i) => { const p = mapPreview(m); for (let y = 0; y < 90; y++) for (let x = 0; x < 160; x++) sheet.set(i * 168 + x, y, p.get(x, y)); });
  writeFileSync(out, png(sheet.rgba(), sheet.w, sheet.h, Number(sc)));
  process.exit(0);
}
const t0 = Date.now();
mapArt(id as MapId);
console.log('gemalt in', Date.now() - t0, 'ms');
const img = what === 'preview' ? mapPreview(id as MapId) : composeMap(id as MapId, Number(fr), what === 'live' ? Number(fr) * 1000 + 3000 : undefined);
let view = img;
if (process.env.CROP) {
  const [cx, cy, cw, ch] = process.env.CROP.split(',').map(Number);
  view = new Buf(cw, ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) view.set(x, y, img.get(cx + x, cy + y));
}
writeFileSync(out, png(view.rgba(), view.w, view.h, Number(sc)));
