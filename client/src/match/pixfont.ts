/** Winzige 3x5-Pixelschrift fuer schwebende Zahlen und Kurztexte auf der Karte (Gross-/Ziffern). Eigene Raster, kein Fremdfont. */
import { Buf, C } from '../pixel/map/buf';

const G: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111',
  '+': '000010111010000', '-': '000000111000000', 'x': '000101010101000', '/': '001001010100100', '!': '010010010000010', '.': '000000000000010',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', ' ': '000000000000000',
};

const cache = new Map<string, HTMLCanvasElement>();
/** Text als Canvas (Farbe: Palettenindex, Umriss ink). */
export function pixText(text: string, col: number, outline = true): { canvas: HTMLCanvasElement; w: number; h: number } {
  const key = `${text}|${col}|${outline}`;
  const w = text.length * 4 - 1 + 2, h = 7;
  let cv = cache.get(key);
  if (!cv) {
    const b = new Buf(w, h);
    [...text.toUpperCase()].forEach((ch, i) => {
      const g = G[ch] ?? G[' '];
      for (let k = 0; k < 15; k++) if (g[k] === '1') b.set(1 + i * 4 + (k % 3), 1 + Math.floor(k / 3), col);
    });
    if (outline) b.outline(C.ink);
    cv = b.toCanvas();
    if (cache.size > 400) cache.clear();
    cache.set(key, cv);
  }
  return { canvas: cv, w, h };
}
