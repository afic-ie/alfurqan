# Masjid Al-Furqan – website and prayer timetable

The website for Masjid Al-Furqan (Al Furqan Community Association, Limerick)
and the prayer timetable generator behind it. Live at
<https://saajunaid.github.io/alfurqan/>.

| Page | What it is |
|---|---|
| `/` | Home: today's adhan and jamaat times, next-prayer countdown, appeal, services |
| `/timetable/` | Monthly timetable for the public; print or save as PDF |
| `/about/`, `/services/`, `/project/`, `/donate/`, `/contact/` | Content pages (text in `src/site/content.ts`) |
| `/admin/` | Timetable editor: jamaat rules, manual changes, settings, print |

The public pages read `public/data/published.json`; the admin page edits a
local copy in the browser (a Publish step that writes the file to the repo is
the next piece of work).

## The timetable generator

Generates the monthly prayer timetable ready to print or save as PDF. It
replaces the manual process of downloading IFI's PDF, converting it and adding
jamaat times in Excel.

* **Adhan times** come from the Islamic Foundation of Ireland's Limerick
  table, which is bundled in the app. It works offline and gives exact times
  for any year.
* **Jamaat times** are proposed by rules that reproduce how the mosque set
  them in 2025–26. Click any jamaat time to change it for that week or day.
* **Print / Save PDF** gives one A4 page per month.

See [docs/analysis.md](docs/analysis.md) for how the times and rules were
worked out from the mosque's past timetables.

## Using the admin page

1. Open `/admin/` and pick the first month (it starts on the next two-month
   block, e.g. January when used in November).
2. Check the jamaat columns. Blue diamonds mark the days a jamaat time
   changes. Click a time to change it for that day, the whole week (Friday to
   Thursday) or any range of dates. **Adjust jamaat** in the toolbar does the
   same for any prayer and date range.
3. **Settings:** the mosque logo and the WhatsApp and Stripe QR codes are
   built in. You can replace them, add more QR codes (from an image or just a
   link), and change the bank details, khutbah times and the jamaat rules.
4. **Print / Save PDF:** choose A4, margins *None*, and turn on *Background
   graphics*.

The Hijri column uses the Umm al-Qura (Saudi) calendar; Settings has a
day offset if the local announcement differs.

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

`npm run build` writes the whole site to `dist/`. Every merge into `main`
publishes it to GitHub Pages automatically (`.github/workflows/pages.yml`).

## Project layout

| Path | What it is |
|---|---|
| `src/data/ifi-limerick.json` | IFI Limerick adhan table (normal and leap year) |
| `src/engine/` | Adhan times, clock changes, jamaat rules, Hijri dates |
| `src/engine/config.ts` | Default settings and jamaat rules (explained in comments) |
| `src/assets/` | Logo and QR code images (WhatsApp group, Stripe donations) |
| `src/ui/` | Timetable page design, settings panel, storage |
| `src/site/` | Website: layout and navigation, content, today widget, published data |
| `src/pages/` | Entry scripts for the website pages |
| `public/data/published.json` | Published jamaat changes read by the public pages |
| `src/styles/app.css` | Look and feel, including the print layout |
| `tests/` | Tests; `fixtures/published-jamaat.json` holds the mosque's published jamaat times (2024 – Dec 2026) |
| `tools/extract_ifi_tables.py` | Rebuilds the IFI table from IFI's web app |

## Roadmap

1. ~~Monthly timetable generator~~
2. ~~Website shell: navigation, home, public timetable, content pages~~
3. Publish from the admin page (GitHub token) so the public site updates
4. TV display mode for the mosque screen (offline Android box)
5. Ramadan timetable
6. afic.ie domain, then redirect alfurqan.ie
