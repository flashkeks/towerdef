/**
 * Shop (Mock): drei Crystal-Pakete, sichtbarer Bonus, KEIN Geldbetrag. "Test purchase - no real money" steht auf jedem Paket.
 * Der Kauf laeuft ueber `Backend.buy` (Mock-Zahlungsanbieter, idempotent); `pending` wird mit `refreshOrder` nachgefragt. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { ShopProduct } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { notify } from './flash';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import { errorText } from './meta-model';
import type { Nav } from './nav';

export function buildShop(nav: Nav): HTMLElement {
  const f = metaFrame('shopscr', 'shopscreen.title', nav);
  void new ShopScreen(f).load();
  return f.box;
}

class ShopScreen {
  private busy = false;
  private pending: string | null = null;
  private readonly list = h('div', 'shop-products');
  private readonly status = h('p', 'muted shop-status');

  constructor(private readonly f: MetaFrame) {
    f.body.append(h('p', 'tagline', t('shopscreen.subtitle')), this.list, this.status);
  }

  async load(): Promise<void> {
    const r = await getBackend().shopCatalog();
    if (!r.ok) return void this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
    for (const p of r.products) this.list.append(this.product(p));
  }

  private product(p: ShopProduct): HTMLElement {
    const c = h('div', 'product');
    c.dataset.sku = p.sku;
    const buy = h('button', 'btn primary buy-btn', t('shopscreen.buy'));
    buy.type = 'button';
    buy.addEventListener('click', () => void this.buy(p));
    c.append(h('strong', 'product-name', p.label), h('span', 'product-crystals', t('shopscreen.crystals', { n: p.crystals.toLocaleString('en-US') })));
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
      this.status.textContent = t('shopscreen.pending');
      const again = h('button', 'btn refresh-order', t('shopscreen.refresh'));
      again.addEventListener('click', () => void this.refresh(again));
      this.status.append(' ', again);
    } else {
      this.pending = null;
      this.status.textContent = t('shopscreen.done', { n: r.order.crystals.toLocaleString('en-US') });
      notify(t('shopscreen.done', { n: r.order.crystals.toLocaleString('en-US') }), 'good');
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
      await this.f.refreshWallet();
    } else btn.disabled = false;
  }
}
