/** Kleine Pixel-Symbole fuer die Oberflaeche (Herz, Muenze, Schloss ...), aus Text-Rastern wie alles andere. */
import { paint, type CharMap, type Rows } from '../pixel/raster';

const MAP: CharMap = { k: 'ink', r: 'red', c: 'crimson', w: 'white', y: 'yellow', a: 'amber', o: 'orange', g: 'leaf', d: 'grass', s: 'silver', t: 'stone', l: 'slate', i: 'ice', b: 'sky', n: 'navy', p: 'plum', e: 'sand' };

const ROWS: Record<string, Rows> = {
  heart: ['.kk.kk.', 'kwrkrrk', 'krrrrck', 'krrrrck', '.krrck.', '..kck..', '...k...'],
  coin: ['..kkk..', '.kyyyk.', 'kyywayk', 'kyaayak', 'kyaayak', '.kaaak.', '..kkk..'],
  lock: ['..kkk..', '.ktttk.', '.kt.tk.', 'kkkkkkk', 'kaaaaak', 'kaakaak', 'kaakaak', 'kkkkkkk'],
  check: ['......k', '.....kg', 'k...kg.', 'kg.kg..', '.kgg...', '..kg...'],
  play: ['kk.....', 'kgk....', 'kggk...', 'kgggk..', 'kggk...', 'kgk....', 'kk.....'],
  ff: ['kk..kk..', 'kyk.kyk.', 'kyyk.kyyk', 'kyyyk.kyyyk'.slice(0, 9), 'kyyk.kyyk', 'kyk.kyk.', 'kk..kk..'],
  pause: ['kkk.kkk', 'kwk.kwk', 'kwk.kwk', 'kwk.kwk', 'kwk.kwk', 'kwk.kwk', 'kkk.kkk'],
  sound: ['...k...', '..kk..k.', 'kkkk.k.k', 'kssk.kk.', 'kkkk.k.k', '..kk..k.', '...k...'],
  mute: ['...k...', '..kk.k.k', 'kkkk..k.', 'kssk.k.k', 'kkkk....', '..kk....', '...k...'],
  star: ['...k...', '..kyk..', 'kkkykkk', 'kyyyyyk', '.kyyyk.', '.kyk.yk', '.k...k.'],
  sword: ['....kk', '...kwk', '..kwk.', 'k.kwk.', '.kwk..', '.kk...', 'kek...'],
  auto: ['.kkkk..', 'k.bbbk.', 'k.....k', 'k....kb', '.kkkk.b', '....kbb', '.....k.'],
  bolt: ['...kkk.', '..kyyk.', '.kyyk..', 'kyyyyyk', '..kyyk.', '.kyk...', '.kk....'],
  ember: ['.y...y.', '.kkkkk.', 'kyyayyk', 'kayokak', 'kopoprk', '.krprk.', '..kkk..'],
  shield: ['kkkkkkk', 'ktwtttk', 'kttttlk', 'kttttlk', '.ktllk.', '..klk..', '...k...'],
  flame: ['...k...', '..kok..', '.korok.', '.koyok.', 'koyyyok', '.koyok.', '..kkk..'],
  camo: ['.kkkkk.', 'kgdgdgk', 'kdgkgdk', 'kgdgdgk', '.kkkkk.'],
  skull: ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kwkwk.', '.kkkkk.'],
  flake: ['..k.k..', 'k.kik.k', '.kiwik.', 'kiwwwik', '.kiwik.', 'k.kik.k', '..k.k..'],
  cloud: ['..kkk...', '.ksssk.k', 'ksswsskk', 'ksssssssk'.slice(0, 8), '.kkkkkkk'],
  leaf: ['....kkk', '..kkddk', '.kdgdgk', 'kdgdgk.', 'kdgk...', 'kkk....', 'k......'],
  band: ['kkkkkkk', 'ktttttk', 'kllklkk', 'ktttttk', 'kkkkkkk', 'k.....k', 'k.....k'],
  x: ['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'],
};

const cache = new Map<string, HTMLCanvasElement>();
/** Liefert eine frische Leinwand (CSS: image-rendering pixelated, Groesse per width/height). */
export function uiIcon(name: keyof typeof ROWS | string, scale = 2): HTMLCanvasElement {
  let base = cache.get(name);
  if (!base) {
    base = paint(ROWS[name] ?? ROWS.x, MAP);
    cache.set(name, base);
  }
  const c = document.createElement('canvas');
  c.width = base.width; c.height = base.height;
  c.getContext('2d')!.drawImage(base, 0, 0);
  c.style.width = `${base.width * scale}px`;
  c.style.height = `${base.height * scale}px`;
  c.className = 'px-ic';
  return c;
}

/** Leinwand eines Sprites (Kopie) in x-facher Groesse, fuer Karten und Panels. */
export function copyCanvas(src: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  c.getContext('2d')!.drawImage(src, 0, 0);
  c.style.width = `${src.width * scale}px`;
  c.style.height = `${src.height * scale}px`;
  c.className = 'px-ic';
  return c;
}
