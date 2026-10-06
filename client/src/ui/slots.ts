/**
 * Slot-Buttons ueber dem Canvas (DOM, testbar, kein Pixi-Hit-Testing) samt Groessen/Lage je Tile-Groesse.
 * Besitzer: P1 (Platzier-Modus, Slot-Hervorhebung, Fehler am Zeiger).
 */
import type { Session } from '../game/session';
import { clear, h, setClass } from './dom';

export class Slots {
  readonly el = h('div', 'slots');
  private btns: HTMLButtonElement[] = [];
  private tile = 0;

  /** `boardWrap` = Container ueber dem Canvas; seine Groesse folgt der Tile-Groesse. */
  constructor(private readonly boardWrap: HTMLElement) {}

  bind(session: Session): void {
    clear(this.el);
    this.btns = [];
    for (const s of session.sim.slots()) {
      const b = h('button', `slot ${s.kind} size${s.size}`);
      b.dataset.slot = String(s.id);
      b.type = 'button';
      b.addEventListener('click', () => session.clickSlot(s.id));
      this.el.append(b);
      this.btns.push(b);
    }
    this.tile = 0;
  }

  update(s: Session, tile: number): void {
    if (tile !== this.tile) {
      this.tile = tile;
      this.boardWrap.style.width = `${17 * tile}px`;
      this.boardWrap.style.height = `${11 * tile}px`;
      this.boardWrap.style.setProperty('--tile', `${tile}px`);
      s.sim.slots().forEach((slot, i) => {
        const b = this.btns[i];
        if (!b) return;
        const size = slot.size * tile * 0.92;
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        // sim.slots() liefert Festkomma (1000 = eine Kachel), nicht Kacheln wie stage.slots im Renderer.
        b.style.left = `${(slot.x / 1000 + 0.5) * tile - size / 2}px`;
        b.style.top = `${(slot.y / 1000 + 0.5) * tile - size / 2}px`;
      });
    }
    s.sim.slots().forEach((slot, i) => {
      const b = this.btns[i];
      if (!b) return;
      setClass(b, 'free', slot.free && s.placing !== null);
      setClass(b, 'taken', !slot.free);
    });
  }
}
