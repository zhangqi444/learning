# Wildlight — the world

One world, one map, one currency, one reason. Everything the site does happens
inside it.

This exists because the game had drifted into eight unrelated metaphors — a base
you build, gates you cast spells at, sparks, boss fights, questions to rescue —
each invented on the day the feature was. Nothing explained why a base has gates.
This document is the answer to "why", and nothing should be named in code that
is not named here first.

Names marked **(Sheila's)** are hers to change. She likes Roblox, Pokémon, music
games and — most usefully of all — cats, and the design leans on all four
deliberately: a place you inhabit, creatures you come to know, things that run on
a beat, and an animal whose whole nature is deciding whether to come when called.

---

## 1. The premise

The world has gone **quiet**. Not broken, not evil — quiet. Meaning has drained
out of it. Words have come loose from what they mean and wandered off. Numbers
have let go of the things they measured. Stories have forgotten their endings.

Where meaning is gone, the light goes with it.

She is a **Lampwright**: someone who tends light and gives things their meaning
back. She does it the only way it can be done — by *actually knowing things*.
Nothing in this world is fixed by luck, by paying, or by turning up. It is fixed
by understanding, which is why the game cannot be cheated: the light is a readout
of what she genuinely knows.

## 2. Glims — the cats

The creatures. Every meaning in the world is a small cat made of light, called a
**Glim** *(Sheila's)*.

A word is a cat. A skill is a cat. Sheila likes cats a great deal, and that is
lucky, because cat behaviour turns out to be an almost exact description of what
the learning engine already models — which is why they are cats rather than
anything else:

| What a cat does | What it already means here |
|---|---|
| A cat that does not know you **keeps its distance** and watches from somewhere high | a word she has not learned yet |
| A cat that knows you **comes when you call its name** | recall — the exact thing the test measures |
| A cat **comes back and sits at your door** | the spaced review schedule, arriving rather than accusing |
| A cat **cannot be bought**; it decides about you | no luck, no purchase — enforced by the fiction, not just by a rule |
| Cats gather **wherever it is warm** | why Hum exists at all |

Calling a name is the whole verb of this world. Call the right name and that cat
comes out of the dark. Call the wrong one and **a different cat turns up** — call
`rigid` and something stiff and unbendable stalks in, which tells her what
`rigid` means far better than being marked wrong does.

**Glims never evolve by luck, and they are never lost.** A Glim's brightness is
read live from the engine's real mastery level and is never stored, so it cannot
drift from the truth and cannot be edited. This is the same rule the room lights
already follow, and it is the reason the collection is honest.

The stages map exactly onto the levels `skillLevel()` already computes:

| Engine level | Glim stage | What she sees |
|---|---|---|
| Not started | **Unseen** | a silhouette in the Glimbook |
| Started | **Glimpsed** | faint, half-there |
| Needs work | **Flickering** | present, unsteady |
| Familiar | **Steady** | a clear, calm light |
| Proficient | **Bright** | warm, strong |
| Mastered | **Radiant** | full colour, and it follows her |

Vocabulary Glims use the word statuses `wordStatus()` already returns — `new`,
`learning`, `due`, `brushup`, `known` — with `known` meaning the Glim has come
home.

The **Glimbook** is the collection: one page per Glim, silhouettes for the ones
not yet met. It replaces "word cards" and "skill crests", which were the same
idea under two names.

## 3. The Den

Where she builds what a cat needs. This was "the Hearth", and before that the
Base: seven rooms called Word Lab, Number Works, Rehearsal Hall. Sheila said she
did not understand why she was building them and asked whether they could be
things a cat needs instead — and she was right, so they are.

Seven things, at the same seven prices, lit by exactly the same seven real
numbers: a name tag and microchip, a high shelf by the window, food and water
bowls, a scratching post, a health record, a warm bed, a carrier. How much a
thing gets used is read live from real mastery, never stored — they can only wear
the name tags whose names she knows.

Each one teaches. The guidance is real, comes from a named animal-welfare or
veterinary source, lives in `content/catcare.json`, and building a thing means
answering one true question about it. Getting it wrong costs nothing and can be
answered again, and nothing here can ever be neglected — see §9 for why that is
not negotiable.

It was called the Roost in the first draft. A roost is for birds. Then the
Hearth, which was defensible and still meant nothing to the ten-year-old using
it. The lesson is in the naming: a metaphor that has to be explained is a
metaphor that has failed.

## 4. Hum

The currency *(Sheila's)*. Practice makes warmth, and warmth is what draws the
cats in and keeps the Den warm.

**Hum is made by trying, not by being right**, which is exactly what
`effortPoints()` already does — so a hard day where everything goes wrong still
makes Hum. It is spent on things a cat needs. It is never taken away, never expires, and the
same Hum can never be spent twice.

Hum is warmth, and warmth is what cats come for. That is the whole economy: work
makes warmth, warmth makes somewhere worth being, and the cats arrive on their
own. Nothing is ever bought from a shop.

"Sparks" was a placeholder word for "points". Hum is what the world actually
uses.

## 5. The map — eight Reaches

The eight plan weeks are eight **Reaches** of the world, each quiet until she
works in it. A Reach is not locked behind the last one — she can go anywhere,
because a plan that refuses to let you practise what you want is a plan that
punishes curiosity.

The four subjects are four kinds of place, and they exist in every Reach:

| Subject | Place | What it is |
|---|---|---|
| Verbal Reasoning | **the Wordwood** | where word-Glims live; you call them by knowing what they mean |
| Reading Comprehension | **the Deep Shelf** | long texts left by people who are gone; you read to find out what happened |
| Quantitative Reasoning | **the Weighbridge** | where things are compared, measured and weighed |
| Mathematics | **the Workyard** | where things are counted, cut and built |

The Wordwood is built. The other three are **not** getting mechanics of their
own, and that is a decision rather than a gap.

The idea above — a wrong measurement makes a bridge too short — was checked
against the actual bank and does not survive it. Only 8 of the 408 Quantitative
and Mathematics items are comparison-shaped, so there is nothing to build a
balance on; and no distractor records *what mistake produces it*, so the version
that would really work (pick 24 instead of 21 and see that 24 is what you get if
you divide instead of multiply) cannot be derived without inventing the
misconception, which the content rules forbid. It is a content problem, and
AGENTS.md says which content would unlock it.

Meanwhile 244 of those 408 items *do* have a story whose objects are arbitrary
and could carry a cat, and the owner's decision is that they should not: the
practice has to look like the test. So the cats reach these three subjects the
way they reach anything the content cannot carry — **around** the question. Get a
Percent question right and the Percent cat turns up, in its own voice, at the
brightness the engine really reports for Percent. The question and its four
choices are exactly what the real test prints.

## 6. The events

**Calling.** At the edge of a Reach stands a gate with a sentence carved into it,
one word missing. She calls a name into the dark. The right name and that cat
comes through the gate; the wrong name and **the wrong cat comes** — call `rigid`
and something stiff and unbendable stalks in, sits down, and will not be moved.
Nobody is told off. She simply sees what she actually asked for.

**Cats at the door.** The review pile. A cat whose name she got wrong does not
run away and is not lost. It comes and sits outside — after a day, then three,
then a week — waiting to be called again. Get its name right on two different
days and it moves in for good, with one look-in three weeks later.

**Missing something is not a debt.** A cat at the door is not a bailiff. This is
the single most important reframing in the document, because the review pile is
the one surface that could most easily feel like a punishment for being wrong.

**The Long Night.** A mock exam. Once in a while the quiet comes back for a
whole night and she holds the light through it, timed, alone, no help. **You beat
a Long Night by getting to the end of it, not by scoring well** — the score is
information, the finishing is the victory.

**The Telling.** The weekly essay. Meaning drains out of a place when nobody
tells its story, so a Reach is only truly hers once she has written it down. This
is why writing exists in this world at all, and it is not a chore bolted on.

**The Beacon.** Real books. Light brought in from outside the world — the only
thing here that comes from somewhere else. Reading days feed it.

**Rounds.** Timed practice, on a beat. The world has a pulse; keeping time with
it is a skill. This is the music-game thread, and it is not decoration: the real
test gives about 35 seconds a question in Verbal and 55 in Quantitative, and one
of her reading sets already has nine questions with no answer recorded because
the clock beat her. Learning to move at a steady pace is worth real practice.

## 7. What everything is called now

| Was | Is | Why it was wrong |
|---|---|---|
| Base, rooms | **the Den**, and seven things a cat needs | "Base" belongs to a construction game; "Hearth" had to be explained, which is how you know it failed |
| Sparks | **Hum** | a placeholder word for "points" |
| Wordkeep | **the Wordwood** | a castle with no country around it |
| Boss fight | **the Long Night** | borrowed from a genre we are not in |
| To rescue / rescue run | **cats at the door** | "rescue" implies she stranded them |
| Skill crests, word cards | **the Glimbook** | two names for one idea |
| Effort points | **Hum** | as above |

## 8. The rules that hold whatever we invent

1. **Nothing is ever lost.** No Glim leaves, no room is repossessed, no Hum
   expires. A game that takes a child's work away has no business being here.
2. **Nothing is rare by luck.** Every Glim is got by knowing something. No
   crates, no rarities, no chance.
3. **The light never lies.** Brightness is derived from real mastery, never
   stored, so the world cannot flatter her. Where there is no evidence it shows
   "—" rather than a dark room she did nothing to deserve.
4. **Missing something is never punished.** Not by a lost streak, not by a Glim
   leaving, not by a sound that feels like a buzzer.
5. **The exam is still the point.** The Long Nights stay honest rehearsals: real
   timing, no hints, no game furniture in the way.

## 9. Answered — by Sheila

She has been through the questions. Her answers, and what changed because of
them.

1. **Your first cat?** *"I don't have one. But my uncle has one, British
   shorthair golden-shaded cat."*
2. **What do you look like here?** She sent a photograph of herself carrying a
   very large, very relaxed cat. That is the Lampwright: someone with a cat in
   their arms. The photograph itself stays out of the repository — a real child's
   face does not belong in a public git history, and the site fetches nothing
   anyway.
3. **What is the Hearth like?** *"Actually very confused here why we have hearth.
   Can it be something cat related? Can we build things the cat need?"* — and
   then: *"why don't you build 7 things cat needs. Actually here could be teach
   or simulate how to raise a cat?"*
4. **What happens at the end?** *"I finally get my cat? And build the everything
   a cat need."*
5. **What should a Long Night feel like?** *"Yes no gamify. But at the end, could
   connected with the reward system?"*

**Question 3 rebuilt the Hearth, and she was right.** Seven rooms called Word Lab
and Number Works were a filing cabinet with a name on it; nobody builds a filing
cabinet for a cat. They are now the seven things a cat actually needs — a name
tag and microchip, somewhere high by a window, food and water bowls, a scratching
post, a health record, a warm bed, a carrier — at the same seven prices, lit by
exactly the same seven real numbers. The place is **the Den**.

**And it teaches.** Each thing carries real guidance from a named source (ASPCA,
RSPCA, Cats Protection, International Cat Care) in `content/catcare.json`, and
building it means answering one real question drawn from that guidance. She does
not have a cat and would like one; that is exactly the person this should be
accurate for. The content rule applies with full force here: none of it is
invented, all of it is attributed, and it says plainly that a vet decides what is
right for a particular cat.

**What it deliberately is not: a pet simulator.** No hunger bar, no meter that
falls, nothing that can be neglected. A cat that gets sad because she missed a
day of maths is precisely the dark pattern rule 4 forbids, and it would be a
cruel thing to put in front of a child who wants a cat and does not have one. So
the only demand is knowing, a wrong answer costs nothing and can be answered
again, and everything built stays built forever.

**Question 4 is half ours and half not.** Building everything a cat needs is
something this page can honestly finish, and when all seven are done it says so —
that is a real readiness checklist, and completing it means something. Whether
she then gets a real cat is a family decision about a live animal, so the site
promises nothing: the finished Den points at the reward shelf, where a grown-up
decides what is actually on offer. **Nothing in the code should ever imply a cat
is coming.**

### The last two, answered

She handed these back: *"you answer for me."* So — answered, and both built,
because an answer that only exists in a document is not an answer.

**What is your first Glim like?**

It is not chosen and it is not invented. **Her first Glim is the first word she
ever put into her own words**, whichever that turns out to be, read straight out
of her own record. Today that makes it **`benign`** — a ginger tabby, because
that is what the letters of `benign` come to — from the Week-1 work migrated out
of the Sheets before this site existed. It is on the dashboard, under *the first
one that came*, and tapping it plays its call.

What it is *like* is the point of doing it this way. It is not the rarest or the
best or the one we picked for her; it is simply the one that was there first,
and it never leaves, never dims below what she has earned, and is still on that
card the day she sits the exam. It is also **hers** in a way nothing we invented
could be: anybody else who ever used this would get a different cat, because
they would have met a different word first. And it cannot be faked — there is no
setting for it, only the record.

**What happens at the very end, when the world is lit?**

Every Glim Radiant. All 115 words explained in her own words and called right on
another day — no luck, no purchase, nothing bought. The Glimbook says it once,
when it is true:

> **Every one of them knows your name.**

And then it says the honest thing, which matters more than the sentence before
it: *the real ending is still the exam, and it always was; this part just walked
beside it.* Rule 5, at the one moment the world would most like to forget it.

Two things it deliberately does not do. There is **no countdown** — no bar
inching toward 115, no "37 to go". A target you are permanently short of is a
debt, and this world does not do debts; until it is true, that line is just a
count of what she knows. And the world being lit **is not the reward**. What
happens afterwards is a family decision about a real animal, so the finished Den
points at the reward shelf and the code promises nothing on anyone's behalf.

## 10. What this changed in code

All of it, in the end. In order:

| | |
|---|---|
| `b41ee15` | every world noun moved into one file (`site/src/lib/world.js`), and the Wordwood stopped drawing cats from weeks she had never opened |
| `6e52c62`, `ebcf840` | the Wordwood itself, and Verbal Reasoning drawn as the gate it already was |
| `a84a8a0`, `291ea3f` | every word given a cat and a voice, generated from its own letters; the run's ending sung by the cats that came |
| `d1a5142` | cats put where the words already are — the precision review, the review pile, the gate — and the Wordwood finally reachable from the weekly plan |
| `108dd1e` | skills drawn as cats too, which is the only place all six brightnesses are used |
| `d9fe4d7` | the Hearth rebuilt as **the Den**: seven things a cat actually needs, each teaching real sourced care, none of it a pet simulator |
| `2ac61f7` | the coats made real cats instead of points on a colour wheel |
| `bef744a` | the invented cats labelled as invented, and what helps the real ones |
| `e79cfc3` | a cat turning up on the reveal in every subject, in its own voice |
| `3e014e5` | the nav grouped, with the Wordwood deliberately left in the working list |

Two rules were learned the hard way and are worth keeping in view. A metaphor
that has to be explained has failed — "the Hearth" was defensible and meant
nothing to the ten-year-old using it. And the person the thing is for is the best
reviewer there is: every redirection in this list came from her or her father,
and every one of them was right.

## 11. The materials — how a cat is made

Nobody is going to draw a hundred and fifteen cats, and nobody is going to record
a hundred and fifteen sounds. So every cat is **generated from its own word**, in
`site/src/lib/glim.js`: the word is hashed, and the hash picks the coat, the
build, white socks and a bib, the eye colour, which way the tail curls, the tilt
of the head — and the call.

**The coats are real cats, not hues.** The first version picked a hue off a
24-step wheel. It gave plenty of variety and it produced lilac and mint-green
cats, which exist nowhere, and Sheila asked for real ones. There are twelve now —
brown, ginger and silver tabby; **golden-shaded**, because her uncle has a golden-
shaded British shorthair; tuxedo, black, blue, cream; **seal point**, which is the
very large, very relaxed cat in the photograph she sent; calico, tortoiseshell
and white. Each carries the eye colours that really go with it, because a cat
with the wrong eyes stops looking like a cat. Three builds carry the rest of the
variety: shorthair round and low, longhair with a ruff and a plume of a tail,
oriental taller and leaner with bigger ears. Coat × build × socks × bib × eyes is
still hundreds of cats, and every one of them is a cat you could point at.

The look and the voice come out of the same seed deliberately. `benign` is the
same cat on the laptop, on the iPad, and in a year; it always answers in the
same two notes. That is the whole point of doing it this way rather than picking
at random: after a fortnight she is not recognising *a cat*, she is recognising
*that* one — and recognising it is recognising the word.

**The call** is two rising notes from a major pentatonic scale, in one of three
octaves. Rising, because a cat answering is "mrrp?", not a sigh. Pentatonic,
because a run is five calls in a row and two cats calling near each other must
not produce a sour interval — a wrong note in a game about being right is cruel.
Thirty distinct calls, every one of them in the same scale.

The octaves have to be octaves, which is the one thing this got wrong first
time. A register of a fourth or a fifth moves that cat's whole scale off the
shared one, and then two cats can land a semitone apart — precisely the sour
interval the scale was chosen to rule out. A test now records what the page asks
the audio hardware for and checks every pitch is a member of the set.

Finishing a run plays **the cats that came, in the order they came**: her own
answers as a short phrase. A run of two is a short tune rather than a tune with
three wrong notes in it — nothing is added for a miss (rule 4).

Calling the **wrong** name plays that cat's real call, lower and slower, with one
quiet note under it. She hears it is somebody else before she has read a word of
the explanation. Still not a buzzer (rule 4).

**Brightness is not part of the cat** — it is how well she knows the word, read
live from the engine, never stored (rule 3):

| Word status | Stage | What she sees |
| --- | --- | --- |
| never met | Unseen | a shadow and two eyes |
| learning | Glimpsed | there, but faint |
| due for review | Flickering | almost solid, wavering |
| known, past its brush-up | Steady | fully there |
| — | Bright | (skills, not words) |
| known | Radiant | lit from inside, with a halo |

So the Glimbook is not a trophy shelf that only ever grows. It shows every cat
she has **met**, at its true brightness, brightest first — the half-learned ones
stand there half-lit, which is the invitation to go back to them. The headline
count still counts only the ones she genuinely knows: drawing a cat must never be
mistaken for having earned it (rule 3 again).

Not one byte of any of this is fetched. The coats are `hsl()`, the cats are
inline SVG, the calls are oscillators. The single-file artifact still makes zero
external requests, and the test that asserts it still passes.

Where the cats appear, and where they deliberately do not: she **meets** them in
the precision review (a shadow with two eyes until she writes the word in her own
words), **calls** them in the Wordwood, sees them **waiting** in the review pile,
and keeps them in the Glimbook. In a practice set the four choices stay plain
words on white — the game's controls wear faces, the rehearsal's do not, because
on the day it counts they will not. A Verbal set gets its cat only on the reveal,
walking through the gate it just opened.

Two rules held while building it. An entry like `imply / infer` is **two** words,
so it is two cats — otherwise the cat at the gate would not be the cat on the
shelf. And a cat she has just called correctly is never drawn faint, even the
first time: the honest number lives on the score page, and dimming a cat she just
got right reads as the game arguing with her.
