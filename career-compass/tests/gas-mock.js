/* In-memory stand-ins for the Apps Script services Code.gs uses, so the real server code can be
   exercised locally (unit checks and the browser end-to-end test). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function createGas({ props = {}, fetch, codePath = path.join(__dirname, '..', 'src', 'apps-script', 'Code.gs') } = {}) {
  const sheets = new Map();
  const logs = [];
  const files = [];
  const fetches = [];
  const folders = [];

  class Sheet {
    constructor(name) { this.name = name; this.data = []; this.frozen = 0; this.maxRows = 1000; }
    getName() { return this.name; }
    getLastRow() {
      let n = this.data.length;
      while (n > 0 && (this.data[n - 1] || []).every((v) => v === '' || v == null)) n -= 1;
      return n;
    }
    getLastColumn() {
      return this.data.reduce((m, r) => {
        let n = (r || []).length;
        while (n > 0 && (r[n - 1] === '' || r[n - 1] == null)) n -= 1;
        return Math.max(m, n);
      }, 0);
    }
    getMaxRows() { return this.maxRows; }
    insertRowsAfter(after, n) { if (after !== this.maxRows) throw new Error('insertRowsAfter: test only supports appending'); this.maxRows += n; return this; }
    setFrozenRows(n) { this.frozen = n; return this; }
    getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
    deleteRow(r) {
      if (r < 1 || r > this.data.length) throw new Error(`deleteRow out of range: ${r}`);
      if (this.maxRows - 1 <= this.frozen) throw new Error('Sorry, it is not possible to delete all non-frozen rows.');
      this.data.splice(r - 1, 1);
      this.maxRows -= 1;
    }
    /** Test helper: rows as objects keyed by the header row. */
    table() {
      const [head, ...rows] = this.data;
      return rows.filter((r) => r && r.some((v) => v !== '' && v != null)).map((r) => Object.fromEntries((head || []).map((h, i) => [h, r[i] == null ? '' : r[i]])));
    }
  }
  class Range {
    constructor(sh, r, c, nr, nc) {
      if (r < 1 || c < 1 || nr < 1 || nc < 1) throw new Error(`bad range ${r},${c},${nr},${nc}`);
      if (r + nr - 1 > sh.maxRows) throw new Error('The coordinates of the range are outside the dimensions of the sheet.');
      Object.assign(this, { sh, r, c, nr, nc });
    }
    setValues(vals) {
      if (vals.length !== this.nr || vals.some((row) => row.length !== this.nc)) throw new Error(`setValues dimension mismatch: range ${this.nr}x${this.nc}, data ${vals.length}x${vals[0] && vals[0].length}`);
      vals.forEach((row, i) => {
        const ri = this.r - 1 + i;
        while (this.sh.data.length <= ri) this.sh.data.push([]);
        row.forEach((v, j) => { this.sh.data[ri][this.c - 1 + j] = v; });
      });
      return this;
    }
    getValues() {
      return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => {
        const row = this.sh.data[this.r - 1 + i] || [];
        const v = row[this.c - 1 + j];
        return v == null ? '' : v;
      }));
    }
    setNumberFormat() { return this; }
    setFontWeight() { return this; }
  }

  const book = {
    getSheetByName: (n) => sheets.get(n) || null,
    insertSheet: (n) => { const s = new Sheet(n); sheets.set(n, s); return s; },
    getSheets: () => [...sheets.values()],
    deleteSheet: (s) => sheets.delete(s.name),
    getUrl: () => 'https://docs.google.com/spreadsheets/d/MOCK/edit',
    getId: () => 'MOCK',
    getSpreadsheetTimeZone: () => 'Asia/Kolkata',
  };
  sheets.set('Sheet1', new Sheet('Sheet1'));
  const chain = { setTitle() { return chain; }, addMetaTag() { return chain; }, setXFrameOptionsMode() { return chain; } };

  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => book, openById: () => book, create: () => book, flush() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] == null ? null : props[k]), setProperty: (k, v) => { props[k] = v; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      base64Decode: (s) => [...Buffer.from(s, 'base64')],
      newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
      formatDate: (d) => new Date(d).toISOString().slice(0, 16).replace('T', ' '),
    },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    DriveApp: {
      getFoldersByName: (name) => { const list = folders.filter((f) => f.getName() === name); let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; },
      getFolderById: (id) => { const f = folders.find((x) => x.getId() === id); if (!f) throw new Error('No item with the given ID could be found'); return f; },
      createFolder: (name) => {
        const f = {
          id: `F${folders.length + 1}`, trashed: false, files: [],
          getId: () => f.id, getName: () => name, isTrashed: () => f.trashed,
          createFile: (blob) => { files.push(blob); f.files.push(blob); return { getUrl: () => `https://drive.google.com/file/d/MOCK${files.length}/view`, getName: () => blob.name }; },
        };
        folders.push(f);
        return f;
      },
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        fetches.push({ url, opts });
        if (!fetch) throw new Error('UrlFetchApp not mocked');
        const res = fetch(url, opts);
        return { getResponseCode: () => res.status, getContentText: () => (typeof res.body === 'string' ? res.body : JSON.stringify(res.body)) };
      },
    },
    HtmlService: { createHtmlOutputFromFile: () => chain, createHtmlOutput: () => chain },
    ScriptApp: { AuthMode: { FULL: 'FULL' }, requireAllScopes: () => {}, getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/MOCK/exec' }) },
    Logger: { log: (...a) => logs.push(a.join(' ')) },
    console,
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(codePath, 'utf8'), context, { filename: 'Code.gs' });
  return { context, sheets, props, files, folders, logs, fetches, api: (s) => context.api(s), sheet: (n) => sheets.get(n) };
}

module.exports = { createGas };
