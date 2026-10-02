import * as React from "react"
import { Check, RotateCcw, Tag } from "lucide-react"

import { missProgress, missStage } from "@/lib/engine"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"

/* What happened to a miss after it happened.
 *
 *  A score out of nine says how many went wrong. It does not say whether any of
 *  the nine were dealt with, and dealing with them is the entire point of
 *  keeping them — the mock page has spelled out the loop from the beginning,
 *  "classify each miss, reteach, redo", and then given no way to see it running.
 *
 *  Every step here is read from something that already happened, so nothing
 *  below asks for a tick. What that buys is a number that cannot be gamed and
 *  cannot be forgotten; what it costs is that a lesson gone over at the kitchen
 *  table leaves no trace, which is why the words are careful. "Practised" is
 *  what the site can see. It does not say "not reteached" about anything,
 *  anywhere, because it does not know that and a child reading it would. */

const STEP = {
  classified: { label: "Classified", icon: Tag, hint: "a reason was chosen for this miss" },
  practised: { label: "Practised", icon: RotateCcw, hint: "another question of this skill was tried afterwards" },
  redone: { label: "Right since", icon: Check, hint: "this question has been answered correctly since" },
}
/* The same three steps on a Chinese page read in Chinese (lib/lang.js). The
 * runner passes `zh` for a Chinese sitting in Chinese mode; every ISEE caller
 * passes nothing and reads exactly as before. */
const STEP_ZH = {
  classified: { label: "标了原因", hint: "这道错题选过原因了" },
  practised: { label: "练过了", hint: "后来做过同一类的另一题" },
  redone: { label: "后来做对了", hint: "这道题后来答对过" },
}
const wordsFor = (k, zh) => (zh ? STEP_ZH[k] : STEP[k])

/** One miss, as far as it has got. Nothing is drawn for a miss that has not been
 *  worked yet: an empty row is the truth and it is also the one version of this
 *  a ten-year-old could read as a telling-off. */
export function MissStage({ id, className, zh }) {
  useStore()
  const st = missStage(id)
  if (!st || st.stage === "new") return null
  const Icon = STEP[st.stage].icon
  const w = wordsFor(st.stage, zh)
  return (
    <Badge
      variant={st.redone ? "success" : "outline"}
      className={cn("font-normal", className)}
      title={w.hint}
      data-testid="miss-stage"
      data-qid={id}
      data-stage={st.stage}
    >
      <Icon className="size-3" /> {w.label}
    </Badge>
  )
}

/** A set or a paper's worth of misses, counted by how far each has got.
 *
 *  Written as things done rather than things outstanding. "3 of 4 classified"
 *  and "1 still to classify" are the same arithmetic and not the same sentence,
 *  and only one of them is a list of chores handed to a child the moment she
 *  finishes a paper. */
export function MissProgress({ ids, className, quiet, zh }) {
  useStore()
  const p = missProgress(ids)
  if (!p.n) return null
  /* `quiet` is for the moment a set is finished, where every count is zero
     because none of this could have happened yet — the paper was handed in ten
     seconds ago. A row of zeros there describes those ten seconds and reads as a
     list of things already not done. It appears as soon as any of it has. */
  if (quiet && !p.classified && !p.practised && !p.redone) return null
  return (
    <span className={cn("text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", className)} data-testid="miss-progress" data-n={p.n} data-redone={p.redone} data-practised={p.practised} data-classified={p.classified}>
      <span>{zh ? `${p.n} 道错题` : `${p.n} missed`}</span>
      {Object.entries(STEP).map(([k, s]) => {
        const Icon = s.icon
        const w = wordsFor(k, zh)
        return (
          <span key={k} className="flex items-center gap-1 tabular-nums" title={w.hint}>
            <Icon className="size-3" /> {p[k]} {zh ? w.label : w.label.toLowerCase()}
          </span>
        )
      })}
    </span>
  )
}
