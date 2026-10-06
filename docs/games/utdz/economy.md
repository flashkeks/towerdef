# UTDZ - Ökonomie (Priorität)

Format: `Wert [Herkunft/Sicherheit Quelle]`. Match-Währung heißt Yen (¥). Siehe [sources.md](sources.md).

## Ehrliche Lage

Das Wiki dokumentiert die Match-Ökonomie fast nicht. Folgende Werte sind `UNKNOWN` (je drei Versuche: Mechanics-Modul, Unit-Seiten, Beginners Guide, Websuche):

| Wert | Status |
|---|---|
| Startgeld je Modus/Schwierigkeit | `UNKNOWN` |
| Einkommen je Kill | `UNKNOWN` |
| Einkommen je Wave (passiv) | `UNKNOWN` |
| Passives Einkommen ohne Farm | `UNKNOWN` |
| Verkaufswert / Refund-Quote | `UNKNOWN`. Hinweis: Dragon Guy "verkauft sich selbst" nach Silverite (Halo-Relic verhindert das) [O/MEDIUM UTDZ-S9], d. h. Selling existiert |
| Geteiltes oder getrenntes Geld im Koop | `UNKNOWN` |
| Yen-Bonus durch Modi | Virtual Realm: Fortune-Arcana +10 % Geld aus allen Quellen je Tarot [O/HIGH UTDZ-S17] |

Ein Hinweis auf die Größenordnung: Bulmos Wunsch "Wealth" gibt +30.000 Yen einmalig pro Match [O/HIGH UTDZ-S7]; Top-Units kosten über Platzierung plus Upgrades 28.200 (Mythic Sasku) bis 42.000 Yen (Bulmo laut S7) [O/HIGH UTDZ-S4, UTDZ-S7]. Eine Gesamtlinie des Einkommens über 15 Waves lässt sich daraus nicht herleiten.

## Farm-Unit: Bulmo (Legendary)

Auszahlung zu Beginn jeder Wave (nicht pro Sekunde) [O/HIGH UTDZ-S7, UTDZ-S14]. Platzierungslimit 1. Tabelle nach universal-tdx-Datenmodul (Kosten kumuliert nach D = Summe):

| Stufe | Upgrade-Kosten ¥ | Auszahlung je Wave ¥ | Range | Grenzrendite (Wellen bis Amortisation) [D] |
|---|---|---|---|---|
| Platzierung | 500 | 1000 | 20 | 0,5 |
| 1 | 2000 | 1500 | 20 | 4,0 (2000 / +500) |
| 2 | 3000 | 3000 | 20 | 2,0 |
| 3 | 4000 | 4500 | 20 | 2,7 |
| 4 | 5500 | 6000 | 20 | 3,7 |
| 5 | 7000 | 7500 | 20 | 4,7 |
| 6 | 8500 | 9000 | 20 | 5,7 |
| 7 | 10000 | 10500 | 25 | 6,7 |

Quelle: [O/HIGH UTDZ-S14]. Gesamtkosten Platzierung + alle Upgrades 40.500 ¥ [D: 500+2000+3000+4000+5500+7000+8500+10000, passt zum Feld totalCost = 40500 in UTDZ-S14]. Gesamtamortisation bei Stufe 7: 40.500 / 10.500 = 3,9 Waves [D, ohne Boni].

Abweichung zweites Wiki (utdx.fandom): Platzierung 1500 ¥, Upgrades 2000/3000/3000/5500/7000/8500/10500, Auszahlung gleich, Range 31 (39 bei Stufe 7), totalCost 42000 angegeben, Summe der Zahlen jedoch 41.000 [O/LOW UTDZ-S7; Differenz D]. Vermutlich andere Version; nicht aufgelöst.

Zusatzmechaniken [O/HIGH UTDZ-S7]:
- Nach jedem Upgrade: nächste Auszahlung einmalig +15 % (nicht stapelbar).
- "Smart Investment": +1 Stack pro Auszahlung, max. 15 Stacks, +1 % Einkommen je Stack (also max. +15 %). E2: +2 Stacks pro Auszahlung; E4: Growing Technology gibt +1 Stack; E6: Stacks erhöhen auch die Auszahlung des "Growing Technology"-Bonus.
- "Emergency Capsule" (60 s CD): stunnt alle eigenen Units 5 s; nächste Auszahlung +5 % je gestunnter Unit, aber -100 % Geld für die Wave, wenn Units beim Wave-Start noch gestunnt sind [O/MEDIUM UTDZ-S14].
- Traits für Einkommen: Fortunate (1 %, "Farm Only") +20 % Einkommen; Ruler +20 % Einkommen [O/HIGH UTDZ-S13].
- Dragon-Ball-Wunsch: 5 % Chance pro Wave auf einen Wish Ball (+5 % je eigene Unit in Reichweite), 7 Bälle nötig [O/HIGH UTDZ-S7]. Erwartete Wartezeit grob: bei 5 % und z. B. 3 Units in Range (20 %) ca. 7 / 0,2 = 35 Waves [D, Näherung], also nur in langen Modi erreichbar.

Weitere Farm-Units: Die Unit-Daten kennen ein Flag `farm = true` (Bulmo) [O/HIGH UTDZ-S14]; weitere Farm-Units wurden nicht erfasst (`UNKNOWN`).

## Kostenkurve der Upgrades (Beispiele)

Alle Werte Yen. SPA in s. DPS (Basis, ohne Relics/Traits) = Angriff / SPA [D].

### Billig: Roku (Rare, Limit 5) [O/HIGH UTDZ-S5]

| Stufe | Kosten | Schaden | SPA | Range | DPS [D] |
|---|---|---|---|---|---|
| Platzierung | 400 | 13 | 5 | 15 | 2,6 |
| 1 | 250 | 20 | 5 | 15 | 4,0 |
| 2 | 600 | 28 | 5 | 15 | 5,6 |
| 3 | 1000 | 40 | 5 | 15 | 8,0 |
| 4 | 1300 | 49 | 5 | 17 | 9,8 |
| 5 | 1700 | 60 | 5 | 17 | 12,0 |

Summe 5.250 ¥ (passt zu `total_cost`). Kosten pro DPS bei Maximum: 5250 / 12 = 438 ¥ je DPS [D].

### Mittel: Legendary [O/MEDIUM UTDZ-S14]

| Unit | Platzierung | Upgrade-Kosten (1..n) | Summe | Schaden 0 -> max | SPA 0 -> max | DPS max [D] |
|---|---|---|---|---|---|---|
| Gen (4 Pl.) | 500 | 800, 1400, 1800, 2200, 2800 | 9.500 | 60 -> 200 | 8 -> 5 | 40 |
| Greybeard (3 Pl.) | 500 | 1000, 1550, 2000, 2700, 3000 | 10.750 | 70 -> 300 | 8 -> 6 | 50 |
| Pebble (4 Pl.) | 450 | 800, 1200, 1800, 2500, 4250 | 11.000 | 75 -> 380 | 6 -> 3,5 | 108,6 |
| Ruka (3 Pl.) | 500 | 1000, 1500, 2000, 2500, 5000 | 12.500 | 80 -> 400 | 7 -> 4,5 | 88,9 |
| Zorus (2 Pl.) | 600 | 1000, 1500, 2000, 2900, 5000 | 13.000 | 90 -> 450 | 7 -> 4,5 | 100 |
| Admiral (3 Pl.) | 700 | 1200, 1800, 2500, 3500, 5300 | 15.000 | 85 -> 450 | 7 -> 4,5 | 100 |
| Shakumira (4 Pl.) | 500 | 1200, 1850, 2200, 2600, 3000, 3500, 4000 | 18.850 | 100 -> 400 | 10 -> 6 | 66,7 |

Alle Summen stimmen mit `totalCost` überein [D]. Die letzte Stufe kostet oft 1,7 bis 2x die vorletzte (Pebble 2500 -> 4250, Ruka 2500 -> 5000).

### Teuer: Mythic Sasku (2 Pl.) [O/HIGH UTDZ-S4]

| Stufe | Kosten | Schaden | SPA | Range |
|---|---|---|---|---|
| Platzierung | 1400 | 125 | 7 | 15 |
| 1 | 2000 | 250 | 7 | 17 |
| 2 | 2700 | 400 | 7 | 17 |
| 3 | 3100 | 425 | 9 | 19 |
| 4 | 3900 | 475 | 9 | 19 |
| 5 | 4500 | 560 | 6 | 21 |
| 6 | 4800 | 650 | 6 | 21 |
| 7 | 5800 | 800 | 6 | 21 |

Summe 28.200 ¥ [D, passt zu `total_cost`]. Max-DPS 800/6 = 133 [D]. Die Wiki-Tabelle zeigt bei Stufe 3 und 4 SPA 9 (Rückschritt); ob Wiki-Fehler oder bewusst: `UNKNOWN`.

### Top / Synchro: Underworld God (Primordial)

Kein Upgradepfad: Platzierung = Endform, Schaden 7500 (seit 2.0 +50 % von 5000), Cooldown 10 s, Range 40, Line-AoE [O/HIGH UTDZ-S8, UTDZ-S9]. DPS 750 [D]. Platzierungskosten `UNKNOWN`.

## Beobachtungen für das eigene Design

- Gesamtkosten steigen mit Rarity: Rare ca. 5k, Legendary 9,5k bis 19k, Mythic ca. 28k, Farm-Legendary 40k [D aus obigen Tabellen].
- Schaden pro Upgrade wächst grob 4x bis 8x von Platzierung bis Maximum (Roku 4,6x; Greybeard 4,3x; Pebble 5,1x; Sasku 6,4x) [D].
- Relic-Upgrade-Kosten (Gold, Meta): siehe [meta.md](meta.md).
