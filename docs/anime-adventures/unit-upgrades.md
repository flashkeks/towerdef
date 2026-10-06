# Unit Upgrade System

Legende: `ART · CONFIDENCE · [Quelle]` (siehe [README](README.md#kennzeichnung)). Alle Statistiken in diesem Dokument sind **DERIVED** aus [data/units.json](data/units.json) (`levels[]`; Quelle S65 = RR-Stand 2026-03, S66 = LEGACY-Endstand 2023-12). Die Rechenskripte liegen nicht im Repo; die Rechenwege stehen jeweils dabei.

## Grundprinzip

```text
Placement (Deployment Cost, levels[0])
→ Upgrade 1 → Upgrade 2 → … → Final Upgrade   (Rare meist 5, Mythic/Secret meist 8 Stufen)
```

- Upgrades werden **im Match mit Yen** gekauft und gelten **pro platzierter Instanz**. OBSERVED · HIGH · [S42, S65]
- Ein Upgrade kann ändern: Damage, SPA, Range, Angriff (AoE-Form/-Radius, Hits), DoT, neue Fähigkeit oder Passive (Feld `note`, z. B. „+ Bamboo Shot“), Yen pro Wave (Farm). OBSERVED · HIGH · [S65, S67]
- Fehlt in einer Stufe ein Wert, gilt der Vorwert (Vererbung). OBSERVED · HIGH · [S65]
- Median **2** Stufen pro Unit bringen eine neue Fähigkeit bzw. einen neuen Angriff (`note`). DERIVED aus S65
- Optische Änderungen bei Upgrades (Größe, Animation): UNKNOWN.
- Modifikator „Triple Cost“ in Challenges: Platzierung und Upgrades kosten ×3. OBSERVED · HIGH · [S72:Challenges]

### Verkauf

| Regel | Wert | Tag |
|---|---|---|
| Sell-Wert | **25 %** von (Deployment + bezahlte Upgrades) | OBSERVED · HIGH · [S72: 509 von 510 Unit-Seiten] |
| Ausnahme | C.E.O.-Seite nennt 30 %, vermutlich Seitenfehler (siehe [unknowns.md](unknowns.md), C5) | OBSERVED · LOW · [S72:C.E.O.] |
| Unverkäuflich | Flag `unsellable` bei 9 Units, darunter die Farm-Units **Bulby** und **Weather Girl / Weather Girl (Thief)** sowie Usurper, Lulu, Lyla, Spirit Reaper (Final Dusk). Zusätzlich laut Wiki Griffin (Reincarnation) | OBSERVED · HIGH · [S65, S72:Griffin (Reincarnation)] |
| Gold beim Verkauf aus dem **Inventar** | „Gold can be earned through selling your Units“ (Menge UNKNOWN) | OBSERVED · MEDIUM · [S72:Currencies] |

Folge: Umbauen kostet 75 % der Investition. Eine Unit für 50.500 ¥ (Mythic-Median) bringt beim Verkauf 12.625 ¥ zurück. DERIVED

## Kostenkurven (Statistik über alle Units)

### Kennzahlen pro Rarität (RR, S65; nur `kind = unit`, Beschwörungen ausgenommen)

| Rarität | n | Upgrades (Median, Min–Max) | Deploy ¥ (Median) | Total ¥ (Median) | Total/Deploy (Median; P25–P75) | Kostenfaktor je Stufe (Median) | Damage final/base | SPA final/base | Range final/base | DPS final/base |
|---|---:|---|---:|---:|---|---:|---:|---:|---:|---:|
| Rare | 20 | 5 (3–5) | 400 | 6.025 | 16,5 (15,4–17,3) | ×1,50 | ×6,0 | ×0,83 | ×1,37 | ×7,0 |
| Epic | 19 | 5 (4–7) | 525 | 10.425 | 20,0 (18,6–21,0) | ×1,40 | ×8,0 | ×0,80 | ×1,50 | ×10,0 |
| Legendary | 35 | 7 (5–8) | 850 | 25.650 | 31,7 (26,6–36,6) | ×1,30 | ×11,7 | ×0,79 | ×1,67 | ×14,2 |
| Mythic | 377 | 8 (1–13) | 1.350 | 50.500 | 36,9 (25,2–46,0) | ×1,29 | ×15,6 | ×1,00 | ×1,56 | ×16,5 |
| Secret | 72 | 8 (4–10) | 1.600 | 59.000 | 33,1 (21,2–49,5) | ×1,30 | ×15,4 | ×1,00 | ×1,50 | ×14,9 |
| Exclusive | 22 | 8 (3–8) | 1.250 | 41.525 | 32,5 (31,7–35,5) | ×1,33 | ×13,3 | ×1,07 | ×1,73 | ×13,7 |

DERIVED · HIGH. Rechenweg: Total = Σ `cost` über alle Stufen; „Kostenfaktor je Stufe“ = Median von `cost[i+1]/cost[i]` ab Upgrade 1; „final/base“ = Wert der letzten Stufe / Wert der Platzierung; DPS = damage/spa (Hits teilen den Damage, [S76]).

Bei Mythic/Secret sinkt die SPA in 48 % der Units bis zur Endstufe, in 39 % **steigt** sie (schwerere Angriffe mit größerer AoE), der Rest bleibt gleich. Darum liegt der Median bei ×1,00. DERIVED aus S65 (n = 446)

### Kosten der Stufe k relativ zur Platzierung (Median)

| Rarität | U1 | U2 | U3 | U4 | U5 | U6 | U7 | U8 | U9 | U10 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | 1,38 | 1,85 | 2,41 | 5,00 | 6,25 | | | | | |
| Epic | 1,36 | 2,10 | 2,73 | 4,50 | 6,09 | 6,67 | | | | |
| Legendary | 1,47 | 2,00 | 2,65 | 3,33 | 5,12 | 7,65 | 9,41 | 7,50 | | |
| Mythic | 1,43 | 2,00 | 2,59 | 3,46 | 4,44 | 5,38 | 6,80 | 8,57 | 10,00 | 12,02 |
| Secret | 1,50 | 1,92 | 2,55 | 3,45 | 4,50 | 5,67 | 6,84 | 9,13 | 12,25 | 12,50 |

DERIVED · HIGH aus S65 (nur Stufen mit n ≥ 5).

**Faustformel** (DERIVED · MEDIUM, Anpassung an die Mythic-Zeile): `cost_k ≈ deploy × (1 + 0,38·k + 0,07·k²)` liefert 1,45 / 2,04 / 2,77 / 3,64 / 4,65 / 5,80 / 7,09 / 8,52 (Ist: 1,43 / 2,00 / 2,59 / 3,46 / 4,44 / 5,38 / 6,80 / 8,57) für k = 1…8. Das ist ein guter Startwert für eigene Kurven.

### LEGACY vs. RR

| Zeitraum/Version | alter Wert (S66, LEGACY-Endstand) | neuer Wert (S65, RR) | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Mythic Total ¥ (Median) | 49.750 (n = 354) | 50.500 (n = 377) | 50.500 | S66, S65 |
| Mythic Total/Deploy | 36,5 | 36,9 | 36,9 | dto. |
| Secret Total/Deploy | 32,8 (n = 60) | 33,1 (n = 72) | 33,1 | dto. |
| Rare/Epic/Legendary | identisch | identisch | – | dto. |

Die Kostenkurven sind zwischen LEGACY-Ende und RR praktisch unverändert. Nur 9 Units haben abweichende Upgrade-Werte (`legacyLevels` in units.json); die Unterschiede kommen fast nur von neuen Units. Der Update-19-Text „Most Rares, Epics and Legendaries … buffed“ [S72:Update Log] ist im Datenmodul **nicht** sichtbar; entweder liegt der Buff außerhalb der Upgrade-Tabellen oder das Modul wurde nicht nachgezogen (UNKNOWN).

## Belegte Upgrade-Pfade (Beispiele)

Vollständige Tabellen für alle 561 Units: [data/units.json](data/units.json) und [units.md](units.md).

| Unit | Rarität | Stufen | Kostenfolge ¥ | Total ¥ | Total/Deploy | Tag |
|---|---|---:|---|---:|---:|---|
| Captain | Rare | 4 | 300 → 450 → 650 → 1.500 → 2.500 | 5.400 | 18,0× | OBSERVED · HIGH · [S65] |
| C.E.O. (Farm) | Epic | 4 | 550 → 1.000 → 1.750 → 2.500 → 3.000 | 8.800 | 16,0× | OBSERVED · HIGH · [S65] |
| Bulby (Farm) | Legendary | 6 | 800 → 1.500 → 3.000 → 4.500 → 7.500 → 10.000 → 12.500 | 39.800 | 49,8× | OBSERVED · HIGH · [S65] |
| Commander | Legendary | 6 | 775 → 1.000 → 1.500 → 2.000 → 4.000 → 5.500 → 7.000 | 21.775 | 28,1× | OBSERVED · HIGH · [S65] |
| Wind Dragon | Legendary | 6 | 800 → 1.200 → 1.750 → 2.500 → 4.000 → 6.000 → 8.000 | 24.250 | 30,3× | OBSERVED · HIGH · [S65] |
| Black Assassin | Mythic | 5 | 1.200 → 1.700 → 2.000 → 3.000 → 4.000 → 7.000 | 18.900 | 15,8× | OBSERVED · HIGH · [S65] |
| Honey | Mythic | 4 | 1.000 → 1.250 → 2.000 → 3.000 → 4.500 | 11.750 | 11,8× | OBSERVED · HIGH · [S65] |
| Eccentric Researcher | Mythic | 6 | 1.500 → 2.000 → 3.000 → 3.500 → 4.500 → 5.500 → 6.500 | 26.500 | 17,7× | OBSERVED · HIGH · [S65] |
| Legendary Assassin | Mythic | 7 | 1.250 → 1.500 → 2.700 → 4.000 → 7.000 → 10.000 → 12.000 → 17.000 | 55.450 | 44,4× | OBSERVED · HIGH · [S65] |
| Fiery Commander | Secret | 8 | 1.750 → 2.200 → 2.500 → 4.000 → 5.000 → 6.500 → 8.000 → 12.500 → 17.500 | 59.950 | 34,3× | OBSERVED · HIGH · [S65] |
| Weather Girl (Thief) (Farm) | Mythic | 8 | 1.000 → 500 → 750 → 1.500 → 2.000 → 2.500 → 3.500 → 5.000 → 6.000 | 22.750 | 22,8× | OBSERVED · HIGH · [S65] |

## Effizienz-Kennzahlen

Definitionen (DERIVED · HIGH als Formeln):

```text
DPS            = Damage / SPA                   (Hits teilen den Damage auf, sie multiplizieren ihn NICHT [S76])
DPS_eff        = DPS × (1 + critChance × (critMult − 1)) × (1 + DoT-Gesamtmultiplikator)
DPS/Cost       = DPS / kumulierte Kosten
Upgrade-Eff.   = ΔDPS / Upgrade-Kosten           (Grenz-DPS pro ¥)
```

### Grenz-Effizienz über alle Units (RR, S65)

Effizienz der Stufe relativ zur Platzierung: `(ΔDPS_k / cost_k) / (DPS_0 / deploy)`. Werte < 1 heißen: Diese Stufe bringt weniger DPS pro Yen als eine zusätzliche Platzierung.

| Position im Upgrade-Pfad | n (Stufen) | Median | P25–P75 |
|---|---:|---:|---|
| erstes Drittel | 1.480 | 0,70 | 0,55–0,83 |
| mittleres Drittel | 1.347 | 0,48 | 0,33–0,62 |
| letztes Drittel | 1.134 | 0,39 | 0,25–0,53 |
| letzte Stufe | 534 | 0,39 | 0,27–0,53 |
| DPS/¥ bei Max relativ zur Platzierung | 534 Units | 0,49 | 0,38–0,58 |

DERIVED · HIGH. LEGACY (S66) liefert dieselben Werte (0,70 / 0,48 / 0,39 / 0,39 / 0,49).

**Design-Erkenntnis:** Die Grenz-Effizienz fällt monoton. Eine voll ausgebaute Unit liefert rund **halb so viel DPS pro Yen** wie ihre Platzierung. Trotzdem lohnt sich Ausbauen, weil der **Spawn Cap** die Zahl der Platzierungen begrenzt und Range/AoE/Fähigkeiten mitwachsen. Die Kurve sorgt dafür, dass erst breit platziert und dann vertikal ausgebaut wird. RECONSTRUCTED · MEDIUM

### Beispielwerte (Level 1, ohne Potential und Trait)

| Unit, Stufe | kum. ¥ | Damage | SPA | Angriff | DPS | DPS/1000 ¥ | Tag |
|---|---:|---:|---:|---|---:|---:|---|
| Captain Placement | 300 | 3 | 3 | Single | 1,0 | 3,33 | DERIVED |
| Captain U4 | 5.400 | 8,5 | 1,5 | Circle r = 4 | 5,67 pro Ziel | 1,05 | DERIVED |
| Honey Placement | 1.000 | 150 | 1 | – | 150 | 150 | DERIVED |
| Honey U4 | 11.750 | 1.000 | 1 | – | 1.000 | 85,1 | DERIVED |
| Legendary Assassin Placement | 1.250 | 950 | 7 | Cone 60° | 135,7 | 108,6 | DERIVED |
| Legendary Assassin U7 | 55.450 | 12.000 | 5,5 | – | 2.181,8 | 39,3 | DERIVED |
| Black Assassin Placement | 1.200 | 600 | 7 | Circle r = 7 | 85,7 | 71,4 | DERIVED |
| Black Assassin U5 | 18.900 | 4.500 | 6 | Circle r = 10, 2 Hits | **750** pro Ziel | 39,7 | DERIVED |
| Fiery Commander Placement | 1.750 | 250 | 7 | Circle r = 7, Burn 5 × 6 % | 35,7 (mit Burn 46,4) | 20,4 (26,5) | DERIVED |
| Fiery Commander U2 | 6.450 | 600 | 5,5 | dto. | 109,1 (141,8) | 16,9 (22,0) | DERIVED |
| Fiery Commander U8 | 59.950 | 3.500 | 13,5 | Full AoE, Burn | 259,3 (337,0) | 4,3 (5,6) | DERIVED |
| Eccentric Researcher (Captain) Placement | 1.500 | 390 | 7 | 50 % Crit, DoT +30 % | 55,7 (mit DoT 72,4) | 37,1 (48,3) | DERIVED |

Quelle der Rohwerte: S65/S67 über units.json. AoE-Units sind pro Ziel verglichen; ihr effektiver Wert ist `DPS × getroffene Gegner`.

## Farm-ROI

ROI = Waves bis zur Amortisation des **Grenz-Upgrades**: `ROI_k = cost_k / (income_k − income_{k−1})`. Im RR-Datenmodul haben genau **drei** Units ein Farm-Einkommen (`farm_amount`). [S65]

### Bulby (Legendary, Spawn Cap 1) — DERIVED aus S65

| Stufe | Kosten | kumuliert | Yen/Wave | ROI (Grenz) | ROI kumuliert | ROI Golden (×1,2) |
|---|---:|---:|---:|---:|---:|---:|
| 0 | 800 | 800 | 250 | 3,20 | 3,20 | 2,67 |
| 1 | 1.500 | 2.300 | 750 | 3,00 | 3,07 | 2,50 |
| 2 | 3.000 | 5.300 | 1.500 | 4,00 | 3,53 | 3,33 |
| 3 | 4.500 | 9.800 | 3.000 | 3,00 | 3,27 | 2,50 |
| 4 | 7.500 | 17.300 | 5.000 | 3,75 | 3,46 | 3,13 |
| 5 | 10.000 | 27.300 | 8.000 | 3,33 | 3,41 | 2,78 |
| 6 | 12.500 | 39.800 | 10.000 | 6,25 | 3,98 | 5,21 |

### C.E.O. (Epic, Spawn Cap 3) — DERIVED aus S65

| Stufe | Kosten | kumuliert | Yen/Wave | ROI (Grenz) | ROI kumuliert |
|---|---:|---:|---:|---:|---:|
| 0 | 550 | 550 | 200 | 2,75 | 2,75 |
| 1 | 1.000 | 1.550 | 500 | 3,33 | 3,10 |
| 2 | 1.750 | 3.300 | 1.000 | 3,50 | 3,30 |
| 3 | 2.500 | 5.800 | 1.750 | 3,33 | 3,31 |
| 4 | 3.000 | 8.800 | 2.500 | 4,00 | 3,52 |

### Weather Girl (Thief) (Mythic, Spawn Cap 3, Hybrid aus Farm und Damage) — DERIVED aus S65

| Stufe | Kosten | kumuliert | Yen/Wave | ROI (Grenz) | ROI kumuliert |
|---|---:|---:|---:|---:|---:|
| 0 | 1.000 | 1.000 | 300 | 3,33 | 3,33 |
| 1 | 500 | 1.500 | 450 | 3,33 | 3,33 |
| 2 | 750 | 2.250 | 600 | 5,00 | 3,75 |
| 3 | 1.500 | 3.750 | 800 | 7,50 | 4,69 |
| 4 | 2.000 | 5.750 | 1.000 | 10,00 | 5,75 |
| 5 | 2.500 | 8.250 | 1.500 | 5,00 | 5,50 |
| 6 | 3.500 | 11.750 | 2.000 | 7,00 | 5,88 |
| 7 | 5.000 | 16.750 | 2.500 | 10,00 | 6,70 |
| 8 | 6.000 | 22.750 | 3.000 | 12,00 | 7,58 |

Golden gibt Weather Girl **keinen** Yen-Bonus, nur +30 % Damage. OBSERVED · HIGH · [S72:Traits]. Ihr schlechteres Farm-ROI wird durch ihren Damage-Anteil ausgeglichen (Endstufe 2.625 Damage).

**Design-Erkenntnis** (DERIVED · HIGH): Reine Farm-Units amortisieren sich pro Stufe in **3–4 Waves**, die letzte Stufe ist bewusst teurer (Bulby 6,25). Hybride Farmer liegen bei 5–12 Waves. Der Sell-Verlust von 75 % bestraft spätes Umbauen; Bulby und Weather Girl sind sogar unverkäuflich (Farm-Investition ist endgültig).

## Für unseren Nachbau (DESIGN)

- Kostenkurve pro Rarität über `cost_k = deploy × (1 + a·k + b·k²)` (Mythic-Fit: a = 0,38, b = 0,07), Stufenzahl 5 (Rare) bis 8 (Mythic). DESIGN, kalibriert an AA
- Zielwerte: Total/Deploy ≈ 16 (Rare), 20 (Epic), 30 (Legendary), 35 (Mythic); End-DPS ≈ ×7 / ×10 / ×14 / ×16 der Platzierung. DESIGN, kalibriert an AA
- Farm-Einheiten mit Grenz-ROI 3–4 Waves und einer teureren letzten Stufe. DESIGN, kalibriert an AA
- Verkauf 25 %. DESIGN nach AA-Vorbild

## Fehlende Daten (siehe [unknowns.md](unknowns.md))

- Visuelle Änderungen pro Upgrade
- Ob Potential, Trait und Curse auf die Upgrade-Werte multiplikativ wirken (siehe [unit-powerups.md](unit-powerups.md))
- Gold-Erlös beim Verkauf aus dem Inventar
