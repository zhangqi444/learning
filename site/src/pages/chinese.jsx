import * as React from "react"
import { useMemo, useState } from "react"
import { BookOpen, Check, Eye, Mic, Play, RotateCcw, Square, Volume2, X } from "lucide-react"
import { D, ZH, ZH_ORDER, exItems, setId, zhExercises, zhHomework, zhLessons, zhSets } from "@/lib/content"
import { recordAttempts, reviewQueue } from "@/lib/engine"
import { t, tf, useLang } from "@/lib/lang"
import { go } from "@/lib/router"
import { speak, canSpeak } from "@/lib/speech"
import { alignChars, canRecognize, canRecord, markPassage, pace, startRecognition, startRecorder } from "@/lib/reading"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Textarea } from "@zhangqi444/ui/ui/textarea"
import { Runner } from "@/pages/runner"

/* The Chinese half of the site (docs/chinese.md). The spine is the lesson and the
 * unit of a week is the teacher's homework note, so this file has the week's
 * three tasks, the lesson's own pages, the dictation list, the reading, and a
 * sitting through the shared runner. Nothing here is scored into the ISEE
 * number. The chrome is Chinese by default with English behind the header's
 * toggle (lib/lang.js): every visible string is t(zh, en). */

const hwKey = (set) => "hw:" + set
function hwState(set) { return (Store.s.zh || {})[hwKey(set)] || {} }
const textKey = (lesson, what) => `text:${lesson}:${what}`
/** The passage: from the bundle when the lesson carries its text, else from her
 *  Drive record where a parent pasted it (docs/chinese.md § 8 on copyright). */
function passageFor(lesson, what) {
  const l = D.zh.lessons[lesson] || {}
  const r = l["阅读"], k = l["课文"]
  if (r && r.text && what.includes(r.title)) return r.text
  if (k && k.text && /课文/.test(what)) return k.text
  return ((Store.s.zh || {})[textKey(lesson, what)] || {}).text || ""
}

/** A speaker button. Every one is a tap, which is the only way sound may start. */
export function Speak({ text, className, label }) {
  return (
    <Button size="sm" variant="ghost" className={cn("h-7 px-1.5", className)} onClick={() => speak(text)} aria-label={label || `读 ${text}`} title={canSpeak() ? t("朗读", "Read aloud") : t("这个浏览器不能朗读", "This browser cannot read aloud")} data-testid="zh-speak" data-text={text}>
      <Volume2 className="size-4" />
    </Button>
  )
}

/* ---------- the week: one homework note, three kinds of task ---------- */
function ReadAloudTask({ note, task }) {
  useStore(); useLang()
  const st = hwState(note.set).read || {}
  const last = (st.attempts || []).slice(-1)[0]
  const passage = passageFor(note.lesson, task.what)
  // One button, two homes: beside 保存 while the passage is still to be pasted,
  // under the passage once it is there.
  const readBtn = <Button size="sm" onClick={() => go(`/chinese/read/${note.set}`)} data-testid="zh-read-open"><Mic /> {t("朗读", "Read it aloud")}</Button>
  return (
    <Card data-testid="zh-read">
      <CardHeader>
        <CardTitle>{t("阅读", "Reading")}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction>{st.done ? <Badge variant="success"><Check /> {t("已读", "Read")}</Badge> : <Badge variant="outline">{t("待读", "To do")}</Badge>}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {passage ? <p className="text-xl leading-9 tracking-wide" data-testid="zh-home-passage">{passage}</p>
          : <PassageSetup bare lesson={note.lesson} what={task.what} where={task.pages} actions={readBtn} />}
        {passage ? (
          <div className="flex flex-wrap items-center gap-3">
            {readBtn}
            {last ? <span className="text-muted-foreground text-xs tabular-nums">{t("上次", "last")}: {Math.round(last.ms / 1000)} {t("秒", "s")}{pace(last.total, last.ms) ? ` · ${pace(last.total, last.ms)} 字/分钟` : ""} · {t(`共 ${st.attempts.length} 次`, `${st.attempts.length} reading${st.attempts.length === 1 ? "" : "s"}`)}</span> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function WorkbookTask({ note, task, lesson }) {
  const store = useStore(); useLang()
  const rows = []
  for (const sub of ZH_ORDER) zhSets(sub, lesson.id).forEach((set, n) => rows.push({ sub, n, set, id: setId(sub, lesson.id, n), r: store.s.results[setId(sub, lesson.id, n)] }))
  const done = rows.filter((x) => x.r).length
  const exs = zhExercises(lesson.id), exSt = hwState(note.set).exercises || {}
  const exDone = exs.filter((ex) => exSt[ex.id]).length
  return (
    <Card data-testid="zh-workbook">
      <CardHeader>
        <CardTitle>{t("练习册", "Workbook")}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction><Badge variant={done === rows.length && exDone === exs.length ? "success" : "outline"}>{done + exDone}/{rows.length + exs.length}</Badge></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          {rows.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid="zh-sitting">
              <span className="text-sm">{ZH[x.sub].name} · {t(`第 ${x.n + 1} 组`, `Set ${x.n + 1}`)} <span className="text-muted-foreground">· {x.set.length} {t("题", "questions")}</span></span>
              <span className="flex items-center gap-2">
                {x.r ? <Badge variant="success" className="tabular-nums">{x.r.right}/{x.r.n}</Badge> : null}
                <Button size="sm" variant={x.r ? "outline" : "default"} onClick={() => go(`/chinese/run/${x.sub}/${lesson.id}/${x.n}`)}><Play /> {x.r ? t("再做一次", "Again") : t("开始", "Start")}</Button>
              </span>
            </div>
          ))}
        </div>
        {exs.length ? (
          <div className="flex flex-col gap-1.5" data-testid="zh-exercises">
            {exs.map((ex) => { const r = exSt[ex.id]; return (
              <div key={ex.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid="zh-exercise">
                <span className="text-sm">{t(ex.title, ex.title_en)} <span className="text-muted-foreground">· {ex.day} · p.{ex.page}</span></span>
                <span className="flex items-center gap-2">
                  {r ? <Badge variant="success" className="tabular-nums">{r.right}/{r.n}</Badge> : null}
                  <Button size="sm" variant={r ? "outline" : "default"} onClick={() => go(`/chinese/ex/${note.set}/${ex.id}`)}><Play /> {r ? t("再做一次", "Again") : t("开始", "Start")}</Button>
                </span>
              </div>) })}
          </div>
        ) : null}
        <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">{t(`纸上作业 — ${task.on_paper.length} 项`, `On paper — ${task.on_paper.length} exercises the book sets by hand`)}</summary>
          <ul className="mt-2 flex flex-col gap-1 pl-1">
            {task.on_paper.map((e, i) => <li key={i} className="text-muted-foreground">{e.day} · p.{e.page} · {e.ex} · {t(e.what, e.what_en || e.what)}</li>)}
          </ul>
          <p className="text-muted-foreground mt-2 text-xs">{tf(task.finding)}</p>
        </details>
      </CardContent>
    </Card>
  )
}

function DictationTask({ note, task }) {
  useStore(); useLang()
  const rated = Object.keys(hwState(note.set).dictation || {}).length
  const total = Object.values(task.words).reduce((n, a) => n + a.length, 0)
  return (
    <Card data-testid="zh-dictation-card">
      <CardHeader>
        <CardTitle>{t("听写", "Dictation")}</CardTitle>
        <CardDescription>{task.what}</CardDescription>
        <CardAction><Button size="sm" onClick={() => go(`/chinese/dictation/${note.set}`)}><Volume2 /> {t("练习", "Practise")}</Button></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">{tf(task.rule)}</p>
        <div className="text-sm">{t("已评", "Rated")} <span className="tabular-nums" data-testid="zh-rated-count">{rated}</span> / {total}</div>
      </CardContent>
    </Card>
  )
}

export function ChineseHome() {
  useStore(); useLang()
  const notes = zhHomework()
  const note = notes[0]
  const lesson = note ? D.zh.lessons[note.lesson] : zhLessons()[0]
  const q = reviewQueue(null, "chinese")
  if (!lesson) return <div className="text-muted-foreground p-6">{t("还没有中文课文。", "No Chinese lesson is in the bundle yet.")}</div>
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-home">
      <Card>
        <CardHeader>
          <CardTitle>第{lesson.no}课 · {lesson.title}</CardTitle>
          <CardDescription>{t(`${D.zh.manifest.volume} · ${D.zh.manifest.edition}`, `${lesson.title_en} · ${D.zh.manifest.volume} · ${D.zh.manifest.edition}`)}</CardDescription>
          <CardAction><Button size="sm" variant="outline" onClick={() => go(`/chinese/l/${lesson.id}`)}><BookOpen /> {t("生字词语", "The lesson")}</Button></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{lesson["生字"].items.length} 生字</span>
          <span>{lesson["词语"].items.length} 词语</span>
          <span data-testid="zh-review-due">{q.due.length ? t(`${q.due.length} 题待复习`, `${q.due.length} due for review`) : t("没有待复习的题", "nothing due for review")}</span>
        </CardContent>
      </Card>
      {note ? note.tasks.map((x) => x.kind === "read_aloud" ? <ReadAloudTask key={x.kind} note={note} task={x} /> : x.kind === "workbook" ? <WorkbookTask key={x.kind} note={note} task={x} lesson={lesson} /> : <DictationTask key={x.kind} note={note} task={x} />) : null}
    </div>
  )
}

/* ---------- the lesson's own pages ---------- */
export function Lesson({ id }) {
  useLang()
  const l = D.zh.lessons[id]
  if (!l) return <ChineseHome />
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-lesson">
      <Card>
        <CardHeader>
          <CardTitle>第{l.no}课 · {l.title}</CardTitle>
          <CardDescription>{t("", `${l.title_en} · `)}课文 p.{l.pages["课文"]} · 生字 p.{l.pages["生字·词语·句子"]} · 阅读 p.{l.pages["阅读"]}</CardDescription>
        </CardHeader>
        {l["课文"].text ? null : <CardContent className="text-muted-foreground text-sm">{t("课文请看课本。", "The text is read from the book, not from here.")}</CardContent>}
      </Card>
      <Card>
        <CardHeader><CardTitle>生字</CardTitle><CardDescription>{l["生字"].where}</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {l["生字"].items.map((z) => (
              <div key={z.zi} className="flex flex-col items-center gap-0.5 rounded-xl border p-3" data-testid="zh-char">
                <span className="text-muted-foreground text-xs">{z.py}</span>
                <span className="text-3xl leading-none">{z.zi}</span>
                <span className="text-muted-foreground text-xs">{tf(z.gloss)}</span>
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
  useStore(); useLang()
  const note = D.zh.homework[set]
  const task = note && note.tasks.find((x) => x.kind === "dictation")
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
          <CardTitle>{t("听写", "Dictation")}</CardTitle>
          <CardDescription>{task.what}</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums"><span data-testid="zh-rated">{rated}</span>/{total}{rated ? ` · ${t("对", "right")} ${right}` : ""}</Badge></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{tf(task.rule)}</CardContent>
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
                    {!open && !r ? <Button size="sm" variant="ghost" onClick={() => setShown((s) => ({ ...s, [w]: true }))} data-testid="zh-reveal"><Eye /> {t("显示", "Show")}</Button> : null}
                    {open || r ? (
                      <>
                        <Button size="sm" variant={r && r.ok ? "default" : "outline"} onClick={() => rate(w, true)} data-testid="zh-ok" aria-label={t("对了", "right")}><Check /></Button>
                        <Button size="sm" variant={r && r.ok === false ? "destructive" : "outline"} onClick={() => rate(w, false)} data-testid="zh-miss" aria-label={t("还没有", "not yet")}><X /></Button>
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

/* ---------- reading aloud: recorded, transcribed, aligned ---------- */
/** Where the passage comes from when the lesson does not carry its text: pasted
 *  once by a parent into her Drive record (docs/chinese.md § 8). `drive.file`
 *  scope means a file dropped into the folder by hand is invisible to the app,
 *  so the app writes it itself. */
function PassageSetup({ lesson, what, where, bare, actions }) {
  useLang()
  const [text, setText] = useState("")
  const body = (
    <>
      <p className="text-muted-foreground text-sm">{t(`课文还没有录入。请把${what}（${where}）的原文粘贴一次——只保存在她的 Drive 记录里，不在网站上。`, `The passage is not here yet. Paste the text of ${what} (${where}) once — it is kept in her Drive record, not on the site.`)}</p>
      <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("把课文粘贴到这里…", "Paste the passage here…")} data-testid="zh-passage-text" />
      <div className="flex flex-wrap items-center gap-3"><Button size="sm" disabled={!text.trim()} onClick={() => Store.setSlice("zh", textKey(lesson, what), (cur) => ({ ...cur, text: text.trim(), what, where }))} data-testid="zh-passage-save"><Check /> {t("保存", "Keep it")}</Button>{actions || null}</div>
    </>
  )
  if (bare) return <div className="flex flex-col gap-2" data-testid="zh-passage-setup">{body}</div>
  return <Card data-testid="zh-passage-setup"><CardContent className="flex flex-col gap-2 pt-6">{body}</CardContent></Card>
}
function Marked({ marks }) {
  // A character the recogniser did not hear is marked, never reddened: it is as
  // likely the recogniser's miss as hers, and docs/cats.md's four guardrails hold.
  return (
    <p className="text-xl leading-9 tracking-wide" data-testid="zh-marked">
      {marks.map((m, i) => <span key={i} className={cn(m.read && !m.hit && "border-b-2 border-dotted border-muted-foreground/70 text-muted-foreground")} data-hit={m.read ? (m.hit ? "1" : "0") : undefined}>{m.ch}</span>)}
    </p>
  )
}
export function ReadAloud({ set }) {
  useStore(); useLang()
  const note = D.zh.homework[set]
  const task = note && note.tasks.find((x) => x.kind === "read_aloud")
  const lesson = note && D.zh.lessons[note.lesson]
  const what = task ? task.what : ""
  const passage = note ? passageFor(note.lesson, what) : ""
  const [mode, setMode] = useState("idle")            // idle | recording | saving | done
  const [finals, setFinals] = useState(""), [interim, setInterim] = useState("")
  const [since, setSince] = useState(0), [now, setNow] = useState(0)
  const [result, setResult] = useState(null)
  const [parent, setParent] = useState(false)
  const [playUrl, setPlayUrl] = useState(null)
  const live = React.useRef(null)
  React.useEffect(() => { if (mode !== "recording") return; const tm = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(tm) }, [mode])
  if (!task || !lesson) return <ChineseHome />
  if (!passage) return <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-read-page"><PassageSetup lesson={note.lesson} what={what} where={task.pages} /></div>
  const st = hwState(set).read || {}
  const attempts = st.attempts || []
  const start = async () => {
    setResult(null); setFinals(""); setInterim(""); setPlayUrl(null)
    let rec = null
    try { rec = canRecord() ? await startRecorder() : null } catch { rec = null }   // no mic, or refused: the transcript alone still works
    const asr = startRecognition((f, i) => { setFinals(f); setInterim(i) })
    live.current = { rec, asr, t0: Date.now() }
    setSince(Date.now()); setNow(Date.now()); setMode("recording")
  }
  const stop = async () => {
    const l = live.current; if (!l) return
    setMode("saving"); l.asr.stop()
    const audio = l.rec ? await l.rec.stop() : { blob: null, ms: Date.now() - l.t0, mime: "" }
    const transcript = finals + interim
    const align = alignChars(passage, transcript)
    const fileId = audio.blob ? await Store.uploadMedia(`zh-read-${set}-${Date.now()}.${/mp4/.test(audio.mime) ? "m4a" : "webm"}`, audio.blob, audio.mime) : null
    const attempt = { at: new Date().toISOString(), ms: audio.ms, transcript, matched: align.matched, total: align.total, heard: align.heard, fileId, mime: audio.mime || null }
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, read: { done: true, at: attempt.at, minutes: Math.round(audio.ms / 60000), attempts: [...((cur.read || {}).attempts || []), attempt].slice(-8) } }))
    setResult({ ...attempt, marks: markPassage(passage, align), pct: align.pct }); setMode("done")
  }
  const play = async (id) => { const u = await Store.mediaUrl(id); setPlayUrl(u) }
  const sec = Math.round(((mode === "recording" ? now : 0) - since) / 1000)
  const p = result ? pace(result.total, result.ms) : null
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-read-page">
      <Card>
        <CardHeader>
          <CardTitle>{t("阅读", "Reading")}</CardTitle>
          <CardDescription>{what}</CardDescription>
          <CardAction>
            {mode === "recording" ? <Button size="sm" variant="destructive" onClick={stop} data-testid="zh-rec-stop"><Square /> {t("停止", "Stop")} · {sec} {t("秒", "s")}</Button>
              : mode === "saving" ? <Button size="sm" disabled>{t("保存中…", "Saving…")}</Button>
              : <Button size="sm" onClick={start} data-testid="zh-rec-start"><Mic /> {attempts.length ? t("再读一次", "Read it again") : t("开始朗读", "Start reading")}</Button>}
          </CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          {canRecognize() ? t("朗读课文。听到的字会出现在旁边；读完请按停止。", "Read the passage aloud. The words appear as they are heard; press Stop when you reach the end.") : t("这个浏览器不能识别语音——朗读仍会录下来保存。", "This browser cannot transcribe speech — the reading is still recorded and kept.")}
        </CardContent>
      </Card>
      <div className="grid gap-4 @md/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{what}</CardTitle></CardHeader>
          <CardContent>{result ? <Marked marks={result.marks} /> : <p className="text-xl leading-9 tracking-wide" data-testid="zh-passage">{passage}</p>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{mode === "recording" ? t("正在听…", "Hearing…") : result ? t("听到的", "Heard") : t("听到的", "What is heard")}</CardTitle><CardDescription>{t("识别结果，仅供参考", "as the recogniser hears it — an estimate")}</CardDescription></CardHeader>
          <CardContent>
            <p className="text-xl leading-9 tracking-wide min-h-10" data-testid="zh-transcript">{mode === "done" && result ? result.transcript : <>{finals}<span className="text-muted-foreground">{interim}</span></>}</p>
          </CardContent>
        </Card>
      </div>
      {result ? (
        <Card data-testid="zh-read-result">
          <CardHeader>
            <CardTitle>{t(`读了 ${Math.round(result.ms / 1000)} 秒`, `Read in ${Math.round(result.ms / 1000)} s`)}</CardTitle>
            <CardDescription>{p ? t(`大约 ${p} 字/分钟 · `, `about ${p} 字/分钟 · `) : t("太短，算不出速度 · ", "too short to tell the pace · ")}{t("点线标出的字是没听到的——再读一遍", "the dotted characters are ones the recogniser did not hear — read them once more")}</CardDescription>
            <CardAction><Button size="sm" variant="ghost" onClick={() => setParent((v) => !v)} data-testid="zh-parent-toggle">{parent ? t("收起", "Hide") : t("家长视图", "Parent view")}</Button></CardAction>
          </CardHeader>
          {parent ? (
            <CardContent className="flex flex-col gap-2 text-sm" data-testid="zh-parent">
              <div>{t("识别匹配 ", "")}<span className="tabular-nums" data-testid="zh-pct">{result.pct}%</span>{t(`（共 ${result.total} 字，听到 ${result.heard} 字）——仅供参考，不是评分。`, ` of ${result.total} characters matched, as heard by the recogniser — an estimate, not a mark. ${result.heard} heard in all.`)}</div>
              {result.fileId ? <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => play(result.fileId)} data-testid="zh-play"><Play /> {t("播放录音", "Play the recording")}</Button>{playUrl ? <audio controls autoPlay src={playUrl} /> : null}</div> : <div className="text-muted-foreground">{t("没有保存录音（没有麦克风，或没有连接 Drive）。", "No recording was kept (no microphone, or no Drive).")}</div>}
              {attempts.length > 1 ? <div className="text-muted-foreground">{t(`已保存 ${attempts.length} 次朗读 · 第一次 ${attempts[0].matched}/${attempts[0].total}`, `${attempts.length} readings kept · first ${attempts[0].matched}/${attempts[0].total}`)}</div> : null}
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}

/* ---------- the workbook's closed exercises, marked by rule ---------- */
/* Each type has one right answer the book fixes, so the device marks it: true or
 * false, the order of pieces, a sentence into a slot, parts into pairs, a
 * character into a group. What she did is kept in the zh slice under the note;
 * each markable item gets a learning record (ctx "exercise", evidence but never
 * scheduled, because the review runner is four-choice). A miss is explained in
 * the page's language. Nothing here reaches the ISEE number. */
const isPair = (ex, it) => ex.type === "match" && "left" in it
const isFill = (ex, it) => ex.type === "match" && "text" in it
function answered(ex, it, v) {
  if (ex.type === "tf") return typeof v === "boolean"
  if (ex.type === "order") return Array.isArray(v) && v.length === it.pieces.length
  if (isFill(ex, it)) return typeof v === "string"
  return Number.isInteger(v)
}
function isRight(ex, it, v) {
  if (ex.type === "order") return JSON.stringify(v) === JSON.stringify(it.key)
  return v === it.key
}
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"]
function TfWidget({ ex, ans, set1, done }) {
  return ex.items.map((it, i) => (
    <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid={`zh-tf-${i}`}>
      <span className="text-lg">{it.text}</span>
      <span className="flex shrink-0 gap-1.5">
        <Button size="sm" variant={ans[it.id] === true ? "default" : "outline"} disabled={!!done} onClick={() => set1(it.id, true)} data-testid="zh-tf-t">对</Button>
        <Button size="sm" variant={ans[it.id] === false ? "default" : "outline"} disabled={!!done} onClick={() => set1(it.id, false)} data-testid="zh-tf-f">错</Button>
      </span>
    </div>
  ))
}
function OrderWidget({ ex, ans, set1, done }) {
  return ex.items.map((it, i) => {
    const chosen = ans[it.id] || [], left = it.pieces.map((_, k) => k).filter((k) => !chosen.includes(k))
    const label = (k) => (it.labels ? it.labels[k] + " " : "") + it.pieces[k]
    return (
      <div key={it.id} className="flex flex-col gap-2 rounded-lg border p-3" data-testid={`zh-order-${i}`}>
        <div className="bg-muted/50 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md px-2 py-1" data-testid="zh-order-answer">
          {chosen.length ? chosen.map((k, j) => <button key={j} type="button" className="bg-background rounded-md border px-2 py-0.5 text-lg" disabled={!!done} onClick={() => set1(it.id, chosen.filter((_, q) => q !== j))}>{label(k)}</button>) : <span className="text-muted-foreground text-sm">{t("点下面的词，按顺序排好", "Tap the pieces below in order")}</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {left.map((k) => <Button key={k} size="sm" variant="outline" className="h-auto whitespace-normal text-left" disabled={!!done} onClick={() => set1(it.id, [...chosen, k])} data-testid="zh-piece">{label(k)}</Button>)}
        </div>
      </div>
    )
  })
}
function SlotsWidget({ ex, ans, set1, done }) {
  return ex.items.map((it, i) => (
    <div key={it.id} className="flex flex-col gap-2 rounded-lg border p-3" data-testid={`zh-slot-${i}`}>
      <p className="text-muted-foreground text-sm">{it.before}</p>
      <p className="text-lg">{it.slot}：{Number.isInteger(ans[it.id]) ? ex.options[ans[it.id]] : "______"}</p>
      <div className="flex flex-col gap-1.5">
        {ex.options.map((o, k) => <Button key={k} size="sm" variant={ans[it.id] === k ? "default" : "outline"} className="h-auto justify-start whitespace-normal text-left" disabled={!!done} onClick={() => set1(it.id, k)} data-testid="zh-option">{CIRCLED[k]} {o}</Button>)}
      </div>
    </div>
  ))
}
function MatchWidget({ ex, ans, set1, done }) {
  const [pick, setPick] = useState(null)
  const used = new Set(ex.items.map((it) => ans[it.id]).filter(Number.isInteger))
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          {ex.items.map((it) => <Button key={it.id} size="sm" variant={pick === it.id ? "default" : Number.isInteger(ans[it.id]) ? "secondary" : "outline"} className="justify-start text-lg" disabled={!!done} onClick={() => (Number.isInteger(ans[it.id]) ? set1(it.id, undefined) : setPick(pick === it.id ? null : it.id))} data-testid="zh-left">{it.left}{Number.isInteger(ans[it.id]) ? ` — ${ex.right[ans[it.id]]}` : ""}</Button>)}
        </div>
        <div className="flex flex-col gap-1.5">
          {ex.right.map((r, k) => <Button key={k} size="sm" variant="outline" className="justify-start text-lg" disabled={!!done || !pick || used.has(k)} onClick={() => { set1(pick, k); setPick(null) }} data-testid="zh-right">{r}</Button>)}
        </div>
      </div>
      {ex.fills ? (
        <div className="mt-3 flex flex-col gap-2">
          {ex.fills.given ? <p className="text-muted-foreground text-xs">{tf(ex.fills.given)}</p> : null}
          {ex.fills.items.map((it, i) => (
            <div key={it.id} className="flex flex-col gap-1.5 rounded-lg border p-3" data-testid={`zh-fill-${i}`}>
              <p className="text-lg">{ans[it.id] ? it.text.replace("______", ans[it.id]) : it.text}</p>
              <div className="flex flex-wrap gap-1.5">{ex.fills.options.map((o) => <Button key={o} size="sm" variant={ans[it.id] === o ? "default" : "outline"} disabled={!!done} onClick={() => set1(it.id, o)} data-testid="zh-fill-option">{o}</Button>)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}
function SortWidget({ ex, ans, set1, done }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ex.items.map((it) => { const g = ans[it.id]; return (
          <Button key={it.id} variant="outline" className="h-auto flex-col gap-0.5 px-4 py-2" disabled={!!done} onClick={() => set1(it.id, Number.isInteger(g) ? (g + 1) % ex.groups.length : 0)} data-testid="zh-sort-item">
            <span className="text-2xl">{it.text}</span>
            <span className="text-muted-foreground text-xs">{Number.isInteger(g) ? ex.groups[g] : t("点一下选结构", "tap to choose")}</span>
          </Button>) })}
      </div>
      {ex.groups.map((g, k) => <div key={g} className="text-sm"><span className="font-medium">{g}：</span>{ex.items.filter((it) => ans[it.id] === k).map((it) => it.text).join(" ") || "—"}</div>)}
    </div>
  )
}
const WIDGET = { tf: TfWidget, order: OrderWidget, slots: SlotsWidget, match: MatchWidget, sort: SortWidget }
const itemLabel = (ex, it) => it.text || it.left || it.slot || (it.pieces ? it.pieces.join(" / ") : it.id)
export function Exercise({ set, exId }) {
  useStore(); useLang()
  const note = D.zh.homework[set]
  const ex = note ? zhExercises(note.lesson).find((e) => e.id === exId) : null
  const [ans, setAns] = useState({})
  const [done, setDone] = useState(null)
  if (!ex) return <ChineseHome />
  const items = exItems(ex)
  const set1 = (id, v) => setAns((a) => ({ ...a, [id]: v }))
  const complete = items.every((it) => answered(ex, it, ans[it.id]))
  const prev = (hwState(set).exercises || {})[exId]
  const submit = () => {
    const marks = items.map((it) => ({ id: it.id, ok: isRight(ex, it, ans[it.id]), pick: ans[it.id] }))
    const right = marks.filter((m) => m.ok).length
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { at: new Date().toISOString(), right, n: items.length, answers: ans } } }))
    recordAttempts(marks.map((m) => ({ id: m.id, ok: m.ok, ms: 0, pick: JSON.stringify(m.pick === undefined ? null : m.pick) })), "exercise")
    setDone({ right, marks })
  }
  const Widget = WIDGET[ex.type]
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-ex">
      <Card>
        <CardHeader>
          <CardTitle>{t(ex.title, ex.title_en)}</CardTitle>
          <CardDescription>{ex.day} · p.{ex.page} · {t(`练习 ${ex.ex}`, `exercise ${ex.ex}`)}{prev ? ` · ${t("上次", "last")} ${prev.right}/${prev.n}` : ""}</CardDescription>
          <CardAction>{done ? <Button size="sm" variant="outline" onClick={() => { setAns({}); setDone(null) }}><RotateCcw /> {t("再做一次", "Again")}</Button> : <Button size="sm" disabled={!complete} onClick={submit} data-testid="zh-ex-submit"><Check /> {t("交卷", "Check")}</Button>}</CardAction>
        </CardHeader>
        {ex.note ? <CardContent className="text-muted-foreground text-sm">{tf(ex.note)}</CardContent> : null}
      </Card>
      <div className="flex flex-col gap-2">{Widget ? <Widget ex={ex} ans={ans} set1={set1} done={done} /> : null}</div>
      {done ? (
        <Card data-testid="zh-ex-result">
          <CardHeader>
            <CardTitle className="tabular-nums">{done.right} / {items.length}</CardTitle>
            <CardDescription>{done.right === items.length ? t("全对了！", "All right!") : t("错的下面有解释。", "The ones that went wrong are explained below.")}</CardDescription>
            <CardAction><Button size="sm" variant="outline" onClick={() => go("/chinese")}>{t("回到本周", "Back to the week")}</Button></CardAction>
          </CardHeader>
          {done.marks.some((m) => !m.ok) ? (
            <CardContent className="flex flex-col gap-2">
              {done.marks.filter((m) => !m.ok).map((m) => { const it = items.find((x) => x.id === m.id); return (
                <div key={m.id} className="rounded-md border p-3 text-sm" data-testid="zh-ex-miss">
                  <div className="font-medium">{itemLabel(ex, it)}</div>
                  <div className="text-muted-foreground">{tf(it.explanation)}</div>
                </div>) })}
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}

/* ---------- a sitting, and the review pile, through the same runner ---------- */
function ZhRun({ sub, lesson, n }) {
  const set = zhSets(sub, lesson)[n]
  const l = D.zh.lessons[lesson]
  if (!set || !l) return <ChineseHome />
  const id = setId(sub, lesson, n)
  return <Runner key={id} items={set} setId={id} prior={Store.s.results[id] || null} sub={sub} title={`${ZH[sub].name} · ${l.title} · ${t(`第 ${n + 1} 组`, `Set ${n + 1}`)}`} exitPath="/chinese" exitLabel={t("回到本周", "Back to the week")} />
}
function ZhReview() {
  const items = useMemo(() => reviewQueue(null, "chinese").due.map((x) => x.it), [])
  if (!items.length) return <ChineseHome />
  return <Runner items={items} custom ctx="review" resume="review:zh" sub="zh-word" title={t("中文 · 复习", "中文 · Review")} exitPath="/chinese" exitLabel={t("回到本周", "Back to the week")} />
}

/** The Chinese half's own route switch; `rest` is the route with `chinese` taken off. */
export function ChineseScreen({ rest }) {
  const [top, a, b, c] = rest
  if (top === "l" && a) return <Lesson key={a} id={a} />
  if (top === "run" && ZH[a] && b) return <ZhRun key={`${a}:${b}:${c}`} sub={a} lesson={b} n={+c || 0} />
  if (top === "dictation" && a) return <Dictation key={a} set={a} />
  if (top === "read" && a) return <ReadAloud key={a} set={a} />
  if (top === "ex" && a && b) return <Exercise key={a + b} set={a} exId={b} />
  if (top === "review") return <ZhReview />
  return <ChineseHome />
}
/** Breadcrumbs for the Chinese half, every one a real link. */
export function zhCrumbs(rest) {
  const [top, a, b, c] = rest
  const out = [{ label: "中文", path: "/chinese" }]
  const l = (id) => (D.zh && D.zh.lessons[id]) || null
  if (top === "l" && l(a)) out.push({ label: `第${l(a).no}课 ${l(a).title}`, path: `/chinese/l/${a}` })
  else if (top === "run" && ZH[a] && l(b)) { out.push({ label: `第${l(b).no}课 ${l(b).title}`, path: `/chinese/l/${b}` }); out.push({ label: `${ZH[a].name} · ${t(`第 ${(+c || 0) + 1} 组`, `Set ${(+c || 0) + 1}`)}`, path: `/chinese/run/${a}/${b}/${c || 0}` }) }
  else if (top === "dictation" && a) out.push({ label: `${t("听写", "Dictation")} · ${a}`, path: `/chinese/dictation/${a}` })
  else if (top === "read" && a) out.push({ label: `${t("阅读", "Reading")} · ${a}`, path: `/chinese/read/${a}` })
  else if (top === "ex" && a && b) { const n = D.zh && D.zh.homework[a], e = n && zhExercises(n.lesson).find((x) => x.id === b); out.push({ label: e ? t(e.title, e.title_en) : t("练习", "Exercise"), path: `/chinese/ex/${a}/${b}` }) }
  else if (top === "review") out.push({ label: t("复习", "Review"), path: "/chinese/review" })
  return out
}
