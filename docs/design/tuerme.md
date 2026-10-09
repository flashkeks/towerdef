# Türme und Held (Runde 11, Vertical Slice)

Verbindlich für P1 (Werte in `sim/data/towers.json`), P2 (was man je Stufe sieht) und P3 (Texte im Upgrade-Panel).
Namen und Beschreibungen **englisch** (Spieltext), Begründungen deutsch. Quellen: `docs/games/btd6/`.

## Einheiten

- Karte **640 × 360 px** (Pixel-Art-Auflösung). Im Simulator **Milli-px** (1 px = 1000), Zeit in **Ticks, 60 je Sekunde**.
- Umrechnung aus BTD6: BTD6-Einheit × 2,13 ≈ px (BTD6-Karte ≈ 300 Einheiten breit, unsere 640 px).
  Beispiel Dart-Reichweite 32 → 68 px.
- Preise = **Medium**. Easy × 0,85, Hard × 1,08, auf 5 gerundet (BTD6, Lehre 9).
- Schaden in ganzen „Schichten“: 1 Schaden = 1 Schicht eines Glims (wie BTD6).

## Gemeinsame Regeln

- **Crosspath wie BTD6:** höchstens zwei Pfade > 0, höchstens ein Pfad ≥ 3. Stufen nur der Reihe nach.
- **Angriffszyklus:** Ziel wählen (Targeting), **Ausholen 6 Ticks (0,1 s)**, dann **Abschuss** (Projektil entsteht). Das Ziel
  wird beim Ausholen festgelegt, gezielt wird beim Abschuss auf die dann aktuelle (bzw. vorausberechnete) Position.
- **Treffer erst bei Ankunft:** Pfeile, Bolzen, Bomben und Splitter fliegen; Schaden zählt beim Auftreffen. Sofort trifft
  nur, was sichtbar sofort ist: Blitz (Kette) und Aura.
- **Projektile:** treffen jeden Gegner, den sie unterwegs berühren (nicht nur das Ziel), je Gegner höchstens einmal,
  bis der Durchschlag (Pierce) verbraucht ist. Stirbt das Ziel vorher, fliegt das Projektil geradeaus weiter bis zur
  Lebensdauer (Reichweite × 1,5). Getarnte Gegner werden **getroffen**, wenn ein Projektil sie streift, aber nur
  **anvisiert**, wenn der Turm Erkennung hat (BTD6 `mechanics.md` § 4).
- **Schadensarten:** `sharp` (Pfeile, Splitter, Eissplitter): prallt an **Ironshell** ab (Pierce verbraucht, 0 Schaden).
  `cold` (Frostbolzen, Aura, Nova): **Emberling** immun (kein Schaden, keine Verlangsamung, Pierce verbraucht).
  `explosive`, `energy`, `magic`: treffen alles.
- **Targeting:** First / Last / Strong / Close (BTD6 § 2). Strong = Rangliste Leviathan > Brute > Ironshell = Emberling >
  Gold > Green > Blue > Red, bei Gleichstand weiter vorne auf dem Weg.
- **Verkauf:** 70 % aller Ausgaben für den Turm, aufgerundet (Wissensbaum: 75 %).
- **Fußabdruck** (Kreis) für die Platzierung: Ranger 9 px, Bombardier 10 px, Frostcaller 9 px, Wren 10 px.
- **Bonus-Schaden:** `+N vs brute` gilt für Brute **und** Leviathan; `+N vs boss` nur für den Leviathan.

## Kostenkurve und Begründung

BTD6-Median: T1 0,6×, T2 0,9×, T3 3,3×, T4 12×, T5 83× Basispreis (`design-lessons.md` Lehre 4). Unser Slice hat
**20 Runden** statt 40–60, das Gesamteinkommen bis Runde 20 liegt bei ≈ 7.500–8.000 (siehe `runden.md`). Mit 83× wäre
kein T5 je erreichbar. Deshalb **gestauchte Kurve**: T1 ≈ 0,5×, T2 ≈ 0,9×, T3 ≈ 2,7×, T4 ≈ 7×, T5 ≈ 15–20×. Ein T5 kostet
damit **≈ 55–75 % des Gesamteinkommens**: ein echtes Endziel, das man in Runde 17–20 nur erreicht, wenn man darauf spart
(in BTD6 kostet ein billiger T5 auf Medium ≈ 30–40 % des Einkommens bis R60). **Offene Frage an Max in STATUS.**

**Faustregel gegen Runde 10:** bei gleichem Geld kein Turm mehr als ~2× Schaden eines anderen, außer gegen seine
Spezialität. Grobe Wirkung je 100 Gold auf der Basisstufe: Ranger 1,05 Schichten/s, Bombardier ≈ 0,8 (bei 3–4 Treffern je
Explosion), Frostcaller ≈ 0,9 + Verlangsamung. P5 prüft das per Bot-Lauf.

---

## 1. Ranger (`ranger`) — billig, Einzelziel (wie Dart Monkey)

**Basis 200.** Pfeil: Schaden 1, Pierce 2, Intervall 0,95 s, Reichweite 68 px, Geschwindigkeit 700 px/s, `sharp`, keine Erkennung.

| Pfad | Stufe | Name | Preis | Wirkung (Werte nach dem Kauf) | Am Turm sichtbar |
|---|---|---|---:|---|---|
| A Volley | 1 | Sharp Tips | 120 | Pierce +1 (3) | Pfeilspitzen glänzen silbern |
| | 2 | Hunter's Arrows | 180 | Pierce +2 (5) | Feder am Köcher, roter Befiederung |
| | 3 | Triple Shot | 450 | 3 Pfeile im Fächer (je 12°) | zweiter Köcher, Bogen größer |
| | 4 | Arrowstorm | 1300 | 5 Pfeile, Schaden +1 (2), Pierce +2 (7) | Langbogen mit Messingbeschlag, Schulterpanzer |
| | 5 | Sky Splitter | 4200 | 7 Riesenpfeile: Schaden 4, Pierce 14, Art `magic` (trifft Ironshell), Pfeil 1.000 px/s | goldener Bogen größer als die Figur, Umhang, Leuchtspur |
| B Rapid | 1 | Quick Draw | 90 | Intervall × 0,85 | Ärmel hochgekrempelt |
| | 2 | Quicker Draw | 160 | Intervall × 0,80 | Stirnband |
| | 3 | Repeater | 500 | Intervall × 0,60, Pfeil 900 px/s | kleine Armbrust-Repetiermechanik am Bogen |
| | 4 | Volley Captain | 1500 | Intervall × 0,80; **Fähigkeit „Arrow Rain“**: alle Ranger schießen 6 s lang 3× so schnell, Abklingzeit 50 s | Hauptmannshut mit Feder, Banner auf dem Rücken |
| | 5 | Thousand Arrows | 4600 | Intervall fest 0,08 s, Schaden 2, Pierce 3; Arrow Rain 8 s | Figur in goldener Rüstung, zwei Bögen, Pfeilwirbel-Aura |
| C Eagle Eye | 1 | Longbow | 80 | Reichweite +25 % (85 px) | längerer Bogen |
| | 2 | Eagle Eye | 170 | **Erkennung (Camo)**, Reichweite +10 % (≈ 94 px) | Adler-Fernrohr / Monokel |
| | 3 | Ballista | 600 | Waffe wird Balliste: Bolzen Schaden 3, Pierce 5, Art `magic`, Intervall 1,3 s, 1.000 px/s, Reichweite +15 % | kleine Holzballiste neben der Figur |
| | 4 | Siege Ballista | 1500 | Schaden 7, Pierce 10, +4 vs brute, +12 vs boss | größere Balliste mit Eisenbeschlag |
| | 5 | Starfall Ballista | 4400 | Schaden 18, Pierce 30, +30 vs boss; Bolzen explodiert beim letzten Treffer (Radius 24 px, Schaden 6, `explosive`) | Sternen-Balliste, Leuchtkristall, Funkenaura |

## 2. Bombardier (`bombardier`) — Fläche, knackt Panzer (wie Bomb Shooter)

**Basis 350.** Bombe im Bogen, Flugzeit 0,45 s, zielt auf die **vorausberechnete** Position des Ziels; Explosion beim
Aufschlag: Radius 24 px, Schaden 1, höchstens 14 Gegner, Art `explosive`. Intervall 1,5 s, Reichweite 80 px, keine Erkennung
(die Explosion trifft aber getarnte Gegner im Radius).

| Pfad | Stufe | Name | Preis | Wirkung | Am Turm sichtbar |
|---|---|---|---:|---|---|
| A Bigger Blasts | 1 | Bigger Bombs | 250 | Radius +30 % (31 px), max. Ziele +8 (22) | größere Kugel auf dem Kanonenrohr |
| | 2 | Heavy Shells | 400 | Schaden +1 (2) | Rohr dicker, Messingringe |
| | 3 | Shellcracker | 1000 | +4 vs brute (gilt auch Boss) | Rohr mit Bohrspitze, Helm |
| | 4 | Siege Mortar | 2600 | Schaden +3 (5), Radius +20 %, Intervall × 0,85 | Mörser auf Lafette, Rauchschwaden |
| | 5 | Doomsday Keg | 5200 | Schaden +10 (15), Radius +40 %, +40 vs boss | Riesenfass-Kanone mit Totenkopf-Fähnchen, Figur mit Schweißermaske |
| B Clusters | 1 | Quick Fuse | 200 | Intervall × 0,80 | Lunte brennt sichtbar |
| | 2 | Long Barrel | 250 | Reichweite +20 %, Flugzeit 0,35 s | längeres Rohr |
| | 3 | Cluster Bombs | 750 | Explosion wirft 6 Splitter (Schaden 1, Pierce 1, 450 px/s, Reichweite 40 px, `sharp`) | Patronengurt, zweites Rohr |
| | 4 | Clusterstorm | 2200 | 8 Splitter, jeder explodiert klein (Radius 12 px, Schaden 1, `explosive`) | Drehtrommel mit 4 Rohren |
| | 5 | Bombardment | 4600 | Intervall × 0,40, 12 Splitter | Raketenwerfer-Rucksack, Figur mit Pilotenmütze |
| C Concussion | 1 | Wide Range | 150 | Reichweite +15 % | Fernglas am Gürtel |
| | 2 | Ringing Blast | 300 | Betäubung 0,3 s (nicht Boss) | Glocke am Rohr |
| | 3 | Concussion Shells | 850 | Betäubung 1,0 s, Boss 0,2 s | blau gestreifte Granaten im Gestell |
| | 4 | Thunder Cannon | 2400 | Betäubung 1,5 s, Boss 0,5 s, Radius +25 %, Schaden +2 | Kanone mit Kupferspulen, Funken |
| | 5 | Earthshaker | 5000 | jeder 3. Schuss: Beben, alle Gegner in Reichweite 2 s betäubt (Boss 1 s), Schaden 5 | Riesenhammer-Kanone, Bodenrisse am Sockel |

## 3. Frostcaller (`frostcaller`) — Kontrolle (wie Ice + Wizard)

**Basis 300.** Frostbolzen: Schaden 1, Pierce 3, Intervall 1,1 s, Reichweite 72 px, 500 px/s, Art `cold`, verlangsamt
getroffene Gegner um 30 % für 1,5 s (Boss: halbe Wirkung, halbe Dauer). Keine Erkennung.

| Pfad | Stufe | Name | Preis | Wirkung | Am Turm sichtbar |
|---|---|---|---:|---|---|
| A Permafrost | 1 | Chill | 120 | Verlangsamung 45 %, 2,0 s | Schal wird eisblau |
| | 2 | Frost Aura | 300 | Aura: alle Gegner in Reichweite −25 % Tempo (nicht Boss) | Schneeflocken kreisen um den Hut |
| | 3 | Blizzard | 900 | Aura −50 %, Aura-Schaden 1 alle 1,5 s an bis zu 20 Gegner (`cold`) | Eiskristall-Krone, Schneegestöber am Sockel |
| | 4 | Glacier Heart | 2400 | Aura −60 %, wirkt auf den Boss mit −25 % | Eisherz im Stab, Sockel wird Eisblock |
| | 5 | Absolute Zero | 5000 | Aura-Schaden 2; **Fähigkeit „Absolute Zero“**: friert alles 4 s ein (Boss 1,5 s), Abklingzeit 45 s | Figur in Eisrüstung, schwebende Eisscherben, weiße Aura |
| B Shatter | 1 | Frost Nova | 180 | Bolzen platzt beim ersten Treffer: Radius 16 px, bis 6 Gegner, Schaden 1 | Stabspitze wird Kristallstern |
| | 2 | Brittle Ice | 380 | verlangsamte Gegner nehmen **+1 Schaden** aus allen Quellen | Risse-Muster auf dem Umhang |
| | 3 | Ice Shards | 1000 | Nova wirft 5 Eissplitter (Schaden 2, Pierce 2, 400 px/s, 48 px, `sharp`) | Eiszapfen-Schulterstücke |
| | 4 | Glacial Spike | 2700 | Intervall × 0,70, Schaden +3, +6 vs boss | großer Eisspeer statt Stab |
| | 5 | Winter's Wrath | 5400 | Schaden +8, 12 Splitter, Nova-Radius × 2 | Frost-Golem-Silhouette hinter der Figur, Eisflügel |
| C Storm | 1 | Spark | 200 | Treffer springt als Blitz auf 2 weitere Gegner (Schaden 1, `energy`, sofort) | Funken am Hut |
| | 2 | Storm Sight | 250 | **Erkennung (Camo)**, Reichweite +15 % | leuchtende Augen, Blitz-Brosche |
| | 3 | Chain Lightning | 1100 | Hauptangriff wird Kettenblitz (sofort): 6 Gegner, Schaden 2, `energy`, Intervall 1,0 s | Stab mit Kupferspirale, Gewitterwölkchen über dem Hut |
| | 4 | Tempest | 3000 | Kette 10, Schaden 3, Intervall × 0,60 | Hut wird zur Sturmhaube, Wolke größer, Blitze |
| | 5 | Stormcaller | 5800 | Kette 18, Schaden 6; alle 4 s ein Donnerschlag auf das stärkste Ziel in Reichweite (Schaden 60, `energy`) | schwebt auf einer Wolke, Blitzkrone, Dauerblitze |

Hinweis Pfad C: ab Stufe 3 bleibt die Verlangsamung des Basis-Bolzens weg (es gibt keinen Bolzen mehr). Wer A+C kauft
(z. B. 2-0-5), hat Aura (A2) plus Blitz: das ist die Absicht des Crosspaths.

---

## 4. Held: Wren, the Lamplighter (`wren`)

**Preis 540** (wie Quincy), einmal je Match. Laternenfeuer-Bolzen: Schaden 1, Pierce 3, Intervall 0,8 s, Reichweite 84 px,
600 px/s, Art `magic`. Level 1–20 durch **Helden-XP im Match**: am Ende jeder Runde **100 + 30 × Rundennummer**, solange Wren
steht (Wissensbaum kann den Start auf Level 3 heben). Leveln kostet nichts.

| Level | XP gesamt | Wirkung |
|---:|---:|---|
| 1 | 0 | Grundwerte |
| 2 | 100 | Reichweite +10 % |
| 3 | 230 | **Fähigkeit 1 „Flare“**: Leuchtkugel auf das stärkste Ziel in Reichweite: Radius 40 px, Schaden 5 an bis zu 30 Gegnern, **enttarnt** alle Gegner im Radius dauerhaft. Abklingzeit 40 s |
| 4 | 400 | Pierce +2 |
| 5 | 600 | **Erkennung (Camo)** |
| 6 | 850 | Intervall × 0,85 |
| 7 | 1150 | Schaden +1 |
| 8 | 1500 | Bolzen setzen in Brand: 1 Schaden je s, 3 s (`magic`) |
| 9 | 1900 | Reichweite +10 % |
| 10 | 2350 | **Fähigkeit 2 „Dawnbreak“**: Lichtstrahl über den ganzen Weg: 20 Schaden an jedem Gegner, 300 am Boss. Abklingzeit 60 s |
| 11 | 2850 | Pierce +3 |
| 12 | 3400 | Aura: Türme im Umkreis 84 px schießen 10 % schneller |
| 13 | 4000 | Schaden +1 |
| 14 | 4650 | Intervall × 0,85 |
| 15 | 5300 | Flare: Schaden 15, Abklingzeit 30 s |
| 16 | 5950 | Brand 3 je s |
| 17 | 6600 | Aura zusätzlich +10 % Reichweite |
| 18 | 7200 | Schaden +2 |
| 19 | 7750 | Intervall × 0,80 |
| 20 | 8250 | Dawnbreak: 60 Schaden, 1.200 am Boss, Abklingzeit 45 s |

Rechnung: Wren ab Runde 1 erreicht nach Runde 10 ≈ Level 10, nach Runde 20 Level 20 (Summe 100 + 30 r über r = 1–20 = 8.300).
Am Turm sichtbar (P2): Level 1–4 kleine Laterne, 5–9 größere Laterne + Umhang, 10–14 Laternenstab mit Flamme + Funken,
15–19 Laternenkrone, 20 goldene Aura und schwebende Laternen.

## 5. Fähigkeiten (aktiv, Knopf im Panel, Taste 1–3)

| Fähigkeit | Quelle | Wirkung | Abklingzeit |
|---|---|---|---:|
| Arrow Rain | Ranger B4 (B5: 8 s) | alle Ranger 3× Angriffstempo, 6 s | 50 s |
| Absolute Zero | Frostcaller A5 | alles einfrieren 4 s (Boss 1,5 s), Eingefrorene nehmen keinen `sharp`-Schaden (BTD6) | 45 s |
| Flare | Wren L3 (L15 stärker) | siehe oben | 40 s / 30 s |
| Dawnbreak | Wren L10 (L20 stärker) | siehe oben | 60 s / 45 s |

Abklingzeit startet beim Kauf bzw. Level-Up **voll** (wie BTD6), nicht sofort einsatzbereit.
