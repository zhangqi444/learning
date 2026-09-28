/* Does the built CSS actually contain the shared package's styles?
 *
 * The primitives under src/components/ui/ now live in @zhangqi444/ui, under
 * node_modules/. Tailwind v4 does not scan node_modules: without the
 * `@source "../node_modules/@zhangqi444/ui/src";` line in src/index.css it
 * emits no rule for any class those files use and nothing else does, and the
 * separators, sheets, tooltips and tables render as unstyled HTML.
 *
 * Nothing else catches that. The build succeeds, every import resolves, and
 * the Playwright suites pass in full, because they assert on text, roles and
 * behaviour and never on whether a rule exists. That was measured on the
 * sibling site rather than assumed: with the @source line removed the suites
 * exited 0 with zero failures and a stylesheet 14,138 bytes lighter.
 *
 * So the check has to be on the stylesheet itself, and it has to run inside
 * `npm run build` — the command the deploy workflow runs, and the last moment
 * at which catching this still keeps it away from a reader.
 *
 * Usage: node check_css.cjs [dist]  — reads dist/assets/*.css and any <style>
 * inlined into dist/*.html, so it covers the single-file artifact target too.
 */
const fs = require('fs'), path = require('path');

const OUT = path.join(__dirname, process.argv[2] || 'dist');
const PKG = path.join(__dirname, 'node_modules/@zhangqi444/ui/src');
const LOCAL = path.join(__dirname, 'src');

const die = (msg) => { console.error('check_css: ' + msg); process.exit(1) }

/* Class names as they can be looked up verbatim in the output. Tailwind escapes
 * the punctuation in `peer-data-[x]:w-2`, so only plain names are usable here —
 * there are plenty, and a sample is all this needs. */
function classesIn(dir) {
  const out = new Set()
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.jsx?$/.test(e.name))
        for (const m of fs.readFileSync(p, 'utf8').matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g))
          for (const w of (m[1] ?? m[2] ?? m[3]).split(/\s+/))
            if (/^[a-z][a-z0-9-]*$/.test(w)) out.add(w)
    }
  }
  walk(dir)
  return out
}

if (!fs.existsSync(PKG)) die('@zhangqi444/ui is not installed — run npm ci.')
if (!fs.existsSync(OUT)) die(`no ${path.basename(OUT)}/ — run the build first.`)

let css = ''
const assets = path.join(OUT, 'assets')
if (fs.existsSync(assets))
  for (const f of fs.readdirSync(assets)) if (f.endsWith('.css')) css += fs.readFileSync(path.join(assets, f), 'utf8') + '\n'
for (const f of fs.readdirSync(OUT))
  if (f.endsWith('.html'))
    for (const m of fs.readFileSync(path.join(OUT, f), 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += m[1] + '\n'
if (!css.trim()) die('the build produced no stylesheet at all.')

const local = classesIn(LOCAL)
const only = [...classesIn(PKG)].filter((c) => !local.has(c)).sort()

/* If the package and the site ever share every plain class name, this check
 * would pass whatever the stylesheet said. That is silent success, which is
 * the failure it exists to prevent, so say so instead. */
if (only.length < 20) die(`only ${only.length} class names are unique to the package; too few to tell whether its styles were emitted. Widen the sample or drop this check deliberately.`)

const present = only.filter((c) => new RegExp('\\.' + c + '[,{:\\s]').test(css))
if (present.length * 3 < only.length)
  die(`${present.length} of ${only.length} package-only classes reached the stylesheet.\n` +
      `  Tailwind is not scanning the package. Check that src/index.css still has\n` +
      `  @source "../node_modules/@zhangqi444/ui/src"; and that the dependency is installed.`)

console.log(`check_css: ${present.length}/${only.length} package-only classes in ${path.basename(OUT)}.`)
