# Runde 15: Karten, Gegner, Modi — Entwurf Hauptsitzung (10.10.2026)

Max (nach Runde 14): „mehr Maps und mehr Charaktere“ — gewählt: **mehr Gegner, mehr Helden, mehr Türme**, dazu Issue #6
(Karten mit Schwierigkeits-Leiter, erste Karte bleibt einfach, Zusatzmodi). **Runde 15 = Karten + Gegner + Modi. Runde 16 = Helden + Türme.**
Einheiten wie `tuerme.md`/`gegner.md` (+ Nachträge). Spielertexte Englisch.

## 1. Karten (Leiter wie BTD6: Beginner → Intermediate → Advanced)

| Karte | Stufe | Runden | Boss | Look (Pixel, im Code gemalt wie Meadow) | Besonderheit |
|---|---|---|---|---|---|
| **Lanternfall Meadow** (vorhanden) | Beginner | 20 | Dusk Leviathan R20 | Sommerwiese, Bach, Stadt | langer Weg, viel Platz |
| **Frostfen Crossing** | Intermediate | 25 | Frost Wyrm R25 (Leviathan R20 als Vorbote) | Winter: zugefrorener See, verschneite Tannen, Fischerhütten, Eisschollen, Schneefall | **zwei Eingänge**, die sich in der Mitte vereinen; See unbebaubar; Weg ≈ 1.350 px je Ast |
| **Ember Quarry** | Advanced | 30 | Leviathan R20, Ember Colossus R30 | Steinbruch: Lavaströme, Lorenschienen, Kristalle, Funken, Dunst | **kurzer Weg** (≈ 1.050 px) mit Schleifen, wenig Bauplatz (Lava + Felsen), Brücken |

- Weg-Länge und -Form bestimmt die Schwierigkeit (BTD6). Easy/Medium/Hard je Karte mit **eigenen Medaillen**; Hard-Faktoren wie bisher.
- **Freischaltung:** Frostfen ab Spieler-Level 8 **oder** Medium-Medaille auf Meadow; Ember Quarry ab Level 12 **oder** Medium auf Frostfen.
- **Belohnung je Karte:** Spieler-XP × 1,0 / 1,15 / 1,3, Embers × 1,0 / 1,2 / 1,4 (Beginner/Intermediate/Advanced).
- Kartenwahl auf der Startseite: Karten-Kacheln mit Vorschaubild, Stufe, Medaillen je Schwierigkeit und Modus, Schloss mit Bedingung.

## 2. Neue Gegner und Merkmale

| ID | Name | Hülle HP | Tempo | Kinder | Merkmal | erstes Auftreten |
|---|---|---:|---:|---|---|---|
| `pink` | Pink Glim | 1 | 3,5 | gold | schnellster Glim | Frostfen R3 |
| `frostling` | Frostling | 1 | 1,8 | 2 × pink | **explosions-immun** (wie BTD6 Schwarz) | Frostfen R8 |
| `crystal` | Crystal Brute | 20 | 1,2 | 2 × brute | zäh, Risse 0–3 | Frostfen R18 / Quarry R16 |
| `gloomship` | Gloomship | 200 | 0,8 | 3 × crystal | **Blimp** (MOAB-Klasse): kein Einfrieren, Verlangsamung halb, Schaden geht nicht an Kinder | Frostfen R22 / Quarry R21 |
| Merkmal **Regrow** („Bloom“) | – | – | – | – | wächst alle 3 s eine Schicht nach bis zum Ursprungstyp (nicht über den Spawn-Typ), Look: Blätterkranz | Frostfen R12 |
| Merkmal **Fortified** | – | – | – | – | Ironshell/Brute/Crystal/Blimps/Bosse: Hülle × 2, Look: Eisenbänder | Quarry R18 |

**Bosse:** **Frost Wyrm** (`wyrm`, Frostfen R25): Hülle 900 (Easy 600, Hard 1.200), Tempo 0,5, alle 8 s **Frosthauch**: friert Türme im Umkreis 60 px 2 s ein (Turm schießt nicht), bei 66/33 % spuckt er 6 Frostlinge; platzt in 2 Gloomships.
**Ember Colossus** (`colossus`, Quarry R30): Hülle 2.500 (Easy 1.700, Hard 3.200), Tempo 0,4, 4 Panzerplatten (Phasen), bei jeder Platte **Lava-Stampfer**: Gegner in 80 px werden 3 s schneller (+50 %); immun gegen Betäubung; platzt in 2 Gloomships + 4 Crystal.
RBE/Pop-Cash/Leck-Regeln wie bisher (Blimp-Hülle +50 Gold, Boss-Hülle +150).

Rundenlisten je Karte in `sim/data/rounds/<karte>.json` (Meadow bleibt unverändert): Frostfen 25 Runden, Quarry 30 Runden, Dichte und
Einkommen nach BTD6-Muster (Quarry Anfang wie Meadow R5, Ende wie BTD6 R60). Bot-Ziel: sinnvolle 2–3-Turm-Kombination mit Held
schafft Frostfen Medium knapp, Quarry Medium nur mit T4/T5 und Planung.

## 3. Zusatzmodi (je Karte, eigene Medaillen, wie BTD6)

| Modus | Regel | frei ab |
|---|---|---|
| **Primary Only** | nur Ranger, Bombardier, Frostcaller (+ Held) | Easy-Medaille der Karte |
| **Specialists Only** | nur Longshot, Market, Thornweaver, Alchemist (+ Held) | Medium-Medaille |
| **No Hero** | Held gesperrt | Medium-Medaille |
| **Half Cash** | Start und alles Einkommen halbiert | Hard-Medaille |
| **Deflation** | 20.000 Gold Start, kein Einkommen, ab Runde (letzte − 10) | Hard-Medaille |

Modi zählen für Embers/XP mit Bonus (+20 %), Powers sind in Modi erlaubt außer Deflation.

## 4. Pakete

- **A Sim + Meta:** Karten-Daten (Weg mit **mehreren Eingängen** für Frostfen, Wasser/Lava/Blocker), Rundenlisten, neue Gegner + Merkmale + Bosse,
  Modi-Regeln, Karten-/Modus-Freischaltung, Medaillen je Karte × Schwierigkeit × Modus, Belohnungsfaktoren, Bot + Matrix je Karte.
- **B1 Pixel-Karten:** Frostfen Crossing und Ember Quarry so schön wie Meadow (Animationen: Schnee, Eis, Lava, Funken), Vorschaubilder.
- **B2 Pixel-Gegner:** Pink, Frostling, Crystal (Risse), Gloomship, Regrow-/Fortified-Look, Frost Wyrm (Frosthauch, Phasen), Ember Colossus (Platten, Stampfer).
- **C Client:** Kartenwahl mit Leiter/Medaillen/Modi, Modus-Auswahl, Match auf allen Karten, Wellen-Vorschau mit neuen Gegnern, Boss-Effekte.
