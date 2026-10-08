/**
 * Einstellungs-Bildschirm im Kit (Runde 9, P4): zwei Spalten mit Panels (Audio, Spiel, Speicherstand, Hilfe).
 * Werte gehen ueber `settings.ts` in den Speicher. Besitzer: P6, neu gebaut von P4 (Runde 9).
 */
import { t } from '../i18n/t';
import { h } from './dom';
import { icon, panel } from './kit';
import { exportSaveFile, importSaveFlow, metaFrame, resetFlow } from './meta-ui';
import type { Nav } from './nav';
import { getSettings, resetHints, setSetting, type Settings } from './settings';

type VolumeKey = 'master' | 'sfx' | 'music';

const VOLUME_ICON: Record<VolumeKey, string> = { master: 'summon', sfx: 'bolt', music: 'sparkle' };

/** Eine Zeile: links Beschriftung mit Unterzeile, rechts das Bedienelement. */
function row(label: string, sub: string | null, control: HTMLElement, ic?: string): HTMLElement {
  const el = h('div', 'set-row');
  if (ic) {
    const b = h('span', 'set-ic');
    b.append(icon(ic));
    el.append(b);
  }
  const copy = h('span', 'set-copy');
  copy.append(h('span', 'set-lbl', label));
  if (sub) copy.append(h('span', 'set-sub', sub));
  el.append(copy, control);
  return el;
}

function slider(key: VolumeKey): HTMLElement {
  const wrap = h('label', 'set-slider');
  const out = h('span', 'set-val');
  const input = h('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.step = '5';
  input.dataset.setting = key;
  const show = (v: number): void => {
    out.textContent = `${Math.round(v * 100)}%`;
    input.style.setProperty('--pct', `${Math.round(v * 100)}%`);
  };
  input.value = String(Math.round(getSettings()[key] * 100));
  show(getSettings()[key]);
  input.addEventListener('input', () => {
    const v = Number(input.value) / 100;
    setSetting(key, v);
    show(v);
  });
  wrap.append(input, out);
  const r = row(t(`settings.${key}`), null, wrap, VOLUME_ICON[key]);
  r.classList.add('is-slider');
  return r;
}

/** Speicherstand (Runde 7, P4): Export als Datei, Import aus Datei, Zuruecksetzen mit Bestaetigung. Nach Import/Reset geht es zurueck in die Lobby (`onChanged`). */
function saveSection(onChanged: () => void): HTMLElement {
  const sec = panel({ title: t('save.title'), tone: 'aether', cls: 'save-section', tag: 'section' });
  sec.body.append(h('p', 'set-note', t('save.note')));
  const btn = (cls: string, ic: string, text: string, fn: () => void): HTMLButtonElement => {
    const b = h('button', `btn ${cls}`);
    b.type = 'button';
    b.append(icon(ic), text);
    b.addEventListener('click', fn);
    return b;
  };
  const rowEl = h('div', 'save-row');
  rowEl.append(
    btn('save-export', 'arrow', t('save.export'), () => void exportSaveFile()),
    btn('save-import', 'up', t('save.import'), () => void importSaveFlow(true).then((ok) => ok && onChanged())),
    btn('danger save-reset', 'reroll', t('save.reset'), () => void resetFlow().then((ok) => ok && onChanged())),
  );
  sec.body.append(rowEl);
  return sec;
}

export function buildSettings(nav: Nav): HTMLElement {
  const f = metaFrame('settings', 'settings.title', nav);
  const onBack = (): void => nav.lobby();
  f.body.append(h('p', 'tagline', t('settings.sub')));
  const grid = h('div', 'settings-grid');
  const left = h('div', 'settings-col');
  const right = h('div', 'settings-col');

  const audio = panel({ title: t('settings.group.audio'), tone: 'violet', tag: 'section' });
  const mm = h('label', 'switch');
  const mmCheck = h('input');
  mmCheck.type = 'checkbox';
  mmCheck.dataset.setting = 'menuMusic';
  mmCheck.checked = getSettings().menuMusic;
  mmCheck.addEventListener('change', () => setSetting('menuMusic', mmCheck.checked));
  mm.append(mmCheck, h('span', 'switch-knob'));
  audio.body.append(slider('master'), slider('sfx'), slider('music'), row(t('settings.menuMusic'), t('settings.menuMusic.sub'), mm, 'sparkle'), h('p', 'set-note', t('settings.note')));

  const play = panel({ title: t('settings.group.play'), tag: 'section' });
  const dmg = h('label', 'switch');
  const check = h('input');
  check.type = 'checkbox';
  check.dataset.setting = 'damageNumbers';
  check.checked = getSettings().damageNumbers;
  check.addEventListener('change', () => setSetting('damageNumbers', check.checked));
  dmg.append(check, h('span', 'switch-knob'));
  const shk = h('label', 'switch');
  const shkCheck = h('input');
  shkCheck.type = 'checkbox';
  shkCheck.dataset.setting = 'screenShake';
  shkCheck.checked = getSettings().screenShake;
  shkCheck.addEventListener('change', () => setSetting('screenShake', shkCheck.checked));
  shk.append(shkCheck, h('span', 'switch-knob'));
  const btns = h('div', 'speeds');
  const mark = (): void => btns.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.speed === String(getSettings().defaultSpeed)));
  for (const s of [1, 2, 3] as const) {
    const b = h('button', 'btn speed', t('hud.speed', { n: s }));
    b.type = 'button';
    b.dataset.speed = String(s);
    b.addEventListener('click', () => {
      setSetting('defaultSpeed', s as Settings['defaultSpeed']);
      mark();
    });
    btns.append(b);
  }
  mark();
  play.body.append(row(t('settings.damageNumbers'), t('settings.damageNumbers.sub'), dmg, 'sword'), row(t('settings.shake'), t('settings.shake.sub'), shk, 'bolt'), row(t('settings.speed'), t('settings.speed.sub'), btns, 'fast'));

  const help = panel({ title: t('settings.group.help'), tone: 'ember', tag: 'section' });
  const hintBtn = h('button', 'btn reset-hints', t('settings.hints.btn'));
  hintBtn.type = 'button';
  const done = h('span', 'set-done');
  hintBtn.addEventListener('click', () => {
    resetHints();
    done.textContent = t('settings.hints.done');
  });
  const ctl = h('span', 'set-ctl');
  ctl.append(done, hintBtn);
  help.body.append(row(t('settings.hints'), t('settings.hints.sub'), ctl, 'help'));

  left.append(audio, play);
  right.append(saveSection(onBack), help);
  grid.append(left, right);
  f.body.append(grid);
  return f.box;
}
