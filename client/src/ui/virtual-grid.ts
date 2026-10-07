/**
 * Virtuelles Raster (Runde 8, P4): zeichnet nur die sichtbaren Karten plus Puffer, damit 561+ Units fluessig scrollen. Die Rechnung steckt in
 * `collection-model.ts` (`gridLayout`, `visibleRange`, ohne DOM getestet); hier nur DOM: Platzhalter fuer die Scrollleiste, absolut positionierte Karten.
 */
import { gridLayout, itemPos, scrollToReveal, visibleRange, type GridLayout } from './collection-model';
import { h } from './dom';

export interface VirtualGridOptions<T> {
  minW: number;
  gap: number;
  /** Hoehe / Breite einer Karte */
  aspect: number;
  /** Karte bauen (wird beim Scrollen fuer neu sichtbare Eintraege aufgerufen) */
  make(item: T, index: number): HTMLElement;
}

export class VirtualGrid<T> {
  readonly el = h('div', 'vgrid');
  private readonly spacer = h('div', 'vgrid-spacer');
  private items: T[] = [];
  private nodes = new Map<number, HTMLElement>();
  private g: GridLayout = gridLayout(0, 0, { minW: 1, gap: 0, aspect: 1 });
  private lastWidth = -1;

  constructor(private readonly o: VirtualGridOptions<T>) {
    this.el.append(this.spacer);
    this.el.addEventListener('scroll', () => this.paint(), { passive: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => this.relayout()).observe(this.el);
  }

  /** Anzahl der Eintraege (fuer Tests und Anzeige). */
  get count(): number {
    return this.items.length;
  }

  /** Neue Liste (nach Filter/Sortierung); scrollt nach oben, wenn `reset`. */
  setItems(items: T[], reset = true): void {
    this.items = items;
    this.el.dataset.count = String(items.length);
    if (reset) this.el.scrollTop = 0;
    this.relayout(true);
  }

  /** Alle sichtbaren Karten neu bauen (Zustand hat sich geaendert, Reihenfolge nicht). */
  refresh(): void {
    this.clearNodes();
    this.paint();
  }

  /** Karte `index` ins Bild scrollen. */
  reveal(index: number): void {
    if (index < 0) return;
    this.el.scrollTop = scrollToReveal(this.g, index, this.el.scrollTop, this.el.clientHeight);
    this.paint();
  }

  private clearNodes(): void {
    for (const n of this.nodes.values()) n.remove();
    this.nodes.clear();
  }

  private relayout(force = false): void {
    const w = this.el.clientWidth;
    if (!force && w === this.lastWidth) return;
    this.lastWidth = w;
    this.g = gridLayout(w, this.items.length, this.o);
    this.spacer.style.height = `${Math.ceil(this.g.totalH)}px`;
    this.clearNodes();
    this.paint();
  }

  private paint(): void {
    const { first, end } = visibleRange(this.g, this.items.length, this.el.scrollTop, this.el.clientHeight || 600);
    for (const [i, n] of this.nodes) {
      if (i < first || i >= end) {
        n.remove();
        this.nodes.delete(i);
      }
    }
    for (let i = first; i < end; i++) {
      if (this.nodes.has(i)) continue;
      const node = this.o.make(this.items[i]!, i);
      const { x, y } = itemPos(this.g, i);
      node.style.position = 'absolute';
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.style.width = `${this.g.cardW}px`;
      node.style.height = `${this.g.cardH}px`;
      this.spacer.append(node);
      this.nodes.set(i, node);
    }
  }
}
