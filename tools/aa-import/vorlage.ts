/**
 * Werte-Vorlage fuer neue Figuren (Runde 8 / P6): die Median-Stufenkurve je Seltenheit aus `sim/data/units/aa.json`.
 *
 * Grundlage sind die voll modellierten AA-Units mit Angriff (`support: "full"`, Stufe 0 greift an). Je Seltenheit gilt die haeufigste
 * Stufenzahl (Modus); der Median je Stufe und Feld (`cost`, `damage`, `spa`, `range`) ist die Kurve. Dazu das Band P5..P95 je Stufe
 * (alle Units der Seltenheit, die diese Stufe haben): die Pruefgrenze fuer Crossover-Werte (`crossover.ts --check`).
 * Nichts davon ist frei erfunden: aendert sich `aa.json`, aendern sich die Vorlagen mit.
 */
export const FIELDS = ['cost', 'damage', 'spa', 'range'] as const;
export type Field = (typeof FIELDS)[number];
export const VORLAGE_RARITIES = ['Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'] as const;

export interface Level {
  level: number;
  cost?: number;
  damage?: number;
  spa?: number;
  range?: number;
  attack?: string;
  note?: string;
}
export interface RawUnit {
  id: string;
  name: string;
  rarity: string;
  support?: string;
  levels: Level[];
}

/** Vererbte Werte (fehlendes Feld = Vorwert) auffuellen. */
export function filled(u: RawUnit): Required<Pick<Level, Field>>[] {
  const out: Required<Pick<Level, Field>>[] = [];
  let prev = { cost: 0, damage: 0, spa: 0, range: 0 };
  for (const l of u.levels) {
    prev = { cost: l.cost ?? prev.cost, damage: l.damage ?? prev.damage, spa: l.spa ?? prev.spa, range: l.range ?? prev.range };
    out.push(prev);
  }
  return out;
}

const quantile = (v: number[], q: number): number => {
  const s = [...v].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo]! + (s[Math.min(lo + 1, s.length - 1)]! - s[lo]!) * (pos - lo);
};

export interface Vorlage {
  rarity: string;
  /** Anzahl Stufen (Modus der AA-Units dieser Seltenheit) */
  levels: number;
  samples: number;
  median: Record<Field, number>[];
  /** je Stufe und Feld: [P5, P95] ueber alle AA-Units der Seltenheit mit dieser Stufe */
  band: Record<Field, [number, number]>[];
}

export function buildVorlagen(aa: RawUnit[]): Record<string, Vorlage> {
  const out: Record<string, Vorlage> = {};
  for (const rarity of VORLAGE_RARITIES) {
    const pool = aa.filter((u) => u.rarity === rarity && u.support === 'full' && (u.levels[0]?.damage ?? 0) > 0).map((u) => filled(u));
    const count = new Map<number, number>();
    for (const p of pool) count.set(p.length, (count.get(p.length) ?? 0) + 1);
    // haeufigste Stufenzahl; bei Gleichstand die groessere
    const levels = [...count.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
    const modal = pool.filter((p) => p.length === levels);
    const median: Vorlage['median'] = [];
    const band: Vorlage['band'] = [];
    for (let i = 0; i < levels; i++) {
      const m = {} as Record<Field, number>;
      const b = {} as Record<Field, [number, number]>;
      for (const f of FIELDS) {
        m[f] = quantile(modal.map((p) => p[i]![f]), 0.5);
        const all = pool.filter((p) => p.length > i).map((p) => p[i]![f]);
        b[f] = [quantile(all, 0.05), quantile(all, 0.95)];
      }
      median.push(m);
      band.push(b);
    }
    out[rarity] = { rarity, levels, samples: modal.length, median, band };
  }
  return out;
}

/** Pruefung gegen das AA-Band; liefert Fehlermeldungen. */
export function bandErrors(units: RawUnit[], vorlagen: Record<string, Vorlage>): string[] {
  const errs: string[] = [];
  for (const u of units) {
    const v = vorlagen[u.rarity];
    if (!v) {
      errs.push(`${u.id}: Seltenheit ${u.rarity} hat keine AA-Vorlage`);
      continue;
    }
    const vals = filled(u);
    if (vals.length > v.levels + 1 || vals.length < Math.min(v.levels, 4)) errs.push(`${u.id}: ${vals.length} Stufen, AA-ueblich ${v.levels}`);
    vals.forEach((l, i) => {
      const b = v.band[Math.min(i, v.levels - 1)]!;
      for (const k of FIELDS) {
        const [lo, hi] = b[k];
        if (l[k] < lo - 1e-9 || l[k] > hi + 1e-9) errs.push(`${u.id} Stufe ${i} ${k}=${l[k]} ausserhalb AA-Band ${lo}..${hi} (${u.rarity})`);
      }
    });
  }
  return errs;
}

