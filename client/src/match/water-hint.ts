/**
 * Runde 16 TP: Wasserflaechen einer Karte als Hinweis-Ebene beim Platzieren eines Wasserturms (Riverkeeper).
 * Einmal je Karte gemalt: Schachbrett-Raster in Eis-Blau innen, durchgehender Umriss aussen — Pixel-Stil, keine weichen Kanten.
 * Polygone in px wie `DATA.maps[id].water` (die Sim rechnet in Milli-px).
 */
import { DATA } from '../sim';
import { PAL } from '../pixel/palette';

const cache = new Map<string, HTMLCanvasElement>();

/** Hat die Karte ueberhaupt Wasser? (Ember Quarry: nein, dort ist der Riverkeeper nicht baubar.) */
export const hasWater = (map: string): boolean => ((DATA.maps[map]?.water ?? []) as unknown[]).length > 0;

/** Maske `w*h` (1 = Wasser) aus den Polygonen; Fuellung per Canvas-Pfad, danach hart auf 0/1 geschnitten. */
export function waterMask(map: string, w: number, h: number): Uint8Array {
  const polys = (DATA.maps[map]?.water ?? []) as [number, number][][];
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#fff';
  for (const p of polys) {
    if (p.length < 3) continue;
    g.beginPath();
    g.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]);
    g.closePath();
    g.fill();
  }
  const d = g.getImageData(0, 0, w, h).data;
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
  return m;
}

/** Hinweisbild der Karte (gecacht): innen jedes zweite Pixel, Rand voll. */
export function waterHintCanvas(map: string, w: number, h: number): HTMLCanvasElement {
  const key = `${map}:${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = waterMask(map, w, h);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(w, h);
  const put = (i: number, hexCol: string, a: number): void => {
    const n = parseInt(hexCol.slice(1), 16);
    img.data[i * 4] = (n >> 16) & 255; img.data[i * 4 + 1] = (n >> 8) & 255; img.data[i * 4 + 2] = n & 255; img.data[i * 4 + 3] = a;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!m[i]) continue;
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !m[i - 1] || !m[i + 1] || !m[i - w] || !m[i + w];
    if (edge) put(i, PAL.white, 255);
    else if ((x + y) % 2 === 0) put(i, PAL.ice, 150);
  }
  g.putImageData(img, 0, 0);
  cache.set(key, cv);
  return cv;
}
