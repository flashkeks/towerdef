# Balancing-Lauf vorher-infinite-farm

Erzeugt mit `npm run sim` (sim/scripts/sim-cli.ts). Parameter: `stage=infinite`, `runs=200`, `seed=1`, `difficulty=normal`, `players=1`, `bots=farm`, `maxWaves=100`

## Übersicht

| Stage | Bot | Schwierigkeit | Spieler | Runs | Siegquote | Verloren | Abgebrochen | Endwave Median (P10-P90) | Minuten Median (P10-P90) | Farm-Anteil | Payback (Waves) | Upgrade-Anteil |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| infinite | farm | normal | 1 | 200 | 0.0 % | 200 | 0 | 29.0 (21-31) | 15.8 (10.4-17.7) | 11.8 % | 10.7 | 67 % |

## infinite / farm / normal / 1 Spieler

Runs 200, Siegquote 0.0 % (0 Siege, 200 Niederlagen, 0 abgebrochen). Endwave Median 29.0 (P10 21, P90 31), Dauer Median 15.8 min.

| Wave | erreicht | Verlustrate | Hazard | Leak-Rate | Münzen P10 | Median | P90 | Einkommen P10 | Median | P90 | kill | wave | farm | Pool/Münze |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 100 % | 0.0 % | 0.0 % | 0 % | 199 | 199 | 199 | 299 | 299 | 299 | 144 | 105 | 50 | 0.18 |
| 2 | 100 % | 0.0 % | 0.0 % | 0 % | 221 | 221 | 221 | 322 | 322 | 322 | 162 | 110 | 50 | 0.18 |
| 3 | 100 % | 0.0 % | 0.0 % | 0 % | 317 | 317 | 317 | 396 | 396 | 396 | 191 | 115 | 90 | 0.18 |
| 4 | 100 % | 0.0 % | 0.0 % | 1 % | 457 | 457 | 457 | 440 | 440 | 440 | 230 | 120 | 90 | 0.21 |
| 5 | 100 % | 0.0 % | 0.0 % | 0 % | 290 | 590 | 590 | 533 | 533 | 533 | 318 | 125 | 90 | 0.26 |
| 6 | 100 % | 0.0 % | 0.0 % | 1 % | 480 | 480 | 530 | 540 | 590 | 590 | 320 | 130 | 140 | 0.23 |
| 7 | 100 % | 0.0 % | 0.0 % | 0 % | 544 | 594 | 594 | 714 | 714 | 714 | 399 | 135 | 180 | 0.25 |
| 8 | 100 % | 0.0 % | 0.0 % | 0 % | 600 | 650 | 650 | 806 | 806 | 806 | 441 | 140 | 225 | 0.25 |
| 9 | 100 % | 0.0 % | 0.0 % | 0 % | 478 | 538 | 628 | 888 | 888 | 888 | 518 | 145 | 225 | 0.26 |
| 10 | 100 % | 0.0 % | 0.0 % | 98 % | 397 | 447 | 647 | 559 | 559 | 559 | 184 | 150 | 225 | 0.43 |
| 11 | 100 % | 0.0 % | 0.0 % | 1 % | 463 | 513 | 663 | 1016 | 1016 | 1016 | 636 | 155 | 225 | 0.30 |
| 12 | 100 % | 0.0 % | 0.0 % | 0 % | 502 | 562 | 652 | 1049 | 1049 | 1049 | 664 | 160 | 225 | 0.30 |
| 13 | 100 % | 0.0 % | 0.0 % | 0 % | 413 | 563 | 713 | 1161 | 1161 | 1161 | 771 | 165 | 225 | 0.32 |
| 14 | 100 % | 0.0 % | 0.0 % | 0 % | 469 | 626 | 669 | 1216 | 1216 | 1216 | 821 | 170 | 225 | 0.34 |
| 15 | 100 % | 0.0 % | 0.0 % | 0 % | 526 | 576 | 683 | 1207 | 1207 | 1207 | 807 | 175 | 225 | 0.32 |
| 16 | 100 % | 0.0 % | 0.0 % | 1 % | 476 | 636 | 726 | 1375 | 1400 | 1400 | 995 | 180 | 225 | 0.38 |
| 17 | 100 % | 0.0 % | 0.0 % | 0 % | 597 | 690 | 760 | 1424 | 1424 | 1449 | 1014 | 185 | 225 | 0.39 |
| 18 | 100 % | 0.0 % | 0.0 % | 3 % | 309 | 494 | 584 | 1289 | 1289 | 1289 | 1099 | 190 | 0 | 0.42 |
| 19 | 100 % | 0.0 % | 0.0 % | 0 % | 299 | 454 | 594 | 1275 | 1275 | 1275 | 1080 | 195 | 0 | 0.40 |
| 20 | 100 % | 42.5 % | 42.5 % | 43 % | 213 | 271 | 586 | 664 | 664 | 664 | 464 | 200 | 0 | 0.54 |
| 21 | 100 % | 0.0 % | 0.0 % | 12 % | 95 | 334 | 614 | 179 | 1191 | 2098 | 986 | 205 | 0 | 0.35 |
| 22 | 57 % | 0.0 % | 0.0 % | 24 % | 281 | 412 | 655 | 1049 | 1159 | 1190 | 949 | 210 | 0 | 0.38 |
| 23 | 57 % | 0.0 % | 0.0 % | 26 % | 316 | 449 | 663 | 1007 | 1168 | 1199 | 953 | 215 | 0 | 0.39 |
| 24 | 57 % | 0.0 % | 0.0 % | 30 % | 300 | 531 | 730 | 977 | 1162 | 1200 | 942 | 220 | 0 | 0.41 |
| 25 | 57 % | 0.5 % | 0.9 % | 23 % | 340 | 468 | 723 | 1050 | 1177 | 1210 | 952 | 225 | 0 | 0.43 |
| 26 | 57 % | 1.5 % | 2.6 % | 36 % | 301 | 554 | 773 | 933 | 1147 | 1210 | 917 | 230 | 0 | 0.43 |
| 27 | 56 % | 1.0 % | 1.8 % | 34 % | 352 | 577 | 858 | 952 | 1168 | 1218 | 933 | 235 | 0 | 0.45 |
| 28 | 55 % | 2.0 % | 3.7 % | 35 % | 340 | 536 | 911 | 934 | 1179 | 1225 | 939 | 240 | 0 | 0.47 |
| 29 | 53 % | 3.5 % | 6.7 % | 33 % | 341 | 519 | 890 | 1001 | 1185 | 1230 | 940 | 245 | 0 | 0.48 |
| 30 | 49 % | 37.5 % | 76.5 % | 85 % | 282 | 568 | 786 | 422 | 683 | 736 | 433 | 250 | 0 | 0.72 |
| 31 | 47 % | 2.0 % | 4.3 % | 10 % | 61 | 361 | 671 | 28 | 156 | 2118 | 156 | 0 | 0 | 0.36 |
| 32 | 10 % | 1.0 % | 10.5 % | 37 % | 476 | 588 | 866 | 747 | 1200 | 1256 | 940 | 260 | 0 | 0.52 |
| 33 | 9 % | 2.5 % | 29.4 % | 47 % | 340 | 434 | 796 | 441 | 1203 | 1249 | 938 | 265 | 0 | 0.53 |
| 34 | 7 % | 0.5 % | 7.7 % | 31 % | 268 | 433 | 853 | 510 | 1204 | 1250 | 934 | 270 | 0 | 0.54 |
| 35 | 6 % | 0.0 % | 0.0 % | 36 % | 558 | 603 | 940 | 1048 | 1223 | 1265 | 948 | 275 | 0 | 0.56 |
| 36 | 6 % | 1.0 % | 18.2 % | 27 % | 308 | 497 | 721 | 350 | 1238 | 1253 | 958 | 280 | 0 | 0.57 |
| 37 | 5 % | 0.5 % | 11.1 % | 44 % | 387 | 738 | 1117 | 663 | 1200 | 1275 | 915 | 285 | 0 | 0.59 |
| 38 | 4 % | 0.0 % | 0.0 % | 75 % | 437 | 678 | 1137 | 962 | 1117 | 1263 | 827 | 290 | 0 | 0.58 |
| 39 | 4 % | 1.5 % | 37.5 % | 75 % | 93 | 474 | 873 | 283 | 1025 | 1271 | 798 | 295 | 0 | 0.61 |
| 40 | 3 % | 2.0 % | 80.0 % | 100 % | 275 | 484 | 1044 | 247 | 499 | 699 | 212 | 300 | 0 | 0.92 |
| 41 | 2 % | 0.5 % | 25.0 % | 25 % | 117 | 514 | 996 | 0 | 51 | 198 | 51 | 0 | 0 | 0.18 |

Leak-Quellen:

| Typ | Leaks | Anteil | Base-Schaden |
|---|---:|---:|---:|
| flyer | 1648 | 78.0 % | 3296 |
| boss | 357 | 16.9 % | 17850 |
| runner | 74 | 3.5 % | 74 |
| elite | 19 | 0.9 % | 190 |
| grunt | 14 | 0.7 % | 14 |
| splitter_child | 2 | 0.1 % | 2 |

## Definitionen

- **Siegquote**: Anteil der Runs mit Ergebnis `win`. Infinite hat keinen Sieg; dort zählen Median-Endwave und P10/P90 (Endwave = zuletzt gestartete Wave bei Ende; abgebrochene Runs (`maxWaves`) zählen mit der Abbruchwave und sind als "abgebrochen" ausgewiesen).
- **Verlustrate Wave n**: Anteil *aller* Runs, die in Wave n verlieren; "Verlust-Wave" ist die Wave des Gegners, dessen Leak die Base auf <= 0 bringt (Waves überlappen). **Hazard** = Verluste in Wave n / Runs, die Wave n erreicht haben. **Leak-Rate** = Anteil der erreichenden Runs mit mindestens einem Leak von Gegnern der Wave n.
- **Geldkurve**: Münzen des gesamten Teams am Ende der Wave n (nach Wave-Bonus/Farm, vor den Käufen der nächsten Wave; bei Verlust: Stand beim Ende); P10/Median/P90 über die Runs, die Wave n erreicht haben. **Einkommen** = Kill-Bounty + Wave-Bonus + Farm, die während der Wave n (Zeitraum zwischen Start Wave n und Start Wave n+1) eingehen; Quellen als Medianwerte. Münzen/Einkommen sind Team-Summen.
- **Pool/Münze** (Kapazitätsmaß, je Wave): Pool-HP der Wave (Summe Max-HP aller gespawnten Gegner inkl. Splitter-Kinder, mit Schwierigkeits- und Koop-Faktor, ohne Rüstung) geteilt durch die netto eingesetzten Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös bis einschließlich Wave n, Teamsumme). Referenz aus recommendations §4: 0,025 DPS je Münze x 20 s = 0,5 HP Pool je Münze entspricht Pool/Kapazität 1,0 (Näherung, Anlage der Münzen unterschiedlich wirksam). Median über Runs.
- **Leak-Quellen**: Anzahl, Anteil und Base-Schaden aller Leaks nach Gegnertyp über alle Runs der Zelle.
- **Farm-Anteil** = Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). **Payback** = je Run (Summe der Farm-Investitionen: Platzierung + Upgrades) / (mittlerer Farm-Ertrag je Wave mit Ertrag) in Waves, Median über Runs mit Farm.
- **Upgrade-Anteil** = Upgrade-Münzen / (Platzierungs- + Upgrade-Münzen).
- **Spielminuten** = Ticks / 20 / 60 (Median, P10, P90).
