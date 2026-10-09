/** Pixel-Schrift 3 x 5 fuer schwebende Zahlen und kurze Schilder (+Gold, Schaden, Rundenzahl). Reine Raster, kein DOM. */
import type { PalName } from './palette';
import { outlineSurface, Surface } from './sprites/surface';

const G: Record<string, string> = {
  '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
  '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111',
  '+': '000010111010000', '-': '000000111000000', '.': '000000000000010', ',': '000000000010100', '/': '001001010100100',
  '%': '101001010100101', x: '000101010101000', ':': '000010000010000', '!': '010010010000010', '$': '011110010011110', '?': '110001010000010',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111',
};
G.k = G.K; G.m = G.M;

export const FONT_W = 3;
export const FONT_H = 5;

export function glyphWidth(ch: string): number { return ch === ' ' ? 2 : ch === '.' || ch === ',' || ch === ':' || ch === '!' ? 1 : 3; }

/** Text als Raster-Flaeche (ohne Umriss). Unbekannte Zeichen werden uebersprungen. */
export function textSurface(text: string, color: PalName = 'white', shade: PalName | null = null): Surface {
  const str = text.toUpperCase().replace(/K/g, 'K');
  let w = 0;
  for (const ch of str) w += glyphWidth(ch) + 1;
  const s = new Surface(Math.max(1, w - 1), FONT_H);
  let x = 0;
  for (const ch of str) {
    const gw = glyphWidth(ch);
    const g = G[ch] ?? (ch === ' ' ? '000000000000000' : null);
    if (g) {
      const off = gw === 1 ? 1 : 0;
      for (let i = 0; i < 15; i++) {
        if (g[i] !== '1') continue;
        const gx = i % 3, gy = Math.floor(i / 3);
        if (gw === 1 && gx !== off) continue;
        s.px(x + (gw === 1 ? 0 : gx), gy, color);
      }
    }
    x += gw + 1;
  }
  if (shade) for (let y = FONT_H - 1; y >= 0; y--) for (let xx = 0; xx < s.w; xx++) if (s.get(xx, y) === color && y === FONT_H - 1) s.px(xx, y, shade);
  return s;
}

export interface TextRaster { rows: string[]; ax: number; ay: number }
/** Text mit 1-px-Umriss (Standard `ink`). Anker = Mitte unten, damit schwebende Zahlen ueber einem Punkt haengen. */
export function textRaster(text: string, color: PalName = 'white', outline: PalName | null = 'ink', shade: PalName | null = null): TextRaster {
  const t = textSurface(text, color, shade);
  const pad = outline ? 1 : 0;
  const s = new Surface(t.w + pad * 2, t.h + pad * 2);
  s.blit(t, pad, pad);
  const o = outline ? outlineSurface(s, outline, true) : s;
  return { rows: o.toRows(), ax: Math.floor(o.w / 2), ay: o.h - 1 };
}
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text.toUpperCase()) w += glyphWidth(ch) + 1;
  return Math.max(0, w - 1);
}
