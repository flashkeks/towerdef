// Die 8 Units (32x32, Fuss unten mittig, Farm 64x64). Code-generiert aus einfachen Formen, eigenes Werk.
// Gemeinsames Muster: Chibi-Proportion (Kopf gross), 1-px-Aussenlinie (kuehl `ink`, warm `inkW`), je ein Leitmerkmal (art-styleguide §5).
import { Img } from './pix.mjs';

/** Gemeinsamer Koerper; `o` = Farben. Gibt das Bild OHNE Outline zurueck. */
function chibi(o) {
  const g = new Img(32, 32);
  // Beine und Stiefel
  g.rect(12, 24, 3, 5, o.pants ?? 'slate').rect(17, 24, 3, 5, o.pants ?? 'slate');
  g.rect(11, 27, 4, 2, o.boots ?? 'inkW').rect(17, 27, 4, 2, o.boots ?? 'inkW');
  // Rumpf
  g.rect(11, 15, 10, 10, o.coat).rect(19, 15, 2, 10, o.coatD).rect(11, 23, 10, 2, o.coatD);
  if (o.belt) g.rect(11, 21, 10, 1, o.belt);
  // Arme
  g.rect(9, 16, 2, 7, o.coatD).rect(21, 16, 2, 7, o.coatD);
  g.rect(9, 23, 2, 2, o.skin ?? 'sk3').rect(21, 23, 2, 2, o.skin ?? 'sk3');
  // Kopf
  g.oval(16, 10.5, 5.5, 5.5, o.skin ?? 'sk3');
  g.rect(11, 12, 1, 2, 'sk2'); // Wange links als Schatten
  // Augen mit Glanzpunkt (Anime-Look)
  g.rect(13, 11, 2, 3, 'ink').rect(18, 11, 2, 3, 'ink');
  g.px(13, 11, 'fog').px(18, 11, 'fog');
  if (o.blush !== false) g.px(12, 14, 'pink').px(20, 14, 'pink');
  return g;
}

function hairCap(g, c, cD) {
  g.oval(16, 7.5, 6, 4.5, c);
  g.rect(10, 8, 2, 6, c).rect(20, 8, 2, 6, c);
  g.rect(13, 8, 7, 1, cD);
}

export function striker() {
  const g = chibi({ coat: 'or2', coatD: 'or1', pants: 'er1', boots: 'inkW', belt: 'er1' });
  hairCap(g, 'er1', 'inkW');
  g.px(11, 4, 'er1').px(14, 3, 'er1').px(18, 3, 'er1').px(21, 4, 'er1'); // Zotteln
  g.rect(11, 15, 10, 2, 'gold'); // Schal um den Hals
  g.rect(9, 16, 3, 2, 'gold');
  g.rect(8, 18, 3, 6, 'gold').rect(6, 22, 3, 5, 'or1').px(5, 25, 'or1'); // Schalende flattert links
  g.line(24, 19, 28, 14, 'st3').line(25, 19, 29, 15, 'fog'); // Messer rechts
  g.line(8, 24, 4, 20, 'st3'); // Messer links
  return g.outline('inkW');
}

export function gunner() {
  const g = chibi({ coat: 'g1', coatD: 'ink', pants: 'er1', belt: 'er2' });
  g.oval(16, 6, 6.5, 4, 'bl2'); // Wollmuetze
  g.rect(10, 7, 12, 3, 'bl1').rect(10, 8, 12, 1, 'bl2');
  g.oval(16, 2, 2, 2, 'fog'); // Bommel
  g.rect(8, 11, 3, 4, 'er2').rect(21, 11, 3, 4, 'er2'); // Ohrenklappen
  // lange Buechse schraeg ueber die Zelle
  g.line(5, 27, 28, 12, 'st1').line(5, 26, 28, 11, 'st2').line(4, 27, 9, 24, 'er2').line(4, 26, 9, 23, 'er2');
  g.rect(26, 11, 3, 2, 'st1').px(29, 11, 'gold');
  g.rect(8, 21, 3, 2, 'sk3').rect(20, 17, 3, 2, 'sk3');
  return g.outline('ink');
}

export function blaster() {
  const g = chibi({ coat: 'st1', coatD: 'slate', pants: 'er1', belt: 'ember' });
  hairCap(g, 'pink', 'or1');
  // Schutzbrille auf der Stirn
  g.rect(11, 6, 10, 3, 'inkW').rect(12, 6, 3, 2, 'ember').rect(17, 6, 3, 2, 'ember').px(13, 6, 'gold').px(18, 6, 'gold');
  // Rucksack mit Funkenkugeln (links und rechts hinter den Schultern)
  g.rect(6, 13, 4, 9, 'er2').rect(22, 13, 4, 9, 'er2');
  g.oval(7.5, 12, 2, 2, 'ember').oval(24.5, 12, 2, 2, 'gold').px(7, 11, 'fog').px(24, 11, 'fog');
  g.px(8, 9, 'gold').px(25, 9, 'ember').px(6, 10, 'ember');
  // Kugel in der Hand
  g.oval(26, 22, 3, 3, 'ink').oval(26, 22, 2, 2, 'ember').px(26, 20, 'gold').px(27, 19, 'gold');
  g.rect(9, 11, 1, 1, 'ink').px(14, 14, 'ink').px(17, 15, 'inkW'); // Russfleck
  return g.outline('inkW');
}

export function banner() {
  const g = chibi({ coat: 'gold', coatD: 'or2', pants: 'bl1', boots: 'inkW', belt: 'or1' });
  hairCap(g, 'sand', 'er2');
  g.rect(14, 5, 5, 2, 'sand');
  // hohe Fahne ueber die Figur hinaus
  g.rect(25, 1, 2, 28, 'er1').rect(25, 1, 1, 28, 'er2');
  g.rect(27, 2, 5, 12, 'or2').rect(27, 2, 5, 1, 'gold').rect(27, 13, 5, 1, 'or1');
  g.px(27, 14, 'or2').px(28, 14, 'or2').px(30, 14, 'or1'); // Zipfel
  g.rect(28, 5, 3, 3, 'fog').rect(29, 6, 1, 1, 'or1').rect(28, 4, 3, 1, 'gold'); // Wappen
  g.rect(23, 21, 3, 2, 'sk3');
  g.oval(25, 1, 1.5, 1.5, 'gold');
  return g.outline('inkW');
}

/** Farm 64x64: Teehaus. */
export function farm() {
  const g = new Img(64, 64);
  g.rect(8, 28, 48, 28, 'parch'); // Waende
  g.rect(8, 28, 48, 2, 'sand');
  for (const x of [8, 30, 54]) g.rect(x, 28, 2, 28, 'er1'); // Balken
  g.rect(8, 52, 48, 4, 'er2'); // Sockel
  g.rect(8, 55, 48, 1, 'er1');
  // Dach (Treppendach, orange)
  for (let i = 0; i < 11; i++) {
    const inset = 2 + i * 2;
    g.rect(2 + Math.min(i * 1, 10) + 0, 6 + i * 2, 60 - 2 * (2 + Math.min(i, 10)), 2, i % 2 ? 'or1' : 'or2');
  }
  g.rect(2, 28, 60, 3, 'or1').rect(2, 27, 60, 1, 'gold');
  g.rect(28, 3, 8, 4, 'or1').rect(30, 1, 4, 2, 'gold'); // Firstzier
  // Tuer und Fenster
  g.rect(26, 38, 12, 18, 'er1').rect(27, 39, 10, 17, 'er2').rect(33, 47, 2, 2, 'gold');
  g.rect(12, 36, 11, 9, 'ink').rect(13, 37, 9, 7, 'gold').rect(17, 37, 1, 7, 'er1').rect(13, 40, 9, 1, 'er1');
  g.rect(41, 36, 11, 9, 'ink').rect(42, 37, 9, 7, 'gold').rect(46, 37, 1, 7, 'er1').rect(42, 40, 9, 1, 'er1');
  // Pomm im Fenster (Kopf, Schuerze)
  g.oval(17.5, 42, 3, 3, 'sk3').rect(14, 40, 7, 2, 'er2').px(16, 42, 'ink').px(19, 42, 'ink');
  // Theke mit Teekanne und Dampf
  g.rect(40, 46, 14, 3, 'er2').rect(40, 46, 14, 1, 'sand');
  g.rect(44, 43, 5, 3, 'bl2').rect(49, 44, 2, 1, 'bl2').rect(43, 44, 1, 1, 'bl2').px(46, 42, 'gold');
  g.px(46, 40, 'fog').px(47, 39, 'fog').px(46, 38, 'fog');
  // Laterne links an der Stange
  g.rect(3, 34, 2, 22, 'er1').rect(1, 34, 6, 5, 'gold').rect(2, 35, 4, 3, 'fog').rect(1, 33, 6, 1, 'or1');
  // Muenzbeutel rechts unten
  g.oval(58, 52, 3.5, 3.5, 'er2').rect(56, 48, 4, 2, 'er1').px(58, 52, 'gold').px(57, 53, 'gold');
  return g.outline('inkW');
}

export function lancer() {
  const g = chibi({ coat: 'bl1', coatD: 'night', pants: 'night', boots: 'ink', belt: 'gold', blush: false });
  g.rect(10, 15, 12, 12, 'bl1').rect(20, 15, 2, 12, 'night').rect(10, 26, 12, 2, 'night'); // langer Mantel
  g.rect(8, 15, 4, 2, 'st2').rect(20, 15, 4, 2, 'st2'); // Schulterstuecke
  // Helm mit Visier
  g.oval(16, 8.5, 6.5, 6.5, 'st2').rect(10, 8, 12, 7, 'st2');
  g.rect(10, 8, 12, 1, 'st3').rect(12, 6, 3, 1, 'st3');
  g.rect(12, 11, 8, 3, 'ink').rect(13, 12, 6, 1, 'gold');
  g.rect(15, 2, 2, 4, 'st3'); // Kamm
  // senkrechte Lanze
  g.rect(26, 5, 2, 24, 'er1').rect(26, 5, 1, 24, 'er2');
  g.rect(26, 1, 2, 5, 'st3').px(26, 0, 'fog').px(27, 1, 'fog').rect(25, 6, 4, 1, 'gold');
  g.rect(23, 22, 3, 2, 'st2');
  return g.outline('ink');
}

export function frost() {
  const g = new Img(32, 32);
  g.rect(8, 15, 16, 14, 'bl2').rect(8, 15, 2, 14, 'bl1').rect(22, 15, 2, 14, 'bl1'); // Cape hinten
  g.rect(8, 27, 16, 2, 'ice');
  g.rect(12, 24, 3, 5, 'night').rect(17, 24, 3, 5, 'night').rect(11, 27, 4, 2, 'ink').rect(17, 27, 4, 2, 'ink');
  g.rect(11, 15, 10, 10, 'bl1').rect(19, 15, 2, 10, 'night').rect(11, 20, 10, 1, 'ice');
  g.rect(9, 16, 2, 7, 'bl2').rect(21, 16, 2, 7, 'bl2').rect(9, 23, 2, 2, 'sk3').rect(21, 23, 2, 2, 'sk3');
  g.rect(10, 15, 12, 2, 'ice'); // Cape-Kragen
  g.oval(16, 10.5, 5.5, 5.5, 'sk3');
  // Eisblaue Haare, lang
  g.oval(16, 7.5, 6.5, 4.5, 'ice').rect(9, 8, 3, 12, 'ice').rect(20, 8, 3, 12, 'ice').rect(10, 8, 1, 12, 'bl2');
  g.rect(13, 8, 7, 1, 'fog').px(16, 7, 'fog');
  g.rect(13, 11, 2, 3, 'ink').rect(18, 11, 2, 3, 'ink').px(13, 11, 'fog').px(18, 11, 'fog').px(12, 14, 'pink').px(20, 14, 'pink');
  // Kompass-Stab links
  g.rect(5, 8, 2, 21, 'er2').rect(5, 8, 1, 21, 'er1');
  g.oval(6, 6, 4, 4, 'st3').oval(6, 6, 3, 3, 'fog').px(6, 4, 'red').px(6, 7, 'bl2').px(5, 5, 'ink').px(7, 7, 'ink');
  g.px(1, 5, 'ice').px(11, 5, 'ice').px(2, 2, 'fog');
  return g.outline('ink');
}

export function titan() {
  const g = new Img(32, 32);
  g.rect(8, 22, 6, 8, 'st1').rect(18, 22, 6, 8, 'st1').rect(7, 27, 8, 3, 'st2').rect(17, 27, 8, 3, 'st2');
  g.rect(5, 10, 22, 15, 'st2').rect(5, 10, 22, 2, 'st3').rect(23, 10, 4, 15, 'st1').rect(5, 23, 22, 2, 'st1');
  g.rect(1, 12, 6, 14, 'st2').rect(25, 12, 6, 14, 'st2').rect(1, 12, 6, 2, 'st3').rect(25, 12, 6, 2, 'st3'); // Arme
  g.rect(0, 24, 7, 5, 'st1').rect(25, 24, 7, 5, 'st1');
  g.oval(16, 8, 5, 4.5, 'st1').rect(12, 7, 8, 2, 'st2').rect(13, 8, 2, 1, 'ink').rect(18, 8, 2, 1, 'ink'); // Kopf, tiefer Blick
  g.px(13, 8, 'teal').px(19, 8, 'teal');
  // Moos auf den Schultern
  g.rect(3, 10, 8, 3, 'g2').rect(4, 9, 5, 1, 'g3').rect(22, 10, 7, 3, 'g1').rect(23, 9, 4, 1, 'g2').px(6, 13, 'g1').px(25, 13, 'g2');
  // Risse mit tuerkisem Gluehen
  g.line(16, 13, 14, 17, 'teal').line(14, 17, 17, 20, 'teal').line(17, 20, 15, 23, 'teal').line(14, 17, 11, 18, 'teal').line(17, 20, 21, 19, 'teal');
  return g.outline('ink');
}

export const UNITS = { striker, gunner, blaster, banner, farm, lancer, frost, titan };
