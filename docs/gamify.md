# Gamifying the site

Research and a staged plan for turning the practice site into something that
plays like a game, in answer to: *"I want to be fully gamify… the website style
could be roblox style, and the content could be like play a game."*

> **Read this first.** The research in §1–§3 still stands and is still the
> evidence base. **The design from §4 onwards does not.** "Brain Base" was built,
> shown to the owner, and rejected in one sentence — *"I guess you misunderstand
> my requirement… I want the VR question to be my gamify, like CodeCombat"* —
> because it was chrome wrapped around unchanged content. Everything after that
> point lives in **[world.md](world.md)**, which is the design of record. Do not
> build anything from §4–§9 of this file; it is kept because the reasoning that
> led to a wrong turn is worth being able to re-read.

---

## 1. The verdict

Yes — and further than you might expect. But "fully" has to mean *the whole
surface and the whole loop*, not *every mechanic Roblox uses*.

Roblox is two things stacked on each other. There is a **visual and structural
grammar**: chunky pressable geometry, saturated colour, an avatar that is yours,
a base that visibly grows, quests, bosses, a catalogue of cosmetics. And there is
a **retention economy**: loot boxes, leaderboards, energy timers, daily-login
streaks, limited-time offers.

The first is genuinely better for a ten-year-old than what the site has now, and
nothing in [AGENTS.md](../AGENTS.md) argues against any of it. The second is
banned outright by hard rule 3 — and it is also the part of Roblox that exists to
extract time from children rather than give them anything.

So: **take Roblox's grammar, take none of its economy, and go all the way with
what is left.** That is still a total transformation.

Two places where "Roblox style" is the wrong model, and I want to be plain about
them rather than quietly skip them:

**The question itself should stay calm.** A verbal-reasoning stem in a neon frame
with something animating beside it is worse practice, not better, because on exam
day the question is black text on white paper. Everything *around* the question
becomes a game; the question well stays legible. This is the spine of the whole
design and it is why the plan is not just "make it colourful".

**Every reward must be a published fixed price.** Roblox's core reward loop is
variable-ratio — you open a crate and *might* get something good. That is a
gambling schedule, and structurally it is also a lie: a random reward cannot be
an honest readout of anything, so it collides head-on with hard rule 4. Fixed
prices, visible from across the room, no randomness anywhere.

---

## 2. What the evidence says

Worth knowing before committing months of work, because the research is more
specific than "gamification works".

**It reliably moves motivation. It does not reliably move learning.** The 2025
K-12 meta-analysis puts the pooled effect at g = 0.654, but with the effect on
*extrinsic* motivation (g = 0.713) larger than on *intrinsic* (g = 0.638) — which
the authors attribute to the dominance of points, badges and leaderboards.
A separate meta-analysis is sharper still: gamification enhances intrinsic
motivation, autonomy and relatedness, but has **minimal impact on competence**.

That is the single most useful finding for us. Gamification will make Sheila
*show up*. It will not make her better at quantitative reasoning. So it must be
built to increase time-on-task and never to substitute for the work — and no game
number may ever imply mastery it cannot evidence.

**The overjustification risk is real.** Rewarding something a child would have
done anyway shifts the locus of motivation from inside to outside, and can leave
her less willing once the reward stops. The mitigation is to reward *effort and
turning up*, not the learning itself — which, as it happens, is already exactly
how `effortPoints` works (§3).

**Leaderboards are the worst offender**, conveying negative feedback and social
pressure precisely to the students who are struggling. Already banned by rule 3.

**Streaks are the second.** The criticism of Duolingo is not that streaks do not
work — it is that they work by loss aversion, and that children respond by doing
the *easiest* available lesson to keep the number alive. That is "performative
learning": the metric rises, the learning does not. Any mechanic we add must be
checked against that failure mode explicitly.

**The regulatory line is drawn where you would expect.** The ICO's Children's
Code, standard 13, tells services not to "use reward loops or similar techniques
that exploit human susceptibility to reward/pleasure seeking behaviours in order
to keep children engaged". It does explicitly permit nudges *towards* wellbeing —
break reminders, save points, stopping cues. That is a usable distinction: a
mechanic that helps her stop is fine; a mechanic that makes stopping costly is not.

Sources:
[K-12 meta-analysis (Kurnaz 2025)](https://onlinelibrary.wiley.com/doi/full/10.1002/pits.70056) ·
[intrinsic motivation / competence meta-analysis](https://link.springer.com/article/10.1007/s11423-023-10337-7) ·
[ICO Children's Code, standard 13](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/13-nudge-techniques/) ·
[on Duolingo streaks and children](https://screenwiseapp.com/guides/duolingo-streaks-and-anxiety-in-kids)

---

## 3. What is already there

The site is further along than it looks, and the existing foundations are the
*right* ones. This matters: the plan below is mostly amplification, not rebuild.

| Piece | Where | State |
|---|---|---|
| Effort points | `site/src/lib/engine.js:545` | `{set:10, mixed:12, review:1, vocab:1, word:2, essay-done:15, mock:25, mock-essay:15, read:4, book:40}`, +3 for tagging a miss |
| 10 levels | `site/src/lib/rewards.js:14` | Starter → Star, 0 → 2300 lifetime points |
| 46 badges | `site/src/lib/rewards.js:71` | 8 groups; **pinned on first earning**, never revocable |
| Reward shelf | `site/src/lib/rewards.js:157` | Parent posts real-world rewards; she claims with points |
| Streak | `site/src/lib/engine.js:516` | **Already forgiving** — up to two missed days a week are frozen, not broken |
| Spaced review | `site/src/lib/engine.js:164` | 1 → 3 → 7 days, clear after two spaced correct answers, one check-in at 21 |
| Mastery + AoPS map | `engine.js`, `content/aops.json` | Per-skill levels, mapped to real book chapters |

Three things worth calling out.

**Points already reward effort, not accuracy.** `effortPoints` counts attempts.
A hard day where she gets everything wrong still pays. That is the design the
evidence asks for, and it was already made.

**The streak already refuses to punish.** Two forgiven days a week, built in.
That is rule 3 taken seriously in code, and it is the model for everything else.

**There is one real farming hole.** `eachTimestamp` (`engine.js:498`) awards
`review:1` per entry in an item's `hist`. Sets are safe — redoing one replaces
its timestamp, so a set is worth at most 20 points ever — but the review pile is
not: `/review/<sub>/all` serves scheduled items, and each pass adds history and
points. Today it is harmless because a point is a point. The moment points buy
something, it becomes the exact Duolingo failure mode. **Fix it before Stage 3:**
count review and vocab points once per item per day.

---

## 4. The design: Brain Base

An **ISEE tycoon**.

The tycoon is one of Roblox's signature formats: perform a simple productive
action, it drips a resource, spend the resource on a base that visibly grows, and
the base then reflects what you have done. That structure is *already* the shape
of spaced practice — small repeated effort accumulating into visible capability.
We are not bolting a game onto studying; we are noticing that studying already
has this shape and finally drawing it.

**Explained to Sheila.** You have a Base. It starts as one empty room. Every
question you *try* makes Sparks — you get them for trying, not for being right,
so a bad day still builds something. Sparks buy rooms and things to put in them:
a Word Lab, a Number Workshop, a Reading Den, a Writing Studio. Rooms have lights,
and the lights tell you the truth — bright where you know it cold, dim where it
has gone quiet and needs waking up. Quests tell you what to do next, and they come
from what is really in your Base. Mocks are Boss Fights, and you beat a boss by
*finishing* it. Nothing you build is ever taken away.

**Explained to an engineer.** Sparks are the existing `effortPoints`, renamed in
the UI only. A new `base` slice holds an **append-only spend ledger**; the
spendable balance is *derived* (`lifetime − Σ spends`), never stored, so it cannot
conflict on merge. Which rooms exist is derived from the ledger. Each room's
**light level is derived live from `engine.js` mastery and is never persisted at
all** — which means the game's readout is structurally incapable of drifting from
the real number. Quests are generated by a pure function of `(date, engine state)`,
so two devices produce identical quests with nothing to sync.

The whole game layer is therefore **one append-only list, one cosmetics set, and
otherwise pure functions of data the engine already computes.** That is what makes
hard rule 4 hold by construction rather than by discipline.

---

## 5. The visual system

Keep every existing token name so shadcn keeps working; add game tokens beside
them. The thesis is a **split**: the *ground* (surfaces text sits on) stays calm
and high-contrast; the *chrome* (buttons, counters, rooms, quests, bosses) goes
toy-saturated.

```css
:root {
  /* ground — unchanged in spirit from Calm Scholar, slightly cooled */
  --background: #f2f6f6;  --card: #ffffff;  --foreground: #0f1f1e;
  --muted-foreground: #47615f;  --border: #cbdad8;

  /* chrome — new */
  --spark:  #ffb020;  --spark-press:  #c97f00;  --on-spark: #2b1b00;
  --quest:  #2f6bff;  --quest-press:  #1b47c4;
  --boss:   #e8452a;  --boss-press:   #b92c15;
  --dormant:#a9becb;                 /* a light gone quiet — never red */

  /* form */
  --radius: 1rem;  --radius-chunk: 1.25rem;
  --border-chunk: 2px;
  --lift: 4px;  --lift-press: 1px;   /* hard offset "sticker" shadow */

  /* motion */
  --ease-pop: cubic-bezier(.34, 1.56, .64, 1);
  --t-fast: 120ms;  --t-cheer: 420ms;
}
```

**The pressable button** is the single highest-leverage change — it is what makes
a UI read as a game before you have read a word:

```css
.chunk {
  border: var(--border-chunk) solid var(--primary-press);
  border-radius: var(--radius-chunk);
  box-shadow: 0 var(--lift) 0 0 var(--primary-press);
  transition: transform var(--t-fast) var(--ease-pop),
              box-shadow var(--t-fast) var(--ease-pop);
}
.chunk:active {
  transform: translateY(3px);
  box-shadow: 0 var(--lift-press) 0 0 var(--primary-press);
}
```

**Typography.** Roblox uses **Builder Sans**, which is proprietary and not
publicly distributed; the usual open stand-in is Source Sans Pro. But
[design.md](design.md) principle 5 and AGENTS.md both commit to the device's own
UI stack with no webfont request, and `test_artifact.cjs` asserts zero external
requests. Two honest options, and this is a decision for you (§11): keep system
fonts and lean on **weight, size and tighter tracking** for the chunky feel
(`font-weight: 800; letter-spacing: -0.02em`), or **bundle a subsetted open font
as base64 inside the CSS** — which is not an external request and would not break
the artifact test, but does add roughly 20–40 KB and reverses a documented
decision.

**Motion.** `tw-animate-css` is already imported. Everything needed is CSS
keyframes plus about 40 lines of hand-rolled JS for a particle burst — no library,
no assets. Vocabulary: press-squash on every button, a count-up on numbers, a
pop-in on earned things, a burst on level-up.

**Sound.** WebAudio oscillators only — no audio files, so the single-file artifact
stays self-contained. A correct blip, a level-up arpeggio, a boss sting; perhaps
200 lines. Must sit behind a user gesture (autoplay policy) and needs a visible
mute. Default: **on**, muteable — but see §11.

---

## 6. The mechanics

Each one states which real data it reads, so no number is invented.

| Mechanic | Reads | Honest because | Not a dark pattern because |
|---|---|---|---|
| **Sparks** | `effortPoints()` | Counts attempts, which is exactly what it claims | Paid for trying, not for being right; never expire, never decay |
| **Room lights** | `masteryOf()`, `reviewQueue()` | Derived live, never stored — cannot drift | Dim is *dormant*, never red, never "failed" |
| **Build ledger** | new `base` slice | Fixed published prices, no randomness | Nothing built is ever removed or repossessed |
| **Word cards** | `wordStatus()` = known | One card per word she genuinely knows | Collection with no scarcity and no duplicates |
| **Skill crests** | `masteryOf()` mastered | One per skill actually mastered | Earned, not bought; pinned like badges |
| **Quests** | pure fn of date + engine state | Names real work that really is outstanding | Expire silently with no penalty; never "you lost" |
| **Boss fights** (mocks) | `mocks` slice | Beaten by *finishing*, not by scoring | A low score still beats the boss |
| **Rescue runs** (review pile) | `reviewQueue()` | The real due list, reframed | Missed questions are trapped friends, not your failures |

**The anti-exploit design**, stated once and applied throughout: Sparks accrue per
*attempt-with-a-timestamp*, sets are already capped at two payouts, and review and
vocab get the once-per-item-per-day cap from §3. There is no mechanic anywhere
whose optimal play is to redo something easy. The cheapest path to Sparks is
always to do the next new thing.

---

## 7. Screen by screen

**The Base (replaces the dashboard).** An isometric 2D room grid in inline SVG.
Rooms she has built are lit by real mastery. The Today card survives, restyled as
the quest board — [design.md](design.md) principle 1 ("Today first") is not up for
negotiation and the game must not bury the one thing to do now.

**The runner — the most important screen.** It stays a clean question card. What
changes around it: the progress bar becomes a charge meter, the answer press gets
a squash, the counter counts up, and finishing fires a Spark burst. The existing
`data-testid="badges-won"` block becomes a proper reward moment instead of a
notice. The question text, choice letters and passage box change *not at all*.

The open question here is **instant feedback**: right now she learns nothing until
the whole set ends. Games answer in under 100 ms. A practice mode that marks each
answer immediately would transform the feel — but it stops being exam simulation.
My recommendation is in §11.

**The review pile → Rescue.** Same schedule, same engine, reframed: due questions
are trapped, clearing one brings it home, the check-in at 21 days is "checking they
are still safe". Purely a wrapper — no engine change.

**Precision words → the Word Lab.** Each word she knows becomes a collectable card.
160 cards over eight weeks, deterministic, no duplicates.

**Essay → the Writing Studio.** Left mostly alone. The Revise phase already needs
rebuilding on its own merits (separate issue) and gamifying it before fixing it
would only decorate the problem.

**Mocks → Boss Fights.** Full-screen entry, a name per mock, a timer that is
already there. Beaten by finishing.

**Reading → the Reading Den.** Books on a shelf that fills; pages read raise the
room. The reading log stays exactly as it now works.

---

## 8. Data model

One new slice, `base`, holding an append-only ledger:

```js
base: { "spend:<id>": { item: "room:word-lab", cost: 120, at: "..." }, ... }
```

Schema bumps **5 → 6**, with the four required edits (`init`, `merge`, `body` in
`site/src/lib/store.js`) plus coverage in `test_drive.cjs`, exactly as AGENTS.md
requires.

**Merge semantics.** Append-only and keyed by a unique id, so the existing
per-key last-write-wins merge is already correct and two devices can never lose a
purchase. Balance is derived, never stored, so it cannot conflict. This satisfies
hard rule 1 by construction.

**Migration.** Nothing existing is touched. Her Week-1 answers, essays, 46 badges
and reading log are read by the new layer and never written by it. A missing
`base` slice means an empty base — old data needs no migration at all.

---

## 9. The plan

All of this is built. What shipped, and where it lives:

| # | Stage | Commit | Where |
|---|---|---|---|
| 1 | **Chunky skin** — press tokens, pressable controls, pill badges, sheened progress | `6983146` | `index.css`, `components/ui/*` |
| 1b | **Arcade palette**, then extracted into swappable skins | `cb88c39`, `8963292` | `index.css`, `skins.css`, `main.jsx` |
| 2 | **The runner feels alive** — instant marking, spark burst, count-up, badge moment, WebAudio sound | `c9cc102` | `pages/runner.jsx`, `components/burst.jsx`, `lib/sfx.js` |
| 3 | **Sparks + the farming fix** — a review answer pays once per question per day | `0ff30fb` | `lib/engine.js` |
| 4 | **The Base** — seven rooms, fixed prices, lights derived from real mastery | `bb5ba3e` | `lib/base.js`, `pages/base.jsx`, schema 6 |
| 5 | **Collections** — word cards, skill crests | `bf42e78` | `lib/base.js`, `pages/base.jsx` |
| 6 | **Rescue + bosses** — the review pile's language, mocks as boss fights | `bf42e78` | `pages/review.jsx`, `pages/mock.jsx` |

Two decisions taken during the build that differ from the plan above:

**The palette went further than "keep every token name".** The identity moved
from the teal Calm Scholar set to arcade indigo, because chunky geometry alone
still read as a study app with rounder corners. Six alternates live in
`site/src/skins.css` and the whole look changes by editing one `SKIN` constant in
`site/src/main.jsx`. Indigo is the default because it is the only vivid hue that
collides with none of the three semantic colours.

**No separate quest system was built.** The Today card and the weekly checklist
already are the quest list, generated from the same engine state a quest board
would have read. A second one beside them would have been duplication in a game
costume.

Every stage: all four suites pass, bundle check clean, and screenshots at desktop,
phone width and dark mode before it is called done.

## What happened next

The staged plan above shipped and was rejected as a veneer, which is the single
most useful thing in this document. What replaced it:

- **The rule that came out of it.** The content must *be* the mechanic. The test:
  would this still work if the questions were swapped for arithmetic flashcards?
  If yes, it is decoration. Currency, rooms, badges and confetti all fail it —
  that is fine, they are decoration; shipping only decoration and calling the
  site gamified is the mistake. Recorded in AGENTS.md § The game.
- **One world instead of eight metaphors**, in [world.md](world.md): Wildlight,
  the Lampwright, and every word as a cat.
- **The Wordwood**, where vocabulary is the control language: a real sentence
  with a word taken out, and calling the wrong name brings the wrong cat.
- **Verbal Reasoning drawn as the gate it already is** — 178 of its 330 items are
  a sentence with a word removed.
- **Cats reacting around every other question** rather than inside it: the
  skill's own cat on the reveal, in its own voice. The questions themselves were
  measured for this (244 of 408 QR/MA items could carry a cat context) and the
  owner's decision is that they stay exactly as they are, because the practice
  has to look like the test.
- **The Den**, which teaches real, sourced cat care and carries the advocacy for
  real cats — after the owner's daughter said plainly that she did not understand
  why she was building rooms called "Number Works".

**Still not code, and still outstanding:**

1. **Watch her use it.** Everything here is a considered guess about what a
   ten-year-old finds motivating. An hour of watching will say more than another
   stage would.
2. ~~The two digest Routines have no Drive connector.~~ **Fixed by the owner on
   8 September** — both now carry Google Drive and Google Calendar, and both have
   fired. Whether they produce a digest end to end is a separate question from
   whether they can read the file; see the note below.
3. ~~Two of Sheila's world questions are still open.~~ Answered and built — see
   world.md §9.

**The digest Routines still do not work, and here is exactly why.** Both carry
the right connectors, both fire, and the weekly one reports `last_run:
SUCCEEDED` — but no digest has ever been produced. `SUCCEEDED` means the fired
session finished cleanly, not that it made anything.

The cause is in the Routine's stored session request: **`config.sources` is
empty**. The fired session gets no repository, so `/home/user` is not a checkout,
`.claude/skills/progress-digest/SKILL.md` is not there, and step 1 of the prompt
cannot run. The session correctly reported this and fabricated nothing.

**This cannot be fixed from inside a session.** `create_trigger` has no `sources`
parameter and does not inherit the calling session's repository — verified on
10 September with a throwaway Routine created from this repo-bound session, whose
stored config still came back `"sources":[]`. The fix is the owner editing each
Routine in the claude.ai Routines UI and selecting `zhangqi444/isee` as its
source repository. The connectors are already right; the repo is the missing
half.

---

## 10. What we are not building

- **Loot boxes / randomised rarity** — a gambling schedule, and unable to be an
  honest readout of anything. Rules 3 and 4.
- **Leaderboards** — rule 3, and the evidence says they hurt exactly the child
  who is struggling.
- **Energy, hearts or lives** — makes stopping a punishment and practising a
  scarce resource. The opposite of what this site is for.
- **A punishing streak** — the existing forgiving streak stays exactly as it is.
- **Daily-login rewards or limited-time offers** — the ICO names these directly.
- **A real 3D base** — the most literal reading of "Roblox style" and the wrong
  call: it multiplies the build, threatens the single-file artifact budget, and
  she learns nothing from it. 2D isometric SVG gets most of the feel for a tenth
  of the work.
- **Gamifying the essay before the Revise phase is fixed** — decoration over a
  known problem.

---

## 11. Decisions only the owner can make

1. **Instant feedback in the runner?** *Recommended:* yes, as a mode — mark each
   answer immediately in practice sets, keep mocks silent so they stay real
   rehearsal. This is the biggest single "feels like a game" win available, and
   the biggest departure from exam conditions.
2. **Bundle a font?** *Recommended:* no, at least at first. Try weight and
   tracking on system fonts in Stage 1 and look at it. Reversing principle 5 for
   40 KB should be a deliberate choice, not a side effect.
3. **Sound on by default?** *Recommended:* on, with an obvious mute. She is ten;
   silence is not what a game feels like. Easily changed if it annoys the house.
4. **How far do we go?** Stages 1–3, or commit to the Base. *Recommended:* ship
   1–3, watch for two weeks, then decide.
5. **Does the reward shelf move inside the economy?** *Recommended:* leave it
   where it is. Real-world rewards from a parent are a different currency from
   in-game building, and mixing them makes the game feel like a chore chart.

---

## 12. Honest risks

**She gets bored in three weeks.** The most likely failure. The evidence on
novelty is clear. The mitigations are that stages 1–3 are cheap enough to be
worth it even if that happens, that collections accumulate slowly enough to still
be filling in month six, and that Stage 4 is deliberately gated on evidence.

**It steals time from practice.** A base you can decorate is a base you can fiddle
with instead of working. Mitigation: no mechanic costs time to *maintain* — no
crops to water, no pets to feed, nothing that decays.

**The metric gets gamed rather than the learning.** The Duolingo failure mode.
Mitigation is §3's cap plus the rule that no path to Sparks is cheaper than doing
the next new thing. Worth re-checking after every new mechanic.

**It feels babyish.** She is ten and reads Harry Potter and Little Women. Tycoon
and collection formats age up well; cartoon mascots and praise-heavy copy do not.
Keep the tone dry.

**The plan outlives its usefulness.** The exam is the point. If a month before the
mocks she needs quiet, focused practice, the game layer should be switchable off
without losing anything — which the derived-numbers architecture gives for free.
