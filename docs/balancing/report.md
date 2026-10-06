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

