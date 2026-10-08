/**
 * Inline-SVG-Icons des Baukastens (24x24, Strich in `currentColor`). Eigene Zeichnungen im Strichstil von Feather/Lucide (MIT/ISC, Herkunft in
 * `assets/ATTRIBUTIONS.md`). Kein Netz, keine Bibliothek: jedes Icon ist ein Pfad-String; `icon()` klont ein Template.
 */

/** Pfad-Inhalt je Icon. `fill:` am Anfang = gefuellte Form. */
const PATHS: Record<string, string> = {
  crystal: '<path d="M12 2.5 19 9l-7 12.5L5 9z"/><path d="M5 9h14M9.5 9 12 2.5 14.5 9M9.5 9 12 21.5 14.5 9"/>',
  coin: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.6"/><path d="M12 9.2v5.6"/>',
  heart: '<path d="M12 20.5s-8-4.8-8-10.4A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8 2.7c0 5.6-8 10.4-8 10.4z"/>',
  play: 'fill:<path d="M7 4.5v15l12.5-7.5z"/>',
  summon: 'fill:<path d="M12 1.8 14.4 9.6 22.2 12l-7.8 2.4L12 22.2 9.6 14.4 1.8 12l7.8-2.4z"/>',
  sword: '<path d="M14.5 17.5 3.5 6.5v-3h3l11 11M13 19l6-6M16 16l4.5 4.5M19 21l2-2"/>',
  swords: '<path d="m14.5 17.5-11-11V3.5h3l11 11M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5 21 18v3h-3L6.5 9.5M11 5 5 11M8 8 3.5 3.5M5 3 3 5"/>',
  shield: '<path d="M12 2.8 20 6v6.2c0 4.7-3.3 7.9-8 9.2-4.7-1.3-8-4.5-8-9.2V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  bag: '<path d="M5.5 8h13l1 12.5h-15z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="m10 13 2 2 2-2"/>',
  gear: '<circle cx="12" cy="12" r="8.2" stroke-width="3.4" stroke-dasharray="3.2 3.2" stroke-linecap="butt"/><circle cx="12" cy="12" r="5.4"/><circle cx="12" cy="12" r="2"/>',
  flag: '<path d="M5.5 21.5v-18"/><path d="M5.5 4h12l-2.6 4 2.6 4h-12"/>',
  skull: '<path d="M12 3a8 8 0 0 0-8 8c0 3 1.6 4.7 3.2 5.6V20h9.6v-3.4C18.4 15.7 20 14 20 11a8 8 0 0 0-8-8z"/><circle cx="9" cy="11.5" r="1.4"/><circle cx="15" cy="11.5" r="1.4"/><path d="M10.5 20v-2.4M13.5 20v-2.4"/>',
  star: 'fill:<path d="m12 2.6 2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.4"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  back: '<path d="m15 5-7 7 7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4.5" rx="1"/><path d="M12 8v13M5 12.5V21h14v-8.5"/><path d="M12 8C9 8 7.5 3.5 10.5 3.5 12.5 3.5 12 8 12 8s-.5-4.5 1.5-4.5C16.5 3.5 15 8 12 8z"/>',
  bolt: 'fill:<path d="M13.5 2 4.5 14h6.6l-1.1 8 9-12.4h-6.6z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.8-4.8"/>',
  sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M17 20V4M13.5 7.5 17 4l3.5 3.5"/>',
  pause: 'fill:<path d="M6.5 4.5h3.8v15H6.5zM13.7 4.5h3.8v15h-3.8z"/>',
  fast: 'fill:<path d="M3.5 5.5 11 12l-7.5 6.5zM12.5 5.5 20 12l-7.5 6.5z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.3 9.4a2.8 2.8 0 1 1 4.2 2.4c-.9.5-1.5 1.1-1.5 2.1M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" class="dot"/>',
  trait: '<path d="M12 3.2 20 9l-8 11.8L4 9z"/><path d="M4 9h16"/>',
  evolve: '<path d="M12 21V8M12 8 7 13M12 8l5 5M7 5l5-3 5 3"/>',
  reroll: '<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/>',
  ground: '<path d="M3 19.5h18M6.5 19.5v-3.4M10.5 19.5V14M14.5 19.5v-4.6M18 19.5v-3"/>',
  hill: '<path d="M2.5 19.5c3-8.2 6.8-11.4 9.5-11.4s6.500 3.200 9.500 11.400z"/>',
  hybrid: '<path d="M2.5 19.5c3-8.2 6.800-11.400 9.500-11.400s6.500 3.200 9.500 11.400zM12 8.100V3.500M9.500 5.500 12 3l2.500 2.500"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.500 4.500L19 7.500"/>',
  sparkle: 'fill:<path d="M12 3 13.600 10.400 21 12l-7.400 1.600L12 21l-1.600-7.400L3 12l7.400-1.600z"/>',
  crown: '<path d="M3.500 18.500h17L19 8l-4.500 4.500L12 5.500 9.500 12.500 5 8z"/>',
  // Elemente
  fire: '<path d="M12 2.600c1.100 3.600 5.600 5.700 5.600 11.100a5.600 5.600 0 0 1-11.200 0c0-2.100.800-3.600 2.100-4.800.200 1.700 1 2.700 2 3.100-.1-3.100-.600-6.200 1.500-9.400z"/>',
  water: '<path d="M12 3C9 7.500 5.500 11 5.500 14.700a6.500 6.500 0 0 0 13 0C18.500 11 15 7.500 12 3z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  ice: '<path d="M12 2.500v19M3.800 7.300l16.400 9.400M3.800 16.700 20.200 7.300M9.500 4.300 12 6.500l2.500-2.200M9.500 19.700 12 17.500l2.500 2.200"/>',
  lightning: 'fill:<path d="M13.500 2 4.500 14h6.600l-1.100 8 9-12.400h-6.600z"/>',
  air: '<path d="M3 9h10.500a3 3 0 1 0-3-3M3 15h14.500a3 3 0 1 1-3 3M3 12h6"/>',
  light: '<circle cx="12" cy="12" r="4.200"/><path d="M12 2.500v2.800M12 18.700v2.800M2.500 12h2.800M18.700 12h2.800M5.300 5.300l2 2M16.700 16.700l2 2M5.300 18.700l2-2M16.700 7.300l2-2"/>',
  dark: '<path d="M20 14.800A8.500 8.500 0 1 1 9.200 4a7 7 0 0 0 10.800 10.800z"/>',
  earth: '<path d="m2.800 19.500 6.200-10.500 3.600 5.600 2.700-3.600 5.900 8.500z"/>',
  rose: '<circle cx="12" cy="12" r="2.200"/><circle cx="12" cy="6.300" r="2.700"/><circle cx="17.400" cy="10.300" r="2.700"/><circle cx="15.300" cy="16.600" r="2.700"/><circle cx="8.700" cy="16.600" r="2.700"/><circle cx="6.600" cy="10.300" r="2.700"/>',
  mark: '<path d="M12 2.800 20 7.400v9.200l-8 4.600-8-4.600V7.400z"/><path d="M12 8l3.500 2v4L12 16l-3.500-2v-4z"/>',
  shard: '<path d="M8 3.500h8l4 6.500-8 11.500L4 10z"/><path d="M4 10h16M12 21.500 9.500 10 12 3.500 14.500 10z"/>',
  none: '<circle cx="12" cy="12" r="7.500"/>',
};

const cache = new Map<string, SVGElement>();

function build(name: string): SVGElement {
  const raw = PATHS[name] ?? PATHS.none!;
  const fill = raw.startsWith('fill:');
  const tpl = document.createElement('template');
  tpl.innerHTML = `<svg class="ic${fill ? ' fill' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${fill ? raw.slice(5) : raw}</svg>`;
  return tpl.content.firstElementChild as SVGElement;
}

/** Icon als SVG-Element (jedes Mal ein frischer Klon). `cls` haengt Klassen an (Groesse ueber `font-size` des Elternteils oder der Klasse). */
export function icon(name: string, cls?: string): SVGElement {
  let base = cache.get(name);
  if (!base) {
    base = build(name);
    cache.set(name, base);
  }
  const c = base.cloneNode(true) as SVGElement;
  if (cls) c.classList.add(...cls.split(' '));
  return c;
}

export const hasIcon = (name: string): boolean => name in PATHS;

/** Elemente, fuer die es ein Symbol und eine Farbe gibt (alles andere zaehlt als `none`). */
export const ELEMENT_IDS = ['fire', 'water', 'ice', 'lightning', 'air', 'light', 'dark', 'earth', 'rose'] as const;
export type ElementId = (typeof ELEMENT_IDS)[number];

/** Normalisiert ein Element aus den Daten; unbekannt -> `none`. */
export const elementId = (e: string | undefined): ElementId | 'none' => ((ELEMENT_IDS as readonly string[]).includes(e ?? '') ? (e as ElementId) : 'none');

/** CSS-Farbe (Variable) eines Elements. */
export const elementVar = (e: string | undefined): string => `var(--el-${elementId(e)})`;

/** Element-Symbol, eingefaerbt ueber die Variable `--el`. */
export function elementIcon(e: string | undefined, cls?: string): SVGElement {
  const el = icon(elementId(e), cls);
  (el as unknown as HTMLElement).style.color = elementVar(e);
  return el;
}
