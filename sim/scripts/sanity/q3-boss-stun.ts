/**
 * P3 Frage 3: Dauer-Stun auf Bosse? Maximal-CC-Aufbau: Frost-Units (Cap 3 je Spieler) auf den Slots mit der
 * größten Pfadabdeckung (Radius 2,5 Tiles), voll ausgebaut, Fähigkeit wird in JEDEM Tick ausgelöst, sobald sie bereit ist.
 * Gemessen wird je Boss (Wave 10 und 20): Anteil der Lebenszeit im Stun / Slow / Stun-Sperre, längster Stun am Stück,
 * kleinster Abstand zwischen zwei Stuns und Verzögerung gegenüber unbeeinflusstem Lauf.
 * godMode (Base-HP sinkt nicht), damit der Boss auch ohne Verteidigung bis zum Ende läuft.
 * Aufruf: npx tsx scripts/sanity/q3-boss-stun.ts
 */
import { createSim, type Sim } from '../../src/index.js';
import { patched, table, f1 } from './lib.js';

interface Track {
  life: number;
  stun: number;
  slow: number;
  immune: number;
  longest: number;
  cur: number;
  lastEnd: number;
  minGap: number;
  stunCount: number;
  speedMicro: number;
  lastProgress: number;
  lastStun: boolean;
}

function scenario(players: number, frostsPerPlayer: number, extra: 'none' | 'dps', wave: number, difficulty: 'normal' | 'nightmare' = 'normal') {
  const data = patched((d) => {
    d.economy.startCoins = 400_000;
  });
  const sim: Sim = createSim({ stage: 'standard20', difficulty, players, seed: 7, data, godMode: true });
  const slots = sim.slots().filter((s) => s.size === 1).sort((a, b) => b.coverageByRange(2500) - a.coverageByRange(2500) || a.id - b.id);
  let si = 0;
  const frosts: number[] = [];
  for (let k = 0; k < frostsPerPlayer; k++) {
    for (let p = 0; p < players; p++) {
      const r = sim.apply(p, { type: 'place', unitId: 'frost', slot: slots[si++].id });
      if (!r.ok) throw new Error(`frost: ${r.reason}`);
      frosts.push((r as { entityId: number }).entityId);
    }
  }
  const upAll = (): void => {
    for (const id of frosts) {
      const owner = sim.state.units.find((u) => u.id === id)?.owner as number;
      while (sim.apply(owner, { type: 'upgrade', entityId: id }).ok);
    }
  };
  upAll();
  if (extra === 'dps') {
    // zusätzlich je Spieler Titan + Gunner/Striker, damit der Boss realistisch stirbt
    for (let p = 0; p < players; p++) {
      for (const u of ['titan', 'titan', 'striker', 'striker', 'striker', 'gunner', 'gunner', 'gunner']) {
        const free = sim.slots().filter((s) => s.free && s.size === 1 && (u === 'titan' || u === 'gunner' ? s.kind === 'hill' : s.kind === 'ground'));
        if (!free.length) continue;
        const r = sim.apply(p, { type: 'place', unitId: u, slot: free[0].id });
        if (r.ok) while (sim.apply(p, { type: 'upgrade', entityId: (r as { entityId: number }).entityId }).ok);
      }
    }
  }
  const tracks = new Map<number, Track>();
  const seen = new Set<number>();
  const finished: Track[] = [];
  let bossWave = 0;
  const step = (): void => {
    const st = sim.state;
    // Fähigkeiten feuern, sobald bereit (Kern lehnt ab, wenn kein wirksames Ziel)
    for (const u of st.units) if (u.defId === 'frost' && u.abilityCd <= 0) sim.apply(u.owner, { type: 'useAbility', entityId: u.id });
    const alive = new Set<number>();
    for (const e of st.enemies) {
      if (!e.boss || e.hp <= 0 || e.wave !== wave) continue;
      alive.add(e.id);
      let t = tracks.get(e.id);
      if (!t) {
        t = { life: 0, stun: 0, slow: 0, immune: 0, longest: 0, cur: 0, lastEnd: -1, minGap: 1e9, stunCount: 0, speedMicro: e.speedMicro, lastProgress: 0, lastStun: false };
        tracks.set(e.id, t);
        seen.add(e.id);
        bossWave = e.wave;
      }
      t.life++;
      t.lastProgress = e.progress;
      const stunned = e.stunTicks > 0;
      if (stunned) {
        t.stun++;
        t.cur++;
        if (!t.lastStun) {
          t.stunCount++;
          if (t.lastEnd >= 0) t.minGap = Math.min(t.minGap, st.tick - t.lastEnd);
        }
      } else {
        if (t.lastStun) t.lastEnd = st.tick;
        t.longest = Math.max(t.longest, t.cur);
        t.cur = 0;
      }
      t.lastStun = stunned;
      if (e.slowTicks > 0) t.slow++;
      if (e.stunImmune > 0) t.immune++;
    }
    for (const [id, t] of tracks) if (!alive.has(id)) {
      t.longest = Math.max(t.longest, t.cur);
      finished.push(t);
      tracks.delete(id);
    }
  };
  while (!sim.isOver() && sim.state.wave <= wave + 1) {
    step();
    sim.step(1);
  }
  for (const t of tracks.values()) finished.push(t);
  return { finished, bossWave };
}

const rows: (string | number)[][] = [];
const defs: [string, number, number, 'none' | 'dps'][] = [
  ['1P, 3 Frost, nur Frost', 1, 3, 'none'],
  ['4P, 12 Frost (Cap), nur Frost', 4, 3, 'none'],
  ['4P, 12 Frost + je Spieler 2 Titan/3 Striker/3 Gunner', 4, 3, 'dps'],
];
for (const [name, p, f, ex] of defs) {
  for (const wave of [10, 20]) {
    const { finished } = scenario(p, f, ex, wave);
    const t = finished[0];
    if (!t) {
      rows.push([name, wave, 'Boss nicht gesehen']);
      continue;
    }
    const nominal = (t.lastProgress * 1000) / t.speedMicro;
    rows.push([
      name,
      wave,
      f1(t.life / 20),
      f1((t.stun / t.life) * 100),
      f1((t.slow / t.life) * 100),
      f1((t.immune / t.life) * 100),
      f1(t.longest / 20),
      t.stunCount,
      t.minGap < 1e9 ? f1(t.minGap / 20) : '-',
      f1(t.life / nominal),
    ]);
  }
}
console.log(table(['Aufbau', 'Boss-Wave', 'Lebenszeit s', 'Stun %', 'Slow %', 'Sperre %', 'längster Stun s', '#Stuns', 'min. Abstand Stun-Ende zu -Beginn s', 'Laufzeit-Faktor (1 = unbeeinflusst)'], rows));
console.log('\nTheorie: Boss-Stun 1,5 s x 0,5 = 0,75 s, danach 6 s Sperre => Zyklus 6,75 s, max. Stun-Anteil 11,1 %.');
