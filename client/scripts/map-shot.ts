// Vorschau jeder Karte als PNG (ohne Browser): bundeln mit rolldown, dann node. Siehe scripts/shots-r15-b1.mjs.
import { writeFileSync } from 'node:fs';
import { mapArt, composeMap, mapPreview, type MapId } from '../src/pixel/map/maps';
import { png } from './png';
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
const t0 = Date.now();
mapArt(id as MapId);
console.log('gemalt in', Date.now() - t0, 'ms');
const img = what === 'preview' ? mapPreview(id as MapId) : composeMap(id as MapId, Number(fr));
writeFileSync(out, png(img.rgba(), img.w, img.h, Number(sc)));
