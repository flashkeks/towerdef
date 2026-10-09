import { describe, expect, it } from 'vitest';
import { DATA, TICKS_PER_SECOND, getMap } from '../src/index';

describe('Daten', () => {
  it('60 Ticks je Sekunde', () => expect(TICKS_PER_SECOND).toBe(60));

  it('3 Türme x 3 Pfade x 5 Stufen, Preise steigen je Pfad', () => {
    for (const k of ['ranger', 'bombardier', 'frostcaller'] as const) {
      expect(DATA.towers[k].paths).toHaveLength(3);
      for (const p of DATA.towers[k].paths) {
        expect(p.tiers).toHaveLength(5);
        for (let i = 1; i < 5; i++) expect(p.tiers[i].price).toBeGreaterThan(p.tiers[i - 1].price);
        for (const t of p.tiers) {
          expect(t.name.length).toBeGreaterThan(2);
          expect(t.desc.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it('Preise wie in tuerme.md', () => {
    const price = (k: 'ranger' | 'bombardier' | 'frostcaller', p: number) => DATA.towers[k].paths[p].tiers.map((t) => t.price);
    expect(DATA.towers.ranger.price).toBe(200);
    expect(price('ranger', 0)).toEqual([120, 180, 450, 1300, 4200]);
    expect(price('ranger', 1)).toEqual([90, 160, 500, 1500, 4600]);
    expect(price('ranger', 2)).toEqual([80, 170, 600, 1500, 4400]);
    expect(DATA.towers.bombardier.price).toBe(350);
    expect(price('bombardier', 0)).toEqual([250, 400, 1000, 2600, 5200]);
    expect(price('bombardier', 1)).toEqual([200, 250, 750, 2200, 4600]);
    expect(price('bombardier', 2)).toEqual([150, 300, 850, 2400, 5000]);
    expect(DATA.towers.frostcaller.price).toBe(300);
    expect(price('frostcaller', 0)).toEqual([120, 300, 900, 2400, 5000]);
    expect(price('frostcaller', 1)).toEqual([180, 380, 1000, 2700, 5400]);
    expect(price('frostcaller', 2)).toEqual([200, 250, 1100, 3000, 5800]);
    expect(DATA.hero.wren.price).toBe(540);
  });

  it('Held: 20 Level, XP wie Tabelle, Summe 100+30r bis R20 = 8300', () => {
    const lv = DATA.hero.wren.levels;
    expect(lv).toHaveLength(20);
    expect(lv.map((l) => l.xp)).toEqual([0, 100, 230, 400, 600, 850, 1150, 1500, 1900, 2350, 2850, 3400, 4000, 4650, 5300, 5950, 6600, 7200, 7750, 8250]);
    let sum = 0;
    for (let r = 1; r <= 20; r++) sum += 100 + 30 * r;
    expect(sum).toBe(8300);
  });

  it('RBE je Gegnertyp (Medium) wie gegner.md', () => {
    expect(DATA.rbe).toMatchObject({ red: 1, blue: 2, green: 3, gold: 4, ironshell: 9, ember: 9, brute: 28, leviathan: 412 });
  });

  it('20 Runden: RBE wie runden.md', () => {
    const expected = [20, 35, 45, 70, 94, 110, 170, 152, 186, 240, 162, 286, 260, 366, 384, 424, 688, 576, 1034, 932];
    // Tabellenwerte sind "RBE"; Runde 15/17/19/20 enthalten Brutes (28), Tabelle nennt 384/688/1034/932
    const got = DATA.rounds.map((r) => r.groups.reduce((a, g) => a + g.n * DATA.rbe[g.type], 0));
    expect(got).toEqual(expected);
  });

  it('Runden: Pop-Cash (Schichten) wie runden.md', () => {
    const cash = [20, 35, 45, 70, 94, 110, 170, 152, 186, 240, 162, 286, 260, 366, 312, 424, 544, 576, 800, 606];
    // Cash = Schichten x 1, Boss-Hülle 100: brute 19, leviathan 176 (Boss-Hülle 100 + 4 Brutes)
    const per = { red: 1, blue: 2, green: 3, gold: 4, ironshell: 9, ember: 9, brute: 19, leviathan: 176 };
    const got = DATA.rounds.map((r) => r.groups.reduce((a, g) => a + g.n * per[g.type], 0));
    expect(got).toEqual(cash);
  });

  it('Karte meadow: Weg ≈ 1650 px lang, Fläche passt', () => {
    const m = getMap('meadow');
    expect(m.path.length).toBeGreaterThan(1_550_000);
    expect(m.path.length).toBeLessThan(1_750_000);
    expect(m.halfWidth).toBe(13000);
  });

  it('Schwierigkeiten', () => {
    expect(DATA.difficulties.easy.lives).toBe(200);
    expect(DATA.difficulties.medium.lives).toBe(150);
    expect(DATA.difficulties.hard.lives).toBe(100);
    expect(DATA.difficulties.easy.bossHp).toBe(200);
  });
});
