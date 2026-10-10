// Welche Dinge verdecken die Wegmitte (Sprite liegt vor dem Weg, Fusspunkt weiter unten)? node scripts/run-ts.mjs scripts/k2-occlusion.ts [dunes|harbor|spire]
import { walk, type Pt } from '../src/pixel/map/kit';
import { mapArt, type MapId } from '../src/pixel/map/maps';
import { DU_BRANCHES, DU_HW } from '../src/pixel/map/dunes-layout';
import { HB_BRANCHES, HB_HW } from '../src/pixel/map/harbor-layout';
import { SP_BRANCHES, SP_HW } from '../src/pixel/map/spire-layout';

const cfg: Record<string, [Pt[][], number]> = { dunes: [DU_BRANCHES, DU_HW], harbor: [HB_BRANCHES, HB_HW], spire: [SP_BRANCHES, SP_HW] };
const ids = process.argv[2] ? [process.argv[2]] : ['dunes', 'harbor', 'spire'];
for (const id of ids) {
  const [br, hw] = cfg[id];
  const art = mapArt(id as MapId);
  const hits = new Map<string, number>();
  let total = 0;
  for (const b of br) for (const p of walk(b, 2)) {
    total++;
    for (const { prop, art: pa } of art.props) {
      if (prop.y <= p.y) continue; // Ding liegt hinter dem Weg
      for (const off of [-hw * 0.5, 0, hw * 0.5]) {
        const x = Math.round(p.x - p.dy * off), y = Math.round(p.y + p.dx * off);
        const sx = x - (prop.x - pa.ax), sy = y - (prop.y - pa.ay);
        if (sx >= 0 && sy >= 0 && sx < pa.buf.w && sy < pa.buf.h && pa.buf.get(sx, sy)) {
          if (off === 0) { const k = `${prop.kind}@${prop.x},${prop.y}`; hits.set(k, (hits.get(k) ?? 0) + 1); }
        }
      }
    }
  }
  console.log(id, 'Mittellinie verdeckt von:', [...hits].map(([k, n]) => `${k} (${n * 2}px)`).join(', ') || 'nichts', `(Proben ${total})`);
}
