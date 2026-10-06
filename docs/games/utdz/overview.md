# Universal Tower Defense Z (UTDZ) - Überblick

Quellen-Präfix `UTDZ`, siehe [sources.md](sources.md). Format: `Wert [Herkunft/Sicherheit Quelle]`.

## Stammdaten

| Feld | Wert |
|---|---|
| Name (API) | "[⚽4.25🏆] Universal Tower Defense Z" (Update-Präfix 4.25) [V/CONFIRMED UTDZ-S1] |
| Frühere Namen | Universal Tower Defense X (UTDX) bis Update 4.0; Umbenennung am 2026-07-09 [D/MEDIUM UTDZ-S21; Datum nur Drittseite, "Update 4.0 (Juli 2026)" passt zum Auftrag] |
| Gleiches Spiel? | Ja: gleiche Place-ID 133410800847665 und Universe 7488190691, kein Reset [V/CONFIRMED UTDZ-S1 für IDs; D/MEDIUM UTDZ-S21 für "nichts migriert"] |
| Entwickler | Gruppe "Universal Tower Defense [UTD]" (Group-ID 33861560, verifiziert) [V/CONFIRMED UTDZ-S1] |
| Plattform | Roblox (PC/Mobile/Konsole) [V/CONFIRMED UTDZ-S1] |
| Start | erstellt 2025-04-04 [V/CONFIRMED UTDZ-S1] |
| Letztes Update | 2026-09-19 [V/CONFIRMED UTDZ-S1] |
| Status | aktiv (Update 4.25 laufend) [V/HIGH UTDZ-S1] |
| Besuche | 304.135.326 [V/CONFIRMED UTDZ-S1] |
| Gleichzeitige Spieler | 103 am Abruf 2026-10-06 [V/CONFIRMED UTDZ-S1] (Auftrag nennt ~104) |
| Favoriten | 207.800 [V/CONFIRMED UTDZ-S1] |
| maxPlayers | 12 pro Server [V/CONFIRMED UTDZ-S1] |
| Genre | Strategy / Tower Defense [V/CONFIRMED UTDZ-S1] |
| Franchise-Charakter | Parodie-Units aus Anime (Dragon Ball, Naruto, One Piece, Bleach, JJK u. a.), seit 4.0 auch Marvel/Persona/Bleach-Crossover [O/MEDIUM UTDZ-S14, UTDZ-S20] |

## Namensvettern (nur Hinweis, nicht Teil dieser Doku)

Drittseite nennt unverwandte Spiele: "Tower Defense X" (TDX), "Universal Tower Defence" (britische Schreibung, Place 15775894939) und "Ultimate Tower Defense" (Place 5902977746) [D/LOW UTDZ-S21; Place-IDs nicht selbst geprüft]. Ein eigenes, älteres "Universal Tower Defense" desselben Entwicklers wurde nicht belegt: `UNKNOWN`.

## Core Loop (5 Sätze)

1. Der Spieler beschwört (Gacha, Gems) Units und stellt ein Team zusammen (Teamgröße 6 laut Team-Builder einer Drittseite [O/LOW UTDZ-S20]).
2. Im Match platziert und upgradet er Units mit der Match-Währung Yen (¥), bis die Waves (Story typischerweise 15 Waves [O/LOW UTDZ-S18]) abgewehrt sind.
3. Belohnungen (Gems, Gold, Spieler-EXP, Relics, Evolutionsmaterial, Raid-Währungen) fließen zurück in die Meta-Systeme.
4. Dort werden Units durch Level (max. 70), Etherealize (6 Stufen), Traits (Rerolls), Relics (Ausrüstung mit Substats) und Evolution/Synchro verstärkt.
5. Stärkere Teams öffnen schwerere Modi (Legend, Virtual Realm, Raids, Ultra Boss, World Raid mit 12 Spielern), die neue Units und Material liefern.

## Was macht UTDZ einzigartig

- Sehr tiefe Charakter-Meta wie in einem Gacha-RPG: Level mit Stat-Punkten, Stat-Ränge F bis SSS, Traits mit 0,1 %-Chance, Relic-Sets mit Substat-Rerolls, Etherealize (6 Stufen) [O/HIGH UTDZ-S11].
- Mehrstufige Evolution: Basis -> Evolution -> Unrivaled-Mark (Max-Level 100) -> Boundless; dazu Synchro (zwei Units verschmelzen oder feuern gemeinsam) [O/MEDIUM UTDZ-S3, UTDZ-S9, UTDZ-S20].
- Elementsystem (7 Elemente, 1,5x / 0,5x) für Units und Gegner [O/HIGH UTDZ-S11].
- Raid-Tag-Boni (+30 % Schaden für Units mit passendem Tag) [O/HIGH UTDZ-S15].
- Eingebauter Makro-Recorder (seit 2.0) [O/MEDIUM UTDZ-S9].
- Die Wiki-Daten zeigen kaum Informationen zu Match-Balance (Gegner, Wellen, Startgeld): siehe [economy.md](economy.md), [enemies-waves.md](enemies-waves.md) (viele UNKNOWN).

## Dateien

[mechanics.md](mechanics.md), [economy.md](economy.md), [units.md](units.md), [enemies-waves.md](enemies-waves.md), [meta.md](meta.md), [design-lessons.md](design-lessons.md), [sources.md](sources.md), Daten in [data/](data/).

## Wiki-Landschaft (wichtig für Datenqualität)

- `utdx.fandom.com`: klein (166 Artikel, 2.168 Edits), keine Datenmodule außer Standard-Vorlagen (Namensraum 828 enthält nur Dialogue, Hatnote, Mbox, Navbox, Quote) [O/CONFIRMED UTDZ-S2]. Unit-Seiten haben Upgrade-Tabellen.
- `universal-tdx.fandom.com` (zweites Wiki, per Suche gefunden): enthält Datenmodule (Mechanics, StoryData, Traits, Unit-Daten je Rarity, RaidData, WorldRaidData, VirtualRealmData u. a.) [O/CONFIRMED UTDZ-S19]. Hauptquelle dieser Doku. Beide Wikis nennen sich "UTDX"; Stand der Daten oft Update 2.x-3.x, nicht 4.25.
