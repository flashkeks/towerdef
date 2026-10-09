import { describe, expect, it } from 'vitest';
import { buyPower, newProfile } from '../src/meta';
import { INSTA_VARIANTS } from '../src/powers/info';
import { priceNote, storeCards } from '../src/powers/store';
import { migrateAudio, toPct, fromPct } from '../src/audio/settings';

describe('Store-Karten', () => {
  it('neun Karten, Preise aus den Daten, Besitz aus dem Inventar', () => {
    const p = newProfile();
    const cards = storeCards(p.embers, p.inventory);
    expect(cards.map((c) => c.id)).toEqual(['goldDrop', 'lanternBomb', 'caltrops', 'frostTrap', 'timeWarp', 'lanternOil', 'extraLives', 'heroBoost', 'instaWarden']);
    expect(cards.find((c) => c.id === 'goldDrop')!.owned).toBe(1); // Startpaket
    expect(cards.find((c) => c.id === 'lanternBomb')!.owned).toBe(1);
    expect(cards.find((c) => c.id === 'caltrops')!.owned).toBe(0);
  });
  it('leistbar / fehlende Embers', () => {
    const c = storeCards(35, {});
    expect(c.find((x) => x.id === 'extraLives')!.affordable).toBe(true);
    const t = c.find((x) => x.id === 'timeWarp')!;
    expect(t.affordable).toBe(false);
    expect(t.missing).toBe(15);
    expect(priceNote(t)).toBe('Need 15 more');
    expect(priceNote(c.find((x) => x.id === 'extraLives')!)).toBe('');
  });
  it('Insta-Warden: Variante waehlt den Schluessel und den Bestand', () => {
    const inv = { 'instaWarden:frostcaller': 2 } as const;
    const c = storeCards(500, inv, 'frostcaller').find((x) => x.id === 'instaWarden')!;
    expect(c.key).toBe('instaWarden:frostcaller');
    expect(c.owned).toBe(2);
    expect(c.perVariant).toEqual({ ranger: 0, bombardier: 0, frostcaller: 2 });
    expect(INSTA_VARIANTS).toHaveLength(3);
  });
  it('Kauf ueber meta: Embers runter, Bestand rauf; zu wenig Embers lehnt ab', () => {
    const p = newProfile(); // 100 Embers
    const r = buyPower(p, 'caltrops');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.profile.embers).toBe(75);
      expect(r.profile.inventory.caltrops).toBe(1);
      const cards = storeCards(r.profile.embers, r.profile.inventory);
      expect(cards.find((x) => x.id === 'caltrops')!.owned).toBe(1);
    }
    const poor = buyPower({ ...p, embers: 10 }, 'instaWarden:ranger');
    expect(poor.ok).toBe(false);
    if (!poor.ok) expect(poor.code).toBe('not-enough-embers');
  });
});

describe('Lautstaerke: alte Einstellungen werden uebernommen', () => {
  it('nichts gespeichert -> Vorgaben, nicht "stored"', () => {
    expect(migrateAudio(null)).toEqual({ settings: { musicVol: 0.5, sfxVol: 0.6 }, stored: false });
    expect(migrateAudio({}).stored).toBe(false);
    expect(migrateAudio('quatsch').stored).toBe(false);
  });
  it('alt: vol -> beide Regler', () => {
    expect(migrateAudio({ vol: 0.4, muted: false, music: true })).toEqual({ settings: { musicVol: 0.4, sfxVol: 0.4 }, stored: true });
  });
  it('alt: muted -> beide 0; music=false -> nur Musik 0', () => {
    expect(migrateAudio({ vol: 0.9, muted: true, music: true }).settings).toEqual({ musicVol: 0, sfxVol: 0 });
    expect(migrateAudio({ vol: 0.9, muted: false, music: false }).settings).toEqual({ musicVol: 0, sfxVol: 0.9 });
  });
  it('neu: musicVol/sfxVol gewinnen, ungueltiges wird begrenzt', () => {
    expect(migrateAudio({ musicVol: 0.2, sfxVol: 1.5, vol: 0.9 }).settings).toEqual({ musicVol: 0.2, sfxVol: 1 });
    expect(migrateAudio({ musicVol: -3 }).settings.musicVol).toBe(0);
    expect(migrateAudio({ musicVol: 'laut' }).settings.musicVol).toBe(0.5);
  });
  it('Prozent <-> Anteil', () => {
    expect(toPct(0.55)).toBe(55);
    expect(fromPct(140)).toBe(1);
    expect(fromPct(-5)).toBe(0);
    expect(fromPct(toPct(0.35))).toBeCloseTo(0.35);
  });
});
