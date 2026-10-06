# run.md — Runde 4: Balance reparieren, Spielregeln festziehen, M1 vorbereiten

Du arbeitest in diesem Repository auf dem Branch `dev`. Commit und Push nach jedem
Paket. Pull Requests nach `main` nur, wenn der Mensch es sagt.

**Neu und verbindlich: `docs/design/ENTSCHEIDUNGEN.md`.** Die Menschen haben die Fragen
beantwortet. Lies die Datei **vor** allem anderen. Wo `gdd.md`, `recommendations.md` oder
ältere Dateien etwas anderes sagen, gilt ENTSCHEIDUNGEN.md.

Danach liest jede Sitzung **zuerst `docs/STATUS.md`** und macht beim „Nächsten Schritt"
weiter.

---

## 1. Ziel dieser Runde

Runde 3 hat gezeigt, dass der Simulator funktioniert. Er hat echte Probleme gefunden:
eine dominante Strategie (Titan + Lancer + Frost), eine Fallen-Unit (Striker), unbrauchbare
Rollen (AoE-Build 0 %, Frost/Banner/Lancer kaum gekauft), Schwierigkeitsstufen, die nur
3–7 % HP auseinanderliegen, und kaputte Koop-Skalierung (Upgrade-Bot 100 % auf
Nightmare 4P).

Diese Runde:
1. **repariert die Balance** auf Unit-Ebene,
2. baut die **beschlossenen Spielregeln** in den Simulator (Leben-System, Schwierigkeit
   über Regeln, Boss-Kits, Wellenvorschau/Risikokarten),
3. macht die Bots **menschlicher** (Fehlermodell), damit Siegquoten etwas über Menschen
   aussagen,
4. legt Architektur, Konto-Vertrag, Mock-Zahlung, Assets und Namen für M1 fest,
5. startet optional das Client-Gerüst.

---

## 2. Agenten und Token-Budget

- Subagenten **immer `model: "sonnet"`**, nie Opus. Rein Mechanisches darf `"haiku"` sein.
- Höchstens **4 Agenten gleichzeitig**, kurzer vollständiger Auftrag je Agent, Agenten
  schreiben in Dateien, Rückmeldung höchstens 10 Zeilen.
- **Achtung, gemeinsamer Engpass:** P1–P6 ändern alle `sim/`. Nicht mehrere Agenten
  gleichzeitig an denselben Dateien. Reihenfolge und Parallelität stehen in Abschnitt 4.
  P7–P9 (Doku/Recherche) laufen gefahrlos parallel zum Simulator.
- Jede Änderung an `sim/data/` mit alt → neu → Grund in `docs/balancing/kalibrierung.md`
  (neuer Abschnitt „Runde 4"). Alle Tests grün vor jedem Commit, außer bei einem klar
  markierten `wip`.

---

## 3. Abnahmeziele (gelten für P1–P6 zusammen)

Gemessen mit Bots **mit** Fehlermodell (P6), außer anders angegeben:

| Ziel | Wert |
|---|---|
| Keine dominante Kombi | kein Bot bzw. keine Unit-Kombi ≥ 95 % in allen Zellen gleichzeitig (3 Stufen × 1P/4P) |
| Keine Fallen-Unit | Leave-one-out: Verbot **einer** Unit hebt die Siegquote des besten Bots um höchstens +5 Punkte |
| Jede Rolle hat einen Grund | jede Unit wird von mindestens einem Bot in ≥ 30 % der Runs gekauft; Schaden je Münze aller DPS-Units liegt innerhalb Faktor 1,6 zueinander (Support/Farm ausgenommen) |
| AoE spielbar | AoE-orientierter Bot ≥ 50 % auf Normal solo |
| Stufen klar getrennt | Siegquote bester Bot, solo: Normal 85–95 %, Hard 45–65 %, Nightmare 15–35 %, **und** die Stufen unterscheiden sich durch Regeln (P3), nicht nur durch HP |
| Breitere Kennlinie | Fenster 90 % → 10 % Siegquote ≥ 25 Prozentpunkte HP-Faktor (vorher ~14) |
| Koop fair | je Stufe Siegquote 1P/2P/4P innerhalb ±10 Punkte, für **jeden** Bot (auch Upgrade) |
| Stage-Dauer | Story Normal **11–13 min** (geändert von 13–17 durch Max, 06.10.2026; Wellen-Autostart bei leerem Feld bleibt) |

Was davon nicht erreichbar ist: ehrlich begründen. Nicht durch Datenbiegen erzwingen.

---

## 4. Arbeitspakete

### P0 — Status (Hauptsitzung)
- `run.md` Runde 3 → `docs/archiv/run-runde3.md`. Diese Datei wird `run.md`.
- `docs/design/ENTSCHEIDUNGEN.md` liegt bei. In `gdd.md` jede `ENTSCHEIDUNG OFFEN` auf
  den beschlossenen Stand bringen und auf ENTSCHEIDUNGEN.md verweisen. Verworfenes
  (K3 Weichen, Mobile) als „verworfen" markieren statt löschen.
- `docs/STATUS.md` für Runde 4 anlegen.

### P1 — Unit-Rebalance (ein Agent, zuerst)
- Titan: Schaden je Münze in den Korridor holen. Er bleibt Boss-Killer, aber nicht mehr
  Universalantwort.
- Striker: von der Falle zur sinnvollen Early-Unit machen (billig, früh effizient, fällt
  später zurück).
- AoE (Blaster/Lancer/Frost): so anpassen, dass ein AoE-Kern mit 1–2 Einzelziel-Units
  trägt.
- Frost, Banner, Lancer bekommen eine klare Nische, die ein Bot auch kauft.
- Werkzeuge: die vorhandenen `sim/scripts/sanity/*` (q1, q1b, q2) nach jeder Änderung.
- Ergebnis: Tabelle vorher/nachher je Unit (Kosten, DPS, Schaden je Münze, Kaufquote,
  Leave-one-out).

### P2 — Leben-System und Fail-State (nach P1, ersetzt Base-HP)
Nach ENTSCHEIDUNGEN.md:
- **Boss-Leak = sofort verloren.** Elite: vorschlagen und begründen (sofort verloren
  oder viele Leben).
- Normale Gegner kosten Leben nach Typ und **Rest-HP-Anteil** (z. B. `ceil(Basis ×
  RestHP/MaxHP)`, mindestens 1). Ein fast toter Gegner kostet wenig.
- Startleben, Ausbau über Meta (Datenfeld, Meta kommt mit M3), optionale Regeneration
  pro Welle. Zahlen über den Simulator festlegen.
- **Kurz-Recherche erlaubt:** Wie funktionieren Leben in Anime Vanguards genau
  (`docs/games/anime-vanguards/` zuerst, Netz nur ergänzend, Stopp-Regel 3 Versuche)?
- Tests anpassen bzw. neu schreiben.

### P3 — Schwierigkeit über Regeln (nach P2)
- `difficulties.json` erweitern: je Stufe Modifier-Dichte, Elemente an/aus,
  Boss-Fähigkeiten-Set, Wellen-Varianten, Belohnungsfaktor. HP-Faktor nur noch klein.
- Modus-Idee aus dem Pitch abbilden: **entspannt** (Story Normal) gegen **fordernd**
  (Hard, Nightmare, später Challenges).
- Abnahme: Ziele „Stufen klar getrennt" und „Breitere Kennlinie" aus Abschnitt 3.

### P4 — Boss-Kits und Wellenvorschau (parallel zu P3 möglich, andere Dateien)
- **K5:** Boss-Phasen-System in der Sim (HP-Schwellen → Phase), Telegraph-Ereignisse
  (Vorwarnzeit in Ticks), Schwachstellen-Fenster (erhöhter Schaden oder CC möglich),
  Schildphasen, Beschwörungen. **Zwei Bosse** für die MVP-Stage (Wave 10 und Wave 20),
  der Final-Boss zitiert die Mechaniken der Stage. Bots müssen Fenster nutzen können
  (Fähigkeiten im Fenster zünden).
- **K1:** Wellenvorschau als Daten-API (`previewWave(n)`: Gegnertypen, Anzahl,
  Modifier). **Risikokarten:** vor einer Welle wählbar, z. B. „+30 % HP, +50 % Bounty".
  Katalog mit 6–10 Karten, Effekt in der Sim, Bot-Strategie „nimmt Karten, wenn stark".
- Tests: Phasenwechsel deterministisch, Telegraph-Timing, Kartenwirkung.

### P5 — Koop-Skalierung (nach P3)
Upgrade-Bot 4P darf nicht mehr alles gewinnen. Hebel prüfen und messen: getrennte
HP-Skalierung je Spielerzahl, Slot-Zahl je Spieler, Upgrade-Kosten im Koop, gemeinsamer
gegen getrennten Cap. Den einfachsten Hebel nehmen, der „Koop fair" erreicht.

### P6 — Fehlermodell der Bots und Endkalibrierung (zuletzt im Sim-Strang)
- Bot-Parameter: Reaktionsverzögerung bei Käufen, Wahrscheinlichkeit für einen
  schlechteren Slot, vergessene Upgrades, verspätete Fähigkeiten, kein Wellenwissen.
  Drei Profile: **casual**, **normal**, **expert**.
- Alle Messungen aus Abschnitt 3 mit den Profilen wiederholen. Ergebnis in
  `docs/balancing/report.md` (neuer Abschnitt „Runde 4") mit vorher/nachher.

### P7 — Architektur für M1 (parallel zum Sim-Strang, eigener Agent)
`docs/architecture.md`:
- **Repo-Aufbau:** `sim/` (vorhanden), `client/` (PixiJS v8, Vite, TypeScript), später
  `server/` (Node, autoritativ, für M2). Gemeinsame Typen und Daten aus `sim/`.
- **Desktop-Sperre:** Touch-Geräte bzw. kleine Viewports bekommen einen Hinweis-Bildschirm
  („Desktop only"), kein Spiel.
- **Englisch:** alle UI-Texte zentral in einer String-Datei, damit später übersetzbar.
- **Konto-Vertrag mit Kek-Game.** Das TD speichert keine Passwörter:
  - Kek-Game öffnet `https://TD-DOMAIN/auth/launch?token=JWT` in einem neuen Tab.
  - Das Token ist **asymmetrisch signiert (EdDSA/Ed25519)**, kurzlebig (≤ 60 s),
    einmal verwendbar (`jti`). Claims: `sub` (Kek-Game-User-ID), `name`
    (Anzeigename), `iat`, `exp`, `aud` = TD-Domain, `iss` = Kek-Game.
  - Der TD-Server prüft das Token mit dem **öffentlichen** Schlüssel von Kek-Game, legt
    ein TD-Profil zur `sub` an bzw. lädt es und setzt eine eigene Session
    (HttpOnly-Cookie).
  - Für die Entwicklung: ein Dev-Skript, das ein Testschlüsselpaar erzeugt und Tokens
    ausstellt, und ein Dev-Login ohne Kek-Game. Beides **nur** im Dev-Modus.
  - Kopplung von Coins und Leaderboards: **nicht bauen**, aber das Profil-Schema so
    halten, dass es später geht (Abschnitt „Erweiterungspunkte").
  - Die Kek-Game-Seite (Button, Token ausstellen) wird **nicht** in diesem Repo gebaut.
    Beschreibe nur genau, was sie tun muss.
- **Zahlung (Mock):** `PaymentProvider`-Schnittstelle (`createCheckout`, `confirm`,
  `refund`, Webhook-Ereignis) plus `MockPaymentProvider`, der sofort bestätigt.
  Premium-Währung und Kauf-Flow sind komplett durchspielbar. Gacha-Seite zeigt **Raten und
  Pity-Zähler** sichtbar (Pflicht laut `legal-gacha.md`, auch ohne Echtgeld sinnvoll).
  Alle Zahlungs- und Gacha-Mutationen serverseitig, transaktional, mit
  Idempotenzschlüssel.
- **Betrieb:** Das Spiel läuft später als Container auf `edge` hinter einem
  Cloudflare-Tunnel. Liefere ein `Dockerfile` bzw. `docker-compose.yml`-**Entwurf** mit
  Port auf `127.0.0.1`, Konfiguration nur über Umgebungsvariablen, keine Secrets im Repo.
  Deployment, Domain und Tunnel machen die Menschen.

### P8 — Assets und Styleguide (parallel, eigener Agent, Recherche erlaubt)
- `docs/design/art-styleguide.md` für **Pixel-Anime**: Sprite-Größe im Spiel (z. B.
  32×32 oder 48×48), Animationsframes je Aktion, Palette, Portrait-Format im Menü,
  Lesbarkeit von Gegner-Archetypen auf einen Blick, Boss-Telegraphs als Effekt.
- `docs/design/asset-sources.md`: **konkrete** Packs, die zum Stil passen (Tiles, Effekte,
  UI, Gegner, Sounds, Musik), je Link, Lizenz, kommerziell ja/nein, Namensnennung
  ja/nein, Preis, Eignung.
  - **Nur CC0, CC-BY oder Kauflizenz mit kommerzieller Nutzung.**
  - Keine NC/ND/SA-Lizenzen, keine Rips aus anderen Spielen, keine Fan-Art, keine
    ungeprüften KI-Assets.
- Was fehlt (vor allem die 8 Figuren), als Zeichenliste für die Menschen: je Figur Größe,
  Frames und Posen.
- CC0/CC-BY-Platzhalter dürfen ins Repo (`client/assets/`), **mit** Eintrag in
  `client/assets/ATTRIBUTIONS.md`.

### P9 — Name (parallel, Recherche erlaubt, kurz)
- 6–8 englische Namensvorschläge, die zu „Grenzgilde im Nebelriss" passen. Arbeitsname
  „Riftwatch" mitprüfen.
- Je Name ein Konflikt-Check: Steam, itch.io, Roblox, App-Stores, Google-Treffer,
  EUIPO/USPTO-Markensuche (soweit ohne Login abrufbar), `.com`/`.gg`-Domain belegt?
- `docs/design/name.md`: Tabelle mit Ergebnis und Empfehlung. **Entscheiden die Menschen.**

### P10 — Client-Gerüst (optional, erst wenn P1–P6 abgenommen sind)
- `client/` mit Vite + PixiJS v8 + TypeScript.
- Der Client ruft **nur** die Befehls-Schnittstelle von `sim/` auf und rendert dessen
  Zustand. Keine Spielregeln im Client.
- Terrassenweg-Map mit einfachen Formen bzw. CC0-Platzhaltern, Platzieren, Upgraden,
  Verkaufen, Wellenstart, Wellenvorschau, Lebensanzeige, Geschwindigkeit 1×/2×/3×.
  Desktop-Sperre aktiv.
- Keine Grafik-Politur, keine Menüs außer dem Nötigsten. Ziel: Die Stage ist von Hand
  spielbar.

### P11 — Abschluss
`docs/STATUS.md` aktualisieren. Kurzbericht:

```text
STATUS — Runde 4
Pakete erledigt / offen:
Abnahmeziele (Abschnitt 3): je Ziel erreicht / verfehlt (Wert):
Wichtigste Balance-Änderungen (alt → neu):
Leben-System: Startwerte, Boss-/Elite-Regel:
Schwierigkeit: was unterscheidet Normal/Hard/Nightmare jetzt:
Architektur/Konto-Vertrag/Mock-Zahlung: fertig?
Assets: Anzahl geprüfter Packs, Lücken für Eigenzeichnung:
Namensvorschläge: Top 3:
Client-Gerüst: spielbar ja/nein:
Agenten (Anzahl, Modell):
Commits:
Nächster Schritt:
```

---

## 5. Ende einer Sitzung

Bevor der Kontext knapp wird oder die Sitzung endet: `docs/STATUS.md` aktualisieren
(erledigt, angefangen, laufende Agenten, nächster konkreter Schritt), Tests laufen lassen,
committen und pushen.

> Ziel dieser Runde: ein Spielregelwerk, das **nachweislich fair und abwechslungsreich**
> ist, und alles, was M1 braucht, um ohne weitere Grundsatzfragen gebaut zu werden.
