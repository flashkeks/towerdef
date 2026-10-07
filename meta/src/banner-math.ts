/**
 * Exakte Wahrscheinlichkeiten und Erwartungswerte zu einer Banner-Datei (P3). Liest dieselbe `resolveBanner()`-Struktur wie der Wurf.
 * Wird von der Anzeige (`bannerView`) und von den Tests genutzt (Mio.-Wurf gegen diese Zahlen). Gleitkomma ist hier nur Anzeige/Pruefung, nie Teil des Wurfs.
 *
 * Pity-Modell: Zustand (a, b) = (sinceTop, sinceMid). Zug-Verteilung = natuerliche Stufe, nach unten auf die erzwungene Stufe angehoben,
 * wenn a+1 >= hardAt(top) bzw. b+1 >= hardAt(mid) (top vor mid). Langzeit-Verteilung per Potenziteration der Markov-Kette.
 */
import type { Pity } from './profile';
import type { ResolvedBanner } from './gacha';

export interface Analysis {
  /** Langzeit-Anteil je Stufe (Index wie `ResolvedBanner.tiers`), pro Zug, inklusive Pity/Garantie */
  tierRate: number[];
  /** nur bei `batchGuarantee`: Wahrscheinlichkeit, dass der 10. Zug angehoben werden musste */
  upgradeChance: number | null;
}

const cache = new WeakMap<ResolvedBanner, Analysis>();

/** Natuerliche Stufenwahrscheinlichkeiten (vor Pity). */
export const naturalProbs = (r: ResolvedBanner): number[] => r.tiers.map((t) => t.effBp / 10000);

const sumFrom = (xs: number[], from: number): number => xs.slice(from).reduce((s, x) => s + x, 0);

/** Verteilung des naechsten Zuges im Zustand (a, b), ohne Block-Garantie. */
export function nextPullDist(r: ResolvedBanner, pity: Pick<Pity, 'sinceTop' | 'sinceMid'>): number[] {
  const nat = naturalProbs(r);
  const out = nat.slice();
  const forced = (idx: number): void => {
    let m = 0;
    for (let i = 0; i < idx; i++) {
      m += out[i]!;
      out[i] = 0;
    }
    out[idx]! += m;
  };
  if (r.top && pity.sinceTop + 1 >= r.top.hardAt) forced(r.top.idx);
  else if (r.mid && pity.sinceMid + 1 >= r.mid.hardAt) forced(r.mid.idx);
  return out;
}

function markov(r: ResolvedBanner): number[] {
  const n = r.tiers.length;
  const A = r.top ? r.top.hardAt : 1;
  const B = r.mid ? r.mid.hardAt : 1;
  const S = A * B;
  const dist: Float64Array[] = [];
  const nextState: Int32Array[] = [];
  for (let a = 0; a < A; a++) {
    for (let b = 0; b < B; b++) {
      const d = nextPullDist(r, { sinceTop: a, sinceMid: b });
      dist.push(Float64Array.from(d));
      const ns = new Int32Array(n);
      for (let i = 0; i < n; i++) {
        const na = r.top && i < r.top.idx ? Math.min(a + 1, A - 1) : 0;
        const nb = r.mid && i < r.mid.idx ? Math.min(b + 1, B - 1) : 0;
        ns[i] = na * B + nb;
      }
      nextState.push(ns);
    }
  }
  let pi = new Float64Array(S).fill(1 / S);
  let nx = new Float64Array(S);
  for (let iter = 0; iter < 200000; iter++) {
    nx.fill(0);
    for (let s = 0; s < S; s++) {
      const ps = pi[s]!;
      if (ps === 0) continue;
      const d = dist[s]!;
      const ns = nextState[s]!;
      for (let i = 0; i < n; i++) if (d[i]! > 0) nx[ns[i]!]! += ps * d[i]!;
    }
    let diff = 0;
    for (let s = 0; s < S; s++) diff += Math.abs(nx[s]! - pi[s]!);
    [pi, nx] = [nx, pi];
    if (diff < 1e-15) break;
  }
  const rate = new Array<number>(n).fill(0);
  for (let s = 0; s < S; s++) for (let i = 0; i < n; i++) rate[i]! += pi[s]! * dist[s]![i]!;
  return rate;
}

/** Block mit Garantie (Starter): mittlerer Anteil je Stufe ueber die Positionen des Blocks, exakt. */
function batchRates(r: ResolvedBanner, count: number): { rate: number[]; upgrade: number } {
  const nat = naturalProbs(r);
  const g = r.batch!.idx;
  const pBelow = nat.slice(0, g).reduce((s, x) => s + x, 0);
  const pAllBelow = Math.pow(pBelow, count - 1);
  const last = nat.slice();
  let moved = 0;
  for (let i = 0; i < g; i++) {
    moved += last[i]! * pAllBelow;
    last[i] = last[i]! * (1 - pAllBelow);
  }
  last[g]! += moved;
  const rate = nat.map((x, i) => (x * (count - 1) + last[i]!) / count);
  return { rate, upgrade: pAllBelow * pBelow };
}

export function analyze(r: ResolvedBanner): Analysis {
  const hit = cache.get(r);
  if (hit) return hit;
  let a: Analysis;
  if (r.batch) {
    const { rate, upgrade } = batchRates(r, 10);
    a = { tierRate: rate, upgradeChance: upgrade };
  } else if (r.top || r.mid) a = { tierRate: markov(r), upgradeChance: null };
  else a = { tierRate: naturalProbs(r), upgradeChance: null };
  cache.set(r, a);
  return a;
}

/** Erwartete Zuege bis zum naechsten Treffer der Stufe >= `idx` (Regel `top` oder `mid`), ab dem Zaehlerstand. `null` ohne Regel. */
export function expectedPullsToHit(r: ResolvedBanner, which: 'top' | 'mid', pity: Pick<Pity, 'sinceTop' | 'sinceMid'>): number | null {
  const rule = which === 'top' ? r.top : r.mid;
  if (!rule) return null;
  const nat = naturalProbs(r);
  const pNat = sumFrom(nat, rule.idx);
  let a = Math.min(pity.sinceTop, (r.top?.hardAt ?? 1) - 1);
  let b = Math.min(pity.sinceMid, (r.mid?.hardAt ?? 1) - 1);
  let surv = 1;
  let e = 0;
  for (let guard = 0; guard < 1_000_000 && surv > 1e-15; guard++) {
    e += surv; // dieser Zug findet statt
    const forcedTop = !!r.top && a + 1 >= r.top.hardAt;
    const forcedMid = !!r.mid && b + 1 >= r.mid.hardAt;
    const q = which === 'top' ? (forcedTop ? 1 : pNat) : forcedTop || forcedMid ? 1 : pNat;
    surv *= 1 - q;
    a++;
    b++;
  }
  return e;
}
