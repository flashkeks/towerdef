# Beispiel-Simulation – durchgerechnete Runde

> Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README](README.md#kennzeichnung). Stand Sitzung 2 (P10). Die Runde wurde mit einem Python-Skript (Tick 0,01 s, Skript nicht im Repo) durchgerechnet; alle Zwischenwerte unten stammen aus diesem Lauf und sind von Hand nachvollziehbar.

**Zweck:** Alle Rechenwege einer Partie einmal vollständig zeigen: Wave 1 → Spawn → Platzierung → Angriffe → Kills → Yen → Upgrade → Wave 2 → Ability → Boss.

**Was AA-Werte sind und was nicht:**

- **AA-Werte** (belegt): Unit-Datenblätter von Captain, C.E.O., Commander und Fiery Commander aus [data/units.json](data/units.json), Level-100-Faktor, Potential- und Trait-Werte, Burn-Modell, Commander-Buff, Schild-Regel, Targeting „First“, Map-Laufzeit.
- **`DESIGN`** (in AA UNKNOWN): Start-Yen, Kill- und Wave-Yen, Base HP, Leak-Schaden, Gegner-HP, Gegner-Speed, Spawn-Abstände, Pause zwischen Waves, Burn-Tick, Positionen auf der Map. Die Defaults stammen aus [technical-reconstruction.md](technical-reconstruction.md#design-defaults-bis-aa-daten-vorliegen).

## Annahmen

### Map und Regeln

| Parameter | Wert | Herkunft |
|---|---|---|
| Map | Planet Namak (RR: Planet Greenie), Laufzeit **14 s** | OBSERVED · HIGH · [S38 → S72:Map Lengths] |
| Gegner-Speed | 4 Studs/s, Boss 2 Studs/s | `DESIGN` (Default) |
| Pfad | gerade Linie, Länge `14 s × 4 = 56` Studs, Position `s ∈ [0, 56]` | DERIVED aus Laufzeit × DESIGN-Speed |
| Positionen (x, y), Pfad auf y = 0 | Captain (28, 5) auf einem Hill; C.E.O. abseits; Commander (24, −5); Fiery Commander (30, −5) | `DESIGN` |
| Start-Yen | **2.500** | `DESIGN` (Default 2.000–2.500) |
| Wave-Yen | `200 + 100·w` bei Wave-Ende | `DESIGN` (Default) |
| Kill-Yen | `5 + floor(maxHP/10)`; Boss 100 | `DESIGN` (Default; Boss-Wert eigene Wahl) |
| Farm-Yen | bei Wave-Ende | OBSERVED · HIGH · [S65, S72:Effects] |
| Base HP / Leak | 100 / 1 pro Gegner, 20 pro Boss | `DESIGN` (Default 1–5 bzw. 20–100) |
| Pause zwischen Waves | 5 s nach dem letzten Gegner | `DESIGN` (AA hat einen Wave-Timer, Dauer UNKNOWN) |
| Targeting | **First** (größtes `s` in Range) | OBSERVED · HIGH (Modus) · [S53, S72:Divine General] |
| Angriffszyklus | Angriff sofort, wenn Ziel in Range und Cooldown abgelaufen; nächster Angriff `+ SPA`; Windup 0 | RECONSTRUCTED · MEDIUM · [combat-system.md](combat-system.md#4-attack-cycle) / Windup `DESIGN` |
| Range-Test | `dist(unit, enemy) ≤ range`, also Abdeckung `|s − x0| ≤ √(range² − y0²)` | DERIVED (Geometrie) |
| Circle-AoE | Kreis um das **Ziel** | RECONSTRUCTED · MEDIUM · [combat-system.md](combat-system.md#3-aoe-geometrie) |
| Burn | `tick = Hit × 0,06`, 5 Ticks, erster Tick 1 s nach dem Treffer | OBSERVED · HIGH · [S67] / Tick-Intervall `DESIGN` 1 s |
| Schild | jeder Hit entfernt 1 Instanz ohne HP-Schaden | OBSERVED · HIGH · [S72:Enemy Mechanics, S73, S76] |
| Hits | alle vier Units haben `hits = 1` im Modul | OBSERVED · HIGH · [S67] |

### Unit-Instanzen

Alle Units auf **Level 100**. Damit ist der Level-Faktor exakt bekannt (`9,20406501834430488`); Zwischenstufen der Level-Kurve sind UNKNOWN. Potential und Trait multiplizieren wir (Reihenfolge RECONSTRUCTED · LOW, siehe [mathematics.md](mathematics.md#final-damage)).

| Unit | Datenblatt (Stufe: Kosten / Damage / SPA / Range) | Instanz-Werte | Herkunft |
|---|---|---|---|
| **Captain** (`usopp`, Rare, Hill, Physical + Air, Spawn Cap 6) | U0: 300 / 3 / 3 / 25 · U1: 450 / 5,5 / 2,5 / 25 · Angriff Single | Potential Damage **+5 %** (Rang B), Trait **Superior I** (+10 %) | Datenblatt OBSERVED · HIGH · [S65, S67]; Potential/Trait-Werte OBSERVED · HIGH · [S72:Powerups, S72:Traits]; Wahl `DESIGN` |
| **C.E.O.** (`speedwagon`, Epic, Farm, Spawn Cap 3) | U0: 550, Farm 200 ¥ · U1: 1.000, Farm 500 ¥ | – | OBSERVED · HIGH · [S65] |
| **Commander** (`erwin`, Legendary, Hybrid, Physical, Spawn Cap 6 global) | U0: 775 / 0 / 15 / 15 · Active „Dedicate your hearts!“ | Buff **+25 % Physical** auf Units in Range, **30 s** Dauer, **60 s** Cooldown, seit Update 14 ab U0 verfügbar | OBSERVED · HIGH · [S30 → S72:Commander, S65] |
| **Fiery Commander** (`yamamoto`, Secret, Ground, **Physical + Fire**, Spawn Cap 3) | U0: 1.750 / 250 / 7 / 20 · Circle r = 7 · Burn 6 % × 5 | keine Potential-/Trait-Boni | OBSERVED · HIGH · [S65, S67] |

Rechenwerte (DERIVED, `L = 9,20406501834430488`):

```text
Captain U0 Hit   = 3   × L × 1,05 × 1,10        = 31,892
Captain U1 Hit   = 5,5 × L × 1,05 × 1,10        = 58,469
  mit Commander-Buff (+25 %, additive Buff-Summe = 1 + 0,25)  = 73,086
Fiery U0 Hit     = 250 × L                       = 2.301,016;  Burn-Tick 0,06 × 2.301,016 = 138,061 (Summe 690,30)
  mit Buff                                       = 2.876,270;  Burn-Tick 172,576
Abdeckung Captain (Range 25, Abstand 5):  ±√(625 − 25) = ±24,495 → s ∈ [3,505 ; 52,495] → 12,25 s bei 4 Studs/s
Abdeckung Fiery   (Range 20, Abstand 5):  ±√(400 − 25) = ±19,365 → s ∈ [10,635 ; 49,365] → 19,36 s beim Boss (2 Studs/s)
Commander-Range 15 → Captain in 10,77, Fiery in 6,00 Studs: beide werden gebufft
```

Ausgeklammert: Der Commander beschwört zusätzlich bis zu 3 „Survey Corps Member“ (Modul: Damage 15, SPA 10, HP 100, Speed 3), die von der Basis rückwärts laufen [S72:Commander, S72:Effects, S65]. Wie viel Schaden eine Beschwörung beim Kontakt macht und wie ihre HP sinken, ist UNKNOWN. Die Beschwörungen sind in dieser Rechnung deshalb abgeschaltet (`DESIGN`).

---

## Vor Wave 1 – Platzierung

```text
Start                       2.500 ¥
Captain U0 platzieren        −300 → 2.200 ¥
C.E.O. U0 platzieren         −550 → 1.650 ¥
```

## Wave 1 – Spawn, Angriffe, Kills, Yen

**Spawn** (`DESIGN`): 3 Gegner, HP 60, Speed 4, alle 3 s (t = 0 / 3 / 6). Kill-Yen je `5 + 6 = 11`. Hits bis Kill: `ceil(60 / 31,892) = 2`.

| t (s) | Ereignis | Rechnung | Ziel-HP |
|---:|---|---|---:|
| 0,88 | e0 betritt die Captain-Range (s = 3,52); Captain → e0 | 60 − 31,89 | 28,11 |
| 3,88 | Captain → e0 (SPA 3) | 28,11 − 31,89 | **tot**, +11 ¥ → 1.661 |
| 6,88 | Captain → e1 (s = 15,52) | 60 − 31,89 | 28,11 |
| 9,88 | Captain → e1 | | **tot**, +11 ¥ → 1.672 |
| 12,88 | Captain → e2 (s = 27,52) | | 28,11 |
| 15,88 | Captain → e2 (s = 39,52) | | **tot**, +11 ¥ → 1.683 |
| 15,88 | **Wave-Ende**: Wave-Yen 300 + Farm 200 | 1.683 + 500 | **2.183 ¥**, Base 100 |

## Upgrade

```text
C.E.O. U1 (Farm 200 → 500 ¥/Wave)            −1.000 → 1.183 ¥    Grenz-ROI 1.000 / 300 = 3,33 Waves
Captain U1 (Damage 3 → 5,5; SPA 3 → 2,5)       −450 →   733 ¥
  DPS 31,892 / 3 = 10,63  →  58,469 / 2,5 = 23,39   ΔDPS = 12,76 für 450 ¥ = 28,4 DPS je 1.000 ¥
```
Upgrade-Kosten und Farm-Werte OBSERVED · HIGH · [S65]; Kennzahlen DERIVED (Formeln in [mathematics.md](mathematics.md#upgrade-efficiency--farm-roi)).

## Wave 2 – Schild-Gegner

**Spawn** (`DESIGN`): Start t = 20,88 (5 s Pause), 4 Gegner, HP 100, alle 3 s; **e1 und e3 tragen 1 Schild-Instanz** (wie die Challenge „Shield Enemies“, +1 Instanz [S72:Challenges]). Kill-Yen je 15. Hits bis Kill: `ceil(100 / 58,469) = 2`, mit Schild 3.

| t | Ereignis | Ziel-HP / Schild |
|---:|---|---:|
| 21,76 | Captain → e0 (s = 3,52) | 41,53 |
| 24,26 | Captain → e0 | **tot**, +15 → 748 |
| 26,76 | Captain → e1: **Schild −1, kein HP-Schaden** | 100 / Schild 0 |
| 29,26 / 31,76 | Captain → e1 ×2 | **tot**, +15 → 763 |
| 34,26 / 36,76 | Captain → e2 ×2 | **tot**, +15 → 778 |
| 39,26 | Captain → e3 (s = 37,52): **Schild −1** | 100 / 0 |
| 41,76 | Captain → e3 (s = 47,52) | 41,53 |
| 43,88 | e3 erreicht s = 56 → **Leak** (der Captain sah es nur bis s = 52,50) | Base **99** |
| 43,88 | **Wave-Ende**: 778 + Wave-Yen 400 + Farm 500 | **1.678 ¥** |

Der Schild kostet je Gegner einen ganzen Angriff (2,5 s). Ein Multi-Hit-Angriff oder Shatter hätte ihn nebenbei entfernt. Regel OBSERVED · HIGH · [S72:Enemy Mechanics, S76]

## Ability – Commander-Buff (Wave 3)

```text
Commander U0 platzieren                    −775 → 903 ¥
Ability bei Wave-Start t = 48,88 (Auto-Auslösung, belegt seit Update 13.5 [S72:Update Log])
Buff aktiv 48,88 … 78,88 (30 s), wieder bereit ab 108,88 (60 s Cooldown)     [S72:Commander]
```

**Spawn** (`DESIGN`): 5 Gegner, HP 140, alle 2,5 s. Kill-Yen je 19.

**Breakpoint:** Ohne Buff braucht der Captain `ceil(140 / 58,469) = 3` Hits (2 Hits = 116,9). Mit Buff reichen `ceil(140 / 73,086) = 2` Hits (146,2).

| t | Ereignis | Ziel-HP |
|---:|---|---:|
| 49,76 / 52,26 | Captain (gebufft) → e0 ×2 | **tot**, +19 → 922 |
| 54,76 / 57,26 | → e1 ×2 | **tot**, +19 → 941 |
| 59,76 / 62,26 | → e2 ×2 | **tot**, +19 → 960 |
| 64,76 / 67,26 | → e3 ×2 | **tot**, +19 → 979 |
| 69,76 | → e4 (s = 43,52) | 66,91 |
| 72,89 | e4 → **Leak** | Base **98** |
| 72,89 | **Wave-Ende**: 979 + 500 + 500 | **1.979 ¥** |

Gegenrechnung ohne Commander (gleiche Wave, Skript): 2 Kills, **3 Leaks** (Base 96). Der Buff spart hier 2 Leaks für 775 ¥. DERIVED

## Wave 4 – Boss mit Fiery Commander und Burn

```text
Fiery Commander U0 platzieren             −1.750 → 229 ¥
Spawn (DESIGN), Start t = 77,89:  m0 (t + 0) und m1 (t + 3) mit HP 140, Speed 4;  BOSS (t + 6 = 83,89) mit HP 9.000, Speed 2
Der Commander-Buff endet bei 78,88 und ist bis 108,88 im Cooldown → der Boss wird ohne Buff bekämpft.
```

| t | Ereignis | Rechnung | Ziel-HP |
|---:|---|---|---:|
| 78,77 | Captain → m0 (letzter gebuffter Hit) | 140 − 73,09 | 66,91 |
| 80,55 | **Fiery** → m0 (s = 10,64; Circle r = 7 trifft nur m0) | −2.301,02 | **tot**, +19 → 248 |
| 81,77 … 86,77 | Captain → m1 ×3 (ohne Buff wieder 3 Hits) | 3 × 58,47 | **tot**, +19 → 267 |
| 89,21 | **Fiery** → Boss (s = 10,64) | 9.000 − 2.301,02; Burn 5 × 138,06 ab 90,21 | 6.698,98 |
| 89,27 … 94,27 | Captain ×3, Burn ×5 | − 175,41 − 690,30 | 5.833,27 |
| 96,21 | **Fiery** → Boss (s = 24,64), neuer Burn | − 2.301,02 | 3.532,26 |
| 96,77 … 101,77 | Captain ×3, Burn ×5 | − 175,41 − 690,30 | 2.666,54 |
| 103,21 | **Fiery** → Boss (s = 38,64), neuer Burn | − 2.301,02 | 365,53 |
| 104,21 / 104,27 / 105,21 | Burn, Captain, Burn | − 138,06 − 58,47 − 138,06 | 30,94 |
| 106,21 | Burn-Tick | − 138,06 | **tot** bei s = 44,64, +100 → 367 |
| 106,21 | **Wave-Ende**: 367 + 600 + 500 | | **1.467 ¥**, Base 98 |

Kontrollsumme Boss: Fiery-Hits `3 × 2.301,02 = 6.903,05` (75,8 %), Burn `13 × 138,06 = 1.794,79` (19,7 %), Captain `7 × 58,47 = 409,28` (4,5 %); Summe 9.107,12 = 9.000 + 107,12 Overkill. DERIVED

Die Burns überlappen nicht: Fiery greift alle 7 s an, ein Burn dauert 5 Ticks. Ob ein zweiter Burn derselben Unit stapeln oder erneuern würde, ist UNKNOWN; hier tritt der Fall nicht ein.

### Variante: Commander-Cooldown laut Datenmodul

Das Unit-Modul nennt für die Active `attack_cooldown 40`, die Wiki-Seite **60 s** [S65 vs. S72:Commander]. Mit 40 s ist der Buff ab 88,88 wieder bereit und löst automatisch aus, 0,33 s bevor der Boss die Fiery-Range erreicht:

```text
Fiery-Hit gebufft  = 2.876,27,  Burn-Tick 172,58  (Buff erhöht auch den DoT [S72:Effects])
Boss tot bei t = 103,21 (dritter Fiery-Hit) statt 106,21 → 3 s früher, bei s = 38,64 statt 44,64
```
DERIVED. Der Konflikt 40 s / 60 s entscheidet also mit, ob ein Buff-Zyklus auf den Boss fällt (siehe [combat-system.md](combat-system.md#8-buffs-auf-units)).

## Immunitäten und Sonderregeln in dieser Runde

| Regel | Wirkung hier | Herkunft |
|---|---|---|
| Fiery Commander ist **Physical** (primär) + Fire | profitiert vom Physical-Buff des Commanders | OBSERVED · HIGH · [S65, S72:Commander] |
| Buff-Stapelung additiv, gleiche Effekte stapeln nicht | ein Commander → `1 + 0,25`; ein zweiter Commander-Buff gleicher Quelle käme nicht hinzu | VERIFIED · HIGH · [S72:Experiment buff, S72:Effects] |
| Burn hat keinen Immunitäts-Cooldown und stapelt zwischen Units | jeder Fiery-Hit setzt einen neuen Burn | OBSERVED · HIGH · [S72:Effects] |
| CC-Immunität (Stun 10–14 s, Freeze 10–13 s, Slow 4/7 s) | keine CC-Unit im Team, daher ohne Wirkung | OBSERVED · HIGH / MEDIUM · [S72:Effects, S67] |
| Fire-Gegner immun gegen Slow und Stun; Ice-Gegner ×3 gegen Fire/Burn | keine solchen Gegner in dieser Runde | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Ground-Units treffen keine Flying-Gegner | keine Flying-Gegner; Captain (Hill) und Commander (Hybrid) könnten sie treffen, Fiery Commander (Ground) nicht | OBSERVED · HIGH · [S72:Enemy Mechanics, S65] |
| Armored: Full-AoE ×0,5 | würde den Fiery Commander erst ab U3 (Full-AoE) treffen | OBSERVED · HIGH · [S72:Enemy Mechanics, S67] |

## Bilanz

| Wave | Kills / Leaks | Kill-Yen | Wave-Yen | Farm | Ausgaben danach | Yen am Ende | Base |
|---:|---|---:|---:|---:|---|---:|---:|
| Start | – | – | – | – | Captain 300, C.E.O. 550 | 1.650 | 100 |
| 1 | 3 / 0 | 33 | 300 | 200 | C.E.O. U1 1.000, Captain U1 450 | 2.183 → 733 | 100 |
| 2 | 3 / 1 | 45 | 400 | 500 | Commander 775 | 1.678 → 903 | 99 |
| 3 | 4 / 1 | 76 | 500 | 500 | Fiery Commander 1.750 | 1.979 → 229 | 98 |
| 4 | 3 / 0 | 138 | 600 | 500 | – | 1.467 | 98 |

Farm-Bilanz C.E.O.: investiert 1.550 ¥, eingenommen `200 + 3 × 500 = 1.700 ¥` nach 4 Waves. DERIVED

**Verkaufen** (Beispiel, falls umgebaut wird): Captain U1 bringt `0,25 × (300 + 450) = 187,5 ¥`, der Fiery Commander `0,25 × 1.750 = 437,5 ¥`. Regel 25 % OBSERVED · HIGH · [S72: Unit-Seiten]; Rundung UNKNOWN (`DESIGN`: abrunden → 187 / 437).

## Lehren für das Balancing

1. **Abdeckungszeit × DPS** ist die zentrale Kennzahl: `benötigte DPS ≈ Σ HP / Verweildauer in Range`. Der Captain hat 12,25 s pro Gegner; bei 2,5 s Spawn-Abstand reicht das für Ketten von höchstens 4–5 Zwei-Hit-Gegnern.
2. **Breakpoints:** Ein +25-%-Buff ändert hier `ceil(140/58,47) = 3` auf `ceil(140/73,09) = 2` Hits und spart 2 von 3 Leaks. Gegner-HP knapp über `k × Hit` machen Buffs besonders wertvoll.
3. **Schilde** kosten bei Single-Hit-Units je Instanz einen ganzen Angriff. Multi-Hit-Units teilen den Damage, verlieren also keinen Schaden, knacken aber Schilde nebenbei.
4. **Burn** liefert beim Boss knapp 20 % des Schadens (Burn 30 % des Hits, alle Hits treffen). Bosse mit 2 Studs/s bleiben länger in Range und nehmen mehr Ticks.
5. **Buff-Cooldowns** (30 s aktiv / 60 s Cooldown) passen nicht automatisch zum Boss-Timing. Auto-Auslösung kann den Buff an Trash-Waves „verschwenden“.
6. **Farm-Units** amortisieren sich in 3–4 Waves und finanzieren den Carry (hier den Fiery Commander in Wave 4).

## Korrekturen gegenüber Sitzung 1

| alt | neu | Grund |
|---|---|---|
| Fiery Commander profitiert als Fire-Unit **nicht** vom Physical-Buff | profitiert; Primärtyp ist **Physical**, Fire ist Sekundärtyp | Modul `damageType physical`, `secondaryDamageTypes [fire]` [S65] |
| Units auf Level 1 | Level 100 mit exaktem Faktor 9,20406501834430488 | Konstante belegt [S72:Experiment buff]; Zwischenlevel UNKNOWN |
| Ability nur hypothetisch | Commander real platziert, Buff 30 s / Cooldown 60 s durchgerechnet, Variante 40 s (Modul) | [S72:Commander, S65] |
| keine Schild-Mechanik | Schild-Gegner in Wave 2 | [S72:Enemy Mechanics] |
| Start-Yen 2.250 | 2.500 | beide `DESIGN` innerhalb der Default-Spanne; 2.500 erlaubt den Fiery Commander vor dem Boss |

Ein reproduzierbares Skript für solche Durchläufe gehört später in die Engine-Tests (Fixed-Timestep-Simulation, siehe [technical-reconstruction.md](technical-reconstruction.md#simulation-loop-kern)).
