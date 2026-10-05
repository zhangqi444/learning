# Sheila's ISEE hub

A study site built for one ten-year-old sitting the **ISEE Lower Level**. It is a static
React app with no server: everything she does is held on her device and mirrored to her own
Google Drive, so the site can be opened, closed and moved between machines without an account
anywhere except her own.

This file is the design of the *learning system* — what she practises, how much, in what order,
and why each of those is as it is. For how the code is laid out see [AGENTS.md](AGENTS.md);
for the theme and the cats see [docs/world.md](docs/world.md) and [docs/cats.md](docs/cats.md).

## The exam being prepared for

| | |
|---|---|
| Level | ISEE Lower Level — taken by candidates applying to enter grades 5–6 |
| Sections | Verbal Reasoning 34 q / 20 min · Quantitative Reasoning 38 q / 35 min · **break** · Reading Comprehension 25 q / 25 min · Mathematics Achievement 30 q / 30 min · **break** · Essay 30 min |
| Total | 127 questions plus the essay · 2 h 20 min of testing and two 10-minute breaks |
| Sittings allowed | Once per season — Fall, Winter, Spring/Summer — so three times in a school year |
| Target date | A December sitting, which is still inside the Winter season and lands before the January application deadlines |

The essay is not scored but is sent to the schools. Everything above is recorded with its source
in `content/calendar*`, and the app's Calendar page is generated from it.

## What the content is

| | count | where |
|---|---|---|
| Practice questions | **1,002** across 8 plan weeks | `content/question-banks/{vr,qr,rc,ma}-*.json` |
| Mock questions | **508** across 4 papers of 127 | `content/question-banks/mock-<form>.json`, one file per paper |
| Reading passages | 52 | `content/passages/` |
| Precision words | 160 — 20 a week | the bundle's `precision` |
| Essay prompts | 8 weekly, plus a bank of 12 | the bundle's `essay` |

Every one of the 1,510 questions carries **an explanation** of the correct route and a **`why`
for each of its three wrong choices** — a sentence saying what *that* answer actually was.
This is the single most important property of the content and it is enforced: the validator
fails if any wrong choice anywhere is left unexplained. The reason is that an explanation can
only ever describe the right answer. Told "perimeter = 2(10+3) = 26" after picking 30, she still
does not learn that 30 was the area.

## The week

Each of the eight plan weeks holds **112–142 questions**, which the app divides into
**11–13 sittings**, plus 20 precision words and one essay.

A *sitting* is the unit she experiences. `chunk()` splits a week's questions for one subject into
near-equal groups of at most `SETSIZE = 12` — so 37 Verbal questions become four sets of
10/9/9/9, deliberately never 12/12/12/1, because a set of one is a demoralising way to finish a
subject. The app says so on the page: *"Each set is one sitting."*

| | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 |
|---|---|---|---|---|---|---|---|---|
| Verbal | 37 | 37 | 54 | 54 | 37 | 37 | 37 | 37 |
| Quantitative | 27 | 27 | 27 | 40 | 40 | 40 | 40 | 39 |
| Reading | 24 | 24 | 24 | 24 | 24 | 24 | 24 | 24 |
| Mathematics | 24 | 24 | 32 | 24 | 24 | 24 | 24 | 24 |
| **questions** | 112 | 112 | 137 | 142 | 125 | 125 | 125 | 124 |
| **sittings** | 11 | 11 | 13 | 13 | 12 | 12 | 12 | 12 |

Verbal is deliberately the largest share — 33% of the practice bank against 27% of the real
paper. It is not an accident to be corrected: 181 of its 330 items are sentence completion,
which is the mechanic the whole site is built around, and Verbal is the section that gates the
rest. The mock papers reproduce the exam's true proportions exactly, so test-shape exposure is
covered there and the practice weeks are free to be weighted for teaching.

## The calendar

```
W1–W3   Aug 31 – Sep 20   three plan weeks
        Sep 21 – 27       Split diagnostic (Part A: VR+QR · Part B: RC+MA+Essay)
W4–W6   Sep 28 – Oct 18   three plan weeks
        Oct 19 – 25       Mock 1 — full length, one sitting
        Oct 26 – Nov 1    correction and retest
        Nov 2 – 8         Mock 2 — full length
W7–W8   Nov 9 – 22        two plan weeks
        Nov 23 – 29       Mock 3 — final readiness rehearsal
```

The diagnostic is **split across two sittings** on purpose. It is the first full-length thing
she has ever done and the point of it is a baseline, not an endurance test; the three later mocks
are single-sitting because by then stamina is part of what is being measured.

Each mock is followed by a correction pass rather than a score. The score card groups her misses
**by skill** rather than in paper order, because a real diagnostic leaves ninety-odd misses and
one flat list of them ran to forty-six screens on a laptop — nobody reteaches anything from a
page that long.

## How practice turns into progress

**Spaced review.** A missed question comes back after **1 day, then 3, then 7, then 21**. Getting
it right on two *different* days retires it, with one check-in three weeks later. Answers given
in a corrections pass immediately after seeing the key do not count as evidence — but a
*different* question on the same skill does, because she has not been shown its answer.

**And the return is two different questions.** The pile asks the skill, not the item: a missed
question comes back as **two** other questions on the same skill, picked for the day, and both have
to be right for the original to move along; a wrong one becomes a miss of its own. The question she
got wrong is never asked again — not at a later review, not at the 21-day check-in — unless the
bank holds nothing else on that skill. The owner set it on 4 October 2026: "the review should not do
the same questions. should do different questions. you should double the workload." Serving the
stored item meant both of the correct answers that retire a miss could be given from memory of the
reveal she had just read. Precision words never had the fault: a word's question is rebuilt from
the day's seed, so the word comes back and the question is new.

**The mastery ladder.** Not started → Started → Needs work → Familiar → Proficient → Mastered.
A skill with fewer than three questions attempted is capped at Started, so the ladder cannot
brighten on thin evidence. Reaching Mastered takes **two** of its questions answered correctly in
a **mixed** set or a **mock**, on a later day than the first attempt — that is, twice in a context
that did not announce which skill was coming. Anything still overdue holds the skill at Familiar
however good the accuracy, because a skill you have not revisited is not one you have kept.

**Readiness** is one number out of six weighted parts, and the page always names the part with
the largest shortfall so there is something to do next:

| part | weight | what it reads |
|---|---|---|
| Accuracy | 30 | recent sets, mixed sets and mock sections |
| Mock exams | 20 | the most recent finished paper, as a percentage and a stanine |
| Skill mastery | 20 | the ladder above, item-weighted |
| Pacing | 10 | share of timed answers inside the per-question budget |
| Review health | 10 | how much of the review pile is overdue rather than scheduled |
| Consistency | 10 | active days in the last 14 |

Essays are counted **beside** the number and never inside it, because the ISEE returns no score
for the writing sample and a number there would measure that she wrote one rather than how well.

## The surfaces

| route | what it is for |
|---|---|
| `/` | today — the next set, what is due, the week's checklist |
| `/s/<subject>/<week>` | a subject's sittings for one plan week |
| `/review` | everything a miss has scheduled, by subject, with the cause breakdown |
| `/mixed` | twelve questions, all four subjects, shuffled — where Proficient becomes Mastered |
| `/precision/<week>` | the week's 20 words, then a quiz on them |
| `/essay/<week>` | plan, draft, revise against that week's rubric |
| `/mock`, `/mock/<form>` | the four papers, timed by section, then corrections by skill |
| `/mock/TPR` | a paper sat offline: its sections and source, and the scores a parent enters once it is marked |
| `/score` | readiness, its six parts, and the trend across weeks |
| `/calendar` | the real exam dates, registration cutoffs and application deadlines |
| `/books` | the independent-reading log — titles chosen for the skills the ISEE tests, but kept out of the readiness score |

## Running it

```bash
cd site && npm install && npm run dev
```

Before committing anything, from the repository root:

```bash
(cd site && npm run build && npm test)
```

```bash
python3 site/make_bundle.py && git diff --exit-code -- site/content/bundle.json
```

The subshell is not optional — see the note in [CLAUDE.md](CLAUDE.md) about what a leaking `cd`
does to the second command. `npm test` runs the content validator first, so the content is
checked before anything is built out of it.

## Changing the content

Content lives in `content/**`. After editing it, re-run `python3 site/make_bundle.py` and commit
the regenerated `site/content/bundle.json`. Every item is content-hashed, so the validator will
tell you if a hash and its item have drifted apart.

The validator (`tools/validate_content.py`) enforces, among other things: a `why` for every wrong
choice and none for a right one; arithmetic inside a `why` that actually evaluates; no choice
named by its letter in any prose, because the options are re-randomised before a bank ships; and
that answer positions across a week are not cyclic. `tools/audit.py` asks the other question —
not whether an item is well formed but whether it is a good question, which no validator can gate.
