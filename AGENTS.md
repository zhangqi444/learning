# AGENTS.md — Sheila's ISEE prep system

Read this before changing anything. It is the contract for agents and for humans.

## What this is

A prep system for **one child** — Sheila, sitting the **ISEE Lower Level** (entry to
grade 6, autumn 2027 admissions cycle). Two halves:

1. **Google Sheets workbooks** in a Drive folder — the original plan: one workbook
   per subject (VR, QR, MA, RC), plus Essay, Hub, Dashboard and Mock Exams.
   Authored and maintained with Apps Script (`build58.gs`, `RUN_ME.md`).
2. **The practice website** — `site/`, deployed to <https://learning.sheilazhang.org/>.
   This is where the work happens now. The Sheets are the archive.

Her Week-1 answers were migrated from the Sheets into the site and must never be
lost (see **Hard rules**).

## Repository layout

```
content/                 the source of truth for everything the site teaches
  question-banks/          per-subject question JSON (1,002 practice items)
  passages/                reading passages
  precision.json           8 weeks × 20 vocabulary words with meanings
  essay.json               8 weekly prompts, the guide, the rubric
  mock_essays.json         mock exam essay prompts
  calendar.json            researched ISEE dates, formats, school deadlines
  books.json               reading shelf: starter books + suggested reads
  aops.json                ISEE skill → AoPS chapter map
  catcare.json             what a cat needs, and what helps real cats — every item carries its source
  chinese/                 the Chinese half (docs/chinese.md): manifest, lessons, homework notes,
                           exercises, question banks, skills.json, stroke data — every printed
                           field in both languages (Content rules)
site/
  make_bundle.py           content/** → site/content/bundle.json (the app's only data input)
  build_seed.py *          (repo root) Sheets → site/content/seed.json, her migrated Week-1 work
  src/lib/                 store.js, engine.js, rewards.js, books.js, content.js, aops.js, router.js
  src/lib/                 the game: world.js (every world noun), quest.js (the Wordwood),
                           base.js (the Den), glim.js (a cat, generated), sfx.js (synthesised sound)
  src/pages/               one file per route
  src/components/ui/       shadcn/ui components, written into the repo (not a dependency)
  src/components/          glim.jsx (draws a cat), gate.jsx, burst.jsx and the shell
  test_*.cjs               four Playwright suites — see Testing
  run_tests.cjs            runs all five and reports, rather than stopping at the first
  oauth.json               the Google OAuth client's public facts (no secrets)
.github/workflows/pages.yml  build + deploy to GitHub Pages
docs/                     architecture.md (how it is built), design.md (why it looks and
                          behaves as it does), world.md (the world bible — read before
                          touching the game), cats.md (how the world sounds, moves and
                          behaves — read before drawing, animating or voicing a cat),
                          gamify.md (the research, and what shipped),
                          chinese.md (the design for the second category,
                          暨南大学《中文》 — the content for 第五课 is in under
                          content/chinese/; the layer itself is not built yet),
                          review.md, review notes; the living record is the
                          claude.ai "ISEE" project
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 8**, `base: './'` | static output, works under `/learning/` and inside a single file |
| UI | **React 19** + **Tailwind v4** + **shadcn/ui** | components live in `src/components/ui/`, owned by the repo and editable |
| Icons / charts | **lucide-react**, **recharts 3** | |
| Font | the device's own UI stack (`ui-sans-serif, system-ui, …`) | no webfont request; the PWA and the artifact are self-contained |
| Router | 16 lines of hash routing in `src/lib/router.js` | GitHub Pages has no server-side rewrites |
| State | one plain object + `useSyncExternalStore` (`src/lib/store.js`) | no Redux, no context tree |
| Storage | **localStorage first, Google Drive as the mirror** | see below |
| Hosting | GitHub Pages via Actions | |

**No backend, ever.** There is no server, no database and no account system beyond
Google's. If a feature seems to need one, it is the wrong feature.

## The Google file system

The app is a static page that keeps the learner's data **in her own Google Drive**.

- **Auth**: Google Identity Services token client, OAuth 2.0 implicit flow, scope
  `drive.file openid email profile`. `drive.file` is non-sensitive, so the consent
  screen can stay in **Testing** with the owner as a test user — no Google
  verification, no warning screen. Client id and project are in `site/oauth.json`.
- **Storage**: one file, `progress.json`, in a folder the app creates
  ("Sheila ISEE Practice"). The app can only see files it created.
- **Order of truth**: localStorage is written first and synchronously; Drive is a
  mirror pushed on a 1.2 s debounce. The Pages build is gated behind sign-in (below);
  the offline artifact build has no Drive and runs on localStorage alone.
- **Merge** (`Store.merge`): per key, last write wins by `at`; on a tie the richer
  copy is kept. Learning records union their attempt histories. Merging must never
  be able to delete an answer.
- **Payload**: `schema: 6` — `results, precision, essays, mocks, checklists, items,
  mixed, badges, rewards, books, booksSeeded, reviews, reviewsSeen, base, testDate,
  testFormat, pacing`. (`base` — the Den's append-only purchase ledger — is what
  took it from 5 to 6.)
  Adding a slice means bumping the schema, adding it to `init`, `merge` and `push`,
  and covering it in `test_drive.cjs`.
- **Every push reads first**: `flush` runs `pull` (GET, merge, PATCH), so a change
  another device or an outside reviewer put in `progress.json` is merged, never
  overwritten. There is no blind write: the page going hidden flushes at once,
  and an edit that still misses the window is pushed, merged, on the next open.
- **Popups**: never call `requestAccessToken` without a click behind it; browsers
  block it. First grant uses `prompt: "consent"`, later ones `prompt: ""`.

**Sign-in follows `zhangqi444/volunteer` (`js/drive.js`).** Ported in full:
`ensureToken()` silently refreshes a stale token before every API call, so the
hourly expiry never reaches the user; `api()` retries once on a 401;
`hasGrantedAllScopes` catches an unticked Drive permission at the source; the page
going hidden flushes an edit still inside the debounce (through the normal
read-merge-write, never a blind write); and `dirty` state plus an `online`
listener retries a save that failed.

**The site is gated** (`src/pages/signin.jsx`, same shape as volunteer's auth
screen): nothing renders until Google says who this is. `App` checks
`Store.signedIn()`; a stored session is refreshed behind a splash first, so a
returning visit is not a sign-in. Two deliberate exceptions:

- the artifact build has no Drive at all (`DRIVE_ENABLED === false`) and is never
  gated;
- losing auth **mid-session** does not throw her out — the header chip says
  "Reconnect Drive" and she keeps working. Only a fresh load gates.

Because the app is gated, every browser suite has to sign in first:
`test_google.cjs` holds the shared GIS stub, the in-memory Drive and a `signIn()`
helper. `sessionStorage.gisFail` makes the next token request fail.

## Reviews and digests

A parent asks Claude to review an essay, or to sum up a plan week or month. The
review reaches the site as an import link (`#/import/<payload>`), is stored in
`reviews`, synced to Drive, and shown on the thing it is about. A week or month
review can carry follow-up `actions` that become rows on a named week's
checklist. A Google Doc copy goes in the Drive folder. Contract:
[docs/review.md](docs/review.md); workflows: `.claude/skills/essay-review/` for
one essay, `.claude/skills/progress-digest/` for a week or month — the latter is
what the scheduled Routines run. Reviews are written to Sheila, never grade-like,
and never deleted by the app.

## Data model

Everything derived lives in `src/lib/engine.js` and is computed, never stored:

- `Store.s.results[setId]` — a finished practice set: `{n, right, at, wrong[], picks{}, times{}}`.
- `Store.s.items[questionId]` — the **learning record**: `{hist[], step, due, cleared,
  tag, sure, misses}`. Spaced review, mastery, pacing and the readiness score all
  read from here. `backfill()` creates records for older work; it only ever adds.
- Badges (`Store.s.badges`) are **pinned on first earning** and never recomputed away.

## Commands

```bash
cd site
npm ci
npm run dev                 # local dev server
npm run build               # → site/dist   (the Pages build)
npm run build:artifact      # → ../artifact.html (single file, Drive disabled)
npm test                    # all five Playwright suites
python3 site/make_bundle.py # rebuild bundle.json after editing content/**
```

`make_bundle.py` must be re-run and `site/content/bundle.json` committed whenever
`content/**` changes — CI fails the build if the committed bundle has drifted.

## Testing

Five suites, all real browsers against the built `dist/`:

| Suite | Covers |
|---|---|
| `test_e2e.cjs` | desktop + phone shells, navigation, a full set, persistence |
| `test_drive.cjs` | Google stubbed: sign-in once, reload without a prompt, silent reconnect, merge conflicts, a review arriving from Drive and surviving a save |
| `test_features.cjs` | precision, essay (time log, review import), mocks, calendar, checklist, learning engine, rewards, reading, AoPS pointers, the Den and the Glimbook, the Wordwood, and the cats' voices |
| `test_artifact.cjs` | the single-file build: no Drive, no external requests, host theme |
| `test_chinese.cjs` | the Chinese half: the two typed-URL stubs, the category switch and last-used root, a sitting through the shared runner, dictation read aloud and rated, the read-aloud log, that a Chinese miss leaves the ISEE dashboard untouched — and, on every kind of Chinese page it visits (the week and its workbook list, the lesson, dictation, the reading, each exercise type, a sitting and its score, the review card, a Chinese review's import page), that the chrome is Chinese in 中 and English in EN with nothing of the other |

Rules: every feature gets checks in the suite it belongs to; a UI change that
breaks a selector means fixing the test's *assumption*, not deleting the check.
All four must pass before a commit.

`npm test` runs all five whatever any of them does, and prints a pass/fail line
each (`run_tests.cjs`). It used to be the four joined with `&&`, which reads as
thrift and behaves as concealment: a failing check in the features suite stood in
front of the artifact suite for a week, and nothing in the output said a whole
suite had not run. It also builds `artifact.html` before testing it — that file
is untracked and made by hand, so it goes stale on any content change and then
fails on numbers unrelated to whatever you touched. The Pages `dist/` is rebuilt
afterwards, because `build:artifact` writes over it.

Two things in `test_features.cjs` **must run last**, and say so where they sit:
the ones that write throwaway learning history (the stubbed Drive merges it back
on the next reload — hard rule 1 working as designed — which breaks later exact
counts), and the audio checks, which replace `AudioContext` before a load and
leave every page after them deaf. World nouns are placeholders Sheila may still
change, so assertions key on numbers and surrounding sentences, not on the nouns.

## UI conventions

- shadcn/ui components only; if one is missing, add it to `src/components/ui/`
  rather than hand-rolling a div.
- Colour has one meaning each: **red** = due now, **amber** = still to do this week,
  **green/success** = done or earned, a **dot** = something new. Never a standing
  count that looks like an alarm.
- Every page must be reachable and escapable from the breadcrumb; the sidebar is
  behind a drawer on phones, so nothing may live only there.
- The nav is three groups: the working list, then the **world** (the Den and
  Rewards — the only two surfaces that produce no learning evidence), then
  **Subjects**. The Wordwood stays in the working list because every gate in it
  is recorded as ordinary `vocab` practice, and the group is never called
  "Games": that phrase means "the fun after the work", which is the framing the
  whole design exists to avoid.
- Container queries (`@md/main:`) rather than viewport breakpoints inside the shell.
- Dark mode is a first-class theme, not an inversion. Tokens in `src/index.css`.
- Numbers use `tabular-nums`. Dates render through `fmtDate`.
- **The Chinese half is bilingual by construction.** The owner's decision,
  1 October 2026: it reads as Chinese, because it is a Chinese workbook's site,
  with English behind the one 中/EN toggle in the header (`src/lib/lang.js`),
  and a page is never two languages at once. So every string the chrome shows on
  a `#/chinese/**` route — a title, a subtitle, a button, a badge, an
  `aria-label`, a placeholder, an empty state, a crumb, the sidebar's working
  list, the header's own words, the import page when the link carries a Chinese
  review — is written `t("中文", "English")` or `tf({zh, en})`, inside a
  component that calls `useLang()` so it re-renders when the toggle is tapped.
  The material is not chrome: the characters, words, sentences and passages she
  reads stay Chinese in both modes, and what carries them has an English twin in
  the content instead (Content rules, below). The shared runner follows the same
  rule for a Chinese sitting (`zhUi` in `runner.jsx`); the ISEE half never
  consults the toggle. `test_chinese.cjs` walks every kind of Chinese page in
  both states and fails on an English word in 中 or a Chinese character in EN
  (`both()`), so a new page, string or element goes into that walk with its
  content marked out by test id. Two ways it has gone wrong already: a string
  that only ever existed in one language — the first audit found dozens in each
  direction, from `字/分钟` on the reading card to "Every question" on the
  score screen — and a `t()` evaluated in a parent that never called
  `useLang()`, which hands the child a title in the language the page was
  opened in and leaves it there when the chrome around it flips.

## Content rules

- **Never invent a fact.** Dates, deadlines, chapter numbers, page counts and test
  requirements come from a named source or are left out. `calendar.json` and
  `aops.json` carry their sources.
- Vocabulary, explanations and essay guidance are written for a ten-year-old:
  short sentences, concrete examples, no talking down.
- Question banks are fact-checked before they land. A wrong answer key is worse
  than a missing question.
- **Chinese content carries both languages, by construction** — the owner's
  ask, 1 October 2026: "make sure all your content is in 2 languages". Every
  field a Chinese page prints exists in both: on a bank item `prompt`/`prompt_en`,
  `explanation`/`explanation_zh`, `why`/`why_zh` keyed alike; on a lesson, an
  exercise, a task or a block `title`/`title_en`, `what`/`what_en`,
  `pages`/`pages_en`; a `{zh, en}` object for a rule, a finding, a note, an
  explanation, a 生字 gloss, a section's `where`; `sections_en` beside a
  dictation's word list, whose keys are the book's own headings; a name in
  `content/chinese/skills.json` for every `skill` a bank uses, so a page never
  prints the id. A label's English twin carries no Chinese and its Chinese side
  no English word, because a label is chrome once it is on the page and the
  suite reads it as such; text — a prompt, a gloss, a note — quotes the material
  and only has to be present and non-blank. `tools/validate_content.py` refuses
  a missing, blank or mixed twin, and `npm test` runs it first; the twin is
  written when the field is, the way `why` is.

## How the learning system is designed

[README.md](README.md) is the readable version of this — the exam, the week table, the calendar
and the surfaces. What follows is the part an agent can break: the decisions, the reason each one
is as it is, and which of them are load-bearing.

**The unit of work is a sitting, not a question.** `chunk()` (`src/lib/content.js`) splits a
week's questions for one subject into near-equal groups of at most `SETSIZE = 12`, so 37 Verbal
questions become 10/9/9/9 and never 12/12/12/1 — a set of one is a demoralising way to finish a
subject. The app says "each set is one sitting" on the page, so *sitting* is her word and ours.
`build_seed.py` mirrors this split, so changing `SETSIZE` or the chunking rule silently invalidates
every migrated result. Do not touch it without re-deriving the seed.

**Every wrong choice is answered.** All 1,510 items carry a `why` per wrong choice, and the
validator errors on a gap in any bank. This is the property the site is *for*: an explanation can
only ever describe the correct route, so "perimeter = 2(10+3) = 26" never tells her that the 30 she
picked was the area. If you add a question, you author three `why` sentences with it or the gate
refuses the commit.

**The 8 plan weeks are 112–142 questions each, in 11–13 sittings, plus 20 words and one essay.**
The range is not flat: W3 and W4 are the heaviest at 137 and 142, because they carry the two
54-item Verbal weeks, and they fall either side of the diagnostic (W3 ends Sep 20, the diagnostic
runs Sep 21–27, W4 starts Sep 28). Whether that placement was chosen or fell out of the week sizes
is not recorded anywhere, so do not invent a reason for it — ask. What *is* certain is the
mechanism: any change to a week's item count changes its sitting count through `ceil(n/12)`, which
is what she actually feels. 37 items is four sittings; 36 is three.

**Verbal is over-weighted on purpose.** 33% of practice against 27% of the paper. 181 of its 330
items are sentence completion, which is the mechanic the whole site is built on, and Verbal gates
the rest. This has been mistaken for a defect and flagged as one; it is not. The mocks reproduce
the exam's true proportions exactly, so shape exposure lives there and the practice weeks are free
to be weighted for teaching. Do not "rebalance" the bank toward the paper without the owner asking.

**Spaced review is 1, 3, 7, 21 days** (`INTERVALS`), retiring on two correct answers on
*different* days with a check-in at three weeks. The rule that carries the weight is which answers
count as evidence: `LEARN_CTX` admits `set`, `review`, `mixed`, `mock`, `vocab` and `again`, and
excludes `corr`. A corrections pass re-asks the question whose answer she has just been shown, so
it proves nothing; `again` asks a *different* question on the same skill, so it proves something.
Adding a new context means deciding which of those two it is.

**The mastery ladder refuses to brighten on thin evidence.** Fewer than three questions attempted
caps a skill at Started. Mastered needs `PROMOTE_AT = 2` questions right in a **mixed** set or a
**mock**, on a later day than the first attempt — twice in a context that did not announce which
skill was coming. Anything overdue holds the skill at Familiar however good the accuracy.

**Readiness is six weighted parts** — accuracy 30, mock 20, mastery 20, pacing 10, review 10,
consistency 10 — and the page always names the largest weighted shortfall so there is something to
do today. Two rules inside it are decisions, not arithmetic: an overdue pile jumps the queue once
half of it is late, because it is the one lever that works the same afternoon; and **essays are
counted beside the number and never inside it**, because the ISEE returns no score for the writing
sample and a number there would measure that she wrote one rather than how well.

**The four mocks are not four of the same thing.** The diagnostic is split across two sittings
because it is a baseline and not an endurance test; the three later papers are single-sitting
because by then stamina is part of what is being measured. Each is followed by a correction pass
rather than a score, and the score card groups misses **by skill** rather than in paper order —
a real diagnostic leaves ninety-odd misses, and one flat list of them ran to forty-six screens on a
laptop and sixty-nine on a phone. Nobody reteaches anything from a page that long.

**The mock dates hang off a real test date that is not yet fixed.** The plan assumes a December
sitting; the calendar also records a Bush School group sitting on **Sat Oct 24** and an Eastside
Catholic one on **Sat Dec 5**. Those are not interchangeable — an October date falls inside Mock 1's
own week (Oct 19–25), and the Fall season closes Nov 30, which puts Mock 3 (Nov 23–29) on the wrong
side of it. Before changing any mock date, read `calendar.events` and `calendar.monthly` and work
out which sitting the schedule is actually serving.

## The game

The site is not a quiz with a game bolted onto it. It is one world — **Wildlight**
— and the practice happens inside it. The world bible is
[docs/world.md](docs/world.md): it decides what the world *is* and owns every
noun. [docs/cats.md](docs/cats.md) decides how it **sounds, moves and behaves**,
down to a button and a blink — read it before drawing a cat, animating one, or
giving anything a voice. The research behind all of it and a record of what
actually shipped is [docs/gamify.md](docs/gamify.md). What is written out below
is only the part an agent can break without ever opening those files.

**The premise.** The world has gone quiet: the meaning has drained out of it.
Sheila is a **Lampwright** and she brings it back. Every vocabulary word is a
**Glim** — a cat made of light. A cat that does not know you keeps its distance;
a cat that knows you comes when you call its name. That is recall, which is the
thing the test actually measures, so the fiction and the skill are the same act.
Cats were chosen because Sheila loves them, and then turned out to already mean
everything the system needed: a cat cannot be bought and decides about you (no
luck, no purchase), and cats gather wherever it is warm (which is why Hum exists).

**The one design rule: the content must BE the mechanic.** CodeCombat works
because the thing you are learning is the control language — you write code, the
code runs, and the world visibly does what you actually said; wrong code is a
hero walking into a pit, which teaches you what the instruction meant. Prodigy
does not work, because the maths is a toll booth between the fun parts. So the
test to apply to any proposed game feature is: **would this still work if the
questions were swapped for arithmetic flashcards?** If yes, it is a veneer.
Currency, rooms, badges and confetti all fail that test, which is fine — they are
decoration, and decoration is welcome. The mistake to avoid is shipping only
decoration and calling the site gamified. It has been made twice here already.

**Skin, Signal, Mechanic — say which one a thing is before building it.** The
veneer test is a verdict on a whole feature, which is why every proposal about
the cats turns back into the same argument about whether decoration is allowed
at all. It is. Tag the pieces instead. **Skin** looks like the world and carries
no information — a cat asleep on an empty page; free, pleasant, never pretending
to be more. **Signal** is decoration that tells the truth about real state — a
mark that appears when something has genuinely saved; it survives the flashcard
swap, so it is not a mechanic, but it is never arbitrary and it must never
signal something false. **Mechanic** is the cat *being* the content — calling a
name, brightness read from mastery — and it is the only one that passes the
test. A list that comes out all Skin is the mistake that has already been made
twice, and the tags make it visible while it is still a list. Worked examples:
[docs/cats.md](docs/cats.md) §1.

This is why the game is where it is and nowhere else:

| Surface | Why |
|---|---|
| **Vocabulary** (`/quest`, the Wordwood) | a word with a part of speech and a meaning is a typed function. The gate's inscription is a real sentence with one word taken out; calling the wrong name brings the wrong cat, and the wrong cat is shown doing what *that* word means. She is not eliminating three distractors, she is calling into the dark from everything she knows. |
| **Verbal Reasoning** (`/run/vr/...`) | 178 of the 330 VR items are already a sentence with a word removed. VR is *drawn* as the gate it already is, rather than given a game to sit beside. |
| **The precision review** (`/precision/{wk}`) | where she first meets each word, so where each cat first appears — a shadow with two eyes until she writes it in her own words. Tapping one plays its call. |
| **The review pile** (`/review`) | the page always *said* they were sitting at the door; the due words are now drawn there. Only words — a Quantitative item is not a cat. |
| **QR, MA, RC** | the *question* is deliberately plain — no cat on the stem, no cat on the choices — but the reveal is not: the skill's own cat turns up beside the answer once she has committed, which is the commitment boundary below. See **Why the numbers are not a game yet** before trying to give the question itself a mechanic. Do not wrap them in a game to make the coverage look even. |

**Why the numbers are not a game yet — and the half of it that no longer is.**
This has been looked at properly, so the next person does not have to guess. Two
mechanics were considered. One is still blocked by the *content*, not by the UI;
the other is built, and the paragraph that said it could not be finished is kept
below with the reason it was wrong.

- **A balance** — "which side is heavier" is a real weighing, and quantitative
  comparison items are natively that shape. But the bank has **8 comparison-shaped
  items out of 480**, and reading those eight, most are a probability or a
  largest-of-five rather than a true two-quantity comparison. There is still
  nothing to build it on. Adding items in that shape would be the way in, and
  nobody has been asked for them.
- **The wrong number doing the wrong thing** — the vocabulary equivalent, and the
  only version that would pass the rule above: pick 24 instead of 21 and see that
  24 is what you get if you divide instead of multiply. **This one is built.**
  The `why` field carries it per wrong choice, the runner shows it above the
  explanation, and **all 480 numeric QR/MA items have one** — 351 of them on all
  three wrong choices.

  How the ceiling came down is the part worth keeping, because the reasoning that
  set it was right. This paragraph used to say 209 of 326, with **96 items that
  could never have one**: their distractors were plausible neighbours — 10, 8 and
  7 against a correct 9 — with no mistake behind them, so the only way to give
  them a `why` was to invent the misconception, and a confident wrong reason is
  worse for her than no reason, because she cannot tell the difference and has
  every cause to believe us. That is still true and still the rule.

  So the fix was not to write reasons for those distractors. It was to **replace
  the distractors**, so that a real mistake stands behind each one: sixty of them
  across QR, MA and RC, plus seven Maths items where all three were arbitrary. A
  percent question keyed 12 now offers 36 — the three quarters that are *not*
  reserved, which is the commonest way to get a percent wrong and was not on the
  paper at all. The worst of the seven asked for the sale price of a $100 item at
  75% off and did not offer 75. An item whose wrong answers nobody could reach is
  easier than the paper it prepares her for *and* teaches nothing on a miss, so
  this was one repair rather than two.

  `tools/why_candidates.py` still decides what is writable, by looking for an
  exact arithmetic identity between a wrong choice and the numbers already in the
  question, and the rule below still refuses the useless ones.

  **An identity that adds to or subtracts from the correct answer explains
  nothing**, and the tool used to count those as writable. "37 is 34 + 3" is
  perfectly true and perfectly useless: 34 is only *the answer*, so the sentence
  measures her distance from it rather than naming what she did. Six authors
  refused to write them before the tool knew to stop offering them. Doubling and
  halving survive the rule, because "you doubled it" is a mistake with a name.

  119 items in these banks separately carry a `misconceptions` tag naming the
  trap, which is a head start on the sentence and is not itself shown to her
  anywhere. All 508 mock items carry one too, in prose rather than as a tag.

Re-derive these over `content/question-banks/*.json` minus `mock.json`, and count
"names a letter" with the pattern in `tools/audit.py` so the next reader is not
measuring a different thing. **Every QR and MA explanation — 480 of 480 — now
names no choice by letter**, which matters because the choices are reordered when
the bank is built, so a letter in prose is meaningless at best. The figures this
paragraph used to quote (70% of QR, 92% of MA) were taken under a rule that is no
longer written down anywhere and could not be reproduced; they are replaced
rather than adjusted.

**181 of the 480 explanations contain two or more `=`.** The unlocking change was
always **content, not code** — a `why` per distractor across the numeric bank —
and it is done. It improved the plain runner on its own, exactly as this
paragraph predicted: a wrong answer now says what the mistake was instead of
"The answer is C".

**The defect was never 52, and the first fix said it was zero when it was not.**
Counting "names a choice by letter" with three patterns — "choice B", "B and C",
"B is wrong" — gave 52, and after those 52 were dealt with the count read zero
while **129 references across 82 items** sat untouched: "A divides by 2 as if
only two sides counted", "C subtracts 4 instead of dividing by 4", "A, B, and D
have no evidence", "A–C misread the function". None of those forms was in the
pattern. A check that reports clean over most of what it is checking is worse
than no check at all, which is the same lesson as the leaking `cd` in CLAUDE.md
and it was learned twice.

The forms are enumerated properly in **`tools/letters.py`** now, imported by both
`tools/validate_content.py` (which errors) and `tools/audit.py` (which counts), so
there is one definition rather than two at different strengths — the weaker of the
two printing a reassuring number is exactly what made the first pass look
finished. Two cases need care and are handled: `A` is also an article, so it needs
a following verb, while a bare B, C or D in front of a lowercase word is already a
giveaway; and the word *before* rescues a real label, since "Store A is $1.50
each", "Car B gives 210 ÷ 7" and "point C lands on (7, 7)" are names the question
gave. Every form is proven by reintroducing it and watching the validator name it.

**It was never merely fragile — three items had the reasons on the wrong choices
outright.** `tools/build_weeks.py` re-randomises every item's options before a
bank ships. On `M01-QR-035` the sentence for "A" described 10 and the sentence for
"C" described 12, while A was 12 and C was 11 — and C is the **correct answer**,
so the page explained the right answer as a mistake. `M01-MA-021` had two of three
wrong, `M01-MA-023` one. Every one of the 54 mock items was re-checked by the
*value* described rather than by the letter written, because the letters could not
be trusted to say which choice they meant.

The fixes split three ways by what the prose was actually carrying. **41 Reading
items** (16 in the first pass, 25 in the second) already had a full `why` map
covering every letter named — per choice, in better words, shown above the
explanation — so the clause was duplication in the one form that goes stale, and
it was deleted. **Items whose clause named a per-distractor reason** had it moved
into `why`, where it is keyed to the choice and survives any reshuffle: 99
sentences over 31 mock items. **The rest** were rewritten to name the value or the
choice's content: "13 and 14 are the individual rates", not "C and D".

`why` keeps its letter keys throughout, because the runner and the score card look
that key up against the choice she actually picked.

**The score card had been throwing that pick away.** `why` rendered on the
runner's reveal but not in the mock's missed-questions list, which is the surface
that knows exactly which wrong choice she made and reviews it 24–48 hours later.
It showed everyone who missed a question the same paragraph. It renders `why`
above the explanation now, in the same order as the runner, and the check proves
both halves: that the sentence shown is the one for her pick, and that no row
shows a sentence belonging to a choice she did not pick.

**Every one of the 508 mock questions now answers each of its wrong choices.**
1,524 sentences, and the mock is no longer the one surface where a wrong answer
is never told what it was. `tools/validate_content.py` errors on a mock item with
a gap, proven by removing one: a mock is timed and sat once, so the missed-
questions list on the score card is the only place it ever teaches, and a figure
at zero-remaining is worth having only if something stops it drifting back.

Each subject wanted a different sentence, which is the argument against one sweep
over the whole bank. **Quantitative and Mathematics name what the number is** —
"28 is 56 ÷ 2, which counts only two sides", "64 is 4 × 4 × 4, the volume of the
box" when the question asked for the paper round it, "47 is 35 + 12, repeating the
last increase" in a sequence whose increases grow by 3. **Verbal defines the wrong
word**, because a synonym question she misses teaches nothing unless the
distractor is glossed too: "costly means expensive, and a thing can be plentiful
and cheap." **Reading was written with the passage open**, never from the
explanation — an explanation states the conclusion and cannot tell you whether a
distractor is absent from the text or contradicted by it, and those are different
sentences. Do the same. Where a distractor's origin could not be established it
says so and gives the check instead — "119 is not 9 × 14; the rate is 84 ÷ 6 = 14
boxes a minute" — rather than inventing a mistake nobody made.

Two rules of the harness that wrote these are worth knowing before adding more.
A `why` must **open with its own choice's number**, which is how the validator can
tell it is attached to the right choice at all — and that bites on coordinates,
because `(−4,7)` and `(−4, 7)` are different numbers once the commas come out, so
match the spelling the question uses. And it must not read as a **false
identity**: "27 is 3/5 of 45" parses as 27 = 0.6 and is refused, correctly.
Several drafts were rejected by both rules and rewritten.

**That is now every question in the repository: 1,510 of 1,510 carry a `why` for
each of their wrong choices**, and `tools/validate_content.py` errors on a gap in
any bank rather than only in `mock.json`. The last 134 were the practice banks —
67 in Mathematics, 62 in Quantitative, 5 in Verbal, none in Reading — and they
were the leftovers of an earlier pass that had done the harder items and skipped
the ones whose distractor had no obvious story. Where there still was none, the
sentence says what the number is not and gives the check: "38 is not 7 × 5 × 4,
which comes to 140."

**The identity guard earned its place four more times on this pass, and one of the
catches is worth keeping in mind.** "112 is 7 × 8 doubled" reads naturally and
literally asserts 112 = 56 — the check refused it and it is now "112 doubles the
product; 7 × 8 is 56." Same for "27 is 3/4 of 36" and "28 is 10 + 4 doubled".
Anything of the form "<number> is <arithmetic>" is read as a claim and evaluated,
so say "comes from" or "doubles" when you do not mean equals.

**The letter detector also had a false positive, and refusing correct content is
the worse failure**, so it was fixed rather than worked around. "In triangle ABC,
angles A and B total 102°" is the question's own labelling; the list of label
words only had singulars, so "angles A" was not excused. It now takes a plural,
and a letter once established as a label stays one for the rest of that field —
otherwise "angles A and B" is excused and the trailing "B total" is flagged
instead. The narrow cost is recorded in `tools/letters.py`: a field that labels
"point C" and elsewhere means choice C would slip through, which is the better way
round to be wrong.

**The furniture.** `src/lib/world.js` holds every world noun, so renaming
anything is a one-file edit and no component writes one as a literal.

| Thing | Is | Code |
|---|---|---|
| the **Den** | where she builds the seven things a cat really needs, at fixed published prices. Each teaches real, sourced care guidance, and building one means answering one true question about it | `lib/base.js`, `pages/base.jsx`, `content/catcare.json` |
| **Hum** | the currency, earned for *trying*, not for being right, so a hard day still counts | `lib/rewards.js` |
| the **Wordwood** | the gates; every cast is recorded as an ordinary `vocab` attempt against the word's **entry** id, so playing *is* practising. `/quest` walks everything she has met, `/quest/W3` just that week's | `lib/quest.js`, `pages/quest.jsx` |
| the **Glimbook** | the collection: every cat she has met, at its true brightness | `pages/base.jsx` |
| a **Long Night** | a mock exam — an honest rehearsal, no game furniture in the way | `pages/mock.jsx` |

**The materials are generated, never fetched.** The eight weeks hold 160 word
slots and 115 distinct words, and nobody was going to draw 115 cats or record 115
sounds, so each cat comes out of a hash of its own word
(`lib/glim.js`): a real coat, a build, socks, a bib, the eyes — and its call,
from the same seed on purpose. The coats are twelve **real** cats (tabbies,
golden-shaded, tuxedo, black, blue, cream, seal point, calico, tortoiseshell,
white) in three builds, not points on a colour wheel — a hue wheel generated
lilac and mint-green cats that exist nowhere. `test_features.cjs` guards the
closed list. `benign` is the same cat on
every device forever and always answers in the same two notes, which is what
makes recognising the cat the same act as recognising the word. Calls are two
rising notes from **one** pentatonic scale, transposed only by octaves — any
other register moves a cat off the shared scale and two cats can land a semitone
apart. Coats are `hsl()`, cats are inline SVG, calls are oscillators: the
single-file artifact still makes zero external requests, and `test_artifact.cjs`
asserts it.

**Cats react around a question, never inside one.** The question text and the
four choices are exactly what the real test prints, in every subject. What the
cats do is everything around that: on the reveal in a Maths, Quantitative or
Reading set, the **skill's own cat** turns up — the same cat the Glimbook holds,
at the brightness the engine really reports for that skill, so the Percent cat
gets brighter as she gets better at percent. It answers in its own voice, and the
finished-set card shows one cat per skill she actually got right. A miss keeps
the plain soft note and the cat does not leave, sulk or dim: nothing is taken
away for being wrong (hard rule 3). Verbal already has the cat that walks through
its gate and does not get a second one. **Corrections and mock sections get
nothing** — going back over answers is not an event, and a mock is a rehearsal.

**The game's controls wear faces; the rehearsal's do not.** In the Wordwood the
six names she can call are drawn as cats, because that *is* the game. In a
practice set the four choices stay plain words on white, because on the day it
counts they will be, and training her to scan for a ginger tabby is training her
for a test that does not exist. A VR set gets its cat only on the reveal — the
one that walks through the opened gate. `test_features.cjs` guards both halves.

**The boundary is the moment of commitment**, which is how to settle this for a
page nobody has designed yet. Before she commits an answer the screen is the
exam — plain controls, no faces, nothing to scan. After she commits, the world is
allowed back in, which is why the reveal now carries a cat, a learn card and a
chapter reference without any of them being a contradiction. The zone tables in
[docs/cats.md](docs/cats.md) §6 are a reading of that sentence and never override
it. Two things sit outside the boundary deliberately: the Wordwood, where the
controls *are* the content, and a Long Night, which gets nothing from the first
question to the last. cats.md §6 proposes one exception there — the cats she got
right arriving *after* a mock is over, resting on Sheila's *"Yes no gamify. But
at the end, could connected with the reward system?"* — and it is **not adopted**.
She asked for the reward system, which is Hum and the shelf; the collection is a
different thing, and quietly substituting one for the other is the move these
documents are careful never to make. Until the owner rules, a mock gets nothing.

**The Den teaches cat care, and never simulates neglect.** Sheila asked for this
and the guidance is real — every item in `content/catcare.json` carries a named
source (ASPCA, RSPCA, Cats Protection, International Cat Care) and says that a
vet decides what is right for a particular cat, because she does not have a cat
yet and would like one. Never invent care advice here; the content rule applies
in full.

There is deliberately **no pet simulator**: no hunger bar, no meter that falls,
nothing that can be neglected. A cat that gets sad because she missed a day of
maths is exactly the dark pattern hard rule 3 forbids. A wrong care answer costs
nothing and can be answered again; everything built stays built. Cat care is also
not ISEE evidence — it must never be recorded through the engine.

**A cat can never be disappointed in her.** The pet simulator is the version of
this mistake that is easy to see coming. The version that actually arrives is
smaller and looks like a kindness: make the empty state friendlier, have the cat
notice she has been away, let it look a little crestfallen when she gets one
wrong. That is the Duolingo owl, and a creature that looks sad because a child
has not practised is the most effective guilt engine in consumer software. So
disapproval is not softened here, it is made **inexpressible**, and these hold
for every frame of every animation:

- **A cat has no opinion about her attendance.** Nothing reacts to absence, to a
  skipped day, to a broken streak, to a late night. There is no "we missed you".
- **No cat is ever sad, hurt, hungry, cold, thin or alone.** No state a child
  could read as *I did this to it*.
- **No cat leaves.** Not from the Glimbook, not from a page, not from the Den. A
  reveal cat that walks off between questions has arrived and finished arriving;
  nothing may be *taken*.
- **A cat is never the bearer of bad news.** A wrong name brings the wrong cat
  *arriving*, which is information about the word. Nothing hisses, flattens its
  ears, turns its back or walks away from her.

If a proposed animation cannot be built without one of these, the feature is
wrong — not the animation. How the rest of it moves is
[docs/cats.md](docs/cats.md) §2 and §4.

Her answer to "what happens at the end?" was *"I finally get my cat"*. Building
everything a cat needs is something the page can honestly finish and say so.
Whether a real cat follows is a family decision about a live animal, so the
finished Den points at the reward shelf and **nothing in the code may ever imply
a cat is coming**.

**The ledger ids are permanent.** `Store.s.base` records purchases by id and an
unknown id is silently dropped, which would un-build something already paid for.
Rename a thing freely; re-key one never.

**Real cats, and the one thing not to build.** The Den also carries the advocacy
half: what fostering actually involves, why shelters need it, trap-neuter-return,
neutering, giving time. Same rule — every line sourced, nothing invented, and the
page asks nobody for money and claims no affiliation. `test_features.cjs` guards
both.

The idea that keeps coming up is linking each Glim to a specific cat waiting to
be fostered. **Do not build it.** It needs a live shelter feed, which means an API
key in a public static site and an external request the artifact build is
asserted never to make — and listings change. A cat gets adopted, or does not
make it, and a word she is learning would arrive carrying that news. The link
belongs at the level of the collection, pointing at pages the charities keep
current themselves, which is what is there.

**The questions themselves stay as they are.** Cats are the theme and the game;
they are not a reskin of the content. 244 of the QR/MA items were measured as
having a story whose objects are arbitrary and could carry a cat, and the owner's
decision is that they should not: the practice has to look like the test. Reading
Comprehension likewise keeps its own passages.

(That 244 was counted against a bank of 416 numeric items and there are now 480,
so the *ratio* is stale. The count is deliberately not adjusted here: "a story
whose objects are arbitrary" is a judgement about each question, not something a
script can recount, and a denominator updated without re-deriving the numerator
would read as measured when it was guessed. The decision it supports does not
depend on the number — the answer is no at any ratio.)

**Brightness is not part of the cat.** It is how well she knows the word, read
live from the engine and never stored: Unseen → Glimpsed → Flickering → Steady →
Bright → Radiant, mapped from the engine's own status names so the two cannot
drift. Same for a room's lights.

**Five rules hold whatever gets invented next** (the long form is docs/world.md §8):

1. **Nothing is ever lost.** No Glim leaves, no room is repossessed, no Hum expires.
2. **Nothing is rare by luck.** Every Glim is got by knowing something. No crates,
   no rarities, no duplicates to chase, no chance.
3. **The light never lies.** Brightness is derived from real mastery, never
   stored. Drawing a cat must never be mistaken for having earned it — the
   headline counts still count only what the engine genuinely knows.
4. **Missing something is never punished.** Not by a lost streak, not by a Glim
   leaving, not by a sound that feels like a buzzer.
5. **The exam is still the point.** Long Nights stay honest rehearsals: real
   timing, no hints, no game furniture in the way. That last clause is the one
   the zoning above rests on, so it is quoted in full from docs/world.md §8
   rather than trimmed.

Sound obeys the same rules: nothing plays unprompted, everything is synthesised
in `lib/sfx.js`, and `muted` silences all of it.

**Sound belongs to events involving a cat, and to nothing else.** Not to
navigation, a tab change, a checkbox, a save or a page load. Two reasons, and the
second is the one that matters: a noise on every touch stops reading as a cat and
starts reading as nagging, and it turns the mute switch from a courtesy into a
requirement. The abstract UI notes (`pick`, `right`, `wrong`) stay abstract notes
and stay where they are. Any change to how a cat *sounds* is a change to pitch or
to timbre, and those are not the same: the pitches are load-bearing — two rising
notes from one pentatonic scale, transposed only by octaves — because five gates
in a row must not produce a sour interval. Timbre is free. A call is an actual meow
now — the same pitches pushed through two bandpass formants that glide along a
vowel path, with the vowel chosen by the cat's own build, so its accent is as
fixed as its coat ([docs/cats.md](docs/cats.md) §3). What made that safe to do is
that the audio check records every frequency the page asks for: the pitches
before and after are identical to the digit, and a check that a call went through
a mouth at all fails against the version without one.

The weekly plan carries a Wordwood row, but **outside the plan's percentage**
(`auto: false`), and only once that week has yielded the six cats a walk needs.
It produces exactly the same vocabulary evidence as the word quiz, so counting it
too would charge her twice for one piece of work — and a game she is required to
play stops being one. It is in the plan so she can *find* it, which was the whole
problem: nothing outside the sidebar pointed at it. Not being owed is not the
same as not being seen, though: the row ticks itself from her own evidence and
says how many of the week's twenty words have been called, because a row that
read the same line before and after five gates looked like a game that had not
recorded anything — which is how it was reported to us.

**A word's record is keyed on the entry, never on one of its names.** An entry
like `imply / infer` is one record, `w:imply / infer`, because `wordIndex`,
`wordStatus`, `wordSummary` and `findItem` all key on the entry — and
`reviewQueue` silently drops any id `findItem` cannot resolve. The Wordwood shows
one *name* per gate and once recorded `w:infer`, which meant nine of W2's twenty
gates wrote evidence nothing could read and a cluster word she got wrong never
came back. Which name she called belongs on the attempt (`pick`), not in the id.
`backfill` carries any stranded side record onto its entry.

**A wrong choice can be told what it was.** Each item may carry a `why` map
keyed by the letters of its *wrong* choices; the runner shows it above the
explanation, on the reveal and again on the score card. The explanation can only
ever describe the correct route — told "perimeter = 2(10+3) = 26" after picking
30, she still does not learn that 30 was the area. **All 1,510 items carry one for
every wrong choice now**, and `tools/validate_content.py` errors on a gap. It began
as fifteen, all on area and perimeter, written against mistakes Sheila actually
made on an IXL set. Author it in `content/question-banks/*.json`, never for the
correct letter, and re-run the validator — every item is content-hashed.

The `misconceptions` field on 627 items is the older idea and a different one:
`make_bundle.py` has never carried it into the bundle, so it reaches her nowhere.
It is indexing for whoever is writing; `why` is the text. The two halves are not
the same shape — the 119 non-mock ones are kebab-case tags (`area-vs-perimeter`)
while all 508 mock ones are short prose naming two traps apiece ("adds
denominators; conversion"), which makes them a usable draft of a `why` and worth
reading before authoring one.

Worth reading, and worth checking. Because nothing on screen ever contradicts a
trap note, one had drifted onto the wrong question and sat there: M01-RC-021's
said "accepts Amir's initial fear", and that item is about limestone caves with no
Amir anywhere in it. The validator now refuses a note naming somebody absent from
the question, its choices, its explanation and its passage. Read against the notes
the other 507 mock items carry, the `why` sentences agreed in substance
throughout — with one place where the author had seen further than I had, on
`M01-MA-012`, where 53 is 35 + 18: the 10% value plus the percent itself, which is
a mistake with a name where I had only written "ten under".

`tools/audit.py` asks the other question — not whether an item is well formed but
whether it is a good question, which is the part no validator can gate on. It
reports and never fails: the subject balance against the real paper, whether the
answer is the longest choice often enough for her to learn that instead of the
content, stems asked twice, and explanations that name a choice by its letter.
Three things it currently finds are worth knowing before authoring more: Reading
is 11% of the practice bank against 20% of the paper, a correct Reading answer is
the longest one 37% of the time where chance is 25%, and **W4 repeats fifteen
questions verbatim from W1–W3** — every other week repeats none, so it looks like
an assembly slip rather than a decision, and it quietly lifts her W4 accuracy on
recognition.

**The readiness number has no essay in it, and the page says so.** Its six parts
are accuracy 30, mock 20, mastery 20, pacing 10, review 10, consistency 10. The
ISEE returns no score for the writing sample — it goes to the schools unscored
and they read it — so any essay part would be measuring that she wrote one
rather than how well, which is hard rule 4. Leaving it unmentioned was its own
kind of dishonesty, though: the plan carries eight weekly essays and four mock
essays, and a page reading "Test-ready" that has never looked at one overclaims
by omission. `essayStanding()` counts them and the Score page shows the counts
beside the number, saying plainly that they sit outside it.

**A week counts itself; the digest carries only the judgement.** `weekRecap(wk)`
in `lib/engine.js` computes what a plan week actually held — sets, accuracy per
subject, review answers, precision, essay, reading, active days, and which skills
slipped on *new* work — from `Store.s` alone. It renders as the `WeekRecap` card
at the top of `/checklist/<wk>`, directly above any written digest for that week.
Nothing in it waits on Drive, on a Routine, on an email, or on an import tap.

That split is the point. Mailing out numbers the browser already holds, and then
asking somebody to tap a link to bring them home, was ferrying something across a
gap that was never there. What genuinely needs a person is the reading — *"you
picked 30, and 30 is the area"* — and that is all the emailed digest is for now.
A miss during review is deliberately excluded from "what slipped": the pile doing
its job should not read as going backwards.

**Answering before reading is its own mistake.** `readFloor(it)` is the words in
the stem and the four choices at 210 a minute, floored at two seconds: under it
she cannot have read the question, whatever else is true. `paceFlag`'s "fast and
wrong" is a different and much slacker thing — half the section budget, seventeen
seconds on Verbal — and it never caught this. A miss under the floor is named on
the reveal with her own two numbers so she can check the arithmetic herself, the
week's card counts how many of the week's misses were like that, and **Careful**
in the runner holds the choices back until the question has been on screen long
enough to have been read. Careful is opt-in and off by default: a child uses
this, and a timer she did not ask for that stops her answering is a punishment,
not a help.

**We teach it ourselves first, because AoPS costs money.** Beast Academy and the
Prealgebra book are paid; only Alcumus and the videos are free. A family that
does not buy them had no way back into a question she got wrong, so
`content/learn.json` carries our own card per skill — what the question is really
asking, two or three steps, the trap named out loud, a worked example — rendered
by `LearnCard` at the top of the reveal. It is bundled text: no account, no
request, works offline and inside the single-file artifact. Fifty-one cards: every
maths and Reading skill in the bank, Reading first because nothing else in the
repo — or in AoPS, which is a maths curriculum — has ever covered it. A test
asserts the coverage, so a question carrying a skill nobody has written a card
for fails loudly instead of quietly falling through to a web search.

Outside links sit under it as site-scoped searches, each marked **free** or
**paid** so nobody meets a paywall by walking into one. Searches rather than deep
links on purpose — no environment that writes this file can reach those domains
to check a deep path, and a link that 404s in two years is worse than a search
that always lands.

**A maths miss names its chapter; only what has none falls back to a search.**
Forty-four of the forty-five Quantitative and Mathematics skills already carry a
Beast Academy unit, a Prealgebra chapter and an Alcumus topic in
`content/aops.json`, and `AopsHint` has always rendered them — on the subject
page and the review page, never on a question she had just got wrong, which is
the one moment they are worth anything. They now show on the reveal and on the
score card. AoPS is a maths curriculum: Reading's six skills and Verbal's
hundred and forty-nine words will never have one, and that is what the search is
for. The references are unit-level rather than page-level, and Alcumus has no
per-topic deep link, so it sends her there and names the topic to pick.

**A miss links out to the idea, never to the question.** `learnUrl()` in
`lib/aops.js` builds a Google search from the *skill* — "Perimeter explained with
examples", or the word itself for a vocabulary item. Searching an ISEE stem
verbatim finds homework-answer sites, which teach nothing and hand her the key; a
test asserts the query does not contain the question. It is an anchor, so the
artifact still issues no external request of its own, and it only ever appears
after the answer is revealed.

## Hard rules

1. **Learner input is sacred.** Her answers, written responses, essays and ratings
   are never overwritten, migrated destructively, or dropped by a merge. When in
   doubt, keep both copies.
2. **No backend, no accounts, no third-party analytics.** The data belongs to the
   family and stays in their Drive.
   **One exception, the owner's, 1 October 2026:** when she reads a Chinese
   passage aloud, the browser's own speech recogniser (`SpeechRecognition`,
   zh-CN) transcribes it live, and that sends her voice to Google's servers in
   Chrome or Apple's in Safari — unless the iPad does Chinese dictation
   on-device, which is a setting there, not something the site can see. Nothing
   else leaves the device; the recording itself goes to her Drive like
   everything else. The owner chose this over on-device Whisper (slow, not live,
   a large download) and over no transcript at all. If that trade changes,
   `lib/reading.js` is the only place that knows the recogniser exists.
3. **A child uses this.** No streak that punishes a missed day, no leaderboard, no
   dark pattern, nothing that makes a bad session feel like failure.
4. **Honest numbers.** A score with no data says "—", not zero. Estimates are
   labelled as estimates (the stanine band says so).
5. `git push` is the owner's. Agents commit; they do not push.
