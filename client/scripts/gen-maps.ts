// Schreibt Blocker (beide Karten) und den See von Frostfen aus dem Layout in sim/data/maps/*.json:
//   node scripts/run-ts.mjs scripts/gen-maps.ts      (tsx gibt es im Repo nicht, run-ts buendelt mit rolldown)
// Wege, Eisschollen (`ice`), Lava und Bruecken bleiben unangetastet (Agent A / Sim).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Pt } from '../src/pixel/map/kit';
import { blockers as ffBlockers, waterPolygons } from '../src/pixel/map/frostfen';
import { blockers as qBlockers } from '../src/pixel/map/quarry';
import { DU_BRANCHES, DU_BUILD, DU_HW, duBlockers, duWater } from '../src/pixel/map/dunes-layout';
import { SP_BRANCHES, SP_BRIDGES, SP_BUILD, SP_HW, SP_LAVA, spBlockers, spWallPolys, spWater } from '../src/pixel/map/spire-layout';
import { HB_BRANCHES, HB_BUILD, HB_HW, hbBlockers, hbWallPolys, hbWater } from '../src/pixel/map/harbor-layout';
import { blockers as baBlockers, waterPolygons as baWater, wallPolygons as baWalls } from '../src/pixel/map/bastion';
import { blockers as maBlockers, waterPolygons as maWater } from '../src/pixel/map/marsh';
import { blockers as skBlockers, waterPolygons as skWater } from '../src/pixel/map/skyreach';
import { blockers as hoBlockers, waterPolygons as hoWater } from '../src/pixel/map/hollow';

function patch(name: string, fn: (j: Record<string, unknown>) => void): void {
  const file = resolve(process.cwd(), `../sim/data/maps/${name}.json`);
  const j = JSON.parse(readFileSync(file, 'utf8'));
  fn(j);
  writeFileSync(file, JSON.stringify(j) + '\n');
  console.log(name, 'geschrieben:', (j.blockers as unknown[]).length, 'Blocker');
}
patch('frostfen', (j) => { j.water = waterPolygons(); j.blockers = ffBlockers(); });
patch('quarry', (j) => { j.blockers = qBlockers(); });

// Runde 16 / K2: die drei neuen Karten komplett aus dem Layout (Wege, Wasser, Mauern, Blocker). Kein Rueckgriff auf eine vorhandene Datei.
function write(name: string, title: string, o: { branches: Pt[][]; hw: number; water: Pt[][]; lava?: Pt[][]; bridges?: [Pt, Pt][]; walls?: Pt[][]; blockers: [number, number, number][]; build: [number, number, number, number] }): void {
  const file = resolve(process.cwd(), `../sim/data/maps/${name}.json`);
  const j: Record<string, unknown> = {
    id: name, name: title, size: [640, 360], path: o.branches[0], paths: o.branches, pathHalfWidth: o.hw, water: o.water, ice: [], lava: o.lava ?? [],
    bridges: o.bridges ?? [], blockers: o.blockers, buildArea: o.build,
  };
  if (o.walls && o.walls.length) j.walls = o.walls;
  writeFileSync(file, JSON.stringify(j) + '\n');
  console.log(name, 'geschrieben:', o.blockers.length, 'Blocker,', o.water.length, 'Wasser,', (o.walls ?? []).length, 'Mauern');
}
write('dunes', 'Ashra Dunes', { branches: DU_BRANCHES, hw: DU_HW, water: duWater(), blockers: duBlockers(), build: DU_BUILD });
write('harbor', 'Gloomharbor', { branches: HB_BRANCHES, hw: HB_HW, water: hbWater(), walls: hbWallPolys(), blockers: hbBlockers(), build: HB_BUILD });
write('spire', 'Duskspire Keep', { branches: SP_BRANCHES, hw: SP_HW, water: spWater(), lava: SP_LAVA, bridges: SP_BRIDGES, walls: spWallPolys(), blockers: spBlockers(), build: SP_BUILD });
patch('hollow', (j) => { j.water = hoWater(); j.blockers = hoBlockers(); });
patch('marsh', (j) => { j.water = maWater(); j.blockers = maBlockers(); });
patch('bastion', (j) => { j.water = baWater(); j.walls = baWalls(); j.blockers = baBlockers(); });
patch('skyreach', (j) => { j.water = skWater(); j.blockers = skBlockers(); });
