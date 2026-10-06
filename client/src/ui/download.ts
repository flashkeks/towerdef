/**
 * Replay-Download (Runde 5 / P2): JSON-Datei aus der Aufzeichnung, ohne Server und ohne Upload.
 * - `replayDownloadBox()`: Freitextfeld "What felt bad?" + Knopf; fuer den End-Bildschirm (P6 darf es umbauen/umziehen).
 * - `mountPauseDownload(bus)`: eigener kleiner Knopf, solange die Runde pausiert ist (haengt am Bus, keine fremde Datei).
 */
import { t } from '../i18n/t';
import type { GameBus } from '../game/events';
import { getRecorder, replayFileName } from '../game/recorder';
import { h } from './dom';

/** Laedt den aktuellen Stand (fertig oder Zwischenstand) als JSON herunter. Gibt den Dateinamen zurueck oder null. */
export function downloadReplay(): string | null {
  const rec = getRecorder();
  const snap = rec?.snapshot();
  if (!snap) return null;
  const name = replayFileName(snap);
  const blob = new Blob([JSON.stringify(snap, null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return name;
}

/** Baustein fuer den End-Bildschirm: Textfeld "What felt bad?" (landet in der JSON) und Download-Knopf. */
export function replayDownloadBox(): HTMLElement {
  const rec = getRecorder();
  const box = h('div', 'replay-box');
  const label = h('label', 'replay-label', t('replay.feedback'));
  const area = h('textarea', 'replay-feedback');
  area.maxLength = 1000;
  area.rows = 3;
  area.placeholder = t('replay.feedback.hint');
  area.value = rec?.feedback ?? '';
  area.addEventListener('input', () => getRecorder()?.setFeedback(area.value));
  // Tastenkuerzel (Leertaste, 1-8 ...) duerfen beim Tippen nichts ausloesen
  area.addEventListener('keydown', (e) => e.stopPropagation());
  area.addEventListener('keyup', (e) => e.stopPropagation());
  label.append(area);
  const btn = h('button', 'btn replay-download', t('replay.download'));
  btn.addEventListener('click', () => {
    getRecorder()?.setFeedback(area.value);
    downloadReplay();
  });
  box.append(label, btn);
  return box;
}

/** Kleiner Knopf unten links, nur sichtbar, solange pausiert wird (und es eine Runde gibt). */
export function mountPauseDownload(bus: GameBus, parent: HTMLElement = document.body): () => void {
  const btn = h('button', 'btn replay-pause-download hidden', t('replay.download'));
  btn.addEventListener('click', () => downloadReplay());
  parent.append(btn);
  const offs = [
    bus.onControl((c) => {
      if (c.type === 'pause') btn.classList.toggle('hidden', !c.paused);
    }),
    bus.onRunStart(() => btn.classList.add('hidden')),
    bus.onRunEnd(() => btn.classList.add('hidden')),
  ];
  return () => {
    for (const off of offs) off();
    btn.remove();
  };
}
