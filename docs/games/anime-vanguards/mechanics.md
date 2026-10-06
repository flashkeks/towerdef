# Anime Vanguards - Mechaniken

Tags: `Wert [Herkunft/Sicherheit Quelle]`. Quellen siehe [sources.md](sources.md). Einheitenzahlen: [units.md](units.md), Gegner: [enemies-waves.md](enemies-waves.md), Geld: [economy.md](economy.md).

## 1. Platzierung

| Aspekt | Regel | Tag |
|---|---|---|
| Einheitentypen | `GRND` (212 von 224 Datensätzen), `Support` (9), `Farm` (2); kein Luft-/Hügel-Typ im Datenmodul | O/HIGH AV-S3 |
| Luft-/Hügel-Platzierung | UNKNOWN (kein Feld im Modul, keine Wiki-Aussage gefunden) | U/UNKNOWN |
| Raster vs. frei | UNKNOWN (Wiki spricht von "Placement" und "Range", nicht von Zellen) | U/UNKNOWN |
| Limit je Einheit | `place_limit` 1 bis 6. Rare 5-6, Legendary 4, Mythic/Exclusive meist 3 (Spanne 1-5), Secret meist 3 (Spanne 1-4) | O/HIGH AV-S3 |
| Limit gesamt | Team aus 6 Slots (Auto-Upgrade-Priorität 1-6, Modifier "Tyrant Arrives" nennt Slot 2-6). Globales Platzierungs-Maximum UNKNOWN | O/MEDIUM AV-S16, AV-S6 |
| Limit-Modifikatoren | Monarch-Trait: Limit 1. Modifier "No Trait No Problem": Limit x2, alle Traits entfernt. "Max Output" (Elemental Towers): Monarch ohne Limit, Platzier- und Upgradekosten x2 | O/HIGH AV-S7, AV-S6, AV-S18 |
| Platzierungskosten | `deployment_cost`: 300 (Rare) bis 10 000 (Ice Queen); Spanne siehe [units.md](units.md). Einige Story-/Event-Einheiten kosten 0 (z.B. Alien Soldier/Cadet/Elite, Boo-Varianten) | O/HIGH AV-S3 |
| Kosten-Reduktion | Kostenreduzierer-Einheiten (z.B. Lich King, Demon Hunter, Giant Queen); Chain-Passive von Demon Leader: -10 % Platzierkosten je verkettete Einheit (bis 10) | O/HIGH AV-S11, AV-S3 |
| Verkaufen | Verkauf möglich, Wert siehe [economy.md](economy.md); manche Einheiten sind unverkaufbar/geschützt (Pink Villain schützt vor Sell/Delete) | O/MEDIUM AV-S11 |

## 2. Targeting-Modi

| Aspekt | Wert | Tag |
|---|---|---|
| Wählbare Modi (First/Last/Strongest ...) | UNKNOWN. In Wiki-Seiten, Modul und FAQ nach drei Versuchen (Modul-Grep "target", Unit-Mechanics-Seite, Websuche) kein Modus-Katalog gefunden | U/UNKNOWN |
| Reichweite | Kreis um die Einheit (`range`, Einheit "Studs"), AoE-Form legt fest, was getroffen wird | O/MEDIUM AV-S11 |
| Reichweiten-Ausnahmen | "Range Bypasser" greifen außerhalb der Range an (z.B. Dot, Goblin Killer (Trapper), Trash Gamer (Twin Blades), Ackers (Levy)); "Teamwork" (Elemental Towers) erlaubt Angriff innerhalb der Range eines Verbündeten | O/HIGH AV-S11, AV-S18 |
| "Blending In" (Elemental Towers) | Einheiten greifen jeden Gegner in Range an | O/MEDIUM AV-S18 |

## 3. Angriffszyklus, AoE, Treffer

- Angriff = Schaden-Instanz alle `spa` Sekunden (Seconds Per Attack). Multi-Hit-Angriffe haben `hits` Treffer je Zyklus (1 bis 10 in den Daten). Statuseffekte werden bei **jedem** Treffer eines Multi-Hit-Angriffs angewendet und haben Cooldowns [O/HIGH AV-S11, AV-S3].
- Pro Upgradestufe wechselt oft der Angriff (`current_attack` 1-4, `move`-Name, anderer `aoe_type`/`aoe_size`), z.B. Demon Hybrid (Chainsaw): Voll-AoE (Stufe 0-3), Kreis AoE 10 (4-7), Kegel 90 Grad (8-11), Voll-AoE (12) [O/HIGH AV-S3].
- AoE-Formen laut Wiki [O/HIGH AV-S11]:

| Form | Regel | Häufigkeit in Upgrade-Zeilen (Modul) |
|---|---|---|
| Single Target | ein Gegner (nur wenige Einheiten, z.B. Noruto, Rukio laut Wiki) | im Modul nicht als `aoe_type` geführt |
| Circle | Kreis, `aoe_size` = Radius | 1228 |
| Cone | Kegel, `aoe_size` = Winkel in Grad (z.B. 90, 110, 180, 240) | 661 |
| Line | Linie, Breite = `aoe_size` | 552 |
| Full | alle Gegner in Range | 258 |
| Stadium | "Stadion"-Form, kann 2/3 über die Range hinausreichen | 13 |
| Splash | Kreis + Kegel, Kegelursprung in der Kreismitte, kann über die Range hinaus | 42 |

- Treffer-Bestimmung: Gegner-Ausweichen existiert über Modifier "Dodge" (+4 % Dodge-Chance je Karte) [O/HIGH AV-S6]; Einheiten mit Dodge-Bypass: Lich King, Armored Mage (Requip), Super Vogito, Cu Chulainn [O/HIGH AV-S11]. Das genaue Treffer-/Hitbox-Modell UNKNOWN.

## 4. Schaden, Resistenzen, Crits

| Aspekt | Regel | Tag |
|---|---|---|
| Schadensformel (Einheit) | Wiki-Rechner: `Schaden = Basis x Trait-Mult x Level-Mult(max) x [Godly-Stat 1.25 DMG] x [Buff 1.18]`; Level-Mult = `1.0235310218999 ^ Level` (+2.353 % je Level, kumulativ) | O/MEDIUM AV-S7 |
| DPS | `Schaden / SPA` (Wiki-Rechner `calcDps`) | O/HIGH AV-S7 |
| Schadensarten/Elemente | 11 Elemente in den Daten: Fire, Water, Nature, Spark, Curse, Holy, Unbound, Cosmic, Passion, Blast, Unknown. Element eines Gegners/Elemental Towers bestimmt Multiplikator (passend x3, nicht passend -80 %) | O/HIGH AV-S3, AV-S18 |
| Damage Reduction (Gegner) | Mutatoren Overshield, Resilient, Armored, Immunity, Sturdy, Ossified, Solidified; "Nullify" schaltet alle Schadensreduktion (Resilient, Overshield, Armored), Revitalize, Modifier und gegnerspezifische Mechaniken ab. Zahlenwert der Reduktion UNKNOWN | O/MEDIUM AV-S11, AV-S5 |
| Bypass | "Damage Reduction Bypass"-Einheiten (Lich King, Armored Mage Requip, Warlord, World Destroyer Old ... ); Blast-Element ignoriert Reduktion teilweise; Gilgamesh ignoriert 50 % | O/HIGH AV-S11 |
| Crit | Deadeye: 45 % Crit-Chance, +50 % Crit-Schaden. Alle DoT-Typen können crit-en. Brolzi Super (Wrathful): Crit-Rate über 100 % wird in Crit-Schaden umgewandelt, +5 % Crit-Rate je Wave (Cap 95 %) | O/HIGH AV-S8, AV-S11, AV-S3 |
| Boss-Schaden | Modifier Slayer I/II: +50 % / +75 % Schaden gegen Bosse | O/HIGH AV-S6 |
| Execute | Lich King, Gilgamesh (Enuma Elish: Nicht-Boss-Gegner unter 10 % HP sterben), Roku (Dark) | O/HIGH AV-S11, AV-S3 |

## 5. Statuseffekte

| Effekt | Stärke / Dauer | Stacking | Tag |
|---|---|---|---|
| Bleed (DoT) | Schaden = Anteil des Unit-Schadens, Dauer/Wert je Einheit; entfernt Regen/Revitalize-Heilung des Gegners solange aktiv | stackt unendlich | O/HIGH AV-S11 |
| Burn (DoT) | wie Bleed | stackt unendlich | O/HIGH AV-S11 |
| Intense Burn | wie Burn, aber nicht stapelbar; Choy Jong En verlängert und wiederholt Gesamtschaden pro Platzierung | nein | O/HIGH AV-S11 |
| Black Flame | DoT 80 % des Unit-Schadens | stackt | O/HIGH AV-S11 |
| Stun / Freeze | Gegner 2 s bewegungslos | Lockout "Hard CC 2" | O/HIGH AV-S11 |
| Petrified | 3 s | Hard CC 2 | O/HIGH AV-S11 |
| Time Stop / Confusion | Dauer je Einheit; Confusion = Gegner läuft mit Basis-Speed rückwärts | Hard CC 1 | O/HIGH AV-S11 |
| Repulse | Zurückstoßen; 3 Tiers Distanz (Basic/Strong/Elite); Bosse nur durch "Special Repulse" | zusätzlich 25 s eigener Lockout | O/HIGH AV-S11 |
| Slow | Tier 0: -50 %, Tier 1: -40 %, Tier 2: -30 %; Aura of Corruption/Tethered: -20 %; höchstes Tier gewinnt | nicht addierend | O/HIGH AV-S11 |
| Despair | +30 % Schaden erhalten, -30 % Speed | Unique Amplifier (nur einer gleichzeitig) | O/HIGH AV-S11 |
| Wounded | +20 % Schaden aus allen Quellen | Unique Amplifier | O/HIGH AV-S11 |
| Scorched | +20 % von Feuer-Einheiten | Unique Amplifier | O/HIGH AV-S11 |
| Bubbled | +30 % auf den nächsten Treffer eines Angriffs | Unique Amplifier | O/HIGH AV-S11 |
| Conduit | +30 % von Spark-Einheiten | Unique Amplifier | O/HIGH AV-S11 |
| Wanted | +30 % Yen beim Kill, +30 % Schaden von Pirates-Gruppe | Unique Amplifier | O/HIGH AV-S11 |
| Diseased | +50 % Schaden durch DoTs | Amplifier | O/HIGH AV-S11 |
| Cleave / Purgatory Flames | +20 % Bleed-Schaden / +25 % Burn-Schaden | Amplifier | O/HIGH AV-S11 |
| Rupture | entfernt Regen/Revitalize dauerhaft | - | O/HIGH AV-S11 |
| Nullify | s.o. | - | O/HIGH AV-S11 |

CC-Lockouts (Regel, wichtig für TD-Balancing): Hard CC 1 (Time Stop, Confusion) = 20 s Sperre; Hard CC 2 (Repulse, Stun, Freeze, Frostburn, Petrified) = 6 s Sperre; Repulse zusätzlich 25 s; Soft CC (sonstige) unabhängig [O/HIGH AV-S11]. Modifier "Immunity" macht Gegner CC-immun [O/HIGH AV-S6].

Gegner-Angriffe auf Einheiten: Bosse stunnen Einheiten (Stun 3-10 s, 1 bis 2 Ziele oder "In Range", Angriffsintervall 12-15 s), SPA-Debuff (+50 %), DMG-Debuff (-15 %), Löschen von Einheiten (Gilgamesh-Boss) [O/HIGH AV-S5, AV-S13]. Modifier "Quake": alle 10 s Stun auf Einheiten in Range für 5 s; "Exploding": Stun 1.8 s bei Gegnertod [O/HIGH AV-S6].

## 6. Fähigkeiten, Auren, Buffs

- **Aktive Fähigkeiten** (`active_ability`), oft an Upgradestufen gebunden (z.B. Astolfo: Stufe 3 Hippogriff, 6 Spellbook, 8 Spear). Cooldown-Zahlen UNKNOWN; Modifier "Press It" halbiert Cooldowns aktiver Fähigkeiten [O/HIGH AV-S4, AV-S6].
- **Passive Buffs** (Multiplikatoren auf Damage, Range, SPA, Crit Chance, Crit Damage, Elemente, Gruppen, Farm, Kosten): Kategorien und Buffer-Listen siehe Wiki. Beispiele mit Zahlen: Fire-Einheiten geben anderen Fire-Einheiten in Range +1 % Schaden je Platzierung; Leader of the Force (Ice Queen): je Verbündeten in Range -2 % SPA, +2 % Schaden (Cap 20 %); Tied by Desire (Demon Leader): +2 % je Chained-Angriff (Cap 50 %); Gilgamesh Myriad Treasures: +1 % Range/Schaden je Angriff (Cap 35 %) [O/HIGH AV-S11, AV-S3].
- **Caps:** Kein globaler Buff-Cap im Wiki gefunden. Haruka Rin: nach 6 Waves +10 % Range für Einheiten in Range; "Amplifier" (Elemental Towers) +30 % wirksame Buffs [O/MEDIUM AV-S3, AV-S18].
- **Unit-Gruppen:** ~20 Gruppen (Pirates, Giant, Demon Hunter, Dragon Sphere ...) für Gruppen-Buffs [O/HIGH AV-S11].
- **Cleanse/Protect:** Einheiten, die Statuseffekte/Debuffs auf Verbündete entfernen oder verhindern; Lich King immun gegen Statuseffekte [O/HIGH AV-S11].
- **Selbst-Opfer-/Verkaufsmechaniken:** manche Kits verkaufen oder löschen sich/Verbündete (Iscanur, Trash Gamer, Demon Leader) [O/HIGH AV-S11].

## 7. Upgrade-Struktur

| Aspekt | Wert | Tag |
|---|---|---|
| Stufen | `num_upgrade` 1 bis 16: unevolvte Mythic/Exclusive meist 3-12, Rare 5, Legendary 8, evolvte Secret bis 15 | O/HIGH AV-S3 |
| Pfade | Linear (ein Pfad), keine Verzweigung im Modul. Pro Stufe steigen Schaden/Range, sinkt SPA stufenweise | O/HIGH AV-S3 |
| Moves | Neue Angriffs-Layer an festen Stufen (Muster 0/4/8/12 oder 0/3/6/9) | O/HIGH AV-S3 |
| Passive Upgrades | `upgrade_required` pro Passive (z.B. Stufe 9) | O/HIGH AV-S3 |
| Evolution | Eigener Datensatz mit mehr Stufen, neuen Passives, +1 Stat-Rang, siehe [meta.md](meta.md) | O/HIGH AV-S15 |
| Kosten | siehe [economy.md](economy.md) | - |
| Auto-Upgrade | Unit-Manager: Priorität 1-6 pro Slot, upgradet automatisch bei genug Yen | O/HIGH AV-S16 |
