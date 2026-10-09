import { createGame, type Game, type GameOptions, type SimEvent, type TowerType, type HeroType, type Tiers } from '../src/index';

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
