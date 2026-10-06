# Anime Vanguards - Einheiten (Archetypen, kein Vollkatalog)

Alle Werte aus `Module:UnitData/data` (Wiki-Datenmodul, 224 Datensätze, Kopfkommentar "UPDATE 11") und `UnitData/customData`, Tag `O/HIGH AV-S3`, wenn nicht anders vermerkt. Zahlen sind Werte der Upgrade-Stufe 0 -> Max-Stufe. Ob `damage` pro Treffer oder pro Angriffszyklus gilt, ist nicht belegt (UNKNOWN); `hits` gibt die Treffer je Zyklus an. Kosten: [economy.md](economy.md). Tags und Quellen: [sources.md](sources.md).

Abkürzungen: Pl = Platzierungskosten, Lim = Platzierungslimit, Max = Gesamtkosten (Pl + alle Upgrades) je Platzierung, SPA = Sekunden pro Angriff, Rng = Range.

## 1. Rarity-Ladder und Verteilung

| Rarity | Rolle | Summon-Chance (Banner) | Tag |
|---|---|---|---|
| Rare | Einstieg, Spam-Einheiten mit Limit 5-6 | 75.496 % | O/HIGH AV-S9 |
| Epic | Einstieg/Mittel | 20 % | O/HIGH AV-S9 |
| Legendary | Mittel, Limit 4 | 4 % | O/HIGH AV-S9 |
| Mythic / Exclusive | Hauptkern des Spiels (beide teilen sich die 0.5 %) | zusammen 0.5 % | O/HIGH AV-S9 |
| Secret | Top-Tier, meist 1-3 Platzierungen | 0.004 % | O/HIGH AV-S9 |
| Vanguard | Spitze, Unit 0.005 % (Event-Banner), Memoria 0.075 % | siehe [meta.md](meta.md) | O/HIGH AV-S9 |
| Serialized | nummerierte Shiny-Variante von Event-Vanguard/Secret | 0.5 % der Shiny-Rolls | O/HIGH AV-S9 |

Verteilung im Datenmodul (Datensätze inkl. Evolutionen): Mythic 84, Exclusive 64, Secret 62, Rare 2, Legendary 2, Vanguard 1, Event-Raritäten (Lich King, Ice Queen, Iscanur, Koguro, Rogita, Divalo, Brolzi, Alocard, Song Jinwu and Igros) je 1. Rare/Epic/Legendary sind im Modul praktisch nicht vertreten, Epic fehlt ganz (Stat-Spannen dort UNKNOWN) [D/HIGH AV-S3].

## 2. Typische Stat-Spannen je Rarity (GRND-Einheiten, Min / Median / Max)

| Gruppe | n | Schaden Stufe 0 | Schaden Max | SPA Stufe 0 | Rng Stufe 0 | Rng Max | Upgrades | Tag |
|---|---|---|---|---|---|---|---|---|
| Rare | 2 | 18 / 22.5 / 27 | 95 / 100 / 105 | 5-6 | 11.5-15 | 22-25 | 5 | D/LOW AV-S3 |
| Legendary | 2 | 79 / 84 / 89 | 375 / 428 / 480 | 6-7 | 12-14 | 24-29 | 8 | D/LOW AV-S3 |
| Exclusive unevolved | 8 | 320 / 500 / 2500 | 900 / 1900 / 5600 | 3 / 6.5 / 15 | 15-20 | 20 / 23.5 / 45 | 3-13 | D/MEDIUM AV-S3 |
| Exclusive evolved | 51 | 65 / 700 / 5000 | 335 / 6000 / 80 000 | 1 / 6 / 15 | 1-25 | 1 / 40 / 50 | 7-13 | D/HIGH AV-S3 |
| Mythic unevolved | 25 | 150 / 500 / 2800 | 650 / 1375 / 6800 | 4 / 6.5 / 9 | 15 / 19 / 23 | 17 / 24 / 44 | 3-12 | D/HIGH AV-S3 |
| Mythic evolved | 45 | 240 / 576 / 6000 | 1500 / 4652 / 52 000 | 3 / 6 / 10 | 15 / 20 / 50 | 25 / 39 / 50 | 9-13 | D/HIGH AV-S3 |
| Secret unevolved | 17 | 1 / 1000 / 5500 | 1 / 6000 / 60 000 | 3 / 7 / 12 | 17 / 23 / 40 | 20 / 32 / 55 | 1-11 | D/MEDIUM AV-S3 |
| Secret evolved | 33 | 162 / 1000 / 5640 | 1080 / 6800 / 60 000 | 3 / 7 / 10 | 15 / 20 / 25 | 25 / 40 / 50 | 9-15 | D/HIGH AV-S3 |

Faustwerte: Schaden-Max liegt bei Mythic-evolved etwa beim 8-fachen des Stufe-0-Werts (Median 4652/576), SPA verändert sich um höchstens +-2 s, Range wächst um 15 bis 25 Studs. Zwischen Rare (max ~100) und Secret (max bis 60 000) liegen drei Größenordnungen; die Differenz wird im Spiel durch Gegner-HP-Multiplikatoren (siehe [enemies-waves.md](enemies-waves.md)) und Stat-/Trait-Multiplikatoren ergänzt [D/MEDIUM AV-S3].

## 3. Archetypen mit repräsentativen Einheiten

### 3.1 Single-/Fokus-DPS (hoher Einzelschaden, Limit 1-3)

| Einheit | Rarity | Pl | Lim | Schaden 0 -> Max | SPA 0 -> Max | Rng 0 -> Max | Max-Kosten | Notiz | Tag |
|---|---|---|---|---|---|---|---|---|---|
| Thunder (You) | Exclusive | 1900 | 1 | 5000 -> 80 000 | 8 -> 8 | 1 -> 1 | 92 600 | Linie, Range 1 (Nahkampf), immun gegen Sell/Stun | O/HIGH AV-S3, AV-S11 |
| Hollowseph (Pure) | Exclusive | 4000 | 1 | 2200 -> 33 000 | 5 -> 10 | 15 -> 38 | 133 700 | Kegel 180 Grad, Wechsel zu Voll-AoE | O/HIGH AV-S3 |
| Warlord (Of the Sea) | Secret | 2000 | 1 | 2000 -> 40 000 | 6 -> 7 | 20 -> 45 | 136 750 | stunnt 2 s je Treffer, Rupture, immer Monarch | O/HIGH AV-S3 |
| Unstable (Psychosis) | Secret | 2000 | 3 | 3200 -> 50 000 | 8 -> 12 | 18 -> 45 | 136 000 | Meter-Mechanik | O/HIGH AV-S3 |

### 3.2 AoE-Damage (Kreis/Kegel/Linie)

| Einheit | Rarity | Pl | Lim | Schaden 0 -> Max | SPA | Rng 0 -> Max | AoE | Max-Kosten | Tag |
|---|---|---|---|---|---|---|---|---|---|
| Cha-In (Blade Dancer) | Mythic | 1600 | 5 | 420 -> 1900 | 7 -> 6.5 | 23 -> 42 | Linie 6, später Kegel 270 | 51 900 | O/HIGH AV-S3 |
| Vogita Super (Awakened) | Mythic | 1200 | 4 | 576 -> 2550 | 6.5 -> 6 | 21 -> 40 | Kreis 8 / Linie 7 | 64 250 | O/HIGH AV-S3 |
| Club (Pyro) | Exclusive | 1000 | 4 | 2400 -> 50 000 | 7 -> 10 | 18 -> 35 | Kegel 40, später Voll | 69 100 | O/HIGH AV-S3 |
| Armored Mage (Requip) | Secret | 1000 | 3 | 2500 -> 60 000 | 9 -> 9 | 22 -> 37 | Kegel 60 | 120 500 | O/HIGH AV-S3 |
| Black Hole (Ninjutsu) | Exclusive | 1500 | 3 | 2000 -> 17 000 | 7 -> 7 | 19 -> 46 | Kreis 18 | 118 400 | O/HIGH AV-S3 |

### 3.3 Voll-AoE / globale Treffer

| Einheit | Rarity | Pl | Lim | Schaden 0 -> Max | SPA | Rng 0 -> Max | Hits | Max-Kosten | Tag |
|---|---|---|---|---|---|---|---|---|---|
| Lizard (Fission) | Exclusive | 2500 | 3 | 2000 -> 28 000 | 8 -> 6 | 20 -> 50 | 1 bis 12 | 76 800 | O/HIGH AV-S3 |
| Eizan (Aura) | Secret | 3000 | 3 | 1000 -> 9000 | 10 -> 14 | 17 -> 44 | 1-3 | 136 550 | O/HIGH AV-S3 |
| Astolfo (Rider of Black) | Secret | 2500 | 1 | 1400 -> 3500 | 10 | 20 -> 36 | 8 | 94 000 | O/HIGH AV-S3 |

### 3.4 Support / Buffer (Spalte Schaden/SPA/Rng enthalten bei Support-Typ vermutlich Buff-Prozente, R/LOW)

| Einheit | Rarity | Pl | Lim | Wirkung | Upgrades | Max-Kosten | Tag |
|---|---|---|---|---|---|---|---|
| Haruka Rin (Dancer) | Exclusive | 1200 | 2 | Range-/Schadens-Buffer, Werte 12 -> 20 je Stat, nach 6 Waves +10 % Range | 5 | 24 400 | O/MEDIUM AV-S3 |
| Orehimi (Faith) | Mythic | 1600 | 2 | Cleanser; erste Einheit mit Pl <= 2000 Yen kostet nichts | 4 | 11 700 | O/HIGH AV-S3 |
| The Smith (Forged) | Mythic | 500 | 1 | SPA-/Range-/Damage-Buffer, Protector | 3 | 13 500 | O/MEDIUM AV-S3, AV-S11 |
| Aurin (Nuclear Giant) | Mythic | 1000 | 1 | Kostenreduzierer, Schutz vor Status | 5 | 80 000 | O/HIGH AV-S3 |
| Lich King (Ruler) | Event | 1000 | 1 | DPS + Range-/Damage-Buff + Kostensenkung + Execute | 14 | 218 500 | O/HIGH AV-S3, AV-S11 |

### 3.5 Farm (siehe [economy.md](economy.md))

Tempest Pirate (Navigator): Pl 550, Lim 1, Max 27 000, Range 20 -> 35. Sprintwagon: Upgrade-Kosten 1050/1800/2550/3050. Yen-Ertrag UNKNOWN [O/HIGH AV-S3, AV-S17].

### 3.6 Debuffer / Crowd Control

| Einheit | Rarity | Pl | Lim | Wirkung | Max-Kosten | Tag |
|---|---|---|---|---|---|---|
| Newsman (Forecast) | Exclusive | 800 | 4 | verwandelt Nicht-Boss-Gegner in Schnecken (Slow 50 % 30 s) + Bubbled | 61 100 | O/HIGH AV-S3 |
| Ice Queen (Release) | Event | 10 000 | 3 | Freeze 2 s + Absolute Zero (elementabhängige Bonus-Effekte), Nullify | 223 600 | O/HIGH AV-S3 |
| Dark Mage (Evil) | Exclusive | 1600 | 2 | Diseased (+50 % DoT), Slow 30 % | 58 500 | O/HIGH AV-S3, AV-S11 |
| Ice Manipulator (Admiral) | Mythic | 800 | 4 | Freeze, Wanted-Interaktion | 92 400 | O/MEDIUM AV-S3 |
| Priestess (Holy) | Exclusive | 1500 | 4 | Cleanser, Stun, Slow 30 % | 34 200 | O/MEDIUM AV-S3, AV-S11 |

### 3.7 Anti-Air / Hidden Detection

UNKNOWN. Das Datenmodul enthält keinen Luft-Tower-Typ, keine Gegner mit Eigenschaft Fliegen/Stealth/Hidden in `Module:EnemyData/data` (Textsuche, Gegnerliste von 3 Stages vollständig gelesen) [U/UNKNOWN; negativer Befund O/MEDIUM AV-S5].

### 3.8 Kosteneffiziente Spam-Einheiten (Rare/Legendary)

| Einheit | Rarity | Pl | Lim | Schaden 0 -> Max | SPA | Rng | Max-Kosten | Tag |
|---|---|---|---|---|---|---|---|---|
| Elastic Pirate | Rare | 300 | 6 | 27 -> 105 | 5 -> 4 | 11.5 -> 25 | 2500 | O/HIGH AV-S3 |
| Top Chef | Rare | 400 | 5 | 18 -> 95 | 6 -> 3 | 15 -> 22 | 3750 | O/HIGH AV-S3 |
| Roku (Dark) | Legendary | 850 | 4 | 79 -> 375 | 7 -> 4.5 | 12 -> 29 | 15 700 | O/HIGH AV-S3 |
| Grim Wow | Legendary | 850 | 4 | 89 -> 480 | 6 -> 4.5 | 14 -> 24 | 17 350 | O/HIGH AV-S3 |

## 4. Gruppen- und Elementsystem

Elemente je Einheit (11): Fire, Water, Nature, Spark, Curse, Holy, Unbound, Cosmic, Passion, Blast, Unknown. Gruppen-Buffs wirken auf ca. 20 Unit-Gruppen (z.B. Pirates, Demon Hunter, Giant, Dragon Sphere) [O/HIGH AV-S3, AV-S11]. Alle Fire-Einheiten geben einander +1 % Schaden je Platzierung in Range; Cosmic = Selbst-Cleanse, Blast = teilweise Damage-Reduction-Bypass [O/HIGH AV-S11].

## 5. Evolution als Stats-Sprung

Evolvte Einheiten erhalten mehr Upgrade-Stufen (z.B. Demon Hybrid 4 -> Demon Hybrid (Chainsaw) 13) und neue Moves. Beispiele (Schaden Max vorher -> nachher): Black Hole 2000 -> 17 000 (3 -> 11 Stufen), Rule 4500 -> 29 000, Bounty Hunter 1300 -> 25 000, Ice Manipulator 2000 -> 25 000 [D/HIGH AV-S3]. Siehe [meta.md](meta.md).
