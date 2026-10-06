# UTDZ - Mechaniken

Format: `Wert [Herkunft/Sicherheit Quelle]`. Siehe [sources.md](sources.md). Stand der Wiki-Daten: überwiegend Update 2.x-3.x; für 4.x nicht geprüft.

## Platzierung

| Aspekt | Wert |
|---|---|
| Untergrundtypen | Unit-Feld `type`: Ground, Hybrid (z. B. Zorus, Underworld God Primordial); "Ground to Hybrid (U4)" bei Greybeard = Typwechsel durch Upgrade [O/MEDIUM UTDZ-S6, UTDZ-S14]. Bedeutung von "Hybrid" (Boden und Luft?) `UNKNOWN` |
| Raster oder frei | `UNKNOWN` (nicht in Wiki-Daten) |
| Limit je Unit ("placements") | Roku 5, Greybeard 3, Gen 4, Shakumira 4, Ruka 3, Pebble 4, Zorus 2, Admiral 3, Sasku 2, Bulmo 1 [O/HIGH UTDZ-S5, UTDZ-S14, UTDZ-S4, UTDZ-S7] |
| Limit-Modifikatoren | Etherealize E6 von Roku: +1 Placement [O/HIGH UTDZ-S5]; Trait Ruler: Limit auf 1 Placement [O/HIGH UTDZ-S13] |
| Gesamtlimit aller Units | `UNKNOWN` |
| Teamgröße | 6 Slots laut Team-Builder einer Drittseite [O/LOW UTDZ-S20] |
| Spieler pro Match | bis 12 (World Raid explizit "up to 12") [V/CONFIRMED UTDZ-S1, O/HIGH UTDZ-S16] |

## Targeting-Modi

`UNKNOWN`. In keiner der abgerufenen Wiki-Seiten und Module sind Targeting-Modi (First/Last/Strongest o. ä.) beschrieben (drei gezielte Versuche: Mechanics-Modul, Unit-Seiten, Beginners Guide). Hinweise nur indirekt: Fähigkeiten wie "Lethal" gelten gegen Gegner unter 50 % HP [O/HIGH UTDZ-S13].

## Angriffszyklus, AoE, Treffer

- Angriffsintervall: Feld `SPA` (Seconds Per Attack) bzw. "Cooldown"; Beispiele 3,5 bis 10 s auf Legendary-Units, 5 s bei Roku, 6 bis 9 s bei Sasku [O/HIGH UTDZ-S14, UTDZ-S5, UTDZ-S4].
- Reichweite: Zahl (vermutlich Studs): Rare 15-17, Legendary 12-35, Farm Bulmo 20-25 (31-39 im anderen Wiki), Synchro Underworld God 40 [O/MEDIUM UTDZ-S5, UTDZ-S14, UTDZ-S7, UTDZ-S8].
- AoE-Formen: Circle, Line, Full (Range-weit), je Upgrade wechselbar (Roku Circle -> Line AoE ab Upgrade 4; Greybeard Full -> Line -> Circle; Admiral Line -> Circle ab U3) [O/MEDIUM UTDZ-S5, UTDZ-S14].
- Treffer-Bestimmung (Hitscan/Projektil/Ausweichen): `UNKNOWN`. Sasku besitzt 50 % Ausweichchance gegen Gegnerangriffe, d. h. Gegner können Units angreifen [O/HIGH UTDZ-S4].
- Zorus legt Fallen (max. 3) mit Stun, Radiation oder Confusion [O/HIGH UTDZ-S6].

## Statuseffekte

Aus Mechanik-Modul [O/HIGH UTDZ-S11] (Werte "x" sind unitabhängig, keine Standardzahlen):

| Effekt | Wirkung |
|---|---|
| Bleed | x % Angriff über x s, stoppt Regeneration des Gegners |
| Burn | x % Angriff über x s |
| Radiation | DoT; Gegner erleidet 20 % mehr Schaden (Fission-Trait: 20 % Schaden über 10 s) |
| Slow | -x % Bewegungsgeschwindigkeit |
| Stun | x s Betäubung |
| Timestop | Stun x s; Schaden währenddessen x1,2 |
| Frozen | Stun x s, danach Slow x % für x s |
| Confused | Gegner läuft x s rückwärts |
| Wind Shear | DoT |
| Time Snail | Statusdauer +x %, Gegner langsamer (nicht stapelbar mit Slow) |
| Time Acceleration | 8 s: DoT-Zeit und Statusdauer halbiert, Gegner 2x schneller, Gegner nehmen 2x Schaden |

Stacking: "Astral" macht DoTs stapelbar (sonst nicht) [O/HIGH UTDZ-S13]. Beispiele konkreter Werte: Sasku 50 % Stun-Chance für 3 s [O/HIGH UTDZ-S4]; Underworld God Primordial Slow -30 % und Time Snail 3 s [O/HIGH UTDZ-S8]. Boss-Immunitäten: `UNKNOWN`.

## Schaden, Resistenzen, Crits

- Elemente (7): Ice, Water, Fire, Rose, Wind (zyklisch) sowie Light und Dark (neutral). Effektiv = 1,5x Schaden, ineffektiv = 0,5x [O/HIGH UTDZ-S11].

| Element | stark gegen (1,5x) | schwach gegen (0,5x) |
|---|---|---|
| Ice | Water, Rose | Wind, Fire |
| Water | Fire, Wind | Ice, Rose |
| Fire | Rose, Ice | Water, Wind |
| Rose | Wind, Water | Fire, Ice |
| Wind | Ice, Fire | Rose, Water |
| Light / Dark | neutral | neutral |

- Schadensformel: Traits addieren sich als additiver Bonus auf Basisschaden ("Traits add onto the unit's base damage as an additive buff") [O/HIGH UTDZ-S11]. Vollständige Formel (Relics, Crit, Elemente multiplikativ?) `UNKNOWN`.
- Stat-Punkte: Faktor `1,0045 ^ investierte Punkte` je Stat (Attack, Cooldown, Range) [O/HIGH UTDZ-S11]. Stat-Rang-Spannen: Attack -1 % bis +20 %, Cooldown +1 % bis -10 %, Range -1 % bis +20 % (F bis SSS) [O/HIGH UTDZ-S11].
- Rüstung: Gegner können "Armored" sein; Greybeard +65 % Schaden gegen Armored, Underworld God Primordial trifft Armored beim ersten Treffer mit 75 % [O/MEDIUM UTDZ-S14, UTDZ-S8].
- Schild-Gegner: jede Schadensinstanz entfernt einen Schild-Stack, danach erst HP-Schaden (seit 2.0) [O/HIGH UTDZ-S9].
- Crits: Crit Rate und Crit Damage existieren als Relic-Substats und Trait-Boni (Lethal +15 % Crit Chance, Duelist +25 % Crit Rate) [O/HIGH UTDZ-S13, UTDZ-S14]; Basis-Crit-Chance und -Multiplikator `UNKNOWN`.
- Boss: Duelist +35 % Boss-Schaden [O/HIGH UTDZ-S13].

## Fähigkeiten (aktiv/passiv, Cooldowns, Buffs)

- Passive und aktive Fähigkeiten je Unit; aktive mit Cooldown, z. B. Sasku "Kirin" +250 % Schaden für einen Angriff, 60 s Cooldown; Bulmo "Emergency Capsule" 60 s [O/HIGH UTDZ-S4, UTDZ-S7].
- Once-per-Match: Bulmos "Come Forth, Shenlong!" nach 7 Wish Balls: +30.000 Yen oder +15 % Schaden aller Units oder +15 % Crit Chance [O/HIGH UTDZ-S7; Wirkung gilt nur für aktuell platzierte Units, S14].
- Wachsende Buffs mit Caps: Eternal +5 % Schaden und +2,5 % Range pro Wave bis +60 % bzw. +30 % [O/HIGH UTDZ-S13]; Shakumira +0,10 % Range pro verlangsamtem Gegner bis +20 % (E-Stufen: 25 %, 0,15 %) [O/MEDIUM UTDZ-S14]; Pebble +0,5 % Angriff pro Knockback bis 40 % [O/MEDIUM UTDZ-S14].
- Leader-/Element-/Tag-Buffs bei Unrivaled-Mark: pro Kategorie wird nur der höchste Buff gewertet [O/MEDIUM UTDZ-S9].
- Raid-Tag-Bonus: +30 % Schaden für Units mit Raid-Tag (Peroxide, Ninjaverse, Leveling) [O/HIGH UTDZ-S15].
- Virtual-Realm-Tarot-Buffs: siehe [meta.md](meta.md).

## Upgrade-Struktur

- Pro Unit lineare Upgrade-Stufen: Rare 5, Legendary 5 bis 7, Mythic 7, Farm Bulmo 7, Synchro keine (Platzierung = Endzustand) [O/HIGH UTDZ-S5, UTDZ-S14, UTDZ-S4, UTDZ-S8]. Keine Pfade/Verzweigungen belegt.
- Upgrade ändert Schaden, Cooldown, Range und teils AoE-Form oder Typ (siehe oben).
- Zusätzlich 6 Etherealize-Stufen (E1/E3/E5: +10 Stat-Punkte; E2/E4/E6: Passiv-Verbesserungen) [O/HIGH UTDZ-S11].
- Evolution (Basis -> Evolution mit Item-Rezept), Unrivaled-Mark (4 Fragmente, Max-Level 100), Boundless, Synchro: siehe [meta.md](meta.md).
- Level-Cap Units: 70 (Basis) [O/HIGH UTDZ-S11]; 100 mit Unrivaled-Mark [O/MEDIUM UTDZ-S9].
