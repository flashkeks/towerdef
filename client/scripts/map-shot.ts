// Vorschau jeder Karte als PNG (ohne Browser): bundeln mit rolldown, dann node. Siehe scripts/shots-r15-b1.mjs.
import { writeFileSync } from 'node:fs';
import { mapArt, composeMap, mapPreview, type MapId } from '../src/pixel/map/maps';
import { png } from './png';
const [id = 'frostfen', out = '/tmp/map.png', sc = '2', fr = '0', what = 'full'] = process.argv.slice(2);
const t0 = Date.now();
mapArt(id as MapId);
console.log('gemalt in', Date.now() - t0, 'ms');
const img = what === 'preview' ? mapPreview(id as MapId) : composeMap(id as MapId, Number(fr));
writeFileSync(out, png(img.rgba(), img.w, img.h, Number(sc)));
