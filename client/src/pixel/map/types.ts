/**
 * Gemeinsame Schnittstelle aller Karten (Runde 15 / B1): jede Karte liefert EIN Boden-Bild (Textur), eine animierte
 * Ebene (`anim`, ueber dem Boden: Wasser, Eis, Lava), Dekoration (ueber `anim`, unter den Figuren), einzeln sortierbare
 * Dinge (`props`) und Listen fuer bewegte Kleinteile (Rauch, Lichter). Schnee, Funken und Dunst kommen aus `ambient.ts`.
 */
import type { Buf } from './buf';
import type { PropArt } from './props';

export type MapId = 'meadow' | 'frostfen' | 'quarry' | 'dunes' | 'harbor' | 'spire';
export const MAP_IDS: MapId[] = ['meadow', 'frostfen', 'quarry', 'dunes', 'harbor', 'spire'];

export interface PlacedArt {
  prop: { kind: string; x: number; y: number; v: number; r: number };
  art: PropArt;
}
export interface MapLight {
  x: number;
  y: number;
  r: number;
  /** warm = gelb/orange Schein, sonst kalt (eisblau) */
  warm: boolean;
  /** Farbe des Scheins (Palettenname), Standard: warm -> yellow, kalt -> ice */
  col?: 'yellow' | 'orange' | 'ice' | 'violet' | 'magenta';
  /** flackert (Laterne/Feuer) bzw. pulsiert (Kristall) */
  flicker?: 'flame' | 'pulse';
}
export interface MapArt {
  id: MapId;
  name: string;
  ground: Buf;
  /** Bildfolge der animierten Ebene (nur belegte Pixel dort, wo sie wirkt) */
  anim: Buf[];
  /** Dauer eines Bildes der Folge in ms */
  animMs: number;
  deco: Buf;
  props: PlacedArt[];
  lights: MapLight[];
  /** Rauchquellen (Schornstein, Ofenrohr): Mittelpunkt in px */
  smoke: { x: number; y: number }[];
}
