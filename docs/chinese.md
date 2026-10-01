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

**Two facts are not yet established and nothing may be authored on top of them.**
One secondary source describes a volume as four 单元 of twelve 课 in total; that is a
single uncorroborated claim about a series that has just been revised, so the lesson
count comes from **the book in her hand**, not from here. And the volume itself is
unknown: *which 册 is she in, and which 课 has her class reached?* That one answer
decides the whole first slice, and it is the only thing blocking authoring.

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

- **The eight dated plan weeks.** The ISEE spine is a calendar hung off an exam
  date. Chinese has no exam and no deadline; what it has is an ordered book and a
  class that moves at its own pace. So the Chinese spine is **the lesson, `L01…Ln`,
  not the week** — and `currentWeek()`, `spans()`, `spanOpen()`, `D.breaks` are
  never asked a question about Chinese. This is the single most important line in
  this document. Folding Chinese into the eight weeks would change a week's item
  count and therefore its sitting count through `ceil(n/12)`, which AGENTS.md names
  as load-bearing and which is the thing she actually feels.
- **The mocks.** There is no paper to rehearse.
- **The readiness score.** Six weighted parts, one of which is mock performance and
  another a per-question time budget, calibrated against a timed test. There is no
  Chinese test, so a number there would measure nothing, and hard rule 4 says an
  honest "—" beats a number with no data behind it. Chinese reports what it can
  actually count: 生字 known of met, lessons finished, review pile, days active.
- **Pacing, and this one is a trap rather than a decision.** `engine.words()` is
  `split(/\s+/)`, and written Chinese has no spaces — a whole 课文 returns **1**.
  Every length-derived number downstream (`readFloor`, `tooFast`, `paceFlag`,
  the passage-word budget) would therefore not fail but quietly produce nonsense,
  which is worse. Chinese practice is untimed, pacing is excluded at the category
  boundary, and if a reading budget is ever wanted it is counted in characters by
  a function that says so in its name.

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
language. Dictation and handwriting are deliberately out of this design — both need
an input the site does not have (a microphone, or a canvas and stroke-order data),
and neither can be faked with four choices. They are a later question, not a gap
here.

Item ids are namespaced from the first commit, because retrofitting a prefix means
rewriting learning records and hard rule 1 forbids losing them: `z:` for a 汉字,
`zc:` for a 词语 — alongside the existing `w:` for an ISEE precision word, which
`findItem` and `rescueWordSides` already special-case and which will need to know
about the new two.

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

## 8. Open, and blocking

1. **Which 册, and which 课 has her class reached?** The only thing stopping Phase 1.
2. Does she have 练习本 A and B? They decide whether 词语 practice can follow the
   book's own exercises or has to be authored from the 课文 alone.
3. The lesson count per volume, confirmed from the book rather than from a search
   result.
4. Does Chinese want a weekly cadence at all — a "this week" for the class's pace —
   or does the lesson she is on carry the whole of it? The checklist is built on
   dated spans, and a lesson has no dates.
