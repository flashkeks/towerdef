/**
 * Raid-Shop (Runde 9 / P3): Raid-Marken gegen Gold, Crystals, Evolutions-Material und die Units der Raids. Daten kommen von `Backend.raidShop()`
 * (dieselben Angebote, aus denen gekauft wird), gekauft wird mit `Backend.buyRaidOffer` (idempotent). Gestaltung im Kit (Panel, Rahmen, Chips).
 */
import { getBackend } from '../backend';
import type { RaidOfferView, RaidShopView } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { notify } from './flash';
import { icon, panel } from './kit';
import { errorText } from './meta-model';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import type { Nav } from './nav';
import { openRaidPurchase } from './prize-sources';
import { miniOf } from './unit-card';

export function buildRaidShop(nav: Nav): HTMLElement {
  const f = metaFrame('raidshopscr', 'raidshop.title', nav);
  f.box.classList.add('screen-raidshop');
  void new RaidShopScreen(f, nav).load();
  return f.box;
}

const TONE: Record<string, string> = { gold: 'var(--gold)', crystals: 'var(--aether)', material: 'var(--violet)', unit: 'var(--ember)' };

class RaidShopScreen {
  private busy = false;
  private readonly sections = h('div', 'rs-sections');
  private readonly balance = h('strong', 'rs-balance-num');

  constructor(private readonly f: MetaFrame, private readonly nav: Nav) {
    const head = panel({ tone: 'ember', cls: 'rs-head', tag: 'div' });
    const mark = h('span', 'rs-mark');
    mark.append(icon('mark', 'fill'));
    const copy = h('div', 'rs-head-copy');
    copy.append(h('span', 'rs-balance-label', t('raidshop.balance')), this.balance, h('span', 'rs-sub', t('raidshop.subtitle')));
    const toRaids = h('button', 'btn small rs-toraids');
    toRaids.type = 'button';
    toRaids.append(icon('swords'), t('raidshop.toRaids'));
    toRaids.addEventListener('click', () => nav.world('raids'));
    head.body.append(mark, copy, toRaids);
    f.body.append(head, this.sections);
  }

  async load(): Promise<void> {
    const r = await getBackend().raidShop();
    if (!r.ok) return void this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
    this.render(r.shop);
  }

  private render(shop: RaidShopView): void {
    this.balance.textContent = shop.raidMarks.toLocaleString('en-US');
    this.balance.dataset.marks = String(shop.raidMarks);
    const groups: { id: string; title: string; offers: RaidOfferView[] }[] = [
      { id: 'basics', title: t('raidshop.section.basics'), offers: shop.offers.filter((o) => o.kind === 'gold' || o.kind === 'crystals') },
      { id: 'material', title: t('raidshop.section.material'), offers: shop.offers.filter((o) => o.kind === 'material') },
      { id: 'units', title: t('raidshop.section.units'), offers: shop.offers.filter((o) => o.kind === 'unit') },
    ];
    this.sections.replaceChildren();
    for (const g of groups) {
      const sec = h('section', `rs-section rs-${g.id}`);
      sec.append(h('h2', 'rs-title', g.title));
      const grid = h('div', 'rs-grid');
      for (const o of g.offers) grid.append(this.card(o));
      sec.append(grid);
      this.sections.append(sec);
    }
  }

  private card(o: RaidOfferView): HTMLElement {
    const c = h('div', `rs-card ${o.kind}${o.soldOut ? ' soldout' : ''}${o.canBuy ? '' : ' cant'}`);
    c.dataset.offer = o.id;
    c.style.setProperty('--tone', TONE[o.kind] ?? 'var(--aether)');
    const art = h('div', 'rs-art');
    if (o.kind === 'unit') art.append(miniOf(o.unitId!, 76));
    else art.append(icon(o.kind === 'gold' ? 'coin' : o.kind === 'crystals' ? 'crystal' : 'shard', 'fill'));
    const name = o.kind === 'unit' ? o.title : o.kind === 'material' ? t('raidshop.amount.material', { n: o.amount, name: o.title }) : t(`raidshop.amount.${o.kind}`, { n: o.amount.toLocaleString('en-US') });
    c.append(art, h('strong', 'rs-name', name));
    if (o.kind === 'material') c.append(h('span', 'rs-stock muted', t('raidshop.owned', { n: o.owned })));
    else if (o.kind === 'unit' && o.raidId) c.append(h('span', 'rs-stock muted', t('raidshop.from', { raid: o.raidName ?? o.raidId })));
    else c.append(h('span', 'rs-stock muted', ' '));
    if (o.limit !== null && o.kind !== 'unit') c.append(h('span', 'rs-limit', o.soldOut ? t('raidshop.soldout') : t('raidshop.limit', { bought: o.bought, limit: o.limit })));
    else if (o.kind === 'unit') c.append(h('span', 'rs-limit', o.owned > 0 ? t('raidshop.ownedUnit') : ' '));
    const buy = h('button', 'btn primary rs-buy');
    buy.type = 'button';
    buy.disabled = !o.canBuy || this.busy;
    const price = h('span', 'rs-price');
    price.append(icon('mark', 'fill'), String(o.price));
    buy.append(price, h('span', undefined, o.soldOut ? t('raidshop.soldout') : t('raidshop.buy')));
    if (o.reason && !o.soldOut) buy.title = o.reason;
    buy.addEventListener('click', () => void this.buy(o));
    c.append(buy);
    return c;
  }

  private async buy(o: RaidOfferView): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.sections.querySelectorAll<HTMLButtonElement>('.rs-buy').forEach((b) => (b.disabled = true));
    const r = await getBackend().buyRaidOffer(o.id, newKey());
    if (!r.ok) {
      notify(errorText(r), 'error');
    } else {
      const p = r.purchase;
      notify(
        p.kind === 'unit' ? t('raidshop.bought.unit', { name: o.title }) : p.kind === 'material' ? t('raidshop.bought.material', { n: p.amount, name: o.title }) : t(`raidshop.bought.${p.kind}`, { n: p.amount }),
        'good',
      );
      if (p.kind === 'unit') await openRaidPurchase(p);
    }
    this.busy = false;
    await this.f.refreshWallet();
    await this.load();
  }
}
