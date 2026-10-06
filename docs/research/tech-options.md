# Technologie-Optionen für das Web-Tower-Defense (Recherche)

Stand der Daten: Abruf 2026-10-06. Zahlen (Stars, Lizenz, pushed_at, Release) stammen aus der GitHub-API bzw. der npm-Registry (Quellen siehe Quellentabelle am Ende).
Spalte "Eignung für uns" und alle Empfehlungen sind **Einschätzungen** des Autors, keine abgerufenen Fakten. `UNKNOWN` = Wert nicht ermittelt (nicht auffindbar oder Abruf-Budget aufgebraucht).
Projektannahmen: Browser, 2D oder 2.5D, Anime-Look, Gacha/Unit-Sammlung, später Koop bis 4 Spieler, Inventar serverseitig (Anti-Cheat).

## 1. Rendering / Engine

| Option | Lizenz | Reife | letzter Release (Datum, Version) | GitHub-Stars | Eignung für uns | Quelle |
|---|---|---|---|---|---|---|
| Phaser | MIT | sehr hoch (Repo seit 2013), aktiv; letzter Push 2026-08-21 | 2026-07-09, v4.2.1 | 40.411 | Hoch für 2D: Sprites, Tweens, Audio, Input, Szenen "aus der Box"; Spine/Atlas-Workflow üblich | [S1], [S2] |
| PixiJS | MIT | sehr hoch (seit 2013), sehr aktiv; Push 2026-10-05 | 2026-10-01, v8.22.0 | 48.293 | Hoch: reiner schneller 2D-Renderer, keine Spiel-Logik; mehr Eigenbau (Audio, Szenen), dafür volle Kontrolle und gute Trennung Sim/Render | [S3], [S4] |
| Three.js | MIT | sehr hoch, sehr aktiv; Push 2026-10-05 | 2026-09-24, r186 | 116.265 | Mittel: nur wenn echtes 2.5D/3D (Iso-Kamera, 3D-Modelle) gewollt; größerer Asset-Aufwand | [S5], [S6] |
| Babylon.js | Apache-2.0 | sehr hoch, sehr aktiv; Push 2026-10-05 | 2026-10-01, 9.29.0 | 26.128 | Mittel: vollständige 3D-Engine mit Tools; für reines 2D überdimensioniert | [S7], [S8] |
| Godot (Web-Export) | MIT | sehr hoch, sehr aktiv; Push 2026-10-06 | 2026-08-18, 4.7.2-stable | 118.164 | Mittel/niedrig: starker Editor, aber Web-Export-Größe/Ladezeit und Anbindung an eigenes JS-Backend/UI nicht geprüft (UNKNOWN) | [S9], [S10] |
| Excalibur | BSD-2-Clause | mittel (seit 2013), aktiv; Push 2026-10-05 | 2025-12-23, v0.32.0 (Version < 1.0) | 2.349 | Mittel: TypeScript-first, eingebaute Physik/ECS; kleinere Community | [S11], [S12] |
| Kaplay | MIT | niedrig/mittel (seit 2024); Push 2026-10-04 | 2026-05-12, 4000.0.0-alpha.27.1 (Alpha) | 1.808 | Niedrig: Prototyping-Tool, aktuelle Release ist Alpha | [S13], [S14] |

**Empfehlung Rendering:** PixiJS v8 (2D, Anime-Sprites/Spine-artige Animation, 2.5D über Sprite-Layering) mit eigener, vom Renderer getrennter Simulation. Begründung: MIT, sehr aktiv, hohe Reichweite, schlank. Phaser ist die Alternative, wenn schneller Start mit integriertem Audio/Szenen/Input wichtiger ist als Trennung. Three.js/Babylon nur bei bewusster Entscheidung für echtes 3D. Die Simulation darf **nicht** vom Renderer abhängen (siehe Abschnitt 4 und 5), damit der Server dieselbe Logik headless ausführen kann.

## 2. ECS

| Option | Lizenz | Reife | letzter Release (Datum, Version) | GitHub-Stars | Eignung für uns | Quelle |
|---|---|---|---|---|---|---|
| bitECS | MPL-2.0 (schwaches File-Copyleft) | mittel/hoch; Push 2026-08-24; Version < 1.0 | npm-Latest 0.4.0 (Datum UNKNOWN); GitHub-Releases: keine (404) | 1.515 | Hoch: sehr schnell (typed arrays), serverseitig nutzbar; MPL-Dateien-Änderungen müssten offengelegt werden | [S15], [S16] |
| miniplex | MIT | mittel; letzter Push 2026-04-05 | UNKNOWN (nicht abgerufen) | 1.056 | Mittel: ergonomisch (Objekt-Entitäten), weniger auf Performance getrimmt, React-Fokus | [S17] |
| becsy | MIT | mittel; Push 2026-10-02; Version < 1.0 | npm-Latest 0.16.1 (Datum UNKNOWN); GitHub-Releases: keine (404) | 298 | Mittel: durchdacht (Multithreading, Systemreihenfolge), kleine Community | [S18], [S19] |
| ecsy | MIT | **Archiviert** (`archived: true`) | UNKNOWN | 1.155 | Nein: nicht mehr gepflegt | [S20] |
| Eigener schlanker ECS / Arrays | – | – | – | – | Realistisch: TD hat wenige hundert Entitäten; ein simples Struktur-Array-Modell genügt und ist am leichtesten deterministisch zu halten | Einschätzung |

**Empfehlung ECS:** bitECS (ggf. nach Prüfung der MPL-2.0-Pflichten) oder ein eigener minimaler ECS mit festen Systemreihenfolgen. ecsy ist archiviert und fällt weg. Wichtiger als die Library: stabile Iterationsreihenfolge (Entity-IDs aufsteigend), kein `Map`/`Set`-Zufall, damit die Simulation reproduzierbar bleibt.

## 3. Pfade (Waypoints vs. Grid/Navmesh)

| Option | Lizenz | Reife | letzter Release / Push | GitHub-Stars | Eignung für uns | Quelle |
|---|---|---|---|---|---|---|
| Waypoint-Pfade (eigene Polylinie pro Karte) | – | bewährtes TD-Standardmuster | – | – | Sehr hoch: Gegner folgen vorgegebener Strecke; trivial deterministisch, billig, kein Pfadsuch-Code zur Laufzeit | Einschätzung |
| easystarjs (A* auf Grid) | MIT | Projekt ruhend; letzter Push 2024-01-23 | Release UNKNOWN | 1.937 | Nur für "Maze"-TD (Spieler baut Wege); asynchron, daher für deterministische Sim eher ungeeignet | [S21] |
| PathFinding.js (Grid, mehrere Algorithmen) | **keine Lizenz im Repo** (`license: null`) | ruhend; letzter Push 2024-06-20 | Release UNKNOWN | 8.718 | Lizenzlage unklar: ohne Lizenz nicht ohne Klärung einsetzen | [S22] |
| Navmesh | – | – | – | – | Für TD unnötig (kein freies Gelände); nur bei freier 3D-Bewegung relevant | Einschätzung |

**Empfehlung Pfade:** Waypoint-Pfade (Karten-Datei mit Punktlisten, Fortschritt als skalare Distanz entlang des Pfads). Das ist deterministisch, einfach zu synchronisieren (nur ein Zahlenwert pro Gegner) und ohne Fremd-Library. Ein eigener A* (ein paar Dutzend Zeilen, mit fester Nachbarreihenfolge) nur falls später Maze-Bau kommt; PathFinding.js wegen fehlender Lizenz meiden.

## 4. Deterministische Simulation

| Baustein | Aussage | Reife | Quelle | Eignung für uns |
|---|---|---|---|---|
| Fixed Timestep (Gaffer on Games, "Fix Your Timestep") | Der Artikel beschreibt feste `dt` (z. B. 1/60 s) als Idealfall, aber unrealistisch bei unbekannter Bildwiederholrate; er behandelt Varianten (u. a. Akkumulator). Details über die abgerufenen ersten ~1.500 Zeichen hinaus: UNKNOWN | etabliertes Standardmuster | [S23] | Sim läuft mit festem Tick (z. B. 20/30 Hz), Rendering interpoliert |
| Seeded PRNG | Eigener, im Code festgelegter PRNG (z. B. mulberry32/xorshift/PCG) statt `Math.random`; Seed pro Match, Zustand im Snapshot | Standardtechnik (Einschätzung) | – | Pflicht für Replays und Server-Verifikation |
| Float-Determinismus über Browser | Nicht in dieser Recherche belegt (UNKNOWN). Einschätzung: Grundrechenarten in IEEE-754-Double sind in JS festgelegt; Abweichungen drohen bei `Math.sin/cos/exp/pow` etc. (implementationsabhängig). Gegenmaßnahme: Festkomma/Integer-Mathematik oder nur +,-,*,/,sqrt | – | – | Ganzzahl-/Festkomma-Sim empfohlen, falls Lockstep gewünscht |

**Empfehlung Simulation:** Fester Tick, Integer/Festkomma für alles, was das Spielergebnis bestimmt (Positionen entlang Pfad, HP, Schaden, Cooldowns in Ticks), eigener seeded PRNG, Render-Interpolation nur visuell. Mit autoritativem Server (Abschnitt 5) ist bit-genauer Browser-Gleichlauf nicht zwingend, die Server-Sim ist maßgeblich; Determinismus bleibt aber nützlich für Replays, Tests und Cheat-Prüfung ("Replay-Verifikation" von Ergebnissen).

## 5. Koop-Multiplayer

| Option | Lizenz | Reife | letzter Release (Datum, Version) | GitHub-Stars | Eignung für uns | Quelle |
|---|---|---|---|---|---|---|
| Colyseus | MIT | hoch (seit 2015), sehr aktiv; Push 2026-10-05 | 2026-08-25, 0.18 | 7.335 | Hoch: Node/TypeScript, Räume, Zustandssync, autoritativer Server; passt zu 4er-Koop | [S24], [S25] |
| Nakama | Apache-2.0 | hoch, aktiv; Push 2026-09-28 | 2026-09-18, v3.41.0 | 13.471 | Mittel/Hoch: Komplett-Backend (Accounts, Storage, Matchmaking, Server-Skripte); in Go, höhere Betriebs-Komplexität | [S26], [S27] |
| ws (eigene WebSockets) | MIT | sehr hoch; Push 2026-09-26 | 2026-09-26, 8.22.0 | 22.807 | Hoch bei Eigenbau: minimal, volle Kontrolle; Räume/Sync/Reconnect selbst bauen | [S28], [S29] |
| uWebSockets.js | Apache-2.0 | hoch; Push 2026-10-03 | 2026-09-16, v20.71.0 | 9.164 | Mittel: sehr performant, für 4er-Koop-TD nicht nötig; Installation über GitHub statt npm-Standardweg (Einschätzung) | [S30], [S31] |
| Geckos.io (WebRTC/UDP-artig) | BSD-3-Clause | mittel; letzter Push 2026-03-27 | npm @geckos.io/server 3.1.0 (Datum UNKNOWN); GitHub-Releases: keine (404) | 1.489 | Niedrig: für schnelle Action-Spiele; TD braucht kaum UDP-Semantik, WebRTC erhöht Betriebsaufwand | [S32], [S33] |

Architekturvergleich (Einschätzung):

| Modell | Vorteile | Nachteile | Eignung |
|---|---|---|---|
| Autoritativer Server (Sim läuft auf Server, Clients senden Befehle "baue Turm X auf Feld Y") | Cheat-sicher, Inventar/Gacha konsistent, Reconnect einfach | Serverlast pro Match; Latenz nur bei Befehlen spürbar (bei TD unkritisch) | **Hoch** |
| Lockstep (alle simulieren, nur Befehle werden getauscht) | Wenig Bandbreite | Erfordert strikte Determinismus-Garantie, Cheat-Schutz schwach (Clients vertrauen sich), Desync-Debugging teuer | Niedrig |

**Empfehlung Koop:** Autoritativer Server auf Node.js; Clients senden nur Befehle (Turm bauen/verkaufen/upgraden, Fähigkeit nutzen), der Server simuliert im festen Tick und sendet Snapshots/Events. Start mit Colyseus (MIT, aktiv) für Räume/Sync; alternativ ws + eigenes Protokoll, wenn möglichst wenig Fremdcode gewünscht. WebRTC/Geckos.io und Lockstep nicht nötig.

## 6. Speichern / Backend (Inventar, Gacha, Auth)

| Thema | Option | Aussage / Status | Quelle | Eignung für uns |
|---|---|---|---|---|
| Inventar | Serverseitige Wahrheit | Client darf nie Besitz, Währung oder Stats setzen; nur Anfragen "ziehe/upgrade/equip" mit Validierung | Einschätzung | Pflicht |
| Gacha | Ziehung nur serverseitig | RNG und Droptabellen nur auf dem Server; Seed/Ergebnis loggen; Ziehungsprotokoll pro Spieler (Nachvollziehbarkeit). Rechtliche Offenlegung von Dropraten/Altersregeln je Land **nicht geprüft (UNKNOWN)** | Einschätzung | Pflicht |
| Datenbank | PostgreSQL oder SQLite | Beide in dieser Recherche nicht abgerufen (Lizenz/Reife UNKNOWN). Einschätzung: SQLite für Prototyp/Einzelserver, Postgres für Mehrserver-Betrieb mit Transaktionen | – | Transaktionen für Käufe/Ziehungen zwingend |
| Auth | Account-Login, Sitzungstoken (kurzlebig) | Passwörter nur gehasht (argon2/bcrypt), HTTPS/WSS. Konkrete Library nicht recherchiert (UNKNOWN) | Einschätzung | Pflicht, bevor Inventar existiert |
| Komplett-Backend | Nakama (Apache-2.0) | bringt Accounts, Storage, Server-Skripting mit (siehe Abschnitt 5) | [S26], [S27] | Option, falls eigenes Backend zu aufwendig |

**Empfehlung Backend:** Eigenes Node.js/TypeScript-Backend mit SQL-Datenbank (Start SQLite, Migration zu Postgres vorbereiten, Zugriff über Migrationen/Query-Layer), alle Mutationen (Gacha, Upgrades, Match-Belohnungen) als Transaktion mit Idempotenz-Schlüssel; Match-Belohnungen werden vom Server aus der autoritativen Sim berechnet, nie vom Client gemeldet. Nakama als Alternative, wenn Betriebsaufwand akzeptabel ist.

## 7. Empfohlener Gesamt-Stack

1. Client: TypeScript + Vite, PixiJS v8 für 2D/2.5D-Rendering (Phaser als Fallback), UI als DOM/HTML über dem Canvas.
2. Simulation: eigenes, rendererfreies TS-Modul (fester Tick, Festkomma/Integer, seeded PRNG, Waypoint-Pfade), läuft im Browser (Vorschau) und auf dem Server (maßgeblich).
3. ECS: bitECS oder minimaler Eigenbau mit fester Iterationsreihenfolge (ecsy nicht verwenden, archiviert).
4. Multiplayer: autoritativer Node.js-Server, Colyseus (Räume, Sync) oder ws + eigenes Protokoll; Clients senden nur Befehle.
5. Backend/Persistenz: Node.js-API, SQL-DB (SQLite zum Start, Postgres später), Transaktionen für Inventar/Gacha, Auth mit Sitzungstokens.
6. Gacha/Inventar: ausschließlich serverseitig, mit Ziehungslog; Client zeigt nur Ergebnisse.
7. Tests: Replay-Tests der Simulation (gleicher Seed + gleiche Befehle = gleiches Ergebnis).
8. Offene Punkte: Lizenzcheck bitECS (MPL-2.0), Wahl Auth-Library, Gacha-Rechtslage, Web-Export-Größe falls Godot erwogen wird.

## Quellentabelle (alle Abrufdatum 2026-10-06)

| ID | URL | Verwendet für |
|---|---|---|
| S1 | https://api.github.com/repos/phaserjs/phaser | Phaser: Stars, Lizenz, Push |
| S2 | https://api.github.com/repos/phaserjs/phaser/releases/latest | Phaser: v4.2.1, 2026-07-09 |
| S3 | https://api.github.com/repos/pixijs/pixijs | PixiJS: Stars, Lizenz, Push |
| S4 | https://api.github.com/repos/pixijs/pixijs/releases/latest | PixiJS: v8.22.0, 2026-10-01 |
| S5 | https://api.github.com/repos/mrdoob/three.js | Three.js: Stars, Lizenz, Push |
| S6 | https://api.github.com/repos/mrdoob/three.js/releases/latest | Three.js: r186, 2026-09-24 |
| S7 | https://api.github.com/repos/BabylonJS/Babylon.js | Babylon.js: Stars, Lizenz, Push |
| S8 | https://api.github.com/repos/BabylonJS/Babylon.js/releases/latest | Babylon.js: 9.29.0, 2026-10-01 |
| S9 | https://api.github.com/repos/godotengine/godot | Godot: Stars, Lizenz, Push |
| S10 | https://api.github.com/repos/godotengine/godot/releases/latest | Godot: 4.7.2-stable, 2026-08-18 |
| S11 | https://api.github.com/repos/excaliburjs/Excalibur | Excalibur: Stars, Lizenz, Push |
| S12 | https://api.github.com/repos/excaliburjs/Excalibur/releases/latest | Excalibur: v0.32.0, 2025-12-23 |
| S13 | https://api.github.com/repos/kaplayjs/kaplay | Kaplay: Stars, Lizenz, Push |
| S14 | https://api.github.com/repos/kaplayjs/kaplay/releases/latest | Kaplay: 4000.0.0-alpha.27.1, 2026-05-12 |
| S15 | https://api.github.com/repos/NateTheGreatt/bitECS | bitECS: Stars, Lizenz, Push |
| S16 | https://registry.npmjs.org/bitecs/latest | bitECS: npm 0.4.0 (GitHub-Releases-Abruf lieferte 404) |
| S17 | https://api.github.com/repos/hmans/miniplex | miniplex: Stars, Lizenz, Push |
| S18 | https://api.github.com/repos/LastOliveGames/becsy | becsy: Stars, Lizenz, Push |
| S19 | https://registry.npmjs.org/@lastolivegames/becsy/latest | becsy: npm 0.16.1 |
| S20 | https://api.github.com/repos/ecsyjs/ecsy | ecsy: archived=true, Stars, Lizenz |
| S21 | https://api.github.com/repos/prettymuchbryce/easystarjs | easystarjs: Stars, Lizenz, Push |
| S22 | https://api.github.com/repos/qiao/PathFinding.js | PathFinding.js: Stars, license=null, Push |
| S23 | https://gafferongames.com/post/fix_your_timestep/ | Fixed Timestep (nur Einleitung gelesen) |
| S24 | https://api.github.com/repos/colyseus/colyseus | Colyseus: Stars, Lizenz, Push |
| S25 | https://api.github.com/repos/colyseus/colyseus/releases/latest | Colyseus: 0.18, 2026-08-25 |
| S26 | https://api.github.com/repos/heroiclabs/nakama | Nakama: Stars, Lizenz, Push |
| S27 | https://api.github.com/repos/heroiclabs/nakama/releases/latest | Nakama: v3.41.0, 2026-09-18 |
| S28 | https://api.github.com/repos/websockets/ws | ws: Stars, Lizenz, Push |
| S29 | https://api.github.com/repos/websockets/ws/releases/latest | ws: 8.22.0, 2026-09-26 |
| S30 | https://api.github.com/repos/uNetworking/uWebSockets.js | uWebSockets.js: Stars, Lizenz, Push |
| S31 | https://api.github.com/repos/uNetworking/uWebSockets.js/releases/latest | uWebSockets.js: v20.71.0, 2026-09-16 |
| S32 | https://api.github.com/repos/geckosio/geckos.io | Geckos.io: Stars, Lizenz, Push |
| S33 | https://registry.npmjs.org/@geckos.io/server/latest | Geckos.io: npm 3.1.0 (GitHub-Releases-Abruf lieferte 404) |
