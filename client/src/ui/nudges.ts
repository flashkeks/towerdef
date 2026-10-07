/**
 * Dezente Hinweise unten links im Spielfeld (Runde 6, P4): "You have coins to spend" nach Leaks bei vollem Konto und
 * "Ability ready" bei bereiter Faehigkeit. Nur Anzeige, Regeln in `view/readability.ts`. Leaks kommen vom `GameBus`.
 */
import { t } from '../i18n/t';
import type { Session } from '../game/session';
import { coinNudge } from '../view/readability';
import { h, setClass, setText } from './dom';

export class Nudges {
  readonly el = h('div', 'nudges');
  private coins = h('div', 'nudge coins hidden');
  private lastLeak: number | null = null;
  private off: (() => void) | null = null;

  constructor() {
    this.el.append(this.coins);
  }

  bind(s: Session): void {
    this.off?.();
    this.lastLeak = null;
    this.off = s.bus.onEvents((events, tick) => {
      if (events.some((e) => e.type === 'leak')) this.lastLeak = tick;
    });
    setClass(this.coins, 'hidden', true);
  }

  update(s: Session): void {
    const st = s.sim.state;
    const coins = st.players[0]?.coins ?? 0;
    const team = s.teamCatalog();
    const cheapest = team.length ? Math.min(...team.map((d) => s.sim.placeCost(0, d.id))) : 0;
    const since = this.lastLeak === null ? null : st.tick - this.lastLeak;
    const showCoins = !s.over && coinNudge(coins, cheapest, since);
    setClass(this.coins, 'hidden', !showCoins);
    if (showCoins) setText(this.coins, t('nudge.coins', { n: coins }));
  }
}
