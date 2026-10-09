# Runden 1–20 (Runde 11, Vertical Slice)

Verbindlich für P1 (`sim/data/rounds.json`). Feste Liste (Lehre 1), verdichtet aus BTD6 Runde 1–40 auf 20 Runden.

## Ablauf (wie BTD6)

- Start: **650 Gold** (Easy/Medium/Hard gleich), Leben **200 / 150 / 100** (Easy/Medium/Hard).
- Der Spieler startet jede Runde selbst (Knopf/Leertaste); **Auto-Start** schaltbar. Die nächste Runde darf starten, sobald
  die aktuelle **fertig gespawnt** hat (Runden überlappen dann, wie BTD6).
- **Rundenbonus 100 + Rundennummer**, gezahlt, wenn alle Gegner dieser Runde weg sind (geknackt oder durch).
- **Sieg:** Runde 20 geschafft mit Leben > 0. Danach optional **Freeplay** (Runde 21+, prozedural, ohne Medaille; nur wenn Zeit
  bleibt, sonst später).
- Tempo im Client 1× / 2× / 3× (Sim-Ticks je Bild), Pause.

## Liste

Gruppen laufen gleichzeitig ab ihrem Start (Sekunden nach Rundenstart); Abstand = Sekunden zwischen zwei Gegnern der Gruppe.
`c` = Camo (Shade). RBE und Cash ohne Rundenbonus; „kumuliert“ = verfügbares Gold inkl. Start 650, alle Boni, alles geknackt.

| Runde | Gruppen (Anzahl × Typ @ Abstand, Start) | RBE | Cash | kumuliert |
|---:|---|---:|---:|---:|
| 1 | 20 red @0,9 | 20 | 20 | 771 |
| 2 | 35 red @0,7 | 35 | 35 | 908 |
| 3 | 25 red @0,7 · 10 blue @0,9 ab 6 s | 45 | 45 | 1.056 |
| 4 | 30 red @0,5 · 20 blue @0,7 ab 5 s | 70 | 70 | 1.230 |
| 5 | 35 blue @0,6 · 8 green @1,0 ab 10 s | 94 | 94 | 1.429 |
| 6 | 25 blue @0,5 · 20 green @0,7 ab 4 s | 110 | 110 | 1.645 |
| 7 | 10 blue @0,6 · 50 green @0,4 ab 3 s | 170 | 170 | 1.922 |
| 8 | 40 blue @0,35 · 18 gold @0,8 ab 8 s | 152 | 152 | 2.182 |
| 9 | 30 green @0,4 · 24 gold @0,6 ab 6 s | 186 | 186 | 2.477 |
| 10 | 120 blue @0,15 (Ansturm) | 240 | 240 | 2.827 |
| 11 | 8 ironshell @1,4 · 30 green @0,5 ab 2 s (erste Panzer) | 162 | 162 | 3.100 |
| 12 | 14 ember @1,0 · 40 gold @0,4 ab 4 s (erste Emberlinge) | 286 | 286 | 3.498 |
| 13 | 20 green **c** @0,6 · 50 gold @0,35 ab 3 s (erste Shades) | 260 | 260 | 3.871 |
| 14 | 24 ironshell @0,7 · 50 green @0,3 ab 4 s | 366 | 366 | 4.351 |
| 15 | 8 brute @1,8 · 40 gold @0,4 ab 5 s (erste Brutes) | 384 | 312 | 4.778 |
| 16 | 20 ember @0,6 · 20 ironshell @0,6 ab 3 s · 16 gold **c** @0,5 ab 10 s | 424 | 424 | 5.318 |
| 17 | 16 brute @1,2 · 60 gold @0,25 ab 4 s | 688 | 544 | 5.979 |
| 18 | 120 gold @0,12 · 24 gold **c** @0,3 ab 8 s (Ansturm) | 576 | 576 | 6.673 |
| 19 | 26 brute @0,8 · 20 ironshell @0,5 ab 6 s · 14 ember @0,6 ab 12 s | 1.034 | 800 | 7.592 |
| 20 | **1 leviathan** · 10 brute @1,5 ab 8 s · 60 gold @0,3 ab 2 s | 932 | 606 | 8.318 |

Vergleich BTD6 Medium: kumuliert bis R20 4.868, bis R30 8.283, bis R40 17.506 (inkl. Start). Unser Slice landet bei R20
etwa auf BTD6-R30-Niveau, die Gegnerarten reichen bis BTD6-R40 (Keramik + MOAB).

## Was jede Runde prüft

R1–4 Einstieg, ein Ranger reicht. R5–9 Menge und Tempo (Gold) → zweiter Turm, erste Upgrades. R10 erster Ansturm (Fläche!).
R11 Panzer (Bombardier, Frost, Ranger C3). R12 Emberlinge (Frost allein reicht nicht). R13 Shades (Erkennung). R14–16 Mischung.
R15/17 Brutes (Einzelschaden, Bonus-Upgrades). R18 Gold-Ansturm (Verlangsamung, Fläche). R19 Härtetest. R20 Boss.
