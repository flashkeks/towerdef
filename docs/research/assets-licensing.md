# Freie Assets und Lizenzen (Recherche)

Stand: Abruf 2026-10-06. Es wurde **nichts heruntergeladen**, nur Links und Lizenzangaben geprüft. Alle Hinweise sind keine Rechtsberatung. `UNKNOWN` = nicht verifiziert (Seite nicht abrufbar oder nicht geprüft). Spalte "Eignung Anime/TD-Stil" ist eine Einschätzung des Autors.

## 1. Quellen im Überblick

| Quelle | URL | Lizenz(en) | Namensnennung nötig? | kommerziell ok? | Eignung Anime/TD-Stil | Hinweise |
|---|---|---|---|---|---|---|
| Kenney | https://kenney.nl/assets | CC0 (Public Domain) laut Support-FAQ | Nein (freiwillig "Kenney"); Kenney-Logo nicht verwenden | Ja | Mittel: sehr viel TD-/Top-Down-Material (Einschätzung), Stil eher Cartoon/Pixel/Vektor als Anime | [A1]; "full details" stehen in der Lizenzdatei im jeweiligen Paket; Hinweis: gekaufte/bezahlte Produkte nicht geprüft |
| OpenGameArt (OGA) | https://opengameart.org | Pro Datei verschieden: CC0, CC-BY 3.0/4.0, CC-BY-SA, GPL u. a. (laut FAQ) | Je nach Lizenz; CC0 nein, CC-BY ja | Ja, laut FAQ auch kommerziell, **sofern Lizenzbedingungen erfüllt** | Mittel: große Auswahl, Qualität/Stil uneinheitlich | [A2]; je Eintrag "Copyright/Attribution Notice" lesen; OGA nennt ein Format für Credits: "[Asset] by [Autor] licensed [Lizenz]: [URL]" |
| Quaternius | https://quaternius.com | CC0 laut FAQ ("All models are under the ..." im abgerufenen Text abgeschnitten, CC0-Aussage steht im Absatz zur Namensnennung) | Nein (Dank erwünscht) | Ja ("even for commercial purposes") | Mittel für 2.5D/3D: Low-Poly-Modelle, kein Anime-Look, aber stilistisch konsistent | [A3]; Modelle meist 3D (Blender/FBX), für reines 2D nur mit Rendern/Vorrendern nutzbar |
| Poly Pizza | https://poly.pizza | Laut Suchtreffern Dritter "mostly CC-BY, some CC0" (Drittquelle, nicht verifiziert); eigene FAQ-Seite nicht gefunden (404) | Bei CC-BY ja, je Modell prüfen | Wahrscheinlich ja, **je Modell prüfen** | Niedrig/Mittel: Low-Poly-Props | [A4], [A5]; UNKNOWN bis Lizenzangabe auf der Modellseite geprüft |
| itch.io (CC0-Packs) | https://itch.io/game-assets/assets-cc0 | CC0 je Pack, aber pro Seite verschieden | Pro Pack | Pro Pack | Mittel bis hoch: viele Sprite-Packs, einige Anime-/Chibi-artig | Seite selbst **nicht abgerufen** (UNKNOWN); Lizenz immer auf der Pack-Seite prüfen, Screenshot/Archiv der Lizenzangabe sichern |
| Freesound | https://freesound.org | Creative Commons, **je Datei**; laut FAQ: manche Sounds nicht kommerziell nutzbar, viele mit Namensnennung | Je Datei (CC-BY ja, CC0 nein) | **Nur wenn Datei CC0 oder CC-BY** (NC-Dateien nein) | Mittel: SFX gut, Stilunabhängig | [A6]; Filter "License: CC0/Attribution" nutzen; Credits automatisch pro Datei erfassen |
| Pixabay (Bilder, Musik, SFX) | https://pixabay.com/service/license-summary/ | Pixabay Content License (eigene Lizenz, nicht CC) | Laut Suchtreffer der Terms: nur der "CC0 Content" ohne Nennung; zur eigenen Lizenz: UNKNOWN (Seite lieferte 403) | Laut FAQ-Snippet: nicht-kommerziell und kommerziell erlaubt | Niedrig/Mittel (Musik/SFX nützlich) | [A7], [A8]; Volltext der Lizenz nicht gelesen, Einschränkungen (z. B. Weiterverkauf als Asset-Pack) vor Nutzung selbst prüfen |
| Google Fonts | https://fonts.google.com | Überwiegend SIL Open Font License (OFL); einzelne Fonts Apache/Ubuntu-Lizenz (Einschätzung, **nicht verifiziert**, FAQ-Abruf lieferte nur Skript-Code) | OFL: Lizenztext/Copyright beim Weitergeben der Font-Datei beilegen, kein Verkauf der Font allein | Ja (Einschätzung) | Hoch für UI-Text; Anime-typische Display-Fonts (z. B. japanische Fonts) separat prüfen | [A9]; Fonts selbst hosten (Datenschutz/DSGVO, Einschätzung); Lizenz je Font-Seite prüfen |

## 2. Lizenz-Fallstricke

| Thema | Kern | Folge fürs Projekt |
|---|---|---|
| CC-BY (Attribution) | Nutzung frei, aber Urheber-/Lizenzangabe Pflicht. OGA nennt als Muster: "[Asset] by [Autor] licensed [Lizenz]: [URL]" und empfiehlt Credits-Datei und Credits-Screen [A2] | Credits-Screen im Spiel + `CREDITS.md` pflegen; bei jedem Asset Quelle, Autor, Lizenz, URL, Abrufdatum in einer Asset-Liste festhalten |
| CC-BY-SA / GPL (Copyleft) | Abgeleitete Werke müssen unter gleicher Lizenz weitergegeben werden (SA); OGA listet SA-/GPL-Lizenzen unter den erlaubten [A2]. Wie weit SA bei Spiel-Grafik "Derivat" auslöst, ist juristisch unklar (UNKNOWN, Einschätzung) | Für ein kommerzielles Gacha-Spiel **vermeiden**; nur CC0/CC-BY einsetzen |
| NC (Non-Commercial) | Kommerzielle Nutzung verboten; Freesound hat solche Dateien ausdrücklich [A6] | Gacha-Spiel mit Echtgeld ist kommerziell: NC-Assets ausschließen, auch im Prototyp, wenn der Code später live gehen soll |
| Lizenz je Datei | Plattformen (OGA, Freesound, itch.io) mischen Lizenzen; Seiten können sich ändern | Lizenz zum Download-Zeitpunkt dokumentieren (Screenshot/Archiv-URL) |
| Eigene Marken/Logos | Kenney-Logo ist ausdrücklich nicht freigegeben [A1] | Nur Assets, nicht Branding übernehmen |
| KI-generierte Assets | Das U.S. Copyright Office (Report Part 2, Januar 2025) behandelt die Urheberrechtsfähigkeit KI-erzeugter Werke [A10]; im abgerufenen Ausschnitt (nur Inhaltsangabe/Vorwort) steht keine Detail-Aussage, Ergebnisse im Report **nicht gelesen** (UNKNOWN). Allgemeine Einschätzung: rein KI-generierte Teile sind in den USA voraussichtlich kaum schützbar, andere Länder (inkl. EU/DE) können abweichen | Nicht als Hauptquelle für Charaktere (Gacha-Kern) verwenden, da kaum exklusive Rechte; Modell-Nutzungsbedingungen des Generators prüfen; menschliche Bearbeitung dokumentieren; vor Release juristisch prüfen lassen |

## 3. Empfehlung

1. Bevorzugt **CC0-Quellen** (Kenney, Quaternius, ausgewählte CC0-Packs von itch.io/OGA) für Prototyp und Platzhalter; keine Namensnennungspflicht und kein Copyleft.
2. Für Charaktere/Einheiten im Anime-Stil (Gacha-Kern) gibt es kaum fertige freie Quellen: Eigene Illustration oder Auftragsarbeit mit schriftlicher Rechteübertragung einplanen; freie Packs nur als Platzhalter.
3. Sound/Musik: Freesound nur mit Filter CC0 oder CC-BY; Pixabay erst nach Lesen der vollständigen Lizenz; jede Datei in der Asset-Liste erfassen.
4. Fonts: Google Fonts (OFL, nach Einzelprüfung), selbst hosten.
5. Ausschluss: NC- und SA-/GPL-Assets sowie ungeprüfte KI-Assets im Release-Build.
6. Prozess: Datei `assets/ATTRIBUTIONS` mit Name, Autor, Lizenz, URL, Abrufdatum; CI-Check, dass jedes Asset dort eingetragen ist.

## Quellentabelle (alle Abrufdatum 2026-10-06)

| ID | URL | Verwendet für |
|---|---|---|
| A1 | https://kenney.nl/support | Kenney: CC0, keine Nennung nötig, Logo-Hinweis |
| A2 | https://opengameart.org/content/faq | OGA: Lizenzübersicht, kommerzielle Nutzung, Credit-Format (Text nur bis CC-BY gelesen) |
| A3 | https://quaternius.com/faq.html | Quaternius: CC0, keine Nennung nötig |
| A4 | https://poly.pizza/faq | Abruf: 404 (keine Angabe) |
| A5 | https://app.cinevva.com/guides/free-3d-model-sites (Suchtreffer-Snippet, Drittquelle) | Poly Pizza: "Mostly CC-BY, some CC0" (nicht verifiziert) |
| A6 | https://freesound.org/help/faq/ | Freesound: CC-Lizenzen, teils nicht kommerziell, teils Nennung |
| A7 | https://pixabay.com/service/license-summary/ | Abruf: 403; nur Suchtreffer-Snippet |
| A8 | https://pixabay.com/service/terms/ und https://pixabay.com/service/faq/ (Suchtreffer-Snippets) | Pixabay: CC0-Content ohne Nennung; Nutzung kommerziell/nicht-kommerziell |
| A9 | https://fonts.google.com/faq | Abruf ohne verwertbaren Text; Font-Lizenzangaben nicht verifiziert |
| A10 | https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf | U.S. Copyright Office, KI-Urheberrechtsfähigkeit (nur Anfang gelesen) |
