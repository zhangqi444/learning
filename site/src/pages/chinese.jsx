import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, Check, Eye, Mic, PenLine, Play, RotateCcw, Square, Volume2, X } from "lucide-react"
import { D, ZH, exItems, setId, zhBlock, zhDay, zhExercises, zhHomework, zhLessonLabel, zhLessons, zhSets, zhSubName, zhWorkbook } from "@/lib/content"
import { findItem, recordAttempts, reviewQueue } from "@/lib/engine"
import { t, tf, useLang } from "@/lib/lang"
import { go } from "@/lib/router"
import { speak, canSpeak } from "@/lib/speech"
import { alignChars, canRecognize, canRecord, markPassage, startRecognition, startRecorder } from "@/lib/reading"
import { boxToChar, drawReference, hasStrokes, judgeStrokes, strokeData, writtenWell } from "@/lib/strokes"
import { Ink } from "@/components/ink"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Runner } from "@/pages/runner"
import { reviewsFor } from "@/lib/reviews"
import { ReviewCard } from "@/components/review-card"

/* The Chinese half of the site (docs/chinese.md). The spine is the lesson and the
 * unit of a week is the teacher's homework note, so this file has the week's
 * three tasks, the lesson's own pages, the dictation list, the reading, and a
 * sitting through the shared runner. Nothing here is scored into the ISEE
 * number. The chrome is Chinese by default with English behind the header's
 * toggle (lib/lang.js): every visible string is t(zh, en). */

const hwKey = (set) => "hw:" + set
/** The notes a Chinese review left on this week's items, newest review winning. */
function zhNotes(set) {
  const out = {}
  for (const r of reviewsFor({ kind: "zh", set }).slice().reverse()) for (const it of r.items || []) out[it.id] = it
  return out
}
/** One note beside the thing it is about: ✓ or ✗ when it is a yes/no, then the sentence. */
function Note({ n }) {
  if (!n) return null
  return <div className="bg-accent text-accent-foreground flex items-start gap-2 rounded-md px-3 py-2 text-sm leading-relaxed" data-testid="zh-note-item">{n.ok === true ? <Check className="mt-0.5 size-4 shrink-0" /> : n.ok === false ? <X className="mt-0.5 size-4 shrink-0" /> : null}<span>{n.note}</span></div>
}
function hwState(set) { return (Store.s.zh || {})[hwKey(set)] || {} }
/** The homework note a page is about, from whatever its URL carries: a lesson
 *  id (the newest note that assigns the lesson), an exercise or block id
 *  (whose lesson is in its name), or the note's own date — the record's key,
 *  still accepted so a link already shared keeps working. The URL no longer
 *  has to say the date: the owner's point, 2 October, that her progress is
 *  hers and not the week's. The record stays under the week's note (hw:<set>),
 *  because what was assigned when is a fact worth keeping; only the address
 *  stopped saying it. */
const DATE = /^\d{4}-\d{2}-\d{2}$/
export function noteFor(key) {
  if (!key || !D.zh) return null
  if (DATE.test(key)) return D.zh.homework[key] || null
  const m = /^z[xb]:(L\d+)/.exec(key)
  const lesson = m ? m[1] : key
  return zhHomework().find((n) => n.lesson === lesson) || null   // zhHomework() is newest first
}
/** A speaker button. Every one is a tap, which is the only way sound may start. */
export function Speak({ text, className, label }) {
  return (
    <Button size="sm" variant="ghost" className={cn("h-7 px-1.5", className)} onClick={() => speak(text)} aria-label={label || t(`读 ${text}`, `Say ${text}`)} title={canSpeak() ? t("朗读", "Read aloud") : t("这个浏览器不能朗读", "This browser cannot read aloud")} data-testid="zh-speak" data-text={text}>
      <Volume2 className="size-4" />
    </Button>
  )
}

/* ---------- the week: one homework note, three kinds of task ---------- */
/** What she reads, said once: the passage's own title (the lesson's 阅读 section,
 *  when that is what the task names) and where it is in the book. `task.what` is
 *  the key the passage is kept under and begins with 阅读, which the card's title
 *  already says — printed under it, the word came three times in three lines. */
function readTitle(lesson, task) {
  const r = lesson && lesson["阅读"]
  if (r && r.title && task.what.includes(r.title)) return t(`《${r.title}》`, r.title_en || r.title)
  return t(task.what, task.what_en)
}
const readWhere = (task) => t(task.pages, task.pages_en)
function ReadAloudTask({ note, task }) {
  useStore(); useLang()
  const lesson = D.zh.lessons[note.lesson]
  const st = hwState(note.set).read || {}
  const last = (st.attempts || []).slice(-1)[0]
  return (
    <Card data-testid="zh-read">
      <CardHeader>
        <CardTitle>{t("阅读", "Reading")}</CardTitle>
        <CardDescription>{readTitle(lesson, task)} · {readWhere(task)}</CardDescription>
        <CardAction>{st.done ? <Badge variant="success"><Check /> {t("已读", "Read")}</Badge> : <Badge variant="outline">{t("待读", "To do")}</Badge>}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Note n={zhNotes(note.set).read} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => go(`/chinese/read/${note.lesson}`)} data-testid="zh-read-open"><Mic /> {t("朗读", "Read it aloud")}</Button>
          {last ? <span className="text-muted-foreground text-xs tabular-nums">{t("上次", "last")}: {Math.round(last.ms / 1000)} {t("秒", "s")} · {t(`共 ${st.attempts.length} 次`, `${st.attempts.length} reading${st.attempts.length === 1 ? "" : "s"}`)}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

const blockSetId = (b) => setId("zh-block", b.id.replace(/^zb:/, ""), 0)
function WorkbookTask({ note, task, lesson }) {
  const store = useStore(); useLang()
  const rows = zhWorkbook(note, lesson.id)
  const exSt = hwState(note.set).exercises || {}
  const notes = zhNotes(note.set)
  // A review changes the state of free writing only: the retell keeps the parent's
  // signature as its badge, and its note shows on its own page.
  const reviewed = (ex) => ex.type === "free" && ex.items.some((it) => notes[it.id])
  const rec = (row) => (row.kind === "block" ? store.s.results[blockSetId(row)] : exSt[row.id])
  const done = rows.filter((row) => rec(row)).length
  // A section per weekday — the book's own division — each folding: the first
  // day with something left is open, the rest closed, and a tap on a day's
  // heading opens or closes it. Twenty-one rows in one list was the owner's
  // "should be multiple sections, or collapse by default?".
  const days = []
  for (const row of rows) { const d = days[days.length - 1]; if (d && d.day === row.day) d.rows.push(row); else days.push({ day: row.day, rows: [row] }) }
  const firstLeft = days.findIndex((d) => d.rows.some((row) => !rec(row)))
  const [folds, setFolds] = useState({})
  const isOpen = (d, i) => (d.day in folds ? folds[d.day] : i === firstLeft)
  return (
    <Card data-testid="zh-workbook">
      <CardHeader>
        <CardTitle>{t("练习册", "Workbook")}</CardTitle>
        <CardDescription>{t(task.what, task.what_en)}</CardDescription>
        <CardAction><Badge variant={done === rows.length ? "success" : "outline"}>{done}/{rows.length}</Badge></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2" data-testid="zh-exercises">
          {days.map((d, i) => {
            const dDone = d.rows.filter((row) => rec(row)).length
            return (
              <details key={d.day} open={isOpen(d, i)} onToggle={(e) => { const open = e.currentTarget.open; setFolds((f) => (f[d.day] === open ? f : { ...f, [d.day]: open })) }} className="rounded-lg border" data-testid="zh-day-section" data-day={d.day} data-open={isOpen(d, i) ? "1" : "0"}>
                <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-semibold select-none" data-testid="zh-day">
                  <span>{zhDay(d.day)}</span>
                  <Badge variant={dDone === d.rows.length ? "success" : "outline"} className="tabular-nums">{dDone}/{d.rows.length}</Badge>
                </summary>
                <div className="flex flex-col gap-1.5 px-2 pb-2">
                  {d.rows.map((row) => {
                    const r = rec(row), isBlock = row.kind === "block"
                    return (
                        <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid={isBlock ? "zh-sitting" : "zh-exercise"} data-id={row.id}>
                          <span className="text-sm">{t(row.title, row.title_en)} <span className="text-muted-foreground">· {t(`练习 ${row.ex}`, `ex. ${row.ex}`)} · p.{row.page}{isBlock ? ` · ${row.items.length} ${t("题", "questions")}` : ""}</span></span>
                          <span className="flex items-center gap-2">
                            {isBlock ? (r ? <Badge variant="success" className="tabular-nums">{r.right}/{r.n}</Badge> : null)
                              : r && r.n != null ? <Badge variant="success" className="tabular-nums">{r.right}/{r.n}</Badge> : reviewed(row) ? <Badge variant="success">{t("已批改", "reviewed")}</Badge> : r && r.submitted ? <Badge variant="outline">{t("待批改", "awaiting review")}</Badge> : r && (r.told || r.parent) ? <Badge variant={r.parent ? "success" : "outline"}>{r.parent ? t("家长已听", "signed") : t("已录", "recorded")}</Badge> : r && r.read ? <Badge variant="success">{t("已读", "read")}</Badge> : null}
                            <Button size="sm" variant={r ? "outline" : "default"} onClick={() => go(isBlock ? `/chinese/block/${row.id}` : `/chinese/ex/${row.id}`)}>{row.type === "write" || row.type === "free" ? <PenLine /> : row.type === "speak" || row.type === "read" ? <Mic /> : <Play />} {r ? t("再做一次", "Again") : t("开始", "Start")}</Button>
                          </span>
                        </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </div>
        {/* Only what is still on paper, if anything is. The note's own account of
            why the list looks the way it does is a record for the next author
            (scope_note), not a thing for her page. */}
        {task.on_paper.length ? <details className="text-sm">
          <summary className="text-muted-foreground cursor-pointer">{t(`纸上作业 — ${task.on_paper.length} 项`, `On paper — ${task.on_paper.length} exercises the book sets by hand`)}</summary>
          <ul className="mt-2 flex flex-col gap-1 pl-1">
            {task.on_paper.map((e, i) => <li key={i} className="text-muted-foreground">{zhDay(e.day)} · p.{e.page} · {e.ex} · {t(e.what, e.what_en)}</li>)}
          </ul>
        </details> : null}
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
        <CardDescription>{t(task.what, task.what_en)}</CardDescription>
        <CardAction><Button size="sm" onClick={() => go(`/chinese/dictation/${note.lesson}`)}><Volume2 /> {t("练习", "Practise")}</Button></CardAction>
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
          <CardTitle>{t(`第${lesson.no}课`, `Lesson ${lesson.no}`)} · {t(lesson.title, lesson.title_en)}</CardTitle>
          <CardDescription>{t(`${D.zh.manifest.volume} · ${D.zh.manifest.edition}`, `${D.zh.manifest.volume_en} · ${D.zh.manifest.edition_en}`)}</CardDescription>
          <CardAction><Button size="sm" variant="outline" onClick={() => go(`/chinese/l/${lesson.id}`)}><BookOpen /> {t("生字词语", "The lesson")}</Button></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>{t(`${lesson["生字"].items.length} 生字`, `${lesson["生字"].items.length} new characters`)}</span>
          <span>{t(`${lesson["词语"].items.length} 词语`, `${lesson["词语"].items.length} words`)}</span>
          <span data-testid="zh-review-due">{q.due.length ? t(`${q.due.length} 题待复习`, `${q.due.length} due for review`) : t("没有待复习的题", "nothing due for review")}</span>
        </CardContent>
      </Card>
      {note ? note.tasks.map((x) => x.kind === "read_aloud" ? <ReadAloudTask key={x.kind} note={note} task={x} /> : x.kind === "workbook" ? <WorkbookTask key={x.kind} note={note} task={x} lesson={lesson} /> : <DictationTask key={x.kind} note={note} task={x} />) : null}
      {note ? reviewsFor({ kind: "zh", set: note.set }).map((r) => <ReviewCard key={r.id} r={r} labels={{ title: t("批改", "What a reader noticed"), readFrom: t("来源：", "Read from"), words: t("字", "words"), fresh: t("新", "New"), worked: t("做得好", "What worked"), tryThis: t("试试这样", "Try this"), next: t("下周：", "For next week:"), checklist: t("清单上", "On the checklist"), open: t("打开", "Open"), locale: t("zh-CN", undefined), stale: (d) => t(`这份批改看的是 ${d} 的那一稿；之后作业又改过。`, `This review is of the draft from ${d}; the work here has changed since.`) }} />) : null}
    </div>
  )
}

/* ---------- the lesson's own pages ---------- */
/** The book's section headings, said in English when the page is. */
const SECTION_EN = { "读一读": "Read aloud", "用一用": "Use it" }
export function Lesson({ id }) {
  useLang()
  const l = D.zh.lessons[id]
  if (!l) return <ChineseHome />
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-lesson">
      <Card>
        <CardHeader>
          <CardTitle>{t(`第${l.no}课`, `Lesson ${l.no}`)} · {t(l.title, l.title_en)}</CardTitle>
          <CardDescription>{t("课文", "Text")} p.{l.pages["课文"]} · {t("生字", "Characters")} p.{l.pages["生字·词语·句子"]} · {t("阅读", "Reading")} p.{l.pages["阅读"]}</CardDescription>
        </CardHeader>
        {l["课文"].text ? null : <CardContent className="text-muted-foreground text-sm">{t("课文请看课本。", "The text is read from the book, not from here.")}</CardContent>}
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("生字", "New characters")}</CardTitle><CardDescription>{tf(l["生字"].where)}</CardDescription></CardHeader>
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
          {l["生字"]["部首"] ? <p className="text-muted-foreground mt-3 text-xs">{t("部首", "Radicals")} · {l["生字"]["部首"].map((b) => `${b.bu} → ${b.zi}`).join(" · ")}</p> : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("词语", "Words")}</CardTitle><CardDescription>{tf(l["词语"].where)}</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {l["词语"].items.map((w) => (
            <span key={w.w} className="flex items-center gap-1 rounded-lg border px-2 py-1" data-testid="zh-word">
              <span className="text-lg">{w.w}</span><span className="text-muted-foreground text-xs">{w.py}</span><Speak text={w.w} />
            </span>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t("句子", "Sentence")}</CardTitle><CardDescription>{tf(l["句子"].where)} · {t("句型", "Pattern")} <span data-testid="zh-pattern">{l["句型"].pattern}</span></CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="flex items-center gap-2 text-lg">{l["句子"].zh} <Speak text={l["句子"].zh} /></p>
          <p className="text-muted-foreground text-sm">{l["句子"].py}</p>
          <p className="text-muted-foreground text-sm">{l["句型"].ladder.join(" → ")}</p>
        </CardContent>
      </Card>
      {["读一读", "用一用"].map((k) => (
        <Card key={k}>
          <CardHeader><CardTitle>{t(k, SECTION_EN[k])}</CardTitle><CardDescription>{tf(l[k].where)}</CardDescription></CardHeader>
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
  const [writing, setWriting] = useState(null)      // the word being written with the Pencil
  const boxes = useRef({})
  if (!task) return <ChineseHome />
  const st = hwState(set).dictation || {}
  const writable = (w) => [...w].every((ch) => !/[\p{Script=Han}]/u.test(ch) || hasStrokes(ch))
  const startWrite = (w) => { boxes.current = {}; setWriting(w); speak(w) }
  const boxDone = (w, ch, i, r) => {
    boxes.current[i] = r
    const chars = [...w].filter((c) => /\p{Script=Han}/u.test(c))
    if (Object.keys(boxes.current).length < chars.length) return
    const mistakes = Object.values(boxes.current).reduce((n, x) => n + x.mistakes, 0)
    const nStrokes = chars.reduce((n, c) => n + ((strokeData(c) || { strokes: [] }).strokes.length), 0)
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, dictation: { ...(cur.dictation || {}), [w]: { ok: writtenWell(mistakes, nStrokes), at: new Date().toISOString(), mode: "pencil", mistakes, strokes: Object.values(boxes.current).map((x) => ({ ch: x.ch, strokes: x.strokes })) } } }))
    setWriting(null)
  }
  const rate = (w, ok) => Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, dictation: { ...(cur.dictation || {}), [w]: { ok, at: new Date().toISOString() } } }))
  const total = Object.values(task.words).reduce((n, a) => n + a.length, 0)
  const rated = Object.keys(st).length, right = Object.values(st).filter((x) => x.ok).length
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-dictation">
      <Card>
        <CardHeader>
          <CardTitle>{t("听写", "Dictation")}</CardTitle>
          <CardDescription>{t(task.what, task.what_en)}</CardDescription>
          <CardAction><Badge variant="outline" className="tabular-nums"><span data-testid="zh-rated">{rated}</span>/{total}{rated ? ` · ${t("对", "right")} ${right}` : ""}</Badge></CardAction>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">{tf(task.rule)}</CardContent>
      </Card>
      {Object.keys(task.words).map((section) => (
        <Card key={section}>
          <CardHeader><CardTitle>{t(section, (task.sections_en || {})[section] || section)}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {task.words[section].map((w) => {
              const r = st[w], open = !!shown[w]
              if (writing === w) return (
                <div key={w} className="flex flex-col gap-2 rounded-lg border px-3 py-2" data-testid="zh-dict-row" data-word={w} data-writing="1">
                  <div className="flex items-center gap-2"><Speak text={w} /><span className="text-muted-foreground text-sm">{t(`听一听，写 ${[...w].filter((c) => /\p{Script=Han}/u.test(c)).length} 个字`, `Listen, then write ${[...w].filter((c) => /\p{Script=Han}/u.test(c)).length} characters`)}</span><Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setWriting(null)}>{t("取消", "Cancel")}</Button></div>
                  <div className="flex flex-wrap gap-2">{[...w].filter((c) => /\p{Script=Han}/u.test(c)).map((ch, i) => <HanziBox key={w + i} ch={ch} label={`${i + 1}`} onDone={(res) => boxDone(w, ch, i, res)} />)}</div>
                </div>
              )
              return (
                <div key={w} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid="zh-dict-row" data-word={w}>
                  <span className="flex items-center gap-2">
                    <Speak text={w} />
                    <span className={cn("text-lg tabular-nums", !open && !r && "select-none blur-sm")} aria-hidden={!open && !r}>{open || r ? w : "〇〇"}</span>
                    {r && r.mode === "pencil" ? <Badge variant="outline" className="text-xs">{r.mistakes ? t(`笔 · 错 ${r.mistakes} 笔`, `pen · ${r.mistakes} wrong strokes`) : t("笔 · 一笔没错", "pen · every stroke right")}</Badge> : null}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {!open && !r && writing !== w && writable(w) ? <Button size="sm" variant="default" onClick={() => startWrite(w)} data-testid="zh-write"><PenLine /> {t("写", "Write")}</Button> : null}
                    {!open && !r && writing !== w ? <Button size="sm" variant="ghost" onClick={() => setShown((s) => ({ ...s, [w]: true }))} data-testid="zh-reveal"><Eye /> {t("显示", "Show")}</Button> : null}
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
function Marked({ marks }) {
  // A character the recogniser did not hear is highlighted — amber, the way a
  // reading app marks the words it did not catch, never red: it is as likely the
  // recogniser's miss as hers, and docs/cats.md's four guardrails hold.
  return (
    <p className="text-xl leading-9 tracking-wide whitespace-pre-line" data-testid="zh-marked">
      {marks.map((m, i) => <span key={i} className={cn("rounded-sm", m.read && !m.hit && "bg-warning-soft text-warning")} data-hit={m.read ? (m.hit ? "1" : "0") : undefined}>{m.ch}</span>)}
    </p>
  )
}
/** The comparison, once there is an evaluation: the whole passage with the words
 *  not heard highlighted, and what was heard beside it. */
function Compared({ passage, transcript }) {
  const align = alignChars(passage, transcript || "")
  return (
    <div className="grid gap-3 @md/main:grid-cols-2" data-testid="zh-compare">
      <div><div className="text-muted-foreground mb-1 text-xs">{t("课文——标出的字没有听清", "The passage — highlighted: not heard clearly")}</div><Marked marks={markPassage(passage, align)} /></div>
      <div><div className="text-muted-foreground mb-1 text-xs">{t("听到的", "What was heard")}</div><p className="text-xl leading-9 tracking-wide whitespace-pre-line" data-testid="zh-transcript">{transcript || t("（什么也没听到）", "(nothing heard)")}</p></div>
    </div>
  )
}
/** Her own recording, played back: the blob just recorded, or the file in Drive. */
function PlayAgain({ blobUrl, fileId, testid = "zh-play-again" }) {
  // The button is the whole of it until she presses it: then the player appears
  // and plays — the blob just recorded, or the file fetched from her Drive.
  const [url, setUrl] = useState(null)
  const ref = useRef(null)
  useEffect(() => { setUrl(null) }, [blobUrl, fileId])
  const play = async () => {
    if (url) { const a = ref.current; if (a) { try { a.currentTime = 0; await a.play() } catch { /* the controls are there */ } } return }
    let u = blobUrl || null
    if (!u && fileId) { try { u = await Store.mediaUrl(fileId) } catch { u = null } }
    if (u) setUrl(u)
  }
  if (!blobUrl && !fileId) return null
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={play} data-testid={testid}><Play /> {t("再听一遍", "Listen again")}</Button>
      {url ? <audio ref={ref} controls autoPlay src={url} className="h-8" data-testid={`${testid}-audio`} /> : null}
    </span>
  )
}
export function ReadAloud({ set }) {
  useStore(); useLang()
  const note = D.zh.homework[set]
  const task = note && note.tasks.find((x) => x.kind === "read_aloud")
  const lesson = note && D.zh.lessons[note.lesson]
  const [mode, setMode] = useState("idle")            // idle | recording | saving | done
  const [finals, setFinals] = useState(""), [interim, setInterim] = useState("")
  const [since, setSince] = useState(0), [now, setNow] = useState(0)
  const [result, setResult] = useState(null)
  const [parent, setParent] = useState(false)
  const [playUrl, setPlayUrl] = useState(null)
  const [blobUrl, setBlobUrl] = useState(null)
  const live = React.useRef(null)
  React.useEffect(() => { if (mode !== "recording") return; const tm = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(tm) }, [mode])
  if (!task || !lesson) return <ChineseHome />
  const st = hwState(set).read || {}
  const attempts = st.attempts || []
  const start = async () => {
    setResult(null); setFinals(""); setInterim(""); setPlayUrl(null)
    let rec = null
    try { rec = canRecord() ? await startRecorder() : null } catch { rec = null }   // no mic, or refused: the transcript alone is still kept
    const asr = startRecognition((f, i) => { setFinals(f); setInterim(i) })
    live.current = { rec, asr, t0: Date.now() }
    setSince(Date.now()); setNow(Date.now()); setMode("recording")
  }
  const stop = async () => {
    const l = live.current; if (!l) return
    setMode("saving"); l.asr.stop()
    const audio = l.rec ? await l.rec.stop() : { blob: null, ms: Date.now() - l.t0, mime: "" }
    if (audio.blob) { try { setBlobUrl(URL.createObjectURL(audio.blob)) } catch { /* no-op */ } }
    const transcript = finals + interim
    const fileId = audio.blob ? await Store.uploadMedia(`zh-read-${set}-${Date.now()}.${/mp4/.test(audio.mime) ? "m4a" : "webm"}`, audio.blob, audio.mime) : null
    // No alignment here: the site holds no text of the book. The recogniser's
    // transcript is kept as a hint for the evaluation, which brings the passage.
    const attempt = { at: new Date().toISOString(), ms: audio.ms, transcript, fileId, mime: audio.mime || null }
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, read: { done: true, at: attempt.at, minutes: Math.round(audio.ms / 60000), attempts: [...((cur.read || {}).attempts || []), attempt].slice(-8) } }))
    setResult(attempt); setMode("done")
  }
  const play = async (id) => { const u = await Store.mediaUrl(id); setPlayUrl(u) }
  const sec = Math.round(((mode === "recording" ? now : 0) - since) / 1000)
  const last = result || attempts[attempts.length - 1] || null
  const evalNote = zhNotes(set).read
  // The comparison exists only once a review brought the book's text with it
  // (docs/review.md: a read item's `passage`, and `heard` — the reviewer's own
  // transcription, or failing that the recogniser's).
  const compared = evalNote && evalNote.passage ? <Compared passage={evalNote.passage} transcript={evalNote.heard || (last && last.transcript) || ""} /> : null
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-read-page">
      {/* She reads from the book: the site never holds the passage (the owner's
          decision, 2 October — docs/chinese.md § 8). The recogniser runs while
          she reads, silently; its transcript is a hint for the evaluation. */}
      <Card>
        <CardHeader>
          <CardTitle>{t("阅读", "Reading")}</CardTitle>
          <CardDescription>{readTitle(lesson, task)} · {readWhere(task)}</CardDescription>
          <CardAction>
            {mode === "recording" ? <Button size="sm" variant="destructive" onClick={stop} data-testid="zh-rec-stop"><Square /> {t("停止", "Stop")} · {sec} {t("秒", "s")}</Button>
              : mode === "saving" ? <Button size="sm" disabled>{t("保存中…", "Saving…")}</Button>
              : <Button size="sm" onClick={start} data-testid="zh-rec-start"><Mic /> {attempts.length ? t("再读一次", "Read it again") : t("开始朗读", "Start reading")}</Button>}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">{t(`翻开${readWhere(task)}，对着书朗读；读完请按停止。录好了可以再听一遍。`, `Open the book to ${readWhere(task)} and read from it; press Stop at the end. Then you can listen to it again.`)}</p>
          {mode === "recording" ? <p className="font-medium" data-testid="zh-recording">{t(`正在录音 · ${sec} 秒`, `Recording · ${sec} s`)}</p> : null}
        </CardContent>
      </Card>
      {/* After recording: her recording, to listen to again — and nothing else.
          Once evaluated, the comparison the review brought and the note. The
          parent view has the recogniser's transcript at any time. */}
      {last ? (
        <Card data-testid="zh-read-result">
          <CardHeader>
            <CardTitle>{t(`已录好 · ${Math.round(last.ms / 1000)} 秒`, `Recorded · ${Math.round(last.ms / 1000)} s`)}</CardTitle>
            <CardDescription>{evalNote ? t("已批改。", "Evaluated.") : t("交给批改。", "Handed in for evaluation.")}</CardDescription>
            <CardAction><Button size="sm" variant="ghost" onClick={() => setParent((v) => !v)} data-testid="zh-parent-toggle">{parent ? t("收起", "Hide") : t("家长视图", "Parent view")}</Button></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <PlayAgain blobUrl={result ? blobUrl : null} fileId={last.fileId} />
            {compared}
            <Note n={evalNote} />
          </CardContent>
          {parent ? (
            <CardContent className="flex flex-col gap-2 border-t pt-4 text-sm" data-testid="zh-parent">
              <div className="text-muted-foreground text-xs">{t("识别听到的（仅供参考）", "What the recogniser heard (a hint, not a mark)")}</div>
              <p className="text-lg leading-8" data-testid="zh-transcript">{last.transcript || t("（什么也没听到）", "(nothing heard)")}</p>
              {last.fileId ? <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => play(last.fileId)} data-testid="zh-play"><Play /> {t("播放录音", "Play the recording")}</Button>{playUrl ? <audio controls autoPlay src={playUrl} /> : null}</div> : <div className="text-muted-foreground">{t("没有保存录音（没有麦克风，或没有连接 Drive）。", "No recording was kept (no microphone, or no Drive).")}</div>}
              {attempts.length > 1 ? <div className="text-muted-foreground">{t(`已保存 ${attempts.length} 次朗读`, `${attempts.length} readings kept`)}</div> : null}
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
  if (ex.type === "write") return !!(v && v.done)
  if (ex.type === "free") return true
  if (ex.type === "tf") return typeof v === "boolean"
  if (ex.type === "order") return Array.isArray(v) && v.length === it.pieces.length
  if (isFill(ex, it)) return typeof v === "string"
  return Number.isInteger(v)
}
function isRight(ex, it, v) {
  if (ex.type === "write") return !!(v && v.done) && writtenWell(v.mistakes, v.n)
  if (ex.type === "order") return JSON.stringify(v) === JSON.stringify(it.key)
  return v === it.key
}
const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"]
function TfWidget({ ex, ans, set1, done }) {
  return ex.items.map((it, i) => (
    <div key={it.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2" data-testid={`zh-tf-${i}`}>
      <span className="text-lg">{it.text}</span>
      <span className="flex shrink-0 gap-1.5">
        <Button size="sm" variant={ans[it.id] === true ? "default" : "outline"} disabled={!!done} onClick={() => set1(it.id, true)} data-testid="zh-tf-t">{t("对", "True")}</Button>
        <Button size="sm" variant={ans[it.id] === false ? "default" : "outline"} disabled={!!done} onClick={() => set1(it.id, false)} data-testid="zh-tf-f">{t("错", "False")}</Button>
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
/** A dialogue with lines missing: the line before, the speaker whose line it
 *  is, and the lines to choose from — at reading size, with room between them.
 *  The first version was three cramped rows; the owner's "why so compact". */
function SlotsWidget({ ex, ans, set1, done }) {
  return ex.items.map((it, i) => (
    <div key={it.id} className="flex flex-col gap-4 rounded-lg border p-4" data-testid={`zh-slot-${i}`}>
      <p className="text-muted-foreground text-base leading-7">{it.before}</p>
      <p className="text-lg leading-8"><span className="font-medium">{it.slot}：</span>{Number.isInteger(ans[it.id]) ? ex.options[ans[it.id]] : <span className="text-muted-foreground">______</span>}</p>
      <div className="flex flex-col gap-2">
        {ex.options.map((o, k) => <Button key={k} variant={ans[it.id] === k ? "default" : "outline"} className="h-auto justify-start whitespace-normal px-4 py-3 text-left text-base leading-7" disabled={!!done} onClick={() => set1(it.id, k)} data-testid="zh-option">{CIRCLED[k]} {o}</Button>)}
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
/** 结构分类 as blocks she moves: each character is a tile, dragged into the box
 *  for its structure — 左右结构 or 上下结构 — and out again, or across to the
 *  other box. Pointer events, so a finger, the Pencil and a mouse all drag; a
 *  tile that is tapped rather than dragged steps into the next box, so a click
 *  still sorts. A mechanic in docs/cats.md's terms: the sorting is the exercise.
 *  The owner's ask, 2 October: "why not a block-moving experience". */
function SortWidget({ ex, ans, set1, done }) {
  const [drag, setDrag] = useState(null)   // a tile in the air: where it is, where it started, which box it is over
  const zones = useRef({})
  const hit = (x, y) => {
    for (const [k, el] of Object.entries(zones.current)) {
      if (!el || !/^\d+$/.test(k)) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return +k
    }
    return null
  }
  const down = (it) => (e) => {
    if (done) return
    e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* no-op */ }
    const r = e.currentTarget.getBoundingClientRect()
    setDrag({ id: it.id, text: it.text, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, over: null, moved: false })
  }
  const move = (e) => {
    setDrag((d) => { if (!d) return d; const moved = d.moved || Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6; return { ...d, x: e.clientX, y: e.clientY, moved, over: moved ? hit(e.clientX, e.clientY) : null } })
  }
  const up = (it) => (e) => {
    const d = drag; setDrag(null); if (!d) return
    if (!d.moved) { const g = ans[it.id]; set1(it.id, Number.isInteger(g) ? (g + 1) % ex.groups.length : 0); return }
    const z = hit(e.clientX, e.clientY); set1(it.id, z == null ? undefined : z)
  }
  const tile = (it, where) => (
    <button key={it.id} type="button" className={cn("bg-background rounded-lg border px-4 py-2 text-2xl shadow-sm select-none", drag && drag.id === it.id && drag.moved && "opacity-30", done ? "cursor-default" : "cursor-grab")} style={{ touchAction: "none" }} disabled={!!done}
      onPointerDown={down(it)} onPointerMove={move} onPointerUp={up(it)} onPointerCancel={() => setDrag(null)} data-testid="zh-sort-item" data-id={it.id} data-where={where}>{it.text}</button>
  )
  const pool = ex.items.filter((it) => !Number.isInteger(ans[it.id]))
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-muted/40 flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-dashed p-2" data-testid="zh-sort-pool">
        {pool.length ? pool.map((it) => tile(it, "pool")) : <span className="text-muted-foreground px-1 text-sm">{t("都放好了", "All sorted")}</span>}
      </div>
      <p className="text-muted-foreground text-xs">{t("把每个字拖到它的结构里。", "Drag each character into the box for its structure.")}</p>
      <div className="grid grid-cols-2 gap-3">
        {ex.groups.map((g, k) => (
          <div key={g} ref={(el) => { zones.current[k] = el }} className={cn("flex min-h-24 flex-col gap-2 rounded-lg border-2 p-2", drag && drag.over === k ? "border-primary bg-primary/10" : "border-dashed")} data-testid="zh-sort-zone" data-group={k} data-over={drag && drag.over === k ? "1" : "0"}>
            <div className="text-sm font-medium">{g}</div>
            <div className="flex flex-wrap gap-2">{ex.items.filter((it) => ans[it.id] === k).map((it) => tile(it, String(k)))}</div>
          </div>
        ))}
      </div>
      {drag && drag.moved ? <div className="bg-background pointer-events-none fixed z-50 rounded-lg border px-4 py-2 text-2xl shadow-lg" style={{ left: drag.x - drag.ox, top: drag.y - drag.oy }} data-testid="zh-sort-ghost">{drag.text}</div> : null}
    </div>
  )
}
/** A 米字格: the square, its midlines and its diagonals, dotted and faint. */
function MiGrid({ size }) {
  const s = size, h = s / 2
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="absolute inset-0" aria-hidden="true">
      <rect x="0.5" y="0.5" width={s - 1} height={s - 1} fill="none" stroke="#c9c7e8" strokeWidth="1" />
      {[[0, h, s, h], [h, 0, h, s], [0, 0, s, s], [s, 0, 0, s]].map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d4d2ee" strokeWidth="1" strokeDasharray="3 4" />)}
    </svg>
  )
}
/** One character, written freely into a 米字格 and judged after 写好了: her strokes
 *  stay on top, the standard form appears beneath and animates once in order,
 *  each of her strokes is marked. No shadow before she writes — that is the
 *  owner's point: 描红 after, not before. Then a tap on the box swaps the two
 *  layers — the standard form in front at full strength, hers faint beneath —
 *  and a second tap swaps them back: two drawings on top of each other are
 *  compared by looking at each in turn (the owner's ask, 2 October). A
 *  mechanic, in docs/cats.md's terms: the comparison is the learning. */
function HanziBox({ ch, size = 140, onDone, label }) {
  const ref = useRef(null), cv = useRef(null), drawn = useRef([]), cur = useRef(null), writer = useRef(null)
  const [n, setN] = useState(0)
  const [res, setRes] = useState(null)
  const [gen, setGen] = useState(0)
  const [front, setFront] = useState("ink")   // after 写好了: "ink" (hers in front) or "ref" (the standard form)
  useLang()
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ""
    writer.current = drawReference(ref.current, ch, size)
    drawn.current = []; cur.current = null; setN(0); setRes(null); setFront("ink")
    const c = cv.current; if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height)
  }, [ch, size, gen])
  const k = () => cv.current.width / size
  const at = (e) => { const r = cv.current.getBoundingClientRect(); return [(e.clientX - r.left) * (size / r.width), (e.clientY - r.top) * (size / r.height)] }
  const down = (e) => { if (res) return; e.preventDefault(); try { cv.current.setPointerCapture(e.pointerId) } catch { /* no-op */ } const p = at(e); cur.current = [p]; const c = cv.current.getContext("2d"); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#2b2a55"; c.lineWidth = 4 * k(); c.beginPath(); c.moveTo(p[0] * k(), p[1] * k()); c.lineTo(p[0] * k() + 0.1, p[1] * k()); c.stroke() }
  const move = (e) => { if (!cur.current) return; const p = at(e), q = cur.current[cur.current.length - 1]; cur.current.push(p); const c = cv.current.getContext("2d"); c.beginPath(); c.moveTo(q[0] * k(), q[1] * k()); c.lineTo(p[0] * k(), p[1] * k()); c.stroke() }
  const up = () => { if (!cur.current) return; drawn.current.push(cur.current); cur.current = null; setN(drawn.current.length) }
  const finish = () => {
    const map = boxToChar(ref.current)
    const strokes = drawn.current.map((pts) => pts.map(([x, y]) => map ? map(x, y) : [x, y]))
    const j = judgeStrokes(ch, strokes) || { mistakes: 0, strokes: [], n: 0, missing: 0 }
    // the standard form, beneath hers, drawn once in order
    if (writer.current) { try { writer.current.hideCharacter({ duration: 0 }); writer.current.animateCharacter() } catch { /* already visible */ } }
    const r = { ch, mistakes: j.mistakes, n: j.n, missing: j.missing, strokes: strokes.map((pts, i) => ({ n: i, ok: !!(j.strokes[i] && j.strokes[i].ok), verdict: (j.strokes[i] || {}).verdict || "extra", pts: pts.map(([x, y]) => [Math.round(x), Math.round(y)]) })) }
    setRes(r); onDone && onDone(r)
  }
  const swap = () => { if (res) setFront((f) => (f === "ink" ? "ref" : "ink")) }
  const refFront = !!res && front === "ref"
  const nRef = (strokeData(ch) || { strokes: [] }).strokes.length
  const wrong = res ? res.strokes.filter((x) => !x.ok) : []
  const verdictText = res ? (res.mistakes === 0 ? t("一笔没错", "every stroke right")
    : [wrong.length ? t(`第 ${wrong.map((x) => x.n + 1).join("、")} 笔${wrong.every((x) => x.verdict === "backwards") ? "方向反了" : "不像"}`, `stroke ${wrong.map((x) => x.n + 1).join(", ")} ${wrong.every((x) => x.verdict === "backwards") ? "backwards" : "off"}`) : "",
       res.missing ? t(`少写了 ${res.missing} 笔`, `${res.missing} missing`) : "", res.strokes.length > res.n ? t(`多写了 ${res.strokes.length - res.n} 笔`, `${res.strokes.length - res.n} extra`) : ""].filter(Boolean).join(" · ")) : null
  return (
    <div className="flex flex-col items-center gap-1" data-testid="zh-hanzi" data-char={ch} data-done={res ? "1" : "0"} data-mistakes={res ? res.mistakes : 0} data-strokes={n} data-front={res ? front : undefined}>
      {label ? <span className="text-muted-foreground text-xs">{label}</span> : null}
      <div className={cn("relative rounded-lg bg-white", res && "cursor-pointer")} style={{ width: size, height: size }} onClick={swap} role={res ? "button" : undefined} aria-label={res ? t("点一下，换前后", "Tap to swap front and back") : undefined} data-testid="zh-hanzi-box">
        <MiGrid size={size} />
        <div ref={ref} className="absolute inset-0" style={{ opacity: res ? (refFront ? 1 : 0.45) : 0, zIndex: refFront ? 2 : 1, pointerEvents: "none" }} data-testid="zh-reference" />
        <canvas ref={cv} width={size * 4} height={size * 4} className="absolute inset-0" style={{ width: size, height: size, touchAction: "none", opacity: refFront ? 0.45 : 1, zIndex: refFront ? 1 : 2 }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} data-testid="zh-ink-box" />
      </div>
      <span className={cn("text-xs tabular-nums", res ? (res.mistakes ? "text-muted-foreground" : "text-success") : "text-muted-foreground")}>{res ? verdictText : t(`${n}/${nRef} 笔`, `${n}/${nRef} strokes`)}</span>
      {res ? <span className="text-muted-foreground text-center text-[11px] leading-tight" style={{ maxWidth: size }} data-testid="zh-hanzi-swap-hint">{refFront ? t("再点一下换回来", "Tap again: yours in front") : t("点一下看标准写法", "Tap: standard form in front")}</span> : null}
      <span className="flex gap-1">
        {!res ? <Button size="sm" variant={n ? "default" : "outline"} className="h-6 px-2 text-xs" disabled={!n} onClick={finish} data-testid="zh-hanzi-done">{t("写好了", "Done")}</Button> : null}
        {n || res ? <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setGen((g) => g + 1)} data-testid="zh-hanzi-redo">{t("重写", "Write again")}</Button> : null}
      </span>
    </div>
  )
}
function WriteWidget({ ex, ans, set1, done }) {
  return (
    <div className="flex flex-wrap gap-3">
      {ex.items.map((it) => (
        <div key={it.id} className="flex flex-col items-center gap-1 rounded-lg border p-3" data-testid="zh-write-item">
          {it.parts ? <span className="text-lg">{it.parts}</span> : null}
          {it.py ? <span className="text-sm"><span className="text-muted-foreground">{it.py}</span> {it.context}</span> : null}
          <HanziBox ch={it.key} onDone={(r) => set1(it.id, { done: true, mistakes: r.mistakes, strokes: r.strokes, n: (strokeData(it.key) || { strokes: [] }).strokes.length })} />
        </div>
      ))}
    </div>
  )
}
/** Free writing: kept as a PNG and as strokes, in her Drive, and judged by the
 *  review skill — there is no key to mark it against here. */
function FreeWidget({ ex, ans, set1, done, onSaved, set }) {
  const refs = useRef({})
  const notes = zhNotes(set)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    const out = {}
    for (const it of ex.items) {
      const r = refs.current[it.id]; if (!r) continue
      const { blob, strokes, width, height } = await r.export()
      const base = `zh-ink-${set}-${it.id.replace(/[^\w-]/g, "_")}-${Date.now()}`
      const png = await Store.uploadMedia(`${base}.png`, blob, "image/png")
      const sj = await Store.uploadMedia(`${base}.json`, new Blob([JSON.stringify({ item: it.id, width, height, strokes })], { type: "application/json" }), "application/json")
      out[it.id] = { png, strokes: sj, n: strokes.length, at: new Date().toISOString() }
    }
    setBusy(false); onSaved(out)
  }
  const any = ex.items.some((it) => (ans[it.id] || 0) > 0)
  return (
    <div className="flex flex-col gap-3">
      {ex.items.map((it) => (
        <div key={it.id} className="flex flex-col gap-2 rounded-lg border p-3" data-testid="zh-free-item">
          <p className="text-lg">{t(it.prompt, it.prompt_en)}</p>
          {done ? <p className="text-muted-foreground text-sm">{t("已交。", "Handed in.")}</p> : <Ink ref={(r) => { refs.current[it.id] = r }} height={200} onChange={(n) => set1(it.id, n)} />}
          <Note n={notes[it.id]} />
        </div>
      ))}
      {!done ? <div><Button size="sm" disabled={!any || busy} onClick={submit} data-testid="zh-free-submit"><Check /> {busy ? t("保存中…", "Saving…") : t("交卷", "Hand in")}</Button></div> : null}
    </div>
  )
}
/** The retell: recorded and transcribed like the reading, no passage to align
 *  to, and a parent's tap as the signature the book asks for. */
function SpeakWidget({ ex, set, exId }) {
  useStore()
  const st = (hwState(set).exercises || {})[exId] || {}
  const [mode, setMode] = useState("idle"), [finals, setFinals] = useState(""), [interim, setInterim] = useState("")
  const [parent, setParent] = useState(false)
  const [blobUrl, setBlobUrl] = useState(null)
  const live = useRef(null)
  const start = async () => {
    setFinals(""); setInterim(""); setParent(false); setBlobUrl(null)
    let rec = null; try { rec = canRecord() ? await startRecorder() : null } catch { rec = null }
    const asr = startRecognition((f, i) => { setFinals(f); setInterim(i) })
    live.current = { rec, asr, t0: Date.now() }; setMode("recording")
  }
  const stop = async () => {
    const l = live.current; if (!l) return
    setMode("saving"); l.asr.stop()
    const audio = l.rec ? await l.rec.stop() : { blob: null, ms: Date.now() - l.t0, mime: "" }
    if (audio.blob) { try { setBlobUrl(URL.createObjectURL(audio.blob)) } catch { /* no-op */ } }
    const fileId = audio.blob ? await Store.uploadMedia(`zh-tell-${set}-${Date.now()}.${/mp4/.test(audio.mime) ? "m4a" : "webm"}`, audio.blob, audio.mime) : null
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { ...((cur.exercises || {})[exId] || {}), told: { at: new Date().toISOString(), ms: audio.ms, transcript: finals + interim, fileId } } } }))
    setMode("idle")
  }
  const sign = () => Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { ...((cur.exercises || {})[exId] || {}), parent: { at: new Date().toISOString(), by: Store.name || "parent" } } } }))
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle data-testid="zh-tell-question">{tf(ex.question)}</CardTitle>
          <CardDescription>{t("先讲故事，再问爸爸妈妈这个问题。", "Tell the story first, then ask your parents this question.")}</CardDescription>
          <CardAction>
            {mode === "recording" ? <Button size="sm" variant="destructive" onClick={stop} data-testid="zh-tell-stop"><Square /> {t("停止", "Stop")}</Button>
              : mode === "saving" ? <Button size="sm" disabled>{t("保存中…", "Saving…")}</Button>
              : <Button size="sm" onClick={start} data-testid="zh-tell-start"><Mic /> {st.told ? t("再讲一次", "Tell it again") : t("开始讲", "Start telling")}</Button>}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {mode === "recording" ? <p className="text-muted-foreground text-sm" data-testid="zh-tell-recording">{t("正在录音…", "Recording…")}</p> : st.told ? <div className="flex flex-col gap-2"><p className="text-muted-foreground text-xs">{zhNotes(set).tell ? t(`已录好 · ${Math.round(st.told.ms / 1000)} 秒 · 已批改。`, `Recorded · ${Math.round(st.told.ms / 1000)} s · evaluated.`) : t(`已录好 · ${Math.round(st.told.ms / 1000)} 秒 · 交给批改。`, `Recorded · ${Math.round(st.told.ms / 1000)} s · handed in for evaluation.`)}{st.told.fileId ? "" : t(" 没有保存录音。", " No recording kept.")} <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setParent((v) => !v)} data-testid="zh-tell-parent">{parent ? t("收起", "Hide") : t("家长视图", "Parent view")}</Button></p><PlayAgain blobUrl={blobUrl} fileId={st.told.fileId} testid="zh-tell-play" /></div> : <p className="text-muted-foreground text-sm">{t("按开始，把故事讲一遍。", "Tap start and tell the story.")}</p>}
          {(parent || zhNotes(set).tell) && st.told ? <p className="text-lg leading-8" data-testid="zh-tell-transcript">{st.told.transcript || t("（什么也没听到）", "(nothing heard)")}</p> : null}
          <Note n={zhNotes(set).tell} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("家长签名", "Parent's signature")}</CardTitle>
          <CardDescription>{st.parent ? t(`${st.parent.by} 已听 · ${new Date(st.parent.at).toLocaleDateString("zh-CN")}`, `${st.parent.by} listened · ${new Date(st.parent.at).toLocaleDateString()}`) : t("听完故事、回答了问题以后，请家长点一下。", "After listening and answering the question, a parent taps here.")}</CardDescription>
          <CardAction><Button size="sm" variant={st.parent ? "outline" : "default"} disabled={!st.told} onClick={sign} data-testid="zh-tell-sign"><Check /> {t("家长已听", "Listened")}</Button></CardAction>
        </CardHeader>
      </Card>
    </div>
  )
}
/** The workbook's own 读一读: read aloud, transcribed, aligned to the strips — the
 *  reading page's mechanism on an exercise, never scored, the unheard dotted. */
function ReadWidget({ ex, set, exId }) {
  useStore()
  const st = (hwState(set).exercises || {})[exId] || {}
  const [mode, setMode] = useState("idle"), [finals, setFinals] = useState(""), [interim, setInterim] = useState("")
  const [res, setRes] = useState(null)
  const [parent, setParent] = useState(false)
  const live = useRef(null)
  const start = async () => {
    setRes(null); setFinals(""); setInterim(""); setParent(false)
    let rec = null; try { rec = canRecord() ? await startRecorder() : null } catch { rec = null }
    const asr = startRecognition((f, i) => { setFinals(f); setInterim(i) })
    live.current = { rec, asr, t0: Date.now() }; setMode("recording")
  }
  const stop = async () => {
    const l = live.current; if (!l) return
    setMode("saving"); l.asr.stop()
    const audio = l.rec ? await l.rec.stop() : { blob: null, ms: Date.now() - l.t0, mime: "" }
    const transcript = finals + interim, align = alignChars(ex.text, transcript)
    const fileId = audio.blob ? await Store.uploadMedia(`zh-read-${set}-${exId.replace(/[^\w-]/g, "_")}-${Date.now()}.${/mp4/.test(audio.mime) ? "m4a" : "webm"}`, audio.blob, audio.mime) : null
    const r = { at: new Date().toISOString(), ms: audio.ms, transcript, matched: align.matched, total: align.total, heard: align.heard, fileId }
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { ...((cur.exercises || {})[exId] || {}), read: r } } }))
    recordAttempts([{ id: exId, ok: true, ms: audio.ms, pick: String(align.matched) }], "exercise")
    let blobUrl = null; if (audio.blob) { try { blobUrl = URL.createObjectURL(audio.blob) } catch { /* no-op */ } }
    setRes({ ...r, blobUrl }); setMode("idle")
  }
  const lines = ex.text.split("\n")
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>{t("朗读", "Read it aloud")}</CardTitle>
          <CardDescription>{st.read && !res ? t(`上次读了 ${Math.round(st.read.ms / 1000)} 秒`, `last read in ${Math.round(st.read.ms / 1000)} s`) : t("不打分。", "Not scored.")}</CardDescription>
          <CardAction>
            {mode === "recording" ? <Button size="sm" variant="destructive" onClick={stop} data-testid="zh-rd-stop"><Square /> {t("停止", "Stop")}</Button>
              : mode === "saving" ? <Button size="sm" disabled>{t("保存中…", "Saving…")}</Button>
              : <Button size="sm" onClick={start} data-testid="zh-rd-start"><Mic /> {st.read || res ? t("再读一次", "Read again") : t("开始朗读", "Start reading")}</Button>}
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-xl leading-9 tracking-wide" data-testid="zh-rd-text">{lines.map((l, i) => <p key={i}>{l}</p>)}</div>
          {mode === "recording" ? <p className="text-muted-foreground mt-2 text-sm" data-testid="zh-rd-recording">{t("正在录音…", "Recording…")}</p> : null}
          {res || st.read ? <div className="mt-2 flex flex-col gap-2" data-testid="zh-rd-done"><p className="text-muted-foreground text-xs">{zhNotes(set)[exId] ? t("已批改。", "Evaluated.") : t("已录好，交给批改。", "Recorded, handed in for evaluation.")} <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setParent((v) => !v)} data-testid="zh-rd-parent">{parent ? t("收起", "Hide") : t("家长视图", "Parent view")}</Button></p><PlayAgain blobUrl={res ? res.blobUrl : null} fileId={(res || st.read).fileId} testid="zh-rd-play" /></div> : null}
          {zhNotes(set)[exId] && (res || st.read) ? <div className="mt-3 flex flex-col gap-2"><Compared passage={ex.text} transcript={(res || st.read).transcript} /><Note n={zhNotes(set)[exId]} /></div> : null}
          {parent && (res || st.read) && !zhNotes(set)[exId] ? <div className="mt-2" data-testid="zh-rd-parentview"><Compared passage={ex.text} transcript={(res || st.read).transcript} /></div> : null}
        </CardContent>
      </Card>
    </div>
  )
}
const WIDGET = { tf: TfWidget, order: OrderWidget, slots: SlotsWidget, match: MatchWidget, sort: SortWidget, write: WriteWidget, free: FreeWidget }
const itemLabel = (ex, it) => it.text || it.left || it.slot || it.key || (it.pieces ? it.pieces.join(" / ") : it.id)
export function Exercise({ set, exId }) {
  useStore(); useLang()
  const note = D.zh.homework[set]
  const ex = note ? zhExercises(note.lesson).find((e) => e.id === exId) : null
  const [ans, setAns] = useState({})
  const prevRec = ex ? (hwState(set).exercises || {})[exId] : null
  const [done, setDone] = useState(ex && ex.type === "free" && prevRec && prevRec.submitted ? { submitted: true } : null)
  if (!ex) return <ChineseHome />
  const items = exItems(ex)
  const set1 = (id, v) => setAns((a) => ({ ...a, [id]: v }))
  const complete = items.every((it) => answered(ex, it, ans[it.id]))
  const prev = (hwState(set).exercises || {})[exId]
  const submit = () => {
    const marks = items.map((it) => ({ id: it.id, ok: isRight(ex, it, ans[it.id]), pick: ans[it.id] }))
    const right = marks.filter((m) => m.ok).length
    // Strokes are kept with the answer for a written character; the record's
    // pick is the count, not the path — a learning record is small by design.
    const kept = ex.type === "write" ? Object.fromEntries(items.map((it) => [it.id, ans[it.id] ? { mistakes: ans[it.id].mistakes, n: ans[it.id].n, strokes: ans[it.id].strokes } : null])) : ans
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { at: new Date().toISOString(), right, n: items.length, answers: kept } } }))
    recordAttempts(marks.map((m) => ({ id: m.id, ok: m.ok, ms: 0, pick: ex.type === "write" ? String((m.pick || {}).mistakes ?? "") : JSON.stringify(m.pick === undefined ? null : m.pick) })), "exercise")
    setDone({ right, marks })
  }
  const onFreeSaved = (out) => {
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), [exId]: { at: new Date().toISOString(), submitted: true, items: out } } }))
    recordAttempts(ex.items.map((it) => ({ id: it.id, ok: true, ms: 0, pick: String((out[it.id] || {}).n || 0) })), "exercise")
    setDone({ submitted: true })
  }
  const Widget = WIDGET[ex.type]
  if (ex.type === "speak" || ex.type === "read") return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-ex">
      <Card><CardHeader><CardTitle>{t(ex.title, ex.title_en)}</CardTitle><CardDescription>{zhDay(ex.day)} · p.{ex.page} · {t(`练习 ${ex.ex}`, `exercise ${ex.ex}`)}</CardDescription></CardHeader>{ex.note ? <CardContent className="text-muted-foreground text-sm">{tf(ex.note)}</CardContent> : null}</Card>
      {ex.type === "speak" ? <SpeakWidget ex={ex} set={set} exId={exId} /> : <ReadWidget ex={ex} set={set} exId={exId} />}
    </div>
  )
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-ex">
      <Card>
        <CardHeader>
          <CardTitle>{t(ex.title, ex.title_en)}</CardTitle>
          <CardDescription>{zhDay(ex.day)} · p.{ex.page} · {t(`练习 ${ex.ex}`, `exercise ${ex.ex}`)}{prev && prev.n != null ? ` · ${t("上次", "last")} ${prev.right}/${prev.n}` : ""}</CardDescription>
          <CardAction>{done ? <Button size="sm" variant="outline" onClick={() => { setAns({}); setDone(null) }}><RotateCcw /> {t("再做一次", "Again")}</Button> : ex.type === "free" ? null : <Button size="sm" disabled={!complete} onClick={submit} data-testid="zh-ex-submit"><Check /> {t("交卷", "Check")}</Button>}</CardAction>
        </CardHeader>
        {ex.note ? <CardContent className="text-muted-foreground text-sm">{tf(ex.note)}</CardContent> : null}
      </Card>
      <div className="flex flex-col gap-2">{Widget ? <Widget ex={ex} ans={ans} set1={set1} done={done} onSaved={onFreeSaved} set={set} /> : null}</div>
      {done && done.submitted ? (
        <Card data-testid="zh-ex-result"><CardHeader><CardTitle>{t("已交，等批改", "Handed in — awaiting review")}</CardTitle><CardDescription>{t("写的内容已保存在她的 Drive 里（图片和笔画）。批改会出现在这里。", "What she wrote is kept in her Drive, as an image and as strokes. The review will appear here.")}</CardDescription><CardAction><Button size="sm" variant="outline" onClick={() => go("/chinese")}>{t("回到本周", "Back to the week")}</Button></CardAction></CardHeader></Card>
      ) : done ? (
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
                  <div className="font-medium">{itemLabel(ex, it)}{ex.type === "write" && done.marks.find((m) => m.id === it.id) ? ` · ${t(`错了 ${(ans[it.id] || {}).mistakes} 笔`, `${(ans[it.id] || {}).mistakes} wrong strokes`)}` : ""}</div>
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
/** A weekday's four-choice block through the shared runner, under its own set id
 *  (zh-block:L05-D2:0). The earlier 7/6 chunked sittings are not shown any more;
 *  any result recorded under their ids stays in the record untouched. */
/* Each of these three calls useLang() for its own sake, not the Runner's: the
 * title and the exit label are made HERE, and t() reads the language at the
 * moment it runs. The Runner subscribes to the toggle and re-renders itself,
 * but a prop computed by a parent that did not subscribe keeps the language
 * it was first rendered in — the chrome flipped and the title did not. */
function ZhBlockRun({ set, id }) {
  useLang()
  const note = D.zh.homework[set]
  const block = zhBlock(note, id)
  const items = block ? block.items.map((i) => (findItem(i) || {}).it).filter(Boolean) : []
  if (!block || !items.length) return <ChineseHome />
  const sid = blockSetId(block)
  return <Runner key={sid} items={items} setId={sid} prior={Store.s.results[sid] || null} sub="zh-word" title={`${t(block.title, block.title_en)} · ${zhDay(block.day)}`} exitPath="/chinese" exitLabel={t("回到本周", "Back to the week")} />
}
function ZhRun({ sub, lesson, n }) {
  useLang()
  const set = zhSets(sub, lesson)[n]
  const l = D.zh.lessons[lesson]
  if (!set || !l) return <ChineseHome />
  const id = setId(sub, lesson, n)
  return <Runner key={id} items={set} setId={id} prior={Store.s.results[id] || null} sub={sub} title={`${zhSubName(sub)} · ${t(l.title, l.title_en)} · ${t(`第 ${n + 1} 组`, `Set ${n + 1}`)}`} exitPath="/chinese" exitLabel={t("回到本周", "Back to the week")} />
}
function ZhReview() {
  useLang()
  const items = useMemo(() => reviewQueue(null, "chinese").due.map((x) => x.it), [])
  if (!items.length) return <ChineseHome />
  return <Runner items={items} custom ctx="review" resume="review:zh" sub="zh-word" title={t("中文 · 复习", "Chinese · Review")} exitPath="/chinese" exitLabel={t("回到本周", "Back to the week")} />
}

/** The Chinese half's own route switch; `rest` is the route with `chinese` taken off. */
export function ChineseScreen({ rest }) {
  const [top, a, b, c] = rest
  if (top === "l" && a) return <Lesson key={a} id={a} />
  if (top === "run" && ZH[a] && b) return <ZhRun key={`${a}:${b}:${c}`} sub={a} lesson={b} n={+c || 0} />
  // /dictation/<lesson>, /read/<lesson>, /ex/<exercise id>, /block/<block id> —
  // and each still answers to the older form that carried the note's date.
  const n = noteFor(a)
  if (top === "dictation" && n) return <Dictation key={n.set} set={n.set} />
  if (top === "read" && n) return <ReadAloud key={n.set} set={n.set} />
  if (top === "ex" && n && (b || a)) return <Exercise key={n.set + (b || a)} set={n.set} exId={b || a} />
  if (top === "block" && n && (b || a)) return <ZhBlockRun key={n.set + (b || a)} set={n.set} id={b || a} />
  if (top === "review") return <ZhReview />
  return <ChineseHome />
}
/** Breadcrumbs for the Chinese half, every one a real link. */
export function zhCrumbs(rest) {
  const [top, a, b, c] = rest
  const out = [{ label: t("中文", "Chinese"), path: "/chinese" }]
  const l = (id) => (D.zh && D.zh.lessons[id]) || null
  if (top === "l" && l(a)) out.push({ label: zhLessonLabel(l(a)), path: `/chinese/l/${a}` })
  else if (top === "run" && ZH[a] && l(b)) { out.push({ label: zhLessonLabel(l(b)), path: `/chinese/l/${b}` }); out.push({ label: `${zhSubName(a)} · ${t(`第 ${(+c || 0) + 1} 组`, `Set ${(+c || 0) + 1}`)}`, path: `/chinese/run/${a}/${b}/${c || 0}` }) }
  else if (top === "dictation" && a) out.push({ label: t("听写", "Dictation"), path: `/chinese/dictation/${a}` })
  else if (top === "read" && a) out.push({ label: t("阅读", "Reading"), path: `/chinese/read/${a}` })
  else if (top === "ex" && a) { const id = b || a, n = noteFor(a), e = n && zhExercises(n.lesson).find((x) => x.id === id); out.push({ label: e ? t(e.title, e.title_en) : t("练习", "Exercise"), path: `/chinese/ex/${id}` }) }
  else if (top === "block" && a) { const id = b || a, n = noteFor(a), bl = n && zhBlock(n, id); out.push({ label: bl ? `${t(bl.title, bl.title_en)} · ${zhDay(bl.day)}` : t("练习", "Exercise"), path: `/chinese/block/${id}` }) }
  else if (top === "review") out.push({ label: t("复习", "Review"), path: "/chinese/review" })
  return out
}
