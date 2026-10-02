# Career Compass

A gentle job-search companion built for Smitapragyan Patro: role paths, a company directory, search links for
Indian job sites, a CV studio with Word export, letter templates, an application tracker, interview prep and a
care corner. It is a single HTML page with no server; data stays in the browser (and, when opened as a
claude.ai artifact, in the viewer's private store).

## Layout

- `src/shell.html` page skeleton; `src/styles.css` design tokens and components
- `src/core.js` DOM helper, dates, local-first store with optional private cloud sync, downloads, clipboard
- `src/cv.js` CV model shared by the preview, the Word export and the plain-text copy
- `src/docx.js` dependency-free .docx writer
- `src/app.js` views and router
- `src/data/*.js` all content (each file adds one part to `window.CC_DATA_PARTS`)

## Build and check

```sh
node tests/validate-data.js          # content matches the data contract
python3 build.py                      # writes dist/index.html (artifact body) and dist/career-compass.html (offline page)
node tests/smoke.js dist/career-compass.html /tmp/shots   # Playwright click-through at phone and desktop widths
```
