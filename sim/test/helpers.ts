import { createGame, DATA, STAT_DEFAULTS, applyMod, pathOrder, type Game, type GameOptions, type Mod, type SimEvent, type Stats, type TowerType, type HeroType, type Tiers } from '../src/index';

export function newGame(over: Partial<GameOptions> = {}): Game {
  return createGame({ map: 'bare', difficulty: 'medium', seed: 1, mods: { startCash: 100000 }, ...over });
}

/** Ein Turm neben dem ersten Wegstück ((-16,92) -> (120,92)), Mitte x=60 px. */
export function place(g: Game, type: TowerType | HeroType, x = 60, y = 122): number {
  const r = g.apply({ type: 'place', tower: type, x: x * 1000, y: y * 1000 });
  if (!r.ok) throw new Error(`place failed: ${r.reason}`);
  return r.id!;
}

export function buy(g: Game, id: number, tiers: Tiers): void {
  for (let p = 0; p < 3; p++) {
    for (let i = 0; i < tiers[p]; i++) {
      const r = g.apply({ type: 'upgrade', towerId: id, path: p as 0 | 1 | 2 });
      if (!r.ok) throw new Error(`upgrade ${p} failed: ${r.reason}`);
    }
  }
}

/** Läuft bis `until` wahr oder `max` Ticks; sammelt alle Events. */
export function run(g: Game, max: number, until?: () => boolean): SimEvent[] {
  const all: SimEvent[] = [];
  for (let i = 0; i < max; i++) {
    g.step();
    all.push(...g.drainEvents());
    if (until && until()) break;
  }
  return all;
}

export const px = (n: number): number => n * 1000;

/** Startet die nächste Runde und tötet alles, sobald es auftaucht (schnell, ohne Türme). Liefert die Events. */
export function clearRound(g: Game, max = 60 * 600): SimEvent[] {
  const all: SimEvent[] = [];
  const r0 = g.state.roundsCleared;
  const r = g.apply({ type: 'startRound' });
  if (!r.ok) throw new Error(`startRound failed: ${r.reason}`);
  for (let i = 0; i < max && g.state.roundsCleared === r0 && g.state.phase !== 'lost'; i++) {
    g.step();
    for (const e of g.state.enemies.slice()) while (g.state.enemies.some((x) => x.id === e.id)) g.sandbox.hurt(e.id, 1_000_000);
    all.push(...g.drainEvents());
  }
  return all;
}

/** Kennwerte eines Turms ohne Wissensbaum (Basis + Pfade in Reihenfolge Nebenpfad, Hauptpfad), für Zahlenprüfungen. */
export function statsOf(type: TowerType, tiers: Tiers): Stats {
  const d = DATA.towers[type];
  const st: Stats = { ...STAT_DEFAULTS, ...(d.base as Partial<Stats>) };
  for (const p of pathOrder(tiers)) for (let k = 1; k <= tiers[p]; k++) for (const m of d.paths[p].tiers[k - 1].mods) applyMod(st, m as Mod);
  return st;
}
