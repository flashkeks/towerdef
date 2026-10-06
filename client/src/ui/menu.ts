/** Hauptmenue und Credits. Besitzer: P6. */
import credits from '../../assets/ATTRIBUTIONS.md?raw';
import { t } from '../i18n/t';
import { h } from './dom';
import { renderMarkdown } from './markdown';

export interface MenuHandlers {
  onPlay(): void;
  onSettings(): void;
  onCredits(): void;
}

export function buildMenu(handlers: MenuHandlers): HTMLElement {
  const box = h('div', 'dialog menu');
  box.append(h('h1', 'title', t('game.title')), h('p', 'tagline', t('start.tagline')));
  const col = h('div', 'menu-col');
  const items: [string, string, () => void][] = [
    ['play', 'menu.play', handlers.onPlay],
    ['settings', 'menu.settings', handlers.onSettings],
    ['credits', 'menu.credits', handlers.onCredits],
  ];
  for (const [id, key, fn] of items) {
    const b = h('button', `btn menu-${id}${id === 'play' ? ' primary' : ''}`, t(key));
    b.type = 'button';
    b.addEventListener('click', fn);
    col.append(b);
  }
  box.append(col);
  return box;
}

export function buildCredits(onBack: () => void): HTMLElement {
  const box = h('div', 'dialog credits');
  box.append(h('h1', 'title small', t('credits.title')));
  const body = renderMarkdown(credits);
  body.classList.add('credits-body');
  box.append(body);
  const back = h('button', 'btn menu-back', t('menu.back'));
  back.addEventListener('click', onBack);
  box.append(back);
  return box;
}
