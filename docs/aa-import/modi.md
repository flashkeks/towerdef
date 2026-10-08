# Legend Stages und Raids (Runde 9 / P3)

Zwei Spielmodi neben der Story, beide **nur Daten**: eine Legend Stage oder ein Raid ist eine Datei-Eintrag, keine Karte und kein Code. Quelle der Namen, Bosse und Acts ist `docs/anime-adventures/data/maps.json` (`legendStages`, `raids`), die Regeln stehen in `docs/anime-adventures/game-modes.md` und `raids.md`, die Zahlen sind **Startwerte, nicht kalibriert** (Kurswechsel 07.10.2026: Rauchtest statt Messreihen).

## Prinzip: Karte der Host-Welt wiederverwenden

AA kennt die Karten nicht (nur Laufzeiten), und von 22 AA-Welten haben wir 10. Darum nennt jede Legend Stage und jeder Raid eine `host`-Welt aus `sim/data/worlds/`: Karte, Zonenmaske, Farbwelt und Gegnernamen (`roster`) kommen von dort, die Wellen aus derselben Vorlage (`wave-template.json`, 19 Wellen plus Boss). `sim/src/data/modes.ts` (`expandLegend`, `expandRaid`) setzt daraus je Act eine fertige Stage; `loadGameData()` und das Browser-Datenpaket (`client/src/sim/data.ts`) laden sie wie die Welten. Kein Code je Stage (Test `modes.test.ts`: Pfad und Zonenmaske sind die der Host-Welt).

| ID-Schema | Beispiel |
|---|---|
| `legend-<id>-<act>` | `legend-spirit-invasion-6` |
| `raid-<id>` (ein Act) | `raid-sand-village-midnight-attack` |
| `raid-<id>-<act>` (mehrere Acts) | `raid-sacred-planet-3` |

## Legend Stages (8)

Frei nach **Act 6 der Host-Welt** (AA: Act 6 der zugehoerigen Story-Welt; fuer die AA-Welten, die wir noch nicht haben, springt die Host-Welt ein). Acts nacheinander. Alle Gegner tragen `affinity` (Resistenzen R mit Faktor 100/(100+R), Schwaechen in Bp, additiv; wirkt zusaetzlich zu Archetyp und Element-Affinitaet der Welle, `compile.ts` `affinity()`), je Act optional mehr. Je Act ein AA-Boss mit Boss-Kit (3-Act-Stages: Mender, Shielder, Colossus; 6-Act: Charger bis Colossus), Act-HP-Faktor und Modifier wie in der Story.

| Legend Stage | AA-Welt | Host-Welt (Karte, Freischaltung) | Acts | Material | Resistenz / Schwaeche |
|---|---|---|---|---|---|
| Space Center | Cape Canaveral | Greenie (1) | 3 | Disc Fragment | Physical 40 / Magic +30 % |
| Fabled Kingdom (Generals) | Fabled Kingdom | Walled City (2) | 3 | Commandment Sigil | Magic 40 / Physical +30 % |
| Rain Village | Rain Village | Sand Village (4) | 3 | Ninja Scroll | Lightning, Water 60 / Fire +40 %, Air +20 % |
| Virtual Dungeon (Bosses) | Virtual Dungeon | Navy Bay (5) | 3 | Crystallite | Fire 60 / Ice +40 %, Lightning +20 % |
| Ruined City (Midnight) | Hero City | Fiend City (6) | 6 | Quirk Shard | Physical 30, Ice 50 / Fire +30 %, Magic +20 % |
| Spirit Invasion | Hollow World | Spirit World (7) | 6 | Worthy Soul | Physical 50 / Light +40 %, Magic +20 % |
| Dungeon Throne | Undead Tomb | Ant Kingdom (8) | 3 | Overlord's Ring | Magic 50, Dark 60 / Light +40 %, Physical +20 % |
| Magic Hills (Elf Invasion) | Clover Kingdom | Magic Town (9) | 3 | Enchanted Magic Stone | Magic 30, Fire, Ice 40 / Physical +40 %, Dark +20 % |

Das ist der Sinn der Resistenzen: eine Mythic mit der falschen Schadensart schafft Act 1 nicht (Rauchtest: Goku SSJ3 verliert Spirit Invasion Act 1, Rikka gewinnt; bei Dungeon Throne umgekehrt), mit passender Unit oder Team wird es leicht.

### Belohnung

Crystals/Gold/XP wie ein Story-Act, mal 1,5 / 2,0 / 1,5 (`meta/data/modes.json`). Dazu **Evolutions-Material**: `acts[].drop = { first, repeat }` (Erst-Clear je Stage und Stufe / Wiederholung, Startwerte 3..5 / 2..3), Hard x1,5, Nightmare x2. Niederlage: Gold und XP je gehaltener Welle, kein Material.

### Material und Evolution

8 Materialien (`meta/data/materials.json`), je eines pro Legend Stage. Eine Evolution braucht jetzt zusaetzlich zu Crystals und Gold **Material**: Menge nach Seltenheit der entwickelten Form (Rare 4, Epic 6, Legendary 10, Mythic 15, Secret/Exclusive 25), Art aus dem Pool der Seltenheit, gewaehlt per Hash der Unit-ID (stabil, `overrides` je Unit moeglich). Fruehe Seltenheiten brauchen Material aus den frueh offenen Legend Stages (Rare/Epic: Space Center, Fabled Kingdom; Mythic: Rain Village bis Spirit Invasion; Secret/Exclusive: die vier hinteren), damit niemand fuer eine Rare-Evolution Welt 8 braucht. Beispiel: Goku SSJ3 (Mythic) braucht 15 Crystallite aus Virtual Dungeon. Die Unit-Detailseite nennt Material, Besitz und Fundort; der Raid-Shop verkauft Material als zweiten Weg.

## Raids (11)

20 Wellen (AA: `raid_legacy_2022`), ein Boss am Ende (Kit Colossus; 5-Act-Raids steigern Kit und HP je Act), Modifier ab Welle 6/8/12. Frei nach **Act 3 der Host-Welt** (Raids frueher als Legend Stages, AA: Raid-Bereich der Lobby). Solo (AA-Spielerzahl 1-4 ist DESIGN, Koop mit M2).

| Raid | Host | Acts | Garantierte Unit | Siege |
|---|---|---|---|---|
| Sacred Planet | Greenie | 5 | Vego (Mage) `vegeta_majin` | 10 |
| Sand Village (Midnight Attack) | Sand Village | 1 | Fox Ninja (Demon Cloak) `naruto_pts` | 10 |
| Future City | Walled City | 1 | Chunks `trunks` | 10 |
| Strange Town | Snowy Town | 5 | Bombietta `bambietta` | 10 |
| Storm Hideout | Navy Bay | 1 | Gravity Mage `chuya` | 10 |
| Future City (Tyrant's Invasion) | Fiend City | 1 | Mecha Tyrant `frieza_mecha` | 10 |
| Ruined City (The Menace) | Spirit World | 1 | Menace `stain` | 10 |
| Ant Kingdom (Midnight) | Ant Kingdom | 1 | Spider `feitan` | **15** (AA belegt: 15) |
| The Spider | Ant Kingdom | 1 | Spider (Immolation) `feitan_evo` | 15 |
| Cursed Festival | Magic Town | 1 | Donut `rengoku` | 10 |
| Nightmare Train | Haunted Academy | 1 | Martial Demon `akaza_unit` | 10 |

### Raid-Waehrung, Meilensteine, Shop

- **Raid-Marken** (`profile.inventory.raidMarks`, eigene Waehrung, nur aus Raids): je Sieg `marks` des Acts (20; 5-Act-Raids 15, 20, 25, 30, 35) mal Stufen-Faktor, beim ersten Sieg je Stage und Stufe +40. Dazu Crystals/Gold/XP kleiner als Legend (0,8 / 1,2 / 1,2 der Story).
- **Meilensteine** zaehlen alle Siege eines Raids (alle Acts und Stufen): 5 Siege +250 Crystals (AA: +250 Gems), 10 Siege +100 Raid-Marken, einmalig. **Garantierte Unit** nach `guarantee.clears` Siegen (AA-belegt nur beim Spider: 15; Rest DESIGN 10), einmalig, schon besessen = eine Kopie dazu. Niederlagen zaehlen nicht.
- **Raid-Shop** (`meta/data/raid-shop.json`, Bildschirm `ui/raid-shop.ts`): Gold (2000 = 15 Marken, 20x), Crystals (100 = 30, 10x), alle 8 Materialien (5 Stueck = 20..35, 6x), dazu jede Raid-Unit (40..400 Marken nach Seltenheit, einmalig): der sichere Weg ohne auf die Garantie zu warten (AA: Shard-Shops, 25..200).
- Nicht uebernommen: raid-eigene Schadens-Items (AA, +25..100 % nur im Raid), Treasure Radar, Raid-Quests, Zeitfenster, Matchmaking.

## Daten und Dateien

| Datei | Inhalt |
|---|---|
| `sim/data/modes/legend-stages.json` | 8 Stages: `host`, `unlock`, `material`, `affinity`, `acts[]` (Boss, Kit, Wellen, `hpBp`, `modifiers`, `drop`, optional `affinity`) |
| `sim/data/modes/raids.json` | 11 Raids: `host`, `unlock`, `guarantee`, `acts[]` (Boss, Kit, `hpBp`, `modifiers`, `marks`) |
| `meta/data/materials.json` | 8 Materialien, Mengen und Pools der Evolution |
| `meta/data/modes.json` | Faktoren der Belohnung, Stufen-Faktor, Meilensteine |
| `meta/data/raid-shop.json` | Angebote und Unit-Preise |

**Neue Legend Stage / neuer Raid:** Eintrag in die JSON-Datei (Host-Welt, Acts, Boss-Kits), bei Legend ein Material in `materials.json` (und es in `pools` eintragen, sonst braucht es keine Evolution). Test `sim/test/modes.test.ts` prueft Querverweise und Rauchtest, `meta/test/modes-p3.test.ts` Sperre, Belohnung, Shop. Null Zeilen Code.

## Wofuer die Luecken stehen

- AA-Welten ohne eigene Datei (Clover Kingdom, Cape Canaveral, Fabled Kingdom, Hero City, Virtual Dungeon, Undead Tomb, Rain Village): ihre Legend Stage laeuft auf einer Host-Welt, die Freischaltung folgt der Host-Welt statt der AA-Welt. Kommt eine echte Welt als Datei, wird `host`/`unlock` umgebogen (eine Zeile).
- Gegner-Resistenzen in AA gelten **je Gegner**, hier je Stage (und Act). Die Werte sind erfunden (AA nennt keine Zahlen), nur die Richtung (Resistenz plus Schwaeche) ist AA.
- Relic-Material (Clover Kingdom) und die 20-%-Portale/Sondervorteile einzelner Legend Stages entfallen.
- Raid-Bosse sind HP-Kloetze mit Kit; AA-Mini-Bosse und Zerfall (Deidara) fehlen.
- Zahlen (Marken, Preise, Material-Mengen, HP-Faktoren) sind Startwerte; eine Kalibrierung gibt es bewusst nicht.
