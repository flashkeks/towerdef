/**
 * Figuren (Runde 10 / P2): alles, was im Match als Bild auf dem Feld steht, wird hier einmal gezeichnet und als Textur gebacken.
 * Danach sind Units und Gegner nur noch Sprites mit gemeinsamen Texturen (kein Zeichnen je Frame, wenige Zustandswechsel).
 *
 * - Unit-Figur: runde Portraet-Scheibe mit Seltenheits-Ring. Das Bild kommt aus `/aa/units/<id>.webp` (siehe `view/portrait.ts`, unveraendert);
 *   fehlt es, steht eine **gestaltete Ersatzfigur** (Silhouette mit Rand-Licht und leuchtenden Augen, Frisur und Zubehoer aus der ID, Farbe aus
 *   dem Element), nie nackte Initialen.
 * - Gegner-Figur je Typ (Grunt, Runner, Brute, Flyer, Splitter, Elite, Boss) in je zwei Schrittbildern.
 * - Kleinkram: Schatten, Element-Abzeichen, Ring-Glanz, Blickrichtungs-Keil.
 */
import { Assets, Container, Graphics, Rectangle, Sprite, Texture, type Renderer } from 'pixi.js';
import { hash, rng } from '../ui/kit/art';
import { hasPortrait, portraitKnown, portraitUrl } from '../view/portrait';
import { enemyLook, lookOf, rarityLook, unitLook, type ElementLook, type EnemyLook, type LookKey, type ParticleKind } from '../view/look';

const mix = (a: number, b: number, f: number): number => {
  const r = ((a >> 16) & 255) * (1 - f) + ((b >> 16) & 255) * f;
  const g = ((a >> 8) & 255) * (1 - f) + ((b >> 8) & 255) * f;
  const bl = (a & 255) * (1 - f) + (b & 255) * f;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
};

/** Radius der Unit-Figur in Pixeln (Kachelgroesse x Faktor). */
export const unitRadius = (tile: number, footprint: 1 | 2): number => tile * (footprint === 2 ? 0.74 : 0.37);

/** Dunkelstes Silhouetten-Blau, aus dem Element etwas getoent. */
const silhouette = (look: ElementLook): number => mix(0x05060f, look.dark, 0.22);

/** Element-Symbol (Kante 1 = Einheitsquadrat um 0/0) als Linien und Flaechen, eigene Zeichnung. */
export function drawGlyph(g: Graphics, key: LookKey, s: number, color: number): void {
  const w = Math.max(1.5, s * 0.14);
  const stroke = (): void => void g.stroke({ width: w, color, cap: 'round', join: 'round' });
  switch (key) {
    case 'fire':
      g.moveTo(0, -s * 0.5).bezierCurveTo(s * 0.12, -s * 0.2, s * 0.42, -s * 0.05, s * 0.34, s * 0.2).bezierCurveTo(s * 0.28, s * 0.46, -s * 0.28, s * 0.46, -s * 0.34, s * 0.2).bezierCurveTo(-s * 0.4, -s * 0.02, -s * 0.12, -s * 0.12, 0, -s * 0.5).fill({ color });
      break;
    case 'water':
      g.moveTo(0, -s * 0.5).bezierCurveTo(s * 0.1, -s * 0.2, s * 0.38, 0, s * 0.34, s * 0.2).bezierCurveTo(s * 0.3, s * 0.46, -s * 0.3, s * 0.46, -s * 0.34, s * 0.2).bezierCurveTo(-s * 0.38, 0, -s * 0.1, -s * 0.2, 0, -s * 0.5).fill({ color });
      break;
    case 'ice':
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.moveTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5).lineTo(-Math.cos(a) * s * 0.5, -Math.sin(a) * s * 0.5);
      }
      stroke();
      break;
    case 'lightning':
    case 'true':
      g.poly([s * 0.12, -s * 0.5, -s * 0.34, s * 0.06, -s * 0.02, s * 0.06, -s * 0.12, s * 0.5, s * 0.34, -s * 0.12, s * 0.02, -s * 0.12]).fill({ color });
      break;
    case 'air':
      g.moveTo(-s * 0.46, -s * 0.16).lineTo(s * 0.18, -s * 0.16).arc(s * 0.18, -s * 0.32, s * 0.16, Math.PI / 2, -Math.PI * 0.85, true);
      g.moveTo(-s * 0.46, s * 0.1).lineTo(s * 0.3, s * 0.1).arc(s * 0.3, s * 0.26, s * 0.16, -Math.PI / 2, Math.PI * 0.85);
      stroke();
      break;
    case 'light':
      g.circle(0, 0, s * 0.2).fill({ color });
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3).lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
      }
      stroke();
      break;
    case 'dark':
      g.arc(0, 0, s * 0.42, -Math.PI * 0.2, Math.PI * 1.2).arc(s * 0.2, -s * 0.06, s * 0.32, Math.PI * 1.05, -Math.PI * 0.05, true).fill({ color });
      break;
    case 'rose':
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        g.circle(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.26, s * 0.2).fill({ color });
      }
      break;
    case 'magic':
      g.poly([0, -s * 0.5, s * 0.12, -s * 0.12, s * 0.5, 0, s * 0.12, s * 0.12, 0, s * 0.5, -s * 0.12, s * 0.12, -s * 0.5, 0, -s * 0.12, -s * 0.12]).fill({ color });
      break;
    default:
      // physisch: Schwert, Spitze oben rechts
      g.moveTo(-s * 0.34, s * 0.34).lineTo(s * 0.3, -s * 0.3).moveTo(-s * 0.3, s * 0.1).lineTo(-s * 0.1, s * 0.3).moveTo(-s * 0.46, s * 0.46).lineTo(-s * 0.3, s * 0.3);
      stroke();
  }
}

/** Frisur-Varianten der Ersatzfigur, jeweils um den Kopf bei 0/0 (Kopfradius 1). */
function drawHair(g: Graphics, v: number, col: number, rim: number): void {
  const fill = { color: col };
  switch (v) {
    case 0: // struppig, kurz
      g.poly([-1.15, 0.1, -1.3, -0.7, -0.8, -0.45, -0.7, -1.3, -0.2, -0.8, 0.1, -1.55, 0.4, -0.8, 0.9, -1.2, 0.85, -0.45, 1.35, -0.55, 1.15, 0.1, 0.8, -0.55, -0.8, -0.55]).fill(fill);
      break;
    case 1: // lang, faellt hinter die Schultern
      g.moveTo(-1.2, 0.2).bezierCurveTo(-1.5, -1.2, 1.5, -1.2, 1.2, 0.2).lineTo(1.5, 2.1).lineTo(0.95, 1.7).lineTo(0.85, -0.25).bezierCurveTo(0.3, -0.7, -0.4, -0.7, -0.85, -0.25).lineTo(-0.95, 1.7).lineTo(-1.5, 2.1).closePath().fill(fill);
      break;
    case 2: // Kapuze
      g.moveTo(-1.5, 1.3).bezierCurveTo(-1.8, -1.6, 1.8, -1.6, 1.5, 1.3).lineTo(0.95, 0.5).bezierCurveTo(0.8, -0.5, -0.8, -0.5, -0.95, 0.5).closePath().fill(fill);
      break;
    case 3: // Dutt
      g.moveTo(-1.15, 0.1).bezierCurveTo(-1.3, -1.2, 1.3, -1.2, 1.15, 0.1).lineTo(0.8, -0.45).lineTo(-0.8, -0.45).closePath().fill(fill);
      g.circle(0, -1.5, 0.5).fill(fill);
      break;
    default: // Zoepfe
      g.moveTo(-1.2, 0.1).bezierCurveTo(-1.4, -1.2, 1.4, -1.2, 1.2, 0.1).lineTo(0.8, -0.5).lineTo(-0.8, -0.5).closePath().fill(fill);
      g.poly([-1.15, 0.1, -1.55, 1.9, -1.05, 1.95, -0.85, 0.2]).fill(fill);
      g.poly([1.15, 0.1, 1.55, 1.9, 1.05, 1.95, 0.85, 0.2]).fill(fill);
  }
  // Rand-Licht oben am Haar
  g.arc(0, 0.1, 1.2, Math.PI * 1.15, Math.PI * 1.7).stroke({ width: 0.09, color: rim, alpha: 0.7, cap: 'round' });
}

/** Ersatzfigur: Silhouette mit Rand-Licht, Heiligenschein und leuchtenden Augen in einer Scheibe vom Radius `R` um 0/0 (Grund, Haar, Gesicht als drei Ebenen). */
export function buildSubstitute(id: string, look: ElementLook, R: number): Container {
  const out = new Container();
  const g = new Graphics();
  out.addChild(g);
  const r = rng(hash(id));
  const hair = Math.floor(r() * 5);
  const extra = Math.floor(r() * 4); // 0 nichts, 1 Heiligenschein, 2 Hoerner, 3 Stirnband
  const sil = silhouette(look);
  const rim = look.light;
  // Grund: dunkler Verlauf in Stufen, oben heller
  g.circle(0, 0, R).fill({ color: mix(0x04050c, look.dark, 0.55) });
  g.circle(0, -R * 0.1, R * 0.92).fill({ color: mix(look.dark, look.main, 0.35), alpha: 0.5 });
  g.circle(0, -R * 0.32, R * 0.62).fill({ color: look.main, alpha: 0.28 });
  g.circle(0, -R * 0.34, R * 0.38).fill({ color: look.light, alpha: 0.22 });
  // Funken
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.35 + r() * 0.5);
    const s = R * (0.03 + r() * 0.04);
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d * 0.9 - R * 0.1;
    g.poly([x, y - s * 2, x + s, y, x, y + s * 2, x - s, y]).fill({ color: rim, alpha: 0.35 + r() * 0.4 });
  }
  // Schultern und Hals
  g.moveTo(-R * 1.05, R * 1.05).bezierCurveTo(-R * 1.0, R * 0.42, -R * 0.55, R * 0.4, -R * 0.2, R * 0.34).lineTo(R * 0.2, R * 0.34).bezierCurveTo(R * 0.55, R * 0.4, R * 1.0, R * 0.42, R * 1.05, R * 1.05).closePath().fill({ color: sil });
  g.moveTo(-R * 0.86, R * 0.52).bezierCurveTo(-R * 0.6, R * 0.4, -R * 0.4, R * 0.4, -R * 0.2, R * 0.34).stroke({ width: R * 0.04, color: rim, alpha: 0.55, cap: 'round' });
  g.moveTo(R * 0.86, R * 0.52).bezierCurveTo(R * 0.6, R * 0.4, R * 0.4, R * 0.4, R * 0.2, R * 0.34).stroke({ width: R * 0.04, color: rim, alpha: 0.55, cap: 'round' });
  g.rect(-R * 0.1, R * 0.12, R * 0.2, R * 0.28).fill({ color: sil });
  // Kopf mit Haar (Haar im Kopf-Raum, Radius 1 = Kopfhaelfte)
  const hr = R * 0.3;
  const hx = 0;
  const hy = -R * 0.14;
  g.ellipse(hx, hy, hr * 0.92, hr * 1.12).fill({ color: sil });
  g.arc(hx, hy, hr * 1.05, Math.PI * 0.05, Math.PI * 0.55).stroke({ width: R * 0.035, color: rim, alpha: 0.4, cap: 'round' });
  const hairG = new Graphics();
  drawHair(hairG, hair, mix(sil, look.dark, 0.35), rim);
  hairG.scale.set(hr);
  hairG.position.set(hx, hy - hr * 0.05);
  out.addChild(hairG);
  // Zubehoer und Augen liegen ueber dem Haar
  const front = new Graphics();
  out.addChild(front);
  {
  const g = front;
  // Zubehoer
  if (extra === 1) g.ellipse(hx, hy - hr * 1.5, hr * 0.8, hr * 0.22).stroke({ width: R * 0.04, color: look.light, alpha: 0.85 });
  if (extra === 2) {
    g.poly([hx - hr * 0.8, hy - hr * 0.8, hx - hr * 1.3, hy - hr * 1.7, hx - hr * 0.35, hy - hr * 1.05]).fill({ color: look.light, alpha: 0.9 });
    g.poly([hx + hr * 0.8, hy - hr * 0.8, hx + hr * 1.3, hy - hr * 1.7, hx + hr * 0.35, hy - hr * 1.05]).fill({ color: look.light, alpha: 0.9 });
  }
  if (extra === 3) g.rect(hx - hr * 1.0, hy - hr * 0.55, hr * 2.0, hr * 0.26).fill({ color: look.main, alpha: 0.95 });
  // Augen: Leuchten + zwei Schlitze
  const ey = hy + hr * 0.12;
  g.circle(hx - hr * 0.42, ey, hr * 0.34).fill({ color: look.main, alpha: 0.35 });
  g.circle(hx + hr * 0.42, ey, hr * 0.34).fill({ color: look.main, alpha: 0.35 });
  g.roundRect(hx - hr * 0.68, ey - hr * 0.07, hr * 0.5, hr * 0.14, hr * 0.07).fill({ color: look.light });
  g.roundRect(hx + hr * 0.18, ey - hr * 0.07, hr * 0.5, hr * 0.14, hr * 0.07).fill({ color: look.light });
  }
  return out;
}

/** Gegner-Koerper (Blick nach rechts) fuer ein Schrittbild `frame` 0/1. Alles im Radius `R` um 0/0, Boden bei y = R. */
export function drawEnemy(g: Graphics, look: EnemyLook, R: number, frame: number): void {
  const step = frame === 0 ? 1 : -1;
  const body = look.body;
  const edge = look.edge;
  const acc = look.accent;
  const dark = mix(body, 0x000000, 0.45);
  const eye = (x: number, y: number, s: number): void => {
    g.circle(x, y, s * 1.7).fill({ color: acc, alpha: 0.28 });
    g.ellipse(x, y, s, s * 0.8).fill({ color: acc });
  };
  switch (look.shape) {
    case 'blob': {
      // Fuesse
      g.ellipse(-R * 0.4 + step * R * 0.08, R * 0.92, R * 0.28, R * 0.14).fill({ color: dark });
      g.ellipse(R * 0.4 - step * R * 0.08, R * 0.92, R * 0.28, R * 0.14).fill({ color: dark });
      g.moveTo(-R * 0.95, R * 0.85).bezierCurveTo(-R * 1.15, -R * 0.2, -R * 0.5, -R * 1.0, 0, -R * 1.0).bezierCurveTo(R * 0.5, -R * 1.0, R * 1.15, -R * 0.2, R * 0.95, R * 0.85).closePath().fill({ color: body }).stroke({ width: R * 0.12, color: dark });
      g.arc(0, -R * 0.1, R * 0.88, Math.PI * 1.1, Math.PI * 1.75).stroke({ width: R * 0.1, color: edge, alpha: 0.7, cap: 'round' });
      g.poly([-R * 0.55, -R * 0.75, -R * 0.4, -R * 1.2, -R * 0.15, -R * 0.9]).fill({ color: edge });
      g.poly([R * 0.55, -R * 0.75, R * 0.4, -R * 1.2, R * 0.15, -R * 0.9]).fill({ color: edge });
      eye(-R * 0.3, -R * 0.1, R * 0.17);
      eye(R * 0.34, -R * 0.1, R * 0.17);
      g.moveTo(-R * 0.5, -R * 0.4).lineTo(-R * 0.1, -R * 0.26).stroke({ width: R * 0.08, color: dark, cap: 'round' });
      g.moveTo(R * 0.55, -R * 0.4).lineTo(R * 0.15, -R * 0.26).stroke({ width: R * 0.08, color: dark, cap: 'round' });
      break;
    }
    case 'sprinter': {
      // Streifen hinten, schlanker Koerper nach vorn geneigt
      for (let i = 0; i < 3; i++) g.moveTo(-R * 1.1 - i * R * 0.1, -R * 0.4 + i * R * 0.4).lineTo(-R * 1.9 - i * R * 0.2 - step * R * 0.1, -R * 0.4 + i * R * 0.4).stroke({ width: R * 0.07, color: edge, alpha: 0.4 - i * 0.08, cap: 'round' });
      g.ellipse(-R * 0.25 + step * R * 0.28, R * 0.88, R * 0.24, R * 0.1).fill({ color: dark });
      g.ellipse(R * 0.25 - step * R * 0.28, R * 0.88, R * 0.24, R * 0.1).fill({ color: dark });
      g.moveTo(-R * 0.8, R * 0.8).bezierCurveTo(-R * 1.1, -R * 0.4, -R * 0.1, -R * 1.0, R * 0.7, -R * 0.55).bezierCurveTo(R * 1.15, -R * 0.2, R * 0.9, R * 0.6, R * 0.55, R * 0.8).closePath().fill({ color: body }).stroke({ width: R * 0.12, color: dark });
      g.arc(0, 0, R * 0.9, Math.PI * 1.15, Math.PI * 1.65).stroke({ width: R * 0.1, color: edge, alpha: 0.7, cap: 'round' });
      g.poly([-R * 0.2, -R * 0.85, R * 0.1, -R * 1.35, R * 0.3, -R * 0.7]).fill({ color: edge });
      eye(R * 0.42, -R * 0.2, R * 0.22);
      break;
    }
    case 'bulwark': {
      g.roundRect(-R * 0.75, R * 0.6, R * 0.55, R * 0.4, R * 0.1).fill({ color: dark });
      g.roundRect(R * 0.2, R * 0.6, R * 0.55, R * 0.4, R * 0.1).fill({ color: dark });
      g.roundRect(-R * 1.0 + step * R * 0.04, -R * 0.55, R * 2.0, R * 1.35, R * 0.28).fill({ color: body }).stroke({ width: R * 0.12, color: dark });
      g.roundRect(-R * 1.15, -R * 0.85, R * 0.75, R * 0.5, R * 0.18).fill({ color: edge }).stroke({ width: R * 0.08, color: dark });
      g.roundRect(R * 0.4, -R * 0.85, R * 0.75, R * 0.5, R * 0.18).fill({ color: edge }).stroke({ width: R * 0.08, color: dark });
      g.roundRect(-R * 0.45, -R * 1.0, R * 0.9, R * 0.7, R * 0.22).fill({ color: mix(body, edge, 0.25) }).stroke({ width: R * 0.1, color: dark });
      g.roundRect(-R * 0.34, -R * 0.78, R * 0.68, R * 0.18, R * 0.08).fill({ color: 0x120608 });
      eye(-R * 0.14, -R * 0.69, R * 0.08);
      eye(R * 0.18, -R * 0.69, R * 0.08);
      for (let i = 0; i < 3; i++) g.circle(-R * 0.55 + i * R * 0.55, R * 0.15, R * 0.07).fill({ color: edge });
      g.roundRect(-R * 0.3, R * 0.3, R * 0.6, R * 0.12, R * 0.05).fill({ color: acc, alpha: 0.9 });
      break;
    }
    case 'wing': {
      const up = frame === 0;
      const w1 = up ? -R * 1.2 : R * 0.15;
      const w2 = up ? -R * 0.5 : R * 0.7;
      for (const sx of [-1, 1]) {
        g.poly([sx * R * 0.2, -R * 0.1, sx * R * 1.55, w1, sx * R * 1.15, w1 * 0.4 + R * 0.1, sx * R * 1.35, w2, sx * R * 0.7, R * 0.25, sx * R * 0.2, R * 0.4]).fill({ color: mix(body, edge, 0.2), alpha: 0.95 }).stroke({ width: R * 0.08, color: dark });
        g.moveTo(sx * R * 0.25, 0).lineTo(sx * R * 1.4, w1).stroke({ width: R * 0.05, color: edge, alpha: 0.8 });
      }
      g.ellipse(0, R * 0.1, R * 0.62, R * 0.72).fill({ color: body }).stroke({ width: R * 0.1, color: dark });
      g.arc(0, R * 0.05, R * 0.55, Math.PI * 1.15, Math.PI * 1.7).stroke({ width: R * 0.08, color: edge, alpha: 0.8, cap: 'round' });
      g.poly([-R * 0.35, -R * 0.5, -R * 0.2, -R * 1.0, -R * 0.05, -R * 0.55]).fill({ color: dark });
      g.poly([R * 0.35, -R * 0.5, R * 0.2, -R * 1.0, R * 0.05, -R * 0.55]).fill({ color: dark });
      eye(-R * 0.2, -R * 0.1, R * 0.13);
      eye(R * 0.22, -R * 0.1, R * 0.13);
      break;
    }
    case 'splitter':
    case 'splitterChild': {
      const wob = step * R * 0.05;
      g.moveTo(-R * 1.0, R * 0.85).bezierCurveTo(-R * 1.25 - wob, -R * 0.3, -R * 0.6, -R * 1.0, 0, -R * 0.95).bezierCurveTo(R * 0.6, -R * 1.0, R * 1.25 + wob, -R * 0.3, R * 1.0, R * 0.85).closePath().fill({ color: body, alpha: 0.95 }).stroke({ width: R * 0.12, color: dark });
      g.arc(0, 0, R * 0.9, Math.PI * 1.1, Math.PI * 1.7).stroke({ width: R * 0.1, color: edge, alpha: 0.8, cap: 'round' });
      if (look.shape === 'splitter') {
        g.moveTo(-R * 0.05, -R * 0.95).lineTo(R * 0.12, -R * 0.3).lineTo(-R * 0.1, R * 0.2).lineTo(R * 0.06, R * 0.85).stroke({ width: R * 0.09, color: dark, join: 'round' });
        g.circle(-R * 0.45, -R * 0.1, R * 0.28).fill({ color: acc, alpha: 0.35 });
        g.circle(R * 0.45, R * 0.05, R * 0.28).fill({ color: acc, alpha: 0.35 });
        eye(-R * 0.45, -R * 0.1, R * 0.12);
        eye(R * 0.45, R * 0.05, R * 0.12);
      } else {
        eye(-R * 0.25, -R * 0.05, R * 0.2);
        eye(R * 0.3, -R * 0.05, R * 0.2);
      }
      break;
    }
    case 'champion': {
      // Umhang, Ruestung, gehoernter Helm
      g.moveTo(-R * 0.7, -R * 0.3).lineTo(-R * 1.15 - step * R * 0.05, R * 0.95).lineTo(R * 1.15 + step * R * 0.05, R * 0.95).lineTo(R * 0.7, -R * 0.3).closePath().fill({ color: mix(0x701020, 0x000000, 0.2) }).stroke({ width: R * 0.08, color: 0x2a0810 });
      g.roundRect(-R * 0.7, -R * 0.35, R * 1.4, R * 1.2, R * 0.22).fill({ color: body }).stroke({ width: R * 0.1, color: dark });
      g.roundRect(-R * 0.9, -R * 0.55, R * 0.55, R * 0.4, R * 0.15).fill({ color: edge });
      g.roundRect(R * 0.35, -R * 0.55, R * 0.55, R * 0.4, R * 0.15).fill({ color: edge });
      g.rect(-R * 0.06, -R * 0.3, R * 0.12, R * 1.0).fill({ color: edge, alpha: 0.9 });
      g.roundRect(-R * 0.45, -R * 1.05, R * 0.9, R * 0.78, R * 0.26).fill({ color: mix(body, edge, 0.35) }).stroke({ width: R * 0.09, color: dark });
      g.poly([-R * 0.4, -R * 0.95, -R * 0.85, -R * 1.45, -R * 0.15, -R * 1.1]).fill({ color: edge });
      g.poly([R * 0.4, -R * 0.95, R * 0.85, -R * 1.45, R * 0.15, -R * 1.1]).fill({ color: edge });
      g.roundRect(-R * 0.33, -R * 0.82, R * 0.66, R * 0.15, R * 0.06).fill({ color: 0x180606 });
      eye(-R * 0.14, -R * 0.745, R * 0.07);
      eye(R * 0.16, -R * 0.745, R * 0.07);
      g.circle(0, R * 0.2, R * 0.14).fill({ color: acc });
      break;
    }
    default: {
      // Boss: Hoernerkrone, breiter Koerper, Kernleuchten in der Brust
      g.circle(0, R * 0.05, R * 1.25).fill({ color: look.accent, alpha: 0.08 });
      g.ellipse(-R * 0.55, R * 0.95, R * 0.4, R * 0.17).fill({ color: dark });
      g.ellipse(R * 0.55, R * 0.95, R * 0.4, R * 0.17).fill({ color: dark });
      g.moveTo(-R * 1.1, R * 0.9).bezierCurveTo(-R * 1.3, -R * 0.4, -R * 0.7, -R * 0.8, 0, -R * 0.8).bezierCurveTo(R * 0.7, -R * 0.8, R * 1.3, -R * 0.4, R * 1.1, R * 0.9).closePath().fill({ color: body }).stroke({ width: R * 0.07, color: dark });
      g.arc(0, 0, R * 1.0, Math.PI * 1.1, Math.PI * 1.75).stroke({ width: R * 0.06, color: edge, alpha: 0.8, cap: 'round' });
      // Schulterplatten
      g.poly([-R * 1.3, -R * 0.1, -R * 0.75, -R * 0.55, -R * 0.55, -R * 0.1, -R * 1.0, R * 0.12]).fill({ color: edge }).stroke({ width: R * 0.04, color: dark });
      g.poly([R * 1.3, -R * 0.1, R * 0.75, -R * 0.55, R * 0.55, -R * 0.1, R * 1.0, R * 0.12]).fill({ color: edge }).stroke({ width: R * 0.04, color: dark });
      // Kern
      g.circle(0, R * 0.28, R * 0.34, ).fill({ color: acc, alpha: 0.25 });
      g.circle(0, R * 0.28, R * 0.2).fill({ color: acc });
      g.circle(0, R * 0.28, R * 0.1).fill({ color: 0xffffff });
      // Kopf mit Hoernern
      g.roundRect(-R * 0.45, -R * 1.05, R * 0.9, R * 0.62, R * 0.2).fill({ color: mix(body, edge, 0.2) }).stroke({ width: R * 0.05, color: dark });
      g.poly([-R * 0.35, -R * 0.95, -R * 0.95, -R * 1.5, -R * 0.85, -R * 0.8]).fill({ color: acc }).stroke({ width: R * 0.03, color: dark });
      g.poly([R * 0.35, -R * 0.95, R * 0.95, -R * 1.5, R * 0.85, -R * 0.8]).fill({ color: acc }).stroke({ width: R * 0.03, color: dark });
      g.poly([-R * 0.12, -R * 1.02, 0, -R * 1.3, R * 0.12, -R * 1.02]).fill({ color: acc });
      eye(-R * 0.2, -R * 0.72, R * 0.09);
      eye(R * 0.22, -R * 0.72, R * 0.09);
    }
  }
}

type Cached = Texture;

/** Eine Figuren-Fabrik je Renderer: backt Texturen bei Bedarf und merkt sie sich. */
export class Figures {
  private renderer: Renderer | null = null;
  private cache = new Map<string, Cached>();
  /** Texturen ohne Kachelbezug (Splitter), ueberleben `clear()`. */
  private keep = new Map<string, Texture>();
  private portrait = new Map<string, Texture | 'pending' | 'none'>();
  /** Zaehlt hoch, wenn ein Portraet nachgeladen wurde: Ansichten mit altem Stand holen sich die neue Textur. */
  rev = 0;

  init(renderer: Renderer): void {
    this.renderer = renderer;
  }

  /** Alle gebackenen Texturen verwerfen (Kachelgroesse hat sich geaendert). Portraets bleiben. */
  clear(): void {
    for (const t of this.cache.values()) t.destroy(true);
    this.cache.clear();
  }

  private bake(target: Container, half: number, res = 2): Texture {
    const r = this.renderer;
    if (!r) return Texture.EMPTY;
    const t = r.generateTexture({ target, resolution: res, antialias: true, frame: new Rectangle(-half, -half, half * 2, half * 2) });
    target.destroy({ children: true });
    return t;
  }

  /** Portraet anstossen (einmal je ID). `true`, wenn schon eines da ist. */
  private wantPortrait(id: string): boolean {
    const have = this.portrait.get(id);
    if (have && have !== 'pending' && have !== 'none') return true;
    if (have) return false;
    if (portraitKnown(id) === false) {
      this.portrait.set(id, 'none');
      return false;
    }
    this.portrait.set(id, 'pending');
    void hasPortrait(id).then(async (ok) => {
      if (!ok) {
        this.portrait.set(id, 'none');
        return;
      }
      try {
        const tex = (await Assets.load(portraitUrl(id))) as Texture;
        this.portrait.set(id, tex);
        // Alte Figur dieser ID verwerfen, die naechste Abfrage backt mit Bild
        for (const k of [...this.cache.keys()]) {
          if (k.startsWith(`u|${id}|`)) {
            this.cache.get(k)?.destroy(true);
            this.cache.delete(k);
          }
        }
        this.rev++;
      } catch {
        this.portrait.set(id, 'none');
      }
    });
    return false;
  }

  /** Test-/Skript-Zugriff: Portraet von aussen setzen (Screenshots mit Stand-in-Bildern). */
  hasLoadedPortrait(id: string): boolean {
    const p = this.portrait.get(id);
    return !!p && p !== 'pending' && p !== 'none';
  }

  /** Figur einer Unit: Scheibe mit Bild (oder Ersatzfigur) und Seltenheits-Ring, Groesse `2 * (R + Rand)`. */
  unit(def: { id: string; rarity: string; elements: string[]; damageType: string; footprint: 1 | 2 }, tile: number): { tex: Texture; half: number } {
    const R = unitRadius(tile, def.footprint);
    const half = Math.ceil(R * 1.3);
    this.wantPortrait(def.id);
    const p = this.portrait.get(def.id);
    const withImg = !!p && p !== 'pending' && p !== 'none';
    const key = `u|${def.id}|${Math.round(tile)}|${withImg ? 'img' : 'sub'}`;
    let tex = this.cache.get(key);
    if (!tex) {
      const look = unitLook(def);
      const rl = rarityLook(def.rarity);
      const c = new Container();
      // Leuchten
      const glow = new Graphics();
      glow.circle(0, 0, R * 1.2).fill({ color: rl.glow, alpha: 0.12 });
      glow.circle(0, 0, R * 1.11).fill({ color: rl.glow, alpha: 0.2 });
      c.addChild(glow);
      const disc = new Container();
      const art = new Graphics();
      if (withImg) {
        art.circle(0, 0, R).fill({ color: mix(0x04050c, look.dark, 0.6) });
        art.circle(0, -R * 0.2, R * 0.85).fill({ color: look.main, alpha: 0.25 });
        disc.addChild(art);
        const spr = new Sprite(p as Texture);
        const sc = (R * 2.15) / Math.max(spr.texture.width, 1);
        spr.scale.set(sc);
        spr.anchor.set(0.5, 0);
        spr.position.set(0, -R * 1.0);
        disc.addChild(spr);
      } else {
        disc.addChild(buildSubstitute(def.id, look, R));
      }
      const mask = new Graphics();
      mask.circle(0, 0, R).fill({ color: 0xffffff });
      disc.addChild(mask);
      disc.mask = mask;
      c.addChild(disc);
      // Innen-Schatten (Tiefe)
      const rim = new Graphics();
      rim.circle(0, 0, R).stroke({ width: R * 0.22, color: 0x000000, alpha: 0.28 });
      c.addChild(rim);
      // Ring: aussen hell, innen satt, dazwischen eine feine dunkle Linie
      const ring = new Graphics();
      const w = Math.max(2, rl.width * tile * 1.25);
      ring.circle(0, 0, R + w * 0.15).stroke({ width: w, color: rl.a });
      ring.circle(0, 0, R - w * 0.38).stroke({ width: w * 0.5, color: rl.b });
      ring.circle(0, 0, R - w * 0.12).stroke({ width: Math.max(1, w * 0.1), color: 0x05060f, alpha: 0.7 });
      c.addChild(ring);
      for (let i = 0; i < rl.studs; i++) {
        const a = (i / rl.studs) * Math.PI * 2 - Math.PI / 2;
        const sx = Math.cos(a) * (R + w * 0.5);
        const sy = Math.sin(a) * (R + w * 0.5);
        const s = w * 0.55;
        ring.poly([sx, sy - s, sx + s * 0.7, sy, sx, sy + s, sx - s * 0.7, sy]).fill({ color: rl.a });
      }
      tex = this.bake(c, half);
      this.cache.set(key, tex);
    }
    return { tex, half };
  }

  /** Weicher Boden-Schatten (Ellipse). */
  shadow(tile: number): Texture {
    const key = `s|${Math.round(tile)}`;
    let tex = this.cache.get(key);
    if (!tex) {
      const c = new Container();
      const g = new Graphics();
      const rx = tile * 0.42;
      const ry = tile * 0.16;
      for (let i = 0; i < 4; i++) g.ellipse(0, 0, rx * (1 - i * 0.18), ry * (1 - i * 0.18)).fill({ color: 0x000000, alpha: 0.12 });
      c.addChild(g);
      tex = this.bake(c, Math.ceil(rx), 1);
      this.cache.set(key, tex);
    }
    return tex;
  }

  /** Element-Abzeichen: dunkle Scheibe, Ring und Symbol in der Elementfarbe. */
  badge(key: LookKey, tile: number): Texture {
    const k = `b|${key}|${Math.round(tile)}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const look = lookOf(key);
      const R = Math.max(7, tile * 0.15);
      const c = new Container();
      const g = new Graphics();
      g.circle(0, 0, R).fill({ color: mix(0x05060f, look.dark, 0.5) }).stroke({ width: Math.max(1.5, R * 0.16), color: look.main });
      g.circle(0, 0, R * 0.82).stroke({ width: 1, color: look.light, alpha: 0.35 });
      c.addChild(g);
      const gl = new Graphics();
      drawGlyph(gl, key, R * 1.25, look.light);
      c.addChild(gl);
      tex = this.bake(c, Math.ceil(R * 1.15));
      this.cache.set(k, tex);
    }
    return tex;
  }

  /** Dreher auf dem Ring (Glanz) fuer Mythic und hoeher: drei helle Boegen. */
  shine(rarity: string, tile: number, footprint: 1 | 2): Texture {
    const R = unitRadius(tile, footprint);
    const k = `r|${rarity}|${Math.round(tile)}|${footprint}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const rl = rarityLook(rarity);
      const c = new Container();
      const g = new Graphics();
      const w = Math.max(2, rl.width * tile * 1.25);
      for (let i = 0; i < 3; i++) {
        const a0 = (i / 3) * Math.PI * 2;
        g.arc(0, 0, R + w * 0.15, a0, a0 + 0.55).stroke({ width: w * 1.05, color: 0xffffff, alpha: 0.85, cap: 'round' });
      }
      c.addChild(g);
      tex = this.bake(c, Math.ceil(R * 1.3));
      this.cache.set(k, tex);
    }
    return tex;
  }

  /** Blickrichtungs-Keil am Ring (zeigt nach rechts, wird gedreht). */
  wedge(tile: number, footprint: 1 | 2): Texture {
    const R = unitRadius(tile, footprint);
    const k = `w|${Math.round(tile)}|${footprint}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const c = new Container();
      const g = new Graphics();
      const s = Math.max(4, tile * 0.1);
      g.poly([R + s * 1.5, 0, R - s * 0.1, -s * 0.9, R - s * 0.1, s * 0.9]).fill({ color: 0xffffff }).stroke({ width: 1.2, color: 0x05060f, alpha: 0.8 });
      c.addChild(g);
      tex = this.bake(c, Math.ceil(R + s * 2));
      this.cache.set(k, tex);
    }
    return tex;
  }

  /** Gegner-Koerper je Typ und Schrittbild. Gibt auch die Halbgroesse (fuer Balken-Hoehe) zurueck. */
  enemy(type: string, tile: number, frame: number): { tex: Texture; half: number; R: number } {
    const look = enemyLook(type);
    const R = look.radius * tile;
    const half = Math.ceil(R * 1.75);
    const k = `e|${type}|${Math.round(tile)}|${frame}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const c = new Container();
      const g = new Graphics();
      drawEnemy(g, look, R, frame);
      c.addChild(g);
      tex = this.bake(c, half);
      this.cache.set(k, tex);
    }
    return { tex, half, R };
  }

  /** Weisse Silhouette eines Gegners fuer den Treffer-Blitz (additiv gezeichnet). */
  enemyFlash(type: string, tile: number): Texture {
    const k = `f|${type}|${Math.round(tile)}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const look = enemyLook(type);
      const R = look.radius * tile;
      const c = new Container();
      const g = new Graphics();
      drawEnemy(g, look, R, 0);
      c.addChild(g);
      c.tint = 0xffffff;
      tex = this.bake(c, Math.ceil(R * 1.75));
      this.cache.set(k, tex);
    }
    return tex;
  }

  /** Weisse Splitter-Form (16 px, wird getoent und skaliert). Unabhaengig von der Kachelgroesse, bleibt bei `clear()` erhalten. */
  particle(kind: ParticleKind): Texture {
    const k = `p|${kind}`;
    let tex = this.keep.get(k);
    if (!tex) {
      const c = new Container();
      const g = new Graphics();
      const s = 8;
      const W = 0xffffff;
      switch (kind) {
        case 'ember':
        case 'wisp':
          g.circle(0, 0, s).fill({ color: W, alpha: 0.25 });
          g.circle(0, 0, s * 0.6).fill({ color: W, alpha: 0.6 });
          g.circle(0, 0, s * 0.32).fill({ color: W });
          break;
        case 'drop':
          g.moveTo(0, -s).bezierCurveTo(s * 0.2, -s * 0.4, s * 0.65, 0, s * 0.6, s * 0.35).bezierCurveTo(s * 0.5, s * 0.9, -s * 0.5, s * 0.9, -s * 0.6, s * 0.35).bezierCurveTo(-s * 0.65, 0, -s * 0.2, -s * 0.4, 0, -s).fill({ color: W });
          break;
        case 'spark':
        case 'ray':
          g.roundRect(-s, -s * 0.18, s * 2, s * 0.36, s * 0.18).fill({ color: W });
          break;
        case 'shard':
          g.poly([0, -s, s * 0.4, 0, 0, s, -s * 0.4, 0]).fill({ color: W });
          break;
        case 'star':
        case 'rune':
          g.poly([0, -s, s * 0.22, -s * 0.22, s, 0, s * 0.22, s * 0.22, 0, s, -s * 0.22, s * 0.22, -s, 0, -s * 0.22, -s * 0.22]).fill({ color: W });
          break;
        case 'petal':
          g.ellipse(0, 0, s * 0.5, s * 0.9).fill({ color: W });
          break;
        case 'coin':
          g.circle(0, 0, s * 0.8).fill({ color: W });
          g.circle(0, 0, s * 0.5).stroke({ width: s * 0.16, color: 0x000000, alpha: 0.25 });
          break;
        default:
          g.rect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1).fill({ color: W });
      }
      c.addChild(g);
      tex = this.bake(c, s + 1, 2);
      this.keep.set(k, tex);
    }
    return tex;
  }

  /** Rotierender Runenring unter Elite und Boss (Aura). */
  aura(tile: number, radiusTiles: number, color: number): Texture {
    const k = `a|${Math.round(tile)}|${radiusTiles}|${color}`;
    let tex = this.cache.get(k);
    if (!tex) {
      const R = radiusTiles * tile;
      const c = new Container();
      const g = new Graphics();
      g.circle(0, 0, R).stroke({ width: Math.max(2, R * 0.04), color, alpha: 0.75 });
      g.circle(0, 0, R * 0.82).stroke({ width: Math.max(1, R * 0.02), color, alpha: 0.5 });
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const len = i % 3 === 0 ? 0.16 : 0.08;
        g.moveTo(Math.cos(a) * R * (1 - len), Math.sin(a) * R * (1 - len)).lineTo(Math.cos(a) * R, Math.sin(a) * R).stroke({ width: Math.max(1.5, R * 0.03), color, alpha: 0.8 });
      }
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        g.poly([Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, Math.cos(a + 0.2) * R * 0.72, Math.sin(a + 0.2) * R * 0.72, Math.cos(a - 0.2) * R * 0.72, Math.sin(a - 0.2) * R * 0.72]).fill({ color, alpha: 0.5 });
      }
      c.addChild(g);
      tex = this.bake(c, Math.ceil(R * 1.1), 1);
      this.cache.set(k, tex);
    }
    return tex;
  }
}
