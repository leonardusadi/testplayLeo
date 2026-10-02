/* End-to-end: the real Interface.html talking to the real Code.gs (Apps Script services mocked in memory).
   Covers sync to the Sheet, a second device, India/Global switch, Drive save, private link and Ask Claude.
   Usage: node tests/e2e-gas.js <Interface.html> <screenshot-dir> */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_PATH || '/opt/node22/lib/node_modules/playwright');
const { createGas } = require('./gas-mock');

const file = path.resolve(process.argv[2] || 'apps-script/Interface.html');
const out = path.resolve(process.argv[3] || '/tmp/claude-0/e2e');
fs.mkdirSync(out, { recursive: true });
const problems = [];
const check = (cond, msg) => { if (!cond) problems.push(msg); };

/** Installs a google.script.run / google.script.url shim that forwards api() calls to the mocked server. */
async function openDevice(browser, gas, { key = '', width = 390, scheme = 'light', slowLoad = 0, gate = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text()}`); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.exposeFunction('__gasApi', async (req) => { if (gate && gate.offline) throw new Error('offline'); return gas.api(req); });
  await page.addInitScript(([k, slow]) => {
    let loads = 0;
    const make = (ok, fail) => new Proxy({}, {
      get(_, prop) {
        if (prop === 'withSuccessHandler') return (f) => make(f, fail);
        if (prop === 'withFailureHandler') return (f) => make(ok, f);
        return (...args) => {
          if (prop !== 'api') { if (fail) fail(new Error(`unknown server function ${String(prop)}`)); return; }
          const first = slow && JSON.parse(args[0]).action === 'load' && loads++ === 0; // a slow first load, as on a phone
          window.__gasApi(args[0]).then((r) => setTimeout(() => ok && ok(r), first ? slow : 15), (e) => fail && fail(e));
        };
      },
    });
    window.google = { script: { run: make(null, null), url: { getLocation: (cb) => setTimeout(() => cb({ parameter: k ? { key: k } : {}, hash: '' }), 5) } } };
  }, [key, slowLoad]);
  await page.goto(`file://${file}`);
  await page.waitForSelector('#main .view');
  return { ctx, page };
}
const pill = (page) => page.$eval('#save-pill .txt', (e) => e.textContent);
async function waitSynced(page, label) {
  try {
    await page.waitForFunction(() => document.querySelector('#save-pill .txt').textContent === 'Saved to your Sheet', null, { timeout: 8000 });
    await page.waitForTimeout(2200); // debounce window for any pending save
    await page.waitForFunction(() => document.querySelector('#save-pill .txt').textContent === 'Saved to your Sheet', null, { timeout: 8000 });
  } catch { problems.push(`${label}: never reached "Saved to your Sheet" (pill: ${await pill(page)})`); }
}
const nav = (page, token) => page.evaluate((t) => { const a = document.querySelector(`a[href="#${t}"]`); if (a) a.click(); else { history.pushState(null, '', `#${t}`); dispatchEvent(new PopStateEvent('popstate')); } }, token);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const gas = createGas({ props: { ANTHROPIC_API_KEY: 'sk-test' }, fetch: () => ({ status: 200, body: { content: [{ type: 'text', text: '{"risk":"high","summary":"This asks for a fee.","red_flags":["Registration fee"],"checks":["Never pay"]}' }], stop_reason: 'end_turn' } }) });

  // ---- Device 1: phone
  const d1 = await openDevice(browser, gas);
  const p1 = d1.page;
  await waitSynced(p1, 'device1 initial load');
  const seeded = gas.sheet('Applications').table();
  check(seeded.length === 12, `pre-filled tracker written to Sheet: 9 past + 3 ideas (got ${seeded.length})`);
  check(seeded.filter((a) => a.status === 'applied').map((a) => a.company).includes('Edan'), 'past applications include Edan');
  await nav(p1, 'companies');
  await p1.waitForTimeout(100);
  check((await p1.textContent('#main')).includes('You applied here'), 'company cards mark companies she already applied to');
  await p1.click('button.chip:has-text("New to you")');
  await p1.waitForTimeout(100);
  const freshNames = await p1.$$eval('article.card h3', (hs) => hs.map((x) => x.textContent));
  check(!freshNames.some((n) => /GE HealthCare|Philips|Siemens|Mindray|Samsung/.test(n)), `New to you hides companies already tried (${freshNames.slice(0, 5).join(', ')})`);
  await nav(p1, 'today');

  await p1.click('#energy-good');
  await nav(p1, 'companies');
  await p1.waitForTimeout(100);
  await p1.click('button.chip:has-text("All")');
  await p1.waitForTimeout(100);
  await p1.click('text=Add to tracker >> nth=0');
  await nav(p1, 'letters');
  await p1.waitForTimeout(100);
  await p1.fill('#lf-company', 'Medtronic');
  await p1.fill('#lf-role', 'Complaint Handling Specialist');
  await p1.click('text=Save to tracker');
  await nav(p1, 'cv');
  await p1.waitForTimeout(100);
  await p1.click('summary:has-text("Numbers you remember")');
  await p1.fill('#num-installs', '150+');
  await nav(p1, 'today');
  await p1.fill('#win-input', 'Updated my CV');
  await p1.click('text=Add win');
  await waitSynced(p1, 'device1 after edits');
  const apps = gas.sheet('Applications').table();
  check(apps.some((a) => a.company === 'Medtronic' && a.status === 'applied'), 'Medtronic application saved to the Applications tab as applied');
  check(gas.sheet('Messages').table().some((m) => m.company === 'Medtronic' && /Dear|Hello|Hi/.test(m.text)), 'cover letter saved to the Messages tab');
  const store = Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value]));
  check(store.cv && store.cv.includes('150+'), 'CV numbers saved to Store');
  check(store.wins && store.wins.includes('Updated my CV'), 'win saved to Store');
  await p1.screenshot({ path: path.join(out, 'd1-today.png'), fullPage: true });

  // ---- India -> Global switch
  await p1.click('[data-region="global"]');
  await p1.waitForTimeout(150);
  check((await p1.textContent('#brand-sub')).includes('Global') || (await p1.$eval('[data-region="global"]', (b) => b.getAttribute('aria-pressed'))) === 'true', 'region toggle shows Global');
  await nav(p1, 'search');
  await p1.waitForTimeout(150);
  const gtext = await p1.textContent('#main');
  check(/Working abroad safely/.test(gtext), 'Global search view shown');
  await p1.selectOption('#gsearch-loc', { index: 1 }).catch(() => {});
  await p1.waitForTimeout(100);
  const hrefs = await p1.$$eval('.linkcard', (as) => as.map((a) => a.href));
  check(hrefs.some((h) => h.includes('linkedin.com/jobs/search')), 'Global LinkedIn link built');
  await p1.screenshot({ path: path.join(out, 'd1-global-search.png'), fullPage: true });
  // AI scam check (Ask Claude enabled by the mocked API key)
  await nav(p1, 'search');
  await p1.click('[data-region="india"]');
  await p1.waitForTimeout(150);
  const aiVisible = await p1.$eval('#ai-scam', (el) => !el.closest('.ai-box').hidden).catch(() => false);
  check(aiVisible, 'Ask Claude scam box visible when the server has an API key');
  if (aiVisible) {
    await p1.fill('#ai-scam', 'Pay Rs 5000 registration fee to confirm your Philips job');
    await p1.click('text=Check it');
    await p1.waitForSelector('text=Risk: high', { timeout: 5000 }).catch(() => problems.push('AI answer not rendered'));
  }
  await p1.click('[data-region="global"]');
  await waitSynced(p1, 'device1 after region switch');
  check((Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value])).settings || '').includes('global'), 'region saved to Store');
  const hasTheo = await p1.evaluate(() => !!(window.CC_DATA && window.CC_DATA.theosophy));
  if (hasTheo) {
    await nav(p1, 'care');
    await p1.waitForTimeout(150);
    await p1.click('.theo-toggle button');
    await waitSynced(p1, 'device1 after turning theosophy off');
    check(/"theo":false/.test(Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value])).prefs || ''), 'theosophy switch saved to Store');
  }

  // Drive save of the CV
  await nav(p1, 'cv');
  await p1.waitForTimeout(150);
  await p1.click('text=Save to Drive');
  await p1.waitForTimeout(600);
  check(gas.files.length === 1 && Buffer.from(gas.files[0].bytes).slice(0, 2).toString() === 'PK', 'CV saved to Drive as a .docx (zip)');
  const toastText = await p1.textContent('#toast');
  check(/Saved in Google Drive/.test(toastText || ''), `Drive toast shown (${toastText})`);

  // ---- Device 2: laptop, empty browser storage, same Sheet
  const d2 = await openDevice(browser, gas, { width: 1280, scheme: 'dark' });
  const p2 = d2.page;
  await waitSynced(p2, 'device2 load');
  check((await p2.$eval('[data-region="global"]', (b) => b.getAttribute('aria-pressed'))) === 'true', 'device2 picks up Global mode from the Sheet');
  await nav(p2, 'tracker');
  await p2.waitForTimeout(150);
  const t2 = await p2.textContent('#main');
  check(t2.includes('Medtronic'), 'device2 sees the Medtronic application');
  if (hasTheo) check(!(await p2.$('[data-epigraph]')), 'device2 picks up theosophy switched off from the Sheet');
  check(t2.includes('Messages sent') && /1 saved/.test(t2), 'device2 sees the saved message');
  check(gas.sheet('Applications').table().length === apps.length, 'no duplicate seed rows from the second device');
  await p2.screenshot({ path: path.join(out, 'd2-tracker.png'), fullPage: true });
  // edit on device 2, then reload device 1
  await p2.click('button:text-is("Edit") >> nth=0');
  await p2.fill('textarea[id$="-notes"]', 'Recruiter called on Monday');
  await p2.click('article.card.raised button:text-is("Save")');
  await waitSynced(p2, 'device2 after edit');
  await p1.reload();
  await p1.waitForSelector('#main .view');
  await waitSynced(p1, 'device1 reload');
  await nav(p1, 'tracker');
  await p1.waitForTimeout(150);
  check((await p1.textContent('#main')).includes('Recruiter called on Monday'), 'device1 sees the edit made on device2');

  // ---- A new phone (empty browser storage) whose first load is slow: a tap before the Sheet arrives
  // must not replace whole sections on the Sheet.
  const winsBefore = Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value])).wins || '';
  const d6 = await openDevice(browser, gas, { slowLoad: 2500 });
  await d6.page.fill('#win-input', 'Tapped before the Sheet loaded');
  await d6.page.click('text=Add win');
  await d6.page.click('#energy-low');
  await waitSynced(d6.page, 'slow new device');
  const winsAfter = Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value])).wins || '';
  check(winsBefore.includes('Updated my CV') && winsAfter.includes('Updated my CV'), `a new device's early tap keeps the Sheet's wins (before: ${winsBefore.slice(0, 60)}, after: ${winsAfter.slice(0, 60)})`);
  check(winsAfter.includes('Tapped before the Sheet loaded'), 'a new device keeps the win it added before the Sheet loaded');
  await d6.ctx.close();

  // ---- A new phone that starts offline, is used, then reloaded online: both sides' entries survive
  const gate = { offline: true };
  const d7 = await openDevice(browser, gas, { gate });
  await d7.page.waitForFunction(() => /Offline/.test(document.querySelector('#save-pill .txt').textContent), null, { timeout: 8000 }).catch(() => problems.push('offline device: pill never showed Offline'));
  await d7.page.fill('#win-input', 'Offline win on a new phone');
  await d7.page.click('text=Add win');
  gate.offline = false;
  await d7.page.reload();
  await d7.page.waitForSelector('#main .view');
  await waitSynced(d7.page, 'offline new device after reload');
  const winsOffline = Object.fromEntries(gas.sheet('Store').table().map((r) => [r.key, r.value])).wins || '';
  check(winsOffline.includes('Updated my CV') && winsOffline.includes('Offline win on a new phone'), `offline-then-reload keeps both sides' wins (${winsOffline.slice(0, 120)})`);
  check((await d7.page.textContent('#main')).includes('Offline win on a new phone'), 'offline win still shown on the new phone');
  await d7.ctx.close();

  // ---- Interface update: rebuilt page, same Sheet -> everything still there
  const d3 = await openDevice(browser, gas);
  await waitSynced(d3.page, 'device3 load');
  await nav(d3.page, 'tracker');
  await d3.page.waitForTimeout(150);
  check((await d3.page.textContent('#main')).includes('Recruiter called on Monday'), 'fresh page load restores data from the Sheet');

  // ---- Private link
  const locked = createGas({ props: { ACCESS_KEY: 'secret' } });
  const d4 = await openDevice(browser, locked);
  await d4.page.waitForTimeout(800);
  check((await pill(d4.page)) === 'Private link needed', `no key -> locked (pill: ${await pill(d4.page)})`);
  const d5 = await openDevice(browser, locked, { key: 'secret' });
  await waitSynced(d5.page, 'device with key');

  for (const d of [d1, d2, d3, d4, d5]) await d.ctx.close();
  await browser.close();
  if (problems.length) { console.log(`PROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}`); process.exitCode = 1; }
  else console.log('E2E OK');
})();
