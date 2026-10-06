---
name: paper-results
description: Mark a practice paper Sheila sat on paper — read the photos of her marked answer sheet from her Google Drive (or a photo a parent sends in the chat), take the score and the circled question numbers for each section, file each miss under a skill, and hand back the one-click import link that adds them to her record. Use when a parent asks to mark, read, enter or add the results of a paper sat offline — the Princeton Review test or any paper added on the Mock exams page.
---

# Mark a paper she sat on paper

The contract is `docs/review.md` § "A paper's results", and what a paper feeds is
AGENTS.md § "A paper sat on paper". The site keeps the paper's shape, her scores and
the numbers she missed; the questions stay in the book.

**The book is copyrighted.** Nothing of its text — a question, its choices written out,
a passage, a page — goes into the repository, the link or what you tell the parent.
The link carries the numbers on her sheet, the skill each miss tests, and what went
wrong in your own words with the letters she chose and the right ones; it lands in
her private record, never the repository.

## 1. Find the paper and its sheet

Use the Google Drive connector, connected to the **same Google account she signs in
to the site with**. Search `title = 'progress.json'`, download it, and read `mocks`.
A record with `offline: true` is a paper sat on paper:

- `TPR` is the paper the site ships; its shape and a question→skill map are in
  `content/offline_mocks.json`. A paper a parent added has an id `P…` (the end of its
  page's address, `/mock/P…`) and carries its own shape in `def`: `name`, `sections`
  (`id`, `name`, `n`, `min`) and, on Verbal, `synonyms` — the last synonym question.
- `sheets` — `{fileId: {id, name, mime, addedAt, removed?}}` — the marked sheet, as a
  scanned PDF or photos, in the same Drive folder as `progress.json` ("Sheila ISEE
  Practice"). Skip any with `removed`.
- `pages` — the paper itself, the same shape: a PDF, or a photo of each page. An older
  record may instead carry one PDF as `file`. `link` — a link to the paper.
- `entries` — results already entered; `tags` — skills a parent already picked.

Mark the paper the parent names; if they do not name one, the one with the newest
sheet. If the parent sent the photo in the chat instead, read that. If there is no
photo anywhere, say so and stop: **never guess a score.** If `progress.json` is not
found, say which account the connector sees and stop.

## 2. Read the sheet

Download each file (`download_file_content`), decode it, and **look at it** —
render a PDF to images first (`magick -density 200 sheet.pdf sheet-%02d.png`),
convert a HEIC (`sips -s format jpeg in.heic --out in.jpg`), and crop each section
at full resolution before reading it; a downscaled whole page loses the circles. For each section take:

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
- **Everything else:** if the paper is attached (`pages`, or an older `file`) or linked, read each
  missed question there and choose the skill it tests from the bank's own list:

  ```bash
  python3 tools/paper_link.py --skills
  ```

  Without the paper, file nothing: the parent can pick a skill per miss on the
  paper's page, and a miss with no skill waits there rather than being guessed.

## 4. Say what went wrong

The paper's page shows this, so write it into `result.json` rather than a document
(the owner, 5 October 2026: "I need the things in the website"). With the paper
attached, read each missed question and her bubble, and give:

- `notes` — per miss, `{"pick": "C", "key": "B", "why": "…"}`: the letter she chose, the
  right one, and one or two sentences on the mistake, **in your own words** — what she
  did, not what the question says. A word or a number is fine; the question's sentence,
  its choices written out, or a passage is not.
- `analysis` — three to six lines on what the misses have in common: a trap that
  recurs, a figure misread the same way, a skill that went wrong in both sections.

Without the paper, leave both out.

So the paper's page can show each missed question as the book prints it, put where it
sits on the PDF into its note. For the Princeton Review paper the site already has the
map; for a paper a parent added, with its PDF in hand:

```bash
python3 tools/paper_boxes.py paper.pdf --sections VR=4-6,QR=8-11,RC=13-17,MA=19-21 --into result.json
```

`--sections` is the PDF pages (from 1) each section's questions are on. Cut a few boxes
out of the rendered pages and look at them before trusting the rest; a scan with no
text layer gives no boxes, and then the page shows the notes without the questions.

## 5. Make the link

Write `result.json` (in the scratchpad, never the repo):

```json
{"form": "P…", "sat": "YYYY-MM-DD", "by": "Claude, asked by <parent>",
 "scores": {"VR": 30, "QR": 33, "RC": 22, "MA": 25},
 "missed": {"VR": [5, 7, 9, 10], "QR": [12, 17], "RC": [17, 18, 23], "MA": [3, 4, 5]},
 "tags":   {"QR": {"12": "Data reasoning", "17": "Decimals"}},
 "notes":  {"QR": {"12": {"pick": "A", "key": "C", "why": "Left out a circle the region needed."}}},
 "analysis": ["Both Venn diagrams went wrong the same way."]}
```

`sat` is the day she sat it — ask if it is not on the sheet or in the chat.

```bash
python3 tools/paper_link.py result.json        # checks it, warns on any count that disagrees, prints the link
```

Give the parent the link and three or four lines: the score per section, how many
misses went under each skill, and anything you could not read or that disagreed. The
analysis belongs on the site, through the link — not in a separate document.
They open the link on her signed-in device, check the preview, and press Add; the
same link opened twice adds nothing.
