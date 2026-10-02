/**
 * Career Compass — backend for Smitapragyan's job-search companion.
 *
 * Interface.html is the page. This file stores everything in a Google Sheet, so the data stays put
 * whenever the page is updated: replacing Interface.html never touches the Sheet.
 *
 * ONE-TIME SETUP (about 10 minutes, in the Google account that should own the data)
 *  1. Open https://sheets.new and name the spreadsheet "Career Compass".
 *  2. Extensions > Apps Script. Replace the sample code in Code.gs with this file.
 *  3. Click + next to Files > HTML. Name it exactly  Interface  and paste Interface.html into it.
 *  4. Choose "setup" in the function menu at the top and click Run. Approve the permissions.
 *     Google shows "Google hasn't verified this app" for every personal script:
 *     click Advanced > Go to Career Compass (unsafe) > Allow. The script only touches this Sheet
 *     and a "Career Compass" folder in Drive (when you click Save to Drive).
 *  5. Deploy > New deployment > gear icon > Web app.
 *       Execute as: Me
 *       Who has access: Only myself      (she must be signed in to this Google account to open it)
 *     Click Deploy and open the Web app URL. Bookmark it; on a phone use "Add to Home screen".
 *
 * UPDATING THE PAGE LATER
 *  Paste the new Interface.html (and this file if it changed), then Deploy > Manage deployments >
 *  pencil icon > Version: New version > Deploy. The link and the data stay the same.
 *
 * IF SOMEONE ELSE HOSTS IT FOR HER (optional)
 *  Deploy with "Who has access: Anyone", then run createPrivateLink() once and send her only the link
 *  it prints in the log. Without the ?key=... part, the page cannot read or write the Sheet.
 *
 * OPTIONAL "ASK CLAUDE" HELPERS (tailor CV to a job ad, scam check, interview feedback)
 *  Project Settings (gear) > Script properties > Add: ANTHROPIC_API_KEY = a key from console.anthropic.com.
 *  Each request is billed to that key. Without it, the helpers stay hidden.
 */

const APP_TITLE = "Smitapragyan's Career Compass";
const SCHEMA_VERSION = 1;
const CHUNK = 45000; // a Sheet cell holds at most 50,000 characters
const MAX_CELL = 49000;
const TABS = {
  apps: {
    name: 'Applications',
    cols: ['id', 'company', 'role', 'status', 'platform', 'appliedOn', 'followUpOn', 'followups', 'contact', 'contactInfo',
      'link', 'cvTrack', 'region', 'notes', 'createdAt', 'updatedAt', 'deleted', 'seed', 'extra'],
  },
  messages: {
    name: 'Messages',
    cols: ['id', 'appId', 'date', 'company', 'role', 'label', 'kind', 'subject', 'text', 'tpl'],
  },
  store: {
    name: 'Store',
    cols: ['key', 'part', 'value', 'updatedAt', 'savedOn'],
  },
};
const APP_TEXT_FIELDS = ['id', 'company', 'role', 'status', 'platform', 'appliedOn', 'followUpOn', 'contact', 'contactInfo', 'link', 'cvTrack', 'region', 'notes'];
const APP_KNOWN = new Set(APP_TEXT_FIELDS.concat(['followups', 'createdAt', 'updatedAt', 'deleted', 'seed', 'messages']));
const MSG_FIELDS = ['id', 'date', 'label', 'kind', 'subject', 'text', 'tpl'];

// ---------------------------------------------------------------- web entry points

function doGet(e) {
  const want = props_().getProperty('ACCESS_KEY');
  const given = e && e.parameter && e.parameter.key;
  if (want && given !== want) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:24px">This page is private. Please use the full link you were given.</p>')
      .setTitle(APP_TITLE);
  }
  return HtmlService.createHtmlOutputFromFile('Interface')
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

/**
 * The page's only server call. Takes and returns JSON strings (google.script.run can silently drop
 * some object shapes, so everything crosses as text).
 */
function api(requestJson) {
  let req;
  try {
    req = JSON.parse(requestJson);
  } catch (err) {
    return fail_('bad_request', 'The request was not valid JSON.');
  }
  if (!keyOk_(req.key)) return fail_('locked', 'This page needs its private link.');
  try {
    switch (req.action) {
      case 'load': return ok_(loadAll_());
      case 'save': return ok_(withLock_(() => saveAll_(req.payload || {})));
      case 'saveFile': return ok_(saveFile_(req.payload || {}));
      case 'ai': return ok_(askClaude_(req.payload || {}));
      case 'ping': return ok_({ time: Date.now() });
      default: return fail_('bad_request', 'Unknown action: ' + req.action);
    }
  } catch (err) {
    return fail_(err.code || 'server_error', String((err && err.message) || err));
  }
}

// ---------------------------------------------------------------- run these from the editor

/** Creates the tabs (safe to run again) and prints the Sheet's address. */
function setup() {
  // Granular consent lets people untick a permission; ask again for anything missing before going on.
  if (ScriptApp.requireAllScopes) ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  Object.keys(TABS).forEach((k) => tab_(TABS[k]));
  const book = book_();
  const first = book.getSheets()[0];
  if (first && first.getName() === 'Sheet1' && first.getLastRow() === 0 && book.getSheets().length > 1) book.deleteSheet(first);
  Logger.log('Career Compass is ready. Data lives in: ' + book.getUrl());
  Logger.log('Dates use the Sheet time zone: ' + book.getSpreadsheetTimeZone() + ' (File > Settings in the Sheet).');
  Logger.log('Next: Deploy > New deployment > Web app (Execute as: Me).');
}

/** Optional: lock the page to a secret link, for deployments shared as "Anyone". */
function createPrivateLink() {
  const existing = props_().getProperty('ACCESS_KEY');
  const key = existing || Utilities.getUuid().replace(/-/g, '');
  if (!existing) props_().setProperty('ACCESS_KEY', key);
  const url = ScriptApp.getService().getUrl();
  Logger.log((existing ? 'A private key already exists (unchanged): ' : 'Private key created: ') + key);
  Logger.log('Send her: <your Web app URL, ending in /exec>?key=' + key);
  if (url && /\/exec$/.test(url)) Logger.log('For this deployment that is: ' + url + '?key=' + key);
  Logger.log('To remove the lock, delete the ACCESS_KEY script property (Project Settings > Script properties).');
}

// ---------------------------------------------------------------- load and save

function loadAll_() {
  return {
    core: readStore_(),
    apps: readApps_(),
    meta: {
      schema: SCHEMA_VERSION,
      aiEnabled: !!props_().getProperty('ANTHROPIC_API_KEY'),
      sheetUrl: book_().getUrl(),
      serverTime: Date.now(),
    },
  };
}

function saveAll_(payload) {
  const result = { core: 0, apps: 0, skipped: [] };
  if (payload.core && typeof payload.core === 'object') result.core = writeStore_(payload.core, result.skipped);
  if (Array.isArray(payload.apps)) result.apps = writeApps_(payload.apps, result.skipped);
  SpreadsheetApp.flush();
  result.savedAt = Date.now();
  return result;
}

// Store tab: one row per (key, part). Values are JSON, split across rows when longer than a cell allows.
function readStore_() {
  const t = tab_(TABS.store);
  const grouped = {};
  rows_(t).forEach((r) => {
    const k = String(r.rec.key || '');
    if (!k) return;
    (grouped[k] = grouped[k] || []).push(r.rec);
  });
  const out = {};
  Object.keys(grouped).forEach((k) => {
    const parts = grouped[k].sort((a, b) => Number(a.part) - Number(b.part));
    try {
      out[k] = { value: JSON.parse(parts.map((p) => String(p.value)).join('')), updatedAt: Number(parts[0].updatedAt) || 0 };
    } catch (err) {
      // A damaged value is skipped rather than blocking everything else from loading.
    }
  });
  return out;
}

function writeStore_(core, skipped) {
  const t = tab_(TABS.store);
  const byKey = {};
  rows_(t).forEach((r) => { (byKey[r.rec.key] = byKey[r.rec.key] || []).push(r); });
  const stamp = now_();
  const deletes = [];
  const appends = [];
  let written = 0;
  Object.keys(core).forEach((key) => {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(key)) return;
    const incoming = core[key] || {};
    const ts = Number(incoming.updatedAt) || Date.now();
    const existing = (byKey[key] || []).sort((a, b) => Number(a.rec.part) - Number(b.rec.part));
    if (existing.length && (Number(existing[0].rec.updatedAt) || 0) > ts) { skipped.push(key); return; }
    const json = JSON.stringify(incoming.value === undefined ? null : incoming.value);
    const parts = [];
    for (let i = 0; i < json.length || i === 0; i += CHUNK) parts.push(json.slice(i, i + CHUNK));
    parts.forEach((p, i) => {
      const prev = i < existing.length ? existing[i] : null;
      const values = rowFrom_(t, { key: key, part: String(i), value: p, updatedAt: String(ts), savedOn: stamp }, prev && prev.raw);
      if (prev) writeRow_(t, prev.row, values);
      else appends.push(values);
    });
    existing.slice(parts.length).forEach((r) => deletes.push(r.row));
    written += 1;
  });
  ensureRows_(t.sh, t.sh.getLastRow() + 1); // never delete the last spare row
  deletes.sort((a, b) => b - a).forEach((row) => t.sh.deleteRow(row));
  appendRows_(t, appends);
  return written;
}

// Applications and Messages tabs: readable tables, one row per application / message.
function readApps_() {
  const msgs = {};
  rows_(tab_(TABS.messages)).forEach((r) => {
    const m = r.rec;
    if (!m.id || !m.appId) return;
    const msg = {};
    MSG_FIELDS.forEach((f) => { msg[f] = String(m[f] == null ? '' : m[f]); });
    (msgs[m.appId] = msgs[m.appId] || []).push(msg);
  });
  return rows_(tab_(TABS.apps)).map((r) => {
    const rec = r.rec;
    if (!rec.id) return null;
    const app = {};
    APP_TEXT_FIELDS.forEach((f) => { app[f] = String(rec[f] == null ? '' : rec[f]); });
    app.followups = rec.followups ? String(rec.followups).split(/\s*,\s*/).filter(Boolean) : [];
    app.createdAt = Number(rec.createdAt) || 0;
    app.updatedAt = Number(rec.updatedAt) || 0;
    app.deleted = String(rec.deleted) === 'true';
    app.seed = String(rec.seed) === 'true';
    if (rec.extra) {
      try { Object.assign(app, JSON.parse(rec.extra)); } catch (err) { /* keep the known fields */ }
    }
    app.messages = (msgs[app.id] || []).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return app;
  }).filter(Boolean);
}

function writeApps_(apps, skipped) {
  const t = tab_(TABS.apps);
  const mt = tab_(TABS.messages);
  const byId = {};
  rows_(t).forEach((r) => { byId[r.rec.id] = r; });
  const msgRows = rows_(mt);
  const msgById = {};
  msgRows.forEach((r) => { msgById[r.rec.id] = r; });
  const appends = [];
  const msgAppends = [];
  const msgDeletes = [];
  let written = 0;
  apps.forEach((app) => {
    if (!app || !/^[A-Za-z0-9_-]{1,64}$/.test(String(app.id || ''))) return;
    const existing = byId[app.id];
    if (existing && (Number(existing.rec.updatedAt) || 0) > (Number(app.updatedAt) || 0)) { skipped.push(app.id); return; }
    const extra = {};
    Object.keys(app).forEach((k) => { if (!APP_KNOWN.has(k)) extra[k] = app[k]; });
    const rec = {
      followups: (app.followups || []).join(', '),
      createdAt: String(app.createdAt || ''),
      updatedAt: String(app.updatedAt || Date.now()),
      deleted: app.deleted ? 'true' : '',
      seed: app.seed ? 'true' : '',
      extra: Object.keys(extra).length ? JSON.stringify(extra) : '',
    };
    APP_TEXT_FIELDS.forEach((f) => { rec[f] = app[f] == null ? '' : String(app[f]); });
    const values = rowFrom_(t, rec, existing && existing.raw);
    if (existing) writeRow_(t, existing.row, values, existing.raw); else appends.push(values);
    written += 1;

    if (app.deleted) {
      msgRows.forEach((r) => { if (r.rec.appId === app.id) msgDeletes.push(r.row); });
      return;
    }
    (app.messages || []).forEach((m) => {
      if (!m || !/^[A-Za-z0-9_-]{1,64}$/.test(String(m.id || ''))) return;
      const mrec = { appId: app.id, company: rec.company, role: rec.role };
      MSG_FIELDS.forEach((f) => { mrec[f] = m[f] == null ? '' : String(m[f]); });
      const prev = msgById[m.id];
      const mvalues = rowFrom_(mt, mrec, prev && prev.raw);
      if (prev) writeRow_(mt, prev.row, mvalues, prev.raw);
      else { msgAppends.push(mvalues); msgById[m.id] = { row: -1, rec: mrec }; }
    });
  });
  appendRows_(t, appends);
  ensureRows_(mt.sh, mt.sh.getLastRow() + 1); // never delete the last spare row
  [...new Set(msgDeletes)].sort((a, b) => b - a).forEach((row) => mt.sh.deleteRow(row));
  appendRows_(mt, msgAppends);
  return written;
}

// ---------------------------------------------------------------- Drive

function saveFile_(p) {
  const name = String(p.name || 'file').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120);
  const b64 = String(p.base64 || '');
  if (!b64) throw err_('bad_request', 'The file was empty.');
  if (b64.length > 14 * 1024 * 1024) throw err_('too_large', 'That file is too large to save.');
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), String(p.mime || 'application/octet-stream'), name);
  const file = folder_().createFile(blob);
  return { url: file.getUrl(), name: file.getName() };
}

/** The "Career Compass" Drive folder, remembered by id; a trashed folder is never reused. */
function folder_() {
  const id = props_().getProperty('DRIVE_FOLDER_ID');
  if (id) {
    try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (err) { /* deleted: make a new one */ }
  }
  const it = DriveApp.getFoldersByName('Career Compass');
  let folder = null;
  while (it.hasNext()) { const f = it.next(); if (!f.isTrashed()) { folder = f; break; } }
  if (!folder) folder = DriveApp.createFolder('Career Compass');
  props_().setProperty('DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

// ---------------------------------------------------------------- Ask Claude (optional)

function askClaude_(p) {
  const apiKey = props_().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) throw err_('ai_off', 'Claude is not switched on for this page.');
  const prompt = String(p.prompt || '');
  if (!prompt.trim()) throw err_('bad_request', 'Nothing to send.');
  if (prompt.length > 150000) throw err_('too_long', 'That text is too long.');
  const effort = ['low', 'medium', 'high'].indexOf(p.effort) >= 0 ? p.effort : 'medium';
  // UrlFetchApp gives up after about a minute and cannot stream, so answers are kept short.
  let res;
  try {
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    payload: JSON.stringify({
      model: 'claude-opus-5-5',
      max_tokens: 6000,
      output_config: { effort: effort },
      fallbacks: 'default',
      messages: [{ role: 'user', content: prompt }],
    }),
    });
  } catch (err) {
    if (/timed? ?out|timeout|deadline/i.test(String(err))) throw err_('slow', 'Claude took too long. Try a shorter text, or try again.');
    throw err_('network', 'Could not reach Claude just now.');
  }
  const status = res.getResponseCode();
  let data = {};
  try { data = JSON.parse(res.getContentText()); } catch (err) { data = {}; }
  if (status === 429 || status === 529) throw err_('rate_limited', 'Claude is busy. Try again in a minute.');
  if (status === 401 || status === 403) throw err_('ai_auth', 'The Anthropic API key was not accepted. Check ANTHROPIC_API_KEY in Script properties.');
  if (status >= 400) throw err_('ai_error', (data.error && data.error.message) || ('Claude returned HTTP ' + status));
  if (data.stop_reason === 'refusal') throw err_('refused', 'Claude could not help with that text.');
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!text) throw err_('empty', 'No answer came back.');
  return { text: text, truncated: data.stop_reason === 'max_tokens' };
}

// ---------------------------------------------------------------- Sheet helpers

function props_() { return PropertiesService.getScriptProperties(); }

function book_() {
  const id = props_().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  let book = null;
  try { book = SpreadsheetApp.getActiveSpreadsheet(); } catch (err) { book = null; }
  if (book) return book;
  book = SpreadsheetApp.create('Career Compass data');
  props_().setProperty('SHEET_ID', book.getId());
  return book;
}

/** Returns {sh, header, index}; creates the tab and adds any missing columns (older Sheets upgrade themselves). */
function tab_(def) {
  const book = book_();
  let sh = book.getSheetByName(def.name);
  if (!sh) {
    sh = book.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.cols.length).setValues([def.cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map((v) => String(v || '').trim());
  while (header.length && !header[header.length - 1]) header.pop();
  const missing = def.cols.filter((c) => header.indexOf(c) === -1);
  if (missing.length) {
    sh.getRange(1, header.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
    missing.forEach((c) => header.push(c));
  }
  const index = {};
  header.forEach((h, i) => { index[h] = i; });
  return { sh: sh, header: header, index: index };
}

function rows_(t) {
  const last = t.sh.getLastRow();
  if (last < 2) return [];
  const values = t.sh.getRange(2, 1, last - 1, t.header.length).getValues();
  return values.map((raw, i) => {
    const rec = {};
    t.header.forEach((h, j) => { rec[h] = cell_(raw[j]); });
    return { row: i + 2, rec: rec, raw: raw };
  });
}

let tz_ = null;
function tz_get_() {
  if (!tz_) { try { tz_ = book_().getSpreadsheetTimeZone(); } catch (err) { tz_ = Session.getScriptTimeZone(); } }
  return tz_;
}

function cell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, tz_get_(), 'yyyy-MM-dd');
  return v == null ? '' : v;
}

/** Builds a row in header order, keeping values in columns this version does not know about. */
function rowFrom_(t, rec, raw) {
  return t.header.map((h, i) => {
    if (Object.prototype.hasOwnProperty.call(rec, h)) return String(rec[h] == null ? '' : rec[h]).slice(0, MAX_CELL);
    return raw && raw[i] != null ? raw[i] : '';
  });
}

function writeRow_(t, row, values) {
  t.sh.getRange(row, 1, 1, values.length).setNumberFormat('@').setValues([values]);
}

/** A tab has a fixed number of rows; add more before writing past the end. */
function ensureRows_(sh, lastRow) {
  const max = sh.getMaxRows();
  if (lastRow > max) sh.insertRowsAfter(max, lastRow - max);
}

function appendRows_(t, rows) {
  if (!rows.length) return;
  const start = t.sh.getLastRow() + 1;
  ensureRows_(t.sh, start + rows.length - 1);
  t.sh.getRange(start, 1, rows.length, t.header.length).setNumberFormat('@').setValues(rows.map((r) => {
    const out = r.slice(0, t.header.length);
    while (out.length < t.header.length) out.push('');
    return out;
  }));
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function keyOk_(key) {
  const want = props_().getProperty('ACCESS_KEY');
  return !want || key === want;
}

function now_() { return Utilities.formatDate(new Date(), tz_get_(), 'yyyy-MM-dd HH:mm'); }
function err_(code, message) { const e = new Error(message); e.code = code; return e; }
function ok_(data) { return JSON.stringify({ ok: true, data: data }); }
function fail_(code, message) { return JSON.stringify({ ok: false, error: { code: code, message: message } }); }
