import * as React from "react"
import { ExternalLink } from "lucide-react"

import { offlinePaper, paperBoxes, paperPdf } from "@/lib/engine"
import { Store, useStore } from "@/lib/store"
import { Button } from "@zhangqi444/ui/ui/button"

/* A question from a paper sat on paper, shown as it is in the book: cut out of the
 * family's own PDF in her Drive and drawn in her browser (lib/pdf.js). The owner, 5
 * October 2026: "I want to see the wrong questions exact at the website." The words
 * are the book's, so they are never copied into the site — only where each question
 * sits on the page (lib/engine.js, paperBoxes) — and nothing leaves her browser.
 * The artifact has no Drive, so it has no pdf.js either (vite.config.js). */
const loadPdf = import.meta.env.LEARNING_ARTIFACT ? () => Promise.reject(new Error("No PDF here.")) : () => import("@/lib/pdf")

function Crop({ doc, box, testid }) {
  const wrap = React.useRef(null), canvas = React.useRef(null)
  const [state, setState] = React.useState("drawing")
  const key = JSON.stringify(box)
  React.useEffect(() => {
    let job = null, live = true
    setState("drawing")
    loadPdf().then(({ drawBox }) => {
      if (!live || !canvas.current) return null
      const room = (wrap.current && wrap.current.clientWidth - 16) || 480
      job = drawBox(doc, canvas.current, box, room)
      return job.done.then((r) => { if (live && r) { canvas.current.style.width = `${r.w}px`; setState("drawn") } })
    }).catch(() => { if (live) setState("error") })
    return () => { live = false; if (job) job.cancel() }
  }, [doc, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={wrap} className="overflow-x-auto rounded-md border bg-white p-2" data-testid={testid} data-state={state}>
      <canvas ref={canvas} className="block h-auto max-w-full" aria-label="The question as it is printed in the book" />
      {state === "error" ? <p className="text-sm text-neutral-600">This part of the page could not be drawn.</p> : null}
    </div>
  )
}

/** One question of a paper, cut out of its PDF: the figure or passage it refers to,
 *  then the question itself with its four choices. */
export function PaperQuestion({ p, secId, n }) {
  useStore()
  const { q, ctx } = paperBoxes(p, secId, n)
  const pdf = paperPdf(p)
  const [doc, setDoc] = React.useState(null)
  const [state, setState] = React.useState("loading")
  // A shared figure belongs to the question; a reading passage is a tap away.
  const [showCtx, setShowCtx] = React.useState(secId !== "RC")
  const fid = pdf ? pdf.id : null
  React.useEffect(() => {
    if (!q) return undefined
    if (!fid) { setState("nofile"); return undefined }
    let live = true
    setState("loading")
    loadPdf()
      .then(({ openPdf }) => openPdf(fid, () => Store.mediaBytes(fid)))
      .then((d) => {
        if (!live) return
        // The map a paper ships with was read off one PDF; another edition's pages differ.
        if (p.pdf && p.pdf.pages && d.numPages !== p.pdf.pages) return setState("mismatch")
        setDoc(d); setState("ready")
      })
      .catch(() => { if (live) setState("error") })
    return () => { live = false }
  }, [fid, !!q]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null
  const open = fid ? `https://drive.google.com/file/d/${fid}/view` : null
  return (
    <div className="flex flex-col gap-2" data-testid="paper-question" data-state={state} data-sec={secId} data-n={n}>
      {state === "nofile" ? <p className="text-muted-foreground text-sm">Add the paper's PDF under “The paper” above, and the question shows here as it is in the book.</p> : null}
      {state === "loading" ? <p className="text-muted-foreground text-sm">Opening the paper…</p> : null}
      {state === "mismatch" || state === "error" ? (
        <p className="text-muted-foreground text-sm">
          {state === "mismatch" ? "This PDF is not the one the question map was read from, so the question cannot be cut out of it." : "The paper could not be opened from her Drive just now."}{" "}
          {open ? <a className="text-primary underline underline-offset-2" href={open} target="_blank" rel="noreferrer">Open the PDF in Drive <ExternalLink className="inline size-3.5" /></a> : null}
        </p>
      ) : null}
      {state === "ready" && ctx ? (
        secId === "RC" ? (
          <div className="flex flex-col gap-2">
            <div><Button size="sm" variant="outline" className="h-8" onClick={() => setShowCtx((v) => !v)} data-testid="paper-q-passage">{showCtx ? "Hide the passage" : "Show the passage"}</Button></div>
            {showCtx ? <Crop doc={doc} box={ctx} testid="paper-q-ctx" /> : null}
          </div>
        ) : <Crop doc={doc} box={ctx} testid="paper-q-ctx" />
      ) : null}
      {state === "ready" ? <Crop doc={doc} box={q} testid="paper-q-crop" /> : null}
    </div>
  )
}

/** Over a question of ours in review that stands in for a miss on a paper sat on
 *  paper: which question it is practice for, and that question as the book has it. */
export function PracticeFor({ id }) {
  const [open, setOpen] = React.useState(false)
  const m = /^off:([^:]+):([A-Z]{2}):(\d+)$/.exec(id || "")
  const p = m ? offlinePaper(m[1]) : null
  if (!p) return null
  const sec = (p.sections || []).find((s) => s.id === m[2]), n = Number(m[3])
  const can = !!paperBoxes(p, m[2], n).q && !!paperPdf(p)
  return (
    <div className="bg-muted/40 flex flex-col gap-2 rounded-md border px-3 py-2 text-sm" data-testid="practice-for" data-for={id}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-muted-foreground">Practice for {p.name} · {sec ? sec.name : m[2]} question {n}</span>
        {can ? <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen((v) => !v)} data-testid="practice-for-show">{open ? "Hide the book's question" : "Show the book's question"}</Button> : null}
      </div>
      {open ? <PaperQuestion p={p} secId={m[2]} n={n} /> : null}
    </div>
  )
}
