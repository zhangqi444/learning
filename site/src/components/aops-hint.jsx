import * as React from "react"
import { BookOpen, ExternalLink } from "lucide-react"

import { ALCUMUS_URL, VIDEO_URL, aopsFor } from "@/lib/aops"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@zhangqi444/ui/ui/tooltip"

/** "Where to relearn this": the AoPS material for a weak maths skill.
 *  `inline` is the one-line form used inside a table row.
 *
 *  The inline label used to be `a.ba.split(" · ")[0] + " · " + a.pa`: the Beast
 *  Academy level code with the *Prealgebra* chapter title glued on after it. The
 *  learn card carries a note about that exact splice and calls it fixed, and it
 *  was — there, and not here. It read correctly on Percent, where both names
 *  happen to be "Percents", and on 29 of the other 43 skills it named a unit
 *  that does not exist: Division advertised "4B · Properties of Arithmetic",
 *  Factors "5B · Primes and Divisors". Two true facts spliced into one false
 *  label, which is worse than either alone because it looks like a lookup gone
 *  wrong rather than a typo.
 *
 *  So this says what the link opens, exactly as the learn card does: Alcumus,
 *  and the focus topic to set when she gets there, because Alcumus has no
 *  per-topic deep link and the topic name is the instruction. Both real names
 *  are in the tooltip, each labelled with what it is and what it costs. */
export function AopsHint({ sub, skill, inline, className }) {
  const a = aopsFor(sub, skill)
  if (!a) return null
  if (inline) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={ALCUMUS_URL} target="_blank" rel="noreferrer"
            className={cn("text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs", className)}
            data-testid="aops-hint" data-skill={skill} data-free="1" data-ba={a.ba}
          >
            <BookOpen className="size-3" /> Alcumus · {a.alcumus}
          </a>
        </TooltipTrigger>
        <TooltipContent className="max-w-72">
          <span className="font-medium">{a.why}</span>
          <br />Set the Alcumus focus topic to {a.alcumus}. Free with an AoPS account.
          <br />Prealgebra: {a.pa} (free videos)
          <br />Beast Academy {a.ba}{a.ba2 ? ` · ${a.ba2}` : ""} — a book, and not free
        </TooltipContent>
      </Tooltip>
    )
  }
  return (
    <div className={cn("bg-muted/40 flex flex-col gap-1.5 rounded-md border p-3 text-sm", className)} data-testid="aops-hint" data-skill={skill}>
      <div className="flex items-center gap-2 font-medium"><BookOpen className="size-4" /> Relearn it in AoPS</div>
      <div className="text-muted-foreground">{a.why}</div>
      <ul className="text-muted-foreground flex flex-col gap-0.5 text-xs">
        <li><span className="text-foreground font-medium">Alcumus</span> — focus topic “{a.alcumus}”, free with an AoPS account</li>
        <li><span className="text-foreground font-medium">Prealgebra</span> — {a.pa} chapter, free videos</li>
        <li><span className="text-foreground font-medium">Beast Academy</span> — {a.ba}{a.ba2 ? `; ${a.ba2}` : ""}; a book, and not free</li>
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <a href={ALCUMUS_URL} target="_blank" rel="noreferrer"><Badge variant="outline" className="font-normal">Alcumus <ExternalLink className="size-3" /></Badge></a>
        <a href={VIDEO_URL} target="_blank" rel="noreferrer"><Badge variant="outline" className="font-normal">Prealgebra videos <ExternalLink className="size-3" /></Badge></a>
      </div>
    </div>
  )
}
