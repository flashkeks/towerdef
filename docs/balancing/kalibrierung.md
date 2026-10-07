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

# Runde 4 — P1: Unit-Rebalance

Paket P1 aus `run.md` (Runde 4). Gemessen mit den Registry-Bots (`greedy, wide, upgrade, farm, aoe, coop`, ohne Fehlermodell; das kommt mit P6) auf `standard20`. Alle Werte stammen aus `scripts/sanity/` (siehe unten), "vorher" = Stand Runde 3 (Commit vor P1, n = 50), "nachher" = Stand dieser Datei (n = 60, außer LOO 4P n = 40).

**Kurzfassung.** Schaden je Münze der DPS-Units liegt solo jetzt im Faktor 1,6 (vorher 3,5), AoE-Bot gewinnt Normal solo zu etwa 52 % (vorher 0 %), Titan ist nicht mehr Pflicht (Verbot ±0, vorher −90; als Boss-Killer allerdings **nicht belegt**, s. u.), Striker ist keine Falle mehr (Normal solo +5, vorher +10). **Nicht erreicht:** (a) Leave-one-out auf Hard/Nightmare solo: Verbot von Striker bzw. Banner hebt den besten Bot (`wide`) um +38 bis +50 Punkte; (b) Frost ist jetzt die Pflicht-Unit (Verbot −95 auf Normal, vorher 0), (c) im 4P-Koop siegen nur `upgrade` (100 %) und `aoe` (28 %) auf Normal, `greedy`/`wide` fielen von 82/90 % auf 0–2 % (Rekalibrierung gehört zu P5), (d) "Titan + Lancer + Frost" bleibt auf Normal und im 4P-Koop (100/97/60 %) dominant. Details und Ursachen unten.

## Bot-Änderungen (nötig, sonst Einheiten strukturell nie gekauft)

Die Bots bewerten "DPS-Gewinn je Münze" und kaufen sofort, was bezahlbar ist. Damit kauft ein Bot Units mit hoher Platzierungskost (Titan 1000, Lancer/Frost 650) nur zufällig, und ein Team hat nur **6 Typ-Plätze**, die die billigste Unit zuerst füllt. Beides verfälschte jede Rollenmessung der Runde 3 (z. B. "aoe 0 %": der AoE-Bot kaufte nie Titan oder Lancer, hatte kaum Luftabwehr und verlor Wave 10/14–18 durch Leaks). Änderungen in `src/bots/util.ts` und `src/bots/aoe.ts`, alle abschaltbar über `botTuning.disabled` (Sanity-Skripte: Umgebungsvariable `P1_NOSAVE=1`):

| # | Änderung | Grund |
|---|---|---|
| B1 | **Sparen** (`Policy.save`, Standard an): Ist die beste Platzierung insgesamt (Budget ignoriert) mindestens 1,5x besser je Münze als die beste bezahlbare, und sind 50 % ihrer Kosten da, wartet der Bot (höchstens 45 Entscheidungen in Folge). Gilt nur für Platzierungen, nie für Upgrades. Mythic: Faktor 1,0 | Ohne Sparen kaufen Wert-je-Münze-Bots Lancer/Frost/Titan nur durch Zufall. Eine erste Variante, die auch auf Upgrades sparte, ließ greedy solo von 90 auf 13 % einbrechen (Hortung kostet früh Leben) und wurde verworfen |
| B2 | **Mythic erst ab Wave 4** (`botTuning.mythicFromWave`) | Mit 1000 Startmünzen kaufte greedy den Titan als Eröffnung und hatte dann keine billigen Körper gegen die ersten Waves |
| B3 | **Plan** (`Policy.plan = { unit, fromWave }`): `aoe` spart ab Wave 5 auf den Titan (ab 40 % der Kosten) und kauft ihn als Erstes | Der Titan hat je Münze nie die beste Wertung (Upgrades billiger Units schlagen ihn immer), also würde ihn ohne Plan kein Bot kaufen. Ein Mensch plant ihn vor dem Boss in Wave 10 |
| B4 | **`aoe`-Gewichte**: Blaster/Lancer/Frost 2,2, Titan 1,8 (plus Plan), Gunner 1,2, Banner 0,8, **Striker 0** (vorher alle Einzelziel 0,6) | "AoE-Kern mit 1-2 Einzelziel-Units": Gunner (einzige billige Luftabwehr) und Titan (Boss). Striker würde als billigste Unit die 6 Typ-Plätze und das Startgeld füllen |
| B5 | **Early-Unit abgeben** (`rotateEarly`, alle Bots): Ist das Team mit 6 Typen voll, fehlt ein Legendary/Mythic-Typ und reichen Münzen plus Erlös (60 %), verkauft der Bot ab Wave 8 alle Striker und kauft sie nicht wieder | Das ist die Umsetzung von "Striker fällt später zurück": ein Mensch verkauft ihn, um den Typ-Platz frei zu machen. Ohne diese Regel blockiert er den Platz bis Wave 20 (LOO Hard +43) |

Tests: `bots.test.ts` neu (`aoe` kauft Titan und AoE-Kern, kein Striker; Early-Unit-Verkauf). Der Test "greedy schlägt nichts tun" prüft den Gewinn jetzt am Bot `upgrade` (greedy gewinnt auf dem kalibrierten Normal nicht mehr jeden Seed).

## Datenänderungen

`sim/data/units.json` (Schadensanteil `dpsShareBp` ist der Hebel je Unit; die Rarity-Kurven bleiben unverändert, sie gelten für mehrere Units) und `sim/data/difficulties.json`:

| # | Datei/Feld | alt | neu | Grund (Messwert vorher → nachher) |
|---|---|---|---|---|
| 1 | `units.json` Titan `dpsShareBp` | 10000 | 5000 | Schaden je Münze 11,9 (solo) / 12,8 (4P) = 2-3x die anderen. Die Hälfte des Titan-Schadens kam aus der Nuke (8x Treffer / 45 s ≈ +70-90 % auf den Grundschaden), daher beide Hebel. Nachher 9,5 / 5,6 |
| 2 | Titan Nuke `damageMulBp` | 80000 (8x) | 50000 (5x) | s. o. Boss-Rolle: nach der Rekalibrierung nicht belegt, s. "Warum nicht alles erreicht wurde" |
| 3 | Striker `placeCost` | 300 (Rare) | 200 | "billig": Einstieg 200, Upgrades unverändert 300/450/675/1010, also relativ teure Ausbaustufen. Phasenprofil (greedy, Normal solo, Schaden je investierter Münze, Wave 1-6 / 7-13 / 14-20): Striker 3,0 / 4,5 / 2,3 gegen Lancer 0,4 / 4,4 / 9,0 und Frost 2,2 / 5,2 / 9,7 — früh bester Wert, später Schlusslicht |
| 4 | Striker `dpsShareBp` | 7000 | 11000 | Schaden je Münze 3,4 (solo) war die Falle; Bleed zählt auf Boss/Elite nur halb. Nachher 6,4 |
| 5 | Gunner `dpsShareBp` | 9000 | 11500 | Schaden je Münze solo 5,4, im 4P 2,9: das untere Ende des Korridors (neben Striker). Nachher 6,6 / 4,7 |
| 6 | Blaster `dpsShareBp` | 6000 | 6500 | Im `aoe`-Bot auf Nightmare war er ein Ballast (Verbot +28). 7500 ließ den Korridor reißen (Blaster 9,3 solo), 6500 ist der Kompromiss. Nachher 8,1 |
| 7 | Lancer `dpsShareBp` | 6000 | 8500 | Schaden je Münze 4,3 (solo und 4P). Nachher 8,5 |
| 8 | Lancer `placement` | ground | hybrid | **Nische**: Linie, durchschlägt Rüstung (Pen 40) und trifft Flyer-Pulks. Ohne zweite Luft-AoE neben Frost ist Frost allein Pflicht. Verbot des Lancers kostet jetzt −25 (Normal) bis −35 (Hard) statt +3 bis +18 |
| 9 | Frost `dpsShareBp` | 5000 | 7000 | Fiel als Direktschadensgeber durch (4,4 solo) |
| 10 | Frost Slow `pctBp` | 4000 (−40 %) | 2000 (−20 %) | Der Slow ist ein Gruppen-Multiplikator (Zeit in Reichweite x1,67), den die Q1-Messung als Ursache der Dominanz fand. Bei −30 % blieb Frost Pflicht (Verbot −90, ohne Slow −50 Punkte), bei −20 % ist der Slow-Anteil an der Siegquote 15-20 statt 50 Punkte (Test: Slow aus → `aoe` 97 → 80 %, `upgrade` 100 → 87 %) |
| 11 | Banner Aura `damageBpByLevel` | 1000/1600/2200/2800/3400/4000 | 1500/2300/3100/3900/4700/5500 | Banner wurde im Solo oft gekauft (65-100 %), trug aber nichts (Verbot Hard +13, Nightmare +22). Nach der Änderung neutral auf Normal (+3), s. offene Punkte |
| 12 | `difficulties.json` `normal.hpBp` | 10000 | 15200 | **Rekalibrierung**: Die Änderungen 1-11 plus Bot-Regeln (Sparen!) heben die Stärke aller Bots um rund 50 %. Scan bester Bot (n = 50-60): 14400 → upgrade 98 %, 14800 → 96 %, **15200 → 94-95 %**, Normal-Ziel 85-95 % |
| 13 | `hard.hpBp` | 10300 | 14800 | bester Bot (`wide`) 14600 → 68 %, **14800 → ~47-60 %**, 15000 → 50 %. Ziel 45-65 % |
| 14 | `nightmare.hpBp` | 10700 | 15600 | `wide` 15000 → 50 %, 15400 → 38 %, **15600 → 27 %**, 15800 → 14 %. Ziel 15-35 %. Hard (14800) liegt unter Normal (15200), weil die Stufen sich nur über Elemente unterscheiden und hier der bessere Bot jeweils ein anderer ist; P3 ersetzt die HP-Faktoren durch Regeln |

Tests angepasst (Zahlen jetzt aus den Daten gelesen statt fest): `combat.test.ts` (Frost-Slow, Aura-Stufe 0, Titan-Nuke, Splitter-Kind-HP), `damage.test.ts` (Hard/Koop-Faktor relativ zu Normal), `economy.test.ts` (Titan-Stufe-0-Schaden, Striker-Verkaufskette), `infinite.test.ts` und `pool.test.ts` (Normal-HP-Faktor), `bots.test.ts` (s. o.).

## Ergebnis: vorher / nachher je Unit

Kosten = Platzierung / Vollausbau (Platzierung + alle Upgrades, Münzen). DPS = nominal aus Rarity-Kurve x Anteil (Stufe 0 → Maximalstufe; ohne Mehrziel-, Crit-, DoT- und Nuke-Zuschläge). Schaden je Münze = Schaden / investierte Münzen, gepoolt über alle sechs Bots und je drei Stufen (solo / 4P). Kaufquote = Anteil Läufe mit mindestens einer Platzierung, gemittelt über die Zellen, Maximum über die Bots (in Klammern der Bot).

| Unit | Kosten vorher | Kosten nachher | DPS vorher | DPS nachher | Schaden/Münze solo vorher → nachher | 4P vorher → nachher | Kaufquote vorher → nachher |
|---|---|---|---|---|---|---|---|
| Striker | 300 / 2735 | **200** / 2635 | 7,0 → 31,5 | 11,0 → 49,5 | 3,4 → **6,4** | 2,4 → 5,0 | 100 % → 100 % (greedy) |
| Gunner | 300 / 2735 | 300 / 2735 | 9,0 → 40,5 | 11,5 → 51,8 | 5,4 → **6,6** | 2,9 → 4,7 | 100 % → 100 % (greedy) |
| Blaster | 400 / 4780 | 400 / 4780 | 8,4 → 50,4 | 9,1 → 54,6 | 6,6 → **8,1** | 6,5 → 9,5 | 100 % → 100 % (aoe) |
| Banner | 400 / 4780 | 400 / 4780 | Aura +10..40 % | Aura +15..55 % | (Buff) | (Buff) | 65 % (coop) → 91 % (upgrade) |
| Lancer | 650 / 8945 | 650 / 8945 | 13,2 → 92,4 | 18,7 → 130,9 | 4,3 → **8,5** | 4,3 → 8,4 | 58 % (coop) → 100 % (coop) |
| Frost | 650 / 8945 | 650 / 8945 | 11,0 → 77,0 | 15,4 → 107,8 | 4,4 → **10,4** | 7,0 → 12,0 | 100 % (upgrade) → 100 % (greedy) |
| Titan | 1000 / 18050 | 1000 / 18050 | 38 → 323 (+ Nuke 8x) | 19,0 → 161,5 (+ Nuke 5x) | 11,9 → **9,5** | 12,8 → 5,6 | 100 % (greedy) → 91 % (aoe) |
| **Faktor max/min** | | | | | **3,5 → 1,6** | 5,3 → 2,5 | |

Siegquote in % (Bots ohne Fehlermodell; nachher n = 60, vorher n = 50):

| Bot | Normal 1P v → n | Hard 1P | Nightmare 1P | Normal 4P | Hard 4P | Nightmare 4P |
|---|---|---|---|---|---|---|
| greedy | 92 → 22 | 56 → 2 | 38 → 0 | 82 → 0 | 44 → 0 | 20 → 0 |
| wide | 86 → 67 | 48 → 47 | 40 → 27 | 90 → 2 | 48 → 0 | 20 → 0 |
| upgrade | 34 → 95 | 28 → 23 | 16 → 12 | 100 → 100 | 98 → 15 | 100 → 2 |
| farm | 90 → 55 | 24 → 0 | 18 → 0 | 0 → 0 | 0 → 0 | 0 → 0 |
| aoe | **0 → 52** | 2 → 15 | 0 → 0 | 0 → 28 | 0 → 10 | 0 → 0 |
| coop | 90 → 55 | 24 → 0 | 18 → 0 | 16 → 0 | 0 → 0 | 0 → 0 |
| **bester** | 92 → **95** | 56 → **47** | 40 → **27** | 100 → 100 | 98 → 15 | 100 → 2 |

Leave-one-out (Siegquote des je Zelle besten Bots, Verbot der Unit; Δ in Punkten; `ohne X` wirkt als Platzierungsverbot, der Bot weicht auf andere Typen aus). Vorher bester Bot: Normal greedy 90, Hard greedy 52, Nightmare wide 40, 4P Normal upgrade 100. Nachher: Normal upgrade 95, Hard wide 47, Nightmare wide 27, 4P Normal upgrade 100.

| Verbot | Normal 1P v → n | Hard 1P | Nightmare 1P | Normal 4P |
|---|---|---|---|---|
| Striker | +10,0 → **+5,0** | +33,3 → +48,3 | +11,7 → +38,3 | 0 → 0 |
| Gunner | −88,3 → 0 | −51,7 → −46,7 | −38,3 → −26,7 | 0 → 0 |
| Blaster | −85,0 → +3,3 | −51,7 → −11,7 | −40,0 → −11,7 | −2,5 → 0 |
| Banner | +3,3 → +3,3 | +13,3 → +50,0 | +21,7 → +48,3 | 0 → 0 |
| Lancer | +6,7 → −25,0 | +3,3 → −35,0 | +18,3 → −26,7 | 0 → −17,5 |
| Frost | 0 → **−95,0** | 0 → −46,7 | −26,7 → −26,7 | −100 → −100 |
| Titan | −90,0 → 0 | −51,7 → 0 | −40,0 → 0 | 0 → 0 |

## Abnahmeziele P1: erreicht / verfehlt

| Ziel | Ergebnis |
|---|---|
| Titan nicht Universalantwort, bleibt Boss-Killer | **halb erreicht.** Nicht mehr Universalantwort: Verbot ±0 statt −90, Schaden je Münze 9,5 (im Korridor). **Boss-Killer nicht belegt:** Der Plan-Bot kauft ihn (91 %), lässt ihn aber auf Stufe 0 (Upgrades schlagen je Münze nie die billigen Units, auch bei Gewicht 8 nicht), und `boss@10`/`boss@20` leaken in 40 von 40 Läufen weiter (Normal solo, `aoe`); der Boss kostet dort "nur" 34 Leben je Leak, gewonnen wird trotzdem. Ein Boss-Rätsel mit Schwachstellen-Fenster ist P4 |
| Striker sinnvolle Early-Unit | **teilweise.** Phasenprofil wie gewünscht (früh bester Wert, spät Schlusslicht), Normal-Verbot +5. Auf Hard/Nightmare hebt das Verbot `wide` um +48/+38 (s. u.) |
| AoE-Bot ≥ 50 % Normal solo | **erreicht, knapp:** 52 % (n = 60, Standardfehler ±6; n = 30 gab 53 %). Hard 15 %, Nightmare 0 % |
| Frost/Banner/Lancer mit Nische, von ≥ 1 Bot in ≥ 30 % gekauft | **erreicht** (Frost 100 % greedy, Banner 91 % upgrade, Lancer 100 % coop, Titan 91 % aoe, alle anderen 100 %). Nische: Frost = Luft-AoE + Slow, Lancer = Luft-Linie + Rüstung, Banner = Support |
| Schaden je Münze aller DPS-Units im Faktor 1,6 | **solo erreicht (1,6)**, 4P nicht (2,5): im Koop fallen Striker/Gunner auf 4,7-5,0, Frost steigt auf 12,0 (Pro-Spieler-Caps und überlappende Reichweiten verteilen den Schaden anders) |
| Leave-one-out ≤ +5 | **Normal solo und 4P erreicht** (max. +5,0 Striker). **Hard/Nightmare solo verfehlt:** Striker +48/+38, Banner +50/+48 (jeweils `wide`), Blaster Nightmare mit `aoe` +28 in einer Zwischenmessung |
| Keine dominante Kombi | **teilweise.** Titan + Lancer + Frost 1P: Hard 57 % (vorher 100), Nightmare 23 % (vorher 100); aber Normal 100 % und 4P 100/97/60 %. Mono-Frost 100 % auf Normal (1P und 4P) wie in Runde 3, 0 % auf Hard/Nightmare |

## Warum nicht alles erreicht wurde (ehrliche Begründung)

- **Das System hat Klippen, keine Hänge.** Schon kleine Änderungen kippen ganze Bots: Frost-Anteil 7000 → 5500 ließ alle Registry-Bots von 50-95 auf 0-40 % fallen (Frost ist für sie Pflicht, bewertet über seinen Direktschaden); Titan-Platzierung 1000 → 800 setzte greedy von 70 auf 20-77 %. Deshalb sind die Werte oben Ergebnis vieler Läufe (rund 60), nicht einer Rechnung. Messfehler bei n = 60: ±6 Punkte, bei LOO-Differenzen ±9.
- **Frost bleibt Pflicht (Verbot −95 Normal), weil Luft die zweite Bedrohung ist.** Flyer (Waves 8-18, bis 10 je Welle) treffen nur Hybrid-/Hügel-Units: Gunner (Einzelziel, Cap 5), Titan (Einzelziel) und Frost (Kegel). Ohne Kegel-AoE gegen Flyer-Pulks leaken Waves 14/16/18. Der Lancer als Hybrid mildert das (Verbot jetzt −25 statt +7), reicht aber allein nicht. Echte Abhilfe wäre eine dritte Flächen-Antwort gegen Luft oder weniger Flyer-Druck — beides ist **Stage-/Wave-Design (P3/P4)**, nicht Unit-Daten.
- **Striker/Banner auf Hard/Nightmare: Bot-Struktur, nicht Unit-Stärke.** Der Bot `wide` (Platzieren zuerst, nur 6 Typ-Plätze) füllt die Plätze mit den billigsten Units. Wo Striker oder Banner fehlen, nimmt er Lancer/Frost und gewinnt 97 % gegen 47 %. Banner-Aura auf +25..60 % änderte daran nichts (+30/+50), Striker-Cap 3 ließ `wide` auf 87 % Hard springen und die anderen Bots einbrechen (Rekalibrierung nötig). Ein Mensch tauscht Early-Units nach (B5 bildet das nur für den Striker ab) und platziert den Banner erst, wenn Nachbarn stehen. Lösung gehört zu **P6** (menschlichere Bots, Rollenwahl statt "billigste zuerst").
- **4P (greedy/wide 82/90 → 0-2 %)**: Die Stärke pro Spieler stieg solo um etwa 50 %, im 4P weniger (Caps, Slots), der einheitliche HP-Faktor `normal.hpBp` und `coop.hpPerExtraPlayerBp` (11000) passt nicht mehr. Scan `hpPerExtraPlayerBp` 5500-9000: `aoe` und `upgrade` gewinnen 100 %, `greedy`/`wide`/`farm`/`coop` bleiben bei 0-43 % — die Kluft ist ein **Koop-Struktur-Problem (P5)**, kein Unit-Wert. Nicht angefasst.
- **Top-Rarity (Titan + Lancer + Frost) bleibt auf Normal/4P dominant**, weil drei Legendary/Mythic-Typen mit Caps je Spieler im Koop multiplizieren (Befund Runde 3, Q1c). Hebel: team-weite Mythic-Caps (P5).

## Verworfene Versuche

- **Titan nur über Anteil/Nuke nerfen ohne Bot-Änderung** (Anteil 6500, Nuke 6x): greedy kaufte ihn nicht mehr (Wertung je Münze zu niedrig) und verlor als Folge den Wave-10-Boss, Siegquote 92 → 0 %. Erst Plan (B3) macht die Titan-Werte frei wählbar.
- **Titan-Platzierung 800** (statt 1000): greedy eröffnete wieder mit ihm und fiel auf 20-77 %.
- **Sparen für alle Optionen** (auch Upgrades): greedy solo 13 %, wide/aoe/upgrade 100 % — die Hortung verfälscht alles. Nur Platzierungen (B1).
- **Slow −40 %/−30 %**: Frost blieb Pflicht (Verbot −90/−90). −20 % nach Test "Slow aus" (siehe #10).
- **Banner Aura +25..60 %**: LOO Hard/Nightmare unverändert +30/+50. **Banner billiger** (Platzierung 300, Upgrades 300-1150): Hard +27, Nightmare +40.
- **Striker Cap 3**: `wide` 87 % Hard / 73 % Nightmare, alle anderen Bots < 20 % — wegen der Klippen nicht rekalibrierbar innerhalb von P1.
- **Frost-Anteil 5500**: alle Bots 0-40 % (Pflicht-Unit-Effekt), siehe oben.
- **Blaster-Anteil 7500**: Korridor reißt (Blaster 9,3 solo bei Frost 9,6, Striker 5,6).

## Werkzeuge (unter `sim/scripts/sanity/`)

| Skript | Zweck |
|---|---|
| `q1-dominant.ts`, `q1b-top3.ts`, `q2-roles.ts` | wie in Runde 3, nach jeder Änderung wiederholt |
| `q7-p1.ts` | neu: `--part matrix` (je Bot Siegquote, Kaufquote und Schaden je Münze je Unit), `raw` + `sum` (Rohdaten je Stufe, gepoolte Tabelle und Faktor), `loo` (Leave-one-out für den besten Registry-Bot je Zelle, Verbot über `sim.apply`-Proxy), `phase` (Schaden je investierter Münze nach Spielphase), `static` (Kosten, nominale DPS), `mono` (Mono-Messung; **ungeeignet für den Korridor**: der Schaden ist durch die Gegner-HP gedeckelt, alle Units landen bei 5,2) |
| `q8-hpscan.ts` | neu: Siegquote aller Bots gegen globalen HP-Faktor |
| `p1-quick.sh`, `p1-sweep.sh` | Schnellläufe (3 Prozesse parallel, 30-60 Läufe je Zelle) |
| `lib.ts` | erweitert: `leaks`, `byWave`, Experiment-Umgebung `P1_PATCH` (Unit-Felder überschreiben), `P1_HP`, `P1_DIFF`, `P1_COOPH`, `P1_NOSAVE` |

Grenze der Metrik: "Schaden je Münze" ist ein Verteilungsmaß (die Summe aller Schäden ist durch die Gegner-HP gedeckelt), die Zahlen hängen also von den Käufen der Bots ab. Deshalb gepoolt über sechs Bots und drei Stufen; die statische Spalte (DPS je 1000 Münzen bei Vollausbau: Striker 18,8, Gunner 18,9, Blaster 11,4, Lancer 14,6, Frost 12,1, Titan 8,9 plus Nuke) ist bot-unabhängig und liegt ebenfalls im Faktor 2,1; der Titan holt über die Nuke auf (5x Treffer je 45 s ≈ +0,45-0,55 auf den Grundschaden, also rund 13 je 1000 Münzen).

## Übergabe an P2-P6

- **P3 (Schwierigkeit über Regeln):** HP-Faktoren aus #12-#14 sind Platzhalter; Hard liegt unter Normal. Hard/Nightmare unterscheiden sich in der Sim derzeit nur über HP (Speed 1,0 bei beiden, Elemente an). Der Bot `wide` bestimmt die Hard/Nightmare-Kalibrierung, `upgrade` die von Normal.
- **P5 (Koop):** `economy.coop.hpPerExtraPlayerBp` 11000 muss neu bestimmt werden; Mythic-/Legendary-Caps team-weit prüfen (Titan + Lancer + Frost 4P 100/97/60 %).
- **P6 (Fehlermodell):** Rollenwahl der Bots (billigste zuerst, 6 Typ-Plätze) ist die Hauptursache der LOO-Ausreißer auf Hard/Nightmare. `rotateEarly` und `Policy.plan` sind Ansätze, die sich auf alle Rollen verallgemeinern lassen.
- **Luft:** Flyer-Druck (Waves 8-18) macht Frost zur Pflicht. Wenn Frost kein Muss sein soll, braucht Luft eine zweite Flächen-Antwort oder weniger Pulk-Flyer (Stage/Waves, P3/P4).

---

# Runde 4 — P2: Leben-System und Fail-State

Paket P2 aus `run.md` (Runde 4). Regeln nach `docs/design/ENTSCHEIDUNGEN.md` (Schwierigkeit und Fail-State). Gemessen mit den sechs Registry-Bots (ohne Fehlermodell), `standard20`, Stand nach P1.

## Regeln (Implementierung: `sim/src/systems/move.ts`, `waves.ts`; Daten `economy.json` Block `lives`)

| Regel | Wert |
|---|---|
| Startleben | **30**, für das ganze Team gemeinsam (auch im Koop; Skalierung je Spieler wäre P5) |
| Leak-Kosten | `max(1, ceil(Basis × RestHP / MaxHP))`, reine Ganzzahl-Rechnung, Schild zählt nicht |
| Basis je Typ | Grunt 2, Runner 2, Flyer 3, Splitter 3, Brute 5, Splitter-Kind 1, **Elite 8** |
| Boss | **Leak = sofort verloren**, unabhängig von Rest-HP und Lebensstand (`lives.instantLoss: ["boss"]`) |
| Elite | **viele Leben (8 von 30), nach Rest-HP skaliert, kein Sofort-Verlust** (Begründung unten); per Daten umstellbar (`["boss","elite"]`) |
| Meta-Ausbau | Datenfeld `lives.metaBonus` = 0 (Wert kommt mit M3), zusätzlich `createSim({ metaLives })` |
| Regeneration | Datenfeld `lives.regenPerWave`, **Default 0**; wirkt am Wave-Ende, gedeckelt auf das Maximum |

Warum Basis 2 statt 1: Mit Grunt = 1 greift "mindestens 1" immer, und der Rest-HP-Anteil wäre bei den häufigen Typen wirkungslos. Mit 2 kostet ein Grunt/Runner unter der Hälfte der HP nur 1 Leben, ein fast toter Brute 1 statt 5.

**Elite-Entscheidung (Vorschlag, umgesetzt): viele Leben, nicht sofort verloren.**
1. Die Entscheidung trennt Boss (Rundenende, im Voraus angekündigt, hat Kit) von normalen Gegnern. Die Elite erscheint in Wave 5, 15, 19 (2x) und 20, also auch früh, wo die Verteidigung klein ist; Sofort-Verlust in Wave 5 wäre wieder die Base-HP-Klippe, die das Leben-System ablösen soll.
2. Gemessen (Daten oben, n = 40 je Zelle, Start 30): Elite sofort verloren senkt den besten Bot auf Normal von 90 auf 38 %, auf Hard von 60 auf 15 %, auf Nightmare von 38 auf 3 %. Elite als Leben-Posten (8) kostet gegenüber "Elite ignoriert" nur 3-8 Punkte. Die Elite bleibt damit ein spürbarer Posten, aber überlebbar, und ein angeschlagener Elite-Leak (z. B. 20 % HP → 2 Leben) wird belohnt.
3. Hebel bleibt offen: `instantLoss` um `"elite"` ergänzen, wenn P4 die Elite zum Mini-Boss mit Kit macht.

## Recherche: Leben in Anime Vanguards

`docs/games/anime-vanguards/` kennt nur die Gegnerfähigkeit "Extra Life / Multiple Lives" (Heracles, Homunculus, Shogamo, Valentine; `enemies-waves.md`); zur **Base-Lebenszahl** steht nichts im Bestand. Netz-Stopp-Regel (3 Versuche): nicht ausgeführt, weil der Bestand schon bestätigt, dass die Basiswerte (Base-HP/Leben je Modus) im Wiki als UNKNOWN geführt werden (`enemies-waves.md`, Zeile 6: drei Versuche in P-Runde 3 ohne Zahl). Die Zahlen hier sind daher Eigenwerte aus dem Simulator, nicht aus dem Vorbild.

## Messmethode

Die Bots lesen die Leben nicht. Ein Lauf mit praktisch unendlichem Startwert und ohne Sofort-Verlust liefert deshalb alle Leaks eines Laufs (Typ, Wave, Rest-HP, Max-HP). Daraus rechnet `scripts/sanity/q9-p2.ts --part eval` die Siegquote für jede beliebige Regel nach (Startleben, Basiskosten, Elite-Regel, Regeneration). `--part check` fährt echte Läufe mit den Daten aus `sim/data` und bestätigte die Nachrechnung (Normal solo, n = 60: Nachrechnung aoe 88, upgrade 80 gegen echten Lauf 88/80; Hard `wide` 60/60; Nightmare `wide` 35/35).

## Änderungen an `sim/data/`

| # | Datei/Feld | alt | neu | Grund (Messwert) |
|---|---|---|---|---|
| 1 | `economy.json` `baseHp` | 100 | **entfällt**, ersetzt durch Block `lives` (`start` 30, `metaBonus` 0, `regenPerWave` 0, `instantLoss` `["boss"]`) | Leben-System statt Base-HP |
| 2 | `economy.json` `leakDamage` und `enemies.json` `leak` je Archetyp | grunt 1, runner 1, flyer 2, splitter 2, brute 3, splitter_child 1, elite 10, boss 34 | grunt 2, runner 2, flyer 3, splitter 3, brute 5, splitter_child 1, elite 8, boss 30 | Basiswerte für `ceil(Basis × Rest-HP-Anteil)`. Skalierung ×1,5-2 wegen der Rundung; Startleben 30 statt 100 entspricht in etwa Base-HP 100 bei alten Kosten (Grunt: 15 statt 100 Leaks bis zum Tod, dafür sind Leaks am Ende deutlich teurer; kalibriert nach unten). Elite 10 → 8: Wert 12 und 5 ändern die Siegquote nur um 0-3 Punkte, 8 = ein Viertel der Leben. Boss = Startleben (30), damit auch ein Wechsel von `instantLoss` das Leben leert |
| 3 | `economy.json` `lives.start` | – | 30 | Scan (n = 40, nach Boss-Anpassung #4), bester Bot je Stufe solo: Start 30 → Normal 90 (`aoe`), Hard 60 (`wide`), Nightmare 38 (`wide`); Start 40 → 100/63/43. 30 liegt für Normal im Ziel 85-95, Hard im Ziel 45-65, Nightmare knapp über 15-35 |
| 4 | `enemies.json` Boss `fHpBp` | 300000 (×30) | **100000 (×10)** | **Zwischenstand bis P4**, nicht kalibriert, sondern nötig: Mit "Boss-Leak = verloren" gewann **kein Bot in keiner Zelle** (0 von 18 Zellen), weil jeder Bot beide Bosse in 100 % der Läufe durchließ (Median Rest-HP boss@10 30 %, boss@20 59-71 %; `aoe` Normal solo 0 %). Scan Boss-HP-Faktor (Normal solo, n = 40, Start 20-40): ×20 → alle 0 %; ×14 → farm 33, upgrade 25, aoe 5; ×12 → aoe 70, farm 68, upgrade 63; **×10 → aoe 90, upgrade 85, farm 80**. Der Boss ist damit zehnmal Grunt-HP, nur etwas über der Elite (×8); sein Rätsel (Phasen, Schwachstellen-Fenster, Schild) kommt mit P4, dann ist der Faktor neu zu setzen |

`difficulties.json` **nicht** angefasst: die HP-Faktoren (#12-#14 aus P1) bleiben Platzhalter für P3. Sie lieferten mit den neuen Regeln ohne Änderung Siegquoten im Zielkorridor, siehe nächste Tabelle.

Tests angepasst bzw. neu: `leaks.test.ts` (komplett neu: Datenfelder, Startleben/Meta, `leakCost`, Kosten nach Rest-HP, Tod bei 0 Leben, Boss-Leak = Niederlage mit fast totem Boss und im godMode, Elite-Regel und Umstellung, Regeneration mit Deckel, unbekannter `instantLoss`-Typ, Determinismus), `income.test.ts`/`infinite.test.ts` (`lives` statt `baseHp`), `pool.test.ts` (Boss-Anteil in Wave 10/20 skaliert mit dem Zwischenstand-Faktor), `report.test.ts` (Basis-Leben aus den Daten). 144 Tests grün, `tsc` sauber.

## Ergebnis: Siegquote vorher / nachher (Bots ohne Fehlermodell)

"Vorher" = Stand P1 (Base-HP 100, Boss-Leak 34 Leben; Messung dieser Sitzung mit n = 40: Normal `upgrade` 95, Hard `wide` 47,5, Nightmare `wide` 22,5; P1-Dokument n = 60: 95/47/27). "Zwischen" = neue Regeln mit unverändertem Boss-HP-Faktor (×30). "Nachher" = Daten wie eingecheckt, echte Läufe (n = 60 solo, n = 30 4P).

| Zelle | vorher bester Bot | Zwischen (Boss ×30) | **nachher bester Bot** | Ziel run.md |
|---|---|---|---|---|
| Normal solo | 95 (`upgrade`) | 0 (alle) | **88** (`aoe`; `upgrade` 80, `farm`/`coop` 68) | 85-95 |
| Hard solo | 47 (`wide`) | 0 | **60** (`wide`; `aoe` 42) | 45-65 |
| Nightmare solo | 27 (`wide`) | 0 | **35** (`wide`; `aoe` 22) | 15-35 |
| Normal 4P | 100 (`upgrade`) | – | **23** (`upgrade`; Rest 0) | ±10 zu 1P |
| Hard 4P | 15 (`upgrade`) | – | **77** (`upgrade`; `aoe` 17) | |
| Nightmare 4P | 2 (`upgrade`) | – | **30** (`upgrade`; Rest 0-3) | |

Alle Bots solo nachher (Normal / Hard / Nightmare): greedy 13/20/2, farm 68/3/3, aoe 88/42/22, upgrade 80/13/7, wide 7/60/35, coop 68/3/3. `greedy` und `wide` verlieren auf Normal an den Bossen (`wide` 38 von 40 Läufen am Boss, nicht an Leben), das ist Bot-Struktur (kein Titan-Plan, billigste Units zuerst) und gehört zu P6.

Regeneration (Nachrechnung, Normal / Hard / Nightmare, bester Bot): 0 → 100/60/38; +1 je Wave → 100/60/43; **+2 je Wave → 100/63/48**. Bei `aoe` (Hard/NM): 38/20 → 50/33 (+1) → 78/48 (+2). Regeneration ist also ein sehr wirksamer Hebel auf Hard/Nightmare (bis +40 Punkte), deshalb Default 0 und nur als Stellschraube für P3 (z. B. Normal +1/+2, Nightmare 0) gedacht.

## Befunde

- **Boss-Leak als Fail-State legt die Boss-Frage offen:** Vor P2 konnte ein Boss-Leak (34 von 100 Base-HP) "mitgenommen" werden und alle Bots gewannen trotzdem. Jetzt entscheidet allein der Boss: Bei Faktor ×30 kein einziger Sieg, bei ×14 nur 5-33 %, bei ×10 Normal 80-90 %. Die Boss-Wave ist die schmalste Klippe im Spiel; P4 muss den Boss so gestalten, dass Titan/Schwachstellen-Fenster ihn lösbar machen, nicht der Faktor.
- **Leben selbst sind selten der Engpass auf Normal:** `upgrade` verliert im Median 2 Leben (P90 ohne Boss/Elite 17), `aoe` 18, `wide` 9; erst bei `greedy`/`farm`/`coop` (Median 20-25, P90 49-58) sterben Läufe an Leben (Normal solo 22 von 40 bzw. 17 von 40 bei Start 20, 4-8 bei Start 30-40).
- **4P ist durch den Boss kaputt, nicht durch Leben:** `upgrade` 4P Normal 23 %, davon 23 von 30 Läufen Boss-Tod, 0 Leben-Tod; Start 60 oder 100 ändert nichts. Der Boss-HP-Faktor skaliert im Koop mit h = 4,3 (3 Zusatzspieler × 1,10), das ist ein Koop-/Boss-Thema (P4/P5), kein Lebensthema. Das Leben-Konto ist team-gemeinsam; ob Leben je Spieler skalieren sollen, gehört zu P5.
- **Hard 4P (77 %) über Normal 4P (23 %)** und Hard solo 13 % für `upgrade`: gleiche Ursache wie in P1 (Stufen unterscheiden sich nur über Elemente/HP-Platzhalter); P3 räumt das ab.
- **Infinite:** Boss alle 10 Waves nutzt dieselbe Boss-HP-Regel (Faktor ×10) und beendet die Runde beim Leak. Die Infinite-Kalibrierung (`economy.json` `infinite`, Runde 3) wurde **nicht** nachgemessen; Tests grün.

## Verworfene Versuche

- **Elite = sofort verloren:** Normal bester Bot 90 → 38 %, Hard 60 → 15 %, Nightmare 38 → 3 % (Nachrechnung Start 30). Verworfen, s. o.
- **Boss-HP ×20 / ×14 / ×12:** Normal 0 / 25 (`upgrade`) / 63-70 %. Zu steil für "nicht ins Bodenlose". Faktor ×10 gewählt.
- **Mehr Startleben statt weniger Boss-HP:** Start 60 oder 100 ändert die Boss-Todesfälle nicht (Normal 4P `upgrade` 23 % bei 30, 60 und 100). Leben helfen nur gegen die Chip-Leaks, nicht gegen den Boss.
- **Grunt-Basis 1 (Leak-Kosten wie vorher):** Rest-HP-Skalierung würde bei den häufigsten Typen nie greifen (ceil und Minimum 1), daher Basis 2.

## Werkzeuge

`sim/scripts/sanity/q9-p2.ts` (`--part raw|eval|check`, siehe Kopfkommentar). `lib.ts`: `PlayResult.leakLog` (jeder Leak einzeln), `P2_BOSSHP` und `P2_ELITEHP` (Experimentüberschreibung des HP-Faktors). Aufruf der Nachrechnung: `npx tsx scripts/sanity/q9-p2.ts --part raw --n 60 --difficulty normal --players 1 --out X.json`, dann `--part eval --files X.json --start 30 --regen 1 --elite loss --verbose 1`.

## Übergabe

- **P3:** HP-Faktoren der Stufen unverändert (Platzhalter). Neue Hebel je Stufe: `lives.start` (Daten sind global, eine stufenabhängige Variante wäre ein kleiner Zusatz) und `regenPerWave` als Entspannung für Normal. Stufen-Zahlen oben sind nur ein Zwischenstand: beste Bots wechseln je Stufe (`aoe` Normal, `wide` Hard/Nightmare).
- **P4:** Boss-HP-Faktor ×10 ist **Zwischenstand**; mit Phasen/Fenstern neu setzen. Boss-Killer (Titan) bleibt unbelegt (alle Bots lassen ihn auf Stufe 0). Elite ggf. mit Kit und dann `instantLoss`-Frage erneut.
- **P5:** Koop braucht Boss-Skalierung (h = 4,3 bei 4P) und die Frage Leben je Spieler; Normal 4P `upgrade` verliert allein am Boss.
- **P6:** Bots reagieren nicht auf Leben (kein Panik-Kauf bei niedrigen Leben, keine Boss-Vorbereitung); menschliche Bots sollten beides tun.

---

# Runde 4 — P3: Schwierigkeit über Regeln

Paket P3 aus `run.md` (Runde 4). Nach `docs/design/ENTSCHEIDUNGEN.md`: Stufen unterscheiden sich über Regeln (Modifier-Dichte, Elemente, Boss-Fähigkeiten, andere Waves), HP-Faktoren nur Feinjustierung. Stand: P2 (Boss-HP ×10 als Zwischenstand). **Die Kalibrierung ist vorläufig**, weil P4 parallel den Boss-HP-Faktor neu setzt; Nachkalibrierung nach dem Merge siehe „Werkzeuge".

## Was die Stufen jetzt unterscheidet

| | Normal (entspannt) | Hard (fordernd) | Nightmare (fordernd, voll) |
|---|---|---|---|
| HP-Faktor (Feinjustierung) | 15600 | 14800 | 14600 |
| Elemente | aus | an, ein Element je Wave | an, **gemischt** (Element je Gruppe versetzt: man braucht mehrere Elemente je Wave) |
| Modifier-Vergabe | keine | 6 % der regulären Gruppen ab Wave 6 (armored, fast, shield:2, regen) | 30 % ab Wave 4 (armored, fast, shield:3, regen) |
| Wellen-Varianten (je Wave seeded) | swarm 30 % (+25 % Anzahl, Abstand ×0,9), air 20 % (20 % der Grunts → Flyer), ab Wave 4 | swarm 20 % (+30 %, ×0,85), air 20 % (40 % der Grunts → Flyer), ab Wave 4 | swarm 30 % (+30 %, ×0,85), air 30 % (40 % → Flyer), ab Wave 3 |
| Leben | Start 30, **+1 je Wave** | Start 30, keine Regeneration | **Start 22**, keine Regeneration |
| Boss-Fähigkeiten-Set (`bossAbilityTier`, für P4) | 0 | 1 | 2 |
| Belohnungsfaktor (`rewardBp`, Meta) | 1,0 | 1,5 | 2,5 |
| Bounty (`bountyBp`) | 1,0 | 1,0 | 1,0 |

Normal ist nicht regelfrei, sondern nur mild: die Varianten geben dem Lauf Abwechslung und verbreitern die Kennlinie (siehe unten), tun aber wenig weh. Neue Regelmechanik: `src/systems/rules.ts` (Modifier-Vergabe, Wellen-Varianten inkl. Typ-Tausch und forcierter Modifier, Element-Modus), Schema-Erweiterung in `difficulties.json`, Challenges als Datenkonzept in `challenges.json` (nicht ausgewertet). Details `sim/README.md` „Stufen-Regeln".

## Änderungen an `sim/data/`

| # | Datei/Feld | alt | neu | Grund (Messwert, n = 40-60, solo, Bots ohne Fehlermodell) |
|---|---|---|---|---|
| 1 | `difficulties.json` `normal.hpBp` | 15200 | **15600** | Normal bekommt Regeneration +1 (#5); das hebt den besten Bot von 88 auf 100 %. Scan (aoe, Regen +1, Variante swarm): 15200 → 100, 15800 → 92,5, 16400 → 67,5 %. 15600 → 90 % |
| 2 | `difficulties.json` `hard.hpBp` | 14800 | **14800** (unverändert), jetzt zusätzlich Regeln | Ohne Regeln lag Hard bei 60 % (`wide`, nur Elemente und HP). Mit den Regeln aus der Tabelle 51,7 % |
| 3 | `difficulties.json` `nightmare.hpBp` | 15600 | **14600** | Die Regeln (Modifier 30 %, Varianten, 22 Leben) tragen die Schwierigkeit; HP wäre sonst doppelt gezählt. 15600 + Regeln lag bei ~0 %, 14600 + Regeln bei 26,7 % |
| 4 | `difficulties.json` neue Felder | – | `elementMode`, `modifiers`, `waveVariants`, `bossAbilityTier`, `lives`, `bountyBp`, `rewardBp` | Schema (zod), Defaults = keine Wirkung. `bossAbilityTier` und `rewardBp` sind nur Daten |
| 5 | `difficulties.json` `normal.lives.regenPerWave` | – (global 0) | **1** | „Entspannt" als Regel: Chip-Leaks heilen. Nachrechnung P2: +1 je Wave hebt Normal bester Bot 88 → 100 %, auf Hard/Nightmare 60 → 60 / 38 → 43 %, deshalb nur Normal |
| 6 | `difficulties.json` `nightmare.lives.start` | – (global 30) | **22** | Leben als Regel-Hebel (fordernd): Start 22 statt 30 senkt Nightmare um ~13 Punkte (n = 40: 62,5 → 42,5 bei Modifier 22 %); kombiniert mit Modifier 30 % → 27,5 |
| 7 | `challenges.json` | – | neu (zwei Beispiele) | nur Datenkonzept |

## Messung: Siegquote Bots solo (n = 60), Stand der eingecheckten Daten

| Stufe | greedy | farm | aoe | upgrade | wide | coop | **bester** | Ziel run.md | Vorher (P2) |
|---|---|---|---|---|---|---|---|---|---|
| Normal | 11,7 | 63,3 | **90** | 85 | 18,3 | 63,3 | **90** | 85-95 | 88 |
| Hard | 15 | 6,7 | 26,7 | 11,7 | **51,7** | 6,7 | **51,7** | 45-65 | 60 |
| Nightmare | 5 | 0 | 0 | **26,7** | 25 | 0 | **26,7** | 15-35 | 35 |

Alle drei Ziele liegen im Korridor (Stichprobenfehler bei n = 60 etwa ±6 Punkte). Beste Bots wechseln je Stufe (`aoe` Normal, `wide` Hard, `upgrade`/`wide` Nightmare): das ist Bot-Struktur (P6), nicht Regel.

## Kennlinie (Siegquote gegen globalen HP-Faktor f, bester Bot, n = 60)

| Stufe (Bot) | 90 % bei f | 50 % bei f | 10 % bei f | Fenster 90 → 10 | Ziel |
|---|---|---|---|---|---|
| Normal (`aoe`) | 1,000 | 1,086 | 1,157 | **15,7** | ≥ 25 |
| Hard (`wide`) | 0,875 | 1,005 | 1,125 | **25,0** | ≥ 25 |
| Nightmare (`wide`) | 0,814 | 0,927 | 1,045 | **23,1** | ≥ 25 |

Vorher (P1/P2): ~14 Punkte. **Erreicht für Hard (25,0), knapp verfehlt für Nightmare (23,1), nicht erreicht für Normal (15,7).** Ursache und Befund:
- Die Bots sind ohne Fehlermodell deterministisch bis auf Crit-Würfe. Eine Siegquoten-Kennlinie wird nur so breit wie die Streuung der Lauf-Stärke. Die **seeded Wellen-Varianten sind die einzige Streuungsquelle**, die P3 hat: ohne Varianten ist die Normal-Kennlinie 9,5 Punkte breit (nur Regeneration), mit leichter swarm-Variante 12,0, mit swarm + air 15,4-15,7; Hard ohne Varianten (nur Modifier) ~18, mit 20 %-Varianten 25.
- Normal ist bewusst „entspannt": stärkere Varianten (mehr Streuung) wären dort kein Entspannen mehr. Die verbleibende Lücke (≥ 25) schließt realistisch nur das Fehlermodell der Bots (P6, Streuung der Spielerstärke); `q6-hp-curve.ts` zeigt, wie eine Streuung von ±10 % Spielerstärke die Kurve faltet. Das ist **nicht durch Datenbiegen erzwungen**, sondern offen für P6.

## Befunde

- **Modifier sind der stärkste Regel-Hebel:** Hard bei HP 14800, Wide-Bot: Elemente allein 60 %, + Modifier 15 % ab Wave 6: 30 %, + Modifier 7 %: 47,5 %; swarm (20 %, +15 %): 55 %; air (20 %, 25 % der Grunts): 52,5 %. Hauptursache: `armored` (+80 Rüstung) macht alle Units mit niedrigem Schaden je Treffer nutzlos, `shield:n` frisst Treffer von Schnellfeuer-Units.
- **Ganze Waves mit forciertem Modifier (`forceModifier: armored`/`shield:2`, Chance 12 %) sind zu hart** für die jetzigen Bots (Hard bester Bot ≤ 10 %). Das Feld bleibt im Schema (getestet), aber in keiner Stufe aktiv; für Challenges gedacht.
- **Flyer-Tausch ist spürbar, aber moderat** (−8 Punkte bei 25 % der Grunts in 20 % der Waves): Flyer brauchen Hill/Hybrid-Units (Entscheidung Flyer), das ist genau der Regel-Unterschied, den die Stufen zeigen sollen.
- **Regeneration** wirkt auf Normal stark und fast nicht auf Hard (siehe #5), deshalb nur dort.
- **Der `upgrade`-Bot gewinnt Nightmare bei höherer Modifier-Dichte nicht schlechter** (n = 40: 55 → 62 % von Dichte 15 auf 22 %), `aoe`/`greedy`/`farm` brechen ein: Er investiert in wenige starke Units, die Rüstung und Schilde schlagen. Messrauschen (±8) eingerechnet bleibt Nightmare ein Ein-Bot-Ziel; Ziel „Rollen" aus P1 lässt sich mit P6 neu prüfen.
- **HP-Spreizung:** 15600 / 14800 / 14600 = 6,8 % zwischen Normal und Nightmare (vorher 15200 / 14800 / 15600, aber ohne Regeln). Die Reihenfolge ist umgekehrt zur Schwierigkeit, weil Normal Regeneration hat und die Regeln den Rest tragen.

## Verworfene Versuche

- **Alle Stufen HP 15200, Regeln allein:** Hard dann 27-37 %, zu schwer; Nightmare 0-10 % mit Modifier 40 %.
- **Nightmare nur über mehr Modifier (kein Leben-Abzug):** Dichte 22 % bei 30 Leben → 62,5 % (`upgrade`), nicht im Ziel.
- **Normal ganz ohne Varianten, regen +1:** funktioniert (Kennlinie 9,5 breit), aber schmaler; Varianten behalten wegen der Streuung.
- **Messfehler (ohne Folgen für die Daten):** erste Scans mit `P3_RULES` umgingen das Schema (fehlende `countBp` → NaN); danach läuft `P3_RULES` über `DifficultySchema.parse`, alle genannten Zahlen stammen aus Läufen danach, außer den ersten beiden Zeilen „Hard ohne Regeln".

## Tests

Neu `test/difficulty.test.ts` (16 Tests): Daten (HP-Spreizung < 8 %, Regel-Unterschiede, Schema-Defaults, Querprüfungen, Challenges), Waves (Determinismus, Seed-Abhängigkeit, Boss/Elite unverändert, Modifier-Dichte und fromWave, swarm/air/forceModifier, Element-Modus, Stufe ohne Regeln), Sim (Leben je Stufe, Modifier tatsächlich auf Gegnern, `bountyBp`, `rewardBp`/`bossAbilityTier` ohne Wirkung). `test/helpers.ts`: `plainData()` (Stufen-Regeln neutral, HP bleibt) ist jetzt Standard für alle regelunabhängigen Tests; `createSim` aus den Helpers nutzt es. 160 Tests grün, `tsc` sauber.

## Werkzeuge

`sim/scripts/sanity/p3-check.sh N TAG` (alle Zahlen oben, ~1,5 min bei N = 60) und `p3-check.ts --part rates|curve|rules`; `lib.ts`: `P3_RULES` (Regeln je Stufe überschreiben, schema-geprüft). `q9-p2.ts raw` hebt jetzt auch die Leben-Überschreibung der Stufen auf.

## Übergabe

- **P4:** Boss-HP-Faktor neu setzen, danach `sh scripts/sanity/p3-check.sh 60 nachmerge` und die Stellschrauben (HP je Stufe ±1 % ≈ ∓6 Punkte, Modifier-Dichte, Nightmare-Startleben) anpassen. `bossAbilityTier` ist belegt (0/1/2), `previewWave` liest `getWave(ctx, n)` (enthält Stufen-Regeln), `pickVariant(ctx, n)` nennt die Variante. Wellen-Varianten, die den Boss ändern, gehören zu P4.
- **P5:** Koop nicht gemessen; die Regeln gelten für jede Spielerzahl, Leben bleiben team-gemeinsam.
- **P6:** Kennlinie Normal ≥ 25 und die Rollen-Fairness der Bots (`upgrade` trägt Nightmare) hängen am Fehlermodell.

# Runde 4 — P4: Boss-Kits, Wellenvorschau, Risikokarten

Paket P4 aus `run.md` (Runde 4), Kniffe K5 und K1 aus `docs/design/ENTSCHEIDUNGEN.md`. Gemessen mit den Registry-Bots (ohne Fehlermodell), `standard20`, solo, n = 40 (Standardfehler ±5-8 Punkte), Stand nach P2. `difficulties.json` wurde **nicht** angefasst (P3); die Stufen-Schnittstelle der Kits steht in `sim/README.md`.

## Was gebaut wurde

| Baustein | Inhalt | Datei |
|---|---|---|
| Boss-Phasen | HP-Schwellen -> Phase, Phasen-Aktionen (Schild, Beschwörung, Fenster) | `data/bosses.json`, `src/systems/boss.ts` |
| Telegraph | `bossTelegraph` (Vorwarnzeit 40-60 Ticks, `fireTick`), `bossCast`, Stun unterbricht | `boss.ts`, `effects.ts` (`applyStun`) |
| Schwachstellen-Fenster | Schaden x1,4-1,6, volle Stun-Dauer ohne Sperre; geöffnet durch Schild-Bruch, Unterbrechung, Wirkung, Erschöpfung nach dem Sturm | `boss.ts`, `effects.ts` (`applyDamage`) |
| Schildphase | Schild 12 % der Max-HP (8 % im zweiten Schild), läuft nach 15 s ab, absorbiert alles inkl. True Damage | `boss.ts` |
| Beschwörung | 3-4 Grunts hinter dem Boss; Last Stand (W20): 2 Brutes | `boss.ts` |
| Stufen-Schnittstelle | `minDifficulty` je Fähigkeit/Aktion | Schema, `README.md` |
| Wellenvorschau | `sim.previewWave(n, cardId?)` / `previewWave(sim, n)` | `src/systems/cards.ts`, `src/index.ts` |
| Risikokarten | 8 Karten, Befehl `chooseCard`, Effekt beim Wave-Start | `data/cards.json`, `cards.ts`, `waves.ts`, `spawn.ts`, `move.ts` |
| Bots | Fenster nutzen (`useAbilities`), Karten nehmen (`takeCard`, Suffix `+cards`), beides abschaltbar | `src/bots/util.ts`, `index.ts` |

## Die zwei Bosse

| | **Hollow Warden** (Wave 10) | **Rift Colossus** (Wave 20, Final-Boss) |
|---|---|---|
| Lehre | Beschwörung abräumen, Schild brechen (Burst), Fenster nutzen | alle Mechaniken der Stage plus Heilung unterbrechen |
| Phasen (HP) | 100 % wach, 65 % Schild, 30 % Wut | 100 % wach, 75 % Schild, 50 % Heilen, 25 % Last Stand |
| Fähigkeiten (Normal) | Ruf: 3 Grunts, Warnung 2 s, alle 20 s | Ruf (Phase 0-1): 4 Grunts; Heilung ab Phase 2: +8 % Max-HP, Warnung 3 s, unterbrechbar (Stun -> Fenster 5 s x1,6); Sturm ab Phase 3: Tempo x2 für 3 s, unterbrechbar, Erschöpfungs-Fenster |
| Phasen-Aktionen | Schild 12 % (Fenster 5 s x1,6 bei Bruch) | Schild 12 % (Phase 1); Last Stand: 2 Brutes |
| Nur ab Hard | Sturm (Phase 2) | zweiter Schild 8 % in Last Stand |
| Nightmare | wie Hard (Hebel für P3: weitere Zeilen in `bosses.json`) | wie Hard |

## Änderungen an `sim/data/`

| # | Datei/Feld | alt | neu | Grund (Messwert) |
|---|---|---|---|---|
| 1 | neu `bosses.json` | – | Kits `warden` (W10), `colossus` (W20) | K5 |
| 2 | neu `cards.json` | – | 8 Karten | K1 |
| 3 | `enemies.json` Boss `fHpBp` | 100000 (x10, P2-Zwischenstand) | **110000 (x11)** | Scan mit Kits, Normal solo, n = 30-40, `aoe`/`aoe-notitan`/`upgrade`: x7 -> 88/100/90 %, x8,5 -> 88/-/78, x10 -> 87/90/70, **x11 -> 88/57/65**, x11,5 -> 75/38/57, x12 -> 60/7/50, x14 -> 3/0/40. Die Kits machen den Boss härter (Beschwörungen, Heilung), deshalb x11 trotz Titan-Nuke x12. Klippe zwischen x11 und x14 wie in P2 (ein Faktor 1,3 kippt alles) |
| 4 | `units.json` Titan Nuke `damageMulBp` | 50000 (5x) | **120000 (12x)** | Titan war mit 5x kein Boss-Killer: bei x13 Boss-HP gewannen `aoe` (mit Titan) und `aoe-notitan` beide 3 %; mit Nuke 10x/15x/20x: 8/35/73 % gegen 3 %. 12x: bei x11 gewinnt der Titan-Bot 88 %, derselbe Bot ohne Titan 57 % (+31 Punkte). Die Nuke ist durch die Bots (Fenster-Regel) nur noch auf Boss und Schild-Bruch gezündet, dadurch kein Wave-Clear mehr; der Titan-Anteil `dpsShareBp` (5000, P1) bleibt |
| 5 | `tests/leaks.test.ts` | – | Kits für den Leak-Summentest aus | Beschwörungen sind zusätzliche Leaks außerhalb der Stage-Tabelle |

## Ergebnis: Siegquote bester Bot solo, vorher / nachher

"Vorher" = Stand nach P2 (n = 40 neu gemessen, Boss x10, keine Kits, Nuke 5x), "nachher" = Stand dieser Datei (n = 40). Alle Bots ohne Karten.

| Bot | Normal v -> n | Hard v -> n | Nightmare v -> n |
|---|---|---|---|
| greedy | 12,5 -> 0 | 20 -> 5 | 2,5 -> 0 |
| farm | 70 -> 45 | 2,5 -> 7,5 | 2,5 -> 7,5 |
| aoe | 90 -> **87,5** | 37,5 -> **42,5** | 20 -> **35** |
| upgrade | 85 -> 65 | 12,5 -> 22,5 | 7,5 -> 10 |
| wide | 5 -> 0 | 60 -> 22,5 | 37,5 -> 2,5 |
| coop | 70 -> 45 | 2,5 -> 7,5 | 2,5 -> 7,5 |
| **bester** | 90 (`aoe`) -> **87,5 (`aoe`)** | 60 (`wide`) -> **42,5 (`aoe`)** | 37,5 (`wide`) -> **35 (`aoe`)** |

Boss-Tod-Anteil (Verlust durch Boss-Leak, Normal): `aoe` 0 -> 7,5 %, `upgrade` 12,5 -> 30 %, `greedy` 55 -> 60 %, `wide` 95 -> 95 %. Es stirbt fast nur am **Wave-20-Boss** (Wave-10-Boss: 0 Leaks in allen Läufen der Scans); Rest-HP des Bosses beim Leak im Median 5-22 %, der Boss ist also eine knappe Prüfung und kein HP-Schwamm.

## Belege

**Titan als Boss-Killer (Normal solo, n = 40, Boss x11).** `aoe` (Titan per Plan): 88 %, Boss-Leaks 3 von 40. Derselbe Bot ohne Titan (`aoe-notitan`, Experiment-Bot in `q11-boss.ts`): **57 %**, Boss-Leaks 17 von 40. Bei Boss x12-13 gewinnt nur der Titan-Bot noch (60 % gegen 7 %). Titan ist damit belegt als Boss-Antwort, aber keine Pflicht: bei x10 und darunter gewinnt der Bot auch ohne (90 %).

**Fenster-Nutzung durch Bots.** Fähigkeiten, die im offenen Schwachstellen-Fenster gezündet werden (je Lauf, `aoe`): 1,0 mit alter Regel (sofort) -> **7,2** mit Fenster-Regel; je Lauf öffnen sich 2-3 Fenster, das Schild wird in 98 % der Läufe gebrochen (Fenster danach), selten läuft es ab (0-13 %). Unterbrechungen der Heilung: 0,1-0,3 je Lauf (Frost ist meist gerade im Cooldown). **Ehrlich:** Auf die Siegquote wirkt die Regel bei x11 nicht messbar (`aoe` 88 % mit gegen 90 % ohne Fenster-Regel, `upgrade` 65/65 %): Die Titan-Nuke ist so stark, dass der Zeitpunkt zweitrangig ist. Die Fenster sind also bedienbar und werden genutzt, aber noch kein Muss; ein steileres Fenster (x2) oder ein engeres Zeitfenster wäre ein P6/P3-Hebel.

**Risikokarten (Bot `+cards`, Tabelle unten).** Siehe nächster Abschnitt.

## Risikokarten: Katalog und Bot

| ID | Tier | Effekt |
|---|---|---|
| `thick-hide` | 1 | +30 % HP, +50 % Bounty |
| `swift` | 1 | +25 % Tempo, +40 % Bounty |
| `swarm` | 2 | +50 % Gegner (aufgerundet), +25 % Bounty je Gegner |
| `warded` | 2 | Schild 2 auf jedem Gegner (vorhandene Schilde bleiben), +60 % Bounty |
| `regrowth` | 2 | Regeneration, +40 % Bounty |
| `ironclad` | 3 | Armored (+80 Rüstung), +90 % Bounty |
| `blood-toll` | 3 | Leaks kosten doppelt Leben, +80 % Bounty |
| `gold-rush` | 3 | +60 % HP, +100 % Bounty |

Regeln: eine Karte je Wave (die nächste zu startende), nicht auf Boss-Waves, Boss/Elite behalten Anzahl und Modifier. Bounty-Aufschläge sind DESIGN-Startwerte (grob "Aufschlag = 1,5 x Mehr-Aufwand"), nicht kalibriert.

**Bot-Strategie "nimmt Karten, wenn stark"** (`takeCard`, Suffix `+cards`, abschaltbar): ab 3 Waves ohne Lebensverlust Tier 1, ab 6 Tier 2, ab 10 Tier 3, mindestens 85 % Leben, nur Waves bis 15, nie auf Boss-Waves; gewählt wird der höchste Bounty-Aufschlag im erlaubten Tier. Siegquote Normal / Hard / Nightmare solo (n = 40), ohne -> mit Karten:

| Bot | Normal | Hard | Nightmare |
|---|---|---|---|
| aoe | 87,5 -> 82,5 | 42,5 -> 37,5 | 35 -> 15 |
| upgrade | 65 -> **90** | 22,5 -> 37,5 | 10 -> – |
| wide | 0 -> 65 | 22,5 -> **65** | 2,5 -> **32,5** |

Lesart: Karten sind eine echte Wette. Schwache Bots (`wide`, `upgrade`) profitieren über den Bounty-Aufschlag (Münzen früh = stärkere Verteidigung), der beste Bot (`aoe`) verliert 5-20 Punkte, weil die Strategie "keine Leaks in den letzten Waves" für ihn kein sicheres Stärke-Signal ist (Nightmare: eine harte Karte in Wave 13-15 reißt ihn). Die Strategie ist nicht optimiert; Siegquoten der Stufen-Kalibrierung (P3/P5/P6) werden **ohne** Karten gemessen.

## Verworfene Versuche

- **Boss-HP nur über den Faktor lösen** (ohne Titan-Nuke-Anhebung): bei x10 gewinnt der Bot ohne Titan genauso (90 %), der Titan wäre nur Kostenpunkt.
- **Nuke 5x/10x/15x/20x:** 5x und 10x lassen den Titan zu schwach (bei Boss x13 8 % gegen 3 %), 20x löst den Boss mit einem einzigen Nuke (73 %) und macht den Titan wieder zur Pflicht. 12x ist der Kompromiss.
- **Karten-Strategie erste Fassung** (ab 2/4/6 Waves ohne Verlust, 70 % Leben, alle Waves): `aoe+cards` fiel von 88 auf 45 % (Normal) und von 43 auf 5 % (Hard). Eine Karte `ironclad`/`gold-rush` in Wave 16-19 reißt knappe Verteidigungen. Daher strenger.

## Übergabe

- **P3 (Schwierigkeit):** Die Kits sind pro Stufe schaltbar (`minDifficulty`). Hard/Nightmare haben heute nur "Sturm in W10" und "zweiter Schild in W20" zusätzlich. Mit den Kits liegt der beste Bot auf **Hard bei 42,5 %** (Ziel 45-65) und auf **Nightmare bei 35 %** (Ziel 15-35); `wide` (früher bester Bot auf Hard/NM) stirbt jetzt am Boss, weil er keinen Titan und kein Fenster spielt. Die HP-Faktoren der Stufen sind nach dieser Änderung erneut zu scannen.
- **P6 (Bots):** `greedy`, `wide`, `farm`, `coop`, `upgrade` haben keinen Boss-Plan: ohne Titan oder Frost-Fenster verlieren sie am Wave-20-Boss (Normal: greedy 60 %, wide 95 % Boss-Tod). Der Plan (`Policy.plan`) kann jetzt aus `sim.previewWave(n).boss` gespeist werden ("Boss in 5 Waves: auf Titan sparen"). Menschliche Bots sollten außerdem Karten nach dem Stärke-Signal wählen (`takeCard` ist ein erster Ansatz).
- **P5 (Koop):** Boss-HP skaliert mit `coopHpBp` wie alle Gegner; Schild und Heilung skalieren über Max-HP mit. Nicht gemessen.
- **Infinite:** Bosse ab Wave 21 haben kein Kit; Wave 10/20 des Infinite-Modus nutzen die Kits. Infinite-Kalibrierung nicht nachgemessen (Tests grün).

## Werkzeuge

`sim/scripts/sanity/q10-p4.ts` (Siegquote und Boss-Tod-Anteil, `--bots aoe+cards`), `q11-boss.ts` (Boss-Diagnose, Experiment-Bot `aoe-notitan`). Experimente per Umgebung: `P2_BOSSHP` (Boss-HP-Faktor), `P1_PATCH` (Unit-Felder, z. B. Nuke), `P4_NOWINDOW=1`, `P4_NOCARDS=1`.

# Runde 4 — Nachkalibrierung nach dem Merge P3 × P4 (Hauptsitzung)

Nach dem Merge steuert `bossAbilityTier` (P3) das `minDifficulty`-Gate der Boss-Kits (P4). Messung `sh scripts/sanity/p3-check.sh 60 merge` (solo, n = 60, Bots ohne Fehlermodell, Boss-HP ×11, Titan-Nuke 12×):

| Stufe | bester Bot direkt nach Merge | Ziel | Maßnahme |
|---|---|---|---|
| Normal | 93,3 % (aoe) | 85–95 | keine |
| Hard | 30 % (wide) | 45–65 | Regel-Hebel `bountyBp` (nicht HP) |
| Nightmare | 30 % (upgrade) | 15–35 | keine |

| Datei/Feld | alt | neu | Grund |
|---|---|---|---|
| `difficulties.json` `hard.bountyBp` | 10000 | **11000** | Boss-Kits ab Hard (Sturm, zweiter Schild beim Colossus) senkten Hard auf 30 %. Erster Versuch `hard.hpBp` 14800 → 13900 (wide 56,7 %) verworfen: verletzt „HP nur Feinjustierung" (Test `difficulty.test.ts`, Spreizung ≤ 8 %, wäre 12 %). Stattdessen mehr Münzen als Regel. Scan n = 60: 11000 → aoe 53,3 / wide 50 %; 11500 → 91,7 %; 12000 → 93,3 %. **Steile Klippe** zwischen 11000 und 11500: Hard hängt am Kauf-Zeitpunkt des Titan vor dem Colossus. Das ist ein Thema für P6 (Fehlermodell) und den Boss-Plan der Bots. |

Kennlinien nach Merge (vor der Hard-Änderung, `hard.hpBp` bleibt 14800): Normal aoe 90 → 10 % über **8,8** Punkte HP-Faktor (schmaler als in P3, weil die Boss-Kits eine harte Klippe setzen); Hard und Nightmare nicht bestimmbar, weil die Kurve im Scanbereich 0,8–1,3 die 90 % nicht erreicht. Das Ziel „Breitere Kennlinie ≥ 25" ist damit **verfehlt**; erst das Fehlermodell (P6) bringt Streuung in die Bots. Ehrlich: Mit deterministischen Bots ist die Kennlinie eine Treppe, keine Kurve.

---

# Runde 4 — P5: Koop-Skalierung

Paket P5 aus `run.md` (Runde 4). Ziel „Koop fair“: je Stufe Siegquote 1P/2P/4P innerhalb ±10 Punkte, für jeden Bot. Gemessen mit den sechs Registry-Bots (ohne Fehlermodell), `standard20`, Stand nach P3 × P4 und Nachkalibrierung (Hard `bountyBp` 11000, Boss-HP ×11). Werkzeuge: `sim/scripts/sanity/p5-coop.ts` (Matrix), `p5-coop.sh` (je Stufe ein Prozess), `p5-scan.sh` (Raster der HP-Tabelle). **Ergebnis: Ziel verfehlt, Zwischenstand** — nur Normal ist für den besten Bot (`aoe`) fair, Hard/Nightmare sind im Koop zu leicht, und die Bots verhalten sich im Koop so verschieden, dass kein globaler Faktor alle zugleich trifft.

## Änderungen

| Datei/Feld | alt | neu | Grund |
|---|---|---|---|
| `economy.json` `coop.hpTableBp` (neu, optional) | – (lineare Formel `10000 + 11000 × (n−1)`, also 1 / 2,1 / 3,2 / 4,3) | **`[10000, 15000, 17500, 20000]`** (1 / 1,5 / 1,75 / 2,0) | Der alte Faktor machte 4P zur Wand (Boss ×4,3): `aoe` Normal 95 → 5 / 0 %, alle Bots 0–5 % auf 4P. Mit der Tabelle `aoe` Normal 95 / 87,5 / 97,5 %. Tabelle statt Formel, weil 4P mit nur 23 Kampf-Slots deutlich weniger als linear skaliert (Slot-Sättigung, s. u.). Eintrag für 1 Spieler muss 10000 sein (Solo unberührt, `load.ts` prüft) |
| `economy.json` `coop.bossHpTableBp` (neu, **nicht gesetzt**) | – | – | Hebel „Boss-HP getrennt“ ist im Kern gebaut (`coopHpFor`, nur Archetyp `boss`) und getestet, aber in den Daten aus: der Boss ist so steil, dass Boss-Faktor 1,6 / 1,9 / 2,2 gegen 1,5 / 1,75 / 2,0 für die übrigen Gegner `aoe` Normal 4P von 97 auf 57 % und Normal 2P von 90 auf 23 % fallen lässt, 3,0 bei 4P auf 0 %. Als Feineinstellung brauchbar, als Hauptregler zu grob |
| `hpPerExtraPlayerBp` | 11000 | 11000 (bleibt, gilt nur noch ohne Tabelle) | Rückwärtskompatibel, Tests lesen die Tabelle |

Code: `schema.ts` (zwei optionale Arrays), `compile.ts` (`coopHpBp` aus Tabelle, `coopBossHpBp`, `coopHpFor(ctx, type)`), `spawn.ts`/`waves.ts` (Spawn-HP und Wellenpool nutzen `coopHpFor`), `load.ts` (`validateCoop`). Tests: neu `test/coop.test.ts` (6 Tests: Tabelle, Formel-Rückfall, Boss getrennt, Solo unberührt, Validierung); `damage.test.ts` und `pool.test.ts` lesen die Tabelle statt der Formel (Bounty-Mindestfaktor 3 → 1,5, weil die Bounty der Koop-HP folgt).

## Matrix Siegquote %, Bot × {1P, 2P, 4P} × Stufe (n = 40; Standardfehler ±5–8 Punkte)

Vorher = Daten wie vor P5 (Formel 1 / 2,1 / 4,3). Nachher = Tabelle oben. Spanne = max − min je Bot.

| Bot | Normal 1P | 2P v → n | 4P v → n | Hard 1P | 2P v → n | 4P v → n | Nightmare 1P | 2P v → n | 4P v → n |
|---|---|---|---|---|---|---|---|---|---|
| greedy | 0 | 0 → 2,5 | 0 → 12,5 | 17,5 | 2,5 → 12,5 | 0 → 0 | 0 | 0 → 0 | 0 → 0 |
| farm | 47,5 | 0 → 27,5 | 0 → 5 | 5 | 17,5 → 65 | 0 → 10 | 0 | 0 → 5 | 0 → 0 |
| aoe | 95 | 5 → **87,5** | 0 → **97,5** | 52,5 | 77,5 → 92,5 | 5 → 100 | 0 | 12,5 → 32,5 | 0 → 97,5 |
| upgrade | 60 | 80 → 100 | 2,5 → 97,5 | 27,5 | 95 → 97,5 | 82,5 → 100 | 32,5 | 90 → 100 | 75 → 100 |
| wide | 0 | 0 → 0 | 0 → 15 | 42,5 | 5 → 20 | 0 → 0 | 2,5 | 2,5 → 0 | 0 → 0 |
| coop | 47,5 | 0 → 25 | 0 → 42,5 | 5 | 5 → 60 | 0 → 7,5 | 0 | 0 → 2,5 | 0 → 10 |

Bester / schlechtester Bot je Zelle (nachher): Normal 1P 95 (aoe) / 0 (greedy, wide), 2P 100 (upgrade) / 0 (wide), 4P 97,5 (aoe, upgrade) / 5 (farm). Hard 1P 52,5 / 5, 2P 97,5 / 12,5, 4P 100 / 0. Nightmare 1P 32,5 (upgrade) / 0, 2P 100 / 0, 4P 100 / 0.

Ziel (Spanne ≤ 10) je Bot, nachher: **erreicht** nur `aoe` Normal (10,0), `greedy` Nightmare, `wide` Nightmare, `farm` Nightmare (alle drei trivial: 0 % überall). **Verfehlt:** `upgrade` (Spanne 40 / 72,5 / 67,5), `aoe` Hard/Nightmare (47,5 / 97,5), `farm`/`coop` (Boss-Plan fehlt, 1P schon schwach, Spanne 22–60), `greedy`/`wide` Hard (17,5–42,5).

## 1P-Gegenmessung

Die Spalte 1P der Nachher-Matrix ist **bit-identisch** zur Vorher-Matrix (alle 18 Zellen gleich, n = 40, gleiche Seeds). Das gilt konstruktionsbedingt: `hpTableBp[0]` = 10000 ist gleich dem Solo-Wert der alten Formel, `load.ts` erzwingt das, und `test/coop.test.ts` prüft, dass beliebige Koop-Tabellen die Solo-HP und den Solo-Wellenpool nicht ändern. Solo bleibt: bester Bot Normal 95 (aoe), Hard 52,5 (aoe), Nightmare 32,5 (upgrade).

## Hebel geprüft

| Hebel | Messung | Urteil |
|---|---|---|
| Linearer Faktor `k` (Formel) | Normal, n = 30, 2P/4P: k = 5000: aoe 90/57, upgrade 100/90; 7000: aoe 47/10, upgrade 90/70; 9000: aoe 13/0, upgrade 83/13 | Kein k passt für 2P **und** 4P: 4P braucht deutlich weniger als linear. Darum Tabelle |
| **HP-Tabelle je Spielerzahl** | Raster Normal (2P:4P in 1000er): 1,6:2,0 → aoe 60/97, upgrade 100/97; 1,6:2,4 → aoe 60/50; 1,8:2,2 → aoe 17/80; 1,8:2,6 → aoe 17/40; 1,5:2,0 → **aoe 90/97**, upgrade 100/97 | Gewählt (1,5 / 1,75 / 2,0): einfachster Hebel, eine Datenzeile. Sehr steile Klippe: ±0,1 am 2P-Faktor ≈ −40 Punkte `aoe` |
| Boss-HP getrennt | Tabelle oben (Zeile `bossHpTableBp`) | Gebaut, aus. Hebel greift an der Boss-Klippe, nicht an der Gesamtstärke |
| Slot-Zahl je Spieler | Experiment (`P5_SLOTS=8`: 8 Zusatz-Slots je Zusatzspieler, k 7000–10000): `aoe` 2P/4P 77/100 (k 7000), 63/77 (9000), 47/47 (10000), also gut linear; **aber** `upgrade` fällt 4P von 70 auf 30 % (k 7000) bzw. 3 % (10000) | Ursache: In der Stage gibt es nur 23 Kampf-Slots (3 weitere sind Farm-Slots). 4P füllt sie (`aoe` 2P/4P je 23 Einheiten, solo 15), das trifft Einheiten-hungrige Bots (`aoe`) und begünstigt den Upgrade-Bot, der Münzen auf wenige Einheiten konzentriert. Mehr Slots drehen das um. Kein Hebel, der beide Bots zugleich fair macht, und er verlangt Map-Änderung (neue Slot-Koordinaten). Nicht übernommen |
| Upgrade-Kosten im Koop, Cap gemeinsam/getrennt, Leben je Spieler | **nicht gemessen** (Zeit) | Leben: P2 zeigte, Startleben 30/60/100 ändert 4P nicht (alles Boss-Tod). Upgrade-Kosten und Caps: offen |

## Was offen bleibt

- **Hard/Nightmare im Koop zu leicht** (aoe/upgrade 90–100 % gegen 0–52 % solo). Die Stufen-Regeln (Modifier, Varianten) bremsen im Koop weniger, weil mehr Schaden pro Gegner da ist; ein Koop-Faktor, der Normal trifft, ist für Hard/Nightmare zu klein. Nächster Schritt: **Koop-Tabelle je Stufe** (z. B. Feld `coopHpTableBp` in `difficulties.json`, Normal wie jetzt, Hard/Nightmare höher), danach Raster mit `p5-scan.sh STUFE 30 "H2:H4 …"`.
- **`upgrade` Normal 1P 60 gegen 2P/4P 100 %:** Der Bot skaliert im Koop überproportional (mehr Münzen auf gleich wenige, sättigende Slots). Das ist ein Bot-Thema (P6), kein Faktor.
- **`farm`/`coop`/`greedy`/`wide`:** scheitern strukturell am Boss (kein Boss-Plan) und an den knappen Farm-Slots im Koop; P6. Ihre Koop-Zahlen wurden nicht verbogen.
- Die Messung ist deterministisch pro Seed, aber n = 40 und die Klippe am Boss ist steil: ±10 Punkte Streuung je Zelle sind normal.

---

# Runde 4 — P6: Fehlermodell der Bots und Endkalibrierung

Paket P6 aus `run.md` (Runde 4). **Stand: Teil A (Bots) fertig, Teil B (Endkalibrierung) teilweise.** Gemessen, soweit nicht anders genannt, mit Profil `normal`, `standard20`, solo, n = 100 (Siegquoten je Stufe) bzw. n = 40 (Matrizen, Leave-one-out, Koop; Standardfehler ±5–8 Punkte). Werkzeug-Skripte laufen mit `BOT_PROFILE=normal` (neu, `scripts/sanity/lib.ts`); Bots ohne Profil sind die fehlerfreien Registry-Bots der Runden 1–5.

## Teil A — Was gebaut wurde

**Boss-Plan für alle Bots** (`src/bots/util.ts`, `bossPlanStep`, `bossNeeds`): gespeist aus `sim.previewWave(n).boss` und den Kit-Daten (`sim.bossKits()`, nur die auf der Stufe aktiven Fähigkeiten). Boss im Horizont → eine Unit mit Nuke-Fähigkeit (Titan) wird angeschafft, bei einem unterbrechbaren Kit-Zug (z. B. Heilung des Colossus, Sturm auf Hard) zusätzlich eine Stun-Unit (Frost). Der Bot spart darauf (ab 40 % der Kosten wird nichts anderes gekauft), unabhängig von den Gewichten und `canPlace` der Policy. Horizont = `min(Wellenwissen, botTuning.bossPlanWaves = 3)` Waves vor dem Boss; ohne Wellenwissen (Horizont 0) reagiert der Bot erst, wenn der Boss auf dem Feld steht. Abschaltbar: `botTuning.bossPlan = false` (`P6_NOBOSSPLAN=1`), je Policy `bossPlan: false`. Die Fenster-Nutzung aus P4 (`windowAware`) gilt über `playTurn` ohnehin für alle Bots, sie hatte nur keine Titan/Frost-Einheit zum Zünden. Zusätzlich gebaut, **aus**, weil ohne Wirkung gemessen: `bossUpgradeBoost`, `bossNukeLevel` (Titan vor dem Boss ausbauen; Siegquote unverändert), `bossPlanSave = false` (nicht sparen: Titan kommt dann nicht, Ergebnis wie vor dem Plan).

**Fehlermodell** (`data/botProfiles.json`, zod `BotProfileSchema` in `schema.ts`, `loadBotProfiles` in `load.ts`; getrennt von `GameData`). Aufruf: `getBot('aoe@normal')`, `'upgrade+cards@casual'`, `'@none'` = fehlerfrei; ohne `@` gilt `botTuning.profile` (Standard fehlerfrei, `BOT_PROFILE=...`). Alle Würfe laufen über einen eigenen PRNG des Bots (`memo.frng`, beim ersten Gebrauch aus dem seeded Bot-PRNG abgeleitet, nie der Sim-PRNG): ein Lauf ist je Seed und Profil reproduzierbar, der Sim-Hash ohne Bots bleibt unverändert (Test).

| Parameter | Wirkung | casual | normal | expert |
|---|---|---|---|---|
| `buyDelaySec` | zusätzliche Pause (s, gleichverteilt) zwischen zwei Kaufrunden | 0–2 | 0–1 | 0 |
| `worseSlotBp` | Chance je Platzierung auf einen Slot aus der **schlechteren Hälfte** (nach Bot-Bewertung) für dieselbe Unit | 35 % | 12 % | 1,5 % |
| `forgetUpgradeBp` | Chance je Unit und Wave, dass Upgrades dieser Unit in dieser Wave vergessen werden | 30 % | 10 % | 1 % |
| `abilityDelaySec` | Verspätung zwischen „Fähigkeit wäre sinnvoll“ und Zünden (verpasst Boss-Fenster von 3–5 s) | 2–5 | 0–2 | 0 |
| `lookahead` | Wellenwissen: Waves voraus per `previewWave`; 0 = keines | 0 | 3 | 8 (Plan-Horizont gekappt auf 3) |

Messbefunde, die die Werte bestimmt haben (n = 60, Hard `wide` bzw. Nightmare `upgrade`, ein Parameter allein):
- **Kaufverzögerung hilft** im Sim (Hard `wide` 78 → 93 %, Nightmare `upgrade` 10 → 25 % bei 2–8 s): die Bots kaufen sonst jede Münze sofort in billige Optionen, mit Pause bündeln sie und erreichen teurere Units. Sie ist deshalb klein gehalten (0–2 s); ein größerer Wert hätte casual über expert gestellt. Das ist ein Befund über die Bots (Sparlogik der Policies), nicht über Menschen.
- Zufälliger Slot (statt schlechtere Hälfte) war **nicht** schlechter (88 gegen 78 %): die Slot-Bewertung der Bots (DPS × Abdeckung) ist keine gute Qualitätsmetrik. Darum „schlechtere Hälfte“.
- Verspätete Fähigkeiten −10 Punkte, vergessene Upgrades 0 bis −4, kein Wellenwissen −8 (Hard `wide`).

## Teil A — Wirkung des Boss-Plans (fehlerfreie Bots, n = 40, Normal/Hard solo)

| Bot | Normal Sieg % vorher → nachher | Normal Boss-Tod % | Hard Sieg % | Hard Boss-Tod % |
|---|---|---|---|---|
| greedy | 0 → 20 | 70 → 12,5 | 17,5 → 17,5 | 22,5 → 10 |
| wide | 0 → 67,5 | 97,5 → 30 | 42,5 → 77,5 | 45 → 20 |
| upgrade | 60 → 97,5 | 40 → 0 | 27,5 → 10 | 0 → 0 |
| farm / coop | 47,5 → 47,5 | 7,5 → 0 | 5 → 27,5 | 2,5 → 0 |
| aoe | 95 → 95 | 2,5 → 2,5 | 52,5 → 52,5 | 0 → 0 |

Der Boss von Wave 10 leakt nicht mehr (0 von 40 in allen Bots); Rest: Wave 20, Rest-HP des Bosses beim Leak ~10 %. **Nebenwirkung:** der `upgrade`-Bot fällt auf Hard/Nightmare von 27/32 auf 2–10 %: er hortet für den Titan, erreicht das 6-Typen-Limit und hat dann nur fünf Einheiten (Wave 13/18 Verlust durch Leaks, nicht durch den Boss). Der Titan ist kein Gewinn für jeden Bot (siehe Leave-one-out).

## Teil B — Änderungen an `sim/data/`

| # | Datei/Feld | alt | neu | Grund (Messwert, Profil `normal`, solo) |
|---|---|---|---|---|
| 1 | `botProfiles.json` | – | neu: casual / normal / expert | Teil A |
| 2 | `difficulties.json` `normal.hpBp` | 15600 | **15300** | Mit Fehlermodell fiel der beste Bot auf 68–80 %. Scan n = 60: 15000 → 96,7; 15300 → 85; 15600 → 80. n = 100: **85** (aoe 83, upgrade 85) |
| 3 | `difficulties.json` `hard.bountyBp` | 11000 | **10600** | Mit Boss-Plan und Fehlermodell lag `wide` bei 83 % (Hard-Ziel 45–65). Scan n = 100 (`wide`): 10500 → 41, **10600 → 57**, 10700 → 64. Ein steiler Hang von ~7 Punkten je 100 bp, aber mit Fehlermodell und Boss-Plan keine Klippe mehr wie im Bare-Bot-Scan (11000 → 53, 11500 → 92: ~8 je 100 bp, dort aber nur zwei Stützstellen). Stufe mittig im Hang |
| 4 | `difficulties.json` `nightmare.bountyBp` | 10000 | **10600** | Nightmare lag bei 10–20 % (Ziel 15–35). HP-Weg verworfen (14000 → 23 %, 13700 → 38 %, aber HP-Spreizung > 8 %, Test `difficulty.test.ts`), Startleben 26/30 brachte +3/+8 Punkte, Modifier-Dichte senken nichts. Scan n = 60: Bounty 10300 → 15, 10500 → 17, 10700 → 28, 11000 → 50. n = 100 bei 10600: **24** |
| 5 | `difficulties.json` neue Felder `coopHpTableBp`, `coopBossHpTableBp` (Schema, `compile.ts`, `load.ts`) | – (nur `economy.coop.hpTableBp`) | optionale Koop-HP-Tabelle **je Stufe**; Fallback `economy.coop` | P5-Übergabe: Hard/Nightmare im Koop zu leicht. Eintrag für 1 Spieler muss 10000 sein (Validierung, Test): 1P unverändert |
| 6 | `normal.coopHpTableBp` | 10000 / 15000 / 17500 / 20000 (Economy) | **10000 / 16000 / 18500 / 21000** | `aoe` Normal 85 / 80 / 90 (1P/2P/4P) |
| 7 | `hard.coopHpTableBp` | Economy (wie Normal) | **10000 / 21000 / 28000 / 31000** | `aoe` Hard 40 / 62,5 / 60; vorher mit der Normal-Tabelle 90–100 gegen 57 solo. Raster n = 40: 2P-Faktor 1,6 → `aoe` 92 %, 1,9 → 80, 2,0 → 70, 2,1 → 65, 2,2 → 37 |
| 8 | `nightmare.coopHpTableBp` | Economy | **10000 / 22000 / 29000 / 34000** | `aoe` Nightmare 7,5 / 17,5 / 17,5. Höhere Faktoren drücken `aoe` auf 0–5 %, `upgrade` bleibt 80–100 % (s. u.) |

HP-Spreizung nach den Änderungen: 15300 / 14800 / 14600 = 4,8 % (Test ≤ 8 %).

## Teil B — Ergebnis

Siegquote bester Bot solo, n = 100 (Profil `normal`; `casual`/`expert` zum Vergleich): Normal 60 / **85** / 94, Hard 41 / **57** / 67, Nightmare 19 / **24** / 31 (casual / normal / expert). Reihenfolge expert ≥ normal ≥ casual gilt in allen drei Stufen (Hard normal 57 gegen expert 67; Nightmare 24 gegen 31 liegt im Rauschen). Je Bot (normal): Normal greedy 24, farm 48, aoe 83, upgrade 85, wide 57; Hard greedy 4, farm 13, aoe 46, upgrade 2, wide 57; Nightmare 1 / 3 / 6 / 8 / 24.

| Ziel | Wert | Urteil |
|---|---|---|
| Stufen solo 85–95 / 45–65 / 15–35 | 85 / 57 / 24 | erreicht (Normal am unteren Rand) |
| Kennlinie 90 → 10 % ≥ 25 Punkte HP | Normal (`upgrade`) **25,7**, Nightmare (`wide`) **24,4**, Hard (`wide`) **14,5** | Normal erreicht, Nightmare knapp verfehlt, Hard verfehlt: die Kurve fällt zwischen f = 0,95 (93 %) und 1,0 (62 %) um 31 Punkte — die Boss-Stufe (Wave 20) setzt eine Treppe. Gemessen mit `hard.bountyBp` 10700, danach auf 10600 gesenkt |
| Keine dominante Kombi | kein Bot ≥ 95 % in allen Zellen: `upgrade` 4P 100 / 95 / 100, aber 1P 85 / 2,5 / 7,5 | erreicht |
| AoE-Bot ≥ 50 % Normal solo | 83 % (n = 100), casual 60, expert 94 | erreicht |
| Jede Unit von einem Bot ≥ 30 % gekauft | niedrigste: Banner 46 % (greedy, gemittelt), Farm 100 % (farm), übrige ≥ 98 % | erreicht |
| Schaden/Münze DPS-Units ≤ 1,6 | 1,4 (striker 6,1, gunner 5,4, blaster 6,8, lancer 5,7, frost 7,8, titan 6,3; 1P, alle Bots, drei Stufen, n = 30). 4P nicht gemessen | erreicht (1P) |
| Leave-one-out ≤ +5 | Normal: Striker 0, Blaster 0, Titan **+12,5**; Hard: Striker **+27,5**, Banner +5; Nightmare: Striker **+22,5** | **verfehlt** |
| Koop fair ±10 je Bot je Stufe | siehe Tabelle unten | **verfehlt**, außer `aoe` (Normal 10, Nightmare 10) |
| Stage-Dauer Normal 13–17 min | Siege 10,9–13,6, Median 11,7 (`aoe`) | **verfehlt**, unverändert seit Runde 3 |

### Koop (Profil `normal`, n = 40, Siegquote %: 1P / 2P / 4P, Spanne)

| Bot | Normal | Hard | Nightmare |
|---|---|---|---|
| greedy | 30 / 27,5 / 65 (37,5) | 10 / 0 / 0 (10) | 2,5 / 0 / 2,5 (2,5) |
| farm | 50 / 82,5 / 67,5 (32,5) | 17,5 / 50 / 7,5 (42,5) | 5 / 20 / 7,5 (15) |
| aoe | 85 / 80 / 90 (**10**) | 40 / 62,5 / 60 (22,5) | 7,5 / 17,5 / 17,5 (**10**) |
| upgrade | 85 / 100 / 100 (15) | 2,5 / 60 / 95 (92,5) | 7,5 / 92,5 / 100 (92,5) |
| wide | 62,5 / 20 / 42,5 (42,5) | 67,5 / 0 / 0 (67,5) | 20 / 2,5 / 0 (20) |
| coop | 50 / 60 / 82,5 (32,5) | 17,5 / 5 / 0 (17,5) | 5 / 2,5 / 0 (5) |

Warum nicht erreichbar: **kein einzelner HP-Faktor je Spielerzahl trifft alle Bots**, weil sich die Bots im Koop gegenläufig verhalten. `upgrade` skaliert mit der Spielerzahl überproportional (vier Geldbeutel auf dieselben wenigen Einheiten; bei 4P ×4,0 HP weiter 100 % auf Nightmare), `wide` bricht im Koop ein (Hard 67,5 → 0, kauft dort keinen Titan mehr: 4P Hard 0 %, Nightmare 3 %; Ursache — vermutlich Slot-/Typ-Konkurrenz bei 23 Kampf-Slots — nicht untersucht), `farm`/`coop`/`greedy` sind schon solo schwach. Ein Faktor, der `aoe` fair macht, lässt `upgrade` bei 95–100 % und `wide` bei 0 %. Der Hebel dafür ist nicht die HP-Tabelle, sondern die Koop-Wirtschaft (Upgrade-Kosten/Level-Cap im Koop, nicht gemessen) bzw. das Bot-Verhalten. Das ist keine Datenbiegung: die Tabellen sind auf `aoe` als Referenz gesetzt und das Ergebnis je Bot ist oben vollständig.

### Leave-one-out (Befund und Experiment)

- **Striker** ist für `wide` weiter eine Falle (Hard ohne Striker 95 gegen 67,5 %, Nightmare 42,5 gegen 20 %): er kauft ihn zu 100 % früh, hält fünf Stück und verbrennt die Münzen. Experiment `P6_EARLYCAP` (`botTuning.earlyCap`, höchstens N Striker je Bot): Cap 2 → LOO Striker +2,5, **aber** `wide` Hard steigt auf 92,5 % (Hard-Ziel 45–65 gerissen). Cap in den Daten nicht übernommen: danach müssten Hard und Nightmare neu kalibriert werden (Bounty/HP), und die Koop-Tabellen mit.
- **Titan Normal +12,5:** ohne Titan gewinnt `aoe` 97,5 gegen 85 %. Auf Normal (Boss-Kit Tier 0: Rufer + Schild, kein Sturm) kostet der Titan 1000 Münzen für wenig Nutzen; auf Hard (Titan −17,5) und Nightmare (−10) trägt er. Der Boss-Plan ist heute nicht bedarfsabhängig (Kapazität gegen Boss-HP ließ sich aus `env.values` nicht sinnvoll abschätzen, Verhältnis überall ~1,0–1,7).

## Verworfene Versuche

- Boss-Plan-Horizont 4–5 Waves: `farm`/`coop` sterben bei Wave 13 (Hortung, zu wenig Verteidigung), Normal `farm` 47,5 → 30–37,5 %. 2 Waves: `wide` 52 %. 3 gewählt.
- Titan-Upgrades vor dem Boss erzwingen (Stufe 1–3) oder Upgrade-Gewicht ×3/×8: keine Änderung der Boss-Tode, `farm` fällt dabei auf 30 %.
- Kaufverzögerung 2–8 s für casual: casual schlug expert (siehe oben).
- Zufälliger statt schlechterer Slot: nicht schlechter, siehe oben.

## Tests

Neu `test/botprofiles.test.ts` (12 Tests): Profil-Daten (schema-gültig, Fehler monoton), Determinismus je Profil/Seed (inkl. Koop), `@none` bit-identisch zu ohne Profil, Sim-Hash ohne Bots unberührt, Rauchtest Siegquote casual < normal ≲ expert (aoe + upgrade, Normal, 20 Seeds), Boss-Plan (greedy/wide/upgrade/farm/coop kaufen vor Wave 10 einen Titan; abschaltbar; ohne Wellenwissen kein früher Titan). `coop.test.ts` +2 Tests (Koop-Tabelle je Stufe, Validierung), `helpers.ts` `plainData()` neutralisiert die Stufen-Tabellen. 205 Tests grün, `tsc` sauber.

## Werkzeuge

`BOT_PROFILE=casual|normal|expert` (alle Sanity-Skripte), `P6_PROFILES='{"normal":{"worseSlotBp":0}}'` (Profil-Felder überschreiben), `P6_NOBOSSPLAN=1`, `P6_PLANWAVES=N`, `P6_NOSAVE=1`, `P6_NUKELVL`, `P6_UPBOOST`, `P6_EARLYCAP=N`. Koop-Tabelle je Stufe ohne Dateiänderung: `P3_RULES='{"hard":{"coopHpTableBp":[10000,21000,28000,31000]}}'` (mit `p5-coop.ts`).

## Übergabe

1. **Striker-Falle und Titan-Bedarf als Bot-/Plan-Thema schließen:** `earlyCap` 2 einführen **und** Hard/Nightmare danach neu einstellen (Bounty/HP-Raster, dann Koop-Tabellen); Boss-Plan bedarfsabhängig machen (z. B. nur ab Hard oder wenn die Wave-20-Kapazität fehlt).
2. **Koop-Fairness** braucht einen Hebel an der Wirtschaft (Upgrade-Kosten/Level-Cap je Spielerzahl) statt an der HP; `upgrade` 4P bleibt sonst bei 95–100 %.
3. **Stage-Dauer** (11,7 min): Waves enden früh, weil die nächste Wave beginnt, sobald das Feld leer ist; eine Mindest-Wave-Dauer wäre eine Regeländerung (Entscheidung der Menschen), keine Datenfrage.
4. **Kennlinie Hard** (14,5): die Treppe liegt am Wave-20-Boss; Streuung der Bot-Stärke reicht nicht, solange der Boss-Schild eine harte Schwelle setzt.

---

# Runde 4 — P6b: Balance-Reste (Leave-one-out, Boss-Plan, Hard/Nightmare, Koop)

Fortsetzung von P6 (Reihenfolge von Max: erst Balance-Reste, dann Client). Messung wie dort: Profil `normal`, `standard20`, solo, n = 100 (Siegquoten, Leave-one-out), n = 30–60 (Scans, Kennlinie je Punkt), n = 40 (Koop-Matrix); Standardfehler bei n = 100 ±4–5 Punkte, bei n = 30–40 ±8. **Ergebnis: Stufen solo und Leave-one-out erreicht, Koop und Kennlinie Hard nicht.** Die Stage-Dauer ist entschieden (11–13 min) und wurde nicht angefasst.

## Punkt 1 — Leave-one-out (Bot-Problem, kein Daten-Problem)

**Messartefakt zuerst:** Das Verbot einer Unit lief bisher über einen Proxy, der `place` ablehnt. Bots mit Plan (`aoe`: Titan ab Wave 5; Boss-Plan) sparen dann ewig auf eine Unit, die sie nie bekommen. Seit P6b gilt `botTuning.banned` (die Unit existiert für den Bot nicht, `canPlaceBase`); `q7-p1 --part loo` nutzt das, `LOO_PROXY=1` ist der alte Weg. Das „Titan Normal +12,5“ aus P6 war damit zu einem Teil Artefakt: mit sauberem Verbot ist der Titan **keine Falle**: ohne Titan fällt der beste Bot auf Normal um 86, auf Hard um 47, auf Nightmare um 25 Punkte (er ist umgekehrt auf jeder Stufe notwendig, siehe Punkt 2).

**Striker, Diagnose** (`scripts/sanity/p6b-diag.ts`, Team je Wave): `wide` kauft bis Wave 4 fünf Striker (1000 Münzen), seine Upgrade-Regel wartet auf „Breite voll“, also bleiben sie auf Stufe 0 und besetzen 4,5 Plätze bis Wave 19. Ohne Striker kauft er 3,6 Gunner (Luft-tauglich) für dieselben Münzen und ist ab Wave 8 deutlich weiter. `rotateEarly` (Striker verkaufen) greift nicht, weil sie nur bei fehlendem Legendary/Mythic-Typ verkauft. Der Striker hat auf Stufe 0 den besten DPS je Münze (11 / 200) und liegt bei Schaden/Münze (6,1) in der Mitte des Korridors; er ist Boden-only und wird ab den Flyer-Waves ein toter Typ-Platz. Das ist **Bot-Verhalten** (ein Mensch kauft zwei, pivotiert und verkauft den Rest), die Daten sind in Ordnung.

**Änderung (Bot, nicht `sim/data/`):** `botTuning.earlyCap` 99 → **2** (höchstens 2 Striker je Bot). Die verworfene Variante `rotateMinRarity: epic` (Striker auch für einen fehlenden Epic-Typ verkaufen, Experiment `P6B_ROTRAR=epic`) macht den Banner zur Falle (Hard +23, Nightmare +27), Standard bleibt `legendary`. Cap 3: Hard +1,7, Nightmare +16,7 (n = 60); Cap 1: Hard −10, Nightmare −30 (n = 40).

| LOO bester Bot, n = 100 | Normal (`wide` 87) | Hard (`wide` 56) | Nightmare (`wide` 27) |
|---|---|---|---|
| ohne Striker | −39 | −16 | −13 |
| ohne Banner | +5 | **+7** | −1 |
| ohne Titan | −86 | −47 | −25 |
| alle übrigen | ≤ −14 | ≤ −42 | ≤ −19 |

Vorher (P6, Proxy-Verbot): Striker Hard +27,5 / Nightmare +22,5, Titan Normal +12,5. Jetzt höchstens **+7** (Banner Hard, im Rauschen von ±5), Ziel ≤ +5 praktisch erreicht. Der Banner ist ein reines Support-Extra (kein Bot braucht ihn).

## Punkt 2 — Boss-Plan bedarfsabhängig: gebaut, gemessen, **ausgeschaltet** (Titan bleibt Pflicht)

Gebaut: `bossCapacityRatio(env, wave)` in `src/bots/util.ts` (Schaden, den das Team auf einen einzelnen Boss ausübt, solange er den Pfad entlangläuft: Σ DPS × Pfadabdeckung / Boss-Tempo, Rüstung 40, gegen Boss-HP samt Schild +20 %), Schwellen `botTuning.bossNeedMid` / `bossNeedFinal` (0 = Prüfung aus), `bossFinalHorizon`, `policyPlans` (aus: nur der Boss-Plan kauft den Titan). Messung `scripts/sanity/p6b-boss.ts` (alle Bots ohne Titan, 3 Stufen, n = 40, Verhältnis zu Beginn von Wave 7 / 17 gegen den Leak des Bosses):

- **Wave-10-Boss:** fällt auch ohne Titan (4 Leaks in 698 Läufen, Verhältnis 40–100 %). Titan ist dort nur Reserve.
- **Wave-20-Boss (Final-Boss):** Leak-Quote ohne Titan je Verhältnis bei Wave 17: 40–50 % → 58 %, 50–60 % → 24 %, 60–70 % → 14 %, 70–80 % → 16 %, 80–90 % → 3 %, ≥ 90 % → 0. Also trennt die Kennzahl grob (Schwelle ~0,75).
- **Trotzdem nicht einsetzbar:** Der Titan ist ein siebter Typ (Team-Limit 6) und kostet 1000 Münzen; wer ihn erst ab Wave 14–17 einplant, kann ihn nicht mehr kaufen. Gemessen (Plan nur mit Bedarf, Final-Horizont 6): `wide` Normal 62,5 → 27,5 %, `greedy` 30 → 20 %; nur `farm` (+15) und `upgrade` auf Hard/Nightmare (+20) gewinnen. Zum Zeitpunkt der Entscheidung (Wave 7) ist die Kapazität gegen den Wave-20-Boss nicht schätzbar (HP ×4, Team wächst).
- **Titan Normal ohne Pflicht:** nicht erreichbar. Mit sauberem Verbot gewinnt kein Bot ohne Titan auf Normal (`wide` 87 → 1 %; `upgrade` 85 → 49 % in einem Zwischenlauf mit anderem Rotationsstand): die Nuke ist die einzige Antwort auf Schild und Heilung des Colossus. Das ist Design der Boss-Kits (P4), keine Bot-Eigenheit; ändern würde es nur eine zweite Boss-Antwort (z. B. Frost-Stun plus mehr Fenster-Schaden) in den Daten, nicht im Plan.
- Standard in den Daten: `bossNeedMid = bossNeedFinal = 0` (Plan wie P6). Schalter für Experimente: `P6B_NEED=0.4,0.75`, `P6B_FINALH=6`, `P6B_NOPLAN=1`.

## Punkt 3 — Hard/Nightmare neu kalibriert

| # | Datei/Feld | alt | neu | Grund (Profil `normal`, solo) |
|---|---|---|---|---|
| 1 | `difficulties.json` `hard.bountyBp` | 10600 | **9500** | Nach Striker-Cap und den Bot-Fixes (unten) stieg `wide` auf Hard 57 → 90 %. Scan `wide` n = 80–100: 9300 → 42, 9400 → 47, 9500 → 60, 9700 → 71, 9800 → 81. Endwert n = 100: **56** |
| 2 | `difficulties.json` `nightmare.bountyBp` | 10600 | **9550** | `wide` 24 → 47 %. Scan n = 80–100: 9500 → 16, 9600 → 33, 9650 → 30, 9700 → 35. Endwert n = 100: **27** |
| 3 | `difficulties.json` `normal.hpBp` | 15300 | 15300 (bleibt) | Normal n = 100 unverändert im Ziel |

HP-Spreizung unverändert 4,8 % (Test ≤ 8 % grün). Der Hang ist flach und verrauscht (~+10 Punkte je 200 bp bei n = 80–100); Hard/Nightmare sind im Playtest über `bountyBp` nachzuziehen.

Zusätzliche **Bot-Fixes** (alle in `src/bots/util.ts`, keine Daten):
- `earlyCap` 2 (Punkt 1).
- **Kein Sparen ohne Platz:** `bossPlanStep`/`planStep` warten nicht mehr auf eine Plan-Unit, für die kein freier Slot passender Art existiert (4P-`wide` hortete bis zu 2500 Münzen). Zusätzlich `botTuning.makeRoom`: ist kein Slot frei, verkauft der Bot seine schwächste eigene Unit auf passendem Slot (keine Nuke-/Stun-Unit, keine Farm) und kauft dann den Titan. Ohne den Fix hatte `wide` 4P nie einen Titan (23 geteilte Slots, jeder füllt sie mit Billig-Units). Aus: `P6B_NOROOM=1`.

## Punkt 4 — Koop über die Wirtschaft: gemessen, nicht erreicht

**Neuer Hebel gebaut, gemessen, nicht übernommen:** `economy.coop.upgradeCostTableBp` (Upgrade-Kosten der Kampf-Units je Spielerzahl, Index 0 = 10000, Farm unberührt; Schema, `compile.ts`, `load.ts`, 3 Tests in `coop.test.ts`; in den Daten **nicht gesetzt**). Messung Normal, n = 30:

| Tabelle (2P / 3P / 4P) | `upgrade` 2P / 4P | `aoe` | `wide` | `greedy` |
|---|---|---|---|---|
| keine | 100 / 100 | 80 / 100 | 73 / 97 | 57 / 100 |
| 1,2 / 1,4 / 1,6 | 97 / 83 | 17 / 0 | 13 / 10 | 27 / 13 |
| 1,4 / 1,8 / 2,2 | 50 / 23 | 0 / 0 | 3 / 0 | 0 / 0 |

Der Hebel trifft den `upgrade`-Bot **nicht stärker** als die anderen (`aoe` fällt von 80 auf 17 %, `upgrade` nur von 100 auf 97 %): Upgrades sind für jeden Bot Pflichtausgaben, der Aufschlag verknappt die Münzen für alle. Damit ist „Upgrade-Kosten im Koop“ als einfachster Hebel **verworfen**. Nicht gemessen: getrennter Cap (Caps gelten schon je Spieler), Bounty-Aufteilung (Bounty folgt der Koop-HP und wird nach Schadensanteil geteilt; eine Entkopplung ist dasselbe wie eine kleinere HP-Tabelle), Leben je Spielerzahl (P2: Startleben ändert 4P nicht).

**Was die Messung zeigte:** Der Bot-Fix aus Punkt 3 (`wide` kauft im vollen Koop-Feld wieder einen Titan) hat die 2P/4P-Quoten aller Bots stark angehoben (Normal 4P `aoe` 100, `wide` 97, `greedy` 100 vor Neuabstimmung); die HP-Tabellen mussten daher neu gesetzt werden:

| Datei/Feld | alt (1P / 2P / 3P / 4P) | neu | Grund |
|---|---|---|---|
| `normal.coopHpTableBp` | 10000 / 16000 / 18500 / 21000 | **10000 / 16000 / 20000 / 24000** | `aoe` Normal 85 / 80 / 85; `wide` 90 / 82,5 / 87,5; `upgrade` 85 / 100 / 100 |
| `hard.coopHpTableBp` | 10000 / 21000 / 28000 / 31000 | **10000 / 16000 / 20000 / 23000** | Bezug `wide` (bester Hard-Bot): 1P 55, 2P 40, 4P 22,5. Höhere 4P-Faktoren (26–31 k) senken `wide` 4P weiter auf 7–10 %, ohne dass ein Faktor es hebt |
| `nightmare.coopHpTableBp` | 10000 / 22000 / 29000 / 34000 | **10000 / 16000 / 20000 / 23000** | `wide` 25 / 12,5 / 37,5 |

**Koop-Matrix** (Profil `normal`, n = 40, Siegquote 1P / 2P / 4P %, Spanne; 1P ist von der Koop-Tabelle unberührt):

| Bot | Normal | Hard | Nightmare |
|---|---|---|---|
| greedy | 30 / 67,5 / 87,5 (57,5) | 5 / 12,5 / 25 (20) | 0 / 0 / 47,5 (47,5) |
| farm | 60 / 97,5 / 95 (37,5) | 20 / 65 / 97,5 (77,5) | 5 / 27,5 / 92,5 (87,5) |
| aoe | 85 / 80 / 85 (**5**) | 15 / 42,5 / 95 (80) | 0 / 12,5 / 40 (40) |
| upgrade | 85 / 100 / 100 (15) | 0 / 52,5 / 97,5 (97,5) | 10 / 87,5 / 100 (90) |
| wide | 90 / 82,5 / 87,5 (**7,5**) | 55 / 40 / 22,5 (32,5) | 25 / 12,5 / 37,5 (**25**) |
| coop | 60 / 85 / 100 (40) | 20 / 67,5 / 87,5 (67,5) | 5 / 30 / 80 (75) |

**Ehrliche Begründung, warum ±10 je Bot nicht erreichbar ist:** Im Koop bekommt jeder Spieler eigene Caps, einen eigenen 6-Typen-Satz und eigene Münzen; die Gegner-HP wächst nur ×1,6 / ×2,0 / ×2,4. Bots, die solo schwach sind (`greedy`, `farm`, `coop`, `upgrade` auf Hard/Nightmare), werden im Team deutlich stärker, weil sie solo an Typ-Limit/Titan-Hortung scheitern und im Team vier Ressourcenbeutel haben; ein HP-Faktor, der diese Bots auf ihre Solo-Quote drückt, trifft `aoe`/`wide` mit einer Klippe (±0,1 am 2P-Faktor ≈ ∓40 Punkte, P5). `wide` auf Hard/Nightmare fällt im Koop unabhängig vom Faktor (23 → 10 %), Ursache vermutlich Slot-Konkurrenz der 4 Bots um 23 Slots (`makeRoom` hilft nur dem Titan). Fair sind jetzt auf Normal `aoe`, `wide` und fast `upgrade`; Hard/Nightmare im Koop bleiben offen. Ein Koop-Ziel „je Bot“ braucht entweder koop-fähige Bots (Absprache, Rollenverteilung) oder Playtest-Daten statt Bot-Daten.

## Punkt 5 — Kennlinie (Siegquote gegen globalen HP-Faktor f, n = 60, 26 Punkte f = 0,80…1,30 in 0,02 Schritten)

| Stufe (Bot) | 90 % bei f | 50 % bei f | 10 % bei f | Fenster 90 → 10 % | Ziel ≥ 25 |
|---|---|---|---|---|---|
| Normal (`upgrade`) | 0,920 | 1,091 | 1,187 | **26,7** | erreicht |
| Hard (`wide`) | 0,943 | 1,013 | 1,080 | **13,7** | verfehlt (P6: 14,5) |
| Nightmare (`wide`) | < 0,80 (80 % bei f = 0,80) | 0,932 | 1,037 | **> 24** (lineare Fortsetzung ≈ 28, 90 % nicht gemessen) | knapp, nicht bestimmbar |

Hard bleibt steil: zwischen f = 0,96 (80 %) und 1,10 (1,7 %) fällt die Kurve in einem Zug; ursächlich der Final-Boss (Schild + Heilung + Sturm ab Hard), der als Schwelle wirkt, sobald das Team seine Nuke-Kapazität verfehlt. Das ist eine Boss-Kit-Frage (weichere Schwelle: kleinerer Schild, Heilung unterbrechbar mit mehr Fenster), keine Frage der Stufen-Zahlen.

## Ergebnis solo (Profil `normal`, n = 100)

Normal / Hard / Nightmare bester Bot: **87** (`wide`; `upgrade` 85, `aoe` 83) / **56** (`wide`) / **27** (`wide`) — alle drei im Zielkorridor (85–95 / 45–65 / 15–35). Je Bot (greedy / farm / aoe / upgrade / wide / coop): Normal 27 / 66 / 83 / 85 / 87 / 66; Hard 4 / 17 / 12 / 0 / 56 / 17; Nightmare 0 / 4 / 0 / 8 / 27 / 4. (`aoe` ist auf Hard/Nightmare schwach (12 / 0), Ursache nicht untersucht; auf Normal 83 % = AoE-Ziel ≥ 50 % erreicht.)

## Verworfene Versuche

- `rotateMinRarity: epic`: Banner wird zur Falle (s. o.).
- Bedarfsprüfung für den Titan als Standard (s. Punkt 2).
- Koop-Upgrade-Kosten-Tabelle (s. Punkt 4).
- Kleiner Striker-Cap 1: macht `wide` auf Hard 97,5 % (Hard-Ziel gerissen), LOO negativ.

## Tests

205 → 208 Tests grün (`coop.test.ts` +3: Upgrade-Kosten-Tabelle, Validierung, nicht gesetzt), `tsc` sauber. Bestehende Tests brauchten keine Änderung.

## Werkzeuge

`scripts/sanity/p6b-diag.ts` (Team je Wave, `--ban`, `--players`), `p6b-boss.ts` (Boss-Bedarf, `--csv`, `--early`), `q7-p1 --part loo` mit `botTuning.banned`. Env: `P6B_ROTRAR`, `P6B_ROTWAVE`, `P6B_NEED`, `P6B_FINALH`, `P6B_NOPLAN`, `P6B_NOROOM`, `P6_EARLYCAP`; Koop ohne Dateiänderung `P5_COOP='{"upgradeCostTableBp":[10000,12000,14000,16000]}'` bzw. `P3_RULES='{"hard":{"coopHpTableBp":[...]}}'`.

## Übergabe

1. **Final-Boss-Schwelle** (Hard-Kennlinie 13,7): Boss-Kit Wave 20 weicher machen (Schild/Heilung), dann Kennlinie neu messen; danach `hard.bountyBp` nachziehen.
2. **Koop fair** braucht koop-fähige Bots oder Playtest-Daten; `wide` Hard/Nightmare 4P (Slot-Konkurrenz) untersuchen.
3. **Titan-Pflicht** ist Boss-Design: zweite Antwort auf den Colossus-Schild (Daten) wäre der Weg, nicht der Plan.
4. Danach P10 (Client) bzw. Playtest.

---

# Runde 5 — P3: Boss ohne Pflicht-Unit, Hard breiter

Messung: Profil `normal`, `standard20`, solo, bester Bot `wide`, Seeds 1..n (Standardfehler bei n = 100 ±4–5 Punkte, bei n = 60 ±6). Werkzeug `sim/scripts/sanity/r5-p3.ts` (`--part rates|loo|diag`), `r5-p3.sh`, Kennlinie `p3-check.ts --part curve`. Telegraph-Liste für den Client: `docs/design/boss-telegraphs.md`.

## Was gebaut wurde

| Baustein | Inhalt |
|---|---|
| Zerstörbare Wirkung (`staggerBp`) | Dauerschaden während des Telegraphs bricht Heilung, Ruf und Sturm wie ein Stun (`bossCast.cause: "damage"`); die Heilung schrumpft linear mit dem Schaden. Drei Antworten je Wirkung: Stun (Frost), Burst (ein Treffer ab Schwelle, Titan-Nuke), Dauerschaden (alle DPS-Units) |
| Fenster mit Rüstung | `window.armor` (Colossus/Warden: 0) und Phasen-Aktion `armor` (Baustein fertig, in den Daten nicht benutzt: auf Hard als Panzer-Phase gemessen, ohne Gewinn, 33 gegen 33 %) |
| Unterbrechen belohnt | Fenster 7–8 s x2,0 mit Rüstung 0, Boss steht 1,5–2 s (`interruptStunTicks`) |
| Colossus | Heilung ab Phase 0 im Takt (15 s, Warnung 4 s, 6 %), Schild-Fenster 7 s x2,0, Last Stand wie vorher |
| Bots | `bossFocus`: gegen einen Boss mit Kit zielen alle Angreifer auf den Stärksten (Schwelle zählt nur Boss-Schaden); Nuke bricht zerstörbare Wirkungen, wenn kein Stun bereit ist; `botTuning.bossAnswers` (`both` Standard, `oneOf` Experiment); `banned` entfernt die Unit auch aus `makeEnv().defs` (Messartefakt: ein verbotener Titan zählte als „fehlender Typ“ und löste die Striker-Rotation aus) |

## Änderungen an `sim/data/` (alt → neu → Grund)

| Datei/Feld | alt | neu | Grund |
|---|---|---|---|
| `bosses.json` | Kits R4 | siehe oben, beide Kits | zwei+ Antworten, lange Fenster |
| `units.json` Titan Nuke `damageMulBp` | 120000 | **65000** | Nuke war die einzige Antwort; jetzt Burst-Antwort neben Frost und Dauerschaden. 3x/4,5x/6,5x/8x ändern LOO kaum, Titan-Anteil (DPS) zählt mehr |
| `enemies.json` Boss `fHpBp` | 110000 | **140000** | mit Fokusfeuer und Fenstern leakt der Boss beim besten Bot nie (0/100); x14 macht ihn wieder zur Prüfung. 160000: Titan-LOO −27, 170000: −45 |
| `difficulties.json` normal `hpBp` | 15300 | **15700** | Spreizung 7,5 % (Test < 8 %) |
| normal `bountyBp` | 10000 | **9000** | ohne Boss-Leaks lag der beste Bot bei 98–100 %. Scan n = 100: 9300 → 97, 9100 → 94, 8900 → 89 |
| hard `bountyBp` | 9500 | **9200** | `wide` 58 % (n = 100) |
| nightmare | 9550 | 9550 | 31 % |
Titan `dpsShareBp` 5000 bleibt (3500/4500 machen ihn auf Hard zur Falle: ohne Titan +18/+24).

## Ergebnis

| Ziel | Wert | Urteil |
|---|---|---|
| Stufen (bester Bot `wide`, n = 100) | Normal **92**, Hard **58**, Nightmare **31** | erreicht (alle Bots: Normal greedy 9, farm 59, aoe 37, upgrade 68, coop 59; Hard farm 25, aoe 8; NM upgrade 6) |
| Hard-Kennlinie 90→10 % (n = 60) | **18,6** (Lauf mit Hard-Bounty 9200 vorher: 21,1; vorher 13,7) | knapp unter 20, Streuung ±2; Normal 15,5, Nightmare 26,6 |
| Titan nicht Pflicht | Normal **−24** (vorher −87), Hard +12, Nightmare +3 | erreicht |
| Boss-Leaks bester Bot | 0 von 100 je Stufe (Normal: ohne Titan 27 von 100) | Boss ist für den besten Bot kein Hindernis mehr; andere Bots (aoe, greedy) bleiben knapp |

## Leave-one-out, alle 8 Units (`wide`, n = 100; Delta in Punkten)

| Unit | Normal (92) | Hard (58) | Nightmare (31) |
|---|---|---|---|
| Striker | −1 | −20 | −6 |
| Gunner | −44 | −57 | −19 |
| Blaster | −42 | −46 | −14 |
| Banner | 0 | 0 | +3 |
| Lancer | −53 | −37 | −29 |
| Frost | −92 | −58 | −31 |
| Titan | **−24** | **+12** | **+3** |
| Farm | 0 | 0 | 0 |

Vorher (R4-Stand, n = 60, mit Messfehler-Fix): Normal Striker −33, Gunner −32, Blaster −13, Lancer −47, Frost −88, Titan −87; Hard Gunner −62, Blaster −50, Lancer −58, Frost −62, Titan −62.

**Ziel „keine Unit um mehr als 25“: nur für den Titan, Striker, Banner und Farm erreicht, für Gunner, Blaster, Lancer, Frost verfehlt.** Ehrliche Begründung:
- Die vier Rollen-Units sind keine Boss-Frage. Ohne Frost verlieren die Läufe an den Flyer-Pulks (Wave 16/18, rund 6 Flyer-Leaks je Lauf), nicht am Boss; Frosts Slow und Stun sind dabei ohne Wirkung (ohne beide 100 %), es zählt der Kegel als Mehrfachtreffer gegen Luft. Mehrfach-Luftabwehr gibt es nur mit Frost und Lancer (Flyer-Regel, ENTSCHEIDUNGEN.md), Blaster trifft keine Luft.
- Je näher der beste Bot am Zielwert 92 %, desto steiler die Kurve (Normal 90→10 in 15 Punkten HP): ein Sechstel weniger Feuerkraft kostet dann 40+ Punkte. Bei Normal-Bounty 10000 (Bot 98 %) lagen Gunner −7, Blaster +2, Lancer −22; erst die Rückkehr in den Zielkorridor macht sie „Pflicht“.
- Geprüft, nicht übernommen: Flyer-HP 9000→7000/5500 (ohne Frost 53/63 %), Gunner-Anteil 11500→15000/19000 (ohne Frost 87/100 %, aber Hard ohne Frost weiter 0–8 %), Blaster hybrid (trifft Luft: ohne Frost weiter 3 %). Die Luftabwehr-Rolle braucht eine Entscheidung (zweite Mehrfach-Luftquelle oder weniger Pulk-Druck), die nicht in P3 liegt.

## Verworfene Versuche

Boss-HP allein anheben (Titan-Team bleibt 100 %, ohne Titan fällt es bis −45); Boss-Plan `oneOf` (der Bot kauft dann nie Titan, Normal 72 %); Panzer-Phase (Armor 70) auf Hard; Lebens-Regeln auf Normal (ohne Wirkung, Verluste sind Boss-Leaks); Titan-Anteil senken.

## Übergabe

1. Luftabwehr-Rolle (Frost/Lancer) für „keine Pflicht-Unit“ klären; Fragen an Max in STATUS.
2. aoe-Bot fällt auf Normal von 82 auf 37 % (hängt am Titan-Anteil); Bot-Pflege.
3. Hard-Kennlinie 18,6: mehr Fenster-Streuung oder Hard-Zusatzregeln.

# Runde 5 — P3b: zweite Luft-AoE-Quelle

Auftrag (Max, 06.10.2026): die Flieger-Pulks in W16/W18 bekommen eine zweite Flächen-Antwort gegen Luft, statt den Pulk-Druck zu senken. Messung wie P3 (`r5-p3.sh loo|rates`, Profil `normal`, bester Bot `wide`, n = 100, Standardfehler ±4–5 Punkte).

## Befunde auf dem Weg

1. **Blaster mit Luft allein genügt nicht.** Mit `airDamageBp` 6000 stieg `wide` auf 99/96/73 %; neu auf 94/58/31 eingestellt blieb Frost-Verbot bei −94 (Normal). Auch bei 100 % Luftschaden: ohne Frost 10 %.
2. **Frosts Slow ist der Pfeiler, nicht der Kegel.** Slow auf 1 % gesetzt: `wide` Normal 92 → 57, Hard 63 → 12. Stun weg: 92 → 87, 63 → 40. Die P3-Aussage „Slow und Stun ohne Wirkung" war falsch gelesen. Slow wirkt als Multiplikator auf alle anderen Units, und nur Frost hatte ihn.
3. **Messartefakt in `wide`:** bei verbotener Unit blieb ein Slot frei (Typenlimit 6, nur 6 Angriffs-Typen), und `wide` kaufte 3–4 Banner als Füllmaterial, upgradete nie und blieb mit 428 Münzen übrig. Banner-Ban allein: 40/40 Siege. Fix im Bot (kein Support ohne Schaden als Füllmaterial). Das hebt jede LOO-Zeile, wirkt aber nicht auf die Siegquote ohne Verbot (Banner 0,4 Stk im Mittel).
4. **Banner stärker machen** (+25…85 % Aura) verschlechterte `wide` (63 statt 94): Falle, nicht Ausgleich. Verworfen.
5. **Hard-LOO ist Element-Mechanik.** Mit `elementsActive: false` auf Hard (nur Diagnose, nicht übernommen): Gunner +2, Blaster −20, Frost −22, Striker −10, Basis 93 %. Auf Hard fehlt einem Team ohne Element-Unit die starke Trefferfläche.

## Änderungen (alt → neu → Grund)

| Datei/Feld | alt | neu | Grund |
|---|---|---|---|
| Sim: `airDamageBp` (schema/compile/attack) | gab es nicht | optionales Unit-Feld; Boden-Unit mit Feld trifft Luft mit diesem Anteil | zweite Flächen-Luftquelle, Gunner/Titan/Lancer/Frost unverändert |
| `units.json` Blaster `airDamageBp` | – | **7500** | 6000 → Frost −33 (Normal); 9000 → Blaster −27/−30 (Normal/NM); 7500 liegt dazwischen |
| `units.json` Blaster `onHit` | Burn | Burn + **Slow 10 % / 60 Ticks** | zweite Slow-Quelle (Befund 2); Frost allein trug den Multiplikator |
| `units.json` Frost Slow `pctBp` | 2000 | **1200** | Frost entlasten, ohne Frost-Rolle (Stun, Kegel) anzufassen |
| `difficulties.json` `bountyBp` normal / hard / nightmare | 9000 / 9200 / 9550 | **8400 / 8150 / 8450** | neu eingestellt: `wide` 92 / 55 / 30 (n = 100) |
| `bots/wide.ts` | Banner als Füller | `canPlace: !aura`, Caps-Prüfung nur über Angreifer | Befund 3 |
| `test/combat.test.ts` | – | Test Blaster trifft Flieger | Regression |

HP-Faktoren unverändert (Spreizung 7,5 %, Test < 8 %).

## Ergebnis

| Ziel | Wert | Urteil |
|---|---|---|
| Stufen `wide` (n = 100) | Normal **92**, Hard **55**, Nightmare **30** | erreicht |
| Andere Bots | Normal farm/coop 98, aoe **81**, greedy 47, upgrade 28; Hard farm/coop 67, aoe 14; NM farm/coop 36 | **farm/coop liegen über dem Korridor** (Normal 98, Hard 67, NM 36): die Blaster-Luft nützt dem Farm-Pfad stärker. Ein Herunterstellen auf farm würde `wide` unter den Korridor drücken (Test: 8300/8100/8420 → `wide` 89/52/30, farm 99/69/40, die Quote von farm bewegt sich kaum) |
| `aoe`-Bot Normal ≥ 50 % | **81 %** (vorher 37) | erreicht |
| Hard-Kennlinie 90→10 % (n = 60) | **13,1** Punkte HP (vorher 18,6) | **verfehlt, schlechter**: stärkeres Team = steilere Kante |
| HP-Spreizung | 7,5 % | erreicht |

## Leave-one-out, alle 8 Units (`wide`, n = 100; Delta in Punkten)

| Unit | Normal (92) | Hard (55) | Nightmare (30) |
|---|---|---|---|
| Striker | +3 | −17 | −8 |
| Gunner | +7 | **−51** | +11 |
| Blaster | −11 | **−53** | −25 |
| Banner | 0 | 0 | 0 |
| Lancer | +1 | +10 | +7 |
| Frost | −18 | **−45** | **−26** |
| Titan | +3 | +27 | +34 |
| Farm | 0 | 0 | 0 |

Vorher (P3): Gunner −44/−57/−19, Blaster −42/−46/−14, Lancer −53/−37/−29, Frost −92/−58/−31.

**Normal: erreicht (schlechtester Wert −18). Nightmare: Frost −26 knapp daneben (Blaster −25 am Rand). Hard verfehlt (Gunner −51, Blaster −53, Frost −45).** Begründung Hard: die Elemente (stark 1,5 / schwach 0,5) machen jede Element-Unit zur Abdeckung; ohne Elemente liegt Hard bei −22 und besser. Das ist eine Eigenschaft der Stufe, kein Luftproblem; Lösungen sind eine Entscheidung (Element-Stärke auf Hard senken, z. B. 1,5/0,5 → 1,3/0,7, oder Elemente erst ab Wave X) und gehören nicht in P3b. Titan ist auf Hard/NM ein Minus-Kauf (Verbot +27/+34): Bot kauft ihn zu früh oder zu teuer, kein Pflicht-Problem.

## Verworfene Versuche

Blaster-Luft allein (Frost bleibt −94); Luft 6000 und 9000 (siehe Tabelle oben); Banner-Aura ×1,7 (Falle); Gunner mit Durchschlag gegen Luft nicht gemessen: Gunner ist auf Normal/NM kein Problem mehr (+7/+11).

## Übergabe

1. `sim/test/replay.test.ts` ist rot, bis die Hauptsitzung das Beispiel-Replay neu aufnimmt (Daten haben sich geändert).
2. Hard-LOO: Entscheidung über die Element-Stärke auf Hard (Max).
3. Farm/coop liegen über dem Korridor; Hard-Kennlinie 13,1.

# Runde 5 — P3c: Element-Bonus abschwächen

Auftrag (Max, 06.10.2026): Auf Hard machten die Elemente Gunner/Blaster/Frost zur Pflicht (LOO −45 bis −53, ohne Elemente höchstens −22). Der Stärke-/Schwäche-Faktor wird kleiner, Elemente bleiben auf Hard/Nightmare Regel, aber kein Muss für bestimmte Units. Messung wie P3 (`r5-p3.sh loo|rates`, Profil `normal`, bester Bot `wide`, n = 100, Standardfehler ±4–5 Punkte; Kennlinie `p3-check.ts --part curve`, n = 60).

## Änderungen (alt → neu → Grund)

| Datei/Feld | alt | neu | Grund |
|---|---|---|---|
| `economy.json` `damage.elementStrongBp` / `elementWeakBp` | 15000 / 5000 (±50 %) | **12000 / 8000 (±20 %)** | siehe Scan unten; Richtwert war ±25 % |
| `difficulties.json` hard `bountyBp` | 8150 | **7800** | schwächere Elemente = leichter (Hard `wide` 79 %), nachgestellt auf 49 % |
| `difficulties.json` nightmare `bountyBp` | 8450 | **8100** | NM 44 % → 31 % |
| normal | 8400 | 8400 | Elemente auf Normal aus, unverändert 92 % |
| `test/damage.test.ts`, `test/combat.test.ts` | x1,5 / x0,5 | x1,2 / x0,8 | Erwartungswerte an die Daten angepasst |

Element-Verteilung je Stufe (`wave` auf Hard, `mixed` auf Nightmare) und HP-Faktoren unverändert (Spreizung 7,5 %).

## Scan Element-Faktor (`wide`, LOO-Schlechtester je Stufe, n = 100)

| Faktor | Bounty H/NM | Hard Basis | Hard schlechtester LOO | NM Basis | NM schlechtester LOO |
|---|---|---|---|---|---|
| 1,5 / 0,5 (P3b) | 8150 / 8450 | 55 | Blaster −53 | 30 | Frost −26 |
| 1,25 / 0,75 (±25 %) | 7900 / 8200 | 55 | Blaster −27, Frost −24 | 33 | Frost −30 |
| **1,2 / 0,8 (±20 %)** | **7800 / 8100** | **49** | **Frost −22, Blaster −19** | **31** | **Frost −26** |

±25 % ließ Blaster auf Hard knapp über der Grenze. ±20 % ist die gewählte Stufe; weiter herunter (±15 %) nicht gemessen, weil Elemente dann kaum noch spürbar sind (Auftrag: „bleiben Regel“). Die Bounty-Schritte (Hard 7300–7900, NM 7700–8250) sind sehr steil (Hard 20 → 55 %).

## Ergebnis

| Ziel | Wert | Urteil |
|---|---|---|
| Stufen `wide` (n = 100) | Normal **92**, Hard **49**, Nightmare **31** | erreicht (Hard 45–65 am unteren Rand) |
| Andere Bots | Normal greedy 47, farm 98, aoe 81, upgrade 28, coop 98; Hard 30 / **86** / 32 / 2 / coop **86**; NM 5 / **48** / 5 / 2 / coop **48** | farm/coop weiter über dem Korridor |
| HP-Spreizung | 7,5 % | erreicht (Test grün) |
| Hard-Kennlinie 90→10 % (n = 60) | **13,0** Punkte HP | **verfehlt (Ziel ≥ 20), unverändert zu P3b (13,1)**; Normal 9,4, Nightmare 21,7 |
| LOO ≤ 25 auf allen Stufen | Normal erreicht (−18), Hard erreicht (−22), **Nightmare Frost −26 knapp daneben** (Messfehler ±5) | fast |

Die Elemente waren nicht die Ursache der steilen Kennlinie: sie fällt bei gleichem `wide` weiter bei 13. Die Kante kommt vom Team, nicht von der Stufenregel.

## Leave-one-out, alle 8 Units (`wide`, n = 100; Delta in Punkten)

| Unit | Normal (92) | Hard (49) | Nightmare (31) |
|---|---|---|---|
| Striker | +3 | +10 | −11 |
| Gunner | +7 | +8 | −1 |
| Blaster | −11 | −19 | −20 |
| Banner | 0 | 0 | 0 |
| Lancer | +1 | +19 | +3 |
| Frost | −18 | −22 | **−26** |
| Titan | +3 | +38 | +29 |
| Farm | 0 | 0 | 0 |

Vorher (P3b): Hard Gunner −51, Blaster −53, Frost −45; NM Blaster −25, Frost −26. Gunner ist nicht mehr Pflicht (±0), Blaster und Frost bleiben die größten Posten (Frost-Slow ist der Multiplikator, vgl. P3b Befund 2; Blaster trägt zweiten Slow und Luft).

## farm/coop über dem Korridor: ist der „beste Bot“ zu stark?

`farm` und `coop` schlagen `wide` auf allen Stufen (98/86/48 gegen 92/49/31). Sie sind damit der eigentlich beste Bot. LOO `farm` (n = 60): Normal Blaster **−78**, sonst ≤ +3; Hard Blaster −73, Frost −23, Gunner −10; NM Blaster −47, Frost −22. Das ist vermutlich weniger Spielbalance als Bot-Pfad: `farm` plant um den Blaster herum, ein Verbot lässt ihn ohne Ersatzplan stehen (Messartefakt wie in P3b Befund 3, nicht untersucht). Als Referenz gilt weiter `wide`; `farm`-Quoten würden bei Angleichung `wide` unter den Korridor drücken (P3b-Test: farm bewegt sich kaum). Die Frage „welcher Bot ist die Messlatte“ gehört zu Max; so lange `farm` mit einer einzigen Einkaufsliste 98/86/48 schafft, ist die Stufe für wenig geschickte Spieler eher leicht, für `wide`-artig breit bauende genau richtig.

## Offen / Übergabe

1. NM Frost −26: Frost-Slow oder Blaster-Slow anfassen (P3b-Hebel) oder Toleranz ±5 akzeptieren.
2. Hard-Kennlinie 13: Hebel liegt im Team/Bot (Kante), nicht in Elementen oder Bounty.
3. `farm`-Bot: LOO-Artefakt prüfen, Messlatte klären.
4. `replay.test.ts` war nach der Änderung grün (Beispiel-Replay offenbar von Hard-Elementen unabhängig); die Hauptsitzung soll trotzdem prüfen, ob das Replay neu aufgenommen werden muss.

## Runde 6 — P1 (freie Platzierung, kein Typ-Limit): Sicherheitsnetz

Kein Balance-Paket: `sim/data/` hat sich nur in der Mechanik geändert (kein Zahlenwert der Balance), gemessen wurde nur, ob die Bots nach dem Umbau grob dort liegen wie vorher (ENTSCHEIDUNGEN.md: „Balance-Tiefe bis nach M3: nur grob“). Feintuning macht P2.

**Datenänderungen (alt → neu → Grund):** `units.json` Rarity-`cap` 5/4/3/2 und Farm-`cap` 2 → entfernt → Entscheidung Platzierung („kein Limit je Unit-Typ“). `economy.json` neu `placement` (Radius 1x1 = 400, 2x2 = 900 Milli-Tiles, Pfadrand 0) → Kollisionsmodell. `standard20.json` neu `pathWidth` 1 und `zones` (Kachelmaske, aus den alten Slots abgeleitet); `slots` bleiben als Altbestand. Preis, Kosten, Schaden, Wellen: unverändert.

**Messung:** `sim/scripts/sanity/r6-p1.ts`, alle Registry-Bots solo auf `standard20`, n = 100 (Seeds 1–100), fehlerfreie Bots (kein Profil). „Vorher“ = Stand `dev` vor P1 (feste Slots, Typ-Limit als Regel), „nachher“ = freie Platzierung, Bots mit eigenem Stückzahl-Limit (`botTuning.typeLimit`, gleiche Zahlen wie das frühere Regel-Limit).

| Bot | Normal vorher → nachher | Hard vorher → nachher | Nightmare vorher → nachher |
|---|---|---|---|
| greedy | 68 → 100 | 53 → 63 | 12 → 21 |
| farm | 100 → 100 | 87 → 88 | 52 → 44 |
| aoe | 99 → 99 | 51 → 70 | 8 → 26 |
| upgrade | 56 → 14 | 2 → 1 | 1 → 1 |
| wide | 97 → 99 | 75 → 55 | 37 → 24 |
| coop (solo = farm) | 100 → 100 | 87 → 88 | 52 → 44 |

**Lesart:** Die Stufen liegen für `farm`/`wide`/`aoe` im Rahmen der Messstreuung (n = 100: ±5 bis ±10 Punkte) wie vorher, nur `upgrade` (wenige, voll ausgebaute Units) fällt deutlich (Normal 56 → 14), `wide` auf Hard 75 → 55 und `aoe` steigt auf Hard/Nightmare. Beste echte Strategie (`farm`): Normal 100, Hard 88, Nightmare 44 — wie P3c (98/86/48). **Kein Fehler im Regelwerk gefunden, nur Verschiebungen innerhalb der Bots.** Die Korridore (Normal ≥ 80, Hard 35–70, Nightmare 10–40) bleiben für P2.

**Was beim Umbau der Bots gelernt wurde (für P2):**
1. **Mehrere Banner auf denselben Pulk waren der größte Fehler.** Je Buff-ID zählt nur der höchste Wert; mit festen Slots lagen die Banner zufällig verteilt, mit freier Wahl stapelt der Wert-je-Münze-Bot alle vier auf die beste Stelle. `greedy` Normal fiel dadurch von ~65 auf ~8 %. Behoben in der Bot-Bewertung (Zuwachs über die beste andere Aura statt Summe), keine Sim-Regel.
2. **Rohe Pfadabdeckung allein ist eine schlechte Bewertung.** Ohne Gewicht stapeln die Bots alles auf die Innenkurven in der Mitte der S-Kurve (Reihen 5/6), die erste Pfadhälfte bleibt leer und Läufer-/Flieger-Wellen (W6, W13, W16, W18) leaken. Ein Gewicht, das das Pfadende mehr zählt (`endBias` 0,5), brachte `aoe`/`farm`/`wide` auf Normal/Hard wieder auf die alten Werte. Ein Verteil-Abstand (1,5–2,6 Kacheln) oder ein „Neuheits“-Abschlag für doppelt gedeckte Pfadstellen machten die Bots deutlich schwächer (greedy Normal 100 → 0–48, farm Hard 85 → 30–60), **Stapeln auf den besten Punkten gewinnt in diesem Modell.** Das ist ein Balance-Befund: Platzierung entscheidet auf der Karte wenig über „Breite“, viel über die Innenkurven.
3. **Ohne Bot-Limit (`R6_NOLIMIT=1`, n = 40)** erreicht **kein Bot die technische Grenze `teamUnits` = 60**: größter Spitzenwert `wide` mit 38 Units (Normal), 35 (Hard), 37 (Nightmare); `greedy`/`aoe`/`farm` 21–24. Frage an die Menschen (STATUS): Grenze 60 so lassen? Sie bindet nach dieser Messung nichts.
4. **Spam ohne Limit lohnt nicht von selbst:** `wide` ohne Limit fällt auf Normal von 99 auf 30 %, Hard 55 → 5, Nightmare 24 → 10 (viele Billig-Units statt Ausbau). `aoe` Normal 99 → 78. `farm`/`greedy` Normal bleiben 100, auf Hard sinkt `farm` 88 → 50, `greedy` steigt 63 → 75. Grundlage für die `mono-X`-Messung in P2.
5. Wirkung auf die Karte: Boden- und Hügelreihen neben dem Pfad sind nur ca. 0,6 Tiles breit nutzbar, die Farm (Radius 900) passt auf der Standard-Karte nur in die breiten Bodenflächen rechts (x ≥ 14,4) und links außen. Die Karte (17 x 11 Kacheln) ist eng für freie Platzierung.

**Performance (Bot-Matrix, gleiche Rechner, nacheinander gemessen):** Hard, alle sechs Bots, n = 60 (360 Matches, inkl. Start): **32,5 s → 38,6 s (×1,19)**, Ziel höchstens ×2. `scripts/bench.ts` (ohne Bot): 258 000 → 230 000 Ticks/s. Gründe, warum es schnell bleibt: Abdeckung wird je (x, y, Reichweite) gecacht und von allen Sims mit gleichem Pfad geteilt, die Stichpunkte des Pfads liegen einmal im `Path`, die Bots durchsuchen nur das Halbkachel-Raster (statisch gültige Punkte mit Pfadabdeckung, je Typ einmal sortiert) und nehmen je Typ vier Stellen als Optionen.

**Abnahme P1:** `cd sim && npm test && npm run typecheck` grün (259 Tests, davon 21 neu in `test/placement.test.ts`: Pfad, Rand, Blockiert, Zone, Überlappung, Farm-Radius, 15 gleiche Units ohne `cap-reached`, Teamgrenzen, Determinismus, Bots).

## Runde 6 — P2 (Balance grob auf dem Modell mit freier Platzierung)

Auftrag: nur Sicherheitsnetz gegen grobe Fehler (ENTSCHEIDUNGEN.md: „Balance-Tiefe bis nach M3: nur grob“, „Messlatte = beste echte Strategie“). Messung mit `sim/scripts/sanity/r6-p2.ts` (fehlerfreie Bots, solo, `standard20`, n = 100 für die Endtabelle, n = 40–60 für Suchläufe; Messfehler ±5 bis ±10 Punkte). Suchläufe ohne Dateiänderung per `P2_ECON`, `P2_UNITS`, `P2_BAN`.

**Datenänderungen (alt → neu → Grund):**

| Datei, Feld | alt | neu | Grund |
|---|---|---|---|
| `units.json` Farm `farm.yieldByLevel` | 65 / 117 / 176 / 267 / 403 | **42 / 75 / 110 / 165 / 240** (×0,65) | `farm` lag auf Hard 90 gegen `wide` 55 (Abstand 33); Ziel ≤ 15–20 |
| `economy.json` `placeCostGrowthBp` | (neu) | **1000** | Spam ohne Limit: `mono-frost` schlug Normal 100 %, Hard 97 %, Nightmare 53 % |
| `economy.json` `placeCostFreeCopies` | (neu) | **5** | die ersten 5 Exemplare je Typ und Spieler kosten den Basispreis, danach +10 % des Basispreises je weiterer Unit |
| `units.json` Unit-Feld `placeGrowthBp` | (neu, optional) | nicht gesetzt | überstimmt den Zuwachs je Unit (Hebel für später, z. B. Farm) |

**Sim-Änderung:** `placeCostFor` (`commands.ts`) = `Basis × (10000 + Zuwachs × max(0, eigene Exemplare + 1 − frei)) / 10000`, abgerundet, gezählt über die **stehenden** eigenen Units gleichen Typs (Verkauf senkt den Preis wieder, Koop je Spieler). `place` bucht genau diesen Betrag ab (`unit.invested` = gezahlter Preis, Verkauf zahlt 60 % davon). Abfrage: `sim.placeCost(player, unitId)` (README). Test `test/placecost.test.ts`. Bots lesen den Preis über die API (`buildOptions`, `farmStep`).

### Farm (Hebel-Reihenfolge laut Auftrag)

1. **Ertragskurve hoher Stufen allein wirkt nicht, eher umgekehrt.** `[65,117,165,230,310]` und `[65,110,150,195,250]` hoben `farm` auf Hard von 90 auf 93–95 und auf Nightmare von 48 auf 62–65: Der Bot kauft die Farm-Upgrades nur, wenn der Payback in die Restwaves passt, und steckt das Geld bei schwächerer Spitze lieber in Kampf-Units. Die Stärke der Farm liegt im **frühen** Ertrag (Stufe 0/1), nicht in der Spitze.
2. **Ganze Kurve ×0,7 / ×0,65** (`45/80/120/180/270`, `42/75/110/165/240`): Hard 73 / 72, Nightmare 38 / 27 (n = 60). Genommen: ×0,65.
3. Verkaufswert (40 → 25 %) brachte bei ×0,7 nichts (Hard 72, NM 33), Platzierkosten 400 → 700 kippte die Farm (Hard 23, NM 7): zu steil, nicht genommen. Steigende Kosten je weiterer Farm: nicht nötig (der Bot baut höchstens 2, `farmLimit`).

Ergebnis n = 100: **Hard `farm` 64 / `wide` 55 (Abstand 9)**, Nightmare 21 / 24, Normal 100 / 99.

### Spam ohne Limit (`mono-X`)

Neue Bots `mono-X` (nur Sorte X, so viele wie bezahlbar, keine Upgrades, kein Sparen, kein Boss-Plan, `sim/src/bots/mono.ts`) und `mono-X+up` (danach auch Upgrades, zeigt die ausgebaute Variante). Siegquote n = 100, **mit** dem neuen Aufschlag (Spalte „ohne“ = n = 60 vor der Änderung):

| Bot | Normal ohne → mit | Hard ohne → mit | Nightmare ohne → mit | `+up` N / H / NM |
|---|---|---|---|---|
| mono-striker | 0 → 0 | 0 → 0 | 0 → 0 | 0 / 0 / 0 |
| mono-gunner | 0 → 0 | 0 → 0 | 0 → 0 | 0 / 0 / 0 |
| mono-blaster | 0 → 0 | 0 → 0 | 0 → 0 | 1 / 10 / 0 |
| mono-lancer | 20 → 0 | 0 → 0 | 0 → 0 | 0 / 0 / 0 |
| **mono-frost** | **100 → 16** | **97 → 0** | **53 → 0** | **100 / 70 / 12** |
| mono-titan | 0 → 0 | 0 → 0 | 0 → 0 | 0 / 0 / 0 (kauft nur 1 Stück, 1000 Münzen) |

- **Nur Frost ist als Spam gefährlich** (Kegel, Slow, Flächen-Stun, Luft): 21 Frost ohne Aufschlag gewinnen alle Stufen. Alle anderen Sorten schaffen als Spam nicht einmal 20 %.
- **Aufschlag-Suche** (`mono-frost` Normal / `wide` Normal, n = 40): +10 % ab dem ersten Exemplar → 0 / 20 (zerstört `wide`!), +5 % → 5 / 40, +3 % → 73 / 65. Ein Aufschlag ab dem **ersten** Exemplar trifft die normale Spielweise (`wide`: 5 Rare, 4 Epic, 3 Legendary, 2 Mythic) mehr als den Spam. Deshalb **5 Exemplare je Typ zum Basispreis** (das deckt jede Bot-Stückzahl und die Teambreite eines Menschen ab), danach +10 %: `mono-frost` Normal 16, `wide`/`farm` unverändert (99 / 100). +20 % ab dem 6. brachte nicht mehr (Normal 0 statt 15, Hard schon bei +10 % 0), also 10 %.
- **Grenze der Maßnahme:** `mono-frost+up` (7 voll ausgebaute Frost) bleibt Normal 100 / Hard 70 / Nightmare 12, also **so stark wie die beste Strategie** (aoe Hard 70). Das ist kein Spam-Problem, sondern „Frost ist die stärkste Einzel-Unit“ (schon Runde 4: Frost Pflicht, Verbot −95). Kein Eingriff (kein Fehler, innerhalb des Korridors), Hinweis für spätere Feinarbeit.

### Stufen (n = 100, nach den Änderungen)

| Bot | Normal | Hard | Nightmare |
|---|---|---|---|
| aoe | 99 | **70** | **26** |
| farm | 100 | 64 | 21 |
| greedy | 100 | 63 | 21 |
| wide (zweite Linie) | 99 | 55 | 24 |
| mono-frost+up | 100 | 70 | 12 |

Beste echte Strategie: **Normal 100 (Ziel ≥ 80), Hard 70 (35–70), Nightmare 26 (10–40)**, `wide` 99 / 55 / 24. Im Korridor, Normal leicht darüber (Ziel 85–95, wegen „Normal = entspannter Modus“ unverändert gelassen).

### Pflicht-Unit und Falle (Leave-one-out, n = 40, Verbot = Bot kennt die Unit nicht)

| Verbot | Normal farm / wide / aoe | Hard farm / wide / aoe |
|---|---|---|
| striker | 100 / 100 / 100 | 95 / 80 / 68 |
| gunner | 100 / 100 / 100 | 60 / 45 / 95 |
| **blaster** | **3 / 15 / 50** | **0 / 8 / 0** |
| banner | 100 / 100 / 95 | 63 / 58 / 70 |
| lancer | 100 / 85 / 98 | 65 / 50 / 85 |
| frost | 98 / 50 / 98 | 40 / 3 / 35 |
| **titan** | 100 / 100 / 100 | **98 / 90 / 95** |

Basis (n = 100): Normal 100 / 99 / 99, Hard 64 / 55 / 70.

1. **Blaster ist Pflicht-Unit** (Verbot −50 bis −97 Punkte, Auftrag: höchstens ≈ 30). Dasselbe Bild wie P3b („plant um den Blaster herum“): die einzige billige, volle Flächen-Antwort auf Grunt-Pulks. Kein Eingriff in P2 (Unit-Pool-Entscheidung, „nur grob“); **Frage an Max/Plori:** Lancer/Frost-Fläche stärken oder Blaster bewusst als Kern-Unit akzeptieren.
2. **Frost** auf Hard −25 bis −52 (wide −52): knapp über der Grenze, bekannt aus Runde 4 (Flieger-Pulks).
3. **Titan ist eine Falle für die Bots.** Ohne Titan (der Boss-Plan kauft ihn für 1000) siegen `farm`/`wide`/`aoe` auf Hard zu 98 / 90 / 95 (+34 bis +43), Nightmare 52 / 53 / 57 (`greedy` 45 / `farm` 52, +31); die Bosse fallen auch ohne ihn. **Folge für die Messlatte:** die „beste echte Strategie“ ohne Titan liegt auf Hard bei ~98 und damit **über** dem Korridor 35–70. Hebel wären Titan aufwerten (billiger/stärker, damit er sich lohnt) oder Hard härter; beides verschiebt viele Werte (Klippen-System, Runde 4) und gehört nicht in „nur grob“. Entscheidung an die Menschen.
4. Striker-Verbot hebt `farm` Hard auf 95 (Rotationsregel, nicht neu: Runde 4 P6b).

### Abnahme P2

`cd sim && npm test && npm run typecheck` grün (265 Tests, davon 6 neu in `test/placecost.test.ts`). v2-Beispiel-Replay `beispiel-v2-bot-normal.json` neu erzeugt (Daten haben sich geändert). Nicht untersucht (Zeitbudget 30–45 min Messung): Koop, `wide` ohne Bot-Limit nach der Änderung, Hard-Kennlinie.

## Analyse Max-Replay (07.10.2026, Normal, verloren in Welle 18)

Datei `docs/balancing/playtests/2026-10-07-max-normal-loss.json` (v1, Slots), nachgespielt im Stand `c2d79e5` (Scratch-Verzeichnis, `replay.ts --compare`, Hash OK) gegen `wide@normal`, gleicher Seed. Eingabe für **P4 (Lesbarkeit)**.

Mensch: 41 Befehle in 11 278 Ticks (9:24 min), 18 Waves, 26 Leaks (**14 davon Flyer**, W16 allein 11), Leben 30 → 0, Endmünzen 1172 ungenutzt. Gekauft: 9 Striker, 3 Blaster, 2 Lancer, 2 Frost, 4 Gunner; nur **7 Upgrades**. Bot: Sieg, 22 Leben übrig, Leaks nur 5 insgesamt, am Ende Frost 3, Blaster 4, Gunner 5, Lancer 3, Titan 1, Striker 2.

1. **Luftabwehr kam zu spät und blieb schwach.** Erste Flieger-Welle W8 (4 Leaks, −6 Leben), erster Frost und erster Gunner erst in W10; W16 mit 10 Fliegern leakt 11 (−11 Leben, 19 → 15 → 6). Der Bot hat Gunner/Frost vor W8 und leakt dort nichts. Für P4: Wellenvorschau muss „Flieger“ **vor** der Welle deutlich zeigen, und die Unit-Karten müssen „trifft Luft“ sichtbar machen (Gunner, Hybrid, Blaster 75 %).
2. **Wenig Eingriffe, kaum Ausbau, Verkauf-und-Neukauf.** In W11–W12 (Tick 5761–6033) fünf Platzierversuche auf Striker-Slot 1, alle `cap-reached` (zusätzlich 3 × `not-enough-coins` für den Blaster in W2/W3): der Mensch verstand die Ablehnung offenbar nicht oder sah sie nicht. In W10 verkauft er vier Striker (60 %) und kauft sofort vier andere (Verlust ≈ 320 Münzen, kaum Mehrwert). Der Blaster (die Pflicht-Unit, s. o.) bekam nur 2 Upgrades, der dritte Blaster kam erst in W16. Für P4: Ablehnungsgrund am Mauszeiger, Upgrade-Hinweis „bezahlbar“ an der Unit, Marker, welche Unit auf Stufe 0 steht.
3. **Münzen liegen herum, die Fähigkeit kaum genutzt.** Fast jede Welle startet mit 400–1100 Münzen; bei W16–W18 stehen 728 / 397 / 1132 ungenutzt, in der Todeswelle 1172. Fähigkeiten wurden nur einmal gezündet (einzige `useAbility` des Laufs in W17, trotz 2 Frost), der Titan wurde nie gekauft (919 Münzen in W10, Preis 1000). Für P4: Hinweis „Du hast X Münzen“ bei Wave-Start/-Vorschau, Fähigkeiten mit sichtbarem Bereit-Zustand und Taste; Titan-Kauf als erkennbares Ziel (Sparen-Anzeige).

Was **nicht** zum Verlust beitrug: Wellenstart (der Mensch ließ Wave 1 sofort starten, `skipWave` bei Tick 244; Verluste kamen erst ab W8), und die Zahl der Strikers (9 Käufe, aber 4 davon Wiederkauf).

