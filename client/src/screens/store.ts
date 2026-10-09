/**
 * Store (Runde 12): Pixel-Laden mit Haendler, Karten je Power (Icon, Name, Text, Preis in Embers, Bestand), Kaufen mit Ton und Funken.
 * Bei Insta-Warden waehlt man die Variante. Embers-Anzeige oben. Kauf ueber `buyPower` (meta), Rest ist Anzeige.
 */
import { buyPower } from '../meta';
import { emberIcon, iconPower, merchantSprite, type PowerIconId } from '../pixel/sprites';
import { INSTA_NAMES, INSTA_TIERS, INSTA_VARIANTS, type InstaVariant } from '../powers/info';
import { priceNote, storeCards, type StoreCard } from '../powers/store';
import { h } from '../ui/dom';
import { topBar } from './knowledge';
import { blit, cv, ptext, reducedMotion } from './px';
import { S, fmt } from './text';
import type { Ctx, View } from './types';

/** Embers-Anzeige (Glutstueck + Zahl). `set` zaehlt animiert hoch/runter. */
export function embersChip(n: number, big = false): { el: HTMLElement; set(n: number, animate?: boolean): void } {
  const el = h('div', `chip embers${big ? ' big' : ''}`);
  el.title = S.store.embersTip;
  const ic = cv(emberIcon(0), big ? 3 : 2, 'ember-ic');
  const num = h('span', 'num ember-n', fmt(n));
  el.append(ic, num);
  let shown = n, timer = 0, frame = 0;
  const flick = window.setInterval(() => { frame++; blit(ic, emberIcon(frame), big ? 3 : 2); if (!el.isConnected && frame > 4) clearInterval(flick); }, 260);
  return {
    el,
    set(to, animate = true) {
      clearInterval(timer);
      if (!animate || reducedMotion() || to === shown) { shown = to; num.textContent = fmt(to); return; }
      const from = shown, t0 = performance.now();
      timer = window.setInterval(() => {
        const f = Math.min(1, (performance.now() - t0) / 450);
        shown = Math.round(from + (to - from) * f);
        num.textContent = fmt(shown);
        if (f >= 1) clearInterval(timer);
      }, 30);
    },
  };
}

const LINES = ['Fresh from the forge!', 'Lanterns burn bright tonight.', 'Spend your Embers wisely, warden.', 'One use per kind each round, remember.', 'The Glims are restless...'];

export function storeView(ctx: Ctx): View {
  const el = h('div', 'scr store');
  const chip = embersChip(ctx.store.profile.embers, true);
  el.append(topBar(ctx, S.store.title, chip.el));

  // Laden: Haendler links, Theke mit Karten rechts
  const shop = h('div', 'shop');
  const stall = h('div', 'stall');
  const awning = h('div', 'awning');
  const merch = h('div', 'merchant');
  const mc = cv(merchantSprite(0), 5, 'merchant-art');
  let mf = 0;
  const breathe = window.setInterval(() => { mf++; blit(mc, merchantSprite(mf), 5); if (!el.isConnected && mf > 4) clearInterval(breathe); }, 700);
  const say = h('div', 'speech', LINES[0]);
  merch.append(say, mc, h('div', 'counter-front'));
  stall.append(awning, merch);

  const grid = h('div', 'cards');
  let variant: InstaVariant = 'ranger';
  const talk = (s: string): void => { say.textContent = s; };

  const render = (flash?: string): void => {
    const p = ctx.store.profile;
    const cards = storeCards(p.embers, p.inventory, variant);
    grid.replaceChildren(...cards.map((c) => card(c, flash === c.id)));
  };

  const buy = (c: StoreCard): void => {
    const res = buyPower(ctx.store.profile, c.key);
    if (!res.ok) {
      ctx.sound('error');
      talk(res.code === 'not-enough-embers' ? `Not enough Embers. ${c.missing} more for the ${c.name}.` : 'That is not for sale.');
      return;
    }
    ctx.sound('storeBuy');
    talk(`${c.name}${c.variant ? ` (${INSTA_NAMES[c.variant]})` : ''}, yours. Don't spend it all at once.`);
    void ctx.update(res.profile).then(() => {
      chip.set(res.profile.embers);
      render(c.id);
    });
  };

  const card = (c: StoreCard, flash: boolean): HTMLElement => {
    const el2 = h('article', `scard${c.affordable ? '' : ' poor'}${flash ? ' bought' : ''}`);
    el2.dataset.power = c.id;
    const head = h('div', 'sc-head');
    head.append(cv(iconPower(c.id as PowerIconId), 4, 'sc-ic'), h('div', 'sc-name', c.name));
    const desc = h('div', 'sc-desc', c.desc);
    el2.append(head, desc);
    if (c.id === 'instaWarden') {
      const seg = h('div', 'sc-variants');
      for (const v of INSTA_VARIANTS) {
        const b = h('button', `sc-var${v === variant ? ' on' : ''}`);
        b.dataset.variant = v;
        b.append(h('span', 'v-n', INSTA_NAMES[v]), h('span', 'v-t num', INSTA_TIERS[v]), h('span', 'v-o num', `x${c.perVariant?.[v] ?? 0}`));
        b.onclick = () => { ctx.sound('click'); variant = v; render(); };
        seg.append(b);
      }
      el2.append(seg);
    }
    const foot = h('div', 'sc-foot');
    foot.append(h('div', 'sc-owned', `Owned: ${c.owned}`));
    const btn = h('button', 'sc-buy');
    btn.dataset.buy = c.id;
    btn.append(cv(emberIcon(0), 2), h('b', 'num', String(c.price)), h('span', 'sc-buy-l', 'Buy'));
    btn.setAttribute('aria-disabled', String(!c.affordable));
    btn.onclick = () => buy(c);
    foot.append(btn);
    const note = priceNote(c);
    if (note) foot.append(h('div', 'sc-need', note));
    el2.append(foot);
    return el2;
  };

  render();
  shop.append(stall, grid);
  el.append(shop);
  return { el, dispose: () => { clearInterval(breathe); } };
}

void ptext;
