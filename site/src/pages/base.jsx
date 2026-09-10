import * as React from "react"
import { Hammer, Lightbulb, Lock } from "lucide-react"

import { buildRoom, catHelp, rooms, baseCounts, skillCrests, wordCards } from "@/lib/base"
import { LTR, SUBJ } from "@/lib/content"
import { go } from "@/lib/router"
import { wallet } from "@/lib/rewards"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { W, GLOW_ORDER } from "@/lib/world"
import { Glim } from "@/components/glim"
import { WORD_GLOW } from "@/lib/glim"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Burst } from "@/components/burst"
import { sfx } from "@/lib/sfx"

/* Each thing, actually drawn. Seven identical isometric boxes told her nothing
 * about what she was buying; a scratching post looks like a scratching post.
 * Inline SVG and one gradient each — nothing is fetched, which is what keeps the
 * single-file artifact self-contained.
 *
 * Keyed by the ledger id, not by the name, so renaming a thing never silently
 * takes its picture away. */
const ART = {
  // a collar strap with a name tag hanging from it. Drawn as filled shapes, not
  // as a stroked loop: a hairline in --border disappears against the glow.
  "word-lab": (f, s) => (<>
    <path d="M12 22 h96 a7 7 0 0 1 0 15 h-96 a7 7 0 0 1 0 -15 Z" fill={f} stroke={s} strokeWidth="2.5" />
    <circle cx="88" cy="29.5" r="4" fill="none" stroke={s} strokeWidth="2" />
    <path d="M60 37 v9" stroke={s} strokeWidth="2.5" />
    <circle cx="60" cy="68" r="22" fill={f} stroke={s} strokeWidth="2.5" />
    <circle cx="60" cy="50" r="3.5" fill="none" stroke={s} strokeWidth="2" />
    <path d="M50 64 h20 M50 74 h13" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
  </>),
  // a window with a shelf across it
  "reading-den": (f, s) => (<>
    <rect x="22" y="8" width="76" height="60" rx="4" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M60 8 v60 M22 38 h76" stroke={s} strokeWidth="2.5" />
    <rect x="14" y="66" width="92" height="9" rx="3" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M28 75 v13 M92 75 v13" stroke={s} strokeWidth="3" strokeLinecap="round" />
  </>),
  // a bowl with a ball she has to knock the food out of
  "number-works": (f, s) => (<>
    <path d="M22 46 h76 l-9 34 a6 6 0 0 1 -6 4 h-46 a6 6 0 0 1 -6 -4 Z" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M18 46 h84" stroke={s} strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="28" r="15" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M50 20 q10 8 20 0 M50 36 q10 -8 20 0" stroke={s} strokeWidth="2" fill="none" strokeLinecap="round" />
  </>),
  // a rope post on a base
  "math-shop": (f, s) => (<>
    <rect x="24" y="78" width="72" height="10" rx="4" fill={f} stroke={s} strokeWidth="2.5" />
    <rect x="49" y="14" width="22" height="64" rx="4" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M49 26 h22 M49 38 h22 M49 50 h22 M49 62 h22" stroke={s} strokeWidth="2" />
    <circle cx="60" cy="10" r="7" fill={f} stroke={s} strokeWidth="2.5" />
  </>),
  // an open book
  "writing-studio": (f, s) => (<>
    <path d="M60 26 C48 16 30 16 16 20 v54 c14 -4 32 -4 44 6 Z" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M60 26 C72 16 90 16 104 20 v54 c-14 -4 -32 -4 -44 6 Z" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M26 34 h22 M26 46 h22 M72 34 h22 M72 46 h22" stroke={s} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
  </>),
  // a round bed on a stack of books
  "library": (f, s) => (<>
    <rect x="20" y="74" width="80" height="8" rx="2" fill={f} stroke={s} strokeWidth="2.5" />
    <rect x="26" y="64" width="68" height="8" rx="2" fill={f} stroke={s} strokeWidth="2.5" />
    <ellipse cx="60" cy="46" rx="38" ry="18" fill={f} stroke={s} strokeWidth="2.5" />
    <ellipse cx="60" cy="48" rx="26" ry="10" fill="none" stroke={s} strokeWidth="2" opacity="0.7" />
  </>),
  // a carrier with a grille door
  "rehearsal-hall": (f, s) => (<>
    <path d="M18 34 h84 v46 a4 4 0 0 1 -4 4 h-76 a4 4 0 0 1 -4 -4 Z" fill={f} stroke={s} strokeWidth="2.5" />
    <path d="M42 34 a18 18 0 0 1 36 0" fill="none" stroke={s} strokeWidth="4" strokeLinecap="round" />
    <rect x="62" y="42" width="32" height="34" rx="3" fill="none" stroke={s} strokeWidth="2" />
    <path d="M70 42 v34 M78 42 v34 M86 42 v34" stroke={s} strokeWidth="1.8" opacity="0.8" />
  </>),
}

/** One thing, drawn, with its light. The glow IS the light level, so the picture
 *  cannot say something different from the number beside it. */
function Tile({ room }) {
  const lit = room.light == null ? 0 : room.light
  const id = "g-" + room.id
  const draw = ART[room.id]
  return (
    <svg viewBox="0 0 120 96" className="w-full" role="img" aria-label={room.name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={room.built ? 0.28 + lit * 0.6 : 0.06} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={room.built ? 0.1 + lit * 0.35 : 0.03} />
        </linearGradient>
        <radialGradient id={id + "-glow"}>
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* the warmth around a thing a cat actually uses */}
      {room.built && lit > 0 ? <circle cx="60" cy="50" r="46" fill={`url(#${id}-glow)`} opacity={0.15 + lit * 0.45} /> : null}
      <g opacity={room.built ? 1 : 0.5}>
        {draw ? draw(`url(#${id})`, "var(--border)") : null}
      </g>
    </svg>
  )
}

/* Getting it right is what builds it.
 *
 * Sheila asked whether the Den could teach or simulate how to raise a cat. This
 * is the teaching half, and it is deliberately NOT a pet simulator: there is no
 * hunger bar, nothing decays, and nothing here can ever be neglected. A cat that
 * gets sad because she missed a day of maths is precisely the dark pattern hard
 * rule 3 exists to forbid, and it would be a cruel thing to put in front of a
 * child who wants a cat and does not have one.
 *
 * So the only demand is knowing. A wrong answer costs nothing, tells her the
 * real answer and why, and can be answered again straight away. Nothing here is
 * recorded as practice either — this is cat care, not the ISEE, and it must not
 * touch the engine or the score. */
function Check({ room, affordable, balance, onBuild }) {
  const [open, setOpen] = React.useState(false)
  const [pick, setPick] = React.useState(null)
  const q = room.check
  const right = pick != null && LTR[pick] === q?.k

  if (!affordable) {
    return <Button size="sm" disabled data-testid={`build-${room.id}`}><Lock /> {room.cost - balance} more {W.currency}</Button>
  }
  if (!q) {
    return <Button size="sm" onClick={() => onBuild(room)} data-testid={`build-${room.id}`}><Hammer /> Build for {room.cost}</Button>
  }
  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)} data-testid={`build-${room.id}`}><Hammer /> Build for {room.cost}</Button>
  }
  return (
    <div className="flex flex-col gap-2" data-testid="care-check" data-id={room.id}>
      <p className="text-sm font-medium">{q.q}</p>
      <div className="flex flex-col gap-1.5">
        {q.c.map((choice, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setPick(k)}
            disabled={right}
            data-testid="care-choice"
            data-mark={pick == null ? undefined : LTR[k] === q.k ? "right" : pick === k ? "wrong" : undefined}
            className={cn(
              "rounded-lg border-2 px-2.5 py-1.5 text-left text-[13px] leading-snug transition-colors",
              "hover:bg-accent/50 data-[mark=right]:!border-success data-[mark=right]:!bg-success-soft",
              "data-[mark=wrong]:!border-destructive data-[mark=wrong]:!bg-destructive/10"
            )}
          >
            {choice}
          </button>
        ))}
      </div>
      {pick != null ? (
        <p className="text-muted-foreground text-xs leading-relaxed" data-testid="care-why">
          {right ? "" : "Not quite. "}{q.e}
        </p>
      ) : null}
      {right ? (
        <Button size="sm" onClick={() => onBuild(room)} data-testid={`confirm-${room.id}`}><Hammer /> Build it for {room.cost}</Button>
      ) : pick != null ? (
        <Button size="sm" variant="outline" onClick={() => setPick(null)} data-testid={`retry-${room.id}`}>Try again</Button>
      ) : null}
    </div>
  )
}

function RoomCard({ room, balance, onBuild }) {
  const pct = room.light == null ? null : Math.round(room.light * 100)
  const affordable = balance >= room.cost
  return (
    <Card className={cn("relative gap-3 py-5", !room.built && "border-dashed")} data-testid="room" data-id={room.id} data-built={room.built ? "1" : "0"}>
      <CardHeader className="px-5">
        <CardTitle className="text-base">{room.name}</CardTitle>
        <CardDescription>{room.need}</CardDescription>
        <CardAction>
          {room.built ? (
            <Badge variant="success">Built</Badge>
          ) : (
            <Badge variant="outline" className="tabular-nums">{room.cost} {W.currency}</Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-5">
        <Tile room={room} />
        {room.built ? (
          <div className="flex flex-col gap-1.5" data-testid="room-light">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><Lightbulb className="size-3.5" /> Used</span>
              {/* honest numbers: no evidence is "—", never 0% */}
              <span className="font-semibold tabular-nums">{pct == null ? "—" : pct + "%"}</span>
            </div>
            <Progress value={pct == null ? 0 : pct} className="h-1.5" />
            <span className="text-muted-foreground text-xs">
              {pct == null ? `No ${W.cats} have used this yet — it warms up as you practise.` : "How much this really gets used, read live from what you know. Nothing here is stored."}
            </span>
          </div>
        ) : (
          <Check room={room} affordable={affordable} balance={balance} onBuild={onBuild} />
        )}
        {room.source ? (
          <p className="text-muted-foreground text-[11px]">
            {"Source: "}
            <a href={room.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{room.source.name}</a>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function Base() {
  useStore()
  const w = wallet()
  const list = rooms()
  const counts = baseCounts()
  const [cheer, setCheer] = React.useState(0)

  function onBuild(room) {
    if (buildRoom(room.id, w.balance)) { sfx("badge"); setCheer((n) => n + 1) }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card relative bg-gradient-to-t">
        {cheer ? <Burst seed={cheer} /> : null}
        <CardHeader>
          <CardDescription>{W.world} · {W.home}</CardDescription>
          <CardTitle className="text-2xl">{counts.built} of {counts.total} things built</CardTitle>
          <CardDescription className="max-w-prose">
            This is where you build what a {W.cat} actually needs. Every question you try makes {W.currency} —
            for trying, not for being right, so a hard day still counts. Once a thing is built, how much it
            gets used is how well you really know the subject behind it: they can only wear the name tags
            whose names you know. Nothing you build is ever taken away.
          </CardDescription>
          <CardAction>
            <div className="text-right">
              <div className="text-2xl font-extrabold tabular-nums" data-testid="base-balance">{w.balance}</div>
              <div className="text-muted-foreground text-xs">{W.currency} to spend</div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {/* Sheila's answer to "what happens at the end?" was "I finally get my
              cat, and build everything a cat needs". The second half is a thing
              this page can honestly say it has done; the first half is a real
              animal and a family decision, so the page points at the reward
              shelf — where a grown-up decides what is actually on offer — and
              promises nothing on anybody's behalf. */}
          {counts.built === counts.total ? (
            <div className="border-success/40 bg-success-soft mb-3 rounded-xl border-2 p-3 text-sm" data-testid="den-ready">
              <p className="font-bold">Everything a cat needs is here.</p>
              <p className="mt-1">
                Name tag, somewhere high, food and water, something to scratch, a health record, a warm bed, a carrier —
                that is the real checklist, and you have built all of it and know what each one is for.{" "}
                <button type="button" className="font-semibold underline underline-offset-2" onClick={() => go("/rewards")}>See the reward shelf</button>.
              </p>
            </div>
          ) : null}
          <Progress value={(counts.built / counts.total) * 100} className="h-2" />
          <p className="text-muted-foreground mt-2 text-xs tabular-nums">
            {w.lifetime} made all time{w.onBase ? ` · ${w.onBase} spent on things they need` : ""}{w.onRewards ? ` · ${w.onRewards} on rewards` : ""}
          </p>
        </CardContent>
      </Card>

      {/* Two across, not three: each card now carries a real paragraph of care
          guidance, and at three across that paragraph becomes a ribbon of two
          words a line. */}
      <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2" data-testid="rooms">
        {list.map((r) => <RoomCard key={r.id} room={r} balance={w.balance} onBuild={onBuild} />)}
      </div>

      <RealCats />
      <Collections />
    </div>
  )
}

/* Real cats.
 *
 * Sheila's idea was to link each Glim to a specific cat waiting to be fostered.
 * The spirit of it is right and this is as close as it can honestly get. Pinning
 * one real, named, adoptable animal to one vocabulary word cannot be done here:
 * it needs a live shelter feed, which means an API key sitting in a public
 * static site and an external request the artifact build is asserted never to
 * make — and worse, listings change. A cat gets adopted, or does not make it,
 * and a word she is learning would arrive carrying that news. That is not a
 * thing to hand a ten-year-old on a Tuesday.
 *
 * So the link is at the level of the collection rather than the individual, and
 * it points at pages the charities keep current themselves. Every line is
 * sourced, nothing is invented, and nothing here asks anyone for money. */
function RealCats() {
  const help = catHelp()
  const [open, setOpen] = React.useState(false)
  if (!help) return null
  return (
    <Card className="gap-3" data-testid="real-cats">
      <CardHeader>
        <CardTitle className="text-base">Real cats</CardTitle>
        <CardDescription className="max-w-prose">{help.note}</CardDescription>
        <CardAction>
          <Button size="sm" variant={open ? "secondary" : "outline"} onClick={() => setOpen((v) => !v)} data-testid="real-cats-toggle">
            {open ? "Close" : "What helps"}
          </Button>
        </CardAction>
      </CardHeader>
      {open ? (
        <CardContent className="flex flex-col gap-3">
          {help.ways.map((w) => (
            <div key={w.what} className="border-l-2 pl-3" data-testid="help-way">
              <p className="text-sm font-semibold">{w.what}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{w.how}</p>
              <p className="text-muted-foreground text-[11px]">
                {"Source: "}
                <a href={w.source.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{w.source.name}</a>
              </p>
            </div>
          ))}
          <p className="text-muted-foreground text-xs leading-relaxed">
            These are the organisations the advice in the {W.homeTitle} comes from. Which shelter is near you is a
            question for a grown-up, and this page does not know the answer — it would rather say so than guess.
          </p>
        </CardContent>
      ) : null}
    </Card>
  )
}

/* Collections are earned, never bought, and never random. A card is here because
 * she genuinely knows the word — the same "known" the precision review uses —
 * and a crest is here because the skill is genuinely Mastered. That is the whole
 * anti-loot-box design: no duplicates to chase, no rarity, nothing to gamble on.
 *
 * The book shows every cat she has MET, at the brightness her real record says,
 * rather than only the finished ones. A collection you can only ever add to is a
 * scoreboard; a collection where the ones you are half-way through stand there
 * half-lit is a reason to go back to them. Nothing here is stored: the coat comes
 * from the word, the brightness comes from the engine. */
function Collections() {
  const cards = wordCards()
  const known = cards.filter((c) => c.status === "known")
  const met = cards.filter((c) => c.status !== "new")
  const crests = skillCrests()
  const radiant = crests.filter((c) => c.level === "Mastered")
  // brightest first, same as the words, so what she owns leads
  const skillShelf = crests
    .slice()
    .sort((a, b) => GLOW_ORDER.indexOf(W.glow[b.level]) - GLOW_ORDER.indexOf(W.glow[a.level]) || a.sk.localeCompare(b.sk))
  // Brightest first, so the ones she owns lead and the dim ones are the
  // invitation. An entry like "imply / infer" is two words, and the Wordwood
  // calls each of them by its own name — so the book draws each of them as its
  // own cat, or the cat at the gate would not be the cat on the shelf. The
  // COUNT stays per entry, because that is what the engine actually knows about
  // (hard rule 4): drawing two cats must not turn one word into two.
  const shelf = met
    .flatMap((c) => String(c.word).split("/").map((s) => s.trim()).filter(Boolean).map((name) => ({ ...c, name })))
    .sort((a, b) => GLOW_ORDER.indexOf(WORD_GLOW[b.status]) - GLOW_ORDER.indexOf(WORD_GLOW[a.status]) || a.name.localeCompare(b.name))
  return (
    <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2" data-testid="collections">
      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-base">{W.book} · words</CardTitle>
          <CardDescription>Every {W.cat} you have met. It brightens as you get to know it, and it is Radiant once you have written it in your own words and called it right on a later day. Every one of them is invented — its coat comes out of the letters of the word.</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums">{known.length} / {cards.length}</Badge></CardAction>
        </CardHeader>
        <CardContent>
          {shelf.length ? (
            <div className="flex flex-wrap gap-2" data-testid="word-cards">
              {shelf.map((c) => (
                <figure key={c.name} className="flex w-16 flex-col items-center gap-0.5" data-testid="word-card" data-status={c.status} title={c.meaning || undefined}>
                  <Glim word={c.name} stage={WORD_GLOW[c.status]} className="size-12" title={`${c.name} — ${WORD_GLOW[c.status]}`} />
                  <figcaption className="w-full truncate text-center text-[11px] font-semibold">{c.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No {W.cats} here yet. Write a word in your own words, then call it right on another day, and it moves in.</p>
          )}
          {/* What "the world is lit" means, said once and only when it is true.
              It is deliberately not a progress bar counting down to it: a target
              you are always short of is a debt, and this world does not do
              those. Until then the line below is just the count. */}
          {shelf.length && known.length === cards.length ? (
            <div className="border-success/40 bg-success-soft mt-3 rounded-xl border-2 p-3 text-sm" data-testid="all-lit">
              <p className="font-bold">Every one of them knows your name.</p>
              <p className="mt-1">
                That is the whole {W.world.toLowerCase()} lit. Nothing here was luck and nothing was bought — you
                learned {cards.length} words and they all came when you called. The real ending is still the exam,
                and it always was; this part just walked beside it.
              </p>
            </div>
          ) : null}
          {shelf.length ? (
            <p className="text-muted-foreground mt-3 text-xs tabular-nums">
              {known.length} Radiant · {met.length - known.length} still finding their light · {cards.length - met.length} not met yet
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="gap-3">
        <CardHeader>
          <CardTitle className="text-base">{W.book} · skills</CardTitle>
          <CardDescription>A skill is a {W.cat} too. Every one you have practised is here at the brightness you have actually reached — Radiant is all the way.</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums">{radiant.length} / {crests.length}</Badge></CardAction>
        </CardHeader>
        <CardContent>
          {crests.length ? (
            <div className="flex flex-wrap gap-2" data-testid="skill-crests">
              {/* Skill names run to "Whole-number operations", so these get a
                  wider column and two lines rather than a row of "Whole-n…". */}
              {skillShelf.map((c) => (
                <figure key={c.sub + c.sk} className="flex w-24 flex-col items-center gap-0.5" data-testid="skill-crest" data-level={c.level} title={`${SUBJ[c.sub].name} · ${c.sk} — ${W.glow[c.level]}`}>
                  <Glim word={c.sub + ":" + c.sk} stage={W.glow[c.level]} className="size-12" title={`${c.sk} — ${W.glow[c.level]}`} />
                  <figcaption className="line-clamp-3 w-full text-center text-[11px] leading-tight font-semibold" style={{ color: SUBJ[c.sub].color }}>{c.sk}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">None yet. A skill goes Radiant once you get it right in mixed sets or a {W.longNight} on two different days — not by doing the same set twice.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
