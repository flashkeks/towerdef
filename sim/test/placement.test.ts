import { describe, expect, it } from 'vitest';
import { runMatch } from '../src/bots/index.js';
import { pathClearance } from '../src/path.js';
import { at, createSim, ctxFor, enemy, richData, slotsOf } from './helpers.js';

const mk = (players = 1) => createSim({ stage: 'standard20', difficulty: 'normal', players, seed: 1, data: richData() });
const place = (sim: ReturnType<typeof mk>, unitId: string, x: number, y: number, player = 0) => sim.apply(player, { type: 'place', unitId, x, y });
const reason = (r: { ok: boolean; reason?: string }): string | undefined => (r.ok ? undefined : r.reason);

// Karte (Milli-Tiles): Pfad (0,1)-(13,1)-(13,4)-(2,4)-(2,7)-(13,7)-(13,8), Breite 1 Tile (halbe Breite 500), Raster 17 x 11 Kacheln
// (Kartenrand -500..16500 x -500..10500). Striker/Gunner-Radius 400, Farm 900.
describe('Freie Platzierung: Kollision und Fehlergründe', () => {
  it('Pfad: Mitte auf dem Pfad oder näher als Pfadrand + Radius ist `on-path`, genau am Rand ist erlaubt', () => {
    const sim = mk();
    expect(reason(place(sim, 'striker', 5000, 1000))).toBe('on-path'); // mitten auf dem Pfad (Strecke y = 1)
    expect(reason(place(sim, 'striker', 5000, 4000))).toBe('on-path'); // Strecke y = 4
    expect(reason(place(sim, 'striker', 5000, 1400))).toBe('on-path'); // 400 von der Mitte: Kreis ragt in das Pfadband
    expect(reason(place(sim, 'striker', 2000, 5500))).toBe('on-path'); // Strecke x = 2 (y 4..7)
  });
  it('Pfadabstand ganzzahlig und exakt: 900 (halbe Breite 500 + Radius 400) ist ok, 899 nicht', () => {
    const sim = mk();
    // Bodenreihe 3: y = 3000 liegt 1000 vom Pfad bei y = 4000; y = 3100 liegt genau 900 entfernt, 3101 ist zu nah
    expect(place(sim, 'striker', 5000, 3100).ok).toBe(true);
    expect(reason(place(sim, 'striker', 9000, 3101))).toBe('on-path');
    // senkrecht zur Pfadstrecke bei x = 13: x = 12100 (13000 - 900) ok, 12101 nicht
    expect(sim.canPlace(0, 'striker', 12101, 2500)).toBe('on-path');
    expect(sim.canPlace(0, 'striker', 12100, 2500)).toBeNull();
  });
  it('Pfadabstand an Ecken und Enden (Endpunkt-Abstand, nicht Strecken-Inneres)', () => {
    const ctx = ctxFor();
    // Außenseite der Ecke (13, 1) = (13000, 1000): der Abstand zum Eckpunkt entscheidet (runde Ecke)
    expect(pathClearance(ctx.path, 13600, 400, 900)).toBe(false); // sqrt(600^2 + 600^2) = 848 < 900
    expect(pathClearance(ctx.path, 13700, 400, 900)).toBe(true); // sqrt(700^2 + 600^2) = 921 >= 900
    // Spawn (0, 1): hinter dem Startpunkt zählt der Abstand zum Startpunkt
    expect(pathClearance(ctx.path, -800, 1000, 900)).toBe(false);
    expect(pathClearance(ctx.path, -900, 1000, 900)).toBe(true);
  });
  it('Kartenrand: Kreis darf den Rand berühren, nicht überragen (`out-of-bounds`)', () => {
    const sim = mk();
    // Reihe 10 (y = 10000) ist unten Boden; unterer Kartenrand bei 10500, Radius 400
    expect(sim.canPlace(0, 'striker', 8000, 10100)).toBeNull();
    expect(sim.canPlace(0, 'striker', 8000, 10101)).toBe('out-of-bounds');
    expect(sim.canPlace(0, 'striker', 8000, -101)).toBe('out-of-bounds');
    expect(sim.canPlace(0, 'striker', -101, 3000)).toBe('out-of-bounds');
    expect(sim.canPlace(0, 'striker', 16101, 5000)).toBe('out-of-bounds');
    expect(sim.canPlace(0, 'striker', -100, 3000)).toBeNull();
  });
  it('Blockierte Kacheln (Bäume/Felsen): Kreis, der eine `#`-Kachel berührt, ist erlaubt, überlappt er sie, `blocked`', () => {
    const sim = mk();
    // Kachel (6, 0) ist blockiert: x 5500..6500, y -500..500. Ground-Zone Reihe 0.
    expect(sim.canPlace(0, 'striker', 6000, 0)).toBe('blocked');
    expect(sim.canPlace(0, 'striker', 5101, 0)).toBe('blocked'); // 5101 + 400 = 5501 > 5500: überlappt
    expect(sim.canPlace(0, 'striker', 5100, 0)).toBeNull(); // berührt nur
  });
  it('Zonen: Boden-Unit nur auf Boden, Hügel-Unit nur auf Hügel, Hybrid auf beidem (`wrong-zone`)', () => {
    const sim = mk();
    expect(sim.zoneAt(3000, 2000)).toBe('hill');
    expect(sim.zoneAt(3000, 3000)).toBe('ground');
    expect(sim.canPlace(0, 'striker', 3000, 2000)).toBe('wrong-zone');
    expect(sim.canPlace(0, 'striker', 3000, 3000)).toBeNull();
    expect(sim.canPlace(0, 'gunner', 3000, 3000)).toBe('wrong-zone');
    expect(sim.canPlace(0, 'gunner', 3000, 2000)).toBeNull();
    for (const hybrid of ['banner', 'lancer', 'frost']) {
      expect(sim.canPlace(0, hybrid, 3000, 2000)).toBeNull();
      expect(sim.canPlace(0, hybrid, 6500, 3000)).toBeNull();
    }
    // die Zone entscheidet die Kachel unter der Mitte: Mitte knapp auf der Hügel-Seite der Kante y = 2500
    expect(sim.canPlace(0, 'gunner', 6000, 2499)).toBeNull();
    expect(sim.canPlace(0, 'gunner', 6000, 2500)).toBe('wrong-zone');
  });
  it('Überlappung: Abstand kleiner als die Summe der Radien ist `overlap` (auch zwischen Spielern), Berühren ist erlaubt', () => {
    const sim = mk(2);
    expect(place(sim, 'striker', 3000, 3000).ok).toBe(true);
    expect(reason(place(sim, 'striker', 3799, 3000))).toBe('overlap');
    expect(reason(place(sim, 'striker', 3000, 3000, 1))).toBe('overlap');
    expect(place(sim, 'striker', 3800, 3000, 1).ok).toBe(true); // 800 = 400 + 400
    // diagonal (Wurzel aus der Summe der Quadrate, ganzzahlig verglichen)
    expect(place(sim, 'striker', 15000, 6000).ok).toBe(true);
    expect(sim.canPlace(0, 'striker', 15566, 6566)).toBeNull(); // 800,2
    expect(sim.canPlace(0, 'striker', 15565, 6565)).toBe('overlap'); // 799,0
  });
  it('Die Farm (2x2) hat den großen Radius: 900 + 400 Abstand zu anderen, 1400 zum Pfad', () => {
    const sim = mk();
    expect(sim.canPlace(0, 'farm', 15000, 2500)).toBeNull();
    expect(sim.canPlace(0, 'farm', 14399, 2500)).toBe('on-path'); // neben der Strecke x = 13: 13000 + 500 + 900 = 14400
    expect(sim.canPlace(0, 'farm', 14400, 2500)).toBeNull();
    expect(place(sim, 'striker', 15000, 5000).ok).toBe(true);
    expect(reason(place(sim, 'farm', 15000, 6299))).toBe('overlap');
    expect(place(sim, 'farm', 15000, 6300).ok).toBe(true);
    // schmale Bodenreihe neben dem Pfad: für die Farm zu eng
    expect(sim.canPlace(0, 'farm', 5000, 3000)).toBe('on-path');
  });
  it('Nicht ganzzahlige Position wird abgelehnt (`invalid-position`)', () => {
    const sim = mk();
    expect(reason(place(sim, 'striker', 3000.5, 3000))).toBe('invalid-position');
    expect(reason(place(sim, 'striker', 3000, Number.NaN))).toBe('invalid-position');
  });
  it('Reihenfolge der Gründe: Rand vor Pfad vor Blockiert vor Zone vor Überlappung vor Geld', () => {
    const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 }); // 1000 Münzen
    expect(sim.canPlace(0, 'striker', -3000, 1000)).toBe('out-of-bounds');
    expect(sim.canPlace(0, 'striker', 6000, 1000)).toBe('on-path');
    expect(sim.canPlace(0, 'titan', 3000, 3000)).toBe('wrong-zone');
    expect(place(sim, 'titan', 3000, 2000).ok).toBe(true);
    expect(sim.canPlace(0, 'striker', 3000, 2000)).toBe('wrong-zone');
    expect(sim.canPlace(0, 'gunner', 3000, 2000)).toBe('overlap');
    expect(sim.canPlace(0, 'gunner', 6000, 2000)).toBe('not-enough-coins');
  });
  it('Die früheren Slot-Positionen sind weiter gültig (jede an ihrer Art, mit der passenden Unit)', () => {
    const sim = mk();
    for (const s of sim.slotCenters()) {
      const unit = s.size === 2 ? 'farm' : s.kind === 'hill' ? 'gunner' : 'striker';
      expect(sim.canPlace(0, unit, s.x, s.y), `Slot ${s.id} (${s.x}, ${s.y})`).toBeNull();
    }
    // und alle gleichzeitig: keine Slots überlappen (Slots sind 3 Kacheln, Farms 3 Kacheln auseinander)
    for (const s of sim.slotCenters()) {
      const unit = s.size === 2 ? 'farm' : s.kind === 'hill' ? 'gunner' : 'striker';
      expect(place(sim, unit, s.x, s.y).ok, `Slot ${s.id}`).toBe(true);
    }
  });
});

describe('Kein Limit je Unit-Typ', () => {
  it('15 gleiche Units setzen ohne `cap-reached` (Runde 6, ENTSCHEIDUNGEN.md Platzierung)', () => {
    const sim = mk();
    let placed = 0;
    for (const p of sim.placementGrid('striker')) {
      if (placed >= 15) break;
      const r = place(sim, 'striker', p.x, p.y);
      if (r.ok) placed++;
      else expect(r.reason).not.toBe('cap-reached');
    }
    expect(placed).toBe(15);
    expect(sim.state.units.filter((u) => u.defId === 'striker')).toHaveLength(15);
    // auch teure Typen: 4 Titans (früher Cap 2), 8 Farms-Platz vorausgesetzt nur 2 sind geplant, hier 3
    for (const p of sim.placementGrid('titan').slice(0, 400)) {
      if (sim.state.units.filter((u) => u.defId === 'titan').length >= 4) break;
      place(sim, 'titan', p.x, p.y);
    }
    expect(sim.state.units.filter((u) => u.defId === 'titan')).toHaveLength(4);
    for (const p of sim.placementGrid('farm')) {
      if (sim.state.units.filter((u) => u.defId === 'farm').length >= 3) break;
      place(sim, 'farm', p.x, p.y);
    }
    expect(sim.state.units.filter((u) => u.defId === 'farm')).toHaveLength(3);
  });
  it('`cap` gibt es weder in den Daten noch im Katalog', () => {
    const sim = mk();
    for (const d of sim.catalog()) expect('cap' in d).toBe(false);
    expect(JSON.stringify(ctxFor().data.units)).not.toContain('"cap"');
    expect(slotsOf(sim, 'ground').length).toBeGreaterThan(0); // Altbestand bleibt als Daten
  });
  it('Technische Grenzen bleiben: `team-limit` bei 60 Units, `team-slots` bei 7. Typ', () => {
    const sim = mk();
    let n = 0;
    for (let y = -500; y <= 10500 && n < 60; y += 400) {
      for (let x = -500; x <= 16500 && n < 60; x += 400) if (place(sim, 'striker', x, y).ok) n++;
    }
    expect(n).toBe(60);
    const spot = sim.placementGrid('striker').find((p) => sim.canPlace(0, 'striker', p.x, p.y) === 'team-limit');
    expect(spot).toBeDefined();
    const sim2 = mk();
    const types = ['striker', 'gunner', 'blaster', 'banner', 'lancer', 'frost'];
    for (const t of types) {
      const p = sim2.placementGrid(t).find((q) => sim2.canPlace(0, t, q.x, q.y) === null)!;
      expect(place(sim2, t, p.x, p.y).ok).toBe(true);
    }
    const p7 = sim2.placementGrid('titan').find((q) => sim2.canPlace(0, 'titan', q.x, q.y) === 'team-slots');
    expect(p7).toBeDefined();
  });
});

describe('Determinismus und Zustand', () => {
  const script = (sim: ReturnType<typeof mk>): void => {
    place(sim, 'striker', 3100, 3000);
    place(sim, 'gunner', 7250, 2250);
    place(sim, 'blaster', 8000, 3000);
    place(sim, 'striker', 3100, 3000); // abgelehnt
    sim.step(900);
  };
  it('gleiche Befehle -> gleicher Hash; andere Position -> anderer Hash', () => {
    const a = mk();
    const b = mk();
    script(a);
    script(b);
    expect(a.hash()).toBe(b.hash());
    const c = mk();
    place(c, 'striker', 3100, 3000);
    const d = mk();
    place(d, 'striker', 3101, 3000);
    expect(c.hash()).not.toBe(d.hash());
  });
  it('Einheit steht an der gesetzten Position (Milli-Tiles) und das Place-Ereignis nennt x, y', () => {
    const sim = mk();
    const r = place(sim, 'gunner', 7250, 2250);
    expect(r.ok).toBe(true);
    const u = sim.state.units[0];
    expect([u.x, u.y]).toEqual([7250, 2250]);
    const ev = sim.drainEvents().find((e) => e.type === 'place');
    expect(ev).toMatchObject({ type: 'place', unit: 'gunner', x: 7250, y: 2250 });
  });
  it('Reichweite und Zielwahl laufen von der freien Position aus: Gegner knapp in / knapp außer Reichweite', () => {
    const rad = ctxFor().data.economy.targeting.enemyRadiusMilli;
    const range = ctxFor().units['striker'].levels[0].rangeMilli;
    for (const [dx, hit] of [[range + rad, true], [range + rad + 1, false]] as const) {
      const sim = mk();
      expect(place(sim, 'striker', 6137, 3011).ok).toBe(true); // krumme Position, kein Slot
      const e = enemy(ctxFor(), 'grunt', 1, { x: 6137 + dx, y: 3011, stunTicks: 100000 }, 500);
      (sim.state as { enemies: unknown[] }).enemies.push(e);
      sim.step(1);
      expect(e.hp < e.maxHp, `dx=${dx}`).toBe(hit);
    }
  });
  it('Abdeckung je Position: gleiche Werte bei Wiederholung (Cache) und wie Brute-Force über den Pfad', () => {
    const sim = mk();
    const brute = (x: number, y: number, r: number): number => {
      let n = 0;
      for (const p of sim.pathSamples()) if ((x - p.x) ** 2 + (y - p.y) ** 2 <= r * r) n++;
      return Math.min(n * 100, 42000);
    };
    for (const [x, y, r] of [[3000, 3000, 3000], [7250, 5500, 4500], [15000, 5000, 6000], [100, 100, 3500]] as const) {
      expect(sim.coverage(x, y, r)).toBe(brute(x, y, r));
      expect(sim.coverage(x, y, r)).toBe(brute(x, y, r));
    }
  });
  it('Raster-Kandidaten: nur statisch gültige Positionen, Halbkachel-Raster, Altbestand-Slots sind darin enthalten', () => {
    const sim = mk();
    const grid = sim.placementGrid('striker');
    expect(grid.length).toBeGreaterThan(100);
    for (const p of grid) {
      expect(p.x % 500).toBe(0);
      expect(p.y % 500).toBe(0);
      expect(sim.canPlace(0, 'striker', p.x, p.y)).toBeNull();
    }
    for (const s of sim.slotCenters().filter((x) => x.kind === 'ground' && x.size === 1)) {
      expect(grid.some((p) => p.x === s.x && p.y === s.y)).toBe(true);
    }
    expect(at(sim, 0)).toEqual({ x: 2000, y: 0 });
  });
});

describe('Bots setzen frei', () => {
  it('Bot-Units überlappen nie, stehen in der richtigen Zone und abseits des Pfads (alle Bots, Wave 6)', () => {
    for (const bot of ['greedy', 'farm', 'aoe', 'upgrade', 'wide', 'coop']) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 4, bots: [bot], maxTicks: 6 * 900 });
      expect(r.finalUnits.length, bot).toBeGreaterThan(2);
      const sim = mk();
      // dieselben Endpositionen auf einer frischen Sim wieder setzen: jede Platzierung muss gültig sein (Reihenfolge egal, weil nie überlappend)
      for (const u of r.finalUnits) {
        const res = place(sim, u.unit, u.x, u.y);
        expect(res.ok, `${bot}: ${u.unit} (${u.x}, ${u.y}) -> ${reason(res)}`).toBe(true);
      }
    }
  });
  it('kein Bot erreicht in einem Lauf die technische Grenze `teamUnits` (60)', () => {
    for (const bot of ['greedy', 'farm', 'aoe', 'wide']) {
      const r = runMatch({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 2, bots: [bot] });
      expect(r.peakUnits, bot).toBeLessThan(60);
    }
  });
});
