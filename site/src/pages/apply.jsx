import * as React from "react"
import { CheckCircle2, ChevronRight, ClipboardCopy, History, NotebookPen, RotateCcw, Save, Send } from "lucide-react"

import { D, fmtDate } from "@/lib/content"
import { go } from "@/lib/router"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Input } from "@zhangqi444/ui/ui/input"
import { Label } from "@zhangqi444/ui/ui/label"
import { Textarea } from "@zhangqi444/ui/ui/textarea"

/* School application essays (content/applications.json).
 *
 * The portals say the student writes these herself, so this page is a desk, not a
 * helper: somewhere to write, a count against the school's limit, versions she can
 * go back to, and a copy button for pasting into the portal. Nothing here writes,
 * suggests or rewrites a word of hers.
 *
 * Stored in the `essays` slice under `app:<form>` — the weekly essays are keyed W1…W9,
 * so the two never meet, and the slice already syncs to Drive. Versions are merged by
 * id across devices (Store.merge), so a version saved on the iPad is never lost to an
 * edit on the laptop: learner input is sacred. */

export const forms = () => ((D.applications || {}).forms || [])
export const formById = (id) => forms().find((f) => f.id === id) || null
const key = (id) => "app:" + id
export function appState(id) { return (Store.s.essays || {})[key(id)] || {} }

export function words(t) { return (t || "").trim() ? (t.trim().match(/\S+/g) || []).length : 0 }
/** Sentences, counted the way a reader would: a run of text ending in . ! or ?, plus a
 *  trailing run with no stop. "Mr." will over-count by one; it is a guide, not a gate. */
export function sentences(t) {
  const s = (t || "").trim()
  if (!s) return 0
  return (s.match(/[^.!?]+[.!?]+["')\]]*/g) || []).length + (/[.!?]["')\]]*\s*$/.test(s) ? 0 : 1)
}

/** The questions she is answering on this form: every one, or the prompts she picked. */
export function activeQuestions(f, st) {
  if (f.prompts) return (st.picks || []).map((id) => f.prompts.find((p) => p.id === id)).filter(Boolean)
  return f.questions || []
}
/** Whether one answer meets the form's own rule. */
export function answerOk(f, q, text) {
  if (f.prompts) { const n = words(text); return n >= f.min_words && n <= f.max_words }
  if (q.short) return words(text) >= 1
  return sentences(text) >= 1
}
export function formProgress(f) {
  const st = appState(f.id)
  const qs = activeQuestions(f, st)
  const need = f.prompts ? f.choose : qs.length
  const done = qs.filter((q) => answerOk(f, q, (st.answers || {})[q.id])).length
  const started = Object.values(st.answers || {}).some((t) => t && t.trim())
  const status = st.ready ? "finished" : started ? "writing" : "not started"
  return { need, done, started, status, complete: done >= need && qs.length >= need, submitted: st.submitted || {} }
}
export function appsReady() { return forms().filter((f) => !!appState(f.id).ready).length }

function daysUntil(iso) {
  const d = new Date(iso + "T00:00:00"), now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 864e5)
}
function DueBadge({ f }) {
  const n = daysUntil(f.due)
  return (
    <Badge variant="outline" className="tabular-nums" data-testid={`apply-due-${f.id}`}>
      Due {fmtDate(f.due + "T12:00:00")}{n >= 0 ? ` · ${n} day${n === 1 ? "" : "s"}` : ""}
    </Badge>
  )
}
const STATUS_VARIANT = { finished: "success", writing: "warning", "not started": "outline" }

/* ---------- saving ---------- */
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {})
/** How long a pause before the next edit makes the old text worth keeping as its own
 *  version. A session is a sitting, so the text she left at the end of one is kept. */
const AUTO_GAP = 6 * 3600e3

function snapshot(cur, label, auto) {
  return { id: newId(), at: new Date().toISOString(), label: label || "", auto: !!auto, picks: [...(cur.picks || [])], answers: { ...(cur.answers || {}) } }
}
function lastVersion(cur) { const v = cur.versions || []; return v.length ? v[v.length - 1] : null }

/** Write one answer. Before the first edit of a new sitting, the text as she left it
 *  last time is kept as an automatic version, so every sitting can be gone back to. */
export function setAnswer(formId, qid, text) {
  Store.setSlice("essays", key(formId), (cur) => {
    const out = { ...cur, kind: "app" }
    const last = lastVersion(cur)
    const had = Object.values(cur.answers || {}).some((t) => t && t.trim())
    const quiet = Date.now() - Date.parse(cur.at || 0) > AUTO_GAP
    if (had && quiet && (!last || !same(last.answers, cur.answers))) out.versions = [...(cur.versions || []), snapshot(cur, "", true)]
    out.answers = { ...(cur.answers || {}), [qid]: text }
    return out
  })
}
export function saveVersion(formId, label) {
  Store.setSlice("essays", key(formId), (cur) => ({ ...cur, kind: "app", versions: [...(cur.versions || []), snapshot(cur, label)] }))
}
/** Bring an older version back. What is on the page now is kept as a version first,
 *  so going back is never a loss. */
export function restoreVersion(formId, vid) {
  Store.setSlice("essays", key(formId), (cur) => {
    const v = (cur.versions || []).find((x) => x.id === vid)
    if (!v) return cur
    const keep = same(lastVersion(cur) && lastVersion(cur).answers, cur.answers) ? [] : [snapshot(cur, "Before going back", true)]
    return { ...cur, versions: [...(cur.versions || []), ...keep], picks: [...(v.picks || [])], answers: { ...(cur.answers || {}), ...v.answers } }
  })
}
function setPicks(formId, picks) { Store.setSlice("essays", key(formId), (cur) => ({ ...cur, kind: "app", picks })) }
function setReady(formId, on) {
  Store.setSlice("essays", key(formId), (cur) => ({
    ...cur, kind: "app",
    ready: on ? new Date().toISOString() : null,
    versions: on ? [...(cur.versions || []), snapshot(cur, "Finished")] : cur.versions,
  }))
}
function setSubmitted(formId, school, on) {
  // What was sent is remembered, so the page can say when the text has moved on since.
  Store.setSlice("essays", key(formId), (cur) => ({
    ...cur, kind: "app",
    submitted: { ...(cur.submitted || {}), [school]: on ? new Date().toISOString() : null },
    sent: { ...(cur.sent || {}), [school]: on ? { ...(cur.answers || {}) } : null },
  }))
}

/** The answers as one block of text, ready to paste into the portal question by question. */
function portalText(f, st, answers) {
  return activeQuestions(f, { ...st, picks: st.picks }).map((q, i) => `${f.prompts ? `Essay #${i + 1} — ` : ""}${q.text}\n\n${(answers[q.id] || "").trim()}`).join("\n\n\n")
}

/* ---------- the list ---------- */
export function ApplyList() {
  useStore()
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="apply-list">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><NotebookPen className="size-4" /> School essays</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">The essays the schools asked for</CardTitle>
          <CardDescription>
            Write them here, come back to them as often as you like, and keep every version. When one is finished, copy it into the school's portal.
            The schools ask that you write these yourself — so the words here are all yours.
          </CardDescription>
        </CardHeader>
      </Card>
      {forms().map((f) => {
        const p = formProgress(f)
        const sent = f.schools.filter((s) => p.submitted[s])
        return (
          <Card key={f.id} className="gap-3 py-5" data-testid={`apply-card-${f.id}`}>
            <CardHeader className="px-5">
              <CardTitle>{f.title}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-1.5">
                For {f.schools.join(" and ")} <DueBadge f={f} />
              </CardDescription>
              <CardAction><Badge variant={STATUS_VARIANT[p.status]} data-testid={`apply-status-${f.id}`}>{p.status}</Badge></CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-5">
              <span className="text-muted-foreground text-sm tabular-nums">
                {p.done} of {p.need} {f.prompts ? "essays" : "answers"} the right length
                {sent.length ? ` · sent to ${sent.join(", ")}` : ""}
              </span>
              <Button onClick={() => go("/apply/" + f.id)} data-testid={`apply-open-${f.id}`}>{p.started ? "Keep writing" : "Start"} <ChevronRight /></Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/* ---------- one form ---------- */
function Count({ f, q, text }) {
  if (f.prompts) {
    const n = words(text), under = n < f.min_words, over = n > f.max_words
    return (
      <span className={cn("text-xs tabular-nums", !n ? "text-muted-foreground" : under || over ? "text-warning" : "text-success")} data-testid={`apply-count-${q.id}`}>
        {n} word{n === 1 ? "" : "s"} · {f.min_words}–{f.max_words}
        {n && under ? ` · ${f.min_words - n} to go` : ""}{over ? ` · ${n - f.max_words} over` : ""}
      </span>
    )
  }
  if (q.short) {
    const n = (text || "").split(/[,;\n]|\band\b/).map((x) => x.trim()).filter(Boolean).length
    return <span className={cn("text-xs tabular-nums", n === 3 ? "text-success" : "text-muted-foreground")} data-testid={`apply-count-${q.id}`}>{n} of 3</span>
  }
  const n = sentences(text), many = n > (f.few_sentences || 4) + 1
  return (
    <span className={cn("text-xs tabular-nums", !n ? "text-muted-foreground" : many ? "text-warning" : "text-success")} data-testid={`apply-count-${q.id}`}>
      {n} sentence{n === 1 ? "" : "s"} · {words(text)} words{many ? " · they asked for a few" : ""}
    </span>
  )
}

/** A debounced box bound to one answer. Saves half a second after she stops, and on blur. */
function AnswerBox({ f, q, n }) {
  const stored = (appState(f.id).answers || {})[q.id] || ""
  const [v, setV] = React.useState(stored)
  const timer = React.useRef(null)
  const pending = React.useRef(false)
  const latest = React.useRef(v)
  // Another device's edit lands through the store; take it unless she is mid-word.
  React.useEffect(() => { if (!pending.current) { setV(stored); latest.current = stored } }, [stored])
  // Leaving the page inside the half-second still saves what she typed.
  React.useEffect(() => () => { if (pending.current) { clearTimeout(timer.current); flush(latest.current) } }, [])
  function flush(val) { pending.current = false; if (val !== ((appState(f.id).answers || {})[q.id] || "")) setAnswer(f.id, q.id, val) }
  function onChange(e) { const val = e.target.value; setV(val); latest.current = val; pending.current = true; clearTimeout(timer.current); timer.current = setTimeout(() => flush(val), 500) }
  const id = `apply-${f.id}-${q.id}`
  const Comp = q.short ? Input : Textarea
  return (
    <div className="flex flex-col gap-2" data-testid={`apply-q-${q.id}`}>
      <Label htmlFor={id} className="block text-sm leading-snug font-semibold">{n ? <span className="text-muted-foreground mr-1">Essay #{n} ·</span> : null}{q.text}</Label>
      <Comp
        id={id}
        value={v}
        onChange={onChange}
        onBlur={() => { clearTimeout(timer.current); flush(v) }}
        rows={f.prompts ? 10 : 3}
        placeholder={f.prompts ? "Write your essay here" : q.short ? "Three words" : "No more than a few sentences"}
        className={cn(!q.short && "leading-relaxed", q.short ? "" : f.prompts ? "min-h-56" : "min-h-20")}
        spellCheck
        data-testid={`apply-input-${q.id}`}
      />
      <div className="flex justify-end"><Count f={f} q={q} text={v} /></div>
    </div>
  )
}

function PromptPicker({ f }) {
  const st = appState(f.id), picks = st.picks || [], answers = st.answers || {}
  function toggle(id) {
    if (picks.includes(id)) setPicks(f.id, picks.filter((x) => x !== id))
    else if (picks.length < f.choose) setPicks(f.id, [...picks, id])
  }
  return (
    <Card className="gap-3 py-5" data-testid="apply-picker">
      <CardHeader className="px-5">
        <CardTitle className="text-base">Pick {f.choose === 2 ? "two" : f.choose} prompts</CardTitle>
        <CardDescription>{picks.length} of {f.choose} picked. You can change your mind — anything you wrote for a prompt is kept even if you unpick it.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-5">
        {f.prompts.map((p) => {
          const on = picks.includes(p.id), full = !on && picks.length >= f.choose
          const kept = !on && words(answers[p.id])
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => toggle(p.id)}
              disabled={full}
              aria-pressed={on}
              className={cn("flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors", on ? "border-primary bg-primary/5" : "hover:bg-accent", full && "opacity-50")}
              data-testid={`apply-pick-${p.id}`}
            >
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold", on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                {on ? picks.indexOf(p.id) + 1 : ""}
              </span>
              <span className="flex-1">{p.text}{kept ? <span className="text-muted-foreground block text-xs">You have {kept} words on this one, kept.</span> : null}</span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}

function Versions({ f }) {
  const st = appState(f.id)
  const vs = [...(st.versions || [])].reverse()
  const [open, setOpen] = React.useState(false)
  const [look, setLook] = React.useState(null)
  const [label, setLabel] = React.useState("")
  const all = f.prompts ? f.prompts : f.questions
  const total = (a) => Object.values(a || {}).reduce((n, t) => n + words(t), 0)
  return (
    <Card className="gap-3 py-5" data-testid="apply-versions">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-base"><History className="size-4" /> Versions</CardTitle>
        <CardDescription>
          Save a version whenever you like. A version is also kept automatically each time you come back after a break, and when you mark it finished.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-5">
        <div className="flex flex-wrap gap-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name it (optional)" className="max-w-56" data-testid="apply-version-label" />
          <Button variant="outline" onClick={() => { saveVersion(f.id, label.trim()); setLabel(""); setOpen(true) }} data-testid="apply-save-version"><Save /> Save a version</Button>
          {vs.length ? <Button variant="ghost" onClick={() => setOpen(!open)} data-testid="apply-versions-toggle">{open ? "Hide" : "Show"} {vs.length} version{vs.length === 1 ? "" : "s"}</Button> : null}
        </div>
        {open ? (
          <ol className="flex flex-col divide-y rounded-lg border" data-testid="apply-version-list">
            {vs.map((v, i) => (
              <li key={v.id} className="flex flex-col gap-2 p-3" data-testid="apply-version">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{v.label || (v.auto ? "Kept automatically" : `Version ${vs.length - i}`)}</span>
                  <span className="text-muted-foreground tabular-nums">{fmtDate(v.at)} {new Date(v.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {total(v.answers)} words</span>
                  <span className="ml-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setLook(look === v.id ? null : v.id)}>{look === v.id ? "Close" : "Read"}</Button>
                    <Button size="sm" variant="outline" onClick={() => { restoreVersion(f.id, v.id); setLook(null) }} data-testid="apply-restore"><RotateCcw /> Bring back</Button>
                  </span>
                </div>
                {look === v.id ? (
                  <div className="bg-muted/40 flex flex-col gap-3 rounded-md p-3 text-sm whitespace-pre-wrap">
                    {all.filter((q) => (v.answers || {})[q.id] && v.answers[q.id].trim()).map((q) => (
                      <div key={q.id}><div className="text-muted-foreground mb-1 text-xs font-semibold">{q.text}</div>{v.answers[q.id]}</div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Finish({ f }) {
  const st = appState(f.id), p = formProgress(f)
  const [copied, setCopied] = React.useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(portalText(f, st, st.answers || {})); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) }
  }
  return (
    <Card className="gap-3 py-5" data-testid="apply-finish">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2 text-base"><Send className="size-4" /> When it is done</CardTitle>
        <CardDescription>
          {p.complete ? "Every answer is the right length." : `${p.done} of ${p.need} ${f.prompts ? "essays are" : "answers are"} the right length so far.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-5">
        <div className="flex flex-wrap gap-2">
          {st.ready ? (
            <Button variant="outline" onClick={() => setReady(f.id, false)} data-testid="apply-unready"><CheckCircle2 className="text-success" /> Finished {fmtDate(st.ready)} · keep editing</Button>
          ) : (
            <Button disabled={!p.complete} onClick={() => setReady(f.id, true)} data-testid="apply-ready"><CheckCircle2 /> I'm finished</Button>
          )}
          <Button variant="outline" onClick={copy} disabled={!p.started} data-testid="apply-copy"><ClipboardCopy /> {copied ? "Copied" : "Copy for the portal"}</Button>
        </div>
        <div className="flex flex-col gap-1.5 border-t pt-3">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Submitted in the portal</span>
          {f.schools.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-primary size-4" checked={!!(st.submitted || {})[s]} onChange={(e) => setSubmitted(f.id, s, e.target.checked)} data-testid={`apply-sent-${s.replace(/\s+/g, "-").toLowerCase()}`} />
              {s}{(st.submitted || {})[s] ? <span className="text-muted-foreground">· {fmtDate(st.submitted[s])}</span> : null}
            </label>
          ))}
          {f.schools.some((s) => (st.submitted || {})[s] && (st.sent || {})[s] && activeQuestions(f, st).some((q) => ((st.sent[s] || {})[q.id] || "") !== ((st.answers || {})[q.id] || ""))) ? (
            <p className="text-warning text-xs">Changed since it was sent — the portal still has the earlier text.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ApplyForm({ id }) {
  useStore()
  const f = formById(id)
  if (!f) return <ApplyList />
  const st = appState(f.id)
  const qs = activeQuestions(f, st)
  const p = formProgress(f)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid={`apply-form-${f.id}`}>
      <Card className="gap-3">
        <CardHeader>
          <CardDescription className="flex flex-wrap items-center gap-1.5">For {f.schools.join(" and ")} <DueBadge f={f} /></CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{f.title}</CardTitle>
          <CardAction><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></CardAction>
        </CardHeader>
        {/* One block below the header: CardHeader is a grid, and a run of descriptions
            in it is laid out in columns beside the title. */}
        <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
          <p>{f.intro}</p>
          {f.rule ? <p className="text-foreground font-medium">{f.rule}</p> : null}
          {f.prompts ? <p>Pick {f.choose === 2 ? "two" : f.choose} prompts. Each response is {f.min_words}–{f.max_words} words.{f.schools.length > 1 ? " One essay, sent to both schools." : ""}</p> : null}
          {f.hint ? <p>{f.hint}</p> : null}
        </CardContent>
      </Card>
      {f.prompts ? <PromptPicker f={f} /> : null}
      {qs.length ? (
        <Card className="gap-5 py-5">
          <CardContent className="flex flex-col gap-6 px-5">
            {qs.map((q, i) => <AnswerBox key={q.id} f={f} q={q} n={f.prompts ? i + 1 : 0} />)}
          </CardContent>
        </Card>
      ) : null}
      <Versions f={f} />
      <Finish f={f} />
    </div>
  )
}
