# Wildlight — the world

One world, one map, one currency, one reason. Everything the site does happens
inside it.

This exists because the game had drifted into eight unrelated metaphors — a base
you build, gates you cast spells at, sparks, boss fights, questions to rescue —
each invented on the day the feature was. Nothing explained why a base has gates.
This document is the answer to "why", and nothing should be named in code that
is not named here first.

Names marked **(Sheila's)** are hers to change. She likes Roblox, Pokémon and
music games, and the design leans on all three deliberately: a place you inhabit,
creatures you collect and grow, and things that run on a beat.

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

## 2. Glims

The creatures. Every meaning in the world is a small living thing called a
**Glim** *(Sheila's)*.

A word is a Glim. A skill is a Glim. When she does not know it, it is faint and
shy and keeps its distance. When she knows it, it is bright and it comes with
her. Glims hum — a known Glim is one you can hear clearly.

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

## 3. The Roost

Her home in the light *(Sheila's)*. This is the Base, renamed and given a
reason: it is where Glims gather, and every room she rebuilds is somewhere for
more of them to be. A room's lights are its Glims — which is why the lights read
from real mastery rather than from anything stored.

## 4. Hum

The currency *(Sheila's)*. Practice makes warmth, and warmth is what draws Glims
in and keeps the Roost lit.

**Hum is made by trying, not by being right**, which is exactly what
`effortPoints()` already does — so a hard day where everything goes wrong still
makes Hum. It is spent on rooms. It is never taken away, never expires, and the
same Hum can never be spent twice.

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

**Wordgates.** At the edge of a Reach stands a gate with a sentence carved into
it, one word missing. Cast the Glim whose meaning fits and it opens. Cast the
wrong one and the gate does what *that* word means instead — which is how you
learn what it meant.

**Glims at the door.** The review pile. A Glim you missed does not run away and
is not lost; it comes back and knocks — after a day, then three, then a week —
asking to be remembered. Twice remembered on different days and it stays for
good, with one check-in three weeks later. **Missing something is not a debt.**
It is how the world knows who to send back to you.

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
| Base, rooms | **the Roost** | "Base" belongs to a construction game, not to a world |
| Sparks | **Hum** | a placeholder word for "points" |
| Wordkeep | **the Wordwood**, with **Wordgates** | a castle with no country around it |
| Boss fight | **the Long Night** | borrowed from a genre we are not in |
| To rescue / rescue run | **Glims at the door** | "rescue" implies she stranded them |
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
2. What are the creatures called? (**Glims** is a placeholder)
3. What is your first one, and what is it like?
4. What do you look like here — what does a Lampwright wear or carry?
5. What is the Roost like? What is in the first room?
6. What happens at the very end, when the whole world is lit?
7. What should a Long Night feel like?
8. Is there anyone else in the world? (Aria is welcome in it if Sheila wants
   her there — that is Sheila's call, not ours.)

## 10. What this changes in code

Nothing yet. The next commits rename what exists rather than adding to it:
`Base → Roost`, `Sparks → Hum`, `Wordkeep → Wordwood`, one Glimbook replacing
word cards and skill crests, and the review pile's language rewritten around
Glims at the door.

One bug to fix at the same time, found while checking coverage: the Wordgates
currently draw from all 160 vocabulary words including weeks she has never
studied. A Glim should only appear once she has met it — which is also what
makes a finished week visibly worth something.
