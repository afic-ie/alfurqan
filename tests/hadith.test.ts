import { describe, expect, it } from 'vitest';
import { cloneConfig, DEFAULT_CONFIG } from '../src/engine/config';
import { ALL_HADITH, hadithList, hadithNow, isQuietTime } from '../src/engine/hadith';
import { buildDay } from '../src/engine/timetable';
import { ymd } from '../src/engine/time';

const on = () => {
  const c = cloneConfig(DEFAULT_CONFIG);
  c.hadith.enabled = true;
  c.hadith.approved = true;
  return c;
};

describe('hadith data', () => {
  it('has complete, unique entries', () => {
    const ids = new Set(ALL_HADITH.map((h) => h.id));
    expect(ids.size).toBe(ALL_HADITH.length);
    for (const h of ALL_HADITH) {
      expect(h.ar.length).toBeGreaterThan(5);
      expect(h.en.length).toBeGreaterThan(5);
      expect(h.ref).toMatch(/\d/);
      expect(h.url).toMatch(/^https:\/\/sunnah\.com\//);
    }
  });

  it('keeps Ramadan hadith for Ramadan and honours the hidden list', () => {
    const c = on();
    expect(hadithList(c, false).every((h) => h.season !== 'ramadan')).toBe(true);
    expect(hadithList(c, true).length).toBe(ALL_HADITH.length);
    c.hadith.hidden = [ALL_HADITH[0].id];
    expect(hadithList(c, true).find((h) => h.id === ALL_HADITH[0].id)).toBeUndefined();
  });
});

describe('hadith slots', () => {
  const d = ymd(2026, 11, 3); // Tuesday; jamaat 6:15, 1:00, 3:00, 5:06, 7:15
  const row = buildDay(d, DEFAULT_CONFIG);

  it('shows nothing until enabled and reviewed', () => {
    expect(hadithNow(DEFAULT_CONFIG, row, d, 10 * 60, false)).toBeNull();
    const c = on();
    c.hadith.approved = false;
    expect(hadithNow(c, row, d, 10 * 60, false)).toBeNull();
  });

  it('shows at the start of a slot, for the set seconds only', () => {
    const c = on(); // every 15 min, 30 s
    expect(hadithNow(c, row, d, 10 * 60, false)).not.toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 20 / 60, false)).not.toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 40 / 60, false)).toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 7, false)).toBeNull();
    expect(hadithNow(c, row, d, 10 * 60 + 15, false)).not.toBeNull();
  });

  it('stays quiet around jamaat and the khutbah', () => {
    const c = on();
    expect(isQuietTime(c, row, 13 * 60 - 10)).toBe(true); // 12:50, Dhuhr jamaat 1:00
    expect(isQuietTime(c, row, 13 * 60 + 19)).toBe(true);
    expect(isQuietTime(c, row, 13 * 60 + 20)).toBe(false);
    expect(hadithNow(c, row, d, 13 * 60, false)).toBeNull();
    const fri = buildDay(ymd(2026, 11, 6), DEFAULT_CONFIG); // khutbah 1:20
    expect(isQuietTime(c, fri, 13 * 60 + 15)).toBe(true);
    expect(isQuietTime(c, fri, 14 * 60 + 15)).toBe(true);
    expect(isQuietTime(c, fri, 14 * 60 + 20)).toBe(false);
  });

  it('rotates through the list rather than repeating', () => {
    const c = on();
    const a = hadithNow(c, row, d, 9 * 60, false)!;
    const b = hadithNow(c, row, d, 9 * 60 + 15, false)!;
    const z = hadithNow(c, row, ymd(2026, 11, 4), 9 * 60, false)!;
    expect(a.id).not.toBe(b.id);
    expect(a.id).not.toBe(z.id);
  });
});
