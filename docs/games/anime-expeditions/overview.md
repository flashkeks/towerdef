# Anime Expeditions (AE) - Überblick

Kennzeichnung: `Wert [Herkunft/Sicherheit Quelle]`, siehe [sources.md](sources.md). Weitere Dateien: [mechanics](mechanics.md), [economy](economy.md), [units](units.md), [enemies-waves](enemies-waves.md), [meta](meta.md), [design-lessons](design-lessons.md).

## Stammdaten

| Feld | Wert |
|---|---|
| Name (Roblox) | "Anime Expeditions" [V/CONFIRMED AE-S1] |
| Entwickler | Gruppe "Expeditions Entertainment" (ID 35929511, verifiziert) [V/CONFIRMED AE-S1] |
| Plattform | Roblox (PC/Mobile), Genre laut API Strategy / Tower Defense [V/CONFIRMED AE-S1] |
| Universe / Root-Place | 7613921865 / 84515722934860 [V/CONFIRMED AE-S1] |
| Erstellt | 2025-04-28 [V/CONFIRMED AE-S1] |
| Letztes Update | 2026-10-05 (API) [V/CONFIRMED AE-S1] |
| "Release Update (0.0)" laut Wiki | 17. Juli 2026 [O/MEDIUM AE-S25]. Die Roblox-Seite existiert seit April 2025, die Wiki-Zählung beginnt erst mit dem Juli-2026-Release; ob davor ein Test-/Vorab-Zugang lief: UNKNOWN |
| Updates laut Wiki | 0.0 Release, 0.5 Villain Invasion, 1.0 Warrior Saga, 2.0 Summer Siege, 2.5 (Snowy Castle / Crimson Shore) [O/MEDIUM AE-S27, AE-S14, AE-S24] |
| Status | aktiv, Update 2.5 live, Update 3 angekündigt ("Available until Update 3") [O/MEDIUM AE-S18] |
| Besuche | 801 286 716 [V/CONFIRMED AE-S1] |
| Gleichzeitige Spieler | 3 847 (Abruf 2026-10-06) [V/CONFIRMED AE-S1] |
| Favoriten | 211 797 [V/CONFIRMED AE-S1] |
| Votes | 271 498 up / 12 119 down = 95,7 % positiv [V/CONFIRMED AE-S2], [D/HIGH Rechnung 271498/283617] |
| Server | maxPlayers 24 pro Server (Lobby); Matches Story/Raid bis 4 Spieler [V/CONFIRMED AE-S1], [O/HIGH AE-S14] |
| Gamepass-Liste per API | UNKNOWN (Endpoint lieferte 404) |

## Core Loop (5 Sätze)

1. Der Spieler beschwört Units mit Gems an Bannern (Gacha, Pity) und stellt ein Team zusammen [O/HIGH AE-S9].
2. In Story, Raid, Challenge, Expedition oder Tournament platziert er Units mit Yen auf einer Map und verstärkt sie in Upgrade-Stufen, während Wellen von Basic-, Elite- und Boss-Gegnern laufen [O/HIGH AE-S8, AE-S19].
3. Siege geben Gems, Gold, Unit-EXP, Player-EXP, Trait Crystals und Materialien [O/HIGH AE-S3].
4. Damit werden Units gelevelt, Traits und Stat-Potenzial neu gewürfelt, Mythics/Secrets zu Evolutionen weiterentwickelt und Equipment gesammelt [O/HIGH AE-S10, AE-S11, AE-S16].
5. Stärkere Units erlauben härtere Acts (Hard, Mastery, Infinite) und Raids, die wiederum die Materialien für die nächste Evolution liefern [O/MEDIUM AE-S14].

## Was AE einzigartig macht

- **Zwei Währungsebenen im Match**: Yen für Platzieren/Upgraden, dazu Stage-Effekte, die pro Act gewürfelte Gegner-Modifikatoren festlegen (Sprinter, Tank, Regen, Summoner, Commander ...) [O/HIGH AE-S3, AE-S5].
- **Elemente + Archetypen**: 9 Elemente (inkl. "Farm") und 3 Archetypen (Physical, Magical, Psychic). Mastery-Stages setzen Element-Resistenzen (0,5x) und -Schwächen (1,5x) pro Map [O/HIGH AE-S3, AE-S6].
- **Star Missions mit Build-Vorgaben** ("Win with only 1 farm placed", "2+ magical units", "less than 50k Yen") statt reiner Wellen-Ziele; jede Mission gibt einen Trait Crystal [O/HIGH AE-S3, AE-S14].
- **Nicht-lineare Units**: Meter, Follow-Up-Attacken, Path-Summons/Path-Traps, Klone, Marken (Puppet Mark, Crimson Mark ...) als Kernmechanik der Mythics [O/HIGH AE-S6, AE-S7].
- **Evolution + zwei Trait-Slots + Stat-Potenzial (Buchstabennoten C bis SSS)** als dreifacher Zufalls-Sink [O/HIGH AE-S10, AE-S11, AE-S16].
- **Expedition-Modus**: lineare Payload-Verteidigung über Nodes, mit persistentem Hub (Research Lab, Gold Mine, Armory ...) [O/HIGH AE-S13].
- **Wiki als Datenmodul**: Das Fandom-Wiki führt offiziell übernommene Daten (Module `AEOfficial/*`, CC BY-SA 4.0), daher ungewöhnlich gute Datenlage für ein so neues Spiel [B AE-S3 bis AE-S7].

## Datenlage

Gut: Unit-Kosten/Damage/SPA/Range pro Upgrade, Gacha-Raten, Traits, Modifikatoren, Stage-Belohnungen und Bosse je Act. UNKNOWN: Startgeld, Yen pro Kill/Wave, Gegner-HP und HP-Formel, Wellen-Zusammensetzung, Schadensformel, Verkaufswert (außer Ramen Guy), Spieler-Level-XP-Kurve. Details in den Einzeldateien.
