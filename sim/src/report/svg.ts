/** Minimale SVG-Liniendiagramme (ohne Bibliothek). Farben als CSS-Werte, feste Größe, Beschriftung der Achsen. */
export interface Series {
  label: string;
  color: string;
  /** y-Werte je Wave (x = Index + xStart); NaN/undefined wird übersprungen. */
  values: number[];
  dashed?: boolean;
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v: number): string => (Math.round(v * 100) / 100).toString();

export function lineChart(title: string, xLabel: string, yLabel: string, series: Series[], xStart = 1, yMax?: number): string {
  const W = 640;
  const H = 320;
  const m = { l: 56, r: 16, t: 34, b: 44 };
  const len = Math.max(1, ...series.map((s) => s.values.length));
  const top = yMax ?? Math.max(1e-9, ...series.flatMap((s) => s.values.filter((v) => Number.isFinite(v))));
  const x = (i: number): number => m.l + (len <= 1 ? 0 : (i * (W - m.l - m.r)) / (len - 1));
  const y = (v: number): number => H - m.b - (Math.min(v, top) / top) * (H - m.t - m.b);
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="sans-serif" font-size="11">`);
  out.push(`<rect width="${W}" height="${H}" fill="#fff"/>`);
  out.push(`<text x="${W / 2}" y="18" text-anchor="middle" font-size="13" font-weight="bold">${esc(title)}</text>`);
  for (let k = 0; k <= 4; k++) {
    const v = (top * k) / 4;
    out.push(`<line x1="${m.l}" y1="${num(y(v))}" x2="${W - m.r}" y2="${num(y(v))}" stroke="#ddd"/>`);
    out.push(`<text x="${m.l - 6}" y="${num(y(v) + 4)}" text-anchor="end">${num(v)}</text>`);
  }
  const step = Math.max(1, Math.ceil(len / 10));
  for (let i = 0; i < len; i += step) {
    out.push(`<text x="${num(x(i))}" y="${H - m.b + 16}" text-anchor="middle">${i + xStart}</text>`);
  }
  out.push(`<line x1="${m.l}" y1="${H - m.b}" x2="${W - m.r}" y2="${H - m.b}" stroke="#333"/>`);
  out.push(`<line x1="${m.l}" y1="${m.t}" x2="${m.l}" y2="${H - m.b}" stroke="#333"/>`);
  out.push(`<text x="${W / 2}" y="${H - 6}" text-anchor="middle">${esc(xLabel)}</text>`);
  out.push(`<text x="12" y="${H / 2}" text-anchor="middle" transform="rotate(-90 12 ${H / 2})">${esc(yLabel)}</text>`);
  series.forEach((s, si) => {
    let d = '';
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      d += `${d === '' ? 'M' : 'L'}${num(x(i))} ${num(y(v))} `;
    });
    if (d) out.push(`<path d="${d.trim()}" fill="none" stroke="${s.color}" stroke-width="2"${s.dashed ? ' stroke-dasharray="5 4"' : ''}/>`);
    const lx = m.l + 8 + si * 130;
    out.push(`<line x1="${lx}" y1="${m.t - 6}" x2="${lx + 16}" y2="${m.t - 6}" stroke="${s.color}" stroke-width="2"${s.dashed ? ' stroke-dasharray="5 4"' : ''}/>`);
    out.push(`<text x="${lx + 20}" y="${m.t - 2}">${esc(s.label)}</text>`);
  });
  out.push('</svg>');
  return out.join('\n') + '\n';
}
