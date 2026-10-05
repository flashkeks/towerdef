# Units – Datenbank

> **Stand der Vollständigkeit:** Namen und Raritäten liegen für Rare, Epic und Mythic teilweise vor. **Vollständige Datenblätter** gibt es nur für 11 Units, und auch dort teilweise unvollständig. Für alle anderen Units sind die Stat-Felder `UNKNOWN`, weil die Wiki-Seiten nicht abrufbar waren. Die maschinenlesbare Fassung liegt in [data/units.json](data/units.json).

## Raritäten

| Rarität | Erhalt | Tag |
|---|---|---|
| Rare | Summon | VERIFIED · CONFIRMED · [S01, S27] |
| Epic | Summon, Raids, Event-Quests | OBSERVED · HIGH · [S27] |
| Legendary | Summon | VERIFIED · CONFIRMED · [S01] |
| Mythic | Summon (Standard 0,25 %, Special 0,5 %), Evolution | VERIFIED · CONFIRMED · [S01] |
| Secret | Evolution (Mythic → Secret), Secret Portals, Raids/Dungeons (1–5 %), Event-Banner (1 : 80.000 im RR) | OBSERVED · HIGH · [S10, S43, S46] |
| Limited (Flag) | Nicht mehr erhältlich; **handelbar** (rote „Limited“-Markierung) | OBSERVED · HIGH · [S19] |
| Battlepass-Units | an den Account gebunden, nicht handelbar | OBSERVED · HIGH · [S19] |
| Leaderboard-Units | Top 25 (normal) bzw. Top 10 (Shiny) | OBSERVED · HIGH · [S06] |

## Unit-Rollen (rekonstruierte Taxonomie)

| Rolle | Merkmal | Beispiele |
|---|---|---|
| DPS Single | hohe Damage, Single-Target, Boss-Killer | Honey (Hive) |
| DPS AoE | Circle/Cone/Line/Full | Black Assassin, Legendary Assassin, Fiery Commander |
| DoT | Burn, Bleed, Poison | Fiery Commander (Burn), Eccentric Researcher (Captain) (Bleed) |
| Farm | Yen pro Wave, kaum Schaden | C.E.O., Bulby |
| Buffer | Active-Buff nach Typ (Physical/Magic) | Commander, Wind Dragon, Erwin-/Wendy-/Leafy-Typen |
| Summoner | beschwört Einheiten | Commander („SUMN“) |
| Utility/CC | Stun, Freeze, Timestop, Slow, Knockback, Rewind, Shatter, Flying-Nullify | diverse |

RECONSTRUCTED · HIGH · [S13, S28, S30, S37]

## Datenblätter mit belegten Werten

Allgemeine Hinweise:

- Das Wiki zeigt Werte als **Spanne `min–max`**. Bei allen gefundenen Units gilt exakt: **Damage-max = 2,1 × min**, **Range-max = 1,2 × min**, **SPA-max = 0,9 × min**. Was diese Spanne repräsentiert (Kombination aus Stat-Roll, Trait und Ähnlichem?), ist **UNKNOWN**. DERIVED · HIGH (Verhältnis) [S29, S32, S33, S34]
- Alle Werte gelten für Unit-Level 1, sofern nicht anders angegeben.

### Captain – Rare, Hill · [S29] OBSERVED · HIGH

| Stufe | Kosten ¥ | Damage | Range | SPA | Attack | Neu |
|---|---:|---|---|---|---|---|
| Placement | 300 | 3 – 6,3 | 25 – 30 | 3 – 2,7 | Single | – |
| U1 | 450 | UNKNOWN | 25 – 30 | 2,5 – 2,25 | Single | – |
| U2 | 650 | UNKNOWN | 27 – 32,4 | 2 – 1,8 | Single | – |
| U3 | 1.500 | UNKNOWN | 30 – 36 | 2 – 1,8 | UNKNOWN | Ability „Bamboo Shot“ |
| U4 | 2.500 | **8,5** (min) | **35** (min) | **1,5** (min) | **AoE Circle r=4** | Wechsel Single → AoE |
| **Total** | **5.400** | | | | | (stimmt mit Wiki-„Total Cost“ überein) |

Evolutionen: Captain (Timeskip), Captain (God). Materialien UNKNOWN.

### C.E.O. – Farm, Ground, Physical · [S28] OBSERVED · HIGH

| Stufe | Kosten ¥ | Yen/Wave |
|---|---:|---:|
| Placement | 550 | 200 |
| U1 | 1.000 | 500 |
| U2 | 1.750 | 1.000 |
| U3 | 2.500 | 1.750 |
| U4 | 3.000 | 2.500 |
| **Total** | **8.800** (DERIVED) | |

Range 10–12 · Spawn Cap **3** · Sell **30 %** · Damage und SPA UNKNOWN.

### Bulby – Farm · [S37] OBSERVED · HIGH

| Stufe | Kosten ¥ (DERIVED) | kumuliert ¥ | Yen/Wave |
|---|---:|---:|---:|
| Placement | 800 | 800 | 250 |
| U1 | 1.500 | 2.300 | 750 |
| U2 | 3.000 | 5.300 | 1.500 |
| U3 | 4.500 | 9.800 | 3.000 |
| U4 | 7.500 | 17.300 | 5.000 |
| U5 | 10.000 | 27.300 | 8.000 |
| U6 | 12.500 | 39.800 | 10.000 |

Die ROI-Analyse steht in [unit-upgrades.md](unit-upgrades.md#farm-roi).

### Commander – Support/Summoner, Hybrid, Single · [S30] OBSERVED · HIGH

| Feld | Wert |
|---|---|
| Deployment | 775 ¥ |
| Upgrades | 1.000 / 1.500 / 2.000 / **4.000 (DERIVED)** / 5.500 / 7.000 |
| Total | 21.775 ¥ |
| Range | 15 |
| SPA | 15 (→ 13,5) |
| Ability | Active: +25 % **Physical**-Damage für Units in Range |

Das Wiki listet 6 Upgrade-Stufen, aber nur 5 Kosten. Die fehlende Stufe ergibt sich aus dem Total: 21.775 − 17.775 = **4.000**. Ihre Position ist UNKNOWN; die Tabelle nimmt aufsteigende Kosten an. DERIVED · MEDIUM

### Wind Dragon – Legendary, Hybrid, AoE Circle r=5 · [S31] OBSERVED · HIGH

| Feld | Wert |
|---|---|
| Deployment | 800 ¥ |
| Upgrades | 1.200 / 1.750 / 2.500 / weitere UNKNOWN |
| Ability | Active-Buff nur für **Magic**-Units, Dauer **20 s**, Cooldown **40 s** |
| Sell | 25 % |
| Erhalt | nur Summon |

### Honey – Mythic, Hill, Single · [S32] OBSERVED · HIGH

| Stufe | Kosten ¥ | Damage | Range | SPA | Neu |
|---|---:|---|---|---|---|
| Placement | 1.000 | 150 – 315 | 24 – 28,8 | 1 – 0,9 | – |
| U1 | 1.250 | UNKNOWN | | | |
| U2 | 2.000 | UNKNOWN | | | |
| U3 | 3.000 | UNKNOWN | | | Hivemind |
| U4 | 4.500 | UNKNOWN | | | |

**Honey (Hive)**, die Evolution: Deployment 1.000 ¥; U1 1.250, U4 4.500, U6 11.000 (U2, U3, U5 UNKNOWN). Hivemind: Schaden ×3 ab U3, ×5 ab U6. Max-SPA ≈ 0,8 s. OBSERVED · MEDIUM

### Legendary Assassin – Mythic, Ground, AoE Cone 60° · [S33] OBSERVED · HIGH

| Stufe | Kosten ¥ | Hits | Damage | Range | SPA |
|---|---:|---:|---|---|---|
| Placement | 1.250 | UNKNOWN | 950 – 1.995 | 16 – 19,2 | 7 – 6,3 |
| U1 | 1.500 | UNKNOWN | UNKNOWN | | |
| U2 | 2.700 | 3 | | | |
| U3 | 4.000 | 3 | | | |
| U4 | 7.000 | 1 | | | |
| U5 | 10.000 | 1 | | | |
| U6 | 12.000 | 4 | | | |
| U7 | 17.000 | 4 | | | |
| **Total** | **55.450** (DERIVED) | | | | |

Die Hits wechseln mit den Upgrades: Der Angriffsstil ändert sich zwischen Multi-Hit und Einzel-Hit. Evolution: Legendary Assassin (Prime) mit Passive „2× DPS gegen den vordersten Gegner“.

### Black Assassin – Mythic, Ground, Physical + Dark · [S36] OBSERVED · HIGH

| Feld | Wert |
|---|---|
| Deployment | 1.200 ¥ |
| Upgrades | 5 (Einzelkosten UNKNOWN, Summe 17.700 DERIVED) |
| Total | 18.900 ¥ |
| Spawn Cap | 4 |
| Damage | 600 → 4.500 |
| Range | 17 → 22 |
| SPA | 7 → 6 |
| Attack | AoE Circle r=7 → r=10, am Ende **2 Hits** |

Evolution: Black Assassin (Reaper).

### Fiery Commander – Ground, AoE Circle r=7, Fire/Burn · [S34] OBSERVED · HIGH

| Stufe | Kosten ¥ | Damage | Burn (5 Ticks) | Range | SPA |
|---|---:|---|---|---|---|
| Placement | 1.750 | 250 – 525 | 75 – 157,5 | 20 – 24 | 7 – 6,3 |
| U1 | 2.200 | 400 – 840 | 120 – 252 | 21 – 25,2 | 6 – 5,4 |
| U2 | 2.500 | 600 – 1.200 ⚠ | 180 – 360 | 22 – 26,4 | 5,5 – 4,95 |
| U3 | 4.000 | 1.300 – 2.600 ⚠ | 390 – 780 | UNKNOWN | UNKNOWN |

⚠ Bei U2 und U3 weicht das Verhältnis mit 2,0 von 2,1 ab. Vermutlich wurde in der Suchzusammenfassung gerundet, also eine LOW-Abweichung. Burn = 30 % des Hits. Evolution: Fiery Commander (Hellfire).

### Eccentric Researcher (Captain) – Hill, AoE Circle r=4 · [S35] OBSERVED · HIGH

| Feld | Level 1 | Level 100 (Active) |
|---|---|---|
| Damage | 390 | 3.589,59 |
| Bleed (3 Ticks) | 117 | 1.076,88 |
| Range | 20 | 20 |
| SPA | 7 | 7 |
| DPS | 55,71 | 512,8 |
| Crit Chance | 50 % | 50 % |

Deployment 1.500 ¥; weitere Upgrades 2.000 / 3.000 / … UNKNOWN. Erhalt: **Ammo Pass** (Battle Pass). Evolution aus Eccentric Researcher + 1 Thunder Spears.

## Bekannte Unit-Namen nach Rarität (RR-Namen)

### Rare [S27] OBSERVED · HIGH

Aman, Blossom, Captain, Carrot, Demon Girl, Demonkiller, Explosion Hero, Fox Ninja, Ghoul, Gravity Hero, Joan, Johna, Jose, Joykid, Kolo, Shinobi, Spirit Reaper, Vego, Verdant Hero

### Epic [S27] OBSERVED · HIGH

Beast, Blaze Frost (Epic), Copy Ninja, Cyborg, Delinquent, Experiment X (Imperfect), Green Alien, Waterfist (White Tooth), Joykid (Navy Bay), Karyn, Killer, Lotus Samurai, Operator, Restructure, Sand Ninja, Sandy, Spirit Reaper (Masked), Tyrant (Final), Zapstu

### Legendary

Belegt: Wind Dragon, C.E.O. (Rarität nicht explizit), Bulby (UNKNOWN). Die vollständige Liste ist **UNKNOWN**.

### Mythic [S02] OBSERVED · HIGH

Black Assassin, Demihuman, Elyssia, Gambler, Robot Sorcerer, Shadow Sorcerer (Incident), Zombie, Spider, Somber, Killstreak, Elf Mage, Cream, Legendary Assassin, Siren, Honey, Ghost-kun, Iceclaw (Rebirth), Dreamer, Psychic Princess, Silver Slayer, Illusionist, Magma, Akemy, Curse, Cherub, Paragon, Frost Navy, Faker, Ariva, Arlem, Magic Disbeliever, Prime Force, Gamer Girl, Tiger, Flamefeather, Explosion Hero (Bang), Waterfist, Player

### Weitere belegte Units und Formen

Commander, Fiery Commander, Fiery Commander (Hellfire), Hubris (The One), Supreme Being (Sovereign), Fused Hero, Chance, Chance (Precision) (40 % Crit über „Precision Blessing“), Lulu, Blood, Berserker (Rage), Dragon Knight, Gajoze, Black Blade, Bubblegum, Bubblegum (Ultimate), Spider (Immolation), Curse (Contract), Eccentric Researcher, Captain (Timeskip), Captain (God), Honey (Hive), Legendary Assassin (Prime), Black Assassin (Reaper). Quelle: Suchtreffer-Titel des Wikis; Rarität und Stats UNKNOWN.

**LEGACY-Namen** aus Guides (vor dem Reskin, nur Referenz): Chairman Neteru, Dark Asto, Dezu (Vigilante), Erein (Founder), Fuji (Admiral), Illy (Homunculus), Aku (Rashamon), Bell (Argonaut), Alucard (Unholy King), Gilgamesh (King of Heroes), Zid, Anz (Overlord), Veko, Kiro. [S46, S64]

## Feldabdeckung pro Unit

| Feld | Abdeckung |
|---|---|
| Name, Rarität | ~80 Units |
| Obtain Method | einzelne |
| Placement-Klasse, Attack Type | 11 |
| Base Damage/SPA/Range | 7 |
| Volle Upgrade-Kosten | 4 (Captain, C.E.O., Bulby, Legendary Assassin); teilweise 5 weitere |
| Volle Upgrade-Stats | **0 vollständig** (Captain fast) |
| Ability-Werte | 3 (Commander, Wind Dragon, Honey (Hive)) |
| ID | **UNKNOWN** für alle |

**Fazit für den Nachbau:** Die Unit-Datenbank ist für ein **eigenes Roster** gedacht. Die belegten Datenblätter liefern **Kurvenformen** (Kostenprogression, Damage-, Range- und SPA-Steigerung, Hits-Wechsel). Zahlen für eigene Units sind daraus abzuleiten, siehe [unit-upgrades.md](unit-upgrades.md) und [technical-reconstruction.md](technical-reconstruction.md).
