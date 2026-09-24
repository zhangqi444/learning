# Cats, everywhere — the design system

[world.md](world.md) decides what the world *is*. This decides how it **sounds,
moves and behaves**, at the level of a button and a blink, so that a cat turning
up on the reading page and a cat turning up at a gate are recognisably the same
animal. It is written bottom-up on purpose: the primitives first, then the pages
that compose them, because every previous attempt started at the page and
produced eight unrelated metaphors.

## 0. What the survey found

Before adding anything, this is the honest state of it:

| | |
|---|---|
| Pages that draw a cat | 7 of 17 — home, quest, precision, review, base, runner, score |
| `W.wood` / `W.currency` | spoken, 11 and 17 times |
| `W.role`, `W.telling`, `W.beacon`, `W.reach` | defined in `world.js`, used **zero** times |
| Deep Shelf, Weighbridge, Workyard | named in world.md, **not in `world.js` at all** |

So the Telling and the Beacon — two of the six named events — are invisible in
the app, the four subjects have four place-names of which only one is ever said,
and she is never once called a Lampwright. The largest available win is not new
cat decoration. It is **finishing the language that was already designed**, which
costs almost nothing and makes the world feel continuous rather than like three
game screens parked beside a dashboard.

## 1. Three kinds of thing, and all three are allowed

**Skin**, **Signal** and **Mechanic** are defined in AGENTS.md § The game and are
not redefined here. The short of it: Skin carries no information, Signal tells
the truth about real state, Mechanic is the cat being the content — and most of
what follows is Skin, which the veneer rule expressly allows. The failure mode is
shipping only decoration and calling the site gamified.

Every item below is tagged, and the tags are the point of this document rather
than an ornament on it: a proposal whose tags come out all-Skin is the mistake
that has already been made twice, and tagging makes it visible while it is still
a list and not yet a branch.

## 2. The guardrail: a cat can never be disappointed in her

Rule 4 says missing something is never punished. A mascot is how that rule gets
broken by accident, because the obvious next step with any animal on a screen is
to have it *react to her behaviour*.

**The four guardrails live in AGENTS.md § The game, under this heading, and are
not restated here.** An agent can break them without ever opening this file, so
they belong in the contract; a copy in two places is a copy that will disagree,
which is the mistake world.md §7 records as "two names for one idea". Read them
there, then come back for the primitives that have to obey them.

What this file adds is the consequence for *motion*, which is where the rules
actually get broken: every primitive in §4 is built so that the sad version
cannot be expressed. There is no droop, no slump, no turning away and no exit —
not because they are discouraged, but because they were never drawn.

## 3. Voice — including the meow

**Built.** The calls were two triangle-wave notes from a pentatonic scale: in
tune, identity-bearing, and not remotely a cat.

**The fix was timbre, not pitch.** A meow is a pitch contour pushed through vowel
formants; a formant is a bandpass filter. So a call is now the *same two
frequencies `callHz()` already returned*, played through two bandpass filters
whose centres glide along a vowel path — open and closing for `mrrp?`, nearly
`ee` opening wide for a Siamese. No sample, no file, no fetch. **Every existing
guarantee survived**, because the guarantees are all about pitch: `benign` is the
same cat forever, five gates in a row are in one scale, the octaves are octaves,
the chorus is in tune. The proof is in the suite — against one build, the pitches
recorded before and after are identical to the digit and only the filter count
moves. *(Mechanic — it extends recognition, which is recall.)*

**The `m` is built, and the instrument this section named for it was wrong.**
The open item here used to read: *a noise burst at the onset, which needs
`createBufferSource` on the test stub*. Both halves were mistaken. A burst is a
**plosive** — the sound of a closure being released, which is a `p` or a `t`. An
`m` is a **nasal**: the voicing never stops, the lips stay shut, the sound leaves
through the nose, and what you hear is the same note with everything above the
nasal murmur gone and most of the level with it. White noise in front of a meow
does not read as *m*; it reads as *ts*, a cat with a lisp.

So the onset is the two formants starting closed — 250 Hz and 420 Hz — held
quiet for about 45 ms and then travelling to the first vowel frame, which *is*
the mouth opening. The note is already sounding before the vowel arrives, so the
call begins as a cat rather than as a tone a cat is applied to afterwards.

It needed nothing added to the test stub, because it is two filter frequencies
and a gain ramp and the fake context already recorded both. The stub gained a
recording of *what the mouth was first set to*, which is how the suite now proves
the call starts closed rather than on a vowel — and the pitch count did not move,
so `the right cat answers in two notes` still passes unchanged. Timbre is free;
pitch is load-bearing. Both calls and the chorus open this way; every cat in a
chorus opens its own mouth, or the phrase is a tune with cats painted on it.

**Accent is identity too.** The build the hash already picked chooses the vowel
path, and it happens to be true of real cats: the oriental build gets the
brighter, more nasal, more insistent call that Siamese actually have; the
longhair gets a softer, rounder one; the shorthair keeps the short `mrrp?`. Same
seed, so it is stable forever. *(Mechanic.)*

**What must never get a voice.** Sound belongs to *events involving a cat* and
nothing else. No meow on navigation, on a tab change, on a checkbox, on a page
load, on a button. Two reasons, and the second is the serious one: it would make
the mute switch mandatory rather than optional, and a noise that arrives every
time she touches anything stops reading as a cat and starts reading as nagging —
which walks straight into §2. The existing `pick` / `right` / `wrong` UI notes
stay abstract notes.

Mute stays one switch over everything, and `wrong` stays what it is: low, short,
in tune, saying *noted* rather than *no*.

## 4. Motion — six primitives

All six sit behind the global `prefers-reduced-motion` rule already in
`index.css`, which disables them wholesale; every one must be *absent*, not
merely slower, when that is set, and the page must read correctly with none of
them. Existing: `glim-breathe`, `glim-flicker`, `pop`, `spark`.

| Primitive | What it is | Where it belongs | |
|---|---|---|---|
| **arrive** | walks in from an edge and sits — never fades up on the spot. **Built** | any cat entering: the gate, the reveal, the door | Skin |
| **slow blink** | eyes close and reopen over ~600ms | acknowledgement — see below. **Built** | Signal |
| **ear-flick** | one ear rotates a few degrees, rarely, each cat on its own clock | idle cats, so a still page is not a dead one. **Built** | Skin |
| **tail-curl** | tail lifts on hover or focus | interactive cats only — attention, not commitment. **Built**, and it turned out to be an affordance rather than decoration: a cat you can tap looks exactly like one you cannot | Skin |
| ~~**settle**~~ → **knead** | four presses of the front paws, a bout of ~2.3s inside a 26s cycle, on the cat's own clock. **Built** — and re-specified; the loaf was refused, see below | the Den's two shelves | Skin |
| ~~**stretch**~~ | **struck.** A stretch is a pose change and the Glim is one fixed silhouette per build; there is no honest version of it. See below | — | — |

**The last two rows were wrong, and this is what replaced them.** Four
independent proposals were taken on how to build `settle` and `stretch`; all four
said `stretch` should not be built, and the loaf lost on grounds better than the
ones this document had.

*Why not the loaf.* Not because it is hard to draw. The Glim is one fixed
silhouette per build, so a loaf faked by scaling it — body squat, head sunk
toward the shoulders — is not a loaf at all: it is the **hunched** posture, and a
hunched cat with its head low is the one that is in pain. Drawing that on her own
shelf is *no state a child could read as "I did this to it"*, reached from cat
anatomy rather than from taste, which makes it the stronger refusal and the one
worth writing down. (Drawing a *real* loaf was costed too: a second body path and
tail per build is the small part — every marking in `Coat()` is authored in the
sitting body's coordinate space and clipped to it, so it is three silhouettes ×
five markings across twelve coats, and CSS cannot cross-fade between them without
a fade, which is the exact thing `glim-arrive` had to remove.)

*Why not after a period of no input.* This is the half that was a guardrail
breach rather than a drawing problem, and it applies to any pose whatsoever.
"After a period of no input" means the app measures how long she has not acted
and the cat changes because of it — *a cat has no opinion about her attendance*,
the first of the four. The return trip is worse: a cat that un-settles when she
moves the mouse was **waiting for her**. No idle timer exists anywhere in `src/`
today, and building one puts the measurement the next "notice she has been away"
feature needs already sitting in the tree. There is a second failure underneath
it: a pose driven by React state is *not an animation*, so the global
reduced-motion rule does not delete it, and that reader would get the pose
silently teleported in — strictly worse than the motion version.

*What knead is.* §8 has always asked the Den for "settle, **knead**" and §4 never
defined the second one. It is that row. Kneading is the one common feline display
with exactly one meaning — there is no sad knead, no hungry knead, no reproachful
one — so the sad version cannot be expressed, which is what §2 asks of a primitive
rather than that it merely be pleasant. It runs on the cat's own clock like the
ear-flick, with a per-cat delay off the same hash-chosen tilt (multiplier 2.1
rather than the ear's 1.3, so a cat's knead and its ear never lock into step), so
**nothing observes her at all**: no listener, no timer, no second state, nothing
to undo. It is not gated on stage — an Unseen cat kneads too — because gating it
would make it a second readout of mastery, a Signal and a false one, and a child
could then read it as the cats she knows being happy and the ones she does not
being unhappy.

*Is it visible?* Asked properly, because "the paw is the body's own colour on any
cat without socks or points, and it is internal rather than breaking the
silhouette" is a real objection and it was raised against this. Measured at the
size it actually ships at, with every other animation frozen so only the knead
could differ: the knead changes **218** pixels by more than 6/255 and 66 by more
than 32, against the shipped ear-flick's **212** and 47, at the same peak-delta.
It is marginally *more* visible than a primitive already in the tree and already
guarded by its own test. The objection was wrong, and it was wrong for a
measurable reason rather than an arguable one.

**Arrive was a correction, not an addition.** Both gate cats were already
animated — with `pop`, which scales up from nothing *on the spot*, the exact
thing the row above forbids. It carries no opacity now: the cat starts outside
its own square and the SVG viewport clips it, so nothing is visible until the cat
is genuinely inside the frame and there is no fade to get wrong. Direction comes
off the same hash bit that mirrors the tail, so a given cat always comes from its
own side. The last frame is `transform: none`, so what survives the global
reduced-motion delete is a cat sitting where it belongs — and that is now
asserted rather than eyeballed, with `emulateMedia`, which no check in this repo
had ever used.

**It also found something.** The runner's reveal cat was given a bounce when she
was right and nothing at all when she was wrong: one cat, one moment, two
behaviours, chosen by her answer. A ten-year-old does not read that as *correct*
— she reads the cat as pleased with her, and therefore reads the flat one as the
cat not being pleased. That is §2 exactly, arrived at from the motion table
rather than from the guardrail, which is the sort of thing a written rule is for.
The entrance is identical either way now and lives inside the drawing where a
caller cannot make it conditional; the burst stays conditional, because a burst
is the app marking an answer and makes no claim about the animal.

**The slow blink is the important one.** In cats it is the actual affection
signal — a cat that slow-blinks at you is saying it trusts you — and it is the
one piece of cat behaviour that maps cleanly onto something the app needs
everywhere: *acknowledgement*. A thing saved to Drive, a checklist row ticked, a
word written in her own words, an essay phase logged. Every one of those is
currently a tick or a silent state change.

Making the blink the site's universal yes buys three things: one visual idiom for
confirmation across seventeen pages, a signal that is *derived from something
actually happening* rather than decorative, and a use of the animal that is
affectionate without being a reward. It must never blink for something that has
not actually happened — a blink on an optimistic save that later fails is the
system lying, which is rule 3.

**What is built.** `Glim` takes a `blink` seed: change it and the cat blinks
once, and passing the same value twice does nothing. The first place it fires is
the precision review, on the one transition that means something — a word going
from nothing to her own words, which is the moment the cat comes to know her. It
deliberately does not fire on every autosave, because a cat that blinks whenever
she pauses typing is a tic rather than an acknowledgement, and a signal that
fires when nothing happened is not a signal. Two assertions hold it to that: that
nothing has blinked before she writes, and that something has after.

**The second place is the reading log**, and the question that had to be answered
first — what exactly is the thing that happened? — has an unusually clean answer
there: a reading day being written. Not the page number changing, not the form
opening, not an autosave; the one event the whole page exists to record. So the
book's own cat blinks when a day is logged, from a seed bumped inside the write
rather than derived from the row, which is what keeps it silent on a render and
on a reload — nothing happened on those. Held by the same pair of assertions,
because the "nothing has blinked yet" half is the one that catches an animation
that merely fires whenever the page is looked at.

The remaining surfaces in the paragraph above — a save to Drive, a checklist row
— are not done, and each needs that same question asked of it.

## 5. Distance and height — **built**

world.md's own table opens with: *a cat that does not know you **keeps its
distance** and watches from somewhere high.* The code said that entirely in
opacity. Nothing was ever actually far away.

So **position is a second readout of the same mastery number**: `near` and `lift`
per stage in `components/glim.jsx`. Unseen draws at a bit over half size and
sits high; each stage brings it lower, nearer and larger; Radiant fills the
frame. Derived from the stage on every render, never stored, exactly as
brightness is — so it cannot drift and cannot be edited. *(Mechanic: the same
honest number said in a second language, and the one cat fact the design had been
quoting without using.)*

**Distance happens inside the cat's own square.** The box does not move, which is
what keeps a shelf of them a grid and — the part that matters — keeps the tap
target the size it always was. A cat is a button on three pages; shrinking the
drawing must never shrink the thing she has to hit.

`atLeast()` still applies, and gets this for free: a cat she has just called
right is floored at Steady, so it is never drawn distant for the same reason it
is never drawn faint.

Before and after, on the same untouched week: the Unseen pair used to fill their
boxes and merely look pale, so they read as present cats behind frosted glass.
Now they read as cats across the room, which is what the word actually means. The
eyes are still the last thing to go.

## 6. Form — the three zones

world.md settles this in one line: *the game's controls wear faces, the
rehearsal's do not, because on the day it counts they will not.* Formalised, so
it can be applied to a page nobody has thought about yet:

| Zone | Rule | Pages |
|---|---|---|
| **The world** | cats fully present, named, animate | quest, base, review, precision, home, books, rewards |
| **The workshop** | plain controls; a cat may *arrive on the reveal*, after the answer is committed | runner, subject, mixed |
| **The rehearsal** | no cat, no world noun, no game furniture, at all | inside a mock section, import |

The boundary is the moment of commitment. Before she answers, the screen looks
like the exam. After, the world is allowed back in.

The sign-in page is not in the rehearsal zone: it is the front door, seen before
anything is earned, and it may hold a waiting cat as long as it promises nothing.

**A Long Night gets nothing — and the exception this document first proposed is
not adopted.** Asked what one should feel like, Sheila said: *"Yes no gamify. But
at the end, could connected with the reward system?"* This section previously
read that as licence to send the cats she got right in once the mock was over.
That is a substitution: she asked for **the reward system**, which is Hum and the
shelf, and the collection is a different thing. Swapping one for the other while
quoting her in support is the move these documents are most careful never to
make. So a mock gets nothing from the first question to the last, and whether
anything arrives afterwards is the owner's to rule on, not this document's.

## 7. Interaction states, as cat behaviour

The states every page already has, given one consistent reading:

| State | Is | Not |
|---|---|---|
| empty | no cat has come here yet — a quiet place, a warm spot | "nothing here", a shrug, an apology |
| loading | something on its way in | a spinner with ears |
| disabled | asleep — still here, not available | greyed out and gone |
| success | slow blink | confetti as standard |
| error | it did not hear you; say it again | a cross, a hiss, any annoyance |
| hover | ears turn toward you | the whole cat jumping |
| focus | it looks at you | a glow that competes with the focus ring |

Error is the one to watch. "It did not hear you" is only honest for *her* input
failing. A genuine system failure — Drive down, a save lost — must be said
plainly in words, because dressing a real fault as a distracted cat is the system
lying about its own state.

## 8. The pages

| Page | Now | Gets | |
|---|---|---|---|
| `home` | 6 | the first Glim stays; **who is at the door today**, drawn, and she is greeted as `W.role` — the one word that names what she is and is never said | S/M |
| `quest` | 6 | the full grammar; meow voice, arrive, distance | M |
| `precision` | 5 | meeting a cat: shadow → near, on writing it in her own words. Distance does the work here | M |
| `review` | 3 | cats at the door, sitting at the distance their real status says | M |
| `base` | 5 | the Den: **knead, built** on both shelves; the high shelf **used** as the unseen shelf. `settle` struck — §4 | S |
| `runner` | 6 | unchanged before commitment; reveal cat gets the voice | M |
| `score` | 2 | unchanged. The number stays plain — a cat must never decorate an honest readiness figure | — |
| `mock` | 0 | nothing, start to finish — §6, and rule 5 | — |
| `essay` | the Telling, and the Reach it tells | **built.** The index already said the name; the page she actually writes on said "Essay · W3 · Sep 14 – 20" and joined the essay to nothing. It now heads "the Telling · Reach 3 · essay", so the week is the thing being written down | S |
| `books` | one cat per opened book | **built.** The Beacon is said, and a cat settles on every book she opens. Brightness is that book's own reading days; the blink is the day being written | S/Signal |
| `rewards` | the gathering | **built.** The shelf is warm and the cats gather on it — one for each level she has reached, each a word she has met, at the brightness her record gives it. Keyed to the LEVEL, which is lifetime earning: claiming a reward never sends one away | Signal |
| `checklist` | Reaches, counted | **built.** "Reach 3 of 8", and the plan's own week between them named as that | S |
| `calendar` | both, by name | **built.** Reaches and Long Nights on the timeline. Both names, never one instead of the other — her father reads this page to know when an exam is sat | S |
| `subject` | the four places | **built.** Each subject sits in its own place — the Wordwood, the Deep Shelf, the Weighbridge, the Workyard | S |
| `mixed` | 0 | **the one page still with nothing.** Not "as subject": a mixed set is drawn from all four places at once, so it cannot sit in one of them, and naming all four on a card is a list rather than a world. What it is *for* — crossing the places in one sitting — is the thing to name, and it has not been | S |
| `signin` | one cat, Unseen | **built.** A cat waits at the door and does not know her yet — §5's own first line, read literally at the one place it is plainly true. No count, no shelf, no line about meeting them: a checked rule, not a good intention | S |
| `import` | 0 | plumbing. Stays plain | — |

**The gathering, and the number it counts.** The rewards page is worth a note
because the obvious build of it breaks a guardrail. "Cats gather where it is
warm" invites one cat per so-many Hum *to spend* — and then claiming a reward
empties the page, which is *no cat leaves* (guardrail 3) broken in the most
literal way there is: an animal taken away as the price of a treat. It is keyed
to her LEVEL instead, which `lib/rewards.js` already derives from lifetime
earning and says so in its own comment — *spending never costs a level*. A cat
that has come never goes.

It is **Signal, not Mechanic**, and is not claimed as one: it tells the truth
about a real number and cannot be faked, but it would still work if the
questions were swapped for flashcards. Three checks hold it — that the count is
the level, that every cat is one she has actually met and drawn at her own
mastery, and that spending 150 Hum sends none of them away.

**First move, if only one thing is done:** add `deepShelf`, `weighbridge` and
`workyard` to `world.js` and use `W.role`, `W.telling`, `W.beacon` and `W.reach`.
It is a small edit, it touches no mechanic, and it is the difference between a
world and a set of screens.

## 9. What this deliberately does not do

- **No meow per click.** §3.
- **No cat during a Long Night, and none after it either** until the owner says
  otherwise. §6, rule 5.
- **No faces on practice choices.** They are plain on the day, so they are plain
  here.
- **No cat on the readiness number.** Rule 3: the one figure that must never be
  made to feel better than it is.
- **No countdown cat**, no bar inching toward 115, nothing that reads as a debt.
- **Nothing that needs feeding**, and nothing that can be neglected.
- **Nothing that implies a real cat is coming.** §9 of world.md, unchanged and
  not negotiable.
