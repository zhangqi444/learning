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
(cd site && npm run build && npm test)      # all four suites must pass
python3 site/make_bundle.py && git diff --exit-code -- site/content/bundle.json
```

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

## Verification habit

Screenshot the page you changed — desktop, phone width, and dark mode — and look
at it before saying it is done. Several regressions in this repo were invisible in
the diff and obvious in the screenshot.

If you touched an animation, that is a fourth screenshot: the same page with
reduced motion on, because the global rule removes the animation entirely and the
resting frame is all that survives. And if you touched a cat, look at it and ask
the only question that settles anything here — could a ten-year-old read this as
the cat being disappointed in her? If the answer is maybe, it is a no.
