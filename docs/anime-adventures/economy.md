# Economy

Stand: Sitzung 2 (P8). Grundlage: Wiki-Volltext S72 (Currencies, Items, Travelling Merchant Shop, Time Machine, Quests, Level Milestones, Battlepass, Trading, Store, Challenges, Infinite, Events, Codes, Update Log, Unit-Seiten), Unit-Datenmodul S65/S66 (über [data/units.json](data/units.json)), Item-Datenmodul S68, Trello S73 und offizielle Roblox-Gamepass-API S75. Tag-Format: `ART · CONFIDENCE · [Quelle]`.

## 1. Yen (In-Match-Währung)

| Aspekt | Wert | Tag |
|---|---|---|
| Start-Yen | **UNKNOWN**. Keine Wiki-Seite, kein Datenmodul und keine Trello-Karte nennt einen Wert. | UNKNOWN |
| Kill-Yen | existiert; Werte und Formel **UNKNOWN** | OBSERVED (Existenz) · [S42] |
| Wave-Yen | existiert; Werte **UNKNOWN** | OBSERVED (Existenz) · [S42] |
| Boss-Yen | **UNKNOWN** | UNKNOWN |
| Farm-Units | feste Yen **am Ende jeder Wave** je Upgrade-Stufe (Feld `farm`, Trigger `end_of_wave`, Typ `farm`) | OBSERVED · HIGH · [S65 → data/units.json] |
| Golden-Trait | +20 % Yen bei Farm-Units (C.E.O., Bulby); **nicht** bei Weather Girl (Thief), dort nur +30 % Damage | OBSERVED · HIGH · [S72:Traits] |
| Verkaufswert | **25 %** der Summe aus Platzierung und Upgrades; so auf über 500 Unit-Seiten. Einzige Abweichung: C.E.O.-Seite nennt 30 % | OBSERVED · HIGH · [S72: Unit-Seiten, S72:C.E.O.] |
| Unverkäuflich | Bulby, Weather Girl (Thief), Navi (Feld `unsellable`); Griffin (Reincarnation) | OBSERVED · HIGH · [S65, S72] |
| Upgrade-Kosten | je Unit, siehe [unit-upgrades.md](unit-upgrades.md) und [data/units.json](data/units.json) | OBSERVED · HIGH · [S65] |
| Kostenmodifikatoren | Challenge „High Cost“ ×1,5, „Triple Cost“ ×3 auf Platzieren und Upgraden | OBSERVED · HIGH · [S72:Challenges] |
| Yen-Opfer | Griffin (Ascension) verwandelt sich nach Opfern von Units im Wert von 100.000 ¥; geopferte Yen werden beim Verkauf nicht erstattet | OBSERVED · HIGH · [S72:Griffin-Seiten] |
| Verfall | Yen gilt nur im Match | RECONSTRUCTED · HIGH |

### Farm-Units (aus dem Unit-Datenmodul)

Spalten: Stufe 0 = Platzierung. „Payback Stufe“ = Kosten der Stufe / zusätzliches Einkommen der Stufe (Waves, bis die Stufe sich bezahlt hat). „Payback gesamt“ = kumulierte Kosten / Einkommen. Kosten/Einkommen OBSERVED · HIGH · [S65]; Payback DERIVED · HIGH.

**C.E.O.** (Epic, Spawn Cap 3, verkäuflich; LEGACY-Name Speedcart)

| Stufe | Kosten ¥ | kumuliert ¥ | ¥/Wave | Payback Stufe | Payback gesamt |
|---:|---:|---:|---:|---:|---:|
| 0 | 550 | 550 | 200 | 2,75 | 2,75 |
| 1 | 1.000 | 1.550 | 500 | 3,33 | 3,10 |
| 2 | 1.750 | 3.300 | 1.000 | 3,50 | 3,30 |
| 3 | 2.500 | 5.800 | 1.750 | 3,33 | 3,31 |
| 4 | 3.000 | 8.800 | 2.500 | 4,00 | 3,52 |

**Bulby** (Legendary, Spawn Cap **1**, unverkäuflich; LEGACY-Name Bulmy)

| Stufe | Kosten ¥ | kumuliert ¥ | ¥/Wave | Payback Stufe | Payback gesamt |
|---:|---:|---:|---:|---:|---:|
| 0 | 800 | 800 | 250 | 3,20 | 3,20 |
| 1 | 1.500 | 2.300 | 750 | 3,00 | 3,07 |
| 2 | 3.000 | 5.300 | 1.500 | 4,00 | 3,53 |
| 3 | 4.500 | 9.800 | 3.000 | 3,00 | 3,27 |
| 4 | 7.500 | 17.300 | 5.000 | 3,75 | 3,46 |
| 5 | 10.000 | 27.300 | 8.000 | 3,33 | 3,41 |
| 6 | 12.500 | 39.800 | 10.000 | 6,25 | 3,98 |

**Weather Girl (Thief)** (Mythic, Spawn Cap 3, unverkäuflich, Limited aus dem Cloud-Hunt-Event; greift zusätzlich an; die Basisform Navi zeigt kein `farm`-Feld)

| Stufe | Kosten ¥ | kumuliert ¥ | ¥/Wave | Payback Stufe | Payback gesamt |
|---:|---:|---:|---:|---:|---:|
| 0 | 1.000 | 1.000 | 300 | 3,33 | 3,33 |
| 1 | 500 | 1.500 | 450 | 3,33 | 3,33 |
| 2 | 750 | 2.250 | 600 | 5,00 | 3,75 |
| 3 | 1.500 | 3.750 | 800 | 7,50 | 4,69 |
| 4 | 2.000 | 5.750 | 1.000 | 10,00 | 5,75 |
| 5 | 2.500 | 8.250 | 1.500 | 5,00 | 5,50 |
| 6 | 3.500 | 11.750 | 2.000 | 7,00 | 5,88 |
| 7 | 5.000 | 16.750 | 2.500 | 10,00 | 6,70 |
| 8 | 6.000 | 22.750 | 3.000 | 12,00 | 7,58 |

Befunde (DERIVED · HIGH):

- Reine Farms amortisieren sich in **3–4 Waves** je Stufe, nur Bulbys letzte Stufe braucht 6,25 Waves.
- C.E.O. mit Spawn Cap 3 voll ausgebaut: 3 × 8.800 = 26.400 ¥ für 7.500 ¥/Wave. Bulby voll: 39.800 ¥ für 10.000 ¥/Wave.
- Andere Farm-Units führt das Modul nicht (nur diese drei haben `farm`-Werte).

## 2. Gems (Hauptwährung)

### Quellen

| Quelle | Menge | Version | Tag |
|---|---|---|---|
| Story-Act, First Clear | **80** + 50 Spieler-XP | LEGACY/RR | OBSERVED · HIGH · [S72:Quests] |
| Story-Act, Wiederholung | **20** + 50 XP | LEGACY/RR | OBSERVED · HIGH · [S72:Quests] |
| Story-Quest je Act (Kapitel 1–4) | **150** zusätzlich, einmalig; Welt mit 6 Acts: 1.380 erstmalig, 120 je Wiederholungsrunde | LEGACY | OBSERVED · HIGH · [S72:Quests] |
| Story-Quests spätere Welten | 25 je Quest (Ghoul City, Hollow World, Ant Kingdom); Marine's Ford 50 je Act + 100 Bossbelohnung Act 6 | LEGACY | OBSERVED · MEDIUM · [S72:Quests] |
| Infinite je Wave | W1–5: 0; W6: 18; W7–15: 3; W15–100: 5; ab W105: 0; Maximum 497 | LEGACY | OBSERVED · HIGH · [S72:Infinite] (Bereichsüberlappung → C6, siehe [game-modes.md](game-modes.md)) |
| Infinite-Daily-Quests | W10: 90, W25: 180, W50: 330 (auf 3 zufälligen Maps); seit 20.4.1 Ziel 40 statt 50 Waves; früher 10/25/50 | LEGACY → RR | OBSERVED · HIGH · [S72:Quests, S72:Infinite, S72:Update Log] |
| Daily Quests | einzeln 5–200, Abschlussbonus 500; Liste siehe [quests.md](quests.md#daily-quests). Wiki-Liste summiert **1.575**; Fließtext sagt „bis zu 3.000/Tag“ | LEGACY | OBSERVED · MEDIUM · [S72:Quests] |
| Challenges | Belohnung „Extra Gems“ 100 | LEGACY/RR | OBSERVED · HIGH · [S72:Challenges] |
| Level-Milestones | **500 je 5 Level** (Level 5 bis 100), zusammen 10.000 | RR (ab Update 19) | OBSERVED · HIGH · [S72:Level Milestones, S72:Update Log] |
| Battle Pass | Free 5.250, Premium zusätzlich 15.750 (Lily Hunt) | LEGACY (Update 18) | OBSERVED · HIGH · [S72:Battlepass] |
| Time Machine | 3 Gems / 150 s = 72/h; VIP **oder** Premium 144/h; VIP **und** Premium laut Tabelle 2.304 je 8 h (= 288/h) | LEGACY; deaktiviert seit Update 19/19.5 | OBSERVED · HIGH · [S72:Time Machine] |
| Codes | meist 500, Sondercodes 1.500–2.500 (ANNIVERSARY 2.500, APRILFOOLS 1.500) | LEGACY + RR | OBSERVED · HIGH · [S72:Codes] |
| Holiday-Login-Kalender | 250 oder 500 je Tag (plus Reroll Tokens, 1.000 Stars) | Christmas 2022, Update 19 | OBSERVED · MEDIUM · [S72:Events, S72:Update Log] |
| Raids, Infinity Castle, Events, Tournaments | Gems vorhanden; Werte siehe [raids.md](raids.md) und [game-modes.md](game-modes.md) | – | OBSERVED · MEDIUM |
| Robux | Gem-Pakete; Preise **UNKNOWN** | – | OBSERVED (Existenz) · [S72:Currencies] |

### Sinks

| Sink | Preis | Tag |
|---|---|---|
| Summon | 50 (VIP 40) | OBSERVED · HIGH · [S72:Summon] |
| Umtausch in Legacy Gems (RR) | Kurs UNKNOWN | OBSERVED · HIGH · [S72:Summon] |
| Travelling Merchant | Star Fruits 50–300, Luck Potion 200, Star Remnant 400, Evo-Items 1.850–8.000, Rikugan/Peerless Eye 5.000 (Liste in [items.md](items.md#travelling-merchant)) | OBSERVED · HIGH · [S72:Travelling Merchant Shop] |
| Trade-Tax | 50–6.000 je Item (Tabelle in [items.md](items.md#trade-tax)) | OBSERVED · HIGH · [S72:Trading] |
| Dungeon-Keys | Cursed Parade 175 Gems (alternativ 1.750 Gold); Heavenly Invasion 175, Shiny-Key 500 | OBSERVED · HIGH · [S72:Items] |
| Summer Portal | 200 Gems im Summer-Event-Shop | OBSERVED · HIGH · [S72:Items] |

**Limit / Handel:** Gems sind nicht handelbar; ein Gem-Cap ist nicht belegt. OBSERVED · MEDIUM

### Gem-Farm-Raten

| Aktivität | Gems | Zeit | Gems/h | Tag |
|---|---:|---|---:|---|
| Time Machine (LEGACY) | 72/h | passiv | 72 (144 VIP oder Premium; 288 beide) | OBSERVED · HIGH · [S72:Time Machine] |
| Namek Infinite bis W24, dann alles verkaufen (Trello-Methode, Jan. 2023) | 97 | 11–12 min | ≈ 485–530 | OBSERVED · MEDIUM · [S73 „Gem Grind“]; Rate DERIVED |
| Daily Quests + Infinite-Dailies | ≤ 1.575 + 600 | UNKNOWN | – | DERIVED |
| Level 5 → 100 | 10.000 einmalig | – | – | DERIVED |
| Center-Pity (RR) | 20.000 | – | – | DERIVED; E[Gems bis Center] = 15.245, siehe [summoning.md](summoning.md#mathematik) |

Widerspruch Time Machine: „24 h mit VIP **und** Premium = 4.608“ passt nicht zu 2.304 je 8 h (das wären 6.912). → `unknowns_P8`

## 3. Weitere Währungen und Ressourcen

| Ressource | Quellen | Verwendung (Sinks) | Limit | Handelbar | Tag |
|---|---|---|---|---|---|
| **Gold** | Units im Inventar verkaufen (Menge je Rarity UNKNOWN), Events, Extra-Gold-Challenge (200), Battle Pass (Free 6.000, Premium 18.000) | Gold-Shop (XP-Food, Star Fruits, Summon Ticket 500, Raid-Tickets 1.500/2.500); Crafting 200–10.000 je Item (S68 `crafting_cost`); Storage-Ausbau 50.000/75.000/100.000; Cursed-Parade-Key 1.750 | UNKNOWN | nein | OBSERVED · HIGH · [S72:Currencies, S72:Items, S68, S72:Battlepass] |
| **Trophies** | UNKNOWN (vermutlich Tournament/PvP) | Emotes (Trophy-Shop) | UNKNOWN | nein | OBSERVED · HIGH · [S72:Currencies, S72:Update Log] |
| **Legacy Gems** (RR) | Gems umtauschen; Legacy-Units „disenchanten“ | Legacy-Banner | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Summon, S72:Update Log 19] |
| **Star Remnants** | Merchant 400 Gems; Challenges 1–2; Daily Challenge 10–50; Weltkapseln 15 %; Summons („low chance“); Shiny-Entfernung bei Legendary/Mythic (Menge UNKNOWN); Codes 1–50 | Trait würfeln/neu würfeln | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Items, S72:Challenges, S68, S72:FAQ, S72:Codes] |
| **Reroll Tokens** | Battle Pass (Free 11, Premium 44), Level-Milestones (2 bzw. 5 je 5 Level), Disenchant, Holiday-Kalender, Evolve-Quests | Trait-Reroll | UNKNOWN | **UNKNOWN** (Trading-Seite nennt sie nicht) | OBSERVED · HIGH · [S72:Battlepass, S72:Level Milestones, S72:Update Log] |
| **Star Fruits** (normal / Rot / Grün / Blau / Pink / Rainbow) | Merchant (50 / 200 / 200 / 200 / 200 / 300 Gems), Gold-Shop, Star-Fruit-Challenges (bis 7 zufällige, 1 Rainbow), Kapseln | Crafting von Evo-Items | **100** normal, **75** je Farbe, **25** Rainbow | UNKNOWN | OBSERVED · HIGH · [S72:Items, S72:Travelling Merchant Shop, S72:Challenges] |
| **Stat Cube** | Daily Challenge (2–3), Battle Pass Free (2 × 3), Evolution | alle Potentials neu würfeln (NPC Beeruh) | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Challenges, S72:Battlepass, S68] |
| **Perfect Stat Cube** | Daily Challenge (Chance auf 1), Battle Pass Premium (2), Evolution | ein Potential gezielt neu würfeln | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Challenges, S68] |
| **Divine Wish** | Milestone Level 100 | Limit Break (mit 12 Mythic-Punkten: unevolved 1, evolved 2) | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Level Milestones, S72:Update Log 19] |
| **Cursed Token** | Cursed-Womb-Dungeon | Curse anwenden; Evolution Itukoda | **20** (+1 Indestructible) | UNKNOWN | OBSERVED · HIGH · [S72:Items] |
| **Cursed Finger** | Battle Pass (Free 2, Premium 4) | Curses | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Battlepass] |
| **XP-Food** (17 Sorten) | Story-Acts, Gold-Shop, Infinite, Portale | Unit-XP (25 bis 3.450 XP je Stück) | **1.000 je Sorte** | UNKNOWN | OBSERVED · HIGH · [S72:Items, S68] |
| **Summon Ticket** | Merchant/Gold-Shop 500 Gold, Kapseln (21 %), Login Tag 6, Codes | 1 Summon | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Items, S68, S73] |
| **Luck Potion** | Merchant 200 Gems, Login Tag 7 | Luck-Boost | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Items] |
| **Raid-/Welt-Shards** (Tailed Beast, Path, Blazing, Fire, Soul, Chimera, Celestial, Cursed Shard; Power Cell) | Raid- und Weltkapseln (garantiert 2–10), West-City-Raid | Raid-/Event-Shops | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Items, S68] |
| **Relic-Materialien** (Relic Shard, Ore/Ingots, Holy Sprig …) | Legend Stages, Crafting | Relic-Crafting beim NPC Golden King | UNKNOWN | UNKNOWN | OBSERVED · HIGH · [S72:Items, S68] |
| **Event-Währungen** (Candies, Stars, Pearls, Grief Seeds, Assassin Tokens, Gun Devil Bullets, AprilCoins, Jewels) | Event-Modi, Quests, Codes | Event-Shop (Kapseln 150, Evo-Items 5.000–10.000), Event-Banner (10 je Summon) | Event-Dauer | UNKNOWN | OBSERVED · HIGH · [S72:Currencies, S72:Events] |
| **Battle-Pass-Punkte** | 4–15 je Gegner-Kill, Daily-Quest-Abschluss (+500) | Battle-Pass-Tiers | – | nein | OBSERVED · HIGH · [S72:Battlepass, S72:Quests] |
| **Spieler-XP** | 50 je Story-Clear, weitere UNKNOWN | Level, Milestones, Banner-Tiers | – | nein | OBSERVED · HIGH · [S72:Quests] |

## 4. Shops

| Shop / NPC | Mechanik | Tag |
|---|---|---|
| **Travelling Merchant** (Lobby, neben Summon) | **60 min offen**, dann **30 min geschlossen**, danach **bis zu 3 neue Items**; Bezahlung in Gems oder „coins“ (Gold, z. B. Summon Ticket 500 Gold). Preisliste in [items.md](items.md#travelling-merchant) | OBSERVED · HIGH · [S72:Travelling Merchant Shop, S73] |
| Merchant RR | seit Update 19 alle Evolution-Items aus dem Sortiment entfernt | OBSERVED · HIGH · [S72:Travelling Merchant Shop] |
| **Gold-Shop** (seit Update 7) | XP-Food, Star Fruits, Summon Tickets, Raid-Tickets; **restockt täglich** | OBSERVED · HIGH · [S72:Update Log 7, S72:Currencies] |
| **Bartender** | Unit- und Skin-Slots gegen Gold: 150 (50.000), 200 (75.000), 250 (100.000); seit Update 10.7.5 | OBSERVED · HIGH · [S72:Currencies] |
| **Red Scar** (LEGACY) | Raid-Tickets 1.500 bzw. 2.500 Gold; seit 10.7.5 entfernt und erstattet | OBSERVED · HIGH · [S72:Items] |
| **Golden King** | Relic-Crafting | OBSERVED · HIGH · [S72:Items] |
| **Beeruh** | Stat Cubes einlösen | OBSERVED · HIGH · [S68] |
| **Prayer Master** | Level-Milestones abholen | OBSERVED · HIGH · [S72:Level Milestones] |
| **Gambler** | Dungeon-Keys; täglich ein Gratis-Key als Login-Belohnung (Update 20) | OBSERVED · MEDIUM · [S72:Update Log] |
| **Event-Shop** (NPC Navi/Weather Girl) | Event-Kapseln 150, Evo-Items 5.000–10.000 Event-Währung | OBSERVED · HIGH · [S72:Events] |
| Raid-Shops, Makimo-Store, Hurbis-Store, Trophy-Shop | je eigene Währung | OBSERVED · MEDIUM · [S72:Items, S72:Currencies, S72:FAQ] |

Basis-Storage ohne Ausbau: wahrscheinlich 100 (erste Gold-Stufe führt auf 150, Gamepass +100). RECONSTRUCTED · MEDIUM

## Gamepasses

Nur Systembeschreibung. Preise und Texte aus der offiziellen Roblox-Gamepass-API. VERIFIED · HIGH · [S75]

| Gamepass | Robux | Effekt (RR, offiziell) | LEGACY-Abweichung |
|---|---:|---|---|
| VIP | 299 | Summon-Kosten −20 % (40 statt 50 Gems), exklusiver Nametag, **+10 % XP** | Wiki (LEGACY): statt XP-Bonus „Time Machine +100 %“ [S72:Store] |
| Shiny Hunter | 1.299 | Shiny-Chance ×3 (1 % → 3 %) | – |
| Unit Storage | 99 | +100 Unit-Storage | – |
| Display 3 Units | 199 | die ersten 3 ausgerüsteten Units begleiten den Spieler in der Lobby | – |
| Display All Units | 699 | Showcase-Slots für alle Loadout-Slots | – |

Weitere Robux-Produkte (Systembeschreibung, OBSERVED · HIGH · [S72:Store, S72:Items]):

| Produkt | Robux | Effekt |
|---|---:|---|
| Super Lucky | 99 | Legendary/Mythic ×2 für ein Banner |
| Ultra Lucky | 149 | Legendary/Mythic ×3 für ein Banner |
| Spooky Bundle #1 / #2 | 3.999 / 5.999 | 50 bzw. 75 Trait-Rerolls, 30.000 bzw. 60.000 Candies, 10 bzw. 20 Spooky Stars |
| Shiny Key (Cursed Parade) | 99 | Dungeon mit doppelter Drop-Chance |
| Key (The Fire) | 499 | Dungeon-Zugang |
| Cursed Womb Key | 199 | OBSERVED · LOW · [S56] (in S72 nicht bestätigt) |
| Battle Pass Premium, Skip-Tiers (seit Update 10.5 verschenkbar), Gem-Pakete | UNKNOWN | – |

Roblox Premium verdoppelte die Time-Machine-Gems (stapelbar mit VIP). OBSERVED · HIGH · [S72:Time Machine]

## 5. Wirtschaftskreislauf (Zusammenfassung)

```text
            ┌──────────── Gems ────────────┐
 Story/Inf/Quests/Raids/Codes/Milestones/BP │
            ▼                              ▼
         Summon ──► Units ──► Gold (Verkauf) ──► Gold-Shop/Crafting/Storage
            │          │
            │          ├─► Evolution ◄── Star Fruits (Merchant/Gold/Challenges) + Evo-Items (Crafting/Merchant)
            │          ├─► Trait-Reroll ◄── Star Remnants / Reroll Tokens
            │          ├─► Potential-Reroll ◄── Stat Cubes + Worthiness (Takedowns)
            │          └─► Limit Break ◄── Divine Wish + 12 Mythic-Punkte
            └─► Pity (400, RR: Center-Featured; Reset bei jedem Mythic und stündlich)
```
RECONSTRUCTED · HIGH

## Für unseren Nachbau

- DESIGN: Start-Yen, Kill-Yen und Wave-Yen sind in AA nicht dokumentiert. Vorschlag: Start-Yen und Wave-Bonus so wählen, dass eine Farm (Payback 3–4 Waves wie in AA) ab Wave 2–3 sinnvoll ist; Kill-Yen proportional zur Gegner-HP. Diese Werte als `DESIGN` in der Konfiguration führen.
- DESIGN: Verkaufswert global 25 % (AA-Standard) mit Flag `unsellable` je Unit.
- DESIGN: Lagerlimits wie AA als Konfiguration je Item (`maxStack`).
