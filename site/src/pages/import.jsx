import * as React from "react"
import { ChevronRight, Inbox, MessageSquareText } from "lucide-react"

import { fmtDate } from "@/lib/content"
import { t, useLang } from "@/lib/lang"
import { addReviews, parseImport, parsePaperImport, reviewPath, reviewTargetLabel } from "@/lib/reviews"
import { addOfflineEntry, setPaperNotes } from "@/lib/engine"
import { go } from "@/lib/router"
import { DRIVE_ENABLED, useStore } from "@/lib/store"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Textarea } from "@zhangqi444/ui/ui/textarea"

/** #/import/<payload> — a review link made outside the app (docs/review.md).
 *  With no payload it is a paste box, for a phone that cannot open the long link. */
export function Import({ payload }) {
  const store = useStore()
  useLang()
  const [text, setText] = React.useState("")
  const [err, setErr] = React.useState(null)
  const [added, setAdded] = React.useState(null)
  const fromLink = React.useMemo(() => {
    if (!payload) return null
    // A paper's results first: they are not a review and have no summary to show.
    try { const paper = parsePaperImport(payload); if (paper) return { paper } } catch (e) { return { err: e.message } }
    try { return { map: parseImport(payload) } } catch (e) { return { err: e.message } }
  }, [payload])
  function addPaper(paper) {
    // A link may carry only what went wrong, for results already in: no entry for that.
    if (Object.keys(paper.scores).length || Object.keys(paper.missed).length || Object.keys(paper.tags).length)
      addOfflineEntry(paper.form.id, { sat: paper.sat, scores: paper.scores, missed: paper.missed, tags: paper.tags, id: paper.id, via: "link" })
    if (Object.keys(paper.notes).length || paper.analysis.length) setPaperNotes(paper.form.id, { notes: paper.notes, analysis: paper.analysis, by: paper.by })
    go("/mock/" + paper.form.id)
  }

  function add(map) {
    const list = Object.values(map)
    addReviews(map)
    setAdded(list)
    if (list.length === 1) go(reviewPath(list[0]))
  }
  function addPasted() {
    try { const paper = parsePaperImport(text); if (paper) return addPaper(paper); add(parseImport(text)) } catch (e) { setErr(e.message) }
  }
  const preview = fromLink && fromLink.map ? Object.values(fromLink.map) : []
  /* A link of Chinese reviews, and nothing else, makes this a Chinese page:
   * Chinese by default, English behind the header's toggle — which the header
   * shows for exactly this case (site-header.jsx). An essay review, or the bare
   * paste box, is the ISEE page it has always been. */
  const shown = preview.length ? preview : added || []
  const zh = shown.length > 0 && shown.every((r) => r.target.kind === "zh")
  const s = (zhText, en) => (zh ? t(zhText, en) : en)
  const mirrored = DRIVE_ENABLED && store.s.driveGranted
  const paperIn = fromLink && fromLink.paper

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {paperIn ? (
        <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
          <CardHeader>
            <CardDescription className="flex items-center gap-2"><Inbox className="size-4" /> Add a paper's results</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-tight">Results from a paper sat on paper</CardTitle>
            <CardDescription>They are kept with her progress{mirrored ? " and mirrored to Google Drive" : ""}, and show on the paper's page.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Inbox className="size-4" /> {s("添加批改", "Add a review")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{zh ? t("一周中文作业的批改", "A review of a week of Sheila's Chinese homework") : "A review of one of Sheila's essays"}</CardTitle>
          <CardDescription>{zh ? t(`会和她的记录保存在一起${mirrored ? "，并同步到 Google Drive" : ""}，显示在它批改的那一周下面。`, `It is kept with her progress${mirrored ? " and mirrored to Google Drive" : ""}, and shows on the week it is about.`) : `It is kept with her progress${mirrored ? " and mirrored to Google Drive" : ""}, and shows on the essay it is about.`}</CardDescription>
        </CardHeader>
      </Card>
      )}

      {fromLink && fromLink.paper ? (
        <Card className="gap-4" data-testid="paper-preview">
          <CardHeader>
            <CardTitle>{fromLink.paper.form.name}: results</CardTitle>
            <CardDescription>Sat on {fmtDate(fromLink.paper.sat + "T12:00:00")}{fromLink.paper.by ? ` · marked by ${fromLink.paper.by}` : ""}. Check the numbers against the marked sheet, then add them.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="divide-y rounded-md border">
              {fromLink.paper.form.sections.filter((s) => s.n).map((s) => {
                const sc = fromLink.paper.scores[s.id], mi = fromLink.paper.missed[s.id]
                return (
                  <li key={s.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm" data-testid="paper-row" data-sec={s.id}>
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{s.name}</span><span className="tabular-nums">{sc != null ? `${sc}/${s.n}` : "—"}</span></div>
                    {mi && mi.length ? <span className="text-muted-foreground text-xs">Missed {mi.join(", ")}{sc != null && s.n - sc !== mi.length ? ` · ${mi.length} listed, ${s.n - sc} by the score — check the sheet` : ""}</span> : null}
                  </li>
                )
              })}
            </ul>
            {Object.keys(fromLink.paper.notes).length || fromLink.paper.analysis.length ? (
              <p className="text-muted-foreground text-sm" data-testid="paper-preview-notes" data-n={Object.keys(fromLink.paper.notes).length}>
                It also says what went wrong{Object.keys(fromLink.paper.notes).length ? ` on ${Object.keys(fromLink.paper.notes).length} question${Object.keys(fromLink.paper.notes).length === 1 ? "" : "s"}` : ""}{fromLink.paper.analysis.length ? `${Object.keys(fromLink.paper.notes).length ? "," : ""} and what the misses have in common` : ""}. It shows on the paper's page.
              </p>
            ) : null}
            <div><Button onClick={() => addPaper(fromLink.paper)} data-testid="paper-add"><Inbox /> Add to Sheila's record</Button></div>
          </CardContent>
        </Card>
      ) : null}

      {added ? (
        <Card className="gap-3">
          <CardHeader><CardTitle>{s("已添加", "Added")}</CardTitle><CardDescription>{added.length === 1 ? (zh ? t("正在打开它批改的那一周。", "Opening the week it belongs to.") : "Opening the essay it belongs to.") : s(`添加了 ${added.length} 份批改。`, `${added.length} reviews added.`)}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {added.map((r) => <Button key={r.id} variant="outline" size="sm" onClick={() => go(reviewPath(r))}>{reviewTargetLabel(r)} <ChevronRight /></Button>)}
          </CardContent>
        </Card>
      ) : preview.length && !(fromLink && fromLink.paper) ? (
        <Card className="gap-4" data-testid="import-preview">
          <CardHeader>
            <CardTitle>{s(preview.length === 1 ? "这个链接里有一份批改" : `这个链接里有 ${preview.length} 份批改`, `${preview.length === 1 ? "One review" : `${preview.length} reviews`} in this link`)}</CardTitle>
            <CardDescription>{zh ? t("看看是不是这一周，再添加。", "Check it is the right week, then add it.") : "Check it is the right essay, then add it."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ul className="divide-y rounded-md border">
              {preview.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm"><MessageSquareText className="text-muted-foreground size-4" /> <span className="font-medium">{reviewTargetLabel(r)}</span> <span className="text-muted-foreground">· {r.reviewer} · {fmtDate(r.at, zh ? "zh-CN" : undefined)}</span></div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">{r.summary}</p>
                </li>
              ))}
            </ul>
            <div><Button onClick={() => add(fromLink.map)} data-testid="import-add"><Inbox /> {s("添加到 Sheila 的记录", "Add to Sheila's progress")}</Button></div>
          </CardContent>
        </Card>
      ) : null}

      {!added && !(fromLink && fromLink.paper) ? (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>{preview.length ? s("或者粘贴一份", "Or paste one") : s("粘贴批改", "Paste the review")}</CardTitle>
            <CardDescription>{fromLink && fromLink.err ? <span className="text-destructive">{fromLink.err}</span> : s("把批改链接，或批改本身，照批改者给的样子粘贴进来。", "Paste the review link, or the review itself, as it came from the reviewer.")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea value={text} onChange={(e) => { setText(e.target.value); setErr(null) }} rows={6} placeholder="https://learning.sheilazhang.org/#/import/…  or  { &quot;target&quot;: … }" className="font-mono text-xs" data-testid="import-text" />

            {err ? <p className="text-destructive text-sm">{err}</p> : null}
            <div><Button onClick={addPasted} disabled={!text.trim()} data-testid="import-paste-add"><Inbox /> {s("添加", "Add")}</Button></div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
