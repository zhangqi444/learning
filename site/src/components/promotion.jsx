import * as React from "react"
import { ArrowUp, Check } from "lucide-react"

import { PROMOTE_AT, promotionsIn, skillLevel } from "@/lib/engine"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

/* The promotion contract, said before the set and answered after it.
 *
 *  Borrowed in shape from Khan Academy's Mastery Challenge, which names the
 *  skills it is about to test and the terms it will judge them on, and then
 *  tells you what moved. Ours already had the mechanic — two of a skill's
 *  questions right in a mixed set or a mock, each on a later day than she first
 *  met that question — and none of the telling.
 *
 *  Three things from Khan's version are deliberately not here. It levels skills
 *  *down*, which is rule 4. It locks the challenge for twelve hours, which means
 *  measuring how long she has been away. And it is the centre of its own screen;
 *  this is a line above the button and a line under the score, because the set
 *  is still twelve mixed questions and not a promotion ceremony.
 *
 *  No cats, anywhere in this file, and that is a decision rather than an
 *  oversight. Everything here has two outcomes — it moved or it did not — and a
 *  cat attached to either one is a cat with an opinion about how she did. The
 *  score card's own row of cats is drawn identically whether she was right or
 *  wrong, which is what makes it safe; nothing in a promotion report could be. */

/** Before the set: what today's twelve can actually lift, and what it needs. */
export function PromotionPlan({ items, className }) {
  const rows = React.useMemo(() => promotionsIn(items).filter((g) => g.canReach), [items])
  if (!rows.length) {
    /* Not a shrug and not an apology. Nothing being one set away is the normal
       state early on, and the sentence says what would change it rather than
       what is missing. */
    return (
      <p className={cn("text-muted-foreground text-xs", className)} data-testid="promotion-plan" data-n="0">
        No skill in today's set is one set away from Mastered yet — a skill has to reach Proficient first, on questions she met on an earlier day.
      </p>
    )
  }
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} data-testid="promotion-plan" data-n={rows.length}>
      <span className="text-muted-foreground text-xs">
        <ArrowUp className="mr-1 inline size-3" />
        {rows.length === 1 ? "One skill is" : `${rows.length} skills are`} one set from Mastered:
      </span>
      {rows.map((g) => (
        <Badge key={g.sub + g.sk} variant="outline" className="font-normal" data-testid="promotion-row" data-sk={g.sk} data-needs={g.needs}>
          {g.sk} <span className="text-muted-foreground ml-1">{g.needs} more right</span>
        </Badge>
      ))}
    </div>
  )
}

/** After the set: what moved, and what the ones that did not move still need.
 *
 *  `before` is the snapshot taken while the set was built, because the answers
 *  have been recorded by the time this renders and the engine only ever reports
 *  now. Comparing now against a snapshot is the only way to say "moved" without
 *  storing anything. */
export function PromotionReport({ before, className }) {
  const rows = (before || []).filter((g) => g.level === "Proficient" && g.needs > 0 && g.eligible > 0)
  if (!rows.length) return null
  const now = rows.map((g) => {
    const L = skillLevel(g.sub, g.sk) || {}
    return { ...g, nowLevel: L.level, nowPromoted: L.promoted || 0, moved: L.level === "Mastered" }
  })
  const moved = now.filter((g) => g.moved)
  return (
    <div className={cn("flex w-full flex-col gap-1.5 text-left", className)} data-testid="promotion-report" data-moved={moved.length}>
      <span className="text-muted-foreground text-center text-xs">
        {moved.length ? `${moved.length === 1 ? "One skill" : `${moved.length} skills`} reached Mastered` : "Where the skills in play got to"}
      </span>
      {now.map((g) => (
        <div
          key={g.sub + g.sk}
          className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm"
          data-testid="promotion-result" data-sk={g.sk} data-moved={g.moved ? "1" : "0"}
        >
          <span className="font-medium">{g.sk}</span>
          {g.moved ? (
            <Badge variant="success" className="font-normal"><Check className="size-3" /> Mastered</Badge>
          ) : (
            /* A number and the next step, never a verdict. "1 of 2" is a count
               of things that happened; it is the same sentence whether she got
               them all wrong or simply met them for the first time today. */
            <span className="text-muted-foreground text-xs tabular-nums">
              {g.nowPromoted} of {PROMOTE_AT} · another mixed set or a mock finishes it
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
