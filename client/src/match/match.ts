/**
 * Match-Bildschirm (Runde 11 / P3): baut die Oberflaeche, treibt die Sim im Takt (60 Ticks/s x Tempo), reicht Sim-Events an
 * Renderer, Ton und HUD weiter und nimmt Eingaben entgegen. Keine Spielregeln hier: alles entscheidet `Game`.
 * Einstieg fuer die App: `startMatch(root, opts) -> Promise<MatchResult>`.
 */
import { createGame, DATA, MAX_ROUND, type AbilityId, type CommandResult, type Difficulty, type Game, type GameOptions, type GameState, type HeroType, type SimEvent, type TargetMode, type Tiers, type TowerType } from '../sim';
import { audio } from '../audio/engine';
import { t } from '../i18n/t';
import { h, setClass, setText } from '../ui/dom';
import { baseRangePx, displayName, footMilli, isHero } from './info';
import { Confirm } from './confirm';
import { Panel } from './panel';
import { UnlockMenu } from './unlock-menu';
import { Renderer } from './renderer';
import { iconUpgrade, heroPortrait, towerPortrait, heroSprite, towerSprite } from './sprites';
import { ABILITY_TEXT, HERO_TYPES, HOTKEY, ROLE, TOWER_TYPES } from './tower-text';
import { copyCanvas, uiIcon } from './ui-icons';
import './match.css';

export interface StartOptions {
  map?: string;
  difficulty: Difficulty;
  seed?: number;
  unlocks?: GameOptions['unlocks'];
  mods?: GameOptions['mods'];
  /** Turm-XP-Konto aus dem Profil (Runde 11b); fehlt = kein XP-System im Match. */
  towerXp?: GameOptions['towerXp'];
  /** Text fuer gesperrte Tuerme, z. B. { bombardier: 'Unlocks at level 2' } (P4 liefert die Zahlen) */
  lockInfo?: Partial<Record<TowerType | HeroType, string>>;
  /** nur fuer Pruef-Skripte: Zugriff auf Game/Renderer unter window.__dw */
  debug?: boolean;
}

export interface MatchResult {
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
  /** jede gekaufte Stufe in Reihenfolge */
  upgrades: { tower: TowerType | HeroType; path: number; tier: number }[];
  ticks: number;
  quit: boolean;
}

const TICKS_PER_S = 60;
const KEYS_ABILITY = ['1', '2', '3'];

export async function startMatch(root: HTMLElement, opts: StartOptions): Promise<MatchResult> {
  const seed = opts.seed ?? (Math.floor(Math.random() * 2 ** 31) | 0);
  const game = createGame({ map: opts.map ?? 'meadow', difficulty: opts.difficulty, seed, unlocks: opts.unlocks, towerXp: opts.towerXp, mods: opts.mods });
  const m = new Match(root, game, { ...opts, seed });
  await m.init();
  return m.done;
}

class Match {
  readonly done: Promise<MatchResult>;
  private finish!: (r: MatchResult) => void;
  private readonly r = new Renderer();
  private readonly el = h('div', 'm-root');
  private board = h('div', 'm-board');
  private toasts = h('div', 'm-toasts');
  private bannerEl = h('div', 'm-banner');
  private overlay = h('div', 'm-overlay hidden');
  private panel: Panel;
  private unlockMenu: UnlockMenu;
  private confirm = new Confirm();
  private abBar = h('div', 'm-abilities');
  private cards = new Map<TowerType | HeroType, HTMLElement>();
  private livesEl = h('b', 'num', '0');
  private cashEl = h('b', 'num', '0');
  private roundEl = h('span', 'm-round', '');
  private startBtn = h('button', 'm-start');
  private speedBtns: HTMLButtonElement[] = [];
  private autoBtn = h('button', 'm-toggle');
  private pauseBtn = h('button', 'm-icon-btn');
  private muteBtn = h('button', 'm-icon-btn');
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
  private upgrades: MatchResult['upgrades'] = [];
  private tiersSeen = new Map<number, Tiers>();
  private abSig = '';
  private ro?: ResizeObserver;
  private hoverTower: number | null = null;
  private keyHandler = (e: KeyboardEvent): void => this.onKey(e);
  private endTimer = 0;

  constructor(private readonly root: HTMLElement, private readonly game: Game, private readonly opts: StartOptions & { seed: number }) {
    this.matchId = `${opts.map ?? 'meadow'}-${opts.difficulty}-${opts.seed}-${Date.now().toString(36)}`;
    this.done = new Promise((res) => (this.finish = res));
    this.panel = new Panel(game, { map: opts.map ?? 'meadow', difficulty: opts.difficulty, seed: opts.seed, unlocks: opts.unlocks, mods: opts.mods }, {
      upgrade: (id, p) => this.buyPath(id, p),
      sell: (id) => { this.report(this.game.apply({ type: 'sell', towerId: id })); this.select(null); },
      target: (id, mode: TargetMode) => { this.game.apply({ type: 'target', towerId: id, mode }); audio.play('click'); },
      close: () => this.select(null),
      toast: (s) => this.toast(s),
      openUnlock: (ty) => this.unlockMenu.show(ty),
      askUnlock: (ty, p) => this.askUnlock(ty, p),
    });
    this.unlockMenu = new UnlockMenu(game, {
      unlock: (ty, p) => this.unlockTier(ty, p),
      close: () => this.unlockMenu.show(null),
    });
  }

  async init(): Promise<void> {
    this.buildDom();
    this.root.replaceChildren(this.el);
    await this.r.init(this.board);
    this.board.append(this.toasts, this.bannerEl, this.abBar, this.panel.el, this.unlockMenu.el, this.confirm.el, this.overlay);
    this.ro = new ResizeObserver(() => this.fit());
    this.ro.observe(this.board);
    this.fit();
    audio.attach();
    audio.setMusic(true);
    window.addEventListener('keydown', this.keyHandler);
    this.bindBoard();
    if (this.opts.debug) (window as unknown as { __dw: unknown }).__dw = { game: this.game, r: this.r, match: this, audio, DATA };
    this.last = performance.now();
    this.raf = requestAnimationFrame((n) => this.frame(n));
  }

  private fit(): void {
    const r = this.board.getBoundingClientRect();
    this.r.fit(r.width, r.height);
  }

  // ------------------------------------------------------------------ DOM
  private buildDom(): void {
    const top = h('div', 'm-top pxbox');
    const lives = h('div', 'm-stat lives');
    lives.append(uiIcon('heart', 3), this.livesEl);
    const cash = h('div', 'm-stat cash');
    cash.append(uiIcon('coin', 3), this.cashEl);
    const map = h('div', 'm-mapname', 'Lanternfall Meadow');
    this.muteBtn.append(uiIcon(audio.muted ? 'mute' : 'sound', 2));
    this.muteBtn.title = t('match.mute') + ' (M)';
    this.muteBtn.onclick = () => this.toggleMute();
    this.pauseBtn.append(uiIcon('pause', 2));
    this.pauseBtn.title = t('match.pause') + ' (P)';
    this.pauseBtn.onclick = () => this.setPaused(!this.paused);
    top.append(lives, cash, this.roundEl, h('div', 'grow'), map, this.muteBtn, this.pauseBtn);

    const side = h('aside', 'm-side pxbox');
    side.append(h('div', 'm-side-h', t('match.towers')));
    const list = h('div', 'm-cards');
    for (const ty of TOWER_TYPES) list.append(this.card(ty));
    side.append(list);
    side.append(h('div', 'm-side-h', t('match.hero')));
    const hl = h('div', 'm-cards');
    for (const ty of HERO_TYPES) hl.append(this.card(ty));
    side.append(hl);
    side.append(h('div', 'grow'));
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
    port.append(copyCanvas(spr.canvas, 2));
    const txt = h('div', 'm-card-t');
    txt.append(h('div', 'm-card-n', displayName(ty)), h('div', 'm-card-r', ROLE[ty]));
    const price = h('div', 'm-card-p');
    price.append(uiIcon('coin', 2), h('b', 'num', String(this.game.priceOf(ty))));
    txt.append(price);
    const key = h('kbd', 'm-key', HOTKEY[ty]);
    c.append(port, txt, key);
    const unlocked = !this.opts.unlocks || this.opts.unlocks.towers.includes(ty);
    if (!unlocked) {
      c.classList.add('locked');
      const lock = h('div', 'm-lock');
      lock.append(uiIcon('lock', 3), h('span', '', this.opts.lockInfo?.[ty] ?? t('match.locked')));
      c.append(lock);
    }
    c.onclick = () => this.beginPlace(ty);
    this.cards.set(ty, c);
    return c;
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
    const mu = audio.toggleMute();
    this.muteBtn.replaceChildren(uiIcon(mu ? 'mute' : 'sound', 2));
  }

  private beginPlace(ty: TowerType | HeroType | null): void {
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
    if (id != null) { this.placing = null; for (const c of this.cards.values()) setClass(c, 'sel', false); this.r.setGhost(null); }
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

  private updateGhost(): void {
    if (!this.placing || !this.mouse) { this.r.setGhost(null); return; }
    const ty = this.placing;
    const x = Math.round(this.mouse.x), y = Math.round(this.mouse.y);
    const chk = this.game.canPlace(ty, x * 1000, y * 1000);
    const spr = isHero(ty) ? heroSprite(1, 6, 'idle0') : towerSprite(ty, [0, 0, 0], 6, 'idle0');
    this.r.setGhost({ x, y, spr, range: baseRangePx(ty), foot: footMilli(ty) / 1000, ok: chk.ok });
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
    cv.addEventListener('pointerleave', () => { this.mouse = null; this.r.setGhost(null); });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); if (this.placing) this.beginPlace(null); else this.select(null); });
    cv.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const p = this.r.toMap(e.clientX, e.clientY);
      this.mouse = p;
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
    if (k === 'Escape' && this.unlockMenu.open) { this.unlockMenu.show(null); return; }
    if (k === 'Escape') { if (this.placing) this.beginPlace(null); else if (sel != null) this.select(null); else this.setPaused(!this.paused); return; }
    if (this.paused) return;
    const lower = k.toLowerCase();
    const ty = [...TOWER_TYPES, ...HERO_TYPES].find((q) => HOTKEY[q].toLowerCase() === lower);
    if (ty) { this.beginPlace(ty); return; }
    if (k === ' ') { e.preventDefault(); if (this.game.state.phase === 'wave' && this.game.state.groups.length > 0) this.setSpeed(this.speed >= 3 ? 1 : this.speed + 1); else this.startRound(); return; }
    if (lower === 'p') { this.setPaused(true); return; }
    if (lower === 'm') { this.toggleMute(); return; }
    if (lower === 'f') { this.setSpeed(this.speed >= 3 ? 1 : this.speed + 1); return; }
    if (lower === 'a') { this.game.apply({ type: 'autoStart', on: !this.game.state.autoStart }); return; }
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
    this.unlockMenu.update(g.state);
    if (this.placing) this.updateGhost();
  }

  private onEvent(ev: SimEvent): void {
    const st = this.game.state;
    this.r.handle(ev);
    audio.onEvent(ev, st.towers);
    switch (ev.type) {
      case 'roundStart':
        this.banner(t('match.round', { n: ev.round, max: MAX_ROUND }), ev.round === MAX_ROUND ? t('match.bossIncoming') : '');
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
      case 'gameOver': this.onGameOver(ev.result === 'won'); break;
      default: break;
    }
  }

  private onGameOver(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    const box = h('div', `ov-box ${won ? 'won' : 'lost'}`);
    const cont = h('button', 'm-start small', t('match.continue'));
    cont.onclick = () => this.end(false);
    box.append(h('div', 'ov-t', t(won ? 'match.victory' : 'match.defeat')), h('div', 'ov-s', t('match.round', { n: this.game.state.round, max: MAX_ROUND })), cont);
    this.overlay.replaceChildren(box);
    this.overlay.classList.remove('hidden');
    this.endTimer = window.setTimeout(() => this.end(false), 6000);
  }

  private hud(st: GameState): void {
    setText(this.livesEl, String(st.lives));
    setText(this.cashEl, String(st.cash));
    setText(this.roundEl, t('match.round', { n: Math.max(st.round, 0), max: MAX_ROUND }));
    this.startBtn.disabled = this.ended;
    setClass(this.autoBtn, 'on', st.autoStart);
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
        b.append(h('kbd', '', String(i + 1)), h('span', 'ab-n', ABILITY_TEXT[a.id].name), h('div', 'cd'));
        b.onclick = () => this.useAbility(a.id);
        this.abBar.append(b);
      });
    }
    for (const a of st.abilities) {
      const b = this.abBar.querySelector<HTMLElement>(`[data-ab="${a.id}"]`);
      if (!b) continue;
      setClass(b, 'ready', a.ready);
      (b.querySelector('.cd') as HTMLElement).style.height = a.ready ? '0%' : `${(a.cdLeft / Math.max(1, a.cdTotal)) * 100}%`;
    }
  }

  // ------------------------------------------------------------------ Ende
  private end(quit: boolean): void {
    if (this.endTimer) clearTimeout(this.endTimer);
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.keyHandler);
    this.ro?.disconnect();
    audio.setMusic(false);
    const st = this.game.state;
    const result: MatchResult = {
      matchId: this.matchId,
      won: st.phase === 'won',
      round: st.round,
      difficulty: this.opts.difficulty,
      seed: this.opts.seed,
      livesLeft: st.lives,
      pops: { ...st.stats.pops },
      towerXp: { ...st.towerXp },
      towerTiers: { ranger: [...st.maxTier.ranger], bombardier: [...st.maxTier.bombardier], frostcaller: [...st.maxTier.frostcaller] },
      towerXpGained: { ...st.towerXpGained },
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
