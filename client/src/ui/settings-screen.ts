/** Einstellungs-Bildschirm. Werte gehen ueber `settings.ts` in den Speicher. Besitzer: P6. */
import { t } from '../i18n/t';
import { h } from './dom';
import { getSettings, resetHints, setSetting, type Settings } from './settings';

type VolumeKey = 'master' | 'sfx' | 'music';

function slider(key: VolumeKey): HTMLElement {
  const row = h('label', 'set-row');
  const out = h('span', 'set-val');
  const input = h('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.step = '5';
  input.dataset.setting = key;
  const show = (v: number): void => {
    out.textContent = `${Math.round(v * 100)}%`;
  };
  input.value = String(Math.round(getSettings()[key] * 100));
  show(getSettings()[key]);
  input.addEventListener('input', () => {
    const v = Number(input.value) / 100;
    setSetting(key, v);
    show(v);
  });
  row.append(h('span', 'set-lbl', t(`settings.${key}`)), input, out);
  return row;
}

export function buildSettings(onBack: () => void): HTMLElement {
  const box = h('div', 'dialog settings');
  box.append(h('h1', 'title small', t('settings.title')));
  box.append(slider('master'), slider('sfx'), slider('music'), h('p', 'set-note', t('settings.note')));

  const dmg = h('label', 'set-row');
  const check = h('input');
  check.type = 'checkbox';
  check.dataset.setting = 'damageNumbers';
  check.checked = getSettings().damageNumbers;
  check.addEventListener('change', () => setSetting('damageNumbers', check.checked));
  dmg.append(h('span', 'set-lbl', t('settings.damageNumbers')), check);

  const speed = h('div', 'set-row');
  speed.append(h('span', 'set-lbl', t('settings.speed')));
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
  speed.append(btns);

  const hints = h('div', 'set-row');
  const hintBtn = h('button', 'btn reset-hints', t('settings.hints'));
  const done = h('span', 'set-val');
  hintBtn.addEventListener('click', () => {
    resetHints();
    done.textContent = t('settings.hints.done');
  });
  hints.append(hintBtn, done);

  const back = h('button', 'btn menu-back', t('menu.back'));
  back.addEventListener('click', onBack);
  box.append(dmg, speed, hints, back);
  return box;
}
