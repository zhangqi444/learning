import * as React from "react"
import { ArrowLeft, ArrowRight, Award, Check, CheckCircle2, Gauge, Home, RotateCcw, Timer, XCircle, Zap } from "lucide-react"

import { D, LTR, keyOf } from "@/lib/content"
import { BUDGET, CAUSES, findItem, paceFlag, rec, recordAttempts, setTag, skillLevel } from "@/lib/engine"
import { syncBadges } from "@/lib/rewards"
import { go } from "@/lib/router"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { W, atLeast } from "@/lib/world"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupPrimitive } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Burst, useCountUp } from "@/components/burst"
import { Gate, inscribe } from "@/components/gate"
import { Glim } from "@/components/glim"
import { sfx } from "@/lib/sfx"

const { useState, useEffect, useRef } = React

export function Passage({ id }) {
  const p = D.passages[id]
  if (!p) return null
  return (
    <ScrollArea className="bg-muted/40 max-h-64 rounded-lg border [&>[data-radix-scroll-area-viewport]]:max-h-64">
      <div className="flex flex-col gap-3 p-4 text-[15px] leading-7">
        {p.t ? <h3 className="text-base font-semibold">{p.t}</h3> : null}
        {p.x.split(/\n+/).map((para, k) => <p key={k}>{para}</p>)}
      </div>
    </ScrollArea>
  )
}

/** One choice, rendered as a card-sized radio so the whole row is the target.
 *  `mark` is set only once an answer has been revealed in instant mode:
 *  "right" on the key, "wrong" on what she picked instead. */
export function Choice({ k, text, checked, onSelect, mark }) {
  return (
    <RadioGroupPrimitive.Item
      value={LTR[k]}
      data-testid="choice"
      data-mark={mark || undefined}
      className={cn(
        // Pressable like a game control, but the text itself stays plain: on the
        // day it counts the question is black on white, so the choice must not
        // train her to read anything more decorated than that.
        "group/opt bg-card hover:bg-accent/50 focus-visible:ring-ring/50 flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left text-[15px] leading-snug transition-all duration-100 ease-out outline-none focus-visible:ring-[3px]",
        "shadow-[0_3px_0_0_var(--outline-press)] active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--outline-press)]",
        "data-[state=checked]:border-primary data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[state=checked]:shadow-[0_3px_0_0_var(--primary-press)]",
        // A revealed answer overrides the picked styling entirely, so the mark
        // is never ambiguous about which row was right.
        "data-[mark=right]:!border-success data-[mark=right]:!bg-success-soft data-[mark=right]:!text-foreground data-[mark=right]:!shadow-[0_3px_0_0_var(--success)]",
        "data-[mark=wrong]:!border-destructive data-[mark=wrong]:!bg-destructive/10 data-[mark=wrong]:!text-foreground data-[mark=wrong]:!shadow-[0_3px_0_0_var(--destructive)]"
      )}
      onClick={() => onSelect(k)}
    >
      <span className="bg-muted text-muted-foreground group-data-[state=checked]/opt:bg-primary group-data-[state=checked]/opt:text-primary-foreground group-data-[mark=right]/opt:!bg-success group-data-[mark=right]/opt:!text-white group-data-[mark=wrong]/opt:!bg-destructive group-data-[mark=wrong]/opt:!text-white flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors">
        {LTR[k]}
      </span>
      <span className="pt-0.5">{text}</span>
      {mark ? <span className="ml-auto pt-0.5">{mark === "right" ? <CheckCircle2 className="text-success size-5" /> : <XCircle className="text-destructive size-5" />}</span> : null}
    </RadioGroupPrimitive.Item>
  )
}

export function ActionBar({ children }) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 -mx-4 -mb-4 mt-2 flex items-center gap-3 border-t px-4 py-3 backdrop-blur md:-mx-6 md:-mb-6 md:px-6">
      {children}
    </div>
  )
}

/** Reconstruct the pick indices of a finished set from a stored result: the
 *  recorded letters when we have them, otherwise "was right => the key". */
function picksFromResult(items, r) {
  const wrong = new Set(r.wrong || [])
  return items.map((q) => {
    const L = r.picks && r.picks[q.id]
    if (L && LTR.indexOf(L) > -1) return LTR.indexOf(L)
    return wrong.has(q.id) ? null : LTR.indexOf(keyOf(q))
  })
}

const subOf = (q, fallback) => (findItem(q.id) || {}).sub || fallback || "vr"

/** The skill's own cat — the same one the Glimbook holds — at the brightness the
 *  engine really reports for it, never dimmer than Steady. `sub` null means this
 *  surface does not get one (Verbal has the cat at its gate; corrections get
 *  nothing, because going back over answers is not an event). */
function catFor(q, sub) {
  if (!sub || !q || !q.sk) return null
  let level = "Not started"
  try { level = skillLevel(sub, q.sk).level } catch { /* an unknown skill is drawn at the floor */ }
  return { word: sub + ":" + q.sk, sk: q.sk, stage: atLeast(W.glow[level], "Steady") }
}
const fmtSec = (ms) => `${Math.round(ms / 1000)} s`

/** Why did this go wrong? One tap for the cause, one for "were you sure". */
export function CauseTags({ id, compact }) {
  useStore()
  const r = rec(id) || {}
  return (
    <div className={cn("flex flex-col gap-2", compact && "gap-1.5")} data-testid="cause-tags" data-tag={r.tag || ""}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-xs">Why?</span>
        {CAUSES.map((c) => (
          <Tooltip key={c.id}>
            <TooltipTrigger asChild>
              <Button size="sm" variant={r.tag === c.id ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setTag(id, { tag: r.tag === c.id ? null : c.id })} data-testid={`tag-${c.id}`}>{c.label}</Button>
            </TooltipTrigger>
            <TooltipContent>{c.hint}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground mr-1 text-xs">Were you sure?</span>
        <Button size="sm" variant={r.sure === true ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setTag(id, { sure: r.sure === true ? null : true })} data-testid="sure-yes">Sure</Button>
        <Button size="sm" variant={r.sure === false ? "default" : "outline"} className="h-7 px-2.5 text-xs" onClick={() => setTag(id, { sure: r.sure === false ? null : false })} data-testid="sure-no">Guessing</Button>
      </div>
    </div>
  )
}

/** Seconds on the current question against the section budget; goes amber past it. Pacing mode only. */
function SoftTimer({ since, budget }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const sec = Math.round((now - since) / 1000)
  const over = sec > budget
  return (
    <span className={cn("flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs tabular-nums", over ? "border-warning text-warning" : "text-muted-foreground")} data-testid="soft-timer">
      <Timer className="size-3" /> {sec} s <span className="opacity-60">/ {budget}</span>
    </span>
  )
}

/**
 * items: questions · setId: results key for plan sets · custom: not a plan set (review, mixed, corrections, word quiz)
 * ctx: set | review | mixed | corr | vocab — what kind of evidence the answers are · onFinish(summary): custom flows
 * prior: an earlier result to reopen · record=false: nothing is written (corrections right after a mock).
 */
export function Runner({ items, title, setId, custom, ctx, exitPath, exitLabel, prior, record = true, onFinish, sub: subHint }) {
  const kind = ctx || (custom ? "review" : "set")
  const store = useStore()
  const [i, setI] = useState(0)
  const [picks, setPicks] = useState(() => (prior ? picksFromResult(items, prior) : []))
  const [done, setDone] = useState(() => (prior ? { right: prior.right, at: prior.at, attempts: prior.attempts || 1, reopened: true, times: prior.times || null } : null))
  const [won, setWon] = useState([])           // badges earned by finishing this set
  const [shown, setShown] = useState({})       // question index -> revealed, instant mode only
  const spent = useRef({})                    // question index -> ms
  const entered = useRef(Date.now())
  const it = items[i], total = items.length
  const pacing = !!store.s.pacing
  const budget = BUDGET[subOf(it || items[0], subHint)] || 50
  /* Instant marking is practice only. A mock's timed sections have their own
   * screens and never reach the Runner; corrections already show the answers,
   * so revealing there would be meaningless. Everything else — sets, the review
   * pile, mixed practice, the word quiz — marks as she goes, because a game
   * answers in well under a second and a set that says nothing for ten minutes
   * is the least game-like thing on the site. */
  const instant = store.s.instant !== false && kind !== "corr"
  // Called unconditionally: the finished-set screen is an early return below,
  // and a hook may not live behind it.
  const counted = useCountUp(done ? done.right : 0)

  function leave() { spent.current[i] = (spent.current[i] || 0) + (Date.now() - entered.current); entered.current = Date.now() }
  function retry() { setPicks([]); setDone(null); setWon([]); setShown({}); setI(0); spent.current = {}; entered.current = Date.now(); window.scrollTo(0, 0) }

  function choose(k) {
    if (instant && shown[i]) return          // an answered question stays answered
    const np = picks.slice(); np[i] = k; setPicks(np)
    if (!instant) { sfx("pick"); return }
    setShown({ ...shown, [i]: true })
    const ok = LTR[k] === keyOf(items[i])
    // In a Verbal set a right answer is a cat arriving, so let it answer in its
    // own voice rather than the generic chime — the same cat she will meet in
    // the Wordwood, sounding the same. A wrong one stays the plain soft note:
    // she called nobody, so nobody came.
    const sub = subOf(items[i], subHint)
    const name = String(items[i].c[k] || "").trim()
    // In a Verbal set the answer IS a name, so that cat answers in its own
    // voice. Everywhere else the thing with a name is the SKILL, so the skill's
    // cat is the one that turns up — the same cat she has in the Glimbook, so
    // getting Percent right sounds like Percent. A wrong answer keeps the plain
    // soft note: nobody was called, so nobody came, and nothing is taken away.
    const word = ok && kind !== "corr" ? (sub === "vr" && /^[a-z][a-z'-]*$/i.test(name) ? name : items[i].sk ? sub + ":" + items[i].sk : null) : null
    sfx(word ? "call" : ok ? "right" : "wrong", word || undefined)
  }
  function step(d) {
    if (d > 0 && picks[i] == null) return
    if (d > 0 && i === total - 1) return finish()
    leave()
    setI(Math.max(0, i + d)); window.scrollTo(0, 0)
  }
  function finish() {
    leave()
    let right = 0
    const wrong = [], entries = [], times = {}, bySub = {}
    items.forEach((q, j) => {
      const ok = LTR[picks[j]] === keyOf(q)
      if (ok) right++; else wrong.push(q.id)
      const ms = spent.current[j] || 0
      times[q.id] = ms
      entries.push({ id: q.id, ok, ms, pick: picks[j] == null ? null : LTR[picks[j]] })
      const s = subOf(q, subHint); bySub[s] = bySub[s] || { right: 0, n: 0 }; bySub[s].n++; if (ok) bySub[s].right++
    })
    const at = new Date().toISOString()
    if (!custom) {
      const picksById = {}
      items.forEach((q, j) => { if (picks[j] != null) picksById[q.id] = LTR[picks[j]] })
      const res = { n: items.length, right, at, wrong, picks: picksById, times }
      if (prior) {                                   // keep the first attempt on record
        res.attempts = (prior.attempts || 1) + 1
        res.first = prior.first || { right: prior.right, at: prior.at }
      }
      Store.recordSet(setId, res)
    }
    if (record) recordAttempts(entries, kind)
    if (onFinish) onFinish({ right, n: items.length, at, wrong, bySub, times })
    const badges = record ? syncBadges() : []
    if (record) setWon(badges)
    setDone({ right, at, attempts: prior ? (prior.attempts || 1) + 1 : 1, times })
    sfx(badges.length ? "badge" : "finish")
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const on = (e) => {
      if (done || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target && e.target.tagName) || ""
      if (tag === "INPUT" || tag === "TEXTAREA") return
      const k = (e.key || "").toUpperCase()
      let idx = LTR.indexOf(k)
      if (idx === -1 && e.key >= "1" && e.key <= "4") idx = +e.key - 1
      if (idx > -1 && it) { choose(idx); e.preventDefault() }
      else if (e.key === "Enter") { step(1); e.preventDefault() }
      else if (e.key === "Backspace") { step(-1); e.preventDefault() }
    }
    addEventListener("keydown", on)
    return () => removeEventListener("keydown", on)
  })

  if (done) {
    const pct = Math.round((done.right / total) * 100)
    const msg = pct >= 85 ? "Strong set. Read the notes on anything you guessed."
      : pct >= 60 ? "Solid. The notes below are where the next few marks are."
      : "This one was hard. Work through the notes slowly — that is what moves the score."
    const when = done.at ? new Date(done.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null
    const noLetters = done.reopened && !(prior && prior.picks)
    const canTag = record && kind !== "corr"
    const misses = items.filter((q, j) => LTR[picks[j]] !== keyOf(q))
    const tagged = canTag ? misses.filter((q) => (rec(q.id) || {}).tag).length : 0
    const timed = done.times ? items.map((q) => done.times[q.id] || 0).filter(Boolean) : []
    const avg = timed.length ? timed.reduce((a, b) => a + b, 0) / timed.length : null
    // Who turned up: one cat per skill she actually got right, with how many
    // times. It is her own result grouped by skill and nothing more — no cat for
    // a miss, and none of them can be brighter than the engine says.
    const byName = {}
    if (kind !== "corr") {
      items.forEach((q, j) => {
        if (!q.sk || LTR[picks[j]] !== keyOf(q)) return
        const sub = subOf(q, subHint)
        const word = sub + ":" + q.sk
        if (byName[word]) { byName[word].n++; return }
        byName[word] = { ...catFor(q, sub), n: 1 }
      })
    }
    const came = Object.values(byName).sort((a, b) => b.n - a.n || a.sk.localeCompare(b.sk)).slice(0, 8)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card relative items-center bg-gradient-to-t text-center" data-testid="score">
          {/* Only for a set just finished — reopening an old result is not an event. */}
          {!done.reopened ? <Burst seed={done.at} /> : null}
          <CardHeader className="w-full">
            <CardDescription>{title}{done.reopened && when ? ` · completed ${when}` : ""}{done.attempts > 1 ? ` · attempt ${done.attempts}` : ""}</CardDescription>
            <CardTitle className="text-5xl font-extrabold tracking-tight tabular-nums">
              {done.reopened ? done.right : counted}<span className="text-muted-foreground text-xl font-normal"> / {total}</span>
            </CardTitle>
            <CardDescription className="text-base">{pct}% · {msg}</CardDescription>
            {avg != null && (
              <CardDescription className="flex flex-wrap items-center justify-center gap-x-3 text-xs" data-testid="pace-summary">
                <span><Gauge className="mr-1 inline size-3" />about {Math.round(avg / 1000)} s a question · real-test budget {budget} s</span>
                {avg / 1000 > budget * 1.25 ? <Badge variant="warning">slower than the budget</Badge> : avg / 1000 < budget * 0.5 && pct < 70 ? <Badge variant="destructive">very fast — slow down</Badge> : <Badge variant="success">on pace</Badge>}
              </CardDescription>
            )}
            {canTag && misses.length ? (
              <CardDescription className="text-xs" data-testid="tag-progress">{tagged} of {misses.length} miss{misses.length === 1 ? "" : "es"} tagged — one tap each below says why it went wrong.</CardDescription>
            ) : null}
            {came.length ? (
              <div className="mt-3 flex flex-wrap justify-center gap-2" data-testid="set-came">
                {came.map((c) => (
                  <figure key={c.word} className="flex w-24 flex-col items-center gap-0.5" title={`${c.sk} — ${c.stage}`}>
                    <Glim word={c.word} stage={c.stage} className="size-11" title={c.sk} />
                    <figcaption className="line-clamp-2 w-full text-center text-[11px] leading-tight font-semibold">
                      {c.sk}{c.n > 1 ? ` ×${c.n}` : ""}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {won.length ? (
              <div
                className="border-primary bg-primary/10 mt-4 flex flex-col items-center gap-2 rounded-2xl border-2 p-4 shadow-[0_3px_0_0_var(--primary-press)] motion-safe:animate-[pop_420ms_cubic-bezier(.34,1.56,.64,1)_both]"
                data-testid="badges-won"
              >
                <Award className="text-primary size-7" />
                <span className="text-primary text-base font-extrabold tracking-tight">{won.length === 1 ? "New badge earned" : `${won.length} new badges earned`}</span>
                <span className="text-lg font-bold">{won.map((b) => b.name).join(" · ")}</span>
                <Button size="sm" onClick={() => go("/rewards")}>See rewards</Button>
              </div>
            ) : null}
            {!custom && (
              <div className="mt-2 flex justify-center">
                <Button variant="outline" size="sm" onClick={retry} data-testid="retry"><RotateCcw /> Try this set again</Button>
              </div>
            )}
            {noLetters && <CardDescription className="text-xs">This set was done before answers were recorded letter by letter, so only right/missed is shown.</CardDescription>}
          </CardHeader>
        </Card>
        <h2 className="mt-2 text-xl font-semibold">Every question</h2>
        <div className="flex flex-col gap-3">
          {items.map((q, j) => {
            const ok = LTR[picks[j]] === keyOf(q)
            const yours = picks[j] == null ? "—" : `${LTR[picks[j]]}. ${q.c[picks[j]]}`
            const ms = done.times ? done.times[q.id] : 0
            const flag = paceFlag(subOf(q, subHint), ms, ok)
            return (
              <Card key={j} className={cn("gap-3 py-5", !ok && "border-destructive/40")}>
                <CardHeader className="px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {ok ? <Badge variant="success"><CheckCircle2 /> Correct</Badge> : <Badge variant="destructive"><XCircle /> Missed</Badge>}
                    <span className="text-muted-foreground text-xs">Q{j + 1}{q.sk ? " · " + q.sk : ""}</span>
                    {ms ? <span className="text-muted-foreground text-xs tabular-nums">· {fmtSec(ms)}</span> : null}
                    {flag ? <Badge variant={flag.tone} className="text-xs">{flag.label}</Badge> : null}
                  </div>
                  <CardTitle className="text-[15px] leading-snug font-medium">{q.q}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-5 text-sm">
                  <div className="text-muted-foreground">Your answer: <span className="text-foreground font-medium">{yours}</span></div>
                  {!ok && (
                    <div className="text-muted-foreground">Correct: <span className="text-foreground font-medium">{keyOf(q)}. {q.c[LTR.indexOf(keyOf(q))]}</span></div>
                  )}
                  {/* the same naming of her own mistake as on the reveal — this
                      is where it lands after a timed set, when nothing was
                      revealed as she went */}
                  {!ok && picks[j] != null && q.y && q.y[LTR[picks[j]]] ? (
                    <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3 leading-relaxed" data-testid="why">{q.y[LTR[picks[j]]]}</div>
                  ) : null}
                  {q.e ? <div className="bg-muted/60 text-muted-foreground rounded-md p-3 leading-relaxed">{q.e}</div> : null}
                  {!ok && canTag ? <CauseTags id={q.id} /> : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
        <ActionBar>
          <Button variant="outline" onClick={() => go("/")}><Home /> Dashboard</Button>
          <span className="flex-1" />
          <Button onClick={() => go(exitPath)}>{exitLabel} <ArrowRight /></Button>
        </ActionBar>
      </div>
    )
  }

  const last = i === total - 1
  const revealed = instant && !!shown[i] && picks[i] != null
  const gotIt = revealed && LTR[picks[i]] === keyOf(it)
  /* Verbal Reasoning is drawn as the Wordkeep, because it already is one: most
   * of its items are a sentence with a word taken out. Same items, same
   * recording, same marking — only the frame changes, so nothing about the
   * evidence this produces is different from a plain set. Corrections stay
   * plain: reviewing answers is not a gate to open. */
  const gameMode = kind !== "corr" && subOf(it, subHint) === "vr"
  const rune = gameMode ? inscribe(it.q) : null
  /* Who walks through when the gate opens. Deliberately only on the REVEAL, and
   * deliberately not on the choices: the Wordwood is the game and its controls
   * wear faces, but a practice set is the rehearsal, and on the day it counts
   * the four choices are plain words on white. Training her to scan for a ginger
   * tabby would be training her for a test that does not exist (rule 5).
   * Only single words get a cat — a choice that is a phrase is not a name. */
  const answerText = gameMode ? String(it.c[LTR.indexOf(keyOf(it))] || "").trim() : ""
  const arrival = gameMode && gotIt && /^[a-z][a-z'-]*$/i.test(answerText) ? answerText : null
  // Verbal already has the cat that walked through the gate, so it does not want
  // a second one; every other subject gets its skill's cat on the reveal.
  // A plain const, NOT a useMemo: everything from here down sits after the early
  // return for a finished set, so a hook here is a conditional hook and React
  // throws the moment the last question is answered.
  const reactCat = catFor(it, gameMode || kind === "corr" ? null : subOf(it, subHint))
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span className="truncate font-medium">{title}</span>
          <span className="flex shrink-0 items-center gap-2">
            {pacing ? <SoftTimer key={i} since={entered.current} budget={budget} /> : null}
            {kind !== "corr" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={instant ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => Store.setPref("instant", !instant)} data-testid="instant-toggle"><Zap /> Instant {instant ? "on" : "off"}</Button>
                </TooltipTrigger>
                <TooltipContent>Marks each answer as you go. Turn it off to sit the set the way the real test works — everything at the end.</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant={pacing ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => Store.setPref("pacing", !pacing)} data-testid="pacing-toggle"><Gauge /> Pacing {pacing ? "on" : "off"}</Button>
              </TooltipTrigger>
              <TooltipContent>Shows a soft timer against the real test's {budget} seconds a question. Nothing auto-advances.</TooltipContent>
            </Tooltip>
            <span className="tabular-nums" data-testid="counter">{i + 1} / {total}</span>
          </span>
        </div>
        <Progress value={(i / total) * 100} className="h-1.5" aria-label="Progress through the set" />
      </div>
      <Card className="gap-5">
        <CardContent className="flex flex-col gap-5">
          {it.p ? <Passage id={it.p} /> : null}
          {gameMode ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full max-w-xs">
                <Gate open={gotIt} glow={!arrival} className="w-full" />
                {arrival ? (
                  <Glim
                    key={arrival}
                    word={arrival}
                    stage="Bright"
                    title={`${arrival} came to the gate`}
                    className="motion-safe:animate-[pop_420ms_cubic-bezier(.34,1.56,.64,1)_both] absolute top-[66%] left-1/2 size-20 -translate-x-1/2 -translate-y-1/2"
                  />
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{rune.lead}</p>
              <p
                className={cn("text-center leading-relaxed font-medium", rune.kind === "rune" ? "text-2xl font-extrabold tracking-tight" : "text-lg")}
                data-testid="question"
              >
                {rune.text}
              </p>
              {rune.tail ? <p className="text-muted-foreground text-xs">{rune.tail}</p> : null}
            </div>
          ) : (
            <p className="text-lg leading-snug font-medium" data-testid="question">{it.q}</p>
          )}
          {gameMode ? <p className="text-muted-foreground -mb-2 text-xs font-semibold tracking-wide uppercase">Your spells</p> : null}
          <RadioGroup value={picks[i] == null ? "" : LTR[picks[i]]} onValueChange={(v) => choose(LTR.indexOf(v))} className="gap-2.5" aria-label="Answer choices">
            {it.c.map((c, k) => (
              <Choice
                key={k}
                k={k}
                text={c}
                onSelect={choose}
                mark={!revealed ? null : LTR[k] === keyOf(it) ? "right" : picks[i] === k ? "wrong" : null}
              />
            ))}
          </RadioGroup>
          {revealed ? (
            <div className="motion-safe:animate-[pop_260ms_ease-out_both]" data-testid="reveal">
              <div className="flex items-start gap-3">
                {/* The skill's own cat, keeping her company. Not in the question
                    and not on the choices — those stay exactly as the real test
                    prints them. It is here on the reveal, at the brightness the
                    engine really reports for that skill, so the Percent cat gets
                    brighter as she gets better at percent. On a miss it does not
                    leave, sulk or dim: nothing is taken away for being wrong. */}
                {reactCat ? (
                  <span className="relative shrink-0">
                    {gotIt ? <Burst seed={i} n={10} /> : null}
                    <Glim
                      key={reactCat.word + (gotIt ? ":y" : ":n")}
                      word={reactCat.word}
                      stage={reactCat.stage}
                      title={`${it.sk} — ${reactCat.stage}`}
                      className={cn("size-14", gotIt && "motion-safe:animate-[pop_420ms_cubic-bezier(.34,1.56,.64,1)_both]")}
                    />
                  </span>
                ) : null}
                <div className={cn("flex items-center gap-2 pt-1 text-sm font-bold", gotIt ? "text-success" : "text-destructive")}>
                  {gotIt
                    ? <><CheckCircle2 className="size-4" /> {gameMode ? "The gate opens." : "Right"}</>
                    : <><XCircle className="size-4" /> {gameMode ? `The gate holds. It wanted “${it.c[LTR.indexOf(keyOf(it))]}”.` : `The answer is ${keyOf(it)}`}</>}
                </div>
              </div>
              {/* What HER choice did, before what the right method is. The
                  explanation can only ever describe the correct route, so on a
                  miss it answers a question she did not ask: told "perimeter =
                  2(10+3) = 26" she still does not know that the 30 she picked
                  was the area. Authored per wrong choice in `why`, so it is only
                  here when someone has actually written it. */}
              {!gotIt && it.y && it.y[LTR[picks[i]]] ? (
                <p className="border-destructive/40 bg-destructive/5 mt-2 rounded-lg border p-3 text-sm leading-relaxed" data-testid="why">{it.y[LTR[picks[i]]]}</p>
              ) : null}
              {it.e ? <p className="bg-muted/60 text-muted-foreground mt-2 rounded-lg p-3 text-sm leading-relaxed">{it.e}</p> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <ActionBar>
        <Button variant="outline" onClick={() => step(-1)} disabled={i === 0}><ArrowLeft /> Back</Button>
        <span className="text-muted-foreground hidden flex-1 text-sm sm:block">{picks[i] == null ? "Pick an answer (or press A–D)" : "Press Enter to continue"}</span>
        <span className="flex-1 sm:hidden" />
        <Button onClick={() => step(1)} disabled={picks[i] == null} data-testid="next">
          {last ? <>Finish set <Check /></> : <>Next <ArrowRight /></>}
        </Button>
      </ActionBar>
    </div>
  )
}
