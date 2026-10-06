# Balancing-Report P2c: Ist-Stand und Kalibrierung

Grundlage: Simulator `sim/` (deterministisch, 20 Ticks/s), sechs Bots (`greedy` = bester DPS-Gewinn je Münze, `wide` = breite Unit-Mischung, `upgrade` = wenige Units hoch ausbauen, `farm` = Farm-Strategie nach §12, `aoe` = AoE-Schwerpunkt, `coop` = Rollenmix: Spieler 0 Support/Farm, übrige DPS-Schwerpunkte), je Zelle 200 Runs (Seeds 1-200), Stage `standard20`, Infinite 200 Runs bis Wave 100. Rohdaten: `docs/balancing/runs/vorher-*` und `nachher-*` (`.md` mit Wave-Tabellen und Leak-Quellen je Zelle, `.csv`). Alle Konstantenänderungen: `kalibrierung.md`. Reproduktion: `cd sim && npm run sim -- --matrix --runs 200 --name nachher-matrix --no-svg`.

Hinweis zu "bester Bot": Maximum über die sechs Bots je Zelle. `coop` ist im Solo-Spiel identisch zu `farm`.

## Ergebnis in Kürze

- Normal solo: bester Bot 100 % → **95 %** (greedy), Verluste fast nur im Final-Boss-Wave 20.
- Hard solo 17 % → **58 %**, Nightmare solo 0 % → **39 %** (bester Bot).
- Koop: vorher Hard 4P 100 % gegenüber Solo 17 %; nachher bei greedy und wide innerhalb von etwa +-20 Punkten, bei Normal und Hard 2P im Band +-10; `upgrade` im Koop weiterhin zu stark (siehe Zielerreichung).
- Farm-Strategie: Anteil am Einkommen 16 % → **26 %**, Payback 10,7 → **9,0 Waves**, Siegquote Normal solo 88 % (greedy 95 %).
- Infinite: Median-Endwave greedy 32 → **30**, farm 29 → **31**.
- Stage-Dauer weiter ca. 11-13 Minuten (Ziel ca. 15): nicht erreicht.

## Messungen vorher / nachher

### Siegquote in % (200 Runs je Zelle)

Vorher:

| Bot | norm 1P | norm 2P | norm 4P | hard 1P | hard 2P | hard 4P | nigh 1P | nigh 2P | nigh 4P |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| greedy | 100 | 100 | 100 | 2 | 53 | 100 | 0 | 0 | 0 |
| wide | 100 | 100 | 100 | 17 | 66 | 100 | 0 | 0 | 0 |
| upgrade | 100 | 100 | 100 | 0 | 22 | 7 | 0 | 0 | 0 |
| farm | 58 | 36 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| aoe | 48 | 52 | 11 | 0 | 0 | 0 | 0 | 0 | 0 |
| coop | 58 | 100 | 100 | 0 | 20 | 14 | 0 | 0 | 0 |
| **bester Bot** | **100** | **100** | **100** | **17** | **66** | **100** | **0** | **0** | **0** |

Nachher:

| Bot | norm 1P | norm 2P | norm 4P | hard 1P | hard 2P | hard 4P | nigh 1P | nigh 2P | nigh 4P |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| greedy | 95 | 87 | 80 | 58 | 69 | 38 | 30 | 46 | 11 |
| wide | 84 | 86 | 91 | 52 | 60 | 46 | 39 | 36 | 16 |
| upgrade | 46 | 97 | 100 | 31 | 95 | 100 | 15 | 92 | 100 |
| farm | 88 | 20 | 0 | 28 | 3 | 0 | 20 | 0 | 0 |
| aoe | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| coop | 88 | 100 | 13 | 28 | 64 | 2 | 20 | 36 | 1 |
| **bester Bot** | **95** | **100** | **100** | **58** | **95** | **100** | **39** | **92** | **100** |

### Verlustrate je Wave (Anteil aller Runs, die in Wave n verlieren), Waves 10-20

| Zelle | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | Summe 15-20 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| vorher greedy normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 % |
| vorher wide normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 % |
| vorher farm normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 41.5 | 41.5 % |
| vorher greedy hard 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.5 | 1.0 | 0.0 | 0.0 | 97.0 | 98.5 % |
| vorher wide hard 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 1.5 | 1.0 | 0.0 | 80.5 | 83.0 % |
| vorher wide nightmare 1P | 65.0 | 2.5 | 0.5 | 1.0 | 1.0 | 2.5 | 22.0 | 5.0 | 0.5 | - | - | 30.0 % |
| nachher greedy normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 5.0 | 5.0 % |
| nachher wide normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 16.0 | 16.0 % |
| nachher farm normal 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 12.0 | 12.0 % |
| nachher greedy hard 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 42.0 | 42.0 % |
| nachher wide hard 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 48.0 | 48.0 % |
| nachher wide nightmare 1P | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 61.0 | 61.0 % |

(Prozent aller Runs; "Summe 15-20" = Anteil Runs, die in Waves 15-20 verlieren.)

### Geldkurve (greedy, normal, solo): Münzen am Wave-Ende und Einkommen je Wave (Median; P10-P90 der Münzen)

| Wave | vorher Münzen med (P10-P90) | vorher Einkommen | nachher Münzen med (P10-P90) | nachher Einkommen |
|---:|---:|---:|---:|---:|
| 1 | 195 (177-195) | 195 | 195 (177-195) | 195 |
| 3 | 343 (301-392) | 248 | 343 (301-392) | 248 |
| 5 | 204 (168-315) | 443 | 198 (159-328) | 443 |
| 8 | 255 (215-307) | 581 | 245 (188-375) | 581 |
| 10 | 1000 (355-1065) | 1021 | 1022 (951-1063) | 1021 |
| 12 | 441 (192-473) | 824 | 437 (210-472) | 824 |
| 15 | 421 (340-524) | 982 | 390 (233-567) | 982 |
| 18 | 442 (368-508) | 1289 | 334 (231-558) | 1073 |
| 20 | 1156 (146-1465) | 1591 | 958 (21-1265) | 1343 |

Einkommen = Kill-Bounty + Wave-Bonus (+ Farm); das Einkommen ist durch die gekoppelte Änderung von g und γ-Decay (#2/#3) praktisch unverändert (Soll laut §5: 245/441/1 021/979/1 591 für Waves 1/5/10/15/20).

### Farm-Anteil am Einkommen und Payback (Farm-Bot)

| Zelle | vorher Farm-Anteil | vorher Payback (Waves) | nachher Farm-Anteil | nachher Payback (Waves) |
|---|---:|---:|---:|---:|
| farm normal 1P | 16.4 % | 10.7 | 25.9 % | 9.0 |
| farm normal 2P | 13.7 % | 9.8 | 20.2 % | 8.3 |
| farm normal 4P | 7.6 % | 8.4 | 10.7 % | 6.4 |
| farm hard 1P | 19.3 % | 11.8 | 26.0 % | 9.5 |
| farm hard 2P | 17.8 % | 9.5 | 21.2 % | 8.5 |
| farm hard 4P | 10.6 % | 8.5 | 11.8 % | 6.4 |
| farm nightmare 1P | 24.9 % | 13.3 | 25.9 % | 9.0 |
| farm nightmare 2P | 23.7 % | 11.2 | 21.6 % | 8.6 |
| farm nightmare 4P | 13.5 % | 8.9 | 11.9 % | 6.4 |

### Upgrade- gegen Platzierungsanteil (Münzen) und Stage-Dauer, normal, solo

| Bot | Upgrade-Anteil vorher | nachher | Dauer Minuten (Median) vorher | nachher |
|---|---:|---:|---:|---:|
| greedy | 53 % | 52 % | 11.4 | 12.6 |
| wide | 42 % | 43 % | 11.4 | 12.6 |
| upgrade | 81 % | 80 % | 10.7 | 11.4 |
| farm | 59 % | 63 % | 10.5 | 11.6 |
| aoe | 58 % | 54 % | 10.3 | 11.0 |
| coop | 59 % | 63 % | 10.5 | 11.6 |

Upgrade-Anteil nach Spielerzahl (nachher, greedy normal): 1P 52 %, 2P 71 %, 4P 83 %. Im Koop steigt er stark (Slots sind geteilt, Geld ist reichlich).

### Infinite (normal, solo, 200 Runs, Abbruch Wave 100)

| Bot | vorher Median (P10-P90) | nachher Median (P10-P90) |
|---|---:|---:|
| greedy | 32 (28-41) | 30 (22-31) |
| farm | 29 (21-31) | 31 (21-31) |

## Kalibrierte Startwerte (geänderte und wichtige Werte, Stand wie §18)

| Parameter | §18-Startwert | kalibriert | Datei |
|---|---|---|---|
| Gegner-HP Grunt | 25 · 1,12^(n-1) (W20: 215) | 25 · 1,1525^(n-1) (W20: 371) | `enemies.json` hpCurve |
| Kill-Bounty γ(n) | 0,70 · 0,92^(n-1) | 0,70 · 0,894^(n-1) (Einkommen bleibt wie §3, 15 923 M über 20 Waves) | `economy.json` bounty |
| Boss-Leak | 50 | 34 (Elite 10, Brute 3, Flyer 2, Grunt/Runner 1 unverändert) | `economy.json`, `enemies.json` |
| Hard | HP x1,4, Speed x1,1 | HP x1,03, Speed x1,0, Elemente aktiv | `difficulties.json` |
| Nightmare | HP x2,0, Speed x1,2 | HP x1,07, Speed x1,0, Elemente aktiv | `difficulties.json` |
| Koop-HP-Faktor h(n) | 1 + 0,75 (n-1) | 1 + 1,10 (n-1) | `economy.json` coop |
| Farm-Ertrag je Stufe | 50/90/135/205/310 | 65/117/176/267/403 | `units.json` |
| Infinite-Pool je Wave | 32 Grunt-Äquivalente (Boss-Wave 45) | 14 (Boss-Wave 38 = Boss + Elite) | `economy.json` infinite |
| Infinite Speed / Gegner-Limit | +1 %/Wave bis x1,5 / 60 | unverändert | `economy.json` infinite |
| Unverändert | Startgeld 1 000, Wave-Bonus 100 + 5n, Base-HP 100, Platzierungs-/Upgradekosten, Unit-DPS, Rüstung, Caps, Verkauf 60/40 %, Timer 45 s | | |

Die Schwierigkeitsfaktoren Hard x1,03 und Nightmare x1,07 wirken klein, sind aber im Simulator der Bereich, in dem die Siegquote von ~95 % auf 58 % und 39 % fällt; die Kennlinie Siegquote gegen HP-Faktor ist sehr steil (siehe "Was der Simulator nicht beantworten kann"). Für das Spielgefühl der Stufen müssen zusätzliche Hebel (Modifier, Elemente, mehr Boss-Mechanik) getestet werden, nicht nur Zahlen.

## Zielerreichung je §19-Punkt

| # | Punkt | Ziel | Stand | Status |
|---|---|---|---|---|
| 1 | Kapazitätsfaktor 0,025 DPS/Münze, 20 s | reale Verteidigung 1,5-3 x Modell | Die Gegner-HP musste für das Normal-Ziel bis Wave 20 auf x1,72 steigen (bei gleichem Einkommen) | erreicht (innerhalb 1,5-3 x) |
| 2 | g = 1,12, Basis 25, Leak-Rate je Wave, Boss-Waves | Verlustrate 10-20 % im späten Abschnitt | g = 1,1525; Verlustrate Waves 15-20 (Normal solo): greedy 5 %, wide 16 %, farm 12 % (nur Wave 20). Siegquote greedy 95 %, wide 84 % | erreicht (wide, farm im Band; greedy 5 % leicht darunter) |
| 3 | Einkommenskonstanten, Münzen bei Wave 5/10/20 | +-15 % zur §5-Tabelle | Einkommen Wave 5/10: 443/1 021 (Soll 441/1 021); Wave 15: 982 (979); Wave 18-20 greedy 1 073/1 343 (Soll 1 302/1 591, -18 %/-16 %: geleakte Gegner zahlen keine Bounty, Boss-Kill erst spät) | erreicht (Konstanten); Wave 18-20 bei Leaks im Median knapp außerhalb +-15 % |
| 4 | Rüstungswerte (Brute 20, Elite 30, Boss 40) und Pen | Wirkung Single gegen AoE | Rüstung unverändert. Befund: reine AoE-Strategie (`aoe`-Bot) 0-2 % Siegquote auf Normal, bleibt auch bei +25 % AoE-Schadensanteil schwach (Flyer-Waves und Boss entscheiden, Blaster trifft keine Flyer) | Befund, nicht kalibriert |
| 5 | Grenz-Effizienz (Upgrade gegen Zweit-Unit) | Upgrades nicht zu stark bevorzugt | Upgrade-Anteil der Münzen Solo 43-63 % (greedy 52 %). Der reine Upgrade-Bot ist Solo schwächer als greedy (46 % gegen 95 %), im Koop aber mit 97-100 % am stärksten (Slots geteilt, Geld reichlich) | teilweise (Solo ok, Koop auffällig) |
| 6 | Farm: Payback 8-9,5, Cap 2, Anteil 25-35 %, Fenster Wave 9-12 | | Payback 9,0, Anteil 25,9 % (Normal solo), Cap 2 unverändert. Im Team sinkt der Anteil (2P 20 %, 4P 11 %: nur 3 große Farm-Slots für alle). Spieleranteil, der Farm überspringt: nicht messbar | erreicht (Solo); Fenster/Verhalten nicht messbar |
| 7 | Flyer (Speed 1,3, Waves 8/11/14/16/18) | Verlustrate Flyer- gegen Boden-Waves | Flyer = 33 % der Leaks (Anteil nach Gegnertyp, greedy-Zellen), Chip-Leaks vor allem Waves 14/16/18. Kein Einzel-Verlust, aber Haupttreiber des Basisverlusts | teilweise gemessen |
| 8 | Placement-Caps 5/4/3/2 | Cap-Erreichen, ungenutztes Geld | Nicht gezielt gemessen (Münzen am Wave-Ende im Median 200-450, kein dauerhafter Geldstau) | nicht gemessen |
| 9 | Verkauf 60/40 % | Umbau-Häufigkeit, Exploits | Bots verkaufen praktisch nur Farm spät; Exploit-Prüfung nicht abgedeckt | nicht messbar |
| 10 | Koop h(n) | Siegquote je Spielerzahl +-10 Punkte | wide: Normal 84/87/91, Hard 52/61/47, Nightmare 39/36/16 (1P/2P/4P); greedy: Normal 95/87/80, Hard 58/69/38, Nightmare 31/46/11; `upgrade` und `coop` weichen stark ab (upgrade 46 → 97-100 %, coop 4P 13 %). Das Maximum über Bots im Koop bleibt bei 92-100 %. Spenden werden nur vom `coop`-Bot genutzt | teilweise (Normal/Hard mit wide, greedy ok; Nightmare 4P zu schwer; upgrade im Koop zu stark) |
| 11 | Wave-Timer 45 s, Dauer ca. 15 min | | Median 11-13 Minuten (greedy 12,6; Waves enden meist früh, weil alles tot/geleakt ist). Skip-Mehrheit nicht ausgewertet | nicht erreicht |
| 12 | Hard x1,4 / Nightmare x2,0 | bester Bot Hard 50-70 %, Nightmare 20-40 % | Hard 58 %, Nightmare 39 % (mit HP x1,03/x1,07, siehe oben) | erreicht (Zahlen weichen stark von §4 ab) |
| 13 | Infinite: Median-Endwave 30-40, Entity-Zahl | 30-40 | greedy 30 (P10-P90 22-31), farm 31 (21-31); Gegner-Limit 60 eingehalten; Browser-FPS nicht messbar | erreicht (unterer Rand; Wand = Boss Wave 30) |
| 14-16 | Gacha, Traits, Meta-Faktor | | nicht im Simulator | nicht messbar |
| 17 | CC-Sperren, Boss-CC | | Stun-Dauer-Dauerstun nicht untersucht | nicht gemessen |
| 18 | Elemente ab Hard | Teambau-Zwang | Bots wählen Units nicht nach Gegner-Element; Hard-Verlust bei HP x1,0 (88/80 %) fast gleich Normal (91-95/83 %): Elemente wirken im Mittel neutral | nicht aussagekräftig (Bot-Grenze) |
| 19 | Level-Kurven | | nicht im Simulator | nicht messbar |
| 20 | Buff-Caps | | Banner-Aura wird genutzt, Spitzen-DPS im Koop nicht ausgewertet | nicht gemessen |
| 21 | Sichtbarkeit der Zahlen | | UX-Thema | nicht messbar |

## Was der Simulator nicht beantworten kann

- **Spielgefühl und Spannung**: Die Bots spielen nahezu deterministisch; die Siegquote ist darum eine sehr steile Funktion der Gegnerstärke (x1,00 → 88 %, x1,05 → 42 %). Reale Spieler streuen breiter, die gleiche Einstellung gibt dort flachere Kennlinien.
- **Lesbarkeit und Bedienung**: Platzierungs-/Upgrade-UI, Anzeige von Zahlen (§19 #21), Wave-Vorschau.
- **Menschliche Fehler und Lernkurve**: Bots machen keine Platzierungsfehler, kennen die Waves (Bots nutzen Wissen über die Luft-Waves) und überlegen nicht. Die Bot-Qualität ist grob eine **Obergrenze** für Gelegenheitsspieler (perfekte Buchführung, kein Zögern) und eine **Untergrenze** für Experten (keine Slot-Geometrie, keine Targeting-Wechsel im Kampf, kaum Verkäufe/Umbauten, keine Element-Teamwahl, Fähigkeiten nach festen Regeln).
- **Soziale Dynamik im Koop**: Absprache, Spenden, Rollenwahl, Slot-Konkurrenz; die Bots teilen Slots nach Reihenfolge, nicht nach Plan. Deshalb sind die Koop-Zahlen je Bot sehr unterschiedlich.
- **Meta-Progression** (Level, Traits, Gacha, Sterne): nicht im Kern; Unit-Werte sind Basiswerte ohne Meta-Faktor (§15).
- **Flyer-/Boss-Mechanik jenseits der Zahlen**: Boss-Fähigkeiten, Telegraphing, Spawn-Muster mit Ausweichmöglichkeit existieren nicht.
- **Retention und Monetarisierung** (Gacha-Zufluss, Zeit bis Mythic): keine Aussage.
- **Seed-Abdeckung**: 200 Runs je Zelle geben +-3 Punkte Standardfehler; einzelne Zellen am Klippenrand (z. B. greedy Hard 4P) schwanken zwischen Messungen um bis zu 10-15 Punkte.

## Auffälligkeiten für die weitere Arbeit

- AoE-Build (Blaster/Lancer/Frost) ist ohne Einzelziel-/Luft-Unterstützung nicht spielbar (0-2 %). Entweder als Teamrolle gedacht (dann Koop-Bots anpassen) oder AoE aufwerten.
- `upgrade`-Bot im Koop 97-100 % bei Hard/Nightmare: Upgrades skalieren mit der Spielerzahl stärker als die HP-Faktoren (4 Spieler besitzen 4 x so viel Upgrade-Budget auf denselben Slots). Hebel: Upgrade-Kosten im Koop, Slot-Zahl oder getrennte HP-Skalierung.
- Chip-Leaks (Flyer Waves 14/16/18, Runner) bestimmen den Base-Verlust stärker als der Boss; die Leak-Werte (Flyer 2, Runner 1) sind für das Verlustprofil wichtiger als die Boss-HP.
- Die Schwierigkeitsstufen unterscheiden sich im Simulator nur um wenige Prozent HP; das reicht für die Zielwerte, sollte aber durch qualitative Unterschiede (Modifier, Elemente) ergänzt werden.

## Risiken


Content-Sanity (P3): Grenzfälle mit eigenen Experiment-Skripten in `sim/scripts/sanity/` (`lib.ts` = Runner mit Data-Override/`unitMods`/`godMode`, `q1-dominant.ts`, `q1b-top3.ts`, `q2-roles.ts`, `q3-boss-stun.ts`, `q4-multipliers.ts`, `q5-perf.ts`, `q6-hp-curve.ts`; Aufruf `npx tsx scripts/sanity/<datei>`). Die Experiment-Bots spielen nur über `sim.apply` (greedy-Policy, eingeschränkt auf erlaubte Unit-Typen). **Kern und `sim/data/` sind unverändert**; alle Vorschläge sind DESIGN und nicht umgesetzt. Stichproben: 40-100 Runs je Zelle (Standardfehler bis +-7 Punkte bei n = 50), Seeds 1..n. Alle Bots haben Wissen über die Waves und keine menschlichen Fehler (siehe "Was der Simulator nicht beantworten kann").

Übersicht:

| # | Frage | Risiko | Kern |
|---|---|---|---|
| 1 | Dominante Strategie | **hoch** | "Titan + Lancer + Frost" (nur Legendary/Mythic, voll ausgebaut) gewinnt alle 6 Zellen (3 Schwierigkeiten x 1P/4P) zu 100 % und schlägt den besten Registry-Bot; Hebel ist der Frost-Slow/-Stun, nicht der Schaden |
| 2 | Nutzlose Rolle | **mittel** | Striker ist eine Falle (Verbot hebt greedy um +30/+55 Punkte), Banner und Lancer bringen im Mittel nichts, Frost/Farm werden von greedy nie bzw. selten gekauft |
| 3 | Dauer-Stun auf Bosse | **niedrig** (Stun), **mittel** (Slow) | Stun-Anteil höchstens 9,1 % (Theorie 11,1 %); aber -40 % Tempo fast die ganze Boss-Lebenszeit |
| 4 | Trait/Buff-Stack | **hoch** (Multiplikator), niedrig (Buff-Caps) | Nightmare kippt bei x1,10-1,15 auf ~100 %; Buff-Caps greifen mit dem heutigen Inhalt nie |
| 5 | Performance Infinite | **niedrig** | 23 000 Ticks/s im Stress (60 Units, 80 Gegner) gegen 60 benötigt; max. 4,4 ms/Tick |
| 6 | Messerschneide | **mittel** | 90 -> 10 % Siegquote auf ~14-15 Prozentpunkten HP; Schwierigkeitsstufen liegen nur 4-7 Punkte HP auseinander |

### 1. Dominante Strategie?

**Methode.** Je Bot 50 Runs je Zelle (normal/hard/nightmare x 1P/4P, im Koop spielen alle vier Spieler denselben Bot). Registry-Bots als Referenz; Experiment-Bots: Mono-Unit je Typ (Cap begrenzt die Stückzahl: Striker 5, Gunner 5, Blaster 4, Lancer 3, Frost 3, Titan 2), "Spam der billigsten" (Rare: Striker + Gunner), Titan + Banner, "Top-Rarity" (Titan + Lancer + Frost). Vertiefung `q1b-top3.ts` (n = 40): Teilmengen, Fähigkeiten abgeschaltet, Headroom gegen globalen HP-Faktor.

**Messwerte** (Siegquote %, Wave-Median in Klammern nur wo < 20):

| Bot | normal 1P | normal 4P | hard 1P | hard 4P | nightmare 1P | nightmare 4P |
|---|---:|---:|---:|---:|---:|---:|
| greedy (Reg) | 92 | 82 | 56 | 44 | 38 | 20 |
| wide (Reg) | 86 | 90 | 48 | 48 | 40 | 20 |
| upgrade (Reg) | 34 | 100 | 28 | 98 | 16 | 100 |
| farm (Reg) | 90 | 0 | 24 | 0 | 18 | 0 |
| aoe (Reg) | 0 | 0 | 2 | 0 | 0 | 0 |
| coop (Reg) | 90 | 16 | 24 | 0 | 18 | 0 |
| **bester Registry-Bot** | 92 | 100 | 56 | 98 | 40 | 100 |
| mono Striker | 0 (13) | 0 (12) | 0 (11) | 0 (11) | 0 (11) | 0 (11) |
| mono Gunner | 0 (17) | 0 (14) | 0 (13) | 0 (12) | 0 (13) | 0 (11) |
| mono Blaster | 0 (16) | 0 (15) | 0 (18) | 0 (14) | 0 (17) | 0 (14) |
| mono Lancer | 0 (17) | 0 (16) | 0 (14) | 0 (14) | 0 (14) | 0 (14) |
| mono Frost | **100** | **100** | 10 | 42 | 2 | 18 |
| mono Titan | 0 (13) | **100** | 0 (13) | **100** | 0 (13) | **100** |
| Titan + Banner | 0 (11) | 0 (14) | 0 (11) | 0 (15) | 0 (11) | 0 (14) |
| Spam Rare (Striker + Gunner) | 0 (18) | 0 (15) | 0 (15) | 0 (14) | 0 (15) | 0 (13) |
| **Titan + Lancer + Frost** | **100** | **100** | **100** | **100** | **100** | **100** |

Vertiefung (Nightmare 1P, n = 40):

| Erlaubte Units | Sieg % | Sieg % ohne Fähigkeiten |
|---|---:|---:|
| Titan + Lancer + Frost | 100 | 12,5 |
| Titan + Frost | 100 | 0 |
| Lancer + Frost | 100 | 65 |
| Blaster + Frost | 95 | 92,5 |
| Gunner + Frost | 35 | 15 |
| Striker + Gunner + Blaster + Frost | 2,5 | 0 |
| Titan + Lancer / Titan / Lancer | 0 | 0 |

Headroom (Nightmare 1P, globaler HP-Faktor, Sieg %): greedy 40 / 2,5 / 0 bei x1,0 / 1,1 / 1,2; Titan + Lancer + Frost 100 / 97,5 / 85 / 70 / 7,5 bei x1,0 / 1,1 / 1,2 / 1,3 / 1,5; Titan + Frost 100 bis x1,3, 77,5 % bei x1,5.

**Befund (Risiko hoch).** Eine dominante Strategie existiert: **wenige Legendary/Mythic-Units voll ausgebaut plus Frost**. Sie schlägt auf allen sechs Zellen jeden Registry-Bot (auf Nightmare 1P 100 % gegen 40 %) und hat 30 % HP Reserve, wo greedy bei +10 % bereits bei 2,5 % liegt. Ursachen: (a) **Frost-Slow (-40 % für 4 s, Kegel) ist ein Multiplikator für alle Units** (Zeit in Reichweite x1,67), den der greedy-Bewertungsansatz (Frost = 50 % DPS-Anteil) nicht sieht; greedy kauft Frost im Solo nie (0 %); (b) die Fähigkeiten (Stun, Nuke) sind entscheidend: ohne sie fällt Titan + Frost von 100 auf 0 %; (c) im Koop **multiplizieren die Cap je Spieler die Mythics**: Mono-Titan (8 Titan-Nukes im 4P-Team, True Damage, 45 s) gewinnt 100 % auf allen Stufen, obwohl er Solo 0 % hat (gleiche Ursache wie `upgrade` 98-100 % im Koop, siehe "Auffälligkeiten"). Gegenbefund: Reine Mono-Builds (außer Frost auf Normal) und Spam der billigen Rares scheitern; es gibt keine Strategie, die ohne Frost/Titan trägt, und "Titan + Banner" verliert überall (Banner trägt nichts, Titan allein reicht nicht).

**Vorschlag (DESIGN).**
- Frost-Slow nicht als Gruppen-Multiplikator: Slow nur auf das Primärziel (statt Kegel), oder Slow -25 % statt -40 %, oder Diminishing Returns für wiederholten Slow (Slow wirkt mit Cooldown pro Gegner wie der Stun). Zielwert: Titan + Lancer + Frost darf auf Nightmare höchstens ~60 % haben, damit die Mischung des Bots (greedy ~40 %) konkurrenzfähig bleibt.
- Mythic-Cap im Koop **team-weit** (z. B. 2 Titans je Team plus 1 je weiterem Spieler) oder Nuke-Abklingzeit/-Schaden mit der Zahl der Titans im Team skalieren (Nuke-Ziel-Sperre: derselbe Gegner höchstens einmal je 10 s).
- Nach jeder Änderung `q1-dominant.ts` und `q1b-top3.ts` wiederholen (Akzeptanz: kein Experiment-Bot > bester Registry-Bot + 10 Punkte in mehr als einer Zelle).

### 2. Nutzlose Unit-Rolle?

**Methode.** (a) Beitrag: greedy-Läufe (n = 60) mit Schaden je Unit-Typ aus den `damage`-Events, investierte Münzen aus `place`/`upgrade`-Events. (b) Leave-one-out: greedy mit verbotenem Typ (n = 80), 1P und 4P. Farm: greedy kauft nie Farm (Farm-Schritt nur im `farm`-Bot), daher Referenz `farm`-Bot gegen greedy.

**Messwerte (a)**, greedy, Münz- und Schadensanteil in %, Schaden je Münze in HP:

| Unit | normal 1P gekauft % | Münzen % | Schaden % | Schaden/Münze | hard 4P gekauft % | Münzen % | Schaden % | Schaden/Münze |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Striker | 100 | 20,4 | 15,3 | 4,0 | 100 | 37,1 | 18,0 | 2,6 |
| Gunner | 100 | 26,7 | 31,4 | 6,3 | 100 | 24,3 | 13,0 | 2,8 |
| Blaster | 100 | 27,4 | 25,0 | 4,9 | 97 | 17,6 | 21,8 | 6,5 |
| Banner | 100 | 12,9 | 0 (Buff) | - | 17 | 0,8 | 0 (Buff) | - |
| Lancer | 33 | 1,7 | 2,0 | 6,4 | 20 | 1,0 | 0,7 | 3,9 |
| Frost | **0** | 0 | 0 | - | 22 | 1,2 | 1,9 | 8,0 |
| Titan | 100 | 10,9 | 26,3 | **12,9** | 100 | 18,0 | 44,7 | **13,1** |
| Farm | 0 (nicht in greedy) | - | - | - | 0 | - | - | - |

(Hard/Nightmare 1P wie Normal 1P: Titan 24 %/23 % Schaden bei 9 %/8,5 % der Münzen, Lancer 45 %/53 % der Läufe gekauft.)

**Messwerte (b)**, Siegquote % greedy ohne Typ (Δ in Punkten):

| Variante | normal 1P | normal 4P | hard 1P | hard 4P | nightmare 1P | nightmare 4P |
|---|---:|---:|---:|---:|---:|---:|
| greedy (Basis) | 92,5 | 80 | 58,8 | 45 | 35 | 17,5 |
| ohne Striker | 100 (+7,5) | 100 (+20) | 88,8 (+30) | 100 (+55) | 57,5 (+22,5) | 95 (+77,5) |
| ohne Gunner | 12,5 (-80) | 61 (-19) | 0 (-59) | 36 (-9) | 0 (-35) | 10 (-7,5) |
| ohne Blaster | 3,8 (-89) | 94 (+14) | 0 (-59) | 30 (-15) | 0 (-35) | 7,5 (-10) |
| ohne Banner | 92,5 (0) | 76 (-4) | 62,5 (+4) | 42,5 (-2,5) | 35 (0) | 12,5 (-5) |
| ohne Lancer | 98,8 (+6) | 80 (0) | 65 (+6) | 52,5 (+7,5) | 46 (+11) | 13,8 (-4) |
| ohne Frost | 92,5 (0) | 76 (-4) | 58,8 (0) | 40 (-5) | 35 (0) | 8,8 (-9) |
| ohne Titan | 1,3 (-91) | 0 (-80) | 2,5 (-56) | 0 (-45) | 0 (-35) | 0 (-17,5) |
| Referenz `farm`-Bot | 88,8 (-4) | 0 (-80) | 25 (-34) | 0 (-45) | 17,5 (-17,5) | 0 (-17,5) |

**Befund (Risiko mittel).**
- **Titan ist unverzichtbar** (Verbot: 0-2,5 % in allen sechs Zellen) und der effizienteste Schadensträger (13-15 Schaden je Münze, 3x Striker), Gunner/Blaster sind im Solo unverzichtbar (Gunner: einzige günstige Luft-Unit, `canHitAir` = Hügel/Hybrid; Blaster: einzige Fläche mit Burn). Das ist eine klare, aber enge Rollenverteilung: Verbot einer von drei Units = Niederlage.
- **Striker ist eine Falle**: schlechtester Schaden je Münze (2,6-4,0), und sein Verbot hebt greedy deutlich (hard 4P 45 -> 100 %, nightmare 4P 17,5 -> 95 %). Im Koop wirkt er als Geldsenke (37 % der Münzen bei 18 % Schaden; Bleed zählt nur halb auf Boss/Elite, Single-Target 70 % DPS-Anteil). Ein Spieler, der Striker als "Einsteiger-Unit" ausbaut, bestraft sich.
- **Banner und Lancer sind im Mittel ersetzbar** (Verbot -5 bis +11 Punkte): Banner-Buff +10 bis +40 % ist im Solo keinen Slot wert, Lancer wird in 0-53 % der Läufe gekauft (Pen 40 gegen Rüstung 20-40 kaum nötig, Slots knapp). Beide haben aber in Q1 hohen Wert in Kombination (Lancer + Frost 100 %), die greedy nicht erkennt.
- **Frost** wird im Solo nie gekauft (Bewertungsproblem des Bots, nicht der Unit, siehe Q1), im 4P zu 22-27 %. **Farm** ist durch den Farm-Bot nicht nötig (88,8 gegen 92,5 %), kostet im Koop aber alles (0 %): Farm lohnt nur, wenn die Slots reichen (3 große Slots für alle).
- "Nie gekauft, fehlt nicht": Banner (Solo), Lancer, Frost (greedy), Farm (greedy).

**Vorschlag (DESIGN).**
- Striker aufwerten (DPS-Anteil 70 -> 85 %, Bleed 0,6x -> 1,0x in 6 s, Boss/Elite-DoT-Malus nur 0,75 statt 0,5) **oder** Preis senken; Zielwert Schaden je Münze >= 5.
- Banner im Solo attraktiv machen: Aura +15 % ab Stufe 0 oder Zusatzeffekt Tempo +10 % (die Formel hat bereits Tempo-Cap +60 %, Range +30 %, aber keine Quelle: §27 offene Regeln); sonst bleibt Banner eine reine Koop-Rolle (dann dort messen).
- Lancer: Pen 40 auf Rüstungsgegner sichtbar machen (Brute 20/Elite 30/Boss 40: höhere Rüstung Brute 30, Elite 45) oder ihm eine eigene Luft-Eignung geben; aktuell ist er im Mittel nur ein teurerer Blaster.
- Bots: greedy-Bewertung um Slow-/CC-Wert erweitern, bevor die Rollen final bewertet werden (sonst sind Frost/Lancer künstlich "nutzlos").

### 3. Dauer-Stun auf Bosse?

**Methode.** `q3-boss-stun.ts`: godMode, Startgeld 400 000, Frost-Units (Cap 3 je Spieler) voll ausgebaut auf den Slots mit der größten Pfadabdeckung für Radius 2,5 Tiles; die Fähigkeit wird **in jedem Tick** ausgelöst, sobald sie bereit ist (Maximal-Stun-Spiel, schlechter als jeder Mensch). Je Boss (Wave 10 und 20) werden Stun-, Slow- und Sperre-Ticks gezählt.

**Messwerte.**

| Aufbau | Boss | Lebenszeit s | Stun % | Slow % | Sperre % | längster Stun s | Abstand Stun-Ende -> nächster Stun s | Laufzeit-Faktor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1P, 3 Frost | W10 | 28,4 | 2,6 | 82,2 | 21,2 | 0,8 | - | 1,5 |
| 1P, 3 Frost | W20 | 80,4 | 1,9 | 74,5 | 14,9 | 0,8 | 26,4 | 1,4 |
| 4P, 12 Frost (Cap) | W10 | 24,6 | 9,1 | 98,6 | 51,4 | 0,8 | 6,0 | 1,8 |
| 4P, 12 Frost (Cap) | W20 | 100,3 | 8,2 | 99,1 | 65,8 | 0,8 | 6,0 | 1,8 |
| 4P, 12 Frost + 2 Titan/3 Striker/3 Gunner je Spieler | W10 | 16,8 | 9,0 | 98,2 | 56,7 | 0,8 | 6,0 | 1,8 |
| 4P, 12 Frost + 2 Titan/3 Striker/3 Gunner je Spieler | W20 | 72,5 | 8,3 | 99,7 | 66,2 | 0,8 | 6,0 | 1,8 |

Theorie: Boss-Stun 1,5 s x 0,5 = 0,75 s (15 Ticks), danach 6 s Sperre (die Sperre beginnt, wenn der Stun endet), Zyklus 6,75 s = höchstens 11,1 % Stun-Anteil. "Laufzeit-Faktor" = Lebenszeit / Lebenszeit ohne CC (1,8 = 1/(0,6 x 0,91)).

**Befund.** **Dauer-Stun ist nicht möglich** (Risiko niedrig): auch mit allen 12 Frosts im 4P-Koop sind es höchstens 9,1 % Stun-Anteil, nie mehr als 0,8 s am Stück, der Mindestabstand zwischen zwei Stuns beträgt exakt 6,0 s; die CC-Sperre und die halbe Boss-Dauer greifen wie spezifiziert (Regel #13 in `offene-regeln.md` verhindert Refresh während der Sperre). **Aber der Slow ist praktisch dauerhaft** (Risiko mittel): Frost-Treffer erneuern den Slow ständig, die Halbierung der Boss-Dauer (Slow 4 s -> 2 s) wird dadurch wirkungslos; der Boss ist 75-82 % (3 Frosts) bis 99 % (12 Frosts) der Zeit mit -40 % Tempo unterwegs und braucht 1,4-1,8-fach so lange. Das erklärt, warum Frost in Q1 so stark ist, und ist im Rahmen des Slow-Caps (-60 %), der nie erreicht wird (nur eine Slow-Quelle, "stärkster gewinnt").

**Vorschlag (DESIGN).** Boss-Slow wirksam begrenzen: Slow auf Bossen mit eigener Sperre (z. B. 2 s Slow, dann 4 s Immunität) oder Boss-Slow-Stärke x0,5 (-20 %); Stun-Regeln unverändert lassen. Alternativ die Boss-Dauer-Regel auf "Slow auf Boss: halbe Stärke" statt "halbe Dauer" umstellen.

### 4. Macht ein Trait oder Buff-Stack das Spiel kaputt?

**Methode.** `q4-multipliers.ts`. (A) Alle Units aller Spieler mit Multiplikator `lvlBp` bzw. `traitBp` (additiv), greedy, n = 60. (B) Trait +50 % auf nur einem Unit-Typ (n = 80). (C) Banner-Stacks: Titan-Schaden in 45 s ohne Kills (Gegner-HP x1000, godMode) relativ zum Lauf ohne Banner; zusätzlich synthetisch `banner2..4` (Data-Override mit Kopien des Banners = verschiedene Buff-IDs).

**Messwerte A** (Siegquote %):

| Multiplikator (lvlBp) | nightmare 1P | nightmare 4P | hard 1P | hard 4P |
|---|---:|---:|---:|---:|
| x1,00 | 31,7 | 21,7 | 51,7 | 43,3 |
| x1,05 | 70 | 51,7 | 91,7 | 88,3 |
| x1,10 | 90 | 90 | 100 | 98,3 |
| x1,15 | **100** | **100** | 100 | 100 |
| x1,20 bis x2,50 | 100 | 100 | 100 | 100 |

Trait additiv (alle Units, Nightmare): +10 % 90/90 % (1P/4P), +20 % und mehr 100/100 %.

**Messwerte B** (nightmare, Trait +50 % nur auf einem Typ, Siegquote 1P / 4P, Basis 35 / 17,5 %):

| Typ | 1P | 4P |
|---|---:|---:|
| Striker | 76,3 | 47,5 |
| Gunner | 100 | 48,8 |
| Blaster | 77,5 | 63,8 |
| Lancer | 46,3 | 21,3 |
| Frost | 35 | 17,5 |
| Titan | 63,8 | **100** |

**Messwerte C** (Titan-Schaden relativ):

| Aufbau | Faktor |
|---|---:|
| 1 / 2 / 4 Banner Stufe 5, ein Spieler | 1,4 / 1,4 / 1,4 |
| 2 / 4 Banner Stufe 5, 2 / 4 Spieler (gleiche Buff-ID) | 1,4 / 1,4 |
| synthetisch 2 verschiedene Buff-IDs (Σ +80 %) | 1,8 |
| synthetisch 3 / 4 Buff-IDs (Σ +120 % / +160 %) | **2,0 (Cap +100 %)** |

**Befund (Risiko hoch für Multiplikatoren, niedrig für Buff-Caps).**
- Die Siegquote auf Nightmare kippt schon bei **x1,10 (~90 %) und x1,15 (100 %)** Gesamt-Schadensmultiplikator, auf Hard bei x1,10. Der Meta-Faktor aus `recommendations.md` §15 (typisch x2,5, mit Trait x2,9, Höchstwert ~x12) liegt **weit** über dieser Schwelle: jeder Spieler mit voller Meta-Ausstattung hätte die heutigen Schwierigkeitsstufen ohne Grenzfall gewonnen. Das ist die Folge der Messerschneide (Q6), nicht eines Einzelwerts: die heutigen Zahlen sind für Meta x1,0 kalibriert.
- Einzelne Traits sind unterschiedlich stark: Trait +50 % auf Gunner (Solo 100 %) oder Titan (4P 100 %) kippt die Zelle allein; Lancer/Frost-Traits sind für greedy wertlos. Ein Trait auf der schon dominanten Unit (Titan im Koop, Q1) verstärkt den Effekt.
- **Banner-Stacks sind gedeckelt, bevor der Cap zählt**: gleiche Buff-ID stapelt weder innerhalb eines Spielers noch zwischen Spielern (4 Spieler x Banner = +40 %, Regel #7). Der Cap +100 % greift im Simulator nachweislich (synthetisch 3 IDs -> x2,0), wird aber mit dem heutigen Inhalt (eine Aura-Unit, +40 %) nie erreicht. Verwundbar-/Tempo-/Range-Caps haben keine Quelle (Regel #27) und sind ungetestet.

**Vorschlag (DESIGN).**
- Schwierigkeit an das Meta koppeln, nicht an die Basiszahlen: Stage-Tiers/Level-Scaling mit HP-Faktor ~ Meta-Faktor (x1,0 -> x2,5 pro Tier) statt einer festen Stage; Messbasis für Meta-Content ist dann `q4-multipliers.ts`.
- Meta-Gesamtfaktor je Unit im Match deckeln (z. B. Level x Trait <= x1,5 gegenüber Basis auf Hard/Nightmare), oder Meta nur auf Normal/Infinite wirken lassen.
- Traits mit Einzel-Wirkung (ASTD-Lehre, §15) auf den Typ mit der größten Schadens-pro-Münze-Kurve (Titan) begrenzen oder je Match nur ein Trait-Bonus je Spieler.
- Banner: Regel #7 beibehalten (kein Stapeln der gleichen ID über Spieler); beim Hinzufügen weiterer Aura-Units `q4-multipliers.ts --part C` wiederholen.

### 5. Performance Infinite

**Methode.** `q5-perf.ts`: nur `sim.step(1)` wird gemessen (Bot-Entscheidungen und Platzierung zählen nicht), 1 Warm-up-Lauf plus 5 Läufe, Median. S1 realistisch: Infinite, 4 Spieler greedy, bis Wave 40, godMode. S2 Stress: synthetische Map mit 96 Slots (die echte Map hat nur **26 Slots** -> maximal 26 Units; das Team-Limit 60 ist dort nicht erreichbar), 4 x 15 = 60 Units voll ausgebaut (Striker, Gunner, Blaster, Frost), Gegner-Limit 80 (Data-Override), Gegner langsam (Speed x0,25), zäh (HP x30), Infinite-Pool x4, damit 80 Gegner gleichzeitig leben; 25 Waves.

Gerät: Node v22.22.0, Intel Xeon (2,8 GHz, 4 Kerne), Linux 6.18 (Container).

**Messwerte.**

| Szenario | Units | Ticks/Lauf | Ø / max Gegner | Ticks/s (Median) | Ø µs/Tick | P99 ms | max ms/Tick | Ticks/s bei >= 70 Gegnern |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| S1 realistisch, 4P greedy | 23 | 25 261 | 5,9 / 28 | 119 116 | 8 | < 0,1 | 3,7 | - |
| S2 Stress 60 Units, 80 Gegner | 60 | 21 730 | 42,2 / 80 | 23 207 | 43 | 0,1 | 4,4 | 45 244 (5 662 Ticks) |

**Befund (Risiko niedrig).** Im Stress-Fall (60 Units, bis 80 Gegner) schafft der Kern **~23 000 Ticks/s**, das ist das 390-Fache des Echtzeitbedarfs von 60 Ticks/s (20 Ticks/s x Speed 3); realistische Fälle ~120 000 Ticks/s. Der schlechteste Einzel-Tick liegt bei 4,4 ms (GC-/JIT-Spitze; P99 0,1 ms) gegen 16,7 ms Budget bei 60 Ticks/s bzw. 50 ms bei 20 Ticks/s. Nicht gemessen: Browser-Engine, Mobilgeräte (typisch 3-10x langsamer, bleibt unkritisch), Render- und Netzlast (der Kern ist nicht der Engpass). Rechnerisch trägt ein Kern im Stress-Fall rund tausend 4P-Räume bei 20 Ticks/s (nur Sim, ohne Netz). Auffällig: Ticks mit >= 70 Gegnern sind nicht langsamer als der Durchschnitt, die Kosten hängen also nicht allein an der Gegnerzahl (Units x Ziele, Statuseffekte, Allokation).

**Vorschlag (DESIGN).** Keine Änderung nötig. Die 60-Unit-Grenze ist auf der Standard-Map unerreichbar (26 Slots): entweder mehr Slots in Infinite/Koop-Maps oder das Team-Limit als Sicherung belassen. Regressionsmaß für spätere Änderungen: `npx tsx scripts/sanity/q5-perf.ts` (Ziel > 5 000 Ticks/s im Stress-Fall).

### 6. Messerschneide: Siegquote gegen HP-Faktor

**Methode.** `q6-hp-curve.ts`: greedy 1P, globaler HP-Faktor f auf die HP-Basispunkte der Schwierigkeit (Data-Override, `f = 1,00` = heutige Kalibrierung), f = 0,90 bis 1,15 in 0,025-Schritten, 100 Runs je Punkt. Die Faltung simuliert eine zufällig verteilte Spielerstärke (log-gleichverteilt +-s; effektiver HP-Faktor f/x) auf der gemessenen Kurve.

**Messwerte** (Siegquote %):

| f | normal | hard | nightmare |
|---:|---:|---:|---:|
| 0,900 | 100 | 96 | 93 |
| 0,925 | 100 | 95 | 84 |
| 0,950 | 99 | 90 | 66 |
| 0,975 | 93 | 79 | 50 |
| 1,000 | 91 | 59 | 35 |
| 1,025 | 82 | 45 | 28 |
| 1,050 | 69 | 32 | 13 |
| 1,075 | 59 | 22 | 3 |
| 1,100 | 36 | 10 | 3 |
| 1,125 | 16 | 4 | 1 |
| 1,150 | 6 | 1 | 0 |
| f bei 90 % / 50 % / 10 % | 1,003 / 1,085 / 1,140 | 0,950 / 1,016 / 1,100 | 0,908 / 0,975 / 1,058 |
| Fenster 90 -> 10 % | 13,7 Punkte | 15,0 Punkte | 14,9 Punkte |

Siegquote bei gestreuter Spielerstärke (Faltung), bei f = 1,00:

| Streuung der Spielerstärke | normal | hard | nightmare |
|---|---:|---:|---:|
| +-0 % (Bot) | 91 | 59 | 35 |
| +-5 % | 87 | 60 | 37 |
| +-10 % | 80 | 57 | 38 |
| +-20 % | 64 | 49 | 39 |

**Befund (Risiko mittel).** Die Kurve ist steil, aber nicht senkrecht: **um die Siegquote von 90 % auf 10 % zu bringen, braucht es ~14-15 Prozentpunkte HP** (Normal ~1,00 -> 1,14, Hard 0,95 -> 1,10, Nightmare 0,91 -> 1,06). Die Stufen liegen auf der f-Achse eng beieinander: Die 50-%-Punkte sind bei Normal 1,085, Hard 1,016, Nightmare 0,975, also **nur 4-7 Punkte HP voneinander** (Normal -> Hard 6,9, Hard -> Nightmare 4,1); eine Hard-Stage ist für den Bot "Normal mit +7 % HP". Für Menschen heißt das:
- Die Schwierigkeit ist faktisch ein **Stärke-Schwellwert**: wer ~7-10 % effektiv mehr DPS hat (bessere Platzierung, bessere Fähigkeiten, Meta), gewinnt Hard/Nightmare fast sicher, wer 7 % weniger hat, verliert fast sicher. Menschliche Streuung (+-10-20 % effektive Stärke, deutlich größer als die Fensterbreite) glättet die Kurve (Faltung: Normal 91 -> 64 %, Nightmare 35 -> 39 %), das heißt: **Die Stufen laufen für schwächere Spieler praktisch zusammen** (bei +-20 % Streuung ist der Abstand Normal/Nightmare nur 25 statt 56 Punkte).
- Kleine Änderungen (Balance-Patch +-3 % auf Einheiten-DPS oder Gegner-HP) verschieben die Siegquote um 10-15 Punkte; das ist für Live-Balancing schwer steuerbar und im Koop (Q1: 4P-Zellen) noch steiler.
- Die Kalibrierungsziele (Hard 50-70 %, Nightmare 20-40 %) sind für den **Bot** erfüllt, nicht für Menschen: menschliche Siegquoten hängen vor allem von der Fehlerquote ab (nicht modelliert).

**Vorschlag (DESIGN).**
- Schwierigkeit zusätzlich über **qualitative** Unterschiede statt über kleine HP-Faktoren (Modifier-Dichte, Elemente, Boss-Fähigkeiten, Wave-Zusammensetzung); die HP-Faktoren Hard/Nightmare bleiben klein (x1,03/x1,07) und sind nur Feinjustierung.
- Fehlertoleranz einbauen, die die Kurve verbreitert: weicher Fail-State (z. B. Base-HP-Regeneration pro Wave, 2. Boss-Leak ohne Verlust), damit ein einzelner Fehler nicht zur Niederlage führt; Ziel Fenster 90 -> 10 % >= 30 Punkte HP.
- Playtest-Daten statt Bot-Daten für die Zielquoten: Bots um ein Fehlermodell erweitern (zufällig verspätete Käufe, falsche Slot-Wahl) und `q6-hp-curve.ts` wiederholen.
- Mit dem Meta-Befund (Q4) zusammen betrachten: x1,10-1,15 Schadensmultiplikator entspricht etwa dem gesamten Abstand Normal-Nightmare (11 Punkte HP).

---

# Runde 4 (Stand P6): vorher / nachher je Abnahmeziel

Grundlage: Ziele aus `run.md` Abschnitt 3, gemessen mit den Bots **mit Fehlermodell** (Profile casual / normal / expert, `sim/data/botProfiles.json`), `standard20`. „Vorher" = Ende Runde 3 (Tabellen oben) bzw. Ende P5 (letzter Messstand vor P6, `kalibrierung.md`). Messdetails, Datenänderungen (alt → neu → Grund) und Verworfenes: `kalibrierung.md`, „Runde 4 — P6". Stichproben: Siegquoten je Stufe n = 100, Matrizen/Leave-one-out/Koop n = 40 (±5–8 Punkte). Ampel: grün = erreicht, gelb = knapp/teilweise, rot = verfehlt.

## Ergebnis in Kürze

- **Bots:** drei Profile mit Fehlermodell (Kaufverzögerung, schlechterer Slot, vergessene Upgrades, verspätete Fähigkeiten, Wellenwissen), eigener geseedeter Bot-PRNG, deterministisch je Seed. Boss-Plan für alle Bots: Boss von Wave 10 leakt nie mehr (vorher bis 97 % der Läufe tot am Boss).
- **Stufen solo** (bester Bot, Profil normal): Normal **85**, Hard **57**, Nightmare **24** — alle drei im Zielkorridor. expert liegt darüber (94 / 67 / 31), casual darunter (60 / 41 / 19).
- **Offen:** Leave-one-out (Striker-Falle bei `wide` auf Hard/Nightmare, Titan auf Normal), Koop-Fairness je Bot (nur `aoe` fair), Kennlinie Hard (14,5), Stage-Dauer (11,7 min).

## Ziele: vorher / nachher

| Ziel | Vorher (Runde 3 → Ende P5) | Nachher (P6, Profil normal; casual / expert wo gemessen) | Ampel |
|---|---|---|---|
| Keine dominante Kombi (kein Bot ≥ 95 % in allen Zellen 3 Stufen × 1P/4P) | R3: `wide`/`greedy` Normal 100 %, aber Hard/NM klein; `upgrade` im Koop 97–100 %. P5: `upgrade` 4P 97,5 / 100 / 100, 1P 60 / 27,5 / 32,5 | `upgrade` 4P Normal 100, Hard 95, Nightmare 100, aber 1P 85 / 2,5 / 7,5. Kein Bot in allen sechs Zellen ≥ 95 | grün |
| Keine Fallen-Unit (LOO ≤ +5) | R3: Striker +10/+33/+12 (N/H/NM). P1: Normal ≤ +5, Hard Striker +48 / Banner +50, NM +38 / +48 | Normal: Striker 0, Blaster 0, Titan **+12,5**; Hard: Striker **+27,5**, Banner +5; Nightmare: Striker **+22,5**. Experiment Striker-Cap 2: Striker +2,5, aber `wide` Hard 92,5 % (nicht übernommen, Hard/NM müssten neu kalibriert werden) | rot (besser als P1, Striker/Titan offen) |
| Jede Unit von einem Bot ≥ 30 % gekauft | P1: ≥ 91 % | niedrigste Banner 46 % (greedy), alle anderen ≥ 98 % (Farm 100 % durch `farm`); mit Profil normal | grün |
| Schaden/Münze DPS-Units Faktor ≤ 1,6 | R3: 3,5; P1: 1,6 | **1,4** (striker 6,1 / gunner 5,4 / blaster 6,8 / lancer 5,7 / frost 7,8 / titan 6,3; 1P, n = 30). 4P nicht gemessen | grün |
| AoE-Bot ≥ 50 % Normal solo | R3: 0–2 %; P1: 52 %; P5: 95 % | **83 %** (casual 60, expert 94) | grün |
| Stufen solo Normal 85–95 / Hard 45–65 / Nightmare 15–35 | R3: 95 / 58 / 39; P5: 95 / 52,5 / 32,5 (Bots ohne Fehlermodell) | **85 / 57 / 24**; casual 60 / 41 / 19; expert 94 / 67 / 31 | grün (Normal am unteren Rand) |
| Stufen unterscheiden sich über Regeln | P3: Modifier, Varianten, Elemente, Leben, Boss-Tier | unverändert; HP-Spreizung 4,8 % (vorher 6,8 %) | grün |
| Kennlinie 90 → 10 % ≥ 25 Punkte HP | R3: ~14; nach P3: 15,7 / 25,0 / 23,1; nach Merge Normal 8,8 | Normal (`upgrade`) **25,7**, Nightmare (`wide`) **24,4**, Hard (`wide`) **14,5** (Treppe am Wave-20-Boss, Sprung 93 → 62 % zwischen f = 0,95 und 1,0) | gelb (Normal grün, Nightmare knapp, Hard rot) |
| Koop fair (1P/2P/4P ±10 je Bot je Stufe) | P5: nur `aoe` Normal fair; Hard/NM im Koop 90–100 % gegen 27–52 % solo | Tabelle je Stufe eingeführt. `aoe`: Normal 85 / 80 / 90 (Spanne 10), Hard 40 / 62,5 / 60 (22,5), Nightmare 7,5 / 17,5 / 17,5 (10). `upgrade`: Spanne 15 / 92,5 / 92,5, `wide` 42,5 / 67,5 / 20, `farm`/`coop`/`greedy` 5–42,5. Details `kalibrierung.md` | rot (nur `aoe` im Band) |
| Stage-Dauer Story Normal 13–17 min | R3: 11–13 min | Siege `aoe` Normal 10,9–13,6, Median 11,7 min (Hard 11,6, Nightmare 11,7) | rot, Ursache Regel (Wave startet bei leerem Feld früher), nicht Daten |

## Vorher/nachher je Profil: Siegquote bester Bot solo (n = 100)

| Stufe | Ziel | casual | normal | expert | Bots normal (greedy / farm / aoe / upgrade / wide) |
|---|---|---|---|---|---|
| Normal | 85–95 | 60 | **85** | 94 | 24 / 48 / 83 / 85 / 57 |
| Hard | 45–65 | 41 | **57** | 67 | 4 / 13 / 46 / 2 / 57 |
| Nightmare | 15–35 | 19 | **24** | 31 | 1 / 3 / 6 / 8 / 24 |

Zum Vergleich ohne Fehlermodell und ohne Boss-Plan (Ende P5, n = 40): Normal 95 (`aoe`), Hard 52,5 (`aoe`), Nightmare 32,5 (`upgrade`); mit Boss-Plan, noch ohne Fehlermodell: Hard `wide` 77,5, Nightmare `wide` 12,5. Der Boss-Plan hob `wide`/`greedy` auf Normal von 0 auf 67,5 / 20 % und senkte `upgrade` auf Hard/NM (27,5 → 10 / 32,5 → 10 %, Typ-Limit, Titan-Hortung).

## Befunde für die weitere Arbeit

- **Bot-Rollen:** `upgrade` trägt Normal (85) und bricht auf Hard/NM ein (2–8 %), `wide` ist der Hard/NM-Bot (57 / 24); `aoe` ist auf Hard mittelstark (46). Die Rollenverteilung ist Bot-Struktur (Titan-Hortung, Typ-Limit 6), keine Unit-Dominanz.
- **Kaufverzögerung ist kein Handicap** in diesem Sim (Bündeln hilft den Bots): casual braucht Slot-, Upgrade- und Fähigkeitenfehler, um schwächer zu sein.
- **Hard-Hang:** `hard.bountyBp` 10500 → 41, 10600 → 57, 10700 → 64 % (n = 100): ~7 Punkte je 100 bp. Für den Feinabgleich im Playtest der Hebel der Wahl.
- **Offene Punkte (Übergabe in `kalibrierung.md`):** Striker-Cap mit Neukalibrierung von Hard/NM, bedarfsabhängiger Titan-Plan, Koop-Wirtschaft (Upgrade-Kosten/Level-Cap) statt HP-Tabelle, Mindest-Wave-Dauer als Regelentscheidung.
