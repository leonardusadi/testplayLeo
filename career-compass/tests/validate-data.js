/* Validates the content data contract. Usage: node tests/validate-data.js [part ...] */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..', 'src', 'data');
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  try { vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.error(`PARSE ERROR in ${f}: ${e.message}`); process.exitCode = 1; }
}
const D = ctx.window.CC_DATA_PARTS || {};
const errors = [];
const S = 'string', N = 'number', B = 'boolean';
const T = (o) => ({ obj: o });
const A = (x, min = 0) => ({ arr: x, min });
const opt = (x) => ({ opt: x });
const oneOf = (...v) => ({ oneOf: v });
function check(v, spec, at) {
  if (spec && spec.opt !== undefined) { if (v === undefined || v === null) return; spec = spec.opt; }
  if (spec === S) { if (typeof v !== 'string' || !v.trim()) errors.push(`${at}: expected non-empty string`); return; }
  if (spec === '' ) { if (typeof v !== 'string') errors.push(`${at}: expected string`); return; }
  if (spec === N) { if (typeof v !== 'number') errors.push(`${at}: expected number`); return; }
  if (spec === B) { if (typeof v !== 'boolean') errors.push(`${at}: expected boolean`); return; }
  if (spec.oneOf) { if (!spec.oneOf.includes(v)) errors.push(`${at}: expected one of ${spec.oneOf.join('|')}, got ${JSON.stringify(v)}`); return; }
  if (spec.arr !== undefined) {
    if (!Array.isArray(v)) { errors.push(`${at}: expected array`); return; }
    if (v.length < spec.min) errors.push(`${at}: expected at least ${spec.min} items, got ${v.length}`);
    v.forEach((x, i) => check(x, spec.arr, `${at}[${i}]`));
    return;
  }
  if (spec.obj) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) { errors.push(`${at}: expected object`); return; }
    for (const [k, s] of Object.entries(spec.obj)) check(v[k], s, `${at}.${k}`);
    return;
  }
}
const LANE = oneOf('same', 'adjacent', 'new');
const ENERGY = oneOf('low', 'okay', 'good');
const HREF = oneOf('#today', '#paths', '#companies', '#abroad', '#search', '#cv', '#letters', '#tracker', '#interview', '#offer', '#care', '#data');
const TRACK = T({ label: S, use: S, headline: S, summary: S, skills: A(S, 8), pitch: S, strengths: S, coverPara: S, linkedinHeadline: S, linkedinAbout: S, naukriHeadline: S, naukriSummary: S, keySkills: A(S, 6) });
const SPEC = {
  person: T({ first: S, full: S }),
  today: T({
    heroLine: S, doneLine: S, weekNote: S,
    energy: T({ low: T({ label: S, sub: S, note: S }), okay: T({ label: S, sub: S, note: S }), good: T({ label: S, sub: S, note: S }) }),
    weekGoals: T({ applied: N, followups: N, outreach: N }),
    pool: A(T({ id: S, title: S, sub: S, minutes: N, energy: A(ENERGY, 1), href: HREF, care: opt(B) }), 14),
    firstWeek: A(T({ id: S, title: S, sub: S, href: HREF, hrefLabel: opt(S), minutes: opt(N) }), 6),
    evidence: A(S, 8),
    plan: opt(T({ title: S, points: A(T({ title: S, body: S }), 3), note: opt('') })),
  }),
  care: T({
    intro: S, breathNote: S, helpIntro: S,
    reframes: A(T({ thought: S, reframe: S }), 8),
    practices: A(T({ name: S, how: S, minutes: N, evidence: S }), 6),
    prompts: A(S, 7), affirmations: A(S, 4), rhythm: A(S, 4),
    helplines: A(T({ name: S, number: S, hours: S, languages: '', url: '' }), 2),
  }),
  explore: T({ intro: S, lanesNote: S, marketNotes: A(S, 3) }),
  global: T({
    intro: S,
    search: T({
      intro: S, linkCaveat: S,
      locations: A(T({ id: S, label: S, linkedin: S, indeed: '', indeedLoc: '', remote: B }), 3),
      platforms: A(T({ id: S, name: S, url: '', bestFor: S, tips: A(S, 2), linkNote: opt('') }), 5),
      tips: A(T({ tip: S, why: S }), 3), scamsExtra: A(T({ flag: S, detail: S }), 3), safety: A(S, 3),
    }),
    companies: A(T({ id: S, name: S, category: S, cities: A(S, 1), hyd: B, careers: '', roles: A(S, 1), functions: S, work: S, lane: LANE, fit: S }), 10),
    cv: T({ availability: S, rules: A(T({ rule: S, detail: S }), 3) }),
    interview: T({ salary: A(S, 3), questions: A(T({ id: S, q: S, group: oneOf('Tender', 'Common', 'Role-specific'), why: S, answer: S }), 2) }),
    plan: T({ title: S, points: A(T({ title: S, body: S }), 3), note: '' }),
    letters: T({ availabilityLine: S }),
  }),
  history: T({
    channels: S, appliedNote: S, pastNext: S,
    applied: A(T({ id: S, name: S, companyId: '' }), 1),
    ideas: A(T({ companyId: S, role: S, note: S })),
    firstRound: T({ title: S, body: S, points: A(T({ title: S, body: S }), 2) }),
  }),
  roles: A(T({ id: S, title: S, lane: LANE, variants: A(S, 2), why: S, gaps: '', salary: '', hybrid: oneOf('high', 'medium', 'low'), hybridWhy: S, upskill: A(T({ name: S, provider: S, cost: '', url: '', duration: '' })), employers: A(S) }), 15),
  companies: A(T({ id: S, name: S, category: S, cities: A(S, 1), hyd: B, careers: '', roles: A(S, 1), functions: S, work: S, lane: LANE, fit: S }), 25),
  remote: T({
    oldPlanNote: S, remoteIntro: S, eor: S, employersIntro: S, expertIntro: S, overseasIntro: S, overseasCaveat: S,
    boards: A(T({ name: S, url: '', useful: oneOf('high', 'medium', 'low'), notes: S }), 3),
    employers: A(T({ name: S, url: '', roles: S, india: S })),
    expert: A(T({ name: S, url: '', kind: S, how: S, pay: '', caution: '' }), 3),
    overseas: A(T({ country: S, route: S, changed: S, effort: oneOf('low', 'medium', 'high'), first: S }), 4),
  }),
  search: T({
    intro: S, linkCaveat: S, locations: A(S, 3),
    routine: A(T({ title: S, sub: S }), 4),
    platforms: A(T({ id: S, name: S, url: '', bestFor: S, tips: A(S, 2), build: opt(oneOf('naukri', 'linkedin', 'indeed', 'foundit', 'google')), linkNote: opt('') }), 6),
    tips: A(T({ tip: S, why: S }), 8),
    scams: T({ flags: A(T({ flag: S, detail: S }), 5), verify: A(S, 4), report: S }),
  }),
  cv: T({
    intro: S, numbersNote: S, certs: '', languages: S,
    contact: T({ name: S, city: S, phone: S, email: S, linkedin: '', availability: S }),
    tracks: T({ same: TRACK, adjacent: TRACK, new: TRACK }),
    jobs: A(T({ id: S, title: S, org: S, city: S, start: S, end: '', endHint: opt(S), bullets: A(T({ t: S, tn: opt(S), tracks: opt(A(LANE, 1)) }), 3) }), 4),
    recent: T({ items: A(T({ org: S }), 2), compactTitle: S, reason: S, why: S, modes: T({ compact: T({ label: S, note: S }), full: T({ label: S, note: S }), omit: T({ label: S, note: S }) }) }),
    education: T({ degree: S, school: S, year: S, note: '' }),
    numbers: A(T({ key: S, q: S, hint: S }), 3),
    rules: A(T({ rule: S, detail: S }), 6),
    limits: T({ linkedinHeadline: N, linkedinAbout: N, naukriHeadline: N, naukriSummary: N }),
    profileTips: A(T({ title: S, body: S }), 4),
  }),
  letters: T({
    intro: S,
    fields: T({ company: T({ label: S }), role: T({ label: S }), contact: T({ label: S }) }),
    templates: A(T({ id: S, label: S, group: S, kind: oneOf('apply', 'outreach', 'followup', 'thanks', 'other'), when: S, uses: A(S, 1), subject: opt(S), body: S, limit: opt(N), docx: opt(B), logAs: opt(oneOf('applied', 'followup', 'interview', 'closed')), tips: opt(A(S)) }), 8),
  }),
  interview: T({
    intro: S, offerIntro: S, coachBackground: S,
    intro_answers: T({ same: S, adjacent: S, new: S }),
    questions: A(T({ id: S, q: S, group: oneOf('Tender', 'Common', 'Role-specific'), why: S, answer: S }), 14),
    stories: A(T({ title: S, use: S, situation: S, action: S, result: S }), 5),
    ask: A(S, 8), salary: A(S, 4), offer: A(S, 8), stability: A(T({ signal: S, how: S }), 6),
  }),
  theosophy: T({
    label: S, toggleOn: S, toggleOff: S,
    motto: T({ text: S, sanskrit: S, source: S }),
    epigraphs: T(Object.fromEntries(['today', 'paths', 'companies', 'abroad', 'search', 'cv', 'letters', 'tracker', 'interview', 'offer', 'care']
      .map((k) => [k, T({ quote: S, source: S, note: S })]))),
    seeds: A(T({ quote: S, source: S, reflection: S }), 21),
    moments: T({ applied: S, followup: S, interview: S, offer: S, closed: S, beforeSend: S, dayDone: S }),
    pool: A(T({ id: S, title: S, sub: S, minutes: N, energy: A(ENERGY, 1), href: HREF, care: opt(B) }), 4),
    interviewCentering: S,
    care: T({
      intro: S, seedNote: S, balance: S,
      objects: T({ title: S, intro: S, items: A(T({ object: S, forYou: S }), 3), source: S }),
      prayer: T({ title: S, lines: A(S, 3), source: S, note: S }),
      practices: A(T({ name: S, how: S, minutes: N, source: S }), 5),
      reframes: A(T({ thought: S, reframe: S, quote: opt(S), source: opt(S) }), 6),
      stairs: T({ title: S, text: S, source: S, note: S }),
      reading: A(T({ title: S, author: S, why: S, url: '' }), 4),
      community: A(T({ name: S, what: S, url: '', region: oneOf('india', 'global', 'both') }), 2),
    }),
  }),
};
const only = process.argv.slice(2);
for (const [k, spec] of Object.entries(SPEC)) {
  if (only.length && !only.includes(k)) continue;
  if (D[k] === undefined) { errors.push(`${k}: missing part`); continue; }
  check(D[k], spec, k);
}
// cross-checks
if (D.letters && Array.isArray(D.letters.templates)) {
  const known = new Set(['company', 'role', 'contact', 'source', 'why', 'mutual', 'topic', 'interviewDate', 'skill', 'newRole', 'greeting', 'hi', 'me', 'phone', 'email', 'linkedin', 'pitch', 'headline', 'strengths', 'trackPara', 'today', 'city', 'signature', 'availabilityLine']);
  for (const t of D.letters.templates) {
    for (const m of `${t.subject || ''} ${t.body || ''}`.matchAll(/\{\{(\w+)\}\}/g)) if (!known.has(m[1])) errors.push(`letters.${t.id}: unknown placeholder {{${m[1]}}}`);
    for (const u of t.uses || []) if (!D.letters.fields[u]) errors.push(`letters.${t.id}: uses field "${u}" not defined in letters.fields`);
  }
}
if (D.cv && D.cv.jobs && D.cv.numbers) {
  const keys = new Set(D.cv.numbers.map((n) => n.key));
  for (const j of D.cv.jobs) for (const b of j.bullets || []) for (const m of `${b.tn || ''} ${Object.values(b.altn || {}).join(' ')}`.matchAll(/\{(\w+)\}/g)) if (!keys.has(m[1])) errors.push(`cv.jobs.${j.id}: unknown number token {${m[1]}}`);
}
const ids = (arr, name) => { const seen = new Set(); for (const x of arr || []) { if (seen.has(x.id)) errors.push(`${name}: duplicate id ${x.id}`); seen.add(x.id); } };
ids(D.roles, 'roles'); ids(D.companies, 'companies'); if (D.history) ids(D.history.applied, 'history.applied');
if (D.history && D.companies) for (const x of [...D.history.applied, ...(D.history.ideas || [])]) if (x.companyId && !D.companies.some((c) => c.id === x.companyId)) errors.push(`history: unknown companyId ${x.companyId}`); ids([...((D.today && D.today.pool) || []), ...((D.theosophy && D.theosophy.pool) || [])], 'today.pool + theosophy.pool'); ids(D.today && D.today.firstWeek, 'today.firstWeek'); ids(D.letters && D.letters.templates, 'letters.templates'); ids(D.interview && D.interview.questions, 'interview.questions');
if (D.search && D.search.platforms) ids(D.search.platforms, 'search.platforms');
if (D.global && D.global.search) {
  const G = D.global.search;
  ids(G.platforms, 'global.search.platforms'); ids(G.locations, 'global.search.locations'); ids(D.global.companies, 'global.companies');
  const native = new Set(['linkedin', 'indeed', 'google']);
  const locIds = new Set((G.locations || []).map((l) => l.id));
  for (const p of G.platforms || []) {
    if (p.build && !native.has(p.build) && !(G.builders && G.builders[p.build] && G.builders[p.build].pattern)) errors.push(`global.search.platforms.${p.id}: build '${p.build}' has no pattern`);
    for (const r of p.regions || []) if (!locIds.has(r)) errors.push(`global.search.platforms.${p.id}: unknown region ${r}`);
  }
}
if (errors.length) { console.log(`${errors.length} problem(s):\n- ${errors.slice(0, 80).join('\n- ')}`); process.exitCode = 1; }
else console.log(`OK: ${only.length ? only.join(', ') : 'all parts'} valid`);
