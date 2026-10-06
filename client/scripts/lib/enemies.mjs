// Gegner-Archetypen (Schattenwesen, Violett-Rampe). Code-generiert, eigenes Werk; zwei Gehframes je Archetyp (f = 0 | 1).
// Silhouetten nach art-styleguide §6: grunt rund, runner schmal/vorgeneigt, brute eckig breit, flyer Fluegel, splitter zweigeteilt mit Riss,
// elite = Brute + Hoerner/Krone, boss = 64 px Koloss mit tuerkisem Kern.
import { Img } from './pix.mjs';

const eyes = (g, x, y, c = 'fog') => {
  g.rect(x, y, 3, 3, c).px(x + 1, y + 1, 'ink').px(x + 1, y + 2, 'ink');
};

export function grunt(f) {
  const g = new Img(24, 24);
  const b = f ? 1 : 0;
  g.oval(12, 13 + b, 9.5, 8 - b * 0.5, 'sh2');
  g.oval(12, 15 + b, 8, 5, 'sh1').oval(12, 12 + b, 8.5, 6, 'sh2');
  g.rect(5, 5 + b, 5, 1, 'sh3').rect(10, 4 + b, 6, 1, 'sh3').rect(16, 5 + b, 3, 1, 'sh3'); // Rimlight
  eyes(g, 6, 10 + b);
  eyes(g, 14, 10 + b);
  // zwei kurze Beine, wechselnd
  g.rect(6, 20, 4, 3, 'sh1').rect(14, 20, 4, 3, 'sh1');
  if (f) g.rect(6, 22, 4, 1, null); else g.rect(14, 22, 4, 1, null);
  return g.outline('ink');
}

export function runner(f) {
  const g = new Img(30, 24);
  // Schweif
  g.line(4, 9, 11, 13, 'sh2').line(3, 7, 10, 12, 'sh3').line(2, 5, 4, 7, 'sh3');
  // Rumpf, diagonal nach vorn
  for (let i = 0; i < 12; i++) g.rect(8 + i, 15 - i * 0.5, 3, 5, i % 4 === 0 ? 'sh3' : 'sh2');
  g.oval(21, 10, 5, 4.5, 'sh3').oval(22, 11, 4, 3, 'sh2');
  g.rect(22, 7, 6, 1, 'sh3');
  g.px(24, 9, 'gold').px(25, 9, 'gold').px(24, 10, 'gold').px(25, 10, 'gold').px(25, 9, 'ink'); // gelbe Augen
  g.rect(26, 12, 3, 1, 'sh1');
  // lange Beine: Schritt-Pose wechselt
  if (f) {
    g.line(11, 19, 7, 23, 'sh1').line(12, 19, 8, 23, 'sh1').line(19, 18, 24, 22, 'sh1').line(20, 18, 25, 22, 'sh1');
  } else {
    g.line(11, 19, 14, 23, 'sh1').line(12, 19, 15, 23, 'sh1').line(19, 18, 17, 23, 'sh1').line(20, 18, 18, 23, 'sh1');
  }
  return g.outline('ink');
}

export function brute(f) {
  const g = new Img(30, 28);
  const b = f ? 1 : 0;
  g.rect(4, 8 + b, 22, 15, 'sh1').rect(4, 8 + b, 22, 1, 'sh3');
  g.rect(1, 8 + b, 7, 7, 'st1').rect(22, 8 + b, 7, 7, 'st1').rect(1, 8 + b, 7, 1, 'st3').rect(22, 8 + b, 7, 1, 'st3'); // Schulterplatten
  g.rect(9, 14 + b, 12, 7, 'st1').rect(9, 14 + b, 12, 1, 'st2').rect(14, 15 + b, 2, 5, 'st2'); // Brustplatte
  g.rect(10, 3 + b, 10, 7, 'sh2').rect(10, 3 + b, 10, 1, 'sh3'); // Kopf, tief eingesunken
  g.rect(11, 6 + b, 3, 2, 'fog').rect(16, 6 + b, 3, 2, 'fog').px(12, 7 + b, 'ink').px(17, 7 + b, 'ink');
  g.rect(5, 23, 8, 4, 'sh1').rect(17, 23, 8, 4, 'sh1');
  if (f) g.rect(5, 26, 8, 1, null); else g.rect(17, 26, 8, 1, null);
  return g.outline('ink');
}

export function flyer(f) {
  const g = new Img(34, 24);
  const up = f ? -3 : 3; // Fluegelschlag
  for (const s of [-1, 1]) {
    const cx = 17 + s * 8;
    g.oval(cx, 11 + up * 0.5, 8, 3.5, 'sh2');
    g.oval(cx + s * 2, 11 + up, 6, 2.5, 'sh3');
    g.oval(cx + s * 6, 11 + up * 1.4, 2.5, 2, 'ice'); // Eisblau-Fluegelspitzen
  }
  g.oval(17, 12, 4.5, 5.5, 'sh2').oval(17, 14, 3, 3, 'sh1');
  g.rect(12, 8, 10, 1, 'sh3');
  g.rect(14, 10, 2, 2, 'fog').rect(18, 10, 2, 2, 'fog').px(15, 11, 'ink').px(19, 11, 'ink');
  g.px(16, 18, 'sh1').px(17, 19, 'sh1').px(18, 18, 'sh1');
  return g.outline('ink');
}

export function splitter(f) {
  const g = new Img(28, 24);
  const o = f ? 1 : 0;
  g.oval(8.5, 13 - o, 7.5, 7.5, 'sh2').oval(19.5, 13 + o, 7.5, 7.5, 'sh2');
  g.oval(8.5, 15 - o, 6, 4, 'sh1').oval(19.5, 15 + o, 6, 4, 'sh1');
  g.rect(5, 6 - o, 5, 1, 'sh3').rect(17, 6 + o, 5, 1, 'sh3');
  g.rect(14, 4, 1, 17, 'ink').rect(13, 4, 1, 17, 'ember').rect(14, 6, 1, 2, 'gold').rect(13, 13, 1, 2, 'gold'); // Glutriss
  g.rect(4, 11 - o, 3, 3, 'fog').px(5, 12 - o, 'ink').px(5, 13 - o, 'ink');
  g.rect(21, 11 + o, 3, 3, 'fog').px(22, 12 + o, 'ink').px(22, 13 + o, 'ink');
  g.rect(4, 20, 4, 2, 'sh1').rect(20, 20, 4, 2, 'sh1');
  return g.outline('ink');
}

export function splitterChild(f) {
  const g = new Img(16, 14);
  const b = f ? 1 : 0;
  g.oval(8, 7 + b, 6, 5, 'sh2').oval(8, 9 + b, 5, 3, 'sh1');
  g.rect(4, 3 + b, 4, 1, 'sh3');
  g.rect(4, 6 + b, 2, 2, 'fog').rect(9, 6 + b, 2, 2, 'fog').px(5, 7 + b, 'ink').px(10, 7 + b, 'ink');
  g.rect(4, 11, 3, 1, 'sh1').rect(9, 11, 3, 1, 'sh1');
  return g.outline('ink');
}

export function elite(f) {
  const g = new Img(48, 48);
  const b = f ? 1 : 0;
  g.oval(24, 44, 22, 3.5, 'gold').oval(24, 44, 20, 2.2, null); // goldener Ring am Boden
  g.rect(8, 16 + b, 32, 24, 'sh1').rect(8, 16 + b, 32, 2, 'sh3');
  g.rect(2, 15 + b, 11, 12, 'st1').rect(35, 15 + b, 11, 12, 'st1').rect(2, 15 + b, 11, 2, 'gold').rect(35, 15 + b, 11, 2, 'gold');
  g.rect(15, 24 + b, 18, 11, 'st1').rect(15, 24 + b, 18, 2, 'st2').rect(22, 26 + b, 4, 8, 'gold');
  g.rect(15, 7 + b, 18, 11, 'sh2').rect(15, 7 + b, 18, 1, 'sh3');
  g.rect(17, 11 + b, 4, 3, 'gold').rect(27, 11 + b, 4, 3, 'gold').px(19, 12 + b, 'ink').px(29, 12 + b, 'ink'); // goldene Augen
  // Hoerner und Krone
  g.rect(12, 5 + b, 3, 8, 'st3').rect(10, 3 + b, 3, 4, 'st3').rect(33, 5 + b, 3, 8, 'st3').rect(35, 3 + b, 3, 4, 'st3');
  g.rect(18, 4 + b, 12, 3, 'gold').rect(18, 1 + b, 2, 3, 'gold').rect(23, 0 + b, 2, 4, 'gold').rect(28, 1 + b, 2, 3, 'gold');
  g.rect(9, 38, 11, 6, 'sh1').rect(28, 38, 11, 6, 'sh1').rect(8, 42, 13, 3, 'st1').rect(27, 42, 13, 3, 'st1');
  return g.outline('ink');
}

export function boss(f) {
  const g = new Img(64, 64);
  const b = f ? 1 : 0;
  g.oval(32, 58, 26, 5, 'sh1'); // Bodenschatten (doppelt gross)
  // Beine
  g.rect(12, 44, 14, 16, 'sh1').rect(38, 44, 14, 16, 'sh1').rect(10, 56, 18, 5, 'st1').rect(36, 56, 18, 5, 'st1');
  // Rumpf, breit
  g.rect(8, 18 + b, 48, 30, 'sh1').rect(8, 18 + b, 48, 3, 'sh3').rect(50, 18 + b, 6, 30, 'sh1');
  g.rect(14, 22 + b, 36, 22, 'sh2');
  // Schulterplatten mit Stacheln
  g.rect(0, 16 + b, 16, 14, 'st1').rect(48, 16 + b, 16, 14, 'st1').rect(0, 16 + b, 16, 2, 'st3').rect(48, 16 + b, 16, 2, 'st3');
  for (const x of [2, 7, 12]) g.rect(x, 11 + b, 3, 6, 'st3');
  for (const x of [49, 54, 59]) g.rect(x, 11 + b, 3, 6, 'st3');
  // Arme/Faeuste
  g.rect(0, 30, 11, 18, 'sh2').rect(53, 30, 11, 18, 'sh2').rect(0, 46, 13, 8, 'st1').rect(51, 46, 13, 8, 'st1');
  // Kopf mit grossen Hoernern
  g.rect(22, 4 + b, 20, 15, 'sh2').rect(22, 4 + b, 20, 2, 'sh3');
  g.rect(14, 2 + b, 5, 10, 'st3').rect(10, 0 + b, 5, 5, 'st3').rect(45, 2 + b, 5, 10, 'st3').rect(49, 0 + b, 5, 5, 'st3');
  g.rect(25, 10 + b, 5, 4, 'red').rect(34, 10 + b, 5, 4, 'red').px(27, 11 + b, 'ink').px(36, 11 + b, 'ink').rect(27, 16 + b, 10, 1, 'ink');
  // Schwachstellen-Kern (tuerkis, pulsiert ueber f)
  g.oval(32, 33 + b, 7, 7, 'ink').oval(32, 33 + b, 6, 6, 'teal').oval(32, 33 + b, 3, 3, 'fog');
  if (f) g.oval(32, 33 + b, 6, 6, 'ice').oval(32, 33 + b, 3, 3, 'fog');
  g.line(32, 40 + b, 28, 46, 'teal').line(26, 33, 20, 38, 'teal').line(38, 33, 44, 38, 'teal');
  g.rect(14, 22 + b, 36, 1, 'sh3');
  return g.outline('ink');
}

export const ENEMIES = { grunt, runner, brute, flyer, splitter, splitter_child: splitterChild, elite, boss };

/** Flacher Boden-Schatten fuer Flieger (wird mit Alpha gezeichnet). */
export function shadow() {
  const g = new Img(24, 8);
  g.oval(12, 4, 11, 3.5, 'ink');
  return g;
}
