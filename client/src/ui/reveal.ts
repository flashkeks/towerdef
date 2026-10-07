/**
 * Zieh-Animation (Runde 8, P4): Siegel und Lichtsaeule in der Farbe der besten Seltenheit, danach Rampenlicht fuer jede Karte ab Legendary
 * (Blitz, Funken, grosses Portraet mit Namensschild), alle anderen klappen schnell in die Uebersicht. Am Ende steht die Uebersicht aller Karten
 * (bei 10 Zuegen 5 x 2). Ein Klick (irgendwo), Esc oder der Knopf ueberspringt zur Uebersicht; ein weiterer schliesst. Das Ergebnis steht beim
 * Zeigen schon fest, die Animation aendert nichts. Ablaufplan ohne DOM: `reveal-model.ts`.
 */
import type { PullBatchResult } from '../backend/meta';
import { t } from '../i18n/t';
import { h } from './dom';
import { burstField, portraitCard, sigil } from './kit';
import { rarityName, unitName } from './meta-model';
import { REVEAL_HUE, revealPlan } from './reveal-model';
import { unitMeta } from './unit-card';

/** Karte einer Ziehung (Uebersicht und Rampenlicht). */
function pullCard(p: PullBatchResult['pulls'][number], big: boolean): HTMLElement {
  const m = unitMeta(p.unitId, p.rarity);
  const c = portraitCard({ unitId: p.unitId, name: m.name, rarity: p.rarity, elements: m.elements, trait: p.isNew ? t('summon.new') : undefined, live: big, bare: false, cls: big ? 'rv-big' : 'reveal-card' });
  c.querySelector('.pc-sub')?.replaceChildren(h('span', 'pc-lvl', p.isNew ? t('summon.new') : t('summon.duplicate')));
  return c;
}

export function openReveal(batch: Pick<PullBatchResult, 'pulls'>): Promise<void> {
  return new Promise((resolve) => {
    const pulls = batch.pulls;
    const plan = revealPlan(pulls.map((p) => p.rarity));
    const layer = h('div', `reveal${pulls.length === 1 ? ' single' : ''}`);
    layer.setAttribute('role', 'dialog');
    layer.dataset.count = String(pulls.length);
    layer.dataset.best = plan.best;
    layer.dataset.phase = 'gate';
    layer.style.setProperty('--intro', `${plan.introMs}ms`);

    const bg = h('div', 'rv-bg');
    const gate = h('div', 'rv-gate');
    gate.append(sigil('rv-sigil a'), sigil('rv-sigil b'), h('div', 'rv-beam'), h('div', 'rv-core'));
    const canvas = h('canvas', 'rv-fx');
    const spot = h('div', 'rv-spot');
    const flash = h('div', 'rv-flash');
    const cards = h('div', 'reveal-cards');
    const nodes = pulls.map((p) => pullCard(p, false));
    cards.append(...nodes);
    const done = h('button', 'btn primary reveal-done', t('summon.reveal.skip'));
    done.type = 'button';
    layer.append(bg, gate, canvas, spot, flash, cards, done);

    const fx = burstField(canvas);
    let skipped = false;
    let finished = false;
    let closableAt = 0;
    const wakers = new Set<() => void>();
    const wait = (ms: number): Promise<void> =>
      new Promise((res) => {
        if (skipped) return res();
        const fin = (): void => {
          clearTimeout(id);
          wakers.delete(fin);
          res();
        };
        const id = setTimeout(fin, ms);
        wakers.add(fin);
      });

    const finish = (wasSkipped: boolean): void => {
      if (finished) return;
      finished = true;
      skipped = true;
      wakers.forEach((w) => w());
      layer.dataset.phase = 'done';
      layer.classList.add('finished');
      nodes.forEach((n) => n.classList.add('in'));
      spot.replaceChildren();
      if (wasSkipped) {
        layer.classList.add('skipped');
        closableAt = Date.now() + 300; // Doppelklick soll nicht gleich zumachen
      }
      done.textContent = t('summon.reveal.done');
    };

    const run = async (): Promise<void> => {
      const hue = REVEAL_HUE[plan.best];
      await wait(plan.introMs * 0.55);
      fx.burst(hue, 26, 3);
      await wait(plan.introMs * 0.45);
      if (skipped) return;
      layer.dataset.phase = 'cards';
      for (const step of plan.steps) {
        if (skipped) return;
        const p = pulls[step.index]!;
        if (step.spotlight) {
          const big = pullCard(p, true);
          const m = unitMeta(p.unitId, p.rarity);
          const plate = h('div', 'rv-plate');
          plate.append(h('span', `rv-rarity r-${step.rarity}`, rarityName(p.rarity)), h('strong', 'rv-name', unitName(p.unitId)), h('span', `rv-new${p.isNew ? ' on' : ''}`, p.isNew ? t('summon.new') : t('summon.duplicate')));
          void m;
          spot.dataset.rarity = step.rarity;
          spot.replaceChildren(big, plate);
          spot.classList.remove('in');
          void spot.offsetWidth;
          spot.classList.add('in');
          flash.dataset.rarity = step.rarity;
          flash.classList.remove('go');
          void flash.offsetWidth;
          flash.classList.add('go');
          const h2 = REVEAL_HUE[step.rarity];
          fx.burst(h2, step.rarity === 'secret' || step.rarity === 'mythic' ? 90 : 50, step.rarity === 'secret' ? 7 : 5);
          if (step.rarity === 'secret' || step.rarity === 'mythic') {
            layer.classList.add('shake');
            setTimeout(() => layer.classList.remove('shake'), 600);
          }
          await wait(step.ms);
          if (skipped) return;
          spot.classList.add('out');
          await wait(220);
          spot.replaceChildren();
          spot.classList.remove('out');
        }
        nodes[step.index]!.classList.add('in');
        if (!step.spotlight) await wait(step.ms);
      }
      await wait(350);
      finish(false);
    };

    const close = (): void => {
      document.removeEventListener('keydown', onKey, true);
      skipped = true;
      wakers.forEach((w) => w());
      layer.remove();
      resolve();
    };
    const step = (): void => {
      if (!finished) finish(true);
      else if (Date.now() >= closableAt) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      step();
    };
    document.addEventListener('keydown', onKey, true);
    layer.addEventListener('click', step);
    document.body.append(layer);
    done.focus();
    void run();
  });
}

declare global {
  interface Window {
    /** Debug-Zugriff (Screenshots, Playwright): Animation mit frei gewaehltem Ergebnis zeigen. Rechnet nichts, buchbar ist nichts. */
    __ui?: { openReveal: typeof openReveal };
  }
}
window.__ui = { openReveal };
