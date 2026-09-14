/* Smoke-test ../artifact.html the way the Artifact viewer serves it: wrapped in a bare skeleton, no network. */
const { chromium } = require('playwright'); const fs = require('fs'); const http = require('http');
const art = fs.readFileSync(__dirname + '/../artifact.html', 'utf8');
const page = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font:14px system-ui}</style></head><body>' + art + '</body></html>';
const srv = http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(page); });
const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
const ORIGIN = 'http://localhost:8141';

/* A printed FAIL nobody exits on is a gate that reports success having checked nothing,
 * so every check here is counted and the process leaves with the tally. */
let bad = 0;
const check = (name, ok, detail) => { if (!ok) bad++; console.log(name + ':', ok ? 'ok' : 'FAIL', detail === undefined ? '' : detail); };

/* The dashboard's headline count is the bundle's own arithmetic, so read it from the bundle
 * rather than freezing last month's number: adding a week's worth of questions is a legitimate
 * content change and must not read as a broken artifact. Mirrors chunk() in src/lib/content.js. */
const bundle = JSON.parse(fs.readFileSync(__dirname + '/content/bundle.json', 'utf8'));
const SETSIZE = 12;
let totalSets = 0;
for (const sub of ['vr', 'qr', 'ma', 'rc'])
  for (const w of bundle.weeks) {
    const n = bundle.subjects[sub].filter((i) => i.w === w.w).length;
    totalSets += Math.ceil(n / SETSIZE);
  }
const seeded = Object.keys(bundle.seed.results).length;

(async () => {
  await new Promise((r) => srv.listen(8141, r));
  const b = await chromium.launch({ executablePath: exe }); const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
  await ctx.route(/fonts\.g/, (r) => r.abort());
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await pg.waitForSelector('[data-testid=today]', { timeout: 10000 });
  const body = await pg.textContent('body');
  const want = new RegExp(seeded + '\\s*of\\s*' + totalSets + '\\s*sets done');
  check('dashboard from inlined bundle', want.test(body), seeded + ' of ' + totalSets + ' sets done');
  check('no Drive button in artifact', (await pg.$('button:has-text("Save to Drive")')) === null);
  const res = await pg.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
  const off = res.filter((n) => n.indexOf(ORIGIN) !== 0);
  check('no request leaves the page', off.length === 0, JSON.stringify(off));
  await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await pg.waitForTimeout(100);
  check('host data-theme=dark applied', await pg.evaluate(() => document.documentElement.classList.contains('dark')));
  await pg.screenshot({ path: 'shot-artifact-dark.png' });
  await pg.evaluate(() => { location.hash = '#/review/ma'; }); await pg.waitForSelector('[data-testid=choice]');
  check('review runs in artifact', true);
  check('no page errors', errs.length === 0, errs.join(' | '));
  await b.close(); srv.close();
  console.log(bad ? '\n' + bad + ' artifact check' + (bad === 1 ? '' : 's') + ' failed' : '\nall artifact checks passed');
  process.exit(bad ? 1 : 0);
})();
