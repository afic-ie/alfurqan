// Renders one month as an A4 page (HTML string).

import type { Config } from '../engine/config';
import { buildMonth, type DayRow, type Overrides } from '../engine/timetable';
import { MONTH_NAMES, fmt12, fmt12ampm, iso, today, type Ymd } from '../engine/time';
import { cornerOrnament, defaultEmblem, qrSvg, starGlyph } from './art';
import { resolveImage } from './assets';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HIJRI_SHORT = ['Muh', 'Saf', 'Rab I', 'Rab II', 'Jum I', 'Jum II', 'Raj', 'Sha', 'Ram', 'Shaw', 'Qaʿd', 'Hijj'];

const COLS: { p: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; en: string; ar: string; jamaat: boolean }[] = [
  { p: 'fajr', en: 'Fajr', ar: 'الفجر', jamaat: true },
  { p: 'sunrise', en: 'Sunrise', ar: 'الشروق', jamaat: false },
  { p: 'dhuhr', en: 'Dhuhr', ar: 'الظهر', jamaat: true },
  { p: 'asr', en: 'Asr', ar: 'العصر', jamaat: true },
  { p: 'maghrib', en: 'Maghrib', ar: 'المغرب', jamaat: false },
  { p: 'isha', en: 'Isha', ar: 'العشاء', jamaat: true },
];

function logoHtml(config: Config): string {
  const src = resolveImage(config.mosque.logo);
  return src ? `<img class="logo-img" src="${esc(src)}" alt="${esc(config.mosque.name)} logo">` : defaultEmblem();
}

function qrsHtml(config: Config): string {
  return config.mosque.qrs
    .map((q) => {
      const src = resolveImage(q.image);
      const code = src ? `<img src="${esc(src)}" alt="QR code">` : qrSvg(q.url);
      if (!code) return '';
      return `<div class="qr"><div class="qr-code">${code}</div><div class="qr-label">${esc(q.label)}</div></div>`;
    })
    .join('');
}

function hijriRange(rows: DayRow[]): { en: string; ar: string } {
  const hs = rows.map((r) => r.hijri).filter((h) => h !== null);
  if (!hs.length) return { en: '', ar: '' };
  const first = hs[0]!;
  const last = hs[hs.length - 1]!;
  if (first.month === last.month) return { en: `${first.monthName} ${first.year} AH`, ar: `${first.monthNameAr} ${first.year}هـ` };
  const yr = first.year === last.year ? '' : ` ${first.year}`;
  return {
    en: `${first.monthName}${yr} – ${last.monthName} ${last.year} AH`,
    ar: `${first.monthNameAr} – ${last.monthNameAr} ${last.year}هـ`,
  };
}

const longDate = (x: Ymd) => `${DAY_SHORT[new Date(Date.UTC(x.y, x.m - 1, x.d)).getUTCDay()]} ${x.d} ${MONTH_NAMES[x.m - 1]}`;

function footerNotes(rows: DayRow[]): string[] {
  const notes: string[] = [];
  // Jumu'ah khutbah time(s) during the month
  const fridays = rows.filter((r) => r.isFriday && r.khutbah !== null);
  if (fridays.length) {
    const parts: string[] = [];
    let last: number | null = null;
    for (const f of fridays) {
      if (f.khutbah !== last) {
        parts.push(parts.length ? `${fmt12ampm(f.khutbah!)} from ${f.date.d} ${MONTH_NAMES[f.date.m - 1].slice(0, 3)}` : fmt12ampm(f.khutbah!));
        last = f.khutbah;
      }
    }
    notes.push(`<strong>Jumu'ah khutbah</strong> starts at ${parts.join(', ')}`);
  }
  for (const r of rows) {
    if (r.clockChange === 'forward') notes.push(`Clocks go <strong>forward</strong> one hour on ${longDate(r.date)}. Times shown are already adjusted.`);
    if (r.clockChange === 'back') notes.push(`Clocks go <strong>back</strong> one hour on ${longDate(r.date)}. Times shown are already adjusted.`);
  }
  const fixedIsha = rows.filter((r) => r.beforeAdhan.isha);
  if (fixedIsha.length) {
    notes.push(`<span class="mark">*</span> Summer: Isha jamaat at a fixed ${fmt12ampm(fixedIsha[0].jamaat.isha)}.`);
  }
  notes.push('Maghrib jamaat at adhan time · <span class="legend-dot"></span> marks a change in jamaat time');
  return notes;
}

export function renderMonth(y: number, m: number, config: Config, overrides: Overrides): string {
  const rows = buildMonth(y, m, config, overrides);
  const hr = hijriRange(rows);
  const todayKey = iso(today());
  const info = config.mosque;

  const body = rows
    .map((r, i) => {
      const cls = [r.isFriday ? 'fri' : '', r.key === todayKey ? 'today' : '', r.clockChange ? 'clock' : ''].join(' ').trim();
      const h = r.hijri;
      const hijriCell = h
        ? `<td class="hijri">${h.day}${h.day === 1 || i === 0 ? `<span class="hm">${HIJRI_SHORT[h.month - 1]}</span>` : ''}</td>`
        : '';
      const cells = COLS.map((c) => {
        const a = `<td class="a${c.jamaat ? ' has-j' : ''}">${fmt12(r.adhan[c.p])}</td>`;
        if (!c.jamaat) return a;
        const p = c.p as 'fajr' | 'dhuhr' | 'asr' | 'isha';
        const jc = ['j', r.changed[p] ? 'chg' : '', r.edited[p] ? 'edited' : ''].join(' ').trim();
        const star = r.beforeAdhan[p] ? '<span class="mark">*</span>' : '';
        return `${a}<td class="${jc}" data-key="${r.key}" data-p="${p}" title="Click to change">${fmt12(r.jamaat[p])}${star}</td>`;
      }).join('');
      return `<tr class="${cls}">
<td class="date"><span class="dn">${r.date.d}</span><span class="wd">${r.isFriday ? "Jumu'ah" : DAY_SHORT[r.weekday]}</span></td>
${hijriCell}${cells}</tr>`;
    })
    .join('');

  const head1 = COLS.map((c) =>
    `<th class="pr${c.jamaat ? ' grp' : ''}" ${c.jamaat ? 'colspan="2"' : 'rowspan="2"'}><span class="en">${c.en}</span><span class="ar">${c.ar}</span></th>`,
  ).join('');
  const head2 = COLS.filter((c) => c.jamaat).map(() => '<th class="sub">Adhan</th><th class="sub j">Jamaat</th>').join('');

  const notes = footerNotes(rows).map((n) => `<li>${starGlyph('var(--gold-deep)', 8)}<span>${n}</span></li>`).join('');

  return `<section class="page" data-month="${y}-${m}">
<div class="frame">
<div class="corner tl">${cornerOrnament('var(--gold)')}</div><div class="corner tr">${cornerOrnament('var(--gold)')}</div>
<div class="corner bl">${cornerOrnament('var(--gold)')}</div><div class="corner br">${cornerOrnament('var(--gold)')}</div>
<header class="head">
  <div class="brand">
    <div class="logo">${logoHtml(config)}</div>
    <div class="names">
      <div class="name-en">${esc(info.name)}</div>
      <div class="name-ar" lang="ar" dir="rtl">${esc(info.arabicName)}</div>
      <div class="city">${esc(info.city)} · Prayer Timetable</div>
    </div>
  </div>
  <div class="month">
    <div class="month-en">${MONTH_NAMES[m - 1]} <span>${y}</span></div>
    <div class="month-hijri">${esc(hr.en)}</div>
    <div class="month-hijri-ar" lang="ar" dir="rtl">${esc(hr.ar)}</div>
  </div>
</header>
<div class="rule"><span class="rule-dot"></span>${starGlyph('var(--gold)', 12)}<span class="rule-dot"></span></div>
<table class="tt">
  <colgroup><col class="c-date">${config.showHijri ? '<col class="c-hijri">' : ''}${COLS.map((c) => (c.jamaat ? '<col class="c-a"><col class="c-j">' : '<col class="c-a">')).join('')}</colgroup>
  <thead>
    <tr><th class="pr d" rowspan="2"><span class="en">Date</span><span class="ar">التاريخ</span></th>${config.showHijri ? '<th class="pr d" rowspan="2"><span class="en">Hijri</span><span class="ar">هجري</span></th>' : ''}${head1}</tr>
    <tr>${head2}</tr>
  </thead>
  <tbody class="rows-${rows.length}">${body}</tbody>
</table>
<footer class="foot">
  <ul class="notes">${notes}${info.extraNote ? `<li>${starGlyph('var(--gold-deep)', 8)}<span>${esc(info.extraNote)}</span></li>` : ''}</ul>
  <div class="give">
    <div class="give-text">
      <div class="give-title">${esc(info.donateCaption)}</div>
      <div class="bank">${esc(info.bankLine)}</div>
      <div class="web">${esc(info.website)}</div>
    </div>
    <div class="qrs">${qrsHtml(config)}</div>
  </div>
</footer>
<div class="credit">Adhan times: Islamic Foundation of Ireland (${esc(info.city)}). Jamaat times: ${esc(info.name)}.</div>
</div>
</section>`;
}
