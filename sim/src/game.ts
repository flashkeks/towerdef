/**
 * Duskwardens-Kern (Runde 11): deterministisch, Ganzzahl-Zustand, 60 Ticks/s.
 * Tick-Reihenfolge: siehe sim/README.md und `tick()` unten.
 */
import { DATA, baseStats } from './data.js';
import { dist2, isqrt } from './fixed.js';
import { hashState } from './hash.js';
import { getMap, pointInPolygon } from './map.js';
import { towerXpPot, splitTowerXp } from './xp.js';
import { positionAt, pathClearance } from './path.js';
import { nextInt, seedRng } from './prng.js';
import { applyMod, pathOrder, type Mod, type Stats } from './stats.js';
import { cosBp, rotate, sinBp } from './trig.js';
import type {
  AbilityId, Command, CommandResult, DamageType, Difficulty, EnemyState, EnemyType, Game, GameOptions, GameState,
  HeroType, PlaceCheck, ProjectileKind, ProjectileState, SimEvent, TargetMode, TowerState, TowerType, Tiers, UnlockPathInfo, UpgradeInfo,
} from './types.js';

export const MAX_ROUND = 20;
const WINDUP = 6;
const ATTACK_ANIM = 18;
const MIN_SPAWN_PROGRESS = 8000;
const PROJ_RADIUS = 3500;
const CELL = 24000;
const TOWER_TYPES: readonly TowerType[] = ['ranger', 'bombardier', 'frostcaller'];
const ABILITY_ORDER: AbilityId[] = ['arrowRain', 'absoluteZero', 'flare', 'dawnbreak'];
const STRONG_RANK: Record<EnemyType, number> = { leviathan: 8, brute: 7, ironshell: 6, ember: 6, gold: 4, green: 3, blue: 2, red: 1 };

const isHero = (t: TowerType | HeroType): t is HeroType => t === 'wren';

/** Preis x Faktor (Basispunkte), kaufmännisch auf 5 gerundet. */
export function round5(price: number, bp: number): number {
  return 5 * Math.floor((price * bp + 25000) / 50000);
}

interface EnemyRt {
  hp: number;
  /** Basistempo in Bruchteilen von Milli-px je Tick (1000 = 1 Milli-px). */
  sp: number;
  radius: number;
  children: EnemyType[];
  armor: boolean;
  immuneCold: boolean;
  boss: boolean;
  stages: number[];
  rbe: number;
}

export function createGame(opts: GameOptions): Game {
  const map = getMap(opts.map);
  const diff = DATA.difficulties[opts.difficulty as Difficulty];
  if (!diff) throw new Error(`Unbekannte Schwierigkeit: ${opts.difficulty}`);
  const kmods = opts.mods ?? {};
  const path = map.path;

  // ---- Gegnertabelle dieser Partie ----
  const etab = {} as Record<EnemyType, EnemyRt>;
  for (const [k, d] of Object.entries(DATA.enemies) as [EnemyType, (typeof DATA.enemies)[EnemyType]][]) {
    const hp = d.boss ? diff.bossHp : d.hp;
    etab[k] = {
      hp,
      sp: Math.floor((52_000_000 * d.tempo * diff.speedBp) / (60 * 100 * 10000)),
      radius: d.radius * 1000,
      children: d.children,
      armor: !!d.armor,
      immuneCold: !!d.immuneCold,
      boss: !!d.boss,
      stages: d.stages ?? [],
      rbe: 0,
    };
  }
  for (const k of Object.keys(etab) as EnemyType[]) {
    const calc = (e: EnemyType): number => etab[e].hp + etab[e].children.reduce((a, c) => a + calc(c), 0);
    etab[k].rbe = calc(k);
  }

  const lives0 = diff.lives + (kmods.lives ?? 0);
  const S: GameState = {
    tick: 0,
    phase: 'build',
    round: 0,
    roundsCleared: 0,
    cash: diff.startCash + (kmods.startCash ?? 0),
    lives: lives0,
    towers: [],
    enemies: [],
    projectiles: [],
    abilities: [],
    towerXp: opts.towerXp ? { ranger: opts.towerXp.ranger, bombardier: opts.towerXp.bombardier, frostcaller: opts.towerXp.frostcaller } : { ranger: 0, bombardier: 0, frostcaller: 0 },
    towerXpGained: { ranger: 0, bombardier: 0, frostcaller: 0 },
    maxTier: {
      ranger: opts.unlocks ? [...opts.unlocks.maxTier.ranger] : [5, 5, 5],
      bombardier: opts.unlocks ? [...opts.unlocks.maxTier.bombardier] : [5, 5, 5],
      frostcaller: opts.unlocks ? [...opts.unlocks.maxTier.frostcaller] : [5, 5, 5],
    },
    roundPops: { ranger: 0, bombardier: 0, frostcaller: 0 },
    stats: {
      pops: { ranger: 0, bombardier: 0, frostcaller: 0, wren: 0 },
      leaked: 0,
      spent: { ranger: 0, bombardier: 0, frostcaller: 0, wren: 0 },
    },
    autoStart: false,
    heroPlaced: false,
    rainLeft: 0,
    nextId: 1,
    rng: seedRng(opts.seed),
    groups: [],
    activeRounds: [],
  };

  let events: SimEvent[] = [];
  const emit = (e: SimEvent): void => {
    events.push(e);
  };

  // Nicht gehashte Nebenstrukturen (aus dem Zustand ableitbar)
  const emap = new Map<number, EnemyState>();
  const tstats = new Map<number, Stats>();
  const pstats = new WeakMap<ProjectileState, Stats>();
  let grid = new Map<number, EnemyState[]>();

  const sellRate = kmods.sellBp ?? 7000;

  // ================= Hilfen =================

  const towerById = (id: number): TowerState | undefined => {
    for (const t of S.towers) if (t.id === id) return t;
    return undefined;
  };
  const heroTower = (): TowerState | undefined => S.towers.find((t) => t.type === 'wren');

  function towerDef(type: TowerType | HeroType): { price: number; radius: number } {
    return isHero(type) ? DATA.hero[type] : DATA.towers[type];
  }
  const priceOf = (type: TowerType | HeroType): number => round5(towerDef(type).price, diff.priceBp);
  function upgradePrice(type: TowerType, path: number, tier: number): number {
    let base = DATA.towers[type].paths[path].tiers[tier - 1].price;
    if (tier === 1 && kmods.t1DiscountBp) base = Math.floor((base * (10000 - kmods.t1DiscountBp)) / 10000);
    return round5(base, diff.priceBp);
  }

  function computeStats(t: TowerState): Stats {
    let st: Stats;
    if (isHero(t.type)) {
      const h = DATA.hero[t.type];
      st = baseStats(h.base);
      for (let l = 2; l <= t.heroLevel; l++) for (const m of h.levels[l - 1].mods) applyMod(st, m as Mod);
    } else {
      const d = DATA.towers[t.type];
      st = baseStats(d.base);
      for (const p of pathOrder(t.tiers)) {
        for (let k = 1; k <= t.tiers[p]; k++) for (const m of d.paths[p].tiers[k - 1].mods) applyMod(st, m as Mod);
      }
      const rb = kmods.rangeBp?.[t.type];
      if (rb) st.range = Math.floor((st.range * (10000 + rb)) / 10000);
    }
    if (kmods.radiusBp) {
      const f = (v: number): number => Math.floor((v * (10000 + kmods.radiusBp!)) / 10000);
      st.radius = f(st.radius);
      st.novaR = f(st.novaR);
      st.endR = f(st.endR);
      st.flareR = f(st.flareR);
    }
    if (kmods.slowDurBp) st.slowTicks = Math.floor((st.slowTicks * (10000 + kmods.slowDurBp)) / 10000);
    return st;
  }

  function refreshTower(t: TowerState): void {
    const st = computeStats(t);
    tstats.set(t.id, st);
    t.camo = st.camo === 1;
    t.range = st.range;
    syncAbilities();
  }

  function abilityParams(id: AbilityId): { cd: number } | null {
    if (id === 'arrowRain') {
      let cd = 0;
      for (const t of S.towers) if (t.type === 'ranger') { const st = tstats.get(t.id)!; if (st.rainDur > 0) cd = Math.max(cd, st.rainCd); }
      return cd > 0 ? { cd } : null;
    }
    if (id === 'absoluteZero') {
      let cd = 0;
      for (const t of S.towers) if (t.type === 'frostcaller') { const st = tstats.get(t.id)!; if (st.azDur > 0) cd = Math.max(cd, st.azCd); }
      return cd > 0 ? { cd } : null;
    }
    const h = heroTower();
    if (!h) return null;
    const st = tstats.get(h.id)!;
    if (id === 'flare') return st.flareCd > 0 ? { cd: st.flareCd } : null;
    return st.dawnCd > 0 ? { cd: st.dawnCd } : null;
  }

  /** Fähigkeiten an den vorhandenen Türmen ausrichten; Abklingzeit startet beim Erwerb voll. */
  function syncAbilities(): void {
    const next: GameState['abilities'] = [];
    for (const id of ABILITY_ORDER) {
      const p = abilityParams(id);
      if (!p) continue;
      const old = S.abilities.find((a) => a.id === id);
      if (old) next.push({ id, ready: old.ready, cdLeft: Math.min(old.cdLeft, p.cd), cdTotal: p.cd });
      else next.push({ id, ready: false, cdLeft: p.cd, cdTotal: p.cd });
    }
    S.abilities = next;
  }

  // ---------- Gegner ----------

  function spawnEnemy(type: EnemyType, progress: number, camo: boolean, round: number, revealed: boolean): EnemyState {
    const d = etab[type];
    const pos = positionAt(path, progress);
    const e: EnemyState = {
      id: S.nextId++, type, x: pos.x, y: pos.y, progress, hp: d.hp, maxHp: d.hp, camo, revealed,
      slowBp: 0, slowTicks: 0, stunTicks: 0, frozenTicks: 0, burnTicks: 0, damageStage: 0,
      frac: 0, round, brittleTicks: 0, burnDmg: 0, burnOwner: 0, dead: false,
    };
    S.enemies.push(e);
    emap.set(e.id, e);
    gridInsert(e);
    return e;
  }

  const gkey = (x: number, y: number): number => (Math.floor((x + 200000) / CELL) << 9) + Math.floor((y + 200000) / CELL);
  function gridInsert(e: EnemyState): void {
    const k = gkey(e.x, e.y);
    const a = grid.get(k);
    if (a) a.push(e);
    else grid.set(k, [e]);
  }
  function rebuildGrid(): void {
    grid = new Map();
    for (const e of S.enemies) if (!e.dead) gridInsert(e);
  }
  /** Alle lebenden Gegner, deren Mittelpunkt in der Box liegt (grobe Vorauswahl). */
  function queryBox(x0: number, y0: number, x1: number, y1: number): EnemyState[] {
    const out: EnemyState[] = [];
    const cx0 = Math.floor((x0 + 200000) / CELL);
    const cx1 = Math.floor((x1 + 200000) / CELL);
    const cy0 = Math.floor((y0 + 200000) / CELL);
    const cy1 = Math.floor((y1 + 200000) / CELL);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const a = grid.get((cx << 9) + cy);
        if (a) for (const e of a) if (!e.dead) out.push(e);
      }
    }
    return out;
  }

  const enemySpeed = (e: EnemyState): number => {
    const base = etab[e.type].sp;
    return e.slowTicks > 0 ? Math.floor((base * (10000 - e.slowBp)) / 10000) : base;
  };

  /** Fortschritt eines Gegners in `ticks` Ticks (Status eingerechnet, Fortsetzung nach Stillstand). */
  function predictPos(e: EnemyState, ticks: number): { x: number; y: number } {
    const still = Math.max(e.frozenTicks, e.stunTicks);
    const moving = Math.max(0, ticks - still);
    const prog = Math.min(path.length, e.progress + Math.floor((e.frac + enemySpeed(e) * moving) / 1000));
    return positionAt(path, prog);
  }

  const bonusFor = (e: EnemyState, st: Stats): number =>
    e.type === 'brute' ? st.bonusBrute : e.type === 'leviathan' ? st.bonusBrute + st.bonusBoss : 0;

  // ---------- Schaden ----------

  /** Gibt true zurück, wenn Schaden angewendet wurde (nicht abgeprallt). */
  function damage(e: EnemyState, amount: number, dtype: DamageType, src: number, created?: number[], silent = false): boolean {
    if (e.dead) return false;
    const d = etab[e.type];
    if (dtype === 'sharp' && (d.armor || e.frozenTicks > 0)) {
      if (!silent) emit({ type: 'blocked', tick: S.tick, enemy: e.id, x: e.x, y: e.y, reason: 'armor' });
      return false;
    }
    if (dtype === 'cold' && d.immuneCold) {
      if (!silent) emit({ type: 'blocked', tick: S.tick, enemy: e.id, x: e.x, y: e.y, reason: 'immune' });
      return false;
    }
    let total = amount;
    if (e.brittleTicks > 0) total += 1;
    if (total <= 0) return false;
    if (!silent) emit({ type: 'hit', tick: S.tick, enemy: e.id, tower: src, dmg: total, dtype, x: e.x, y: e.y });
    const before = e.hp;
    e.hp -= total;
    if (d.stages.length && e.hp > 0) {
      let stage = 0;
      for (const pct of d.stages) if (e.hp * 100 <= pct * e.maxHp) stage++;
      if (stage > e.damageStage) {
        e.damageStage = stage;
        if (d.boss) emit({ type: 'bossStage', tick: S.tick, enemy: e.id, stage });
      }
    }
    if (e.hp <= 0) popEnemy(e, total - before, dtype, src, created);
    return true;
  }

  function popEnemy(e: EnemyState, excess: number, dtype: DamageType, src: number, created?: number[]): void {
    const d = etab[e.type];
    e.dead = true;
    e.hp = 0;
    const cash = d.boss ? 100 : diff.popCash;
    S.cash += cash;
    const owner = towerById(src);
    if (owner) {
      owner.pops++;
      S.stats.pops[owner.type]++;
      if (!isHero(owner.type)) S.roundPops[owner.type]++;
    }
    const kids: EnemyState[] = [];
    const n = d.children.length;
    for (let i = 0; i < n; i++) {
      const off = (2 * i - (n - 1)) * 3000;
      const k = spawnEnemy(d.children[i], Math.max(0, e.progress + off), e.camo, e.round, e.revealed);
      kids.push(k);
      created?.push(k.id);
    }
    emit({ type: 'pop', tick: S.tick, enemy: e.id, etype: e.type, x: e.x, y: e.y, children: kids.map((k) => k.id), cash });
    if (!d.boss && excess > 0) for (const k of kids) damage(k, excess, dtype, src, created, true);
  }

  function applySlow(e: EnemyState, bp: number, ticks: number, brittle: boolean, raw = false): void {
    const d = etab[e.type];
    if (d.immuneCold || e.dead) return;
    if (d.boss && !raw) {
      bp = Math.floor(bp / 2);
      ticks = Math.floor(ticks / 2);
    }
    if (bp <= 0 || ticks <= 0) return;
    const was = e.slowTicks > 0;
    if (e.slowTicks <= 0 || bp > e.slowBp) {
      e.slowBp = bp;
      e.slowTicks = ticks;
    } else if (bp === e.slowBp) e.slowTicks = Math.max(e.slowTicks, ticks);
    if (brittle) e.brittleTicks = Math.max(e.brittleTicks, e.slowTicks);
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'slow' });
  }

  function applyStun(e: EnemyState, ticks: number, bossTicks: number): void {
    if (e.dead) return;
    const t = etab[e.type].boss ? bossTicks : ticks;
    if (t <= 0) return;
    const was = e.stunTicks > 0;
    e.stunTicks = Math.max(e.stunTicks, t);
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'stun' });
  }

  function applyBurn(e: EnemyState, dmg: number, ticks: number, owner: number): void {
    if (e.dead || dmg <= 0) return;
    if (etab[e.type].boss) ticks = Math.floor(ticks / 2);
    const was = e.burnTicks > 0;
    e.burnTicks = Math.max(e.burnTicks, ticks);
    e.burnDmg = Math.max(e.burnDmg, dmg);
    e.burnOwner = owner;
    if (!was) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'burn' });
  }

  // ---------- Treffer-Helfer ----------

  /** Flächenschaden: nächste `max` Gegner im Radius. */
  function explodeAt(
    x: number, y: number, radius: number, dmg: number, dtype: DamageType, max: number, src: number, st: Stats | null,
    kind: 'bomb' | 'mini' | 'star', stun = 0, stunBoss = 0, exclude?: readonly number[], withBonus = true,
  ): void {
    emit({ type: 'explode', tick: S.tick, x, y, radius, kind });
    const cand = queryBox(x - radius - 30000, y - radius - 30000, x + radius + 30000, y + radius + 30000);
    const list: { e: EnemyState; d2: number }[] = [];
    for (const e of cand) {
      if (exclude && exclude.includes(e.id)) continue;
      const r = radius + etab[e.type].radius;
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= r * r) list.push({ e, d2 });
    }
    list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
    for (const { e } of list.slice(0, max)) {
      damage(e, dmg + (st && withBonus ? bonusFor(e, st) : 0), dtype, src);
      if (stun > 0 || stunBoss > 0) applyStun(e, stun, stunBoss);
    }
  }

  function spawnFrags(x: number, y: number, st: Stats, owner: number, hit: number[]): void {
    const n = st.fragN;
    if (n <= 0) return;
    const a0 = nextInt(S.rng, 360);
    const v = Math.max(1, Math.floor((st.fragSpeed * 50) / 3));
    const life = Math.max(1, Math.ceil(st.fragRange / v));
    for (let i = 0; i < n; i++) {
      const deg = a0 + Math.floor((i * 360) / n);
      const p = makeProj(owner, st.fragKind, x, y, Math.round((v * cosBp(deg)) / 10000), Math.round((v * sinBp(deg)) / 10000), st.fragDmg, st.fragDtype, st.fragPierce, life, 1, st);
      p.hit = hit.slice();
    }
  }

  function makeProj(owner: number, kind: ProjectileKind, x: number, y: number, vx: number, vy: number, dmg: number, dtype: DamageType, pierce: number, life: number, sub: number, st: Stats): ProjectileState {
    const p: ProjectileState = { id: S.nextId++, kind, owner, x, y, vx, vy, dmg, dtype, pierce, life, age: -1, hit: [], sub };
    S.projectiles.push(p);
    pstats.set(p, st);
    return p;
  }

  function nearestUnhit(x: number, y: number, range: number, taken: readonly number[], n: number): EnemyState[] {
    const cand = queryBox(x - range - 25000, y - range - 25000, x + range + 25000, y + range + 25000);
    const list: { e: EnemyState; d2: number }[] = [];
    for (const e of cand) {
      if (taken.includes(e.id) || e.progress < MIN_SPAWN_PROGRESS) continue;
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= range * range) list.push({ e, d2 });
    }
    list.sort((a, b) => a.d2 - b.d2 || a.e.id - b.e.id);
    return list.slice(0, n).map((l) => l.e);
  }

  /** Sofortiger Blitz von (x,y) auf bis zu n weitere Gegner (Funke / Kette). */
  function lightning(fromX: number, fromY: number, first: EnemyState | null, n: number, range: number, dmg: number, src: number, taken: number[], originPoint: boolean): void {
    const points: [number, number][] = [];
    if (originPoint) points.push([fromX, fromY]);
    let cx = fromX, cy = fromY;
    let cur = first;
    let left = n;
    if (!cur) {
      const c = nearestUnhit(cx, cy, range, taken, 1);
      cur = c[0] ?? null;
    }
    while (cur && left > 0) {
      points.push([cur.x, cur.y]);
      taken.push(cur.id);
      cx = cur.x; cy = cur.y;
      damage(cur, dmg, 'energy', src);
      left--;
      if (left <= 0) break;
      const nx = nearestUnhit(cx, cy, range, taken, 1);
      cur = nx[0] ?? null;
    }
    if (points.length >= 2) emit({ type: 'chain', tick: S.tick, tower: src, points, dmg });
  }

  // ---------- Zielwahl ----------

  function pickTarget(t: TowerState, range: number, detect: boolean, mode: TargetMode, requireDetect = true): EnemyState | null {
    let best: EnemyState | null = null;
    let bestKey = 0;
    const r2 = range * range;
    const cand = queryBox(t.x - range - 25000, t.y - range - 25000, t.x + range + 25000, t.y + range + 25000);
    for (const e of cand) {
      if (e.progress < MIN_SPAWN_PROGRESS) continue;
      if (requireDetect && e.camo && !e.revealed && !detect) continue;
      const d2 = dist2(t.x, t.y, e.x, e.y);
      if (d2 > r2) continue;
      let key: number;
      switch (mode) {
        case 'first': key = e.progress * 1024 - (e.id & 1023); break;
        case 'last': key = -e.progress * 1024 - (e.id & 1023); break;
        case 'close': key = -d2; break;
        default: key = STRONG_RANK[e.type] * 1e12 + e.progress; break;
      }
      if (best === null || key > bestKey || (key === bestKey && e.id < best.id)) {
        best = e;
        bestKey = key;
      }
    }
    return best;
  }

  // ================= Türme =================

  function facingOf(dx: number, dy: number): number {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const up = dy < 0;
    if (ay * 100000 <= ax * 41421) return dx >= 0 ? 0 : 4;
    if (ay * 100000 >= ax * 241421) return up ? 2 : 6;
    if (dx >= 0) return up ? 1 : 7;
    return up ? 3 : 5;
  }

  function aimAt(t: TowerState, e: EnemyState, speedMilli: number): { x: number; y: number } {
    let tx = e.x, ty = e.y;
    for (let i = 0; i < 3; i++) {
      const d = isqrt(dist2(t.x, t.y, tx, ty));
      const ticks = Math.ceil(d / speedMilli);
      const p = predictPos(e, ticks);
      tx = p.x;
      ty = p.y;
    }
    return { x: tx, y: ty };
  }

  function doFire(t: TowerState, st: Stats): void {
    let e: EnemyState | null | undefined = emap.get(t.windupTarget);
    if (!e || e.dead || dist2(t.x, t.y, e.x, e.y) > (t.range + 12000) * (t.range + 12000)) e = pickTarget(t, t.range, t.camo, t.target);
    if (!e) return;
    t.facing = facingOf(e.x - t.x, e.y - t.y);

    if (st.atk === 'chain') {
      emit({ type: 'fire', tick: S.tick, tower: t.id, kind: 'chain' });
      lightning(t.x, t.y, e, st.chainN, st.chainRange, st.dmg, t.id, [], true);
      return;
    }
    if (st.atk === 'bomb') {
      t.shots++;
      if (st.quakeEvery > 0 && t.shots % st.quakeEvery === 0) {
        emit({ type: 'fire', tick: S.tick, tower: t.id, kind: 'bomb' });
        emit({ type: 'explode', tick: S.tick, x: t.x, y: t.y, radius: t.range, kind: 'quake' });
        for (const q of nearestUnhit(t.x, t.y, t.range, [], 9999)) {
          damage(q, st.quakeDmg, 'explosive', t.id);
          applyStun(q, st.quakeStun, st.quakeStunBoss);
        }
        return;
      }
      const flight = Math.max(1, st.flight);
      const pp = predictPos(e, flight);
      const p = makeProj(t.id, st.pk, t.x, t.y, 0, 0, st.dmg, st.dtype, 0, flight, 0, st);
      p.arc = { x0: t.x, y0: t.y, x1: pp.x, y1: pp.y, t: 0 };
      emit({ type: 'fire', tick: S.tick, tower: t.id, projectile: p.id, kind: st.pk });
      return;
    }
    // Projektil(e)
    const v = Math.max(1, Math.floor((st.speed * 50) / 3));
    const aim = aimAt(t, e, v);
    const dx = aim.x - t.x, dy = aim.y - t.y;
    const len = Math.max(1, isqrt(dx * dx + dy * dy));
    const bvx = Math.round((dx * v) / len);
    const bvy = Math.round((dy * v) / len);
    const life = Math.max(1, Math.ceil((t.range * 3) / 2 / v));
    let first = 0;
    for (let i = 0; i < st.count; i++) {
      const deg = Math.floor(((2 * i - (st.count - 1)) * st.spread) / 2);
      const [vx, vy] = rotate(bvx, bvy, deg);
      const p = makeProj(t.id, st.pk, t.x, t.y, vx, vy, st.dmg, st.dtype, st.pierce, life, 0, st);
      if (i === 0) first = p.id;
    }
    emit({ type: 'fire', tick: S.tick, tower: t.id, projectile: first, kind: st.pk });
  }

  function updateTowers(): void {
    const hero = heroTower();
    const hst = hero ? tstats.get(hero.id)! : null;
    for (const t of S.towers) {
      const st = tstats.get(t.id)!;
      // Aura des Helden
      let speedBuff = 0, rangeBuff = 0;
      if (hero && hst && hst.buffRadius > 0 && t !== hero && dist2(t.x, t.y, hero.x, hero.y) <= hst.buffRadius * hst.buffRadius) {
        speedBuff = hst.buffSpeedBp;
        rangeBuff = hst.buffRangeBp;
      }
      t.range = rangeBuff ? Math.floor((st.range * (10000 + rangeBuff)) / 10000) : st.range;

      // Frost-Aura
      if (st.auraSlowBp > 0) {
        const brittle = st.brittle === 1;
        for (const e of nearestUnhit(t.x, t.y, t.range, [], 9999)) {
          const bp = etab[e.type].boss ? st.auraBossSlowBp : st.auraSlowBp;
          if (bp > 0) applySlow(e, bp, 3, brittle, true);
        }
      }
      if (st.auraDmg > 0) {
        if (t.auraCd > 0) t.auraCd--;
        if (t.auraCd <= 0) {
          t.auraCd = st.auraInterval;
          const list = nearestUnhit(t.x, t.y, t.range, [], 9999).sort((a, b) => b.progress - a.progress || a.id - b.id).slice(0, st.auraMax);
          for (const e of list) damage(e, st.auraDmg, 'cold', t.id);
        }
      }
      // Donnerschlag
      if (st.thunderInterval > 0) {
        if (t.thunderCd > 0) t.thunderCd--;
        if (t.thunderCd <= 0) {
          const e = pickTarget(t, t.range, t.camo, 'strong');
          if (e) {
            t.thunderCd = st.thunderInterval;
            emit({ type: 'chain', tick: S.tick, tower: t.id, points: [[e.x, e.y - 120000], [e.x, e.y]], dmg: st.thunderDmg });
            damage(e, st.thunderDmg, 'energy', t.id);
          }
        }
      }

      if (st.atk === 'none') continue;
      let dec = Math.floor((1000 * (10000 + speedBuff)) / 10000);
      if (t.type === 'ranger' && S.rainLeft > 0) dec *= 3;
      t.cd -= dec;
      if (t.cd < -dec) t.cd = -dec;
      if (t.attackTick > 0) {
        t.attackTick++;
        if (t.attackTick > ATTACK_ANIM) t.attackTick = 0;
      }
      if (t.windupLeft > 0) {
        t.windupLeft--;
        if (t.windupLeft === 0) doFire(t, st);
      }
      if (t.windupLeft === 0 && t.cd <= 0) {
        const e = pickTarget(t, t.range, t.camo, t.target);
        if (e) {
          t.windupTarget = e.id;
          t.windupLeft = Math.max(1, Math.min(WINDUP, Math.floor(st.interval / 2000)));
          t.cd += st.interval;
          t.attackTick = 1;
          t.facing = facingOf(e.x - t.x, e.y - t.y);
          emit({ type: 'windup', tick: S.tick, tower: t.id, target: e.id });
        }
      }
    }
  }

  // ================= Projektile =================

  function endBurst(p: ProjectileState, st: Stats, at: EnemyState): void {
    if (p.sub === 0 && st.endR > 0) explodeAt(at.x, at.y, st.endR, st.endDmg, 'explosive', st.endMax, p.owner, st, 'star', 0, 0, p.hit, false);
    else if (p.sub === 1 && p.kind === 'frag' && st.fragExplR > 0) explodeAt(at.x, at.y, st.fragExplR, st.fragExplDmg, 'explosive', 6, p.owner, null, 'mini', 0, 0, p.hit);
  }

  function hitEnemy(p: ProjectileState, e: EnemyState, st: Stats): void {
    p.hit.push(e.id);
    p.pierce--;
    const created: number[] = [];
    const amount = p.dmg + (p.sub === 0 ? bonusFor(e, st) : 0);
    const dealt = damage(e, amount, p.dtype, p.owner, created);
    for (const c of created) p.hit.push(c);
    if (p.sub === 0) {
      if (dealt && !e.dead) {
        if (st.slowBp > 0) applySlow(e, st.slowBp, st.slowTicks, st.brittle === 1);
        if (st.burnDmg > 0) applyBurn(e, st.burnDmg, st.burnTicks, p.owner);
      }
      if (dealt && st.sparkN > 0) {
        lightning(e.x, e.y, null, st.sparkN, st.chainRange, st.sparkDmg, p.owner, [e.id, ...p.hit], true);
      }
      if (st.novaR > 0) {
        emit({ type: 'nova', tick: S.tick, x: e.x, y: e.y, radius: st.novaR });
        const others = nearestUnhit(e.x, e.y, st.novaR, p.hit, st.novaMax);
        for (const o of others) {
          if (damage(o, st.novaDmg, 'cold', p.owner)) applySlow(o, st.slowBp, st.slowTicks, st.brittle === 1);
        }
        if (st.fragN > 0) spawnFrags(e.x, e.y, st, p.owner, p.hit.slice());
        p.pierce = 0;
      }
    }
    if (p.pierce <= 0) endBurst(p, st, e);
  }

  function updateProjectiles(): void {
    const list = S.projectiles.slice();
    const removed = new Set<number>();
    for (const p of list) {
      const st = pstats.get(p)!;
      if (p.age < 0) {
        // frisch abgeschossen: erst im nächsten Tick unterwegs
        p.age = 0;
        continue;
      }
      if (p.arc) {
        p.age++;
        const flight = p.life;
        p.arc.t = Math.min(10000, Math.floor((10000 * p.age) / flight));
        p.x = p.arc.x0 + Math.trunc(((p.arc.x1 - p.arc.x0) * p.arc.t) / 10000);
        p.y = p.arc.y0 + Math.trunc(((p.arc.y1 - p.arc.y0) * p.arc.t) / 10000);
        if (p.age >= flight) {
          explodeAt(p.arc.x1, p.arc.y1, st.radius, p.dmg, p.dtype, st.maxT, p.owner, st, 'bomb', st.stun, st.stunBoss);
          if (st.fragN > 0) spawnFrags(p.arc.x1, p.arc.y1, st, p.owner, []);
        } else continue;
        removed.add(p.id);
        continue;
      }
      const px = p.x, py = p.y;
      p.x += p.vx;
      p.y += p.vy;
      p.age++;
      p.life--;
      // Sweep-Kollision: Segment (px,py)-(x,y) gegen Gegnerkreise
      const minx = Math.min(px, p.x) - 24000, maxx = Math.max(px, p.x) + 24000;
      const miny = Math.min(py, p.y) - 24000, maxy = Math.max(py, p.y) + 24000;
      const cand = queryBox(minx, miny, maxx, maxy);
      const dx = p.x - px, dy = p.y - py;
      const len2 = dx * dx + dy * dy;
      const hits: { e: EnemyState; t: number }[] = [];
      for (const e of cand) {
        if (p.hit.includes(e.id)) continue;
        const rr = etab[e.type].radius + PROJ_RADIUS;
        const ex = e.x - px, ey = e.y - py;
        const dot = ex * dx + ey * dy;
        let d2: number;
        if (len2 === 0 || dot <= 0) d2 = ex * ex + ey * ey;
        else if (dot >= len2) d2 = (e.x - p.x) * (e.x - p.x) + (e.y - p.y) * (e.y - p.y);
        else {
          const cross = ex * dy - ey * dx;
          d2 = (cross * cross) / len2;
        }
        if (d2 <= rr * rr) hits.push({ e, t: len2 === 0 ? 0 : dot / len2 });
      }
      hits.sort((a, b) => a.t - b.t || a.e.id - b.e.id);
      for (const h of hits) {
        if (p.pierce <= 0) break;
        if (h.e.dead || p.hit.includes(h.e.id)) continue;
        hitEnemy(p, h.e, st);
      }
      const out = p.x < -150000 || p.x > 800000 || p.y < -150000 || p.y > 520000;
      if (!(p.pierce > 0 && p.life > 0 && !out)) removed.add(p.id);
    }
    if (removed.size) S.projectiles = S.projectiles.filter((p) => !removed.has(p.id));
  }

  // ================= Gegner =================

  function leak(e: EnemyState): void {
    const lost = e.hp + etab[e.type].children.reduce((a, c) => a + etab[c].rbe, 0);
    e.dead = true;
    S.lives = Math.max(0, S.lives - lost);
    S.stats.leaked += lost;
    emit({ type: 'leak', tick: S.tick, enemy: e.id, etype: e.type, lives: S.lives });
  }

  function updateEnemies(): void {
    const list = S.enemies.slice();
    for (const e of list) {
      if (e.dead) continue;
      if (e.burnTicks > 0) {
        e.burnTicks--;
        if (e.burnTicks % 60 === 0) damage(e, e.burnDmg, 'magic', e.burnOwner);
        if (e.burnTicks === 0) e.burnDmg = 0;
        if (e.dead) continue;
      }
      if (e.slowTicks > 0 && --e.slowTicks === 0) e.slowBp = 0;
      if (e.brittleTicks > 0) e.brittleTicks--;
      if (e.frozenTicks > 0) {
        e.frozenTicks--;
        continue;
      }
      if (e.stunTicks > 0) {
        e.stunTicks--;
        continue;
      }
      const f = e.frac + enemySpeed(e);
      e.progress += Math.floor(f / 1000);
      e.frac = f % 1000;
      if (e.progress >= path.length) {
        e.progress = path.length;
        leak(e);
        continue;
      }
      const pos = positionAt(path, e.progress);
      e.x = pos.x;
      e.y = pos.y;
    }
  }

  // ================= Runden =================

  function startRoundInternal(): void {
    S.round++;
    const r = DATA.rounds[S.round - 1];
    for (const g of r.groups) {
      S.groups.push({
        round: S.round, type: g.type, camo: !!g.camo, left: g.n,
        next: S.tick + Math.floor((g.startMs * 60) / 1000), gap: Math.max(1, Math.floor((g.gapMs * 60) / 1000)),
      });
    }
    S.activeRounds.push(S.round);
    S.phase = 'wave';
    emit({ type: 'roundStart', tick: S.tick, round: S.round });
  }

  function spawnTick(): void {
    let any = false;
    for (const g of S.groups) {
      while (g.left > 0 && S.tick >= g.next) {
        spawnEnemy(g.type, 0, g.camo, g.round, false);
        g.left--;
        g.next += g.gap;
      }
      if (g.left === 0) any = true;
    }
    if (any) S.groups = S.groups.filter((g) => g.left > 0);
  }

  function grantHeroXp(amount: number): void {
    const h = heroTower();
    if (!h) return;
    h.heroXp += amount;
    const lv = DATA.hero.wren.levels;
    let changed = false;
    while (h.heroLevel < 20 && h.heroXp >= lv[h.heroLevel].xp) {
      h.heroLevel++;
      changed = true;
      emit({ type: 'heroLevel', tick: S.tick, tower: h.id, level: h.heroLevel });
    }
    if (changed) refreshTower(h);
  }

  function endRound(r: number): void {
    const bonus = 100 + r + (r <= 10 ? (kmods.earlyBonus ?? 0) : 0);
    S.cash += bonus;
    S.roundsCleared++;
    S.activeRounds = S.activeRounds.filter((x) => x !== r);
    grantHeroXp(60 + 20 * r);
    emit({ type: 'roundEnd', tick: S.tick, round: r, bonus });
    distributeTowerXp(r);
  }

  /**
   * Turm-XP-Topf am Rundenende (Runde 11b): (potBase + potPerRound x Runde) x Schwierigkeit x Fast Learner, ganzzahlig.
   * Je Typ (ohne Held): 50 % nach investiertem Geld der stehenden Türme, 50 % nach den Pops seit dem letzten Rundenende.
   * Fehlt eine Hälfte (nichts investiert / nichts geknackt), geht der ganze Topf nach der anderen. Rest nach der Rundung
   * an den Typ mit dem größten Anteil (Gleichstand: Reihenfolge ranger, bombardier, frostcaller).
   */
  function distributeTowerXp(r: number): void {
    if (!opts.towerXp) return;
    const spent = { ranger: 0, bombardier: 0, frostcaller: 0 };
    for (const t of S.towers) if (!isHero(t.type)) spent[t.type] += t.spent;
    const pops = S.roundPops;
    const spentTot = spent.ranger + spent.bombardier + spent.frostcaller;
    const popsTot = pops.ranger + pops.bombardier + pops.frostcaller;
    S.roundPops = { ranger: 0, bombardier: 0, frostcaller: 0 };
    if (spentTot === 0 && popsTot === 0) return;
    const pot = towerXpPot(r, opts.difficulty, kmods.towerXpBp ?? 0);
    const split = splitTowerXp(pot, spent, pops);
    const out: Partial<Record<TowerType, number>> = {};
    for (const t of TOWER_TYPES) {
      if (split[t] <= 0) continue;
      out[t] = split[t];
      S.towerXp[t] += split[t];
      S.towerXpGained[t] += split[t];
    }
    if (pot <= 0) return;
    emit({ type: 'towerXp', tick: S.tick, round: r, pot, gains: out });
  }

  /** Tote Gegner aus der Liste nehmen (nach jedem Tick und nach jedem Befehl). */
  function sweep(): void {
    if (S.enemies.some((e) => e.dead)) {
      for (const e of S.enemies) if (e.dead) emap.delete(e.id);
      S.enemies = S.enemies.filter((e) => !e.dead);
    }
  }

  function finishTick(): void {
    sweep();
    if (S.lives <= 0) {
      S.phase = 'lost';
      emit({ type: 'gameOver', tick: S.tick, result: 'lost', round: S.round });
      return;
    }
    if (S.activeRounds.length) {
      const present = new Set<number>();
      for (const e of S.enemies) present.add(e.round);
      for (const g of S.groups) present.add(g.round);
      for (const r of S.activeRounds.slice()) if (!present.has(r)) endRound(r);
    }
    if (S.round >= MAX_ROUND && S.activeRounds.length === 0 && S.groups.length === 0 && S.enemies.length === 0) {
      S.phase = 'won';
      emit({ type: 'gameOver', tick: S.tick, result: 'won', round: S.round });
      return;
    }
    S.phase = S.enemies.length > 0 || S.groups.length > 0 ? 'wave' : 'build';
  }

  function tick(): void {
    if (S.phase === 'won' || S.phase === 'lost') return;
    // 1. Auto-Start, Spawns
    if (S.autoStart && S.round >= 1 && S.round < MAX_ROUND && S.groups.length === 0) startRoundInternal();
    spawnTick();
    // 2. Fähigkeits-Abklingzeiten
    for (const a of S.abilities) if (!a.ready && --a.cdLeft <= 0) { a.cdLeft = 0; a.ready = true; }
    if (S.rainLeft > 0) S.rainLeft--;
    // 3. Gegner bewegen, Status
    updateEnemies();
    rebuildGrid();
    // 4. Türme
    updateTowers();
    // 5. Projektile
    updateProjectiles();
    // 6. Aufräumen, Runden, Sieg/Niederlage
    finishTick();
    S.tick++;
  }

  // ================= Befehle =================

  function canPlace(type: TowerType | HeroType, x: number, y: number): PlaceCheck {
    if (!isHero(type) && !TOWER_TYPES.includes(type)) return { ok: false, reason: 'unknown-tower' };
    if (opts.unlocks && !opts.unlocks.towers.includes(type)) return { ok: false, reason: 'locked' };
    if (isHero(type) && S.heroPlaced) return { ok: false, reason: 'hero-limit' };
    const r = towerDef(type).radius * 1000;
    const b = map.build;
    if (x - r < b.x0 || x + r > b.x1 || y - r < b.y0 || y + r > b.y1) return { ok: false, reason: 'out-of-bounds' };
    if (!pathClearance(path, x, y, map.halfWidth + r)) return { ok: false, reason: 'on-path' };
    for (const poly of map.water) {
      if (pointInPolygon(x, y, poly) || pointInPolygon(x + r, y, poly) || pointInPolygon(x - r, y, poly) || pointInPolygon(x, y + r, poly) || pointInPolygon(x, y - r, poly)) {
        return { ok: false, reason: 'water' };
      }
    }
    for (const bl of map.blockers) if (dist2(x, y, bl.x, bl.y) < (bl.r + r) * (bl.r + r)) return { ok: false, reason: 'blocked' };
    for (const t of S.towers) {
      const rr = towerDef(t.type).radius * 1000 + r;
      if (dist2(x, y, t.x, t.y) < rr * rr) return { ok: false, reason: 'overlap' };
    }
    if (S.cash < priceOf(type)) return { ok: false, reason: 'no-cash' };
    return { ok: true };
  }

  function tiersAllowed(t: Tiers): boolean {
    const used = t.filter((v) => v > 0).length;
    const high = t.filter((v) => v >= 3).length;
    return used <= 2 && high <= 1;
  }

  function upgradeBlock(t: TowerState, path_: 0 | 1 | 2, price: number): string | undefined {
    if (isHero(t.type)) return 'hero';
    const cur = t.tiers[path_];
    if (cur >= 5) return 'maxed';
    const nt = t.tiers.slice() as Tiers;
    nt[path_]++;
    if (!tiersAllowed(nt)) return 'crosspath';
    if (S.maxTier[t.type as TowerType][path_] < nt[path_]) return 'locked';
    if (S.cash < price) return 'no-cash';
    return undefined;
  }

  function upgradeInfo(towerId: number): UpgradeInfo[] {
    const t = towerById(towerId);
    if (!t || isHero(t.type)) return [];
    const d = DATA.towers[t.type];
    return ([0, 1, 2] as const).map((p) => {
      const cur = t.tiers[p];
      const unlocked = S.maxTier[t.type as TowerType][p];
      if (cur >= 5) return { path: p, current: cur, next: null, name: '', desc: '', price: 0, unlocked, unlockCost: 0, revealed: true, canBuy: false, reason: 'maxed' };
      const tier = d.paths[p].tiers[cur];
      const price = upgradePrice(t.type as TowerType, p, cur + 1);
      const reason = upgradeBlock(t, p, price);
      const revealed = cur + 1 === 1 || unlocked >= cur;
      return {
        path: p, current: cur, next: cur + 1, name: revealed ? tier.name : '', desc: revealed ? tier.desc : '', price, unlocked,
        unlockCost: unlocked > cur ? 0 : DATA.xp.unlockCost[cur], revealed, canBuy: reason === undefined, ...(reason ? { reason } : {}),
      };
    });
  }

  /** Freischalt-Menü: je Pfad 5 Stufen, Text nur für sichtbare Stufen (Stufe 1 und die nach einer freigeschalteten). */
  function unlockInfo(type: TowerType): UnlockPathInfo[] {
    const d = DATA.towers[type];
    if (!d) return [];
    const towerFree = !opts.unlocks || opts.unlocks.towers.includes(type);
    return ([0, 1, 2] as const).map((p) => {
      const unlocked = S.maxTier[type][p];
      const next = unlocked >= 5 ? null : unlocked + 1;
      let reason: string | undefined;
      if (next === null) reason = 'maxed';
      else if (!towerFree) reason = 'locked';
      else if (S.towerXp[type] < DATA.xp.unlockCost[next - 1]) reason = 'no-xp';
      return {
        path: p,
        name: d.paths[p].name,
        unlocked,
        next,
        ...(reason ? { reason } : {}),
        tiers: d.paths[p].tiers.map((tier, i) => {
          const revealed = i === 0 || unlocked >= i;
          return { tier: i + 1, revealed, unlocked: unlocked >= i + 1, name: revealed ? tier.name : '', desc: revealed ? tier.desc : '', cost: DATA.xp.unlockCost[i] };
        }),
      };
    });
  }

  const sellValue = (id: number): number => {
    const t = towerById(id);
    return t ? Math.ceil((t.spent * sellRate) / 10000) : 0;
  };

  function useAbility(id: AbilityId): CommandResult {
    const a = S.abilities.find((x) => x.id === id);
    if (!a) return { ok: false, reason: 'no-ability' };
    if (!a.ready) return { ok: false, reason: 'cooldown' };
    if (id === 'arrowRain') {
      let dur = 0;
      for (const t of S.towers) if (t.type === 'ranger') dur = Math.max(dur, tstats.get(t.id)!.rainDur);
      S.rainLeft = dur;
      emit({ type: 'ability', tick: S.tick, id });
    } else if (id === 'absoluteZero') {
      let dur = 0, boss = 0;
      for (const t of S.towers) if (t.type === 'frostcaller') { const st = tstats.get(t.id)!; dur = Math.max(dur, st.azDur); boss = Math.max(boss, st.azBoss); }
      emit({ type: 'ability', tick: S.tick, id });
      for (const e of S.enemies) {
        if (e.dead || e.progress < MIN_SPAWN_PROGRESS || etab[e.type].immuneCold) continue;
        const f = etab[e.type].boss ? boss : dur;
        if (f <= 0) continue;
        if (e.frozenTicks <= 0) emit({ type: 'status', tick: S.tick, enemy: e.id, kind: 'freeze' });
        e.frozenTicks = Math.max(e.frozenTicks, f);
      }
    } else {
      const h = heroTower();
      if (!h) return { ok: false, reason: 'no-ability' };
      const st = tstats.get(h.id)!;
      if (id === 'flare') {
        const e = pickTarget(h, h.range, true, 'strong', false);
        if (!e) return { ok: false, reason: 'no-target' };
        emit({ type: 'ability', tick: S.tick, id, x: e.x, y: e.y });
        // enttarnen (alle im Radius), dann Schaden an den nächsten flareMax
        const radius = st.flareR;
        for (const o of queryBox(e.x - radius - 30000, e.y - radius - 30000, e.x + radius + 30000, e.y + radius + 30000)) {
          const rr = radius + etab[o.type].radius;
          if (dist2(e.x, e.y, o.x, o.y) <= rr * rr && o.camo && !o.revealed) {
            o.revealed = true;
            emit({ type: 'status', tick: S.tick, enemy: o.id, kind: 'reveal' });
          }
        }
        explodeAt(e.x, e.y, radius, st.flareDmg, 'magic', st.flareMax, h.id, null, 'star');
      } else {
        emit({ type: 'ability', tick: S.tick, id });
        for (const e of S.enemies.slice()) {
          if (e.dead || e.progress < MIN_SPAWN_PROGRESS) continue;
          damage(e, etab[e.type].boss ? st.dawnBoss : st.dawnDmg, 'magic', h.id);
        }
      }
    }
    a.ready = false;
    a.cdLeft = a.cdTotal;
    return { ok: true };
  }

  function apply(cmd: Command): CommandResult {
    if (S.phase === 'won' || S.phase === 'lost') return { ok: false, reason: 'game-over' };
    const res = applyInner(cmd);
    sweep();
    return res;
  }

  function applyInner(cmd: Command): CommandResult {
    switch (cmd.type) {
      case 'place': {
        const x = Math.round(cmd.x), y = Math.round(cmd.y);
        const chk = canPlace(cmd.tower, x, y);
        if (!chk.ok) return chk;
        const price = priceOf(cmd.tower);
        const hero = isHero(cmd.tower);
        const lvl = hero ? Math.max(1, Math.min(20, kmods.heroStartLevel ?? 1)) : 0;
        const t: TowerState = {
          id: S.nextId++, type: cmd.tower, x, y, tiers: [0, 0, 0], heroLevel: lvl,
          heroXp: hero ? DATA.hero.wren.levels[lvl - 1].xp : 0, target: 'first', facing: 0, attackTick: 0, pops: 0, spent: price,
          camo: false, range: 0, cd: 0, windupLeft: 0, windupTarget: 0, shots: 0, auraCd: 0, thunderCd: 0,
        };
        S.cash -= price;
        S.stats.spent[t.type] += price;
        S.towers.push(t);
        if (hero) S.heroPlaced = true;
        refreshTower(t);
        emit({ type: 'place', tick: S.tick, tower: t.id, ttype: t.type, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'upgrade': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (isHero(t.type)) return { ok: false, reason: 'hero' };
        if (![0, 1, 2].includes(cmd.path)) return { ok: false, reason: 'bad-path' };
        const cur = t.tiers[cmd.path];
        const price = cur >= 5 ? 0 : upgradePrice(t.type as TowerType, cmd.path, cur + 1);
        const why = upgradeBlock(t, cmd.path, price);
        if (why) return { ok: false, reason: why };
        S.cash -= price;
        t.spent += price;
        S.stats.spent[t.type] += price;
        t.tiers[cmd.path]++;
        refreshTower(t);
        emit({ type: 'upgrade', tick: S.tick, tower: t.id, ttype: t.type, tiers: [...t.tiers] as Tiers, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'unlockTier': {
        if (!TOWER_TYPES.includes(cmd.tower)) return { ok: false, reason: 'unknown-tower' };
        if (![0, 1, 2].includes(cmd.path)) return { ok: false, reason: 'bad-path' };
        const cur = S.maxTier[cmd.tower][cmd.path];
        if (cur >= 5) return { ok: false, reason: 'maxed' };
        if (opts.unlocks && !opts.unlocks.towers.includes(cmd.tower)) return { ok: false, reason: 'locked' };
        const cost = DATA.xp.unlockCost[cur];
        if (!opts.towerXp || S.towerXp[cmd.tower] < cost) return { ok: false, reason: 'no-xp' };
        S.towerXp[cmd.tower] -= cost;
        S.maxTier[cmd.tower][cmd.path] = cur + 1;
        emit({ type: 'unlockTier', tick: S.tick, tower: cmd.tower, path: cmd.path, tier: cur + 1, cost, xp: S.towerXp[cmd.tower] });
        return { ok: true };
      }
      case 'sell': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (isHero(t.type)) return { ok: false, reason: 'hero' };
        const v = sellValue(t.id);
        S.cash += v;
        S.towers = S.towers.filter((x) => x !== t);
        tstats.delete(t.id);
        syncAbilities();
        emit({ type: 'sell', tick: S.tick, tower: t.id, ttype: t.type, cash: S.cash });
        return { ok: true, id: t.id };
      }
      case 'target': {
        const t = towerById(cmd.towerId);
        if (!t) return { ok: false, reason: 'no-tower' };
        if (!['first', 'last', 'strong', 'close'].includes(cmd.mode)) return { ok: false, reason: 'bad-mode' };
        t.target = cmd.mode;
        return { ok: true };
      }
      case 'ability':
        return useAbility(cmd.ability);
      case 'startRound':
        if (S.groups.length > 0) return { ok: false, reason: 'spawning' };
        if (S.round >= MAX_ROUND) return { ok: false, reason: 'no-more-rounds' };
        startRoundInternal();
        return { ok: true, id: S.round };
      case 'autoStart':
        S.autoStart = !!cmd.on;
        return { ok: true };
      default:
        return { ok: false, reason: 'unknown-command' };
    }
  }

  return {
    state: S,
    apply,
    step(ticks = 1) {
      for (let i = 0; i < ticks; i++) tick();
    },
    drainEvents() {
      const e = events;
      events = [];
      return e;
    },
    hash: () => hashState(S),
    canPlace,
    upgradeInfo,
    unlockInfo,
    sellValue,
    priceOf,
    sandbox: {
      spawn(type, progress = 0, camo = false) {
        const e = spawnEnemy(type, progress, camo, S.round, false);
        S.phase = 'wave';
        return e.id;
      },
      hurt(enemyId, amount, dtype = 'explosive') {
        const e = emap.get(enemyId);
        const r = e ? damage(e, amount, dtype, 0) : false;
        sweep();
        return r;
      },
      setCash(cash) {
        S.cash = cash;
      },
    },
  };
}
