/** Einstellungen: Lautstaerke, Developer-Schalter, Export/Import, Profil loeschen (mit Bestaetigung). */
import { downloadText, pickTextFile } from '../meta/store';
import { volumePanel } from '../ui/volume';
import { h } from '../ui/dom';
import { icon } from './icons';
import { topBar } from './knowledge';
import { cv } from './px';
import { S } from './text';
import type { Ctx, View } from './types';

export function settingsView(ctx: Ctx): View {
  const p = ctx.store.profile;
  const el = h('div', 'scr settings');
  el.append(topBar(ctx, S.settings.title));
  const box = h('div', 'set-box');

  // Lautstaerke: Musik und Effekte getrennt
  const vol = h('section', 'card set-vol');
  vol.append(h('div', 'h2', S.settings.volume), volumePanel(ctx.audio, { onCommit: (k) => { if (k === 'sfx') ctx.sound('click'); } }));

  // Developer
  const dev = h('section', 'card set-row');
  const check = h('input') as HTMLInputElement;
  check.type = 'checkbox';
  check.id = 'dev-unlock';
  check.checked = p.settings.unlockAll;
  const label = h('label', 'set-l', S.settings.dev);
  label.htmlFor = 'dev-unlock';
  check.onchange = () => { ctx.sound('click'); void ctx.update({ ...ctx.store.profile, settings: { ...ctx.store.profile.settings, unlockAll: check.checked } }); };
  dev.append(check, label, h('div', 'set-hint', S.settings.devHint));

  // Speicherstand
  const data = h('section', 'card set-data');
  data.append(h('div', 'h2', S.settings.save));
  const msg = h('div', 'set-msg');
  const exp = h('button', 'btn-small', S.settings.export);
  exp.onclick = () => {
    ctx.sound('click');
    downloadText(`duskwardens-save-${new Date().toISOString().slice(0, 10)}.json`, ctx.store.exportJson());
    msg.textContent = S.settings.exportDone;
    msg.className = 'set-msg ok';
  };
  const imp = h('button', 'btn-small', S.settings.import);
  imp.onclick = async () => {
    ctx.sound('click');
    const text = await pickTextFile();
    if (text === null) return;
    const r = await ctx.store.importJson(text);
    if (r.ok) { msg.textContent = S.settings.importDone; msg.className = 'set-msg ok'; ctx.go({ name: 'settings' }); }
    else { ctx.sound('error'); msg.textContent = S.settings.importFail(r.message); msg.className = 'set-msg bad'; }
  };
  const btns = h('div', 'set-btns');
  btns.append(exp, imp);
  data.append(btns, msg, h('div', 'set-hint', S.settings.stored[ctx.store.persistence()] ?? ''), h('div', 'set-hint', S.settings.stats(p.matchesPlayed, p.matchesWon)));

  // Loeschen
  const danger = h('section', 'card set-danger');
  const wipe = h('button', 'btn-small danger', S.settings.wipe);
  wipe.onclick = () => {
    ctx.sound('click');
    const dlg = h('div', 'modal');
    const inner = h('div', 'modal-box');
    const yes = h('button', 'btn-small danger', S.settings.wipeYes);
    const no = h('button', 'btn-small', S.settings.wipeNo);
    no.onclick = () => dlg.remove();
    yes.onclick = async () => { await ctx.store.wipe(); dlg.remove(); ctx.go({ name: 'home' }); };
    const row = h('div', 'set-btns');
    row.append(no, yes);
    inner.append(cv(icon('flame'), 5), h('div', 'modal-t', S.settings.wipeAsk), h('div', 'modal-d', S.settings.wipeText), row);
    dlg.append(inner);
    el.append(dlg);
    no.focus();
  };
  danger.append(wipe, h('div', 'set-hint', S.settings.wipeHint));

  box.append(vol, dev, data, danger);
  el.append(box);
  return { el };
}
