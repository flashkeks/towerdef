# So fügt man eine Figur hinzu (Crossover, Runde 8 / P6)

Eine neue Figur ist **ein Datensatz plus ein Bild**, null Code. Format: [format.md](format.md). Beispiele: `sim/data/units/crossover.json` (25 Figuren).

## 1. Datensatz

Zwei Wege, beide enden in `sim/data/units/crossover.json`:

- **Über die Spec (empfohlen):** Eintrag in `tools/aa-import/crossover-spec.ts` (Feld `FIGURES`): `id` (Präfix `x_`), `name`, `rarity`, `placement`, optional `damageType`, `elements`, `critChance`, `footprint`, `hitsAir`, Faktoren `dmg`/`spa`/`range` (1 = Median der Seltenheit), `flavor`, `imageQuery` und `stages`: je Stufe ab `from` ein Angriff (`aoe` single/circle/cone/line/full, `radius`/`angle`/`width`, `hits`, `dot`, `special`). Dann `npm run crossover` (schreibt die Datei, rechnet die Zahlen aus der Vorlage).
- **Von Hand:** Datensatz direkt in `crossover.json` (`units` + `attacks`, Angriffs-IDs `x_<figur>:<key>`, global eindeutig). Dann nur prüfen (Schritt 5). Beim nächsten `npm run crossover` wird von Hand Ergänztes überschrieben, also zusätzlich in die Spec übernehmen.

Pflichtfelder für Anzeige und Bild: `flavor` (ein Satz, englisch), `imageQuery`, `source: "custom"` (**damit die Figur nur im Crossover-Banner liegt**; ohne `source: "custom"` landet sie im Standard-Pool).

## 2. Werte-Vorlage

Nicht frei erfinden: `npm run crossover:vorlage -- Mythic` druckt die Median-Stufenkurve der Seltenheit (Stufenzahl, Kosten, Schaden, SPA, Reichweite je Stufe) samt Band P5..P95 aus `aa.json`. Faktoren auf die Kurve genügen. Angriffsformen: Einzelziel +20 % Schaden ist ok, `full`/große Flächen eher darunter; Effekte aus `sim/data/effects.json` (Liste in format.md). Einen **neuen Effekt-Typ** gibt es nur mit Code, vorher aus vorhandenen kombinieren (Confused, Slow, Stun, Timestop, Knockback, Wild Card, Motivate, Battlelust …).

## 3. Bild-Manifest

`npm run aa-import` übernimmt jede Crossover-Figur ins Manifest `client/public/aa/manifest.json` mit `source: "custom"`, `imageQuery` und `path: /aa/units/<id>.webp`. Das Bild (256 x 256, transparent) besorgt die Homelab-Seite nach `imageQuery`. Ohne Bild zeigt der Client die Initialen-Karte.

## 4. Banner

Nichts zu tun: der Pool `crossover` im Banner `meta/data/banners/crossover.json` liest alle Units mit `source: "custom"`. Raten, Pity und die Featured-Unit (`featured.unitId`) stehen nur in dieser Datei. Ändert sich die Tabelle, `ratesVersion` anheben. Hinweis: jede neue Figur senkt die Einzelrate ihrer Seltenheit (gleichverteilt im Pool).

## 5. Test

```bash
npm run crossover:check                      # Datei == Spec, alle Werte im AA-Band
cd sim && npx vitest run test/crossover.test.ts test/units-data.test.ts
cd ../meta && npx vitest run
```

`crossover.test.ts` zählt die Figuren fest (25): bei einer neuen Figur die Zahl dort, in `sim/test/aa-import.test.ts` (575) und `meta/test/aa-p2.test.ts` (575) anheben. Rauchprobe einzeln: Bot `mono-x_<id>` in `runMatch`.
