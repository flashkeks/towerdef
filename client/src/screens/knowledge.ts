/** Wissensbaum: drei Aeste als Pixel-Knoten mit Linien, Punkte oben, Klick kauft, Tooltip erklaert. */
import {
  BRANCHES, BRANCH_NAMES, KNOWLEDGE, buyNode, knowledgePoints, nodeById, nodeState, resetKnowledge, type Branch,
} from '../meta';
import { h } from '../ui/dom';
import { DEFAULT_OPTS, layoutTree } from './knowledge-layout';
import { icon, type IconName } from './icons';
import { cv, makeTip, ptext } from './px';
import { S } from './text';
import type { Ctx, View } from './types';

export const NODE_ICONS: Record<string, IconName> = {
  'head-start': 'coin', 'better-deals': 'tag', 'lantern-tax': 'lantern', 'big-head-start': 'coin', 'market-savvy': 'tag', 'compound-interest': 'discount',
  'sharp-eyes': 'eye', 'bigger-barrels': 'bomb', 'cold-snap': 'snow', 'cheaper-basics': 'discount', 'quick-hands': 'bolt', 'deep-freeze': 'snow', 'veteran-primaries': 'star',
  'steady-aim': 'eye', 'supply-lines': 'flag', 'wide-aura': 'lantern', 'bulk-orders': 'tag',
  'extra-lives': 'heart', 'veteran-hero': 'star', 'fast-learner': 'book', 'thick-walls': 'heart', 'hero-training': 'arrow', 'legendary': 'star', 'scholar': 'book',
  'ember-pouch': 'flame', 'bulk-buyer': 'discount', 'spare-pocket': 'gear', 'starter-kit': 'coin',
  // Runde 14
  'investor': 'coin', 'pop-bonus': 'star', 'sharper-arrows': 'arrow', 'fused-shells': 'bomb', 'icicle-edge': 'snow',
  'deep-roots': 'leaf', 'bountiful-grove': 'leaf', 'potent-brews': 'flask', 'midas-hands': 'coin', 'field-medic': 'cross',
  'sturdy-gate': 'shield', 'ember-rush': 'flame',
};
const OPTS = DEFAULT_OPTS;

let lastBought: string | null = null;
/** Scrollstand vor dem Neuaufbau (Kauf laedt den Bildschirm neu): sonst springt der hohe Baum nach oben. */
let keepScroll: number | null = null;
const scroller = (el: HTMLElement): HTMLElement | null => el.closest('.dw-screens');

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
  reset.onclick = () => { ctx.sound('click'); lastBought = null; keepScroll = scroller(el)?.scrollTop ?? null; void ctx.update(resetKnowledge(ctx.store.profile)).then(() => ctx.go({ name: 'knowledge' })); };
  right.append(chip, reset);
  el.append(topBar(ctx, S.knowledge.title, right));

  const tree = h('div', 'ktree');
  const layout = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], OPTS);
  const rowEls: HTMLElement[] = Array.from({ length: layout.rows }, () => h('div', 'krow'));
  for (const r of rowEls) tree.append(r);
  const NS = 'http://www.w3.org/2000/svg';
  for (const pb of layout.branches) {
    const branch = pb.branch as Branch;
    const panel = h('section', `kbranch ${branch}`);
    panel.style.width = `${pb.w}px`;
    const bought = KNOWLEDGE.filter((n) => n.branch === branch && p.knowledge.includes(n.id)).length;
    const total = KNOWLEDGE.filter((n) => n.branch === branch).length;
    const title = h('div', 'kbranch-t', BRANCH_NAMES[branch]);
    title.append(h('span', 'kbranch-c num', `${bought}/${total}`));
    panel.append(title);
    const field = h('div', 'kfield');
    field.style.width = `${pb.fieldW}px`;
    field.style.height = `${pb.fieldH}px`;

    // Linien (SVG, harte Kanten): Voraussetzung -> Knoten, in Astfarbe sobald die Voraussetzung gelernt ist
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'klines');
    svg.setAttribute('width', String(pb.fieldW));
    svg.setAttribute('height', String(pb.fieldH));
    for (const l of pb.lines) {
      const ym = Math.round((l.y1 + l.y2) / 2);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${l.x1} ${l.y1} V${ym} H${l.x2} V${l.y2}`);
      path.setAttribute('class', `kline ${p.knowledge.includes(l.from) ? 'on' : ''}`);
      svg.append(path);
    }
    field.append(svg);

    for (const pn of pb.nodes) {
      const n = nodeById(pn.id)!;
      const st = nodeState(p, n.id);
      const b = h('button', `knode ${st} ${lastBought === n.id ? 'bought-now' : ''}`);
      b.dataset.node = n.id;
      b.style.left = `${pn.x}px`;
      b.style.top = `${pn.y}px`;
      b.style.width = `${OPTS.nodeW}px`;
      b.style.height = `${OPTS.nodeH}px`;
      b.append(cv(icon(NODE_ICONS[n.id] ?? 'star'), 2, 'knode-ic'), h('div', 'knode-n', n.name));
      const foot = h('div', 'knode-f');
      if (st === 'bought') foot.append(cv(icon('check'), 2), h('span', 'knode-ok', S.knowledge.learned));
      else if (st === 'locked') foot.append(cv(icon('lock'), 2), h('span', 'num knode-cost', String(n.cost)));
      else foot.append(cv(icon('star'), 2), h('span', 'num knode-cost', String(n.cost)));
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
        keepScroll = scroller(el)?.scrollTop ?? null;
        void ctx.update(res.profile).then(() => ctx.go({ name: 'knowledge' }));
      };
      field.append(b);
    }
    panel.append(field);
    rowEls[pb.row].append(panel);
  }
  // Legende in der Luecke rechts der letzten Zeile (wenn Platz ist): was Farben und Rahmen heissen
  if (layout.freeRight >= 260) {
    const lg = h('aside', 'klegend');
    lg.style.width = `${layout.freeRight - OPTS.gap - 8}px`;
    lg.append(h('div', 'klegend-t', S.knowledge.legend));
    const rowsL: [string, string][] = [['bought', S.knowledge.legendBought], ['available', S.knowledge.legendAvail], ['unaffordable', S.knowledge.legendPoor], ['locked', S.knowledge.legendLocked]];
    for (const [cls, txt] of rowsL) {
      const r = h('div', 'klegend-r');
      r.append(h('span', `klegend-sw ksw-${cls}`), h('span', '', txt));
      lg.append(r);
    }
    lg.append(h('div', 'klegend-h', S.knowledge.tip));
    rowEls[rowEls.length - 1].append(lg);
  }
  el.append(tree, h('div', 'foot-hint', S.knowledge.tip));
  setTimeout(() => { lastBought = null; }, 0);
  if (keepScroll != null) {
    const k = keepScroll;
    keepScroll = null;
    const restore = (): void => { const sc = scroller(el); if (sc) sc.scrollTop = k; };
    requestAnimationFrame(restore);
    setTimeout(restore, 30);
  }
  return { el };
}
