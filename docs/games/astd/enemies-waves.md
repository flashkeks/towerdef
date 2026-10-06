# ASTD: Gegner und Wellen (Priorität)

Format: `Wert [Herkunft/Sicherheit Quelle]`. Quellen: [sources.md](sources.md). Spielerseite: [mechanics.md](mechanics.md), [economy.md](economy.md).

**Ehrlicher Befund:** Das Wiki enthält keine Gegner-HP-Tabelle, keine Speed-Werte und keine Wave-Zusammensetzung je Welle. Das Datenmodul-Suchen (Namensraum 828) lieferte nur 3 Unit-Stats und kein Gegner-/Wave-Modul [B/CONFIRMED ASTD-S3]. Drei gezielte Suchen (Wiki-Suche HP/Wave, Infinite-Skalierung, Websuche) fanden keine Formel [E ASTD-S28, ASTD-S29]. Daher stehen HP-Skalierung, Speed und Wave-Tabelle als UNKNOWN; belegt sind Typen, Debüt-Wellen, Rahmenwerte und HP-Eckpunkte.

## 1. Gegnertypen

| Typ | Eigenschaft | Konter | Debüt | Tag |
|---|---|---|---|---|
| Regular | nichts Besonderes | | Story Beginner Saga W1, Infinite W1 | O/HIGH ASTD-S25 |
| Powerful I | nur durch Units mit Upgrade >= 1 angreifbar | Unit upgraden | Story W4 (Beginner Saga), Infinite W4 | O/HIGH ASTD-S8, ASTD-S25 |
| Powerful II | nur Upgrade >= 2 | Upgrade 2 | Inner World (Story), W4; nicht in Normal-Infinite (?) | O/HIGH ASTD-S25 |
| Decelerate | sehr schnell am Start, wird nach jeder Kurve langsamer | Units nahe Basis | Desert Island W3 | O/HIGH ASTD-S8, ASTD-S25 |
| Air | nur Hill/Hybrid | Hybrid/Hill | Inner World W5, Infinite ca. W13 (?), Random Unit W12, Solo W11 | O/MEDIUM ASTD-S25, ASTD-S11 |
| Explosive | explodiert bei Tod, betäubt Units im Radius | Units abseits vom Pfad | Vampire Hideout W5 | O/HIGH ASTD-S8, ASTD-S25 |
| Cloner | verdoppelt sich beim Tod; Klone haben "sehr hohe HP" in späten Stages | Reveal | Hero Dome W5 | O/HIGH ASTD-S8, ASTD-S25 |
| Regenerator | heilt sich über Zeit | Bleed stoppt Heilung | Skull Island W3 | O/HIGH ASTD-S8, ASTD-S25 |
| Elemental | nur durch Statuseffekte, Abilities, Summons, Controllable | DoT-Units, TypeBane | Elemental-Infinite, Trials Lv 90+ | O/HIGH ASTD-S8 |
| Armored | Statuseffekte machen 0 Schaden | hoher Rohschaden, Crits | Tower Mode ("recently armored"), genauer Debüt UNKNOWN | O/MEDIUM ASTD-S8, ASTD-S18 |
| Steadfast | immun gegen Effekte, Slow, Verschiebung | Nuke | UNKNOWN | O/MEDIUM ASTD-S8 |
| Rage | wird schneller, je niedriger die HP | früh verlangsamen | Familiar Planet (World 2) | O/HIGH ASTD-S8, ASTD-S25 |
| Mini-Boss | mehr HP als normal; später von Cloner ersetzt | | Beginner Saga W15 | O/HIGH ASTD-S25 |
| Boss | sehr viele HP, manche betäuben Units, manche schaden der Basis; immun gegen Prozent-Schaden | Burst-DPS | Beginner Saga W15 | O/HIGH ASTD-S8, ASTD-S25 |
| Schild/Stealth | UNKNOWN (kein Schildsystem, kein Stealth belegt) | | | U/UNKNOWN |
| Spawn-on-death | Cloner (zwei oder mehr Regular), Explosive als Zusatz | | | O/HIGH ASTD-S25 |
| Enchant | Gegner tragen Holy/Dark/Nature/Fire/Electric/Water, ab Tower-Floor 50 mit Enchant-Units | Enchant-Dreieck | | O/MEDIUM ASTD-S18, ASTD-S22 |

Geschwindigkeit: kein Zahlenwert. Extreme Mode: ca. doppelte Geschwindigkeit [O/MEDIUM ASTD-S25]. Slow-Effekte wirken als Prozent auf Basis-Speed ([mechanics.md](mechanics.md)).

## 2. HP-Skalierung

| Aspekt | Wert | Tag |
|---|---|---|
| Formel Story/Infinite je Welle | UNKNOWN. Das Wiki sagt nur, Gegner bekommen "more HP" und werden schneller mit Wellennummer | U/UNKNOWN, O/MEDIUM ASTD-S11 |
| Extreme-Modus | 10x HP, ca. 2x Speed, Belohnungen 3x | O/MEDIUM ASTD-S25, ASTD-S11 |
| Raid-Boss (19 Wellen) | 10 Mrd. HP; Welt-Wettbewerb-Raid 15 Mrd. | O/MEDIUM ASTD-S9 |
| Gauntlet-Gegner | 200 Mio. bis über 1 Mrd. HP | O/HIGH ASTD-S19 |
| Zone-Raid (5 Wellen) | je Welle 1 Gegner "with a lot of HP"; Wellenzahl 5; letzter ist Boss und betäubt Units | O/MEDIUM ASTD-S9, ASTD-S22 |
| Metal-Freezer-Clone | 22 Mio. HP (Summon-HP, nicht Gegner) | O/LOW ASTD-S11 |
| Frühe Story-Gegner | "thousands of HP" bei Raid-Start (alte Seite) | O/LOW ASTD-S25 |

Rechenhilfe für uns (D/LOW): Zwischen Unit-Schaden 9 (2 Sterne) und 20 730 000 (7 Sterne) liegen 2,3 x 10^6; Gegner-HP von Frühspiel (Tausende) bis Gauntlet (10^9) liegen ebenfalls etwa 10^6 auseinander. Der Spieler wächst also mit etwa der gleichen Spanne wie die Gegner. Genaue Wachstumsrate je Welle: UNKNOWN.

## 3. Wave-Zusammensetzung

Eine vollständige Wellen-Tabelle (Anzahl, Typ, HP je Welle) einer Stage ist **UNKNOWN**. Belegt ist das Rahmengerüst.

| Modus | Wellen | Aufbau | Tag |
|---|---|---|---|
| Story je Karte | 6 Missionen, je 15 Wellen (Mini-Boss/Boss in Welle 15, laut Guides "15 waves story") | Normal + Powerful I (Beginner Saga), später Decelerate, Powerful 1/2, Air, Explosive, Cloner | O/MEDIUM ASTD-S14, ASTD-S15, ASTD-S9 |
| Trials (World 1) | 15, 16 oder 19 Wellen je Level-Gate (25 bis 150) | Level 75: Units schlafen 350 s am Wellenstart; Level 90/100/150: Elemental, Boss stunnt | O/HIGH ASTD-S27 |
| Raids | 15 oder 19 Wellen, bis zu 8 Spieler, oft 3+ Pfade | Boss(e) am Ende, 5 Regenerate nach dem Boss, Skip-Limit um Welle 8 | O/MEDIUM ASTD-S22, ASTD-S9 |
| Zones | 5 Wellen, 1 Gegner je Welle | nur Kategorie-Units erlaubt, 2,3 Mio. Startgeld | O/HIGH ASTD-S22, ASTD-S9 |
| Infinite | endlos | steigende HP und Speed; Auto-Skip gesperrt ab W60 bei 60+ Gegnern | O/HIGH ASTD-S11 |
| Tower Mode | beliebig viele Floors, je Floor zufällige Karte und Gegnerprofil | Standard (Powerful 1/2, Explosive, Rage, Air, Armored), Air-lastig, Elemental+Explosive; ab Floor 50 mit Enchant | O/HIGH ASTD-S18 |
| Gauntlet | endlos, zeitbasiert | 2 Decelerates mit Reveal-Trick, danach Zeit-Stall | O/MEDIUM ASTD-S9 |

### Beispiel Stage: Story "Beginner Saga" (Stage-Gerüst)

| Mission | Name | Boss | Tag |
|---|---|---|---|
| 1 | Green Man | Galdo | O/HIGH ASTD-S15 |
| 2 | Manly | Recame | |
| 3 | Red Fool | Jace | |
| 4 | Fastest | Buttler | |
| 5 | Leader | Ganyu | |
| 6 | The True Supreme Power | Supreme-Leader | |

Gegnerarten der Karte: Normal und Powerful I, Powerful ab Welle 4 [O/HIGH ASTD-S15, ASTD-S25]. XP bei Abschluss (Normal): 10 000 [O/HIGH ASTD-S15]. Belohnung: Pod-Mount, Alien Soldier 60 %, Alien Soldier II 20 bis 30 %, Alien Soldier III 10 %, Gash 10 % (nur Mission 1) [O/HIGH ASTD-S15]. HP und Zahl je Welle: UNKNOWN.

### Debüt-Reihenfolge der Typen (Story, aus den Stage-Tabellen)

Normal -> Powerful (Beginner Saga W4) -> Decelerate (Desert Island W3) -> Cloner (Hero Dome W5) -> Powerful II und Air (Inner World) -> Explosive (Vampire Hideout) -> Regenerator (Skull Island) -> Rage (Familiar Planet, World 2) -> Elemental (Elemental-Infinite, Trials). Jeder Kartenwechsel führt einen neuen Gegnertyp ein [O/HIGH ASTD-S25, ASTD-S14].

## 4. Boss-Waves

| Boss-Eigenschaft | Beispiel | Tag |
|---|---|---|
| Betäubt Units | Meruem (Kingdom of Ants), Esidisi, Wamuu, Kars; Zone-Letztboss | O/HIGH ASTD-S14, ASTD-S9 |
| Schadet der Basis | Ketchup, Kanum, Straizo, Dio Brando, Beast/Colossal Titan | O/HIGH ASTD-S14 |
| Zeit des Stuns | skaliert nicht mit Spielgeschwindigkeit (Zone), deshalb 1x empfohlen | O/MEDIUM ASTD-S9 |
| HP | 10 Mrd. in 19-Wellen-Raids | O/MEDIUM ASTD-S9 |
| Prozentschaden | Bosse immun | O/HIGH ASTD-S8 |

## 5. Pfade, Karten

Mehrere Pfade und Spawns kommen vor (Raids mit 3+ Pfaden). Eine Zone/Map hat typisch 1 bis 3 Pfade; "double path" Infinite wurde entfernt [O/MEDIUM ASTD-S9, ASTD-S11].
