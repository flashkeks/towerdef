/**
 * Boss-Kits (P4, K5): Phasen nach HP-Schwelle, Schild ("ward"), Beschwörungen, Fähigkeiten mit Telegraph,
 * Schwachstellen-Fenster. Alles Ganzzahl, Iteration in aufsteigender Entity-ID, kein PRNG (rein zustandsgetrieben).
 *
 * Ablauf je Tick (nach den Spawns, vor Status-Effekten): Phasenwechsel prüfen, Fenster-/Schild-/Sturm-Timer, Abklingzeiten,
 * Telegraph herunterzählen und auflösen, neue Fähigkeit beginnen. Schaden wirkt erst im Folgetick auf die Phase.
 * Schaden und Stun greifen über `applyDamage` (Fenster x bp, Schild absorbiert) und `applyStun` (volle Dauer im Fenster,
 * Unterbrechung des Telegraphs) in effects.ts ein.
 */
import { DIFFICULTY_RANK } from '../data/compile.js';
import type { BossKit } from '../data/schema.js';
import { mulBp } from '../fixed.js';
import type { BossRun, EnemyState, World } from '../state.js';
import { createEnemy } from './spawn.js';

const gate = (w: World, min: BossKit['abilities'][number]['minDifficulty']): boolean => w.ctx.difficultyRank >= DIFFICULTY_RANK[min];

/** Öffnet (oder verlängert) das Schwachstellen-Fenster. Ein kürzeres Fenster ersetzt kein längeres. */
export function openWindow(w: World, e: EnemyState, ticks: number, bp: number, cause: 'ward' | 'cast' | 'interrupt' | 'exhaust' | 'phase', armor = -1): void {
  const run = e.bossRun as BossRun;
  if (ticks < run.vulnTicks) return;
  run.vulnTicks = ticks;
  run.vulnBp = bp;
  run.vulnArmor = armor;
  w.events.push({ type: 'bossWindow', tick: w.state.tick, enemyId: e.id, open: true, damageBp: bp, ticks, cause, armor });
}

/** Rüstung, mit der der Gegner jetzt Schaden nimmt: Fenster-Rüstung vor Phasen-Rüstung vor Basis-Rüstung (Runde 5 / P3). */
export function effectiveArmor(e: EnemyState): number {
  const run = e.bossRun;
  if (!run) return e.armor;
  if (run.vulnTicks > 0 && run.vulnArmor >= 0) return run.vulnArmor;
  return run.armor >= 0 ? run.armor : e.armor;
}

/** Schild gebrochen (von applyDamage gerufen): Fenster öffnen. */
export function wardBroken(w: World, e: EnemyState): void {
  const run = e.bossRun as BossRun;
  run.wardTicks = 0;
  w.events.push({ type: 'bossWard', tick: w.state.tick, enemyId: e.id, state: 'broken', hp: 0 });
  openWindow(w, e, run.wardWindowTicks, run.wardWindowBp, 'ward', run.wardWindowArmor);
}

function summon(w: World, e: EnemyState, type: string, count: number, born: EnemyState[]): void {
  const { state, ctx } = w;
  for (let k = 0; k < count; k++) {
    // Die Helfer erscheinen gestaffelt hinter dem Boss (je 0,5 Tile), nie vor dem Pfadanfang.
    const progress = Math.max(0, e.progress - 500 * (k + 1));
    born.push(createEnemy(ctx, state.nextId++, type, e.wave, [], ctx.difficulty.elementsActive ? e.element : 0, progress, 0, null));
  }
}

function enterPhase(w: World, e: EnemyState, kit: BossKit, born: EnemyState[]): void {
  const run = e.bossRun as BossRun;
  run.phase++;
  const ph = kit.phases[run.phase];
  run.armor = -1;
  w.events.push({ type: 'bossPhase', tick: w.state.tick, enemyId: e.id, kit: kit.id, phase: run.phase, id: ph.id, name: ph.name });
  for (const act of ph.onEnter) {
    if (!gate(w, act.minDifficulty)) continue;
    if (act.kind === 'ward') {
      run.ward = mulBp(e.maxHp, act.hpBp);
      run.wardTicks = act.expireTicks;
      run.wardWindowTicks = act.window.ticks;
      run.wardWindowBp = act.window.bp;
      run.wardWindowArmor = act.window.armor ?? -1;
      w.events.push({ type: 'bossWard', tick: w.state.tick, enemyId: e.id, state: 'up', hp: run.ward });
    } else if (act.kind === 'summon') summon(w, e, act.type, act.count, born);
    else if (act.kind === 'armor') {
      run.armor = act.value;
      w.events.push({ type: 'bossArmor', tick: w.state.tick, enemyId: e.id, armor: act.value, base: e.armor });
    } else openWindow(w, e, act.window.ticks, act.window.bp, 'phase', act.window.armor ?? -1);
  }
  kit.abilities.forEach((a, i) => {
    if (a.fromPhase === run.phase) run.cd[i] = a.firstTicks;
  });
}

function resolve(w: World, e: EnemyState, kit: BossKit, born: EnemyState[]): void {
  const run = e.bossRun as BossRun;
  const tele = run.tele as NonNullable<BossRun['tele']>;
  const a = kit.abilities[tele.ability];
  run.tele = null;
  run.cd[tele.ability] = a.cooldownTicks;
  const interrupted = a.interruptible && tele.interrupted;
  w.events.push({ type: 'bossCast', tick: w.state.tick, enemyId: e.id, kit: kit.id, ability: a.id, kind: a.kind, interrupted, cause: interrupted ? tele.cause : null });
  if (interrupted) {
    if (a.interruptWindow) openWindow(w, e, a.interruptWindow.ticks, a.interruptWindow.bp, 'interrupt', a.interruptWindow.armor ?? -1);
    if (a.interruptStunTicks && e.stunTicks < a.interruptStunTicks) e.stunTicks = a.interruptStunTicks;
    return;
  }
  if (a.kind === 'summon') summon(w, e, a.type, a.count, born);
  else if (a.kind === 'mend') {
    // Zerstörbare Heilung (P3): der bis dahin angerichtete Schaden schrumpft die Heilung linear (bei `need` wäre sie ganz weg).
    let heal = mulBp(e.maxHp, a.healBp);
    if (tele.need > 0) heal = Math.floor((heal * Math.max(0, tele.need - tele.dmg)) / tele.need);
    e.hp = Math.min(e.maxHp, e.hp + heal);
  }
  else {
    run.hasteTicks = a.durationTicks;
    run.hasteBp = a.speedBp;
    run.exhaustTicks = a.window?.ticks ?? 0;
    run.exhaustBp = a.window?.bp ?? 0;
    run.exhaustArmor = a.window?.armor ?? -1;
    return;
  }
  if (a.window) openWindow(w, e, a.window.ticks, a.window.bp, 'cast', a.window.armor ?? -1);
}

export function tickBosses(w: World): void {
  const { state, ctx } = w;
  const born: EnemyState[] = [];
  for (const e of state.enemies) {
    const run = e.bossRun;
    if (!run || e.hp <= 0) continue;
    const kit = ctx.bossKits[e.wave];
    while (run.phase + 1 < kit.phases.length && e.hp * 10000 <= kit.phases[run.phase + 1].fromHpBp * e.maxHp) enterPhase(w, e, kit, born);
    if (run.vulnTicks > 0 && --run.vulnTicks === 0) {
      run.vulnBp = 0;
      run.vulnArmor = -1;
      w.events.push({ type: 'bossWindow', tick: state.tick, enemyId: e.id, open: false, damageBp: 0, ticks: 0, cause: 'cast', armor: -1 });
    }
    if (run.ward > 0 && --run.wardTicks <= 0) {
      run.ward = 0;
      run.wardTicks = 0;
      w.events.push({ type: 'bossWard', tick: state.tick, enemyId: e.id, state: 'expired', hp: 0 });
    }
    if (run.hasteTicks > 0 && --run.hasteTicks === 0) {
      run.hasteBp = 0;
      if (run.exhaustTicks > 0) openWindow(w, e, run.exhaustTicks, run.exhaustBp, 'exhaust', run.exhaustArmor);
      run.exhaustTicks = 0;
      run.exhaustBp = 0;
      run.exhaustArmor = -1;
    }
    for (let i = 0; i < run.cd.length; i++) if (run.cd[i] > 0) run.cd[i]--;
    if (run.tele) {
      if (--run.tele.left <= 0) resolve(w, e, kit, born);
      continue;
    }
    for (let i = 0; i < kit.abilities.length; i++) {
      const a = kit.abilities[i];
      if (run.cd[i] > 0 || run.phase < a.fromPhase || (a.toPhase !== undefined && run.phase > a.toPhase) || !gate(w, a.minDifficulty)) continue;
      const need = a.staggerBp !== undefined ? mulBp(e.maxHp, a.staggerBp) : 0;
      run.tele = { ability: i, left: a.telegraphTicks, interrupted: false, dmg: 0, need, cause: null };
      w.events.push({
        type: 'bossTelegraph',
        tick: state.tick,
        enemyId: e.id,
        kit: kit.id,
        ability: a.id,
        kind: a.kind,
        warnTicks: a.telegraphTicks,
        fireTick: state.tick + a.telegraphTicks,
        interruptible: a.interruptible,
        staggerNeed: need,
      });
      break;
    }
  }
  for (const c of born) {
    state.enemies.push(c);
    state.stats.spawned++;
    w.events.push({ type: 'spawn', tick: state.tick, enemyId: c.id, enemy: c.type, wave: c.wave, summon: true });
  }
}
