/**
 * Summon (Gacha): Banner-Auswahl, Ratentabelle IMMER sichtbar (kein Aufklappen), Pity-Zaehler auch auf dem Knopf, 1er-/10er-Zug,
 * Enthuellung je Seltenheit (CSS, ueberspringbar per Klick oder Esc), Ziehungsverlauf. Alle Zahlen und Saetze kommen aus `bannerViews()`;
 * die UI rechnet nichts. Besitzer: P4.
 */
import { getBackend } from '../backend';
import type { BannerView, HistoryEntry, PullBatchResult } from '../backend/meta';
import { t } from '../i18n/t';
import { clear, h } from './dom';
import { notify } from './flash';
import { metaFrame, newKey, type MetaFrame } from './meta-ui';
import { errorText, pullOptions, rarityName, revealDuration, revealStyle, selectableBanners, unitName } from './meta-model';
import type { Nav } from './nav';
import { portrait } from './portrait';

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
  private readonly history = h('div', 'history');

  constructor(
    private readonly f: MetaFrame,
    private readonly nav: Nav,
  ) {
    const left = h('div', 'summon-main');
    left.append(this.info);
    const right = h('div', 'summon-side');
    right.append(h('h2', undefined, t('summon.history')), this.history);
    const top = h('div', 'summon-top');
    top.append(this.tabs, this.pullRow);
    const cols = h('div', 'summon-cols');
    cols.append(left, right);
    f.body.append(top, cols);
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
      b.append(h('strong', undefined, opt.text), h('span', 'pull-cost', t('summon.cost', { n: opt.cost })));
      b.addEventListener('click', () => void this.pull(v, opt.count));
      this.pullRow.append(b);
    }
    if (v.limits) this.pullRow.append(h('span', 'muted pull-limit', t('summon.limit', { left: v.limits.remaining })));
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

/** Linke Spalte: Hinweise, Pity-Zaehler, Ratentabelle, Regeln, Erwartungswerte. Alles aus dem `BannerView`. */
function bannerInfo(v: BannerView): HTMLElement[] {
  const out: HTMLElement[] = [];
  if (v.startValuesNotice) out.push(h('p', 'notice start-values', v.startValuesNotice));
  for (const p of v.pity) {
    const row = h('div', `pity-row pity-${p.kind}`);
    const bar = h('div', 'bar pitybar');
    const fill = h('div', 'bar-fill pity');
    fill.style.width = `${Math.min(100, Math.round((p.current * 100) / p.hardAt))}%`;
    bar.append(fill);
    row.append(h('span', 'pity-text', p.text), bar);
    out.push(row);
  }

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
      const td = h('td', undefined, tier.units.map((u) => `${unitName(u.unitId)} ${u.baseText}${u.featured ? ` (${t('summon.featured')})` : ''}`).join(' · '));
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

// ---- Enthuellung -----------------------------------------------------------------------------------------------------

/**
 * Enthuellung der Karten, kurz (CSS-Animation, ca. 1-2 s). Ein Klick oder Esc ueberspringt zum Ende, danach schliesst "Continue", Klick oder Esc.
 * Ergebnis steht beim Zeigen schon fest; die Animation aendert nichts mehr.
 */
export function openReveal(batch: Pick<PullBatchResult, 'pulls'>): Promise<void> {
  return new Promise((resolve) => {
    const pulls = batch.pulls;
    const layer = h('div', `reveal${pulls.length === 1 ? ' single' : ''}`);
    layer.setAttribute('role', 'dialog');
    layer.dataset.count = String(pulls.length);
    const cards = h('div', 'reveal-cards');
    let at = 0;
    for (const p of pulls) {
      const st = revealStyle(p.rarity);
      const card = h('div', `reveal-card ${st.cls}`);
      card.dataset.rarity = p.rarity;
      card.dataset.unit = p.unitId;
      card.style.animationDelay = `${at}ms`;
      card.append(portrait(p.unitId, pulls.length === 1 ? 128 : 64), h('strong', 'rc-name', unitName(p.unitId)), h('span', 'rc-rarity', rarityName(p.rarity)), h('span', `rc-tag${p.isNew ? ' new' : ''}`, p.isNew ? t('summon.new') : t('summon.duplicate')));
      if (st.flashMs > 0) {
        const fl = h('div', `reveal-flash ${st.cls}`);
        fl.style.animationDelay = `${at}ms`;
        layer.append(fl);
      }
      cards.append(card);
      at += st.stepMs;
    }
    const done = h('button', 'btn primary reveal-done', t('summon.reveal.skip'));
    done.type = 'button';
    layer.append(cards, done);

    let finished = false;
    let closableAt = 0;
    const timer = setTimeout(() => finish(false), revealDuration(pulls.map((p) => p.rarity)));
    const finish = (skipped: boolean): void => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      layer.classList.add('finished');
      if (skipped) {
        layer.classList.add('skipped');
        closableAt = Date.now() + 300; // Doppelklick soll nicht gleich zumachen
      }
      done.textContent = t('summon.reveal.done');
    };
    const close = (): void => {
      document.removeEventListener('keydown', onKey, true);
      clearTimeout(timer);
      layer.remove();
      resolve();
    };
    const step = (): void => {
      if (!finished) finish(true);
      else if (Date.now() >= closableAt) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      step();
    };
    document.addEventListener('keydown', onKey, true);
    layer.addEventListener('click', step);
    document.body.append(layer);
    done.focus();
  });
}
