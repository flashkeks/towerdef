/** Kleine SVG-Vorschau der Angriffsform (Kreis, Kegel, Linie, ganze Reichweite, Einzelziel) aus `collection-model.attackShape`. Rein dekorativ, Zahlen im Text daneben. */
import { shapeGeometry, type ShapeModel } from './collection-model';

const NS = 'http://www.w3.org/2000/svg';

export function attackPreview(m: ShapeModel, size = 132): SVGElement {
  const g = shapeGeometry(m, size);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', `attack-preview ap-${m.kind}`);
  svg.setAttribute('role', 'img');
  const f = (n: number): string => n.toFixed(1);
  let shape = '';
  switch (m.kind) {
    case 'circle':
      shape = `<circle class="ap-fill" cx="${f(g.tx)}" cy="${f(g.ty)}" r="${f(g.sizePx)}"/>`;
      break;
    case 'cone': {
      const half = (m.deg / 2) * (Math.PI / 180);
      const x1 = g.cx + Math.cos(-half) * g.rangePx;
      const y1 = g.cy + Math.sin(-half) * g.rangePx;
      const x2 = g.cx + Math.cos(half) * g.rangePx;
      const y2 = g.cy + Math.sin(half) * g.rangePx;
      shape = `<path class="ap-fill" d="M${f(g.cx)} ${f(g.cy)}L${f(x1)} ${f(y1)}A${f(g.rangePx)} ${f(g.rangePx)} 0 0 1 ${f(x2)} ${f(y2)}z"/>`;
      break;
    }
    case 'line':
      shape = `<rect class="ap-fill" x="${f(g.cx)}" y="${f(g.cy - Math.max(g.sizePx, 4) / 2)}" width="${f(g.rangePx)}" height="${f(Math.max(g.sizePx, 4))}" rx="2"/>`;
      break;
    case 'full':
      shape = `<circle class="ap-fill" cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.rangePx)}"/>`;
      break;
    default:
      shape = `<g class="ap-reticle"><circle cx="${f(g.tx)}" cy="${f(g.ty)}" r="7"/><path d="M${f(g.tx - 11)} ${f(g.ty)}h6M${f(g.tx + 5)} ${f(g.ty)}h6M${f(g.tx)} ${f(g.ty - 11)}v6M${f(g.tx)} ${f(g.ty + 5)}v6"/></g>`;
  }
  svg.innerHTML = `<circle class="ap-range" cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(g.rangePx)}"/>${shape}
    <circle class="ap-foe" cx="${f(g.tx)}" cy="${f(g.ty)}" r="3"/><circle class="ap-unit" cx="${f(g.cx)}" cy="${f(g.cy)}" r="5"/>`;
  return svg;
}
