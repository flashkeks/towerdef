# Welten, Acts und Karten (Runde 8 / P3)

Story-Struktur nach `docs/anime-adventures/data/maps.json`: **Welt -> 6 Acts, Boss am Act-Ende**, danach Infinite. Alles ist Daten, eine neue Welt braucht null Zeilen Code.

## Was spielbar ist

| Welt | AA-Vorbild | Karte (17 x 11) | Pfad | Farbwelt | Besonderheit |
|---|---|---|---|---|---|
| 1 `greenie` Planet Greenie | Planet Namak / Greenie ("fairly long path") | Spirale nach innen, Basis in der Mitte | 57 Kacheln | Tuerkis-Gras, gelbgruener Weg | Bosse Zarbo, Goldeo, Zezoom, Jayce/Vurtor, Gunyu, Freezo |
| 2 `walled-city` Walled City | Shiganshinu / Walled City ("complex-looking path") | enge Schlangenlinie, viele Kurven, Gassen mit einer Kachel Abstand | 44 Kacheln | graues Pflaster, Steinmauern als Huegel | Schild-Gegner ab Act 4, Welle 15 (AA belegt); Bosse Jaw bis Colossal Titan |
| 3 `snowy-town` Snowy Town | Snowy Town ("short path, one curve around the center") | Hufeisen um den Dorfkern (Haeuser blockiert) | 31 Kacheln | Schnee, Eisweg | Regen-Gegner ab Act 4, Welle 10 (AA belegt); Bosse Yahobu bis Muzo |

Je Welt: Act 1-3 mit 15 Wellen, Act 4-6 mit 20 Wellen (AA: "mindestens 15", Schild in Act 4 Welle 15). Welle N ist die Boss-Welle (Boss + Elite + Grunts). Dazu **Infinite** (`<welt>-infinite`): 14 feste Wellen, danach erzeugt (Boss alle 10 Wellen, wie AA).

**Freischaltung:** Act n+1 nach Act n (irgendeine Schwierigkeit); Welt 2 nach Act 3 von Welt 1, Welt 3 nach Act 3 von Welt 2 (`unlock` in der Welt-Datei, Zahl frei einstellbar; AA selbst verlangt weitgehend Act 6); Infinite nach Act 3 der Welt. Der Fortschritt liegt im Profil (`stages[stageId][difficulty]`), kein neues Profilfeld, keine Migration. Replays auf gesperrten Stages zahlen nichts (`stage-locked`).

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
- Karten sind **17 x 11 Kacheln** (Raster des Clients); `scripts/map-preview.ts` zeigt Zonenmaske und bebaubare Flaeche. Wegpunkte achsparallel (Test).
- Nur 3 von 22 Welten; die uebrigen Eintraege aus `maps.json` stehen noch nicht als Datei da.
- Element-Zyklus der Wellen mit Versatz je Welt (`elementOffset`), wirkt wie bisher ab Hard.

## Neue Welt anlegen

1. `sim/data/worlds/<id>.json` kopieren, `id`, `order`, `name`, `aaId`, `unlock` anpassen.
2. Karte zeichnen: `map.path` (Wegpunkte in Kacheln, achsparallel) und `map.zones.rows` (17 Zeichen x 11 Zeilen: `.` Boden, `h` Huegel, `#` blockiert, `p` Pfad). `npx tsx scripts/map-preview.ts <id>` im Ordner `sim/` zeigt das Ergebnis.
3. `theme` (Farben, Deko), `roster` (Gegnernamen), `acts` (Boss, Kit, Wellenzahl, Modifier) ausfuellen.
4. Fertig: `npm test` in `sim/`, `meta/`, `client/` prueft Struktur, Rauchtest und Weltkarte automatisch.
