# CLAUDE.md

**Read [AGENTS.md](AGENTS.md) first** — project context, stack, the Google Drive
contract, testing and the hard rules live there. This file is only the
working agreement for Claude Code sessions.

## Before you change anything

- The living record is the **claude.ai "ISEE" project** — check the docs there for
  what was decided and why; write a doc back when you finish something substantial.
- Touching the game (the Wordwood, the Den, the cats, the sound)? Read
  **AGENTS.md § The game** and then **[docs/world.md](docs/world.md)**. The one
  rule that has already caught two attempts: the content must *be* the mechanic.
  If a feature would work just as well with the questions swapped for arithmetic
  flashcards, it is a veneer — the owner has rejected that twice.
- Changing **what she practises, how much of it, or when** — a week's item count, the
  chunking, the review intervals, the mastery thresholds, the readiness weights, a mock
  date — means reading **AGENTS.md § How the learning system is designed** first, and
  [README.md](README.md) for the shape of it. Those numbers are decisions with reasons
  attached, not defaults. Two of them have already been mistaken for defects and
  "fixed": Verbal's 33% share, which is deliberate, and the week loads, which are uneven
  on purpose. A third is a trap — `SETSIZE` and `chunk()` are mirrored in
  `build_seed.py`, so changing either invalidates every migrated Week-1 result.
- Anything at the level of a button, a blink or a noise is
  **[docs/cats.md](docs/cats.md)** as well — it decides how the world sounds,
  moves and behaves. Say which of Skin, Signal or Mechanic the thing is before
  you build it, and check it against the four guardrails under **A cat can never
  be disappointed in her**. The next wrong turn here will not look like a veneer;
  it will look like being kind.
- Work in `site/`. Content edits go in `content/**`, then re-run
  `python3 site/make_bundle.py` and commit the regenerated `site/content/bundle.json`.

## Before you commit

Run both from the repository root:

```bash
(cd site && npm run build && npm test)      # all five suites must pass
python3 site/make_bundle.py && git diff --exit-code -- site/content/bundle.json
```

`npm test` now runs `tools/validate_content.py` first and stops on it, so the
content is checked before anything is built out of it. It did not, until a
checker pointed out that neither of these two commands ever called the
validator — and that was demonstrated rather than argued: one `content_hash` was
corrupted by hand, and `npm test` reported every suite passing while the
bundle check reported no drift. A stale hash, a `why` written on a correct
answer, an item with no explanation, a `passage_id` pointing at nothing, or a
week whose answer positions have gone cyclic would all have landed. That is the
same failure as the leaking `cd` below, and it wants the same remedy: put the
check inside the command people actually run, rather than trusting them to
remember a third one.

The subshell is not decoration. Without it the `cd` leaks into the second line,
`site/make_bundle.py` is looked for at `site/site/…` and fails, the bundle is
never rebuilt — and `git diff -- site/content/bundle.json` then matches no path
from inside `site/` and **exits 0**. The gate reports success having checked
nothing, which is the one failure a check must never have.

If a check fails because the UI legitimately changed, fix the test's assumption —
never delete the check. That licence does not extend to a check that exists to
stop a thing being built: if an assertion about a cat, a sound or a Long Night
fails, the feature is what is wrong. Deleting or loosening one of those is a
decision for the owner, not a way through a red suite.

## Committing

- **Work on `main`.** One person owns this repo and reviews the change as it is
  made, so a feature branch and a merge back are pure ceremony. Commit to `main`
  and, in a remote session, push it. Branch only when the owner asks for one.
  (A remote session may be *started* on a `claude/…` branch; fast-forward `main`
  to it and carry on there.)
- On the owner's own clone, commit and leave the push to them.
- A push to `main` deploys the site, so the checks above are not optional.
- Commit messages: what changed and *why it was wrong before*, in prose. No
  bullet-point changelogs of file names.
- Trailers:

```
Co-Authored-By: Claude <noreply@anthropic.com>
Claude-Session: <session url>
```

## Things that have bitten before

- **`npm test` needs `playwright`, and nothing declares it.** It is not in
  `site/package.json`, so it survives only as an un-tracked install in
  `node_modules`. Run `npm ci` — which installs exactly what the lockfile says —
  and all five browser suites die at once with "Cannot find module 'playwright'",
  in zero seconds, which reads like a catastrophe and is a missing package.
  Reinstall it with `npm i --no-save playwright`.
- **A stale `node_modules` reads as a missing upstream module, and it is not.** After
  `fbb7e6e` moved the chrome into `@zhangqi444/ui`, the build died with `"./app/app-shell"
  is not exported under the conditions ["module","browser","production","import"]`. The
  installed copy of that package had no `app/` directory and an `exports` map with three
  entries, so the obvious reading — that the six `app/*` modules had never been published
  and the owner was holding them locally — is the one I wrote down, and it was wrong.
  **The pinned commit contains all of them.** `git ls-remote` only tells you the newest
  commit, not what is inside the one you have; to see that, list the pinned tree:
  `git clone --filter=blob:none --no-checkout https://github.com/zhangqi444/ui.git` then
  `git ls-tree -r --name-only <sha>`. Reinstalling the pin fixed it, and the fix has to
  name the four packages that get pruned in the same breath, per the entry below:

```bash
npm i --no-save "git+https://github.com/zhangqi444/ui.git#<sha>" playwright@1.63.0 @rolldown/binding-darwin-arm64@1.2.7 lightningcss-darwin-arm64@1.32.0 @tailwindcss/oxide-darwin-arm64@4.3.3
```

  Use the **https** URL even though the lockfile resolves that dependency over
  `git+ssh`, so the install does not depend on a loaded key. `--no-save` leaves both
  `package.json` and `package-lock.json` untouched, which was verified by diff rather
  than assumed.
- **Installing anything can strip the native binaries**, through the npm
  optional-dependency bug (npm/cli#4828). The build then stops with "Cannot find
  native binding" naming one module; install it and the next one appears. On this
  Mac the three are `@rolldown/binding-darwin-arm64`,
  `lightningcss-darwin-arm64` and `@tailwindcss/oxide-darwin-arm64`, at the
  versions of `rolldown`, `lightningcss` and `@tailwindcss/oxide` in
  `node_modules`. **Install them in one command, with playwright.** Each
  `npm i --no-save` prunes the extraneous packages the last one added, so doing
  them one at a time has them deleting each other and the loop never ends.
  Do **not** take npm's advice to delete `package-lock.json`: it is pinned
  deliberately — see "Fetch the git dependency over https, and lock it to the
  real repo" — and regenerating it would undo that silently.
- Building into `site/dist` on the owner's Mac fails when file deletion is not
  granted. Build to a scratch dir instead: `npx vite build --outDir "$HOME/distcheck" --emptyOutDir`.
- The Google popup cannot be opened without a user gesture, and cannot be reached
  by browser automation. Auth changes are verified with the stub in `test_drive.cjs`.
- `applySeed` and `backfill` run on every load. Both must be idempotent and additive.
- Bumping the Drive `schema` means updating `init`, `merge`, `push` and the drive test.
- Changing how a cat *sounds* means changing a test stub, not just `sfx.js`. The
  audio checks install a fake `AudioContext` carrying `createGain` and
  `createOscillator` and nothing else, and assert every pitch is a member of one
  pentatonic set. The timbre work in docs/cats.md §3 needs `createBiquadFilter`
  on that stub first — without it the call throws inside `sfx()`'s own
  `try/catch`, which swallows it, so the page goes *quiet* rather than erroring
  and the suite reports a silent cat with no reason attached.
- A new keyframe is two edits: the animation in `src/index.css`, and a look at
  the page with motion reduced. The global rule deletes every animation outright,
  so the resting frame is the whole of what that reader sees — an animation
  written frame-one-first is correct only on the machine you tested it on.
- `test_artifact.cjs` tests `../artifact.html`, which is **untracked and built by
  hand**. `npm test` builds it for you now and puts the Pages `dist/` back
  afterwards, because `build:artifact` writes over it. Run `node
  test_artifact.cjs` on its own and you are testing whatever file happens to be
  lying there — after any content change that fails on numbers with nothing to do
  with what you touched, which is how it went stale for a week without anyone
  noticing.
- Rebuilding `site/dist` from a scratch build loses `dist/content/bundle.json`:
  the Vite plugin's `closeBundle` copies it to a hard-coded `dist/content/`, so a
  `--outDir` build followed by a copy leaves the app with no data to fetch and
  every suite times out at the sign-in gate for no stated reason.
- **Tailwind v4 does not scan `node_modules`.** The shadcn primitives come from
  `@zhangqi444/ui` now, so the whole of their styling hangs on one line —
  `@source "../node_modules/@zhangqi444/ui/src";` in `src/index.css`. Remove it
  and the build still succeeds, every import still resolves, and all five suites
  still pass, because they assert on text, roles and behaviour and cannot see a
  missing rule; the page just renders as unstyled HTML. `check_css.cjs` compares
  the class names only the package uses against the stylesheet the build
  produced, and runs at the end of both `npm run build` and `build:artifact` —
  inside the command the deploy runs, for the same reason the content validator
  had to move inside `npm test`. With the line, 74 of 185 such classes are in
  the stylesheet; without it, 2, and the build stops. In the artifact target it
  stops *before* `scripts/artifact.mjs`, so a stripped `artifact.html` is never
  written.
- **An svg handed to a `Button` is resized by it.** The button's base class
  carries `[&_svg:not([class*='size-'])]:size-4`, and a CSS rule beats a
  `width`/`height` attribute, so an icon whose className has no `size-` in it
  renders at 16px whatever its attributes say. The shared `GoogleMark` said 18
  and drew 16 for exactly this reason; the sign-in page's own
  `className="size-[18px]"` was what had been holding it at 18, and dropping it
  during the move changed eight pixels. It cost one screenshot diff to find and
  would never have shown up in a test — `GoogleButton` takes `markClassName`
  now, and the call site says what it means.
- **A check that reads a Drive status without waiting is a race.** The chip
  climbs local → connecting → syncing → live. A bare `textContent` read after
  sign-in wins most of the time and fails when the upload is a few milliseconds
  slower, which reads as "the header is broken" and is not. Wait for
  `[data-testid=drive-button]:has-text("Saved to Drive")`, and report what the
  chip actually said when it does not arrive.
  The same race wears another coat in `test_features.cjs`: an edit made to
  localStorage under a live page is saved over by the page's next flush, up to
  1200 ms later, so a read-back that holds at once proves nothing. `setLs`
  there holds the value past that window before carrying on; a check that
  edits the store by hand goes through it, never through a bare `evaluate`.
- **A Playwright timeout on a reload, minutes after the same suite passed, wants
  `uptime` before it wants a diff.** On 2 October the Drive suite died twice at
  two different lines — a `page.reload` that never reached `networkidle`, then a
  run that sat silent for nine minutes — with no change anywhere near it. The Mac
  was at a load average over 300, 15 GB of disk free of 926 and CacheDelete
  purging, with 126 MB of memory unused; the browser's timers were being starved,
  not the page broken. Read the load, wait it out, and rerun. A suite that passes
  three gates and then fails at a line the change did not touch is the machine
  until shown otherwise.
- **A check that reads the real calendar will fail on a date nobody chose.**
  `test_features.cjs` clicked the dashboard's "Show N done" fold as soon as the
  page loaded. That fold only exists once something on the open week is
  finished, and every row the tile draws is computed from her work — none can be
  ticked by hand. So on the first morning of a plan week there is nothing to
  show and no toggle to click: on 28 September, the day W4 opened, the suite
  died on a 30-second timeout naming a selector, with nothing in the diff to
  explain it. The check had only ever passed because the day it was written fell
  mid-week. The fix is to make the finished item — quick-add one and tick it —
  rather than hope the date supplies one. Anything asserting on `spanOpen()`
  wants the same treatment, or `pg.clock.install`.
- **`t()` reads the language when it runs; only `useLang()` makes it run again.**
  `t(zh, en)` in `src/lib/lang.js` is a plain function over the current value,
  and `useLang()` is what subscribes a component to the toggle. A title computed
  in a parent that never subscribed and handed down as a prop keeps the language
  the page was opened in, while the child that did subscribe flips around it:
  `ZhBlockRun` built the sitting's title and only the Runner called `useLang()`,
  so the buttons flip to English and the title they sit under stays Chinese.
  Found by reading the wrappers, not by the suite — the check that flipped the
  runner read its buttons and never its title. Each of the three Chinese
  wrappers subscribes for its own sake now, and the `both()` walk in
  `test_chinese.cjs` reads the title with the rest of the chrome, which is how
  the next one shows up as a red line instead of a screenshot.

## Verification habit

Screenshot the page you changed — desktop, phone width, and dark mode — and look
at it before saying it is done. Several regressions in this repo were invisible in
the diff and obvious in the screenshot.

If you touched an animation, that is a fourth screenshot: the same page with
reduced motion on, because the global rule removes the animation entirely and the
resting frame is all that survives. And if you touched a cat, look at it and ask
the only question that settles anything here — could a ten-year-old read this as
the cat being disappointed in her? If the answer is maybe, it is a no.
