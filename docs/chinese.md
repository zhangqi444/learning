# Chinese — the second category

The site has taught one thing since it existed: the ISEE Lower Level, on a plan that
ends with a test in December. This document is the design for the second thing —
Chinese, from the textbook her Chinese school actually uses — and for the category
layer that has to exist above both before either can be called by name.

It is a design, not a record of work: nothing below is built yet. Read
[AGENTS.md](../AGENTS.md) § How the learning system is designed first, and
[docs/world.md](world.md) before the Glim section at the end.

## 1. What is being learned

**《中文》, 暨南大学华文学院, 新三版 (the 2023 third edition).** The series is written
by the College of Chinese Language and Culture at Jinan University under commission
from the Overseas Chinese Affairs Office of the State Council, for the children of
overseas Chinese families and for the Chinese schools they attend — which is exactly
the case here. It runs to **twelve volumes**, each sold as a set of three books: the
textbook (课本) and two exercise books (练习本 A and 练习本 B). The third edition keeps
that shape and refreshes the texts, adding contemporary subjects — 天眼 (the FAST
radio telescope), 北斗, 港珠澳大桥, 高铁, 网购.

Sources, because the content rules require them:

- [暨南大学 — 华文学院为何被称为"华文教育领头羊"](https://www.jnu.edu.cn/2023/1028/c2618a770801/page.htm) and
  [创新育人模式培养更多中华文化传播者](https://www.jnu.edu.cn/2023/1024/c2618a769739/page.htm) — the commission, the audience, and the third edition's new texts.
- [中国华文教育网 ·《中文》](http://old.hwjyw.com/textbooks/downloads/zhongwen/) — the twelve volumes, per-lesson, with 练习本 A/B and teaching references.
- 新三版 in print: [第2册 ISBN 9787566825278](https://www.amazon.com/%E6%9A%A8%E5%8D%97%E5%A4%A7%E5%AD%A6%E4%B8%AD%E6%96%87%E6%95%99%E6%9D%90%E7%AC%AC2%E5%86%8C-Universitys-Zhongwen-textbook-exercise/dp/7566825275),
  [第3册 ISBN 9787566825285](https://www.amazon.com/%E6%9A%A8%E5%8D%97%E5%A4%A7%E5%AD%A6%E4%B8%AD%E6%96%87%E6%95%99%E6%9D%90%E7%AC%AC3%E5%86%8C-Universitys-Zhongwen-textbook-exercise/dp/7566825283), 暨南大学出版社.

**The target is the HSK** (汉语水平考试), which the owner named after the first draft of
this document was written — and it invalidates two of that draft's decisions; see
§ 3. The level and the sitting date are open, and both have to be fixed before any
readiness number or mock paper can honestly exist, because each is calibrated
against one specific paper.

**The volume is 第四册.** 小马过河 is its 第五课 — the official per-lesson PDF sits at
`old.hwjyw.com/fj/jcxz/zhongwen/4/5.pdf`, and its text is that story. One caveat
that governs every page number in a homework note: the free copies on that site are
an **earlier edition**, so "课本 52 页" in her homework is a page in 新三版 and may not
be page 52 there. Page numbers come from her book, never from the download.

**Two facts are not yet established and nothing may be authored on top of them.**
One secondary source describes a volume as four 单元 of twelve 课 in total; that is a
single uncorroborated claim about a series that has just been revised, so the lesson
count comes from **the book in her hand**, not from here. And the pages are not in
hand: a homework note names 课本 52 and 55–56 and the exercise book's 星期一–四, and
what is printed on them cannot be guessed at — least of all a 听写 list, which is
the one thing in a week's homework that has to be exact.

## 1a. The exam — and why the level is not ours to pick yet

The HSK is one exam with levels, not a family of exams, and **the levels changed in
2026**, which makes "HSK 3" mean something different from what it meant last year.
Secondary sources agree on the shape; the official specification has not been read
yet and must be before a single mock is built (§ 3).

- The old standard ran **six levels**, with vocabulary targets of roughly
  150 / 300 / 600 / 1,200 / 2,500 / 5,000 words.
- **HSK 3.0**, announced by the Ministry of Education in March 2021, runs **nine
  levels in three bands** — Elementary 1–3, Intermediate 4–6, Advanced 7–9 — with
  about 11,000 words and 3,000 characters across the whole range. Band 1 is around
  **300 characters and 500 words**, Band 3 around **900 characters and 2,245
  words**: roughly double the old exam at the same number.
- It **replaced the old exam on 1 July 2026**, with the first official sitting of
  the new papers reported for **13 December 2026**.
- The **YCT** (Youth Chinese Test) is the separate younger-learner exam — four
  levels at about 80 / 150 / 300 / 600 words, with 拼音 printed at every level,
  where HSK drops 拼音 from level 3 onward. YCT 4 is usually put level with the old
  HSK 3.

Two things follow, and the second is the one that matters.

**HSK 3.0 formally separates the characters you must read from the characters you
must write by hand, and the handwriting list starts at Band 1.** Her teacher's
听写 homework is therefore not a traditional extra beside the exam — it is
practice for something the new standard explicitly tests. That is a point in favour
of building the 听写 slice properly rather than approximating it with
multiple choice (§ 8).

**The level should fall out of what she already knows, not be chosen first.** Asking
which level to aim at before counting the characters the textbook has actually
taught her is backwards: 第四册 has a cumulative 生字 list, the official level specs
have theirs, and comparing the two gives an answer with a reason attached instead of
a guess. So the order is: get the 生字 lists for 第一–四册, count them, read the
official Band 1–3 specifications, and *then* recommend a level and a sitting.

Sources (all secondary — the official spec at the exam's own site is still to be
read): [Hanyu Shuiping Kaoshi — Wikipedia](https://en.wikipedia.org/wiki/Hanyu_Shuiping_Kaoshi),
[GoEast — new HSK levels (2026)](https://goeastmandarin.com/new-hsk-levels/),
[Is HSK 3.0 already in effect? (2026 status)](https://moyuchinese.com/en/blog/is-hsk-3-0-in-effect),
[HSK 3.0 vs 2.0 changes](https://www.echineselearning.com/blog/hsk-3-vs-hsk-2-changes-explained),
[YCT vs HSK for children](https://www.lingoace.com/blog/hsk-vs-yct-how-to-choose/),
[YCT guide](https://www.digmandarin.com/yct-guide).

## 2. Two categories, two URLs, one record

The asked-for shape is `learning.sheilazhang.org/isee` and
`learning.sheilazhang.org/chinese`. Those URLs are available — `site/public/CNAME`
puts the site at the root of its own domain, so a path segment is free — but two of
the obvious ways to serve them are wrong, and for the same reason.

**Not two builds, and not two deploys.** A second app under `/chinese/` is a second
`localStorage` origin key, a second sign-in, and a second `progress.json`. Her
record would split down the middle, and hard rule 1 says learner input is sacred —
an answer that is in the other app's file is, from where she is standing, an answer
the site lost. One app, one store, one Drive file. That is not a preference; it is
the constraint everything else in this section works around.

**One deviation from the table above, made on purpose.** `#/isee/s/vr/W3` works, and
so does `#/s/vr/W3`: the ISEE routes keep their un-prefixed form as well as taking
the prefix. Eighteen files and three suites address them the short way, and a
rewrite would have churned all of it for an address bar. New links are written
short; the typed URL `/isee` and its stub resolve to the same pages. The Chinese
routes have only the prefixed form.

**So: the category is the first route segment.** Hash routing is what makes GitHub
Pages (no server rewrites) and the single-file artifact behave identically, and it
stays:

| Now | After |
|---|---|
| `#/s/vr/W3` | `#/isee/s/vr/W3` |
| `#/run/ma/W3/0` | `#/isee/run/ma/W3/0` |
| — | `#/chinese/l/L03` · `#/chinese/run/zc/L03/0` |

`#/` with no category opens the category she used last, and the site remembers that
in `localStorage` only — it is a convenience, not learning evidence, so it has no
business in Drive.

**The typed URLs are two redirect stubs.** The build writes `dist/isee/index.html`
and `dist/chinese/index.html`: a dozen lines each, no assets, `location.replace`
to `../#/isee`. They cannot be copies of the app — `base: './'` would resolve the
hashed asset URLs against `/chinese/`, where nothing is served — so a stub it is,
one hop, and the address bar ends up on the hash route.

**Two things that will bite if they are not done in the same commit as the stubs.**
`site/public/sw.js` serves a navigation it cannot fetch from `caches.match('index.html')`,
which means a *first* offline visit to `/chinese/` would be answered with the root
document under the wrong path and its assets would 404 — so both stubs join
`PRECACHE`. And `manifest.webmanifest` still says "Sheila's ISEE Practice" with
`short_name: "ISEE"`; installed on her iPad, the two-category site would be called
after one of its halves.

## 3. What Chinese shares with ISEE, and what it must not

The valuable part of this repository is not the ISEE content; it is the engine, and
the engine is not ISEE-shaped. `recordAttempts`, `INTERVALS`, `LEARN_CTX`,
`skillLevel`, `reviewQueue` are keyed on item ids and contexts. Chinese gets all of
it, unchanged.

**Shared, as-is:** the spaced schedule (1, 3, 7, 21 days, retiring on two correct
answers on different days with a three-week check-in); the mastery ladder, including
its refusal to brighten on thin evidence; `chunk()` and `SETSIZE = 12`, so a sitting
stays a sitting in both halves of the site; the runner; the corrections pass; `why`
on every wrong choice; the Den and Hum; the badges.

**Not shared, each for a reason:**

- **The eight dated plan weeks.** The ISEE spine is a curriculum *we* wrote: eight
  weeks, each with its item count, laid out between here and the exam. Chinese has
  an exam date too (§ 1), but it does not have that — what sets the pace is an
  ordered book and a teacher who assigns from it weekly, neither of which is ours
  to plan. So the Chinese spine is **the lesson, `L01…Ln`, not the week** — and `currentWeek()`, `spans()`, `spanOpen()`, `D.breaks` are
  never asked a question about Chinese. This is the single most important line in
  this document. Folding Chinese into the eight weeks would change a week's item
  count and therefore its sitting count through `ceil(n/12)`, which AGENTS.md names
  as load-bearing and which is the thing she actually feels.
- **The mocks and the readiness score — struck out, and the correction is worth
  recording.** The first draft of this document gave Chinese neither, because
  there was no paper to rehearse and a number calibrated against a timed test
  would measure nothing. The reasoning was sound and the premise was wrong: the
  goal is the **HSK**, so there is a paper, and the mock machinery and the
  readiness score are precisely what a dated exam wants. What survives is the
  condition — neither can be built until the **level and the sitting date** are
  fixed, because the section counts, the timings and the pacing budget come from
  one level's published specification, and those are facts to be sourced rather
  than assumed. Until then Chinese reports only what it can count: 生字 known of
  met, lessons finished, review pile, days active.
- **Pacing, and this one is a trap rather than a decision.** `engine.words()` is
  `split(/\s+/)`, and written Chinese has no spaces — a whole 课文 returns **1**.
  Every length-derived number downstream (`readFloor`, `tooFast`, `paceFlag`,
  the passage-word budget) would therefore not fail but quietly produce nonsense,
  which is worse. Chinese practice is untimed, pacing is excluded at the category
  boundary, and if a reading budget is ever wanted it is counted in characters by
  a function that says so in its name. The HSK goal does not rescue the whitespace
  split — it sharpens it, because an HSK pacing budget is something we will
  actually want, computed from a word count that is always 1.

## 4. Content layout

`content/` keeps its shape; Chinese arrives beside it rather than inside it.

```
content/chinese/
  manifest.json            volume, edition, ISBN, publisher — the provenance of every item below
  lessons/L01.json         one file per 课: 课文, 生字 (character · 拼音 · meaning), 词语, 句型
  question-banks/
    zh-char.json             汉字: recognition, 拼音, meaning
    zh-word.json             词语: the lesson's words in a sentence with one gap
    zh-read.json             阅读: questions on the 课文
```

Three subjects, not four. 汉字, 词语 and 阅读 are each a real section of the book and
each already has machinery waiting for it: the 课文 is a passage and reuses the `p`
field and the passage renderer exactly; 词语 in a sentence with a gap **is the
sentence-completion mechanic the whole site is built on**, arriving in a second
language. **Handwriting is in, and judged on the device.** The first draft of this section
put it out of reach — no canvas, no stroke-order data. The owner's brief changed
that: she does the homework, the result is kept digitally, and it is judged by a
rule where a rule can exist. The Pencil gives the rule its evidence. For a
*known* character — the 生字 she copies, a dictation word she writes from
hearing, a character under its pinyin — `hanzi-writer` (MIT) runs a stroke quiz
against reference data from Make Me a Hanzi (`hanzi-writer-data`, Arphic Public
License; the 57 characters this lesson needs are vendored under
`content/chinese/strokes/` beside the licence file and inlined in the bundle, so
nothing is fetched and it works offline and in the artifact). Each stroke she
draws is matched in order; the drawn paths are kept with the answer, stroke by
stroke, with whether each matched — the stroke sequence the owner asked for. A
character written with at most two slips (or a quarter of its strokes, whichever
is more) counts as written: a decision, not a measurement, because a
ten-year-old mis-starts strokes and the quiz already makes her redo them. The
validator refuses to ask for a character that has no stroke data. *Free*
writing — 组词, 造句, answers to the text — has no key: an ink canvas keeps the
page as a PNG and the strokes as point sequences with pressure and time, both
uploaded to her Drive as their own files, and the `chinese-review` skill judges
them; the site says "awaiting review" and never guesses a mark. The retell is
recorded and transcribed like the reading, with a parent's tap as the signature
the book asks for. Typing was offered and declined: it exercises nothing.

Item ids are namespaced from the first commit, because retrofitting a prefix means
rewriting learning records and hard rule 1 forbids losing them: `z:` for a 汉字,
`zc:` for a 词语 — alongside the existing `w:` for an ISEE precision word, which
`findItem` and `rescueWordSides` already special-case and which will need to know
about the new two.

**The workbook's closed exercises are a fourth file and a third prefix.** The
owner's brief, after the first week: she does the homework, the result is kept
digitally, and it is judged — by a rule wherever a rule can exist, by a Routine
where it cannot. Seven of 第五课's fifteen paper exercises have one answer the
book fixes — true/false, word order, sequencing, a sentence into a slot, parts
into pairs, a character into a structure group — and they live in
`content/chinese/exercises/L05.json` as typed exercises (`tf`, `order`,
`slots`, `match`, `sort`), each item under a `zx:` id with its key and a
two-language explanation for a miss, marked on the device. The validator checks
each type's own shape: a key that is not a permutation of its pieces, a pair
past the right-hand column, a miss with nothing to say. They record as evidence
(ctx `exercise`, which `LEARN_CTX` does not admit) and never enter the review
pile, because the review runner is four-choice. The eight that remain —
handwriting, 组词, 造句, the answers, the retell — wait on the Pencil canvas
with stroke capture and the `chinese-review` skill.

**Everything she reads is in both languages, and the page shows one at a time.**
The owner's ask, after the first lesson: the chrome went Chinese with English
behind one toggle at the top right of the header (`lib/lang.js`), and then the
content followed — every item carries `prompt_en`, `explanation_zh` and `why_zh`
beside `prompt`, `explanation` and `why`; the 生字 glosses are `{zh, en}`; the
paper exercises carry the English the book itself prints under each heading.
The runner reads by the page's language with English as the fallback, so an
ISEE item renders as it always has. The validator holds the two together:
`why_zh` must answer the same wrong choices as `why`, never the correct one,
never blank.

**The validator applies unchanged, and gains two rules.** Four choices, none blank
or duplicated, a `why` on each of the three wrong ones, a resolving `passage_id`,
a matching `content_hash`, and answer positions that are not cyclic — all of it
holds for Chinese, and `npm test` already runs `tools/validate_content.py` first and
stops on it. The two additions: the "a word question must say what the word means"
rule extends to a 汉字 meaning question, which is the same shape as
"RESOLUTE most nearly means"; and **no item may teach a character its lesson does
not** — every 生字 a bank uses has to appear in that lesson's 生字 list, because a
question built on a character the class has not reached is the Chinese version of
the bug `met()` exists to prevent.

**The bundle grows a sibling key, and ISEE's keys do not move.** `make_bundle.py`
adds `zh` next to `subjects`, `weeks` and the rest. Restructuring into
`categories: {isee, chinese}` is the tidier object and the wrong change: it churns
every `D.*` reference in eighteen files and puts the migrated Week-1 seed in the
blast radius for an aesthetic gain. The category layer belongs in `content.js` as a
lookup — `SUBJ`, `ORDER` and `subjProgress` become per-category — not in the data.

## 5. Drive: schema 6 → 7

Her Chinese work has to reach the same `progress.json`, and the cheapest correct way
is to **add almost nothing**. `results` is keyed by set id and `items` by question
id; distinct subject keys (`zh-char`, `zh-word`, `zh-read`) and distinct id prefixes
mean Chinese set and item records land in the existing slices without collision and
without a migration — her ISEE record is not read, rewritten or touched. The merge
rules that protect it are the same rules, and they keep working.

One genuinely new slice is needed: the lesson's own state — what she wrote, her
self-ratings, which 课 she counts as done — which is `precision`-shaped and becomes
`zh`. Per AGENTS.md that means `schema: 7`, added to `init`, `merge` and `push`, and
covered in `test_drive.cjs`, in one commit.

## 6. The cats come too

A 汉字 she cannot yet read is a cat that keeps its distance; knowing it by name is
recall. That is not an analogy bolted onto Chinese — it is the identity
[docs/world.md](world.md) § 2 already rests on, and by the test that document sets
(swap the content for arithmetic flashcards and see if the feature survives) Chinese
is a *better* fit than English vocabulary, because the gap between seeing a
character and knowing its name is the entire skill.

What this costs, concretely, is less than it looks:

- **Nothing is drawn and nothing is recorded.** `glim.js` generates a cat from its
  own word by hashing the string, and `hash()` is FNV-1a over `charCodeAt`, which is
  defined on CJK code points — so 明 seeds a cat deterministically, the same cat on
  the laptop and the iPad and in a year, exactly as `benign` does.
- **The voices need no work.** The call is two rising notes from a major pentatonic
  set; it is language-neutral. No new sound, and therefore no new stub —
  the audio checks keep asserting what they assert.
- **The Wordwood gate is the same gate.** A sentence from the lesson with one 词语
  taken out; call the wrong name and the wrong cat walks in. Every cast records as
  an ordinary `vocab` attempt, so the wood stays practice rather than a reward, and
  stays out of the sidebar's world group for the reason written there.
- **`met()` matters more here, not less.** The wood once drew cats from weeks she
  had never opened — being marked wrong for failing to call a cat you have never met
  is what hard rule 3 exists to stop. The Chinese equivalent is a character from a
  lesson her class has not reached, and the guard is the same guard, keyed on lesson.

Before any of it ships it gets the question docs/cats.md says is the only one that
settles anything: could a ten-year-old read this as the cat being disappointed in
her? A character she cannot read yet has to look like a cat that has not met her.
If it looks like a failure, it is wrong, and the four guardrails decide, not me.

## 7. How it lands

**Status (1 October 2026): Phase 1 is in.** The category layer, the two stubs, the
service worker and manifest, schema 7 with the `zh` slice, the `zh` bundle key,
第五课 authored with `why` on every wrong choice, the three surfaces of a homework
note (the sittings through the shared runner, the dictation list read aloud by the
device's own voice and rated by hand, the read-aloud time log), and
`test_chinese.cjs` as the fifth suite. One deviation from § 2, recorded there.
Later the same day: the prompts became the book's own Chinese wording, then the
whole half went Chinese with English behind one header toggle and every item's
explanation and `why` authored in both languages (§ 4); and the read-aloud task grew its
input — her reading recorded to her Drive as its own file, transcribed live by
the browser's recogniser, aligned to the passage, the misses marked for her and
the number for a parent (§ 8). Then the seven closed workbook exercises became self-marking on the site
(§ 4), and the other eight followed: handwriting of known characters judged
stroke by stroke with the Pencil, free writing kept as image and strokes for
the review skill, the retell recorded and signed; dictation can be written with
the pen and rated by rule. Then the judge: `chinese-review`, the Chinese
`essay-review`, reads the week from her Drive — the ink pages as images, the
transcripts — and brings back a review with a note per item, which the site
shows under the week and beside each exercise (`docs/review.md`, target `zh`).
Phase 4 is therefore in for the skill that judges; `progress-digest` still
reports only ISEE. Not in: the Wordwood (Phase 3), the skills (Phase 4), the Chinese review
and again runs beyond the plain due pile, the Pencil canvas with stroke capture,
and the `chinese-review` skill for the open exercises.

Phase 1 is the layer and **one real lesson, end to end** — routes, category nav,
schema 7, the `zh` bundle key, the two stubs, the service worker and the manifest,
plus her current 课 authored properly with `why` on every wrong choice. One lesson
is the right size for a first commit because it proves the whole path with content
that is real, and because the alternative — a placeholder bank — would put invented
Chinese in front of a child to test a router.

Phase 2 authors the rest of her volume's lessons. Phase 3 puts 汉字 into the
Wordwood. Phase 4 extends the two Claude skills (`essay-review`,
`progress-digest`), both of which are ISEE-shaped today and would otherwise go on
reporting half of what she did.

Testing: a fifth suite, `test_chinese.cjs`. Not an extension of
`test_features.cjs`, because two things in that file **must run last** — the
throwaway learning history and the audio stub that leaves every later page deaf —
and appending to it means threading new checks in front of that tail every time.
A fifth suite also means the places that say "all four suites" (CLAUDE.md,
AGENTS.md § Testing, docs/architecture.md § 11, `run_tests.cjs`) are updated in the
same commit, or the documents start lying about the gate.

## 8. The weekly homework loop

ISEE content was authored up front: 1,510 items against a published syllabus, all
of it in the repository before she sat down. **Chinese does not work that way.** Her
teacher sets homework weekly, most of it out of the textbook and the exercise book,
and the parent relays it. The content pipeline is therefore an *intake*, not an
authoring project, and the thing being digitalized is a homework note.

A real one, set 30 September 2026, verbatim:

> 课本55到56页，读熟练。
> 完成五课一练习册星期一到星期四的练习题。
> 听写：课本52页的词语。

Three lines, and **three different kinds of task** — only one of which is a question
bank. Getting this wrong would mean turning all three into four-choice questions,
which is how a dictation becomes a multiple-choice quiz about spelling and stops
being dictation.

| The line | What it is | How the site holds it |
|---|---|---|
| 课本 55–56 页，读熟练 | a **doing** task — read it aloud until fluent | her reading, recorded and kept in her Drive, with the browser's recogniser transcribing as she reads and the transcript aligned to the passage character by character. The first version of this row held a time log and no score, because a fluency number from a tap would be invented; a number from an alignment is measured, and it is shown as what it is — what the recogniser heard, an estimate. She sees the passage with the characters it did not hear marked, and her pace; the percentage and the transcript are the parent's view. The passage text is pasted once into her Drive record and never committed here (copyright, below). Owner's decisions, 1 October 2026, including the one exception to hard rule 2 that the recogniser is. |
| 练习册 第五课，星期一–星期四 | the exercise book's **own items** | the question banks, with `why` on each wrong choice like everything else. The first draft of this row said the weekday division made 星期一–四 four sittings, and for the four-choice blocks that was right — each day has one, three or four items, and it is a sitting of its own under `zh-block:L05-D<n>:0`; the interlude that chunked the fifteen items into 7/6 across days put them out of the book's order and is gone. The rest of each day — handwriting, radical assembly, 组词, 连词成句, an open 造句, the retell — cannot honestly become four choices. 第五课 yields fifteen four-choice items in four weekday blocks — and seventeen more exercises of their own shapes, all done on the site now, the whole workbook listed day by day in the book's order: seven marked by rule, three handwriting judged stroke by stroke, five free writing kept for the review skill, the retell recorded and signed, 读一读 read aloud and aligned. Nothing of the week stays on paper. |
| 听写：课本 52 页的词语 | **dictation** | a word list, practised the way `precision` already works — shown, then self- or parent-rated. Dictation means writing characters from hearing them, which the site cannot auto-mark without a canvas and stroke data, and must not pretend to. |

Two consequences worth writing down:

**This answers the open question the first draft could not.** It asked whether
Chinese wanted a weekly cadence or only a lesson pointer. It has one already: the
homework note carries its own date and its own lesson, so a Chinese "week" is a
homework note, not a span we invent. The lesson stays the spine; the note is what
makes a week of it.

**Every item records the page it came from.** Lesson, edition, and page — because
the only way to check a key that looks wrong is to go back to the page it was read
off, and because the free downloads are an earlier edition whose page numbers do
not line up with hers (§ 1).

**One thing for the owner to decide, not me.** The repository is public, and
`content/README.md` already notes what that means for answer keys. A 课文 is
copyrighted text from a textbook in print, which is a different matter from her own
answers or from items we author. The 生字 and 词语 lists are facts about what she is
being taught and sit comfortably in the repo; reproducing whole lesson texts there
does not obviously. The options are to reference the 课文 by page and keep the text
out, to hold it in the private Drive folder beside `progress.json`, or to decide the
reproduction is fine. Until that is settled, no lesson text is committed.

## 9. Open, and blocking

1. **The pages themselves — now in hand, and the right edition.** The 教材,
   练习册A and 练习册B PDFs are on the owner's Mac and in the Drive folder. Their
   edition pages read 「2023 年第三版」, and the homework note's 课本 55–56 lands
   exactly on 阅读《谦虚过度》 in them, which is the first concrete evidence that her
   book and these files paginate alike. They are scans with no text layer; pages
   are rendered locally and read as images, never OCRed, and the offsets (教材
   printed + 15, 练习册A printed + 5) are in `content/chinese/manifest.json`.
   What the note calls 课本 52 页的词语 is settled too, and not the way the first
   reading went: the section headed 词语 is on p.50, and p.52 carries the last two
   rows of 读一读 and the whole of 用一用 — the owner read the note literally, so
   the dictation is the words on p.52, listed by section in the homework file.
   The remaining caveat is the one § 8 already states: `old.hwjyw.com` is still
   an earlier edition, so nothing is read from there.
2. **Which HSK level, and when?** Nothing about mocks, pacing or readiness can be
   built until this is fixed, and all three are wanted (§ 3). It is not a question
   to answer by preference: § 1a sets out the order — count her 生字, read the
   official band specifications, then recommend.
3. Whether 练习册（一） in the homework note means the A book. The reading is almost
   certain and it is still a reading.
4. The lesson count per volume, confirmed from the book rather than a search result.
5. Whether a 课文 may be committed to a public repository (§ 8).
