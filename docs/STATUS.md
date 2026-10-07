# Status (global)

Arbeitsauftrag: [`/run.md`](../run.md) (**Runde 7**: M3-Start, lokaler Speicherstand, Gacha mit sichtbaren Raten/Pity, Unit-Level/Sterne, Lobby, 6 neue Units). **Verbindlich zuerst:** [design/ENTSCHEIDUNGEN.md](design/ENTSCHEIDUNGEN.md). **Jede Sitzung liest danach diese Datei** und macht beim „Nächsten Schritt“ weiter.
Frühere Aufträge: [archiv/run-runde1.md](archiv/run-runde1.md), [archiv/run-runde2.md](archiv/run-runde2.md), [archiv/run-runde3.md](archiv/run-runde3.md), [archiv/run-runde4.md](archiv/run-runde4.md), [archiv/run-runde5.md](archiv/run-runde5.md), [archiv/run-runde6.md](archiv/run-runde6.md).


## Runde 7

Letzte Aktualisierung: 2026-10-07 (Runde 7 gestartet, P0)

| Paket | Inhalt | Status | Agent (Modell) | Notiz |
|---|---|---|---|---|
| P0 | Status | **erledigt** | Hauptsitzung | Runde 6 abgeschlossen (Kurzbericht unten): freie Platzierung, kein Typ-Limit, Stufen 100/70/26, offen Blaster-Pflicht (wird in P6 über eine zweite Boden-AoE gelöst). Stand vor Runde 7: sim 265 Tests, client 139 Tests, smoke grün |
| P1 | Datenmodell, Backend-Schnittstelle, Speicherstand | **erledigt** | 1 × Opus, allein | Neuer Workspace `meta/` (Profil-Schema v1 mit Ledger/Idempotenz/Migration/Export, Platzhalter für P2/P3/P5 laufen schon; Dateigrenzen und Besitzer in `meta/README.md`) und `client/src/backend/` (`Backend`, `LocalBackend`, `storage.ts` IndexedDB → localStorage → Speicher, `getBackend()`); Hinweis „Test build …“ unten links. 39 meta-Tests, +12 client-Tests (151), sim unverändert (265). TODO-Kommentare am Kopf der Platzhalterdateien nennen, was P2/P3/P5 füllen |
| P2 | Unit-Level und Sterne im Simulator, Replay v3 | offen | 1 × Sonnet | nach P1 |
| P3 | Gacha und Mock-Shop | offen | 1 × Sonnet | nach P1 |
| P4 | Lobby und Meta-UI, Smoke Kreislauf | offen | 1 × Sonnet | nach P1 |
| P5 | Belohnungen und Fortschritt | **erledigt** | 1 × Sonnet | `rewardFromReplay` rechnet das Replay mit der Sim nach (`meta/src/verify.ts`, v2/v3, ca. 70–100 ms), Hash-Abweichung = `replay-mismatch`, keine Buchung; Doppelmeldung = `already-reported`. Werte in `meta/data/rewards.json` (Niederlage gibt Gold + XP nach Welle). Gold-Kurve 40+10·(L−1), Spieler-XP 100+25·(L−1). Starter: 450 Crystals + alle Rare/Epic + Lancer (ohne Legendary schafft kein Bot Normal). Mythic-Erwartung Tag 18–30 bei 4 Siegen/Tag. +20 meta-Tests (59), +9 client-Tests. [balancing/meta.md](balancing/meta.md), [meta/README.md](../meta/README.md) |
| P6 | Sechs neue Units | offen | 1 × Sonnet | nach P1 |
| P7 | Abschluss | offen | Hauptsitzung | |

Plan: P1 allein. Danach höchstens 4 parallel in Worktrees (P2, P3, P5, P6), danach P4 (braucht die Schnittstellen von P3/P5). `sim/` ändern nur P2 und P6. Die Hauptsitzung merged.

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
