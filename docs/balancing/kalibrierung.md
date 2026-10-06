# Kalibrierung P2c (Teil 2)

Messung mit dem Simulator (`npm run sim`, Bots `greedy, wide, upgrade, farm, aoe, coop`), Ziele aus `docs/comparison/recommendations.md` §19. Geändert wurden **nur Konstanten in `sim/data/*.json`** (plus der neue optionale Block `economy.infinite`, der vorher fest im Code stand). Messdaten: `docs/balancing/runs/vorher-*` und `nachher-*`; Auswertung: `report.md`.

Interpretation der Ziele: "Verlustrate Waves 15-20 10-20 %" = der beste Bot verliert auf Normal solo 10-20 % der Runs in den Waves 15-20 (Siegquote 80-90 %). Hard/Nightmare: Siegquote des besten Bots 50-70 % / 20-40 %. "Bester Bot" = Maximum über die sechs Bots (in der Praxis greedy oder wide).

## Änderungen

| # | Datei/Feld | alt | neu | Grund (Messwert vorher → nachher) |
|---|---|---|---|---|
| 1 | `economy.json` `leakDamage.boss` und `enemies.json` Archetyp `boss.leak` | 50 | 34 | Zwei Boss-Leaks (je 50) beenden die Stage binär; vorher verloren 41,5 % der Farm-Runs und 98 % der greedy-Hard-Runs in Wave 20 durch Boss-Leak, Siegquote sprang zwischen Bots von 100 % auf 0-58 %. Mit 34 braucht es drei Boss-Leaks oder Boss plus Chip-Leaks; die Siegquote hängt glatter von der Stärke ab (Test mit Leak 34 und g = 1,16: greedy/wide/upgrade/farm/aoe 100/100/75/82/32 %; mit Leak 50 und g = 1,14: 100/100/85/2/0 %). Test `leaks.test.ts` angepasst |
| 2 | `enemies.json` `hpCurve.growthBp` | 11200 (g = 1,12) | 11525 (g = 1,1525) | §19 #2: Normal solo war zu leicht (greedy/wide/upgrade 100 %, Verlustrate Waves 15-20 = 0 %). g-Scan bei Einkommensneutralität (#3): 1,145 → greedy/wide 100/100; 1,15 → 97/96; 1,1525 → **91/83** (n = 100); 1,155 → 75/68 %. Wave-20-Grunt 215 → 371 HP (x1,72, im Bereich 1,5-3 x aus §19 #1) |
| 3 | `economy.json` `bounty.gammaDecayBp` | 9200 (0,92) | 8940 (0,894) | Hält `gamma(n)·HP(n)` und damit das Einkommen auf der §3-/§5-Tabelle (0,92·1,12 = 1,0304 = 0,894·1,1525). Ohne diese Kopplung wuchs das Einkommen mit der HP mit (Test g = 1,19 ohne Kopplung: Normal-Siegquote greedy 41 %, wide 99 %, farm 15 %; Farm-Anteil sank unter 12 %). Einkommen Wave 1/5/10/15 nachher 195/443/1 021/982 (unverändert zu vorher) |
| 4 | `difficulties.json` `hard.hpBp`, `hard.speedBp` | 14000, 11000 | 10300, 10000 | §19 #12: vorher Hard solo bester Bot 17 %, 4P 100 % (nicht vergleichbar). Mit den §4-Faktoren gibt es keinen Bereich 50-70 % (Test auf der alten Basis mit g = 1,12: HP x1,2/Speed x1,05 → greedy 80 %, x1,3/x1,05 → 32 %, x1,4/x1,1 → 2 %). Messung auf neuer Basis: HP x1,00 → greedy/wide 88/80 %; x1,03 → **58/52 %** (n = 200); x1,05 → 42/45 %. Elemente bleiben aktiv |
| 5 | `difficulties.json` `nightmare.hpBp`, `nightmare.speedBp` | 20000, 12000 | 10700, 10000 | Vorher 0 % für alle Bots (bester Wave-Median 11). x1,06 → greedy/wide 35/40 %; x1,07 → **31/39 %** (n = 200) |
| 6 | `economy.json` `coop.hpPerExtraPlayerBp` | 7500 | 11000 | §19 #10: vorher Koop-Siegquote pro Bot sehr uneinheitlich (greedy hard solo 2 % / 2P 53 % / 4P 100 %). Scan (greedy/wide): 3500 → alles 100 %; 7500 → hard 2P/4P 97-100 %; 9500 → normal 2P 87-97 %, hard 4P 90-93 %; 10500 → hard 2P 65-75 %, 4P 62-70 %; **11000** → normal 87-92/82-90, hard 2P 70-73, 4P 40-58 %; 11500 → hard 4P 10-17 %. 11000 ist der Kompromiss (nachher siehe `report.md`) |
| 7 | `units.json` Farm `yieldByLevel` | 50/90/135/205/310 | 65/117/176/267/403 (x1,3) | §19 #6: vorher Farm-Anteil 16,4 % (Ziel 25-35 %), Payback 10,7 Waves (Ziel 8-9,5), farm-Bot Normal solo 58 %. Scan x1,25 → 23 %/9,4/77 %; x1,35 → 27 %/9,7/91 %; **x1,3** → 25,9 %/9,0/88 % (greedy 95 %: Farm konkurrenzfähig, nicht dominant). Kosten/Upgrade-Preise/Cap unverändert |
| 8 | `economy.json` neuer Block `infinite` (`poolMilli` 14000, `bossPoolMilli` 38000; `speedPerWaveBp` 100, `speedMaxBp` 15000, `enemyCap` 60 unverändert) | Pool 32 Grunt-Äquivalente, Boss-Wave 45 (fest im Code) | Pool 14, Boss-Wave 38 (= Boss + Elite ohne Füller) | §19 #13: auf der kalibrierten HP-Basis (Wave-20-Grunt 371) endete Infinite bei Median 23 (greedy), Ziel 30-40. Pool-Scan (greedy/farm, n = 40-60): 32 → 23/23; 22 → 26/23,5; 16 → 29,5/26,5; 12 → 31/27,5; 10 → 31/30,5. Gewählt 14: **greedy 30 (P10-P90 22-31), farm 31 (21-31)**. Wand ist der Boss in Wave 30 (HP x2,25 gegenüber Wave 20, Geld flach) |

Tests angepasst (alle verweisen auf diese Datei): `damage.test.ts` (HP-Kurve aus `growthBp`, Hard-/Koop-Faktor aus den Daten), `economy.test.ts` (Farm-Ertrag aus `units.json`, Bounty-Formel), `leaks.test.ts` (Boss-Leak 34, drei Boss-Leaks), `pool.test.ts` (§5-Pools x (g/1,12)^(n-1), Koop-Faktor aus den Daten), `infinite.test.ts` (Pool-Grenzen aus den Daten), `report.test.ts`.

## Verworfene Versuche

- **Nur g erhöhen (Einkommen wächst mit)**: g = 1,18 → greedy 85, wide 100, upgrade 65, farm 40, aoe 0 %; g = 1,20 → greedy 5 %, wide 87 %. Klippe zwischen 1,18 und 1,20, Einkommen +170 % und Farm-Anteil < 12 %: verworfen zugunsten #2 + #3.
- **Boss-HP erhöhen** (f_HP 30 → 40/50 bei Leak 34): kein Effekt auf die Siegquote (alle Bots 100 %), da nicht der Boss, sondern die Chip-Leaks (Flyer Waves 14/16/18) entscheiden.
- **Flyer-Speed 1,3 → 1,15**: hebt greedy/upgrade/farm um 5-15 Punkte, wurde aber nicht übernommen (Ziel bereits mit #1-#3 erreicht, Abweichung von §4 vermieden).
- **AoE-Schadensanteil 60 → 75/80 %**: hebt greedy/upgrade (zu stark), den AoE-Bot aber nicht (0-2 %); verworfen. Der AoE-Bot (nur Blaster/Lancer/Frost bevorzugt) ist **bewusst schwach** und wird als Befund geführt (siehe `report.md`).
- **Hard/Nightmare nach §4 (x1,4/x2,0, Speed x1,1/x1,2)**: auf der kalibrierten Basis 0 % für alle Bots; die Siegquote fällt bei Faktor > 1,05 steil ab.

## Nicht geändert

Startgeld, Wave-Bonus, Kostenkurven, Unit-DPS/-Reichweiten, Rüstung, Verkaufswerte, Caps, Wave-Timer, Archetyp-HP-/Speed-Faktoren, Stage-Waves.
