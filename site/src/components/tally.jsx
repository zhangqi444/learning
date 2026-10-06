import * as React from "react"

import { fmtDate } from "@/lib/content"
import { cn } from "@/lib/utils"
import { Button } from "@zhangqi444/ui/ui/button"

/* How her answers are shown, wherever they are counted: the word bank and a word's page, a
 * subject's skills and a skill's page. lib/tally.js does the counting; this is the drawing, so
 * the same numbers come out in the same shapes on all four. The owner asked for the skills to
 * "follow the vocabulary list" (6 October 2026), and two copies of a row drift.
 *
 * Right is green, because a right answer is earned. Wrong is plain text and never red: red means
 * "due now" on this site, and a count of wrong answers only ever grows — a standing number that
 * looks like an alarm is the thing AGENTS.md's colour rule exists to stop. */

const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`
/** When she last answered, or "—" when she never has (hard rule 4: no data is not zero). */
export const lastSeen = (t) => (t && t.last ? fmtDate(t.last.at) : "—")

/** One number and what it counts. */
export function Stat({ n, label, tone, testid }) {
  return (
    <div className="flex min-w-0 flex-col" data-testid={testid}>
      <span className={cn("text-2xl font-semibold tabular-nums", tone)}>{n}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

/** The numbers at the top of a word's page and a skill's, in this order on both: the questions,
 *  the answers she gave them, right, wrong, and when she last answered one. A page's own numbers
 *  (`extra`) come after them. */
export function TallyStats({ t, questions, extra, testid }) {
  return (
    <div className="grid grid-cols-2 gap-4 @md/main:grid-cols-3 @2xl/main:grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]" data-testid={testid}
      data-questions={t.questions} data-done={t.done} data-right={t.right} data-wrong={t.wrong} data-last={t.last ? t.last.at : ""}>
      <Stat n={t.questions} label={questions} />
      <Stat n={t.done} label="answers she gave" />
      <Stat n={t.right} label="right" tone={t.right ? "text-success" : undefined} />
      <Stat n={t.wrong} label="wrong" />
      <Stat n={lastSeen(t)} label="last answered" tone={t.last ? undefined : "text-muted-foreground"} />
      {extra}
    </div>
  )
}

/** Her answers on one question or a group of them, in one line: "done 3 · 2 right · 1 wrong". */
export function TallyLine({ x, testid, untried = "not tried yet" }) {
  if (!x.done) return <span className="text-muted-foreground" data-testid={testid}>{untried}</span>
  return (
    <span data-testid={testid}>
      done {x.done} · <span className={x.right ? "text-success" : "text-muted-foreground"}>{x.right} right</span> · <span className={x.wrong ? undefined : "text-muted-foreground"}>{x.wrong} wrong</span>
    </span>
  )
}

/** The buttons that narrow a list, each with how many it would show. `count(id)` says how many. */
export function ShowFilter({ shows, show, count, onShow, prefix, className }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} data-testid={prefix + "-shows"}>
      {shows.map((s) => {
        const n = count(s.id)
        return (
          <Button key={s.id} size="sm" variant={show === s.id ? "default" : "outline"} className="h-7" aria-pressed={show === s.id}
            onClick={() => onShow(s.id)} data-testid={`${prefix}-show-${s.id}`} data-n={n}>
            {s.label} <span className="tabular-nums opacity-70">{n}</span>
          </Button>
        )
      })}
    </div>
  )
}

/* One grid for both lists, so a skill's row and a word's row line up the same way. At a wide
 * card each number has its own column; a phone has no room for columns, so the same numbers
 * fold into one line under the name, and anything in the trailing column (a skill's level) stays
 * beside the name at every width. The name's wrapper is `display: contents` once there are
 * columns, which hands its children to the row's grid; below that it is the phone's left column. */
const COLS = "@2xl/main:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5.5rem_3.5rem_3.5rem_3.5rem_4.5rem]"
const COLS_EXTRA = "@2xl/main:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_5.5rem_3.5rem_3.5rem_3.5rem_4.5rem_7rem]"
const NUMS = ["Questions", "Done", "Right", "Wrong", "Last"]

/** The column names over a list of rows. */
export function TallyHead({ first, second, extra }) {
  return (
    <div className={cn("text-muted-foreground hidden gap-x-3 border-b pb-1.5 text-xs font-medium @2xl/main:grid", extra ? COLS_EXTRA : COLS)} data-testid="tally-head">
      <span>{first}</span><span>{second}</span>
      {NUMS.map((h) => <span key={h} className="text-right">{h}</span>)}
      {extra ? <span className="text-right">{extra}</span> : null}
    </div>
  )
}

const num = (n, tone) => <span className={cn("hidden text-right text-sm tabular-nums @2xl/main:block", n ? tone : "text-muted-foreground/60")}>{n}</span>

/** One row: a name (a link, and anything beside it), a description, her answers on its
 *  questions (`t`, from `tally`), and an optional trailing column. `none` is what the row says
 *  when no question asks it; `wide` and `narrow` add to the description and to the phone's line. */
export function TallyRow({ name, desc, t, extra, none = "no question asks it", wide, narrow, testid, data }) {
  return (
    <li className={cn("grid gap-x-3 gap-y-0.5 py-2.5 @2xl/main:items-baseline", extra ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1", extra ? COLS_EXTRA : COLS)}
      data-testid={testid} data-questions={t.questions} data-done={t.done} data-right={t.right} data-wrong={t.wrong} data-last={t.last ? t.last.at : ""} {...(data || {})}>
      <div className="flex min-w-0 flex-col gap-0.5 @2xl/main:contents">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">{name}</span>
        <span className="text-muted-foreground min-w-0 truncate text-xs" title={typeof desc === "string" && desc ? desc : undefined}>{desc}{wide ? <span className="hidden @2xl/main:inline">{wide}</span> : null}</span>
        {/* a phone has no room for columns: the same numbers in one line */}
        <span className="text-xs tabular-nums @2xl/main:hidden">
          {t.questions ? <>{plural(t.questions, "question")} · <TallyLine x={t} /></> : <span className="text-muted-foreground">{none}</span>}
          {t.last ? <span className="text-muted-foreground"> · last {lastSeen(t)}</span> : null}
          {narrow}
        </span>
      </div>
      <span className={cn("hidden text-right text-sm tabular-nums @2xl/main:block", t.questions ? "" : "text-muted-foreground/60")}>{t.questions || "none"}</span>
      {num(t.done, "")}
      {num(t.right, "text-success")}
      {num(t.wrong, "")}
      <span className={cn("hidden text-right text-sm tabular-nums @2xl/main:block", t.last ? "" : "text-muted-foreground/60")}>{lastSeen(t)}</span>
      {extra ? <span className="self-start justify-self-end @2xl/main:self-baseline">{extra}</span> : null}
    </li>
  )
}
