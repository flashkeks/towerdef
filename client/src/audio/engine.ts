/**
 * Ton (Runde 11 / P3): WebAudio, alle Klaenge zur Laufzeit aus Rezepten (`recipes*.ts`) synthetisiert, keine Dateien.
 * Der Match reicht Sim-Events durch `onEvent`; hier wird nur abgebildet, welches Ereignis welchen Klang bekommt.
 * Der AudioContext entsteht erst bei der ersten Nutzeraktion. Lautstaerke und Stumm bleiben in localStorage (try/catch).
 */
import { MUSIC, RECIPES, type Voice } from './recipes';
import { R11_RECIPES } from './recipes-r11';
import type { SimEvent, TowerState } from '../sim';

const MAX_VOICES = 26;
const KEY = 'dw.audio';
type Ctor = typeof AudioContext;

/** Mindestabstand je Klang in ms (gegen Matsch bei Massenpops) */
const MIN_GAP: Record<string, number> = { pop: 28, tink: 60, 'shoot.ranger': 35, 'shoot.volley': 60, 'shoot.frost': 50, 'shoot.chain': 70, 'explode.mini': 50, 'pop.big': 80, 'shoot.hero': 40 };

interface Settings { vol: number; muted: boolean; music: boolean }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { vol: 0.7, muted: false, music: true, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { /* ohne Speicher */ }
  return { vol: 0.7, muted: false, music: true };
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = 0;
  private last = new Map<string, number>();
  private s: Settings = load();
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicNext = 0;
  private musicStep = 0;
  private musicOn = false;
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

  get volume(): number { return this.s.vol; }
  get muted(): boolean { return this.s.muted; }
  setVolume(v: number): void { this.s.vol = Math.max(0, Math.min(1, v)); this.apply(); this.save(); }
  toggleMute(): boolean { this.s.muted = !this.s.muted; this.apply(); this.save(); return this.s.muted; }
  private save(): void { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch { /* egal */ } }
  private apply(): void {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.s.muted ? 0 : this.s.vol * 0.9, this.ctx.currentTime, 0.02);
  }

  private unlock(): void {
    if (!this.ctx) {
      const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC(); } catch { return; }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -12; lim.knee.value = 8; lim.ratio.value = 8; lim.attack.value = 0.003; lim.release.value = 0.12;
      this.master.connect(lim);
      lim.connect(ctx.destination);
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let seed = 1234567;
      for (let i = 0; i < d.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = seed / 0x80000000 - 1; }
      this.apply();
      if (this.musicOn) this.startMusic();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  play(id: string, gain = 1, rate = 1): void {
    this.log.push(id);
    if (this.log.length > 60) this.log.shift();
    const ctx = this.ctx;
    if (!ctx || !this.master || this.s.muted || ctx.state !== 'running') return;
    const now = performance.now();
    const gap = MIN_GAP[id];
    if (gap && now - (this.last.get(id) ?? -1e9) < gap) return;
    this.last.set(id, now);
    const rec = R11_RECIPES[id] ?? RECIPES[id];
    if (!rec) return;
    const t0 = ctx.currentTime + 0.005;
    for (const v of rec) this.voice(v, t0, gain, rate);
  }

  private voice(v: Voice, t0: number, gain: number, rate: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || this.voices >= MAX_VOICES) return;
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
    env.connect(this.master);
    src.stop(end + 0.03);
    this.voices++;
    src.onended = () => { this.voices--; env.disconnect(); };
  }

  // ---------------------------------------------------------------- Events -> Klaenge
  onEvent(ev: SimEvent, towers: readonly TowerState[]): void {
    const rnd = (): number => 0.94 + Math.random() * 0.12;
    switch (ev.type) {
      case 'fire': {
        const t = towers.find((q) => q.id === ev.tower);
        if (ev.kind === 'chain') this.play('shoot.chain', 1, rnd());
        else if (!t) this.play('shoot.ranger');
        else if (t.type === 'bombardier') this.play('shoot.bomb', 1, rnd());
        else if (t.type === 'frostcaller') this.play('shoot.frost', 1, rnd());
        else if (t.type === 'wren') this.play('shoot.hero', 1, rnd());
        else if (ev.kind === 'bigArrow' || ev.kind === 'bolt' || ev.kind === 'starBolt') this.play('shoot.ballista', 1, rnd());
        else if (t.tiers[0] >= 3) this.play('shoot.volley', 1, rnd());
        else this.play('shoot.ranger', 1, rnd());
        break;
      }
      case 'pop': this.play(ev.etype === 'brute' || ev.etype === 'leviathan' ? 'pop.big' : 'pop', 1, 0.9 + Math.random() * 0.4); break;
      case 'blocked': this.play('tink', 1, rnd()); break;
      case 'explode': this.play(ev.kind === 'quake' ? 'quake' : ev.kind === 'mini' ? 'explode.mini' : 'explode', 1, rnd()); break;
      case 'nova': this.play('nova'); break;
      case 'status': if (ev.kind === 'freeze') this.play('freeze', 0.5); break;
      case 'leak': this.play('leak'); break;
      case 'place': this.play('buy'); break;
      case 'upgrade': this.play('upgrade'); break;
      case 'sell': this.play('sell'); break;
      case 'heroLevel': this.play('levelup'); break;
      case 'ability': this.play(ev.id === 'flare' ? 'flare' : 'ability'); break;
      case 'roundStart': this.play(ev.round === 20 ? 'boss' : 'roundStart'); break;
      case 'roundEnd': this.play('roundEnd'); break;
      case 'bossStage': this.play('bossPlate'); break;
      case 'gameOver': this.play(ev.result === 'won' ? 'win' : 'lose'); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- leise Musik (a-Moll-Loop aus MUSIC)
  setMusic(on: boolean): void {
    this.musicOn = on && this.s.music;
    if (this.musicOn) this.startMusic(); else this.stopMusic();
  }
  private startMusic(): void {
    if (this.musicTimer || !this.ctx) return;
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
    if (!ctx || ctx.state !== 'running') return;
    const eighth = 60 / MUSIC.bpm / 2;
    while (this.musicNext < ctx.currentTime + 0.5) {
      const bar = Math.floor(this.musicStep / 8) % MUSIC.bass.length, i = this.musicStep % 8;
      const hz = (semi: number): number => MUSIC.rootHz * Math.pow(2, semi / 12);
      if (i === 0) this.tone('triangle', hz(MUSIC.bass[bar]), this.musicNext, eighth * 7.5, 0.05, 500);
      this.tone('square', hz(MUSIC.bass[bar] + MUSIC.chords[bar][MUSIC.pattern[i]] + 12), this.musicNext, eighth * 0.9, 0.012, 1400);
      this.musicNext += eighth;
      this.musicStep = (this.musicStep + 1) % (MUSIC.bass.length * 8);
    }
  }
  private tone(wave: OscillatorType, hz: number, start: number, dur: number, vol: number, lp: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), env = ctx.createGain();
    o.type = wave; o.frequency.value = hz; f.type = 'lowpass'; f.frequency.value = lp;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(vol, start + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(f); f.connect(env); env.connect(this.master);
    o.start(start); o.stop(start + dur + 0.03);
    o.onended = () => env.disconnect();
  }
}

export const audio = new AudioEngine();
