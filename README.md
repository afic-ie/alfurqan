# Masjid Al-Furqan – Prayer Timetable

Generates Masjid Al-Furqan's monthly prayer timetable (Limerick, Ireland),
ready to print or save as PDF. It replaces the manual process of downloading
IFI's PDF, converting it and adding jamaat times in Excel.

* **Adhan times** come from the Islamic Foundation of Ireland's Limerick
  table, which is bundled in the app. It works offline and gives exact times
  for any year.
* **Jamaat times** are proposed by rules that reproduce how the mosque set
  them in 2025–26. Click any jamaat time to change it for that week or day.
* **Print / Save PDF** gives one A4 page per month.

See [docs/analysis.md](docs/analysis.md) for how the times and rules were
worked out from the mosque's past timetables.

## Using it

1. Open the app and pick the first month (it starts on the next two-month
   block, e.g. January when used in November).
2. Check the jamaat columns. Gold diamonds mark the days a jamaat time
   changes. Click a time to change it for the whole week (Friday to Thursday)
   or just that day.
3. **Settings:** upload the logo and the donation QR code (or paste the
   donation link and a QR code is made from it). You can also change the bank
   details, khutbah times and the jamaat rules here.
4. **Print / Save PDF:** choose A4, margins *None*, and turn on *Background
   graphics*.

Settings and changes are saved in the browser. Use **Download settings file**
to back them up or move them to another computer.

You can link straight to a month: `?y=2027&m=3&n=2` (year, first month,
number of months).

## Running it

Needs Node.js 20 or later.

```bash
npm install
npm run dev      # local development server
npm test         # engine tests (IFI data, clock changes, rules vs history)
npm run build    # builds dist/index.html
```

`npm run build` produces a **single self-contained file**, `dist/index.html`,
with fonts and code inlined. Open it directly in a browser; no server or
internet needed. You can also host it anywhere, e.g. GitHub Pages.

## Project layout

| Path | What it is |
|---|---|
| `src/data/ifi-limerick.json` | IFI Limerick adhan table (normal and leap year) |
| `src/engine/` | Adhan times, clock changes, jamaat rules, Hijri dates |
| `src/engine/config.ts` | Default settings and jamaat rules (explained in comments) |
| `src/ui/` | Timetable page design, settings panel, storage |
| `src/styles/app.css` | Look and feel, including the print layout |
| `tests/` | Tests; `fixtures/published-jamaat.json` holds the mosque's published 2024–26 jamaat times |
| `tools/extract_ifi_tables.py` | Rebuilds the IFI table from IFI's web app |

## Roadmap

1. ~~Monthly timetable generator~~ (this)
2. TV display mode for the mosque screen (offline Android box)
3. Ramadan timetable
4. afic.ie website, then redirect alfurqan.ie
