/**
 * Bot für den Balance-Rauchtest (P5): spielt eine Strategie deterministisch durch.
 *
 * Strategie = Liste von Türmen mit Ziel-Pfaden (z. B. ranger 0-2-4) + optional Held.
 * Kaufreihenfolge: erst alle Türme platzieren (in Listenreihenfolge), dann Upgrades stufenweise
 * (erst alle Stufe-1-Käufe, dann Stufe 2 ... bis 5; je Turm zuerst der Pfad mit der höchsten Zielstufe).
 * Der Held wird nach den Upgrades bis `heroAfter` (Standard 1) platziert. Gekauft wird strikt in dieser Reihenfolge,
 * sobald das Geld reicht. Plätze: viel Wegabdeckung in Reichweite. Fähigkeiten bei Bereitschaft und Bedarf.
 */
import { DATA } from './data.js';
import { GLOBAL_RANGE, createGame } from './game.js';
import { getMap } from './map.js';
import type { Difficulty, Game, GameOptions, HeroType, TargetMode, Tiers, TowerType } from './types.js';

export interface TowerPlan {
  type: TowerType;
  /** Ziel-Stufen [A, B, C]. */
  tiers: Tiers;
  target?: TargetMode;
}

export interface Strategy {
  name: string;
  towers: TowerPlan[];
  hero?: boolean;
  /** Held nach allen Upgrades bis zu dieser Stufe kaufen (0 = direkt nach den Türmen). Standard 1. */
  heroAfter?: number;
  /** Nächste Runde erst starten, wenn höchstens so viele Gegner auf dem Feld sind (Standard 0: erst wenn das Feld leer ist). */
  maxField?: number;
  /**
   * Explizite Kaufreihenfolge statt der automatischen (Leerzeichen/Komma getrennt):
   * `p0` Turm 0 platzieren, `u0C` Turm 0 Pfad C um eine Stufe, `h` Held. Beispiel: "p0 p0 p1 u0B u0B h u1A".
   * Tokens nennen den Index in `towers`; ein Turm wird nur einmal platziert, Wiederholungen von `pN` werden ignoriert.
   */
  script?: string;
}

type Step =
  | { kind: 'place'; plan: number }
  | { kind: 'hero' }
  | { kind: 'upgrade'; plan: number; path: 0 | 1 | 2 };

export interface BotResult {
  strategy: string;
  difficulty: Difficulty;
  result: 'won' | 'lost' | 'timeout';
  /** Runde 15b: Endrunde, bei der der Sieg fiel (0 = nicht gewonnen); nur mit `freeplay` gesetzt. */
  wonAt: number;
  round: number;
  lives: number;
  cash: number;
  ticks: number;
  pops: Record<TowerType | HeroType, number>;
  spent: Record<string, number>;
  leaked: number;
  heroLevel: number;
  /** Im Match verdiente Turm-XP je Typ (nur mit `towerXp` in den Optionen, sonst 0). */
  towerXpGained: Record<TowerType, number>;
  /** Market-Einkommen (Runde 13) inklusive Zinsen, ohne Grant/Supply Drop. */
  income: number;
  /** Gold aus Grant und Supply Drop. */
  abilityCash: number;
  /** Runde 14: Gold aus Thornweaver-Rundenerträgen, Leben aus Jungle's Bounty/Field Medic, Gold aus Lead to Gold. */
  groveGold: number;
  healed: number;
  bountyGold: number;
  hash: string;
}

function scriptSteps(script: string): Step[] {
  const steps: Step[] = [];
  for (const tok of script.split(/[\s,]+/).filter(Boolean)) {
    let m: RegExpExecArray | null;
    if (tok === 'h') steps.push({ kind: 'hero' });
    else if ((m = /^p(\d+)$/.exec(tok))) steps.push({ kind: 'place', plan: Number(m[1]) });
    else if ((m = /^u(\d+)([ABC])$/.exec(tok))) steps.push({ kind: 'upgrade', plan: Number(m[1]), path: ('ABC'.indexOf(m[2]) as 0 | 1 | 2) });
    else throw new Error(`Skript-Token nicht lesbar: ${tok}`);
  }
  return steps;
}

export function buildSteps(s: Strategy): Step[] {
  if (s.script) return scriptSteps(s.script);
  const steps: Step[] = [];
  s.towers.forEach((_, i) => steps.push({ kind: 'place', plan: i }));
  const heroAfter = s.heroAfter ?? 1;
  const heroAt = (l: number): void => {
    if (s.hero && heroAfter === l) steps.push({ kind: 'hero' });
  };
  heroAt(0);
  for (let lvl = 1; lvl <= 5; lvl++) {
    s.towers.forEach((p, i) => {
      const order = ([0, 1, 2] as const).filter((k) => p.tiers[k] >= lvl).sort((a, b) => p.tiers[b] - p.tiers[a] || a - b);
      for (const k of order) steps.push({ kind: 'upgrade', plan: i, path: k });
    });
    heroAt(lvl);
  }
  if (s.hero && heroAfter > 5) steps.push({ kind: 'hero' });
  return steps;
}

export interface Bot {
  /** Einmal pro Denkschritt aufrufen (z. B. alle 6 Ticks). */
  think(): void;
  readonly done: boolean;
  /** Index des naechsten Kaufschritts (fuer Diagnose). */
  readonly nextIndex: number;
}

export function createBot(game: Game, mapId: string, strategy: Strategy): Bot {
  const map = getMap(mapId);
  const steps = buildSteps(strategy);
  const ids: number[] = [];
  let next = 0;
  const S = game.state;

  // Grobe Wegstichprobe (alle 500 Milli-px) für die Platzwahl; "covered" = von schon gesetzten Türmen abgedeckt.
  const coarse = map.paths.flatMap((p) => p.samples.filter((_, i) => i % 5 === 0));
  const covered = new Uint8Array(coarse.length);

  function bestSpot(type: TowerType | HeroType): { x: number; y: number } | null {
    const def = type === 'wren' ? DATA.hero.wren : DATA.towers[type];
    const baseRange = (def.base.range as number | undefined) ?? 60000;
    // Longshot (ganze Karte) und Market (kein Angriff) sollen gute Wegplätze nicht belegen: abseits des Wegs, der Market
    // mit Aura-Pfad C mitten zwischen den Türmen.
    const support = baseRange >= GLOBAL_RANGE || type === 'market';
    const auraMarket = type === 'market' && strategy.towers.some((p) => p.type === 'market' && p.tiers[2] > 0);
    const range = Math.floor((baseRange * 12) / 10);
    const r2 = range * range;
    let best: { x: number; y: number } | null = null;
    let bestScore = -Infinity;
    for (let y = 14000; y <= 350000; y += 12000) {
      for (let x = 14000; x <= 600000; x += 12000) {
        const c = game.canPlace(type, x, y);
        if (!c.ok && c.reason !== 'no-cash') continue;
        let score = 0;
        if (support) {
          // weit weg vom Weg (dicht am Weg liegt der Platz für Angreifer); Aura-Market: möglichst viele Türme im Radius
          let near = 0;
          for (let i = 0; i < coarse.length; i++) {
            const dx = coarse[i].x - x, dy = coarse[i].y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 <= (auraMarket ? 80000 * 80000 : 46000 * 46000)) near++;
          }
          score = auraMarket ? near : -near;
          if (auraMarket) for (const t of S.towers) if (t.type !== 'market' && (t.x - x) ** 2 + (t.y - y) ** 2 <= 80000 * 80000) score += 1000;
          if (score > bestScore) { bestScore = score; best = { x, y }; }
          continue;
        }
        for (let i = 0; i < coarse.length; i++) {
          const dx = coarse[i].x - x, dy = coarse[i].y - y;
          if (dx * dx + dy * dy <= r2) score += covered[i] ? 0.35 : 1;
        }
        if (score > bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }
    }
    if (best && !support) {
      for (let i = 0; i < coarse.length; i++) {
        const dx = coarse[i].x - best.x, dy = coarse[i].y - best.y;
        if (dx * dx + dy * dy <= r2) covered[i] = 1;
      }
    }
    return best;
  }

  /** Bank-Inhalte abheben, wenn der nächste Kauf sonst nicht klappt, mit Bank aber schon (sonst bleibt das Geld verzinst liegen). */
  function fund(price: number): boolean {
    if (S.cash >= price) return true;
    const banks = S.towers.filter((t) => t.type === 'market' && t.bank > 0);
    if (S.cash + banks.reduce((a, t) => a + t.bank, 0) < price) return false;
    for (const t of banks) {
      game.apply({ type: 'withdraw', towerId: t.id });
      if (S.cash >= price) break;
    }
    return S.cash >= price;
  }

  function buy(): void {
    while (next < steps.length) {
      const st = steps[next];
      if (st.kind === 'place' || st.kind === 'hero') {
        const type: TowerType | HeroType = st.kind === 'hero' ? 'wren' : strategy.towers[st.plan].type;
        if (!fund(game.priceOf(type))) return;
        const spot = bestSpot(type);
        if (!spot) {
          next++;
          continue;
        }
        const r = game.apply({ type: 'place', tower: type, x: spot.x, y: spot.y });
        if (!r.ok) return;
        if (st.kind === 'place') {
          ids[st.plan] = r.id!;
          const tg = strategy.towers[st.plan].target;
          if (tg) game.apply({ type: 'target', towerId: r.id!, mode: tg });
        }
        next++;
      } else {
        const id = ids[st.plan];
        if (id === undefined || !S.towers.some((t) => t.id === id)) {
          next++;
          continue;
        }
        const info = game.upgradeInfo(id)[st.path];
        if (info.reason === 'maxed' || info.reason === 'crosspath' || info.reason === 'locked') {
          next++;
          continue;
        }
        if (!info.canBuy) {
          if (info.reason === 'no-cash' && fund(info.price)) {
            game.apply({ type: 'upgrade', towerId: id, path: st.path });
            next++;
            continue;
          }
          return;
        }
        game.apply({ type: 'upgrade', towerId: id, path: st.path });
        next++;
      }
    }
  }

  function abilities(): void {
    // Geld-Fähigkeiten (Grant, Supply Drop) sofort einsetzen: Gold früher ist Gold wert, es gibt nichts zu sparen
    for (const a of S.abilities) if (a.ready && (a.id === 'grant' || a.id === 'supplyDrop')) game.apply({ type: 'ability', ability: a.id });
    if (S.enemies.length === 0) return;
    let boss = false;
    let hidden = false;
    for (const e of S.enemies) {
      if (e.type === 'leviathan' || e.type === 'wyrm' || e.type === 'colossus') boss = true;
      if (e.camo && !e.revealed) hidden = true;
    }
    const n = S.enemies.length;
    for (const a of S.abilities) {
      if (!a.ready) continue;
      let use = false;
      switch (a.id) {
        case 'arrowRain': use = n >= 8 || boss; break;
        case 'absoluteZero': use = n >= 20 || boss; break;
        case 'flare': use = n >= 6 || hidden; break;
        case 'dawnbreak': use = n >= 25 || boss; break;
        case 'focus': use = n >= 6 || boss; break;
        case 'supplyDrop': use = true; break;
        case 'grant': use = true; break;
        case 'wallOfTrees': use = n >= 10 || boss; break;
        case 'tonic': use = n >= 15 || boss; break;
      }
      if (use) game.apply({ type: 'ability', ability: a.id });
    }
  }

  return {
    get done() {
      return S.phase === 'won' || S.phase === 'lost';
    },
    get nextIndex() {
      return next;
    },
    think() {
      buy();
      abilities();
      if (S.groups.length === 0 && (S.freeplay || S.round < game.info.maxRound) && S.enemies.length <= (strategy.maxField ?? 0)) game.apply({ type: 'startRound' });
    },
  };
}

export function runBot(strategy: Strategy, opts: Partial<GameOptions> & { difficulty: Difficulty; maxTicks?: number; /** Runde 15b: nach dem Sieg mit `continue` weiterspielen bis zum Tod (Ergebnis: `wonAt` = Endrunde, `round` = letzte erreichte Runde). */ freeplay?: boolean }): BotResult {
  const mapId = opts.map ?? 'meadow';
  const game = createGame({ map: mapId, seed: 1, ...opts });
  const bot = createBot(game, mapId, strategy);
  const max = opts.maxTicks ?? 60 * 60 * 150;
  const S = game.state;
  let wonAt = 0;
  while ((!bot.done || (opts.freeplay && S.phase === 'won')) && S.tick < max) {
    if (S.phase === 'won') {
      wonAt = S.round;
      game.apply({ type: 'continue' });
    }
    bot.think();
    game.step(6);
    game.drainEvents();
  }
  const hero = S.towers.find((t) => t.type === 'wren');
  return {
    strategy: strategy.name,
    difficulty: opts.difficulty,
    result: S.phase === 'won' || wonAt > 0 ? 'won' : S.phase === 'lost' ? 'lost' : 'timeout',
    wonAt,
    round: S.round,
    lives: S.lives,
    cash: S.cash,
    ticks: S.tick,
    pops: { ...S.stats.pops },
    spent: { ...S.stats.spent },
    leaked: S.stats.leaked,
    heroLevel: hero?.heroLevel ?? 0,
    towerXpGained: { ...S.towerXpGained },
    income: S.stats.income,
    abilityCash: S.stats.abilityCash,
    groveGold: S.stats.groveGold,
    healed: S.stats.healed,
    bountyGold: S.stats.bountyGold,
    hash: game.hash(),
  };
}

/** "ranger 0-2-4 + bombardier 3-2-0 + hero" -> Strategy. Zusatz "@strong" setzt das Targeting. */
export function parseStrategy(text: string): Strategy {
  const towers: TowerPlan[] = [];
  let hero = false;
  for (const part of text.split('+').map((s) => s.trim()).filter(Boolean)) {
    if (part === 'hero' || part === 'wren') {
      hero = true;
      continue;
    }
    const m = /^(ranger|bombardier|frostcaller|longshot|market|thornweaver|alchemist)\s+(\d)-(\d)-(\d)(?:@(first|last|strong|close))?$/.exec(part);
    if (!m) throw new Error(`Strategie nicht lesbar: "${part}"`);
    towers.push({ type: m[1] as TowerType, tiers: [Number(m[2]), Number(m[3]), Number(m[4])], target: m[5] as TargetMode | undefined });
  }
  return { name: text, towers, hero };
}

/**
 * Kaufreihenfolge "gestaffelt" (so spielt ein Mensch eher): zwei Tuerme + Held zuerst, dann stufenweise upgraden,
 * weitere Tuerme paarweise nach Stufe 1/2/3 dazu; ab Stufe 4 sind alle platziert. Jeder Pfad wird genau bis zum Ziel gekauft.
 * Der Standard-Bot kauft sonst erst alle Tuerme und dann alle Stufe 1 usw. (Runde 15b, Bot-Matrix.) `delay` verschiebt das Nachsetzen der weiteren Tuerme um so viele Stufen.
 */
export function staged(st: Strategy, delay = 0): Strategy {
  const n = st.towers.length;
  const toks: string[] = ['p0'];
  if (n > 1) toks.push('p1');
  if (st.hero) toks.push('h');
  let placed = Math.min(2, n);
  const bought = st.towers.map(() => [0, 0, 0]);
  for (let lvl = 1; lvl <= 5; lvl++) {
    for (let i = 0; i < placed; i++) {
      const order = [0, 1, 2].filter((k) => st.towers[i].tiers[k] >= lvl).sort((a, b) => st.towers[i].tiers[b] - st.towers[i].tiers[a] || a - b);
      for (const k of order) {
        while (bought[i][k] < lvl) { toks.push(`u${i}${'ABC'[k]}`); bought[i][k]++; }
      }
    }
    // delay > 0: weitere Tuerme erst nach Stufe 1 + delay (Hard: erst die ersten Tuerme ausbauen)
    if (lvl > delay && lvl <= 3 + delay) while (placed < n && placed < 2 + 2 * (lvl - delay)) toks.push(`p${placed++}`);
  }
  while (placed < n) {
    const i = placed;
    toks.push(`p${placed++}`);
    for (let k = 0; k < 3; k++) while (bought[i][k] < st.towers[i].tiers[k]) { toks.push(`u${i}${'ABC'[k]}`); bought[i][k]++; }
  }
  return { ...st, script: toks.join(' ') };
}
