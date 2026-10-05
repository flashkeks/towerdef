# Audio / VFX / Animationen

> **Keine Assets kopieren.** Diese Datei beschreibt nur Typ, Zweck, Trigger und Verhalten. Öffentliche Asset-IDs wurden **nicht** recherchiert (Videos und Roblox-Seiten nicht abrufbar). Alle Dauern sind `DESIGN`-Richtwerte für unseren Nachbau, sofern nicht anders markiert.

| Asset-Typ | Zweck | Trigger | Verhalten | Dauer (DESIGN) | Tag |
|---|---|---|---|---|---|
| Unit-Attack-Animation | Angriff visualisieren | jeder Angriff | Windup → Hit-Frame → Recovery; Hit-Frame löst den Schaden aus | 0,2–0,6 s | RECONSTRUCTED · MEDIUM |
| Projektil/Slash-VFX | Treffer zeigen | Hit | Form passt zur AoE (Kreis, Kegel, Linie) | 0,1–0,4 s | RECONSTRUCTED · MEDIUM |
| Ability-Animation | Active Ability | Button | größere Animation plus Aura auf gebufften Units | 0,5–1,5 s | RECONSTRUCTED · MEDIUM |
| Buff-Aura | gebuffte Unit markieren | Buff aktiv | Glow; Stärke als Farbe oder Partikel | Buff-Dauer | RECONSTRUCTED · LOW |
| Status-VFX | Burn, Bleed, Poison, Freeze, Stun, Slow | Effekt aktiv | Burn = Flammen (Black Burn dunkel); Freeze = Eis; Stun = Sterne | Effekt-Dauer | OBSERVED (Existenz Black Burn) · LOW |
| Tank-Glow | Tank-Gegner | Spawn | **weißer Glow** | permanent | OBSERVED · HIGH · [S14] |
| Shield-VFX | Shield-Instanzen | Spawn/Hit | Schild-Overlay; Zähler sinkt pro Hit; Shatter = Bruch-Effekt | – | RECONSTRUCTED · MEDIUM |
| Enemy Walk | Bewegung | dauerhaft | Loop | – | RECONSTRUCTED |
| Death-Animation | Kill | HP ≤ 0 | Fade/Dissolve | 0,3–0,6 s | RECONSTRUCTED · LOW |
| Summon-Animation | Gacha-Spannung | Summon | Aufbau → Rarität-Farbe enthüllt → Unit-Karte; Shiny mit Extra-Glanz | 1,5–3 s (skippbar) | RECONSTRUCTED · LOW |
| Evolution-Animation | Evolution | Evolve | Lichtsäule → neue Form | 2–3 s | RECONSTRUCTED · LOW |
| Shiny-Effekt | Shiny markieren | permanent | Farbvariante plus Glitzer | – | OBSERVED (Existenz) · LOW |
| Trait-Effekt | Trait anzeigen | permanent/UI | Icon bzw. Aura nach Trait-Rarität | – | UNKNOWN |
| Cosmetic Effects | Unit-Effekte (seit U4) | permanent | Partikel | – | OBSERVED · HIGH · [S45] |
| Low-Quality-FX | Performance | Setting | reduziert die Partikel | – | OBSERVED · HIGH · [S45] |
| UI-Sounds | Klick, Kauf, Fehler | UI | kurz | < 0,3 s | RECONSTRUCTED |
| Wave-Sound | Wave-Start | Wave | Jingle/Horn | 1 s | RECONSTRUCTED · LOW |
| Boss-Sound | Boss-Spawn | Boss-Wave | Warnsignal plus Musikwechsel | 2 s | RECONSTRUCTED · LOW |
| Victory / Defeat | Ende | Matchende | Fanfare bzw. Moll-Stinger | 2–4 s | RECONSTRUCTED · LOW |
| Emotes | Social | Spieler | Animation (Trophies-Shop) | – | OBSERVED · HIGH · [S20] |
| Display Units | Lobby-Showcase | Gamepass | Units laufen neben dem Spieler | – | OBSERVED · HIGH · [S22] |

## Empfehlung für unser Spiel

- Sprite-Sheets oder Spine/DragonBones für 2D bzw. eigenes Low-Poly-3D. Jede Unit braucht `idle`, `attack` (mit Hit-Frame-Marker), `ability` und optional `upgradeTier`-Varianten.
- Gegner brauchen `walk`, `hit-flash` und `death`; Varianten-Shader für Tank-Glow, Shield und Status-Tints.
- Den Hit-Frame **datengetrieben** auslösen (`hitFrameMs` im Unit-Schema), damit Animation und Simulation synchron bleiben, die Simulation aber nicht von der Animation abhängt.
