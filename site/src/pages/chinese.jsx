import * as React from "react"
import { useMemo, useState } from "react"
import { BookOpen, Check, Eye, Play, Volume2, X } from "lucide-react"
import { D, ZH, ZH_ORDER, setId, zhHomework, zhLessons, zhSets } from "@/lib/content"
import { reviewQueue } from "@/lib/engine"
import { go } from "@/lib/router"
import { speak, canSpeak } from "@/lib/speech"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Input } from "@zhangqi444/ui/ui/input"
import { Runner } from "@/pages/runner"

/* The Chinese half of the site (docs/chinese.md). The spine is the lesson and the
 * unit of a week is the teacher's homework note, so this file has three screens
 * and a sitting: the note with its three tasks, the lesson's own pages, and the
 * dictation list. Nothing here is scored into a number. A sitting records exactly
 * as an ISEE set does; the read-aloud is a time log; the dictation is shown, then
 * rated by her or a parent — the site cannot mark handwriting and must not
 * pretend to. */

const hwKey = (set) => "hw:" + set
function hwState(set) { return (Store.s.zh || {})[hwKey(set)] || {} }

/** A speaker button. Every one is a tap, which is the only way sound may start. */
export function Speak({ text, className, label }) {
  return (
    <Button size="sm" variant="ghost" className={cn("h-7 px-1.5", className)} onClick={() => speak(text)} aria-label={label || `读 ${text}`} title={canSpeak() ? "Read aloud" : "This browser cannot read aloud"} data-testid="zh-speak" data-text={text}>
      <Volume2 className="size-4" />
    </Button>
  )
}

/* ---------- the week: one homework note ---------- */
function ReadAloudTask({ note, task }) {
  useStore()
  const st = hwState(note.set).read || {}
  const [min, setMin] = useState(st.minutes || "")
  const save = (done) => Store.setSlice("zh", hwKey(note.set), (cur) => ({ ...cur, read: { done, minutes: Number(min) || 0, at: new Date().toISOString() } }))
  return (
    <Card data-testid="zh-read">
      <CardHeader>
        <CardTitle>{task.line}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction>{st.done ? <Badge variant="success"><Check /> Done</Badge> : <Badge variant="outline">To do</Badge>}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">{task.rule}</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm" htmlFor="zh-read-minutes">Minutes read</label>
          <Input id="zh-read-minutes" inputMode="numeric" className="w-20" value={min} onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ""))} data-testid="zh-read-minutes" />
          <Button size="sm" onClick={() => save(true)} data-testid="zh-read-done"><Check /> Read it</Button>
          {st.done ? <Button size="sm" variant="ghost" onClick={() => save(false)}>Undo</Button> : null}
          {st.minutes ? <span className="text-muted-foreground text-xs tabular-nums">last: {st.minutes} min</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function WorkbookTask({ note, task, lesson }) {
  const store = useStore()
  const rows = []
  for (const sub of ZH_ORDER) zhSets(sub, lesson.id).forEach((set, n) => rows.push({ sub, n, set, id: setId(sub, lesson.id, n), r: store.s.results[setId(sub, lesson.id, n)] }))
  const done = rows.filter((x) => x.r).length
  return (
    <Card data-testid="zh-workbook">
      <CardHeader>
        <CardTitle>{task.line}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction><Badge variant={done === rows.length ? "success" : "outline"}>{done}/{rows.length} sittings</Badge></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          {rows.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid="zh-sitting">
              <span className="text-sm">{ZH[x.sub].name} · Set {x.n + 1} <span className="text-muted-foreground">· {x.set.length} questions</span></span>
              <span className="flex items-center gap-2">
                {x.r ? <Badge variant="success" className="tabular-nums">{x.r.right}/{x.r.n}</Badge> : null}
                <Button size="sm" variant={x.r ? "outline" : "default"} onClick={() => go(`/chinese/run/${x.sub}/${lesson.id}/${x.n}`)}><Play /> {x.r ? "Again" : "Start"}</Button>
              </span>
            </div>
          ))}
        </div>
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">On paper — {task.on_paper.length} exercises the book sets by hand</summary>
          <ul className="mt-2 flex flex-col gap-1 pl-1">
            {task.on_paper.map((e, i) => <li key={i} className="text-muted-foreground">{e.day} · p.{e.page} · {e.ex} · {e.what}</li>)}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">{task.finding}</p>
        </details>
      </CardContent>
    </Card>
  )
}

function DictationTask({ note, task }) {
  useStore()
  const rated = Object.keys(hwState(note.set).dictation || {}).length
  const total = Object.values(task.words).reduce((n, a) => n + a.length, 0)
  return (
    <Card data-testid="zh-dictation-card">
      <CardHeader>
        <CardTitle>{task.line}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction><Button size="sm" onClick={() => go(`/chinese/dictation/${note.set}`)}><Volume2 /> Practise</Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{task.rule}</p>
        <div className="text-sm"><span className="tabular-nums" data-testid="zh-rated-count">{rated}</span> of {total} rated</div>
      </CardContent>
    </Card>
  )
}

export function ChineseHome() {
  useStore()
  const notes = zhHomework()
  const note = notes[0]
  const lesson = note ? D.zh.lessons[note.lesson] : zhLessons()[0]
  const q = reviewQueue(null, "chinese")
  if (!lesson) return <div className="text-muted-foreground p-6">No Chinese lesson is in the bundle yet.</div>
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-home">
      <Card>
        <CardHeader>
          <CardTitle>第{lesson.no}课 · {lesson.title}</CardTitle>
          <CardDescription>{lesson.title_en} · 教材 {lesson.pages["课文"]} · {D.zh.manifest.volume} · {D.zh.manifest.edition}</CardDescription>
          <CardAction><Button size="sm" variant="outline" onClick={() => go(`/chinese/l/${lesson.id}`)}><BookOpen /> The lesson</Button></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{lesson["生字"].items.length} 生字</span>
          <span>{lesson["词语"].items.length} 词语</span>
          <span data-testid="zh-review-due">{q.due.length ? `${q.due.length} due for review` : "nothing due for review"}</span>
        </CardContent>
      </Card>
      {note ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Homework · {note.set}</CardTitle>
              <CardDescription>The teacher's note, as written</CardDescription>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-2 pl-3 text-sm leading-6" data-testid="zh-note">{note.note_verbatim.map((l, i) => <div key={i}>{l}</div>)}</blockquote>
            </CardContent>
          </Card>
          {note.tasks.map((t) => t.kind === "read_aloud" ? <ReadAloudTask key={t.kind} note={note} task={t} /> : t.kind === "workbook" ? <WorkbookTask key={t.kind} note={note} task={t} lesson={lesson} /> : <DictationTask key={t.kind} note={note} task={t} />)}
        </>
      ) : null}
    </div>
  )
}

/* ---------- the lesson's own pages ---------- */
export function Lesson({ id }) {
  const l = D.zh.lessons[id]
  if (!l) return <ChineseHome />
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-lesson">
      <Card>
        <CardHeader>
          <CardTitle>第{l.no}课 · {l.title}</CardTitle>
          <CardDescription>{l.title_en} · 课文 p.{l.pages["课文"]} · 生字 p.{l.pages["生字·词语·句子"]} · 阅读 p.{l.pages["阅读"]}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{l["课文"].note.split(":")[0]}: the text is read from the book, not from here.</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>生字</CardTitle><CardDescription>{l["生字"].where}</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {l["生字"].items.map((z) => (
              <div key={z.zi} className="flex flex-col items-center gap-0.5 rounded-xl border p-3" data-testid="zh-char">
                <span className="text-muted-foreground text-xs">{z.py}</span>
                <span className="text-3xl leading-none">{z.zi}</span>
                <span className="text-muted-foreground text-xs">{z.gloss}</span>
                <Speak text={z.zi} />
              </div>
            ))}
          </div>
          {l["生字"]["部首"] ? <p className="text-muted-foreground mt-3 text-xs">部首 · {l["生字"]["部首"].map((b) => `${b.bu} → ${b.zi}`).join(" · ")}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>词语</CardTitle><CardDescription>{l["词语"].where}</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {l["词语"].items.map((w) => (
            <span key={w.w} className="flex items-center gap-1 rounded-lg border px-2 py-1" data-testid="zh-word">
              <span className="text-lg">{w.w}</span><span className="text-muted-foreground text-xs">{w.py}</span><Speak text={w.w} />
            </span>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>句子</CardTitle><CardDescription>{l["句子"].where} · 句型 {l["句型"].pattern}</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-lg">{l["句子"].zh} <Speak text={l["句子"].zh} /></p>
          <p className="text-muted-foreground text-sm">{l["句子"].py}</p>
          <p className="text-muted-foreground text-sm">{l["句型"].ladder.join(" → ")}</p>
        </CardContent>
      </Card>
      {["读一读", "用一用"].map((k) => (
        <Card key={k}>
          <CardHeader><CardTitle>{k}</CardTitle><CardDescription>{l[k].where}</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {l[k].rows.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {row.map((w) => <span key={w} className="flex items-center gap-0.5"><span>{w}</span><Speak text={w} /></span>)}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ---------- dictation: shown, then rated ---------- */
export function Dictation({ set }) {
  useStore()
  const note = D.zh.homework[set]
  const task = note && note.tasks.find((t) => t.kind === "dictation")
  const [shown, setShown] = useState({})
  if (!task) return <ChineseHome />
  const st = hwState(set).dictation || {}
  const rate = (w, ok) => Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, dictation: { ...(cur.dictation || {}), [w]: { ok, at: new Date().toISOString() } } }))
  const total = Object.values(task.words).reduce((n, a) => n + a.length, 0)
  const rated = Object.keys(st).length, right = Object.values(st).filter((x) => x.ok).length
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-dictation">
      <Card>
        <CardHeader>
          <CardTitle>{task.line}</CardTitle>
          <CardDescription>{task.what} · {task.rule}</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums"><span data-testid="zh-rated">{rated}</span>/{total} rated{rated ? ` · ${right} right` : ""}</Badge></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Tap the speaker, write the word on paper, then show it and mark it. The site never marks handwriting.</CardContent>
      </Card>
      {Object.keys(task.words).map((section) => (
        <Card key={section}>
          <CardHeader><CardTitle>{section}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {task.words[section].map((w) => {
              const r = st[w], open = !!shown[w]
              return (
                <div key={w} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid="zh-dict-row" data-word={w}>
                  <span className="flex items-center gap-2">
                    <Speak text={w} />
                    <span className={cn("text-lg tabular-nums", !open && !r && "select-none blur-sm")} aria-hidden={!open && !r}>{open || r ? w : "〇〇"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    {!open && !r ? <Button size="sm" variant="ghost" onClick={() => setShown((s) => ({ ...s, [w]: true }))} data-testid="zh-reveal"><Eye /> Show</Button> : null}
                    {open || r ? (
                      <>
                        <Button size="sm" variant={r && r.ok ? "default" : "outline"} onClick={() => rate(w, true)} data-testid="zh-ok" aria-label="right"><Check /></Button>
                        <Button size="sm" variant={r && r.ok === false ? "destructive" : "outline"} onClick={() => rate(w, false)} data-testid="zh-miss" aria-label="not yet"><X /></Button>
                      </>
                    ) : null}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/* ---------- a sitting, and the review pile, through the same runner ---------- */
function ZhRun({ sub, lesson, n }) {
  const set = zhSets(sub, lesson)[n]
  const l = D.zh.lessons[lesson]
  if (!set || !l) return <ChineseHome />
  const id = setId(sub, lesson, n)
  return <Runner key={id} items={set} setId={id} prior={Store.s.results[id] || null} sub={sub} title={`${ZH[sub].name} · ${l.title} · Set ${n + 1}`} exitPath="/chinese" exitLabel="Back to the week" />
}
function ZhReview() {
  const items = useMemo(() => reviewQueue(null, "chinese").due.map((x) => x.it), [])
  if (!items.length) return <ChineseHome />
  return <Runner items={items} custom ctx="review" resume="review:zh" sub="zh-word" title="中文 · Review" exitPath="/chinese" exitLabel="Back to the week" />
}

/** The Chinese half's own route switch; `rest` is the route with `chinese` taken off. */
export function ChineseScreen({ rest }) {
  const [top, a, b, c] = rest
  if (top === "l" && a) return <Lesson key={a} id={a} />
  if (top === "run" && ZH[a] && b) return <ZhRun key={`${a}:${b}:${c}`} sub={a} lesson={b} n={+c || 0} />
  if (top === "dictation" && a) return <Dictation key={a} set={a} />
  if (top === "review") return <ZhReview />
  return <ChineseHome />
}
/** Breadcrumbs for the Chinese half, every one a real link. */
export function zhCrumbs(rest) {
  const [top, a, b, c] = rest
  const out = [{ label: "中文", path: "/chinese" }]
  const l = (id) => (D.zh && D.zh.lessons[id]) || null
  if (top === "l" && l(a)) out.push({ label: `第${l(a).no}课 ${l(a).title}`, path: `/chinese/l/${a}` })
  else if (top === "run" && ZH[a] && l(b)) { out.push({ label: `第${l(b).no}课 ${l(b).title}`, path: `/chinese/l/${b}` }); out.push({ label: `${ZH[a].name} · Set ${(+c || 0) + 1}`, path: `/chinese/run/${a}/${b}/${c || 0}` }) }
  else if (top === "dictation" && a) out.push({ label: `听写 · ${a}`, path: `/chinese/dictation/${a}` })
  else if (top === "review") out.push({ label: "Review", path: "/chinese/review" })
  return out
}
