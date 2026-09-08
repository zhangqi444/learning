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

## 3. The Hearth

Her home in the light *(Sheila's)*. This is the Base, renamed and given a
reason: cats gather where it is warm, and every room she rebuilds is one more
warm place for them to be. A room's lights are the cats living in it — which is
why the lights read from real mastery rather than from anything stored.

It was called the Roost in the first draft of this document. A roost is for
birds. The Hearth is both correct and better: keeping it lit is precisely what a
Lampwright does, and it gives the currency below something to be for.

## 4. Hum

The currency *(Sheila's)*. Practice makes warmth, and warmth is what draws the
cats in and keeps the Hearth lit.

**Hum is made by trying, not by being right**, which is exactly what
`effortPoints()` already does — so a hard day where everything goes wrong still
makes Hum. It is spent on rooms. It is never taken away, never expires, and the
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

The Wordwood is built (`Wordgates`). The Weighbridge and Workyard are where
numbers get a real job later — a wrong measurement makes a bridge too short,
which is the honest version of gamifying arithmetic. The Deep Shelf is the
hardest and comes last.

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
| Base, rooms | **the Hearth** | "Base" belongs to a construction game, not to a world |
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

## 9. Still open — Sheila's to answer

1. What is the world called? (**Wildlight** is a placeholder)
2. What are the cats called? (**Glims** is a placeholder)
3. What is your first cat, and what is it like?
4. What do you look like here — what does a Lampwright wear or carry?
5. What is the Hearth like? What is in the first room?
6. What happens at the very end, when the whole world is lit?
7. What should a Long Night feel like?
8. Is there anyone else in the world? (Aria is welcome in it if Sheila wants
   her there — that is Sheila's call, not ours.)

## 10. What this changes in code

Nothing yet. The next commits rename what exists rather than adding to it:
`Base → Hearth`, `Sparks → Hum`, `Wordkeep → Wordwood`, one Glimbook replacing
word cards and skill crests, and the review pile's language rewritten around
cats at the door.

One bug to fix at the same time, found while checking coverage: the Wordgates
currently draw from all 160 vocabulary words including weeks she has never
studied. A Glim should only appear once she has met it — which is also what
makes a finished week visibly worth something.
