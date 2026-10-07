# AA-Import: Bericht (Runde 8 / P2)

Erzeugt von `tools/aa-import` (`npm run aa-import`), nicht von Hand pflegen: der Lauf schreibt diese Datei neu. Quelle: `docs/anime-adventures/data/*.json`.

## Ergebnis

**550 Units importiert** nach `sim/data/units/aa.json`, **540 spielbar (98,2 %)**, 10 ausgeblendet (1,8 %). Ziel war >= 95 %.

| Stufe | Units | Bedeutung |
|---|---:|---|
| voll unterstuetzt (`full`) | 479 | alles, was die Daten sagen, wird gerechnet |
| mit Einschraenkungen (`limited`) | 61 | spielbar, ein Teil des Kits fehlt (Gruende unten) |
| ausgeblendet (`hidden`) | 10 | kein Angriff und kein Einkommen: nicht ziehbar, nicht in der Sammlung. Datensatz bleibt, Flag `support: "hidden"` |
| nicht importiert | 11 | AA `kind: "summon"`: Beschwoerungen mit eigenem Koerper, keine Units (`format.md`) |

Das sind 561 Eintraege in `units.json` (561): 550 Units plus 11 Beschwoerungen. Angriffe: 1000 im Katalog der Datei, davon 2 ohne Details in AA (`null`, greifen als `single` an).

## Nach Seltenheit

| Seltenheit | importiert | voll | eingeschraenkt | ausgeblendet |
|---|---:|---:|---:|---:|
| Rare | 20 | 18 | 1 | 1 |
| Epic | 19 | 18 | 1 | 0 |
| Legendary | 35 | 30 | 4 | 1 |
| Mythic | 381 | 333 | 40 | 8 |
| Secret | 73 | 59 | 14 | 0 |
| Exclusive | 22 | 21 | 1 | 0 |

## Einschraenkungen (spielbar, aber mit Luecke)

| Grund | Units | Was fehlt |
|---|---:|---|
| `summon` | 25 | Beschwoerte Figuren (eigener Koerper) fehlen |
| `secondary-attack` | 15 | Zweiter Angriff (secondary_attacks) fehlt |
| `active-ability` | 14 | Aktive Faehigkeit (Knopf, Cooldown) fehlt; die Unit greift nur normal an |
| `end-of-wave` | 4 | Effekt am Wellenende fehlt |
| `attack-details-missing` | 2 | Angriff ohne Details in AA: greift als single an |
| `trap-cap` | 2 | Fallen-/Pfad-Obergrenze nicht modelliert |
| `aura-buff` | 1 | Buff-Aura fuer Verbuendete fehlt |
| `on-kill` | 1 | Kill-Effekt fehlt |
| `partial-levels` | 1 | Einzelne Stufen ohne Angriff (Schaden 0 oder ohne SPA) |

Eine Unit kann mehrere Gruende haben. Die Luecken stehen je Unit als `supportNotes` im Datensatz; die Erklaerung der Sim-Seite in `unsupported.md`.

## Ausgeblendet

| ID | Name | Seltenheit | Grund |
|---|---|---|---|
| `griffith_reincarnation` | Griffin (Reincarnation) | Mythic | kein Angriff, kein Einkommen (Beschwoerer ohne eigenen Schaden, Buff-Aura) |
| `hoshino` | Idol | Mythic | kein Angriff, kein Einkommen (Buff-Aura) |
| `armin` | Arlem | Mythic | kein Angriff, kein Einkommen (nur Aktiv-Faehigkeit) |
| `eren_final` | Usurper (Founder) | Mythic | kein Angriff, kein Einkommen (nur Aktiv-Faehigkeit, Beschwoerer ohne eigenen Schaden) |
| `sakura` | Blossom | Rare | kein Angriff, kein Einkommen (Buff-Aura, Heilung) |
| `erwin` | Commander | Legendary | kein Angriff, kein Einkommen (nur Aktiv-Faehigkeit, Beschwoerer ohne eigenen Schaden) |
| `isharmla_evo` | Elyssia (Abyssal) | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |
| `mahoraga` | Divine General | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |
| `isharmla` | Elyssia | Mythic | kein Angriff, kein Einkommen (Kit nicht modellierbar) |
| `hoshino_evolved` | Idol (Star) | Mythic | kein Angriff, kein Einkommen (Buff-Aura) |

## Felder und Effekte

- **Uebernommen** je Unit: `id name rarity placement damageType elements critChance critDamage spawnCap spawnCapGlobal unsellable limited hideFromBanner rateupBannerOnly shinyVariant evolvedFrom`, je Stufe `level cost damage spa range attack farm note`, Angriffe 1:1 (`aoe radius angle width hits dot special`).
- **Entfallen** (Sim kennt sie nicht): `dps dpsWithDot cumulativeCost maxDps totalCost extra meta nameModule nameLegacy inLegacy cooldownField knockbackPoints health speed legacyLevels`. `evolution` wandert in `meta/data/aa/evolutions.json`. `extra` ist der Grund fuer fast alle Einschraenkungen (Aktiv-Faehigkeiten, Beschwoerer, Auren).
- **Effekte:** alle 22 Effekte der Quelle stehen im Katalog `sim/data/effects.json`; `unknownEffects` meldet nichts (Test `aa-import.test.ts`). Parameter-Annahmen: `unsupported.md`.
- **Nicht modelliert** (No-op): Aktiv-Faehigkeiten, Beschwoerungen, Auren/Buffer/Heiler, Fallen-Obergrenzen, Einheiten-Schild, Segen/Shiny, `spawnCap` (gelesen, nicht durchgesetzt).

## Evolutionen, Traits

- **Evolutionen:** 219 Rezepte nach `meta/data/aa/evolutions.json` (2 mit Zufalls-Ziel). Gesperrt (`blocked`): eren, hoshino, isharmla. AA-Materialien (Star Fruits, Items, Takedowns) werden nicht uebernommen, die Kosten stehen in `meta/data/evolution-costs.json` (Gold + Crystals nach Seltenheit).
- **Traits:** 12 nach `meta/data/aa/traits.json`. Wirkung im Match: Schaden, Reichweite, Tempo (Unit-Mod), Yen nur fuer die genannten Farm-Units. No-op: Unit-XP (es gibt keine Unit-XP); Zusatzschaden gegen Gegner mit wenig HP; Zusatzschaden gegen Bosse; True-Damage-Anteil; Platzierlimit 1 (Typ-Limit wird nicht durchgesetzt).
