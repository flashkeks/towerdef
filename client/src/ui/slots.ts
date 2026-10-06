/**
 * Slot-Buttons ueber dem Canvas (DOM, testbar, kein Pixi-Hit-Testing) samt Groesse/Lage je Tile-Groesse.
 * Besitzer: P1 (Platzier-Modus, Slot-Typen auf einen Blick, Hervorhebung, Fehler am Zeiger).
 *
 * Optik: Boden = runde Steinplatte, Huegel = brauner Huegel mit Spitze, Gross = goldgerahmte 2x2-Flaeche mit Fahne.
 * Jeder freie Slot traegt seine Beschriftung. Im Platzier-Modus leuchten passende Slots, unpassende werden grau und
 * nennen beim Daruberfahren den Grund. Besetzte Slots sind unsichtbar (die Unit ist darunter im Canvas zu sehen).
 * P4 tauscht spaeter nur die Grafik (CSS `.slot .plate`), die Logik bleibt.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { mismatchText, slotFit, slotType } from '../view/placement';
import { clear, h, setClass, setText } from './dom';

interface SlotBtn {
  el: HTMLButtonElement;
  why: HTMLSpanElement;
}

export class Slots {
  readonly el = h('div', 'slots');
  private btns: SlotBtn[] = [];
  private tile = 0;
  private sig = '';

  /** `boardWrap` = Container ueber dem Canvas; seine Groesse folgt der Tile-Groesse. */
  constructor(private readonly boardWrap: HTMLElement) {}

  bind(session: Session): void {
    clear(this.el);
    this.btns = [];
    this.sig = '';
    for (const s of session.sim.slots()) {
      const type = slotType(s);
      const b = h('button', `slot ${s.kind} size${s.size} type-${type}`);
      b.dataset.slot = String(s.id);
      b.dataset.type = type;
      b.type = 'button';
      const why = h('span', 'why');
      b.append(h('span', 'plate'), h('span', 'cap', t(`slot.${type}`)), why);
      b.addEventListener('click', () => session.clickSlot(s.id));
      this.el.append(b);
      this.btns.push({ el: b, why });
    }
    this.tile = 0;
    this.bindPointer(session);
  }

  private pointerOff: (() => void) | null = null;

  /** Mauszeiger (fuer Geist und Toast) und Klicks ins Leere. Wird je Runde neu gebunden, die alte Bindung entfaellt. */
  private bindPointer(session: Session): void {
    this.pointerOff?.();
    const wrap = this.boardWrap;
    const toLocal = (e: MouseEvent): { x: number; y: number } => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left - wrap.clientLeft, y: e.clientY - r.top - wrap.clientTop };
    };
    const move = (e: PointerEvent): void => {
      session.pointer = toLocal(e);
    };
    const leave = (): void => {
      session.pointer = null;
    };
    const click = (e: MouseEvent): void => {
      session.pointer = toLocal(e);
      if ((e.target as HTMLElement).closest('.slot')) return;
      session.clickEmpty();
    };
    wrap.addEventListener('pointermove', move);
    wrap.addEventListener('pointerleave', leave);
    wrap.addEventListener('click', click);
    this.pointerOff = () => {
      wrap.removeEventListener('pointermove', move);
      wrap.removeEventListener('pointerleave', leave);
      wrap.removeEventListener('click', click);
    };
  }

  update(s: Session, tile: number): void {
    const slots = s.sim.slots();
    if (tile !== this.tile) {
      this.tile = tile;
      this.boardWrap.style.width = `${17 * tile}px`;
      this.boardWrap.style.height = `${11 * tile}px`;
      this.boardWrap.style.setProperty('--tile', `${tile}px`);
      slots.forEach((slot, i) => {
        const b = this.btns[i]?.el;
        if (!b) return;
        const size = slot.size * tile * 0.92;
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        // sim.slots() liefert Festkomma (1000 = eine Kachel), nicht Kacheln wie stage.slots im Renderer.
        b.style.left = `${(slot.x / 1000 + 0.5) * tile - size / 2}px`;
        b.style.top = `${(slot.y / 1000 + 0.5) * tile - size / 2}px`;
      });
    }
    const def = s.placing ? s.sim.catalog().find((d) => d.id === s.placing) : undefined;
    this.boardWrap.classList.toggle('placing', !!def);
    const sig = `${s.placing ?? ''}|${slots.map((x) => (x.free ? 1 : 0)).join('')}`;
    if (sig === this.sig) return;
    this.sig = sig;
    slots.forEach((slot, i) => {
      const btn = this.btns[i];
      if (!btn) return;
      const fit = def ? slotFit(def, { kind: slot.kind, size: slot.size }, slot.free) : null;
      setClass(btn.el, 'taken', !slot.free);
      setClass(btn.el, 'free', !!fit && fit.ok);
      setClass(btn.el, 'nofit', !!fit && !fit.ok && slot.free);
      const why = def && fit && !fit.ok ? (slot.free ? mismatchText(t(`unit.${def.id}.name`), fit) : t('slot.why.taken')) : '';
      setText(btn.why, why);
      btn.el.dataset.fit = fit ? (fit.ok ? 'ok' : fit.reason) : '';
    });
  }
}
