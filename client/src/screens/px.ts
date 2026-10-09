/** DOM-Helfer der Meta-Bildschirme: Pixel-Leinwaende, Balken, Tooltip, Palette als CSS-Variablen. */
import { PAL, PAL_NAMES, type PalName } from '../pixel/palette';
import { pixelText, type Sprite } from '../pixel/sprites';
import { h } from '../ui/dom';

/** Kopiert eine Sprite-Leinwand auf ein eigenes Element, ganzzahlig vergroessert und scharf. */
export function cv(s: Sprite, scale: number, cls = ''): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = s.canvas.width;
  c.height = s.canvas.height;
  c.className = `px ${cls}`.trim();
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  c.getContext('2d')?.drawImage(s.canvas, 0, 0);
  return c;
}

/** Zeichnet ein Sprite neu in eine bestehende Leinwand (Animation, Vorschau). */
export function blit(c: HTMLCanvasElement, s: Sprite, scale: number): void {
  if (c.width !== s.canvas.width || c.height !== s.canvas.height) {
    c.width = s.canvas.width;
    c.height = s.canvas.height;
  }
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  const g = c.getContext('2d');
  g?.clearRect(0, 0, c.width, c.height);
  g?.drawImage(s.canvas, 0, 0);
}

/** Pixelschrift (nur Grossbuchstaben und Ziffern) als Leinwand. */
export function ptext(text: string, scale: number, color: PalName = 'white', outline: PalName | null = 'ink', cls = ''): HTMLCanvasElement {
  return cv(pixelText(text.toUpperCase(), color, outline), scale, `ptext ${cls}`);
}

export function setPalette(el: HTMLElement): void {
  for (const n of PAL_NAMES) el.style.setProperty(`--p-${n}`, PAL[n]);
}

/** Pixel-Balken: aussen Rahmen, innen Fuellung (Breite in Prozent). */
export function bar(cls = ''): { el: HTMLElement; fill: HTMLElement; set(frac: number): void } {
  const el = h('div', `pbar ${cls}`.trim());
  const fill = h('div', 'pbar-fill');
  el.append(fill);
  return { el, fill, set: (f) => { fill.style.width = `${Math.max(0, Math.min(1, f)) * 100}%`; } };
}

/** Ein Tooltip pro Bildschirm, folgt dem Zeiger und bleibt im Fenster. */
export function makeTip(host: HTMLElement): { attach(el: HTMLElement, build: () => HTMLElement | string): void; hide(): void } {
  const tip = h('div', 'ptip hidden');
  host.append(tip);
  const place = (x: number, y: number): void => {
    const r = tip.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(x + 18, hr.right - r.width - 8) - hr.left)}px`;
    tip.style.top = `${Math.max(8, Math.min(y + 18, hr.bottom - r.height - 8) - hr.top)}px`;
  };
  const hide = (): void => tip.classList.add('hidden');
  return {
    hide,
    attach(el, build) {
      const show = (x: number, y: number): void => {
        const c = build();
        tip.replaceChildren(typeof c === 'string' ? document.createTextNode(c) : c);
        tip.classList.remove('hidden');
        place(x, y);
      };
      el.addEventListener('pointerenter', (e) => show(e.clientX, e.clientY));
      el.addEventListener('pointermove', (e) => place(e.clientX, e.clientY));
      el.addEventListener('pointerleave', hide);
      el.addEventListener('focus', () => { const r = el.getBoundingClientRect(); show(r.right, r.top); });
      el.addEventListener('blur', hide);
    },
  };
}

export const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
