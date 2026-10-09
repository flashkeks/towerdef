# sim - deterministischer Simulationskern (Duskwardens, Runde 11)

Stand: **fertig für den Vertical Slice.** `createGame` mit dem Vertrag aus `docs/design/schnittstelle.md`: 3 Türme × 3 Pfade × 5 Stufen,
Held Wren (Level 1-20), Projektile mit Flugzeit, Gegner-Schichten, 20 Runden, 4 Fähigkeiten, Bot, **Turm-XP im Match (Runde 11b)**. 101 Tests (`npx vitest run`),
`npx tsc --noEmit` sauber. Freeplay (R21+) ist **nicht** gebaut.

```bash
cd sim && npm install
npm test                      # vitest
npm run typecheck             # tsc --noEmit
npm run bot                   # Rauchtest: Standard-Strategien x easy/medium/hard
npm run bot -- "ranger 0-0-0 + ranger 0-2-4 + bombardier 4-2-0 + hero" medium 1   # eine Strategie, Schwierigkeit, Seed
```

## Einheiten

| Größe | Einheit |
|---|---|
| Position/Distanz | **Milli-px** (1 px = 1000) auf der 640 × 360-Karte; Dateien (`maps/*.json`) nennen px, Laden rechnet um |
| Zeit | **Ticks, 60 je Sekunde** (`TICKS_PER_SECOND`); Angriffsintervalle in **Milli-Ticks** (57000 = 57 Ticks = 0,95 s), damit Faktoren und Takt exakt bleiben |
| Tempo | Gegner: Bruchteile von Milli-px je Tick (`frac` 0..999, `progress` in Milli-px); Projektile: `speed` in px/s in den Daten, Milli-px/Tick im Zustand |
| Faktoren | Basispunkte (10000 = ×1,0) |
| HP/Schaden | ganze Zahlen, 1 = eine Glim-Schicht |
| Geld | ganze Münzen; Preise = Basispreis × Schwierigkeit (Basispunkte), kaufmännisch auf 5 gerundet (`round5`) |

Kein `Math.random`, `Date.now`, `Math.sin/cos` (Winkel über Ganzzahl-Tabelle in `trig.ts`). Zustand nur Ganzzahlen/Strings/Booleans;
`hash()` wirft bei Nicht-Ganzzahlen. Vergleiche mit Fließkomma (Sweep-Kollision) sind erlaubt, da nur `+ - * /` (IEEE, deterministisch).

## Tick-Reihenfolge (`tick()` in `game.ts`)

1. Auto-Start (wenn an, Runde ≥ 1, Spawn der letzten Runde fertig) und **Spawns** (Gruppen: Anzahl, Abstand, Start in ms → Ticks)
2. Fähigkeits-Abklingzeiten, Arrow-Rain-Restzeit
3. **Gegner**: Brand (alle 60 Ticks), Status herunterzählen, bewegen (Stehen bei Betäubung/Frost), Leck am Ende (Leben − aktuelle RBE)
4. Gegner-Raster (24-px-Zellen) neu aufbauen
5. **Türme** in Id-Reihenfolge: Held-Aura, Frost-Aura (Verlangsamung, Schaden), Donnerschlag, Abklingzähler, Ausholen (`windup`) → nach 6 Ticks Abschuss (`fire`)
6. **Projektile** in Id-Reihenfolge: Bogen/Landung bzw. Sweep-Kollision (Segment gegen Gegnerkreis), Treffer sortiert nach Position auf dem Segment
7. Tote entfernen, Rundenende (Bonus, Helden-XP), Sieg/Niederlage, Phase; `tick++`

Ein frisch abgeschossenes Projektil bewegt sich erst im Tick **nach** dem `fire`-Event (kein Schaden im selben Tick, außer Blitz/Aura/Beben).
Befehle (`apply`) wirken sofort und räumen danach Tote auf. Events kommen mit dem Tick, in dem sie passieren.

## Dateien

| Datei | Inhalt |
|---|---|
| `data/towers.json` | Ranger, Bombardier, Frostcaller (je `base` + 3 Pfade × 5 Stufen mit `name`, `price`, `desc`, `mods`) und Held `wren` (20 Level mit `xp`, `desc`, `mods`) |
| `data/enemies.json`, `rounds.json`, `difficulties.json` | Gegner (HP, Tempo, Radius, Kinder, Merkmale), 20 Runden (Gruppen), Schwierigkeiten |
| `data/maps/meadow.json` | Karte (P3 füllt Wasser/Blocker) |
| `src/data.ts` | statische JSON-Importe (läuft in Vite und Node, kein `node:fs`), zod-Schemas, Konsistenzprüfung beim Laden (`DATA`) |
| `src/stats.ts` | Kennwerte (`Stats`), Modifikatoren `add/mul/set/max`, Anwendungsreihenfolge |
| `src/game.ts` | `createGame`: Zustand, Befehle, alle Regeln |
| `src/map.ts`, `path.ts` | Karte, Weg, Platzierungs-Abstand, Wegabdeckung |
| `src/types.ts` | alle öffentlichen Typen |
| `src/bot.ts`, `scripts/bot.ts` | Bot und Kommandozeile |
| `src/fixed.ts`, `prng.ts`, `hash.ts`, `trig.ts` | Festkomma, sfc32, FNV-1a-Hash, Winkeltabelle |

### Modifikator-System

Ein Turm ist `base` plus eine Liste von Mods je Stufe: `{op: 'add'|'mul'|'set'|'max', stat, v}`. `mul` rechnet in Basispunkten und rundet nach jedem
Faktor ab. **Reihenfolge:** der Nebenpfad (niedrigere Stufe) zuerst, der Hauptpfad zuletzt, je Pfad Stufe 1…n. So überschreibt die Waffe des
Hauptpfads (z. B. Ballista) den Nebenpfad nie, und Intervall-Faktoren komponieren. Wissensbaum-`mods` werden danach auf die fertigen Kennwerte gelegt.

Wissensbaum-`mods`: `startCash`/`lives` additiv zu den Schwierigkeitswerten, `sellBp` = **absolute** Verkaufsquote (7500 = 75 %, Standard 7000),
`earlyBonus` = Zusatzgold zum Rundenbonus der Runden 1-10, `t1DiscountBp` = Rabatt auf alle Stufe-1-Upgrades (1000 = −10 %), `rangeBp[turm]` und `radiusBp`
(Explosions-/Nova-/Flare-Radius) additiv in Basispunkten, `slowDurBp` verlängert Verlangsamungen, `heroStartLevel` setzt Wrens Start-Level (XP passend).

## Ergänzungen zum Vertrag (`schnittstelle.md`)

- `Game.sandbox` (Tests/Sandbox): `spawn(type, progress?, camo?)`, `hurt(enemyId, amount, dtype?)`, `setCash(n)`.
- `UpgradeInfo` = `{ path, current, next (null = voll), name, desc, price, canBuy, reason? }`, `reason`: `maxed` | `crosspath` | `locked` | `no-cash`.
- Befehl-Gründe: `unlockTier`: `maxed`, `locked`, `no-xp`; `place`: `unknown-tower`, `locked`, `hero-limit`, `out-of-bounds`, `on-path`, `water`, `blocked`, `overlap`, `no-cash`; `upgrade`: `maxed`, `crosspath`, `locked`, `no-cash`, `hero`, `no-tower`;
  `ability`: `no-ability`, `cooldown`, `no-target` (Flare ohne Gegner in Reichweite); `startRound`: `spawning`, `no-more-rounds`; nach Spielende `game-over`.
- Der **Held ist nicht verkaufbar** (`sell` → `hero`), weil er einmal je Match gilt.
- `TowerState`/`EnemyState`/`ProjectileState`/`GameState` tragen zusätzliche Innenfelder (`cd`, `frac`, `round`, `groups`, `rng` …), die Teil des Hashes sind; die UI braucht sie nicht.
- `stats.leaked` = verlorene Leben durch Lecks (nicht Anzahl Gegner). `stats.pops` = geknackte Schichten je Turmtyp (inkl. Held `wren`).
- Pop-Zuordnung geht an den Turm, der den Treffer/Brand/Blitz/Explosion verursacht hat; ist der Turm verkauft, zählt der Pop nur für das Geld.
- Auto-Start schaltet erst nach dem manuellen Start von Runde 1 und startet die nächste Runde, sobald die vorige fertig gespawnt hat.

## Turm-XP und Freischalten im Match (Runde 11b)

Spezifikation: `docs/design/meta.md` „Nachtrag Runde 11b“. Zahlen in `data/xp.json` (`potBase` 8, `potPerRound` 5, `unlockCost` 100/250/900/2.500/8.000) und `difficulties.json` (`towerXpBp`: 10000/11000/12000).

- **Optionen:** `GameOptions.towerXp` = Konto je Turmtyp (aus dem Profil). Fehlt es, ist das XP-System aus: keine Verteilung, `unlockTier` → `no-xp`, `unlocks` wie bisher.
- **Zustand:** `state.towerXp` (Konto), `state.towerXpGained` (Summe im Match), `state.maxTier` (freigeschaltete Stufe je Pfad, Start = `unlocks.maxTier`, ohne `unlocks` überall 5), `state.roundPops` (Pops ohne Held seit dem letzten Rundenende). Alles ganzzahlig, im Hash.
- **Rundenende** (`endRound`, je Runde einzeln): Topf `floor((8 + 5 × Runde) × towerXpBp × (10000 + mods.towerXpBp) / 10^8)` (Medium R1–20 ≈ 1.330). Aufteilung (`splitTowerXp` in `src/xp.ts`, rein): je Typ **50 % nach `spent`** der stehenden Türme (Held nie) und **50 % nach `roundPops`**. Fehlt eine Hälfte, geht der ganze Topf nach der anderen; fehlen beide, gibt es nichts. Rest nach dem Abrunden an den Typ mit dem größten Anteil (Gleichstand: ranger, bombardier, frostcaller). Event `towerXp { round, pot, gains }`. Bei überlappenden Runden zählen die Pops seit dem letzten Rundenende.
- **`unlockTier { tower, path }`:** nächste Stufe des Pfads (`maxTier + 1`), Kosten aus `xp.json`, unabhängig vom Crosspath. Gründe: `maxed`, `locked` (Turm selbst nicht frei), `no-xp` (Konto zu klein oder kein XP-System). Event `unlockTier`. Danach geht `upgrade` auf diese Stufe (sonst `locked`).
- **Verdeckte Stufen:** `upgradeInfo` liefert je Pfad zusätzlich `unlocked` (maxTier), `unlockCost` und `revealed`; `unlockInfo(type)` das ganze Menü (3 × 5, `revealed`/`unlocked`/`cost`). Stufe 1 ist immer sichtbar, sonst nur wenn die Stufe davor freigeschaltet ist; sonst sind `name`/`desc` leer.
- **Crosspath** (`tiersAllowed`, unverändert): höchstens zwei Pfade belegt, höchstens einer ≥ 3; 5-2-0 geht, 2-2-2 und 3-3-0 nicht. Belegt in `test/towerxp.test.ts`.
- **Bot:** `BotResult.towerXpGained`; `npm run bot` zeigt `XP ranger/bombardier/frostcaller`.

## Regeln im Detail (wo der Entwurf Spielraum ließ)

- **Ziel/Anvisieren:** Gegner mit Mittelpunkt in Reichweite, `progress ≥ 8 px` (Spawn außerhalb des Bildes zählt nicht); Camo nur mit Erkennung oder `revealed` (Flare).
  Projektile, Explosionen, Auren, Blitze und Beben treffen Camo trotzdem. Das Ziel wird beim Ausholen gewählt; fällt es bis zum Abschuss weg (tot/außer Reichweite + 12 px), wird neu gewählt.
- **Vorhalt:** Pfeile, Bolzen, Bomben zielen auf die Position, an der das Ziel bei Ankunft steht (Weg + aktuelles Tempo, Betäubung/Frost eingerechnet). Pfeile fliegen weiter bis `Reichweite × 1,5`.
- **Kollision:** Gegnerradius + 3,5 px gegen das Segment des Ticks; je Gegner höchstens ein Treffer je Projektil; ein abgeprallter Treffer (Ironshell, Ember, Frost) verbraucht Pierce.
  Kinder eines von diesem Projektil geknackten Gegners sind für dieses Projektil tabu.
- **Explosion:** die `maxT` nächsten Gegner im Radius (+ Gegnerradius). Splitter (`frag`/`shard`) starten gleichmäßig verteilt mit zufälligem Startwinkel (PRNG, daher Seed-abhängig).
- **Nova (Frostcaller B1+):** der Bolzen platzt beim ersten Treffer (Rest-Pierce verfällt), trifft bis zu 6 Nachbarn im Radius (kalt, verlangsamt), B3+ wirft Eissplitter.
- **Funke (C1/C2):** jeder Treffer springt auf `sparkN` weitere Gegner (je nächster ungetroffener im Sprungradius). **Kettenblitz (C3+):** sofort, `chainN` Ziele nacheinander.
- **Brittle Ice:** `brittleTicks` wird gesetzt, wenn ein Turm mit B2 verlangsamt (Bolzen oder Aura); solange er läuft, nimmt der Gegner +1 aus jeder Quelle.
- **Verlangsamung:** stärkster Wert gewinnt, gleich starke frischen die Dauer auf. Boss: halbe Stärke, halbe Dauer; Aura wirkt auf den Boss nur mit `auraBossSlowBp` (A4: 25 %).
  Betäubung: Boss nur mit explizitem `stunBoss`. Einfrieren: nur Absolute Zero (Boss 1,5 s), Emberlinge immun. Brand: Boss halbe Dauer.
- **Held-Aura (L12/L17):** Türme (nicht Wren) im Umkreis 84 px: +10 % Angriffstempo bzw. +10 % Reichweite.
- **Helden-XP:** am Ende jeder Runde (wenn alle Gegner dieser Runde weg sind) 100 + 30 × Runde, nur solange Wren steht. Die Abklingzeit einer neuen Fähigkeit startet voll; Cooldown-Senkung (Flare L15, Dawnbreak L20) kappt den Rest auf die neue Gesamtzeit.
- **Rundenende** je Runde einzeln (auch bei Überlappung): Bonus 100 + Runde, `roundsCleared++`. **Sieg:** Runde 20 gestartet, nichts mehr unterwegs, Leben > 0. **Niederlage:** Leben ≤ 0 (sofort, im selben Tick).
- **Boss-Hülle** (`leviathan`): Pop-Cash 100, Überschuss geht nicht an die Brutes. Easy-Boss hat 200 HP (`difficulties.json: bossHp`).

## Bot (`src/bot.ts`)

`Strategy = { towers: [{type, tiers, target?}], hero?, heroAfter?, maxField?, script? }`, oder als Text: `"ranger 0-0-0 + ranger 0-2-4 + bombardier 4-2-0@strong + hero"` (`parseStrategy`).
Reihenfolge ohne `script`: erst alle Türme platzieren (Listenreihenfolge), dann Upgrades stufenweise (alle Stufe-1, dann Stufe 2 …; je Turm zuerst der Pfad mit der höchsten Zielstufe); der Held kommt
nach den Upgrades der Stufe `heroAfter` (Standard 1). Mit `script: "p0 p1 u0B u0B h u1A"` ist die Reihenfolge frei (`pN` platzieren, `uNX` Pfad A/B/C, `h` Held). Gekauft wird strikt in dieser Reihenfolge, sobald das Geld reicht.
Plätze: Wegabdeckung in Reichweite ×1,2, bereits abgedeckter Weg zählt 35 % (Türme verteilen sich entlang des Wegs). Nächste Runde, sobald das Feld leer ist (`maxField` lockert das).
Fähigkeiten bei Bereitschaft und Bedarf (Gegneranzahl/Boss). Ein 20-Runden-Lauf braucht ca. 0,3-0,5 s. `runBot(strategy, {difficulty, seed})` liefert Runde, Leben, Pops je Turm, Ausgaben, Held-Level, Hash.

### Rauchtest-Ergebnisse (Seed 1, Stand dieses Commits)

Ergebnis „Runde / Leben“; `S` = Sieg. Die Strategien kaufen früh Füller-Türme (`ranger 0-0-0`) wie ein Spieler mit 650 Startgold.

| Strategie (+ Held) | Easy | Medium | Hard |
|---|---|---|---|
| ranger 0-0-0, ranger 0-2-4, bombardier 0-0-0, bombardier 4-2-0 | S 193 | S 61 | R18 |
| ranger 0-0-0 ×2, bombardier 4-0-2 | S 188 | S 36 | R20 |
| ranger 0-0-0, ranger 0-4-2, frostcaller 0-0-0, frostcaller 2-4-0 | S 185 | S 14 | R15 |
| frostcaller 0-0-0 ×2, frostcaller 2-0-4 | S 200 | R20 | R15 |

Befunde für P5: (1) **Wren trägt 35-45 % aller Pops** für 540 Gold (≈ 6× pro Gold gegenüber einem T4-Turm); Helden-XP ist gratis. Ohne Held verliert fast jede Strategie in Runde 8-12. Kandidat zum Dämpfen,
wenn Max es zu stark findet. (2) Mehrere billige Türme desselben Typs gewinnen allein (`ranger ×3`, `bombardier ×3`): „kein einzelner Turm schafft alles“ gilt nur bei wenigen Türmen. (3) Ein Turm ohne Ranger-Füller (nur Bombardier + Frostcaller, je eine Einheit) überlebt Runde 7-9 nicht.
(4) Hard ist mit dem Bot nahe an der Grenze, Easy trivial.

## Abweichungen vom Entwurf

| Was | Entwurf | Jetzt | Grund |
|---|---|---|---|
| Gegnertempo | Red 52 px/s Easy, Medium ×1,1, Hard ×1,25 | `speedBp` Easy 7500, Medium 8500, Hard 9000 (Red 39 / 44 / 47 px/s) | Mit den Rundendichten und dem Einkommen von ~8300 Gold ließ sich Runde 7+ nicht halten, selbst mit 30000 Gold gewannen Doppel-T5 nicht zuverlässig. Längere Verweildauer ist der gleichmäßigste Hebel (wirkt auf alle Türme gleich). |
| Bombardier Grundradius | 24 px | **32 px** | Mit 24 px (Gegnerabstand in Strömen ≈ 38 px) traf eine Bombe selten mehr als einen Gegner; ohne Ranger-Füller war der Turm unspielbar. Alle Pfad-Faktoren bleiben. |
| Dawnbreak gegen den Boss | L10: 300, L20: 1.200 | **L10: 100, L20: 240** (Beschreibung angepasst) | Mit 300 Hülle tötete schon die erste Dawnbreak den Leviathan allein. Jetzt braucht der Boss Vorbereitung durch Türme. |
| Ranger C3 Intervall | 1,3 s fest | Faktor ×1,368 auf das aktuelle Intervall (≈ 1,3 s ohne Pfad B) | Pfad-B-Stufen 1-2 (2-0-3 …) wirken sonst nicht auf die Balliste. |
| Ranger B5, C3 | `Schaden/Pierce` fest | `max` statt `set` für Schaden/Pierce (B5, C3) | A1/A2-Pierce geht beim Waffenwechsel nicht verloren. |
| Brittle Ice | „verlangsamte Gegner“ | nur wenn **dieser** Frostcaller (B2) sie verlangsamt hat | „aus allen Quellen“ gilt für den Schaden; ein Bolzen eines B2-losen Turms setzt das Merkmal nicht. |
| Held verkaufen | nicht festgelegt | nicht möglich | „einmal je Match“. |
| Sandbox | – | `Game.sandbox` | Tests brauchen gesetzte Gegner. |
| Freeplay | optional | nicht gebaut | Zeit. |

### Abweichungen aus P5 (Balance-Rauchtest, Hauptsitzung)

- `popCash` 2 je Schicht (neues Pflichtfeld in `difficulties.json`), Boss-Hülle weiter 100.
- Wren-XP am Rundenende `60 + 20 × Runde` (vorher 100 + 30 ×), Dawnbreak 12/36 statt 20/60 an Normalgegnern.
- Brute-Tempo 130 statt 160; R17 14 und R19 22 Brutes; Hard `speedBp` 10000 und `bossHp` 400.
- Regel-Tests laufen auf der Testkarte `bare` (meadow ohne Wasser/Blocker, `test/setup.ts`), Bot-Läufe auf `meadow`.
- Matrix aller sinnvollen Aufstellungen: `npm run matrix` (`MATRIX_SEEDS`, `MATRIX_DIFFS`); die Sim ist deterministisch, Seeds ändern derzeit nichts am Ergebnis.

## Runde 12: Powers

Verbrauchs-Items, im Match per Befehl `{ type: 'power', power, x?, y? }` eingesetzt. Spezifikation und Abweichungen: `docs/design/powers.md`, Daten: `sim/data/powers.json` (`DATA.powers`, `DATA.powerOrder`, `POWER_KEYS`).

- **Zustand:** `state.powers` (Restbestand aus `GameOptions.powers`), `state.powerUsedRound` (Runde des letzten Einsatzes, -1 = nie; je Art ein Einsatz je Runde), `state.traps`, `state.stats.powersUsed`; Innenleben `warpLeft`, `oilRound`, `oilCarry`. Alles Ganzzahlen, im Hash.
- **Befehl:** Gründe `unknown-power`, `no-power`, `used-this-round`, `no-hero`, `maxed`, `invalid-target`, `not-on-path`, dazu die Platziergründe beim Insta-Warden. Verbraucht wird nur bei Erfolg. `game.canUsePower(...)` ist der Trockenlauf.
- **Sofort:** Gold Drop (+500), Extra Lives (+25), Hero Boost (+3 Level, XP auf die Schwelle, `heroLevel`-Events), Lantern Bomb (Explosion 40 px, 20 Schaden `explosive` an den nächsten 40, Boss 100; Quelle 0, keine Turm-Pops).
- **Zeitlich:** Time Warp (`warpLeft` = 600 Ticks, -50 % Tempo, Boss -25 %, wirkt in `enemySpeed`), Lantern Oil (Pop-Cash +25 % mit Bruchrest bis Ende der nächsten Runde).
- **Fallen:** Objekte auf der Wegmitte (`nearestOnPath` in `path.ts`). In `updateEnemies` prüft `crossTraps`, ob der Wegfortschritt eines Gegners im Tick eine Falle überquert (`before < falle.progress <= neu`), in Wegreihenfolge. Caltrops: 1 `magic`-Schaden und 1 Ladung je Gegner (20 Ladungen, laufen am Ende der nächsten Runde ab). Frost Trap: friert 180 Ticks ein (15 Ladungen), Boss/Emberling/Eingefrorene lassen sie unberührt. Events `trap`, `trapGone`.
- **Insta-Warden:** `spawnTower` mit fertigen Stufen, `spent = 0` (Verkaufswert 0), ohne Kosten und ohne Stufen-Sperre.
- **Vorschau:** `game.roundPreview(r)` -> `{ round, groups, rbe, hasCamo, hasArmor, hasEmber, hasBoss }`.
- Tests: `test/powers.test.ts` (Daten, Bestand/Sperre, jede Power, Fallen-Kollision, Insta-Varianten, Vorschau, Determinismus).

## Runde 13: Lantern Market, Longshot, größerer Wissensbaum

Spezifikation: `docs/design/tuerme-r13.md`, Vertrag: `docs/design/schnittstelle.md` „Ergänzung Runde 13“. Daten: `data/towers.json` (`longshot`, `market`), Stats in `src/stats.ts`. Tests: `test/market.test.ts`, `test/longshot.test.ts`, `test/r13mods.test.ts`. 173 Tests.

**Lantern Market (`market`).** `atk: 'none'`; `range` = Wirkradius der Auren (80 px, `TowerState.range`). Einkommen (`income`, additiv über die Pfade: 60 + A + B1) wird in `endRound(r)` ausgezahlt, **vor** Wren-XP und Turm-XP, je Runde einzeln (Überlappung zahlt je beendeter Runde). Reihenfolge je Market: Betrag = `income × (10000 + marketBp + goldenBp) / 10000` (Golden Exchange = höchster `goldenBp` unter den *anderen* Markets, nicht gestapelt). Mit Bank (`bankOn`): `Konto + Zinsen(altes Konto, Satz = bankRateBp + Compound Interest) + Einnahmen`, gedeckelt auf `bankCap`; **was über den Deckel geht, wird als Geld ausgezahlt** (Event `income.cash`), nichts verfällt. `withdraw` zahlt das Konto aus, Verkauf zahlt es mit (`sellValue` enthält es). Konto zählt nicht als Geld.
**Auren (Pfad C)** wirken auf alle anderen Türme (inkl. Wren, nicht auf Markets selbst) im Radius, Mitte zu Mitte. Je Feld zählt der stärkste Wert aller Markets (`auraOf`): Reichweite (additiv zur Helden-Aura; Longshot ignoriert sie), Erkennung (`t.camo` wird jeden Tick neu gesetzt), Tempo (additiv zu Helden-Aura, Elite, Wissensbaum), Armory (`sharp` wird `magic` und +1 Pierce, nur Projektile), +1 Schaden (Projektil, Bombe, Kettenblitz, bei der Berechnung des Schusses), Upgrade-Rabatt (nach Cheaper Basics/Veteran Primaries, vor der 5er-Rundung). Grant: globale Fähigkeit `grant` (Summe über alle Markets mit Grant Office, Abklingzeit 90 s).

**Longshot (`longshot`).** `range` 1.000.000 Milli-px = `GLOBAL_RANGE` (exportiert aus `game.ts`): `pickTarget` geht dann über `state.enemies` statt über das Raster, Reichweiten-Auren gelten nicht. Projektil `snipe` 3.000 px/s = 50.000 Milli-px je Tick, Lebensdauer 30 Ticks; Treffer wie bei jedem Projektil per Sweep beim Fliegen (nie im Tick des Abschusses). Pfad A: `set dmg`/`dtype`, `bonusBrute`/`bonusBoss` (gelten wie überall: Boss bekommt beide), Lanternbreaker `hitStunBoss` (30 Ticks). Pfad B: Intervall-Faktoren, B5 `set 7200` + `max dmg 4`; **Focus** = globale Fähigkeit, `focusLeft`, Tempo ×2 für alle Longshots (480 Ticks, 3600 Abklingzeit). Pfad C: Shrapnel (`fragOnHit`, 3 Splitter an der Trefferstelle, ohne den Getroffenen), Ricochet (`ricochet()`: sofort bis zu 2 weitere Gegner im Umkreis 60 px, je Sprung 1 Schaden weniger, mindestens 1, ohne Bonus, Event `ricochet`), **Supply Drop** (globale Fähigkeit, jeder Longshot mit C3 liefert seine Kiste), Elite Sniper (`eliteBp` +40 % Tempo für alle Longshots, größter Wert gilt; `eliteStrong`: Brute vor Boss), **Crippling Shot** (Nicht-Boss −50 % für 120 Ticks; Boss bekommt `markTicks` 180 / `markBp` 2000 *statt* Verlangsamung; `damage()` rechnet die Markierung nach Brittle Ice als `+ (Schaden × bp + 5000) / 10000`).

**Turm-XP.** `XP_TOWER_TYPES` (`src/xp.ts`) hat fünf Typen, Rest-Reihenfolge ranger, bombardier, frostcaller, longshot, market. Market hat keine Pops und bekommt damit nur den Geld-Anteil. `GameOptions.towerXp`/`unlocks.maxTier` sind `Partial`: fehlende Typen = Konto 0 bzw. Stufen `[0,0,0]` (die Meta füllt sie immer).

**Neue Wissensbaum-Mods** (`GameOptions.mods`): `t2DiscountBp`, `tempoBp`, `freezeAddTicks`, `marketBp`, `bankRateBp`, `supplyBonus`, `marketRadiusBp`, `marketPriceBp` (nur Kaufpreis des Markets), `heroXpBp`, `powerUses`, `freePowers`. Spare Pocket: `state.powerUses` zählt die Einsätze der Runde `powerUsedRound`.

**Bot und Matrix.** `parseStrategy` kennt `longshot`/`market`. Support-Türme (Longshot, Market) stehen abseits des Wegs (Market mit Pfad C mittig zwischen den Türmen). Der Bot hebt Banken nur ab, wenn der nächste Kauf sonst nicht klappt; Grant und Supply Drop löst er sofort aus, Focus bei ≥ 6 Gegnern oder Boss. `BotResult.income` / `abilityCash`. Die Matrix hat Zeilen mit festem `script` (Market früh/mitte/spät), `{H}` = Held-Kauf.

### Abweichungen und Auslegungen Runde 13

| Was | Entwurf | Jetzt | Grund |
|---|---|---|---|
| Bank-Deckel | „max. 3.000“ | Überlauf wird als Geld ausgezahlt | nichts soll verfallen; ein volles Konto zahlt dann Zinsen + Einnahmen jede Runde |
| Fähigkeiten Grant / Supply Drop | je Turm | global, mehrere Türme addieren, gemeinsame Abklingzeit | wie Arrow Rain; gleichwertig zu je einer Fähigkeit je Turm |
| Elite Sniper „Strong bevorzugt Brutes“ | unklar | Brute-Rang 9, über dem Boss (8), nur wenn der Longshot Elite hat | sonst ändert sich nichts (Brute steht schon über Ironshell) |
| Lanternbreaker-Taumeln | 0,5 s | 30 Ticks nur gegen den Boss; die Boss-Hülle (300/400 HP) fällt aber schon durch den Schuss (80 + 10 + 500) | Zahlen laut Entwurf; Taumeln wirkt nur, wenn der Boss mehr Hülle hat |
| Ricochet | „je −1 Schaden“ | −1 je Sprung, Mindestschaden 1, kein Brute-/Boss-Bonus, Sprungweite 60 px | Sprungweite war offen |
| Wissensbaum | 30 Knoten | **28** (ohne Field Medic; Summe 52 statt ≈ 55 Punkte) | Tabelle ergibt 29 Einträge, Field Medic kommt mit Runde 14 |
| Veteran Primaries | T2 −10 % | nur Ranger/Bombardier/Frostcaller; Cheaper Basics (T1) gilt für alle Türme | Name „Primaries“ |
| Thick Walls | +15 Leben | +15 zusätzlich zu Extra Lives (+10) = 25 | beide im selben Ast |
| Scholar, Ember Pouch, Bulk Buyer, Starter Kit | Mods an die Sim | Scholar/Ember Pouch/Bulk Buyer sind reine Meta-Wirkungen (`applyMatch`, `buyPower`); Starter Kit = `mods.freePowers` + Abzug im Inventar | Spieler-XP, Embers und Store kennt die Sim nicht |

### Rauchtest und Matrix (Seeds 1-3, `npm run matrix`)

Stand dieses Commits, Zeilen der neuen Aufstellungen (Ø Leben bei Sieg, sonst Ø Runde):

| Aufstellung | Held | easy | medium | hard |
|---|---|---|---|---|
| Ranger + Bombardier (Referenz) | ja / nein | 200 L / 200 L | 150 L / 100 L | 65 L / R18 |
| Ranger + Longshot 4-2-0 | ja / nein | 200 L / 82 L | 78 L / R18 | R17 / R10 |
| Ranger + Longshot 0-3-3 | ja / nein | 200 L / 189 L | 149 L / 129 L | 82 L / R18 |
| Bombardier + Longshot 4-2-0 | ja / nein | 200 L / 200 L | 98 L / 22 L | R18 / R13 |
| nur Longshot (4 Stück) | ja / nein | 165 L / R18,7 | 60 L / R18 | R13,7 / R10,7 |
| + Market 1-0-0 früh (R4) | ja / nein | 200 L / 164 L | 150 L / R16 | R20 / R12 |
| + Market 2-2-0 mitte | ja / nein | 200 L / 153 L | 106 L / R15 | R18 / R13 |
| + Market 2-2-0 spät | ja / nein | 200 L / 171 L | 150 L / R20 | R20 / R13 |
| + Market 0-4-0 Grant mitte | ja / nein | 136 L / R17 | R20 / R15 | R18 / R13 |
| + Market 0-0-3 Drum Hall früh | ja / nein | 200 L / 134 L | 146 L / R15 | R16 / R12 |

Befunde: (1) Longshot-Kombinationen schaffen Medium **mit** Held (Ranger + Longshot 0-3-3 sogar ohne und auf Hard mit Held); Pops je 1.000 Gold liegen bei 425-640 (Bombardier/Frostcaller 555-565, Ranger 200-400): kein Turm um mehr als 2×. (2) Market in 20 Runden: A1 früh bringt 1.050 Einnahmen für 1.400 Gold (Medium), A2 1.450 für 2.000: Gold-Turm lohnt nur bei Bau in den ersten Runden und selbst dann ≈ ausgeglichen; später Bau kostet Leben (mitte 106 L statt 150 L). Grant mitte frisst 9.300 Gold und verliert gegen die Referenz. (3) Der Bot setzt Market-Pfad C nicht gezielt ein (Aura nützt erst mit mehreren ausgebauten Türmen, 15.000 Gold für Lantern Capital sind bis R20 kaum erreichbar).

## Runde 14: Thornweaver, Alchemist, Wissensbaum-Mods

Spezifikation: `docs/design/tuerme-r13.md` (Abschnitte 3, 4, „Runde 14“), Vertrag: `docs/design/schnittstelle.md` „Ergänzung Runde 14“. Daten: `data/towers.json` (`thornweaver`, `alchemist`, je 15 Stufen), Stats in `src/stats.ts`, Mechanik in `game.ts` (Block „Runde 14: Thornweaver und Alchemist“). Tests: `test/thornweaver.test.ts`, `test/alchemist.test.ts`, `test/r14mods.test.ts`. 227 Tests.

**Thornweaver (`thornweaver`).** Projektil `thorn` (450 px/s), Fächer 5 (Spread 12°) bzw. 8 rundum mit Thorn Burst. Pfad A: Pierce, Kettenblitz (`chain`-Event, Takt 2,3 s, Ziele 4/8/15, Schaden 2/3/6, `energy`), Wirbelwind (Takt 4 s, Rückstoß 40 px Wegfortschritt, nie Boss), Avatar (+1 Schaden je 25 Gegner auf der Karte, höchstens +10). Pfad B: Vine Snare (alle 3 s der vorderste freie Nicht-Boss 1,5 s fest, setzt `stunTicks`), **Wall of Trees** (globale Fähigkeit `wallOfTrees`: Wand am Ende des vom Turm erreichten Wegstücks, 6 px davor, schluckt 150 RBE, Abklingzeit 45 s, ungenutzt 40 s Lebensdauer; Boss läuft durch), Ranken-Zone (Radius = Reichweite, 1 Schaden/s an alles darin, auch Boss; World Tree 5/s, Radius ×2, +100 Gold je Runde). Pfad C: Reichweite, Camo, Jungle's Bounty (+150 Gold, +2 Leben je Runde), Spring Blessing (andere Türme im Radius +15 % Tempo, wirkt zusätzlich zu Trank/Auren), Grove Guardian (`magic`, +3).

**Alchemist (`alchemist`).** Trank im Bogen (`potion`, Flugzeit 36 Ticks, Treffer erst bei Ankunft, zielt auf die Position, an der das Ziel ankommt), Spritzer Radius 18 px auf bis zu 12 Gegner, Säure als DoT (1/s, 2 Treffer, `magic`). Pfad A: Radius, Acidic Mixture (Säure 2/s, +1 Ironshell/Brute), **Berserker Brew** (alle 6 s Trank auf den Turm im Radius mit dem kürzesten Rest; Märkte bekommen keinen), Stimulant, Permanent Brew (alle Türme im Radius dauerhaft, keine Würfe). Pfad B: Säure 3/s, Perishing Potions, Unstable Concoction (markiert, Explosion beim Tod, 24 px / 4), **Transforming Tonic** (globale Fähigkeit `tonic`: 20 s Monster-Form, alle 12 Ticks 6 Schaden = 30/s auf das stärkste Ziel in Reichweite, Abklingzeit 60 s), Total Transformation (+5 nächste Türme, nie Markets). Pfad C: Faster Throwing, Säurepfützen (20 Treffer, 1 Schaden je 0,5 s, 30 s ohne Treffer weg, in der Nähe aufgefrischt statt verdoppelt), Lead to Gold (+40 je geknacktem Ironshell), Rubber to Gold (30 s +1 Gold je Schicht, Kinder erben), Shrink Potion (alle 3 s der stärkste Nicht-Boss in Reichweite wird Red Glim; abgetragene Schichten zahlen wie Pops; ein Geschrumpfter leckt höchstens 1 Leben).

**Wissensbaum-Mods** (`GameOptions.mods`): `popCashBp` (Bruchrest `popCarry`), `pierceAdd`, `fragAdd` (nur Türme, die schon Splitter werfen), `icicleDmg`, `bountyGold`, `brewDurBp`, `leadGoldAdd`, `roundLives`, `gate` (`gateLeft`, Event `gate`), dazu `rangeBp.thornweaver`.

**Bot.** `parseStrategy` kennt `thornweaver`/`alchemist`; Fähigkeiten: `wallOfTrees` bei ≥ 10 Gegnern oder Boss, `tonic` bei ≥ 15 oder Boss. `BotResult.groveGold/healed/bountyGold`. `scripts/matrix.ts` hat acht neue Zeilen plus eine Pops-je-1.000-Gold-Tabelle für Einzeltürme (`MATRIX_POPS=0` schaltet sie ab).

### Abweichungen und Auslegungen Runde 14

| Was | Entwurf | Jetzt | Grund |
|---|---|---|---|
| Alchemist-Basisintervall | 2,0 s | **1,5 s** | Matrix: 4 Alchemisten allein kamen auf Medium nur bis R7 (Pops je 1.000 Gold 223 gegen 628 beim Ranger); mit 1,5 s R9 / 257. Faster Throwing (× 0,75) wirkt darauf: 1,125 s |
| Fähigkeiten `wallOfTrees` / `tonic` | je Turm | global wie Arrow Rain, eine Abklingzeit, wirkt an allen passenden Türmen | einheitlich mit Runde 13; `wallOfTrees` ohne Weg in Reichweite: `no-target` |
| Wall of Trees schluckt | „150 RBE“ | Kapazität 150 RBE je Wand; Schichten zahlen wie Pops (`wallEat.cash`), Boss läuft durch | Boss darf nicht gestoppt werden |
| Shrink Potion | „wird zu Red Glim“ | gleiche Id und Position, Schichten zahlen wie Pops, höchstens 1 Leben Leck | sonst wäre Shrink Gold-Quelle und Leck-Multiplikator |
| Permanent Brew | „dauerhaft auf allen Türmen im Radius“ | wirkt über `Game.buffOf`, nicht in `TowerState.buff*`; `brew`-Event nur beim ersten Mal je Turm (`ticks: 0`) | UI braucht ein Signal, kein Dauerfeuer |
| Spring Blessing | +15 % Tempo | als `groveSpeedBp` getrennt von Trank-Tempo (`TowerBuff`), beides additiv | Anzeige beider Quellen |
| Avatar of Wrath | +1 je 25 Gegner | zählt alle lebenden, schon erschienenen Gegner (`state.enemies`), Deckel +10 | Entwurf unklar |
| Field Medic | im Wissensbaum | `mods.roundLives` bei Rundenende, Event `heal` mit `tower: 0` | kein Turm als Quelle |
| Wissensbaum-Zeilen | – | Voraussetzungen immer in früherer Zeile (Investor Zeile 5, Pop Bonus 6, Sturdy Gate Zeile 3) | Linien laufen nach unten, Layout-Test |
| Gate (Sturdy Gate) | „ein Leck verhindert“ | der Gegner verschwindet ohne Leben-Abzug, Event `gate` | einfachste Lesart |

### Bot-Matrix Runde 14 (Seeds 1-3, `npm run matrix`)

Zeilen der neuen Aufstellungen (Ø Leben bei Sieg, sonst Ø Runde):

| Aufstellung | Held | easy | medium | hard |
|---|---|---|---|---|
| Ranger + Thornweaver 4-2-0 (Storm) | ja / nein | 200 L / 182 L | 150 L / 13 L | 24 L / R15 |
| Ranger + Thornweaver 0-4-2 (Wild) | ja / nein | 200 L / 196 L | 146 L / 85 L | 31 L / R15 |
| Bombardier + Thornweaver 0-2-4 (Grove) | ja / nein | 214 L / 53 L | R20 / R16 | R16 / R14 |
| nur Thornweaver (4 Stück) | ja / nein | R20 / R15 | R17 / R14 | R15 / R14 |
| Ranger + Alchemist 4-0-2 (Brews) | ja / nein | 200 L / 188 L | 137 L / 69 L | R20 / R18 |
| Bombardier + Alchemist 0-4-2 (Tonic) | ja / nein | 200 L / 197 L | 122 L / R20 | R12 / R12 |
| Ranger + Bombardier + Alchemist 3-0-3 | ja / nein | 200 L / 171 L | 150 L / 12 L | 9 L / R13 |
| nur Alchemist (4 Stück) | ja / nein | 100 L / R20 | R9 / R9 | R7 / R7 |

Pops je 1.000 Gold (vier Türme voll ausgebaut, Medium): Ranger 628, Longshot 460, Frostcaller 454, Bombardier 410, **Thornweaver 388**, **Alchemist 257**. Faustregel „kein Turm um mehr als 2×“: Thornweaver liegt mit 1,6× innerhalb, der Alchemist mit 2,4× knapp außerhalb, aber der Alchemist ist ein Unterstützer — seine Wirkung (Berserker/Permanent Brew, Tonic, Gold) zählt der Pops-Wert nicht: Ranger + Bombardier + Alchemist 3-0-3 gewinnt Hard mit Held (3/3, aber nur 9 L; die Referenz Ranger + Bombardier hält 65 L) und Medium ohne Held mit 12 L (Referenz 100 L): die Buffs gleichen die Kosten des Alchemisten also noch nicht ganz aus. Befunde: (1) Thornweaver trägt Hard mit Held (Storm/Wild neben Ranger), ist allein aber kein Siegturm (R14-17); (2) Alchemist allein ist bewusst schwach (R9 Medium), erst Brews/Tonic neben Basistürmen lohnen; (3) Bombardier + Thornweaver Grove verliert gegen die Referenz — Grove (Gold/Leben/Tempo-Aura) ist ein Wirtschaftspfad, der Bot nutzt ihn nur halb. Offen für die Hauptsitzung: ob der Alchemist-Pops-Wert (2,4×) per Radius +10 % oder Säure 2/s auf Stufe 0 noch angehoben werden soll.
