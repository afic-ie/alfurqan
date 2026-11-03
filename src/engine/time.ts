// Calendar and clock helpers.
// Dates are plain calendar days (no time zone), so nothing depends on the
// time zone of the device running the app.

export interface Ymd {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toUtc = (x: Ymd) => Date.UTC(x.y, x.m - 1, x.d);
const fromUtc = (t: number): Ymd => {
  const dt = new Date(t);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
};

export const ymd = (y: number, m: number, d: number): Ymd => ({ y, m, d });

export function addDays(x: Ymd, n: number): Ymd {
  return fromUtc(toUtc(x) + n * 86400000);
}

/** 0 = Sunday ... 5 = Friday ... 6 = Saturday */
export function weekday(x: Ymd): number {
  return new Date(toUtc(x)).getUTCDay();
}

export function compare(a: Ymd, b: Ymd): number {
  return toUtc(a) - toUtc(b);
}

export const same = (a: Ymd, b: Ymd) => compare(a, b) === 0;

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function iso(x: Ymd): string {
  return `${x.y}-${String(x.m).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;
}

export function parseIso(s: string): Ymd {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

export function today(): Ymd {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

/** Last Sunday of a month (EU/Irish clock-change days). */
export function lastSunday(y: number, m: number): Ymd {
  let x = ymd(y, m, daysInMonth(y, m));
  while (weekday(x) !== 0) x = addDays(x, -1);
  return x;
}

/** Last given weekday of a month (e.g. last Friday of January). */
export function lastWeekdayOf(y: number, m: number, wd: number): Ymd {
  let x = ymd(y, m, daysInMonth(y, m));
  while (weekday(x) !== wd) x = addDays(x, -1);
  return x;
}

export const summerTimeStart = (y: number) => lastSunday(y, 3);
export const summerTimeEnd = (y: number) => lastSunday(y, 10);

/** Irish Summer Time (clocks one hour ahead) applies on this day. */
export function isSummerTime(x: Ymd): boolean {
  return compare(x, summerTimeStart(x.y)) >= 0 && compare(x, summerTimeEnd(x.y)) < 0;
}

export function isClockChangeDay(x: Ymd): boolean {
  return same(x, summerTimeStart(x.y)) || same(x, summerTimeEnd(x.y));
}

// ---- time of day: minutes after midnight ----

export function parseTime(s: string): number | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 24-hour "13:05" (used in settings and form inputs). */
export function fmt24(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  return `${String(h).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** 12-hour "1:05" without am/pm, as on the printed timetable. */
export function fmt12(mins: number): string {
  const h24 = Math.floor(mins / 60) % 24;
  const h = h24 % 12 || 12;
  return `${h}:${String(mins % 60).padStart(2, '0')}`;
}

export function fmt12ampm(mins: number): string {
  const h24 = Math.floor(mins / 60) % 24;
  return `${fmt12(mins)} ${h24 < 12 ? 'am' : 'pm'}`;
}
