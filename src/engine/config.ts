// All settings that a person may want to change live here.
// The defaults reproduce how Masjid Al-Furqan set jamaat times in 2025-26
// (see docs/analysis.md). Everything is editable in the app's Settings panel.

export type JamaatPrayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const JAMAAT_PRAYERS: JamaatPrayer[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * When a seasonal setting starts. One of:
 *  - "summer-start" : the day clocks go forward (last Sunday of March)
 *  - "summer-end"   : the day clocks go back (last Sunday of October)
 *  - "last-fri-MM"  : last Friday of month MM, e.g. "last-fri-01"
 *  - "MM-DD"        : a fixed date, e.g. "11-01"
 */
export type Anchor = string;

export interface Period {
  from: Anchor;
  time: string; // "HH:MM" 24-hour
}

/**
 * "Weekly step" rule. The jamaat time is set for each week (Friday to
 * Thursday, or from a clock-change day) as the first time on a `step`-minute
 * grid that is at least `gap` minutes after the latest adhan of that week,
 * kept between `earliest` and `latest`.
 */
export interface StepRule {
  kind: 'step';
  gapWinter: number;
  gapSummer: number;
  step: number;
  earliest?: string;
  latest?: string;
}

/** Fixed time per season (e.g. Dhuhr). */
export interface PeriodRule {
  kind: 'periods';
  periods: Period[];
}

/** Same as the adhan plus an offset (e.g. Maghrib). */
export interface AdhanRule {
  kind: 'adhan';
  offset: number;
}

export type Rule = StepRule | PeriodRule | AdhanRule;

export interface MosqueInfo {
  name: string;
  arabicName: string;
  city: string;
  website: string;
  bankLine: string;
  donateCaption: string;
  donationUrl: string; // QR code is generated from this when no QR image is uploaded
  qrImage: string; // optional uploaded image (data URL)
  logo: string; // optional uploaded logo (data URL)
  extraNote: string;
}

export interface Config {
  version: 1;
  mosque: MosqueInfo;
  rules: Record<JamaatPrayer, Rule>;
  khutbah: Period[];
  hijriOffset: number; // days, to follow local moon sighting
  showHijri: boolean;
}

export const DEFAULT_CONFIG: Config = {
  version: 1,
  mosque: {
    name: 'Masjid Al-Furqan',
    arabicName: 'مسجد الفرقان',
    city: 'Limerick',
    website: 'www.alfurqan.ie',
    bankLine: 'BANK: BOI · IBAN: IE36 BOFI 9043 0983 4507 78 · BIC: BOFIIE2D',
    donateCaption: 'Donate for the Mosque',
    donationUrl: '',
    qrImage: '',
    logo: '',
    extraNote: '',
  },
  rules: {
    fajr: { kind: 'step', gapWinter: 20, gapSummer: 20, step: 15, earliest: '04:00' },
    dhuhr: {
      kind: 'periods',
      periods: [
        { from: '01-01', time: '13:00' },
        { from: 'last-fri-01', time: '13:30' },
        { from: 'summer-start', time: '14:00' },
        { from: 'last-fri-09', time: '13:45' },
        { from: 'summer-end', time: '13:00' },
      ],
    },
    asr: { kind: 'step', gapWinter: 5, gapSummer: 45, step: 30, earliest: '15:00', latest: '19:00' },
    maghrib: { kind: 'adhan', offset: 0 },
    isha: { kind: 'step', gapWinter: 0, gapSummer: 0, step: 15, earliest: '19:30', latest: '23:20' },
  },
  khutbah: [
    { from: '01-01', time: '13:20' },
    { from: 'summer-start', time: '13:40' },
    { from: '09-01', time: '13:35' },
    { from: '10-01', time: '13:30' },
    { from: 'summer-end', time: '13:20' },
  ],
  hijriOffset: 0,
  showHijri: true,
};

export function cloneConfig(c: Config): Config {
  return JSON.parse(JSON.stringify(c));
}

/** Fill any missing fields (e.g. from an older saved file) with defaults. */
export function normaliseConfig(raw: unknown): Config {
  const base = cloneConfig(DEFAULT_CONFIG);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Config>;
  return {
    ...base,
    ...r,
    version: 1,
    mosque: { ...base.mosque, ...(r.mosque ?? {}) },
    rules: { ...base.rules, ...(r.rules ?? {}) },
    khutbah: Array.isArray(r.khutbah) ? r.khutbah : base.khutbah,
  };
}
