/* Smoke test: every view renders without console errors at phone + desktop widths, light + dark;
   key flows work (energy plan, tracker add/edit, letter save, CV docx + CSV + JSON downloads).
   Usage: node tests/smoke.js <path-to-standalone-html> <out-dir> */
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_PATH || '/opt/node22/lib/node_modules/playwright');

const file = path.resolve(process.argv[2] || 'apps-script/Interface.html');
const out = path.resolve(process.argv[3] || '/tmp/claude-0/shots');
fs.mkdirSync(out, { recursive: true });
const ROUTES = ['today', 'paths', 'companies', 'abroad', 'search', 'cv', 'letters', 'tracker', 'interview', 'offer', 'care'];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const problems = [];
  for (const [w, hgt, scheme] of [[390, 844, 'light'], [1280, 900, 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: hgt }, colorScheme: scheme, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`[${w}] console: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`[${w}] pageerror: ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(`file://${file}#today`);
    await page.waitForSelector('#main .view');
    for (const r of ROUTES) {
      await page.evaluate((x) => { history.pushState(null, '', `#${x}`); dispatchEvent(new PopStateEvent('popstate')); }, r);
      await page.waitForTimeout(150);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 1) problems.push(`[${w}] #${r}: horizontal overflow ${overflow}px`);
      const empty = await page.evaluate(() => document.querySelector('#main').innerText.trim().length);
      if (empty < 40) problems.push(`[${w}] #${r}: view looks empty`);
      const epi = await page.evaluate(() => !!(window.CC_DATA && window.CC_DATA.theosophy) && !document.querySelector('[data-epigraph], .seed'));
      if (epi) problems.push(`[${w}] #${r}: theosophical epigraph missing`);
      await page.screenshot({ path: path.join(out, `${w}-${r}.png`), fullPage: true });
    }
    if (w === 390) {
      // energy plan
      await page.evaluate(() => { history.pushState(null, '', '#today'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.click('#energy-okay');
      await page.waitForTimeout(100);
      const tasks = await page.$$eval('.tasks li', (els) => els.length);
      if (tasks < 3) problems.push(`energy plan shows ${tasks} tasks`);
      // tracker: add from company card
      await page.evaluate(() => { history.pushState(null, '', '#companies'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(100);
      await page.click('text=Add to tracker >> nth=0');
      await page.evaluate(() => { history.pushState(null, '', '#tracker'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(100);
      const cards = await page.$$eval('.app-card', (els) => els.length);
      if (cards < 1) problems.push('tracker: company not added');
      // letters: fill + save
      await page.evaluate(() => { history.pushState(null, '', '#letters'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(100);
      await page.fill('#lf-company', 'Medtronic');
      await page.fill('#lf-role', 'Complaint Handling Specialist');
      const letter = await page.textContent('#letter-out');
      if (!letter.includes('Medtronic')) problems.push('letters: field not applied to output');
      await page.click('text=Save to tracker');
      await page.evaluate(() => { history.pushState(null, '', '#tracker'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(100);
      const txt = await page.textContent('#main');
      if (!txt.includes('Medtronic')) problems.push('letters: save to tracker failed');
      // downloads
      for (const [hash, label, ext] of [['#cv', 'Download Word (.docx)', '.docx'], ['#tracker', 'Download tracker (.csv)', '.csv'], ['#tracker', 'Download full backup (.json)', '.json']]) {
        await page.evaluate((x) => { history.pushState(null, '', x); dispatchEvent(new PopStateEvent('popstate')); }, hash);
        await page.waitForTimeout(150);
        const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click(`text=${label}`)]);
        const target = path.join(out, `export${ext}`);
        await dl.saveAs(target);
        if (!target.endsWith(ext) || fs.statSync(target).size < 50) problems.push(`download ${label} too small`);
      }
      // CV print shows the CV paper and nothing else
      await page.evaluate(() => { history.pushState(null, '', '#cv'); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForTimeout(150);
      await page.evaluate(() => document.body.classList.add('printing-cv'));
      await page.emulateMedia({ media: 'print' });
      const pr = await page.evaluate(() => {
        const paper = document.querySelector('.print-root .paper');
        const visible = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
        const stray = [...document.querySelectorAll('main button, main h1, .epigraph, .footer, .tabbar')].filter(visible).length;
        return { h: paper ? paper.getBoundingClientRect().height : 0, stray };
      });
      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => document.body.classList.remove('printing-cv'));
      if (pr.h < 200) problems.push(`CV print: paper not visible (height ${pr.h})`);
      if (pr.stray) problems.push(`CV print: ${pr.stray} other elements would print`);
      // theosophical layer: on by default, never in the CV, can be switched off and on
      if (await page.evaluate(() => !!(window.CC_DATA && window.CC_DATA.theosophy))) {
        const T = await page.evaluate(() => window.CC_DATA.theosophy);
        await page.evaluate(() => { history.pushState(null, '', '#cv'); dispatchEvent(new PopStateEvent('popstate')); });
        await page.waitForTimeout(150);
        const paper = await page.textContent('.paper');
        const quotes = [...Object.values(T.epigraphs).map((e) => e.quote), ...T.seeds.map((x) => x.quote)];
        if (quotes.some((q) => paper.includes(q.slice(0, 40)))) problems.push('theosophy text appears in the CV');
        await page.evaluate(() => { history.pushState(null, '', '#care'); dispatchEvent(new PopStateEvent('popstate')); });
        await page.waitForTimeout(150);
        if (!(await page.$('#theosophy'))) problems.push('care: theosophy section missing');
        if ((await page.$$eval('.prayer-lines span', (e) => e.length)) < 3) problems.push('care: Universal Prayer missing');
        await page.click('.theo-toggle button');
        await page.waitForTimeout(150);
        if (await page.$('#theosophy, [data-epigraph], .seed')) problems.push('care: theosophy still shown after turning it off');
        await page.evaluate(() => { history.pushState(null, '', '#today'); dispatchEvent(new PopStateEvent('popstate')); });
        await page.waitForTimeout(150);
        if (await page.$('.seed, [data-epigraph]')) problems.push('today: theosophy still shown after turning it off');
        await page.evaluate(() => { history.pushState(null, '', '#care'); dispatchEvent(new PopStateEvent('popstate')); });
        await page.waitForTimeout(150);
        await page.click('.theo-toggle button');
        await page.waitForTimeout(150);
        if (!(await page.$('#theosophy'))) problems.push('care: theosophy not restored after turning it on');
        await page.evaluate(() => { history.pushState(null, '', '#tracker'); dispatchEvent(new PopStateEvent('popstate')); });
        await page.waitForTimeout(150);
      }
      // reload keeps data
      await page.reload();
      await page.waitForSelector('#main .view');
      const after = await page.textContent('#main');
      if (!after.includes('Medtronic')) problems.push('state not persisted across reload');
    }
    await ctx.close();
  }
  await browser.close();
  if (problems.length) { console.log(`PROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}`); process.exitCode = 1; }
  else console.log('SMOKE OK');
})();
