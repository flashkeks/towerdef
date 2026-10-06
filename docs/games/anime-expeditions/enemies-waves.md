# Anime Expeditions - Gegner und Wellen

Kennzeichnung `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Zurück zu [overview.md](overview.md); Einheiten-Gegenstück: [units.md](units.md).

**Ehrlicher Stand**: Das Wiki-Datenmodul `EnemyData/data` enthält nur Typ, Rarity-Label, Modi und Maps je Gegner, **keine HP, keine Geschwindigkeit, kein Yen**. Die HP-Formel und die Wellen-Zusammensetzung sind nirgends dokumentiert (Wiki-Text: "Base HP ... takes into account the gamemode, the act, the map, the difficulty, the players, and the wave"; die Kurve selbst fehlt). Daher stehen unten die belegte Struktur und die Modifikatoren; alle Zahlen für HP und Waves sind UNKNOWN.

## Gegnertypen

| Typ | Rarity-Label im Wiki | Rolle | Kennz. |
|---|---|---|---|
| Basic (Enemy) | Rare (blau) | Masse der Welle; je Map 2 Basic-Typen | [O/HIGH AE-S4, AE-S8] |
| Elite | Legendary (gelb) | "Mini-Bosse"; je Story-Map 3 Elite-Typen | [O/HIGH AE-S4, AE-S8] |
| Boss | Secret (rot) | pro Act ein fester Boss; Modifier "Boss" = stark erhöhte HP | [O/HIGH AE-S4, AE-S6] |

- Jeder Gegner startet als "leere Entität" mit Typ, Modell und **Base-HP**; Modifikatoren werden pro Typ in ein Array gelegt und kommen pro Wave zufällig heraus. Gegner haben keine festen Modifikatoren oder End-HP [O/HIGH AE-S8].
- **Standard-Geschwindigkeit aller Gegner: 2,4** (Einheit nicht genannt, vermutlich Studs/s) [O/HIGH AE-S8]. Abweichungen laufen über Modifier (siehe unten).
- Ein klassisches Match endet erst, wenn kein Gegner mehr auf der Map ist [O/HIGH AE-S8].
- Verlustregel (Leben): Star Mission "Win without losing any stocks" belegt, dass Leben "Stocks" heißen; Anzahl UNKNOWN [O/MEDIUM AE-S3]. Expedition: Payload 1 000 HP [O/HIGH AE-S13].

## HP-Skalierung über die Wellen

| Aspekt | Aussage | Kennz. |
|---|---|---|
| Formel | UNKNOWN (nur "curved growth", progressiv steigend je Story-Act) | [U/UNKNOWN AE-S8, AE-S14] |
| Tabelle Wave 1-N | UNKNOWN | [U/UNKNOWN] |
| Infinite | "HP-Formel unbegrenzt (uncapped)", wird "exponentiell härter, je länger man überlebt" | [O/MEDIUM AE-S14] |
| Abhängigkeiten | Gamemode, Act, Map, Schwierigkeit, Spielerzahl, Wave | [O/HIGH AE-S8] |
| Stage-Effekte auf HP | Sprinter 0,8x HP, Tank 1,2x HP, Commander +20 % HP in 5 Range, Splitter 3 Kinder je 33 % HP, Dawn: Summoner/Splitter-Kinder nur 1 % HP und 5 Shield | [O/HIGH AE-S5] |

Rückschluss (nur Richtung): Unit-Damage steigt bis Max auf 15-5 000 (siehe [units.md](units.md)), und die Gesamtausgaben pro Act liegen im zehntausender Yen-Bereich; die Gegner-HP muss daher in Late-Waves in den hohen Tausendern bis Millionen liegen, ist aber nicht belegt [R/LOW AE-S7].

## Gegner-Modifikatoren (Modul ModifierData, vollständig)

Typ Enemy, Werte [O/HIGH AE-S5].

| Modifier | Wirkung |
|---|---|
| Sprinter | +45 % Bewegung, -20 % HP |
| Tank | -20 % Bewegung, +20 % HP |
| Summoner | alle 5 s Spawn von Gegnern an eigener Position (bis 5) |
| Explosive | beim Tod 10 Range Explosion, Stun 2 s auf Units |
| Splitter | beim Tod 3 Gegner mit je 33 % HP |
| Armored | -33 % Schaden von Full-AoE |
| Reinforced | -30 % Schaden von allem |
| Regen I / II / III / IV | 1 % / 3 % / 5 % / 8 % Max-HP pro Sekunde |
| Shield | absorbiert Treffer (Stärke UNKNOWN); Modifier "Shielded": alle Gegner mit 10 Shield |
| Immunity | immun gegen alle Soft- und Hard-CC |
| Momentum | +2 % Bewegung pro Sekunde, Cap +50 % |
| Burrowing | alle 8 s 2 s unter der Erde, unzielbar |
| Zombie / Zombify / Zombified | Tod: Wiederbelebung mit 50 % HP, 50 % weniger Yen; Zombify wandelt Gegner im Umkreis 10 um; Zombified gibt kein Yen |
| Commander | Gegner im Umkreis 5: +20 % Speed, +20 % HP |
| Soldier | +20 % Speed nahe Commander |
| Veil | AoE-Schild 200 % der Host-HP für Gegner im Umkreis 5 |
| Tartaros | alle 10 s einen nahen Basic fressen, Regen I für 10 s |
| Death | gibt Gegnern in der Nähe stackenden +20 % dauerhaften Speed-Boost; Soft-CC setzt auf 0 zurück |
| Sword | respawnt bis zu 2x, außer bei Tod unter DoT |
| Dawn | Kinder von Splitter/Summoner: 99 % weniger HP, 5 Shield |
| Stunner | alle 15 s Stun auf die 3 nächsten Units für 5 s |
| Zone Debuff | Debuff in einer Zone (Details UNKNOWN) |
| Transformer | bei 50 % HP Phase 2 mit voller HP |
| Bulwark | alle 10 s 3 s Schadensimmunität |
| Status Cleanse | alle 10 s entfernt alle CC von allen Gegnern |
| Retaliation Counter | nach 20 Treffern Stun auf alle Units 2 s |
| Greed | alle 10 s 10 % HP von Gegnern im Umkreis 5 stehlen |
| Cage | sperrt eine zufällige Unit (Attacken, Passive, Fähigkeiten) |
| Fear | alle 15 s -10 % DMG/SPA/RNG für Units im Umkreis 30 für 10 s |
| Warlock | alle 5 s +1 Shield und +10 % Speed für Gegner im Umkreis 10 |
| Corruption | +50 % erhaltener Schaden |
| Research Project | gibt Fortschritt für das aktive Expedition-Projekt |

Game-Modifier (global): Boss Waves (alle Gegner Bosse), Speedy (+50 % Speed), Shielded, Resistance (Rotation alle 30 s), Mirror, Short Range (-25 % Range), No Farms, No Repair, No Anvils, No Research Tree, No Tomes, Traitless, Upgrade Cap (25), Cards Disabled [O/HIGH AE-S5].

## Wave-Zusammensetzung

Wave-für-Wave-Listen (Anzahl, Typ, Abstände, Boss-Wave-Nummer) sind **nicht dokumentiert** [U/UNKNOWN]; vier Versuche (EnemyData, StageData, Enemies, Story) ohne Fund. Belegt ist die Stage-Struktur:

- Story je Map: 5 Acts, je Normal und Hard (Hard: mehr Belohnung, "mehr Schwierigkeit"), 1 Mastery-Act (Hard erzwungen), 1 Infinite [O/HIGH AE-S14].
- Jeder Act hat einen eigenen Gegnerpool, Teilmenge des Map-Pools, mit anderen Modifikatoren und HP-Skalierung [O/HIGH AE-S14].
- Pro Act ein fester Boss (Feld `Bosses`), Infinite würfelt alle fünf Map-Bosse [O/HIGH AE-S3].
- Infinite: Belohnung alle 5 Waves, Star-Ziele bei Wave 10 / 25 / 50 [O/HIGH AE-S3].

### Komplette Stage-Struktur: School Grounds (Story, Map 1)

Gegnerpool der Map: Basic = School Curse, Fabric Curse; Elite = Insect Curse, Pelican Curse, School Girl; Boss = Titan Worm, Mutant Parasite, Centipede Curse, Rope Weaver, Cursed Summoner [O/HIGH AE-S4].

| Act | Boss | Stage-Effekte (Normal und Hard) | Star-Missionen (Normal) | Kennz. |
|---|---|---|---|---|
| 1 | Titan Worm | Sprinter, Tank | Win; Win mit < 100k Yen; Win ohne Stock-Verlust | [O/HIGH AE-S3] |
| 2 | Mutant Parasite | Sprinter, Tank | Win; 2+ Magical-Units platziert; nur 1 Farm | [O/HIGH AE-S3] |
| 3 | Centipede Curse | Sprinter, Tank | Win; 2+ Physical-Units platziert; mindestens 50 Gegner debuffen | [O/HIGH AE-S3] |
| 4 | Rope Weaver | Sprinter, Tank | wie Act 1 | [O/HIGH AE-S3] |
| 5 | Cursed Summoner | Sprinter, Tank, Summoner | wie Act 2 | [O/HIGH AE-S3] |
| Mastery | Cursed Summoner | Shielded, Sprinter, Summoner, Tank, Flame 0,5x, Dark 1,5x | Win; ohne Stock-Verlust; nur 5 Units | [O/HIGH AE-S3] |
| Infinite | alle 5 Bosse zufällig | Sprinter, Summoner, Tank | Wave 10 / 25 / 50 | [O/HIGH AE-S3] |

Hard-Missionen: "Win mit nur 3 Units", "höchstens 15 Upgrades", "keine Farms", "< 50k Yen" [O/HIGH AE-S3].

### Andere Maps (Bosse und Schlüssel-Effekte)

| Map | Bosse Act 1 bis 5 | Effekte | Kennz. |
|---|---|---|---|
| Flower Forest | Centipede, Butterfly, Yellow Petal, Orange Petal, Purple Flower | Burrowing, Explosive, Splitter (alle Acts); Act 3 +Stunner, Act 4 +Commander, Act 5 +Status Cleanse; Mastery: Upgrade Cap | [O/HIGH AE-S3] |
| Rose Kingdom | Heart, Club, Diamond, Spade Officer, String Demon | Regen I + Reinforced (alle); Act 2 +Summoner, Act 4 +Transformer, Act 5 +Momentum; Mastery: Short Range | [O/HIGH AE-S3] |
| Fairy King Forest | Pacifism, Faith, Reticence, Purity, Piety | Armored, Commander, Tank (alle); Act 2 +Zone Debuff, 3 +Status Cleanse, 4 +Stunner, 5 +Momentum; Mastery: Speedy | [O/HIGH AE-S3] |
| King's Tomb | Corrupt Elder, Demon Prince, Demon of Obedience, Proctor Clone, Elf Mage Clone | Commander, Momentum, Summoner (alle); Act 2 +Bulwark, Act 3 +Zone Debuff; Mastery: Boss Waves | [O/HIGH AE-S3] |
| East Town (Map 6) | UNKNOWN | UNKNOWN (Seite nur als Auswahl gelistet) | [U/UNKNOWN AE-S14] |
| Spirit City (Raid) | Berserker, Silver Serpent, Silver Justice; Elites Crimson Fang, Glam Reaper, Furyblade | 3 Stages je Raid | [O/HIGH AE-S4, AE-S15] |
| Crow Hideout (Event) | Crow, Razorjaw, Cursed Immortal, Dark Mage; 7 Elites | Villain Invasion | [O/HIGH AE-S4] |

Progression der Schwierigkeit über die Maps: School Grounds hat nur 2 Modifier (Sprinter/Tank), King's Tomb schon Commander + Momentum + Summoner + Bulwark; Maps stapeln mehr aktive Mechaniken, nicht nur mehr HP [D/MEDIUM AE-S3].

## Boss-Waves

- Bosse sind Typ "Boss" (Rarity Secret). Mastery King's Tomb hat den Modifier "Boss Waves" (alle Gegner Bosse) [O/HIGH AE-S3, AE-S5].
- Belohnung nur pro Act/Clear: Normal 75 Gems + 75 Gold + 500 Unit-EXP + 115 Player-EXP; Erstclear 300/300/500/345; Hard 100/100/1 000/145 bzw. Erstclear 400/400/1 000/435; Mastery 100 Gems, 100 Gold, 5 Sprite (Grey), 1 000 Unit-EXP, 145 Player-EXP [O/HIGH AE-S3].
- Infinite: je 5 Waves 50 Gems, 50 Gold, 200 Unit-EXP, 50 Player-EXP; Item Mana Flask [O/HIGH AE-S3].
- Boss-HP, Spawnzeit, Boss-Wave-Nummer: UNKNOWN.
