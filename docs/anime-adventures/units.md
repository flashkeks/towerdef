# Units – Datenbank

**Stand: Sitzung 2.** Die Unit-Datenbank ist jetzt **vollständig**:

- 561 Einträge (550 Units und 11 Beschwörungen), jeweils mit allen Upgrade-Stufen, Angriffsform, DoT- und Spezialeffekten sowie Evolution-Rezept
- Quelle: das Lua-Datenmodul des Fandom-Wikis im Format der Spielkonfiguration (S65, RR-Stand 2026-03-18)
- Legacy-Endstand vom 2023-12-14 (S66) zum Vergleich

| Datei | Inhalt |
|---|---|
| [data/units.json](data/units.json) | maschinenlesbare Gesamtdatenbank (Units, Angriffe, Effekte) |
| [units-index.md](units-index.md) | Tabelle aller 561 Einträge mit Legacy-/RR-Namen, Kosten, DPS, AoE und Evolution |
| diese Datei | Systematik, Statistik, Kurvenformen, Beispiel-Datenblätter, Legacy↔RR-Unterschiede |

Die Werte gelten als `OBSERVED · HIGH`: Datamine-Format, gepflegt von Wiki-Admins, nicht offiziell. Alle DPS-, Kosten- und Verhältniswerte sind `DERIVED`. Die Namen sind fremde IP und dienen nur der Zuordnung.

## Datenfelder einer Unit (aus S65)

| Feld (Modul) | Bedeutung | Abdeckung | Tag |
|---|---|---|---|
| `cost` | Platzierungskosten in Yen | 553/561 | OBSERVED · HIGH |
| `damage`, `attack_cooldown`, `range` | Basiswerte; `attack_cooldown` = **SPA** | 556–561 | OBSERVED · HIGH |
| `upgrade[]` | pro Stufe `cost` (Kosten **dieser** Stufe), `damage`, `attack_cooldown`, `range`, optional `primary_attack` (neuer Angriff), `note`, `farm_amount`, `active_attack(_stats)` | 550 | OBSERVED · HIGH |
| `primary_attack_no_upgrades` / `primary_attack` | ID des Angriffs → Form, Radius/Winkel/Breite, Hits, DoT, Spezialeffekt (S67) | 1.005 von 1.006 IDs aufgelöst | OBSERVED · HIGH |
| `spawn_cap` | max. gleichzeitig platzierte Exemplare dieser Unit. Bei Buffern als „6 (Global)“, d. h. teamweit | 534 | OBSERVED · HIGH |
| `hill_unit` / `hybrid_placement` | Platzierung **hill** bzw. **hybrid**, sonst **ground** | 561 | OBSERVED · HIGH |
| `_base_damage_type`, `_secondary_damage_types` | Primär: `physical`, `magic`, `true_damage`. Sekundär-Elemente: dark, fire, lightning, ice, air, light, water, rose | 557 | OBSERVED · HIGH |
| `crit_chance`, `crit_damage` | z. B. 0,5 / 1,5. Nur 34 Units haben Crit | 34 | OBSERVED · HIGH |
| `farm_amount` | Yen pro Wave (Farm-Units) | 3 Units | OBSERVED · HIGH |
| `aura_buff` | passive Aura, z. B. `damage_add: 0.1` (+10 %), `crit_add: 0.5`, `_global` | 3 | OBSERVED · HIGH |
| `active_attack`, `active_attack_stats` | aktive Fähigkeit mit `attack_cooldown` (z. B. 40–90 s) und `attack_duration` | 17 | OBSERVED · HIGH |
| `evolve` | Evolution: Ziel-ID, Items, Unit-Kopien, `_takedown_requirement`, Text (z. B. „+40% Attack“) | 222 | OBSERVED · HIGH |
| `limited`, `hide_from_banner`, `_rateup_banner_only`, `special_note` | Erhältlichkeit | – | OBSERVED · HIGH |
| `unsellable` | nicht verkaufbar | 9 | OBSERVED · HIGH |
| `health`, `speed` | Körperwerte von Units mit Lauf- bzw. Beschwörungslogik (meist 100/2.000 HP, Speed 15) | 174 | OBSERVED; Bedeutung je Unit UNKNOWN |
| `cooldown` | bei 384 Units = 10; Bedeutung **UNKNOWN** | 386 | UNKNOWN |
| `knockback_points` | fast immer `[0.5]`; Bedeutung **UNKNOWN** (vermutlich Zeitpunkt im Animationszyklus) | 387 | UNKNOWN |

Regeln, die sich aus den Daten ergeben:

- **Fehlende Werte erben.** Fehlt in einer Upgrade-Stufe `damage`, `spa` oder `range`, gilt der Vorwert. So stellt auch die Wiki-Infobox die Daten dar. RECONSTRUCTED · HIGH [S76]
- **Hits teilen den Damage.** „Damage stated by the unit itself will be divided by the number of hits“. Mehr Hits erhöhen also nicht den Damage, entfernen aber pro Treffer eine Schild-Instanz. OBSERVED · HIGH [S76]
- **Verkauf:** „Units sell for 25% of their deployment cost and upgrades“ steht auf 509 von 510 Unit-Seiten. Einzige Abweichung ist `C.E.O.` mit 30 %. Die Regel ist damit global 25 %; die C.E.O.-Angabe ist sehr wahrscheinlich ein Seitenfehler (siehe [unknowns.md](unknowns.md#g-korrekturen-am-bestand)). OBSERVED · HIGH [S72]
- **Stat-Varianz:** „stats like damage are randomly rolled with about a 10% variance … When you evolve a unit they also reroll their stats, but it will always be strictly better than the pre-evolved version.“ OBSERVED · HIGH [S72: Template Main Stats]

### Wiki-Darstellung „Level 100“ und Buff-Overlays (klärt eine offene Frage aus Sitzung 1)

Die Wiki-Infobox (Template `Stats Box`) zeigt neben den Basiswerten umschaltbare Varianten. Die in Sitzung 1 beobachteten Spannen „Damage ×2,1, Range ×1,2, SPA ×0,9“ sind **keine Stat-Rolls**, sondern diese Buff-Overlays (VERIFIED aus dem Template-Quelltext, Confidence HIGH):

| Overlay | Wirkung im Template | Spiel-Mechanik dahinter |
|---|---|---|
| Level 100 | Damage × **9,20406501834430488** (auch DoT und Beschwörungs-HP) | Unit-Level-Skalierung L1 → L100 |
| „Sasageyo“ | Damage × 2 | „Dedicate Your Hearts“ (Physical, Commander-Typ) bzw. „Sky Enchantment“ (Magic): +100 % |
| „Sakura“ | Damage × 1,1 | Aura `damage_add: 0.1` |
| beide | Damage × **2,1** | **additive** Stapelung: 1 + 1,0 + 0,1 |
| „Kisoko“ | Range × 1,2, SPA × 0,9 | Range +20 %, SPA −10 % |

## Raritäten und Statistik

| Rarität | Anzahl (davon Evo-Formen) | Platzierung ¥ min / Median / max | Σ¥ bis Max (Median) | Upgrades (häufigste) | Spawn Cap (häufigste) | DPS max (Median) | ground / hill / hybrid |
|---|---|---|---:|---|---|---:|---|
| Rare | 20 (0) | 250 / 400 / 600 | 6 025 | 5×11, 4×8, 3×1 | 6×11, 5×5, 3×1 | 9.09 | 16 / 3 / 1 |
| Epic | 19 (0) | 500 / 525 / 575 | 10 425 | 5×11, 6×5, 4×2 | 5×10, 6×3, 3×2 | 25.36 | 15 / 4 / 0 |
| Legendary | 35 (1) | 525 / 850 / 1 350 | 25 650 | 7×15, 6×9, 8×7 | 5×14, 4×8, 6×2 | 88.89 | 26 / 7 / 2 |
| Mythic | 381 (186) | 1 000 / 1 350 / 112 150 | 50 500 | 8×118, 9×91, 7×58 | 4×189, 3×138, 5×39 | 833.33 | 308 / 53 / 20 |
| Secret | 73 (37) | 850 / 1 600 / 25 000 | 59 000 | 9×17, 8×16, 6×13 | 3×48, 4×12, 1×7 | 1 181.25 | 66 / 1 / 6 |
| Exclusive | 22 (0) | 1 000 / 1 250 / 2 000 | 41 525 | 8×14, 7×4, 6×3 | 5×12, 4×7, 3×3 | 854.17 | 19 / 3 / 0 |

Spalten: Platzierungskosten, Gesamtkosten aller Stufen, Anzahl Upgrades, Spawn Cap, DPS auf der Max-Stufe (Damage/SPA, ohne AoE/DoT/Hits). DERIVED aus S65.

**Kurvenformen** (Median über Basis-Units mit mindestens 3 Upgrades, DERIVED):

| Rarität | Σ Kosten / Platzierung | Damage max/base | SPA max/base | Range max/base | DPS max/base |
|---|---:|---:|---:|---:|---:|
| Rare | 16,5 | 6,0 | 0,83 | 1,33 | 7,0 |
| Epic | 20,2 | 8,0 | 0,80 | 1,56 | 10,0 |
| Legendary | 31,7 | 11,4 | 0,79 | 1,67 | 14,1 |
| Mythic | 26,8 | 12,6 | 0,92 | 1,45 | 13,7 |
| Secret | 25,9 | 11,7 | 0,89 | 1,40 | 12,8 |
| Exclusive | 32,5 | 13,3 | 1,07 | 1,73 | 13,7 |

Folgerung für unser Balancing: Die Upgrades kosten insgesamt das 16- bis 33-Fache der Platzierung und vervielfachen die DPS um den Faktor 7–14. Die Steigerung kommt fast ausschließlich über den Damage; SPA sinkt um höchstens 20 %. Range wächst um 33–73 %. Upgrades mit neuem Angriff (`note` „+ …“) wechseln oft die AoE-Form und **erhöhen** dabei häufig die SPA, siehe etwa Fiery Commander Stufe 3: SPA 5,5 → 15.

**Evolution:** Die Basiswerte steigen um +10 % bis +150 %. Häufigste Faktoren sind ×1,30 (50 Fälle), ×1,50 (41), ×1,40 (39), ×1,35 (29) und ×1,25 (14). Takedown-Anforderung meist 7.500 oder 5.000. Details in [evolution.md](evolution.md).

**Crit:** 34 Units haben Crit, meist 50 % Chance (25 Units). `crit_damage` ist nur 4-mal gesetzt (1,5 / 1,85 / 2,0); sonst gilt der Standard-Multiplikator (siehe [combat-system.md](combat-system.md)).

**True Damage:** 6 Units, z. B. Captain (Timeskip/God), Sorcerer Killer, Umbra.

## Unit-Rollen (aus Datenfeldern abgeleitet)

| Rolle | Erkennungsmerkmal im Datensatz | Beispiele (RR-Name) |
|---|---|---|
| DPS Single | Angriff `single`, hoher Damage | Honey (Hive) |
| DPS AoE | `circle` (691 Angriffe), `cone` (145), `line` (98), `full` (78) | Legendary Assassin (Cone), Vengeful Swordsman |
| DoT | Angriff mit `Effect` Burn/Bleed/Poison/Wither | Fiery Commander (Burn 6 %×5) |
| Farm | `farm_amount`, damage 0 | C.E.O., Bulby |
| Buffer | `spawn_cap "6 (Global)"`, damage 0 bzw. gering, SPA 10–15 | Commander, Wind Dragon |
| Aura | `aura_buff` | Blossom (Legacy: Sakuro, +10 % Damage), Gambler (Jackpot) (+50 % Crit-Chance) |
| Summoner | `spawn_unit`, `max_spawn_units`, Beschwörungen ohne Rarität | Attack-Titan-Typen, Lucy-Schlüssel (Taurus, Leo, Aquarius) |
| Utility/CC | Spezialeffekt Slow/Stun/Freeze/Timestop/Knockback/Confused | Snow Reaper, Siren |

## Beispiel-Datenblätter

Auswahl von 13 Units. Alle übrigen stehen in [units-index.md](units-index.md) und vollständig in [data/units.json](data/units.json).

### Captain (Legacy: Usoap)

`usopp` · Rare · hill · Damage-Typ physical + air · Spawn Cap 6 · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 300 | 300 | 3 | 3 | 25 | 1 | single |  |
| 1 | 450 | 750 | 5.5 | 2.5 | 25 | 2.2 | single |  |
| 2 | 650 | 1 400 | 7 | 2 | 27 | 3.5 | single |  |
| 3 | 1 500 | 2 900 | 7 | 2 | 30 | 3.5 | circle r=4 | + Bamboo Shot |
| 4 | 2 500 | 5 400 | 8.5 | 1.5 | 35 | 5.67 | circle r=4 |  |

### C.E.O. (Legacy: Speedcart)

`speedwagon` · Epic · ground · Damage-Typ physical · Spawn Cap 3 · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 550 | 550 | 0 | 0 | 10 | – | ? | Farm 200 ¥/Wave |
| 1 | 1 000 | 1 550 | 0 | 0 | 10 | – | ? | Farm 500 ¥/Wave |
| 2 | 1 750 | 3 300 | 0 | 0 | 10 | – | ? | Farm 1 000 ¥/Wave |
| 3 | 2 500 | 5 800 | 0 | 0 | 10 | – | ? | Farm 1 750 ¥/Wave |
| 4 | 3 000 | 8 800 | 0 | 0 | 10 | – | ? | Farm 2 500 ¥/Wave |

### Bulby (Legacy: Bulmy)

`bulma` · Legendary · ground · Damage-Typ None · Spawn Cap 1 · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 800 | 800 | 0 | 0 | 5 | – | ? | Farm 250 ¥/Wave |
| 1 | 1 500 | 2 300 | 0 | 0 | 5 | – | ? | Farm 750 ¥/Wave |
| 2 | 3 000 | 5 300 | 0 | 0 | 5 | – | ? | Farm 1 500 ¥/Wave |
| 3 | 4 500 | 9 800 | 0 | 0 | 5 | – | ? | Farm 3 000 ¥/Wave |
| 4 | 7 500 | 17 300 | 0 | 0 | 5 | – | ? | Farm 5 000 ¥/Wave |
| 5 | 10 000 | 27 300 | 0 | 0 | 5 | – | ? | Farm 8 000 ¥/Wave |
| 6 | 12 500 | 39 800 | 0 | 0 | 5 | – | ? | Farm 10 000 ¥/Wave |

### Commander (Legacy: Orwin)

`erwin` · Legendary · hybrid · Damage-Typ physical · Spawn Cap 6 (global) · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 775 | 775 | 0 | 15 | 15 | 0 | single |  |
| 1 | 1 000 | 1 775 | 0 | 14 | 15 | 0 | single |  |
| 2 | 1 500 | 3 275 | 0 | 14 | 15 | 0 | single |  |
| 3 | 2 000 | 5 275 | 0 | 13 | 15 | 0 | single |  |
| 4 | 4 000 | 9 275 | 0 | 12 | 15 | 0 | single |  |
| 5 | 5 500 | 14 775 | 0 | 11 | 15 | 0 | single |  |
| 6 | 7 000 | 21 775 | 0 | 10 | 15 | 0 | single |  |

### Wind Dragon (Legacy: Wenda)

`wendy` · Legendary · hybrid · Damage-Typ magic + air · Spawn Cap 6 (global) · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 800 | 800 | 200 | 15 | 15 | 13.33 | circle r=5 |  |
| 1 | 1 200 | 2 000 | 400 | 14 | 15 | 28.57 | circle r=5 |  |
| 2 | 1 750 | 3 750 | 700 | 14 | 15 | 50 | circle r=5 |  |
| 3 | 2 500 | 6 250 | 1 000 | 13 | 15 | 76.92 | circle r=5 |  |
| 4 | 4 000 | 10 250 | 1 000 | 12 | 15 | 83.33 | line b=6 | + Sky Dragon's Roar |
| 5 | 6 000 | 16 250 | 1 800 | 11 | 15 | 163.64 | line b=6 |  |
| 6 | 8 000 | 24 250 | 2 500 | 10 | 15 | 250 | line b=6 |  |

### Honey

`honey` · Mythic · hill · Damage-Typ physical + light · Spawn Cap 5 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 000 | 1 000 | 150 | 1 | 24 | 150 | single |  |
| 1 | 1 250 | 2 250 | 250 | 1 | 25 | 250 | single |  |
| 2 | 2 000 | 4 250 | 450 | 1 | 26 | 450 | single |  |
| 3 | 3 000 | 7 250 | 600 | 1 | 27 | 600 | single | + Hivemind |
| 4 | 4 500 | 11 750 | 1 000 | 1 | 26 | 1 000 | single |  |

Evolution → `honey_evo`: +35% Attack, +Nectar Nova. Material: StarFruit ×10, StarFruitBlue ×5, StarFruitRed ×5, StarFruitPink ×5, StarFruitGreen ×5, StarFruitEpic ×1; Takedowns 100.

### Honey (Hive)

`honey_evo` · Mythic · hill · Damage-Typ physical + light · Spawn Cap 5 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 000 | 1 000 | 202.5 | 1 | 24 | 202.5 | single |  |
| 1 | 1 250 | 2 250 | 337.5 | 1 | 25 | 337.5 | single |  |
| 2 | 2 000 | 4 250 | 607.5 | 1 | 26 | 607.5 | single |  |
| 3 | 3 000 | 7 250 | 810 | 1 | 27 | 810 | single | Hivemind |
| 4 | 4 500 | 11 750 | 1 350 | 1 | 26 | 1 350 | single |  |
| 5 | 7 500 | 19 250 | 2 025 | 1 | 27 | 2 025 | single |  |
| 6 | 11 000 | 30 250 | 2 700 | 1 | 28 | 2 700 | single | Nectar Nova |

### Legendary Assassin

`sakamoto` · Mythic · ground · Damage-Typ physical + air · Spawn Cap 3 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 250 | 1 250 | 950 | 7 | 16 | 135.71 | cone 60° |  |
| 1 | 1 500 | 2 750 | 1 600 | 6.5 | 18 | 246.15 | cone 60° |  |
| 2 | 2 700 | 5 450 | 2 900 | 6.5 | 21 | 446.15 | circle r=7, 3 Hits | + Fine-Point Fatality |
| 3 | 4 000 | 9 450 | 4 500 | 6.5 | 23 | 692.31 | circle r=7, 3 Hits |  |
| 4 | 7 000 | 16 450 | 5 700 | 6 | 25 | 950 | circle r=10, 1 Hits | + Garbage Disposal |
| 5 | 10 000 | 26 450 | 8 500 | 6 | 27 | 1 416.67 | circle r=10, 1 Hits |  |
| 6 | 12 000 | 38 450 | 9 500 | 5.5 | 30 | 1 727.27 | circle r=12, 4 Hits | + No Refunds |
| 7 | 17 000 | 55 450 | 12 000 | 5.5 | 33 | 2 181.82 | circle r=12, 4 Hits |  |

Evolution → `sakamoto_evo`: +25% Attack, +Slim Down. Material: assassin_token ×250, StarFruit ×6, StarFruitRed ×2, StarFruitPink ×2, StarFruitGreen ×2, StarFruitEpic ×1; Takedowns 5 000.

### Fiery Commander (Legacy: Yamomoto)

`yamamoto` · Secret · ground · Damage-Typ physical + fire · Spawn Cap 3 · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 750 | 1 750 | 250 | 7 | 20 | 35.71 | circle r=7, Burn 6 %×5 |  |
| 1 | 2 200 | 3 950 | 400 | 6 | 21 | 66.67 | circle r=7, Burn 6 %×5 |  |
| 2 | 2 500 | 6 450 | 600 | 5.5 | 22 | 109.09 | circle r=7, Burn 6 %×5 |  |
| 3 | 4 000 | 10 450 | 1 300 | 15 | 23 | 86.67 | full, Burn 6 %×5 | + Taimatsu |
| 4 | 5 000 | 15 450 | 1 800 | 14 | 24 | 128.57 | full, Burn 6 %×5 |  |
| 5 | 6 500 | 21 950 | 2 300 | 14 | 25 | 164.29 | full, Burn 6 %×5 |  |
| 6 | 8 000 | 29 950 | 2 500 | 14 | 30 | 178.57 | full, Burn 6 %×5 | + Flames of Purgatory |
| 7 | 12 500 | 42 450 | 3 250 | 14 | 32 | 232.14 | full, Burn 6 %×5 |  |
| 8 | 17 500 | 59 950 | 3 500 | 13.5 | 33 | 259.26 | full, Burn 6 %×5 |  |

Evolution → `yamamoto_evolved`: +50% Attack, +Zanka no Tachi. Material: yamamoto_staff ×1; Takedowns –.

### Eccentric Researcher (Captain) (Legacy: Hanje (Captain))

`hange_evolved` · Mythic · hill · Damage-Typ physical + air · Spawn Cap 5 · Crit 50 % · OBSERVED · HIGH · [S65, S66]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 500 | 1 500 | 390 | 7 | 20 | 55.71 | circle r=4, Bleed 10 %×3 |  |
| 1 | 2 000 | 3 500 | 780 | 7 | 22 | 111.43 | circle r=4, Bleed 10 %×3 |  |
| 2 | 3 000 | 6 500 | 1 560 | 7 | 23 | 222.86 | circle r=4, Bleed 10 %×3 |  |
| 3 | 3 500 | 10 000 | 1 950 | 6.5 | 24 | 300 | circle r=5, Bleed 10 %×3 | + Dive Maneuver |
| 4 | 4 500 | 14 500 | 2 600 | 6.5 | 25 | 400 | circle r=5, Bleed 10 %×3 |  |
| 5 | 5 500 | 20 000 | 3 250 | 6.5 | 26 | 500 | circle r=5, Bleed 10 %×3 |  |
| 6 | 6 500 | 26 500 | 3 575 | 6.5 | 27 | 550 | circle r=5, Bleed 10 %×3 |  |
| 7 | 8 000 | 34 500 | 3 900 | 6 | 28 | 650 | circle r=6, Bleed 10 %×3 | + Thunder Spears |
| 8 | 9 000 | 43 500 | 4 550 | 6 | 30 | 758.33 | circle r=6, Bleed 10 %×3 |  |

### Kansai

`kasuga` · Mythic · ground · Damage-Typ magic + lightning · Spawn Cap 4 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 350 | 1 350 | 1 000 | 7 | 23 | 142.86 | circle r=6 |  |
| 1 | 2 000 | 3 350 | 2 000 | 7 | 24 | 285.71 | circle r=6 |  |
| 2 | 3 000 | 6 350 | 3 000 | 7 | 25 | 428.57 | circle r=6 |  |
| 3 | 3 500 | 9 850 | 3 300 | 9 | 30 | 366.67 | line b=12, 3 Hits | + America Ya! |
| 4 | 5 000 | 14 850 | 4 000 | 8 | 33 | 500 | line b=12, 3 Hits |  |
| 5 | 7 700 | 22 550 | 5 000 | 7 | 35 | 714.29 | line b=12, 3 Hits |  |

Evolution → `kasuga_evo`: +50% Attack, , +OH MY GAH!, +Daydream. Material: mysterious_cat ×1, StarFruit ×12, StarFruitBlue ×5, StarFruitPink ×4, StarFruitGreen ×3, StarFruitEpic ×1; Takedowns 7 500.

### Kansai (Daydream)

`kasuga_evo` · Mythic · ground · Damage-Typ magic + lightning · Spawn Cap 4 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 1 350 | 1 350 | 1 500 | 7 | 23 | 214.29 | circle r=6 |  |
| 1 | 2 000 | 3 350 | 3 000 | 7 | 24 | 428.57 | circle r=6 |  |
| 2 | 3 000 | 6 350 | 4 500 | 7 | 25 | 642.86 | circle r=6 |  |
| 3 | 3 500 | 9 850 | 4 950 | 9 | 30 | 550 | line b=12, 3 Hits | + America Ya! |
| 4 | 5 000 | 14 850 | 6 000 | 8 | 33 | 750 | line b=12, 3 Hits |  |
| 5 | 7 700 | 22 550 | 7 500 | 7 | 35 | 1 071.43 | line b=12, 3 Hits |  |
| 6 | 9 000 | 31 550 | 22 500 | 15 | 40 | 1 500 | circle r=12, 1 Hits | + OH MY GAH! (Becomes Hybrid) |
| 7 | 12 500 | 44 050 | 30 000 | 14.5 | 43 | 2 068.97 | circle r=12, 1 Hits |  |
| 8 | 20 000 | 64 050 | 37 500 | 14 | 45 | 2 678.57 | circle r=12, 1 Hits |  |

### Vengeful Swordsman

`rokuhira` · Secret · ground · Damage-Typ physical + water · Spawn Cap 3 · OBSERVED · HIGH · [S65]

| Stufe | Kosten | Σ Kosten | Damage | SPA | Range | DPS (DERIVED) | Angriff | Hinweis |
|---:|---:|---:|---:|---:|---:|---:|---|---|
| 0 | 2 000 | 2 000 | 800 | 8 | 25 | 100 | circle r=10, 3 Hits |  |
| 1 | 2 500 | 4 500 | 1 500 | 7.5 | 27 | 200 | circle r=10, 3 Hits |  |
| 2 | 3 500 | 8 000 | 2 200 | 7 | 30 | 314.29 | circle r=10, 3 Hits |  |
| 3 | 4 000 | 12 000 | 2 700 | 8 | 31 | 337.5 | circle r=12, 3 Hits | + Scatter |
| 4 | 4 500 | 16 500 | 3 750 | 7.5 | 32 | 500 | circle r=12, 3 Hits |  |
| 5 | 5 000 | 21 500 | 4 500 | 7.5 | 33 | 600 | circle r=12, 3 Hits |  |
| 6 | 7 500 | 29 000 | 5 000 | 7 | 36 | 714.29 | circle r=14, 1 Hits | + Kaminari |
| 7 | 10 000 | 39 000 | 7 000 | 7 | 37 | 1 000 | circle r=14, 1 Hits |  |
| 8 | 15 000 | 54 000 | 9 000 | 7 | 38 | 1 285.71 | circle r=14, 1 Hits |  |

Evolution → `rokuhira_evo`: +40% Attack, +Cut Down, +Spellforged Blades, +White Flash Draw Technique. Material: sky_reaver ×1, StarFruit ×12, StarFruitRed ×5, StarFruitBlue ×4, StarFruitGreen ×3, StarFruitEpic ×1; Takedowns 7 500.

## Legacy ↔ Re-Release

| Befund | Wert | Tag |
|---|---|---|
| Units im Legacy-Endstand (S66) | 500 | OBSERVED · HIGH |
| davon im RR umbenannt | 428 (z. B. Usoap → Captain, Wenda → Wind Dragon, Orwin → Commander) | OBSERVED · HIGH |
| davon mit geänderten Werten | **9**, alle mit reinem Damage-Buff, Kosten/SPA/Range unverändert | OBSERVED · HIGH |
| neu im RR | 61 Einträge (Updates 19–20.4.1) | OBSERVED · HIGH |

Damage-Faktor RR/Legacy der 9 geänderten Units (DERIVED; Wiki-Seite „ReReleased Shadow Buffed Units“):

| ID | Name (RR) | Faktor |
|---|---|---|
| `tatsumaki`, `tatsumaki_evolved` | Tamiki / Tamiki (Tornado) | ×1,5 |
| `dio_heaven` | JIO (Over Heaven) | ×1,5 |
| `pucci_heaven` | Priest (Heaven) | ×2,0 |
| `tengen_2`, `tengen_2_evolved` | Tango (Score) / (Flash God) | ×1,324 (Evo-Stufen bis ×1,787) |
| `cid`, `cid_evolved` | Umbra / Umbra (Nuclear) | ×1,2 |
| `escanor_evolved` | Hubris (The One) | ×1,30 bis ×1,51 je Stufe |

Die vollständige Gegenüberstellung pro Stufe steht in `data/units.json` (`legacyLevels`).

## Für unseren Nachbau

- **Datenschema:** `levels[]` mit `cost`, `damage`, `spa`, `range`, `attack` (Referenz auf eine Angriffsdefinition) und optional `farm` sowie `note`. Diese Struktur lässt sich 1:1 übernehmen; siehe [technical-reconstruction.md](technical-reconstruction.md#datenmodell).
- **Eigene Units** sollten sich an die Kurvenformen oben halten:
  - Platzierung ≈ 3–8 % der Gesamtkosten
  - DPS-Faktor 7–14 über alle Upgrades
  - AoE-Wechsel als „Meilenstein-Upgrades“
- **Namen, Modelle, Animationen und Sounds** werden nicht übernommen. Asset-Felder wurden beim Import entfernt.
