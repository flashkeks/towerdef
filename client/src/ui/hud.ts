/** Kopfzeile: Leben, Muenzen, Welle, Start/Pause, Geschwindigkeit, Stufe. Besitzer: P1 (Bedienbarkeit); Leak-Wackeln (P5) haengt hier an. */
import { t } from '../i18n/t';
import { SPEEDS, type Session } from '../game/session';
import { hudModel } from '../view/model';
import { h, setClass, setText } from './dom';

export class Hud {
  readonly el = h('header', 'hud');
  private livesFill = h('div', 'bar-fill lives');
  private livesText = h('span', 'val');
  private coinsText = h('span', 'val coins');
  private waveText = h('span', 'val');
  private countdownText = h('span', 'sub');
  private startBtn = h('button', 'btn primary start');
  private pauseBtn = h('button', 'btn pause');
  private speedBtns: HTMLButtonElement[] = [];
  private diffText = h('span', 'sub');
  private session: Session | null = null;

  constructor(onHelp: () => void = () => undefined) {
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
    const help = h('button', 'btn help-btn', t('help.button'));
    help.title = t('help.title');
    help.addEventListener('click', onHelp);
    this.el.append(lives, coins, wave, this.startBtn, this.pauseBtn, speeds, this.diffText, help);
  }

  bind(session: Session): void {
    this.session = session;
    this.diffText.textContent = t('hud.difficulty', { name: t(`difficulty.${session.difficulty}`) });
  }

  unbind(): void {
    this.session = null;
  }

  /** Jeden Frame. Gibt die Nummer der naechsten Welle zurueck (null = keine mehr), die Panels brauchen sie. */
  update(s: Session): number | null {
    const hud = hudModel(s.sim.state, s.totalWaves, s.waveTimerTicks);
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
    return hud.nextWave;
  }
}
