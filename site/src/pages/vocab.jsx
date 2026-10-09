import * as React from "react"
import { Search } from "lucide-react"

import { D } from "@/lib/content"
import { rec, wordQuestion } from "@/lib/engine"
import { useStore } from "@/lib/store"
import { href } from "@/lib/router"
import { WORD_SHOWS, meaningOf, ownWords, refResult, vocabIndex, vocabPath, vocabWord, wordResult } from "@/lib/vocab"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Input } from "@zhangqi444/ui/ui/input"
import { ShowFilter, Stat, TallyHead, TallyLine, TallyRow, TallyStats } from "@/components/tally"
import { QuestionRow, placesOf } from "@/pages/skill"

/* Every word the questions teach or test, each with the questions that cover it and how
 * she has done on them (lib/vocab.js says how a word is read off a question). The owner
 * asked to see, word by word, "if covered, done how many times, right/wrong" — so the
 * numbers are counts of her own answers, and a word no question asks says so. The counting
 * is lib/tally.js and the rows are components/tally.jsx, shared with a subject's skills and a
 * skill's page, so a word and a skill are counted and drawn the same way. */

const PAGE = 150
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`

function WordRow({ v, r }) {
  return (
    <TallyRow testid="vocab-row" t={r} data={{ "data-word": v.key, "data-tests": r.tests }}
      name={<>
        <a href={href(vocabPath(v.key))} className="hover:text-primary decoration-muted-foreground/60 font-medium underline decoration-dotted underline-offset-4" data-testid="vocab-link">{v.word}</a>
        {v.lists.map((w) => <Badge key={w} variant="outline" className="text-[11px]">{w} list</Badge>)}
      </>}
      desc={meaningOf(v)}
      wide={<>
        {r.choices ? <>{meaningOf(v) ? " · " : ""}a wrong answer in {r.choices}</> : null}
        {r.chose ? <> · chose it {r.chose}×</> : null}
      </>}
      narrow={<>
        {r.choices ? <span className="text-muted-foreground"> · a wrong answer in {r.choices}</span> : null}
        {r.chose ? <span> · chose it {r.chose}×</span> : null}
      </>} />
  )
}

export function VocabPage() {
  useStore()
  const { list } = vocabIndex()
  const [text, setText] = React.useState("")
  const [show, setShow] = React.useState("tested")
  const [limit, setLimit] = React.useState(PAGE)
  const rows = list.map((v) => ({ v, r: wordResult(v) }))
  const count = (id) => rows.filter(({ v, r }) => WORD_SHOWS.find((s) => s.id === id).keep(v, r)).length
  const want = text.toLowerCase().trim()
  const mode = WORD_SHOWS.find((s) => s.id === show) || WORD_SHOWS[0]
  let shown = rows.filter(({ v, r }) => mode.keep(v, r) && (!want || v.key.includes(want) || meaningOf(v).toLowerCase().includes(want)))
  if (show === "missed") shown = [...shown].sort((a, b) => (b.r.wrong + b.r.chose) - (a.r.wrong + a.r.chose) || a.v.key.localeCompare(b.v.key))
  if (want) shown = [...shown].sort((a, b) => (b.v.key.startsWith(want) - a.v.key.startsWith(want)) || a.v.key.localeCompare(b.v.key))
  const onLists = count("lists"), tested = rows.filter(({ r }) => r.tests).length, answered = rows.filter(({ r }) => r.done).length
  const foils = rows.length - tested
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-6" data-testid="vocab-page" data-n={rows.length} data-scope={tested} data-foils={foils} data-shown={shown.length}>
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription>Verbal Reasoning · vocabulary</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Every word</CardTitle>
          <CardDescription data-testid="vocab-summary">
            {plural(tested, "word")} tracked — the plan teaches {onLists} of them on her weekly lists, and {tested - onLists} more are examined by a question without ever being on one. She has answered questions on {answered} of them.
          </CardDescription>
          <CardDescription className="text-xs">
            A word counts as tested where a synonym or a reading question asks what it means, where it is the right answer to a sentence completion or the word a phrase completion turns on, and by the word quiz built from her list. Her answers count once each, from sets, reviews, mocks, the word quiz and the Wordwood; a corrections pass, where she has just seen the answer, does not.
          </CardDescription>
          <CardDescription className="text-xs" data-testid="vocab-foils" data-n={foils}>
            A further {foils} words are in the bank only as a wrong answer, and are not counted above. Every sentence completion needs three foils for the word it is really asking about, so those arrived without anyone choosing them as vocabulary — “toast”, “maps”, “streets”, “beside”. Counting them as uncovered put the gap at {rows.length - onLists} words and made the real one, the {tested - onLists} examined but never taught, impossible to see. They are listed under <span className="font-medium">Only a wrong answer</span>, where how often she picked one is worth knowing.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input value={text} onChange={(e) => { setText(e.target.value); setLimit(PAGE) }} placeholder="Find a word or a meaning" className="pl-8" data-testid="vocab-search" />
          </div>
          <ShowFilter className="pt-1" shows={WORD_SHOWS} show={show} count={count} prefix="vocab" onShow={(id) => { setShow(id); setLimit(PAGE) }} />
        </CardHeader>
        <CardContent className="px-5">
          <TallyHead first="Word" second="Meaning" />
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
  const mine = ownWords(v)
  const conf = (mine && mine.conf) || ((v.entry && (rec("w:" + v.entry.word) || {}).explain) || {}).conf
  const row = (ref) => {
    const it = ref.role === "quiz" ? wordQuestion(v.entry.word) : ref.it
    const x = refResult(ref)
    // A question that tests the word gets the same line, counted the same way, as a skill's
    // question does (QuestionRow's own); a completion that offers it as a wrong answer says
    // instead how often she chose it there.
    const data = ref.role === "choice" ? { "data-chose": x.chose, "data-seen": x.seen } : { "data-done": x.done, "data-right": x.right, "data-wrong": x.wrong }
    const note = ref.role === "choice"
      ? <span data-testid="vocab-question-result">{x.seen ? (x.chose ? `she chose “${v.word}” ${x.chose}× of ${x.seen}` : `answered ${x.seen}×, never chose it`) : <span className="text-muted-foreground">not tried yet</span>}</span>
      : <TallyLine x={x} testid="vocab-question-result" />
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
        <CardContent>
          <TallyStats t={r} testid="word-stats" questions={r.tests === 1 ? "question tests it" : "questions test it"}
            extra={<Stat n={r.chose} label="times she chose it wrongly" />} />
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
