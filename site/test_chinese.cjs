/* The Chinese half (docs/chinese.md): its own suite rather than a tail on
 * test_features.cjs, because two things in that file must run last — the
 * throwaway learning history and the audio stub that leaves every later page
 * deaf — and appending there means threading new checks in front of that tail
 * every time. What this one holds: the two typed URLs and their stubs, the
 * category switch and the last-used root, one real sitting through the shared
 * runner, the dictation list read aloud and rated, the read-aloud log, and the
 * guarantee the whole design hangs on — a Chinese miss changes nothing on the
 * ISEE dashboard. */
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
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
let failures = 0;
function check(name, ok, extra) { console.log((ok ? '  ok   ' : '  FAIL ') + name + (extra ? '  ' + extra : '')); if (!ok) failures++; }
const ls = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem('isee.v1') || '{}'));

(async () => {
  // -- the build: two stubs, one hop each, and a manifest named after the whole site
  for (const cat of ['isee', 'chinese']) {
    const f = path.join(DIST, cat, 'index.html'), t = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
    check(`dist/${cat}/index.html is a redirect stub`, t.includes(`location.replace('../#/${cat}')`) && !/<script[^>]+src=/.test(t), t ? `${t.length} bytes` : 'missing');
  }
  const sw = fs.readFileSync(path.join(__dirname, 'public/sw.js'), 'utf8');
  check('both stubs are in the service worker PRECACHE', /'isee\/index\.html'/.test(sw) && /'chinese\/index\.html'/.test(sw));
  const mf = JSON.parse(fs.readFileSync(path.join(DIST, 'manifest.webmanifest'), 'utf8'));
  check('the manifest is not named after one half', !/ISEE/.test(mf.name) && !/ISEE/.test(mf.short_name), `${mf.name} / ${mf.short_name}`);

  await new Promise((r) => srv.listen(8149, r));
  const b = await chromium.launch({ executablePath: exe });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await stubGoogle(ctx);
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
  // The voice: record what would have been said instead of saying it. Only
  // `speak` is replaced, so cancel() and getVoices() stay real.
  await pg.addInitScript(() => {
    window.__spoken = []; const s = window.speechSynthesis; if (s) s.speak = (u) => window.__spoken.push({ text: u.text, lang: u.lang });
    // Headless Chromium has no microphone and no recogniser. Both are faked at
    // the shape lib/reading.js uses: a recogniser that reports window.__asr as
    // one final result shortly after start(), a recorder that yields one chunk.
    window.webkitSpeechRecognition = class { start() { setTimeout(() => { const r = [{ transcript: window.__asr || '' }]; r.isFinal = true; this.onresult && this.onresult({ resultIndex: 0, results: [r] }); }, 60); } stop() { this.onend && this.onend(); } };
    window.SpeechRecognition = window.webkitSpeechRecognition;
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getTracks: () => [{ stop() {} }] });
    window.MediaRecorder = class { constructor(stream, o) { this.mimeType = (o && o.mimeType) || 'audio/mp4'; } static isTypeSupported(m) { return m === 'audio/mp4'; } start() {} stop() { this.ondataavailable && this.ondataavailable({ data: new Blob(['x'], { type: this.mimeType }) }); this.onstop && this.onstop(); } };
  });
  await pg.goto('http://localhost:8149/learning/', { waitUntil: 'networkidle' });
  await signIn(pg);
  await pg.waitForSelector('[data-testid=today]');
  const titleOf = (sel) => pg.evaluate((s) => { const h = document.querySelector(s); const t = h && h.querySelector('[data-slot=card-title]'); return t ? t.textContent.trim() : ''; }, sel);
  const before = await titleOf('[data-testid=today]');

  // -- the switch and the two roots
  check('the sidebar has the category switch', !!(await pg.$('[data-testid=category-switch]')));
  await pg.click('[data-testid=cat-chinese]'); await pg.waitForSelector('[data-testid=zh-home]');
  check('中文 opens the Chinese home', !!(await pg.$('[data-testid=zh-home]')));
  check('and its url is the chinese category', (await pg.evaluate(() => location.hash)) === '#/chinese');
  const home = await pg.textContent('[data-testid=zh-home]');
  check('the note\'s lines are not titles, and the note is not repeated', !/课本55到56页，读熟练。/.test(home) && !(await pg.$('[data-testid=zh-note]')));
  check('with no passage kept, the reading card asks a parent for it in place', !!(await pg.$('[data-testid=zh-read] [data-testid=zh-passage-setup]')));
  check('the lesson is named', /小马过河/.test(await pg.textContent('[data-testid=zh-home]')));
  check('the trail starts at 中文', /中文/.test(await pg.textContent('header')));
  // Opening the site fresh — the manifest's start_url, no hash — while 中文 was the
  // half she used last. A hash change to #/ in the app is not this: that is the
  // ISEE dashboard, and remembering it as such is correct.
  await pg.goto('http://localhost:8149/learning/', { waitUntil: 'networkidle' }); await pg.waitForSelector('[data-testid=zh-home]', { timeout: 8000 }).catch(() => {});
  check('opening the site fresh lands on the half she used last', (await pg.evaluate(() => location.hash)) === '#/chinese', await pg.evaluate(() => location.hash));
  await pg.click('[data-testid=cat-isee]'); await pg.waitForSelector('[data-testid=today]');
  check('ISEE switches back to the dashboard', (await pg.evaluate(() => location.hash)) === '#/');
  await pg.evaluate(() => { location.hash = '#/isee/mock/DGN'; }); await pg.waitForTimeout(350);
  check('#/isee/... is an alias of the ISEE route', /Split diagnostic/.test(await pg.textContent('main')));

  // -- the lesson, read aloud
  await pg.evaluate(() => { location.hash = '#/chinese/l/L05'; }); await pg.waitForSelector('[data-testid=zh-lesson]');
  check('the ten 生字 are on the lesson page', (await pg.$$('[data-testid=zh-char]')).length === 10);
  check('and the seven 词语', (await pg.$$('[data-testid=zh-word]')).length === 7);
  await pg.click('[data-testid=zh-char] [data-testid=zh-speak]');
  const spoken = await pg.evaluate(() => window.__spoken);
  check('tapping the speaker says the character in zh-CN', spoken.length === 1 && spoken[0].text === '喝' && spoken[0].lang === 'zh-CN', JSON.stringify(spoken));

  // -- one sitting through the shared runner, with a miss in it
  await pg.evaluate(() => { location.hash = '#/chinese/run/zh-word/L05/0'; }); await pg.waitForSelector('[data-testid=choice]');
  check('a Chinese sitting has no pacing timer', !(await pg.$('[data-testid=soft-timer]')));
  const qtext = await pg.textContent('[data-testid=question]');
  check('the prompt is the book\'s own Chinese wording', /选词填空|读音|几画/.test(qtext) && !/Fill the blank|How is/.test(qtext), qtext);
  check('and the English is behind a tap, not shown by default', !!(await pg.$('[data-testid=english-toggle]')) && !(await pg.$('[data-testid=english]')));
  await pg.click('[data-testid=english-toggle]');
  check('tapping it shows the translation', /Fill the blank|How is|How many strokes/.test(await pg.textContent('[data-testid=english]')));
  // The explanation and the `why` follow the page's language too: pick a wrong
  // choice, read the why in Chinese, flip to English, read it again.
  await pg.click('[data-testid=choice] >> nth=0'); await pg.waitForSelector('[data-testid=why]');
  const whyZh = await pg.textContent('[data-testid=why]');
  check('the runner\'s chrome is Chinese in a Chinese sitting', /答案是/.test(await pg.textContent('main')) && /下一题/.test(await pg.textContent('[data-testid=next]')) && /即时/.test(await pg.textContent('[data-testid=instant-toggle]')));
  check('a wrong choice is told what it was, in Chinese', /没有别的办法|不是提建议/.test(whyZh), whyZh.slice(0, 40));
  await pg.click('[data-testid=lang-toggle]'); await pg.waitForTimeout(100);
  const whyEn = await pg.textContent('[data-testid=why]');
  check('and in English once the page is flipped', /no other choice|nothing else|being left with no choice/.test(whyEn), whyEn.slice(0, 40));
  check('and the prompt flipped with it', /Fill the blank/.test(await pg.textContent('[data-testid=question]')));
  check('and so did the runner\'s own chrome', /The answer is/.test(await pg.textContent('main')) && /Next/.test(await pg.textContent('[data-testid=next]')));
  await pg.click('[data-testid=lang-toggle]'); await pg.waitForTimeout(100);
  for (let i = 0; i < 15 && !(await pg.$('[data-testid=score]')); i++) { await pg.click('[data-testid=choice] >> nth=0'); await pg.click('[data-testid=next]'); await pg.waitForTimeout(120); }
  await pg.waitForSelector('[data-testid=score]');
  let st = await ls(pg);
  check('the sitting is a result keyed zh-word:L05:0', !!(st.results || {})['zh-word:L05:0'], Object.keys(st.results || {}).join(','));
  check('its questions have learning records under zc: ids', Object.keys(st.items || {}).some((k) => k.startsWith('zc:')));
  const r = st.results['zh-word:L05:0'];
  check('and the sitting had at least one miss, so the next check means something', r && r.right < r.n, r ? `${r.right}/${r.n}` : '');

  // -- beside the number: nothing on the ISEE side moved
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForTimeout(300);
  await pg.click('[data-testid=cat-isee]'); await pg.waitForSelector('[data-testid=today]');
  const after = await titleOf('[data-testid=today]');
  check('the ISEE dashboard card reads the same after a Chinese miss', before === after, `${before} → ${after}`);
  await pg.evaluate(() => { location.hash = '#/review'; }); await pg.waitForTimeout(300);
  check('and no Chinese question is in the ISEE review pile', !/天快黑了|教室|雨伞|早睡早起/.test(await pg.textContent('main')));

  // -- dictation: shown, then rated
  await pg.evaluate(() => { location.hash = '#/chinese/dictation/2026-09-30'; }); await pg.waitForSelector('[data-testid=zh-dictation]');
  const rows = await pg.$$('[data-testid=zh-dict-row]');
  check('the dictation lists the words on p.52 by section', rows.length === 23, String(rows.length));
  check('a word is hidden until shown', !(await pg.$('[data-testid=zh-dict-row] [data-testid=zh-ok]')));
  await pg.click('[data-testid=zh-dict-row] >> nth=0 >> [data-testid=zh-speak]');
  await pg.click('[data-testid=zh-reveal] >> nth=0');
  await pg.click('[data-testid=zh-dict-row] >> nth=0 >> [data-testid=zh-ok]');
  check('rating a word counts it', (await pg.textContent('[data-testid=zh-rated]')) === '1');
  st = await ls(pg);
  const hw = ((st.zh || {})['hw:2026-09-30'] || {});
  check('the rating is in the zh slice, keyed by the note', hw.dictation && Object.keys(hw.dictation).length === 1 && hw.dictation['松树'] && hw.dictation['松树'].ok === true, JSON.stringify(hw.dictation));
  check('the word was read aloud first', (await pg.evaluate(() => window.__spoken.slice(-1)[0])).text === '松树');

  // -- reading aloud: the passage pasted once, her reading recorded, transcribed, aligned
  await pg.evaluate(() => { location.hash = '#/chinese'; }); await pg.waitForSelector('[data-testid=zh-read]');
  const title = (sel) => pg.textContent(`${sel} [data-slot=card-title]`);
  check('each task card is titled by kind, in Chinese by default', (await title('[data-testid=zh-read]')) === '阅读' && (await title('[data-testid=zh-workbook]')) === '练习册' && (await title('[data-testid=zh-dictation-card]')) === '听写');
  check('the page is one language: no English helper text beside the Chinese', !/the words printed|Shown, then|On paper/.test(await pg.textContent('[data-testid=zh-home]')));
  await pg.click('[data-testid=lang-toggle]'); await pg.waitForTimeout(100);
  check('the header toggle turns the whole page English', (await title('[data-testid=zh-read]')) === 'Reading' && (await title('[data-testid=zh-dictation-card]')) === 'Dictation' && /This week/.test(await pg.textContent('[data-slot=sidebar]')));
  await pg.click('[data-testid=lang-toggle]'); await pg.waitForTimeout(100);
  check('and back', (await title('[data-testid=zh-read]')) === '阅读');
  // The 句子 and two 用一用 phrases, which the repo already holds — not the 课文. Pasted on the home card.
  const passage = '河水是深还是浅，最好你自己去试试。突然停电了，只好请别人帮忙。';
  await pg.fill('[data-testid=zh-read] [data-testid=zh-passage-text]', passage); await pg.click('[data-testid=zh-read] [data-testid=zh-passage-save]');
  await pg.waitForSelector('[data-testid=zh-home-passage]');
  check('the passage then shows on the card itself', (await pg.textContent('[data-testid=zh-home-passage]')) === passage);
  await pg.click('[data-testid=zh-read-open]'); await pg.waitForSelector('[data-testid=zh-passage]');
  check('the passage is kept in the zh slice, not the bundle', ((await ls(pg)).zh['text:L05:阅读《谦虚过度》'] || {}).text === passage, Object.keys((await ls(pg)).zh).join(','));
  await pg.evaluate(() => { window.__asr = '河水是深还是浅最好你自己去试试突然只好请别人帮忙'; });   // 停电了 unheard: three characters
  await pg.click('[data-testid=zh-rec-start]'); await pg.waitForSelector('[data-testid=zh-rec-stop]'); await pg.waitForTimeout(250);
  check('the transcript appears while she reads', /河水是深还是浅/.test(await pg.textContent('[data-testid=zh-transcript]')));
  await pg.click('[data-testid=zh-rec-stop]'); await pg.waitForSelector('[data-testid=zh-read-result]');
  const misses = await pg.$$eval('[data-testid=zh-marked] [data-hit="0"]', (n) => n.map((x) => x.textContent).join(''));
  check('the characters the recogniser did not hear are marked, and only those', misses === '停电了', misses);
  check('and marked without red', !(await pg.$('[data-testid=zh-marked] .text-destructive')));
  check('her view has the pace (or says the reading was too short for one) and no percentage', /字\/分钟|太短/.test(await pg.textContent('[data-testid=zh-read-result]')) && !(await pg.$('[data-testid=zh-pct]')));
  await pg.click('[data-testid=zh-parent-toggle]'); await pg.waitForSelector('[data-testid=zh-parent]');
  check('the parent view has the percentage, labelled as an estimate', (await pg.textContent('[data-testid=zh-pct]')) === '89%' && /仅供参考/.test(await pg.textContent('[data-testid=zh-parent]')), await pg.textContent('[data-testid=zh-pct]'));
  check('the recording went to Drive as its own file', !!(await pg.$('[data-testid=zh-play]')));
  st = await ls(pg);
  const att = ((st.zh['hw:2026-09-30'] || {}).read || {}).attempts || [];
  check('the reading is kept: transcript, counts, file id, done', att.length === 1 && att[0].matched === 24 && att[0].total === 27 && att[0].fileId === 'media1' && st.zh['hw:2026-09-30'].read.done === true, JSON.stringify(att[0] || null));
  await pg.evaluate(() => { location.hash = '#/chinese'; }); await pg.waitForSelector('[data-testid=zh-read]');
  check('the week card shows it read, with the last reading and the passage', /已读/.test(await pg.textContent('[data-testid=zh-read]')) && /上次: \d+ 秒/.test(await pg.textContent('[data-testid=zh-read]')) && /河水是深还是浅/.test(await pg.textContent('[data-testid=zh-read]')));
  check('the dictation card counts the rating', (await pg.textContent('[data-testid=zh-rated-count]')) === '1');
  // -- the workbook's closed exercises, marked by rule
  await pg.evaluate(() => { location.hash = '#/chinese/ex/2026-09-30/zx:L05-D3-04'; }); await pg.waitForSelector('[data-testid=zh-ex]');
  check('the check button waits for every statement', await pg.isDisabled('[data-testid=zh-ex-submit]'));
  for (const [i, v] of [[0, 't'], [1, 't'], [2, 'f'], [3, 'f'], [4, 'f']]) await pg.click(`[data-testid=zh-tf-${i}] [data-testid=zh-tf-${v}]`);
  await pg.click('[data-testid=zh-ex-submit]'); await pg.waitForSelector('[data-testid=zh-ex-result]');
  check('判断正误 marks itself: five of five', /5 \/ 5/.test(await pg.textContent('[data-testid=zh-ex-result]')), await pg.textContent('[data-testid=zh-ex-result] [data-slot=card-title]'));
  st = await ls(pg);
  const exrec = (((st.zh['hw:2026-09-30'] || {}).exercises || {})['zx:L05-D3-04'] || {});
  check('the exercise is kept in the zh slice with her answers', exrec.right === 5 && exrec.n === 5 && exrec.answers && exrec.answers['zx:L05-D3-04-3'] === false, JSON.stringify(exrec).slice(0, 80));
  check('each statement has a learning record under zx:, unscheduled', Object.keys(st.items).filter((k) => k.startsWith('zx:L05-D3-04')).length === 5 && !Object.keys(st.items).filter((k) => k.startsWith('zx:')).some((k) => st.items[k].due));
  await pg.evaluate(() => { location.hash = '#/chinese/ex/2026-09-30/zx:L05-D3-03'; }); await pg.waitForSelector('[data-testid=zh-ex]');
  const tap = async (item, text) => pg.click(`[data-testid=zh-order-${item}] [data-testid=zh-piece]:has-text("${text}")`);
  for (const w of ['老牛', '一定会', '觉得', '河水很浅']) await tap(0, w);
  for (const w of ['我', '一定会', '努力学习', '中文']) await tap(1, w);
  for (const w of ['亮亮', '一定会', '帮妈妈', '做家务']) await tap(2, w);
  for (const w of ['玩具', '妹妹', '一定会', '喜欢', '爸爸买的']) await tap(3, w);   // wrong on purpose
  await pg.click('[data-testid=zh-ex-submit]'); await pg.waitForSelector('[data-testid=zh-ex-result]');
  check('连词成句 marks three right and one wrong', /3 \/ 4/.test(await pg.textContent('[data-testid=zh-ex-result]')));
  check('and the wrong one is told the right order, in Chinese', /妹妹一定会喜欢爸爸买的玩具/.test(await pg.textContent('[data-testid=zh-ex-miss]')));
  await pg.evaluate(() => { location.hash = '#/chinese/ex/2026-09-30/zx:L05-D1-02'; }); await pg.waitForSelector('[data-testid=zh-ex]');
  for (const [l, r] of [['亻', '白'], ['氵', '罙'], ['木', '公'], ['口', '曷'], ['穴', '犬'], ['宀', '疋']]) { await pg.click(`[data-testid=zh-left]:has-text("${l}")`); await pg.click(`[data-testid=zh-right]:has-text("${r}")`); }
  await pg.click('[data-testid=zh-ex-submit]'); await pg.waitForSelector('[data-testid=zh-ex-result]');
  check('找朋友 pairs the parts into the six 生字', /6 \/ 6/.test(await pg.textContent('[data-testid=zh-ex-result]')));
  await pg.evaluate(() => { location.hash = '#/chinese/ex/2026-09-30/zx:L05-D4-03'; }); await pg.waitForSelector('[data-testid=zh-ex]');
  for (const [i, k] of [[0, 2], [1, 1], [2, 0]]) await pg.click(`[data-testid=zh-slot-${i}] [data-testid=zh-option] >> nth=${k}`);
  await pg.click('[data-testid=zh-ex-submit]'); await pg.waitForSelector('[data-testid=zh-ex-result]');
  check('补全对话 gives each speaker their line', /3 \/ 3/.test(await pg.textContent('[data-testid=zh-ex-result]')));
  await pg.evaluate(() => { location.hash = '#/chinese/ex/2026-09-30/zx:L05-D1-01s'; }); await pg.waitForSelector('[data-testid=zh-ex]');
  const taps = [1, 1, 1, 2, 1, 2];   // 喝 伯 深 → 左右 (one tap), 突 定 → 上下 (two)
  for (let i = 0; i < taps.length; i++) for (let k = 0; k < taps[i]; k++) await pg.click(`[data-testid=zh-sort-item] >> nth=${i}`);
  await pg.click('[data-testid=zh-ex-submit]'); await pg.waitForSelector('[data-testid=zh-ex-result]');
  check('the structure sort marks itself', /6 \/ 6/.test(await pg.textContent('[data-testid=zh-ex-result]')));
  await pg.evaluate(() => { location.hash = '#/chinese'; }); await pg.waitForSelector('[data-testid=zh-workbook]');
  check('the workbook card lists the exercises with their marks', (await pg.$$('[data-testid=zh-exercise]')).length === 7 && /5\/5/.test(await pg.textContent('[data-testid=zh-workbook]')) && /3\/4/.test(await pg.textContent('[data-testid=zh-workbook]')));
  await pg.evaluate(() => { location.hash = '#/'; }); await pg.waitForTimeout(300); await pg.click('[data-testid=cat-isee]'); await pg.waitForSelector('[data-testid=today]');
  check('and the ISEE dashboard card still reads the same after all of it', before === (await titleOf('[data-testid=today]')), `${before} → ${await titleOf('[data-testid=today]')}`);
  check('no page errors', errs.length === 0, errs.join(' | '));

  await b.close(); srv.close();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall chinese checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
