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
