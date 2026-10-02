/* Views and router. */
(() => {
  'use strict';
  const { h, icon, toast } = CC;
  const D = window.CC_DATA;
  const S = () => CC.state;
  const main = () => document.getElementById('main');

  // ---------- defaults ----------
  /** First-run tracker: the applications she has already sent, plus a few new doors to try. Fixed ids keep devices in step. */
  function seedApps() {
    const H = D.history;
    const byId = (id) => D.companies.find((c) => c.id === id);
    if (!H) {
      return D.companies.filter((c) => c.hyd).slice(0, 3).map((c) => ({ id: `seed-${c.id}`, companyId: c.id, company: c.name, role: c.roles[0] || '', platform: 'Company site', link: c.careers || '', status: 'idea', region: 'india', createdAt: 0, updatedAt: 0, messages: [], followups: [], seed: true }));
    }
    const past = H.applied.map((a) => ({
      id: a.id, companyId: a.companyId || '', company: a.name, role: '', platform: H.channels, link: '', status: 'applied', appliedOn: '', followUpOn: '',
      notes: H.appliedNote, region: 'india', createdAt: 0, updatedAt: 0, messages: [], followups: [], past: true,
    }));
    const ideas = (H.ideas || []).map((x) => {
      const c = byId(x.companyId);
      if (!c) return null;
      return { id: `seed-${x.companyId}-${slug(x.role)}`, companyId: c.id, company: c.name, role: x.role, platform: 'Company site', link: c.careers || '', status: 'idea', notes: x.note, region: 'india', createdAt: 0, updatedAt: 0, messages: [], followups: [], seed: true };
    }).filter(Boolean);
    return [...ideas, ...past];
  }
  const defaultState = () => ({
    v: 1,
    updatedAt: 0,
    cv: {
      track: 'same', contact: {}, headline: {}, summary: {}, skills: {}, numbers: {}, jobs: {},
      recent: { mode: 'compact', items: D.cv.recent.items.map((it) => ({ org: it.org, title: '', start: '', end: '', summary: '' })), reason: '' },
      kits: {},
    },
    letters: { tpl: 'cover', fields: {}, appId: '' },
    settings: { region: 'india' },
    daily: {},
    firstWeek: {},
    wins: [],
    journal: {},
    saved: { roles: [], companies: [] },
    apps: seedApps(),
    ui: {},
  });

  // ---------- small UI helpers ----------
  const region = () => (S().settings && S().settings.region === 'global' && D.global ? 'global' : 'india');
  const isGlobal = () => region() === 'global';
  const G = () => D.global || {};
  /** Region-specific variant of a text field: uses `<key>Global` in Global mode when present. */
  const rv = (obj, key) => (isGlobal() && obj && obj[`${key}Global`]) || (obj && obj[key]);
  const ui = (key, fallback) => (S().ui && S().ui[key] != null ? S().ui[key] : fallback);
  const setUi = (key, value) => CC.update((s) => { s.ui = s.ui || {}; s.ui[key] = value; });

  // ---------- theosophical reflections (on unless she turns them off in Care) ----------
  const TH = () => D.theosophy;
  const theoOn = () => !!TH() && !(S().settings && S().settings.theo === false);
  const moment = (key) => (theoOn() && key && TH().moments[key]) || '';
  const withMoment = (base, key) => (moment(key) ? `${base} ${moment(key)}` : base);
  const seedOfDay = () => TH().seeds[dayOfYear() % TH().seeds.length];
  /** A short passage under a page heading: quote, attribution and one line on what it means for this page. */
  function epigraph(key) {
    const e = theoOn() && TH().epigraphs[key];
    if (!e) return null;
    return h('figure', { class: 'epigraph no-print', 'data-epigraph': key },
      h('blockquote', null, e.quote), h('figcaption', null, e.source), e.note ? h('p', null, e.note) : null);
  }
  function setTheo(on) {
    CC.update((s) => { s.settings.theo = on; });
    toast(on ? 'Theosophical reflections are on.' : 'Theosophical reflections are off. You can turn them on again in Care.');
  }

  function subtabs(key, options, fallback) {
    const cur = ui(key, fallback);
    return h('div', { class: 'subtabs', role: 'tablist' },
      options.map(([id, label]) => h('button', {
        type: 'button', role: 'tab', id: `tab-${key}-${id}`, 'aria-selected': String(cur === id),
        onclick: () => setUi(key, id),
      }, label)));
  }
  const ext = (href, text, cls = '') => h('a', { href, target: '_blank', rel: 'noopener noreferrer', class: `ext ${cls}`.trim() }, text);
  const btn = (label, onclick, cls = '', ic = null, extra = {}) => h('button', { type: 'button', class: `btn ${cls}`.trim(), onclick, ...extra }, ic ? icon(ic, 16) : null, label);
  const copyBtn = (getText, label = 'Copy', cls = 'small') => btn(label, () => CC.copy(typeof getText === 'function' ? getText() : getText), cls, 'copy');
  const sectionHead = (title, sub, right) => h('div', { class: 'section-head' },
    h('div', { class: 'stack', style: { gap: '4px' } }, h('h2', null, title), sub ? h('p', { class: 'muted prose' }, sub) : null), right || null);
  const laneLabel = { same: 'Same field', adjacent: 'Adjacent', new: 'New direction' };
  const lanePill = (lane) => h('span', { class: `pill ${lane}` }, laneLabel[lane] || lane);
  const hyLabel = { high: 'Hybrid/remote: likely', medium: 'Hybrid: sometimes', low: 'Mostly on-site/field' };
  const hyPill = (v) => h('span', { class: `pill ${v === 'high' ? 'good' : v === 'medium' ? 'warn' : 'plain'}` }, hyLabel[v] || v);
  const field = (id, label, input, hint) => h('label', { class: 'field', for: id }, label, hint ? h('span', { class: 'hint' }, hint) : null, input);
  const textInput = (id, value, oninput, attrs = {}) => h('input', { id, type: 'text', value: value || '', oninput: (e) => oninput(e.target.value), ...attrs });
  const textArea = (id, value, oninput, attrs = {}) => h('textarea', { id, value: value || '', oninput: (e) => oninput(e.target.value), ...attrs });
  const counter = (text, limit) => {
    const n = [...String(text || '')].length;
    return h('div', { class: `counter num${limit && n > limit ? ' over' : ''}` }, limit ? `${n} / ${limit} characters` : `${n} characters`);
  };
  const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const starBtn = (pressed, onclick, label) => h('button', { type: 'button', class: 'star', 'aria-pressed': String(pressed), 'aria-label': label, title: label, onclick, html: CC.svg(CC.ICONS.star, 22, pressed ? 'fill="currentColor"' : '') });

  /** Optional "Ask Claude" box: hidden unless the sample capability resolves. */
  function aiBox({ id, title, desc, placeholder, buttonLabel, run, render }) {
    const out = h('div', { class: 'ai-out', 'aria-live': 'polite' });
    const ta = h('textarea', { id, placeholder, rows: 5 });
    let ctl = null;
    const go = h('button', { type: 'button', class: 'btn primary small' }, icon('spark', 16), buttonLabel);
    const stop = h('button', { type: 'button', class: 'btn small', hidden: true }, 'Stop');
    const box = h('div', { class: 'ai-box no-print', hidden: true },
      h('div', { class: 'row between' }, h('b', null, title), h('span', { class: 'pill plain' }, 'Ask Claude')),
      h('p', { class: 'small muted' }, desc), ta, h('div', { class: 'row' }, go, stop), out);
    CC.aiReady.then((ai) => { if (ai) box.hidden = false; });
    let cancelled = false;
    stop.onclick = () => { cancelled = true; ctl && ctl.abort(); go.disabled = false; stop.hidden = true; out.textContent = ''; };
    go.onclick = async () => {
      const sample = await CC.aiReady;
      if (!sample) return;
      cancelled = false;
      const text = ta.value.trim();
      if (!text) { toast('Paste the text first.'); return; }
      ctl = new AbortController();
      go.disabled = true; stop.hidden = false;
      out.replaceChildren('Thinking…');
      try {
        const result = await run(sample, text, ctl.signal, (t) => { out.textContent = t; });
        if (cancelled) return;
        out.replaceChildren();
        if (render) out.append(render(result)); else out.textContent = result;
      } catch (e) {
        if (cancelled || (e && e.code === 'cancelled')) { out.textContent = ''; }
        else if (CC.aiHidden(e)) { box.hidden = true; }
        else { out.replaceChildren(h('p', { class: 'small' }, e && e.text ? e.text : ''), h('p', { class: 'small', style: { color: 'var(--rose)' } }, CC.aiError(e))); }
      } finally {
        go.disabled = false; stop.hidden = true;
      }
    };
    return box;
  }

  // ---------- sunrise / sector-scan canvas ----------
  let sunAnim = null;
  function sunrise(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 440, H = 250;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const css = getComputedStyle(document.documentElement);
    const col = (n) => css.getPropertyValue(n).trim() || '#e29a2e';
    const mari = col('--marigold'), rose = col('--rose'), prim = col('--primary'), line = col('--line');
    const cx = W * 0.62, cy = H + 8, R = 230;
    const a0 = Math.PI * 1.18, a1 = Math.PI * 1.82;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    function frame(now) {
      if (!canvas.isConnected) { sunAnim = null; return; }
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // sector fan
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
      g.addColorStop(0, mari); g.addColorStop(0.55, rose); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
      // depth arcs (like ultrasound depth markers / sun rings)
      ctx.globalAlpha = 0.5; ctx.strokeStyle = line; ctx.lineWidth = 1;
      for (let r = 40; r <= R; r += 38) { ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); }
      // scan lines
      ctx.globalAlpha = 0.18; ctx.strokeStyle = prim;
      for (let i = 0; i <= 14; i++) {
        const a = a0 + (a1 - a0) * (i / 14);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      }
      // sweeping beam
      const p = reduce ? 0.5 : (Math.sin(t * 0.55) + 1) / 2;
      const a = a0 + (a1 - a0) * p;
      const lg = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      lg.addColorStop(0, mari); lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.85; ctx.strokeStyle = lg; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      // sun core
      ctx.globalAlpha = 1;
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 46);
      sg.addColorStop(0, mari); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, 46, Math.PI, 2 * Math.PI); ctx.fill();
      if (!reduce) sunAnim = requestAnimationFrame(frame);
    }
    if (sunAnim) cancelAnimationFrame(sunAnim);
    sunAnim = requestAnimationFrame(frame);
  }

  // ---------- TODAY ----------
  function greeting() {
    const hr = new Date().getHours();
    const part = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    return `${part}, ${D.person.first}.`;
  }
  function followUpsDue() {
    const t = CC.iso();
    return CC.apps().filter((a) => a.status === 'applied' && a.followUpOn && a.followUpOn <= t);
  }
  function dayOfYear() { const d = new Date(); return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); }

  function planFor(energy) {
    const counts = { low: 2, okay: 3, good: 5 };
    const n = counts[energy] || 3;
    const tasks = [];
    for (const a of followUpsDue().slice(0, energy === 'low' ? 1 : 2)) {
      tasks.push({ id: `fu-${a.id}`, title: `Follow up: ${a.company}`, sub: `${a.role || 'Application'} · applied ${CC.fmt(a.appliedOn)}. A short, friendly note is enough.`, href: '#tracker', minutes: 10 });
    }
    const fw = (D.today.firstWeek || []).filter((s) => !S().firstWeek[s.id] && (energy !== 'low' || (s.minutes || 0) <= 15));
    for (const s of fw.slice(0, energy === 'good' ? 2 : 1)) tasks.push({ id: `fw-${s.id}`, title: rv(s, 'title'), sub: rv(s, 'sub'), href: s.href, minutes: s.minutes });
    const pool = (D.today.pool || []).filter((p) => p.energy.includes(energy));
    const start = dayOfYear() % Math.max(pool.length, 1);
    const rotated = [...pool.slice(start), ...pool.slice(0, start)];
    for (const p of rotated) { if (tasks.length >= n) break; if (!tasks.some((t) => t.id === `p-${p.id}`)) tasks.push({ ...p, title: rv(p, 'title'), sub: rv(p, 'sub'), id: `p-${p.id}` }); }
    // One theosophical practice a day at most; on low days it is the one thing that is for her.
    const theoPool = theoOn() ? (TH().pool || []).filter((p) => p.energy.includes(energy)) : [];
    if (theoPool.length) {
      const pick = (energy === 'low' && theoPool.find((p) => p.care)) || theoPool[dayOfYear() % theoPool.length];
      if (tasks.length >= n) tasks.pop();
      tasks.push({ ...pick, id: `th-${pick.id}`, theo: true });
    }
    if (energy === 'low' && !tasks.some((t) => t.care)) {
      const care = (D.today.pool || []).find((p) => p.care);
      if (care) { if (tasks.length >= n) tasks.pop(); tasks.push({ ...care, id: `p-${care.id}` }); }
    }
    return tasks.slice(0, n);
  }

  function weekStats() {
    const list = CC.apps();
    const applied = list.filter((a) => CC.inThisWeek(a.appliedOn)).length;
    const followups = list.reduce((n, a) => n + (a.followups || []).filter(CC.inThisWeek).length, 0);
    const outreach = list.reduce((n, a) => n + (a.messages || []).filter((m) => m.kind === 'outreach' && CC.inThisWeek(m.date)).length, 0);
    const interviews = list.filter((a) => a.status === 'interview').length;
    return { applied, followups, outreach, interviews };
  }
  const meter = (label, value, goal) => h('div', { class: 'meter' },
    h('div', { class: 'meter-top' }, h('span', null, label), h('span', { class: 'num muted' }, `${value} / ${goal}`)),
    h('div', { class: 'dots-row', 'aria-hidden': 'true' }, Array.from({ length: Math.max(goal, value) }, (_, i) => h('i', { class: i < value ? (i < goal ? 'on' : 'on extra') : '' }))));

  function firstRoundCard() {
    const F = D.history.firstRound;
    const open = !ui('firstRoundClosed', false);
    const det = h('details', { class: 'acc', open },
      h('summary', null, F.title),
      h('div', { class: 'acc-body' },
        h('p', null, F.body),
        h('ul', { class: 'clean' }, F.points.map((p) => h('li', { class: 'stack', style: { gap: '2px' } }, h('b', null, p.title), h('span', { class: 'muted' }, p.body)))),
        h('div', { class: 'row' },
          btn('See companies you have not tried', () => { CC.update((s) => { s.ui.cf = { ...(s.ui.cf || { q: '', hyd: false, cat: 'all' }), lane: 'fresh' }; s.ui.explore = 'companies'; }); go('companies'); }, 'small primary'),
          btn('Your past applications', () => { CC.update((s) => { s.ui.tf = 'applied'; }); go('tracker'); }, 'small'))));
    det.addEventListener('toggle', () => { if (det.open === ui('firstRoundClosed', false)) CC.update((s) => { s.ui.firstRoundClosed = !det.open; }, { silent: true }); });
    return det;
  }
  /** Today's seed thought: the same passage on Today and in Care, changing each day. */
  function seedCard(timer) {
    const sd = seedOfDay();
    return h('section', { class: 'card seed', 'aria-label': 'Seed thought for today' },
      h('div', { class: 'row between' }, h('span', { class: 'eyebrow' }, 'Seed thought for today'), icon('lotus', 22)),
      h('blockquote', null, sd.quote),
      h('p', { class: 'src' }, sd.source),
      h('p', { class: 'small muted' }, sd.reflection),
      timer || h('a', { href: '#care', class: 'small' }, 'Sit with it in Care'));
  }

  function viewToday() {
    const t = CC.iso();
    const day = S().daily[t] || {};
    const canvas = h('canvas', { 'aria-hidden': 'true', width: 440, height: 250 });
    requestAnimationFrame(() => sunrise(canvas));
    const energyBtn = (key) => {
      const e = D.today.energy[key];
      return h('button', {
        type: 'button', id: `energy-${key}`, 'aria-pressed': String(day.energy === key),
        onclick: () => {
          CC.update((s) => { s.daily[t] = { ...(s.daily[t] || {}), energy: key, done: (s.daily[t] || {}).done || [] }; s.ui.firstRoundClosed = true; });
          setTimeout(() => { const el = document.getElementById('plan-today'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
        },
      }, icon(key, 26), h('b', null, e.label), h('span', null, e.sub));
    };
    const plan = day.energy ? planFor(day.energy) : [];
    const done = new Set(day.done || []);
    const ws = weekStats();
    const goals = D.today.weekGoals;
    const fwDone = (D.today.firstWeek || []).filter((s) => S().firstWeek[s.id]).length;
    const evid = D.today.evidence[dayOfYear() % D.today.evidence.length];
    const winInput = h('input', { id: 'win-input', type: 'text', placeholder: 'e.g. Sent 2 applications, or went for a walk' });
    const addWin = () => {
      const v = winInput.value.trim();
      if (!v) return;
      CC.update((s) => { s.wins.unshift({ id: CC.uid(), date: t, text: v }); s.wins = s.wins.slice(0, 200); });
      toast('Added to your wins');
    };
    winInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addWin(); });
    const due = followUpsDue();
    const planData = isGlobal() && G().plan ? G().plan : D.today.plan;

    return h('div', { class: 'view' },
      h('section', { class: 'hero' }, canvas,
        h('div', { class: 'date' }, new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })),
        h('h1', { class: 'greet' }, greeting()),
        h('p', { class: 'lede' }, D.today.heroLine),
        h('div', { class: 'stack', style: { gap: '8px' } },
          h('p', { style: { fontWeight: 700 } }, 'How much energy do you have today?'),
          h('div', { class: 'energy' }, ['low', 'okay', 'good'].map(energyBtn)))),

      theoOn() ? seedCard() : null,

      planData ? h('details', { class: 'acc', open: !day.energy && !S().wins.length && !CC.apps().some((a) => !a.seed && !a.past) },
        h('summary', null, planData.title),
        h('div', { class: 'acc-body' },
          h('ol', { style: { margin: 0, paddingLeft: '1.2em', display: 'grid', gap: '8px' } }, planData.points.map((p) => h('li', null, h('b', null, p.title), ' ', h('span', { class: 'muted' }, p.body)))),
          planData.note ? h('p', { class: 'small faint' }, planData.note) : null)) : null,

      !isGlobal() && D.history && D.history.firstRound ? firstRoundCard() : null,

      day.energy ? h('section', { class: 'section', id: 'plan-today' },
        sectionHead('Today’s gentle plan', D.today.energy[day.energy].note),
        epigraph('today'),
        h('ul', { class: 'tasks' }, plan.map((task) => h('li', { class: done.has(task.id) ? 'done' : '' },
          h('input', {
            type: 'checkbox', id: `task-${task.id}`, checked: done.has(task.id), 'aria-label': `Mark done: ${task.title}`,
            style: { width: '20px', height: '20px', marginTop: '3px', accentColor: 'var(--primary)', flex: 'none' },
            onchange: (e) => CC.update((s) => {
              const d = s.daily[t] || { done: [] };
              d.done = e.target.checked ? [...new Set([...(d.done || []), task.id])] : (d.done || []).filter((x) => x !== task.id);
              s.daily[t] = d;
              if (task.id.startsWith('fw-') && e.target.checked) s.firstWeek[task.id.slice(3)] = true;
            }),
          }),
          h('div', { class: 'stack', style: { gap: '2px', flex: '1' } },
            h('span', { class: 't-title' }, task.theo ? icon('lotus', 15) : null, task.title),
            task.sub ? h('span', { class: 't-sub' }, task.sub) : null,
            h('div', { class: 'row', style: { gap: '10px' } },
              task.minutes ? h('span', { class: 'small faint' }, `about ${task.minutes} min`) : null,
              task.href ? h('a', { href: task.href, class: 'small' }, 'Open') : null))))),
        plan.length && plan.every((x) => done.has(x.id)) ? h('div', { class: 'note good' }, h('b', null, 'That’s today done.'), h('span', null, D.today.doneLine), moment('dayDone') ? h('span', { class: 'small' }, moment('dayDone')) : null) : null)
        : null,

      due.length ? h('section', { class: 'section' },
        sectionHead('Ready for a follow-up', 'A week has passed on these. A short, friendly note is enough.'),
        h('div', { class: 'grid' }, due.map((a) => h('div', { class: 'card' },
          h('b', null, a.company), h('span', { class: 'small muted' }, `${a.role || ''} · applied ${CC.fmt(a.appliedOn)}`),
          h('div', { class: 'row' },
            btn('Write follow-up', () => { CC.update((s) => { s.letters.tpl = 'followup'; s.letters.appId = a.id; s.letters.fields = { ...s.letters.fields, company: a.company, role: a.role, contact: a.contact || '' }; s.ui.apply = 'letters'; }); go('letters'); }, 'small primary'),
            btn('Not now', () => { a.followUpOn = CC.addDays(t, 3); CC.upsertApp(a); }, 'small ghost')))))) : null,

      h('section', { class: 'section' },
        sectionHead('This week', D.today.weekNote),
        h('div', { class: 'grid' },
          h('div', { class: 'card soft' }, meter('Applications sent', ws.applied, goals.applied), meter('Follow-ups', ws.followups, goals.followups), meter('People contacted', ws.outreach, goals.outreach),
            h('p', { class: 'small muted' }, ws.interviews ? `${ws.interviews} interview${ws.interviews > 1 ? 's' : ''} in progress.` : 'Interviews will show here as they come.')),
          h('div', { class: 'card soft' }, h('span', { class: 'eyebrow' }, 'Something true about you'), h('p', { style: { fontFamily: 'var(--font-display)', fontSize: '1.2rem' } }, evid),
            h('a', { href: '#care', class: 'small' }, 'More in Care')))),

      h('section', { class: 'section' },
        sectionHead('Your first week', `${fwDone} of ${(D.today.firstWeek || []).length} done. Do these in any order, at your own pace.`),
        h('ul', { class: 'tasks' }, (D.today.firstWeek || []).map((s) => h('li', { class: S().firstWeek[s.id] ? 'done' : '' },
          h('input', { type: 'checkbox', id: `fw-${s.id}`, checked: !!S().firstWeek[s.id], 'aria-label': `Done: ${s.title}`, style: { width: '20px', height: '20px', marginTop: '3px', accentColor: 'var(--primary)', flex: 'none' }, onchange: (e) => CC.update((st) => { st.firstWeek[s.id] = e.target.checked; }) }),
          h('div', { class: 'stack', style: { gap: '2px', flex: '1' } }, h('span', { class: 't-title' }, rv(s, 'title')), h('span', { class: 't-sub' }, rv(s, 'sub')),
            s.href ? h('a', { href: s.href, class: 'small' }, s.hrefLabel || 'Open') : null))))),

      h('section', { class: 'section' },
        sectionHead('Wins jar', 'Small wins count. Effort is the part you control.'),
        h('div', { class: 'row' }, h('div', { style: { flex: '1', minWidth: '220px' } }, winInput), btn('Add win', addWin, 'primary', 'plus')),
        S().wins.length ? h('ul', { class: 'clean' }, S().wins.slice(0, 6).map((w) => h('li', { class: 'row between', style: { padding: '8px 12px', background: 'var(--surface-2)', borderRadius: '10px' } },
          h('span', null, w.text), h('span', { class: 'small faint num' }, CC.fmt(w.date)))))
          : h('p', { class: 'small faint' }, 'Your wins will collect here.')));
  }

  // ---------- EXPLORE ----------
  function viewExplore() {
    const tab = ui('explore', 'paths');
    return h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('span', { class: 'eyebrow' }, 'Explore'), h('h1', null, 'Where you could go next'),
        h('p', { class: 'lede' }, D.explore.intro)),
      isGlobal() && G().intro ? h('div', { class: 'note info' }, h('b', null, 'Global mode'), h('span', null, G().intro)) : null,
      subtabs('explore', [['paths', 'Role paths'], ['companies', 'Companies'], ['abroad', 'Remote & abroad']], 'paths'),
      epigraph(tab),
      tab === 'paths' ? viewPaths() : tab === 'companies' ? viewCompanies() : viewAbroad());
  }

  function viewPaths() {
    const lane = ui('lane', 'all');
    const roles = D.roles.filter((r) => lane === 'all' || r.lane === lane || (lane === 'saved' && S().saved.roles.includes(r.id)));
    return h('div', { class: 'section' },
      h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by lane' },
        [['all', 'All'], ['same', 'Same field'], ['adjacent', 'Adjacent'], ['new', 'New direction'], ['saved', 'Starred']].map(([id, label]) =>
          h('button', { type: 'button', class: 'chip', 'aria-pressed': String(lane === id), onclick: () => setUi('lane', id) }, label))),
      h('div', { class: 'note info' }, h('b', null, 'How to read the lanes'), h('span', null, D.explore.lanesNote)),
      h('div', { class: 'grid two' }, roles.map(roleCard)),
      roles.length ? null : h('p', { class: 'muted' }, 'Nothing starred yet. Tap the star on any role to keep it here.'));
  }
  /** Employers she has not tried yet come first; ones she already applied to are marked. */
  function whoHires(list) {
    const tried = new Set(((D.history && D.history.applied) || []).map((a) => a.name.toLowerCase().split(/\s+/)[0]));
    const isTried = (name) => tried.has(String(name).toLowerCase().replace(/[^a-z ]/g, ' ').trim().split(/\s+/)[0]);
    const fresh = list.filter((e) => !isTried(e));
    const old = list.filter(isTried).map((e) => `${e} (applied)`);
    return [...fresh, ...old].join(', ');
  }
  function roleCard(r) {
    const starred = S().saved.roles.includes(r.id);
    return h('article', { class: 'card' },
      h('div', { class: 'rc-top' }, h('div', { class: 'stack', style: { gap: '6px' } }, h('h3', null, r.title), h('div', { class: 'rc-meta' }, lanePill(r.lane), hyPill(r.hybrid))),
        starBtn(starred, () => CC.update((s) => { s.saved.roles = toggleIn(s.saved.roles, r.id); }), starred ? 'Unstar role' : 'Star role')),
      h('p', null, r.why),
      h('dl', { class: 'stack', style: { gap: '8px', margin: 0 } },
        r.gaps ? h('div', { class: 'kv' }, h('dt', null, 'To bridge'), h('dd', null, CV.marked(r.gaps))) : null,
        r.salary && !isGlobal() ? h('div', { class: 'kv' }, h('dt', null, 'Typical pay in India (indicative)'), h('dd', null, r.salary)) : null,
        r.hybridWhy ? h('div', { class: 'kv' }, h('dt', null, 'Work pattern'), h('dd', null, r.hybridWhy)) : null),
      h('div', { class: 'kv' }, h('dt', { class: 'eyebrow' }, 'Search titles'), h('div', { class: 'chips' }, r.variants.map((v) => h('span', { class: 'chip static' }, v)))),
      r.upskill && r.upskill.length ? h('details', { class: 'acc' }, h('summary', null, 'Quick ways to upskill'),
        h('div', { class: 'acc-body' }, r.upskill.map((u) => h('div', { class: 'stack', style: { gap: '2px' } },
          u.url ? ext(u.url, u.name) : h('b', null, u.name), h('span', { class: 'small muted' }, [u.provider, u.cost, u.duration].filter(Boolean).join(' · ')))))) : null,
      r.employers && r.employers.length ? h('p', { class: 'small muted' }, h('b', null, 'Who hires: '), whoHires(r.employers)) : null,
      h('div', { class: 'row' },
        btn('Find these jobs', () => { CC.update((s) => { s.ui.searchQ = r.variants[0]; s.ui.apply = 'search'; }); go('search'); }, 'small primary', 'send'),
        btn('Matching CV', () => { CC.update((s) => { s.cv.track = r.lane; s.ui.apply = 'cv'; }); go('cv'); }, 'small')));
  }

  function viewCompanies() {
    const f = ui('cf', { q: '', lane: 'all', hyd: false, cat: 'all' });
    const source = isGlobal() && Array.isArray(G().companies) ? G().companies : D.companies;
    const cats = [...new Set(source.map((c) => c.category))].sort();
    const q = (f.q || '').toLowerCase();
    const tried = new Set(CC.apps().filter((a) => a.status !== 'idea' && (a.region || 'india') === region()).map((a) => a.companyId).filter(Boolean));
    const list = source.filter((c) =>
      (f.lane === 'all' || c.lane === f.lane || (f.lane === 'saved' && S().saved.companies.includes(c.id)) || (f.lane === 'fresh' && !tried.has(c.id))) &&
      (isGlobal() || !f.hyd || c.hyd) && (f.cat === 'all' || c.category === f.cat) &&
      (!q || `${c.name} ${c.category} ${c.roles.join(' ')} ${c.functions}`.toLowerCase().includes(q)));
    const setF = (patch) => setUi('cf', { ...f, ...patch });
    const search = h('input', { type: 'search', id: 'company-q', placeholder: 'Search companies or roles', value: f.q || '' });
    let tmr;
    search.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => setF({ q: search.value }), 300); });
    return h('div', { class: 'section' },
      h('div', { class: 'filters' },
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter by lane' },
          [['all', 'All'], ['fresh', 'New to you'], ['same', 'Same field'], ['adjacent', 'Adjacent'], ['new', 'New direction'], ['saved', 'Starred']].map(([id, label]) =>
            h('button', { type: 'button', class: 'chip', 'aria-pressed': String(f.lane === id), onclick: () => setF({ lane: id }) }, label))),
        h('div', { class: 'toolbar' }, search,
          h('select', { id: 'company-cat', 'aria-label': 'Category', value: f.cat, onchange: (e) => setF({ cat: e.target.value }) },
            h('option', { value: 'all' }, 'All categories'), cats.map((c) => h('option', { value: c }, c))),
          isGlobal() ? null : h('label', { class: 'check', for: 'company-hyd' }, h('input', { type: 'checkbox', id: 'company-hyd', checked: !!f.hyd, onchange: (e) => setF({ hyd: e.target.checked }) }), 'Hyderabad office'),
          h('span', { class: 'count-note num' }, `${list.length} of ${source.length}`))),
      h('div', { class: 'grid two' }, list.map(companyCard)),
      !isGlobal() && D.explore.marketNotes && D.explore.marketNotes.length ? h('details', { class: 'acc' }, h('summary', null, 'What’s happening in the market (2025–26)'),
        h('div', { class: 'acc-body' }, h('ul', { class: 'dots' }, D.explore.marketNotes.map((n) => h('li', null, n))))) : null);
  }
  function companyCard(c) {
    const starred = S().saved.companies.includes(c.id);
    const kw = c.roles[0] || '';
    const li = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${c.name} ${kw}`)}&location=${isGlobal() ? 'Worldwide' : 'India'}`;
    const reviews = `https://www.google.com/search?q=${encodeURIComponent(`${c.name} ${isGlobal() ? '' : 'India '}reviews Glassdoor${isGlobal() ? '' : ' AmbitionBox'}`)}`;
    const findCareers = `https://www.google.com/search?q=${encodeURIComponent(`${c.name} ${isGlobal() ? '' : 'India '}careers official site`)}`;
    const mine = CC.apps().filter((a) => (a.companyId === c.id || a.company === c.name) && (a.region || 'india') === region());
    const inTracker = mine.length > 0;
    const appliedBefore = mine.some((a) => a.past || a.status === 'applied' || a.status === 'closed');
    return h('article', { class: 'card' },
      h('div', { class: 'rc-top' }, h('div', { class: 'stack', style: { gap: '6px' } }, h('h3', null, c.name),
        h('div', { class: 'rc-meta' }, lanePill(c.lane), h('span', { class: 'pill plain' }, c.category), c.hyd && !isGlobal() ? h('span', { class: 'pill good' }, 'Hyderabad') : null, appliedBefore ? h('span', { class: 'pill plain' }, 'You applied here') : null)),
        starBtn(starred, () => CC.update((s) => { s.saved.companies = toggleIn(s.saved.companies, c.id); }), starred ? 'Unstar company' : 'Star company')),
      h('p', null, c.fit),
      h('dl', { class: 'stack', style: { gap: '8px', margin: 0 } },
        appliedBefore && D.history ? h('p', { class: 'small muted' }, D.history.pastNext) : null,
        h('div', { class: 'kv' }, h('dt', null, isGlobal() ? 'What they do' : 'What they do here'), h('dd', null, c.functions)),
        h('div', { class: 'kv' }, h('dt', null, 'Work pattern'), h('dd', null, c.work)),
        h('div', { class: 'kv' }, h('dt', null, 'Cities'), h('dd', null, c.cities.join(' \u00b7 ')))),
      h('div', { class: 'kv' }, h('dt', { class: 'eyebrow' }, 'Titles to search on their site'), h('div', { class: 'chips' },
        c.roles.map((r) => h('button', { type: 'button', class: 'chip', title: 'Copy this title', onclick: () => CC.copy(r) }, r)))),
      h('div', { class: 'row' },
        c.careers ? ext(c.careers, 'Careers site', 'btn small primary') : ext(findCareers, 'Find careers page', 'btn small primary'),
        ext(li, 'LinkedIn jobs', 'btn small'),
        ext(reviews, 'Reviews', 'btn small ghost'),
        btn(inTracker ? 'In tracker' : 'Add to tracker', () => {
          if (inTracker) { go('tracker'); return; }
          CC.upsertApp({ id: CC.uid(), companyId: c.id, company: c.name, role: kw, platform: 'Company site', link: c.careers || '', status: 'idea', region: region(), createdAt: Date.now(), messages: [], followups: [] });
          toast(`${c.name} added to your tracker`);
        }, 'small ghost', inTracker ? 'check' : 'plus')));
  }

  function viewAbroad() {
    const R = D.remote;
    return h('div', { class: 'stack', style: { gap: '26px' } },
      h('div', { class: 'note warm' }, h('b', null, 'How this fits with your earlier plan'), h('span', null, R.oldPlanNote)),
      h('section', { class: 'section' }, sectionHead('Remote roles from India', R.remoteIntro),
        h('div', { class: 'grid' }, R.boards.map((b) => h('div', { class: 'card' }, h('div', { class: 'row between' }, h('b', null, b.name), b.useful ? h('span', { class: `pill ${b.useful === 'high' ? 'good' : b.useful === 'medium' ? 'warn' : 'plain'}` }, `Useful: ${b.useful}`) : null),
          h('p', { class: 'small' }, b.notes), b.url ? ext(b.url, 'Open', 'small') : null))),
        R.eor ? h('div', { class: 'note info' }, h('b', null, 'Why foreign companies can now hire you in India'), h('span', null, R.eor)) : null),
      R.employers && R.employers.length ? h('section', { class: 'section' }, sectionHead('MedTech and health companies with remote roles', R.employersIntro),
        h('div', { class: 'grid' }, R.employers.map((e) => h('div', { class: 'card' }, h('b', null, e.name), h('p', { class: 'small' }, e.roles), h('p', { class: 'small muted' }, e.india), e.url ? ext(e.url, 'Careers', 'small') : null)))) : null,
      h('section', { class: 'section' }, sectionHead('Flexible expert income (on the side)', R.expertIntro),
        h('div', { class: 'grid' }, R.expert.map((e) => h('div', { class: 'card' },
          h('div', { class: 'row between' }, h('b', null, e.name), h('span', { class: 'pill plain' }, e.kind)),
          h('p', { class: 'small' }, e.how), e.pay ? h('p', { class: 'small muted' }, e.pay) : null,
          e.caution ? h('p', { class: 'small', style: { color: 'var(--warn)' } }, e.caution) : null, e.url ? ext(e.url, 'Website', 'small') : null)))),
      h('section', { class: 'section' }, sectionHead('If you move abroad later', R.overseasIntro),
        h('div', { class: 'table-scroll' }, h('table', { class: 'data stack-sm' },
          h('thead', null, h('tr', null, ['Country', 'Route now (Oct 2026)', 'What changed', 'Effort', 'First step'].map((x) => h('th', null, x)))),
          h('tbody', null, R.overseas.map((o) => h('tr', null, h('td', null, h('b', null, o.country)), h('td', { 'data-label': 'Route now' }, o.route), h('td', { 'data-label': 'What changed' }, o.changed),
            h('td', { 'data-label': 'Effort' }, h('span', { class: `pill ${o.effort === 'low' ? 'good' : o.effort === 'medium' ? 'warn' : 'rose'}` }, o.effort)), h('td', { 'data-label': 'First step' }, o.first)))))),
        h('p', { class: 'small faint' }, R.overseasCaveat)));
  }

  // ---------- APPLY ----------
  function viewApply() {
    const tab = ui('apply', 'search');
    return h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('span', { class: 'eyebrow' }, 'Apply'), h('h1', null, tab === 'cv' ? 'Your CV' : tab === 'letters' ? 'Letters & messages' : 'Find openings'),
        h('p', { class: 'lede' }, tab === 'cv' ? D.cv.intro : tab === 'letters' ? D.letters.intro : isGlobal() && G().search ? G().search.intro : D.search.intro)),
      subtabs('apply', [['search', 'Search'], ['cv', 'CV studio'], ['letters', 'Letters']], 'search'),
      epigraph(tab),
      tab === 'cv' ? viewCV() : tab === 'letters' ? viewLetters() : isGlobal() && G().search ? viewSearchGlobal() : viewSearch());
  }

  const enc = encodeURIComponent;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function buildSearchLinks(q, loc, mode, recent) {
    const anywhere = loc === 'India';
    const out = [];
    for (const p of D.search.platforms) {
      if (!p.build) continue;
      const url = SEARCH_BUILDERS[p.build] && SEARCH_BUILDERS[p.build](q, loc, mode, recent, anywhere);
      if (url) out.push({ name: p.name, url, note: p.linkNote || '' });
    }
    return out;
  }
  const SEARCH_BUILDERS = {
    linkedin: (q, loc, mode, recent) => {
      const wt = mode === 'remote' ? '2' : mode === 'hybrid' ? '3' : mode === 'flex' ? '2%2C3' : '';
      return `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=${enc(loc === 'India' ? 'India' : `${loc}, India`)}${wt ? `&f_WT=${wt}` : ''}${recent ? '&f_TPR=r604800&sortBy=DD' : ''}`;
    },
    naukri: (q, loc, mode, recent, anywhere) => {
      const wfh = mode === 'remote' ? '&wfhType=2' : mode === 'hybrid' ? '&wfhType=3' : mode === 'flex' ? '&wfhType=2&wfhType=3' : '';
      const path = anywhere ? `${slug(q)}-jobs` : `${slug(q)}-jobs-in-${slug(loc)}`;
      return `https://www.naukri.com/${path}?k=${enc(q)}${anywhere ? '' : `&l=${enc(loc)}`}${wfh}${recent ? '&jobAge=7' : ''}`;
    },
    indeed: (q, loc, mode, recent, anywhere) => {
      const sc = mode === 'remote' ? '&sc=0kf%3Aattr(DSQF7)%3B' : mode === 'hybrid' ? '&sc=0kf%3Aattr(PAXZC)%3B' : '';
      return `https://in.indeed.com/jobs?q=${enc(q)}&l=${enc(anywhere ? 'India' : loc)}${sc}${recent ? '&fromage=7' : ''}`;
    },
    foundit: (q, loc, mode, recent, anywhere) => `https://www.foundit.in/srp/results?query=${enc(q)}${anywhere ? '' : `&locations=${enc(loc)}`}`,
    google: (q, loc, mode) => `https://www.google.com/search?q=${enc(`${q} jobs ${loc === 'India' ? 'India' : loc}${mode === 'remote' ? ' remote' : mode === 'hybrid' ? ' hybrid' : ''}`)}&udm=8`,
  };

  function viewSearch() {
    const sq = ui('searchQ', D.roles[0].variants[0]);
    const loc = ui('searchLoc', 'Hyderabad');
    const mode = ui('searchMode', 'any');
    const recent = ui('searchRecent', true);
    const qInput = h('input', { type: 'search', id: 'search-q', value: sq, placeholder: 'Job title or keywords' });
    const linksBox = h('div', { class: 'links' });
    const renderLinks = () => {
      const q = qInput.value.trim() || sq;
      linksBox.replaceChildren(...buildSearchLinks(q, loc, mode, recent).map((l) => h('a', { class: 'linkcard', href: l.url, target: '_blank', rel: 'noopener noreferrer' }, h('b', null, `${l.name} ↗`), h('span', null, l.note || `${q} · ${loc}`))));
    };
    let tmr;
    qInput.addEventListener('input', () => { renderLinks(); clearTimeout(tmr); tmr = setTimeout(() => CC.update((s) => { s.ui.searchQ = qInput.value; }, { silent: true }), 400); });
    renderLinks();
    const suggestions = [...new Set(D.roles.filter((r) => S().saved.roles.includes(r.id)).concat(D.roles).flatMap((r) => r.variants.slice(0, 1)))].slice(0, ui('moreTitles', false) ? 14 : 6);
    return h('div', { class: 'stack', style: { gap: '26px' } },
      h('section', { class: 'section' },
        sectionHead('Search builder', 'Pick a title, a city and how you want to work. Each button opens that site with the search filled in.'),
        h('div', { class: 'card' },
          field('search-q', 'Job title or keywords', qInput),
          h('div', { class: 'chips' }, h('button', { type: 'button', class: 'chip', onclick: () => setUi('moreTitles', !ui('moreTitles', false)) }, ui('moreTitles', false) ? 'Fewer titles' : 'More titles'), suggestions.map((s) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(sq === s), onclick: () => setUi('searchQ', s) }, s))),
          h('div', { class: 'form-grid' },
            field('search-loc', 'Where', h('select', { id: 'search-loc', value: loc, onchange: (e) => setUi('searchLoc', e.target.value) }, D.search.locations.map((l) => h('option', { value: l }, l === 'India' ? 'Anywhere in India' : l)))),
            field('search-mode', 'Work pattern', h('select', { id: 'search-mode', value: mode, onchange: (e) => setUi('searchMode', e.target.value) },
              [['any', 'Any'], ['flex', 'Hybrid or remote'], ['hybrid', 'Hybrid'], ['remote', 'Remote']].map(([v, l]) => h('option', { value: v }, l))))),
          h('label', { class: 'check', for: 'search-recent' }, h('input', { type: 'checkbox', id: 'search-recent', checked: recent, onchange: (e) => setUi('searchRecent', e.target.checked) }), h('span', null, 'Only jobs posted in the last 7 days ', h('span', { class: 'small faint' }, '(early applications are read first)'))),
          linksBox,
          h('p', { class: 'small faint' }, D.search.linkCaveat))),
      h('section', { class: 'section' }, sectionHead('A 30-minute search routine', 'Short and regular beats long and draining.'),
        h('ol', { class: 'tasks', style: { listStyle: 'none' } }, D.search.routine.map((r, i) => h('li', null, h('b', { class: 'num', style: { color: 'var(--marigold-ink)', minWidth: '1.4em' } }, `${i + 1}`), h('div', { class: 'stack', style: { gap: '2px' } }, h('span', { class: 't-title' }, r.title), h('span', { class: 't-sub' }, r.sub)))))),
      h('section', { class: 'section' }, sectionHead('Platform playbook', 'What each site is best for, and how to use it well.'),
        h('div', { class: 'stack', style: { gap: '0' } }, D.search.platforms.map((p) => h('details', { class: 'acc' },
          h('summary', null, h('span', null, p.name, h('span', { class: 'small faint', style: { fontWeight: 400 } }, ` · ${p.bestFor}`))),
          h('div', { class: 'acc-body' }, h('ul', { class: 'dots' }, p.tips.map((t) => h('li', null, t))), p.url ? ext(p.url, `Open ${p.name}`, 'small') : null))))),
      h('section', { class: 'section' }, sectionHead('What works in 2026', 'Current, practical tips for getting read by a human.'),
        h('div', { class: 'grid' }, D.search.tips.map((t) => h('div', { class: 'card soft' }, h('b', null, t.tip), h('p', { class: 'small muted' }, t.why))))),
      h('section', { class: 'section' }, sectionHead('Scam shield', 'Real employers never ask you for money. Check before you share documents.'),
        h('div', { class: 'grid two' },
          h('div', { class: 'card' }, h('h4', null, 'Red flags'), h('ul', { class: 'dots' }, D.search.scams.flags.map((f) => h('li', null, h('b', null, f.flag), ' — ', f.detail)))),
          h('div', { class: 'card' }, h('h4', null, 'Check a company or recruiter'), h('ol', { style: { margin: 0, paddingLeft: '1.2em', display: 'grid', gap: '6px' } }, D.search.scams.verify.map((v) => h('li', null, v))),
            h('div', { class: 'note warm' }, h('b', null, 'If something feels wrong'), h('span', null, D.search.scams.report)))),
        aiBox({
          id: 'ai-scam', title: 'Ask Claude: does this look safe?', desc: 'Paste a job message, email or offer. You will get a plain-language risk check. Remove personal numbers first if you prefer.',
          placeholder: 'Paste the message here', buttonLabel: 'Check it',
          run: (sample, text, signal) => sample.json(`You help an experienced job seeker in India spot job scams. Assess the message below.\nReply with only JSON: {"risk":"low"|"medium"|"high","summary":string (2 sentences, plain and calm),"red_flags":[string],"checks":[string] (3-5 concrete verification steps, India-specific where useful, e.g. official careers page, MCA21, LinkedIn employee check, never pay fees, report at cybercrime.gov.in or 1930)}.\n\nMESSAGE:\n${text.slice(0, 8000)}`, { signal, effort: 'low' }),
          render: (r) => h('div', { class: 'stack' },
            h('div', { class: 'row' }, h('span', { class: `pill ${r.risk === 'low' ? 'good' : r.risk === 'medium' ? 'warn' : 'rose'}` }, `Risk: ${r.risk}`)),
            h('p', null, r.summary || ''),
            (r.red_flags || []).length ? h('div', null, h('b', null, 'Red flags'), h('ul', { class: 'dots' }, r.red_flags.map((x) => h('li', null, String(x))))) : null,
            (r.checks || []).length ? h('div', null, h('b', null, 'Checks to do'), h('ul', { class: 'dots' }, r.checks.map((x) => h('li', null, String(x))))) : null),
        })));
  }

  const GLOBAL_BUILDERS = {
    linkedin: (q, loc, mode, recent) => `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}&location=${enc(loc.linkedin || 'Worldwide')}${mode === 'remote' || loc.remote ? '&f_WT=2' : mode === 'hybrid' ? '&f_WT=3' : ''}${recent ? '&f_TPR=r604800&sortBy=DD' : ''}`,
    indeed: (q, loc, mode, recent) => (loc.indeed ? `https://${loc.indeed}/jobs?q=${enc(q)}&l=${enc(loc.indeedLoc || (loc.remote ? 'Remote' : ''))}${recent ? '&fromage=7' : ''}` : null),
    google: (q, loc, mode) => `https://www.google.com/search?q=${enc(`${q} jobs ${loc.remote ? 'remote' : loc.label}${mode === 'hybrid' ? ' hybrid' : ''}`)}&udm=8`,
  };
  function patternBuild(id, b, q, loc) {
    if (!b || !b.pattern) return null;
    const ls = (loc.slugs && loc.slugs[id]) || loc.slug || slug(loc.label);
    return b.pattern.replace(/\{qslug\}/g, slug(q)).replace(/\{q\}/g, enc(q)).replace(/\{locslug\}/g, ls).replace(/\{loc\}/g, enc(loc.label));
  }
  function viewSearchGlobal() {
    const GS = G().search;
    const locs = GS.locations || [];
    const loc = locs.find((l) => l.id === ui('gLoc', '')) || locs[0];
    const sq = ui('searchQ', D.roles[0].variants[0]);
    const mode = ui('gMode', 'any');
    const recent = ui('searchRecent', true);
    const qInput = h('input', { type: 'search', id: 'gsearch-q', value: sq, placeholder: 'Job title or keywords' });
    const linksBox = h('div', { class: 'links' });
    const renderLinks = () => {
      const q = qInput.value.trim() || sq;
      const links = [];
      for (const p of GS.platforms || []) {
        if (!p.build || (Array.isArray(p.regions) && p.regions.length && !p.regions.includes(loc.id))) continue;
        const url = GLOBAL_BUILDERS[p.build] ? GLOBAL_BUILDERS[p.build](q, loc, mode, recent) : patternBuild(p.build, (GS.builders || {})[p.build], q, loc);
        if (url) links.push(h('a', { class: 'linkcard', href: url, target: '_blank', rel: 'noopener noreferrer' }, h('b', null, `${p.name} ↗`), h('span', null, p.linkNote || `${q} · ${loc.label}`)));
      }
      linksBox.replaceChildren(...links);
    };
    let tmr;
    qInput.addEventListener('input', () => { renderLinks(); clearTimeout(tmr); tmr = setTimeout(() => CC.update((s) => { s.ui.searchQ = qInput.value; }, { silent: true }), 400); });
    renderLinks();
    const suggestions = [...new Set(D.roles.flatMap((r) => r.variants.slice(0, 1)))].slice(0, ui('moreTitles', false) ? 12 : 6);
    const flags = [...((D.search.scams && D.search.scams.flags) || []), ...(GS.scamsExtra || [])];
    return h('div', { class: 'stack', style: { gap: '26px' } },
      h('section', { class: 'section' },
        sectionHead('Search builder', 'Pick a title and a place. Remote roles first; moving abroad takes longer, so keep India in view too.'),
        h('div', { class: 'card' },
          field('gsearch-q', 'Job title or keywords', qInput),
          h('div', { class: 'chips' }, h('button', { type: 'button', class: 'chip', onclick: () => setUi('moreTitles', !ui('moreTitles', false)) }, ui('moreTitles', false) ? 'Fewer titles' : 'More titles'), suggestions.map((x) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(sq === x), onclick: () => setUi('searchQ', x) }, x))),
          h('div', { class: 'form-grid' },
            field('gsearch-loc', 'Where', h('select', { id: 'gsearch-loc', value: loc ? loc.id : '', onchange: (e) => setUi('gLoc', e.target.value) }, locs.map((l) => h('option', { value: l.id }, l.label)))),
            field('gsearch-mode', 'Work pattern', h('select', { id: 'gsearch-mode', value: mode, onchange: (e) => setUi('gMode', e.target.value) },
              [['any', 'Any'], ['remote', 'Remote'], ['hybrid', 'Hybrid']].map(([v, l]) => h('option', { value: v }, l))))),
          h('label', { class: 'check', for: 'gsearch-recent' }, h('input', { type: 'checkbox', id: 'gsearch-recent', checked: recent, onchange: (e) => setUi('searchRecent', e.target.checked) }), h('span', null, 'Only jobs posted in the last 7 days')),
          linksBox,
          h('p', { class: 'small faint' }, GS.linkCaveat || D.search.linkCaveat))),
      (GS.tips || []).length ? h('section', { class: 'section' }, sectionHead('What works for global and remote roles', null),
        h('div', { class: 'grid' }, GS.tips.map((t) => h('div', { class: 'card soft' }, h('b', null, t.tip), h('p', { class: 'small muted' }, t.why))))) : null,
      h('section', { class: 'section' }, sectionHead('Platform playbook', 'Where each site helps, and how to use it.'),
        h('div', { class: 'stack', style: { gap: '0' } }, (GS.platforms || []).map((p) => h('details', { class: 'acc' },
          h('summary', null, h('span', null, p.name, h('span', { class: 'small faint', style: { fontWeight: 400 } }, ` · ${p.bestFor}`))),
          h('div', { class: 'acc-body' }, h('ul', { class: 'dots' }, (p.tips || []).map((t) => h('li', null, t))), p.url ? ext(p.url, `Open ${p.name}`, 'small') : null))))),
      h('section', { class: 'section' }, sectionHead('Working abroad safely', 'Real employers and registered agents never ask you to pay for a job.'),
        h('div', { class: 'grid two' },
          h('div', { class: 'card' }, h('h4', null, 'Red flags'), h('ul', { class: 'dots' }, flags.map((f) => h('li', null, h('b', null, f.flag), ' — ', f.detail)))),
          (GS.safety || []).length ? h('div', { class: 'card' }, h('h4', null, 'Steps that keep you safe'), h('ol', { style: { margin: 0, paddingLeft: '1.2em', display: 'grid', gap: '6px' } }, GS.safety.map((v) => h('li', null, v)))) : null)));
  }

  // ----- CV studio -----
  function viewCV() {
    const st = S().cv;
    const track = st.track;
    const T = D.cv.tracks;
    const previewBox = h('div', { class: 'paper-scroll' });
    const missingBox = h('div');
    const refresh = () => {
      const m = CV.model(track);
      previewBox.replaceChildren(CV.preview(m));
      missingBox.replaceChildren(m.missing.length ? h('div', { class: 'note warm' }, h('b', null, `${m.missing.length} detail${m.missing.length > 1 ? 's' : ''} to fill before sending`), h('ul', { class: 'dots' }, m.missing.map((x) => h('li', null, x)))) : h('div', { class: 'note good' }, h('b', null, 'All key details are filled.'), h('span', null, 'Read it once aloud, then send it out.')));
    };
    const quiet = (fn) => { CC.update(fn, { silent: true }); refresh(); };
    const contact = { ...D.cv.contact, ...(st.contact || {}) };
    if (isGlobal()) contact.availability = (st.contact || {}).availabilityGlobal != null ? st.contact.availabilityGlobal : ((G().cv || {}).availability || contact.availability);

    const editorJobs = D.cv.jobs.map((job) => {
      const list = CV.bullets(job, track);
      const overridden = !!(st.jobs[job.id] && st.jobs[job.id].bullets && st.jobs[job.id].bullets[track]);
      const setBullets = (arr) => quiet((s) => { const js = s.cv.jobs[job.id] = s.cv.jobs[job.id] || {}; js.bullets = js.bullets || {}; js.bullets[track] = arr; });
      return h('details', { class: 'acc' }, h('summary', null, h('span', null, CV.field(job, 'title'), h('span', { class: 'small faint', style: { fontWeight: 400 } }, ` · ${CV.field(job, 'org')}`))),
        h('div', { class: 'acc-body' },
          h('div', { class: 'form-grid' },
            ['title', 'org', 'city', 'start', 'end'].map((k) => field(`job-${job.id}-${k}`, { title: 'Title', org: 'Company', city: 'City', start: 'Start (e.g. Jul 2022)', end: 'End (e.g. Mar 2025)' }[k],
              textInput(`job-${job.id}-${k}`, CV.field(job, k), (v) => quiet((s) => { const js = s.cv.jobs[job.id] = s.cv.jobs[job.id] || {}; js[k] = v; }), k === 'end' && !CV.field(job, 'end') ? { placeholder: job.endHint || 'Month Year' } : {})))),
          h('p', { class: 'small muted' }, overridden ? 'You have edited these bullets for this CV version.' : 'Suggested bullets for this CV version. Edit freely; your words win.'),
          list.map((b, i) => h('div', { class: 'bullet-edit' },
            h('textarea', { id: `b-${job.id}-${track}-${i}`, rows: 2, value: b, 'aria-label': `Bullet ${i + 1}`, oninput: (e) => { const arr = [...CV.bullets(job, track)]; arr[i] = e.target.value; setBullets(arr); } }),
            h('button', { type: 'button', class: 'btn small ghost', 'aria-label': 'Remove bullet', onclick: () => { const arr = [...CV.bullets(job, track)]; arr.splice(i, 1); CC.update((s) => { const js = s.cv.jobs[job.id] = s.cv.jobs[job.id] || {}; js.bullets = js.bullets || {}; js.bullets[track] = arr; }); } }, icon('trash', 16)))),
          h('div', { class: 'row' },
            btn('Add bullet', () => CC.update((s) => { const js = s.cv.jobs[job.id] = s.cv.jobs[job.id] || {}; js.bullets = js.bullets || {}; js.bullets[track] = [...CV.bullets(job, track), '']; }), 'small', 'plus'),
            overridden ? btn('Reset to suggested', () => CC.update((s) => { delete s.cv.jobs[job.id].bullets[track]; }), 'small ghost') : null)));
    });

    const recent = st.recent;
    const modeInfo = D.cv.recent.modes;
    const recentEditor = h('div', { class: 'card' },
      h('h4', null, 'Show your two short roles on this CV?'),
      h('p', { class: 'small muted' }, D.cv.recent.why),
      h('div', { class: 'chips', role: 'radiogroup', 'aria-label': 'How to show them' }, Object.entries(modeInfo).map(([k, v]) =>
        h('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(recent.mode === k), 'aria-pressed': String(recent.mode === k), onclick: () => CC.update((s) => { s.cv.recent.mode = k; }) }, v.label))),
      h('p', { class: 'small' }, modeInfo[recent.mode] ? modeInfo[recent.mode].note : ''),
      recent.mode === 'omit' ? null : recent.items.map((it, i) => h('div', { class: 'form-grid' },
        field(`rec-${i}-title`, `Title at ${it.org}`, textInput(`rec-${i}-title`, it.title, (v) => quiet((s) => { s.cv.recent.items[i].title = v; }), { placeholder: 'e.g. Application Specialist' })),
        field(`rec-${i}-start`, 'Start', textInput(`rec-${i}-start`, it.start, (v) => quiet((s) => { s.cv.recent.items[i].start = v; }), { placeholder: 'e.g. May 2025' })),
        field(`rec-${i}-end`, 'End', textInput(`rec-${i}-end`, it.end, (v) => quiet((s) => { s.cv.recent.items[i].end = v; }), { placeholder: 'e.g. Jun 2025' })))),
      recent.mode === 'omit' ? null : field('rec-reason', 'One-line reason (factual, no blame)', textInput('rec-reason', recent.reason || D.cv.recent.reason, (v) => quiet((s) => { s.cv.recent.reason = v; })), 'Keep it short and true. Interviews are where you explain more.'));

    const numbers = h('details', { class: 'acc' }, h('summary', null, 'Numbers you remember (makes bullets stronger)'),
      h('div', { class: 'acc-body' }, h('p', { class: 'small muted' }, D.cv.numbersNote),
        h('div', { class: 'form-grid' }, D.cv.numbers.map((n) => field(`num-${n.key}`, n.q, textInput(`num-${n.key}`, (st.numbers || {})[n.key], (v) => quiet((s) => { s.cv.numbers[n.key] = v; }), { placeholder: n.hint }))))));

    const contactEd = h('details', { class: 'acc' }, h('summary', null, 'Contact line'),
      h('div', { class: 'acc-body form-grid' }, [['name', 'Name'], ['city', 'City'], ['phone', 'Phone'], ['email', 'Email'], ['linkedin', 'LinkedIn URL'], ['availability', 'Availability']].map(([k, l]) =>
        field(`c-${k}`, k === 'availability' && isGlobal() ? 'Availability (Global mode)' : l, textInput(`c-${k}`, contact[k], (v) => quiet((s) => { s.cv.contact[k === 'availability' && isGlobal() ? 'availabilityGlobal' : k] = v; }), k === 'linkedin' ? { placeholder: 'linkedin.com/in/your-name' } : {})))));

    const textBlock = (key, label, rows, limit) => {
      const val = CV.trackText(key, track);
      const cnt = h('div');
      const upd = (v) => { cnt.replaceChildren(counter(v, limit)); };
      upd(Array.isArray(val) ? val.join(', ') : val);
      return h('div', { class: 'stack', style: { gap: '4px' } },
        field(`cv-${key}-${track}`, label, textArea(`cv-${key}-${track}`, Array.isArray(val) ? val.join(', ') : val, (v) => { upd(v); quiet((s) => { s.cv[key][track] = v; }); }, { rows })), cnt);
    };

    refresh();
    const kitRow = (key, label, limit, rows = 3) => {
      const val = CV.kit(track, key);
      const cnt = h('div', null, counter(val, limit));
      const ta = textArea(`kit-${key}-${track}`, val, (v) => { cnt.replaceChildren(counter(v, limit)); CC.update((s) => { s.cv.kits[track] = s.cv.kits[track] || {}; s.cv.kits[track][key] = v; }, { silent: true }); }, { rows });
      return h('div', { class: 'stack', style: { gap: '4px' } }, field(`kit-${key}-${track}`, label, ta), h('div', { class: 'row between' }, cnt, copyBtn(() => ta.value)));
    };

    return h('div', { class: 'stack', style: { gap: '22px' } },
      isGlobal() && G().cv && (G().cv.rules || []).length ? h('details', { class: 'acc' }, h('summary', null, 'CVs for roles outside India'),
        h('div', { class: 'acc-body' }, h('ul', { class: 'dots' }, G().cv.rules.map((r) => h('li', null, h('b', null, r.rule), ' — ', r.detail))))) : null,
      h('div', { class: 'card soft' },
        h('b', null, 'Choose the version for this application'),
        h('div', { class: 'chips', role: 'radiogroup' }, CV.TRACKS.map((k) => h('button', { type: 'button', class: 'chip', role: 'radio', 'aria-checked': String(track === k), 'aria-pressed': String(track === k), onclick: () => CC.update((s) => { s.cv.track = k; }) }, T[k].label))),
        h('p', { class: 'small muted' }, T[track].use)),
      h('div', { class: 'split' },
        h('div', { class: 'stack', style: { gap: '14px' } },
          missingBox,
          recentEditor,
          contactEd,
          textBlock('headline', 'Headline (under your name)', 2, 140),
          textBlock('summary', 'Professional summary', 6, 700),
          textBlock('skills', 'Core skills (comma separated)', 4),
          numbers,
          h('div', { class: 'stack', style: { gap: '0' } }, h('b', { style: { marginBottom: '8px' } }, 'Experience'), editorJobs),
          field('cv-certs', 'Training & certifications (one per line)', textArea('cv-certs', st.certs != null ? st.certs : D.cv.certs, (v) => quiet((s) => { s.cv.certs = v; }), { rows: 3 }), 'Add courses as you finish them. Leave blank to hide the section.'),
          h('details', { class: 'acc' }, h('summary', null, 'Why the CV looks like this'), h('div', { class: 'acc-body' }, h('ul', { class: 'dots' }, D.cv.rules.map((r) => h('li', null, h('b', null, r.rule), ' — ', r.detail)))))),
        h('div', { class: 'stack sticky-col', style: { gap: '12px' } },
          h('div', { class: 'row no-print' },
            btn('Download Word (.docx)', () => { const mm = CV.model(track); CC.saveFile(`${CV.fileBase(mm)}.docx`, new Blob([Docx.build(CV.toBlocks(mm), { title: `${mm.name} CV`, author: mm.name })], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })); }, 'primary', 'download'),
            CC.Remote.enabled ? btn('Save to Drive', () => { const mm = CV.model(track); CC.saveToDrive(`${CV.fileBase(mm)}.docx`, new Blob([Docx.build(CV.toBlocks(mm), { title: `${mm.name} CV`, author: mm.name })], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })); }, '', 'download') : null,
            copyBtn(() => CV.toText(CV.model(track)), 'Copy as text', ''),
            btn('Print / PDF', () => { document.body.classList.add('printing-cv'); try { window.print(); } catch { toast('Printing is not available here. Use the Word file instead.'); } setTimeout(() => document.body.classList.remove('printing-cv'), 800); }, 'ghost')),
          h('div', { class: 'print-root' }, previewBox),
          aiBox({
            id: 'ai-tailor', title: 'Ask Claude: tailor to a job description', desc: 'Paste a job description. You get the keywords you are missing and suggested edits that stay true to your experience. Nothing changes until you choose to apply it.',
            placeholder: 'Paste the job description here', buttonLabel: 'Tailor my CV',
            run: (sample, jd, signal) => sample.json(`You are a careful CV editor for an Indian job seeker applying to multinational companies. NEVER invent experience, employers, numbers, certifications or tools she has not listed. If a requirement is not in her CV, list it under "gaps" instead.\n\nHER CURRENT CV (version: ${T[track].label}):\n${CV.toText(CV.model(track)).slice(0, 9000)}\n\nJOB DESCRIPTION:\n${jd.slice(0, 9000)}\n\nReply with only JSON: {"fit":"strong"|"good"|"stretch","why":string (2 sentences, encouraging and honest),"missing_keywords":[string] (terms from the JD that she genuinely has experience with but the CV does not say),"gaps":[string] (requirements she does not show),"headline":string (max 140 chars),"summary":string (max 650 chars),"bullet_edits":[{"company":string,"bullet":string}] (3-6 rewritten or new bullets, truthful)}`, { signal }),
            render: (r) => h('div', { class: 'stack' },
              h('div', { class: 'row' }, h('span', { class: `pill ${r.fit === 'strong' ? 'good' : r.fit === 'good' ? 'same' : 'warn'}` }, `Fit: ${r.fit || '?'}`)),
              h('p', null, r.why || ''),
              (r.missing_keywords || []).length ? h('div', null, h('b', null, 'Add these words where true: '), (r.missing_keywords || []).join(', ')) : null,
              (r.gaps || []).length ? h('div', null, h('b', null, 'Gaps to address in the letter or interview: '), (r.gaps || []).join('; ')) : null,
              r.headline ? h('div', { class: 'stack' }, h('b', null, 'Suggested headline'), h('p', null, r.headline), btn('Use this headline', () => CC.update((s) => { s.cv.headline[track] = r.headline; }), 'small')) : null,
              r.summary ? h('div', { class: 'stack' }, h('b', null, 'Suggested summary'), h('p', null, r.summary), btn('Use this summary', () => CC.update((s) => { s.cv.summary[track] = r.summary; }), 'small')) : null,
              (r.bullet_edits || []).length ? h('div', { class: 'stack' }, h('b', null, 'Suggested bullets (copy into the right job)'), h('ul', { class: 'dots' }, r.bullet_edits.map((b) => h('li', null, h('span', { class: 'small faint' }, `${b.company}: `), b.bullet, ' ', h('button', { type: 'button', class: 'btn small ghost', onclick: () => CC.copy(b.bullet) }, 'Copy'))))) : null),
          }))),
      h('section', { class: 'section' },
        sectionHead('LinkedIn and Naukri profile kit', 'Same story, sized for each site. Edit here, then copy into the site.'),
        h('div', { class: 'grid two' },
          h('div', { class: 'card' }, h('h4', null, 'LinkedIn'), kitRow('linkedinHeadline', 'Headline', D.cv.limits.linkedinHeadline, 2), kitRow('linkedinAbout', 'About', D.cv.limits.linkedinAbout, 8)),
          h('div', { class: 'card' }, h('h4', null, 'Naukri'), kitRow('naukriHeadline', 'Resume headline', D.cv.limits.naukriHeadline, 3), kitRow('naukriSummary', 'Profile summary', D.cv.limits.naukriSummary, 7),
            h('div', { class: 'stack', style: { gap: '6px' } }, h('b', { class: 'small' }, 'Key skills to add'), h('div', { class: 'chips' }, (T[track].keySkills || []).map((k) => h('span', { class: 'chip static' }, k))), copyBtn(() => (T[track].keySkills || []).join(', '), 'Copy skills')))),
        h('div', { class: 'grid' }, D.cv.profileTips.map((t) => h('div', { class: 'card soft' }, h('b', null, t.title), h('p', { class: 'small muted' }, t.body))))));
  }

  // ----- Letters -----
  function letterContext() {
    const st = S();
    const f = st.letters.fields || {};
    const c = { ...D.cv.contact, ...(st.cv.contact || {}) };
    const T = D.cv.tracks[st.cv.track];
    const contact = (f.contact || '').trim();
    return {
      ...f,
      me: c.name, phone: c.phone, email: c.email, linkedin: c.linkedin || '', city: c.city,
      greeting: contact ? `Dear ${contact},` : 'Dear Hiring Team,',
      hi: contact ? `Hi ${contact.split(/\s+/)[0]},` : 'Hello,',
      pitch: T.pitch, headline: CV.trackText('headline', st.cv.track), strengths: T.strengths, trackPara: T.coverPara,
      today: CC.fmtLong(CC.iso()),
      signature: [c.name, c.phone, c.email, c.linkedin].map((x) => (x || '').trim()).filter(Boolean).join('\n'),
      availabilityLine: isGlobal() ? ((G().letters && G().letters.availabilityLine) || '') : (D.letters_availability_india || `I am based in ${c.city || 'Hyderabad'} and can join immediately.`),
    };
  }
  const LABELS = { company: 'Company', role: 'Role', contact: 'Name', source: 'where you saw it', why: 'why this company', mutual: 'mutual connection', topic: 'something you discussed', interviewDate: 'interview day', skill: 'a key requirement', newRole: 'the role you accepted' };
  function renderTemplate(tpl, ctx) {
    return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => {
      const v = ctx[k];
      return v != null && String(v).trim() !== '' ? String(v).trim() : `[${LABELS[k] || k}]`;
    });
  }
  function viewLetters() {
    const st = S().letters;
    const tpl = D.letters.templates.find((t) => t.id === st.tpl) || D.letters.templates[0];
    const outBox = h('div', { class: 'letter-out', id: 'letter-out', tabindex: '0', 'aria-live': 'polite' });
    const subjBox = h('div');
    const metaBox = h('div');
    let current = { subject: '', body: '' };
    const refresh = () => {
      const ctx = letterContext();
      current = { subject: tpl.subject ? renderTemplate(tpl.subject, ctx) : '', body: renderTemplate(tpl.body, ctx) };
      outBox.replaceChildren(CV.marked(current.body));
      subjBox.replaceChildren(current.subject ? h('div', { class: 'row between' }, h('div', null, h('span', { class: 'small faint' }, 'Subject: '), h('b', null, CV.marked(current.subject))), copyBtn(() => current.subject, 'Copy subject')) : '');
      const n = [...current.body].length;
      metaBox.replaceChildren(tpl.limit ? counter(current.body, tpl.limit) : h('div', { class: 'counter num' }, `${current.body.split(/\s+/).filter(Boolean).length} words`));
      if (tpl.limit && n > tpl.limit) metaBox.append(h('p', { class: 'small', style: { color: 'var(--rose)' } }, 'A little too long for this channel. Shorten the role title or a phrase, and it will fit.'));
    };
    const fields = tpl.uses.map((k) => {
      const meta = D.letters.fields[k] || { label: k };
      return field(`lf-${k}`, meta.label, textInput(`lf-${k}`, (st.fields || {})[k], (v) => { CC.update((s) => { s.letters.fields[k] = v; }, { silent: true }); refresh(); }, { placeholder: meta.placeholder || '' }), meta.hint);
    });
    refresh();
    const groups = [...new Set(D.letters.templates.map((t) => t.group))];
    const appsList = CC.apps();
    const save = () => {
      const f = S().letters.fields || {};
      const t = CC.iso();
      const msg = { id: CC.uid(), date: t, tpl: tpl.id, label: tpl.label, kind: tpl.kind, subject: current.subject, text: current.body };
      let app = appsList.find((a) => a.id === S().letters.appId);
      if (!app) {
        app = { id: CC.uid(), company: f.company || '(company)', role: f.role || '', platform: f.source || '', link: '', status: 'idea', contact: f.contact || '', region: region(), createdAt: Date.now(), messages: [], followups: [], cvTrack: S().cv.track };
      }
      app = { ...app, messages: [...(app.messages || []), msg] };
      if (tpl.logAs === 'applied' && (app.status === 'idea' || !app.status)) { app.status = 'applied'; app.appliedOn = t; app.followUpOn = CC.addDays(t, 7); app.cvTrack = S().cv.track; }
      if (tpl.logAs === 'followup') { app.followups = [...(app.followups || []), t]; app.followUpOn = CC.addDays(t, 7); }
      if (tpl.logAs === 'interview') { app.status = 'interview'; }
      if (tpl.logAs === 'closed') { app.status = 'closed'; }
      CC.upsertApp(app, { silent: true });
      CC.update((s) => { s.letters.appId = app.id; });
      toast(withMoment(`Saved to tracker: ${app.company}.`, tpl.logAs));
    };
    return h('div', { class: 'stack', style: { gap: '22px' } },
      h('div', { class: 'stack', style: { gap: '10px' } }, groups.map((g) => h('div', { class: 'stack', style: { gap: '6px' } },
        h('span', { class: 'eyebrow' }, g),
        h('div', { class: 'chips' }, D.letters.templates.filter((t) => t.group === g).map((t) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(t.id === tpl.id), onclick: () => CC.update((s) => { s.letters.tpl = t.id; }) }, t.label)))))),
      h('div', { class: 'split' },
        h('div', { class: 'stack', style: { gap: '12px' } },
          h('div', { class: 'note' }, h('b', null, tpl.label), h('span', { class: 'small' }, tpl.when)),
          field('letter-app', 'Which application is this for?', h('select', { id: 'letter-app', value: appsList.some((a) => a.id === st.appId) ? st.appId : '', onchange: (e) => {
            const a = appsList.find((x) => x.id === e.target.value);
            CC.update((s) => { s.letters.appId = e.target.value; if (a) s.letters.fields = { ...s.letters.fields, company: a.company, role: a.role, contact: a.contact || s.letters.fields.contact || '' }; });
          } }, h('option', { value: '' }, 'A new entry'), appsList.map((a) => h('option', { value: a.id }, `${a.company}${a.role ? ` — ${a.role}` : ''}`))), 'Saving links this message to that application in your tracker.'),
          h('div', { class: 'form-grid' }, fields),
          h('p', { class: 'small muted' }, `Uses your ${D.cv.tracks[S().cv.track].label} story. Change it in CV studio.`),
          tpl.tips && tpl.tips.length ? h('ul', { class: 'dots small' }, tpl.tips.map((t) => h('li', null, t))) : null),
        h('div', { class: 'stack sticky-col', style: { gap: '10px' } },
          subjBox, outBox, metaBox,
          h('div', { class: 'row' },
            copyBtn(() => current.body, 'Copy text', 'primary'),
            tpl.docx ? btn('Download Word', () => {
              const blocks = current.body.split(/\n{2,}/).map((p) => ({ type: 'p', text: p, after: 160 }));
              const f = S().letters.fields || {};
              CC.saveFile(`Cover_Letter_${slug(f.company || 'company')}.docx`, new Blob([Docx.build(blocks, { title: 'Cover letter', author: D.person.full })], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
            }, '', 'download') : null,
            tpl.docx && CC.Remote.enabled ? btn('Save to Drive', () => {
              const blocks = current.body.split(/\n{2,}/).map((p) => ({ type: 'p', text: p, after: 160 }));
              const f = S().letters.fields || {};
              CC.saveToDrive(`Cover_Letter_${slug(f.company || 'company')}.docx`, new Blob([Docx.build(blocks, { title: 'Cover letter', author: D.person.full })], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
            }, '', 'download') : null,
            btn('Save to tracker', save, '', 'check')),
          moment('beforeSend') ? h('p', { class: 'small muted theo-line' }, icon('lotus', 16), h('span', null, moment('beforeSend'))) : null,
          h('p', { class: 'small faint' }, 'Highlighted words in [brackets] still need your details.'),
          aiBox({
            id: 'ai-letter', title: 'Ask Claude: write it for this job', desc: 'Paste the job description. Claude drafts this message from your CV, honestly, in a warm professional tone. Edit before sending.',
            placeholder: 'Paste the job description (or recruiter message) here', buttonLabel: 'Draft it',
            run: (sample, jd, signal) => sample.text(`Write a ${tpl.label.toLowerCase()} for an Indian professional applying to a multinational company. Tone: warm, confident, plain English, no clichés, no exaggeration. NEVER invent experience, numbers or certifications not in her CV; where a detail is unknown, write it as [placeholder]. ${tpl.limit ? `Hard limit: ${tpl.limit} characters.` : 'Keep it under 300 words.'} If the role is a career change, connect her real experience to it honestly. Do not mention the two short recent roles unless the text explicitly asks why she is looking.\n\nFields she gave: ${JSON.stringify(S().letters.fields || {})}\n\nHER CV:\n${CV.toText(CV.model()).slice(0, 8000)}\n\nJOB DESCRIPTION / MESSAGE:\n${jd.slice(0, 8000)}\n\nReturn only the message text${tpl.subject ? ', with a first line "Subject: ..."' : ''}.`, { signal }),
            render: (text) => h('div', { class: 'stack' }, h('div', { class: 'letter-out' }, text), h('div', { class: 'row' }, copyBtn(text, 'Copy draft'))),
          }))));
  }

  // ---------- TRACKER ----------
  const STATUSES = [['idea', 'To apply'], ['applied', 'Applied'], ['interview', 'Interviewing'], ['offer', 'Offer'], ['closed', 'Closed']];
  const statusLabel = Object.fromEntries(STATUSES);
  function viewTracker() {
    const filter = ui('tf', 'open');
    const all = CC.apps().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const today = CC.iso();
    const due = (a) => a.status === 'applied' && a.followUpOn && a.followUpOn <= today;
    const counts = Object.fromEntries(STATUSES.map(([k]) => [k, all.filter((a) => a.status === k).length]));
    const list = all.filter((a) => filter === 'all' || (filter === 'open' ? a.status !== 'closed' : filter === 'due' ? due(a) : a.status === filter));
    const editing = ui('editApp', '');
    const msgs = all.flatMap((a) => (a.messages || []).map((m) => ({ ...m, app: a }))).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
    const pipe = (key, label, n) => h('button', { type: 'button', class: 'pipe', 'aria-pressed': String(filter === key), onclick: () => setUi('tf', filter === key ? 'open' : key) }, h('b', null, String(n)), h('span', null, label));

    return h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('span', { class: 'eyebrow' }, 'Tracker'), h('h1', null, 'Everything you’ve sent'),
        h('p', { class: 'lede' }, 'One place for every application, follow-up and message. The tool reminds you a week after you apply.')),
      epigraph('tracker'),
      h('div', { class: 'pipeline' },
        STATUSES.map(([k, l]) => pipe(k, l, counts[k])),
        pipe('due', 'Follow-up due', all.filter(due).length)),
      h('div', { class: 'row between' },
        h('div', { class: 'row' }, h('span', { class: 'small faint' }, filter === 'open' ? 'Showing open applications' : filter === 'all' ? 'Showing everything' : `Showing: ${filter === 'due' ? 'follow-up due' : statusLabel[filter]}`),
          filter !== 'all' ? btn('Show all', () => setUi('tf', 'all'), 'small ghost') : null),
        btn('Add application', () => { const id = CC.uid(); CC.upsertApp({ id, company: '', role: '', platform: '', status: 'idea', region: region(), createdAt: Date.now(), messages: [], followups: [] }, { silent: true }); setUi('editApp', id); }, 'primary', 'plus')),
      list.length ? h('div', { class: 'grid two' }, list.map((a) => (editing === a.id ? appEditor(a) : appCard(a, due(a)))))
        : h('div', { class: 'card soft' }, h('b', null, all.length ? 'Nothing in this view.' : 'Your tracker is empty.'), h('p', { class: 'small muted' }, 'Add companies from Explore, or save a letter from Letters, and they appear here.')),
      h('section', { class: 'section' },
        sectionHead('Messages sent', `${msgs.length} saved. Every cover letter, email and note you saved, newest first.`, msgs.length ? copyBtn(() => msgs.map((m) => `=== ${m.date} · ${m.app.company} · ${m.label} ===\n${m.subject ? `Subject: ${m.subject}\n` : ''}${m.text}`).join('\n\n'), 'Copy all', 'small') : null),
        msgs.length ? h('div', { class: 'stack', style: { gap: '0' } }, msgs.slice(0, 60).map((m) => h('details', { class: 'acc' },
          h('summary', null, h('span', null, `${m.app.company} · ${m.label}`), h('span', { class: 'small faint num', style: { fontWeight: 400 } }, CC.fmt(m.date))),
          h('div', { class: 'acc-body' }, m.subject ? h('p', null, h('b', null, 'Subject: '), m.subject) : null, h('div', { class: 'letter-out' }, m.text), h('div', { class: 'row' }, copyBtn(m.text)))))) : h('p', { class: 'small faint' }, 'Saved messages appear here.')),
      dataPanel());
  }
  function appCard(a, isDue) {
    return h('article', { class: 'card app-card', 'data-status': a.status },
      h('div', { class: 'rc-top' }, h('div', { class: 'stack', style: { gap: '2px' } }, h('h4', null, a.company || '(no company yet)'), h('span', { class: 'small muted' }, a.role || '')),
        h('span', { class: `pill ${a.status === 'offer' ? 'good' : a.status === 'interview' ? 'new' : a.status === 'applied' ? 'adjacent' : 'plain'}` }, statusLabel[a.status] || a.status)),
      h('div', { class: 'row small muted' },
        a.region === 'global' ? h('span', { class: 'pill adjacent' }, 'Global') : null,
        a.platform ? h('span', null, a.platform) : null,
        a.appliedOn ? h('span', { class: 'num' }, `Applied ${CC.fmt(a.appliedOn)}`) : a.past ? h('span', null, 'Applied earlier') : null,
        a.status === 'applied' && a.followUpOn ? h('span', { class: `num${isDue ? ' due' : ''}` }, isDue ? 'Follow-up due' : `Follow up ${CC.fmt(a.followUpOn)}`) : null,
        (a.messages || []).length ? h('span', null, `${a.messages.length} message${a.messages.length > 1 ? 's' : ''}`) : null),
      a.notes ? h('p', { class: 'small' }, a.notes) : null,
      a.past && a.status === 'applied' && D.history ? h('div', { class: 'note' }, h('span', { class: 'small' }, D.history.pastNext),
        h('div', { class: 'row' }, btn('Write to someone there', () => { CC.update((s) => { s.letters.tpl = ['after-portal', 'recruiter-inmail'].find((id) => D.letters.templates.some((t) => t.id === id)) || s.letters.tpl; s.letters.appId = a.id; s.letters.fields = { ...s.letters.fields, company: a.company, role: a.role || '', contact: '' }; s.ui.apply = 'letters'; }); go('letters'); }, 'small primary'))) : null,
      h('div', { class: 'row' },
        h('select', { id: `st-${a.id}`, 'aria-label': 'Status', value: a.status, style: { width: 'auto' }, onchange: (e) => {
          const next = { ...a, status: e.target.value };
          if (next.status === 'applied' && !next.appliedOn) { next.appliedOn = CC.iso(); next.followUpOn = CC.addDays(next.appliedOn, 7); }
          CC.upsertApp(next);
          if (moment(next.status)) toast(moment(next.status));
          else if (next.status === 'offer') toast('An offer. Take a breath and enjoy this.');
        } }, STATUSES.map(([k, l]) => h('option', { value: k }, l))),
        a.status === 'applied' ? btn('Followed up', () => { CC.upsertApp({ ...a, followups: [...(a.followups || []), CC.iso()], followUpOn: CC.addDays(CC.iso(), 7) }); toast(withMoment('Logged. Next nudge in a week.', 'followup')); }, 'small') : null,
        btn('Edit', () => setUi('editApp', a.id), 'small ghost'),
        a.link ? ext(a.link, 'Posting', 'small') : null));
  }
  function appEditor(a) {
    const draft = { ...a };
    const inp = (k, label, attrs = {}) => field(`ae-${a.id}-${k}`, label, h('input', { id: `ae-${a.id}-${k}`, type: attrs.type || 'text', value: draft[k] || '', placeholder: attrs.placeholder || '', oninput: (e) => { draft[k] = e.target.value; } }));
    const confirmBox = h('div');
    return h('article', { class: 'card raised' },
      h('h4', null, a.company ? `Edit: ${a.company}` : 'New application'),
      h('div', { class: 'form-grid' },
        inp('company', 'Company'), inp('role', 'Role'),
        field(`ae-${a.id}-platform`, 'Where', h('select', { id: `ae-${a.id}-platform`, value: draft.platform || '', onchange: (e) => { draft.platform = e.target.value; } }, ['', 'Naukri', 'LinkedIn', 'Indeed', 'foundit', 'Instahyre', 'Company site', 'Referral', 'Recruiter', 'Email', 'Other'].map((p) => h('option', { value: p }, p || 'Choose…')))),
        inp('link', 'Link to posting', { type: 'url', placeholder: 'https://' }),
        inp('appliedOn', 'Applied on', { type: 'date' }), inp('followUpOn', 'Follow up on', { type: 'date' }),
        inp('contact', 'Contact person'), inp('contactInfo', 'Contact email / LinkedIn')),
      field(`ae-${a.id}-notes`, 'Notes', h('textarea', { id: `ae-${a.id}-notes`, rows: 3, value: draft.notes || '', oninput: (e) => { draft.notes = e.target.value; } })),
      h('div', { class: 'row' },
        btn('Save', () => {
          if (draft.appliedOn && !draft.followUpOn) draft.followUpOn = CC.addDays(draft.appliedOn, 7);
          if (draft.appliedOn && draft.status === 'idea') draft.status = 'applied';
          CC.upsertApp(draft, { silent: true }); setUi('editApp', ''); toast('Saved');
        }, 'primary'),
        btn('Cancel', () => { if (!a.company && !a.role && !(a.messages || []).length) CC.deleteApp(a.id); setUi('editApp', ''); }, 'ghost'),
        btn('Delete', () => confirmBox.replaceChildren(h('div', { class: 'note care' }, h('span', null, 'Delete this application and its saved messages?'),
          h('div', { class: 'row' }, btn('Yes, delete', () => { CC.deleteApp(a.id); setUi('editApp', ''); toast('Deleted'); }, 'small danger'), btn('Keep it', () => confirmBox.replaceChildren(), 'small ghost')))), 'ghost danger', 'trash')),
      confirmBox);
  }

  function dataPanel() {
    const st = CC.saveStatus;
    const where = st.where === 'sheet' || st.where === 'syncing' ? 'Everything is saved to your own Google Sheet. A copy is kept on this device for speed; an iPhone may clear that copy, and the Sheet still has everything. Updates to this page never touch your data.'
      : st.where === 'locked' ? 'This page needs its private link (the one with ?key=) to reach your Sheet.'
      : st.where === 'device' ? (CC.Remote.available ? 'Saved on this device. It will sync to your Google Sheet when the connection returns.' : 'Saved in this browser on this device. Open the page from its Apps Script link to keep everything in your Google Sheet.')
      : 'This browser is not saving. Download a backup before you close the page.';
    const sheetUrl = CC.Remote.meta && CC.Remote.meta.sheetUrl;
    const fileIn = h('input', { type: 'file', id: 'import-file', accept: '.json,application/json', hidden: true });
    const confirmBox = h('div');
    fileIn.addEventListener('change', async () => {
      const file = fileIn.files && fileIn.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await CC.readFile(file));
        if (!data || typeof data !== 'object' || !data.cv) throw new Error('bad');
        confirmBox.replaceChildren(h('div', { class: 'note warm' }, h('span', null, `Replace what is here with the backup from ${file.name}? (${(data.apps || []).filter((x) => !x.deleted).length} applications)`),
          h('div', { class: 'row' }, btn('Yes, restore it', () => { CC.replaceAll(data); toast('Backup restored'); }, 'small primary'), btn('Cancel', () => confirmBox.replaceChildren(), 'small ghost'))));
      } catch { toast('That file isn’t a Career Compass backup.'); }
      fileIn.value = '';
    });
    const csv = () => {
      const rows = [['Company', 'Role', 'Status', 'Where', 'Applied on', 'Follow up on', 'Follow-ups sent', 'Contact', 'Contact info', 'Link', 'CV version', 'Messages', 'Notes']];
      for (const a of CC.apps()) rows.push([a.company, a.role, statusLabel[a.status] || a.status, a.platform, a.appliedOn, a.followUpOn, (a.followups || []).length, a.contact, a.contactInfo, a.link, a.cvTrack ? D.cv.tracks[a.cvTrack].label : '', (a.messages || []).length, a.notes]);
      return CC.toCSV(rows);
    };
    return h('section', { class: 'section', id: 'your-data' },
      sectionHead('Your data', where),
      h('div', { class: 'row' },
        btn('Download tracker (.csv)', () => CC.saveFile(`job-tracker-${CC.iso()}.csv`, new Blob([`\ufeff${csv()}`], { type: 'text/csv' })), 'small', 'download'),
        btn('Download full backup (.json)', () => CC.saveFile(`career-compass-backup-${CC.iso()}.json`, new Blob([JSON.stringify(CC.state, null, 1)], { type: 'application/json' })), 'small', 'download'),
        CC.Remote.enabled ? btn('Save backup to Drive', () => CC.saveToDrive(`career-compass-backup-${CC.iso()}.json`, new Blob([JSON.stringify(CC.state, null, 1)], { type: 'application/json' })), 'small', 'download') : null,
        btn('Restore from backup', () => fileIn.click(), 'small ghost'), fileIn,
        sheetUrl ? ext(sheetUrl, 'Open my Google Sheet', 'btn small ghost') : null),
      confirmBox,
      h('p', { class: 'small faint' }, CC.Remote.enabled ? 'Your Sheet is your backup. The Applications and Messages tabs are readable tables, so you can open them any time.' : 'A weekly backup is a kind thing to do for your future self.'));
  }

  // ---------- PREPARE ----------
  function viewPrepare() {
    const tab = ui('prep', 'interview');
    return h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('span', { class: 'eyebrow' }, 'Prepare'), h('h1', null, tab === 'offer' ? 'Choosing a steady employer' : 'Interviews, calmly'),
        h('p', { class: 'lede' }, tab === 'offer' ? D.interview.offerIntro : D.interview.intro)),
      subtabs('prep', [['interview', 'Interview'], ['offer', 'Stability & offers']], 'interview'),
      epigraph(tab === 'offer' ? 'offer' : 'interview'),
      tab === 'offer' ? viewOffer() : viewInterview());
  }
  function viewInterview() {
    const track = S().cv.track;
    const qs = isGlobal() && G().interview && Array.isArray(G().interview.questions) ? [...D.interview.questions, ...G().interview.questions] : D.interview.questions;
    const pick = ui('practiceQ', 0) % qs.length;
    const timerEl = h('span', { class: 'num', style: { fontFamily: 'var(--font-display)', fontSize: '1.6rem' } }, '2:00');
    let tm = null;
    let left = 120;
    const startBtn = btn('Start 2-minute timer', () => {
      if (tm) { clearInterval(tm); tm = null; startBtn.lastChild.textContent = 'Start 2-minute timer'; return; }
      left = 120; startBtn.lastChild.textContent = 'Stop';
      tm = setInterval(() => {
        if (!timerEl.isConnected) { clearInterval(tm); return; }
        left -= 1;
        timerEl.textContent = `${Math.floor(Math.max(left, 0) / 60)}:${String(Math.max(left, 0) % 60).padStart(2, '0')}`;
        if (left <= 0) { clearInterval(tm); tm = null; startBtn.lastChild.textContent = 'Start 2-minute timer'; toast('Time. How did that feel?'); }
      }, 1000);
    }, 'small');
    const q = qs[pick];
    return h('div', { class: 'stack', style: { gap: '26px' } },
      h('section', { class: 'section' }, sectionHead('Tell me about yourself', `Your ${D.cv.tracks[track].label} version. About 60–90 seconds when spoken.`),
        h('div', { class: 'card' }, h('p', { style: { whiteSpace: 'pre-wrap' } }, CV.marked(D.interview.intro_answers[track])), h('div', { class: 'row' }, copyBtn(D.interview.intro_answers[track])),
          h('div', { class: 'chips' }, CV.TRACKS.map((k) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(track === k), onclick: () => CC.update((s) => { s.cv.track = k; }) }, D.cv.tracks[k].label))))),
      h('section', { class: 'section' }, sectionHead('Practise one question', 'Say it out loud. Two minutes is plenty.'),
        h('div', { class: 'card raised' },
          theoOn() ? h('div', { class: 'note warm' }, h('b', null, 'Before you begin'), h('span', { class: 'small' }, TH().interviewCentering)) : null,
          h('span', { class: 'eyebrow' }, q.group), h('h3', null, q.q), h('div', { class: 'row' }, timerEl, startBtn, btn('Another question', () => setUi('practiceQ', pick + 1 + (dayOfYear() % 3)), 'small ghost')),
          h('details', { class: 'acc' }, h('summary', null, 'See a suggested answer'), h('div', { class: 'acc-body' }, h('p', { class: 'small muted' }, q.why), h('p', { style: { whiteSpace: 'pre-wrap' } }, CV.marked(q.answer)))),
          aiBox({
            id: 'ai-practice', title: 'Ask Claude for feedback on your answer', desc: 'Type (or paste a voice-note transcript of) your answer. You get kind, specific feedback and a tighter version.',
            placeholder: 'Your answer', buttonLabel: 'Get feedback',
            run: (sample, ans, signal) => sample.json(`You are a warm, experienced interview coach in India helping a biomedical engineer with 13 years in diagnostic ultrasound across field service, clinical applications and product specialist roles, who is looking for a stable MNC role. Question: "${q.q}". Her answer is below. Be kind and specific. Never invent facts.\nReply with only JSON: {"went_well":[string] (2-3),"improve":[string] (2-3, concrete),"tighter_answer":string (under 160 words, first person, using only facts from her answer and this background: ${D.interview.coachBackground})}\n\nANSWER:\n${ans.slice(0, 6000)}`, { signal }),
            render: (r) => h('div', { class: 'stack' },
              h('div', null, h('b', null, 'What went well'), h('ul', { class: 'dots' }, (r.went_well || []).map((x) => h('li', null, String(x))))),
              h('div', null, h('b', null, 'To make it stronger'), h('ul', { class: 'dots' }, (r.improve || []).map((x) => h('li', null, String(x))))),
              r.tighter_answer ? h('div', null, h('b', null, 'A tighter version'), h('p', { style: { whiteSpace: 'pre-wrap' } }, r.tighter_answer)) : null),
          }))),
      h('section', { class: 'section' }, sectionHead('Questions to expect', 'Including the ones that feel tender. Each has a calm, true answer.'),
        ['Tender', 'Common', 'Role-specific'].map((g) => {
          const items = qs.filter((x) => x.group === g);
          return items.length ? h('div', { class: 'stack', style: { gap: '0' } }, h('span', { class: 'eyebrow', style: { margin: '6px 0' } }, g), items.map((x) => h('details', { class: 'acc' }, h('summary', null, x.q), h('div', { class: 'acc-body' }, h('p', { class: 'small muted' }, x.why), h('p', { style: { whiteSpace: 'pre-wrap' } }, CV.marked(x.answer)), h('div', { class: 'row' }, copyBtn(x.answer)))))) : null;
        })),
      h('section', { class: 'section' }, sectionHead('Your stories', 'Real moments from your career, shaped as Situation → Action → Result. Copy one into your notes and fill in the highlighted parts.'),
        h('div', { class: 'grid two' }, D.interview.stories.map((s) => h('div', { class: 'card' }, h('h4', null, s.title), h('p', { class: 'small faint' }, `Use for: ${s.use}`),
          h('dl', { class: 'stack', style: { gap: '6px', margin: 0 } }, [['Situation', s.situation], ['What you did', s.action], ['Result', s.result]].map(([k, v]) => h('div', { class: 'kv' }, h('dt', null, k), h('dd', null, CV.marked(v))))),
          h('div', { class: 'row' }, copyBtn(`${s.title}\n\nSituation: ${s.situation}\n\nWhat I did: ${s.action}\n\nResult: ${s.result}`, 'Copy story')))))),
      h('section', { class: 'section' }, sectionHead('Salary conversations', 'Know your number before they ask.'),
        h('ul', { class: 'dots' }, (isGlobal() && G().interview && G().interview.salary ? G().interview.salary : D.interview.salary).map((x) => h('li', null, x)))));
  }
  function viewOffer() {
    return h('div', { class: 'stack', style: { gap: '26px' } },
      h('section', { class: 'section' }, sectionHead('Questions that reveal stability', 'Ask these in the later rounds. Good employers are glad you asked.'),
        h('div', { class: 'card' }, h('ol', { style: { margin: 0, paddingLeft: '1.2em', display: 'grid', gap: '8px' } }, D.interview.ask.map((x) => h('li', null, x))), copyBtn(D.interview.ask.join('\n'), 'Copy list'))),
      h('section', { class: 'section' }, sectionHead('Signals to check before you say yes', 'A few quick checks that help you choose a steady employer.'),
        h('div', { class: 'grid' }, D.interview.stability.map((s) => h('div', { class: 'card soft' }, h('b', null, s.signal), h('p', { class: 'small muted' }, s.how))))),
      h('section', { class: 'section' }, sectionHead('Offer letter checklist', 'Read it slowly, with tea.'),
        h('ul', { class: 'tasks' }, D.interview.offer.map((x, i) => {
          const key = `offer-${i}`;
          const done = !!(S().firstWeek[key]);
          return h('li', { class: done ? 'done' : '' }, h('input', { type: 'checkbox', id: key, checked: done, 'aria-label': x, style: { width: '20px', height: '20px', marginTop: '3px', accentColor: 'var(--primary)', flex: 'none' }, onchange: (e) => CC.update((s) => { s.firstWeek[key] = e.target.checked; }) }), h('span', { class: 't-title', style: { fontWeight: 500 } }, x));
        }))));
  }

  // ---------- CARE ----------
  let breathTimer = null;
  let seedTimer = null;
  /** Sit with today's seed thought: a quiet countdown of 3, 5 or 10 minutes. */
  function seedSitting() {
    const mins = ui('seedMins', 3);
    const clock = h('span', { class: 'num seed-clock', 'aria-live': 'off' }, `${mins}:00`);
    let left = mins * 60;
    const show = () => { clock.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; };
    const sit = btn('Sit quietly', () => {
      if (seedTimer) { clearInterval(seedTimer); seedTimer = null; sit.lastChild.textContent = 'Sit quietly'; left = mins * 60; show(); return; }
      sit.lastChild.textContent = 'Stop';
      seedTimer = setInterval(() => {
        if (!clock.isConnected) { clearInterval(seedTimer); seedTimer = null; return; }
        left -= 1; show();
        if (left <= 0) { clearInterval(seedTimer); seedTimer = null; sit.lastChild.textContent = 'Sit quietly'; left = mins * 60; toast('Time. Carry one line of it with you.'); }
      }, 1000);
    }, 'small primary', 'lotus');
    return h('div', { class: 'stack', style: { gap: '8px' } },
      h('p', { class: 'small' }, TH().care.seedNote),
      h('div', { class: 'row' }, clock, sit,
        h('div', { class: 'chips', role: 'group', 'aria-label': 'Minutes' }, [3, 5, 10].map((m) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(m === mins), onclick: () => { clearInterval(seedTimer); seedTimer = null; setUi('seedMins', m); } }, `${m} min`)))));
  }
  function theoToggle() {
    if (!TH()) return null;
    const on = theoOn();
    return h('div', { class: `note ${on ? '' : 'warm'} theo-toggle` },
      h('div', { class: 'row between' }, h('b', null, icon('lotus', 18), ` ${TH().label}: ${on ? 'on' : 'off'}`), btn(on ? 'Turn off' : 'Turn on', () => setTheo(!on), 'small')),
      h('span', { class: 'small' }, on ? TH().toggleOn : TH().toggleOff));
  }
  function theoCare() {
    const TC = TH().care;
    const r = region();
    return [
      h('section', { class: 'section', id: 'theosophy' }, sectionHead('Theosophy in your day', TC.intro),
        h('div', { class: 'grid two' },
          seedCard(seedSitting()),
          h('div', { class: 'card prayer' }, h('h3', null, TC.prayer.title),
            h('div', { class: 'prayer-lines' }, TC.prayer.lines.map((l) => h('span', null, l))),
            h('p', { class: 'small faint' }, TC.prayer.source), h('p', { class: 'small muted' }, TC.prayer.note))),
        h('div', { class: 'card soft' }, h('h3', null, TC.objects.title), h('p', { class: 'small muted' }, TC.objects.intro),
          h('ol', { class: 'objects' }, TC.objects.items.map((o) => h('li', null, h('span', { class: 'obj' }, o.object), h('span', { class: 'small muted' }, o.forYou)))),
          h('p', { class: 'small faint' }, TC.objects.source)),
        h('div', { class: 'grid' }, TC.practices.map((x) => h('div', { class: 'card soft' }, h('div', { class: 'row between' }, h('b', null, x.name), h('span', { class: 'pill plain num' }, `${x.minutes} min`)), h('p', { class: 'small' }, x.how), h('p', { class: 'small faint' }, x.source))))),
      h('section', { class: 'section' }, sectionHead('Through a theosophical lens', 'The same heavy thoughts, met with the teachings you study.'),
        h('div', { class: 'stack', style: { gap: '0' } }, TC.reframes.map((x) => h('details', { class: 'acc' }, h('summary', null, `“${x.thought}”`),
          h('div', { class: 'acc-body' }, h('p', null, x.reframe), x.quote ? h('figure', { class: 'epigraph small-ep' }, h('blockquote', null, x.quote), x.source ? h('figcaption', null, x.source) : null) : null))))),
      h('section', { class: 'section' }, sectionHead(TC.stairs.title, TC.stairs.note),
        h('details', { class: 'acc stairs' }, h('summary', null, 'Read it slowly'), h('div', { class: 'acc-body' }, h('p', { class: 'stairs-text' }, TC.stairs.text), h('p', { class: 'small faint' }, TC.stairs.source)))),
      h('section', { class: 'section' }, sectionHead('Study and fellowship', 'Free texts to read in small doses, and places to find fellow students.'),
        h('div', { class: 'grid' },
          TC.reading.map((b) => h('div', { class: 'card soft' }, h('b', null, b.title), h('span', { class: 'small faint' }, b.author), h('p', { class: 'small' }, b.why), b.url ? ext(b.url, 'Read free online', 'small') : null)),
          TC.community.filter((c) => c.region === 'both' || c.region === r).map((c) => h('div', { class: 'card' }, h('b', null, c.name), h('p', { class: 'small' }, c.what), c.url ? ext(c.url, 'Website', 'small') : null)))),
    ];
  }
  function viewCare() {
    const C = D.care;
    const t = CC.iso();
    const prompt = C.prompts[dayOfYear() % C.prompts.length];
    const ring = h('div', { class: 'ring' });
    const label = h('div', { class: 'label' }, 'Ready', h('small', null, 'Box breathing, 4 counts each'));
    const phases = [['Breathe in', 1, 0.55], ['Hold', 1, 0.55], ['Breathe out', 0.55, 0.22], ['Hold', 0.55, 0.22]];
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = false;
    const bBtn = btn('Start', () => {
      running = !running;
      bBtn.lastChild.textContent = running ? 'Stop' : 'Start';
      clearInterval(breathTimer);
      if (!running) { label.firstChild.textContent = 'Ready'; ring.style.transform = 'scale(0.55)'; return; }
      let i = 0;
      let count = 4;
      const step = () => {
        if (!ring.isConnected) { clearInterval(breathTimer); return; }
        const [name, scale, op] = phases[i % 4];
        label.firstChild.textContent = `${name} · ${count}`;
        if (count === 4 && !reduce) { ring.style.transform = `scale(${scale})`; ring.style.opacity = String(op + 0.1); }
        count -= 1;
        if (count === 0) { count = 4; i += 1; }
      };
      step();
      breathTimer = setInterval(step, 1000);
    }, 'primary');
    const journal = S().journal[t] || '';
    const tc = theoOn() ? theoCare() : null;
    return h('div', { class: 'view' },
      h('div', { class: 'view-head' }, h('span', { class: 'eyebrow' }, 'Care'), h('h1', null, 'Look after the person doing the searching'),
        h('p', { class: 'lede' }, C.intro)),
      theoToggle(),
      epigraph('care'),
      h('div', { class: 'grid two' },
        h('section', { class: 'card' }, h('h3', null, 'Two minutes of calm'), h('div', { class: 'breath-wrap' }, h('div', { class: 'breath', 'aria-live': 'polite' }, ring, label), bBtn),
          h('p', { class: 'small muted' }, C.breathNote)),
        h('section', { class: 'card' }, h('h3', null, 'Today’s page'), h('p', { style: { fontFamily: 'var(--font-display)', fontSize: '1.15rem' } }, prompt),
          h('textarea', { id: 'journal-today', rows: 6, value: journal, placeholder: 'Write as much or as little as you like. Only you can see this.', oninput: (e) => CC.update((s) => { s.journal[t] = e.target.value; }, { silent: true }) }),
          h('p', { class: 'small faint' }, 'Saved privately as you type.'))),
      tc ? tc[0] : null,
      h('section', { class: 'section' }, sectionHead('When your mind says…', 'Gentle, realistic answers to the thoughts that visit during a job search.'),
        h('div', { class: 'stack', style: { gap: '0' } }, C.reframes.map((r) => h('details', { class: 'acc' }, h('summary', null, `“${r.thought}”`), h('div', { class: 'acc-body' }, h('p', null, r.reframe)))))),
      tc ? tc.slice(1, 3) : null,
      h('section', { class: 'section' }, sectionHead('Small practices that help', 'Each takes five minutes or less.'),
        h('div', { class: 'grid' }, C.practices.map((p) => h('div', { class: 'card soft' }, h('div', { class: 'row between' }, h('b', null, p.name), h('span', { class: 'pill plain num' }, `${p.minutes} min`)), h('p', { class: 'small' }, p.how), h('p', { class: 'small faint' }, p.evidence))))),
      h('section', { class: 'section' }, sectionHead('A sustainable week', 'Searching is work. Work needs rest.'),
        h('ul', { class: 'dots' }, C.rhythm.map((x) => h('li', null, x)))),
      h('section', { class: 'section' }, sectionHead('Things that are true about you', null),
        h('div', { class: 'grid' }, C.affirmations.map((a) => h('div', { class: 'card soft' }, h('p', { style: { fontFamily: 'var(--font-display)', fontSize: '1.1rem' } }, a))))),
      tc ? tc.slice(3) : null,
      h('section', { class: 'section' }, sectionHead('If it gets heavy', C.helpIntro),
        theoOn() ? h('div', { class: 'note care' }, h('span', null, TH().care.balance)) : null,
        h('div', { class: 'grid' }, C.helplines.map((x) => h('div', { class: 'card' }, h('b', null, x.name),
          h('div', { class: 'row' }, h('a', { href: `tel:${x.number.replace(/[^+\d]/g, '')}`, target: '_top', class: 'num', style: { fontSize: '1.25rem', fontWeight: 700 } }, x.number), copyBtn(x.number, 'Copy number')),
          h('p', { class: 'small muted' }, [x.hours, x.languages].filter(Boolean).join(' · ')), x.url ? ext(x.url, 'Website', 'small') : null)))));
  }

  // ---------- ROUTER ----------
  const ROUTES = {
    today: ['today'], explore: ['explore'], paths: ['explore', 'explore', 'paths'], companies: ['explore', 'explore', 'companies'], abroad: ['explore', 'explore', 'abroad'],
    apply: ['apply'], search: ['apply', 'apply', 'search'], cv: ['apply', 'apply', 'cv'], letters: ['apply', 'apply', 'letters'],
    tracker: ['tracker'], prepare: ['prepare'], interview: ['prepare', 'prep', 'interview'], offer: ['prepare', 'prep', 'offer'], care: ['care'], data: ['tracker'],
  };
  const VIEWS = { today: viewToday, explore: viewExplore, apply: viewApply, tracker: viewTracker, prepare: viewPrepare, care: viewCare };
  let currentView = 'today';
  const tokenFromHash = () => { try { return (location.hash || '').slice(1); } catch { return ''; } };
  function route(token, initial) {
    const t = ROUTES[token] ? token : 'today';
    const r = ROUTES[t];
    const prev = currentView;
    currentView = r[0];
    if (r[1] && ui(r[1], null) !== r[2]) CC.update((s) => { s.ui = s.ui || {}; s.ui[r[1]] = r[2]; }, { silent: true });
    render();
    if (!initial && prev !== currentView) window.scrollTo({ top: 0 });
    if (t === 'data') setTimeout(() => { const el = document.getElementById('your-data'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);
  }
  /** In-app navigation. Works inside the Apps Script iframe, where the page cannot rely on the top URL. */
  function go(token) {
    route(token);
    try { if (tokenFromHash() !== token) history.pushState(null, '', `#${token}`); } catch { /* sandboxed frame: navigation still works */ }
  }
  function render() {
    const active = document.activeElement && document.activeElement.id;
    const sel = active && document.activeElement.selectionStart;
    clearInterval(breathTimer);
    clearInterval(seedTimer); seedTimer = null;
    main().replaceChildren(VIEWS[currentView]());
    document.querySelectorAll('[data-nav]').forEach((a) => a.setAttribute('aria-current', a.dataset.nav === currentView ? 'page' : 'false'));
    if (active) {
      const el = document.getElementById(active);
      if (el) { el.focus({ preventScroll: true }); try { if (sel != null && el.setSelectionRange) el.setSelectionRange(sel, sel); } catch { /* not a text field */ } }
    }
    renderStatus();
    renderRegion();
    renderMotto();
  }
  function renderMotto() {
    const el = document.getElementById('cc-motto');
    if (!el) return;
    el.hidden = !theoOn();
    if (theoOn()) { const m = TH().motto; el.textContent = `${m.text} · ${m.sanskrit}`; el.title = m.source; }
  }
  const STATUS_TEXT = { sheet: 'Saved to your Sheet', syncing: 'Saving…', locked: 'Private link needed', none: 'Not saving — back up' };
  function renderStatus() {
    const pill = document.getElementById('save-pill');
    if (!pill) return;
    const st = CC.saveStatus;
    pill.dataset.state = st.ok ? 'ok' : 'warn';
    pill.querySelector('.txt').textContent = st.where === 'device' ? (st.ok ? 'Saved on this device' : 'Offline · saved on device') : STATUS_TEXT[st.where] || 'Saved on this device';
    pill.title = st.where === 'sheet' ? 'Everything is saved to your Google Sheet' : st.where === 'device' ? 'Saved in this browser. It will sync to your Sheet when the connection returns.' : pill.querySelector('.txt').textContent;
  }
  function renderRegion() {
    const r = region();
    document.querySelectorAll('[data-region]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === r)));
    const sub = document.getElementById('brand-sub');
    if (sub) sub.textContent = `for ${D.person.full} · ${r === 'global' ? 'Global' : 'India'}`;
  }

  function buildNav() {
    const items = [['today', 'Today', 'sun'], ['explore', 'Explore', 'compass'], ['apply', 'Apply', 'send'], ['tracker', 'Tracker', 'list'], ['prepare', 'Prepare', 'chat'], ['care', 'Care', 'lotus']];
    const nav = document.getElementById('nav');
    const bar = document.getElementById('tabbar');
    nav.replaceChildren(...items.map(([id, label]) => h('a', { href: `#${id}`, 'data-nav': id }, label)));
    bar.replaceChildren(...items.map(([id, label, ic]) => h('a', { href: `#${id}`, 'data-nav': id }, icon(ic, 22), label)));
  }

  function start() {
    CC.load(defaultState);
    buildNav();
    document.getElementById('save-pill').addEventListener('click', () => go('data'));
    document.querySelectorAll('[data-region]').forEach((b) => b.addEventListener('click', () => {
      const next = b.dataset.region;
      if (next === region()) return;
      CC.update((s) => { s.settings.region = next; });
      toast(next === 'global' ? 'Global mode: remote roles and work abroad' : 'India mode: roles across India');
    }));
    document.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const t = a.getAttribute('href').slice(1);
      if (!ROUTES[t]) return;
      e.preventDefault();
      go(t);
    });
    CC.on((kind) => { if (kind === 'status') renderStatus(); else render(); });
    window.addEventListener('popstate', () => route(tokenFromHash()));
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', () => { if (currentView === 'today') render(); });
    }
    route(tokenFromHash(), true);
    CC.Remote.init();
  }
  // The page's elements are all above this script, so start right away (no waiting on load events,
  // which behave differently inside the Apps Script frame). Any failure is shown on screen.
  try {
    start();
    window.__ccStarted = true;
  } catch (err) {
    if (window.__ccFail) window.__ccFail(err);
    else throw err;
  }
})();
