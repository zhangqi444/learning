# Reviews — how feedback gets from a reviewer to Sheila

A parent asks Claude (or writes one themselves) to review something: one essay,
or a whole plan **week** or **month**. The review is saved with her progress in
Google Drive and shows on the site, on the thing it is about. A week or month
review can also carry **follow-up actions** that land on a named week's
checklist. This is the contract for all of it.

## Why the review goes in through the site

The site holds only the `drive.file` scope: it can see the files **it** created
and nothing else. A file a reviewer drops into Drive is invisible to it, and the
Drive connector Claude has can create files but cannot edit `progress.json`.
So a review enters through the app and is synced by the app:

1. The reviewer produces a **review** (the JSON below).
2. It is handed to the site as an **import link**,
   `https://learning.sheilazhang.org/#/import/<payload>`, where the payload is the JSON,
   UTF-8, base64url-encoded without padding. `tools/review_link.py` makes it.
   On a device where the long link is awkward there is a paste box at `#/import`.
3. Whoever opens the link sees a preview and presses **Add to Sheila's progress**.
   The review lands in `Store.s.reviews[id]`, is saved locally, and is pushed to
   `progress.json` in Drive like everything else. From there it reaches every device.
4. A copy of the review is also saved as a Google Doc in the family's
   **Sheila ISEE** Drive folder, so it is readable without the site.

If a future tool *can* write `progress.json` directly, it may put the review
straight into `reviews` there. The site reads the remote copy before every push
(`Store.pull` runs inside `flush`), so a review it has never seen is merged in,
never overwritten.

**Checked on 2026-09-13, re-checked 2026-09-28, and it still cannot.** The Google
Drive connector can *read* `progress.json` and can *create* new files, but its
`update_file` takes only `fileId`, `title` and `parentId` — it writes metadata,
never bytes, and its own description says so: "currently only title and parent_id
are supported". There is no way to add a key to an existing file. Creating a second `progress.json` is worse
than useless: the site finds its file by name, so two would be ambiguous, and
replacing the file would mean deleting her record, which hard rule 1 forbids
outright. So the import link is a real bridge over a real gap, not a step
somebody could have skipped. Re-check this before assuming otherwise; do not
re-derive it from the paragraph above.

The link carries the whole review base64url-encoded, so it runs to about 3 KB.
That is fine in a mail client, where it is a button — put it behind an anchor in
the HTML body rather than printing it as text, and never abbreviate it with an
ellipsis. On a device where the raw link is awkward, `#/import` has a paste box.

## The review

```json
{
  "id": "essay:W1:2026-09-05",
  "v": 1,
  "target": { "kind": "essay", "wk": "W1" },
  "at": "2026-09-05T18:00:00Z",
  "reviewer": "Claude, asked by Dad",
  "source": "the Essay workbook in Google Drive",
  "draftAt": "2026-09-03T23:43:21Z",
  "words": 160,
  "summary": "Two or three sentences, to Sheila, about the whole piece.",
  "strengths": ["One specific thing that worked, quoting her words.", "Another."],
  "suggestions": ["One concrete thing to do, not a label.", "At most three."],
  "next": "The one change to carry into next week.",
  "rubric": { "Idea generation": 2, "Structure": 2, "Specificity": 3, "Clarity": 3, "Grammar": 2 }
}
```

| Field | Rule |
|---|---|
| `id` | Unique. `essay:<wk>:<date>` or `mock:<form>:<date>`. A second review of the same essay on a later day is a new id; both are kept. |
| `target` | One of `{kind:"essay", wk}`, `{kind:"week", wk}` (wk = `W1`…`W8`), `{kind:"mock", form}` (`DGN`/`M01`/`M02`/`M03`), `{kind:"month", m:"YYYY-MM"}`, or `{kind:"zh", set:"YYYY-MM-DD"}` — one week of Chinese homework, by the date of the teacher's note (`content/chinese/homework/`), or `{kind:"zh", set:"L03"}` for a lesson she practises without a note. Unknown targets are dropped on import. |
| `items` | Chinese reviews only. Per-item verdicts, at most twenty: `{id, ok, note}` — `id` an exercise item id (`zx:…`) or `read` / `tell`; `ok` true, false or null; `note` one or two sentences to Sheila, Chinese first. Shown beside the item on the site. The `read` item (and a 读一读 exercise's) may also carry `passage` — the text she was to read, as printed in the book, at most 600 characters — and `heard`, the reviewer's own transcription of the recording; the site draws the comparison from them: the passage with the characters not heard highlighted, the transcript beside. Without `passage` there is no comparison, only the note: the site never holds the book's text itself (docs/chinese.md § 8). |
| `at` | When it was written. Merge key: for the same id the newer `at` wins. |
| `reviewer` | Who. Name the person who asked as well as the tool: "Claude, asked by Dad". |
| `source` | Optional. Where the reviewer read the essay, in words. Shown on the card. |
| `draftAt` | Optional. When the reviewed draft was last changed. If the essay changes after this, the card says the review is of an older draft. |
| `summary`, `strengths[]`, `suggestions[]`, `next` | Written **to Sheila**, for a ten-year-old: short sentences, her own words quoted back, concrete actions. At least one strength; at most three suggestions. |
| `rubric` | Essay reviews only. Optional, 1–4 per dimension, names exactly as in `content/essay.json` (`Idea generation`, `Structure`, `Specificity`, `Clarity`, `Grammar`, `Completion time`). Unknown names are dropped. |
| `actions` | Follow-ups, at most eight: `{text, wk, path?}`. Each lands as a row on that week's checklist, ticked by hand. `wk` must be a plan week; on a week review it defaults to that week. They are **not** plan tasks, so they never move the week's own progress percentage. |

`v` is the review format version (1). Anything else is ignored.

## Where it shows

- The essay week page shows the review card under the prompt, above the phase
  tabs, so it is there whichever tab she is on and even if it arrives from Drive
  while the page is open. A mock essay shows it under the submitted text.
- A **Chinese** review (`kind: "zh"`) shows on the Chinese home under that week's
  tasks, and each of its `items` beside the exercise it names; the free-writing
  exercises read "awaiting review" until one arrives. A note on `read`, on
  `tell`, or on a 读一读 exercise she recorded is also what reveals the
  comparison to her: the passage with the characters not heard highlighted and
  the transcript beside it appear on her page only once such a note exists —
  and, for the reading, only when the note carries `passage` (the site has no
  text of its own to compare against); before that she has her recording and a
  play button.
- A **week** review shows at the top of `/checklist/<wk>`; a **month** review at
  the top of `/checklist/month/<m>`. Their follow-ups appear as `Follow-up` rows
  on the week each names, and any still un-ticked in the current week are listed
  on the dashboard's Today card.
- The essay list card gets a **Reviewed** badge; unread reviews carry a dot there,
  on the sidebar's Essay row, and as the first job on the dashboard's Today card.
- Opening the card marks it read (`reviewsSeen`, synced), so the dot goes away on
  every device. A review is never deleted by the app.

## One account

`progress.json` is in the Drive of whichever Google account she signs in to the
site with (the OAuth client's test user, see `site/oauth.json`). The Drive
connector Claude reads must be that same account, or the file is invisible to it.

## Running a review with Claude

Repo skills: `.claude/skills/essay-review/` for one essay,
`.claude/skills/progress-digest/` for a week or a month (the one the scheduled
Routines run), `.claude/skills/chinese-review/` for a week of Chinese homework, and
`.claude/skills/paper-results/` for a paper sat on paper — it reads the photos of the
marked sheet a parent adds on the paper's page and hands back the results link below.
In short: find the essay (in `progress.json` under `essays[wk]` / `mocks[form].essay`,
or in the **Sheila ISEE Essay** workbook for weeks done on paper or in Sheets), read
the week's prompt, focus and rubric from `content/essay.json`, write the review to
her, run `tools/review_link.py` to check it and make the link, save the Doc
copy to the Drive folder, and hand the link to the parent to open.

## Storage and sync

- `Store.s.reviews` — keyed by id; in the Drive payload since schema 5.
- `Store.s.reviewsSeen` — `{[id]: {at}}`, keyed, union across devices.
- Merge: last write wins by `at` per key, like the other keyed slices.
- `test_drive.cjs` covers a review arriving from Drive and surviving a local save;
  `test_features.cjs` covers the import link, the paste box and the unread markers.

## A paper's results

A paper sat on paper away from the site (AGENTS.md, "A paper sat on paper") can be
entered by link rather than typed. The link carries no question, only what the marked
sheet says — and, if the marker says it, what went wrong (below):

```json
{"form": "TPR", "sat": "2026-10-04", "by": "Dad",
 "scores": {"VR": 24, "QR": 28, "RC": 21, "MA": 17},
 "missed": {"VR": [5, 7], "QR": [12], "RC": [17], "MA": [3]}}
```

It may also carry `"tags": {"QR": {"12": "Data reasoning"}}`, filing a missed question under one
of the practice bank's skills so review can ask about it. `form` is a paper the site ships or one a
parent added on the Mock exams page (its id, `P…`, is in its page's address).

And it may carry what went wrong, which the paper's page shows above and under the misses:

```json
"notes": {"QR": {"23": {"pick": "C", "key": "B", "why": "Asked which is NOT equal to 16, she chose one that is."}}},
"analysis": ["Five misses turn on NOT, EXCEPT or CANNOT; each answer is right without the twist."]
```

`pick` and `key` are letters; `why` is the marker's own words, never the question's text.
A link with notes and no scores adds the notes to results already in, and no entry.

A parent can add a scan or photos of the marked sheet on the paper's page; they go into
her Drive folder beside the paper's own PDF or photos (`mocks[<form>].sheets` and `pages`). The site cannot read them
— it has no server — so `.claude/skills/paper-results/` does: it reads the sheet, files
each miss under a skill from the paper's PDF, and writes this JSON.

`python3 tools/paper_link.py result.json` checks it against the paper's sections, warns
where the circled count and the score disagree, and prints the import link. Opened on
her signed-in device it previews each section, and Add puts the entry in her record and
the missed numbers into her review pile. The same link opened twice adds nothing.

