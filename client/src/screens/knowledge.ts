/** Wissensbaum (Runde 14b): eine zusammenhaengende Tafel, fuenf Aeste nebeneinander, Abzeichen mit Ranken, festes Infofeld unten. */
import {
  BRANCHES, BRANCH_NAMES, KNOWLEDGE, buyNode, knowledgePoints, nodeById, nodeState, resetKnowledge, type Branch,
} from '../meta';
import { h } from '../ui/dom';
import { DEFAULT_OPTS, layoutTree, type PlacedLine } from './knowledge-layout';
import { icon, type IconName } from './icons';
import { cv, ptext } from './px';
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
let lastBought: string | null = null;

export function topBar(ctx: Ctx, title: string, right?: HTMLElement): HTMLElement {
  const bar = h('header', 'subtop');
  const back = h('button', 'btn-small', `< ${S.back}`);
  back.onclick = () => { ctx.sound('click'); ctx.go({ name: 'home' }); };
  bar.append(back, ptext(title, 5, 'amber', 'ink', 'sub-title'), right ?? h('span'));
  return bar;
}

const NS = 'http://www.w3.org/2000/svg';
/** Rechtwinklige Ranke: runter, quer in der Zeilenluecke, runter. Abzeichen liegen darueber, die Linie verschwindet dahinter. */
const vine = (l: PlacedLine, cell: number): string => `M${l.x1} ${l.y1} V${Math.round(l.y1 + cell * 0.68)} H${l.x2} V${l.y2}`;
const svgEl = (tag: string, attrs: Record<string, string>): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

export function knowledgeView(ctx: Ctx): View {
  const p = ctx.store.profile;
  const kp = knowledgePoints(p);
  const el = h('div', 'scr knowledge');

  const right = h('div', 'kp-box');
  const chip = h('div', `chip ${kp.free > 0 ? 'good' : ''}`);
  chip.append(cv(icon('star'), 2), h('span', 'num', `${S.knowledge.points}: ${kp.free}`), h('span', 'muted num', ` / ${kp.total}`));
  const reset = h('button', 'btn-small', S.knowledge.reset);
  reset.disabled = p.knowledge.length === 0;
  reset.title = S.knowledge.resetHint;
  reset.onclick = () => { ctx.sound('click'); lastBought = null; void ctx.update(resetKnowledge(ctx.store.profile)).then(() => ctx.go({ name: 'knowledge' })); };
  right.append(chip, reset);
  el.append(topBar(ctx, S.knowledge.title, right));

  const board = h('div', 'kboard');
  const info = h('div', 'kinfo');
  el.append(board, info);

  // ---- Infofeld unten: Standardtext + Legende, beim Ueberfahren die Beschreibung des Knotens
  const infoMain = h('div', 'kinfo-main');
  const legend = h('div', 'klegend');
  const rowsL: [string, string][] = [['bought', S.knowledge.legendBought], ['available', S.knowledge.legendAvail], ['unaffordable', S.knowledge.legendPoor], ['locked', S.knowledge.legendLocked]];
  for (const [cls, txt] of rowsL) {
    const r = h('div', 'klegend-r');
    r.append(h('span', `klegend-sw ksw-${cls}`), h('span', '', txt));
    legend.append(r);
  }
  info.append(infoMain, legend);
  const showTip = (): void => { infoMain.replaceChildren(h('div', 'kinfo-hint', S.knowledge.tip)); };
  const showNode = (id: string): void => {
    const n = nodeById(id)!;
    const st = nodeState(ctx.store.profile, id);
    const head = h('div', 'kinfo-h');
    head.append(cv(icon(NODE_ICONS[id] ?? 'star'), 3, 'kinfo-ic'), h('span', 'kinfo-n', n.name), h('span', `kinfo-c ${st}`, st === 'bought' ? S.knowledge.learned : S.knowledge.cost(n.cost)));
    const box = h('div', 'kinfo-b');
    box.append(head, h('div', 'kinfo-d', n.desc));
    if (st === 'locked') {
      const names = n.requires.map((r) => nodeById(r)?.name ?? r);
      box.append(h('div', 'kinfo-w', names.length > 1 ? S.knowledge.needsOne(names.join(', ')) : S.knowledge.needs(names[0])));
    } else if (st === 'unaffordable') box.append(h('div', 'kinfo-w', S.knowledge.noPoints));
    infoMain.replaceChildren(box);
  };
  showTip();

  const draw = (): void => {
    const W = board.clientWidth, H = board.clientHeight;
    if (W < 50 || H < 50) return;
    const layout = layoutTree(KNOWLEDGE, BRANCHES as readonly string[], { ...DEFAULT_OPTS, width: W, height: H, headH: H < 600 ? 42 : DEFAULT_OPTS.headH });
    const { cell, colW, badge } = layout;
    board.style.setProperty('--head', `${H < 600 ? 42 : DEFAULT_OPTS.headH}px`);
    board.style.setProperty('--cell', `${cell}px`);
    board.style.setProperty('--colw', `${colW}px`);
    board.style.setProperty('--badge', `${badge}px`);
    board.style.setProperty('--fs', `${Math.max(11, Math.min(18, Math.round(Math.min(cell, colW) * 0.19)))}px`);
    const lw = Math.max(4, Math.round(cell * 0.05 / 2) * 2);
    
    const iconScale = Math.max(2, Math.floor((badge * 0.62) / 14));
    const kids: Node[] = [];
    const sparks: HTMLElement[] = [];
    const svg = svgEl('svg', { class: 'klines', width: String(W), height: String(H) });
    for (const pb of layout.branches) {
      const branch = pb.branch as Branch;
      const bought = KNOWLEDGE.filter((n) => n.branch === branch && p.knowledge.includes(n.id)).length;
      const total = KNOWLEDGE.filter((n) => n.branch === branch).length;
      const band = h('div', `kband ${branch}`);
      band.style.cssText = `left:${pb.x - 6}px;top:${layout.y}px;width:${pb.w + 12}px;height:${layout.h}px`;
      const title = h('div', 'kbranch-t', BRANCH_NAMES[branch]);
      title.append(h('span', 'kbranch-c num', `${bought}/${total}`));
      band.append(title);
      kids.push(band);
      for (const l of pb.lines) {
        const on = p.knowledge.includes(l.from);
        const d = vine(l, cell);
        const g = svgEl('g', { class: `kline ${branch} ${on ? 'on' : ''}` });
        g.append(svgEl('path', { d, class: 'kline-bed', 'stroke-width': String(lw + 4) }), svgEl('path', { d, class: 'kline-core', 'stroke-width': String(lw) }));
        svg.append(g);
        if (on && lastBought === l.to) {
          for (let i = 0; i < 3; i++) {
            const sp = h('div', 'kspark');
            sp.style.cssText = `offset-path:path("${d}");animation-delay:${i * 110}ms;--bc:var(--bc-${branch})`;
            sparks.push(sp);
          }
        }
      }
    }
    kids.push(svg);
    for (const pb of layout.branches) {
      const branch = pb.branch as Branch;
      for (const pn of pb.nodes) {
        const n = nodeById(pn.id)!;
        const st = nodeState(p, n.id);
        const b = h('button', `knode ${st} ${branch} ${lastBought === n.id ? 'bought-now' : ''}`);
        b.dataset.node = n.id;
        b.style.left = `${pn.cx - colW / 2}px`;
        b.style.top = `${pn.cy - cell / 2}px`;
        const badgeEl = h('span', 'kbadge');
        badgeEl.append(h('span', 'kbadge-in'), cv(icon(NODE_ICONS[n.id] ?? 'star'), iconScale, 'knode-ic'));
        const cost = h('span', 'kcost');
        if (st === 'bought') cost.append(cv(icon('check'), 1));
        else cost.append(cv(icon(st === 'locked' ? 'lock' : 'star'), 1), h('span', 'num', String(n.cost)));
        // Name einzeilig halten: erst schmaler setzen, bricht nur um, wenn es gar nicht passt
        const fs = Math.max(11, Math.min(18, Math.round(Math.min(cell, colW) * 0.19)));
        const est = n.name.length * fs * 0.54;
        const nm = h('span', `knode-n ${est > colW - 6 ? (est * 0.92 > colW - 6 ? 'wrap' : 'long') : ''}`, n.name);
        b.append(badgeEl, cost, nm);
        b.addEventListener('pointerenter', () => showNode(n.id));
        b.addEventListener('focus', () => showNode(n.id));
        b.addEventListener('pointerleave', showTip);
        b.addEventListener('blur', showTip);
        b.onclick = () => {
          const res = buyNode(ctx.store.profile, n.id);
          if (!res.ok) { ctx.sound('error'); return; }
          ctx.sound('buy');
          lastBought = n.id;
          void ctx.update(res.profile).then(() => ctx.go({ name: 'knowledge' }));
        };
        kids.push(b);
      }
    }
    kids.push(...sparks);
    board.replaceChildren(...kids);
  };

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => draw()) : null;
  ro?.observe(board);
  requestAnimationFrame(draw);
  setTimeout(() => { lastBought = null; }, 1200);
  return { el, dispose: () => ro?.disconnect() };
}
