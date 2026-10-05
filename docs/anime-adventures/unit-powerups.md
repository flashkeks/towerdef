# Unit Powerups – Randomisierte Stats, Level, Limit Break, Curses, Relics

## 1. Randomisierte Basis-Stats („Potential“)

Identische Units können unterschiedliche Werte haben. Jede Unit-Instanz besitzt einen eigenen **Prozent-Roll** für Damage, SPA und Range.

| Aspekt | Wert | Tag |
|---|---|---|
| Varianz | „ca. ±10 %“ (Wiki-Kurzbeschreibung auf Unit-Seiten); die Rangtabelle zeigt eine Damage-Spanne von **−10 % bis ≥ +20 %** | OBSERVED · HIGH · [S11, S31] |
| Evolution | Evolution **rollt die Stats neu**, das Ergebnis ist aber immer **strikt besser** als die Vorform | OBSERVED · HIGH · [S11, S31] |
| Reroll-NPC | **Cosmic Cat** (Traits/Evolve-Bereich), Menüpunkt „Reroll Potential“ | OBSERVED · HIGH · [S48] |
| Stat Cube | rerollt **alle** drei Stats | OBSERVED · HIGH · [S48] |
| Perfect Stat Cube | rerollt **einen gewählten** Stat | OBSERVED · HIGH · [S48] |
| Quellen der Cubes | Daily Challenge: 2–3 Stat Cubes plus Chance auf 1 Perfect Stat Cube | OBSERVED · HIGH · [S15] |

### Rangtabelle [S11] (OBSERVED · HIGH für Damage; SPA und Range nur Endpunkte belegt)

| Rang | Damage | SPA (negativ = besser) | Range |
|---|---|---|---|
| SSS | ≥ +20 % | ≤ −10 % | ≥ +10 % |
| SS | +19,2 … +19,9 % | UNKNOWN | UNKNOWN |
| S+ | +18,5 … +19,1 % | UNKNOWN | UNKNOWN |
| S | +17,8 … +18,4 % | UNKNOWN | UNKNOWN |
| S- | +17,0 … +17,7 % | UNKNOWN | UNKNOWN |
| A+ | +14,8 … +16,9 % | UNKNOWN | UNKNOWN |
| A | +12,5 … +14,7 % | UNKNOWN | UNKNOWN |
| A- | +10,0 … +12,4 % | UNKNOWN | UNKNOWN |
| B+ | +6,5 … +9,9 % | UNKNOWN | UNKNOWN |
| B | +3,0 … +6,4 % | UNKNOWN | UNKNOWN |
| B- | 0,0 … +2,9 % | UNKNOWN | UNKNOWN |
| C+ | −3,0 … −0,1 % | UNKNOWN | UNKNOWN |
| C | −6,5 … −3,1 % | UNKNOWN | UNKNOWN |
| C- | −10,0 … −6,6 % | +5,1 … +10,0 % | −10,0 … −5,1 % |

**Rekonstruktion für SPA und Range** (RECONSTRUCTED · MEDIUM): Die Endpunkte (SSS ±10 %, C- ±10 %) sprechen dafür, dass SPA und Range auf einer **halb so großen Positiv-Skala** laufen (−10 % … +10 % statt −10 % … +20 %). Eine lineare Abbildung `x_range = x_dmg × 0,5` für positive Werte wäre die einfachste Annahme; im negativen Bereich wäre sie 1:1. Das ist nicht belegt.

Rundung: 19,96 % gilt als SS, 20,02 % als SSS. Die Grenzen sind also hart und arbeiten mit ungerundeten Werten. OBSERVED · HIGH · [S11]

### Worthiness

| Aspekt | Wert | Tag |
|---|---|---|
| Aufbau | **+1 % pro 100 Takedowns** (Kills) der Unit; 100 % = 10.000 Kills | OBSERVED · HIGH · [S48] |
| Maximum | 400 %; pro Reroll werden **max. 100 %** verbraucht | OBSERVED · HIGH · [S48] |
| Wirkung | Bei 100 % Worthiness sind beim Reroll **alle Stats mindestens B+** | OBSERVED · MEDIUM · [S48] |
| Verteilung bei < 100 % | **UNKNOWN** | UNKNOWN |

**Rekonstruiertes Modell** (RECONSTRUCTED · LOW): Worthiness `w ∈ [0,1]` hebt die Untergrenze der Roll-Verteilung an. Bei `w = 1` liegt die Untergrenze bei +6,5 % (B+-Start) für Damage.

```text
lower(w) = lerp(−10%, +6.5%, w)
roll     = uniform(lower(w), +20%)    // Verteilungsform UNKNOWN (gleichverteilt angenommen)
```
Kalibrierung offen. Gleichverteilung ist nicht belegt; die Community-Erfahrung „SSS ist sehr selten“ spricht für eine **schiefe** Verteilung.

## 2. Unit-Level und XP

| Aspekt | Wert | Tag |
|---|---|---|
| Level-Cap-Historie | 70 (U2) → 80 (U3) → 90 (U4) → 100 (U5) | OBSERVED · HIGH · [S45] |
| Limit Break | +10 Max-Level pro Limit Break, aktuell bis **110** | OBSERVED · HIGH · [S11] |
| Damage-Skalierung | Level 100 ≈ **9,204×** Level 1 | VERIFIED · CONFIRMED · [S04, S35] |
| Andere Stats | Range und SPA ändern sich **nicht** mit dem Level (ER: Range 20, SPA 7 bei Level 1 und Level 100) | OBSERVED · HIGH · [S35] |
| XP-Quellen | Matches, **XP-Food** (max. 1.000 pro Food-Typ im Inventar), Adept-Trait +50 % | OBSERVED · HIGH · [S21, S47] |
| XP-Kurve | **UNKNOWN** | UNKNOWN |

**Level-Kurve – Kandidaten** (DERIVED aus 9,204 bei L=100; die echte Kurve ist **UNKNOWN**):

| Modell | Formel | L=50 | L=110 |
|---|---|---:|---:|
| linear | `1 + 0,08287·(L−1)` | 5,06 | 10,03 |
| exponentiell | `1,022674^(L−1)` | 3,00 | 11,51 |

Für den Nachbau ist eine Kurve zu wählen (`DESIGN`) und dabei der Ankerpunkt L100 = 9,204× einzuhalten.

## 3. Limit Break

| Aspekt | Wert | Tag |
|---|---|---|
| Effekt | Max-Level +10 (bis 110) | OBSERVED · HIGH · [S11] |
| Kosten | **1 Divine Wish** plus **12 unevolvierte Mythic/Secret-Units** (evolvierte zählen doppelt, also 6) | OBSERVED · HIGH · [S48] |
| Divine-Wish-Quellen | Level-Milestone 100, Daily Challenges | OBSERVED · HIGH · [S24] |
| Weitere Effekte | Ein Forum-Post erwähnt einen „permanenten 15-%-Buff“ (Kontext Farm) | OBSERVED · LOW · [S59] |

## 4. Curses

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 6.5 | OBSERVED · HIGH · [S18] |
| Effekt | Zufällig **ein Stat +2,5 … +13 %**, **ein anderer −2,5 … −13 %** | OBSERVED · HIGH · [S18] |
| Stats | Damage, SPA, Range | OBSERVED · HIGH |
| Kosten | Mind. 1 **Cursed Token** (Dungeon Cursed Womb, Battle Pass) bzw. Cursed Finger | OBSERVED · HIGH · [S18, S56, S63] |
| Entfernen | **nicht möglich** | OBSERVED · HIGH · [S18] |
| Darstellung | „Rote“ Curses = negativ. Ein **roter SPA-Curse** verlängert den Ability-Cooldown von Buffern, was beim Buff-Loop nützlich ist | OBSERVED · HIGH · [S44] |
| Verteilung von Betrag und Stat-Paar | **UNKNOWN** | UNKNOWN |

## 5. Relics

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 7, zusammen mit den Damage Types | OBSERVED · HIGH · [S17] |
| Stat-Typen | **%DMG** (Schaden eines bestimmten Typs +%), **PEN** (durchdringt Gegner-Resistenz), **PWR** (DPS/Upgrade, skaliert mit Unit-Level), Crit Chance, Crit Damage | OBSERVED · HIGH · [S17, S13] |
| Beispiel | Nail: +10–20 % Physical Crit Chance, +15–30 % Crit Damage (zufällige Rolls) | OBSERVED · MEDIUM · [S13] |
| Crafting | z. B. Endless Blades = 10 Relic Shards + 10.000 Gold; auch Mangekyō Eye, Mirrorblade | OBSERVED · HIGH · [S17] |
| Relic Shards | Raid Sacred Planet Stage 4 (10 %), Stage 5 (100 %) | OBSERVED · HIGH · [S17] |
| Slots pro Unit | **UNKNOWN** (vermutlich 1) | UNKNOWN |
| Trading | Nur **Limited** Relics handelbar | OBSERVED · HIGH · [S19] |

## 6. Skins

- Seit Update 5. Rein kosmetisch und handelbar. Trade-Tax nach Rarität: 50, 100, 200 bzw. 2.000 Gems. OBSERVED · HIGH · [S19, S45]
- Event-Banner im RR enthalten Mythic-Skins (0,249 %). OBSERVED · MEDIUM · [S43]

## 7. Stat-Stack einer Unit-Instanz (Gesamtbild)

```text
EffectiveStat(unit, upgrade) =
    UpgradeTable[upgrade].stat
  × LevelCurve(level)                 // nur Damage (und PWR-Relics)
  × (1 + potential[stat])             // −10% … +20% (Damage)
  × (1 + curse[stat])                 // ±2.5 … 13%
  × (1 + trait[stat])
  × (1 + relic[stat])
  × (1 + liveBuffs[stat])             // im Match
```
RECONSTRUCTED · LOW (Struktur plausibel, Additivität und Reihenfolge UNKNOWN)
