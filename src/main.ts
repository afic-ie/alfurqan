import './styles/fonts';
import './styles/app.css';

import { cloneConfig, DEFAULT_CONFIG, JAMAAT_PRAYERS, type JamaatPrayer } from './engine/config';
import { ruleJamaat, weekDays } from './engine/jamaat';
import { applyJamaat, countEdits, daysBetween } from './engine/overrides';
import { buildDay } from './engine/timetable';
import { daysInMonth, MONTH_NAMES, fmt12ampm, fmt24, iso, parseIso, parseTime, today, ymd } from './engine/time';
import { starPattern } from './ui/art';
import { fitBrandNames, renderMonth } from './ui/page';
import { renderRamadan } from './ui/ramadan';
import { ramadanDates } from './engine/ramadan';
import { renderSettings } from './ui/settings';
import { downloadJson, hasSaved, load, readImageFile, readJsonFile, save, type Saved } from './ui/store';
import { loadPublished } from './site/data';
import { registerPwa } from './site/pwa';
import { getToken, publish, PublishError, setToken, TARGET, TOKEN_HELP_URL } from './site/publish';

// ---------- state ----------
const state: Saved & { y: number; m: number; months: number; view: 'months' | 'ramadan' } = await (async () => {
  const s = hasSaved() ? load() : await loadPublished('../');
  const t = today();
  // Timetables are made two months at a time (Jan-Feb, Mar-Apr, ...):
  // start on the next block after the current one.
  let m = t.m % 2 === 1 ? t.m + 2 : t.m + 1;
  let y = t.y;
  if (m > 12) { m -= 12; y += 1; }
  // Optional link parameters, e.g. ?y=2027&m=3&n=2
  const q = new URLSearchParams(location.search);
  const qy = Number(q.get('y'));
  const qm = Number(q.get('m'));
  const qn = Number(q.get('n'));
  if (qy >= 2000 && qy <= 2099) y = qy;
  if (qm >= 1 && qm <= 12) m = qm;
  const months = [1, 2, 3, 6, 12].includes(qn) ? qn : 2;
  return { ...s, y, m, months, view: q.get('view') === 'ramadan' ? 'ramadan' as const : 'months' as const };
})();

const app = document.getElementById('app')!;
document.documentElement.style.setProperty('--pattern-dark', starPattern('#d9b96a', 0.2));
document.documentElement.style.setProperty('--pattern-soft', starPattern('#1547c2', 0.06, 64));

function persist() {
  if (!save(state)) toast('Could not save in this browser (storage full or blocked). Use “Download settings file”.');
}

// ---------- layout ----------
app.innerHTML = `
<div class="toolbar no-print">
  <div class="tb-left">
    <a class="tb-title" href="../" title="Back to the website">‹ Website</a>
    <div class="tb-title">Timetable admin</div>
    <div class="nav">
      <button type="button" class="icon" data-action="prev" title="Previous month" aria-label="Previous month">‹</button>
      <select data-control="month" aria-label="Month">${MONTH_NAMES.map((n, i) => `<option value="${i + 1}">${n}</option>`).join('')}</select>
      <input data-control="year" type="number" min="2000" max="2099" aria-label="Year">
      <button type="button" class="icon" data-action="next" title="Next month" aria-label="Next month">›</button>
    </div>
    <label class="months">Months
      <select data-control="months" aria-label="Number of months">
        ${[1, 2, 3, 6, 12].map((n) => `<option value="${n}">${n}</option>`).join('')}
      </select>
    </label>
  </div>
  <div class="tb-right">
    <button type="button" data-action="ramadan" id="ramadan-btn">Ramadan</button>
    <button type="button" data-action="adjust">Adjust jamaat</button>
    <button type="button" data-action="settings">Settings</button>
    <button type="button" class="primary" data-action="print">Print / Save PDF</button>
    <button type="button" class="publish" data-action="publish">Publish</button>
  </div>
</div>
<p class="hint no-print">Click any <strong>jamaat</strong> time to change it for a day, a week or a range of dates. ▲▼ mark the days a jamaat time changes.</p>
<main class="pages" id="pages"></main>
<aside class="drawer no-print" id="drawer" hidden></aside>
<dialog class="editor no-print" id="editor"></dialog>
<dialog class="editor no-print" id="publish"></dialog>
<dialog class="editor no-print" id="print-help">
  <h3>Save as PDF</h3>
  <ol>
    <li>In the print window choose <strong>Save as PDF</strong> (or your printer).</li>
    <li>Paper: <strong>A4</strong>, margins: <strong>None</strong> (or Default).</li>
    <li>Turn on <strong>Background graphics</strong> so colours print.</li>
  </ol>
  <div class="buttons"><button type="button" data-action="print-now" class="primary">Open print window</button>
  <button type="button" data-action="close-dialog">Cancel</button></div>
</dialog>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;

const pages = document.getElementById('pages')!;
const drawer = document.getElementById('drawer')!;
const editor = document.getElementById('editor') as HTMLDialogElement;
const printHelp = document.getElementById('print-help') as HTMLDialogElement;
const publishDlg = document.getElementById('publish') as HTMLDialogElement;
const monthSel = app.querySelector<HTMLSelectElement>('[data-control="month"]')!;
const yearIn = app.querySelector<HTMLInputElement>('[data-control="year"]')!;
const monthsSel = app.querySelector<HTMLSelectElement>('[data-control="months"]')!;

function lastShownDay() {
  let y = state.y;
  let m = state.m + state.months - 1;
  while (m > 12) { m -= 12; y++; }
  return ymd(y, m, daysInMonth(y, m));
}

function renderPages() {
  monthSel.value = String(state.m);
  yearIn.value = String(state.y);
  monthsSel.value = String(state.months);
  const out: string[] = [];
  const ram = state.view === 'ramadan' ? renderRamadan(state.config, state.overrides) : null;
  if (ram) {
    out.push(`<div class="page-wrap">${ram}</div>`);
    document.title = `${state.config.mosque.name} – Ramadan ${ramadanDates(state.config)?.year ?? ''}`;
  } else {
    state.view = 'months';
    let y = state.y;
    let m = state.m;
    for (let i = 0; i < state.months; i++) {
      out.push(`<div class="page-wrap">${renderMonth(y, m, state.config, state.overrides)}</div>`);
      m++;
      if (m > 12) { m = 1; y++; }
    }
    document.title = `${state.config.mosque.name} – ${MONTH_NAMES[state.m - 1]} ${state.y}`;
  }
  document.getElementById('ramadan-btn')?.classList.toggle('primary', state.view === 'ramadan');
  pages.innerHTML = out.join('');
  fitBrandNames(pages);
  fitPages();
}

function renderDrawer() {
  drawer.innerHTML = renderSettings(state.config, countEdits(state.overrides));
}

function refresh() {
  persist();
  renderPages();
  if (!drawer.hidden) renderDrawer();
}

// Scale A4 pages down on small screens.
function fitPages() {
  const pageWidth = 210 * 3.7795; // mm -> px
  const scale = Math.min(1, (pages.clientWidth - 16) / pageWidth);
  document.documentElement.style.setProperty('--fit', String(Math.max(0.3, scale)));
}
window.addEventListener('resize', fitPages);

let toastTimer = 0;
function toast(msg: string) {
  const t = document.getElementById('toast')!;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 3500);
}

function shiftMonth(n: number) {
  let m = state.m + n;
  let y = state.y;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  state.m = m;
  state.y = y;
  renderPages();
}

// ---------- jamaat editor ----------
const NAMES: Record<JamaatPrayer, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayLabel = (k: string) => {
  const d = parseIso(k);
  return `${DAY[new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay()]} ${d.d} ${MONTH_NAMES[d.m - 1].slice(0, 3)}`;
};

/**
 * key: the day that was clicked (or the first shown day for the toolbar
 * button). pick: let the user choose the prayer too.
 */
function openEditor(key: string, p: JamaatPrayer, pick = false) {
  const date = parseIso(key);
  const row = buildDay(date, state.config, state.overrides);
  const rule = ruleJamaat(p, state.config.rules[p], date);
  const week = weekDays(date).map(iso);
  const weekText = `${dayLabel(week[0])} – ${dayLabel(week[week.length - 1])}`;
  const rangeEnd = iso(lastShownDay());
  const prayerField = pick
    ? `<label class="f"><span>Prayer</span><select name="p">${JAMAAT_PRAYERS.map((x) => `<option value="${x}" ${x === p ? 'selected' : ''}>${NAMES[x]}</option>`).join('')}</select></label>`
    : '';
  editor.innerHTML = `
<form method="dialog" class="edit-form">
  <h3>${pick ? 'Adjust jamaat time' : `${NAMES[p]} jamaat · ${dayLabel(key)}`}</h3>
  ${pick ? '' : `<p class="help">Adhan ${fmt12ampm(row.adhan[p])}. The rule gives ${fmt12ampm(rule)}.</p>`}
  ${prayerField}
  <label class="f"><span>Jamaat time</span><input type="time" name="t" value="${fmt24(row.jamaat[p])}" required></label>
  <fieldset class="scope"><legend>Apply to</legend>
    <label><input type="radio" name="scope" value="week" ${pick ? '' : 'checked'}> The whole week (${weekText})</label>
    <label><input type="radio" name="scope" value="day"> Only ${dayLabel(key)}</label>
    <label><input type="radio" name="scope" value="range" ${pick ? 'checked' : ''}> A range of dates</label>
    <div class="range">from <input type="date" name="from" value="${key}"> to <input type="date" name="to" value="${rangeEnd}"></div>
  </fieldset>
  <div class="buttons">
    <button type="submit" class="primary" value="save">Save</button>
    <button type="submit" value="reset">Use the rule</button>
    <button type="submit" value="cancel" formnovalidate>Cancel</button>
  </div>
</form>`;
  const form = editor.querySelector('form')!;
  form.querySelectorAll<HTMLInputElement>('.range input').forEach((i) =>
    i.addEventListener('focus', () => ((form.elements.namedItem('scope') as RadioNodeList).value = 'range')),
  );
  form.addEventListener('submit', (e) => {
    const action = (e.submitter as HTMLButtonElement | null)?.value;
    const fd = new FormData(form);
    const prayer = (pick ? String(fd.get('p')) : p) as JamaatPrayer;
    const scope = fd.get('scope');
    let keys: string[];
    if (scope === 'week') keys = week;
    else if (scope === 'day') keys = [key];
    else {
      const from = String(fd.get('from'));
      const to = String(fd.get('to'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) { e.preventDefault(); return; }
      keys = daysBetween(from, to);
      if (keys.length > 800) { e.preventDefault(); toast('Please choose a range of two years or less.'); return; }
    }
    if (action === 'save') {
      const t = parseTime(String(fd.get('t')));
      if (t === null) return;
      applyJamaat(state.overrides, state.config, prayer, keys, t);
      toast(`${NAMES[prayer]} jamaat set to ${fmt12ampm(t)} for ${keys.length} day${keys.length === 1 ? '' : 's'}.`);
    } else if (action === 'reset') {
      applyJamaat(state.overrides, state.config, prayer, keys, null);
    } else return;
    refresh();
  });
  editor.showModal();
}

// ---------- publish ----------
function openPublish() {
  const token = getToken();
  const edits = countEdits(state.overrides);
  publishDlg.innerHTML = token
    ? `<form method="dialog">
  <h3>Publish the timetable</h3>
  <p class="help">This sends the current settings and ${edits} manual jamaat ${edits === 1 ? 'change' : 'changes'} to the website. The public timetable and the TV update within a few minutes.</p>
  <p class="help" id="publish-status"></p>
  <div class="buttons">
    <button type="button" class="primary" data-action="publish-now">Publish now</button>
    <button type="submit" value="cancel">Cancel</button>
    <button type="button" class="ghost danger" data-action="token-clear">Forget token</button>
  </div>
</form>`
    : `<form method="dialog">
  <h3>Set up publishing</h3>
  <p class="help">Publishing writes the timetable into the GitHub repository <code>${TARGET.owner}/${TARGET.repo}</code>. It needs a GitHub token, entered once in this browser. Only people with write access to the repository can publish.</p>
  <ol>
    <li><a href="${TOKEN_HELP_URL}" target="_blank" rel="noopener">Create a fine-grained token</a> on GitHub (you must be signed in as a repository owner or collaborator).</li>
    <li>Repository access: <strong>Only select repositories → ${TARGET.repo}</strong>.</li>
    <li>Permissions: <strong>Contents → Read and write</strong>. Nothing else.</li>
    <li>Copy the token and paste it here.</li>
  </ol>
  <label class="f"><span>GitHub token</span><input type="password" name="token" autocomplete="off" placeholder="github_pat_…" required></label>
  <div class="buttons"><button type="submit" class="primary" value="save-token">Save token</button><button type="submit" value="cancel" formnovalidate>Cancel</button></div>
</form>`;
  publishDlg.querySelector('form')!.addEventListener('submit', (e) => {
    const action = (e.submitter as HTMLButtonElement | null)?.value;
    if (action === 'save-token') {
      setToken(String(new FormData(e.target as HTMLFormElement).get('token')));
      setTimeout(openPublish, 0);
    }
  });
  publishDlg.showModal();
}

async function publishNow(btn: HTMLButtonElement) {
  const status = document.getElementById('publish-status')!;
  btn.disabled = true;
  status.textContent = 'Publishing…';
  try {
    const r = await publish(state, getToken());
    status.innerHTML = `Published. The website rebuilds in about 2 minutes.${r.commitUrl ? ` <a href="${r.commitUrl}" target="_blank" rel="noopener">View on GitHub</a>` : ''}`;
    toast('Published.');
  } catch (err) {
    status.textContent = err instanceof PublishError ? err.message : 'Could not reach GitHub. Check your internet connection and try again.';
    btn.disabled = false;
  }
}

// ---------- settings writes ----------
function setPath(obj: unknown, path: string, value: unknown) {
  const parts = path.split('.');
  let o = obj as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] as Record<string, unknown>;
  const last = parts[parts.length - 1];
  if (value === '' && (last === 'earliest' || last === 'latest')) delete o[last];
  else o[last] = value;
}
function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);
}

drawer.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  const path = el.dataset.path;
  if (!path) return;
  let v: unknown = el.value;
  if (el.dataset.type === 'number') {
    if (el.value === '') return;
    v = Number(el.value);
  }
  if (el.dataset.type === 'bool') v = el.checked;
  setPath(state.config, path, v);
  persist();
  renderPages();
});

drawer.addEventListener('change', async (e) => {
  const el = e.target as HTMLInputElement;
  const kind = el.dataset.upload;
  const file = el.files?.[0];
  if (!kind || !file) return;
  try {
    if (kind === 'settings') {
      const s = await readJsonFile(file);
      state.config = s.config;
      state.overrides = s.overrides;
      toast('Settings loaded.');
    } else {
      if (file.size > 1_500_000) return toast('Please use an image under 1.5 MB.');
      const data = await readImageFile(file);
      if (kind === 'logo') state.config.mosque.logo = data;
      else if (kind === 'qr') {
        const q = state.config.mosque.qrs[Number(el.dataset.index)];
        if (q) q.image = data;
      }
    }
    refresh();
  } catch {
    toast('Could not read that file.');
  }
});

// ---------- clicks ----------
app.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const cell = t.closest<HTMLElement>('td.j');
  if (cell?.dataset.key && cell.dataset.p) return openEditor(cell.dataset.key, cell.dataset.p as JamaatPrayer);
  const btn = t.closest<HTMLElement>('[data-action]');
  if (!btn) return;
  const a = btn.dataset.action;
  const qrs = state.config.mosque.qrs;
  const idx = Number(btn.dataset.index);
  if (a === 'prev') { state.view = 'months'; shiftMonth(-1); }
  else if (a === 'next') { state.view = 'months'; shiftMonth(1); }
  else if (a === 'ramadan') {
    if (!ramadanDates(state.config)) {
      renderDrawer(); drawer.hidden = false; document.body.classList.add('drawer-open');
      toast('Set the first day of fasting under Settings → Ramadan first.');
      drawer.querySelector<HTMLInputElement>('[data-path="ramadan.start"]')?.focus();
    } else { state.view = state.view === 'ramadan' ? 'months' : 'ramadan'; renderPages(); }
  }
  else if (a === 'adjust') openEditor(iso(ymd(state.y, state.m, 1)), 'fajr', true);
  else if (a === 'print') printHelp.showModal();
  else if (a === 'publish') openPublish();
  else if (a === 'publish-now') void publishNow(btn as HTMLButtonElement);
  else if (a === 'token-clear') { setToken(''); publishDlg.close(); toast('Token forgotten.'); }
  else if (a === 'load-published') {
    if (confirm('Replace the settings and changes in this browser with the published version?')) {
      void loadPublished('../').then((p) => { state.config = p.config; state.overrides = p.overrides; refresh(); toast('Loaded the published version.'); });
    }
  }
  else if (a === 'print-now') { printHelp.close(); setTimeout(() => window.print(), 50); }
  else if (a === 'close-dialog') (btn.closest('dialog') as HTMLDialogElement).close();
  else if (a === 'settings') { renderDrawer(); drawer.hidden = false; document.body.classList.add('drawer-open'); }
  else if (a === 'close-settings') { drawer.hidden = true; document.body.classList.remove('drawer-open'); }
  else if (a === 'export') downloadJson(state, `alfurqan-timetable-settings-${iso(today())}.json`);
  else if (a === 'clear-logo') { state.config.mosque.logo = ''; refresh(); }
  else if (a === 'logo-default') { state.config.mosque.logo = 'builtin:logo'; refresh(); }
  else if (a === 'qr-add') { qrs.push({ label: 'New QR code', url: '', image: '' }); refresh(); }
  else if (a === 'qr-del') { qrs.splice(idx, 1); refresh(); }
  else if (a === 'qr-generate') { if (qrs[idx]) qrs[idx].image = ''; refresh(); }
  else if (a === 'clear-edits') {
    if (confirm('Remove all manual jamaat changes?')) { state.overrides = {}; refresh(); }
  } else if (a === 'reset') {
    if (confirm('Restore all settings to the defaults? (Manual jamaat changes are kept.)')) {
      state.config = cloneConfig(DEFAULT_CONFIG);
      refresh();
    }
  } else if (a === 'period-add' || a === 'period-del') {
    const list = getPath(state.config, btn.dataset.list!) as { from: string; time: string }[];
    if (a === 'period-add') list.push({ from: '01-01', time: '13:00' });
    else list.splice(idx, 1);
    refresh();
  }
});

app.addEventListener('change', (e) => {
  const el = e.target as HTMLElement;
  if (el === monthSel) { state.m = Number(monthSel.value); state.view = "months"; renderPages(); }
  if (el === yearIn && /^\d{4}$/.test(yearIn.value)) { state.y = Number(yearIn.value); renderPages(); }
  if (el === monthsSel) { state.months = Number(monthsSel.value); renderPages(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) { drawer.hidden = true; document.body.classList.remove('drawer-open'); }
});

renderPages();
registerPwa('../');
