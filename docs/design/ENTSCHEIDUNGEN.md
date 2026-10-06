# Entscheidungen (Stand 06.10.2026, Max + Plori)

Verbindlich für alle weiteren Runden. Die beantwortete Fragenliste liegt in
`docs/design/FRAGEN.md`. Hier steht die Auslegung, nach der gearbeitet wird.
Änderungen nur durch die Menschen.

## Fest

| Thema | Entscheidung |
|---|---|
| MVP-Map | „Terrassenweg" (S-Kurve, eine Spur) |
| Flyer | folgen dem normalen Pfad, nur Hill/Hybrid-Units treffen sie |
| Engine | PixiJS v8 (Rückfall Phaser), Simulation strikt getrennt (`sim/`) |
| Reihenfolge | M1 Solo-Prototyp → M2 Koop → M3 Sammeln/Gacha/Meta → M4 Inhalte |
| Welt | **Grenzgilde im Nebelriss**: Fantasy-Abenteuer, warmherzig, eine Gilde hält die Linie gegen Schattenwesen |
| Plattform | **nur Desktop-Browser.** Handy und Touch werden aktiv gesperrt (freundlicher Hinweis-Bildschirm), keine Mobile-Optimierung |
| Sprache | **Englisch** (UI, Texte, Namen). Doku im Repo bleibt Deutsch |
| Hosting | auf `edge` (Netcup) hinter dem vorhandenen Cloudflare-Tunnel, **eigene Domain**. Den Betrieb machen die Menschen bzw. die Homelab-Seite |
| Grafikstil | **Pixel-Anime**: kleine Sprites im Spiel, große Portraits im Menü. Flat-Chibi bleibt als spätere Option denkbar |
| Team | ca. 120 Std./Woche gesamt, **kein Zeitdruck**. Qualität vor Tempo |

## Pitch: Sammeln **und** Entscheidungstiefe

- Kern: **„The team you collect" + „Every coin is a bet"** (Pitch A + C).
- **Solo voll spielbar.** Koop ist ein Plus, keine Pflicht.
- **Zwei Gesichter:** entspannte Modi (Story Normal: wenig Druck, Sammeln, Fortschritt)
  **und** wirklich anspruchsvolle Modi (Hard/Nightmare, Challenges, Risikokarten) für
  Leute, die optimieren wollen.
- Gacha ist gewollt und darf ein vollwertiges Gacha sein. Aber **fair und transparent**:
  Raten und Pity sichtbar, keine verschleierten Währungsketten. Pitch D gilt als Haltung,
  nicht als Schlagzeile.

## Kniff

- **K5 Bosse als Rätsel** (Phasen, Telegraph, Schwachstellen-Fenster) und **K1
  Wellenvorschau + Risikokarten** → schon im Prototyp (M1).
- **K2 Koop-Kombos** → mit M2.
- **K4 Bindung statt Würfeln** (wählbare Perks durch Einsätze) → mit M3. Gacha bleibt
  daneben bestehen.
- **K3 Weichen im Pfad: nein.**

## Schwierigkeit und Fail-State

- Stufen unterscheiden sich **über Regeln**: Modifier-Dichte, Elemente, Boss-Fähigkeiten,
  andere Wellen. HP-Faktoren nur als Feinjustierung.
- **Leben statt Base-HP-Klippe** (Vorbild: Anime Vanguards):
  - **Kommt ein Boss durch, ist die Runde verloren.**
  - Normale Gegner kosten Leben, abhängig von Rest-HP bzw. Typ. Ein angeschlagener
    Kleingegner, der durchrutscht, ist **überlebbar**.
  - Leben sind über Upgrades bzw. Meta **ausbaubar**. Optional regenerieren sie pro Welle
    etwas.

## Konto

- **Dasselbe Konto wie Kek-Game** (`game.flashkeks.com`). Auf der Kek-Game-Startseite gibt
  es einen Button. Er öffnet das TD in einem **neuen Tab auf eigener Domain**, und das Spiel
  läuft dort komplett eigenständig.
- **Geteilt wird zunächst nur das Konto.** Ob Coins oder Leaderboards gekoppelt werden,
  wird später entschieden. Bis dahin keine Kopplung einbauen, nur nicht verbauen.
- Das TD speichert **keine Passwörter**. Die Anmeldung kommt per signiertem Start-Token von
  Kek-Game (Vertrag in `run.md`, Paket P7). Die Kek-Game-Seite bauen die Menschen bzw. die
  Homelab-Seite.

## Echtgeld

- Architektur für **Premium-Währung + Gacha** wird gebaut, **ohne echten Zahlungsdienst**:
  Zahlungs-Schnittstelle mit Mock-Anbieter, Shop-Flow komplett durchspielbar.
- Wie und ob echtes Geld kommt, entscheiden die Menschen später. Vorher steht eine
  rechtliche Prüfung (siehe `docs/research/legal-gacha.md`).

## Grafik-Herkunft

- **Nur Assets mit sauberer Lizenz:** CC0, CC-BY (mit Namensnennung in `ATTRIBUTIONS`),
  gekaufte Packs mit kommerzieller Lizenz, oder selbst gezeichnet.
- **Nichts „ausleihen"**, was keine solche Lizenz hat. Auch keine Sprites aus anderen
  Spielen und keine Fan-Art. Das wäre ein echtes Risiko für das ganze Projekt, sobald es
  öffentlich ist.
- Erst passende freie Packs suchen. Was fehlt, wird selbst gezeichnet. Dafür gibt es einen
  Styleguide (Paket P8).

## Name

**„Duskwardens"** (Entscheidung Max, 06.10.2026). Ersetzt den Arbeitsnamen „Riftwatch" überall.
Englisch, gehört zur Kek-Game-Welt, folgt nicht deren Namensschema.

- **Domain zum Start:** `duskwardens.flashkeks.com`, später über den `edge`-Tunnel.
  **Noch nicht angelegt, nichts deployt** – nur eingeplant.
- `duskwardens.com` ist frei (Namecheap ca. 10 €), wird vorerst **nicht** gekauft. Wird sie
  weggeschnappt, wird notfalls umbenannt.
- Deshalb den Namen **an möglichst wenigen Stellen hart verdrahten:** Spieltitel nur als
  Schlüssel `game.title` in der zentralen String-Datei (`client/src/i18n/en.ts`), Domain nur
  über Konfiguration (`TD_PUBLIC_HOST`/`TD_PUBLIC_ORIGIN`). Repo-Name bleibt `flashkeks/towerdef`.
- **Prüfstand:** `.com` frei, kein Steam-Treffer, per Google keine Spiele mit dem Namen (nur
  einzelne Figuren in anderen Spielen – ok). **EUIPO/USPTO offen**, vor einem echten Release
  prüfen. Vorprüfung der übrigen Vorschläge: `docs/design/name.md`.
