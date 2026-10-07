# run.md — Runde 8: Gründe zum Wiederkommen (Bindung, Aufgaben, Infinite, Challenges, Stufe 4)

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

Reihenfolge beim Einstieg: **`docs/design/ENTSCHEIDUNGEN.md`** (verbindlich), dann
**`docs/STATUS.md`**, dann diese Datei. Runde 7 liegt in
[`docs/archiv/run-runde7.md`](docs/archiv/run-runde7.md).

---

## 1. Lage und Ziel

Runde 7 hat den Kreislauf geschlossen: Lobby, Gacha mit sichtbaren Raten/Pity, Sammlung,
Level/Sterne, Team aus der Sammlung, Belohnung aus nachgerechneten Replays, 14 Units, lokaler
Speicherstand. Preview mit Runde 7 läuft seit 07.10.2026.

**Neue Entscheidung (Max, 07.10.2026), steht in ENTSCHEIDUNGEN.md § Schwierigkeit:** Mit
gelevelten Units werden Hard und Nightmare leicht. Das bleibt so: **keine Kopplung der
Gegner an das Team-Level.** Herausforderung für starke Teams kommt aus **Inhalt oben drauf**.

**Ziel dieser Runde:** Ein Spieler mit fertigem Team hat noch etwas vor. Ein Spieler mit
frischem Team weiß, was er als Nächstes anstreben kann. Und es gibt einen Grund, morgen wieder
reinzuschauen, **ohne** Druck (keine Streaks, keine Countdowns).

**Balance bleibt grob** (höchstens ca. 30 Minuten Bot-Messungen je Paket). **Bots ab jetzt mit
6er-Team** messen (`teamSlots`), wie ein Mensch. In Runde 7 waren sie unbeschränkt.

---

## 2. Agenten und Token-Budget

- Subagenten **immer `model: "sonnet"`**, nie Opus. Mechanisches darf `"haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**, Rückmeldung höchstens 10 Zeilen.
- **P1 zuerst und allein** (Team-Stärke als gemeinsame Kennzahl, Profil-Schema-Erweiterung).
  Danach P2–P5 parallel, an getrennten Dateien. Wer `sim/` ändert, steht in der Pakettabelle;
  nicht zwei Agenten gleichzeitig an `sim/src/`.
- Profil-Schema-Änderungen nur mit **Migration** (Schema-Version hoch, alte Stände laden weiter).
- Vor jedem Commit: Tests + Typecheck in `sim/` und `client/`, `npm run build`, `npm run smoke`.

---

## 3. Abnahmeziele

| Ziel | Prüfung |
|---|---|
| Team-Stärke sichtbar | eine Zahl je Unit und je Team (aus Level, Sternen, Seltenheit, Bindung), überall gleich berechnet (`meta/`), in Team-Auswahl und Stage-Auswahl sichtbar |
| Empfohlene Stärke | jede Stufe/Challenge zeigt „Recommended power"; grob kalibriert: mit empfohlener Stärke gewinnt der beste Bot (6er-Team) 60–90 % |
| Stufe 4 | neue Stufe über Nightmare, mit eigenen Regeln (nicht nur HP), für Teams mit `max`-Profil schaffbar, aber nicht sicher (Bot 30–60 %) |
| Infinite | spielbar, endet erst mit Niederlage, persönliche Bestwerte je Team gespeichert, Belohnung mit abnehmendem Ertrag (kein Endlos-Farmen von Crystals) |
| Challenges | mindestens 6 feste Challenges mit eigener Regel (z. B. „nur Boden-Units", „Flieger-Sturm", „kein Verkauf"), einmalige Belohnung je Challenge |
| K4 Bindung | jede Unit sammelt Bindungs-XP durch Einsätze; 5 Bindungsstufen, je Stufe Wahl aus 2 Perks; Perks wirken im Simulator; Umwählen kostet Gold |
| Tagesaufgaben | 3 Aufgaben je Tag, 1 × kostenlos neu würfeln, Belohnung Crystals; **kein Streak-Bonus, keine Strafe** für verpasste Tage, kein Countdown in der UI außer „new tasks tomorrow" |
| Mythic-Tempo | erstes Mythic im Mittel nach 14–28 Tagen (4 Siege/Tag + Aufgaben), Rechnung in `docs/balancing/meta.md` |
| Replays | Format v4 trägt Modus, Challenge, Perks; alte Replays werden erkannt, nicht falsch gewertet |
| Smoke | neuer Pfad: Lobby → Aufgabe ansehen → Challenge starten → Infinite starten → Perk wählen, mit echten Mausklicks |

---

## 4. Arbeitspakete

### P0 — Status (Hauptsitzung)
`docs/STATUS.md`: Runde-8-Tabelle; Runde 7 abgeschlossen zusammenfassen.

### P1 — Team-Stärke und Schema (ein Agent, allein, zuerst)
- `meta/power.ts`: Stärke je Unit und Team als **eine** Formel (Level, Sterne, Seltenheit, Bindung).
  Grob an der Bot-Siegquote ausgerichtet, nicht feinkalibriert.
- Profil-Schema v-next: Bindung je Unit (XP, Stufe, gewählte Perks), Aufgaben-Zustand, Infinite-
  Bestwerte, Challenge-Fortschritt. Migration von Runde-7-Ständen mit Test.
- Bots: Meta-Profile `fresh`/`mid`/`max` bekommen ihre Team-Stärke ausgewiesen; Messungen ab
  jetzt mit 6er-Team.

### P2 — Stufe 4, Challenges, empfohlene Stärke (ein Agent, nach P1, ändert `sim/data`)
- **Stufe 4** (Name englisch, passend zur Welt; Arbeitsname „Abyss"): neue Regeln, z. B. Elite in
  jeder Welle, zweite Boss-Phase, Element-Pflichtwellen. Freischaltung über Spieler-Level und
  Nightmare-Sieg.
- **Challenges** als Daten (`sim/data/challenges.json` gibt es als Konzept seit Runde 4):
  mindestens 6, je eine klare Regel, Empfehlung, einmalige Belohnung.
- „Recommended power" je Stufe und Challenge aus Bot-Messung (grob, 6er-Team).

### P3 — Infinite (ein Agent, nach P1, Client + `meta/`; `sim/` nur wenn nötig)
- Der Simulator kann Infinite seit Runde 3. Client-Modus, Anzeige der aktuellen Welle und des
  Bestwerts, Ergebnis-Bildschirm mit „New best!".
- Bestwert je Team-Zusammenstellung und gesamt, lokal. **Globale Rangliste kommt mit M2**
  (Server), nicht jetzt; Datenformat schon so, dass der Server es später prüfen kann (Replay).
- Belohnung: Gold und XP je Welle mit abnehmendem Ertrag, Crystals nur für neue Bestwerte
  (Meilensteine, einmalig).

### P4 — K4 Bindung (ein Agent, nach P1, ändert `sim/src` für Perk-Wirkungen)
- Bindungs-XP je Einsatz (Teilnahme, Schaden, Sieg), 5 Stufen, je Stufe Wahl aus 2 Perks.
  Perks als Daten (`sim/data/perks.json`), Wirkung über `unitMods` bzw. kleine, klar benannte
  Regel-Hooks. **Kein Zufall**, beide Optionen sichtbar.
- Je Unit ein kurzer Satz Charakter-Text pro Bindungsstufe (Englisch, Welt „Grenzgilde im
  Nebelriss", warmherzig). Kurz halten, Platzhalter-Qualität ist ok.
- Perk-Umwahl kostet Gold. Bindung zählt in die Team-Stärke (P1).
- Grob prüfen: Kein einzelner Perk ist Pflicht oder macht eine Unit allein übermächtig.

### P5 — Tagesaufgaben (ein Agent, nach P1, nur `meta/` + Client)
- Aufgaben-Pool als Daten (z. B. „Win a stage with Frost", „Clear wave 15 in Infinite", „Pull
  once"). 3 je Tag, deterministisch aus Datum + Profil-ID, 1 × gratis neu würfeln.
- Tageswechsel nach lokaler Mitternacht. Belohnung Crystals, Summe so, dass das Mythic-Tempo
  ins Ziel kommt (Abschnitt 3), Rechnung in `meta.md`.
- **Verboten:** Streak-Zähler, „Komm morgen wieder sonst ..."-Texte, Push-artige Hinweise,
  Countdown-Uhren.
- Lobby zeigt die Aufgaben dezent, mit Fortschritt.

### P6 — Abschluss (Hauptsitzung)
Alle Abnahmeziele messen, Screenshots (Team-Stärke, Stufe 4, Challenges, Infinite-Ergebnis,
Bindung mit Perk-Wahl, Aufgaben), `docs/STATUS.md` Kurzbericht:

```text
STATUS — Runde 8
Pakete erledigt / offen:
Abnahmeziele: je Ziel erreicht / verfehlt (Wert):
Team-Stärke-Formel (kurz):
Stufe 4: Regeln, empfohlene Stärke, Bot-Quote:
Challenges (Liste):
Perks (Anzahl, Beispiele):
Mythic-Tempo (alt → neu):
Was die Menschen als Nächstes testen sollen (max. 5 Punkte):
Vorschlag Runde 9 (Kandidaten: M2-Start mit Server/Konto, zweite Map, eigene Portraits): 3–5 Sätze
Agenten (Anzahl, Modell):
Commits:
```

---

## 5. Was du nicht tust

- **Nichts deployen.** Die Preview baut die Homelab-Seite aus `dev`, auf Ansage von Max.
- Kein Server, kein Konto, keine globale Rangliste, kein echter Zahlungsanbieter.
- Keine Streaks, keine Countdown-Banner, keine versteckten Raten, keine Währungsketten.
- Gegner **nicht** mit dem Team-Level skalieren (Entscheidung Max).
- Keine Assets ohne geprüfte Lizenz. `ENTSCHEIDUNGEN.md` nicht ändern; Fragen an die Menschen
  kommen in STATUS unter „Offene Fragen", mit Empfehlung.

---

## 6. Ende einer Sitzung

Vor Kontextende: `docs/STATUS.md` aktualisieren, Tests laufen lassen, committen, pushen.

> Ziel dieser Runde: Ein volles Team hat ein Ziel, ein frisches Team einen Weg dorthin, und
> morgen gibt es einen kleinen Grund, wieder reinzuschauen, ohne schlechtes Gewissen, wenn nicht.
