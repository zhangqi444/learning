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

**The Chinese half has the ISEE half's shape** (the owner's ask, 3 October: "why
is the site not organized the same way as ISEE — continue, dashboard, checklist,
score, then the subjects"). The sidebar's working list is 继续, 首页, 清单, 复习,
成绩; its subjects group is the four parts of a lesson — 课本, 练习册, 听写,
阅读 — each a page for the lesson she is on. `#/chinese` is the dashboard: 今天
with what is next and 继续, the lesson's cats, the four subjects with their
state, the week's reviews. `#/chinese/checklist` is the week's homework as the
checklist the ISEE half has, every row ticking itself from her work (the row is
`checklist.jsx`'s own `Row`, with Chinese words); `#/chinese/workbook/L05` is the
workbook, a card per weekday of the same rows (the owner asked why the workbook
did not look like the checklist); `#/chinese/score` is 成绩 — each number on its
own and never folded into one, because § 3 holds. One function, `zhWeekItems`,
is the source for 今天, 清单, 练习册 and 继续, so they cannot disagree. A lesson
nobody has assigned this week (第三课, 第四课) still has all four pages: its
note is synthesised from the lesson and its exercises file (`noteFor`), its
record lands under `hw:<lesson>`, and a review may target `set: "L03"`. The
four-choice blocks live in the lesson's exercises file beside its exercises,
not in the homework note, for the same reason.

A Chinese address names the lesson or the exercise, never the week:
`#/chinese/read/L05`, `#/chinese/dictation/L05`, `#/chinese/workbook/L05`,
`#/chinese/ex/zx:L05-D1-01s`, `#/chinese/block/zb:L05-D2`. The first version put the homework note's date in
every one of them (`#/chinese/ex/2026-09-30/zx:L05-D1-01s`), and the owner asked
why a page about an exercise should be bound to a date — her progress is hers,
not the week's (2 October). The week is found from the lesson in the id — the
newest note that assigns it — and her record still lands under that week's note
(`hw:<set>` in Drive), because what was assigned when is a fact worth keeping;
only the address stopped saying it. An address that still carries the date is
answered too, so a link already shared keeps working.

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
language. **Handwriting is in, judged on the device — and she writes first, then sees.**
The first draft of this section put it out of reach — no canvas, no stroke-order
data. The owner's brief changed that: she does the homework, the result is kept
digitally, and it is judged by a rule where a rule can exist. The Pencil gives
the rule its evidence. For a *known* character — the 生字 she copies, a dictation
word she writes from hearing, a character under its pinyin — the box is a 米字格
(dotted midlines and diagonals) with **no shadow in it**: she writes the
character freely, every stroke captured as a point sequence, and only when she
taps 写好了 does the standard form appear beneath her strokes and animate once in
stroke order — 描红 after the fact, the owner's own phrase, so she compares
rather than traces. A tap on the box then swaps the two layers — the standard
form in front at full strength, her strokes faint beneath — and a second tap
swaps them back: two drawings on top of each other are compared by looking at
each in turn (the owner's ask, 2 October). The judge is ours, over her strokes in character space,
against reference data from Make Me a Hanzi (`hanzi-writer-data`, Arphic Public
License; the characters a lesson needs are vendored under
`content/chinese/strokes/` beside the licence file and inlined in the bundle,
so nothing is fetched and it works offline and in the artifact): her k-th
stroke against the k-th reference median — mean distance along the stroke,
where it starts and ends, its length, its direction — with thresholds near the
library's own leniency; a stroke drawn backwards, a stroke out of place, a
stroke missing or too many each count once, and the verdict names them (第 3 笔
方向反了 · 少写了 1 笔). `hanzi-writer` (MIT) is kept only to draw the reference.
A character written with at most two slips (or a quarter of its strokes,
whichever is more) counts as written: a decision, not a measurement, because a
ten-year-old mis-starts strokes and the standard form is right there to compare
against. The validator refuses to ask for a character that has no stroke data.
*Free* writing — 组词, 造句, answers to the text — has no key: an ink canvas keeps
the page as a PNG and the strokes as point sequences with pressure and time,
both uploaded to her Drive as their own files, and the `chinese-review` skill
judges them; the site says "awaiting review" and never guesses a mark. The
retell is recorded and transcribed like the reading, with a parent's tap as the
signature the book asks for. Typing was offered and declined: it exercises
nothing.

Item ids are namespaced from the first commit, because retrofitting a prefix means
rewriting learning records and hard rule 1 forbids losing them: `z:` for a 汉字,
`zc:` for a 词语 — alongside the existing `w:` for an ISEE precision word, which
`findItem` and `rescueWordSides` already special-case and which will need to know
about the new two. A fourth, `zi:<character>`, is a character written from memory
on the lesson page (§ 10): keyed on the character itself, because a character is
the same character in any lesson and its cat is hashed from it, and never
resolved by `findItem`, because nothing needs it to be — it is evidence for the
cat's brightness and for nothing else.

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
never blank — and, since 2 October, every other twin as well: a Chinese bank
item without `prompt_en`, `explanation_zh` or `why_zh`; a lesson, exercise,
task, block or dictation section without its `_en`; a `{zh, en}` with a side
missing; a label whose English carries Chinese or whose Chinese carries an
English word; a bank `skill` with no name in `content/chinese/skills.json`.
The chrome is held the same way: every string a Chinese page shows goes
through `t()`/`tf()`, and `test_chinese.cjs` reads the chrome of each kind of
page in both states. The rule, and how to apply it to a new page, string or
file, is in AGENTS.md § UI conventions and § Content rules.
Internal notes — any key ending in `_note` — are the other way round: one
language, never a twin, stripped from the bundle by `make_bundle.py`, and the
suite fails a page that carries one's text (AGENTS.md § Content rules).

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

**Built, 2 October 2026 — and not quite as the list above imagined.** The cat the
Chinese half turned out to need is not the one a 汉字 *reading* would give but the
one a 汉字 *written from memory* gives: the Pencil and the stroke judge arrived
after this section was written, and they put a real act of recall on the device
that a four-choice question never could. What shipped, with every piece tagged
and the flashcard test run on each, is § 10.

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
reports only ISEE. Then the game (§ 10, 2 October): a 生字 as a cat called by
writing it from memory, 选词填空 drawn as the gate, the lesson's cats on the home
card in place of the book's counts, the 汉字 shelf in the Glimbook. Not in: a
Chinese Wordwood walk (Phase 3, § 10.7), the Chinese review and again runs
beyond the plain due pile, Hum for the Chinese work (§ 10.7).

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
| 课本 55–56 页，读熟练 | a **doing** task — read it aloud until fluent | her reading, recorded and kept in her Drive, with the browser's recogniser transcribing as she reads and the transcript aligned to the passage character by character. The first version of this row held a time log and no score, because a fluency number from a tap would be invented; a number from an alignment is measured, and it is shown as what it is — what the recogniser heard, an estimate. She reads from the book — the site holds no passage at all, by the owner's decision of 2 October ("kids read. you do offline evaluation. in the result show the diff.") — and sees the two buttons, and after recording her own recording, to listen to again. The recogniser runs during the recording, silently, and its transcript is kept as a hint. The evaluation (the chinese-review skill, on the owner's Mac where the scans are) reads the book, listens, and writes the passage and what it heard into the review's `read` item; her page then shows the comparison a reading app would: the whole passage with the characters not heard highlighted, the transcript beside it, the reviewer's note. The parent's view has the recogniser's transcript at any time. The first version had a parent paste the text into her Drive record and aligned on the device; the number that produced was an estimate from a recogniser, and it is gone with the box. Owner's decisions, 1 October 2026, including the one exception to hard rule 2 that the recogniser is. |
| 练习册 第五课，星期一–星期四 | the exercise book's **own items** | the question banks, with `why` on each wrong choice like everything else. The first draft of this row said the weekday division made 星期一–四 four sittings, and for the four-choice blocks that was right — each day has one, three or four items, and it is a sitting of its own under `zh-block:L05-D<n>:0`; the interlude that chunked the fifteen items into 7/6 across days put them out of the book's order and is gone. The rest of each day — handwriting, radical assembly, 组词, 连词成句, an open 造句, the retell — cannot honestly become four choices. 第五课 yields fifteen four-choice items in four weekday blocks — and seventeen more exercises of their own shapes, all done on the site now, the whole workbook listed day by day in the book's order: seven marked by rule, three handwriting judged stroke by stroke, five free writing on 米字格 grid paper (a run of cells per word, a wrapping strip per sentence, each cell's strokes kept; a character the book asks her to write first goes in a judged box beside its word — the owner's ask of 2 October) kept for the review skill, the retell recorded and signed, 读一读 read aloud and aligned. Nothing of the week stays on paper. |
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

## 10. The game, in the Chinese half

Written before the code, as AGENTS.md § The game asks: say what each piece is —
Skin, Signal or Mechanic — and run the flashcard test on it in writing. The
verdicts are the point of this section, not an ornament on it. The world's own
account of the same thing is [docs/world.md § 12](world.md#12-the-chinese-half).

### 10.1 What the homework is, in Wildlight's terms

The premise of the world is recall: a cat that knows you comes when you call its
name. The whole of the Chinese homework is that act in a second language, and
it is worth being exact about where the act is and where it is not.

| What she does | What it is in the world | Where it already was | Tag |
|---|---|---|---|
| writes a 生字 from memory into a 米字格 — the workbook's 写一写 and 看拼音写汉字, the judged box beside a 找朋友 word, the dictation with the Pencil, and now the lesson page | **calling by hand.** The character is a Glim; its name is the character; writing it from nothing is calling it. The standard form appearing beneath her strokes is the cat answering or not | `HanziBox`, `judgeStrokes`, `writtenWell` | **Mechanic** |
| 选词填空: the book's sentence with one 词语 taken out, four words offered | **the gate**, exactly as Verbal Reasoning is drawn — a real sentence with a word missing. The 词语 she calls is the cat that walks through | the four weekday blocks through the runner | **Mechanic** |
| hears a word and writes it (听写 with the Pencil) | calling from hearing — the same call, cued by sound instead of by parts or pinyin | `Dictation` | **Mechanic** (the same one) |
| reads the passage aloud; retells the story; the free writing (组词, 造句, answers) | **not a mechanic here.** A reading is transcribed by a recogniser that is "as likely the recogniser's miss as hers"; the retell and the free writing are judged by a person. None of it can honestly drive a light, so none of it does | `ReadAloud`, `SpeakWidget`, `GridInk`, the `chinese-review` skill | — (no cat, no sound) |
| the true/false, ordering, matching, slots, structure sort | marked by rule, but the content is not a name: there is nothing to call. The structure sort is already "blocks she moves" (the owner's ask), which is its own mechanic and needs no cat | the typed exercises | — |

**No new noun.** Calling is already the world's verb (world.md § 6). The Chinese
half adds a second *way* of calling — by hand, into a 米字格 — and says so there
rather than inventing a name for it. A metaphor that has to be explained has
failed; "write the character and the cat comes" needs none.

### 10.2 The flashcard test, piece by piece

The test: would this still work if the questions were swapped for arithmetic
flashcards? If yes, it is a veneer.

- **A 生字 as a Glim, called by writing it.** Swap the character for `7 × 8`:
  there is no name to call. A cat hashed from a sum that arrives when she writes
  `56` is decoration on arithmetic — exactly why the Weighbridge and the Workyard
  have no cats on the question (AGENTS.md, "Why the numbers are not a game
  yet"). With a character, the form she has to produce from nothing *is* the
  cat's identity, hashed from the character, the same cat on every device
  forever; after a fortnight she recognises *that* cat as *that* character,
  which is the argument that made `benign` a Mechanic. **Passes, for the same
  reason the Wordwood passes and the Weighbridge does not.** § 6 made this call
  before anything was built: "the gap between seeing a character and knowing
  its name is the entire skill".
- **Brightness read from her writing record.** The same honest number said in
  the world's language, derived on every render and never stored (rule 3).
  **Mechanic**, by AGENTS.md's own definition.
- **选词填空 drawn as the gate.** Swap the sentence for a sum: no sentence, no gap,
  no gate. **Passes**, identically to Verbal Reasoning (178 of 330 VR items are
  a sentence with a word removed; 13 of the 13 zh-word items are).
- **The cat arriving in the writing box after 写好了, in its own voice.** The
  runner's reveal cat moved to the moment of commitment in the box: she commits
  (写好了), the world is allowed back in (the standard form, the verdict, the
  cat). It would not survive the swap on its own — it is the *drawing* of the
  Mechanic above, not a feature beside it, and is tagged with it.
- **The slow blink on the lesson tile when the judge first accepts a
  character.** Derived from one real event, never from a timer or a render.
  **Signal.**
- **The count on the home card, 能默写 N / 10.** A number read off records of
  work judged by rule. **Signal.** It would survive the swap (any count would),
  which is why it is a Signal and not claimed as more.
- **The 汉字 shelf in the Glimbook.** Every character she has met at its true
  brightness, Radiant ones counted, nothing unmet drawn. **Signal**, as the
  gathering on the rewards page is.
- **The Chinese sidebar's world group in Chinese (世界 · 猫窝 · 奖励).** **Skin**,
  free, and required anyway by the bilingual rule.

A list that came out all-Skin would be the mistake already made twice. This one
has two Mechanics, and everything else is their readout.

### 10.3 A 生字 is a Glim

**Identity.** `traits(ch)` hashes FNV-1a over `charCodeAt`, which is defined on
CJK code points, so 喝 seeds a coat, a build and a call exactly as `benign`
does. No new drawing, no new sound, no new stub. Which characters are cats: the
生字 of every lesson in the bundle (`glimChars()` in `lib/zi.js`) — the
characters the book is teaching her to write — and no others. A dictation phrase
like 突然站了起来 brings the cat for 突 and none for 站; `田鼠` brings 鼠's and
not 田's. The population is what the book teaches, which is `met()`'s rule from
the Wordwood: a cat she has never been offered cannot be a cat she failed to
call.

**Where she meets them: the lesson page.** The precision review is where an ISEE
word's cat first appears — a shadow with two eyes until she writes the word in
her own words. The lesson page is that page in the Chinese half: each 生字 tile
carries its cat at its true brightness, Unseen until she has written it from
memory, and 写 opens a 米字格 under the grid with the pinyin and the gloss as the
cue, the character hidden on its tile while the box is open — written from
memory is the whole point, and the character is otherwise right there. Ten per
lesson, not 160: the "unseen shelf" cats.md § 8 refused was a field of cats she
had never been offered, on the collection page; these ten are the lesson in
front of her, and she can close each distance by writing. It is optional
practice outside the teacher's homework, as the Wordwood is outside the plan's
percentage: it changes nothing about what she is assigned, how much, or when.

**How it is called.** Every surface that writes a character is the same call —
the lesson page, the workbook's `write` exercises, the judged box a free-writing
item carries when the book asks for the character first, the dictation with the
Pencil — and each ends in `judgeStrokes` and `writtenWell`, the site's one
definition of "written" (a decision, not a measurement: two slips, or a quarter
of the strokes). The cat comes when the character is written by that rule, not
only when it is perfect; the verdict line still names the slips.

**What happens on 写好了.** Written: the character's cat arrives beside the
verdict (the `arrive` primitive — it walks in from its own side and never fades
up on the spot) and calls in its own voice (`sfx("call", ch)`: two rising notes
from the one pentatonic set, through the mouth already built). On the lesson
page the cat is already on the tile, so nothing arrives twice: the tile's cat
comes nearer and brighter as its stage changes from the record, and slow-blinks
once; the call still comes from the box, so a character answers in one place.
Not written: the standard form appears beneath her strokes and animates in order,
the verdict names the strokes, and **nothing else happens — no cat, no sound.**
Not the runner's soft note either: in the box the standard form appearing *is*
the acknowledgement, and a note on top of it would be the app marking her when
what she needs to do is look. Nobody came; 重写 is right there.

**The guardrails, checked.** No cat reacts to a miss: a not-written verdict draws
nothing and plays nothing. No cat leaves: a cat on a tile stays on the tile; a
judged dictation row now stays open until she closes it, where it used to vanish
the instant the last box was judged (which hid the last verdict and the layer
swap too). No cat is the bearer of bad news: the strokes are named by the
verdict line, in words, as they were. No cat has an opinion about attendance:
nothing here reads a date except to count the days a character was written
well. Could a ten-year-old read a shadow with two eyes on a character she has
not written yet as the cat being disappointed in her? It is the same shadow the
precision page draws for a word she has not written yet, before she has done
anything at all — there is nothing to be disappointed about. It reads as "not
met yet", which is true.

**Brightness: the ladder.** Derived live from every attempt the judge saw, never
stored, mapped onto the six stage names so the two cannot drift
(`charStatus()`):

| Her record for the character | Stage | What she sees |
|---|---|---|
| never written anywhere | **Unseen** | a shadow and two eyes |
| written, never yet accepted by the judge | **Glimpsed** | there, but faint — she has met it |
| accepted once, and that was the last time she wrote it | **Steady** | fully there |
| accepted on two different days | **Radiant** | lit, with a halo |
| accepted before, but the last attempt was not | **Flickering** | almost solid, wavering — the same meaning a due word has |

Bright is not used, as it is not for words. "Two different days" is the
engine's own retirement rule (two correct answers on different days) applied
to writing, and it is the honest meaning of "can write it from memory": once
today proves she could today. Flickering on a bad last attempt is not a cat
reacting to a miss — it is the light not lying. A word she knew that falls due
dims to Flickering for the same reason, and world.md § 11 calls that "a cat she
knows whose light has dimmed a little, not a failure".

**What counts as evidence — only what the judge saw.** The lesson page's own
writes (`zi:` records); the workbook `write` items whose key is the character
(`zx:` records, ctx `exercise`); the judged box on a free-writing item that
carries a `key` (kept with the hand-in); dictation words written with the
Pencil, re-read per character from the strokes the zh slice already keeps —
each stroke's verdict is stored, so nothing new is written. Deliberately
**not** evidence: the reading aloud and 读一读 (a recogniser's estimate must never
drive a light — the reading page itself refuses to score it); a dictation word
shown and rated by hand (a tick on a five-character phrase says nothing about
which characters); the zh-char bank's four-choice items (they ask about tone and
stroke count, not for the character). The count on the home card is therefore
exactly "characters the judge has accepted, from memory, on the device".

**Records.** A lesson-page write records under `zi:<character>` (§ 4), ctx
`exercise`, which `LEARN_CTX` does not admit: it never schedules, never reaches
any ISEE number, pays no Hum (`eachTimestamp` counts only review and vocab
contexts) and counts no active day. `findItem` does not resolve it and nothing
needs it to — `reviewQueue` skips what it cannot resolve and `backfill` touches
only results, mocks and precision. Her strokes — learner input — are kept beside
it in the zh slice under the same key, as the workbook keeps them. No schema
bump: `zh` already exists and `items` already merges by union of history.

**A small honesty fix on the way.** `skillTable()` indexes the Chinese banks
beside `subjects` now, so the skill's cat on a Chinese score card is drawn at
the level the engine reports for that skill rather than always at the floor.
`ORDER` is unchanged, so nothing of it reaches readiness, mastery or the Den.

**Where the Chinese cats live.** The Glimbook gains a third shelf, characters:
every character she has met (written at least once, anywhere the judge saw it),
at its true brightness, brightest first, each tapping to its call — the same
shelf the words have. The headline count is the Radiant ones, as for words.
Nothing unmet is drawn. This is the Chinese half's place in the world: small,
inside the existing collection, not a parallel one. The lesson is deliberately
**not** a Reach: the Reaches are the eight plan weeks, the Chinese spine is the
lesson (§ 3's most important line), and nothing on the Chinese side counts
toward a Reach's progress, the readiness number, or the Den's lights.

### 10.4 The gate

`runner.jsx` already draws a Verbal Reasoning item as the gate it is
(`gameMode`): the sentence as an inscription, the four choices as plain words,
and on the reveal the word she called walking through the opened gate. A
选词填空 item is the same shape in a second language — 明天开会，你______不要迟到。
with 最好 / 只好 / 原来 / 都要 — and 13 of the 13 zh-word items are one. So a
zh-word item with a gap is drawn through the same `gameMode` (`isGate` in the
runner); a tone or stroke-count question is not a sentence with a gap, and
stays plain with its English behind the tap it always had:

- the inscription is the book's sentence, with the book's own instruction
  (选词填空：/ Fill the blank:) taken off the front (`strip` in `gate.jsx`), since
  the lead line says it in the page's language and a gate is inscribed with the
  sentence, not with a rubric. That makes the inscription the material: it reads
  the same whichever way the toggle is set, which is why it has no "other
  language" line — there is nothing to translate;
- the choices stay plain words — the game's controls wear faces only in the
  Wordwood; this is practice, and the rehearsal's controls do not;
- right: the gate opens and the 词语 she called walks through, arriving, and
  answers in its own voice (`sfx("call", word)`, hashed from the word);
- wrong: the gate holds, the plain soft note, the `why` for her choice, and no
  cat — the runner's rule for a VR practice set; only the Wordwood brings the
  wrong cat, because there the hand is the content. The skill's cat no longer
  doubles up on the reveal, exactly as Verbal "does not get a second one";
- the lead, the hand's heading, the gate's own name and the verdict go through
  the runner's language (门上刻着 / 你会的名字 / 门开了。/ 门没开。它要的是「最好」。),
  the name it wanted marked as material so it reads the same in either.

### 10.5 The lesson card on the home page

The owner asked why the card said "10 生字 · 7 词语 · 没有待复习的题". The two
counts are facts of the book and tell her nothing she can act on; the third is
a sentence about an absence. The card now says her real state and nothing else:
the lesson's ten cats at their true brightness, in a row, and one line — 能默写
N / 10 个生字 — read off the ladder above (Steady or Radiant). When something is
due for review, and only then, a button into 复习 carrying the count in red,
which is this site's one meaning for red: due now. The suite's walk still reads
the button by its old id; the check's assumption moved from "a sentence is
always there" to "a button is there exactly when something is due".

### 10.6 Sound and motion — nothing new

No new keyframe: the tile blinks with `glim-blink`, the box's cat and the gate's
arrive with `glim-arrive`, the shelf kneads with `glim-knead`, all with resting
frames that are the correct picture, so the reduced-motion reader sees a cat
sitting where it belongs. No new sound: a character's call is `callHz(ch)`
through the mouth already built, two notes from the one pentatonic set; the
audio stub needs nothing added. `test_chinese.cjs` installs the same fake
`AudioContext` the features suite does — with `createBiquadFilter`, per
CLAUDE.md's trap — and asserts the call on the lesson page, in the dictation,
at the gate and on the shelf: two notes, rising, both in the set.

### 10.7 Left as proposals — decisions only the owner can make

1. **Hum for Chinese work.** Today a four-choice block pays 10 Hum like any set
   (it is a `result`), and nothing else in the week does — not a character
   written, not a dictation, not the reading. Hum is made by trying; the writing
   is trying. But the Den's seven prices were set against ISEE loads, and
   adding sources to `eachTimestamp` is an economy decision. Recommended: pay
   the workbook exercises as sets do (one timestamp each, replaced on a redo, so
   self-limiting like a set) and leave reading and dictation out until watched.
   Not built.
2. **Chinese names for the world's nouns.** A Chinese page may not say "Glim",
   "Wildlight" or "Den" in 中 mode, and naming is Sheila's and the owner's. The
   pages use the plain words — 猫, 世界, 猫窝, 奖励 — as placeholders in
   `world.js` (`WZ`), and Wildlight is kept out of Chinese chrome rather than
   transliterated. A cat's own `aria-label` (its coat, build and stage) stays
   English everywhere; a Chinese twin for twelve coats and six stages is a
   naming job for her.
3. **A Chinese Wordwood walk** (Phase 3). A walk needs a pool of met cats,
   decoys by part of speech and an inscription per 词语; the lesson has 用一用
   phrases, not sentences, and the only gap sentences are the bank's 13 — which
   the four blocks already serve. Until two or three lessons give a pool, a walk
   would be the same 13 gates wearing a second door.
4. **词语 as cats on the lesson page.** Only four of the seven 词语 are the key of
   any gate (最好 突然 只好 一定), so three could never brighten — a debt with a
   face. Revisit when the bank grows.
5. **The retell as a Telling.** The weekly essay is the Telling because a Reach
   is only hers once its story is written down; 把故事讲一遍 is literally a telling
   of 小马过河. Naming the retell card so is Skin and free, but it puts a world
   noun in Chinese on her page, which is 2 above.
6. **The reading as evidence.** Not while the recogniser is the judge.
