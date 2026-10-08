/**
 * Beschwörungen (Runde 9 / P1): eigene Wesen, die Fähigkeiten rufen (`units.summons`).
 *
 *  - `walk`: erscheint auf dem Pfad nahe dem Beschwörer (Fortschritt der nächsten Pfad-Stichprobe), läuft den anrückenden Gegnern entgegen
 *    (nur begrenzt weit von ihrem Ausgangspunkt weg), kämpft mit eigenem Angriff und hält Bodengegner auf (`blocks`). Flieger und Bosse
 *    lassen sich nicht aufhalten. Jeder aufgehaltene Gegner zehrt an der Haltbarkeit (Standard-Gegner 1, Elite `ELITE_WEIGHT` je Tick).
 *  - `stand`: steht auf einem festen Platz neben dem Beschwörer und schießt.
 *  - Der Schaden gehört dem Beschwörer (Meta-Mods, Statistik); die Wucht ist `damageMult` x Stufen-Schaden des Beschwörers.
 *  - Ende: Lebensdauer um, Haltbarkeit 0 (fällt im Kampf) oder der Beschwörer verschwindet (Verkauf). Optional ein letzter Schlag (`endAttack`).
 * Reihenfolge je Tick: Bewegung der Gegner (dort wird aufgehalten) -> Einheiten -> Beschwörungen (hier).
 */
import { dist2, mulBp } from '../fixed.js';
import { positionAt } from '../path.js';
import type { SummonDef } from '../data/compile.js';
import type { EnemyState, SummonState, UnitState, World } from '../state.js';
import { strike } from './attack.js';
import { selectTarget } from './target.js';

/** DESIGN: eine Elite zehrt dreimal so stark an einer aufhaltenden Beschwörung wie ein Standard-Gegner. */
export const ELITE_WEIGHT = 3;
/** DESIGN: so weit (Milli-Tiles Pfadlänge) entfernt sich eine laufende Beschwörung höchstens von ihrem Ausgangspunkt. */
const LEASH = 8000;
/** Plätze der stehenden Beschwörungen um den Beschwörer (Milli-Tiles). */
const SLOTS: readonly (readonly [number, number])[] = [
  [800, 0],
  [-800, 0],
  [0, 800],
  [0, -800],
  [600, 600],
  [-600, 600],
  [600, -600],
  [-600, -600],
];

export const summonsOf = (w: World): SummonState[] => w.state.summons ?? [];

/** Anzahl der Beschwörungen dieses Beschwörers mit dieser Art. */
export function summonCount(w: World, parent: number, def: string): number {
  let n = 0;
  for (const s of summonsOf(w)) if (s.parent === parent && s.def === def) n++;
  return n;
}

function nearestProgress(w: World, x: number, y: number): number {
  const samples = w.ctx.path.samples;
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const d = dist2(x, y, samples[i].x, samples[i].y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return Math.min(best * 100, w.ctx.path.length);
}

function endSummon(w: World, s: SummonState, cause: 'life' | 'dead' | 'parent' | 'blast'): void {
  w.events.push({ type: 'summonEnd', tick: w.state.tick, summonId: s.id, def: s.def, cause, x: s.x, y: s.y });
}

/** Ruft `count` Wesen. Am Limit (`cap` je Beschwörer und Art) weicht das älteste. */
export function spawnSummons(w: World, parent: UnitState, defId: string, count: number): void {
  const { state, ctx } = w;
  const sd: SummonDef | undefined = ctx.summons[defId];
  if (!sd) return;
  const list = (state.summons ??= []);
  const home = sd.mode === 'walk' ? nearestProgress(w, parent.x, parent.y) : 0;
  for (let k = 0; k < count; k++) {
    const mine = list.filter((s) => s.parent === parent.id && s.def === defId);
    if (mine.length >= sd.cap) {
      const old = mine[0];
      list.splice(list.indexOf(old), 1);
      endSummon(w, old, 'life');
    }
    let slot = 0;
    if (sd.mode === 'stand') {
      const used = new Set(list.filter((s) => s.parent === parent.id).map((s) => s.slot));
      while (used.has(slot) && slot < SLOTS.length - 1) slot++;
    }
    const spread = (k - (count - 1) / 2) * 600;
    const prog = sd.mode === 'walk' ? Math.max(0, Math.min(ctx.path.length, home + Math.round(spread))) : 0;
    const p = sd.mode === 'walk' ? positionAt(ctx.path, prog) : { x: parent.x + SLOTS[slot][0], y: parent.y + SLOTS[slot][1] };
    const s: SummonState = {
      id: state.nextId++,
      def: defId,
      owner: parent.owner,
      parent: parent.id,
      x: p.x,
      y: p.y,
      progress: prog,
      frac: 0,
      life: sd.lifeTicks > 0 ? sd.lifeTicks : -1,
      hp: sd.durabilityTicks,
      cd: Math.min(sd.spaTicks, 10),
      home: prog,
      slot,
    };
    list.push(s);
    w.events.push({ type: 'summonSpawn', tick: state.tick, summonId: s.id, def: defId, name: sd.name, parent: parent.id, x: s.x, y: s.y });
  }
}

/** Gegner, die gerade an einer aufhaltenden Beschwörung hängen: bremst `moveEnemies`. Gibt die Beschwörung zurück oder null. */
export function blockerOf(w: World, e: EnemyState): SummonState | null {
  const list = w.state.summons;
  if (!list || list.length === 0 || e.flying || e.boss) return null;
  const r = w.ctx.data.economy.targeting.enemyRadiusMilli;
  for (const s of list) {
    const sd = w.ctx.summons[s.def];
    if (!sd.blocks || sd.mode !== 'walk' || s.hp <= 0) continue;
    const reach = sd.contactMilli + r;
    if (dist2(e.x, e.y, s.x, s.y) <= reach * reach) return s;
  }
  return null;
}

/** Wird von `moveEnemies` gerufen, wenn `s` den Gegner `e` in diesem Tick aufgehalten hat. */
export function holdEnemy(s: SummonState, e: EnemyState): void {
  s.hp -= e.elite ? ELITE_WEIGHT : 1;
}

function ownerUnit(w: World, id: number): UnitState | undefined {
  return w.state.units.find((u) => u.id === id);
}

/** Schaden je Schlag einer Beschwörung (Centi-HP): absolut, sonst Vielfaches des Stufen-Schadens des Beschwörers. */
const baseDamage = (sd: SummonDef, parentCenti: number): number => (sd.damageCenti > 0 ? sd.damageCenti : mulBp(parentCenti, sd.damageMultBp));

function blast(w: World, s: SummonState, sd: SummonDef, parent: UnitState): void {
  if (!sd.endAttack) return;
  const eco = w.ctx.data.economy;
  const lv = w.ctx.units[parent.defId].levels[parent.level];
  const target = selectTarget(w.state.enemies, {
    ux: s.x,
    uy: s.y,
    rangeMilli: sd.rangeMilli,
    canHitAir: sd.canHitAir,
    mode: 'close',
    enemyRadiusMilli: eco.targeting.enemyRadiusMilli,
    strongestShieldBp: eco.targeting.strongestShieldBp,
  });
  if (!target) return;
  const dmg = mulBp(baseDamage(sd, lv.damageRawCenti), sd.endDamageMultBp);
  strike(w, parent, sd, s, sd.endAttack, dmg, sd.rangeMilli, target, { damageBp: 0, tempoBp: 0, rangeBp: 0, selfBp: 0, critBp: 0 }, 0, false);
}

/** Pro Tick: Lebensdauer, Verschwinden mit dem Beschwörer, Bewegung, Angriff. Läuft nach den Units. */
export function runSummons(w: World): void {
  const { state, ctx } = w;
  const list = state.summons;
  if (!list || list.length === 0) return;
  const eco = ctx.data.economy;
  const keep: SummonState[] = [];
  for (const s of list) {
    const sd = ctx.summons[s.def];
    const parent = ownerUnit(w, s.parent);
    if (!parent) {
      endSummon(w, s, 'parent');
      continue;
    }
    if (s.life > 0) s.life--;
    const dead = s.hp <= 0;
    if (dead || s.life === 0) {
      endSummon(w, s, dead ? 'dead' : 'life');
      blast(w, s, sd, parent);
      continue;
    }
    keep.push(s);
    if (s.cd > 0) s.cd--;
    const lv = ctx.units[parent.defId].levels[parent.level];
    // Bewegung (walk): dem nächsten anrückenden Gegner entgegen, solange keiner in Reichweite ist
    const inRange = selectTarget(state.enemies, {
      ux: s.x,
      uy: s.y,
      rangeMilli: sd.rangeMilli,
      canHitAir: sd.canHitAir,
      mode: 'first',
      enemyRadiusMilli: eco.targeting.enemyRadiusMilli,
      strongestShieldBp: eco.targeting.strongestShieldBp,
    });
    if (sd.mode === 'walk' && !inRange) {
      let approach = false;
      for (const e of state.enemies) if (e.hp > 0 && !e.flying && e.progress < s.progress) approach = true;
      if (approach) {
        const floor = Math.max(0, s.home - LEASH);
        const k = Math.max(floor * 1000, s.progress * 1000 + s.frac - sd.speedMicro);
        s.progress = Math.floor(k / 1000);
        s.frac = k % 1000;
        const q = positionAt(ctx.path, s.progress);
        s.x = q.x;
        s.y = q.y;
      }
    }
    // Angriff
    if (!sd.attack || s.cd > 0 || !inRange) continue;
    const dmg = baseDamage(sd, lv.damageRawCenti);
    strike(w, parent, sd, s, sd.attack, dmg, sd.rangeMilli, inRange, { damageBp: 0, tempoBp: 0, rangeBp: 0, selfBp: 0, critBp: 0 }, 0, false);
    s.cd = sd.spaTicks;
  }
  state.summons = keep;
}
