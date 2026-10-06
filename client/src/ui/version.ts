/** Version unten rechts: Commit-Hash und Build-Datum (Vite-`define`, siehe vite.config.ts). Besitzer: P1. */
import { t } from '../i18n/t';
import { h } from './dom';

declare const __BUILD_HASH__: string;
declare const __BUILD_DATE__: string;

export const buildInfo = (): { id: string; date: string } => ({
  id: typeof __BUILD_HASH__ === 'string' ? __BUILD_HASH__ : 'dev',
  date: typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : '',
});

export function versionEl(): HTMLElement {
  const b = buildInfo();
  const e = h('div', 'version', t('version.label', { id: b.id, date: b.date || '-' }));
  e.title = e.textContent ?? '';
  return e;
}
