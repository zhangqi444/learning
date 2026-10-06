import * as React from "react"
import { ChevronDown, ChevronRight, Play } from "lucide-react"

import { D, LTR, SUBJ, keyOf, setsFor } from "@/lib/content"
import { hash, rec, skillOf } from "@/lib/engine"
import { useStore } from "@/lib/store"
import { go } from "@/lib/router"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Figure } from "@/components/figure"
import { Passage, Runner } from "@/pages/runner"

/* One skill, every question that practises it — the owner, 5 October 2026, after
 * marking a published paper by hand and finding whole topics missing: "to each
 * skill, add link to all the covered questions … each skill should be openable and
 * see list of questions". So a skill on a subject page opens this: its questions
 * grouped by sub-skill, each with the week and sitting it is in and how she did,
 * the question as she sees it, and its answer behind a tap. What a skill covers is
 * read off the page instead of taken on trust. */

export const skillPath = (sub, sk) => `/skill/${sub}/${encodeURIComponent(sk)}`
export function skillItems(sub, sk) { return (D.subjects[sub] || []).filter((it) => skillOf(sub, it) === sk) }
const DIFF = { E: "Easy", M: "Medium", H: "Hard" }
const UNSORTED = "other questions"

/** Where each question of a subject sits: its week and its sitting (0-based). */
export function placesOf(sub) {
  const out = {}
  for (const w of D.weeks || []) setsFor(sub, w.w).forEach((set, n) => set.forEach((q) => { out[q.id] = { w: w.w, n } }))
  return out
}
function lastTry(id) { const r = rec(id); const h = (r && r.hist) || []; return h.length ? h[h.length - 1] : null }

/** One question as she sees it, its answer behind a tap. `where` names its place when it is
 *  not a sitting (a mock, the word quiz), and `note` adds what the page around it counts. */
export function QuestionRow({ sub, it, at, where, testid = "skill-question", role, note, data }) {
  const [answer, setAnswer] = React.useState(false)
  const [passage, setPassage] = React.useState(false)
  const last = lastTry(it.id), k = keyOf(it)
  return (
    <li className="flex flex-col gap-2 py-3" data-testid={testid} data-qid={it.id} data-role={role} data-added={it.x ? "1" : undefined} {...(data || {})}>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-foreground font-medium tabular-nums">{where || (at ? `${at.w} · sitting ${at.n + 1}` : it.w)}</span>
        {it.d ? <Badge variant="outline" className="text-[11px]">{DIFF[it.d] || it.d}</Badge> : null}
        {note || <span data-testid="skill-question-last">{last ? (last.ok ? "right last time" : "missed last time") : "not tried yet"}</span>}
      </div>
      {sub === "rc" && it.p && D.passages[it.p] ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Passage:</span><span className="font-medium">{D.passages[it.p].t || it.p}</span>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setPassage((v) => !v)}>{passage ? "Hide it" : "Show it"}</Button>
          </div>
          {passage ? <Passage id={it.p} /> : null}
        </div>
      ) : null}
      <p className="leading-snug font-medium">{it.q}</p>
      {it.f ? <Figure f={it.f} /> : null}
      <ol className="grid gap-1.5 text-sm @md/main:grid-cols-2">
        {it.c.map((c, i) => (
          <li key={i} className={cn("rounded-md border px-2.5 py-1.5", answer && LTR[i] === k && "border-success bg-success-soft font-medium")} data-key={answer && LTR[i] === k ? "1" : undefined}>
            <span className="text-muted-foreground mr-2 font-medium">{LTR[i]}</span>{c}
          </li>
        ))}
      </ol>
      <div><Button size="sm" variant="ghost" className="h-7" onClick={() => setAnswer((v) => !v)} data-testid="skill-question-answer">{answer ? "Hide the answer" : "Show the answer"}</Button></div>
      {answer ? <p className="text-sm" data-testid="skill-question-why"><span className="font-semibold">{k}.</span> {it.e}</p> : null}
    </li>
  )
}

function SubskillGroup({ sub, name, items, places, open, onToggle }) {
  const tried = items.filter((it) => lastTry(it.id)).length
  const weeks = [...new Set(items.map((it) => (places[it.id] || {}).w || it.w))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  return (
    <div className="rounded-lg border" data-testid="skill-group" data-name={name} data-n={items.length}>
      <button type="button" className="hover:bg-accent/40 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left" onClick={onToggle} aria-expanded={open} data-testid="skill-group-open">
        {open ? <ChevronDown className="text-muted-foreground size-4 shrink-0" /> : <ChevronRight className="text-muted-foreground size-4 shrink-0" />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium first-letter:uppercase">{name}</span>
          <span className="text-muted-foreground block text-xs tabular-nums">{items.length} question{items.length === 1 ? "" : "s"} · {weeks.join(" ")} · {tried} tried</span>
        </span>
      </button>
      {open ? (
        <ul className="divide-y border-t px-3">
          {items.map((it) => <QuestionRow key={it.id} sub={sub} it={it} at={places[it.id]} />)}
        </ul>
      ) : null}
    </div>
  )
}

export function SkillPage({ sub, sk }) {
  useStore()
  const items = React.useMemo(() => skillItems(sub, sk), [sub, sk])
  const places = React.useMemo(() => placesOf(sub), [sub])
  const groups = React.useMemo(() => {
    const m = new Map()
    for (const it of items) { const g = it.ss || UNSORTED; if (!m.has(g)) m.set(g, []); m.get(g).push(it) }
    return [...m.entries()].sort((a, b) => (a[0] === UNSORTED) - (b[0] === UNSORTED) || a[0].localeCompare(b[0]))
  }, [items])
  const [opened, setOpened] = React.useState(() => new Set())
  const [all, setAll] = React.useState(false)
  if (!SUBJ[sub]) return null
  const tried = items.filter((it) => lastTry(it.id)), right = tried.filter((it) => lastTry(it.id).ok)
  const weeks = [...new Set(items.map((it) => it.w))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6" data-testid="skill-page" data-skill={sk} data-n={items.length}>
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription>{SUBJ[sub].name} · skill</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{sk}</CardTitle>
          <CardDescription data-testid="skill-summary">
            {items.length} question{items.length === 1 ? "" : "s"} in {groups.length} part{groups.length === 1 ? "" : "s"}, across {weeks.join(" ")}. She has tried {tried.length}{tried.length ? `, ${right.length} right the last time` : ""}.
          </CardDescription>
          {items.length ? (
            <CardAction>
              <Button size="sm" onClick={() => go(`${skillPath(sub, sk)}/practice`)} data-testid="skill-practice"><Play /> Practice this skill</Button>
            </CardAction>
          ) : null}
        </CardHeader>
      </Card>
      <Card className="gap-3 py-5">
        <CardHeader className="px-5">
          <CardTitle>What it covers</CardTitle>
          <CardDescription>Each part is one thing the skill asks; open it to see its questions as she sees them, with the answer a tap away.</CardDescription>
          <CardAction><Button size="sm" variant="ghost" onClick={() => { setAll((v) => !v); setOpened(new Set()) }} data-testid="skill-open-all">{all ? "Close all" : "Open all"}</Button></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-5">
          {groups.map(([name, list]) => (
            <SubskillGroup key={name} sub={sub} name={name} items={list} places={places} open={all || opened.has(name)}
              onToggle={() => setOpened((x) => { const y = new Set(x); if (y.has(name)) y.delete(name); else y.add(name); return y })} />
          ))}
          {!items.length ? <p className="text-muted-foreground text-sm">No questions in this skill yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

/** Up to twelve of the skill's questions: the ones she has never tried first, in an
 *  order fixed for the day, then the ones she tried longest ago. Answers count the way
 *  "Try another" does (`again`): a different question on the same skill. */
function practiceItems(sub, sk, seed) {
  const items = skillItems(sub, sk)
  const at = (it) => { const t = lastTry(it.id); return t ? Date.parse(t.at) || 0 : 0 }
  const fresh = items.filter((it) => !at(it)).sort((a, b) => hash(seed + a.id) - hash(seed + b.id))
  const seen = items.filter((it) => at(it)).sort((a, b) => at(a) - at(b))
  return [...fresh, ...seen].slice(0, 12)
}
export function SkillRun({ sub, sk }) {
  const items = React.useMemo(() => practiceItems(sub, sk, new Date().toDateString()), [sub, sk])
  if (!items.length) return <SkillPage sub={sub} sk={sk} />
  return <Runner items={items} custom ctx="again" sub={sub} title={`${sk} · practice`} exitPath={skillPath(sub, sk)} exitLabel="Back to the skill" />
}
