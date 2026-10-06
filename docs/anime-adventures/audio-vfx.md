# Audio / VFX / Animationen

Legende: `ART · CONFIDENCE · [Quelle]`, siehe [README.md](README.md#kennzeichnung). `S72:Update Log (U<n>)` = Patchnote im Wiki-Update-Log. **LEGACY** = U1–U18.5, **RR** = ab U19.

> **Keine Assets kopieren.** Diese Datei beschreibt nur Typ, Zweck, Auslöser, Dauer und Verhalten. Asset-IDs, Sound-, Modell- und Animationsnamen werden **nicht** übernommen. Die Datenmodule (S65–S67) enthalten Asset-Felder (`ASSETS`, `animation_set`, `sfx`, `fx`-IDs); sie wurden bewusst entfernt bzw. nicht ausgewertet.
>
> **Dauern:** Kein Volltext nennt Animations- oder Sounddauern. Alle Dauern sind `DESIGN`-Richtwerte für unseren Nachbau. Belegt ist bei den Zeilen mit OBSERVED nur die **Existenz** und das **Verhalten** des Effekts.

## Unit-Animationen und Angriffs-VFX

| Typ | Zweck | Auslöser | Verhalten | Dauer (DESIGN) | Tag |
|---|---|---|---|---|---|
| Attack-Animation | Angriff zeigen | jeder Angriff (SPA-Takt) | Windup → Trefferzeitpunkt → Recovery. Das Modul hat je Unit ein Feld `knockback_points` (meist `[0.5]`); vermutlich der Trefferzeitpunkt im Ablauf, Bedeutung **UNKNOWN** | 0,2–0,6 s | RECONSTRUCTED · MEDIUM; Feld OBSERVED · HIGH · [S65] |
| Projektil-/Slash-VFX | Treffer zeigen | Treffer | Form passt zur AoE (Single, Circle, Cone, Line, Full) | 0,1–0,4 s | RECONSTRUCTED · MEDIUM · AoE-Formen [S67] |
| Neue Angriffsform bei Upgrade | Fortschritt sichtbar machen | bestimmte Upgrade-Stufen | Upgrade-Stufen tragen Notizen wie „+ Wind Needles“ und wechseln den Angriff (`primary_attack`); oft mit neuer AoE-Form | – | OBSERVED · HIGH · [S65] |
| Ability-Animation | aktive Fähigkeit | Button oder Auto-Activate (U13.5) | größere Animation; Buff-Abilities zeigen eine Aura auf gebufften Units | 0,5–1,5 s | RECONSTRUCTED · MEDIUM; Auto-Activate OBSERVED · HIGH · [S72:Update Log (U13.5)] |
| Buff-Aura | gebuffte Unit markieren | Buff aktiv | Glow oder Partikel. Belegt: Buff-Beträge werden in einer Status-UI angezeigt (U14); einige Buff-Units haben eigene Aura-Effekte (Modul-Feld `fx` an `aura_buff`) | Buff-Dauer | OBSERVED · HIGH (UI, Feld) · [S72:Update Log (U14); S65] / RECONSTRUCTED · LOW (Aussehen) |
| Beschwörungen | Summon-Units laufen den Pfad entlang | Angriff vom Typ Spawn | eigene Lauf-Animation, verschwinden bei 0 HP | – | OBSERVED · HIGH · [S72:Effects „Summon“] |
| Emote auf Units | Spaß / Social | Emote des Spielers | seit U19 spielen Emotes auch auf den eigenen Units | Emote-Dauer | OBSERVED · HIGH · [S72:Update Log (U19)] |

## Trait-, Shiny- und Kosmetik-Effekte

| Typ | Aussehen | Auslöser | Tag |
|---|---|---|---|
| Trait Godspeed | blaue Blitz-Aura | permanent | OBSERVED · HIGH · [S72:Traits; S73 Traits] |
| Trait Reaper | rot-schwärzliche Aura | permanent | OBSERVED · HIGH · [S72:Traits; S73 Traits] |
| Trait Celestial | lila „Galaxie“-Aura | permanent | OBSERVED · HIGH · [S72:Traits] |
| Trait Divine | Engelsflügel (früh LEGACY: Aura plus Flügel) | permanent | OBSERVED · HIGH · [S72:Traits; S73 Traits] |
| Trait Golden | Unit erscheint aus Gold | permanent | OBSERVED · HIGH · [S72:Traits; S73 Traits] |
| Trait Unique | Aura aus Runenzeichen | permanent | OBSERVED · HIGH · [S72:Traits; S73 Traits] |
| Niedrigere Traits (Superior, Range, Nimble …) | kein Effekt belegt | – | UNKNOWN |
| Trait-VFX überarbeitet | „Trait visual effects improvements“ | U19 (RR) | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Shiny | seltene Skin-Variante der Unit; rein kosmetisch | permanent | OBSERVED · HIGH · [S72:FAQ] |
| Cosmetic Effects | Zusatzeffekte bei einigen Units, wenn ausgerüstet (seit U4); viele weitere in RR | permanent | OBSERVED · HIGH · [S45 → S72:Update Log (U4, U20.4.1); S72:Cosmetics] |
| Skins | alternative Optik; handelbar | permanent | OBSERVED · HIGH · [S72:Trading] |

## Gegner-VFX und Markierungen

| Typ | Zweck | Auslöser | Verhalten | Tag |
|---|---|---|---|---|
| Tank-Glow | Tank-Gegner erkennen | Spawn | **weißer Glow** über dem Modell | OBSERVED · HIGH · [S14 → S72:Enemy Mechanics] |
| Shield-Anzeige | Schild-Instanzen | Spawn / Treffer | Schild schluckt ganze Treffer, Zähler sinkt; Bruch-Effekt | RECONSTRUCTED · MEDIUM (Mechanik [S72:Enemy Mechanics]) |
| Resistenz-/Schwäche-Icons | Affinitäten zeigen | Spawn in Portal/Legend | Schwäche: Icon mit Prozentwert über der Lebensleiste; Resistenz: Schild-Icon | OBSERVED · HIGH · [S12 → S72:Damage Affinities Elements] |
| Fragile / Shattered | Debuff von Illusionist (Transcended) | Debuff aktiv / ausgelöst | lila Lebensleiste mit „Fragile“, schwarzer Text „SHATTERED“ beim Auslösen | OBSERVED · HIGH · [S72:Illusionist (Transcended)] |
| Gold-Symbol | Yen-Bonus bei Kill (Weather Girl (Thief)) | Ability | Gegner spawnen mit leuchtendem Gold-Symbol | OBSERVED · HIGH · [S72:Effects] |
| Partyhut | Gegner trägt Drop (Anniversary Star) | Spawn | Gegner mit Partyhut droppt den Gegenstand | OBSERVED · HIGH · [S72:Anniversary Star] |
| Ziel-Highlight | anvisierte Gegner markieren | Unit visiert an | Hervorhebung (U20.4.1) | OBSERVED · HIGH · [S72:Update Log (U20.4.1)] |
| Status-VFX | Burn, Bleed, Poison, Freeze, Stun, Slow, Timestop | Effekt aktiv | Aussehen in keinem Volltext beschrieben. Vorschlag: Burn = Flammen, Freeze = Eis, Stun = Sterne, Timestop = Graustufe. Ein schwarzer Brand-Effekt existiert als Passiv „Black Flames“ (Izo (Samurai)) | DESIGN; Existenz OBSERVED · HIGH · [S72:Izo (Samurai)] |
| Immunitäts-Anzeige | 1 s Sperre nach Stun/Freeze | nach Effekt-Ende | Cooldown am Gegner sichtbar (U14) | OBSERVED · HIGH · [S72:Update Log (U8, U14)] |
| Enemy Walk / Death | Bewegung, Kill | dauerhaft / HP ≤ 0 | Loop bzw. Fade/Dissolve, 0,3–0,6 s | RECONSTRUCTED · LOW; Dauer DESIGN |

## Meta- und UI-Effekte

| Typ | Zweck | Auslöser | Verhalten | Dauer (DESIGN) | Tag |
|---|---|---|---|---|---|
| Summon-Animation | Gacha-Spannung | Summon | mehrstufig; Setting **Quick Summon** überspringt den ersten Teil (U20.4.1). Unit danach mit Q/E drehbar | 1,5–3 s | OBSERVED · HIGH (Mehrstufigkeit, Skip) · [S72:Update Log (U19, U20.4.1)] / RECONSTRUCTED · LOW (Ablauf) |
| Globale Chat-Ansage | seltene Pulls feiern | Shiny Mythic oder Secret | Systemnachricht in allen Servern | – | OBSERVED · HIGH · [S72:Summon] |
| Globale Nachricht Infinity Castle | Bestleistung | neuer Top-Raum | Systemnachricht | – | OBSERVED · HIGH · [S72:Update Log (U17)] |
| Evolution-Animation | Evolution | Evolve | Übergang zur neuen Form | 2–3 s | RECONSTRUCTED · LOW |
| Quest-Toast | Feedback | Quest abgeschlossen | Benachrichtigung (U19.5) | 2–3 s | OBSERVED · HIGH · [S72:Update Log (U19.5)] |
| UI-Sounds | Klick, Kauf, Fehler | UI | kurz | < 0,3 s | RECONSTRUCTED |
| Wave-Sound | Wave-Start | Wave | Signal | 1 s | RECONSTRUCTED · LOW |
| Boss-Sound | Boss-Spawn | Boss-Wave | Warnsignal plus Musikwechsel | 2 s | RECONSTRUCTED · LOW |
| Victory / Defeat | Ende | Matchende | Fanfare bzw. Moll-Stinger | 2–4 s | RECONSTRUCTED · LOW |
| Lobby-Musik | Atmosphäre | Lobby | eigene Settings seit U19 | Loop | OBSERVED · HIGH · [S72:Update Log (U19)] |
| Emotes | Social | Spieler (Taste) | Avatar-Animation; Kauf meist im Trophy-Shop | – | OBSERVED · HIGH · [S20 → S72:Emotes] |
| Titel über dem Kopf | Status | ausgerüstet | Text über Avatar und im Chat | – | OBSERVED · HIGH · [S72:Titles] |
| Display Units | Lobby-Showcase | Gamepass | die ersten 3 bzw. alle ausgerüsteten Units begleiten den Avatar | – | OBSERVED · HIGH · [S22 → S72:Store] |

## Performance-Schalter

| Schalter | Wirkung | Seit | Tag |
|---|---|---|---|
| Effekte anderer Spieler ausblenden | blendet VFX fremder Units aus | U2 | OBSERVED · HIGH · [S72:Update Log (U2)] |
| Low-Quality-FX | reduziert Effekte („does not affect all effects yet“) | U4 | OBSERVED · HIGH · [S45 → S72:Update Log (U4)] |
| Depth of Field | Tiefenschärfe, nur für starke Geräte | U12.5 | OBSERVED · HIGH · [S72:Update Log (U12.5)] |
| Grafik-Update der Maps | „Graphics update for most maps“ | U19.5 (RR) | OBSERVED · HIGH · [S72:Update Log (U19.5)] |

## Für unseren Nachbau (DESIGN)

- Sprite-Sheets oder Spine/DragonBones für 2D bzw. eigenes Low-Poly-3D. Jede Unit braucht `idle`, `attack` (mit Treffer-Marker), `ability` und optional Varianten je Angriffsform (AA wechselt den Angriff an bestimmten Upgrade-Stufen).
- Gegner brauchen `walk`, `hit-flash` und `death`; Shader-Varianten für Tank-Glow, Shield und Status-Tints.
- Den Trefferzeitpunkt **datengetrieben** auslösen (`hitFrameMs` oder ein Anteil wie AAs `knockback_points: 0.5`), damit Animation und Simulation synchron bleiben, die Simulation aber nicht von der Animation abhängt.
- Trait-Optik als Overlay-Layer je Trait-ID (Aura, Flügel, Material-Tausch), unabhängig vom Unit-Sprite.
- Zwei Performance-Schalter wie AA: fremde Effekte aus und reduzierte Partikel.
