# ASTD: Ökonomie (Priorität)

Format: `Wert [Herkunft/Sicherheit Quelle]`. Quellen in [sources.md](sources.md). Gegner-Seite: [enemies-waves.md](enemies-waves.md). Rohdaten: [data/economy.json](data/economy.json).

## 1. In-Match-Währung

Es gibt nur eine Match-Währung: **Cash**. Sie dient zum Platzieren und Upgraden; Cash fließt "at the end of a wave, after an enemy is killed, or at the beginning of a wave from money-giving units" [O/HIGH ASTD-S7]. Gems/Gold/Stardust gibt es nur außerhalb des Matches (siehe [meta.md](meta.md)).

## 2. Startgeld

| Modus | Startgeld | Tag |
|---|---|---|
| Story, Infinite, Raids, Trials (normal) | UNKNOWN (kein Wiki-Wert; Guide nennt nur, dass Farms vor Welle 1 gesetzt werden) | U/UNKNOWN |
| Zone-Raids (5 Wellen, Kategorie-Units, Farms/Buff-Units verboten) | 2 300 000 | O/HIGH ASTD-S22, ASTD-S9 |
| Gauntlet | 18 000 000 | O/HIGH ASTD-S19, ASTD-S9 |
| Infinite Training | 1 000 000 000 | O/HIGH ASTD-S11 |
| Infinite "Random Unit" | Einsatzkosten 500, Verkauf 250 je gelostem Unit | O/HIGH ASTD-S11 |
| Schwierigkeit | Extreme: Gegner x10 HP, ca. x2 Speed, Belohnung x3; Startgeld-Änderung UNKNOWN | O/MEDIUM ASTD-S25, ASTD-S11 |

## 3. Einkommen

| Quelle | Wert | Tag |
|---|---|---|
| Kill-Geld | existiert, Betrag UNKNOWN. Guide: Farm-Units nahe dem Spawn bringen "mehr Geld aus Kills" | O/LOW ASTD-S9 |
| Wellenende-Geld | existiert, Betrag UNKNOWN | O/LOW ASTD-S7 |
| Passives Einkommen | keines außer Farm-Units | O/MEDIUM ASTD-S7 |
| Farm-Units | siehe Abschnitt 4. Wiki: "8 cash-giving units" (veraltet); Effects-Liste zeigt 20+ Income-Units, 1 Bank, mehrere Heal | O/MEDIUM ASTD-S7, ASTD-S6 |
| Leader-Geldbonus | 5 bis 20 % mehr Geld von Ökonomie-Units je nach Leader-Slot-Unit (Beispiele: Akasa TS 15 %, Humble-Swordman Awoken 20 %, Wrathdioas 20 %) | O/HIGH ASTD-S16 |
| Spielerzahl | Geld je Spieler, nicht geteilt; Cash-Cap UNKNOWN | R/LOW: Begründung: Guide beschreibt Verkauf/Upgrade je Spieler, Raid-Teams bringen eigene Farms |

## 4. Farm-Units (Speedwagon-Pendant: Jeff (CEO))

Jeff (CEO) ist die Vorlage für das Roblox-Pendant des Speedwagon aus JoJo (6 Sterne, Banner Z, 1 %, Limit 1, unverkäuflich) [O/HIGH ASTD-S13]. Einsatzkosten 500, 23 Upgrades, Gesamtkosten 996 870 [O/HIGH ASTD-S13].

Spalten: Einkommen je Welle bei Unit-Level 1 und bei Unit-Level 175 (Account-Unit-Level; Zuordnung von "Low" und "Max" zu Level 1/175 ist rekonstruiert: der Preisteil der Seite nennt "Money per wave at level 175" und stimmt mit der Max-Spalte überein) [R/MEDIUM ASTD-S13]. Amortisation = kumulierte Kosten / Einkommen Level 175 (Wiki-Spalte "Profit after x waves", von mir nachgerechnet, Abweichungen sind Rundung) [D/HIGH ASTD-S13].

| Upg | Kosten der Stufe | kumuliert | Cash/Welle Lvl 1 | Cash/Welle Lvl 175 | Waves bis Amortisation |
|---|---|---|---|---|---|
| 0 | 500 | 500 | 195 | 195 | 2,56 |
| 1 | 500 | 1 000 | 395 | 601 | 1,66 |
| 2 | 500 | 1 500 | 595 | 1 007 | 1,49 |
| 3 | 500 | 2 000 | 795 | 1 413 | 1,42 |
| 4 | 320 | 2 320 | 945 | 1 717 | 1,35 |
| 5 | 750 | 3 070 | 1 150 | 2 133 | 1,44 |
| 6 | 1 550 | 4 620 | 1 750 | 3 550 (Preisliste: 3 350, Widerspruch) | 1,38 |
| 7 | 1 750 | 6 370 | 2 405 | 4 678 | 1,36 |
| 8 | 2 200 | 8 570 | 3 305 | 6 503 | 1,32 |
| 9 | 3 100 | 11 670 | 4 505 | 8 936 | 1,31 |
| 10 | 5 500 | 17 170 | 6 340 | 12 657 | 1,36 |
| 11 | 6 400 | 23 570 | 7 890 | 15 800 | 1,49 |
| 12 | 8 800 | 32 370 | 9 515 | 19 095 | 1,70 |
| 13 | 12 000 | 44 370 | 11 465 | 23 049 | 1,92 |
| 14 | 13 500 | 57 870 | 15 105 | 30 430 | 1,90 |
| 15 | 25 000 | 82 870 | 23 005 | 46 450 | 1,78 |
| 16 | 45 000 | 127 870 | 30 955 | 62 571 | 2,04 |
| 17 | 69 000 | 196 870 | 39 905 | 80 720 | 2,44 |
| 18 | 90 000 | 286 870 | 52 535 | 106 331 | 2,70 |
| 19 | 100 000 | 386 870 | 64 535 | 130 665 | 2,96 |
| 20 | 120 000 | 506 870 | 82 035 | 166 152 | 3,05 |
| 21 | 135 000 | 641 870 | 101 535 | 205 694 | 3,12 |
| 22 | 155 000 | 796 870 | 121 535 | 246 250 | 3,23 |
| 23 | 200 000 | 996 870 | 142 035 | 287 820 | 3,46 |

Alle Werte [O/HIGH ASTD-S13]. Lesart: Die Stufen 0 bis 9 zahlen sich in unter 2 Wellen zurück (auf Level 175), die Endstufen brauchen 3 bis 3,5 Wellen. Das Level-Skalierungsverhältnis liegt bei 1,0 (Stufe 0) bis 2,03 (Stufe 23) [D: 287 820 / 142 035 = 2,03].

### Weitere Farm-Units

| Unit | Rarity | Einsatz | Upgrades | Gesamtkosten | Cash/Welle (Upg 0 bis max, Lvl 175) | Besonderheit | Tag |
|---|---|---|---|---|---|---|---|
| Sword (Maid) | 4 Sterne | 375 | 5 | 5 950 | 100 / 303 / 709 / 1 520 / 2 331 / 3 345 | verkaufbar für 50 % | O/HIGH ASTD-S24 |
| Idol | 6 Sterne | 500 | 17 | 5 278 800 (Stufe 17 allein 4 800 000) | 160 bis 130 691 (Stufe 16) | zugleich Buffer (bis 250 %), unverkäuflich, Limit 1 | O/HIGH ASTD-S21 |
| Jeff (CEO) | 6 Sterne | 500 | 23 | 996 870 | 195 bis 287 820 | Leader-Bonus Spirit Warriors | O/HIGH ASTD-S13 |
| Killer S+ | 6 Sterne | UNKNOWN | UNKNOWN | UNKNOWN | 200 000 je 400 s, per Wunsch (alternativ Heilung) | Gauntlet-Standard | O/MEDIUM ASTD-S9 |
| Octo the Greedy | 6 Sterne | UNKNOWN | 23 | UNKNOWN | Bank: speichert das Geld je Welle statt auszuzahlen | | O/MEDIUM ASTD-S6, ASTD-S13 |
| Pizza Girl, Salesman, Bellma (Money Corp), Lami (Wuno), Wish, Ramsay, The Fisherman | 4 bis 6 | UNKNOWN | UNKNOWN | UNKNOWN | Income-Units, Zahlen nicht abgerufen | | O/MEDIUM ASTD-S6 |

Rendite-Faustregel (D/MEDIUM): Eine Farm erreicht Break-even nach 1,3 bis 3,5 Wellen. Bei 15-Wellen-Stages lohnt sich Farmen bis etwa Welle 10 bis 12, danach Geld in DPS; bei 19 Wellen kann die Farm bis ca. Welle 14 voll ausgebaut werden [O/MEDIUM ASTD-S9].

Guide-Ablauf: Farm vor Welle 1 setzen, bis Welle 2 bis 3 farmen, dann Frühverteidigung; Farm stoppen zwischen Welle 10 und 12; "etwa 500k" für volles DPS-Potenzial in Story/Raid/Tower [O/MEDIUM ASTD-S9].

## 5. Verkaufswert

"Troops sell for half their cost of deployment plus upgrades" = 50 % der investierten Summe [O/HIGH ASTD-S20, ASTD-S24]. Ausnahmen: Jeff, Idol, Evil Shade (Final) sind unverkäuflich [O/HIGH ASTD-S13, ASTD-S21, ASTD-S23]. Im Random-Unit-Modus: Kauf 500, Verkauf 250 (ebenfalls 50 %) [O/HIGH ASTD-S11].

## 6. Kostenkurve der Upgrades (Beispiele)

| Unit | Rarity | Einsatz | Upgrades (Kosten je Stufe) | Gesamt | Schaden Stufe 0 -> max | Tag |
|---|---|---|---|---|---|---|
| Alien Soldier (billig) | 2 Sterne | 200 | 250, 500 | 950 | 9 -> 13 (SPA 2 -> 1,6) | O/HIGH ASTD-S20 |
| Sword (Maid) (mittel, Farm) | 4 Sterne | 375 | 325, 750, 1 300, 1 500, 1 700 | 5 950 | kein Angriff | O/HIGH ASTD-S24 |
| Anti Hero (Modul, alt) | 6 Sterne | 1 020 | 2 000, 4 000, 5 000, 7 050, 8 000 | 27 070 | 1 266 -> 14 500 | B/LOW ASTD-S4 (Modul ca. 2020, veraltet) |
| Jeff (CEO) (Top-Farm) | 6 Sterne | 500 | siehe Abschnitt 4 | 996 870 | | O/HIGH ASTD-S13 |
| Evil Shade (Final) (Top-DPS) | 7 Sterne | 400 | 3 600, 7 000, 15 000, 25 000, 59 000, 120 000, 250 000, 15 000 000 | 15 480 000 | 14 005 -> 20 730 000 (Stufe 8) | O/HIGH ASTD-S23 |
| Idol | 6 Sterne | 500 | 500, 800, 1 000, 2 000, 3 000, 5 000, 8 000, 12 000, 16 000, 25 000, 35 000, 50 000, 60 000, 70 000, 80 000, 110 000, 4 800 000 | 5 278 800 | Buff 5 % -> 250 % | O/HIGH ASTD-S21 |

Muster (D): Die Kosten wachsen je Stufe um 1,3 bis 2,5, bei Top-Units springt die letzte Stufe um das 60-Fache (250 000 -> 15 000 000 bei Evil Shade; 110 000 -> 4 800 000 bei Idol). Die Endstufe ist ein Cash-Sink für Gauntlet-Startgeld (18 Mio.) und späte Infinite-Wellen. Bei Evil Shade stehen die Kosten zum Schaden im Verhältnis 15 480 000 / 20 730 000 = 0,75 Cash je Schadenspunkt je Treffer (Nachrechnung) [D/MEDIUM].

Orbs verschieben die Kurve: Universal Reduction Orb senkt Gesamtkosten um 15 %, Ultra Magic Orb um 7 %, Cost Orb -100 und Prey Eye Orb -50 Einsatzkosten [O/HIGH ASTD-S17, ASTD-S9]. Beispiel Stampede (???%): Fähigkeitsstufe 4 154 000 Cash ohne und 3 863 220 mit Ultra Magic Orb [O/HIGH ASTD-S9; D: 4 154 000 x 0,93 = 3 863 220].
