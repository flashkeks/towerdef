# Game-Design-Entwurf: Web-Tower-Defense mit eigenen Anime-Figuren

Stand: 2026-10-06. Entwurf, keine Netzrecherche. Browser-Spiel, Anime-artiger Stil mit **eigenen** Figuren, Unit-Sammeln/Gacha nur mit Spielwährung, Koop bis 4 Spieler.

**Lesehilfe.** `DESIGN` = eigener Vorschlag. Belegte Aussagen nennen die Quelldatei. Kürzel: `rec §n` = `docs/comparison/recommendations.md` Abschnitt n; `matrix` = `docs/comparison/systems-matrix.md`; `lessons-XX` = `docs/games/<spiel>/design-lessons.md` (AV, ASTD, ALS, UTDZ, AE, BTD6), `AA-brief` = `docs/anime-adventures/design-brief.md`; `assets` = `docs/research/assets-licensing.md`; `tech` = `docs/research/tech-options.md`; `legal` = `docs/research/legal-gacha.md`. Alle Zahlen stehen im Simulator (`sim/data/units.json`, noch nicht vorhanden) bzw. in `rec §6/§18`; dieses Dokument wiederholt sie nur, wo sie für das Verständnis nötig sind. `ENTSCHIEDEN` verweist auf [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) (Stand 06.10.2026, verbindlich; die beantwortete Fragenliste steht in [FRAGEN.md](FRAGEN.md)). Wo dieses Dokument und ENTSCHEIDUNGEN.md sich widersprechen, gilt ENTSCHEIDUNGEN.md. `VERWORFEN` markiert Beschlossenes, das nicht kommt.

---

## 1. Elevator Pitch (vier Varianten)

Die Varianten betonen verschiedene Schwerpunkte; sie schließen sich nicht aus. → ENTSCHIEDEN ([ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) „Pitch“): Kern ist **A + C** („The team you collect“ + „Every coin is a bet“), Solo voll spielbar, entspannte und fordernde Modi; D gilt als Haltung (faires, transparentes Gacha), nicht als Schlagzeile.

**A: „Das Team, das du sammelst“.** Du sammelst Helden mit eigenem Charakter und stellst daraus ein Sechser-Team zusammen, das eine Welle nach der anderen aufhält. Jede Figur spielt sich anders: Ein Kurier schneidet, eine Scharfschützin deckt den Himmel, ein Steinriese wartet auf den Boss. Gesammelt wird nur mit Spielwährung, die Chancen stehen vor jedem Zug auf dem Bildschirm.

**B: „Vier Freunde, eine Linie“.** Bis zu vier Spieler verteidigen gemeinsam einen Pfad, jeder mit eigenem Geld und eigenem Team. Die Fahne des einen macht den Blitz des anderen stärker, und wer Geld übrig hat, schenkt es dem, der gerade die Lücke stopfen muss. Ein Match dauert rund 15 Minuten und endet mit einem Boss, den nur das ganze Team zusammen fällt.

**C: „Jede Münze ist eine Wette“.** Du hast 1 000 Münzen und 20 Wellen: Kaufst du früh eine Farm und hoffst, dass die Verteidigung hält, oder baust du sofort Schaden? Die Wellen sind fest und im Voraus sichtbar, also gewinnt, wer rechnet und plant, nicht wer den stärksten Account hat. Wer scheitert, weiß genau, an welcher Entscheidung es lag.

**D: „Anime-Gefühl, ehrliche Regeln“.** Eine kleine Welt mit eigenen Figuren, kurzen Sprüchen im Kampf und Treffern, die sich gut anfühlen, kostenlos im Browser. Es gibt Sammeln und Aufwerten wie in den großen Roblox-TDs, aber ohne Geldkauf, ohne Streaks und mit sichtbarem Pity-Zähler. Das Spiel verlangt keine Stunden Grind, bevor es Spaß macht.

---

## 2. Design-Säulen

**S1: Entscheidungen im Match zählen mehr als der Account.**
Das heißt konkret: Meta-Faktor typisch höchstens ×2,5 (`rec §15`, `rec §17`, Warnung UTDZ ×50–100 in `lessons-UTDZ` 2); Startgeld, Platzierungs-Caps und Farm-Fenster erzwingen Abwägungen (`rec §1`, `§7`, `§12`); eine Stage ist mit Starter-Team schaffbar, Hard/Nightmare verlangen Aufbau. Jede verlorene Wave soll dem Spieler eine benennbare Fehlentscheidung zeigen (z. B. kein Hill-Unit vor den Flyern).

**S2: Gefahr ist lesbar.**
Das heißt konkret: feste Wellenlisten mit Vorschau (`lessons-BTD6` 1, `rec §5`); jeder Gegner-Archetyp ist eine Frage mit klarer Antwort (Flyer braucht Hill, Rüstung braucht Durchdringung, Regen braucht Bleed; `lessons-ASTD` 4, `lessons-ALS` 6); nie zwei neue Mechaniken in einer Wave (`rec §5`); alle Zahlen unter 10^6 und ohne Abkürzung bis 99 999 (`rec §17`, `lessons-ALS` 1); Reichweite, Zielwahl und Wirkungsfläche sind immer sichtbar.

**S3: Figuren mit Charakter, Treffer mit Gewicht.**
Das heißt konkret: acht eigene Figuren mit Silhouette, Stimme (Sprechblase/Kurzspruch) und eigener Fähigkeits-Optik (Abschnitt 6); Feedback (Abschnitt 9) ist Teil des MVP, nicht Politur am Ende; jede Unit hat einen Moment, in dem der Spieler „das war meins“ denkt.

**S4: Fair und kurz.**
Das heißt konkret: Gacha nur mit Spielwährung, Raten und Pity-Zähler sichtbar, Pity höchstens 1,5 × Erwartungswert (`rec §13`, `§17`; Option (a) „niedrig“ in `legal` §6); keine Streaks, kein Handel, kein Zeitdruck-Banner (`rec §13`); zwei Meta-Währungen (`rec §0`); Stage ≈ 15 Minuten mit Wave-Skip, 1×/2×/3× und Auto-Ability von Anfang an (`rec §0`, `lessons-AV` 9, `lessons-ASTD` 10); Zufall nur an einer bis zwei Stellen (`lessons-ALS` 3).

---

## 3. Der Kniff: Kandidaten

Alle Kandidaten sind `DESIGN`. Gemeinsame Ausgangslage: Die sieben Vorbilder liefern die Grundschleife (Platzieren, Upgraden, Waves, Gacha); ein eigenes Merkmal ist nach dem Vergleich nicht belegt. Zusätzlich gilt: Der Kniff darf den MVP nicht aufblähen (Ursache 6 „Content-Last“ in `lessons-ALS`). Aufwand: **S** < 1 Woche, **M** 1–3 Wochen, **L** > 3 Wochen (grobe Schätzung, ungeprüft).

### K1: Vorschau und Risikokarte („Wette vor der Welle“)
- **Idee:** Vor jeder Wave sieht man die Zusammensetzung (Icons, Modifier). Optional zieht das Team vor einer Wave oder Stage eine Risikokarte (mehr Gegner-HP gegen mehr Bounty). Dazu „Sternziele“ je Stage (z. B. „nur 1 Farm“).
- **Vorbild:** AV Modifier-Karten mit Belohnung nach Risiko (`lessons-AV` 6, `rec §4` Schwierigkeit); AE Modifier je Act und Star Missions (`lessons-AE` 1, 2); BTD6 feste, lernbare Runden (`lessons-BTD6` 1).
- **Aufwand:** M (Modifier-Katalog und Vorschau-UI; Karten-Auswahl kann später kommen).
- **Risiko:** niedrig bis mittel. Karten müssen mit Koop-Skalierung (`rec §16`) zusammenpassen; Unterschied zu AV ist klein, wenn nur Karten gezeigt werden.
- ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **ja, schon im Prototyp (M1)** zusammen mit K5.

### K2: Koop-Kombos über Spielergrenzen
- **Idee:** Fähigkeiten verschiedener Spieler lösen sichtbare Kombos aus (Frost-Stun → Titan-Nuke zählt ×1,5; Fahnen-Aura wirkt auf alle Spieler). Ein Kombo-Anzeiger zeigt die Fenster („Stun aktiv, jetzt zünden“).
- **Vorbild:** AA globale Buffs (`rec §11`, `rec §16`); AV Unit-Gruppen und Buff-Kategorien (`lessons-AV` 5); UTDZ Raid-Tag-Boni für Team-Komposition (`lessons-UTDZ` 10). Kombo-Anzeige selbst: kein Vorbild in den sieben belegt.
- **Aufwand:** M bis L (Fenster-Logik im Server, UI, Balancing der Kombo-Faktoren; Solo braucht eine Ersatzregel).
- **Risiko:** mittel bis hoch: Solo-Spieler dürfen nicht benachteiligt sein; Buff-Caps (`rec §11`) müssen Kombos mitzählen; Koop erst in M2, der Kniff trägt also den MVP nicht.
- ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **ja, mit M2.**

### K3: Weichen (Pfad-Eingriff) — VERWORFEN
- **Idee:** Einzelne Kreuzungen haben Weichen, die der Spieler gegen Abklingzeit umlegt (Gegner nehmen Lane A oder B). Wer richtig umlegt, führt eine Welle durch die stärkere Kill-Zone.
- **Vorbild:** keines der sieben in den Dokumenten belegt (Pfad ist in allen fest; `rec §0` „1 Pfad“). Technisch passt es zu Waypoint-Pfaden mit zwei Verzweigungen (`tech` §3).
- **Aufwand:** L (Map-Format, Pfad-Verzweigung in der Sim, Lesbarkeit, Netzsync der Weichen).
- **Risiko:** hoch. Greift in Balance (Reichweiten, Leak-Zeiten, Kapazitätsmodell `rec §4` setzt feste 28 s Laufzeit) und in Lesbarkeit; Flyer-Route muss geklärt werden.
- **VERWORFEN** → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): K3 Weichen kommt nicht. Abschnitt bleibt zur Nachvollziehbarkeit stehen.

### K4: Bindung statt Würfeln (deterministische Perks)
- **Idee:** Statt eines zufälligen Traits (`rec §14`) wachsen Units durch Einsätze in „Bindungsstufen“ mit je 2 wählbaren Perks und kleinen Kurz-Geschichten. Zufall bleibt nur im Gacha, mit sichtbarem Pity. Charakter-Persönlichkeit wird so Teil der Progression.
- **Vorbild:** Gegenstück zu den Zufallsstapeln (`lessons-ALS` 3, `lessons-UTDZ` 1, `lessons-AE` 7); Pity-Disziplin aus `lessons-AV` 7. Ein Bindungssystem selbst ist in den sieben nicht belegt.
- **Aufwand:** M (Daten + UI, danach Content-Pflege: Text und Bilder pro Unit).
- **Risiko:** mittel. Weniger „Jackpot“-Gefühl (Einzigartig-Trait ×3 entfiele); Content-Menge wächst mit der Unit-Zahl; trifft nur M3, nicht den MVP.
- ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **ja, mit M3**; Gacha bleibt daneben bestehen.

### K5: Bosse als Rätsel mit Fenstern
- **Idee:** Jeder Boss hat ein lesbares Kit (Telegraph, Schildphase, Stun-Fenster), das eine bestimmte Team-Antwort belohnt, statt nur HP zu fressen. Final-Boss Wave 20 zitiert alle Mechaniken der Stage.
- **Vorbild:** AV Boss-Kits (Stun, Phasen, Summon; `lessons-AV` 3) und CC-Lockouts (`lessons-AV` 4, `rec §10`); ASTD Konter-Fragen (`lessons-ASTD` 4); Boss-Einzelrunden in BTD6 (`rec §4`).
- **Aufwand:** M (Phasen-System in der Sim, Telegraph-Effekte, 2 Bosse im MVP).
- **Risiko:** niedrig. Ist die konservativste Wahl; unterscheidet uns aber nur graduell von AV.
- ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **ja, schon im Prototyp (M1)**: Phasen, Telegraph, Schwachstellen-Fenster, zwei Bosse (W10, W20).

**Kombinierbarkeit:** ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): K5 + K1 in M1, K2 in M2, K4 in M3, K3 verworfen.

---

## 4. Core Loop und Meta Loop

Angelehnt an den AA-Loop (Lobby → Summon → Team → Stage → Belohnung, `AA-brief` §1) und die Matchparameter aus `rec §0–§5`.

```text
CORE LOOP (ein Match, ca. 15 min, 20 Waves)                       [rec §0, §5]
  Wellenvorschau sehen ──► Units platzieren / aufwerten / verkaufen
        ▲                          │ (Münzen: Start 1 000, je Spieler)
        │                          ▼
   Wave-Bonus + Kill-Bounty ◄── Wave läuft (45-s-Timer, Skip möglich)
   (Farm zahlt am Wave-Ende)       │
        │                          ├─ Gegner erreichen Basis ──► Leak: Leben sinken (Boss-Leak = verloren, ENTSCHIEDEN)
        │                          └─ Boss/Elite ──► Fähigkeit zünden (Frost, Titan)
        └────────── nächste Wave ───────────────────────────────────────┐
                                   Wave 20 geschafft ──► SIEG / Leben 0 ──► NIEDERLAGE

META LOOP (zwischen Matches; ab M3)                              [rec §13–§15]
  Match-Ende ──► Belohnung: Kristalle, Gold, Spieler-XP, Unit-XP
        │
        ├─► Gacha (50 Kristalle/Zug, Raten + Pity sichtbar) ──► neue Units / Duplikate = Sterne
        ├─► Aufwerten (Unit-Level 1–40, Sterne, 1 Trait oder Bindung → K4)
        ▼
  Team wählen (6 Slots) ──► nächste Stage / höhere Stufe (Hard ab Spieler-Level 5, Infinite 15, Nightmare 25)
        ▲
        └── Tages-/Wochenaufgaben (ohne Streak) ──► Kristalle

MVP-Ausschnitt (M1): nur der Core Loop, Team fest vorgegeben (Auswahl von 6 aus 8), kein Meta-Fortschritt.
```

Der Meta-Zufluss (Kristalle 100/150/200 je Erst-Clear, ca. 240 Kristalle/Tag bei 4 Clears) und das Ziel „erstes Mythic nach 2–4 Wochen“ sind `DESIGN` in `rec §13` und müssen kalibriert werden (`rec §19` Nr. 14).

---

## 5. MVP-Umfang (Vertical Slice)

**Ziel:** In einer Sitzung ein vollständiges, gut anfühlendes 15-Minuten-Match spielen, das die Fragen aus `rec §19` Nr. 1–7 und 11 beantwortbar macht und die Säulen S1–S3 beweist.

**Drin:**
- **1 Map** („Terrassenweg“, Abschnitt 7), Raster, 1 Pfad, ca. 42 Tiles (`rec §0`).
- **8 Units**: `striker`, `gunner`, `blaster`, `banner`, `farm`, `lancer`, `frost`, `titan`; 6 Team-Slots, also Auswahl von 6 aus 8 vor dem Match (`rec §7`). Werte: `sim/data/units.json`, Herleitung `rec §6`, `§18`.
- **20 Waves** nach der Beispiel-Stage `rec §5`: alle sieben Archetypen, Modifier Schild, Regen, Armored; Elite W5/15/19, Boss W10/W20.
- **Solo**, lokal, **ohne Account**, ohne Server (Sim läuft im Client; Server-Autorität erst M2, `tech` §5).
- Regeln: Münzen, **Leben statt Base-HP** (ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) „Schwierigkeit und Fail-State“: Boss-Leak = verloren, normale Gegner kosten Leben nach Typ und Rest-HP, Leben über Meta ausbaubar; Zahlen aus Runde 4, P2) und Leaks, Verkauf 60 %/Farm 40 %, vier Targeting-Modi, Caps je Unit, Statuseffekte inkl. CC-Sperren (`rec §2`, `§7`–`§10`).
- Komfort: Wave-Skip, 1×/2×/3×, Auto-Ability-Schalter, Pause, Wellenvorschau (`rec §0`).
- Onboarding nach Abschnitt 8 und Muss-Feedback nach Abschnitt 9; Ergebnisbildschirm mit Leaks, Geld nach Wave, Schaden je Unit (für S1).
- Telemetrie lokal (Wave-Ergebnis, Käufe), damit Playtests auswertbar sind (`lessons-ALS` 10).

**Ausdrücklich nicht drin:**
- Gacha, Kristalle, Gold, Konten, Inventar, Sterne, Unit-/Spieler-Level, Traits/Bindung (alles M3).
- Koop, Netzwerk, Spenden, Reconnect (M2).
- Infinite, Sternziele (M4). **Geändert durch [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md):** Wellenvorschau und Risikokarten (K1) sowie Boss-Kits (K5) gehören in M1; Schwierigkeitsstufen unterscheiden sich über Regeln (Modifier-Dichte, Elemente, Boss-Fähigkeiten) und werden im Simulator (Runde 4, P3) mitgebaut.
- Weitere Maps, weitere Units, Heiler-Support (`rec §2` nennt ihn; nicht in den 8 IDs), Camo (`rec §4`). Weichen (K3): VERWORFEN.
- Shop, Events, Leaderboards, Handel, Echtgeld in jeder Form.
- Handy/Touch: **VERWORFEN** ([ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) „Plattform“): nur Desktop-Browser, Touch und kleine Viewports bekommen einen Hinweis-Bildschirm.
- Finale Kunst und Musik: Platzhalter erlaubt (Abschnitt 10), Effekte der Kategorie „Muss“ nicht.

**Abnahme:** siehe M1 in Abschnitt 11. Falls der Aufwand zu groß wird, welche Units zuerst fallen: nicht gesondert entschieden; laut [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) gilt „kein Zeitdruck, Qualität vor Tempo“, der Umfang bleibt bei 8 Units.

---

## 6. Unit-Entwürfe für den MVP

Alle Figuren sind eigene Entwürfe. Namen sind Platzhalter ohne Bezug auf bestehende Franchises; vor Veröffentlichung Namens- und Markenprüfung (Risiko-Matrix e1 „niedrig“, e2 „mittel“, `legal` §6). Setting ENTSCHIEDEN ([ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) „Welt“): **Grenzgilde im Nebelriss**, Fantasy-Abenteuer, warmherzig; eine Welt, in der ein „Nebelriss“ Schattenwesen schickt und eine kleine Grenzgilde („Wachposten Lindenhain“, Arbeitsname) die Linie hält. Spielsprache Englisch; Name: Arbeitsname „Riftwatch“, Vorschläge in [name.md](name.md) (Runde 4, P9), entscheiden die Menschen. Alle Zahlen (Kosten, Schaden, Reichweite, Caps): `sim/data/units.json`, ansonsten `rec §6`, `§7`, `§18`.

### `striker` – Tamsin Rook (Rare, Ground, Single-Target, Bleed)
- **Figur:** Kurierin der Gilde, kurzer orangefarbener Mantel, langer Schal, zwei gebogene Messer; schnell, frech, redet beim Zustechen mit sich selbst.
- **Rolle:** Einstiegs-Damage. Billig, mehrfach platzierbar, die „Grundlast“ jedes Teams.
- **Fähigkeits-Idee:** Treffer lassen Gegner bluten (stoppt Regen, `rec §10` Bleed); Passiv-Idee `DESIGN`: nach drei Treffern auf dasselbe Ziel ein schneller Kombo-Doppelhieb.
- **Gefühl:** flinkes, rhythmisches Zuschnappen, kleine rote Schnitt-Effekte; man freut sich über jede zusätzliche Tamsin.
- **Wichtig gegen:** Gegner mit **Regen** (Brute-Wave 12) und einzelne Runner; schwach gegen Schwärme und Schild-Stacks.

### `gunner` – Veli Okrane (Rare, Hill, Anti-Air, Crit)
- **Figur:** trocken-ruhige Schützin auf Wachturm-Terrasse, Fernrohr-Büchse, Schutzbrille auf der Stirn, Wollmütze.
- **Rolle:** erste und billigste Antwort auf Flyer; Hill-Platz belegen.
- **Fähigkeits-Idee:** Crit-Schüsse mit sichtbarem „Fadenkreuz-Blitz“ (Crit-Mechanik `rec §10`); `DESIGN`: Crit-Treffer markieren den Gegner kurz für die Kamera.
- **Gefühl:** seltene, laute Treffer; Spieler achten auf den Crit-Ton.
- **Wichtig gegen:** **Flyer** (Wave 8 Debüt, 11, 14, 16, 18; `rec §5`). Erzwingt, ein Hill-Feld einzuplanen, bevor Wave 8 beginnt.

### `blaster` – Zindra Pyle (Epic, Ground, AoE-Kreis, Burn)
- **Figur:** chaotische Pyrotechnikerin mit Rucksack voller Funkenkugeln, Schutzbrille, angekohlte Handschuhe; lacht über Explosionen.
- **Rolle:** Flächenschaden gegen Masse; Burn als zusätzlicher Schadensteil (`rec §10`).
- **Fähigkeits-Idee:** Kugel landet am Ziel, Kreis-Explosion, brennende Gegner hinterlassen kurz Glutflecken (rein optisch).
- **Gefühl:** Chain-Explosionen bei dichten Gruppen; der „Wums“ ist die Belohnung fürs Gruppieren der Gegner.
- **Wichtig gegen:** große Grunt-Schwärme und **Splitter** (Wave 15, 18); jede Schadensinstanz entfernt einen Schild-Stack (`rec §4`), AoE trifft viele Stacks gleichzeitig.

### `banner` – Oriel Fenn (Epic, Hybrid, Support-Aura +Schaden)
- **Figur:** junger Hauptmann der Gilde, übergroße Fahne, aufrechte Haltung, ruft Ermutigungen; Fahne zeigt das Gildenwappen (eigenes Motiv).
- **Rolle:** Multiplikator. Schaden-Buff auf Units im Radius (Cap +100 % gesamt, `rec §11`), wirkt auf alle Spieler.
- **Fähigkeits-Idee:** Aura als sichtbarer Ring am Boden; `DESIGN`: bei Boss-Auftritt kurzer Ruf, der die Aura für wenige Sekunden verstärkt (mit Abklingzeit).
- **Gefühl:** Spiel mit Platzierung (wer steht im Ring?), sichtbare Schadenszahl-Aufwertung der Nachbarn.
- **Wichtig gegen:** **Boss und Elite** (Single-Target-DPS bündeln), sowie Rüstung (höherer Treffer macht den R-Faktor weniger schmerzhaft, `rec §10`).

### `farm` – Pomm Ellesby (Epic, 2×2, Geld am Wave-Ende)
- **Figur:** Teehaus- und Marktstand-Besitzerin mit Schürze und Münzbeutel; hat für jeden Soldaten ein Wort und einen Tee.
- **Rolle:** Wirtschaft. Kein Kampfwert; Wette „Geld jetzt gegen Geld später“ (`rec §12`, `lessons-AE` 3, `lessons-ASTD` 2).
- **Fähigkeits-Idee:** Ertrag erscheint als Münzregen am Wave-Ende, Stufen erweitern das Teehaus sichtbar (Tisch, Laterne, Anbau).
- **Gefühl:** Zufriedenheit, wenn die Münzen klingeln; leise Nervosität, wenn man ihr zu spät den Ausbau gönnt.
- **Wichtig gegen:** keinen Archetyp direkt, sondern gegen Geldmangel in W10 und W20 (Boss-Waves); Farm-Fenster bis ca. Wave 9–12 (`rec §12`).

### `lancer` – Dace Valorn (Legendary, Ground, Linien-AoE, Rüstungsdurchdringung)
- **Figur:** schweigsamer Lanzenritter mit langem, dunkelblauem Mantel und schwerem Helm; spricht kaum, nur Haltung.
- **Rolle:** Anti-Rüstung in der Linie; durchstößt Reihen von Brutes (Pen, `rec §10`).
- **Fähigkeits-Idee:** Stoß mit Lichtlinie, die über die Reichweite ragt; `DESIGN`: Lanze bleibt kurz im Boden stecken (Cooldown-Anzeige).
- **Gefühl:** Das saubere Treffen mehrerer Gegner in einer Reihe; man platziert „entlang des Pfads“.
- **Wichtig gegen:** **Brute** (Wave 7 Debüt, 9, 12, 14, 16) und **Armored** (Wave 17), Elites.

### `frost` – Maren Vael (Legendary, Hybrid, Kegel-Slow, Fähigkeit Flächen-Stun)
- **Figur:** Winterkartografin mit Kompass-Stab, blauem Cape, Rauhreif an den Haaren; schätzt Ordnung, mag es, wenn Gegner „im Plan“ laufen.
- **Rolle:** Kontrolle. Kegel verlangsamt (Slow), Fähigkeit friert eine Fläche ein (Stun mit 6-s-Sperre danach, Boss halbe Dauer, `rec §10`).
- **Fähigkeits-Idee:** Eiskristalle wachsen im Kegel, Stun-Fläche als Frostkarte am Boden; Fähigkeit manuell oder per Auto-Ability.
- **Gefühl:** man „zieht die Wave auf“, damit andere Units mehr Treffer bekommen; der Stun ist ein Befehl, kein Dauer-CC.
- **Wichtig gegen:** **Runner** (Wave 3, 4, 6, 12, 13, 16), Schwärme vor dem Boss und das **Zeitfenster** des Elites. Sperrenregel verhindert Dauer-Stun auf Bosse.

### `titan` – Koros Mahn (Mythic, Hill, Boss-Killer, Fähigkeit True-Damage-Nuke)
- **Figur:** uralter Steinwächter, moosbewachsene Schultern, ruhige, tiefe Stimme; steht erst in Wave 5 „auf“ (Story-Moment, Abschnitt 8).
- **Rolle:** Boss-Killer. Langsamer, gewaltiger Treffer; Fähigkeit schlägt True Damage ohne Rüstung (`rec §10`).
- **Fähigkeits-Idee:** Aufladen mit Rissen im Körper, dann ein Schlag mit Bildschirm-Effekt; `DESIGN`: Ladeanzeige als Rissmuster auf der Figur (lesbar ohne Zahl).
- **Gefühl:** großer Moment je Boss; teuer, selten, Cap 2 (`rec §7`).
- **Wichtig gegen:** **Boss** (Wave 10, 20) und Elite; Armored-Brutes über die True-Damage-Fähigkeit.

**Runde 7 (P6): sechs weitere Units** (`warden`, `mortar`, `broker`, `stormcaller`, `seer`, `weaver`, Pool 14) stehen in [units-r7.md](units-r7.md).

---

## 7. Map-Konzepte (drei)

Alle Maps: Raster, 1 Tile pro Unit, 2×2 für Farm; `ground`-Felder für Boden-Units, `hill`-Felder für Hill und Hybrid (Flyer treffen nur Hill/Hybrid, `rec §7`). Rasterform (z. B. 18×11) und Feldanzahl sind `DESIGN` und werden im Prototyp gesetzt. Pfadlänge ca. 42 Tiles bei Grunt 1,5 Tiles/s = 28 s (`rec §0`). Flyer folgen dem normalen Pfad, nur Hill/Hybrid-Units treffen sie (ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md)).

### M-A „Terrassenweg“ (MVP-Map): ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md)
- **Pfad:** S-Kurve über drei Terrassen, zwei Haarnadeln, Spawn oben links, Basis unten rechts; ca. 42 Tiles.
- **Flächen:** Ground an den Innenseiten der Kurven; **zwei bis drei Hill-Felder** auf den Terrassenkanten mit Sicht auf zwei Pfadabschnitte; ein 2×2-Platz für Farm abseits der Linie (sicher, aber verschenkt Feuerkraft).
- **Spielgefühl:** Innenkurven geben Reichweite-Überlappung (belohnt `blaster`, `frost`-Kegel); Hill-Knappheit macht Flyer-Wave 8 zur ersten echten Entscheidung.
- **Testet:** Grunt, Runner (Enge Haarnadel), Brute (Linie für `lancer`), Flyer (Hill-Mangel), Boss W10/W20, Elite; Regen und Schild.

### M-B „Die Schleife“ (später)
- **Pfad:** Der Weg läuft einmal um einen zentralen Hügel und kreuzt dabei sein eigenes Anfangsstück: Mitte-Platz sieht den Pfad zweimal (2 Durchgänge, ca. 42 Tiles Gesamtlänge).
- **Flächen:** zentraler Hill-Block (viele Hill-Felder, aber alle in der Mitte), Ground am Rand; Mitte ist das Zentrum, das man verteidigen muss.
- **Spielgefühl:** Lohn für Zentralplatzierung; jede Fehlplatzierung ist teuer, weil die Mitte knapp ist.
- **Testet:** **Splitter** (Kinder laufen zweimal durch die Kill-Zone), AoE und Zonen-Stun, Boss-Kontrolle (Boss ist doppelt lange in Reichweite), Verkaufsentscheidungen (Umbau).

### M-C „Zwillingsflüsse“ (Koop-Map, M2)
- **Pfad:** Zwei Einstiege (zwei Spawns), die sich nach etwa 20 Tiles zu einer gemeinsamen Schlussstrecke vereinen; Gesamtlauf je Strecke ca. 42 Tiles. (Mehrere Pfade für spätere Maps: `rec §0`.)
- **Flächen:** je Einstieg eigene Ground-/Hill-Zone, gemeinsame Hill-Plattform an der Vereinigung; 4 Spieler teilen Zonen, jeder hat getrennte Caps (`rec §16`).
- **Spielgefühl:** natürliche Aufgabenteilung im Team („du hältst links, ich rechts“), Verbund bei der Schlussstrecke; Fahnen-Aura über die Spielergrenze.
- **Testet:** Koop-Skalierung (HP nach Spielerzahl, `rec §16`), Spenden, Flyer aus zwei Richtungen, Boss am Zusammenfluss; K2 (Kombos), falls gewählt.

---

## 8. Onboarding: die ersten 10 Minuten

Grundlage ist die Beispiel-Stage „Standard 20“ (`rec §5`) mit Wave-Timer 45 s: Minute 0–10 entsprechen den Waves 1–13 (13 × 45 s ≈ 9:45 ohne Skip). Werte unten (Gegnerzahl, „kum.“ = Münzen insgesamt inkl. 1 000 Start) stammen aus der Tabelle in `rec §5`. Alle Hinweise/Tutorial-Texte sind `DESIGN`. Prinzip: **immer nur ein neuer Gedanke pro Wave** (`rec §5`, `lessons-ASTD` 4); Hinweise sind kurze Sprechblasen der Figuren, überspringbar, nie eine Textwand; in der Lehr-Fassung der Stage gilt das 6-Slot-Limit noch nicht: alle 8 Units erscheinen nach und nach im Shop (`striker`, `farm` ab W1–2, `frost` W3, `titan` nach W5, `lancer` W7, `gunner` W8, `banner` W9, `blaster` W2–4 als Hinweis möglich); das Slot-Limit mit freier Teamwahl gilt ab dem zweiten Match.

| Min. | Wave | Was kommt (rec §5) | Neuer Gedanke / Lernziel | Hinweis (DESIGN) | kum. M |
|---|---:|---|---|---|---:|
| 0:00 | 1 | 8× Grunt | Platzieren, Wave läuft, Geld kommt | Tamsin sagt „Stell mich an die Kurve“; Reichweitenkreis wird beim Ziehen gezeigt; Start 1 000 M reichen für 2 Striker plus Rest | 1 245 |
| 0:45 | 2 | 9× Grunt | Aufwerten (Upgrade-Knopf), Skip/Tempo | Upgrade-Pfeil blinkt; Hinweis „2×“-Knopf; Pomm tritt auf: „Eine Farm zahlt am Wave-Ende, aber erst nach ca. 8 Waves zurück“ | 1 517 |
| 1:30 | 3 | 8× Grunt, 3× Runner | **Runner**: schnell, wenig HP | Wellenvorschau zeigt neues Icon; Maren (`frost`) wird als Verstärkung angeboten („Verlangsamen hilft“) | 1 820 |
| 2:15 | 4 | 8× Grunt, 6× Runner | Zielwahl (First/Strongest …) | Kleiner Hinweis „Zielmodus je Unit“ nur bei erster Berührung des Kreises | 2 174 |
| 3:00 | 5 | 1× Elite, 8× Grunt | **Elite/Mini-Boss**, Leak 10 | Warn-Banner „Mini-Boss“; Spieler lernt: Leak ist nicht gleich Leak (Leak-Zahl am Gegner); Nach Wave: **Koros (`titan`) wacht auf** und ist ab sofort wählbar | 2 615 |
| 3:45 | 6 | 9× Grunt, 10× Runner | Geld einteilen, Verkaufen | „Verkaufen gibt 60 %“ Tooltip bei Verkauf-Knopf | 3 070 |
| 4:30 | 7 | 3× Brute, 10× Grunt | **Rüstung**: Brute nimmt weniger Schaden | Brute zeigt Schild-Symbol und „Rüstung 20“; Dace (`lancer`) als Lösung angeboten | 3 603 |
| 5:15 | 8 | 7× Flyer, 14× Grunt | **Flyer** brauchen Hill | Vorschau zeigt Flügel-Icon schon ab Wave 6/7; Boden-Units haben bei Berührung ein ausgegrautes „Luft“-Symbol; Veli (`gunner`) ist das Lernbeispiel | 4 181 |
| 6:00 | 9 | 4× Brute, 6× Runner, 7× Grunt | Gemischte Wave, Boss-Vorbereitung | Hinweis „Nächste Wave: Boss. Münzen sparen?“; Oriel (`banner`) wird als Verstärkung angeboten („Bündelt den Schaden auf den Boss“) | 4 842 |
| 6:45 | 10 | 1× Boss, 8× Grunt | **Boss 1** (2 080 HP, Leak 50) | Boss-Auftritt (Abschnitt 9); Fähigkeits-Knopf von `titan` und `frost` hervorgehoben; erste „Fähigkeiten zünden“ | 5 863 |
| 7:30 | 11 | 12× Flyer, 16× Grunt | Flyer-Welle (Wiederholung) | kein neuer Hinweis; prüft, ob W8 gelernt wurde | 6 651 |
| 8:15 | 12 | 4× Brute, 12× Runner, 7× Grunt | **Regen** (Brutes heilen 2 %/s) | Hinweis „Bluten stoppt Regen“, `striker`-Bleed wird gezeigt | 7 478 |
| 9:00 | 13 | 15× Grunt (Schild 3), 22× Runner | **Schild**: jeder Treffer entfernt einen Stack | Schild-Pips über Gegnern; Hinweis „Viele Treffer, nicht hohe Treffer“ → `blaster`, Multi-Hit | 8 405 |
| 9:45 | 14+ | Wave 14 (Brute+Flyer) usw. | freies Spiel, keine Hinweise mehr | – | 9 399 |

**Messpunkte für den Onboarding-Test (DESIGN):** Wird in Wave 8 ein Hill-Feld belegt, bevor Flyer erscheinen? Wie viele Spieler kaufen bis Wave 12 eine Farm (`rec §19` Nr. 6)? Wie viele leaken in Wave 5 den Elite? Wo wird pausiert, wo beendet? Ziel: ≥ 80 % der Testspieler überstehen Wave 13 ohne Tutorial-Reset (Zielwert `DESIGN`, ungeprüft).

---

## 9. Game Feel / Juice

Priorität für den MVP: **Muss** (ohne diese Effekte ist der Vertical Slice nicht abnehmbar), **Soll** (wenn Zeit), **Kann** (später). Grundregel `DESIGN`: jede Information, die der Spieler zum Entscheiden braucht, hat zuerst Farbe/Form, dann Ton, dann Zahl. Alle Effekte bekommen ein Partikel-Budget (80 Gegner, 60 Units sind Obergrenze, `rec §7`); Option „Reduzierte Effekte“ und „Screenshake aus“ (Barrierefreiheit, `DESIGN`).

| Ereignis | Effekt | Prio |
|---|---|---|
| **Treffer** | kurzer weißer Flash am Gegner (2–3 Frames), Schadenszahl (klein, grau; Crit: größer, gelb), Treffer-Ton je Unit-Typ, Trefferstopp („Hit Stop“) 1–2 Frames bei Crit | Muss |
| Treffer-Variation | Bleed: rote Tropfen; Burn: Flammenflackern; Slow: blauer Schimmer; Schild: Glasring bricht (Pips verschwinden) | Muss (Status, Schild); Soll (Feinheiten) |
| **Kill** | Gegner löst sich mit kurzer Puff-/Splitter-Animation auf, Bounty als aufsteigende Münze („+7“), kleiner Ton; bei Splitter Kinder-Spawn-Pop | Muss |
| Multi-Kill | bei ≥ 5 Kills in 1 s dezenter Combo-Text „Kette“ (nur Anzeige) | Kann |
| **Geld** | Münzzähler tickt hoch, Münz-Sprung bei Wave-Bonus, Farm-Ertrag als Münzregen vom Teehaus zum Zähler; Zähler pulsiert, wenn Kauf möglich wird | Muss (Zähler, Ton); Soll (Münzregen) |
| **Platzieren** | „Plopp“-Animation, Reichweiten-Kreis blinkt; Fehlplatzierung: roter Schütteln + dumpfer Ton, Tile bleibt leer | Muss |
| **Level-up** (Upgrade-Stufe einer Unit im Match; Spieler-/Unit-Level erst M3) | kurzer Lichtring um die Unit, Stufenpips, Ton aufsteigend, optional neuer Sprechblasen-Spruch | Muss (Ring, Pips, Ton); Kann (Sprüche) |
| **Fähigkeit** | Aufladen-Anzeige, Auslöse-Animation mit Name; `frost`: Frostfläche; `titan`: Risse, Schlag, Bildschirm-Ruck | Muss (Anzeige, Auslösung); Soll (Kamera-Effekt) |
| **Wave-Start / -Ende** | Wave-Nummer-Banner, Gegner-Icons der Vorschau wandern an den Rand; Ende: kurzer „Clear“-Jingle, Bonus fliegt ins Konto | Muss |
| **Boss-Auftritt** | Bildschirm dimmt 1 s, Boss-Name mit Silhouette, tiefer Ton, Gesundheitsbalken oben, Musikwechsel; Leak-Warnung bei < 30 % Pfad | Muss (Banner, Balken, Ton); Soll (Dimmen, Musik) |
| **Leak** | roter Rand-Flash am Basis-Ende, Lebensanzeige schüttelt sich, dumpfer Ton, Zahl „−3“ steigt auf; Boss-Leak: Niederlage mit Zeitlupe 0,3 s | Muss (Flash, Balken, Ton); Kann (Zeitlupe) |
| **Niederlage/Sieg** | Zusammenfassung: „Du hast in Wave 12 verloren: 6 Brutes ohne Rüstungsbrecher“ (kurze Ursachenzeile, siehe S1); Sieg: Konfetti, Sternziele (M4) | Muss (Ergebnis + Ursache); Kann (Konfetti) |
| **Figuren-Stimme** | je Unit 3–5 Kurzsprüche (Platzieren, Fähigkeit, Boss), als Text-Sprechblase, ohne Sprachausgabe | Soll |
| **Lesbarkeit** | Reichweitenkreis bei Auswahl, Zielmodus-Icon, Ziellinie der Fähigkeit; Gegner-Rüstung als Symbol, Regen als Herz; Schaden unter 10^5 voll ausgeschrieben (`rec §17`) | Muss |
| **Musik/Ambiente** | 2 Tracks (Kampf, Boss), SFX-Set (CC0/CC-BY, `assets` §3) | Soll (Platzhalter), Kann (finale Musik) |

---

## 10. Art-Direction-Optionen

Grundlage: `assets` §3: Charaktere im Anime-Stil gibt es kaum frei; eigene Illustration oder Auftragsarbeit mit schriftlicher Rechteübertragung einplanen, freie Packs nur als Platzhalter; Quellen bevorzugt CC0 (Kenney, Quaternius, itch.io-CC0); NC/SA/GPL und ungeprüfte KI-Assets im Release-Build ausschließen. Risiko-Matrix: eigene Figuren „niedrig“, anime-ähnliche (nicht kopierte) „mittel“ (`legal` §6, e1/e2): bewusst eigene Silhouetten und Farbwelten, **keine** erkennbaren Frisuren/Outfits bestehender Serien. Aufwände sind grobe Schätzungen.

### A: „Flat-Chibi Cutout“ (2D, Vektor-Optik)
- **Idee:** Figuren als zerlegte 2D-Teile (Kopf, Körper, Arme, Waffe), per Code animiert (Wippen, Schwingen); flächige Farben, dicke Outline, große Augen; große Portraits für Gacha.
- **Machbar mit:** eigener Illustration (Teilesätze) plus Platzhalter von Kenney (CC0, `assets` §1); Rendering mit PixiJS (`tech` §1).
- **Aufwand:** mittel für die 8 MVP-Units (je ca. 8–12 Teile plus Portrait); Animation per Code günstig.
- **Risiko:** Konsistenz zwischen Zeichnern; Rigging-Werkzeug nicht festgelegt (Spine-Lizenz: UNKNOWN).

### B: „Pixel-Anime“ (kleine Sprites plus große Portraits) — GEWÄHLT
- **Idee:** 32–48-px-Sprites für das Spielfeld (2–4 Frames Idle/Attack), die großen Auftritte (Gacha, Fähigkeit, Boss) über handgemalte Portraits/Cut-ins.
- **Machbar mit:** CC0-Sprite-Packs als Platzhalter (itch.io, Kenney; Stil Pixel ist dort stark vertreten, `assets` §1); eigene Sprites später per Auftrag.
- **Aufwand:** niedrig bis mittel; Portraits sind der Schwerpunkt (8 Stück im MVP).
- **Risiko:** „Anime-Gefühl“ hängt fast nur an den Portraits; Pixel-Look kann beim Zusammenstellen vieler CC0-Packs uneinheitlich werden.

### C: „Toon-3D mit Anime-Portraits“ (2.5D)
- **Idee:** Low-Poly-Modelle (Quaternius, CC0, `assets` §1) mit Toon-Shader und Outline vor fester Kamera; Anime-Portraits für UI und Gacha.
- **Machbar mit:** Three.js (`tech` §1: „nur wenn echtes 2.5D/3D gewünscht“); Modelle aus CC0 für Gegner/Umgebung, Figuren eigen oder als Auftragsarbeit.
- **Aufwand:** hoch (Modellierung/Rigging je Figur; Shader; Browser-Performance bei 80 Gegnern, `rec §7`).
- **Risiko:** Stil weicht von „Anime-artig“ ab, solange Figuren kein eigenes Modell haben; größte Asset-Last.

**Zwischenlösung (DESIGN):** in allen Optionen Platzhalter-first: Kenney-/CC0-Assets im Prototyp, `assets/ATTRIBUTIONS` ab Tag 1 (`assets` §3.6). ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **B „Pixel-Anime“** (kleine Sprites im Spiel, große Portraits im Menü); A Flat-Chibi bleibt als spätere Option denkbar. Nur Assets mit sauberer Lizenz (CC0, CC-BY, Kauflizenz), Styleguide in [art-styleguide.md](art-styleguide.md).

---

## 11. Roadmap

Reihenfolge: M1 → M2 → M3 → M4. ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): M1 Solo-Prototyp → M2 Koop → M3 Sammeln/Gacha/Meta → M4 Inhalte.

### M1: Vertical Slice (Solo)
Inhalt: Abschnitt 5. Technik: Sim in `sim/` (parallel in Arbeit), Rendering `DESIGN`: PixiJS getrennt von der Sim (`tech` §1), Waypoint-Pfade (`tech` §3). Engine ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): **PixiJS v8** (Rückfall Phaser), Simulation strikt getrennt. Architektur: [../architecture.md](../architecture.md).

**Abnahme-Checkliste:**
- [ ] Ein Match der Map „Terrassenweg“ (20 Waves) ist ohne Absturz in 12–18 Minuten durchspielbar.
- [ ] Alle 8 Units spielbar; jede hat einen Spielgrund (Abschnitt 6, „Wichtig gegen“).
- [ ] Alle Archetypen und die drei Modifier kommen vor (Wave-Liste `rec §5`).
- [ ] Werte kommen ausschließlich aus `sim/data/units.json` (keine Magic Numbers im Code, `rec §17` „eine JSON-Quelle“).
- [ ] Muss-Feedback aus Abschnitt 9 ist umgesetzt.
- [ ] Onboarding (Abschnitt 8) läuft; 5 externe Testspieler haben es ohne Hilfe bis Wave 8 geschafft.
- [ ] Browser-FPS ≥ 30 bei 80 Gegnern und 60 Units auf einem mittleren Laptop (Zielwert `DESIGN`, `rec §19` Nr. 13).
- [ ] Playtest-Protokoll zu `rec §19` Nr. 1–3, 6, 7, 11 liegt vor (Verlustrate je Wave, Einkommen, Farm-Anteil, Flyer-Waves).
- [ ] Credits-/Attributions-Liste für jedes Asset vorhanden (`assets` §3).

### M2: Koop (bis 4 Spieler)
Inhalt: autoritativer Server (Colyseus oder `ws`, `tech` §5), getrennte Konten, Bounty nach Schadensanteil, HP-Skalierung `h(n)`, Spenden, Skip nach Mehrheit, Trennung/Wiedereintritt (`rec §16`), zweite Map (Zwillingsflüsse), Auren über Spielergrenzen.

**Abnahme-Checkliste:**
- [ ] 2, 3 und 4 Spieler spielen eine Stage durch; Siegquote je Spielerzahl innerhalb ±10 Prozentpunkte (`rec §19` Nr. 10).
- [ ] Verbindungsabbruch und Wiedereintritt funktionieren (Units bleiben, Konto eingefroren, `rec §16`).
- [ ] Server ist maßgeblich: Client sendet nur Befehle, Sim läuft im Server (`tech` §5).
- [ ] Rate-Limits und Validierung aller Befehle vorhanden (`lessons-AV` 10).
- [ ] Kill-Bounty nach Schadensanteil; kein Kill-Stealing in Tests.
- [ ] Latenz bis 150 ms (Zielwert `DESIGN`) ohne spürbare Probleme bei Platzieren/Upgrade.
- [ ] Wellen-Skip nach Mehrheit getestet; Spenden in 50er-Schritten.

### M3: Meta und Gacha (nur Spielwährung)
Inhalt: Konten (**geändert durch [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md) „Konto“:** dasselbe Konto wie Kek-Game per signiertem Start-Token, das TD speichert keine Passwörter; HTTPS/WSS, `tech` §6), Kristalle/Gold, Gacha serverseitig mit Pity, Banner (Standard/Featured/Starter), Duplikate zu Sternen, Unit-/Spieler-Level, Trait (oder Bindung, K4), Tages-/Wochenaufgaben, Teamauswahl aus Sammlung (`rec §13–§15`). Echtgeld ENTSCHIEDEN → [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md): Architektur für Premium-Währung + Gacha mit Mock-Zahlungsanbieter wird gebaut, **kein echter Zahlungsdienst**; ob echtes Geld kommt, entscheiden die Menschen nach rechtlicher Prüfung (`legal`).

**Abnahme-Checkliste:**
- [ ] Alle Raten, Pity-Zähler und Erwartungswerte sind vor jedem Zug sichtbar (`rec §13`, `legal` §2).
- [ ] Gacha und Inventar nur serverseitig; Ziehungsprotokoll je Spieler (`tech` §6).
- [ ] Kein Echtgeld-Kauf, kein Handel, keine Login-Streaks, keine Zeitdruck-Banner (`rec §13`).
- [ ] Zeit bis zum ersten Mythic bei aktivem Spiel im Zielfenster 2–4 Wochen (Simulation und Testspieler, `rec §19` Nr. 14).
- [ ] Meta-Faktor Neuling gegen Max-Spieler ≤ ×2,5 typisch (`rec §19` Nr. 16).
- [ ] Altersangabe/Datenschutz-Basis geklärt; Fachprüfung vor jedem Echtgeld-Einsatz (`legal` §6, keine Rechtsberatung).
- [ ] Nur zwei Meta-Währungen im UI (`rec §0`).

### M4: Inhalte
Inhalt: weitere Stages und Maps (Schleife, weitere), Hard/Nightmare, Infinite, Elemente ab Hard, Modifier-Karten/Sternziele (K1), weitere Units und Banner-Rotation (Wiederkehr im 8-Wochen-Zyklus, `rec §13`), Lokalisierung (Deutsch/Englisch, `DESIGN`).

**Abnahme-Checkliste:**
- [ ] Mindestens 3 Maps und 3 Stages mit eigenem Gegner-Schwerpunkt (ein neuer Typ pro Stage, `lessons-ASTD` 4).
- [ ] Infinite läuft ohne Performanceeinbruch bei 60 Gegnern; Median-Endwave im Ziel 30–40 (`rec §19` Nr. 13).
- [ ] Hard- und Nightmare-Siegquoten bei empfohlener Stufe im Zielbereich (`rec §19` Nr. 12).
- [ ] Nerf-freie Balance-Policy: Änderungen nur per Config-Patch mit Changelog (`rec §17`).
- [ ] Telemetrie zeigt Abbruchstellen im Onboarding und in Wave 8, 10, 13 (`lessons-ALS` 10).
- [ ] Lokalisierungs-Stand und Credits-Seite vollständig.
