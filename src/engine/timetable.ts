// Puts it together: one row per day with adhan + jamaat times.

import { adhanTimes, type DayTimes } from './ifi';
import { JAMAAT_PRAYERS, type Config, type JamaatPrayer } from './config';
import { ruleJamaat, periodFor } from './jamaat';
import { hijri, type HijriDate } from './hijri';
import {
  addDays, daysInMonth, iso, isClockChangeDay, isSummerTime, parseTime, weekday, ymd, type Ymd,
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
  /** set by hand rather than by the rules */
  edited: Record<JamaatPrayer, boolean>;
  /** jamaat is earlier than the adhan (e.g. fixed summer Isha) */
  beforeAdhan: Record<JamaatPrayer, boolean>;
  khutbah: number | null;
}

export function jamaatFor(x: Ymd, config: Config, overrides: Overrides = {}) {
  const o = overrides[iso(x)] ?? {};
  const jamaat = {} as Record<JamaatPrayer, number>;
  const edited = {} as Record<JamaatPrayer, boolean>;
  for (const p of JAMAAT_PRAYERS) {
    const manual = o[p];
    edited[p] = manual !== undefined;
    jamaat[p] = manual ?? ruleJamaat(p, config.rules[p], x);
  }
  return { jamaat, edited };
}

export function buildDay(x: Ymd, config: Config, overrides: Overrides = {}): DayRow {
  const adhan = adhanTimes(x);
  const { jamaat, edited } = jamaatFor(x, config, overrides);
  const prev = jamaatFor(addDays(x, -1), config, overrides).jamaat;
  const changed = {} as Record<JamaatPrayer, boolean>;
  const beforeAdhan = {} as Record<JamaatPrayer, boolean>;
  for (const p of JAMAAT_PRAYERS) {
    changed[p] = p !== 'maghrib' && prev[p] !== jamaat[p];
    beforeAdhan[p] = jamaat[p] < adhan[p];
  }
  const wd = weekday(x);
  const k = periodFor(config.khutbah, x);
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
    edited,
    beforeAdhan,
    khutbah: k ? parseTime(k.time) : null,
  };
}

export function buildMonth(y: number, m: number, config: Config, overrides: Overrides = {}): DayRow[] {
  const rows: DayRow[] = [];
  for (let d = 1; d <= daysInMonth(y, m); d++) rows.push(buildDay(ymd(y, m, d), config, overrides));
  return rows;
}
