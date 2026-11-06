import * as React from "react"
import { ArrowLeft } from "lucide-react"

import { ORDER, SUBJ } from "@/lib/content"
import { go, routeQuery } from "@/lib/router"
import { useStore } from "@/lib/store"
import { doorRedo, redoItems } from "@/lib/questions"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { QuestionBrowser } from "@/components/question-browser"
import { Runner } from "@/pages/runner"

/** Every question in all four subjects, narrowed any way at once — the one place to check the
 *  wrong ones (the owner, 4 November 2026: "I need a centralized or easier way to double check
 *  the wrong questions"). The Score page and each subject page open it with their subject chosen
 *  (`?sub=ma`); there is no second list on the subject page (the owner, 6 November 2026). */
export function QuestionsPage() {
  useStore()
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6" data-testid="questions-page">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription>All four subjects · every question</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Questions</CardTitle>
          <CardDescription>
            Starts on the ones she has missed. Narrow by subject, skill, week or paper; each question keeps its answer behind its own tap. Redo asks the wrong ones again as themselves, the ones not yet redone right first; the review then asks others like them.
          </CardDescription>
          <CardDescription className="text-xs">
            Her answers count as they do everywhere else: sets, reviews, mixed sets, mocks and practice, never a corrections pass. A redo is shown on its question and decides whether it still needs one, but moves no level and no review date: she has usually seen its answer by then. Papers sat on paper keep their misses on their own page.
          </CardDescription>
        </CardHeader>
      </Card>
      {/* The card's own padding, the same as the header card above it, so the two line up on both
          sides. */}
      <Card>
        <CardContent>
          <QuestionBrowser />
        </CardContent>
      </Card>
    </div>
  )
}

/** A redo: the questions she got wrong, asked again as themselves. From a question list
 *  (`?sub&sk&wk&sort`, the list's own filters) or from the Review page (`?door=<sub>`, the misses
 *  the next review sitting lets in). Read once on mount, like a review, so finishing — which
 *  takes the right ones off "to redo" — keeps the score screen up. */
export function RedoRun() {
  const q = React.useMemo(() => routeQuery(), [])
  const door = q.door && SUBJ[q.door] ? q.door : null
  const items = React.useMemo(() => (door ? doorRedo(door) : redoItems(q)), [])
  const back = door ? "/review" : q.from || "/questions"
  if (!items.length) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <Card className="items-center py-10 text-center" data-testid="redo-empty">
          <CardHeader className="w-full">
            <CardTitle>Nothing to redo</CardTitle>
            <CardDescription>Every wrong one here has been redone right since it was missed.</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => go(back)}><ArrowLeft /> Back</Button></CardContent>
        </Card>
      </div>
    )
  }
  const sub = door || (q.sub && ORDER.includes(q.sub) ? q.sub : undefined)
  const what = [sub ? SUBJ[sub].name : null, q.sk || null, q.wk || null].filter(Boolean).join(" · ")
  return (
    <Runner items={items} custom ctx="redo" sub={sub} resume={`redo:${door ? "door:" + door : [q.sub || "", q.sk || "", q.wk || ""].join(":")}`}
      title={door ? `${SUBJ[door].name} · Redo before the review` : `Redo${what ? " · " + what : ""}`}
      exitPath={back} exitLabel={door ? "Back to review" : "Back to the list"} />
  )
}
