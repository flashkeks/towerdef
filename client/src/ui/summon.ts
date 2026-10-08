/**
 * Summon (Gacha): Banner-Auswahl, Ratentabelle IMMER sichtbar (kein Aufklappen), Pity-Zaehler auch auf dem Knopf, 1er-/10er-Zug,
 * Enthuellung je Seltenheit (CSS, ueberspringbar per Klick oder Esc), Ziehungsverlauf. Alle Zahlen und Saetze kommen aus `bannerViews()`;
 * die UI rechnet nichts. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { BannerView, HistoryEntry } from '../backend/meta';
import { t } from '../i18n/t';
import { clear, h } from './dom';
import { notify } from './flash';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import { errorText, pullOptions, rarityName, selectableBanners, unitName, unitSeries } from './meta-model';
import type { Nav } from './nav';
import { openReveal } from './reveal';
import { backdrop, icon, panel, portraitCard, sigil } from './kit';
import { unitMeta } from './unit-card';

const HISTORY_SHOWN = 20;

export function buildSummon(nav: Nav): HTMLElement {
  const f = metaFrame('summon', 'summon.title', nav);
  const state = new SummonScreen(f, nav);
  void state.load();
  return f.box;
}

class SummonScreen {
  private views: BannerView[] = [];
  private selected: string | null = null;
  private busy = false;
  private readonly tabs = h('div', 'banner-tabs');
  private readonly pullRow = h('div', 'pull-row');
  private readonly info = h('div', 'banner-info');
  private readonly art = h('div', 'banner-art');
  private readonly pityBox = h('div', 'pity-box');
  private readonly history = h('div', 'history');

  constructor(
    private readonly f: MetaFrame,
    private readonly nav: Nav,
  ) {
    const left = h('section', 'summon-main kp corners violet');
    left.append(backdrop('summon'), this.tabs, this.art, this.pityBox, this.pullRow);
    const right = h('div', 'summon-side');
    const rates = panel({ tone: 'gold', cls: 'rates-panel', tag: 'div' });
    rates.body.append(this.info);
    const hist = panel({ title: t('summon.history'), tone: 'aether', cls: 'history-panel', tag: 'div' });
    hist.body.append(this.history);
    right.append(rates, hist);
    const cols = h('div', 'summon-cols');
    cols.append(left, right);
    f.body.append(cols);
  }

  /** Banner und Verlauf holen und alles neu zeichnen. */
  async load(): Promise<void> {
    const r = await getBackend().bannerViews();
    if (!r.ok) {
      this.f.body.replaceChildren(h('p', 'warn', errorText(r)));
      return;
    }
    this.views = selectableBanners(r.views);
    if (!this.views.some((v) => v.bannerId === this.selected)) this.selected = this.views[0]?.bannerId ?? null;
    this.render();
    await Promise.all([this.loadHistory(), this.f.refreshWallet()]);
  }

  private async loadHistory(): Promise<void> {
    const r = await getBackend().pullHistory(HISTORY_SHOWN);
    clear(this.history);
    if (!r.ok || r.history.length === 0) {
      this.history.append(h('p', 'muted', t('summon.history.empty')));
      return;
    }
    this.history.append(...r.history.map(historyChip));
  }

  private get view(): BannerView | null {
    return this.views.find((v) => v.bannerId === this.selected) ?? null;
  }

  private render(): void {
    clear(this.tabs);
    clear(this.pullRow);
    clear(this.info);
    clear(this.art);
    clear(this.pityBox);
    if (this.views.length === 0) {
      this.info.append(h('p', 'muted', t('summon.none')));
      return;
    }
    for (const v of this.views) {
      const b = h('button', `btn banner-tab${v.bannerId === this.selected ? ' active' : ''}`, v.name);
      b.type = 'button';
      b.dataset.banner = v.bannerId;
      b.disabled = this.busy;
      b.addEventListener('click', () => {
        if (this.busy) return;
        this.selected = v.bannerId;
        this.render();
      });
      this.tabs.append(b);
    }
    const v = this.view;
    if (!v) return;
    for (const opt of pullOptions(v)) {
      const b = h('button', `btn pull-btn${opt.count === 10 ? ' primary' : ''}`);
      b.type = 'button';
      b.dataset.count = String(opt.count);
      b.disabled = this.busy;
      const cost = h('span', 'pull-cost');
      cost.append(icon('crystal'), t('summon.cost', { n: opt.cost }));
      b.append(h('strong', undefined, opt.text), cost);
      b.addEventListener('click', () => void this.pull(v, opt.count));
      this.pullRow.append(b);
    }
    if (v.limits) this.pullRow.append(h('span', 'muted pull-limit', t('summon.limit', { left: v.limits.remaining })));
    this.art.append(...bannerArt(v));
    this.pityBox.append(...pityRows(v));
    this.info.append(...bannerInfo(v));
  }

  private setBusy(on: boolean): void {
    this.busy = on;
    this.f.box.querySelectorAll<HTMLButtonElement>('.pull-btn, .banner-tab').forEach((b) => {
      b.disabled = on;
    });
  }

  private async pull(v: BannerView, count: 1 | 10): Promise<void> {
    if (this.busy) return;
    this.setBusy(true);
    const r = await getBackend().pull(v.bannerId, count, newKey());
    if (!r.ok) {
      notify(errorText(r), 'error');
      this.busy = false;
      await this.load(); // Stand neu lesen (z. B. Starter inzwischen verbraucht)
      return;
    }
    const reveal = openReveal(r.pull);
    await this.load();
    this.setBusy(true);
    await reveal;
    this.setBusy(false);
  }
}

function historyChip(e: HistoryEntry): HTMLElement {
  const c = h('span', `hist-item r-${e.rarity}`);
  c.dataset.rarity = e.rarity;
  c.title = `${rarityName(e.rarity)}${e.pityForced ? ` - ${t('summon.history.pity')}` : ''}`;
  c.append(h('span', 'hist-name', unitName(e.unitId)));
  if (e.isNew) c.append(h('span', 'tag-new', t('summon.new')));
  return c;
}

/** Pity-Zaehler mit Balken (Stand und harte Grenze); Pflicht aus Runde 7: immer sichtbar. */
function pityRows(v: BannerView): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const p of v.pity) {
    const row = h('div', `pity-row pity-${p.kind}`);
    const bar = h('div', 'bar pitybar');
    const fill = h('div', 'bar-fill pity');
    fill.style.width = `${Math.min(100, Math.round((p.current * 100) / p.hardAt))}%`;
    bar.append(fill);
    row.append(h('span', 'pity-text', p.text), bar);
    out.push(row);
  }

  return out;
}

/** Banner-Bild: Name in Display-Schrift, Art des Banners, Featured-Units als grosse Karten (Featured zuerst, dann die staerksten der obersten Stufe). */
function bannerArt(v: BannerView): HTMLElement[] {
  const ring = h('div', 'banner-sigil');
  ring.append(sigil());
  const title = h('div', 'banner-title');
  title.append(h('span', 'eyebrow', t(`summon.kind.${v.kind === 'standard' ? 'standard' : 'special'}`)), h('h2', 'banner-name', v.name));
  const ids: { id: string; rarity: string; featured: boolean }[] = [];
  if (v.featured) ids.push({ id: v.featured.unitId, rarity: v.featured.rarity, featured: true });
  for (const tier of [...v.tiers].reverse()) {
    if (!tier.populated) continue;
    for (const u of tier.units) if (!ids.some((x) => x.id === u.unitId)) ids.push({ id: u.unitId, rarity: tier.rarity, featured: u.featured });
    if (ids.length >= 3) break;
  }
  const row = h('div', 'banner-feature');
  ids.slice(0, 3).forEach((x, i) => {
    const m = unitMeta(x.id, x.rarity);
    const c = portraitCard({ unitId: x.id, name: m.name, series: m.series, rarity: x.rarity, elements: m.elements, live: i === 0, tag: 'div', cls: `feat f${i}`, trait: x.featured ? t('summon.featured') : undefined });
    c.querySelector('.pc-sub')?.remove();
    row.append(c);
  });
  return [ring, title, row];
}

/** Rechte Spalte: Hinweise, Pity-Zaehler, Ratentabelle, Regeln, Erwartungswerte. Alles aus dem `BannerView`. */
function bannerInfo(v: BannerView): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (v.startValuesNotice) out.push(h('p', 'notice start-values', v.startValuesNotice));
  const table = h('table', 'rates-table');
  const head = h('tr');
  for (const k of ['rarity', 'rate', 'long', 'next']) head.append(h('th', undefined, t(`summon.rates.${k}`)));
  const thead = h('thead');
  thead.append(head);
  table.append(thead);
  const body = h('tbody');
  for (const tier of v.tiers) {
    const tr = h('tr', `tier r-${tier.rarity}${tier.populated ? '' : ' empty'}`);
    tr.dataset.rarity = tier.rarity;
    tr.append(h('th', undefined, tier.label), h('td', 'base', tier.baseText), h('td', 'eff', tier.effectiveText), h('td', 'next', tier.nextPullText));
    body.append(tr);
    if (tier.units.length > 0) {
      const ur = h('tr', 'tier-units');
      const td = h('td');
      const pool = h('div', 'pool-list');
      for (const u of tier.units) {
        const c = h('span', `pool-chip${u.featured ? ' featured' : ''}`, `${unitName(u.unitId)} ${u.baseText}`);
        c.title = unitSeries(u.unitId);
        pool.append(c);
      }
      td.append(pool);
      td.colSpan = 4;
      ur.append(td);
      body.append(ur);
    }
  }
  table.append(body);
  out.push(h('h2', undefined, t('summon.rates.title')), table);

  out.push(h('p', 'muted rates-version', t('summon.rates.version', { version: v.ratesVersion, hash: v.ratesHash.replace(/^fnv1a64:/, '').slice(0, 8) })));
  const rules = h('ul', 'rules');
  for (const r of v.rules) rules.append(h('li', undefined, r));
  out.push(h('h2', undefined, t('summon.rules.title')), rules);
  if (v.expected.lines.length > 0 || v.notes.length > 0) {
    const ex = h('ul', 'rules expected');
    for (const l of [...v.expected.lines, ...v.notes]) ex.append(h('li', undefined, l));
    out.push(h('h2', undefined, t('summon.expected.title')), ex);
  }
  return out;
}

export { openReveal } from './reveal';
