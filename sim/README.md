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
  data/            economy, enemies, modifiers, difficulties, units, bosses (Kits), cards (Risikokarten) (JSON, jede Gruppe mit "ref"), stages/standard20.json
  src/
    fixed.ts prng.ts hash.ts   Festkomma, PRNG, Hash
    data/schema.ts (zod)  load.ts (lesen + Querprüfungen)  compile.ts (abgeleitete Tabellen, Level-Stats)
    path.ts            Polylinie, Position aus Distanz, Abdeckung je Slot
    damage.ts          Schadensformel §10, Element-Zyklus
    state.ts           Zustands- und Event-Typen
    systems/           waves, spawn, effects (Stun/Slow/DoT/Regen), move (+Leaks), attack (+Targeting), target, abilities, economy, boss (Kits), cards (Karten + Vorschau)
    commands.ts        Befehle; sim.ts Fassade; index.ts öffentliche API
  test/                vitest (Determinismus, Einkommen, Schaden, Leaks, Ökonomie, Targeting, Status, Pool, Kampf)
```

Tick-Reihenfolge: Waves (Wave-Ende: Lebens-Regeneration) -> Spawns -> Boss-Kits (Phasen, Telegraph, Fenster) -> Status/DoT/Regen -> Tode -> Bewegung/Leaks (Leben, Niederlage) -> Units (Angriffe) -> Tode -> Sieg-Prüfung -> `tick++`.

## API

```ts
import { createSim } from './src/index.js';
const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
sim.apply(0, { type: 'place', unitId: 'striker', slot: 0 });   // {ok:true, entityId} | {ok:false, reason}
sim.runWave();            // Prep -> Wave 1 bis zu deren Ende (dann läuft Wave 2 schon); letzte Wave bis Matchende
sim.step(20);             // 1 s
sim.hash(); sim.result(); sim.drainEvents();
```

`createSim`-Optionen: `stage` (ID oder `StageData`), `difficulty` (`normal|hard|nightmare`), `players` (1-4), `seed`, `data` (Override, z. B. mehr Startgeld), `godMode` (Leben sinken nicht, Leaks werden gezählt), `metaLives` (Meta-Ausbau der Leben, überschreibt `economy.lives.metaBonus`; Default 0), `unitMods` (Hooks je Spieler/Unit: `lvlBp`, `traitBp`, `yieldBp`, Standard x1/+0).

`Sim`: `state` (live, readonly), `apply`, `step`, `runWave`, `isOver`, `result`, `hash`, `drainEvents`, `slots()` (mit `coverageByRange(range)`), `catalog()`, `upgradeCost(entityId)`, `placeCost(unitId)`, `previewWave(n, cardId?)`, `cards()`, `bossKits()` (P4).

Befehle: `place`, `upgrade`, `sell`, `setTargeting`, `useAbility`, `skipWave`, `chooseCard` (P4) sowie (Erweiterung §16) `donate`. Ablehnungsgründe u. a.: `not-enough-coins`, `cap-reached`, `slot-occupied`, `slot-kind`, `slot-size`, `team-limit`, `team-slots`, `max-level`, `not-owner`, `ability-cooldown`, `no-next-wave`, `unknown-card`, `boss-wave`, `game-over`.
Befehle wirken zu Tick-Beginn: `apply` verändert den Zustand zwischen zwei Ticks, `skipWave` greift im nächsten Tick (Koop: mehr als die Hälfte der Spieler).

Events (`drainEvents`): `spawn`, `kill`, `leak`, `waveStart`, `waveEnd`, `income{source: waveBonus|bounty|farm|sell|donate}`, `damage` (je Unit aggregiert, bei Wave-Ende/Verkauf), `place`, `upgrade`, `sell`, `ability`, `over` sowie (P4) `bossPhase`, `bossTelegraph`, `bossCast`, `bossWindow`, `bossWard`, `cardChosen` und (Runde 5 / P3) `bossArmor` (Felder `staggerNeed`, `cause`, `armor` an den Boss-Ereignissen, siehe `docs/design/boss-telegraphs.md`); `spawn` trägt bei Beschwörungen des Bosses `summon: true`.

## Leben-System (Runde 4 / P2)

Ersetzt die Base-HP (`state.lives`, `state.maxLives`; Daten `economy.lives`: `start` 30, `metaBonus` 0 (M3), `regenPerWave` 0, `instantLoss` `["boss"]`). Das Leben-Konto ist für das ganze Team gemeinsam.

- **Leak-Kosten** je Gegner: `max(1, ceil(Basis x RestHP / MaxHP))` (`leakCost` in `src/systems/move.ts`, reine Ganzzahl-Rechnung, Schild zählt nicht). Basis = `leak` aus `enemies.json` (= `economy.leakDamage`): Grunt/Runner 2, Flyer/Splitter 3, Brute 5, Splitter-Kind 1, Elite 8.
- **Sofort verloren:** Archetypen in `instantLoss` (Boss) beenden die Runde beim Leak, unabhängig von Rest-HP und Lebensstand. Die Elite steht bewusst **nicht** drin (Begründung `kalibrierung.md`, Runde 4 - P2); per Daten umstellbar (`["boss","elite"]`).
- **Regeneration:** `regenPerWave` Leben beim Ende jeder Wave, höchstens bis `maxLives`.
- Das Leak-Event trägt `damage` (= Lebenskosten, bei Sofort-Verlust die verlorenen Restleben), `hp`, `maxHp`, `fatal`. Report-Felder `baseHpLost`/`baseHpEnd`/`baseHp` heißen aus Kompatibilität weiter so und meinen Leben.
- Die Bots lesen die Leben nicht: ein Lauf mit riesigem Startwert liefert alle Leaks, die Siegquote für beliebige Regeln lässt sich danach nachrechnen (`scripts/sanity/q9-p2.ts`, `--part raw|eval|check`).

## Stufen-Regeln (Runde 4 / P3)

Die Stufen unterscheiden sich über Regeln (`data/difficulties.json`, zod `DifficultySchema`); `hpBp` ist nur noch Feinjustierung (Normal 15600, Hard 14800, Nightmare 14600).

| Feld | Wirkung |
|---|---|
| `elementsActive`, `elementMode` | Elemente an/aus; `wave` = alle Gruppen einer Wave teilen ein Element, `mixed` = Element je Gruppe versetzt (`1 + ((e-1 + 2*Gruppe) mod 5)`) |
| `modifiers {densityBp, fromWave, pool[{id, weight}]}` | Anteil regulärer Gruppen (nie Boss/Elite, nie Gruppen mit Stage-Modifier) ab `fromWave`, die einen gewichteten Modifier aus dem Pool bekommen |
| `waveVariants[{id, chanceBp, fromWave, countBp, intervalBp, swap?, forceModifier?}]` | je Wave wird (seeded) höchstens eine Variante gewählt, in Listenreihenfolge: Anzahl-/Dichte-Faktor, Typ-Tausch (`swap.from -> to`, Anteil `shareBp`), ganze Wave mit einem Modifier |
| `lives {start?, regenPerWave?, instantLoss?}` | überschreibt `economy.lives` je Stufe (nur gesetzte Felder) |
| `bountyBp` | Münz-Faktor auf Kill-Bounties |
| `rewardBp` | Belohnungsfaktor für Meta-Belohnungen (M3); die Sim rechnet damit nicht |
| `bossAbilityTier` | 0/1/2, **Schnittstelle für P4**: Welches Boss-Fähigkeiten-Set aktiv ist. Zugriff: `ctx.difficulty.bossAbilityTier`. Die Sim wertet es nicht aus; P4 entscheidet, was Tier 0/1/2 je Boss-Kit bedeuten |

Umsetzung: `src/systems/rules.ts` (`ruleWave`, `pickVariant`), eingehängt in `getWave` (`systems/infinite.ts`), also gilt jede Wave-Quelle (Spawn, `wavePool`, später `previewWave`) einheitlich. Die Würfe sind Ganzzahl-Hashes aus (Seed, Wave, Gruppe, Salz): kein Sim-PRNG, kein Einfluss auf den Zustands-Hash, gleiche Eingabe = gleiche Wave, andere Seeds = andere Waves (das verbreitert die Kennlinie, `kalibrierung.md` Runde 4 - P3). Eine Stufe ohne Regeln (Dichte 0, keine Varianten, Modus `wave`) liefert die Stage-Waves unverändert. Infinite: nur Waves 1-20 (feste Waves) laufen durch die Regeln, erzeugte Waves nicht.

**Für P4 (`previewWave`, Risikokarten, Boss-Kits):** Vorschau = `getWave(ctx, n)` (enthält Modifier, Varianten, Elemente der Stufe); die gewählte Variante liefert `pickVariant(ctx, n)`. Boss/Elite-Gruppen werden von den Regeln nie verändert (außer dem Element im Modus `mixed`). Boss-Kits lesen `bossAbilityTier`. Boss-HP, Boss-Kits, Risikokarten bleiben bei P4.

**Challenges** (`data/challenges.json`, `ChallengesSchema`): nur Datenkonzept. Eine Challenge = Basis-Stufe (`extends`) + `overrides` (Teil von `DifficultySchema`) + `restrictions` (`bannedUnits`, `maxTeamSlots`, `noSell`) + `rewardBp`. Wird geladen und quergeprüft, die Sim wertet sie nicht aus.

**Nachkalibrieren nach dem Merge mit P4:** `sh scripts/sanity/p3-check.sh 60 TAG` (3 Stufen parallel, ca. 1,5 min): Siegquote aller Bots solo je Stufe plus Kennlinie des besten Bots (Standard `aoe` für Normal, `wide` für Hard/Nightmare, `P3_BOT=upgrade` überschreibt). Einzeln: `npx tsx scripts/sanity/p3-check.ts --part rates|curve|rules --difficulty hard --n 60`. Regeln ohne Dateiänderung testen: `P3_RULES='{"hard":{"hpBp":14600}}'` (flach je Feld, wird mit dem Schema geprüft), `P2_BOSSHP=...` für den Boss-HP-Faktor. Stellschrauben in der Reihenfolge Wirkung je Schritt (n = 40): HP ±1 % ≈ ∓6 Punkte Siegquote, Modifier-Dichte ±5 %-Punkte ≈ ∓10 Punkte, Nightmare-Startleben ±2 ≈ ∓5.

## Boss-Kits (Runde 4 / P4, K5)

Daten `data/bosses.json` (zod `BossKitSchema` in `src/data/schema.ts`, Querprüfungen in `load.ts`), Logik `src/systems/boss.ts` (`tickBosses`, nach den Spawns), Eingriffe in `applyDamage`/`applyStun` (`effects.ts`) und `moveEnemies`. Ein Kit gehört zu einer **Wave** (`wave`) und gilt für den Archetyp `boss`; zwei Kits für `standard20`: `warden` (Wave 10, "Hollow Warden") und `colossus` (Wave 20, "Rift Colossus", zitiert alle Mechaniken von Wave 10 plus Heilung). Bosse ohne Kit (Infinite ab Wave 21) bleiben schlichte HP-Klötze. Zustand je Boss: `EnemyState.bossRun` (Ganzzahlen, im Hash).

| Baustein | Regel |
|---|---|
| Phasen | `phases[]` mit `fromHpBp` (Anteil der Max-HP, fallend, Phase 0 = 10000). Wechsel in `tickBosses`, wenn `hp * 10000 <= fromHpBp * maxHp`; mehrere Schwellen in einem Tick werden der Reihe nach betreten (`bossPhase`-Ereignis je Phase). Phasen gehen nie zurück (Heilung ändert das nicht) |
| Phasen-Aktion `ward` | Schild = `hpBp` der Max-HP, läuft nach `expireTicks` ab (`bossWard: expired`). Absorbiert **alle** Schadensarten vor den HP (auch True Damage/DoT), Überschuss geht durch. Bricht er, öffnet sich das Fenster `window` (`bossWard: broken`, `bossWindow`) |
| Phasen-Aktion `summon` / `window` | Helfer erscheinen gestaffelt (0,5 Tile) hinter dem Boss (`spawn` mit `summon: true`, Wave = Boss-Wave); `window` öffnet ein Fenster |
| Fähigkeiten `abilities[]` | `summon`, `charge` (Sturm: Tempo `speedBp` für `durationTicks`), `mend` (Heilung `healBp`). Aktiv von `fromPhase` bis `toPhase`; erster Einsatz `firstTicks` nach Spawn bzw. nach Beginn der Phase `fromPhase`, danach alle `cooldownTicks`. Immer nur ein Telegraph zugleich |
| Telegraph | `bossTelegraph` zum Start (`warnTicks`, `fireTick` = Tick der Wirkung, `interruptible`), `bossCast` bei `fireTick` (`interrupted`). Der Client zeigt die Warnung in `warnTicks` Ticks (20/s) |
| Unterbrechen | Ein erfolgreicher Stun des Bosses (`applyStun`) irgendwann während des Telegraphs bricht eine `interruptible`-Fähigkeit ab (Abklingzeit läuft trotzdem; `bossCast.cause: "stun"`); optional öffnet `interruptWindow` ein Fenster und `interruptStunTicks` hält den Boss fest (P3) |
| Zerstörbare Wirkung (P3) | `staggerBp` an einer `interruptible`-Fähigkeit: Schaden während des Telegraphs (nach Fenster-Faktor, **vor** der Schild-Absorption, auch DoT) zählt in `bossRun.tele.dmg` auf die Schwelle `tele.need` = `staggerBp` der Max-HP. Ist sie erreicht, ist die Wirkung gebrochen (`cause: "damage"`, Auflösung im nächsten Boss-Tick, also **vor** `fireTick`). Eine `mend`-Heilung schrumpft linear mit dem bisherigen Schaden. Das ist die Dauerschaden-Antwort; Stun (Frost) und ein einzelner Treffer ab der Schwelle (Titan-Nuke) sind die beiden anderen. `load.ts` lehnt `staggerBp` ohne `interruptible` ab |
| Rüstung (P3) | Phasen-Aktion `{kind: "armor", value}` setzt die Rüstung des Bosses (absolut) bis zum nächsten Phasenwechsel (`bossArmor`-Ereignis); `window.armor` überstimmt sie, solange das Fenster offen ist (`effectiveArmor` in `boss.ts`, benutzt von `hitEnemy`). Mit `armor: 0` im Fenster gewinnen Units ohne Durchschlag bis zu 40 % (Rüstung 40), Lancer (Durchschlag 40) und die Titan-Nuke (True Damage) nicht |
| Schwachstellen-Fenster | `window` (nach Wirkung; bei `charge`: wenn der Sturm endet = Erschöpfung), `interruptWindow`, Schild-Bruch, Phasen-Aktion. `{ticks, bp}`: solange offen, nimmt der Boss `bp`-fachen Schaden (16000 = x1,6, vor Schild und Rüstung) und Stuns haben **volle** Dauer ohne 6-s-Sperre (sonst halb, `cc.bossCcBp`). Ein kürzeres Fenster ersetzt kein längeres (`bossWindow` mit `open`, `cause`) |

**Schnittstelle für Schwierigkeitsstufen (P3):** jede Fähigkeit und jede Phasen-Aktion hat `minDifficulty` (`normal` | `hard` | `nightmare`, Standard `normal`); auf niedrigeren Stufen ist sie aus (`ctx.difficultyRank`, `DIFFICULTY_RANK` in `compile.ts`). Heute: Wave 10 `surge` (Sturm) ab Hard, Wave 20 zweiter Schild (`laststand`) ab Hard. Neue Fähigkeiten oder Stufen-Varianten sind reine Datenzeilen in `bosses.json`; `difficulties.json` wird dafür nicht gebraucht. `previewWave(n).bossKit.abilities` listet die auf der Stufe aktiven Fähigkeiten.

Zeitwerte: Vorwarnzeit (`telegraphTicks`) 40-80 Ticks = 2-4 s, Fenster 60-160 Ticks. Zahlen und Begründung: `docs/balancing/kalibrierung.md`, Runde 4 - P4 und Runde 5 - P3. Was der Client zu jeder Fähigkeit zeigen soll: `docs/design/boss-telegraphs.md`.

**Runde 5 / P3 (Boss ohne Pflicht-Unit):** jede unterbrechbare Wirkung hat drei Antworten (Stun, Burst, Dauerschaden), das Unterbrechen öffnet ein langes Fenster mit Rüstung 0. Neue Ereignis-Felder (additiv): `bossTelegraph.staggerNeed`, `bossCast.cause`, `bossWindow.armor`, neues Ereignis `bossArmor`. Bots: `botTuning.bossAnswers` (`both` wie P6 oder `oneOf`, Experiment `P3_ANSWER=oneOf`), die Nuke bricht zerstörbare Wirkungen, wenn kein Stun bereit ist (`bossStatus().stagger`), `botTuning.banned` entfernt die Unit auch aus `makeEnv().defs` (kein "fehlender Typ" der Striker-Rotation). Messwerkzeug `scripts/sanity/r5-p3.ts` (`--part rates|loo|diag`, Seeds `--seed0`, `R5_BOSSES=datei.json` für andere Kits).

## Wellenvorschau und Risikokarten (Runde 4 / P4, K1)

- **`sim.previewWave(n, cardId?)`** (auch `previewWave(sim, n, cardId?)` aus `src/index.ts`): reine Daten, ändert den Zustand nicht, `null` außerhalb der Stage. Liefert `groups[]` (`type`, `count`, `modifiers`, `element` (0 unter Hard), `hpCenti` je Gegner inkl. Stufe/Koop/Karte, `flying`, `boss`, `elite`, `childType`/`childCount` bei Splitter), `enemyCount`, `poolHpCenti` (inkl. Splitter-Kinder, ohne Beschwörungen des Bosses), `boss`, `elite`, `bossKit` (`id`, `name`, `phases`, `abilities` der Stufe), `card` (gewählte Karte der nächsten Wave oder die hypothetische `cardId`) und `cardAllowed` (Boss-Waves: nein). Vorschau und Wave-Start benutzen dieselben Funktionen (`applyCardToGroup`, `enemyStats`); `test/cards.test.ts` vergleicht beide für alle 20 Waves.
- **Karten** `data/cards.json` (`RiskCardSchema`): `hpBp`, `speedBp`, `countBp` (aufgerundet), `bountyBp`, `leakBp` (Lebenskosten normaler Leaks, mindestens 1), `addModifiers` (nur wo die Art fehlt; nie auf Boss/Elite, Anzahl-Faktor ebenfalls nicht), `tier` 1-3. 8 Karten: `thick-hide`, `swift`, `swarm`, `warded`, `regrowth`, `ironclad`, `blood-toll`, `gold-rush`.
- **Befehl** `{ type: 'chooseCard', cardId }` (`null` nimmt zurück): gilt für die **nächste zu startende Wave** (`state.nextCard`; Prep: Wave 1, sonst `wave + 1`), wird beim Wave-Start verbraucht. Jeder Spieler darf wählen, die letzte Wahl zählt (Koop-Abstimmung ist ein UI-Thema). Abgelehnt: `unknown-card`, `boss-wave`, `no-next-wave`. Der Gegner trägt die Karte (`EnemyState.card`, Splitter-Kinder erben sie).
- **Bot-Strategie** (`takeCard` in `src/bots/util.ts`): Bot-Name mit Suffix `+cards` (`getBot('upgrade+cards')`, auch `--bot aoe+cards`) nimmt Karten, wenn das Team stark ist: Waves in Folge ohne Lebensverlust (ab 3 Tier 1, ab 6 Tier 2, ab 10 Tier 3, höchster Bounty-Aufschlag), mindestens 85 % Leben, nur für Waves bis 15; nie auf Boss-Waves. Global abschaltbar mit `botTuning.cardsDisabled` (Sanity-Skripte: `P4_NOCARDS=1`). Die Registry-Bots ohne Suffix nehmen keine Karten und bleiben mit den früheren Messungen vergleichbar.
- **Boss-Fenster der Bots** (`useAbilities`, `bossStatus`): gegen einen Boss mit Kit zündet die Titan-Nuke im Fenster oder auf den Schild (bricht ihn), Frost im Fenster, zum Unterbrechen eines Telegraphs und gegen den Sturm; Notfall ab Pfadfortschritt `botTuning.bossPanicMilli` (31 000 Milli-Tiles). Abschaltbar mit `botTuning.windowAware = false` (`P4_NOWINDOW=1`: Fähigkeiten wie vor P4 sofort auf den Boss).

**Verdrahtung P3 × P4 (Merge):** `ctx.difficultyRank` = `bossAbilityTier` der Stufe (Fallback: Rang der Stufe). Eine Challenge kann damit über `overrides.bossAbilityTier` Boss-Fähigkeiten einer höheren Stufe zuschalten.

## Bot-Profile und Boss-Plan (Runde 4 / P6)

`data/botProfiles.json` (zod `BotProfileSchema`, `loadBotProfiles`; nicht Teil von `GameData`): drei Profile **casual / normal / expert** mit Fehlermodell: `buyDelaySec` (Pause zwischen Kaufrunden), `worseSlotBp` (Slot aus der schlechteren Hälfte), `forgetUpgradeBp` (je Unit und Wave), `abilityDelaySec` (verspätetes Zünden), `lookahead` (Wellenwissen in Waves, 0 = keines). Zufall nur über einen eigenen PRNG des Bots (aus dem seeded Bot-PRNG abgeleitet, nie der Sim-PRNG): deterministisch je Seed und Profil, der Sim-Hash ohne Bots bleibt unberührt.

- Auswahl: `getBot('aoe@normal')`, `'upgrade+cards@casual'`, `'x@none'` (fehlerfrei); ohne `@` gilt `botTuning.profile` (Standard `null` = fehlerfrei wie Runden 1-5, in den Sanity-Skripten `BOT_PROFILE=normal`). `P6_PROFILES='{"normal":{"worseSlotBp":0}}'` überschreibt Profil-Felder.
- **Boss-Plan** (alle Bots, `botTuning.bossPlan`, aus mit `P6_NOBOSSPLAN=1`): aus `previewWave(n).boss` und den Kit-Daten schafft der Bot vor dem Boss die Nuke-Unit (Titan) und bei unterbrechbaren Kit-Zügen die Stun-Unit (Frost) an und spart darauf; Horizont `min(lookahead, botTuning.bossPlanWaves = 3)`. Weitere Schalter: `P6_PLANWAVES`, `P6_NOSAVE`, `P6_EARLYCAP`.
- **Koop-HP-Tabelle je Stufe:** `difficulties.json` `coopHpTableBp` / `coopBossHpTableBp` (Index 0 = 1 Spieler = 10000), Fallback `economy.coop`.
- Zahlen und Befunde: `docs/balancing/kalibrierung.md`, „Runde 4 — P6".

## Daten ändern

Alle Zahlen stehen in `data/*.json` (zod-validiert beim Laden, Querverweise in `load.ts`, z. B. Leak-Werte in `economy.json` = `enemies.json`). Neue Stage = neue Datei in `data/stages/` (Waves, Slots, Pfad). Die Wave-Tabelle der Standard-Stage wurde mit `scripts/gen-stage.ts` erzeugt (Ausgabe danach von Hand kompakt formatiert).

## Infinite-Modus

`createSim({ stage: 'infinite', ..., maxWaves? })`: Map und Waves 1-20 wie `standard20`, ab Wave 21 seeded erzeugt (`src/systems/infinite.ts`): HP_grunt ~ (n/20)^2, gamma ~ (20/n)^2, Speed +1 %/Wave bis x1,5, höchstens 60 Gegner gleichzeitig, Boss alle 10 Waves. Kein Sieg; Ende bei Leben <= 0 oder Boss-Leak (`loss`) oder per `maxWaves` (`result` null). Offene Punkte: `docs/balancing/offene-regeln.md` #30-33; kalibrierte Parameter: `economy.json` Block `infinite`, `docs/balancing/kalibrierung.md`.

## Simulations-CLI und Reports

```bash
npm run sim -- --stage standard20 --bot greedy --runs 500 --difficulty normal --players 1 [--seed 1] [--out ../docs/balancing/runs]
npm run sim -- --stage infinite --bot greedy --runs 200 --max-waves 100
npm run sim -- --bots greedy,farm --players 2      # Team-Mix (Spieler i nutzt Bot i mod n); --bot coop = Registry-Bot "coop"
npm run sim -- --matrix --runs 200                 # alle Registry-Bots x normal/hard/nightmare x 1/2/4 Spieler
```

Weitere Optionen: `--jobs N` (worker_threads, Ergebnis unabhängig von N), `--name`, `--svg/--no-svg`; Listen (`--difficulty normal,hard`, `--players 1,2,4`) erzeugen mehrere Zellen. Ausgabe `<name>.md` (Übersicht, Wave-Tabellen, Leak-Quellen, Definitionen), `<name>.csv` (je Zelle und Wave), `<name>-summary.csv`, optional SVGs. Bots: `src/bots/index.ts` (`getBot`), dazu die Test-Bots `testbot`/`testfarm` (`src/report/testbot.ts`). Aufzeichnung und Aggregation: `src/report/` (`record.ts` spielt Matches nach `bots/types.ts` und liest die Zeitreihen aus den Sim-Events).

## Sanity-Skripte und Bot-Regeln (Runde 4 / P1)

`scripts/sanity/` enthält die Messungen hinter `docs/balancing/report.md` und `kalibrierung.md` (Abschnitt "Runde 4 - P1"). Aufruf mit `npx tsx scripts/sanity/NAME.ts`:

| Skript | Zweck |
|---|---|
| `q1-dominant`, `q1b-top3`, `q2-roles` | Dominanz-, Mengen- und Rollenmessung (nach jeder Unit-Änderung wiederholen) |
| `q7-p1 --part matrix\|raw\|sum\|loo\|phase\|static` | Siegquote, Kaufquote und Schaden je Münze je Unit; Leave-one-out für den besten Bot; Phasenprofil |
| `q9-p2 --part raw\|eval\|check` | Leben-System (P2): Leaks sammeln, Siegquote für Startleben/Basiskosten/Elite-Regel/Regeneration nachrechnen, echte Gegenprobe |
| `q8-hpscan` | Siegquote aller Bots gegen einen globalen HP-Faktor |
| `p3-check.ts`, `p3-check.sh` | Abnahmezahlen der Stufen (Runde 4 / P3): Siegquote je Bot und Stufe, Kennlinie, Regel-Profil je Seed |

| `q10-p4` | (P4) Siegquote und Boss-Tod-Anteil der Registry-Bots (`--bots aoe+cards`) |
| `q11-boss` | (P4) Boss-Diagnose: Leak-Wave/Rest-HP, Fenster je Lauf, Fähigkeiten im Fenster, Telegraphs, Unterbrechungen, Schild; Experiment-Bot `aoe-notitan` |

**Verdrahtung P3 × P4 (Merge):** `ctx.difficultyRank` = `bossAbilityTier` der Stufe (Fallback: Rang der Stufe). Eine Challenge kann damit über `overrides.bossAbilityTier` Boss-Fähigkeiten einer höheren Stufe zuschalten.
| `p5-coop.ts`, `p5-coop.sh N TAG`, `p5-scan.sh` | (P5) Koop-Matrix Bot x 1P/2P/4P je Stufe; Raster der Koop-HP-Tabelle (`P5_COOP='{"hpTableBp":[10000,15000,17500,20000]}'`, `P5_SLOTS=8` für das Slot-Experiment) |
| `p1-quick.sh N TAG`, `p1-sweep.sh N TAG` | Schnellläufe (je Stufe ein Prozess) |

Experimente ohne Dateiänderung über Umgebungsvariablen (nur Sanity-Skripte, nie der Kern): `P1_PATCH='{"titan":{"dpsShareBp":5000}}'` (Unit-Felder je ID überschreiben), `P1_HP=1.4` (globaler HP-Faktor), `P1_DIFF='{"normal":15200}'` (HP-Basispunkte je Stufe), `P1_COOPH=9000` (Koop-HP je Zusatzspieler), `P1_NOSAVE=1` (Bots wie in Runde 3), `P2_BOSSHP=100000` / `P2_ELITEHP=80000` (HP-Faktor von Boss/Elite).

Bot-Regeln aus P1 (`src/bots/util.ts`, Details und Begründung in `kalibrierung.md`): Sparen auf teure Platzierungen (`Policy.save`), Mythic frühestens ab Wave 4, `Policy.plan` (feste Anschaffung ab Wave X, genutzt vom `aoe`-Bot für den Titan) und `rotateEarly` (Striker verkaufen, wenn das 6-Typ-Team voll ist und ein Legendary/Mythic fehlt). Alle Regeln sind über `botTuning.disabled` abschaltbar.

## Balance-Reste (Runde 4 / P6b)

- `botTuning.earlyCap` = 2 (höchstens 2 Striker), `botTuning.banned` (Leave-one-out: die Unit existiert für den Bot nicht; `q7-p1 --part loo`, `LOO_PROXY=1` = alter Proxy), `botTuning.makeRoom` (Boss-Plan verkauft die schwächste Unit für einen Slot), Boss-Bedarfsprüfung `bossCapacityRatio` / `bossNeedMid` / `bossNeedFinal` (Standard 0 = aus), `policyPlans`, `bossFinalHorizon`, `rotateMinRarity`.
- `economy.coop.upgradeCostTableBp` (optional, Upgrade-Kosten je Spielerzahl, Index 0 = 10000): gebaut, in den Daten nicht gesetzt.
- Skripte: `p6b-diag.ts` (Team je Wave), `p6b-boss.ts` (Boss-Bedarf). Env: `P6B_ROTRAR`, `P6B_ROTWAVE`, `P6B_NEED`, `P6B_FINALH`, `P6B_NOPLAN`, `P6B_NOROOM`.

## Replay-Prüfer (Runde 5 / P2)

`npm run replay -- DATEI [--compare] [--bot NAME]` spielt eine im Client exportierte Runde (Seed + Befehle mit Tick) nach, prüft End-Hash und Ergebnis und druckt einen Bericht; Abweichung = Exit 1. Format und Weg: [`docs/balancing/playtests/README.md`](../docs/balancing/playtests/README.md). Falle: Der letzte Schritt einer Niederlage zählt `state.tick` nicht hoch; das Replay läuft deshalb bei beendeten Runden bis `phase === 'over'`.
