# Balancing-Lauf vorher-infinite-greedy

Erzeugt mit `npm run sim` (sim/scripts/sim-cli.ts). Parameter: `stage=infinite`, `runs=200`, `seed=1`, `difficulty=normal`, `players=1`, `bots=greedy`, `maxWaves=100`

## Übersicht

| Stage | Bot | Schwierigkeit | Spieler | Runs | Siegquote | Verloren | Abgebrochen | Endwave Median (P10-P90) | Minuten Median (P10-P90) | Farm-Anteil | Payback (Waves) | Upgrade-Anteil |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| infinite | greedy | normal | 1 | 200 | 0.0 % | 200 | 0 | 32.0 (28-41) | 19.0 (16.2-24.3) | 0.0 % | - | 72 % |

## infinite / greedy / normal / 1 Spieler

Runs 200, Siegquote 0.0 % (0 Siege, 200 Niederlagen, 0 abgebrochen). Endwave Median 32.0 (P10 28, P90 41), Dauer Median 19.0 min.

| Wave | erreicht | Verlustrate | Hazard | Leak-Rate | Münzen P10 | Median | P90 | Einkommen P10 | Median | P90 | kill | wave | farm | Pool/Münze |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 100 % | 0.0 % | 0.0 % | 100 % | 177 | 195 | 195 | 177 | 195 | 195 | 90 | 105 | 0 | 0.20 |
| 2 | 100 % | 0.0 % | 0.0 % | 100 % | 113 | 359 | 395 | 182 | 200 | 236 | 90 | 110 | 0 | 0.25 |
| 3 | 100 % | 0.0 % | 0.0 % | 100 % | 301 | 343 | 392 | 223 | 248 | 280 | 133 | 115 | 0 | 0.24 |
| 4 | 100 % | 0.0 % | 0.0 % | 96 % | 274 | 355 | 412 | 273 | 311 | 337 | 191 | 120 | 0 | 0.27 |
| 5 | 100 % | 0.0 % | 0.0 % | 0 % | 168 | 204 | 315 | 443 | 443 | 443 | 318 | 125 | 0 | 0.28 |
| 6 | 100 % | 0.0 % | 0.0 % | 48 % | 248 | 328 | 391 | 408 | 450 | 450 | 320 | 130 | 0 | 0.28 |
| 7 | 100 % | 0.0 % | 0.0 % | 0 % | 234 | 273 | 326 | 534 | 534 | 534 | 399 | 135 | 0 | 0.30 |
| 8 | 100 % | 0.0 % | 0.0 % | 0 % | 215 | 255 | 307 | 581 | 581 | 581 | 441 | 140 | 0 | 0.30 |
| 9 | 100 % | 0.0 % | 0.0 % | 0 % | 278 | 318 | 370 | 663 | 663 | 663 | 518 | 145 | 0 | 0.33 |
| 10 | 100 % | 0.0 % | 0.0 % | 0 % | 355 | 1000 | 1065 | 1021 | 1021 | 1021 | 871 | 150 | 0 | 0.57 |
| 11 | 100 % | 0.0 % | 0.0 % | 0 % | 204 | 239 | 295 | 791 | 791 | 791 | 636 | 155 | 0 | 0.34 |
| 12 | 100 % | 0.0 % | 0.0 % | 0 % | 192 | 441 | 473 | 824 | 824 | 824 | 664 | 160 | 0 | 0.35 |
| 13 | 100 % | 0.0 % | 0.0 % | 14 % | 270 | 379 | 423 | 900 | 936 | 936 | 771 | 165 | 0 | 0.38 |
| 14 | 100 % | 0.0 % | 0.0 % | 0 % | 271 | 355 | 450 | 991 | 991 | 991 | 821 | 170 | 0 | 0.39 |
| 15 | 100 % | 0.0 % | 0.0 % | 0 % | 340 | 421 | 524 | 982 | 982 | 982 | 807 | 175 | 0 | 0.38 |
| 16 | 100 % | 0.0 % | 0.0 % | 0 % | 314 | 399 | 494 | 1175 | 1175 | 1175 | 995 | 180 | 0 | 0.46 |
| 17 | 100 % | 0.0 % | 0.0 % | 0 % | 293 | 366 | 452 | 1199 | 1199 | 1199 | 1014 | 185 | 0 | 0.45 |
| 18 | 100 % | 0.0 % | 0.0 % | 11 % | 368 | 442 | 508 | 1263 | 1289 | 1289 | 1099 | 190 | 0 | 0.49 |
| 19 | 100 % | 0.0 % | 0.0 % | 0 % | 257 | 340 | 599 | 1275 | 1275 | 1275 | 1080 | 195 | 0 | 0.47 |
| 20 | 100 % | 0.0 % | 0.0 % | 27 % | 221 | 583 | 1366 | 664 | 664 | 1591 | 464 | 200 | 0 | 0.63 |
| 21 | 100 % | 0.0 % | 0.0 % | 30 % | 272 | 429 | 611 | 1065 | 1164 | 2079 | 959 | 205 | 0 | 0.42 |
| 22 | 100 % | 0.0 % | 0.0 % | 30 % | 268 | 449 | 657 | 988 | 1154 | 1193 | 944 | 210 | 0 | 0.44 |
| 23 | 100 % | 0.5 % | 0.5 % | 34 % | 289 | 469 | 658 | 1002 | 1155 | 1194 | 940 | 215 | 0 | 0.45 |
| 24 | 100 % | 1.5 % | 1.5 % | 37 % | 274 | 516 | 728 | 972 | 1150 | 1196 | 930 | 220 | 0 | 0.46 |
| 25 | 99 % | 0.0 % | 0.0 % | 26 % | 325 | 510 | 755 | 1024 | 1174 | 1213 | 949 | 225 | 0 | 0.48 |
| 26 | 98 % | 2.5 % | 2.6 % | 41 % | 341 | 560 | 750 | 901 | 1145 | 1208 | 915 | 230 | 0 | 0.49 |
| 27 | 96 % | 3.5 % | 3.6 % | 49 % | 354 | 545 | 711 | 896 | 1148 | 1208 | 913 | 235 | 0 | 0.50 |
| 28 | 94 % | 5.5 % | 5.9 % | 53 % | 330 | 517 | 791 | 792 | 1150 | 1217 | 910 | 240 | 0 | 0.52 |
| 29 | 87 % | 7.0 % | 8.0 % | 48 % | 324 | 562 | 846 | 852 | 1131 | 1230 | 886 | 245 | 0 | 0.53 |
| 30 | 80 % | 24.0 % | 30.0 % | 64 % | 234 | 495 | 797 | 168 | 525 | 711 | 284 | 250 | 0 | 0.80 |
| 31 | 68 % | 3.5 % | 5.1 % | 44 % | 218 | 534 | 806 | 56 | 2006 | 2147 | 1751 | 255 | 0 | 0.54 |
| 32 | 52 % | 3.0 % | 5.8 % | 51 % | 345 | 519 | 861 | 884 | 1173 | 1246 | 913 | 260 | 0 | 0.56 |
| 33 | 49 % | 2.0 % | 4.1 % | 51 % | 374 | 582 | 936 | 844 | 1185 | 1238 | 920 | 265 | 0 | 0.58 |
| 34 | 47 % | 2.5 % | 5.3 % | 46 % | 339 | 601 | 898 | 950 | 1185 | 1254 | 915 | 270 | 0 | 0.59 |
| 35 | 45 % | 2.5 % | 5.6 % | 36 % | 326 | 554 | 961 | 1044 | 1202 | 1283 | 927 | 275 | 0 | 0.60 |
| 36 | 42 % | 3.5 % | 8.3 % | 51 % | 324 | 633 | 914 | 837 | 1161 | 1245 | 881 | 280 | 0 | 0.62 |
| 37 | 39 % | 6.0 % | 15.6 % | 69 % | 342 | 568 | 924 | 609 | 1139 | 1251 | 861 | 285 | 0 | 0.63 |
| 38 | 33 % | 6.5 % | 20.0 % | 68 % | 326 | 560 | 877 | 530 | 1128 | 1263 | 838 | 290 | 0 | 0.65 |
| 39 | 27 % | 4.5 % | 17.0 % | 72 % | 330 | 711 | 1046 | 389 | 1089 | 1250 | 794 | 295 | 0 | 0.65 |
| 40 | 22 % | 20.5 % | 93.2 % | 98 % | 328 | 546 | 946 | 90 | 448 | 552 | 171 | 300 | 0 | 0.98 |
| 41 | 16 % | 0.5 % | 3.1 % | 3 % | 123 | 506 | 671 | 0 | 88 | 159 | 88 | 0 | 0 | 0.26 |
| 42 | 1 % | 0.5 % | 100.0 % | 100 % | 542 | 542 | 542 | 729 | 729 | 729 | 729 | 0 | 0 | 0.72 |

Leak-Quellen:

| Typ | Leaks | Anteil | Base-Schaden |
|---|---:|---:|---:|
| flyer | 5363 | 57.0 % | 10726 |
| grunt | 1926 | 20.5 % | 1926 |
| runner | 1863 | 19.8 % | 1863 |
| boss | 120 | 1.3 % | 6000 |
| elite | 115 | 1.2 % | 1150 |
| brute | 26 | 0.3 % | 78 |
| splitter_child | 4 | 0.0 % | 4 |

## Definitionen

- **Siegquote**: Anteil der Runs mit Ergebnis `win`. Infinite hat keinen Sieg; dort zählen Median-Endwave und P10/P90 (Endwave = zuletzt gestartete Wave bei Ende; abgebrochene Runs (`maxWaves`) zählen mit der Abbruchwave und sind als "abgebrochen" ausgewiesen).
- **Verlustrate Wave n**: Anteil *aller* Runs, die in Wave n verlieren; "Verlust-Wave" ist die Wave des Gegners, dessen Leak die Base auf <= 0 bringt (Waves überlappen). **Hazard** = Verluste in Wave n / Runs, die Wave n erreicht haben. **Leak-Rate** = Anteil der erreichenden Runs mit mindestens einem Leak von Gegnern der Wave n.
- **Geldkurve**: Münzen des gesamten Teams am Ende der Wave n (nach Wave-Bonus/Farm, vor den Käufen der nächsten Wave; bei Verlust: Stand beim Ende); P10/Median/P90 über die Runs, die Wave n erreicht haben. **Einkommen** = Kill-Bounty + Wave-Bonus + Farm, die während der Wave n (Zeitraum zwischen Start Wave n und Start Wave n+1) eingehen; Quellen als Medianwerte. Münzen/Einkommen sind Team-Summen.
- **Pool/Münze** (Kapazitätsmaß, je Wave): Pool-HP der Wave (Summe Max-HP aller gespawnten Gegner inkl. Splitter-Kinder, mit Schwierigkeits- und Koop-Faktor, ohne Rüstung) geteilt durch die netto eingesetzten Münzen (kumulativ Platzierung + Upgrade - Verkaufserlös bis einschließlich Wave n, Teamsumme). Referenz aus recommendations §4: 0,025 DPS je Münze x 20 s = 0,5 HP Pool je Münze entspricht Pool/Kapazität 1,0 (Näherung, Anlage der Münzen unterschiedlich wirksam). Median über Runs.
- **Leak-Quellen**: Anzahl, Anteil und Base-Schaden aller Leaks nach Gegnertyp über alle Runs der Zelle.
- **Farm-Anteil** = Farm-Einkommen / Gesamteinkommen (Summe über alle Runs und Waves). **Payback** = je Run (Summe der Farm-Investitionen: Platzierung + Upgrades) / (mittlerer Farm-Ertrag je Wave mit Ertrag) in Waves, Median über Runs mit Farm.
- **Upgrade-Anteil** = Upgrade-Münzen / (Platzierungs- + Upgrade-Münzen).
- **Spielminuten** = Ticks / 20 / 60 (Median, P10, P90).
