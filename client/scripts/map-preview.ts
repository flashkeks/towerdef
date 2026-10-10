// Vorschau der gemalten Karte als PNG (ohne Browser): npx tsx scripts/map-preview.ts OUT.png [SCALE] [frame]
import { writeFileSync } from 'node:fs';
import { Buf } from '../src/pixel/map/buf';
import { png } from './png';
import { composeMeadow } from '../src/pixel/map/compose';

const [out = '/tmp/map.png', sc = '2', fr = '0'] = process.argv.slice(2);
const t0 = Date.now();
const img: Buf = composeMeadow(Number(fr));
console.log('gemalt in', Date.now() - t0, 'ms');
writeFileSync(out, png(img.rgba(), img.w, img.h, Number(sc)));
