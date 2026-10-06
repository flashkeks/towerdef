# Unit Powerups – Randomisierte Stats, Level, Limit Break, Curses, Relics

Legende: `ART · CONFIDENCE · [Quelle]` (siehe [README](README.md#kennzeichnung)). `S72:<Seite>` = Wiki-Volltext (überwiegend RR-Stand), `S72:Powerups@19904` = Wiki-Fassung vom 25.06.2023 (LEGACY) aus der Versionsgeschichte.

## 1. Randomisierte Basis-Stats („Stat Potential“)

Jede Unit-Instanz hat für **Damage, SPA und Range** je einen eigenen Prozent-Roll. Darum haben zwei Kopien derselben Unit unterschiedliche Werte („RND“). OBSERVED · HIGH · [S72:Powerups, S72:Frequently Asked Questions, S72:Terminology]

| Aspekt | Wert | Version | Tag |
|---|---|---|---|
| Einführung | **Update 11** (25.02.2023): „Stat Potential“, Stat Cubes, Worthiness, Stat Transfer | LEGACY | OBSERVED · HIGH · [S72:Update Log] |
| Spanne Damage | **−10 % … ≥ +20 %** | LEGACY + RR | OBSERVED · HIGH · [S72:Powerups, S72:Powerups@19904] |
| Spanne SPA | **+10 % … ≤ −10 %** (negativ = schneller) | RR (LEGACY-Tabelle war Platzhalter) | OBSERVED · HIGH · [S72:Powerups] |
| Spanne Range | **−10 % … ≥ +10 %** | RR | OBSERVED · HIGH · [S72:Powerups] |
| Reroll-NPC | RR: **Cosmic Cat** („Traits and Evolve“, Menüpunkt „Reroll Potential“); LEGACY: Beerus/„Beeruh“ am Evolve-Bereich | RR / LEGACY | OBSERVED · HIGH · [S72:Powerups, S72:Powerups@19904, S68:reroll_stat_all] |
| Stat Cube | rerollt **alle drei** Stats | beide | OBSERVED · HIGH · [S68, S72:Powerups] |
| Perfect Stat Cube | rerollt **einen gewählten** Stat | beide | OBSERVED · HIGH · [S68, S72:Powerups] |
| Cube-Quellen | Evolution von Units; Battle Pass (3× Stat Cube bzw. 1 Perfect auf einzelnen Tiers); Daily Challenge (2–3 Stat Cubes + Chance auf 1 Perfect); Infinity Mansion (Raum 40: 3 Stat Cubes, Raum 75: 1 Perfect Stat Cube) | RR | OBSERVED · HIGH · [S68, S72:Powerups, S72:Challenges, S72:Battlepass, S72:Infinity Mansion] |
| Sicherheitsabfrage | Reroll fragt nach, wenn ein S-Tier-Stat überschrieben würde (Update 20) | RR | OBSERVED · HIGH · [S72:Update Log] |
| Equip-Status | Beim Öffnen des Reroll-Menüs wird die Unit automatisch abgelegt | RR | OBSERVED · HIGH · [S72:Powerups] |
| Evolution | Evolution rollt die Stats so, dass sie **immer besser** sind als vorher. Ausnahme: Ein **SSS**-Stat bleibt gleich. Je höher der Ausgangswert, desto kleiner der Zuwachs | beide | OBSERVED · HIGH · [S72:Powerups] |
| Verteilung des Rolls | **UNKNOWN** | – | UNKNOWN |

### Rangtabelle (vollständig, RR) [S72:Powerups]

| Rang | Damage | SPA (negativ = besser) | Range |
|---|---|---|---|
| SSS | ≥ +20 % | ≤ −10 % | ≥ +10 % |
| SS | +19,2 … +19,9 % | −9,6 … −9,9 % | +9,6 … +9,9 % |
| S+ | +18,5 … +19,1 % | −9,3 … −9,5 % | +9,3 … +9,5 % |
| S | +17,8 … +18,4 % | −8,9 … −9,2 % | +8,9 … +9,2 % |
| S- | +17,0 … +17,7 % | −8,5 … −8,8 % | +8,5 … +8,8 % |
| A+ | +14,8 … +16,9 % | −7,3 … −8,4 % | +7,3 … +8,4 % |
| A | +12,5 … +14,7 % | −6,3 … −7,2 % | +6,3 … +7,2 % |
| A- | +10,0 … +12,4 % | −5,0 … −6,2 % | +5,0 … +6,2 % |
| B+ | +6,5 … +9,9 % | −3,4 … −4,9 % | +3,4 … +4,9 % |
| B | +3,0 … +6,4 % | −1,7 … −3,3 % | +1,7 … +3,3 % |
| B- | 0,0 … +2,9 % | 0,0 … −1,6 % | 0,0 … +1,6 % |
| C+ | −3,0 … −0,1 % | +2,0 … +0,1 % | −2,0 … −0,1 % |
| C | −6,5 … −3,1 % | +5,0 … +2,1 % | −5,0 … −2,1 % |
| C- | −10,0 … −6,6 % | +10,0 … +5,1 % | −10,0 … −5,1 % |

OBSERVED · HIGH für alle Spalten. Die SPA- und Range-Spalten waren in Sitzung 1 nur an den Endpunkten bekannt.

**Struktur** (DERIVED aus der Tabelle): Im positiven Bereich laufen SPA und Range ungefähr auf der **halben** Damage-Skala (SS 19,2 % ↔ 9,6 %; A- 10,0 % ↔ 5,0 %). Im negativen Bereich ist die Abbildung **nicht linear**: C+ ist schmaler (−2,0 statt −3,0), C- gleich breit (bis −10 %). Die Ränge sind also eigene Intervalltabellen je Stat, keine Formel.

**Anzeige vs. echter Wert:** Die UI rundet auf eine Nachkommastelle. 19,96 % (SS) und 20,02 % (SSS) erscheinen beide als „20,0 %“; der Rang wird mit dem ungerundeten Wert bestimmt. OBSERVED · HIGH · [S72:Powerups]. In der LEGACY-Fassung lag die SSS-Grenze bei „20,1 % >“ bzw. „10,1 % >“. OBSERVED · MEDIUM · [S72:Powerups@19904]

### Worthiness

| Aspekt | Wert | Version | Tag |
|---|---|---|---|
| Aufbau | **+1 % pro 100 Takedowns** der Unit; 100 % = 10.000 Takedowns. Takedowns zählen jeden Treffer an einem später getöteten Gegner (wie Mob-Sharing), Kills nur den letzten Treffer | beide | OBSERVED · HIGH · [S72:Powerups, S72:Frequently Asked Questions] |
| Maximum | LEGACY: 100 %. RR seit **Update 20** (09.03.2025): **400 %**; jeder Reroll verbraucht **höchstens 100 %** | siehe Tabelle | OBSERVED · HIGH · [S72:Update Log, S72:Powerups] |
| Wirkung | höhere Chance auf gute Ränge („higher chance … such as S“); Empfehlung: vor Reroll und Evolution ≥ 100 % | beide | OBSERVED · HIGH · [S72:Powerups] |
| „100 % ⇒ alle Stats ≥ B+“ | nur Forenaussage, im Wiki-Volltext **nicht** bestätigt | LEGACY | OBSERVED · LOW · [S59, S48] |
| Verteilung in Abhängigkeit von Worthiness | **UNKNOWN** | – | UNKNOWN |
| Takedown-Farm | Community-Empfehlung: Walled City Infinite (Gegner spawnen weitere Gegner) | RR | OBSERVED · MEDIUM · [S72:Infinite, S72:Frequently Asked Questions] |

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Worthiness-Maximum, U11 (02/2023) → RR U20 (03/2025) | 100 % | 400 % (max. 100 % pro Reroll) | 400 % | [S72:Update Log] |

Das Item **Worthy Soul** (0,5 % „Awakening“ pro Stück) gehört zur Evolutionskette von Illusionist und ist **nicht** dasselbe wie Worthiness. OBSERVED · HIGH · [S72:Illusionist (Chrysalis), S72:Items]

**Modell** (RECONSTRUCTED · LOW, Kalibrierung offen):

```text
w      = min(worthiness, 1.0)                 // verbraucht max. 100 % pro Reroll
lower  = lerp(−10 %, +X %, w)                 // X UNKNOWN; Forenaussage: X ≈ +6,5 % (B+)
roll   = sample(lower, +20 %)                 // Verteilungsform UNKNOWN
```

### Stat Transfer

| Aspekt | Wert | Version | Tag |
|---|---|---|---|
| NPC | **Wish Girl** (Play-Bereich) | beide | OBSERVED · HIGH · [S72:Powerups, S72:Powerups@19904] |
| Kosten | **5.000 Gold pro Stat** | beide | OBSERVED · HIGH · dto. |
| Erfolgschance | **50 %**, unabhängig von der Unit | beide | OBSERVED · HIGH · dto. |
| Spender-Unit | wird **immer** gelöscht, auch bei Misserfolg | RR | OBSERVED · HIGH · [S72:Powerups] |

## 2. Unit-Level und XP

| Aspekt | Wert | Tag |
|---|---|---|
| Level-Cap-Historie | **60** (U1, 15.07.2022) → **70** (U1.5, 24.07.2022) → **80** (U3, 19.08.2022) → **90** (U4, 04.09.2022) → **100** (U5, 20.09.2022) → **110** mit Limit Break (RR U19) | OBSERVED · HIGH · [S72:Update Log] |
| Damage-Skalierung | Level 100 = **×9,20406501834430488** Level 1 (Wiki-Template-Konstante; FAQ: „around 9.204x“). Gilt auch für DoT | OBSERVED · HIGH · [S72:Experiment buff (Wiki-Formel L1→L100), S72:Frequently Asked Questions] |
| Level 110 | Limit Break auf 110 gibt „approximately a **19 %** increase“ an Damage gegenüber Level 100 → L110 ≈ 9,204 × 1,19 ≈ **10,95×** L1 | OBSERVED · MEDIUM · [S72:Powerups]; DERIVED |
| Andere Stats | Range und SPA ändern sich **nicht** mit dem Level | OBSERVED · HIGH · [S72:Powerups (Limit Breaking)] |
| XP-Quellen | Matches; **XP-Food** (max. 1.000 Stück je Sorte); **Fusing** (Units verschmelzen, seit Update 7); Adept-Trait +50 % | OBSERVED · HIGH · [S72:Items, S72:Update Log, S72:Frequently Asked Questions, S72:Traits] |
| XP-Kurve | **UNKNOWN** | UNKNOWN |

**XP-Food** (OBSERVED · HIGH · [S68, S72:Items]):

| Item | XP | Item | XP |
|---|---:|---|---:|
| Senzu Bean | 25 | Ghoul Coffee | 575 |
| Mysterious Fluid | 50 | Soul Candy | 1.000 |
| Wisteria Flower | 115 | Cooked Fish | 2.160 |
| Ramen Bowl | 250 | Welt-Items (Curse Talisman, Alien Core, Magic Stone, Tavern Pie, Quirk Shard, Pirate Grapes, Chakra Rod, XP Potion u. a.) | je **3.450** |
| Devil Fruit | 550 | | |

Einige Welt-Items tragen im Datenmodul ein Feld `xp_world` (z. B. `opm`, `mha`, `clover`). Seine Wirkung (Bonus in dieser Welt?) ist **UNKNOWN**. [S68]

**Level-Kurve – Kandidaten** (DERIVED aus den Ankern; die echte Kurve ist **UNKNOWN**):

| Modell | Formel | L50 | L100 | L110 | passt zu „+19 % ab L100“? |
|---|---|---:|---:|---:|---|
| linear | `1 + 0,082869·(L−1)` | 5,06 | 9,204 | 10,03 (+9 %) | nein |
| exponentiell | `1,022674^(L−1)` | 3,00 | 9,204 | 11,51 (+25 %) | nein |
| linear mit Knick ab 100 | bis 100 linear, danach `+0,175/Level` | 5,06 | 9,204 | 10,95 (+19 %) | ja (konstruiert) |

Keines der beiden einfachen Modelle trifft beide Anker. Die Angabe „approximately 19 %“ ist aber nur MEDIUM belegt. Für den Nachbau (`DESIGN`) gilt: Kurve frei wählen, Anker L100 = 9,204× einhalten.

## 3. Limit Break

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | **RR Update 19** (25.12.2024), NPC „Fused Hero“ bzw. Limit Breaker neben Evolve | OBSERVED · HIGH · [S72:Update Log, S72:Powerups] |
| Voraussetzung | Ziel-Unit Mythic oder Secret, **Level 100** | OBSERVED · HIGH · [S72:Frequently Asked Questions] |
| Kosten | **1 Divine Wish** + Opfer im Wert von **12 Punkten**: unevolvierte Mythic/Secret = 1, evolvierte = 2 (also 12 bzw. 6 Units); Opfer müssen entsperrt sein | OBSERVED · HIGH · [S72:Powerups, S72:Update Log] |
| Effekt auf die Unit | Max-Level +10, aktuell bis **110** (≈ +19 % Damage, s. o.) | OBSERVED · HIGH · [S72:Powerups] |
| **Team-Buff** | Jede **ausgerüstete** Limit-Broken-Unit gibt allen eigenen Units **+5 % Damage**, stapelnd; max. 6 ausgerüstet → **+30 %**. Wirkt nicht auf Units anderer Spieler | OBSERVED · HIGH · [S72:Powerups, S72:Update Log] |
| Weitere Effekte | „unlocks new mysterious powers that unlock soon“ (Ankündigung, Inhalt UNKNOWN). Einzelfall: Ein Unit-Text nennt „×1,69 from max limit break“ (= 1,3 × 1,3; unitspezifische Interaktion) | OBSERVED · LOW · [S72:Update Log, S72:Divine General] |
| Divine Wish | Quellen: Level-Milestone 100, Daily Challenges (garantiert); **max. 3** im Inventar | OBSERVED · HIGH · [S72:Powerups, S72:Level Milestones] |

Der frühere Eintrag „permanenter 15-%-Buff“ [S59] ist durch die Wiki-Regel (+5 % pro ausgerüsteter LB-Unit) ersetzt. Die 15 % entsprechen genau 3 LB-Units. RECONSTRUCTED · MEDIUM

## 4. Curses

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 6.5 (16.10.2022) | OBSERVED · HIGH · [S72:Powerups, S72:Update Log] |
| Effekt | **ein zufälliger Stat steigt**, **einer der beiden anderen** (zufällig) sinkt. Stats: Damage, SPA, Range → 6 mögliche Paare | OBSERVED · HIGH · [S72:Powerups] |
| Betrag | RR: **2,5 … 13 %** je Seite | OBSERVED · HIGH · [S72:Powerups] |
| Kosten | 1 **Cursed Token** (RR, seit U19 umbenannt) bzw. **Cursed Finger** (LEGACY), Anwendung in „Sukuno's“ / Cursed King's Domain | OBSERVED · HIGH · [S72:Powerups, S72:Items] |
| Quellen | Dungeon **Cursed Womb** (Key droppt von Secret-Gegnern in Cursed Academy Infinite), Battle Pass | OBSERVED · HIGH · [S72:Powerups] |
| Inventar-Limit | 20 Cursed Tokens + 1 Indestructible Cursed Token (wiederverwendbar, Item `sukuna_finger_permanent`) | OBSERVED · HIGH · [S72:Items, S68] |
| Entfernen | **nicht möglich** | OBSERVED · HIGH · [S72:Powerups] |
| Cooldown-Wirkung | SPA-Curses ändern auch **Ability-Cooldowns** (z. B. Commander, Wind Dragon). Damit funktioniert der „Infinite Buff“-Loop. Arlems SPA ist durch Stats und Traits nicht änderbar, durch Curses aber schon | OBSERVED · HIGH · [S72:Powerups, S44] |
| Verteilung von Betrag und Stat-Paar | **UNKNOWN** | UNKNOWN |

| Zeitraum/Version | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---|---|---|
| Curse-Betrag LEGACY (2023) → RR | 2,5 … 11 % bzw. 2,5 … 11,1 % | 2,5 … 13 % | 2,5 … 13 % | [S72:Curses (2023-08), S72:Powerups@19904] → [S72:Powerups] |
| Curse-Item, U19 | Cursed Finger | Cursed Token | Cursed Token | [S72:Powerups (Trivia)] |
| U20 (03/2025) | – | „Curse debuff cooldown rate removed“ (Bedeutung unklar) | – | [S72:Update Log] |

## 5. Relics

### Regeln

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | **Update 7** (12.11.2022), zusammen mit den Damage Types | OBSERVED · HIGH · [S72:Relics, S72:Update Log] |
| Stat-Typen | **% DMG** (Schaden eines Typs +%), **PEN** (durchdringt Resistenz), **PWR** (DPS/Upgrade, skaliert mit Unit-Level; Anzeige ändert sich nach dem Ausrüsten), Crit Chance, Unique-Effekte | OBSERVED · HIGH · [S72:Relics] |
| Resistenzformel | Schaden × **100 / (100 + Resistenz)**; 150 Magic-Resistenz → 40 % Schaden | OBSERVED · HIGH · [S72:Relics] |
| Equip | nicht auf Epic oder darunter; jedes Unique-Relic **einmal pro Team**; jederzeit ablegbar und umsteckbar | OBSERVED · HIGH · [S72:Relics] |
| Slots pro Unit | **UNKNOWN** (vermutlich 1) | UNKNOWN |
| Equip-Bedingung | z. B. Mangekyō Eye: zunächst nur Units mit Fire-Damage (`equip_requirements`); seit Update 18 für jeden Damage-Typ | OBSERVED · HIGH · [S68:eternal_eye, S72:Update Log] |
| Crafting | beim NPC Golden King gegen Materialien + Gold | OBSERVED · HIGH · [S72:Relics, S72:Items] |
| Relic Shards | Raid Sacred Planet Stage 4 (10 %), Stage 5 (100 %) | OBSERVED · HIGH · [S72:Relic Shards] |
| Trading | seit Update 10.5 „some relics“ handelbar; laut Trading-Seite nur Limited Relics; Trade-Tax Mythic-Relic 2.000 Gems | OBSERVED · HIGH · [S72:Update Log, S72:Trading] |

### Datenmodell und Roll-Gewichte (S69, LEGACY-Stand 2022-11)

```text
relic_data:
  _core_damage_type_buffs_static: [ {damage_type, mul{min,max}} ]                 // immer vorhanden
  _unique_relic_effects:          [ {id, static_params{param{min,max}}} ]          // Spezialeffekt
  _core_damage_type_buffs_random: [ {weight, damage_type, mul|add_upg|pen{min,max}} ]
  _core_random_buffs_to_roll:     1                                                // Anzahl gezogener Zufallsbuffs
mul = % DMG (0,04 = 4 %), add_upg = PWR, pen = PEN
```
OBSERVED · HIGH · [S69, S68]. Ob innerhalb von `{min,max}` gleichverteilt gewürfelt wird, ist **UNKNOWN** (Annahme: gleichverteilt).

| Relic | Rarität | Rezept | Gold | Fix | Unique-Effekt | Zufallsbuff (1 Zug, Gewicht) | Tag |
|---|---|---|---:|---|---|---|---|
| Steel Shiv | Epic | 10 Ingots (Steel) | 4.000 | – | – | Physical DMG +1–4 % (**1**), Physical PWR +0,5–2 (**2**), Physical PEN +20–40 (**2**) | OBSERVED · HIGH · [S69] |
| Amplifying Codex | Epic | 20 Empty Tome | 5.000 | – | – | Magic DMG +1–4 % (1), Magic PWR +0,5–2 (2), Magic PEN +20–40 (2) | OBSERVED · HIGH · [S69] |
| 5-Leaf Clover | Mythic | 25 Demonic Skull, 25 Demonic Tail, 25 Demonic Horns, 25 Empty Tome, 80 Magic Scroll, 18 Ingots | 10.000 | Physical DMG +2–5 % | Anti Magic: +10–15 % Physical gegen Gegner mit Magic-Resistenz, kann keinen Magic-Damage machen | Dark DMG +2–8 % (1), Dark PWR +1–3 (1), Physical PEN +30–50 (1) | OBSERVED · HIGH · [S69, S72:Relics] |
| Clover Of The Wind | Mythic | 25 Fairy Wings, 25 Fairy Circlet, 25 Wind Splinter, 25 Empty Tome, 18 Ingots, 80 Holy Sprig | 10.000 | Magic DMG +2–5 % | Fairy Blessing: +10–15 % Magic gegen Flying | Air DMG +2–8 % (1), Air PWR +1–3 (1), Magic PEN +30–50 (1) | OBSERVED · HIGH · [S69, S72:Relics] |
| Mermaid Crown | Mythic | 25 Demonic Skull, 25 Fairy Circlet, 25 Demonic Horns, 25 Empty Tome, 18 Ingots, 80 Holy Sprig | 10.000 | Magic DMG +2–5 % | Sea Serpent's Boon: jeder Aqua-Treffer senkt Magic-Resistenz um 1–4 | Aqua DMG +2–8 % (1), Aqua PWR +1–3 (1), Magic PEN +30–50 (1) | OBSERVED · HIGH · [S69, S72:Relics] |
| Mangekyō Eye / „Infernal Gaze“ | Mythic | 10 Relic Shard | 10.000 | Fire DMG +2–5 % (S68); RR-Wiki: 1 Zufallszug aus 7 Elementen je +2–5 % | Eternal Flame: **Burn-Dauer ×2** | siehe Fix | OBSERVED · HIGH · [S68, S72:Relics] |
| Kunai | Epic | 10 Ingots | 4.000 | Physical Crit Chance +2–8 % | – | – | OBSERVED · HIGH · [S72:Relics] |
| Miracle Timepiece | Mythic | 25 Lost Chapter, 25 Empty Tome, 2 Devil Heart, 18 Ingots | 10.000 | Magic DMG +2–5 % | Final Hour: alle 30–50 s macht der nächste Magic-Angriff +70–130 % als True Damage | 1 Zug aus Fire/Aqua/Rose/Air/Storm/Light/Dark DMG je +2–8 % (Gewichte UNKNOWN) | OBSERVED · HIGH · [S72:Relics] |
| Mirrorblade | Mythic | 10 Relic Shard, 5 Demonic Spellbook | 10.000 | Physical DMG +2–5 %, Physical Crit Chance +10–20 % | Wrath: alle 4–6 Treffer +100 % Crit Chance | – | OBSERVED · HIGH · [S72:Relics] |
| Endless Blades | Mythic | 10 Relic Shard | 10.000 | Physical DMG +2–6 %, Physical PEN +30–50, Physical Crit Chance +20–50 % | Thousand Stings: nach „Dismember“ eines Bosses machen alle Treffer +0,0085–0,0140 % der aktuellen HP als True Damage | – | OBSERVED · HIGH · [S72:Relics] |
| Nail | Mythic | 500 Gun Devil Bullet | – | Physical DMG +2–5,5 %, Physical Crit Chance +10–20 % | Curse: +15–30 % Crit Damage | – | OBSERVED · HIGH · [S72:Relics] |
| Hellfire Blade | Mythic | Dungeon „The Fire“ (20 %), nicht mehr erhältlich | – | Fire DMG +2–5 % | Remnant Flame: +5–10 % gegen brennende Gegner | Fire PWR +2–5, Physical DMG +2–5 %, Magic DMG +2–5 % (Gewichte UNKNOWN) | OBSERVED · HIGH · [S72:Relics] |
| Black Blade: Autumn Water | Legendary | Dungeon Thriller Park (selten), nicht mehr erhältlich | – | Physical PEN +30–50 | – | – | OBSERVED · HIGH · [S72:Relics] |
| Aranca Blade → Shark Blade → Crown | Epic → Legendary → Mythic | 10 Aranca Mask / 1 Ingot + 4 Blades / 4 Shark Blades | 100 / 500 / 3.000 | – | Damage in Karakora Town +10–30 % / +30–90 % / +90–270 % | – | OBSERVED · HIGH · [S72:Relics] |
| Awakened Tear (1/2/3 Tomoe) | Epic / Legendary / Mythic | 25 / 50 / 200 Tear | – | – | Damage in Storm-Hideout-Raids +25 / +50 / +100 %, stapelt; max. 3 / 2 / 1 | – | OBSERVED · HIGH · [S72:Relics] |

**Konflikt Steel Shiv / Amplifying Codex:** Die Wiki-Seite listet alle drei Buffs untereinander. Das Datenmodul zieht genau **einen** davon (`_core_random_buffs_to_roll: 1`, Gewichte 1 : 2 : 2, also 20 % DMG, 40 % PWR, 40 % PEN). Wir folgen dem Datenmodul (OBSERVED · HIGH · [S69]). Die Wiki-Darstellung ist vermutlich eine Liste der Möglichkeiten.

**Erwartungswerte** (DERIVED, Annahme Gleichverteilung): Steel Shiv mit PEN-Roll: P = 0,4, Ø PEN 30. Ein Mythic-Relic mit 2–8 % Element-DMG: Ø 5 %, P(≥ 7 %) = 1/6 bei Gleichverteilung.

## 6. Skins

| Aspekt | Wert | Tag |
|---|---|---|
| Einführung | Update 5 (20.09.2022), zusammen mit Autosell | OBSERVED · HIGH · [S72:Update Log] |
| Wirkung außerhalb von Events | kosmetisch | OBSERVED · HIGH · [S72:Cosmetics] |
| **Event-Boni** (nur im jeweiligen Event) | Halloween 2023 (LEGACY): Mythic-Skin/-Unit +40 %, Legendary-Skin +25 %, Epic +5 %, Rare +2 % auf Event-Boost und Secret-Chance, dazu skinabhängiger Damage-Bonus. Winter 2024 (RR): z. B. Rare-Skins +2 % Drops und +1.000 bzw. +5.000 % Damage, Legendary +25 % Drops und +50 … +150 % Damage, Mythic +40 % Drops und +100 … +150 % Damage | OBSERVED · HIGH · [S72:Spooky Star, S72:Events] |
| Bezug | Event-Kapseln mit festen Raten, z. B. 64 / 25 / 10 / 1 % (Rare/Epic/Legendary/Mythic-Skin) oder 81,5 / 16 / 2 / 0,25 % + 0,25 % Mythic-Unit | OBSERVED · HIGH · [S68: capsule_fairytail, capsule_christmas2] |
| Trading | seit Update 6; Trade-Tax Rare 50, Epic 100, Legendary 200, Mythic 2.000 Gems | OBSERVED · HIGH · [S72:Trading] |
| Inventar | Unit- und Skin-Plätze per Gold erweiterbar: 50.000 → 150, 75.000 → 200, 100.000 → 250 Plätze | OBSERVED · HIGH · [S72:Currencies] |
| RR | Auto-Sell für Skins (U19); Event-Banner mit Mythic-Skins | OBSERVED · HIGH · [S72:Update Log, S43] |

## 7. Angezeigte vs. echte Werte

| Stelle | Anzeige | echter Wert / Regel | Tag |
|---|---|---|---|
| Stat Potential | eine Nachkommastelle | Rang aus ungerundetem Wert (19,96 % = SS, 20,02 % = SSS, beide „20,0 %“) | OBSERVED · HIGH · [S72:Powerups] |
| Wiki-Infobox Damage | L1-Wert und L100-Wert | L100 = L1 × 9,20406501834430488, also ohne Potential, Trait, Curse | OBSERVED · HIGH · [S72:Experiment buff (Wiki-Formel L1→L100)] |
| Wiki „Hits“ | Damage pro Angriff | wird auf die Treffer **aufgeteilt**, nicht multipliziert | OBSERVED · HIGH · [S76] |
| PWR-Relic | Wert im Inventar | ändert sich nach dem Ausrüsten (Level-Skalierung) | OBSERVED · HIGH · [S72:Relics] |
| Trait-DPS-Prozente | Wiki rechnet Ø-DPS-Gewinne | Nimble/Godspeed über `1/(1−x)` | DERIVED · HIGH (siehe [traits.md](traits.md#trait-tabelle-rr-stand-und-legacy-endstand)) |
| Spiel-UI | „Stat Potentials are now more visible and appear in more UIs“, Upgrade-Nummer im Spiel (U19), Overhead-Info | Inhalt der Anzeige UNKNOWN | OBSERVED · MEDIUM · [S72:Update Log] |

## 8. Stat-Stack einer Unit-Instanz (Gesamtbild)

```text
EffectiveDamage(unit, upgrade) =
    UpgradeTable[upgrade].damage                 // S65
  × LevelCurve(level)                            // L100 = 9,20406501834430488; Kurve UNKNOWN
  × (1 + potential.damage)                       // −10 % … +20 %
  × (1 + curse.damage)                           // ±2,5 … 13 %
  × (1 + trait.damage) [× trait.damageMultiplier]// Unique ×4; Doppel-Trait addiert
  × (1 + relic.dmgPct[type])
  × (1 + 0,05 × equippedLimitBrokenUnits)        // max. +30 %
  × (1 + liveBuffs)                              // im Match

EffectiveSPA   = UpgradeTable.spa × (1 + potential.spa) × (1 + curse.spa) × (1 + trait.spa)
EffectiveRange = UpgradeTable.range × (1 + potential.range) × (1 + curse.range) × (1 + trait.range)
```
RECONSTRUCTED · LOW. Einzeln belegt sind die Faktoren; ob sie multiplikativ oder additiv zusammenwirken und in welcher Reihenfolge, ist **UNKNOWN**. Belegt ist nur: Doppel-Traits addieren sich, Reaper wirkt multiplikativ mit seinem Boss-Bonus, LB-Boni stapeln sich additiv („+5 % … stacks additionally“).

## 9. Für unseren Nachbau (DESIGN)

- Potential pro Stat als gleichverteilter Roll mit **eigener Rangtabelle je Stat** (Tabelle oben übernehmen). Worthiness als Anhebung der Untergrenze, kalibriert so, dass 100 % mindestens B ergibt. DESIGN
- Curses als „+x auf zufälligen Stat, −y auf einen anderen“, Betrag gleichverteilt 2,5–13 %, nicht entfernbar. DESIGN nach AA-Vorbild
- Relics über das Datenmodell oben (statisch + Unique + N gewichtete Zufallszüge). Das ist direkt als JSON-Schema übertragbar. DESIGN nach AA-Vorbild
- Event-Skins mit Event-only-Boni sind ein starker Sammelanreiz, ohne die Kernbalance zu verändern. DESIGN nach AA-Vorbild
