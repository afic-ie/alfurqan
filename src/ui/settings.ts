// Settings panel: mosque details, jamaat rules, khutbah times, Hijri.
// Each input carries data-path (e.g. "rules.fajr.gapWinter"); main.ts writes
// the value back into the config at that path.

import type { Config, Period, StepRule } from '../engine/config';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const text = (label: string, path: string, value: string, hint = '') =>
  `<label class="f"><span>${label}</span><input type="text" data-path="${path}" value="${esc(value)}">${hint ? `<small>${hint}</small>` : ''}</label>`;
const num = (label: string, path: string, value: number, hint = '') =>
  `<label class="f n"><span>${label}</span><input type="number" step="1" data-path="${path}" data-type="number" value="${esc(value)}">${hint ? `<small>${hint}</small>` : ''}</label>`;
const time = (label: string, path: string, value = '') =>
  `<label class="f n"><span>${label}</span><input type="time" data-path="${path}" value="${esc(value)}"></label>`;

function stepRule(title: string, key: 'fajr' | 'asr' | 'isha', r: StepRule, explain: string) {
  const p = `rules.${key}`;
  return `<fieldset><legend>${title}</legend><p class="help">${explain}</p>
<div class="grid">
${num('Minutes after adhan (winter)', `${p}.gapWinter`, r.gapWinter)}
${num('Minutes after adhan (summer time)', `${p}.gapSummer`, r.gapSummer)}
${num('Round up to (minutes)', `${p}.step`, r.step)}
${time('Never earlier than', `${p}.earliest`, r.earliest ?? '')}
${time('Never later than', `${p}.latest`, r.latest ?? '')}
</div></fieldset>`;
}

function periods(title: string, path: string, list: Period[], explain: string) {
  const rows = list
    .map(
      (p, i) => `<div class="period">
<input type="text" data-path="${path}.${i}.from" value="${esc(p.from)}" aria-label="Starts">
<input type="time" data-path="${path}.${i}.time" value="${esc(p.time)}" aria-label="Time">
<button type="button" class="icon" data-action="period-del" data-list="${path}" data-index="${i}" title="Remove">×</button></div>`,
    )
    .join('');
  return `<fieldset><legend>${title}</legend><p class="help">${explain}</p>
<div class="periods">${rows}</div>
<button type="button" class="ghost" data-action="period-add" data-list="${path}">+ Add a change</button>
</fieldset>`;
}

export function renderSettings(c: Config, editCount: number): string {
  const m = c.mosque;
  const r = c.rules;
  const dh = r.dhuhr.kind === 'periods' ? r.dhuhr.periods : [];
  const anchorHelp =
    'Start can be <code>summer-start</code> (clocks go forward), <code>summer-end</code> (clocks go back), <code>last-fri-01</code> (last Friday of January) or a date like <code>11-01</code> (1 November).';
  return `
<div class="drawer-head"><h2>Settings</h2><button type="button" class="icon" data-action="close-settings" title="Close">×</button></div>
<div class="drawer-body">
<fieldset><legend>Mosque details</legend>
<div class="grid">
${text('Name', 'mosque.name', m.name)}
${text('Arabic name', 'mosque.arabicName', m.arabicName)}
${text('City', 'mosque.city', m.city)}
${text('Website', 'mosque.website', m.website)}
</div>
${text('Bank details line', 'mosque.bankLine', m.bankLine)}
${text('Donation heading', 'mosque.donateCaption', m.donateCaption)}
${text('Donation link (QR code is made from this)', 'mosque.donationUrl', m.donationUrl, 'Or upload the QR image you already use below.')}
${text('Extra note on every page (optional)', 'mosque.extraNote', m.extraNote)}
<div class="uploads">
  <label class="upload"><span>Logo</span>${m.logo ? `<img src="${esc(m.logo)}" alt="">` : '<em>Using placeholder emblem</em>'}
    <input type="file" accept="image/*" data-upload="logo"></label>
  ${m.logo ? '<button type="button" class="ghost" data-action="clear-logo">Remove logo</button>' : ''}
  <label class="upload"><span>QR code image</span>${m.qrImage ? `<img src="${esc(m.qrImage)}" alt="">` : '<em>Generated from the link</em>'}
    <input type="file" accept="image/*" data-upload="qrImage"></label>
  ${m.qrImage ? '<button type="button" class="ghost" data-action="clear-qr">Remove QR image</button>' : ''}
</div>
</fieldset>

<h3>Jamaat rules</h3>
<p class="help">Jamaat times change only on Fridays and on the days the clocks change. Each week's time is worked out from that week's latest adhan. To change a single week, click the time on the timetable instead.</p>
${stepRule('Fajr', 'fajr', r.fajr as StepRule, 'Example: adhan 6:43 + 20 min = 7:03, rounded up to 7:15.')}
${periods('Dhuhr', 'rules.dhuhr.periods', dh, `Fixed time per season. ${anchorHelp}`)}
${stepRule('Asr', 'asr', r.asr as StepRule, 'Later in summer, e.g. adhan 5:58 pm + 45 min, rounded to 7:00 pm.')}
${r.maghrib.kind === 'adhan' ? `<fieldset><legend>Maghrib</legend>${num('Minutes after adhan', 'rules.maghrib.offset', r.maghrib.offset)}</fieldset>` : ''}
${stepRule('Isha', 'isha', r.isha as StepRule, '“Never later than” gives the fixed summer Isha time (marked * on the timetable).')}
${periods("Jumu'ah khutbah", 'khutbah', c.khutbah, anchorHelp)}

<fieldset><legend>Hijri date</legend>
<label class="check"><input type="checkbox" data-path="showHijri" data-type="bool" ${c.showHijri ? 'checked' : ''}> Show Hijri date column</label>
${num('Adjust Hijri date by days', 'hijriOffset', c.hijriOffset, 'Use -1 or +1 to follow local moon sighting.')}
</fieldset>

<fieldset><legend>Save and share</legend>
<p class="help">Settings and edits are saved in this browser automatically. Download a settings file to back them up or use them on another computer.</p>
<div class="buttons">
<button type="button" data-action="export">Download settings file</button>
<label class="button">Load settings file<input type="file" accept="application/json,.json" data-upload="settings" hidden></label>
</div>
<p class="help">${editCount} manual jamaat ${editCount === 1 ? 'change' : 'changes'} saved.</p>
<div class="buttons">
<button type="button" class="ghost" data-action="clear-edits" ${editCount ? '' : 'disabled'}>Clear manual changes</button>
<button type="button" class="ghost danger" data-action="reset">Restore default settings</button>
</div>
</fieldset>
</div>`;
}
