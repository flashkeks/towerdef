# AA-Import: Bericht (Runde 8 / P2, Runde 9 / P1)

Erzeugt von `tools/aa-import` (`npm run aa-import`), nicht von Hand pflegen: der Lauf schreibt diese Datei neu. Quelle: `docs/anime-adventures/data/*.json`.

## Ergebnis

**550 Units importiert** nach `sim/data/units/aa.json`, **547 spielbar (99,5 %)**, 3 ausgeblendet (0,5 %). Ziel war >= 95 %.

| Stufe | Units | Bedeutung |
|---|---:|---|
| voll unterstuetzt (`full`) | 542 | alles, was die Daten sagen, wird gerechnet |
| mit Einschraenkungen (`limited`) | 5 | spielbar, ein Teil des Kits fehlt (Gruende unten) |
| ausgeblendet (`hidden`) | 3 | kein Angriff und kein Einkommen: nicht ziehbar, nicht in der Sammlung. Datensatz bleibt, Flag `support: "hidden"` |
| als Beschwoerung | 11 | AA `kind: "summon"`: Wesen mit eigenem Koerper, keine Units; stehen im Katalog `summons` von `aa.json` (`format.md`) |

Das sind 561 Eintraege in `units.json` (561): 550 Units plus 11 Beschwoerungen. Angriffe: 1023 im Katalog der Datei, davon 0 ohne Details in AA (`null`, greifen als `single` an). Katalog `summons`: 12 Wesen (taurus, leo, aquarius, dark_young, starrk_wolf_unit, aot_generic, eren_founding_titan, attack_titan, britannia_soldier, shinkiro, wall_titan_founding, rika).

## Nach Seltenheit

| Seltenheit | importiert | voll | eingeschraenkt | ausgeblendet |
|---|---:|---:|---:|---:|
| Rare | 20 | 19 | 1 | 0 |
| Epic | 19 | 19 | 0 | 0 |
| Legendary | 35 | 35 | 0 | 0 |
| Mythic | 381 | 374 | 4 | 3 |
| Secret | 73 | 73 | 0 | 0 |
| Exclusive | 22 | 22 | 0 | 0 |

## Einschraenkungen (spielbar, aber mit Luecke)

| Grund | Units | Was fehlt |
|---|---:|---|
| `trap-cap` | 2 | Fallen-/Pfad-Obergrenze nicht modelliert |
| `cost-aura` | 1 | Kosten-Rabatt der Aura fehlt (der Schadens-Anteil wirkt) |
| `heal` | 1 | Heilung fehlt (der Aura-Anteil wirkt) |
| `on-kill` | 1 | Kill-Effekt fehlt |

Eine Unit kann mehrere Gruende haben. Die Luecken stehen je Unit als `supportNotes` im Datensatz; die Erklaerung der Sim-Seite in `unsupported.md`.

## Ausgeblendet

| ID | Name | Seltenheit | Grund |
|---|---|---|---|
| `isharmla_evo` | Elyssia (Abyssal) | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |
| `mahoraga` | Divine General | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |
| `isharmla` | Elyssia | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |

## Kits: Faehigkeiten, Auren, Beschwoerungen, Zweitangriffe (Runde 9 / P1)

53 Units tragen ein Kit aus `tools/aa-import/kits.ts` (Namen und Abklingzeiten AA, Wirkung und Staerke DESIGN, siehe `unsupported.md`). Zweitangriffe (`also`) bekommen ausserdem alle Units, deren AA-Daten mehrere Angriffe fuehren.

| Unit | Stufe | Art | Modelliert als |
|---|---|---|---|
| `rokuhira` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `dazai_evolved` | full | Knopf | Nullification (ab Stufe 6): Schilde weg und Slow auf alle Gegner |
| `griffith_reincarnation` | full | Aura | Aura: +100 % Schaden für alle Verbündeten auf der Karte (AA: global) |
| `usopp_ts` | limited |  | Fallen als sofortige Flächentreffer (Obergrenze und 5-s-Lebensdauer der Fallen fehlen) |
| `stain` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `asuna_evolved` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `kento_evolved` | full |  | Overtime: +50 % Schaden über 10 beendete Waves (Annahme, AA nennt nur `end_of_wave: custom`) |
| `hoshino` | full | Aura | Aura: +5 / 7 / 10 % Schaden in 30 Studs |
| `heathcliff` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `speedwagon` | full |  | Farm je Wave (`end_of_wave: farm`) ist das normale Einkommen der Stufen |
| `heathcliff_evolved` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `escanor_evolved` | full |  | Sunshine wächst je Wave (bereits Effekt des Angriffs); `end_of_wave: custom` ist genau das |
| `eren` | full | Beschwoerung | ruft alle 20 s einen Attack Titan (bis 3, laufen den Gegnern entgegen, halten sie auf) |
| `yuta_evolved` | full | Beschwoerung | ruft Rika (Annahme: AA nennt nur den Spawn-Angriff `yuta:summon`) |
| `klein_evolved` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `femto_egg` | full | Knopf | Sacrifice: Flächenschlag auf die ganze Karte |
| `armin` | full | Knopf | Titan Shift: sechs Flächenschläge in 10 s (die einzige Wirkung der Unit) |
| `aizen_chrys` | full | Knopf | Illusion: alle Gegner laufen 10 s zurück (Confused) |
| `leafa_evolved` | full | Knopf, Zweitangriff | Wind Blessing: Schaden und Tempo für alle Verbündeten |
| `eren_final` | full | Knopf, Beschwoerung | The Rumbling: acht Schläge auf die ganze Karte in 28 s, ruft den Gründer-Titan und zehn Wall Titans |
| `leafa` | full | Knopf, Zweitangriff | Wind Blessing: Schaden und Tempo für alle Verbündeten |
| `law_2_evolved` | full | Knopf | Shambles: Rückstoß und Betäubung im Umkreis, doppelter Schaden |
| `sakura` | limited | Aura | Aura: +10 % Schaden, Radius wächst mit der Stufe |
| `gojo_evolved` | full | Knopf | Domain Expansion: alle Gegner in Reichweite 8 s betäubt |
| `kirito_evolved` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `lelouch` | full | Beschwoerung | ruft Britannia-Soldaten (bis 3) und ab Stufe 5 Shinjira |
| `hakari_evo` | full | Knopf, Aura | Aura: +25 % Crit-Chance für Verbündete in 25 Studs; Jackpot: Schaden und Tempo für 10 s |
| `stain_evolved` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `erwin` | full | Knopf, Beschwoerung | Dedicate your hearts!: +25 % Schaden für alle Verbündeten; ruft automatisch Survey-Corps-Soldaten |
| `lucy` | full | Beschwoerung | öffnet automatisch die Tore: Taurus (blockt), ab Stufe 3 Leo, ab Stufe 6 Aquarius |
| `aizen_hog` | full | Knopf | Illusion: alle Gegner laufen 10 s zurück (Confused) |
| `bulma` | full |  | Farm je Wave (`end_of_wave: farm`) ist das normale Einkommen der Stufen |
| `buggy` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `homura_evolved` | full | Knopf | Time Stop: alle Gegner 4 s eingefroren |
| `asuna` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `aizen_transcended` | full | Knopf | Beyond the Heavens (ab Stufe 5): Dreifacher Schlag auf alle, Gegner nehmen +30 % Magie |
| `usopp_ts_evolved` | limited |  | Fallen als sofortige Flächentreffer (Obergrenze und 5-s-Lebensdauer der Fallen fehlen) |
| `giselle_evo` | full |  | Angriff `giselle:three` ohne Details in AA: Annahme Kreis 10 Studs, 3 Treffer |
| `rokuhira_evo` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `wendy` | full | Knopf | Troia: Schaden und Tempo für alle Verbündeten |
| `klein` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `lelouch_evolved` | full | Beschwoerung | ruft Britannia-Soldaten (bis 3) und ab Stufe 5 Shinjira |
| `dio_heaven` | full | Knopf | The Universe over Heaven: alle Gegner 6 s Timestop, Schlag x2, Selbst-Buff +100 % Schaden |
| `lucy_evolved` | full | Knopf, Beschwoerung | wie Lucy, dazu ab Stufe 8 Multi Summon (alle drei Geister auf Knopfdruck) |
| `starrk_evolved` | full | Beschwoerung | Los Lobos (ab Stufe 8): drei Spirit Wolves rennen los und explodieren |
| `kirito` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `akaza_unit_evolved` | full | Zweitangriff | Zweitangriff `akaza_unit:compass` (AA `secondary_attacks`) dauerhaft im Wechsel, dazu die Stufen-Angriffe |
| `julius_evolved` | full | Knopf | Final Clock: alle Gegner 5 s stark verlangsamt, Schlag x2 |
| `aizen_hog_evolved` | full | Knopf | Illusion: alle Gegner laufen 10 s zurück (Confused) |
| `carrot` | full |  | Angriff `carrot:two` ohne Details in AA: Annahme Kreis 6 Studs |
| `hoshino_evolved` | limited | Aura | Aura: +5 / 7 / 10 / 15 % Schaden in 30 Studs |
| `roshi` | full | Zweitangriff | Angriffe der freigeschalteten Stufen laufen im Wechsel (Zweitangriffe) |
| `eto_evolved` | limited |  | wie Eto; der Kill-Bonus (`on_kill`) fehlt |

## Felder und Effekte

- **Uebernommen** je Unit: `id name rarity placement damageType elements critChance critDamage spawnCap spawnCapGlobal unsellable limited hideFromBanner rateupBannerOnly shinyVariant evolvedFrom`, je Stufe `level cost damage spa range attack farm note`, Angriffe 1:1 (`aoe radius angle width hits dot special`).
- **Entfallen** (Sim kennt sie nicht): `dps dpsWithDot cumulativeCost maxDps totalCost extra meta nameModule nameLegacy inLegacy cooldownField knockbackPoints health speed legacyLevels`. `evolution` wandert in `meta/data/aa/evolutions.json`. `extra` ist der Grund fuer fast alle Einschraenkungen (Aktiv-Faehigkeiten, Beschwoerer, Auren).
- **Effekte:** alle 22 Effekte der Quelle stehen im Katalog `sim/data/effects.json`; `unknownEffects` meldet nichts (Test `aa-import.test.ts`). Parameter-Annahmen: `unsupported.md`.
- **Nicht modelliert** (No-op): Heilung, Kosten-Rabatt-Auren, Kill-Boni, Fallen-Obergrenzen, Einheiten-Schild, Segen/Shiny, `spawnCap` (gelesen, nicht durchgesetzt). Aktiv-Faehigkeiten, Beschwoerungen, Auren und Zweitangriffe sind seit Runde 9 / P1 Teil des Baukastens (Abschnitt Kits).

## Evolutionen, Traits

- **Evolutionen:** 219 Rezepte nach `meta/data/aa/evolutions.json` (2 mit Zufalls-Ziel). Gesperrt (`blocked`): isharmla. AA-Materialien (Star Fruits, Items, Takedowns) werden nicht uebernommen, die Kosten stehen in `meta/data/evolution-costs.json` (Gold + Crystals nach Seltenheit).
- **Traits:** 12 nach `meta/data/aa/traits.json`. Wirkung im Match: Schaden, Reichweite, Tempo (Unit-Mod), Yen nur fuer die genannten Farm-Units. No-op: Unit-XP (es gibt keine Unit-XP); Zusatzschaden gegen Gegner mit wenig HP; Zusatzschaden gegen Bosse; True-Damage-Anteil; Platzierlimit 1 (Typ-Limit wird nicht durchgesetzt).
