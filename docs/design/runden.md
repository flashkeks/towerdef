# Runden (Runde 11: R1–20, Runde 15b: eine Liste mit 120 Runden fuer alle Karten)

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

## Nachtrag P5 (Balance-Rauchtest, 09.10.2026) — gilt vor der Tabelle oben

- **Pop-Cash 2 je Schicht** (`popCash` in `sim/data/difficulties.json`, Boss-Hülle bleibt 100). Grund: Mit 1 Gold je Schicht
  kamen die ersten Brutes (R15) bei ≈ 4.800 Gesamteinkommen — nur Stufe-2-Türme bezahlbar, jede Bot-Aufstellung ohne Held
  verlor in R15–17. Unsere 20 Runden tragen den Gegnerfortschritt von BTD6-R1–40, also gehört auch etwa dessen Einkommen dazu.
- **R17: 14 statt 16 Brutes, R19: 22 statt 26 Brutes.**
- Kumuliert (Start 650 + alle Schichten × 2 + Boni): R5 1.693 · R10 3.949 · R15 7.286 · R17 9.379 · **R20 13.448**
  (BTD6 Medium bis R40: 17.506). Ein T5 (≈ 3.700–5.800 Medium) ist damit ab etwa R15 erreichbar, wenn man darauf spart.
- Einzelwerte RBE/Schichten je Runde: Test `sim/test/data.test.ts`.

## Runde 15b — 120 Runden, 40 / 60 / 80, Freeplay (10.10.2026)

Max: „jede Welle hat dieselben Gegner immer … egal auf welcher Map … bis Runde 60 oder 80 und danach Free Play“ (Spezifikation: `karten-gegner-r15.md` §5, Nachtraege 15b und 15b-2).

- **Eine Liste** `sim/data/rounds.json` (120 Runden, alle Karten). Erzeugt von `sim/scripts/gen-rounds.mjs` (RBE-Kurve + Themen-Rotation + Einfuehrungsrunden), eingecheckt. **R1–20 = die Tabelle oben**, unveraendert.
- **Endrunde je Schwierigkeit** (`difficulties.json`, `endRound`): Easy **40**, Medium **60**, Hard **80** = Sieg + Medaille. `Game.info.maxRound` = diese Endrunde, `info.listRounds` = 120.
- **Weiterspielen:** nach dem Sieg Befehl `{ type: 'continue' }` (nur in Phase `won`), `state.freeplay = true`. Danach laeuft dieselbe Liste weiter (Easy R41 …), ab R121 die Formel. Kein Medaillen-Einfluss, Powers erlaubt.
- **Formel ab R121** (`sim/src/freeplay.ts`, `freeplayGroups(r, seed)`): Gruppen einer festen Runde 101–119 (zyklisch, Seed verschiebt den Start), Anzahl + 3,5 % je Runde (hoechstens x6), alles Schwere Fortified, Tarnung/Regrow per Seed auf einzelne Gruppen; jede 10. Runde = Finale (Gruppen von R120). Huelle ab 10 HP: x(1 + 0,04 d + 0,001 d²), d = R − 120; Tempo +0,8 % je Runde bis x2.
- **Einfuehrung:** Pink R21 · Frostling R25 · Regrow R30 · Crystal R38 · Gloomship R45 · Fortified R55 · Cruiser R82 · Duskrunner R90 · Dreadnought R100. **Bosse:** Leviathan R20, Frost Wyrm R40, Ember Colossus R60, R80 alle drei (Fortified), R100/R110/R120 Dreadnoughts (R120: 2 x Fortified + Duskrunner-Schwaerme).
- **RBE-Kurve (Ziel ohne Bosse, Anker):** R20 900 · R40 8.000 · R60 34.000 · R80 120.000 · R100 400.000 · R120 1,5 Mio. Boss-Runden haben nur halbe Begleitung. Duskrunner-Schwarm fest nach Runde (7 + 0,9 x (R−90)), weil jeder Durchbruch 444 Leben kostet.
- **Einkommen:** Pop-Gold (2 je Schicht) ab R21 gedaempft (`popBp`, nach Runde des Gegners: R40 x0,4, R80 x0,2, R120 x0,12), Rundenbonus `100 + R + 5 x (R − 20)` ueber R20. Ein T5 ist damit ab etwa R35–50 bezahlbar, wenn man darauf spart.
- **Deflation:** Start bei Ende − 10 (R30 / R50 / R70), 20.000 Gold.
