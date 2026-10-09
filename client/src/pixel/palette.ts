/**
 * Feste Palette fuer ALLES im Spiel (Runde 11, docs/design/pixel-stil.md): ENDESGA 32 (frei nutzbar, von Endesga).
 * Neue Farben nur hier eintragen und begruenden; Sprites benutzen die Namen, nie Hex-Werte direkt.
 */
export const PAL = {
  // Erde, Haut, Holz
  rust: '#be4a2f',
  clay: '#d77643',
  sand: '#ead4aa',
  skin: '#e4a672',
  wood: '#b86f50',
  bark: '#733e39',
  plum: '#3e2731',
  // Rot, Orange, Gelb
  crimson: '#a22633',
  red: '#e43b44',
  orange: '#f77622',
  amber: '#feae34',
  yellow: '#fee761',
  // Gruen
  leaf: '#63c74d',
  grass: '#3e8948',
  pine: '#265c42',
  deep: '#193c3e',
  // Blau, Eis
  navy: '#124e89',
  sky: '#0099db',
  ice: '#2ce8f5',
  // Grau, Stein, Nacht
  white: '#ffffff',
  silver: '#c0cbdc',
  stone: '#8b9bb4',
  slate: '#5a6988',
  dusk: '#3a4466',
  night: '#262b44',
  ink: '#181425',
  // Magie, Pink
  magenta: '#ff0044',
  violet: '#68386c',
  orchid: '#b55088',
  coral: '#f6757a',
  peach: '#e8b796',
  tan: '#c28569',
} as const;

export type PalName = keyof typeof PAL;
export const PAL_NAMES = Object.keys(PAL) as PalName[];

/** Umrissfarbe aller Figuren (pixel-stil.md: 1 px, dunkelste Farbe, nie reines Schwarz). */
export const OUTLINE: PalName = 'ink';

/** Hex -> [r, g, b]. */
export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
