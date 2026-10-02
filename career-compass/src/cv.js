/* CV model: merges suggested content (CC_DATA.cv) with her edits (state.cv) into one model used by
   the on-screen preview, the Word export and the plain-text copy. */
const CV = (() => {
  'use strict';
  const D = () => window.CC_DATA.cv;
  const S = () => CC.state.cv;
  const TRACKS = ['same', 'adjacent', 'new'];

  const fill = (text, nums) => text.replace(/\{(\w+)\}/g, (_, k) => (nums[k] || '').trim());
  const hasAll = (text, nums) => [...text.matchAll(/\{(\w+)\}/g)].every((m) => (nums[m[1]] || '').trim());

  /** Suggested bullets for a job in a track (numbers substituted when she has given them). */
  function suggestedBullets(job, track) {
    const nums = S().numbers || {};
    return (job.bullets || [])
      .filter((b) => !b.tracks || b.tracks.includes(track))
      .map((b) => {
        const base = (b.alt && b.alt[track]) || b.t;
        const withNum = b.tn && ((b.altn && b.altn[track]) || b.tn);
        return withNum && hasAll(withNum, nums) ? fill(withNum, nums) : base;
      });
  }
  function jobState(id) {
    const st = S();
    if (!st.jobs[id]) st.jobs[id] = {};
    return st.jobs[id];
  }
  function bullets(job, track) {
    const js = S().jobs[job.id];
    if (js && js.bullets && Array.isArray(js.bullets[track])) return js.bullets[track];
    return suggestedBullets(job, track);
  }
  const field = (job, key) => {
    const js = S().jobs[job.id];
    return js && js[key] != null ? js[key] : job[key] || '';
  };
  const trackText = (key, track) => {
    const o = S()[key] || {};
    return o[track] != null ? o[track] : D().tracks[track][key] || '';
  };
  const kit = (track, key) => {
    const k = (S().kits || {})[track] || {};
    return k[key] != null ? k[key] : D().tracks[track][key] || '';
  };

  function dates(start, end, endHint) {
    const s = (start || '').trim();
    const e = (end || '').trim();
    return { text: `${s || '[start]'} – ${e || endHint || '[end]'}`, missing: !s || !e };
  }

  function model(track = S().track) {
    const d = D();
    const st = S();
    const c = { ...d.contact, ...(st.contact || {}) };
    const G = window.CC_DATA.global;
    if (CC.state.settings && CC.state.settings.region === 'global' && G) {
      c.availability = (st.contact || {}).availabilityGlobal != null ? st.contact.availabilityGlobal : ((G.cv || {}).availability || c.availability);
    }
    const missing = [];
    const contactBits = [c.city, c.phone, c.email, c.linkedin, c.availability].map((x) => (x || '').trim()).filter(Boolean);
    const experience = [];
    const recent = st.recent || {};
    const mode = recent.mode || 'compact';
    const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const when = (txt) => {
      const t = String(txt || '').trim();
      const m = t.match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/) || t.match(/^(\d{1,2})[/-](\d{4})$/);
      if (!m) return null;
      const mon = /^\d+$/.test(m[1]) ? Number(m[1]) - 1 : MON[m[1].toLowerCase()];
      return mon == null || mon < 0 || mon > 11 ? null : Number(m[2]) * 12 + mon;
    };
    const items = (recent.items || d.recent.items).map((it, i) => ({ ...d.recent.items[i], ...it }))
      .sort((a, b) => (when(b.start) ?? -Infinity) - (when(a.start) ?? -Infinity)); // most recent first, as on any CV

    if (mode === 'full') {
      for (const it of items) {
        const dt = dates(it.start, it.end);
        if (!it.title) missing.push(`Your job title at ${it.org}`);
        if (dt.missing) missing.push(`Start and end month at ${it.org}`);
        experience.push({
          title: it.title || '[Your title]', org: it.org, city: it.city || '', dates: dt.text,
          bullets: [it.summary || '', it.reason || d.recent.reasonOne || 'The role was closed by the employer for business reasons.'].filter(Boolean), short: true,
        });
      }
    } else if (mode === 'compact') {
      const lines = items.map((it) => {
        const dt = dates(it.start, it.end);
        if (!it.title) missing.push(`Your job title at ${it.org}`);
        if (dt.missing) missing.push(`Start and end month at ${it.org}`);
        return `${it.title || '[Your title]'}, ${it.org} (${dt.text})`;
      });
      const starts = items.map((it) => it.start).filter((x) => when(x) != null).sort((a, b) => when(a) - when(b));
      const ends = items.map((it) => it.end).filter((x) => when(x) != null).sort((a, b) => when(a) - when(b));
      if (items.some((it) => (it.start && when(it.start) == null) || (it.end && when(it.end) == null))) missing.push('Write the short-role months like "May 2025"');
      experience.push({
        title: d.recent.compactTitle, org: '', city: '',
        dates: `${starts[0] || '[start]'} – ${ends[ends.length - 1] || '[end]'}`,
        bullets: [...lines, recent.reason || d.recent.reason], short: true,
      });
    }
    for (const job of d.jobs) {
      const dt = dates(field(job, 'start'), field(job, 'end'), job.endHint);
      if (dt.missing) missing.push(`End month at ${field(job, 'org')}`);
      experience.push({
        title: field(job, 'title'), org: field(job, 'org'), city: field(job, 'city'), dates: dt.text,
        bullets: bullets(job, track).filter((b) => b && b.trim()),
      });
    }
    const skillsRaw = trackText('skills', track);
    const skills = Array.isArray(skillsRaw) ? skillsRaw : String(skillsRaw).split(/\s*[,;\n]\s*/).filter(Boolean);
    const certs = String(st.certs != null ? st.certs : d.certs || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const headline = trackText('headline', track);
    const summary = trackText('summary', track);
    const allText = [headline, summary, ...experience.flatMap((e) => e.bullets)].join(' ');
    const brackets = (allText.match(/\[[^\]]+\]/g) || []).filter((b) => !/^\[(start|end|end month\/year|Your title)\]$/.test(b));
    if (brackets.length) missing.push(`Replace the highlighted ${brackets.length > 1 ? 'placeholders' : 'placeholder'} ${[...new Set(brackets)].slice(0, 3).join(', ')}`);
    return {
      track,
      name: c.name,
      headline,
      contact: contactBits.join('  ·  '),
      summary,
      skills,
      experience,
      education: { ...d.education, ...(st.education || {}) },
      certs,
      languages: st.languages != null ? st.languages : d.languages,
      missing,
    };
  }

  function toBlocks(m) {
    const blocks = [
      { type: 'title', text: m.name },
      { type: 'subtitle', text: m.headline },
      { type: 'contact', text: m.contact },
      { type: 'h', text: 'Professional Summary' },
      { type: 'p', text: m.summary },
      { type: 'h', text: 'Core Skills' },
      { type: 'p', text: m.skills.join('  |  ') },
      { type: 'h', text: 'Experience' },
    ];
    for (const e of m.experience) {
      blocks.push({ type: 'role', title: e.title, org: [e.org, e.city].filter(Boolean).join(', '), dates: e.dates });
      for (const b of e.bullets) blocks.push({ type: 'bullet', text: b });
    }
    blocks.push({ type: 'h', text: 'Education' });
    blocks.push({ type: 'p', text: [{ t: m.education.degree, b: true }, { t: `, ${m.education.school}, ${m.education.year}` }, { t: m.education.note ? ` — ${m.education.note}` : '' }] });
    if (m.certs.length) {
      blocks.push({ type: 'h', text: 'Training & Certifications' });
      for (const c of m.certs) blocks.push({ type: 'bullet', text: c });
    }
    blocks.push({ type: 'h', text: 'Languages' });
    blocks.push({ type: 'p', text: m.languages });
    return blocks;
  }

  function toText(m) {
    const out = [m.name.toUpperCase(), m.headline, m.contact, '', 'PROFESSIONAL SUMMARY', m.summary, '', 'CORE SKILLS', m.skills.join(' | '), '', 'EXPERIENCE'];
    for (const e of m.experience) {
      out.push('', `${e.title}${e.org ? `, ${[e.org, e.city].filter(Boolean).join(', ')}` : ''}   ${e.dates}`);
      for (const b of e.bullets) out.push(`• ${b}`);
    }
    out.push('', 'EDUCATION', `${m.education.degree}, ${m.education.school}, ${m.education.year}${m.education.note ? ` — ${m.education.note}` : ''}`);
    if (m.certs.length) { out.push('', 'TRAINING & CERTIFICATIONS'); for (const c of m.certs) out.push(`• ${c}`); }
    out.push('', 'LANGUAGES', m.languages);
    return out.join('\n');
  }

  /** Render text with [bracketed placeholders] highlighted. */
  function marked(text) {
    const frag = document.createDocumentFragment();
    String(text).split(/(\[[^\]]+\])/g).forEach((part) => {
      if (!part) return;
      if (/^\[[^\]]+\]$/.test(part)) frag.append(CC.h('span', { class: 'ph' }, part));
      else frag.append(part);
    });
    return frag;
  }

  function preview(m) {
    const { h } = CC;
    return h('article', { class: 'paper', 'aria-label': 'CV preview' },
      h('div', { class: 'p-name' }, m.name),
      h('div', { class: 'p-head' }, marked(m.headline)),
      h('div', { class: 'p-contact' }, m.contact),
      h('div', { class: 'p-h' }, 'Professional Summary'),
      h('p', null, marked(m.summary)),
      h('div', { class: 'p-h' }, 'Core Skills'),
      h('p', null, m.skills.join('  |  ')),
      h('div', { class: 'p-h' }, 'Experience'),
      m.experience.map((e) => [
        h('div', { class: 'p-role' },
          h('span', null, h('b', null, marked(e.title)), e.org ? `, ${[e.org, e.city].filter(Boolean).join(', ')}` : ''),
          h('span', { class: 'p-dates' }, marked(e.dates))),
        h('ul', null, e.bullets.map((b) => h('li', null, marked(b))))]),
      h('div', { class: 'p-h' }, 'Education'),
      h('p', null, h('b', null, m.education.degree), `, ${m.education.school}, ${m.education.year}`, m.education.note ? ` — ${m.education.note}` : ''),
      m.certs.length ? [h('div', { class: 'p-h' }, 'Training & Certifications'), h('ul', null, m.certs.map((c) => h('li', null, c)))] : null,
      h('div', { class: 'p-h' }, 'Languages'),
      h('p', null, m.languages));
  }

  function fileBase(m) {
    const label = { same: 'Clinical-Applications', adjacent: 'MedTech-Quality-Support', new: 'Customer-Success-Training' }[m.track] || 'CV';
    return `${m.name.replace(/\s+/g, '_')}_CV_${label}`;
  }

  return { TRACKS, model, toBlocks, toText, preview, marked, suggestedBullets, bullets, jobState, field, trackText, kit, fileBase };
})();
