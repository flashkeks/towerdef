# run.md — Runde 7: M3-Start, aus dem Match wird ein Spiel (Sammeln, Gacha, Fortschritt)

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

Reihenfolge beim Einstieg: **`docs/design/ENTSCHEIDUNGEN.md`** (verbindlich), dann
**`docs/STATUS.md`**, dann diese Datei. Runde 6 liegt in
[`docs/archiv/run-runde6.md`](docs/archiv/run-runde6.md).

---

## 1. Lage und Ziel

Das Match steht: freie Platzierung, kein Typ-Limit, 8 Units, 20 Wellen, 2 Boss-Kits, Menü,
Team-Wahl, Grafik, Ton, Replays. Preview mit Runde 6 läuft seit 07.10.2026.

**Laut ENTSCHEIDUNGEN.md kommt jetzt M3 vor M2:** Sammeln, Gacha und Fortschritt, **zuerst lokal
im Browser**. Der Server (M2, Koop, Kek-Game-Konto) folgt danach. Der Speicherstand wandert
dann auf den Server.

**Ziel dieser Runde:** Wer das Spiel öffnet, landet in einer Lobby, zieht Units mit sichtbaren
Raten, levelt sie mit Erspieltem, stellt ein Team aus seiner Sammlung zusammen, spielt eine
Stage und bekommt Belohnungen. **Der Kreislauf schließt sich**, auch wenn die Zahlen noch roh sind.

**Balance bleibt grob** (ENTSCHEIDUNGEN.md § Schwierigkeit). Höchstens ca. 30 Minuten
Bot-Messungen je Paket. Die Meta-Zahlen (Raten, Preise, Kurven) sind Startwerte, kein Feinschliff.

---

## 2. Vorgaben für diese Runde (Homelab-Planer; Max hat Runde 7 freigegeben und kann einzelne Punkte noch kippen)

1. **Zwei Meta-Währungen, nicht drei:**
   - **Crystals** für Gacha, erspielbar und im Mock-Shop „kaufbar". Sie entsprechen den `shards`
     aus `architecture.md` § 7 (dort umbenennen bzw. vermerken).
   - **Gold** für Unit-Level, nur erspielbar.
   - Die Münzen im Match bleiben davon getrennt.
2. **Backend-Schnittstelle von Anfang an.** Der Client spricht nur mit einer Schnittstelle
   `Backend` (Profil laden, Ziehen, Leveln, Team speichern, Match-Ergebnis melden, Shop). In
   dieser Runde gibt es nur `LocalBackend` (IndexedDB, Fallback `localStorage`, alles mit
   try/catch). In M2 kommt `ServerBackend` mit denselben Methoden, **der Client ändert sich dann
   nicht**. Logik, die später auf den Server gehört (Gacha-Wurf, Pity, Belohnungen aus dem
   Replay), liegt in einem eigenen Modul `meta/`, das ohne DOM läuft und später auf dem Server
   wiederverwendet wird.
3. **Lokal heißt manipulierbar.** Das ist für die Testphase in Ordnung. Im Spiel steht dauerhaft
   klein „Test build, progress is stored in this browser only". Export und Import des
   Speicherstands als JSON (Backup, Gerätewechsel).
4. **Gacha nach `architecture.md` § 7.6:** Raten und Pity vor jedem Zug sichtbar, Pity-Zähler
   auf dem Knopf, Ziehungsverlauf, eine Datei je Banner als einzige Quelle für Anzeige **und**
   Wurf. Zufall per `crypto.getRandomValues`, **nicht** die Sim-PRNG. Test mit 1 Mio. Würfen gegen
   die angezeigte Rate.
5. **Mock-Shop:** Crystals-Pakete, Kauf über `MockPaymentProvider`, dauerhaft „Test purchase - no
   real money". Kein echter Anbieter, kein Preis in Euro.
6. **K4 Bindung, Tagesaufgaben und Infinite** kommen **nicht** in diese Runde (Runde 8).

---

## 3. Agenten und Token-Budget

- Subagenten **immer `model: "sonnet"`**, nie Opus. Mechanisches darf `"haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**, Rückmeldung höchstens 10 Zeilen.
- **P1 zuerst und allein** (Datenmodell, Backend-Schnittstelle, Speicherstand). Danach laufen
  P2–P6 parallel an getrennten Dateien. `sim/` ändert nur P2 und P6.
- Vor jedem Commit: Tests + Typecheck in `sim/` und `client/`, `npm run build`, ab P4 `npm run smoke`.

---

## 4. Abnahmeziele

| Ziel | Prüfung |
|---|---|
| Kreislauf geschlossen | Smoke (echte Mausklicks): neues Profil → Lobby → 10er-Zug → Unit leveln → Team aus Sammlung → Stage → Belohnung → zurück in der Lobby, Speicherstand nach Neuladen noch da |
| Gacha ehrlich | 1 Mio. Würfe je Banner: Häufigkeit je Stufe innerhalb Toleranz der Anzeige, harte Pity nie überschritten, Pity-Zähler überlebt Neuladen |
| Anzeige = Wirklichkeit | Anzeige und Wurf lesen nachweislich dieselbe Banner-Datei (Test) |
| Meta wirkt im Match | Unit-Level und Sterne ändern Werte im Simulator (`unitMods`), Replays tragen die Mods mit und bleiben bit-genau nachspielbar |
| Meta-Abstand | Neuling gegen „alles maximal" höchstens Faktor ca. 2,5 auf den Schaden (`rec §19` Nr. 16), grob per Bot gemessen |
| Erster Fortschritt schnell | Ein neues Profil hat nach der ersten gewonnenen Normal-Stage genug für mindestens einen 10er-Zug oder hat ihn als Starter-Geschenk schon bekommen |
| Unit-Pool | mindestens **14 Units** (8 alte + 6 neue), darunter eine zweite Boden-Flächen-Unit (löst die Blaster-Pflicht) |
| Speicherstand robust | Export → Profil löschen → Import ergibt denselben Stand. Kaputte oder alte Daten führen zu einer Meldung, nicht zum Absturz (Schema-Version, Migration) |
| Lizenz | weiterhin nur eigene oder geprüfte Assets |

---

## 5. Arbeitspakete

### P0 — Status (Hauptsitzung)
`docs/STATUS.md`: Runde-7-Tabelle; Runde 6 als abgeschlossen zusammenfassen.

### P1 — Datenmodell, Backend-Schnittstelle, Speicherstand (ein Agent, allein, zuerst)
- Profil-Schema angelehnt an `architecture.md` § 6.7 (lokal ohne `kekgame_sub`): Spieler-Level und
  -XP, Crystals, Gold, Sammlung (Unit, Level, XP, Sterne/Kopien), Team, Pity je Banner,
  Ziehungsverlauf, Stage-Fortschritt (Stufe, Erst-Clear), Einstellungen. **Schema-Version** +
  Migrationen.
- Ledger statt Zähler auch lokal: Buchungen (Grund, Betrag, Zeit), Salden sind Summe bzw. Cache.
- `meta/` (ohne DOM): reine Funktionen für Ziehen, Leveln, Sterne, Belohnungen. `client/` nutzt
  sie über `LocalBackend`.
- Export/Import (JSON, mit Prüfsumme gegen versehentliche Beschädigung, nicht als Schutz).

### P2 — Unit-Level und Sterne im Simulator (ein Agent, nach P1)
- Level 1–40 und Sterne 1–5 (aus Duplikaten) werden zu `unitMods` (`lvlBp` gibt es schon).
  Kurven als Daten (`sim/data/progression.json`), nicht im Code.
- Bots bekommen Meta-Profile: `fresh` (alles Level 1), `mid`, `max`. Grob messen:
  Normal mit `fresh` schaffbar? Faktor `max`/`fresh` ≤ ca. 2,5?
- Replay-Format v3: Mods je Unit im Kopf, `npm run replay` rechnet sie mit.
- Stufen-Freischaltung nach Spieler-Level (`gdd` § 4: Hard ab 5, Nightmare ab 25; Startwerte,
  dürfen grob angepasst werden).

### P3 — Gacha und Mock-Shop (ein Agent, nach P1)
- Banner-Dateien: **Standard** (dauerhaft) und **Starter** (einmalig günstiger, garantiert eine
  Epic+). Featured-Banner nur als Datenformat vorbereiten.
- Raten-/Pity-Startwerte nach `recommendations.md` § 13 bzw. `architecture.md` § 7.6, klar als
  Startwerte markiert.
- Duplikate → Sterne (Kopien), kein Extra-Material.
- Mock-Shop: drei Crystals-Pakete, `MockPaymentProvider` nach § 7.2, Idempotenz auch lokal.
- Tests: 1-Mio.-Würfe, Pity-Grenzen, Idempotenz (Doppelklick zieht nicht doppelt).

### P4 — Lobby und Meta-UI (ein Agent, nach P1)
- **Lobby** als Startbildschirm: Play, Summon, Units, Team, Shop, Settings. Kontostände oben.
- **Summon:** Banner-Auswahl, Ratentabelle (immer sichtbar oder ein Klick entfernt, nie versteckt),
  Pity-Zähler, 1er/10er-Zug, Enthüllungs-Animation je Seltenheit (kurz, überspringbar), Verlauf.
- **Units:** Sammlung als Raster mit Seltenheits-Rahmen, Filter, Detailansicht mit Werten,
  Level-Up (Gold), Sternen, Rolle und Symbolen aus Runde 6.
- **Team:** 6 aus der Sammlung, ersetzt die feste Auswahl 6 aus 8.
- **Stage-Auswahl:** Terrassenweg mit Stufen, gesperrte Stufen mit Grund („Player level 5").
- **Ergebnis-Bildschirm** um Belohnungen erweitern (Crystals, Gold, XP, Level-Up-Anzeige).
- Smoke-Test für den ganzen Kreislauf (Abnahmeziele).

### P5 — Belohnungen und Fortschritt (ein Agent, nach P1, parallel zu P3/P4)
- Belohnung aus dem **Replay** berechnen (Stufe, Ergebnis, erreichte Welle, Erst-Clear-Bonus),
  nicht aus Client-Angaben. So bleibt die Logik serverfähig.
- Startwerte aus `gdd` § 4 (Crystals 100/150/200 je Erst-Clear) als Ausgang. Ziel grob: erstes
  Mythic nach 2–4 Wochen aktivem Spiel. Kleine Rechnung in `docs/balancing/meta.md`
  (Zuflüsse/Tag, Pity, Erwartungswert), kein Feinschliff.
- Starter-Geschenk für neue Profile (z. B. Crystals für einen 10er-Zug plus die 4 Rare-Units).
- Niederlage gibt etwas (Gold, XP), damit Verlieren nicht leer ausgeht.

### P6 — Sechs neue Units (ein Agent, nach P1, Recherche in `docs/` erlaubt)
- Entwurf im Stil von `gdd` § 6 (Name, Seltenheit, Platzierung, Rolle, Fähigkeit, Kurztext),
  Werte in `sim/data/units.json`.
- Pflicht: **eine zweite Boden-Flächen-Unit** (Blaster-Pflicht auflösen), **ein Heiler oder
  Schild-Support** (`rec §2`), **eine zweite Farm-Variante oder Ökonomie-Unit** mit anderem Profil
  als `farm`. Der Rest frei, gern mit eigenem Kniff passend zu K5 (Boss-Fenster).
- Seltenheiten verteilt: mindestens 1 Rare, 2 Epic, 2 Legendary, 1 Mythic.
- Sprites im bestehenden Stil (wie Runde 5, selbst erzeugt), Silhouetten unterscheidbar.
- Grober Check: Keine neue Unit ist allein Pflicht oder nutzlos (Leave-one-out grob, 30-min-Regel).

### P7 — Abschluss (Hauptsitzung)
Alle Abnahmeziele messen, Screenshots (Lobby, Summon mit Raten, Sammlung, Team, Ergebnis mit
Belohnung), `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 7
Pakete erledigt / offen:
Abnahmeziele: je Ziel erreicht / verfehlt (Wert):
Währungen und Startwerte (Raten, Pity, Preise, Belohnungen):
Neue Units (Name, Rolle, Seltenheit):
Meta-Abstand fresh/max:
Erster Fortschritt (wie viele Züge nach Stage 1):
Was die Menschen als Nächstes testen sollen (max. 5 Punkte):
Vorschlag Runde 8 (K4 Bindung, Tagesaufgaben, ggf. zweite Map): 3–5 Sätze
Agenten (Anzahl, Modell):
Commits:
```

---

## 6. Was du nicht tust

- **Nichts deployen.** Die Preview baut die Homelab-Seite aus `dev`, auf Ansage von Max.
- Kein Server, kein Konto, kein echter Zahlungsanbieter, keine Euro-Preise.
- Keine Login-Streaks, kein Countdown-Druck, keine versteckten Raten, keine Währungsketten.
- Keine Assets ohne geprüfte Lizenz. `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen
  kommen in STATUS unter „Offene Fragen", mit Empfehlung.

---

## 7. Ende einer Sitzung

Vor Kontextende: `docs/STATUS.md` aktualisieren, Tests laufen lassen, committen, pushen.

> Ziel dieser Runde: Man will nach einer Stage zurück in die Lobby, um zu ziehen, und nach dem
> Ziehen zurück in die Stage, um die neue Unit auszuprobieren.
