# Meta-Progression BTD6

Kennzeichnung `[Herkunft/Sicherheit Quelle]`; Quellen in [sources.md](sources.md). Schwerpunkt dieser Recherche war Ökonomie und Gegner; Meta-Zahlen (XP-Kurve, MK-Kosten) wurden nicht abgerufen und sind als `UNKNOWN` markiert.

## Account-Progression

| Aspekt | Stand | Quelle |
|---|---|---|
| Spieler-Level | schaltet Tower frei: Dart L1; Boomerang/Bomb/Tack/Ice/Glue L2–6; Sniper/Sub/Buccaneer/Ace/Heli/Mortar L7–12; Wizard/Super/Ninja/Alchemist/Druid L15–17 und L19–20; Farm/Spike/Village/Engineer L22–24 und L26; neuere Tower (Dartling, Mermonkey, Desperado, Beast Handler, Skywarden) über „Unlock by Pops“ (3–3,5 Mio. Pops, Level 30) | [O/HIGH BTD-S15] |
| XP-Kurve des Accounts | UNKNOWN | – |
| Freeplay-XP | 30 % der Rate bis Runde 100, danach 10 % (seit v24; vorher 10 %, als „−90 %“ geführt) | [O/HIGH BTD-S4] |
| Helden | 17, je 20 Level, XP nur in der laufenden Partie, freischaltbar (Level-Bedingungen UNKNOWN) | [V/CONFIRMED BTD-S1] |
| Medaillen und Rahmen | Bronze Border (alle Easy-Medaillen auf einer Map), Gold Border (alle Medaillen inkl. Impoppable und CHIMPS), Black Border (CHIMPS ohne „saving upgrades“) | [O/HIGH BTD-S10, BTD-S11] |

## Währungen

| Währung | Quelle | Sink | Belegt durch |
|---|---|---|---|
| Cash (in der Partie) | Pops, Rundenbonus, Farmen | Tower und Upgrades | [O/HIGH BTD-S3] |
| Monkey Money | Spielfortschritt/Events, Achievements (Beispiel: 500 für „Poppable“-Achievement) | Items im Shop (Details UNKNOWN) | [O/MEDIUM BTD-S12] |
| Monkey Knowledge Points | Level-Ups, Achievements (+1 MK für Achievement „All for One and One for One“) | 100+ permanente Upgrades (Kosten UNKNOWN) | [V/CONFIRMED BTD-S1; O/HIGH BTD-S10] |
| Trophäen | Events/Aufgaben | Trophy Store (kosmetisch: Monkeys, Bloons, Animationen, Musik) | [V/CONFIRMED BTD-S1] |
| Insta Monkeys, Powers | Gameplay, Events, Achievements; zusätzlich alle 100 Freeplay-Runden (v8) | einmalige Einsätze in der Partie (Beispiele: Cash Drop 2500, Thrive +25 %) | [V/CONFIRMED BTD-S1; O/HIGH BTD-S2, BTD-S3] |

Monkey Knowledge enthält Spiel-relevante Boni, die in die Ökonomie eingreifen (More Cash +200 Start, Better Sell Deals +5 % Verkaufsrate, Flat Pack Buildings, Inland Revenue Streams +60 % Dorf-Cash, Pre-Game Prep usw.) [O/HIGH BTD-S3, BTD-S9]; alle diese Upgrades sind in CHIMPS deaktiviert („No Monkey Knowledge“) [O/HIGH BTD-S10].

## Gacha, Traits, Evolution

- Kein Gacha, keine Traits, keine Rerolls, keine Rarity-Stufen. Zufall beschränkt sich auf Gift-Box-Auswahl bei „Unlock by Pops“ [O/MEDIUM BTD-S15 Desperado: „Gift Box … ‘Unlock By Pops’ selection“].
- „Evolution“ entspricht den Upgrade-Pfaden und den Paragons (siehe [units.md](units.md)).

## Modi

| Modus | Regel | Quelle |
|---|---|---|
| Standard Easy/Medium/Hard | R1–40, R1–60, R3–80 | [O/HIGH BTD-S10, BTD-S11, BTD-S2] |
| Primary Monkeys Only | Easy nur mit Primary-Türmen und Held; schaltet Deflation frei | [O/HIGH BTD-S11] |
| Deflation | R31–60, 20000 Cash, kein Einkommen | [O/HIGH BTD-S11] |
| Magic Monkeys Only / Military Only | Hard bzw. Medium mit einer Klasse; Magic schaltet Double HP MOABs frei; Military Only schaltet Apopalypse frei | [O/HIGH BTD-S10, BTD-S2] |
| Alternate Bloons Rounds | geänderte, schwerere Rundenliste (Hard); schaltet Impoppable frei | [O/HIGH BTD-S10, BTD-S12] |
| Double HP MOABs | MOAB-Klasse mit doppelter HP; schaltet Half Cash frei (zusammen mit Magic Only) | [O/HIGH BTD-S10] |
| Half Cash | alles Einkommen halbiert, Startgeld 325 | [O/HIGH BTD-S10] |
| Impoppable | 1 Leben, R6–100, Kosten ×1,2 | [O/HIGH BTD-S12] |
| C.H.I.M.P.S. | Impoppable plus: keine Continues, kein Verlieren von Leben, kein Einkommen außer Pops, kein Monkey Knowledge, keine Powers, kein Verkaufen; schaltet nach Impoppable frei | [O/HIGH BTD-S10] |
| Apopalypse | zufällige Runden; schaltet nach Military Only (Medium) frei | [O/HIGH BTD-S2] |
| Sandbox | Test ohne Belohnung | [O/HIGH BTD-S10, BTD-S11] |
| Boss Events | einzelne Boss-Bloons mit 5 Stufen, Runden bis 120; periodische Events | [V/CONFIRMED BTD-S1; O/HIGH BTD-S4] |
| Odysseys | mehrere Maps hintereinander mit thematischen Regeln und Belohnungen | [V/CONFIRMED BTD-S1] |
| Contested Territory | Teams (6 insgesamt) erobern Kacheln auf geteilter Karte, Ranglisten | [V/CONFIRMED BTD-S1] |
| Quests, Content Browser | Lern-Quests; eigene Challenges/Odysseys bauen und teilen | [V/CONFIRMED BTD-S1] |
| Freeplay | nach Zielrunde unbegrenzt weiter, XP-Abschlag | [O/HIGH BTD-S4] |

## Multiplayer

- Co-Op bis zu 4 Spieler (öffentlich oder privat) auf allen Maps und Modi [V/CONFIRMED BTD-S1].
- Geteilter oder getrennter Cash, Spenden zwischen Spielern, Tower-Besitz: UNKNOWN (Wiki-Seite „Co-Op Mode (BTD6)“ erschien in der Suche, wurde aber nicht gelesen).
- Review-Hinweis: Verbindungsprobleme und Lag im Koop besonders in späten Runden [O/MEDIUM BTD-S18; siehe [design-lessons.md](design-lessons.md)].

## Monetarisierung (nur Struktur)

- Einmaliger Kauf des Spiels plus Käufe im Spiel (Währung, Cosmetics, Unlock-Pakete für Tower) und 3 DLC-Pakete [V/CONFIRMED BTD-S1; Desperado „Unlock Pack“ O/HIGH BTD-S15].
- Spielwichtige Inhalte sind auch ohne Geld freischaltbar (Pops, Level) [O/HIGH BTD-S15]; Kritik an der Menge der Angebote in [design-lessons.md](design-lessons.md).
