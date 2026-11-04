import * as React from "react"
import { RotateCcw, X } from "lucide-react"

import { ORDER, SUBJ, fmtDate } from "@/lib/content"
import { go, href, queryString, routeQuery, setRouteQuery } from "@/lib/router"
import { useStore } from "@/lib/store"
import { FILTER_KEYS, REDO_SITTING, SORTS, STATUS, applyFilters, placeOptions, questionRows, sortRows, withResults } from "@/lib/questions"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { ShowFilter } from "@/components/tally"
import { QuestionRow, skillPath } from "@/pages/skill"

/* Every question in a subject, or in all four, narrowed any way at once: by how she did on it, by
 * skill, by week or paper, and sorted three ways (lib/questions.js says what each means). The
 * subject page shows one subject; /questions shows all four, and the Score page links to it.
 *
 * The filters live in the address as well as on screen, so opening a skill from a row and
 * coming back finds the list as it was left — the skill page's own filter forgot itself on every
 * visit, which is half of why it did not work for a subject with thirty skills. Each row keeps
 * its answer behind its own tap, the way the skill page, the mock report and the weekly page do. */

const PAGE = 25
const NONE = {
  missed: "Nothing missed here.",
  redo: "Nothing waiting to redo here: every wrong one has been redone right since.",
  twice: "No question here has been missed twice.",
  guessed: "No right answer here was marked as a guess.",
  tried: "She has not answered any of these yet.",
  untried: "She has answered every question here.",
  all: "No questions here.",
}

function Pick({ label, value, onChange, testid, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid}
        className="border-input dark:bg-input/30 h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-sm">
        {children}
      </select>
    </label>
  )
}

/** How the question stands on redo, said on its row. Plain text, never red: red means due now. */
function RedoNote({ r }) {
  const last = r.redo.last
  return (
    <>
      {last ? (
        <span data-testid="qlist-redone" data-ok={last.ok ? "1" : "0"}>
          · redone {fmtDate(last.at)}, {last.ok ? "right" : `wrong${last.pick ? ` (chose ${last.pick})` : ""}`}
        </span>
      ) : null}
      {r.redo.need ? <Badge variant="outline" className="text-[11px] font-normal" data-testid="qlist-to-redo">to redo</Badge> : null}
    </>
  )
}

export function QuestionBrowser({ sub, defaults, testid = "qlist" }) {
  useStore()
  const base = { sub: sub || "", status: "missed", sk: "", wk: "", sort: "plan", ...(defaults || {}) }
  const [f, setF] = React.useState(() => {
    const q = routeQuery(), out = { ...base }
    for (const k of FILTER_KEYS) if (q[k] != null) out[k] = q[k]
    if (sub) out.sub = sub
    if (!STATUS.some((s) => s.id === out.status)) out.status = base.status
    return out
  })
  const [limit, setLimit] = React.useState(PAGE)
  const update = (patch) => {
    const next = { ...f, ...patch }
    setF(next); setLimit(PAGE)
    const q = routeQuery()
    for (const k of FILTER_KEYS) { if (next[k] !== base[k] && !(k === "sub" && sub)) q[k] = next[k]; else delete q[k] }
    setRouteQuery(q)
  }

  const rows = withResults(questionRows(sub ? [sub] : ORDER))
  const shown = sortRows(applyFilters(rows, f), f.sort)
  const countStatus = (id) => applyFilters(rows, { ...f, status: id }).length
  const tally = (key, skip) => { const m = new Map(); for (const r of applyFilters(rows, f, { skip })) m.set(r[key], (m.get(r[key]) || 0) + 1); return m }
  const bySk = tally("sk", "sk"), byWk = tally("wk", "wk"), bySub = tally("sub", "sub")
  const skills = [...new Set(rows.filter((r) => !f.sub || r.sub === f.sub).map((r) => r.sk))].sort((a, b) => a.localeCompare(b))
  const placeOpts = placeOptions(rows.filter((r) => !f.sub || r.sub === f.sub))
  const toRedo = applyFilters(rows, { ...f, status: "redo" }).length
  const changed = FILTER_KEYS.some((k) => !(k === "sub" && sub) && f[k] !== base[k])
  const from = (location.hash || "#/").slice(1)

  return (
    <div className="flex flex-col gap-3" data-testid={testid} data-n={shown.length} data-status={f.status} data-sk={f.sk} data-wk={f.wk} data-sub={f.sub} data-to-redo={toRedo}>
      <ShowFilter shows={STATUS} show={f.status} count={countStatus} prefix={testid} onShow={(id) => update({ status: id })} />
      <div className={cn("grid grid-cols-2 gap-2", sub ? "sm:grid-cols-3" : "sm:grid-cols-4")}>
        {sub ? null : (
          <Pick label="Subject" value={f.sub} onChange={(v) => update({ sub: v, sk: "", wk: "" })} testid={testid + "-sub"}>
            <option value="">All subjects · {[...bySub.values()].reduce((a, b) => a + b, 0)}</option>
            {ORDER.map((s) => <option key={s} value={s}>{SUBJ[s].short} · {bySub.get(s) || 0}</option>)}
          </Pick>
        )}
        <Pick label="Skill" value={f.sk} onChange={(v) => update({ sk: v })} testid={testid + "-skill"}>
          <option value="">Every skill · {[...bySk.values()].reduce((a, b) => a + b, 0)}</option>
          {skills.map((k) => <option key={k} value={k}>{k} · {bySk.get(k) || 0}</option>)}
        </Pick>
        <Pick label="Week or paper" value={f.wk} onChange={(v) => update({ wk: v })} testid={testid + "-week"}>
          <option value="">Every week · {[...byWk.values()].reduce((a, b) => a + b, 0)}</option>
          {placeOpts.map((o) => <option key={o.id} value={o.id}>{o.label} · {byWk.get(o.id) || 0}</option>)}
        </Pick>
        <Pick label="Order" value={f.sort} onChange={(v) => update({ sort: v })} testid={testid + "-sort"}>
          {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Pick>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm tabular-nums" data-testid={testid + "-count"}>{shown.length} question{shown.length === 1 ? "" : "s"}</span>
        {f.sk ? <a href={href(skillPath(f.sub || shown[0]?.sub || sub, f.sk))} className="hover:text-primary text-sm underline decoration-dotted underline-offset-4" data-testid={testid + "-skill-page"}>{f.sk}: its page</a> : null}
        {changed ? <Button size="sm" variant="ghost" className="h-7" onClick={() => update({ ...base, sub: sub || base.sub })} data-testid={testid + "-clear"}><X /> Clear filters</Button> : null}
        <span className="flex-1" />
        {/* Redo first, then the similar ones (the owner, 4 November 2026). The run is the questions
            still waiting to redo under the filters above, one sitting at a time; every miss in it
            has "Try another … question" on the score card after, and the review asks the rest. */}
        {toRedo ? (
          <Button size="sm" onClick={() => go("/redo" + queryString({ sub: f.sub, sk: f.sk, wk: f.wk, sort: f.sort, from }))} data-testid={testid + "-redo"} data-n={Math.min(toRedo, REDO_SITTING)}>
            <RotateCcw /> Redo {Math.min(toRedo, REDO_SITTING)}{toRedo > REDO_SITTING ? ` of ${toRedo}` : ""} wrong
          </Button>
        ) : null}
      </div>
      {shown.length ? (
        <ul className="divide-y rounded-lg border px-3" data-testid={testid + "-list"}>
          {shown.slice(0, limit).map((r) => (
            <QuestionRow key={r.id} it={r.it} where={sub ? r.where : `${SUBJ[r.sub].short} · ${r.where}`} testid={testid + "-row"}
              data={{ "data-sub": r.sub, "data-sk": r.sk, "data-wk": r.wk, "data-to-redo": r.redo.need ? "1" : "0" }}
              extra={<>
                <a href={href(skillPath(r.sub, r.sk))} className="hover:text-primary underline decoration-dotted underline-offset-4" data-testid="qlist-row-skill">{r.sk}</a>
                <RedoNote r={r} />
              </>} />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground py-2 text-sm" data-testid={testid + "-none"}>{NONE[f.status] || NONE.all}</p>
      )}
      {shown.length > limit ? (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => setLimit((n) => n + PAGE * 2)} data-testid={testid + "-more"}>Show more ({shown.length - limit} left)</Button>
      ) : null}
    </div>
  )
}
