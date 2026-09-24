import * as React from "react"
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Circle, ListChecks, Plus, Printer, Trash2 } from "lucide-react"

import { D, ORDER, SUBJ, currentWeek, setId, setsFor, spanById, spanNow, spanOpen, spans, weekLabel } from "@/lib/content"
import { dayKey, mockNextSteps, rec, reviewQueue, tagTally, weekRecap } from "@/lib/engine"
import { actionsForWeek, reviewsFor } from "@/lib/reviews"
import { ReviewCard } from "@/components/review-card"
import { mixedThisWeek } from "@/pages/mixed"
import { go } from "@/lib/router"
import { HAND, catsByWeek } from "@/lib/quest"
import { W } from "@/lib/world"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { precisionSummary } from "@/pages/precision"
import { essayStatus, essayTime } from "@/pages/essay"
import { mockSummary } from "@/pages/mock"
import { allEvents } from "@/pages/calendar"

/* ---------- date helpers ---------- */
/* Local, not UTC — see dayKey. Here it only feeds `addDays`, which starts from a
 * local midnight, so the two cancelled out west of Greenwich and the bug was
 * invisible; east of it every plan week would have started a day early. */
const iso = (d) => dayKey(d.getTime())
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d) }
function weekRange(wk) { const a = D.starts[wk]; return [a, addDays(a, 6)] }

function monthKey(s) { return s.slice(0, 7) }
function monthLabel(key) { return new Date(key + "-01T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" }) }
function shiftMonth(key, n) { const [y, m] = key.split("-").map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` }
const fmt = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })

/* ---------- checklist state: { [key]: { checked: {id: true}, custom: [{id, text, done}], at } } ---------- */
function listState(key) { return (Store.s.checklists || {})[key] || { checked: {}, custom: [] } }
function setList(key, fn) {
  if (!Store.s.checklists) Store.s.checklists = {}
  Store.setSlice("checklists", key, (cur) => fn({ checked: {}, custom: [], ...cur }))
}

/* ---------- auto items ---------- */
/** Everything the plan expects in week `wk`, with live done-state. */
export function weekItems(wk) {
  const items = []
  const [a, b] = weekRange(wk)
  for (const s of ORDER) {
    if (s === "vr" && D.precision && D.precision[wk]) {
      const ps = precisionSummary(wk)
      items.push({ id: `prec:${wk}`, group: SUBJ.vr.name, tag: SUBJ.vr.short, short: "Precision review", label: "Session 1 · Precision review — 20 words in your own words", sub: "20–25 min", done: ps.submitted, path: `/precision/${wk}`, auto: true })
      /* Words with vocabulary evidence on them — from the quiz or from the wood,
       * which write the same thing on purpose, so either one answers for both. */
      const wordList = D.precision[wk].words || []
      const called = wordList.filter((e) => { const r = rec("w:" + e.word); return r && (r.hist || []).some((h) => h.ctx === "vocab") }).length
      items.push({ id: `quiz:${wk}`, group: SUBJ.vr.name, tag: SUBJ.vr.short, short: "Word quiz", label: "Word quiz — the same 20 words as ISEE synonym questions", sub: "a day after Session 1", done: called > 0, path: `/precision/${wk}/quiz`, auto: true })
      /* The Wordwood, once the week has actually given her cats to call. It is
       * `auto: false` on purpose: it produces exactly the same vocabulary
       * evidence as the quiz, so making it a sixteenth obligation would be
       * charging her twice for one piece of work — and a game she is required
       * to play stops being one. It is here so she can FIND it, which was the
       * whole problem: nothing in the weekly plan pointed at it.
       *
       * It still has to show that she PLAYED it. This row used to read the same
       * "20 met so far" before and after a walk, with a circle only she could
       * tick, so five gates left no mark anywhere on the page — which is exactly
       * what being told the wood was not tracking her progress looks like. */
      const catsHere = (catsByWeek()[wk] || { met: 0 }).met
      if (catsHere >= HAND) items.push({ id: `wood:${wk}`, group: SUBJ.vr.name, tag: SUBJ.vr.short, short: W.woodTitle, label: `${W.woodTitle} — call this week's ${W.cats} by name`, sub: `${called} of ${wordList.length} called · ${catsHere} met · counts as vocabulary practice either way`, done: called > 0, path: `/quest/${wk}`, auto: false })
    }
    setsFor(s, wk).forEach((set, n) => {
      const r = Store.s.results[setId(s, wk, n)]
      /* `tags` and not a longer `sub`: the compact list renders `sub` as a
         right-hand figure and 6/9 has to stay 6/9 there. */
      items.push({ id: `set:${s}:${wk}:${n}`, group: SUBJ[s].name, tag: SUBJ[s].short, short: `Set ${n + 1}`, label: `Set ${n + 1} — ${set.length} questions`, sub: r ? `${r.right}/${r.n}` : "one sitting, no notes", tags: r && (r.wrong || []).length ? tagTally(r.wrong) : null, done: !!r, path: `/run/${s}/${wk}/${n}`, auto: true })
    })
  }
  if (D.essay && D.essay.weeks[wk]) {
    const st = essayStatus(wk), t = essayTime(wk)
    items.push({ id: `essay:${wk}`, group: "Essay", tag: "Essay", short: "Weekly essay", label: `Weekly essay — ${D.essay.weeks[wk].focus}`, sub: t.total != null ? `${t.total} min logged` : "5 plan · 20 draft · 5 revise", done: st === "complete", path: `/essay/${wk}`, auto: true })
  }
  const q = reviewQueue(), due = q.due.length
  items.push({ id: `review:${wk}`, group: "Review", tag: "Review", short: due ? `Review ${due} due` : "Review pile", label: due ? `Clear the review pile — ${due} due now` : q.scheduled.length ? `Review pile clear — ${q.scheduled.length} scheduled for later` : "Review pile is empty", sub: "due review comes before new work", done: due === 0, path: "/review", auto: true })
  if (wk !== "W1") items.push({ id: `mixed:${wk}`, group: "Mixed practice", tag: "Mixed", short: "Mixed set", label: "One mixed set — 12 questions across all four subjects", sub: "promotes Proficient skills to Mastered", done: mixedThisWeek([a, b]), path: "/mixed", auto: true })
  items.push(...mockRows(a, b, wk))
  // Follow-ups a weekly or monthly digest asked for. Not `auto`, so they never move the
  // plan's own progress — they are extra work someone chose, ticked by hand.
  for (const x of actionsForWeek(wk)) items.push({ id: x.id, group: "Follow-up", tag: "Follow-up", label: x.text, sub: `from ${x.from}`, done: null, path: x.path, auto: false })
  items.push(...eventRows(a, b))
  return items
}

/** Everything a span expects of her, whichever kind of span it is.
 *
 *  A between-week has no sets, no precision session and no essay — it is a week
 *  for sitting a paper and working through what it found. So it carries what it
 *  actually has: the mock, the mock's follow-ups, the review pile, and whatever
 *  the calendar says falls in it. Nothing is invented to pad it out, and the
 *  plan's own percentage counts only what is really there. */
export function spanItems(span) {
  if (!span) return []
  if (span.kind === "week") return weekItems(span.id)
  const items = []
  const q = reviewQueue(), due = q.due.length
  items.push({ id: `review:${span.id}`, group: "Review", tag: "Review", short: due ? `Review ${due} due` : "Review pile", label: due ? `Clear the review pile — ${due} due now` : q.scheduled.length ? `Review pile clear — ${q.scheduled.length} scheduled for later` : "Review pile is empty", sub: "due review comes before new work", done: due === 0, path: "/review", auto: true })
  items.push(...mockRows(span.a, span.b, span.id))
  items.push(...eventRows(span.a, span.b))
  return items
}

/* The rows a span has because of its DATES, not its place in the plan: the mock
 * that starts inside it, that mock's follow-ups, and anything on the calendar.
 * Lifted out of weekItems whole so the plan's own between-weeks can show the
 * same rows without a second copy of the rules to drift away from it. */
function mockRows(a, b, wk) {
  const items = []
  for (const m of D.mocks) {
    if (m.start >= a && m.start <= b) {
      const sm = mockSummary(m.id)
      items.push({ id: `mock:${m.id}`, group: "Mock exam", tag: "Mock", short: m.name, label: `${m.name} — ${m.blurb}`, sub: sm.complete ? `${sm.right}/${sm.n} raw` : `${sm.done}/${sm.total} sections`, done: sm.complete, path: `/mock/${m.id}`, auto: true })
    }
    // follow-up steps in the week of the mock and the week after
    const fin = (Store.s.mocks[m.id] || {}).finishedAt
    // `finishedAt` is an instant, and the week it is compared against is a pair of
    // local calendar dates — so the day has to be read locally too. Slicing the ISO
    // string took the UTC date, which from about five in the afternoon on the west
    // coast is already tomorrow: a mock finished on a Sunday evening landed on
    // "Monday", fell outside the week she had just sat it in, and took its
    // follow-up rows with it. Same mistake as the reading day, same fix.
    /* The upper edge is the span's last day, except on the span the checklist
       actually opens on, where it is today.

       This used to say `currentWeek()`, and it was covering two different holes
       with one patch. One of them is now filled properly: the week between W3
       and W4 is a span of its own, the plan names it, and a mock finished in it
       is inside its own dates and needs no help. Keeping the old test there
       would have listed those follow-ups twice — once on the span she is in, and
       again on the W3 she is not.

       The other hole is still open and still needs this. Mock 3 starts the day
       after W8 ends, and the plan names no week for it, so once the last week is
       over there is no span left to put anything in. `spanOpen()` falls back to
       the last thing that began, and that span absorbs the days past its own end
       as far as today — which is how a paper sat on the 25th of November has its
       follow-ups somewhere a person can find them, rather than nowhere at all.
       Only that span absorbs, so a finished week stays a record of itself. */
    const hi = wk === spanOpen().id ? (dayKey(new Date()) > b ? dayKey(new Date()) : b) : b
    if (fin) { const f = dayKey(fin); if (f >= addDays(a, -7) && f <= hi) mockNextSteps(m.id).filter((x) => x.kind !== "tag").forEach((x, i) => items.push({ id: `next:${m.id}:${i}`, group: "Mock follow-up", tag: "Mock", label: x.text, sub: `from ${m.name}`, done: null, path: x.path, auto: false })) }
  }
  return items
}
function eventRows(a, b) {
  const items = []
  for (const e of allEvents()) {
    if (e.kind === "week" || e.kind === "mock" || e.kind === "season") continue
    if (e.date >= a && e.date <= b) items.push({ id: `ev:${e.id}`, group: "Calendar", tag: "Date", label: `${fmt(e.date)} · ${e.title}`, sub: e.detail || "", done: null, path: e.path || "/calendar", auto: false })
  }
  return items
}
/** Follow-ups for this week she has not ticked yet — for the dashboard. */
export function followUpsLeft(wk) {
  const st = listState(wk)
  return actionsForWeek(wk).filter((x) => !st.checked[x.id])
}

/** How much of this week is still outstanding. */
export function weekLeft(wk = spanOpen().id) {
  const auto = spanItems(spanById(wk) || { id: wk, kind: "week" }).filter((x) => x.auto)
  const left = auto.filter((x) => !x.done)
  return { left: left.length, total: auto.length, done: auto.length - left.length, items: left }
}
/** The next thing to do, in the order the plan expects it. Due review comes before
 *  new work; after that it is this week's own list, top to bottom; when the week is
 *  clear it points at the first set of the next week. */
export function nextUp() {
  /* The span she is in, which in a between-week is the mock and what comes out
     of it — not the last plan week, whose list she finished days ago. */
  const cur = spanOpen().id
  const q = reviewQueue()
  if (q.due.length) return { label: `Review ${q.due.length} due`, note: "due work comes before new work", path: "/review", kind: "review" }
  const left = weekLeft(cur).items.filter((x) => x.path)
  if (left.length) { const it = left[0]; return { label: `${it.tag} · ${it.short || it.label}`, note: it.sub || "", path: it.path, kind: "week", wk: cur } }
  const i = D.weeks.findIndex((w) => w.w === cur)   // -1 in a between-week, so "ahead" starts at W1 and finds the first unfinished week
  for (const w of D.weeks.slice(i + 1)) {
    const nx = weekLeft(w.w).items.filter((x) => x.path)[0]
    if (nx) return { label: `${nx.tag} · ${nx.short || nx.label}`, note: `${w.w} — ahead of the plan`, path: nx.path, kind: "ahead", wk: w.w }
  }
  return null
}

/** Parent to-dos for a month that have not been ticked yet. */
export function monthTodosLeft(key) {
  const st = listState(key)
  return ((D.calendar.monthly || {})[key] || []).filter((t) => !st.checked[`todo:${key}:${t.id}`]).length
}
export const thisMonthKey = () => monthKey(iso(new Date()))

/** Month view: the weeks that fall in the month, mocks, calendar events and the parent to-dos. */
export function monthItems(key) {
  const items = []
  for (const w of D.weeks) {
    const [a, b] = weekRange(w.w)
    if (monthKey(a) !== key && monthKey(b) !== key) continue
    const wi = weekItems(w.w).filter((x) => x.auto)
    const done = wi.filter((x) => x.done).length
    items.push({ id: `wk:${w.w}`, group: "Plan weeks", label: `${w.w} · ${w.label}`, sub: `${done} of ${wi.length} tasks done`, done: wi.length > 0 && done === wi.length, path: `/checklist/${w.w}`, auto: true, pct: wi.length ? done / wi.length : 0 })
  }
  for (const m of D.mocks) if (monthKey(m.start) === key) {
    const sm = mockSummary(m.id)
    items.push({ id: `mock:${m.id}`, group: "Mock exams", label: `${m.name} — ${m.label}`, sub: sm.complete ? `${sm.right}/${sm.n} raw` : m.blurb, done: sm.complete, path: `/mock/${m.id}`, auto: true })
  }
  for (const e of allEvents()) {
    if (e.kind === "week" || e.kind === "mock") continue
    if (monthKey(e.date) === key || (e.end && e.date <= key + "-31" && e.end >= key + "-01" && e.kind === "season")) items.push({ id: `ev:${e.id}`, group: "Dates", label: `${fmt(e.date)}${e.end ? " → " + fmt(e.end) : ""} · ${e.title}`, sub: e.detail || "", done: null, path: e.path || "/calendar", auto: false })
  }
  for (const t of ((D.calendar.monthly || {})[key] || [])) items.push({ id: `todo:${key}:${t.id}`, group: "Parent to-dos", label: t.text, sub: t.why || "", done: null, path: t.path || null, auto: false })
  return items
}

/* ---------- UI ---------- */

/** What the week actually held, counted from her own record.
 *
 *  This sits directly above the written digest on purpose. The two are halves of
 *  one thing: everything here the browser already knows and can show the instant
 *  the page opens, and everything in the digest below needed somebody to read
 *  the week and say what it meant. Sending numbers by email and waiting for an
 *  import tap was asking a person to ferry something across a gap that was never
 *  there. */
function Stat({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      {sub ? <span className="text-muted-foreground text-xs">{sub}</span> : null}
    </div>
  )
}
export function WeekRecap({ span, here, all, idx }) {
  useStore()
  const wk = span.id
  const isWeek = span.kind === "week"
  const r = isWeek ? weekRecap(wk) : null
  const [a, b] = [span.a, span.b]
  const auto = spanItems(span).filter((x) => x.auto)
  const planDone = auto.filter((x) => x.done).length
  const planPct = auto.length ? Math.round((planDone / auto.length) * 100) : 0
  const started = isWeek ? r && r.start <= iso(new Date()) : span.a <= iso(new Date())
  const nothing = isWeek && started && !r.sets.done && !r.reviewed && !r.vocab && !r.words.written && !r.essay.started && !r.reading
  const weekIdx = isWeek ? D.weeks.findIndex((w) => w.w === wk) : -1
  /* A week she has finished, that she is still in. The plan's weeks are seven
     days whether or not the work takes seven days, so a paper sat on the Sunday
     leaves six days of a page that says 100% and nothing else — every task
     struck through, no sign of what happens next, and the arrow to find it is a
     chevron the size of a full stop. Saying it is done is not enough on its own;
     the page has to hand her the next thing. */
  const nextSpan = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null
  const clear = auto.length > 0 && planDone === auto.length && here && wk === here.id
  return (
    <Card className="gap-4" data-testid="week-recap" data-span={wk} data-kind={span.kind} data-a={span.a} data-b={span.b}>
      <CardHeader>
        <div className="flex items-center gap-2 print:hidden">
          <Button size="icon-sm" variant="ghost" disabled={idx <= 0} onClick={() => go(`/checklist/${all[idx - 1].id}`)} aria-label="Previous week"><ChevronLeft /></Button>
          <Button size="icon-sm" variant="ghost" disabled={idx >= all.length - 1} onClick={() => go(`/checklist/${all[idx + 1].id}`)} aria-label="Next week"><ChevronRight /></Button>
          {here && wk !== here.id && <Button size="sm" variant="ghost" onClick={() => go(`/checklist/${here.id}`)} data-testid="back-to-this-week">Back to this week</Button>}
        </div>
        <CardTitle className="text-xl">{isWeek ? `${wk} · ${weekLabel(wk)}` : span.title} {here && wk === here.id && <Badge data-testid="span-now">This week</Badge>}</CardTitle>
        {/* What the world calls a plan week. world.md §5: the eight weeks are
            eight Reaches, each quiet until she works in it, and none locked
            behind the last. The number is the same number — Reach 3 is W3 — so
            this names the week rather than competing with it, which is the
            difference between a world noun and the second name for one idea
            that §7 records as a mistake. It rides on the line that was already
            here: this header is a two-column grid with the percentage pinned to
            the right of it, and one more child of its own does not go under the
            title, it goes into the empty column beside it. */}
        {/* A between-week is not Reach N of 8 — it is not one of the eight, and
            numbering it as one would push every week after it along by one. It
            says what it is and when it is, which is all it has to say. */}
        <CardDescription>{isWeek ? `${W.reach} ${weekIdx + 1} of ${D.weeks.length} · ` : "The plan's own week between the Reaches · "}{fmt(a)} – {fmt(b)} · {planDone} of {auto.length} plan tasks done</CardDescription>
        <CardAction><span className="text-2xl font-semibold tabular-nums">{planPct}%</span></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Progress value={planPct} className="h-1.5" />
        {clear ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-3" data-testid="span-clear">
            <span className="text-success flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="size-4" /> Everything this week asked for is done.</span>
            {nextSpan ? (
              <Button size="sm" variant="outline" onClick={() => go(`/checklist/${nextSpan.id}`)} data-testid="span-next">
                {/* Named and dated, because "next" on its own is a door with no
                    label — and the date is the answer to "so what do I do now",
                    which on a finished week is usually "nothing until Monday". */}
                {nextSpan.name} starts {fmt(nextSpan.a)} <ChevronRight />
              </Button>
            ) : null}
          </div>
        ) : null}
        {!started ? (
          <p className="text-muted-foreground text-sm">This week has not started yet.</p>
        ) : !isWeek ? (
          /* No sets, no precision session, no essay — so no grid of figures
             about them. A week for sitting a paper is reported as what it is,
             and the rows below are the whole of it. */
          <p className="text-muted-foreground text-sm">
            No new sets this week — it is the week the plan sets aside for {span.title}. The paper, what it turns up and the review pile are below.
          </p>
        ) : nothing ? (
          <p className="text-muted-foreground text-sm">Nothing recorded in this week yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 @md/main:grid-cols-4">
              <Stat label="Sets" value={`${r.sets.done} / ${r.sets.total}`} sub={r.answered ? `${r.right} of ${r.answered} right` : "none finished"} />
              {/* honest numbers: no questions answered means no percentage, not 0% */}
              <Stat label="Accuracy" value={r.pct == null ? "—" : `${r.pct}%`} sub={r.pct == null ? "no answers yet" : "on new set work"} />
              <Stat label="Review" value={r.reviewed || "—"} sub={r.reviewed ? `${r.reviewedOk} right · ${r.dueNow} due now` : `${r.dueNow} due now`} />
              <Stat label="Active days" value={r.activeDays} sub={`of 7${r.vocab ? ` · ${r.vocab} word calls` : ""}`} />
            </div>
            <div className="flex flex-col gap-2">
              {ORDER.map((s) => {
                const x = r.subs[s]
                if (!x.total) return null
                return (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: SUBJ[s].color }} />
                    <span className="w-24 shrink-0 truncate @md/main:w-48">{SUBJ[s].name}</span>
                    <Progress value={(x.done / x.total) * 100} className="h-1.5 flex-1" />
                    <span className="text-muted-foreground w-24 shrink-0 text-right text-xs tabular-nums">
                      {x.done}/{x.total} sets{x.pct == null ? "" : ` · ${x.pct}%`}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-xs">
              <span>Precision: {r.words.written} of {r.words.total} written{r.words.written ? `, ${r.words.rated} rated` : ""}{r.words.submitted ? " · submitted" : r.words.written ? " · not submitted yet" : ""}</span>
              <span>Essay: {r.essay.done ? "done" : r.essay.started ? "in progress" : "not started"}{r.essay.minutes != null ? ` · ${r.essay.minutes} min logged` : ""}</span>
              <span>Reading: {r.reading ? `${r.reading} session${r.reading === 1 ? "" : "s"}` : "none logged"}</span>
            </div>
          </>
        )}
      </CardContent>
      {/* `weekRecap` is a plan-week summary and answers null for a between-week,
          which has no sets to have slipped on. Guarded on the recap itself, not
          on `started`, because the crash that taught this was a null read. */}
      {isWeek && started && r && (r.slipped.length || r.rushed) ? (
        <CardFooter className="flex-col items-start gap-2">
          {/* One rushed answer is an accident; a week of them is a habit, and
              only a count in one place makes that visible. */}
          {r.rushed ? (
            <span className="text-warning text-xs font-medium" data-testid="recap-rushed">
              {r.rushed} of the {r.answered - r.right} misses came in faster than the question can be read.
            </span>
          ) : null}
          {/* Misses on NEW work only. A miss during review is the pile doing its
              job, and counting it here would read as going backwards. */}
          {r.slipped.length ? <span className="text-muted-foreground text-xs">What slipped on new work this week</span> : null}
          <div className="flex flex-wrap gap-1.5" data-testid="recap-slipped">
            {r.slipped.slice(0, 8).map((x) => (
              <Badge key={x.sub + x.sk} variant="outline" className="font-normal">
                <span className="inline-block size-2 rounded-full" style={{ background: SUBJ[x.sub].color }} /> {x.sk}{x.n > 1 ? ` \u00d7${x.n}` : ""}
              </Badge>
            ))}
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function isDone(item, listKey) { return item.done == null ? !!listState(listKey).checked[item.id] : item.done }

function Row({ item, listKey, compact, testId = "ck-item" }) {
  const manual = item.done == null
  const done = isDone(item, listKey)
  function toggle() { if (!manual) return; setList(listKey, (cur) => ({ ...cur, checked: { ...cur.checked, [item.id]: !cur.checked[item.id] } })) }
  return (
    <li className={cn("flex items-start gap-3 px-3", compact ? "py-2" : "py-2.5", done && "opacity-70")} data-testid={testId} data-done={done ? "1" : "0"} data-auto={item.auto ? "1" : "0"}>
      <button type="button" onClick={toggle} disabled={!manual} aria-label={done ? "Done" : "Not done"} className={cn("mt-0.5 shrink-0 rounded-full", manual ? "cursor-pointer" : "cursor-default")}>
        {done ? <CheckCircle2 className="text-success size-5" /> : <Circle className="text-muted-foreground size-5" />}
      </button>
      {compact && item.tag ? <span className="text-muted-foreground mt-0.5 w-20 shrink-0 truncate text-xs">{item.tag}</span> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {item.path ? (
          <button type="button" className={cn("text-left text-sm font-medium hover:underline", done && "line-through decoration-muted-foreground/60")} onClick={() => go(item.path)}>{item.label}</button>
        ) : (
          <span className={cn("text-sm font-medium", done && "line-through decoration-muted-foreground/60")}>{item.label}</span>
        )}
        {/* The score and the reasons share one wrapping line. They are one
            sentence about one set — 6/9, and here is what the three were — and
            stacked on two lines the reasons read as a separate thing that had
            happened to the row rather than as the rest of its result.

            Why the misses went wrong belongs on the row that reports them at
            all. She taps the reason on the score card already; until now the
            only way to read one back was to reopen the set and go through the
            questions one at a time, so in practice nobody ever did. Three
            misread words and three methods nobody has taught her are the same
            6/9 and a completely different week's work. */}
        {(item.sub || item.tags) && !compact ? (
          <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {item.sub ? <span>{item.sub}</span> : null}
            {item.tags ? (
              <span className="flex flex-wrap items-center gap-1" data-testid="set-tags" data-n={item.tags.n}>
                {item.tags.rows.map((t) => (
                  <Badge key={t.id} variant="outline" className="font-normal" data-testid="set-tag" data-cause={t.id} data-count={t.n}>
                    <span className="tabular-nums">{t.n}</span> {t.label.toLowerCase()}
                  </Badge>
                ))}
                {/* Last, and quieter than the reasons, because not having said
                    yet is not a kind of mistake. */}
                {item.tags.untagged ? (
                  <span className="text-muted-foreground/70 tabular-nums" data-testid="set-untagged" data-n={item.tags.untagged}>
                    {item.tags.untagged} not said yet
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        ) : null}
        {item.pct != null ? <Progress value={item.pct * 100} className="mt-1 h-1" /> : null}
      </div>
      {compact && item.sub && done ? <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{item.sub}</span> : null}
      {!manual && !done && !compact && item.auto ? <Badge variant="outline" className="text-muted-foreground shrink-0">auto</Badge> : null}
    </li>
  )
}

/** Dashboard card: this week's list with what's left on top, finished work folded away,
 *  a quick-add box and a pointer to the month's parent to-dos. */
export function WeekChecklistCard() {
  useStore()
  const span = spanOpen()
  const cur = span.id
  const items = spanItems(span)
  const auto = items.filter((x) => x.auto), done = auto.filter((x) => x.done).length
  const open = items.filter((it) => !isDone(it, cur)), finished = items.filter((it) => isDone(it, cur))
  const st = listState(cur)
  const [showDone, setShowDone] = React.useState(false)
  const [text, setText] = React.useState("")
  const mk = thisMonthKey(), todosLeft = monthTodosLeft(mk)
  function add() {
    const t = text.trim(); if (!t) return
    setList(cur, (c) => ({ ...c, custom: [...c.custom, { id: "c" + Date.now(), text: t, done: false }] }))
    setText("")
  }
  function toggleCustom(id) { setList(cur, (c) => ({ ...c, custom: c.custom.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) })) }
  const customOpen = st.custom.filter((c) => !c.done), customDone = st.custom.filter((c) => c.done)
  const allClear = !open.length && !customOpen.length
  return (
    <Card className="gap-4" data-testid="home-checklist">
      <CardHeader>
        <CardDescription className="flex items-center gap-2"><ListChecks className="size-4" /> This week's checklist</CardDescription>
        <CardTitle className="text-xl" data-testid="home-ck-heading">{span.heading}</CardTitle>
        <CardDescription className="tabular-nums">{done} of {auto.length} plan tasks done{open.length ? ` · ${open.length} left` : ""}</CardDescription>
        <CardAction><Button size="sm" variant="ghost" onClick={() => go(`/checklist/${cur}`)}>Full checklist <ChevronRight /></Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={auto.length ? (done / auto.length) * 100 : 0} className="h-1.5" />
        {allClear ? (
          <div className="text-success flex items-center gap-2 rounded-md border px-3 py-3 text-sm font-medium"><CheckCircle2 className="size-4" /> Everything on this week's list is done.</div>
        ) : (
          <ul className="divide-y rounded-md border">
            {open.map((it) => <Row key={it.id} item={it} listKey={cur} compact />)}
            {customOpen.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2" data-testid="home-custom">
                <button type="button" onClick={() => toggleCustom(c.id)} aria-label="Not done"><Circle className="text-muted-foreground size-5" /></button>
                <span className="text-muted-foreground w-20 shrink-0 text-xs">Yours</span>
                <span className="text-sm font-medium">{c.text}</span>
              </li>
            ))}
          </ul>
        )}
        {finished.length + customDone.length ? (
          <div className="flex flex-col gap-2">
            <button type="button" className="text-muted-foreground self-start text-xs hover:underline" onClick={() => setShowDone((v) => !v)} data-testid="home-toggle-done">
              {showDone ? "Hide" : "Show"} {finished.length + customDone.length} done
            </button>
            {showDone ? (
              <ul className="divide-y rounded-md border">
                {finished.map((it) => <Row key={it.id} item={it} listKey={cur} compact testId="home-done" />)}
                {customDone.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2 opacity-70">
                    <button type="button" onClick={() => toggleCustom(c.id)} aria-label="Done"><CheckCircle2 className="text-success size-5" /></button>
                    <span className="text-muted-foreground w-20 shrink-0 text-xs">Yours</span>
                    <span className="text-muted-foreground text-sm line-through">{c.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add() }} placeholder="Add something for this week" className="h-8" data-testid="home-ck-add" />
          <Button size="sm" variant="outline" onClick={add}><Plus /> Add</Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline" onClick={() => go(`/checklist/month/${mk}`)}>
          <CalendarDays /> {monthLabel(mk)} {todosLeft ? <Badge variant="warning" className="ml-1 tabular-nums">{todosLeft} parent to-do{todosLeft === 1 ? "" : "s"} left</Badge> : <span className="text-muted-foreground font-normal">· parent to-dos ticked</span>}
        </Button>
      </CardFooter>
    </Card>
  )
}

function CustomItems({ listKey }) {
  useStore()
  const st = listState(listKey)
  const [text, setText] = React.useState("")
  function add() {
    const t = text.trim(); if (!t) return
    setList(listKey, (cur) => ({ ...cur, custom: [...cur.custom, { id: "c" + Date.now(), text: t, done: false }] }))
    setText("")
  }
  function toggle(id) { setList(listKey, (cur) => ({ ...cur, custom: cur.custom.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) })) }
  function remove(id) { setList(listKey, (cur) => ({ ...cur, custom: cur.custom.filter((c) => c.id !== id) })) }
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardTitle>Your own items</CardTitle>
        <CardDescription>Anything else for this period — a tutor session, a book to finish, a reward. Saved and synced.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5">
        {st.custom.length ? (
          <ul className="divide-y rounded-md border">
            {st.custom.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2" data-testid="ck-custom">
                <button type="button" onClick={() => toggle(c.id)} aria-label={c.done ? "Done" : "Not done"}>{c.done ? <CheckCircle2 className="text-success size-5" /> : <Circle className="text-muted-foreground size-5" />}</button>
                <span className={cn("flex-1 text-sm", c.done && "text-muted-foreground line-through")}>{c.text}</span>
                <Button size="icon-sm" variant="ghost" onClick={() => remove(c.id)} aria-label="Remove"><Trash2 /></Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add() }} placeholder="Add an item and press Enter" data-testid="ck-add" />
          <Button variant="outline" onClick={add}><Plus /> Add</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Grouped({ items, listKey }) {
  const groups = []
  for (const it of items) { let g = groups.find((x) => x.name === it.group); if (!g) { g = { name: it.group, items: [] }; groups.push(g) } g.items.push(it) }
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <Card key={g.name} className="gap-2 py-4">
          <CardHeader className="px-5"><CardTitle className="text-base">{g.name}</CardTitle></CardHeader>
          <CardContent className="px-2"><ul className="divide-y">{g.items.map((it) => <Row key={it.id} item={it} listKey={listKey} />)}</ul></CardContent>
        </Card>
      ))}
    </div>
  )
}

export function Checklist({ wk: wkParam, month: monthParam }) {
  useStore()
  /* Where she is, not the last plan week that happens to have started. For six
     days out of every seven in a between-week those were the same answer; on the
     seventh — the one she sits the baseline mock in — they were not, and it was
     the page that is supposed to say what to do today that got it wrong. */
  const all = spans()
  const here = spanNow()
  const span = (wkParam && spanById(wkParam)) || spanOpen()
  const wk = span.id
  const idx = all.findIndex((x) => x.id === wk)
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : monthKey(iso(new Date()))
  const tab = monthParam ? "month" : "week"

  const wItems = spanItems(span)
  const mItems = monthItems(month)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3 print:hidden">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><ListChecks className="size-4" /> Checklist</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Everything the plan expects, ticked off as it happens</CardTitle>
          <CardDescription>Sets, the precision review, the essay, the review pile and mocks tick themselves when finished. Dates and parent to-dos are ticked by hand. Add your own items to either list.</CardDescription>
          <CardAction><Button variant="outline" size="sm" onClick={() => window.print()}><Printer /> Print</Button></CardAction>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={(v) => go(v === "week" ? `/checklist/${wk}` : `/checklist/month/${month}`)}>
        <TabsList className="print:hidden">
          <TabsTrigger value="week">This week</TabsTrigger>
          <TabsTrigger value="month">This month</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="flex flex-col gap-4">
          {/* One card, not two. The plan's percentage and the week's own numbers
              were separate cards that both opened "W2 · Sep 7 – 13", which read
              as the page saying the same thing twice. */}
          <WeekRecap span={span} here={here} all={all} idx={idx} />
          {reviewsFor({ kind: "week", wk }).map((r) => <ReviewCard key={r.id} r={r} />)}
          <Grouped items={wItems} listKey={wk} />
          <CustomItems listKey={wk} />
        </TabsContent>

        <TabsContent value="month" className="flex flex-col gap-4">
          {reviewsFor({ kind: "month", m: month }).map((r) => <ReviewCard key={r.id} r={r} />)}
          <Card className="gap-3 py-5">
            <CardHeader className="px-5">
              <div className="flex items-center gap-2 print:hidden">
                <Button size="icon-sm" variant="ghost" onClick={() => go(`/checklist/month/${shiftMonth(month, -1)}`)} aria-label="Previous month"><ChevronLeft /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => go(`/checklist/month/${shiftMonth(month, 1)}`)} aria-label="Next month"><ChevronRight /></Button>
                {month !== monthKey(iso(new Date())) && <Button size="sm" variant="ghost" onClick={() => go(`/checklist/month/${monthKey(iso(new Date()))}`)}>Back to this month</Button>}
              </div>
              <CardTitle className="text-xl flex items-center gap-2"><CalendarDays className="size-5" /> {monthLabel(month)}</CardTitle>
              <CardDescription>{mItems.length ? `${mItems.filter((x) => x.auto).filter((x) => x.done).length} of ${mItems.filter((x) => x.auto).length} plan items done · ${mItems.filter((x) => !x.auto).length} dates and to-dos` : "Nothing scheduled this month."}</CardDescription>
            </CardHeader>
          </Card>
          {mItems.length ? <Grouped items={mItems} listKey={month} /> : null}
          <CustomItems listKey={month} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
