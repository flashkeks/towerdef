# Enemies

> **Stand (Sitzung 2, P6):** Gegnertypen, Modifikatoren und Bosse pro Act sind jetzt aus dem Wiki-Volltext belegt (S72). Es gibt **kein Gegner-Datenmodul** im Wiki. **HP-, Speed- und Yen-Werte pro normalem Gegner bleiben UNKNOWN.** Belegt sind nur drei LEGACY-Raid-Boss-HP (S73) und einige Modifikator-Zahlen.
>
> Tag-Format: `ART · CONFIDENCE · [Quelle]`. `S72:<Seite>` = Wiki-Seite aus dem Volldump, `S73` = Community-Trello (LEGACY, 2022-08 bis 2023-01), `S67` = Wiki-Modul `AoE Type`. Legende siehe [README](README.md#kennzeichnung).

## Enemy-Modifikatoren (Mechaniken)

Die Wiki-Seite *Enemy Mechanics* ist RR-Stand (letzte Bearbeitung 2025-04). Erste Auftritte stehen dabei, soweit die Seite sie nennt.

| Typ | Verhalten | Konter | Erster Auftritt | Tag |
|---|---|---|---|---|
| **Normal (Ground)** | läuft den Pfad entlang | alle Units | – | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| **Flying** | wird von Ground-Units ignoriert; nur Hill- und Hybrid-Units treffen | Hill/Hybrid; Nullify-Ability hebt die Eigenschaft zeitweise auf | Hollow World (RR: Spirit World), Act 1, Wave 10 | OBSERVED · HIGH · [S14 → S72:Enemy Mechanics, S72:Story] |
| **Shield** | feste Zahl Shield-Instanzen; **jeder Treffer entfernt 1 Instanz**; ein Treffer auf Shield macht keinen HP-Schaden | Multi-Hit-Units, **Shatter/Crash** (entfernt alle Instanzen), True Damage ignoriert Shields | Shiganshinu District (RR: Walled City), Act 4, Wave 15 | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Effects, S72:Damage Affinities / Elements, S73] |
| **Regen** | regeneriert HP; Flying-Gegner regenerieren nicht (Challenge-Variante) | Bleed (stoppt Regen ganz), Wither (stoppt Regen), Burn (senkt Regen), Nullify | Snowy Town, Act 4, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Effects, S72:Challenges] |
| **Hyper-Regen** | regeneriert stärker; nur Demon-Academy-Portal und Turniere | wie Regen | – | OBSERVED · HIGH · [S72:Challenges] |
| **Tank** | weißer Glow; nimmt „leicht reduzierten Schaden“; Challenge-Variante „mehr HP und Armor“ | nicht-schädigende Effekte wirken voll | Challenge; Story: Marine's Ford (Marine Flagbearer) | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Challenges] |
| **Fortify** | „verringert eingehenden Schaden“ (Marine Flagbearer, Navy Bay ab Act 2). Wirkt laut Wiki-Tipp als Aura auf andere Gegner? Nicht eindeutig | – | Navy Bay, Act 2 | OBSERVED · MEDIUM · [S72:Story] |
| **Steel-Plated** | **3× HP** und **+20 Shield-Instanzen** (nur Demon-Academy-Portal) | Shatter, Multi-Hit | – | OBSERVED · HIGH · [S15 → S72:Challenges] |
| **Fast** | höhere Speed | Slow, Stun, Range | Challenge | OBSERVED · HIGH · [S72:Challenges] |
| **Godspeed** | noch höhere Speed (Demon-Academy-Portal, Turniere) | wie oben | – | OBSERVED · HIGH · [S72:Challenges, S72:Tournament] |
| **Fire** | schneller als normale Gegner; Ice-Units machen weniger Schaden; **immun gegen Slow und Stun** (Freeze wirkt) | Freeze, Nicht-Ice-Schaden | Magic Town, Act 2, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Story] |
| **Ice** | nimmt weniger Schaden von normalen Units; **Fire-Units machen 3× Schaden**; Burn zählt als Fire; True Damage ignoriert die Ice-Resistenz | Fire/Burn, True Damage | Magic Town, Act 4, Wave 10; Ice Demons in Magic Hills Act 1 | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Damage Affinities / Elements] |
| **Armored** | **Full-AoE-Units machen halben Schaden**; Effekte von Full-AoE wirken voll. Seit Update 13.5 | Circle/Cone/Line/Single-AoE | Witch City Portal; Story: Virtual Dungeon, Act 4, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Update Log] |
| **Burst** | spawnt sehr schnell, wird zur Basis hin langsamer. Seit Update 19 (RR) | nicht nahe am Spawn platzieren | Frozen Abyss (Holiday Event 2024) | OBSERVED · HIGH · [S72:Enemy Mechanics, S72:Update Log] |
| **Cloner** | spawnt beim Tod schwächere Gegner (z. B. 2 eng gestapelte Clones), die Challenge-Mods erben können | AoE | Walled City (Massive Titans, ab Act 4), Snowy Town, Sand Village, Spirit World, Alien Spaceship, Fabled Kingdom, Ruined City | OBSERVED · HIGH · [S72:Story, S72:Infinite] |
| **Egg-Spawner** | Massive Ant legt ein **Ant Egg mit 5 Shield-Instanzen**; schlüpft später zu Mutant Ant (2 HP-Balken, 5 Shields) oder Officer Ant (2 HP-Balken, fast) | Egg schnell zerstören | Ant Kingdom, alle Acts | OBSERVED · MEDIUM · [S72:Story] |
| **Explosive** | Tod löst Explosion aus, die **Units in der Nähe stunnt**; Dungeon-Curses erhöhen die „explosive death range“ um 12 bzw. 24 | Fragile-Status (Illusionist) verhindert den Stun | Sand Village | OBSERVED · MEDIUM · [S72:Story, S72:Illusionist (Transcended), S72:Dungeon] |
| **Boss** | großes HP-Polster; Act-Ende; in Infinite alle 10 Waves Bosse früherer Acts | Reaper-Trait, Boss-Damage-Buffs | – | OBSERVED · HIGH · [S72:Infinite, S72:Story] |
| **Secret Boss** (Infinite) | seltener Sonder-Boss mit Drop (z. B. Soul Capsule, Clown Mask) | – | Hollow World Inf. (U3), Marine's Ford Inf. (U1), Ant Kingdom Inf. (U4), Fiend City Inf. | OBSERVED · MEDIUM · [S73, S72:Magma, S72:Cat Guard, S72:Items] |
| **Typ-Resistenz/Schwäche** | pro Gegner in Portals, Legend Stages, Daily Challenges, Contracts, Infinity Mansion (ab Raum 50 bzw. 100) | passende Affinität, True Damage, PEN | – | OBSERVED · HIGH · [S12 → S72:Damage Affinities / Elements, S72:Challenges, S72:Infinity Mansion] |
| Stealth / Camo | **nicht belegt** (kein Wiki-Treffer) | – | – | UNKNOWN |
| Mini-Boss | in LEGACY-Raids belegt (Enmu, Infinity Train) | – | – | OBSERVED · MEDIUM · [S73] |

### Modifikator-Zahlen

| Modifikator | Wert | Version | Tag |
|---|---|---|---|
| Tank (Challenge) | **+25 % HP, −25 % Schaden** | LEGACY 2022-08 | OBSERVED · MEDIUM · [S73] |
| Tank (Story-Gegner) | „slightly reduced damage“, Zahl UNKNOWN | RR | UNKNOWN |
| Shield (Challenge) | **+1 Shield-Instanz** | LEGACY = RR | OBSERVED · HIGH · [S73, S72:Challenges] |
| Regen (Challenge) | **1 % maxHP/s** | LEGACY 2022-08 | OBSERVED · MEDIUM · [S73] |
| Hyper-Regen | stärker als Regen, Zahl UNKNOWN | – | UNKNOWN |
| Fast (Challenge) | **+50 % Speed** | LEGACY 2022-08 | OBSERVED · MEDIUM · [S73] |
| Godspeed | UNKNOWN | – | UNKNOWN |
| Steel-Plated | ×3 HP, +20 Shields | RR | OBSERVED · HIGH · [S72:Challenges] |
| Armored | Full-AoE-Schaden ×0,5 | RR (seit U13.5) | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Ice ↔ Fire | Fire-Units ×3 Schaden gegen Ice | RR | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Resistenz | Schaden × `100 / (100 + R)`; z. B. R = 150 → 40 % | RR | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Schwäche | Schaden × `(1 + X %)` | RR | OBSERVED · HIGH · [S72:Damage Affinities / Elements] |
| Dungeon-Curses (RR, U20) | +1 % / +3 % Regen; +25 % / +50 % Speed; +3 Shields; +80 % HP; +20 % Flying-Chance; +100 % Burst- bzw. Armor-Chance | RR | OBSERVED · HIGH · [S72:Dungeon] |

### Turnier-Modifikatoren (Gegnerseite)

Turniere kombinieren 1–3 Modifikatoren. Gegnerbezogen belegt: Fast, Godspeed, Shield, Regen, Hyper-Regen, Boss Waves, Powerful Enemies, Magic Resistant, **Max 10 Enemies**, Burst, Armored, **No Flying**. Zahlen dazu: UNKNOWN. OBSERVED · HIGH · [S72:Tournament]

### Offene Detailfragen

- **Shield:** Der Wiki-Satz „depleted by one point every hit“ und die Trello-Formulierung „protection from x amount of attacks without taking damage“ bestätigen: Ein Hit auf ein Shield macht **keinen** HP-Schaden. OBSERVED · HIGH · [S72:Enemy Mechanics, S73]
- **Regen RR-Rate:** UNKNOWN; LEGACY-Challenge 1 %/s (siehe oben).
- **Fortify:** Ob die Reduktion für den Träger oder als Aura für andere Gegner gilt: UNKNOWN.
- **Explosive:** Stun-Dauer und Radius für Units UNKNOWN; Dungeon-Curse „+12 / +24 explosive death range“ (Einheit vermutlich Studs). OBSERVED · MEDIUM · [S72:Dungeon]

## Boss-Fähigkeiten

Das Angriffsmodul S67 enthält fünf Boss-Angriffe (interne IDs im LEGACY-Namensschema). Die Werte stehen nur als AoE-Form da. Wirkung UNKNOWN, außer wo der Name sie nahelegt.

| Interne ID | AoE | Vermutete Wirkung | Tag |
|---|---|---|---|
| `frieza_boss:spawn_units` | Single | Boss spawnt Gegner | OBSERVED · MEDIUM · [S67] |
| `beast_titan_boss:rock` | Circle, Radius 8 | Flächenangriff (auf Units?) | OBSERVED · MEDIUM · [S67] |
| `pitou_boss:heal` | Single | Boss heilt (sich oder andere) | OBSERVED · MEDIUM · [S67] |
| `itachi_boss:start_teleport` | Single | Boss teleportiert sich | OBSERVED · MEDIUM · [S67] |
| `juvia_boss:shield` | Single | Boss erzeugt Shield | OBSERVED · MEDIUM · [S67] |

Weitere belegte Boss-Mechaniken:

| Boss | Mechanik | Tag |
|---|---|---|
| Deidara (Raid Midnight Attack, LEGACY) | explodiert beim Tod und zerfällt in kleinere Gegner mit zusammen ≥ 250k HP | OBSERVED · MEDIUM · [S73] |
| Story-Bosse mit „→“ | zweite Phase bzw. Form nach dem Tod, z. B. Zarbo → Zarbo (Evolved), Aeronero → Tendril (5×), Butterfly → Butterfly (Split) (10×), Melzorgard → Alien Gunner (3×) | OBSERVED · HIGH · [S72:Story] |
| Bosse allgemein | Chrono Reversal und Tamikis Push wirken **nicht** auf Bosse; Operators Scramble (Teleport) wirkt auf Bosse | OBSERVED · HIGH · [S72:Effects, S72:Tamiki (Tornado), S72:Operator (ROOM)] |

## Bosse pro Story-Welt (RR-Stand)

Quelle: Wiki-Seite *Story* (Box „Story-MapBox“, letzte Bearbeitung 2025-07). Das Feld `location` der Box nennt den LEGACY-Weltnamen. „A → B“ = zweite Phase. OBSERVED · HIGH · [S72:Story]

| # | Welt (RR) | Act 1 | Act 2 | Act 3 | Act 4 | Act 5 | Act 6 (Endboss) |
|---:|---|---|---|---|---|---|---|
| 1 | Planet Greenie | Zarbo → Zarbo (Evolved) | Goldeo | Zezoom | Jayce, Vurtor | Gunyu | Freezo → Freezo (Final) |
| 2 | Walled City | Jaw Titan | Female Titan | Beast Titan | Armored Titan | Warhammer Titan | Colossal Titan |
| 3 | Snowy Town | Yahobu | Zui | Daka | Akoku | Kokoshibon | Muzo |
| 4 | Sand Village | Hido | Kizume | Zezsuo | Itochi | Reanimated Puppet | Sashora → Sashora (Puppet Master) |
| 5 | Navy Bay | Marine Battleship | Smoka | Kumo | Kizora | Aojimi | Senbodu → Senbodu (Buddha) |
| 6 | Fiend City | Hammer | Gourmet, Family Bodyguards | Arata Unit | Jason | Ayato | Owl (Human) → Owl |
| 7 | Spirit World | Massive Hollow | Adjuka | Aeronero → Tendril (5×) | Barrago → Barrago (King) | Yammo → Yammo (Zanpakutō) | Coyote, Spirit Wolf |
| 8 | Ant Kingdom | Officer Ant | Condor | Cheetah | Rage Ant | Butterfly → Butterfly (Split) (10×) | Queen Ant |
| 9 | Magic Town | Phantom Conjuration | Sound Mage | Rainbow Fire Mage | Water Mage | Steel Mage | Phantom Mage, Phantom Conjuration |
| 10 | Haunted Academy | Death Painting Curse | Worm Curse Leader → Worm Curse (3×) | Jupy, Jellyfish Curse | Hanamo | Fire Curse | Mahoti, Transfigured Worm |
| 11 | Magic Hills | Low-Ranking Devil | Mid-Ranking Devil | High-Ranking Devil | Zenom | Vonica | Denta → Denta (Monster) |
| 12 | Space Center | Muccia | F.F. | Viviano | Sports, Reanimated Corpse | Johngallu | Whiteserpent |
| 13 | Alien Spaceship | Crab Monster | Carnage Beetle | Medicine Man | Sea King | Plant Alien Commander | Melzorgard → Alien Gunner (3×) |
| 14 | Fabled Kingdom | *(leer im Wiki)* | Alby | Curse Demon | Trick Demon | Deri | Dray |
| 15 | Ruined City | Magnet | Getan | Destra | Compress | Himika | Portal |
| 16 | Puppet Island | Burger | Trouble | Girgi → Girgi (King) | Sweet | Diamanto | Solid → Solid (Stone) |
| 17 | Virtual Dungeon | Kobold Leader | Guardian Knight | Obsidian Elemental | Illfangs | Gleam Eyes | Heathcliff |
| 18 | Snowy Kingdom | Snake Baron (Apostle) | Raksha | Mozgo | Zod | Grobuld | Grobuld (Apostle) |
| 19 | Dungeon Throne | Undead Demon | Elder Lich | Death Knight | Imp King | Abyss Demon | Doom Lord |
| 20 | Mountain Temple | Dragon Tooth Colossus | Kojira | Medae | Medusa | Berserker | Kirai |
| 21 | Rain Village | Panda Summon | Chameleon Summon | Haza | Absorbtion Path | Human Path | Komon |
| 22 | Shibuya District | Finger Curse (Merged) | Unstoppable Curse | Shrieking Curse | Apex Curse | Crimson Curse | Ascended Curse |

**Korrektur gegenüber Sitzung 1:** Die Zeilen „Prodigal Prince / Vogita“, „Reckless Rage / Doria“, „Dazzling Disgust / Argon“, „Formidable Fighting Force / Giyu“ und „Terrifying Tyrant / Friezo“ kommen weder im Wiki-Dump noch in der Wiki-Volltextsuche vor (S72; Wiki-Suche nach „Vogita“ liefert 0 Treffer). Sie stammen wahrscheinlich aus einem anderen Spiel und sind entfernt. „The Purple Tyrant / Freezo“ ist Planet Greenie Act 6. „Mountain Temple Act 6 = Gilgamesh“ ist falsch: Act-6-Boss ist Kirai. Gilgamesh ist eine Unit aus dem Golden Portal (Map Mountain Temple). → Korrekturliste P6.

### Gegner-Auftritte nach Wave (Story)

| Welt | Gegner | Auftritt | Tag |
|---|---|---|---|
| Walled City | Massive Titans (Cloner) | ab Act 4 | OBSERVED · HIGH · [S72:Story] |
| Walled City | erste Shield-Gegner | Act 4, Wave 15 | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Snowy Town | erste Regen-Gegner | Act 4, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Sand Village | Merged Clones (Cloner) | ab Act 2 (Wiki: „confirmation needed“) | OBSERVED · LOW · [S72:Story] |
| Navy Bay | Marine Flagbearer (Fortify) | ab Act 2 | OBSERVED · HIGH · [S72:Story] |
| Fiend City | Aogiri Executives (starke Regen) | ab Act 4, Wave 10 | OBSERVED · HIGH · [S72:Story] |
| Spirit World | Massive Hollows (Cloner) | Act 1 als Boss, ab Act 4 normal | OBSERVED · HIGH · [S72:Story] |
| Spirit World | erste Flying-Gegner | Act 1, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Magic Town | Fire Mages / Ice Mages | Act 2, Wave 10 / Act 4, Wave 10 | OBSERVED · HIGH · [S72:Story] |
| Haunted Academy | Death Painting Curse (als normaler Gegner) | Act 2 W10, Act 3–4 W8, Act 5–6 W6 | OBSERVED · HIGH · [S72:Story] |
| Magic Hills | Ice Demons | Act 1, Wave 10 | OBSERVED · HIGH · [S72:Story] |
| Space Center | Pursuit Bikes; **kein Flying in Act 1** | Act 1, Wave 10 | OBSERVED · HIGH · [S72:Story] |
| Alien Spaceship | Massive Aliens (Cloner) | ab Act 4 | OBSERVED · HIGH · [S72:Story] |
| Fabled Kingdom | Albys (Cloner → Demon Golems) | Act 2 als Boss, ab Act 4 normal | OBSERVED · HIGH · [S72:Story] |
| Ruined City | Doubles (Cloner, 2 Double Clones) | ab Act 4 | OBSERVED · HIGH · [S72:Story] |
| Virtual Dungeon | erste Armored-Gegner in Story | Act 4, Wave 10 | OBSERVED · HIGH · [S72:Enemy Mechanics] |

## Andere Bosse (Raids, Dungeons, Legend Stages, Infinite)

| Modus / Map | Stage | Boss | HP | Drop / Hinweis | Tag |
|---|---|---|---:|---|---|
| Raid The Rumbling (Shiganshinu, LEGACY) | Wave 20 (Final) | Eren Founder | **555 658** | Path Shard, Rumbling Star | OBSERVED · MEDIUM · [S73] |
| Raid Midnight Attack (Hidden Sand, LEGACY) | Final | Deidara | **388 960** | zerfällt in Gegner mit ≥ 250k HP | OBSERVED · MEDIUM · [S73] |
| Raid Infinity Train (LEGACY) | Mini-Boss | Enmu | skaliert mit Wave, bis 550k | – | OBSERVED · MEDIUM · [S73] |
| Raid Infinity Train (LEGACY) | Final | Akaza | **666 952** | Blazing Shard | OBSERVED · MEDIUM · [S73] |
| Raid-HP allgemein | – | – | – | „Enemy raid units' HP“ wurde in Update 5.5 und im Halloween-Update 2022 **gesenkt**, also gelten die drei HP-Werte nur bis 2022-09 | OBSERVED · HIGH · [S72:Raids] |
| Raid Sacred Planet (RR) | Act 1–5 | The Guardian, The Demon King, The Warlock, The Genie, The Pure Form | UNKNOWN | Act 4: Relic Shard 10 %; Act 5: Relic Shard 100 % | OBSERVED · HIGH · [S17 → S72:Raids] |
| Raid Strange Town (RR) | Act 1–5 | Love Deluxe, Highway Star, The Harvest, Atom Heart, Killer Queen | UNKNOWN | Killer Coins | OBSERVED · HIGH · [S72:Raids] |
| Dungeon Cursed Womb (LEGACY) | Wave 15 | Finger Bearer | UNKNOWN | Cursed Finger | OBSERVED · HIGH · [S56 → S72:Dungeons] |
| Dungeon Cursed Parade (LEGACY) | Wave 20 | Getu | UNKNOWN | Cursed Orb | OBSERVED · HIGH · [S72:Dungeons] |
| Cursed Academy Infinite | – | Womb Curse | UNKNOWN | Key (Cursed Womb) | OBSERVED · HIGH · [S72:Dungeons] |
| Cursed Academy Infinite | – | Hanamo, Fire Curse, Mahoti | – | Item-Drop 10 % | OBSERVED · HIGH · [S72:Items] |
| Infinite, neueste Welt | – | **Star Golem** (Spawn-Chance, seit Update 7) | UNKNOWN | Star Remnants | OBSERVED · HIGH · [S06 → S72:Update Log, S72:Traits] |
| Infinite, alle (Halloween 2022) | – | Candy Golems | UNKNOWN | Candies | OBSERVED · HIGH · [S72:Update Log] |
| Legend Stages | je Act 1 Boss | siehe [maps.md](maps.md#legend-stages-rr) | UNKNOWN | – | OBSERVED · HIGH · [S72:Legend Stages] |
| Contracts (RR) | – | Boss einer zufälligen Map; höhere Tiers mit Resistenzen; 16 Tiers | UNKNOWN | Assassin Tokens, Death Dice | OBSERVED · HIGH · [S72:Contracts] |

## Datenfelder pro Gegner – Abdeckung

| Feld | Status |
|---|---|
| Name | Bosse pro Act vollständig (Story, Legend, Raids teilweise); normale Gegner nur, wenn als Mechanik-Beispiel genannt |
| World / Stage | Bosse vollständig; Spezialgegner mit Act/Wave (Tabelle oben) |
| HP | **UNKNOWN** für alle normalen Gegner und RR-Bosse; drei LEGACY-Raid-Bosse belegt |
| Speed | **UNKNOWN** absolut; relativ: Map-Laufzeiten bei Basis-Speed ([maps.md](maps.md#map-längen)); Fast +50 % (LEGACY) |
| Defense / Resistance | Formel belegt (`100/(100+R)`), Werte pro Gegner UNKNOWN |
| Air/Ground | Mechanik belegt; Zuordnung pro Gegner UNKNOWN |
| Reward (Yen) pro Kill | **UNKNOWN**. Contracts: 2.500–5.000 Yen pro Runde, 5.000 zum Start ([S72:Contracts]) |
| Spawn Conditions, Wave | teilweise (Tabelle oben); Infinite-Bosse alle 10 Waves |
| Immunities | Fire: immun gegen Slow/Stun; Bosse: immun gegen Chrono Reversal und einige Pushes; CC-Schutzzeiten siehe unten |

## Enemy AI und Pathfinding

| Aspekt | AA-Verhalten | Tag |
|---|---|---|
| Path System | Fester **NPC-Pfad** pro Map; Map-Längen werden „vom Anfang des NPC-Pfads bis zum Ende“ gemessen | OBSERVED · HIGH · [S38 → S72:Map Lengths] |
| Branching | Shibuya District hat einen **Doppelpfad**. Event-Maps (Frozen Abyss, April Fools) haben **3 Pfade** auf zufällig generierten Maps; im Frozen Abyss kann man per Kartenwahl zusätzliche Gegnerpfade öffnen | OBSERVED · HIGH · [S72:Story, S72:Events, S72:Update Log] |
| Pfadanzeige | Option „Path indicators“ seit Update 19 (RR) | OBSERVED · HIGH · [S72:Update Log] |
| Movement | konstante Geschwindigkeit entlang des Pfads; **Ausnahme Burst**: schnell am Start, langsamer zur Basis | OBSERVED · HIGH · [S72:Enemy Mechanics] |
| Gegner greifen Units an? | Normalerweise nein. Ausnahmen: **Explosive** stunnt nahe Units beim Tod; Boss-Angriffe in S67 (z. B. Circle-AoE-Rock) | OBSERVED · MEDIUM · [S72:Illusionist (Transcended), S67] |
| Verbündete auf dem Pfad | Summon-Units laufen **von der Basis den Pfad rückwärts**, schaden Gegnern auf ihrem Pfad und verschwinden bei 0 HP | OBSERVED · HIGH · [S72:Effects] |
| Stacking/Collision | Cloner-Clones spawnen „eng gestapelt“, was für Überlappung ohne Kollision spricht | RECONSTRUCTED · MEDIUM · [S72:Story] |
| Slow | Speed reduziert für die Dauer; danach Schutzzeit **4 s** (Abschnitt „Movement“) bzw. **7 s** (Abschnitt „How each effect works“) | OBSERVED · MEDIUM · [S13 → S72:Effects] (Konflikt) |
| Stun | Speed = 0; Schutz 10–14 s; Fire-Gegner immun | OBSERVED · HIGH · [S72:Effects, S72:Enemy Mechanics] |
| Freeze | Speed = 0; Schutz **10 s** bzw. **12–13 s** (Effects-Seite) bzw. **10–12 s** (Effekt-Modul) | OBSERVED · MEDIUM · [S72:Effects, S67] (Konflikt) |
| Timestop | wie Freeze, stapelt nicht mit Freeze; Schutz 10–12 s. JIO (Over Heaven) stoppt zusätzlich Spawns und Wave-Timer für 20 s | OBSERVED · HIGH · [S67, S72:JIO (Over Heaven)] |
| Unconscious | Stillstand 3–4 s (Effects) bzw. 0,5 s (Modul); laut Trello ohne Cooldown gegenüber Freeze | OBSERVED · LOW · [S72:Effects, S67, S73] (Konflikt) |
| Knockback | Position auf dem Pfad Richtung Spawn zurücksetzen; Schutz 30–31 s; Distanz „a few studs“ | OBSERVED · HIGH · [S72:Effects, S72:Agony] |
| Rewind / Confused / Mind Control | Gegner laufen rückwärts: Confused 5 s; Mind Control 10 % Chance für 1,5 s; Chrono Reversal 5 s (nicht auf Bosse) | OBSERVED · HIGH · [S72:Effects, S67] |
| Teleport | **Operator „Scramble“**: setzt Gegner um **50 % der Unit-Range** auf dem Pfad zurück, wirkt auch auf Bosse | OBSERVED · HIGH · [S72:Operator (ROOM)] |
| Stack-Regel | Seit Update 8: Stun, Freeze, Walkback u. Ä. stapeln nicht mehr; **1 s Pause**, bevor ein Gegner erneut betroffen sein kann; Schutzzeiten seit Update 14 am Gegner sichtbar | OBSERVED · HIGH · [S72:Update Log, S72:Effects] |

Das Feld `knockback_points` im Unit-Datenmodul (S65) steht bei 385 Units auf 0,5 und bei einer auf 3. Die Bedeutung ist UNKNOWN (Distanz in Studs? Gewicht?).

### Implementierung im Webspiel (Empfehlung)

```text
Path = Polyline [P0 … Pn], vorberechnete Segmentlängen, kumulierte Länge L
Enemy.state = { pathId, s: Distanz entlang Pfad, dir: +1|−1, speedBase, mods[], ccImmuneUntil{} }

tick(dt):
  if stunned/frozen/timestopped: return
  v = speedBase × Π(slowMods) × burstFactor(s/L) × (rewindActive ? −1 : 1)
  s = clamp(s + v·dt, 0, L)
  pos = samplePath(s)              // binäre Suche über kumulierte Längen
  if s >= L: leak()

applyCC(type, dur):                 // AA: kein Stacking, Schutzzeit pro Typ
  if now < ccImmuneUntil[type]: return
  setCC(type, dur); ccImmuneUntil[type] = now + dur + cooldown[type]
knockback(d): s = max(0, s − d)     // Bosse ggf. ausnehmen (Flag per Effekt)
teleportBack(unitRange): s = max(0, s − 0.5·unitRange)
progress (für "First") = s / L      // bei mehreren Pfaden: s / L_path
```

`burstFactor` ist `DESIGN`, z. B. 2,0 → 0,7 linear über den Pfad. Flying-Gegner nutzen denselben Pfad, mit anderer Zielbarkeit. Ob Flying eigene Pfade hat: UNKNOWN. Cooldown-Tabelle `DESIGN` nach AA-Werten: Slow 4–7 s, Stun 10–14 s, Freeze/Timestop 10–13 s, Knockback 30 s, globale Mindestpause 1 s.

## Für unseren Nachbau (DESIGN)

- Gegnerarchetypen 1:1 als **Datenflags** modellieren: `flying, shield:n, regenPctPerSec, dmgTakenMult, speedMult, immune[], onDeath{spawn|explode}, aoeTakenMult{full:0.5}, resist{type:R}`.
- Boss = Flag `boss:true` (blockt ausgewählte CC wie Rewind, Push) plus HP-Multiplikator.
- Fehlende AA-Zahlen nicht raten, sondern als Balancing-Parameter in `enemies.json` mit `origin: DESIGN` führen.
