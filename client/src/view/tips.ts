/**
 * Tipps nach einer Niederlage (Runde 6, P4). Reine Funktion: aus der Wellenstatistik des Recorders (Leaks nach Typ,
 * Muenzen), den Befehlen (Kaeufe, Upgrades, Faehigkeiten) und den Team-Daten werden regelbasiert genau drei Tipps.
 * Kein Zufall: gleiche Eingabe, gleiche Tipps. Texte nur ueber `t()` (en.ts).
 */
import { t } from '../i18n/t';
import type { UnitDef } from '../sim';
import { enemyName } from './model';
import { airCapable, bossHelpers, COIN_NUDGE_FACTOR, joinOr } from './readability';
import { unitName } from '../ui/meta-model';

export interface TipWave {
  wave: number;
  leaks: number;
  leaksByEnemy: Record<string, number>;
}

export interface TipInput {
  result: 'win' | 'loss' | null;
  endWave: number;
  endCoins: number;
  waves: readonly TipWave[];
  /** angewendete oder abgelehnte Befehle (Recorder); gezaehlt werden nur `ok` */
  commands: readonly { cmd: { type: string; unitId?: string }; ok: boolean }[];
  /** Units des gewaehlten Teams (Katalog-Reihenfolge) */
  team: readonly UnitDef[];
  /** Wellen mit Boss (aus `previewWave(n).boss`) */
  bossWaves: readonly number[];
}

export interface Tip {
  /** Regel, die den Tipp ausgeloest hat (fuer Tests) */
  id: string;
  text: string;
}

export const TIP_COUNT = 3;
const AIR_LEAK_MIN = 2;
const SWARM_LEAK_MIN = 4;

const names = (defs: readonly UnitDef[]): string => joinOr(defs.slice(0, 3).map((d) => unitName(d.id)), t('tips.or'));
const isArea = (d: UnitDef): boolean => d.levels.some((l) => l.attack !== null && l.attack.kind !== 'single');

/** Welle mit den meisten Leaks eines Typs (kleinste Wellennummer bei Gleichstand). */
function worst(waves: readonly TipWave[], pick: (w: TipWave) => number): { wave: number; n: number } | null {
  let best: { wave: number; n: number } | null = null;
  for (const w of waves) {
    const n = pick(w);
    if (n > 0 && (!best || n > best.n)) best = { wave: w.wave, n };
  }
  return best;
}

export function defeatTips(input: TipInput): Tip[] {
  if (input.result === 'win') return [];
  const out: Tip[] = [];
  const ok = input.commands.filter((c) => c.ok);
  const placedBy = new Map<string, number>();
  for (const c of ok) if (c.cmd.type === 'place' && c.cmd.unitId) placedBy.set(c.cmd.unitId, (placedBy.get(c.cmd.unitId) ?? 0) + 1);
  const placed = [...placedBy.values()].reduce((a, b) => a + b, 0);
  const upgrades = ok.filter((c) => c.cmd.type === 'upgrade').length;
  const air = airCapable(input.team);
  const area = input.team.filter(isArea);
  const cheapest = input.team.reduce((m, d) => Math.min(m, d.placeCost), Infinity);
  const helpers = bossHelpers(input.team);

  // 1) Flieger-Leaks: die haeufigste Ursache im ersten Playtest
  const flyer = worst(input.waves, (w) => w.leaksByEnemy.flyer ?? 0);
  if (flyer && flyer.n >= AIR_LEAK_MIN && air.length > 0) {
    const never = !air.some((d) => placedBy.has(d.id));
    out.push({
      id: never ? 'air-never' : 'air-leak',
      text: never ? t('tips.air.never', { n: flyer.n, wave: flyer.wave, list: names(air) }) : t('tips.air.leak', { n: flyer.n, wave: flyer.wave, list: names(air) }),
    });
  }

  // 2) Boss durchgekommen / Niederlage in einer Boss-Welle
  const bossLeak = input.waves.find((w) => (w.leaksByEnemy.boss ?? 0) > 0);
  if (bossLeak || input.bossWaves.includes(input.endWave)) {
    const wave = bossLeak?.wave ?? input.endWave;
    if (helpers.stun.length > 0 || helpers.nuke.length > 0) {
      out.push({
        id: 'boss',
        text: t('tips.boss', { wave, list: names([...helpers.stun, ...helpers.nuke]) }),
      });
    }
  }

  // 3) Muenzen am Ende
  if (Number.isFinite(cheapest) && input.endCoins > COIN_NUDGE_FACTOR * cheapest) out.push({ id: 'coins', text: t('tips.coins', { n: input.endCoins }) });

  // 4) Teuerste Team-Unit nie gesetzt (z. B. Titan)
  const unplaced = input.team.filter((d) => !placedBy.has(d.id)).sort((a, b) => b.placeCost - a.placeCost)[0];
  if (unplaced) out.push({ id: 'unplaced', text: t('tips.unplaced', { name: unitName(unplaced.id), cost: unplaced.placeCost }) });

  // 5) Grosse Pulks anderer Typen: Flaechenschaden
  let swarm: { type: string; wave: number; n: number } | null = null;
  for (const w of input.waves) {
    for (const [type, n] of Object.entries(w.leaksByEnemy)) {
      if (type === 'flyer' || type === 'boss' || n < SWARM_LEAK_MIN) continue;
      if (!swarm || n > swarm.n) swarm = { type, wave: w.wave, n };
    }
  }
  if (swarm && area.length > 0) out.push({ id: 'swarm', text: t('tips.swarm', { n: swarm.n, name: enemyName(swarm.type), wave: swarm.wave, list: names(area) }) });

  // 7) Kaum Upgrades
  if (placed >= 3 && upgrades * 2 < placed) out.push({ id: 'upgrades', text: t('tips.upgrades', { n: upgrades, m: placed }) });

  // feste Reihenfolge der Regeln = Prioritaet; Rest mit festen Tipps auffuellen
  const fallback = ['tips.fallback.preview', 'tips.fallback.pause', 'tips.fallback.shift'];
  const picked = out.slice(0, TIP_COUNT);
  for (const key of fallback) {
    if (picked.length >= TIP_COUNT) break;
    picked.push({ id: key, text: t(key) });
  }
  return picked;
}
