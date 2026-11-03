// Hijri dates using the browser's built-in Umm al-Qura calendar.
// `offset` shifts the result by whole days to follow local moon sighting.

import { addDays, type Ymd } from './time';

export interface HijriDate {
  day: number;
  month: number; // 1-12
  year: number;
  monthName: string;
  monthNameAr: string;
}

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah',
];

export const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

let fmt: Intl.DateTimeFormat | null = null;

export function hijri(x: Ymd, offset = 0): HijriDate | null {
  try {
    fmt ??= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
    const s = addDays(x, offset);
    const parts = fmt.formatToParts(new Date(Date.UTC(s.y, s.m - 1, s.d, 12)));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const day = get('day');
    const month = get('month');
    const year = Number(String(parts.find((p) => p.type === 'year')?.value).replace(/\D/g, ''));
    if (!day || !month || !year) return null;
    return { day, month, year, monthName: HIJRI_MONTHS[month - 1], monthNameAr: HIJRI_MONTHS_AR[month - 1] };
  } catch {
    return null;
  }
}
