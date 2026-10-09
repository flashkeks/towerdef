/**
 * Wissensbaum-Layout (Runde 13): reine Geometrie, ohne DOM. Fuenf Aeste als Spalten nebeneinander; jeder Ast ist ein Raster
 * aus `col`/`row` der Knoten. Liefert Position jedes Knotens und die Linien fuer `requires` (nur innerhalb eines Asts).
 */
export interface LNode { id: string; branch: string; col: number; row: number; requires: readonly string[] }
export interface LOpts { cellW: number; cellH: number; nodeW: number; nodeH: number; padX: number; headH: number; padBottom: number; gap: number; minW: number }
export interface PlacedNode { id: string; x: number; y: number }
export interface PlacedBranch { branch: string; x: number; w: number; h: number; fieldW: number; fieldH: number; nodes: PlacedNode[]; lines: { from: string; to: string; x1: number; y1: number; x2: number; y2: number }[] }
export interface TreeLayout { branches: PlacedBranch[]; width: number; height: number }

export const DEFAULT_OPTS: LOpts = { cellW: 108, cellH: 88, nodeW: 96, nodeH: 76, padX: 12, headH: 40, padBottom: 12, gap: 14, minW: 156 };

export function layoutTree(nodes: readonly LNode[], order: readonly string[], o: LOpts = DEFAULT_OPTS): TreeLayout {
  const branches: PlacedBranch[] = [];
  let x = 0;
  let height = 0;
  for (const b of order) {
    const ns = nodes.filter((n) => n.branch === b);
    if (!ns.length) continue;
    const cols = Math.max(...ns.map((n) => n.col)) + 1;
    const rows = Math.max(...ns.map((n) => n.row)) + 1;
    const fieldW = cols * o.cellW, fieldH = rows * o.cellH;
    const w = Math.max(fieldW + o.padX * 2, o.minW), h = o.headH + fieldH + o.padBottom;
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
    branches.push({ branch: b, x, w, h, fieldW, fieldH, nodes: [...pos.values()], lines });
    x += w + o.gap;
    height = Math.max(height, h);
  }
  return { branches, width: Math.max(0, x - o.gap), height };
}
