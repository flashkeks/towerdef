import { describe, expect, it } from 'vitest';
import {
  MockPaymentProvider,
  SHOP_CATALOG,
  TEST_PURCHASE_NOTICE,
  applyPaymentEvent,
  balanceOf,
  buy,
  getOrder,
  newProfile,
  pull,
  refreshOrder,
  refundOrder,
  testEnv,
  withIdempotencyAsync,
  type PaymentEvent,
  type Profile,
} from '../src';

const setup = (outcome: 'ok' | 'fail' | 'pending' | 'duplicate-event' = 'ok') => {
  const env = testEnv(1);
  return { env, p: newProfile(env), prov: new MockPaymentProvider(env, outcome) };
};
const purchases = (p: Profile) => p.ledger.filter((e) => e.kind === 'purchase');

describe('Katalog', () => {
  it('drei Pakete mit sichtbarem Bonus, keine Geldbetraege', () => {
    expect(SHOP_CATALOG.map((x) => x.crystals)).toEqual([500, 1200, 2600]);
    expect(SHOP_CATALOG.map((x) => x.bonusCrystals)).toEqual([0, 200, 600]);
    expect(SHOP_CATALOG.map((x) => x.bonusPct)).toEqual([0, 20, 30]);
    for (const x of SHOP_CATALOG) {
      expect(x.crystals).toBe(x.baseCrystals + x.bonusCrystals);
      expect(x.price).toBeNull();
      expect(x.priceNote).toBe(TEST_PURCHASE_NOTICE);
    }
    expect(TEST_PURCHASE_NOTICE).toBe('Test purchase - no real money');
    // nirgends ein Waehrungsbetrag in den Daten
    expect(JSON.stringify(SHOP_CATALOG)).not.toMatch(/eur|usd|€|\$|amountMinor|currency/i);
  });
});

describe('Kauf-Ablauf (architecture 7.3 lokal)', () => {
  it('ok: Bestellung -> Ereignis -> genau eine Buchung purchase, Bestellung paid', async () => {
    const { env, p, prov } = setup();
    const r = await buy(p, 'crystals_1200', env, prov);
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ sku: 'crystals_1200', crystals: 1200, status: 'paid', duplicateEventsIgnored: 0 });
    expect(purchases(r.profile)).toHaveLength(1);
    expect(purchases(r.profile)[0]).toMatchObject({ currency: 'crystals', delta: 1200, refType: 'order', refId: r.result.orderId });
    expect(balanceOf(r.profile, 'crystals')).toBe(1200);
    const o = getOrder(r.profile, r.result.orderId)!;
    expect(o.status).toBe('paid');
    expect(o.eventIds).toHaveLength(1);
    expect(p.orders).toBeUndefined();
  });
  it('duplicate-event: zweites Ereignis mit derselben ID wird ignoriert, eine Buchung', async () => {
    const { env, p, prov } = setup('duplicate-event');
    const r = await buy(p, 'crystals_500', env, prov);
    if (!r.ok) throw new Error(r.message);
    expect(r.result.duplicateEventsIgnored).toBe(1);
    expect(purchases(r.profile)).toHaveLength(1);
    expect(balanceOf(r.profile, 'crystals')).toBe(500);
  });
  it('Deduplikation per Ereignis-ID auch spaeter; ein weiteres Ereignis mit neuer ID bucht trotzdem nichts doppelt', async () => {
    const { env, p, prov } = setup();
    const r = await buy(p, 'crystals_500', env, prov);
    if (!r.ok) throw new Error(r.message);
    const o = getOrder(r.profile, r.result.orderId)!;
    const same: PaymentEvent = { id: o.eventIds[0]!, type: 'checkout.completed', orderId: o.orderId, providerRef: o.providerRef, occurredAt: 'x' };
    const a = applyPaymentEvent(r.profile, same, env);
    expect(a.ok && a.result).toMatchObject({ duplicate: true, booked: false });
    const b = applyPaymentEvent(r.profile, { ...same, id: 'evt_other' }, env);
    expect(b.ok && b.result).toMatchObject({ duplicate: false, booked: false, status: 'paid' });
    expect(b.ok && purchases(b.profile)).toHaveLength(1);
  });
  it('fail: payment-failed, kein Guthaben, Profil unveraendert', async () => {
    const { env, p, prov } = setup('fail');
    const r = await buy(p, 'crystals_500', env, prov);
    expect(r).toMatchObject({ ok: false, code: 'payment-failed' });
    expect(p.ledger).toHaveLength(0);
  });
  it('pending: Bestellung bleibt offen ohne Guthaben; refreshOrder holt nach, sobald der Anbieter bestaetigt', async () => {
    const { env, p, prov } = setup('pending');
    const r = await buy(p, 'crystals_2600', env, prov);
    if (!r.ok) throw new Error(r.message);
    expect(r.result).toMatchObject({ status: 'pending', crystals: 0 });
    expect(balanceOf(r.profile, 'crystals')).toBe(0);
    expect(getOrder(r.profile, r.result.orderId)!.status).toBe('pending');
    const still = await refreshOrder(r.profile, r.result.orderId, env, prov);
    expect(still.ok && still.result.status).toBe('pending');
    prov.outcome = 'ok';
    const done = await refreshOrder(r.profile, r.result.orderId, env, prov);
    if (!done.ok) throw new Error(done.message);
    expect(done.result).toMatchObject({ status: 'paid', crystals: 2600 });
    expect(balanceOf(done.profile, 'crystals')).toBe(2600);
    // nochmal nachfragen: nichts doppelt
    const again = await refreshOrder(done.profile, r.result.orderId, env, prov);
    expect(again.ok && balanceOf(again.profile, 'crystals')).toBe(2600);
    expect(again.ok && purchases(again.profile)).toHaveLength(1);
    // Anbieter lehnt spaeter ab -> failed, nie bezahlt
    prov.outcome = 'fail';
    const bad = await refreshOrder(r.profile, r.result.orderId, env, prov);
    expect(bad).toMatchObject({ ok: false, code: 'payment-failed' });
  });
  it('Zustandsautomat: failed ist endgueltig, bezahlt kann nicht mehr scheitern', async () => {
    const { env, p, prov } = setup();
    const r = await buy(p, 'crystals_500', env, prov);
    if (!r.ok) throw new Error(r.message);
    const o = getOrder(r.profile, r.result.orderId)!;
    const failed: PaymentEvent = { id: 'e1', type: 'checkout.failed', orderId: o.orderId, providerRef: o.providerRef, failureCode: 'x', occurredAt: 'x' };
    expect(applyPaymentEvent(r.profile, failed, env)).toMatchObject({ ok: false, code: 'invalid-order-state' });
    expect(applyPaymentEvent(r.profile, { ...failed, providerRef: 'fremd' }, env)).toMatchObject({ ok: false, code: 'provider-ref-mismatch' });
    expect(applyPaymentEvent(r.profile, { ...failed, orderId: 'nix' }, env)).toMatchObject({ ok: false, code: 'unknown-order' });
  });
  it('unbekannte SKU', async () => {
    const { env, p, prov } = setup();
    expect(await buy(p, 'crystals_999', env, prov)).toMatchObject({ ok: false, code: 'unknown-sku' });
  });
  it('Erstattung: Ledger refund, Saldo darf negativ werden, Ziehen danach gesperrt', async () => {
    const { env, p, prov } = setup();
    const r = await buy(p, 'crystals_500', env, prov);
    if (!r.ok) throw new Error(r.message);
    const spent = pull(r.profile, 'standard', 10, env); // 450 ausgegeben
    if (!spent.ok) throw new Error(spent.message);
    const ref = await refundOrder(spent.profile, r.result.orderId, env, prov);
    if (!ref.ok) throw new Error(ref.message);
    expect(ref.result).toMatchObject({ status: 'refunded', booked: true });
    expect(balanceOf(ref.profile, 'crystals')).toBe(500 - 450 - 500);
    expect(ref.profile.ledger.filter((e) => e.kind === 'refund')).toHaveLength(1);
    expect(pull(ref.profile, 'standard', 1, env)).toMatchObject({ ok: false, code: 'not-enough-crystals' });
    expect(await refundOrder(ref.profile, r.result.orderId, env, prov)).toMatchObject({ ok: false, code: 'invalid-order-state' });
  });
});

describe('Idempotenz des Kaufs', () => {
  it('Doppelklick (gleicher Schluessel) kauft einmal; gleicher Schluessel mit anderer SKU -> Fehler', async () => {
    const { env, p, prov } = setup();
    const run = (q: Profile, key: string, sku: string) => withIdempotencyAsync(q, { key, route: 'buy', request: { sku } }, env, (x) => buy(x, sku, env, prov));
    const a = await run(p, 'buy-key-00001', 'crystals_500');
    if (!a.ok) throw new Error(a.message);
    const b = await run(a.profile, 'buy-key-00001', 'crystals_500');
    if (!b.ok) throw new Error(b.message);
    expect(b.replayed).toBe(true);
    expect(balanceOf(b.profile, 'crystals')).toBe(500);
    expect(purchases(b.profile)).toHaveLength(1);
    expect(await run(a.profile, 'buy-key-00001', 'crystals_2600')).toMatchObject({ ok: false, code: 'idempotency-key-reuse' });
    // neuer Schluessel = neuer Kauf
    const c = await run(b.profile, 'buy-key-00002', 'crystals_500');
    expect(c.ok && balanceOf(c.profile, 'crystals')).toBe(1000);
  });
});
