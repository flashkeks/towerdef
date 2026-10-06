# Mechanik

Viele Kernregeln stehen nicht im Wiki. Siehe [sources.md](sources.md).

## Platzierung
| Regel | Wert |
|---|---|
| Unit-Typen | Ground, Hill, Hybrid, Air. Regel: Fliegende Gegner nur von Air/Hybrid-Units angreifbar [O/HIGH ALS-S3] |
| Raster oder frei | UNKNOWN [U/UNKNOWN] |
| Max-Platzierung je Unit | Steht pro Unit-Seite: Ruru 3 (Extreme Boosted 1), Aura Farmer 1, Boku (TUI) 1 [O/HIGH ALS-S7, ALS-S8, ALS-S9] |
| Traits mit „ONE PLACEMENT" | Overlord, Avatar, Glitched [O/HIGH ALS-S4] |
| Gesamtlimit Units je Match | UNKNOWN [U/UNKNOWN] (Teamgröße ebenfalls UNKNOWN) |
| Leader-Slot | Godly-Units geben „Lead"-Buffs auf Teamebene [O/MEDIUM ALS-S18, ALS-S16] |

## Targeting
Targeting-Modi: UNKNOWN [U/UNKNOWN] (3 Suchen ohne Treffer). Beobachtet nur: Aura Farmer zielt auf „strongest unit in Range" (Fähigkeit), Boku auf „strongest enemy within range" [O/HIGH ALS-S8, ALS-S9].

## Angriff und Treffer
- Angriffsintervall wird als **SPA** (seconds per attack) angegeben, Bereich in den Beispielen 6 bis 19 Sekunden (SPA steigt bei manchen Units mit Upgrades, z. B. Ruru 6 auf 12, d. h. seltenere, härtere Schläge; Boku sinkt erst 12 auf 9, steigt dann auf 19) [O/HIGH ALS-S7, ALS-S8].
- AoE-Formen: Line, Cone, Circle, Full [O/HIGH ALS-S7, ALS-S9].
- Unit-Subtyp: Physical, Magical, Soul Damage [O/MEDIUM ALS-S18].
- Treffer-Bestimmung (Hitscan/Projektil): UNKNOWN [U/UNKNOWN].

## Elemente
Fire, Water, Nature, Light, Dark, Cosmic, Neutral, Perfect Seal [O/HIGH ALS-S18]. Beispielregel: Perfect-Seal-Boss, „alle Elemente 50 % weniger Schaden" [O/MEDIUM ALS-S16]; Boss Nature schwach gegen Fire, Boss Light schwach gegen Dark [O/MEDIUM ALS-S16]. Ein eigener Elemente-Seitentext existiert (Seite „Elements"), nicht abgerufen [U/UNKNOWN].

## Schaden, Resistenzen, Crits
| Regel | Wert |
|---|---|
| Schadensformel | Unit-Schaden x (1 + Buff-Summe) x Stack-Faktor; Crit-Schaden = Schaden x Crit-Multiplikator (Vorgabe 2) [O/LOW ALS-S25, Wiki-Formatierungsmodul, nicht gegen Spiel geprüft] |
| Burn-Beispiel | 1,5 x Endschaden [O/LOW ALS-S25] |
| Reinforced | -50 % von Full-AoE [O/HIGH ALS-S3] |
| Flawless | -50 % von Crits [O/HIGH ALS-S3] |
| Armored | nur Crits treffen, 2x Schaden [O/HIGH ALS-S3] |
| Resistant | -50 % DoT-Schaden [O/HIGH ALS-S3] |
| Avatar-Gegner | immun gegen DoT und Vulnerability [O/HIGH ALS-S3] |
| Cyclone | Hybrid -50 %, Hill +25 % [O/HIGH ALS-S3] |
| Earthbound | Hill -50 %, Ground +25 % [O/HIGH ALS-S3] |
| Boss-Nuke-Resistenz | 95 % bis 97,5 % bei Boss-Rush-Bossen [O/MEDIUM ALS-S16] |
| Crit-Basis | UNKNOWN [U/UNKNOWN] |

## Statuseffekte
Stun, Cripple, Slow, Freeze, Bleed, Hemorrhage, Mutilate, Dismantle, Rupture, Plasma, Blaze, Exposed (+50 % Schaden aller Quellen) u. a. [O/MEDIUM ALS-S7, ALS-S9, ALS-S18]. Stärke/Dauer/Stacking je Effekt: UNKNOWN [U/UNKNOWN] (Passive-Seiten nicht abgerufen). Beispiel: Boku immun gegen Debuffs; Stunversuche stunnen den Gegner 10 s [O/HIGH ALS-S8].

## Fähigkeiten
- Aktiv mit Cooldown, Beispiele: Boku „Brutal Beatdown" 250 s, „Supreme Kamehameha" 750 s; Aura Farmer „Psybeam Laser" 250 s, „Giant Pillar Smash" 1500 s global [O/HIGH ALS-S8, ALS-S9].
- Extrem lange Cooldowns (Hunderte Sekunden) sind der Normalfall in späten Units [O/HIGH ALS-S8].
- Passive Buffs mit **Caps** in Billionen (z. B. Siphon max 1T, Schadenstick-Cap 150B) [O/HIGH ALS-S7, ALS-S9].

## Upgrade-Struktur
- Unit-Stufen 0 bis 9 (Boku, Aura Farmer) oder 0 bis 11 (Ruru) [O/HIGH ALS-S7].
- Fähigkeiten und AoE-Form schalten bei festen Stufen frei (Beispiel Ruru: Upg 5 Cone, Upg 9 Mutilate) [O/HIGH ALS-S7].
- **Evolution** ersetzt die Unit durch neue Form mit eigener Statistik (Rare/Epic/Legendary/Mythic → Celestial → Ultimate → Godly → Last Standian) [O/HIGH ALS-S8, ALS-S17].
- **Extreme Boost** erhöht Statistiken weiter, Stat-Grade +1 [O/HIGH ALS-S19].
- Tower Stats (Grades) und Traits wirken zusätzlich, siehe [meta.md](meta.md).
