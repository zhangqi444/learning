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

const run = (cmd, args, label) => {
  const t0 = Date.now()
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: __dirname })
  return { label, code: r.status === null ? 1 : r.status, ms: Date.now() - t0 }
}
const npm = (script, label) => run('npm', ['run', '--silent', script], label)
const suite = (file) => run('node', [file], file)

const results = []
for (const f of ['test_e2e.cjs', 'test_drive.cjs', 'test_features.cjs']) results.push(suite(f))

// the artifact is built from the same source but a different target, so it is
// made fresh here rather than trusted; dist is restored for anyone running the
// other suites again afterwards.
const built = npm('build:artifact', 'build:artifact')
results.push(built.code === 0 ? suite('test_artifact.cjs') : { label: 'test_artifact.cjs', code: built.code, ms: 0, note: 'artifact build failed' })
npm('build', 'rebuild pages dist')

const failed = results.filter((r) => r.code !== 0)
console.log('\n' + '─'.repeat(52))
for (const r of results) {
  console.log(`  ${r.code === 0 ? 'pass' : 'FAIL'}  ${r.label.padEnd(22)} ${(r.ms / 1000).toFixed(0)}s${r.note ? '  (' + r.note + ')' : ''}`)
}
console.log(`  ${failed.length ? failed.length + ' of ' + results.length + ' suites failed' : 'all ' + results.length + ' suites passed'}`)
console.log('─'.repeat(52))
process.exit(failed.length ? 1 : 0)
