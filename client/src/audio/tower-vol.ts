/**
 * Turm-Lautstaerke nach Ausbaustufe (Runde 12b, Max' Playtest: Basis-Tuerme zu laut). Reine Funktionen, ohne WebAudio.
 *   Stufe 0-2 (hoechste Stufe des Turms): leise und kurz, rund 60 % unter dem alten Pegel
 *   Stufe 3-4: mittel
 *   Stufe 5: voll ("crazy"), dazu etwas tiefer
 * Dazu Mindestabstand je Turmtyp (je hoeher die Stufe, desto dichter darf geschossen werden) und ein Gleitfenster, das die
 * Summe der Turm-Klaenge deckelt, damit zehn Basis-Tuerme nicht wie ein Maschinengewehr klingen.
 */

/** Hoechste Stufe eines Turms ueber alle Pfade (0..5). */
export function topTier(tiers: readonly number[]): number {
  let m = 0;
  for (const t of tiers) if (t > m) m = t;
  return Math.max(0, Math.min(5, m));
}

/** Faktor auf die Rezept-Lautstaerke. Stufe 0-2 = 0,4 (-60 %), 3 = 0,65, 4 = 0,8, 5 = 1,1. */
export function towerLoudness(top: number): number {
  if (top <= 2) return 0.4;
  if (top === 3) return 0.65;
  if (top === 4) return 0.8;
  return 1.1;
}

/** Tonhoehen-Faktor: ganz hohe Stufen klingen etwas voller/tiefer. */
export function towerPitch(top: number): number {
  return top >= 5 ? 0.9 : top >= 3 ? 0.97 : 1;
}

/** Mindestabstand (ms) zwischen zwei Schuss-Klaengen desselben Turmtyps. */
export function towerGapMs(top: number): number {
  if (top <= 2) return 85;
  if (top <= 4) return 55;
  return 35;
}

export interface Hit { t: number; g: number }

/**
 * Wie viel Lautstaerke darf ein neuer Klang noch haben? `recent` = angenommene Klaenge (Zeit in ms, Gain); Rest bis `cap`
 * in einem Fenster von `win` ms. Gibt 0 zurueck, wenn der Rest unter 25 % des Wunsches faellt (Klang verwerfen).
 * Aendert `recent` nicht; `commitHit` haengt den Klang an und raeumt alte Eintraege auf.
 */
export function windowGain(recent: readonly Hit[], now: number, want: number, cap = 1.0, win = 120): number {
  let sum = 0;
  for (const h of recent) if (now - h.t < win) sum += h.g;
  const room = cap - sum;
  if (room >= want) return want;
  return room >= want * 0.25 ? room : 0;
}

export function commitHit(recent: Hit[], now: number, g: number, win = 120): void {
  while (recent.length && now - recent[0].t >= win) recent.shift();
  recent.push({ t: now, g });
}
