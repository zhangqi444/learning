---
name: workbook-results
description: Mark the Chinese workbook (练习册) Sheila did on paper — read the photos she posted on the site's 练习册 page from her Google Drive, mark every item against the keys in the lesson's exercises file, note her free writing, and hand back the one-click import link that puts the marks in her record. Use when a parent asks to mark, check or read her workbook photos, or the workbook she did on paper.
---

# Mark the workbook she did on paper

The owner, 8 October 2026: most weeks she does the 练习册 in the book and posts
photos; the site marks it the way it marks an offline ISEE paper. What she did
is in the photos; the keys are in `content/chinese/exercises/<lesson>.json` (and
`content/chinese/question-banks/zh-*.json` for the four-choice blocks), read off
the book and checked twice. Mark against those keys — never against memory.

## 1. Find the photos

Use the Google Drive connector, on the account she signs in with. Search
`title = 'progress.json'`, download it, and read `zh`: each `wbp:<lesson>` record
holds `files` — `{fileId: {id, name, mime, addedAt, removed?}}` — the photos (or a
PDF) of her pages, in the folder beside `progress.json`. Skip any with `removed`;
`markedAt` is when the last marking was added, so photos added after it are the
new ones. Mark the lesson the parent names, else the one with the newest photos.
If there are no photos, say so and stop: **never guess a mark.**

## 2. Read the pages

Download each file, decode it, render a PDF to images
(`magick -density 200 in.pdf page-%02d.png`), convert a HEIC
(`sips -s format jpeg in.heic --out in.jpg`), and look at each page at full
resolution, cropping where her writing is small. For each page, find which
exercise it is: the workbook's day banner (星期一…), the exercise number and its
title, against `python3 tools/zh_marks_link.py --keys <lesson>`, which lists every
exercise and block with its page and each item's key.

## 3. Mark

- **A marked item** (`tf`, `order`, `slots`, `match`, `sort`, `pick`, and a block's
  four-choice items): her answer against the key. `true` or `false`; for a block
  item also the letter she chose, `{"ok": false, "pick": "A"}`.
- **A character she wrote** (`write`): right only if it is the character, with no
  wrong or missing stroke you can see. Stroke order cannot be read from a photo —
  do not mark it.
- **Free writing** (`free` — 组词, 造句, answers): no mark. Write a note for it in a
  review (step 4), as `chinese-review` does.
- An item she left blank, or a page that is not in the photos, is **left out**, not
  marked wrong. A mark you cannot read is a question for the parent, not a guess.

## 4. Make the link

Write `marks.json` in the scratchpad (never the repo):

```json
{"lesson": "L06", "by": "Claude, asked by Dad",
 "marks": {"zx:L06-D2-03": {"zx:L06-D2-03-1": true, "zx:L06-D2-03-2": false},
           "zb:L06-D2": {"zc:L06-01": {"ok": true, "pick": "B"}}},
 "review": {"id": "zh:L06:photos:2026-10-08", "v": 1, "target": {"kind": "zh", "set": "<the week's set>"},
            "at": "…", "reviewer": "Claude, asked by Dad", "source": "her workbook photos in Drive",
            "summary": "…", "items": [{"id": "zx:L06-D2-04-1", "ok": null, "note": {"zh": "…", "en": "…"}}]}}
```

`review` is optional and in `docs/review.md`'s shape for a Chinese week; its
`target.set` is the week the lesson's newest note has (or the lesson id when no
note assigned it). Then:

```bash
python3 tools/zh_marks_link.py marks.json     # checks every id and every pick against the key, prints the link
```

Give the parent the link and three or four lines: each day's score, what went
wrong in a phrase, and anything you could not read. Hand the link over **from the
tool's output**, never retyped. Opened on her signed-in device, the link previews
the marks and, on Add, puts them in her record: each exercise shows its score and
its wrong items with the lesson's explanations, and a wrong four-choice item joins
her Chinese review the next day. The same link opened twice adds nothing.
