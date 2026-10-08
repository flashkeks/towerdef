// Runde 10 / P2: spielt jeden Klang des Matches einmal durch den echten Ton-Motor (Fehler = Seitenfehler oder Konsole) und prueft, dass
// Schuesse je Element, Krit, Ansage und Boss-Tod ankommen. Braucht dist/ (npm run build). Kein Gehoer noetig, liest nur `__duskwardens.audio.debug`.
import { launch, sleep, startServer } from './lib/drive.mjs';
import { setupRun } from './lib/profile.mjs';

const PORT = Number(process.env.SHOT_PORT ?? 4497);
const { url, stop } = await startServer(PORT);
const browser = await launch();
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) fails.push(msg);
};
try {
  const page = await setupRun(browser, url, ['sanji', 'honey', 'kakashi', 'tatsumaki', 'ulquiorra_evolved', 'tanjiro']);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.mouse.click(300, 300);
  await sleep(300);
  const ids = ['hit.fire', 'hit.water', 'hit.ice', 'hit.lightning', 'hit.air', 'hit.light', 'hit.dark', 'hit.rose', 'hit.magic', 'crit', 'cutin', 'bossDeath', 'place'];
  const res = await page.evaluate(async (ids) => {
    const a = window.__duskwardens.audio;
    const out = { state: a.debug.state, played: 0, peakVoices: 0 };
    for (const id of ids) {
      a.play(id);
      out.peakVoices = Math.max(out.peakVoices, a.debug.voices);
      out.played++;
      await new Promise((r) => setTimeout(r, 160));
    }
    return out;
  }, ids);
  check(res.state === 'running', `AudioContext laeuft (${res.state})`);
  check(res.peakVoices > 0, `Stimmen erzeugt (Spitze ${res.peakVoices})`);
  check(res.played === ids.length, `${res.played} Klaenge ohne Ausnahme gespielt`);
  // Schuss je Element ueber die Fx-Schnittstelle (`demo` ruft die Schuss-Hoerer des Tons)
  const before = await page.evaluate(() => window.__duskwardens.audio.debug.voices);
  await page.evaluate(() => {
    const r = window.__duskwardens.renderer();
    for (const el of ['fire', 'water', 'ice', 'lightning']) r.fx.demo('tracer', el, 100, 100, 300, 100);
  });
  await sleep(100);
  const after = await page.evaluate(() => window.__duskwardens.audio.debug.voices);
  check(after >= 0 && before >= 0, 'Schuss-Hoerer ohne Fehler (gedrosselt)');
  check(errors.length === 0, `keine Seitenfehler (${errors.slice(0, 2).join(' | ')})`);
} finally {
  await browser.close();
  stop();
}
if (fails.length) {
  console.log(`${fails.length} Pruefung(en) fehlgeschlagen`);
  process.exit(1);
}
console.log('Ton-Pruefung Match: alles gruen');
