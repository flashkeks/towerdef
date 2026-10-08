# Welten, Acts und Karten (Runde 8 / P3, Runde 9 / P2)

Story-Struktur nach `docs/anime-adventures/data/maps.json`: **Welt -> 6 Acts, Boss am Act-Ende**, danach Infinite. Alles ist Daten, eine neue Welt braucht null Zeilen Code.

## Was spielbar ist

| Welt | AA-Vorbild | Karte (17 x 11) | Pfad | Farbwelt | Besonderheit |
|---|---|---|---|---|---|
| 1 `greenie` Planet Greenie | Planet Namak / Greenie ("fairly long path") | Spirale nach innen, Basis in der Mitte | 57 Kacheln | Tuerkis-Gras, gelbgruener Weg | Bosse Zarbo, Goldeo, Zezoom, Jayce/Vurtor, Gunyu, Freezo |
| 2 `walled-city` Walled City | Shiganshinu / Walled City ("complex-looking path") | enge Schlangenlinie, viele Kurven, Gassen mit einer Kachel Abstand | 44 Kacheln | graues Pflaster, Steinmauern als Huegel | Schild-Gegner ab Act 4, Welle 15 (AA belegt); Bosse Jaw bis Colossal Titan |
| 3 `snowy-town` Snowy Town | Snowy Town ("short path, one curve around the center") | Hufeisen um den Dorfkern (Haeuser blockiert) | 31 Kacheln | Schnee, Eisweg | Regen-Gegner ab Act 4, Welle 10 (AA belegt); Bosse Yahobu bis Muzo |

**Runde 9 / P2: Welten 4-10** (Reihenfolge wie `maps.json`, Namen = Rerelease-Namen). Karten sind jetzt **groesser als 17 x 11**, das Raster ist Eigenschaft der Welt-Datei (siehe unten).

| Welt | AA-Vorbild | Karte | Pfad | Modifikatoren (angelehnt an `waves.json` `storyWaveEvents`) |
|---|---|---|---|---|
| 4 `sand-village` Sand Village | Hidden Sand Village (16 s) | 22 x 13 | 46 Kacheln, Treppe nach rechts unten, zurueck am Duenenfuss zur Basis; Sand/Braun | ab Act 4 gepanzerte Brutes, schnelle Runner. Bosse Hido bis Sashora |
| 5 `navy-bay` Navy Bay | Marine's Ford (14 s) | 22 x 12 | 61 Kacheln, vertikale Schlangenlinie ueber vier Stege; Hafenblau | `armored` als Naeherung fuer `fortify` (Marine Flagbearer, ab Act 2 Welle 10); Schild ab Act 4. Bosse Marine Battleship bis Senbodu |
| 6 `fiend-city` Fiend City | Ghoul City (20 s) | 24 x 14 | 66 Kacheln, hohe Rechteckwelle ueber vier Haeuserbloecke, Ausgang am Ostrand; Nachtviolett | Regen ab Act 4 Welle 10 (Aogiri Executives, AA belegt). Bosse Hammer bis Owl |
| 7 `spirit-world` Spirit World | Hollow World (24 s) | 24 x 14 | 73 Kacheln, einmal um den Rand, dann Haken nach innen (Basis in der Mitte); Blasslila | gepanzert ab Act 3, schnelle Flyer ab Act 4. Bosse Massive Hollow bis Coyote |
| 8 `ant-kingdom` Ant Kingdom | Ant Kingdom (15 s) | 22 x 14 | 54 Kacheln, unregelmaessiger Bau mit Haken; Erdbraun | Schild auf Brutes ab Act 4 (Naeherung fuer `egg_spawner`: Massive Ant mit 5 Schilden). Bosse Officer Ant bis Queen Ant |
| 9 `magic-town` Magic Town | Magic Town (22 s) | 24 x 14 | 69 Kacheln, drei lange Bahnen im Z; Violett/Gold | schnelle Runner ab Act 2 Welle 10 (Fire Mages), gepanzerte Grunts/Brutes ab Act 4 Welle 10 (Ice Mages). Bosse Phantom Conjuration bis Phantom Mage |
| 10 `haunted-academy` Haunted Academy | Cursed Academy (23 s) | 24 x 14 | 97 Kacheln, Umweg durch drei Fluegel, am Ende nach innen; Dunkelgruen | Regen ab Act 2 Welle 10, Act 3-4 Welle 8, Act 5-6 Welle 6 (Death Painting Curse als normaler Gegner, AA belegt). Bosse Death Painting Curse bis Mahoti |

Welt-HP-Faktoren 1,3 / 1,4 / ... / 1,9 (Welt 4-10), Element-Versatz je Welt anders. Alle sieben: Freischaltung `afterAct` 6 der Vorwelt (Entscheidung Max), Infinite nach Act 3. Acts 1-3 je 15 Wellen, 4-6 je 20 (wie Welt 1-3; AA nennt nur "mindestens 15"). Boss-Kits wie bei Welt 1-3 (Act 1 `charger` ... Act 6 `colossus`); Act-Titel = Bossname (AA nennt keine eigenen Titel fuer diese Welten).

Je Welt: Act 1-3 mit 15 Wellen, Act 4-6 mit 20 Wellen (AA: "mindestens 15", Schild in Act 4 Welle 15). Welle N ist die Boss-Welle (Boss + Elite + Grunts). Dazu **Infinite** (`<welt>-infinite`): 14 feste Wellen, danach erzeugt (Boss alle 10 Wellen, wie AA).

**Freischaltung:** Act n+1 nach Act n (irgendeine Schwierigkeit); Welt 2 nach Act 6 von Welt 1, Welt 3 nach Act 6 von Welt 2 (`unlock` in der Welt-Datei, Zahl frei einstellbar; wie AA, Entscheidung Max 08.10.2026); Infinite nach Act 3 der Welt. Der Fortschritt liegt im Profil (`stages[stageId][difficulty]`), kein neues Profilfeld, keine Migration. Replays auf gesperrten Stages zahlen nichts (`stage-locked`).

**Belohnung** (design-brief § 1): Erst-Clear eines Acts 80 Crystals + 50 XP (Normal; Hard 120 / 80 XP, Nightmare 160 / 115 XP), Wiederholung 20 Crystals (Hard 30, Nightmare 40). Gold und XP je gehaltener Welle werden auf die Wellenzahl des Acts gekappt. Infinite zahlt die AA-Gem-Tabelle (Welle 6: 18, 7-14: je 3, 15-105: je 5, Summe 497) 1:1 als Crystals, nur fuer den Zuwachs ueber der bisherigen Bestwelle. Alles aus dem nachgerechneten Replay: `meta/src/verify.ts` liest Stage und Schwierigkeit aus dem Replay-Kopf, ein umgebogener Kopf liefert einen anderen Hash (`replay-mismatch`).

## Daten

| Datei | Inhalt |
|---|---|
| `sim/data/worlds/<welt>.json` | Karte (Wegpunkte, Pfadbreite, Zonenmaske), Farbwelt (`theme`), Acts (Name, Boss, Boss-Kit, Wellenzahl, HP-Stufe, Modifier), Anzeigenamen der Gegner (`roster`), Welt-HP-Faktor, Element-Versatz, Freischaltung, Infinite |
| `sim/data/wave-template.json` | gemeinsame Wellen-Vorlage (19 Wellen ohne Boss, Boss-Welle als Anhang); AA hat keine Wellen-Tabelle, das Geruest ist DESIGN |
| `sim/data/bosses.json` | vier neue Kits ohne feste Welle (`charger`, `summoner`, `mender`, `shielder`), dazu die vorhandenen `warden` und `colossus` |
| `sim/data/modes/legend-stages.json`, `raids.json` | **Daten-Geruest** (8 Legend Stages, 11 Raids aus `maps.json`), `playable: false`, noch nicht spielbar; in der Weltkarte als "Coming later" gelistet |

`sim/src/data/worlds.ts` setzt zur Ladezeit aus jeder Welt-Datei die Stages `<welt>-1` .. `<welt>-6` und `<welt>-infinite` zusammen (`expandWorld`); Sim, Client und Meta laden dieselben Dateien. Gegner-HP: `stage.hpBp` = Welt-Faktor x Act-Faktor (Welt 1/2/3 = 1,0 / 1,1 / 1,2; Acts 1,0 / 1,3 / 1,7 / 2,3 / 3,0 / 4,0), wirkt auch auf die Bounty-Basis. Kein Messlauf: Goku SSJ3 allein schafft Act 1 jeder Welt (Test), die HP-Stufung ist ein Rauchtest-Wert.

## Boss je Act (vereinfacht)

Der Kern kennt Phasen, Schilde, Beschwoerungen, Heilung und Sturmlauf (Boss-Kits). AA-Bosskits (`bossAttacks` in `enemies.json`: `frieza_boss:spawn_units`, `pitou_boss:heal`, `juvia_boss:shield` ...) sind nur als Leitbild eingeflossen: Act 1 `charger` (Sturmlauf), 2 `summoner` (Gefolge), 3 `mender` (Heilung, brechbar), 4 `warden`, 5 `shielder` (zwei Schilde), 6 `colossus`. Steinwurf (Beast Titan), Teleport (Itachi) und aehnliche Einzelfaehigkeiten gibt es nicht. Namen (`boss.name`) und Act-Titel sind AA (`enemies.json`), im Match zeigt Banner und Vorschau den AA-Namen.

## Was vereinfacht ist / offen

- **Gegner-Namen**: AA nennt Boss und Act-Titel, nicht das Fussvolk. `roster` (z. B. "Frieza Soldier", "Pure Titan", "Lesser Demon") ist angelehnt, nicht belegt. Die 8 Archetypen (grunt, runner, brute, flyer, splitter, elite, boss) bleiben gleich, nur Name, HP-Stufe und Modifier wechseln.
- Gegner-Modifikatoren: Schild, Regen, gepanzert, schnell und Fliegen (`flyer`) aus dem Kern; `tank`, `fortify`, `cloner`, `explosive`, `egg_spawner`, `stealth` u. a. sind nicht modelliert (`unsupported.md`).
- **Kartengroesse ist Eigenschaft der Welt:** die Zonenmaske (`map.zones.rows`) legt Spalten und Zeilen fest (alle Zeilen gleich lang, Wegpunkte im Raster). Welt 1-3 bleiben 17 x 11 (Replays und Hashes unveraendert), Welt 4-10 sind 22 x 12 bis 24 x 14. Die Sim las das Raster schon aus der Maske; der Client auch: `RenderContext.cols/rows` kommen aus `stage.zones`, `Renderer.fit` waehlt die Kachel so, dass die ganze Karte in den freien Platz passt (24 x 14 gibt ca. 36 px je Kachel auf 1280 x 720, 60 px auf 1920 x 1080, 72 px = Deckel auf 2560 x 1440), Brett-Container und Mausumrechnung (`BoardInput`) folgen. `scripts/lib/mouse.mjs` liest die Spaltenzahl aus dem Renderer statt der festen 17. `scripts/map-preview.ts` zeigt Zonenmaske und bebaubare Flaeche. Wegpunkte achsparallel (Test).
- Weltkarte: zehn Reiter in einer scrollbaren Zeile (Pfeile, Mausrad/Wischen, der offene Reiter wird ins Bild geholt) und eine Kartenvorschau (Zonenmaske in den Farben der Welt) mit Groessenangabe.
- **Modifikatoren der Naeherung:** `fortify`, `egg_spawner`, `tank`, `stealth`, `cloner`, `explosive`, Feuer-/Eis-Affinitaet gibt es nicht; die Welten nehmen `armored`/`shield`/`regen`/`fast` an den belegten Stellen (siehe Tabelle). Fliegende Gegner stehen in der gemeinsamen Wellen-Vorlage ab Welle 8; AA setzt sie in Spirit World erst ab Act 1 Welle 10 (Vorlage nicht je Welt aenderbar).
- 10 von 22 Welten; die uebrigen Eintraege aus `maps.json` stehen noch nicht als Datei da.
- Element-Zyklus der Wellen mit Versatz je Welt (`elementOffset`), wirkt wie bisher ab Hard.

## Neue Welt anlegen

1. `sim/data/worlds/<id>.json` kopieren, `id`, `order`, `name`, `aaId`, `unlock` anpassen.
2. Karte zeichnen: `map.path` (Wegpunkte in Kacheln, achsparallel, im Raster) und `map.zones.rows` (beliebig viele Zeichen x Zeilen, alle Zeilen gleich lang, mindestens 17 x 11 empfohlen, passt bis ca. 24 x 14 in 1280 x 720: `.` Boden, `h` Huegel, `#` blockiert, `p` Pfad). `npx tsx scripts/map-preview.ts <id>` im Ordner `sim/` zeigt das Ergebnis.
3. `theme` (Farben, Deko), `roster` (Gegnernamen), `acts` (Boss, Kit, Wellenzahl, Modifier) ausfuellen.
4. Fertig: `npm test` in `sim/`, `meta/`, `client/` prueft Struktur, Rauchtest und Weltkarte automatisch.
