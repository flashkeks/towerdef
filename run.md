# run.md — Runde 8 (neu): AA-Import, 561 Units, echtes Interface

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

**Zuerst lesen: `docs/design/ENTSCHEIDUNGEN.md`, Abschnitt „Kurswechsel 07.10.2026“.** Er ersetzt
alles, was ihm widerspricht. Dann `docs/STATUS.md`, dann diese Datei. Die zuerst geplante Runde 8
(Bindung, Tagesaufgaben …) ist **verworfen** und liegt in `docs/archiv/run-runde8-verworfen.md`.

---

## 1. Was schiefgelaufen ist und was jetzt zählt

Runde 4–7 haben ein sauberes, aber **kleines** Spiel gebaut: 14 handgemachte Units, eine Map, und sehr
viel Zeit in Bot-Balancing. Max und Plori wollten etwas anderes: ein Spiel im **Umfang von Anime
Adventures**, mit sehr vielen bekannten Anime-Figuren, vielen Systemen und viel zu tun. Die Recherche
dafür liegt seit Runde 1 fertig in `docs/anime-adventures/data/`:

| Datei | Inhalt |
|---|---|
| `units.json` | **561 Units** mit allen Stufen (Kosten, Schaden, SPA, Reichweite, Angriff je Stufe), Placement, Damage-Typ, Element, Crit, Evolution; dazu **1.098 Angriffe** (Form, Winkel, Breite, Radius, Hits, Effekte) und **22 Effekte** |
| `traits.json` | 12 Traits mit Chancen und Wirkung, Reroll |
| `banners.json` | Banner, Raten, Pity |
| `items.json` | 219 Evolutionsrezepte, Items, Shops |
| `enemies.json` | Gegner-Modifikatoren, **144 Bosse**, Boss-Angriffe, CC-Immunitäten |
| `maps.json`, `waves.json` | **22 Story-Welten**, Legend Stages, Raids, Wave-Anzahlen |

Die Namen und Inhalte dürfen **direkt übernommen** werden (intern, hinter Access, Entscheidung Max).

**Ziel dieser Runde, sichtbar und vorzeigbar:**
1. **Alle 561 AA-Units** stecken als Daten im Spiel, sind über Gacha ziehbar und im Match spielbar.
2. Eine **neue Unit braucht null Zeilen Code**, nur einen Datensatz (und ein Bild).
3. Das **Interface** sieht hochwertig und eigenständig aus, nicht mehr wie Kek-Game.
4. **Story-Gerüst:** mehrere Welten mit Acts, AA-Namen und AA-Bossen, mindestens 3 spielbare Maps.

**Kein Feinschliff, keine Bot-Messreihen.** Bots nur als Rauchtest: Eine Stage läuft mit zufälligen
AA-Units ohne Absturz durch, und eine starke Unit schafft Story Act 1. Mehr nicht.

---

## 2. Arbeitsweise (neu)

- Subagenten **immer `model: "sonnet"`**, nie Opus; Mechanisches `"haiku"`. Höchstens 4 gleichzeitig.
- **Jedes Paket endet mit Screenshots** in `client/docs/r8/` und einer Zeile in STATUS: „was man jetzt
  sehen kann“. Ein Paket ohne sichtbares Ergebnis ist nicht fertig.
- **Zeitbudget:** keine Messläufe über 10 Minuten. Wenn etwas „ungefähr läuft“, weiter.
- `sim/` bleibt deterministisch (Festkomma, Seed). Replays bleiben gültig; Format-Version hoch, alte
  Replays werden als „altes Regelwerk“ erkannt.
- Vor jedem Commit: Tests + Typecheck in `sim/` und `client/`, `npm run build`, `npm run smoke`.
  Tests, die an den 14 alten Units hängen, auf AA-Units umstellen oder eine kleine feste Testauswahl
  verwenden.

---

## 3. Arbeitspakete

### P1 — Baukasten im Simulator (ein Agent, allein, zuerst)
Alles, was in `units.json` vorkommt, muss der Kern **generisch** können:
- **Angriffsformen** `single`, `circle` (Radius um das Ziel), `cone` (Winkel ab Unit, begrenzt durch
  Range), `line` (Breite, ab Unit), `full` (alles in Range); **Hits** (Schaden geteilt, nicht vervielfacht).
- **Wechselnde Angriffe je Stufe** (z. B. `rokuhira:one` → `:two` → `:three`).
- **Damage-Typen** physical/magic/true, **Elemente** und Gegner-Schwächen/Resistenzen nach
  `design-brief.md` § 2.4 (Schwäche additiv, Resistenz `100/(100+R)`, True ignoriert).
- **Crit** (Chance, Multiplikator).
- **Alle 22 Effekte** aus `units.json` (`effects`): Burn, Bleed, Poison, Wither, Slow, Stun, Freeze,
  Knockback, Confused, Sunshine … nach `combat-system.md` § 7. Was sich nicht sinnvoll modellieren
  lässt: als No-op mit Eintrag in `docs/aa-import/unsupported.md`, **nicht** blockieren.
- **Maßstab:** feste Umrechnung AA-Studs → Kacheln und AA-Yen → Match-Münzen als Konstanten in
  `economy.json`. Am einfachsten: **AA-Werte unverändert übernehmen** (Yen, Schaden, SPA) und Gegner-HP,
  Start-Yen und Einkommen auf AA-Maßstab heben. Begründung in `docs/aa-import/massstab.md`.
- `spawnCap` wird gelesen, aber **nicht** durchgesetzt (Entscheidung Max: kein Typ-Limit).

### P2 — Importer (ein Agent, nach P1)
- `tools/aa-import/`: liest `docs/anime-adventures/data/*.json`, schreibt `sim/data/units/aa.json`
  (oder eine Datei je Unit), **alle 561**. Lauf ist wiederholbar (`npm run aa-import`).
- Report `docs/aa-import/report.md`: wie viele Units voll unterstützt, welche Felder/Effekte fehlen,
  welche Units ausgeblendet werden mussten (Ziel: ≥ 95 % spielbar).
- **Evolutionen** (219 Rezepte), **Traits** (12, Reroll), **Banner/Raten/Pity** aus den AA-Dateien
  übernehmen und an das bestehende Gacha (Runde 7) anschließen. Seltenheiten Rare/Epic/Legendary/
  Mythic/Secret/Exclusive.
- Die 14 alten Units fliegen aus dem Pool (Spielstände aus Runde 7: Migration, alte Units werden
  gegen Crystals erstattet).
- **Bild-Manifest** `client/public/aa/manifest.json`: je Unit-ID der erwartete Wiki-Dateiname
  (`nameRR` mit `_` statt Leerzeichen + `.png`, Varianten wie `(Shiny)` mit aufnehmen). Die Bilder
  selbst holt die **Homelab-Seite** (Abschnitt 5), sie sind in deiner Umgebung gesperrt.

### P3 — Welten, Acts, Maps (ein Agent, nach P1, parallel zu P2)
- Story-Struktur nach `maps.json`: Welt → 6 Acts, Boss am Act-Ende (Bosse aus `enemies.json`, so weit
  der Kern ihre Fähigkeiten kann, sonst vereinfacht).
- **Mindestens 3 Welten spielbar**, jede mit eigener Map (eigener Pfad, eigene Zonen, eigene Farbwelt),
  Welle-Anzahl und Gegner-Modifikatoren aus `waves.json`/`enemies.json`.
- Infinite (gibt es im Kern) als eigener Modus in der Lobby, Legend Stages und Raids als Daten-
  Gerüst (spielbar ab der nächsten Runde reicht).
- Fortschritt: Acts schalten sequenziell frei, Erst-Clear-Belohnung nach `design-brief.md` § 1.

### P4 — Interface-Neubau (ein Agent, nach P1, parallel; Recherche erlaubt)
Max: „Das soll sich abheben und wirklich gut aussehen, komplex sein, ein wirklich geiles Interface.“
- **Eigenes Design-System** (nicht der Kek-Game-Look): Farbwelt, Typo (Display-Schrift mit Charakter),
  Panels mit Tiefe, Seltenheits-Rahmen mit Verlauf/Glow (Secret/Mythic animiert), Icons.
  Vorbilder: AA, Genshin, Honkai Star Rail, Arknights, Blue Archive. Eine kurze Moodboard-Notiz in
  `docs/design/ui.md` mit 5–10 Bezugspunkten.
- **Lobby** als Hub mit großem Hintergrund und Figur(en) im Vordergrund, Menü-Kacheln statt Knopfliste.
- **Summon:** Banner-Artwork mit Featured-Units, dramatische Zieh-Animation (Licht, Seltenheits-Farbe,
  Porträt-Reveal), 10er-Übersicht als Karten; Raten/Pity weiterhin sichtbar.
- **Sammlung:** Raster mit Porträt-Karten (Seltenheit, Level, Element-Symbol, Trait-Badge), Filter und
  Sortierung (Seltenheit, Element, Placement, DPS), Detailseite mit großem Porträt, Werten je Stufe,
  Angriffsform-Vorschau, Evolution, Trait-Reroll.
- **Im Match:** Unit-Leiste mit Porträts, Upgrade-Panel mit Werten alt → neu, Wellen-/Boss-Anzeige im
  gleichen Stil.
- Bibliotheken frei wählbar (Lizenz egal): z. B. GSAP für Animationen, pixi-filters für Glow.
- Bilder kommen aus `/aa/units/...` (Abschnitt 5). **Fallback** ohne Bild: gestaltete Karte mit Initialen,
  Element-Farbe und Rahmen, damit lokal und in Screenshots nichts kaputt aussieht.

### P5 — Abschluss (Hauptsitzung)
Screenshots (Lobby, Summon-Reveal, 10er-Ergebnis, Sammlung mit vielen Units, Unit-Detail, Weltkarte,
Match in Welt 2 und 3), `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 8 (AA-Import)
Was man jetzt sehen kann (5 Zeilen):
Units: importiert / spielbar / ausgeblendet (Gründe):
Effekte: unterstützt / No-op:
Welten spielbar:
Maßstab (Yen, HP, Studs):
Interface: was neu ist:
Bekannte Lücken:
Vorschlag Runde 9: 3–5 Sätze
Agenten (Anzahl, Modell):
Commits:
```

---

## 4. Was du nicht tust

- **Nichts deployen.** Die Homelab-Seite baut die Preview aus `dev`.
- Keine Balance-Messreihen, keine Kennlinien, keine Leave-one-out-Tabellen.
- Kein Server, kein Konto (M2 kommt später).
- `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen in STATUS unter „Offene Fragen“.

---

## 5. Was die Homelab-Seite parallel macht (nur zur Info)

- Lädt alle Bilder aus dem AA-Wiki über CT 113 (das Wiki ist aus deiner Umgebung gesperrt), legt sie
  auf `edge` unter `/srv/duskwardens/aa/` ab und liefert sie auf der Preview unter `/aa/` aus.
  Grundlage ist dein `client/public/aa/manifest.json` (P2) bzw. bis dahin die Unit-Namen aus
  `units.json`.
- Format: `/aa/units/<unit-id>.png` (Original) und `/aa/units/<unit-id>.webp` (verkleinert), dazu
  `/aa/index.json` mit allen vorhandenen IDs. Fehlende Bilder stehen in `/aa/missing.json`.

> Ziel dieser Runde: Wer die Preview öffnet, sieht ein Spiel, das nach Anime Adventures aussieht und
> sich so anfühlt: Hunderte bekannte Figuren, ein Summon, das Spaß macht, und mehrere Welten.
