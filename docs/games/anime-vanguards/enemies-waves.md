# Anime Vanguards - Gegner und Waves

Quelle der Gegnerwerte: `Module:EnemyData/data` (AV-S5, Datenmodul, B). Tags: `Wert [Herkunft/Sicherheit Quelle]`, Quellenliste: [sources.md](sources.md). Einheiten: [units.md](units.md), Mechaniken: [mechanics.md](mechanics.md).

**Deutlich markierte Lücken:**
- Basis-HP (der Wert, mit dem `HealthMultiplier` multipliziert wird) und die Waveskalierung (Formel/Tabelle) stehen nicht im Wiki. Drei Versuche (EnemyData-Modul, Enemies-/Story-/Gamemodes-Seite, Infinite-Mode-Seite, Websuche) fanden nur qualitative Aussagen. [U/UNKNOWN]
- Wave-für-Wave-Zusammensetzung einer Stage ist nicht dokumentiert, nur Roster, Boss je Act und Bossfähigkeit. [U/UNKNOWN]

## 1. Felder eines Gegners (Modulstruktur)

| Feld | Bedeutung | Tag |
|---|---|---|
| `SpeedMultiplier` | Speed relativ zu einer unbekannten Basisgeschwindigkeit (Spanne 0.3 bis 2.6; Games-Platzhalter 0) | O/HIGH AV-S5 |
| `HealthMultiplier` | HP relativ zu unbekannter Basis-HP (normal 1 bis 12, Bosse 7 bis 60) | O/HIGH AV-S5 |
| `OvershieldPercentage` | Feld mit Standardwert 25; Bosse mit Mutator "Overshield" 50 oder 100; Alien General 55; Bedeutung (Schildanteil oder Reduktion) UNKNOWN | O/MEDIUM AV-S5 |
| `Yen` | Yen-Wert des Gegners (vermutlich Kill-Ertrag, nicht bestätigt); 20-40 normale Gegner, 150 Bosse | O/LOW AV-S5 |
| `Type` | "Boss" oder leer | O/HIGH AV-S5 |
| `Act` | Act (1-6) in dem der Boss in der Story erscheint | O/HIGH AV-S5 |
| `Mutators` | Overshield, Regen, Resilient, Armored, Absorption, Immunity, Challenger, Energy Drain, Ossified, Sturdy, Solidified | O/HIGH AV-S5 |
| `Ability`/`Mechanics` | Stun (Dauer, Anzahl Ziele, Range, Angriffsintervall), Summon, Evolution (Transformation) | O/HIGH AV-S5 |
| `DangerLevel` | Trivial / Moderate / Critical / Extreme / Catastrophic (Kosmetik) | O/MEDIUM AV-S5 |

## 2. Gegnertypen und Eigenschaften (Katalog der Mutatoren und Mechaniken)

| Eigenschaft | Regel | Beispiele | Tag |
|---|---|---|---|
| Schild / Overshield | Zusätzliche Schadensreduktion (Zahl UNKNOWN); mit Nullify ausschaltbar; World Destroyer entfernt Overshield komplett | Doria, Hirko, Lilia, Shielded Kuinshi, Alien General | O/MEDIUM AV-S5, AV-S11 |
| Resilient / Armored / Sturdy / Ossified / Solidified | weitere Reduktionsarten | Plague Kuinshi (Resilient), Armored Warrior, MaMagent (Sturdy, Overshield), Dragon Fang Warrior (Ossified) | O/MEDIUM AV-S5 |
| Regen | Heilung über Zeit, durch Bleed/Rupture unterdrückt; Modifier "Regen Enemies" = +0.2 %/s | Kuinshi Warrior Grunt, Lizard Curse, Horned Demon, Lesser Demon, Boohon | O/HIGH AV-S5, AV-S6, AV-S11 |
| Absorption | Boo-Bosse absorbieren (Mutator, Wirkung nicht beziffert) | Boohon, Boockleo, Super Boo, Fat Boo | O/MEDIUM AV-S5 |
| Spawn-on-death / Teilung | "Thrice": Gegner vermehren sich beim Tod, Duplikate mit halber HP; Hobgoblin summont; Shinobi Puppet Clone/Thrice; The Compulsary splittet in 6 Bosse; Eleven Men Clones | Hobgoblin, Shinobi Puppet, The Compulsary | O/HIGH AV-S5, AV-S6, AV-S16 |
| Extra Life / Multiple Lives | zusätzliche Leben | Heracles, Homunculus, Shogamo, Valentine | O/HIGH AV-S5 |
| Stun auf Einheiten | Bosse stunnen 3 bis 10 s, 1 bis 2 Ziele oder alle in Range, Angriff alle 12-15 s | Friezo (10 s, 1 Ziel, 12 s), Friezo Full Power (10 s, 2 Ziele, 15 s), Recroom 6 s, Guldy 3 s | O/HIGH AV-S5 |
| Unit-Deletion | Boss löscht Einheiten | Gilgamesh (Golden Castle) | O/MEDIUM AV-S5 |
| Fliegen / Stealth | im Modul nicht vorhanden | - | U/UNKNOWN |
| Transformation | Boss wechselt Phase ("Evolution") | Argon, Friezo, Sosora, Medea, Mohato | O/HIGH AV-S5, AV-S13 |
| Temporäre Unverwundbarkeit | | The Almighty (Kuinshi Palace) | O/HIGH AV-S5 |

## 3. Beispielstage mit allen Gegnern

### 3.1 Planet Namak (Story Stage 1, 6 Acts, Boss je Act)

| Gegner | Typ | Speed | HP-Mult | Overshield-Feld | Yen | Anmerkung | Tag |
|---|---|---|---|---|---|---|---|
| Alien Soldier | normal | 1.25 | 1.375 | 25 | 25 | Trivial | O/HIGH AV-S5 |
| Alien Enlist | normal | 1.25 | 2.375 | 25 | 30 | Trivial | O/HIGH AV-S5 |
| Alien Elite | normal | 1.0 | 4.375 | 25 | 30 | Moderate | O/HIGH AV-S5 |
| Alien Cadet | normal (schnell) | 2.0 | 1.875 | 25 | 30 | Critical | O/HIGH AV-S5 |
| Alien General | normal (Overshield) | 1.0 | 3.375 | 55 | 30 | Extreme | O/HIGH AV-S5 |
| Vogita | Boss Act 1 | 1.1 | 18 | 25 | 150 | keine Fähigkeit | O/HIGH AV-S5, AV-S13 |
| Doria | Boss Act 2 | 0.6 | 18 | 100 | 150 | Overshield | O/HIGH AV-S5 |
| Argon (Transformed) | Boss Act 3 | 0.8 | 18 | 50 | 150 | Phasenwechsel, Overshield | O/HIGH AV-S5 |
| Giyu | Boss Act 4 | 0.4 | 28 | 25 | 150 | summont Guldy, Butter, Recroom, Jiece | O/HIGH AV-S5, AV-S13 |
| Guldy | Mini-Boss | 0.9 | 7 | 25 | 62.5 | Stun 3 s, alle in Range | O/HIGH AV-S5 |
| Butter | Mini-Boss | 2.6 | 4 | 25 | 62.5 | schnellster Gegner im Modul | O/HIGH AV-S5 |
| Recroom | Mini-Boss | 0.5 | 18 | 25 | 62.5 | Stun 6 s, 1 Ziel | O/HIGH AV-S5 |
| Jiece | Mini-Boss | 1.8 | 6 | 25 | 62.5 | | O/HIGH AV-S5 |
| Friezo | Boss Act 5 | 0.8 | 23 | 25 | 150 | Stun 10 s, 1 Ziel, alle 12 s | O/HIGH AV-S5 |
| Friezo (Full Power) | Boss Act 6 | 0.9 | 32 | 25 | 150 | Phasenwechsel, Stun 10 s, 2 Ziele, alle 15 s | O/HIGH AV-S5 |

Wave-Reihenfolge, Spawnmengen und Anzahl Waves je Act: UNKNOWN. Belegt: pro Act ein Boss; Nightmare-Modus existiert mit gleichen Acts; Modifier-Karten zusätzlich ("not all enemy modifiers are shown (e.g. Thrice)") [O/MEDIUM AV-S13].

### 3.2 Sand Village (Story Stage 2)

| Gegner | Typ | Speed | HP-Mult | Overshield-Feld | Yen | Anmerkung | Tag |
|---|---|---|---|---|---|---|---|
| Puppet | normal | 1.0 | 1.0 | 25 | 25 | Referenzgegner (HP 1.0x) | O/HIGH AV-S5 |
| Fast Puppet | normal | 2.0 | 1.575 | 25 | 40 | | O/HIGH AV-S5 |
| Strong Puppet | normal | 1.2 | 2.375 | 25 | 40 | Overshield | O/HIGH AV-S5 |
| Shinobi Puppet | normal | 1.1 | 2.5 | 25 | 40 | Clone/Thrice | O/HIGH AV-S5 |
| Dismantled Puppet | normal | 0.8 | 2.5 | 25 | 20 | | O/HIGH AV-S5 |
| Large Puppet | normal | 1.1 | 4.0 | 25 | UNKNOWN | | O/HIGH AV-S5 |
| Dodera | Boss Act 1 | 0.85 | 20 | 25 | 150 | Stun | O/HIGH AV-S5, AV-S13 |
| Kimase | Boss Act 2 | 0.9 | 25 | 25 | 150 | SPA-Debuff +50 % | O/HIGH AV-S5, AV-S13 |
| Itochi | Boss Act 3 | 1.1 | 25 | 25 | 150 | Stun | O/HIGH AV-S5, AV-S13 |
| Hirko | Boss Act 4 | 0.6 | 30 | 50 | 150 | Overshield | O/HIGH AV-S5, AV-S13 |
| Third Kazekage | Boss Act 5 | 0.9 | 30 | 25 | 150 | | O/HIGH AV-S5, AV-S13 |
| Sosora (Second Phase) | Boss Act 6 | 1.1 | 30 | 25 | 150 | Phasenwechsel, Summon | O/HIGH AV-S5, AV-S13 |

### 3.3 Weitere Stages im Überblick (Spannen aus dem Modul)

| Stage | Normale Gegner HP-Mult | Boss HP-Mult | Speed-Spanne | Auffälligkeiten | Tag |
|---|---|---|---|---|---|
| Double Dungeon | 1.875 bis 4.4 (Hobgoblin) | 15 bis 40 | 0.8 bis 2.2 (Lycan 2.2) | Hobgoblin splittet; 6 Bosse (Statuen) mit Stun, God Statue 40 | O/HIGH AV-S5 |
| Shibuya Station | 1.0 bis 4.0 | 20 bis 45 | 0.7 bis 1.3 | Regen (Lizard Curse, Finger Bearer), Sukono (Infinite-Boss, Stun + DMG-Debuff), Chaso (DMG-Debuff -15 %) | O/HIGH AV-S5, AV-S13 |
| Underground Church | 1.85 bis 9.0 | 30 bis 57 | 0.65 bis 1.5 | Extra Life, Ossified, Gilgamesh löscht Einheiten (Boss 57 HP-Mult) | O/HIGH AV-S5 |
| Spirit Society | 1.0 bis 12.0 (Plague Kuinshi) | 20 bis 60 | 0.65 bis 1.5 (Games = 0) | The Superstar 60, The Compulsary splittet | O/HIGH AV-S5 |
| Martial Island | 2.25 bis 12 | 20 bis 60 | 0.6 bis 1.6 | Boo-Bosse mit Regen + Absorption; Kid Boo, Boohon: Range 20 | O/HIGH AV-S5 |
| Edge of Heaven | 2.25 bis 12 | 25 bis 60 | 0.65 bis 2.0 | Armored/Immunity-Mutatoren, Brisket speed 2.0, Gear Boy 50 (Armored, Regen) | O/HIGH AV-S5 |

Faustregel (aus 6 Stages): normaler Gegner = 1x bis 6x der "Puppet-Basis", Elite/Tank bis 12x, Boss = 15x bis 60x, d.h. Boss ca. 5x bis 20x HP eines Standardgegners derselben Stage [D/HIGH AV-S5]. Spätere Stages haben im Mittel mehr HP-Mult (Edge of Heaven/Martial Island Bosse bis 60 gegenüber 30 in Sand Village) [D/MEDIUM AV-S5].

## 4. HP-Skalierung über die Waves

| Aussage | Wert | Tag |
|---|---|---|
| Formel / Tabelle | UNKNOWN | U/UNKNOWN |
| Infinite Mode | "scaling difficulty through increasing enemy health and speed", Schwierigkeit hängt zusätzlich von der Spielerzahl der Party ab | O/MEDIUM AV-S19 |
| Spike Wave 100 | Gegner werden bei Wave 100 deutlich zäher und schneller | O/MEDIUM AV-S19 |
| Ab Wave 50 | Gegner werden pro Wave schneller (seit 2025-07-07) | O/MEDIUM AV-S19 |
| HP-Obergrenze für sichtbares Sterben | Gegner mit über 4 294 967 295 HP (2^32 - 1) erscheinen unverwundbar bis HP unter diese Marke fällt; praktisch nur in Sandbox, Infinite, Arin-Boss-Event | O/HIGH AV-S14 |
| Skalierung mit Spieleranzahl | Elemental Towers: "does not scale with the amount of people"; Limited Modes: bis 4 Spieler, HP skaliert pro Spieler | O/MEDIUM AV-S18, AV-S23 |
| Waves je Modus | Story-Act: UNKNOWN; Raids/Portals/Elemental-Tower-Floor: 20; Dungeons: 30; Paragon (entfernt): 15 | O/HIGH AV-S12, AV-S18 |
| Infinite-Meilensteine | Belohnungen alle 10 Waves (siehe [meta.md](meta.md)) | O/HIGH AV-S12, AV-S19 |

Modifier-Hebel auf HP/Speed (Dungeon/Odyssey/Challenge-Karten, additiv stapelbar durch Mehrfach-Karten) [O/HIGH AV-S6]:

| Modifier | Wirkung |
|---|---|
| Strong Enemies | +100 % Gegner-HP je Karte |
| Fast Enemies | Speed +20 je Karte (Einheit nicht angegeben) |
| Shielded | +3 Schilde |
| Regen Enemies | Regeneration +0.2 %/s |
| Dodge | Dodge-Chance +4 % |
| Thrice | Gegner vervielfachen sich beim Tod, Duplikate halbe HP |
| Revitalize | beim Tod Heilung naher Gegner um 7.5 % |
| Immunity | Gegner immun gegen CC (Slow, Stun) |
| Exploding | Stun 1.8 s auf nahe Einheiten bei Gegnertod |
| Champions | Mini-Boss alle 6 Waves (Stackbar: mehr Bosse) |
| Drowsy | Einheiten-SPA +4 % |
| Quake | alle 10 s Stun auf Einheiten in Range für 5 s |

## 5. Boss-Waves

| Aspekt | Wert | Tag |
|---|---|---|
| Story | je Act ein fester Boss (6 Acts je Stage); Act 4 Namak: Boss mit Summon; Act 6 meist Phasenwechsel ("Evolution") | O/HIGH AV-S13 |
| Infinite | Shibuya: Sukono-Boss mit steigender Spawnchance alle 10 Waves; Kill-Belohnung Cursed Fingers | O/MEDIUM AV-S12, AV-S16 |
| Dungeon/Odyssey | Champions-Modifier: Mini-Boss alle 6 Waves | O/HIGH AV-S6 |
| Boss Events | wöchentlich rotierend (Igros, Sukono, Saber Alternate, Arin); "The Founder, Arin" spawnt endlos Nuclear Giants (je 44 XP); Boss Rush deaktiviert Traits | O/HIGH AV-S12, AV-S16 |
| Legend Stages | Kuinshi Palace Act 1 gibt 275 XP bei Abschluss; Compulsory splittet in sechs weitere Bosse | O/HIGH AV-S16 |
| Boss-Spawnrate (Infinite) | UNKNOWN (steigt mit der Wave laut FAQ) | O/LOW AV-S16 |
