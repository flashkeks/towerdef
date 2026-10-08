/**
 * Generischer Bot (Runde 8 / P1, nur Rauchtest): spielt jede Unit des Datenformats, ohne eine Unit-ID zu kennen.
 * Er arbeitet eine feste Einkaufsliste ab: erst jede Unit des Pools einmal platzieren (bester Platz nach Pfadabdeckung),
 * dann immer die Unit mit der niedrigsten Stufe ausbauen, am Ende weitere Exemplare der stärksten Unit. Reicht das Geld für den
 * nächsten Schritt nicht, wartet er (kein Überspringen). Rollen kommen aus den Daten (`def.role`, `def.farm`), nie aus der ID.
 */
import type { LevelStat, UnitDef } from '../data/compile.js';
import type { Sim } from '../sim.js';
import type { Bot, BotContext } from './types.js';
import { nextInt } from '../prng.js';

/** Grobe Stärke einer Stufe (Schaden je Sekunde x Flächenbonus), nur für die Bot-Entscheidungen. */
export function levelScore(lv: LevelStat): number {
  if (!lv.attack) return 0;
  const aoe = lv.attack.kind === 'single' ? 1 : 2;
  return Math.floor(((lv.damageCenti * 20) / lv.spaTicks) * aoe);
}

/** Grobe Stärke einer Unit (letzte Stufe), nur zur Auswahl der "stärksten" Unit. */
export const dpsScore = (def: UnitDef): number => levelScore(def.levels[def.levels.length - 1]);

/** Bester freier Platz für `def`: größte Pfadabdeckung im Reichweitenkreis der Stufe 0; null, wenn nichts passt. */
export function bestSpot(sim: Sim, player: number, def: UnitDef): { x: number; y: number } | null {
  const range = def.levels[0].rangeMilli;
  let best: { x: number; y: number } | null = null;
  let bestCov = -1;
  for (const p of sim.placementGrid(def.id)) {
    if (sim.canPlace(player, def.id, p.x, p.y) === 'overlap') continue;
    const cov = def.farm ? -sim.coverage(p.x, p.y, 1500) : sim.coverage(p.x, p.y, range);
    if (cov > bestCov) {
      bestCov = cov;
      best = p;
    }
  }
  return best;
}

export function auto(poolIds: readonly string[] | null, pickCount = 4): Bot {
  let pool: UnitDef[] | null = null;
  const choose = (ctx: BotContext): UnitDef[] => {
    const cat = ctx.sim.catalog();
    if (poolIds && poolIds.length > 0) {
      return poolIds.map((id) => {
        const d = cat.find((u) => u.id === id);
        if (!d) throw new Error(`Bot: unbekannte Unit ${id}`);
        return d;
      });
    }
    // Ohne Liste: zufällige Angreifer (eigener Bot-PRNG), höchstens `pickCount`, keine Farm.
    // Nur Units, die der Bot am Anfang bezahlen kann (sonst wartet er ewig mit leerem Feld; Runde 8 / P6: bei 575 statt 550 Units traf es Seed 3).
    const coins = ctx.sim.state.players[ctx.playerId].coins;
    const all = cat.filter((u) => u.levels[0].attack && !u.farm);
    const affordable = all.filter((u) => ctx.sim.placeCost(ctx.playerId, u.id) <= coins);
    const fighters = affordable.length > 0 ? affordable : all;
    const out: UnitDef[] = [];
    while (out.length < Math.min(pickCount, fighters.length)) {
      const d = fighters[nextInt(ctx.rng, fighters.length)];
      if (!out.includes(d)) out.push(d);
    }
    return out;
  };
  return {
    name: poolIds ? `auto:${poolIds.join(',')}` : 'auto',
    decide(ctx) {
      const { sim, playerId } = ctx;
      pool ??= choose(ctx);
      const st = sim.state;
      const cat = pool;
      // Grobe Gier: je Schritt die Option mit dem größten Schadenszuwachs je Münze (Platzieren oder Ausbauen); reicht das Geld nicht,
      // wird gespart. Farm-Units zählen nie als Schadenszuwachs (nur wenn der Pool sonst nichts hat).
      for (let guard = 0; guard < 30; guard++) {
        const mine = st.units.filter((u) => u.owner === playerId);
        const coins = st.players[playerId].coins;
        type Option = { ratio: number; cost: number; run: () => boolean };
        const options: Option[] = [];
        const fighters = cat.filter((d) => !d.farm && d.levels[0].attack);
        for (const d of fighters) {
          const cost = sim.placeCost(playerId, d.id);
          options.push({
            ratio: levelScore(d.levels[0]) / cost,
            cost,
            run: () => {
              const spot = bestSpot(sim, playerId, d);
              return spot !== null && sim.apply(playerId, { type: 'place', unitId: d.id, ...spot }).ok;
            },
          });
        }
        for (const u of mine) {
          const cost = sim.upgradeCost(u.id);
          if (cost === null) continue;
          const d = sim.catalog().find((x) => x.id === u.defId) as UnitDef;
          const gain = d.farm ? 0 : levelScore(d.levels[u.level + 1]) - levelScore(d.levels[u.level]);
          options.push({ ratio: gain / cost, cost, run: () => sim.apply(playerId, { type: 'upgrade', entityId: u.id }).ok });
        }
        if (fighters.length === 0) {
          // nur Farm-Units im Pool: jede einmal setzen, dann ausbauen
          for (const d of cat) {
            if (mine.some((u) => u.defId === d.id)) continue;
            const cost = sim.placeCost(playerId, d.id);
            options.push({ ratio: 1, cost, run: () => { const spot = bestSpot(sim, playerId, d); return spot !== null && sim.apply(playerId, { type: 'place', unitId: d.id, ...spot }).ok; } });
          }
        }
        if (options.length === 0) return;
        const best = options.reduce((x, y) => (y.ratio > x.ratio ? y : x));
        if (coins < best.cost || !best.run()) return;
      }
    },
  };
}
