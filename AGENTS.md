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
  question-banks/          per-subject question JSON (834 items)
  passages/                reading passages
  precision.json           8 weeks × 20 vocabulary words with meanings
  essay.json               8 weekly prompts, the guide, the rubric
  mock_essays.json         mock exam essay prompts
  calendar.json            researched ISEE dates, formats, school deadlines
  books.json               reading shelf: starter books + suggested reads
  aops.json                ISEE skill → AoPS chapter map
  catcare.json             what a cat needs, and what helps real cats — every item carries its source
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
  oauth.json               the Google OAuth client's public facts (no secrets)
.github/workflows/pages.yml  build + deploy to GitHub Pages
docs/                     architecture.md (how it is built), design.md (why it looks and
                          behaves as it does), world.md (the world bible — read before
                          touching the game), gamify.md (the research, and what shipped),
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
npm test                    # all four Playwright suites
python3 site/make_bundle.py # rebuild bundle.json after editing content/**
```

`make_bundle.py` must be re-run and `site/content/bundle.json` committed whenever
`content/**` changes — CI fails the build if the committed bundle has drifted.

## Testing

Four suites, all real browsers against the built `dist/`:

| Suite | Covers |
|---|---|
| `test_e2e.cjs` | desktop + phone shells, navigation, a full set, persistence |
| `test_drive.cjs` | Google stubbed: sign-in once, reload without a prompt, silent reconnect, merge conflicts, a review arriving from Drive and surviving a save |
| `test_features.cjs` | precision, essay (time log, review import), mocks, calendar, checklist, learning engine, rewards, reading, AoPS pointers, the Den and the Glimbook, the Wordwood, and the cats' voices |
| `test_artifact.cjs` | the single-file build: no Drive, no external requests, host theme |

Rules: every feature gets checks in the suite it belongs to; a UI change that
breaks a selector means fixing the test's *assumption*, not deleting the check.
All four must pass before a commit.

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

## Content rules

- **Never invent a fact.** Dates, deadlines, chapter numbers, page counts and test
  requirements come from a named source or are left out. `calendar.json` and
  `aops.json` carry their sources.
- Vocabulary, explanations and essay guidance are written for a ten-year-old:
  short sentences, concrete examples, no talking down.
- Question banks are fact-checked before they land. A wrong answer key is worse
  than a missing question.

## The game

The site is not a quiz with a game bolted onto it. It is one world — **Wildlight**
— and the practice happens inside it. The world bible is
[docs/world.md](docs/world.md); the research behind it and a record of what
actually shipped is [docs/gamify.md](docs/gamify.md).

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

This is why the game is where it is and nowhere else:

| Surface | Why |
|---|---|
| **Vocabulary** (`/quest`, the Wordwood) | a word with a part of speech and a meaning is a typed function. The gate's inscription is a real sentence with one word taken out; calling the wrong name brings the wrong cat, and the wrong cat is shown doing what *that* word means. She is not eliminating three distractors, she is calling into the dark from everything she knows. |
| **Verbal Reasoning** (`/run/vr/...`) | 178 of the 330 VR items are already a sentence with a word removed. VR is *drawn* as the gate it already is, rather than given a game to sit beside. |
| **The precision review** (`/precision/{wk}`) | where she first meets each word, so where each cat first appears — a shadow with two eyes until she writes it in her own words. Tapping one plays its call. |
| **The review pile** (`/review`) | the page always *said* they were sitting at the door; the due words are now drawn there. Only words — a Quantitative item is not a cat. |
| **QR, MA, RC** | deliberately plain. See **Why the numbers are not a game yet** below before trying to change this. Do not wrap them in a game to make the coverage look even. |

**Why the numbers are not a game yet.** This has been looked at properly, so the
next person does not have to guess. Two mechanics were considered and both are
blocked by the *content*, not by the UI:

- **A balance** — "which side is heavier" is a real weighing, and quantitative
  comparison items are natively that shape. But the bank has **8 comparison-shaped
  items out of 408**. There is nothing to build it on.
- **The wrong number doing the wrong thing** — the vocabulary equivalent, and the
  only version that would pass the rule above: pick 24 instead of 21 and see that
  24 is what you get if you divide instead of multiply. That needs each distractor
  to carry *what mistake produces it*, and none of them do. Deriving it would mean
  inventing the misconception, which the content rules forbid.

Two facts worth keeping: 71% of QR and 91% of MA items have all-numeric choices,
and only 145 of 408 explanations show two or more steps of working. So the
unlocking change is **content, not code** — a `why` field per distractor across
~400 items. That would also improve the plain runner on its own, because a wrong
answer could then say what the mistake was instead of "The answer is C".

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
they are not a reskin of the content. 244 of the 408 QR/MA items have a story
whose objects are arbitrary and could carry a cat, and the owner's decision is
that they should not: the practice has to look like the test. Reading
Comprehension likewise keeps its own passages.

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
   timing, no hints.

Sound obeys the same rules: nothing plays unprompted, everything is synthesised
in `lib/sfx.js`, and `muted` silences all of it.

The weekly plan carries a Wordwood row, but **outside the plan's percentage**
(`auto: false`), and only once that week has yielded the six cats a walk needs.
It produces exactly the same vocabulary evidence as the word quiz, so counting it
too would charge her twice for one piece of work — and a game she is required to
play stops being one. It is in the plan so she can *find* it, which was the whole
problem: nothing outside the sidebar pointed at it. Not being owed is not the
same as not being seen, though: the row ticks itself from her own evidence and
says how many of the week's twenty words have been called, because a row that
read the same line before and after five gates looked like a game that had not
recorded anything — which is what it was told to us as.

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
30, she still does not learn that 30 was the area. Fifteen items carry one so
far, all on area and perimeter, written against mistakes Sheila actually made on
an IXL set. Author it in `content/question-banks/*.json`, never for the correct
letter, and re-run `tools/validate_content.py` — every item is content-hashed.

The older `misconceptions` field on 616 items is a *tag* (`area-vs-perimeter`),
not prose, and `make_bundle.py` has never carried it into the bundle. It is
indexing for us, not text for her; `why` is the text.

**The readiness number has no essay in it, and the page says so.** Its six parts
are accuracy 30, mock 20, mastery 20, pacing 10, review 10, consistency 10. The
ISEE returns no score for the writing sample — it goes to the schools unscored
and they read it — so any essay part would be measuring that she wrote one
rather than how well, which is hard rule 4. Leaving it unmentioned was its own
kind of dishonesty, though: the plan carries eight weekly essays and four mock
essays, and a page reading "Test-ready" that has never looked at one overclaims
by omission. `essayStanding()` counts them and the Score page shows the counts
beside the number, saying plainly that they sit outside it.

## Hard rules

1. **Learner input is sacred.** Her answers, written responses, essays and ratings
   are never overwritten, migrated destructively, or dropped by a merge. When in
   doubt, keep both copies.
2. **No backend, no accounts, no third-party analytics.** The data belongs to the
   family and stays in their Drive.
3. **A child uses this.** No streak that punishes a missed day, no leaderboard, no
   dark pattern, nothing that makes a bad session feel like failure.
4. **Honest numbers.** A score with no data says "—", not zero. Estimates are
   labelled as estimates (the stanine band says so).
5. `git push` is the owner's. Agents commit; they do not push.
