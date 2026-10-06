# Items und Crafting

Stand: Sitzung 2 (P8). Grundlage: `S72:Items`, `S72:Travelling Merchant Shop`, `S72:Trading`, `S72:Challenges`, das Item-Datenmodul S68 (`Module:ItemData/Data`, 278 Einträge, Stand 2025-04-03) und Trello S73. Maschinenlesbar: [data/items.json](data/items.json). Evolution-Rezepte (Unit → Evo) stehen in [evolution.md](evolution.md).

## Datenmodell im Original (S68)

Jedes Item hat `id`, `name`, `rarity` (Rare … Mythic), optional `item_group` (Evolution, Materials, XP Food, Stars, Keys, Portals, Relics), `description`, `obtain_info` und ggf.:

| Feld | Bedeutung | Anzahl Items |
|---|---|---:|
| `crafting_recipe` + `crafting_cost` | Zutaten + Gold-Kosten | 44 |
| `usage.type` | `capsule`, `xp_feed` (`xp_amount`), `boost` (`boost_type`, `boost_duration`), `reroll_trait` | 61 |
| `usage.possible_rewards[].chance` | Kapsel-Inhalt mit Wahrscheinlichkeit | 26 Kapseln |
| `usage.guaranteed_rewards` | garantierte Beigabe (`min_amount`/`max_amount`) | – |
| `_mythic_unit_pity` | Pity in Öffnungen bis zur garantierten Mythic-Unit | 4 |
| `usage_from_inventory` | aus dem Inventar benutzbar | 42 |

OBSERVED · HIGH · [S68]

## Item-Kategorien

| Kategorie | Beispiele | Verwendung | Tag |
|---|---|---|---|
| XP-Food | 17 Sorten, siehe unten | Unit-XP | OBSERVED · HIGH · [S72:Items, S68] |
| Star Fruits | Star Fruit, Rot, Grün, Blau, Pink, Rainbow (`StarFruitEpic`) | Crafting von Evo-Items | OBSERVED · HIGH · [S72:Items, S68] |
| Evolution-Items | 125 + 19 Crafting-Materialien im Modul (z. B. Golden Rose, Negation Box, Lesser Grail, Thunder Spears) | Evolution | OBSERVED · HIGH · [S68] |
| Shards und Materialien | Raid-/Welt-Shards, Power Cell, Infused Crystal, Peerless Eye, Cursed Orb, Worthy Soul, Final Disc Fragment, Lesser Grail | Shops, Crafting, Evo | OBSERVED · HIGH · [S72:Items] |
| Relic-Materialien | Relic Shard, Ore/Ingots (Steel), Holy Sprig, Empty Tome, Magic Scroll, Fairy Wings, Demonic Tail/Skull/Horns, Lost Chapter, Devil Heart, Tear Mask, Vivid Gem | Relic-Crafting (Golden King) | OBSERVED · HIGH · [S72:Items, S68] |
| Unit-Verbesserung | Star Remnant, Reroll Token, Stat Cube, Perfect Stat Cube, Divine Wish, Cursed Token, Cursed Finger | Traits, Potential, Limit Break, Curses | OBSERVED · HIGH |
| Tickets und Keys | Summon Ticket, Raid-Tickets (LEGACY, entfernt in 10.7.5), Dungeon-Keys (Cursed Parade, Cursed Womb, The Fire, Heavenly Invasion) | Zugang | OBSERVED · HIGH · [S72:Items] |
| Portale | siehe [portals.md](portals.md) | Zugang | OBSERVED · HIGH |
| Kapseln („Stars“) | Event-, Raid-, Welt-, Star-Fruit-Kapseln | Lootbox, siehe [summoning.md](summoning.md#event-kapseln-stars) | OBSERVED · HIGH · [S68] |
| Boosts | Luck Potion (30 min laut Modul, „pro Banner“ seit 10.5), Treasure Radar (Raid-Drops +100 %, aus Infinity Castle) | Summon-Luck, Drops | OBSERVED · HIGH · [S68, S72:Items] |
| Kosmetik | Skins, Emotes | – | OBSERVED · HIGH |

Korrektur zu Sitzung 1: **Celestial Tear** ist das Evo-Item für Jelly (+30 % Damage, Fähigkeit „Sema“), nicht „Zweck unbekannt“. OBSERVED · HIGH · [S72:Travelling Merchant Shop]

## Lagerlimits

| Item | Limit | Tag |
|---|---:|---|
| jede XP-Food-Sorte | 1.000 | OBSERVED · HIGH · [S72:Items] |
| Star Fruit | 100 | OBSERVED · HIGH · [S72:Items] |
| Star Fruit Rot/Grün/Blau/Pink | je 75 | OBSERVED · HIGH · [S72:Items] |
| Star Fruit Rainbow | 25 | OBSERVED · HIGH · [S72:Items] |
| Cursed Token | 20 (+1 Indestructible) | OBSERVED · HIGH · [S72:Items] |
| andere | UNKNOWN | UNKNOWN |

## XP-Food

| Item | XP | Hauptquelle (Story-Welt) | Tag |
|---|---:|---|---|
| Senzu Bean | 25 | Planet Greenie | OBSERVED · HIGH · [S68, S72:Items] |
| Mysterious Fluid | 50 | Walled City | dito |
| Wisteria Flower | 115 | Snowy Town | dito |
| Ramen Bowl | 250 | Hidden Sand Village | dito |
| Devil Fruit | 550 | Navy Bay | dito |
| Ghoul Coffee | 575 | Fiend City | dito |
| Soul Candy | 1.000 | Hollow World, Summer-Portale 2023 | dito |
| Cooked Fish | 2.160 | Ant Kingdom | dito |
| Magical Artifact, Curse Talisman (I/II), Magic Stone, Stone Pendant, Alien Core, Tavern Pie, Quirk Shard, Pirate Grapes, XP Potion, Coin Bag, Jewel Pendant, Chakra Rod | je 3.450 | spätere Welten bzw. Portale | dito |

Alle XP-Foods gibt es auch im Gold-Shop (Preise UNKNOWN) und über Infinite. Ein Level-100-Unit macht etwa ×9,204 Damage gegenüber Level 1. OBSERVED · HIGH · [S72:Items, S72:FAQ]

## Travelling Merchant

60 min offen, 30 min zu, danach bis zu 3 neue Angebote (siehe [economy.md](economy.md#4-shops)).

| Item | Preis | Zweck | Version | Tag |
|---|---:|---|---|---|
| Star Fruit | 50 Gems | Crafting | LEGACY/RR | OBSERVED · HIGH · [S72:Travelling Merchant Shop, S73] |
| Star Fruit Rot / Grün / **Blau / Pink** | je **200** Gems | Crafting | LEGACY/RR | OBSERVED · HIGH · [S72:Travelling Merchant Shop] |
| Star Fruit Rainbow | 300 Gems | Crafting | LEGACY/RR | OBSERVED · HIGH · [S72, S73] |
| Luck Potion | 200 Gems | Luck ×1,25 | LEGACY/RR | OBSERVED · HIGH · [S72, S73] |
| Star Remnant | 400 Gems | Trait | LEGACY/RR | OBSERVED · HIGH · [S72, S73] |
| Summon Ticket | 500 **Gold** | 1 Summon | LEGACY/RR | OBSERVED · HIGH · [S72, S73] |
| Rikugan Eye, Peerless Eye | 5.000 Gems | Limitless-Freischaltung | LEGACY | OBSERVED · HIGH · [S72] |
| Evo-Items (31 Sorten mit Preis) | 1.850–8.000 Gems | Evolution je einer Unit | LEGACY; seit Update 19 entfernt | OBSERVED · HIGH · [S72:Travelling Merchant Shop] |

Ausgewählte Evo-Item-Preise (Gems): Mermaid Scale 1.850; Shining Extract 2.000; Crystal Shards, Devil Ice 2.200; Cupcake, Ultrasteel Blade 2.250; Quincy Cross, Broken Puppet 2.350; Restraining Necklace, Divine Eye 2.500; Lightning Fiend's Horns 2.800; Demonic Wing 2.850; Hat of the Conqueror, Scales of the Salamander, Quake Fruit, King's Idol 3.000; Thread of the Exile, Spirit Spear, Crazy Dice, Gungi Set, Dragon Fire, Wolf Shadow, Cursed Wristwatch 3.500; Magma Fruit 4.500; Dark Katana, Spirit Crown 5.650; Forbidden Candy, Arsenal Briefcase, Negation Box, Soul Partition, Electric Yo-yo, Golden Rose 7.000; Celestial Key (Final) 7.250; Celestial Tear 7.500; Final Contract 8.000; Promise Ring, Cursed Orb (Maximum), Endless Tome, Sealed Fire Staff „???“. OBSERVED · HIGH · [S72:Travelling Merchant Shop]

| Zeitraum/Version | Item | alter Wert | neuer Wert | letzter bekannter Wert | Quelle |
|---|---|---:|---:|---:|---|
| Trello 2022-08 → Wiki 2025 | Shining Extract | 2.500 | 2.000 | 2.000 | S73 → S72 |
| Trello 2022-08 → Wiki 2025 | Ultrasteel Blade | 2.500 | 2.250 | 2.250 | S73 → S72 |

## Crafting

44 Items haben ein Crafting-Rezept im Modul (Liste vollständig in [data/items.json](data/items.json), Schlüssel `craftingRecipes`). Fast alle sind Evolution-Items aus Star Fruits plus Gold. OBSERVED · HIGH · [S68]

| Ergebnis | Gold | Zutaten | Tag |
|---|---:|---|---|
| Golden Rose (Neteru) | 7.500 | 32 Star Fruit, 10 Rot, 10 Grün, 5 Blau, 5 Pink, 3 Rainbow | OBSERVED · HIGH · [S68] (bestätigt S46) |
| Negation Box (Aizo) | 7.500 | 30 SF, je 8 Rot/Pink/Blau/Grün, 3 Rainbow | OBSERVED · HIGH · [S68] |
| Celestial Tear (Jelly) | 7.500 | 35 SF, 8 Rot, 10 Pink, 8 Blau, 7 Grün, 4 Rainbow | OBSERVED · HIGH · [S68] |
| Shining Extract (All Force) | 2.000 | 10 SF, je 3 Rot/Pink/Blau/Grün, 1 Rainbow | OBSERVED · HIGH · [S68] |
| Promise Ring (Yuto) | 7.500 | 200 Cursed Orb | OBSERVED · HIGH · [S68] |
| Endless Tome (Julio) | 7.500 | 12 Torn Page | OBSERVED · HIGH · [S68] |
| Mangekyō Eye (Relic) | 10.000 | 10 Relic Shards | OBSERVED · HIGH · [S68] |
| Endless Blades (Relic) | 10.000 | 10 Relic Shards | OBSERVED · HIGH · [S17] |
| Ingots (Steel) | 200 | 15 Ore (Steel) | OBSERVED · HIGH · [S68] |
| Hestia Knife (Bell) | 6.500 | 15 SF, je 3 Rot/Pink/Grün/Blau, 2 Rainbow | OBSERVED · MEDIUM · [S46] (nicht im Modul) |

Spanne: 2.000–10.000 Gold je Rezept. DERIVED · HIGH

**DERIVED – Gem-Wert eines Star-Fruit-Rezepts** zu Merchant-Preisen (SF 50, Farbe 200, Rainbow 300): Golden Rose = 32×50 + 30×200 + 3×300 = **8.500 Gems** + 7.500 Gold; der Merchant verkaufte das fertige Item für 7.000 Gems. Das typische Kiro-Bündel aus Sitzung 1 (12 SF + 4 Rot + 4 Pink + 3 Blau + 1 Rainbow) kostet 12×50 + 11×200 + 300 = **3.100 Gems**; die frühere Annahme „Blau = Pink = 200“ ist jetzt belegt. DERIVED · HIGH

## Kapseln (Lootboxen)

Inhalte und Wahrscheinlichkeiten stehen in [summoning.md](summoning.md#event-kapseln-stars). Kurzform:

| Typ | Beispiel | Inhalt | Pity |
|---|---|---|---|
| Event-Kapsel | Frozen/Haunted/Icy Star (150 Event-Währung) | Skins + 0,25 % Mythic-Unit | 400 |
| Garantie-Kapsel | Devil Star, Demon Academy Star, Mysterious Egg #1–3 | 1 Mythic-Unit sicher | – |
| Welt-Kapsel | Ocean/Soul/Chimera/Curse/Celestial Star | 2–5 Shards sicher, dazu Summon Ticket 21 %, Star Remnant 15 %, Star Fruits | – |
| Raid-Kapsel | Desert/Rumbling/Blazing Star | 6–10 Shards sicher, 2,5 % Raid-Unit | – |
| Star Fruit Capsule | – | SF 43 %, je Farbe 13,5 %, Rainbow 3 % | – |
| versiegelt | Sound Sealed, Ice Flower, Blood, Silver, Love Star (`_locked`) | „Required to obtain a special unit“ | – |

Welt- und Raid-Kapseln sind „nicht von Luck Boosts betroffen“. OBSERVED · HIGH · [S68]

## Trade-Tax

Trading ab Spielerlevel **40**, seit Update 6. Handelbar: Limited-Units, Skins, einige Relics (seit 11.7.5 auch nicht mehr erhältliche Limited-Units außer Battle-Pass-Units). Jeder Trade kostet Gems je Item:

| Item | Tax (Gems) | Tag |
|---|---:|---|
| Rare-Skin | 50 | OBSERVED · HIGH · [S72:Trading] |
| Epic-Skin | 100 | dito |
| Legendary-Skin | 200 | dito |
| Mythic-Skin | 2.000 | dito |
| Mythic-Relic | 2.000 | dito |
| Epic-Unit | 200 | dito |
| Legendary-Unit | 400 | dito |
| Mythic/Secret vor Evolution | 4.000 | dito |
| Mythic/Secret nach Evolution | 6.000 | dito |

Wer die Tax zahlt (einer oder beide Partner), ist UNKNOWN. Details zum Ablauf: [social.md](social.md).

## Für unseren Nachbau

- DESIGN: Item-Definitionen wie im Original datengetrieben (`usage.type`, `possible_rewards`, `guaranteed_rewards`, `pity`), damit Kapseln, XP-Food und Boosts ohne Sondercode laufen.
- DESIGN: Lagerlimits (`maxStack`) pro Item konfigurierbar.
