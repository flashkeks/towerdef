# deploy/ — Entwurf

**Nur Entwurf (Paket P7).** `Dockerfile.draft` und `docker-compose.draft.yml` sind nicht lauffaehig: Es gibt noch kein `server/`, kein `client/` und kein Root-`package.json` mit Workspaces.
Sie halten fest, wie der Betrieb aussehen soll. Begruendung und Zusammenhang: `docs/architecture.md`, Abschnitt 8.

Festlegungen:

- Port nur auf `127.0.0.1:8080`; von aussen erreichbar nur ueber den Cloudflare-Tunnel.
- Konfiguration nur ueber Umgebungsvariablen. `.env.example` enthaelt Platzhalter ohne Werte; die echte `.env` liegt nur auf `edge` und gehoert nie ins Repo (in `.gitignore` aufnehmen, sobald `deploy/.env` benutzt wird).
- Keine Secrets im Image oder Repo. Der oeffentliche Kek-Game-Schluessel wird per `KEKGAME_PUBLIC_KEYS` zur Laufzeit gesetzt.
- Dev-Modus (`TD_MODE=dev`) gehoert nie auf `edge`.

**Deployment, Domain, DNS und Tunnel-Ingress machen die Menschen** bzw. die Homelab-Seite. Dieser Ordner enthaelt dafuer nichts Ausfuehrbares.
Offene Fragen (Domain, wie `cloudflared` auf `edge` laeuft, Backup des Volumes): `docs/architecture.md`, Abschnitt 10.
