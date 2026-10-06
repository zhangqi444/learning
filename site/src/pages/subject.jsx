import * as React from "react"
import { ChevronRight, Play } from "lucide-react"

import { D, SETSIZE, SUBJ, currentWeek, itemsFor, nextSet, setAddedAfter, setId, setsFor, subjProgress, weekLabel } from "@/lib/content"
import { go, href } from "@/lib/router"
import { Store, useStore } from "@/lib/store"
import { PLACE } from "@/lib/world"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Progress } from "@zhangqi444/ui/ui/progress"
import { precisionSummary } from "@/pages/precision"
import { masteryOf, pacingFor, skillTable, skillsFor } from "@/lib/engine"
import { SKILL_SHOWS, tally } from "@/lib/tally"
import { LevelBadge } from "@/pages/score"
import { AopsHint } from "@/components/aops-hint"
import { ShowFilter, TallyHead, TallyRow } from "@/components/tally"
import { aopsFor } from "@/lib/aops"
import { skillPath } from "@/pages/skill"

function ScoreBadge({ r, part, n }) {
  /* "Not started" was said about a set with nine answers in it, because the only
     thing this badge had ever been able to see was a finished result. She read
     it, believed it, and had no reason not to. */
  if (!r && part) return <Badge variant="secondary" className="tabular-nums" data-testid="set-part" data-answered={part}>{part}/{n} so far</Badge>
  if (!r) return <Badge variant="outline" className="text-muted-foreground">Not started</Badge>
  const pct = r.right / r.n
  return <Badge variant={pct >= 0.75 ? "success" : pct >= 0.5 ? "warning" : "destructive"} className="tabular-nums">{r.right}/{r.n}</Badge>
}

export function WeekCard({ sub, wk, highlight }) {
  const store = useStore()
  const sets = setsFor(sub, wk)
  let done = 0
  sets.forEach((_, n) => { if (store.s.results[setId(sub, wk, n)]) done++ })
  return (
    <Card className={cn("gap-3 py-5", highlight && "border-primary/50 ring-primary/15 ring-2")}>
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2">
          {wk} <span className="text-muted-foreground font-normal">· {weekLabel(wk)}</span>
          {highlight && <Badge>This week</Badge>}
        </CardTitle>
        <CardDescription>{sub === "vr" ? "Session 1 is written; the sets after it are ISEE-style. " : ""}{itemsFor(sub, wk).length} questions · {sets.length} sets of up to {SETSIZE}. Each set is one sitting.</CardDescription>
        <CardAction>
          <Badge variant={done === sets.length && sets.length ? "success" : done ? "warning" : "secondary"} className="tabular-nums">
            {done}/{sets.length} sets
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2">
        <ul className="flex flex-col">
          {sub === "vr" && D.precision && D.precision[wk] ? (() => {
            const ps = precisionSummary(wk)
            return (
              <li key="precision">
                <button
                  type="button"
                  onClick={() => go(`/precision/${wk}`)}
                  className="hover:bg-accent/60 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px]"
                  data-testid="precision-row"
                >
                  <span className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold">S1</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">Session 1 · Precision review</span>
                    <span className="text-muted-foreground text-xs">{ps.total} words to explain in your own words · {D.precision[wk]?.minutes || "20–25 min"}{ps.submitted ? ` · submitted${ps.submittedAt ? " " + new Date(ps.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}` : ""}</span>
                  </span>
                  {ps.submitted ? <Badge variant={ps.due ? "warning" : "success"} className="tabular-nums">{ps.due ? `${ps.due} to review` : "Mastered"}</Badge> : <Badge variant="outline" className="text-muted-foreground tabular-nums">{ps.written}/{ps.total} written</Badge>}
                  <ChevronRight className="text-muted-foreground size-4" />
                </button>
              </li>
            )
          })() : null}
          {sets.map((set, n) => {
            const r = store.s.results[setId(sub, wk, n)]
            /* Only asked about a set she has not done: a set she HAS done needs
               no account of where it came from. */
            const grew = r ? null : setAddedAfter(sub, wk, n)
            const part = Store.draftAnswered(setId(sub, wk, n))
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => go(`/run/${sub}/${wk}/${n}`)}
                  className="hover:bg-accent/60 focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-[3px]"
                >
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums">{n + 1}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">Set {n + 1}</span>
                    <span className="text-muted-foreground text-xs">{set.length} questions{r ? ` · done${r.at ? " " + new Date(r.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""} · tap to see your answers` : part ? " · started · tap to carry on where you left off" : ""}</span>
                    {/* Said plainly, because the alternative is her doing the
                        arithmetic herself and getting "the site lost my work". */}
                    {grew ? (
                      <span className="text-muted-foreground/80 text-xs" data-testid="set-added" data-added={grew.added}>
                        added {new Date(grew.added + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}, after you finished this week
                      </span>
                    ) : null}
                  </span>
                  <ScoreBadge r={r} part={part} n={set.length} />
                  <ChevronRight className="text-muted-foreground size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

/** A skill worth relearning rather than just practising again. */
const weak = (k) => k.attempted && (k.level === "Needs work" || k.level === "Started" || (k.acc != null && k.acc < 0.75))

/** "W1–W3, W5": the weeks a skill's questions sit in, runs folded. */
function weekSpan(weeks) {
  const ns = weeks.map((w) => Number(String(w).slice(1))).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < ns.length; ) {
    let j = i
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++
    out.push(i === j ? `W${ns[i]}` : `W${ns[i]}–W${ns[j]}`)
    i = j + 1
  }
  return out.join(", ")
}
const SKILLS_NONE = { practiced: "No skill practised yet — levels appear after the first set.", missed: "Nothing missed in this subject.", untried: "Every skill here has been tried." }

/** A subject's skills as one list, in the word bank's shape (the owner, 6 October 2026: "to
 *  the skills, should follow the vocabulary list, to see more statistic data"): each skill's
 *  questions, her answers on them — done, right, wrong and when — counted by lib/tally.js as a
 *  word's are, and the skill's level on the mastery ladder beside them. Weakest first;
 *  Missed puts the most wrong answers first, as the word bank's Missed does.
 *
 *  A phone has no room for seven columns. This card once kept four in an overflow box, and a
 *  hundred and twenty-seven pixels of it sat off the edge behind a sideways scroll nobody could
 *  see; the row folds its numbers into one line under the name instead (components/tally.jsx),
 *  and the level stays beside the name at every width. Nothing is lost at any width. */
export function SkillsCard({ sub }) {
  const skills = skillsFor(sub)
  const table = skillTable(sub)
  const rows = skills.map((k) => ({ k, t: tally((table[k.sk] || {}).ids || []) }))
  const m = masteryOf(sub), pace = pacingFor(sub)
  const keepOf = (id) => (SKILL_SHOWS.find((s) => s.id === id) || SKILL_SHOWS[0]).keep
  const count = (id) => rows.filter(({ t }) => keepOf(id)(t)).length
  const practiced = count("practiced")
  const [show, setShow] = React.useState(() => (practiced ? "practiced" : "all"))
  let shown = rows.filter(({ t }) => keepOf(show)(t))
  if (show === "missed") shown = [...shown].sort((a, b) => b.t.wrong - a.t.wrong || a.k.sk.localeCompare(b.k.sk))
  return (
    <Card className="gap-3 py-5" data-testid="skills" data-shown={shown.length}>
      <CardHeader className="px-5">
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          {practiced ? `${m.mastered} mastered · ${m.proficient} proficient · ${practiced} of ${skills.length} practiced` : `${skills.length} skills in this subject — levels appear after the first set`}
          {pace.n >= 8 ? ` · median ${Math.round(pace.median)} s a question against a ${pace.budget} s budget` : ""}
        </CardDescription>
        <CardDescription className="text-xs">
          Each skill opens its questions. Done, right and wrong count her answers on them the way the word bank counts a word's — sets, reviews, mixed sets and practice, never a corrections pass, where she has just seen the answer. Level is where its questions stand now.
        </CardDescription>
        {sub === "vr" ? (
          <CardDescription className="text-xs">
            <a href={href("/vocab")} className="hover:text-primary underline decoration-dotted underline-offset-4" data-testid="vocab-from-vr">Every word</a> in these questions and on her lists, with the questions that test each one and her answers on them.
          </CardDescription>
        ) : null}
        {shown.some(({ k }) => weak(k) && aopsFor(sub, k.sk)) ? <CardDescription className="text-xs">Weak skills carry the free Alcumus topic that drills them — hover for the Prealgebra chapter and the Beast Academy unit behind it.</CardDescription> : null}
        <ShowFilter className="pt-1" shows={SKILL_SHOWS} show={show} count={count} prefix="skills" onShow={setShow} />
      </CardHeader>
      <CardContent className="px-5">
        <TallyHead first="Skill" second="Weeks" extra="Level" />
        <ul className="divide-y">
          {shown.map(({ k, t }) => (
            <TallyRow key={k.sk} testid="skill-row" t={t} data={{ "data-sk": k.sk }}
              name={<>
                {/* Every skill opens its questions (pages/skill.jsx) — the owner, 5 October 2026. */}
                <a href={href(skillPath(sub, k.sk))} className="hover:text-primary decoration-muted-foreground/60 font-medium underline decoration-dotted underline-offset-4" data-testid="skill-link">{k.sk}</a>
                {k.overdue ? <span className="text-warning text-xs">{k.overdue} due</span> : null}
                {weak(k) && aopsFor(sub, k.sk) ? <span className="basis-full"><AopsHint sub={sub} skill={k.sk} inline /></span> : null}
              </>}
              desc={weekSpan(k.weeks)}
              extra={<LevelBadge level={k.level} />} />
          ))}
        </ul>
        {!shown.length ? <p className="text-muted-foreground py-3 text-sm" data-testid="skills-none-shown">{SKILLS_NONE[show]}</p> : null}
      </CardContent>
    </Card>
  )
}

export function Subject({ sub, wk }) {
  useStore()
  const p = subjProgress(sub)
  const nx = nextSet(sub)
  const cur = currentWeek()
  const weeks = wk ? D.weeks.filter((w) => w.w === wk) : D.weeks
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">{SUBJ[sub].name}</CardTitle>
          {/* The place is said beside the subject, never instead of it: on the day
              it counts the paper will say Verbal Reasoning, and a name she has to
              translate back is a name that has failed. */}
          <CardDescription>{SUBJ[sub].blurb}{PLACE[sub] ? ` · ${PLACE[sub]}` : ""}</CardDescription>
          <CardAction>
            {nx ? (
              <Button onClick={() => go(`/run/${sub}/${nx.wk}/${nx.n}`)}><Play /> Continue</Button>
            ) : (
              <Badge variant="success">All sets done</Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={p.pct} className="h-1.5" />
          <div className="text-muted-foreground flex flex-wrap gap-x-4 text-sm tabular-nums">
            <span>{p.done} of {p.total} sets done</span>
            {p.acc != null && <span>{p.acc}% accuracy</span>}
          </div>
        </CardContent>
      </Card>
      {!wk && <SkillsCard sub={sub} />}
      {weeks.map((w) => (
        <WeekCard key={w.w} sub={sub} wk={w.w} highlight={w.w === cur} />
      ))}
    </div>
  )
}
