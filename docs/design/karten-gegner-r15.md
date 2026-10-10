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

## 5. Nachtrag 15b — Runden wie BTD6 (Max, 10.10.2026, vor dem Deploy von Runde 15)

Max: „jede Welle hat dieselben Gegner immer … egal auf welcher Map … macht es für dich einfacher, viele neue Maps zu bauen …
die neuen Gegner nicht wasten … bis Runde 60 oder 80 und danach Free Play.“ Gewählt: **40 / 60 / 80 (wie BTD6)**.

- **Eine Rundenliste für alle Karten** (`sim/data/rounds.json`, 80 Runden). Die Karten-Rundenlisten (`rounds/<karte>.json`) entfallen.
  Karten unterscheiden sich nur durch Weg, Look, Stufe und Belohnungsfaktor. Neue Karte = Weg + Bild.
- **Ende je Schwierigkeit:** Easy R40, Medium R60, Hard R80 (= Sieg, Medaille). Hard-Faktoren (Tempo/HP) wie bisher obendrauf.
- **Freeplay** nach dem Sieg (Knopf „Continue in Freeplay“ wie BTD6): Runden darüber hinaus aus einer Formel (Liste ab R61–80 zyklisch
  wiederverwendet, HP/Tempo steigen je Runde, BTD6-artige Rampe ab R81/R101). Kein Medaillen-Einfluss; **Bestrunde Freeplay je Karte**
  wird gespeichert und auf der Kachel gezeigt. Powers im Freeplay erlaubt.
- **Gegner-Einführung (grob):** R1–20 wie die bisherige Meadow-Liste (bleibt vertraut), Pink ~R15, Frostling ~R25, Regrow ~R30,
  Crystal ~R38, Gloomship ~R45, Fortified ~R55, danach Mischungen, Gloomship-Wellen, R70+ Fortified Blimps.
- **Bosse fest in der Liste:** Dusk Leviathan R20, Frost Wyrm R40, Ember Colossus R60, R80 alle drei nacheinander (Finale Hard).
  Boss-HP-Werte je Schwierigkeit bleiben; Wyrm/Colossus ggf. an die neue Runde anpassen.
- **Zusatzmodi** bleiben (Deflation: ab Runde Ende − 10 → Easy R31, Medium R51, Hard R71; Endrunde gilt je Schwierigkeit).
- **Balance-Ziel (Bot-Matrix, mit Held):** Meadow Easy R40 mit 2 Türmen T3/T4 machbar; Medium R60 braucht T4 + Planung, T5 sicher;
  Hard R80 nur mit T5. Frostfen/Quarry entsprechend härter durch den Weg (nicht durch eigene Runden). Einkommen pro Runde nach
  BTD6-Kurve, damit T5 um R50–60 bezahlbar ist.
- Spieler-XP/Embers je Runde bleiben formelbasiert; ggf. dämpfen, damit 80 Runden nicht die Level-Kurve sprengen.

### Nachtrag 15b-2 (Max, 10.10.2026, nach den ersten Rundenlisten) — gilt vor den Zahlen oben

1. **Continue = einfach weiterspielen.** Max: „wenn man mit Easy Mode fertig ist … einfach weiterspielen kann und dann halt dieselben Gegner kriegt wie im Hard Mode …
   trotzdem den 60er-Boss, 80er-Boss und so weiter.“ Nach dem Sieg (Easy R40 / Medium R60) laeuft „Continue in Freeplay“ auf **derselben Liste** weiter
   (Easy R41, Wyrm/Colossus/R80-Bosse inklusive, auf der gewaehlten Schwierigkeit). Keine Spruenge, keine Sonderliste. Die Freeplay-Bestrunde zaehlt ab der
   Endrunde der gespielten Schwierigkeit (ein Wert je Karte, Standardmodus).
2. **Feste Liste bis R120, Formel erst ab R121.** Max: „ab Runde 81 nicht jede Runde gleich … bei Runde 100 dieser ganz große Mob … bei Runde 90 diese schwarzen,
   extrem schnellen Schiffe … Runden trotzdem fest spezifiziert … reine Formel ab Runde 120 … fast unmöglich, extremst schwer, soll lange dauern.“
   `sim/data/rounds.json` hat 120 Runden (Quelle `sim/scripts/gen-rounds.mjs`), `sim/src/freeplay.ts` liefert R121+ (HP-/Tempo-/Anzahl-Rampe, Seed, jede 10. Runde Finale).
3. **Drei neue Blimps** (IDs fest): `cruiser` „Gloom Cruiser“ (Huelle 1.600, Tempo 0,6, 4 x gloomship, ab R82), `duskrunner` „Duskrunner“ (400, Tempo 2,6, immer camo,
   explosions-immun, 4 x frostling mit camo+Regrow, ab R90), `dreadnought` „Dusk Dreadnought“ (20.000, Easy 15.000 / Hard 30.000, Tempo 0,25, immun gegen
   Einfrieren/Verlangsamen/Betaeubung, 2 x cruiser + 3 x duskrunner, nur R100/R110/R120). Fortified gilt fuer cruiser/dreadnought, nicht fuer den Duskrunner.
   Der Dreadnought ist ein Blimp, kein Boss (keine Boss-Phasen, Boss-Banner nur Leviathan/Wyrm/Colossus).
4. **Abweichungen von §5 oben, mit Grund:** (a) R1–20 bleiben **exakt** die alte Meadow-Liste, Pink Glim erscheint erst in R21 (ein Pink-Trupp in R15 liess Hard bei R20 kippen,
   ein Leck kostet 5 Leben je Pink). (b) Deflation startet bei **Ende − 10** = R30 / R50 / R70 (die Zahlen R31/R51/R71 in §5 waeren Ende − 9; die Regel „Ende − 10“ wie in Runde 15 A gilt).
   (c) Pop-Gold wird ab R21 gedaempft (`popBp`: R40 x0,4, R80 x0,2, ab R120 x0,12) und der Rundenbonus waechst (+5 je Runde ueber 20), sonst waere T5 schon um R30 bezahlt.
   (d) Spieler-XP/Embers je Runde sind auf (20/Endrunde)^1,5 gedaempft (`roundRewardBp`), volle Partie ca. 3.400 / 4.300 / 5.300 XP statt 2.970 (R20).
