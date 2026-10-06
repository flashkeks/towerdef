/** Winziger Markdown-Renderer fuer die Credits (Ueberschriften, Absaetze, Listen, Tabellen, **fett**, `code`). Nur textContent, nie innerHTML. Besitzer: P6. */
import { h } from './dom';

export type Block =
  | { kind: 'h'; level: number; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] };

const cells = (line: string): string[] => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r/g, '').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const head = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!line.trim()) i++;
    else if (head) {
      out.push({ kind: 'h', level: head[1].length, text: head[2] });
      i++;
    } else if (line.trim().startsWith('|') && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1] ?? '')) {
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith('|')) rows.push(cells(lines[j++]));
      out.push({ kind: 'table', head: cells(line), rows });
      i = j;
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push({ kind: 'ul', items });
    } else {
      const text: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*[-*]\s|\s*\|)/.test(lines[i])) text.push(lines[i++].trim());
      if (text.length === 0) i++;
      else out.push({ kind: 'p', text: text.join(' ') });
    }
  }
  return out;
}

/** Inline: `code` und **fett** in Knoten umsetzen. */
export function inline(text: string): (Node | string)[] {
  const out: (Node | string)[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    out.push(tok.startsWith('`') ? h('code', undefined, tok.slice(1, -1)) : h('strong', undefined, tok.slice(2, -2)));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(md: string): HTMLElement {
  const root = h('div', 'md');
  for (const b of parseMarkdown(md)) {
    if (b.kind === 'h') root.append(h(`h${Math.min(b.level + 1, 6)}` as 'h2', undefined, b.text));
    else if (b.kind === 'p') {
      const p = h('p');
      p.append(...inline(b.text));
      root.append(p);
    } else if (b.kind === 'ul') {
      const ul = h('ul');
      for (const it of b.items) {
        const li = h('li');
        li.append(...inline(it));
        ul.append(li);
      }
      root.append(ul);
    } else {
      const table = h('table');
      const tr = h('tr');
      for (const c of b.head) {
        const th = h('th');
        th.append(...inline(c));
        tr.append(th);
      }
      const thead = h('thead');
      thead.append(tr);
      table.append(thead);
      const body = h('tbody');
      for (const r of b.rows) {
        const row = h('tr');
        for (const c of r) {
          const td = h('td');
          td.append(...inline(c));
          row.append(td);
        }
        body.append(row);
      }
      table.append(body);
      root.append(table);
    }
  }
  return root;
}
