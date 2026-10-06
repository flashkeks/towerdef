# Entscheidungen — zum Ausfüllen

**So geht's:** Bei der gewählten Option `[ ]` zu `[x]` machen. Unter **Notiz** darf alles
stehen, auch „egal" oder eine eigene Idee. Was leer bleibt, entscheidet die KI nach ihrer
Empfehlung (⭐).

Ausgefüllt von: Max (Flashkeks) + Plori  Datum: 06.10.2026

---

## Teil A — Schnell abnicken

Die Empfehlungen sind solide. Häkchen = passt so.

- [x] **Map im MVP:** „Terrassenweg" (S-Kurve, eine Spur) ⭐
- [x] **Flyer:** folgen dem normalen Pfad, nur Hill/Hybrid-Units treffen sie ⭐
- [x] **Engine:** PixiJS (Rückfall: Phaser) ⭐
- [x] **Reihenfolge:** erst Solo-Prototyp → dann Koop → dann Sammeln/Gacha ⭐

Notiz: Naja das sind ja weniger fragen mehr einfach sachen die wir so machen müssen right?

---

## Teil B — Die großen Entscheidungen

### B1 · Worum geht's im Kern? (Pitch)

- [x] **A — „Das Team, das du sammelst"**: Figuren sammeln steht im Mittelpunkt
- [~] **B — „Vier Freunde, eine Linie"**: Koop steht im Mittelpunkt
- [x] **C — „Jede Münze ist eine Wette"**: kluge Entscheidungen im Match stehen im Mittelpunkt
- [~] **D — „Anime-Gefühl, ehrliche Regeln"**: Wohlfühlen, faire Mechanik, kein Abzocke-Gacha
- [~] ⭐ **C als Kern, A als Aushängeschild**

Notiz: Soll solo auch spielbar sein. Es soll Modis geben die tatsächlich sehr anspruchsvoll sind (C), aber es soll auch enstapnnt Spielbar sein (A). Und es soll natürlich kein Full Abzock Gacha sein, aber eigentlich schon komplett xD. Kommt hier gleich noch mehr info (D).

### B2 · Was macht uns anders als AA, ASTD und Co.? (Kniff, mehrere möglich)

- [x] **K1 Wellenvorschau + Risikokarten**: man sieht die nächste Welle und kann für mehr Belohnung freiwillig härter spielen. Aufwand mittel, Risiko klein
- [x] **K2 Koop-Kombos**: Fähigkeiten verschiedener Spieler verstärken sich gegenseitig. Aufwand mittel bis groß, erst mit Koop
- [ ] **K3 Weichen im Pfad**: Spieler lenken Gegner auf Spur A oder B. Echtes Alleinstellungsmerkmal, aber Aufwand groß, Risiko hoch
- [x] **K4 Bindung statt Würfeln**: Figuren wachsen durch Einsätze und wählbare Perks statt Zufalls-Traits. Aufwand mittel, erst mit Meta
- [x] **K5 Bosse als Rätsel**: Bosse haben Phasen und Schwachstellen-Fenster statt nur viel HP. Aufwand mittel, Risiko klein
- [x] ⭐ **K5 + K1 im Prototyp, K4 später**

Notiz:

### B3 · Welt, Ton, Name

- [x] **A — Grenzgilde im Nebelriss**: Fantasy-Abenteuer, warmherzig, Gilde hält die Linie gegen Schattenwesen ⭐
- [ ] **B — Moderne Stadt**: Schule und Fantasy-Alltag
- [ ] **C — Keine feste Welt**: nur die Figuren zählen

Projektname (Ideen, gern mehrere): Hmm wird ja mit in die Kek-Game welt integriert, aber muss tbh nicht dem einheitlichen namens schema folgen, weil ist ja schon ein sehr umfangreicher eigenes game / Modul. Denk dir was schönes aus c:

Notiz:

### B4 · Grafikstil

- [~] **A — Flat-Chibi**: 2D-Vektor-Optik, Figuren aus Teilen animiert
- [x] **B — Pixel-Anime**: kleine Sprites im Spiel, große Portraits im Menü ⭐ (am wenigsten Aufwand)
- [ ] **C — Toon-3D**: 3D-Modelle, Anime-Portraits (dann Three.js statt PixiJS)

Wer macht die Figuren-Bilder?
- [x] selbst gezeichnet
- [ ] Auftrag an einen Zeichner
- [~] erst mal Platzhalter, später entscheiden ⭐

Notiz: Tbh, können wir die nicht irgentwo klauen xD. Also Lowkey. Ansonsten wenn du die selber machst (wie gesagt schau vorher ob du ggf. passende sachen im Internet findest (Licensing und Uhrheberecht ist unbedenklich)).

### B5 · Echtgeld

- [ ] **A — Nie**: alles nur erspielbar ⭐ (bis das Spiel steht)
- [~] **B — Später nur Direktkäufe ohne Zufall**, z. B. Skins zum Festpreis
- [x] **C — Premium-Währung plus Gacha**: rechtlich das höchste Risiko (Lootbox-Debatte)

Notiz: Also, erstmal kannst du es so bauen als gäbe es eine Zahlungsmöglichkeit ohne echten Zahlungsdienst dahinter. Dann überlegen wir später genau wie wir das umsetzten.

---

## Teil C — Fehlte in der alten Datei

### C1 · Wo wird gespielt?

- [x] nur Desktop-Browser
- [ ] Desktop **und** Handy-Browser (Touch-Bedienung, kleinere Maps, mehr Performance-Arbeit)
- [ ] erst Desktop, Handy später mitdenken ⭐

Notiz: Für Handy locken. Ist sonst unnötige balancing und Perfomance arbeit.

### C2 · Wer baut, wie viel Zeit?

Wer arbeitet daran mit (Namen/Rollen)?

Ungefähre Zeit pro Woche (alle zusammen): 120 Stunden

Wunschtermin für einen spielbaren Prototyp: tbh kein Zeitdruck. Wir bauen bis es sinn ergibt einen Prototyp zu erstellen.

Notiz:

### C3 · Betrieb

Sprache:
- [ ] Deutsch
- [x] Englisch
- [ ] beides, erst Deutsch ⭐

Login:
- [ ] Gast ohne Konto, Spielstand lokal
- [x] Konto beim Spiel selbst ⭐
- [ ] Login über authentik (`auth.flashkeks.com`)

Nachtrag Max (06.10.2026): gemeint ist **dasselbe Konto wie Kek-Game**. Button auf der Kek-Game-Startseite, neuer Tab, Spiel läuft auf eigener Domain komplett eigenständig, nur das Konto ist geteilt. Coins/Leaderboard-Kopplung später.

Hosting:
- [x] auf `edge` (Netcup, läuft schon, Tunnel vorhanden) ⭐
- [ ] woanders: ______

Notiz:

### C4 · Wie sollen sich die Schwierigkeitsstufen unterscheiden?

Der Simulator zeigt: Wenn sich die Stufen nur in der Gegner-HP unterscheiden, landen sie fast alle auf demselben Niveau (Hard = +3 % HP).

- [x] **Eigene Regeln je Stufe**: mehr Modifier, Elemente, Boss-Fähigkeiten, andere Wellen ⭐
- [ ] nur über die Zahlen (HP, Tempo), einfach halten

Was passiert bei einem Fehler?
- [~] **Weicher Fail-State**: Basis heilt pro Welle etwas, ein einzelner Boss-Leak beendet das Spiel nicht ⭐
- [~] knallhart: Fehler kosten richtig

Notiz: Also wenn ein Boss durchkommt soll man verloren haben. Aber wenn da jetzt so nen dulli mit 1k hp der noch 100 überig hat durchkommt, dann soll man das überleben. ggf. mit Lifestocks oder upgradbaren leben. ggf. wie in anime Vanguards.

---

## Teil D — Später

**Welche Unit fällt zuerst, wenn der Umfang zu groß wird?** Wird erst nach dem
Unit-Rebalance in Runde 4 entschieden. Titan ist zu stark, Striker eine Falle.
Jetzt nichts eintragen.

---

## Sonst noch was?

Wünsche, Vorbilder, Dinge, die auf keinen Fall ins Spiel sollen:
