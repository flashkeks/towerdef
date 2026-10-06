# UTDZ - Units (Archetypen, kein Vollkatalog)

Format: `Wert [Herkunft/Sicherheit Quelle]`. Kosten in Yen; SPA in Sekunden. DPS = Schaden / SPA [D]. Siehe [economy.md](economy.md) für Kostenkurven und [sources.md](sources.md).

## Rarity-Verteilung und Rollen

Rarity-Stufen (aufsteigend) laut Wiki: Rare, Epic, Legendary, Mythic, Secret, Exclusive, Unrivaled, Synchro, Boundless [O/HIGH UTDZ-S3]. Zusätzlich auf der Drittseite: "Universal" (Festival-Banner-Rarity) [O/MEDIUM UTDZ-S11].

| Rarity | Anzahl gelisteter Basis-/Evo-Einträge im Wiki-Katalog (utdx) | Quelle/Hinweis |
|---|---|---|
| Rare | 7 | Roku, Ranji, Namo, Laffy, Orahemi, Gaaru, Nutaru (Kid) [O/HIGH UTDZ-S3] |
| Epic | 5 | Fastcart, Nejo, Masked Ninja, Triple Threat, Fire Foot Cook [O/HIGH UTDZ-S3] |
| Legendary | 8 | Bulmo, Admiral, Greybeard, Gen, Shakumira, Ruka, Pebble, Zorus [O/HIGH UTDZ-S3] |
| Mythic | rund 60 Einträge (Basis + Evolution) | meist Banner [O/MEDIUM UTDZ-S3] |
| Secret | rund 40 Einträge | Stages/Raids, teils Banner [O/MEDIUM UTDZ-S3] |
| Exclusive | rund 30 Einträge | Events, Battlepass, Shops [O/MEDIUM UTDZ-S3] |
| Unrivaled | 2 (Stand Katalog) | Evolution von Mythic [O/MEDIUM UTDZ-S3] |
| Synchro | 3 | durch Fusion zweier Units [O/MEDIUM UTDZ-S3] |
| Boundless | 3 | Evolution von Secret [O/MEDIUM UTDZ-S3] |

Gesamtzahl laut Drittseite nach 4.0: 115 Units [O/LOW UTDZ-S20]. Der Katalog des Wikis ist veraltet (Stand etwa 2.x-3.0); neue 4.0-Units (Marvel/Persona/Bleach) fehlen.

Rollen laut Wiki (4 Klassen, Mechanics-Modul): DPS, Specialist, Utility (CC, Debuffs), Support (reine Buffs) [O/HIGH UTDZ-S11].

## Typische Stat-Spannen je Rarity (Basis, ohne Relics/Traits)

| Rarity | Platzierungskosten | Schaden Platzierung -> Max | SPA | Range | Max-Upgrade-Stufen | Gesamtkosten | Quelle |
|---|---|---|---|---|---|---|---|
| Rare | 400 | 13 -> 60 | 5 | 15-17 | 5 | 5.250 | [O/HIGH UTDZ-S5] |
| Legendary | 450-700 | 60-100 -> 200-450 | 8-10 -> 3,5-6 | 12-22 -> 25-35 | 5-7 | 9.500-18.850 | [O/MEDIUM UTDZ-S14] |
| Mythic | 1400 (Sasku) | 125 -> 800 | 7 -> 6 | 15 -> 21 | 7 | 28.200 | [O/HIGH UTDZ-S4] |
| Synchro | `UNKNOWN` | 7500 (fix) | 10 | 40 | 0 | `UNKNOWN` | [O/HIGH UTDZ-S8] |

Epic, Secret, Exclusive, Unrivaled, Boundless: Zahlen nicht erhoben (`UNKNOWN`). Hinweis: Das Wiki schreibt Legendary-Units "Estimated 4.1k-7.1k DPS" mit Best-in-Slot-Relics und Trait Astral zu [O/LOW UTDZ-S14, Berechnungsgrundlage unbekannt]. Gegenüber dem Basis-DPS von 40-109 ergäbe das einen Faktor von etwa 50 bis 100 durch Meta-Boni [D, LOW].

## Archetypen mit Beispielen

### Single-Target-/Anti-Armor-DPS

| Unit | Kosten (Pl./Gesamt) | Schaden | SPA | Range | Besonderheit |
|---|---|---|---|---|---|
| Greybeard (Legendary) | 500 / 10.750 | 70 -> 300 | 8 -> 6 | 15 -> 27 | +65 % gegen Armored; AoE Full -> Line -> Circle [O/MEDIUM UTDZ-S14] |
| Gen (Legendary) | 500 / 9.500 | 60 -> 200 | 8 -> 5 | 22 -> 35 | +1 % Angriff je Range-Punkt (Shinsō) [O/MEDIUM UTDZ-S14] |
| Sasku (Mythic) | 1400 / 28.200 | 125 -> 800 | 7 -> 6 | 15 -> 21 | 50 % Stun 3 s; Ability +250 % Schaden, 60 s CD; 50 % Dodge [O/HIGH UTDZ-S4] |

### AoE-Damage

| Unit | Kosten | Schaden | SPA | Range | Besonderheit |
|---|---|---|---|---|---|
| Roku (Rare) | 400 / 5.250 | 13 -> 60 | 5 | 15 -> 17 | Circle -> Line AoE ab U4; +5 % Schaden pro Angriff, Reset je Wave [O/HIGH UTDZ-S5] |
| Ruka (Legendary) | 500 / 12.500 | 80 -> 400 | 7 -> 4,5 | 16 -> 28 | +20 % gegen Frozen; Circle [O/MEDIUM UTDZ-S14] |
| Admiral (Legendary) | 700 / 15.000 | 85 -> 450 | 7 -> 4,5 | 16 -> 32 | Lava-Pfütze 5 s: Confuse 2 s, Burn 30 % / 10 s [O/MEDIUM UTDZ-S14] |
| Underworld God (Primordial, Synchro) | `UNKNOWN` | 7500 | 10 | 40 | Line AoE, Slow -30 %, +20 % DoT-Dauer [O/HIGH UTDZ-S8] |

### Debuffer / Crowd Control

| Unit | Kosten | Wirkung |
|---|---|---|
| Zorus (Legendary) | 600 / 13.000; 90 -> 450 Schaden, SPA 7 -> 4,5 | bis 3 Fallen: Stun 3 s, Radiation 20 % / 10 s, Confusion 3 s [O/MEDIUM UTDZ-S14, UTDZ-S6] |
| Shakumira (Legendary) | 500 / 18.850; 100 -> 400, SPA 10 -> 6, Range 12 -> 25 | Slow; Range-Wachstum durch Slows (Cap 20 % bzw. 25 %) [O/MEDIUM UTDZ-S14] |
| Pebble (Legendary) | 450 / 11.000; 75 -> 380, SPA 6 -> 3,5 | Knockback; +0,5 % Angriff je Knockback (max. 40 %) [O/MEDIUM UTDZ-S14] |

### Farm

| Unit | Kosten | Wirkung |
|---|---|---|
| Bulmo (Legendary) | 500 / 40.500 | 1.000 -> 10.500 ¥ je Wave, 1 Placement, Wish-Ball-Buff (siehe [economy.md](economy.md)) [O/HIGH UTDZ-S14] |

### Support / Buffer

Reine Aura-Buffer mit Zahlen: `UNKNOWN` (nicht erhoben). Teilweise bietet Bulmo Team-Buffs (+15 % Schaden oder +15 % Crit aller Units, einmalig pro Match) [O/HIGH UTDZ-S7]. Das Wiki hat die Klasse "Support" (reiner Buff) [O/HIGH UTDZ-S11].

### Anti-Air und Hidden-Detection

`UNKNOWN`. Weder Luft- noch Stealth-Gegner sind in den abgerufenen Daten dokumentiert; "Hybrid" könnte Boden und Luft meinen, ist aber nicht belegt.

## Unit-Progression (Rarity-Ketten)

- Mythic -> Evolution (Item-Rezept) -> Unrivaled-Mark (4 Fragmente, Max-Level 100, neuer Passive, Anzeige-Border, Leader-/Tag-Buffs) [O/MEDIUM UTDZ-S9, UTDZ-S3]
- Secret -> Evolution -> Boundless (höheres Level-Cap, komplett neue Passives) [O/MEDIUM UTDZ-S3]
- Zwei Units -> Synchro (siehe [meta.md](meta.md)).
- Beispiel Evolution Sasku -> Sasku (Chakra): 1 Curse Mark, 1 Cursed Sword, 2 Universal Fragment, 4 Phantom Fragment [O/HIGH UTDZ-S4].
