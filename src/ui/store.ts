// Saves settings and manual edits in this browser, and to/from a file.

import { cloneConfig, DEFAULT_CONFIG, normaliseConfig, type Config } from '../engine/config';
import type { Overrides } from '../engine/timetable';

const KEY = 'alfurqan.timetable.v1';

export interface Saved {
  config: Config;
  overrides: Overrides;
}

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { config: normaliseConfig(s.config), overrides: s.overrides ?? {} };
    }
  } catch {
    /* storage blocked or corrupt: fall back to defaults */
  }
  return { config: cloneConfig(DEFAULT_CONFIG), overrides: {} };
}

export function save(s: Saved): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false; // e.g. very large logo image, or private browsing
  }
}

export function downloadJson(s: Saved, filename: string) {
  const blob = new Blob([JSON.stringify({ app: 'alfurqan-timetable', ...s }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function readJsonFile(file: File): Promise<Saved> {
  const s = JSON.parse(await file.text());
  return { config: normaliseConfig(s.config), overrides: s.overrides ?? {} };
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
