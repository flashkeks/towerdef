/**
 * Shop (Mock): drei Crystal-Pakete, sichtbarer Bonus, KEIN Geldbetrag. "Test purchase - no real money" steht auf jedem Paket.
 * Der Kauf laeuft ueber `Backend.buy` (Mock-Zahlungsanbieter, idempotent); `pending` wird mit `refreshOrder` nachgefragt. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { ShopProduct } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { notify } from './flash';
import { icon, panel } from './kit';
import { gemCluster } from './kit/gems';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import { errorText } from './meta-model';
import { openCrystalPack } from './prize-sources';
import type { Nav } from './nav';

export function buildShop(nav: Nav): HTMLElement {
  const f = metaFrame('shopscr', 'shopscreen.title', nav);
  f.box.classList.add('screen-shop');
  void new ShopScreen(f).load();
  return f.box;
}

class ShopScreen {
  private busy = false;
  private pending: string | null = null;
  /** Bonus des Pakets der offenen Bestellung (fuer die Karten nach `refresh`) */
  private pendingBonus = 0;
  private readonly list = h('div', 'shop-products');
  private readonly status = h('p', 'muted shop-status');

  constructor(private readonly f: MetaFrame) {
    const note = panel({ tone: 'ember', cls: 'shop-note', tag: 'div' });
    const ic = h('span', 'shop-note-ic');
    ic.append(icon('bag'));
    const copy = h('div', 'shop-note-copy');
    copy.append(h('strong', undefined, t('shopscreen.mock')), h('span', undefined, t('shopscreen.mock.text')), h('span', 'shop-note-sub', t('shopscreen.subtitle')));
    note.body.append(ic, copy);
    f.body.append(note, this.list, this.status);
  }

  async load(): Promise<void> {
    const r = await getBackend().shopCatalog();
    if (!r.ok) return void this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
    r.products.forEach((p, i) => this.list.append(this.product(p, i, r.products.length)));
  }

  private product(p: ShopProduct, i: number, n: number): HTMLElement {
    const tier = Math.min(2, n <= 1 ? 0 : Math.round((i / (n - 1)) * 2));
    const c = h('div', `product tier${tier}`);
    c.dataset.sku = p.sku;
    const buy = h('button', 'btn primary buy-btn', t('shopscreen.buy'));
    buy.type = 'button';
    buy.addEventListener('click', () => void this.buy(p));
    if (n >= 3 && i === n - 1) c.append(h('span', 'product-ribbon best', t('shopscreen.best')));
    else if (n >= 3 && i === 1) c.append(h('span', 'product-ribbon', t('shopscreen.popular')));
    const art = h('div', 'product-art');
    art.append(gemCluster(tier));
    c.append(art, h('strong', 'product-name', t(`shopscreen.tier.${tier}`)));
    const amount = h('span', 'product-crystals');
    amount.append(icon('crystal'), h('b', undefined, p.crystals.toLocaleString('en-US')), h('small', undefined, t('shopscreen.unit')));
    amount.setAttribute('aria-label', t('shopscreen.crystals', { n: p.crystals.toLocaleString('en-US') }));
    c.append(amount);
    if (p.bonusCrystals > 0) c.append(h('span', 'product-bonus', t('shopscreen.bonus', { n: p.bonusCrystals.toLocaleString('en-US'), pct: p.bonusPct })));
    else c.append(h('span', 'product-bonus none', ' '));
    c.append(h('span', 'product-note', p.priceNote), buy);
    return c;
  }

  private setBusy(on: boolean): void {
    this.busy = on;
    this.f.box.querySelectorAll<HTMLButtonElement>('.buy-btn').forEach((b) => {
      b.disabled = on;
    });
  }

  private async buy(p: ShopProduct): Promise<void> {
    if (this.busy) return;
    this.setBusy(true);
    const r = await getBackend().buy(p.sku, newKey());
    if (!r.ok) {
      notify(errorText(r), 'error');
      this.setBusy(false);
      return;
    }
    if (r.order.status === 'pending') {
      this.pending = r.order.orderId;
      this.pendingBonus = p.bonusCrystals;
      this.status.textContent = t('shopscreen.pending');
      const again = h('button', 'btn refresh-order', t('shopscreen.refresh'));
      again.addEventListener('click', () => void this.refresh(again));
      this.status.append(' ', again);
    } else {
      this.pending = null;
      this.status.textContent = t('shopscreen.done', { n: r.order.crystals.toLocaleString('en-US') });
      notify(t('shopscreen.done', { n: r.order.crystals.toLocaleString('en-US') }), 'good');
      await openCrystalPack({ crystals: r.order.crystals, bonusCrystals: p.bonusCrystals });
    }
    await this.f.refreshWallet();
    this.setBusy(false);
  }

  private async refresh(btn: HTMLButtonElement): Promise<void> {
    if (!this.pending) return;
    btn.disabled = true;
    const r = await getBackend().refreshOrder(this.pending, newKey());
    if (!r.ok) {
      notify(errorText(r), 'error');
      btn.disabled = false;
      return;
    }
    if (r.order.status === 'paid') {
      this.pending = null;
      this.status.textContent = t('shopscreen.done', { n: r.order.crystals.toLocaleString('en-US') });
      await openCrystalPack({ crystals: r.order.crystals, bonusCrystals: this.pendingBonus });
      await this.f.refreshWallet();
    } else btn.disabled = false;
  }
}
