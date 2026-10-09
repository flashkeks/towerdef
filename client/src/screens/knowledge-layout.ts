/**
 * Wissensbaum-Layout (Runde 14b): reine Geometrie, ohne DOM. Alle Aeste stehen nebeneinander auf EINER Flaeche, kein Scrollen:
 * die Zellgroesse `cell` ergibt sich aus Breite und Hoehe des Brettes (Spalten + Astluecken, Zeilen + Kopfzeile), die Knoten
 * skalieren also mit dem Fenster. Liefert je Knoten den Mittelpunkt (Abzeichen) und je Voraussetzung eine Linie von Mitte zu Mitte.
 */
export interface LNode { id: string; branch: string; col: number; row: number; requires: readonly string[] }
export interface LOpts {
  /** Breite und Hoehe des Brettes in px (Innenmasse der Flaeche) */
  width: number; height: number;
  /** Rand links/rechts und unten */
  padX: number; padY: number;
  /** Hoehe der Astueberschriften */
  headH: number;
  /** Luecke zwischen Aesten in Zellen */
  gapCells: number;
  /** Obergrenze der Zellgroesse (sehr grosse Fenster) */
  maxCell: number;
}
export interface PlacedNode { id: string; cx: number; cy: number }
export interface PlacedLine { from: string; to: string; x1: number; y1: number; x2: number; y2: number }
export interface PlacedBranch { branch: string; x: number; w: number; cols: number; rows: number; nodes: PlacedNode[]; lines: PlacedLine[] }
export interface TreeLayout {
  /** Zeilenabstand (Zellhoehe) und Spaltenabstand (Zellbreite) in px */
  cell: number; colW: number; badge: number; branches: PlacedBranch[];
  /** belegte Flaeche (liegt immer innerhalb von width x height), mittig im Brett */
  x: number; y: number; w: number; h: number;
}

export const DEFAULT_OPTS: LOpts = { width: 1208, height: 560, padX: 16, padY: 14, headH: 52, gapCells: 0.55, maxCell: 150 };

export function layoutTree(nodes: readonly LNode[], order: readonly string[], o: LOpts = DEFAULT_OPTS): TreeLayout {
  const act = order.filter((b) => nodes.some((n) => n.branch === b));
  const cols = new Map<string, number>();
  let totalCols = 0, maxRows = 1;
  for (const b of act) {
    const ns = nodes.filter((n) => n.branch === b);
    const c = Math.max(...ns.map((n) => n.col)) + 1;
    cols.set(b, c);
    totalCols += c;
    maxRows = Math.max(maxRows, Math.max(...ns.map((n) => n.row)) + 1);
  }
  const nGaps = Math.max(0, act.length - 1);
  const byH = (o.height - o.headH - o.padY * 2) / maxRows;
  const byW = (o.width - o.padX * 2) / (totalCols + nGaps * o.gapCells);
  const cell = Math.max(24, Math.floor(Math.min(byH, byW * 1.5, o.maxCell)));
  // Spalten duerfen breiter sein als die Zeilen hoch (Namen brauchen Platz), aber nicht uferlos
  const colW = Math.max(24, Math.floor(Math.min(byW, cell * 1.45)));
  const badge = Math.round(Math.min(cell, colW) * 0.64 / 2) * 2;
  // Restbreite geht in die Astluecken (bis zu einer ganzen Spaltenbreite)
  const gap = nGaps ? Math.floor(Math.min(colW * 1.1, Math.max(colW * o.gapCells, (o.width - o.padX * 2 - totalCols * colW) / nGaps))) : 0;
  const w = totalCols * colW + nGaps * gap;
  const h = o.headH + maxRows * cell;
  const x0 = Math.floor((o.width - w) / 2), y0 = Math.floor(Math.max(o.padY, (o.height - h) / 2));
  const branches: PlacedBranch[] = [];
  let x = x0;
  for (const b of act) {
    const ns = nodes.filter((n) => n.branch === b);
    const c = cols.get(b)!;
    const pos = new Map<string, PlacedNode>();
    for (const n of ns) pos.set(n.id, { id: n.id, cx: x + n.col * colW + colW / 2, cy: y0 + o.headH + n.row * cell + cell / 2 });
    const lines: PlacedLine[] = [];
    for (const n of ns) {
      const to = pos.get(n.id)!;
      for (const r of n.requires) {
        const from = pos.get(r);
        if (from) lines.push({ from: r, to: n.id, x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy });
      }
    }
    branches.push({ branch: b, x, w: c * colW, cols: c, rows: Math.max(...ns.map((n) => n.row)) + 1, nodes: [...pos.values()], lines });
    x += c * colW + gap;
  }
  return { cell, colW, badge, branches, x: x0, y: y0, w, h };
}
