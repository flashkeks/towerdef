// Zaehlt Dinge je Art und Blocker-Flaeche je Karte (Hilfsskript K1): node scripts/run-ts.mjs scripts/k1-stats.ts [hollow|marsh|bastion|skyreach]
import { HOLLOW_PROPS, blockers as hb } from '../src/pixel/map/hollow';
import { MARSH_PROPS, blockers as mb } from '../src/pixel/map/marsh';
import { BASTION_PROPS, blockers as bb } from '../src/pixel/map/bastion';
import { SKY_PROPS, blockers as sb } from '../src/pixel/map/skyreach';
const m = process.argv[2] ?? 'hollow';
const [props, bl] = m === 'hollow' ? [HOLLOW_PROPS, hb()] : m === 'marsh' ? [MARSH_PROPS, mb()] : m === 'bastion' ? [BASTION_PROPS, bb()] : [SKY_PROPS, sb()];
const by = new Map<string, { n: number; area: number }>();
for (const p of props) { const e = by.get(p.kind) ?? { n: 0, area: 0 }; e.n++; e.area += p.r > 0 ? Math.PI * p.r * p.r : 0; by.set(p.kind, e); }
console.log(m, 'Blocker', bl.length, 'Dinge', props.length);
console.log([...by.entries()].sort((a, b) => b[1].area - a[1].area).map(([k, v]) => `${k}:${v.n}x(${Math.round(v.area)})`).join('  '));
