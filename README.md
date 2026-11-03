# Masjid Al-Furqan – prayer timetable app

Manages and publishes the prayer timetable for Masjid Al-Furqan (Limerick).
Live at <https://saajunaid.github.io/alfurqan/>.

| Page | What it is |
|---|---|
| `/` | Public timetable: today's adhan and jamaat times, next-prayer countdown, the monthly timetable, print / save as PDF |
| `/tv/` | TV display for the mosque screen (landscape, full screen, works offline) |
| `/admin/` | Editor: jamaat rules, manual changes, settings, print |

The public page reads `public/data/published.json`. The admin page edits a
copy in the browser and **Publish** writes it back to the repository, which
republishes the site within a couple of minutes.

## Publishing (admins)

1. Open `/admin/`, make your changes, click **Publish**.
2. The first time, it asks for a GitHub token. Create a *fine-grained*
   personal access token on GitHub with access to only this repository and
   the permission **Contents: read and write**. Paste it in; it is kept in
   that browser only. Only people with write access to the repository can
   create such a token, so only they can publish.
3. Later publishes are one click. Use **Forget token** in the dialog to
   remove it from a shared computer.

Edits are stored per browser. On a new computer, Settings → **Load the
published version** starts you from what is live.

## Install as an app (PWA)

The site is a progressive web app: on a phone, use the browser's **Add to
Home Screen** (iPhone: Share → Add to Home Screen; Android: the install
prompt or ⋮ → Install app). It opens full screen with the mosque icon, and
every page keeps working without internet once it has been opened once.
New versions are picked up automatically on the next online visit.

## The TV display (`/tv/`)

Shows the clock, date (English and Hijri), the five prayers with adhan and
jamaat, the next prayer with a countdown, sunrise, the Jumu'ah khutbah time,
and the announcement set in Admin. For ten minutes from each jamaat time it
switches to a full-screen "jamaat in progress" reminder.

It keeps working with no internet: the page and the published data are
cached on the device after the first load. It checks for newly published
data every 30 minutes (when online) and reloads itself at 03:30 each day.

**Android box setup:** install a kiosk browser (e.g. Fully Kiosk Browser,
free), set its start URL to `https://saajunaid.github.io/alfurqan/tv/`, turn on
"start on boot", "keep screen on" and "fullscreen". Tap the screen once to go
full screen in an ordinary browser. The box must keep the correct time, so
set its time zone to Dublin and leave automatic time on if it has internet.

The mosque website (afic.ie) is a separate project; it will embed today's
times and the timetable from this app.

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
| `src/site/` | Public page: layout and navigation, today widget, published data |
| `src/pages/` | Entry script for the public page |
| `public/data/published.json` | Published jamaat changes read by the public pages |
| `src/styles/app.css` | Look and feel, including the print layout |
| `tests/` | Tests; `fixtures/published-jamaat.json` holds the mosque's published jamaat times (2024 – Dec 2026) |
| `tools/extract_ifi_tables.py` | Rebuilds the IFI table from IFI's web app |

## Roadmap

1. ~~Monthly timetable generator~~
2. ~~Public timetable page with today's times~~
3. ~~Publish from the admin page~~
4. ~~TV display mode for the mosque screen~~
5. Ramadan timetable
6. Embed for the afic.ie website (separate project)
