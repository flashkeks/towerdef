# ASTD: Meta-Progression

Format: `Wert [Herkunft/Sicherheit Quelle]`. Quellen: [sources.md](sources.md). Gacha-Daten in [data/gacha.json](data/gacha.json). Monetarisierung nur als Struktur.

## 1. Account-Level / XP

| Punkt | Befund | Tag |
|---|---|---|
| XP-Quelle | je Welle in Infinite/Story; Formel "n(wave)", Extreme "n(3wave)" (Wiki-Vermutung "most likely") | O/LOW ASTD-S25 |
| Beispiel Story | Beginner Saga abgeschlossen: 10 000 XP (Normal) | O/HIGH ASTD-S15 |
| Infinite | kleine XP und Gold; EXP-Units alle 10 Wellen | O/HIGH ASTD-S11 |
| XP-Kurve | Level-Schwellen UNKNOWN | U/UNKNOWN |
| Level-Gates | PvP ab 15, Trials ab 25 (bis 150), Raids ab 50, Challenges ab 75, World 2 ab Level 100 (Banner Z) | O/MEDIUM ASTD-S25, ASTD-S27 |
| Level-Wirkung | mehr Loadout-Slots, Trials-Zugang; Unit-Level (bis 175) skaliert Farm-Einkommen | O/MEDIUM ASTD-S25, ASTD-S13 |
| Star Pass | Saisonpass mit Free-, Premium-, Ultra-Spur; liefert Legacy Tokens ab Season 9; XP auch aus Infinite | O/MEDIUM ASTD-S7, ASTD-S11 |

## 2. Währungen: Quellen und Sinks

| Währung | Quellen | Sinks | Tag |
|---|---|---|---|
| Cash | nur im Match (Kills, Wellenende, Farms) | Platzieren, Upgrades | O/HIGH ASTD-S7 |
| Gems | Tasks 15 bis 40 je, Story (neu 20/30, wiederholt 5/6; ältere Seite 20/4 bis 5), Codes, Time Chamber, Daily Login 10 bis 50, Tower 150 bis 300 je Floor (erste Klärung je Season), Robux | Gems-Banner, PvP-Bosse, Orbs, Inventar, Tower-Auto-Battle (20) | O/HIGH ASTD-S7, ASTD-S14, ASTD-S18, ASTD-S9 |
| Gold | Story (100+), Time Chamber, Codes, Treasure Cart, Infinite | Gold-Banner (Zweit-Units), Emotes, PvP-Shop | O/HIGH ASTD-S7 |
| Stardust | Level-Up, Story, Daily, Battle Road, Time Chamber, Tower (alle 10 Floors: 20 bis 200), Tower-Leaderboard, Team-Event | Special Summon | O/HIGH ASTD-S7, ASTD-S18 |
| Zone-Raid | 125 Stardust (erste Klärung) | | O/HIGH ASTD-S22 |
| G (Gauntlet) | 1 G je 300 s Überleben, auch bei Niederlage oder Verlassen | Gauntlet-Shop (Ombra 135 G, Boros-Token 2 G je, Unhuman 36 G ...) | O/HIGH ASTD-S19 |
| Legacy Tokens | hohe Star-Pass-Tiers ab Season 9 | Legacy Token Shop (alte Pass-Units) | O/HIGH ASTD-S7 |
| Event-Token/Candy | Event-Gegner-Drops | Event-Shops | O/HIGH ASTD-S7 |
| Emeralds | entfernt (World 2, Banner Z früher) | | O/HIGH ASTD-S7 |
| Orb-Materialien | Infinite "Farm" Gegner-Drops | Orb Shop | O/HIGH ASTD-S11, ASTD-S17 |

Bemerkenswert: 1 Gem-Banner-Spin kostet 50 Gems, eine Story-Wiederholung gibt 5. Das Tempo des Gems-Flusses ist damit klein gegen den Bedarf der Pity (siehe unten).

## 3. Gacha

### Gems-Banner

| Banner | Kosten | Rate (Slots) | Pity | Tag |
|---|---|---|---|---|
| X (immer offen) | 50 Gems je Spin, 10er für 450 | 5 Sterne 2 %; 4 Sterne 8 % und 8 %; 3 Sterne 25 %, 27 %, 30 % | 80 Spins garantiert 5 Sterne (3 600 Gems mit 10er) | O/HIGH ASTD-S10 |
| Y (nach Kingdom of Ants) | wie X | 5 Sterne 2 %; 4 Sterne 10 % und 10 %; 3 Sterne 23 %, 27 %, 28 % | wie X | O/HIGH ASTD-S10 |
| Z (World 2) | 100 Gems je Spin, 10er für 900 | 6 Sterne 1 %; 5 Sterne 7 % und 9 %; 4 Sterne 25 %, 28 %, 30 % | 140 laut Haupttext (12 600 Gems), 120 laut späterem Absatz (Widerspruch) | O/MEDIUM ASTD-S10 |
| W (World 3, entfernt) | 135 je Spin, 1 200 für 10 | 5 Sterne 1 %, 6 Sterne 9 % und 15 %, 5 Sterne 20 % und 30 %, 3 Sterne 25 % | keine Pity | O/MEDIUM ASTD-S10 |
| Gold-Banner | 150 Gold je Spin, 1 100 für 10 | 4/3/2-Sterne-Zweit-Units, Slot-Raten 35/25/25/15 % | keine 5 Sterne | O/HIGH ASTD-S10 |
| Special | 5 Stardust je Spin, 50 für 10 | Featured 1,5 %, globaler Pool 98,5 % | keine Pity; jede dritte Multi gibt einen freien 10er | O/HIGH ASTD-S10 |

Banner-Rotation stündlich; wer beim Wechsel noch zieht, erhält die alte Auswahl [O/HIGH ASTD-S10]. Secret-Units 1/2000 [O/HIGH ASTD-S10]. Der Wiki-Hinweis zu den Raten stimmt nicht mit der Seite "How To Play" überein (4 Sterne 4 %); die Hero-Summon-Seite ist die gepflegtere Quelle [O/MEDIUM ASTD-S25].

### Pity-Regeln (Hero Summon)

- Pity zählt über Banner-Wechsel hinweg weiter; Verlassen des Servers setzt zurück [O/HIGH ASTD-S10].
- Pity-Zähler setzt nach der Schwelle zurück, auch wenn zwischendurch ein 5-Sterne fiel (laut Seite) [O/MEDIUM ASTD-S10].
- Rechnung der Wiki-Autoren: Chance auf mindestens einen 5-Sterne nach 60 Spins ca. 70 % (1 - 0,98^60 = 70,2 %) [D/HIGH ASTD-S10, Nachrechnung korrekt].

## 4. Evolution, Orbs, Traits

| System | Befund | Tag |
|---|---|---|
| Evolution | Primär-Unit plus Zweit-Units/Tokens/EXP-Units (und manchmal Kills) werden zur stärkeren Stufe; Beispiele unten | O/HIGH ASTD-S20, ASTD-S23, ASTD-S24 |
| Zweit-Units | Gold-Banner, Story-Drops; "not meant for use in missions" | O/HIGH ASTD-S25 |
| EXP-Units | EXP I (90 %), EXP II (10 %) je 10 Infinite-Wellen; höhere EXP III/IV aus Raids | O/MEDIUM ASTD-S11, ASTD-S24 |
| Gauntlet-Evolution | Tokens (Ultra Token 2 G, Boros-Token 2 G, ...) bis 7 Sterne | O/HIGH ASTD-S19 |
| Orbs | 1 Orb je Unit-Slot, jeder Orb nur einmal besitzbar (Wasser-Orb Ausnahme); Quellen Trials (Extreme), Raids, Farm-Map, Prestige | O/HIGH ASTD-S17, ASTD-S25 |
| Traits/Rerolls | nicht gefunden; Gegner- und Unit-Enchants sind fix | U/UNKNOWN |
| Blessings | Sondereigenschaften bestimmter Units (Idol, Loving Pillar, Demon of Emotion) | O/LOW ASTD-S21 |
| Prestige | existiert (Super Blueeye Orb als Wunsch-Relikt), Details UNKNOWN | O/LOW ASTD-S17 |

Evolutionsbeispiele (alles O/HIGH):

| Ziel | Zutaten | Quelle |
|---|---|---|
| Alien Soldier II | 2x Alien Soldier | ASTD-S20 |
| Sword (Maid) II | 2x Sword (Maid), 2x Arruncur IV, 3x EXP IV | ASTD-S24 |
| Evil Shade (Final), 7 Sterne | 3x Evil Shade (Jagan), 50 Darkness Token, 11 Darkness Charge, 1 Demon Fighter III, 7 500 Kills | ASTD-S23 |

Orb-Beispiele (alle O/HIGH ASTD-S17):

| Orb | Effekt | Beschaffung |
|---|---|---|
| Universal Reduction | -15 % Gesamtkosten, alle Units | Trial Lv 70 Extreme, 20 % |
| Ultra Magic | +20 % Start-Range, +5 % Gesamtschaden, -7 % Kosten | Boss Rush 2 |
| Azure | -10 % Start-Range, +15 % Gesamtschaden | Sijin Raid Extreme |
| Fire Rage | +100 % Startschaden | Trial Lv 75 |
| Bomba | +30 % Startschaden | Trial Lv 35 Extreme |
| Cost | -100 Einsatzkosten | Trial Lv 45 Extreme |
| Blue Eye / Super Blue Eye | +30 % / +40 % Start-Range | Material-Craft / Prestige |

## 5. Modi

| Modus | Kernfakten | Tag |
|---|---|---|
| Story | 6 Missionen je Karte, 4 Spieler laut Altseite, Extreme = 3x Belohnung | O/MEDIUM ASTD-S14, ASTD-S25 |
| Infinite | Normal/Extreme (x10 HP, 3x Belohnung), Varianten Regular 1/2, Random Unit, Category, Air, Solo, Elemental, Training, Gauntlet, Farm; Quad/Trio/Duo/Solo | O/HIGH ASTD-S11 |
| Trials / Raids / Challenges | Level-Gates 25 bis 150; Raids bis 8 Spieler; 15 oder 19 Wellen; Raids droppen exklusive Units/Evolutions-Items | O/HIGH ASTD-S22, ASTD-S27 |
| Zones | 5 Wellen, 2,3 Mio. Startgeld, nur Kategorie-Units | O/HIGH ASTD-S22 |
| Tower Mode | unendlich viele Floors, Seasons (Season 10 aktiv), Belohnung 150 bis 300 Gems/Floor, Floor-100-Season-Unit | O/HIGH ASTD-S18 |
| Gauntlet | 18 Mio. Startgeld, Zeit-Währung G | O/HIGH ASTD-S19 |
| PvP | 1v1 und 2v2 ab Level 15, Boss-Einsatz | O/LOW ASTD-S25 |
| Events | Saison-Events (Christmas, Summerfest, Halloween, Big Bass ...) mit Event-Währung | O/MEDIUM ASTD-S7, ASTD-S28 |

## 6. Multiplayer

| Punkt | Befund | Tag |
|---|---|---|
| Server | max. 38 Spieler (Lobby) | V/CONFIRMED ASTD-S1 |
| Match-Größe | Story bis 4, Raids bis 8, Infinite 1 bis 4 (Solo/Duo/Trio/Quad) | O/MEDIUM ASTD-S25, ASTD-S22, ASTD-S11 |
| Geld | pro Spieler (Beleg indirekt: Platzierungslimit "everyone", jeder bringt eigene Farm) | R/LOW ASTD-S11, ASTD-S9 |
| Idol-Shine | nur ein Spieler kann gleichzeitig nutzen | O/HIGH ASTD-S21 |
| Leader | jeder Spieler hat eigenen Leader-Slot | R/LOW ASTD-S16 |

## 7. Monetarisierung (nur Struktur)

Game-Pass-API: Antwort 404, Struktur daher UNKNOWN [A ASTD-S2]. Aus dem Wiki erkennbar: Gems sind gegen Robux kaufbar (und verschenkbar) [O/HIGH ASTD-S7]; Star Pass mit Free/Premium/Ultra-Spuren [O/MEDIUM ASTD-S7]; limitierte und stündlich rotierende Banner [O/HIGH ASTD-S10]; Prestige/Wünsche [O/LOW ASTD-S17]. Es werden keine Preise geführt.
