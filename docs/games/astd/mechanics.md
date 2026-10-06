# ASTD: Mechaniken

Format: `Wert [Herkunft/Sicherheit Quelle]`. Quellen: [sources.md](sources.md). Zusammenhang: [economy.md](economy.md), [enemies-waves.md](enemies-waves.md).

## 1. Platzierung

| Aspekt | Regel | Tag |
|---|---|---|
| Platzierungstypen | Ground (Boden), Hill (Hügel/Hochpunkt), Hybrid (Boden und Hügel). Einige Units wechseln den Typ beim Upgrade, z. B. "Ground -> Hybrid" | O/HIGH ASTD-S25, ASTD-S23 |
| Raster | frei platzierbar ("almost all around the map"), kein festes Raster dokumentiert | O/MEDIUM ASTD-S25 |
| Ablauf PC | Unit anklicken, ziehen, klicken; alternativ Hotkeys 1 bis 6 | O/HIGH ASTD-S12 |
| Ablauf Mobile | tippen, Ort tippen, "Place" oder "Cancel" | O/HIGH ASTD-S12 |
| Loadout | 6 Slots, Slot 1 ist Leader | O/HIGH ASTD-S9, ASTD-S16 |
| Limit je Unit | normale Units: Wert UNKNOWN. Farm/Buff-Units teils auf 1 begrenzt: Jeff (CEO), Idol, Evil Shade (Final) | O/HIGH ASTD-S13, ASTD-S21, ASTD-S23 |
| Gesamtlimit | Infinite-Trivia: pro Spieler 24 Units (Quad), 32 (Trio), 44 (Duo), 88 (Solo). Bei 96 Solo-Plätzen nur Vermutung der Wiki-Autoren | O/LOW ASTD-S11 |
| Größe | große Units blockieren Platz, z. B. Jeff (CEO) "takes considerable amount of space" | O/MEDIUM ASTD-S13 |
| Verkauf | Truppen verkaufen für die Hälfte von Einsatzkosten plus Upgrades; manche Units unverkäuflich (Jeff, Idol, Evil Shade Final) | O/HIGH ASTD-S20, ASTD-S24, ASTD-S13, ASTD-S21, ASTD-S23 |
| Skip-Limit | In Infinite kein Auto-Skip ab Welle 60, wenn 60+ Gegner auf der Karte sind. Raids mit 3+ Pfaden erreichen laut Guide um Welle 8 ein "skip limit" (genaue Regel UNKNOWN) | O/MEDIUM ASTD-S11, ASTD-S9 |
| Auto-Battle | Tower Mode kostet 20 Gems je Spiel, platziert oft ineffizient | O/MEDIUM ASTD-S9 |

## 2. Targeting-Modi

| Punkt | Befund | Tag |
|---|---|---|
| Modi | Im Guide genannt: "First" und "Strongest/Last" (Beispiel: DPS auf "Strongest", damit alle Bosse getroffen werden). Vollständige Liste und genaue Regeln: UNKNOWN (kein Wiki-Eintrag, kein Datenmodul) | O/LOW ASTD-S9 |
| Manuelle Kontrolle | Units haben einen "Control"-Button; kontrollierte Units erhalten "essentially infinite range" und treffen per Klick. Controllable-Units greifen nicht allein an | O/MEDIUM ASTD-S6, ASTD-S21 |
| Angriffsform je Upgradestufe | Stat-Modul führt je Stufe eine Form: `Single`, `Cone`, `Circle`, `Full`. Beispiel Alien Boss: Cone, Cone, Cone, Full, Full, Circle, Circle, Cone | B/MEDIUM ASTD-S4 |
| Luftziele | nur Hill- und Hybrid-Units treffen Air; Ausnahme: Fall Of Man macht Air für Boden-Units zielbar | O/HIGH ASTD-S8 |
| Powerful | Powerful I braucht mindestens Upgrade 1, Powerful II mindestens Upgrade 2 zum Anvisieren; Ausnahme: Summons, Meta-Knight, Kura | O/HIGH ASTD-S25, ASTD-S8 |

## 3. Angriffszyklus, AoE, Treffer

| Punkt | Befund | Tag |
|---|---|---|
| Takt | Zeit pro Angriff (SPA, Sekunden) je Stufe; Beispiel 2 -> 1,6 bei Alien Soldier, 4 bis 10,2 bei Evil Shade (Final) | O/HIGH ASTD-S20, ASTD-S23 |
| Reichweite | Zahlen ohne einheitliche Einheit: 8 (2 Sterne), 52 bis 77 (Anti Hero), 70 bis 130 (7 Sterne). Skala der Welt: UNKNOWN | O/MEDIUM ASTD-S20, ASTD-S4, ASTD-S23 |
| AoE-Formen | Single, Cone, Circle, Full (volle Reichweite) | B/MEDIUM ASTD-S4, O/HIGH ASTD-S23 |
| Treffer-Bestimmung | Hitscan oder Projektil: UNKNOWN. Treffer gelten für alle Gegner in der Form | O/LOW ASTD-S23 |
| Hohe SPA ist üblich | Aktiv-Nuke-Units setzen auf Fähigkeiten mit Cooldown (z. B. 720 s bei Darkness Flame) | O/HIGH ASTD-S23 |
| Summons | beschworene Einheiten laufen die Strecke ab, ihr Gesamtschaden ist gleich ihren HP, danach verschwinden sie | O/HIGH ASTD-S6 |

## 4. Statuseffekte

Gesamtschaden eines DoT = Multiplikator x aktueller Schaden der Unit (Tick-Schaden ist Gesamt / Ticks). Einheits-Nachteil seit Update 48: Units mit nur **einer** Platzierung erzielen nur **25 %** des Statuseffekts [O/HIGH ASTD-S6, ASTD-S26].

| Effekt | Tick | Dauer | Gesamt x Schaden | Besonderheit | Tag |
|---|---|---|---|---|---|
| Bleed | 2 s | 8 s | 4 | stoppt Regeneration | O/HIGH ASTD-S26, ASTD-S8 |
| Rupture | 2 s | 24 s | 12 | | O/HIGH ASTD-S26 |
| Burn | 2 s | 12 s | 6 | | O/HIGH ASTD-S26 |
| Sunburn | 3 s | 21 s | 7 | zusätzlich 18 % Slow (zusammen mit Slow 68 %) | O/HIGH ASTD-S26 |
| Black Flame | 2 s | 40 s | 20 | zählt nicht als Burn, stapelt | O/HIGH ASTD-S26, ASTD-S6 |
| Blue Flame | 2 s | 10 s | 10 (2x je Tick) | | O/HIGH ASTD-S26 |
| Freeze-Burn | 1,33 s | 4 s | 3 | friert 3 s alle 7 s ein | O/HIGH ASTD-S26 |
| Poison | 3,5 s | 21 s | 6 | | O/HIGH ASTD-S26 |
| Judgement | 2 s | 20 s | 10 (10,8 mit Debuff) | Ziel erleidet +8 % von allem | O/HIGH ASTD-S26 |
| Stun | | 2 s | | Numb verlängert auf 7 s (3,5x) | O/HIGH ASTD-S26 |
| Freeze | | 3 s | | | O/HIGH ASTD-S26 |
| Slow | | permanent | -50 % Speed | | O/HIGH ASTD-S26 |
| Gale Slow | | 8 s | -30 % | Slow + Gale = -65 % bzw. laut Status-Seite -80 % (Widerspruch); nicht mit Sunburn | O/MEDIUM ASTD-S6, ASTD-S26 |
| Wax Slow | | 35 s | -85 % | nicht mit Slow/Gale/Sunburn; Dauer unabhängig von Spielgeschwindigkeit | O/HIGH ASTD-S6, ASTD-S26 |
| Timestop | | bis 10 s | Gegner steht | Ziel nach Timestop 10 s immun gegen erneuten Timestop; stapelt nicht mit Stun/Freeze | O/HIGH ASTD-S6, ASTD-S26 |
| Ultimate Timestop | | 30 bis 60 s | | globaler Cooldown 500 s | O/HIGH ASTD-S26 |
| Debuff | | 240 s | Ziel +15 % Schaden | | O/HIGH ASTD-S26 |
| Fear | | 16 s | +10 % Schaden | | O/HIGH ASTD-S26 |
| Purify | | 16 s | +12 % Schaden | | O/HIGH ASTD-S26 |
| Rewind | | einmalig je Gegner | Zurücksetzen auf Position vor Sekunden | wirkt nicht auf gefrorene/gestoppte/Wax-Gegner | O/HIGH ASTD-S26, ASTD-S6 |
| Replacement (Teleport) | | einmalig | Gegner zur letzten Kurve | Erasure: alle Gegner auf letzte 3 Kurven | O/HIGH ASTD-S26 |
| Stoke | | | Burn-Effekte x1,5 | | O/HIGH ASTD-S26 |
| Virus | | 30 s | Enchant-Vorteil 3x -> 3,75x | | O/HIGH ASTD-S26 |

Stacking: verschiedene DoTs stapeln; gleicher Effekt stapelt nicht, daher Units verteilen [O/HIGH ASTD-S6].

## 5. Schaden, Resistenzen, Crits

| Punkt | Befund | Tag |
|---|---|---|
| Enchant-Dreieck | Elemente Holy, Dark, Nature, Fire, Electric, Water. Effektiv 3x. Resistiert 0,25x laut Guide, "1/3" laut Status-Seite (Widerspruch). Neutral 1x | O/MEDIUM ASTD-S9, ASTD-S26 |
| Enchant-Tausch | Enchant Swap ändert das Gegner-Enchant; Rotation: effektiv 3x, neutral 2x, resistiert effektiv 2x | O/HIGH ASTD-S6 |
| Rüstung | Armored: Statuseffekte machen keinen Schaden; Steadfast: immun gegen Effekte, Slow, Verschiebung | O/HIGH ASTD-S8 |
| Elemental | nur Statuseffekte, Manual Abilities, Controllable, Summons und TypeBane (Piercing) schaden | O/HIGH ASTD-S8 |
| TypeBane | 2x Schaden gegen Gegner mit Titel | O/HIGH ASTD-S6 |
| Crit | meist x3 nach definierten Treffern (z. B. nach 2./3. Angriff) | O/HIGH ASTD-S6 |
| Kategorien | Infinite-Kategorie-Modus: 100 % Schaden für passende, 33 % für sonstige | O/HIGH ASTD-S11 |
| Raging | Units gewinnen Schaden je neuer Welle, bleibt nach Upgrade | O/HIGH ASTD-S6 |
| Boss | immun gegen Prozent-Schaden-Fähigkeiten | O/HIGH ASTD-S8 |
| Schadensformel gesamt | UNKNOWN (kein Wiki-Eintrag zur Berechnungsreihenfolge) | U/UNKNOWN |

## 6. Fähigkeiten und Buffs

| Fähigkeit | Regel | Tag |
|---|---|---|
| Manual Abilities | aktiv, per Klick; Auto-Aktivierung vorhanden; Cooldowns pro Unit | O/HIGH ASTD-S9, ASTD-S21 |
| Idol "Shine" | Schadensbuff für alle Units in Reichweite, **Cap 250 %**, Dauer 60 s, globaler Cooldown 60 s; nur ein Spieler gleichzeitig | O/HIGH ASTD-S21 |
| Idol "Your Star" | alle Gegner +15 % Schaden für 240 s, Cooldown 600 s | O/HIGH ASTD-S21 |
| Evil Shade "Darkness Flame" | 12,5 Mrd. Schaden auf alle Gegner, Cooldown 720 s | O/HIGH ASTD-S23 |
| Evil Shade "Dragon Absorption" | +7 500 000 Schaden dauerhaft; unendlicher globaler Cooldown mit zwei weiteren Units | O/HIGH ASTD-S23 |
| Killer S+ | 200 000 Cash je 400 s (Wunsch Geld) | O/MEDIUM ASTD-S9 |
| Leader-Buff | Slot-1-Unit gibt Kategorie-Units +10 bis +20 % Angriff; einige Leader auch Geldbonus 5 bis 20 % auf Ökonomie-Units | O/HIGH ASTD-S16 |
| Basis-Fähigkeiten | Base Protection, Heal (Base), Domain (kleine Schadensboni) | O/MEDIUM ASTD-S6 |
| Buff-Cap gesamt | nur Idol (250 %) belegt. Gesamtcap über alle Quellen: UNKNOWN | U/UNKNOWN |

## 7. Upgrade-Struktur

| Punkt | Befund | Tag |
|---|---|---|
| Stufen | 2 Upgrades (Alien Soldier, 2 Sterne) bis 8 (Evil Shade Final) bis 17 (Idol) bis 23 (Jeff, Octo) bis 24 (The Path Final) bis 26 (Demon of Emotion) | O/HIGH ASTD-S20, ASTD-S23, ASTD-S21, ASTD-S13 |
| Pfade | linear, nur eine Linie pro Unit; keine Verzweigung belegt | O/MEDIUM ASTD-S13, ASTD-S23 |
| Fähigkeiten pro Stufe | Neue Angriffsform oder Hybrid oder Manual Ability auf bestimmten Stufen (z. B. Upgrade 6 Hybrid, Upgrade 7 Dragon Absorption) | O/HIGH ASTD-S23 |
| Orb-Slots | je Slot ein Orb; Orbs verändern Anfangsschaden, Reichweite, Kosten | O/HIGH ASTD-S17 |
| Evolution | Units werden außerhalb des Matches durch Zweit-Units/Tokens zu höherer Stufe (siehe [meta.md](meta.md)) | O/HIGH ASTD-S23 |
