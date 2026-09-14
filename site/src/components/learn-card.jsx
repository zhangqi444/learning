import * as React from "react"
import { BookOpen, ExternalLink, Lightbulb, TriangleAlert } from "lucide-react"

import { learnCard, learnLinkUrl } from "@/lib/aops"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/** Teach it here, now, for free.
 *
 *  Shown the moment she gets a question wrong, above the AoPS chapter. Bundled
 *  first-party text: no account, no subscription, no request — so it works on a
 *  plane, in the artifact, and for a family that does not pay for anything. The
 *  outside links below it go straight to the lesson where we have its address —
 *  every skill has a free Khan Academy page — and each is marked free or paid, so
 *  nobody discovers a paywall by walking into one. */
export function LearnCard({ skill, className, collapsed }) {
  const c = learnCard(skill)
  const [open, setOpen] = React.useState(!collapsed)
  if (!c) return null
  /* Collapsed is for the middle of a set. The lesson has to be reachable at the
   * moment she gets it wrong — she may never scroll back to the score card — but
   * a miss was already stacking six blocks at her, and a wall of correction is
   * not teaching. So: one line she can open, and nothing opened at her. */
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs hover:underline", className)}
        data-testid="learn-open"
        data-skill={skill}
      >
        <Lightbulb className="size-3.5" /> How to do {skill}
      </button>
    )
  }
  return (
    <div className={cn("bg-muted/40 flex flex-col gap-2 rounded-md border p-3 text-sm", className)} data-testid="learn-card" data-skill={skill}>
      <div className="flex items-center gap-2 font-medium"><Lightbulb className="size-4" /> {skill}</div>
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
      {c.links && c.links.length ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-muted-foreground text-xs">More:</span>
          {c.links.map((l) => (
            <a key={l.name} href={learnLinkUrl(l)} target="_blank" rel="noopener noreferrer" data-testid="learn-link" data-free={l.free ? "1" : "0"}>
              <Badge variant="outline" className="font-normal">
                <BookOpen className="size-3" /> {l.name}
                <span className={cn("ml-1 text-[10px]", l.free ? "text-success" : "text-muted-foreground")}>{l.free ? "free" : "paid"}</span>
                <ExternalLink className="size-3" />
              </Badge>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}
