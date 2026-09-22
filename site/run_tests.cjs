/* Run all four suites, whatever any of them does.
 *
 * `npm test` used to be the four scripts joined with `&&`, which stops at the
 * first failure. That reads as thrift and behaves as concealment: for several
 * days the artifact suite was never reached at all, because a failing check in
 * the features suite stood in front of it, and nobody could have known from the
 * output that a whole suite had not run. A suite you cannot see is worse than a
 * suite that is red.
 *
 * It also builds the artifact before testing it. `artifact.html` is untracked
 * and made by hand, so after any content change it fails on numbers that have
 * nothing to do with the change in front of you — which is the other way a suite
 * teaches people to stop reading it. Building it here costs one vite run and
 * removes a whole class of confusing failure. The Pages build is put back
 * afterwards, because `build:artifact` writes over `dist/` and the other three
 * suites read it.
 */
const { spawnSync } = require('child_process')
const path = require('path')

const run = (cmd, args, label, cwd) => {
  const t0 = Date.now()
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: cwd || __dirname })
  return { label, code: r.status === null ? 1 : r.status, ms: Date.now() - t0 }
}
const npm = (script, label) => run('npm', ['run', '--silent', script], label)
const suite = (file) => run('node', [file], file)

const results = []

// And the Pages build is made here for the same reason the artifact is. Three of
// the four suites serve `dist/`, and nothing rebuilt it — so they tested
// whatever happened to be lying there, which after a `git merge` is the tree as
// it was before the merge. That failed here exactly once and looked like the
// merge had broken three checks; it had not, the build was simply a commit old.
// A suite testing last week's build is the same failure as a suite that never
// ran, and it costs one vite run to remove.
/* The content validator, before anything is built from the content.
 *
 * CLAUDE.md names two commands as the gate before a commit: this one, and
 * regenerating the bundle to check it has not drifted. Neither ran
 * tools/validate_content.py, and nothing else did either — so a stale
 * content_hash, a `why` written on a correct answer, an item with no
 * explanation, a passage_id pointing at nothing, or a week whose answers have
 * gone cyclic would pass both and land. Demonstrated rather than assumed: one
 * hash was corrupted by hand, `npm test` reported all four suites passing and
 * the bundle check reported no drift, and the validator found it immediately.
 *
 * That is the same shape as the bug this file's own subshell note describes — a
 * gate reporting success having checked nothing — and the fix is the same, to
 * make the check part of the command people actually run rather than a thing
 * they are trusted to remember. It costs about a second and it runs FIRST,
 * because there is no point building a dist out of content that is already
 * known to be wrong.
 */
const validate = run('python3', ['tools/validate_content.py'], 'validate content', path.resolve(__dirname, '..'))
if (validate.code !== 0) {
  console.log('\n  content is invalid — fix it before the suites can mean anything')
  process.exit(validate.code)
}
results.push(validate)

const pages = npm('build', 'build pages dist')
if (pages.code !== 0) {
  console.log('\n  the Pages build failed — the three suites that serve dist/ cannot run')
  process.exit(pages.code)
}
for (const f of ['test_e2e.cjs', 'test_drive.cjs', 'test_features.cjs']) results.push(suite(f))

// the artifact is built from the same source but a different target, so it is
// made fresh here rather than trusted; dist is restored for anyone running the
// other suites again afterwards.
const built = npm('build:artifact', 'build:artifact')
results.push(built.code === 0 ? suite('test_artifact.cjs') : { label: 'test_artifact.cjs', code: built.code, ms: 0, note: 'artifact build failed' })
npm('build', 'restore pages dist')

const failed = results.filter((r) => r.code !== 0)
console.log('\n' + '─'.repeat(52))
for (const r of results) {
  console.log(`  ${r.code === 0 ? 'pass' : 'FAIL'}  ${r.label.padEnd(22)} ${(r.ms / 1000).toFixed(0)}s${r.note ? '  (' + r.note + ')' : ''}`)
}
console.log(`  ${failed.length ? failed.length + ' of ' + results.length + ' suites failed' : 'all ' + results.length + ' suites passed'}`)
console.log('─'.repeat(52))
process.exit(failed.length ? 1 : 0)
