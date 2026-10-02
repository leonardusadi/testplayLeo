/* Unit checks for Code.gs against the in-memory Apps Script mock. Usage: node tests/gas-unit.js */
const assert = require('assert');
const { createGas } = require('./gas-mock');

const call = (gas, action, payload, key) => JSON.parse(gas.api(JSON.stringify({ action, payload, key })));
let n = 0;
const test = (name, fn) => { fn(); n += 1; console.log(`ok ${n} - ${name}`); };

test('setup creates the three tabs and removes the empty Sheet1', () => {
  const gas = createGas();
  gas.context.setup();
  assert.deepStrictEqual([...gas.sheets.keys()].sort(), ['Applications', 'Messages', 'Store']);
  assert.strictEqual(gas.sheet('Applications').data[0][0], 'id');
});

test('load on an empty book returns empty core and apps', () => {
  const gas = createGas();
  const r = call(gas, 'load');
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.data.core, {});
  assert.deepStrictEqual(r.data.apps, []);
  assert.strictEqual(r.data.meta.aiEnabled, false);
});

test('save then load round-trips core values, apps and messages', () => {
  const gas = createGas();
  const app = { id: 'a1', company: 'Medtronic', role: 'Complaint Handling Specialist', status: 'applied', appliedOn: '2026-10-02', followUpOn: '2026-10-09', followups: ['2026-10-09'], createdAt: 1, updatedAt: 100, region: 'india', messages: [{ id: 'm1', date: '2026-10-02', label: 'Cover letter', kind: 'apply', subject: 'Application', text: 'Dear Hiring Team,\n\nHello.' }], futureField: { x: 1 } };
  const s = call(gas, 'save', { core: { cv: { value: { track: 'adjacent' }, updatedAt: 50 }, settings: { value: { region: 'global' }, updatedAt: 50 } }, apps: [app] });
  assert.strictEqual(s.ok, true, JSON.stringify(s));
  const r = call(gas, 'load').data;
  assert.deepStrictEqual(r.core.cv, { value: { track: 'adjacent' }, updatedAt: 50 });
  assert.strictEqual(r.core.settings.value.region, 'global');
  const got = r.apps[0];
  assert.strictEqual(got.company, 'Medtronic');
  assert.deepStrictEqual(got.followups, ['2026-10-09']);
  assert.strictEqual(got.updatedAt, 100);
  assert.deepStrictEqual(got.futureField, { x: 1 }, 'unknown fields survive in the extra column');
  assert.strictEqual(got.messages.length, 1);
  assert.strictEqual(got.messages[0].text, 'Dear Hiring Team,\n\nHello.');
  const table = gas.sheet('Applications').table();
  assert.strictEqual(table[0].company, 'Medtronic', 'Applications tab is a readable table');
  assert.strictEqual(gas.sheet('Messages').table()[0].company, 'Medtronic');
});

test('older writes never overwrite newer ones (per key and per application)', () => {
  const gas = createGas();
  call(gas, 'save', { core: { wins: { value: ['new'], updatedAt: 200 } }, apps: [{ id: 'a1', company: 'New', updatedAt: 200 }] });
  const s = call(gas, 'save', { core: { wins: { value: ['old'], updatedAt: 100 } }, apps: [{ id: 'a1', company: 'Old', updatedAt: 100 }] });
  assert.deepStrictEqual(s.data.skipped.sort(), ['a1', 'wins']);
  const r = call(gas, 'load').data;
  assert.deepStrictEqual(r.core.wins.value, ['new']);
  assert.strictEqual(r.apps[0].company, 'New');
});

test('large values are split across cells and rejoin exactly', () => {
  const gas = createGas();
  const journal = {};
  for (let i = 0; i < 400; i += 1) journal[`2026-01-${String(i).padStart(3, '0')}`] = 'x'.repeat(400) + i;
  call(gas, 'save', { core: { journal: { value: journal, updatedAt: 10 } } });
  const rows = gas.sheet('Store').table().filter((r) => r.key === 'journal');
  assert.ok(rows.length >= 4, `expected chunks, got ${rows.length}`);
  assert.ok(rows.every((r) => String(r.value).length <= 45000));
  assert.deepStrictEqual(call(gas, 'load').data.core.journal.value, journal);
  // shrink back to one part: surplus rows removed
  call(gas, 'save', { core: { journal: { value: { a: 'b' }, updatedAt: 20 } } });
  assert.strictEqual(gas.sheet('Store').table().filter((r) => r.key === 'journal').length, 1);
  assert.deepStrictEqual(call(gas, 'load').data.core.journal.value, { a: 'b' });
});

test('columns added later by hand are kept when the app saves', () => {
  const gas = createGas();
  call(gas, 'save', { apps: [{ id: 'a1', company: 'GE HealthCare', updatedAt: 1 }] });
  const sh = gas.sheet('Applications');
  sh.data[0].push('myRating');
  sh.data[1][sh.data[0].length - 1] = '5 stars';
  call(gas, 'save', { apps: [{ id: 'a1', company: 'GE HealthCare', notes: 'Called back', updatedAt: 2 }] });
  const row = sh.table()[0];
  assert.strictEqual(row.myRating, '5 stars');
  assert.strictEqual(row.notes, 'Called back');
});

test('a Sheet from an older version gains new columns automatically', () => {
  const gas = createGas();
  const sh = gas.context.SpreadsheetApp.getActiveSpreadsheet().insertSheet('Applications');
  sh.data = [['id', 'company', 'status'], ['old1', 'Philips', 'applied']];
  const r = call(gas, 'load').data;
  assert.strictEqual(r.apps[0].company, 'Philips');
  assert.ok(sh.data[0].includes('region') && sh.data[0].includes('extra'));
});

test('deleting an application removes its messages from the Messages tab', () => {
  const gas = createGas();
  call(gas, 'save', { apps: [{ id: 'a1', company: 'X', updatedAt: 1, messages: [{ id: 'm1', text: 'hi' }, { id: 'm2', text: 'there' }] }, { id: 'a2', company: 'Y', updatedAt: 1, messages: [{ id: 'm3', text: 'keep' }] }] });
  call(gas, 'save', { apps: [{ id: 'a1', company: 'X', updatedAt: 2, deleted: true, messages: [] }] });
  const msgs = gas.sheet('Messages').table();
  assert.deepStrictEqual(msgs.map((m) => m.id), ['m3']);
  const apps = call(gas, 'load').data.apps;
  assert.strictEqual(apps.find((a) => a.id === 'a1').deleted, true);
});

test('private link: requests without the key are refused', () => {
  const gas = createGas({ props: { ACCESS_KEY: 'k123' } });
  assert.strictEqual(call(gas, 'load').error.code, 'locked');
  assert.strictEqual(call(gas, 'load', null, 'wrong').error.code, 'locked');
  assert.strictEqual(call(gas, 'load', null, 'k123').ok, true);
  gas.context.createPrivateLink();
  assert.ok(gas.logs.some((l) => l.includes("?key=k123")));
  const fresh = createGas();
  fresh.context.createPrivateLink();
  assert.ok(/^[0-9a-f]{32}$/.test(fresh.props.ACCESS_KEY));
});

test('saveFile stores a file in the Career Compass folder', () => {
  const gas = createGas();
  const r = call(gas, 'saveFile', { name: 'CV.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', base64: Buffer.from('PK\u0003\u0004test').toString('base64') });
  assert.strictEqual(r.ok, true);
  assert.ok(r.data.url.startsWith('https://drive.google.com/'));
  assert.strictEqual(gas.files[0].name, 'CV.docx');
});

test('Ask Claude: off without a key; correct request shape with one; refusals and errors mapped', () => {
  assert.strictEqual(call(createGas(), 'ai', { prompt: 'hi' }).error.code, 'ai_off');
  let seen;
  const gas = createGas({ props: { ANTHROPIC_API_KEY: 'sk-test' }, fetch: (url, opts) => { seen = { url, opts }; return { status: 200, body: { content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '{"risk":"low"}' }], stop_reason: 'end_turn' } }; } });
  assert.strictEqual(call(gas, 'load').data.meta.aiEnabled, true);
  const r = call(gas, 'ai', { prompt: 'Check this', effort: 'low' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.data.text, '{"risk":"low"}');
  const body = JSON.parse(seen.opts.payload);
  assert.strictEqual(seen.url, 'https://api.anthropic.com/v1/messages');
  assert.strictEqual(seen.opts.headers['x-api-key'], 'sk-test');
  assert.strictEqual(seen.opts.headers['anthropic-version'], '2023-06-01');
  assert.strictEqual(body.model, 'claude-opus-5-5');
  assert.strictEqual(body.output_config.effort, 'low');
  assert.strictEqual(body.fallbacks, 'default');
  assert.ok(!('thinking' in body), 'thinking left to the model default');
  const refusing = createGas({ props: { ANTHROPIC_API_KEY: 'k' }, fetch: () => ({ status: 200, body: { content: [], stop_reason: 'refusal' } }) });
  assert.strictEqual(call(refusing, 'ai', { prompt: 'x' }).error.code, 'refused');
  const limited = createGas({ props: { ANTHROPIC_API_KEY: 'k' }, fetch: () => ({ status: 429, body: { error: { message: 'rate' } } }) });
  assert.strictEqual(call(limited, 'ai', { prompt: 'x' }).error.code, 'rate_limited');
  const badKey = createGas({ props: { ANTHROPIC_API_KEY: 'k' }, fetch: () => ({ status: 401, body: {} }) });
  assert.strictEqual(call(badKey, 'ai', { prompt: 'x' }).error.code, 'ai_auth');
});

test('bad input is rejected cleanly', () => {
  const gas = createGas();
  assert.strictEqual(JSON.parse(gas.api('not json')).error.code, 'bad_request');
  assert.strictEqual(call(gas, 'nope').error.code, 'bad_request');
  const s = call(gas, 'save', { core: { 'bad key!': { value: 1, updatedAt: 1 } }, apps: [{ id: '../evil', company: 'x' }] });
  assert.strictEqual(s.data.core, 0);
  assert.strictEqual(s.data.apps, 0);
});

test('tabs grow past their row limit, and deleting rows never removes the last spare row', () => {
  const gas = createGas();
  call(gas, 'load');
  const sh = gas.sheet('Applications');
  sh.maxRows = 3; // header + 2 rows, as on a small sheet
  const many = Array.from({ length: 5 }, (_, i) => ({ id: `a${i}`, company: `C${i}`, updatedAt: 1 }));
  assert.strictEqual(call(gas, 'save', { apps: many }).ok, true);
  assert.strictEqual(sh.table().length, 5);
  const msgs = gas.sheet('Messages');
  call(gas, 'save', { apps: [{ id: 'm', company: 'M', updatedAt: 1, messages: [{ id: 'x1', text: 'a' }] }] });
  msgs.maxRows = msgs.data.length; // completely full tab
  assert.strictEqual(call(gas, 'save', { apps: [{ id: 'm', company: 'M', updatedAt: 2, deleted: true }] }).ok, true);
  assert.strictEqual(msgs.table().length, 0);
});

test('Store rows follow column names even if someone reorders the columns', () => {
  const gas = createGas();
  call(gas, 'save', { core: { wins: { value: ['a'], updatedAt: 1 } } });
  const st = gas.sheet('Store');
  st.data = st.data.map((r) => [r[2], r[0], r[1], r[3], r[4]]); // value, key, part, ...
  call(gas, 'save', { core: { wins: { value: ['b'], updatedAt: 2 } } });
  assert.deepStrictEqual(call(gas, 'load').data.core.wins.value, ['b']);
});

test('Save to Drive reuses its folder and never uses a trashed one', () => {
  const gas = createGas();
  const file = { name: 'a.docx', mime: 'x', base64: Buffer.from('PK').toString('base64') };
  call(gas, 'saveFile', file);
  call(gas, 'saveFile', file);
  assert.strictEqual(gas.folders.length, 1);
  gas.folders[0].trashed = true;
  call(gas, 'saveFile', file);
  assert.strictEqual(gas.folders.length, 2);
  assert.strictEqual(gas.folders[1].files.length, 1);
});

test('createPrivateLink keeps an existing key', () => {
  const gas = createGas({ props: { ACCESS_KEY: 'keep-me' } });
  gas.context.createPrivateLink();
  assert.strictEqual(gas.props.ACCESS_KEY, 'keep-me');
  assert.ok(gas.logs.some((l) => l.includes('keep-me')));
});

test('Ask Claude timeouts become a clear message', () => {
  const gas = createGas({ props: { ANTHROPIC_API_KEY: 'k' }, fetch: () => { throw new Error('Timeout: https://api.anthropic.com/v1/messages'); } });
  assert.strictEqual(call(gas, 'ai', { prompt: 'x' }).error.code, 'slow');
});

console.log(`\n${n} passed`);
