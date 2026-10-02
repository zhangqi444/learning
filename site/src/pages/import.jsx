import * as React from "react"
import { ChevronRight, Inbox, MessageSquareText } from "lucide-react"

import { fmtDate } from "@/lib/content"
import { t, useLang } from "@/lib/lang"
import { addReviews, parseImport, reviewPath, reviewTargetLabel } from "@/lib/reviews"
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
    try { return { map: parseImport(payload) } } catch (e) { return { err: e.message } }
  }, [payload])

  function add(map) {
    const list = Object.values(map)
    addReviews(map)
    setAdded(list)
    if (list.length === 1) go(reviewPath(list[0]))
  }
  function addPasted() {
    try { add(parseImport(text)) } catch (e) { setErr(e.message) }
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Inbox className="size-4" /> {s("添加批改", "Add a review")}</CardDescription>
          <CardTitle className="text-2xl font-semibold tracking-tight">{zh ? t("一周中文作业的批改", "A review of a week of Sheila's Chinese homework") : "A review of one of Sheila's essays"}</CardTitle>
          <CardDescription>{zh ? t(`会和她的记录保存在一起${mirrored ? "，并同步到 Google Drive" : ""}，显示在它批改的那一周下面。`, `It is kept with her progress${mirrored ? " and mirrored to Google Drive" : ""}, and shows on the week it is about.`) : `It is kept with her progress${mirrored ? " and mirrored to Google Drive" : ""}, and shows on the essay it is about.`}</CardDescription>
        </CardHeader>
      </Card>

      {added ? (
        <Card className="gap-3">
          <CardHeader><CardTitle>{s("已添加", "Added")}</CardTitle><CardDescription>{added.length === 1 ? (zh ? t("正在打开它批改的那一周。", "Opening the week it belongs to.") : "Opening the essay it belongs to.") : s(`添加了 ${added.length} 份批改。`, `${added.length} reviews added.`)}</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {added.map((r) => <Button key={r.id} variant="outline" size="sm" onClick={() => go(reviewPath(r))}>{reviewTargetLabel(r)} <ChevronRight /></Button>)}
          </CardContent>
        </Card>
      ) : preview.length ? (
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

      {!added ? (
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
