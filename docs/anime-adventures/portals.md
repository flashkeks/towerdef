# Portal-System

Legende der Tags und Versionskürzel: siehe [README.md](README.md#kennzeichnung). `S72:<Seite>` = Fandom-Wiki-Volltext, `S68` = Item-Datenmodul, `S65` = Unit-Datenmodul.

> **Namen:** Die Portals-Seite nutzt teils Legacy-Unit-Namen (Pain, Homuru, Flamingo, Gilgamesh, Poseidon, Boron, Dazai), die Seite *Secret Portal* die RR-Namen (Agony, Shadowgirl, Stringy, Golden King, Sea God, Alien King, InHuman). Die Zuordnung in der Secret-Tabelle unten ergibt sich aus gleichem Portalnamen: RECONSTRUCTED · HIGH.

## Grundprinzip

| Aspekt | Wert | Tag |
|---|---|---|
| Was ist ein Portal? | ein **Inventar-Item** (Portals-Tab), das eine besondere Stage öffnet | OBSERVED · HIGH · [S09 → S72:Portals] |
| Erwerb | Drop aus Infinite bestimmter Welten, aus Legend Stages, aus anderen Portalen (Ketten), aus Events, Kauf (z. B. Contracts, NPC-Shops), Crafting aus 4 Shards/Dice | OBSERVED · HIGH · [S72:Portals, S72:Secret_Portal, S68] |
| Belohnungen | Evolution-Materialien, XP-Food, exklusive Units, **weitere Portale** derselben Art, Event-Währung, Chance auf ein **Secret Portal** | OBSERVED · HIGH · [S72:Portals] |
| Tier („Variability“) | Jedes Portal hat ein Tier. Die Portals-Seite nennt die mögliche Spanne als „Variability“, z. B. 0 → 5 (Devil), 1 → 12 (Frozen, Port Agency), 0 → 12 (Demon Academy). Story-basierte Portale haben nur Tier 1 | OBSERVED · HIGH · [S72:Portals] |
| Tier-Wirkung | höheres Tier = schwerer **und** mehr Belohnung. Event-Portale bekommen pro Tier Challenges zugewiesen; Mengen werden mit einem „portal rewards multiplier“ multipliziert | OBSERVED · HIGH · [S72:Portals, S72:Events] |
| Tier-Multiplikator (Zahlen) | UNKNOWN | UNKNOWN |
| Tier-Maps | Beispiel Witch Portal: Tier 0–4 auf **zufälligen Maps**, Tier 5–11 auf **Witch City** | OBSERVED · HIGH · [S72:Portals] |
| Tier im Datenmodell | Kauf-Items mit `usage.type = "generate_portal"` erzeugen ein Portal mit `portal_depth` (= Tier/Rank) und `portal_item` (Portaltyp) | OBSERVED · HIGH · [S68 `csm_contract_0…5`] |
| Gegner-Affinität | das Portal zeigt die Gegnerschwäche als Icon; passende Units benutzen | OBSERVED · HIGH · [S12 → S72:Damage_Affinities_Elements] |
| Yen-Verteilung | manche Portale nutzen eine „Infinite-Mode-orientierte“ Yen-Verteilung, andere die normale (Wave-20-Portale) | OBSERVED · MEDIUM · [S72:Effects] |
| Inventarlimit | **200 Portale**. Wer beim Craften eines Secret Portals voll ist, kann es verlieren (Wiki rät zu ≤ 199/200) | OBSERVED · MEDIUM · [S72:Time_Traveller_s_Shard] |
| Verbrauch | Das Portal wird beim Öffnen verbraucht. Belegt nur indirekt: Ein Katana-Portal „replaces said portal“ | RECONSTRUCTED · HIGH · [S72:The_Katana_Devil_Portal] |
| Host | Spieler, der das Portal einsetzt; andere können beitreten | OBSERVED · HIGH · [S10 → S72:Secret_Portal] |
| Replay | seit Update 13.5: der Host kann nach dem Clear ein weiteres Portal derselben Gruppe auswählen | OBSERVED · HIGH · [S72:Update_Log] |
| Fail | Ob das Portal bei einer Niederlage verloren geht: UNKNOWN | UNKNOWN |
| Drop-Boost | Event-Units und -Skins erhöhen Drops, Damage und Secret-Portal-Chance (nur im Event); Beispiele siehe [Secret-Chancen](#drop-chancen-und-garantien) | OBSERVED · HIGH · [S72:Events] |

## Bekannte Portale

### Laut Wiki „obtainable“ (Stand RR)

| Portal | Update | Map | Tiers | Erwerb | Drops | Tag |
|---|---|---|---|---|---|---|
| Shibuya Portal | 20 (RR) | Shibuya District | 1 | Shibuya-Infinite | Sacred Treasure **5–15** (Host/Nicht-Host unbestätigt); Secret-Portal-Chance für Sorcerer Killer (siehe unten) | OBSERVED · HIGH · [S72:Portals] |
| Final Disc | 8 | Cape Canaveral (New Moon) | 1 | **6 Final Disc Fragments** (1 pro Space-Center-Legend-Clear) | Heavenly Clock; Stone Pendant 1–6 | OBSERVED · HIGH · [S72:Portals, S68] |
| Alien Portal | 10 | Alien Spaceship (Final) | 1 | Alien-Spaceship-Infinite | Full Power Core **1–4**, Alien Core **1–6** | OBSERVED · HIGH · [S72:Portals] |
| Demon Leader's Portal | 11.5 | Fabled Kingdom (Cube) | 1 | Fabled-Kingdom-Legend-Stages (**20 %**) und -Infinite | Sunshine Essence, Tavern Pie 1–6, Demonic Spellbook | OBSERVED · HIGH · [S72:Portals, S72:Legend_Stages] |
| Puppet Portal | 13 | Puppet Island (Birdcage) | 1 | Puppet-Island-Infinite | SMILE Fruit **1–4**, Pirate Grapes 1–6 | OBSERVED · HIGH · [S72:Portals] |
| Eclipse Portal | 15 | The Eclipse | 1 | Windhym-Infinite | Egg of Sacrifice **1–2 (Mitspieler) / 2–4 (Host)**, Coin Bag 2–8 | OBSERVED · HIGH · [S72:Portals] |
| Noble Portal | 17 | Mountain Temple | 1 | **Mountain-Temple-Infinite** | Lesser Grail **5–20**, Jewel Pendant 1–6 | OBSERVED · HIGH · [S72:Portals] |
| Path Portal (Item-Rarity *Secret*) | 18 | Rain Village | 1 | Rain-Village-Legend-Stages (Chance „???“) | **Pain/Agony (Path) 100 % für Host**; Ninja Scroll 3–6 (6–12 mit max. Boost); Chakra Rod 2 | OBSERVED · HIGH · [S72:Portals, S68] |
| Winter Portals | 19 (RR) | Winter-Map | 2 | Winter-Event (Frozen Abyss) | Secret-Portale Enlightenment und The Fallen Star | OBSERVED · HIGH · [S72:Portals] |

### Nicht mehr erhältlich (Legacy-Events u. a.)

| Portal | Update | Map | Tiers | Erwerb | Drops | Tag |
|---|---|---|---|---|---|---|
| Frozen Portal | Christmas 2022 | 6 Frozen-Story-Maps | 1 → 12 | Event | Frozen Portal 1–2; ~100 Stars × Multiplikator; XP-Food 1–6; **Frost Queen's Portal** (geringe Chance, ab Tier 3) | OBSERVED · HIGH · [S72:Portals, S72:Events] |
| Devil Portal | 9 | Devil City | 0 → 5 | Devil Hunter Contracts Rank 0–5 (NPC Makimo) | Gun Devil Bullet 3–4 × Multiplikator; Devil Star (gering); **Katana Devil Portal** (gering, nur Tier 5); Stone Pendant 1–6 | OBSERVED · HIGH · [S72:Portals, S68] |
| Demon Academy Portal | 12.05 (April Fools 2023) | zufällige Maps | 0 → 12 | Event | Demon Academy Symbol; Demon Academy Portal 0–2; exklusive Challenge-Modifikatoren (siehe [game-modes.md](game-modes.md#challenges)) | OBSERVED · HIGH · [S72:Portals, S72:Challenges] |
| Witch Portal | 13.5 | T0–4 zufällig, T5–11 Witch City | 1 → 11 | Event | Grief Seed; **Time Traveller's Shard** (sehr selten, nur ab Tier 5) | OBSERVED · HIGH · [S72:Portals, S72:Time_Traveller_s_Shard] |
| Summer Portal | 15.5 | 7 Sommer-Maps (u. a. Alien Spaceship Underwater) | 1 → 11 | Event (Pearls) | Summer Portal 1–2; ~100 Pearls × Multiplikator; Soul Candy 1–6; **Sea God's Portal** (sehr gering, ab Tier 3) | OBSERVED · HIGH · [S72:Portals, S72:Events] |
| Port Agency Portal | 17.5 | Sky Club | 1 → 12 | NPC Dazai | **Detective Shard ~2,5 % (5 % mit max. Boost, Schätzung)**; Supernatural Book 1–12 (1–25 mit max. Boost); Soul Candy 1–6 | OBSERVED · MEDIUM · [S72:Portals] |
| Alien Portal (Variante) | 10 | Alien Spaceship (Final) | 1 | – | Boron/Alien King (garantiert für Host) | OBSERVED · MEDIUM · [S72:Portals] |

Hinweis: Für Summer Portals nennt die Events-Seite „tiers 1-12“, die Portals-Seite „1 → 11“. Konflikt in unknowns.

## Secret Portals

| Aspekt | Wert | Tag |
|---|---|---|
| Natur | zeitlich begrenzte Portale, die eine Secret-Unit droppen | OBSERVED · HIGH · [S10 → S72:Secret_Portal] |
| Spielerzahl | **bis zu 6 Spieler** | OBSERVED · HIGH · [S72:Secret_Portal] |
| Secret-Unit-Chance Host | **100 %** | OBSERVED · HIGH · [S72:Secret_Portal, S72:The_Ice_Queen_Portal, Unit-Seiten] |
| Secret-Unit-Chance Mitspieler | **5 %** | OBSERVED · HIGH · [S72:The_Ice_Queen_Portal, S72:The_Katana_Devil_Portal] |
| Ausnahme | Infinity Mage (Update 14) ist die einzige Secret-Unit, die direkt aus einem **normalen** Portal droppt | OBSERVED · HIGH · [S72:Infinity_Mage] |

### Erwerbswege

| Weg | Beispiele | Tag |
|---|---|---|
| Zufallsdrop aus Basis-Portal | Frozen → Frost Queen's (ab Tier 3); Summer → Sea God's (ab Tier 3); Devil Tier 5 → Katana Devil (ersetzt das Portal) | OBSERVED · HIGH · [S72:Events, S72:The_Katana_Devil_Portal] |
| 4 Teile craften | 4 Time Traveller's Shards → Witch City (Walpurges); 4 Detective Shards → Detective Portal; 4 Death Dice → Deception Portal | OBSERVED · HIGH · [S72:Time_Traveller_s_Shard, S72:Portals, S72:Contracts] |
| Drop am Event-Ende | Frozen Abyss (50 Waves) → Enlightenment oder The Fallen Star | OBSERVED · HIGH · [S72:Update_Log, S72:Events] |
| Drop aus Stage | Rain-Village-Legend → Path Portal; Shibuya Portal → Restriction Portal | OBSERVED · HIGH · [S72:Portals, S72:Sorcerer_Killer] |

### Liste der Secret Portals

| Secret Portal | Basis / Erwerb | Secret-Unit (RR-Name / Legacy-Name) | Status | Tag |
|---|---|---|---|---|
| Deception Portal | 4 Death Dice (Assassin Contracts) | Switchblade | erhältlich | OBSERVED · HIGH · [S72:Secret_Portal] |
| Restriction Portal | Shibuya | Sorcerer Killer | erhältlich | 〃 |
| Frost Queen's Portal | Frozen Portal | Ice Queen | weg seit Update 11 | 〃 |
| Devil Katana | Devil Portal Tier 5 | Blade Beast (Past) / Denjy | weg seit Update 12 | 〃 |
| Alien King's Portal | Alien Portal | Alien King / Boron | weg seit Update 13 | 〃 |
| Witch City (Walpurges) | 4 Time Traveller's Shards | Shadowgirl / Homuru | weg seit Update 15.5 | 〃 |
| String Portal | Puppet Island (Birdcage) | Stringy / Flamingo | weg seit Update 16 | 〃 |
| King's Portal | The Eclipse: Wings of Darkness | Skeleton Knight / Skull Knight | weg seit Update 17 | 〃 |
| Sea God's Portal | Summer Portal | Sea God / Poseidon | weg seit Update 17 | 〃 |
| Golden Portal | Mountain Temple | Golden King / Gilgamesh | weg seit Update 18.5 | 〃 |
| Detective Portal (Sky Club) | 4 Detective Shards | InHuman / Dazai | weg | 〃 |
| Rain Village (Path Portal) | Rain-Village-Legend | Agony (Path) / Pain | weg seit Update 20 | 〃 |
| The Fallen Star Portal | Frozen Abyss | Dark Mage | weg seit Update 20.4.1 | 〃 |
| Enlightenment Portal | Frozen Abyss | Enlightened | weg seit Update 20.4.1 | 〃 |

### Drop-Chancen und Garantien

| Drop | Chance | Art | Tag |
|---|---|---|---|
| Secret-Unit im Secret Portal | Host 100 %, Mitspieler 5 % | Wiki-Angabe | OBSERVED · HIGH · [S72:The_Ice_Queen_Portal] |
| Time Traveller's Shard (Witch Portal ≥ T5) | „geschätzt“ **~3 %**, bis zum Summer-Update um 50 % auf **4,5 %** erhöht; skaliert vermutlich nicht mit dem Tier | Community-Schätzung | OBSERVED · LOW · [S72:Time_Traveller_s_Shard] |
| Time Traveller's Shard (aus Walpurges) | **~5 %** vor dem 23.07.2023, danach **~7,5 %** | Community-Schätzung | OBSERVED · LOW · [S72:Portals] |
| Detective Shard (Port Agency / Detective) | ~2,5 %, mit max. Boost 5 % | Schätzung | OBSERVED · LOW · [S72:Portals] |
| Restriction Portal | ~**1 %** („believed“) | Schätzung | OBSERVED · LOW · [S72:Sorcerer_Killer] |
| The Fallen Star Portal | **< 1 %** | Schätzung | OBSERVED · LOW · [S72:Dark_Mage_(Fallen_Star)] |
| Frost Queen's / Sea God's / Katana Devil | „low“ / „very low“ / „slight“ chance | qualitativ | OBSERVED · MEDIUM · [S72:Portals, S72:The_Katana_Devil_Portal] |
| Demon Leader's Portal (Fabled-Legend) | **20 %** | Wiki-Tabelle | OBSERVED · HIGH · [S72:Legend_Stages] |
| Path Portal (Rain-Village-Legend) | „???“ | – | UNKNOWN |
| Death Dice (Assassin Contracts) | steigt mit Contract-Tier; Wert UNKNOWN | – | UNKNOWN |
| Event-Boosts | Winter 2024: Units +20 % / +40 %, Skins +2 % … +40 %; Assassin: +20 % pro Unit, +40 % evolviert, max. +100 % | Wiki-Angabe | OBSERVED · HIGH · [S72:Events] |

Ob die Boosts additiv auf die Basis-Chance wirken (z. B. 1 % × (1 + 1,0) = 2 %) oder anders verrechnet werden, ist UNKNOWN. Die Obergrenze „max. +100 %“ spricht für einen additiv aufsummierten Multiplikator (RECONSTRUCTED · LOW).

### Portal-Wahrscheinlichkeiten (DERIVED)

- **Craft-Weg (4 Teile, Chance `p` pro Clear):** Erwartete Clears = `4/p` (negativ-binomial). Time Traveller's Shard: 4/0,03 = **133** bzw. 4/0,045 = **89** Clears. Detective Shard: 4/0,025 = **160**, mit max. Boost 4/0,05 = **80** Clears.
- **Einzel-Drop `q`:** Erwartete Basis-Clears bis zum Secret Portal = `1/q`. Restriction Portal bei ~1 %: **100** Shibuya-Portal-Clears; P(≥1 in 100) = `1 − 0,99^100` = **63,4 %**. Fallen Star (< 1 %): **> 100** Frozen-Abyss-Runs à ~40 min, also > 66 h.
- **Mitspieler in fremden Secret Portals:** P(≥1 Secret-Unit in n Teilnahmen) = `1 − 0,95^n`. n = 14 → **51,2 %**, n = 45 → **90,1 %**.
- **Party-Erwartung pro Secret-Portal-Run** (Host + 5 Mitspieler) = `1 + 5 × 0,05` = **1,25** Secret-Units.
- **Demon Leader's Portal:** 20 % pro Legend-Clear → im Mittel 5 Clears.

## Datenmodell (siehe [technical-reconstruction.md](technical-reconstruction.md#datenmodell))

Feldnamen mit `*` sind im AA-Item-Modul belegt (S68). Der Rest ist DESIGN.

```text
PortalItem   { itemId, portalType*(portal_item), tier*(portal_depth), mapId?, modifiers[], affinity: {weak, resist} }
GeneratorItem{ usage: { type*: "generate_portal", portal_item*, portal_depth* }, use_on_purchase*, rankRequired }
PortalType   { tierRange: [min, max], mapPoolByTier: [{tiers, maps}], challengesByTier, rewardMultByTier,
               dropTable: [{item|unit, min, max, chance, hostOnly}], secretPortal: {type, chance, minTier} }
SecretCraft  { shardItem, count: 4, result: secretPortalType }
Inventory    { portals: max 200 }
```

DESIGN-Hinweis: `hostOnly` und eine separate `nonHostChance` (AA: 5 %) machen das Host-Prinzip abbildbar. Für unseren Nachbau empfiehlt sich eine sichtbare Pity für Secret Portals (z. B. Zähler über Teile), weil reine 1-%-Drops ohne Garantie lange Durststrecken erzeugen.
