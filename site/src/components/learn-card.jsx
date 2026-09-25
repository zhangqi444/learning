import * as React from "react"
import { BookOpen, ExternalLink, Lightbulb, Search, TriangleAlert } from "lucide-react"

import { ALCUMUS_URL, aopsFor, learnCard, learnLinkUrl, learnName, learnQuery, learnUrl } from "@/lib/aops"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Glim } from "@/components/glim"
import { Tooltip, TooltipContent, TooltipTrigger } from "@zhangqi444/ui/ui/tooltip"

/** Teach it here, now, for free.
 *
 *  Bundled first-party text: no account, no subscription, no request — so it
 *  works on a plane, in the artifact, and for a family that does not pay for
 *  anything.
 *
 *  Everywhere else to go sits in one row at the bottom. It used to be three
 *  separate things at three heights: the free sites inside the card, then the
 *  AoPS chapter as a loose line under it, then the web search under that — three
 *  answers to the same question ("where else can I look?") arranged as though
 *  they were unrelated, with the two that sat outside the border reading as
 *  leftovers rather than as part of the lesson. They are one row now, each marked
 *  free or paid, so nobody discovers a paywall by walking into one.
 *
 *  `cat` is the skill's own cat — the same animal the Glimbook holds, at the
 *  brightness the engine really reports for that skill. It is a Mechanic, not
 *  decoration: it is the honest mastery number said in the language the rest of
 *  the world speaks, and it is drawn identically whether she got the question
 *  right or wrong, so it can never read as a verdict on the answer (AGENTS.md,
 *  "a cat can never be disappointed in her"). Callers that have no honest cat to
 *  pass — a mock report, where cats.md §6 gives a Long Night nothing — pass none,
 *  and the card is headed by the lamp instead. */
export function LearnCard({ skill, sub, item, cat, className, collapsed }) {
  const c = learnCard(skill)
  /* A mock question is tagged the way a paper tags it. The card is headed with
   * its own name, so she reads "How to do Percent" and not "how to do percent
   * reasoning—reverse discount", which names the question rather than the skill. */
  const name = learnName(skill) || skill
  const [open, setOpen] = React.useState(!collapsed)
  if (!c) return null
  /* Collapsed is for the middle of a set, and for a question she got right. The
   * lesson has to be reachable at the moment it is worth anything — she may
   * never scroll back to the score card — but a miss was already stacking six
   * blocks at her, and a wall of correction is not teaching. So: one line she
   * can open, and nothing opened at her. */
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs hover:underline", className)}
        data-testid="learn-open"
        data-skill={name}
      >
        {cat
          ? <Glim word={cat.word} stage={cat.stage} className="size-5 -my-1" title={`${name} — ${cat.stage}`} />
          : <Lightbulb className="size-3.5" />} How to do {name}
      </button>
    )
  }
  const a = sub ? aopsFor(sub, skill) : null
  const search = sub ? learnUrl(sub, item || { sk: name }) : null
  return (
    <div className={cn("bg-muted/40 flex flex-col gap-2 rounded-md border p-3 text-sm", className)} data-testid="learn-card" data-skill={name}>
      <div className="flex items-center gap-2 font-medium">
        {cat
          ? <Glim word={cat.word} stage={cat.stage} className="size-8 -my-1" title={`${name} — ${cat.stage}`} />
          : <Lightbulb className="size-4" />} {name}
      </div>
      <p className="text-muted-foreground">{c.what}</p>
      <ol className="text-muted-foreground ml-4 flex list-decimal flex-col gap-0.5 text-[13px]">
        {c.how.map((h, i) => <li key={i}>{h}</li>)}
      </ol>
      {c.example ? (
        <p className="bg-background/70 rounded border px-2.5 py-2 text-[13px] leading-relaxed">
          <span className="font-medium">{c.example.q}</span> {c.example.work}
        </p>
      ) : null}
      {c.trap ? (
        <p className="text-warning flex items-start gap-1.5 text-[13px] leading-relaxed" data-testid="learn-trap">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> {c.trap}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-muted-foreground text-xs">More:</span>
        {(c.links || []).map((l) => (
          <a key={l.name} href={learnLinkUrl(l)} target="_blank" rel="noopener noreferrer" data-testid="learn-link" data-free={l.free ? "1" : "0"}>
            <Badge variant="outline" className="font-normal">
              <BookOpen className="size-3" /> {l.name}
              <Cost free={l.free} />
              <ExternalLink className="size-3" />
            </Badge>
          </a>
        ))}
        {/* This badge opens Alcumus, so it says Alcumus and it is marked free.
            It used to be named for the Beast Academy chapter and marked paid,
            on the reasoning that a chapter of Beast Academy is a book — true of
            the book, and the wrong question, because the mark is on a link and
            a link is answered by what it opens. AoPS say Alcumus is free, this
            repo's own aops.json note has said "free with an AoPS account" the
            whole time, and the badge still called it paid. A free thing marked
            paid is not the harmless direction of the error either: it is the
            free adaptive problem set, the one thing here that will keep feeding
            her questions after our bank runs out, wearing the label that tells
            a family who does not buy books to skip it.

            The chapter is not lost, it has moved to where a book belongs: the
            tooltip, named as a book and as something that costs money, beside
            the free videos that teach the same chapter. `data-ba` keeps it
            assertable without needing a hover.

            The label carries the whole Alcumus focus topic, because that is the
            thing she has to do on arrival — Alcumus has no per-topic deep link,
            so the topic name IS the instruction. An earlier version of this row
            took the code off the front of the Beast Academy unit and glued on
            the *Prealgebra* chapter name instead, so the Volume lesson
            advertised "5A · Perimeter and Area": two true facts spliced into one
            false label, which is worse than either alone because it looks like a
            lookup gone wrong. */}
        {a ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={ALCUMUS_URL} target="_blank" rel="noopener noreferrer" data-testid="aops-hint" data-skill={skill} data-free="1" data-ba={a.ba}>
                <Badge variant="outline" className="font-normal">
                  <BookOpen className="size-3" /> Alcumus · {a.alcumus}
                  <Cost free />
                  <ExternalLink className="size-3" />
                </Badge>
              </a>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              <span className="font-medium">{a.why}</span>
              <br />Set the Alcumus focus topic to {a.alcumus}. Free with an AoPS account.
              <br />Prealgebra: {a.pa} (free videos)
              <br />Beast Academy {a.ba}{a.ba2 ? ` · ${a.ba2}` : ""} — a book, and not free
            </TooltipContent>
          </Tooltip>
        ) : null}
        {/* Last, because it is the widest and the least certain: a search of the
            idea, never of the question. An ISEE stem typed verbatim finds
            homework-answer sites, which teach nothing and hand her the key. */}
        {search ? (
          <a href={search} target="_blank" rel="noopener noreferrer" data-testid="learn-more" data-free="1" title={learnQuery(sub, item || { sk: name })}>
            <Badge variant="outline" className="font-normal">
              <Search className="size-3" /> Search the web
              <Cost free />
              <ExternalLink className="size-3" />
            </Badge>
          </a>
        ) : null}
      </div>
    </div>
  )
}

function Cost({ free }) {
  return <span className={cn("ml-1 text-[10px]", free ? "text-success" : "text-muted-foreground")}>{free ? "free" : "paid"}</span>
}
