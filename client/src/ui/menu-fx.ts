/**
 * Rueckmeldung im Menue (Runde 10, P3): Zaehler laufen hoch, wenn Waehrung dazukommt (mit Ticken und Muenzklang), und `celebrate` zeigt
 * Level-Up, Evolution und Freischaltung als Stempel mit Funken, ohne etwas zu sperren (laeuft von selbst aus, Klicks gehen durch).
 * Beides ist nur Anzeige: die Zahlen stehen beim Aufruf schon fest (Backend), `data-*`-Werte am Zaehler sind sofort der Endwert.
 */
import { uiSound } from '../audio/ui-audio';
import { h } from './dom';
import { Sparks } from './sparks';

const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const timers = new WeakMap<HTMLElement, ReturnType<typeof setInterval>>();

/** Zahl in `el` von `from` nach `to` hochzaehlen; fertig nach `ms`. Ein neuer Aufruf auf demselben Element ersetzt den alten. */
export function countUp(el: HTMLElement, from: number, to: number, format: (n: number) => string, ms = 900): void {
  const old = timers.get(el);
  if (old) clearInterval(old);
  el.dataset.value = String(to);
  if (to <= from || reduced()) {
    el.textContent = format(to);
    return;
  }
  const t0 = performance.now();
  const dur = Math.min(1600, Math.max(350, ms));
  el.classList.add('counting');
  let lastTick = 0;
  const id = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (k - lastTick > 0.08 && k < 1) {
      lastTick = k;
      uiSound('ui.tick', 0.7, 0.85 + k * 0.8);
    }
    if (k >= 1) {
      clearInterval(id);
      timers.delete(el);
      el.textContent = format(to);
      el.classList.remove('counting');
      uiSound('ui.coin', 0.8);
    }
  }, 40);
  timers.set(el, id);
}

export type CelebrateKind = 'levelup' | 'evolve' | 'unlock';

const HUE: Record<CelebrateKind, number> = { levelup: 45, evolve: 170, unlock: 275 };
const SOUND = { levelup: 'ui.levelup', evolve: 'ui.evolve', unlock: 'ui.unlock' } as const;

export interface CelebrateOptions {
  kind: CelebrateKind;
  title: string;
  sub?: string;
  /** Anzeigedauer in ms (Standard 2200) */
  ms?: number;
}

/** Stempel mit Funken in der Bildmitte. Blockiert nichts (`pointer-events: none`) und verschwindet von selbst. */
export function celebrate(o: CelebrateOptions): HTMLElement {
  const box = h('div', `celebrate cel-${o.kind}`);
  box.setAttribute('role', 'status');
  const canvas = h('canvas', 'cel-fx');
  const stamp = h('div', 'cel-stamp');
  stamp.append(h('strong', 'cel-title', o.title));
  if (o.sub) stamp.append(h('span', 'cel-sub', o.sub));
  box.append(canvas, stamp);
  document.body.append(box);
  uiSound(SOUND[o.kind]);
  const sp = new Sparks(canvas);
  sp.burst(HUE[o.kind], o.kind === 'evolve' ? 110 : 70, 6);
  if (o.kind === 'levelup') sp.glitter(undefined, 160, 22);
  const ms = o.ms ?? 2200;
  setTimeout(() => box.classList.add('out'), ms);
  setTimeout(() => box.remove(), ms + 500);
  return box;
}

/** Namen dessen, was seit dem letzten Besuch neu freigeschaltet ist. `seen === null` (erster Besuch) meldet nichts. */
export function newUnlocks(seen: readonly string[] | null, now: readonly { id: string; name: string }[]): string[] {
  if (seen === null) return [];
  const had = new Set(seen);
  return now.filter((x) => !had.has(x.id)).map((x) => x.name);
}

const SEEN_KEY = 'dw.seenUnlocks';

/** Freischaltungen der Weltkarte mit dem gemerkten Stand vergleichen (localStorage, Fehler egal) und neue mit Stempel melden. */
export function announceUnlocks(now: readonly { id: string; name: string }[], title: string): void {
  let seen: string[] | null = null;
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    seen = raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    seen = null;
  }
  const fresh = newUnlocks(seen, now);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(now.map((x) => x.id)));
  } catch {
    /* gesperrter Speicher: dann gibt es eben keinen Stempel */
  }
  if (fresh.length > 0) celebrate({ kind: 'unlock', title, sub: fresh.slice(0, 3).join(' · ') + (fresh.length > 3 ? ` +${fresh.length - 3}` : '') });
}
