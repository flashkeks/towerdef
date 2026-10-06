import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatReport, parseReplay, replay } from '../scripts/replay.js';
import { runMatch } from '../src/bots/index.js';

const dir = new URL('../../docs/balancing/playtests/', import.meta.url).pathname;
const beispiele = readdirSync(dir).filter((f) => /^beispiel-.*\.json$/.test(f));

describe('Replay (Export aus dem Browser nachspielen)', () => {
  it('es gibt mindestens eine eingecheckte Beispieldatei', () => {
    expect(beispiele.length).toBeGreaterThan(0);
  });
  for (const f of beispiele) {
    const file = parseReplay(readFileSync(join(dir, f), 'utf8'));
    it(`${f}: gleicher End-Hash und gleiches Ergebnis`, () => {
      const rep = replay(file);
      expect(rep.problems).toEqual([]);
      expect(rep.ok).toBe(true);
      expect(rep.hash).toBe(file.endHash);
      expect(rep.result).toBe(file.result);
      expect(formatReport(file, rep)).toContain('Hash: OK');
    });
    it(`${f}: veränderter Befehl wird erkannt`, () => {
      const bad = structuredClone(file);
      const i = bad.commands.findIndex((c) => c.ok && c.cmd.type === 'place');
      bad.commands.splice(i, 1);
      expect(replay(bad).ok).toBe(false);
      const bad2 = structuredClone(file);
      bad2.endHash = '0000000000000000';
      expect(replay(bad2).ok).toBe(false);
    });
    it(`${f}: Bot-Vergleich läuft (gleiche Stufe, gleicher Seed)`, () => {
      const cmp = runMatch({ stage: file.stage, difficulty: file.difficulty, players: file.players, seed: file.seed, bots: ['wide@normal'] });
      expect(cmp.seed).toBe(file.seed);
      expect(formatReport(file, replay(file), cmp)).toContain('Bot-Lauf wide@normal');
    });
  }
  it('kaputte Dateien werden abgelehnt', () => {
    expect(() => parseReplay('{"format":"x"}')).toThrow();
    expect(() => parseReplay('{"format":"duskwardens-replay","formatVersion":2}')).toThrow();
  });
});
