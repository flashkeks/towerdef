# Zeichenliste für die Menschen (P8)

Stand: 2026-10-06. Alle Größen und Frames nach `docs/design/art-styleguide.md` (Tile 32×32, Palette §4). Figurenbeschreibungen aus `docs/design/gdd.md` §6. Format: PNG mit Alpha, Raster-Größe wie angegeben, Nearest-Neighbour, Fußpunkt unten mittig. Bei jeder Datei: ≤ 16 Farben aus der Master-Palette (Portrait ≤ 24).

## Gemeinsame Vorgaben je Unit-Sprite

| Aktion | Frames | Anmerkung |
|---|---|---|
| idle | 4 | Loop, 5 fps |
| attack | 5 | Frame 3 = Treffer-/Schuss-Frame |
| ability | 8 | Frame 4–5 = Auslösung |
| (hit, level-up, place) | 0 | als Shader/Overlay-Effekt, nicht zeichnen |

Pose-Hinweis: Figur schaut nach vorn/leicht seitlich; Zielrichtung wird gespiegelt. Daher **keine Asymmetrie, die beim Spiegeln stört** (Text, Wappen mittig oder bewusst spiegelsymmetrisch). Je Figur ein Spritesheet 8 Spalten × 3 Zeilen (Zellen 32×32).

## Die 8 Figuren

| ID | Figur | Zelle | Frames gesamt | Posen / Besonderheiten | Portrait (128×160) |
|---|---|---|---|---|---|
| `striker` | Tamsin Rook | 32×32 | 17 | idle: Schal weht, Wippen; attack: zwei Messerhiebe, Schnittspur rot (Effekt separat); ability: Doppelhieb nach drittem Treffer | frech grinsend, orange Mantel, langer Schal, Messer im Anschnitt; Hintergrund warm |
| `gunner` | Veli Okrane | 32×32 + Sockel | 17 | idle: Büchse im Anschlag, Mütze; attack: Rückstoß, Mündungsblitz (Effekt separat); ability: Crit-Schuss mit Fadenkreuz-Blitz-Pose | ruhig, Wollmütze, Schutzbrille auf Stirn, Fernrohr-Büchse |
| `blaster` | Zindra Pyle | 32×32 | 17 | idle: Funkenkugeln im Rucksack glimmen; attack: Wurf; ability: größere Kugel/Doppelwurf | lachend, Schutzbrille, angekohlte Handschuhe, Rußfleck |
| `banner` | Oriel Fenn | 32×32 (Fahne darf 2 Tile hoch ragen: Zelle 32×48) | 17 | idle: Fahne flattert (4 Frames); attack: Fahnenschwung; ability: Ruf mit hochgehobener Fahne | aufrecht, jung, Gildenwappen auf der Fahne (eigenes Motiv, 6×6) |
| `farm` | Pomm Ellesby | **64×64** (2×2) | idle 4, collect 4, 3 Ausbau-Stufen je 4 idle = 12; kein attack/ability | Stufe 1 Stand, Stufe 2 Tisch+Laterne, Stufe 3 Anbau; Dampf der Teekanne; Münzbeutel | warm lächelnd, Schürze, Münzbeutel am Gürtel |
| `lancer` | Dace Valorn | 32×32 | 17 | idle: reglos, Mantel; attack: Stoß; ability: Lanze stößt in den Boden (Lichtlinie als Effekt) | schwerer Helm, dunkelblauer Mantel, wortlos |
| `frost` | Maren Vael | 32×32 | 17 | idle: Rauhreif glitzert; attack: Stab-Schwung; ability: Stab hoch, Frostkarte (Effekt separat) | Eisblau-Haare, blaues Cape, Kompass-Stab |
| `titan` | Koros Mahn | 32×32 (füllt Zelle voll) | 17 + 4 (Aufstehen-Szene: `wake`, 4 Frames, einmalig) | idle: sehr langsame Atmung (Moos wippt); attack: schwerer Hieb; ability: Aufladen mit leuchtenden Rissen (Türkis), dann Schlag | uralt, moosige Schultern, Risse mit Türkis-Glühen, tiefer Blick |

Zusätzlich je Unit: **Icon 48×48** (Shop, Team-Slot). Je Figur 3–5 Kurzsprüche als Text sind Aufgabe des Designs, nicht der Grafik.

## Gegner (7 Archetypen)

| ID | Zelle | Frames | Besonderheit |
|---|---|---|---|
| `grunt` | 32×32 | walk_side 4, walk_down 4, death 5, spawn 3 = 16 | Blob-Silhouette, Leitfarbe `#6a3fa0` |
| `runner` | 32×32 | walk_side 6, walk_down 6, death 5, spawn 3 = 20 | schmal, vorgeneigt, gelbe Augen |
| `brute` | 32×32 | walk_side 4, walk_down 4, death 5, spawn 3 = 16 | quadratisch, Rüstungsplatten |
| `flyer` | 32×32 + Boden-Schatten 24×8 | fly_side 4, fly_down 4, death 5, spawn 3 = 16 | Flügel, Eisblau-Spitzen |
| `splitter` | 32×32 | walk_side 4, walk_down 4, split 5 (Aufbrechen), death 5, spawn 3 = 21 | Naht/Riss mit Glut-Linie |
| `splitter_child` | 24×24 Inhalt in 32×32-Zelle | walk_side 4, walk_down 4, death 4, spawn 2 = 14 | halbe Größe, ohne Riss |
| `elite` | 48×48 | walk_side 4, walk_down 4, walk_up 4, death 7, spawn 3 = 22 | Brute-Körper mit Krone/Hörnern, Gold-Augen |

Gegner-Icon für Wellenvorschau: 24×24 je Archetyp (**Silhouette in Leitfarbe**), 7 Stück. Modifier-Icons (Schild-Pips, Herz, Rüstung): 8×8, 3 Stück.

## Bosse (2 im MVP, Namen fehlen im GDD)

| ID | Zelle | Frames | Posen | Portrait / Auftritts-Bild |
|---|---|---|---|---|
| `boss_w10` | 64×64 | walk_side 6, walk_down 6, walk_up 6, **telegraph** je Fähigkeit 5 (Zahl der Fähigkeiten: Design legt fest, hier 2 angenommen = 10), **vulnerable** 4 (Loop), phase_change 8, death 10, spawn 6 = **56** | Schwachstellen-Kern als eigenes Element (Brust/Riss, Türkis `#3fd8c0` hell/dunkel animierbar in `vulnerable`); Schild-Segmente und Stun-Sterne sind Effekte | Boss-Auftritts-Portrait 192×128 (Querformat für das Banner), dazu schwarze Silhouette gleicher Größe |
| `boss_w20` | 64×64 | wie `boss_w10`, zusätzlich Phase 2 (eigene walk-Zeilen oder Variante mit Zusatzteilen): +12 = **68** | zitiert die Mechaniken der Stage (Schild, Stun-Fenster, Telegraph-Linie, Summon) | wie oben |

Boss-Telegraph-Effekte (einmal zeichnen, für beide): Kreis-Decal, Linien-Decal, Kegel-Decal, Füllring, Schraffur-Textur (alle skalierbar, Rot `#d8344a`); Schwachstellen-Ring, Kern-Glühen (Türkis); Schild-Segmentring (Eisblau); Stun-Sterne (Gold). Details: `art-styleguide.md` §7.

## Umgebung (soweit nicht aus Packs)

| Teil | Größe | Frames |
|---|---|---|
| Spawn „Nebelriss“ | 64×64 (2×2) | 6 Loop (Wirbel) |
| Basis „Gildentor/Linde“ | 64×96 | idle 4, Leak-Hit 3 |
| Hill-Sockel (Autotile, 4 Seiten + Ecken) | 32×32 je | 1 |
| Pfad-Autotile (falls Packs nicht passen) | 32×32 | 16er-Maske |

## Gesamtaufwand (grobe Zahl)

8 Units à ca. 17 Frames (+ farm 20) ≈ 150 Frames, 7 Gegner ≈ 125 Frames, 2 Bosse ≈ 124 Frames, dazu 8 Portraits, 8 Icons, 2 Boss-Bilder, rund 20 Effekt-Animationen und die Umgebungsteile. Reihenfolge empfohlen: erst **Tamsin (striker)** komplett (idle, attack, ability, Portrait) als Stiltest und Palette-Prüfung, dann Gegner-Silhouetten (Schwarz-Test), dann Rest.
