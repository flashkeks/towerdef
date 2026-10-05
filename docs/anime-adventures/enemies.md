# Enemies

> **Stand:** Gegnertypen und Mechaniken sind gut belegt. **Konkrete HP-, Speed- und Reward-Werte pro Gegner sind nicht öffentlich auffindbar gewesen (UNKNOWN).** Bosse sind nur namentlich für einige Welten belegt.

## Enemy-Modifikatoren (Mechaniken)

| Typ | Verhalten | Konter | Tag |
|---|---|---|---|
| **Normal (Ground)** | läuft den Pfad entlang | alle Units | VERIFIED · CONFIRMED |
| **Flying** | wird von Ground-Units **ignoriert**; nur Hill- und Hybrid-Units treffen. Seit Update 3 (Hollow World) | Hill-/Hybrid-DPS; Abilities, die Flying aufheben | OBSERVED · HIGH · [S14, S45] |
| **Shield** | hat N **Shield-Instanzen**; **jeder Treffer entfernt 1 Instanz** (statt HP-Schaden?) | Multi-Hit-Units, **Shatter** (entfernt alle) | OBSERVED · HIGH · [S14, S13] |
| **Regen** | regeneriert HP über Zeit (Flying-Gegner **nicht**) | Bleed (stoppt Regen), Burn (senkt Regen), Nullify-Abilities | OBSERVED · HIGH · [S14, S13] |
| **Hyper-Regen** | regeneriert noch stärker | wie oben | OBSERVED · HIGH · [S15] |
| **Tank** | weißer Glow; nimmt **leicht reduzierten Schaden**; in der Challenge-Variante „mehr HP und Armor“ | hohe Rohschaden-Units | OBSERVED · HIGH · [S14, S15] |
| **Steel-Plated** | **3× HP** und **+20 Shield-Instanzen** | Shatter, Multi-Hit | OBSERVED · HIGH · [S15] |
| **Fast** | höhere Speed | Slow, Stun, Range | OBSERVED · HIGH · [S14] |
| **Godspeed** | noch höhere Speed | wie oben | OBSERVED · HIGH · [S15] |
| **Boss** | großes HP-Polster; Act-Ende bzw. alle 10 Waves in Infinite | Reaper-Trait, Strongest-Targeting | OBSERVED · HIGH · [S06] |
| **Typ-Resistenz/Schwäche** | in Portals und Legend Stages pro Gegner, als Icon angezeigt | passende Damage-Affinität, True Damage, PEN-Relic | OBSERVED · HIGH · [S12] |
| Stealth | **nicht belegt** | – | UNKNOWN |
| Mini-Boss | **nicht belegt** als eigene Kategorie | – | UNKNOWN |

### Offene Detailfragen

- **Shield:** Blockiert eine Shield-Instanz den Schaden des Hits komplett, oder läuft HP-Schaden parallel? Der Satz „depleted by one point every hit“ und die Konterlogik (Multi-Hit) sprechen für **kompletten Block pro Hit**, bis alle Instanzen weg sind. RECONSTRUCTED · MEDIUM
- **Regen-Rate:** UNKNOWN. `DESIGN`: x % maxHP/s.
- **Tank-Reduktion:** UNKNOWN. `DESIGN`: −20 % Schaden.
- **Fast-/Godspeed-Multiplikatoren:** UNKNOWN. `DESIGN`: ×1,5 / ×2.

## Bekannte Bosse und Stages (RR-Namen)

| Welt | Act | Stage-Name | Boss | Tag |
|---|---|---|---|---|
| Planet Greenie (LEGACY: Planet Namak) | 1 | Prodigal Prince | Vogita | OBSERVED · MEDIUM · [S07] |
| | 2 | Reckless Rage | Doria | OBSERVED · MEDIUM |
| | 3 | Dazzling Disgust | Argon | OBSERVED · MEDIUM |
| | 4 | Formidable Fighting Force | Giyu | OBSERVED · MEDIUM |
| | 5 | Terrifying Tyrant | Friezo | OBSERVED · MEDIUM |
| | 6 | – | Friezo (Full Power / Final Form) | OBSERVED · MEDIUM |
| Spirit World | 6 | The Wolf | Coyote / Spirit Wolf | OBSERVED · LOW |
| (unbekannt) | 6 | The Purple Tyrant | Freezo | OBSERVED · LOW |
| Mountain Temple (Legacy) | 6 | – | Gilgamesh (Endboss; dropt Noble Portals) | OBSERVED · MEDIUM · [S48] |
| Cursed Womb (Dungeon) | – | – | Finger Bearer (Wave 15; dropt Cursed Finger) | OBSERVED · MEDIUM · [S56] |
| Sacred Planet (Raid) | 4 / 5 | – | The Genie / The Pure Form | OBSERVED · HIGH · [S17] |
| Infinite (neueste Welt) | – | – | **Star Golem** (Spawn-Chance; dropt Star Remnants) | OBSERVED · HIGH · [S06] |

## Datenfelder pro Gegner – Abdeckung

| Feld | Status |
|---|---|
| Name | teilweise (nur Bosse) |
| World / Stage | teilweise |
| HP | **UNKNOWN** |
| Speed | **UNKNOWN** (relativ: Map-Laufzeiten bei Basis-Speed, siehe [maps.md](maps.md)) |
| Defense / Resistance | Mechanik belegt, Werte UNKNOWN |
| Air/Ground | Mechanik belegt, Zuordnung pro Gegner UNKNOWN |
| Reward (Yen) | **UNKNOWN** |
| Spawn Conditions, Wave | **UNKNOWN** (Infinite-Bosse alle 10 Waves) |
| Immunities | CC-Cooldowns belegt ([combat-system.md](combat-system.md#7-status-effekte-debuffs-auf-gegnern)); echte Immunitäten UNKNOWN |

## Enemy AI und Pathfinding

| Aspekt | AA-Verhalten | Tag |
|---|---|---|
| Path System | Fester, vorgegebener **NPC-Pfad** pro Map (Wegpunkt-Kette); kein dynamisches Pathfinding | OBSERVED · HIGH (Map-Längen werden „vom Anfang des NPC-Pfads bis zum Ende“ gemessen [S38]) |
| Branching | **Shibuya District** hat einen **Doppelpfad** (zwei Pfade). Sonst ein Pfad | OBSERVED · MEDIUM · [S07] |
| Movement | konstante Geschwindigkeit entlang des Pfads, modifiziert durch Slow, Stun usw. | RECONSTRUCTED · HIGH |
| Targeting durch Gegner | Gegner greifen Units **nicht** an (keine Belege für Unit-HP) | RECONSTRUCTED · MEDIUM |
| Boss Movement | wie normale Gegner, langsamer bzw. mit Sonderfähigkeiten: UNKNOWN | UNKNOWN |
| Stacking/Collision | Gegner laufen übereinander, keine Kollision | RECONSTRUCTED · MEDIUM (Genre-Standard auf Roblox) |
| Slow | multiplikativ auf die Speed; danach 4 s Slow-Schutz | OBSERVED · HIGH · [S13] |
| Stun / Freeze / Timestop | Speed = 0 für die Dauer; danach 10–14 s bzw. 10 s Schutz | OBSERVED · HIGH · [S13] |
| Knockback | Position auf dem Pfad zurücksetzen; 30–31 s Schutz | OBSERVED · HIGH · [S13] |
| Rewind | Bewegungsrichtung umkehren für die Dauer | OBSERVED · HIGH · [S13] |
| Teleportation | nicht belegt | UNKNOWN |

### Implementierung im Webspiel (Empfehlung)

```text
Path = Polyline [P0 … Pn], vorberechnete Segmentlängen, kumulierte Länge L
Enemy.state = { s: Distanz entlang Pfad, dir: +1|−1, speedBase, mods[] }

tick(dt):
  if stunned/frozen/timestopped: return
  v = speedBase × Π(slowMods) × (rewindActive ? −1 : 1)
  s = clamp(s + v·dt, 0, L)
  pos = samplePath(s)              // binäre Suche über kumulierte Längen
  if s >= L: leak()

knockback(d): s = max(0, s − d)
progress (für "First") = s / L      // bei mehreren Pfaden: s / L_path
```

Flying-Gegner nutzen denselben Pfad (nur andere Höhe bzw. andere Zielbarkeit). Ob Flying eigene Pfade hat: UNKNOWN.
