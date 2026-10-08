# Interface-Neubau (Runde 8, P4)

Max, 07.10.2026: „Das soll sich abheben und wirklich gut aussehen, komplex sein, ein wirklich geiles Interface.“ Eigener Look, **nicht** der Kek-Game-Stil.
Stand der Umsetzung und Aufbau des Codes: `client/README.md` (Abschnitt „Interface-Kit“). Dieses Dokument hält die **Gestaltungsentscheidungen** fest.

## Farbwelt „Dusk Gilt“

Nachtindigo-Flächen (`--bg-0` … `--bg-4`), **Warmgold** als Hauptakzent (Titel, primäre Knöpfe, Rahmenlicht), **Aether-Türkis** (Kristalle, Positives, Team),
**Ember-Orange** (Warnung, Geschenk, Shop), **Violett** (Summon). Text warmweiß (`--tx-0`), gedämpft zweistufig. Alles zentral in `client/src/ui/kit/tokens.css`;
keine Hex-Werte in Komponenten. Die alten Variablennamen (`--ink`, `--gold` …) zeigen auf die neuen Tokens, damit noch nicht umgebaute Bildschirme (Einstellungen,
Credits, Ergebnis) die Farbwelt erben.

## Schrift

| Rolle | Schrift | Einsatz |
|---|---|---|
| Display | **Cinzel** (500–900) | Titel, Kachel-Überschriften, Namen, Seltenheits-Schriftzug, Wellen-Anzeige |
| UI | **Manrope** (400–800) | Fließtext, Knöpfe, Chips, Tabellen-Köpfe (Großbuchstaben mit Sperrung) |
| Zahlen | **Rajdhani** (500–700) | Kontostände, Werte, Kosten, DPS: schmal, ziffernstabil |

Gebündelt (woff2, nur latin, zusammen ca. 100 KB) unter `client/src/ui/kit/fonts/`, SIL OFL, Herkunft in `client/assets/ATTRIBUTIONS.md`.

## Seltenheits-Rahmen

Ein Ring mit Verlauf (3 Stufen) und Leuchten je Seltenheit, gebaut als `rarityFrame()`:

| Seltenheit | Ring | Bewegung |
|---|---|---|
| Rare | Blau, 2 px | – |
| Epic | Violett, 2 px | – |
| Legendary | Gold, 2 px, Leuchten | Glanzstreifen läuft über das Bild |
| Mythic | Rot-Magenta-Gold als **Kegelverlauf, 3 px**, starkes Leuchten | Ring rotiert (7 s), Glanzstreifen |
| Secret | Cyan-Violett-Rosé-Gold, dunkler Grund, 3 px | Ring rotiert schnell (3,6 s), Glanz, in der Enthüllung zusätzlich Farbwechsel |
| Exclusive | Smaragd-Weiß, 3 px | Ring rotiert langsam (9 s) |

Technik: Der Ring ist ein übergroßes, **per `transform: rotate` gedrehtes** Pseudo-Element hinter dem Karteninhalt (kein `@property`, kein Repaint). Das hält
Rasterkarten mit vielen Mythic-Einträgen flüssig (in AA sind 381 von 561 Units Mythic). `.live` (Held, Detail, Enthüllung) lässt zusätzlich das Leuchten pulsieren.

## Porträt-Karte und Ersatzkarte

Karte 3:4: Bild (`/aa/units/<id>.webp`, `object-fit: cover`, oben ausgerichtet), Schattenverlauf, Element-Symbol oben links, Platz für Trait-Abzeichen oben rechts,
Name (Display) und Stufe/Sterne unten. **Ohne Bild** (lokal immer, auf der Preview bei 88 von 561): gestaltete Karte aus Element-Farbe, Heiligenschein, Silhouette
(Frisur aus der ID, leuchtende Augen), Initialen und denselben Rahmen. Das Bild blendet über die Ersatzkarte ein; schlägt das Laden fehl, bleibt sie stehen.

## Bezugspunkte (Moodboard)

| Vorbild | Was wir nehmen |
|---|---|
| **Anime Adventures** | Gliederung: Lobby-Hub, Summon-Banner mit Raten, Einheiten-Raster, Seltenheitsfarben als Orientierung; Platzierungs-Chips (ground/hill/hybrid) |
| **Genshin Impact** | Banner-Bühne: Featured-Figur groß vor magischem Hintergrund, Siegel/Kreis, Lichtsäule beim Ziehen, Farbe der Säule verrät die beste Seltenheit vor dem Reveal |
| **Honkai: Star Rail** | Glas-Panels mit feinen Kantenlinien, gedämpfte Flächen, schlanke Kapitälchen-Beschriftung, Kontostände als Pillen oben rechts |
| **Arknights** | Technisch-nüchterne Zahlentypo (schmal), Eckmarken an Panels, Wellen-/Boss-Segmentleiste |
| **Blue Archive** | Große, saubere Porträtkarten mit Element-Abzeichen, helle Akzente auf dunklem Grund, klare Hierarchie der Knöpfe |
| **Fire Emblem Heroes / Gacha-Reveal allgemein** | Rampenlicht nur für Seltenes, Rest schnell in der Übersicht; Überspringen immer möglich |
| **Diablo/Path of Exile** | Seltenheit als Rahmenfarbe mit Leuchten statt Beschriftung |
| **Wappen-/Siegel-Ornamentik (Fantasy-UI allgemein)** | Runenkreis (Siegel), Wappen im Titel, goldene Haarlinien |

## Bildschirme

- **Lobby:** Dämmerungs-Himmel mit Sonnenscheibe, Bergrücken in drei Schichten (langsame Parallaxe), aufsteigende Funken (Canvas), Sterne. Vorne der **Anführer des Teams**
  als große Karte (seltenste Unit des Teams, Gleichstand: erste), zwei Mitstreiter im Fächer dahinter, Siegel und Strahlen, Namensschild. Links Menü-**Kacheln** (Play groß,
  Summon/Units halbbreit, Team/Shop/Settings kompakt) mit Icon, Leuchten in Kachelfarbe und Hover-Hub. Oben Wappen + Titel und Kontostände, unten Team-Leiste.
- **Summon:** Bühne mit Banner-Namen, Featured-Karten (Featured zuerst, dann die höchste Stufe des Pools), Siegel; Pity-Balken und Zug-Knöpfe direkt darunter;
  rechts Raten-Tabelle (immer sichtbar), Pool je Stufe als Chips, Regeln, Erwartungswerte, Verlauf.
- **Zieh-Animation:** Siegel + Lichtsäule + Kern in der Farbe der besten Seltenheit (Vorspann 0,9–2,1 s), dann **Rampenlicht** je Karte ab Legendary (Blitz, Funkenausbruch,
  Karte dreht herein, Schriftzug der Seltenheit, Name, NEW); Mythic/Secret zusätzlich Bildschirm-Wackeln und mehr Funken. Alles darunter klappt schnell in die Übersicht (5 × 2).
  Ein Klick, Esc oder der Knopf springt zur Übersicht. Plan ohne DOM: `ui/reveal-model.ts`.
- **Sammlung:** Suche, Sortierung (Seltenheit, Element, Platzierung, DPS, Level, Name), Filter (Seltenheit, Element, Platzierung, Rolle, Besitz), **virtuelles Raster**
  (nur sichtbare Zeilen im DOM). Detail: großes Porträt, Elemente, Werte-Tabelle je Upgrade-Stufe (Schaden, Tempo, Reichweite, DPS, Kosten), **Angriffsform-Vorschau**
  (SVG: Kreis, Kegel, Linie, ganze Reichweite, Einzelziel), Platz für Trait und Evolution (gesperrt, „Coming soon“, bis das Backend von P2 da ist), Level-Up.
- **Match:** Kopfzeile mit Herz-/Münz-Symbol, **Wellen-Leiste** (ein Segment je Welle, Boss-Wellen rot, Elite gold, aktuelle pulsiert), Geschwindigkeits-Schalter;
  Unit-Leiste aus Porträt-Karten (Taste, Kosten, Platzierungs-Chip, Symbole); Unit-Panel mit Porträt, Stufen-Leiste und Werten **alt → neu**; Vorschau-, Karten- und
  Boss-Panels im gleichen Glas-Stil.

## Nach dem Merge mit P2/P3

- **Porträts genau:** `view/portrait.ts` kennt das Bild-Manifest des Importers (`client/public/aa/manifest.json`, nur diese IDs kommen für ein Bild in Frage) und liest zur Laufzeit `/aa/index.json`, wenn die Preview sie ausliefert (Liste der tatsächlich vorhandenen Bilder). Ohne Index (lokal) gilt der Ladeversuch je ID, Fehlschläge fallen auf die Ersatzkarte zurück.
- **Weltkarte (P3-Funktion):** Welt-Banner als Reiter (Farbe aus der Welt-Palette, Fortschrittsleiste, Schloss mit Grund), Acts als Medaillons (Nummer, geschafft = Haken, gesperrt = Schloss, „NEXT“-Marke), Infinite als breites Banner, „Coming later“ als gestrichelte Leiste. Danach die Stufenwahl je Act im selben Stil.
- **Trait und Evolution (P2-Backend):** Detailseite zeigt Trait (Name, Wirkung) mit Reroll-Kosten, Evolution mit Zielen (Zufalls-Evolution mit Prozent), Zutaten (grün/rot), Kosten, Sperrgrund. Reroll: kurzes Würfeln (Badge flackert und dreht), danach Landeblitz; Evolution: Bestätigung, Aufladen der Karte, Blitz, Auswahl springt auf die neue Form. Fehlercodes als Toast.

## Was bewusst nicht gemacht wurde

- Keine Porträt-Bilder erzeugt oder simuliert: der Fallback ist das Gestaltungsmittel, solange die Bilder nicht ausgeliefert sind.
- Einstellungen, Credits, Ergebnis, Pause und Hilfe erben nur die Farbwelt (Tokens, Panels, Knöpfe), sind aber nicht neu gebaut.
