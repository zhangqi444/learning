/* End-to-end check of the built site, served under a GitHub Pages-style subpath (/learning/).
 * Run:  npm run build && node test_e2e.cjs
 * The sandbox cannot reach Google Fonts or accounts.google.com; those requests are
 * aborted so the page behaves as it would offline. */
const { chromium } = require('playwright');
const { stubGoogle, signIn } = require('./test_google.cjs');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, 'dist');
const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (!p.startsWith('/learning')) { res.writeHead(404); return res.end(); }
  p = p.slice('/learning'.length) || '/'; if (p === '/') p = '/index.html';
  const f = path.join(DIST, p);
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
/* How many practice sets the bundle actually implies.
 *
 * The dashboard prints "<done> of <total> sets", and both numbers used to be
 * typed into this file by hand. The `done` half is the point of the check — it
 * proves the seed migrated and the legacy set was counted — but the `total` half
 * is just how much content exists, so it went red the day a batch of Reading
 * passages landed, for a reason with nothing to do with what the check is for.
 * That is the failure mode this repo has already been bitten by twice: a check
 * that cries about something else teaches people to edit the number until it is
 * quiet, and a number edited to match the page is not an assertion any more.
 *
 * So `done` stays hand-written and `total` is derived. The one-line rule below is
 * the same one chunk() applies in src/lib/content.js — near-equal sets of at most
 * SETSIZE per week — and if that ever changes, this is a place to change too. */
const SETSIZE = 12;
function totalSets() {
  const b = JSON.parse(fs.readFileSync(path.join(DIST, 'content', 'bundle.json'), 'utf8'));
  let n = 0;
  for (const items of Object.values(b.subjects)) {
    const perWeek = {};
    for (const i of items) perWeek[i.w] = (perWeek[i.w] || 0) + 1;
    for (const c of Object.values(perWeek)) n += Math.ceil(c / SETSIZE);
  }
  return n;
}
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
let failures = 0;
function check(name, ok, extra) { console.log((ok ? '  ok   ' : '  FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; }

(async () => {
  await new Promise((r) => srv.listen(8140, r));
  const b = await chromium.launch({ executablePath: exe });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 860 }], ['phone', { width: 390, height: 844 }]]) {
    console.log('\n== ' + label + ' ==');
    const ctx = await b.newContext({ viewport });
    await stubGoogle(ctx);
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    pg.on('console', (m) => { if (m.type() === 'error' && !/gsi|accounts\.google|fonts\.g|favicon|net::ERR_FAILED/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
    // A result saved by the very first site version (numeric `at`) must not break rendering.
    await pg.addInitScript(() => { if (!localStorage.getItem('isee.v1')) localStorage.setItem('isee.v1', JSON.stringify({ results: { 'rc:W5:0': { n: 12, right: 3, at: 1788395637217, wrong: [] } } })); });
    await pg.goto('http://localhost:8140/learning/', { waitUntil: 'networkidle' });
    await signIn(pg);   // the site is gated: get through the door first

    // Dashboard renders from the migrated Week-1 seed (plus the one legacy set above)
    await pg.waitForSelector('[data-slot=card]', { timeout: 10000 });
    const cards = await pg.$$eval('[data-slot=card-description]', (n) => n.map((x) => x.textContent.trim()));
    check('dashboard leads with Today, then Readiness', cards.includes('Today') && cards.includes('Readiness') && (await pg.$('[data-testid=continue]')) !== null, cards.slice(0, 4).join(','));
    const body = await pg.textContent('body');
    const SETS = totalSets();
    check(`seed applied + legacy set (11 of ${SETS} sets)`, new RegExp(`11\\s*of\\s*${SETS}\\b`).test(body), body.match(/\d+\s*of\s*\d+/)?.[0]);
    check('legacy numeric timestamp renders as a date', /Sep 2/.test(body));
    check('review count 19 on dashboard', /19/.test(body));
    check('recent-sets table present', (await pg.$$('[data-slot=table-row]')).length > 1);
    check('accuracy chart drawn', (await pg.$$('.recharts-bar-rectangle')).length > 0, (await pg.$$('.recharts-bar-rectangle')).length + ' bars');

    // Global navigation: sidebar (drawer on phone) is reachable from every screen
    const isPhone = label === 'phone';
    if (isPhone) {
      check('sidebar hidden on phone until opened', (await pg.$('[data-slot=sidebar][data-mobile=true]')) === null);
      await pg.click('[data-slot=sidebar-trigger]');
      await pg.waitForSelector('[data-slot=sidebar][data-mobile=true]');
      check('sidebar drawer opens on phone', true);
      await pg.click('[data-slot=sidebar-menu-button]:has-text("Review")');
      await pg.waitForSelector('[data-slot=sidebar][data-mobile=true]', { state: 'detached' });
      check('drawer closes after navigation', true);
    } else {
      check('sidebar visible on desktop', (await pg.$('[data-slot=sidebar-container]')) !== null);
      await pg.click('[data-slot=sidebar-menu-button]:has-text("Review")');
    }
    await pg.waitForFunction(() => location.hash === '#/review');
    // The hash changes on click; React renders a frame later. Wait for the thing
    // this is actually asserting about instead of reading the dashboard's body
    // and calling it the review page.
    await pg.waitForSelector('[data-testid^=review-]');
    check('review page lists subjects', (await pg.$$('[data-testid^=review-]')).length >= 1 && /at the door|Nobody waiting today/.test(await pg.textContent('body')));

    // Enter a review; header breadcrumb + sidebar trigger must still be there; exit via breadcrumb
    await pg.click('[data-testid^=start-review-]');
    await pg.waitForSelector('[data-testid=choice]');
    check('review runner shows choices', (await pg.$$('[data-testid=choice]')).length === 4);
    check('header still present inside a review', (await pg.$('[data-slot=sidebar-trigger]')) !== null);
    const crumbs = await pg.$$eval('[data-slot=breadcrumb-item]', (n) => n.map((x) => x.textContent.trim()).filter(Boolean));
    check('breadcrumb trail inside review', crumbs[0] === 'Dashboard' && crumbs.includes('Review'), crumbs.join(' > '));
    await pg.click(isPhone ? '[data-testid=crumb-home]' : '[data-slot=breadcrumb-link]:has-text("Dashboard")');
    await pg.waitForFunction(() => location.hash === '#/' || location.hash === '');
    await pg.waitForSelector('[data-testid=today]');
    check('exited review via breadcrumb', (await pg.$('[data-testid=today]')) !== null);

    // Run a full set: no answer leak before submit; all-A yields a plausible score; result persists
    await pg.evaluate(() => { location.hash = '#/run/rc/W2/0'; });
    await pg.waitForSelector('[data-testid=choice]');
    check('RC passage box present', (await pg.$('[data-slot=scroll-area]')) !== null);
    const expected = +(await pg.textContent('body')).match(/1 \/ (\d+)/)[1];
    let n = 0, leak = false;
    for (;;) {
      if (/Correct:/.test(await pg.textContent('body'))) leak = true;
      await pg.click('[data-testid=choice] >> nth=0'); n++;
      const t = await pg.textContent('[data-testid=next]');
      await pg.click('[data-testid=next]');
      if (/Finish/.test(t)) break;
      if (n > 20) break;
      await pg.waitForSelector('[data-testid=choice]');
    }
    await pg.waitForSelector('[data-testid=score]');
    const score = (await pg.textContent('[data-testid=score]')).replace(/\s+/g, ' ');
    check('set of ' + n + ' finished, no leak', n === expected && !leak, score.slice(0, 60));
    await pg.click('button:has-text("Back to sets")');
    await pg.waitForFunction(() => location.hash === '#/s/rc/W2');
    // Reopening the finished set shows the answers she gave, not a blank runner
    await pg.waitForSelector('text=tap to see your answers');
    await pg.evaluate(() => { location.hash = '#/run/rc/W2/0'; });
    await pg.waitForSelector('[data-testid=score]');
    const yours = await pg.$$eval('[data-slot=card-content] >> text=/Your answer:/', (n) => n.map((x) => x.textContent));
    check('reopened set shows her recorded answers', yours.length === expected && yours.every((t) => /Your answer: A\./.test(t)), yours[0]);
    check('reopened set shows completed date + Try again', /completed/.test(await pg.textContent('[data-testid=score]')) && (await pg.$('[data-testid=retry]')) !== null, (await pg.textContent('[data-testid=score]')).replace(/\s+/g, ' ').slice(0, 120));
    // Migrated Week-1 sets carry her letters from the Sheets
    await pg.evaluate(() => { location.hash = '#/run/vr/W1/1'; });
    await pg.waitForSelector('[data-testid=score]');
    check('migrated W1 set shows Sheets answers (6/9)', /6\s*\/\s*9/.test((await pg.textContent('[data-testid=score]')).replace(/\s+/g, ' ')) && (await pg.$$eval('text=/Your answer: [A-D]\./', (n) => n.length)) === 9);
    await pg.click('[data-testid=retry]');
    await pg.waitForSelector('[data-testid=choice]');
    check('Try again starts a clean attempt', (await pg.$$eval('[data-testid=choice][data-state=checked]', (n) => n.length)) === 0);
    await pg.evaluate(() => { location.hash = '#/s/rc/W2'; });
    await pg.waitForSelector('text=Set 1');
    check('result badge on sets list', new RegExp('\\d+/' + expected).test(await pg.textContent('body')));

    // Keyboard shortcuts on a fresh set
    await pg.evaluate(() => { location.hash = '#/run/vr/W3/0'; });
    await pg.waitForSelector('[data-testid=choice]');
    await pg.keyboard.press('b');
    const picked = await pg.$eval('[data-testid=choice] >> nth=1', (e) => e.getAttribute('data-state'));
    check('keyboard B selects choice B', picked === 'checked');
    await pg.keyboard.press('Enter');
    await pg.waitForFunction(() => /2 \/ \d+/.test(document.body.textContent));
    check('Enter advances to question 2', true);

    // Theme toggle flips the .dark class and persists across reload
    const wasDark = await pg.evaluate(() => document.documentElement.classList.contains('dark'));
    await pg.click('button[aria-label="Toggle theme"]');
    const nowDark = await pg.evaluate(() => document.documentElement.classList.contains('dark'));
    check('theme toggle flips', wasDark !== nowDark);
    await pg.evaluate(() => { location.hash = '#/'; });
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('[data-testid=today]');
    check('theme persists after reload', (await pg.evaluate(() => document.documentElement.classList.contains('dark'))) === nowDark);
    check('progress persists after reload', new RegExp(`12\\s*of\\s*${totalSets()}\\b`).test(await pg.textContent('body')));
    await pg.click('button[aria-label="Toggle theme"]');   // back to light for the screenshot

    // Signed in through the gate, so the chip and the account row both say so
    if (!isPhone) {
      await pg.evaluate(() => { location.hash = '#/'; });
      check('header chip shows the Drive session', (await pg.$('button:has-text("Saved to Drive")')) !== null);
      check('account row shows who is signed in', /Qi Zhang/.test(await pg.textContent('[data-slot=sidebar-footer]')));
    }

    /* Nothing may run off the side of a phone. This is the cheapest check in the
       suite and it caught a real one: the card that opens a Long Night put a
       nowrap "Start Verbal Reasoning" in a grid column that could not shrink, so
       413px of content sat in a 390px screen and the page she reads before a
       mock was the page she had to drag sideways. Tables and code may scroll
       inside their own box — the document may not. */
    if (isPhone) {
      const wide = [];
      for (const h of ['#/', '#/mock', '#/mock/DGN', '#/checklist', '#/review', '#/score', '#/s/ma', '#/calendar', '#/quest', '#/base', '#/rewards', '#/books']) {
        await pg.evaluate((x) => { location.hash = x; }, h);
        await pg.waitForTimeout(350);
        const over = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (over > 1) wide.push(`${h} +${over}px`);
      }
      check('no page runs off the side of a phone', wide.length === 0, wide.join(', '));

      /* Not running off the side was never the whole of it. The same header kept
         the button and starved the title instead: "Split diagnostic" broken over
         two lines and its one-sentence blurb poured down a column four words
         wide, inside a card with room for all of it. Nothing overflowed, so the
         check above was green the whole time. So this measures what the title
         actually got — a header whose text is beside a button on a phone has
         lost the argument, and 90% is the line between wrapping because the
         words are long and wrapping because something else took the room. */
      const squeezed = [];
      for (const h of ['#/', '#/mock/DGN', '#/score', '#/essay', '#/books']) {
        await pg.evaluate((x) => { location.hash = x; }, h);
        await pg.waitForTimeout(350);
        const r = await pg.evaluate(() => {
          const out = [];
          for (const hd of document.querySelectorAll('[data-slot=card-header]')) {
            const t = hd.querySelector('[data-slot=card-title]');
            if (!t || !hd.querySelector('[data-slot=card-action]')) continue;
            // against the header's content box, not its border box: the card's
            // own side padding is not width the button took.
            const cs = getComputedStyle(hd);
            const w = hd.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            const tw = t.getBoundingClientRect().width;
            if (w > 0 && tw / w < 0.95) out.push(`${(t.textContent || '').trim().slice(0, 24)} ${Math.round((tw / w) * 100)}%`);
          }
          return out;
        });
        if (r.length) squeezed.push(`${h}: ${r.join(', ')}`);
      }
      check('and no card header on a phone hands its width to the button', squeezed.length === 0, squeezed.join(' | '));

      /* The 32px square beside a mock section holds the code she will see on the
         day — VR, QR, RC, MA. "ESSAY" is not a code, it is the word, and five
         characters printed straight out through both sides of the box. A break
         already draws a clock there; the essay draws a pen. */
      await pg.evaluate(() => { location.hash = '#/mock/DGN'; });
      await pg.waitForTimeout(350);
      const tags = await pg.evaluate(() => [...document.querySelectorAll('[data-testid=sec-tag]')]
        .map((e) => (e.textContent || '').trim())
        .filter((t) => t.length > 2));
      check('nothing writes a whole word in the section square', tags.length === 0, tags.join(', '));
    }

    await pg.evaluate(() => { location.hash = '#/'; });
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: `shot-${label}-home.png`, fullPage: label === 'phone' });
    await pg.evaluate(() => { location.hash = '#/run/rc/W3/0'; });
    await pg.waitForSelector('[data-testid=choice]'); await pg.waitForTimeout(200);
    await pg.screenshot({ path: `shot-${label}-runner.png` });
    check('no page/console errors', !errs.length, errs.slice(0, 4).join(' | '));
    await ctx.close();
  }

  /* Time travel, because twice in two days this suite went red overnight with
     nothing committed against it. Neither failure was a render breaking; both
     were the same shape — a rule that held on the day it was written and stopped
     holding on a later one. A mock had a start and no end, so it left the
     dashboard the morning after its week opened. Follow-ups were filtered
     against a week that had already finished, so a paper sat on the wrong seven
     days filed them nowhere.
     
     The dates are taken from the plan rather than typed here, and the ones that
     matter are the holes in it: W3 ends on a Sunday and W4 starts eight days
     later, because the week between is the diagnostic's. `currentWeek()` answers
     "the last week that has begun", so inside a hole it names a week that has
     ended — which is the state both bugs needed. The day after the final week is
     the permanent version of the same hole, and every day after her exam is
     spent in it. */
  {
    const D = JSON.parse(fs.readFileSync(path.join(DIST, 'content', 'bundle.json'), 'utf8'));
    const day = (from, n) => { const d = new Date(from + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const starts = D.weeks.map((w) => D.starts[w.w]).sort();
    const probe = [];
    starts.forEach((st, i) => {
      const next = starts[i + 1];
      const after = day(st, 7);
      if (!next) probe.push({ when: day(st, 9), why: 'after the last plan week' });
      else if (next !== after) { probe.push({ when: after, why: 'first day of a gap in the plan' }); probe.push({ when: day(st, 9), why: 'mid-gap' }); }
    });
    probe.push({ when: day(starts[0], 3), why: 'an ordinary day inside a plan week' });
    for (const { when, why } of probe) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
      const drive = await stubGoogle(ctx);
      const pg = await ctx.newPage();
      await pg.clock.install({ time: new Date(when + 'T10:00:00') });
      await pg.goto('http://localhost:8140/learning/', { waitUntil: 'networkidle' });
      await signIn(pg);
      const openMock = await pg.evaluate(() => {
        const t = new Date();
        const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
        return { k, txt: (document.body.textContent || '').replace(/\s+/g, ' ') };
      });
      /* The id of a between-week is "B:2026-09-21", which is a key and not a
         name. It reached the dashboard — in the line whose whole job is to say
         where she is — and every suite stayed green, because nothing had ever
         had to distinguish a label from a lookup before there were two kinds of
         span to look up. A screenshot caught it. This is so the next one does
         not have to. */
      check(`on ${when} (${why}) no internal span id is shown to her`, !/B:\d{4}-\d{2}-\d{2}/.test(openMock.txt),
        (openMock.txt.match(/.{0,40}B:\d{4}-\d{2}-\d{2}.{0,20}/) || [''])[0]);
      const shouldList = D.mocks.filter((m) => m.start <= openMock.k && openMock.k <= day(m.start, 6));
      check(`on ${when} (${why}) a mock in its own week is still on the dashboard`,
        shouldList.every((m) => openMock.txt.includes(m.name)), shouldList.map((m) => m.name).join(', ') || 'none open');
      // a paper finished on this date has to file its follow-ups on the week the
      // checklist opens by itself, whichever week that turns out to be
      const seedPaper = async () => await pg.evaluate(async () => {
        const bd = await (await fetch('content/bundle.json')).json();
        const m = bd.mocks[0];
        const s = JSON.parse(localStorage.getItem('isee.v1'));
        const secs = {};
        for (const def of m.sections) {
          if (def.id.startsWith('BREAK') || def.id === 'ESSAY') continue;
          const qs = (bd.mockItems[m.id] || {})[def.id] || [];
          const picks = {}, times = {};
          qs.forEach((q, i) => { picks[i] = i % 3 === 0 ? 'A' : (q.k || q.correct); times[i] = 30000; });
          secs[def.id] = { submittedAt: new Date().toISOString(), picks, times, right: qs.filter((q, i) => picks[i] === (q.k || q.correct)).length, started: new Date().toISOString() };
        }
        s.mocks = { ...(s.mocks || {}), [m.id]: { sections: secs, finishedAt: new Date().toISOString(), essay: { submittedAt: new Date().toISOString(), text: 'x '.repeat(220) }, at: new Date().toISOString() } };
        localStorage.setItem('isee.v1', JSON.stringify(s));
      });
      await seedPaper();
      /* Hand the stub Drive the state that was just seeded, rather than emptying
         it and hoping. Emptying it races the app's own debounced push: if that
         push lands first the remote holds the pre-seed document, the reload
         merges it back, and the seed is gone. It went both ways on the same date
         on consecutive runs, which made this check worse than no check —
         five greens out of six for reasons that had nothing to do with the
         thing being tested. Settle, then make the remote agree with the page, so
         the merge has nothing to say either way. */
      /* Wait for the page to stop writing, rather than for a number that was
         long enough on the machine it was written on.
         
         The 1200 ms here was the debounce, guessed at, and under a full gate
         with a vite build competing it is not always enough: the seed is copied
         to the remote before the app's own push has landed, that push then
         overwrites it, and the reload pulls back a document with no mock in it.
         Same family as the two other checks this repo has had to stop guessing
         at. Two identical reads in a row is the condition that actually matters
         — nothing is in flight — and it returns as soon as it holds. */
      let snap = null;
      for (let i = 0; i < 60; i++) {
        const cur = await pg.evaluate(() => localStorage.getItem('isee.v1'));
        if (cur === snap && /finishedAt/.test(cur || '')) break;
        /* The seed goes in underneath a live page, and the page holds the whole
           store in memory and writes it back whole — so a save that was already
           on its way simply erases the paper we just filed. Re-seed until it is
           still there on the next look; the premise check below is what turned
           this from "the follow-ups are missing sometimes" into a reason. */
        if (!/finishedAt/.test(cur || '')) await seedPaper();
        snap = cur;
        await pg.waitForTimeout(250);
      }
      check(`the paper finished on ${when} is on the device before the remote is told`, /finishedAt/.test(snap || ''));
      drive.body = snap;
      await pg.reload({ waitUntil: 'networkidle' });
      await pg.evaluate(() => { location.hash = '#/checklist'; });
      await pg.waitForSelector('[data-testid=ck-item]');
      await pg.waitForTimeout(400);
      const ck = await pg.evaluate(() => (document.body.textContent || '').replace(/\s+/g, ' '));
      check(`and a paper finished on ${when} leaves its follow-ups on the week that opens`,
        /Mock follow-up/.test(ck), why);
      /* And the week it opens on has to be the week she is IN.
       *
       * This is the bug the two checks above were built on top of without ever
       * naming: the checklist asked `currentWeek()`, which answers "the last
       * plan week that has BEGUN", so on all twenty-eight days the plan sets
       * aside between its weeks — the baseline mock, Mock 1, the correction
       * week, Mock 2 — it opened on a week that had already ended and put a
       * "This week" badge on it. The plan names those weeks itself; the page
       * simply did not know they existed.
       *
       * Past the last plan week there is genuinely nothing left to be inside, so
       * the rule there is only that it falls back to something that has begun
       * rather than to nothing at all. */
      check(`and the checklist on ${when} shows her no span ids either`, !/B:\d{4}-\d{2}-\d{2}/.test(ck),
        (ck.match(/.{0,40}B:\d{4}-\d{2}-\d{2}.{0,20}/) || [''])[0]);
      const sp = await pg.evaluate(() => { const e = document.querySelector('[data-testid=week-recap]'); return e ? { id: e.dataset.span, a: e.dataset.a, b: e.dataset.b, kind: e.dataset.kind, now: !!e.querySelector('[data-testid=span-now]') } : null });
      const inside = !!sp && openMock.k >= sp.a && openMock.k <= sp.b;
      check(`on ${when} (${why}) the checklist opens on the span she is actually in`,
        why === 'after the last plan week' ? !!sp && sp.a <= openMock.k : inside,
        sp ? `${sp.id} ${sp.a}–${sp.b}` : 'no span');
      // and the badge is the same fact, so it can never say This week about a week she is not in
      check(`and the "This week" badge on ${when} agrees with the dates`, !!sp && sp.now === inside,
        sp ? `badge=${sp.now} inside=${inside}` : 'no span');
      /* On the span's OWN url, which is where the id can still get out.
       *
       * The check above loaded "#/checklist" with no parameter, so the trail
       * drew two crumbs and there was no third one to be wrong — and the id went
       * on reaching her in the breadcrumb of every url that names a span, which
       * is every url reached by the arrows, by "Back to this week", or by a
       * bookmark. Green, and wrong, because the test walked in through the one
       * door that does not have the bug behind it. */
      await pg.evaluate((id) => { location.hash = '#/checklist/' + id; }, sp.id);
      await pg.waitForSelector('[data-testid=ck-item]');
      await pg.waitForTimeout(300);
      const deep = await pg.evaluate(() => (document.body.textContent || '').replace(/\s+/g, ' '));
      check(`and the span's own url on ${when} names it rather than keying it`, !/B:\d{4}-\d{2}-\d{2}/.test(deep),
        (deep.match(/.{0,40}B:\d{4}-\d{2}-\d{2}.{0,20}/) || [''])[0]);
      const crumb = await pg.evaluate(() => Array.from(document.querySelectorAll('[data-slot=breadcrumb] li')).map((e) => e.textContent.trim()).join(' > '));
      check(`and the trail on ${when} says where she is`, crumb.includes(sp.kind === 'week' ? sp.id : 'mock') || /[A-Za-z]/.test(crumb.split('>').pop()), crumb);
      /* A week she has finished, that she is still inside.
       *
       * The plan's weeks are seven days whether or not the work takes seven
       * days — a paper sat on the Sunday can leave six days of a page reading
       * 100% with every row struck through and no sign of what happens next.
       * The banner says so and hands her the next span. Asserted as the
       * invariant rather than against a fixed date, because whether a span is
       * clear depends on the review pile, which moves on its own: it is shown
       * exactly when every plan row on the page is ticked, and never otherwise. */
      const clear = await pg.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('[data-testid=ck-item][data-auto="1"]'));
        return { banner: !!document.querySelector('[data-testid=span-clear]'), rows: rows.length, done: rows.filter((r) => r.dataset.done === '1').length };
      });
      check(`on ${when} the done-with-this-week banner matches the rows`,
        clear.banner === (clear.rows > 0 && clear.done === clear.rows),
        `banner=${clear.banner} ${clear.done}/${clear.rows} ticked`);

      /* And the positive case, forced once, because a check that only ever sees
         one answer is not checking anything. Every probe above happens to have
         something outstanding — the review pile moves on its own schedule — so
         the pile is pushed into next year and the week is then genuinely
         finished, which is the state the banner exists for. */
      // only where the review pile is the ONE thing left: a span whose mock is
      // still unsat is not finished by emptying the pile, and asking it to say
      // so would be asking the page to lie
      if (clear.rows > 0 && clear.done === clear.rows - 1) {
        for (let i = 0; i < 10; i++) {
          await pg.evaluate(() => {
            const s = JSON.parse(localStorage.getItem('isee.v1'));
            for (const k of Object.keys(s.items || {})) if (s.items[k].due) s.items[k].due = '2027-01-01T00:00:00.000Z';
            localStorage.setItem('isee.v1', JSON.stringify(s));
          });
          await pg.waitForTimeout(250);
          const held = await pg.evaluate(() => Object.values(JSON.parse(localStorage.getItem('isee.v1')).items || {}).every((r) => !r.due || r.due > '2026-12'));
          if (held) { drive.body = await pg.evaluate(() => localStorage.getItem('isee.v1')); break; }
        }
        await pg.reload({ waitUntil: 'networkidle' });
        await pg.evaluate(() => { location.hash = '#/checklist'; });
        await pg.waitForSelector('[data-testid=week-recap]');
        await pg.waitForTimeout(400);
        const done = await pg.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('[data-testid=ck-item][data-auto="1"]'));
          const n = document.querySelector('[data-testid=span-next]');
          return { banner: !!document.querySelector('[data-testid=span-clear]'), next: n ? n.textContent.replace(/\s+/g, ' ').trim() : null, ticked: rows.filter((r) => r.dataset.done === '1').length, rows: rows.length };
        });
        check(`with nothing outstanding on ${when}, the week says it is done and offers the next one`,
          done.banner && !!done.next && done.ticked === done.rows, `banner=${done.banner} next=${done.next} ${done.ticked}/${done.rows}`);
      }

      /* Forward goes forward IN TIME, whichever kind of span comes next. The
         arrows used to walk D.weeks, so from a between-week they had no index to
         start from; now they walk the plan's real sequence and the week after
         the baseline mock is W4, the way the plan reads. */
      const fwd = await pg.$('[aria-label="Next week"]');
      if (fwd && !(await fwd.isDisabled())) {
        await fwd.click();
        await pg.waitForTimeout(250);
        const nx = await pg.evaluate(() => { const e = document.querySelector('[data-testid=week-recap]'); return e ? { id: e.dataset.span, a: e.dataset.a } : null });
        check(`and forward from ${sp.id} on ${when} goes to the next span in time`, !!nx && nx.a > sp.a, nx ? `${sp.id} -> ${nx.id}` : 'no span');
      }
      await ctx.close();
    }
  }

  await b.close(); srv.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})();
