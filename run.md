# run.md — Runde 6: Freie Platzierung, kein Typ-Limit, ein Match, das sich gut anfühlt

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

Reihenfolge beim Einstieg: **`docs/design/ENTSCHEIDUNGEN.md`** (verbindlich, seit 07.10.2026
mit den Abschnitten „Platzierung", „Messlatte" und der neuen Meilenstein-Reihenfolge), dann
**`docs/STATUS.md`**, dann diese Datei. Runde 5 liegt in
[`docs/archiv/run-runde5.md`](docs/archiv/run-runde5.md).

---

## 1. Lage und Ziel

Runde 5 hat das Match komplett gemacht: Menü, Team-Wahl, Pixel-Grafik, Effekte, Ton, Replays.
Seit 07.10.2026 läuft der Stand auf der Preview (`duskwardens.flashkeks.com`).

**Erster echter Playtest (Max, Normal, verloren in Welle 18)**, Replay in
`docs/balancing/playtests/2026-10-07-max-normal-loss.json` (Hash im Simulator OK):
- Flieger-Leaks in W8 (4) und W16 (10): Luftabwehr fehlte, die Bedrohung war nicht lesbar.
- 5 × `cap-reached` beim Striker.
- Gestorben mit 1132 ungenutzten Münzen.
- Titan im Team, aber nie gekauft.
- Bot `wide` gewinnt Normal zu 92 %, ein Erstspieler verliert.

**Neue Entscheidungen von Max (07.10.2026), Details in ENTSCHEIDUNGEN.md:**
1. **Freie Platzierung statt fester Slots** (wie Anime Adventures).
2. **Kein Limit je Unit-Typ.** Gegenmittel in der Ökonomie suchen, nicht durch harte Limits.
3. **Messlatte für die Stufen ist die beste echte Strategie.** `farm` zählt, ist auf Hard
   dominant (86 % gegen `wide` 49 %) und muss abgeschwächt werden.
4. **Reihenfolge danach: erst M3 (Meta/Gacha, lokal im Browser), dann M2 (Koop/Server).**

**Neu ab dieser Runde: Balance nur noch grob (Max, 07.10.2026).** Mit M3 kommen Gacha, viele
Units, Level und Perks. Damit verschieben sich alle Zahlen sowieso. Feinkalibrieren auf
Prozentpunkte ist jetzt verschwendete Zeit. Der Simulator bleibt, aber als **Sicherheitsnetz**:
Er soll grobe Fehler finden (eine Strategie gewinnt immer, eine Unit ist Pflicht oder nutzlos,
eine Regel ist kaputt), nicht Kennlinien auf ±5 Punkte glätten. **Faustregel: höchstens ca.
30 Minuten Bot-Messungen je Paket.** Wenn ein Ziel danach knapp verfehlt ist: notieren, weiter.

Diese Runde ist die letzte am reinen Match, bevor M3 beginnt. Ziel: **Ein Mensch spielt Normal
beim ersten Mal knapp durch und will danach Hard probieren.**

---

## 2. Agenten und Token-Budget

- Subagenten **immer `model: "sonnet"`**, nie Opus. Rein Mechanisches darf `"haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**, Rückmeldung höchstens 10 Zeilen.
- **Engpass `sim/`:** P1 baut das Platzierungsmodell um und berührt Kern, Befehle, Bots und
  Tests. **P1 läuft allein**, bis der Simulator mit freier Platzierung grün ist. Erst danach
  P2 (Balance), P3 (Client) und P4 (Lesbarkeit) parallel, an getrennten Dateien.
- Jede Änderung an `sim/data/` mit alt → neu → Grund in `docs/balancing/kalibrierung.md`,
  Abschnitt „Runde 6".
- Vor jedem Commit: `npm test` + `npm run typecheck` in `sim/`, `npm test` + `tsc` +
  `npm run build` in `client/`, ab P3 auch `npm run smoke`.
- **Replays brechen bei Regeländerungen.** Alte Replays (Format v1, Slot-IDs) bleiben als
  Dokument liegen. Das Replay-Format bekommt eine neue Version, `npm run replay` erkennt v1 und
  meldet „altes Regelwerk" statt Hash-Fehler.

---

## 3. Abnahmeziele

| Ziel | Prüfung |
|---|---|
| Freie Platzierung | Units lassen sich überall neben dem Pfad setzen, wo Platz ist. Nicht auf dem Pfad, nicht überlappend, nicht außerhalb der Karte. Hügel-/Boden-Zonen sind Flächen |
| Kein Typ-Limit | kein `cap-reached` mehr, Test mit 15 gleichen Units |
| Keine dominante Strategie (grob) | beste echte Strategie (inkl. `farm`) und `wide` liegen auf Hard höchstens ca. 20 Punkte auseinander |
| Stufen grob im Ziel | beste echte Strategie: Normal ≥ 80, Hard 35–70, Nightmare 10–40 %. `wide` mitberichten |
| Spam lohnt nicht allein | Bot „nur eine Unit-Sorte" schafft Normal höchstens zu ca. 60 % |
| Keine Pflicht-Unit (grob) | Verbot keiner Unit kostet mehr als ca. 30 Punkte |
| ~~Hard-Kennlinie~~ | **gestrichen** für diese Runde, kommt nach M3 wieder |
| Lesbarkeit Flieger | Welle mit Fliegern kündigt sich in der Vorschau unübersehbar an; fehlt im Feld Luftabwehr, warnt das Spiel **vor** dem Wellenstart |
| Geld wird ausgegeben | Hinweis, wenn der Spieler bei laufender Welle viele Münzen hortet und Leben verliert |
| Smoke | eine Partie mit echten Mausklicks auf freie Positionen, drei Auflösungen, bis Spielende |

---

## 4. Arbeitspakete

### P0 — Status (Hauptsitzung)
`docs/STATUS.md`: Runde-6-Tabelle, Runde 5 als abgeschlossen zusammenfassen.

### P1 — Freie Platzierung im Simulator (ein Agent, allein, zuerst)
- `place` nimmt eine Position (Festkomma `x`, `y`) statt einer Slot-ID.
- Map-Daten: Pfad als Polyline mit Breite (gibt es schon), dazu **Zonen** als Polygone oder
  Kachelmasken: `ground`, `hill`, `blocked` (Bäume, Deko, Kartenrand). Aus den bisherigen
  Slots die Zonen sinnvoll ableiten, Hügel bleiben die erhöhten Bereiche.
- Kollision: Unit-Radius je Unit (`footprint` → Radius), Mindestabstand zum Pfadrand, keine
  Überlappung mit anderen Units. Alles in Festkomma, deterministisch.
- Fehlergründe sprechend: `on-path`, `blocked`, `overlap`, `wrong-zone`, `out-of-bounds`.
- **`def.cap` entfernen** (Daten und Code). `teamSlots` (6 Sorten je Match) bleibt.
  `teamUnits` (60) bleibt vorerst als technische Obergrenze, wird aber gemessen: Erreicht ein
  Bot sie je, Frage an die Menschen.
- Reichweite, Zielwahl, Abdeckung (`coverageByRange`) auf freie Positionen umstellen.
  Abdeckung je Position vorberechnen bzw. cachen, die Sim muss schnell bleiben (Ziel: Matrix
  mit allen Bots nicht mehr als doppelt so langsam wie heute).
- **Bots:** Positionssuche statt Slot-Wahl. Kandidatenraster, z. B. alle halbe Kachel,
  bewertet nach Pfadabdeckung je Reichweite. Mit Fehlermodell (`worseSlotBp` wird „schlechtere
  Position").
- Replay-Format v2 (Abschnitt 2).
- Ergebnis: alle Tests grün, Determinismus-Test grün, Bot-Matrix läuft.

### P2 — Balance auf dem neuen Modell (ein Agent, nach P1)
- Neue Bots: `mono-X` (nur eine Sorte, so viele wie bezahlbar) für jede DPS-Unit.
- **Farm abschwächen**, bis `farm` und `wide` ≤ 15 Punkte auseinander liegen. Hebel in dieser
  Reihenfolge prüfen: Ertragskurve der hohen Stufen, Verkaufswert Farm, steigende Kosten je
  weiterer Farm. Kein hartes Farm-Limit (Entscheidung Platzierung).
- **Spam ohne Limit:** wenn `mono-X` zu stark ist, steigende Platzierkosten je weiterer gleicher
  Unit (z. B. +10 % je Exemplar) prüfen. Wert und Kurve begründen.
- Stufen grob auf die beste echte Strategie stellen (Korridore Abschnitt 3). Kein Feinschliff,
  keine Kennlinie. Zeitbudget beachten (Abschnitt 1).
- **Normal für Menschen:** Max' Replay im Simulator analysieren (`--compare` mit `wide`).
  Wo weicht der Mensch ab, was hätte geholfen? Ergebnis als kurze Liste in `kalibrierung.md`
  und als Eingabe für P4.

### P3 — Client: freie Platzierung (ein Agent, nach P1, parallel zu P2)
- Unit gewählt → Geist-Sprite folgt der Maus, **grün** wo erlaubt, **rot** mit Grund wo nicht
  (Pfad, Überlappung, falsche Zone). Reichweitenkreis immer sichtbar.
- Hügel- und Boden-Zonen beim Platzieren hervorheben; der Rest der Karte dimmt leicht.
- Die Slot-Platten aus Runde 5 (lagen doppelt über der Kartengrafik) entfallen.
- Shift + Klick: dieselbe Unit nochmal setzen, ohne neu zu wählen.
- Smoke auf freie Positionen umbauen (Abnahmeziele).

### P4 — Lesbarkeit und Hilfe im Match (ein Agent, nach P1, parallel zu P2/P3)
- **Flieger:** eigenes Symbol in der Wellenvorschau, Hinweis „Flyers incoming, X of your units
  can hit air" vor dem Wellenstart. Wenn 0: deutliche Warnung.
- **Unit-Infos:** im Shop je Unit Symbole „trifft Luft", „Fläche", „Boss", „Support", „Geld".
- **Münzen:** dezenter Hinweis, wenn bei Leaks mehr als ca. 1,5 × der günstigsten Unit auf dem
  Konto liegen („You have coins to spend").
- **Titan/Boss-Hinweis:** Vorschau auf Welle 10/20 zeigt „Boss" mit Kurzinfo, was gegen ihn hilft.
- Nach einer Niederlage: drei kurze Tipps aus den Replay-Daten der Runde (z. B. „10 flyers
  leaked in wave 16: try Gunner, Lancer or Blaster"). Regelbasiert, kein Zufallstext.

### P5 — Grafik-Austausch (optional, ein Agent, Recherche erlaubt)
Wenn die Homelab-Seite die Kenney-Packs ins Repo gelegt hat (`assets/vendor/`, siehe STATUS):
Tiles und Effekte gegen die Packs tauschen, wo sie besser aussehen. Lizenz in
`ATTRIBUTIONS.md`. Sonst überspringen.

### P6 — Abschluss (Hauptsitzung)
Alle Abnahmeziele messen, Screenshots erneuern, `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 6
Pakete erledigt / offen:
Abnahmeziele: je Ziel erreicht / verfehlt (Wert):
Platzierungsmodell: Zonen, Radien, Fehlergründe:
Balance (alt → neu): Farm, Spam-Gegenmittel, Stufen (beste Strategie / wide):
Analyse Max-Replay: was hätte geholfen:
Performance Bot-Matrix (alt → neu):
Was die Menschen als Nächstes testen sollen (max. 5 Punkte):
Vorschlag für Runde 7 (M3-Start): 3–5 Sätze:
Agenten (Anzahl, Modell):
Commits:
```

---

## 5. Was du nicht tust

- **Nichts deployen.** Die Preview baut die Homelab-Seite aus `dev`, auf Ansage von Max.
- Noch kein Gacha, kein Inventar, kein Speicherstand: Das ist M3, Runde 7.
- Keine Assets ohne geprüfte Lizenz. `docs/design/ENTSCHEIDUNGEN.md` nicht ändern; Fragen an
  die Menschen gehören in STATUS unter „Offene Fragen", mit Empfehlung.

---

## 6. Ende einer Sitzung

Vor Kontextende: `docs/STATUS.md` aktualisieren, Tests laufen lassen, committen, pushen.

> Ziel dieser Runde: Ein Erstspieler schafft Normal knapp und will Hard probieren, und keine
> einzelne Strategie (Farmen, Spam, eine Pflicht-Unit) macht das Spiel trivial.
