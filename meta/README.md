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
| `src/gacha.ts`, `data/banners/*.json` | Banner-Schema, `rollOne`, `pull`, Pity | **P3** |
| `src/shop.ts` | Produktkatalog, `PaymentProvider`, `MockPaymentProvider`, `buy` | **P3** |
| `src/rewards.ts` | `rewardForMatch`, `matchSummaryFromReplayHead` | **P5** |
| `src/leveling.ts` | `levelUp`, Kostenkurve, Level 1-40 | **P5** (Kurve), P2 (Wirkung) |
| `src/progression.ts` | Spieler-Level aus XP, Freischaltung Hard ab 5, Nightmare ab 25 | **P5** (XP-Kurve), P2 (Freischaltung) |
| `src/starter.ts` | Starter-Geschenk | **P5** |
| `src/stars.ts` | Kopien -> Sterne (Schwellen aus `sim/data/progression.json`, `STAR_THRESHOLDS`) | **P2** |
| `src/unit-mods.ts` | `unitModsFor(profile, team)` -> `UnitMod[]` (Level/Sterne -> `lvlBp`, Kurven in `sim/src/progression.ts`) fuer `createSim({ unitMods })`; Mods gehoeren ins Replay v3 | **P2** |
| `test/` | je Modul eine Datei; neue Pakete legen eigene Dateien an (`test/gacha-p3.test.ts` usw.) | jeder fuer seine |

Platzhalter (`gacha`, `shop`, `rewards`, `leveling`, `progression`, `starter`, `stars`, `unit-mods`) laufen schon: der Kreislauf
Starter -> Ziehen -> Level -> Team -> Match-Belohnung funktioniert mit Startwerten. Die TODO-Kommentare am Dateikopf nennen, was das jeweilige Paket fuellt.

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
| `pity` | `Record<bannerId, { sinceTop, sinceMid }>` |
| `pullHistory` | letzte 500 Zuege (`gacha_pull`-Form aus architecture 7.5), neueste zuletzt |
| `stages` | `stages[stageId][difficulty] = { clears, firstClearAt, bestWave }` |
| `settings`, `flags`, `counters` | freie Einstellungen, Schalter (`starterGiftClaimed`), Zaehler (`pullBatches`) |
| `idem` | Idempotenz-Tabelle, gekappt auf 200 |

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
