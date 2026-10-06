# Art-Styleguide: Pixel-Anime (Entwurf)

Stand: 2026-10-06 (P8, Runde 4). Grundlage: `docs/design/ENTSCHEIDUNGEN.md` (Pixel-Anime, nur Assets mit sauberer Lizenz, Desktop-only, Englisch in der UI), `docs/design/gdd.md` §6 (8 Figuren), §7 (Terrassenweg), §9 (Juice). Zahlen sind Vorschläge der Autorin/des Autors dieses Pakets; abnehmen und ändern dürfen die Menschen. Herkunft der Assets: `docs/design/asset-sources.md`, Zeichenliste: `docs/design/zeichenliste.md`.

## 1. Grundsatz

- **Zwei Bildebenen.** Spielfeld = kleine Pixel-Sprites mit festem Raster. Menü, Gacha, Team-Auswahl, Boss-Auftritt = größere **Portraits**, ebenfalls Pixel-Art (nicht glatt gemalt), damit der Stil durchgehend wirkt. „Anime“ entsteht über die Portraits: große Augen, klare Haarsilhouette, kräftige Farbflächen, 1-Pixel-Highlight in den Augen.
- **Warm statt düster** (Welt „Grenzgilde im Nebelriss“): Gilde und Basis in warmen Tönen (Orange, Gold, Holz), Schattenwesen und Nebel in kühlem Violett/Blau. Der Nebel ist Bedrohung, nicht Horror.
- **Lesbarkeit vor Detail.** Reihenfolge der Information (GDD §9): erst Form/Farbe, dann Ton, dann Zahl.
- **Keine Anlehnung an bestehende Franchises**: eigene Silhouetten und Farbwelten, keine erkennbaren Frisuren/Outfits aus bekannten Serien (GDD §10, Risiko e2).
- **Desktop-only.** Alle Größen sind für Maus und ein Fenster ab 1280×720 gedacht. Kein Touch-Layout, keine Mindest-Trefferfläche für Finger. Mobile wird per Hinweis-Bildschirm gesperrt (ENTSCHEIDUNGEN).

## 2. Rastergrößen (begründete Wahl)

| Element | Größe (Pixel, 1:1 Quelle) | Begründung |
|---|---|---|
| **Tile** | **32×32** | Die Sim rechnet in ganzen Tiles (1 Unit = 1 Tile, Farm 2×2). 32 px lässt genug Platz für Reichweiten-Ringe, Pips und Statusicons. 16-px-Packs (viele CC0-Tilesets) werden **2× ganzzahlig** hochskaliert und passen dadurch ohne Neuzeichnen. |
| **Unit-Sprite** | **32×32** Zelle (Figur ca. 24–28 px hoch, Fußpunkt unten mittig) | Bei 48×48 wäre eine Zeichnung je Frame ca. 2,25× Arbeit; bei 16×16 trägt das Gesicht keinen Anime-Ausdruck. 32 px reicht für Schal, Mantel, Schutzbrille, Fahne als lesbares Merkmal. |
| **Farm (2×2)** | 64×64 | Teehaus mit Ausbau-Stufen, deckt 2×2 Tiles. |
| **Gegner Standard** (grunt, runner, brute, flyer, splitter, Splitter-Kind) | 32×32 (Splitter-Kind 24×24 Inhalt) | Passt auf ein Tile, bis 60–80 gleichzeitig (`rec §7`). |
| **Elite** | 48×48 | Größer als alle Standardgegner, deutlich lesbar als Mini-Boss. |
| **Boss** | 64×64 (2×2 Tiles) | Größte Sprite im Spiel; passt zum Boss-Banner. |
| **Projektile / Effekte** | 8×8 bis 64×64, je nach Wirkung | Kreis-AoE und Kegel werden als Vektor/Shader-Overlay gezeichnet, nicht als Sprite pro Größe (Skalierbarkeit mit Sim-Radius). |
| **Portrait** | **128×160** (4:5), Anzeige 2× = 256×320, Detailansicht 3× | Platz für Gesicht, Haare, Schultern, Waffe/Attribut. Pixel-Art mit eigener Palette-Erweiterung (§4). |
| **Icon (Shop, Team-Slot, Wellenvorschau)** | 48×48 (Unit) bzw. 24×24 (Gegner-Archetyp) | Ausschnitt/Neuzeichnung des Portraits; Gegner-Icons sind Silhouetten (§6). |
| **UI-Rahmen** | 9-Slice, Ecke 8×8 | Skalierbar auf alle Panelgrößen. |

**Skalierung.** Das Spielfeld wird nur **ganzzahlig** skaliert (2×, 3×), Nearest-Neighbour, kein Glätten (Pixi: `scaleMode = 'nearest'`, `roundPixels = true`). Rasterform der Map (z. B. 18×11 Tiles = 576×352 px) × 3 = 1728×1056; bei kleineren Fenstern 2×. Übrig bleibende Fläche gehört dem UI-Rand. Subpixel-Bewegung von Gegnern ist erlaubt, gerendert wird auf ganze Pixel gerundet (kein Flimmern).

**Atlas.** Je Figur ein Spritesheet (Zeilen = Aktionen, Spalten = Frames), 1 px Padding, Texture-Atlas fürs Pixi-Batching. Dateiname: `unit_<id>.png`, `enemy_<id>.png`, `portrait_<id>.png`.

## 3. Animation

Bildrate des Spiels 60 fps, Animationen laufen mit **eigener Takt-Rate** (fps pro Aktion, unabhängig von 1×/2×/3×-Spielgeschwindigkeit skaliert die Abspielgeschwindigkeit mit).

### Units (Blickrichtung: nach vorn/3/4-Ansicht, Zielrichtung nur per Spiegeln links/rechts)

| Aktion | Frames | fps | Hinweis |
|---|---|---|---|
| idle | 4 | 5, Loop | ruhiges Atmen/Wippen, Haare/Schal 1 px; farm: Dampf der Teekanne |
| attack | 5 (Anlauf 2, **Treffer-Frame 1**, Nachschwung 2) | 12 | Treffer-Frame ist der Zeitpunkt, an dem die Sim den Schaden meldet; Projektil startet dort. |
| ability | 8 (Anlauf 3, Auslösung 2, Abklingen 3) | 10 | je Unit mit Auslösepose (frost: Stab hoch, titan: Risse leuchten); farm hat keine Fähigkeit, nur „collect“ (4 Frames). |
| hit | **kein eigener Frame**: 80 ms weißer Flash per Shader/Tint (Units werden selten getroffen) | – | Spart Arbeit, Treffer-Feedback ist Pflicht für Gegner, nicht für Units. |
| level-up | Overlay-Effekt (Ring, 6 Frames), kein Unit-Frame | 12 | ein Effekt für alle |
| place | Overlay-Effekt „Plopp“ (4 Frames) | 15 | ein Effekt für alle |

Upgrade-Stufen: sichtbar über **Stufenpips** und ein kleines Zusatzteil je Stufe (z. B. Laterne bei farm). Eigene Frames je Stufe nur für farm (3 Ausbau-Stufen); sonst dieselben Frames, andere Akzentfarbe am Rahmen.

### Gegner (Pfad läuft in vier Richtungen; gezeichnet werden `down` und `side`, `up` nur Boss/Elite)

| Aktion | Frames | fps | Hinweis |
|---|---|---|---|
| walk_side (links = gespiegelt) | 4, runner 6, flyer 4 (Flügel) | 8, runner 12 | Fußpunkt/Hüfte immer auf demselben Pixel (kein Springen) |
| walk_down | 4 | 8 | Gegner kommen von oben aus Sicht des Spielers häufig nach unten |
| walk_up | 4, nur Elite und Boss; Standardgegner nutzen in Auf-Richtung `walk_side` (spart eine Zeile je Gegner) | 8 | |
| hit | Flash 2–3 Frames (weiß, per Shader), **kein** Zeichenaufwand | – | GDD §9: „weißer Flash 2–3 Frames“ |
| death | 5 (Puff/Zerfall in Schattenstaub, violetter Splitter) | 12 | einheitlicher Zerfall für alle Schattenwesen; Boss 10 Frames |
| spawn | 3 (aus Nebel auftauchen) | 10 | Splitter-Kinder: gleiche Animation, 2 Frames |

Bosse zusätzlich: `telegraph` (4–6 Frames Anlauf-Pose je Fähigkeit), `vulnerable` (Loop 4 Frames, Schwachstelle offen), `phase_change` (8 Frames), `death` (10 Frames).

## 4. Palette

**Prinzip:** eine gemeinsame **Master-Palette mit 32 Farben** für Spielfeld-Sprites, Tiles, Effekte und UI. Jede einzelne Spritedatei nutzt höchstens **16** dieser Farben (inklusive Outline); Portraits dürfen **24** nutzen (Hauttöne und Haar brauchen mehr Stufen). Keine Verläufe, kein Antialiasing zum Hintergrund hin, keine Transparenz-Halbtöne außer in Effekten (Schatten, Glühen).

Outline: **farbig, nicht Schwarz**. Sprites bekommen eine 1-px-Außenlinie in der dunkelsten Farbe ihrer Rampe (`#2a1e3a` für kühle, `#3b2418` für warme Figuren). Gegner zusätzlich ein 1-px-Aufhellen am oberen Rand (Rimlight) in Violett, damit sie sich von Tiles lösen.

### Master-Palette (Vorschlag, 32 Werte)

| # | Rolle | Hex |
|---|---|---|
| 01 | Tinte (Outline kühl) | `#2a1e3a` |
| 02 | Tinte warm | `#3b2418` |
| 03 | Nachtblau (UI-Hintergrund) | `#1b2036` |
| 04 | Schiefer | `#3a3f5c` |
| 05 | Stein dunkel | `#59607a` |
| 06 | Stein mittel | `#8a90a6` |
| 07 | Stein hell | `#c3c7d6` |
| 08 | Nebel-Weiß | `#f1f2f7` |
| 09 | Erde dunkel | `#5a3a2a` |
| 10 | Erde mittel | `#8a5a3a` |
| 11 | Sand | `#d0a574` |
| 12 | Gras dunkel | `#2f5a3a` |
| 13 | Gras mittel | `#4e8a45` |
| 14 | Gras hell | `#8ab85a` |
| 15 | Haut dunkel | `#a86a4a` |
| 16 | Haut mittel | `#d99a72` |
| 17 | Haut hell | `#f2c8a2` |
| 18 | Gildenorange dunkel | `#b8481f` |
| 19 | Gildenorange | `#f07a2a` |
| 20 | Gold | `#f5c542` |
| 21 | Rot (Schaden, Leak, Telegraph) | `#d8344a` |
| 22 | Rosa (Akzent, Blush) | `#f08aa0` |
| 23 | Blau dunkel | `#2c4a8a` |
| 24 | Blau (Frost, Wasser) | `#4a86d8` |
| 25 | Eisblau | `#9ad8f0` |
| 26 | Türkis (Schwachstelle, Heilung, „offen“) | `#3fd8c0` |
| 27 | Schatten dunkel | `#3a2260` |
| 28 | Schatten (Nebelwesen) | `#6a3fa0` |
| 29 | Schatten hell | `#a67ae0` |
| 30 | Glut | `#ff9a3c` |
| 31 | Giftgrün/Magie-Grün | `#8ae04a` |
| 32 | Pergament (UI-Text-Hintergrund) | `#f3e3c0` |

Die Werte sind ein Startpunkt und werden beim ersten gezeichneten Figuren-Set gegen die gewählten CC0-Tiles geprüft (§9). Fremde Packs werden **auf diese Palette umgefärbt** (Palette-Swap per Skript), damit Tiles, Gegner und Eigenzeichnung zusammenpassen; das ist bei CC0 und bei Kauflizenz erlaubt, bei CC-BY mit Nennung ebenfalls (Bearbeitungshinweis in `client/assets/ATTRIBUTIONS.md`).

### Farbzuordnung

| Zweck | Farben |
|---|---|
| Gilde/Spielerseite (Units, Basis, UI-Akzent) | Orange 18/19, Gold 20, Haut 15–17, Blau 23/24 |
| Schattenwesen (alle Gegner-Grundtöne) | Schatten 27–29, Rimlight 29 |
| Gefahr/Telegraph | Rot 21 (nie für etwas Harmloses benutzen) |
| Schwachstelle/„Jetzt zuschlagen“ | Türkis 26 (nie für Gegner-Körper) |
| Schaden-Typen | Bleed rot 21, Burn Glut 30, Slow/Frost Eisblau 25, Schild Stein hell 07 |
| Geld | Gold 20 |

**Ein Farbwert hat eine Bedeutung.** Rot ist Gefahr, Türkis ist Chance, Gold ist Geld. Keine Figur trägt Rot/Türkis flächig als Kostüm in dieser Aussage-Funktion; Tamsin (Orange) und Zindra (Glut) bleiben deshalb bewusst bei Orange/Glut statt Rot. Farbenblindheit: jede Aussage hat **zweite Kodierung** über Form (Telegraph = gestreifte Fläche mit Ring, Schwachstelle = pulsierender Kern + Icon), siehe §7.

## 5. Figuren-Merkmale (Wiedererkennung im Spielfeld)

Je Unit ein Leitmerkmal, das bei 32 px sichtbar bleibt (Details für die Zeichnenden: `zeichenliste.md`):

| Unit | Leitmerkmal (Silhouette/Farbe) |
|---|---|
| striker (Tamsin) | langer Schal (flattert), orange Kurzmantel, zwei Messer |
| gunner (Veli) | Wollmütze, lange Büchse (schräg über die Zelle), Position erhöht (Hill-Sockel) |
| blaster (Zindra) | Rucksack mit Funkenkugeln, Schutzbrille, Glut-Akzent |
| banner (Oriel) | hohe Fahne über die Figur hinaus, Wappen als 6×6-Motiv |
| farm (Pomm) | Teehaus 2×2, Schürze, Laterne; Münzbeutel-Icon |
| lancer (Dace) | dunkelblauer langer Mantel, Helm, Lanze (senkrecht lang) |
| frost (Maren) | blaues Cape, Kompass-Stab, Eisblau-Haare |
| titan (Koros) | breit, grau/Moosgrün, größte Unit-Silhouette (bis 32×32 voll ausgefüllt), Risse mit Türkis-Glühen bei Ladung |

Regel: keine zwei Units teilen sich Mantelfarbe **und** Waffenform. Haare und Hauptfarbe unterscheiden sich in Farbton, nicht nur in Helligkeit.

## 6. Lesbarkeit der Gegner-Archetypen auf einen Blick

Archetypen aus `sim/data/enemies.json`: grunt, runner, brute, flyer, splitter (+ splitter_child), elite, boss. Jeder Archetyp bekommt **eine eigene Silhouette, die auch als einfarbiger Schatten erkennbar ist** (Test: alle Sprites schwarz füllen, Reihe nebeneinander legen, jeder muss in 1 s zuzuordnen sein) und **eine Leitfarbe** innerhalb der Schatten-Rampe.

| Archetyp | Silhouette | Leitfarbe | Gang | Zusatzsignal |
|---|---|---|---|---|
| grunt | rundlich, kleiner Körper, zwei kurze Beine („Blob mit Füßen“) | Schatten 28 | gleichmäßig wippend | – |
| runner | schmal, nach vorn geneigt, lange Beine, Schweif | Schatten hell 29 + Gelb-Augen | schnell, flach | Staubwölkchen hinter den Füßen |
| brute | breit, eckig, fast quadratisch, schwere Schultern/Rüstungsplatten | Schatten dunkel 27 + Stein 05 Platten | langsam, stampfend, Kamera-Wackeln 0 (nur Bodenstaub) | **Rüstungssymbol** (Schild-Icon) über den Lebensbalken (Armor) |
| flyer | Flügel-Silhouette (breit, flach), schwebt, **eigener Boden-Schatten** | Schatten 28 + Eisblau-Flügelspitzen | wellenförmige Flughöhe (±2 px) | Schatten am Boden, Flug-Icon in der Vorschau |
| splitter | zweigeteilter Körper mit sichtbarer Naht/Riss in der Mitte | Schatten 28 + Glut-Riss 30 | wackelnd | Kinder: halbe Größe, gleiche Naht, ohne Riss |
| elite | 48 px, Brute-Körper plus **Krone/Hörner** und goldene Augen | Schatten dunkel + Gold-Akzent 20 | langsam | Warn-Banner „Mini-Boss“; goldener Ring am Boden |
| boss | 64 px, eigene Figur pro Boss, über Tile-Höhe hinausragend | Individuell, immer mit **Schwachstellen-Kern** (Türkis, §7) | sehr langsam | Boss-Balken oben; Boden-Schatten doppelt groß |

**Modifier** (Schild, Regen, Armored): nie als neue Sprite. Immer als **Overlay**: Schild = Pips über dem Balken (Stein hell), Regen = kleines Herz-Icon (Rosa 22), Armored = Schild-Icon (Stein 06) am Balken. Lebensbalken: 16×3 px, Hintergrund Tinte, Füllung Grün 13 → Rot 21 bei unter 30 %; Boss-Balken oben am Bildschirm, nicht über dem Sprite.

**Kontrast zum Boden.** Gegner-Töne (Violett/Blau-Schatten) kommen in den Tilesets **nicht** vor. Der Weg selbst ist Sand/Erde (11, 10, 09), Gras und Stein für Bauflächen. Gegner dürfen nie Grün oder Sand als Hauptfarbe tragen.

## 7. Boss-Telegraphs und Schwachstellen-Fenster als Effekt

Bosse sind Rätsel (GDD K5): Der Spieler muss **sehen**, was gleich passiert und wann er zuschlagen darf. Alle Boss-Effekte folgen demselben Schema, damit das Auge es lernt.

**Telegraph (Gefahr, kommt gleich):**
1. **Boden-Decal** in Rot 21 (40 % Deckkraft) mit **diagonaler Schraffur** (Formcodierung für Farbenblinde) auf der Fläche, die getroffen wird (Kreis/Linie/Kegel genau in Sim-Größe).
2. **Füllring/Füllbalken**, der in der Telegraph-Zeit (0,8–2,0 s) von innen nach außen wächst; bei vollem Ring tritt der Effekt ein.
3. Boss-Sprite spielt `telegraph`-Pose (Anlauf-Frames); Name der Fähigkeit als Text über dem Boss (1,5 s, Pixel-Font, Pergament-Hintergrund).
4. Ton: tiefer Aufbau-Ton (siehe Sounds).
5. Bei Auslösung: weißer Vollbild-Flash 2 Frames (abschaltbar bei „Reduzierte Effekte“), Decal verschwindet.

**Schwachstellen-Fenster (Chance, jetzt zuschlagen):**
1. **Kern-Leuchten**: eine definierte Stelle am Boss-Sprite (z. B. Brust, Risse) leuchtet in **Türkis 26** und pulsiert mit 4 Frames in 6 fps.
2. **Ring um den Boss** in Türkis, der als Countdown schrumpft (Restdauer des Fensters).
3. **Lebensbalken** des Bosses bekommt einen türkisen Rahmen; Schadenszahlen sind während des Fensters größer und gold (Multiplikator sichtbar).
4. Wird das Fenster ungenutzt verpasst: Ring erlischt in Grau, Boss schüttelt sich (2 Frames).
5. Ton: heller, klarer Zweiklang (Fenster auf), Tick pro Sekunde in den letzten 3 s.

**Schildphase:** Glas-Ring (Eisblau 25, 1-px-Linie, 8 Segmente) um den Boss; jedes Segment bricht einzeln (Segmentzahl = Schild-Stacks bis 8, darüber Zahl). **Stun-Fenster:** Sterne kreisen über dem Boss (Gold 20), Dauer als Ring-Countdown; Sperrfrist nach dem Stun als grauer Mini-Ring (CC-Lockout, `rec §10`).

**Phasenwechsel:** Boss-Sprite `phase_change`, Bildschirm dimmt 1 s, Balken bekommt Strichmarke. Boss-Auftritt: Dimmen, Silhouette mit Namen, tiefer Ton (GDD §9).

**Budget.** Telegraph-/Fenster-Effekte sind **Muss** (GDD §9) und werden nicht per „Reduzierte Effekte“ entfernt, sondern nur in der Intensität (kein Flash, kein Screenshake) und mit gleicher Formcodierung.

## 8. UI-Grundregeln

- **Desktop, Maus, Tastatur.** Hover-Zustände sind Pflicht (Tooltip nach 0,3 s). Kein Touch-Layout, kein Mindestmaß für Finger. Mobile = Sperrseite (ENTSCHEIDUNGEN).
- **Rahmen** im Pixel-Stil als 9-Slice: Pergament-Panel (Farbe 32) mit Holzrahmen (09/10) für Menüs; Nachtblau (03) mit Gold-Linie (20) für Hud-Leisten. Eckenradius 2 px sichtbar, keine weichen Schatten (harte 1-px-Schatten in Tinte).
- **Schrift:** Pixel-Font, ganzzahlig skaliert (z. B. 8×8-Raster-Fonts mit sauberer Freigabe; **Lizenz noch prüfen**, siehe `asset-sources.md` §Schrift). Mindest-Anzeigehöhe 16 px (nach Skalierung), Zahlen nie kleiner. Englisch (ENTSCHEIDUNGEN). Kontrast Text/Hintergrund mindestens 4,5:1: dunkle Schrift (03) auf Pergament (32), helle Schrift (08) auf Nachtblau (03).
- **Zahlen:** unter 100 000 voll ausgeschrieben, dann Abkürzung (GDD Säulen). Schadenszahl klein grau, Crit größer gelb (GDD §9).
- **Ein Farbwert = eine Bedeutung** (§4): Rot Gefahr/Leak, Türkis Chance, Gold Geld, Eisblau Kontrolle/Frost. Zweite Kodierung immer über Form/Icon.
- **Platzierungs-Feedback:** Reichweitenkreis (weiß 40 %, Kante 1 px), ungültiges Tile rot mit X; gültige Tiles nur beim Platzieren hervorgehoben (kein Dauer-Raster).
- **Hud-Layout (Zielfenster 1920×1080, Skalierung 3×):** oben Leben/Münzen/Welle; links oder unten Team-Slots (6 Icons 48×48); rechts Wellenvorschau (Gegner-Icons 24×24, Modifier-Overlays); Boss-Balken oben Mitte. Das Spielfeld bleibt mittig und wird nie von UI überdeckt.
- **Portraits im Menü:** 128×160-Rahmen, Seltenheit als Rahmenfarbe **und** Sternform (Rare = 3, Epic = 4, Legendary = 5, Mythic = 6 Facetten), damit Farbenblinde die Seltenheit unterscheiden. Seltenheitsrahmen: Rare Blau 24, Epic Violett 29, Legendary Gold 20, Mythic Rot-Gold-Verlauf aus Stufen (keine echten Verläufe).
- **Bewegung:** UI-Übergänge höchstens 150 ms, steppend (keine weichen Kurven außer bei Gacha-Reveal). Optionen „Reduzierte Effekte“ und „Screenshake aus“ (GDD §9) wirken auch hier.
- **Gacha/Shop (M3):** Raten und Pity sichtbar neben dem Reveal (ENTSCHEIDUNGEN: fair und transparent); das Reveal-Portrait darf groß (4×) und animiert sein, aber das Ergebnis steht sofort fest und wird nicht verzögert.

## 9. Map und Tiles: Terrassenweg

- **Raster:** vorläufig 18×11 Tiles à 32 px (`gdd.md` §7, Rasterform wird im Prototyp gesetzt).
- **Drei Terrassen**, getrennt durch Stufen/Mauern (Kantenkachel 32×32 mit 8 px Höhe-Eindruck). Hill-Felder = erhöhte Sockel (sichtbar höher, Steinmauer an der Vorderkante), damit Flyer-Regel (nur Hill/Hybrid trifft Flyer) **optisch** begründet ist.
- **Pfad:** Sand/Erde (11/10), 1 Tile breit, Kantenübergänge als Autotile (47er-Blob oder 16er-Maske); Pfad immer heller als die Umgebung.
- **Bauflächen:** Ground = Gras mit Mini-Detail (Halme), Hill = Stein-Sockel. Nicht bebaubar = dunkleres Gras/Büsche/Felsen.
- **Spawn:** Nebelriss, ein 2×2-Spalt mit violettem Nebelwirbel (animiert 6 Frames). **Basis:** die Wachposten-Linde/Gildentor, warm beleuchtet, Leak-Flash wirkt hier.
- **Tageszeit:** Dämmerung (leicht violetter Overlay 10 % an den Rändern), Zentrum hell. Kein Tag-Nacht-Wechsel im MVP.
- **Lizenz:** Tiles dürfen aus CC0-Packs kommen (Kandidaten: `asset-sources.md`), werden palettengetauscht; Spawn, Basis, Hill-Sockel sind voraussichtlich Eigenzeichnung.

## 10. Effekte (Spielfeld)

| Effekt | Frames | Farbe | Quelle |
|---|---|---|---|
| Treffer-Funke | 3 | Weiß/Gold | CC0-Partikel (Kandidat) oder eigen |
| Bleed-Tropfen | 4 | Rot 21 | eigen/CC0 |
| Burn-Flackern | 4 Loop | Glut 30 / Gold 20 | eigen/CC0 |
| Frost-Kegel/Kristalle | 6 | Eisblau 25 | eigen |
| Kreis-Explosion (AoE) | 6 | Glut/Gold/Weiß | eigen/CC0 (Radius skaliert) |
| Lanzen-Linie | 5 | Weiß/Eisblau | eigen |
| Fahnen-Aura-Ring | 8 Loop | Gold 20, 40 % | eigen |
| Münz-Aufstieg | 4 | Gold 20 | eigen |
| Leak-Flash | 3 | Rot 21 | Overlay |
| Gegner-Zerfall | 5 | Schatten 28/29 | eigen |
| Schild-Ring/Bruch | 4 | Eisblau 25/Stein 07 | eigen |

Partikel-Budget: 80 Gegner/60 Units (`rec §7`); Effekte teilen sich Atlasse und werden gepoolt.

## 11. Dateiablage und Konventionen

```
client/assets/
  ATTRIBUTIONS.md            Pflicht: jede Datei, Autor, Lizenz, URL, Abrufdatum, Bearbeitung
  tiles/  units/  enemies/  fx/  ui/  portraits/  audio/{sfx,music}/  fonts/
```

- Namen kleingeschrieben, `snake_case`, Figur-IDs wie in `sim/data/units.json` (`striker`, `gunner`, ...).
- Nur Dateien, die in `ATTRIBUTIONS.md` stehen, gehören ins Repo (CI-Check empfohlen, `docs/research/assets-licensing.md` §3.6).
- Platzhalter erhalten das Präfix `ph_` im Dateinamen, damit sie beim Austausch gegen Eigenzeichnung auffindbar sind.
- Quell-Dateien der Eigenzeichnung (Aseprite `.aseprite` oder `.psd`) liegen **nicht** unter `client/assets/`, sondern wo die Menschen es festlegen; ins Repo gehört nur der exportierte Atlas.

## 12. Offene Punkte (für die Menschen)

1. Portrait-Technik bestätigen: Pixel-Art 128×160 (hier angenommen) oder glatt gemalt (ENTSCHEIDUNGEN: „Flat-Chibi bleibt als spätere Option“). Bei glatt gemalten Portraits ändert sich nur §2 und §4.
2. Master-Palette (§4) nach erstem Figuren-Test freigeben.
3. Pixel-Font mit sauberer Lizenz wählen (`asset-sources.md`).
4. Namen der beiden Bosse (W10, W20) fehlen im GDD; die Zeichenliste führt sie als `boss_w10`/`boss_w20`.
