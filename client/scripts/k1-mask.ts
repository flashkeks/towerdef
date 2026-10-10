// Zeigt, wo ein Ranger (Radius 9) auf einer K1-Karte stehen darf: Bild mit gruenem Raster, plus Anteil.
//   node scripts/run-ts.mjs scripts/k1-mask.ts KARTE OUT.png [skala]
import { writeFileSync } from 'node:fs';
import { composeMap, type MapId } from '../src/pixel/map/maps';
import { C } from '../src/pixel/map/buf';
import { pathDistAll, inPoly } from '../src/pixel/map/kit';
import { png } from './png';
import hollow from '../../sim/data/maps/hollow.json';
import marsh from '../../sim/data/maps/marsh.json';
import bastion from '../../sim/data/maps/bastion.json';
import skyreach from '../../sim/data/maps/skyreach.json';
const [id = 'skyreach', out = '/tmp/mask.png', sc = '2'] = process.argv.slice(2);
const J = ({ hollow, marsh, bastion, skyreach } as Record<string, any>)[id];
const R = 9;
const img = composeMap(id as MapId, 0);
let ok = 0, n = 0;
for (let y = 8; y < 352; y += 2) for (let x = 8; x < 632; x += 2) {
  n++;
  if (pathDistAll(J.paths, x, y) < J.pathHalfWidth + R) continue;
  if (J.water.some((p: [number, number][]) => [[0, 0], [R, 0], [-R, 0], [0, R], [0, -R]].some(([dx, dy]) => inPoly(x + dx, y + dy, p)))) { img.set(x, y, C.sky); continue; }
  if (J.blockers.some((b: number[]) => (x - b[0]) ** 2 + (y - b[1]) ** 2 < (b[2] + R) ** 2)) continue;
  ok++;
  img.set(x, y, C.yellow); img.set(x + 1, y, C.yellow);
}
console.log(id, 'baubar', (ok / n * 100).toFixed(1) + '%');
writeFileSync(out, png(img.rgba(), img.w, img.h, Number(sc)));
