/** Runde 16 TP: eigene 16 x 16 Faehigkeits-Icons der Helden Bram (Anvil Drop, Forge of Dawn) und Sela (Starfall, Eclipse). Eingehaengt in `iconAbilityRaster`. */
import type { PalName } from '../palette';
import { spark } from './parts';
import { RAMPS, Surface } from './surface';
import type { AbilityId } from './types';

type Draw = (s: Surface) => void;

/** Rahmenfarbe je Icon (wie `col` in icons.ts). */
export const HERO_ICON_COL: Partial<Record<AbilityId, PalName>> = { anvilDrop: 'orange', forgeOfDawn: 'amber', starfall: 'sky', eclipse: 'yellow' };

export const HERO_ICONS: Partial<Record<AbilityId, Draw>> = {
  // Amboss faellt: Fallstriche darueber, Staub am Boden
  anvilDrop: (s) => {
    for (const x of [5, 8, 11]) { s.line(x, 1, x, 3 + (x % 2), 'silver'); s.px(x, 1, 'white'); }
    s.box(3, 5, 10, 3, RAMPS.steel);
    s.poly([[3, 5], [0, 5], [3, 7]], 'stone'); s.px(1, 5, 'white');
    s.box(6, 8, 4, 2, RAMPS.iron);
    s.box(4, 10, 8, 3, RAMPS.iron);
    s.px(4, 5, 'white');
    for (const [x, y] of [[1, 13], [3, 14], [12, 14], [14, 13], [2, 11], [14, 11]]) s.px(x, y, 'sand');
    s.rect(0, 14, 16, 1, 'tan');
  },
  // Sonnenaufgang hinter einem gluehenden Hammer
  forgeOfDawn: (s) => {
    s.ellipseFn(8, 12, 7, 6, (_x, y) => (y <= 12 ? 'orange' : null));
    s.ellipseFn(8, 12, 5, 4.5, (_x, y) => (y <= 12 ? 'amber' : null));
    s.ellipseFn(8, 12, 3, 2.6, (_x, y) => (y <= 12 ? 'yellow' : null));
    for (const [x0, y0, x1, y1] of [[1, 8, 3, 9], [3, 3, 4, 5], [13, 8, 15, 9], [12, 3, 11, 5], [8, 1, 8, 3]] as number[][]) s.line(x0, y0, x1, y1, 'yellow');
    s.line(8, 6, 8, 14, 'bark'); s.line(9, 6, 9, 14, 'wood');
    s.box(4, 3, 9, 4, RAMPS.steel);
    s.rect(5, 4, 7, 1, 'white'); s.px(4, 3, 'white');
    s.px(4, 6, 'orange'); s.px(12, 6, 'orange');
    s.rect(0, 14, 16, 2, 'rust'); s.rect(0, 14, 16, 1, 'orange');
  },
  // Sternenstrahl: schraeger Lichtbalken mit Stern an der Spitze
  starfall: (s) => {
    s.line(2, 1, 11, 10, 'sky', 3);
    s.line(2, 1, 11, 10, 'ice', 1);
    s.line(1, 1, 10, 10, 'white', 1);
    for (const [x, y] of [[0, 3], [4, 0], [12, 2], [3, 6]]) s.px(x, y, 'sky');
    spark(s, 12, 11, 'yellow', true);
    s.px(12, 8, 'yellow'); s.px(14, 11, 'yellow'); s.px(12, 14, 'yellow');
    for (const [x, y] of [[14, 4], [6, 13], [1, 10]]) spark(s, x, y, 'white');
    s.rect(0, 15, 16, 1, 'navy');
  },
  // Sonnenfinsternis: dunkle Scheibe mit Korona
  eclipse: (s) => {
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s.line(8 + Math.cos(a) * 5.5, 7.5 + Math.sin(a) * 5.5, 8 + Math.cos(a) * (i % 2 ? 7.3 : 6.6), 7.5 + Math.sin(a) * (i % 2 ? 7.3 : 6.6), i % 2 ? 'amber' : 'yellow'); }
    s.ellipse(8, 7.5, 5.4, 5.4, 'yellow');
    s.ellipse(8, 7.5, 4.6, 4.6, 'amber');
    s.ellipse(8, 7.5, 4, 4, 'ink');
    s.px(5, 5, 'dusk'); s.px(6, 4, 'dusk');
    s.rect(6, 7, 1, 1, 'white'); s.rect(9, 7, 1, 1, 'white'); // leuchtende Augen
    s.px(2, 13, 'white'); s.px(13, 13, 'white');
  },
};
