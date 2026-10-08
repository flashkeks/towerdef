/**
 * ASCII-Vorschau der Welt-Karten (Runde 8 / P3): `npx tsx scripts/map-preview.ts [welt-id ...]`.
 * Zeigt Zonenmaske, Wegpunkte, Pfadlänge und je Zone die Zahl der Kacheln, die von Boden-/Hügel-Units erreichbar sind
 * (Kacheln, auf denen eine 1x1-Unit stehen darf). Prüft nebenbei: Raster 17x11, Pfad liegt auf `p`-Kacheln, Wegpunkte achsparallel.
 */
import { loadGameData } from '../src/data/load.js';
import { createSim } from '../src/index.js';

const data = loadGameData();
const want = process.argv.slice(2);
for (const w of data.worlds ?? []) {
  if (want.length > 0 && !want.includes(w.id)) continue;
  const sim = createSim({ stage: `${w.id}-1`, difficulty: 'normal', players: 1, seed: 1, data });
  const map = sim.map();
  const ground = sim.catalog().find((u) => u.placement === 'ground');
  const hill = sim.catalog().find((u) => u.placement === 'hill');
  const len = sim.pathSamples().length / 10;
  console.log(`\n${w.name} (${w.id})  ${map.cols}x${map.rows}  Pfad ca. ${len.toFixed(0)} Kacheln  Welt-HP x${w.hpBp / 10000}`);
  w.map.zones.rows.forEach((r, j) => console.log(String(j).padStart(2), r));
  if (ground && hill) console.log(`bebaubar (Halbkachel-Raster): Boden ${sim.placementGrid(ground.id).length}, Huegel ${sim.placementGrid(hill.id).length}`);
}
