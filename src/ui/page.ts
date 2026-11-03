// Renders one month as an A4 page (HTML string).

import type { Config, QrItem } from '../engine/config';
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

/**
 * Mosque name in English and Arabic, centred on the same width. Each line is
 * scaled uniformly by fitBrandNames() (never stretched), so the letterforms
 * stay crisp; the Arabic name can be lengthened with kashida (ـ) to match.
 */
export function brandNames(name: string, arabic: string): string {
  return `<svg class="brand-names" viewBox="0 0 420 90" aria-label="${esc(name)}">
<text class="bn-en" x="210" y="37" text-anchor="middle" data-base="40" data-max="1.05">${esc(name.toUpperCase())}</text>
<text class="bn-ar" x="210" y="81" text-anchor="middle" data-base="46" data-max="1.25">${esc(arabic)}</text>
</svg>`;
}

/**
 * Sizes each brand-name line so its natural width fills the SVG (up to the
 * line's data-max scale), then again once web fonts have loaded.
 */
export function fitBrandNames(scope: ParentNode = document): void {
  const run = () => {
    scope.querySelectorAll<SVGSVGElement>('svg.brand-names').forEach((svg) => {
      const W = svg.viewBox.baseVal.width;
      svg.querySelectorAll<SVGTextElement>('text').forEach((t) => {
        const base = Number(t.dataset.base) || 40;
        const max = Number(t.dataset.max) || 1;
        t.style.fontSize = `${base}px`;
        const len = t.getComputedTextLength();
        if (!len) return;
        t.style.fontSize = `${(base * Math.min(max, W / len)).toFixed(2)}px`;
      });
    });
  };
  run();
  if (typeof document !== 'undefined' && document.fonts?.ready) void document.fonts.ready.then(run);
}

function logoHtml(config: Config): string {
  const src = resolveImage(config.mosque.logo);
  return src ? `<img class="logo-img" src="${esc(src)}" alt="${esc(config.mosque.name)} logo">` : defaultEmblem();
}

function qrHtml(q: QrItem): string {
  const src = resolveImage(q.image);
  const code = src ? `<img src="${esc(src)}" alt="QR code">` : qrSvg(q.url);
  if (!code) return '';
  return `<div class="qr"><div class="qr-code">${code}</div><div class="qr-label">${esc(q.label)}</div></div>`;
}

/** QR codes are kept apart so each one scans cleanly: the last one sits in the
 *  donation panel on the right, the others at the left end of the footer. */
function qrsHtml(config: Config): { side: string; give: string } {
  const list = config.mosque.qrs.map(qrHtml).filter(Boolean);
  const give = list.length ? list[list.length - 1] : '';
  return { side: list.slice(0, -1).join(''), give };
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
    if (r.clockChange) notes.push(`<strong>Summer time ${r.clockChange === 'forward' ? 'starts' : 'ends'}</strong> on ${longDate(r.date)}: clocks go ${r.clockChange} one hour. All times are already adjusted.`);
  }
  const fixedIsha = rows.filter((r) => r.beforeAdhan.isha);
  if (fixedIsha.length) {
    notes.push(`<span class="mark">*</span> Summer: Isha adhan and jamaat are fixed at ${fmt12ampm(fixedIsha[0].jamaat.isha)}.`);
  }
  notes.push('<span class="tri up"></span> jamaat moves later · <span class="tri down"></span> jamaat moves earlier');
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
        const a = `<td class="a${c.jamaat ? ' has-j' : ''}">${fmt12(r.shownAdhan[c.p])}</td>`;
        if (!c.jamaat) return a;
        const p = c.p as 'fajr' | 'dhuhr' | 'asr' | 'isha';
        const jc = ['j', r.changed[p] ? `chg ${r.direction[p] > 0 ? 'up' : 'down'}` : '', r.edited[p] ? 'edited' : ''].join(' ').trim();
        const star = r.beforeAdhan[p] ? '<span class="mark">*</span>' : '';
        return `${a}<td class="${jc}" data-key="${r.key}" data-p="${p}" title="Click to change">${fmt12(r.jamaat[p])}${star}</td>`;
      }).join('');
      const cols = (config.showHijri ? 2 : 1) + COLS.reduce((n, c) => n + (c.jamaat ? 2 : 1), 0);
      const banner = r.clockChange
        ? `<tr class="notice"><td colspan="${cols}">⏱ Clocks go ${r.clockChange === 'forward' ? 'FORWARD' : 'BACK'} one hour on ${longDate(r.date)} — times below are already adjusted</td></tr>`
        : '';
      return `${banner}<tr class="${cls}">
<td class="date"><span class="dn">${r.date.d}</span><span class="wd">${r.isFriday ? `Jumu'ah${r.khutbah !== null ? `<span class="kh">Khutbah ${fmt12(r.khutbah)}</span>` : ''}` : DAY_SHORT[r.weekday]}</span></td>
${hijriCell}${cells}</tr>`;
    })
    .join('');

  const head1 = COLS.map((c) =>
    `<th class="pr${c.jamaat ? ' grp' : ''}" ${c.jamaat ? 'colspan="2"' : 'rowspan="2"'}><span class="en">${c.en}</span><span class="ar">${c.ar}</span></th>`,
  ).join('');
  const head2 = COLS.filter((c) => c.jamaat).map(() => '<th class="sub">Adhan</th><th class="sub j">Jamaat</th>').join('');

  const notes = footerNotes(rows).map((n) => `<li>${starGlyph('var(--gold-deep)', 8)}<span>${n}</span></li>`).join('');
  const qrs = qrsHtml(config);

  return `<section class="page" data-month="${y}-${m}">
<div class="frame">
<div class="corner tl">${cornerOrnament('var(--gold)')}</div><div class="corner tr">${cornerOrnament('var(--gold)')}</div>
<div class="corner bl">${cornerOrnament('var(--gold)')}</div><div class="corner br">${cornerOrnament('var(--gold)')}</div>
<header class="head">
  <div class="brand">
    <div class="logo">${logoHtml(config)}</div>
    <div class="names">
      ${brandNames(info.name, info.arabicName)}
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
  <tbody class="rows-${rows.length + rows.filter((r) => r.clockChange).length}">${body}</tbody>
</table>
<footer class="foot">
  <div class="qrs qr-side">${qrs.side}</div>
  <ul class="notes">${notes}${info.extraNote ? `<li>${starGlyph('var(--gold-deep)', 8)}<span>${esc(info.extraNote)}</span></li>` : ''}</ul>
  <div class="give">
    <div class="give-text">
      <div class="give-title">${esc(info.donateCaption)}</div>
      <div class="bank">${esc(info.bankLine)}</div>
      <div class="web">${esc(info.website)}</div>
    </div>
    <div class="qrs">${qrs.give}</div>
  </div>
</footer>
</div>
</section>`;
}
