/**
 * Wissensbaum-Layout (Runde 13, Runde 14 groesser): reine Geometrie, ohne DOM. Jeder Ast ist ein Raster aus `col`/`row` der
 * Knoten; die Aeste fliessen nebeneinander und brechen in eine neue Zeile um, wenn die Breite `maxW` nicht reicht
 * (5 Aeste mit 40 Knoten passen bei 1280 px nicht in eine Reihe, wenn die Knoten gross bleiben sollen). Die Hoehe waechst
 * mit, der Bildschirm scrollt senkrecht, nie waagerecht. Liefert Position jedes Knotens und die Linien fuer `requires`.
 */
export interface LNode { id: string; branch: string; col: number; row: number; requires: readonly string[] }
export interface LOpts { cellW: number; cellH: number; nodeW: number; nodeH: number; padX: number; headH: number; padBottom: number; gap: number; minW: number; /** Hoechstbreite einer Zeile (Inhaltsbreite des Bildschirms) */ maxW: number; rowGap: number }
export interface PlacedNode { id: string; x: number; y: number }
export interface PlacedBranch { branch: string; row: number; x: number; y: number; w: number; h: number; fieldW: number; fieldH: number; nodes: PlacedNode[]; lines: { from: string; to: string; x1: number; y1: number; x2: number; y2: number }[] }
export interface TreeLayout { branches: PlacedBranch[]; rows: number; width: number; height: number; /** freie Breite rechts in der letzten Zeile (fuer die Legende) */ freeRight: number }

/** Runde 14 (Max: "ein bisschen klein skaliert, kann groesser sein"): Knoten 120 x 100 statt 96 x 76, Schrift und Kosten groesser. */
export const DEFAULT_OPTS: LOpts = { cellW: 132, cellH: 124, nodeW: 120, nodeH: 108, padX: 14, headH: 54, padBottom: 14, gap: 16, minW: 200, maxW: 1208, rowGap: 22 };

export function layoutTree(nodes: readonly LNode[], order: readonly string[], o: LOpts = DEFAULT_OPTS): TreeLayout {
  const branches: PlacedBranch[] = [];
  let x = 0, y = 0, row = 0, rowH = 0, width = 0;
  for (const b of order) {
    const ns = nodes.filter((n) => n.branch === b);
    if (!ns.length) continue;
    const cols = Math.max(...ns.map((n) => n.col)) + 1;
    const rows = Math.max(...ns.map((n) => n.row)) + 1;
    const fieldW = cols * o.cellW, fieldH = rows * o.cellH;
    const w = Math.max(fieldW + o.padX * 2, o.minW), h = o.headH + fieldH + o.padBottom;
    if (x > 0 && x + w > o.maxW) { x = 0; y += rowH + o.rowGap; rowH = 0; row++; }
    // Position relativ zum Ast-Feld (links oben der Knoten)
    const pos = new Map<string, PlacedNode>();
    for (const n of ns) pos.set(n.id, { id: n.id, x: n.col * o.cellW + (o.cellW - o.nodeW) / 2, y: n.row * o.cellH + 4 });
    const lines: PlacedBranch['lines'] = [];
    for (const n of ns) {
      const to = pos.get(n.id)!;
      for (const r of n.requires) {
        const from = pos.get(r);
        if (!from) continue;
        lines.push({ from: r, to: n.id, x1: from.x + o.nodeW / 2, y1: from.y + o.nodeH, x2: to.x + o.nodeW / 2, y2: to.y });
      }
    }
    branches.push({ branch: b, row, x, y, w, h, fieldW, fieldH, nodes: [...pos.values()], lines });
    x += w + o.gap;
    rowH = Math.max(rowH, h);
    width = Math.max(width, x - o.gap);
  }
  return { branches, rows: row + 1, width, height: y + rowH, freeRight: Math.max(0, o.maxW - Math.max(0, x - o.gap)) };
}
