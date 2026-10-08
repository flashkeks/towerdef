/**
 * Baukasten des Interface-Neubaus (Runde 8, P4): kleine Bausteine mit festen Klassen, damit Bildschirme sie ohne eigenes CSS zusammensetzen.
 * `panel()` Glas-Panel, `rarityFrame()` Seltenheits-Rahmen, `portraitCard()` Karte mit Bild oder gestalteter Ersatzkarte, `tile()` Menue-Kachel,
 * `chip()` Filter-Knopf, `stars()`, `walletChip()`. Icons: `icons.ts`, gemalte Flaechen: `art.ts`, Tokens: `tokens.css`.
 * Der Baukasten kennt keine Spieldaten: Namen, Elemente, Seltenheit kommen als Parameter (so laesst er sich auch fuer die Weltkarte von P3 nutzen).
 */
import { loadPortraitIndex, portraitKnown, portraitUrl } from '../../view/portrait';
import { h } from '../dom';
import { bust } from './art';
import { elementIcon, elementId, elementVar, icon } from './icons';

export { icon, elementIcon, elementVar, elementId } from './icons';
export { backdrop, bust, crest, sigil, burstField } from './art';

/** Seltenheiten in aufsteigender Reihenfolge (Gacha: `rare` ... `exclusive`). */
export const RARITIES = ['rare', 'epic', 'legendary', 'mythic', 'secret', 'exclusive'] as const;
export type RarityId = (typeof RARITIES)[number];

/** Daten-Seltenheit ("Mythic", "mythic", unbekannt) -> Rahmen-ID. */
export const rarityId = (r: string | null | undefined): RarityId => {
  const k = (r ?? '').toLowerCase();
  return (RARITIES as readonly string[]).includes(k) ? (k as RarityId) : 'rare';
};

// ---- Panel ---------------------------------------------------------------------------------------------------------

export interface PanelOptions {
  /** Titel in der Kopfzeile (Grossbuchstaben, Akzentfarbe) */
  title?: string;
  tone?: 'gold' | 'aether' | 'violet' | 'ember';
  /** Eckmarken */
  corners?: boolean;
  cls?: string;
  tag?: 'section' | 'div' | 'aside' | 'header';
}

/** Glas-Panel mit Kantenlicht. Kinder landen im Inhaltsbereich `.kp-body`; `el.body` zeigt darauf. */
export function panel(o: PanelOptions = {}, ...children: (Node | string)[]): HTMLElement & { body: HTMLElement } {
  const el = h(o.tag ?? 'section', `kp${o.tone && o.tone !== 'gold' ? ` ${o.tone}` : ''}${o.corners ? ' corners' : ''}${o.cls ? ` ${o.cls}` : ''}`) as HTMLElement & { body: HTMLElement };
  if (o.title) {
    const head = h('div', 'kp-head');
    head.append(h('h3', undefined, o.title));
    el.append(head);
  }
  const body = h('div', 'kp-body');
  body.append(...children);
  el.append(body);
  el.body = body;
  return el;
}

// ---- Seltenheits-Rahmen ----------------------------------------------------------------------------------------------

export interface FrameOptions {
  tag?: 'div' | 'button';
  cls?: string;
  /** zusaetzliches Pulsieren des Leuchtens (Detail, Held, Enthuellung) */
  live?: boolean;
  /** Inhalt bestimmt die Groesse (sonst fuellt er eine vorgegebene Box, z. B. per `aspect-ratio`) */
  flow?: boolean;
  /** ohne Animation und mit kleinerem Radius (Listen) */
  flat?: boolean;
}

/** Wickelt `content` in den Rahmen der Seltenheit (Verlauf im Ring, Leuchten; Mythic und Secret laufen). */
export function rarityFrame(rarity: string, content: Node | null, o: FrameOptions = {}): HTMLElement {
  const el = h(o.tag ?? 'div', `rf${o.live ? ' live' : ''}${o.flow ? ' flow' : ''}${o.flat ? ' flat' : ''}${o.cls ? ` ${o.cls}` : ''}`);
  if (el instanceof HTMLButtonElement) el.type = 'button';
  el.dataset.rarity = rarityId(rarity);
  const inner = h('div', 'rf-in');
  if (content) inner.append(content);
  el.append(inner);
  return el;
}

// ---- Sterne ----------------------------------------------------------------------------------------------------------

/** `n` von `max` Sternen (gefuellte und blasse). */
export function stars(n: number, max: number): HTMLElement {
  const el = h('span', 'stars');
  el.setAttribute('aria-label', `${n} of ${max} stars`);
  for (let i = 0; i < max; i++) el.append(icon('star', i < n ? '' : 'off'));
  return el;
}

// ---- Portraet-Karte ------------------------------------------------------------------------------------------------

// Index der vorhandenen Bilder frueh holen (stilles Scheitern lokal): danach weiss `portraitKnown` genau, welche Karten ein Bild versuchen
void loadPortraitIndex();

/** Ladefehler merken, damit nicht jede Karte erneut ein fehlendes Bild anfragt. */
const noImage = new Set<string>();

export interface PortraitCardOptions {
  unitId: string;
  name: string;
  /** Serie der Figur: kleine Zweitzeile unter dem Namen (Runde 10 / P1) */
  series?: string;
  rarity: string;
  /** Elemente der Unit (das erste bestimmt die Farbe) */
  elements?: readonly string[];
  /** Spieler-Level (nur besessene) */
  level?: number;
  stars?: number;
  maxStars?: number;
  owned?: boolean;
  inTeam?: boolean;
  /** Trait-Abzeichen oben rechts; ohne Angabe bleibt der Platz frei */
  trait?: string;
  /** `button` fuer klickbare Karten */
  tag?: 'div' | 'button';
  cls?: string;
  live?: boolean;
  /** ohne Name und Zeile unten (kleine Karten) */
  bare?: boolean;
  /** Klasse `unit-tile` (Raster, Smoke) setzen; die Unit-Leiste im Match setzt sie nicht, damit sie nicht als Sammlungskarte zaehlt */
  tile?: boolean;
}

/** Bild-Ebene: Ersatzfigur als Untergrund, das Bild blendet darueber ein; schlaegt das Laden fehl, bleibt die Ersatzfigur. */
export function artLayer(unitId: string, elements: readonly string[] | undefined, initials: string): HTMLElement {
  const fb = h('div', 'pc-fb');
  fb.style.setProperty('--el', elementVar(elements?.[0]));
  fb.append(bust(unitId), h('span', 'pc-ini', initials));
  const box = h('div', 'pc-art-box');
  box.append(fb);
  if (portraitKnown(unitId) !== false && !noImage.has(unitId)) {
    const img = new Image();
    img.className = 'pc-img';
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.style.opacity = '0';
    img.addEventListener('load', () => {
      img.style.opacity = '1';
      img.style.transition = 'opacity 0.3s, transform 0.5s var(--ease-out)';
      setTimeout(() => fb.remove(), 350);
    });
    img.addEventListener('error', () => {
      noImage.add(unitId);
      img.remove();
    });
    img.src = portraitUrl(unitId);
    box.append(img);
  }
  return box;
}

/**
 * Karte einer Unit im Seitenverhaeltnis 3:4: Bild (oder Ersatzfigur mit Initialen), Element-Symbol, Trait-Platz, Name, Stufe und Sterne, Rahmen nach
 * Seltenheit. Die Wurzel traegt `unit-tile r-<seltenheit>` und `data-unit`, damit Raster, Smoke und Tests sie finden.
 */
export function portraitCard(o: PortraitCardOptions): HTMLElement {
  const rar = rarityId(o.rarity);
  const pc = h('div', 'pc');
  const ini = (o.name.split(/[\s\-_:()]+/).filter((x) => /[A-Za-z0-9]/.test(x)).slice(0, 2).map((x) => x[0]).join('') || '?').toUpperCase();
  pc.append(artLayer(o.unitId, o.elements, ini), h('div', 'pc-shade'));
  const el0 = o.elements?.[0];
  if (el0 !== undefined) {
    const badge = h('span', 'pc-el');
    badge.style.setProperty('--el', elementVar(el0));
    badge.title = el0;
    badge.append(elementIcon(el0));
    pc.append(badge);
  }
  if (o.trait) pc.append(h('span', 'pc-trait', o.trait));
  if (o.inTeam) pc.append(h('span', 'pc-team', 'TEAM'));
  if (!o.bare) {
    const cap = h('div', 'pc-cap');
    cap.append(h('span', 'pc-name ut-name', o.name));
    if (o.series) cap.append(h('span', 'pc-series', o.series));
    const sub = h('span', 'pc-sub ut-sub');
    if (o.owned === false) sub.append(h('span', 'pc-lvl', 'not owned'));
    else {
      if (o.level !== undefined) sub.append(h('span', 'pc-lvl', `Lv ${o.level}`));
      if (o.stars !== undefined && o.maxStars) sub.append(stars(o.stars, o.maxStars));
    }
    cap.append(sub);
    pc.append(cap);
  }
  pc.append(h('div', 'pc-sheen'));
  const tag = o.tag ?? 'div';
  const root = rarityFrame(rar, pc, { tag, live: o.live, cls: `${o.tile === false ? 'pcard' : 'unit-tile'} r-${rar}${o.owned === false ? ' unowned' : ''}${o.cls ? ` ${o.cls}` : ''}` });
  root.dataset.unit = o.unitId;
  root.dataset.owned = String(o.owned !== false);
  return root;
}

/** Kleine Portraet-Karte (Teamleiste, Slots): Bild/Ersatzfigur und Rahmen, ohne Text. `px` = Breite, Hoehe 4:3 mehr. */
export function miniCard(o: { unitId: string; name: string; rarity: string; elements?: readonly string[]; px?: number; cls?: string }): HTMLElement {
  const px = o.px ?? 44;
  const c = portraitCard({ unitId: o.unitId, name: o.name, rarity: o.rarity, elements: o.elements, bare: true, cls: `mini${o.cls ? ` ${o.cls}` : ''}` });
  c.classList.remove('unit-tile');
  c.removeAttribute('data-unit');
  c.removeAttribute('data-owned');
  c.style.width = `${px}px`;
  c.style.height = `${Math.round((px * 4) / 3)}px`;
  c.style.setProperty('--rf-r', '9px');
  c.style.setProperty('--rf-w', '2px');
  c.title = o.name;
  return c;
}

// ---- Kachel, Chip, Brieftasche ------------------------------------------------------------------------------------------

export interface TileOptions {
  /** `data-go` und Klassen-Suffix (`lobby-<id>`) */
  id: string;
  title: string;
  sub: string;
  icon: string;
  /** CSS-Farbe der Kachel (z. B. `var(--aether)`) */
  tone?: string;
  badge?: string;
  cls?: string;
  onClick(): void;
}

/** Menue-Kachel: grosses Icon, Titel in Display-Schrift, Untertitel, Leuchten in der Kachelfarbe. */
export function tile(o: TileOptions): HTMLButtonElement {
  const b = h('button', `tile lobby-btn lobby-${o.id}${o.cls ? ` ${o.cls}` : ''}`);
  b.type = 'button';
  b.dataset.go = o.id;
  if (o.tone) b.style.setProperty('--tile', o.tone);
  const ic = h('span', 'tile-ic');
  ic.append(icon(o.icon));
  b.append(ic);
  if (o.badge) b.append(h('span', 'tile-badge', o.badge));
  b.append(h('strong', undefined, o.title), h('span', 'tile-sub lobby-sub', o.sub));
  b.addEventListener('click', o.onClick);
  return b;
}

export interface ChipOptions {
  text?: string;
  /** Icon (links) oder Farbpunkt */
  icon?: SVGElement;
  dot?: string;
  active?: boolean;
  title?: string;
  cls?: string;
}

/** Filter-Chip als Knopf (`aria-pressed`). */
export function chip(o: ChipOptions): HTMLButtonElement {
  const b = h('button', `btn chip${o.active ? ' active' : ''}${o.cls ? ` ${o.cls}` : ''}`);
  b.type = 'button';
  b.setAttribute('aria-pressed', String(!!o.active));
  if (o.dot) {
    const d = h('span', 'dot');
    d.style.setProperty('--dot', o.dot);
    b.append(d);
  }
  if (o.icon) b.append(o.icon);
  if (o.text) b.append(o.text);
  if (o.title) b.title = o.title;
  return b;
}
