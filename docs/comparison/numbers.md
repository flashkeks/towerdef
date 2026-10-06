# Zahlenbereiche nebeneinander

Zweck: Die Zahlen aller sieben Spiele in einer Datei, damit die Startwerte in [recommendations.md](recommendations.md) nachvollziehbar bleiben. Nur vorhandene Repo-Dateien, keine Netzrecherche. Format `Wert [Herkunft/Sicherheit Quelle]` wie in den Spielordnern; `D` = abgeleitet (Rechenweg steht dabei), `UNKNOWN` = in den vorhandenen Dateien nicht belegt. Quellen-IDs: `AA-S65` (Unit-Datenmodul), `AA-S72` (Wiki-Volltext), `BTD-S3` usw. siehe `sources.md` der Spielordner; AA-Kurzfassung: [../anime-adventures/design-brief.md](../anime-adventures/design-brief.md).

**Wichtige Warnung zur Vergleichbarkeit:** Die Spiele verwenden unterschiedliche Einheiten (Yen, Cash, Studs, Spieleinheiten) und Skalen (ASTD und ALS bis in Milliarden, BTD6 bis 627 000, AE bis 93 000). Absolute Zahlen sind nur innerhalb eines Spiels vergleichbar. Verhältnisse (Faktor je Stufe, Σ/Platzierung, Anteil am Startgeld, Payback in Waves) sind die übertragbaren Größen. `docs/research/balancing.md` enthält Faustregeln aus der Fachliteratur (selbst größtenteils `DESIGN`), keine Spieldaten; sie wird nur in [recommendations.md](recommendations.md) verwendet.

## 1. Startgeld

| Spiel | Wert | Bemerkung |
|---|---|---|
| BTD6 | 650 in Easy, Medium, Hard, Impoppable, CHIMPS [O/HIGH BTD-S3,S10,S11,S12]; Half Cash 325 (425 mit MK „More Cash“); Deflation 20 000 ohne weiteres Einkommen [O/HIGH BTD-S10,S11]; MK „More Cash“ +200 [O/HIGH BTD-S3] | Hard startet in Runde 3 und verliert 258 Cash (121+137) [D BTD-S3] |
| AA | Normalmodus UNKNOWN; Contracts: 5 000 Start [O/MEDIUM AA-S72] | DESIGN-Default der AA-Doku 2 000–2 500 ist Setzung, kein Beleg [AA:technical-reconstruction] |
| ASTD | Story/Infinite/Raids UNKNOWN; Zone-Raids 2 300 000; Gauntlet 18 000 000; Infinite Training 1 000 000 000 [O/HIGH ASTD-S22,S19,S11,S9] | Sondermodi, nicht mit Normalmodus vergleichbar |
| AV | Story/Infinite/Legend UNKNOWN; Dungeon-Modifier „High Class“ 10 000 und +40 % Einkommen [O/HIGH AV-S6] | |
| ALS | UNKNOWN [U ALS:economy] | |
| UTDZ | UNKNOWN [U UTDZ:economy] | Hinweis: Bulmo-Wunsch „Wealth“ +30 000 einmalig [O/HIGH UTDZ-S7] |
| AE | UNKNOWN [U AE:economy] | Star-Mission „Win with spending less than 100k yen“ (Normal) bzw. 50k (Hard) [O/HIGH AE-S3]: Gesamtausgaben eines Acts im Zehntausender-Bereich [R/LOW AE-S3] |

## 2. Einkommen je Wave relativ zum Startgeld

Nur BTD6 hat belastbare Werte. Einkommen je Runde = Pop-Cash nach Steuer + Rundenbonus `100 + Runde` [O/HIGH BTD-S3]; Zahlen aus `docs/games/btd6/data/rounds.json`, Startgeld 650 [D].

| Runde | Einkommen | Anteil am Startgeld | kumuliert (ohne Start) | kumuliert / Start |
|---:|---:|---:|---:|---:|
| 1 | 121 | 0,19 | 121 | 0,19 |
| 5 | 164 | 0,25 | 735 | 1,13 |
| 10 | 314 | 0,48 | 1 793 | 2,76 |
| 15 | 266 | 0,41 | 2 981 | 4,59 |
| 20 | 186 | 0,29 | 4 218 | 6,49 |
| 30 | 337 | 0,52 | 7 633 | 11,74 |
| 40 | 521 | 0,80 | 16 856 | 25,93 |
| 60 | 922 | 1,42 | 54 485 | 83,82 |
| 80 | 1 400 | 2,15 | 97 605 | 150,16 |
| 100 | 1 535 | 2,36 | 178 995 | 275,38 |

Mittelwerte je Runde [D aus rounds.json]: R1–10 179 (0,28 × Start), R11–20 242 (0,37), R21–40 632 (0,97), R41–60 1 881 (2,90), R61–80 2 156 (3,32). Der Rundenbonus macht in R1–40 28,6 % des Einkommens aus (4 820 von 16 856) [D].

**Cash je RBE** (Einkommen aus Pops je Lebenspunkt der Bloons, D aus rounds.json): R1–20 1,000; R21–40 0,975; R41–60 0,592; R61–80 0,139; R81–100 0,046. Das ist der Effekt der Steuerstufen 100 → 50 → 20 → 10 % (BTD-S3): Einkommen je Gegner-HP fällt über die Runden stark [D].

Andere Spiele:

| Spiel | Beleg | Etikett |
|---|---|---|
| AA | Wave-Yen existiert, Wert UNKNOWN; Contracts 2 500–5 000 je Runde bei 5 000 Start (0,5–1,0 × Start) | [O/MEDIUM AA-S72; D] |
| ASTD | Kill- und Wellenende-Geld existieren, Beträge UNKNOWN; Leader-Geldbonus +5 bis +20 % auf Farm-Units | [O/LOW ASTD-S7,S9; O/HIGH ASTD-S16] |
| AV | Feld `Yen` im Gegnermodul: 20/25/30/40 normal, 62,5 Mini-Boss, 150 Boss (Kill-Ertrag nicht bestätigt); Wave-Yen UNKNOWN | [O/LOW AV-S5,S20] |
| ALS | Siege +500 % Cash je Kill; sonst UNKNOWN | [O/HIGH ALS-S15] |
| UTDZ, AE | UNKNOWN | [U] |

## 3. Kosten der ersten Platzierung relativ zum Startgeld

BTD6 Medium-Preise [O/HIGH BTD-S15], Startgeld 650 [D = Preis / 650]:

| Tower | Preis | Anteil am Start |
|---|---:|---:|
| Dart Monkey | 200 | 0,31 |
| Glue Gunner | 225 | 0,35 |
| Wizard | 250 | 0,38 |
| Tack Shooter | 260 | 0,40 |
| Boomerang | 315 | 0,49 |
| Sniper | 350 | 0,54 |
| Bomb Shooter | 375 | 0,58 |
| Ice Monkey, Ninja | 400 | 0,62 |
| Ace | 800 | 1,23 |
| Dartling | 850 | 1,31 |
| Village | 1 200 | 1,85 |
| Banana Farm | 1 250 | 1,92 |
| Super Monkey | 2 500 | 3,85 |

Die billigsten Tower kosten also 0,3–0,6 des Startgelds; Farm und Support liegen über dem Startgeld und sind erst nach ein bis zwei Runden bezahlbar [D]. Andere Spiele: AA Platzierung Rare 400, Epic 525, Legendary 850, Mythic 1 350 (Median) [D/HIGH AA-S65] gegen Contracts-Start 5 000 = 0,08–0,27; AV Rare 300–400, Mythic Median 1 300 gegen High-Class-Start 10 000 = 0,03–0,13 [D AV-S3, AV-S6]. Normalmodus-Startgeld UNKNOWN, daher kein belastbares Verhältnis.

## 4. Upgrade-Kostenkurven

„Σ/P“ = Gesamtkosten (Platzierung + alle Upgrades) geteilt durch Platzierung. „Faktor“ = Kosten der Stufe k+1 geteilt durch Kosten der Stufe k. „Stufe 1/P“ = erstes Upgrade geteilt durch Platzierung. „Letzte/P“ = letzte Stufe geteilt durch Platzierung. Alle Verhältnisse [D] aus den genannten Tabellen.

| Spiel | Beispiel | Platz. | Stufen | Σ/P | Stufe 1/P | Letzte/P | Faktor (Median / Spanne) | Quelle |
|---|---|---:|---:|---:|---:|---:|---|---|
| AA | Medianwerte je Rarity (Rare / Epic / Legendary / Mythic) | 400 / 525 / 850 / 1 350 | 5 / 5 / 7 / 8 | 16,5 / 20,0 / 31,7 / 36,9 | UNKNOWN | UNKNOWN | 1,50 / 1,40 / 1,30 / 1,29 | [D/HIGH AA-S65] |
| BTD6 | Dart (Pfad 1, T1–T5) | 200 | 5 | 88,3 | 0,70 | 75,0 | 3,61 (1,43–8,33) | [D BTD-S13] |
| BTD6 | Wizard | 250 | 5 | 177,3 | 0,70 | 128,0 | 3,21 (2,57–6,90) | [D BTD-S13] |
| BTD6 | Super Monkey | 2 500 | 5 | 250,8 | 0,80 | 200,0 | 5,00 (1,25–8,00) | [D BTD-S13] |
| ASTD | Alien Soldier (2★) | 200 | 2 | 4,8 | 1,25 | 2,50 | 2,00 | [D ASTD-S20] |
| ASTD | Sword (Maid) (4★) | 375 | 5 | 15,9 | 0,87 | 4,53 | 1,44 (1,13–2,31) | [D ASTD-S24] |
| ASTD | Evil Shade (Final) (7★) | 400 | 8 | 38 700 | 9,00 | 37 500 | 2,08 (1,67–60,0) | [D ASTD-S23] |
| AV | Top Chef (Rare) | 400 | 4 | 9,4 | 1,00 | 3,38 | 1,50 (1,29–1,75) | [D AV-S3] |
| AV | Cha-In (Mythic) | 1 600 | 10 | 32,4 | 0,75 | 6,53 | 1,25 (1,07–1,79) | [D AV-S3] |
| AV | Armored Mage (Secret) | 1 000 | 12 | 120,5 | 1,60 | 17,0 | 1,13 (1,03–2,00) | [D AV-S3] |
| ALS | Ruru (Ultimate) | 1 000 | 11 | 393 | 1,50 | 80,0 | 1,55 (1,07–2,00) | [D ALS-S7] |
| ALS | Boku (TUI) (Last Standian) | 8 000 | 9 | 1 493 | 2,19 | 906 | 2,02 (1,49–3,33) | [D ALS-S8] |
| UTDZ | Roku (Rare) | 400 | 5 | 13,1 | 0,62 | 4,25 | 1,49 (1,30–2,40) | [D UTDZ-S5] |
| UTDZ | Gen (Legendary) | 500 | 5 | 19,0 | 1,60 | 5,60 | 1,28 (1,22–1,75) | [D UTDZ-S14] |
| UTDZ | Pebble (Legendary) | 450 | 5 | 24,4 | 1,78 | 9,44 | 1,50 (1,39–1,70) | [D UTDZ-S14] |
| UTDZ | Sasku (Mythic) | 1 400 | 7 | 20,1 | 1,43 | 4,14 | 1,18 (1,07–1,35) | [D UTDZ-S4] |
| AE | Kid Assassin (Rare) | 250 | 4 | 13,5 | 2,00 | 4,00 | 1,24 (1,11–1,45) | [D AE-S7] |
| AE | Scissor (Legendary) | 600 | 5 | 17,6 | 1,75 | 5,33 | 1,28 (1,19–1,56) | [D AE-S7] |
| AE | Elf Mage (Mythic) | 1 000 | 6 | 25,1 | 1,55 | 6,25 | 1,30 (1,07–1,61) | [D AE-S7] |
| AE | 8th Sword (Secret) | 2 000 | 10 | 46,4 | 1,38 | 8,25 | 1,20 (1,07–1,45) | [D AE-S7] |

Weitere Σ/P-Werte, jeweils Platzierung inklusive: AV nach Rarity-Median (Rare 8,9, Legendary 19,4, Mythic 49,1, Secret 47,0, Exclusive 50,5; D aus AV-S3 Medianwerten Gesamtkosten/Platzierung: 3 125/350, 16 525/850, 63 800/1 300, 94 000/2 000, 75 700/1 500) [D/MEDIUM AV-S3]; UTDZ Rare 13,1, Legendary 19,0–37,7, Mythic 20,1 [D UTDZ-S4,S5,S14]; AE Rare 13,5–14,9, Epic 16,5, Legendary 17,6–20,7, Mythic 25,1–25,3, evolviert 42,7–48,0 [D AE-S7]. BTD6 Tier-Preis relativ zum Basispreis, Median über 26 Tower × 3 Pfade: T1 0,6, T2 0,9, T3 3,3, T4 12, T5 83 [D BTD-S13]; T5 kostet im Median das 6,2-Fache von T4 [D BTD-S13].

Lesart: Die Roblox-Spiele mit kurzen Matches (AA, AV, UTDZ, AE) liegen meist bei Σ/P 9–50 (Ausreißer: AV Armored Mage 120, UTDZ Bulmo 81) mit Faktoren 1,1–1,6 je Stufe; BTD6 liegt wegen der langen Rundenliste bei Σ/P 88–251 mit Sprung-Faktoren 3–5 an den oberen Stufen; ASTD und ALS driften in extreme Bereiche (Letzte/P 906 bei Boku, 37 500 bei Evil Shade) [D].

Farm-Payback (Kosten kumuliert / Ertrag je Wave):

| Spiel | Unit | Payback gesamt | Grenz-Payback je Stufe | Quelle |
|---|---|---|---|---|
| AA | C.E.O. (Epic, Cap 3) | 2,75–3,52 | 2,75–4,00 | [D/HIGH AA-S65] |
| AA | Bulby (Legendary, Cap 1) | 3,07–3,98 | 3,00–6,25 | [D/HIGH AA-S65] |
| AA | Weather Girl (Mythic, Cap 3) | 3,33–7,58 | 3,33–12,00 | [D/HIGH AA-S65] |
| ASTD | Jeff (CEO), Level 175 | 1,31–3,46 (Stufe 0: 2,56) | nicht berechnet | [D/HIGH ASTD-S13] |
| UTDZ | Bulmo (Legendary, Cap 1) | 3,9 bei Max (40 500 / 10 500) | 0,5–6,7 | [D UTDZ-S14] |
| BTD6 | Banana Farm 0-0-0 / 3-0-0 / 4-0-0 / 5-0-0 | 15,6 / 16,7 / 16,2 / 23,2 Runden | – | [D/MEDIUM BTD-S13,S14] |
| BTD6 | Marketplace / Central Market / Monkey Wall Street | 14,4 / 17,5 / 22,4 Runden | – | [D/MEDIUM BTD-S13,S14] |
| AE | Ramen Guy Max-Ertrag/Kosten 11 500/40 000; Stone Alchemist 3 500/8 350 | 3,5 bzw. 2,4 nur falls „Farm-Wert = je Wave“ (Einheit UNKNOWN) | UNKNOWN | [D/LOW AE-S7] |

## 5. SPA-Spannen (Sekunden pro Angriff)

| Spiel | Spanne | Einheiten/Beleg |
|---|---|---|
| AA | Stufe 0 (Median, P25–P75): Rare 4 (4–5), Epic 5 (4–5), Legendary 7 (6–8), Mythic 7 (7–8); Max-Stufe Rare 4, Epic 4, Legendary 6, Mythic 7; SPA sinkt durch Upgrades um höchstens 20 % | [D/HIGH AA-S65] |
| BTD6 | 0,045 (Super Monkey) bis 2,4 (Ice Monkey); Dart 0,95 | [O/HIGH BTD-S15] |
| ASTD | Alien Soldier 2 → 1,6; Evil Shade (Final) 4 bis 10,2 | [O/HIGH ASTD-S20,S23] |
| AV | Rare 5–6 (Top Chef 6 → 3); Mythic unevolviert Median 6,5 (4–9); Secret Median 7 (3–12) | [O/HIGH AV-S3; D/HIGH] |
| ALS | 6 bis 19 | [O/HIGH ALS-S7,S8] |
| UTDZ | Roku 5; Legendary 6–10 → 3,5–6; Sasku 7 → 6 | [O/HIGH UTDZ-S5,S14,S4] |
| AE | max. Stufe: Rare 2,3–3,3; Epic 2,3–4,5; Legendary 4,5–6,5; Mythic 5–9,2; Secret 4–8,4 | [D/HIGH AE-S7] |

## 6. Range-Spannen

Einheiten sind je Spiel verschieden (AA, AV, ALS, UTDZ, AE „Studs“ bzw. Spieleinheiten, BTD6 Spieleinheiten; ASTD ohne einheitliche Einheit). Die Zahlen sind **nicht** zwischen Spielen vergleichbar; verglichen werden dürfen nur Wachstumsfaktoren innerhalb eines Spiels.

| Spiel | Stufe 0 | Max-Stufe | Faktor | Einheit/Quelle |
|---|---|---|---|---|
| AA | Rare 10 (6–15), Epic 15 (10–15), Legendary 15 (12–15), Mythic 20 (17–22) | Rare 15, Epic 22, Legendary 24, Mythic 30 | ×1,33 (Rare) bis ×1,73 (Exclusive) | Studs [D/HIGH AA-S65] |
| BTD6 | Dart 32, Boomerang 43, Bomb 40, Tack 23, Ice 20, Glue 46, Desperado 60, Wizard 40, Super 50, Ninja 40, Village 40; Sniper, Mortar, Dartling unendlich | UNKNOWN (je Upgrade) | – | Spieleinheiten [O/HIGH BTD-S15] |
| ASTD | 8 (2★), 52–77 (Anti Hero), 70–130 (7★) | – | – | Einheit UNKNOWN [O/MEDIUM ASTD-S20,S4,S23] |
| AV | Rare 11,5–15, Mythic unevolviert Median 19 (15–23) | Rare 22–25, Mythic Median 24 (17–44) | Rare ca. ×1,7–1,9; Mythic Median ×1,3 | Studs [D AV-S3] |
| ALS | Ruru 20, Aura Farmer 30, Boku 30 | 42 / 46 / 60 | ×1,5–2,1 | Einheit UNKNOWN [O/HIGH ALS-S7–S9] |
| UTDZ | Rare 15–17; Legendary 12–22; Mythic 15 | Legendary 25–35; Mythic 21 | ca. ×1,1 (Roku) bis ×1,8 (Greybeard) | Einheit UNKNOWN [D UTDZ-S5,S14,S4] |
| AE | Rare, Epic, Legendary, Mythic: max. Range 7–14 / 14–21 / 12–25 / 21–28 | – | – | Einheit UNKNOWN [D/HIGH AE-S7] |

## 7. Placement-Caps

| Spiel | Verteilung / Beispiele | Quelle |
|---|---|---|
| AA | 534 Units: Cap 4 (219), 3 (193), 5 (82), 6 (20), 1 (15), 2 (5); Rare-Modalwert 6, Epic 5, Legendary 5, Mythic 4, Secret 3; Gesamtlimit UNKNOWN | [D/HIGH AA-S65] |
| BTD6 | kein Typ-Limit; Held 1; Paragon 1 je Spiel | [O/MEDIUM BTD-S9,S2,S14] |
| ASTD | normale Units UNKNOWN; Jeff, Idol, Evil Shade 1; Infinite je Spieler 24 (Quad) / 32 (Trio) / 44 (Duo) / 88 (Solo) | [O/HIGH ASTD-S13,S21,S23; O/LOW ASTD-S11] |
| AV | 1–6: Rare 5–6, Legendary 4, Mythic/Exclusive meist 3 (1–5), Secret meist 3 (1–4); Monarch-Trait 1 | [O/HIGH AV-S3,S8] |
| ALS | Ruru 3, Aura Farmer 1, Boku 1; Overlord/Avatar/Glitched 1 | [O/HIGH ALS-S7–S9,S4] |
| UTDZ | Roku 5, Gen 4, Pebble 4, Greybeard 3, Ruka 3, Admiral 3, Zorus 2, Sasku 2, Bulmo 1 | [O/HIGH UTDZ-S5,S14,S4,S7] |
| AE | Rare 4, Epic 3–4, Legendary 3–4, Mythic 2–3, Flame Emperor 5, Farm 1 bzw. 3, Toy Maker 1; Expedition gesamt 14 | [O/HIGH AE-S7,S13] |

## 8. Verkaufswert

| Spiel | Wert | Quelle |
|---|---|---|
| BTD6 | 70 % der Gesamtausgaben, Rundung nach der Multiplikation aufwärts; +5 % MK, +4 % je Favored-Trades-Buccaneer (3×), Cap 95 % | [O/HIGH BTD-S9] |
| AA | 25 % von Platzierung + bezahlten Upgrades (508 von 528 Seiten; C.E.O.-Seite 30 %, vermutlich Fehler); 9 Units unverkäuflich | [O/CONFIRMED AA-S72; O/HIGH AA-S65] |
| ASTD | 50 %; Jeff, Idol, Evil Shade unverkäuflich | [O/HIGH ASTD-S20,S24] |
| AV | UNKNOWN; Skill „Rebate“ +40 % des Verkaufswerts | [O/LOW AV-S18] |
| ALS | 50 % der Gesamtkosten | [O/HIGH ALS-S7–S9] |
| UTDZ | UNKNOWN | [U UTDZ:economy] |
| AE | Ramen Guy 10 %; Standard UNKNOWN | [O/HIGH AE-S7] |

## 9. HP-Skalierung

### 9.1 Formeln und Struktur nebeneinander

| Spiel | HP-Modell | Quelle |
|---|---|---|
| BTD6 | Layer-HP fest (Rot–Pink 1, Keramik 10, MOAB 200, BFB 700, ZOMG 4 000, DDT 400, BAD 20 000); ab R81 Blimp-HP × `x` (Tabelle 9.2), Speed × `v` | [O/HIGH BTD-S5,S4] |
| AA | Formel UNKNOWN; „each wave progressively harder“; Basis-HP skaliert seit Update 9 | [O/HIGH AA-S72 (qualitativ); U] |
| ASTD | Formel UNKNOWN; Extreme ×10 HP und ca. ×2 Speed, Belohnung ×3; Raid-Boss (19 Waves) 10 Mrd. HP; Gauntlet 200 Mio.–über 1 Mrd. | [O/MEDIUM ASTD-S25,S11,S9; O/HIGH ASTD-S19] |
| AV | `HealthMultiplier` relativ zu unbekannter Basis: normal 1–12, Boss 7–60 (je Stage 15–60); Faustregel Boss ≈ 5–20 × Standardgegner derselben Stage; Formel über Waves UNKNOWN | [O/HIGH AV-S5; D/HIGH] |
| ALS | Formel UNKNOWN; nur Modifier (siehe 9.3) | [O/MEDIUM ALS-S2; O/HIGH ALS-S14] |
| UTDZ | UNKNOWN; Rusher 2 × HP | [U; O/HIGH UTDZ-S9] |
| AE | UNKNOWN; abhängig von Modus, Act, Map, Schwierigkeit, Spielerzahl, Wave | [O/HIGH AE-S8] |

### 9.2 BTD6-Freeplay-Rampe (Blimp-HP-Faktor x und Speed-Faktor v)

x gilt für die Hülle jedes Blimps; Quelle [O/HIGH BTD-S4], Werte aus `rounds.json` bestätigt für R81, R100, R101, R124, R125, R140 [D].

| Runden | Zuwachs von x je Runde | x Anfang → Ende |
|---|---|---|
| 1–80 | – | 1,0 |
| 81–100 | +0,02 | 1,02 → 1,4 |
| 101–124 | +0,05 | 1,45 → 2,6 |
| 125–150 | +0,15 | 2,75 → 6,5 |
| 151–250 | +0,35 | 6,85 → 41,5 |
| 251–300 | +1,0 | 42,5 → 91,5 |
| 301–400 | +1,5 | 93 → 241,5 |
| 401–500 | +2,5 | 244 → 491,5 |
| 501+ | +5,0 | 496,5 → `5N − 2008,5` |

Speed-Faktor `v`: R≤80: 1; R81–100: `1 + 0,02·(R−80)`; R101–150: `1,6 + 0,02·(R−101)`; R151–200: `3,0 + 0,02·(R−151)`; R201–251: `4,5 + 0,02·(R−201)`; ab R252: `6,0 + 0,02·(R−252)` [O/HIGH BTD-S4]. Beispiele: R100 BAD 28 000 HP (20 000 × 1,4) [D]; R140 Fortified BAD 200 000 HP; R200 Fortified BAD 960 000 HP [O/HIGH BTD-S4]. Wachstum je Runde am Anfang → Ende der Brackets: 2,0 → 1,4 % (R81–100), 3,4 → 1,9 % (R101–124), 5,5 → 2,3 % (R125–150), 5,1 → 0,8 % (R151–250) [D: Zuwachs / x]. Status-Resistenz im Freeplay: Stun/Sabotage/Snowstorm/Knockback −10 % (R150–199) bis −50 % (R350+) [O/HIGH BTD-S4]. Zufallsrunden ab R141: RBE-Budget `4000·R − 217 000` [O/MEDIUM BTD-S4].

BTD6-Besonderheiten: Easy-MOAB in R40 nur ⅔ HP [O/HIGH BTD-S2]; Fortified verdoppelt Blimp-HP (Blei 1 → 4, Keramik 10 → 20) [O/HIGH BTD-S6]; Super-Keramik (R81+) 60 HP mit einem Kind statt zwei, gleicher Cash, geringere Entity-Zahl [O/HIGH BTD-S7]; „Double HP MOABs“ ×2 [O/HIGH BTD-S10].

### 9.3 Modifier der anderen Spiele

| Spiel | Modifier | Quelle |
|---|---|---|
| AV | Strong Enemies +100 % HP je Karte; Fast +20 Speed je Karte; Shielded +3 Schilde; Regen +0,2 %/s; Dodge +4 %; Revitalize +7,5 % Heilung bei Tod; Champions: Mini-Boss alle 6 Waves; Money Surge +40 % / King's Burden −40 % Yen | [O/HIGH AV-S6] |
| ALS | Powerless +15 % HP; Bankrupt −20 % Cash +15 % HP; Sluggish +15 % HP +20 % SPA; Weakness +15 % HP −25 % Schaden; True Boss Fight +300 % Boss-HP; No One Leaves Alive +200 % HP +35 % Speed; Return by Death +500 % HP +100 % Speed | [O/HIGH ALS-S14] |
| AA | Challenge Tank HP ×1,25 und Schaden ×0,75; Fast Speed ×1,5; Regen 1 % maxHP/s; Steel-Plated HP ×3 + 20 Schilde; High Cost ×1,5, Triple Cost ×3 | [O/MEDIUM AA-S73,S72; O/HIGH AA-S72] |
| AE | Sprinter +45 % Speed −20 % HP; Tank −20 % Speed +20 % HP; Regen I–IV 1/3/5/8 % maxHP/s; Splitter 3 Kinder je 33 % HP; Commander +20 % HP/Speed (Radius 5); Momentum +2 %/s (Cap +50 %); Speedy +50 %; Short Range −25 % Range; Upgrade Cap 25; Standard-Speed aller Gegner 2,4 | [O/HIGH AE-S5,S8] |
| UTDZ | Rusher: HP ×2, Speed 0,5 → 2,0 (+0,1 je s, ca. 15 s) [D: (2,0−0,5)/0,1]; Difficulty-Meter 75–1 000 % bei Drop-Multiplikator ×1–×6 (Wirkung auf HP UNKNOWN) | [O/HIGH UTDZ-S9,S12] |
| ASTD | Extreme ×10 HP, ca. ×2 Speed, Belohnung ×3 | [O/MEDIUM ASTD-S25,S11] |

### 9.4 Leben und Leak

| Spiel | Wert | Quelle |
|---|---|---|
| BTD6 | Easy 200, Medium 150, Hard 100, Impoppable/CHIMPS 1; Leak kostet den RBE des Bloons (Keramik 104, Super-Keramik 65, DDT 660 bzw. 1 100): ein Keramik-Leak beendet Hard | [O/HIGH BTD-S10,S11,S12,S7] |
| AA | Base-HP und Leak-Schaden UNKNOWN; Healer 3–5 % Base-HP je Wave (vor Update 9: 25 HP) | [U; O/HIGH AA-S72] |
| AE | Expedition-Payload 1 000 HP; Normalmodus „Stocks“, Anzahl UNKNOWN | [O/HIGH AE-S13; O/MEDIUM AE-S3] |
| übrige | UNKNOWN | [U] |

### 9.5 Wave-Zahlen und -Takt

| Spiel | Waves je Stage / Modus | Takt | Quelle |
|---|---|---|---|
| AA | Raids 20; Dungeon-Boss Wave 15 bzw. 20; Events 50 (ca. 40 min) bzw. 30 (ca. 25 min) → 48 s bzw. 50 s je Wave [D: 40/50, 25/30]; Infinite endlos | Wave-Timer existiert, Dauer UNKNOWN | [O/HIGH AA-S72; O/MEDIUM AA-S73] |
| BTD6 | 40 / 60 / 80 / 100 je Schwierigkeit | UNKNOWN | [O/HIGH BTD-S4,S10,S11,S2] |
| ASTD | Story 15, Trials 15/16/19, Raids 15/19, Zones 5 | – | [O/MEDIUM ASTD-S14,S15,S9; O/HIGH ASTD-S27,S22] |
| AV | Raids/Portals/Elemental-Tower-Floor 20, Dungeons 30, Paragon (entfernt) 15; Story-Act UNKNOWN | ein Gegner alle 0,2 s mit max. Warteschlange | [O/HIGH AV-S12,S18; O/MEDIUM AV-S20] |
| ALS | Raids 20, Siege 50; Survival 12 min | – | [O/HIGH ALS-S13,S15,S14] |
| UTDZ | Story ca. 15 (LOW), Blitz Rush 7 | – | [O/LOW UTDZ-S18] |
| AE | Infinite: Belohnung alle 5 Waves; Story-Waves UNKNOWN | – | [O/HIGH AE-S3] |

## 10. Gacha-Raten und Pity

Erwartungswert [D]: Mit Pity `N` (Garantie beim N-ten Pull) und Einzelchance `p`, `q = 1 − p`: `E = (1 − q^N) / p`. Ohne Pity `E₀ = 1/p`. Die Wahrscheinlichkeit, das Pity zu erreichen, ist `q^(N−1)`. Näherung für kleines p: `E / E₀ ≈ 1 − e^(−c)` mit `c = N·p` (Pity in Vielfachen des Erwartungswerts). Rechenprobe gegen AA: p = 0,25 %, N = 400: `E = (1 − 0,9975^400)/0,0025 = 253,0` entspricht dem AA-Wert 253,0 [D/HIGH AA-S72]; AA-RR-Center (p = 0,5 %, Featured-Anteil f = 0,5, N = 400): `L = (1 − q^N)/p = 173,1`, `s = f·(1 − q^(N−1)) + q^(N−1) = 0,568`, `E = L/s = 304,9` [D/HIGH AA-S72, nachgerechnet].

Alle Zeilen mit „Pity N“ sind als Pull-Garantie gelesen; Quellenkonflikte stehen in der letzten Spalte.

| Spiel / Banner | Rarity | p | Pity N | c = N·p | E₀ | E mit Pity | P(Pity erreicht) | Quelle |
|---|---|---:|---:|---:|---:|---:|---:|---|
| AA Standard | Mythic (irgendein) | 0,25 % | 400 | 1,00 | 400 | 253,0 | 36,8 % | [D/HIGH AA-S72] |
| AA Special (LEGACY/RR) | Mythic (irgendein) | 0,5 % | 400 | 2,00 | 200 | 173,1 | 13,5 % | [D AA-S72] |
| AA RR Special | Center-Featured | 0,5 % × f 0,5 | 400 | – | 400 | 304,9 | 13,5 % | [D/HIGH AA-S72] |
| AA Legendary | Legendary | 2 % | 50 | 1,00 | 50 | 31,8 | 37,2 % | [D/HIGH AA-S72] |
| AA Secret | Secret | 1 : 400 000 | kein Pity belegt | – | 400 000 | – | – | [O/MEDIUM AA-S72] |
| ASTD X/Y | 5★ | 2 % | 80 | 1,60 | 50 | 40,1 | 20,3 % | [D ASTD-S10] |
| ASTD Z | 6★ | 1 % | 140 (oder 120, Widerspruch) | 1,40 (1,20) | 100 | 75,5 (70,1) | 24,7 % (30,2 %) | [D ASTD-S10] |
| AV | Legendary | 4 % | 50 | 2,00 | 25 | 21,8 | 13,5 % | [D AV-S9] |
| AV | Mythic/Exclusive | 0,5 % | 400 | 2,00 | 200 | 173,1 | 13,5 % | [D AV-S9] |
| AV | Vanguard-Unit (Special) | 0,005 % | 25 000 | 1,25 | 20 000 | 14 270 | 28,6 % | [D AV-S9] |
| AV | Secret | 0,004 % | UNKNOWN | – | 25 000 | – | – | [O/HIGH AV-S9] |
| ALS Banner 1 | Legendary | 2 % | 60 | 1,20 | 50 | 35,1 | 30,4 % | [D/MEDIUM ALS-S6] |
| ALS Banner 1 | Mythic (2 Slots × 0,5 %, gelesen als 1,0 %) | 1,0 % | 250 | 2,50 | 100 | 91,9 | 8,2 % | [D/LOW ALS-S6] |
| ALS Banner 2 | Celestial | 0,5 % | 250 | 1,25 | 200 | 142,9 | 28,7 % | [D/MEDIUM ALS-S6] |
| ALS Banner 2 | Mythic (2 × 2 %, gelesen als 4 %) | 4 % | 100 | 4,00 | 25 | 24,6 | 1,8 % | [D/LOW ALS-S6] |
| UTDZ Standard | Mythic | 0,25 % | UNKNOWN | – | 400 | – | – | [O/HIGH UTDZ-S11] |
| UTDZ Festival | Mythic | 0,5 % | 400 | 2,00 | 200 | 173,1 | 13,5 % | [D UTDZ-S11] |
| UTDZ Festival | Unrivaled | 0,05 % | 1 500 | 0,75 | 2 000 | 1 055 | 47,3 % | [D UTDZ-S11] |
| UTDZ Festival | Universal | 0,005 % | 15 000 | 0,75 | 20 000 | 10 553 | 47,2 % | [D UTDZ-S11] |
| UTDZ Standard | Secret | 0,00625 % | 24 000 | 1,50 | 16 000 | 12 430 | 22,3 % | [D UTDZ-S11] |
| AE | Legendary | 10 % | 50 | 5,00 | 10 | 9,9 | 0,6 % | [D AE-S9] |
| AE | Mythic | 0,25 % | 400 | 1,00 | 400 | 253,0 | 36,8 % | [D AE-S9] |
| AE | Secret | 0,01 % | 10 000 | 1,00 | 10 000 | 6 321 | 36,8 % | [D AE-S9] |
| BTD6 | – | – | – | – | – | – | – | kein Gacha [O/MEDIUM BTD-S15] |
| **DESIGN** (unser Spiel) | Mythic | 1,0 % | 150 | 1,50 | 100 | 77,9 | 22,4 % | siehe [recommendations.md](recommendations.md) |
| **DESIGN** | Legendary | 4,0 % | 35 | 1,40 | 25 | 19,0 | 25,0 % | siehe [recommendations.md](recommendations.md) |

Kosten bis Top-Rarity mit Pity (50 Gems je Summon): AA Standard 253,0 × 50 = 12 652 Gems [D/HIGH AA-S72]; AA-RR-Center 304,9 × 50 = 15 244 Gems [D/HIGH AA-S72]; AV Mythic 173,1 × 50 = 8 655 Gems (VIP 40: 6 924) [D]; AE Mythic 253,0 × 50 = 12 650 [D]; UTDZ Secret 12 430 × 45 (10er für 450) = 559 350 Gems [D]. ASTD X/Y: Pity 80 Spins × 45 = 3 600 Gems [O/HIGH ASTD-S10]; ASTD Z 140 × 90 = 12 600 Gems [O/MEDIUM ASTD-S10]. AV-Vanguard-Pity 25 000 × 50 = 1 250 000 Gems [D/HIGH AV-S9]. Der Zufluss aus Spiel zum Vergleich: AA erster Clear einer Story-Welt (6 Acts) 1 380 Gems ≈ 27,6 Summons, Level-Milestones einmalig 10 000 Gems [D/HIGH AA-S72]; AV Story-Clear 80 Gems je Run; AE Normal-Act 75 Gems, Erstclear 300 [O/HIGH AV-S13, AE-S3].

Kennzahlen weiterer Mechanismen: Featured-Anteil in der Mitte 50 % (AA Mythic-Anteil, AV, AE) mit Seiten je 10 % (AA), 20 % (AV) bzw. 25 % (AE); Banner-Rotation stündlich (AA, ASTD, AV, ALS), halbstündlich (AE) [O/HIGH AA-S72, AV-S9, AE-S9, ASTD-S10]. Shiny 1 % (AA, AE), 1,5 % (AV) [V/HIGH AA-S75; O/HIGH AE-S9, AV-S9]. Luck-Boost +25 % (AA, AE Luck Potion), AV Super/Ultra Lucky bis +62,5 % [O/MEDIUM AA-S73; O/HIGH AE-S9, AV-S9].

## 11. Trait-Raten

Pity-Vielfaches `c` und Erwartungswert mit Pity [D, gleiche Formel wie §10].

| Spiel | Top-Traits (Chance, Pity N, c, E mit Pity) | Effekt | Quelle |
|---|---|---|---|
| AV | Monarch 0,1 %, 1 500, 1,5, 777,0; Ethereal 0,175 %, 858, 1,5, 444,3; Deadeye 0,375 %, 400, 1,5, 207,3; Solar 0,5 %, 300, 1,5, 155,5; Blitz 1,85 %; Fortune 2,5 %; Marksman 6,5 %; Scholar 10 %; Vigor/Swift/Range 1–3 je 26 % | Monarch +300 % Schaden, Limit 1; Ethereal +20 % Schaden −20 % SPA | [O/HIGH AV-S8; D] |
| AA | Unique 0,1 %; Divine 0,2 %; Golden 0,15 %; Celestial 0,36 %; Reaper 0,8 %; Godspeed 1 %; Sniper 2,5 %; Culling 5 %; Adept 9,99 %; Superior/Nimble/Range I–III 29,97/24,98/24,98 %; Pity UNKNOWN | Unique ×4 Schaden, max. 1 Platzierung | [O/HIGH AA-S72] |
| UTDZ | Ruler 0,1 %, 1 250, 1,25, 713,7; Fission 0,15 %, 833, 475,7; Eternal 0,2 %, 625, 356,9; Sacred 0,3 %, 416, 237,8; Astral 0,45 %, 277, 158,5; Wizard 0,5 %, 250, 142,9; Artificer 0,65 %, 192, 109,9; Duelist 0,8 %, 156, 89,3; Legendary-Traits 1,5–3 %; Fortunate 1 % | Ruler +200 % Schaden, Limit 1 | [O/HIGH UTDZ-S13; D] |
| AE | Unbound 0,1 %, 1 500, 1,5, 777,0; Primordial 0,2 %, 750, 388,6; Forsaken 0,3 %, 500, 259,1; Draconic 0,5 %, 300, 155,5; Legendary-Traits 2–6 %; Rare-Traits 7–14,64 %; Summe 100 % | Unbound +350 % Schaden, Single Placement | [O/HIGH AE-S10; D] |
| ALS | Glitched 0,03 %; Avatar 0,1 %; Overlord 0,2 %; Shinigami 0,2 %; Entrepreneur 0,3 %; All Seeing 0,35 %; Demi God/Cosmic 1 %; Raten summieren sich nicht auf 100 %; Pity UNKNOWN | Glitched +750 % Schaden, 1 Platzierung | [O/HIGH ALS-S4] |
| ASTD | keine Traits gefunden | – | [U ASTD:meta] |
| BTD6 | keine | – | [O/MEDIUM BTD-S15] |
| **DESIGN** | Einzigartig 1,0 %, 150, 1,5, 77,9 | siehe [recommendations.md](recommendations.md) | DESIGN |

Trait-Chance für Wurf bei Neuzug: AA 1 %, Doppel-Trait 1 % davon, beim Reroll 0,2 % [O/MEDIUM AA-S72]; AE 0,75 % [O/HIGH AE-S10]. Reroll-Kosten: AA 1 Star Remnant (Rare–Legendary) bzw. 5 (Mythic/Secret), Remnant 400 Gems im Merchant [O/HIGH AA-S72]; AE 1 Trait Crystal je Wurf [O/HIGH AE-S10]; AV 1 Reroll je Wurf, Challenges 1 je 30 min (max. 20 je Tag) [O/HIGH AV-S12,S9]; UTDZ Rerolls aus Raids/World Raid (Cap 65 je Tag) [O/HIGH UTDZ-S16,S11]; ALS 1 Reroll je Wurf, Zwei-Trait-System seit 2025-11-24 [O/HIGH ALS-S4].

## 12. Level- und XP-Kurven

| Spiel | Unit-Level | Wirkung | Spieler-Level | Quelle |
|---|---|---|---|---|
| AA | Cap 100 (RR 110 mit Limit Break); Anker L1 = 1, L100 = 9,204 × Damage; Kurve dazwischen UNKNOWN; implizit 9,204^(1/99) = 1,0227 je Level [D] | nur Schaden/DoT/Beschwörungs-HP | Gates: Level 5 (Banner-Tier 1), 20 (Tier 2), 40 (Trading); Milestones 500 Gems je 5 Level bis 100 (10 000 Gems); XP-Kurve UNKNOWN | [V/CONFIRMED AA-S04,S72; O/HIGH AA-S72] |
| BTD6 | Held 20 Level (XP je Level 180 bis 20 700) | Held-Upgrades | Level schaltet Tower frei (Dart L1 … Farm L22–26); Account-XP-Kurve UNKNOWN; Freeplay-XP 30 % bis R100, danach 10 % | [O/MEDIUM BTD-S14; O/HIGH BTD-S15,S4] |
| ASTD | bis 175 | skaliert Farm-Einkommen: Jeff Stufe 23 ×2,03 (Level 1 → 175) [D: 287 820/142 035] | Gates: PvP 15, Trials 25, Raids 50, Challenges 75, World 2 ab 100; Kurve UNKNOWN | [O/MEDIUM ASTD-S25,S13,S27] |
| AV | UNKNOWN; Schaden × 1,0235^Level (+2,353 % kumulativ) | Schaden | Gates: Level 10 (Secret-Units, Shiny), 30 (Elemental Towers), 50 (Trading); Kurve UNKNOWN | [O/MEDIUM AV-S7; O/HIGH AV-S9,S18,S16] |
| ALS | UNKNOWN | – | Kurve UNKNOWN; Player-EXP je Act 50/65/80 | [O/HIGH ALS-S11] |
| UTDZ | Cap 70 (100 mit Unrivaled-Mark); 72 393 XP bis Level 70; jedes Level 1 Stat-Punkt; Stat-Faktor 1,0045^Punkte | Stat-Punkte | Kurve UNKNOWN; Gate Level 10 | [O/HIGH UTDZ-S11] |
| AE | UNKNOWN; Unit-EXP je Clear 500 (Normal), 1 000 (Hard) | UNKNOWN | Milestones alle 5 Level: Gems 350 + 120·(L−5)/5 [D linear]; Kurve UNKNOWN; Expedition ab Level 20 | [O/HIGH AE-S3,S12,S13] |

## 13. Weitere Eckdaten

- **CC-Dauer und Sperre:** AA Stun ca. 2 s + 10–14 s Immunität, Slow 2,5–4 s + 4–7 s Sperre, Knockback 30–31 s Sperre [O/HIGH AA-S72,S67]; AV Hard CC 2 (Repulse/Stun/Freeze/Frostburn/Petrified) 6 s Sperre, Hard CC 1 (Time Stop/Confusion) 20 s, Repulse zusätzlich 25 s [O/HIGH AV-S11]; AE Stun/Freeze 2 s mit 5 s Sperre [O/HIGH AE-S6]; BTD6 Freeze 1,5 s [O/HIGH BTD-S15]; ASTD Stun 2 s, Freeze 3 s, Timestop bis 10 s + 10 s Immunität [O/HIGH ASTD-S26].
- **Buff-Caps:** AA Loop bei +100 % [O/HIGH AA-S72]; ASTD Idol 250 % [O/HIGH ASTD-S21]; AV Leader of the Force Cap 20 %, Tied by Desire 50 %, Gilgamesh 35 % [O/HIGH AV-S3]; UTDZ Eternal +60 % Schaden/+30 % Range [O/HIGH UTDZ-S13]; BTD6, ALS (Billionen), AE UNKNOWN bzw. nicht relevant.
- **Element-Multiplikatoren:** UTDZ ×1,5 / ×0,5 [O/HIGH UTDZ-S11]; AE Stage-Effekte ×1,5 / ×0,5 [O/HIGH AE-S3]; AV ×3 / −80 % (Elemental Towers) [O/HIGH AV-S18]; ASTD ×3 / ×0,25 oder ⅓ [O/MEDIUM ASTD-S9,S26].
- **Armored/Reinforced:** AA ×0,5 gegen Full-AoE [O/HIGH AA-S72]; ALS Reinforced −50 % Full-AoE, Resistant −50 % DoT, Flawless −50 % Crit [O/HIGH ALS-S3]; AE Armored −33 % Full-AoE, Reinforced −30 % allem [O/HIGH AE-S5].
- **Schild/Regen:** AV Overshield-Feld 25/50/100 (Bedeutung UNKNOWN); AE Shield 10, Regen 1–8 %/s; AA Regen 1 %/s [O/MEDIUM AV-S5; O/HIGH AE-S5; O/MEDIUM AA-S73].
- **Spieler- und Servergröße:** BTD6 Koop 4; ASTD Story bis 4, Raids bis 8, Server 38; AV Gruppe 4, Rifts 6, Server 24; AE Matches bis 4, Server 24; UTDZ World Raid 12, Server 12; AA Secret Portal 6, Server 30 [V/CONFIRMED BTD-S1, ASTD-S1, AV-S1, AE-S1, UTDZ-S1, AA-S74; O/MEDIUM ASTD-S25,S22,S11, AV-S18,S12; O/HIGH AE-S14, AA-S72].
