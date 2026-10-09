# sim - deterministischer Simulationskern (Duskwardens, Runde 11)

Stand: **fertig für den Vertical Slice.** `createGame` mit dem Vertrag aus `docs/design/schnittstelle.md`: 3 Türme × 3 Pfade × 5 Stufen,
Held Wren (Level 1-20), Projektile mit Flugzeit, Gegner-Schichten, 20 Runden, 4 Fähigkeiten, Bot. 79 Tests (`npx vitest run`),
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
- Befehl-Gründe: `place`: `unknown-tower`, `locked`, `hero-limit`, `out-of-bounds`, `on-path`, `water`, `blocked`, `overlap`, `no-cash`; `upgrade`: `maxed`, `crosspath`, `locked`, `no-cash`, `hero`, `no-tower`;
  `ability`: `no-ability`, `cooldown`, `no-target` (Flare ohne Gegner in Reichweite); `startRound`: `spawning`, `no-more-rounds`; nach Spielende `game-over`.
- Der **Held ist nicht verkaufbar** (`sell` → `hero`), weil er einmal je Match gilt.
- `TowerState`/`EnemyState`/`ProjectileState`/`GameState` tragen zusätzliche Innenfelder (`cd`, `frac`, `round`, `groups`, `rng` …), die Teil des Hashes sind; die UI braucht sie nicht.
- `stats.leaked` = verlorene Leben durch Lecks (nicht Anzahl Gegner). `stats.pops` = geknackte Schichten je Turmtyp (inkl. Held `wren`).
- Pop-Zuordnung geht an den Turm, der den Treffer/Brand/Blitz/Explosion verursacht hat; ist der Turm verkauft, zählt der Pop nur für das Geld.
- Auto-Start schaltet erst nach dem manuellen Start von Runde 1 und startet die nächste Runde, sobald die vorige fertig gespawnt hat.

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
