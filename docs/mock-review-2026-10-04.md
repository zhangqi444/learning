# The four mock forms against the official Lower Level and the Princeton Review paper

**Date:** 4 October 2026 · **Asked by:** the owner — "dive deep to check the quality of
your mock exam comparing with the one I provided … make sure the mock you generated is
on the right direction".

**Compared:** the site's four forms (DGN, M01, M02, M03 — 508 items, 20 passages, four
essay prompts) against ERB's *What to Expect on the ISEE — Lower Level* (its practice
test and sample sections) and The Princeton Review's Lower Level practice test the owner
supplied. The rules this review measures against are written up in
`docs/isee-item-spec.md`. Counts on the site's side come from scripts over
`content/question-banks/mock.json` and `content/passages/mock-passages.json`; counts on
the references' side were taken by reading them. Neither book's items are reproduced
here.

## Verdict

**The skeleton is right and the keys are sound; the content has drifted from the real
test in five specific ways, and the forms are not parallel.** The mocks are harder than
the real paper in mathematical content and easier in format — almost nothing to read off
a picture, shorter passages, no line references — so they measure a slightly different
child from the one the ISEE measures, and a change from one mock to the next can come
from the paper rather than from her.

## What is right

- The blueprint: 34/20, 38/35, 25/25 (five passages of five), 30/30, a 30-minute essay —
  matches both references. Synonyms then sentence completions, 17 and 17, in every form.
- Quantitative Reasoning is word problems only, with no quantitative comparisons — right
  for Lower Level.
- Sentence-completion clues lean on contrast and cause, as ERB says the real ones do.
- The reading questions span ERB's categories: main idea, supporting detail, inference,
  vocabulary in context, organization, tone.
- Every answer key was re-solved independently in the 30 August audit
  (`docs/mock-exams-review-2026-08-30.md`) and its flagged items were replaced; every wrong
  choice now says what it was, which neither reference does.

## Where it drifts

| | The site's mocks | ERB practice test | Princeton Review |
|---|---|---|---|
| Phrase completions among sentence completions | 0 of 68 | 5 of 15 | 4 of 17 |
| Synonym headwords that are adjectives | 57 of 68 (no adverbs, one noun) | 4 of 15 | 4 of 17 |
| Word choices in alphabetical order | 5 of 68 synonym sets | all | all |
| Number choices in ascending order | 35 of 150 | all | all |
| QR items that work from a figure, table, graph or number line | 2 of 152 | about 18 of 35 | about 14 of 38 |
| MA items that work from a graph, table, map or figure | 1 of 120 | about 10 of 25 | 11 of 30 |
| Math items outside the Lower Level scope | about 43 of 272 | none | a few (exponents) |
| Average passage length, words | DGN 141 · M01 93 · M02 225 · M03 154 | about 270 (193–335) | about 245 (≈170–370) |
| Reading questions that cite a line | 0 of 100 | 8 of 20 | 9 of 25 |
| Passages about a real historical person | 0 of 20 | 1 of 4 | 2 of 5 |
| Essay prompt | 2–4 sentences, 3–4 required parts | one sentence | one sentence |

1. **Verbal is narrower than the real section.** No phrase completions at all, though
   they are a quarter to a third of Part Two on both references. Synonym headwords are
   almost all adjectives, while the references lean on verbs and nouns. Choices are
   shuffled to balance the key letters instead of listed alphabetically, which is the
   official convention and one ERB teaches as a strategy.
2. **The math is pitched above Lower Level in content.** About ten items a form (43 of
   272) use material in neither reference: negative numbers (13), percent change,
   discounts and reverse percents (17), exponent expressions and powers (7), dividing by a
   fraction (3), area and volume scaling (2), and one two-draw probability (`M01-QR-006`,
   the same family as the two the August audit replaced). Meanwhile the basics both
   references lean on are thin: place value, standard form and number names 4 of 272,
   number lines 0, Venn diagrams 0, symmetry and folding 1.
3. **…and below it in format.** Roughly half of the real QR and four in ten of the real MA
   items are read off a picture — a graph, a table, a figure, a number line, a map. The
   mocks have three such items in 272. Reading a diagram is a skill the real test scores
   and the mocks never ask for, because the site has no way to draw one.
4. **The reading is shorter and unanchored.** Three of the four forms' passages are well
   under the real length — M01's average 93 words is about a third of ERB's — and no
   question cites a line, though a third of the real ones do. There is no biography of a
   real person, a staple of both references, and no "which question does the passage
   answer" item, a distinctive ERB type.
5. **The essay prompts are heavier than the real ones.** The references give one
   plain question; the site's prompts list three or four things the essay must do. Good
   writing practice, but not the task she will meet.

## The forms are not parallel

M01's passages average 93 words to DGN's 141 and M02's 225, and the headword vocabulary
moves the same way: M01's synonyms are the easiest of the four, M02's the hardest (words a
Middle Level paper would use), DGN and M03 in between. The difficulty tags do not show it —
DGN and M01 carry the same E/M/H counts in Verbal. So a rise from the diagnostic to Mock 1
could be the shorter, easier paper, and a dip at Mock 2 could be the harder one; the
readiness number reads mocks as if they were the same instrument. (The vocabulary ranking
is a judgement from the word lists, not a measured frequency; the passage lengths are
measured.)

## The practice banks share the gaps

The weekly banks were written the same way: 7 phrase completions in 191 sentence
completions, 5 of 139 synonym sets alphabetical, 9 of 480 math items with a graph, table,
number line or Venn diagram, 2 of 192 reading questions citing a line. Their passages are
closer to length (median 250 words).

## Recommended order

1. **Write to `docs/isee-item-spec.md` from now on** — done with this review.
2. **Rework Mock 1 before it is sat (19–25 October):** bring the passages into the length
   band with line numbers and line-citing questions, replace the out-of-scope math with
   in-scope items, add phrase completions, mix the headwords' parts of speech, and order
   every choice set by the official convention. Then Mock 2 and Mock 3 the same way. The
   diagnostic stays as she sat it, read as a baseline taken on a different paper.
3. **Build the two things the spec needs:** drawn figures, graphs and tables in the
   runner, and line-numbered passages. Without them about 45% of the real math formats
   cannot be asked.
4. **Re-author the weekly banks to the spec** over the remaining plan weeks.
5. **Use the Princeton Review paper as the outside check:** her score on it, entered at
   `/mock/TPR`, beside her score on the next site mock is the first sign of whether the
   site's papers run hard or easy.

## Part 2 — item level (4 October, later the same day)

The owner asked to go deeper. Part 1 counted; this part measures and reads. Three
independent reviewers each re-solved one section blind — every math item recomputed in
Python before its key was read, every passage re-answered from the text alone and checked
for its facts, every verbal item read for a second defensible answer — and the measurable
properties were computed over the files: word frequency, Flesch–Kincaid, answer-letter
sequences, option order, format cues, leaks. The sharpest claims below were re-checked
against `content/question-banks/mock.json` directly before being written down. Where a
number is a judgement it says so.

**Status at the time of writing:** all three blind reviews are complete; the math and
reading findings were re-checked against the files, the verbal findings arrived as this
session hit its usage limit and are recorded as the reviewer reported them. Nothing in
`content/` has been changed yet; the defects listed at the end are fixes still to make.
The reviewers' item-by-item files (`review_math/items.jsonl`, `review_reading/items.jsonl`,
`review_verbal/items.jsonl`) are in the session scratchpad, not the repo — they quote the
items at length and were not read for the public tree.

### Vocabulary difficulty, measured

Word frequency (the `wordfreq` Zipf scale: 5 is an everyday word such as *happy*, 4 a
common school word such as *ancient*, below 3.5 a word a child meets in books rather than
in speech, below 3 rare) over the synonym headwords:

| | Headwords: mean Zipf | median | rare (<3.5) | key plainer than headword |
|---|---|---|---|---|
| ERB practice test (15) | 3.47 | 3.37 | 8 | 12 |
| Princeton Review (17) | 3.28 | 3.30 | 11 | 16 |
| DGN (17) | 3.75 | 3.75 | 4 | 14 |
| M01 (17) | 3.90 | 3.79 | 3 | 12 |
| M02 (17) | 3.56 | 3.45 | 9 | 14 |
| M03 (17) | 3.35 | 3.24 | 13 | 14 |

**The diagnostic and Mock 1 test easier words than the real paper** (M01's five rarest
headwords sit at the level of ERB's median); M02 is close; M03 is on the Princeton
Review's level. And **the four forms are not one instrument**: the spread between M01 and
M03 (0.55 Zipf) is larger than the gap between the site and the real test. Part 1's
judgement that M02 was the hardest form was wrong by this measure; M03 is. The difficulty
tags do not track any of it — "E" headwords average Zipf 3.75, "M" 3.52, and one synonym
in 68 is tagged "H" — so the tags cannot be used to balance a form. Keys are plainer than
their headwords on every form (12–14 of 17), as on the real paper. Overlap with the weekly
banks is small (2–5 headwords a form had been practised).

### Passages, measured

| | Words (mean) | Flesch–Kincaid grade (mean) | Words per sentence |
|---|---|---|---|
| ERB practice (4) | 270 | 7.3 (5.5, 6.0, 7.1, 10.7) | 10.8–24.3 |
| DGN | 141 | 8.8 | 14.9 |
| M01 | 93 | 8.3 | 13.8 |
| M02 | 221 | 7.4 | 13.7 |
| M03 | 145 | 9.5 | 17.9 |

Shorter than the real passages and denser: three of ERB's four read at grade 5.5–7.1,
while four of the site's twenty read at grade 10–11 (`DGN-RC-P01`, `DGN-RC-P03`,
`M01-RC-P04`, `M03-RC-P01`) and M03 averages 18 words a sentence. The weekly practice
passages average grade 6.3, so the mocks are the outlier. Only M02's five passages are in
the 190–340 band; 15 of 20 are under it, none over. M01's set includes a grade-2/3 story
(`M01-RC-P02`, FK 3.9) and an 81-word worked arithmetic example (`M01-RC-P04`) whose
opening question, "how tall is the tower?" (`M01-RC-016`), is a Quantitative Reasoning
item with its numbers out of order. No passage is a biography of a real person.

### Reading: what the blind re-read found

- **Keys: 100 of 100 answerable from the passage.** One weak second reading
  (`DGN-RC-023`). The problem is the opposite of ambiguity.
- **Distractors are soft.** In 67 of 100 items (reviewer's judgement) all three
  distractors are absolutes, inventions or flat contradictions; by a plain word-list count,
  15 items have a key with no absolute word and at least two distractors carrying
  *always/never/every/only/all/completely*. In 23 of 100 the key is also the longest
  option. Items that need the text: DGN 1, M01 2, M02 5, M03 2.
- **One organization template, keyed six times across the forms**: `DGN-RC-005`,
  `DGN-RC-020`, `M01-RC-020`, `M02-RC-005`, `M02-RC-020`, `M03-RC-005` all key "a
  problem, a response, then its limit or result" against the same distractor family
  (step-by-step instructions, a list, a debate ending in a vote, a comparison with a
  winner). The diagnostic pre-teaches the other three forms.
- **Fifteen of twenty passages close on a stated lesson** (verified by reading the last
  sentences), and in 11 of those the set's main-idea or theme item paraphrases that
  sentence — so the hardest question in the set can be answered from the last line. The
  keys do not copy the sentence word for word (no main-idea key shares more than 45% of
  its characters with the closing sentence), which is why Part 1 did not see it.
- **Raw authoring tags reach the screen.** The five M02 passages carry `[¶1]`–`[¶4]` and
  the five M03 passages carry `[S1]`–`[S9]` in their text; `make_bundle.py` copies the
  text as-is and the runner's `Passage` prints it. Eight M02 stems and four M03 stems cite
  these tags ("In [¶3], 'settled' most nearly means"). The ISEE prints line numbers, not
  paragraph or sentence tags; until the passage view can number lines, the tags are a
  format she will not meet, and they are the kind of internal text the site has a rule
  against showing her.
- **Facts.** `M03-RC-P01` is invented history written in the register of a sourced
  account ("In 1872 …", "old account books show …") on a river that does not exist — the
  spec says a historical passage cites its sources, and this one has none because there
  are none. `DGN-RC-P01`'s claim that barnacle *proteins* push water away before the bond
  forms is probably wrong about the published research (the water-repelling step is a
  lipid phase); `DGN-RC-002` keys that sentence. Three M02 passages present invented
  places and people (a town hall, an archivist, a choreographer, a school's measurements)
  as real accounts with nothing marking them as fiction.
- **Six skill tags mislabel the ERB type** (`M01-RC-003`, `M01-RC-008`, `M02-RC-018`,
  `M03-RC-023` are explicit details tagged inference; `M01-RC-017`, `M03-RC-022` the
  reverse), and the 100 items use 46 distinct skill strings.
- **Weekly-bank echoes**: the September bank's ships'-flags passage pre-teaches
  `M03-RC-P01`; its owl-feather biomimicry passage is `DGN-RC-P01`'s arc; a kite story sits
  beside `M01-RC-P02`; the names Mara, Theo, Inez and Nia each appear in a mock and a bank.
- **Ranking by reading difficulty, hardest first (judgement): M02, M03, DGN, M01.** M02
  asks 2.4× M01's reading and is the only form whose distractors regularly need the text;
  M03 has the hardest prose and the most guessable items; M01 is easiest on every lens.

### Math: 272 items re-solved

- **Keys: 272 of 272 agree with an independent Python solution.** No duplicate options
  (August's `DGN-MA-005` is fixed).
- **One item is unanswerable as printed**: `M01-MA-020` — "Bases are 8 cm and 14 cm;
  height is 5 cm. Area?" never says the shape is a trapezoid; only the skill tag does.
  Mock 1 is sat 19–25 October.
- **Four items are defeated by their own trap**: the misconception each was written to
  catch produces the key. `DGN-QR-021` (averaging the neighbours 9 and 17 gives the
  median 13), `M01-QR-030` (the last digit of 2,345 is the remainder, 5), `M02-QR-013`
  (the largest numerator, 11/24, is the greatest fraction), `M02-MA-019` (mean = median
  = 17).
- **Format cues**: the key is the only decimal among whole numbers on `M01-QR-027`,
  `M01-MA-026`, `M02-QR-020`; the three prime factorisations (`M01-MA-015`, `M02-MA-026`,
  `M03-MA-015`) can be picked as the only choice written in primes; seven choices on six
  items print unsimplified fractions (2/4, 8/14, 2/14, 10/15, 8/20, 12/30, 625/10), which
  no published paper would; `DGN-QR-020` offers 3:85 p.m., not a clock time. Numeric
  choice sets in ascending order: 46 of 211 by one parse, 55 of 241 by the reviewer's —
  the same shape either way, with DGN at 0.
- **Stems**: 22 of M01's 30 Mathematics Achievement stems are fragments without a
  question ("Mean of 11, 16, 18, 25?", "Volume of a 12×4×3 prism?").
- **Rationales are the weakest layer.** 137 of 272 items carry at least one `why` that is
  wrong, contrived, or a bare back-check ("78 is too small: 21 × 78 = 1,638") that never
  names what she did to get there; 20 items have no plausible distractor at all. One is
  outright wrong: `M02-MA-007` C says 5 5/7 "also adds denominators", but adding tops and
  bottoms of 1/4 and 2/3 gives 3/7 (choice A), not 5/7. Fifteen more are contrived error
  paths, including the two the August audit flagged (`M03-MA-022`, `M03-MA-024`), which
  were rewritten with new invented slips.
- **Scope**: 49 items hit the spec's out-of-scope list (Part 1 counted 43; the difference
  is exponent-notation factorisations and one surviving circumference item,
  `M03-MA-023`, with π = 22/7 — the August purge missed it). 72 items the reviewer judges
  above grade 4–5 once un-listed topics are counted (surface area, trapezoid area, angle
  sums, inequalities, work-rate, √175 to one decimal in `M03-QR-028`). Per form,
  out-of-scope / above-grade: DGN 10/15, M01 13/19, M02 11/16, M03 15/22. Three
  nonsense-word syllogisms ("every glip is a tor") appear in M01, M02 and M03 — a
  Middle-Level register ERB's Lower Level does not use.
- **Figures**: 0 of 272 read a figure, table, graph or number line; 29 describe in words
  something the real test would draw. The spec wants about half of QR and 40% of MA.
- **Leaks**: five pairs share numbers and key across forms — `M02-QR-019`↔`M03-QR-020`,
  `DGN-QR-037`↔`M02-QR-032`, `DGN-MA-026`↔`M02-MA-017`, `DGN-MA-012`↔`M02-MA-005` (same
  four choices), `DGN-QR-036`↔`M02-MA-011`; two near-identical pairs; and within-form
  duplicates `DGN-QR-004`/`025`, `M03-QR-001`/`015`.
- **Load**: estimated 38–41 s an item in QR (55 allowed) and 33–37 s in MA (60 allowed);
  no form runs over time. QR splits half computation, half reasoning, against ERB's
  "little or no calculation".
- **Ranking by content, hardest first: M03, M01, M02 ≳ DGN**; allowing for how guessable
  the wrong options are: M03, then M02 ≈ M01, then DGN. The spread is about seven
  above-grade items between the easiest and hardest form — enough to move a score between
  mocks by itself. M03 needs pulling down to M02's level before Mock 3 is read against
  Mock 2.

### Verbal: 136 items re-read

- **Keys: 136 of 136 correct and answerable**; the five items the August audit flagged
  are fixed. Four have a second defensible answer, one of them moderate (`M02-VR-025`,
  where the rationale asserts something the stem never says) and three weak
  (`M01-VR-022`, `M01-VR-024`, `DGN-VR-022`).
- **Five keys are harder than their headword** (EAGER→enthusiastic, HINDER→obstruct,
  PATIENT→tolerant, BARREN→unproductive, SINCERE→genuine) and twelve are level with it;
  the real paper's keys are plainer.
- **Parts of speech: 57 adjectives, 10 verbs, 1 noun, 0 adverbs** in 68 synonyms; DGN,
  M01 and M02 are each 15 adjectives and 2 verbs. ERB has no part of speech above half.
- **Phrase completions: 0 of 68** on every form. Where a synonym set has exactly one
  phrase among words, the phrase is the key both times (`M03-VR-004`, `M03-VR-011`) —
  the lone-phrase tell the August audit named persists.
- **Official order: 8 of 136 sets**, all by accident; the keys were balanced to
  A36/B36/C32/D32 instead.
- **Headword level per form** (grade-4 / strong grade-5 / middle school / rarer): DGN
  8/7/2/0, M01 10/7/0/0, M02 0/9/7/1, M03 1/8/7/1. Two headwords are judged beyond the
  age (MUNDANE, METICULOUS) and 21 a stretch, 16 of them in M02 and M03. Ranking hardest
  first, by the reviewer's reading: **M02, M03, DGN, M01** — the frequency measurement
  above puts M03 narrowly ahead of M02; either way M01 is a grade easier than M02/M03,
  and the difficulty tags do not show it (DGN and M01 carry identical E/M/H counts;
  DILIGENT is tagged E and METICULOUS M).
- **Leaks**: 13 words that are a key or headword in one form and a key or headword in
  another (CAUTIOUS/cautiously, careful/very careful, tranquil, ordinary, honest, friendly,
  detailed, confirm, simple, incomplete, confusing, begin, and ENORMOUS — `M01-VR-005` and
  `M02-VR-009` are one item in two coats, same three distractors); 16 words that are a
  distractor in one form and the key in another; a shared distractor pool (*distant* ×8,
  *narrow* ×7, *ordinary* ×7, *cheerful* ×6); and twelve repeated sentence frames, the
  worst `DGN-VR-018` ~ `M03-VR-019` (icy path / wet sidewalk, same *proudly* distractor)
  and the "did Y, showing she was ___" template in `M01-VR-022`, `M02-VR-023`,
  `M03-VR-022`.
- **Least like the real item**: a preposition blank (`DGN-VR-021`), an idiom (`M02-VR-032`),
  a transition word (`M03-VR-034`), an all-phrase synonym set (`DGN-VR-005`), five
  completions that test no vocabulary because the sentence defines the word
  (`M01-VR-020`, `M02-VR-027`, `M03-VR-020`, `M03-VR-023`, `M03-VR-029`), and QUIET as a
  headword (`M01-VR-015`).
- **What a score would tell a parent**: a low one is informative (completions are well
  cued and keyed right); a high one is weak evidence — the forms differ by about a grade
  in vocabulary, half of Part One's parts of speech and all the phrase completions are
  missing, the distractors are far words so elimination substitutes for knowing, and the
  later forms are partly pre-taught by the diagnostic.

### Answer letters, option order, leaks (measured)

The August cycles are gone: no section has a run longer than two or a four-back match
above chance. But in M02's reading and in all three of M03's multiple-choice math and
reading sections the key letter **never repeats** (0 of 24–37 adjacent pairs, where
chance gives 6–9). A child who notices never picks the previous letter. The official
order (words alphabetical, numbers ascending) carries no such tell.

Thirty-eight words are keyed in one form and used in another (*honest*, *ordinary*,
*enormous*, *ancient*, *tranquil*, *friendly*, *confirm*, *detailed*, *sturdy*,
*bright*, *silent*, *skillful*, *patient* among them). Sentence frames and passages do
not repeat; the vocabulary does.

In every one of the twenty passage sets the five questions come in one order — main idea,
detail, inference, vocabulary, then structure or theme (15, 14 and 16 of 20 at the first
three positions). ERB's sets vary, and two of its categories (organization/logic,
tone/style) are nearly untouched here.

### What to fix first

**Defects, whatever is decided about the rework** — these are wrong by the site's own
rules, not by the spec:

1. Strip the `[¶n]` and `[Sn]` tags from the ten M02/M03 passages and reword the twelve
   stems that cite them (M02's paragraphs are also separated by newlines, so the
   paragraph count survives; M03's are not, so its five passages need paragraph breaks
   added). Add a validator rule that passage text carries no bracketed markup, so it
   cannot come back.
2. `M01-MA-020`: name the trapezoid. `M02-MA-007` C: a true error path. `M01-RC-016`:
   not a reading item. The four trap-gives-the-key items need a different number.
3. `M03-RC-P01`: either a real, cited history or a passage that does not pretend to be
   one. `DGN-RC-002`/`DGN-RC-P01`: correct or remove the protein claim (DGN has been sat;
   change the review text, leave her result).
4. The five identical cross-form pairs and the three syllogisms: replace in the later form.
5. Verbal: the DGN→M01–M03 leaks (tranquil, careful, friendly, honest, cautious,
   ordinary) and the ENORMOUS pair, replaced in the later form before Mock 1 is sat.

**For the rework of Mock 1 (before 19–25 October), in addition to Part 1's list**: every
distractor anchored in the passage, no absolutes as filler, no closing-lesson sentence
that the main-idea item lifts; mixed question order per set; `why` names the error path
or is left for a back-check only where none exists; whole-sentence stems; simplified
fractions; no key-only decimals; numbers ascending; a headword Zipf median near 3.3–3.4
on every form; passage FK about 5.5–7.5 at 11–17 words a sentence; forms that share no
numbers, keys, headwords or passage arcs. These belong in `docs/isee-item-spec.md` as
calibration targets and were not yet written there when this session ended.

## Part 3 — what was fixed (4 October, evening)

The owner's instruction after Part 2 was "now fix", and then "use multiple subagent to
finish the rewrite". What landed, in the order the review recommended:

**Two things the site could not do, and the spec needs.** An item may carry a `figure`
— a table, a bar or line graph, a pictograph, a number line, a coordinate grid, a
polygon with labelled sides, a Venn diagram, a spinner, a clock, a shaded whole, a
block of cubes — drawn as plain SVG by `site/src/components/figure.jsx` wherever a
question is shown: the mock runner, the practice runner, the missed-questions list. A
passage may carry `lines: true` and is printed line by line with every line numbered,
so a question can say "line 14" and the validator checks that the quoted word is on
line 14. The schema and the rules are `tools/itemspec.py`; the validator holds the
forms listed in `OFFICIAL_FORMS` to them.

**Mock 1 is rewritten whole** to `docs/isee-item-spec.md`, one section per author,
all four working to one contract and checking every draft through the repository's own
validator; each math key was re-solved in Python from the prompt and figure alone, and
the integration re-checked the forms against each other. Measured against the version
it replaces:

| Mock 1 | Before | After |
|---|---|---|
| Items read off a figure | QR 0 of 38 · MA 0 of 30 | QR 21 of 38 · MA 17 of 30, twelve figure types |
| Passage length, words | 81–104 | 327–337, all five in the band |
| Passage readability, Flesch–Kincaid | 4.9–11.0 | 5.8–6.9 |
| Line-numbered passages · stems citing a line | 0 · 0 of 25 | 5 · 10 of 25 |
| Biography of a real person | none | Mary Anning, sourced to the Natural History Museum and the UC Museum of Paleontology |
| Synonym parts of speech | 15 adjectives, 2 verbs | 6 verbs, 5 adjectives, 4 nouns, 2 adverbs |
| Synonym headword Zipf median | 3.79 | 3.37 (ERB's practice test 3.37) |
| Phrase completions | 0 | 5, last in Part Two |
| Choice sets the official order can reach, in it | 10 of 119 | 106 of 106 (the other 21 are expressions, coordinates and statements, which have no order) |
| Math items outside Lower Level scope | 13 | 0 |
| Headwords, keys or math items shared with another form | several | none |
| Essay prompt | three required parts | one sentence: "If you could add one new class to your school day, what would it be and why?" |

Keys now fall where the content puts them, so the letters are no longer balanced:
Mock 1's run has no cycle and no letter avoided, but D keys are scarcer in Verbal
because an alphabetical list seldom ends on the plain word. That is the real paper's
property too.

**The other three forms keep their shape until their own rewrite, and lost the
defects that did not need one:** the ten tagged passages of Mock 2 and Mock 3 are
line-numbered and their twelve stems cite lines; the diagnostic's impossible 3:85 p.m.
is a real wrong answer; its barnacle passage now says what the research found (an oily
layer clears the water, then the proteins bond), with the source named, and
`DGN-RC-002` asks about that; Mock 2 and Mock 3 lose the four items whose own trap
produced the key, the wrong mixed-number rationale, the five items that were the
diagnostic's with the numbers unchanged, the circumference item the August purge
missed, the two nonsense-word syllogisms, the key-only decimal, the unsimplified 8/14,
and eight verbal words the diagnostic had already taught her.

**The bank is one file per paper** (`content/question-banks/mock-<form>.json`, with
`content/passages/mock-<form>-passages.json`), at the owner's question of why four
papers were one file. The bundle came out byte-identical across the split.

**Still open:** Mock 2 (sat 2–8 November) and Mock 3 to the same spec, by the same
contract; the weekly banks; and a read of Mock 1 by someone who did not write it before
19 October.

## Part 4 — Mock 2 (5 October)

Rewritten to the same contract as Mock 1, by four authors, with each author's draft
checked through the repository's validator holding Mock 2 to the spec, and every
math key re-solved from its prompt and figure. The point of this part is the last
column: the two papers are now one instrument.

| | Mock 2 before | Mock 2 after | Mock 1 |
|---|---|---|---|
| Items read off a figure, QR · MA | 0 · 0 | 23 · 16 | 21 · 17 |
| Synonym headword Zipf median | 3.45 | 3.35 | 3.37 |
| Phrase completions | 0 | 5 | 5 |
| Passage length, words | 216–228 | 329–338 | 327–337 |
| Passage Flesch–Kincaid | 5.6–9.0 | 5.8–6.7 | 5.8–6.9 |
| Stems citing a line | 8 (as paragraph tags) | 9 | 10 |
| Choice sets in the official order, of those it can reach | 19 of 108 | 119 of 119 | 106 of 106 |
| Difficulty tags, E · M · H | 27 · 79 · 21 | 44 · 57 · 26 | 44 · 57 · 26 |
| Biography | none | Louis Braille, sourced to the Library of Congress and the Musée Louis Braille | Mary Anning |

Two things were found on the way that a single author could not have seen:

- **Sections written in parallel landed on the same scenarios in one paper** — two
  birdhouse symmetry questions, two swim-lap means, two L-shaped floor areas, a bird
  feeder twice, marbles twice. The integration now compares a paper's sections with
  each other as well as with the other papers, and the Quantitative section was
  reworked until none remained; Mock 3's two math authors get separate scenario
  themes from the start.
- **Every figure is looked at, not only tested.** A script screenshots each figure
  item as the app draws it into a contact sheet. It caught a side label drawn on top
  of an L-shape's notch, a spinner pointer through a colour name, and a long label
  cut off at the edge of the drawing. The renderer now places each label on the
  outside of its own side, shortens the pointer, sizes its margin to the longest
  label, and can draw a fold as a dashed side.

**Still open:** Mock 3 (sat 23–29 November) to the same contract; the weekly banks;
and a read of Mocks 1 and 2 by someone who did not write them.
