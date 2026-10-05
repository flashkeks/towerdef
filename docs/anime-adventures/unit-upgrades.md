# Unit Upgrade System

## Grundprinzip

```text
Placement (Deployment Cost)
→ Upgrade 1 → Upgrade 2 → … → Final Upgrade   (meist 4–7 Stufen)
```

- Upgrades werden **im Match mit Yen** gekauft und gelten **pro platzierter Instanz**. VERIFIED · CONFIRMED · [S42]
- Ein Upgrade kann ändern: Damage, SPA, Range, AoE-Typ oder -Radius, Hits pro Angriff, Tower Type (z. B. wird eine Unit hybrid), neue Active Ability, neue Passive, Yen pro Wave (Farm), DoT-Werte. OBSERVED · HIGH · [S29, S33, S36, S39]
- Optische Änderungen bei Upgrades (Unit-Größe, Animation) sind **UNKNOWN** bzw. nicht dokumentiert.
- Verkauf gibt 25 % oder 30 % der bisher investierten Summe zurück ([core-mechanics.md](core-mechanics.md#verkaufen-sell)).

## Belegte Upgrade-Pfade

Siehe die vollständigen Tabellen in [units.md](units.md). Zusammenfassung:

| Unit | Stufen | Kostenfolge ¥ | Total ¥ | Total/Deploy | Tag |
|---|---:|---|---:|---:|---|
| Captain (Rare) | 4 | 300 → 450 → 650 → 1.500 → 2.500 | 5.400 | 18,0× | OBSERVED · HIGH |
| C.E.O. (Farm) | 4 | 550 → 1.000 → 1.750 → 2.500 → 3.000 | 8.800 | 16,0× | OBSERVED · HIGH / DERIVED (Total) |
| Bulby (Farm) | 6 | 800 → 1.500 → 3.000 → 4.500 → 7.500 → 10.000 → 12.500 | 39.800 | 49,8× | DERIVED aus kumulierter Tabelle |
| Commander | 6 | 775 → 1.000 → 1.500 → 2.000 → 4.000* → 5.500 → 7.000 | 21.775 | 28,1× | OBSERVED + DERIVED (*) |
| Black Assassin (Mythic) | 5 | 1.200 → ? | 18.900 | 15,8× | OBSERVED |
| Legendary Assassin (Mythic) | 7 | 1.250 → 1.500 → 2.700 → 4.000 → 7.000 → 10.000 → 12.000 → 17.000 | 55.450 | 44,4× | OBSERVED / DERIVED (Total) |
| Fiery Commander | ≥3 | 1.750 → 2.200 → 2.500 → 4.000 → ? | ≥10.450 | – | OBSERVED |
| Wind Dragon (Legendary) | ≥3 | 800 → 1.200 → 1.750 → 2.500 → ? | ≥6.250 | – | OBSERVED |
| Honey (Mythic) | ≥4 | 1.000 → 1.250 → 2.000 → 3.000 → 4.500 | ≥11.750 | – | OBSERVED |

**Beobachtete Muster** (RECONSTRUCTED · MEDIUM):
1. Der Kostenzuwachs pro Stufe liegt meist zwischen ×1,1 und ×2,3, mit großen Sprüngen an „Power-Spikes“ wie neuer Ability oder neuem AoE.
2. Total/Deploy liegt bei Rare- und Low-End-Units um 15–20×, bei Mythic-Carries und Farm-Endstufen bei 30–50×.
3. Die SPA sinkt bei Rare-Units stark (Captain 3 → 1,5, also −50 %) und bei Mythics moderat (Black Assassin 7 → 6).
4. Range steigt um +20 bis +40 % (Captain 25 → 35, Black Assassin 17 → 22).
5. Der Damage-Anstieg ist groß: Black Assassin 600 → 4.500 (7,5×), Fiery Commander 250 → 1.300 nach 3 Upgrades (5,2×).

## Effizienz-Kennzahlen

Definitionen (DERIVED · CONFIRMED als Formeln):

```text
DPS            = Damage × Hits / SPA                (Single Target, ohne DoT/Crit)
DPS_eff        = DPS × (1 + critChance × (critMult − 1)) + DoT/SPA
Damage/Cost    = Damage / kumulierte Kosten
DPS/Cost       = DPS / kumulierte Kosten
Range/Cost     = Range / kumulierte Kosten
Upgrade-Eff.   = ΔDPS / Upgrade-Kosten                (Grenz-DPS pro ¥)
```

### Berechnete Werte (Min-Spalte der Wiki-Werte, Level 1)

| Unit, Stufe | kum. ¥ | Damage | SPA | Hits | DPS | DPS/1000 ¥ | Tag |
|---|---:|---:|---:|---:|---:|---:|---|
| Captain Placement | 300 | 3 | 3 | 1 | 1,0 | 3,33 | DERIVED |
| Captain U4 | 5.400 | 8,5 | 1,5 | 1 (AoE r=4) | 5,67 pro Ziel | 1,05 | DERIVED |
| Honey Placement | 1.000 | 150 | 1 | 1 | 150 | 150 | DERIVED |
| Legendary Assassin Placement | 1.250 | 950 | 7 | 1? | 135,7 | 108,6 | DERIVED (Hits UNKNOWN) |
| Black Assassin final | 18.900 | 4.500 | 6 | 2 | 1.500 pro Ziel | 79,4 | DERIVED |
| Fiery Commander Placement | 1.750 | 250 (+75 Burn) | 7 | 1 | 35,7 (+10,7) | 20,4 (+6,1) | DERIVED |
| Fiery Commander U1 | 3.950 | 400 (+120) | 6 | 1 | 66,7 (+20) | 16,9 (+5,1) | DERIVED |
| Fiery Commander U2 | 6.450 | 600 (+180) | 5,5 | 1 | 109,1 (+32,7) | 16,9 (+5,1) | DERIVED |
| Eccentric Researcher (Captain) L1 | 1.500 | 390 (+117) | 7 | 1, 50 % Crit ×1,5 | 55,7 → eff. 69,6 (+16,7) | 37,1 → 46,4 | DERIVED |

> AoE-Units sind nur pro Ziel verglichen. Ihr effektiver Wert ist `DPS × durchschnittlich getroffene Gegner`, was von Map und Wave abhängt.

### Grenz-Effizienz (Upgrade Efficiency)

| Unit | Schritt | ΔDPS | Kosten | ΔDPS/1000 ¥ |
|---|---|---:|---:|---:|
| Fiery Commander | Placement → U1 | +31,0 | 2.200 | 14,1 |
| Fiery Commander | U1 → U2 | +42,4 | 2.500 | 17,0 |
| Captain | Placement → U4 (gesamt) | +4,67 pro Ziel | 5.100 | 0,92 (+ AoE) |

DERIVED · MEDIUM (Min-Werte, Level 1)

## Farm-ROI

ROI = Waves bis zur Amortisation des **Grenz-Upgrades**: `ROI_k = cost_k / (income_k − income_{k−1})`.

### Bulby [S37] (OBSERVED · HIGH; nachgerechnet DERIVED)

| Stufe | Upgrade-Kosten | kumuliert | Yen/Wave | ROI (Grenz) | ROI Golden (×1,2 Income) |
|---|---:|---:|---:|---:|---:|
| 0 | 800 | 800 | 250 | 3,20 | 2,67 |
| 1 | 1.500 | 2.300 | 750 | 3,00 | 2,50 |
| 2 | 3.000 | 5.300 | 1.500 | 4,00 | 3,33 |
| 3 | 4.500 | 9.800 | 3.000 | 3,00 | 2,50 |
| 4 | 7.500 | 17.300 | 5.000 | 3,75 | 3,13 |
| 5 | 10.000 | 27.300 | 8.000 | 3,33 | 2,78 |
| 6 | 12.500 | 39.800 | 10.000 | 6,25 | 5,21 |

Die Wiki-Werte werden durch die Formel exakt reproduziert, und Golden wirkt als **×1,2 auf das Einkommen**. DERIVED · CONFIRMED

### C.E.O. [S28] (DERIVED)

| Stufe | Kosten | kumuliert | Yen/Wave | ROI (Grenz) | ROI kumuliert |
|---|---:|---:|---:|---:|---:|
| 0 | 550 | 550 | 200 | 2,75 | 2,75 |
| 1 | 1.000 | 1.550 | 500 | 3,33 | 3,10 |
| 2 | 1.750 | 3.300 | 1.000 | 3,50 | 3,30 |
| 3 | 2.500 | 5.800 | 1.750 | 3,33 | 3,31 |
| 4 | 3.000 | 8.800 | 2.500 | 4,00 | 3,52 |

**Design-Erkenntnis:** Farm-Units in AA amortisieren sich pro Stufe in **~3–4 Waves**. Die letzte Stufe ist bewusst ineffizienter (Bulby 6,25 Waves). Sell-Verluste (70–75 %) bestrafen spätes Umbauen.

## Fehlende Daten (siehe [unknowns.md](unknowns.md))

- Vollständige Stat-Tabellen pro Upgrade für fast alle Units
- Visuelle Änderungen pro Upgrade
- Ob Upgrades die Potential-Rolls (Stat-%) oder den Level-Multiplikator unterschiedlich behandeln
