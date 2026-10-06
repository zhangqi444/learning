import * as React from "react"
import { Search } from "lucide-react"

import { D } from "@/lib/content"
import { rec, wordQuestion } from "@/lib/engine"
import { Store, useStore } from "@/lib/store"
import { href } from "@/lib/router"
import { cn } from "@/lib/utils"
import { meaningOf, refResult, vocabIndex, vocabPath, vocabWord, wordResult } from "@/lib/vocab"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Input } from "@zhangqi444/ui/ui/input"
import { QuestionRow, placesOf } from "@/pages/skill"

/* Every word the questions teach or test, each with the questions that cover it and how
 * she has done on them (lib/vocab.js says how a word is read off a question). The owner
 * asked to see, word by word, "if covered, done how many times, right/wrong" — so the
 * numbers are counts of her own answers, and a word no question asks says so. */

// "Tested" first: a word that is only ever a wrong answer ("above", "absorbs") is in a
// question without being taught by it, and 537 of them ahead of the real list buried it.
const SHOWS = [
  { id: "tested", label: "Tested", keep: (v, r) => r.tests > 0 },
  { id: "lists", label: "On her lists", keep: (v) => v.lists.length > 0 },
  { id: "missed", label: "Missed", keep: (v, r) => r.wrong > 0 || r.chose > 0 },
  { id: "untried", label: "Not tried yet", keep: (v, r) => r.tests > 0 && r.done === 0 },
  { id: "choice", label: "Only a wrong answer", keep: (v, r) => r.tests === 0 },
  { id: "all", label: "All", keep: () => true },
]
const COLS = "@2xl/main:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_5.5rem_3.5rem_3.5rem_3.5rem]"
const PAGE = 150
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`

function Answers({ r }) {
  if (!r.tests) return <span className="text-muted-foreground">no question asks it</span>
  if (!r.done) return <span className="text-muted-foreground">not tried yet</span>
  return (
    <span>
      done {r.done} · <span className="text-success">{r.right} right</span> · <span className={r.wrong ? "text-destructive" : "text-muted-foreground"}>{r.wrong} wrong</span>
    </span>
  )
}

const num = (n, tone) => <span className={cn("hidden text-right text-sm tabular-nums @2xl/main:block", n ? tone : "text-muted-foreground/60")}>{n}</span>
function WordRow({ v, r }) {
  return (
    <li className={cn("grid gap-x-3 gap-y-0.5 py-2.5 @2xl/main:items-baseline", COLS)}
      data-testid="vocab-row" data-word={v.key} data-tests={r.tests} data-done={r.done} data-right={r.right} data-wrong={r.wrong}>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <a href={href(vocabPath(v.key))} className="hover:text-primary decoration-muted-foreground/60 font-medium underline decoration-dotted underline-offset-4" data-testid="vocab-link">{v.word}</a>
        {v.lists.map((w) => <Badge key={w} variant="outline" className="text-[11px]">{w} list</Badge>)}
      </span>
      <span className="text-muted-foreground min-w-0 truncate text-xs">
        {meaningOf(v)}
        {r.choices ? <span className="hidden @2xl/main:inline">{meaningOf(v) ? " · " : ""}a wrong answer in {r.choices}</span> : null}
        {r.chose ? <span className="text-destructive hidden @2xl/main:inline"> · chose it {r.chose}×</span> : null}
      </span>
      <span className={cn("hidden text-right text-sm tabular-nums @2xl/main:block", r.tests ? "" : "text-muted-foreground/60")}>{r.tests || "none"}</span>
      {num(r.done, "")}
      {num(r.right, "text-success")}
      {num(r.wrong, "text-destructive")}
      {/* a phone has no room for columns: the same counts in one line */}
      <span className="text-xs tabular-nums @2xl/main:hidden">
        {r.tests ? <>{plural(r.tests, "question")} · </> : null}<Answers r={r} />
        {r.choices ? <span className="text-muted-foreground"> · a wrong answer in {r.choices}</span> : null}
        {r.chose ? <span className="text-destructive"> · chose it {r.chose}×</span> : null}
      </span>
    </li>
  )
}

export function VocabPage() {
  useStore()
  const { list } = vocabIndex()
  const [text, setText] = React.useState("")
  const [show, setShow] = React.useState("tested")
  const [limit, setLimit] = React.useState(PAGE)
  const rows = list.map((v) => ({ v, r: wordResult(v) }))
  const count = (id) => rows.filter(({ v, r }) => SHOWS.find((s) => s.id === id).keep(v, r)).length
  const want = text.toLowerCase().trim()
  const mode = SHOWS.find((s) => s.id === show) || SHOWS[0]
  let shown = rows.filter(({ v, r }) => mode.keep(v, r) && (!want || v.key.includes(want) || meaningOf(v).toLowerCase().includes(want)))
  if (show === "missed") shown = [...shown].sort((a, b) => (b.r.wrong + b.r.chose) - (a.r.wrong + a.r.chose) || a.v.key.localeCompare(b.v.key))
  if (want) shown = [...shown].sort((a, b) => (b.v.key.startsWith(want) - a.v.key.startsWith(want)) || a.v.key.localeCompare(b.v.key))
  const onLists = count("lists"), tested = rows.filter(({ r }) => r.tests).length, answered = rows.filter(({ r }) => r.done).length
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6" data-testid="vocab-page" data-n={rows.length} data-shown={shown.length}>
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription>Verbal Reasoning · vocabulary</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Every word</CardTitle>
          <CardDescription data-testid="vocab-summary">
            {plural(rows.length, "word")} from the questions and her weekly lists: {onLists} on the lists, {tested} tested by at least one question, {rows.length - tested} only ever a wrong answer. She has answered questions on {answered} of them.
          </CardDescription>
          <CardDescription className="text-xs">
            A word counts as tested where a synonym or a reading question asks what it means, where it is the right answer to a sentence completion or the word a phrase completion turns on, and by the word quiz built from her list. Her answers count once each, from sets, reviews, mocks, the word quiz and the Wordwood; a corrections pass, where she has just seen the answer, does not.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input value={text} onChange={(e) => { setText(e.target.value); setLimit(PAGE) }} placeholder="Find a word or a meaning" className="pl-8" data-testid="vocab-search" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SHOWS.map((s) => (
              <Button key={s.id} size="sm" variant={show === s.id ? "default" : "outline"} className="h-7" onClick={() => { setShow(s.id); setLimit(PAGE) }} data-testid={"vocab-show-" + s.id}>
                {s.label} <span className="tabular-nums opacity-70">{count(s.id)}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-5">
          <div className={cn("text-muted-foreground hidden gap-x-3 border-b pb-1.5 text-xs font-medium @2xl/main:grid", COLS)}>
            <span>Word</span><span>Meaning</span><span className="text-right">Questions</span><span className="text-right">Done</span><span className="text-right">Right</span><span className="text-right">Wrong</span>
          </div>
          <ul className="divide-y">
            {shown.slice(0, limit).map(({ v, r }) => <WordRow key={v.key} v={v} r={r} />)}
          </ul>
          {!shown.length ? <p className="text-muted-foreground py-3 text-sm">No word matches.</p> : null}
          {shown.length > limit ? (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setLimit((n) => n + PAGE * 4)} data-testid="vocab-more">Show more ({shown.length - limit} left)</Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

const MOCK_ORDER = (form) => { const i = (D.mocks || []).findIndex((m) => m.id === form); return i < 0 ? 99 : i }
function placeKey(ref, places) {
  if (ref.role === "quiz") return [0, 0, 0]
  if (ref.src === "mock") return [2, MOCK_ORDER(ref.form), ref.n || 0]
  const at = places[ref.sub][ref.id]
  return at ? [1, Number(at.w.slice(1)) * 100 + at.n, 0] : [1, 999, 0]
}
const byPlace = (places) => (a, b) => {
  const x = placeKey(a, places), y = placeKey(b, places)
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
}
function whereOf(ref, v) {
  if (ref.role === "quiz") return `Word quiz · ${v.lists.join(" and ")} list`
  if (ref.src === "mock") { const m = (D.mocks || []).find((x) => x.id === ref.form); return `${m ? m.name : ref.form} · ${ref.sub === "rc" ? "Reading" : "Verbal"} ${ref.n}` }
  return undefined
}

function Stat({ n, label, tone }) {
  return (
    <div className="flex flex-col">
      <span className={cn("text-2xl font-semibold tabular-nums", tone)}>{n}</span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

export function WordPage({ name }) {
  useStore()
  const v = vocabWord(name)
  const places = React.useMemo(() => ({ vr: placesOf("vr"), rc: placesOf("rc") }), [])
  if (!v) {
    return (
      <Card className="mx-auto w-full max-w-4xl" data-testid="word-page-missing">
        <CardHeader>
          <CardTitle>No “{name}” here</CardTitle>
          <CardDescription>It is not in any question or on any of her lists. <a href={href("/vocab")} className="underline underline-offset-4">Every word</a></CardDescription>
        </CardHeader>
      </Card>
    )
  }
  const r = wordResult(v)
  const tests = v.refs.filter((x) => x.role !== "choice").sort(byPlace(places))
  const choices = v.refs.filter((x) => x.role === "choice").sort(byPlace(places))
  // her own explanation lives on the precision page; the rating also schedules the word (`explain`)
  const mine = v.lists.map((w) => (((Store.s.precision || {})[w] || {}).words || {})[v.entry.word]).find((x) => x && x.text && x.text.trim())
  const conf = (mine && mine.conf) || ((v.entry && (rec("w:" + v.entry.word) || {}).explain) || {}).conf
  const row = (ref) => {
    const it = ref.role === "quiz" ? wordQuestion(v.entry.word) : ref.it
    const x = refResult(ref)
    const data = ref.role === "choice" ? { "data-chose": x.chose, "data-seen": x.seen } : { "data-done": x.done, "data-right": x.right, "data-wrong": x.wrong }
    const note = ref.role === "choice"
      ? <span data-testid="vocab-question-result">{x.seen ? (x.chose ? <span className="text-destructive">she chose “{v.word}” {x.chose}× of {x.seen}</span> : `answered ${x.seen}×, never chose it`) : "not tried yet"}</span>
      : <span data-testid="vocab-question-result">{x.done ? <>done {x.done} · <span className="text-success">{x.right} right</span> · <span className={x.wrong ? "text-destructive" : ""}>{x.wrong} wrong</span></> : "not tried yet"}</span>
    if (!it) {
      return (
        <li key={ref.id} className="py-3 text-sm" data-testid="vocab-question" data-qid={ref.id} data-role={ref.role} {...data}>
          <span className="font-medium">{whereOf(ref, v)}</span> · {note}
        </li>
      )
    }
    return <QuestionRow key={ref.id + ref.role} sub={ref.sub} it={it} at={places[ref.sub] ? places[ref.sub][ref.id] : null} where={whereOf(ref, v)} testid="vocab-question" role={ref.role} note={note} data={data} />
  }
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6" data-testid="word-page" data-word={v.key} data-tests={r.tests} data-done={r.done} data-right={r.right} data-wrong={r.wrong} data-chose={r.chose}>
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription>
            <a href={href("/vocab")} className="hover:text-primary underline-offset-4 hover:underline">Vocabulary</a> · {v.entry && v.entry.pos ? v.entry.pos : "word"}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{v.word}</CardTitle>
          {meaningOf(v) ? <CardDescription className="text-foreground text-base">{meaningOf(v)}</CardDescription> : null}
          {v.entry && v.entry.example ? <CardDescription className="italic">{v.entry.example}</CardDescription> : null}
          <CardDescription>
            {v.lists.length ? <>On her {v.lists.map((w, i) => <React.Fragment key={w}>{i ? " and " : ""}<a href={href("/precision/" + w)} className="hover:text-primary underline decoration-dotted underline-offset-4">{w}</a></React.Fragment>)} list{v.lists.length > 1 ? "s" : ""}. </> : "Not on her weekly lists. "}
            {v.entry ? (mine ? `She has explained it in her own words${conf ? ` and rated herself ${conf} of 3` : ""}.` : "She has not explained it in her own words yet.") : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 @md/main:grid-cols-5">
          <Stat n={r.tests} label={r.tests === 1 ? "question tests it" : "questions test it"} />
          <Stat n={r.done} label="answers she gave" />
          <Stat n={r.right} label="right" tone={r.right ? "text-success" : undefined} />
          <Stat n={r.wrong} label="wrong" tone={r.wrong ? "text-destructive" : undefined} />
          <Stat n={r.chose} label={`times she chose it wrongly`} tone={r.chose ? "text-destructive" : undefined} />
        </CardContent>
      </Card>
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle>Questions that test it</CardTitle>
          <CardDescription>{tests.length ? `${plural(tests.length, "question")}, in the order she meets them, each with her answers on it and the answer a tap away.` : "No question asks what this word means yet — it only appears as a wrong answer below."}</CardDescription>
        </CardHeader>
        {tests.length ? <CardContent className="px-5"><ul className="divide-y">{tests.map(row)}</ul></CardContent> : null}
      </Card>
      {choices.length ? (
        <Card className="gap-3 py-5">
          <CardHeader className="px-5">
            <CardTitle>Where it is a wrong answer</CardTitle>
            <CardDescription>Sentence completions that offer “{v.word}” as a wrong choice: to get them right she has to know it does not fit.</CardDescription>
          </CardHeader>
          <CardContent className="px-5"><ul className="divide-y">{choices.map(row)}</ul></CardContent>
        </Card>
      ) : null}
    </div>
  )
}
