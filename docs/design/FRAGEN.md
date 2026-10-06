# Offene Entscheidungen

Für Menschen: bitte je Frage A/B/C wählen oder eine eigene Antwort geben. Quelle der Fragen: [gdd.md](gdd.md). Alle Empfehlungen sind `DESIGN`-Vorschläge. Dringlichkeit: **vor M1** = blockiert den Vertical Slice, **vor M2/M3** = kann warten.

| # | Thema | Dringlichkeit | GDD |
|---|---|---|---|
| 1 | Pitch-Variante | vor M1 (kostet nichts) | §1 |
| 2 | Der Kniff | vor M1 (Auswahl), Umsetzung später | §3 |
| 3 | Setting, Ton, Projektname | vor M1 | §6 |
| 4 | Scope-Fallback der 8 Units | vor M1 | §5 |
| 5 | Welche Map im MVP | vor M1 | §7 |
| 6 | Flyer-Route | vor M1 | §7 |
| 7 | Render-Engine | vor M1 | §11 M1 |
| 8 | Art-Direction | vor M1 (Platzhalter reichen anfangs) | §10 |
| 9 | Echtgeld | vor M3 | §11 M3 |
| 10 | Reihenfolge Koop / Meta | vor M2 | §11 |

---

## 1. Welcher Pitch ist die Leitidee?
- **Optionen:** A „Das Team, das du sammelst“ (Sammeln und Figuren). B „Vier Freunde, eine Linie“ (Koop). C „Jede Münze ist eine Wette“ (Entscheidungstiefe). D „Anime-Gefühl, ehrliche Regeln“ (Wohlfühl plus Fairness).
- **Empfehlung:** C als Kern, A als Schlagzeile (Sammeln zieht Spieler, Entscheiden hält sie). Grund: C passt zur Säule S1 und ist ohne Koop und Gacha schon im MVP erlebbar; B hängt an M2.
- **Konsequenz:** Wenn C: Ergebnisbildschirm mit Ursachenzeile und Wellenvorschau werden Muss-Features. Wenn B: Koop rückt in der Priorität nach vorn (siehe #10). Wenn D: Juice und Figuren-Texte bekommen mehr Budget als Balance-Tiefe.

## 2. Welcher Kniff soll uns von den sieben Vorbildern unterscheiden?
- **Optionen:** A K1 Vorschau und Risikokarte (Vorbilder AV/AE/BTD6; Aufwand M; Risiko niedrig–mittel). B K2 Koop-Kombos (M–L; mittel–hoch). C K3 Weichen im Pfad (L; hoch). D K4 Bindung statt Würfeln (M; mittel). E K5 Bosse als Rätsel mit Fenstern (M; niedrig). Details und Quellen: GDD §3.
- **Empfehlung:** E plus A im Kleinen für den MVP (2 Boss-Kits, Wellenvorschau), danach D für M3. Grund: günstig, passt zu S2 und S4, deckt sich mit den Lehren aus `lessons-AV` 3, 6; K3 ist das einzige echte Alleinstellungsmerkmal, aber das teuerste und riskanteste, K2 braucht Koop (M2).
- **Konsequenz:** Wenn E+A: 2 Boss-Phasen und Vorschau-UI kommen in M1. Wenn D: der Trait-Zufall aus `rec §14` entfällt, Content-Pflege (Text, Bilder je Unit) kommt dazu. Wenn C: Sim und Map-Format müssen Verzweigungen unterstützen, M1 verlängert sich merklich. Wenn B: Kombo-Fenster müssen in der Server-Sim existieren (M2).

## 3. Welche Welt, welcher Ton, welcher Name?
- **Optionen:** A Grenzgilde im Nebelriss (Arbeitsannahme im GDD, Abenteuer/Warmherzig). B Moderne Stadt (Schule, Fantasy-Alltag). C Reine Fantasy-Insel, keine festen Orte, nur Figuren.
- **Empfehlung:** A, aber mit offenem Namen. Grund: passt zu den acht Figurenentwürfen und erklärt Pfad, Basis und Wellen ohne Text. Projektname und Unit-Namen vor Release auf Namens- und Markenkonflikte prüfen lassen; stabilen Namen früh wählen (`lessons-UTDZ` 8; Risiko e1/e2 in `legal` §6).
- **Konsequenz:** Wenn A: Gegner heißen „Schatten“-Varianten (Grunt = Schatten-Läufer usw.), Maps tragen Gilden-Orte. Wenn B: alle Figurennamen und Outfits werden neu entworfen. Ein späterer Namenswechsel zersplittert Doku und Wiedererkennung.

## 4. Welche Units fallen zuerst, wenn der Scope zu groß wird?
- **Optionen:** A Mythic `titan` (aufwendigste Fähigkeit). B Epic `banner` (Aura-Logik und Zielwahl). C Keine streichen, Zeitplan verlängern.
- **Empfehlung:** C bis M1-Halbzeit; danach `banner` zuerst, weil ohne Koop der Buff-Hebel kaum zur Geltung kommt. `titan` bleibt, weil Boss-Waves 10 und 20 sonst ihre Gegenfigur verlieren (GDD §6). Ohne `banner` bleiben 7 Units, 6 Slots, die Wahl bleibt echt.
- **Konsequenz:** Wenn `banner` gestrichen: Buff-Caps (`rec §11`) werden erst in M2 getestet; Onboarding Wave 9 entfällt. Wenn `titan` gestrichen: Boss-Kits (K5) tragen den Schwierigkeitsgipfel allein.

## 5. Auf welcher Map startet der MVP?
- **Optionen:** A „Terrassenweg“ (S-Kurve, 2–3 Hill-Felder, testet fast alles). B „Die Schleife“ (Zentrum, Splitter/Boss-Kontrolle). C „Zwillingsflüsse“ (zwei Einstiege; Koop-Map).
- **Empfehlung:** A. Grund: einfachster Pfad, das Onboarding (GDD §8) passt Wave für Wave dazu und das Kapazitätsmodell in `rec §4` rechnet mit einem einzelnen 28-s-Pfad. B und C sind M2/M4.
- **Konsequenz:** Wenn A: M1 braucht nur ein Map-Format ohne Verzweigung. Wenn C: Format mit mehreren Spawns und Merges nötig; Playtest-Zahlen aus `rec §19` sind dann nicht direkt vergleichbar.

## 6. Folgen Flyer dem Pfad oder fliegen sie Luftlinie?
- **Optionen:** A Pfadfolge (wie Boden, nur von Hill/Hybrid treffbar). B Luftlinie vom Spawn zur Basis. C Fester eigener Flugpfad je Map.
- **Empfehlung:** A für den MVP. Grund: deterministisch, billig (`tech` §3), keine Zusatzdaten in der Sim; die Rolle „Flyer braucht Hill“ (`rec §4`, §7) bleibt erhalten. B/C erst mit M4, wenn Maps mit Luftachsen Spaß bringen.
- **Konsequenz:** Wenn A: Flyer-Waves (W8, 11, 14, 16, 18) sind auf den Pfadabschnitten testbar wie Boden. Wenn B oder C: Reichweite-Überlappung und Leak-Zeit ändern sich, Kapazitätsmodell (`rec §4`) und Hill-Anzahl müssen neu kalibriert werden.

## 7. Welche Render-Engine?
- **Optionen:** A PixiJS v8 (reiner Renderer, MIT; volle Kontrolle, mehr Eigenbau). B Phaser (MIT; Szenen, Audio, Input fertig). C Three.js (nur für echtes 2.5D/3D).
- **Empfehlung:** A, mit strikter Trennung Sim/Render (`tech` §1). Grund: Sim ist ohnehin separat (`sim/`) und läuft später auf dem Server (`tech` §5); B ist die Rückfalloption, wenn Audio und Szenen zu viel Eigenbau fressen.
- **Konsequenz:** Wenn A: Audio, UI-Schicht und Eingabe müssen selbst oder über kleine Libraries gelöst werden. Wenn B: schnellerer Start, aber engere Kopplung; Sim-Trennung muss diszipliniert bleiben. Wenn C: nur zusammen mit Art-Option C (#8).

## 8. Welche Art-Direction?
- **Optionen:** A Flat-Chibi Cutout (2D, Teile per Code animiert). B Pixel-Anime (kleine Sprites, große Portraits). C Toon-3D mit Anime-Portraits (Three.js).
- **Empfehlung:** B als Weg in den MVP (Platzhalter aus CC0, Portraits eigen), mit Option auf A für Release. Grund: geringster Aufwand, Anime-Gefühl sitzt in den Portraits, die der Gacha-Kern ohnehin braucht (`assets` §3 Punkt 2). C nur bei klarer 3D-Entscheidung.
- **Konsequenz:** Wenn B: 8 Portraits plus Platzhalter-Sprites für M1; `assets/ATTRIBUTIONS` ab Tag 1. Wenn A: Teile-Sätze und Animationsregeln nötig. Wenn C: Engine #7 muss Three.js sein, Performance bei 80 Gegnern prüfen. KI-Bilder nicht als Hauptquelle für Figuren (`assets` §2). Eigene Silhouetten ohne Anklang an bestehende Serien (Risiko e2, `legal` §6).

## 9. Echtgeld ja oder nein?
- **Optionen:** A Nie: Kristalle nur erspielbar (`rec §13`). B Später nur Direktkäufe ohne Zufall (Skins/Einheiten mit Festpreis, Option (c)). C Premiumwährung plus Gacha (Option (b)).
- **Empfehlung:** A bis nach M3; B nur als spätere, rechtlich geprüfte Option. C ausschließen. Grund: Risiko-Matrix `legal` §6: (a) „niedrig“, (c) „niedrig–mittel“, (b) „hoch“ (CPC-Verfahren, Lootbox-Debatte). Keine Rechtsberatung; vor jedem Echtgeld-Einsatz Fachanwalt.
- **Konsequenz:** Wenn A: keine Zahlungsabwicklung, kein Altersgate über das Notwendige hinaus, aber Finanzierung offen. Wenn B: Preisangaben, Widerrufsrecht und Minderjährigenschutz (`legal` §6) sind Pflicht. Wenn C: neue Prüfschleife (Raten, Altersangaben, Store-Regeln) vor dem Livegang.

## 10. Reihenfolge der Meilensteine: Koop vor Meta?
- **Optionen:** A M1 → M2 Koop → M3 Meta/Gacha → M4 (Entwurf). B M1 → M3 Meta → M2 Koop → M4. C M1 → M4-Inhalte → dann Koop und Meta parallel.
- **Empfehlung:** A. Grund: Server-Autorität (`tech` §5) ist ohnehin Voraussetzung für Inventar und Gacha (`tech` §6); Koop prüft sie früher unter Last, und `rec §16` verlangt eine Balance-Kalibrierung vor Meta-Faktoren. B nur, wenn das Spiel vor allem als Sammelspiel gesehen wird (Pitch A in #1).
- **Konsequenz:** Wenn A: Meta-Zufluss (`rec §13`) wird erst nach den Koop-Daten kalibriert. Wenn B: Koop-Balance startet mit Meta-Faktoren im Spiel und braucht eine Option, sie zu deaktivieren. Wenn C: längere Zeit ohne Server; Inventar und Gacha lassen sich nicht echt testen.
