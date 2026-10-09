# Status (global)

Arbeitsauftrag: [`/run.md`](../run.md) (**Runde 11: Neustart wie Bloons TD 6 als Vertical Slice — abgeschlossen 09.10.2026**, Bericht unten; Runde 12 wartet auf Max' Rückmeldung). **Verbindlich zuerst:** [design/ENTSCHEIDUNGEN.md](design/ENTSCHEIDUNGEN.md), Abschnitt „Neustart als BTD6-artiges Spiel (09.10.2026)“, dann [games/btd6/](games/btd6/) und [design/schnittstelle.md](design/schnittstelle.md). **Jede Sitzung liest danach diese Datei.**
Frühere Aufträge: [archiv/run-runde1.md](archiv/run-runde1.md), [archiv/run-runde2.md](archiv/run-runde2.md), [archiv/run-runde3.md](archiv/run-runde3.md), [archiv/run-runde4.md](archiv/run-runde4.md), [archiv/run-runde5.md](archiv/run-runde5.md), [archiv/run-runde6.md](archiv/run-runde6.md), [archiv/run-runde7.md](archiv/run-runde7.md), [archiv/run-runde8-verworfen.md](archiv/run-runde8-verworfen.md), [archiv/run-runde8.md](archiv/run-runde8.md), [archiv/run-runde9.md](archiv/run-runde9.md).


## Runde 11 (Neustart wie BTD6, Vertical Slice)

Letzte Aktualisierung: 2026-10-09 (**Runde 11 abgeschlossen**, P5)

| Paket | Inhalt | Status | Agent (Modell) | Was man jetzt sehen kann |
|---|---|---|---|---|
| P0 | Archiv, AA raus, Entwurf, Vertrag | **erledigt** (`d3af0ca`, `e9a8da9`) | Hauptsitzung | AA-Import, 550 Units, Gacha, Banner, Evolution, Trade/Reroll, Welten/Raids/Legenden, alter Sim-Kern, alte Meta, alter Match-Client und `tools/aa-import` sind raus. **Rückweg: Commit `783865d`** (Tag `archiv/aa-runde10` nur lokal; Push vom Git-Proxy der Session abgelehnt). Entwurf `docs/design/`: `welt.md`, `tuerme.md`, `gegner.md`, `runden.md`, `meta.md`, `pixel-stil.md`, **`schnittstelle.md`** (Vertrag Sim ↔ Client). Pixel-Basis `client/src/pixel/palette.ts` (ENDESGA 32) + `raster.ts` (Text-Raster wie Kek-Game) |
| P1 | Simulator neu | **erledigt** (Merge `1d35147`) | 1 × Sonnet | `createGame` nach Vertrag, 60 Ticks/s, Milli-px: **Projektile mit Flugzeit** (Schaden erst beim Aufprall, Sweep-Kollision, Pierce, Weiterflug), Bombe im Bogen auf vorausberechnete Position, Blitz/Aura sofort, Ausholen 6 Ticks (`windup` → `fire`); **Schichten** mit Überschuss-Schaden, Camo-Vererbung, Leck = RBE; Ironshell/Ember-Regeln; 3 × 5 Pfade mit Crosspath, Verkauf 70 %, Freischalt-Sperre + Wissensbaum-`mods`; Held Wren L1–20 mit Flare/Dawnbreak/Aura; Arrow Rain, Absolute Zero; Bot + `npm run bot` / `npm run matrix`. Abweichungen: `sim/README.md` |
| P2 | Pixel-Grafik | **erledigt** (Merge `f3e9b71`) | 1 × Sonnet | Alles im Code gezeichnet, nur Palette: 3 Türme aus Teilen, **alle 15 Stufen sichtbar** (Stufe 3 neue Waffe, Stufe 5 golden/groß: Pfeilwirbel, Fass-Kanone, Raketenrucksack, Eis-Golem, Gewitterwolke), 8 Richtungen, Idle/Angriff; Wren in 5 Ausbaustufen; alle Gegner mit Lauf-Frames, Treffer-Blitz, Camo-Flimmern, Brute-Risse, Leviathan-Platten; Projektile (16 Richtungen), Effekte, 45 Upgrade-Icons, Pixel-Ziffern. Bilder `client/docs/r11/p2-*` (Sprite-Bogen `p2-tuerme.png`, `p2-angriffe.webm`) |
| P3 | Karte + Match-Oberfläche | **erledigt** (Merge nach Limit-Neustart) | 2 × Sonnet (1 am Limit) | **Karte „Lanternfall Meadow“** im Code gemalt (Bach mit 3 Brücken, Windmühle, Scheune, Stadt mit Mauer und Laternen, violetter Waldrand, animiertes Wasser/Fahnen/Glühwürmchen); Pixi-Renderer 640 × 360 scharf skaliert; Turm-Leiste, **Upgrade-Panel wie BTD6** (3 Pfade × 5 Stufen, Crosspath-/XP-Sperren sichtbar, Targeting, Verkaufen, Pops), Held-Panel mit Fähigkeiten (Tasten 1–3), Platzieren mit Geist/Reichweite/Grund-Toast, Tempo 1–3×, Auto-Start, Pause, Boss-Banner, Ton je Event. Bilder `client/docs/r11/p3-*` |
| P4 | Fortschritt + Bildschirme | **erledigt** (Merge `789ef4d`) | 2 × Sonnet (1 am Limit) | Profil 11 (alte Stände → Reset + einmaliger Hinweis), Spieler-Level mit Freischaltungen (Bombardier L2, Wren L3, Frostcaller L4, Hard L5), **Turm-XP** schaltet Stufen im Turm-Detail frei, **Wissensbaum** (10 Knoten), **Medaillen** Easy/Medium/Hard, Ergebnis mit animiertem XP-Balken und Freischalt-Karten, Settings mit Export/Import und „Developer: unlock everything“. Bilder `client/docs/r11/p4-*` |
| P5 | Balance, Abschluss | **erledigt** | Hauptsitzung | Balance-Matrix (unten), Tests auf Testkarte `bare`, Screenshots auf dem Endstand neu |

**Arbeitsweise dieser Runde:** Hauptsitzung (Homelab-Session, auf Max' Wunsch statt einer neuen TD-Session) hat P0/P5 gemacht, P1–P4 liefen als Sonnet-Agenten in lokalen Worktrees (`/home/user/wt/p1..p4`). Die automatische Worktree-Isolation der Agenten scheitert in diesem Repo („origin/main“ fehlt im Klon) — Worktrees von Hand von `dev` anlegen. Am Nutzungslimit (P3, P4 gleichzeitig) wurde wie in Runde 10 der Stand gesichert und je ein **neuer** Sonnet-Agent gestartet.

```text
STATUS — Runde 11 (Vertical Slice)
Was man jetzt sehen kann (5 Zeilen):
  Startbildschirm im Pixel-Look mit Level, Karte „Lanternfall Meadow“, Medaillen und Schwierigkeit.
  Match auf einer handgemalten Pixel-Karte (640 x 360, scharf skaliert), 20 Runden, Boss in Runde 20.
  3 Türme + Held, jede Upgrade-Stufe sichtbar am Turm, BTD6-Upgrade-Panel mit 3 x 5 Stufen.
  Projektile fliegen sichtbar, Schaden zählt erst beim Aufprall; Gegner platzen Schicht für Schicht.
  Nach dem Match: XP-Balken, Level-Up, Freischaltungen, Turm-XP, Wissensbaum, Turm-Detail.
Türme + Held:
  Ranger (200, Einzelziel): Volley (mehr Pfeile → Sky Splitter), Rapid (Tempo → Thousand Arrows, Arrow Rain), Eagle Eye (Reichweite, Camo, Balliste → Starfall).
  Bombardier (350, Fläche/Panzer): Bigger Blasts (→ Doomsday Keg), Clusters (Splitter → Bombardment), Concussion (Betäubung → Earthshaker).
  Frostcaller (300, Kontrolle): Permafrost (Aura → Absolute Zero), Shatter (Nova/Splitter → Winter's Wrath), Storm (Kettenblitz, Camo → Stormcaller).
  Wren, the Lamplighter (540, Held): L1–20 im Match, Flare (L3, enttarnt), Dawnbreak (L10, Strahl über den Weg), Aura (L12).
Gegner, Runden, Boss:
  Red/Blue/Green/Gold Glim (Schichtenleiter), Ironshell (Pfeile prallen ab), Emberling (kälte-immun), Gloom Brute (10 HP, darin Ironshell + Ember),
  Shade = Camo-Variante, Dusk Leviathan (Boss R20, 300 HP, darin 4 Brutes). Feste Runden 1–20 (runden.md + P5-Nachtrag).
Fortschritt: Spieler-Level (Freischaltung Türme/Held/Hard), Turm-XP je Stufe (100/250/900/2.500/8.000), Wissensbaum 10 Knoten, Medaillen je Schwierigkeit.
Balance-Rauchtest: Tabelle unten.
Was rausgeflogen ist: AA-Import (550 Units), Gacha/Banner, Evolution, Traits, Trade/Reroll, Promis/Crossover, Welten/Raids, alte Bilder; Rückweg Commit 783865d.
Offene Fragen an Max (mit Empfehlung): siehe unten.
Vorschlag Runde 12: siehe unten.
Agenten: 6 × Sonnet (P1, P2, P3 ×2, P4 ×2), Limit 1 × (P3 und P4 gleichzeitig). Hauptsitzung: P0, P5, Merges.
Commits / Tests: sim 79, meta 23, client 54 Tests, tsc in allen drei, build, smoke grün.
```

**Balance-Rauchtest** (`cd sim && npm run matrix`; Bot spielt eine feste Kaufreihenfolge, 4 Türme + optional Held; Sim deterministisch). Ergebnis nach den P5-Anpassungen (Nachträge in `runden.md`, `gegner.md`, `tuerme.md`: **2 Gold je Schicht**, Wren-XP 60 + 20 × Runde, Dawnbreak schwächer, Brute-Tempo 1,3, R17/R19 weniger Brutes, Hard schneller + Boss 400 HP):

| Aufstellung | Held | easy | medium | hard |
|---|---|---|---|---|
| Ranger + Bombardier | ja | 1/1 ✔ (200 L) | 1/1 ✔ (150 L) | 1/1 ✔ (65 L) |
| Ranger + Bombardier | nein | 1/1 ✔ (200 L) | 1/1 ✔ (100 L) | 0/1 (Ø R18.0) |
| Ranger + Frostcaller | ja | 1/1 ✔ (200 L) | 1/1 ✔ (150 L) | 1/1 ✔ (76 L) |
| Ranger + Frostcaller | nein | 1/1 ✔ (200 L) | 1/1 ✔ (118 L) | 1/1 ✔ (5 L) |
| Bombardier + Frostcaller | ja | 1/1 ✔ (200 L) | 1/1 ✔ (145 L) | 0/1 (Ø R20.0) |
| Bombardier + Frostcaller | nein | 1/1 ✔ (200 L) | 0/1 (Ø R20.0) | 0/1 (Ø R15.0) |
| nur Ranger | ja | 1/1 ✔ (197 L) | 1/1 ✔ (142 L) | 0/1 (Ø R20.0) |
| nur Ranger | nein | 1/1 ✔ (38 L) | 0/1 (Ø R18.0) | 0/1 (Ø R17.0) |
| nur Bombardier | ja | 1/1 ✔ (200 L) | 1/1 ✔ (140 L) | 0/1 (Ø R17.0) |
| nur Bombardier | nein | 1/1 ✔ (164 L) | 0/1 (Ø R17.0) | 0/1 (Ø R15.0) |
| nur Frostcaller | ja | 1/1 ✔ (200 L) | 0/1 (Ø R20.0) | 0/1 (Ø R20.0) |
| nur Frostcaller | nein | 1/1 ✔ (34 L) | 0/1 (Ø R20.0) | 0/1 (Ø R12.0) |

Lesart: Jede Zweier-Kombination schafft Medium mit Held (B + F ohne Held scheitert am Boss = „Boss braucht Vorbereitung“). Kein Einzelturm schafft Medium ohne Held, keiner schafft Hard. Hard braucht Held + passende Kombination. Vor P5 (1 Gold je Schicht) verlor **jede** Aufstellung ohne Held auf Medium in R15–17, und Wren trug Einzeltürme durch Hard. Der Bot ist schlichter als ein Mensch (feste Reihenfolge, keine Umstellung), echte Spieler sollten es leichter haben.

**Offene Fragen an Max (mit Empfehlung):**
0. *(Runde 11b hat Punkt 2 unten überholt: Start-Turm-XP 100, Turm-XP kommt im Match.)*
1. **T5-Preise gestaucht** (≈ 15–20× statt 80× Basispreis), sonst wäre in 20 Runden nie ein T5 bezahlbar. Empfehlung: so lassen, mit 2 Gold je Schicht ist ein T5 ab ~R15 erreichbar.
2. **Erste Partie ist schwer:** Ein neues Profil hat nur den Ranger und 250 Turm-XP je Turm (eine Handvoll Stufen). Easy gewinnt man damit eher nicht beim ersten Mal; nach 1–2 Partien sind Bombardier/Wren da. Empfehlung: so lassen (BTD6-Gefühl), zum Testen der hohen Stufen **Settings → „Developer: unlock everything“** oder `?debug`.
3. **Freeplay** (R21+) fehlt. Empfehlung: in Runde 12, zusammen mit der zweiten Karte.

**Vorschlag Runde 12:** Max spielt den Slice und sagt, was fehlt. Danach: eine vierte Turmklasse (Support/Farm, damit Ökonomie eine Entscheidung wird), eine zweite Karte (Winter oder Sumpf) und Freeplay ab R21. Gesichter/Ausdruck der Figuren nachschärfen (P2-Schwäche), kleine Effekte (Nova, Eisblock) feiner. Gacha für Helden/Skins erst danach.

**Bekannt:** Echte Bildrate auf GPU ungemessen (headless SwiftShader ≈ 12 fps, Sim+Sync+Render im Code ≈ 9 ms je Bild bei 126 Gegnern). Boss-Banner kommt beim Rundenstart von R20, nicht beim Auftauchen des Bosses.

### Runde 11b (09.10.2026 abends): Turm-XP im Match, Freischalten im Match, verdeckte Stufen

Anlass: Max' erstes Spiel — eine 3-Minuten-Partie hat alle drei Ranger-Pfade auf Stufe 3 gebracht (`ENTSCHEIDUNGEN.md`, oberster Abschnitt; Spezifikation `meta.md` „Nachtrag Runde 11b“).

**Was man jetzt sieht:**
- **Rundenende:** kurzer Toast je Turmtyp („+13 Ranger XP“, `b-runde-ende.png`). Der Topf je Runde ist `(10 + 6 × Runde) × 1,1` (Medium), halb nach investiertem Geld, halb nach Pops des Typs.
- **Turm anklicken → Knopf „Unlock“** (zeigt das XP-Konto des Typs, pulsiert, wenn etwas bezahlbar ist) → **Freischalt-Menü** mit 3 Pfaden × 5 Stufen: freigeschaltete Stufen abgehakt, die nächste mit Text, Kosten und Kaufknopf, alle weiteren „???“ mit Schloss und nur den XP-Kosten (`b-unlock-menue.png`). Ton beim Freischalten, Toast „Unlocked …“.
- **Upgrade-Panel:** nicht freigeschaltete Stufen zeigen „Unlock“ (Klick öffnet das Menü), Stufen nach einer nicht freigeschalteten sind „???“ mit Schloss und ohne Beschreibung (`b-upgrade-verdeckt.png`). Crosspath wie BTD6 (5-2-0), Freischalten ist davon unabhängig.
- **Turm-Detail** (außerhalb des Matches): verdeckte Stufen ebenfalls „???“, auch ohne Sprite-Vorschau. **Ergebnis:** zeigt die im Match verdienten Turm-XP je Typ (`b-ergebnis-xp.png`). Startguthaben jetzt 100 je Turm; alte Profile bleiben gültig.

**Technik:** Sim führt Konto und Freischaltungen (`GameOptions.towerXp`, `state.towerXp/towerXpGained/maxTier`, Befehl `unlockTier`, Events `towerXp`/`unlockTier`, `Game.unlockInfo`); Meta übernimmt das Endkonto und die Endstufen aus dem Match (`applyMatch`, idempotent); Details in `sim/README.md`, `meta/README.md`, `docs/design/schnittstelle.md`. Tests: sim 101, meta 30, client 54, alles grün.

**Rechnung, volle Medium-Partie (R1–20, Bot, Seed 1, `npm run bot`):** der Topf summiert sich auf ≈ 1.606 XP je Partie über alle Typen. Der Haupt-Turm bekommt davon:

| Aufstellung (Medium, Held) | Ranger / Bombardier / Frostcaller |
|---|---|
| ranger + ranger (T3-Pfade) + bombardier + bombardier 4-2-0 | 452 / 1.146 / 0 |
| ranger + ranger 0-4-2 + frostcaller + frostcaller 2-4-0 | 584 / 0 / 1.014 |
| ranger + ranger 0-2-4 + bombardier | 1.238 / 360 / 0 |
| ranger + ranger + frostcaller + bombardier | 944 / 285 / 226 |

Heißt: ein Haupt-Turm bringt ≈ 950–1.250 XP je Partie (Ziel war 800–1.100, wer fast nur einen Typ spielt, liegt oben drüber, ein Mischbau mit klarem Hauptturm trifft die Spanne). Mit 100 Startguthaben: ein T3 je Partie, T4 (2.500) nach ~3 Partien, T5 (8.000) nach ~8–10. Wer bewusst mehr Spreizung will, dreht `potPerRound` in `sim/data/xp.json` (eine Zahl, Tests prüfen nur die Summenregeln).

**Kleinigkeiten:** `.m-toast` bekommt `flex: none` (gestapelte Toasts wurden gequetscht), neue Prüfhilfe `?hooks` (siehe `client/docs/r11/p4-fortschritt.md`), `scripts/shots-r11-b.mjs`.

## Runde 10 (echte Figuren, Match-Grafik, Beschwören, Karten je Welt)

Letzte Aktualisierung: 2026-10-09 (Runde 10 abgeschlossen, P5) — **überholt durch Runde 11**

**Rückmeldung Max zu Runde 9 (08.10.2026):** Interface gut; Summonen „ungeil“, mehr Ton und Effekte; Daily Pack zeigt nur den ersten Gewinn; Roblox-Bilder raus, echte Bilder; echte, bekannte Namen plus Promis; im Match nur Buchstaben auf den Units, Units und Attacken brauchen Design.

| Paket | Inhalt | Status | Agent (Modell) | Was man jetzt sehen kann |
|---|---|---|---|---|
| P0 | Status, Raid-Units aus dem Banner-Pool | **erledigt** | Hauptsitzung | Die 11 Garantie-Units der Raids (`guarantee.unit` in `sim/data/modes/raids.json`: vegeta_majin, naruto_pts, trunks, bambietta, chuya, frieza_mecha, stain, feitan, rengoku, akaza_unit …) tragen `raidOnly` im Meta-Katalog und liegen in **keinem** Banner-Pool mehr (wie AA `hideFromBanner`); zu bekommen nur über Raid-Garantie und Raid-Shop. Besessene bleiben (Test `meta/test/raid-units-r10.test.ts`). Banner-Raten unverändert (Pools sind gleichverteilt, nur die Einzelrate der übrigen steigt leicht). Stand vor Runde 10: sim 381, meta 168 → 171, client 252 |
| P1 | Echte Figuren: `figuren.json`, Manifest mit `anilistQuery`, Anzeige Name + Serie, Promi-Banner „Legends of Earth“ | **erledigt** (Phase A `6bf8594`, Phase B Merge `82cb512`) | 4 × Sonnet (2 am Limit) | **Echte Namen überall** (Karte, Detail, Banner, Enthüllung, Match-Panel/Cut-in, Ergebnis, Team), Serie klein darunter, Formen als „Son Goku (Super Saiyan Blue)“; AA-Namen nur noch in den Daten. **Sammlung nach Serie filterbar** (Naruto, One Piece, Dragon Ball, Legends of Earth …). **Banner „Legends of Earth“** (25 Promis, Pool `legends`, nur dort ziehbar, Featured The Rock; Kits nur aus vorhandenen Bausteinen, Spec `tools/aa-import/legends-spec.ts`, Prüfung `npm run legends:check`): Secret Trump (Tariff: Gegner langsamer + 500 Gold), Musk (Rocket Launch), Schwarzenegger (I'll Be Back: ruft einen T-800); Mythic The Rock, Bruce Lee, Einstein (Time Dilation), Napoleon, Merkel (Rhombus Stability: Buff Schaden/Reichweite statt Schild); Legendary Obama, Zuckerberg, Bezos, Snoop Dogg, Gordon Ramsay, Ronaldo, Messi; Epic MrBeast (Gold Rain), PewDiePie, Taylor Swift, Jackie Chan, Bill Gates; Rare Dieter Bohlen, Knossi, MontanaBlack, Steve Irwin, **Bud Spencer** (25. Figur, die Tabelle in run.md hatte 24). Screenshots `client/docs/r10/p1-*.png`. sim 390, meta 173, client 297 Tests, Smoke 363 grün |
| P2 | Match: Porträt-Figuren, Angriffs-Grafik je Form × Element, Treffer/Tod, Fähigkeits-Ansage, Gegner-Figuren, Ton | **erledigt** (Merge `4fbf968`) | 3 × Sonnet (2 am Limit) | **Units als Porträt-Figuren** (Bild aus `/aa/units/<id>.webp`, sonst gestaltete Ersatzfigur) mit Seltenheits-Ring, Schatten, Wippen, Blickrichtung, Stufen-Pips, Element-Symbol; Platzier-Vorschau mit Reichweitenkreis + Aufsetz-Effekt; **Angriffs-Grafik je Form × Element** (Hieb-Bogen, Projektil mit Schweif, Strahl, Druckwelle, Fächer, Bahn), Rückstoß/Aufleuchten; Schadenszahlen (Krit groß/gelb), Funken, Blinken, Tod mit Münzen; **Fähigkeits-Cut-in** mit Porträt; Bildschirmruckeln (in Settings abschaltbar); Gegner als gestaltete Figuren je Typ, Boss mit Namensbanner und Auftritt; **Match-Ton** (synthetisch, optional echte Dateien über `/sfx/index.json`), gemeinsamer Lautstärkepfad mit P3-Menü-Ton. Leistung: ca. 1,7 ms JS je Frame bei 30 Units + 80 Gegnern (Budget 16,7 ms), Partikel gedeckelt; **echte 60 FPS nur auf GPU prüfbar** (Headless-SwiftShader ≈ 4 fps, auch vor Runde 10). Screenshots `client/docs/r10/p2-*.png`, Asset-Wunschliste `client/docs/r10/p2-assets-wunschliste.md`. client 293 Tests, Smoke 363 grün |
| P3 | Beschwören neu, Mehrfach-Ergebnisse durchklickbar, Interaktions-Durchgang, Menü-Ton | **erledigt** (Merge `ceac233`) | 2 × Sonnet (1 am Limit) | **Beschwören** als Portal/Riss, Farbe steigt vorab Blau → Lila → Gold → Regenbogen, Ruckeln, Funken, Durchbruch, große Enthüllung mit Name/Serie/„NEW“, Shiny-Glitzer, Ton je Stufe, überspringbar. **Mehrfach-Ergebnisse** (10er-Zug, Starter-Paket, Match-/Raid-Belohnung, Kristall-Shop, Raid-Shop-Unit) liegen verdeckt, 1 Klick = 1 Karte, „Reveal all“, dann Übersicht (höchste Seltenheit zuletzt). Ursache „nur der erste Gewinn“: jeder Klick beendete die ganze Animation; das Starter-Paket lief gar nicht durch einen Enthüllungs-Bildschirm (Test `client/test/r10-p3-reveal.test.ts` + Smoke). **Interaktions-Durchgang** (Smoke `interactionCase`, 49 Knöpfe, alle mit Reaktion + Ton); nachgerüstet: Paket-Bildschirm fürs Starter-Paket, „Open rewards“ nach Match/Raid, Kristall-Shop- und Raid-Shop-Enthüllung, Stempel für Level-Up/Evolution/Freischaltung, Hover/Klick-Ton überall, Toasts mit Ton, hochlaufende Zähler, Menü-Musik (4 Stimmungen, Schalter in Settings). Alles per WebAudio/Canvas, Packs optional (Wunschliste unten). Screenshots `client/docs/r10/p3-*.png`. client 252 → 271 Tests, Smoke grün (363 Prüfungen) |
| P4 | Karten-Grafik je Welt | **erledigt** (Merge `cb8c45c`) | 2 × Sonnet (1 am Limit) | Jede der 10 Welten hat ein **gemaltes Kartenbild** aus Daten (`theme.board` in `sim/data/worlds/*.json`, nur Darstellung; Hash-Test je Welt mit/ohne `board` gleich): Boden mit Muster, Terrassen mit Wand und Schlagschatten, Pfad mit Randstein/Schatten/Leuchtlinie, 17 Deko-Arten, Spawn-Portal, Basis-Schrein, Licht + Vignette, Schwebeteilchen (Schnee, Glut, Sporen, Irrlichter; aus bei `prefers-reduced-motion`). Kein Raster-Look mehr. Einmal je Welt/Auflösung in eine Textur gemalt (100–300 ms), pro Frame nur 20–40 Ambient-Sprites. Einhängepunkt nur `game/map-layer.ts` (neu `board-art.ts`, `board-ambient.ts`); Atlas-Bodenkacheln werden nicht mehr gezeichnet (`atlas.ts` toter Code). Platzierungszonen beim Setzen: bisherige Rechteck-Füllung (`overlay-layer.ts`) unverändert. Screenshots `client/docs/r10/p4-<welt>-{leer,setzen,kampf}.png` |
| P5 | Abschluss | **erledigt** | Hauptsitzung | Merges P1A → P3 → P2 → P1B → P4 (nur P1B/P2/P4 mit Konflikten, von den Agenten selbst aufgelöst: `audio/engine.ts`, `reveal.ts`, `settings.ts`, `smoke.mjs`, README). Endstand-Smoke 363 grün; Screenshots P2/P3/P4 auf dem Endstand neu erzeugt (vorher noch AA-Namen, weil vor dem P1-Merge aufgenommen). Kurzbericht unten |

Plan: P1, P2, P3 parallel in lokalen Worktrees (max. 3 Agenten, nur Sonnet, Zwischenstand spätestens alle 30 min), P1 liefert zuerst `figuren.json` + Manifest (sofort nach `dev`, Meldung unten), P4 danach. Screenshots in `client/docs/r10/`.

**Falle Nutzungslimit (08.10.2026):** Ein am Limit abgebrochener Agent, der per `SendMessage` fortgesetzt wird, läuft **nicht** mehr auf Sonnet, sondern auf dem Modell der Hauptsitzung (hier Opus; die Fehlermeldung nannte `claude-opus-5-5`). Das widerspricht run.md § 1 („nie Opus“). Vorgehen stattdessen: Hauptsitzung committet den Worktree-Stand (`wip(...)`), dann **neuer Agent mit `model: sonnet`** auf demselben Worktree mit Übernahme-Hinweis („Vorgänger-Stand liegt in `git log dev..HEAD`“). So in Runde 10 für P1–P3 gemacht (Limit 15:4x und 16:4x UTC).

**Für die Homelab-Seite (Runde 10): Manifest mit `anilistQuery` steht, Commit `6bf8594` auf `dev` (P1 Phase A `09c73d3`).** Die Bilder können jetzt geholt werden, ohne aufs Rundenende zu warten:
- `client/public/aa/manifest.json`: je Unit `name`, `series`, `form?`, `anilistQuery`, `source: "anilist"`. Suchbegriff ist `anilistQuery`, nicht `name` (weicht ab, wo AniList anders heißt: „Pain“ für Nagato, „Aokiji“ für Kuzan, „Stain“ für Chizome Akaguro, „EMIYA“ für Archer).
- Formen (`form`, z. B. Son Goku „Super Saiyan 3“) teilen sich die Figur: gleiches AniList-Bild ist ok, ein formspezifisches Bild (Fandom/MAL) wäre schöner.
- Crossover (`x_*`, `source: "custom"`): `anilistQuery` leer, Bild per Wikipedia über `imageQuery`.
- `wiki`/`wikiShiny` (alte AA-Wiki-Bilder) nur noch als Notfall-Rückfall.
- Pfad und `/aa/index.json` bleiben gleich (`/aa/units/<id>.webp`, 256 × 256).

Nichts deployen ohne Ansage von Max.

**Neue `imageQuery` (Wikipedia-Titel) für „Legends of Earth“ (`p_*`, 25):** Donald Trump, Elon Musk, Arnold Schwarzenegger, Dwayne Johnson (nicht „The Rock“), Bruce Lee, Albert Einstein, Napoleon (nicht „Napoleon Bonaparte“), Angela Merkel, Barack Obama, Mark Zuckerberg, Jeff Bezos, Snoop Dogg, Gordon Ramsay, Cristiano Ronaldo, Lionel Messi, MrBeast, PewDiePie, Taylor Swift, Jackie Chan, Bill Gates, Dieter Bohlen, Knossi, MontanaBlack, Steve Irwin, Bud Spencer. Knossi und MontanaBlack haben evtl. nur eine deutsche Wikipedia-Seite (de.wikipedia nehmen). Manifest jetzt 600 Einträge (550 AA + 25 Crossover + 25 Legends).

**Bekannt:** `npm run crossover:check` meldet „veraltet“: `crossover.json` weicht von `crossover-spec.ts` nur im Feld `series` ab (Werte gleich). **Nicht** mit `npm run crossover` „reparieren“, das überschreibt Handgepflegtes; Spec in Runde 11 nachziehen.

**Asset-Wunschliste P3 (optional, nichts blockiert; CC0, Ablage `client/public/sfx/` bzw. `client/public/fx/`, Herkunft in `client/assets/ATTRIBUTIONS.md`):** Kenney Interface Sounds https://kenney.nl/assets/interface-sounds · Kenney UI Audio https://kenney.nl/assets/ui-audio · Kenney RPG Audio https://kenney.nl/assets/rpg-audio · Kenney Impact Sounds https://kenney.nl/assets/impact-sounds · Kenney Music Jingles https://kenney.nl/assets/music-jingles · Kenney Particle Pack https://kenney.nl/assets/particle-pack · OpenGameArt „Level Up Sound Effects“ https://opengameart.org/content/level-up-sound-effects und „Fantasy Sound Library“ https://opengameart.org/content/fantasy-sound-library · freesound CC0 (magic/portal/sparkle) https://freesound.org/browse/tags/magic/. Großes Porträt für die Enthüllungskarte (≈ 380 × 510 px): `/aa/units-lg/<id>.webp` (512 px) wäre schöner, 256 px gehen.

**Asset-Wunschliste P2 (Match-Ton, optional):** Kenney Impact Sounds, Interface Sounds, RPG Audio, Digital Audio https://kenney.nl/assets/digital-audio, Sci-fi Sounds https://kenney.nl/assets/sci-fi-sounds, Music Jingles; Particle Pack (noch nicht angebunden). Ablage `client/public/sfx/` + Zuordnung in `client/public/sfx/index.json` (IDs in `client/docs/r10/p2-assets-wunschliste.md`).

**Falle Smoke parallel:** Alle Agenten teilen den Smoke-Port 4173 (`--strictPort`) und `pkill -f scripts/smoke.mjs` trifft fremde Läufe. Parallel immer `SMOKE_PORT=<eigener> npm run smoke`, nie pauschal killen. Smoke schreibt die Alt-Screenshots `client/docs/r8`, `r9` jedes Mal neu: vor dem Commit zurücksetzen.

**Antwort der Homelab-Seite (09.10.2026):** Alle 600 Porträts liegen auf der Preview unter `/aa/units/<id>.webp`
(256×256, AniList/Wikipedia/Fandom, keine AA-Bilder mehr). **Groß:** `/aa/units-lg/<id>.webp` im
**Original-Hochformat 230×345** (AniList gibt nicht mehr her, 512 px wäre hochskaliert und matschig) — für 575 IDs,
nicht für die 25 Crossover `x_*`; `/aa/index.json` sagt je ID `lg: true/false`. Preview steht auf `aa72d10`.

**Offene Fragen an die Menschen (Runde 10, Empfehlung zuerst):**
- **„Daily Pack“ = Starter-Paket?** Eine echte Tagesbelohnung gibt es im Code nicht; P3 hat das Starter-Paket (12 Units + Crystals) als das gemeinte Paket genommen. Empfehlung: so lassen; eine echte Tagesbelohnung wäre Meta-Arbeit (Schema 4) für Runde 11. → **entschieden (Max, 09.10.2026): echte Tagesbelohnung in Runde 11.** *(Überholt durch den Neustart am selben Tag: kommt, wenn überhaupt, mit dem neuen Meta.)*
- **Prüfung Homelab (09.10.2026):** `noro` → Orochimaru ist vermutlich falsch umgemünzt: Noro ist eine echte Figur aus Tokyo Ghoul (Aogiri). Rest der Umgemünzten ok.
- **Shiny:** Anzeige (Glitzer, Ton, Stempel) ist fertig, die Daten kennen aber keine Shiny-Ziehung. Empfehlung: erst nach den echten Bildern als Drop-Chance in die Meta. → **entschieden (Max, 09.10.2026): Shiny-Drop gleich in Runde 11**, unabhängig von den Bildern (Shiny = Glitzer auf demselben Porträt). *(Überholt durch den Neustart: Gacha nur noch für Helden/Skins, später.)*
- **Umgemünzte Figuren** (Liste oben, P1 Phase A): bitte drüberschauen, v. a. die 12 ohne erkennbare AA-Vorlage.

**P1 Phase A in Zahlen:** 575 Zeilen in `docs/aa-import/figuren.json` (550 AA + 25 Crossover), 288 verschiedene echte Figuren hinter den 550 AA-Units (Formen über `form`), keine Dubletten außer Escanor Tag/Nacht (zwei Formen). **Umgemünzt 23 Units** (13 Zielfiguren): Tatara → Ayato Kirishima (Tokyo Ghoul, Serie sicher); ohne erkennbare AA-Vorlage und deshalb auf bekannte Figuren beliebiger Serien gesetzt (`note: unsicher`): Rokuhira → Gintoki Sakata, Osaragi → Spike Spiegel, Noro → Orochimaru, Gaku → Senku Ishigami, Boxxo → Tony Tony Chopper, Honey → Makima, Starlia → Rei Ayanami, Giselle → Mikasa Ackerman, Sato → Sung Jinwoo, Geten → Lyon Vastia, Izumi → Shinobu Kocho, Isharmla → Rem (ausgeblendet). **Weitere unsichere:** `yuma`(+evolved) = Yuma Kuga?, `gogeta_failed` (Benennung), `nokotan` (evtl. zu obskur). Markennamen: Zivilname angezeigt, Marke im Query (Kuzan/Aokiji, Sakazuki/Akainu, Enji Todoroki/Endeavor, Keigo Takami/Hawks, Chizome Akaguro/Stain, Nagato/Pain).


## Kurzbericht Runde 10 (P5, 09.10.2026)

```text
STATUS — Runde 10
Was man jetzt sehen kann (5 Zeilen):
  1. Echte Namen + Serie überall (Son Goku (Super Saiyan 3), Kakashi Hatake, Osamu Dazai …), Sammlung nach Serie
     filterbar, Banner „Legends of Earth“ mit 25 Promis (p1-collection-*, p1-banner-legends, p1-legends-pull10*)
  2. Match: Porträt-Figuren mit Seltenheits-Ring, Pips, Element; Angriffs-Grafik je Form × Element, Schadenszahlen,
     Tod mit Münzen, Fähigkeits-Cut-in, Boss-Banner, Match-Ton (p2-match-mix-*, p2-ability-cutin, p2-boss-*)
  3. Beschwören als Portal mit Seltenheits-Farbe, verdeckte Karten einzeln aufdecken, Übersicht (p3-10pull-0…6, p3-secret-*)
  4. Jede Welt mit eigenem gemalten Kartenbild statt Raster (p4-<welt>-leer/-kampf, 10 Welten)
  5. Hover-/Klick-Ton, hochlaufende Zähler, Stempel für Level-Up/Evolution/Freischaltung, Menü-Musik (p3-levelup, p3-settings-menu-music)
Figuren: echte Namen 550 AA-Units → 288 echte Figuren (Formen über `form`) + 25 Crossover + 25 Promis = 600 Manifest-Einträge;
  umgemünzt 23 (Tatara → Ayato Kirishima; ohne erkennbare Vorlage: Rokuhira → Gintoki Sakata, Osaragi → Spike Spiegel,
  Noro → Orochimaru, Gaku → Senku Ishigami, Boxxo → Tony Tony Chopper, Honey → Makima, Starlia → Rei Ayanami,
  Giselle → Mikasa Ackerman, Sato → Sung Jinwoo, Geten → Lyon Vastia, Izumi → Shinobu Kocho, Isharmla → Rem, je mit Evo);
  unsicher 25 (die 21 Umgemünzten ohne Vorlage + yuma(+evolved), gogeta_failed, nokotan);
  Promi-Banner „Legends of Earth“: 3 Secret (Trump, Musk, Schwarzenegger), 5 Mythic, 7 Legendary, 5 Epic, 5 Rare
  (+ Bud Spencer als 25.), Featured The Rock; Raid-Units nicht mehr im Banner (P0)
Match: Units / Angriffe / Treffer / Ton — was neu ist: Porträt-Figuren statt Initialen-Kreis (lokal Ersatzfigur, mit Bild
  das AniList-Porträt), Platzier-Vorschau + Aufsetz-Effekt, Hieb/Projektil/Strahl/Druckwelle/Fächer/Bahn je Element,
  Krit-Zahlen, Funken, Blinken, Münz-Tod, Cut-in, abschaltbares Ruckeln, Gegner-Figuren je Typ, Boss-Banner,
  synthetischer Match-Ton (echte Dateien optional über /sfx/index.json). 60 FPS nur auf echter GPU prüfbar:
  JS ≈ 1,7 ms/Frame bei 30 Units + 80 Gegnern (Budget 16,7 ms)
Beschwören + Mehrfach-Ergebnisse: Portal/Riss, Farbe vorab Blau → Lila → Gold → Regenbogen, Ruckeln, Durchbruch,
  Enthüllung mit Name/Serie/NEW, Shiny-Glitzer (Anzeige fertig, Daten fehlen), Ton je Stufe, überspringbar;
  10er-Zug, Starter-Paket, Match-/Raid-Belohnung, Kristall-/Raid-Shop: 1 Klick = 1 Karte, Reveal all, Übersicht
Interaktions-Durchgang: 49 Knöpfe, alle mit Reaktion + Ton (Smoke `interactionCase`); fehlte: Paket-Bildschirm
  fürs Starter-Paket (Ursache „nur der erste Gewinn“), Belohnungs-Enthüllung nach Match/Raid, Shop-Enthüllungen,
  Level-Up-/Evolutions-/Freischalt-Stempel, Hover/Klick-Ton, Toast-Ton, Zähler, Menü-Musik — alles nachgerüstet
Für die Homelab-Seite: Manifest mit anilistQuery seit 6bf8594 (jetzt 600 Einträge, Stand cb8c45c), 25 neue
  imageQuery (Wikipedia) für Legends; Asset-Wunschlisten P2/P3 oben (Kenney/OGA/freesound, alles optional);
  /aa/units-lg/<id>.webp (512 px) für die große Enthüllungskarte wäre schön
Vorschlag Runde 11: Welten 11–22 als Daten (gesetzt), damit die Legend Stages ihre echte Welt bekommen. Gegner-Bilder
  bzw. -Figuren mit eigenem Look je Welt-Roster und die Platzierungszonen beim Setzen im neuen Stil. Shiny als
  Drop-Chance und eine echte Tagesbelohnung (Meta, Schema 4), falls Max das will. Unit-Leiste im Match: Abzeichen
  überdecken den Namen, aufräumen. Danach Server/Konto (M2) vorbereiten.
Agenten (Anzahl, Modell), Limits erreicht wie oft: 11 × Sonnet (P1 4, P2 3, P3 2, P4 2), 6 davon am Limit abgebrochen und
  per neuem Sonnet-Agenten mit Übernahme fortgesetzt; 3 Limits (Sitzung 15:4x UTC, Woche 16:4x bei den versehentlich
  per SendMessage auf Opus fortgesetzten Agenten, Sitzung ca. 18:00–21:40 UTC). Opus lief nur in diesem einen
  Fortsetzungsversuch (Falle oben)
Commits: siehe `git log 0e5ca37..dev` (≈ 60, davon 9 Merges)
Tests: sim 393, meta 173 (+1 übersprungen), client 302; Smoke 363 Prüfungen grün auf 1280×720, 1920×1080, 2560×1440
  (+ Rand-/Modi-/Mobil-Fälle); aa-import:check grün, legends:check grün; crossover:check „veraltet“ (nur Feld series, bekannt)
```

## Runde 9 (Fähigkeiten, 10 Welten, Legend/Raids, Interface)

Letzte Aktualisierung: 2026-10-08 (Runde 9 abgeschlossen, P5; Raid-Units aus dem Banner-Pool in Runde 10 / P0 erledigt)

| Paket | Inhalt | Status | Agent (Modell) | Was man jetzt sehen kann |
|---|---|---|---|---|
| P0 | Status, Welt-Freischaltung nach Act 6 | **erledigt** | Hauptsitzung | `unlock.afterAct` = 6 in `walled-city`/`snowy-town` (Max, 08.10.2026), Tests angepasst. Stand vor Runde 9: sim 325, meta 143, client 234 Tests grün |
| P1 | Fähigkeiten, Beschwörungen, Zweitangriffe | **erledigt** | 1 × Sonnet | **542 voll / 5 eingeschränkt / 3 ausgeblendet** (vorher 479/61/10). Aktive Fähigkeiten als Datenbaustein (Knopf/Auto, Abklingzeit, Wirkung aus dem Baukasten), Auren, Zweitangriffe (`levels[].also`), 12 Beschwörungen als eigene Wesen (laufen dem Pfad entgegen und halten auf, oder stehen), 53 Kits in `tools/aa-import/kits.ts`; armin, erwin, eren_final, griffith_reincarnation, hoshino(+evolved), sakura jetzt spielbar. Client: Ring-Knopf mit Abklingzeit in Panel und Unit-Leiste, Auto-Schalter, Taste Q, Beschwörungen auf dem Feld. **Replay v5** (v4 läuft mit gleichem Hash). Kit-Wirkungszahlen sind Annahmen (`unsupported.md`, `report.md`). Screenshots `client/docs/r9/p1-*.png` |
| P2 | Welten 4–10, größere Karten | **erledigt** | 1 × Sonnet | 10 Welten: + Sand Village 22×13, Navy Bay 22×12, Fiend City 24×14, Spirit World 24×14, Ant Kingdom 22×14, Magic Town 24×14, Haunted Academy 24×14 (97 Kacheln Pfad), je 6 Acts + Infinite, AA-Bosse, eigene Farbwelt, Freischaltung nach Act 6. Raster je Stage im Client (Renderer, BoardInput, Mausprobe), Welt 1–3 unverändert 17×11 (Hashes gleich). Weltkarte mit scrollbarer Reiterzeile und Kartenvorschau. Näherungen: `fortify`/`egg_spawner`/Feuer/Eis → armored/shield/fast. Screenshots `client/docs/r9/p2-*.png` |
| P3 | Legend Stages, Raids | **erledigt** | 1 × Sonnet | Weltkarte mit Umschalter Story / Legend Stages / Raids. **8 Legend Stages** (je Host-Welt-Karte, Stage-weite Resistenzen `affinity`, frei nach Act 6 der Host-Welt) zahlen **Evolutions-Material** (8 Sorten); Evolution kostet jetzt zusätzlich Material (Rare 4 … Secret/Exclusive 25). **11 Raids** (20 Wellen, Boss am Ende, frei nach Act 3 der Host-Welt) zahlen **Raid-Marken**, Meilensteine (5 / 10 Siege), garantierte Unit nach 10 Siegen (Spider 15); **Raid-Shop** mit 21 Angeboten. Profil-**Schema 3** (`inventory = { raidMarks, materials }`, Migration 2 → 3). Alles aus dem nachgerechneten Replay. Startwerte in `meta/data/{modes,materials,raid-shop}.json`, Doku `docs/aa-import/modi.md`. Screenshots `client/docs/r9/p3-*.png` |
| P4 | Interface komplett | **erledigt** | 1 × Sonnet | Alle Bildschirme außerhalb des Matches im Dusk-Gilt-Look: Einstellungen (Vollbild, Regler/Schalter), Hilfe (Tastenkappen, Ablauf, Bodenarten, Seltenheits-Legende), Pause mit Lauf-Chips, Ergebnis mit Siegel/Kacheln/MVP-Karte/Belohnungen, Kristall-Shop (Mock), Credits, Team, Stufenwahl, Ladefehler; Lobby mit großer Anführer-Karte und neuem Untertitel. Alte Grenzgilde-Texte raus (Test `r9-p4-texte`); grep-Rest nur Boss-Schild-Mechanik (`ward` intern, Text „Shield“) und „Duskwardens“. client 237 Tests, Smoke 1280×720 grün (121). Screenshots `client/docs/r9/p4-*.png`. Noch alt: Spielfeld-Kacheln/Sprites |
| P5 | Abschluss | **erledigt** | Hauptsitzung | Merges P4 → P2 → P1 → P3 ohne Konflikte. Nacharbeit: Ersthinweis wurde erst im ersten Frame gefüllt, Smoke bei 1920/2560 reproduzierbar rot → `App.bind()` zeigt ihn sofort (`6352522`). Kurzbericht unten |

Plan: P1, P2, P4 parallel in lokalen Worktrees (max. 3 Agenten, nur Sonnet), P3 sobald P1 gemerged ist. `sim/`-Kern ändert P1; P2 nur Weltdaten + Kartenraster; P4 nur `client/` ohne Match-Kern. Screenshots in `client/docs/r9/`.

## Kurzbericht Runde 9 (P5, 08.10.2026)

```text
STATUS — Runde 9
Was man jetzt sehen kann (5 Zeilen):
  1. Fähigkeiten im Match: Ring-Knopf mit Abklingzeit in Panel und Unit-Leiste, Auto-Schalter, Taste Q;
     Beschwörungen (Lucy, Erwin, Eren, Lelouch …) laufen dem Pfad entgegen und halten auf (p1-match-ability-*)
  2. Weltkarte mit 10 Welten (scrollbare Reiter, Kartenvorschau), ab Welt 4 Karten bis 24×14 (p2-worldmap, p2-match-*)
  3. Umschalter Story / Legend Stages / Raids, Raid-Match, Raid-Shop, Evolution mit Material (p3-*)
  4. Einstellungen, Hilfe, Pause, Ergebnis mit Belohnungskacheln, Kristall-Shop, Credits im Dusk-Gilt-Look (p4-*)
  5. Lobby mit großer Anführer-Karte und neuen Texten, keine Grenzgilde-Reste mehr
Units: voll / eingeschränkt / ausgeblendet: 542 / 5 / 3 (vorher 479 / 61 / 10), + 25 Crossover.
  Eingeschränkt: usopp_ts(+evolved) Fallen-Obergrenze, sakura Heilung, hoshino_evolved Kosten-Rabatt, eto_evolved Kill-Bonus.
  Ausgeblendet: isharmla, isharmla_evo, mahoraga (AA liefert keine Werte). Wirkungszahlen der 53 Kits sind Annahmen.
Welten spielbar, Kartengröße: 10 — Greenie, Walled City, Snowy Town (17×11), Sand Village 22×13, Navy Bay 22×12,
  Fiend City 24×14, Spirit World 24×14, Ant Kingdom 22×14, Magic Town 24×14, Haunted Academy 24×14;
  je 6 Acts + Infinite, Freischaltung nach Act 6 der Vorwelt
Legend Stages, Raids: 8 Legend Stages (Material für Evolution), 11 Raids (Marken, Shop, garantierte Unit), solo
Interface: was noch alt aussieht: Spielfeld-Kacheln und Gegner-Sprites (Pixel-Look aus Runde 1–7);
  Fähigkeiten in der Sammlung nur als Wertezeile, kein eigener Block; Weltkarte Raids/Legend unten viel Leerfläche
Neue imageQuery-Einträge für die Homelab-Seite: keine (Manifest unverändert; Beschwörungen zeigen Initialen-Figur)
Vorschlag Runde 10: Welten 11–22 als Daten nachziehen (dann bekommen die Legend Stages ihre echte Welt) und
  Gegner-Eigenschaften aus AA (fortify, egg_spawner, Feuer/Eis, Beschwörungen angreifen) in den Kern. Spielfeld
  und Gegner grafisch auf den neuen Look heben (Kacheln, Sprites, Boss-Phasen). Fähigkeiten in der Unit-Detailseite
  als eigener Block, Raid-Units aus dem Special-Banner nehmen. Danach M2 (Server, Koop) vorbereiten.
Agenten (Anzahl, Modell), Limits erreicht wie oft: 4 × Sonnet (P1, P2, P4 parallel, dann P3); einmal Nutzungslimit
  (alle drei gleichzeitig, ca. 03:00–06:40 UTC), Stand gesichert und fortgesetzt
Commits: 34 auf dev seit dem Auftrag (443803d), davon 4 Merges
Tests: sim 381, meta 168 (+1 übersprungen: Speicherstand-Werkzeug), client 252; Smoke 323 Prüfungen grün
  auf 1280×720, 1920×1080, 2560×1440 (Endstand mit P3); aa-import:check grün
```

**Offene Fragen an die Menschen (Runde 9, Empfehlung zuerst):**

**Entschieden (Max, 08.10.2026): alle fünf Empfehlungen übernommen.** Raid-Units kommen in Runde 10 aus dem Banner-Pool (nur Raid/Shop).

- **Host-Welten der Legend Stages:** 7 von 8 laufen auf einer thematisch passenden der 10 Welten, weil ihre AA-Welt noch fehlt. Empfehlung: so lassen, bis die Welten 11–22 als Dateien da sind (dann eine Zeile je Stage).
- **Raid-Garantie nach 10 Siegen** (Spider 15, einzige belegte AA-Zahl). Empfehlung: so lassen; Alternative einheitlich 15.
- **Material-Kosten der Evolution** (Mythic 15 Stück): Empfehlung nach dem Playtest justieren, nicht messen.
- **Raid-Units im Special-Banner:** in AA `hideFromBanner`, bei uns ziehbar. Empfehlung: aus dem Pool nehmen, nur über Raid/Shop (Runde 10).
- **Fähigkeits-Wirkungen** (Domain x1,5, Zeitstopp-Dauer …) sind geschätzt, AA nennt nur Namen und Abklingzeit. Empfehlung: nach Gefühl im Playtest melden, wir stellen in Daten nach.

## Runde 8 (AA-Import)

Letzte Aktualisierung: 2026-10-08 (Runde 8 abgeschlossen, P5)

| Paket | Inhalt | Status | Agent (Modell) | Was man jetzt sehen kann |
|---|---|---|---|---|
| P0 | Status | **erledigt** | Hauptsitzung | Runde 7 abgeschlossen (Kurzbericht unten), Kurswechsel gelesen. Stand vor Runde 8: sim 290, meta 105, client 198 Tests, smoke 299 Prüfungen grün |
| P1 | Baukasten im Simulator (Angriffsformen, Stufen-Angriffe, Damage-Typen, Elemente, Crit, 22 Effekte, Maßstab) | **erledigt** | 1 × Sonnet, allein | Eine Unit ist ein Datensatz (`sim/data/units/*.json`, AA-nahes Format, `docs/aa-import/format.md`): 5 Angriffsformen, Treffer-Teilung, Angriffswechsel je Stufe, physical/magic/true, Schwächen/Resistenzen, Crit, alle 22 AA-Effekte (0 No-op; Lücken in `unsupported.md`). **Alle 550 AA-Units und 1098 Angriffe parsen und laufen ohne Umbau** (Test), `sample.json` hat 26 echte AA-Units. Maßstab AA 1:1 (5 Studs = 1 Kachel, 1 Yen = 1 Münze, `massstab.md`), Standard20 Normal: Goku SSJ3 (Mythic) gewinnt allein. Nur noch ein Unit-Pfad (die 14 alten Units, Auren/Fähigkeits-Knöpfe, Bot-Messreihen und `sanity/` entfernt), Replay **v4** (v1–v3 = „altes Regelwerk“), Fallback-Figur im Match (Kreis, Element-Farbe, Initialen). Tests: sim 290, meta 105, client 199, Smoke grün. Screenshots `client/docs/r8/p1-match-*.png` |
| P2 | Importer (561 Units, Evolutionen, Traits, Banner, Bild-Manifest) | **erledigt** | 1 × Sonnet | `npm run aa-import` (`tools/aa-import/`) schreibt `sim/data/units/aa.json` (550 Units + 11 Beschwörungen nicht importiert; 479 voll, 61 eingeschränkt, 10 ausgeblendet = 98,2 % spielbar), `meta/data/aa/{evolutions,traits}.json`, `client/public/aa/manifest.json`, `docs/aa-import/report.md`. Gacha mit 6 Seltenheiten (Standard, Special mit Featured Goku SSJ3, Starter), `evolve`/`rerollTrait` in meta + Backend, Trait-Wirkung über `UnitMod` (Schaden/Reichweite/Tempo), Migration Schema 1 → 2 (Runde-7-Units gegen Crystals/Gold erstattet), Starter-Geschenk mit 12 AA-Units, `view/portrait.ts`. **Was man sehen kann:** Summon mit 10er-Zug aus AA-Units, Sammlung mit 550 Units, Match mit importierten Units (`client/docs/r8/p2-*.png`). Offen für Menschen: Raten/Kosten sind Startwerte |
| P3 | Welten, Acts, Maps (≥ 3 spielbar) | **erledigt** | 1 × Sonnet | Weltkarte (Lobby → Play) mit 3 spielbaren Welten à 6 Acts + Infinite, je eigene Karte und Farbwelt: Planet Greenie (Spirale), Walled City (enge Schlangenlinie, Schild ab Act 4), Snowy Town (Hufeisen um den Dorfkern, Regen ab Act 4); AA-Bosse und Act-Titel aus `enemies.json`, 6 Boss-Kits (4 neue, Daten). Neue Welt = nur Datei in `sim/data/worlds/` ([welten.md](aa-import/welten.md)). Acts schalten nacheinander frei (Welt 2/3 nach Act 3 der Vorwelt, Infinite nach Act 3), Erst-Clear 80 Crystals + 50 XP, Wiederholung 20; Infinite zahlt AA-Gems; Legend Stages (8) und Raids (11) als Daten-Gerüst, in der Weltkarte als „Coming later“. Belohnung aus dem Replay (Stage kommt aus dem Replay, `stage-locked`). Tests: sim 314, meta 119, client 205, Smoke grün. Screenshots `client/docs/r8/p3-*.png` |
| P4 | Interface-Neubau | **erledigt** | 1 × Sonnet | Neuer Look „Dusk Gilt“ (`docs/design/ui.md`): Tokens, gebündelte Schriften, Kit (`client/src/ui/kit/`: Panel, Seltenheits-Rahmen mit animiertem Mythic/Secret, Porträt-Karte mit gestalteter Ersatzkarte, Kachel, Chips, Icons). **Lobby** als Hub (Dämmerungs-Hintergrund mit Funken, Team-Anführer als große Karte, Menü-Kacheln), **Summon** mit Banner-Bühne und Featured-Karten, **Zieh-Animation** (Siegel, Lichtsäule in Seltenheitsfarbe, Rampenlicht ab Legendary, überspringbar, 10er-Übersicht), **Sammlung** virtuell (561+ Units) mit Suche/Filter/Sortierung (Seltenheit, Element, Platzierung, DPS), Detail mit Werten je Stufe und Angriffsform-Vorschau (Evolution/Trait-Reroll gesperrt bis P2), **Match-HUD** mit Wellenleiste, Porträt-Unit-Leiste, Upgrade alt → neu. Nach dem Merge mit P2/P3: Weltkarte und Act-Auswahl im Kit, Trait-Reroll und Evolution in der Detailseite verdrahtet (Kosten, Zutaten, kurze Animation), Porträts über Manifest und `/aa/index.json`, Sammlung mit den echten 540 Units. Screenshots `client/docs/r8/p4-*.png` |
| P6 | Crossover-Figuren (25) | **erledigt** | 1 × Sonnet | `sim/data/units/crossover.json`: 25 Figuren (3 Rare, 4 Epic, 5 Legendary, 8 Mythic, 5 Secret; IDs `x_*`) nur als Daten, 72 Angriffe aus dem Baukasten (Rick Astley = Confused, Shrek = Slow-Fläche, Iron Man = hybrid, `line` + `circle` mit Hits, Doge = Wild Card, Neo = Timestop, Wick = Bleed + OverCrit …), Angriffswechsel je Stufe, Flavor-Satz je Figur (`flavor` zeigt die Unit-Detailansicht). Werte aus der Median-Stufenkurve der Seltenheit (`tools/aa-import/vorlage.ts`, `npm run crossover:vorlage`), Prüfung gegen das AA-Band P5..P95 (`npm run crossover:check`). Eigenes **Crossover-Banner** (`meta/data/banners/crossover.json`, Pool `crossover`, Featured Rick Astley, Pity Mythic 100); Crossover-Figuren sind nur dort ziehbar. Bild-Manifest: 25 Einträge `source: "custom"` + `imageQuery` (Importer übernimmt sie). Anleitung [neue-unit.md](aa-import/neue-unit.md). Tests: sim 325, meta 143, client 208. Zu sehen: Crossover-Tab im Summon mit Raten, Sammlung/Detail mit Flavor, Match mit 8 Crossover-Figuren, `client/docs/r8/p6-*.png` |
| P5 | Abschluss | **erledigt** | Hauptsitzung | Merges (P3 → P2 → P4 → P6, Konflikte in Backend-Typen, meta-Exporten, Smoke, Styles), Kurzbericht unten. Screenshots in `client/docs/r8/` |

Plan: P1 allein. Danach P2, P3, P4 parallel in Worktrees, P6 sobald P2 gemerged ist. Keine Balance-Messreihen, Bots nur Rauchtest, jedes Paket mit Screenshots in `client/docs/r8/`.

## Kurzbericht Runde 8 (AA-Import, P5, 08.10.2026)

```text
STATUS — Runde 8 (AA-Import)
Was man jetzt sehen kann:
  1. Neuer Look „Dusk Gilt": Lobby als Hub mit Team-Anführer, Menü-Kacheln, Kontostände (p4-lobby.png)
  2. Summon mit 4 Bannern (Standard, Special, Starter, Crossover), Siegel-/Lichtsäulen-Reveal je Seltenheit,
     10er-Übersicht als Karten, Raten und Pity weiter sichtbar (p4-summon, p4-reveal-*, p4-pull10*, p6-*)
  3. Sammlung mit 565 ziehbaren Units (540 AA + 25 Crossover), virtuelles Raster, Filter/Sortierung,
     Detail mit Werten je Stufe, Angriffsform-Vorschau, Trait-Reroll und Evolution (p4-collection, p4-unit-*)
  4. Weltkarte mit 3 Welten à 6 Acts + Infinite, eigene Karten und Farbwelten (p4-world, p3-match-world1..3)
  5. Match mit AA-Units, Effekten und Angriffsformen, neues HUD (p1-match-combat, p4-match-hud)
Units: 561 AA-Einträge → 550 importiert (11 Beschwörungen sind keine Units), 540 spielbar (98,2 %),
  davon 479 voll, 61 mit Einschränkung (Summons 25, Zweitangriff 15, aktive Fähigkeit 14, Rest klein);
  10 ausgeblendet (kein Angriff, kein Einkommen). Details docs/aa-import/report.md
Crossover-Figuren (25, sim/data/units/crossover.json, Banner „Crossover", Featured Rick Astley):
  Rick Astley, Iron Man, Shrek, Gandalf, John Wick, Doge, Gigachad, Mario, Darth Vader, Neo u. a.
  (3 Rare, 4 Epic, 5 Legendary, 8 Mythic, 5 Secret), Werte aus der Median-Stufenkurve der AA-Seltenheit
Effekte: alle 22 AA-Effekte umgesetzt, 0 No-op; Lücken auf Unit-Ebene (aktive Fähigkeiten, Summon-Körper,
  Fallen, Auren) in docs/aa-import/unsupported.md
Welten spielbar: 3 (Planet Greenie — Spirale, Walled City — Schlangenlinie mit Schild ab Act 4,
  Snowy Town — Hufeisen mit Regen ab Act 4), je 6 Acts mit AA-Boss; Infinite in der Lobby;
  Legend Stages (8) und Raids (11) als Daten-Gerüst
Maßstab: AA 1:1 — 1 Yen = 1 Münze, 5 Studs = 1 Kachel, Start 3000 Yen, Wellenbonus 500 + 150·n,
  Gegner-HP Basis 300 mit Kurve je Stufe, Verkauf 25 % (docs/aa-import/massstab.md)
Interface: Design-System mit Tokens und Kit (ui/kit), Schriften Cinzel/Manrope/Rajdhani,
  animierte Seltenheits-Rahmen (Mythic/Secret/Exclusive), Porträt-Karten mit gestalteter Ersatzkarte,
  Porträts aus /aa/units/<id>.webp über Manifest + /aa/index.json (lokal nur Ersatzkarte)
Bekannte Lücken:
  - aktive Fähigkeiten (Knopf/Cooldown), Beschwörungen, Zweitangriffe fehlen (≈ 54 Units eingeschränkt)
  - nur 3 von 22 Welten; Karten fest 17×11 Kacheln
  - Einstellungen, Credits, Hilfe, Pause tragen nur die Farbwelt, sind nicht neu gestaltet
  - Raten, Preise, Evolution-/Reroll-Kosten sind Startwerte; Hard/Nightmare im AA-Maßstab nicht neu eingestellt
  - Crossover-Porträts fehlen noch (Homelab-Seite nach imageQuery im Manifest); 88 AA-Porträts fehlen auf der Preview
  - Smoke-Screenshots p1-smoke-*/p3-smoke-* zeigen teils noch den alten Look (Smoke schreibt sie bei Bedarf neu)
Vorschlag Runde 9: Aktive Fähigkeiten als Baukasten-Baustein (Knopf, Cooldown, Wirkung aus Daten) und
  Beschwörungen, damit die letzten ~54 eingeschränkten Units voll laufen. Weitere Welten per Daten
  (Ziel 8–10 von 22), dazu ein dynamisches Kartenraster für größere Maps. Legend Stages und Raids
  spielbar machen. Im Interface die restlichen Bildschirme (Einstellungen, Pause, Hilfe) nachziehen und
  im Match Fähigkeits-Knöpfe und Boss-Phasen im neuen Stil.
Agenten: 6 × Sonnet (P1 allein, dann P2/P3/P4 parallel, dann P6; P4 hat zusätzlich dev gemerged);
  dreimal am Nutzungslimit abgebrochen und mit gesichertem Zwischenstand fortgesetzt
Commits: 12 auf dev seit dem Auftrag (af9aa71)
```

**Offene Fragen an die Menschen (Runde 8, mit Empfehlung):**
- ~~Welt-Freischaltung~~ **entschieden (Max, 08.10.2026): wie AA nach Act 6 der Vorwelt** (gegen die Empfehlung). Umsetzen in Runde 9: `unlock.afterAct` = 6 je Welt-Datei.
- Übrige offene Fragen Runde 8: Empfehlung „so lassen“ gilt, bis Max etwas anderes sagt.
- **Raten und Kosten** (Standard Mythic 1,3 % statt AA 0,25 %, Evolution Gold + Crystals statt AA-Items): Startwerte. Empfehlung: erst nach dem Spielen anfassen.
- **Runde-7-Spielstände** werden migriert (alte Units gegen Crystals erstattet, Team leer, Starter-Units neu, ohne zweite 450 Crystals). Empfehlung: so lassen.
- **Neue Units ohne Start-Trait** (erst per Reroll). Empfehlung: so lassen.

## Runde 7 (abgeschlossen)

Letzte Aktualisierung: 2026-10-07 (Runde 7 abgeschlossen, P7)

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Status | **erledigt** | Hauptsitzung | Runde 6 abgeschlossen (Kurzbericht unten): freie Platzierung, kein Typ-Limit, Stufen 100/70/26, offen Blaster-Pflicht (wird in P6 über eine zweite Boden-AoE gelöst). Stand vor Runde 7: sim 265 Tests, client 139 Tests, smoke grün |
| P1 | Datenmodell, Backend-Schnittstelle, Speicherstand | **erledigt** | 1 × Sonnet, allein | Neuer Workspace `meta/` (Profil-Schema v1 mit Ledger/Idempotenz/Migration/Export, Platzhalter für P2/P3/P5 laufen schon; Dateigrenzen und Besitzer in `meta/README.md`) und `client/src/backend/` (`Backend`, `LocalBackend`, `storage.ts` IndexedDB → localStorage → Speicher, `getBackend()`); Hinweis „Test build …“ unten links. 39 meta-Tests, +12 client-Tests (151), sim unverändert (265). TODO-Kommentare am Kopf der Platzhalterdateien nennen, was P2/P3/P5 füllen |
| P2 | Unit-Level und Sterne im Simulator, Replay v3 | **erledigt** | 1 × Sonnet | `sim/data/progression.json` (Level 1–40 +2,5 %/Level, Sterne 1–5 bei 1/2/4/8/16 Kopien +0/5/10/15/20 %, Stern 1 neutral; max/fresh = ×2,175), `sim/src/progression.ts` (`damageBpFor`, `metaProfileMods`), Wirkung über `lvlBp`. `meta/src/stars.ts` + `unit-mods.ts` gefüllt. `Session(…, unitMods)` + Recorder, **Replay v3** (`unitMods` im Kopf, v2 spielbar, v1 Exit 3), Beispiel `beispiel-v3-bot-hard-mid.json`. Bots/CLI `--meta fresh,mid,max`. Messung: Normal fresh 100 % (= ohne Mods, gleicher Hash); Hard farm/wide fresh 65/58 → mid/max 100; Nightmare 22/25 → mid 90/100, max 98/100 (zu leicht ab mid, offen). sim 278, meta 46, client 152 Tests grün. [kalibrierung.md § Runde 7 — P2](balancing/kalibrierung.md), [sim/README.md](../sim/README.md) |
| P3 | Gacha und Mock-Shop | **erledigt** | 1 × Sonnet | Banner `standard` (rec 13: 50/450, 70/25/4/1, harte Pity 150 Mythic / 35 Legendary+), `starter` (einmalig, 10er 225, mind. Epic+), `featured-example` (nur Format, inaktiv); alles als Startwerte markiert, `ratesVersion` + `ratesHash` in jeder Ziehung. `bannerView(banner, profile)` liefert der UI Raten, Pity-Klartext, Pity-Stand, effektive Rate, Erwartungswerte; Anzeige und Wurf gehen über dasselbe `resolveBanner`. Exakte Quote per Markov-Kette: Mythic 1,28 % (77,9 Züge, = rec 13), Legendary+ 6,19 %. 1-Mio.-Test je Banner ≈ 0,5 s / 0,7 s. Mock-Shop 500/1200/2600, keine Preise, Ablauf 7.3 lokal mit Mock-Schalter ok/fail/pending/duplicate-event. +26 meta-Tests (65), +6 client-Tests (157). Details [meta/README.md § Gacha und Mock-Shop](../meta/README.md) |
| P4 | Lobby und Meta-UI, Smoke Kreislauf | **erledigt** | 1 × Sonnet | Lobby als Start (Kontostände, Starter-Geschenk, Ladefehler mit Import/Reset, Speicher-Warnung), Summon (Ratentabelle immer sichtbar, Pity auf dem Knopf, Enthüllung per CSS, Verlauf), Units (Raster, Filter, Detail, Level-Up), Team aus der Sammlung, Stage-Auswahl mit Sperrgrund, Belohnung im Ergebnis, Mock-Shop, Settings mit Export/Import/Reset. Backend additiv: `playerView`, `collectionView`, `stageView`, `pullHistory`, `matchSetup` (Team + `unitMods`). **Lücke aus P5 geschlossen:** `rewardFromReplay(…, { bindToProfile })` prüft Team, Mods und platzierte Units gegen das Profil (`unit-mods-mismatch` u. a.). Smoke: ganzer Kreislauf mit echten Mausklicks bei allen 3 Auflösungen (1280×720 voll, die anderen kurzes Match), Neuladen behält den Stand, ca. 8 min, 297 Prüfungen grün. meta 104, client 195 Tests grün. Screenshots `client/docs/screenshot-r7-*.png`. **Offen/Befund:** Wellen ohne Verteidigung rufen zahlt 200 Gold/40 XP in 10 s (siehe Bericht). [client/README.md](../client/README.md), [meta/README.md](../meta/README.md) |
| P5 | Belohnungen und Fortschritt | **erledigt** | 1 × Sonnet | `rewardFromReplay` rechnet das Replay mit der Sim nach (`meta/src/verify.ts`, v2/v3, ca. 70–100 ms), Hash-Abweichung = `replay-mismatch`, keine Buchung; Doppelmeldung = `already-reported`. Werte in `meta/data/rewards.json` (Niederlage gibt Gold + XP nach Welle). Gold-Kurve 40+10·(L−1), Spieler-XP 100+25·(L−1). Starter: 450 Crystals + alle Rare/Epic + Lancer (ohne Legendary schafft kein Bot Normal). Mythic-Erwartung Tag 18–30 bei 4 Siegen/Tag. +20 meta-Tests (59), +9 client-Tests. [balancing/meta.md](balancing/meta.md), [meta/README.md](../meta/README.md) |
| P6 | Sechs neue Units | **erledigt** | 1 × Sonnet | Pool 14: `warden` (Rare, Leak-Schild), `mortar` (Epic, zweite Boden-Fläche), `broker` (Epic, Kopfgeld), `stormcaller` (Legendary, Kette/Luft), `seer` (Legendary, Markierung + Boss-Fenster), `weaver` (Mythic, Tempo-Aura). Blaster-Verbot −7…−30 (vorher −50…−97), keine neue Unit Pflicht (schlechtester Wert Mortar −13), beste Strategie Normal 79 / Hard 58 / Nightmare 17. Seer/Weaver werden von den Bots kaum gekauft (Bot-Befund, Playtest nötig). Entwurf [units-r7.md](design/units-r7.md), Messung [kalibrierung.md](balancing/kalibrierung.md) „Runde 7 — P6“ |
| P7 | Abschluss | **erledigt** | Hauptsitzung | Merges, Nacharbeit (Replay-Fixtures auf 14 Units, Team-Wahl-Altdatei weg, Tastenhinweise 1-6), **Lücke geschlossen**: Wellen-Belohnung nach *gehaltenen* statt gerufenen Wellen (Vorrufen ohne Verteidigung zahlte 200 Gold/40 XP in 10 s). Kurzbericht unten |

Plan: P1 allein. Danach höchstens 4 parallel in Worktrees (P2, P3, P5, P6), danach P4 (braucht die Schnittstellen von P3/P5). `sim/` ändern nur P2 und P6. Die Hauptsitzung merged.

## Kurzbericht Runde 7 (P7, 07.10.2026)

```text
STATUS — Runde 7
Pakete erledigt / offen: P0–P7 erledigt, nichts offen
Abnahmeziele:
  Kreislauf geschlossen: erreicht — Smoke mit echten Mausklicks bei 1280×720 / 1920×1080 / 2560×1440:
    neues Profil → Lobby → Starter-Geschenk → 10er-Zug → Team aus Sammlung → Stage → Belohnung →
    Level-Up (mit dem ersten Gold) → zweites Match → Neuladen: Salden, Sammlung, Pity gleich.
    Abweichung: Level-Up erst nach dem ersten Match (neues Profil hat 0 Gold; davor prüft der Smoke den
    gesperrten Knopf samt Grund). Smoke-Lauf nach allen Merges: 299 Prüfungen grün (EXIT 0); die kurzen
    Matches bei 1920/2560 spielen jetzt bis Welle 8 echt, weil Vorrufen ohne Verteidigung nichts mehr zahlt
  Gacha ehrlich: erreicht — 1 Mio. Würfe Standard (≈0,5 s) und 100 000 Starter-10er innerhalb 5σ der exakten
    Quote (Markov-Kette), Abstand Mythic ≤ 150 / Legendary+ ≤ 35, Pity überlebt Neuladen und Export/Import
  Anzeige = Wirklichkeit: erreicht — bannerView und Wurf gehen über dasselbe resolveBanner (Test), ratesVersion
    + ratesHash in jeder Ziehung
  Meta wirkt im Match: erreicht — Level/Sterne → unitMods (lvlBp), Replay v3 mit Mods im Kopf, bit-genau (Test),
    Belohnung nur, wenn Team und Mods zum Profil passen
  Meta-Abstand: erreicht — max/fresh ×2,175 auf den Schaden (Ziel ≤ ~2,5)
  Erster Fortschritt: erreicht — Starter-Geschenk enthält 450 Crystals (= ein 10er), dazu der Starter-Banner (10er für 225)
  Unit-Pool: erreicht — 14 Units, zweite Boden-Fläche Mortar (Blaster-Verbot jetzt −7…−30 statt −47…−97)
  Speicherstand robust: erreicht — Export → Reset → Import identisch (Smoke + Tests), kaputte/zu neue Daten →
    Meldung mit Import/Reset, Schema-Version + Migration, IndexedDB → localStorage → Speicher (mit Warnung)
  Lizenz: erreicht — alles eigen (Sprites code-generiert)
Währungen und Startwerte:
  Crystals (Gacha, erspielbar + Mock-Shop; = shards in architecture.md §7), Gold (Unit-Level, nur erspielbar)
  Standard-Banner 50 / 10er 450, Rare 70 / Epic 25 / Legendary 4 / Mythic 1 %, harte Pity Mythic 150, Legendary+ 35
    → effektiv Mythic 1,28 % (77,9 Züge), Legendary+ 6,19 % (16,1 Züge)
  Starter-Banner: einmal 10er für 225, mindestens Epic+
  Mock-Shop: 500 / 1200 (+200) / 2600 (+600) Crystals, „Test purchase - no real money", keine Preise
  Belohnungen: Erst-Clear 100/150/200 Crystals, Wiederholung 25 %; Gold/XP je gehaltener Welle + Siegbonus
  Level-Kosten 40 + 10·(L−1) Gold (Team L20 = 14 820, L40 = 53 820); Spieler-XP 100 + 25·(L−1)
  Freischaltung Hard ab Spieler-Level 5, Nightmare ab 25
  Starter-Geschenk: 450 Crystals + alle Rare und Epic + Lancer (9 Units), Team gesetzt
Neue Units:
  warden (Rare, Leak-Schild: fängt je Welle 1–3 nicht-tödliche Leaks ab, nie Bosse)
  mortar (Epic, zweite Boden-Fläche, halber Burn, Luft 50 %)
  broker (Epic, Ökonomie: +20–60 % Kopfgeld im Radius)
  stormcaller (Legendary, Hügel, Kettenblitz, trifft Luft)
  seer (Legendary, Markierung +25 % und Boss-Fenster +10–40 % länger, K5)
  weaver (Mythic, Tempo-Aura 20–48 % langsamer)
Meta-Abstand fresh/max: ×2,175 rechnerisch. Siegquote beste Strategie (farm/wide/aoe, 30 Seeds, 14er-Pool,
  Bots ohne Team-Grenze): fresh 100 / 87 / 23 %, mid 100 / 100 / 100 %, max 100 / 100 / 100 %
  (Normal/Hard/Nightmare). Ab mid ist alles leicht, siehe offene Fragen
Erster Fortschritt: ein 10er-Zug sofort (Geschenk) plus Starter-Banner; nach dem ersten Normal-Sieg 100 Crystals
  dazu. Erstes Mythic (Erwartung) Tag 18–30 bei 4 Siegen/Tag (docs/balancing/meta.md)
Was die Menschen als Nächstes testen sollen:
  1. Neues Profil: Lobby → Geschenk → ziehen → Team → Stage. Ist der Weg ohne Erklärung klar?
  2. Summon-Bildschirm: Sind Raten, Pity und Verlauf verständlich und ehrlich genug? Enthüllung zu lang/kurz?
  3. Neue Units ausprobieren, vor allem Seer, Weaver, Broker, Warden (die Bots nutzen sie kaum, ihr Wert ist
     nur im Playtest messbar)
  4. Export/Import des Speicherstands einmal ausprobieren (Settings), z. B. Browser wechseln
  5. Replays weiter schicken (jetzt v3 mit Level/Sternen)
Vorschlag Runde 8: K4 Bindung (wählbare Perks durch Einsätze) als zweite Fortschrittsachse neben Level/Sternen,
  dazu Tagesaufgaben ohne Streak (100 Crystals für 3 Clears), was das Mythic-Tempo von Tag 18–30 auf die
  Zielspanne 2–4 Wochen zieht. Weil mid/max Hard und Nightmare fast sicher gewinnen, sollte Runde 8 die Stufen an
  das Meta-Niveau koppeln (Empfehlung: Nightmare-Freischaltung an Unit-Level statt nur Spieler-Level, oder
  Stufen-HP etwas höher; grob, Feinschliff nach Playtests). Eine zweite Map (M-B „Die Schleife") lohnt erst,
  wenn die Menschen den Kreislauf gespielt haben; Infinite gehört mit in Runde 8.
Agenten: 6 × Sonnet (P1 allein; dann P2, P3, P5, P6 parallel in Worktrees; dann P4). P6 nach Container-Neustart
  fortgesetzt (Zwischenstand als WIP-Commit gesichert)
Commits: 14 auf dev seit dem Auftrag (92ae0bb)
```

**Offene Fragen an die Menschen (Runde 7, mit Empfehlung):**

**Alle entschieden (Max, 07.10.2026):** „Meta macht Hard/Nightmare zu leicht“ **anders als empfohlen**: keine Kopplung an das Team-Level, sondern Inhalt oben drauf (ENTSCHEIDUNGEN.md § Schwierigkeit). Die übrigen sechs Empfehlungen sind übernommen.

- **Meta macht Hard/Nightmare zu leicht:** Mit mid (Level 20, ★3) gewinnen die Bots Hard und Nightmare fast immer. Empfehlung: erst mit echten Profilen und Playtests anfassen; Hebel wären Nightmare-HP, ein höheres Freischalt-Level oder Stufen, die mit dem Team-Level skalieren. Bis dahin so lassen.
- **Lancer im Starter-Geschenk:** Ohne ein Legendary schaffen die Bots mit dem Starter-Team Normal nicht (Boss W18–20). Empfehlung: Lancer drin lassen; Alternative wäre ein wählbares Legendary zum Start.
- **Mythic-Tempo:** Erwartung Tag 18–30 bei 4 Siegen/Tag (Ziel 2–4 Wochen nur am oberen Rand). Empfehlung: Tagesaufgabe (Runde 8) statt höherer Raten.
- **Starter-Banner ohne Pity** (einmal 10er für 225, nur Epic+-Garantie). Empfehlung: so lassen.
- **Normal mit fresh bei `farm` 77 %** (beste Strategie `wide` 100 %): Broker/Warden konkurrieren im Farm-Bot um Münzen. Empfehlung: lassen (Balance nur grob).
- **„Quit to lobby"** bricht ohne Belohnung ab. Empfehlung: so lassen.
- **Seer und Weaver** kaufen die Bots kaum (0–8 %). Das ist ein Bot-Befund, kein Balance-Befund. Empfehlung: Playtest, dann ggf. Bot-Logik.

## Runde 6 (abgeschlossen)

Letzte Aktualisierung: 2026-10-07 (Runde 6 abgeschlossen, P6)

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Status | **erledigt** | Hauptsitzung | Runde 5 abgeschlossen (Kurzbericht unten). Balance ab jetzt nur grob, ca. 30 min Bot-Messung je Paket |
| P1 | Freie Platzierung im Simulator, kein Typ-Limit, Replay v2 | **erledigt** | 1 × Sonnet, allein | `place` nimmt `x`,`y` (Milli-Tiles). Karte: `pathWidth` + `zones` (Kachelmaske `.` Boden / `h` Hügel / `#` blockiert / `p` Pfad, aus den alten Slots abgeleitet; Altbestand `slots` + `Sim.slotCenters()` bleiben als Daten). Radius 400 (1x1) / 900 (Farm 2x2), Pfadabstand = halbe Breite 500 + Radius. Fehler: `out-of-bounds`, `on-path`, `blocked`, `wrong-zone`, `overlap`, `invalid-position`. `cap` raus (Daten, Schema, Code); `teamSlots` 6 und `teamUnits` 60 bleiben. Bots: Positionssuche auf dem Halbkachel-Raster (Abdeckung gewichtet, Banner nach Zuwachs), eigenes Stückzahl-Limit als Strategie (`botTuning.typeLimit`), `worsePositionBp`. Replay **v2** (`x`,`y`); v1 = „altes Regelwerk (v1, Slots)“, Exit 3; v2-Beispiel vom Simulator erzeugt (`scripts/export-replay.ts`). Bot-Matrix ×1,19 Laufzeit (32,5 → 38,6 s), Stufen wie vorher (farm 100/88/44, wide 99/55/24). 259 sim-Tests + tsc grün. **Client kompiliert bis P3 nicht** (24 tsc-Fehler: `u.slot`, `sim.slots()`, `place`-Befehl, `def.cap`). [kalibrierung.md § Runde 6 — P1](balancing/kalibrierung.md), [sim/README.md § Freie Platzierung](../sim/README.md) |
| P2 | Balance grob (Farm, Spam, Stufen, Max-Replay) | **erledigt** | 1 × Sonnet | Farm-Ertrag ×0,65 (42/75/110/165/240): Hard farm 90 → 64, wide 55 (Abstand 9). Spam: ab dem 6. Exemplar je Typ +10 % Platzierkosten (`economy.placeCostGrowthBp`/`placeCostFreeCopies`, API `sim.placeCost(player, unitId)`): `mono-frost` Normal 100 → 16. Neue Bots `mono-X`/`mono-X+up`. Beste Strategie N/H/NM 100/70/26 (wide 99/55/24). **Offen für Menschen:** Blaster ist Pflicht-Unit (Verbot −50 bis −97), ohne Titan siegen Bots auf Hard zu 95–98 (Titan = Falle). Max-Replay-Analyse (3 Punkte für P4) in `kalibrierung.md`. 265 sim-Tests + tsc grün. [kalibrierung.md § Runde 6 — P2](balancing/kalibrierung.md) |
| P3 | Client: freie Platzierung, Smoke | **erledigt** | 1 × Sonnet | Platzieren per Mausposition (`Session.clickBoard` -> `place {x,y}`), Geist in Unit-Groesse gruen/rot mit Grund (`sim.canPlace`), Reichweitenkreis immer, Zonen-Hervorhebung (Boden tuerkis, Huegel gold) + Abdunkeln, Klick an roter Stelle = Toast mit Grund, Klick auf Unit waehlt, Shift+Klick = nochmal setzen. `ui/slots.ts` + DOM-Slots entfallen, Karte: Huegel als Flaeche, Deko nur auf `#`. Kein `cap`-Text mehr. Replay v2 geprueft, `replay-check` mit echter Maus (Hash OK). Smoke: ganze Partie mit echten Klicks auf freie Stellen, 3 Aufloesungen gruen (1280x720 / 1920x1080 / 2560x1440: Spielende per Niederlage in W10-11, 0 abgelehnte Klicks; der einfache Plan gewinnt nicht), Geist-Status, Pfad-Klick-Toast, Mobil-Gate. 115 vitest-Tests. Details [client/README.md](../client/README.md) |
| P4 | Lesbarkeit und Hilfe im Match | **erledigt** | 1 × Sonnet | Flieger: `FLY`-Symbol in der Vorschau, Hinweis „Flyers incoming - X of your units can hit air“, bei 0 rote Warnung samt Start-Knopf „no anti-air!“ (Luft = `canHitAir` mit Angriff, Banner zählt nicht). Shop: Symbole AIR/AOE/BOSS/SUP/INC aus den Daten (Tooltip in en.ts) und aktueller Platzierpreis `sim.placeCost(0, id)` (orange bei Aufschlag; Fehler-Toast nutzt ihn auch). Hinweise unten links im Feld: „You have coins to spend“ (Leak in den letzten 20 s und Konto > 1,5 × günstigste Team-Unit), „Ability ready“ plus goldenes Plus an der Unit. Boss-Welle: Kurzinfo mit Frost/Titan aus den Daten. Niederlage: drei regelbasierte Tipps (`view/tips.ts`, Recorder-Wellenstatistik, Käufe, Münzen), feste Auffüller statt Zufall. 24 neue vitest-Tests (139 gesamt). Details [client/README.md](../client/README.md) |
| P5 | Grafik-Austausch Kenney (optional) | **übersprungen** (`client/assets/vendor/` fehlt) | – | nur wenn `client/assets/vendor/` liegt |
| P6 | Abschluss | **erledigt** | Hauptsitzung | Kurzbericht unten |

**Offene Fragen Runde 6 (mit Empfehlung):**
- `teamUnits` = 60 (technische Obergrenze): Misst P1 mit Bots **ohne** Bot-Limit, erreicht keiner sie (größter Spitzenwert `wide` 38 Units, `greedy`/`aoe`/`farm` 21–24). Empfehlung: 60 als Sicherung stehen lassen, nach Playtests mit Menschen neu bewerten. Ein Mensch kann sie erreichen (Platz für 60 Striker ist auf der Karte da).
- Die Karte (17 x 11) ist eng für freie Platzierung: Bodenreihen neben dem Pfad nur ca. 0,6 Tiles breit nutzbar, Farms nur rechts außen. Empfehlung: P3 baut die Platzier-Hervorhebung auf den Zonen auf; eine zweite, größere Karte ist ein Thema für M4, nicht jetzt.
- Bot-Befund für P2: Stapeln auf den Innenkurven schlägt Verteilen (Verteil-Abstand/Neuheits-Abschlag machten alle Bots deutlich schwächer); ohne Limit verliert `wide` auf Normal von 99 auf 30 %. Details in `kalibrierung.md` Runde 6 — P1.

## Kurzbericht Runde 6 (P6, 07.10.2026)

```text
STATUS — Runde 6
Pakete erledigt / offen: P0–P4, P6 erledigt; P5 übersprungen (Kenney-Packs nicht im Repo)
Abnahmeziele:
  Freie Platzierung: erreicht (Zonen ground/hill/blocked, nicht auf Pfad/überlappend/außerhalb)
  Kein Typ-Limit: erreicht (cap entfernt, Test mit 15 gleichen Units)
  Keine dominante Strategie (Hard, ≤ ~20): erreicht (farm 64 / wide 55, Abstand 9)
  Stufen grob (beste Strategie / wide): Normal 100/99, Hard 70/55, Nightmare 26/24 → erreicht
    (Hard am oberen Rand, Normal für Bots leicht)
  Spam lohnt nicht allein (≤ ~60 % Normal): mono-X 0 % außer mono-frost 16 %; mit Upgrades
    mono-frost+up 100/70/12 → verfehlt für Frost-Spam mit Upgrades
  Keine Pflicht-Unit (≤ ~30): verfehlt — Blaster-Verbot −50 bis −97; Titan ist für Bots auf Hard
    eher Falle (ohne Titan 90–98 %)
  Lesbarkeit Flieger: erreicht (FLY-Symbol, Hinweis, rote Warnung + Start-Knopf bei 0 Luftabwehr)
  Geld wird ausgegeben: erreicht (Hinweis bei Leak + Münzen > 1,5 × günstigste Unit)
  Smoke: erreicht (echte Mausklicks auf freie Positionen, 1280×720 / 1920×1080 / 2560×1440 bis
    Spielende, 0 abgelehnte Klicks; einfacher Plan verliert W11)
Platzierungsmodell: Kachelmaske 17×11 (ground/hill/blocked/path), Unit-Kreis r 0,4 Tile (Farm 0,9),
  Pfadabstand halbe Breite + r; Gründe out-of-bounds, on-path, blocked, wrong-zone, overlap
Balance (alt → neu): Farm-Ertrag ×0,65 (65/117/176/267/403 → 42/75/110/165/240); Platzierkosten ab
  6. Exemplar +10 % je weiterem; Stufen siehe oben
Analyse Max-Replay: Luftabwehr kam erst W10 (14/26 Leaks Flieger); Ablehnungen (cap, Münzen) nicht
  verstanden; 400–1100 Münzen ungenutzt, Fähigkeiten kaum, Titan nie → in P4 adressiert
Performance Bot-Matrix (alt → neu): 32,5 s → 38,6 s (×1,19); Sim 258k → 230k Ticks/s
Was die Menschen als Nächstes testen sollen:
  1. Normal einmal durchspielen: Fühlt sich freie Platzierung gut an? Ist der Streifen neben dem Pfad zu eng?
  2. Flieger-Warnung vor W8/W16: gesehen, verstanden, rechtzeitig reagiert?
  3. Shop-Symbole (AIR/AOE/BOSS/SUP/INC) und Preisaufschlag ab dem 6. Exemplar: verständlich?
  4. Niederlage-Tipps: passen die drei Tipps zu dem, was schiefging?
  5. Replay nach jeder Runde schicken (jetzt Format v2)
Vorschlag für Runde 7 (M3-Start): Lokaler Speicherstand (IndexedDB, versioniert, Export/Import) als
  Fundament, dann Gacha mit sichtbaren Raten/Pity und Mock-Währung nach architecture.md §7, aber
  clientseitig und klar als „lokal, wandert mit M2 auf den Server" markiert. Unit-Level und Sterne
  als Datenmodell in sim/data, damit die Bots sie mitsimulieren können. Vorher klären: Blaster-Pflicht
  und Titan-Falle (Boss-Design) — beides wird mit mehr Units ohnehin neu bewertet. Größere oder zweite
  Karte erst M4.
Agenten: 4 × Sonnet (P1 allein, dann P2+P3 parallel in Worktrees, dann P4)
Commits: 8 auf dev seit dem Auftrag (c2d79e5)
```

**Offene Fragen an die Menschen (Runde 6, mit Empfehlung):**
- **ENTSCHIEDEN (Max, 07.10.2026): Empfehlung übernommen.** **Blaster ist Pflicht** (Verbot −50 bis −97): Er ist die einzige Boden-Flächen-Unit, die Luft trifft. Empfehlung: nicht jetzt feintunen; mit dem M3-Unit-Pool eine zweite Boden-AoE einplanen.
- **ENTSCHIEDEN (Max, 07.10.2026): Empfehlung übernommen.** **Titan ist für Bots auf Hard eher Falle** (ohne Titan 90–98 %): teuer, und die Boss-Wirkungen lassen sich auch per Frost/Dauerschaden brechen. Empfehlung: so lassen, bis Menschen-Replays zeigen, ob Spieler ihn brauchen.
- **ENTSCHIEDEN (Max, 07.10.2026): Empfehlung übernommen.** **Frost-Spam mit Upgrades** schafft Normal 100 %: Empfehlung: akzeptieren (Upgrades kosten Münzen, das ist eine echte Strategie), mit M3-Units neu messen.

## Runde 5 (abgeschlossen)

Letzte Aktualisierung: 2026-10-07 (Runde 5 abgeschlossen, P7)

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Status, Aufräumen | **erledigt** | Hauptsitzung | `41515c4` (Slot-Fix) ist drin. Stand vor Runde 5: sim 208 Tests + tsc grün, client 37 Tests + tsc + build grün, `npm run smoke` grün (noch mit Selektor-Klicks, Umbau in P1). Bundle: `main` 465 kB (140 kB gzip) |
| P0b | Client aufteilen (`app.ts` 396 Z., `renderer.ts` 433 Z.) | erledigt (nicht committet), `app.ts` 77 Z., `renderer.ts` 89 Z., Besitzer-Tabelle in `client/README.md` | 1 × Sonnet, allein | zuerst |
| P1 | Bedienbarkeit, Smoke mit echten Mausklicks | **erledigt** | 1 × Sonnet | Platzier-Modus (leuchtende/graue Slots mit Grund, Geist + Reichweite am Zeiger, Slot-Typen beschriftet und unterscheidbar), Toasts mit Grund am Zeiger, keine toten Klicks, Rechtsklick/Esc, Auswahl-Panel mit Upgrade-Wirkung alt → neu, 3 Ersthinweise (`localStorage`), Hilfe `?`/`H`, Version unten rechts (Vite-`define`). Smoke: ganze Stage W1–W20 Normal nur per Maus/Tasten bei 1280×720, 1920×1080, 2560×1440 (spielt nicht zwingend bis zum Sieg), Mobil-Gate bleibt. 56 vitest-Tests. Details [client/README.md](../client/README.md) |
| P2 | Playtest-Daten, Replay | **erledigt** | 1 × Sonnet | `game/recorder.ts` (nur am GameBus), `ui/download.ts` (End-Bildschirm-Box + Pause-Knopf), `sim/scripts/replay.ts` (`npm run replay -- DATEI [--compare]`), Abnahme `client/scripts/replay-check.mjs`: echte Browser-Runde → gleicher Hash. Beispiel + README in `docs/balancing/playtests/`. Fremde Dateien minimal: `screens.ts` (1 Zeile), `main.ts` (3 Zeilen), `en.ts`, `styles.css` |
| P3 | Boss-Design, Hard-Kennlinie | **erledigt, Ziele teilweise** | 1 × Sonnet | Zerstörbare Wirkungen (Dauerschaden/Stun/Burst), Rüstungsfenster, Boss-Fokus der Bots. Stufen 92/58/31, Titan-LOO −87 → −24 (Normal), Hard-Kennlinie 13,7 → 18,6. Verfehlt: LOO ≤ 25 für Gunner/Blaster/Lancer/Frost (Luftabwehr-Rolle, nicht Boss). [kalibrierung.md § Runde 5 — P3](balancing/kalibrierung.md), [boss-telegraphs.md](design/boss-telegraphs.md) |
| P3b | Zweite Luft-AoE-Quelle | **erledigt, Ziele teilweise** | 1 × Sonnet | Blaster trifft Flieger mit 75 % Schaden (`airDamageBp`), Frost-Slow 20 → 12 %, Blaster-Slow 10 %, `wide` kauft keine Banner mehr als Füllmaterial, Bounty 8400/8150/8450. `wide` N/H/NM 92/55/30, `aoe`-Bot Normal 81 % (vorher 37). LOO Normal ≤ −18, Nightmare −26 (Frost, Blaster −25), **Hard verfehlt** (Gunner −51, Blaster −53, Frost −45: Elemente). Hard-Kennlinie 13,1 (schlechter). `replay.test.ts` rot bis zum neuen Beispiel-Replay. [kalibrierung.md § Runde 5 — P3b](balancing/kalibrierung.md) |
| P3c | Element-Bonus abschwächen | **erledigt, Ziele teilweise** | 1 × Sonnet | Element-Faktor 1,5/0,5 → 1,2/0,8 (±20 %), Bounty Hard 8150 → 7800, NM 8450 → 8100. `wide` N/H/NM 92/49/31. LOO schlechtester Wert Normal −18, Hard −22 (Frost), **Nightmare −26 (Frost, knapp)**; Gunner nicht mehr Pflicht. Hard-Kennlinie **13,0** (unverändert, Kante kommt vom Team). farm/coop 98/86/48 über dem Korridor (LOO farm: Blaster −78, vermutlich Bot-Pfad). Tests grün. [kalibrierung.md § Runde 5 — P3c](balancing/kalibrierung.md) |
| P4 | Pixel-Grafik | **erledigt (eigene Sprites, keine Packs)** | 1 × Sonnet | Terrassenweg aus Kacheln (Gras, Pfad mit 16 Kantenmasken, Deko, Spawn/Basis), drei Slot-Untergründe auf einen Blick unterscheidbar (graue Steinplatte = Boden, Sockel mit Frontmauer = Hügel, Holzdeck mit Münze = 2×2), 8 Units + 8 Gegnertypen (je 2 Geh-Frames) = 54 Quellbilder, **alle eigen und code-generiert** (`client/scripts/gen-sprites.mjs`). Atlas-Pipeline `build-atlas.mjs` (reproduzierbar, nearest), Figuren ganzzahlig skaliert. Bundle: `dist` 860 kB gesamt, Atlas 10 kB, `index` unverändert. Lizenzen: nur Eigenes, `ATTRIBUTIONS.md`. Screenshots `client/docs/screenshot-p4-*.png`. **Offene Spuren:** CC0-Packs (Kenney Tiny Town/Dungeon, OGA Tiny Creatures, Pixel Frog Tiny Swords) waren aus der Session nicht erreichbar (Proxy 403 auf kenney.nl, opengameart.org, itch.io), nicht umgangen; Homelab-Seite könnte per CT 113 holen. Tile-Größe folgt dem Fenster (nicht ganzzahlig), Einrasten wäre Einzeiler in `renderer.fit` (P0b-Datei) |
| P5 | Spielgefühl, Ton | **erledigt (60 fps nur ohne Software-Renderer nachweisbar, s. u.)** | 1 × Sonnet | **Effekte** (`game/fx.ts`, Logik `view/feel.ts`, nur lesend am Bus + Zustand): Schuss/Aufschlag je Unit (Striker Hieb, Gunner Leuchtspur, Titan Granate, Blaster Geschoss + Flächenblast, Frost Kegel, Lancer Linie), Schadenszahlen (gebündelt, abschaltbar, gold im Fenster, Boss-Heilung grün), Tod mit Zerfall + Münz-Popup, Leak (roter Rand pulsiert, Leben-Anzeige wackelt, Bildschütteln), Boss-Auftritt/Phasenwechsel (Ringe, Schütteln, Banner-Animation), Telegraph mit Schraffur, Countdown, Fortschritt zum Brechen (`tele.dmg/need`, Leiste am Boss + im Banner), Fenster „Panzer offen“ (Platten, `armor 0`) vs. „keucht“, Mend-Sog, `bossCast.cause` als Einblendung. Tracker um `staggerNeed`, `armor`, `lastCast`, `bossArmor` ergänzt. Partikel/Effekte/Zahlen gepoolt und gedeckelt (170/80/44). **Ton:** 26 Klänge + 1 Musik-Loop, **alle eigen**, zur Laufzeit per WebAudio synthetisiert (keine Dateien; Kenney-Packs weiter offene Spur), Drosselung je Gruppe (Treffer-Topf: 55 ms Abstand, max. 5 je 400 ms) + Gedränge-Dämpfung + Begrenzer, Lautstärke `master×sfx` / `master×music` (quadratisch), M = stumm (`dw.muted`), Context erst nach erster Nutzeraktion, `settings.note` angepasst. **FPS** (`npm run perf`: W19, 8 Units Stufe 2, 3×, 1920×1080, Effekte an, headless Chromium mit **SwiftShader, kein GPU**): 5,5–12 fps, die Zeit liegt im Software-Raster (alles ausblenden = 60 fps, Karte allein ≈ 40 ms/Frame), **JS-Anteil je Frame ≈ 1,2 ms** (Fx 0,7, Entities 0,4, Sim 0,3; Budget 16,7 ms) — 60 fps auf echter GPU **nicht gemessen**, nur das CPU-Budget belegt. Bundle: `dist` 0,93 MB gesamt (Ziel < 8 MB), `index` 14,5 kB, `main` 510 kB (154 kB gzip). Tests: `test/p5.test.ts` (Drosselung, Lautstärke, Ereignis→Klang/Effekt, Schuss-Erkennung, Zielwahl, Schadenszahlen, Tracker). Skripte: `perf.mjs`, `shots-p5.mjs`, `audio-check.mjs`, `lib/drive.mjs`. Screenshots `client/docs/screenshot-p5-*.png`. Fremde Dateien minimal: `main.ts` (Ton + Leak-Wackeln), `help.ts` (M), `en.ts`, `styles.css`, `telegraph.ts` |
| P6 | M1-Lücken (Menü, Team 6 aus 8, Einstellungen, Ergebnis) | **erledigt** | 1 × Sonnet | Hauptmenü, Stufe → Team-Wahl, Einstellungen, Credits (`ATTRIBUTIONS.md` per `?raw`), Ergebnis (Welle, Leaks, MVP, Dauer), Pause-Menü. Team nur **Client-Filter** (Sim kennt keine Teams): `session.team`, `session.teamCatalog()`; Sim lässt weiter alle 8 zu. Einstellungen `ui/settings.ts` (Ton baut P5 später). Replay-Slot `.replay-slot` + `replayButton`-Callback. 62 Tests grün |
| P7 | Abschluss | **erledigt** | Hauptsitzung | Kurzbericht unten |

**Offene Spur Assets (06.10.2026):** Aus der Session sind kenney.nl, opengameart.org und itch.io gesperrt (Proxy 403). Über CT 113 (Homelab) sind die Kenney-ZIPs erreichbar, Lizenz CC0 auf der Seite geprüft. Die Homelab-Seite kann sie unverändert unter `client/assets/vendor/kenney/` ablegen (ZIP entpacken, `License.txt` mit), dann tauscht eine spätere Sitzung Platzhalter gegen Pack-Grafik bzw. -Ton:
`https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip` (0,8 MB),
`…/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip` (0,8 MB),
`…/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip` (1,0 MB),
`…/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip` (1,2 MB),
`…/tiny-town/a415fbeb49-1735736916/kenney_tiny-town.zip` (0,2 MB),
`…/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip` (0,1 MB) (Präfix jeweils `https://kenney.nl/media/pages/assets`).
Bis dahin: Grafik und Ton eigen und code-generiert.

**Entscheidung Max (06.10.2026, im Chat):** Flieger-Pulks (W16/W18) bekommen eine zweite Flächen-Antwort statt weniger Pulk-Druck. Umgesetzt in P3b: Blaster trifft Flieger mit 75 % (`airDamageBp`). Das weicht von ENTSCHEIDUNGEN.md („nur Hill/Hybrid treffen Flieger") ab; Max trägt es dort ein, wenn er es so lässt.

Plan: P0b allein. Danach Welle A parallel in getrennten Worktrees: P1, P2, P3, P4. Danach Welle B: P5, P6. Die Hauptsitzung merged.

**Antworten auf die offenen Fragen von Runde 4** (Homelab-Sitzung/Max, 06.10.2026):
- Domain-Betrieb: `cloudflared` läuft auf `edge` als Host-Dienst, Ingress wird bei Cloudflare per API gepflegt. Ziel ist immer `http://127.0.0.1:PORT`, Compose braucht **kein** eigenes Netz für den Tunnel, nur einen auf `127.0.0.1` gebundenen Port. Port vergibt die Homelab-Seite.
- Backup `/data` (ab M2): wie bei den anderen Apps über CT 113 per tar zum PBS, eigene backup-id. Baut die Homelab-Seite; das TD muss nur einen konsistenten Stand liefern (SQLite: Online-Backup oder WAL-Checkpoint, im Deploy-Entwurf beschreiben).
- Koop-Bibliothek (Colyseus vs. `ws`) und bitECS: Entscheidung zu Beginn von M2, nicht jetzt.
- OFL-Schriften: **erlaubt**, siehe ENTSCHEIDUNGEN.md § Grafik-Herkunft.
- EUIPO/USPTO „Duskwardens": macht Max vor einem öffentlichen Release, für die Arbeit kein Blocker.
- Kek-Game-Seite (`/td/launch`, Schlüsselablage, `kid`-Schema): baut die Homelab-Seite zusammen mit M2. Vorschlag aus `architecture.md` (`iss=kek-game`) gilt bis dahin.

Vorab erledigt (Homelab-Sitzung, 06.10.2026): Preview `https://duskwardens.flashkeks.com` (statisch, Access, Betrieb durch Homelab); Slot-Knöpfe lagen in Festkomma statt Kacheln, Units ließen sich nicht setzen → behoben in `41515c4`, Smoke prüft jetzt die Lage der Slot-Knöpfe.

## Kurzbericht Runde 5 (P7, 06./07.10.2026)

```text
STATUS — Runde 5
Pakete erledigt / offen: P0, P0b, P1, P2, P3 (+P3b, P3c), P4, P5, P6, P7 erledigt; Ziele teils verfehlt (unten)
Abnahmeziele (Abschnitt 3):
  Bedienbar ohne Erklärung: Smoke spielt per page.mouse.click + Tastatur über Menü → Stufe → Team
    bis Spielende, 1280×720 / 1920×1080 / 2560×1440 grün. ABER: der einfache Klick-Plan des Smoke
    verliert jedes Mal an W11 (Hollow Warden), W1–W20 wird so nicht erreicht → teilweise
  Keine toten Klicks: erreicht (Toast mit Grund, P1-Tests)
  Replays: erreicht (Browser-Export → npm run replay gleicher Hash, Pause- und Endstand)
  Kein Pflicht-Unit (LOO ≤ 25): Normal −18, Hard −22, Nightmare −26 (Frost; Streuung ±5) → fast erreicht
  Hard-Kennlinie ≥ 20: 13,0 → verfehlt (Final-Boss-Schwelle; Elemente waren nicht die Ursache)
  Stufen im Ziel (wide, normal, n=100): 92 / 49 / 31 → erreicht (Hard am unteren Rand)
  Lesbarkeit: Lineup 1× (screenshot-p4-lineup.png) unterscheidbar → erreicht (Augenmaß, kein Menschentest)
  Lizenzen sauber: erreicht (alle Grafik/Ton eigen, in ATTRIBUTIONS.md; keine Packs eingebunden)
  Performance 60 fps @3× W19: nicht nachweisbar (Sandbox nur SwiftShader: 5–12 fps; JS je Frame ≈ 1,2 ms
    von 16,7 ms) → auf echter GPU von Hand prüfen
  Bundle: dist 0,93 MB, index 14,5 kB → erreicht
Boss-Änderungen und LOO (alt → neu): zerstörbare Wirkungen (staggerBp; Frost-Stun, Nuke oder Dauerschaden
  brechen), Rüstung-0-Fenster, Colossus heilt im Takt; Boss-HP ×11 → ×14, Titan-Nuke 12× → 6,5×;
  Blaster trifft Luft (75 %), Frost-Slow 20 → 12 %, Element-Faktor 1,5/0,5 → 1,2/0,8.
  LOO Titan Normal −87 → −24; Gunner Hard −57 → +7; Frost Normal −92 → −18
Hard-Kennlinie (alt → neu): 13,7 → 13,0
Grafik: 54 Quellbilder eigen (code-generiert), 0 CC0-Packs (Downloads gesperrt, offene Spur oben)
Sounds: 26 Klänge + 1 Musik-Loop, eigen (WebAudio-Synthese)
Replay: Export → Hash-Prüfung grün: ja
Performance (fps bei 3×, W19): Sandbox 5–12 fps (Software-Raster), JS 1,2 ms/Frame
Bundle-Größe: 0,93 MB gesamt, Spiel-Bundle main 512 kB (155 kB gzip), index 14,5 kB
Was die Menschen als Nächstes testen sollen:
  1. Eine Stage Normal ganz durchspielen und das Replay schicken (Ergebnis-Bildschirm → Download)
  2. Hard 2–3 Runden: fair oder frustig? Woran gescheitert? (Freitext im Ergebnis)
  3. Boss W10/W20: Vorwarnung und Fenster verständlich? Brechen per Frost/Titan/Dauerschaden erkannt?
  4. FPS bei 3× in W15–W20 auf dem eigenen Rechner (Chrome-DevTools oder Gefühl)
  5. Slots: Die runden Slot-Platten (P1) liegen über den Slot-Grafiken der Karte (P4) — stört das, oder lieber nur Rahmen?
Agenten: 10 × Sonnet (P0b, P1, P2, P3, P3b, P3c, P4, P5, P6; P1/P3 nach Rate-Limit fortgesetzt), höchstens 4 gleichzeitig
Commits: 21 auf dev seit dem Auftrag (b889a92)
Nächster Schritt: Playtests der Menschen abwarten (Replays nach docs/balancing/playtests/), dann
  (a) Hard-Kennlinie über den Final-Boss angehen, (b) Bot-Messlatte klären (farm/coop über Korridor,
  vermutlich Bot-Artefakt), (c) Slot-Platten mit der Kartengrafik verschmelzen, (d) Kenney-Packs, sobald
  die Homelab-Seite sie ablegt.
```

**Offene Fragen an die Menschen** (mit Empfehlung):
- ~~Bot-Messlatte~~ **entschieden (Max, 07.10.2026): beste echte Strategie**, siehe ENTSCHEIDUNGEN.md § Schwierigkeit. Befund der Homelab-Sitzung: `farm` ist kein Fehler, sondern greedy + Farmen + spätes Verkaufen (`policyBot('farm', {share 0.45, sellLate})`); `coop` solo nutzt dieselbe Politik, daher identische Zahlen. Bots gehen durch dieselbe Befehls-Schnittstelle, können also nicht schummeln. Farm: Einsatz bis Stufe 4 = 2950, Ertrag 403/Wave, Payback ≈ 7 Wellen, Verkauf 40 %. Folge: **Farm-Ökonomie ist auf Hard dominant (86 % gegen `wide` 49 %)**. Nächster Schritt: Farm abschwächen (Ertragskurve der hohen Stufen, Farm-Limit oder geringerer Verkaufswert), dann Hard gegen `farm` kalibrieren, `wide` als zweite Linie berichten.
- ~~Blaster trifft Flieger~~ **übernommen** in ENTSCHEIDUNGEN.md (Max, 07.10.2026).
- Blaster trifft Luft (P3b) weicht von ENTSCHEIDUNGEN.md ab („nur Hill/Hybrid treffen Flieger“). Empfehlung: in ENTSCHEIDUNGEN.md nachtragen (macht Max).

# Runde 4 (abgeschlossen; Balance-Reste gehen in Runde 5 P3 auf)

Zusammenfassung: Leben-System, Schwierigkeit über Regeln, zwei Boss-Kits, Wellenvorschau, Risikokarten, Bot-Fehlerprofile, Architektur, Styleguide, Name „Duskwardens“, spielbares Client-Gerüst. Offen übernommen: Titan als Pflicht-Antwort auf den Colossus, Hard-Kennlinie 13,7, Koop-Fairness Hard/NM (M2).

## Pakete Runde 4

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Archiv, Entscheidungen, gdd, Status | **erledigt** | Hauptsitzung | Runde-3-`run.md` archiviert, ENTSCHEIDUNGEN.md + beantwortete FRAGEN.md abgelegt. Verifikation in eigener Node-Umgebung: `npm ci && npm test && npm run typecheck` → 130/130 grün, tsc sauber |
| P1 | Unit-Rebalance | **erledigt, Ziele teilweise** | 1 × Sonnet | 132 Tests grün. Erreicht: Schaden/Münze solo Faktor 1,6 (vorher 3,5), AoE-Bot Normal solo 52 % (vorher 0), jede Unit ≥ 91 % gekauft, Titan keine Pflicht mehr, LOO Normal ≤ +5. Verfehlt: LOO Hard/NM (+38…+50, Bot-Rollenwahl → P6), Titan als Boss-Killer nicht belegt (Bosse leaken → P4), Frost jetzt Pflicht (Flyer-Pulks), Titan+Lancer+Frost Normal weiter 100 %, 4P regrediert (greedy/wide 0–2 % → P5), HP-Faktoren der Stufen Platzhalter (→ P3). Details [kalibrierung.md § Runde 4 — P1](balancing/kalibrierung.md) |
| P2 | Leben-System, Fail-State | **erledigt** | 1 × Sonnet | 144 Tests grün. Startleben 30 (Team), Leak `max(1, ceil(Basis × RestHP/MaxHP))`, Basis Grunt/Runner 2, Flyer/Splitter 3, Brute 5, Elite 8; Boss-Leak = verloren, Elite = viele Leben (Sofort-Verlust per Daten umstellbar). Boss-HP ×30 → ×10 als **Zwischenstand bis P4**. Bester Bot solo N/H/NM: 95/47/27 → 88/60/35 %. 4P (upgrade) 23/77/30 → P4/P5. Regeneration +2/Wave ist starker Hebel für P3. [kalibrierung.md § Runde 4 — P2](balancing/kalibrierung.md) |
| P3 | Schwierigkeit über Regeln | **erledigt, vorläufig kalibriert** | 1 × Sonnet | 160 Tests grün. Regeln je Stufe in `difficulties.json` (Modifier-Dichte, Wellen-Varianten seeded, Element-Modus, Leben-Überschreibung, `bossAbilityTier` für P4, `rewardBp`), `systems/rules.ts`, Challenges als Datenkonzept. Bester Bot solo N/H/NM: 90/52/27 %. Kennlinie 90→10 %: Normal 15,7, Hard 25,0, Nightmare 23,1 Punkte (Ziel ≥ 25, Normal braucht P6). Nachkalibrieren nach P4-Merge: `sh sim/scripts/sanity/p3-check.sh 60 TAG`. [kalibrierung.md § Runde 4 — P3](balancing/kalibrierung.md) |
| P4 | Boss-Kits, Wellenvorschau, Risikokarten | **erledigt** | 1 × Sonnet | Zwei Kits (Warden W10, Colossus W20) mit Phasen, Telegraph, Fenster, Schild, Beschwörung, Heilung, Sturm; `minDifficulty` je Fähigkeit als Schnittstelle für P3. `sim.previewWave(n)`, 8 Risikokarten, Befehl `chooseCard`, Bot-Suffix `+cards`. Boss-HP x10 -> x11, Titan-Nuke 5x -> 12x: Titan-Bot 88 % gegen 57 % ohne Titan (Boss x11). Bester Bot solo N/H/NM: 90/60/37,5 -> 87,5/42,5/35 %. 169 Tests grün. Fenster werden von Bots genutzt (1,0 -> 7,2 Fähigkeiten/Lauf im Fenster), ändern die Siegquote aber nicht messbar. [kalibrierung.md § Runde 4 — P4](balancing/kalibrierung.md) |
| P5 | Koop-Skalierung | **teilweise, Ziel verfehlt** | 1 × Sonnet | 191 Tests grün. Hebel: HP-Faktor je Spielerzahl als Tabelle `economy.coop.hpTableBp` = 1 / 1,5 / 1,75 / 2,0 (vorher linear 1 / 2,1 / 3,2 / 4,3), Boss-HP getrennt (`bossHpTableBp`) im Kern gebaut, aus. Normal: `aoe` 95/87,5/97,5 (1P/2P/4P, vorher 95/5/0) fair; `upgrade` 60/100/97,5 nicht. Hard/Nightmare im Koop zu leicht (aoe/upgrade 90–100 % gegen 27–52 % solo) → Koop-Tabelle je Stufe nötig. Slot-Hebel gemessen, verworfen (kippt `aoe` gegen `upgrade`). Solo-Zellen bit-identisch. [kalibrierung.md § Runde 4 — P5](balancing/kalibrierung.md); Werkzeug `sim/scripts/sanity/p5-coop.sh` |
| P6 | Fehlermodell Bots, Endkalibrierung | **Teil A erledigt, Teil B teilweise** | 1 × Sonnet | 205 Tests grün, tsc sauber. Boss-Plan für alle Bots (`previewWave`/Kit-Daten, abschaltbar): Wave-10-Boss leakt nie mehr. Drei Profile in `sim/data/botProfiles.json` (Kaufverzögerung, schlechterer Slot, vergessene Upgrades, verspätete Fähigkeiten, Wellenwissen; eigener Bot-PRNG), `getBot('aoe@normal')` bzw. `BOT_PROFILE=normal`. Koop-HP-Tabelle je Stufe (`difficulties.json` `coopHpTableBp`). Solo bester Bot (normal) N/H/NM **85 / 57 / 24** (casual 60/41/19, expert 94/67/31); Daten: Normal `hpBp` 15300, Hard `bountyBp` 10600, Nightmare `bountyBp` 10600. Erreicht: Stufen, dominante Kombi, Kaufquote ≥ 30 %, Schaden/Münze 1,4, AoE-Bot 83 %, Kennlinie Normal 25,7. **Verfehlt:** LOO (Striker +27,5/+22,5 auf Hard/NM, Titan +12,5 auf Normal), Koop fair (nur `aoe`; `upgrade` 4P 95–100), Kennlinie Hard 14,5 / Nightmare 24,4, Stage-Dauer 11,7 min. [kalibrierung.md § Runde 4 — P6](balancing/kalibrierung.md), [report.md § Runde 4](balancing/report.md) |
| P6b | Balance-Reste von Runde 4 | **erledigt, Ziele teilweise** | 1 × Sonnet | 208 Tests grün, tsc sauber. Bester Bot solo (normal, n = 100) N/H/NM **87 / 56 / 27** (Daten: `hard.bountyBp` 10600 → 9500, `nightmare.bountyBp` 10600 → 9550). LOO ≤ +7: Striker-Cap 2 (Bot, `botTuning.earlyCap`), Verbot jetzt über `botTuning.banned` (Proxy-Verbot war Artefakt, Titan ist keine Falle, aber Pflicht). Bedarfsabhängiger Boss-Plan gebaut und gemessen, **aus** (Titan als 7. Typ muss vor Wave 10 gekauft werden, Bedarf dann nicht schätzbar). Bot-Fixes: kein Sparen ohne freien Slot, `makeRoom` (Slot freiverkaufen für den Titan). Koop: Upgrade-Kosten-Tabelle gebaut, gemessen, verworfen; HP-Tabellen neu (Normal 16/20/24 k, Hard/NM 16/20/23 k); fair nur auf Normal (`aoe` 5, `wide` 7,5, `upgrade` 15). Kennlinie Normal 26,7, Hard 13,7 (Final-Boss-Schwelle), Nightmare > 24. [kalibrierung.md § Runde 4 — P6b](balancing/kalibrierung.md), [report.md](balancing/report.md) |
| P7 | Architektur M1 (`docs/architecture.md`) | **erledigt** | 1 × Sonnet | parallel |
| P8 | Art-Styleguide, Asset-Quellen | **erledigt** | 1 × Sonnet | parallel |
| P9 | Name | **erledigt: „Duskwardens“** (Max) | 1 × Sonnet | parallel |
| P10 | Client-Gerüst | **erledigt, Stage von Hand spielbar** | 1 × Sonnet | `client/` (Vite + PixiJS v8 + TS strict): Terrassenweg-Map mit Formen, Platzieren/Upgraden/Verkaufen, Wellenstart, Vorschau, Risikokarten, Boss-Telegraph (roter Ring + Countdown), 1×/2×/3×, Stufenwahl, Sieg/Niederlage, Desktop-Sperre vor dem Bundle. 37 vitest-Tests, Smoke mit Playwright grün (Screenshots `client/docs/`). Sim unverändert (Browser-Anbindung über Alias-Platzhalter für `node:fs`). Details [client/README.md](../client/README.md) |
| P11 | Abschluss (Sitzung 1) | **erledigt** | Hauptsitzung | Kurzbericht unten; Runde 4 bleibt offen (Reste P6, P10) |

## Nächster Schritt (Runde 4)

P1–P9 und P6b stehen. Balance-Stand: Stufen solo im Ziel (87 / 56 / 27), Leave-one-out ≤ +7, Stage-Dauer entschieden (11–13 min). **Offen aus P6b** (Details und Übergabe: [kalibrierung.md § P6b](balancing/kalibrierung.md)): (1) Hard-Kennlinie 13,7 gegen Ziel 25: Boss-Kit Wave 20 weicher machen (Schild/Heilung), danach Hard neu kalibrieren; (2) Koop fair je Bot nur auf Normal erreicht, Hard/Nightmare brauchen koop-fähige Bots oder Playtest-Daten; (3) Titan bleibt Pflicht-Antwort auf den Colossus (Boss-Design, nicht Plan). **P10 steht** (`client/`, spielbar): als Nächstes von Hand spielen, Playtest-Daten für Hard/Koop sammeln, danach Pixel-Assets (P8-Styleguide) statt Formen und Wellen-/Boss-Feedback (Treffer-Effekte, Sounds). Offen im Client: Koop/Server (M2), Assets, Ton.
Offene Fragen an die Menschen: [architecture.md § 10](architecture.md), OFL-Fonts ([asset-sources.md](design/asset-sources.md)), EUIPO/USPTO für „Duskwardens“.

## Kurzbericht Sitzung 1 (06.10.2026, P11)

```text
STATUS — Runde 4
Pakete erledigt / offen: P0, P2, P3, P4, P7, P8, P9 erledigt; P1, P5, P6 mit Zwischenstand; P10 offen
Abnahmeziele (Profil normal): Stufen solo 85/57/24 erreicht; keine dominante Kombi erreicht;
  Kaufquote >= 30 % erreicht (min. Banner 46 %); Schaden/Münze Faktor 1,4 erreicht (nur 1P);
  AoE-Bot Normal 83 % erreicht; Kennlinie N 25,7 erreicht, NM 24,4 knapp, H 14,5 verfehlt;
  Leave-one-out verfehlt (Striker +27,5 H, Titan +12,5 N); Koop fair nur aoe;
  Stage-Dauer 11,7 min verfehlt (Regelfrage)
Wichtigste Balance-Änderungen: siehe kalibrierung.md § Runde 4 (P1–P6, Nachkalibrierung)
Leben-System: Start 30 (NM 22), Normal +1/Wave; Leak max(1, ceil(Basis × RestHP/MaxHP));
  Boss-Leak = verloren, Elite = 8 Leben nach Rest-HP
Schwierigkeit: Elemente (aus / je Wave / gemischt), Modifier-Dichte (0 / 6 % / 30 %),
  Wellen-Varianten, Boss-Fähigkeiten-Tier 0/1/2, Leben; HP-Spreizung 4,8 %
Architektur/Konto-Vertrag/Mock-Zahlung: Entwurf fertig (architecture.md, deploy/)
Assets: 11 Packs CC0 bestätigt; Eigenzeichnung: 8 Figuren, 7 Gegner, 2 Bosse (zeichenliste.md)
Name: „Duskwardens“ (Max), Domain duskwardens.flashkeks.com eingeplant
Client-Gerüst: ja (P10, spielbar)
Agenten: 9 × Sonnet (höchstens 4 gleichzeitig; P3/P4 in getrennten Worktrees)
Commits: 17 auf dev seit Übernahme
Nächster Schritt: siehe oben
```

---

# Runde 3 (abgeschlossen)

## Pakete Runde 3

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Archiv, Status | **erledigt** | Hauptsitzung | `run.md` Runde 1/2 → `docs/archiv/` |
| P2a | Simulationskern `sim/` | **erledigt** | 1 × Sonnet | 96 Tests grün, Determinismus-Test grün, ~236 000 Ticks/s (20 Waves in 0,08 s); 30 DESIGN-OFFEN in [offene-regeln](balancing/offene-regeln.md); Infinite noch nicht modelliert | Auftrag: Unit-IDs striker, gunner, blaster, banner, farm, lancer, frost, titan |
| P2b | Bot-Strategien | **erledigt** | 1 × Sonnet | greedy, farm, aoe, upgrade, wide, coop; vor Kalibrierung Normal solo: greedy/wide/upgrade 20/20, aoe 11/20, farm 10/20 | nach P2a |
| P2c | Reports und Kalibrierung | **erledigt** | 1 × Sonnet | nach P2a |
| P3 | Content-Sanity | **erledigt** | 1 × Sonnet | Risiken in [report.md](balancing/report.md#risiken): dominante Kombi Titan+Lancer+Frost, Striker als Falle, Messerschneide; Performance unkritisch | nach P2c |
| P4 | Game-Design-Entwurf `docs/design/` | **erledigt** (Werte-Verweise auf sim/data nach P2a prüfen) | 1 × Sonnet | gdd.md 353 Zeilen, FRAGEN.md 10 offene Entscheidungen | parallel zu P2 |
| P5 | Fähigkeiten-Musterkatalog (optional) | **erledigt** | 1 × Sonnet | 16 Muster, Top-8 (DESIGN); Beliebtheit meist UNKNOWN | |
| P6 | Abschluss | **erledigt** | Hauptsitzung | 130 Tests grün, Linkprüfung 0 Fehler | |

## Nächster Schritt (Ende Runde 3)

Runde 3 ist abgeschlossen. Als Nächstes entscheiden die Menschen die Fragen in [design/FRAGEN.md](design/FRAGEN.md). Danach (Vorschlag):

1. Balance-Risiken aus [report.md § Risiken](balancing/report.md#risiken) beheben: Titan/Frost-Dominanz, Striker-Falle, flachere Schwierigkeitskurve (Messerschneide), Koop-Faktor je Spielerzahl. Danach erneut die Matrix laufen lassen.
2. M1 Vertical Slice nach [gdd.md](design/gdd.md): Renderer (Engine laut FRAGEN #7) auf den Simulator `sim/` setzen.

---

# Runde 2 (abgeschlossen)

## Pakete Runde 2

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Aufräumen, Status, Spiele verifizieren | **erledigt** | Hauptsitzung | siehe „Spiele“ |
| P1 | `anime-adventures/design-brief.md` | **erledigt** | 1 × Sonnet | 390 Zeilen, Zahlenbereiche je Rarity aus units.json (Stichprobe geprüft) |
| P2 | Bloons TD6 | **erledigt** | 1 × Sonnet | Runden 1–140 als JSON (RBE, Cash, Bonus; R63 stichprobengeprüft), Startgeld/Leben/Kostenfaktoren, Sell 70 %, Steuerstufen, Freeplay-HP-Rampe, Targeting, 26 Tower | |
| P3 | Roblox-Anime-TDs (ASTD, AV, ALS, UTDZ, AE) | **erledigt** (alle 5) | je Spiel 1 × Sonnet | ASTD: Farm-Kurve, Gacha, Startgeld nur Sondermodi. ALS: Upgrade-Kurven, Verkauf 50 %, Traits; In-Match-Geld und Gegner-HP UNKNOWN. AV: Datenmodule (UnitData 224 Units, EnemyData mit Kill-Yen und HP-Multiplikatoren, TraitValues) | |
| P4 | Vergleich und Empfehlung | **erledigt** | 1 × Sonnet | [systems-matrix](comparison/systems-matrix.md), [numbers](comparison/numbers.md), [recommendations](comparison/recommendations.md) (Startwerte §18, Playtest-Liste §19); Stichproben nachgerechnet | |
| P5 | Vorarbeiten (Technik, Assets, Recht, Balancing) | **erledigt** | 2 × Sonnet (Technik+Assets, Recht+Balancing) | |
| P6 | Abschluss | **erledigt** | Hauptsitzung | Linkprüfung 0 Fehler, alle JSON gültig | |

## Spiele (P0, verifiziert)

Spieldaten aus der Roblox Games API (`games.roblox.com/v1/games?universeIds=…`, abgerufen 2026-10-06) `[V/CONFIRMED]`. „Spielend“ ist ein Momentwert.

| Kürzel | Exakter Name (API) | Entwickler (Gruppe) | Universe-ID | Root-Place-ID | Erstellt | Besuche | Spielend | Ordner |
|---|---|---|---|---|---|---:|---:|---|
| AA | „AA“ (Anime Adventures) | Gomu | 3183403065 | 8304191830 | 2021-12-21 | 2,51 Mrd. | 1 919 | [anime-adventures](anime-adventures/README.md) |
| ASTD | „[OG] All Star Tower Defense“ | Top Down Games | 1720936166 | 4996049426 | 2020-05-07 | 7,93 Mrd. | 1 737 | `games/astd/` |
| ASTD X | „All Star Tower Defense X“ (Nachfolger, gleicher Entwickler) | Top Down Games | 6057699512 | 17687504411 | 2024-06-01 | 0,95 Mrd. | 34 | nur als Fußnote in `games/astd/` |
| AV | „Anime Vanguards: Wrathful Assault“ | Kitawari | 5578556129 | 16146832113 | 2024-01-28 | 2,06 Mrd. | 20 534 | `games/anime-vanguards/` |
| ALS | „Anime Last Stand“ | [B:S] ALS Team | 4509896324 | 12886143095 | 2023-03-24 | 1,08 Mrd. | 17 | `games/anime-last-stand/` |
| UTDZ | „Universal Tower Defense Z“ | Universal Tower Defense [UTD] | 7488190691 | 133410800847665 | 2025-04-04 | 0,30 Mrd. | 104 | `games/utdz/` |
| AE | „Anime Expeditions“ | Expeditions Entertainment | 7613921865 | 84515722934860 | 2025-04-28 | 0,80 Mrd. | 3 838 | `games/anime-expeditions/` |
| BTD6 | Bloons TD 6 | Ninja Kiwi | Steam-App 960090 | – | 2018 | – | – | `games/btd6/` |

Namensvetter (geprüft, **nicht** gemeint):
- „All Star Tower Defence“ (Universe 2436937296): Kopie eines Einzelnutzers, 125 000 Besuche.
- „All Star Tower Defense X“ ist der Nachfolger vom selben Studio, aber deutlich weniger aktiv; ausgewertet wird das OG-Spiel.
- UTDZ ist laut Drittseiten derselbe Place wie das frühere „Universal Tower Defense X“ (UTDX), nur umbenannt (Update 4.0, 2026-07) `[O/MEDIUM]`. Wiki-Material unter `utdx.fandom.com` gilt also für UTDZ.
- „Anime Last Stand“ hat bei 1,08 Mrd. Besuchen nur 17 gleichzeitige Spieler: Das Spiel ist praktisch tot oder abgelöst. Ein Nachfolger wurde nicht gefunden (eine Suche). Es wird trotzdem ausgewertet, mit Fokus auf `design-lessons.md`.

## Offene Spuren

- Recht: GlüStV-Volltext, Google-Play-Primärtext, Web-Plattformregeln (Poki/CrazyGames/itch.io) UNKNOWN; PEGI/Belgien/NL/UK nur aus D-Quellen. Balancing: Kingdom-Rush-Postmortem und Ninja-Kiwi-Interviews nicht gefunden.

- AE: Fandom-Module `AEOfficial/*` (Units, Modifier, Status, Stages); Startgeld, Kill/Wave-Yen, Gegner-HP, Schadensformel UNKNOWN.
- **Querschnitt:** In keinem der fünf Roblox-Spiele sind Startgeld (Normalmodus), Wave-/Kill-Einkommen oder absolute Gegner-HP öffentlich dokumentiert. Belastbare Werte dafür liefert nur BTD6.

- UTDZ: Hauptquelle ist das zweite Wiki `universal-tdx.fandom.com` (Datenmodule, Stand eher Update 2.x–3.x). Startgeld, Kill/Wave-Einkommen, Verkauf, Gegner-HP UNKNOWN. Widersprüche zwischen den beiden Wikis (Bulmo, Zorus).

- BTD6: Preis-Konflikt Preismodul vs. Infobox (Heli 1500/1600, Mortar 600/750, Mermonkey 300/275); Spawn-Timings, absolute Bloon-Speeds, Co-Op-Geldregeln UNKNOWN.

- AV: Startgeld und Wave-Yen, Basis-HP; Wiki-Stat-Chancen summieren sich auf 106,5 %. Kill-Yen aus EnemyData nur O/LOW.

- ASTD: Startgeld/Kill-Cash in Story, Gegner-HP-Formel (Wiki ohne Werte). Wikiwidersprüche: Pity Banner Z 140/120, Gale-Slow-Cap 65/80 %.
- ALS: Startgeld, Gegner-HP, Targeting. Wiki `alsroblox.fandom.com` hat keine Datenmodule. Aura-Farmer-Upgradekosten nicht monoton (Wikifehler?).

- Ob ALS einen Nachfolger hat.

## Ergebnisse Runde 2

| Bereich | Dateien |
|---|---|
| AA-Kurzfassung | [anime-adventures/design-brief.md](anime-adventures/design-brief.md) |
| Steckbriefe | [btd6](games/btd6/overview.md), [astd](games/astd/overview.md), [anime-vanguards](games/anime-vanguards/overview.md), [anime-last-stand](games/anime-last-stand/overview.md), [utdz](games/utdz/overview.md), [anime-expeditions](games/anime-expeditions/overview.md) |
| Vergleich | [systems-matrix](comparison/systems-matrix.md), [numbers](comparison/numbers.md), **[recommendations](comparison/recommendations.md)** |
| Vorarbeiten | [tech-options](research/tech-options.md), [assets-licensing](research/assets-licensing.md), [legal-gacha](research/legal-gacha.md), [balancing](research/balancing.md) |

Agenten: 10 × Sonnet (P1, P2, 5 × P3, 2 × P5, P4), nie mehr als 4 gleichzeitig.

## Nächster Schritt (Ende Runde 2)

Die Recherche ist für den Bau ausreichend. Vorschlag:

1. Prototyp der Simulation nach [tech-options.md §7](research/tech-options.md) mit den Startwerten aus [recommendations.md §18](comparison/recommendations.md#18-startwerte-auf-einen-blick).
2. Ein Balancing-Skript, das die Beispiel-Stage (§5) mit den Startwerten durchrechnet (Einkommen gegen benötigte DPS je Wave), und daraus die Playtest-Liste §19 abarbeiten.
3. Optionale Restrecherche: Startgeld/Wave-Einkommen eines Roblox-Anime-TDs per YouTube-Gameplay (OBSERVED), Co-Op-Geldregeln BTD6.
