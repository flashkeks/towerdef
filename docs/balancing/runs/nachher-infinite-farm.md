# Balancing-Lauf nachher-infinite-farm

Erzeugt mit `npm run sim` (sim/scripts/sim-cli.ts). Parameter: `stage=infinite`, `runs=200`, `seed=1`, `difficulty=normal`, `players=1`, `bots=farm`, `maxWaves=100`

## Übersicht

| Stage | Bot | Schwierigkeit | Spieler | Runs | Siegquote | Verloren | Abgebrochen | Endwave Median (P10-P90) | Minuten Median (P10-P90) | Farm-Anteil | Payback (Waves) | Upgrade-Anteil |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| infinite | farm | normal | 1 | 200 | 0.0 % | 200 | 0 | 31.0 (21-31) | 15.8 (11.8-16.7) | 21.0 % | 9.0 | 65 % |

## infinite / farm / normal / 1 Spieler

Runs 200, Siegquote 0.0 % (0 Siege, 200 Niederlagen, 0 abgebrochen). Endwave Median 31.0 (P10 21, P90 31), Dauer Median 15.8 min.

| Wave | erreicht | Verlustrate | Hazard | Leak-Rate | Münzen P10 | Median | P90 | Einkommen P10 | Median | P90 | kill | wave | farm | Pool/Münze |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 100 % | 0.0 % | 0.0 % | 0 % | 214 | 214 | 214 | 314 | 314 | 314 | 144 | 105 | 65 | 0.18 |
| 2 | 100 % | 0.0 % | 0.0 % | 0 % | 251 | 251 | 251 | 337 | 337 | 337 | 162 | 110 | 65 | 0.19 |
| 3 | 100 % | 0.0 % | 0.0 % | 0 % | 374 | 374 | 374 | 423 | 423 | 423 | 191 | 115 | 117 | 0.20 |
| 4 | 100 % | 0.0 % | 0.0 % | 4 % | 541 | 541 | 541 | 467 | 467 | 467 | 230 | 120 | 117 | 0.23 |
| 5 | 100 % | 0.0 % | 0.0 % | 0 % | 366 | 401 | 701 | 560 | 560 | 625 | 318 | 125 | 117 | 0.26 |
| 6 | 100 % | 0.0 % | 0.0 % | 3 % | 385 | 430 | 633 | 632 | 684 | 684 | 320 | 130 | 234 | 0.24 |
| 7 | 100 % | 0.0 % | 0.0 % | 0 % | 501 | 553 | 553 | 768 | 768 | 768 | 399 | 135 | 234 | 0.28 |
| 8 | 100 % | 0.0 % | 0.0 % | 1 % | 625 | 670 | 677 | 874 | 874 | 874 | 441 | 140 | 293 | 0.29 |
| 9 | 100 % | 0.0 % | 0.0 % | 0 % | 581 | 633 | 738 | 956 | 956 | 956 | 518 | 145 | 293 | 0.31 |
| 10 | 100 % | 0.0 % | 0.0 % | 100 % | 508 | 560 | 700 | 627 | 627 | 627 | 184 | 150 | 293 | 0.53 |
| 11 | 100 % | 0.0 % | 0.0 % | 7 % | 601 | 653 | 793 | 1143 | 1143 | 1143 | 636 | 155 | 352 | 0.37 |
| 12 | 100 % | 0.0 % | 0.0 % | 0 % | 617 | 721 | 829 | 1176 | 1176 | 1267 | 664 | 160 | 352 | 0.38 |
| 13 | 100 % | 0.0 % | 0.0 % | 2 % | 605 | 769 | 889 | 1288 | 1288 | 1379 | 771 | 165 | 352 | 0.42 |
| 14 | 100 % | 0.0 % | 0.0 % | 78 % | 615 | 736 | 841 | 1274 | 1343 | 1411 | 775 | 170 | 352 | 0.45 |
| 15 | 100 % | 0.0 % | 0.0 % | 0 % | 674 | 794 | 922 | 1334 | 1334 | 1425 | 807 | 175 | 352 | 0.44 |
| 16 | 100 % | 0.0 % | 0.0 % | 87 % | 636 | 795 | 943 | 1368 | 1460 | 1543 | 895 | 180 | 352 | 0.54 |
| 17 | 100 % | 0.0 % | 0.0 % | 0 % | 657 | 864 | 1008 | 1551 | 1626 | 1692 | 1039 | 185 | 352 | 0.56 |
| 18 | 100 % | 0.0 % | 0.0 % | 81 % | 640 | 829 | 981 | 1472 | 1589 | 1706 | 995 | 190 | 352 | 0.62 |
| 19 | 100 % | 0.0 % | 0.0 % | 0 % | 312 | 518 | 652 | 1275 | 1275 | 1321 | 1080 | 195 | 0 | 0.61 |
| 20 | 100 % | 12.0 % | 12.0 % | 93 % | 214 | 261 | 549 | 664 | 664 | 664 | 464 | 200 | 0 | 0.85 |
| 21 | 100 % | 1.0 % | 1.0 % | 22 % | 254 | 405 | 532 | 159 | 589 | 637 | 384 | 205 | 0 | 0.26 |
| 22 | 87 % | 0.5 % | 0.6 % | 14 % | 268 | 562 | 635 | 555 | 607 | 635 | 397 | 210 | 0 | 0.28 |
| 23 | 87 % | 3.0 % | 3.5 % | 18 % | 260 | 465 | 655 | 547 | 603 | 638 | 388 | 215 | 0 | 0.29 |
| 24 | 84 % | 3.0 % | 3.6 % | 21 % | 266 | 485 | 647 | 541 | 608 | 643 | 388 | 220 | 0 | 0.31 |
| 25 | 81 % | 1.5 % | 1.9 % | 14 % | 330 | 635 | 744 | 603 | 640 | 684 | 415 | 225 | 0 | 0.35 |
| 26 | 79 % | 5.0 % | 6.3 % | 28 % | 276 | 512 | 696 | 488 | 619 | 654 | 389 | 230 | 0 | 0.35 |
| 27 | 74 % | 4.0 % | 5.4 % | 35 % | 292 | 537 | 672 | 511 | 605 | 658 | 370 | 235 | 0 | 0.36 |
| 28 | 70 % | 4.0 % | 5.7 % | 36 % | 279 | 530 | 681 | 484 | 618 | 663 | 378 | 240 | 0 | 0.38 |
| 29 | 66 % | 6.5 % | 9.8 % | 36 % | 292 | 531 | 702 | 482 | 608 | 669 | 363 | 245 | 0 | 0.39 |
| 30 | 60 % | 57.0 % | 95.8 % | 100 % | 276 | 400 | 688 | 84 | 309 | 362 | 59 | 250 | 0 | 1.35 |
| 31 | 53 % | 1.0 % | 1.9 % | 4 % | 28 | 317 | 461 | 0 | 31 | 124 | 31 | 0 | 0 | 0.39 |
| 32 | 2 % | 0.0 % | 0.0 % | 33 % | 525 | 704 | 849 | 533 | 587 | 685 | 327 | 260 | 0 | 0.45 |
| 33 | 2 % | 0.5 % | 33.3 % | 33 % | 312 | 569 | 632 | 258 | 628 | 694 | 363 | 265 | 0 | 0.42 |
| 34 | 1 % | 0.0 % | 0.0 % | 0 % | 595 | 623 | 650 | 676 | 685 | 693 | 415 | 270 | 0 | 0.48 |
| 35 | 1 % | 0.0 % | 0.0 % | 0 % | 671 | 680 | 688 | 696 | 720 | 743 | 445 | 275 | 0 | 0.54 |
| 36 | 1 % | 0.5 % | 50.0 % | 50 % | 243 | 463 | 682 | 230 | 458 | 686 | 318 | 140 | 0 | 0.50 |
| 37 | 1 % | 0.0 % | 0.0 % | 100 % | 469 | 469 | 469 | 462 | 462 | 462 | 177 | 285 | 0 | 0.52 |
| 38 | 1 % | 0.5 % | 100.0 % | 100 % | 62 | 62 | 62 | 268 | 268 | 268 | 268 | 0 | 0 | 0.55 |

Leak-Quellen:

| Typ | Leaks | Anteil | Base-Schaden |
|---|---:|---:|---:|
| flyer | 2613 | 80.3 % | 5226 |
| boss | 455 | 14.0 % | 15470 |
| elite | 118 | 3.6 % | 1180 |
| runner | 49 | 1.5 % | 49 |
| brute | 15 | 0.5 % | 45 |
| grunt | 3 | 0.1 % | 3 |

## Definitionen

- **Siegquote**: Anteil der Runs mit Ergebnis `win`. Infinite hat keinen Sieg; dort zählen Median-Endwave und P10/P90 (Endwave = zuletzt gestartete Wave bei Ende; abgebrochene Runs (`maxWaves`) zählen mit der Abbruchwave und sind als "abgebrochen" ausgewiesen).
- **Verlustrate Wave n**: Anteil *aller* Runs, die in Wave n verlieren; "Verlust-Wave" ist die Wave des Gegners, dessen Leak die Base auf <= 0 bringt (Waves überlappen). **Hazard** = Verluste in Wave n / Runs, die Wave n erreicht haben. **Leak-Rate** = Anteil der erreichenden Runs mit mindestens einem Leak von Gegnern der Wave n.
- **Geldkurve**: Münzen des gesamten Teams am Ende der Wave n (nach Wave-Bonus/Farm, vor den Käufen der nächsten Wave; bei Verlust: Stand beim Ende); P10/Median/P90 über die Runs, die Wave n erreicht haben. **Einkommen** = Kill-Bounty + Wave-Bonus + Farm, die während der Wave n (Zeitraum zwischen Start Wave n und Start Wave n+1) eingehen; Quellen als Medianwerte. Münzen/Einkommen sind Team-Summen.
- **Pool/Münze** (Kapazitätsmaß, je Wave): Pool-HP der Wave (Summe Max-HP aller gespawnten Gegner inkl. Splitter-Kinder, mit Schwierigkeits- und Koop-Faktor, ohne Rüstung) geteilt durch die netto eingesetzten Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös bis einschließlich Wave n, Teamsumme). Referenz aus recommendations §4: 0,025 DPS je Münze x 20 s = 0,5 HP Pool je Münze entspricht Pool/Kapazität 1,0 (Näherung, Anlage der Münzen unterschiedlich wirksam). Median über Runs.
- **Leak-Quellen**: Anzahl, Anteil und Base-Schaden aller Leaks nach Gegnertyp über alle Runs der Zelle.
- **Farm-Anteil** = Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). **Payback** = je Run (Summe der Farm-Investitionen: Platzierung + Upgrades) / (mittlerer Farm-Ertrag je Wave mit Ertrag) in Waves, Median über Runs mit Farm.
- **Upgrade-Anteil** = Upgrade-Münzen / (Platzierungs- + Upgrade-Münzen).
- **Spielminuten** = Ticks / 20 / 60 (Median, P10, P90).
