/** Kopfzeile: Leben, Muenzen, Welle, Start/Pause, Geschwindigkeit, Stufe. Besitzer: P1 (Bedienbarkeit); Leak-Wackeln (P5) haengt hier an. */
import { t } from '../i18n/t';
import { SPEEDS, type Session } from '../game/session';
import { hudModel } from '../view/model';
import { flyerWarning } from '../view/readability';
import { clear, h, setClass, setText } from './dom';
import { icon } from './kit';

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
  private readonly track = h('div', 'wave-track');
  private segs: HTMLElement[] = [];
  private lastWave = -1;
  private session: Session | null = null;

  constructor(onHelp: () => void = () => undefined) {
    const lives = h('div', 'stat lives');
    lives.title = t('hud.lives');
    const heart = h('span', 'stat-ic heart');
    heart.append(icon('heart', 'fill'));
    const livesBar = h('div', 'bar');
    livesBar.append(this.livesFill);
    lives.append(heart, livesBar, this.livesText);
    const coins = h('div', 'stat coinstat');
    coins.title = t('hud.coins');
    const coin = h('span', 'stat-ic coin');
    coin.append(icon('coin'));
    coins.append(coin, this.coinsText);
    const wave = h('div', 'stat wave');
    const waveHead = h('div', 'wave-head');
    waveHead.append(this.waveText, this.countdownText);
    wave.append(waveHead, this.track);
    this.startBtn.addEventListener('click', () => this.session?.startNextWave());
    this.pauseBtn.addEventListener('click', () => this.session?.togglePause());
    const speeds = h('div', 'speeds');
    for (const s of SPEEDS) {
      const b = h('button', 'btn speed', t('hud.speed', { n: s }));
      b.type = 'button';
      b.dataset.speed = String(s);
      b.addEventListener('click', () => this.session?.setSpeed(s));
      this.speedBtns.push(b);
      speeds.append(b);
    }
    const help = h('button', 'btn help-btn', t('help.button'));
    help.type = 'button';
    help.title = t('help.title');
    help.addEventListener('click', onHelp);
    this.el.append(lives, coins, wave, this.startBtn, this.pauseBtn, speeds, this.diffText, help);
    this.startBtn.type = 'button';
    this.pauseBtn.type = 'button';
  }

  bind(session: Session): void {
    this.session = session;
    this.diffText.textContent = t('hud.difficulty', { name: t(`difficulty.${session.difficulty}`) });
    // Wellenleiste: ein Segment je Welle, Boss-Wellen rot markiert (aus der Vorschau der Sim)
    clear(this.track);
    this.segs = [];
    this.lastWave = -1;
    for (let n = 1; n <= session.totalWaves; n++) {
      const seg = h('span', 'seg');
      const p = session.sim.previewWave(n);
      if (p?.boss) seg.classList.add('boss');
      else if (p?.elite) seg.classList.add('elite');
      this.segs.push(seg);
      this.track.append(seg);
    }
  }

  unbind(): void {
    this.session = null;
  }

  /** Jeden Frame. Gibt die Nummer der naechsten Welle zurueck (null = keine mehr), die Panels brauchen sie. */
  update(s: Session): number | null {
    const st = s.sim.state;
    const hud = hudModel(st, s.totalWaves, s.waveTimerTicks);
    setText(this.livesText, `${hud.lives} / ${hud.maxLives}`);
    this.livesFill.style.width = `${Math.round(hud.livesRatio * 100)}%`;
    setClass(this.livesFill, 'low', hud.livesRatio < 0.3);
    setText(this.coinsText, String(hud.coins));
    if (hud.wave !== this.lastWave) {
      this.lastWave = hud.wave;
      this.segs.forEach((seg, i) => {
        setClass(seg, 'done', i + 1 < hud.wave);
        setClass(seg, 'now', i + 1 === hud.wave);
      });
    }
    setText(this.waveText, hud.wave === 0 ? t('hud.prep') : t('hud.wave', { wave: hud.wave, total: hud.totalWaves }));
    setText(this.countdownText, hud.countdownSeconds !== null ? t('hud.countdown', { s: hud.countdownSeconds }) : hud.finalWave ? t('hud.lastWave') : '');
    const noAir = hud.nextWave !== null && (flyerWarning(s.nextPreview(hud.nextWave), st.units, s.sim.catalog())?.airUnits ?? 1) === 0;
    setClass(this.startBtn, 'warn-air', noAir);
    this.startBtn.title = noAir ? t('hud.startWave.noair.tip') : '';
    setText(this.startBtn, hud.nextWave === null ? t('hud.lastWave') : t(noAir ? 'hud.startWave.noair' : 'hud.startWave', { n: hud.nextWave }));
    this.startBtn.disabled = !hud.canStartWave;
    setText(this.pauseBtn, s.paused ? t('hud.resume') : t('hud.pause'));
    this.speedBtns.forEach((b) => setClass(b, 'active', b.dataset.speed === String(s.speed)));
    return hud.nextWave;
  }
}
