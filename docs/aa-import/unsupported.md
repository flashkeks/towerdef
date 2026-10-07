# Nicht (voll) modelliert: Lücken des Baukastens (Runde 8 / P1)

Alles hier ist **No-op oder Näherung, nichts blockiert**: die Unit lädt, wird platziert und greift an, nur die genannte Wirkung fehlt oder weicht ab. `unknownEffects(data)` (sim) findet unbekannte Effektnamen; für die 561 AA-Units meldet es heute **nichts** (alle 22 Effekte sind im Katalog).

## Effekte: Annahmen (die AA-Quelle kennt den Wert nicht)

| Effekt | Annahme (DESIGN) | AA-Quelle |
|---|---|---|
| Tick-Intervall der DoTs (Burn, Bleed, Poison, Wither) | 1 s je Tick, `economy.dot.intervalTicks` | `combat-system.md` § 7: UNKNOWN |
| Knockback | 2,5 Kacheln, 30 s Sperre, Boss halbe Strecke | Distanz UNKNOWN |
| Freeze / Timestop / Stun Dauer und Sperre | 2,5 / 2 / 2 s, Sperren 11 / 11 / 12 s | Dauer je Unit UNKNOWN, Sperre Quellenkonflikt 10-14 s |
| Unconscious | 0,5 s (Modulwert); das Wiki nennt 3-4 s | Quellenkonflikt |
| Confused | 5 s rückwärts, Sperre 10 s (geschätzt) | Sperre UNKNOWN |
| Hexed (20 %) und (25 %) | genau 20 % und 25 % Magic dauerhaft; das Effekt-Textfeld nennt für beide „30 %“ | Quellenkonflikt, der Schlüsselname wurde genommen |
| Cursed (30 %, 15 %) | 10 s Dauer (AA: „permanent bzw. temporär je Unit“) | Dauer UNKNOWN |
| Bleed Amplification | x5 für 6 s | Faktor 3-5, Dauer UNKNOWN |
| Wither als Effekt | Heilsperre 5 s | Dauer UNKNOWN |
| Motivate | nur der Schadens-Zweig (+15 %, 10 s); das Alternativ-Angebot „oder +10 % Reichweite“ ist über `rangePercent` im Katalog einstellbar, wird aber nicht je Angriff gewechselt | |
| Mind Control | wirkt auf Gegner im Treffer-Bereich des Angriffs (nicht „alle in Range“) | |
| Wild Card | Pool Burn (0,1 x 4), Slow, Bleed (0,083 x 3), Freeze, Knockback; gleiche Wahrscheinlichkeit | Auswahl UNKNOWN |
| Sunshine | linear über 15 beendete Waves (Schaden bis x2,25, Reichweite bis x1,67) | Kurve UNKNOWN |
| Diminishing / Sperren | eine Sperrgruppe aus Stun, Freeze, Timestop, Rückwärtslaufen (Quelle: „stacken nicht“); Slow und Knockback je eigene Sperre | |

## Nicht modelliert (No-op)

| Was | Wo in den AA-Daten | Folge |
|---|---|---|
| **Aktive Fähigkeiten** (Knopf, Cooldown) | `extra.active_attack`, `active_attack_stats` (z. B. `dazai:active`, `yamamoto:skeletons`, `star_platinum_ts`) | die Unit greift nur mit ihren normalen Angriffen an; der Fähigkeits-Angriff fehlt. Der alte `useAbility`-Befehl ist entfernt |
| **Beschwörungen mit eigenem Körper** | `kind: "summon"` (11 Einträge, `health`, `speed`) und Angriffe wie `attack_titan:spawn_titan`, `erwin:spawn_unit` | Summons werden nicht importiert/simuliert; spawnende Angriffe schaden als gewöhnliche Angriffe (oder gar nicht, wenn `damage` 0 ist) |
| **Fallen und Platzier-Obergrenzen eines Angriffs** | Stufen-Notiz „Cap of 7 traps“, `extra.max_path_units` | keine Fallen-Entität |
| **Einheiten-Schild** (`extra.shield`), Segen/Shiny (`blessing`), `upgrade_script`, `_EFFECT_SCRIPTS`, `base_evolve`, `note2` | `extra` | ignoriert |
| **Evolution, Traits, Limit Break, Potential, Curses, Relics** | `evolution`, `traits.json`, `items.json` | Meta-Schicht (P2), nicht Sim; die Sim kennt nur `UnitMod` (Level/Sterne/Trait-Schaden/Farm-Ertrag) |
| **Verstärkende Buffs** (Commander +25 % Physical, Griffin +100 %, Idol …) und Heiler | AA-Active-Abilities, nicht im Angriffs-Katalog | fehlen; nur **Motivate** ist als Angriffs-Effekt vorhanden |
| **Penetration** (senkt Resistenz) | keine AA-Daten | `pen` im Treffer ist 0 |
| **Gegner-Fähigkeiten, Boss-Angriffe, CC-Immunitäten der Gegner** (`enemies.json`) | P3 | Boss-Kits der Sim sind eigene Daten; AA-Boss-Angriffe kommen mit P3 vereinfacht |
| **Flying-Nullify, Armored (Full-AoE x0,5), Burst, Tank** als Gegner-Eigenschaften | `combat-system.md` § 10 | Armored/Shield/Regen/Fast gibt es als Modifier; `aoeTakenMult`, Burst, Tank-Reduktion fehlen (P3 kann sie als Gegner-Daten ergänzen, `weakBp`/`resist` sind da) |
| **Bilder, Animationen, Sounds** | `extra`-Assets | bewusst entfernt; Sprite-Fallback im Client |

## Bekannte Abweichungen im Kern

- Treffer eines Angriffs fallen **sofort** (kein zeitlicher Versatz zwischen den `hits`); dafür deterministisch und in einem Tick.
- `critChance` über 100 % („erneut critten“, U11) gibt es nicht; AA-Daten liegen bei <= 50 %.
- AoE-`full` trifft alles im Radius der Reichweite um die Unit, auch hinter ihr (AA: „alles in Range“).
- Ein Angriff ohne Katalog-Eintrag (`null`) greift als `single` an; fehlende `radius`/`angle`/`width` bekommen Standardwerte (8 Studs / 60 Grad / 4 Studs).
