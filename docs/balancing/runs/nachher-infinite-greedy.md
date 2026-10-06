# Balancing-Lauf nachher-infinite-greedy

Erzeugt mit `npm run sim` (sim/scripts/sim-cli.ts). Parameter: `stage=infinite`, `runs=200`, `seed=1`, `difficulty=normal`, `players=1`, `bots=greedy`, `maxWaves=100`

## Übersicht

| Stage | Bot | Schwierigkeit | Spieler | Runs | Siegquote | Verloren | Abgebrochen | Endwave Median (P10-P90) | Minuten Median (P10-P90) | Farm-Anteil | Payback (Waves) | Upgrade-Anteil |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| infinite | greedy | normal | 1 | 200 | 0.0 % | 200 | 0 | 30.0 (22-31) | 16.8 (13.4-17.4) | 0.0 % | - | 61 % |

## infinite / greedy / normal / 1 Spieler

Runs 200, Siegquote 0.0 % (0 Siege, 200 Niederlagen, 0 abgebrochen). Endwave Median 30.0 (P10 22, P90 31), Dauer Median 16.8 min.

| Wave | erreicht | Verlustrate | Hazard | Leak-Rate | Münzen P10 | Median | P90 | Einkommen P10 | Median | P90 | kill | wave | farm | Pool/Münze |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 100 % | 0.0 % | 0.0 % | 100 % | 177 | 195 | 195 | 177 | 195 | 195 | 90 | 105 | 0 | 0.20 |
| 2 | 100 % | 0.0 % | 0.0 % | 100 % | 113 | 359 | 395 | 182 | 200 | 236 | 90 | 110 | 0 | 0.26 |
| 3 | 100 % | 0.0 % | 0.0 % | 100 % | 301 | 343 | 392 | 223 | 248 | 280 | 133 | 115 | 0 | 0.26 |
| 4 | 100 % | 0.0 % | 0.0 % | 97 % | 242 | 346 | 410 | 260 | 305 | 337 | 185 | 120 | 0 | 0.29 |
| 5 | 100 % | 0.0 % | 0.0 % | 0 % | 159 | 198 | 328 | 443 | 443 | 443 | 318 | 125 | 0 | 0.32 |
| 6 | 100 % | 0.0 % | 0.0 % | 87 % | 192 | 300 | 361 | 354 | 408 | 450 | 278 | 130 | 0 | 0.33 |
| 7 | 100 % | 0.0 % | 0.0 % | 1 % | 186 | 256 | 407 | 534 | 534 | 534 | 399 | 135 | 0 | 0.36 |
| 8 | 100 % | 0.0 % | 0.0 % | 1 % | 188 | 245 | 375 | 581 | 581 | 581 | 441 | 140 | 0 | 0.37 |
| 9 | 100 % | 0.0 % | 0.0 % | 0 % | 245 | 308 | 422 | 663 | 663 | 663 | 518 | 145 | 0 | 0.42 |
| 10 | 100 % | 0.0 % | 0.0 % | 0 % | 951 | 1023 | 1063 | 1021 | 1021 | 1021 | 871 | 150 | 0 | 0.74 |
| 11 | 100 % | 0.0 % | 0.0 % | 1 % | 199 | 234 | 322 | 791 | 791 | 791 | 636 | 155 | 0 | 0.45 |
| 12 | 100 % | 0.0 % | 0.0 % | 0 % | 210 | 437 | 472 | 824 | 824 | 824 | 664 | 160 | 0 | 0.48 |
| 13 | 100 % | 0.0 % | 0.0 % | 81 % | 225 | 337 | 416 | 624 | 832 | 936 | 667 | 165 | 0 | 0.54 |
| 14 | 100 % | 0.0 % | 0.0 % | 51 % | 221 | 401 | 545 | 922 | 968 | 991 | 798 | 170 | 0 | 0.59 |
| 15 | 100 % | 0.0 % | 0.0 % | 0 % | 233 | 390 | 567 | 982 | 982 | 982 | 807 | 175 | 0 | 0.57 |
| 16 | 100 % | 0.0 % | 0.0 % | 100 % | 211 | 373 | 548 | 975 | 1025 | 1075 | 845 | 180 | 0 | 0.72 |
| 17 | 100 % | 0.0 % | 0.0 % | 4 % | 282 | 432 | 626 | 1114 | 1199 | 1224 | 1014 | 185 | 0 | 0.75 |
| 18 | 100 % | 0.0 % | 0.0 % | 100 % | 231 | 335 | 558 | 1009 | 1073 | 1151 | 883 | 190 | 0 | 0.83 |
| 19 | 100 % | 0.0 % | 0.0 % | 0 % | 312 | 458 | 642 | 1295 | 1335 | 1355 | 1140 | 195 | 0 | 0.82 |
| 20 | 100 % | 5.0 % | 5.0 % | 72 % | 220 | 420 | 556 | 417 | 417 | 664 | 217 | 200 | 0 | 1.14 |
| 21 | 100 % | 3.5 % | 3.5 % | 33 % | 237 | 418 | 590 | 475 | 1465 | 1547 | 1260 | 205 | 0 | 0.33 |
| 22 | 92 % | 5.5 % | 6.0 % | 34 % | 253 | 485 | 625 | 508 | 591 | 633 | 381 | 210 | 0 | 0.35 |
| 23 | 86 % | 2.0 % | 2.3 % | 41 % | 248 | 492 | 627 | 516 | 590 | 638 | 375 | 215 | 0 | 0.37 |
| 24 | 84 % | 4.0 % | 4.8 % | 44 % | 253 | 455 | 638 | 506 | 585 | 640 | 365 | 220 | 0 | 0.39 |
| 25 | 80 % | 4.0 % | 5.0 % | 29 % | 281 | 468 | 708 | 581 | 631 | 680 | 406 | 225 | 0 | 0.43 |
| 26 | 76 % | 4.5 % | 5.9 % | 56 % | 280 | 532 | 668 | 456 | 574 | 646 | 344 | 230 | 0 | 0.43 |
| 27 | 72 % | 3.5 % | 4.9 % | 65 % | 269 | 537 | 674 | 491 | 584 | 646 | 349 | 235 | 0 | 0.44 |
| 28 | 68 % | 4.5 % | 6.6 % | 61 % | 264 | 515 | 682 | 445 | 574 | 643 | 334 | 240 | 0 | 0.46 |
| 29 | 64 % | 3.5 % | 5.5 % | 67 % | 290 | 547 | 696 | 447 | 569 | 648 | 324 | 245 | 0 | 0.48 |
| 30 | 60 % | 55.5 % | 92.5 % | 100 % | 147 | 361 | 579 | 31 | 281 | 334 | 53 | 250 | 0 | 1.62 |
| 31 | 45 % | 3.0 % | 6.7 % | 10 % | 26 | 325 | 425 | 0 | 31 | 84 | 31 | 0 | 0 | 0.37 |
| 32 | 2 % | 0.5 % | 33.3 % | 100 % | 190 | 310 | 641 | 216 | 554 | 634 | 294 | 260 | 0 | 0.54 |
| 33 | 1 % | 1.0 % | 100.0 % | 100 % | 178 | 198 | 218 | 137 | 228 | 318 | 228 | 0 | 0 | 0.55 |

Leak-Quellen:

| Typ | Leaks | Anteil | Base-Schaden |
|---|---:|---:|---:|
| flyer | 4037 | 40.2 % | 8074 |
| runner | 3074 | 30.6 % | 3074 |
| grunt | 2428 | 24.2 % | 2428 |
| elite | 247 | 2.5 % | 2470 |
| boss | 164 | 1.6 % | 5576 |
| brute | 41 | 0.4 % | 123 |
| splitter_child | 37 | 0.4 % | 37 |
| splitter | 9 | 0.1 % | 18 |

## Definitionen

- **Siegquote**: Anteil der Runs mit Ergebnis `win`. Infinite hat keinen Sieg; dort zählen Median-Endwave und P10/P90 (Endwave = zuletzt gestartete Wave bei Ende; abgebrochene Runs (`maxWaves`) zählen mit der Abbruchwave und sind als "abgebrochen" ausgewiesen).
- **Verlustrate Wave n**: Anteil *aller* Runs, die in Wave n verlieren; "Verlust-Wave" ist die Wave des Gegners, dessen Leak die Base auf <= 0 bringt (Waves überlappen). **Hazard** = Verluste in Wave n / Runs, die Wave n erreicht haben. **Leak-Rate** = Anteil der erreichenden Runs mit mindestens einem Leak von Gegnern der Wave n.
- **Geldkurve**: Münzen des gesamten Teams am Ende der Wave n (nach Wave-Bonus/Farm, vor den Käufen der nächsten Wave; bei Verlust: Stand beim Ende); P10/Median/P90 über die Runs, die Wave n erreicht haben. **Einkommen** = Kill-Bounty + Wave-Bonus + Farm, die während der Wave n (Zeitraum zwischen Start Wave n und Start Wave n+1) eingehen; Quellen als Medianwerte. Münzen/Einkommen sind Team-Summen.
- **Pool/Münze** (Kapazitätsmaß, je Wave): Pool-HP der Wave (Summe Max-HP aller gespawnten Gegner inkl. Splitter-Kinder, mit Schwierigkeits- und Koop-Faktor, ohne Rüstung) geteilt durch die netto eingesetzten Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös bis einschließlich Wave n, Teamsumme). Referenz aus recommendations §4: 0,025 DPS je Münze x 20 s = 0,5 HP Pool je Münze entspricht Pool/Kapazität 1,0 (Näherung, Anlage der Münzen unterschiedlich wirksam). Median über Runs.
- **Leak-Quellen**: Anzahl, Anteil und Base-Schaden aller Leaks nach Gegnertyp über alle Runs der Zelle.
- **Farm-Anteil** = Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). **Payback** = je Run (Summe der Farm-Investitionen: Platzierung + Upgrades) / (mittlerer Farm-Ertrag je Wave mit Ertrag) in Waves, Median über Runs mit Farm.
- **Upgrade-Anteil** = Upgrade-Münzen / (Platzierungs- + Upgrade-Münzen).
- **Spielminuten** = Ticks / 20 / 60 (Median, P10, P90).
