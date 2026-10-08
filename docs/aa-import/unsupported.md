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
| **Fallen und Platzier-Obergrenzen eines Angriffs** (Usopp, 2 Units) | Stufen-Notiz „Cap of 7 traps“, `extra.max_path_units` | keine Fallen-Entität |
| **Einheiten-Schild** (`extra.shield`), Segen/Shiny (`blessing`), `upgrade_script`, `_EFFECT_SCRIPTS`, `base_evolve`, `note2` | `extra` | ignoriert |
| **Evolution, Traits, Limit Break, Potential, Curses, Relics** | `evolution`, `traits.json`, `items.json` | Meta-Schicht (P2), nicht Sim; die Sim kennt nur `UnitMod` (Level/Sterne/Trait-Schaden/Farm-Ertrag) |
| **Heilung und Kosten-Rabatt-Auren** (Sakura heilt, Idol senkt Kosten) | `base_heal_amount`, Aura-Notizen | fehlen (Einheiten haben keine HP, Platzierkosten kennen keine Auren); der Schadens-Anteil der Aura wirkt |
| **Kill-Bonus** (`on_kill`, Eto One-Eye) | `extra.on_kill` | fehlt |
| **Penetration** (senkt Resistenz) | keine AA-Daten | `pen` im Treffer ist 0 |
| **Gegner-Fähigkeiten, Boss-Angriffe, CC-Immunitäten der Gegner** (`enemies.json`) | P3 | Boss-Kits der Sim sind eigene Daten; AA-Boss-Angriffe kommen mit P3 vereinfacht |
| **Flying-Nullify, Armored (Full-AoE x0,5), Burst, Tank** als Gegner-Eigenschaften | `combat-system.md` § 10 | Armored/Shield/Regen/Fast gibt es als Modifier; `aoeTakenMult`, Burst, Tank-Reduktion fehlen (P3 kann sie als Gegner-Daten ergänzen, `weakBp`/`resist` sind da) |
| **Bilder, Animationen, Sounds** | `extra`-Assets | bewusst entfernt; Sprite-Fallback im Client |

## Fähigkeiten, Auren, Beschwörungen, Zweitangriffe (Runde 9 / P1): Annahmen

Seit Runde 9 im Baukasten (`format.md`, `sim/README.md`). AA liefert nur Marken, Namen und Abklingzeiten; **alle Wirkungen sind DESIGN** (Tabelle `tools/aa-import/kits.ts`, Bericht `report.md` nennt je Unit, wie sie modelliert ist):

| Annahme | Wert |
|---|---|
| Fähigkeit startet bereit | ja (nach dem Platzieren sofort nutzbar) |
| Auto-Schalter | löst Knopf-Fähigkeiten bei Bereitschaft aus, braucht einen lebenden Gegner (kein Verschwenden zwischen den Wellen) |
| Fähigkeits-Schaden | Vielfaches des Stufen-Schadens (Armin 0,5 x sechs Schläge, Femto-Ei 4 x, Dio Heaven 2 x ...); Units ohne eigenen Schaden (Eren Founder, Erwin) absolut |
| Zeitstopp, Domain, Illusion | als `Timestop` / `Stun` / `Confused` des Effekt-Katalogs, Dauer wie in `kits.ts`; Bosse halbe Dauer, Sperren des Katalogs gelten |
| Buff-Fähigkeiten (Wendy, Leafa, Erwin) | Schaden/Tempo für alle Verbündeten, 15-20 s; Cap `economy.buffCaps` |
| Auren | Radius 30 Studs (Hoshino), 20-32 Studs (Sakura, wächst mit der Stufe), Griffin Reincarnation global (+100 %, AA: `_global`); stärkster Buff gewinnt, kein Stapeln |
| Beschwörungen | Lebensdauer 25-60 s, Haltbarkeit 3-80 s gegen einen Standard-Gegner (Elite zehrt x3, Flieger und Bosse lassen sich nicht aufhalten), Schaden 0,8-3 x Stufen-Schaden des Beschwörers (Absolutwerte bei Eren und Erwin); die AA-Werte `health`/`speed` der 11 Wesen werden nicht 1:1 genutzt (AA-HP kennt kein Gegenstück: Gegner greifen nicht an) |
| Lucy (Tore), Lelouch (Armee), Eren (Attack Titan), Starrk (Wölfe), Erwin (Soldaten) | periodische Beschwörer mit `trigger: auto` (Abklingzeit 8-30 s, Grenze `maxAlive`) |
| Yuta ruft Rika | Annahme: AA nennt nur den Spawn-Angriff `yuta:summon`, das Wesen `rika` ist erfunden |
| Kento "Overtime" | Annahme: Sunshine-Art, +50 % Schaden über 10 beendete Waves (AA: `end_of_wave: custom`) |
| Zweitangriffe (`also`) | die bisher freigeschalteten Angriffe laufen mit dem der Stufe im Wechsel (nur Units mit `_attacks`/`secondary_attacks` und Rokuhira); ob AA rotiert, nennen die Daten nicht |
| Reine Animations-Spawner | `spawn_attack`/`delayed_spawn`/`spawn_script` bei Femto, All Might, Sanji, Denji, Metal Knight, Zeke, Kite (6), Eto: nur Verwandlungs-/Lande-Animation ohne Zahlen, diese Units zählen als voll |
| Ohne Daten bleiben ausgeblendet | Elyssia (2), Mahoraga: weder Angriff noch `extra` noch Werte in der Quelle |

## Bekannte Abweichungen im Kern

- Treffer eines Angriffs fallen **sofort** (kein zeitlicher Versatz zwischen den `hits`); dafür deterministisch und in einem Tick.
- `critChance` über 100 % („erneut critten“, U11) gibt es nicht; AA-Daten liegen bei <= 50 %.
- AoE-`full` trifft alles im Radius der Reichweite um die Unit, auch hinter ihr (AA: „alles in Range“).
- Ein Angriff ohne Katalog-Eintrag (`null`) greift als `single` an; fehlende `radius`/`angle`/`width` bekommen Standardwerte (8 Studs / 60 Grad / 4 Studs).

## Traits (Runde 8 / P2)

Wirkung im Match ueber `UnitMod` (`traitBp` Schaden additiv, `rangeBp`, `spaBp`, `yieldBp`); Daten `meta/data/aa/traits.json`. **No-op** (Daten bleiben):
Zusatzschaden gegen Bosse (Reaper) und gegen Gegner mit wenig HP (Culling), True-Damage-Anteil (Celestial), Unit-XP (Adept), Platzierlimit 1 (Unique; x4 Schaden gilt ohne Limit), Doppel-Trait. Golden-Ertrag wirkt nur bei `speedwagon` und `bulma`.
Neue Units haben keinen Trait (AA: 1 % beim Ziehen); er entsteht nur durch Reroll. Die Verteilung der Stufen 1-3 (70/25/5 %) ist DESIGN, AA nennt sie nicht.

## Import-Einstufung (Runde 8 / P2)

`support: "hidden"` (10 Units) und `limited` (61) stehen mit Gruenden in `report.md`. Ausgeblendete sind nicht ziehbar. Evolutionen ohne spielbares Ziel sind `blocked` (3 Rezepte).
