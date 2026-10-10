/**
 * Ton (Runde 11 / P3): WebAudio, alle Klaenge zur Laufzeit aus Rezepten (`recipes*.ts`) synthetisiert, keine Dateien.
 * Der Match reicht Sim-Events durch `onEvent`; hier wird nur abgebildet, welches Ereignis welchen Klang bekommt.
 * Der AudioContext entsteht erst bei der ersten Nutzeraktion. Lautstaerke und Stumm bleiben in localStorage (try/catch).
 */
import { MUSIC, RECIPES, type Voice } from './recipes';
import { R11_RECIPES } from './recipes-r11';
import { R12_RECIPES } from './recipes-r12';
import { R13_RECIPES } from './recipes-r13';
import { r13Sound } from './r13-map';
import { R14_RECIPES } from './recipes-r14';
import { r14Sound } from './r14-map';
import { MENU_THEMES, type MenuThemeId, type MusicTheme } from './recipes-ui';
import { AUDIO_KEY, fromPct, migrateAudio, toPct, type AudioSettings, type VolumeApi } from './settings';
import { commitHit, towerGapMs, towerLoudness, towerPitch, topTier, windowGain, type Hit } from './tower-vol';
import type { SimEvent, TowerState } from '../sim';

const MAX_VOICES = 26;
/** Feste Mischfaktoren (Max, 09.10.2026): Effekte x0,7, Musik x0,8; die Regler zeigen weiter 0-100 %. */
export const MIX_SFX = 0.7;
export const MIX_MUSIC = 0.8;
type Ctor = typeof AudioContext;

/** Mindestabstand je Klang in ms (gegen Matsch bei Massenpops) */
const MIN_GAP: Record<string, number> = { pop: 28, tink: 60, 'shoot.ranger': 35, 'shoot.volley': 60, 'shoot.frost': 50, 'shoot.chain': 70, 'explode.mini': 50, 'pop.big': 80, 'shoot.hero': 40, 'power.trapHit': 45, 'embers.count': 40, income: 150, 'coin.land': 90, ricochet: 60, mark: 200, 'shoot.snipe': 40, 'shoot.thorn': 45, 'shoot.potion': 45, 'splash.acid': 60, zone: 400, 'wall.eat': 90, vine: 120, bounty: 80, whirlwind: 300 };

function load(): { s: AudioSettings; stored: boolean } {
  try {
    const raw = localStorage.getItem(AUDIO_KEY);
    if (raw) { const m = migrateAudio(JSON.parse(raw)); return { s: m.settings, stored: m.stored }; }
  } catch { /* ohne Speicher */ }
  return { s: migrateAudio(null).settings, stored: false };
}

/** Musik-Stimmung: Match oder eine der Menue-Stimmungen (`MENU_THEMES`). */
export type MusicId = 'match' | MenuThemeId;
const MATCH_THEME: MusicTheme = { bpm: MUSIC.bpm, rootHz: MUSIC.rootHz, bass: MUSIC.bass, chords: MUSIC.chords, pattern: MUSIC.pattern, arpWave: 'square', arpVol: 0.012, arpLp: 1400, arpOct: 12, padVol: 0 };
const themeOf = (id: MusicId): MusicTheme => (id === 'match' ? MATCH_THEME : MENU_THEMES[id]);

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  /** Kurz-Stumm (Taste M), nicht gespeichert */
  quiet = false;
  private noise: AudioBuffer | null = null;
  private voices = 0;
  private last = new Map<string, number>();
  /** angenommene Turm-Klaenge im Gleitfenster (Lautstaerke-Summe deckeln) */
  private recent: Hit[] = [];
  private loaded = load();
  private s: AudioSettings = this.loaded.s;
  private theme: MusicId | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicNext = 0;
  private musicStep = 0;
  readonly log: string[] = [];
  private bound = false;
  private onUnlock = (): void => this.unlock();

  /** Haengt die Entsperr-Ereignisse an (erste Eingabe). */
  attach(): void {
    if (this.bound || typeof window === 'undefined') return;
    this.bound = true;
    window.addEventListener('pointerdown', this.onUnlock, { capture: true });
    window.addEventListener('keydown', this.onUnlock, { capture: true });
  }
  detach(): void {
    window.removeEventListener('pointerdown', this.onUnlock, { capture: true });
    window.removeEventListener('keydown', this.onUnlock, { capture: true });
    this.bound = false;
    this.stopMusic();
  }

  /** Fuer Tests/Smoke: Zustand des AudioContext (null = noch nicht entsperrt). */
  get ctxState(): string | null { return this.ctx?.state ?? null; }
  get musicVol(): number { return this.s.musicVol; }
  get sfxVol(): number { return this.s.sfxVol; }
  /** Gab es schon gespeicherte Einstellungen? (sonst darf das alte Profil-Volume als Vorgabe dienen) */
  get hasSaved(): boolean { return this.loaded.stored; }
  setMusicVol(v: number): void { this.s.musicVol = Math.max(0, Math.min(1, v)); this.loaded.stored = true; this.apply(); this.save(); }
  setSfxVol(v: number): void { this.s.sfxVol = Math.max(0, Math.min(1, v)); this.loaded.stored = true; this.apply(); this.save(); }
  /** Vorgabe aus dem alten Profil (0..100), nur wenn noch nichts gespeichert ist. */
  adoptLegacy(pct: number): void {
    if (this.loaded.stored) return;
    this.s = { musicVol: fromPct(pct) * 0.7, sfxVol: fromPct(pct) };
    this.apply();
  }
  toggleQuiet(): boolean { this.quiet = !this.quiet; this.apply(); return this.quiet; }
  /** Zeiger fuer die Regler in Match, Menues und Einstellungen. */
  readonly volumeApi: VolumeApi = (() => {
    const self = this;
    return {
      get: () => ({ music: toPct(self.s.musicVol), sfx: toPct(self.s.sfxVol) }),
      set: (kind: 'music' | 'sfx', pct: number) => (kind === 'music' ? self.setMusicVol(fromPct(pct)) : self.setSfxVol(fromPct(pct))),
      toggleQuiet: () => self.toggleQuiet(),
      get quiet() { return self.quiet; },
    };
  })();
  private save(): void { try { localStorage.setItem(AUDIO_KEY, JSON.stringify(this.s)); } catch { /* egal */ } }
  private apply(): void {
    if (!this.ctx || !this.master || !this.sfxBus || !this.musicBus) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.quiet ? 0 : 0.9, t, 0.02);
    this.sfxBus.gain.setTargetAtTime(this.s.sfxVol * MIX_SFX, t, 0.02);
    this.musicBus.gain.setTargetAtTime(this.s.musicVol * MIX_MUSIC, t, 0.05);
  }

  private unlock(): void {
    if (!this.ctx) {
      const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch { return; }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.master);
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -12; lim.knee.value = 8; lim.ratio.value = 8; lim.attack.value = 0.003; lim.release.value = 0.12;
      this.master.connect(lim);
      lim.connect(ctx.destination);
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let seed = 1234567;
      for (let i = 0; i < d.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = seed / 0x80000000 - 1; }
      this.apply();
      if (this.theme) this.startMusic();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  /** Turm-Klang: Pegel nach hoechster Stufe, Mindestabstand je Schluessel und Summenbegrenzung. */
  playTower(id: string, key: string, top: number, rate = 1, base = 1): void {
    const now = performance.now();
    const k = `${key}`;
    if (now - (this.last.get(k) ?? -1e9) < towerGapMs(top)) return;
    const g = windowGain(this.recent, now, base * towerLoudness(top));
    if (g <= 0) return;
    this.last.set(k, now);
    commitHit(this.recent, now, g);
    this.play(id, g, rate * towerPitch(top));
  }

  play(id: string, gain = 1, rate = 1): void {
    this.log.push(id);
    if (this.log.length > 60) this.log.shift();
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.s.sfxVol <= 0 || ctx.state === 'closed') return;
    if (ctx.state === 'suspended') void ctx.resume(); // erster Klick im Menue: Klang wird eingeplant und startet mit dem Resume
    const now = performance.now();
    const gap = MIN_GAP[id];
    if (gap && now - (this.last.get(id) ?? -1e9) < gap) return;
    this.last.set(id, now);
    const rec = R14_RECIPES[id] ?? R13_RECIPES[id] ?? R12_RECIPES[id] ?? R11_RECIPES[id] ?? RECIPES[id];
    if (!rec) return;
    const t0 = ctx.currentTime + 0.005;
    for (const v of rec) this.voice(v, t0, gain, rate);
  }

  private voice(v: Voice, t0: number, gain: number, rate: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || this.voices >= MAX_VOICES) return;
    const start = t0 + (v.delay ?? 0), end = start + v.dur;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(Math.max(0.0002, v.vol * gain), start + (v.attack ?? 0.004));
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    let src: AudioScheduledSourceNode;
    if (v.wave === 'noise') {
      const n = ctx.createBufferSource();
      n.buffer = this.noise; n.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(v.f0 * rate, start);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * rate), end);
      n.connect(f); f.connect(env);
      n.start(start, Math.random() * 0.5);
      src = n;
    } else {
      const o = ctx.createOscillator();
      o.type = v.wave;
      o.frequency.setValueAtTime(v.f0 * rate, start);
      if (v.f1 !== v.f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * rate), end);
      if (v.vibHz && v.vibSemi) {
        const lfo = ctx.createOscillator(), depth = ctx.createGain();
        lfo.frequency.value = v.vibHz; depth.gain.value = v.vibSemi * 100;
        lfo.connect(depth); depth.connect(o.detune);
        lfo.start(start); lfo.stop(end + 0.02);
      }
      if (v.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = v.lp; o.connect(f); f.connect(env); } else o.connect(env);
      o.start(start);
      src = o;
    }
    env.connect(this.sfxBus);
    src.stop(end + 0.03);
    this.voices++;
    src.onended = () => { this.voices--; env.disconnect(); };
  }

  // ---------------------------------------------------------------- Events -> Klaenge
  onEvent(ev: SimEvent, towers: readonly TowerState[]): void {
    const rnd = (): number => 0.94 + Math.random() * 0.12;
    const p13 = r14Sound(ev, towers) ?? r13Sound(ev, towers);
    if (p13) {
      if (p13.tower) this.playTower(p13.id, p13.tower.key, p13.tower.top, rnd(), p13.tower.base);
      else this.play(p13.id, p13.gain ?? 1, rnd());
      return;
    }
    switch (ev.type) {
      case 'fire': {
        const t = towers.find((q) => q.id === ev.tower);
        const top = t ? topTier(t.tiers) : 0;
        if (ev.kind === 'chain') this.playTower('shoot.chain', 'fire.chain', top, rnd());
        else if (!t) this.playTower('shoot.ranger', 'fire.ranger', 0, rnd());
        else if (t.type === 'bombardier') this.playTower('shoot.bomb', 'fire.bombardier', top, rnd());
        else if (t.type === 'frostcaller') this.playTower('shoot.frost', 'fire.frostcaller', top, rnd());
        else if (t.type === 'wren' || t.type === 'bram' || t.type === 'sela') this.play('shoot.hero', 0.6, rnd());
        else if (ev.kind === 'bigArrow' || ev.kind === 'bolt' || ev.kind === 'starBolt') this.playTower('shoot.ballista', `fire.${t.type}`, top, rnd());
        else if (t.tiers[0] >= 3) this.playTower('shoot.volley', `fire.${t.type}`, top, rnd());
        else this.playTower('shoot.ranger', `fire.${t.type}`, top, rnd());
        break;
      }
      case 'pop': this.play(ev.etype === 'brute' || ev.etype === 'leviathan' ? 'pop.big' : 'pop', 1, 0.9 + Math.random() * 0.4); break;
      case 'blocked': this.play('tink', 1, rnd()); break;
      case 'explode': {
        if (ev.kind === 'bomb' && ev.radius === 40000) { this.play('power.bomb', 1, rnd()); break; }
        const id = ev.kind === 'quake' ? 'quake' : ev.kind === 'mini' ? 'explode.mini' : 'explode';
        // Aufprall so laut wie der naechste Turm es verdient (Sim-Event hat keine Turm-ID)
        let best: TowerState | null = null, bd = Infinity;
        for (const q of towers) { if (q.type === 'wren' || q.type === 'bram' || q.type === 'sela') continue; const d = (q.x - ev.x) ** 2 + (q.y - ev.y) ** 2; if (d < bd) { bd = d; best = q; } }
        this.playTower(id, `hit.${id}`, best ? topTier(best.tiers) : 0, rnd());
        break;
      }
      case 'nova': this.play('nova'); break;
      case 'status': if (ev.kind === 'freeze') this.play('freeze', 0.5); break;
      case 'leak': this.play('leak'); break;
      case 'place': this.play('buy'); break;
      case 'upgrade': this.play('upgrade'); break;
      case 'sell': this.play('sell'); break;
      case 'heroLevel': this.play('levelup'); break;
      case 'ability': this.play(ev.id === 'flare' ? 'flare' : 'ability'); break;
      case 'power': {
        const k = ev.power;
        this.play(k === 'goldDrop' ? 'power.gold' : k === 'lanternBomb' ? 'power.throw' : k === 'caltrops' ? 'power.trap' : k === 'frostTrap' ? 'power.trapFrost' : k === 'timeWarp' ? 'power.warp'
          : k === 'lanternOil' ? 'power.oil' : k === 'extraLives' ? 'power.heart' : k === 'heroBoost' ? 'power.hero' : 'power.insta');
        break;
      }
      case 'trap': this.play(ev.kind === 'frostTrap' ? 'power.trapFreeze' : 'power.trapHit', 1, rnd()); break;
      case 'trapGone': this.play(ev.kind === 'frostTrap' ? 'power.trapFrost' : 'power.trap', 0.6); break;
      case 'roundStart': this.play(ev.round === 20 ? 'boss' : 'roundStart'); break;
      case 'roundEnd': this.play('roundEnd'); break;
      case 'bossStage': this.play('bossPlate'); break;
      case 'gameOver': this.play(ev.result === 'won' ? 'win' : 'lose'); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- Musik (Match und Menues, ueber den Musik-Bus)
  /** Stimmung wechseln (null = aus). Gleiche Stimmung laeuft einfach weiter. */
  setTheme(id: MusicId | null): void {
    if (id === this.theme && (id === null || this.musicTimer)) return;
    this.theme = id;
    this.stopMusic();
    if (id) this.startMusic();
  }
  /** Altes Schalter-API: an = Match-Musik, aus = still. */
  setMusic(on: boolean): void { this.setTheme(on ? 'match' : null); }
  private startMusic(): void {
    if (this.musicTimer || !this.ctx || !this.theme) return;
    this.musicNext = this.ctx.currentTime + 0.2;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.schedule(), 120);
  }
  private stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || !this.theme) return;
    const th = themeOf(this.theme);
    const eighth = 60 / th.bpm / 2;
    const bars = th.bass.length;
    while (this.musicNext < ctx.currentTime + 0.5) {
      const bar = Math.floor(this.musicStep / 8) % bars, i = this.musicStep % 8;
      const hz = (semi: number): number => th.rootHz * Math.pow(2, semi / 12);
      if (i === 0) {
        this.tone(th.bassWave ?? 'triangle', hz(th.bass[bar]), this.musicNext, th.bounce ? eighth * 3.6 : eighth * 7.5, th.bassVol ?? 0.05, th.bassLp ?? 500);
        if (th.padVol > 0) for (const c of th.chords[bar].slice(0, 3)) this.tone('sine', hz(th.bass[bar] + c + 12), this.musicNext, eighth * 7.8, th.padVol * 0.45, 900, 0.5);
      }
      if (th.bounce && i === 4) this.tone(th.bassWave ?? 'triangle', hz(th.bass[bar] + 7), this.musicNext, eighth * 3.2, (th.bassVol ?? 0.05) * 0.8, th.bassLp ?? 500);
      const ln = th.lead?.[bar]?.[i];
      if (ln != null) this.tone(th.leadWave ?? 'triangle', hz(ln), this.musicNext, eighth * 1.6, th.leadVol ?? 0.03, th.leadLp ?? 3000, 0.008);
      if (th.hatVol && i % 2 === 1) this.hat(this.musicNext, th.hatVol);
      this.tone(th.arpWave, hz(th.bass[bar] + th.chords[bar][th.pattern[i]] + th.arpOct), this.musicNext, eighth * 0.9, th.arpVol, th.arpLp);
      this.musicNext += eighth;
      this.musicStep = (this.musicStep + 1) % (bars * 8);
    }
  }
  /** Leises Hi-Hat: kurzer Rauschklick durch einen Hochpass. */
  private hat(start: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus || !this.noise) return;
    const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), env = ctx.createGain();
    n.buffer = this.noise; n.loop = true; f.type = 'highpass'; f.frequency.value = 6500;
    env.gain.setValueAtTime(vol, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + 0.05);
    n.connect(f); f.connect(env); env.connect(this.musicBus);
    n.start(start, Math.random() * 0.5); n.stop(start + 0.07);
    n.onended = () => env.disconnect();
  }
  private tone(wave: OscillatorType, hz: number, start: number, dur: number, vol: number, lp: number, attack = 0.02): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), env = ctx.createGain();
    o.type = wave; o.frequency.value = hz; f.type = 'lowpass'; f.frequency.value = lp;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(vol, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(f); f.connect(env); env.connect(this.musicBus);
    o.start(start); o.stop(start + dur + 0.03);
    o.onended = () => env.disconnect();
  }
}

export const audio = new AudioEngine();
