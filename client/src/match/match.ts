/**
 * Match-Bildschirm (Runde 11 / P3): baut die Oberflaeche, treibt die Sim im Takt (60 Ticks/s x Tempo), reicht Sim-Events an
 * Renderer, Ton und HUD weiter und nimmt Eingaben entgegen. Keine Spielregeln hier: alles entscheidet `Game`.
 * Einstieg fuer die App: `startMatch(root, opts) -> Promise<MatchResult>`.
 */
import { createGame, DATA, MODES, modeAllows, type ModeId, type AbilityId, type PowerKey, type CommandResult, type Difficulty, type Game, type GameOptions, type GameState, type HeroType, type SimEvent, type TargetMode, type Tiers, type TowerType } from '../sim';
import { audio } from '../audio/engine';
import { t } from '../i18n/t';
import { h, setClass, setText } from '../ui/dom';
import { baseRangePx, displayName, footMilli, isHero } from './info';
import { Confirm } from './confirm';
import { Panel, fitFigure } from './panel';
import { SideTabs } from './side-tabs';
import { mapGeometry, type MapGeometry } from './map-info';
import { BOSS_NAMES, isBoss } from './enemy-info';
import type { MapId } from '../pixel/map/maps';
import { displayName as powerName, slotUsable, trapSpot, type PowerSlot } from '../powers/info';
import { UnlockMenu } from './unlock-menu';
import { Renderer } from './renderer';
import { iconUpgrade, iconAbility, heroPortrait, towerPortrait, heroSprite, towerSprite } from './sprites';
import { canWithdraw, cooldownText, marketRadiusPx, rangeView, type RangeView } from './r13';
import { ABILITY_TEXT, HERO_KEY, HERO_TYPES, HOTKEY, ROLE, TOWER_TYPES } from './tower-text';
import { copyCanvas, uiIcon } from './ui-icons';
import { volumeButton } from '../ui/volume';
import './match.css';

export interface StartOptions {
  map?: string;
  /** Spielmodus (Runde 15), Vorgabe Standard */
  mode?: ModeId;
  difficulty: Difficulty;
  seed?: number;
  unlocks?: GameOptions['unlocks'];
  mods?: GameOptions['mods'];
  /** Turm-XP-Konto aus dem Profil (Runde 11b); fehlt = kein XP-System im Match. */
  towerXp?: GameOptions['towerXp'];
  /** Power-Inventar aus dem Profil (Runde 12) */
  powers?: GameOptions['powers'];
  /** Runde 16: gewaehlter Held (Meta `activeHero`), Vorgabe Wren */
  hero?: HeroType;
  /** Text fuer gesperrte Tuerme, z. B. { bombardier: 'Unlocks at level 2' } (P4 liefert die Zahlen) */
  lockInfo?: Partial<Record<TowerType | HeroType, string>>;
  /** nur fuer Pruef-Skripte: Zugriff auf Game/Renderer unter window.__dw */
  debug?: boolean;
}

export interface MatchResult {
  /** Runde 15: Karte, Modus und geschaffte Runden (bei Deflation zaehlt nur ab der Startrunde) */
  map: string;
  mode: ModeId;
  roundsCleared: number;
  /** eindeutige Kennung dieses Laufs (Karte-Schwierigkeit-Seed-Startzeit), z. B. fuer die Meta-Ablage */
  matchId: string;
  won: boolean;
  round: number;
  difficulty: Difficulty;
  seed: number;
  livesLeft: number;
  pops: Record<TowerType | HeroType, number>;
  /** Endkonto Turm-XP (`state.towerXp`), Endstufen (`state.maxTier`) und im Match verdiente XP (`state.towerXpGained`) fuer die Meta */
  towerXp: Record<TowerType, number>;
  towerTiers: Record<TowerType, Tiers>;
  towerXpGained: Record<TowerType, number>;
  /** erfolgreiche Power-Einsaetze (`state.stats.powersUsed`), Meta zieht sie vom Inventar ab */
  powersUsed: Partial<Record<PowerKey, number>>;
  /** jede gekaufte Stufe in Reihenfolge */
  upgrades: { tower: TowerType | HeroType; path: number; tier: number }[];
  ticks: number;
  quit: boolean;
}

const TICKS_PER_S = 60;
const KEYS_ABILITY = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export async function startMatch(root: HTMLElement, opts: StartOptions): Promise<MatchResult> {
  const seed = opts.seed ?? (Math.floor(Math.random() * 2 ** 31) | 0);
  const game = createGame({ map: opts.map ?? 'meadow', mode: opts.mode ?? 'standard', difficulty: opts.difficulty, seed, unlocks: opts.unlocks, towerXp: opts.towerXp, mods: opts.mods, powers: opts.powers, hero: opts.hero });
  const m = new Match(root, game, { ...opts, seed });
  await m.init();
  return m.done;
}

class Match {
  readonly done: Promise<MatchResult>;
  private finish!: (r: MatchResult) => void;
  private readonly r: Renderer;
  private readonly geo: MapGeometry;
  private readonly el = h('div', 'm-root');
  private board = h('div', 'm-board');
  private toasts = h('div', 'm-toasts');
  private bannerEl = h('div', 'm-banner');
  private overlay = h('div', 'm-overlay hidden');
  private panel: Panel;
  private unlockMenu: UnlockMenu;
  private confirm = new Confirm();
  private abBar = h('div', 'm-abilities');
  private tabs: SideTabs;
  private aim: { key: PowerKey; use: 'point' | 'path' | 'place' } | null = null;
  private aimEl = h('div', 'm-aim hidden');
  private cashBox = h('div', 'm-stat cash');
  private livesBox = h('div', 'm-stat lives');
  private cards = new Map<TowerType | HeroType, HTMLElement>();
  private livesEl = h('b', 'num', '0');
  private cashEl = h('b', 'num', '0');
  private roundEl = h('span', 'm-round', '');
  private startBtn = h('button', 'm-start');
  private speedBtns: HTMLButtonElement[] = [];
  private autoBtn = h('button', 'm-toggle');
  private pauseBtn = h('button', 'm-icon-btn');
  private vol = volumeButton(audio.volumeApi, (m) => uiIcon(m ? 'mute' : 'sound', 2), 'm-vol');
  private placing: (TowerType | HeroType) | null = null;
  private mouse: { x: number; y: number } | null = null;
  private speed = 1;
  private paused = false;
  /** Debug: [Sim ms, Sync ms, Render ms, Schritte] je Bild */
  readonly perf: number[][] = [];
  private readonly matchId: string;
  private acc = 0;
  private raf = 0;
  private last = 0;
  private ended = false;
  /** Runde 15b: die Endrunde der Schwierigkeit war geschafft (Sieg), auch wenn danach im Freeplay weitergespielt wurde. */
  private wonOnce = false;
  private upgrades: MatchResult['upgrades'] = [];
  private tiersSeen = new Map<number, Tiers>();
  private abSig = '';
  private ro?: ResizeObserver;
  private hoverTower: number | null = null;
  private keyHandler = (e: KeyboardEvent): void => this.onKey(e);
  private endTimer = 0;

  constructor(private readonly root: HTMLElement, private readonly game: Game, private readonly opts: StartOptions & { seed: number }) {
    this.r = new Renderer((opts.map ?? 'meadow') as MapId);
    this.geo = mapGeometry(opts.map ?? 'meadow');
    this.matchId = `${opts.map ?? 'meadow'}-${opts.mode ?? 'standard'}-${opts.difficulty}-${opts.seed}-${Date.now().toString(36)}`;
    this.done = new Promise((res) => (this.finish = res));
    this.panel = new Panel(game, { map: opts.map ?? 'meadow', mode: opts.mode ?? 'standard', difficulty: opts.difficulty, seed: opts.seed, unlocks: opts.unlocks, mods: opts.mods }, {
      upgrade: (id, p) => this.buyPath(id, p),
      withdraw: (id) => this.withdraw(id),
      sell: (id) => { this.report(this.game.apply({ type: 'sell', towerId: id })); this.select(null); },
      target: (id, mode: TargetMode) => { this.game.apply({ type: 'target', towerId: id, mode }); audio.play('click'); },
      close: () => this.select(null),
      toast: (s) => this.toast(s),
      openUnlock: (ty) => this.unlockMenu.show(ty),
      askUnlock: (ty, p) => this.askUnlock(ty, p),
    });
    this.tabs = new SideTabs(game, { pick: (slot) => this.pickPower(slot) });
    this.unlockMenu = new UnlockMenu(game, {
      unlock: (ty, p) => this.unlockTier(ty, p),
      close: () => this.unlockMenu.show(null),
    });
  }

  async init(): Promise<void> {
    this.buildDom();
    this.root.replaceChildren(this.el);
    await this.r.init(this.board);
    this.board.append(this.toasts, this.bannerEl, this.aimEl, this.abBar, this.panel.el, this.unlockMenu.el, this.confirm.el, this.overlay);
    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(this.board);
    this.fit();
    audio.attach();
    audio.setTheme('match');
    if (this.game.info.mode !== 'standard') this.toast(MODES[this.game.info.mode].desc, 'gain');
    window.addEventListener('keydown', this.keyHandler);
    this.bindBoard();
    this.r.setAuraProbe((id) => this.game.auraOf(id));
    this.r.setBuffProbe((id) => this.game.buffOf(id));
    this.r.onCoinsLanded = () => { this.pulse(this.cashBox, 'pulse-gain'); audio.play('coin.land'); };
    if (this.opts.debug) (window as unknown as { __dw: unknown }).__dw = { game: this.game, r: this.r, match: this, audio, DATA };
    this.last = performance.now();
    this.raf = requestAnimationFrame((n) => this.frame(n));
  }

  private fit(): void {
    const r = this.board.getBoundingClientRect();
    this.r.fit(r.width, r.height);
    this.aimCash();
  }

  /** Muenzfluege (Market, Grant, Supply Drop) zielen auf die Geldanzeige oben links; in Kartenpixeln, an den Rand geklemmt. */
  private aimCash(): void {
    const rc = this.r.canvasRect, bc = this.cashBox.getBoundingClientRect();
    if (!rc.width || !bc.width) return;
    const x = ((bc.left + bc.width / 2 - rc.left) / rc.width) * 640;
    const y = ((bc.top + bc.height / 2 - rc.top) / rc.height) * 360;
    this.r.cashTarget = { x: Math.max(6, Math.min(634, x)), y: Math.max(3, Math.min(356, y)) };
  }

  private withdraw(id: number): void {
    this.report(this.game.apply({ type: 'withdraw', towerId: id }));
  }

  // ------------------------------------------------------------------ DOM
  private buildDom(): void {
    const top = h('div', 'm-top pxbox');
    const lives = this.livesBox;
    lives.append(uiIcon('heart', 3), this.livesEl);
    const cash = this.cashBox;
    cash.append(uiIcon('coin', 3), this.cashEl);
    const map = h('div', 'm-mapname', this.game.info.map in DATA.maps ? DATA.maps[this.game.info.map].name : 'Lanternfall Meadow');
    const mode = this.game.info.mode;
    // Modus-Hinweis neben dem Kartennamen; Deflation und Half Cash sagen dazu, was mit dem Einkommen ist
    const chip = h('div', `m-mode mode-${mode}${mode === 'standard' ? ' hidden' : ''}`, MODES[mode].name);
    chip.title = MODES[mode].desc;
    if (mode === 'deflation') cash.append(h('span', 'm-income-note', 'no income'));
    else if (mode === 'half-cash') cash.append(h('span', 'm-income-note', 'half income'));
    this.pauseBtn.append(uiIcon('pause', 2));
    this.pauseBtn.title = t('match.pause') + ' (P)';
    this.pauseBtn.onclick = () => this.setPaused(!this.paused);
    top.append(lives, cash, this.roundEl, h('div', 'grow'), chip, map, this.vol.el, this.pauseBtn);

    const side = h('aside', 'm-side pxbox');
    const tw = this.tabs.towers;
    tw.append(h('div', 'm-side-h', t('match.towers')));
    const list = h('div', 'm-cards m-cards-towers');
    for (const ty of TOWER_TYPES) list.append(this.card(ty));
    tw.append(list);
    tw.append(h('div', 'm-side-h', t('match.hero')));
    const hl = h('div', 'm-cards m-cards-hero');
    for (const ty of [this.game.info.hero]) hl.append(this.card(ty)); // Runde 16: nur der Held dieser Partie (Wren, Bram oder Sela)
    tw.append(hl);
    side.append(this.tabs.bar, this.tabs.panes);
    // Start, Tempo, Auto
    this.startBtn.append(uiIcon('play', 3), h('span', '', t('match.start')), h('kbd', '', 'Space'));
    this.startBtn.onclick = () => this.startRound();
    const speed = h('div', 'm-speed');
    for (const sp of [1, 2, 3]) {
      const b = h('button', 'm-speed-b', `${sp}x`);
      b.title = `${t('match.speed')} ${sp}x`;
      b.onclick = () => this.setSpeed(sp);
      this.speedBtns.push(b);
      speed.append(b);
    }
    this.autoBtn.append(uiIcon('auto', 2), h('span', '', t('match.auto')));
    this.autoBtn.onclick = () => this.game.apply({ type: 'autoStart', on: !this.game.state.autoStart });
    side.append(this.startBtn, speed, this.autoBtn);
    const quit = h('button', 'm-quit', t('match.quit'));
    quit.onclick = () => this.end(true);
    side.append(quit);

    const main = h('div', 'm-main');
    main.append(this.board, side);
    this.el.append(top, main);
    this.setSpeed(1);
  }

  private card(ty: TowerType | HeroType): HTMLElement {
    const c = h('button', 'm-card');
    const spr = isHero(ty) ? heroPortrait() : towerPortrait(ty);
    const port = h('div', 'm-port');
    // Runde 14b: auf sichtbare Pixel zuschneiden, ganzzahlig und mittig. Zwei Fassungen (1x/2x), das CSS waehlt je nach Fensterhoehe.
    const f1 = fitFigure(spr.canvas, 99, 99, 1), f2 = fitFigure(spr.canvas, 76, 78, 2);
    f1.classList.add('fig1');
    f2.classList.add('fig2');
    port.append(f1, f2);
    const txt = h('div', 'm-card-t');
    txt.append(h('div', 'm-card-n', displayName(ty)), h('div', 'm-card-r', ROLE[ty]));
    const price = h('div', 'm-card-p');
    price.append(uiIcon('coin', 2), h('b', 'num', String(this.game.priceOf(ty))));
    txt.append(price);
    const key = h('kbd', 'm-key', HOTKEY[ty]);
    c.append(port, txt, key);
    // Modus-Sperre (Runde 15) geht vor der Level-Sperre: ausgegraut mit Hinweis, welcher Modus es verbietet
    const modeOk = modeAllows(this.game.info.mode, ty);
    const unlocked = !this.opts.unlocks || this.opts.unlocks.towers.includes(ty);
    if (!modeOk || !unlocked) {
      c.classList.add('locked');
      if (!modeOk) c.classList.add('mode-off');
      const lock = h('div', 'm-lock');
      lock.append(uiIcon('lock', 3), h('span', '', !modeOk ? this.modeLockText(ty) : this.opts.lockInfo?.[ty] ?? t('match.locked')));
      c.append(lock);
    }
    c.onclick = () => this.beginPlace(ty);
    this.cards.set(ty, c);
    return c;
  }

  /** Hinweis auf gesperrten Karten, wenn der Modus den Turm oder den Helden verbietet. */
  private modeLockText(ty: TowerType | HeroType): string {
    const m = MODES[this.game.info.mode];
    return isHero(ty) ? 'No hero in this mode' : `Not in ${m.name}`;
  }

  // ------------------------------------------------------------------ Aktionen
  private report(res: CommandResult): void {
    if (!res.ok) { this.toast(t(`reason.${res.reason}`) === `reason.${res.reason}` ? t('reason.unknown') : t(`reason.${res.reason}`)); audio.play('error'); }
  }

  /** Freischalten im Match (Runde 11b): Befehl an die Sim, Ton, Effekt am gewaehlten Turm. */
  private unlockTier(ty: TowerType, path: 0 | 1 | 2): void {
    const res = this.game.apply({ type: 'unlockTier', tower: ty, path });
    if (!res.ok) { this.report(res); return; }
    audio.play('ui.unlock');
    const sel = this.panel.selected;
    const tw = sel == null ? undefined : this.game.state.towers.find((q) => q.id === sel);
    if (tw && tw.type === ty) this.r.unlockFx(tw.id);
  }

  /** Turm-Panel (Runde 11c): Klick auf eine nicht freigeschaltete Stufe -> "Unlock <Name> for N Tower XP?" mit Yes/No. */
  private askUnlock(ty: TowerType, path: 0 | 1 | 2): void {
    const pi = this.game.unlockInfo(ty)[path];
    const tier = pi?.next != null ? pi.tiers[pi.next - 1] : undefined;
    if (!pi || !tier) return;
    if (this.game.state.towerXp[ty] < tier.cost) { this.toast(t('panel.needXp', { n: tier.cost - this.game.state.towerXp[ty] })); audio.play('error'); return; }
    audio.play('click');
    this.confirm.show({
      title: t('confirm.unlock', { name: tier.revealed ? tier.name : t('panel.hidden'), n: tier.cost }),
      sub: t('confirm.unlockSub'),
      icon: tier.revealed ? iconUpgrade(ty, path, tier.tier).canvas : undefined,
      yes: () => this.unlockTier(ty, path),
    });
  }

  /** Taste `,` `.` `/` und Panel-Knopf: naechste Stufe des Pfads kaufen; nicht freigeschaltet -> Bestaetigung. */
  private buyPath(towerId: number, path: 0 | 1 | 2): void {
    const b = this.panel.buttonFor(towerId, path);
    if (!b) return;
    switch (b.btn.kind) {
      case 'unlock': this.askUnlock(b.type, path); break;
      case 'needxp': this.toast(t('panel.needXp', { n: b.btn.xpMissing })); audio.play('error'); break;
      default: this.report(this.game.apply({ type: 'upgrade', towerId, path }));
    }
  }

  toast(msg: string, cls = ''): void {
    const d = h('div', `m-toast${cls ? ' ' + cls : ''}`, msg);
    this.toasts.append(d);
    setTimeout(() => d.classList.add('out'), 1500);
    setTimeout(() => d.remove(), 2000);
    while (this.toasts.children.length > 3) this.toasts.firstElementChild?.remove();
  }

  banner(text: string, sub = ''): void {
    this.bannerEl.replaceChildren(h('div', 'b-t', text), ...(sub ? [h('div', 'b-s', sub)] : []));
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
  }

  private startRound(): void {
    if (this.ended) return;
    const res = this.game.apply({ type: 'startRound' });
    if (!res.ok) this.report(res);
  }

  private setSpeed(n: number): void {
    this.speed = n;
    this.speedBtns.forEach((b, i) => setClass(b, 'on', i + 1 === n));
  }
  private setPaused(p: boolean): void {
    if (this.ended) return;
    this.paused = p;
    this.overlay.classList.toggle('hidden', !p);
    if (p) {
      const resume = h('button', 'm-start small', t('match.resume'));
      resume.onclick = () => this.setPaused(false);
      const quit = h('button', 'm-quit', t('match.quit'));
      quit.onclick = () => this.end(true);
      this.overlay.replaceChildren(h('div', 'ov-t', t('match.paused')), resume, quit);
    }
  }
  private toggleMute(): void {
    audio.toggleQuiet();
    this.vol.refresh();
  }

  // ------------------------------------------------------------------ Powers (Runde 12)
  /** Platte im Powers-Reiter angeklickt: Knopf-Powers sofort, Ziel-Powers wechseln in den Zielmodus. */
  private pickPower(slot: PowerSlot): void {
    if (this.ended) return;
    if (!MODES[this.game.info.mode].powers) { this.toast(t('reason.mode-locked')); audio.play('error'); return; }
    if (!slotUsable(slot)) {
      this.toast(t(slot.state === 'empty' ? 'reason.no-power' : slot.state === 'used' ? 'reason.used-this-round' : 'reason.no-hero'));
      audio.play('error');
      return;
    }
    if (slot.target === 'button') { this.cancelAim(); this.usePower(slot.key); return; }
    if (this.aim?.key === slot.key) { this.cancelAim(); return; }
    this.beginPlace(null);
    this.select(null);
    this.aim = { key: slot.key, use: slot.target === 'point' ? 'point' : slot.target === 'path' ? 'path' : 'place' };
    this.tabs.armed = slot.key;
    this.aimEl.textContent = t(slot.target === 'point' ? 'powers.aimBomb' : slot.target === 'path' ? 'powers.aimPath' : 'powers.aimPlace');
    this.aimEl.classList.remove('hidden');
    audio.play('click');
    this.updateGhost();
  }

  private usePower(key: PowerKey, x?: number, y?: number): CommandResult {
    const res = this.game.apply({ type: 'power', power: key, x, y });
    if (!res.ok) this.report(res);
    return res;
  }

  private cancelAim(): void {
    if (!this.aim) return;
    this.aim = null;
    this.tabs.armed = null;
    this.aimEl.classList.add('hidden');
    this.r.setAim(null);
    this.r.setGhost(null);
  }

  /** Geist/Vorschau im Zielmodus (Trockenlauf `canUsePower`, gleiche Gruende wie der echte Befehl). */
  private updateAim(): void {
    const a = this.aim;
    if (!a) return;
    if (!this.mouse) { this.r.setAim(null); this.r.setGhost(null); return; }
    const x = Math.round(this.mouse.x), y = Math.round(this.mouse.y);
    const chk = this.game.canUsePower(a.key, x * 1000, y * 1000);
    if (a.use === 'point') {
      this.r.setGhost(null);
      this.r.setAim({ kind: 'bomb', x, y, r: DATA.powers.lanternBomb.params.radiusPx as number, ok: chk.ok });
    } else if (a.use === 'path') {
      this.r.setGhost(null);
      const sp = this.trapSpotAny(x, y);
      this.r.setAim({ kind: a.key as 'caltrops' | 'frostTrap', x: chk.ok ? sp.x : x, y: chk.ok ? sp.y : y, ok: chk.ok });
    } else {
      this.r.setAim(null);
      const ty = DATA.powers[a.key].tower as TowerType;
      this.r.setGhost({ x, y, spr: towerSprite(ty, (DATA.powers[a.key].tiers ?? [0, 0, 0]) as Tiers, 6, 'idle0'), view: this.ghostView(ty), foot: footMilli(ty) / 1000, ok: chk.ok });
    }
    this.lastGhostReason = chk.ok ? null : chk.reason;
  }

  /** Naechster Wegpunkt ueber alle Aeste (Frostfen hat zwei), mit der Pruefung der halben Wegbreite. */
  private trapSpotAny(x: number, y: number): { ok: boolean; x: number; y: number } {
    let best = trapSpot(this.geo.paths[0], this.geo.halfWidth, x, y), bd = Math.hypot(best.x - x, best.y - y);
    for (const p of this.geo.paths.slice(1)) {
      const q = trapSpot(p, this.geo.halfWidth, x, y), d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { best = q; bd = d; }
    }
    return best;
  }

  private pulse(el: HTMLElement, cls: string): void {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  private beginPlace(ty: TowerType | HeroType | null): void {
    if (ty) this.cancelAim();
    if (ty && !modeAllows(this.game.info.mode, ty)) { this.toast(this.modeLockText(ty)); audio.play('error'); return; }
    if (ty && this.opts.unlocks && !this.opts.unlocks.towers.includes(ty)) { this.toast(this.opts.lockInfo?.[ty] ?? t('match.locked')); audio.play('error'); return; }
    this.placing = this.placing === ty ? null : ty;
    if (this.placing) { this.select(null); this.toast(t('match.placeHint')); }
    for (const [k, c] of this.cards) setClass(c, 'sel', k === this.placing);
    if (!this.placing) this.r.setGhost(null);
    this.updateGhost();
  }

  private select(id: number | null): void {
    this.r.select(id);
    const tw = id == null ? null : this.game.state.towers.find((q) => q.id === id);
    this.panel.show(tw ? tw.id : null, tw ? tw.x / 1000 : 0);
    if (id != null) { this.cancelAim(); this.placing = null; for (const c of this.cards.values()) setClass(c, 'sel', false); this.r.setGhost(null); }
  }

  private towerAt(x: number, y: number): number | null {
    let best: number | null = null, bd = 1e9;
    for (const tw of this.game.state.towers) {
      const d = Math.hypot(tw.x / 1000 - x, tw.y / 1000 - 10 - y);
      const lim = footMilli(tw.type) / 1000 + 8;
      if (d < lim && d < bd) { bd = d; best = tw.id; }
    }
    return best;
  }

  /** Beim Platzieren: Ring (Schiessende), Aura-Radius (Market, mit Wide Aura) oder nichts (Longshot: ganze Karte). */
  private ghostView(ty: TowerType | HeroType): RangeView {
    const base = isHero(ty) ? baseRangePx(ty) : ty === 'market' ? marketRadiusPx(DATA.towers.market.base.range as number, this.opts.mods?.marketRadiusBp ?? 0) : baseRangePx(ty);
    return rangeView(ty, base);
  }

  private updateGhost(): void {
    if (this.aim) { this.updateAim(); return; }
    if (!this.placing || !this.mouse) { this.r.setGhost(null); return; }
    const ty = this.placing;
    const x = Math.round(this.mouse.x), y = Math.round(this.mouse.y);
    const chk = this.game.canPlace(ty, x * 1000, y * 1000);
    const spr = isHero(ty) ? heroSprite(1, 6, 'idle0') : towerSprite(ty, [0, 0, 0], 6, 'idle0');
    this.r.setGhost({ x, y, spr, view: this.ghostView(ty), foot: footMilli(ty) / 1000, ok: chk.ok });
    this.lastGhostReason = chk.ok ? null : chk.reason;
  }
  private lastGhostReason: string | null = null;

  private bindBoard(): void {
    const cv = this.r.app.canvas;
    cv.addEventListener('pointermove', (e) => {
      const p = this.r.toMap(e.clientX, e.clientY);
      this.mouse = p;
      this.hoverTower = this.towerAt(p.x, p.y);
      cv.style.cursor = this.placing ? 'none' : this.hoverTower != null ? 'pointer' : 'default';
      this.updateGhost();
    });
    cv.addEventListener('pointerleave', () => { this.mouse = null; this.r.setGhost(null); this.r.setAim(null); });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); if (this.aim) this.cancelAim(); else if (this.placing) this.beginPlace(null); else this.select(null); });
    cv.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const p = this.r.toMap(e.clientX, e.clientY);
      this.mouse = p;
      if (this.aim) {
        const key = this.aim.key;
        const res = this.usePower(key, Math.round(p.x) * 1000, Math.round(p.y) * 1000);
        if (res.ok && !e.shiftKey) this.cancelAim(); else this.updateAim();
        return;
      }
      if (this.placing) {
        const ty = this.placing;
        const res = this.game.apply({ type: 'place', tower: ty, x: Math.round(p.x) * 1000, y: Math.round(p.y) * 1000 });
        if (res.ok) { if (!e.shiftKey) this.beginPlace(null); else this.updateGhost(); if (res.id != null && !e.shiftKey) this.select(res.id); }
        else this.report(res);
        return;
      }
      const id = this.towerAt(p.x, p.y);
      this.select(id);
    });
  }

  private onKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || this.ended) return;
    const k = e.key;
    const sel = this.panel.selected;
    if (this.confirm.open) {
      if (k === 'Enter' || k === 'Escape' || k.toLowerCase() === 'y' || k.toLowerCase() === 'n') { e.preventDefault(); this.confirm.answer(k === 'Enter' || k.toLowerCase() === 'y'); }
      return;
    }
    if (k === 'Escape' && this.aim) { this.cancelAim(); return; }
    if (k === 'Escape' && this.unlockMenu.open) { this.unlockMenu.show(null); return; }
    if (k === 'Escape') { if (this.placing) this.beginPlace(null); else if (sel != null) this.select(null); else this.setPaused(!this.paused); return; }
    if (this.paused) return;
    if (k === 'Tab') { e.preventDefault(); this.tabs.cycle(e.shiftKey ? -1 : 1); return; }
    const lower = k.toLowerCase();
    const ty = [...TOWER_TYPES, this.game.info.hero].find((q) => (isHero(q) ? HERO_KEY : HOTKEY[q]).toLowerCase() === lower);
    if (ty) { this.beginPlace(ty); return; }
    if (k === ' ') { e.preventDefault(); if (this.game.state.phase === 'wave' && this.game.state.groups.length > 0) this.setSpeed(this.speed >= 3 ? 1 : this.speed + 1); else this.startRound(); return; }
    if (lower === 'b' && sel != null) { const tw = this.game.state.towers.find((q) => q.id === sel); if (tw?.type === 'market') this.withdraw(sel); return; }
    if (lower === 'p') { this.setPaused(true); return; }
    if (lower === 'm') { this.toggleMute(); return; }
    if (lower === 'f') { this.setSpeed(this.speed >= 3 ? 1 : this.speed + 1); return; }
    if (lower === 'g') { this.game.apply({ type: 'autoStart', on: !this.game.state.autoStart }); return; }
    const ai = KEYS_ABILITY.indexOf(k);
    if (ai >= 0) { const a = this.game.state.abilities[ai]; if (a) this.useAbility(a.id); return; }
    const pi = [',', '.', '/'].indexOf(k);
    if (pi >= 0 && sel != null) { e.preventDefault(); this.buyPath(sel, pi as 0 | 1 | 2); return; }
    if ((k === 'Backspace' || k === 'Delete') && sel != null) { this.report(this.game.apply({ type: 'sell', towerId: sel })); this.select(null); }
  }

  private useAbility(id: AbilityId): void {
    this.report(this.game.apply({ type: 'ability', ability: id }));
  }

  /** Nur fuer Pruefskripte: Sim ohne Anzeige vorspulen (Events werden nur fuer die Statistik gelesen). */
  skip(ticks: number): void {
    for (let i = 0; i < ticks && !this.ended; i++) {
      this.game.step(1);
      for (const ev of this.game.drainEvents()) {
        if (ev.type === 'upgrade') this.onEvent(ev);
        else if (ev.type === 'place') this.tiersSeen.set(ev.tower, [0, 0, 0]);
        else if (ev.type === 'gameOver' || ev.type === 'towerXp') this.onEvent(ev);
      }
    }
  }

  // ------------------------------------------------------------------ Schleife
  private frame(now: number): void {
    this.raf = requestAnimationFrame((n) => this.frame(n));
    const dtMs = Math.min(100, now - this.last);
    this.last = now;
    const g = this.game;
    const t0 = this.opts.debug ? performance.now() : 0;
    let steps = 0;
    if (!this.paused && !this.ended) {
      this.acc += (dtMs / 1000) * TICKS_PER_S * this.speed;
      const cap = 12 * this.speed;
      while (this.acc >= 1 && steps < cap) {
        this.acc -= 1;
        this.r.setLatest(g.state);
        g.step(1);
        steps++;
        for (const ev of g.drainEvents()) this.onEvent(ev);
        if (g.state.phase === 'won' || g.state.phase === 'lost') break;
      }
      if (this.acc > cap) this.acc = 0;
    }
    const t1 = this.opts.debug ? performance.now() : 0;
    this.r.setLatest(g.state);
    this.r.sync(g.state, this.paused ? 1 : Math.min(1, this.acc), dtMs);
    const t2 = this.opts.debug ? performance.now() : 0;
    this.r.update(this.paused ? 0 : dtMs * 0.06 * this.speed);
    if (this.opts.debug) this.perf.push([t1 - t0, t2 - t1, performance.now() - t2, steps]);
    this.hud(g.state);
    this.panel.update(g.state);
    this.tabs.update(g.state);
    this.unlockMenu.update(g.state);
    if (this.placing) this.updateGhost();
  }

  private onEvent(ev: SimEvent): void {
    const st = this.game.state;
    this.r.handle(ev);
    audio.onEvent(ev, st.towers);
    switch (ev.type) {
      case 'roundStart':
        this.banner(this.roundText(ev.round), this.bossLine(ev.round));
        break;
      case 'upgrade': {
        const prev = this.tiersSeen.get(ev.tower) ?? [0, 0, 0];
        ev.tiers.forEach((v, p) => { if (v > prev[p]) this.upgrades.push({ tower: ev.ttype, path: p, tier: v }); });
        this.tiersSeen.set(ev.tower, [...ev.tiers] as Tiers);
        break;
      }
      case 'place': this.tiersSeen.set(ev.tower, [0, 0, 0]); break;
      case 'towerXp': {
        // Rundenende: kurze Anzeige je Turmtyp mit dem Anteil
        for (const ty of TOWER_TYPES) {
          const n = ev.gains[ty];
          if (n) this.toast(t('unlock.xpGain', { n, name: displayName(ty) }), 'gain');
        }
        audio.play('ui.tick');
        break;
      }
      case 'unlockTier': this.toast(t('unlock.bought', { name: DATA.towers[ev.tower].paths[ev.path].tiers[ev.tier - 1].name }), 'gain'); break;
      case 'power':
        if (ev.power === 'goldDrop') this.pulse(this.cashBox, 'pulse-gain');
        else if (ev.power === 'extraLives') this.pulse(this.livesBox, 'pulse-life');
        this.toast(powerName(ev.power), 'gain');
        break;
      case 'heal': this.pulse(this.livesBox, 'pulse-life'); break;
      case 'gate': this.toast('Gate held: leak stopped', 'gain'); break;
      case 'gameOver': this.onGameOver(ev.result === 'won'); break;
      default: break;
    }
  }

  /** Unterzeile des Rundenbanners: "<Boss> approaches", wenn die Runde einen Boss hat. */
  private bossLine(round: number): string {
    const boss = this.game.roundPreview(round)?.groups.find((g) => isBoss(g.type));
    return boss ? t('match.bossIncoming', { name: BOSS_NAMES[boss.type] ?? 'A boss' }) : '';
  }

  /** "Round 12/60" bis zur Endrunde, danach im Freeplay "Round 61". */
  private roundText(n: number): string {
    return this.game.state.freeplay || n > this.game.info.maxRound ? t('match.roundFree', { n }) : t('match.round', { n: Math.max(n, 0), max: this.game.info.maxRound });
  }

  private onGameOver(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    if (won) this.wonOnce = true;
    const fp = this.wonOnce && !won;
    const box = h('div', `ov-box ${won ? 'won' : 'lost'}`);
    const cont = h('button', 'm-start small', t(won ? 'match.finish' : 'match.continue'));
    cont.onclick = () => this.end(false);
    box.append(h('div', 'ov-t', t(won ? 'match.victory' : fp ? 'match.freeplayOver' : 'match.defeat')), h('div', 'ov-s', won ? t('match.victoryNote', { n: this.game.state.round }) : this.roundText(this.game.state.round)));
    if (won) {
      // Runde 15b: wie BTD6, "Continue in Freeplay" nach dem Sieg (Max, 10.10.2026)
      const more = h('button', 'm-start small free-btn', t('match.freeplayBtn'));
      more.dataset.act = 'freeplay';
      more.onclick = () => this.continueFreeplay();
      cont.dataset.act = 'finish';
      box.append(more, cont);
    } else {
      box.append(cont);
      this.endTimer = window.setTimeout(() => this.end(false), 6000);
    }
    this.overlay.replaceChildren(box);
    this.overlay.classList.remove('hidden');
  }

  /** Nach dem Sieg weiterspielen: die Sim laeuft mit derselben Liste weiter, ab R121 aus der Formel. */
  private continueFreeplay(): void {
    if (this.endTimer) clearTimeout(this.endTimer);
    const res = this.game.apply({ type: 'continue' });
    if (!res.ok) return;
    this.ended = false;
    this.overlay.classList.add('hidden');
    this.toast(t('match.freeplayStart'), 'gain');
  }

  private hud(st: GameState): void {
    setText(this.livesEl, String(st.lives));
    setText(this.cashEl, String(st.cash));
    setText(this.roundEl, this.roundText(st.round));
    setClass(this.roundEl, 'free', st.freeplay);
    this.startBtn.disabled = this.ended;
    setClass(this.autoBtn, 'on', st.autoStart);
    setClass(this.cashBox, 'oil', st.oilRound > 0 && st.round <= st.oilRound);
    setClass(this.startBtn, 'wave', st.phase === 'wave');
    for (const [ty, c] of this.cards) {
      const price = this.game.priceOf(ty);
      setClass(c, 'poor', st.cash < price);
      setClass(c, 'used', isHero(ty) && st.heroPlaced);
    }
    // Faehigkeiten-Leiste
    const sig = st.abilities.map((a) => a.id).join(',');
    if (sig !== this.abSig) {
      this.abSig = sig;
      this.abBar.replaceChildren();
      st.abilities.forEach((a, i) => {
        const b = h('button', 'ab-btn');
        b.dataset.ab = a.id;
        b.title = ABILITY_TEXT[a.id].desc;
        const ic = h('div', 'ab-ic');
        // Sim heisst die Faehigkeit 'tonic', das Pixel-Icon 'transformingTonic' (Runde 14)
        ic.append(copyCanvas(iconAbility(a.id === 'tonic' ? 'transformingTonic' : a.id).canvas, 2));
        b.append(ic, h('span', 'ab-n', ABILITY_TEXT[a.id].name), h('kbd', '', String(i + 1)), h('div', 'cd'), h('span', 'ab-t num'));
        b.onclick = () => this.useAbility(a.id);
        this.abBar.append(b);
      });
    }
    for (const a of st.abilities) {
      const b = this.abBar.querySelector<HTMLElement>(`[data-ab="${a.id}"]`);
      if (!b) continue;
      setClass(b, 'ready', a.ready);
      (b.querySelector('.cd') as HTMLElement).style.height = a.ready ? '0%' : `${(a.cdLeft / Math.max(1, a.cdTotal)) * 100}%`;
      setText(b.querySelector('.ab-t') as HTMLElement, a.ready ? '' : cooldownText(a.cdLeft));
    }
  }

  // ------------------------------------------------------------------ Ende
  private end(quit: boolean): void {
    if (this.endTimer) clearTimeout(this.endTimer);
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyHandler);
    this.ro?.disconnect();
    this.vol.close();
    audio.setTheme(null);
    const st = this.game.state;
    const result: MatchResult = {
      matchId: this.matchId,
      map: this.opts.map ?? 'meadow',
      mode: this.game.info.mode,
      roundsCleared: st.roundsCleared,
      won: this.wonOnce || st.phase === 'won',
      round: st.round,
      difficulty: this.opts.difficulty,
      seed: this.opts.seed,
      livesLeft: st.lives,
      pops: { ...st.stats.pops },
      towerXp: { ...st.towerXp },
      towerTiers: Object.fromEntries(Object.entries(st.maxTier).map(([k, v]) => [k, [...v]])) as typeof st.maxTier, // Runde 13: alle fünf Typen
      towerXpGained: { ...st.towerXpGained },
      powersUsed: { ...st.stats.powersUsed },
      upgrades: this.upgrades,
      ticks: st.tick,
      quit,
    };
    this.r.destroy();
    this.el.remove();
    this.finish(result);
  }
}

void DATA;
