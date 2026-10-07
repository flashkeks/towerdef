/** Credits. (Das Hauptmenue ist seit Runde 7 die Lobby, `lobby.ts`.) Besitzer: P6. */
import credits from '../../assets/ATTRIBUTIONS.md?raw';
import { t } from '../i18n/t';
import { h } from './dom';
import { renderMarkdown } from './markdown';

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
