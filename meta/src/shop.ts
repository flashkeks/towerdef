/**
 * Mock-Shop (P3). KEINE Euro-Preise, kein echter Anbieter: `price` ist immer `null`, der Shop zeigt dauerhaft
 * "Test purchase - no real money" (`TEST_PURCHASE_NOTICE`; die UI nimmt den Text aus client/src/i18n/en.ts).
 *
 * Ablauf nach architecture 7.3, lokal nachgebildet (alles reine Funktionen auf dem Profil, der Anbieter ist injiziert):
 *  1. Bestellung `created` (ID vom Aufrufer/env), Produkt und Menge kommen aus `SHOP_CATALOG`, der Client schickt nur die SKU.
 *  2. `provider.createCheckout` -> `providerRef`, Bestellung `pending`.
 *  3. Anbieter-Ereignisse (`PaymentEvent`, beim Mock aus `pollEvents`, bei echten Anbietern aus Webhooks via `parseWebhook`) laufen durch
 *     `applyPaymentEvent`: Deduplikation per Ereignis-ID, Zustandsautomat `created -> pending -> paid -> refunded` bzw. `-> failed`
 *     (nie rueckwaerts), bei `checkout.completed` GENAU EINE Ledger-Buchung `purchase` (`order/<orderId>`; die Ledger-Eindeutigkeit
 *     verhindert Doppelgutschrift auch bei einem Bug).
 *  4. Fehlt das Ereignis (`pending`), holt `refreshOrder` per `provider.confirm` nach (architecture: Job fuer Bestellungen aelter als 1 Minute).
 *  5. `refundOrder` -> Ereignis `refund.completed` -> Ledger `refund` (Saldo darf negativ werden, Ziehungen sind dann gesperrt).
 *
 * Hinweis: `buy` ist `async` (wie ein echter Anbieter). Der Aufrufer serialisiert Aufrufe je Profil (LocalBackend: Warteschlange).
 * Ein fehlgeschlagener Kauf liefert `payment-failed` und hinterlaesst kein Profil (Fail verwirft Aenderungen); `pending` bleibt als Bestellung erhalten.
 */
import type { MetaEnv } from './env';
import { book, KIND } from './ledger';
import type { Order, Profile } from './profile';
import { fail, opOk, type Op } from './result';

export const TEST_PURCHASE_NOTICE = 'Test purchase - no real money';

export interface ShopProduct {
  sku: string;
  /** gelieferte Crystals insgesamt (Basis + Bonus) */
  crystals: number;
  baseCrystals: number;
  /** sichtbarer Bonus, immer im Shop anzeigen */
  bonusCrystals: number;
  /** Bonus in Prozent der Basis (ganzzahlig gerundet), 0 = kein Bonus */
  bonusPct: number;
  label: string;
  /** immer `null`: kein Geldbetrag, keine Waehrung */
  price: null;
  priceNote: typeof TEST_PURCHASE_NOTICE;
}

const product = (sku: string, baseCrystals: number, bonusCrystals: number): ShopProduct => ({
  sku,
  crystals: baseCrystals + bonusCrystals,
  baseCrystals,
  bonusCrystals,
  bonusPct: Math.round((bonusCrystals / baseCrystals) * 100),
  label: bonusCrystals > 0 ? `${(baseCrystals + bonusCrystals).toLocaleString('en-US')} Crystals (+${bonusCrystals.toLocaleString('en-US')} bonus)` : `${baseCrystals.toLocaleString('en-US')} Crystals`,
  price: null,
  priceNote: TEST_PURCHASE_NOTICE,
});

/** Startwerte (Runde 7), nicht kalibriert: 500 / 1200 (+20 %) / 2600 (+30 %). */
export const SHOP_CATALOG: readonly ShopProduct[] = [product('crystals_500', 500, 0), product('crystals_1200', 1000, 200), product('crystals_2600', 2000, 600)];

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
export interface RefundInput {
  orderId: string;
  providerRef: string;
  reason: 'customer' | 'fraud' | 'error';
}
export interface RefundResult {
  status: 'refunded' | 'failed';
  refundRef?: string;
}

/** Ein Anbieter-Ereignis (Webhook bzw. beim Mock ein interner Aufruf). `id` ist eindeutig und dient der Deduplikation. */
export type PaymentEvent =
  | { id: string; type: 'checkout.completed'; orderId: string; providerRef: string; occurredAt: string }
  | { id: string; type: 'checkout.failed'; orderId: string; providerRef: string; failureCode: string; occurredAt: string }
  | { id: string; type: 'refund.completed'; orderId: string; providerRef: string; occurredAt: string };

/** Schnittstelle nach architecture 7.2, ohne Geldbetraege (kein `Money`). */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<Checkout>;
  /** aktives Nachfragen (Fallback, falls ein Ereignis fehlt) */
  confirm(orderId: string, providerRef: string): Promise<ConfirmResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  /** Echte Anbieter: Signatur pruefen und Rohbody in `PaymentEvent` uebersetzen, wirft bei Fehler. Mock: nimmt ein internes Ereignis. */
  parseWebhook(rawBody: string, headers: Record<string, string>): PaymentEvent;
  /** Nur Mock/lokal: bisher aufgelaufene Ereignisse zur Bestellung abholen (beim echten Anbieter kommen sie per Webhook). */
  pollEvents?(orderId: string): PaymentEvent[];
}

export type MockOutcome = 'ok' | 'fail' | 'pending' | 'duplicate-event';

/** Ohne Netz, ohne Geld. `outcome` ist der Dev-Schalter fuer Negativfaelle (architecture 7.2: `MOCK_PAYMENT_OUTCOME`). */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  private queue = new Map<string, PaymentEvent[]>();
  constructor(
    private readonly env: Pick<MetaEnv, 'newId'> & Partial<Pick<MetaEnv, 'now'>>,
    public outcome: MockOutcome = 'ok',
  ) {}

  private at = (): string => this.env.now?.() ?? '1970-01-01T00:00:00.000Z';
  private push(orderId: string, ev: PaymentEvent): void {
    this.queue.set(orderId, [...(this.queue.get(orderId) ?? []), ev]);
  }

  async createCheckout(input: CreateCheckoutInput): Promise<Checkout> {
    const providerRef = `mock_${this.env.newId()}`;
    const base = { orderId: input.orderId, providerRef, occurredAt: this.at() };
    if (this.outcome === 'ok' || this.outcome === 'duplicate-event') {
      const ev: PaymentEvent = { id: `evt_${this.env.newId()}`, type: 'checkout.completed', ...base };
      this.push(input.orderId, ev);
      if (this.outcome === 'duplicate-event') this.push(input.orderId, { ...ev });
      return { providerRef, status: 'confirmed', redirectUrl: null };
    }
    if (this.outcome === 'fail') this.push(input.orderId, { id: `evt_${this.env.newId()}`, type: 'checkout.failed', failureCode: 'mock_declined', ...base });
    return { providerRef, status: 'pending', redirectUrl: null };
  }

  async confirm(_orderId: string, _providerRef: string): Promise<ConfirmResult> {
    if (this.outcome === 'fail') return { status: 'failed', failureCode: 'mock_declined' };
    if (this.outcome === 'pending') return { status: 'pending' };
    return { status: 'confirmed' };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    if (this.outcome === 'fail') return { status: 'failed' };
    this.push(input.orderId, { id: `evt_${this.env.newId()}`, type: 'refund.completed', orderId: input.orderId, providerRef: input.providerRef, occurredAt: this.at() });
    return { status: 'refunded', refundRef: `mockref_${this.env.newId()}` };
  }

  parseWebhook(rawBody: string, _headers: Record<string, string>): PaymentEvent {
    const o = JSON.parse(rawBody) as Partial<PaymentEvent> & Record<string, unknown>;
    const ok = typeof o.id === 'string' && typeof o.orderId === 'string' && typeof o.providerRef === 'string' && typeof o.occurredAt === 'string' && (o.type === 'checkout.completed' || o.type === 'refund.completed' || (o.type === 'checkout.failed' && typeof o.failureCode === 'string'));
    if (!ok) throw new Error('invalid payment event');
    return o as PaymentEvent;
  }

  pollEvents(orderId: string): PaymentEvent[] {
    const evs = this.queue.get(orderId) ?? [];
    this.queue.delete(orderId);
    return evs;
  }
}

// ---------------------------------------------------------------- Bestellungen im Profil

const ORDERS_MAX = 100;
const EVENTS_PER_ORDER_MAX = 20;

export const getOrder = (p: Profile, orderId: string): Order | null => p.orders?.[orderId] ?? null;

function putOrder(p: Profile, o: Order): Profile {
  const orders = { ...(p.orders ?? {}), [o.orderId]: o };
  const ids = Object.keys(orders);
  if (ids.length > ORDERS_MAX) {
    const drop = ids.sort((a, b) => (orders[a]!.createdAt < orders[b]!.createdAt ? -1 : 1)).filter((id) => orders[id]!.status !== 'pending' && id !== o.orderId).slice(0, ids.length - ORDERS_MAX);
    for (const id of drop) delete orders[id];
  }
  return { ...p, orders };
}

export interface EventResult {
  orderId: string;
  status: Order['status'];
  /** Ereignis-ID war schon verarbeitet: nichts getan */
  duplicate: boolean;
  /** Ledger-Buchung ausgefuehrt (Kauf oder Erstattung) */
  booked: boolean;
}

/**
 * Anbieter-Ereignis verarbeiten (architecture 7.3 Schritt 3 und 5). Doppelte Ereignis-ID: nichts tun, Erfolg.
 * Ungueltiger Zustandsuebergang oder falsche `providerRef`: Fehler, Profil unveraendert.
 */
export function applyPaymentEvent(p: Profile, ev: PaymentEvent, env: Pick<MetaEnv, 'now'>): Op<EventResult> {
  const order = getOrder(p, ev.orderId);
  if (!order) return fail('unknown-order', 'Unknown order.');
  if (order.eventIds.includes(ev.id)) return opOk(p, { orderId: order.orderId, status: order.status, duplicate: true, booked: false });
  if (order.providerRef && order.providerRef !== ev.providerRef) return fail('provider-ref-mismatch', 'The event does not belong to this order.');
  const now = env.now();
  const done = (status: Order['status'], profile: Profile, booked: boolean): Op<EventResult> => {
    const o = getOrder(profile, order.orderId)!;
    const next: Order = { ...o, status, updatedAt: now, eventIds: [...o.eventIds, ev.id].slice(-EVENTS_PER_ORDER_MAX) };
    return opOk(putOrder(profile, next), { orderId: order.orderId, status, duplicate: false, booked });
  };
  switch (ev.type) {
    case 'checkout.completed': {
      if (order.status === 'paid' || order.status === 'refunded') return done(order.status, p, false); // weiteres Ereignis mit neuer ID: nichts doppelt gutschreiben
      if (order.status === 'failed') return fail('invalid-order-state', 'This order already failed.');
      const r = book(p, { currency: 'crystals', delta: order.crystals, kind: KIND.purchase, refType: 'order', refId: order.orderId }, env);
      if (!r.ok) return r;
      return done('paid', r.profile, true);
    }
    case 'checkout.failed': {
      if (order.status === 'created' || order.status === 'pending') return done('failed', p, false);
      if (order.status === 'failed') return done('failed', p, false);
      return fail('invalid-order-state', 'This order is already paid.');
    }
    case 'refund.completed': {
      if (order.status === 'refunded') return done('refunded', p, false);
      if (order.status !== 'paid') return fail('invalid-order-state', 'Only paid orders can be refunded.');
      const r = book(p, { currency: 'crystals', delta: -order.crystals, kind: KIND.refund, refType: 'order', refId: order.orderId }, env, { allowNegative: true });
      if (!r.ok) return r;
      return done('refunded', r.profile, true);
    }
  }
}

export interface PurchaseResult {
  orderId: string;
  sku: string;
  /** gutgeschriebene Crystals (0 solange die Bestellung `pending` ist) */
  crystals: number;
  providerRef: string;
  status: 'paid' | 'pending';
  /** wie viele doppelt gelieferte Ereignisse ignoriert wurden */
  duplicateEventsIgnored: number;
}

/** Ereignisse des Anbieters abholen, ueber `parseWebhook` normalisieren und anwenden. */
function drainEvents(p: Profile, orderId: string, env: Pick<MetaEnv, 'now'>, provider: PaymentProvider): Op<{ duplicates: number }> {
  let cur = p;
  let duplicates = 0;
  for (const raw of provider.pollEvents?.(orderId) ?? []) {
    let ev: PaymentEvent;
    try {
      ev = provider.parseWebhook(JSON.stringify(raw), {});
    } catch {
      return fail('invalid-payment-event', 'The payment event could not be read.');
    }
    const r = applyPaymentEvent(cur, ev, env);
    if (!r.ok) return r;
    if (r.result.duplicate) duplicates++;
    cur = r.profile;
  }
  return opOk(cur, { duplicates });
}

export async function buy(p: Profile, sku: string, env: MetaEnv, provider: PaymentProvider): Promise<Op<PurchaseResult>> {
  const prod = SHOP_CATALOG.find((x) => x.sku === sku);
  if (!prod) return fail('unknown-sku', `Unknown product ${sku}.`);
  const orderId = env.newId();
  const t0 = env.now();
  let cur = putOrder(p, { orderId, sku, crystals: prod.crystals, status: 'created', providerRef: '', createdAt: t0, updatedAt: t0, eventIds: [] });
  const co = await provider.createCheckout({ orderId, profileId: p.id, sku });
  cur = putOrder(cur, { ...getOrder(cur, orderId)!, status: 'pending', providerRef: co.providerRef, updatedAt: env.now() });
  const drained = drainEvents(cur, orderId, env, provider);
  if (!drained.ok) return drained;
  cur = drained.profile;
  let duplicates = drained.result.duplicates;
  // Kein Ereignis, aber der Anbieter meldet "bestaetigt": aktiv nachfragen (Fallback aus architecture 7.3 Schritt 4)
  if (getOrder(cur, orderId)!.status === 'pending' && co.status === 'confirmed') {
    const r = await settleByConfirm(cur, orderId, env, provider);
    if (!r.ok) return r;
    cur = r.profile;
    duplicates += r.result.duplicates;
  }
  const o = getOrder(cur, orderId)!;
  if (o.status === 'failed') return fail('payment-failed', 'The test payment failed. Nothing was charged.');
  const paid = o.status === 'paid';
  return opOk(cur, { orderId, sku, crystals: paid ? prod.crystals : 0, providerRef: co.providerRef, status: paid ? 'paid' : 'pending', duplicateEventsIgnored: duplicates });
}

async function settleByConfirm(p: Profile, orderId: string, env: Pick<MetaEnv, 'now'>, provider: PaymentProvider): Promise<Op<{ duplicates: number }>> {
  const o = getOrder(p, orderId)!;
  const c = await provider.confirm(orderId, o.providerRef);
  if (c.status === 'pending') return opOk(p, { duplicates: 0 });
  const ev: PaymentEvent =
    c.status === 'confirmed'
      ? { id: `confirm:${orderId}`, type: 'checkout.completed', orderId, providerRef: o.providerRef, occurredAt: env.now() }
      : { id: `confirm-failed:${orderId}`, type: 'checkout.failed', orderId, providerRef: o.providerRef, failureCode: c.failureCode ?? 'declined', occurredAt: env.now() };
  const r = applyPaymentEvent(p, ev, env);
  return r.ok ? opOk(r.profile, { duplicates: r.result.duplicate ? 1 : 0 }) : r;
}

/** Offene Bestellung nachpruefen (`pending`): Anbieter fragen, Ergebnis anwenden. Bei bezahlter Bestellung passiert nichts. */
export async function refreshOrder(p: Profile, orderId: string, env: Pick<MetaEnv, 'now'>, provider: PaymentProvider): Promise<Op<PurchaseResult>> {
  const o = getOrder(p, orderId);
  if (!o) return fail('unknown-order', 'Unknown order.');
  let cur = p;
  let duplicates = 0;
  if (o.status === 'pending' || o.status === 'created') {
    const drained = drainEvents(cur, orderId, env, provider);
    if (!drained.ok) return drained;
    cur = drained.profile;
    duplicates += drained.result.duplicates;
    if (getOrder(cur, orderId)!.status === 'pending') {
      const r = await settleByConfirm(cur, orderId, env, provider);
      if (!r.ok) return r;
      cur = r.profile;
      duplicates += r.result.duplicates;
    }
  }
  const n = getOrder(cur, orderId)!;
  if (n.status === 'failed') return fail('payment-failed', 'The test payment failed. Nothing was charged.');
  return opOk(cur, { orderId, sku: n.sku, crystals: n.status === 'paid' ? n.crystals : 0, providerRef: n.providerRef, status: n.status === 'pending' ? 'pending' : 'paid', duplicateEventsIgnored: duplicates });
}

/** Erstattung einer bezahlten Bestellung (Ledger `refund`, Saldo darf negativ werden). */
export async function refundOrder(p: Profile, orderId: string, env: Pick<MetaEnv, 'now'>, provider: PaymentProvider, reason: RefundInput['reason'] = 'customer'): Promise<Op<EventResult>> {
  const o = getOrder(p, orderId);
  if (!o) return fail('unknown-order', 'Unknown order.');
  if (o.status !== 'paid') return fail('invalid-order-state', 'Only paid orders can be refunded.');
  const rr = await provider.refund({ orderId, providerRef: o.providerRef, reason });
  if (rr.status !== 'refunded') return fail('refund-failed', 'The refund failed.');
  let cur = p;
  let last: EventResult = { orderId, status: o.status, duplicate: false, booked: false };
  for (const raw of provider.pollEvents?.(orderId) ?? []) {
    const ev = provider.parseWebhook(JSON.stringify(raw), {});
    const r = applyPaymentEvent(cur, ev, env);
    if (!r.ok) return r;
    cur = r.profile;
    last = r.result;
  }
  return opOk(cur, last);
}
