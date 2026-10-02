/* Core utilities: DOM helper, dates, store (local-first with optional private cloud sync), capabilities, files. */
const CC = (() => {
  'use strict';

  // ---------- DOM ----------
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    let deferredValue;
    let hasValue = false;
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v; // static, trusted markup only (icons)
        else if (k === 'value') { deferredValue = v; hasValue = true; }
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'selected') el.selected = !!v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : String(kid));
    }
    if (hasValue) el.value = deferredValue;
    return el;
  }
  const svg = (inner, size = 20, extra = '') =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;
  const icon = (name, size) => {
    const span = document.createElement('span');
    span.style.display = 'inline-flex';
    span.innerHTML = svg(ICONS[name] || '', size);
    return span;
  };
  const ICONS = {
    sun: '<path d="M4 18h16"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 6v3"/><path d="M5.6 9.6l2 2"/><path d="M18.4 9.6l-2 2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4 6l1 1 2-2"/><path d="M4 12l1 1 2-2"/><path d="M4 18l1 1 2-2"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8"/><path d="M8 12.5h5"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19l7-7"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    download: '<path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    ext: '<path d="M14 5h5v5"/><path d="M19 5l-8 8"/><path d="M18 14v5H5V6h5"/>',
    spark: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="M6 6l2.5 2.5"/><path d="M15.5 15.5L18 18"/><path d="M18 6l-2.5 2.5"/><path d="M8.5 15.5L6 18"/>',
    low: '<path d="M4 17h16"/><path d="M8 17a4 4 0 0 1 8 0"/>',
    okay: '<path d="M4 17h16"/><path d="M6.5 17a5.5 5.5 0 0 1 11 0"/><path d="M12 7.5v2"/>',
    good: '<circle cx="12" cy="13" r="4.5"/><path d="M12 4v2"/><path d="M5 13H3"/><path d="M21 13h-2"/><path d="M6.6 7.6l1.4 1.4"/><path d="M17.4 7.6L16 9"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lotus: '<path d="M12 4.5c2.3 2.6 2.3 8 0 11.5-2.3-3.5-2.3-8.9 0-11.5z"/><path d="M12 16c-2.7.1-6.2-1.8-7.6-5.6 3.3-.3 5.9 1.1 7.6 3.7"/><path d="M12 16c2.7.1 6.2-1.8 7.6-5.6-3.3-.3-5.9 1.1-7.6 3.7"/><path d="M5 19.5h14"/>',
  };

  const toastEl = () => document.getElementById('toast');
  let toastTimer;
  function toast(msg, link) {
    const el = toastEl();
    if (!el) return;
    el.replaceChildren(msg);
    if (link) el.append(' ', h('a', { href: link, target: '_blank', rel: 'noopener noreferrer' }, 'Open'));
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, link ? 8000 : Math.min(7000, Math.max(2600, String(msg).length * 55)));
  }

  // ---------- Dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = (s) => { if (!s) return ''; const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const fmtLong = (s) => { if (!s) return ''; const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const weekStart = (s = iso()) => { const d = parseISO(s); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return iso(d); };
  const inThisWeek = (s) => { if (!s) return false; const ws = weekStart(); return s >= ws && s <= addDays(ws, 6); };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : Math.random().toString(36).slice(2, 12) + Date.now().toString(36));

  // ---------- Store (local-first; synced to a Google Sheet when served by Apps Script) ----------
  const LS_KEY = 'career-compass-v1';
  /** Top-level state keys saved to the Sheet's Store tab. `apps` has its own tabs; `ui` stays on this device. */
  const CORE_KEYS = ['cv', 'letters', 'daily', 'firstWeek', 'wins', 'journal', 'saved', 'settings'];
  const listeners = new Set();
  let state = null;
  let defaults = () => ({});
  let saveStatus = { where: 'device', ok: true };
  const snap = {};

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function mergeDefaults(target, def) {
    if (Array.isArray(def) || def === null || typeof def !== 'object') return target === undefined ? clone(def) : target;
    const out = (target && typeof target === 'object' && !Array.isArray(target)) ? target : {};
    for (const k of Object.keys(def)) out[k] = mergeDefaults(out[k], def[k]);
    return out;
  }

  function lsGet() { try { return localStorage.getItem(LS_KEY); } catch { return null; } }
  function lsSet(v) { try { localStorage.setItem(LS_KEY, v); return true; } catch { return false; } }

  function stampChanges() {
    state._ts = state._ts || {};
    const now = Date.now();
    for (const k of CORE_KEYS) {
      const str = JSON.stringify(state[k] === undefined ? null : state[k]);
      if (snap[k] !== str) { snap[k] = str; state._ts[k] = now; }
    }
  }
  function load(defFn) {
    defaults = defFn;
    let saved = null;
    try { saved = JSON.parse(lsGet() || 'null'); } catch { saved = null; }
    state = mergeDefaults(saved || {}, defaults());
    if (!Array.isArray(state.apps)) state.apps = [];
    state._ts = state._ts || {};
    for (const k of CORE_KEYS) snap[k] = JSON.stringify(state[k] === undefined ? null : state[k]);
    return state;
  }
  function persistLocal() {
    const ok = lsSet(JSON.stringify(state));
    if (!ok && saveStatus.where === 'device') setStatus({ where: 'none', ok: false });
    return ok;
  }
  function setStatus(s) {
    saveStatus = { ...saveStatus, ...s };
    emit('status');
  }
  function emit(kind) { for (const fn of listeners) { try { fn(kind); } catch (e) { console.error(e); } } }
  function on(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  /** Mutate state. opts.silent: don't notify listeners (for text inputs). */
  function update(fn, opts = {}) {
    fn(state);
    stampChanges();
    persistLocal();
    Remote.schedule();
    if (!opts.silent) emit('state');
  }
  function upsertApp(app, opts = {}) {
    app.updatedAt = Date.now();
    const i = state.apps.findIndex((a) => a.id === app.id);
    if (i >= 0) state.apps[i] = app; else state.apps.push(app);
    persistLocal();
    Remote.markApp(app.id);
    if (!opts.silent) emit('state');
  }
  function deleteApp(id) {
    const app = state.apps.find((a) => a.id === id);
    if (!app) return;
    app.deleted = true;
    upsertApp(app);
  }
  const apps = () => state.apps.filter((a) => !a.deleted);

  function replaceAll(next) {
    const list = Array.isArray(next.apps) ? next.apps : [];
    state = mergeDefaults(next, defaults());
    state.apps = list;
    const now = Date.now();
    state._ts = {};
    for (const k of CORE_KEYS) { state._ts[k] = now; snap[k] = JSON.stringify(state[k] === undefined ? null : state[k]); }
    for (const a of state.apps) { a.updatedAt = now; Remote.markApp(a.id); }
    persistLocal();
    Remote.forceCore();
    emit('state');
  }

  // ---------- Remote: the Google Sheet behind the Apps Script web app ----------
  const Remote = (() => {
    const gs = () => (window.google && window.google.script && window.google.script.run) || null;
    let enabled = false;
    let key = '';
    let meta = {};
    const sent = {};
    const dirtyApps = new Set();
    let timer = null;
    let flushing = false;
    let failures = 0;

    function call(action, payload) {
      return new Promise((resolve, reject) => {
        const run = gs();
        if (!run) { reject({ code: 'no_backend' }); return; }
        run
          .withSuccessHandler((res) => {
            let r;
            try { r = typeof res === 'string' ? JSON.parse(res) : res; } catch { reject({ code: 'bad_response' }); return; }
            if (r && r.ok) resolve(r.data); else reject((r && r.error) || { code: 'server_error' });
          })
          .withFailureHandler((err) => reject({ code: 'network', message: String((err && err.message) || err) }))
          .api(JSON.stringify({ action, key, payload: payload || null }));
      });
    }
    function readKey() {
      return new Promise((resolve) => {
        const done = (v) => resolve(v || '');
        try {
          if (window.google && google.script && google.script.url) google.script.url.getLocation((loc) => done(loc && loc.parameter && loc.parameter.key));
          else done('');
        } catch { done(''); }
        setTimeout(() => done(''), 4000);
      });
    }
    function merge(data) {
      const core = data.core || {};
      for (const k of CORE_KEYS) {
        const r = core[k];
        if (!r) continue;
        const localTs = (state._ts && state._ts[k]) || 0;
        if ((r.updatedAt || 0) > localTs) {
          state[k] = mergeDefaults(r.value, defaults()[k] === undefined ? r.value : defaults()[k]);
          state._ts[k] = r.updatedAt;
          snap[k] = JSON.stringify(state[k] === undefined ? null : state[k]);
          sent[k] = snap[k];
        } else if ((r.updatedAt || 0) === localTs) {
          sent[k] = snap[k];
        }
      }
      const local = new Map(state.apps.map((a) => [a.id, a]));
      const remoteIds = new Set();
      for (const r of data.apps || []) {
        if (!r || !r.id) continue;
        remoteIds.add(r.id);
        const l = local.get(r.id);
        if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) local.set(r.id, r);
        else if ((l.updatedAt || 0) > (r.updatedAt || 0)) dirtyApps.add(l.id);
      }
      for (const a of local.values()) if (!remoteIds.has(a.id)) dirtyApps.add(a.id);
      state.apps = [...local.values()];
      persistLocal();
    }
    /** Re-read the Sheet and keep whichever copy of each part is newer. */
    async function pull() {
      try {
        const data = await call('load');
        meta = data.meta || meta;
        merge(data);
        emit('state');
      } catch { /* the next save or visit will try again */ }
    }
    let lastPull = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !enabled || flushing) return;
      if (Date.now() - lastPull < 20000) return;
      lastPull = Date.now();
      flush().then(pull);
    });
    async function init() {
      if (!gs()) return;
      setStatus({ where: 'syncing', ok: true });
      if (!key) key = await readKey();
      try {
        const data = await call('load');
        meta = data.meta || {};
        merge(data);
        enabled = true;
        failures = 0;
        setStatus({ where: 'sheet', ok: true, note: '' });
        resolveAi(meta.aiEnabled ? Ai : null);
        emit('state');
        schedule(200);
      } catch (e) {
        if (e && e.code === 'locked') { setStatus({ where: 'locked', ok: false }); resolveAi(null); return; }
        failures += 1;
        setStatus({ where: 'device', ok: false, note: 'offline' });
        setTimeout(init, Math.min(60000, 5000 * failures));
      }
    }
    function schedule(ms = 1500) {
      if (!enabled) return;
      clearTimeout(timer);
      timer = setTimeout(flush, ms);
    }
    function pendingCore() {
      const out = {};
      for (const k of CORE_KEYS) {
        if (sent[k] !== snap[k]) out[k] = { value: state[k] === undefined ? null : state[k], updatedAt: (state._ts && state._ts[k]) || Date.now() };
      }
      return out;
    }
    async function flush() {
      if (!enabled || flushing) return;
      const core = pendingCore();
      const ids = [...dirtyApps];
      if (!Object.keys(core).length && !ids.length) return;
      flushing = true;
      ids.forEach((id) => dirtyApps.delete(id));
      const appsOut = ids.map((id) => state.apps.find((a) => a.id === id)).filter(Boolean);
      const coreStr = Object.fromEntries(Object.keys(core).map((k) => [k, JSON.stringify(core[k].value)]));
      setStatus({ where: 'syncing', ok: true });
      try {
        const res = await call('save', { core, apps: appsOut });
        for (const k of Object.keys(coreStr)) sent[k] = coreStr[k];
        if (res && Array.isArray(res.skipped) && res.skipped.length) {
          // Another device saved something newer: take the Sheet's copy.
          for (const k of res.skipped) if (CORE_KEYS.includes(k) && state._ts) state._ts[k] = 0;
          for (const id of res.skipped) { const a = state.apps.find((x) => x.id === id); if (a) a.updatedAt = 0; }
          await pull();
        }
        failures = 0;
        setStatus({ where: 'sheet', ok: true, note: '' });
      } catch (e) {
        ids.forEach((id) => dirtyApps.add(id));
        failures += 1;
        setStatus({ where: e && e.code === 'locked' ? 'locked' : 'device', ok: false, note: 'retrying' });
        flushing = false;
        schedule(Math.min(60000, 4000 * failures));
        return;
      }
      flushing = false;
      if (Object.keys(pendingCore()).length || dirtyApps.size) schedule(600);
    }
    return {
      init,
      call,
      schedule,
      markApp(id) { dirtyApps.add(id); schedule(); },
      forceCore() { for (const k of CORE_KEYS) delete sent[k]; schedule(200); },
      get enabled() { return enabled; },
      get meta() { return meta; },
      get available() { return !!gs(); },
    };
  })();

  // ---------- Ask Claude (optional; only when the Sheet's script has an Anthropic API key) ----------
  let resolveAi;
  const aiReady = new Promise((r) => { resolveAi = r; });
  if (!(window.google && window.google.script)) resolveAi(null);
  const parseJson = (text) => {
    const t = String(text || '').trim();
    try { return JSON.parse(t); } catch { /* try harder */ }
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) { try { return JSON.parse(fence[1]); } catch { /* next */ } }
    const a = t.search(/[[{]/);
    const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ } }
    throw { code: 'invalid_json', text: t };
  };
  const Ai = {
    async text(prompt, opts = {}) {
      const r = await Remote.call('ai', { prompt, effort: opts.effort || 'medium' });
      return r.text;
    },
    async json(prompt, opts = {}) {
      const r = await Remote.call('ai', { prompt, effort: opts.effort || 'medium' });
      return parseJson(r.text);
    },
  };

  // ---------- Files ----------
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
  function saveFile(filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    try {
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: filename });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast(`Downloading ${filename}`);
      return true;
    } catch {
      toast('This browser blocked the download. Try Save to Drive instead.');
      return false;
    }
  }
  async function saveToDrive(filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    toast('Saving to your Google Drive…');
    try {
      const res = await Remote.call('saveFile', { name: filename, mime: blob.type || mime || 'application/octet-stream', base64: await blobToBase64(blob) });
      toast('Saved in Google Drive, folder "Career Compass".', res && res.url);
      return res;
    } catch (e) {
      toast(e && e.code === 'locked' ? 'This page needs its private link to save.' : 'Could not save to Drive just now. Try again in a moment.');
      return null;
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
      return true;
    } catch {
      const ta = h('textarea', { style: { position: 'fixed', top: '-1000px', opacity: '0' } });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      toast(ok ? 'Copied' : 'Copy was blocked. Select the text and copy it yourself.');
      return ok;
    }
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
  }

  const AI_ERRORS = {
    ai_off: 'Claude is not switched on for this page.',
    rate_limited: 'Claude is busy right now. Try again in a minute.',
    refused: 'Claude could not help with that text. Try rephrasing or trimming it.',
    too_long: 'That text is too long. Paste a shorter part of it.',
    invalid_json: 'The answer came back in an unexpected shape. Please try once more.',
    network: 'The connection dropped. Check your internet and try again.',
    locked: 'This page needs its private link.',
    slow: 'Claude took too long. Try a shorter text, or try again.',
  };
  const aiError = (e) => AI_ERRORS[e && e.code] || (e && ['ai_auth', 'ai_error', 'empty', 'server_error'].includes(e.code) && e.message) || 'Something interrupted the answer. You can try again.';
  const aiHidden = (e) => ['ai_off', 'locked'].includes(e && e.code);

  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

  return {
    h, icon, svg, ICONS, toast, iso, parseISO, addDays, fmt, fmtLong, weekStart, inThisWeek, uid,
    load, update, upsertApp, deleteApp, apps, replaceAll, on, get state() { return state; }, get saveStatus() { return saveStatus; },
    Remote, aiReady, saveFile, saveToDrive, copy, readFile, aiError, aiHidden, toCSV, clone, CORE_KEYS,
  };
})();
