// Puts it together: one row per day with adhan + jamaat times.

import { adhanTimes, type DayTimes } from './ifi';
import { JAMAAT_PRAYERS, type Config, type JamaatPrayer } from './config';
import { ruleJamaat, periodFor } from './jamaat';
import { hijri, type HijriDate } from './hijri';
import { firstFriday, ramadanDates, ramadanDay } from './ramadan';
import {
  addDays, compare, daysInMonth, iso, isClockChangeDay, isSummerTime, parseTime, weekday, ymd, type Ymd,
} from './time';

/** Manual changes: { "2027-01-08": { fajr: 420 } } (minutes after midnight). */
export type Overrides = Record<string, Partial<Record<JamaatPrayer, number>>>;

export interface DayRow {
  date: Ymd;
  key: string;
  weekday: number;
  isFriday: boolean;
  clockChange: 'forward' | 'back' | null;
  hijri: HijriDate | null;
  adhan: DayTimes;
  jamaat: Record<JamaatPrayer, number>;
  /** jamaat differs from the day before (worth highlighting) */
  changed: Record<JamaatPrayer, boolean>;
  /** +1 if jamaat moved later than the day before, -1 if earlier, 0 if same */
  direction: Record<JamaatPrayer, 1 | -1 | 0>;
  /**
   * Adhan times to print. Same as `adhan`, except when a fixed jamaat is
   * earlier than the adhan (summer Isha): then the jamaat time is shown for
   * the adhan too, so the timetable never shows a jamaat before its adhan.
   */
  shownAdhan: DayTimes;
  /** set by hand rather than by the rules */
  edited: Record<JamaatPrayer, boolean>;
  /** jamaat is earlier than the adhan (e.g. fixed summer Isha) */
  beforeAdhan: Record<JamaatPrayer, boolean>;
  khutbah: number | null;
}

/** Jamaat from the rules alone, with the Ramadan adjustments when `x` is in Ramadan. */
export function ruleJamaatFor(p: JamaatPrayer, config: Config, x: Ymd): number {
  const r = ramadanDates(config);
  if (!ramadanDay(r, x)) return ruleJamaat(p, config.rules[p], x);
  const ram = config.ramadan;
  // the days before the first Friday of Ramadan take that Friday's week
  const ff = firstFriday(r!);
  const d = ram.firstWeekFromFriday && compare(x, ff) < 0 && ramadanDay(r, ff) ? ff : x;
  let rule = config.rules[p];
  if (p === 'fajr' && rule.kind === 'step') rule = { ...rule, gapWinter: ram.fajrGap, gapSummer: ram.fajrGap };
  let j = ruleJamaat(p, rule, d);
  if (p === 'isha') {
    const lo = parseTime(ram.ishaEarliest);
    if (lo !== null) j = Math.max(j, lo);
  }
  return j;
}

export function jamaatFor(x: Ymd, config: Config, overrides: Overrides = {}) {
  const o = overrides[iso(x)] ?? {};
  const jamaat = {} as Record<JamaatPrayer, number>;
  const edited = {} as Record<JamaatPrayer, boolean>;
  for (const p of JAMAAT_PRAYERS) {
    const manual = o[p];
    edited[p] = manual !== undefined;
    jamaat[p] = manual ?? ruleJamaatFor(p, config, x);
  }
  return { jamaat, edited };
}

export function buildDay(x: Ymd, config: Config, overrides: Overrides = {}): DayRow {
  const adhan = adhanTimes(x);
  const { jamaat, edited } = jamaatFor(x, config, overrides);
  const prev = jamaatFor(addDays(x, -1), config, overrides).jamaat;
  const changed = {} as Record<JamaatPrayer, boolean>;
  const direction = {} as Record<JamaatPrayer, 1 | -1 | 0>;
  const beforeAdhan = {} as Record<JamaatPrayer, boolean>;
  const shownAdhan = { ...adhan };
  for (const p of JAMAAT_PRAYERS) {
    changed[p] = p !== 'maghrib' && prev[p] !== jamaat[p];
    direction[p] = !changed[p] ? 0 : jamaat[p] > prev[p] ? 1 : -1;
    beforeAdhan[p] = jamaat[p] < adhan[p];
    if (beforeAdhan[p]) shownAdhan[p] = jamaat[p];
  }
  const wd = weekday(x);
  const k = periodFor(config.khutbah, x);
  const ramKhutbah = ramadanDay(ramadanDates(config), x) ? parseTime(config.ramadan.khutbah) : null;
  return {
    date: x,
    key: iso(x),
    weekday: wd,
    isFriday: wd === 5,
    clockChange: isClockChangeDay(x) ? (isSummerTime(x) ? 'forward' : 'back') : null,
    hijri: config.showHijri ? hijri(x, config.hijriOffset) : null,
    adhan,
    jamaat,
    changed,
    direction,
    shownAdhan,
    edited,
    beforeAdhan,
    khutbah: ramKhutbah ?? (k ? parseTime(k.time) : null),
  };
}

export function buildMonth(y: number, m: number, config: Config, overrides: Overrides = {}): DayRow[] {
  const rows: DayRow[] = [];
  for (let d = 1; d <= daysInMonth(y, m); d++) rows.push(buildDay(ymd(y, m, d), config, overrides));
  return rows;
}
