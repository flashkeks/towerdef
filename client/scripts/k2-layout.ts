// Schaubild der Karten-Layouts (Wege, Wasser, Mauern, bebaubare Flaechen): node scripts/run-ts.mjs scripts/k2-layout.ts dunes OUT.png
import { writeFileSync } from 'node:fs';
import { png } from './png';
import { Buf, C } from '../src/pixel/map/buf';
import { inPoly, pathDistAll, pathLength, type Pt } from '../src/pixel/map/kit';
import * as du from '../src/pixel/map/dunes-layout';
import * as hb from '../src/pixel/map/harbor-layout';
import * as sp from '../src/pixel/map/spire-layout';
import { rectBlockers, rectPoly } from '../src/pixel/map/k2kit';

const [id = 'dunes', out = '/tmp/layout.png'] = process.argv.slice(2);
interface L { branches: Pt[][]; hw: number; water: Pt[][]; lava: Pt[][]; walls: Pt[][]; blockers: [number, number, number][]; build: number[] }
const layouts: Record<string, () => L> = {
  dunes: () => ({ branches: du.DU_BRANCHES, hw: du.DU_HW, water: du.duWater(), lava: [], walls: [], blockers: [], build: du.DU_BUILD }),
};
layouts.harbor = () => ({ branches: hb.HB_BRANCHES, hw: hb.HB_HW, water: hb.hbWater(), lava: [], walls: [], blockers: [], build: hb.HB_BUILD });
layouts.spire = () => ({ branches: sp.SP_BRANCHES, hw: sp.SP_HW, water: sp.spWater(), lava: sp.SP_LAVA, walls: sp.SP_WALLS.map(rectPoly), blockers: sp.SP_WALLS.flatMap(rectBlockers), build: sp.SP_BUILD });
const L = layouts[id]();
console.log(id, 'Aeste:', L.branches.map((b) => pathLength(b).toFixed(2)).join(' / '));
const b = new Buf(640, 360);
b.fill(C.dusk);
const free = (x: number, y: number, r: number): boolean => {
  if (x - r < L.build[0] || x + r > L.build[0] + L.build[2] || y - r < L.build[1] || y + r > L.build[1] + L.build[3]) return false;
  if (pathDistAll(L.branches, x, y) < L.hw + r) return false;
  for (const p of [...L.water, ...L.lava]) if ([[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => inPoly(x + dx, y + dy, p))) return false;
  for (const [bx, by, br] of L.blockers) if (Math.hypot(x - bx, y - by) < br + r) return false;
  return true;
};
let ok = 0, tot = 0;
for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) {
  const pd = pathDistAll(L.branches, x, y);
  if (pd < L.hw) b.set(x, y, C.tan);
  else if (free(x, y, 9)) { b.set(x, y, C.grass); if (x % 6 === 0 && y % 6 === 0) { tot++; ok++; } }
  else if (x % 6 === 0 && y % 6 === 0) tot++;
  for (const p of L.water) if (inPoly(x, y, p)) b.set(x, y, C.sky);
  for (const p of L.lava) if (inPoly(x, y, p)) b.set(x, y, C.orange);
  for (const p of L.walls) if (inPoly(x, y, p)) b.set(x, y, C.stone);
}
console.log('buildable (r9) approx', Math.round((ok / tot) * 100) + '%');
L.branches.forEach((br, i) => br.forEach(([x, y]) => b.rect(Math.round(x) - 1, Math.round(y) - 1, 3, 3, [C.red, C.yellow, C.white][i % 3])));
writeFileSync(out, png(b.rgba(), 640, 360, 2));
