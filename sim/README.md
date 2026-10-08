# sim - deterministischer Simulationskern

Headless-Spielkern des Tower Defense (TypeScript strict, ESM, Node 22). Keine Browser-/Render-Abhängigkeiten.
Regeln und Startwerte: `docs/comparison/recommendations.md`; offene Entscheidungen: `docs/balancing/offene-regeln.md`.
**Runde 8 / P1:** Der Kern ist ein **Baukasten**: eine Unit ist ein Datensatz im AA-nahen Format (`data/units/*.json`), null Zeilen Code (Abschnitt „Unit-Baukasten“, Zielformat für Importer/Crossover: `docs/aa-import/format.md`).

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
- HP-Kurve `hpCurve.baseCenti * g^(n-1)` (Runde 8: Basis 300 HP, g 1,1525) und Bounty `gamma(n) * HP` werden exakt per BigInt-Potenz vorberechnet (nur beim Laden).
- Abstände per Quadratvergleich bzw. Integer-Sqrt (`isqrt`); Linie/Kegel mit auf ~1024 normierter Richtung.
- PRNG: sfc32 (4 x uint32, im Zustand, serialisierbar), Seed per splitmix32. Nur Crit-Units verbrauchen Zufallszahlen.
- Iteration nur über Arrays in aufsteigender Entity-ID (IDs sind ein gemeinsamer, aufsteigender Zähler).
- Hash: stabile Serialisierung (sortierte Keys) + FNV-1a 64 Bit (selbst implementiert), 16 Hex-Zeichen.

## Aufbau

```
sim/
  data/            economy (mit `scale`), enemies (mit Schwächen/Resistenzen), modifiers, difficulties, effects (Effekt-Katalog), units/*.json (Unit-Dateien), bosses (Kits), cards (Risikokarten) (JSON, jede Gruppe mit "ref"), stages/standard20.json
  src/
    fixed.ts prng.ts hash.ts   Festkomma, PRNG, Hash
    data/schema.ts (zod)  load.ts (lesen + Querprüfungen)  compile.ts (abgeleitete Tabellen, Level-Stats)
    path.ts            Polylinie, Position aus Distanz, Abdeckung je Position (gecacht), Abstand zum Pfad
    placement.ts       Freie Platzierung (Runde 6): Zonenmaske, Kollision, Fehlergründe, Raster-Kandidaten
    damage.ts          Schadensformel (Schwäche additiv, Resistenz 100/(100+R), True, Crit)
    state.ts           Zustands- und Event-Typen
    systems/           waves, spawn, effects (CC/Slow/DoT/Regen), special (die 22 AA-Effekte), move (+Leaks, Rückwärtslaufen), attack (Formen, Treffer, Selbst-Buffs), target, economy, boss (Kits), cards (Karten + Vorschau)
    bots/              auto.ts (generischer Rauchtest-Bot, `mono-ID`), runner.ts
    commands.ts        Befehle; sim.ts Fassade; index.ts öffentliche API
  test/                vitest (Determinismus, Einkommen, Schaden, Leaks, Ökonomie, Targeting, Status, Pool, Kampf/Formen, Effekte, Unit-Daten, Rauchtest)
```

Tick-Reihenfolge: Waves (Wave-Ende: Lebens-Regeneration) -> Spawns -> Boss-Kits (Phasen, Telegraph, Fenster) -> Status/DoT/Regen -> Tode -> Bewegung/Leaks (Leben, Niederlage) -> Units (Angriffe) -> Tode -> Sieg-Prüfung -> `tick++`.

## Unit-Baukasten (Runde 8 / P1)

Der Kern kann **generisch alles, was in `docs/anime-adventures/data/units.json` vorkommt**. Es gibt nur noch einen Unit-Pfad: Datei -> `UnitFileSchema` -> `compile.ts` (`UnitDef`) -> `attack.ts`. Die 14 alten Units der Runden 4-7 sind entfernt (kein zweites Format, keine Aura-/Fähigkeits-/Ketten-Sonderpfade). **Runde 9 / P1:** Fähigkeiten, Auren, Beschwörungen und Zweitangriffe sind als Datenbausteine zurück (Abschnitt „Fähigkeiten und Beschwörungen“), ohne Sonderpfade je Unit.

**Dateien.** `data/units/*.json` (alphabetisch geladen und zusammengeführt, `loadUnits()` / `mergeUnitFiles`): je Datei `{ ref?, units: [...], attacks: { "<id>": {...} } }`. Angriffs-IDs sind **global**; gleiche ID mit anderem Inhalt in zwei Dateien ist ein Fehler. `sample.json` (26 echte AA-Units, von Hand ausgewählt) liegt heute da; P2 legt `aa.json` daneben, P6 `crossover.json`. Der Effekt-Katalog steht in `data/effects.json`. Browser/Meta: `import.meta.glob('.../sim/data/units/*.json')` (`client/src/sim/data.ts`, `meta/src/catalog.ts`), also genügt eine neue Datei.

**Unit** (`UnitSchema`, Feldliste mit Beispiel: `docs/aa-import/format.md`): `id`, `name`, `rarity` (Rare/Epic/Legendary/Mythic/Secret/Exclusive), `placement` (ground/hill/hybrid), `damageType` (physical/magic/true), `elements[]` (dark, fire, lightning, ice, air, light, water, rose), `critChance`/`critDamage`, `spawnCap` (**gelesen, nicht durchgesetzt**), `footprint`, `hitsAir`, `unsellable`, `levels[]` je Stufe `{ level, cost, damage, spa, range, attack, farm }`. AA-Rohdaten parsen ohne Umbau (`nameRR` gilt als `name`, `secondaryDamageTypes` als `elements`, `true_damage` als `true`; alle übrigen AA-Felder werden verworfen); `test/units-data.test.ts` parst alle 550 AA-Units und 1098 Angriffe.

**Stufen.** Level 0 = Platzierung, 1..n = Upgrades. Fehlt `damage`/`spa`/`range`/`attack`/`cost` in einer Stufe, gilt der Vorwert (AA-Konvention). Ein anderer `attack` je Stufe wechselt den Angriff (`rokuhira:one` -> `:two` -> `:three`). Eine Stufe greift an, wenn sie Schaden, SPA und Reichweite > 0 hat; Farm-Units tragen `farm` (Yen je Wave).

**Angriffsformen** (`attacks.<id>.aoe`, fehlend = `single`; Parameter fehlen -> Standard: circle 8 Studs, cone 60 Grad, line 4 Studs):

| aoe | Trefferfläche |
|---|---|
| `single` | nur das Ziel (First/Last/Close/Strongest, Reichweite der Stufe) |
| `circle` | Radius `radius` um das **Ziel** |
| `cone` | Winkel `angle` (Gesamtwinkel) ab der **Unit** Richtung Ziel, Länge = Range; `cos²(Halbwinkel)` wird beim Laden auf Basispunkte gerundet |
| `line` | Breite `width`, ab der Unit Richtung Ziel, bis Range |
| `full` | alles in Reichweite um die Unit (auch hinter ihr) |

**Treffer** (`hits`): der Schaden wird **geteilt, nicht vervielfacht** (`damage / hits` je Treffer, mindestens 1 HP). Die Fläche wird einmal bestimmt, dann treffen die Treffer reihum alle noch lebenden Gegner der Fläche (sofort, im selben Tick, deterministisch). Jeder Treffer entfernt einen Schild-Stack (Multi-Hit schält Schilde), jeder Treffer trägt den DoT des Angriffs. Spezialeffekte wirken einmal je Angriff und Gegner nach den Treffern (Shatter davor).

**Schaden** (`damage.ts`, nach jedem Faktor `floor`): `Basis x Level-Mod x (1+Trait) x (1+min(Buff, Cap)) x (1+Selbst-Buffs) x (1+min(Verwundbar, Cap))` -> DoT-Basis -> `x (1 + Σ Schwächen)` -> `x 100/(100+R)` (nicht bei True) -> `x Crit`. R = Rüstung des Gegners (`armor`, Modifier `armored`, Boss-Phasen) + Resistenz gegen den Damage-Typ + Σ Resistenz gegen die Elemente der Unit. Schwächen/Resistenzen stehen je Gegner-Archetyp in `enemies.json` (`weakBp`, `resist`, Schlüssel = `physical`/`magic`/Elementname) und kommen mit dem Wave-Element hinzu (`elementAffinity`, Wave-Element 1-5 = `waveElements`, wirkt ab `elementsActive` = Hard). Der alte Element-Zyklus ist weg. **Crit:** ein Wurf je Angriff über die Sim-PRNG (nur Units mit `critChance` verbrauchen Zahlen), Multiplikator `critDamage` (Standard x1,5).

**Flieger:** Boden trifft sie nicht, Hügel/Hybrid schon (AA); `hitsAir` in den Daten überstimmt.

**Effekte** (`data/effects.json`, Code in `systems/special.ts`/`attack.ts`/`effects.ts`; alle Parameter in Daten, ein Angriff kann `duration`/`influence`/`chance` je `special` überstimmen; `special` ist ein Objekt oder eine Liste):

| Effekt (AA-Name) | Wirkung |
|---|---|
| Slow | Tempo -`influence` (Standard 50 %, bis Deckel `cc.slowMaxBp` 80 %), 3 s, nach Ablauf 4 s Sperre, stärkster gewinnt; Boss halbe Dauer |
| Stun, Freeze, Timestop | Gegner steht (2 / 2,5 / 2 s), danach 12 / 11 / 11 s Sperre. **Eine** Sperrgruppe mit Confused/Mind Control; Boss halbe Dauer (volle im Schwachstellen-Fenster); Stun unterbricht Boss-Telegraphs |
| Unconscious | 0,5 s still, stapelt mit der Gruppe, keine Sperre |
| Confused | alle getroffenen Gegner laufen 5 s rückwärts; Mind Control: 10 % Chance (Sim-PRNG) je Gegner, 1,5 s |
| Knockback | 2,5 Kacheln Richtung Spawn, 30 s Sperre (DESIGN, AA: Distanz UNKNOWN), Boss halbe Strecke |
| Dismembered / Hexed (20 %, 25 %) | +20 % Physical / +20, +25 % Magic dauerhaft, kein Stapeln |
| Cursed (30 %, 15 %) | +30 / +15 % Magic für 10 s, stärkster gewinnt |
| Bleed Amplification | Bleed-Ticks x5 für 6 s |
| Wither (Effekt) | Heilsperre 5 s; Wither als DoT: True-DoT, stoppt Regen (ebenso Bleed) |
| OverCrit | garantierter Crit gegen blutende Gegner (ohne PRNG) |
| Battlelust | +5 % je Angriff bis +25 %, Reset ohne Ziel |
| Snatched | +3 % je Angriff bis +33 % (+99 % auf der letzten Stufe), verfällt nach 90 s |
| Sunshine | wächst je beendeter Wave bis 15: Schaden bis x2,25, Reichweite bis x1,67 |
| Motivate | jeder Angriff: Verbündete in Reichweite +15 % Schaden für 10 s (kein Stapeln) |
| Shatter | entfernt vor den Treffern alle Schild-Stacks |
| Wild Card | würfelt Burn/Slow/Bleed/Freeze/Knockback (Sim-PRNG) |

DoTs (`attacks.<id>.dot` = Burn/Bleed/Poison/Wither, `multiplierPerTick`, `ticks`, `totalMultiplier`): je Treffer `hitDamage x totalMultiplier` über `ticks` Sekunden (1 Tick je `economy.dot.intervalTicks` = 1 s, DESIGN), True-Damage, Boss/Elite x0,5. Dieselbe Unit erneuert ihre Instanz je Art, verschiedene Units stapeln bis `economy.dot.maxStacks` (12). Burn gegen einen Gegner mit Fire-Schwäche steigt mit.
Was nicht modelliert ist, steht in `docs/aa-import/unsupported.md`; ein **unbekannter Effektname** ist ein No-op (kein Absturz) und wird von `unknownEffects(data)` gemeldet.

## Fähigkeiten und Beschwörungen (Runde 9 / P1)

Daten: `units[].abilities[]`, `units[].aura`, `levels[].also` und der Katalog `summons` je Unit-Datei (Felder: `docs/aa-import/format.md`); Code: `systems/ability.ts`, `systems/summon.ts`, `strike` in `systems/attack.ts` (der gemeinsame Schlag von Angriff, Fähigkeit und Beschwörung). Eine neue Fähigkeit ist ein Datensatz, null Zeilen Code; Kits der AA-Units: `tools/aa-import/kits.ts`.

- **Befehle** `{ type: 'ability', entityId, index? }` (Knopf-Fähigkeit auslösen, `index` Standard = die erste) und `{ type: 'autoAbility', entityId, on }` (Auto-Schalter). Gründe: `no-ability`, `locked` (Stufe zu niedrig), `cooldown`, `no-target`. `sim.abilityBlocked(entityId, index?)` liefert denselben Grund (oder `null`) ohne Nebenwirkung (Knöpfe im Client).
- **Zustand** (nur wenn die Unit es braucht, damit ältere Replay-Hashes gleich bleiben): `UnitState.ab` (Rest-Abklingzeit je Fähigkeit in Ticks), `auto`, `run` (laufende Mehrfach-Wirkung), `rot` (Zähler des Angriffs-Wechsels), `motTempo*`/`motCrit*` (Buffs); `SimState.summons` entsteht mit der ersten Beschwörung.
- **Tick-Reihenfolge:** nach `moveEnemies`: `applyAuras` (Buff mit 2 Ticks Dauer, jeden Tick erneuert) -> `runUnits` (Angriffe, mit Zweitangriffs-Wechsel) -> `tickAbilities` (Abklingzeit, Mehrfach-Wirkung, Auto) -> `runSummons` (Lebensdauer, Bewegung, Angriff, Ende). `moveEnemies` fragt vorher `blockerOf`: eine aufhaltende Beschwörung stoppt Bodengegner (nicht Flieger, nicht Bosse) im Kontakt (500 Milli-Tiles + Gegnerradius) und verliert dabei Haltbarkeit (Standard-Gegner 1, Elite 3 je Tick).
- **Wirkung einer Fähigkeit:** Angriff aus dem Katalog (Form, Treffer, DoT, Effekte) mit Schaden = Stufen-Schaden x `damageMult` (oder absolut), Reichweite der Unit oder global (Zeitstopp, Flächenschlag); danach Selbst-Buff, Buff auf Verbündete, Beschwörung, Münzen (nur beim ersten Schlag einer Mehrfach-Wirkung). Buffs wirken wie Motivate (`motDmg`, `motRange`, `motTempo`, `motCrit`: stärkster gewinnt, gleicher erneuert die Dauer, Caps `economy.buffCaps`; Crit addiert sich zur Crit-Chance und würfelt über die Sim-PRNG nur, wenn die Chance > 0 ist).
- **Auto:** `trigger: auto` feuert bei Bereitschaft von selbst, Knopf-Fähigkeiten nur mit gesetztem `auto` der Unit. Auto-Auslösung braucht einen lebenden Gegner, bei `needsTarget` ein Ziel in Reichweite, bei Beschwörungen Platz unter `maxAlive`. Ein Knopfdruck am Limit ersetzt das älteste Wesen.
- **Beschwörung:** `walk` erscheint auf dem Pfad am Punkt nächst dem Beschwörer, läuft anrückenden Gegnern entgegen (höchstens 8 Kacheln vom Ausgangspunkt), kämpft mit eigenem Angriff und hält auf; `stand` steht auf einem von acht Plätzen neben dem Beschwörer. Der Schaden gehört dem Beschwörer (Meta-Mods, Statistik, `damageDealt`). Ende: Lebensdauer, Haltbarkeit 0 oder Verkauf des Beschwörers (`summonEnd` mit `cause`), optional ein letzter Schlag (`endAttack`).
- **Ereignisse:** `ability` (`unitId`, `ability`, `name`, `auto`), `summonSpawn`, `summonEnd`; `income` kennt die Quelle `ability`.
- **Replay-Format v5** (Runde 9): neue Befehle; v4 bleibt nachspielbar (kein Zustandsfeld entsteht ohne Fähigkeit). `meta/src/verify.ts` akzeptiert v4 und v5. Tests: `test/abilities.test.ts`, `test/replay.test.ts` (v5-Replay mit Fähigkeiten und Beschwörungen).
- Bots (Rauchtest) schalten bei Units mit Knopf-Fähigkeit den Auto-Schalter an.

**Maßstab** (`economy.json` `scale`, Begründung `docs/aa-import/massstab.md`): AA-Werte (Yen, Schaden, SPA, Sekunden) unverändert; `studsPerTile` = 5 (Range 25 = 5 Kacheln), `yenPerCoin` = 1. Gegner-HP, Start-Yen und Einkommen sind auf AA-Maßstab gehoben (`startCoins` 3000, `waveBonus` 500 + 150n, `hpCurve.baseCenti` 30000).

**Test-Bots** (nur Rauchtest, `src/bots/`): `getBot('auto')` (4 zufällige Angreifer), `'auto-N'`, `'mono-ID[,ID..]'` — gierig nach Schadenszuwachs je Münze, Rollen nur aus den Daten. Keine Messreihen, keine Siegquoten-Korridore (Kurswechsel 07.10.2026). `test/smoke.test.ts`: zufällige Sample-Units laufen ohne Absturz durch, eine starke Unit schafft Standard20 Normal; `test/units-data.test.ts` lässt jede der 550 AA-Units 3 Waves spielen.

## API

```ts
import { createSim } from './src/index.js';
const sim = createSim({ stage: 'standard20', difficulty: 'normal', players: 1, seed: 1 });
sim.apply(0, { type: 'place', unitId: 'goku_ssj3', x: 3000, y: 2000 });   // Position in Milli-Tiles -> {ok:true, entityId} | {ok:false, reason}
sim.runWave();            // Prep -> Wave 1 bis zu deren Ende (dann läuft Wave 2 schon); letzte Wave bis Matchende
sim.step(20);             // 1 s
sim.hash(); sim.result(); sim.drainEvents();
```

`createSim`-Optionen: `stage` (ID oder `StageData`), `difficulty` (`normal|hard|nightmare`), `players` (1-4), `seed`, `data` (Override, z. B. mehr Startgeld), `godMode` (Leben sinken nicht, Leaks werden gezählt), `metaLives` (Meta-Ausbau der Leben, überschreibt `economy.lives.metaBonus`; Default 0), `unitMods` (Hooks je Spieler/Unit: `lvlBp`, `traitBp`, `yieldBp`, Standard x1/+0).

`Sim`: `state` (live, readonly), `apply`, `step`, `runWave`, `isOver`, `result`, `hash`, `drainEvents`, `slotCenters()` (Altbestand, nur Daten), `coverage(x, y, range)`, `canPlace(player, unit, x, y)` (Grund oder `null`), `placementGrid(unit)`, `zoneAt(x, y)`, `map()`, `pathSamples()` (alle Runde 6), `catalog()` (`UnitDef[]`: `levels[]` mit `attack`, `fx`, `damageCenti`, `spaTicks`, `rangeMilli`), `upgradeCost(entityId)`, `placeCost(unitId)`, `previewWave(n, cardId?)`, `cards()`, `bossKits()` (P4).

Befehle: `place`, `upgrade`, `sell`, `setTargeting`, `skipWave`, `chooseCard` (P4), `ability`/`autoAbility` (Runde 9) sowie (Erweiterung §16) `donate`. Ablehnungsgründe u. a.: `not-enough-coins`, bei `place` `invalid-position`, `out-of-bounds`, `on-path`, `blocked`, `wrong-zone`, `overlap` (Abschnitt „Freie Platzierung“), `team-limit`, `team-slots`, `max-level`, `unsellable`, `not-owner`, `no-next-wave`, `unknown-card`, `boss-wave`, `game-over`.
Befehle wirken zu Tick-Beginn: `apply` verändert den Zustand zwischen zwei Ticks, `skipWave` greift im nächsten Tick (Koop: mehr als die Hälfte der Spieler).

Events (`drainEvents`): `spawn`, `kill`, `leak`, `waveStart`, `waveEnd`, `income{source: waveBonus|bounty|farm|sell|donate}`, `damage` (je Unit aggregiert, bei Wave-Ende/Verkauf), `ability`, `summonSpawn`, `summonEnd` (Runde 9), `place`, `upgrade`, `sell`, `over` sowie (P4) `bossPhase`, `bossTelegraph`, `bossCast`, `bossWindow`, `bossWard`, `cardChosen` und (Runde 5 / P3) `bossArmor` (Felder `staggerNeed`, `cause`, `armor` an den Boss-Ereignissen, siehe `docs/design/boss-telegraphs.md`); `spawn` trägt bei Beschwörungen des Bosses `summon: true`.

## Leben-System (Runde 4 / P2)

Ersetzt die Base-HP (`state.lives`, `state.maxLives`; Daten `economy.lives`: `start` 30, `metaBonus` 0 (M3), `regenPerWave` 0, `instantLoss` `["boss"]`). Das Leben-Konto ist für das ganze Team gemeinsam.

- **Leak-Kosten** je Gegner: `max(1, ceil(Basis x RestHP / MaxHP))` (`leakCost` in `src/systems/move.ts`, reine Ganzzahl-Rechnung, Schild zählt nicht). Basis = `leak` aus `enemies.json` (= `economy.leakDamage`): Grunt/Runner 2, Flyer/Splitter 3, Brute 5, Splitter-Kind 1, Elite 8.
- **Sofort verloren:** Archetypen in `instantLoss` (Boss) beenden die Runde beim Leak, unabhängig von Rest-HP und Lebensstand. Die Elite steht bewusst **nicht** drin (Begründung `kalibrierung.md`, Runde 4 - P2); per Daten umstellbar (`["boss","elite"]`).
- **Regeneration:** `regenPerWave` Leben beim Ende jeder Wave, höchstens bis `maxLives`.
- Das Leak-Event trägt `damage` (= Lebenskosten, bei Sofort-Verlust die verlorenen Restleben), `hp`, `maxHp`, `fatal`. Report-Felder `baseHpLost`/`baseHpEnd`/`baseHp` heißen aus Kompatibilität weiter so und meinen Leben.
- Die Bots lesen die Leben nicht: ein Lauf mit riesigem Startwert liefert alle Leaks, die Siegquote für beliebige Regeln lässt sich danach nachrechnen (`scripts/sanity/q9-p2.ts`, `--part raw|eval|check`).

## Freie Platzierung (Runde 6 / P1)

Seit Runde 6 gibt es **keine festen Slots** mehr (Entscheidung Max, 07.10.2026, `docs/design/ENTSCHEIDUNGEN.md` „Platzierung“) und **kein Limit je Unit-Typ** (`cap` ist aus Daten, Schema und Code entfernt; Rarity-`cap` und Farm-`cap` 2 entfallen). Bleibende technische Grenzen: `economy.caps.teamSlots` (6 Sorten je Spieler, `team-slots`) und `teamUnits` (60 Units im Team, `team-limit`).

**Befehl:** `{ type: 'place', unitId, x, y }`, `x`/`y` ganze Zahlen in Milli-Tiles = Mitte der Unit. Nicht ganzzahlig: `invalid-position`. `Sim.canPlace(player, unit, x, y)` liefert denselben Grund (oder `null`) ohne Nebenwirkung, für Geist und Hinweise im Client.

**Karte** (`data/stages/*.json`): `path` (Polylinie in Tiles) mit `pathWidth` (Gesamtbreite in Tiles, Standard 1) und `zones.rows`, eine **Kachelmaske** im Raster des Clients: Zeile = y, Spalte = x, Kachel (x, y) ist um die Sim-Koordinate (x, y) zentriert (deckt `x*1000 ± 500`). Zeichen: `.` Boden, `h` Hügel, `#` blockiert (Bäume, Felsen, Deko), `p` Pfadkachel (nur Anzeige; der Pfad wird über Abstand und `pathWidth` geprüft). Das Raster ist zugleich der Kartenrand (Standard-Stage 17 x 11 Kacheln = -500..16500 x -500..10500). Die Zonen der Standard-Stage sind aus den alten Slots abgeleitet: Reihen 0/3/5/8 Boden, 2/6/9 Hügel (die erhöhten Bereiche), rechts x >= 14 Boden (Platz für Farms), dazu zwölf blockierte Randkacheln. `slots` blieb als **Altbestand** in den Stage-Daten (26 Positionen, `Sim.slotCenters()`): keine Regel, nur Hilfe für den Client bis P3 und Test, dass jede alte Position weiter gültig ist.

**Radien** (`economy.placement`): `unitRadiusMilli` je `footprint`: 1x1 = **400** (0,8 Tiles Durchmesser), 2x2 (`footprint: 2`, in den AA-Daten nicht vorkommend) = **900** (Kreis statt Quadrat, 1,8 Tiles); `pathMarginMilli` = 0 (Zusatzabstand zum Pfadrand).

**Prüfreihenfolge und Fehlergründe** (`placement.ts`, `checkPlacement`; Berühren zählt nie als Treffer, nur echtes Eindringen):

| Grund | Bedingung |
|---|---|
| `out-of-bounds` | Kreis ragt über den Kartenrand |
| `on-path` | Abstand der Mitte zur Polylinie < halbe Pfadbreite (500) + Radius + Rand. Strecken per Kreuzprodukt, Ecken und Enden per Abstand zum Eckpunkt, alles ganzzahlig und exakt |
| `blocked` | Kreis überlappt eine `#`-Kachel (oder die Mitte liegt auf einer Pfad-/Blockkachel) |
| `wrong-zone` | die Kachel unter der **Mitte** passt nicht: Boden-Unit `.`, Hügel-Unit `h`, Hybrid beides. Die Zone ist eine Fläche, die Kante zählt über die Mitte |
| `overlap` | Abstand zu einer anderen Unit < Summe der Radien (alle Spieler) |
| dann | `team-limit`, `team-slots`, `not-enough-coins` |

Konsequenz auf der Standard-Karte: Bodenreihen und Hügelreihen neben dem Pfad sind nur ca. 0,6 Tiles breit nutzbar (Pfadabstand 900 bis zur Zonenkante), entlang des Pfads ist der Platz dagegen frei (Mindestabstand 800 zwischen 1x1-Units). Die Farm (Radius 900, Pfadabstand 1400) passt nur in den breiten Bodenflächen, vor allem rechts (x >= 14,4).

**Abdeckung** (`coverage(x, y, range)`): Pfadlänge in Reichweite, Stichprobe alle 100 Milli-Tiles (die Stichpunkte stehen einmal im `Path`), je (x, y, Reichweite) gecacht und von allen Sims mit gleichem Pfad geteilt.

**Platzierkosten (Runde 6 / P2):** `economy.placeCostGrowthBp` (1000) und `placeCostFreeCopies` (5): die ersten 5 Exemplare je Typ und Spieler kosten den Basispreis, jedes weitere +10 % des Basispreises je Exemplar (6. = +10 %, 7. = +20 % ...), linear, abgerundet, gezählt über die **stehenden** eigenen Units gleichen Typs (Verkauf senkt den Preis wieder, Koop je Spieler; das erste Exemplar kostet immer den Basispreis). Unit-Feld `placeGrowthBp` überstimmt den Zuwachs je Unit. **Abfrage für den Client:** `sim.placeCost(player, unitId)` liefert den aktuellen Preis, genau den Betrag, den `place` abbucht (`sim.placeCost(unitId)` = Spieler 0, Rückwärtskompatibilität); `canPlace` meldet bei zu wenig Münzen `not-enough-coins` mit diesem Preis. Der Shop soll `placeCost(player, unitId)` anzeigen, nicht `def.placeCost`. Begründung und Messung: `kalibrierung.md`, Runde 6 — P2.

**Bots** (Runde 8): siehe „Unit-Baukasten“, Test-Bots. Positionssuche: `Sim.placementGrid(unit)` und `coverage` (`bots/auto.ts` `bestSpot`). Tests: `test/placement.test.ts`.

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
| Zerstörbare Wirkung (P3) | `staggerBp` an einer `interruptible`-Fähigkeit: Schaden während des Telegraphs (nach Fenster-Faktor, **vor** der Schild-Absorption, auch DoT) zählt in `bossRun.tele.dmg` auf die Schwelle `tele.need` = `staggerBp` der Max-HP. Ist sie erreicht, ist die Wirkung gebrochen (`cause: "damage"`, Auflösung im nächsten Boss-Tick, also **vor** `fireTick`). Eine `mend`-Heilung schrumpft linear mit dem bisherigen Schaden. Das ist die Dauerschaden-Antwort; Stun (Stun/Freeze/Timestop) und ein einzelner großer Treffer ab der Schwelle sind die beiden anderen. `load.ts` lehnt `staggerBp` ohne `interruptible` ab |
| Rüstung (P3) | Phasen-Aktion `{kind: "armor", value}` setzt die Rüstung des Bosses (absolut) bis zum nächsten Phasenwechsel (`bossArmor`-Ereignis); `window.armor` überstimmt sie, solange das Fenster offen ist (`effectiveArmor` in `boss.ts`, benutzt von `hitEnemy`). Mit `armor: 0` im Fenster gewinnen physische/magische Units bis zu 40 % (Rüstung 40), True Damage nicht |
| Schwachstellen-Fenster | `window` (nach Wirkung; bei `charge`: wenn der Sturm endet = Erschöpfung), `interruptWindow`, Schild-Bruch, Phasen-Aktion. `{ticks, bp}`: solange offen, nimmt der Boss `bp`-fachen Schaden (16000 = x1,6, vor Schild und Rüstung) und Stuns haben **volle** Dauer ohne 6-s-Sperre (sonst halb, `cc.bossCcBp`). Ein kürzeres Fenster ersetzt kein längeres (`bossWindow` mit `open`, `cause`) |

**Schnittstelle für Schwierigkeitsstufen (P3):** jede Fähigkeit und jede Phasen-Aktion hat `minDifficulty` (`normal` | `hard` | `nightmare`, Standard `normal`); auf niedrigeren Stufen ist sie aus (`ctx.difficultyRank`, `DIFFICULTY_RANK` in `compile.ts`). Heute: Wave 10 `surge` (Sturm) ab Hard, Wave 20 zweiter Schild (`laststand`) ab Hard. Neue Fähigkeiten oder Stufen-Varianten sind reine Datenzeilen in `bosses.json`; `difficulties.json` wird dafür nicht gebraucht. `previewWave(n).bossKit.abilities` listet die auf der Stufe aktiven Fähigkeiten.

Zeitwerte: Vorwarnzeit (`telegraphTicks`) 40-80 Ticks = 2-4 s, Fenster 60-160 Ticks. Zahlen und Begründung: `docs/balancing/kalibrierung.md`, Runde 4 - P4 und Runde 5 - P3. Was der Client zu jeder Fähigkeit zeigen soll: `docs/design/boss-telegraphs.md`.

**Runde 5 / P3 (Boss ohne Pflicht-Unit):** jede unterbrechbare Wirkung hat drei Antworten (Stun, Burst, Dauerschaden), das Unterbrechen öffnet ein langes Fenster mit Rüstung 0. Neue Ereignis-Felder (additiv): `bossTelegraph.staggerNeed`, `bossCast.cause`, `bossWindow.armor`, neues Ereignis `bossArmor`. Bots: `botTuning.bossAnswers` (`both` wie P6 oder `oneOf`, Experiment `P3_ANSWER=oneOf`), die Nuke bricht zerstörbare Wirkungen, wenn kein Stun bereit ist (`bossStatus().stagger`), `botTuning.banned` entfernt die Unit auch aus `makeEnv().defs` (kein "fehlender Typ" der Striker-Rotation). Messwerkzeug `scripts/sanity/r5-p3.ts` (`--part rates|loo|diag`, Seeds `--seed0`, `R5_BOSSES=datei.json` für andere Kits).

## Wellenvorschau und Risikokarten (Runde 4 / P4, K1)

- **`sim.previewWave(n, cardId?)`** (auch `previewWave(sim, n, cardId?)` aus `src/index.ts`): reine Daten, ändert den Zustand nicht, `null` außerhalb der Stage. Liefert `groups[]` (`type`, `count`, `modifiers`, `element` (0 unter Hard), `hpCenti` je Gegner inkl. Stufe/Koop/Karte, `flying`, `boss`, `elite`, `childType`/`childCount` bei Splitter), `enemyCount`, `poolHpCenti` (inkl. Splitter-Kinder, ohne Beschwörungen des Bosses), `boss`, `elite`, `bossKit` (`id`, `name`, `phases`, `abilities` der Stufe), `card` (gewählte Karte der nächsten Wave oder die hypothetische `cardId`) und `cardAllowed` (Boss-Waves: nein). Vorschau und Wave-Start benutzen dieselben Funktionen (`applyCardToGroup`, `enemyStats`); `test/cards.test.ts` vergleicht beide für alle 20 Waves.
- **Karten** `data/cards.json` (`RiskCardSchema`): `hpBp`, `speedBp`, `countBp` (aufgerundet), `bountyBp`, `leakBp` (Lebenskosten normaler Leaks, mindestens 1), `addModifiers` (nur wo die Art fehlt; nie auf Boss/Elite, Anzahl-Faktor ebenfalls nicht), `tier` 1-3. 8 Karten: `thick-hide`, `swift`, `swarm`, `warded`, `regrowth`, `ironclad`, `blood-toll`, `gold-rush`.
- **Befehl** `{ type: 'chooseCard', cardId }` (`null` nimmt zurück): gilt für die **nächste zu startende Wave** (`state.nextCard`; Prep: Wave 1, sonst `wave + 1`), wird beim Wave-Start verbraucht. Jeder Spieler darf wählen, die letzte Wahl zählt (Koop-Abstimmung ist ein UI-Thema). Abgelehnt: `unknown-card`, `boss-wave`, `no-next-wave`. Der Gegner trägt die Karte (`EnemyState.card`, Splitter-Kinder erben sie).

**Verdrahtung P3 × P4 (Merge):** `ctx.difficultyRank` = `bossAbilityTier` der Stufe (Fallback: Rang der Stufe). Eine Challenge kann damit über `overrides.bossAbilityTier` Boss-Fähigkeiten einer höheren Stufe zuschalten.

## Daten ändern

Alle Zahlen stehen in `data/*.json` (zod-validiert beim Laden, Querverweise in `load.ts`, z. B. Leak-Werte in `economy.json` = `enemies.json`). **Neue Unit = ein Datensatz in `data/units/*.json`** (null Zeilen Code, `docs/aa-import/format.md`). Neue Stage = neue Datei in `data/stages/` (Waves, Pfad samt `pathWidth`, `zones`; `slots` nur noch Altbestand). Die Wave-Tabelle der Standard-Stage wurde mit `scripts/gen-stage.ts` erzeugt (Ausgabe danach von Hand kompakt formatiert).

## Infinite-Modus

`createSim({ stage: 'infinite', ..., maxWaves? })`: Map und Waves 1-20 wie `standard20`, ab Wave 21 seeded erzeugt (`src/systems/infinite.ts`): HP_grunt ~ (n/20)^2, gamma ~ (20/n)^2, Speed +1 %/Wave bis x1,5, höchstens 60 Gegner gleichzeitig, Boss alle 10 Waves. Kein Sieg; Ende bei Leben <= 0 oder Boss-Leak (`loss`) oder per `maxWaves` (`result` null). Offene Punkte: `docs/balancing/offene-regeln.md` #30-33; kalibrierte Parameter: `economy.json` Block `infinite`, `docs/balancing/kalibrierung.md`.

## Unit-Level und Sterne (Runde 7 / P2)

Kurven stehen als Daten in `data/progression.json` (zod: `ProgressionSchema` in `src/data/schema.ts`, `loadProgression()` in `src/data/load.ts`; **nicht** Teil von `GameData`, Meta/Client importieren das JSON direkt). Rechnung in `src/progression.ts` (rein, ohne Dateizugriff): `damageBpFor(prog, level, sterne)` = 10000 + `levelDamageBpPerLevel`·(Level−1) + `starDamageBp[Sterne−1]`, `starsForCopies`, `unitModFor`, `metaProfileMods(prog, 'fresh'|'mid'|'max', unitIds, players)`. Startwerte: 250 bp je Level (Level 40 = x1,975), Sterne bei 1/2/4/8/16 Kopien mit +0/5/10/15/20 % (Stern 1 neutral), max = x2,175. Wirkung nur über `UnitMod.lvlBp` (Schaden; Farm-Ertrag und Reichweite bleiben, `yieldBp` ist getrennt). Gilt für jede Unit gleich, keine Unit-Liste. Meta (`meta/src/unit-mods.ts`, `stars.ts`) und Bots lesen dieselbe Quelle.

`runMatch({ unitMods })` reicht die Mods an die Sim (Rauchtest). Test: `test/progression.test.ts`.

## Replay-Prüfer (Runde 5 / P2)

`npm run replay -- DATEI [--compare] [--bot NAME]` spielt eine im Client exportierte Runde (Seed + Befehle mit Tick) nach, prüft End-Hash und Ergebnis und druckt einen Bericht; Abweichung = Exit 1, Datei unbrauchbar = Exit 2, **altes Regelwerk (Format v1 bis v3) = Exit 3** (Meldung „altes Regelwerk (v1-v3, vor dem AA-Baukasten)“, kein Hash-Fehler, kein Stacktrace; der Bericht stammt dann aus den Wellen-Daten der Datei, `--compare` läuft weiter). Format und Weg: [`docs/balancing/playtests/README.md`](../docs/balancing/playtests/README.md). **Format v3 (Runde 7):** wie v2, plus `unitMods` im Kopf (Liste `{ player, unit, lvlBp?, traitBp?, yieldBp? }`, `createSim({ unitMods })`); das Nachspielen rechnet sie mit. v2 bleibt lesbar und spielbar (ohne Mods = neutral, ein `unitMods`-Feld in einer v2-Datei zählt nicht), v1 bleibt „altes Regelwerk“ (Exit 3). Falle: Der letzte Schritt einer Niederlage zählt `state.tick` nicht hoch; das Replay läuft deshalb bei beendeten Runden bis `phase === 'over'`.


**Format v2 (Runde 6 / P1):** `place` trägt `x`, `y` (Milli-Tiles) statt `slot`. v1-Dateien (`beispiel-normal.json`, `2026-10-07-max-normal-loss.json`) bleiben als Dokument liegen.

**Format v5 (Runde 9 / P1, aktuell):** wie v4, dazu die Befehle `ability` und `autoAbility`; v4 bleibt nachspielbar.

**Format v4 (Runde 8 / P1):** wie v3, aber die Units kommen aus dem AA-Datenformat (`sim/data/units/*.json`) und dem Maßstab in `economy.json`; v1 bis v3 sind „altes Regelwerk“ (nicht nachspielbar, die Dateien bleiben als Dokument lesbar, `meta` meldet `replay-old-rules`). Beispiele (vom Simulator erzeugt): `beispiel-v4-bot-normal.json`, `beispiel-v4-bot-normal-mid.json` (`npx tsx scripts/export-replay.ts --bot mono-goku_ssj3 --difficulty normal --seed 7 --meta mid --out ...`). Nach jeder Regel- oder Datenänderung neu erzeugen, sonst schlägt `test/replay.test.ts` an.


## Karten, Stages und Welten (Runde 8 / P3)

**Stage-Format** (`data/stages/*.json` und erzeugte Welt-Stages): `path` (Wegpunkte in Tiles, Tile-Mitten), `pathWidth`, `zones.rows` (Kachelmaske, Zeile = y, Spalte = x, `.` Boden, `h` Huegel, `#` blockiert, `p` Pfad nur Anzeige), `waves`. Die Sim laedt **Karte und Pfad aus der Stage** (`createSim({ stage })`), es gibt keine feste Karte; mehrere Karten liegen nebeneinander. Optionale Felder (Runde 8): `world`, `act`, `hpBp` (Gegner-HP-Faktor der Stage, wirkt auch auf die Bounty-Basis), `roster` (Anzeigenamen je Gegnertyp), `bossName`, `bossKits` (Welle -> Kit-ID; ohne Angabe gilt `kit.wave`), `theme` (Farbwelt, nur Client). Der Client zeichnet jede Karte aus der Maske (17 x 11).

**Welten** (`data/worlds/*.json`, `data/wave-template.json`): eine Datei je Welt, `loadGameData()` erzeugt daraus `<welt>-1` .. `<welt>-6` und `<welt>-infinite` (`src/data/worlds.ts`, `expandWorld`). Neue Welt = nur Daten, Anleitung und Inhalt: [docs/aa-import/welten.md](../docs/aa-import/welten.md). Vorschau: `npx tsx scripts/map-preview.ts [welt]`. Legend Stages und Raids (Runde 9 / P3, spielbar): `data/modes/*.json`, `loadGameData()` erzeugt daraus `legend-<id>-<act>` und `raid-<id>[-<act>]` auf der Karte der Host-Welt (`src/data/modes.ts`, `expandModes`); `StageData.affinity` legt Resistenzen/Schwaechen ueber alle Gegner der Stage. Details: [docs/aa-import/modi.md](../docs/aa-import/modi.md).

Boss-Kits ohne `wave` gehoeren keiner Welle und werden nur ueber `stage.bossKits` gewaehlt.
