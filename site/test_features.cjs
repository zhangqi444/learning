/* Essay, precision review, mock exams and calendar — against dist/ under /learning/. */
const { chromium } = require('playwright');
const { stubGoogle, signIn } = require('./test_google.cjs');
const http = require('http'), fs = require('fs'), path = require('path');
const DIST = path.join(__dirname, 'dist');
const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (!p.startsWith('/learning')) { res.writeHead(404); return res.end(); }
  p = p.slice('/learning'.length) || '/'; if (p === '/') p = '/index.html';
  const f = path.join(DIST, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
});
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
let failures = 0; const check = (n, ok, x) => { console.log((ok ? '  ok   ' : '  FAIL ') + n + (x ? '  ' + x : '')); if (!ok) failures++; };
const body = async (pg) => (await pg.textContent('body')).replace(/\s+/g, ' ');
/** Answer every question in the open runner with choice `pick`. After each Next it waits for the
 *  runner to actually move on (the counter changes or the score card appears) instead of sleeping,
 *  which is what made the old 30 ms loops stall on a loaded machine. */
async function runThrough(pg, pick, max = 60) {
  for (let k = 0; k < max; k++) {
    if (!(await pg.$('[data-testid=question]'))) break;
    const before = await pg.textContent('[data-testid=counter]');
    await pg.click(`[data-testid=choice] >> nth=${pick}`);
    await pg.click('[data-testid=next]');
    await pg.waitForFunction((b) => { const c = document.querySelector('[data-testid=counter]'); return !c || c.textContent !== b || !!document.querySelector('[data-testid=score]'); }, before, { timeout: 10000 });
  }
}

(async () => {
  await new Promise((r) => srv.listen(8143, r));
  const b = await chromium.launch({ executablePath: exe });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const drive = await stubGoogle(ctx);
  const pg = await ctx.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  pg.on('dialog', (d) => d.accept());
  await pg.goto('http://localhost:8143/learning/', { waitUntil: 'networkidle' });
  await signIn(pg);   // the site is gated: get through the door first

  console.log('== sidebar + dashboard');
  const side = await pg.$$eval('[data-slot=sidebar-menu-button]', (n) => n.map((x) => x.textContent.trim()));
  check('sidebar has Essay / Mock exams / Calendar', ['Essay', 'Mock exams', 'Calendar'].every((t) => side.includes(t)), side.join(','));
  check('Essay sits with the subjects (after Reading Comprehension)', side.indexOf('Essay') === side.indexOf('Reading Comprehension') + 1);
  check('the ISEE subject and the reading log are told apart in the nav', side.indexOf('Reading Comprehension') >= 0 && side.indexOf('Reading') > side.indexOf('Reading Comprehension'), side.join(','));
  // The nav is grouped, and what is in which group is a design decision worth
  // holding: the world's two live together, and the Wordwood stays with the
  // practice because it produces the same evidence the word quiz does. Keyed on
  // group POSITION rather than on the labels, which are the world's nouns and
  // still Sheila's to rename.
  const groups = await pg.$$eval('[data-slot=sidebar-group]', (n) => n.map((g) => ({
    label: (g.querySelector('[data-slot=sidebar-group-label]') || {}).textContent || '',
    items: [...g.querySelectorAll('[data-slot=sidebar-menu-button]')].map((b) => b.textContent.trim()),
  })));
  const labelled = groups.filter((g) => g.label);
  check('the nav is grouped, not one long list', labelled.length >= 2, labelled.map((g) => g.label).join(' | '));
  const world = labelled[0];
  check("the world's own two sit together, away from the work", world.items.length === 2, world.label + ': ' + world.items.join(','));
  check('and the Wordwood is not among them — it is practice, and it counts',
    !world.items.some((t) => /wood/i.test(t)) && groups[0].items.some((t) => /wood/i.test(t)), groups[0].items.join(','));
  check('nothing calls it "Games", which would mean "the fun after the work"',
    !/game/i.test(await pg.textContent('[data-slot=sidebar]')), world.label);
  check('Essay sits in the Subjects card as its own row', /Essay/.test(await pg.textContent('[data-testid=subjects]')) && /0 of 8 weeks/.test(await pg.textContent('[data-testid=subjects]')));
  check('dashboard Coming up lists a mock', /Coming up.*Split diagnostic/.test(await body(pg)));
  // Her first Glim is derived from her own record — the first word she ever put
  // into her own words — so it is hers, not ours, and cannot be faked.
  const firstCat = await pg.$eval('[data-testid=first-glim]', (e) => e.dataset.word).catch(() => null);
  check('the first cat that ever came is drawn on the dashboard', !!firstCat, firstCat || 'none — no word met yet');
  check('and it is the earliest word in her own record, not a chosen one', await pg.evaluate((w) => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    const times = [];
    for (const wk of Object.keys(s.precision || {})) {
      for (const [word, r] of Object.entries((s.precision[wk] || {}).words || {})) {
        if (r && String(r.text || '').trim() && r.at) times.push([r.at, word]);
      }
    }
    times.sort();
    return !times.length || times[0][1] === w || times[0][0] === (times.find(([, x]) => x === w) || [])[0];
  }, firstCat), firstCat);

  console.log('== VR plays as the gate');
  // Render-only checks: these answer nothing, so they write no records and are
  // safe to run here rather than in the runs-last region at the bottom.
  await pg.evaluate(() => { location.hash = '#/run/vr/W2/0'; });
  await pg.waitForSelector('[data-testid=question]');
  check('a Verbal Reasoning set is drawn as a gate', (await pg.$('[data-testid=gate]')) !== null && /Your spells/i.test(await body(pg)));
  check('the item itself is unchanged underneath', (await pg.$$('[data-testid=choice]')).length === 4);
  // The rehearsal must stay a rehearsal: on the day it counts the four choices
  // are plain words on white, so no cat is ever drawn on a choice row. The
  // Wordwood is the game and its controls wear faces; a practice set does not.
  check('the choices stay plain — no cat on a row she will meet undecorated on the day',
    (await pg.$$('[data-testid=choice] [data-testid=glim]')).length === 0);
  check('and nothing is at the gate before she answers', (await pg.$('[data-testid=gate] ~ [data-testid=glim]')) === null);
  await pg.evaluate(() => { location.hash = '#/run/ma/W2/0'; });
  await pg.waitForSelector('[data-testid=question]');
  check('maths is left plain — the frame is not sprayed over everything', (await pg.$('[data-testid=gate]')) === null);
  // The cat reacts AROUND the question, never inside it. Maths, Quantitative and
  // Reading get their skill's own cat on the reveal — the same cat the Glimbook
  // holds — while the question and the four choices stay exactly as printed.
  check('nothing is drawn on a maths question or its choices',
    (await pg.$$('[data-testid=question] [data-testid=glim]')).length === 0 && (await pg.$$('[data-testid=choice] [data-testid=glim]')).length === 0);
  await pg.click('[data-testid=choice] >> nth=0');
  await pg.waitForSelector('[data-testid=reveal]');
  const react = await pg.$eval('[data-testid=reveal] [data-testid=glim]', (e) => e.dataset.word).catch(() => null);
  check('but a cat turns up beside the answer, and it is the skill\'s own cat', !!react && /^ma:/.test(react), react || 'none');
  const skillOf = await pg.$$eval('[data-testid=glim]', (n) => n.map((e) => e.dataset.stage));
  check('and never drawn dimmer than Steady, so being right is never faint', skillOf.every((s) => ['Steady', 'Bright', 'Radiant'].includes(s)), skillOf.join(','));

  console.log('== precision review');
  await pg.evaluate(() => { location.hash = '#/s/vr/W1'; });
  await pg.waitForSelector('[data-testid=precision-row]');
  check('VR week card shows Session 1 row', /Session 1 · Precision review/.test(await body(pg)));
  await pg.click('[data-testid=precision-row]');
  await pg.waitForSelector('[data-testid=pword]');
  const cards = await pg.$$('[data-testid=pword]');
  check('20 word cards', cards.length === 20);
  const filled = await pg.$$eval('[data-testid=pword] textarea', (n) => n.filter((t) => t.value.trim()).length);
  check('her 19 Week-1 responses migrated', filled === 19, filled + ' filled');
  check('W1 shows as submitted (from the sheet)', /Submitted/.test(await body(pg)));
  const first = await pg.$eval('[data-testid=pword] textarea', (t) => t.value);
  check('first response is hers', /benign/.test(first), first.slice(0, 40));
  // This is where she MEETS the cat, so this is where it has to be drawn — and
  // it can never be brighter than her record for that word.
  const metCats = await pg.$$eval('[data-testid=pword] [data-testid=glim]', (n) => n.map((e) => e.dataset.word + ':' + e.dataset.stage));
  check('every word on the page wears its own face', metCats.length >= 20 && new Set(metCats.map((c) => c.split(':')[0])).size >= 20, metCats.slice(0, 2).join(' | '));
  check('a word she has written is out of the shadows', metCats.some((c) => !c.endsWith(':Unseen')), metCats.find((c) => !c.endsWith(':Unseen')) || 'all Unseen');
  await pg.click('[data-testid=pword] >> nth=0 >> [data-testid=reveal]');
  await pg.waitForSelector('[data-testid=meaning]');
  check('Check meaning reveals the Vocabulary Master entry', /harmless/.test(await pg.textContent('[data-testid=meaning]')));
  // W2: write one answer, rate it, persists after reload
  await pg.evaluate(() => { location.hash = '#/precision/W2'; });
  await pg.waitForSelector('[data-testid=pword]');
  check('W2 is a cluster week', /imply \/ infer/.test(await body(pg)));
  // A cluster is two words, so it is two cats — the same two the Wordwood will
  // call by name. One cat for "imply / infer" would mean the cat at the gate is
  // not the cat on the page.
  check('a cluster entry is drawn as two cats, one per name',
    (await pg.$$eval('[data-testid=pword] >> nth=0 >> [data-testid=glim]', (n) => n.map((e) => e.dataset.word))).join(',') === 'imply,infer');
  // W2 is untouched here, so it is the honest before/after for the arrival.
  const dark2 = await pg.$$eval('[data-testid=pword] [data-testid=glim]', (n) => n.map((e) => e.dataset.stage));
  check('a week she has not opened is all shadow', dark2.length > 20 && dark2.every((s) => s === 'Unseen'), [...new Set(dark2)].join(','));
  await pg.fill('[data-testid=pword] >> nth=0 >> textarea', 'imply is the speaker hinting; infer is the listener figuring it out');
  await pg.click('[data-testid=pword] >> nth=0 >> [data-testid=conf-3]');
  await pg.waitForTimeout(700);
  const lit = await pg.$$eval('[data-testid=pword] >> nth=0 >> [data-testid=glim]', (n) => n.map((e) => e.dataset.stage));
  check('writing a word in her own words brings its cat into the light', lit.every((s) => s !== 'Unseen'), lit.join(','));
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=pword]');
  check('precision response + confidence persist', (await pg.$eval('[data-testid=pword] >> nth=0 >> textarea', (t) => t.value)).includes('speaker hinting') && /1\/20 written/.test(await body(pg)));
  check('submit disabled until every word is answered', await pg.$eval('[data-testid=submit-precision]', (b) => b.disabled));

  console.log('== essay');
  await pg.evaluate(() => { location.hash = '#/essay'; });
  await pg.waitForSelector('[data-testid=essay-open-W1]');
  check('8 essay weeks listed with prompts', (await pg.$$('[data-testid^=essay-open-]')).length === 8 && /small responsibility/.test(await body(pg)));
  await pg.click('[data-testid=essay-open-W2]');
  await pg.waitForSelector('[data-testid=essay-prompt]');
  check('W2 prompt shown', /changed your mind/.test(await pg.textContent('[data-testid=essay-prompt]')));
  await pg.fill('#W2-plan-focus', 'I will show that listening changed my mind about the science fair.');
  await pg.click('text=Draft · 20');
  await pg.fill('#W2-draft-opening', 'Last spring I was sure my volcano would win. Then my friend showed me her seed experiment and I started to listen.');
  await pg.fill('#W2-draft-middle', 'She had measured every plant for three weeks. I had only mixed baking soda and vinegar once. I realized that a real experiment needs careful data, so I changed my project.');
  await pg.fill('#W2-draft-ending', 'Now I understand that changing my mind is not losing; it is learning.');
  await pg.waitForTimeout(700);
  check('word count updates', /\d{2,} words/.test(await body(pg)));
  await pg.click('text=Revise · 5');
  await pg.waitForSelector('[data-testid=revise-tasks]');
  check('revise is three concrete jobs, not a self-rating', (await pg.$$('[data-testid^=revise-task-]')).length === 3);
  check('the judgement calls are put away for a grown-up', await pg.$eval('[data-testid=adult-checks]', (d) => !d.open) && /Sheila does not need to fill these in/.test(await body(pg)));
  await pg.fill('#W2-revise-learned', 'I learned that listening to someone else can change what I think.');
  await pg.fill('#W2-revise-splitBefore', 'She had measured every plant for three weeks and I had only mixed baking soda once and I realized a real experiment needs data so I changed my project.');
  await pg.fill('#W2-revise-splitAfter', 'She had measured every plant for three weeks. I had only mixed baking soda once. A real experiment needs data, so I changed my project.');
  await pg.waitForTimeout(700);
  await pg.click('[data-testid=adult-checks] >> summary');
  check('the rubric is still there underneath, with her ratings intact', (await pg.$$('[data-testid=adult-checks] [data-slot=card] , [data-testid=adult-checks] textarea')).length >= 1 && /Growth|Idea generation/.test(await body(pg)));
  await pg.waitForSelector('[data-testid=essay-complete]');
  await pg.click('[data-testid=essay-complete]');
  await pg.waitForSelector('text=Complete');
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=essay-prompt]');
  const completeBadge = /Complete/.test(await pg.textContent('[data-slot=card-action]'));
  await pg.click('text=Plan · 5'); await pg.waitForSelector('#W2-plan-focus');
  check('essay draft + completion persist', completeBadge && (await pg.$eval('#W2-plan-focus', (t) => t.value)).includes('listening'));
  await pg.click('text=Revise · 5'); await pg.waitForSelector('[data-testid=revise-tasks]');
  check('the revision work is kept too', (await pg.$eval('#W2-revise-learned', (t) => t.value)).includes('change what I think') && (await pg.$eval('#W2-revise-splitAfter', (t) => t.value)).includes('needs data'));
  // time log: typed by hand next to each phase timer, totalled in the header, kept
  const logMinutes = async (phase, tab, m) => { await pg.click(`text=${tab}`); await pg.click(`[data-testid=timer-log-${phase}]`); await pg.fill(`[data-testid=essay-time-${phase}]`, m); await pg.press(`[data-testid=essay-time-${phase}]`, 'Enter'); };
  await logMinutes('plan', 'Plan · 5', '6');
  await logMinutes('draft', 'Draft · 20', '19');
  await logMinutes('revise', 'Revise · 5', '4');
  await pg.waitForTimeout(200);
  check('time log totals the three phases against the 30-minute target', /29 of 30 min/.test(await pg.textContent('[data-testid=essay-time-total]')) && /4 min/.test(await pg.textContent('[data-testid=essay-time-revise-logged]')));
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=essay-time-total]');
  await pg.click('text=Draft · 20'); await pg.waitForSelector('[data-testid=essay-time-draft-logged]');
  check('time log persists', /19 min/.test(await pg.textContent('[data-testid=essay-time-draft-logged]')) && /29 of 30 min/.test(await pg.textContent('[data-testid=essay-time-total]')));
  await pg.click('text=Plan · 5'); await pg.click('[data-testid=timer-start-plan]');
  await pg.waitForTimeout(700); await pg.click('[data-testid=timer-stop-plan]');
  await pg.waitForTimeout(200);
  check('stopping a phase timer writes its minutes into the log', /1 min/.test(await pg.textContent('[data-testid=essay-time-plan-logged]')) && /24 of 30 min/.test(await pg.textContent('[data-testid=essay-time-total]')));
  // the first site version kept a free-text "time at draft stop"; it still counts
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); s.essays.W3 = { meta: { minutes: '18 min' }, at: new Date().toISOString() }; localStorage.setItem('isee.v1', JSON.stringify(s)); location.hash = '#/essay/W3'; });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=essay-time-total]');
  await pg.click('text=Draft · 20'); await pg.waitForSelector('[data-testid=essay-time-draft-logged]');
  check('the old free-text draft time still counts as draft minutes', /18 min/.test(await pg.textContent('[data-testid=essay-time-draft-logged]')) && /18 of 30 min/.test(await pg.textContent('[data-testid=essay-time-total]')));
  await pg.evaluate(() => { location.hash = '#/essay'; }); await pg.waitForSelector('[data-testid=essay-time-W2]');
  check('the week list shows the minutes logged', /24 min logged/.test(await pg.textContent('[data-testid=essay-time-W2]')) && /18 min logged/.test(await pg.textContent('[data-testid=essay-time-W3]')));
  await pg.click('[data-testid=essay-open-W2]'); await pg.waitForSelector('[data-testid=essay-prompt]');
  await pg.click('text=Guide');
  check('guide shows the eight lessons', /Read the prompt precisely/.test(await body(pg)) && /Revise, then edit/.test(await body(pg)));

  console.log('== mock exam');
  await pg.evaluate(() => { location.hash = '#/mock'; });
  await pg.waitForSelector('[data-testid=mock-open-DGN]');
  check('four forms listed', (await pg.$$('[data-testid^=mock-open-]')).length === 4);
  await pg.click('[data-testid=mock-open-DGN]');
  await pg.waitForSelector('[data-testid=mock-next]');
  check('split diagnostic shows Part A / Part B', /Part A/.test(await body(pg)) && /Part B/.test(await body(pg)));
  await pg.click('[data-testid=mock-next]');                       // VR
  await pg.waitForSelector('[data-testid=mock-start]');
  check('essay/answers not visible before start', !/most nearly means/.test(await body(pg)));
  await pg.click('[data-testid=mock-start]');
  await pg.waitForSelector('[data-testid=mock-timer]');
  const t0 = await pg.textContent('[data-testid=mock-timer]');
  check('VR timer starts near 20:00', /19:5\d|20:00/.test(t0), t0.trim());
  for (let k = 0; k < 5; k++) { await pg.click('[data-testid=choice] >> nth=1'); await pg.click('[data-testid=mock-next-q]'); }
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=mock-timer]');
  check('section resumes after reload, timer still running', /19:[0-5]\d/.test(await pg.textContent('[data-testid=mock-timer]')) && /5\/34 answered/.test(await body(pg)));
  // jump to the last question via palette and submit (dialog auto-accepted)
  await pg.click('text=All questions');
  await pg.click('button:has-text("34")');
  await pg.click('[data-testid=choice] >> nth=1');
  await pg.click('[data-testid=mock-submit]');
  await pg.waitForSelector('[data-testid=mock-score]');
  const sc = await pg.textContent('[data-testid=mock-score]');
  check('section submitted with raw score', /\d+\s*\/\s*34/.test(sc.replace(/\s+/g, ' ')), sc.replace(/\s+/g, ' ').slice(0, 80));
  check('misses stay hidden until the form is done', /unlocks when the whole form/.test(sc));
  // finish the rest quickly through the store, then the essay
  await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    for (const id of ['QR', 'RC', 'MA']) s.mocks.DGN.sections[id] = { started: Date.now() - 60000, endsAt: Date.now() + 60000, picks: { 0: 'A' }, submittedAt: new Date().toISOString(), right: 1, n: id === 'QR' ? 38 : id === 'RC' ? 25 : 30, timeUsed: 60000 };
    localStorage.setItem('isee.v1', JSON.stringify(s)); location.hash = '#/mock/DGN/ESSAY';
  });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=mock-essay-start]');
  check('mock essay prompt hidden before start', !/others had overlooked/.test(await body(pg)));
  await pg.click('[data-testid=mock-essay-start]');
  await pg.waitForSelector('[data-testid=mock-essay-prompt]');
  check('mock essay prompt revealed after start', /others had overlooked/.test(await pg.textContent('[data-testid=mock-essay-prompt]')));
  await pg.fill('[data-testid=mock-essay-text]', 'Last summer I noticed a loose board on the dock that everyone stepped over. I told the lifeguard and we fixed it together.');
  await pg.click('[data-testid=mock-essay-submit]');
  await pg.waitForSelector('text=See results');
  await pg.click('text=See results');
  await pg.waitForSelector('[data-testid=mock-corrections]');
  const ov = await body(pg);
  check('results table + missed questions once the whole form is done', /Results/.test(ov) && /Missed questions · \d+/.test(ov) && /raw correct/.test(ov));
  check('next steps worked out from the mock', (await pg.$('[data-testid=next-steps]')) !== null && /Next steps this week/.test(ov));
  check('stanine estimate per section in the results', /≈Stanine/.test(ov));
  check('mock misses carry cause tags', (await pg.$$('[data-testid=cause-tags]')).length >= 3);
  await pg.click('[data-testid=cause-tags] >> nth=0 >> [data-testid=tag-rushed]');
  await pg.waitForTimeout(200);
  check('tagging a mock miss sticks', (await pg.$eval('[data-testid=cause-tags] >> nth=0', (e) => e.dataset.tag)) === 'rushed');
  await pg.evaluate(() => { location.hash = '#/mock'; }); await pg.waitForSelector('[data-testid=band-card]');
  check('mock list shows the estimated band card', /Estimated score band/.test(await body(pg)) && /stanine/i.test(await body(pg)));
  await pg.evaluate(() => { location.hash = '#/mock/DGN'; }); await pg.waitForSelector('[data-testid=mock-corrections]');
  await pg.click('[data-testid=mock-corrections]');
  await pg.waitForSelector('[data-testid=choice]');
  check('corrections drill opens as a runner', /Corrections/.test(await body(pg)));

  console.log('== essay review');
  // a review made outside the app arrives as a link: #/import/<base64url JSON>
  const review = { target: { kind: 'essay', wk: 'W2' }, at: '2026-09-05T18:00:00Z', reviewer: 'Claude, asked by Dad', source: 'her progress file in Google Drive', summary: 'You changed your mind on the page, and the reader can see why.', strengths: ['The seed experiment is a real, specific detail.'], suggestions: ['Say what you said to your friend when you gave up the volcano.'], next: 'Add one sentence of dialogue.', rubric: { Specificity: 3, Structure: 2, Bogus: 9 } };
  const payload = Buffer.from(JSON.stringify(review)).toString('base64url');
  await pg.evaluate((p) => { location.hash = '#/import/' + p; }, payload);
  await pg.waitForSelector('[data-testid=import-preview]');
  check('an import link previews the review before adding it', /Essay · W2/.test(await body(pg)) && /Claude, asked by Dad/.test(await body(pg)));
  await pg.click('[data-testid=import-add]');
  await pg.waitForSelector('[data-testid=essay-review]');
  const rvText = await pg.textContent('[data-testid=essay-review]');
  check('adding it opens the essay with the review under the prompt',/#\/essay\/W2$/.test(await pg.evaluate(() => location.hash)) && /seed experiment is a real/.test(rvText) && /For next week/.test(rvText) && /Google Drive/.test(rvText));
  check('rubric chips use the content rubric and drop unknown dimensions', /Specificity · 3/.test(await pg.textContent('[data-testid=review-rubric]')) && !/Bogus/.test(rvText));
  check('the review is stored with her progress and marked read', await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const r = s.reviews['essay:W2:2026-09-05']; return !!r && r.target.wk === 'W2' && r.v === 1 && !!s.reviewsSeen['essay:W2:2026-09-05']; }));
  await pg.evaluate(() => { location.hash = '#/essay'; }); await pg.waitForSelector('[data-testid=essay-reviewed-W2]');
  check('the week card says Reviewed, with no dot once read', (await pg.$eval('[data-testid=essay-reviewed-W2]', (e) => e.dataset.unread)) === '0');
  // a second review lands from Drive while she is away: a dot in the sidebar, a job on Today
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); s.reviews['essay:W3:2026-09-06'] = { id: 'essay:W3:2026-09-06', v: 1, target: { kind: 'essay', wk: 'W3' }, at: '2026-09-06T18:00:00Z', reviewer: 'Mum', summary: 'A brave start.', strengths: [], suggestions: [], next: '' }; localStorage.setItem('isee.v1', JSON.stringify(s)); location.hash = '#/'; });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=today]');
  check('an unread review is a dot in the sidebar and a job on Today', (await pg.$('[data-testid=reviews-new]')) !== null && /Essay · W3 · read the review/.test(await pg.textContent('[data-testid=today-jobs]')));
  // the paste box, for a phone that cannot open the long link
  await pg.evaluate(() => { location.hash = '#/import'; }); await pg.waitForSelector('[data-testid=import-text]');
  await pg.fill('[data-testid=import-text]', 'not a review'); await pg.click('[data-testid=import-paste-add]');
  check('a bad paste is refused in plain words', /does not look like a review/.test(await body(pg)));
  await pg.fill('[data-testid=import-text]', JSON.stringify({ target: { kind: 'mock', form: 'DGN' }, summary: 'You fixed the board and told the story straight.', reviewer: 'Dad' }));
  await pg.click('[data-testid=import-paste-add]'); await pg.waitForSelector('[data-testid=essay-review]');
  check('a pasted review of the mock essay opens on that essay', /#\/mock\/DGN\/ESSAY$/.test(await pg.evaluate(() => location.hash)) && /fixed the board/.test(await pg.textContent('[data-testid=essay-review]')));

  // a weekly digest: same import path, lands on the checklist, its follow-ups become items
  const digest = { target: { kind: 'week', wk: 'W2' }, at: '2026-09-13T18:00:00Z', reviewer: 'Claude, asked by Dad', summary: 'A strong week — the review pile went to zero.', strengths: ['You cleared every due question.'], suggestions: ['Read the RC question twice before the choices.'], next: 'One mixed set early in the week.', actions: [{ text: 'Redo the W1 verbal set that still has misses', wk: 'W3', path: '/run/vr/W1/1' }, { text: 'Ask about "subordinate"', wk: 'W2' }] };
  await pg.evaluate((p) => { location.hash = '#/import/' + p; }, Buffer.from(JSON.stringify(digest)).toString('base64url'));
  await pg.waitForSelector('[data-testid=import-add]');
  await pg.click('[data-testid=import-add]');
  await pg.waitForSelector('[data-testid=essay-review]');
  check('a week digest opens on that week\'s checklist', /#\/checklist\/W2$/.test(await pg.evaluate(() => location.hash)) && /How the week went/.test(await pg.textContent('[data-testid=essay-review]')));
  check('the digest lists its follow-ups with the week each belongs to', /W3/.test(await pg.textContent('[data-testid=review-actions]')) && /Redo the W1 verbal set/.test(await pg.textContent('[data-testid=review-actions]')));
  const wkBody = await body(pg);
  check('a follow-up for this week becomes a checklist row', /Follow-up/.test(wkBody) && /Ask about "subordinate"/.test(wkBody));
  await pg.evaluate(() => { location.hash = '#/checklist/W3'; }); await pg.waitForSelector('[data-testid=ck-item]');
  check('a follow-up aimed at a later week lands in that week', /Redo the W1 verbal set/.test(await body(pg)));
  // ticking one sticks, and it is not counted as plan progress
  const beforePct = await pg.textContent('[data-slot=card-action]');
  await pg.click('[data-testid=ck-item][data-done="0"] >> nth=-1 >> button >> nth=0');
  await pg.waitForTimeout(250);
  check('plan progress ignores follow-ups', (await pg.textContent('[data-slot=card-action]')) === beforePct, beforePct);
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=ck-item]');
  check('a ticked follow-up stays ticked', (await pg.$$eval('[data-testid=ck-item][data-done="1"]', (n) => n.length)) >= 1);
  // a monthly digest can point work at any week
  const monthly = { target: { kind: 'month', m: '2026-09' }, at: '2026-09-30T18:00:00Z', reviewer: 'Mum', summary: 'September in one page.', strengths: ['Eight reading days.'], suggestions: [], actions: [{ text: 'Book the October mock slot', wk: 'W4' }] };
  await pg.evaluate((p) => { location.hash = '#/import/' + p; }, Buffer.from(JSON.stringify(monthly)).toString('base64url'));
  await pg.waitForSelector('[data-testid=import-add]'); await pg.click('[data-testid=import-add]');
  await pg.waitForSelector('[data-testid=essay-review]');
  check('a month digest opens on that month', /#\/checklist\/month\/2026-09$/.test(await pg.evaluate(() => location.hash)) && /How the month went/.test(await pg.textContent('[data-testid=essay-review]')));
  await pg.evaluate(() => { location.hash = '#/checklist/W4'; }); await pg.waitForSelector('[data-testid=ck-item]');
  check('a month digest can put an item in a named week', /Book the October mock slot/.test(await body(pg)));

  console.log('== instant marking');
  await pg.evaluate(() => { location.hash = '#/run/vr/W3/0'; });
  await pg.waitForSelector('[data-testid=question]');
  check('instant marking is on by default in practice', /Instant on/.test(await pg.textContent('[data-testid=instant-toggle]')));
  await pg.click('[data-testid=choice] >> nth=0');
  await pg.waitForSelector('[data-testid=reveal]');
  const marks = await pg.$$eval('[data-testid=choice]', (n) => n.map((e) => e.getAttribute('data-mark')));
  check('the key is marked right and exactly one row is marked', marks.filter((m) => m === 'right').length === 1, marks.join(','));
  // the transition has to settle before the colour is readable
  await pg.waitForTimeout(400);
  const badge = await pg.$eval('[data-testid=choice][data-mark=right] >> nth=0', (e) => getComputedStyle(e.querySelector('span')).backgroundColor);
  check('the right answer actually turns green, not just gets an attribute', badge === 'rgb(26, 141, 85)', badge);
  await pg.click('[data-testid=choice] >> nth=2');
  check('an answered question cannot be changed', (await pg.$$eval('[data-testid=choice][data-state=checked]', (n) => n.length)) === 1);
  await pg.click('[data-testid=instant-toggle]');
  check('instant can be turned off', /Instant off/.test(await pg.textContent('[data-testid=instant-toggle]')) && (await pg.$('[data-testid=reveal]')) === null);
  await pg.click('[data-testid=instant-toggle]');
  check('sound has a mute control in the header', (await pg.$('[data-testid=mute-toggle]')) !== null);

  console.log('== the Base');
  await pg.evaluate(() => { location.hash = '#/base'; });
  await pg.waitForSelector('[data-testid=rooms]');
  const balBefore = +(await pg.textContent('[data-testid=base-balance]'));
  // the number, not the word for the currency: the world's nouns are still
  // placeholders until Sheila names them, and a test should not pin them down
  const priced = await pg.$$eval('[data-testid=room][data-built="0"] [data-slot=badge]', (n) => n.map((e) => parseInt((e.textContent || '').trim(), 10)));
  check('every unbuilt room shows a fixed price, none of them random', priced.length === 7 && priced.every((p) => p > 0), priced.join(','));
  check('nothing is built to start with', (await pg.$$eval('[data-testid=room][data-built="1"]', (n) => n.length)) === 0);
  // Every thing carries real care guidance and names where it came from, because
  // this is advice about a real animal and the content rule applies to it.
  const sources = await pg.$$eval('[data-testid=room] a[href^="https://"]', (n) => n.map((a) => a.href));
  check('each thing says what a cat needs and cites who says so', sources.length === 7 && new Set(sources).size > 1, sources.slice(0, 2).join(' '));
  // Building means getting the care question right. A wrong answer must cost
  // nothing and be answerable again: this is a child who wants a cat, and the
  // Den must never punish (hard rule 3).
  await pg.click('[data-testid=build-word-lab]');
  await pg.waitForSelector('[data-testid=care-check]');
  const key = await pg.$eval('[data-testid=care-check]', (e) => e.dataset.id);
  const wrongIdx = await pg.$$eval('[data-testid=care-choice]', (n) => n.length) - 1;
  await pg.click(`[data-testid=care-choice] >> nth=${wrongIdx}`);
  await pg.waitForSelector('[data-testid=care-why]');
  check('a wrong care answer explains itself and buys nothing', key === 'word-lab'
    && (await pg.$$eval('[data-testid=room][data-built="1"]', (n) => n.length)) === 0
    && +(await pg.textContent('[data-testid=base-balance]')) === balBefore);
  check('and it can simply be answered again', (await pg.$('[data-testid=retry-word-lab]')) !== null);
  await pg.click('[data-testid=retry-word-lab]');
  const rightIdx = await pg.$$eval('[data-testid=care-choice]', (n) => n.length);
  for (let k = 0; k < rightIdx; k++) {
    await pg.click(`[data-testid=care-choice] >> nth=${k}`);
    if (await pg.$('[data-testid=confirm-word-lab]')) break;
    await pg.click('[data-testid=retry-word-lab]');
  }
  await pg.click('[data-testid=confirm-word-lab]');
  await pg.waitForSelector('[data-testid=room][data-id=word-lab][data-built="1"]');
  const balAfter = +(await pg.textContent('[data-testid=base-balance]'));
  check('building a thing spends exactly its published price', balBefore - balAfter === 60, `${balBefore} -> ${balAfter}`);
  // Cat care is not ISEE practice and must never leak into the engine.
  check('and knowing about cats is not recorded as practice', await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    return !Object.keys(s.items || {}).some((k) => /care|cat|chip|collar/i.test(k)) && !s.catcare;
  }));
  check('a built room reports its lights from real mastery', (await pg.$('[data-testid=room][data-id=word-lab] [data-testid=room-light]')) !== null);
  // one wallet: Sparks spent on a room are not still available for a reward
  await pg.evaluate(() => { location.hash = '#/rewards'; });
  await pg.waitForSelector('[data-testid=wallet-balance]');
  check('the Base and the reward shelf draw on the same Sparks', +(await pg.textContent('[data-testid=wallet-balance]')) === balAfter, await pg.textContent('[data-testid=wallet-balance]'));
  await pg.evaluate(() => { location.hash = '#/base'; });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=rooms]');
  check('a built room survives a reload and cannot be un-built', (await pg.$eval('[data-testid=room][data-id=word-lab]', (e) => e.dataset.built)) === '1' && (await pg.$('[data-testid=build-word-lab]')) === null);
  // Real cats. The invented ones are labelled as invented, and the advocacy is
  // sourced the same way the care guidance is — and asks nobody for money.
  await pg.waitForSelector('[data-testid=real-cats]');
  await pg.click('[data-testid=real-cats-toggle]');
  await pg.waitForSelector('[data-testid=help-way]');
  const help = (await pg.textContent('[data-testid=real-cats]')).replace(/\s+/g, ' ');
  const helpSrc = await pg.$$eval('[data-testid=help-way] a[href^="https://"]', (n) => n.map((a) => a.href));
  check('every way of helping names who says so', helpSrc.length === (await pg.$$('[data-testid=help-way]')).length && helpSrc.length >= 4, helpSrc.length + ' sourced');
  check('and the page never asks for money or claims to be a charity',
    !/donate now|give now|your donation|we are a|our charity|support us/i.test(help), help.slice(0, 60));
  check('the invented cats say they are invented', /invented/i.test(await pg.textContent('[data-testid=collections]')));
  // The ending is announced only when it is true. A world that keeps telling you
  // how far off you are is a debt, and this one does not do those.
  check('nothing announces the ending before it has happened', (await pg.$('[data-testid=all-lit]')) === null);
  await pg.click('[data-testid=real-cats-toggle]');
  // Collections are earned, never bought: no price, no buy control, and the
  // count has to agree with the words the engine actually calls "known".
  await pg.waitForSelector('[data-testid=collections]');
  const coll = await pg.textContent('[data-testid=collections]');
  check('collections are earned, with nothing to buy and no rarity', !/Sparks|rare|chance|Build/i.test(coll), coll.slice(0, 80));
  // The shelf draws every cat she has MET, at the brightness the engine really
  // reports, so a half-learned word is a half-lit cat rather than absent. The
  // headline count still only ever counts the ones she genuinely knows —
  // drawing something must never be mistaken for having earned it.
  const shelfBefore = await pg.$$eval('[data-testid=word-card]', (n) => n.map((e) => e.dataset.status));
  check('nothing is known yet, so nothing on the shelf claims to be', shelfBefore.length > 0 && shelfBefore.every((s) => s !== 'known'), shelfBefore.join(',') || 'empty');
  check('the headline count counts only what is known, not everything drawn', /\b0 \/ \d+/.test(coll), coll.slice(0, 90));
  // Now make one word genuinely known — explained on one day, answered right in
  // the quiz on another — and the card must appear without anything being stored
  // about the collection itself.
  await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    s.items['w:benign'] = {
      hist: [{ at: '2026-09-04T10:00:00Z', ok: true, ms: 3000, ctx: 'vocab', pick: 'A' }],
      explain: { at: '2026-09-02T10:00:00Z', conf: 3 },
      cleared: '2026-09-04T10:00:00Z',
      due: '2099-01-01T00:00:00Z',
      at: '2026-09-04T10:00:00Z',
    };
    localStorage.setItem('isee.v1', JSON.stringify(s));
    location.hash = '#/base';
  });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=word-cards]');
  check('knowing a word for real puts its card on the shelf', /benign/.test(await pg.textContent('[data-testid=word-cards]')));
  check('and the collection is derived, not stored anywhere', await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); return !s.collection && !s.cards && !(s.base && Object.keys(s.base).some((k) => k.includes('card'))); }));
  // The cat itself. Its coat comes out of the word and its brightness out of the
  // engine, and neither is written down anywhere — so the same word is the same
  // cat on every device, and a cat cannot be brighter than the record behind it.
  check('the word she now knows is drawn Radiant', (await pg.$eval('[data-testid=word-card][data-status=known] [data-testid=glim]', (e) => e.dataset.stage)) === 'Radiant');
  const coats = await pg.$$eval('[data-testid=word-cards] [data-testid=glim]', (n) => n.map((e) => e.dataset.word + ':' + e.dataset.marking + ':' + e.dataset.coat));
  check('every cat is drawn, not fetched — nothing on the shelf is an image', (await pg.$$('[data-testid=word-cards] img')).length === 0 && coats.length > 1);
  check('two different words are two different cats', new Set(coats).size === coats.length, coats.slice(0, 3).join(' | '));
  // Coats are real cats from a closed list, not points on a colour wheel: the
  // first version generated lilac and mint-green cats, which exist nowhere.
  const REAL = ['brown-tabby', 'ginger-tabby', 'silver-tabby', 'golden-shaded', 'tuxedo', 'black', 'blue', 'cream', 'seal-point', 'calico', 'tortoiseshell', 'white'];
  const kinds = await pg.$$eval('[data-testid=word-cards] [data-testid=glim]', (n) => n.map((e) => e.dataset.marking + '|' + e.dataset.build));
  check('every cat is a coat you could actually meet', kinds.every((k) => REAL.includes(k.split('|')[0])), [...new Set(kinds.map((k) => k.split('|')[0]))].join(','));
  check('and a real build, not just a colour', kinds.every((k) => ['short', 'long', 'slim'].includes(k.split('|')[1])), [...new Set(kinds.map((k) => k.split('|')[1]))].join(','));
  const benignCoat = coats.find((c) => c.startsWith('benign:'));
  // A skill is a cat too, and this is the only place all six brightnesses get
  // used — words never reach Bright. The badge still counts the Radiant ones
  // only: drawing a half-lit skill must not be mistaken for finishing it.
  const crestStages = await pg.$$eval('[data-testid=skill-crest]', (n) => n.map((e) => e.dataset.level + '/' + e.querySelector('[data-testid=glim]').dataset.stage));
  const collText = (await pg.textContent('[data-testid=collections]')).replace(/\s+/g, ' ');
  const crestBadge = /· skills[\s\S]*?(\d+) \/ (\d+)/.exec(collText);
  check('every skill she has practised is drawn, at the level the engine reports', crestStages.length > 0, crestStages.slice(0, 3).join(' | '));
  check('the level a skill reports and the face it wears can never disagree',
    crestStages.every((c) => {
      const [level, stage] = c.split('/');
      return { 'Not started': 'Unseen', Started: 'Glimpsed', 'Needs work': 'Flickering', Familiar: 'Steady', Proficient: 'Bright', Mastered: 'Radiant' }[level] === stage;
    }), crestStages.slice(0, 2).join(' | '));
  check('and only the Radiant ones count as earned',
    !!crestBadge && +crestBadge[1] === crestStages.filter((c) => c.endsWith('/Radiant')).length && +crestBadge[2] === crestStages.length,
    crestBadge ? `badge ${crestBadge[1]}/${crestBadge[2]}, drawn ${crestStages.length}` : 'no badge');
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=word-cards]');
  check('and the same word is the same cat after a reload — nothing about it is stored',
    (await pg.$$eval('[data-testid=word-cards] [data-testid=glim]', (n) => n.map((e) => e.dataset.word + ':' + e.dataset.marking + ':' + e.dataset.coat))).includes(benignCoat), benignCoat);

  console.log('== calendar');
  await pg.evaluate(() => { location.hash = '#/calendar'; });
  await pg.waitForSelector('[data-testid=test-date]');
  const cal = await body(pg);
  check('ISEE seasons, school sittings and deadlines present', /Fall testing season/.test(cal) && /Bush School/.test(cal) && /Application deadline/.test(cal));
  check('plan weeks and mocks on the timeline', /W1 · plan week/.test(cal) && /Mock 1/.test(cal));
  check('today marker placed', (await pg.$('[data-testid=today-marker]')) !== null);
  check('known sittings offered as one-tap picks', (await pg.$$('[data-testid^=pick-]')).length >= 2);
  await pg.click('[data-testid=pick-bush-isee]');
  check('pick fills the date + format', (await pg.$eval('[data-testid=test-date]', (i) => i.value)) === '2026-10-24');
  await pg.fill('[data-testid=test-date]', '2026-12-05');
  await pg.selectOption('#testFormat', { index: 3 });
  await pg.click('[data-testid=test-save]');
  await pg.waitForSelector('text=days to go');
  check('test day saved with countdown', /\d+ days to go/.test(await body(pg)));
  await pg.evaluate(() => { location.hash = '#/'; });
  await pg.waitForSelector('[data-testid=today]');
  check('dashboard shows days until the ISEE', /days until Sheila's ISEE/.test(await body(pg)));

  console.log('== checklist');
  await pg.evaluate(() => { location.hash = '#/checklist'; });
  await pg.waitForSelector('[data-testid=ck-item]');
  const wkText = await body(pg);
  check('week checklist lists VR precision, sets, essay, review', /Precision review/.test(wkText) && /Set 1/.test(wkText) && /Weekly essay/.test(wkText) && /review pile/i.test(wkText));
  const autoDone = await pg.$$eval('[data-testid=ck-item][data-done="1"]', (n) => n.length);
  check('finished work already ticked', autoDone >= 1, autoDone + ' ticked');
  await pg.fill('[data-testid=ck-add]', 'Tutor session Thursday'); await pg.press('[data-testid=ck-add]', 'Enter');
  await pg.waitForSelector('[data-testid=ck-custom]');
  await pg.click('[data-testid=ck-custom] >> button >> nth=0');
  await pg.waitForTimeout(300);
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=ck-custom]');
  check('custom item persists, ticked', /Tutor session Thursday/.test(await body(pg)) && (await pg.$eval('[data-testid=ck-custom] span', (e) => e.className.includes('line-through'))));
  await pg.click('text=This month');
  await pg.waitForSelector('[role=tab][data-state=active]:has-text("This month")');
  check('month checklist has parent to-dos + plan weeks', /Parent to-dos/.test(await body(pg)) && /Plan weeks/.test(await body(pg)));
  await pg.click('[data-testid=ck-item][data-done="0"] >> nth=-1 >> button >> nth=0').catch(() => {});
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('text=plan tasks done');
  check('dashboard tile shows this week checklist progress', /\d+ of \d+ plan tasks done/.test(await body(pg)));
  await pg.waitForSelector('[data-testid=home-checklist]');
  const homeOpen = await pg.$$eval('[data-testid=home-checklist] [data-testid=ck-item][data-done="0"]', (n) => n.length);
  const homeDoneShown = await pg.$$eval('[data-testid=home-checklist] [data-testid=ck-item][data-done="1"]', (n) => n.length);
  check('dashboard checklist lists only what is left', homeOpen >= 1 && homeDoneShown === 0, `${homeOpen} open, ${homeDoneShown} done shown`);
  await pg.click('[data-testid=home-toggle-done]');
  check('finished work folds open on request', (await pg.$$('[data-testid=home-done]')).length >= 1);
  await pg.fill('[data-testid=home-ck-add]', 'Read 20 pages'); await pg.press('[data-testid=home-ck-add]', 'Enter');
  await pg.waitForSelector('[data-testid=home-custom]');
  check('quick-add from the dashboard lands on the week list', /Read 20 pages/.test(await body(pg)));
  check('dashboard points at the month parent to-dos', /parent to-do/.test(await body(pg)));

  console.log('== learning engine');
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('[data-testid=readiness-score]');
  check('readiness score on the dashboard', /^\d+$/.test((await pg.textContent('[data-testid=readiness-score]')).trim()));
  check('streak + effort points on the Today card', /streak/.test(await pg.textContent('[data-testid=today]')) && /\d+ \S+ this week/.test(await pg.textContent('[data-testid=today]')));
  await pg.evaluate(() => { location.hash = '#/score'; }); await pg.waitForSelector('[data-testid=score-parts]');
  check('score page lists the six parts with weights', (await pg.$eval('[data-testid=score-parts]', (e) => e.children.length)) === 6 && (await pg.$('[data-testid=streak]')) !== null && /% of the score/.test(await body(pg)));
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('[data-testid=today]');
  check('mock band on the dashboard after one mock', /Latest mock ≈ stanine \d/.test(await body(pg)));
  // a fresh set with timing, pacing mode and cause tags
  await pg.evaluate(() => { location.hash = '#/run/rc/W2/0'; }); await pg.waitForSelector('[data-testid=choice]');
  await pg.click('[data-testid=pacing-toggle]'); await pg.waitForSelector('[data-testid=soft-timer]');
  check('pacing mode shows a soft timer against the budget', /\/ 60/.test(await pg.textContent('[data-testid=soft-timer]')));
  await pg.click('[data-testid=pacing-toggle]'); await pg.waitForTimeout(100);
  check('pacing mode toggles off', (await pg.$('[data-testid=soft-timer]')) === null);
  await runThrough(pg, 0);
  await pg.waitForSelector('[data-testid=score]');
  check('per-question pacing summary after a set', (await pg.$('[data-testid=pace-summary]')) !== null && /real-test budget 60 s/.test(await body(pg)));
  const missTags = await pg.$$('[data-testid=cause-tags]');
  check('every miss gets cause + confidence tags', missTags.length >= 1 && /of \d+ miss/.test(await body(pg)));
  await pg.click('[data-testid=cause-tags] >> nth=0 >> [data-testid=tag-careless]');
  await pg.click('[data-testid=cause-tags] >> nth=0 >> [data-testid=sure-no]');
  await pg.waitForTimeout(150);
  check('tag + confidence recorded', (await pg.$eval('[data-testid=cause-tags] >> nth=0', (e) => e.dataset.tag)) === 'careless' && /1 of \d+ miss/.test(await body(pg)));
  const rcRec = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const id = Object.keys(s.items).find((k) => k.startsWith('RC-') && s.items[k].tag === 'careless'); return s.items[id]; });
  check('learning record: miss scheduled for tomorrow with ms + tag', !!rcRec && rcRec.step === 0 && rcRec.due > new Date().toISOString() && rcRec.hist[rcRec.hist.length - 1].ms >= 0 && rcRec.sure === false);
  // spaced review: the migrated Week-1 misses are overdue -> due now
  await pg.evaluate(() => { location.hash = '#/review'; }); await pg.waitForSelector('[data-testid=cause-bar]');
  const rv = await body(pg);
  check('review page: migrated misses waiting at the door, cause breakdown shown', /\d+ at the door/.test(rv) && /Why misses happen/.test(rv));
  const dueVR = +(await pg.textContent('[data-testid=due-vr]').catch(() => '0'));
  check('VR has due items (words rated shaky + misses)', dueVR >= 1, dueVR + ' due');
  await pg.click('[data-testid=start-review-vr]'); await pg.waitForSelector('[data-testid=choice]');
  await runThrough(pg, 1);
  await pg.waitForSelector('[data-testid=score]');
  const afterRv = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const recs = Object.values(s.items).filter((r) => (r.hist || []).some((h) => h.ctx === 'review')); return { n: recs.length, stepped: recs.filter((r) => r.step >= 1).length, reset: recs.filter((r) => r.step === 0 && r.due).length }; });
  check('review answers recorded: right ones step forward, wrong ones reset', afterRv.n >= 1 && afterRv.stepped + afterRv.reset === afterRv.n, JSON.stringify(afterRv));
  await pg.evaluate(() => { location.hash = '#/review'; }); await pg.waitForSelector('text=Review');
  check('review page shows scheduled items after a pass', /scheduled/.test(await body(pg)));
  // mixed set
  await pg.evaluate(() => { location.hash = '#/mixed'; }); await pg.waitForSelector('[data-testid=mixed-start]');
  check('mixed set previews all four subjects', /Verbal · \d/.test(await body(pg)) && /Reading · \d/.test(await body(pg)));
  await pg.click('[data-testid=mixed-start]'); await pg.waitForSelector('[data-testid=choice]');
  check('mixed runner titled', /Mixed set · all subjects/.test(await body(pg)) && /1 \/ 12/.test(await body(pg)));
  await runThrough(pg, 2, 14);
  await pg.waitForSelector('[data-testid=score]');
  check('finishing a mixed set announces the badge it earned', (await pg.$('[data-testid=badges-won]')) !== null && /Shuffled/.test(await pg.textContent('[data-testid=badges-won]')));
  await pg.evaluate(() => { location.hash = '#/mixed'; }); await pg.waitForSelector('text=Mixed sets so far');
  check('mixed result stored with per-subject split', (await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const r = Object.values(s.mixed)[0]; return r && r.n === 12 && r.bySub && Object.keys(r.bySub).length === 4; })));
  // vocabulary quiz
  await pg.evaluate(() => { location.hash = '#/precision/W1'; }); await pg.waitForSelector('[data-testid=word-quiz]');
  check('precision page has word summary + quiz', /\d+ known · \d+ learning/.test(await body(pg)));
  await pg.click('[data-testid=word-quiz]'); await pg.waitForSelector('[data-testid=question]');
  // the quiz is VR vocabulary, so it is drawn as a rune too: the stem is the
  // bare word and the instruction moved to "cast the spell that means the same"
  const runeWord = (await pg.textContent('[data-testid=question]')).trim();
  check('word quiz is 20 synonym questions, drawn as runes', /1 \/ 20/.test(await body(pg)) && /means the same/i.test(await body(pg)) && /^[A-Z][A-Z\-' ]*$/.test(runeWord), runeWord);
  const choicesN = (await pg.$$('[data-testid=choice]')).length;
  check('four distinct choices per word', choicesN === 4);
  await runThrough(pg, 1, 22);
  await pg.waitForSelector('[data-testid=score]');
  const wordRecs = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); return Object.keys(s.items).filter((k) => k.startsWith('w:') && s.items[k].hist.some((h) => h.ctx === 'vocab')).length; });
  check('word answers recorded on the word records', wordRecs === 20, wordRecs + ' words');
  // skills + mastery on the subject page, and the score page
  await pg.evaluate(() => { location.hash = '#/s/ma'; }); await pg.waitForSelector('[data-testid=skills]');
  check('subject page lists skill levels', (await pg.$$('[data-testid=skills] [data-level]')).length >= 3 && /Proficient|Familiar|Needs work/.test(await body(pg)));
  await pg.evaluate(() => { location.hash = '#/score'; }); await pg.waitForSelector('text=How the number is built');
  check('score page explains the parts and lists subjects', /Accuracy · 30%/.test(await body(pg)) && /comes? from attempts, not accuracy/.test(await body(pg)));
  // checklist carries the new items
  await pg.evaluate(() => { location.hash = '#/checklist/W2'; }); await pg.waitForSelector('[data-testid=ck-item]');
  const ck2 = await body(pg);
  check('week checklist has word quiz + mixed set + mock follow-up', /Word quiz/.test(ck2) && /mixed set/.test(ck2) && /Mock follow-up/.test(ck2));

  console.log('== AoPS pointers');
  await pg.evaluate(() => { location.hash = '#/s/ma'; }); await pg.waitForSelector('[data-testid=skills]');
  const hints = await pg.$$eval('[data-testid=aops-hint]', (n) => n.map((x) => x.dataset.skill));
  check('weak maths skills carry the AoPS chapter that teaches them', hints.includes('Percent') && hints.includes('Fractions'), hints.join(', '));
  check('the pointer names a Beast Academy unit and a Prealgebra chapter', /5D · Percents/.test(await pg.textContent('[data-testid=skills]')));
  await pg.evaluate(() => { location.hash = '#/s/vr'; }); await pg.waitForSelector('[data-testid=skills]');
  check('verbal gets no AoPS pointer, because there is no honest one', (await pg.$$('[data-testid=aops-hint]')).length === 0);
  await pg.evaluate(() => { location.hash = '#/review'; }); await pg.waitForSelector('[data-testid=review-ma]');
  check('the review pile names the chapter for its worst maths skill', (await pg.$('[data-testid=review-ma] [data-testid=aops-hint]')) !== null && /Alcumus/.test(await pg.textContent('[data-testid=review-ma]')));

  console.log('== reading log');
  await pg.evaluate(() => { location.hash = '#/books'; }); await pg.waitForSelector('[data-testid=book]');
  const bk = await body(pg);
  check('her three books are on the shelf', /Little Women/.test(bk) && /Charlie and the Chocolate Factory/.test(bk) && /Harry Potter and the Sorcerer's Stone/.test(bk));
  check('Harry Potter starts where she is, page 77, chapter 5', (await pg.$eval('[data-testid=book][data-id=harry-potter-1]', (e) => e.dataset.status)) === 'reading' && /page 77/.test(bk) && /chapter 5/.test(bk));
  // a starter book added to the content later still lands on a shelf that was seeded before it existed
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); delete s.books['harry-potter-1']; s.books['little-women'].removed = false; localStorage.setItem('isee.v1', JSON.stringify(s)); });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=book][data-id=harry-potter-1]');
  check('seeding is additive after the first time', true);
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); s.books['harry-potter-1'].removed = true; localStorage.setItem('isee.v1', JSON.stringify(s)); });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=book]');
  check('but a book she took off the shelf stays off', (await pg.$('[data-testid=book][data-id=harry-potter-1]')) === null);
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); delete s.books['harry-potter-1'].removed; localStorage.setItem('isee.v1', JSON.stringify(s)); });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=book][data-id=harry-potter-1]');
  check('Little Women is the one she is reading', (await pg.$eval('[data-testid=book][data-id=little-women]', (e) => e.dataset.status)) === 'reading');
  check('Charlie is finished', (await pg.$eval('[data-testid=book][data-id=charlie]', (e) => e.dataset.status)) === 'finished');
  check('suggested next reads offered', (await pg.$$('[data-testid=suggestion]')).length >= 8 && /inference/.test(bk));
  await pg.click('[data-testid=log-little-women]');
  await pg.waitForSelector('[data-testid=log-little-women]:has-text("Read today")');
  check('a reading day is logged with one tap', /1 reading day/.test(await body(pg)));
  const readPts = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const b = s.books['little-women']; return { n: (b.sessions || []).length, on: (b.sessions || [])[0] && (b.sessions || [])[0].on } });
  // Her reading day is the local calendar day (lib/books.js dayOf), not the UTC one, or an
  // evening tap west of Greenwich would be filed under tomorrow.
  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  check('the session is stored against today', readPts.n === 1 && readPts.on === localDay(), JSON.stringify(readPts));
  await pg.click('[data-testid=book][data-id=little-women] >> [data-testid=word-add]');
  await pg.fill('[data-testid=book][data-id=little-women] >> [data-testid=word-add]', 'garret');
  await pg.press('[data-testid=book][data-id=little-women] >> [data-testid=word-add]', 'Enter');
  await pg.waitForSelector('[data-testid=book-word]');
  check('words she looked up are kept with the book', /garret/.test(await body(pg)));
  await pg.fill('[data-testid=book][data-id=little-women] >> [data-testid=page-total]', '449');
  await pg.fill('[data-testid=book][data-id=little-women] >> [data-testid=page-now]', '120');
  await pg.waitForTimeout(200);
  check('page numbers give a progress bar', /page 120 of 449/.test(await body(pg)));
  // a day she forgot to tap: log it after the fact, and it counts on that day, not today
  const yday = await pg.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  await pg.fill('[data-testid=book][data-id=little-women] >> [data-testid=log-date]', yday);
  await pg.fill('[data-testid=book][data-id=little-women] >> [data-testid=log-page]', '90');
  await pg.click('[data-testid=book][data-id=little-women] >> [data-testid=log-add]');
  await pg.waitForTimeout(200);
  const back = await pg.evaluate((y) => { const s = JSON.parse(localStorage.getItem('isee.v1')); const b = s.books['little-women']; const ses = b.sessions.find((x) => x.on === y); return { n: b.sessions.length, on: ses && ses.on, at: ses && ses.at.slice(0, 10), page: b.page, order: b.sessions.map((x) => x.on) }; }, yday);
  check('a back-dated reading day is stored on that day and does not move the page back', back.n === 2 && back.on === yday && back.page === 120 && back.order[0] === yday && /2 reading days/.test(await body(pg)), JSON.stringify(back));
  check('the date picker cannot go into the future', await pg.$eval('[data-testid=book][data-id=little-women] >> [data-testid=log-date]', (i) => { const d = new Date(); return i.max === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }));
  // tapping a logged day loads it for editing — it must never delete on one tap
  const bk1 = '[data-testid=book][data-id=little-women]';
  await pg.click(`${bk1} >> [data-testid=sessions] >> button[data-on="${yday}"]`);
  await pg.waitForTimeout(150);
  check('tapping a logged day loads it instead of deleting it', (await pg.$eval(`${bk1} >> [data-testid=log-date]`, (i) => i.value)) === yday
    && (await pg.$eval(`${bk1} >> [data-testid=log-page]`, (i) => i.value)) === '90'
    && /Editing/.test(await pg.textContent(`${bk1} >> [data-testid=book-detail]`))
    && await pg.evaluate((y) => JSON.parse(localStorage.getItem('isee.v1')).books['little-women'].sessions.some((x) => x.on === y), yday));
  // and the loaded day can be corrected
  await pg.fill(`${bk1} >> [data-testid=log-page]`, '95');
  await pg.click(`${bk1} >> [data-testid=log-add]`);
  await pg.waitForTimeout(200);
  check('editing a logged day updates it, without adding a second one', await pg.evaluate((y) => { const s = JSON.parse(localStorage.getItem('isee.v1')).books['little-women'].sessions; return s.length === 2 && s.find((x) => x.on === y).page === 95; }, yday));
  // removing is its own button, only offered while a day is loaded
  await pg.click(`${bk1} >> [data-testid=sessions] >> button[data-on="${yday}"]`);
  await pg.waitForSelector(`${bk1} >> [data-testid=log-remove]`);
  await pg.click(`${bk1} >> [data-testid=log-remove]`);
  await pg.waitForTimeout(200);
  check('Remove this day is what actually deletes it, and the form goes back to today', await pg.evaluate((y) => { const s = JSON.parse(localStorage.getItem('isee.v1')).books['little-women'].sessions; return s.length === 1 && !s.some((x) => x.on === y); }, yday)
    && (await pg.$eval(`${bk1} >> [data-testid=log-date]`, (i) => { const d = new Date(); return i.value === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })));
  check('the page label says it is a bookmark, not a count', /reached.*that day/.test(await pg.textContent(`${bk1} >> [data-testid=book-detail]`)) && /Read to page/.test(await pg.textContent(`${bk1} >> [data-testid=book-detail]`)));
  check('adding her own book lives with the suggestions, not on the shelf', (await pg.$('[data-testid=book-own] [data-testid=book-title]')) !== null && (await pg.$eval('[data-testid=book-add]', (b) => b.disabled)));
  await pg.click('[data-testid=suggestion] >> nth=0 >> button');
  await pg.waitForTimeout(200);
  check('a suggestion joins the shelf', (await pg.$$('[data-testid=book]')).length === 4);
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=book]');
  check('the shelf survives a reload', (await pg.$$('[data-testid=book]')).length === 4);
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('[data-testid=reading-card]');
  check('dashboard reading card shows the current book', /Little Women/.test(await pg.textContent('[data-testid=reading-card]')));

  console.log('== dashboard');
  const dash = await body(pg);
  check('Today card leads with the next set and a Continue button', (await pg.$('[data-testid=continue]')) !== null && /Today/.test(dash) && /Set \d/.test(dash));
  const todayJobs = await pg.$$eval('[data-testid=today-jobs] li', (n) => n.map((x) => x.textContent.trim()));
  const todayHead = (await pg.textContent('[data-testid=today] [data-slot=card-title]')).trim();
  check('Today lists what else is outstanding, without repeating the headline', todayJobs.length >= 1 && !todayJobs.some((t) => t.startsWith(todayHead)), todayJobs.join(' | '));
  check('one accuracy number on the dashboard', (dash.match(/\d+% correct across every finished set/g) || []).length === 1 && !/Accuracy · 30%/.test(dash));
  check('readiness card keeps the score, subjects and the advice', (await pg.$('[data-testid=readiness-score]')) !== null && (await pg.$('[data-testid=readiness-advice]')) !== null);
  check('subjects are one card of rows', (await pg.$$('[data-testid=subject-row]')).length === 5);
  check('the accuracy chart appears once two weeks have data', /Accuracy by week/.test(dash));
  const sideNext = (await pg.textContent('[data-testid=continue-practice]')).replace(/\s+/g, ' ');
  const headline = (await pg.textContent('[data-testid=today] [data-slot=card-title]')).trim();
  check('sidebar Continue names what it will open, and agrees with Today', sideNext.includes(headline), `${sideNext} | ${headline}`);
  await pg.click('[data-testid=continue-practice]'); await pg.waitForTimeout(300);
  check('Continue opens something pending, not the dashboard', !['#/', ''].includes(await pg.evaluate(() => location.hash)), await pg.evaluate(() => location.hash));
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('[data-testid=today]');
  check('checklist carries a count of what is left this week', /^\d+$/.test((await pg.textContent('[data-testid=week-left]')).trim()));
  check('rewards shows a dot for new badges, not a standing number', (await pg.$('[data-testid=rewards-new]')) !== null && !/\d/.test(await pg.textContent('[data-testid=rewards-new]')));
  // Drive would merge the other weeks straight back in — which is the point of the
  // merge — so the remote copy has to be emptied too for this one check.
  const remoteWas = drive.body; drive.body = JSON.stringify({ schema: 4, results: {} });
  const oneWeek = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); const keep = {}; for (const k of Object.keys(s.results)) if (k.includes(':W1:')) keep[k] = s.results[k]; const copy = { ...s, results: keep }; sessionStorage.setItem('stash', JSON.stringify(s)); localStorage.setItem('isee.v1', JSON.stringify(copy)); return Object.keys(keep).length });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=today]');
  check('with one week of data the chart is hidden instead of near-empty', !/Accuracy by week/.test(await body(pg)), oneWeek + ' W1 sets');
  drive.body = remoteWas;
  await pg.evaluate(() => { localStorage.setItem('isee.v1', sessionStorage.getItem('stash')) });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=today]');

  console.log('== rewards');
  await pg.evaluate(() => { location.hash = '#/rewards'; }); await pg.waitForSelector('[data-testid=level]');
  const rw = await body(pg);
  check('level + points + badge count', /Level \d+ · \w+/.test(rw) && /\d+\s+\S+ made/.test(rw) && /\d+ of \d+ badges/.test(rw));
  const earned = await pg.$$('[data-testid=badge][data-done="1"]');
  check('badges earned from the work already done', earned.length >= 5, earned.length + ' earned');
  check('finishing a book earned a reading badge', /Cover to cover/.test(rw) && (await pg.$('[data-testid=badge][data-id=book-1][data-done="1"]')) !== null);
  check('locked badges show progress toward them', (await pg.$$('[data-testid=badge][data-done="0"]')).length >= 10);
  const before = +(await pg.textContent('[data-testid=wallet-balance]'));
  await pg.click('text=Pick Friday\'s movie · 150');
  await pg.waitForSelector('[data-testid=reward-item]');
  check('a suggested reward goes on the shelf', /Pick Friday's movie/.test(await body(pg)));
  await pg.click('[data-testid^=claim-]');
  await pg.waitForSelector('[data-testid=claim-row]');
  const after = +(await pg.textContent('[data-testid=wallet-balance]'));
  check('claiming spends points but never the level', after === before - 150 && /Level \d/.test(await body(pg)), `${before} -> ${after}`);
  await pg.click('[data-testid=mark-given]');
  await pg.waitForSelector('[data-testid=claim-row][data-status=given]');
  check('parent can mark a reward as given', /Given/.test(await body(pg)));
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=claim-row]');
  check('shelf, claim and badges survive a reload', /Pick Friday's movie/.test(await body(pg)) && (await pg.$$('[data-testid=badge][data-done="1"]')).length >= 5);
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForSelector('[data-testid=rewards-card]');
  const card = await pg.textContent('[data-testid=rewards-card]');
  check('dashboard rewards card shows the level and the closest badge', /Level \d/.test(card) && /to spend/.test(card) && (await pg.$('[data-testid=next-badge]')) !== null);
  const pinned = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('isee.v1')); s.results = {}; localStorage.setItem('isee.v1', JSON.stringify(s)); return Object.keys(s.badges).length; });
  await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=rewards-card]');
  check('a badge stays earned even if the work behind it is gone', (await pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('isee.v1')).badges).length)) === pinned, pinned + ' pinned');

  /* ---- everything below runs LAST, and must stay last ----
     These sections write learner records (word casts, throwaway review history).
     The stubbed Drive keeps whatever they write and the merge unions it back on
     the next reload — hard rule 1 working exactly as designed — so a check
     earlier in the file that counts records exactly will see the extra ones and
     fail. Add new state-writing sections here, not in the middle. */
  console.log('== Wordkeep (runs last: casting writes word records)');
  await pg.evaluate(() => { location.hash = '#/quest'; });
  await pg.waitForSelector('[data-testid=inscription]');
  const ins = await pg.textContent('[data-testid=inscription]');
  check('a gate is a real sentence with the word taken out', /_{3,}/.test(ins) && ins.trim().length > 25, ins.trim().slice(0, 60));
  const hand = await pg.$$eval('[data-testid=spell]', (n) => n.map((e) => e.dataset.word));
  check('the hand is six different spells', hand.length === 6 && new Set(hand.map((w) => w.toLowerCase())).size === 6, hand.join(','));
  // Every name in the hand wears its own face, so the cat at the gate can be
  // recognised as the one she named without reading a word.
  const faces = await pg.$$eval('[data-testid=spell] [data-testid=glim]', (n) => n.map((e) => e.dataset.word + ':' + e.dataset.coat));
  check('every name in the hand is a face', faces.length === hand.length && new Set(faces).size === faces.length, faces.slice(0, 2).join(' | '));
  check('and nothing is standing at the gate until she calls', (await pg.$('[data-testid=gate] ~ [data-testid=glim]')) === null);
  // Cast a wrong spell: the world must say what THAT word does, not just "wrong".
  const called = hand[0];
  await pg.click('[data-testid=spell] >> nth=0');
  await pg.waitForSelector('[data-testid=cast-result]');
  const arrived = await pg.$eval('[data-testid=gate] ~ [data-testid=glim]', (e) => e.dataset.word + ':' + e.dataset.coat);
  check('the cat that turned up is the one she actually called, same face and all',
    arrived.startsWith(called + ':') && faces.includes(arrived), arrived + ' after calling ' + called);
  const castMsg = (await pg.textContent('[data-testid=cast-result]')).replace(/\s+/g, ' ');
  const opened = /It comes when you call/.test(castMsg);
  check('a cast is recorded as ordinary vocabulary practice', await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    return Object.keys(s.items).some((k) => k.startsWith('w:') && (s.items[k].hist || []).some((h) => h.ctx === 'vocab'));
  }));
  if (!opened) {
    check('calling the wrong name brings that cat instead, and says what it means', /so that is who turned up/i.test(castMsg), castMsg.slice(0, 90));
    const want = (/It was after\s+([\w-]+)/.exec(castMsg) || [])[1];
    check('and it names the cat the sentence was after', !!want && hand.some((w) => w.toLowerCase() === want.toLowerCase()), want + ' in ' + hand.join(','));
    // the day's gates are deterministic, so a reload gives the same gate back
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('[data-testid=inscription]');
    await pg.click(`[data-testid=spell][data-word="${want}"]`);
    await pg.waitForSelector('[data-testid=cast-result]');
    check('calling the right name brings that cat', /It comes when you call/.test(await pg.textContent('[data-testid=cast-result]')));
  } else {
    check('calling the right name brings that cat', true);
  }


  console.log('== the currency cannot be farmed (runs last: it writes throwaway history)');
  // Two review answers to the same question on the same day must pay once; on
  // different days they pay twice. Written against the store directly so the
  // rule is tested, not the route that happens to reach it today.
  const spark = await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    return { id: 'SPARK-TEST-ITEM', base: '[]' };
  });
  const withHist = async (hist) => {
    await pg.evaluate(({ id, hist }) => {
      const s = JSON.parse(localStorage.getItem('isee.v1'));
      s.items[id] = { ...s.items[id], hist };
      localStorage.setItem('isee.v1', JSON.stringify(s));
      location.hash = '#/score';           // land somewhere the total is printed
    }, { id: spark.id, hist });
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('[data-testid=sparks-note]');
    const t = await pg.textContent('[data-testid=sparks-note]');
    // noun-agnostic: the currency's name is still a placeholder Sheila may change
    const m = /\d+ this week · (\d+) all time/.exec(t);
    if (!m) throw new Error('could not read the all-time total from: ' + t);
    return +m[1];
  };
  const once = await withHist([{ at: '2026-09-02T10:00:00Z', ok: true, ms: 1000, ctx: 'review', pick: 'A' }]);
  const twiceSameDay = await withHist([
    { at: '2026-09-02T10:00:00Z', ok: true, ms: 1000, ctx: 'review', pick: 'A' },
    { at: '2026-09-02T18:00:00Z', ok: true, ms: 1000, ctx: 'review', pick: 'A' },
  ]);
  const twoDays = await withHist([
    { at: '2026-09-02T10:00:00Z', ok: true, ms: 1000, ctx: 'review', pick: 'A' },
    { at: '2026-09-03T10:00:00Z', ok: true, ms: 1000, ctx: 'review', pick: 'A' },
  ]);
  check('redoing a review question the same day earns nothing extra', twiceSameDay === once, `${once} -> ${twiceSameDay}`);
  check('answering it again on another day still earns', twoDays === once + 1, `${once} -> ${twoDays}`);
  // put her real history back before anything else reads it
  await pg.evaluate(({ id, hist }) => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    s.items[id] = { ...s.items[id], hist: JSON.parse(hist) };
    localStorage.setItem('isee.v1', JSON.stringify(s));
    location.hash = '#/';
  }, { id: spark.id, hist: spark.base });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=today]');

  console.log('== the weekly plan can reach the Wordwood (runs last: casting writes records)');
  // The bug this closes: the Wordwood was only reachable from the sidebar, so a
  // week could be finished without the weekly plan ever pointing at it.
  await pg.evaluate(() => { location.hash = '#/quest/W1'; });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=inscription], [data-testid=quest-all]');
  const weekWood = (await pg.$('[data-testid=inscription]')) !== null;
  check('a week has its own walk', weekWood || (await pg.$('[data-testid=quest-all]')) !== null, weekWood ? 'walkable' : 'offers the whole wood instead');
  if (weekWood) {
    const wkHand = await pg.$$eval('[data-testid=spell]', (n) => n.map((e) => e.dataset.word.toLowerCase()));
    check('and its hand is six different names', wkHand.length === 6 && new Set(wkHand).size === 6, wkHand.join(','));
  }
  // The plan row appears only when a walk would actually work, and it is not an
  // `auto` task — a game she is required to play stops being one, and the same
  // vocabulary evidence must not be charged for twice.
  await pg.evaluate(() => { location.hash = '#/checklist/W1'; });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=ck-add]');
  const planText = await body(pg);
  check('the weekly plan points at the Wordwood', !weekWood || /call this week/i.test(planText), weekWood ? 'row present' : 'no walk to point at');
  // Not an `auto` task: only auto rows are counted by the plan's percentage, so
  // playing is never owed and the same vocabulary evidence is not charged twice.
  // The row still reports a walk — it just does not put one on the bill.
  const woodPlanRow = await pg.$$eval('[data-testid=ck-item]', (n) => {
    const row = n.find((e) => /call this week/i.test(e.textContent || ''));
    return row ? { auto: row.dataset.auto === '1', badge: /\bauto\b/.test(row.textContent || '') } : null;
  });
  check('and playing it is never owed', !weekWood || (woodPlanRow && !woodPlanRow.auto && !woodPlanRow.badge), JSON.stringify(woodPlanRow));

  console.log('== the review pile shows who is waiting (runs last: it makes a word due)');
  // Make one word genuinely overdue rather than hoping the suite has left one
  // lying about, so this checks the page instead of checking the fixture.
  await pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1'));
    s.items['w:candid'] = { hist: [{ at: '2026-09-01T10:00:00Z', ok: false, ms: 4000, ctx: 'vocab', pick: 'B' }], step: 0, due: '2026-09-02T00:00:00Z', at: '2026-09-01T10:00:00Z' };
    localStorage.setItem('isee.v1', JSON.stringify(s));
    location.hash = '#/review';
  });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=at-the-door-vr]');
  const door = await pg.$$eval('[data-testid=at-the-door-vr] [data-testid=glim]', (n) => n.map((e) => e.dataset.word));
  check('a word waiting at the door is drawn as the cat it is', door.includes('candid'), door.slice(0, 5).join(','));
  check('and only words — a Quantitative item is not a cat and is not drawn as one',
    (await pg.$$('[data-testid=at-the-door-qr] [data-testid=glim]')).length === 0);

  console.log('== the cats have voices (runs last: it replaces AudioContext)');
  // The only way to check synthesised sound is to record what it asks the audio
  // hardware for. The stub has to be installed before the page loads, because
  // the real context is built once and cached — hence addInitScript + reload,
  // and hence this running last: every page after it is deaf.
  await pg.addInitScript(() => {
    window.__NOTES__ = [];
    const sink = { connect: (n) => n };
    class FakeCtx {
      constructor() { this.currentTime = 0; this.state = 'running'; this.destination = sink; }
      resume() {}
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (n) => n }; }
      createOscillator() {
        const o = { type: '', frequency: { setValueAtTime: (f) => window.__NOTES__.push(f), exponentialRampToValueAtTime() {} }, connect: (n) => n, start() {}, stop() {} };
        return o;
      }
    }
    window.AudioContext = FakeCtx;
    window.webkitAudioContext = FakeCtx;
  });
  await pg.evaluate(() => { location.hash = '#/quest'; });
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=spell]');
  // Find out which name this gate wants. The day's gates are deterministic, so
  // a reload gives the same gate back and we can call it deliberately right and
  // deliberately wrong and compare what each one sounds like.
  const listen = async (word) => {
    await pg.evaluate(() => { location.hash = '#/quest'; });
    await pg.reload({ waitUntil: 'networkidle' });
    await pg.waitForSelector('[data-testid=spell]');
    await pg.evaluate(() => { window.__NOTES__ = []; });
    await pg.click(`[data-testid=spell][data-word="${word}"]`);
    await pg.waitForSelector('[data-testid=cast-result]');
    return { notes: await pg.evaluate(() => window.__NOTES__.slice()), text: (await pg.textContent('[data-testid=cast-result]')).replace(/\s+/g, ' ') };
  };
  const names = await pg.$$eval('[data-testid=spell]', (n) => n.map((e) => e.dataset.word));
  const firstTry = await listen(names[0]);
  const wanted = /It comes when you call/.test(firstTry.text) ? names[0] : (/It was after\s+([\w-]+)/.exec(firstTry.text) || [])[1];
  const wrong = names.find((w) => w !== wanted);
  const right = wanted === names[0] ? firstTry : await listen(wanted);
  const other = wrong === names[0] ? firstTry : await listen(wrong);

  check('the right cat answers in two notes, and they rise', right.notes.length === 2 && right.notes[1] > right.notes[0], right.notes.map((f) => Math.round(f)).join(' -> '));
  // Every pitch any cat sings must belong to ONE pentatonic set, or two cats can
  // land a semitone apart — the sour interval the scale exists to rule out.
  // Checked as pitch classes off C5, so the octave a cat lives in stays free.
  const PENT = [0, 2, 4, 7, 9];
  const pitches = [...right.notes, ...other.notes].map((f) => ((Math.round(12 * Math.log2(f / 523.25)) % 12) + 12) % 12);
  check('and every note any cat sings is in the one shared scale',
    pitches.length > 2 && pitches.every((c) => PENT.includes(c)), pitches.join(','));
  check('calling the wrong name sounds like somebody else, not like an error',
    other.notes.join() !== right.notes.join() && other.notes.length > 0,
    `${wanted}: ${right.notes.map((f) => Math.round(f)).join(',')} · ${wrong}: ${other.notes.map((f) => Math.round(f)).join(',')}`);

  // Muting has to mean silence, everywhere, including the cats.
  await pg.click('[data-testid=mute-toggle]');
  await pg.evaluate(() => { window.__NOTES__ = []; });
  await pg.click('[data-testid=quest-next]');
  await pg.waitForSelector('[data-testid=spell]');
  await pg.click('[data-testid=spell] >> nth=0');
  await pg.waitForSelector('[data-testid=cast-result]');
  check('muted means silent, cats included', (await pg.evaluate(() => window.__NOTES__.length)) === 0);
  await pg.click('[data-testid=mute-toggle]');

  /* A walk has to leave a mark. It did not: a gate for a cluster entry recorded
   * the NAME it called ("w:elaborate"), while every reader of a word keys on the
   * entry ("w:elaborate / intricate"). `findItem` cannot resolve a bare name and
   * `reviewQueue` skips what it cannot resolve, so nine of W2's twenty gates
   * wrote evidence that fed nothing — a cluster word she got wrong never came
   * back — and the checklist row read the same line before and after. */
  console.log('== the Wordwood actually records the walk');
  await pg.evaluate(async () => {
    const bundle = await (await fetch('./content/bundle.json')).json();
    const s = JSON.parse(localStorage.getItem('isee.v1') || '{}');
    s.precision = s.precision || {};
    const w = {};
    for (const e of (bundle.precision.W2.words || [])) w[e.word] = { text: 'in my own words: ' + e.word, conf: 2, at: '2026-09-08T10:00:00.000Z' };
    s.precision.W2 = { words: w, submitted: true, submittedAt: '2026-09-08T10:00:00.000Z', at: '2026-09-08T10:00:00.000Z' };
    localStorage.setItem('isee.v1', JSON.stringify(s));
  });
  await pg.reload({ waitUntil: 'networkidle' });
  // earlier sections have already walked the wood, so measure the delta
  const vocabIds = () => pg.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('isee.v1') || '{}');
    return Object.keys(s.items || {}).filter((id) => ((s.items[id].hist) || []).some((h) => h.ctx === 'vocab'));
  });
  const vocabBefore = new Set(await vocabIds());
  await pg.evaluate(() => { location.hash = '#/quest/W2'; });
  await pg.waitForSelector('[data-testid=spell]');
  let walked = 0;
  for (let k = 0; k < 8; k++) {
    if (!(await pg.$('[data-testid=spell]'))) break;
    await pg.click('[data-testid=spell] >> nth=0');
    await pg.waitForSelector('[data-testid=cast-result]');
    walked++;
    await pg.click('[data-testid=quest-next]');
    await pg.waitForTimeout(200);
    if (await pg.$('[data-testid=quest-done]')) break;
  }
  const fresh = (await vocabIds()).filter((id) => !vocabBefore.has(id));
  const cast = await pg.evaluate((ids) => {
    const s = JSON.parse(localStorage.getItem('isee.v1') || '{}');
    return { ids, due: ids.filter((id) => s.items[id] && s.items[id].due && !s.items[id].cleared) };
  }, fresh);
  check('a walk records one vocabulary attempt per gate', walked === 5 && cast.ids.length === 5, `${walked} gates -> ${cast.ids.length} new records`);
  check('and W2 is the cluster week, so some of them are cluster entries', cast.ids.some((id) => id.includes(' / ')), cast.ids.join(' | '));
  // W2 is the cluster week: nine of its gates call one side of a pair.
  check('a cluster gate records against its entry, not the bare name it called',
    cast.ids.every((id) => !/^w:(imply|infer|objective|subjective|rigid|rigorous|stable|stationary|superior|inferior|elaborate|intricate|consent|consensus|prominent|painstaking|industrious|prejudice|biased)$/.test(id)),
    cast.ids.join(' | '));
  // Not a cosmetic id: an unresolvable record is dropped by the review queue, so
  // the word she got wrong would never be shown to her again.
  const pileHas = await pg.evaluate((ids) => {
    const s = JSON.parse(localStorage.getItem('isee.v1') || '{}');
    return ids.length === 0 || ids.every((id) => !!s.items[id]);
  }, cast.due);
  check('every word missed at a gate is a record the review pile can resolve', pileHas, cast.due.join(' | '));
  await pg.evaluate(() => { location.hash = '#/checklist/W2'; });
  await pg.waitForSelector('[data-testid=ck-item]');
  const woodRow = (await pg.$$eval('[data-testid=ck-item]', (ls) => ls.map((l) => l.dataset.done + '|' + l.textContent.replace(/\s+/g, ' ')))).find((t) => /Wordwood/.test(t)) || '';
  check('the checklist says she walked it, and how far', /^1\|/.test(woodRow) && /\d+ of 20 called/.test(woodRow), woodRow.slice(0, 100));

  /* Naming her own mistake. The shared explanation can only describe the correct
   * route: told "perimeter = 2(10+3) = 26" after picking 30, she still does not
   * learn that 30 was the area. `why` is authored per wrong choice and shown
   * before the explanation. Checked on a real item rather than a fixture, so
   * this fails if the bundle stops carrying the field. */
  console.log('== a wrong choice is told what it was');
  const target = await pg.evaluate(async () => {
    const b = await (await fetch('./content/bundle.json')).json();
    const q = b.subjects.ma.find((x) => x.id === 'MA-SEP-029');
    if (!q || !q.y) return null;
    // the decoy that IS the area — the mistake this question exists to catch
    const wrong = 'ABCD'.split('').find((L) => q.y[L] && /area/i.test(q.y[L]));
    const set = b.subjects.ma.filter((x) => x.w === q.w);
    return { idx: set.indexOf(q), pick: 'ABCD'.indexOf(wrong), text: q.y[wrong], why: q.y };
  });
  check('the bundle carries the per-choice why', target && /area/i.test(target.text), target ? target.text : 'no `y` on MA-SEP-029');
  await pg.evaluate(() => { location.hash = '#/run/ma/W2/0'; });
  await pg.waitForSelector('[data-testid=question]');
  // walk to MA-SEP-029 and pick the area
  for (let k = 0; k < target.idx; k++) { await pg.click('[data-testid=choice] >> nth=0'); await pg.click('[data-testid=next]'); await pg.waitForTimeout(120); }
  const onIt = await pg.textContent('[data-testid=question]');
  check('reached the banner question', /banner/i.test(onIt), onIt.slice(0, 60));
  await pg.click(`[data-testid=choice] >> nth=${target.pick}`);
  await pg.waitForSelector('[data-testid=reveal]');
  const shown = await pg.textContent('[data-testid=why]').catch(() => '');
  check('picking the area on a perimeter question says so', /area/i.test(shown), shown.slice(0, 110));
  const order = await pg.evaluate(() => {
    const r = document.querySelector('[data-testid=reveal]');
    return [...r.querySelectorAll('p')].map((p) => p.dataset.testid || 'explanation');
  });
  check('and it comes before the explanation, not after', order.indexOf('why') >= 0 && order.indexOf('why') < order.indexOf('explanation'), order.join(' -> '));

  /* Readiness has six parts and none of them is the essay, which is right — the
   * ISEE returns no score for the writing sample, so a number here would measure
   * that she wrote one rather than how well. The page used to say nothing at
   * all, which is a different kind of wrong: a "Test-ready" badge that has never
   * looked at an essay overclaims by omission. */
  console.log('== essays are counted beside the number, never inside it');
  await pg.evaluate(() => { location.hash = '#/score'; });
  await pg.waitForSelector('[data-testid=essay-standing]');
  const strip = (await pg.textContent('[data-testid=essay-standing]')).replace(/\s+/g, ' ');
  check('the Score page says where the essays stand', /\d+ of \d+ weekly · \d+ of \d+ mock/.test(strip), strip.slice(0, 80));
  check('and says plainly that it is outside the number', /not part of the readiness number/i.test(strip) && /no score/i.test(strip), strip.slice(0, 150));
  check('with the claim sourced, like every other outside fact', /admission\.org/.test(strip));
  check('and an honest line when nothing has been reviewed', /Last reviewed|No essay has been reviewed/.test(strip));
  const parts = await pg.$$eval('[data-testid=part-row], [data-testid=readiness] *', () => 0).catch(() => 0);
  const scoreBody = (await pg.textContent('body')).replace(/\s+/g, ' ');
  const built = scoreBody.slice(scoreBody.indexOf('How the number is built'), scoreBody.indexOf('Week by week'));
  check('the breakdown itself still has no essay part', built.length > 40 && !/essay/i.test(built), built.slice(0, 90));

  check('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  await pg.screenshot({ path: 'shot-calendar.png', fullPage: false });
  await b.close(); srv.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall feature checks passed'); process.exit(failures ? 1 : 0);
})();
