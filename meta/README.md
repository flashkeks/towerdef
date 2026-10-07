# towerdef-meta (Runde 7, P1)

Die Meta-Schicht von Duskwardens: Profil, Ledger, Sammlung, Gacha, Belohnungen, Team, Speicherstand-Format.
**Reine Funktionen ohne DOM und ohne Browser-APIs.** Zufall, Uhr und IDs kommen von aussen (`MetaEnv`), damit Tests deterministisch sind,
der Client `crypto.getRandomValues` und der Server (M2) `crypto.randomInt` hineinreicht. Die Sim-PRNG und `Math.random` werden **nie** benutzt.

```bash
cd meta && npx vitest run && npx tsc --noEmit
```

Der Client spricht nicht direkt mit `meta/`, sondern ueber `client/src/backend/` (`Backend`-Schnittstelle, `LocalBackend`). Das Tor
`client/src/backend/meta.ts` re-exportiert `meta/src/index.ts`. Daten der Sim (Unit-IDs, Seltenheiten) liest `meta/src/catalog.ts`
direkt aus `sim/data/units.json` (relativer Pfad wie im Client).

## Konventionen

- Jede Funktion nimmt ein `Profile` plus Eingaben und liefert `{ ok: true, profile, result }` (neues Profil, das alte bleibt unveraendert)
  oder `{ ok: false, code, message }` (z. B. `not-enough-crystals`). Keine Exceptions fuer Spielfehler. `code` ist maschinenlesbar,
  `message` Englisch und direkt anzeigbar (UI-Texte sonst nur ueber `client/src/i18n/en.ts`).
- Ganzzahlen ueberall, Raten in Basispunkten (10000 = 100 %).
- Zeitstempel sind ISO-8601-UTC-Strings aus `env.now()`.
- `profile` ist reines JSON (Kopie per `clone`), damit es serialisierbar bleibt und der Server es 1:1 in eine Tabelle legen kann.

## Dateigrenzen und Besitzer

Jedes Paket aendert nur seine Dateien. Fremde Dateien nur minimal (Import, eine Zeile) und melden. `profile.ts` darf nur **additiv** erweitert werden
(neues optionales Feld; Aenderungen an Bestehendem brauchen eine Migration in `migrate.ts`).

| Datei | Inhalt | Besitzer |
|---|---|---|
| `src/profile.ts` | zod-Schema, Typen, `newProfile`, `nextCounter` | P1 (andere nur additiv) |
| `src/ledger.ts` | `book`, `bookAll`, Salden, Doppelbuchungs-Sperre, `KIND` | P1 |
| `src/migrate.ts` | `migrate(raw)`, Tabelle `MIGRATIONS` je Version | P1 |
| `src/io.ts` | Export/Import mit Pruefsumme | P1 |
| `src/idempotency.ts` | `withIdempotency(Async)`, Kappung | P1 |
| `src/team.ts` | `setTeam` (nur Besessene, max. 6, keine Duplikate) | P1 |
| `src/result.ts`, `env.ts`, `util.ts`, `catalog.ts`, `index.ts` | Ergebnis-Typen, injizierte Umgebung (+ `testEnv`), kanonisches JSON/Pruefsumme, Unit-Katalog, Exporte | P1 (index: jeder fuer seine Zeile) |
| `src/gacha.ts`, `data/banners/*.json` | Banner-Schema, `resolveBanner`, `rollOne`/`rollBatch`/`pull`, Pity | **P3** |
| `src/banner-math.ts`, `src/banner-view.ts` | exakte Quoten/Erwartungswerte (Markov), `bannerView` (Anzeige-Daten fuer die UI) | **P3** |
| `src/shop.ts` | Produktkatalog, `PaymentProvider`, `MockPaymentProvider`, `buy` | **P3** |
| `src/rewards.ts` | `rewardForMatch`, `matchSummaryFromReplayHead` | **P5** |
| `src/leveling.ts` | `levelUp`, Kostenkurve, Level 1-40 | **P5** (Kurve), P2 (Wirkung) |
| `src/progression.ts` | Spieler-Level aus XP, Freischaltung Hard ab 5, Nightmare ab 25 | **P5** (XP-Kurve), P2 (Freischaltung) |
| `src/starter.ts` | Starter-Geschenk | **P5** |
| `src/stars.ts` | Kopien -> Sterne (Schwellen aus `sim/data/progression.json`, `STAR_THRESHOLDS`) | **P2** |
| `src/unit-mods.ts` | `unitModsFor(profile, team)` -> `UnitMod[]` (Level/Sterne -> `lvlBp`, Kurven in `sim/src/progression.ts`) fuer `createSim({ unitMods })`; Mods gehoeren ins Replay v3 | **P2** |
| `src/views.ts` | Sichtmodelle fuer die UI: `playerView` (Salden, XP-Balken, Team-Ziel), `collectionView` (alle Katalog-Units, besessen/nicht, Level, Sterne, Kosten), `stageView` (Sperre mit Level, Erst-Clear, Bestwelle), `pullHistoryView` | **P4** |
| `test/` | je Modul eine Datei; neue Pakete legen eigene Dateien an (`test/gacha-p3.test.ts` usw.) | jeder fuer seine |

Platzhalter (`rewards`, `leveling`, `progression`, `starter`, `stars`, `unit-mods`) laufen schon: der Kreislauf
Starter -> Ziehen -> Level -> Team -> Match-Belohnung funktioniert mit Startwerten. Die TODO-Kommentare am Dateikopf nennen, was das jeweilige Paket fuellt.

## Gacha und Mock-Shop (P3)

**Alle Zahlen sind Startwerte (Runde 7), nicht kalibriert** (`calibrated: false` und `note` in jeder Banner-Datei, die Anzeige sagt es auch).
Die Banner-Dateien `data/banners/*.json` sind die **einzige Quelle fuer Anzeige und Wurf**: `rollOne`/`pull` und `bannerView` gehen beide ueber
`resolveBanner(banner)`. Jede Ziehung traegt `ratesVersion` und `ratesHash` (FNV-1a ueber das kanonische JSON der Datei) im `pullHistory`.

| Banner | Preis | Raten (Basis) | Regeln |
|---|---|---|---|
| `standard` (dauerhaft) | 50 / 10er 450 | Rare 70, Epic 25, Legendary 4, Mythic 1 % | harte Pity: Mythic beim 150. Zug, Legendary oder besser beim 35.; Zaehler je Banner im Profil, ueber Ziehungen und Sitzungen. **Keine weiche Pity** |
| `starter` (einmalig) | nur 10er, 225 (halber Preis) | Rare 65, Epic 28, Legendary 6, Mythic 1 % | ein Block je Profil (`limits.maxBatches: 1`, Zaehler `counters['batches:starter']`), mindestens ein Epic oder besser (der 10. Zug wird angehoben) |
| `featured-example` (**inaktiv**) | 50 / 450 | wie Standard | nur Datenformat: Featured-Unit 50 % der Mythic-Treffer, nach Fehlschlag garantiert (`featured`-Block); `active: false`, nicht ziehbar |

**Erwartungswerte** (exakt per Markov-Kette ueber (sinceTop, sinceMid), `banner-math.ts`; der 1-Mio.-Test haelt die Sim dagegen):
Standard: Gesamtquote Mythic **1,28 %** (Basis 1 %) = im Mittel **77,9 Zuege** (rec 13: 77,9), ca. 3 500 Crystals mit 10er-Preis (3 890 einzeln); Legendary oder besser
6,19 % = 16,1 Zuege; Rare 69,12 / Epic 24,69 / Legendary 4,91 %. Starter: 1,35 % der Bloecke brauchen die Garantie, Rare effektiv 64,86 % statt 65 %.
Der Abstand zwischen zwei Mythics ist nie groesser als 150 (Test mit 1 Mio. Wuerfen).

**Duplikat** = `copies + 1` (Sterne rechnet `stars.ts` aus den Kopien), kein Extra-Material, keine zweite Waehrung. Ledger: **ein** `gacha_spend` je Block (`gacha_pull/batch-N`).
Leere Seltenheit (keine Unit in `sim/data/units.json`): ihre Rate geht an die naechstniedrigere besetzte Stufe, eine Pity-Regel ohne besetzte Stufe ist aus, die Anzeige zeigt dieselbe Tabelle samt Hinweis.
Fehlercodes: `unknown-banner`, `banner-inactive`, `invalid-count`, `banner-limit-reached`, `not-enough-crystals`, `banner-pool-empty`.

**`bannerView(banner, profile)`** (`banner-view.ts`) liefert der UI alles zum Anzeigen: Ratentabelle je Stufe (`baseText`, `effectiveText`, `nextPullText`), Einzelraten je Unit,
`rules` (Klartext-Saetze, Englisch), `pity` (`"Pulls since last Mythic: 37 / 150"`), `expected` (Zuege/Crystals je Treffer, `lines`), `ratesVersion`, `ratesHash`, `status`
(`ok|inactive|limit-reached`), Hinweis `startValuesNotice`. Die UI rechnet nichts selbst. Zufall im Client: `crypto.getRandomValues` mit Rejection Sampling (`client/src/backend/random.ts`).

**Mock-Shop** (`shop.ts`): `SHOP_CATALOG` = 500 / 1200 (+200, +20 %) / 2600 (+600, +30 %) Crystals. **Keine Preise**: `price: null`, `priceNote: "Test purchase - no real money"`.
`PaymentProvider` nach architecture 7.2 ohne `Money` (`createCheckout`, `confirm`, `refund`, `parseWebhook`, lokal `pollEvents`). `MockPaymentProvider(env, outcome)` mit Schalter
`ok | fail | pending | duplicate-event`. Ablauf 7.3 lokal: Bestellung (`profile.orders`, Zustandsautomat `created -> pending -> paid -> refunded | failed`) -> Ereignis -> `applyPaymentEvent`
(Deduplikation per Ereignis-ID, genau **eine** Ledger-Buchung `purchase` mit `order/<orderId>`). `pending` bleibt offen (`refreshOrder` fragt nach), `fail` -> `payment-failed` (kein Profil gespeichert),
`refundOrder` -> Ledger `refund` (Saldo darf negativ werden). Idempotenz je Aktion ueber `withIdempotency*` (Doppelklick = eine Buchung).

## Profil-Schema (Version 1)

`Profile` (zod in `src/profile.ts`, Pflichtfeld `schemaVersion`):

| Feld | Inhalt |
|---|---|
| `id`, `displayName`, `createdAt` | Kennung (lokal zufaellig, kein Konto), Anzeigename, Anlegezeit |
| `playerLevel`, `playerXp` | Spieler-Level (beim Laden aus XP neu berechnet) |
| `wallet` | Cache der Salden `{ crystals, gold }`, beim Laden aus dem Ledger neu berechnet |
| `ledger` | Buchungen (siehe unten) |
| `units` | `Record<unitId, { level, xp, copies, stars, firstObtainedAt }>` |
| `team` | Unit-IDs, hoechstens 6, alle besessen |
| `pity` | `Record<bannerId, { sinceTop, sinceMid, guaranteeFeatured? }>` |
| `pullHistory` | letzte 500 Zuege (`gacha_pull`-Form aus architecture 7.5), neueste zuletzt; P3 additiv: `ratesHash`, `pityMidBefore/After`, `featured`, `pityForced: 'batch'` |
| `stages` | `stages[stageId][difficulty] = { clears, firstClearAt, bestWave }` |
| `settings`, `flags`, `counters` | freie Einstellungen, Schalter (`starterGiftClaimed`), Zaehler (`pullBatches`) |
| `idem` | Idempotenz-Tabelle, gekappt auf 200 |
| `orders` | (P3, optional) Mock-Shop-Bestellungen `{ orderId, sku, crystals, status, providerRef, eventIds }`, gekappt auf 100 |

**Zwei Meta-Waehrungen:** `crystals` (Gacha; erspielbar und im Mock-Shop; entspricht `shards` in architecture 7) und `gold` (Unit-Level, nur erspielbar).
Muenzen im Match sind davon getrennt und tauchen hier nie auf.

## Ledger

Append-only. Eintrag: `{ id, currency, delta, kind, refType, refId, createdAt }`. Saldo = Summe der `delta`. **Eindeutig** ist
`(currency, refType, refId, kind)`; eine zweite Buchung mit demselben Schluessel wird abgelehnt (`duplicate-booking`). (`currency` gehoert
zum Schluessel, damit eine Belohnung Crystals und Gold unter derselben Referenz buchen darf; architecture 7.5 nennt nur `ref_type, ref_id, kind`.)
Abbuchen unter 0 geht nicht (`not-enough-crystals` / `not-enough-gold`), ausser mit `allowNegative` (Erstattung). `kind` ist ein freier String,
bekannte Werte in `KIND` (`gacha_spend`, `purchase`, `reward`, `level_up`, `starter_gift`, `grant`, `adjust`, `refund`).
Referenzen: Ziehung `gacha_pull/batch-N`, Kauf `order/<orderId>`, Match `match/<replayHash>`, Aufstieg `unit_level/<unit>:<ziellevel>`, Starter `starter/v1`.

## Migration

`migrate(raw: unknown)` wirft nie. Ergebnis `{ ok: true, profile, migratedFrom }` oder `{ ok: false, code, message }`:
`profile-corrupt` (kein Objekt, Schema verletzt, doppelte Buchung, unbekannte Form) oder `profile-too-new` (Version groesser als `SCHEMA_VERSION`).
Ablauf: Version bestimmen -> Schritte `MIGRATIONS[v]` v -> v+1 -> zod -> Ledger-Pruefung -> `wallet` und `playerLevel` neu berechnen.
Beispiel v0 (alte Zaehler-Form, nie ausgeliefert) -> v1 ist als Uebung und Test drin.
**Neue Version:** `SCHEMA_VERSION` erhoehen, Schema anpassen, Eintrag in `MIGRATIONS`, Test.

## Export / Import

`exportProfile(profile, env)` -> JSON-Text `{ format: 'duskwardens-save', formatVersion, exportedAt, checksum, profile }`.
`checksum` = FNV-1a 64 ueber das kanonische JSON (sortierte Schluessel) des Profils. **Nur gegen versehentliche Beschaedigung**, kein
Manipulationsschutz (lokal ist alles editierbar). `importProfile(json)` prueft JSON, Format, Pruefsumme, dann `migrate`
(`import-invalid-json`, `import-wrong-format`, `import-bad-checksum`, `profile-corrupt`, `profile-too-new`). Roundtrip ist exakt identisch (Test).

## Idempotenz

`withIdempotency(profile, { key, route, request }, env, fn)`: gleicher Schluessel + gleiche Anfrage -> gespeicherte Antwort, nichts neu gebucht
(`replayed: true`); gleicher Schluessel + andere Anfrage -> `idempotency-key-reuse`. Fehlschlaege werden nicht gespeichert (Retry mit demselben Schluessel
nach "not enough crystals" soll gehen). Der Schluessel (UUID, 8-128 Zeichen) kommt vom Aufrufer.

## Wie der Server (M2) es nutzt

Dieselben Funktionen, derselbe Code: Der Server laedt das Profil (Zeile bzw. JSON) per `migrate`, ruft `withIdempotency(Async)` plus die Fachfunktion
mit `env = { randomInt: crypto.randomInt, now, newId: randomUUID }` und schreibt das Ergebnis in **einer** Transaktion zurueck. Die Belohnung wird dort aus dem
Replay nachgerechnet (P5 bereitet `matchSummaryFromReplayHead` darauf vor). Die Tabellenform aus architecture 7.5 laesst sich aus `ledger`, `pullHistory`,
`units`, `pity` und `idem` ableiten; der Client aendert sich nicht, weil `ServerBackend` dieselbe `Backend`-Schnittstelle bedient.

## Belohnungen, Leveling, Starter (P5)

**Belohnung aus dem Replay** (`verify.ts`, `rewards.ts`): `rewardFromReplay(profile, replay, env, opts)` rechnet das Replay mit der Sim nach (`verifyReplay`: Seed, Stufe, Befehle ->
Ergebnis, erreichte Welle, End-Hash) und belohnt nur das Nachgerechnete; `endWave`, `result` usw. aus der Datei zaehlen nicht. Ablauf je Befehl wie `sim/scripts/replay.ts`
(Tick anfahren, `apply`, `ok` vergleichen), am Ende Tick, Hash und Ergebnis. Fehler (alle ohne Buchung): `invalid-replay`, `replay-incomplete`, `replay-old-rules` (v1),
`replay-unsupported` (Format > 3, mehr als 1 Spieler), `replay-mismatch` (Hash/Ergebnis/Befehl stimmt nicht), `unknown-difficulty`, `difficulty-locked`, `unit-not-owned`/`team-invalid`
(nur wenn das Replay ein Team nennt), `already-reported`. Ledger-Referenz `match/<stage>-<difficulty>-<seed>-<endTick>-<hash>`: dasselbe Replay zahlt nur einmal.
Im Browser reicht der Client die Spieldaten ueber `opts.data` (`loadBrowserData()`), weil `loadGameData` Dateien liest. Dauer ca. 70-100 ms je Lauf in Node.
Formate v2 und v3: Im v3-Kopf stehende `unitMods` gehen unveraendert in `createSim`; `opts.unitMods` hat Vorrang. **Der Aufrufer muss pruefen**, dass die Mods zum Profil passen
(`unitModsFor(profile, team)`): sonst koennte ein Replay sich selbst Level geben. Ein Replay mit `team: null` (aktueller Client) hat keine Besitzpruefung der platzierten Units.

**Werte** (alles Startwerte, Rechnung in `docs/balancing/meta.md`): `data/rewards.json` (Crystals Erst-Clear 100/150/200, Wiederholung 25 %; Gold und Spieler-XP = Siegbonus +
Wert je **gehaltener** Welle — alle Gegner der Welle getötet, kein Leak; gerufene Wellen zählen nicht, sonst wäre „alle Wellen vorrufen ohne Verteidigung" farmbar (Befund P4, Test in `rewards-p5.test.ts`); Niederlage zahlt Gold und XP nach Welle, keine Crystals). Stage-Fortschritt im Profil: `stages[stage][difficulty] = { clears, firstClearAt, bestWave }`.
Unit-XP gibt es nicht (Units steigen mit Gold).
**Leveling** (`leveling.ts`): `levelUpCost(L) = 40 + 10(L-1)`, Level 1-40, `levelUpTotalCost(von, bis)`; Codes `unit-not-owned`, `max-level`, `not-enough-gold`. Wirkung auf den Schaden: P2.
**Spieler-XP** (`progression.ts`): `xpToReach(L) = 100(L-1) + 25(L-1)(L-2)/2` (L5 = 550, L25 = 9 300, L50 = 34 300); Freischaltung Hard/Nightmare unveraendert (P2).
**Starter** (`starter.ts`): einmalig (`starter-already-claimed`), 450 Crystals (10er-Preis aus dem Banner), alle Rare und Epic plus `STARTER_EXTRA` (Lancer), Team auf diese Units.

## Replay ans Profil binden (P4, schliesst die Luecke aus P5)

`rewardFromReplay(profile, replay, env, { bindToProfile: true })` (der `LocalBackend` setzt es immer, der Server (M2) muss es ebenso) prueft ZUSAETZLICH zum Nachrechnen, dass sich ein Replay keine Level geben kann:
`team-required` (kein Team im Kopf), `team-mismatch` (Team im Kopf != `profile.team`, als Menge), `unit-not-owned` / `team-invalid` (Duplikate, mehr als 6, nicht besessen), `unit-mods-mismatch`
(`unitMods` im Kopf != `unitModsFor(profile, team)`, kanonisch verglichen, Reihenfolge egal). Die Platzierung einer Unit ausserhalb des Teams ergibt `team-invalid` (galt schon vorher, sobald ein Team im Kopf steht).
Dafuer liefert `verifyReplay` jetzt auch `match.unitMods` (die Mods, mit denen nachgerechnet wurde). Ohne `bindToProfile` bleibt das alte Verhalten (Tests mit Bot-Replays ohne Team).
Folge fuer den Client: Team und Mods kommen aus `Backend.matchSetup()` (Profil), nicht mehr aus der UI; wer zwischen Matchstart und -ende Level aendert (anderer Tab), bekommt `unit-mods-mismatch`.

## Runde 8 / P2: AA-Katalog, Evolution, Traits, Migration

**Katalog:** `catalog.ts` liest alle `sim/data/units/*.json` (heute `aa.json`, 550 Units). Je Unit: `name`, `rarity`, `hidden` (Importer `support: hidden`), `evolvedOnly` (Ziel eines Evolutionsrezepts), `special` (AA `limited`/`rateupBannerOnly`/`hideFromBanner`). Pools: `poolOfRarity('summonable'|'special'|'all', rarity)`; ausgeblendete und nur-evolvierbare Units sind nie ziehbar.

**Seltenheiten** Rare/Epic/Legendary/Mythic/Secret/Exclusive laufen durch Banner (`tiers`, je Stufe optional `pool`), Pity (Regel gilt fuer "Seltenheit oder besser") und `bannerView` (Texte "Mythic or better").

| Banner | Preis | Raten (bp) | Regeln |
|---|---|---|---|
| `standard` | 50 / 450 | Rare 6900, Epic 2400, Legendary 540, Mythic 130, Secret 25, Exclusive 5 | Pity Mythic oder besser 150, Legendary oder besser 35; Pool Standard (76 Mythic, 9 Secret, 6 Exclusive ...) |
| `special` | 60 / 540 | Rare 6500, Epic 2500, Legendary 600, Mythic 330, Secret 70 | Mythic/Secret aus dem Special-Pool (begrenzt/Event/Rate-up), Featured `goku_ssj3` 50 % mit Garantie, Pity 120 |
| `starter` | nur 10er, 225 | + Secret 20 | wie Runde 7, einmalig, mindestens Epic |
| `featured-example` | inaktiv | | nur Datenformat |

AA-Vorlage (`banners.json`): Standard Mythic 0,25 %, Pity 400, Secret 1/400 000, Banner-Tiers nach Spieler-Level. Uebernommen wurde nur die Struktur (Standard/Special, Center-Featured 50 %, Pity auf Seltenheit oder besser); Raten und Pity sind Startwerte fuer ein 10er-Spiel, **nicht kalibriert**. Secret ist von Anfang an ziehbar (kein Spieler-Level-Tor).

**Evolution** (`evolution.ts`, Daten `data/aa/evolutions.json`): `evolve(profile, unitId, env)` ersetzt die Unit durch die entwickelte Form; Level, XP, Trait, Kopien (minus verbrauchte) und Team-Platz bleiben. Kosten **Gold + Crystals nach Seltenheit der Form** (`data/unit-costs.json`: Mythic 300 Crystals + 2500 Gold, Secret 600 + 5000 ...). Entscheidung: AA-Items (Star Fruits, Ringe, Takedowns) entfallen, der AA-Aufwand steht nur als Information im Rezept. Benoetigte weitere Units/Kopien (`needs`, z. B. Gon 10 Kopien, Rengoku + 4 Akaza) werden geprueft und verbraucht. Zufalls-Evolutionen (Elize, Chance) wuerfeln gleichverteilt. Ledger `evolve/<unit>:<n>` (Crystals und Gold), Zaehler `counters['evolve:<unit>']`. `evolutionView` liefert der UI Ziel, Kosten, Voraussetzungen, `ready`, `reason`. Codes: `unit-not-owned`, `no-evolution`, `evolution-unavailable` (Ziel nicht spielbar, 3 Rezepte), `evolution-needs-units`, `not-enough-crystals`, `not-enough-gold`.

**Traits** (`traits.ts`, Daten `data/aa/traits.json`): `rerollTrait(profile, unitId, env)` kostet Crystals nach Seltenheit der Unit (Rare bis Legendary 20, Mythic aufwaerts 100), Wurf nach AA-Gewicht, Stufe 1-3 bei Superior/Nimble/Range. Ledger `trait_reroll/<unit>:<n>`. Der Trait liegt in `profile.units[id].trait = { id, tier }` und geht in `unitModsFor` ein (`traitBp`, `rangeBp`, `spaBp`, `yieldBp`; nur gesetzte Felder). Replay-Pruefung (`unit-mods-mismatch`) kennt die neuen Felder. Nicht modellierte Teile: `docs/aa-import/unsupported.md`. Beide Aktionen laufen im Backend (`evolve`, `rerollTrait`) ueber `withIdempotency`.

**Starter** (`starter.ts`): 12 feste AA-Units (`STARTER_UNITS`), Team = die ersten sechs (Goku SSJ3, Genos, Krillin, Speedwagon, Jotaro, Law), 450 Crystals (Ledger `starter/v2`; wer `starter/v1` hat, bekommt sie nicht noch einmal).

**Migration 1 -> 2** (`migrate.ts`, Schema-Version 2): Runde-7-Units (`LEGACY_R7_UNITS`, 14) und unbekannte IDs werden entfernt. Erstattung: Crystals je Kopie (Rare 25, Epic 60, Legendary 150, Mythic 450; `data/unit-costs.json`), Gold zu 100 % fuer gekaufte Level (`levelUpTotalCost`), je Waehrung eine Buchung `refund`, `migration/v2-units`. Team leer, Idempotenz-Tabelle leer, `starterGiftClaimed` zurueckgesetzt (neues Geschenk abholbar). **Pity je Banner bleibt** (Regeln gleich), Verlauf, Stages, Level, Zaehler bleiben. Bericht fuer die UI in `settings.migrationR8` (`removedUnits`, `refundCrystals`, `refundGold`). Test mit echtem Runde-7-Profil (`test/fixtures/profile-r7.json`, mit dem Code der Runde 7 erzeugt).
