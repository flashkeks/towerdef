/**
 * DOM-Oberflaeche ueber dem Canvas: HUD, Auswahlleiste, Wellenvorschau, Risikokarten, Unit-Panel, Boss-Banner,
 * Start- und Endbildschirm. Zeigt nur an und leitet Klicks an die Session weiter.
 */
import { t } from '../i18n/t';
import { SPEEDS, type Session } from '../game/session';
import type { DifficultyId, UnitDef, WavePreview } from '../sim';
import { abilitySeconds, compactNumber, hudModel, previewModel, sellPreview, unitColor } from '../view/model';
import { telegraphSecondsLeft } from '../view/telegraph';
import { clear, h, setClass, setText } from './dom';

const DIFFICULTIES: readonly DifficultyId[] = ['normal', 'hard', 'nightmare'];
const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

export interface UiHandlers {
  onStart(d: DifficultyId): void;
  onMenu(): void;
}

export class Ui {
  readonly boardWrap = h('div', 'boardwrap');
  private readonly slotLayer = h('div', 'slots');
  private readonly root: HTMLElement;
  // HUD
  private livesFill = h('div', 'bar-fill lives');
  private livesText = h('span', 'val');
  private coinsText = h('span', 'val coins');
  private waveText = h('span', 'val');
  private countdownText = h('span', 'sub');
  private startBtn = h('button', 'btn primary start');
  private pauseBtn = h('button', 'btn pause');
  private speedBtns: HTMLButtonElement[] = [];
  private diffText = h('span', 'sub');
  // Bereiche
  private side = h('aside', 'side');
  private previewBox = h('section', 'panel preview');
  private cardsBox = h('section', 'panel cards');
  private unitBox = h('section', 'panel unitpanel');
  private shop = h('footer', 'shop');
  private shopHint = h('div', 'hint');
  private shopBtns = new Map<string, HTMLButtonElement>();
  private banner = h('div', 'boss-banner hidden');
  private bannerName = h('div', 'name');
  private bannerBar = h('div', 'bar-fill boss');
  private bannerLine = h('div', 'line');
  private toastEl = h('div', 'toast hidden');
  private pausedEl = h('div', 'paused hidden');
  private overlay = h('div', 'overlay hidden');
  private slotBtns: HTMLButtonElement[] = [];
  private session: Session | null = null;
  private sigs = { preview: '', cards: '', unit: '' };
  private tile = 0;
  private slotsTile = 0;

  constructor(root: HTMLElement, private readonly handlers: UiHandlers) {
    this.root = root;
    clear(root);
    root.classList.add('game');
    root.append(this.buildHud(), this.buildMain(), this.shop, this.overlay);
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  // ---- Aufbau --------------------------------------------------------------------------------------------------

  private buildHud(): HTMLElement {
    const bar = h('header', 'hud');
    const lives = h('div', 'stat lives');
    lives.append(h('span', 'lbl', t('hud.lives')), h('div', 'bar', undefined), this.livesText);
    lives.querySelector('.bar')?.append(this.livesFill);
    const coins = h('div', 'stat');
    coins.append(h('span', 'lbl', t('hud.coins')), this.coinsText);
    const wave = h('div', 'stat wave');
    wave.append(this.waveText, this.countdownText);
    this.startBtn.addEventListener('click', () => this.session?.startNextWave());
    this.pauseBtn.addEventListener('click', () => this.session?.togglePause());
    const speeds = h('div', 'speeds');
    for (const s of SPEEDS) {
      const b = h('button', 'btn speed', t('hud.speed', { n: s }));
      b.dataset.speed = String(s);
      b.addEventListener('click', () => this.session?.setSpeed(s));
      this.speedBtns.push(b);
      speeds.append(b);
    }
    bar.append(lives, coins, wave, this.startBtn, this.pauseBtn, speeds, this.diffText);
    return bar;
  }

  private buildMain(): HTMLElement {
    const main = h('main', 'main');
    this.bannerName.className = 'name';
    const barWrap = h('div', 'bar');
    barWrap.append(this.bannerBar);
    this.banner.append(this.bannerName, barWrap, this.bannerLine);
    this.boardWrap.append(this.slotLayer, this.banner, this.toastEl, this.pausedEl);
    this.pausedEl.textContent = t('hud.paused');
    this.side.append(this.previewBox, this.cardsBox, this.unitBox);
    main.append(this.boardWrap, this.side);
    return main;
  }

  /** Neue Runde: Slots, Shop und Panels aufbauen. */
  bind(session: Session): void {
    this.session = session;
    this.sigs = { preview: '', cards: '', unit: '' };
    this.overlay.classList.add('hidden');
    // Slots
    clear(this.slotLayer);
    this.slotBtns = [];
    for (const s of session.sim.slots()) {
      const b = h('button', `slot ${s.kind} size${s.size}`);
      b.dataset.slot = String(s.id);
      b.type = 'button';
      b.addEventListener('click', () => session.clickSlot(s.id));
      this.slotLayer.append(b);
      this.slotBtns.push(b);
    }
    this.slotsTile = 0;
    // Shop
    clear(this.shop);
    this.shopBtns.clear();
    const list = h('div', 'shop-list');
    session.sim.catalog().forEach((d, i) => list.append(this.shopButton(session, d, i)));
    this.shop.append(h('div', 'shop-title', t('shop.title')), list, this.shopHint);
    this.diffText.textContent = t('hud.difficulty', { name: t(`difficulty.${session.difficulty}`) });
  }

  private shopButton(session: Session, d: UnitDef, index: number): HTMLButtonElement {
    const b = h('button', 'unit-btn');
    b.type = 'button';
    b.dataset.unit = d.id;
    b.title = `${t(`rarity.${d.rarity}`)} - ${t(`placement.${d.placement}`)}`;
    const badge = h('span', 'badge', t(`unit.${d.id}.abbr`));
    badge.style.background = css(unitColor(d.id));
    b.append(h('span', 'key', String(index + 1)), badge, h('span', 'uname', t(`unit.${d.id}.name`)), h('span', 'ucost', String(d.placeCost)));
    b.addEventListener('click', () => session.choosePlacing(d.id));
    this.shopBtns.set(d.id, b);
    return b;
  }

  // ---- Tastatur ------------------------------------------------------------------------------------------------

  private onKey(e: KeyboardEvent): void {
    const s = this.session;
    if (!s || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') s.cancel();
    else if (e.key === ' ') {
      e.preventDefault();
      s.togglePause();
    } else if (e.key === 'n' || e.key === 'N') s.startNextWave();
    else if (/^[1-9]$/.test(e.key)) {
      const d = s.sim.catalog()[Number(e.key) - 1];
      if (d) s.choosePlacing(d.id);
    }
  }

  // ---- Start und Ende ------------------------------------------------------------------------------------------

  showStart(): void {
    this.session = null;
    clear(this.overlay);
    const box = h('div', 'dialog start');
    box.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('start.tagline')), h('h2', undefined, t('start.pick')));
    const row = h('div', 'diff-row');
    for (const d of DIFFICULTIES) {
      const b = h('button', `btn diff ${d}`);
      b.dataset.difficulty = d;
      b.append(h('strong', undefined, t(`difficulty.${d}`)), h('span', undefined, t(`difficulty.${d}.desc`)));
      b.addEventListener('click', () => this.handlers.onStart(d));
      row.append(b);
    }
    box.append(row);
    this.overlay.append(box);
    this.overlay.classList.remove('hidden');
  }

  private showEnd(s: Session): void {
    const win = s.sim.state.result === 'win';
    clear(this.overlay);
    const box = h('div', `dialog end ${win ? 'win' : 'loss'}`);
    box.append(
      h('h1', 'title', t(win ? 'end.win' : 'end.loss')),
      h('p', 'tagline', t(win ? 'end.win.text' : 'end.loss.text')),
      h('p', 'stats', t('end.stats', { wave: s.sim.state.wave, total: s.totalWaves, lives: s.sim.state.lives })),
    );
    const row = h('div', 'diff-row');
    const again = h('button', 'btn primary restart', t('end.restart'));
    again.addEventListener('click', () => this.handlers.onStart(s.difficulty));
    const change = h('button', 'btn menu', t('end.change'));
    change.addEventListener('click', () => this.handlers.onMenu());
    row.append(again, change);
    box.append(row);
    this.overlay.append(box);
    this.overlay.classList.remove('hidden');
  }

  // ---- Frame ---------------------------------------------------------------------------------------------------

  /** `tile` = aktuelle Tile-Groesse des Renderers (fuer die Slot-Buttons). */
  update(s: Session, tile: number): void {
    const st = s.sim.state;
    const hud = hudModel(st, s.totalWaves, s.waveTimerTicks);
    setText(this.livesText, `${hud.lives} / ${hud.maxLives}`);
    this.livesFill.style.width = `${Math.round(hud.livesRatio * 100)}%`;
    setClass(this.livesFill, 'low', hud.livesRatio < 0.3);
    setText(this.coinsText, String(hud.coins));
    setText(this.waveText, hud.wave === 0 ? t('hud.prep') : t('hud.wave', { wave: hud.wave, total: hud.totalWaves }));
    setText(this.countdownText, hud.countdownSeconds !== null ? t('hud.countdown', { s: hud.countdownSeconds }) : hud.finalWave ? t('hud.lastWave') : '');
    setText(this.startBtn, hud.nextWave !== null ? t('hud.startWave', { n: hud.nextWave }) : t('hud.lastWave'));
    this.startBtn.disabled = !hud.canStartWave;
    setText(this.pauseBtn, s.paused ? t('hud.resume') : t('hud.pause'));
    this.speedBtns.forEach((b) => setClass(b, 'active', b.dataset.speed === String(s.speed)));
    setClass(this.pausedEl, 'hidden', !s.paused);

    this.updateShop(s);
    this.updateSlots(s, tile);
    this.updatePreview(s, hud.nextWave);
    this.updateCards(s, hud.nextWave);
    this.updateUnitPanel(s);
    this.updateBanner(s);

    const now = performance.now();
    if (s.toast && s.toast.until > now) {
      setText(this.toastEl, t(s.toast.key));
      this.toastEl.classList.remove('hidden');
    } else this.toastEl.classList.add('hidden');

    if (s.over && this.overlay.classList.contains('hidden')) this.showEnd(s);
  }

  private updateShop(s: Session): void {
    const coins = s.sim.state.players[0]?.coins ?? 0;
    for (const d of s.sim.catalog()) {
      const b = this.shopBtns.get(d.id);
      if (!b) continue;
      setClass(b, 'active', s.placing === d.id);
      setClass(b, 'poor', coins < s.sim.placeCost(d.id));
    }
    setText(this.shopHint, s.placing ? t('shop.hint.place', { name: t(`unit.${s.placing}.name`) }) : t('shop.hint.idle'));
  }

  private updateSlots(s: Session, tile: number): void {
    if (tile !== this.slotsTile) {
      this.slotsTile = tile;
      this.boardWrap.style.width = `${17 * tile}px`;
      this.boardWrap.style.height = `${11 * tile}px`;
      this.boardWrap.style.setProperty('--tile', `${tile}px`);
      s.sim.slots().forEach((slot, i) => {
        const b = this.slotBtns[i];
        if (!b) return;
        const size = slot.size * tile * 0.92;
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        // sim.slots() liefert Festkomma (1000 = eine Kachel), nicht Kacheln wie stage.slots im Renderer.
        b.style.left = `${(slot.x / 1000 + 0.5) * tile - size / 2}px`;
        b.style.top = `${(slot.y / 1000 + 0.5) * tile - size / 2}px`;
      });
    }
    const slots = s.sim.slots();
    slots.forEach((slot, i) => {
      const b = this.slotBtns[i];
      if (!b) return;
      setClass(b, 'free', slot.free && s.placing !== null);
      setClass(b, 'taken', !slot.free);
    });
  }

  private updatePreview(s: Session, nextWave: number | null): void {
    const p: WavePreview | null = nextWave === null ? null : s.nextPreview(nextWave);
    const sig = p ? `${p.wave}|${p.card ?? ''}` : 'none';
    if (sig === this.sigs.preview) return;
    this.sigs.preview = sig;
    clear(this.previewBox);
    if (!p) {
      this.previewBox.append(h('p', 'muted', t('preview.none')));
      return;
    }
    const m = previewModel(p);
    this.previewBox.append(h('h3', undefined, t('preview.title', { n: m.wave })));
    if (m.boss) this.previewBox.append(h('div', 'tag boss', t('preview.boss')));
    else if (m.elite) this.previewBox.append(h('div', 'tag elite', t('preview.elite')));
    const ul = h('ul', 'rows');
    for (const r of m.rows) {
      const li = h('li');
      li.append(h('span', 'cnt', t('preview.group', { count: r.count, name: t(`enemy.${r.type}.name`) })));
      const extras: string[] = r.modifiers.map((x) => t(x.key, x.params));
      if (r.flying) extras.push(t('preview.flying'));
      if (r.element > 0) extras.push(t('preview.element', { n: r.element }));
      if (extras.length) li.append(h('span', 'mods', extras.join(', ')));
      ul.append(li);
    }
    this.previewBox.append(ul, h('p', 'total', t('preview.total', { count: m.enemyCount, hp: compactNumber(m.totalHp) })));
    if (m.bossKit) {
      this.previewBox.append(h('p', 'kit', t('preview.bossKit', { name: t(`boss.kit.${m.bossKit.id}`), phases: m.bossKit.phases })));
      if (m.bossKit.abilities.length) this.previewBox.append(h('p', 'kit', t('preview.abilities', { list: m.bossKit.abilities.map((a) => t(`boss.ability.${a}`)).join(', ') })));
    }
  }

  private updateCards(s: Session, nextWave: number | null): void {
    const p = nextWave === null ? null : s.nextPreview(nextWave);
    const cur = s.sim.state.nextCard;
    const sig = `${nextWave}|${p?.cardAllowed ?? false}|${cur ?? ''}`;
    if (sig === this.sigs.cards) return;
    this.sigs.cards = sig;
    clear(this.cardsBox);
    this.cardsBox.append(h('h3', undefined, t('cards.title')));
    if (!p) return;
    if (!p.cardAllowed) {
      this.cardsBox.append(h('p', 'muted', t('cards.blocked')));
      return;
    }
    const none = h('button', 'card none', t('cards.none'));
    none.dataset.card = 'none';
    setClass(none, 'active', cur === null);
    none.addEventListener('click', () => s.chooseCard(null));
    this.cardsBox.append(none);
    for (const c of [...s.sim.cards()].sort((a, b) => a.tier - b.tier)) {
      const b = h('button', `card tier${c.tier}`);
      b.dataset.card = c.id;
      b.append(h('strong', undefined, t(`card.${c.id}.name`)), h('span', undefined, t(`card.${c.id}.text`)));
      setClass(b, 'active', cur === c.id);
      b.addEventListener('click', () => s.chooseCard(cur === c.id ? null : c.id));
      this.cardsBox.append(b);
    }
  }

  private updateUnitPanel(s: Session): void {
    const st = s.sim.state;
    const u = s.selectedUnit === null ? undefined : st.units.find((x) => x.id === s.selectedUnit);
    if (s.selectedUnit !== null && !u) s.selectedUnit = null;
    const coins = st.players[0]?.coins ?? 0;
    const up = u ? s.sim.upgradeCost(u.id) : null;
    const def = u ? s.sim.catalog().find((d) => d.id === u.defId) : undefined;
    const sig = u && def ? `${u.id}|${u.level}|${u.targeting}|${up}|${coins >= (up ?? 0)}|${abilitySeconds(u)}|${u.invested}` : 'none';
    if (sig === this.sigs.unit) return;
    this.sigs.unit = sig;
    clear(this.unitBox);
    if (!u || !def) {
      this.unitBox.append(h('p', 'muted', t('unit.none')));
      return;
    }
    this.unitBox.append(h('h3', undefined, t(`unit.${def.id}.name`)), h('p', undefined, t('unit.level', { n: u.level + 1, max: def.maxLevel + 1 })));
    const upBtn = h('button', 'btn upgrade', up === null ? t('unit.maxed') : t('unit.upgrade', { cost: up }));
    upBtn.disabled = up === null;
    setClass(upBtn, 'poor', up !== null && coins < up);
    upBtn.addEventListener('click', () => s.upgrade());
    const sellBtn = h('button', 'btn sell', t('unit.sell', { value: sellPreview(def, u) }));
    sellBtn.addEventListener('click', () => s.sell());
    this.unitBox.append(upBtn, sellBtn);
    if (def.ability) {
      const cd = abilitySeconds(u);
      const ab = h('button', 'btn ability', cd > 0 ? t('unit.ability.cooldown', { s: cd }) : t('unit.ability'));
      ab.disabled = cd > 0;
      ab.addEventListener('click', () => s.useAbility());
      this.unitBox.append(ab);
    }
    if (def.attack) {
      const tg = h('button', 'btn targeting', t('unit.targeting', { mode: t(`targeting.${u.targeting}`) }));
      tg.addEventListener('click', () => s.cycleTargeting());
      this.unitBox.append(tg);
    }
  }

  private updateBanner(s: Session): void {
    const boss = s.sim.state.enemies.find((e) => e.boss);
    if (!boss) {
      this.banner.classList.add('hidden');
      return;
    }
    this.banner.classList.remove('hidden');
    const tr = s.tracker;
    const tick = s.sim.state.tick;
    const kit = boss.bossRun?.kit;
    const phase = tr.phases.get(boss.id);
    const nameText = kit ? t(`boss.kit.${kit}`) : t('enemy.boss.name');
    setText(this.bannerName, phase ? `${nameText} - ${t('boss.phase', { name: t(`boss.phase.${phase.id}`) })}` : nameText);
    this.bannerBar.style.width = `${Math.round((boss.hp / Math.max(1, boss.maxHp)) * 100)}%`;
    const tl = tr.telegraphs.get(boss.id);
    const win = tr.windows.get(boss.id);
    let line = '';
    let mode = '';
    if (tl) {
      line = t('boss.telegraph', { name: nameText, ability: t(`boss.ability.${tl.ability}`), s: telegraphSecondsLeft(tl, tick).toFixed(1) });
      if (tl.interruptible) line += ` ${t('boss.interrupt')}`;
      mode = 'danger';
    } else if (win) {
      line = t('boss.window', { s: Math.max(0, Math.ceil((win.untilTick - tick) / 2) / 10).toFixed(1) });
      mode = 'chance';
    } else if (tr.wards.has(boss.id)) {
      line = t('boss.ward');
      mode = 'ward';
    }
    setText(this.bannerLine, line);
    this.bannerLine.dataset.mode = mode;
    this.banner.dataset.mode = mode;
  }
}
