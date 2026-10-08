/**
 * Wo Pakete geoeffnet werden (Runde 10, P3): jede Quelle von Mehrfach-Ergebnissen macht ihre Daten zu `Prize`-Listen (`reveal-model.ts`, getestet)
 * und oeffnet sie mit demselben Bildschirm (`reveal.ts`). Die Bildschirme rufen nur diese Funktionen auf.
 */
import type { MatchReward, RaidPurchase } from '../backend/meta';
import { materialName } from '../backend/meta';
import { t } from '../i18n/t';
import { openPrizes } from './reveal';
import { prizesFromCrystalOrder, prizesFromReward, prizesFromStarter, type Prize } from './reveal-model';
import { unitMeta } from './unit-card';

const rarityOf = (id: string): string => unitMeta(id).rarity;

/** Starter-Paket (Lobby). */
export function openStarterPack(gift: { crystals: number; units: readonly string[] }): Promise<void> {
  return openPrizes(prizesFromStarter(gift, rarityOf), { title: t('reveal.title.starter') });
}

/** Gewinne eines Matches (Ergebnis-Bildschirm). */
export function rewardPrizes(r: MatchReward): Prize[] {
  return prizesFromReward(r, {
    material: materialName,
    rarityOf,
    firstClear: t('reveal.firstClear'),
    milestone: (n) => t('reveal.milestone', { n }),
  });
}

export function openRewardPack(r: MatchReward): Promise<void> {
  return openPrizes(rewardPrizes(r), { title: t('reveal.title.reward'), charge: 'short' });
}

/** Crystal-Paket aus dem Shop: Basis und Bonus als zwei Karten. */
export function openCrystalPack(o: { crystals: number; bonusCrystals: number }): Promise<void> {
  return openPrizes(prizesFromCrystalOrder(o, t('reveal.bonus')), { title: t('reveal.title.shop'), charge: 'short' });
}

/** Raid-Shop: eine gekaufte Unit wird mit dem vollen Aufbau enthuellt. Waehrung und Material laufen ueber Meldung und Zaehler. */
export function openRaidPurchase(p: RaidPurchase): Promise<void> {
  if (p.kind !== 'unit' || !p.unitId) return Promise.resolve();
  return openPrizes([{ kind: 'unit', unitId: p.unitId, rarity: rarityOf(p.unitId), isNew: p.isNew !== false }], { title: t('reveal.title.shop') });
}
