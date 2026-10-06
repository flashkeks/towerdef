# sim - deterministischer Simulationskern

Headless-Spielkern des Tower Defense (TypeScript strict, ESM, Node 22). Keine Browser-/Render-Abhängigkeiten.
Regeln und Startwerte: `docs/comparison/recommendations.md`; offene Entscheidungen: `docs/balancing/offene-regeln.md`.

## Start

```bash
cd sim && npm install
npm test            # vitest (alle Pflicht-Tests)
npm run typecheck   # tsc --noEmit
npm run build       # optional, nach dist/
npx tsx scripts/bench.ts   # Ticks/s einer 20-Wave-Stage ohne Bot
```

## Einheiten und Festkomma-Konventionen

| Größe | Einheit |
|---|---|
| Zeit | Ticks, **20 Ticks/s** (Wave-Timer 45 s = 900 Ticks) |
| Position/Distanz | Milli-Tiles (1 Tile = 1000); Stage-JSON nennt Tiles, Laden rundet auf Milli-Tiles |
| Geschwindigkeit | Fortschritt in Milli-Tiles + Rest in Mikro-Milli-Tiles (`progress`, `frac` 0..999); Basis Grunt 1,5 Tiles/s = 75 000 Mikro/Tick |
| HP/Schaden | Centi-HP (1 HP = 100), Mindestschaden 100 |
| Multiplikatoren | Basispunkte (10000 = x1,0) |
| Geld | ganze Münzen |

- Kein `Math.random`, `Date.now` oder Float im Zustand (`hash()` wirft bei nicht-ganzzahligen Werten).
- Produktketten in fester Reihenfolge, **nach jedem Faktor `Math.floor`** (`src/damage.ts`, `src/systems/spawn.ts`). Alle Zwischenwerte < 2^53.
- HP-Kurve `25 * 1,12^(n-1)` und Bounty `0,70 * 0,92^(n-1) * HP` werden exakt per BigInt-Potenz vorberechnet (nur beim Laden).
- Abstände per Quadratvergleich bzw. Integer-Sqrt (`isqrt`); Linie/Kegel mit auf ~1024 normierter Richtung.
- PRNG: sfc32 (4 x uint32, im Zustand, serialisierbar), Seed per splitmix32. Nur Crit-Units verbrauchen Zufallszahlen.
- Iteration nur über Arrays in aufsteigender Entity-ID (IDs sind ein gemeinsamer, aufsteigender Zähler).
- Hash: stabile Serialisierung (sortierte Keys) + FNV-1a 64 Bit (selbst implementiert), 16 Hex-Zeichen.

## Aufbau

```
sim/
  data/            economy, enemies, modifiers, difficulties, units (JSON, jede Gruppe mit "ref"), stages/standard20.json
  src/
    fixed.ts prng.ts hash.ts   Festkomma, PRNG, Hash
    data/schema.ts (zod)  load.ts (lesen + Querprüfungen)  compile.ts (abgeleitete Tabellen, Level-Stats)
    path.ts            Polylinie, Position aus Distanz, Abdeckung je Slot
    damage.ts          Schadensformel §10, Element-Zyklus
    state.ts           Zustands- und Event-Typen
    systems/           waves, spawn, effects (Stun/Slow/DoT/Regen), move (+Leaks), attack (+Targeting), target, abilities, economy
    commands.ts        Befehle; sim.ts Fassade; index.ts öffentliche API
  test/                vitest (Determinismus, Einkommen, Schaden, Leaks, Ökonomie, Targeting, Status, Pool, Kampf)
```

Tick-Reihenfolge: Waves -> Spawns -> Status/DoT/Regen -> Tode -> Bewegung/Leaks (Niederlage) -> Units (Angriffe) -> Tode -> Sieg-Prüfung -> `tick++`.

## API

```ts
import { createSim } from './src/index.js';
const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
sim.apply(0, { type: 'place', unitId: 'striker', slot: 0 });   // {ok:true, entityId} | {ok:false, reason}
sim.runWave();            // Prep -> Wave 1 bis zu deren Ende (dann läuft Wave 2 schon); letzte Wave bis Matchende
sim.step(20);             // 1 s
sim.hash(); sim.result(); sim.drainEvents();
```

`createSim`-Optionen: `stage` (ID oder `StageData`), `difficulty` (`normal|hard|nightmare`), `players` (1-4), `seed`, `data` (Override, z. B. mehr Startgeld), `godMode` (Base-HP sinkt nicht, Leaks werden gezählt), `unitMods` (Hooks je Spieler/Unit: `lvlBp`, `traitBp`, `yieldBp`, Standard x1/+0).

`Sim`: `state` (live, readonly), `apply`, `step`, `runWave`, `isOver`, `result`, `hash`, `drainEvents`, `slots()` (mit `coverageByRange(range)`), `catalog()`, `upgradeCost(entityId)`, `placeCost(unitId)`.

Befehle: `place`, `upgrade`, `sell`, `setTargeting`, `useAbility`, `skipWave` sowie (Erweiterung §16) `donate`. Ablehnungsgründe u. a.: `not-enough-coins`, `cap-reached`, `slot-occupied`, `slot-kind`, `slot-size`, `team-limit`, `team-slots`, `max-level`, `not-owner`, `ability-cooldown`, `no-next-wave`, `game-over`.
Befehle wirken zu Tick-Beginn: `apply` verändert den Zustand zwischen zwei Ticks, `skipWave` greift im nächsten Tick (Koop: mehr als die Hälfte der Spieler).

Events (`drainEvents`): `spawn`, `kill`, `leak`, `waveStart`, `waveEnd`, `income{source: waveBonus|bounty|farm|sell|donate}`, `damage` (je Unit aggregiert, bei Wave-Ende/Verkauf), `place`, `upgrade`, `sell`, `ability`, `over`.

## Daten ändern

Alle Zahlen stehen in `data/*.json` (zod-validiert beim Laden, Querverweise in `load.ts`, z. B. Leak-Werte in `economy.json` = `enemies.json`). Neue Stage = neue Datei in `data/stages/` (Waves, Slots, Pfad). Die Wave-Tabelle der Standard-Stage wurde mit `scripts/gen-stage.ts` erzeugt (Ausgabe danach von Hand kompakt formatiert).
