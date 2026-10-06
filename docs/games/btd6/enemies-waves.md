# Gegner und Runden BTD6

Kennzeichnung `[Herkunft/Sicherheit Quelle]`; Quellen in [sources.md](sources.md). Maschinenlesbar: [data/rounds.json](data/rounds.json) (Runden 1–140 mit Zusammensetzung, RBE, Pop-Cash, Rundenbonus, HP-/Speed-Faktor). Spielregeln zu Geld: [economy.md](economy.md).

## 1. Bloon-Typen

HP je Layer, Speed relativ zu Rot = 1,0 (absolute Einheiten: UNKNOWN), Kinder, RBE und Pop-Cash. RBE = HP-Summe des Baums [O/HIGH BTD-S17]. Werte HP/Speed/Kinder: Community-Datendump [O/HIGH BTD-S5]; RBE/Cash gegengeprüft [D BTD-S3, BTD-S6, BTD-S7].

| Bloon | HP (Layer) | Speed | Kinder | RBE bis R80 | RBE ab R81 | Pop-Cash bis R80 / ab R81 | Eigenschaft |
|---|---:|---:|---|---:|---:|---|---|
| Rot | 1 | 1,0 | – | 1 | 1 | 1 | – |
| Blau | 1 | 1,4 | Rot | 2 | 2 | 2 | – |
| Grün | 1 | 1,8 | Blau | 3 | 3 | 3 | – |
| Gelb | 1 | 3,2 | Grün | 4 | 4 | 4 | – |
| Pink | 1 | 3,5 | Gelb | 5 | 5 | 5 | schnellster Standard-Bloon |
| Schwarz | 1 | 1,8 | 2 Pink | 11 | 6 | 11 / 6 | Explosions-immun |
| Weiß | 1 | 2,0 | 2 Pink | 11 | 6 | 11 / 6 | Kälte-immun |
| Lila | 1 | 3,0 | 2 Pink | 11 | 6 | 11 / 6 | Feuer/Energie-immun |
| Blei | 1 | 1,0 | 2 Schwarz | 23 | 7 | 23 / 7 | Sharp-immun |
| Zebra | 1 | 1,8 | Schwarz + Weiß | 23 | 7 | 23 / 7 | Schwarz + Weiß |
| Regenbogen | 1 | 2,2 | 2 Zebra | 47 | 8 | 47 / 8 | – |
| Keramik | 10 | 2,5 | 2 Regenbogen | 104 | 68 (Super-Keramik 60 HP) | 95 | mehrere Treffer |
| MOAB | 200 | 1,0 | 4 Keramik | 616 | 200x+272 | 381 | Blimp |
| BFB | 700 | 0,25 | 4 MOAB | 3164 | 1500x+1088 | 1525 | Blimp |
| ZOMG | 4000 | 0,18 | 4 BFB | 16656 | 10000x+4352 | 6101 | Blimp |
| DDT | 400 | 2,64 | 4 Camo-Regrow-Keramik | 816 | 400x+272 | 381 | Blimp, immer Camo, Lead+Black-Properties |
| BAD | 20000 | 0,18 | 2 ZOMG + 3 DDT | 55760 | 41200x+9520 | 13346 | Blimp |

x = Freeplay-HP-Faktor der Runde (Abschnitt 4). Immunitäten Schwarz/Lila und Blei: Datendump liefert nur die Properties „black“, „purple“, „lead“; die konkreten Schadensarten sind aus Spielwissen ergänzt [O/MEDIUM] (Weiß/Zebra/Blei-Einfrierimmunität: Ice-Beschreibung, O/HIGH BTD-S15). DDT-Speed entspricht 0,75 × Pink-Speed [D: 0,75 × 3,5 = 2,625; BTD-S16 nennt 75 %].

### Modifier

| Modifier | Wirkung | Quelle |
|---|---|---|
| Camo | nur von Tower mit Camo-Erkennung angreifbar; ändert HP/RBE nicht; erstes Mal R24 (Camo-Grün) | BTD-S2 [O/HIGH] |
| Regrow | Bloon regeneriert verlorene Layer; ändert RBE nicht; erstes Mal R17 (Regrow-Gelb); Regenerationsrate UNKNOWN | BTD-S2, BTD-S17 [O/HIGH] |
| Fortified | nur Blei, Keramik, Blimps: Blei 1 → 4 HP, Keramik 10 → 20 (ab R81: 60 → 120), Blimps ×2; bei Blimps auch die Keramik-Kinder; bei normalen Bloons nur die äußere Schicht; erstes Mal R45 (Fortified Blei), R46 (Fortified Keramik), R62 (Fortified MOAB) | BTD-S6, BTD-S2 [O/HIGH] |
| Super-Keramik (ab R81) | Keramik 60 HP, nur ein Kind pro Schicht („zwei Kinder“ werden zu einem); verbraucht weniger Leben (65) und kostet weniger Lag; gibt gleich viel Cash | BTD-S7 [O/HIGH] |
| Blimp-Immunitäten | Camo/Regrow nicht erwerbbar (außer DDT-Camo), Glue/Freeze nur mit Spezial-Upgrades, halbe Dauer | BTD-S16 [O/HIGH] |

Fortified-RBE: Blei 26 (R<81) bzw. 10, Keramik 114 bzw. 128, MOAB 856 bzw. 400x+512, BFB 4824 bzw. 3000x+2048, ZOMG 27296 bzw. 20000x+8192, DDT 800x+512 (ab R81), BAD 82400x+17920 [O/HIGH BTD-S6; D aus Baumrechnung]. Beispiel: Fortified BAD in R140 hat 200000 HP und 429920 RBE [O/HIGH BTD-S4; D: x=5 ergibt 82400×5+17920 = 429920].

Lebensverlust beim Durchlassen = RBE des Bloons (Keramik 104 Leben, Super-Keramik 65, Fortified Super-Keramik 75, DDT 660 bzw. 1100 Leben) [O/HIGH BTD-S7, BTD-S10]. Daher beendet in Hard (100 Leben) ein einzelnes Keramik-Leak das Spiel [O/HIGH BTD-S10].

### Geschwindigkeit je Schwierigkeit

Easy ist die Basis (1,0); Medium ca. +10 %, Hard +25 % gegenüber Easy (Hard ca. +13 % gegenüber Medium) [O/MEDIUM BTD-S10, BTD-S11; Medium = 1,1 ist abgeleitet D aus 1,25/1,136]. Impoppable/CHIMPS: UNKNOWN (nicht belegt).

## 2. Eigenschaften der Runden

- Runden sind für alle Spiele gleich (bis Runde 140 fest), Ausnahmen: Alternate Bloons Rounds und Apopalypse [O/HIGH BTD-S2].
- Erstauftritte [O/HIGH BTD-S2]: Blau R3, Grün R6, Gelb R11, Pink R15, Regrow R17, Schwarz R20, Weiß R22, Camo R24, Lila R25, Zebra R26, Blei R28, Regenbogen R35, Keramik R38, MOAB R40, Fortified R45/46, BFB R60, Fortified MOAB R62, Fortified BFB R79, ZOMG R80, DDT R90, Fortified ZOMG R97, Fortified DDT R99, BAD R100, mehrere BADs R119, Fortified BAD R140.
- Rundenbereiche: Easy bis 40, Medium bis 60, Hard bis 80, Impoppable/CHIMPS bis 100, Freeplay danach [O/HIGH BTD-S4].
- Spawn-Zeiten und Abstände je Gruppe: im Dump BTD-S21 vorhanden, hier nicht übernommen: UNKNOWN.

## 3. Boss-Waves

- Blimp-Debüts: R40 MOAB, R60 BFB, R80 ZOMG, R100 BAD, R119 3 BADs, R140 Fortified BAD plus BAD [O/HIGH BTD-S2].
- Dichte Blimp-Runden: R94 (25 BFB, 6 ZOMG), R96, R98 (höchste RBE der ersten 100: 327456 [D]), R99 (60 MOAB, 9 Fortified DDT), danach R131 (18 Fortified ZOMG, höchste RBE der ersten 140: 1461456 [D]) [O/HIGH BTD-S2].
- Keramik-Rushes: R63 (75 Blei, 122 Keramik), R76 (60 Regrow-Keramik), R78 (150 Regenbogen, 75 + 72 Camo-Keramik) [O/HIGH BTD-S2].
- Separate „Boss Bloon Events“ (Einzel-Bosse mit Minions, 5 Tiers, bis Runde 120, Game Over bei Erreichen von 140) sind ein eigener Modus [O/HIGH BTD-S4]; Boss-HP und Skills: UNKNOWN.

## 4. Freeplay-Skalierung

Ab Runde 81 gelten die „Freeplay-Regeln“: Keramik wird zu Super-Keramik, normale Bloons mit zwei Kindern haben nur eines, MOAB-Klassen wachsen an HP, alle Bloons werden schneller [O/HIGH BTD-S4].

### HP-Faktor x der MOAB-Klasse (gilt für Hülle jedes Blimps)

| Runden | Zuwachs je Runde | x am Anfang → Ende |
|---|---|---|
| 1–80 | – | 1,0 |
| 81–100 | +0,02 | 1,02 (R81) → 1,4 (R100) |
| 101–124 | +0,05 | 1,45 → 2,6 |
| 125–150 | +0,15 | 2,75 → 6,5 |
| 151–250 | +0,35 | 6,85 → 41,5 |
| 251–300 | +1,0 | 42,5 → 91,5 |
| 301–400 | +1,5 | 93 → 241,5 |
| 401–500 | +2,5 | 244 → 491,5 |
| 501+ | +5,0 | 496,5 → x = 5N − 2008,5 |

[O/HIGH BTD-S4; Zuwachs 0,15 und 0,35 seit v27 (vorher 0,20 und 0,50) BTD-S4 Version History]. Hinweis: Das Wiki merkt an, die Rampe für R164–500 sei seit v56 verändert (Gruppen geglättet), Formelwerte könnten leicht abweichen [O/MEDIUM BTD-S4]. Beispiele: R100 BAD 28000 HP; R140 Fortified BAD 200000 HP; R200 Fortified BAD 960000 HP und 1995520 RBE [O/HIGH BTD-S4].

### Geschwindigkeits-Faktor aller Bloons

```
if (r <= 80)       v = 1;
else if (r <= 100) v = 1   + (r - 80)  * 0.02;
else if (r <= 150) v = 1.6 + (r - 101) * 0.02;   // Sprung auf 1.6 bei R101
else if (r <= 200) v = 3.0 + (r - 151) * 0.02;   // Sprung auf 3.0 bei R151
else if (r <= 251) v = 4.5 + (r - 201) * 0.02;   // Sprung auf 4.5 bei R201
else               v = 6.0 + (r - 252) * 0.02;   // Sprung auf 6.0 bei R252
```
[O/HIGH BTD-S4; Speed-Cap seit v17 entfernt]. Pseudocode stammt aus dem Wiki.

### Weitere Regeln

| Aspekt | Regel | Quelle |
|---|---|---|
| Fixrunden | 1–140 (v25/v26 festgelegt), Sonderrunden 163 (Keramik/Blei-Rush, fortified), 200 (3 Fortified BADs), 263 (DDT-Rush); dazwischen Zufall | BTD-S2 [O/HIGH] |
| RBE-Budget Zufallsrunden | 141+: Runde×4000 − 217000; (alte Preset-Formel R101–140: 17,5×Runde²) | BTD-S4 [O/MEDIUM] |
| Gruppenkosten im Budget | BAD-Gruppe zuerst 50300 RBE, ab R171 teils 25000; Fortified BAD 92900, ab R201 teils 50000; ab R431 praktisch gratis | BTD-S4 [O/MEDIUM] |
| Garantien | BADs jede Zufallsrunde ab R231, Fortified BADs ab R251; ab R1758 sind alle Gruppen aktiv (96 MOAB, 64 F-MOAB, 49 BFB, 34 F-BFB, 40 ZOMG, 26 F-ZOMG, 56 DDT, 60 F-DDT, 41 BAD, 38 F-BAD) | BTD-S2, BTD-S4 [O/MEDIUM] |
| Rundenlimit | R10000 (200 Fortified BADs), R10001–10005 Testrunden, R536928+ keine Bloons, Zähler ist 32-Bit | BTD-S2 [O/HIGH] |
| Cash | Steuer fällt auf 5 % (R101), 4 % (R121), 2 % (R141+) | BTD-S3 [O/HIGH] |
| XP | in Freeplay nur 30 % (vor R100) bzw. 10 % (nach R100) der normalen Rate | BTD-S4 [O/HIGH] |
| Performance | Super-Keramik wurde als Lag-Reduktion eingeführt | BTD-S7 [O/HIGH] |

## 5. Komplette Rundenliste 1–100 (eine Stage-Reihe)

Legende: C = Camo, R = Regrow, F = Fortified (kombinierbar, z. B. CRF-Keramik). RBE: [D, Berechnung siehe [data/rounds.json](data/rounds.json) `_meta.rbeMethod`; Stichproben gegen Wiki-Angaben: R98 höchste RBE der ersten 100, R131 höchste der ersten 140, Fortified BAD R140 = 429920]. Pop-Cash = Cash für alle Pops nach Steuer, [O/HIGH BTD-S3, jeder der 100 Werte stimmt mit der Berechnung überein]. Bonus = 100 + Runde. Zusammensetzung [O/HIGH BTD-S2], R1–27 zusätzlich mit BTD-S21 gegengeprüft.

| Runde | Zusammensetzung | RBE | Pop-Cash | Bonus |
|---:|---|---:|---:|---:|
| 1 | 20× Rot | 20 | 20 | 101 |
| 2 | 35× Rot | 35 | 35 | 102 |
| 3 | 25× Rot, 5× Blau | 35 | 35 | 103 |
| 4 | 35× Rot, 18× Blau | 71 | 71 | 104 |
| 5 | 5× Rot, 27× Blau | 59 | 59 | 105 |
| 6 | 15× Rot, 15× Blau, 4× Grün | 57 | 57 | 106 |
| 7 | 20× Rot, 20× Blau, 5× Grün | 75 | 75 | 107 |
| 8 | 10× Rot, 20× Blau, 14× Grün | 92 | 92 | 108 |
| 9 | 30× Grün | 90 | 90 | 109 |
| 10 | 102× Blau | 204 | 204 | 110 |
| 11 | 10× Rot, 10× Blau, 12× Grün, 3× Gelb | 78 | 78 | 111 |
| 12 | 15× Blau, 10× Grün, 5× Gelb | 80 | 80 | 112 |
| 13 | 50× Blau, 23× Grün | 169 | 169 | 113 |
| 14 | 49× Rot, 15× Blau, 10× Grün, 9× Gelb | 145 | 145 | 114 |
| 15 | 20× Rot, 15× Blau, 12× Grün, 10× Gelb, 5× Pink | 151 | 151 | 115 |
| 16 | 40× Grün, 8× Gelb | 152 | 152 | 116 |
| 17 | 12× R-Gelb | 48 | 48 | 117 |
| 18 | 80× Grün | 240 | 240 | 118 |
| 19 | 10× Grün, 4× Gelb, 5× R-Gelb, 15× Pink | 141 | 141 | 119 |
| 20 | 6× Schwarz | 66 | 66 | 120 |
| 21 | 40× Gelb, 14× Pink | 230 | 230 | 121 |
| 22 | 16× Weiß | 176 | 176 | 122 |
| 23 | 7× Schwarz, 7× Weiß | 154 | 154 | 123 |
| 24 | 20× Blau, 1× C-Grün | 43 | 43 | 124 |
| 25 | 25× R-Gelb, 10× Lila | 210 | 210 | 125 |
| 26 | 23× Pink, 4× Zebra | 207 | 207 | 126 |
| 27 | 100× Rot, 60× Blau, 45× Grün, 45× Gelb | 535 | 535 | 127 |
| 28 | 6× Blei | 138 | 138 | 128 |
| 29 | 50× Gelb, 15× R-Gelb | 260 | 260 | 129 |
| 30 | 9× Blei | 207 | 207 | 130 |
| 31 | 8× Schwarz, 8× Weiß, 8× Zebra, 2× R-Zebra | 406 | 406 | 131 |
| 32 | 15× Schwarz, 20× Weiß, 10× Lila | 495 | 495 | 132 |
| 33 | 20× C-Rot, 13× C-Gelb | 72 | 72 | 133 |
| 34 | 160× Gelb, 6× Zebra | 778 | 778 | 134 |
| 35 | 35× Pink, 30× Schwarz, 25× Weiß, 5× Regenbogen | 1.015 | 1.015 | 135 |
| 36 | 140× Pink, 20× CR-Grün | 760 | 760 | 136 |
| 37 | 25× Schwarz, 25× Weiß, 7× C-Weiß, 10× Zebra, 15× Blei | 1.202 | 1.202 | 137 |
| 38 | 42× Pink, 17× Weiß, 10× Zebra, 14× Blei, 2× Keramik | 1.157 | 1.139 | 138 |
| 39 | 10× Schwarz, 10× Weiß, 20× Zebra, 18× Regenbogen, 2× R-Regenbogen | 1.620 | 1.620 | 139 |
| 40 | 1× MOAB | 616 | 381 | 140 |
| 41 | 60× Schwarz, 60× Zebra | 2.040 | 2.040 | 141 |
| 42 | 6× R-Regenbogen, 5× C-Regenbogen | 517 | 517 | 142 |
| 43 | 10× Regenbogen, 7× Keramik | 1.198 | 1.135 | 143 |
| 44 | 50× Zebra | 1.150 | 1.150 | 144 |
| 45 | 180× Pink, 10× C-Lila, 4× F-Blei, 25× Regenbogen | 2.289 | 2.277 | 145 |
| 46 | 6× F-Keramik | 684 | 570 | 146 |
| 47 | 70× C-Pink, 12× Keramik | 1.598 | 1.490 | 147 |
| 48 | 40× R-Pink, 30× CR-Lila, 40× Regenbogen, 3× F-Keramik | 2.752 | 2.695 | 148 |
| 49 | 343× Grün, 20× Zebra, 20× Regenbogen, 10× R-Regenbogen, 18× Keramik | 4.771 | 4.609 | 149 |
| 50 | 20× Rot, 8× F-Blei, 20× Keramik, 2× MOAB | 3.540 | 2.866 | 150 |
| 51 | 10× R-Regenbogen, 15× C-Keramik | 2.030 | 948 | 151 |
| 52 | 25× Regenbogen, 10× Keramik, 2× MOAB | 3.447 | 1.444 | 152 |
| 53 | 80× C-Pink, 3× MOAB | 2.248 | 772 | 153 |
| 54 | 35× Keramik, 2× MOAB | 4.872 | 2.044 | 154 |
| 55 | 45× Keramik, 1× MOAB | 5.296 | 2.328 | 155 |
| 56 | 40× C-Regenbogen, 1× MOAB | 2.496 | 1.130 | 156 |
| 57 | 40× Regenbogen, 4× MOAB | 4.344 | 1.702 | 157 |
| 58 | 15× Keramik, 10× F-Keramik, 5× MOAB | 5.780 | 2.140 | 158 |
| 59 | 50× C-Blei, 20× Keramik, 10× R-Keramik | 4.270 | 2.000 | 159 |
| 60 | 1× BFB | 3.164 | 762 | 160 |
| 61 | 150× R-Zebra, 5× MOAB | 6.530 | 1.071 | 161 |
| 62 | 250× Lila, 15× CR-Regenbogen, 5× MOAB, 2× F-MOAB | 8.247 | 1.224 | 162 |
| 63 | 75× Blei, 122× Keramik | 14.413 | 2.663 | 163 |
| 64 | 6× MOAB, 3× F-MOAB | 6.264 | 686 | 164 |
| 65 | 100× Zebra, 70× Regenbogen, 50× Keramik, 3× MOAB, 2× BFB | 18.966 | 2.907 | 165 |
| 66 | 8× MOAB, 3× F-MOAB | 7.496 | 838 | 166 |
| 67 | 13× CRF-Keramik, 8× MOAB | 6.410 | 857 | 167 |
| 68 | 4× MOAB, 1× BFB | 5.628 | 610 | 168 |
| 69 | 40× R-Schwarz, 40× F-Blei, 50× Keramik | 6.680 | 1.222 | 169 |
| 70 | 120× CR-Weiß, 200× Regenbogen, 4× MOAB | 13.184 | 2.449 | 170 |
| 71 | 30× Keramik, 10× MOAB | 9.280 | 1.332 | 171 |
| 72 | 38× R-Keramik, 2× BFB | 10.280 | 1.332 | 172 |
| 73 | 8× MOAB, 2× BFB | 11.256 | 1.220 | 173 |
| 74 | 50× Keramik, 60× F-Keramik, 25× CRF-Keramik, 1× BFB | 18.054 | 2.870 | 174 |
| 75 | 14× Blei, 14× F-Blei, 3× F-MOAB, 7× BFB | 25.402 | 2.492 | 175 |
| 76 | 60× R-Keramik | 6.240 | 1.140 | 176 |
| 77 | 11× MOAB, 5× BFB | 22.596 | 2.363 | 177 |
| 78 | 80× Lila, 150× Regenbogen, 75× Keramik, 72× C-Keramik, 1× BFB | 26.382 | 4.684 | 178 |
| 79 | 500× R-Regenbogen, 4× BFB, 2× F-BFB | 45.804 | 6.530 | 179 |
| 80 | 1× ZOMG | 16.656 | 1.220 | 180 |
| 81 | 17× BFB | 44.506 | 5.185 | 181 |
| 82 | 10× BFB, 5× F-BFB | 52.320 | 4.575 | 182 |
| 83 | 40× Keramik, 40× R-Keramik, 40× F-Keramik, 30× MOAB | 25.080 | 4.566 | 183 |
| 84 | 50× MOAB, 10× BFB | 51.480 | 6.860 | 184 |
| 85 | 2× ZOMG | 30.704 | 2.440 | 185 |
| 86 | 5× F-BFB | 27.040 | 762 | 186 |
| 87 | 4× ZOMG | 63.008 | 2.440 | 187 |
| 88 | 18× MOAB, 8× BFB, 2× ZOMG | 63.600 | 3.126 | 188 |
| 89 | 20× F-MOAB, 8× F-BFB | 64.384 | 1.982 | 189 |
| 90 | 50× CRF-Blei, 3× DDT | 2.756 | 149 | 190 |
| 91 | 100× F-Keramik, 20× BFB | 71.160 | 4.000 | 191 |
| 92 | 50× F-MOAB, 4× ZOMG | 117.408 | 4.345 | 192 |
| 93 | 10× F-BFB, 6× DDT | 62.936 | 1.754 | 193 |
| 94 | 25× BFB, 6× ZOMG | 178.112 | 7.473 | 194 |
| 95 | 500× CR-Lila, 250× CRF-Blei, 50× F-MOAB, 30× DDT | 80.860 | 3.523 | 195 |
| 96 | 40× F-MOAB, 30× BFB, 6× ZOMG | 238.952 | 9.760 | 196 |
| 97 | 2× F-ZOMG | 69.984 | 1.220 | 197 |
| 98 | 30× F-BFB, 8× ZOMG | 327.456 | 9.456 | 198 |
| 99 | 60× MOAB, 9× F-DDT | 47.424 | 2.629 | 199 |
| 100 | 1× BAD | 67.200 | 1.335 | 200 |

## 6. Runden 101–140 (voreingestellte Freeplay-Runden)

Zusammensetzung [O/HIGH BTD-S2], RBE [D, HP-Faktor aus Abschnitt 4], Pop-Cash [D mit Steuer 5 % (101–120) bzw. 4 % (121–140); die Wiki-Tabelle nennt hier noch alte 2 %-Werte und ist daher nicht übernommen].

| Runde | Zusammensetzung | RBE | Pop-Cash (D) | HP-Faktor x | Speed-Faktor |
|---:|---|---:|---:|---:|---:|
| 101 | 450× Lila, 50× F-Keramik, 10× F-MOAB | 20.020 | 563 | 1.45 | 1.6 |
| 102 | 3× BFB, 3× F-BFB, 1× ZOMG, 3× F-ZOMG, 18× DDT, 12× F-DDT | 199.826 | 2.249 | 1.5 | 1.62 |
| 103 | 198× Lila, 100× MOAB, 50× F-MOAB, 10× F-ZOMG | 507.908 | 5.967 | 1.55 | 1.64 |
| 104 | 200× Lila, 200× F-Blei, 200× Keramik, 25× MOAB, 150× F-MOAB, 25× BFB, 14× F-BFB | 387.472 | 7.388 | 1.6 | 1.66 |
| 105 | 25× F-Blei, 100× Keramik, 300× F-Keramik, 30× BFB | 152.340 | 4.196 | 1.65 | 1.68 |
| 106 | 66× DDT, 27× F-DDT | 113.376 | 1.772 | 1.7 | 1.7 |
| 107 | 444× C-Lila, 100× F-Keramik, 10× F-ZOMG | 447.384 | 3.659 | 1.75 | 1.72 |
| 108 | 9× ZOMG, 10× F-ZOMG | 643.088 | 5.796 | 1.8 | 1.74 |
| 109 | 15× Lila, 30× F-MOAB, 15× BFB, 15× F-BFB, 15× ZOMG | 552.345 | 7.439 | 1.85 | 1.76 |
| 110 | 25× BFB, 18× DDT, 12× F-DDT | 141.410 | 2.478 | 1.9 | 1.78 |
| 111 | 22× ZOMG, 9× F-ZOMG | 949.472 | 9.457 | 1.95 | 1.8 |
| 112 | 27× F-BFB, 21× F-DDT | 261.648 | 2.459 | 2.0 | 1.82 |
| 113 | 42× C-Keramik, 42× F-Keramik, 75× F-MOAB, 15× F-BFB | 231.102 | 2.972 | 2.05 | 1.84 |
| 114 | 24× MOAB, 36× F-MOAB, 12× BFB, 8× F-BFB, 5× ZOMG, 3× F-ZOMG, 9× DDT, 6× F-DDT | 483.416 | 5.394 | 2.1 | 1.86 |
| 115 | 24× MOAB, 36× F-MOAB, 12× BFB, 8× F-BFB, 5× ZOMG, 3× F-ZOMG, 9× DDT, 6× F-DDT | 492.396 | 5.394 | 2.15 | 1.88 |
| 116 | 400× Lila, 18× F-BFB, 8× F-ZOMG | 575.600 | 3.933 | 2.2 | 1.9 |
| 117 | 250× Blei, 27× DDT, 18× F-DDT | 75.010 | 945 | 2.25 | 1.92 |
| 118 | 12× ZOMG, 30× F-DDT | 398.784 | 4.232 | 2.3 | 1.94 |
| 119 | 3× BAD | 319.020 | 2.002 | 2.35 | 1.96 |
| 120 | 24× F-MOAB, 12× BFB, 12× ZOMG | 431.808 | 5.033 | 2.4 | 1.98 |
| 121 | 14× F-BFB, 28× F-MOAB, 6× F-ZOMG | 516.500 | 2.745 | 2.45 | 2.0 |
| 122 | 20× F-BFB, 40× BFB, 225× F-Blei | 386.730 | 3.723 | 2.5 | 2.02 |
| 123 | 200× MOAB, 8× F-ZOMG | 629.936 | 5.000 | 2.55 | 2.04 |
| 124 | 75× F-BFB | 738.600 | 4.575 | 2.6 | 2.06 |
| 125 | 21× ZOMG, 42× BFB, 63× MOAB | 939.624 | 8.647 | 2.75 | 2.08 |
| 126 | 1× CRF-Blei, 99× DDT | 141.778 | 1.509 | 2.9 | 2.1 |
| 127 | 48× MOAB, 24× BFB | 178.248 | 2.196 | 3.05 | 2.12 |
| 128 | 39× F-DDT, 200× CF-Keramik, 30× BFB | 322.048 | 3.184 | 3.2 | 2.14 |
| 129 | 7× F-ZOMG, 77× CF-Blei, 77× C-Lila, 77× C-Keramik, 7× ZOMG, 18× DDT | 826.792 | 4.024 | 3.35 | 2.16 |
| 130 | 84× MOAB, 66× F-MOAB, 48× DDT, 6× F-DDT | 307.968 | 3.109 | 3.5 | 2.18 |
| 131 | 18× F-ZOMG | 1.461.456 | 4.393 | 3.65 | 2.2 |
| 132 | 18× ZOMG, 6× F-ZOMG, 200× C-Lila | 1.268.688 | 5.905 | 3.8 | 2.22 |
| 133 | 12× F-MOAB, 12× F-BFB, 4× F-ZOMG, 27× MOAB, 27× BFB, 9× ZOMG | 1.153.341 | 6.146 | 3.95 | 2.24 |
| 134 | 12× F-BFB, 28× BFB | 374.840 | 2.440 | 4.1 | 2.26 |
| 135 | 21× F-DDT, 14× F-ZOMG | 1.386.840 | 3.737 | 4.25 | 2.28 |
| 136 | 96× F-MOAB, 24× BFB | 402.624 | 2.927 | 4.4 | 2.3 |
| 137 | 18× ZOMG, 24× BFB, 48× MOAB | 1.143.984 | 6.588 | 4.55 | 2.32 |
| 138 | 81× F-DDT, 45× DDT | 442.872 | 1.920 | 4.7 | 2.34 |
| 139 | 181× MOAB, 72× F-MOAB | 401.346 | 3.856 | 4.85 | 2.36 |
| 140 | 1× F-BAD, 1× BAD | 645.440 | 1.068 | 5.0 | 2.38 |

## 7. Was nicht erfasst ist

- Runden 141+ (zufällig): nur Regeln (Budget, Garantien), keine Einzelrunden. Sonderrunden 163/200/263 nur textlich. [UNKNOWN Details]
- Alternate Bloons Rounds und Apopalypse: nicht erfasst.
- Spawn-Timing je Gruppe: UNKNOWN in diesem Dokument (Quelle BTD-S21 enthält es).
- Absolute Bloon-Geschwindigkeiten in Einheiten pro Sekunde, Regrow-Rate: UNKNOWN.
