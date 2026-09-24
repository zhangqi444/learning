import * as React from "react"
import { Play, Shuffle } from "lucide-react"

import { ORDER, SUBJ, fmtDate } from "@/lib/content"
import { buildMixedSet, dayKey, mixedResults, promotionsIn } from "@/lib/engine"
import { go } from "@/lib/router"
import { Store, useStore } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PromotionPlan } from "@/components/promotion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zhangqi444/ui/ui/table"
import { Runner } from "@/pages/runner"

export function mixedThisWeek(range) {
  return mixedResults().some((r) => { const k = dayKey(r.at); return k >= range[0] && k <= range[1] })
}

export function Mixed() {
  useStore()
  const rows = mixedResults()
  const preview = React.useMemo(() => buildMixedSet(12), [rows.length])
  // A mixed set she started and put down. The button says so rather than
  // offering to start the one she is already halfway through.
  const part = Store.draftAnswered("mixed")
  const partOf = (Store.draft("mixed") || {}).n || 12
  const counts = {}
  for (const q of preview) { const s = q.id.split("-")[0].toLowerCase(); counts[s] = (counts[s] || 0) + 1 }
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Shuffle className="size-4" /> Mixed practice</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Twelve questions, all four subjects, shuffled</CardTitle>
          <CardDescription>The real test never tells you which skill a question is testing. A mixed set pulls from the weeks already reached — skills sitting at Proficient first, then weak ones. This is where Proficient becomes Mastered, and the bar is two: a skill needs two of its questions right in a mixed set or a mock, each on a later day than the day she first met that question. One a week from Week 2.</CardDescription>
          <CardAction>
            <Button onClick={() => go("/mixed/run")} disabled={preview.length < 4} data-testid="mixed-start">
              <Play /> {part ? `Carry on · ${part} of ${partOf} answered` : "Start a mixed set"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {ORDER.map((s) => <Badge key={s} variant="outline" className="font-normal"><span className="mr-1 inline-block size-2 rounded-full" style={{ background: SUBJ[s].color }} />{SUBJ[s].short} · {counts[s] || 0}</Badge>)}
            {preview.length < 12 ? <span className="text-muted-foreground text-xs">Only {preview.length} questions are eligible today — more open up as weeks are finished.</span> : null}
          </div>
          {/* The terms, before she starts, naming the skills today's set can
              actually lift. The paragraph above has always said what the rule
              is; this says what it means for these twelve questions, which is
              the difference between a rule she is scored by and a rule she can
              use. */}
          <PromotionPlan items={preview} />
        </CardContent>
      </Card>

      {rows.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Mixed sets so far</CardTitle>
            <CardDescription>Most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>When</TableHead><TableHead className="text-right">Score</TableHead>{ORDER.map((s) => <TableHead key={s} className="hidden text-right @md/main:table-cell">{SUBJ[s].short}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{fmtDate(r.at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.right}/{r.n}</TableCell>
                    {ORDER.map((s) => <TableCell key={s} className="text-muted-foreground hidden text-right tabular-nums @md/main:table-cell">{r.bySub && r.bySub[s] ? `${r.bySub[s].right}/${r.bySub[s].n}` : "—"}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function MixedRun() {
  const items = React.useMemo(() => buildMixedSet(12), [])
  /* Taken before a single answer is recorded, because the engine only ever
     reports now: by the time the score card renders, "was it Proficient?" has
     already become "is it Mastered?". The snapshot is what lets the card say
     something moved without storing anything to say it with. */
  const before = React.useMemo(() => promotionsIn(items), [items])
  if (items.length < 4) return <Mixed />
  const key = "mx:" + new Date().toISOString().slice(0, 16)
  return (
    <Runner
      key={key}
      items={items}
      custom
      ctx="mixed"
      /* One key for "the mixed set in progress", not one per minute like the
         record it writes: a set put down is picked up again, and a resume that
         needed her to come back inside the same minute would be no resume. */
      resume="mixed"
      title="Mixed set · all subjects"
      exitPath="/mixed"
      exitLabel="Back to mixed practice"
      promotion={before}
      onFinish={(sum) => Store.setSlice("mixed", key, () => ({ ...sum }))}
    />
  )
}
