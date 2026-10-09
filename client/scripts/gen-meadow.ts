// Schreibt Wasser und Blocker aus dem Layout in sim/data/maps/meadow.json: npx tsx scripts/gen-meadow.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { blockers, waterPolygons } from '../src/pixel/map/layout';

const file = new URL('../../sim/data/maps/meadow.json', import.meta.url);
const j = JSON.parse(readFileSync(file, 'utf8'));
j.water = waterPolygons();
j.blockers = blockers();
const fmt = (v: unknown): string => JSON.stringify(v);
const text = `{ "id": ${fmt(j.id)}, "name": ${fmt(j.name)}, "size": ${fmt(j.size)},
  "path": ${fmt(j.path)},
  "pathHalfWidth": ${j.pathHalfWidth},
  "water": [
${j.water.map((p: unknown) => '    ' + fmt(p)).join(',\n')}
  ],
  "blockers": [
${j.blockers.map((b: unknown) => '    ' + fmt(b)).join(',\n')}
  ],
  "buildArea": ${fmt(j.buildArea)} }
`;
writeFileSync(file, text);
console.log('meadow.json geschrieben:', j.water[0].length, 'Wasserpunkte,', j.blockers.length, 'Blocker');
