/** Wissensbaum: drei Aeste als Pixel-Knoten mit Linien, Punkte oben, Klick kauft, Tooltip erklaert. */
import {
  BRANCH_NAMES, KNOWLEDGE, buyNode, knowledgePoints, nodeById, nodeState, resetKnowledge, type Branch, type KnowledgeNode,
} from '../meta';
import { h } from '../ui/dom';
import { icon, type IconName } from './icons';
import { cv, makeTip, ptext } from './px';
import { S } from './text';
import type { Ctx, View } from './types';

const ICONS: Record<string, IconName> = {
  'head-start': 'coin', 'better-deals': 'tag', 'lantern-tax': 'lantern',
  'sharp-eyes': 'eye', 'bigger-barrels': 'bomb', 'cold-snap': 'snow', 'cheaper-basics': 'discount',
  'extra-lives': 'heart', 'veteran-hero': 'star', 'fast-learner': 'book',
};
const CELL_W = 150;
const CELL_H = 158;
const NODE = 96;

let lastBought: string | null = null;

export function topBar(ctx: Ctx, title: string, right?: HTMLElement): HTMLElement {
  const bar = h('header', 'subtop');
  const back = h('button', 'btn-small', `< ${S.back}`);
  back.onclick = () => { ctx.sound('click'); ctx.go({ name: 'home' }); };
  bar.append(back, ptext(title, 5, 'amber', 'ink', 'sub-title'), right ?? h('span'));
  return bar;
}

export function knowledgeView(ctx: Ctx): View {
  const p = ctx.store.profile;
  const kp = knowledgePoints(p);
  const el = h('div', 'scr knowledge');
  const tip = makeTip(el);

  const right = h('div', 'kp-box');
  const chip = h('div', `chip ${kp.free > 0 ? 'good' : ''}`);
  chip.append(cv(icon('star'), 2), h('span', 'num', `${S.knowledge.points}: ${kp.free}`), h('span', 'muted num', ` / ${kp.total}`));
  const reset = h('button', 'btn-small', S.knowledge.reset);
  reset.disabled = p.knowledge.length === 0;
  reset.title = S.knowledge.resetHint;
  reset.onclick = () => { ctx.sound('click'); lastBought = null; void ctx.update(resetKnowledge(ctx.store.profile)).then(() => ctx.go({ name: 'knowledge' })); };
  right.append(chip, reset);
  el.append(topBar(ctx, S.knowledge.title, right));

  const tree = h('div', 'ktree');
  for (const branch of ['economy', 'towers', 'wardens'] as Branch[]) {
    const nodes = KNOWLEDGE.filter((n) => n.branch === branch);
    const cols = Math.max(...nodes.map((n) => n.col)) + 1;
    const rows = Math.max(...nodes.map((n) => n.row)) + 1;
    const panel = h('section', `kbranch ${branch}`);
    panel.append(h('div', 'kbranch-t', BRANCH_NAMES[branch]));
    const field = h('div', 'kfield');
    field.style.width = `${cols * CELL_W}px`;
    field.style.height = `${rows * CELL_H}px`;

    // Linien (SVG, harte Kanten)
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'klines');
    svg.setAttribute('width', String(cols * CELL_W));
    svg.setAttribute('height', String(rows * CELL_H));
    const cx = (n: KnowledgeNode): number => n.col * CELL_W + CELL_W / 2;
    const top = (n: KnowledgeNode): number => n.row * CELL_H + 8;
    for (const n of nodes) {
      for (const rid of n.requires) {
        const q = nodeById(rid);
        if (!q) continue;
        const y1 = top(q) + NODE;
        const y2 = top(n);
        const ym = Math.round((y1 + y2) / 2);
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${cx(q)} ${y1} V${ym} H${cx(n)} V${y2}`);
        path.setAttribute('class', `kline ${p.knowledge.includes(rid) ? 'on' : ''}`);
        svg.append(path);
      }
    }
    field.append(svg);

    for (const n of nodes) {
      const st = nodeState(p, n.id);
      const b = h('button', `knode ${st} ${lastBought === n.id ? 'bought-now' : ''}`);
      b.style.left = `${cx(n) - NODE / 2}px`;
      b.style.top = `${top(n)}px`;
      b.style.width = `${NODE}px`;
      b.append(cv(icon(ICONS[n.id]), 3, 'knode-ic'), h('div', 'knode-n', n.name));
      const foot = h('div', 'knode-f');
      if (st === 'bought') foot.append(cv(icon('check'), 2));
      else if (st === 'locked') foot.append(cv(icon('lock'), 2));
      else foot.append(cv(icon('star'), 2), h('span', 'num', String(n.cost)));
      b.append(foot);
      tip.attach(b, () => {
        const box = h('div', 'tip-box');
        box.append(h('div', 'tip-t', n.name), h('div', 'tip-d', n.desc));
        box.append(h('div', 'tip-c', st === 'bought' ? S.knowledge.learned : S.knowledge.cost(n.cost)));
        if (st === 'locked') {
          const names = n.requires.map((r) => nodeById(r)?.name ?? r);
          box.append(h('div', 'tip-w', names.length > 1 ? S.knowledge.needsOne(names.join(', ')) : S.knowledge.needs(names[0])));
        } else if (st === 'unaffordable') box.append(h('div', 'tip-w', S.knowledge.noPoints));
        return box;
      });
      b.onclick = () => {
        const res = buyNode(ctx.store.profile, n.id);
        if (!res.ok) { ctx.sound('error'); return; }
        ctx.sound('buy');
        lastBought = n.id;
        void ctx.update(res.profile).then(() => ctx.go({ name: 'knowledge' }));
      };
      field.append(b);
    }
    panel.append(field);
    tree.append(panel);
  }
  el.append(tree, h('div', 'foot-hint', S.knowledge.tip));
  setTimeout(() => { lastBought = null; }, 0);
  return { el };
}
