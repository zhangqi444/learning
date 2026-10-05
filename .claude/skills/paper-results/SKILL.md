---
name: paper-results
description: Mark a practice paper Sheila sat on paper — read the photos of her marked answer sheet from her Google Drive (or a photo a parent sends in the chat), take the score and the circled question numbers for each section, file each miss under a skill, and hand back the one-click import link that adds them to her record. Use when a parent asks to mark, read, enter or add the results of a paper sat offline — the Princeton Review test or any paper added on the Mock exams page.
---

# Mark a paper she sat on paper

The contract is `docs/review.md` § "A paper's results", and what a paper feeds is
AGENTS.md § "A paper sat on paper". The site keeps the paper's shape, her scores and
the numbers she missed; the questions stay in the book.

**The book is copyrighted.** Nothing of its questions, its answer key or its pages
goes into the repository, the link or what you tell the parent — only the numbers on
her sheet and the name of the skill each missed question tests.

## 1. Find the paper and its sheet

Use the Google Drive connector, connected to the **same Google account she signs in
to the site with**. Search `title = 'progress.json'`, download it, and read `mocks`.
A record with `offline: true` is a paper sat on paper:

- `TPR` is the paper the site ships; its shape and a question→skill map are in
  `content/offline_mocks.json`. A paper a parent added has an id `P…` (the end of its
  page's address, `/mock/P…`) and carries its own shape in `def`: `name`, `sections`
  (`id`, `name`, `n`, `min`) and, on Verbal, `synonyms` — the last synonym question.
- `sheets` — `{fileId: {id, name, addedAt, removed?}}` — photos of the marked sheet,
  in the same Drive folder as `progress.json` ("Sheila ISEE Practice"). Skip any with
  `removed`.
- `file` — the paper's PDF in her Drive, if attached; `link` — a link to it.
- `entries` — results already entered; `tags` — skills a parent already picked.

Mark the paper the parent names; if they do not name one, the one with the newest
sheet. If the parent sent the photo in the chat instead, read that. If there is no
photo anywhere, say so and stop: **never guess a score.** If `progress.json` is not
found, say which account the connector sees and stop.

## 2. Read the sheet

Download each photo (`download_file_content`), decode it to a file, and **look at
it** — convert a HEIC first (`sips -s format jpeg in.heic --out in.jpg`), and crop
each section at full resolution before reading it; a downscaled whole page loses
the circles. For each section take:

- the total written on it, if there is one;
- every question number marked wrong — circled, crossed or ticked as wrong, however
  the marker marked them.

Count the marked numbers. When a written total and the count disagree, report both
to the parent and use the written total as the score; `missed` is always the list of
marked numbers. A mark you cannot read is a question you ask, not a number you add.

## 3. File each miss under a skill

A miss reaches her review only once it has a skill: review then asks two of the
site's own questions on it.

- **TPR:** `content/offline_mocks.json` already maps every question. Nothing to do.
- **Verbal** on any paper: filed by position (synonyms up to `synonyms`, sentence
  completions after). Nothing to do unless the paper is laid out differently.
- **Everything else:** if the paper's PDF is attached (`file`) or linked, read each
  missed question there and choose the skill it tests from the bank's own list:

  ```bash
  python3 tools/paper_link.py --skills
  ```

  Without the paper, file nothing: the parent can pick a skill per miss on the
  paper's page, and a miss with no skill waits there rather than being guessed.

## 4. Make the link

Write `result.json` (in the scratchpad, never the repo):

```json
{"form": "P…", "sat": "YYYY-MM-DD", "by": "Claude, asked by <parent>",
 "scores": {"VR": 30, "QR": 33, "RC": 22, "MA": 25},
 "missed": {"VR": [5, 7, 9, 10], "QR": [12, 17], "RC": [17, 18, 23], "MA": [3, 4, 5]},
 "tags":   {"QR": {"12": "Data reasoning", "17": "Decimals"}}}
```

`sat` is the day she sat it — ask if it is not on the sheet or in the chat.

```bash
python3 tools/paper_link.py result.json        # checks it, warns on any count that disagrees, prints the link
```

Give the parent the link and three or four lines: the score per section, how many
misses went under each skill, and anything you could not read or that disagreed.
They open the link on her signed-in device, check the preview, and press Add; the
same link opened twice adds nothing.
