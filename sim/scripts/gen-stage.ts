/** Erzeugt data/stages/standard20.json aus der Wave-Tabelle (recommendations §5). Einmal-Werkzeug, Ergebnis ist eingecheckt. */
import { writeFileSync } from 'node:fs';

const INTERVAL: Record<string, number> = { grunt: 16, runner: 10, flyer: 18, brute: 40, splitter: 30, elite: 60, boss: 0 };
type G = [string, number, string[]?, number?];
const W: G[][] = [
  [['grunt', 8]],
  [['grunt', 9]],
  [['grunt', 8], ['runner', 3]],
  [['grunt', 8], ['runner', 6]],
  [['elite', 1], ['grunt', 8]],
  [['grunt', 9], ['runner', 10]],
  [['brute', 3], ['grunt', 10]],
  [['flyer', 7], ['grunt', 14]],
  [['brute', 4], ['runner', 6], ['grunt', 7]],
  [['boss', 1], ['grunt', 8]],
  [['flyer', 12], ['grunt', 16]],
  [['brute', 4, ['regen']], ['runner', 12], ['grunt', 7]],
  [['grunt', 15, ['shield:3']], ['runner', 22]],
  [['brute', 4], ['flyer', 11], ['grunt', 10]],
  [['elite', 1], ['splitter', 6], ['grunt', 12]],
  [['brute', 5], ['runner', 15], ['flyer', 12]],
  [['brute', 6, ['armored']], ['grunt', 18]],
  [['splitter', 9], ['flyer', 13], ['runner', 16]],
  [['elite', 2], ['brute', 4], ['grunt', 8]],
  [['boss', 1], ['elite', 1], ['grunt', 7]],
];
const waves = W.map((groups, i) => {
  let delay = 0;
  return {
    n: i + 1,
    groups: groups.map(([type, count, mods]) => {
      const g = { type, count, intervalTicks: INTERVAL[type], delayTicks: delay, modifiers: mods ?? [], element: 1 + (i % 5) };
      if (type !== 'boss') delay += count * INTERVAL[type];
      return g;
    }),
  };
});
const slots: { id: number; x: number; y: number; kind: 'ground' | 'hill'; size: 1 | 2 }[] = [];
const add = (kind: 'ground' | 'hill', y: number, xs: number[], size: 1 | 2 = 1) => xs.forEach((x) => slots.push({ id: slots.length, x, y, kind, size }));
add('ground', 0, [2, 5, 8, 11]);
add('hill', 2, [2, 5, 8, 11]);
add('ground', 3, [3, 6, 9]);
add('ground', 5, [4, 7, 10]);
add('hill', 6, [5, 8, 11]);
add('ground', 8, [3, 6, 9]);
add('hill', 9, [4, 7, 10]);
add('ground', 2.5, [15], 2);
add('ground', 5.5, [15], 2);
add('ground', 8.5, [15], 2);
const stage = {
  ref: 'recommendations §0, §5 (Beispiel-Stage Standard 20)',
  _comment: 'S-förmiger Pfad, Länge 42 Tiles: 13+3+11+3+11+1. Waves laut §5; Spawn-Abstände Grunt 0,8 s, Runner 0,5 s, Flyer 0,9 s, Brute 2,0 s, Splitter 1,5 s, Elite 3,0 s; Gruppen nacheinander (Delay = Summe Anzahl*Abstand der Vorgänger), Boss erscheint einzeln bei Delay 0. Element je Wave 1+((n-1) mod 5), wirkt erst ab Hard. Slots: ground/hill neben dem Pfad, 3 große (2x2) Ground-Slots für Farms.',
  id: 'standard20',
  name: 'Standard 20',
  waveTimerTicks: 900,
  path: [[0, 1], [13, 1], [13, 4], [2, 4], [2, 7], [13, 7], [13, 8]],
  slots,
  waves,
};
writeFileSync(new URL('../data/stages/standard20.json', import.meta.url), JSON.stringify(stage, null, 1).replace(/\n\s+(\[|-?\d)/g, ' $1').replace(/\n\s+\]/g, ' ]'));
