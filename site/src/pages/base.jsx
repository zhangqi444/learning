import * as React from "react"
import { Hammer, Lightbulb, Lock } from "lucide-react"

import { buildRoom, rooms, baseCounts, skillCrests, wordCards } from "@/lib/base"
import { SUBJ } from "@/lib/content"
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

/** One room drawn as an isometric tile. Inline SVG and two gradients — nothing
 *  is fetched, which is what keeps the single-file artifact self-contained. The
 *  lamp brightness IS the room's light level, so the drawing cannot say
 *  something different from the number beside it. */
function Tile({ room }) {
  const lit = room.light == null ? 0 : room.light
  const id = "g-" + room.id
  return (
    <svg viewBox="0 0 120 96" className="w-full" role="img" aria-label={room.name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={room.built ? 0.28 + lit * 0.6 : 0.06} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={room.built ? 0.1 + lit * 0.35 : 0.03} />
        </linearGradient>
      </defs>
      {/* floor */}
      <path d="M60 78 L10 54 L60 30 L110 54 Z" fill={`url(#${id})`} stroke="var(--border)" strokeWidth="2" />
      {/* two walls, the left one darker so the box reads as a solid */}
      <path d="M10 54 L10 30 L60 6 L60 30 Z" fill={`url(#${id})`} stroke="var(--border)" strokeWidth="2" opacity={room.built ? 0.85 : 0.5} />
      <path d="M110 54 L110 30 L60 6 L60 30 Z" fill={`url(#${id})`} stroke="var(--border)" strokeWidth="2" opacity={room.built ? 0.6 : 0.35} />
      {/* the lamp: only a built room has one, and it glows by real mastery */}
      {room.built ? (
        <circle cx="60" cy="34" r={5 + lit * 4} fill="var(--primary)" opacity={0.35 + lit * 0.65}>
          {lit > 0 ? <animate attributeName="opacity" values={`${0.35 + lit * 0.5};${0.35 + lit * 0.65};${0.35 + lit * 0.5}`} dur="3.2s" repeatCount="indefinite" /> : null}
        </circle>
      ) : null}
    </svg>
  )
}

function RoomCard({ room, balance, onBuild }) {
  const pct = room.light == null ? null : Math.round(room.light * 100)
  const affordable = balance >= room.cost
  return (
    <Card className={cn("relative gap-3 py-5", !room.built && "border-dashed")} data-testid="room" data-id={room.id} data-built={room.built ? "1" : "0"}>
      <CardHeader className="px-5">
        <CardTitle className="text-base">{room.name}</CardTitle>
        <CardDescription>{room.blurb}</CardDescription>
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
              <span className="text-muted-foreground flex items-center gap-1.5"><Lightbulb className="size-3.5" /> Lights</span>
              {/* honest numbers: no evidence is "—", never 0% */}
              <span className="font-semibold tabular-nums">{pct == null ? "—" : pct + "%"}</span>
            </div>
            <Progress value={pct == null ? 0 : pct} className="h-1.5" />
            <span className="text-muted-foreground text-xs">
              {pct == null ? `No ${W.cats} live here yet — the lights come on as you practise.` : "Reads live from what you really know. Nothing here is stored."}
            </span>
          </div>
        ) : (
          <Button size="sm" disabled={!affordable} onClick={() => onBuild(room)} data-testid={`build-${room.id}`}>
            {affordable ? <><Hammer /> Build for {room.cost}</> : <><Lock /> {room.cost - balance} more {W.currency}</>}
          </Button>
        )}
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
          <CardTitle className="text-2xl">{counts.built} of {counts.total} rooms built</CardTitle>
          <CardDescription className="max-w-prose">
            Every question you try makes {W.currency} — for trying, not for being right, so a hard day still
            counts. {W.currency} is warmth, and warmth is what the {W.cats} come for. Once a room is warm its
            lights show how well you really know that subject, and nothing you build is ever taken away.
          </CardDescription>
          <CardAction>
            <div className="text-right">
              <div className="text-2xl font-extrabold tabular-nums" data-testid="base-balance">{w.balance}</div>
              <div className="text-muted-foreground text-xs">{W.currency} to spend</div>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Progress value={(counts.built / counts.total) * 100} className="h-2" />
          <p className="text-muted-foreground mt-2 text-xs tabular-nums">
            {w.lifetime} made all time{w.onBase ? ` · ${w.onBase} spent on rooms` : ""}{w.onRewards ? ` · ${w.onRewards} on rewards` : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 @md/main:grid-cols-2 @3xl/main:grid-cols-3" data-testid="rooms">
        {list.map((r) => <RoomCard key={r.id} room={r} balance={w.balance} onBuild={onBuild} />)}
      </div>

      <Collections />
    </div>
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
          <CardDescription>Every {W.cat} you have met. It brightens as you get to know it, and it is Radiant once you have written it in your own words and called it right on a later day.</CardDescription>
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
          <CardDescription>One {W.cat} for every skill taken all the way to Radiant.</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums">{crests.length}</Badge></CardAction>
        </CardHeader>
        <CardContent>
          {crests.length ? (
            <div className="flex flex-wrap gap-1.5" data-testid="skill-crests">
              {crests.map((c) => (
                <span key={c.sub + c.sk} className="flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 text-xs font-semibold" style={{ borderColor: SUBJ[c.sub].color }}>
                  <span className="inline-block size-2 rounded-full" style={{ background: SUBJ[c.sub].color }} />
                  {c.sk}
                </span>
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
