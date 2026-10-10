// Wege der vier Runde-16-Karten (K1): hollow, marsh, bastion, skyreach.
//   node scripts/gen-r16-paths.mjs          (schreibt nur id, name, size, path, paths, pathHalfWidth, buildArea in sim/data/maps/*.json;
//                                            water, blockers, walls, bridges schreibt scripts/gen-maps.ts aus dem Layout)
// Die Ecken stehen hier, abgeschrägt (`chamfer`) ergeben sie die Wegpunkte. Zwei Eingänge: der obere Ast steht hier,
// der untere ist seine Spiegelung an y = 180, danach läuft der gemeinsame Rest. Damit sind beide Äste exakt gleich lang.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const len = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** Ecken abschrägen: an jeder Innenecke zwei Punkte im Abstand r (höchstens halbe Teilstrecke). */
function chamfer(pts, r) {
  if (!r) return pts;
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const k = Math.min(r, l1 / 2, l2 / 2);
    out.push([b[0] + ((a[0] - b[0]) / l1) * k, b[1] + ((a[1] - b[1]) / l1) * k]);
    out.push([b[0] + ((c[0] - b[0]) / l2) * k, b[1] + ((c[1] - b[1]) / l2) * k]);
  }
  out.push(pts[pts.length - 1]);
  return out.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

/** Offener Catmull-Rom-Spline durch die Stützpunkte, alle `step` px ein Wegpunkt (weiche Kurven für Sumpf und Gebirge). */
function spline(pts, step) {
  const out = [];
  const cr = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    const k = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let s = 0; s < k; s++) out.push([cr(a[0], b[0], c[0], d[0], s / k), cr(a[1], b[1], c[1], d[1], s / k)]);
  }
  out.push(pts[pts.length - 1]);
  return out.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

const MAPS = {
  hollow: {
    name: 'Harvest Hollow',
    corners: [[-16, 300], [72, 300], [72, 44], [176, 44], [176, 276], [266, 276], [266, 100], [372, 100], [372, 176], [470, 176], [470, 56], [560, 56], [560, 316], [656, 316]],
    chamfer: 7,
  },
  marsh: {
    name: 'Mistwood Marsh',
    corners: [[-16, 300], [70, 300], [136, 222], [72, 140], [136, 66], [226, 62], [286, 130], [228, 214], [286, 298], [380, 304], [436, 236], [384, 162], [440, 84], [520, 74], [580, 140], [566, 214], [656, 246]],
    spline: 8,
  },
  bastion: {
    name: 'Sunken Bastion',
    // oberer Ast bis zum Zusammenfluss (M), danach gemeinsam
    corners: [[-16, 34], [150, 34], [150, 90], [30, 90], [30, 146], [290, 146], [290, 66], [480, 66], [480, 180]],
    tail: [[480, 180], [656, 180]],
    mirror: true,
    chamfer: 0,
  },
  skyreach: {
    name: 'Skyreach Cliffs',
    // Serpentinen: drei Läufe je Ast (ost, west, ost) mit Kehren, Schlucht bei x ~ 470 (Hängebrücken), Zusammenfluss danach
    corners: [[-16, 40], [100, 40], [200, 40], [272, 40], [300, 68], [272, 96], [200, 96], [110, 96], [84, 124], [110, 152], [200, 152], [330, 152], [430, 152], [520, 180]],
    tail: [[520, 180], [656, 180]],
    mirror: true,
    spline: 8,
  },
};

for (const [id, m] of Object.entries(MAPS)) {
  const top = m.spline ? spline(m.corners, m.spline) : chamfer(m.corners, m.chamfer);
  let paths;
  if (m.mirror) {
    const tail = m.tail ? (m.spline ? spline(m.tail, m.spline) : chamfer(m.tail, m.chamfer)) : [];
    const a = [...top, ...tail.slice(1)];
    const b = [...top.map(([x, y]) => [x, 360 - y]), ...tail.slice(1)];
    paths = [a, b];
  } else paths = [top];
  console.log(id, paths.map((p) => Math.round(len(p))).join(' / '), 'px,', paths[0].length, 'Punkte');
  if (process.argv.includes('--dry')) continue;
  const file = resolve(root, `../sim/data/maps/${id}.json`);
  const j = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { water: [], ice: [], lava: [], bridges: [], blockers: [] };
  Object.assign(j, { id, name: m.name, size: [640, 360], path: paths[0], paths, pathHalfWidth: 13, buildArea: [8, 8, 624, 344] });
  const order = ['id', 'name', 'size', 'path', 'paths', 'pathHalfWidth', 'water', 'ice', 'lava', 'bridges', 'blockers', 'walls', 'buildArea'];
  const o = {};
  for (const k of order) if (k in j) o[k] = j[k];
  for (const k of Object.keys(j)) if (!(k in o)) o[k] = j[k];
  writeFileSync(file, JSON.stringify(o) + '\n');
}
