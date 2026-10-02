# Career Compass

A gentle job-search companion built for Smitapragyan Patro. It covers role paths across three lanes, a company
directory, search links for Indian and global job sites, and a CV studio with Word export. It also has letter
templates, an application tracker, interview prep and a care corner. An India/Global switch in the top bar
changes the search sites, companies, CV notes and plan.

It runs as a **Google Apps Script web app** with a **Google Sheet** as its database. Updating the page never
touches the data.

## The two files

Ready-to-paste copies are in `apps-script/`. Rebuild them with `python3 build.py` after changing anything in `src/`:

- `apps-script/Code.gs` is the server. It saves to the Sheet's tabs (Applications, Messages, Store), saves
  files to a Drive folder, and runs an optional "Ask Claude" helper.
- `apps-script/Interface.html` is the whole page. It also opens offline in a browser, saving to that browser
  only.

Setup steps are at the top of `Code.gs`. In short:

1. Create a Sheet.
2. Go to Extensions > Apps Script and paste both files (name the HTML file `Interface`).
3. Run `setup`.
4. Deploy as a web app, with Execute as: Me and Who has access: Only myself.

Do all four steps signed in to Smitapragyan's own Google account, ideally in a private window with no other
Google account signed in. With "Only myself", only that account can open the page. To keep it in your own
account instead, follow "If someone else hosts it for her" in `Code.gs`.

## How data stays safe across updates

- **Applications and Messages** are readable tables, one row per item. **Store** holds everything else as JSON,
  split across cells when long.
- Every record carries an `updatedAt` time. An older save never overwrites a newer one, so two devices can be
  used safely. If the same section (the CV, the letters, the journal, or one application) changes on two
  devices before they sync, the later change wins. Reload the page on one device to see changes made on the other.
- Columns are matched by name. New versions add missing columns automatically. Columns you add by hand are kept,
  and fields this version doesn't know about are kept in the `extra` column.
- Read the Sheet, but make changes in the app. Edits typed into the Sheet are usually not picked up, and the
  app's next save of that row writes over them. Do not rename the tabs or the column headings: a renamed tab
  counts as missing and a new, empty one is made.
- Deleted applications stay as rows marked `deleted` = true, so every device learns about the deletion.
- If something goes wrong, File > Version history in the Sheet can restore an earlier state.
- To let someone else see the tracker, share the Sheet as Viewer. Editors can open Extensions > Apps Script
  and read the script properties, including an Anthropic API key.

## Limits and troubleshooting

- A free Google account allows each server call up to 6 minutes, and 20,000 outside requests (Ask Claude) a day.
  Normal use stays far below both.
- Work or school (Workspace) accounts may not offer "Who has access: Anyone"; their admin decides.
- If saving or a helper fails, open Apps Script > Executions (left sidebar). Each run is listed with its error.
- After a `Code.gs` update that needs new permissions, run `setup` once in the editor. Until then the page shows
  an authorisation error.

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
