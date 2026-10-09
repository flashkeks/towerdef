# Ideen für Runde 12+ (Brainstorming mit Max, 09.10.2026 abends) — nichts davon beauftragt

Max: rechte Leiste umschaltbar (Towers / Usables …), auf der Hauptseite ein **Store** für Verbrauchs-Items, bezahlt mit
einer **Sonderwährung** aus Runden-Belohnungen; außerdem ein **Custom-Challenge-Modus** mit Leaderboard. Vorschläge der
Homelab-Session dazu:

## 1. Rechte Leiste mit Reitern

| Reiter | Inhalt |
|---|---|
| **Towers** | wie heute (Türme + Held) |
| **Powers** | Verbrauchs-Items aus dem Inventar, Anzahl je Item, Klick → einsetzen/platzieren |
| **Wave** | Vorschau der nächsten Runde (Gegnertypen, Camo/Panzer-Warnung, RBE) — BTD6 hat das nicht, hilft aber beim Planen |

## 2. Sonderwährung „Embers“ und Store (wie Monkey Money + Powers in BTD6)

- **Verdienen:** je geschaffter Runde ein paar Embers (z. B. 2 + Runde/5), Sieg-Bonus je Schwierigkeit, erste Medaille extra,
  Erfolge/Tagesaufgaben. Nur außerhalb von Challenges mit „no powers“.
- **Store auf der Hauptseite** (Pixel-Laden mit Händler-Figur), Items verbrauchen sich beim Einsatz:

| Power | Wirkung | Vorbild |
|---|---|---|
| **Gold Drop** | +500 Gold sofort | Cash Drop |
| **Lantern Bomb** | große Explosion an beliebiger Stelle, knackt Panzer | MOAB Mine |
| **Caltrops** | Haufen Krähenfüße auf den Weg, knackt die ersten 20 Schichten | Road Spikes |
| **Frost Trap** | Falle auf dem Weg, friert die nächsten Gegner 3 s ein | Glue Trap |
| **Time Warp** | alle Gegner 10 s halb so schnell | – |
| **Lantern Oil** | +25 % Einkommen für 2 Runden | Thrive |
| **Extra Lives** | +25 Leben | – |
| **Insta-Warden** | fertig ausgebauter Turm (z. B. Ranger 2-0-3) gratis platzieren; selten, auch als Belohnung | Insta Monkeys |
| **Hero Boost** | Held +3 Level sofort | Monkey Boost (abgewandelt) |

- Grenzen gegen Überrollen: höchstens 1 Power je Art und Runde; Medaillen zählen trotzdem, Bestenlisten zeigen „Powers used“.
- Technik: Powers als Sim-Befehle (deterministisch, replaybar), Inventar + Embers in Meta, alles lokal machbar.

## 3. Mehr Spiel (Inhalt)

- **Vierter Turm „Lantern Market“** (Farm/Support): Einkommen + Aura, macht Wirtschaft zur Entscheidung (BTD6-Farm-Lehre).
- **Zweite Karte** (Winter oder Sumpf) + **Freeplay** ab R21.
- **Erfolge/Quests** („Gewinne Medium nur mit Rangern“, „Knacke 10.000 Schichten“) → Embers.
- **Tägliche Challenge**: jeden Tag feste Regeln/Seed für alle, Belohnung Embers (offline machbar, Tag = Seed).
- **Boss-Event**: Leviathan mit Stufen 1–5, eigene Rangliste.
- Später (beschlossen): **Helden-/Skin-Gacha**.

## 4. Custom Challenges (Max' Idee)

- **Editor**: Karte, Schwierigkeit, Start-/Endrunde (z. B. R10–R20), erlaubte Türme/Held/Pfade (z. B. „nur Ranger, max. Stufe 3“),
  Startgeld, Leben, Regeln (kein Verkaufen, keine Powers, keine Wissensbaum-Boni, Gegner schneller/mehr HP), eigene Runden
  aus den vorhandenen Gegnern.
- **Teilen**: Challenge als Code (kurzer Text/Link mit allen Regeln) — geht ohne Server.
- **Leaderboard** (wenig Geld ausgegeben, wenige Leben verloren, schnellste Zeit): braucht den **Server (M2)** auf edge mit
  Kek-Game-Login. Vorteil unseres Aufbaus: die Sim ist deterministisch, der Server spielt das Replay nach und prüft den Score →
  schwer zu schummeln.
- Reihenfolge: erst Tägliche Challenge (gleicher Mechanismus, festes Regelwerk), dann Editor + Code, dann Server + Bestenliste.

## Empfehlung Reihenfolge

Runde 12: Reiter + Embers + Store + 6 Powers + Wave-Vorschau (alles lokal). Runde 13: vierter Turm, zweite Karte, Freeplay.
Runde 14: Tägliche Challenge + Challenge-Editor mit Code. Danach M2 (Server, Login, Bestenlisten).
