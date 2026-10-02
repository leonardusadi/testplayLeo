# Career Compass

A gentle job-search companion built for Smitapragyan Patro. It covers role paths across three lanes, a company
directory, search links for Indian and global job sites, and a CV studio with Word export. It also has letter
templates, an application tracker, interview prep and a care corner. An India/Global switch in the top bar
changes the search sites, companies, CV notes and plan.

It runs as a **Google Apps Script web app** with a **Google Sheet** as its database. Updating the page never
touches the data.

## The two files

Build them with `python3 build.py`:

- `apps-script/Code.gs` is the server. It saves to the Sheet's tabs (Applications, Messages, Store), saves
  files to a Drive folder, and runs an optional "Ask Claude" helper.
- `apps-script/Interface.html` is the whole page. It also opens offline in a browser, saving to that browser
  only.

Setup steps are at the top of `Code.gs`. In short:

1. Create a Sheet.
2. Go to Extensions > Apps Script and paste both files (name the HTML file `Interface`).
3. Run `setup`.
4. Deploy as a web app, with Execute as: Me and Who has access: Only myself.

## How data stays safe across updates

- **Applications and Messages** are readable tables, one row per item. **Store** holds everything else as JSON,
  split across cells when long.
- Every record carries an `updatedAt` time. An older save never overwrites a newer one, so two devices can be
  used safely.
- Columns are matched by name. New versions add missing columns automatically. Columns you add by hand are kept,
  and fields this version doesn't know about are kept in the `extra` column.

## Source layout

- `src/shell.html`, `src/styles.css`: page skeleton and design tokens
- `src/core.js`: DOM helper, dates, local-first store, Sheet sync over `google.script.run`, files, Ask Claude
- `src/cv.js`: the CV model behind the preview, the Word export and the plain-text copy
- `src/docx.js`: a .docx writer with no dependencies
- `src/app.js`: views, router (safe inside the Apps Script iframe), India/Global mode
- `src/data/*.js`: all content (each file adds one part to `window.CC_DATA_PARTS`)
- `src/apps-script/Code.gs`: the server

## Checks

```sh
node tests/validate-data.js                      # content matches the data contract
node tests/gas-unit.js                           # Code.gs against in-memory Apps Script services
python3 build.py
node tests/e2e-gas.js apps-script/Interface.html /tmp/e2e   # browser + mocked server, two devices
node tests/smoke.js apps-script/Interface.html /tmp/shots   # every view, phone and desktop, no server
```
