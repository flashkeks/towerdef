# Runde 16: zehn Karten, Wassertürme, mehr Türme und Helden — Entwurf Hauptsitzung (10.10.2026 nachts)

Max (10.10.2026, vor dem Schlafen): „füge noch mehr Türme hinzu und auch mehr Helden und vor allem mehr Karten … mindestens um die 10 …
der Reihe nach freischalten, die halt auch schwieriger werden … zwei oder drei Eingänge … mit Mauern, dass man nicht so viel Fläche hat …
Wassertürme, die man nur in bestimmten Wasserbereichen setzen kann … falls du noch Zeit hast, die Issues … Editor-Mode.“
Grundlage: Runde 15b — **eine Rundenliste für alle Karten** (Easy 40 / Medium 60 / Hard 80, fest bis R120, danach Formel). Karten sind
damit nur Weg + Look + Stufe. Einheiten wie `tuerme.md`/`gegner.md`. Spielertexte Englisch.

## 1. Karten-Leiter (10 Karten)

Freischaltung **der Reihe nach**: Karte n frei ab Spieler-Level L(n) **oder** Medium-Medaille auf Karte n−1 (wie Runde 15).
Belohnungsfaktor (XP/Embers) nach Stufe: Beginner 1,0/1,0 · Intermediate 1,15/1,2 · Advanced 1,3/1,4 · Expert 1,5/1,6.

| # | ID | Name | Stufe | L(n) | Eingänge | Weg je Ast (ca.) | Look | Besonderheit |
|---|---|---|---|---:|---:|---:|---|---|
| 1 | `meadow` | Lanternfall Meadow | Beginner | 1 | 1 | 1.900 | Sommerwiese, Bach | vorhanden |
| 2 | `hollow` | Harvest Hollow | Beginner | 3 | 1 | 1.750 | Herbst-Felder, Windmühle, Kürbisse, **Teich** | viel Platz, Teich für Wassertürme |
| 3 | `marsh` | Mistwood Marsh | Intermediate | 5 | 1 | 1.500 | Sumpf, Nebel, Stege, Glühwürmchen | **viel Wasser**, wenig Land — Wassertürme lohnen |
| 4 | `frostfen` | Frostfen Crossing | Intermediate | 8 | 2 | 1.350 | Winter, See | vorhanden |
| 5 | `bastion` | Sunken Bastion | Intermediate | 10 | 2 | 1.250 | Burgruine, **Mauern**, Wassergraben | Mauern begrenzen Bauplatz, Graben = Wasser |
| 6 | `quarry` | Ember Quarry | Advanced | 12 | 1 | 1.050 | Lava | vorhanden |
| 7 | `skyreach` | Skyreach Cliffs | Advanced | 14 | 2 | 1.150 | Berg-Serpentinen, Schluchten, Hängebrücken | Schluchten unbebaubar, kleine Plateaus |
| 8 | `dunes` | Ashra Dunes | Advanced | 16 | 3 | 1.000 | Wüste, Oase, Ruinen, Sandsturm | **drei Eingänge**, Oase = kleines Wasser |
| 9 | `harbor` | Gloomharbor | Expert | 18 | 2 | 950 | Hafenstadt bei Nacht, Docks, Schiffe | großes Hafenbecken (Wasser), **Mauern/Häuser**, Land knapp |
| 10 | `spire` | Duskspire Keep | Expert | 20 | 3 | 850 | finstere Festung, Zinnen, Lavagraben, Laternen | **drei Eingänge**, kurze Wege, sehr wenig Platz |

- Schwierigkeit kommt aus Weglänge, Zahl der Eingänge, Bauplatz (Mauern = `blockers`), Sichtlinien. Keine eigenen Runden.
- **Mauern**: neue Blocker-Art `walls` (Polygone, unbebaubar, Look je Karte). Sim behandelt sie wie `blockers`; Longshot u. ä. sehen darüber.
- Kartenwahl: zehn Kacheln brauchen ein Raster/Leiste mit Blättern (2 Reihen à 5 oder Seiten), weiterhin ohne Scrollen bei 1280×720.

## 2. Wassertürme (wie BTD6 Monkey Sub / Buccaneer)

- Neues Turm-Feld `placement: 'land' | 'water'`. Wassertürme nur **vollständig** in `water`-Polygonen platzierbar, Landtürme nie dort
  (wie heute). Platzier-Vorschau zeigt erlaubte Wasserflächen hervorgehoben, wenn ein Wasserturm gewählt ist.
- Jede Karte ab Nr. 2 hat mindestens eine Wasserfläche, groß genug für 2–3 Wassertürme (Frostfen: See; Quarry: Lava zählt **nicht**
  als Wasser → Quarry hat einen kleinen Kühlteich). Meadow: Bach an 1–2 Stellen zu Tümpeln verbreitern.

### Neue Türme (Runde 16)

| ID | Name | Rolle | Preis | Platz | Vorbild | Pfade (A / B / C, je T1–T5) |
|---|---|---|---:|---|---|---|
| `riverkeeper` | Riverkeeper | Wasser, Harpunen | 400 | Wasser | Monkey Sub | A Harpoon Volley → Tidal Lance (Blimp-Schaden) · B Sonar (Camo für Türme im Radius) → Leviathan Call · C Lantern Ship (Kanonen, Breitseite) → Dusk Armada |
| `bellringer` | Bellringer | Unterstützung | 1.000 | Land | Monkey Village | A Swift Chime (+Tempo Radius) → Grand Carillon · B Watch Bell (Camo-Sicht Radius, Rabatt) → Alarm (Fähigkeit: alle Gegner 2 s Stop) · C Toll of Coin (Einkommen) → Golden Belfry |
| `tinker` | Tinker | Bauer/Fallen | 450 | Land | Engineer + Spike Factory | A Sentry (baut Mini-Geschütze) → Clockwork Fort · B Caltrop Layer (Fallen auf den Weg) → Iron Thorn Field · C Overclock (Fähigkeit: Turm 10 s doppelt) → Ultra-Overclock |

Freischaltung über Spieler-Level (in die bestehende Liste einreihen): Riverkeeper L4 (wegen Hollow-Teich), Tinker L11, Bellringer L13.
Werte und Zahlen der Stufen nach dem Muster `tuerme-r13.md` (Agent legt sie fest und hält sie in `tuerme-r16.md` fest), Crosspath/XP/
Wissensbaum wie die anderen Türme (Wissensbaum: je Turm eigener kleiner Ast wie bei den R13/R14-Türmen).

## 3. Helden (neu 2, gesamt 3)

Ein Held pro Match (wie heute Wren). Auswahl vor dem Match auf der Setup-Seite (Held-Kachel) und im Reiter „Towers“ wie Wren.

| ID | Name | Rolle | Preis im Match | Freischaltung | Kern |
|---|---|---|---:|---|---|
| `wren` | Wren, the Lamplighter | Allrounder | 540 | Level 3 | vorhanden |
| `bram` | Bram Ironwright | Panzerknacker/Bauer | 650 | Level 10 **oder** 1.500 Embers | Hammerwürfe knacken Panzer; L3 baut eine Schmiede (+Schaden für Türme im Radius), L10 Fähigkeit „Anvil Drop“ (großer Treffer, betäubt), L20 „Forge of Dawn“ (alle Türme 10 s Panzer brechen) |
| `sela` | Sela Nightglass | Scharfschützin/Seherin | 750 | Level 15 **oder** 2.500 Embers | große Reichweite, sieht Shades/Camo, L5 Camo-Aura, L10 „Starfall“ (Strahl entlang des Wegs), L20 „Eclipse“ (alle Gegner 4 s halbes Tempo, Blimps mit) |

- Embers-Kauf im Store (neue Rubrik „Heroes“). Gekaufte Helden bleiben dauerhaft (Meta-Profil `heroes`).
- Helden-XP im Match wie Wren (Level 1–20). Pixel-Figuren wie Wren (ohne Plattform), Animationen für Fähigkeiten.

## 4. Pakete und Reihenfolge

Basis: `dev` nach Merge von 15b (Runden) und 15e (späte Gegner-Pixel).

- **K1 Karten 2/3/5/7** (`hollow`, `marsh`, `bastion`, `skyreach`): Kartendaten (Wege, `water`, `walls`, `blockers`, `buildArea`) +
  Pixel-Art (so schön wie Meadow/Frostfen, mit Animationen, Vorschaubild) + Meta-Leiter für **alle zehn** Karten (`meta/src/data.ts`,
  Freischalt-Level, Faktoren) + `walls` in der Sim. Matrix je eigener Karte.
- **K2 Karten 8/9/10** (`dunes`, `harbor`, `spire`): nur Kartendaten + Pixel-Art (Meta-Leiter macht K1, IDs fix wie oben). Matrix.
- **T Türme + Helden Sim/Meta**: `placement`, Riverkeeper/Bellringer/Tinker, Bram/Sela, Helden-Kauf mit Embers, Bot/Matrix-Aufstellungen,
  `tuerme-r16.md`.
- **danach TP Pixel + Client**: Turm-/Helden-Figuren (Stufen-Looks wie R13/R14), Platzier-UI für Wasser, Helden-Auswahl, Store-Rubrik,
  Kartenwahl mit zehn Kacheln, Screenshots.
- **danach Issues** (#4 Challenges + Editor zuerst), nur was ohne Rückfrage geht.
