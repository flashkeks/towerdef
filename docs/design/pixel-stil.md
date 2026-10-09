# Pixel-Stil (Runde 11) — gilt für alles, was im Spiel gezeichnet wird

Vorbild: Kek-Game (`flashkeks/snake`, `public/pfx.js`, `bfx.js`, `afx.js`). Dort sind alle Figuren **Text-Raster**: jede Zeile ein
String, jedes Zeichen ein Pixel, Zeichen → Palettenfarbe, Figuren aus Teilen zusammengesetzt (Kopf + Körper + Waffe + Palette),
zwei Bein-Frames. Größere Dinge (Karte, Bosse, Feuer) werden mit Zeichenbefehlen **in ganzen Pixeln** auf eine kleine
Leinwand gemalt. Genau so hier. **Keine Bilddateien** für Türme, Gegner, Karte, Effekte.

## Grundlagen (Code: `client/src/pixel/`)

- **Palette:** ENDESGA 32 in `client/src/pixel/palette.ts` (32 Farben, Namen wie `leaf`, `amber`, `ink`). Sprites benutzen nur
  diese Namen. Keine Farbe außerhalb der Palette, auch nicht für Effekte. Transparenz nur für Schatten (ink 35 %), Camo-Flimmern
  und weiche Lichtkreise (Laternen, Auren) über Alpha der Ebene, nicht über Zwischenfarben.
- **Raster-Werkzeug:** `client/src/pixel/raster.ts` (`compose`, `overlay`, `outline`, `flipX`, `recolor`, `paint`). Zeichen `.` =
  durchsichtig, `#` = automatischer Umriss.
- **Auflösung:** Spielfeld **640 × 360** Pixel-Art-Pixel. Gerendert wird in eine Textur dieser Größe (oder alles auf ganzen
  Pixeln), dann **scharf hochskaliert** (nearest). Ganzzahliger Faktor, wenn er passt (×2 = 1280 × 720, ×3 = 1920 × 1080),
  sonst der größte Faktor ≥ 1 mit nearest (einzelne Pixel dürfen dann 1 Bildschirmpixel breiter sein). **Text** (Zahlen auf der
  Karte ausgenommen) liegt als DOM scharf darüber.
- **Positionen ganzzahlig:** Figuren, Projektile und Partikel werden auf ganze Pixel gerundet gezeichnet. Kein Sub-Pixel-Glätten,
  keine Rotation von Sprites in beliebigen Winkeln. Richtungen über **8 Richtungs-Frames** oder Spiegeln (`flipX`); Projektile
  (Pfeile) dürfen 16 Richtungen als eigene kleine Raster haben.

## Größen

| Ding | Rahmen | Figur | Hinweis |
|---|---|---|---|
| Turm / Held | 32 × 32 | 18–26 px hoch | T5 darf 40 × 40 nutzen, Fuß unten Mitte |
| Glim, Emberling | 14 × 14 | 10–12 px | rund, große Augen |
| Ironshell | 16 × 16 | 12–14 px | |
| Brute | 22 × 22 | 18–20 px | |
| Leviathan | 64 × 48 | ~56 × 40 px | 3 Platten-Zustände |
| Projektile | 3–9 px | | Pfeil 7 × 3, Bombe 5 × 5, Frostbolzen 5 × 5 mit Schweif |
| Effekte | bis 64 × 64 | | Explosion 5 Frames, Nova 4 Frames, Blitz als Pixel-Linie (Bresenham) |
| Icons (Upgrade-Panel) | 16 × 16 | | eigene Raster je Stufe, ×3 im Panel |

## Licht, Umriss, Schatten

- **Licht von oben links.** Jede Fläche hat 3 Töne: Schatten (unten rechts), Grundton, Licht (oben links), z. B. Ranger-Umhang
  `pine` / `grass` / `leaf`. Glanzpunkt 1 px `white` nur auf Metall, Kristall, Augen.
- **Umriss:** 1 px `ink` außen um jede Figur (automatisch über `outline`). Innenlinien in der dunkelsten Farbe der Fläche, nicht in `ink`.
- **Schlagschatten:** Ellipse unter jeder Figur (Turm 16 × 5, Glim 9 × 3, Boss 40 × 10) in `ink` mit 35 % Alpha, separat
  gezeichnet. Karten-Objekte (Bäume, Häuser) werfen Schatten nach unten rechts.
- **Gegner-Lesbarkeit:** Schichtfarbe ist die Hauptfarbe (Red = `red`, Blue = `sky`, Green = `leaf`, Gold = `amber`/`yellow`).
  Man muss jeden Gegnertyp aus 1 m Abstand am Bildschirm erkennen.

## Animation

| Was | Frames | Takt | Inhalt |
|---|---|---|---|
| Turm Idle | 4 | 6 fps | Atmen (1 px auf/ab), Umhang/Schal flattert, Lunte/Flamme flackert |
| Turm Angriff | 4 | an den Sim gekoppelt | F0 Ausholen (Sim-Event `windup`), F1 halten, **F2 Abschuss (Sim-Event `fire`, Projektil erscheint hier)**, F3 zurück. Ausholen dauert 6 Ticks (0,1 s) |
| Turm Kauf/Upgrade | 6 | 12 fps | Staubwolke, Stufe „ploppt“ (1 Frame 1 px größer), Funken in Pfadfarbe |
| Gegner Laufen | 2–4 | Tempo-abhängig | wabbeln/hüpfen; Gold schneller |
| Treffer | 2 | sofort | Gegner 1 Frame weiße Silhouette, 1 Frame normal |
| Platzen (Schicht) | 6 | 20 fps | Schale zerspringt in 6–10 Pixel-Scherben in der Schichtfarbe + kleiner Puff; Kind erscheint |
| Explosion | 5 | 20 fps | Kreis `yellow` → `amber` → `orange` → Rauch `stone`/`slate` |
| Boss-Platte fällt | 8 | 15 fps | Platte fliegt im Bogen weg, Funken |

**Sichtbarkeit der Stufen:** Türme setzen sich aus Teilen zusammen (Sockel + Körper + Kopfbedeckung + Waffe + Rücken + Aura).
Jede Pfadstufe tauscht oder ergänzt ein Teil (siehe Spalte „Am Turm sichtbar“ in `tuerme.md`). So reichen ~10 Teile je Pfad statt
45 Einzelbilder. Regeln: **Stufe 3 ändert die Silhouette deutlich** (neue Waffe), **Stufe 5 ist groß und spektakulär** (Aura,
Leuchten, größerer Rahmen). **Sockel** nach höchster Stufe: 0–2 Holzstumpf, 3–4 Stein mit Messing, 5 Gold mit Leuchten.
Der Pfad mit der höchsten Stufe bestimmt Waffe und Haltung; der zweite Pfad (≤ 2) bringt kleine Zusätze.

## Karte

Handgebaut im Code (`client/src/pixel/map/`), einmal in eine Textur gemalt, darüber wenige bewegte Ebenen (Wasser, Fahnen,
Glühwürmchen, Laternen). Gras in 3–4 Tönen mit Büscheln und Blumen (gestreut mit festem Seed), Weg als Erdpfad mit Randsteinen
und Fußspuren, Bach mit Ufer, Schaum und animierter Oberfläche, Holzbrücken, Bäume (3 Arten), Zäune, Steine, Häuser der Stadt
mit Laternen, Stadttor mit Fahnen. Westrand violett (Dämmerung), Ostrand warm (Laternenlicht).
