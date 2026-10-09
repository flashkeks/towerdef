// Schreibt Wasser und Blocker aus dem Layout in sim/data/maps/meadow.json: npx tsx scripts/gen-meadow.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { blockers, waterPolygons } from '../src/pixel/map/layout';

const file = new URL('../../sim/data/maps/meadow.json', import.meta.url);
const j = JSON.parse(readFileSync(file, 'utf8'));
j.water = waterPolygons();
j.blockers = blockers();
writeFileSync(file, JSON.stringify(j) + '\n');
console.log('meadow.json geschrieben:', j.water[0].length, 'Wasserpunkte,', j.blockers.length, 'Blocker');
