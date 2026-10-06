/**
 * Läuft viele Matches, optional auf worker_threads. Das Ergebnis ist unabhängig von der Parallelität:
 * jede Spec wird für sich deterministisch gespielt, Ergebnisse werden in Spec-Reihenfolge zusammengesetzt.
 */
import { Worker } from 'node:worker_threads';
import { recordMatch } from './record.js';
import type { MatchSpec, RunRecord } from './types.js';

const isTs = import.meta.url.endsWith('.ts');

export async function runSequential(specs: MatchSpec[], onProgress?: (done: number) => void): Promise<RunRecord[]> {
  const out: RunRecord[] = [];
  for (const s of specs) {
    out.push(await recordMatch(s));
    onProgress?.(out.length);
  }
  return out;
}

export async function runMatches(specs: MatchSpec[], jobs: number, onProgress?: (done: number) => void): Promise<RunRecord[]> {
  if (jobs <= 1 || specs.length < 4) return runSequential(specs, onProgress);
  const n = Math.min(jobs, specs.length);
  // Interleaved Verteilung (gleichmäßige Last), Rückordnung über den Index.
  const parts: { idx: number[]; specs: MatchSpec[] }[] = Array.from({ length: n }, () => ({ idx: [], specs: [] }));
  specs.forEach((s, i) => {
    parts[i % n].idx.push(i);
    parts[i % n].specs.push(s);
  });
  const results = new Array<RunRecord>(specs.length);
  let done = 0;
  await Promise.all(
    parts.map(
      (p) =>
        new Promise<void>((resolve, reject) => {
          const w = new Worker(new URL(isTs ? './worker-boot.mjs' : './worker.js', import.meta.url), { workerData: { specs: p.specs } });
          w.on('message', (m: { type: 'progress' } | { type: 'done'; records: RunRecord[] }) => {
            if (m.type === 'progress') onProgress?.(++done);
            else m.records.forEach((r, k) => (results[p.idx[k]] = r));
          });
          w.on('error', reject);
          w.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`Worker beendet mit Code ${code}`))));
        }),
    ),
  );
  return results;
}
