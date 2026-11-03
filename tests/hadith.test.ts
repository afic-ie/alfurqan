import { describe, expect, it } from 'vitest';
import { cloneConfig, DEFAULT_CONFIG } from '../src/engine/config';
import { ALL_HADITH, CATEGORIES, dayContext, hadithList, hadithNow, isQuietTime, type DayContext } from '../src/engine/hadith';
import { buildDay } from '../src/engine/timetable';
import { ymd } from '../src/engine/time';

const on = () => {
  const c = cloneConfig(DEFAULT_CONFIG);
  c.hadith.enabled = true;
  return c;
};
const plain: DayContext = { hijriMonth: 5, isFriday: false };
const ramadan: DayContext = { hijriMonth: 9, isFriday: false };

describe('hadith data', () => {
  it('has complete, unique, graded entries in known categories', () => {
    const ids = new Set(ALL_HADITH.map((h) => h.id));
    expect(ids.size).toBe(ALL_HADITH.length);
    expect(ALL_HADITH.length).toBeGreaterThanOrEqual(150);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const h of ALL_HADITH) {
      expect(h.ar.length).toBeGreaterThan(5);
      expect(h.ar.length).toBeLessThanOrEqual(300);
      expect(h.en.length).toBeGreaterThan(5);
      expect(h.ref).toMatch(/\d/);
      expect(h.url).toMatch(/^https:\/\/sunnah\.com\//);
      expect(h.grade.toLowerCase()).toMatch(/sahih|hasan/);
      expect(h.grade.toLowerCase()).not.toMatch(/da.?if/);
      expect(cats.has(h.category)).toBe(true);
    }
  });

  it('shows seasonal categories only in their months, alternating with general ones', () => {
    const c = on();
    expect(hadithList(c, plain).some((h) => h.category === 'ramadan')).toBe(false);
    const inRam = hadithList(c, ramadan);
    expect(inRam.some((h) => h.category === 'ramadan')).toBe(true);
    expect(inRam[0].category).toBe('ramadan');
    expect(inRam[1].category).not.toBe('ramadan');
    expect(hadithList(c, { hijriMonth: 12, isFriday: false }).some((h) => h.category === 'hajj')).toBe(true);
    expect(hadithList(c, { hijriMonth: 5, isFriday: true }).some((h) => h.category === 'jumuah')).toBe(true);
    expect(hadithList(c, plain).some((h) => h.category === 'jumuah')).toBe(false);
  });

  it('follows the schedule set in Settings', () => {
    const c = on();
    c.hadith.schedule = { ramadan: { when: 'always' }, character: { when: 'never' }, hajj: { when: 'months', months: [5] } };
    const list = hadithList(c, plain);
    expect(list.some((h) => h.category === 'ramadan')).toBe(true);
    expect(list.some((h) => h.category === 'character')).toBe(false);
    expect(list.some((h) => h.category === 'hajj')).toBe(true);
  });

  it('honours the hidden list and includes custom hadith, skipping empty ones', () => {
    const c = on();
    c.hadith.hidden = [ALL_HADITH[0].id];
    expect(hadithList(c, plain).find((h) => h.id === ALL_HADITH[0].id)).toBeUndefined();
    c.hadith.custom = [
      { id: 'custom-1', category: 'faith', ar: 'نص', en: 'Text', ref: 'Sahih Muslim 1', grade: 'Sahih' },
      { id: 'custom-2', category: 'faith', ar: '', en: '  ', ref: '', grade: '' },
    ];
    expect(hadithList(c, plain).filter((h) => h.id.startsWith('custom')).map((h) => h.id)).toEqual(['custom-1']);
  });

  it('uses the Ramadan dates from Settings for the month', () => {
    const c = on();
    c.ramadan.start = '2027-02-08';
    expect(dayContext(c, ymd(2027, 2, 20), false).hijriMonth).toBe(9);
    expect(dayContext(c, ymd(2027, 1, 20), false).hijriMonth).not.toBe(9);
  });
});

describe('hadith slots', () => {
  const d = ymd(2026, 11, 3); // Tuesday; jamaat 6:15, 1:00, 3:00, 5:06, 7:15
  const row = buildDay(d, DEFAULT_CONFIG);

  it('shows nothing when switched off', () => {
    const c = on();
    c.hadith.enabled = false;
    expect(hadithNow(c, row, d, 10 * 60, plain)).toBeNull();
  });

  it('shows at the start of a slot, for the set seconds only', () => {
    const c = on(); // every 15 min, 30 s
    expect(hadithNow(c, row, d, 10 * 60, plain)).not.toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 20 / 60, plain)).not.toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 40 / 60, plain)).toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 7, plain)).toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 15, plain)).not.toBeNull();
  });

  it('stays quiet around jamaat and the khutbah', () => {
    const c = on();
    expect(isQuietTime(c, row, 13 * 60 - 10)).toBe(true);
    expect(isQuietTime(c, row, 13 * 60 + 19)).toBe(true);
    expect(isQuietTime(c, row, 13 * 60 + 20)).toBe(false);
    expect(hadithNow(c, row, d, 13 * 60, plain)).toBeNull();
    const fri = buildDay(ymd(2026, 11, 6), DEFAULT_CONFIG); // khutbah 1:20
    expect(isQuietTime(c, fri, 13 * 60 + 15)).toBe(true);
    expect(isQuietTime(c, fri, 14 * 60 + 15)).toBe(true);
    expect(isQuietTime(c, fri, 14 * 60 + 20)).toBe(false);
  });

  it('rotates through the list rather than repeating', () => {
    const c = on();
    const a = hadithNow(c, row, d, 9 * 60, plain)!;
    const b = hadithNow(c, row, d, 9 * 60 + 15, plain)!;
    const z = hadithNow(c, row, ymd(2026, 11, 4), 9 * 60, plain)!;
    expect(a.id).not.toBe(b.id);
    expect(a.id).not.toBe(z.id);
  });
});
