/** Credits (Runde 9, P4: im Kit mit Panels, dazu die volle Quellenliste aus `assets/ATTRIBUTIONS.md` zum Aufklappen). Das Hauptmenue ist die Lobby (`lobby.ts`). */
import { t } from '../i18n/t';
import { h } from './dom';
import { crest, icon, panel } from './kit';
import { metaFrame } from './meta-ui';
import type { Nav } from './nav';
import { buildInfo } from './version';

function list(items: string[], ic: string): HTMLElement {
  const ul = h('ul', 'credit-list');
  for (const text of items) {
    const li = h('li');
    li.append(icon(ic), h('span', undefined, text));
    ul.append(li);
  }
  return ul;
}

export function buildCredits(nav: Nav): HTMLElement {
  const f = metaFrame('credits', 'credits.title', nav);
  f.body.append(h('p', 'tagline', t('credits.sub')));

  const about = panel({ title: t('credits.about.title'), corners: true, cls: 'credit-about', tag: 'section' });
  const brand = h('div', 'credit-brand');
  const titles = h('div');
  titles.append(h('h2', 'credit-title', t('game.title')), h('p', 'credit-made', t('credits.about.made')));
  brand.append(crest(), titles);
  about.body.append(brand, h('p', undefined, t('credits.about.text', { title: t('game.title') })), h('p', 'credit-build', `${t('credits.about.build')} - ${t('version.label', { id: buildInfo().id, date: buildInfo().date || '-' })}`));

  const content = panel({ title: t('credits.content.title'), tone: 'violet', tag: 'section' });
  content.body.append(h('p', undefined, t('credits.content.text')));

  const tech = panel({ title: t('credits.tech.title'), tone: 'aether', tag: 'section' });
  tech.body.append(list([t('credits.tech.engine'), t('credits.tech.type'), t('credits.tech.art')], 'sparkle'));

  const grid = h('div', 'credits-grid');
  grid.append(about, content, tech);

  const fold = h('details', 'credits-fold');
  fold.open = true;
  fold.append(h('summary', undefined, t('credits.sources')));
  const table = h('div', 'credits-body');
  for (let i = 0; i < 6; i++) {
    const row = h('div', 'credit-src');
    row.append(h('strong', undefined, t(`credits.src.${i}.name`)), h('span', undefined, t(`credits.src.${i}.use`)));
    table.append(row);
  }
  fold.append(table);
  f.body.append(grid, fold);
  return f.box;
}
