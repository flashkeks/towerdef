/**
 * Mock-Shop. Besitzer: P3. Jetzt: ein Paket und der Kauf-Pfad ueber `MockPaymentProvider`.
 *
 * TODO P3: drei Crystals-Pakete, Bonus sichtbar im Katalog, Dev-Schalter fuer Negativfaelle (fail/pending/duplicate-event),
 * `parseWebhook`/Ereigniswarteschlange nach architecture 7.2 falls fuer den Server-Pfad noetig, Erstattung -> Ledger `refund`.
 * KEINE Euro-Preise, kein echter Anbieter. Im Shop dauerhaft "Test purchase - no real money" (Text in client/src/i18n/en.ts).
 *
 * Hinweis: `buy` ist `async` (wie ein echter Anbieter). Der Aufrufer serialisiert Aufrufe je Profil (LocalBackend: Warteschlange),
 * sonst koennte das Profil zwischen `await` und Buchung wechseln.
 */
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import type { Profile } from './profile';
import { fail, opOk, type Op } from './result';

export interface ShopProduct {
  sku: string;
  /** gelieferte Crystals (inkl. Bonus; der Bonus muss im Shop sichtbar stehen) */
  crystals: number;
  label: string;
}

/** Startwerte. TODO P3. */
export const SHOP_CATALOG: readonly ShopProduct[] = [{ sku: 'crystals_500', crystals: 500, label: '500 Crystals' }];

export interface CreateCheckoutInput {
  orderId: string;
  profileId: string;
  sku: string;
}
export interface Checkout {
  providerRef: string;
  status: 'pending' | 'confirmed';
  redirectUrl: string | null;
}
export interface ConfirmResult {
  status: 'confirmed' | 'failed' | 'pending';
  failureCode?: string;
}

/** Schnittstelle nach architecture 7.2, ohne Geldbetraege. */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<Checkout>;
  confirm(orderId: string, providerRef: string): Promise<ConfirmResult>;
}

/** Bestaetigt sofort, ohne Netz, ohne Geld. */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  constructor(private readonly env: Pick<MetaEnv, 'newId'>) {}
  async createCheckout(_input: CreateCheckoutInput): Promise<Checkout> {
    return { providerRef: `mock_${this.env.newId()}`, status: 'confirmed', redirectUrl: null };
  }
  async confirm(_orderId: string, _providerRef: string): Promise<ConfirmResult> {
    return { status: 'confirmed' };
  }
}

export interface PurchaseResult {
  orderId: string;
  sku: string;
  crystals: number;
  providerRef: string;
}

export async function buy(p: Profile, sku: string, env: MetaEnv, provider: PaymentProvider): Promise<Op<PurchaseResult>> {
  const product = SHOP_CATALOG.find((x) => x.sku === sku);
  if (!product) return fail('unknown-sku', `Unknown product ${sku}.`);
  const orderId = env.newId();
  const co = await provider.createCheckout({ orderId, profileId: p.id, sku });
  if (co.status !== 'confirmed') return fail('payment-pending', 'The test payment is not confirmed.');
  const r = book(p, { currency: 'crystals', delta: product.crystals, kind: KIND.purchase, refType: 'order', refId: orderId }, env);
  if (!r.ok) return r;
  return opOk(r.profile, { orderId, sku, crystals: product.crystals, providerRef: co.providerRef });
}
