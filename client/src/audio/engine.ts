/**
 * Ton-Motor (P5): synthetisiert alle Klaenge zur Laufzeit mit WebAudio (eigene Werke, keine Dateien).
 * Haengt nur am `GameBus` und am Schuss-Signal des `Fx`; liest den Sim-Zustand nie und schreibt nie hinein.
 * AudioContext entsteht erst bei der ersten Nutzeraktion (Autoplay-Regeln). Lautstaerke aus den Einstellungen (master x sfx, master x music), Stumm-Taste M.
 */
import type { GameBus } from '../game/events';
import { getSettings, readJson, writeJson } from '../ui/settings';
import type { HitStyle } from '../view/feel';
import { crowdGain, effectiveVolume, RateLimiter, shotSound, soundsFor, type SoundId } from './logic';
import { MUSIC, RECIPES, type Voice } from './recipes';
import type { Session } from '../game/session';

/** Gleichzeitige Stimmen (Obergrenze gegen Knackser und CPU-Last). */
const MAX_VOICES = 28;
const MUTE_KEY = 'dw.muted';

type Ctor = typeof AudioContext;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private voices = 0;
  private recent: number[] = [];
  private readonly limiter = new RateLimiter();
  private session: Session | null = null;
  private muted = false;
  /** Zuletzt gesetzte Ziel-Lautstaerke (der Gain-Wert selbst wird in Chromium ohne laufende Quellen nicht aktualisiert und taugt nicht zum Auslesen). */
  private sfxTarget = -1;
  private musicTarget = -1;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicNext = 0;
  private musicStep = 0;

  constructor(bus: GameBus, onShot: (fn: (style: HitStyle) => void) => () => void) {
    this.muted = readJson(MUTE_KEY) === true;
    bus.onRunStart((s) => {
      this.session = s;
      this.limiter.reset();
    });
    bus.onEvents((events) => {
      for (const e of events) for (const id of soundsFor(e)) this.play(id);
    });
    bus.onCommand((rec) => {
      if (!rec.result.ok) this.play('error');
    });
    onShot((style) => this.play(shotSound(style), 1, 0.92 + Math.random() * 0.16));
    if (typeof window === 'undefined') return;
    const unlock = (): void => this.unlock();
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    window.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
    window.setInterval(() => this.applyVolumes(), 150);
  }

  /** Zustand fuer Pruefskripte (`scripts/audio-check.mjs`): kein Eingriff ins Spiel. */
  get debug(): { state: string; muted: boolean; voices: number; sfxGain: number; musicGain: number } {
    return { state: this.ctx?.state ?? 'none', muted: this.muted, voices: this.voices, sfxGain: this.sfxTarget, musicGain: this.musicTarget };
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    writeJson(MUTE_KEY, this.muted);
    this.applyVolumes();
    this.session?.notify({ key: this.muted ? 'audio.muted' : 'audio.unmuted' });
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target;
    if (el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    this.toggleMute();
  }

  /** Erste Nutzeraktion: AudioContext anlegen (oder fortsetzen) und die Musik starten. */
  private unlock(): void {
    if (!this.ctx) {
      const AC: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const ctx = this.ctx;
      this.sfxGain = ctx.createGain();
      this.musicGain = ctx.createGain();
      // Begrenzer gegen Uebersteuern, wenn viele Klaenge zusammenfallen
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 8;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.12;
      this.sfxGain.connect(limiter);
      this.musicGain.connect(limiter);
      limiter.connect(ctx.destination);
      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let seed = 1234567;
      for (let i = 0; i < len; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        d[i] = (seed / 0x80000000) - 1;
      }
      this.applyVolumes();
      this.startMusic();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const s = getSettings();
    const now = this.ctx.currentTime;
    const sfx = effectiveVolume(s, 'sfx', this.muted);
    // Musik liegt bewusst leiser als die Effekte (Grundpegel 0.5)
    const music = effectiveVolume(s, 'music', this.muted) * 0.5;
    if (sfx !== this.sfxTarget) this.sfxGain.gain.setTargetAtTime(sfx, now, 0.02);
    if (music !== this.musicTarget) this.musicGain.gain.setTargetAtTime(music, now, 0.05);
    this.sfxTarget = sfx;
    this.musicTarget = music;
  }

  /** Klang abspielen (nach Drosselung). `rate` verstimmt leicht, damit gleiche Klaenge nicht ermueden. */
  play(id: SoundId, gain = 1, rate = 1): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || ctx.state !== 'running' || this.muted) return;
    const nowMs = performance.now();
    if (!this.limiter.allow(id, nowMs)) return;
    if (effectiveVolume(getSettings(), 'sfx', false) <= 0) return;
    this.recent = this.recent.filter((x) => nowMs - x < 500);
    const g = gain * crowdGain(this.recent.length);
    this.recent.push(nowMs);
    const t0 = ctx.currentTime + 0.005;
    for (const v of RECIPES[id]) this.voice(v, t0, g, rate);
  }

  private voice(v: Voice, t0: number, gain: number, rate: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxGain || this.voices >= MAX_VOICES) return;
    const start = t0 + (v.delay ?? 0);
    const end = start + v.dur;
    const env = ctx.createGain();
    const attack = v.attack ?? 0.004;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(Math.max(0.0002, v.vol * gain), start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    let src: AudioScheduledSourceNode;
    if (v.wave === 'noise') {
      const n = ctx.createBufferSource();
      n.buffer = this.noise;
      n.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(v.f0 * rate, start);
      f.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * rate), end);
      n.connect(f);
      f.connect(env);
      n.start(start, Math.random() * 0.5);
      src = n;
    } else {
      const o = ctx.createOscillator();
      o.type = v.wave;
      o.frequency.setValueAtTime(v.f0 * rate, start);
      if (v.f1 !== v.f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, v.f1 * rate), end);
      if (v.vibHz && v.vibSemi) {
        const lfo = ctx.createOscillator();
        const depth = ctx.createGain();
        lfo.frequency.value = v.vibHz;
        depth.gain.value = v.vibSemi * 100;
        lfo.connect(depth);
        depth.connect(o.detune);
        lfo.start(start);
        lfo.stop(end + 0.02);
      }
      if (v.lp) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = v.lp;
        o.connect(f);
        f.connect(env);
      } else o.connect(env);
      o.start(start);
      src = o;
    }
    env.connect(this.sfxGain);
    src.stop(end + 0.03);
    this.voices++;
    src.onended = () => {
      this.voices--;
      env.disconnect();
    };
  }

  // ---- Musik: einfacher erzeugter Loop (a-Moll, Bass + Arpeggio + Flaeche) ------------------------------------------

  private startMusic(): void {
    if (this.musicTimer || !this.ctx) return;
    this.musicNext = this.ctx.currentTime + 0.2;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 120);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') {
      if (ctx) this.musicNext = Math.max(this.musicNext, ctx.currentTime + 0.1);
      return;
    }
    const silent = this.muted || effectiveVolume(getSettings(), 'music', false) <= 0;
    const eighth = 60 / MUSIC.bpm / 2;
    while (this.musicNext < ctx.currentTime + 0.5) {
      if (silent) this.musicNext = Math.max(this.musicNext, ctx.currentTime + 0.05);
      else this.note(this.musicNext, this.musicStep);
      this.musicNext += eighth;
      this.musicStep = (this.musicStep + 1) % (MUSIC.bass.length * 8);
    }
  }

  private tone(wave: OscillatorType, hz: number, start: number, dur: number, vol: number, lp: number, attack = 0.01): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const env = ctx.createGain();
    o.type = wave;
    o.frequency.value = hz;
    f.type = 'lowpass';
    f.frequency.value = lp;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(vol, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(f);
    f.connect(env);
    env.connect(this.musicGain);
    o.start(start);
    o.stop(start + dur + 0.03);
    o.onended = () => env.disconnect();
  }

  private note(at: number, step: number): void {
    const bar = Math.floor(step / 8);
    const i = step % 8;
    const hz = (semi: number): number => MUSIC.rootHz * Math.pow(2, semi / 12);
    const bass = MUSIC.bass[bar];
    if (i === 0 || i === 4) this.tone('triangle', hz(bass), at, 0.5, 0.2, 700);
    if (i === 0) this.tone('sine', hz(bass + 19), at, 2.6, 0.07, 1800, 0.5);
    const arp = MUSIC.chords[bar][MUSIC.pattern[i]];
    this.tone('square', hz(bass + arp + 12), at, 0.2, 0.05, 1500);
  }
}

/** Fuer Tests und Texte: i18n-Schluessel der Stumm-Meldungen. */
export const MUTE_KEYS = ['audio.muted', 'audio.unmuted'] as const;
