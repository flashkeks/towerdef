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
