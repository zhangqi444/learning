import * as React from "react"
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, ExternalLink, FilePlus, FileText, Flag, ImageIcon, Link2, PenLine, Play, RotateCcw, Save, Send, Swords, Timer, Trash2, Upload } from "lucide-react"

import { D, LTR, keyOf } from "@/lib/content"
import { W } from "@/lib/world"
import { go } from "@/lib/router"
import { DRIVE_ENABLED, Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Progress } from "@zhangqi444/ui/ui/progress"
import { MissProgress, MissStage } from "@/components/miss-status"
import { RadioGroup } from "@zhangqi444/ui/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zhangqi444/ui/ui/table"
import { Textarea } from "@zhangqi444/ui/ui/textarea"
import { Input } from "@zhangqi444/ui/ui/input"
import { Label } from "@zhangqi444/ui/ui/label"
import { ActionBar, CauseTags, Choice, Passage, Runner } from "@/pages/runner"
import { Figure } from "@/components/figure"
import { reviewsFor } from "@/lib/reviews"
import { ReviewCard } from "@/components/review-card"
import { learnName } from "@/lib/aops"
import { LearnCard } from "@/components/learn-card"
import { ISEE_LOWER_SECTIONS, STANINE, addPaperAttachment, createOfflinePaper, markRedone, paperAttachments, removePaperAttachment, mockBand, mockNextSteps, offlinePaper, offlinePapers, offlineResult, paperRedone, paperSkill, paperSkillOptions, recordMockForm, recordOfflineMisses, removePaper, setPaperFile, setPaperLink, skillOf, tagPaperMiss } from "@/lib/engine"

/* ---------- state helpers ---------- */
export function mockState(form) { return Store.s.mocks[form] || { sections: {} } }
export function mockDef(form) { return D.mocks.find((m) => m.id === form) }
export function scoredSections(m) { return m.sections.filter((s) => s.n) }
export function mockSummary(form) {
  const m = mockDef(form), st = mockState(form)
  const secs = scoredSections(m)
  let right = 0, n = 0, done = 0
  for (const s of secs) { const r = (st.sections || {})[s.id]; if (r && r.submittedAt) { done++; right += r.right || 0; n += s.n } }
  const essayDone = !!(st.essay && st.essay.submittedAt)
  const complete = done === secs.length && essayDone
  const started = done > 0 || essayDone || Object.values(st.sections || {}).some((r) => r && r.started)
  return { right, n, done, total: secs.length, essayDone, complete, started, finishedAt: st.finishedAt }
}
function fmt(ms) { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "" }

/* ---------- list ---------- */
export function MockList() {
  useStore()
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Timer className="size-4" /> Mock exams</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Four full-length Lower Level forms, timed like the real day</CardTitle>
          <CardDescription>{D.calendar.level.order}. Use only the allowed time; the timer keeps running if the page is closed. Answers and notes unlock when the whole form is finished.</CardDescription>
        </CardHeader>
      </Card>
      <BandCard />
      <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2">
        {D.mocks.map((m) => {
          const s = mockSummary(m.id)
          return (
            <Card key={m.id} className="gap-3 py-5">
              <CardHeader className="px-5">
                <CardTitle className="flex items-center gap-2"><Swords className="text-primary size-4 shrink-0" />{m.name}</CardTitle>
                <CardDescription>{m.blurb}</CardDescription>
                <CardAction>
                  {s.complete ? <Badge variant="success" className="tabular-nums">{s.right}/{s.n}</Badge> : s.started ? <Badge variant="warning">{s.done}/{s.total} sections</Badge> : <Badge variant="outline">{m.label}</Badge>}
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center gap-3 px-5">
                <Button size="sm" onClick={() => go("/mock/" + m.id)} data-testid={`mock-open-${m.id}`}>{s.complete ? "Results" : s.started ? "Continue" : "Open"} <ChevronRight /></Button>
                <span className="text-muted-foreground text-xs">Scheduled {m.label}</span>
              </CardContent>
            </Card>
          )
        })}
        {offlinePapers().map((m) => {
          const sc = offlineScores(m.id), k = Object.keys(sc.by).length
          return (
            <Card key={m.id} className="gap-3 py-5" data-testid={`offline-card-${m.id}`}>
              <CardHeader className="px-5">
                <CardTitle className="flex items-center gap-2"><FileText className="text-primary size-4 shrink-0" />{m.name}</CardTitle>
                <CardDescription>{m.blurb || (m.source ? m.source : "A paper sat on paper, added from this page.")}</CardDescription>
                <CardAction>
                  {k === m.sections.length ? <Badge variant="outline" className="tabular-nums">{sc.right}/{sc.n}</Badge> : k ? <Badge variant="outline">{k}/{m.sections.length} sections</Badge> : <Badge variant="outline">On paper</Badge>}
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center gap-3 px-5">
                <Button size="sm" variant="outline" onClick={() => go("/mock/" + m.id)} data-testid={`offline-open-${m.id}`}>{k ? "Results" : "Enter results"} <ChevronRight /></Button>
                <span className="text-muted-foreground text-xs">Taken offline · no timer here</span>
              </CardContent>
            </Card>
          )
        })}
        <Card className="gap-3 border-dashed py-5" data-testid="paper-add-card">
          <CardHeader className="px-5">
            <CardTitle className="flex items-center gap-2"><FilePlus className="text-primary size-4 shrink-0" />Add a paper sat on paper</CardTitle>
            <CardDescription>A practice test from a book or a website. Attach its PDF or a link, then enter her scores and the questions she missed: the misses come back in review and the paper counts in the score band.</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <Button size="sm" variant="outline" onClick={() => go("/mock/add")} data-testid="paper-add-open"><FilePlus /> Add a paper</Button>
          </CardContent>
        </Card>
      </div>
      {(() => {
        const gone = offlinePapers({ removed: true }).filter((p) => p.own && p.removed)
        return gone.length ? (
          <p className="text-muted-foreground text-xs" data-testid="papers-removed">
            Removed: {gone.map((p, i) => <React.Fragment key={p.id}>{i ? ", " : ""}<button type="button" className="underline underline-offset-2" onClick={() => go("/mock/" + p.id)}>{p.name}</button></React.Fragment>)} — open one to put it back.
          </p>
        ) : null
      })()}
    </div>
  )
}

/* ---------- a paper sat offline ----------
 *
 * Some practice happens on paper, away from the site — a published practice test
 * from a book, marked at home with the book's own key. The site keeps the
 * paper's shape (from content/offline_mocks.json) and the scores a parent types
 * in, and nothing else: no questions, no key, no timer, because the paper is a
 * copyrighted book and the sitting happened somewhere the site cannot see.
 *
 * The scores are her work, so they are a log, never a field that is written
 * over: each save appends an entry, the newest entry that names a section is
 * what the page shows, and Store.merge unions the log across devices.
 *
 * Since the owner's decision of 4 October 2026 it counts: once every section is
 * in, mockBand() lists it beside the site's papers, so it reaches the band,
 * readiness and recent accuracy; and the question numbers she missed, typed in
 * per section, become review anchors (lib/engine.js, recordOfflineMisses). It
 * stays out of the Den and the rewards, which count papers sat here. */
export function offlineDef(id) { return offlinePaper(id) }
export function offlineScores(id) { return offlineResult(id) || { by: {}, missed: {}, right: 0, n: 0, entries: [], sat: null, at: null, complete: false } }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }
function fmtDay(key) { return key ? new Date(key + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "" }

export function OfflineMock({ form }) {
  useStore()
  const m = offlineDef(form)
  const sc = offlineScores(form)
  const [vals, setVals] = React.useState(() => Object.fromEntries((m ? m.sections : []).map((s) => [s.id, sc.by[s.id] ? String(sc.by[s.id].right) : ""])))
  const [sat, setSat] = React.useState(sc.sat || todayKey())
  // The circled numbers on the marked sheet, per section. Each becomes a review
  // anchor on the skill the paper's map gives it (lib/engine.js, recordOfflineMisses).
  const [missedIn, setMissedIn] = React.useState(() => Object.fromEntries((m ? m.sections : []).map((s) => [s.id, sc.missed[s.id] ? sc.missed[s.id].nums.join(", ") : ""])))
  const [msg, setMsg] = React.useState(null)
  // A result that arrives from another device after the page opened fills an
  // empty box, so the next save does not read it as a blank; a box with
  // something typed in it is left alone.
  const byKey = JSON.stringify(sc.by)
  React.useEffect(() => {
    setVals((x) => { const y = { ...x }; for (const [k, r] of Object.entries(sc.by)) if (!(y[k] || "").trim()) y[k] = String(r.right); return y })
  }, [byKey]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return null
  const total = m.sections.reduce((a, s) => a + s.n, 0)
  const all = Object.keys(sc.by).length === m.sections.length

  function save() {
    const scores = {}, missed = {}, bad = [], notes = []
    for (const s of m.sections) {
      const v = (vals[s.id] || "").trim()
      let k = null
      if (v !== "") {
        k = Number(v)
        if (!/^\d+$/.test(v) || k > s.n) { bad.push(`${s.name} must be a whole number from 0 to ${s.n}`); continue }
        if (!sc.by[s.id] || sc.by[s.id].right !== k || sc.sat !== sat) scores[s.id] = k
      }
      const mv = (missedIn[s.id] || "").trim()
      if (mv !== "") {
        const nums = [...new Set(mv.split(/[\s,;]+/).filter(Boolean).map(Number))]
        if (nums.some((x) => !Number.isInteger(x) || x < 1 || x > s.n)) { bad.push(`${s.name} missed questions must be numbers from 1 to ${s.n}`); continue }
        nums.sort((p, q) => p - q)
        if (nums.join(",") !== (sc.missed[s.id] ? sc.missed[s.id].nums.join(",") : "")) missed[s.id] = nums
        const right = k != null ? k : sc.by[s.id] ? sc.by[s.id].right : null
        if (right != null && s.n - right !== nums.length) notes.push(`${s.name} lists ${nums.length} missed, but ${right} right of ${s.n} leaves ${s.n - right}`)
      }
    }
    if (bad.length) { setMsg({ err: true, text: bad.join(". ") + "." }); return }
    if (!Object.keys(scores).length && !Object.keys(missed).length) { setMsg({ err: true, text: "Nothing new to save — type the number right in at least one section, or the questions she missed." }); return }
    const at = new Date().toISOString()
    const entry = { id: at + ":" + Math.random().toString(36).slice(2, 8), at, sat, scores, ...(Object.keys(missed).length ? { missed } : {}) }
    Store.setSlice("mocks", form, (cur) => ({ ...cur, offline: true, entries: [...(Array.isArray(cur.entries) ? cur.entries : []), entry] }))
    const anchors = recordOfflineMisses(form)
    setMsg({ err: false, text: "Saved to her record." + (anchors ? ` ${anchors} missed question${anchors === 1 ? "" : "s"} joined the review pile.` : "") + (notes.length ? ` Check: ${notes.join("; ")}.` : "") })
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><FileText className="size-4" /> {W.longNight} · on paper</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{m.name}</CardTitle>
          <CardDescription>{m.blurb || "A paper sat on paper, added from the Mock exams page."}</CardDescription>
          <CardAction className="min-w-0">
            {all ? (
              <div className="text-right" data-testid="offline-total">
                <div className="text-3xl font-semibold tabular-nums">{sc.right}<span className="text-muted-foreground text-base font-normal"> / {sc.n}</span></div>
                <div className="text-muted-foreground text-xs">raw correct</div>
              </div>
            ) : <Badge variant="outline" data-testid="offline-badge">Offline</Badge>}
          </CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
          <div data-testid="offline-howto">Taken offline: the booklet and the answer sheet are the paper, so there is no timer and no questions on this page. Time each section yourself, as the book says.</div>
          {m.source ? <div><span className="text-foreground font-medium">Source:</span> {m.source}.</div> : null}
          {m.file && !m.own ? <div><span className="text-foreground font-medium">File:</span> {m.file}{m.key ? "" : " — it has no answer key, so mark it with the key in the book"}.</div> : null}
        </CardContent>
      </Card>

      {m.removed ? (
        <Card className="border-warning gap-2 py-4" data-testid="paper-removed">
          <CardContent className="flex flex-wrap items-center gap-3 px-5 text-sm">
            <span>This paper is off the list and out of the score band. Her results are still in her record.</span>
            <Button size="sm" variant="outline" onClick={() => removePaper(form, false)} data-testid="paper-restore"><RotateCcw /> Put it back</Button>
          </CardContent>
        </Card>
      ) : null}

      <PaperFileCard p={m} />
      <PaperSheetsCard p={m} />

      <Card className="gap-2 py-5">
        <CardHeader className="px-5">
          <CardTitle>Sections <span className="text-muted-foreground font-normal">· in order, one sitting</span></CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <Table>
            <TableHeader><TableRow><TableHead>Section</TableHead><TableHead className="text-right">Raw</TableHead><TableHead className="text-right">Percent</TableHead></TableRow></TableHeader>
            <TableBody>
              {m.sections.map((s) => {
                const r = sc.by[s.id], mi = (sc.missed || {})[s.id]
                return (
                  <TableRow key={s.id} data-testid="offline-row" data-sec={s.id} data-shape={`${s.n}/${s.min}`}>
                    <TableCell className="whitespace-normal"><div className="font-medium">{s.name}</div><div className="text-muted-foreground text-xs tabular-nums">{s.n} questions · {s.min} min</div></TableCell>
                    <TableCell className="text-right tabular-nums" data-testid="offline-raw">{r ? `${r.right}/${s.n}` : "—"}{mi && mi.nums.length ? <div className="text-muted-foreground text-xs whitespace-normal" data-testid="offline-missed">Missed {mi.nums.join(", ")}</div> : null}</TableCell>
                    <TableCell className="text-right tabular-nums">{r ? `${Math.round((r.right / s.n) * 100)}%` : "—"}</TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell className="whitespace-normal"><div className="font-medium">Essay</div><div className="text-muted-foreground text-xs tabular-nums">{m.essay.min} min · not scored, the schools read it</div></TableCell>
                <TableCell className="text-right">—</TableCell>
                <TableCell className="text-right">—</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-muted-foreground mt-3 text-xs">{total} questions in all. {sc.sat ? `Taken ${fmtDay(sc.sat)}. ` : ""}Once every section is in, this paper counts in the score band and in readiness like a paper sat here, and each question she missed sends two of its kind into the review pile.</p>
        </CardContent>
      </Card>

      <PaperMissesCard p={m} sc={sc} />

      <Card className="gap-4 py-5">
        <CardHeader className="px-5">
          <CardTitle>{sc.entries.length ? "Change the results" : "Enter the results"}</CardTitle>
          <CardDescription>The number right in each section, once the paper is marked. Fill in what you have; the rest can follow later. A change is added to her record beside the old one, never written over it.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-5">
          <div className="grid grid-cols-1 gap-3 @md/main:grid-cols-2 @3xl/main:grid-cols-4">
            {m.sections.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5">
                <Label htmlFor={`off-${s.id}`} className="text-muted-foreground text-xs">{s.name} <span className="tabular-nums">(of {s.n})</span></Label>
                <Input id={`off-${s.id}`} inputMode="numeric" value={vals[s.id] || ""} onChange={(e) => { const v = e.target.value; setVals((x) => ({ ...x, [s.id]: v })); setMsg(null) }} placeholder="—" className="tabular-nums" data-testid={`offline-in-${s.id}`} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 @md/main:grid-cols-2 @3xl/main:grid-cols-4">
            {m.sections.map((s) => (
              <div key={s.id} className="flex flex-col gap-1.5">
                <Label htmlFor={`off-missed-${s.id}`} className="text-muted-foreground text-xs">{s.name} · questions missed</Label>
                <Input id={`off-missed-${s.id}`} inputMode="numeric" value={missedIn[s.id] || ""} onChange={(e) => { const v = e.target.value; setMissedIn((x) => ({ ...x, [s.id]: v })); setMsg(null) }} placeholder="e.g. 3, 7, 12" className="tabular-nums" data-testid={`offline-missed-${s.id}`} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="off-sat" className="text-muted-foreground text-xs">Date she took it</Label>
              <Input id="off-sat" type="date" value={sat} onChange={(e) => { setSat(e.target.value); setMsg(null) }} className="w-44" data-testid="offline-sat" />
            </div>
            <Button onClick={save} data-testid="offline-save"><Save /> Save results</Button>
            {msg ? <span className={cn("text-sm", msg.err ? "text-destructive" : "text-muted-foreground")} data-testid="offline-msg">{msg.text}</span> : null}
          </div>
          {m.own && !m.removed ? <div><Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => { if (confirm(`Take "${m.name}" off the list and out of the score band? Her results stay in her record, and it can be put back.`)) removePaper(form, true) }} data-testid="paper-remove"><Trash2 /> Remove this paper</Button></div> : null}
          {sc.entries.length ? <p className="text-muted-foreground text-xs" data-testid="offline-log" data-n={sc.entries.length}>{sc.entries.length === 1 ? "One entry" : `${sc.entries.length} entries`} in her record · last saved {fmtDate(sc.at)}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------- what is attached to a paper ----------
 *
 * The paper itself and the marked answer sheet, each as a PDF or as photos — a
 * booklet is usually photographed page by page, and a sheet scanned or snapped.
 * The questions are the book's, so they are never copied into the site: every
 * file goes into her own Google Drive folder — the app's scope is drive.file, so it
 * can see those files and nothing else of hers — and opens there. All of it is in
 * her record only, private to her account. */
const MULTIPART_MAX = 4.5 * 1024 * 1024   // Drive takes up to 5 MB in one multipart request
const ACCEPT = "application/pdf,.pdf,image/*,.heic,.heif"
const isPdf = (f) => !!f && (f.type === "application/pdf" || f.mime === "application/pdf" || /\.pdf$/i.test(f.name || ""))
const isImage = (f) => !!f && (/^image\//.test(f.type || f.mime || "") || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(f.name || ""))
const notPaperFiles = (files) => files.filter((f) => !isPdf(f) && !isImage(f))
const mb = (n) => (n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0) + " MB"
/** Upload files to her Drive folder and attach each to the paper. Resolves to how many arrived. */
async function attachPaperFiles(id, field, files) {
  let ok = 0
  for (const f of files) {
    const mime = isPdf(f) ? "application/pdf" : f.type || "image/jpeg"
    const up = f.size > MULTIPART_MAX ? Store.uploadLarge : Store.uploadMedia
    const fid = await up.call(Store, f.name || (isPdf(f) ? "paper.pdf" : "page.jpg"), f, mime)
    if (fid) { addPaperAttachment(id, field, { id: fid, name: f.name, size: f.size, mime }); ok++ }
  }
  return ok
}

function AttachmentTile({ att, onRemove, testid }) {
  const pdf = isPdf(att)
  const [src, setSrc] = React.useState(null)
  const [broken, setBroken] = React.useState(false)
  React.useEffect(() => {
    if (pdf) return undefined
    let url = null, live = true
    Store.mediaUrl(att.id).then((u) => { url = u; if (live) setSrc(u); else if (u) URL.revokeObjectURL(u) })
    return () => { live = false; if (url) URL.revokeObjectURL(url) }
  }, [att.id, pdf])
  return (
    <li className="flex w-36 flex-col gap-1.5" data-testid={`${testid}-item`} data-file={att.id} data-kind={pdf ? "pdf" : "image"}>
      <a href={`https://drive.google.com/file/d/${att.id}/view`} target="_blank" rel="noreferrer" title="Open in Google Drive" data-testid={`${testid}-open`}
        className="bg-muted/40 hover:bg-muted flex aspect-[3/4] flex-col items-center justify-center gap-1 overflow-hidden rounded-md border">
        {pdf ? (
          <><FileText className="text-muted-foreground size-8" /><span className="text-muted-foreground text-xs font-medium tabular-nums">PDF{att.size ? ` · ${mb(att.size)}` : ""}</span></>
        ) : src && !broken ? <img src={src} alt={att.name} className="h-full w-full object-cover" onError={() => setBroken(true)} /> : <ImageIcon className="text-muted-foreground size-8" />}
      </a>
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="text-muted-foreground truncate" title={att.name}>{att.name}</span>
        <button type="button" className="text-muted-foreground hover:text-destructive shrink-0" onClick={onRemove} aria-label={`Remove ${att.name}`} data-testid={`${testid}-remove`}><Trash2 className="size-3.5" /></button>
      </div>
    </li>
  )
}

/** The files on one side of a paper — the paper itself, or the marked sheet — and a
 *  control to add more: PDFs or photos, several at a time. */
function AttachmentList({ p, field, testid, addLabel }) {
  useStore()
  const list = paperAttachments(p, field)
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState(null)
  const canUpload = DRIVE_ENABLED && !!Store.folderId
  async function onFiles(e) {
    const files = [...(e.target.files || [])]
    e.target.value = ""
    if (!files.length) return
    const bad = notPaperFiles(files)
    if (bad.length) return setMsg({ err: true, text: `${bad.map((f) => f.name).join(", ")}: only a PDF or a photo can be added.` })
    setBusy(true)
    setMsg({ err: false, text: `Uploading ${files.length === 1 ? `${files[0].name} (${mb(files[0].size)})` : `${files.length} files`} to her Google Drive…` })
    const ok = await attachPaperFiles(p.id, field, files)
    setBusy(false)
    setMsg(ok === files.length
      ? { err: false, text: ok === 1 ? "It is in her Google Drive folder." : `All ${ok} are in her Google Drive folder.` }
      : { err: true, text: `${files.length - ok} of ${files.length} did not upload. Try those again, or put them in her Google Drive yourself and paste a link.` })
  }
  return (
    <div className="flex flex-col gap-3" data-testid={testid} data-n={list.length}>
      {list.length ? (
        <ul className="flex flex-wrap gap-3">
          {list.map((x) => <AttachmentTile key={x.id} att={x} testid={testid} onRemove={() => { if (confirm(`Take ${x.name} off this paper? It stays in her Google Drive.`)) { removePaperAttachment(p.id, field, x.id); setMsg(null) } }} />)}
        </ul>
      ) : null}
      {canUpload ? (
        <label className="flex flex-col gap-1.5 self-start">
          <span className={cn("border-input hover:bg-accent inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm", busy && "pointer-events-none opacity-60")}>
            <Upload className="size-4" /> {list.length ? "Add more" : addLabel}
            <input type="file" accept={ACCEPT} multiple className="sr-only" onChange={onFiles} data-testid={`${testid}-input`} />
          </span>
          <span className="text-muted-foreground text-xs">A PDF or photos — several at once is fine.</span>
        </label>
      ) : <span className="text-muted-foreground text-xs">Sign in with Google to upload files into her Drive.</span>}
      {msg ? <p className={cn("text-sm", msg.err ? "text-destructive" : "text-muted-foreground")} data-testid={`${testid}-msg`}>{msg.text}</p> : null}
    </div>
  )
}

function PaperFileCard({ p }) {
  useStore()
  const link = p.rec && p.rec.link && p.rec.link.url ? p.rec.link : null
  const [url, setUrl] = React.useState("")
  const [msg, setMsg] = React.useState(null)
  function saveLink() {
    const u = url.trim()
    if (!/^https?:\/\/\S+$/i.test(u)) return setMsg({ err: true, text: "A link starts with https://" })
    setPaperLink(p.id, u); setUrl(""); setMsg({ err: false, text: "Link saved." })
  }
  return (
    <Card className="gap-3 py-5" data-testid="paper-file">
      <CardHeader className="px-5">
        <CardTitle>The paper</CardTitle>
        <CardDescription>The paper as a PDF or photos of its pages, or a link to it. The questions stay there: they are never copied into the site. Files go into her own Google Drive folder, private to her account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        <AttachmentList p={p} field="pages" testid="paper-pages" addLabel="Add the PDF or photos" />
        {link ? (
          <div className="flex flex-wrap items-center gap-2 text-sm" data-testid="paper-link">
            <Link2 className="text-muted-foreground size-4" /><span className="max-w-full truncate">{link.url}</span>
            <Button asChild size="sm" variant="outline"><a href={link.url} target="_blank" rel="noreferrer" data-testid="paper-link-open"><ExternalLink /> Open the link</a></Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setPaperLink(p.id, null)}>Remove link</Button>
          </div>
        ) : null}
        <div className="flex min-w-56 flex-col gap-1.5">
          <Label htmlFor="paper-url" className="text-muted-foreground text-xs">{link ? "Change the link" : "Or paste a link"}</Label>
          <div className="flex gap-2">
            <Input id="paper-url" value={url} onChange={(e) => { setUrl(e.target.value); setMsg(null) }} placeholder="https://…" data-testid="paper-url" />
            <Button size="sm" variant="outline" className="h-9" onClick={saveLink} disabled={!url.trim()} data-testid="paper-url-save">Save link</Button>
          </div>
        </div>
        {msg ? <p className={cn("text-sm", msg.err ? "text-destructive" : "text-muted-foreground")} data-testid="paper-file-msg">{msg.text}</p> : null}
      </CardContent>
    </Card>
  )
}

/* ---------- the marked answer sheet ----------
 *
 * A scan or photos of the sheet once it is marked. The site cannot read them; the
 * paper-results skill can, and sends the scores, the missed numbers and their
 * skills back as one link (docs/review.md). */
function PaperSheetsCard({ p }) {
  useStore()
  const canUpload = DRIVE_ENABLED && !!Store.folderId
  if (!canUpload && !paperAttachments(p, "sheets").length) return null
  return (
    <Card className="gap-3 py-5" data-testid="paper-sheet-card">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2"><Camera className="size-4" /> The marked answer sheet</CardTitle>
        <CardDescription>A scan or photos of the sheet once it is marked, kept in her own Google Drive folder. The site cannot read them by itself. Claude can: ask it to mark this paper, and it sends the scores, the missed questions and their skills back as one link to open here.</CardDescription>
      </CardHeader>
      <CardContent className="px-5"><AttachmentList p={p} field="sheets" testid="paper-sheets" addLabel="Add the scan or photos" /></CardContent>
    </Card>
  )
}

/* ---------- the questions she missed ----------
 *
 * Each missed number, filed under a skill — the paper's own map, Verbal's two parts
 * by position, or a parent's pick here — so a review can ask two questions of ours
 * on it; and a tick for redoing it from the booklet, which is the only place the
 * question itself is. A miss nobody has filed yet waits here and is never dropped. */
function PaperMissesCard({ p, sc }) {
  useStore()
  const rows = []
  for (const s of p.sections || []) for (const n of ((sc.missed || {})[s.id] || { nums: [] }).nums) rows.push({ s, n, sk: paperSkill(p, s.id, n), redone: paperRedone(p, s.id, n) })
  if (!rows.length) return null
  const done = rows.filter((r) => r.redone).length, unfiled = rows.filter((r) => !r.sk).length
  return (
    <Card className="gap-3 py-5" data-testid="paper-misses" data-n={rows.length} data-redone={done} data-unfiled={unfiled}>
      <CardHeader className="px-5">
        <CardTitle>The questions she missed</CardTitle>
        <CardDescription>
          {done} of {rows.length} redone from the booklet{unfiled ? ` · ${unfiled} still need a skill before review can ask about them` : " · each one sends two questions of its skill into review"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        {(p.sections || []).map((s) => {
          const mine = rows.filter((r) => r.s.id === s.id)
          if (!mine.length) return null
          const opts = paperSkillOptions(s.id)
          return (
            <div key={s.id} className="flex flex-col gap-1.5" data-testid="paper-miss-section" data-sec={s.id}>
              <div className="text-sm font-medium">{s.name}</div>
              <ul className="divide-y rounded-md border">
                {mine.map((r) => (
                  <li key={r.n} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 text-sm" data-testid="paper-miss" data-sec={s.id} data-n={r.n} data-skill={r.sk || ""} data-redone={r.redone ? "1" : "0"}>
                    <span className="w-14 shrink-0 font-medium tabular-nums">Q{r.n}</span>
                    <select aria-label={`Skill for ${s.name} question ${r.n}`} value={r.sk || ""} onChange={(e) => tagPaperMiss(p.id, s.id, r.n, e.target.value || null)} data-testid="paper-miss-skill"
                      className={cn("border-input dark:bg-input/30 h-8 min-w-44 flex-1 rounded-md border bg-transparent px-2 text-sm", !r.sk && "border-warning text-muted-foreground")}>
                      <option value="">Needs a skill…</option>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      {r.sk && !opts.includes(r.sk) ? <option value={r.sk}>{r.sk}</option> : null}
                    </select>
                    <label className="flex shrink-0 items-center gap-2">
                      <input type="checkbox" className="accent-primary size-4" checked={r.redone} onChange={(e) => markRedone(p.id, s.id, r.n, e.target.checked)} data-testid="paper-miss-redone" />
                      <span className="text-muted-foreground">Redone from the booklet</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

/* ---------- adding a paper ---------- */
export function AddPaper() {
  useStore()
  const [name, setName] = React.useState("")
  const [source, setSource] = React.useState("")
  const [link, setLink] = React.useState("")
  const [files, setFiles] = React.useState([])
  const [counts, setCounts] = React.useState(() => Object.fromEntries(ISEE_LOWER_SECTIONS.map((s) => [s.id, String(s.n)])))
  const [syn, setSyn] = React.useState("17")
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState(null)
  const canUpload = DRIVE_ENABLED && !!Store.folderId
  async function save() {
    const errs = [], url = link.trim()
    if (!name.trim()) errs.push("Give the paper a name")
    if (url && !/^https?:\/\/\S+$/i.test(url)) errs.push("A link starts with https://")
    if (notPaperFiles(files).length) errs.push("Only a PDF or photos can be added")
    const sections = ISEE_LOWER_SECTIONS.map((s) => ({ ...s, n: Number(counts[s.id]) }))
    if (sections.some((s) => !Number.isInteger(s.n) || s.n < 1 || s.n > 80)) errs.push("Each section needs a number of questions from 1 to 80")
    const vr = sections.find((s) => s.id === "VR"), sy = Number(syn)
    if (!Number.isInteger(sy) || sy < 0 || sy > vr.n) errs.push(`Synonyms are questions 1 to a number from 0 to ${vr.n || 0}`)
    if (errs.length) return setMsg({ err: true, text: errs.join(". ") + "." })
    setBusy(true)
    const id = createOfflinePaper({ name, source, sections, synonyms: sy, link: url || null })
    if (files.length) {
      setMsg({ err: false, text: `Uploading ${files.length === 1 ? files[0].name : files.length + " files"} to her Google Drive…` })
      await attachPaperFiles(id, "pages", files)   // the paper's page shows what arrived, and takes more
    }
    go("/mock/" + id)
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4" data-testid="paper-add">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><FilePlus className="size-4" /> Mock exams</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">Add a paper sat on paper</CardTitle>
          <CardDescription>A practice test she sits away from the site, from a book or a website. The site keeps the paper's shape, her scores and the questions she missed. The questions themselves stay in the PDF or behind the link.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="gap-4 py-5">
        <CardContent className="flex flex-col gap-4 px-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pa-name">Name</Label>
            <Input id="pa-name" value={name} onChange={(e) => { setName(e.target.value); setMsg(null) }} placeholder="e.g. Test Innovators practice test 2" data-testid="paper-add-name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pa-source">Where it is from <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="pa-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="the book or website" data-testid="paper-add-source" />
          </div>
          <div className="grid grid-cols-1 gap-3 @md/main:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">The paper: a PDF or photos <span className="text-muted-foreground font-normal">(optional)</span></span>
              {canUpload ? (
                <input type="file" accept={ACCEPT} multiple onChange={(e) => { setFiles([...(e.target.files || [])]); setMsg(null) }} className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1.5" data-testid="paper-add-file" />
              ) : <span className="text-muted-foreground text-sm">Sign in with Google to upload files into her Drive.</span>}
            </label>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pa-link">Or a link <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="pa-link" value={link} onChange={(e) => { setLink(e.target.value); setMsg(null) }} placeholder="https://…" data-testid="paper-add-link" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">Questions in each section <span className="text-muted-foreground font-normal">· ISEE Lower Level unless the paper differs</span></div>
            <div className="grid grid-cols-2 items-end gap-3 @md/main:grid-cols-4">
              {ISEE_LOWER_SECTIONS.map((s) => (
                <div key={s.id} className="flex flex-col gap-1">
                  <Label htmlFor={`pa-n-${s.id}`} className="text-muted-foreground text-xs">{s.name}</Label>
                  <Input id={`pa-n-${s.id}`} inputMode="numeric" value={counts[s.id]} onChange={(e) => { const v = e.target.value; setCounts((c) => ({ ...c, [s.id]: v })); setMsg(null) }} className="tabular-nums" data-testid={`paper-add-n-${s.id}`} />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Label htmlFor="pa-syn" className="text-muted-foreground font-normal">In Verbal, the synonyms are questions 1 to</Label>
              <Input id="pa-syn" inputMode="numeric" value={syn} onChange={(e) => { setSyn(e.target.value); setMsg(null) }} className="h-8 w-16 tabular-nums" data-testid="paper-add-syn" />
              <span className="text-muted-foreground">and the rest are sentence completions.</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy} data-testid="paper-add-save"><FilePlus /> Add the paper</Button>
            <Button variant="outline" onClick={() => go("/mock")}>Cancel</Button>
            {msg ? <span className={cn("text-sm", msg.err ? "text-destructive" : "text-muted-foreground")} data-testid="paper-add-msg">{msg.text}</span> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** Estimated stanine band from finished mocks. Honest about being an estimate. */
export function BandCard() {
  const b = mockBand()
  if (!b.n) return null
  return (
    <Card className="gap-3 py-5" data-testid="band-card">
      <CardHeader className="px-5">
        <CardTitle className="flex items-center gap-2">Estimated score band</CardTitle>
        <CardDescription>
          {b.lo != null
            ? `Stanine ${b.lo === b.hi ? b.lo : `${b.lo}–${b.hi}`} across the last ${Math.min(b.n, 3)} mocks (1–9 scale; 5 is average for the grade).`
            : `${b.latest.name}: ${b.latest.pct}% raw ≈ stanine ${b.latest.st}. A band appears once a second mock is finished.`}
          {" "}Rough mapping from percent correct — the real ISEE norms are by grade and vary by form, so treat this as a guide, not a prediction.
        </CardDescription>
        <CardAction>
          {b.lo != null ? <span className="text-3xl font-semibold tabular-nums">{b.lo === b.hi ? b.lo : `${b.lo}–${b.hi}`}</span> : <span className="text-3xl font-semibold tabular-nums">≈{b.latest.st}</span>}
        </CardAction>
      </CardHeader>
      <CardContent className="px-5">
        <Table>
          <TableHeader><TableRow><TableHead>Mock</TableHead><TableHead className="text-right">Raw</TableHead><TableHead className="text-right">VR</TableHead><TableHead className="text-right">QR</TableHead><TableHead className="text-right">RC</TableHead><TableHead className="text-right">MA</TableHead></TableRow></TableHeader>
          <TableBody>
            {b.mocks.map((m) => (
              <TableRow key={m.form}>
                <TableCell className="font-medium">{m.name} <span className="text-muted-foreground text-xs">{fmtDate(m.at)}</span></TableCell>
                <TableCell className="text-right tabular-nums">{m.pct}% · ≈{m.st}</TableCell>
                {["VR", "QR", "RC", "MA"].map((k) => <TableCell key={k} className="text-right tabular-nums">{m.sections[k] ? `${m.sections[k].pct}% · ${m.sections[k].st}` : "—"}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/* ---------- overview / results ---------- */
export function MockOverview({ form }) {
  useStore()
  const m = mockDef(form)
  if (!m) return null
  const st = mockState(form)
  const sum = mockSummary(form)
  const parts = m.split ? ["A", "B"] : [null]

  function reset() {
    if (!confirm(`Clear every section of ${m.name} and start again? The current attempt is discarded.`)) return
    Store.setSlice("mocks", form, () => ({ sections: {} }))
  }

  const rows = m.sections.map((s) => {
    const r = (st.sections || {})[s.id] || {}
    const isBreak = s.id.startsWith("BREAK"), isEssay = s.id === "ESSAY"
    const er = st.essay || {}
    const status = isBreak ? "break" : isEssay ? (er.submittedAt ? "done" : er.started ? "live" : "todo") : r.submittedAt ? "done" : r.started ? "live" : "todo"
    return { s, r, er, isBreak, isEssay, status }
  })
  // the next thing to do, in order
  const next = rows.find((x) => !x.isBreak && x.status !== "done")

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 md:gap-6">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Swords className="size-4" /> {W.longNight} · scheduled {m.label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{m.name}</CardTitle>
          <CardDescription>{m.blurb}</CardDescription>
          {/* min-w-0 is the half that matters: without it this sits in a grid
              track that can only shrink to its content's minimum, and a nowrap
              button says its minimum is the whole sentence — so 413px of card
              sat in a 390px screen and the page she reads before a Long Night
              was the one page she had to drag sideways. */}
          <CardAction className="min-w-0">
            {sum.complete ? (
              <div className="text-right">
                <div className="text-3xl font-semibold tabular-nums">{sum.right}<span className="text-muted-foreground text-base font-normal"> / {sum.n}</span></div>
                <div className="text-muted-foreground text-xs">raw correct</div>
              </div>
            ) : next ? (
              /* And wrapping is the half that makes the result readable: once the
                 track can shrink, a nowrap label just spills out of its own
                 button instead of out of the page. Two short lines, not one
                 clipped one. */
              <Button onClick={() => go(`/mock/${form}/${next.s.id}`)} data-testid="mock-next" className="h-auto max-w-full py-2 leading-tight whitespace-normal"><Play /> {next.status === "live" ? "Resume" : "Start"} {next.s.name}</Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={((sum.done + (sum.essayDone ? 1 : 0)) / (sum.total + 1)) * 100} className="h-1.5" />
          <div className="text-muted-foreground text-sm">Before: sleep normally, eat, gather scratch paper, choose a quiet place. During: only the allowed time, no notes, no help. After 24–48 h: classify each miss, reteach, redo.</div>
        </CardContent>
      </Card>

      {parts.map((part) => (
        <Card key={part || "all"} className="gap-2 py-5">
          <CardHeader className="px-5">
            <CardTitle>{part ? `Part ${part}` : "Sections"} <span className="text-muted-foreground font-normal">· {part === "A" ? "VR + QR (one sitting)" : part === "B" ? "RC + MA + Essay (second sitting)" : "in order, one sitting"}</span></CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ul className="flex flex-col">
              {rows.filter((x) => !part || x.s.part === part).map(({ s, r, er, isBreak, isEssay, status }) => (
                <li key={s.id} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm", isBreak && "text-muted-foreground")}>
                  <span data-testid="sec-tag" className={cn("bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold", status === "done" && "bg-success-soft text-success", status === "live" && "bg-warning-soft text-warning")}>
                    {/* The square is 32px and holds a section code: VR, QR, RC, MA —
                        the abbreviations she will see on the day, which is why they
                        are worth showing. "ESSAY" is not one of those, it is the
                        whole word, and at five characters it printed straight out
                        through both sides of its own box. A pen, the way a break
                        already gets a clock: the row spells out "Essay" beside it
                        either way, so nothing is lost by not saying it twice. */}
                    {isBreak ? <Clock className="size-4" /> : status === "done" ? <CheckCircle2 className="size-4" /> : isEssay ? <PenLine className="size-4" /> : s.id}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-xs">{s.n ? `${s.n} questions · ` : ""}{s.min} min{status === "done" && !isEssay ? ` · used ${fmt(r.timeUsed || 0)}` : ""}{status === "done" && isEssay ? ` · ${(er.text || "").trim().split(/\s+/).filter(Boolean).length} words` : ""}</span>
                  </span>
                  {isBreak ? null : status === "done" ? (
                    isEssay ? <Badge variant="success">Written</Badge> : <Badge variant={r.right / s.n >= 0.75 ? "success" : r.right / s.n >= 0.5 ? "warning" : "destructive"} className="tabular-nums">{r.right}/{s.n}</Badge>
                  ) : (
                    <Button size="sm" variant={status === "live" ? "default" : "outline"} onClick={() => go(`/mock/${form}/${s.id}`)} data-testid={`mock-sec-${s.id}`}>{status === "live" ? "Resume" : "Start"}</Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {sum.complete && <MockResults form={form} />}

      {sum.started && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={reset}><RotateCcw /> Start this form over</Button>
        </div>
      )}
    </div>
  )
}

function MockResults({ form }) {
  const m = mockDef(form), st = mockState(form)
  const secs = scoredSections(m)
  const misses = []
  for (const s of secs) {
    const r = (st.sections || {})[s.id] || {}
    D.mockItems[form][s.id].forEach((q, i) => { if ((r.picks || {})[i] !== keyOf(q)) misses.push({ sec: s, q, i, pick: (r.picks || {})[i] || null }) })
  }
  const steps = mockNextSteps(form)
  return (
    <>
      {steps.length ? (
        <Card className="gap-3 py-5 border-primary/40" data-testid="next-steps">
          <CardHeader className="px-5">
            <CardTitle>Next steps this week</CardTitle>
            <CardDescription>Worked out from the misses, blanks, timing and the tags below. They also appear on this week's checklist.</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <ol className="flex flex-col gap-2">
              {steps.map((st, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">{i + 1}</span>
                  <span className="flex-1">{st.text}</span>
                  {st.path ? <Button size="sm" variant="outline" onClick={() => go(st.path)}>Go <ChevronRight /></Button> : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}
      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Raw correct per section, with an estimated stanine (rough mapping from percent). Within 24–48 hours, tag every miss below — one tap says why it went wrong.</CardDescription>
          <CardAction>
            {misses.length ? <Button size="sm" onClick={() => go(`/mock/${form}/corrections`)} data-testid="mock-corrections"><RotateCcw /> Corrections drill · {misses.length}</Button> : null}
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Section</TableHead><TableHead className="text-right">Raw</TableHead><TableHead className="text-right">Percent</TableHead><TableHead className="text-right">≈Stanine</TableHead><TableHead className="hidden text-right @md/main:table-cell">Time used</TableHead><TableHead className="hidden text-right @md/main:table-cell">Per question</TableHead><TableHead className="hidden text-right @md/main:table-cell">Blank</TableHead></TableRow></TableHeader>
            <TableBody>
              {secs.map((s) => {
                const r = (st.sections || {})[s.id] || {}
                const blank = s.n - Object.keys(r.picks || {}).length
                const pct = Math.round((r.right / s.n) * 100)
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.right}/{s.n}</TableCell>
                    <TableCell className="text-right tabular-nums">{pct}%</TableCell>
                    <TableCell className="text-right tabular-nums">{STANINE(pct)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums @md/main:table-cell">{fmt(r.timeUsed || 0)} / {s.min}:00</TableCell>
                    <TableCell className="hidden text-right tabular-nums @md/main:table-cell">{Math.round((r.timeUsed || 0) / 1000 / s.n)} s <span className="text-muted-foreground">/ {Math.round((s.min * 60) / s.n)}</span></TableCell>
                    <TableCell className="hidden text-right tabular-nums @md/main:table-cell">{blank}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <MissedBySkill misses={misses} form={form} />
    </>
  )
}


/** The paper's misses, gathered by skill rather than laid out in paper order.
 *
 *  Measured before it was changed: a real diagnostic leaves ninety-four of these,
 *  and one flat list of them ran to forty-six screens on a laptop and sixty-nine
 *  on a phone, carrying seven hundred buttons. The page's own instruction is
 *  "classify each miss, reteach, redo", and nobody can do that to ninety-four
 *  cards in the order the paper happened to ask them.
 *
 *  So: one row per skill, heaviest first, because that is the order the marks
 *  came off. The lesson and the redo belong to the skill and appear once each,
 *  which is also what they always were — printing the same Percent lesson twelve
 *  times was the old shape apologising for the missing one. The questions
 *  themselves are still all there, every word of them, one tap inside the skill
 *  they belong to; nothing is summarised away, only folded. */
function MissedBySkill({ misses, form }) {
  const groups = React.useMemo(() => {
    const by = new Map()
    for (const m of misses) {
      const sub = m.sec.id.toLowerCase()
      const sk = skillOf(sub, m.q)
      const lesson = learnName(sk) || sk
      if (!by.has(lesson)) by.set(lesson, { lesson, sub, sk, rows: [] })
      by.get(lesson).rows.push(m)
    }
    return [...by.values()].sort((a, b) => b.rows.length - a.rows.length || a.lesson.localeCompare(b.lesson))
  }, [misses])
  const [open, setOpen] = React.useState(null)
  if (!misses.length) return null
  return (
    <>
      <h2 className="mt-2 text-xl font-semibold" data-testid="miss-total" data-n={misses.length}>Missed questions · {misses.length}</h2>
      <p className="text-muted-foreground -mt-2 text-sm">{groups.length} skills, heaviest first. Open one to read its questions.</p>
      {/* This page is written to be read a day or two after the paper, which is
          exactly when "how many went wrong" stops being the useful number and
          "how many have been dealt with" starts. Not quiet here for the same
          reason: on the night itself nothing could have happened yet, but nobody
          reads a Long Night report on the night itself. */}
      <MissProgress ids={misses.map((m) => m.q.id)} className="-mt-1" />
      <div className="flex flex-col gap-3">
        {groups.map((g) => {
          const isOpen = open === g.lesson
          return (
            <Card key={g.lesson} className="gap-3 py-4" data-testid="miss-group" data-skill={g.lesson} data-n={g.rows.length} data-open={isOpen ? "1" : "0"}>
              <CardHeader className="px-5">
                <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : g.lesson)} data-testid="miss-group-open">
                  {isOpen ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{g.lesson}</span>
                    <span className="text-muted-foreground text-xs">{g.rows.length} missed · {[...new Set(g.rows.map((r) => r.sec.id))].join(", ")}</span>
                    <MissProgress ids={g.rows.map((r) => r.q.id)} className="mt-0.5" quiet />
                  </span>
                  <Badge variant="destructive" className="tabular-nums">{g.rows.length}</Badge>
                </button>
              </CardHeader>
              {isOpen ? (
                <CardContent className="flex flex-col gap-3 px-5 text-sm">
                  {/* Reteach, then redo, then the questions themselves. No cat:
                      a Long Night gets nothing from the first question to the
                      last, and docs/cats.md §6 leaves what happens afterwards to
                      the owner rather than to this page. */}
                  <LearnCard skill={g.sk} sub={g.sub} item={g.rows[0].q} />
                  <div>
                    <Button size="sm" variant="outline" data-testid="try-another" data-qid={g.rows[0].q.id}
                      onClick={() => go(`/again/${g.rows[0].q.id}/${form}`)}>
                      <RotateCcw /> Try another {g.lesson} question
                    </Button>
                  </div>
                  {g.rows.map(({ sec, q, i, pick }) => (
                    <div key={q.id} className="border-destructive/40 flex flex-col gap-2 rounded-lg border-2 p-4" data-testid="miss-row" data-qid={q.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">{pick ? "Missed" : "Blank"}</Badge>
                        <span className="text-muted-foreground text-xs">{sec.id} · Q{i + 1}{q.sk ? " · " + q.sk : ""}</span>
                        <MissStage id={q.id} />
                      </div>
                      <p className="text-[15px] leading-snug font-medium">{q.q}</p>
                      {q.f ? <Figure f={q.f} /> : null}
                      <div className="text-muted-foreground">Your answer: <span className="text-foreground font-medium">{pick ? `${pick}. ${q.c[LTR.indexOf(pick)]}` : "—"}</span></div>
                      <div className="text-muted-foreground">Correct: <span className="text-foreground font-medium">{keyOf(q)}. {q.c[LTR.indexOf(keyOf(q))]}</span></div>
                      {/* What the choice she actually made really was, above the
                          general explanation and in that order because the
                          explanation can only ever describe the correct route:
                          "perimeter = 2(10+3) = 26" never tells her the 30 she
                          picked was the area. This card is the one surface that
                          knows which wrong choice she made — it is recorded right
                          there in `pick` — and it was showing her the same
                          paragraph as everyone who missed it differently. */}
                      {pick && q.y && q.y[pick] ? <div className="border-destructive/40 bg-destructive/5 rounded-md border p-3 leading-relaxed" data-testid="why">{q.y[pick]}</div> : null}
                      {q.e ? <div className="bg-muted/60 text-muted-foreground rounded-md p-3 leading-relaxed">{q.e}</div> : null}
                      {/* Classifying stays per question: each miss has its own
                          reason, and "I misread it" about twelve questions at
                          once would be a guess rather than a record. */}
                      <CauseTags id={q.id} compact />
                    </div>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          )
        })}
      </div>
    </>
  )
}

/* ---------- timed section ---------- */
function useClock(endsAt) {
  const [now, setNow] = React.useState(Date.now())
  React.useEffect(() => { if (!endsAt) return; const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id) }, [endsAt])
  return endsAt ? Math.max(0, endsAt - now) : null
}

export function MockSection({ form, sec }) {
  useStore()
  const m = mockDef(form)
  const def = m && m.sections.find((s) => s.id === sec)
  const items = def && def.n ? D.mockItems[form][sec] : null
  const st = mockState(form)
  const r = (st.sections || {})[sec] || {}
  const [i, setI] = React.useState(0)
  const [showPalette, setPalette] = React.useState(false)
  const left = useClock(r.submittedAt ? null : r.endsAt)
  const entered = React.useRef(Date.now()), iRef = React.useRef(0)

  const save = React.useCallback((patch) => {
    Store.setSlice("mocks", form, (cur) => ({ ...cur, sections: { ...(cur.sections || {}), [sec]: { ...((cur.sections || {})[sec] || {}), ...patch } } }))
  }, [form, sec])
  /** Add the time on the current question to its tally (seconds per question feed pacing). */
  const stamp = React.useCallback(() => {
    const now = Date.now(), cur = (mockState(form).sections || {})[sec] || {}
    if (!cur.started || cur.submittedAt) return
    const times = { ...(cur.times || {}) }
    times[iRef.current] = (times[iRef.current] || 0) + (now - entered.current)
    entered.current = now
    save({ times })
  }, [form, sec, save])
  const goTo = React.useCallback((j) => { stamp(); iRef.current = j; setI(j); window.scrollTo(0, 0) }, [stamp])

  const submit = React.useCallback((auto) => {
    stamp()
    const cur = (mockState(form).sections || {})[sec] || {}
    if (cur.submittedAt) return
    let right = 0
    items.forEach((q, j) => { if ((cur.picks || {})[j] === keyOf(q)) right++ })
    const timeUsed = Math.min(def.min * 60000, Date.now() - (cur.started || Date.now()))
    save({ submittedAt: new Date().toISOString(), right, n: items.length, timeUsed, autoSubmitted: !!auto })
    // whole form done?
    const s2 = mockSummary(form)
    if (s2.complete) { Store.setSlice("mocks", form, (c) => ({ ...c, finishedAt: new Date().toISOString() })); recordMockForm(form) }
    window.scrollTo(0, 0)
  }, [form, sec, items, def, save, stamp])

  React.useEffect(() => { if (left === 0 && r.started && !r.submittedAt) submit(true) }, [left, r.started, r.submittedAt, submit])

  if (!def) return null
  if (!items) return null

  function start() { const now = Date.now(); entered.current = now; iRef.current = 0; save({ started: now, endsAt: now + def.min * 60000, picks: {}, flags: {}, times: {} }) }
  function pick(letter) { save({ picks: { ...(r.picks || {}), [i]: letter } }) }
  function flag() { save({ flags: { ...(r.flags || {}), [i]: !(r.flags || {})[i] } }) }

  const answered = Object.keys(r.picks || {}).length
  const nextTodo = (() => { const rows = m.sections.filter((s) => !s.id.startsWith("BREAK")); const k = rows.findIndex((s) => s.id === sec); return rows[k + 1] })()

  // not started yet
  if (!r.started) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
          <CardHeader>
            <CardDescription>{m.name} · Section</CardDescription>
            <CardTitle className="text-2xl font-semibold">{def.name}</CardTitle>
            <CardDescription>{def.n} questions · {def.min} minutes. The clock starts when you press Start and does not pause. When it reaches zero the section submits itself. Unanswered questions count as wrong, so answer every one.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={start} data-testid="mock-start"><Play /> Start {def.name}</Button>
            <Button variant="outline" onClick={() => go("/mock/" + form)}>Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // submitted
  if (r.submittedAt) {
    const pct = Math.round((r.right / items.length) * 100)
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card bg-gradient-to-t items-center text-center" data-testid="mock-score">
          <CardHeader className="w-full">
            <CardDescription>{m.name} · {def.name}{r.autoSubmitted ? " · time ran out" : ""}</CardDescription>
            <CardTitle className="text-5xl font-semibold tabular-nums">{r.right}<span className="text-muted-foreground text-xl font-normal"> / {items.length}</span></CardTitle>
            <CardDescription className="text-base">{pct}% · time used {fmt(r.timeUsed || 0)} of {def.min}:00 · {items.length - Object.keys(r.picks || {}).length} left blank</CardDescription>
            <CardDescription className="text-xs">Which questions were missed, and why, unlocks when the whole form is finished.</CardDescription>
          </CardHeader>
        </Card>
        <ActionBar>
          <Button variant="outline" onClick={() => go("/mock/" + form)}>Overview</Button>
          <span className="flex-1" />
          {nextTodo ? <Button onClick={() => go(`/mock/${form}/${nextTodo.id}`)}>{nextTodo.id === "ESSAY" ? "Essay" : "Next: " + nextTodo.name} <ChevronRight /></Button> : <Button onClick={() => go("/mock/" + form)}>See results</Button>}
        </ActionBar>
      </div>
    )
  }

  const q = items[i]
  const warn = left != null && left < 120000
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground font-medium">{m.name} · {def.name}</span>
          <span className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono font-semibold tabular-nums", warn && "border-destructive text-destructive")} data-testid="mock-timer"><Clock className="size-3.5" /> {fmt(left ?? def.min * 60000)}</span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={(answered / items.length) * 100} className="h-1.5" />
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{answered}/{items.length} answered</span>
        </div>
      </div>

      <Card className="gap-5">
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs tabular-nums">Question {i + 1} of {items.length}{q.sk ? ` · ${q.sk}` : ""}</span>
            <Button size="sm" variant={(r.flags || {})[i] ? "secondary" : "ghost"} onClick={flag}><Flag className={cn((r.flags || {})[i] && "fill-current")} /> {(r.flags || {})[i] ? "Flagged" : "Flag"}</Button>
          </div>
          {q.p ? <Passage id={q.p} /> : null}
          <p className="text-lg leading-snug font-medium" data-testid="question">{q.q}</p>
          {q.f ? <Figure f={q.f} /> : null}
          <RadioGroup value={(r.picks || {})[i] || ""} onValueChange={pick} className="gap-2.5" aria-label="Answer choices">
            {q.c.map((c, k) => <Choice key={k} k={k} text={c} onSelect={(kk) => pick(LTR[kk])} />)}
          </RadioGroup>
        </CardContent>
      </Card>

      {showPalette && (
        <Card className="py-4">
          <CardContent className="flex flex-wrap gap-1.5">
            {items.map((_, j) => (
              <button key={j} type="button" onClick={() => goTo(j)} data-testid="mock-jump" data-i={j}
                className={cn("size-8 rounded-md border text-xs font-semibold tabular-nums", j === i && "ring-ring/50 ring-[3px]", (r.picks || {})[j] ? "bg-primary text-primary-foreground border-primary" : "bg-card", (r.flags || {})[j] && "border-warning border-2")}>
                {j + 1}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <ActionBar>
        <Button variant="outline" onClick={() => goTo(Math.max(0, i - 1))} disabled={i === 0}><ChevronLeft /> Back</Button>
        <Button variant="ghost" size="sm" onClick={() => setPalette((p) => !p)}>{showPalette ? "Hide" : "All questions"}</Button>
        <span className="flex-1" />
        {i < items.length - 1 ? (
          <Button onClick={() => goTo(i + 1)} data-testid="mock-next-q">Next <ChevronRight /></Button>
        ) : (
          <Button onClick={() => { if (answered < items.length && !confirm(`${items.length - answered} question(s) are blank. Submit anyway?`)) return; submit(false) }} data-testid="mock-submit"><Send /> Submit section</Button>
        )}
      </ActionBar>
    </div>
  )
}

/* ---------- essay ---------- */
export function MockEssay({ form }) {
  useStore()
  const m = mockDef(form)
  const def = m && m.sections.find((s) => s.id === "ESSAY")
  const st = mockState(form)
  const er = st.essay || {}
  const [text, setText] = React.useState(er.text || "")
  const t = React.useRef(null)
  const left = useClock(er.submittedAt ? null : er.endsAt)
  const save = React.useCallback((patch) => Store.setSlice("mocks", form, (cur) => ({ ...cur, essay: { ...(cur.essay || {}), ...patch } })), [form])
  const submit = React.useCallback((auto) => {
    const cur = mockState(form).essay || {}
    if (cur.submittedAt) return
    save({ submittedAt: new Date().toISOString(), text: text || cur.text || "", autoSubmitted: !!auto })
    if (mockSummary(form).complete) { Store.setSlice("mocks", form, (c) => ({ ...c, finishedAt: new Date().toISOString() })); recordMockForm(form) }
    window.scrollTo(0, 0)
  }, [form, save, text])
  React.useEffect(() => { if (left === 0 && er.started && !er.submittedAt) submit(true) }, [left, er.started, er.submittedAt, submit])
  if (!def) return null
  const wc = (text.trim().match(/\S+/g) || []).length

  if (!er.started) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="from-primary/5 to-card bg-gradient-to-t gap-4">
          <CardHeader>
            <CardDescription>{m.name} · Essay</CardDescription>
            <CardTitle className="text-2xl font-semibold">30-minute essay</CardTitle>
            <CardDescription>The prompt is unseen until you press Start. Plan briefly, write for the full time, and keep this timed version as it is. Schools see the essay; it is not scored.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => { const now = Date.now(); save({ started: now, endsAt: now + def.min * 60000 }) }} data-testid="mock-essay-start"><Play /> Start essay</Button>
            <Button variant="outline" onClick={() => go("/mock/" + form)}>Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  if (er.submittedAt) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card className="gap-4">
          <CardHeader>
            <CardDescription>{m.name} · Essay · submitted {fmtDate(er.submittedAt)}{er.autoSubmitted ? " · time ran out" : ""}</CardDescription>
            <CardTitle className="text-lg leading-snug">{def.prompt}</CardTitle>
            <CardAction><Badge variant="success" className="tabular-nums">{(er.text || "").trim().split(/\s+/).filter(Boolean).length} words</Badge></CardAction>
          </CardHeader>
          <CardContent className="text-[15px] leading-7 whitespace-pre-wrap">{er.text}</CardContent>
        </Card>
        {reviewsFor({ kind: "mock", form }).map((r) => <ReviewCard key={r.id} r={r} changedAt={er.submittedAt} />)}
        <ActionBar>
          <Button variant="outline" onClick={() => go("/mock/" + form)}>Overview</Button>
          <span className="flex-1" />
          <Button onClick={() => go("/mock/" + form)}>See results</Button>
        </ActionBar>
      </div>
    )
  }
  const warn = left != null && left < 180000
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground font-medium">{m.name} · Essay</span>
        <span className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono font-semibold tabular-nums", warn && "border-destructive text-destructive")}><Clock className="size-3.5" /> {fmt(left ?? def.min * 60000)}</span>
      </div>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg leading-snug" data-testid="mock-essay-prompt">{def.prompt}</CardTitle>
          <CardDescription>Plan briefly at the top, then write. Autosaves as you type.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={text} onChange={(e) => { const v = e.target.value; setText(v); clearTimeout(t.current); t.current = setTimeout(() => save({ text: v }), 600) }} onBlur={() => { clearTimeout(t.current); save({ text }) }} className="min-h-[50vh] text-[15px] leading-7" placeholder="Start writing…" data-testid="mock-essay-text" />
          <div className="text-muted-foreground mt-2 text-right text-xs tabular-nums">{wc} words</div>
        </CardContent>
      </Card>
      <ActionBar>
        <span className="text-muted-foreground text-sm"><AlertTriangle className="mr-1 inline size-3.5" /> Submitting ends the essay.</span>
        <span className="flex-1" />
        <Button onClick={() => { if (confirm("Submit the essay now?")) submit(false) }} data-testid="mock-essay-submit"><Send /> Submit essay</Button>
      </ActionBar>
    </div>
  )
}

/* ---------- corrections drill (does not change the recorded score) ---------- */
export function MockCorrections({ form }) {
  const m = mockDef(form), st = mockState(form)
  const items = []
  for (const s of scoredSections(m)) {
    const r = (st.sections || {})[s.id] || {}
    D.mockItems[form][s.id].forEach((q, i) => { if ((r.picks || {})[i] !== keyOf(q)) items.push(q) })
  }
  if (!items.length) return <MockOverview form={form} />
  // ctx="corr" is what keeps corrections plain — no gate, no cat, no chime.
  // Without it these fell through to kind "review" and a Verbal item was drawn
  // as a gate, which the runner's own comment says it should never be: going
  // back over answers is not an event to celebrate.
  return <Runner key={`corr:${form}:${items.length}`} items={items} custom ctx="corr" record={false} title={`${m.name} · Corrections`} exitPath={"/mock/" + form} exitLabel="Back to results" />
}
