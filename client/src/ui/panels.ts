/** Seitenleiste, oberer Teil: Wellenvorschau und Risikokarten. Neue Rundenhinweise von P3 (Boss-Kits) landen in der Vorschau. */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import type { WavePreview } from '../sim';
import { compactNumber, previewModel } from '../view/model';
import { airCapable, bossHelpers, flyerWarning, joinOr } from '../view/readability';
import { clear, h, setClass } from './dom';
import { unitName } from './meta-model';

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
    const defs = s.sim.catalog();
    const warn = flyerWarning(p, s.sim.state.units, defs);
    const sig = p ? `${p.wave}|${p.card ?? ''}|${warn ? warn.airUnits : '-'}` : 'none';
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
    if (warn) {
      const none = warn.airUnits === 0;
      const list = joinOr(airCapable(s.teamCatalog()).slice(0, 3).map((d) => unitName(d.id)), t('tips.or'));
      const text = none ? (list ? t('preview.flyers.none', { list }) : t('preview.flyers.none.plain')) : t('preview.flyers.ok', { n: warn.airUnits });
      const box2 = h('div', `flyer-warning ${none ? 'none' : 'ok'}`);
      box2.dataset.air = String(warn.airUnits);
      box2.append(h('span', 'sym fly', t('preview.flyers.icon')), h('span', 'text', text));
      box.append(box2);
    }
    const ul = h('ul', 'rows');
    for (const r of m.rows) {
      const li = h('li');
      if (r.flying) li.classList.add('flying');
      const cnt = h('span', 'cnt');
      if (r.flying) cnt.append(h('span', 'sym fly', t('preview.flyers.icon')));
      cnt.append(t('preview.group', { count: r.count, name: t(`enemy.${r.type}.name`) }));
      li.append(cnt);
      const extras: string[] = r.modifiers.map((x) => t(x.key, x.params));
      if (r.flying) extras.push(t('preview.flying'));
      if (r.element > 0) extras.push(t('preview.element', { n: r.element }));
      if (extras.length) li.append(h('span', 'mods', extras.join(', ')));
      ul.append(li);
    }
    box.append(ul, h('p', 'total', t('preview.total', { count: m.enemyCount, hp: compactNumber(m.totalHp) })));
    if (m.boss) {
      const hp = bossHelpers(s.teamCatalog());
      const list = joinOr([...hp.stun, ...hp.nuke].map((d) => unitName(d.id)), t('tips.or'));
      box.append(h('p', 'boss-help', list ? t('preview.boss.help.units', { list }) : t('preview.boss.help')));
    }
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
