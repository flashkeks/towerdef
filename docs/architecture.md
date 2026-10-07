# Architektur für M1 und die Zeit danach (Entwurf)

Stand 06.10.2026, Paket P7 (Runde 4). Verbindlich sind `docs/design/ENTSCHEIDUNGEN.md` und `run.md`;
dieses Dokument legt die technische Auslegung fest. Es ist ein **Entwurf**: Es gibt noch keinen Server,
keinen Client und kein Deployment. Alle Code-Blöcke sind Schnittstellen-Skizzen, kein lauffähiger Code.
Das Spiel selbst ist Englisch, diese Doku bleibt Deutsch. Name: **„Duskwardens"** (Entscheidung Max, 06.10.2026, `docs/design/ENTSCHEIDUNGEN.md`). Der Name ist **nicht hart verdrahtet**: Spieltitel nur über den String-Schlüssel `game.title`, Domain nur über `TD_PUBLIC_HOST`/`TD_PUBLIC_ORIGIN`. Ein späteres Umbenennen ist damit eine Zeile in `en.ts` plus Konfiguration.

Quellen: `docs/research/tech-options.md` (Stack), `docs/research/legal-gacha.md` (Raten, Pity, Jugendschutz),
`sim/README.md` (Sim-API).

## 1. Leitlinien

1. **Die Sim ist die Wahrheit über das Spiel.** `sim/` ist rendererfrei, deterministisch (Festkomma, sfc32, 20 Ticks/s)
   und läuft im Browser (Vorschau, M1) und später auf dem Server (maßgeblich, M2).
2. **Der Server ist die Wahrheit über den Besitz.** Währung, Inventar, Gacha-Zustand und Zahlungen liegen nie im Client.
3. **Keine Passwörter.** Identität kommt per signiertem Start-Token von Kek-Game (Abschnitt 6).
4. **Keine Secrets im Repo.** Konfiguration nur über Umgebungsvariablen; im Repo stehen nur Platzhalter (`deploy/.env.example`).
5. **Nichts verbauen, was später gebraucht wird**, aber auch nichts bauen, was nicht entschieden ist (Coins-/Leaderboard-Kopplung, echte Zahlung).

## 2. Repo-Aufbau

```
towerdef/
  sim/            vorhanden. Deterministischer Kern, Daten (data/*.json), Bots, Reports. Keine Browser-/Node-Abhängigkeit im Kern.
  client/         neu (M1). PixiJS v8 + Vite + TypeScript. Rendering, Eingabe, DOM-UI, Desktop-Sperre, Strings.
  server/         neu (ab M2/M3, Node, autoritativ). Auth, Profil, Shop/Gacha, später Räume und Match-Simulation.
  deploy/         Entwurf: Dockerfile.draft, docker-compose.draft.yml, .env.example, README.md
  docs/           Doku (Deutsch)
  tools/          vorhanden
```

**Gemeinsame Typen und Daten kommen aus `sim/`:**

- Client und Server importieren `sim` als Workspace-Paket (npm workspaces im Repo-Root, Paketname z. B. `@td/sim`) über die
  öffentliche API `sim/src/index.ts` (`createSim`, `Command`, `SimState`, `SimEvent`, `GameData`, `UnitDef`, `loadGameData`, `hashState`).
  Kein Import aus `sim/src/...` an der API vorbei.
- Spieldaten (`sim/data/*.json`: Units, Gegner, Stages, Ökonomie) sind die einzige Quelle. Der Client liest sie für Anzeige
  (Kosten, Reichweite, Namen über die String-Datei), der Server für Validierung. Kein Datenduplikat im Client.
- Für Netzwerktypen (API-Requests/-Antworten, WebSocket-Nachrichten) entsteht in `server/src/api-types.ts` ein reines
  Typmodul (nur `type`/`interface`, keine Laufzeitabhängigkeit). Der Client importiert es mit `import type`.
  Falls das stört, wird es später ein eigenes Paket `shared/`; das ändert nur Importpfade.
- Der Server nutzt dieselbe Sim-Version wie der Client (ein Commit). Replays tragen `sim`-Version und Daten-`ref` mit.

**Meilensteine und was dazugehört:**

| Meilenstein | Läuft wo | Persistenz | Konto |
|---|---|---|---|
| M1 Solo-Prototyp | Client allein, Sim im Browser (Web Worker empfohlen, damit der Tick den Render nicht blockiert) | `localStorage` für Einstellungen und Spielstand (nur Komfort) | keins nötig; Desktop-Sperre und Strings gelten schon |
| M2 Koop | `server/`: Räume, Sim autoritativ, Clients senden nur `Command`, Server sendet Snapshots/Events (Colyseus oder `ws`, Entscheidung zu Beginn M2) | SQLite | Launch-Token-Login (Abschnitt 6) |
| M3 Sammeln/Gacha/Meta | `server/`: Profil, Inventar, Shop, Gacha | SQLite, Wechsel auf Postgres vorbereitet (Abschnitt 7.5) | wie M2, Zahlung nur Mock |

M1 braucht also **keinen Server**. Der Server-Vertrag steht trotzdem schon hier, damit die Kek-Game-Seite früh gebaut werden kann.

## 3. Client (M1)

- **Stack:** TypeScript strict, Vite, PixiJS v8 (Rückfall Phaser, siehe ENTSCHEIDUNGEN). Menüs, Shop, Dialoge als DOM/HTML über dem Canvas;
  das Spielfeld ist Canvas. Pixel-Anime-Sprites klein im Spiel, Portraits groß im Menü (Styleguide P8).
- **Aufbau:** `client/src/` mit `main.ts` (Bootstrap und Desktop-Sperre), `game/` (Pixi-Szene, Interpolation, Eingabe), `ui/` (DOM),
  `net/` (API-Client, ab M2), `i18n/en.ts` (Strings), `assets/` mit `ATTRIBUTIONS.md`.
- **Render-Schleife:** Akkumulator mit festem Tick (20/s) ruft `sim.step()`; gerendert wird interpoliert zwischen den letzten zwei Zuständen.
  Die Interpolation ist rein visuell und nie Teil des Sim-Zustands.
- **Eingabe:** Maus und Tastatur. Es gibt bewusst keine Touch-Eingabe (Abschnitt 4).

## 4. Desktop-Sperre

Handy und Touch werden **aktiv gesperrt** (ENTSCHEIDUNGEN, „Plattform"). Das Spiel-Bundle wird dann nicht einmal geladen.

**Ablauf:** Eine winzige, abhängigkeitsfreie Prüfung steht als erstes, separat geladenes Modul (kein Inline-Skript wegen CSP) (`client/src/gate.ts`, wenige hundert Bytes).
Nur wenn sie „Desktop" meldet, wird `main.ts` (PixiJS, Sim, Assets) per dynamischem `import()` geladen. Sonst wird der Hinweis-Bildschirm gerendert.
Die Prüfung läuft beim Start und bei `resize`/`orientationchange`/`pointerchange` (`matchMedia`-`change`) erneut, damit ein Fenster, das später
zu klein wird, nicht stumm weiterläuft, sondern pausiert und den Hinweis zeigt. Wird das Fenster wieder groß genug, geht es weiter (Sim ist pausiert, nicht verloren).

**Erkennungslogik (alle Bedingungen sind ODER-verknüpft, ein Treffer sperrt):**

```ts
// client/src/gate.ts (Skizze)
export type GateReason = 'touch-primary' | 'mobile-ua' | 'small-viewport';
export const MIN_VIEWPORT = { width: 1024, height: 600 };   // CSS-Pixel, innerWidth/innerHeight

export function gateReason(w: Window = window): GateReason | null {
  const mm = (q: string) => w.matchMedia(q).matches;
  const nav = w.navigator as Navigator & { userAgentData?: { mobile?: boolean } };

  // 1. Primäres Zeigegerät ist grob/ohne Hover, und es gibt keinen feinen Zeiger daneben.
  //    Touch-Laptops (Maus/Trackpad vorhanden) bleiben erlaubt, ein iPad ohne Maus nicht.
  const coarsePrimary = mm('(pointer: coarse)') && mm('(hover: none)');
  const noFinePointer = !mm('(any-pointer: fine)');
  if ((coarsePrimary && noFinePointer) || (nav.maxTouchPoints > 0 && noFinePointer)) return 'touch-primary';

  // 2. Mobil-Kennung. userAgentData.mobile (Chromium) oder UA-Muster. iPadOS meldet sich als "Macintosh":
  //    Mac-Plattform mit maxTouchPoints > 1 und ohne feinen Zeiger zählt als iPad (schon durch Regel 1 abgedeckt,
  //    hier als zweite Absicherung).
  if (nav.userAgentData?.mobile === true) return 'mobile-ua';
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Opera Mini/i.test(nav.userAgent)) return 'mobile-ua';

  // 3. Zu kleines Fenster (auch am Desktop: kein halbes Spiel in 600 px).
  if (w.innerWidth < MIN_VIEWPORT.width || w.innerHeight < MIN_VIEWPORT.height) return 'small-viewport';

  return null;   // Spiel darf starten
}
```

Festlegungen:

- **Entscheidend ist die Fähigkeit, nicht der User-Agent.** Der UA ist nur Zusatz, weil er leicht zu fälschen ist und Browser ihn reduzieren.
  Wer den UA fälscht, kommt am Handy vorbei, aber das ist kein Sicherheitsproblem, sondern nur eine ungepflegte Fahrt; Support gibt es dafür nicht.
- **Desktop-Modus-Trick am Handy** („Desktopseite anfordern") liefert weiter `pointer: coarse`/`any-pointer: fine` = false, wird also über Regel 1 gesperrt.
- **Kein serverseitiges Sperren.** Die Sperre ist Freundlichkeit, keine Zugriffskontrolle. Server-Endpunkte bleiben für alle gleich geschützt.
- **Hinweis-Bildschirm** (Texte in der String-Datei, Schlüssel `gate.*`): Titel „Desktop only", Text „{title} needs a mouse and a bigger screen. Please open this page on a desktop or laptop browser.",
  bei `small-viewport` zusätzlich „Your window is too small. Enlarge it to at least 1024 x 600." und ein Link zurück zu Kek-Game. Kein Spiel, kein Login-Versuch dahinter.
- **Test:** Unit-Test für `gateReason` mit einem Fake-`Window` (Matrix aus Zeiger/Hover/UA/Größe) und ein Playwright-Test mit Handy-Emulation (erwartet Hinweis, kein Canvas im DOM).

## 5. Texte (Englisch, zentral)

- **Spieltitel** nur unter `game.title` (`"Duskwardens"`). Seitentitel, Hinweis-Bildschirm, Fehlerseiten und Menüs setzen ihn per `t('game.title')` bzw. Platzhalter `{title}` ein; der Name steht sonst nirgends im Code (Lint-Regel unten greift).
- Alle sichtbaren Texte stehen in **einer** Datei `client/src/i18n/en.ts` als typisiertes Objekt mit stabilen Schlüsseln (`'shop.pull.button'`).
  Zugriff nur über `t(key, params?)`; Parameter mit `{name}`-Platzhaltern, Plural über eine kleine Hilfsfunktion `plural(key, n)`.
- Ein weiteres Locale ist später nur eine zweite Datei mit demselben Typ (`Record<StringKey, string>`); fehlende Schlüssel sind ein Typfehler.
- **Lint-Regel:** String-Literale mit Buchstaben in `client/src/ui/**` und `client/src/game/**` sind verboten (ESLint-Regel `no-restricted-syntax` plus Ausnahmen für IDs/CSS-Klassen).
- **Namen von Units, Gegnern, Fähigkeiten** stehen **nicht** in `sim/data` (dort nur IDs), sondern in der String-Datei unter `unit.<id>.name` usw. So bleibt die Sim sprachfrei.
- **Server-Fehler** liefern Codes (`error.code = 'not-enough-shards'`), nie Fließtext; der Client übersetzt.
- Doku, Commit-Texte, Code-Kommentare sind Deutsch; Bezeichner und alles, was ein Spieler sieht, Englisch.

## 6. Konto-Vertrag mit Kek-Game

Das TD speichert **keine Passwörter** und hat kein eigenes Registrieren. Dasselbe Konto wie `game.flashkeks.com`; geteilt wird nur die Identität.

### 6.1 Ablauf

```
Spieler klickt auf Kek-Game "Play Duskwardens"
  -> Kek-Game-Server prüft Login, erzeugt Token (Ed25519, 60 s), antwortet 302
  -> neuer Tab: https://TD-DOMAIN/auth/launch?token=JWT
  -> TD-Server prüft Token, verbraucht jti, legt Profil an/lädt es, setzt Cookie, antwortet 302 auf /
  -> Spiel läuft eigenständig auf TD-DOMAIN
```

`TD-DOMAIN` ist die öffentliche Domain des TD: **`duskwardens.flashkeks.com`** (festgelegt 06.10.2026, noch nicht angelegt). Im Code steht sie nirgends, sie kommt aus `TD_PUBLIC_HOST` bzw. `TD_PUBLIC_ORIGIN`. Eine spätere eigene Domain (`duskwardens.com`) ist damit nur ein Konfigurationswechsel auf beiden Seiten (TD und Kek-Game, wegen `aud`).

### 6.2 Token

JWT (kompakt, JWS) mit **EdDSA/Ed25519**. Header: `{"alg":"EdDSA","typ":"JWT","kid":"kg-2026-10"}`.

```ts
/** Claims des Launch-Tokens. Alle Felder Pflicht. */
export interface LaunchTokenClaims {
  iss: 'kek-game';        // fest; TD vergleicht exakt (env KEKGAME_ISSUER)
  aud: string;            // Hostname des TD, exakt TD-DOMAIN = "duskwardens.flashkeks.com" (nicht die URL, kein Schema, kein Port außer Dev)
  sub: string;            // Kek-Game-User-ID: opak, stabil, nie wiederverwendet, 1..64 Zeichen [A-Za-z0-9_-]
  name: string;           // Anzeigename, nur zur Anzeige, 1..32 Zeichen, siehe 6.5
  iat: number;            // Ausstellung, Sekunden seit Epoch (NumericDate)
  exp: number;            // Ablauf; exp - iat <= 60
  jti: string;            // einmalige Token-ID, >= 128 Bit Zufall (z. B. 22+ Zeichen base64url)
}

export interface LaunchTokenHeader {
  alg: 'EdDSA';
  typ: 'JWT';
  kid: string;            // Schlüsselkennung, siehe 6.4
}
```

### 6.3 Prüfung im TD-Server

Reihenfolge, jede Stufe bricht bei Fehler ab. Das Token wird erst nach bestandener Signaturprüfung inhaltlich gelesen.

1. Länge der URL/des Tokens begrenzen (z. B. 2 KB), genau drei Segmente.
2. Header lesen: `alg` **muss** `EdDSA` sein (nie aus dem Token „lernen"; `none`, `HS256`, `RS256` werden abgelehnt), `kid` muss im Schlüsselbund (`KEKGAME_PUBLIC_KEYS`) stehen.
3. Signatur mit dem **öffentlichen** Schlüssel zu `kid` prüfen (Node `crypto.verify(null, data, publicKey, sig)` oder `jose`).
4. Claims prüfen: `iss` exakt, `aud` exakt gleich `TD_PUBLIC_HOST`, alle Felder vorhanden und vom richtigen Typ, `sub`/`name`/`jti` Formate.
5. Zeit: `exp - iat <= 60`; `now <= exp + LEEWAY`, `iat <= now + LEEWAY` mit `LEEWAY = 5 s`. Die Uhr des TD-Servers ist maßgeblich (NTP/chrony auf `edge` Pflicht).
6. **`jti` verbrauchen**, atomar: `INSERT INTO launch_jti(jti, exp_at) VALUES (?, ?)` mit Unique-Constraint; schlägt das fehl, ist es ein Replay. Zeilen mit `exp_at < now - 1 h` werden periodisch gelöscht
   (Speicher bleibt klein; ein abgelaufenes Token wird ohnehin in Schritt 5 abgelehnt).
7. Profil zu `sub` suchen oder anlegen (`profile.kekgame_sub`, Abschnitt 6.7), `display_name` aktualisieren, `last_login_at` setzen.
8. Neue **Session** anlegen und mit `302 Location: /` antworten. Das Token verschwindet damit aus der Adresszeile und aus dem Verlauf.

**Cookie:** `__Host-td_session=<256 Bit Zufall, base64url>; Path=/; Secure; HttpOnly; SameSite=Lax`. Serverseitig gespeichert wird nur der SHA-256 des Werts
(Tabelle `session`). **Kein `Domain`-Attribut:** Das Cookie gilt genau für `duskwardens.flashkeks.com` (host-only; der Präfix `__Host-` erzwingt das sogar). **Nie** `Domain=.flashkeks.com` setzen, sonst sähen Kek-Game und alle anderen `*.flashkeks.com`-Dienste das Session-Cookie. Gleitender Ablauf 7 Tage, absolut 30 Tage. Logout löscht die Zeile und das Cookie; Logout im TD beendet **nicht** die Kek-Game-Sitzung und umgekehrt.
Zustandsändernde Requests (POST/PUT/DELETE) prüfen zusätzlich `Origin` gegen `TD_PUBLIC_ORIGIN` und verlangen einen Header `X-TD-Request: 1` (einfacher CSRF-Schutz; `SameSite=Lax` allein reicht nicht für alles).

**Zusatzmaßnahmen:** `Referrer-Policy: no-referrer` auf der Antwort von `/auth/launch`; der Reverse-Proxy bzw. Tunnel/Server loggt für `/auth/launch` **keine Query-Strings**
(sonst stünde ein Token im Log; durch 60 s und Einmaligkeit nur ein geringes Restrisiko, aber unnötig). Rate-Limit auf `/auth/launch` je IP (z. B. 20/min).

**Fehlerverhalten im TD:** Statt JSON eine kleine HTML-Seite (Strings aus der String-Datei) mit Code und Link „Back to Kek-Game". Codes siehe 6.6.

### 6.4 Dev-Modus (nur Entwicklung)

Gesteuert über `TD_MODE=dev|production` (Standard `production`).

- **`server/scripts/dev-keys.ts`:** erzeugt ein Ed25519-Testschlüsselpaar (`crypto.generateKeyPairSync('ed25519')`) in `server/.dev/` (in `.gitignore`), `kid` = `dev-1`.
- **`server/scripts/dev-token.ts --sub dev-user-1 --name "Dev One"`:** stellt ein gültiges Launch-Token aus und gibt die vollständige Launch-URL für `http://localhost:PORT` aus. Optionen für Negativtests:
  `--expired`, `--replay`, `--wrong-aud`, `--bad-sig`, `--ttl 120`.
- **Dev-Login:** `GET /auth/dev-login?sub=...&name=...` setzt direkt eine Session ohne Token. Existiert **nur** bei `TD_MODE=dev`; die Route wird in Production gar nicht registriert (404).
- **Schutz vor Verwechslung:** `kid=dev-*` wird im Production-Modus **immer** abgelehnt, auch wenn jemand den Dev-Schlüssel in `KEKGAME_PUBLIC_KEYS` einträgt.
  Der Server verweigert den Start, wenn `TD_MODE=production` und `TD_DEV_*`-Variablen oder ein `dev-*`-Schlüssel gesetzt sind. Der Dev-Server bindet nur an `127.0.0.1`.
- Dev-Profile tragen `source = 'dev'` und werden von Production-Daten getrennt gehalten (eigene SQLite-Datei).

### 6.5 Was die Kek-Game-Seite tun muss

Dieser Teil wird **nicht** in diesem Repo gebaut; er ist die Anforderung an die Menschen bzw. die Homelab-Seite.

1. **Button** auf der Kek-Game-Startseite („Play Duskwardens"), nur für angemeldete Nutzer sichtbar. Er ist ein normaler Link `<a href="/td/launch" target="_blank" rel="noopener">`
   auf einen **Kek-Game-eigenen Endpunkt**, der den Tab öffnet. Das Token wird **nicht** in die Seite eingebettet und nicht vorab erzeugt, sondern erst beim Klick (so ist es frisch,
   und Popup-Blocker greifen nicht, weil der Klick ein Nutzerklick ist).
2. **Endpunkt `/td/launch`** (Kek-Game-Server): Login-Session prüfen (nicht angemeldet: zur Anmeldung, danach zurück). Dann Token erzeugen, mit **`302 Location: https://TD-DOMAIN/auth/launch?token=JWT`** antworten.
3. **Token erzeugen:** Header `alg=EdDSA, typ=JWT, kid=<aktueller Schlüssel>`; Claims nach `LaunchTokenClaims`:
   - `iss` = `kek-game` (fester String, mit dem TD abgestimmt),
   - `aud` = Hostname der TD-Domain (genau so, wie die Menschen ihn im TD als `TD_PUBLIC_HOST` eintragen),
   - `sub` = interne, **unveränderliche** User-ID (nicht die E-Mail, nicht der Anzeigename; darf nie auf einen anderen Menschen übergehen),
   - `name` = aktueller Anzeigename (gekürzt auf 32 Zeichen; Steuerzeichen entfernt; kann sich ändern, das TD übernimmt ihn bei jedem Login),
   - `iat` = jetzt, `exp` = `iat + 60` (nie mehr; 30 s reichen meist),
   - `jti` = frische Zufallszahl, >= 128 Bit aus einem kryptografischen Zufallsgenerator, **nie wiederverwenden**.
4. **Schlüsselablage:** Der **private** Ed25519-Schlüssel liegt nur auf dem Kek-Game-Server, in dessen Secret-Ablage (z. B. Vaultwarden als Quelle, zur Laufzeit als Datei/Env mit Rechten 0400),
   nie im Repo, nie im Chat, nie im Browser. Der **öffentliche** Schlüssel ist nicht geheim und geht an die Betreiber des TD (als JWK oder PEM, zusammen mit seinem `kid`).
   Schlüsselpaar nach Vorgabe der Homelab-Regeln im Vaultwarden bzw. mit `openssl genpkey -algorithm ed25519` auf dem Kek-Game-Server erzeugen, nicht durch einen Chat schicken.
5. **Rotation mit `kid`:** Jeder Schlüssel hat eine Kennung (`kg-JJJJ-MM`). Ablauf: (a) neues Paar erzeugen, (b) neuen **öffentlichen** Schlüssel im TD **zusätzlich** eintragen und ausrollen,
   (c) Kek-Game wechselt die Signatur auf den neuen `kid`, (d) nach mindestens 5 Minuten (Token-Lebensdauer 60 s + Toleranz, Puffer) den alten Schlüssel im TD entfernen, (e) alten privaten Schlüssel vernichten.
   Das TD akzeptiert mehrere `kid` gleichzeitig; so gibt es keinen Ausfall. Regelrotation zum Beispiel jährlich, sofort bei Verdacht auf Leck (dann ohne Überlappung, alter Schlüssel sofort raus).
6. **Uhrzeit:** Der Kek-Game-Server muss per NTP synchron sein (Abweichung deutlich unter 5 s; das TD toleriert höchstens 5 s). `iat` wird beim Klick gesetzt, nicht beim Seitenaufbau.
   Bei Abweichung entstehen `token-not-yet-valid` bzw. `token-expired` (6.6); die Uhrzeit ist die häufigste Ursache.
7. **Fehlerfälle auf der Kek-Game-Seite:** Nicht angemeldet -> erst Login. Gesperrte/gelöschte Konten -> kein Token ausstellen. Signierschlüssel nicht verfügbar -> freundliche Fehlerseite, **nicht**
   auf ungesigniert oder auf einen anderen Algorithmus zurückfallen. Nur `302` auf die feste TD-URL; keine freie Redirect-Adresse aus Parametern (kein Open Redirect).
   Das Token nicht loggen (Access-Logs ohne Query-String für diesen Pfad oder die Location nicht protokollieren).
8. **Mehrfaches Klicken:** jeder Klick erzeugt ein **neues** Token mit neuem `jti`. Niemals ein Token cachen oder erneut senden.
9. **Was Kek-Game nicht tun muss:** Es muss das Konto nicht im TD anlegen, keine Daten mitschicken außer den sechs Claims, und nichts vom TD zurückbekommen.
   Löschung/Sperre eines Kek-Game-Kontos wirkt im TD erst beim nächsten Login (laufende TD-Sessions enden nach Ablauf, siehe 6.3); ein Rückkanal ist ein Erweiterungspunkt (6.9).

### 6.6 Fehlercodes

| Code | Ursache | Verhalten im TD | Wer behebt es |
|---|---|---|---|
| `token-malformed` | kein gültiges JWT, zu lang | Fehlerseite | Kek-Game-Bug |
| `token-alg` | `alg` nicht `EdDSA` | Fehlerseite, Sicherheitslog | Kek-Game-Bug oder Angriff |
| `token-unknown-kid` | `kid` nicht im Schlüsselbund | Fehlerseite | Rotation falsch abgestimmt |
| `token-bad-signature` | Signatur passt nicht | Fehlerseite, Sicherheitslog | Schlüssel falsch oder Angriff |
| `token-wrong-issuer` / `token-wrong-audience` | `iss`/`aud` stimmen nicht | Fehlerseite | falsche Domain eingetragen |
| `token-expired` | `now > exp + 5 s` | Fehlerseite „Please start again from Kek-Game" | Uhr oder zu langsamer Nutzer: einfach erneut klicken |
| `token-not-yet-valid` | `iat > now + 5 s` | Fehlerseite | Uhr Kek-Game schneller als TD |
| `token-too-long-lived` | `exp - iat > 60` | Fehlerseite | Kek-Game-Bug |
| `token-replayed` | `jti` schon verbraucht | Hat der Browser bereits eine gültige TD-Session **für dasselbe `sub`**, einfach `302 /`; sonst Fehlerseite (typisch: Reload der Launch-URL) | Nutzer klickt neu |
| `account-blocked` | Profil im TD gesperrt | Fehlerseite | Menschen |

### 6.7 Profil-Schema

```ts
/** TD-Profil. Eine Zeile je Kek-Game-User. Identität ist ausschließlich `kekgameSub`. */
export interface Profile {
  id: string;                    // interne UUID (stabil; alle Fremdschlüssel zeigen hierauf, nie auf sub)
  kekgameSub: string;            // Kek-Game-User-ID, UNIQUE
  displayName: string;           // zuletzt gesehener Name aus dem Token (nur Anzeige, nicht eindeutig)
  source: 'kekgame' | 'dev';
  createdAt: string;             // ISO 8601 UTC
  lastLoginAt: string;
  status: 'active' | 'blocked';
  settings: Record<string, unknown>;   // Client-Einstellungen (Audio, Tastenbelegung), klein, JSON
  /** Erweiterungspunkt, siehe 6.9: vorbereitet, in M1-M3 ungenutzt. */
  links: ProfileLink[];
}

export interface ProfileLink {
  provider: string;              // z. B. 'kekgame-coins' (später)
  externalId: string;
  linkedAt: string;
}
```

Tabellen dazu (SQL-Skizze, SQLite-Typen; Postgres-kompatibel gehalten):

```sql
CREATE TABLE profile (
  id            TEXT PRIMARY KEY,                 -- UUID
  kekgame_sub   TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  source        TEXT NOT NULL CHECK (source IN ('kekgame','dev')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at    TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);
CREATE TABLE profile_link (                       -- Erweiterungspunkt, leer
  profile_id TEXT NOT NULL REFERENCES profile(id),
  provider   TEXT NOT NULL,
  external_id TEXT NOT NULL,
  linked_at  TEXT NOT NULL,
  PRIMARY KEY (profile_id, provider)
);
CREATE TABLE session (
  token_hash   TEXT PRIMARY KEY,                  -- SHA-256 des Cookie-Werts
  profile_id   TEXT NOT NULL REFERENCES profile(id),
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at   TEXT NOT NULL,                     -- gleitend, höchstens created_at + 30 d
  user_agent   TEXT                               -- gekürzt, nur für Sitzungsübersicht
);
CREATE TABLE launch_jti (
  jti    TEXT PRIMARY KEY,
  exp_at INTEGER NOT NULL                         -- Token-exp, zum Aufräumen
);
```

### 6.8 Was bewusst nicht zum Vertrag gehört

Keine E-Mail, keine Rollen, keine Coins, keine Avatar-URL im Token. Je weniger drinsteht, desto weniger kann abweichen oder durchsickern.

### 6.9 Erweiterungspunkte (nicht bauen)

Entschieden ist: geteilt wird zunächst nur das Konto. Damit eine spätere Kopplung nichts umbauen muss, gilt heute:

- **Interne `profile.id` statt `sub` als Fremdschlüssel überall.** Ein späterer Konten-Merge oder Wechsel der Kek-Game-ID betrifft dann nur `profile.kekgame_sub`.
- **`profile_link`** (leer) nimmt externe Verknüpfungen auf. Ein späteres Kek-Game-Coins-Konto ist ein Eintrag, kein neues Schema.
- **Ledger mit `currency`-Spalte** (Abschnitt 7.5): Eine zweite Währung (`kekcoins`) wäre eine weitere Zeichenkette, keine Umstellung. Eine Umrechnung zwischen Kek-Game-Coins und TD-Währung wäre eine **eigene Entscheidung samt Rechtsprüfung**
  (Währungsketten sind laut `legal-gacha.md` ein Dark Pattern) und wird nicht vorgebaut.
- **Server-zu-Server-Kanal Kek-Game <-> TD** (z. B. Coins gutschreiben, Konto-Sperre melden, Leaderboard-Abfrage): wäre ebenfalls asymmetrisch signiert, in beide Richtungen mit eigenem Schlüsselpaar und eigener `aud`, über `kid`/Idempotenzschlüssel wie hier.
  Nicht gebaut; die Konventionen (Ed25519, `kid`, `jti`/Idempotenz, kurze Lebensdauer) stehen schon.
- **Leaderboards:** `match_result` (Abschnitt 7.5) speichert Stage, Schwierigkeit, Seed, Befehlsliste, Sim-Version und Endhash. Ergebnisse sind **per Replay in der Sim prüfbar**, daher später exportierbar,
  ohne dem Client zu vertrauen. In M1-M3 gibt es nur ein TD-internes Ergebnis ohne Rangliste.
- **Anzeigename** ist bewusst nicht eindeutig und nicht Teil von Fremdschlüsseln; Ranglisten würden mit `profile.id` arbeiten.

## 7. Zahlung (Mock), Premium-Währung, Gacha

Ziel laut ENTSCHEIDUNGEN: komplett durchspielbarer Shop-Flow **ohne echten Zahlungsdienst**. Wie und ob echtes Geld kommt, entscheiden die Menschen nach der Rechtsprüfung.

### 7.1 Grundsätze

- **Eine** Premium-Währung (Arbeitsname `shards`; **in Runde 7 heißt sie im Code und in der UI `crystals`**, daneben gibt es `gold` nur für Unit-Level, siehe `meta/README.md`), keine Währungsketten. Gacha-Ziehungen kosten direkt Shards; Spielgeld aus der Sim (Münzen im Match) ist davon getrennt und nie kaufbar.
- **Alle Mutationen serverseitig**, jede in **einer Datenbanktransaktion**, jede mit **Idempotenzschlüssel** (7.4). Der Client kennt Zustände nur aus Antworten.
- **Ledger statt Zähler.** Der Kontostand ist die Summe unveränderlicher Buchungen; ein gespeicherter Saldo (`wallet.balance`) ist nur Cache und wird in derselben Transaktion fortgeschrieben.
- **Schalter gegen versehentliches Echtgeld:** `PAYMENT_PROVIDER=mock` ist der einzige zulässige Wert, solange kein echter Anbieter implementiert ist. Ein später implementierter Anbieter startet nur mit
  `PAYMENTS_LEGAL_REVIEW_DONE=yes` (bewusste Handlung der Menschen). In M1-M3 gilt: Mock-Käufe zeigen im Shop dauerhaft „Test purchase - no real money".
- **Raten und Pity sichtbar** (Pflicht laut `legal-gacha.md`, Abschnitt 3: Plattform-Standard Raten je Item-Typ **vor** Kauf; FTC-Fall Genshin: verschleierte Raten und Währungsketten). Siehe 7.6.

### 7.2 PaymentProvider-Schnittstelle

```ts
export type Money = { amountMinor: number; currency: 'EUR' };   // Cent; Ganzzahl, nie Float

export interface ShopProduct {
  sku: string;                    // 'shards_500'
  shards: number;                 // gelieferte Menge (inkl. Bonus, der Bonus steht im Shop sichtbar)
  price: Money;
}

export interface CreateCheckoutInput {
  orderId: string;                // vom Server vergeben, UUID; zugleich Idempotenzschlüssel gegenüber dem Anbieter
  profileId: string;
  sku: string;
  price: Money;
  returnUrl: string;              // nur URLs auf TD_PUBLIC_ORIGIN
}
export interface Checkout {
  providerRef: string;            // ID beim Anbieter ('mock_' + zufällig)
  redirectUrl: string | null;     // Mock: interne Seite oder null (sofort bestätigt)
  status: 'pending' | 'confirmed';
}
export interface ConfirmResult  { status: 'confirmed' | 'failed' | 'pending'; paid?: Money; failureCode?: string }
export interface RefundInput    { orderId: string; providerRef: string; amount: Money; reason: 'customer' | 'fraud' | 'error' }
export interface RefundResult   { status: 'refunded' | 'failed'; refundRef?: string }

/** Ein Anbieter-Ereignis (Webhook bzw. beim Mock ein interner Aufruf). `id` ist eindeutig und dient der Deduplikation. */
export type PaymentEvent =
  | { id: string; type: 'checkout.completed'; orderId: string; providerRef: string; paid: Money; occurredAt: string }
  | { id: string; type: 'checkout.failed';    orderId: string; providerRef: string; failureCode: string; occurredAt: string }
  | { id: string; type: 'refund.completed';   orderId: string; providerRef: string; refunded: Money; occurredAt: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<Checkout>;
  confirm(orderId: string, providerRef: string): Promise<ConfirmResult>;   // aktives Nachfragen (Fallback, falls ein Webhook fehlt)
  refund(input: RefundInput): Promise<RefundResult>;
  /** Echte Anbieter: Signatur prüfen und Rohbody in PaymentEvent übersetzen; wirft bei ungültiger Signatur. Mock: nimmt ein internes Ereignis. */
  parseWebhook(rawBody: string, headers: Record<string, string>): PaymentEvent;
}

/** Bestätigt sofort, ohne Netz, ohne Geld. Nur für Dev und Prototyp. */
export class MockPaymentProvider implements PaymentProvider { /* Skizze: createCheckout -> {status:'confirmed'}, erzeugt Ereignis 'checkout.completed' mit eigener id */ }
```

Mock-Verhalten: `createCheckout` liefert sofort `confirmed` und stellt ein `checkout.completed`-Ereignis in die interne Ereigniswarteschlange (dieselbe Verarbeitung wie ein echter Webhook, damit der Pfad getestet wird).
Zusätzlich ein Dev-Schalter `MOCK_PAYMENT_OUTCOME=ok|fail|pending|duplicate-event` für Negativtests (Fehlschlag, nie bestätigt, doppeltes Ereignis).

### 7.3 Kauf-Flow (Shards)

1. Client: `POST /api/shop/checkout {sku}` mit Header `Idempotency-Key: <UUID>`.
2. Server (Transaktion A): Produkt und Preis **aus dem Server-Katalog** lesen (der Client schickt nie einen Preis), `shop_order` mit Status `created` anlegen, `provider.createCheckout(...)` aufrufen,
   `provider_ref` und Status `pending` speichern. Antwort: Bestell-ID, ggf. `redirectUrl`.
3. Ereignis kommt (`checkout.completed`, Mock sofort): Handler (Transaktion B) trägt die Ereignis-ID in `payment_event` ein (UNIQUE; Duplikat = nichts tun, `200`), prüft Betrag/Währung gegen die Bestellung,
   setzt Status `paid`, schreibt **eine** Ledger-Buchung `+shards` (Referenz `order:<id>`; UNIQUE `(ref_type, ref_id, kind)` verhindert Doppelgutschrift auch bei Bugs), schreibt den Saldo fort.
4. Client fragt `GET /api/shop/orders/:id` (kurz pollen) und zeigt „Shards credited". Fehlt das Ereignis, ruft ein Job `provider.confirm()` für `pending`-Bestellungen älter als 1 Minute.
5. **Erstattung:** `provider.refund` und Ereignis `refund.completed` -> Ledger-Buchung `-shards` (`kind = refund`). Reichen die Shards nicht mehr, **darf der Saldo negativ werden**;
   solange er negativ ist, sind Ziehungen gesperrt. Gezogene Einheiten werden nicht zurückgenommen (Entscheidung der Menschen, falls anders gewünscht).
6. Bestellungen sind nur in Richtung `created -> pending -> paid -> refunded` bzw. `-> failed` änderbar (Zustandsautomat im Server, Rückwärtsbewegung wird abgelehnt).

### 7.4 Idempotenz und Transaktionen

- **Header `Idempotency-Key`** (UUID, vom Client je Nutzeraktion erzeugt, bei Wiederholung desselben Klicks/Retry **gleich** gelassen) ist Pflicht für `checkout`, `gacha/pull`, `loadout`-Änderungen und alles, was Besitz ändert.
- Tabelle `idempotency_key(profile_id, key, route, request_hash, status, response_json, created_at)` mit `PRIMARY KEY (profile_id, key)`.
  Ablauf in **derselben** Transaktion wie die Mutation: Schlüssel einfügen -> bei Konflikt: gleicher `request_hash` und `status=done` -> gespeicherte Antwort unverändert zurückgeben (HTTP-Status wie beim Original),
  anderer `request_hash` -> `422 idempotency-key-reuse`, noch `in_progress` (parallele Wiederholung) -> `409 retry`. Aufbewahrung 24 h.
- **Transaktionsgrenze:** SQLite `BEGIN IMMEDIATE` (ein Schreiber, keine verlorenen Updates); bei Postgres `SERIALIZABLE` bzw. `SELECT ... FOR UPDATE` auf `wallet`. Alles oder nichts: Ledger, Saldo, Inventar, Pity, Ziehungsprotokoll, Idempotenzantwort.
- **Nie** Netzwerkaufrufe (Anbieter) innerhalb einer Schreibtransaktion halten: erst Bestellung speichern, dann Anbieter, dann Ergebnis in neuer Transaktion.
- Ganzzahlen für Geld und Shards; keine Floats in Ledger/Raten (Raten als Basispunkte, 10000 = 100 %, passend zur Sim-Konvention).

### 7.5 Datenmodell (Skizze)

```sql
CREATE TABLE wallet (                               -- Cache, je Profil und Währung
  profile_id TEXT NOT NULL REFERENCES profile(id),
  currency   TEXT NOT NULL,                         -- 'shards' (später evtl. weitere, siehe 6.9)
  balance    INTEGER NOT NULL,                      -- darf nach Erstattung negativ sein
  PRIMARY KEY (profile_id, currency)
);
CREATE TABLE ledger (                               -- append-only, nie UPDATE/DELETE
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id  TEXT NOT NULL REFERENCES profile(id),
  currency    TEXT NOT NULL,
  delta       INTEGER NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('purchase','refund','gacha_spend','grant','adjust')),
  ref_type    TEXT NOT NULL,                        -- 'order' | 'gacha_pull' | 'admin'
  ref_id      TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  UNIQUE (ref_type, ref_id, kind)                   -- Doppelbuchung ausgeschlossen
);
CREATE TABLE shop_order (
  id           TEXT PRIMARY KEY,                    -- UUID
  profile_id   TEXT NOT NULL REFERENCES profile(id),
  sku          TEXT NOT NULL,
  shards       INTEGER NOT NULL,
  amount_minor INTEGER NOT NULL, currency TEXT NOT NULL,
  provider     TEXT NOT NULL, provider_ref TEXT,
  status       TEXT NOT NULL CHECK (status IN ('created','pending','paid','failed','refunded')),
  created_at   TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE payment_event (                        -- Webhook-Deduplikation und Audit
  id          TEXT PRIMARY KEY,                     -- Ereignis-ID des Anbieters
  order_id    TEXT, type TEXT NOT NULL, payload_json TEXT NOT NULL, received_at TEXT NOT NULL
);
CREATE TABLE idempotency_key ( /* siehe 7.4 */ profile_id TEXT, key TEXT, route TEXT, request_hash TEXT,
  status TEXT, response_json TEXT, created_at TEXT, PRIMARY KEY (profile_id, key) );

CREATE TABLE banner (                               -- Soll-Zustand kommt aus server/data/gacha/*.json, hier nur die Version
  id TEXT PRIMARY KEY, rates_version TEXT NOT NULL, rates_hash TEXT NOT NULL, active_from TEXT, active_to TEXT
);
CREATE TABLE pity_state (                           -- je Profil und Banner
  profile_id TEXT NOT NULL REFERENCES profile(id),
  banner_id  TEXT NOT NULL REFERENCES banner(id),
  since_top  INTEGER NOT NULL DEFAULT 0,            -- Ziehungen seit letztem Höchsttreffer
  since_mid  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (profile_id, banner_id)
);
CREATE TABLE gacha_pull (                           -- lückenloses Ziehungsprotokoll
  id            TEXT PRIMARY KEY,                   -- UUID
  profile_id    TEXT NOT NULL REFERENCES profile(id),
  banner_id     TEXT NOT NULL, rates_version TEXT NOT NULL,
  batch_id      TEXT NOT NULL,                      -- 10er-Zug = ein Batch
  idx           INTEGER NOT NULL,                   -- Position im Batch
  roll_bp       INTEGER NOT NULL,                   -- gewürfelter Wert 0..9999
  rarity        TEXT NOT NULL, unit_id TEXT NOT NULL,
  pity_before   INTEGER NOT NULL, pity_after INTEGER NOT NULL, pity_forced INTEGER NOT NULL,  -- 1 = durch Pity erzwungen
  cost_shards   INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE inventory_unit (                       -- Besitz; Stats kommen aus sim/data, hier nur Stufe/Dubletten
  profile_id TEXT NOT NULL REFERENCES profile(id),
  unit_id    TEXT NOT NULL,                         -- ID aus sim/data/units
  copies     INTEGER NOT NULL DEFAULT 1,
  level      INTEGER NOT NULL DEFAULT 1,
  first_obtained_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, unit_id)
);
CREATE TABLE match_result (                         -- Erweiterungspunkt Leaderboard, in M1-M3 nur intern
  id TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profile(id),
  stage TEXT NOT NULL, difficulty TEXT NOT NULL, players INTEGER NOT NULL,
  seed INTEGER NOT NULL, sim_version TEXT NOT NULL, commands_json TEXT NOT NULL,
  final_hash TEXT NOT NULL, outcome TEXT NOT NULL, finished_at TEXT NOT NULL
);
```

Wechsel auf Postgres: Typen (`TEXT` -> `uuid/timestamptz`, `INTEGER` -> `bigint`), `AUTOINCREMENT` -> `GENERATED ... AS IDENTITY`; Zugriff über einen dünnen Query-Layer und nummerierte Migrationen (`server/migrations/0001_*.sql`), nie Inline-DDL im Code.

### 7.6 Gacha: Raten, Pity, Ablauf

**Ablauf `POST /api/gacha/pull {bannerId, count: 1 | 10}` + `Idempotency-Key`:**

1. Ein Request, eine Transaktion (7.4). Idempotenzschlüssel prüfen.
2. Saldo prüfen (nicht negativ, ausreichend für `cost * count`); Banner aktiv; `rates_version` aus dem **Server**-Banner lesen (der Client darf keine Version vorgeben).
3. Je Ziehung: Zufall aus einem **kryptografischen** Generator (`crypto.randomInt`; nicht `Math.random`, **nicht** die deterministische Sim-PRNG). `roll_bp` in `0..9999`.
4. Rarität nach Ratentabelle plus Pity-Regeln bestimmen, Unit aus dem Pool der Rarität (gleichverteilt oder mit im Banner genannten Gewichten, siehe unten), `pity_state` fortschreiben.
5. Buchungen: Ledger `-cost` (`gacha_spend`, `ref_id = batch_id`), `gacha_pull`-Zeilen, `inventory_unit` (neue Unit: `copies=1`; Dublette: `copies+1`, siehe unten), Idempotenzantwort. Commit.
6. Antwort: Liste der Ergebnisse mit `pityBefore/After`, neuer Saldo, **die verwendete `ratesVersion`**.

**Platzhalterwerte (Balancing erst in M3; die Zahlen unten sind nur Beispiel für das Datenformat, nicht entschieden):**

```ts
export interface BannerRates {
  bannerId: string;
  ratesVersion: string;                 // z. B. '2026-10-a'; ändert sich mit jeder Änderung der Tabelle
  costPerPull: number;                  // Shards, ein Preis, kein Mengenrabatt über Währungsumwege
  tiers: Array<{
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    baseRateBp: number;                 // Basispunkte, Summe aller Stufen = 10000
    units: Array<{ unitId: string; weightBp?: number }>;   // Verteilung innerhalb der Stufe; ohne Angabe gleichverteilt
  }>;
  pity: {
    top: { rarity: 'legendary'; softFrom: number; softStepBp: number; hardAt: number };   // z. B. ab Ziehung 60 +x Bp je Zug, spätestens bei 80
    mid: { rarity: 'epic'; hardAt: number };                                              // garantiert mindestens epic je N Zügen
    carriesOver: true;                  // Zähler bleibt über Ziehungen im selben Banner erhalten, nicht pro Sitzung
  };
  duplicates: 'shards-to-upgrade';      // Dublette erhöht `copies` (Stufen-Fortschritt), keine zweite Währung
}
```

**Anzeige (Pflicht, alle Punkte sichtbar, bevor man Shards ausgibt):**

- Die vollständige **Ratentabelle je Stufe** (Basisrate in Prozent, aus `baseRateBp` berechnet), die **Pity-Regeln im Klartext** (ab wann steigt die Rate, wann ist es garantiert), die **effektive Rate** der aktuellen Pity-Stufe.
- Die Unit-Liste je Stufe mit Einzelraten (bei `weightBp` die gewichtete Rate).
- Der **Pity-Zähler** des Spielers („Pulls since last Legendary: 37 / 80"), auch auf dem Shop-Knopf „Pull x10".
- Die **Ratenversion** und ein Link zum Ziehungsverlauf (aus `gacha_pull`). Die Anzeige und die Ziehung lesen **dieselbe Datei** (`server/data/gacha/<banner>.json`); die Seite `GET /api/gacha/banners/:id/rates` liefert sie,
  damit Anzeige und Wirklichkeit nicht auseinanderlaufen. Ein Test zieht 1 Mio. simulierte Würfe und vergleicht die Häufigkeiten mit der angezeigten Rate (Toleranz) sowie die Pity-Obergrenze.
- Keine Zählung verschleiern: keine „versteckten" Soft-Pity-Stufen, keine zweite Währung, kein Countdown-Druck. Ein späterer Rechtsrahmen (PEGI 16 bei bezahlten Zufallsobjekten laut `legal-gacha.md`, Alters-/Elternfreigabe, Ausgabelimit) wird **vor** einer echten Zahlung entschieden; bis dahin ist ein
  **Ausgabelimit je Tag** (`GACHA_DAILY_PULL_CAP`, Standard hoch genug zum Testen) als einfacher Schalter vorgesehen.

### 7.7 Weitere Absicherung

- Der Client schickt nur **Absichten** (`{bannerId, count}`, `{sku}`), nie Preise, Raten, Ergebnisse oder Salden.
- Rate-Limit auf `/api/gacha/*` und `/api/shop/*` je Profil.
- Das Match-Ergebnis in M2/M3 wird vom Server aus der **eigenen Sim-Berechnung** abgeleitet (Replay aus Seed und Befehlen). Belohnungen aus Matches nie aus Client-Angaben.
- Protokoll- und Audit-Daten (`ledger`, `gacha_pull`, `payment_event`) werden nie gelöscht, nur ggf. nach Fristen archiviert (Datenschutz: Aufbewahrung klären, offen).

## 8. Betrieb (Container auf `edge`)

Das Spiel läuft später als **ein Container** auf `edge` (Netcup) hinter dem vorhandenen **Cloudflare-Tunnel**. Domain, Tunnel-Ingress, DNS und Deployment machen die Menschen bzw. die Homelab-Seite
(`deploy/README.md`); hier liegen nur die Entwürfe.

- **Ein Prozess:** Der Node-Server liefert die gebauten Client-Dateien (`client/dist`) **und** die API aus. Kein eigener Webserver nötig; der Tunnel zeigt auf `http://127.0.0.1:PORT`.
- **Port nur auf `127.0.0.1`** (`127.0.0.1:8080:8080` in Compose). Nie auf `0.0.0.0`; der einzige Weg von außen ist der Tunnel.
- **Konfiguration nur über Umgebungsvariablen**, Liste in `deploy/.env.example` (Werte leer oder Platzhalter). Die echte `.env` liegt nur auf `edge` (nicht im Repo, nicht im Image) und enthält zum Beispiel Cookie-/Session-Parameter und den
  öffentlichen Kek-Game-Schlüssel. Der öffentliche Schlüssel ist kein Geheimnis, wird aber trotzdem als Konfiguration und nicht im Repo geführt, damit die Rotation ohne Commit geht.
- **Daten:** SQLite-Datei in einem benannten Volume (`/data`). **Backup** muss für dieses Volume geklärt werden (Anschluss an das bestehende `edge`-Backup, offene Frage). Ledger und Gacha-Protokoll sind das Wertvolle.
- **Härtung (Entwurf):** Nicht-Root-Nutzer, Read-only-Wurzeldateisystem mit `tmpfs` für `/tmp`, `cap_drop: [ALL]`, `no-new-privileges`, Healthcheck, Ressourcenlimits, Log-Rotation.
- **Echte Client-IP:** Hinter dem Tunnel kommt die IP als `CF-Connecting-IP`; der Server vertraut diesem Header nur von Loopback (`TRUST_PROXY=loopback`). Rate-Limits nutzen diese IP.
- **Sicherheits-Header** setzt der Server (CSP ohne Inline-Skripte, `frame-ancestors 'none'`, `Referrer-Policy`, HSTS kommt von Cloudflare). Die Desktop-Sperre (Abschnitt 4) braucht daher ein extern geladenes statt Inline-Skript oder einen CSP-Hash.
- **Zeit:** `edge` braucht NTP (Abschnitt 6.3, Toleranz 5 s).
- **Cloudflare Access** wird für das Spiel **nicht** vorgeschaltet (Spieler müssten sich doppelt anmelden); der Zugang ist das Launch-Token.
- **Dev:** `docker compose` lokal wie auf `edge`, aber mit `TD_MODE=dev`; nie dieselbe Compose-Datei mit Dev-Modus auf `edge`.

Entwurfsdateien: `deploy/Dockerfile.draft`, `deploy/docker-compose.draft.yml`, `deploy/.env.example`, `deploy/README.md`. Sie bauen auf einem Repo-Root mit npm workspaces
(`sim`, `client`, `server`) auf, das es noch nicht gibt; sie sind deshalb nicht lauffähig und als Entwurf markiert.

## 9. Umgebungsvariablen (Übersicht)

| Variable | Zweck | Beispiel/Platzhalter |
|---|---|---|
| `TD_MODE` | `production` (Standard) oder `dev` | `production` |
| `TD_PORT` | Port im Container | `8080` |
| `TD_PUBLIC_ORIGIN` | öffentliche URL, für Origin-Prüfung und Rücksprünge | `https://duskwardens.flashkeks.com` |
| `TD_PUBLIC_HOST` | Hostname, muss `aud` im Token entsprechen | `duskwardens.flashkeks.com` |
| `KEKGAME_ISSUER` | erwarteter `iss` | `kek-game` |
| `KEKGAME_PUBLIC_KEYS` | JSON: `kid` -> öffentlicher Schlüssel (JWK/PEM) | leer |
| `KEKGAME_URL` | Rücksprung-Link auf Fehlerseiten | `https://game.flashkeks.com` |
| `TD_DB_PATH` | SQLite-Datei | `/data/td.sqlite` |
| `TD_TRUST_PROXY` | wem `CF-Connecting-IP` geglaubt wird | `loopback` |
| `PAYMENT_PROVIDER` | nur `mock` zulässig (7.1) | `mock` |
| `PAYMENTS_LEGAL_REVIEW_DONE` | Sperre für echte Anbieter | leer |
| `GACHA_DAILY_PULL_CAP` | optionales Tageslimit | leer = aus |
| `LOG_LEVEL` | Protokollstufe | `info` |

## 10. Offene Fragen an die Menschen

1. ~~Domain~~ **entschieden:** `duskwardens.flashkeks.com` (06.10.2026). Noch offen: Tunnel-Ingress auf `127.0.0.1:8080`: wie läuft `cloudflared` auf `edge` (Host-Dienst oder Container)? Daran hängt, ob Compose ein Netzwerk braucht.
2. **Kek-Game-Seite:** Wer baut `/td/launch` und die Schlüsselablage? Einigung auf `iss=kek-game`, `kid`-Schema und Rotationsrhythmus.
3. **Backup** des `/data`-Volumes auf `edge` (Ledger und Ziehungsprotokoll): Anschluss an das bestehende Backup?
4. **Koop-Bibliothek** (Colyseus gegen `ws` + eigenes Protokoll) und **bitECS** (MPL-2.0-Pflichten): Entscheidung zu Beginn M2 (laut `tech-options.md` noch offen).
5. **Rechtsrahmen vor echtem Geld:** Alters-/Elternfreigabe, Ausgabelimit, PEGI-Einstufung bei bezahlten Zufallsobjekten, Widerruf; bis dahin bleibt der Mock der einzige Anbieter.
6. **Gacha-Zahlen** (Raten, Pity-Schwellen, Preise): Balancing in M3; bis dahin Platzhalter.
7. **Datenschutz:** Aufbewahrungsfristen für Ledger/Protokolle und Löschung bei Kontolöschung in Kek-Game (kein Rückkanal vorgesehen, siehe 6.5 Punkt 9).
