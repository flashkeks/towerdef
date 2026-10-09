// Schreibt Blocker (beide Karten) und den See von Frostfen aus dem Layout in sim/data/maps/*.json:
//   node scripts/run-ts.mjs scripts/gen-maps.ts      (tsx gibt es im Repo nicht, run-ts buendelt mit rolldown)
// Wege, Eisschollen (`ice`), Lava und Bruecken bleiben unangetastet (Agent A / Sim).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { blockers as ffBlockers, waterPolygons } from '../src/pixel/map/frostfen';
import { blockers as qBlockers } from '../src/pixel/map/quarry';

function patch(name: string, fn: (j: Record<string, unknown>) => void): void {
  const file = resolve(process.cwd(), `../sim/data/maps/${name}.json`);
  const j = JSON.parse(readFileSync(file, 'utf8'));
  fn(j);
  writeFileSync(file, JSON.stringify(j) + '\n');
  console.log(name, 'geschrieben:', (j.blockers as unknown[]).length, 'Blocker');
}
patch('frostfen', (j) => { j.water = waterPolygons(); j.blockers = ffBlockers(); });
patch('quarry', (j) => { j.blockers = qBlockers(); });
