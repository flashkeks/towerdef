/** Seitenleiste, oberer Teil: Wellenvorschau und Risikokarten. Neue Rundenhinweise von P3 (Boss-Kits) landen in der Vorschau. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { WavePreview } from '../sim';
import { compactNumber, previewModel } from '../view/model';
import { clear, h, setClass } from './dom';

export class WavePanels {
  readonly previewEl = h('section', 'panel preview');
  readonly cardsEl = h('section', 'panel cards');
  private sigs = { preview: '', cards: '' };

  bind(): void {
    this.sigs = { preview: '', cards: '' };
  }

  update(s: Session, nextWave: number | null): void {
    this.updatePreview(s, nextWave);
    this.updateCards(s, nextWave);
  }

  private updatePreview(s: Session, nextWave: number | null): void {
    const p: WavePreview | null = nextWave === null ? null : s.nextPreview(nextWave);
    const sig = p ? `${p.wave}|${p.card ?? ''}` : 'none';
    if (sig === this.sigs.preview) return;
    this.sigs.preview = sig;
    const box = this.previewEl;
    clear(box);
    if (!p) {
      box.append(h('p', 'muted', t('preview.none')));
      return;
    }
    const m = previewModel(p);
    box.append(h('h3', undefined, t('preview.title', { n: m.wave })));
    if (m.boss) box.append(h('div', 'tag boss', t('preview.boss')));
    else if (m.elite) box.append(h('div', 'tag elite', t('preview.elite')));
    const ul = h('ul', 'rows');
    for (const r of m.rows) {
      const li = h('li');
      li.append(h('span', 'cnt', t('preview.group', { count: r.count, name: t(`enemy.${r.type}.name`) })));
      const extras: string[] = r.modifiers.map((x) => t(x.key, x.params));
      if (r.flying) extras.push(t('preview.flying'));
      if (r.element > 0) extras.push(t('preview.element', { n: r.element }));
      if (extras.length) li.append(h('span', 'mods', extras.join(', ')));
      ul.append(li);
    }
    box.append(ul, h('p', 'total', t('preview.total', { count: m.enemyCount, hp: compactNumber(m.totalHp) })));
    if (m.bossKit) {
      box.append(h('p', 'kit', t('preview.bossKit', { name: t(`boss.kit.${m.bossKit.id}`), phases: m.bossKit.phases })));
      if (m.bossKit.abilities.length) box.append(h('p', 'kit', t('preview.abilities', { list: m.bossKit.abilities.map((a) => t(`boss.ability.${a}`)).join(', ') })));
    }
  }

  private updateCards(s: Session, nextWave: number | null): void {
    const p = nextWave === null ? null : s.nextPreview(nextWave);
    const cur = s.sim.state.nextCard;
    const sig = `${nextWave}|${p?.cardAllowed ?? false}|${cur ?? ''}`;
    if (sig === this.sigs.cards) return;
    this.sigs.cards = sig;
    const box = this.cardsEl;
    clear(box);
    box.append(h('h3', undefined, t('cards.title')));
    if (!p) return;
    if (!p.cardAllowed) {
      box.append(h('p', 'muted', t('cards.blocked')));
      return;
    }
    const none = h('button', 'card none', t('cards.none'));
    none.dataset.card = 'none';
    setClass(none, 'active', cur === null);
    none.addEventListener('click', () => s.chooseCard(null));
    box.append(none);
    for (const c of [...s.sim.cards()].sort((a, b) => a.tier - b.tier)) {
      const b = h('button', `card tier${c.tier}`);
      b.dataset.card = c.id;
      b.append(h('strong', undefined, t(`card.${c.id}.name`)), h('span', undefined, t(`card.${c.id}.text`)));
      setClass(b, 'active', cur === c.id);
      b.addEventListener('click', () => s.chooseCard(cur === c.id ? null : c.id));
      box.append(b);
    }
  }
}
