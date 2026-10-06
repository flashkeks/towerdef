# Asset-Quellen (Recherche P8)

Stand: 2026-10-06. **Wichtig vorweg: Die Lizenzprüfung auf den Seiten selbst war nicht möglich.** Der Egress-Proxy der Recherche-Umgebung sperrte `kenney.nl`, `opengameart.org`, `*.itch.io`, `fonts.google.com` und `incompetech.com` (Meldung `EGRESS_BLOCKED`, je Domain ein Abruf, die Sperre ist deterministisch, weitere Versuche sinnlos). Es gab nur WebSearch-Treffer (Zusammenfassungen von Suchergebnissen, also Sekundärquellen). Nach der Stopp-Regel des Auftrags ist daher **jedes Pack unten `UNKNOWN` und nicht freigegeben**. Die Spalte „Lizenz laut Suche/Wissen“ ist ein **Hinweis, wo man zuerst nachsehen soll**, kein Prüfergebnis.

**Nichts wurde heruntergeladen, nichts liegt in `client/assets/`.**

## Freigabe-Prozess (für die Menschen, ca. 20 Minuten für die Top-Liste)

Je Pack, bevor eine Datei ins Repo kommt:
1. Pack-Seite im Browser öffnen, Lizenzzeile lesen (Kenney: „License: Creative Commons CC0“, itch.io: Abschnitt „License“ bzw. Beschreibung, OGA: Feld „License(s)“). Bei itch.io-Packs **die Lizenz im Beschreibungstext der Seite**, nicht den Dropdown-Tag allein.
2. Nur CC0, CC-BY (mit Eintrag in Credits) oder Kauflizenz mit kommerzieller Nutzung. Nichts mit NC, ND, SA.
3. Prüfdatum + Lizenzwortlaut in `client/assets/ATTRIBUTIONS.md`; Tabellenzeile unten auf `geprüft` setzen.
4. Mehrere Autoren in einem Pack (OGA-Sammlungen, Kenney-Bundles mit Fremdanteil) Datei für Datei prüfen.

Spalte **Status**: `UNKNOWN` = Seite nicht abrufbar, nicht empfohlen bis zur Prüfung. Sobald geprüft: `OK`.

## 1. Tiles und Umgebung

| Pack | Link | Lizenz laut Suche/Wissen (ungeprüft) | Kommerziell | Namensnennung | Preis | Eignung für Pixel-Anime-TD | Status |
|---|---|---|---|---|---|---|---|
| Kenney **Tiny Town** (16×16, Dorf/Wiese/Wege) | https://kenney.nl/assets/tiny-town | CC0 (Kenney-Standard); Suchtreffer bestätigt nur Tiny Dungeon/Creatures als CC0 | ja (falls CC0) | nein (falls CC0) | 0 | **Hoch** für Terrassenweg: Gras, Wege, Zäune, Häuser; 16 px → 2× = 32-px-Tile. Passend zu Teehaus (farm). Palette-Swap nötig. | UNKNOWN |
| Kenney **Tiny Dungeon** (16×16) | https://kenney.nl/assets/tiny-dungeon | Suchtreffer: OGA-Variante „kenney 16x16“ CC0, Farbzahl unter 32 | ja (falls CC0) | nein | 0 | Mittel/Hoch: Stein, Mauern, Treppen für Terrassen/Hill-Sockel; Figuren nur als Platzhalter (Chunky-Outline, kein Anime) | UNKNOWN |
| Kenney **Tiny Creatures** (OGA) | https://opengameart.org/content/tiny-creatures | Suchtreffer: CC0 1.0 | ja (falls CC0) | nein | 0 | Mittel: Monster als **Platzhalter** für Gegner (nicht schattenwesen-typisch, Palette-Swap auf Violett) | UNKNOWN |
| Pixel Frog **Tiny Swords** (Gratis-Demo und Voll-Pack) | https://pixelfrog-assets.itch.io/tiny-swords-demo | Suchtreffer: „CC0“ für das Demo (nicht verlässlich); Voll-Pack Lizenz/Preis UNKNOWN | UNKNOWN | UNKNOWN | Demo 0, Voll-Pack UNKNOWN | **Sehr hoch** stilistisch: Fantasy-Terrain, Gebäude, Einheiten und Gegner in einem Stil, 64-px-Raster (größer als unser 32-px-Tile, müsste verkleinert oder als 2×-Tiles genutzt werden) | UNKNOWN |

## 2. Effekte

| Pack | Link | Lizenz laut Suche/Wissen | Kommerziell | Nennung | Preis | Eignung | Status |
|---|---|---|---|---|---|---|---|
| Kenney **Particle Pack** | https://kenney.nl/assets/particle-pack | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Mittel: Funken, Rauch, Flammen, Kreise als Basis für Treffer/Burn/Explosion; weich statt pixelig, per Downscale + Palette-Quantisierung anpassbar | UNKNOWN |
| Eigene Effekte (Zeichenliste) | – | selbst gezeichnet | ja | nein | Arbeitszeit | **Hoch**: Telegraph, Schwachstelle, Frost-Kegel, Fahnen-Ring brauchen exakte Form und Palette; siehe `art-styleguide.md` §7, §10 | – |

## 3. UI

| Pack | Link | Lizenz laut Suche/Wissen | Kommerziell | Nennung | Preis | Eignung | Status |
|---|---|---|---|---|---|---|---|
| Kenney **Pixel UI Pack** (9-Slice-Panels, Buttons) | https://kenney.nl/assets/pixel-ui-pack | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Mittel: saubere 9-Slices als Basis, Palette-Swap auf Pergament/Holz nötig; Gildenstimmung kommt aus eigenem Rahmen | UNKNOWN |
| Eigene Rahmen/Icons | – | selbst gezeichnet | ja | nein | Arbeitszeit | Hoch für Gilden-Optik, Seltenheits-Rahmen (Sternformen) | – |

## 4. Gegner

| Pack | Link | Lizenz laut Suche/Wissen | Kommerziell | Nennung | Preis | Eignung | Status |
|---|---|---|---|---|---|---|---|
| Tiny Creatures (siehe Abschnitt 1) | s. o. | CC0 laut Suchtreffer | ja (falls CC0) | nein | 0 | nur Platzhalter | UNKNOWN |
| Tiny Swords Gegner (siehe Abschnitt 1) | s. o. | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | Platzhalter, stilistisch passend | UNKNOWN |
| **Eigene Schattenwesen** | – | selbst gezeichnet | ja | nein | Arbeitszeit | Pflicht für Wiedererkennbarkeit der 7 Archetypen und der Bosse (Silhouettenregeln in `art-styleguide.md` §6) | – |

## 5. Sounds

| Pack | Link | Lizenz laut Suche/Wissen | Kommerziell | Nennung | Preis | Eignung | Status |
|---|---|---|---|---|---|---|---|
| Kenney **Impact Sounds** | https://kenney.nl/assets/impact-sounds | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Hoch für Treffer/Aufprall (Titan-Schlag, Platzieren) | UNKNOWN |
| Kenney **RPG Audio** | https://kenney.nl/assets/rpg-audio | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Mittel/Hoch: Münzen, Klingen, Türen, Stoff; Fantasy-Ton passend | UNKNOWN |
| Kenney **Interface Sounds** / **UI Audio** | https://kenney.nl/assets/interface-sounds | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Hoch für Klicks, Hover, Fehler | UNKNOWN |
| Freesound, Filter **CC0** (Einzeldateien) | https://freesound.org/ | Je Datei; Plattform mischt CC0, CC-BY und NC (`assets-licensing.md`) | nur bei CC0/CC-BY | bei CC-BY ja | 0 | Lückenfüller für Boss-Ton (tiefer Aufbau, Zweiklang, Risse). Jede Datei einzeln prüfen und eintragen | UNKNOWN (je Datei) |

Fehlend und selbst/aus Einzeldateien zu lösen: Boss-Telegraph-Aufbauton, Schwachstellen-Zweiklang, Crit-Ton (gunner), Figuren-Stimmen (nur Text, GDD §9: keine Sprachausgabe).

## 6. Musik

| Pack | Link | Lizenz laut Suche/Wissen | Kommerziell | Nennung | Preis | Eignung | Status |
|---|---|---|---|---|---|---|---|
| Juhani Junkala **5 Chiptunes (Action)** | https://opengameart.org/content/5-chiptunes-action | Suchtreffer: CC0, 5 Loop-Tracks, über 25 000 Downloads | ja (falls CC0) | nein | 0 | Mittel: Chiptune-Ton ist „retro“, nicht „warmherzige Fantasy“; als **Kampf-Platzhalter** brauchbar, nicht für Finalstimmung | UNKNOWN |
| Kevin MacLeod / incompetech | https://incompetech.com/music/royalty-free/ | Üblicherweise CC-BY 4.0 (nicht geprüft, Seite gesperrt) | ja bei CC-BY | ja | 0 | Mittel: viele Fantasy-Orchestral-Tracks; Namensnennung im Credits-Screen Pflicht | UNKNOWN |
| Kenney **Music Jingles** | https://kenney.nl/assets/music-jingles | CC0 (Kenney-Standard) | ja (falls CC0) | nein | 0 | Mittel: Wave-Clear- und Sieg-Jingles | UNKNOWN |

Fehlend: Boss-Track (GDD §9: zwei Tracks Kampf und Boss), Menü-Ambiente. Für „Platzhalter erlaubt, Finale später“ reicht ein CC0/CC-BY-Track; Finale per Auftrag mit schriftlicher Rechteübertragung.

## 7. Schrift

| Schrift | Link | Lizenz laut Suche/Wissen | Hinweis | Status |
|---|---|---|---|---|
| Silkscreen, Press Start 2P (Google Fonts) | https://fonts.google.com/specimen/Silkscreen | SIL OFL (nicht geprüft, Seite gesperrt) | **OFL steht nicht in der Lizenzliste des Auftrags (CC0, CC-BY, Kauf).** Bevor eine OFL-Schrift genutzt wird, entscheiden die Menschen, ob OFL für Fonts zulässig ist. Alternative: Pixel-Font selbst zeichnen oder CC0-Bitmap-Font (z. B. Kenney Fonts, ungeprüft). | UNKNOWN, Entscheidung offen |

## 8. Zusammenfassung

| Kategorie | Bewertete Quellen | Geprüft (Seite gelesen) | Empfehlung nach Prüfung |
|---|---|---|---|
| Tiles | 4 | 0 | Tiny Town + Tiny Dungeon (Terrassenweg), Tiny Swords falls Lizenz klar |
| Effekte | 1 (+ Eigenzeichnung) | 0 | Particle Pack als Basis, Rest eigen |
| UI | 1 (+ eigen) | 0 | Pixel UI Pack als 9-Slice-Basis |
| Gegner | 3 Quellen (nur Platzhalter) | 0 | eigen zeichnen |
| Sounds | 4 | 0 | Kenney-Audio-Packs + Freesound-CC0 |
| Musik | 3 | 0 | Chiptunes als Platzhalter, Final per Auftrag |
| Schrift | 1 | 0 | Lizenzfrage klären |

**Insgesamt 16 Kandidaten benannt, 0 verifiziert.** Keiner ist freigegeben.

## 9. Lücken (nicht durch freie Packs lösbar)

- Die **8 Figuren** (`striker`, `gunner`, `blaster`, `banner`, `farm`, `lancer`, `frost`, `titan`), ihre Portraits, die Icons.
- **7 Gegner-Archetypen** in Schattenwesen-Optik und **2 Bosse** mit Telegraph-/Schwachstellen-Posen.
- Spawn (Nebelriss), Basis (Gildentor/Linde), Hill-Sockel.
- Boss-Effekte, Frost-Kegel, Fahnen-Ring, Lanzenlinie, Seltenheits-Rahmen.
- Boss-Musik und -Töne.

Siehe `docs/design/zeichenliste.md`.
