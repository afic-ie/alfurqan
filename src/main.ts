import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/amiri/arabic-400.css';
import '@fontsource/amiri/arabic-700.css';
import './styles/app.css';

import { cloneConfig, DEFAULT_CONFIG, type JamaatPrayer } from './engine/config';
import { ruleJamaat, weekDays } from './engine/jamaat';
import { buildDay } from './engine/timetable';
import { MONTH_NAMES, fmt12ampm, fmt24, iso, parseIso, parseTime, today } from './engine/time';
import { starPattern } from './ui/art';
import { renderMonth } from './ui/page';
import { renderSettings } from './ui/settings';
import { downloadJson, load, readImageFile, readJsonFile, save, type Saved } from './ui/store';

// ---------- state ----------
const state: Saved & { y: number; m: number; months: number } = (() => {
  const s = load();
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
  return { ...s, y, m, months };
})();

const app = document.getElementById('app')!;
document.documentElement.style.setProperty('--pattern-gold', starPattern('#c9a24a', 0.28));
document.documentElement.style.setProperty('--pattern-soft', starPattern('#0f5b4a', 0.06, 64));

function persist() {
  if (!save(state)) toast('Could not save in this browser (storage full or blocked). Use “Download settings file”.');
}

// ---------- layout ----------
app.innerHTML = `
<div class="toolbar no-print">
  <div class="tb-left">
    <div class="tb-title">Prayer Timetable</div>
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
    <button type="button" data-action="settings">Settings</button>
    <button type="button" class="primary" data-action="print">Print / Save PDF</button>
  </div>
</div>
<p class="hint no-print">Click any <strong>jamaat</strong> time to change it. Gold dots mark the days jamaat changes.</p>
<main class="pages" id="pages"></main>
<aside class="drawer no-print" id="drawer" hidden></aside>
<dialog class="editor no-print" id="editor"></dialog>
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
const monthSel = app.querySelector<HTMLSelectElement>('[data-control="month"]')!;
const yearIn = app.querySelector<HTMLInputElement>('[data-control="year"]')!;
const monthsSel = app.querySelector<HTMLSelectElement>('[data-control="months"]')!;

function renderPages() {
  monthSel.value = String(state.m);
  yearIn.value = String(state.y);
  monthsSel.value = String(state.months);
  const out: string[] = [];
  let y = state.y;
  let m = state.m;
  for (let i = 0; i < state.months; i++) {
    out.push(renderMonth(y, m, state.config, state.overrides));
    m++;
    if (m > 12) { m = 1; y++; }
  }
  pages.innerHTML = out.join('');
  document.title = `${state.config.mosque.name} – ${MONTH_NAMES[state.m - 1]} ${state.y}`;
  fitPages();
}

function renderDrawer() {
  drawer.innerHTML = renderSettings(state.config, Object.values(state.overrides).reduce((n, o) => n + Object.keys(o).length, 0));
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

function openEditor(key: string, p: JamaatPrayer) {
  const date = parseIso(key);
  const row = buildDay(date, state.config, state.overrides);
  const rule = ruleJamaat(p, state.config.rules[p], date);
  const week = weekDays(date).map(iso);
  const weekText = `${dayLabel(week[0])} – ${dayLabel(week[week.length - 1])}`;
  editor.innerHTML = `
<form method="dialog" class="edit-form">
  <h3>${NAMES[p]} jamaat · ${dayLabel(key)}</h3>
  <p class="help">Adhan ${fmt12ampm(row.adhan[p])}. The rule gives ${fmt12ampm(rule)}.</p>
  <label class="f"><span>Jamaat time</span><input type="time" name="t" value="${fmt24(row.jamaat[p])}" required></label>
  <fieldset class="scope"><legend>Apply to</legend>
    <label><input type="radio" name="scope" value="week" checked> The whole week (${weekText})</label>
    <label><input type="radio" name="scope" value="day"> Only ${dayLabel(key)}</label>
  </fieldset>
  <div class="buttons">
    <button type="submit" class="primary" value="save">Save</button>
    <button type="submit" value="reset">Use the rule</button>
    <button type="submit" value="cancel" formnovalidate>Cancel</button>
  </div>
</form>`;
  const form = editor.querySelector('form')!;
  form.addEventListener('submit', (e) => {
    const action = (e.submitter as HTMLButtonElement | null)?.value;
    const fd = new FormData(form);
    const keys = fd.get('scope') === 'week' ? week : [key];
    if (action === 'save') {
      const t = parseTime(String(fd.get('t')));
      if (t === null) return;
      for (const k of keys) {
        if (t === ruleJamaat(p, state.config.rules[p], parseIso(k))) {
          if (state.overrides[k]) delete state.overrides[k][p];
        } else {
          (state.overrides[k] ??= {})[p] = t;
        }
      }
    } else if (action === 'reset') {
      for (const k of keys) if (state.overrides[k]) delete state.overrides[k][p];
    } else return;
    for (const k of keys) if (state.overrides[k] && !Object.keys(state.overrides[k]).length) delete state.overrides[k];
    persist();
    renderPages();
    if (!drawer.hidden) renderDrawer();
  });
  editor.showModal();
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
    } else if (kind === 'logo' || kind === 'qrImage') {
      if (file.size > 1_500_000) return toast('Please use an image under 1.5 MB.');
      state.config.mosque[kind] = await readImageFile(file);
    }
    persist();
    renderDrawer();
    renderPages();
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
  if (a === 'prev') shiftMonth(-1);
  else if (a === 'next') shiftMonth(1);
  else if (a === 'print') printHelp.showModal();
  else if (a === 'print-now') { printHelp.close(); setTimeout(() => window.print(), 50); }
  else if (a === 'close-dialog') (btn.closest('dialog') as HTMLDialogElement).close();
  else if (a === 'settings') { renderDrawer(); drawer.hidden = false; document.body.classList.add('drawer-open'); }
  else if (a === 'close-settings') { drawer.hidden = true; document.body.classList.remove('drawer-open'); }
  else if (a === 'export') downloadJson(state, `alfurqan-timetable-settings-${iso(today())}.json`);
  else if (a === 'clear-logo') { state.config.mosque.logo = ''; persist(); renderDrawer(); renderPages(); }
  else if (a === 'clear-qr') { state.config.mosque.qrImage = ''; persist(); renderDrawer(); renderPages(); }
  else if (a === 'clear-edits') {
    if (confirm('Remove all manual jamaat changes?')) { state.overrides = {}; persist(); renderDrawer(); renderPages(); }
  } else if (a === 'reset') {
    if (confirm('Restore all settings to the defaults? (Logo, QR image and manual changes are kept.)')) {
      const keep = state.config.mosque;
      state.config = cloneConfig(DEFAULT_CONFIG);
      state.config.mosque.logo = keep.logo;
      state.config.mosque.qrImage = keep.qrImage;
      persist(); renderDrawer(); renderPages();
    }
  } else if (a === 'period-add' || a === 'period-del') {
    const list = getPath(state.config, btn.dataset.list!) as { from: string; time: string }[];
    if (a === 'period-add') list.push({ from: '01-01', time: '13:00' });
    else list.splice(Number(btn.dataset.index), 1);
    persist(); renderDrawer(); renderPages();
  }
});

app.addEventListener('change', (e) => {
  const el = e.target as HTMLElement;
  if (el === monthSel) { state.m = Number(monthSel.value); renderPages(); }
  if (el === yearIn && /^\d{4}$/.test(yearIn.value)) { state.y = Number(yearIn.value); renderPages(); }
  if (el === monthsSel) { state.months = Number(monthsSel.value); renderPages(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) { drawer.hidden = true; document.body.classList.remove('drawer-open'); }
});

renderPages();
