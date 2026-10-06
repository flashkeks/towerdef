/** worker_threads-Einstieg: spielt die übergebenen Specs der Reihe nach und liefert die RunRecords. */
import { parentPort, workerData } from 'node:worker_threads';
import { recordMatch } from './record.js';
import type { MatchSpec, RunRecord } from './types.js';

const specs = (workerData as { specs: MatchSpec[] }).specs;
const records: RunRecord[] = [];
for (const s of specs) {
  records.push(recordMatch(s));
  parentPort?.postMessage({ type: 'progress' });
}
parentPort?.postMessage({ type: 'done', records });
