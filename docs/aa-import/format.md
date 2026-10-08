# Unit-Format (Zielformat für Importer P2 und Crossover P6)

Stand: Runde 9 / P1 (08.10.2026; Fähigkeiten, Auren, Beschwörungen, Zweitangriffe, siehe unten). Runde 8 / P1 (07.10.2026). Quelle der Wahrheit im Code: `sim/src/data/schema.ts` (`UnitFileSchema`, `UnitSchema`, `AttackSchema`, `EffectsSchema`). Erklärung der Wirkung: `sim/README.md`, Abschnitt „Unit-Baukasten“.

**Grundsatz:** eine neue Unit ist **nur ein Datensatz**. Das Format folgt der AA-Struktur aus `docs/anime-adventures/data/units.json`, damit der Importer fast 1:1 kopiert. Zahlen stehen in **AA-Einheiten** (Yen, Schaden, Sekunden, Studs, Grad, Dezimalzahlen); die Sim rechnet sie beim Laden mit den Konstanten aus `sim/data/economy.json` (`scale`) in Festkomma um. Unbekannte Zusatzfelder (AA-Rohdaten wie `dps`, `cumulativeCost`, `extra`, `meta`) werden beim Parsen **verworfen**, nicht abgelehnt.

## Dateien

Alles in `sim/data/units/*.json` wird geladen (alphabetisch) und zusammengeführt. Heute: `aa.json` (550 Units, Importer P2; seit Runde 9 auch die Beschwörungen und die Kit-Angriffe, siehe unten). `sample.json` ist als Test-Fixture nach `sim/test/fixtures/sample-units.json` gewandert (sonst Doppel-IDs). `crossover.json` (25 Figuren, P6, `source: "custom"`, Anleitung [neue-unit.md](neue-unit.md)). Zusatzfelder des Importers: `support` (`full`/`limited`/`hidden`) und `supportNotes`.

```jsonc
{
  "ref": "woher die Daten stammen (frei)",
  "units":   [ /* Unit */ ],
  "attacks": { "<attack-id>": { /* Angriff */ }, "<id-ohne-details>": null },
  "summons": { "<summon-id>": { /* Beschwörung, Runde 9 */ } }
}
```

- **Angriffs-IDs sind global** über alle Dateien. Dieselbe ID mit anderem Inhalt in zwei Dateien: Ladefehler. `null` als Wert = AA kennt den Angriff, hat aber keine Details (z. B. `giselle:three`) und wird übersprungen; eine Stufe, die ihn nennt, greift als `single` an.
- Unit-IDs müssen eindeutig sein (über alle Dateien).
- Der **Effekt-Katalog** ist eine eigene Datei, `sim/data/effects.json` (nicht je Unit-Datei). Neue Effekte brauchen neuen Code; neue Kombinationen und Werte nicht.

## Unit

| Feld | Typ | Pflicht | Bedeutung / AA-Quelle |
|---|---|---|---|
| `id` | string | ja | AA `id` |
| `name` | string | ja | Anzeigename. **Seit Runde 10 der echte Name der Figur** ("Son Goku"), geschrieben vom Importer aus `docs/aa-import/figuren.json`; der AA-Parodiename (`nameRR`) steht dort als `aaName` und nicht mehr in den Spieldaten. Rohdaten ohne `name` lesen `nameRR` als Alias (Test `units-data`) |
| `series` | string | nein | Serie der Figur ("Naruto", "One Piece", "Legends of Earth"): Zweitzeile unter dem Namen, Serien-Filter der Sammlung. Nur Anzeige, nie Regel |
| `form` | string | nein | Form derselben Figur ("Super Saiyan Blue"). Anzeige: `name (form)`, so steht es in `UnitDef.name` und im Meta-Katalog |
| `rarity` | `Rare` `Epic` `Legendary` `Mythic` `Secret` `Exclusive` | ja | wie AA (Groß-/Kleinschreibung beachten). AA-Einträge mit `kind: "summon"` (Rarity `summon`, 11 Stück) sind **keine Units**, sondern Wesen im Katalog `summons` (Runde 9) |
| `placement` | `ground` `hill` `hybrid` | ja | AA `placement`. Boden trifft keine Flieger, Hügel/Hybrid schon |
| `damageType` | `physical` `magic` `true` | nein (physical) | AA `damageType`; `true_damage` wird als `true` gelesen; `null` = physical (4 AA-Units) |
| `elements` | Liste aus `dark` `fire` `lightning` `ice` `air` `light` `water` `rose` | nein | AA `secondaryDamageTypes` (Alias beim Parsen) |
| `critChance` | 0..1 | nein | AA `critChance` (0,5 = 50 %) |
| `critDamage` | Zahl >= 1 | nein | Multiplikator (AA `critDamage`); fehlend: x1,5 (`economy.damage.critDefaultMultBp`) |
| `spawnCap` | int | nein | AA `spawnCap`, **gelesen und nicht durchgesetzt** (Entscheidung Max 07.10.2026: kein Typ-Limit). `spawnCapGlobal` ebenso |
| `footprint` | 1 oder 2 | nein (1) | Kollisionsradius 400 bzw. 900 Milli-Tiles. In AA nicht vorkommend; für große Figuren |
| `hitsAir` | bool | nein | überstimmt die Platzier-Regel (ground trifft Luft: `true`; hill trifft Luft nicht: `false`) |
| `unsellable` | bool | nein | AA `unsellable`; Verkauf wird abgelehnt (`unsellable`) |
| `placeGrowthBp` | int | nein | Zuwachs der Platzierkosten je weiterer gleicher Unit (Bp), überstimmt `economy.placeCostGrowthBp` |
| `levels` | Liste, mindestens 1 | ja | Stufen, Reihenfolge = Stufe. Siehe unten |
| `flavor`, `imageQuery`, `source` | string | nein | nur Beschreibung (P6: Flavor-Text, Bild-Suchhinweis) |
| `abilities` | Liste von Fähigkeiten | nein | Runde 9: Knopf-Fähigkeiten, automatische Fähigkeiten, periodische Beschwörer. Siehe Abschnitt „Fähigkeiten“ |
| `aura` | Aura oder Liste je Stufe | nein | Runde 9: Dauer-Buff auf Verbündete |
| `evolvedFrom`, `evolution`, `limited`, `hideFromBanner`, `rateupBannerOnly`, `shinyVariant` | wie AA | nein | **die Sim wertet sie nicht aus**; sie bleiben im Datensatz für Meta/Gacha/Evolution (P2) |

### Stufe (`levels[]`)

| Feld | Typ | Bedeutung |
|---|---|---|
| `level` | int | 0 = Platzierung, 1..n = Upgrades; muss dem Index entsprechen (Lader prüft) |
| `cost` | Yen | Stufe 0: Platzierung, sonst Preis des Upgrades auf diese Stufe. Stufe 0 muss > 0 sein. Fehlt `cost` in einer Upgrade-Stufe, gilt der Vorwert |
| `damage` | Zahl | Schaden je Angriff in AA-Einheiten (wird auf die `hits` geteilt). Fehlt: Vorwert |
| `spa` | Sekunden | Sekunden pro Angriff (AA `attack_cooldown`). Fehlt: Vorwert |
| `range` | Studs | Reichweite (25 Studs = 5 Kacheln). Fehlt: Vorwert |
| `attack` | Angriffs-ID | Eintrag in `attacks`. Fehlt: Vorwert. **Eine andere ID auf einer späteren Stufe wechselt den Angriff** (`rokuhira:one` -> `:two` -> `:three`) |
| `farm` | Yen | Einkommen je Wave (Farm-Units) |
| `also` | Liste von Angriffs-IDs | Zweitangriffe (Runde 9): laufen zusammen mit `attack` im Wechsel (Schlag 1 `attack`, Schlag 2 das erste `also` ...), eine gemeinsame Abklingzeit, gleicher Stufen-Schaden. Wird wie die anderen Stufenfelder vererbt; `[]` setzt zurück |
| `note` | string | frei, nur Anzeige |

Eine Stufe **greift an**, wenn `damage`, `spa` und `range` > 0 sind. Eine Unit ohne Angriff und mit `farm` ist eine Farm.

## Angriff (`attacks.<id>`)

| Feld | Typ | Bedeutung |
|---|---|---|
| `aoe` | `single` `circle` `cone` `line` `full` | Form; fehlend/`null` = `single` |
| `radius` | Studs | `circle`: Radius um das **Ziel** (fehlt: 8) |
| `angle` | Grad | `cone`: Gesamtwinkel ab der Unit, Länge = Range (fehlt: 60) |
| `width` | Studs | `line`: Breite ab der Unit Richtung Ziel (fehlt: 4) |
| `hits` | int 1..30 | Anzahl Treffer; **der Schaden wird geteilt, nicht vervielfacht** (fehlt: 1) |
| `dot` | `{ type, multiplierPerTick, ticks, totalMultiplier? }` | `type` = `Burn` `Bleed` `Poison` `Wither`; Gesamt je Treffer = `totalMultiplier` (sonst `multiplierPerTick x ticks`) des Treffer-Schadens, ein Tick je Sekunde |
| `special` | `{ name, duration?, influence?, chance? }` oder Liste davon | `name` = Schlüssel im Effekt-Katalog (exakt wie AA, z. B. `"Cursed (30%)"`); `duration` Sekunden, `influence` 0..1 (Slow: Tempoverlust), `chance` 0..1 überstimmen den Katalog |

Effekte, die der Katalog kennt (alle 22 aus `units.json.effects`): Sunshine, Unconscious, Confused, Dismembered, Stun, Hexed (20%), Knockback, Slow, Wild Card, Mind Control, Bleed Amplification, Cursed (30%), OverCrit, Battlelust, Wither, Hexed (25%), Timestop, Snatched, Motivate, Shatter, Freeze, Cursed (15%) — dazu die Hilfseinträge `WildBurn`, `WildBleed`. Ein Name, der nicht im Katalog steht, ist ein **No-op** (kein Absturz); `unknownEffects(data)` (aus `sim/src/index.ts`) listet ihn. Parameter, Annahmen und Lücken: [`unsupported.md`](unsupported.md).

## Beispiel (aus `sample.json`, Stain, Mythic)

```json
{
  "id": "stain", "name": "Stain", "rarity": "Mythic", "placement": "ground",
  "damageType": "physical", "critChance": 0.5, "spawnCap": 3,
  "levels": [
    { "level": 0, "cost": 1500, "damage": 308, "spa": 6, "range": 19, "attack": "stain:one" },
    { "level": 1, "cost": 2100, "damage": 692, "spa": 6, "range": 20 },
    { "level": 2, "cost": 3000, "damage": 1154, "spa": 6, "range": 22, "attack": "stain:two" }
  ]
}
```
```json
"stain:one": { "aoe": "circle", "radius": 8, "dot": { "type": "Bleed", "multiplierPerTick": 0.1, "ticks": 3, "totalMultiplier": 0.3 } }
```

Stufe 1 erbt `attack` (`stain:one`); Stufe 2 wechselt auf `stain:two`. Mit einem Effekt: `"emilia:shot": { "aoe": "line", "width": 5, "special": { "name": "Slow" } }`, mit Überstimmung `"special": { "name": "Slow", "duration": 2.5, "influence": 0.65 }`.

## Abbildung AA -> Zielformat (Importer P2)

| AA (`units.json`) | Ziel |
|---|---|
| `nameRR` | `name` (oder unverändert lassen: Alias) |
| `secondaryDamageTypes` | `elements` (oder unverändert: Alias) |
| `damageType` `true_damage` / `null` | `true` / weglassen (physical) |
| `levels[]` | `levels[]` mit den Feldern `level cost damage spa range attack farm note`; `cumulativeCost`, `dps`, `dpsWithDot`, `extra` entfallen |
| `attacks` | `attacks` 1:1 (Felder `aoe radius angle width hits dot special` stimmen schon) |
| `kind: "summon"` | als Wesen in `summons` (Runde 9, Kit-Tabelle `tools/aa-import/kits.ts`) |
| `extra.active_attack`, `spawn_unit`, `aura_buff`, `secondary_attacks`, `_attacks` | Fähigkeit, Beschwörer, Aura, Zweitangriffe: Kit-Tabelle bzw. `also` (Runde 9) |
| `evolution`, `evolvedFrom`, `limited`, ... | 1:1 mitgeben, die Sim ignoriert sie |

`test/units-data.test.ts` parst **alle 550 AA-Units und 1098 Angriffe** ohne jede Umformung (Aliase) und lässt jede Unit drei Waves spielen; der Importer braucht also nur auszuwählen, zu ergänzen (Bild, Banner, Meta) und zu schreiben. Prüfen nach dem Schreiben: `cd sim && npx vitest run test/units-data.test.ts test/smoke.test.ts`.

## Fähigkeiten, Auren, Beschwörungen, Zweitangriffe (Runde 9 / P1)

AA kennt dazu nur Marken (`extra.active_attack` mit Abklingzeit, `spawn_unit`, `aura_buff`, `_attacks`), **keine Wirkungszahlen**. Namen und Abklingzeiten sind AA; Wirkung und Stärke stehen als Datensatz in `tools/aa-import/kits.ts` (DESIGN, Annahmen in `unsupported.md`). Schema: `sim/src/data/schema.ts` (`AbilitySchema`, `AuraSchema`, `SummonSchema`), Wirkung: `sim/README.md`, Abschnitt „Fähigkeiten und Beschwörungen“.

**Fähigkeit** (`units[].abilities[]`):

| Feld | Typ | Bedeutung |
|---|---|---|
| `id`, `name` | string | `name` ist die Anzeige (Englisch) |
| `trigger` | `button` (Standard) `auto` | `button`: der Spieler löst aus (Befehl `ability`, Taste Q, Knopf), der **Auto-Schalter** der Unit (`autoAbility`) löst sie bei Bereitschaft selbst aus. `auto`: feuert immer von selbst (Dauer-Beschwörer) |
| `cooldown` | Sekunden | Abklingzeit nach dem Auslösen (AA `active_attack_stats.attack_cooldown`); die Unit startet bereit |
| `minLevel` | Stufe (Index) | ab hier verfügbar (`levels[].note` "+ Nullification" = Stufe 6) |
| `attack` | Angriffs-ID | Form, Treffer, DoT, Spezialeffekte aus dem Katalog (Zeitstopp = `{ "aoe": "full", "special": { "name": "Timestop" } }`) |
| `damageMult` / `damage` | Zahl | Schaden = Stufen-Schaden x `damageMult` (Standard 1), oder absolut in AA-Einheiten (`damage`, für Units ohne eigenen Schaden); 0 = nur die Effekte |
| `scope` | `range` (Standard) `global` | `range`: braucht ein Ziel in Reichweite (sonst `no-target`); `global`: trifft die ganze Karte (braucht einen lebenden Gegner) |
| `pulses`, `durationSec` | Zahl | mehrere Schläge, gleichmäßig über `durationSec` verteilt (der erste sofort) |
| `selfBuff` | Buff | auf die Unit selbst |
| `buff` | Buff + `radius` (Studs, fehlt = alle Verbündeten) + `self` | auf Verbündete |
| `summon` | `{ id, count }` oder Liste | ruft Wesen aus `summons` |
| `coins` | Yen | zusätzliche Münzen |

**Buff:** `damagePct`, `rangePct`, `tempoPct` (Angriffstempo), `critPct` (Crit-Chance), `durationSec`; wirkt wie Motivate (stärkster gewinnt, kein Stapeln, Deckel aus `economy.buffCaps`).

**Aura** (`units[].aura`, ein Eintrag oder je Stufe eine Liste): `damagePct`, `rangePct`, `tempoPct`, `critPct`, `radius` (Studs; fehlt = global). Wirkt dauerhaft auf Verbündete (nicht auf den Träger), gleiche Auren stapeln nicht.

**Beschwörung** (`summons.<id>`): `name`, `mode` (`walk` läuft den Gegnern auf dem Pfad entgegen, hält Bodengegner auf und kämpft; `stand` steht neben dem Beschwörer und schießt), `damageType`, `elements`, `damageMult` (Vielfaches des Stufen-Schadens des Beschwörers) oder `damage` (absolut), `spa`, `range` (Studs), `attack` (Katalog-ID, ohne Angriff tut sie nichts außer Aufhalten), `lifetime` (Sekunden, 0 = bis zum Fall oder Verkauf des Beschwörers), `durability` (Sekunden, die sie gegen einen Standard-Gegner im Kontakt durchhält), `blocks`, `speed` (Kacheln/s), `hitsAir`, `endAttack` + `endDamageMult` (letzter Schlag beim Ende, Kamikaze), `maxAlive` (Grenze je Beschwörer, ein neues Wesen ersetzt das älteste).

**Zweitangriffe:** der Importer setzt `levels[].also` für alle Units, deren AA-Daten mehrere Angriffe führen (`_attacks`, `secondary_attacks`) und für die Stufen-Notizen "+ Scatter", "+ Kaminari" (Rokuhira): je Stufe laufen die bisher freigeschalteten Angriffe neben dem der Stufe im Wechsel mit. Alle anderen Units wechseln wie bisher auf den Angriff der Stufe (516 von 550 tun das; ob AA dort auch rotiert, sagen die Daten nicht).

**Replay:** neue Befehle `{ type: 'ability', entityId, index? }` und `{ type: 'autoAbility', entityId, on }` (Replay-Format v5; v4 bleibt nachspielbar).

## Legends of Earth (Runde 10 / P1)

Promis und Internet-Größen in `sim/data/units/legends.json` (25 Figuren, `source: "legends"`, `series: "Legends of Earth"`, IDs `p_*`, eigener Pool `legends` und Banner `meta/data/banners/legends.json`). Gleiches Format wie das Crossover; zusätzlich tragen die Figuren Knopf-Fähigkeiten (`abilities`: Münzen, Buff, globaler Slow, Beschwörung) und eine Aura. Quelle: `tools/aa-import/legends-spec.ts`, schreiben mit `npm run legends`, prüfen mit `npm run legends:check`. Anleitung: [neue-unit.md](neue-unit.md).

## Crossover (P6)

Gleiches Format in `sim/data/units/crossover.json`; Angriffs-IDs mit eigenem Präfix je Figur (`rick:never_gonna`), damit sie nicht mit AA kollidieren. Neue Mechanik mit Witz entsteht aus **Kombination vorhandener Effekte**: Rick Astley = `Confused` (Gegner laufen zurück), Shrek-Sumpf = `Slow` mit großem `circle`, Iron Man = `line` plus `circle` mit `hits`. Werte im Rahmen der AA-Werte gleicher Seltenheit (Median-Stufenkurve als Vorlage). Wirklich neue Wirkungen (neuer Effekt-Typ) brauchen einen Eintrag in `effects.json` **und** Code in `sim/src/systems/special.ts`/`attack.ts`.
