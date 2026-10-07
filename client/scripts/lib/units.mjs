// Die 14 Units (32x32, Fuss unten mittig, Farm 64x64). Code-generiert aus einfachen Formen, eigenes Werk.
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


// ---- Runde 7 / P6: sechs neue Units. Gleiche Chibi-Proportion, je ein Leitmerkmal mit eigener Silhouette ----

/** Warden (Hedda Lorn): Torwaechterin, grosser runder Schild vor dem Koerper. */
export function warden() {
  const g = chibi({ coat: 'g1', coatD: 'night', pants: 'slate', boots: 'inkW', belt: 'gold' });
  g.oval(16, 7.5, 6, 4.5, 'st2').rect(10, 8, 12, 4, 'st2').rect(10, 8, 12, 1, 'st3').rect(15, 3, 2, 3, 'g3'); // Helm mit Federbusch
  g.rect(12, 11, 8, 3, 'sk3').px(13, 12, 'ink').px(14, 12, 'ink').px(18, 12, 'ink').px(19, 12, 'ink');
  // grosser runder Schild links, ragt ueber die Figur hinaus
  g.oval(9, 21, 8, 9, 'st1').oval(9, 21, 6.5, 7.5, 'st2').oval(9, 21, 2.5, 2.5, 'gold').px(9, 21, 'or2');
  g.line(9, 14, 9, 28, 'st3').line(3, 21, 15, 21, 'st3');
  g.rect(21, 18, 2, 6, 'night').rect(20, 24, 4, 2, 'sk3'); // Arm
  g.line(26, 10, 26, 28, 'er2').px(26, 9, 'gold'); // Hellebarden-Schaft
  return g.outline('ink');
}

/** Mortar (Brunna Stoll): stämmige Artilleristin, dickes Rohr schraeg ueber der Schulter. */
export function mortar() {
  const g = chibi({ coat: 'er2', coatD: 'er1', pants: 'st1', boots: 'inkW', belt: 'sand', blush: false });
  g.oval(16, 7.5, 6.5, 4.5, 'st2').rect(10, 8, 12, 3, 'st2').rect(10, 8, 12, 1, 'st3'); // Stahlhelm
  g.rect(9, 18, 14, 7, 'sand').rect(9, 18, 14, 1, 'er2'); // Schuerze
  // dickes Mörserrohr, nach oben rechts gerichtet
  for (let i = 0; i < 4; i++) g.line(17 + i, 22 - i, 27 + i, 6 - i, i < 2 ? 'st1' : 'st2');
  g.line(17, 22, 27, 6, 'ink');
  g.oval(29, 3.5, 3.2, 2.2, 'ink').oval(29, 3.5, 2, 1.2, 'ember').px(29, 2, 'gold'); // Muendung mit Glut
  g.rect(14, 22, 8, 3, 'st1').rect(13, 24, 10, 1, 'slate'); // Rohrfuss auf der Hueft
  g.rect(24, 24, 3, 3, 'st1').oval(25.5, 24.5, 1.5, 1.5, 'ink'); // Granate
  return g.outline('inkW');
}

/** Broker (Quill Tavish): Kopfgeld-Maklerin mit hohem Zylinder und grosser Muenze. */
export function broker() {
  const g = chibi({ coat: 'night', coatD: 'ink', pants: 'slate', boots: 'ink', belt: 'gold', blush: false });
  g.rect(9, 17, 14, 2, 'gold').rect(15, 17, 2, 8, 'gold'); // Weste mit Goldkante
  // hoher Zylinder
  g.rect(8, 6, 16, 2, 'ink').rect(11, -1, 10, 8, 'ink').rect(11, 3, 10, 2, 'red').rect(12, -1, 1, 8, 'slate');
  // Kopf unter dem Hut, Monokel
  g.oval(16, 11, 5, 4.5, 'sk3').rect(13, 11, 2, 3, 'ink').rect(18, 11, 2, 3, 'ink').px(13, 11, 'fog').px(18, 11, 'fog');
  g.oval(19, 12.5, 2.4, 2.4, 'gold').oval(19, 12.5, 1.2, 1.2, 'fog');
  // grosse Muenze in der Hand
  g.oval(26, 20, 5, 5, 'gold').oval(26, 20, 3.5, 3.5, 'or2').rect(25, 18, 2, 5, 'gold').px(24, 17, 'fog');
  g.rect(22, 22, 3, 2, 'sk3');
  return g.outline('ink');
}

/** Stormcaller (Rann Veyl): Blitzrufer mit spitzer Kapuze, Stab und Zickzack-Blitz ueber dem Kopf. */
export function stormcaller() {
  const g = new Img(32, 32);
  g.rect(8, 15, 16, 14, 'bl1').rect(8, 15, 2, 14, 'night').rect(22, 15, 2, 14, 'night').rect(8, 27, 16, 2, 'ice'); // Robe
  g.rect(12, 26, 3, 3, 'ink').rect(17, 26, 3, 3, 'ink');
  g.rect(11, 15, 10, 9, 'bl2').rect(19, 15, 2, 9, 'bl1').rect(11, 20, 10, 1, 'gold');
  g.rect(9, 16, 2, 7, 'bl1').rect(21, 16, 2, 7, 'bl1').rect(9, 23, 2, 2, 'sk3');
  // spitze Kapuze
  g.oval(16, 10, 6.5, 6, 'bl1');
  for (let i = 0; i < 7; i++) g.rect(15 - Math.floor(i / 3), 6 - i, 2 + Math.floor(i / 3) * 2, 1, 'bl1');
  g.oval(16, 11.5, 4, 3.5, 'sk3').rect(13, 11, 2, 2, 'ink').rect(18, 11, 2, 2, 'ink').px(13, 11, 'fog').px(18, 11, 'fog');
  g.rect(12, 8, 8, 1, 'ice');
  // Stab rechts mit Kristall
  g.line(26, 28, 26, 9, 'er2').line(27, 28, 27, 9, 'er1').oval(26.5, 7.5, 2.5, 3, 'ice').px(26, 6, 'fog');
  // Blitz ueber der Figur (Zickzack, ragt hoch)
  g.line(14, -1, 17, 2, 'gold').line(17, 2, 15, 4, 'gold').line(15, 4, 18, 7, 'fog');
  g.line(26, 3, 23, 0, 'ice');
  return g.outline('ink');
}

/** Seer (Ilsa Nenn): Nebelseherin, schwebendes Auge ueber dem Kopf, Nebelsaum statt Fuessen. */
export function seer() {
  const g = new Img(32, 32);
  // Nebelsaum
  g.oval(16, 28, 9, 3, 'sh3').oval(16, 28, 7, 2, 'fog').px(7, 29, 'sh3').px(25, 29, 'sh3').px(10, 30, 'fog').px(22, 30, 'fog');
  g.rect(9, 15, 14, 13, 'sh2').rect(9, 15, 2, 13, 'sh1').rect(21, 15, 2, 13, 'sh1').rect(9, 25, 14, 2, 'sh1');
  g.rect(11, 15, 10, 2, 'sh3').rect(15, 17, 2, 8, 'gold'); // Schaerpe
  g.rect(7, 17, 3, 7, 'sh2').rect(22, 17, 3, 7, 'sh2').rect(7, 24, 3, 2, 'sk3').rect(22, 24, 3, 2, 'sk3');
  // Kopf mit langem hellem Haar
  g.oval(16, 11.5, 5.5, 5.5, 'sk3').oval(16, 8.5, 6.5, 4.5, 'fog').rect(9, 9, 3, 9, 'fog').rect(20, 9, 3, 9, 'fog');
  g.rect(13, 12, 2, 2, 'ink').rect(18, 12, 2, 2, 'ink').px(13, 12, 'fog').px(18, 12, 'fog').px(12, 14, 'pink').px(20, 14, 'pink');
  // schwebendes Auge ueber dem Kopf (breite Silhouette)
  g.oval(16, 2.5, 7, 3.2, 'fog').oval(16, 2.5, 3, 3, 'sh3').oval(16, 2.5, 1.5, 1.8, 'ink').px(15, 1, 'fog');
  g.px(8, 2, 'sh3').px(24, 2, 'sh3');
  return g.outline('ink');
}

/** Weaver (Nessa Thorne): Nebelweberin, grosses Webrad aus leuchtenden Faeden hinter der Figur. */
export function weaver() {
  const g = new Img(32, 32);
  // Webrad: Ring mit Speichen und Faeden
  const cx = 16;
  const cy = 14;
  g.oval(cx, cy, 14.5, 13.5, 'sh3').oval(cx, cy, 12.5, 11.5, null);
  g.line(cx, cy - 13, cx, cy + 13, 'sh3').line(cx - 14, cy, cx + 14, cy, 'sh3').line(cx - 10, cy - 9, cx + 10, cy + 9, 'teal').line(cx + 10, cy - 9, cx - 10, cy + 9, 'teal');
  g.oval(cx, cy, 6, 5.5, null).oval(cx, cy, 6.5, 6, 'teal').oval(cx, cy, 5, 4.5, null);
  g.px(cx - 14, cy, 'fog').px(cx + 14, cy, 'fog').px(cx, cy - 13, 'fog').px(cx, cy + 13, 'fog');
  // Figur davor
  g.rect(12, 26, 3, 4, 'night').rect(17, 26, 3, 4, 'night').rect(11, 29, 4, 2, 'ink').rect(17, 29, 4, 2, 'ink');
  g.rect(10, 16, 12, 11, 'sh1').rect(20, 16, 2, 11, 'night').rect(10, 25, 12, 2, 'night').rect(10, 16, 12, 2, 'teal');
  g.rect(8, 17, 2, 7, 'sh1').rect(22, 17, 2, 7, 'sh1').rect(8, 24, 2, 2, 'sk3').rect(22, 24, 2, 2, 'sk3');
  g.oval(16, 11.5, 5, 5, 'sk3').oval(16, 8.5, 6, 4, 'teal').rect(10, 9, 2, 8, 'teal').rect(20, 9, 2, 8, 'teal').rect(13, 9, 7, 1, 'fog');
  g.rect(13, 12, 2, 3, 'ink').rect(18, 12, 2, 3, 'ink').px(13, 12, 'fog').px(18, 12, 'fog');
  // Faden zwischen den Haenden
  g.line(9, 25, 23, 25, 'fog');
  return g.outline('ink');
}

export const UNITS = { striker, gunner, blaster, banner, farm, lancer, frost, titan, warden, mortar, broker, stormcaller, seer, weaver };
