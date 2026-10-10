// Pruefung der Runde-16-Karten (K1): welche Dinge liegen mit sichtbaren Pixeln auf dem Weg / im Wasser?
//   node scripts/run-ts.mjs scripts/check-r16.ts [hollow|marsh|bastion|skyreach]
import { hollowArt } from '../src/pixel/map/props-hollow';
import { HOLLOW_PROPS, HO_BRANCHES, HO_HW, pondAt } from '../src/pixel/map/hollow';
import { at, pathCoordsOf, spriteOver } from '../src/pixel/map/scene';
import * as m from '../src/pixel/map/marsh';

const which = process.argv[2] ?? 'hollow';
if (which === 'hollow') {
  const pc = pathCoordsOf(HO_BRANCHES);
  for (const p of HOLLOW_PROPS) {
    const art = hollowArt(p.kind, p.v);
    const onPath = spriteOver(art, p, (x, y) => at(pc.dist, x, y) < HO_HW + 1);
    const inWater = ['boat', 'dock', 'cattail', 'willow'].includes(p.kind) ? 0 : spriteOver(art, p, (x, y) => pondAt(x, y) < 0);
    if (onPath > 0 || inWater > 0) console.log('hollow', p.kind, p.x, p.y, onPath ? `Weg ${onPath}px` : '', inWater ? `Wasser ${inWater}px` : '');
  }
}
if (which === 'marsh') {
  const total = m.WATER_MASK.reduce((a, v) => a + v, 0);
  console.log('Wasser', total, 'px =', (total / (640 * 360) * 100).toFixed(1), '%, groesste Gebiete', m.waterAreas().slice(0, 8).join(', '), ', Rechtecke', m.waterPolygons().length);
}
