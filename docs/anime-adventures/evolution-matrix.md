# Evolution-Matrix (alle Rezepte)

Teil von [evolution.md](evolution.md). Hier steht die Gesamttabelle aller **219 Evolutionsrezepte** aus dem Wiki-Datenmodul `Module:UnitData/Data` (`evolve`-Block). Erzeugt per Python-Skript aus [`data/units.json`](data/units.json) und den Rohmodulen.

**Tag für die ganze Tabelle:** Rezeptdaten `OBSERVED · HIGH · [S65]` (RR-Stand 2026-03-18), Legacy-Abgleich `[S66]` (Stand 2023-12-14), Itemnamen `[S68]`. Spalte „×DMG“ ist `DERIVED` aus `levels` in `units.json`.

## Spalten

| Spalte | Bedeutung |
|---|---|
| Basis | RR-Anzeigename, in Klammern der LEGACY-Name, falls anders |
| Evolution | Ziel-Unit. Bei Zufalls-Evolution alle Ziele mit Modul-Chance |
| Rar. | Rarität Basis → Ziel (E = Epic, L = Legendary, M = Mythic, S = Secret) |
| Spezialitems | alle Nicht-Star-Fruit-Items (Name aus S68; fehlt er dort, steht die interne ID) |
| SF | Star Fruits **normal/Rot/Pink/Blau/Grün/Regenbogen**; „–“ = keine |
| + Units | zusätzlich zu opfernde Units **über die Basis-Unit hinaus** (die Basis selbst zählt immer als 1) |
| TD | Takedown-Anforderung an die Basis-Unit; „–“ = keine |
| Sonst. | Kills, Hogyoku-/Behelit-Fortschritt, Sonderbedingung (`_custom_requirements`), Rezept im UI versteckt, abweichendes Shiny-Rezept |
| Evo-Text | Kurztext aus dem Modul (`evolve_text`): Angriffsbonus und neue Fähigkeiten (Namen = AA-IP, nur Referenz) |
| ×DMG | `DERIVED`: Damage Evo ÷ Damage Basis auf **Stufe 0 / jeweiliger Maximalstufe** |
| Stufen | Anzahl Upgrade-Stufen Basis → Evo |
| Ver. | `L+RR` = Rezept schon im LEGACY-Endstand; `RR` = nur RR; `Δ` = Rezept im LEGACY anders (siehe [evolution.md](evolution.md#legacy-vs-rr-geänderte-rezepte)) |

## Tabelle

| Basis | Evolution | Rar. | Spezialitems | SF n/R/P/B/G/RB | + Units | TD | Sonst. | Evo-Text | ×DMG L0 / Max | Stufen | Ver. |
|---|---|---|---|---|---|---:|---|---|---|---|---|
| Agony (Path) (Pain (Path)) | Agony (Divine) (Pain (Divine)) | S→S | 50× Ninja Scroll (Fire), 50× Ninja Scroll (Water), 50× Ninja Scroll (Wood) | 12/4/3/4/0/1 | – | 7.500 | – | +35% Attack, +Shinra Tensei, +Planetary Devastation | 1,35 / 8,10 | 5→9 | L+RR |
| Akemy (Akena) | Akemy (Fallen Angel) (Akena (Fallen Angel)) | M→M | 1× Evil Queen's Piece | – | – | – | – | +30% Attack, +Elemental Fury | 1,30 / 2,79 | 5→8 | L+RR |
| Alien King (Boron) | Lord Alien King (Lord Boron) | S→S | 35× Full Power Core | 12/3/4/3/0/1 | – | 7.500 | – | +30% Attack, +Collapsing Star Roaring Cannon | 1,30 / 2,88 | 8→10 | L+RR |
| Ant (Meruam) | King Ant (King Meruam) | M→M | 2× Gungi Set, 40× Cooked Fish | – | – | – | – | +King Meruam | 1,30 / 1,30 | 8→8 | L+RR |
| Aquatic Mage (Noel) | Aquatic Mage (Valkyrie Armor) (Noel (Valkyrie Armor)) | M→M | 3× Mermaid Scale, 40× Magic Stone, 15× Enchanted Magic Stone, 15× Cursed Magic Stone | – | – | – | – | +30% Attack, +Sea Dragon's Roar | 1,30 / 1,98 | 7→9 | L+RR |
| Ariva | Ariva (Reaper) | M→M | 1× Arsenal Briefcase, 20× Ghoul Coffee | – | – | – | – | +35% attack, +Owl | 1,35 / 2,98 | 8→9 | L+RR |
| Ashborn (Shigaruko) | Ashborn (Decay) (Shigaruko (Symbol of Fear)) | M→M | – | 4/1/0/1/1/1 | – | 7.500 | – | +Evolve | 1,35 / 2,70 | 7→9 | L+RR Δ |
| Berserker (Guts) | Berserker (Rage) (Guts (Berserk)) | M→M | 50× Egg of Sacrifice | 12/5/4/3/4/1 | – | 7.500 | – | +50% Attack, +Guts (Berserk) | 1,50 / 3,17 | 7→10 | L+RR |
| Black Assassin | Black Assassin (Reaper) | M→M | 1× Electric Dagger | – | – | 0 | – | +30% Attack, +Thousand Volts | 1,30 / 2,60 | 5→8 | RR |
| Black Blade (Yamo) | Black Blade (Captain) (Yamo (Captain)) | M→M | 1× Dark Katana, 40× Magic Stone, 15× Enchanted Magic Stone, 15× Cursed Magic Stone | – | – | – | – | +50% Attack, +True Dark Dimension Slash | 1,50 / 1,50 | 9→9 | L+RR |
| Black Dog (Aku) | Black Dog (HellHound) (Aku (Rashamon)) | M→M | 500× Supernatural Book ² | – | – | 5.000 | – | +40% Attack, +Gate of Endless Jaws | 1,40 / 3,50 | 7→9 | L+RR |
| Blade Beast (Chainsaw) | Blade Beast (Hybrid) (Chainsaw (Hybrid)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +30% Attack, +Brutal Onslaught | 1,30 / 2,19 | 8→9 | L+RR |
| Blaze Frost (Todorro (Half)) | Blaze Frost (Released) (Todorro (Released)) | M→M | 1× Ice-Fire Orb | – | – | – | – | +40% Attack, +Flashfreeze Heatwave | 1,40 / 2,43 | 7→9 | L+RR |
| Blood (Power) | Blood (Unleashed) (Power (Fiend)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +40% Attack, +Bleed Amplification | 1,40 / 1,61 | 8→9 | L+RR |
| Bloodcry (Shallta) | Bloodcry (Fallen) (Shallta (Bloodfallen)) | M→M | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/4/3/4/0/1 | – | 7.500 | – | +35% Attack, +Einherjar, +Bleed Amplification | 1,35 / 2,43 | 5→7 | L+RR |
| Bodybuilder (Mash) | Bodybuilder (Muscles) (Mash (Muscles)) | M→M | 1× Dumbell ¹ | – | – | – | – | +50% Attack, +Magic Counter | 1,30 / 2,33 | 6→9 | L+RR |
| Brawler (Chad) | Brawler (Soul) (Chad (Fullbringer)) | M→M | 1× Rusted Coin | – | – | – | – | +35% Attack, +La Muerte | 1,35 / 1,93 | 6→8 | L+RR |
| Bro (Brulo) | Super Bro (Super Brulo) | M→M | 1× Restraining Necklace | – | – | – | – | +50% Saiyan Rage range, +25% Damage | 1,09 / 1,33 | 8→9 | L+RR |
| Bubblegum (Byu) | Bubblegum (Ultimate) (Byu (Ultimate)) | S→S | 400× Mage Mark | 12/3/3/2/2/1 | – | 7.500 | – | +30% Attack, +Assault Rain | 1,30 / 2,23 | 6→9 | L+RR |
| Bunny (Carrot) | Bunny (Night) (Carrot (Sulong)) | M→M | – | 32/0/10/12/8/3 | – | 2.500 | – | +40% Damage, +Carrot (Sulong), +Electro Stun | 1,12 / 1,40 | 8→8 | L+RR |
| Calm Killer (Kiro) | Calm Killer (Meets the End) (Kiro (Bites the Dust)) | M→M | 1× Stray Cat | 12/4/4/3/0/1 | – | 7.500 | – | +40% Attack, +Stray Cat, +Triple Detonation, +Bites the Dust | 1,40 / 3,45 | 7→10 | L+RR |
| Captain (Timeskip) (Usoap (Timeskip)) | Captain (God) (Usoap (God)) | M→M | 12× SMILE Fruit | 3/1/0/1/2/1 | – | 1.000 | – | +50% Attack, +Midori Boshi: Devil | 1,50 / 4,50 | 5→7 | L+RR |
| Carrot (Super III) (Goko (Super III)) | Carrot (Ultra) (Goko (Ultra)) | M→M | 400× Mage Mark | 12/2/2/3/3/1 | – | 7.500 | – | +35% Attack, +Super Spirit Bomb, +Fusion | 1,35 / 2,40 | 6→8 | L+RR |
| Cat Guard (Pito) | Cat Guard (Ballet) (Pito (Terpsichora)) | M→M | 3× Broken Puppet, 40× Cooked Fish | – | – | – | – | +30% Attack, 25% Crit, +Terpsichora | 1,30 / 1,46 | 8→9 | L+RR |
| Catgirl (Kuneko) | Catgirl (Hell-Cat) (Kuneko (Hell-Cat)) | M→M | 1× Evil Queen's Piece | – | – | – | – | +30% Attack, +Senjutsu Slashes | 1,30 / 2,31 | 5→8 | L+RR |
| Chance (Kit) | Chance (Frenzy) 25 % / Chance (Precision) 25 % / Chance (Lethal) 25 % / Chance (Focus) 25 % | M→S | 2× Crazy Dice, 1× Clown Effigy, 40× Cooked Fish | – | – | – | – | +20% attack, +Random Blessing | 1,20 / 1,20 | 4→4 | L+RR |
| Cherub (Albedo) | Cherub (Overseer) (Albedo (Overseer)) | M→M | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/4/3/4/0/1 | – | 7.500 | – | +50% Attack, +Nightmare Glare | 1,50 / 2,05 | 7→9 | L+RR |
| Chunks | Super Chunks | L→M | 1× Mini Time Machine | – | +1× Chunks | – | – | +260% Damage, +Heat Dome | 2,60 / 3,90 | 7→9 | L+RR Δ |
| Chuuni | Chuuni (Delusion) | M→M | 1× Sichel des Trugs | 12/3/5/0/4/1 | – | 7.500 | – | +30% Attack, +Twilight Fantasm, +Sovereign's Eye | 1,30 / 3,25 | 5→8 | RR |
| Cold Mage (Gray) | Cold Mage (Devil Slayer) (Gray (Devil Slayer)) | M→M | 3× Devil Ice, 40× Magical Artifact | – | – | – | – | +50% Damage, +Devil Slayer | 1,50 / 1,88 | 8→9 | L+RR |
| Connor (Conrod) | Connor (Wizard King) (Conrod (Wizard King)) | M→M | 1× conrad_sword | – | – | – | – | +40% Attack, +Doom's Gate | 1,40 / 4,20 | 5→8 | L+RR |
| Cotton (Charmi) | Cotton (Sheep) (Charmi (Sheep)) | M→M | 1× Magic Cutlery ¹ | – | – | – | – | +30% Damage, +Sleeping Sheep Strike, +Cotton Slow | 1,30 / 1,73 | 6→8 | L+RR |
| Cowardly (Kobeno) | Cowardly (Scared) (Kobeno (Scared)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +30% Attack, +50% Crit | 1,30 / 2,00 | 7→8 | L+RR |
| Cream | Cream (Void) | M→M | 1× Dimensional Hood | 12/5/4/0/3/1 | – | 5.000 | – | +30% Attack, +Void Rampage | 1,30 / 2,09 | 6→8 | RR |
| Crimson Thief (Greed) | Crimson Thief (Hunt) (Greed (Hunt)) | M→M | 12× Demonic Chalice, 12× Demonic Horn, 6× Fairy Petals | 12/4/3/0/3/1 | – | 5.000 | – | +20% Attack, +Fox Hunt | 1,20 / 3,00 | 6→9 | L+RR |
| Crusader (Heathcliff) | Crusader (Admin) (Heathcliff (Admin)) | M→M | 12× Ice Crystallite, 12× Dark Crystallite, 6× Blood Crystallite | 12/3/3/4/0/1 | – | 7.500 | – | +50% Attack, +Tempest Rush | 1,50 / 3,00 | 6→9 | L+RR Δ |
| Crush | Crush (Ace) | M→M | 3× Fractured Cubes, 40× Magical Artifact | – | – | – | – | +35% Damage, +Spreading Truth: Infinite Heaven, +Crash | 1,35 / 2,16 | 8→10 | L+RR |
| Crystal Rose (Evileye) | Crystal Rose (Impact) (Evileye (Landfall)) | M→M | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/4/3/4/0/1 | – | 7.500 | – | +40% Attack, +Crystal Volley | 1,40 / 2,18 | 6→8 | L+RR |
| Curse (Akin) | Curse (Contract) (Akin (Contract)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +30% Crit, +Contract: Curse Devil | 1,00 / 1,00 | 6→6 | L+RR |
| Cyborg (Overdrive) (Geno (Overdrive)) | Cyborg (Incinerate) (Geno (Incinerate)) | M→M | 35× Full Power Core | 12/3/3/0/3/1 | – | 5.000 | – | +40% Attack, +Incinerate | 1,40 / 1,89 | 8→9 | L+RR |
| Dark Mage | Dark Mage (Fallen Star) | S→S | 1× Black Spear | 12/5/0/3/4/1 | – | 5.000 | – | +50% Attack, +Black Rain | 1,50 / 2,25 | 6→8 | RR |
| Death Ninja (Hido) | Death Ninja (Immortal Butcher) (Hido (Immortal Butcher)) | M→M | 1× Triple-Bladed Scythe | 12/5/4/3/0/1 | – | 5.000 | – | +40% Attack, +Soul Hunt, +Blood Curse | 1,40 / 2,62 | 6→9 | L+RR |
| Delinquent (Serious) (Jokujo (Serious)) | Delinquent (The Universe) (Jokujo (The World)) | M→M | 3× DISC (Blue), 3× DISC (Green), 3× DISC (Orange), 3× DISC (Pink), 3× DISC (Purple), 3× DISC (Black) | 20/0/7/7/6/2 | – | – | – | +50% Attack, +The World | 1,50 / 6,00 | 7→9 | L+RR |
| Demihuman | Demihuman (Gamer) | M→M | 200× Sacred Treasure | 12/5/4/0/3/1 | – | 7.500 | – | +40% Attack, +Maximum Thrill | 1,40 / 4,20 | 6→8 | RR |
| Doll (Gowthy) | Doll (Spirit Archer) (Gowthy (Invasion)) | M→M | 12× Demonic Chalice, 12× Demonic Horn, 6× Fairy Petals | 12/3/4/3/0/1 | – | 5.000 | – | +20% Attack, +Invasion, +Blackout | 1,20 / 1,67 | 8→9 | L+RR |
| Dolphin (Jolyna) | Dolphin (Determination) (Jolyna (Determination)) | M→M | 3× DISC (Blue), 3× DISC (Green), 3× DISC (Orange), 3× DISC (Pink), 3× DISC (Purple), 3× DISC (Black) | 20/6/6/7/0/2 | – | – | – | +15% Attack, +Web Prison | 1,15 / 1,99 | 8→9 | L+RR |
| Donut (Renkoko) | Donut (ABLAZE) (Renkoko (ABLAZE)) | M→M | 3× Blazing Creme Donut | – | +4× Martial Demon | – | – | +Renkoko (ABLAZE) | 0,81 / 1,19 | 8→9 | L+RR |
| Dracula (Alucard) | Dracula (Unholy King) (Alucard (Unholy King)) | S→S | 1× Unholy Pistols | 12/5/4/0/4/1 | – | 5.000 | – | +40% Attack, +Nightmare Feast, +Soul Restraint: Level 0 | 1,40 / 4,67 | 6→10 | L+RR |
| Dragon Knight (Issai) | Dragon Knight (Gauntlet) (Issai (Boosted Gear)) | M→M | 40× Egg of Sacrifice | 12/5/4/3/3/1 | – | 7.500 | – | +40% Attack, +Boosted Gear | 1,40 / 4,80 | 5→8 | L+RR |
| Dragonslayer (Natzo) | Dragonslayer (Lightning Mode) (Natzo (Lightning Dragon Mode)) | M→M | 2× Dragon Fire, 40× Magical Artifact | – | – | – | – | +35% Damage, +Lightning Fire | 1,35 / 1,68 | 8→9 | L+RR |
| Dreamer | Dreamer (Visionary) | M→M | – | 30/13/13/10/10/3 | – | 5.000 | – | +40% Attack, +Imaginary Armageddon | 1,35 / 3,04 | 6→8 | RR |
| Eccentric Researcher (Hanje) | Eccentric Researcher (Captain) (Hanje (Captain)) | M→M | 1× Thunder Spears | – | – | – | – | +30% Damage, +50% Crit, +Thunder Spears | 1,30 / 1,65 | 6→8 | L+RR |
| Elf Mage | Elf Mage (Aura) | M→M | 1× Elf Staff | 12/4/4/4/0/1 | – | 5.000 | – | +35% Attack, +Letal Magic | 1,35 / 2,14 | 6→8 | RR |
| Elf Spirit (Yono) | Elf Spirit (Wind) (Yono (Spirit)) | M→M | 1× Spirit Crown, 40× Magic Stone, 15× Enchanted Magic Stone, 15× Cursed Magic Stone | – | – | – | – | +30% Attack, +Spirit of Zephyr | 1,30 / 3,03 | 7→9 | L+RR |
| Elfy (Leafy) | Elfy (Sylph) (Leafy (Sylph)) | M→M | 4× Ice Crystallite, 4× Dark Crystallite, 2× Blood Crystallite | 12/3/4/3/4/1 | – | 7.500 | – | +50% Attack, +Verdant Enchantment | 1,50 / 1,50 | 6→6 | L+RR |
| Elize (Ezra) | Elize (True Heart) 25 % / Elize (Valkyrie) 25 % / Elize (Lightning) 25 % | M→M | 30× Infused Crystal, 1× Essense of the Knight, 40× Magical Artifact | – | – | – | – | +Random Equip | 2,08 / 3,75 | 8→9 | L+RR |
| Elyssia | Elyssia (Abyssal) | M→M | – | 12/3/0/5/4/1 | – | 2.500 | – | – | – | 0→0 | RR |
| Enlightened | Enlightened (Nirvana) | S→S | 1× Staff of Realms | 12/3/3/3/3/1 | – | 5.000 | – | +10% Attack, +Cycle of Samsara | 1,10 / 3,40 | 4→8 | RR |
| Eta | Eta (One-Eye) | M→M | 3× Crystal Shards, 20× Ghoul Coffee | – | – | – | – | +15% attack, +Laser Augment, +Kakuja Evolution | 1,15 / 1,45 | 7→8 | L+RR |
| Experiment X (Imperfect) (Cel (Imperfect)) | Experiment X (Semi-Perfect) (Cel (Semi-Perfect)) | E→L | – | – | +3× Experiment X (Imperfect) | – | 300 Kills | +Cel (Semi-Perfect), +Ultimate Blitz | 2,50 / 4,40 | 4→7 | L+RR |
| Experiment X (Perfect) (Cel (Perfect)) | Experiment X (SUPER PERFECT) (Cel (SUPER PERFECT)) | M→M | 1× Infinite Power Core | – | – | – | 7.500 Kills | +Cel (SUPER PERFECT), +Solar Kamehameha | 1,69 / 2,54 | 8→10 | L+RR |
| Experiment X (Semi-Perfect) (Cel (Semi-Perfect)) | Experiment X (Perfect) (Cel (Perfect)) | L→M | – | – | +3× Experiment X (Semi-Perfect) | – | 2.500 Kills | +Cel (Perfect), +Punishment Storm | 2,40 / 1,82 | 7→8 | L+RR |
| Explosion Hero (Bang) (Bakugo (Explosion)) | Explosion Hero (Impact) (Bakugo (Howitzer)) | M→M | 12× Hero Guantlet, 12× Quirk Amplifier, 6× Quirk Capsule | 4/1/1/1/0/1 | – | 7.500 | – | +Evolve | 1,30 / 2,17 | 7→9 | L+RR Δ |
| Fairy Ruler (King) | Fairy Ruler (Sloth) (King (Sloth)) | M→M | 12× Demonic Chalice, 12× Demonic Horn, 6× Fairy Petals | 12/3/0/3/4/1 | – | 5.000 | – | +35% Attack, +True Spirit Spear | 1,35 / 1,69 | 7→9 | L+RR |
| Faker (Archer) | Faker (Hero's Soul) (Archer (Heroic Spirit)) | M→M | 250× Lesser Grail ² | 12/5/0/4/3/1 | – | 7.500 | – | +35% Attack, +Caladbolg II: The Fake Spiral Sword | 1,35 / 2,02 | 7→9 | L+RR |
| Falcon (Hawk) | Falcon (Feather Strike) (Hawk (Fierce Wings)) | M→M | 12× Hero Guantlet, 12× Quirk Amplifier, 6× Quirk Capsule | 4/1/1/0/1/1 | – | 7.500 | – | +Evolve | 1,30 / 2,06 | 6→8 | L+RR Δ |
| Fiend Girl (Hinamy) | Fiend Girl (Buttterfly) (Hinamy (Yotsume)) | M→M | 1× Flower Kagune | 12/5/4/0/4/1 | – | 5.000 | – | +50% Attack, +Roots of Wrath | 1,50 / 2,57 | 6→8 | L+RR |
| Fiery Commander (Yamomoto) | Fiery Commander (Hellfire) (Yamomoto (Hellfire)) | S→S | 1× Sealed Fire Staff ¹ | – | – | – | – | +50% Attack, +Zanka no Tachi | 1,50 / 3,00 | 8→10 | L+RR |
| Flame Hero (Endeavor) | Flame Hero (Hellfire) (Endeavor (Hellflame)) | M→M | 12× Hero Guantlet, 12× Quirk Amplifier, 6× Quirk Capsule | 4/1/1/1/0/1 | – | 7.500 | – | +Evolve | 1,50 / 2,36 | 6→8 | L+RR Δ |
| Flamefeather (Avdo) | Flamefeather (Arcane Blaze) (Avdo (Magician's Red)) | M→M | 1× Fiery Ankh | 12/5/4/3/0/1 | – | 5.000 | – | +35% Attack, +Cross-Fire Hurricane | 1,35 / 2,41 | 7→9 | L+RR |
| Flower Ninja (Gabimaro) | Flower Ninja (Austere Flame) (Gabimaro (Ascetic Blaze)) | M→M | 1× Hollow Flower | – | – | – | – | +30% Attack, +Ninpo: Pyro Blizzard | 1,30 / 2,00 | 6→8 | L+RR |
| Fox Ninja (Demon Cloak) (Noruto (Demon Cloak)) | Fox Ninja (Beast Cloak) (Noruto (Beast Cloak)) | L→M | 2× Hidden Seal | – | +3× Fox Ninja (Demon Cloak) | – | – | +Noruto (Beast Cloak) | 2,50 / 3,60 | 8→8 | L+RR |
| Fox Ninja (Sage) (Noruto (Sage)) | Fox Ninja (Six Tails) (Noruto (Six Tails)) | M→M | 50× Ninja Scroll (Fire), 50× Ninja Scroll (Water), 50× Ninja Scroll (Wood) | 12/4/0/3/4/1 | – | 7.500 | – | +Noruto (Six Tails) | 1,50 / 3,83 | 5→8 | L+RR |
| Frost Navy (Aokijo) | Frost Navy (Blue Pigeon) (Aokijo (Blue Pheasant)) | M→M | 1× Ice Pheasant | – | – | – | – | +50% Attack, +Ice Age | 1,50 / 1,95 | 7→9 | L+RR |
| Gambler | Gambler (Jackpot) | M→M | 200× Sacred Treasure | 12/4/3/0/5/1 | – | 7.500 | – | +25% Attack, , +Love Train, Waver with Death | 1,25 / 2,50 | 6→8 | RR |
| Gamer (Kiroto) | Gamer (Dual) (Kiroto (Dual)) | M→M | 4× Ice Crystallite, 4× Dark Crystallite, 2× Blood Crystallite | 4/1/1/1/0/1 | – | 7.500 | – | +30% Attack, +Double Circular, +Starburst Stream | 1,30 / 3,98 | 7→10 | L+RR |
| Gamer Girl (Asuno) | Gamer Girl (Flash) (Asuno (Flash)) | M→M | 4× Ice Crystallite, 4× Dark Crystallite, 2× Blood Crystallite | 4/1/1/1/0/1 | – | 7.500 | – | +40% Attack, +Star Splash | 1,40 / 1,87 | 6→9 | L+RR |
| Gas | Gas (Toxic) | M→M | 1× Gas Crown | 12/0/4/4/4/1 | – | 5.000 | – | +35% Attack, +Blue Sword, +Gas Poison | 1,35 / 2,70 | 5→7 | L+RR |
| Gazu (Getu) | Gazu (Maximum) (Getu (Maximum)) | S→S | 1× Cursed Orb (Maximum), 20× Cursed Orb, 40× Curse Talisman | – | – | – | – | +40% Damage, +Maximum: Uzumaki | 1,40 / 1,61 | 7→8 | L+RR |
| Gene (Gone) | Gene (Adult) (Gone (Adult)) | L→M | – | – | +9× Gene | – | – | +Gone (Adult) | 10,00 / 10,00 | 8→8 | L+RR |
| Gene (Adult) (Gone (Adult)) | Gene (???) (Gone (???)) | M→M | 1× Final Contract, 40× Cooked Fish | – | – | – | – | +50% Damage, +??? | 1,50 / 2,08 | 8→9 | L+RR |
| Ghost Lady (Peruna) | Ghost Lady (Princess) (Peruna (Ghost Princess)) | M→M | 1× Zombie Doll | – | – | – | – | +25% Attack, +Ghost Slow | 1,25 / 1,71 | 7→9 | L+RR |
| Ghost-kun | Ghost-kun (Bound) | M→M | – | 30/13/10/10/13/3 | – | 5.000 | – | +40% Attack, +Hitodama Pandemonium | 1,40 / 4,20 | 5→8 | RR |
| Ghosty (Hime) | Ghosty (Sacrifice) (Hime (Ghost)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +30% Attack, +Final Sacrifice | 1,30 / 1,58 | 8→9 | L+RR |
| Golden King (Gilgamesh) | Golden King (Lord of Heroes) (Gilgamesh (King of Heroes)) | S→S | 250× Lesser Grail ² | 12/3/5/4/0/1 | – | 7.500 | – | +40% Attack, +Enūma Eliš | 1,40 / 3,77 | 7→10 | L+RR |
| Golden Navy (Senbodu) | Golden Navy (Buddha) (Senbodu (Buddha)) | M→M | 40× Egg of Sacrifice | 12/5/3/5/4/1 | – | 7.500 | – | +30% Attack, +Shockwave | 1,30 / 4,21 | 7→9 | L+RR |
| Golden Tyrant (Golden Freezo) | Golden Tyrant (Emperor) (Golden Freezo (Emperor)) | M→M | 1× Supernova | 12/4/3/3/0/1 | – | 7.500 | – | +30% Attack, +Supernova | 1,30 / 5,42 | 6→10 | L+RR |
| Gravity Mage (Chuyo) | Gravity Mage (Void) (Chuyo (Corruption)) | M→M | 500× Supernatural Book ² | – | – | 5.000 | – | +35% Attack, +Black Hole | 1,35 / 2,70 | 6→9 | L+RR |
| Gravity Navy (Fuji) | Gravity Navy (Admiral) (Fuji (Admiral)) | M→M | 12× SMILE Fruit | 3/1/0/1/2/1 | – | 7.500 | – | +40% Attack, +Gravity Festival | 1,40 / 2,37 | 7→9 | L+RR |
| Green Alien (Fusion) (Piccoru (Fusion)) | Green Alien (Nameless) (Piccoru (Nameless)) | S→S | 1× Demon Symbol | 12/3/0/3/4/1 | – | 7.500 | – | +30% Attack, +Special Beam Cannon | 1,30 / 1,79 | 7→8 | L+RR |
| Griffin | Griffin (Ascension) | M→M | – | – | – | 7.500 | Behelit 100 %; nicht im Evolve-UI | +Ascension | 1,13 / 0,06 | 7→1 | L+RR |
| Gunslinger (Vas) | Gunslinger (Cross) (Vas (Cross)) | M→M | 1× Cross Gun ¹ | – | – | – | – | +40% Damage, +35% Physical Crit Damage, +Cross | 1,12 / 3,21 | 6→8 | L+RR |
| Hammer Giantess (Dany) | Hammer Giantess (Creation) (Dany (Creation)) | M→M | 12× Demonic Chalice, 12× Demonic Horn, 6× Fairy Petals | 12/0/3/4/3/1 | – | 5.000 | Shiny-Rezept abweichend | +25% Attack, +Earthquake | 1,25 / 3,39 | 8→9 | L+RR |
| Hammerhead (Harribu) | Hammerhead (Shark Empress) (Harribu (Shark Empress)) | M→M | 1× Sharktooth Blade | 12/0/4/5/3/1 | – | 5.000 | – | +30% Attack, +La Gota | 1,30 / 2,17 | 6→8 | L+RR |
| Haze | Haze (Rage) | M→M | 1× Poison Bulb | – | – | – | – | +35% Damage, +Homicidal Virus | 1,35 / 1,35 | 7→7 | L+RR |
| Hermy (Ermo) | Hermy (Duplicate) (Ermo (Duplicate)) | M→M | 3× DISC (Blue), 3× DISC (Green), 3× DISC (Orange), 3× DISC (Pink), 3× DISC (Purple), 3× DISC (Black) | 20/7/6/0/6/2 | – | – | – | +25% Damage, +Sticker Implosion, +50% Crit | 1,25 / 1,38 | 7→9 | L+RR |
| Hex (Medae) | Hex (Witch of Betrayal) (Medae (Witch of Betrayal)) | M→M | 250× Lesser Grail ² | 12/3/5/0/4/1 | – | 7.500 | – | +35% Attack, +Rule Breaker | 1,35 / 2,43 | 6→9 | L+RR |
| Honey | Honey (Hive) | M→M | – | 10/5/5/5/5/1 | – | 100 | – | +35% Attack, +Nectar Nova | 1,35 / 2,70 | 4→6 | RR |
| Hubris (Day) (Pride (Day)) | Hubris (The One) (Pride (The One)) | M→M | – | – | – | – | Sonderbedingung | +Pride (The One) | 1,71 / 2,90 | 7→11 | L+RR |
| Hubris (Night) (Pride (Night)) | Hubris (Day) (Pride (Day)) | M→M | 2× Demonic Chalice, 2× Demonic Horn, 1× Fairy Petals | – | – | 500 | – | +Pride (Day) | 1,75 / 2,15 | 6→7 | L+RR Δ |
| Ice Queen | Ice Queen (Empire's Strongest) | S→S | 1× Demon Extract | – | – | – | – | +30% Attack, +Mahapadma | 1,30 / 4,84 | 7→9 | L+RR |
| Iceclaw (Rebirth) | Iceclaw (Azure Fang) | M→M | – | 30/13/10/13/10/3 | – | 5.000 | – | +50% Damage, +50% Crit, +Spirit Howl | 1,50 / 3,75 | 5→8 | RR |
| Icy Dragon (Toshin) | Icy Dragon (Lotus) (Toshin (Dragon Lotus)) | M→M | 1× Ice Lotus | – | – | – | – | +50% Crit, +Dragon Descent | 1,00 / 1,50 | 7→9 | L+RR |
| Idol (Oshy) | Idol (Star) (Oshy (Idol)) | M→M | 1× Idol Mic ¹ | – | – | – | – | +Oshy (Idol) | – | 2→3 | L+RR |
| Illusionist (Aizo) | Illusionist (Betrayal) (Aizo (Betrayal)) | M→M | 1× Negation Box, 40× Soul Candy | – | – | – | – | +30% Attack, +Kyōka Suigetsu | 1,30 / 1,62 | 8→9 | L+RR |
| Illusionist (Chrysalis) (Aizo (Chrysalis)) | Illusionist (Fusion) (Aizo (Fusion)) | M→M | – | – | – | – | 5.000 Kills; Hogyoku 62 %; nicht im Evolve-UI | +Aizo (Fusion) | 1,50 / 1,80 | 10→11 | L+RR |
| Illusionist (Fusion) (Aizo (Fusion)) | Illusionist (Final) (Aizo (Final)) | M→M | – | – | – | – | 15.000 Kills; Hogyoku 100 %; nicht im Evolve-UI | +Aizo (Final) | 1,50 / 2,67 | 11→12 | L+RR |
| Infinity Mage (Merlyn) | Infinity Mage (Endless) (Merlyn (Infinity)) | S→S | 10× Demonic Spellbook | 12/3/3/4/0/1 | – | 5.000 | – | +35% Attack, +Exterminate Ray, +Perpetual Curse | 1,35 / 2,25 | 6→9 | L+RR |
| InHuman (Dazai) | InHuman (Nullifier) (Dazai (No Longer Human)) | S→S | 500× Supernatural Book ² | – | – | 5.000 | – | +35% Attack, +Nullification, +No Longer Human | 1,35 / 2,45 | 6→8 | L+RR |
| Iron Knight (Metal Knight) | Iron Knight (Arsenal) (Metal Knight (Arsenal)) | M→M | 35× Full Power Core | 12/0/3/4/4/1 | – | 5.000 | – | +25% Attack, +Drone Arsenal | 1,25 / 1,94 | 10→13 | L+RR |
| Itukoda (Itadoki) | Cursed King (Sukuno) | M→M | 5× Cursed Finger | – | – | – | nicht im Evolve-UI | +Sukuno Possession | 2,00 / 4,88 | 8→9 | L+RR |
| Izo (Black Fire) (Itochi (Amaterasu)) | Izo (Samurai) (Itochi (Susanoo)) | M→M | 1× Yata Mirror | 12/4/3/0/3/1 | – | 7.500 | – | +40% Attack, +Susanoo | 1,18 / 3,08 | 8→10 | L+RR |
| Jackal (Coyote) | Jackal (Alpha) (Coyote (Primera)) | M→M | 1× Soul Partition, 40× Soul Candy | – | – | – | – | +50% Attack, +Los Lobos | 1,50 / 1,80 | 8→9 | L+RR |
| Jelly | Jelly (Heaven) | S→S | 1× Celestial Tear, 10× Infused Crystal, 40× Magical Artifact | – | – | – | – | +30% Damage, +Sema | 1,30 / 2,63 | 8→9 | L+RR |
| Jose (Shining Gem) (Josuka (Crazy Diamond)) | Jose (Unbreakable) (Josuka (Unbreakable)) | M→M | 1× Restoration Diamond | 12/4/3/3/0/1 | – | 7.500 | – | +40% Attack, +Rock Merge, +Restoration Stun | 1,40 / 3,80 | 5→8 | L+RR |
| Joykid (Bounce) (Luffo (Bounce)) | Joykid (Mode IV) (Luffo (Gear IV)) | M→M | 12× SMILE Fruit | 3/1/0/1/2/1 | – | 7.500 | – | +30% Attack, +King Kong Gun | 1,30 / 1,77 | 8→10 | L+RR |
| Juozu | Juozu (Joker) | M→M | 1× Forbidden Candy, 20× Ghoul Coffee | – | – | – | – | +30% Attack, +Joker Arata | 1,30 / 1,95 | 8→9 | L+RR |
| Kansai | Kansai (Daydream) | M→M | 1× Mysterious Cat | 12/0/4/5/3/1 | – | 7.500 | – | +50% Attack, , +OH MY GAH!, +Daydream | 1,50 / 7,50 | 5→8 | RR |
| Karma (Lucky) | Karma (Thunder Fiend) (Lucky (Thunder Fiend)) | M→M | 2× Lightning Fiend's Horns, 40× Magic Stone, 15× Enchanted Magic Stone, 15× Cursed Magic Stone | – | – | – | – | +30% Attack, +True Lightning Magic | 1,30 / 1,82 | 7→9 | L+RR |
| Killer (Whirlwind) (Kizzua (Whirlwind)) | Killer (Godspeed) (Kizzua (Godspeed)) | M→M | 1× Electric Yo-yo, 40× Cooked Fish | – | – | – | – | +50% attack, +Paralysis | 1,50 / 1,88 | 8→9 | L+RR |
| Killstreak | Killstreak (Speedrun) | M→M | 250× Assassin Token | 6/0/2/2/2/1 | – | 5.000 | – | +25% Attack, +Killing Speedrun | 1,25 / 2,09 | 6→7 | RR |
| Kyko (Kyoka) | Kyko (Crimson Spear) (Kyoka (Scarlet Lance)) | M→M | 1× Soul Gem (Scarlet) | – | – | 5.000 | – | +30% Attack, +Scarlet Puncture | 1,30 / 2,60 | 7→10 | L+RR |
| Legendary Assassin | Legendary Assassin (Prime) | M→M | 250× Assassin Token | 6/2/2/0/2/1 | – | 5.000 | – | +25% Attack, +Slim Down | 1,25 / 3,12 | 7→9 | RR |
| Lex (Levy) | Lex Akoman (Levy Ackman) | M→M | 2× Ultrasteel Blade | – | – | – | – | +60% Attack, +50% Crit | 1,60 / 1,60 | 8→8 | L+RR |
| Lightning God (Thor) | Lightning God (Awakened) (Thor (Awakened)) | M→M | 1× Mjolnir ¹ | – | – | – | – | +50% Damage, +Geirröd | 1,50 / 2,06 | 8→9 | L+RR |
| Lilia (Illy) | Lilia (Homunculus) (Illy (Homunculus)) | M→M | 250× Lesser Grail ² | 12/0/5/4/3/1 | – | 7.500 | – | +50% Attack, +Nine Lives | 1,50 / 3,00 | 6→8 | L+RR |
| Lucifer (Demiurge) | Lucifer (Demon Emperor) (Demiurge (Demon Emperor)) | M→M | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/4/3/0/4/1 | – | 7.500 | – | +30% Attack, +Scorching Hell | 1,30 / 4,02 | 7→9 | L+RR |
| Lulu | Lulu (Emperor) (Lulu (Geass)) | S→S | 1× King's Idol | – | – | – | – | +Geass, +25% damage | 1,25 / 1,25 | 7→8 | L+RR |
| Lunar Hare (Mirka) | Lunar Hare (Tiger) (Mirka (Tiger Bunny)) | M→M | – | 33/0/12/8/10/3 | – | 2.500 | – | +35% Damage, +Mirka (Tiger Bunny), +Luna Fall | 1,35 / 1,74 | 7→9 | L+RR |
| Lyla (Luci) | Lyla (Celestial) (Luci (Celestial)) | M→S | 1× Celestial Key (Final), 40× Magical Artifact | – | – | – | Sonderbedingung | +50% Damage, +Multi Summon | 1,50 / 2,25 | 7→9 | L+RR |
| Magic Disbeliever (Asto) | Magic Disbeliever (Dark) (Dark Asto) | M→M | 2× Demonic Wing, 40× Magic Stone, 15× Enchanted Magic Stone, 15× Cursed Magic Stone | – | – | – | – | +50% Damage, +Black Hurricane | 1,50 / 2,10 | 7→9 | L+RR |
| Magic Girl (Madoko) | Magic Girl (Salvation) (Madoko (Salvation)) | M→M | 1× Soul Gem (Rose) | – | – | 5.000 | – | +30% Attack, +Incarnation of Mercy | 1,30 / 1,85 | 7→9 | L+RR |
| Magma (Akano) | Fleet Admiral Magma (Fleet Admiral Akano) | M→M | 1× Magma Fruit, 20× Devil Fruit | – | – | – | – | +30% Attack, +20% Volcano Range | 1,30 / 1,73 | 8→9 | L+RR |
| Mangaka (Rohon) | Mangaka (Artist) (Rohon (Artist)) | S→S | 1× Reality Pen | 12/2/2/3/3/1 | – | 7.500 | – | +25% Attack, +Rewrite | 1,25 / 1,63 | 6→8 | L+RR |
| Martial Demon (Akoku) | Martial Demon (Destruction) (Akoku (Destruction)) | L→M | 2× Demon Beads | – | +3× Martial Demon | – | – | +200% Attack, +Disorder, +Compass Needle | 2,67 / 2,67 | 8→8 | L+RR |
| Mazara (Marada) | Mazara (Founder) (Marada (Founder)) | M→M | 2× Divine Eye | – | – | – | – | +20% damage, +Susanoo fire | 1,20 / 1,58 | 8→9 | L+RR |
| Menace (Stain) | Menace (Terror) (Stain (Hero Slayer)) | M→M | 4× Ice Crystallite, 4× Dark Crystallite, 2× Blood Crystallite | 4/1/1/1/0/1 | – | 7.500 | – | +40% Attack, +Blade Dance, +Bloodcurdle | 1,40 / 2,11 | 7→9 | L+RR |
| Millie (Mamy) | Millie (Holy) (Mamy (Holy)) | M→M | 1× Soul Gem (Gold) | – | – | 5.000 | – | +40% Attack, +Tiro Finale | 1,40 / 2,33 | 6→9 | L+RR |
| Mimic Sorcerer (Yuto) | Mimic Sorcerer (Cursed Child) (Yuto (Cursed Child)) | M→M | 1× Promise Ring, 40× Curse Talisman | – | – | – | – | +50% Attack, +Full Manifestation | 1,88 / 5,50 | 7→10 | L+RR |
| Mirror Ninja (Haka) | Mirror Ninja (Reflection) (Haka (Reflection)) | M→M | 1× Frozen Mirror | – | – | – | – | +35% Attack, +Mirroring Ice Crystals | 1,35 / 2,35 | 7→9 | L+RR |
| Mochi | Mochi (Rage) (Mochi Charlot) | M→M | 2× Cupcake, 15× Devil Fruit | – | – | – | – | +25% Attack, +Mochi Slow | 1,25 / 1,67 | 8→9 | L+RR |
| Morbid (Moriu) | Morbid (Shadow Lord) (Moriu (Shadow Lord)) | M→M | 1× Shadow Fruit | – | – | – | – | +20% Attack, +Shadow Veil | 1,20 / 1,68 | 7→9 | L+RR |
| Operator (Heart) (Lao (Heart)) | Operator (ROOM) (Lao (ROOM)) | M→M | 12× SMILE Fruit | 3/1/0/1/2/1 | – | 7.500 | – | +40% Attack, +Gamma Knife, +Shambles | 1,40 / 1,87 | 8→10 | L+RR |
| Origami (Komon) | Origami (Paper Angel) (Komon (Paper Angel)) | M→M | 50× Ninja Scroll (Fire), 50× Ninja Scroll (Water), 50× Ninja Scroll (Wood) | 12/4/3/3/0/1 | – | 7.500 | – | +35% Attack, +Paper Servant Dance: Explosion | 1,35 / 2,25 | 6→9 | L+RR |
| Packy (Kenpaki) | Packy (Maniac) (Kenpaki (Maniac)) | M→M | 5× Soul (Tiel), 5× Soul (Wes), 5× Soul (Ging) | – | – | – | – | +40% Attack, +Spiritual Pressure | 1,40 / 3,36 | 8→9 | L+RR |
| Paradox (Goju) | Paradox (Divine Sight) (Goju (Six Eyes)) | M→M | 1× Six Eyes, 40× Curse Talisman | – | – | – | – | +50% Attack, +Hollow: Purple, +Unlimited Void, +Limitless | 1,50 / 2,62 | 7→9 | L+RR |
| Paragon (Angel) | Paragon (Devil) (Angel (Devil)) | M→M | 50× Gun Devil Bullet | – | – | 5.000 | – | +30% Attack, + Usage: 500 Years | 1,30 / 1,73 | 8→9 | L+RR |
| Pirate King (Roger) | Pirate King (Final) (Roger (Pirate King)) | S→S | 1× Pirate King's Hat | 12/5/0/3/4/1 | – | 5.000 | – | +40% Attack, +Divine Departure, +Haki Stun | 1,40 / 2,72 | 6→9 | L+RR |
| Player (Bell) | Player (Argus) (Bell (Argonaut)) | M→M | 1× Hestia Knife ² | – | – | – | – | +50% Attack, +Argo Vesta | 1,50 / 3,33 | 5→8 | L+RR |
| Prayer Master (Neteru) | Chairman Prayer Master (Chairman Neteru) | M→M | 1× Golden Rose, 40× Cooked Fish | – | – | – | – | +35% Damage, +Zero Hand | 1,35 / 1,51 | 8→9 | L+RR |
| Priest (Puchi) | Priest (New Moon) (Puchi (New Moon)) | M→M | 1× Green Baby | – | – | – | nicht im Evolve-UI | +Puchi (Moon) | 1,67 / 1,56 | 8→9 | L+RR |
| Priest (New Moon) (Puchi (New Moon)) | Priest (Heaven) (Puchi (Heaven)) | M→M | 1× Heavenly Clock | – | – | – | Sonderbedingung; nicht im Evolve-UI | +Puchi (Heaven) | 0,80 / 1,60 | 9→10 | L+RR |
| Prime Force (All Force) | Prime Force (Peace) (All Force (Symbol of Peace)) | M→M | 3× Shining Extract | – | – | – | – | +Smash knocks back, +40% damage, -10% Smash cooldown | 1,54 / 2,10 | 7→8 | L+RR |
| Psychic Princess | Psychic Princess (Evo) | M→M | 1× Silver Greatsword | – | – | – | – | +35% Attack, +Silver Arsenal | 1,35 / 2,70 | 5→8 | RR |
| Puppet Girl (Yoshina) | Puppet Girl (Spirit) (Yoshina (Spirit)) | M→M | – | 35/8/10/10/0/3 | – | 2.500 | – | +30% Damage, +Zadkiel | 1,00 / 1,50 | 6→8 | L+RR |
| Ratio (Kent) | Ratio (Overtime) (Kent (Overtime)) | M→S | 2× Cursed Wristwatch, 1× Precision Glasses, 40× Curse Talisman | – | – | – | – | +20% Attack, +50% Crit, +Precision Flash Onslaught, +Overtime | 1,20 / 1,36 | 8→9 | L+RR |
| Rebel (Saby) | Rebel (Flame Ruler) (Saby (Flame Emperor)) | M→M | 12× SMILE Fruit | 3/1/0/1/2/1 | – | 7.500 | – | +35% Attack, +Flame Dragon King | 1,35 / 2,66 | 6→8 | L+RR |
| Red Scar | Red Scar (Conqueror) | M→M | 1× Hat of the Conqueror, 15× Devil Fruit | – | – | – | – | +50% Attack, +Conqueror's Haki | 1,50 / 2,14 | 8→9 | L+RR |
| Reliable Student (Koichy) | Reliable Student (Echoes) (Koichy (Echoes)) | M→M | 1× Echo Egg | 12/4/0/3/3/1 | – | 7.500 | – | +25% Attack, +Echoes Act3, +3 Freeze | 1,25 / 3,41 | 4→8 | L+RR |
| Riony (Ria) | Riony (Devil Princess) (Ria (Devil Princess)) | M→M | 1× Evil Queen's Piece | – | – | – | – | +30% Attack, +Extinguished Star | 1,30 / 2,41 | 5→8 | L+RR |
| Saka (Daky) | Saka (Ribbon) (Daky (Obi)) | S→S | 1× Demon Obi | 12/4/3/0/3/1 | – | 7.500 | – | +40% Attack, +Eight-Layered Obi Slash | 1,40 / 3,15 | 7→9 | L+RR |
| Saki (Sayako) | Saki (Cyanblade) (Sayako (Sapphire Blade)) | M→M | 1× Soul Gem (Sapphire) | – | – | 5.000 | – | +35% Attack, +Curtain Call | 1,35 / 1,56 | 7→9 | L+RR |
| Scarlet Slayer (Izu) | Scarlet Slayer (Cursed Frost) (Izu (Demon Snow)) | M→M | 500× Supernatural Book ² | – | – | 5.000 | – | +40% Attack, +50% Crit, +Ephemeral Flurry | 1,40 / 3,54 | 6→8 | L+RR |
| Sea God (Poseidon) | Sea God (Tyrant of the Seas) (Poseidon (Tyrant of the Seas)) | S→S | 1× Sea God's Trident | 12/0/3/5/4/1 | – | 5.000 | – | +50% Attack, +Medusa Alope Demeter | 1,50 / 3,18 | 6→9 | L+RR |
| Sepsis (Gyutaru) | Sepsis (Moon) (Gyutaru (Moon)) | M→M | 1× Flesh Kama | 12/4/3/3/0/1 | – | 7.500 | – | +45% Attack, +Rotating Circular Slashes: Flying Blood Sickles, +100% Crit against Bleeding Enemies | 1,45 / 4,59 | 6→9 | L+RR |
| Shadow Sorcerer (Megomu) | Shadow Sorcerer (Hybrid Shadow) (Megomu (Chimera Shadow)) | M→M | 2× Wolf Shadow, 40× Curse Talisman | – | – | – | – | +20% Attack, +Curse Technique, +Shadow Garden | 1,20 / 2,10 | 7→9 | L+RR |
| Shadow Sorcerer (Hybrid Shadow) (Megomu (Chimera Shadow)) | Shadow Sorcerer (Incident) | M→M | 100× Sacred Treasure | – | – | – | – | +Shadow Sorcerer (Incident) | 2,16 / 1,55 | 9→6 | RR |
| Shadow Sorcerer (Incident) | Shadow Sorcerer (Ritual) | M→M | 200× Sacred Treasure, 1× Sacred Treasure (Adapted) | – | – | 7.500 | – | +40% Attack, +Shadow ELephant, +Ritual | 1,40 / 3,02 | 6→8 | RR |
| Shadowgirl (Homuru) | Shadowgirl (Time Traveller) (Homuru (Time Traveller)) | S→S | 1× Soul Gem (Violet) | – | – | 5.000 | – | +50% Attack, +Timestop, +Final Measure | 1,50 / 3,13 | 6→9 | L+RR |
| Sharkfin (Kizume) | Sharkfin (Tailless Beast) (Kizume (Tailless Beast)) | M→M | 1× Sharkskin Greatsword | 12/4/4/0/4/1 | – | 5.000 | – | +40% Attack, +Exploding Tsunami | 1,40 / 2,18 | 6→8 | L+RR |
| Shinobi (Awakened) (Sosuke (Awakened)) | Shinobi (Eternal) (Sosuke (Eternal)) | M→M | 50× Ninja Scroll (Fire), 50× Ninja Scroll (Water), 50× Ninja Scroll (Wood) | 12/0/3/4/3/1 | – | 7.500 | – | +40% Attack, +Susanoo Arrow, +Inferno Style: Susanoo Flame Control | 1,40 / 4,94 | 5→10 | L+RR |
| Shinobi (Hood) (Sosuke (Hebi)) | Shinobi (Storm) (Sosuke (Storm)) | M→M | 1× Lightning Blade | 12/3/0/4/3/1 | – | 7.500 | – | +30% Attack, +Kirin | 1,30 / 2,60 | 7→9 | L+RR |
| Shizo (Shisu) | Shizo (Flicker) (Shisu (Flicker)) | S→S | 1× Chakra Drill | 12/4/3/0/3/1 | – | 7.500 | – | +40% Attack, +Susanoo | 1,17 / 2,80 | 8→10 | L+RR |
| Shrimp (Yumo) | Shrimp (White Terror) (Yumo (White Nightmare)) | M→M | 1× Trion Seal | – | – | – | – | +50% Attack, +Bolt Quinti | 1,50 / 3,30 | 5→8 | L+RR |
| Silver Slayer | Silver Slayer (Hunter) | M→M | 1× Silver Slayer Sword | – | – | – | – | +50% Attack, +50% Crit, +Silver Warfield | 1,50 / 5,62 | 5→8 | RR |
| Siren | Siren (Harpy) | M→M | 1× Snow Wings | 12/0/4/3/4/1 | – | 5.000 | – | +30% Attack, +Snow Dome | 1,30 / 3,12 | 5→8 | RR |
| Skater (Ghacco) | Skater (Album) (Ghacco (Album)) | M→M | 1× Cyrogenic Helmet ¹ | – | – | – | – | +30% Damage, +Ice Armor | 1,30 / 1,73 | 7→9 | L+RR |
| Skeleton (Broke) | Skeleton (Soul King) (Broke (Soul King)) | M→M | 1× Shark Guitar | – | – | – | – | +50% Attack, +Soul King | 1,50 / 2,17 | 7→9 | L+RR |
| Skeleton Knight (Skull Knight) | Skeleton Knight (King) (Skull Knight (King)) | S→S | 50× Egg of Sacrifice | 12/5/4/3/4/1 | – | 7.500 | – | +40% Attack, +Sword of Actuation | 1,40 / 2,80 | 7→9 | L+RR |
| Smoka | Smoka (Hunter) | M→M | 1× smoker_sword | – | – | – | – | +40% Attack, +White Hound | 1,40 / 3,85 | 5→8 | L+RR |
| Snow Reaper (War) | Snow Reaper (Final) | S→S | 200× Sacred Treasure | 12/3/0/5/4/1 | – | 7.500 | – | +40% Attack, +Ice, Gale of the Moon | 1,40 / 2,24 | 6→8 | RR |
| Somber | Somber (Buzzsaw) | M→M | 250× Assassin Token | 6/2/2/2/0/1 | – | 5.000 | – | +40% Attack, +Solemn Assassination. | 1,40 / 4,97 | 6→8 | RR |
| Sorcerer Killer | Sorcerer Killer (Heavenly Body) | S→S | 200× Sacred Treasure | 12/5/3/4/0/1 | – | 7.500 | – | +50% Attack, +Heaven-Piercing Fang | 1,50 / 2,50 | 7→9 | RR |
| Spearer (Lancer) | Spearer (Child of Light) (Lancer (Child of Light)) | M→M | 250× Lesser Grail ² | 12/5/0/3/4/1 | – | 7.500 | – | +30% Attack, +Gáe Bolg | 1,30 / 2,53 | 6→8 | L+RR |
| Spider | Spider (Immolation) | M→M | – | 30/13/13/10/10/3 | – | 5.000 | – | +40% Attack, +Burning Wrath | 1,40 / 2,10 | 6→8 | RR |
| Spirit Archer (Uru) | Spirit Archer (Reversal) (Uru (Antithesis)) | M→M | 3× Quincy Cross, 40× Soul Candy | – | – | – | – | +25% Attack, +25% Crit, +Holy Arrow | 1,25 / 1,46 | 8→9 | L+RR |
| Spirit Reaper (Dusk) (Ichi (Dusk)) | Spirit Reaper (Final Dusk) (Ichi (Final Dusk)) | M→M | 3× Soul (Tiel), 3× Soul (Toshe), 3× Soul (Wes), 3× Soul (Barrago), 3× Soul (Ging) | – | – | – | – | +40% Attack, +Heaven Piercer, +Moonless Sky | 1,20 / 1,96 | 7→9 | L+RR |
| Spirit Sniper (Chiko) | Spirit Sniper (Prodigy) (Chiko (Trion Prodigy)) | M→M | 1× Lightning Trigger | – | – | – | – | +30% Attack, +Meteor | 1,30 / 3,25 | 5→8 | L+RR |
| Stringy (Flamingo) | Stringy (Awakened) (Flamingo (Awakened)) | S→S | 40× SMILE Fruit | 12/4/0/4/4/1 | – | 7.500 | Shiny-Rezept abweichend | +40% Attack, +Birdcage, +God Thread | 1,40 / 3,88 | 7→10 | L+RR Δ |
| Supersound (Sonic) | Supersound (Speed) (Sonic (Speed)) | M→M | 35× Full Power Core | 12/3/0/4/3/1 | – | 5.000 | – | +20% Attack, +50% Crit, +Four Shadows Burial | 1,20 / 1,82 | 6→8 | L+RR |
| Supreme Being (Anz) | Supreme Being (Sovereign) (Anz (Overlord)) | S→S | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/6/6/6/6/3 | – | 7.500 | – | +50% Attack, +Fallen Down, +Dark Young, +The Goal of All Life is Death | 1,50 / 3,12 | 6→9 | L+RR |
| Switchblade | Switchblade (Deception) | S→S | 250× Assassin Token | 6/2/0/2/2/1 | – | 5.000 | – | +50% Attack, +Death Dice Execution, +Dismember | 1,50 / 7,31 | 6→9 | RR |
| Sword Queen (Saber) | Sword Queen (Knight) (Saber (Promised Sword)) | M→M | 250× Lesser Grail ² | 12/3/4/5/0/1 | – | 7.500 | – | +30% Attack, +Excalibur | 1,30 / 4,16 | 8→10 | L+RR |
| Takamu (Tuna) | Takamu (Reborn) (Tuna (Reborn)) | M→M | 1× x_glove | – | – | – | – | +35% Attack, +X-Burner | 1,35 / 2,08 | 7→9 | L+RR |
| Tamiki (Tatsumiki) | Tamiki (Tornado) (Tatsumiki (Tornado)) | M→M | 12× Full Power Core | 4/0/1/1/1/1 | – | 5.000 | – | +30% Attack, +Psychic Knockback, +Psychic Meteor | 1,30 / 4,77 | 8→10 | L+RR |
| Tango (Score) | Tango (Flash God) (Tango (God of Flashiness)) | M→M | 1× Nichirin Cleavers | 12/2/3/3/2/1 | – | 7.500 | – | +35% Attack, +25% Crit, +String Performance: Bursting Bloom | 1,35 / 3,21 | 7→10 | L+RR |
| Tarata | Tarata (Ignite) | M→M | 2× Scales of the Salamander, 20× Ghoul Coffee | – | – | – | – | +10% Damage, +2x Burn Damage, +Scorching Slam | 1,10 / 1,22 | 8→9 | L+RR |
| Thunder Maid (Narbera) | Thunder Maid (Servant) (Narbera (Battle Maid)) | M→M | 10× Overlord's Ring (Red), 10× Overlord's Ring (Yellow), 10× Overlord's Ring (Blue) | 12/0/3/4/4/1 | – | 7.500 | – | +30% Attack, +Chain Dragon Lightning | 1,30 / 5,20 | 5→8 | L+RR |
| Tiger (Asushi) | Tiger (Moonlight Beast) (Asushi (Moonlight Beast)) | M→M | 500× Supernatural Book ² | – | – | 5.000 | – | +50% Attack, +Beneath the Moonlight | 1,50 / 3,19 | 5→8 | L+RR |
| Time Wizard (Julio) | Time Wizard (Chronos) (Julio (Wizard King)) | M→M | 1× Endless Tome | – | – | – | – | +20% Attack, +Chrono Reversal | 1,20 / 1,50 | 8→9 | L+RR |
| Toad Sensei (Jirayo) | Toad Sensei (Toad Sage) (Jirayo (Toad Sage)) | M→M | 50× Ninja Scroll (Fire), 50× Ninja Scroll (Water), 50× Ninja Scroll (Wood) | 12/4/3/0/3/1 | – | 7.500 | – | +30% Attack, +Sage Art: Bath of Boiling Oil, +Toad Slow | 1,30 / 1,95 | 6→8 | L+RR |
| Trickster (Kisoko) | Trickster (Release) (Kisoko (Bankai)) | M→S | 2× Thread of the Exile, 1× Soul Orb, 40× Soul Candy | – | – | – | – | +40% attack, +Opened Crimson Princess | 1,40 / 1,80 | 8→9 | L+RR |
| Umbra (Zid) | Umbra (Nuclear) (Zid (Shadow)) | S→S | 1× Shadow Broadsword | 12/4/4/3/0/1 | – | 5.000 | – | +40% Attack, +I Am Atomic | 1,40 / 3,89 | 5→8 | L+RR |
| Usurper (Erein) | Usurper (Founder) (Erein (Founder)) | L→M | 3× Path Branch, 8× Mysterious Fluid | – | – | – | – | +Erein (Founder) | – | 6→3 | L+RR Δ |
| Vego (Mage) (Vegita (Majin)) | Vego (Mage II) (Vegita (Majin II)) | M→M | 400× Mage Mark | 12/3/2/2/3/1 | – | 7.500 | – | +40% Attack, +Final Explosion, +Fusion | 1,40 / 2,80 | 6→8 | L+RR |
| Vego (Super) (Vegita (Super)) | Vego (Super II) (Vegita (Super II)) | M→M | 1× Super Capsule | 12/0/3/4/3/1 | – | 7.500 | – | +25% Attack, +Final Flash | 1,25 / 1,58 | 8→9 | L+RR |
| Vengeful Swordsman | Vengeful Swordsman (Sky Reaver) | S→S | 1× Sky Reaver | 12/5/0/4/3/1 | – | 7.500 | – | +40% Attack, +Cut Down, +Spellforged Blades, +White Flash Draw Technique | 1,40 / 2,33 | 8→10 | RR |
| Verdant Hero (String) (Dezu (Blackwhip)) | Verdant Hero (Dark) (Dezu (Vigilante)) | M→M | 12× Hero Guantlet, 12× Quirk Amplifier, 6× Quirk Capsule | 3/1/0/1/1/1 | – | 7.500 | – | +30% Attack, +100% Manchester Smash | 1,30 / 2,38 | 7→9 | L+RR Δ |
| Violentine | Violentine (Brutal Angel) | M→M | 1× Angelic Bat | 12/5/4/3/0/1 | – | 7.500 | – | +30% Attack, , +Twisted Love | 1,30 / 1,30 | 6→6 | RR |
| Virtual Samurai (Klay) | Virtual Samurai (Bachelor) (Klay (Bachelor)) | M→M | 4× Ice Crystallite, 4× Dark Crystallite, 2× Blood Crystallite | 4/1/1/1/0/1 | – | 7.500 | – | +50% Attack, +Whirlwind | 1,50 / 2,14 | 6→8 | L+RR |
| Void Spear (Ulquiro) | Void Spear (Revival) (Ulquiro (Resurrección)) | M→M | 2× Spirit Spear, 40× Soul Candy | – | – | – | – | +40% attack, +Resurrección | 1,75 / 2,67 | 7→9 | L+RR |
| Wasp (Soi Fan) | Wasp (Hornet) (Soi Fan (Hornet)) | M→M | 5× Soul (Tiel), 5× Soul (Toshe), 5× Soul (Barrago) | – | – | – | – | +30% Attack, +Hornet Missile | 1,30 / 1,42 | 8→9 | L+RR |
| Waterfist (Bang) | Waterfist (White Tooth) (Bang (Silver Fang)) | M→M | 12× Full Power Core | 3/1/0/1/1/1 | – | 5.000 | – | +50% Attack, +Awakening Breath | 1,50 / 1,65 | 7→9 | L+RR Δ |
| Weather | Heavy Weather | M→M | 3× DISC (Blue), 3× DISC (Green), 3× DISC (Orange), 3× DISC (Pink), 3× DISC (Purple), 3× DISC (Black) | 20/0/7/6/6/2 | – | – | – | +40% Attack, +Thunderstorm | 1,40 / 1,93 | 8→9 | L+RR |
| Weather Girl (Navi) | Weather Girl (Thief) (Navi (Thief)) | M→M | 1× Clima-Staff ¹ | – | – | – | – | +50% Attack, +Thunderbolt Tempo, +Treasure Thief | 1,50 / 3,75 | 6→8 | L+RR |
| White Snake (Ging) | White Snake (Sacred Spear) (Ging (Sacred Spear)) | M→M | 5× Soul (Wes), 5× Soul (Barrago), 5× Soul (Ging) | – | – | – | – | +15% Attack, +50% Crit | 1,15 / 1,38 | 8→9 | L+RR |
| Whitehair | Emperor Whitehair | M→M | 1× Quake Fruit, 20× Devil Fruit | – | – | – | – | +30% Attack, +Sea Quake | 1,30 / 1,58 | 8→9 | L+RR |
| Wratho (Melio) | Wratho (Assault) (Melio (Assault)) | M→M | 12× Demonic Chalice, 12× Demonic Horn, 6× Fairy Petals | 12/2/2/2/2/1 | – | – | – | +Melio (Assault), +40% Damage, +50% Crit | 1,40 / 5,60 | 7→11 | L+RR |
| Zombie | Zombie (Risen) | M→M | 200× Sacred Treasure | 12/3/5/4/0/1 | – | 7.500 | – | +25% Attack, +Bone Bomb Brigade, +Undead Blessing | 1,25 / 3,91 | 5→7 | RR |

¹ Itemname nicht in S68, aus der Wiki-Seite `Evolution` (S72) über die dort genannte Basis-Unit zugeordnet. ² Itemname nicht in S68, aus S46 (LEGACY-Guide). Ohne Fußnote und ohne Namen: nur interne ID bekannt.

Hinweis: Drei Einträge in `units.json` haben einen leeren `evolution`-Block ohne Ziel (`mechamaru`, `shidou`, `nokotan`); sie sind keine Rezepte und fehlen hier. Darum 219 statt 222.
