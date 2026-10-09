/**
 * Rechte Leiste mit Reitern (Runde 12): Towers (wie bisher, baut `match.ts`), Powers (Inventar), Wave (Vorschau der Runde).
 * Logik steckt in `powers/info.ts` und `powers/wave.ts` (rein); hier nur DOM. Der Match reicht Klicks per Callback durch.
 */
import { MAX_ROUND, type Game, type GameState } from '../sim';
import { t } from '../i18n/t';
import { slotHint, slotUsable, powerSlots, cycleTab, SIDE_TABS, type PowerSlot, type SideTab } from '../powers/info';
import { ENEMY_NAMES, WARNING_TEXT, previewRound, totalEnemies, waveRows, warnings, type Warning } from '../powers/wave';
import { h, setClass } from '../ui/dom';
import { enemySprite, iconPower } from './sprites';
import { baseOf } from '../powers/info';
import { copyCanvas, uiIcon } from './ui-icons';
import type { PowerIconId } from '../pixel/sprites';

export interface SideCallbacks {
  /** Platte angeklickt (der Match entscheidet: sofort einsetzen oder Ziel waehlen) */
  pick(slot: PowerSlot): void;
}

const WARN_ICON: Record<Warning, string> = { camo: 'camo', armor: 'shield', ember: 'flame', boss: 'skull' };

export class SideTabs {
  readonly bar = h('div', 'm-tabs');
  readonly towers = h('div', 'm-pane m-pane-towers');
  readonly powers = h('div', 'm-pane m-pane-powers');
  readonly wave = h('div', 'm-pane m-pane-wave');
  readonly panes = h('div', 'm-panes');
  private btns = new Map<SideTab, HTMLButtonElement>();
  private badge = h('i', 'm-tab-badge num', '');
  tab: SideTab = 'towers';
  /** aktuell gewaehlter (gezielter) Power-Schluessel, hebt die Platte hervor */
  armed: string | null = null;
  private powerSig = '';
  private waveSig = '';

  constructor(private readonly game: Game, private readonly cb: SideCallbacks) {
    for (const id of SIDE_TABS) {
      const b = h('button', 'm-tab');
      b.dataset.tab = id;
      b.append(h('span', '', t(`tab.${id}`)));
      if (id === 'powers') b.append(this.badge);
      b.onclick = () => this.setTab(id);
      this.btns.set(id, b);
      this.bar.append(b);
    }
    this.panes.append(this.towers, this.powers, this.wave);
    this.setTab('towers');
  }

  setTab(id: SideTab): void {
    this.tab = id;
    for (const [k, b] of this.btns) { setClass(b, 'on', k === id); b.setAttribute('aria-selected', String(k === id)); }
    setClass(this.towers, 'hidden', id !== 'towers');
    setClass(this.powers, 'hidden', id !== 'powers');
    setClass(this.wave, 'hidden', id !== 'wave');
    this.powerSig = ''; this.waveSig = '';
    this.update(this.game.state);
  }
  cycle(dir: 1 | -1 = 1): void { this.setTab(cycleTab(this.tab, dir)); }

  slots(st: GameState): PowerSlot[] {
    return powerSlots({ inventory: st.powers, usedRound: st.powerUsedRound, round: st.round, heroPlaced: st.heroPlaced });
  }

  update(st: GameState): void {
    // Zaehler am Reiter: wie viele Powers sind jetzt einsetzbar
    const ready = this.slots(st).filter(slotUsable).length;
    if (this.badge.textContent !== (ready ? String(ready) : '')) this.badge.textContent = ready ? String(ready) : '';
    if (this.tab === 'powers') this.updatePowers(st);
    else if (this.tab === 'wave') this.updateWave(st);
  }

  // ------------------------------------------------------------------ Powers
  private updatePowers(st: GameState): void {
    const slots = this.slots(st);
    const sig = `${this.armed}|` + slots.map((s) => `${s.key}:${s.count}:${s.state}`).join(',');
    if (sig === this.powerSig) return;
    this.powerSig = sig;
    const list = h('div', 'pw-list');
    for (const s of slots) list.append(this.slotEl(s));
    this.powers.replaceChildren(list, h('div', 'pw-foot', t('powers.hint')));
  }

  private slotEl(s: PowerSlot): HTMLElement {
    const b = h('button', `pw-slot st-${s.state}`);
    b.dataset.power = s.key;
    b.dataset.state = s.state;
    if (this.armed === s.key) b.classList.add('armed');
    b.title = s.desc;
    const ic = h('div', 'pw-ic');
    ic.append(copyCanvas(iconPower(baseOf(s.key) as PowerIconId).canvas, 2));
    const txt = h('div', 'pw-t');
    const hint = s.state === 'empty' ? t('powers.empty') : s.state === 'used' ? t('powers.used') : s.state === 'needhero' ? t('powers.needHero') : slotHint(s);
    txt.append(h('div', 'pw-n', s.name), h('div', 'pw-h', hint));
    const cnt = h('div', 'pw-count num', s.state === 'empty' ? '0' : `x${s.count}`);
    b.append(ic, txt, cnt);
    b.onclick = () => this.cb.pick(s);
    return b;
  }

  // ------------------------------------------------------------------ Wave
  private updateWave(st: GameState): void {
    const r = previewRound(st.phase, st.round, MAX_ROUND);
    const sig = `${r}|${st.phase}`;
    if (sig === this.waveSig) return;
    this.waveSig = sig;
    const box = h('div', 'wv');
    const pv = r == null ? null : this.game.roundPreview(r);
    if (!pv) {
      box.append(h('div', 'wv-none', t('wave.none')));
      this.wave.replaceChildren(box);
      return;
    }
    const head = h('div', 'wv-head');
    head.append(h('div', 'wv-title', t('wave.title', { n: pv.round })), h('div', 'wv-sub', st.phase === 'wave' ? t('wave.now') : t('wave.next')));
    const warns = h('div', 'wv-warns');
    for (const w of warnings(pv)) {
      const c = h('div', `wv-warn w-${w}`);
      c.title = WARNING_TEXT[w].tip;
      c.append(uiIcon(WARN_ICON[w], 2), h('span', '', WARNING_TEXT[w].name));
      warns.append(c);
    }
    const list = h('div', 'wv-list');
    for (const row of waveRows(pv)) {
      const e = h('div', `wv-row${row.camo ? ' camo' : ''}`);
      e.dataset.type = row.type;
      const art = h('div', 'wv-art');
      art.append(copyCanvas(enemySprite(row.type, 0, { camo: row.camo }).canvas, row.type === 'leviathan' ? 1 : 2));
      const nm = h('div', 'wv-name', ENEMY_NAMES[row.type] ?? row.type);
      if (row.camo) nm.append(h('span', 'wv-tag', ' camo'));
      e.append(art, nm, h('div', 'wv-n num', `x${row.n}`));
      list.append(e);
    }
    const foot = h('div', 'wv-foot');
    foot.append(h('span', '', t('wave.foes', { n: totalEnemies(pv) })), h('span', 'wv-rbe', `${t('wave.rbe')} `), h('b', 'num', String(pv.rbe)));
    box.append(head, warns, list, foot);
    this.wave.replaceChildren(box);
  }
}
