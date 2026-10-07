/**
 * Maus auf dem Spielfeld (Runde 6, freie Platzierung): Groesse des Brett-Containers je Tile-Groesse, Zeigerposition
 * (Canvas-Pixel fuer Toasts, Milli-Tiles fuer den Geist) und Klicks. Ersetzt die Slot-Knoepfe aus Runde 5.
 * Besitzer: P1 (Bedienbarkeit), P3 Runde 6.
 */
import type { Session } from '../game/session';
import { WORLD_H, WORLD_W } from '../game/context';
import { pointerToWorld } from '../view/placement';

export class BoardInput {
  private tile = 0;
  private pointerOff: (() => void) | null = null;

  /** `boardWrap` = Container ueber dem Canvas; seine Groesse folgt der Tile-Groesse. */
  constructor(private readonly boardWrap: HTMLElement) {}

  /** Je Runde neu binden, die alte Bindung entfaellt. */
  bind(session: Session): void {
    this.pointerOff?.();
    this.tile = 0;
    const wrap = this.boardWrap;
    const toLocal = (e: MouseEvent): { x: number; y: number } => {
      const r = wrap.getBoundingClientRect();
      return { x: e.clientX - r.left - wrap.clientLeft, y: e.clientY - r.top - wrap.clientTop };
    };
    const track = (e: MouseEvent): { x: number; y: number } => {
      const p = toLocal(e);
      session.pointer = p;
      session.cursor = this.tile > 0 ? pointerToWorld(p, this.tile) : null;
      return p;
    };
    const move = (e: PointerEvent): void => void track(e);
    const leave = (): void => {
      session.pointer = null;
      session.cursor = null;
    };
    const click = (e: MouseEvent): void => {
      // Klicks auf Banner, Toast usw. im Container zaehlen nicht als Klick aufs Feld
      if ((e.target as HTMLElement).closest('.boss-banner, .toast, .paused')) return;
      track(e);
      const c = session.cursor;
      if (c) session.clickBoard(c.x, c.y, e.shiftKey);
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

  update(tile: number, placing = false): void {
    this.boardWrap.classList.toggle('placing', placing);
    if (tile === this.tile) return;
    this.tile = tile;
    this.boardWrap.style.width = `${WORLD_W * tile}px`;
    this.boardWrap.style.height = `${WORLD_H * tile}px`;
    this.boardWrap.style.setProperty('--tile', `${tile}px`);
  }
}
