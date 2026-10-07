import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatReport, OLD_RULES_MESSAGE, parseReplay, replay, REPLAY_FORMAT_VERSION } from '../scripts/replay.js';
import { runMatch } from '../src/bots/index.js';

const dir = new URL('../../docs/balancing/playtests/', import.meta.url).pathname;
const beispiele = readdirSync(dir).filter((f) => /^beispiel-.*\.json$/.test(f));
const dateien = readdirSync(dir).filter((f) => f.endsWith('.json'));
const load = (f: string) => parseReplay(readFileSync(join(dir, f), 'utf8'));
// Spielbar ist nur das aktuelle Format v4 (Runde 8, AA-Baukasten); v1 bis v3 sind „altes Regelwerk“.
const v2 = beispiele.filter((f) => load(f).formatVersion >= 4);

describe('Replay (Export aus dem Browser nachspielen)', () => {
  it('es gibt mindestens ein eingechecktes v4-Beispiel (vom Simulator selbst erzeugt)', () => {
    expect(v2.length).toBeGreaterThan(0);
  });
  it('das Format ist v4: Positionen statt Slot-IDs', () => {
    expect(REPLAY_FORMAT_VERSION).toBe(4);
    for (const f of v2) {
      const places = load(f).commands.filter((c) => c.cmd.type === 'place');
      expect(places.length).toBeGreaterThan(0);
      for (const c of places) expect(c.cmd).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
    }
  });
  for (const f of v2) {
    const file = load(f);
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
      // verschobene Position: andere Zustände, anderer Hash (oder abgelehnt)
      const bad3 = structuredClone(file);
      const p = bad3.commands.find((c) => c.ok && c.cmd.type === 'place')!;
      (p.cmd as { x: number }).x += 137;
      expect(replay(bad3).ok).toBe(false);
    });
    it(`${f}: Bot-Vergleich läuft (gleiche Stufe, gleicher Seed)`, () => {
      const cmp = runMatch({ stage: file.stage, difficulty: file.difficulty, players: file.players, seed: file.seed, bots: ['mono-goku_ssj3'] });
      expect(cmp.seed).toBe(file.seed);
      expect(formatReport(file, replay(file), cmp)).toContain('Bot-Lauf mono-goku_ssj3');
    });
  }

  // v1 (Slot-IDs, Regelwerk bis Runde 5): bleibt als Dokument liegen, wird als „altes Regelwerk“ erkannt und nicht nachgespielt.
  const alt = dateien.filter((f) => load(f).formatVersion < 4);
  it('die v1-Dateien (Beispiel und Max-Playtest) liegen noch da', () => {
    expect(alt).toEqual(expect.arrayContaining(['beispiel-normal.json', '2026-10-07-max-normal-loss.json']));
  });
  for (const f of alt) {
    it(`${f}: wird als altes Regelwerk erkannt, ohne Hash-Fehler und ohne Absturz`, () => {
      const file = load(f);
      const rep = replay(file);
      expect(rep.ok).toBe(false);
      expect(rep.oldRules).toBe(true);
      expect(rep.problems).toEqual([OLD_RULES_MESSAGE]);
      expect(OLD_RULES_MESSAGE).toBe('altes Regelwerk (v1-v3, vor dem AA-Baukasten)');
      const text = formatReport(file, rep);
      expect(text).toContain('altes Regelwerk');
      expect(text).not.toContain('ABWEICHUNG');
      expect(rep.bought).not.toEqual({}); // Käufe aus der Datei gelesen
    });
  }
  it('npm run replay: v1 meldet „altes Regelwerk“ mit Exit-Code 3, v4 gibt 0', async () => {
    const { spawnSync } = await import('node:child_process');
    const run = (f: string) => spawnSync('npx', ['tsx', 'scripts/replay.ts', join(dir, f)], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
    const old = run('2026-10-07-max-normal-loss.json');
    expect(old.status).toBe(3);
    expect(old.stderr).toContain('altes Regelwerk');
    expect(old.stderr).not.toMatch(/\n\s+at \S+ \(/); // kein Stacktrace
    expect(old.stderr).not.toContain('Error');
    const ok = run(v2[0]);
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain('Hash: OK');
  }, 60000);
  it('v2- und v3-Dateien (Runden 6/7) werden gelesen und als altes Regelwerk gemeldet, nicht nachgespielt', () => {
    for (const v of [2, 3]) {
      const f = parseReplay(JSON.stringify({ format: 'towerdef-replay', formatVersion: v, stage: 'standard20', difficulty: 'normal', players: 1, seed: 1, endTick: 10, endHash: 'x', commands: [] }));
      const r = replay(f);
      expect(r.oldRules).toBe(true);
      expect(r.ok).toBe(false);
    }
  });
  it('kaputte Dateien werden abgelehnt', () => {
    expect(() => parseReplay('{"format":"x"}')).toThrow();
    expect(() => parseReplay('{"format":"towerdef-replay","formatVersion":3}')).toThrow();
    expect(() => parseReplay('{"format":"towerdef-replay","formatVersion":5}')).toThrow(/nicht unterst/);
  });
});
