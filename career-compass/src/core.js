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
  };

  const toastEl = () => document.getElementById('toast');
  let toastTimer;
  function toast(msg) {
    const el = toastEl();
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
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

  // ---------- Store ----------
  const LS_KEY = 'career-compass-v1';
  const listeners = new Set();
  let state = null;
  let defaults = () => ({});
  let saveStatus = { where: 'device', ok: true };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function mergeDefaults(target, def) {
    if (Array.isArray(def) || def === null || typeof def !== 'object') return target === undefined ? clone(def) : target;
    const out = (target && typeof target === 'object' && !Array.isArray(target)) ? target : {};
    for (const k of Object.keys(def)) out[k] = mergeDefaults(out[k], def[k]);
    return out;
  }

  function lsGet() { try { return localStorage.getItem(LS_KEY); } catch { return null; } }
  function lsSet(v) { try { localStorage.setItem(LS_KEY, v); return true; } catch { return false; } }

  function load(defFn) {
    defaults = defFn;
    let saved = null;
    try { saved = JSON.parse(lsGet() || 'null'); } catch { saved = null; }
    state = mergeDefaults(saved || {}, defaults());
    if (!Array.isArray(state.apps)) state.apps = [];
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
    state.updatedAt = Date.now();
    persistLocal();
    Cloud.markCore();
    if (!opts.silent) emit('state');
  }
  function upsertApp(app, opts = {}) {
    app.updatedAt = Date.now();
    const i = state.apps.findIndex((a) => a.id === app.id);
    if (i >= 0) state.apps[i] = app; else state.apps.push(app);
    persistLocal();
    Cloud.markApp(app.id);
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
    const apps = Array.isArray(next.apps) ? next.apps : [];
    state = mergeDefaults(next, defaults());
    state.apps = apps;
    state.updatedAt = Date.now();
    for (const a of state.apps) { a.updatedAt = Date.now(); Cloud.markApp(a.id); }
    persistLocal();
    Cloud.markCore();
    emit('state');
  }

  // ---------- Cloud (claude.ai artifact db, private per viewer) ----------
  const Cloud = (() => {
    let coreRef = null;
    let appsCol = null;
    let enabled = false;
    let coreDirty = false;
    const dirtyApps = new Set();
    let timer = null;
    let flushing = false;

    const coreBody = () => { const { apps: _a, ui: _u, ...rest } = state; return clone(rest); };

    async function init() {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      try {
        const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
        if (!db || !user) return;
        const id = await user.id();
        if (!id) return;
        coreRef = db.doc(`data/users/${id}/compass`);
        appsCol = coreRef.collection('apps');
        const [coreSnap, appsSnap] = await Promise.all([coreRef.get(), appsCol.get()]);
        const remote = coreSnap.exists ? coreSnap.data() : null;
        if (remote && (remote.updatedAt || 0) > (state.updatedAt || 0)) {
          const keepApps = state.apps;
          const keepUi = state.ui;
          state = mergeDefaults(clone(remote), defaults());
          state.apps = keepApps;
          state.ui = keepUi;
        } else {
          coreDirty = true;
        }
        const local = new Map(state.apps.map((a) => [a.id, a]));
        for (const d of appsSnap.docs) {
          const r = d.data();
          if (!r || !r.id) continue;
          const l = local.get(r.id);
          if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) local.set(r.id, clone(r));
          else if ((l.updatedAt || 0) > (r.updatedAt || 0)) dirtyApps.add(l.id);
        }
        const remoteIds = new Set(appsSnap.docs.map((d) => d.id));
        for (const a of local.values()) if (!remoteIds.has(a.id)) dirtyApps.add(a.id);
        state.apps = [...local.values()];
        enabled = true;
        persistLocal();
        setStatus({ where: 'cloud', ok: true });
        emit('state');
        schedule(200);
      } catch (e) {
        console.warn('cloud init failed', e);
      }
    }
    function schedule(ms = 1200) {
      if (!enabled) return;
      clearTimeout(timer);
      timer = setTimeout(flush, ms);
    }
    async function flush() {
      if (!enabled || flushing) return;
      flushing = true;
      try {
        if (coreDirty) {
          coreDirty = false;
          await coreRef.set(coreBody());
        }
        for (const id of [...dirtyApps]) {
          dirtyApps.delete(id);
          const app = state.apps.find((a) => a.id === id);
          if (!app) continue;
          await appsCol.doc(id).set(clone(app));
        }
        if (saveStatus.where !== 'cloud' || !saveStatus.ok) setStatus({ where: 'cloud', ok: true });
      } catch (e) {
        const code = e && e.code;
        if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted' || code === 'quota_exceeded') {
          enabled = false;
          setStatus({ where: 'device', ok: true, note: code === 'quota_exceeded' ? 'Cloud storage is full; saving on this device.' : '' });
        } else {
          coreDirty = true;
          setTimeout(() => { flushing = false; schedule(4000); }, 0);
          return;
        }
      } finally {
        flushing = false;
      }
      if (coreDirty || dirtyApps.size) schedule(800);
    }
    return {
      init,
      markCore() { coreDirty = true; schedule(); },
      markApp(id) { dirtyApps.add(id); schedule(); },
      get enabled() { return enabled; },
    };
  })();

  // ---------- Capabilities ----------
  const standalone = !(window.claude && typeof window.claude.use === 'function');
  const capPromise = (name) => (standalone ? Promise.resolve(null) : window.claude.use(name).catch(() => null));
  const caps = { downloads: capPromise('downloads'), sample: capPromise('sample') };

  async function saveFile(filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    if (standalone) {
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: filename });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
      toast(`Saved ${filename}`);
      return true;
    }
    const dl = await caps.downloads;
    if (!dl) { toast('Downloads aren’t available in this view. Use Copy instead.'); return false; }
    try {
      const res = await dl.save({ filename, data: blob });
      if (res && res.status === 'saved') toast(`Saved ${filename}`);
      return true;
    } catch (e) {
      const code = e && e.code;
      if (code === 'declined') return false;
      if (code === 'rate_limited') toast('A save is already waiting for you to confirm.');
      else toast('That file couldn’t be saved here. Use Copy instead.');
      return false;
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

  // ---------- Ask Claude (optional) ----------
  const AI_ERRORS = {
    not_granted: 'Claude isn’t allowed for this page, so this helper is switched off.',
    sampling_disabled: 'Claude isn’t available on this account.',
    rate_limited: 'Claude is busy or your usage limit was reached. Try again a little later.',
    session_expired: 'Please sign in to Claude again, then retry.',
    refused: 'Claude couldn’t help with that text. Try rephrasing or trimming it.',
    prompt_too_large: 'That text is too long. Paste a shorter part of it.',
    invalid_json: 'The answer came back in an unexpected shape. Please try once more.',
    empty_completion: 'No answer came back. Try a shorter request.',
  };
  const aiError = (e) => AI_ERRORS[e && e.code] || 'Something interrupted the answer. You can try again.';
  const aiHidden = (e) => ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e && e.code);

  const csvCell = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n');

  return {
    h, icon, svg, ICONS, toast, iso, parseISO, addDays, fmt, fmtLong, weekStart, inThisWeek, uid,
    load, update, upsertApp, deleteApp, apps, replaceAll, on, get state() { return state; }, get saveStatus() { return saveStatus; },
    Cloud, caps, standalone, saveFile, copy, readFile, aiError, aiHidden, toCSV, clone,
  };
})();
