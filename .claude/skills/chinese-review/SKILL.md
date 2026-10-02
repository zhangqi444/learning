---
name: chinese-review
description: Judge one week of Sheila's Chinese homework from her Google Drive — the free writing she handed in by Pencil (组词, 造句, answers), her retell, and her reading — and hand back a review the site shows under each task. Use when a parent asks to review, mark, check or judge her Chinese homework, or when a scheduled Routine fires for it.
---

# Judge a week of Sheila's Chinese homework

The contract is `docs/review.md` — read it first — and the shape of a week is
`docs/chinese.md` § 8. Sheila is ten; the review is written **to her**, in
Chinese with the English beside it where a parent will read it, and nothing in
it makes a bad week feel like failure.

The site has already marked what a rule can mark: the four-choice sittings, the
seven closed exercises (true/false, order, sequencing, dialogue, pairs, radicals,
structure), dictation and known-character handwriting judged stroke by stroke.
**Do not re-mark those.** Your job is what no rule can judge: the free writing,
the retell, and the reading — and one paragraph on the week as a whole.

## 1. Find the week

Use the Google Drive connector, connected to the **same Google account she signs
in to the site with** (the test user in `site/oauth.json`). Search
`title = 'progress.json'`, download it, and read `zh`:

- `zh["hw:<set>"]` is one homework note (`set` is its date, e.g. `2026-09-30`).
  - `read.attempts[]` — each reading: `transcript` (what the browser's recogniser
    heard, with no text to align it to — the site holds no passage), `ms`,
    `fileId` (the recording, in the same folder as `progress.json`, named
    `zh-read-<set>-<time>.m4a`). Older attempts may also carry
    `matched`/`total`/`heard` from when a parent pasted the passage.
  - `dictation[word]` — `ok`, and `mode: "pencil"` with `mistakes` and `strokes`
    when written with the Pencil; `mode` absent when rated by hand from paper.
  - `exercises[exId]` — for a marked exercise `right`/`n`/`answers`; for free
    writing `submitted: true` and `items[itemId] = { png, strokes, n }` where
    `png` and `strokes` are Drive file ids (`zh-ink-<set>-<item>-<time>.png` and
    `.json`); for the retell `told { transcript, ms, fileId }` and
    `parent { at, by }`; for a 读一读 exercise she read aloud, `read { transcript,
    matched, total, heard, ms, fileId }` — the same shape as a reading attempt.
- The exercises themselves — prompts, keys, explanations — are in the repo at
  `content/chinese/exercises/L05.json`; the lesson's 生字, 词语 and 读一读 lists at
  `content/chinese/lessons/L05.json`. A 组词 answer is right when it is a real
  word that uses the character; the lesson's own lists are the first place to
  check, and a correct word outside them is still correct.

If `progress.json` is not found, say which account the connector sees and stop.
Never judge from memory.

## 2. Look at what she wrote

For each free-writing item, download the `png` file (`download_file_content`;
an ink page is a few tens of kilobytes) and **look at it**. Read her characters
as she wrote them. Judge three things, each in a sentence she can act on:

- whether the answer is right (a word that exists and fits; a sentence that
  follows the pattern 是……还是……; an answer the text supports);
- whether the characters are written correctly — a wrong or missing component,
  a stroke that is plainly wrong — naming the character and the part;
- one thing done well, quoting her words.

The `strokes` file (same base name, `.json`) holds the point sequences with
pressure and time if a stroke-order question needs settling; it is not needed
for a judgment of the page.

For the retell, read `told.transcript` — what the recogniser heard, so treat an
odd character as the recogniser's before hers — and judge whether the story is
told in order with its turning point (she tries the river herself) and whether
the question (《小马过河》告诉了我们什么道理？) got an answer. For the reading, the
site holds no text to compare against — she reads from the book, by the owner's
decision of 2 October ("kids read. you do offline evaluation. in the result show
the diff."). So the comparison is made here: take the passage from the textbook
itself (the scans on the owner's Mac, `~/Downloads`, 教材 pp. 55–56 for 第五课;
docs/chinese.md § 8 says why it is never committed), listen to the recording
(`fileId`) and transcribe what she actually read, and write both into the item —
`passage` (the text as printed, at most 600 characters) and `heard` (your
transcription; the browser's `transcript` is a hint, not the truth — it drops
characters a child read perfectly well). The site draws the diff from those two:
the passage with the characters not heard highlighted, the transcript beside it.
Note only what repeats across attempts.

**Always write an item for the reading (`read`), for the retell (`tell`) and
for each 读一读 exercise she recorded (its exercise id, e.g. `zx:L05-D3-01`).**
Her page shows the side-by-side comparison — the passage with the characters
not heard highlighted, the transcript beside it — only once a review carries a
note with that id, and for `read` only when that note carries `passage`. Until then she has her recording and a
play button, nothing else, by the owner's decision (1 October 2026): no
transcript shown to her unasked, and the comparison only with an evaluation
attached. A reading without a note is a reading she never gets to compare.

## 3. Write the review

Produce the JSON in `docs/review.md` with `target: { kind: "zh", set: "<set>" }`:

- `summary`: two or three sentences on the week, warm and honest.
- `items`: one entry per free-writing item, the retell and the reading, each
  `{ id, ok, note }` — `id` is the exercise item id (`zx:L05-D2-05-1`) or
  `read` / `tell`; `ok` is `true`, `false` or `null` when it is not a yes/no;
  `note` is one or two sentences **to her**, Chinese first, then English in
  brackets if a parent will read it. The site shows each note beside its item.
- `strengths`: at least one, quoting something she actually wrote.
- `suggestions`: at most three, each one concrete thing to do next week.
- `next`: the one thing to carry forward.
- `reviewer`: "Claude, asked by <parent>" (or "Claude, on the Tuesday Routine").
  `source`: "progress.json and the ink pages in her Drive".

No grades on the week, no comparisons with other weeks, no count of what went
wrong. A character written wrong is named once, kindly, with the right form.

## 4. Check it, link it, save it

```bash
python3 tools/review_link.py review.json          # validates, prints the import link
```

Open the link on any device she uses; the site imports it into her record and
it syncs. A review is never deleted by the app; a second review of the same
week on a later day is a new one, and both are kept.
