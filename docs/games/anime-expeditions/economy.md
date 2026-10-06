# Anime Expeditions - Ökonomie

Kennzeichnung `Wert [Herkunft/Sicherheit Quelle]`, Quellen in [sources.md](sources.md). Zurück zu [overview.md](overview.md). Rohdaten der Upgrade-Kosten: [data/units.json](data/units.json) (43 Units, Teilmenge).

**Ehrlicher Stand**: Die In-Match-Währung heißt **Yen** [O/HIGH AE-S17, AE-S5]. Startgeld, Yen pro Kill, Yen pro Wave und passives Einkommen stehen weder im Wiki noch in den Datenmodulen (Gegner-Modul enthält weder HP noch Yen; Stage-Modul enthält keine Yen-Werte). Drei gezielte Versuche (EnemyData-Modul, StageData-Modul, Enemies-/Currencies-/Story-Seite) blieben ohne Zahl, daher UNKNOWN. Das Spiel ist nur wenige Monate öffentlich dokumentiert.

## In-Match-Geld (Yen)

| Größe | Wert | Kennzeichnung |
|---|---|---|
| Startgeld je Modus/Schwierigkeit | UNKNOWN | [U/UNKNOWN] |
| Yen je Kill (Basis) | UNKNOWN. Belegt nur relativ: Farm-Passiv "Donburi" +50 % Yen aus Kills; Zombie-Gegner geben -50 %, Zombified 0 | [O/HIGH AE-S7, AE-S5] |
| Yen je Wave | UNKNOWN (kein Wave-Bonus belegt) | [U/UNKNOWN] |
| Passives Einkommen | Nur über Farm-Units (unten) | [O/MEDIUM AE-S7] |
| Geteiltes oder getrenntes Geld im Koop | UNKNOWN | [U/UNKNOWN] |
| Yen-Ziele als Star Missions | "Win with spending less than 100k yen" (Normal Act 1/4), "less than 50k Yen" (Hard Acts) | [O/HIGH AE-S3] |
| Kosten-Reduktion | Trait "Draconic": -10 % Gesamtkosten; Trait "Investor": +25 % Farm-Einkommen | [O/HIGH AE-S10] |
| Zusätzliche Gewinn-Quellen im Match | "Research Tree", "Stat Anvils", "Repair Hammer", "Trait Tomes", Karten ("Blood Money", "Bounty Hunter") existieren als Match-Systeme (nur über Modifier-Texte belegt); Werte UNKNOWN | [O/LOW AE-S5] |

Rückschluss auf Größenordnung (Rekonstruktion): Die 50k-/100k-Yen-Ziele der Story-Acts zeigen, dass ein ganzer Normal-Act mit weniger als 100 000 Yen Gesamtausgaben gewinnbar ist; eine Top-Unit kostet allein 25 000 bis 93 000 bis zum Maximum. Das Gesamt-Budget eines Acts liegt also in der Größenordnung zehntausender Yen, nicht Millionen [R/LOW AE-S3, AE-S7; Begründung: Missionsziel muss erreichbar, aber nicht trivial sein].

## Farm-Units

Element "Farm" ist ein eigenes Element; Farm-Units haben Damage 0 und Feld `Farm` je Stufe [O/HIGH AE-S6, AE-S7]. **Was `Farm` genau bedeutet (Yen pro Wave, pro Zyklus oder pro Sekunde) steht nicht im Modul**; Annahme "Yen pro Wave-Zyklus": UNKNOWN.

| Unit | Rarity | Limit | Stufe (Kosten kumulativ, Farm-Wert je Stufe) | Gesamtkosten bis Max | Kennzeichnung |
|---|---|---|---|---|---|
| Stone Alchemist | Epic | 3 | 550 (Farm 550), +1 100 (1 100), +2 200 (2 750), +4 500 (3 500) | 8 350 | [O/HIGH AE-S7] |
| Ramen Guy | Legendary | 1 | 750 (425), +1 750 (1 000), +2 500 (1 900), +4 000 (3 300), +8 000 (6 000), +10 500 (9 000), +12 500 (11 500) | 40 000 | [O/HIGH AE-S7] |

Weitere Eigenschaften Ramen Guy: Verkaufswert nur 10 % der Gesamtkosten ("Capital Lock"); Passiv "Donburi" +50 % Yen aus Kills (für das Team, Gültigkeit für Mitspieler UNKNOWN) [O/HIGH AE-S7].

Rendite-Überlegung (abgeleitet, Einheit offen): Ramen Guy zahlt 40 000 ein und erreicht Farm-Wert 11 500; Verhältnis Max-Farm zu Gesamtkosten = 0,29 [D/MEDIUM: 11500/40000]. Stone Alchemist: 3 500/8 350 = 0,42 [D/MEDIUM]. Break-even-Zeit nur berechenbar, wenn die Zeiteinheit bekannt ist: UNKNOWN. Die Stage-Missionen "Win with only 1 farm placed" und "Win with no farms placed" (Hard) zeigen, dass Farms die Standard-Ökonomie sind, aber optional [O/HIGH AE-S3]. Modifier "No Farms" deaktiviert sie ganz [O/HIGH AE-S5].

## Verkaufswert

| Fall | Wert | Kennzeichnung |
|---|---|---|
| Ramen Guy | 10 % der Gesamtkosten (`SellMultiplier = 0.1`) | [O/HIGH AE-S7] |
| Normale Kampf-Units | `SellMultiplier` nicht im Modul gesetzt; Standard UNKNOWN | [U/UNKNOWN] |
| Units aus dem Gacha verkaufen (Auto-Sell) | Rare 25, Epic 50, Legendary 100, Mythic 500, Exclusive 1000 Gold; Secret nicht verkaufbar | [O/HIGH AE-S9] |

## Kostenkurve der Upgrades

Erste Zeile jeder Unit = Platzieren (siehe [mechanics.md](mechanics.md)); danach Upgrade-Stufen. Alle Werte Yen [O/HIGH AE-S7], Summen [D/HIGH Addition].

| Beispiel | Rarity | Kosten je Eintrag | Summe | Max-Damage / SPA / Range |
|---|---|---|---|---|
| Kid Assassin (billig) | Rare | 250, 500, 725, 900, 1 000 | 3 375 | 59 / 2,3 / 12 |
| Little Carrot | Rare | 275, 475, 800, 1 050, 1 500 | 4 100 | 50 / 2,7 / 13 |
| Demon Cyborg | Epic | 325, 550, 775, 900, 1 200, 1 600 | 5 350 | 125 / 3,2 / 16 |
| Scissor (mittel) | Legendary | 600, 1 050, 1 250, 1 950, 2 500, 3 200 | 10 550 | 450 / 6,0 / 24 |
| Ice Queen | Legendary | 650, 900, 1 650, 1 900, 2 150, 2 850, 3 350 | 13 450 | 330 / 4,9 / 22 |
| Elf Mage (Mythic) | Mythic | 1 000, 1 550, 2 500, 3 250, 4 750, 5 825, 6 250 | 25 125 | 926 / 9,2 / 21 |
| Puppet (Mythic, Support-DPS) | Mythic | 1 150, 2 250, 2 750, 3 250, 3 750, 6 250, 9 750 | 29 150 | 2 358 / 6,3 / 24 |
| Elf Mage (Unleashed) (evolviert) | Mythic | 1 000, 1 550, 2 500, 3 250, 4 750, 5 850, 6 250, 7 500, 10 000 | 42 650 | 3 000 / 9,2 / 25 |
| Hollow (Blaze) (evolviert) | Mythic | 1 150, 2 250, 2 750, 3 500, 4 750, 5 250, 6 750, 8 500, 9 750, 10 500 | 55 150 | 1 388 / 7,3 / 28 |
| 8th Sword (Berserk) (Top) | Secret | 2 000, 2 750, 4 000, 5 750, 7 100, 8 550, 9 250, 9 900, 12 750, 14 250, 16 500 | 92 800 | 3 794 / 8,4 / 23 |

Kurven-Beobachtungen (Ableitung aus den Tabellen):

- **Summe bis Max je Rarity**: Rare 3 375-4 250, Epic 5 350-6 700, Legendary 9 800-14 250, Mythic 14 550-30 350 (nicht evolviert) und 26 550-57 150 (evolviert), Secret 62 050 (Basis) bis 92 800 (evolviert) [D/HIGH AE-S7].
- **Platzierkosten**: Rare 225-300, Epic 325-400, Legendary 600-800, Mythic 550-1 250, Secret 2 000 [D/HIGH AE-S7]. Faktor Secret zu Rare ca. 8x.
- **Stufenkosten wachsen annähernd linear bis leicht überproportional**: Kosten der letzten Stufe liegen beim 4- bis 8-fachen der ersten (Kid Assassin 1 000/250 = 4; Scissor 3 200/600 = 5,3; Elf Mage 6 250/1 000 = 6,25; 8th Sword 16 500/2 000 = 8,25) [D/HIGH]. Sprünge nach oben treten bei Attackenwechsel auf (Puppet 3 750 auf 6 250).
- **Damage-Wachstum**: Max-Damage zu Start-Damage etwa 3x bis 4x (Rare: Kid Assassin 15 auf 59 = 3,9x) bis 21x (Lady Giant (Envy) 154 auf 2 860 = 18,6x; Puppet (Telekinetic) 334 auf 5 093 = 15,2x) [D/HIGH AE-S7]. Der größte Sprung liegt an der Stufe, die die finale Attacke freischaltet.
- **Kosten pro Max-Damage-Punkt** (Kosten-Summe geteilt durch Damage/SPA-DPS-Näherung) ist für Rares am niedrigsten; Top-Units sind "teuer, aber pro Platz-Slot stärker", weil Platzierlimit knapp ist (Mythic oft 2-3) [R/LOW: DPS-Vergleich nicht gerechnet, nur Tendenz].

## Belohnungs-Ökonomie (Meta-Ebene, nicht im Match)

Siehe [meta.md](meta.md) und [enemies-waves.md](enemies-waves.md): Story-Act Normal 75 Gems/75 Gold, Erstclear 300/300; Hard 100/100 bzw. 400/400; Infinite 50 Gems/50 Gold je 5 Waves.
