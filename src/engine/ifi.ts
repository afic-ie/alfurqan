// Adhan (start) times for Limerick from the Islamic Foundation of Ireland table.
//
// IFI publishes one fixed table per city that repeats every year: a "normal"
// table and a "leap" table (used when the year is divisible by 4, exactly as
// IFI's own app does). Times in the table are Irish Standard Time (GMT);
// we add one hour during Irish Summer Time.

import table from '../data/ifi-limerick.json';
import { isSummerTime, type Ymd } from './time';

export const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type TimeName = (typeof PRAYERS)[number];
export type DayTimes = Record<TimeName, number>;

type Table = number[][][];
const NORMAL = table.normal as Table;
const LEAP = table.leap as Table;

export function adhanTimes(x: Ymd): DayTimes {
  const t = (x.y % 4 === 0 ? LEAP : NORMAL)[x.m - 1]?.[x.d - 1];
  if (!t) throw new Error(`No IFI data for ${x.y}-${x.m}-${x.d}`);
  const offset = isSummerTime(x) ? 60 : 0;
  const out = {} as DayTimes;
  PRAYERS.forEach((p, i) => {
    out[p] = t[i] + offset;
  });
  return out;
}
