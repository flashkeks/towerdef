# Balancing: Tower Defense und Gacha-/F2P-Ökonomie

Recherchestand 2026-10-06. Bewertung: A = offiziell/Primärquelle des Urhebers; B = Entwickler-/Branchenpublikation mit Primärautor; C = Fachpublikation/Sekundär; D/E = Blog/unklar. **DESIGN** = eigene Ableitung (nicht aus Quelle belegt). **UNKNOWN** = nach max. 3 Versuchen nicht gefunden.

## 1. Quellenauswertung

| Quelle | Kernaussagen (3–5) | Formeln/Zahlen | Relevanz für uns |
|---|---|---|---|
| **Q1 – Anthony Pecorella (Kongregate), „The Math of Idle Games, Part I“** | (1) Idle-Spiele sind eine Wippe aus Produktion und Kosten. (2) Kosten wachsen exponentiell, Produktion linear/polynomial. (3) Exponential schlägt irgendwann jedes Polynom, Balancing setzt diesen Punkt. (4) Multiplikatoren holen Produktion temporär zurück. (5) Mehrere Generatoren mit unterschiedlichen Multiplikator-Schwellen halten Entscheidungen interessant. | `cost_next = cost_base × rate_growth^owned`; `production = base × owned × multipliers`; AdCap-Beispiel: rate_growth = 1,07; Bulk-Kosten `b·r^k·(r^n−1)/(r−1)`; Max. kaufbar `floor(log_r(c(r−1)/(b·r^k)+1))`. | Direktes Modell für Turm-Upgrade-Kosten und Meta-Währung (Abschnitt 2c). |
| **Q2 – Daniel Cook (Lost Garden), „Value chains“ (2021)** | (1) Spielökonomie als Netz aus Value Chains mit Faucets (Quellen), Transforms, Drains (Senken). (2) Faucet-and-Drain-Ökonomien sind leichter zu balancieren und zu erklären als geschlossene Märkte. (3) Jede Ressource braucht einen Zweck bis zu einem Anker (Spielermotivation); fehlt das Ziel, verliert die Ressource Wert. (4) Zu viel Ressource → Senkenpreise erhöhen oder Quelle senken; zu wenig → umgekehrt. | Notation: `Aktion(−Input & −Zeit) → +Output`; keine festen Zahlen im gelesenen Abschnitt (Text erst bis ca. 12.000 von 78.530 Zeichen gelesen). | Rahmen für Faucet/Sink-Plan der Spielwährungen (2e). |
| **Q3 – Joris Dormans / Ernest Adams (Game Developer 2012), Machinations** | (1) Visuelle Sprache zur Simulation von Spielökonomien: Pools, Quellen, Senken, Konverter, Händler. (2) Knoten feuern automatisch/interaktiv/Start/passiv. (3) Zufallsraten als Würfel oder Prozent (z. B. 25 % = Chance pro Takt). (4) Ökonomien lassen sich ohne Code simulieren. | Prozentflüsse: 250 % = mind. 2 plus 50 % Chance auf 1 weitere. Das Machinations-Werkzeug (Original) – aktueller Stand/Kosten: **UNKNOWN**. | Wir simulieren Faucets/Sinks vorab im Skript/Spreadsheet statt im Spiel zu raten. |
| **Q4 – Lars Doucet, „Optimizing Tower Defense for FOCUS and THINKING“ (Defender's Quest)** | (1) Spieler fokussieren lassen statt Reaktion testen (kein Scrollen). (2) Total Information: Statwerte als konkrete Zahlen zeigen (z. B. „5 Schaden/s für 5 s“). (3) Total Time Control (Pause, 1/4x bis 4x). (4) Reichweite ist der stärkste Stat und überwältigt leicht Nahkampftürme; Nahkampf muss attraktiv bleiben. | Tempo 0,25×/0,5×/1×/2×/4×; Reichweite wirkt stärker als Schaden oder Feuerrate (qualitative Aussage; weiterer Text ab 9.000 von 20.003 Zeichen nicht gelesen). | UI/Balance-Prinzipien; Reichweite bewusst gedeckelt/teurer. |
| **Q5 – Lars Doucet, „Upgrades, Equipment, and Skill Trees“ (2011)** | (1) Wenn Monster und Held im selben Verhältnis skalieren, ändern sich nur Zahlen, keine Strategie. (2) Wenn Monster langsamer/schneller skalieren als der Spieler, wird es zu leicht/schwer. (3) Spieler soll Punkte verteilen → verschiedene Stärken. (4) Interessante Wahl = verschieden, ausgeglichen, klar, begrenzt. | Keine Formeln. | Upgrade-Pfade statt reiner Zahlen-Inflation; wenige klare Optionen pro Turm. |
| **Q6 – Game Developer, „Gacha: A 2021 Detailed Guide for Beginners“** | (1) Gacha macht bei Spielen mit dieser Mechanik 60–90 % der Hard-Currency-Ausgaben aus (Autorenangabe). (2) Normales Gacha = Ziehen mit Zurücklegen, gewichtete Loot-Tabelle; Box-Gacha = ohne Zurücklegen, Inhalt endlich; Step-Gacha = steigende Preise und Garantien. (3) Spielfortschritt hängt bei Gacha stärker an der Mechanik als bei Lootboxen. (4) Designer sollen erwartete Pulls bis zum Chase-Item berechnen. | Box-Beispiel: 22 Items, 2 Chase-Items (Chance je Zug/bis Zug N in der Quelle); Preis pro Zug von 0,20 $ bis 5 $+. Rest des Artikels (ab 10.000 von 13.918 Zeichen) nicht gelesen. | Raten/Pity-Design (2d); Box/Step-Varianten als pity-ähnliche Garantien. |
| **Q7 – Ironhide: Kingdom Rush Postmortem** | **UNKNOWN** (3 Suchen: nur Sekundärtreffer; Franchise-Festival-Artikel nur Snippet: Upgrades und direkte Spielerkontrolle als Differenzierung). | – | – |
| **Q8 – Ninja Kiwi / BTD-Interviews** | **UNKNOWN** (Suche ohne relevante Treffer). | – | – |
| **Q9 – GDC-Vault-Talks zu Gacha-Ökonomie** | **UNKNOWN** (kein konkreter Talk gefunden; Suche lieferte nur Blogs). | – | – |
| **Q10 – Lars Doucet, „Defender's Quest: By the Numbers, Part 2“** | Nur Suchtreffer-Snippet (Geschäftszahlen, nicht Balancing); nicht gelesen. | – | Nur Business-Referenz; bei Bedarf nachlesen. |

## 2. Synthese: Faustregeln

Alle Zahlenwerte sind **Startwerte zum Testen**, sofern nicht „Quelle“ angegeben. Verifizieren mit Simulation (Machinations-Stil, Q3) und Playtests.

### (a) Gegner-HP-Kurve vs. Spieler-DPS-Kurve

| Regel | Herkunft |
|---|---|
| Verhältnisse nicht konstant halten, sonst keine Strategie; Spieler soll durch Wahl der Upgrades Stärken/Schwächen gegenüber Gegnertypen erzeugen. | Q5 |
| Ziel: Kosten wachsen schneller als Produktion (Wippe), damit es Phasen von „Spieler überlegen“ und „Gegner überlegen“ gibt. | Q1 |
| HP je Welle `HP(w) = HP0 · g^w` mit g ≈ 1,05–1,12 pro Welle für Standardgegner; Bosswellen ×5–×10 HP zusätzlich. | DESIGN |
| Verfügbare DPS (Spieler) soll pro Welle mit ca. g_dps ≈ g · 0,95–1,0 wachsen, d. h. leicht unter HP-Wachstum, damit Upgrades knapp bleiben; Zielverlustrate für Durchschnittsspieler ~10–20 % der Wellen im späten Levelabschnitt. | DESIGN |
| Werte als konkrete Zahlen anzeigen (Schaden/s, HP), keine versteckten Prozente. | Q4 |
| Reichweite begrenzen, Nahkampf/kurze Reichweite mit Bonus-DPS oder Kosten-Vorteil ausgleichen. | Q4 |

### (b) Einkommenskurve

| Regel | Herkunft |
|---|---|
| Einkommen = Faucet; muss an Senken (Upgrades/Türme) gekoppelt sein, sonst verliert Währung Wert (Anker-Prinzip). | Q2 |
| Kill-Bounty `B(w) = B0 · g_b^w` mit g_b ≈ 0,6–0,8 · (g−1)+1, also etwas langsamer als HP-Wachstum, plus Wellenbonus; so bleibt „Geld knapp“ im späten Spiel. | DESIGN |
| Early Game großzügig (schnelle erste Käufe, Wippe zugunsten Spieler), später Produktion hinter Kosten. | Q1 (Prinzip), Werte DESIGN |
| Prestige/Meta-Fortschritt (Permanent-Multiplikatoren) erst nach einer Wippen-Phase einführen (Idle-Muster). | Q1 |

### (c) Upgrade-Kostenkurven

| Regel | Herkunft |
|---|---|
| Geometrisch: `cost_next = base × r^n`; Idle-Beispiel r = 1,07 pro gekauftem Stück (AdCap). | Q1 |
| Für Turm-Upgrades (Level 1–5) größeres r pro Stufe (z. B. ×1,8–2,5 Kosten je Stufe, +40–70 % Effekt je Stufe) – Wirkung nimmt bei Stufe 4–5 ab, Kauf von Zweitturm wird attraktiver. | DESIGN |
| Linear nur für kurze Tutorial-Stufen (Gewöhnung); lange Ketten geometrisch. | DESIGN (Gegenüberstellung Q1: Exp. vs. Polynom) |
| Bulk-Kauf-Formeln aus Q1 für „Max kaufen“-Button nutzen. | Q1 |
| Multiplikator-Schwellen (z. B. bei Stück 25/50) erzeugen sichtbare Kaufspitzen und Abwechslung. | Q1 |
| Nicht alle Upgrades gleichzeitig optimal; neueste/teuerste Stufe nicht immer dominant, sonst irrelevante ältere Optionen. | Q1 |
| Wenige, klare, unterschiedliche Optionen pro Turm (nicht 36 Varianten). | Q5 |

### (d) Gacha-Raten, Pity, Erwartungswerte

| Regel | Herkunft |
|---|---|
| Ziehen mit Zurücklegen: erwartete Pulls bis Chase-Item = 1/p. | DESIGN (Standardwahrscheinlichkeit; Q6 fordert Berechnung „erwarteter Pulls“) |
| Hard-Pity bei N Zügen: `E = (1 − (1−p)^N) / p`. Beispiel p = 1 %, N = 80 → E ≈ 55 Pulls (ohne Pity: 100). Beispiel p = 0,6 %, N = 90 → E ≈ 70. Rechenbeispiele, keine Quelle. | DESIGN |
| Soft-Pity: ab Zug M steigt p linear (z. B. +5 % je Zug); dämpft Streuung. Konkrete Werte realer Spiele **UNKNOWN** (nicht belegt). | DESIGN |
| Alternativen ohne Zurücklegen (Box-Gacha) oder Step-Gacha mit Garantien. | Q6 |
| Raten je Seltenheit vor jedem Pull anzeigen, Pity-Zähler sichtbar; Hinweis, dass in realen Fällen Täuschung über Raten behördlich verfolgt wurde. | Rechtliche Seite: `docs/research/legal-gacha.md` (FTC-Fall Q14 dort) |
| Für Spiel ohne Echtgeld: Pulls pro Tag/Woche so festlegen, dass Spieler das erste Top-Element in ca. 2–4 Wochen aktivem Spiel erhält (Zielwert, nicht belegt). | DESIGN |
| Duplikate in Fortschritt umwandeln (Sterne/Shards), nicht in Frust. | DESIGN |

### (e) Faucets und Sinks

| Regel | Herkunft |
|---|---|
| Quellen: Kämpfe (Kill-Bounty, Wellenbonus), Tagesaufgaben, Erstabschluss; Senken: Turm-Upgrades, Gacha-Pulls, Rerolls, Reparatur/Respec. | Rahmen Q2, Aufzählung DESIGN |
| Konstante Nachfrage: Senken müssen laufend mehr kosten, sonst sammelt sich Währung an (Inflation). | Q2 |
| Zu viel Ressource → Senkenpreise erhöhen oder Quelle senken; zu wenig → Gegenteil. | Q2 |
| Flussdiagramm vor Implementierung in Machinations-Notation; Faucet-/Sink-Rate pro Spielstunde in Tabelle festhalten. | Q3 |
| Max. 2 Währungen (Soft/Premium-Spielwährung) für Übersichtlichkeit; mehrstufige Währungen gelten behördlich als Problem (siehe legal-gacha.md, Q7/Q14 dort). | DESIGN + legal-gacha.md |
| Tägliche Caps und Streaks nur optional (KIDS-Act-Entwurf; siehe legal-gacha.md). | legal-gacha.md |

## 3. Offene Lücken

| Lücke | Status |
|---|---|
| Kingdom-Rush-Postmortem (Ironhide) | UNKNOWN (3 Suchen) |
| Ninja Kiwi/BTD-Balancing | UNKNOWN |
| GDC-Vault-Talk Gacha-Ökonomie | UNKNOWN |
| Rest von Q2 (Chapter 2: Balancing value chains) und Q4/Q6 | teilweise ungelesen, bei Bedarf nachziehen |
| Doucet zu Statuseffekt-Stacking (gamedeveloper.com/design/a-status-effect-stacking-algorithm) | nur Titel im Suchtreffer, nicht gelesen |

## Quellentabelle (Abruf je 2026-10-06)

| ID | Quelle | URL | Bewertung |
|---|---|---|---|
| Q1 | Pecorella: The Math of Idle Games, Part I | https://www.kongregate.com/en/pages/the-math-of-idle-games-part-i | B |
| Q2 | Cook: Value chains (Lost Garden, 2021) | https://lostgarden.com/2021/12/12/value-chains/ | B |
| Q3 | Dormans/Adams: Machinations (Game Developer, 2012) | https://www.gamedeveloper.com/design/the-designer-s-notebook-machinations-a-new-way-to-design-game-mechanics | B |
| Q4 | Doucet: Optimizing Tower Defense for FOCUS and THINKING | https://www.gamedeveloper.com/design/optimizing-tower-defense-for-focus-and-thinking---defender-s-quest | B |
| Q5 | Doucet: Upgrades, Equipment, and Skill Trees | https://www.gamedeveloper.com/design/upgrades-equipment-and-skill-trees | B |
| Q6 | Gacha: A 2021 Detailed Guide for Beginners (Game Developer) | https://www.gamedeveloper.com/business/gacha-a-2021-detailed-guide-for-beginners- | C |
| Q7 | Franchise Festival #48: Kingdom Rush (nur Snippet, nicht Postmortem) | https://the-avocado.org/2019/02/01/franchise-festival-48-kingdom-rush/ | D |
| Q10 | Doucet: Defender's Quest By the Numbers Part 2 (nur Snippet) | https://www.gamedeveloper.com/business/-i-defender-s-quest-i-by-the-numbers-part-2 | C |
