/**
 * Beschwoeren und Pakete oeffnen (Runde 10, P3). Ein Bildschirm fuer alle Mehrfach-Ergebnisse: 10er-Zug, Starter-Paket, Raid-Belohnung,
 * Meilensteine, Shop-Kaeufe.
 *
 * Ablauf:
 * 1. **Aufbau** (`charge`): Riss/Portal, Licht sammelt sich, die Farbe steigt Blau -> Lila -> Gold -> Regenbogen bis zur besten Seltenheit,
 *    das Bild ruckelt immer staerker, dann Durchbruch (Blitz, Partikel, Ton; Mythic/Secret mit Stinger). Klick ueberspringt den Aufbau.
 * 2. Ein Gewinn: **grosse Enthuellung** (Portraet, Name, Serie, Seltenheit, "NEW", Shiny-Glitzer).
 *    Mehrere: **verdeckte Karten**, einzeln per Klick (oder Leertaste) aufdecken, "Reveal all" (Taste A) deckt den Rest auf.
 *    Karten ab Legendary bekommen beim einzelnen Aufdecken ein Rampenlicht (Klick schliesst es).
 * 3. **Uebersicht** aller Gewinne (Raster, hoechste Seltenheit zuletzt) mit "Done".
 * Esc springt jederzeit zur Uebersicht (bzw. schliesst sie). Das Ergebnis steht beim Zeigen schon fest; hier wird nur gezeigt.
 * Zustand ohne DOM und Reihenfolge: `reveal-model.ts` (getestet).
 */
import { getBackend } from '../backend';
import type { PullBatchResult } from '../backend/meta';
import { chargeSound, uiSound } from '../audio/ui-audio';
import type { UiSoundId } from '../audio/recipes-ui';
import { t } from '../i18n/t';
import { h } from './dom';
import { icon, portraitCard, sigil, type RarityId } from './kit';
import { rarityName, unitName } from './meta-model';
import { chargePlan, gridShape, isSpotlight, PackState, prizeRarity, prizesFromPulls, REVEAL_HUE, type Prize } from './reveal-model';
import { manifestSeries } from '../view/portrait';
import { unitMeta } from './unit-card';
import { unitDefs } from './unit-defs';
import { celebrate } from './menu-fx';
import { Sparks } from './sparks';

export interface RevealOptions {
  /** Ueberschrift der Uebersicht (Standard: "Summary") */
  title?: string;
  /** Aufbau zeigen (Standard ja); `short` = halbe Dauer (Pakete, Belohnungen) */
  charge?: boolean | 'short';
}

/** Serie einer Unit, wenn die Daten sie kennen (Feld `series` an der Unit-Definition oder im Bild-Manifest, kommt mit P1). Ohne Feld: nichts, die Karte sieht trotzdem fertig aus. */
export function unitSeries(id: string): string | null {
  const d = unitDefs().get(id) as { series?: unknown } | undefined;
  return typeof d?.series === 'string' && d.series.trim() ? d.series : manifestSeries(id);
}

const CURRENCY_ICON: Record<string, string> = { crystals: 'crystal', gold: 'coin', xp: 'star', marks: 'mark' };

/** Vorderseite eines Gewinns. `big` = Rampenlicht/Einzel-Enthuellung. */
function prizeFace(p: Prize, big: boolean): HTMLElement {
  if (p.kind === 'unit') {
    const m = unitMeta(p.unitId, p.rarity);
    const c = portraitCard({ unitId: p.unitId, name: m.name, rarity: p.rarity, elements: m.elements, live: big, tile: false, cls: big ? 'rv-big' : 'pz-unit' });
    const sub = c.querySelector('.pc-sub');
    const series = unitSeries(p.unitId);
    if (sub) sub.replaceChildren(h('span', 'pc-series', series ?? rarityName(p.rarity)));
    if (p.isNew) c.append(h('span', 'pz-new', t('summon.new')));
    else c.append(h('span', 'pz-dupe', t('summon.duplicate')));
    if (p.shiny) {
      c.classList.add('shiny');
      c.append(h('span', 'pz-shiny', t('reveal.shiny')));
    }
    c.dataset.unit = p.unitId;
    return c;
  }
  const r = prizeRarity(p);
  const c = h('div', `pz-item r-${r}${big ? ' rv-big' : ''} ${p.kind === 'currency' ? `cur-${p.currency}` : 'cur-material'}`);
  const ic = h('span', 'pz-ic');
  ic.append(icon(p.kind === 'currency' ? (CURRENCY_ICON[p.currency] ?? 'star') : 'shard', 'fill'));
  const amount = h('strong', 'pz-amount', `${p.amount.toLocaleString('en-US')}`);
  const label = h('span', 'pz-label', p.kind === 'currency' ? t(`reveal.cur.${p.currency}`) : p.name);
  c.append(ic, amount, label);
  if (p.kind === 'currency' && p.note) c.append(h('span', 'pz-note', p.note));
  return c;
}

/** Name und Serie einer Unit, Seltenheit, NEW: das Schild unter der grossen Karte. */
function plate(p: Prize): HTMLElement {
  const box = h('div', 'rv-plate');
  const r = prizeRarity(p);
  box.append(h('span', `rv-rarity r-${r}`, p.kind === 'unit' ? rarityName(p.rarity) : t('reveal.reward')));
  if (p.kind === 'unit') {
    box.append(h('strong', 'rv-name', unitName(p.unitId)));
    const series = unitSeries(p.unitId);
    if (series) box.append(h('span', 'rv-series', series));
    box.append(h('span', `rv-new${p.isNew ? ' on' : ''}`, p.isNew ? t('summon.new') : t('summon.duplicate')));
  } else {
    box.append(h('strong', 'rv-name', p.kind === 'currency' ? `${p.amount.toLocaleString('en-US')} ${t(`reveal.cur.${p.currency}`)}` : `${p.amount} x ${p.name}`));
  }
  return box;
}

const SOUND: Record<RarityId, UiSoundId> = { rare: 'reveal.rare', epic: 'reveal.epic', legendary: 'reveal.legendary', mythic: 'reveal.mythic', secret: 'reveal.secret', exclusive: 'reveal.exclusive' };
const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const big = (r: RarityId): boolean => r === 'mythic' || r === 'secret';

/** Einzelzug oder 10er-Zug aus dem Backend zeigen (Name bleibt fuer Summon, Smoke und Screenshots). */
export function openReveal(batch: Pick<PullBatchResult, 'pulls'>): Promise<void> {
  return openPrizes(prizesFromPulls(batch.pulls));
}

/** Beliebige Gewinne zeigen (Paket, Belohnung, Kauf). Leere Liste: sofort fertig. */
export function openPrizes(prizes: readonly Prize[], o: RevealOptions = {}): Promise<void> {
  if (prizes.length === 0) return Promise.resolve();
  return new Promise((resolve) => new Reveal(prizes, o, resolve).start());
}

type Phase = 'charge' | 'single' | 'cards' | 'summary';

class Reveal {
  private readonly state: PackState;
  private readonly plan;
  private readonly layer = h('div', 'reveal');
  private readonly stage = h('div', 'rv-stage');
  private readonly spot = h('div', 'rv-spot');
  private readonly flash = h('div', 'rv-flash');
  private readonly bar = h('div', 'rv-bar');
  private readonly hint = h('p', 'rv-hint');
  private readonly counter = h('span', 'rv-count');
  private readonly canvas = h('canvas', 'rv-fx');
  private readonly sparks: Sparks;
  private readonly cards: HTMLButtonElement[] = [];
  private phase: Phase = 'charge';
  private timers: ReturnType<typeof setTimeout>[] = [];
  private spotOpen = false;
  private bulk = false;
  private closed = false;
  private summaryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    prizes: readonly Prize[],
    private readonly o: RevealOptions,
    private readonly done: () => void,
  ) {
    this.state = new PackState(prizes);
    this.plan = chargePlan(this.state.summary().best);
    this.sparks = new Sparks(this.canvas);
  }

  start(): void {
    const L = this.layer;
    L.setAttribute('role', 'dialog');
    L.setAttribute('aria-modal', 'true');
    L.dataset.count = String(this.state.count);
    L.dataset.best = this.plan.best;
    L.dataset.stage = 'rare';
    L.classList.toggle('single', this.state.count === 1);
    const portal = h('div', 'rv-portal');
    portal.append(sigil('rv-ring a'), sigil('rv-ring b'), h('div', 'rv-rift'), h('div', 'rv-orb'), h('div', 'rv-rays'));
    this.spot.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeSpot();
    });
    L.append(h('div', 'rv-bg'), portal, this.canvas, this.stage, this.spot, this.flash, this.counter, this.bar, this.hint);
    L.addEventListener('click', () => this.onBackground());
    document.addEventListener('keydown', this.onKey, true);
    document.body.append(L);
    if (this.o.charge === false) this.afterCharge(false);
    else this.charge();
  }

  // ---- Aufbau ----

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private charge(): void {
    // `window.__uiSlow` (Zeitlupe) nur fuer Screenshots: dehnt den Aufbau, damit Farbstufen einzeln zu fotografieren sind
    const k = (this.o.charge === 'short' ? 0.55 : 1) * (typeof window.__uiSlow === 'number' ? window.__uiSlow : 1);
    const plan = this.plan;
    const total = reduced() ? 400 : Math.round(plan.introMs * k);
    this.layer.dataset.phase = 'charge';
    this.layer.style.setProperty('--intro', `${total}ms`);
    this.setButtons([{ cls: 'rv-skip', text: t('summon.reveal.skip'), run: () => this.skipCharge() }]);
    this.hint.textContent = t('reveal.hint.charge');
    chargeSound(plan.stages.length, total);
    for (const s of plan.stages) {
      this.after(Math.round(s.atMs * k), () => {
        this.layer.dataset.stage = s.rarity;
        this.sparks.converge(s.hue, 34 + plan.stages.indexOf(s) * 14);
      });
    }
    this.after(Math.round(plan.shakeFromMs * k), () => {
      this.layer.classList.add('rumble');
      uiSound('summon.rumble');
    });
    this.after(total, () => this.afterCharge(true));
  }

  private skipCharge(): void {
    if (this.phase !== 'charge') return;
    this.clearTimers();
    this.layer.dataset.stage = this.plan.best;
    this.afterCharge(true);
  }

  private afterCharge(withBurst: boolean): void {
    if (this.phase !== 'charge' || this.closed) return;
    this.layer.classList.remove('rumble');
    this.layer.dataset.stage = this.plan.best;
    if (withBurst) {
      const best = this.plan.best;
      this.flashGo(best);
      uiSound('summon.burst');
      if (best === 'mythic') uiSound('stinger.mythic');
      if (best === 'secret') uiSound('stinger.secret');
      this.sparks.burst(REVEAL_HUE[best], big(best) ? 160 : 90, big(best) ? 9 : 6);
      if (big(best)) this.shake();
    }
    if (this.state.count === 1) this.showSingle();
    else this.showCards();
  }

  // ---- Ein Gewinn ----

  private showSingle(): void {
    this.phase = 'single';
    this.layer.dataset.phase = 'single';
    this.state.revealAll();
    const p = this.state.items[0]!;
    const hero = h('div', 'rv-hero');
    hero.dataset.rarity = prizeRarity(p);
    hero.append(prizeFace(p, true), plate(p));
    this.stage.replaceChildren(hero);
    this.announce(p, 260);
    this.setButtons([{ cls: 'primary reveal-done', text: t('summon.reveal.done'), run: () => this.close() }]);
    this.hint.textContent = '';
    this.layer.dataset.revealed = '1';
  }

  /** Ton, Funken, NEW und Glitzer zu einem aufgedeckten Gewinn. */
  private announce(p: Prize, delay = 0, at?: { x: number; y: number }, quiet = false): void {
    const r = prizeRarity(p);
    const hue = REVEAL_HUE[r];
    if (!quiet || r !== 'rare') uiSound(SOUND[r], quiet ? 0.6 : 1);
    if (at) this.sparks.burst(hue, r === 'rare' ? 14 : big(r) ? 70 : 34, r === 'rare' ? 2.4 : 4, at);
    if (p.kind === 'unit' && p.isNew) this.after(delay + 180, () => uiSound('reveal.new', quiet ? 0.5 : 1));
    if (p.kind === 'unit' && p.shiny) this.after(delay + 120, () => {
      uiSound('reveal.shiny');
      this.sparks.glitter(at);
    });
  }

  // ---- Verdeckte Karten ----

  private showCards(): void {
    this.phase = 'cards';
    this.layer.dataset.phase = 'cards';
    const grid = h('div', 'rv-grid');
    const n = this.state.count;
    const shape = gridShape(n);
    grid.style.setProperty('--cols', String(shape.cols));
    grid.style.setProperty('--rows', String(shape.rows));
    grid.dataset.count = String(n);
    this.state.items.forEach((p, i) => {
      const c = h('button', `pk-card r-${prizeRarity(p)}${isSpotlight(p) ? ' tease' : ''}`);
      c.type = 'button';
      c.dataset.sfx = 'none';
      c.dataset.index = String(i);
      c.dataset.kind = p.kind;
      c.setAttribute('aria-label', t('reveal.card', { n: i + 1 }));
      c.style.setProperty('--i', String(i));
      const inner = h('div', 'pk-inner');
      const back = h('div', 'pk-back');
      back.append(sigil('pk-sigil'), h('span', 'pk-q', '?'));
      const front = h('div', 'pk-front');
      front.append(prizeFace(p, false));
      inner.append(back, front);
      c.append(inner);
      c.addEventListener('click', (e) => {
        e.stopPropagation();
        this.flip(i, false);
      });
      this.cards.push(c);
      grid.append(c);
    });
    this.stage.replaceChildren(grid);
    this.updateCounter();
    this.hint.textContent = t('reveal.hint.cards');
    this.setButtons([
      { cls: 'rv-all', text: t('reveal.all'), run: () => void this.revealAll() },
      { cls: 'rv-skip', text: t('summon.reveal.skip'), run: () => this.toSummary() },
    ]);
    uiSound('card.flip', 0.6);
  }

  private updateCounter(): void {
    const s = this.state;
    this.counter.textContent = s.allRevealed ? '' : t('reveal.left', { n: s.remaining, total: s.count });
    this.layer.dataset.revealed = String(s.revealedCount);
  }

  private flip(i: number, quiet: boolean): void {
    if (this.phase !== 'cards' || this.spotOpen) return;
    if (!this.state.reveal(i)) return;
    const c = this.cards[i]! as HTMLButtonElement;
    const p = this.state.items[i]!;
    c.classList.add('flipped');
    c.disabled = true;
    uiSound('card.flip', quiet ? 0.6 : 1);
    const rect = c.getBoundingClientRect();
    const at = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    this.announce(p, 0, at, quiet);
    const r = prizeRarity(p);
    if (!quiet && isSpotlight(p)) this.openSpot(p);
    else if (big(r)) this.shake();
    this.updateCounter();
    if (this.state.allRevealed) this.allOpen();
  }

  private async revealAll(): Promise<void> {
    if (this.phase !== 'cards' || this.bulk) return;
    this.closeSpot();
    this.bulk = true;
    const gap = reduced() ? 0 : 110;
    for (let i = 0; i < this.state.count; i++) {
      if (this.phase !== 'cards' || this.closed) break;
      if (this.state.isRevealed(i)) continue;
      this.flip(i, true);
      if (gap) await new Promise((r) => setTimeout(r, gap));
    }
    this.bulk = false;
  }

  private allOpen(): void {
    this.hint.textContent = t('reveal.hint.done');
    this.setButtons([{ cls: 'primary rv-summary-btn', text: t('reveal.summary'), run: () => this.toSummary() }]);
    if (this.summaryTimer) clearTimeout(this.summaryTimer);
    this.summaryTimer = setTimeout(() => {
      if (!this.spotOpen && this.phase === 'cards') this.toSummary();
    }, 1600);
  }

  // ---- Rampenlicht ----

  private openSpot(p: Prize): void {
    const r = prizeRarity(p);
    this.spotOpen = true;
    this.spot.dataset.rarity = r;
    this.spot.replaceChildren(prizeFace(p, true), plate(p), h('span', 'rv-spot-hint', t('reveal.hint.spot')));
    this.spot.classList.remove('in');
    void this.spot.offsetWidth;
    this.spot.classList.add('in');
    this.flashGo(r);
    if (big(r)) {
      uiSound(r === 'secret' ? 'stinger.secret' : 'stinger.mythic', 0.8);
      this.shake();
    }
    this.sparks.burst(REVEAL_HUE[r], big(r) ? 120 : 60, big(r) ? 8 : 5);
  }

  private closeSpot(): void {
    if (!this.spotOpen) return;
    this.spotOpen = false;
    this.spot.classList.remove('in');
    this.spot.replaceChildren();
    if (this.state.allRevealed) this.allOpen();
  }

  // ---- Uebersicht ----

  private toSummary(): void {
    if (this.phase === 'summary' || this.closed) return;
    if (this.summaryTimer) clearTimeout(this.summaryTimer);
    this.clearTimers();
    this.spotOpen = false;
    this.spot.classList.remove('in');
    this.spot.replaceChildren();
    this.layer.classList.remove('rumble');
    this.state.revealAll();
    if (this.state.count === 1) {
      if (this.phase === 'charge') this.layer.dataset.stage = this.plan.best;
      this.phase = 'charge';
      this.showSingle();
      return;
    }
    this.phase = 'summary';
    this.layer.dataset.phase = 'summary';
    this.layer.dataset.revealed = String(this.state.count);
    this.counter.textContent = '';
    const s = this.state.summary();
    const box = h('div', 'rv-summary');
    const head = h('div', 'rv-sum-head');
    head.append(h('h2', 'rv-sum-title', this.o.title ?? t('reveal.summary.title')));
    const chips = h('div', 'rv-sum-chips');
    chips.append(h('span', 'rv-chip', t('reveal.summary.total', { n: s.total })));
    if (s.newUnits > 0) chips.append(h('span', 'rv-chip new', t('reveal.summary.new', { n: s.newUnits })));
    for (const [r, n] of Object.entries(s.byRarity)) chips.append(h('span', `rv-chip r-${r}`, `${n} x ${rarityName(r)}`));
    head.append(chips);
    const grid = h('div', 'rv-sum-grid');
    const n = this.state.count;
    const shape = gridShape(n);
    grid.style.setProperty('--cols', String(shape.cols));
    grid.style.setProperty('--rows', String(shape.rows));
    this.state.items.forEach((p, i) => {
      const cell = h('div', `rv-sum-cell r-${prizeRarity(p)}`);
      cell.style.setProperty('--i', String(i));
      cell.dataset.kind = p.kind;
      cell.append(prizeFace(p, false));
      grid.append(cell);
    });
    box.append(head, grid);
    this.stage.replaceChildren(box);
    this.hint.textContent = t('reveal.hint.summary');
    this.setButtons([{ cls: 'primary reveal-done', text: t('reveal.done'), run: () => this.close() }]);
    uiSound('reveal.done');
  }

  // ---- Bedienung ----

  private setButtons(list: { cls: string; text: string; run: () => void }[]): void {
    this.bar.replaceChildren();
    for (const b of list) {
      const el = h('button', `btn ${b.cls}`, b.text);
      el.type = 'button';
      el.dataset.sfx = 'none';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        uiSound('ui.click');
        b.run();
      });
      this.bar.append(el);
    }
    (this.bar.querySelector('.primary') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  }

  private onBackground(): void {
    if (this.phase === 'charge') this.skipCharge();
    else if (this.spotOpen) this.closeSpot();
  }

  private readonly onKey = (e: KeyboardEvent): void => {
    if (this.closed) return;
    const k = e.key;
    let used = true;
    if (k === 'Escape') {
      if (this.phase === 'summary' || this.phase === 'single') this.close();
      else this.toSummary();
    } else if (k === ' ' || k === 'Enter') {
      if (this.phase === 'charge') this.skipCharge();
      else if (this.spotOpen) this.closeSpot();
      else if (this.phase === 'cards') {
        if (this.state.allRevealed) this.toSummary();
        else {
          const i = this.state.items.findIndex((_, j) => !this.state.isRevealed(j));
          if (i >= 0) this.flip(i, false);
        }
      } else this.close();
    } else if (k === 'a' || k === 'A') {
      if (this.phase === 'cards') void this.revealAll();
      else used = false;
    } else used = false;
    if (used) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private flashGo(r: RarityId): void {
    this.flash.dataset.rarity = r;
    this.flash.classList.remove('go');
    void this.flash.offsetWidth;
    this.flash.classList.add('go');
  }

  private shake(): void {
    if (reduced()) return;
    this.layer.classList.remove('shake');
    void this.layer.offsetWidth;
    this.layer.classList.add('shake');
    this.after(650, () => this.layer.classList.remove('shake'));
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    this.clearTimers();
    if (this.summaryTimer) clearTimeout(this.summaryTimer);
    document.removeEventListener('keydown', this.onKey, true);
    this.layer.remove();
    this.done();
  }
}

declare global {
  interface Window {
    /** Debug-Zugriff (Screenshots, Playwright): Animation mit frei gewaehltem Ergebnis zeigen. Rechnet nichts, buchbar ist nichts. */
    /** Zeitlupe fuer den Aufbau (Faktor, nur Screenshots) */
    __uiSlow?: number;
    __ui?: { openReveal: typeof openReveal; openPrizes: typeof openPrizes; backend: typeof getBackend; celebrate: typeof celebrate };
  }
}
window.__ui = { openReveal, openPrizes, backend: getBackend, celebrate };
