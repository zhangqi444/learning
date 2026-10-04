import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { BookOpen, Check, CheckCircle2, Eraser, Eye, ListChecks, Mic, PenLine, Play, RotateCcw, Square, Trophy, Volume2, X } from "lucide-react"
import { D, ZH, exItems, setId, zhBlock, zhDay, zhExercises, zhHomework, zhLessonLabel, zhLessonOf, zhLessons, zhSets, zhSubName, zhWorkbook } from "@/lib/content"
import { findItem, recordAttempts, reviewQueue } from "@/lib/engine"
import { t, tf, useLang } from "@/lib/lang"
import { go } from "@/lib/router"
import { speak, canSpeak } from "@/lib/speech"
import { alignChars, canRecognize, canRecord, markPassage, startRecognition, startRecorder } from "@/lib/reading"
import { boxToChar, drawReference, hasStrokes, judgeStrokes, strokeData, writtenWell } from "@/lib/strokes"
import { Store, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { atLeast } from "@/lib/world"
import { sfx } from "@/lib/sfx"
import { charStatus, isGlimChar, lessonChars, recordWrite, writtenCount } from "@/lib/zi"
import { Glim, hearProps } from "@/components/glim"
import { Badge } from "@zhangqi444/ui/ui/badge"
import { Button } from "@zhangqi444/ui/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@zhangqi444/ui/ui/card"
import { Progress } from "@zhangqi444/ui/ui/progress"
import { Row } from "@/pages/checklist"
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
  const lesson = zhLessonOf(key)
  return zhHomework().find((n) => n.lesson === lesson) || syntheticNote(lesson)   // zhHomework() is newest first
}
/** A lesson nobody has assigned this week still has a reading, a workbook and
 *  words to write from hearing, all in the book. For such a lesson the note is
 *  synthesised from the lesson and its exercises file — its `set` is the lesson
 *  id, so her record lands under hw:L03 and a review may target set "L03" —
 *  and nothing about it is invented: the pages and the words are the book's. */
function syntheticNote(lesson) {
  const l = D.zh.lessons[lesson]; if (!l) return null
  const ex = D.zh.exercises[lesson] || {}, rows = [...(ex.blocks || []), ...(ex.exercises || [])]
  const pg = rows.map((r) => r.page).filter(Number.isFinite), lo = Math.min(...pg), hi = Math.max(...pg)
  const r = l["阅读"] || {}, words = ((l["词语"] || {}).items || []).map((w) => w.w)
  const tasks = []
  if (r.title) tasks.push({ kind: "read_aloud", what: `阅读《${r.title}》`, what_en: `Reading: ${r.title_en || r.title}`, pages: tf(r.where) || "", pages_en: (r.where || {}).en || "" })
  if (rows.length) tasks.push({ kind: "workbook", what: `练习册A 第${l.no}课`, what_en: `Workbook A, Lesson ${l.no}`, pages: `练习册A 第${lo}–${hi}页`, pages_en: `Workbook A, pp. ${lo}–${hi}`, on_paper: [] })
  if (words.length) tasks.push({ kind: "dictation", what: `第${l.no}课的词语`, what_en: `Lesson ${l.no}'s words`, words: { "词语": words }, sections_en: { "词语": "Words" }, pages: `课本第${l.pages["生字·词语·句子"] || ""}页`, pages_en: `Textbook p. ${l.pages["生字·词语·句子"] || ""}` })
  return { set: lesson, lesson, synthetic: true, tasks }
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
const blockSetId = (b) => setId("zh-block", b.id.replace(/^zb:/, ""), 0)
/** The lesson the Chinese half is on: the newest note's, else the last lesson in the bundle. */
export function currentZhLesson() { const n = zhHomework()[0]; return (n && D.zh.lessons[n.lesson]) || zhLessons().slice(-1)[0] || null }
const rowLabels = () => ({ done: t("已完成", "Done"), notDone: t("未完成", "Not done"), auto: t("自动", "auto") })
const reviewLabels = () => ({ title: t("批改", "What a reader noticed"), readFrom: t("来源：", "Read from"), words: t("字", "words"), fresh: t("新", "New"), worked: t("做得好", "What worked"), tryThis: t("试试这样", "Try this"), next: t("下周：", "For next week:"), checklist: t("清单上", "On the checklist"), open: t("打开", "Open"), locale: t("zh-CN", undefined), stale: (d) => t(`这份批改看的是 ${d} 的那一稿；之后作业又改过。`, `This review is of the draft from ${d}; the work here has changed since.`) })
const ReviewCards = ({ set }) => reviewsFor({ kind: "zh", set }).map((r) => <ReviewCard key={r.id} r={r} labels={reviewLabels()} />)

/** Everything the week expects — the note's reading, its workbook in the book's
 *  order, its dictation — as checklist rows whose done state is read from her
 *  work. One source for the dashboard's 今天 card, the 清单 page, the 练习册 page
 *  and 继续, so the four agree the way the ISEE half's do (checklist.jsx). */
export function zhWeekItems(note) {
  if (!note) return []
  const lesson = D.zh.lessons[note.lesson], st = hwState(note.set), notes = zhNotes(note.set), items = []
  for (const task of note.tasks) {
    if (task.kind === "read_aloud") {
      const r = st.read || {}, att = r.attempts || [], last = att[att.length - 1]
      items.push({ id: "read", kind: "read", group: t("阅读", "Reading"), label: `${readTitle(lesson, task)} · ${readWhere(task)}`, short: t("朗读", "Read aloud"), path: `/chinese/read/${note.lesson}`, done: !!r.done, auto: true,
        sub: last ? t(`上次 ${Math.round(last.ms / 1000)} 秒 · 共 ${att.length} 次${notes.read ? " · 已批改" : ""}`, `last ${Math.round(last.ms / 1000)} s · ${att.length} reading${att.length === 1 ? "" : "s"}${notes.read ? " · evaluated" : ""}`) : t("对着课本读，录下来", "Read it from the book; it is recorded") })
    } else if (task.kind === "workbook") {
      const exSt = st.exercises || {}
      for (const row of zhWorkbook(note.lesson)) {
        const isBlock = row.kind === "block", r = isBlock ? Store.s.results[blockSetId(row)] : exSt[row.id]
        const reviewed = !isBlock && row.type === "free" && (row.items || []).some((it) => notes[it.id])
        const done = isBlock ? !!r : !!(r && (r.n != null || r.submitted || r.told || r.read))
        const state = isBlock ? (r ? `${r.right}/${r.n}` : t(`${row.items.length} 题`, `${row.items.length} questions`))
          : r && r.n != null ? `${r.right}/${r.n}` : reviewed ? t("已批改", "reviewed") : r && r.submitted ? t("待批改", "awaiting review")
          : r && (r.told || r.parent) ? (r.parent ? t("家长已听", "parent listened") : t("已录", "recorded")) : r && r.read ? t("已读", "read") : ""
        items.push({ id: row.id, kind: "workbook", isBlock, type: row.type, day: row.day, group: zhDay(row.day), label: t(row.title, row.title_en), short: t(row.title, row.title_en),
          path: isBlock ? `/chinese/block/${row.id}` : `/chinese/ex/${row.id}`, done, auto: true, state, right: r && r.n != null ? r.right : null, n: r && r.n != null ? r.n : null,
          sub: `${t(`练习 ${row.ex}`, `ex. ${row.ex}`)} · p.${row.page}${state ? ` · ${state}` : ""}` })
      }
    } else if (task.kind === "dictation") {
      const d = st.dictation || {}, words = Object.values(task.words || {}).flat(), rated = words.filter((w) => d[w]).length, right = words.filter((w) => d[w] && d[w].ok).length
      items.push({ id: "dictation", kind: "dictation", group: t("听写", "Dictation"), label: `${t("听写", "Dictation")} · ${t(task.what, task.what_en)}`, short: t("听写", "Dictation"), path: `/chinese/dictation/${note.lesson}`, done: words.length > 0 && rated === words.length, auto: true,
        pct: words.length ? rated / words.length : 0, rated, right, total: words.length, sub: t(`已评 ${rated} / ${words.length} · 对 ${right}`, `${rated} of ${words.length} rated · ${right} right`) })
    }
  }
  return items
}
/** What 继续 opens: a due review first, then the first thing left in the week's
 *  order — the workbook in the book's order, the dictation, the reading. */
export function zhNextUp(note) {
  const q = reviewQueue(null, "chinese")
  if (q.due.length) return { label: t(`复习 · ${q.due.length} 题`, `Review · ${q.due.length} due`), path: "/chinese/review", kind: "review" }
  const order = (it) => (it.kind === "workbook" ? 0 : it.kind === "dictation" ? 1 : 2)
  return zhWeekItems(note).filter((it) => !it.done).sort((a, b) => order(a) - order(b))[0] || null
}
/** The lessons in the bundle, as tabs over a subject page — shown once there is more than one. */
function LessonTabs({ lesson, path }) {
  const ls = zhLessons(); if (ls.length < 2) return null
  return (
    <div className="flex flex-wrap gap-1.5" data-testid="zh-lesson-tabs">
      {ls.map((l) => <Button key={l.id} size="sm" variant={l.id === lesson ? "secondary" : "ghost"} onClick={() => go(path(l.id))} data-testid="zh-lesson-tab" data-lesson={l.id} aria-current={l.id === lesson ? "page" : undefined}>{t(`第${l.no}课`, `Lesson ${l.no}`)}</Button>)}
    </div>
  )
}
const JOB_ICON = { read: Mic, dictation: Volume2, review: RotateCcw }
function SubjectRows({ lesson, items }) {
  const can = writtenCount(lesson.id)
  const wb = items.filter((i) => i.kind === "workbook"), wbDone = wb.filter((i) => i.done).length, nextWb = wb.find((i) => !i.done)
  const d = items.find((i) => i.kind === "dictation"), r = items.find((i) => i.kind === "read")
  const rows = [
    { id: "book", icon: BookOpen, name: t("课本", "Textbook"), path: `/chinese/l/${lesson.id}`, pct: can.total ? can.written / can.total : 0, sub: t(`能默写 ${can.written} / ${can.total}`, `${can.written} of ${can.total} from memory`), done: can.total > 0 && can.written === can.total, action: t("写", "Write"), to: `/chinese/l/${lesson.id}` },
    { id: "workbook", icon: PenLine, name: t("练习册", "Workbook"), path: `/chinese/workbook/${lesson.id}`, pct: wb.length ? wbDone / wb.length : 0, sub: t(`${wbDone} / ${wb.length} 项`, `${wbDone} of ${wb.length}`), done: wb.length > 0 && wbDone === wb.length, action: t("开始", "Start"), to: nextWb ? nextWb.path : `/chinese/workbook/${lesson.id}` },
    d ? { id: "dictation", icon: Volume2, name: t("听写", "Dictation"), path: d.path, pct: d.pct, sub: d.sub, done: d.done, action: t("练习", "Practise"), to: d.path } : null,
    r ? { id: "read", icon: Mic, name: t("阅读", "Reading"), path: r.path, pct: r.done ? 1 : 0, sub: r.sub, done: false, action: t("朗读", "Read aloud"), to: r.path } : null,
  ].filter(Boolean)
  return (
    <ul className="divide-y">
      {rows.map((x) => (
        <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5" data-testid="zh-subject-row" data-id={x.id} data-done={x.done ? "1" : "0"}>
          <x.icon className="text-muted-foreground size-3.5 shrink-0" />
          <button type="button" className="w-full text-left text-sm font-medium hover:underline @md/main:w-28 @md/main:shrink-0" onClick={() => go(x.path)}>{x.name}</button>
          <span className="flex w-full items-center gap-3 @md/main:w-auto @md/main:min-w-32 @md/main:flex-1"><Progress value={x.pct * 100} className="h-1.5 flex-1" /><span className="text-muted-foreground shrink-0 text-xs tabular-nums">{x.sub}</span></span>
          {x.done ? <Button size="sm" variant="ghost" disabled><CheckCircle2 /> {t("完成", "Done")}</Button> : <Button size="sm" variant="outline" onClick={() => go(x.to)}>{x.action}</Button>}
        </li>
      ))}
    </ul>
  )
}

/** The Chinese dashboard, the shape of the ISEE one: 今天 with what is next and
 *  继续, the lesson's cats, the four subjects, and the week's reviews. */
export function ChineseHome() {
  useStore(); useLang()
  const lesson = currentZhLesson()
  const note = lesson ? noteFor(lesson.id) : null
  const q = reviewQueue(null, "chinese")
  if (!lesson || !note) return <div className="text-muted-foreground p-6">{t("还没有中文课文。", "No Chinese lesson is in the bundle yet.")}</div>
  const chars = lessonChars(lesson.id), can = writtenCount(lesson.id)
  const items = zhWeekItems(note), left = items.filter((i) => !i.done), next = zhNextUp(note)
  const jobs = left.filter((i) => !next || i.path !== next.path).slice(0, 5)
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-home">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-4" data-testid="zh-today">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Play className="size-4" /> {t("今天", "Today")}</CardDescription>
          <CardTitle className="text-xl">{next ? next.label : t("这周的作业都做完了", "Everything this week is done")}</CardTitle>
          <CardDescription>{note.synthetic ? t(`第${lesson.no}课 · 自己练`, `Lesson ${lesson.no} · practice`) : t(`${note.set} 布置的作业`, `Homework set on ${note.set}`)} · {left.length ? t(`还剩 ${left.length} / ${items.length} 项`, `${left.length} of ${items.length} left`) : t("本周已清", "this week is clear")}</CardDescription>
          <CardAction>{next ? <Button onClick={() => go(next.path)} data-testid="zh-continue"><Play /> {t("继续", "Continue")}</Button> : null}</CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={items.length ? ((items.length - left.length) / items.length) * 100 : 0} className="h-1.5" />
          {jobs.length ? (
            <ul className="divide-y rounded-md border" data-testid="zh-today-jobs">
              {jobs.map((j) => { const Icon = JOB_ICON[j.kind] || (j.type === "write" || j.type === "free" ? PenLine : j.type === "speak" || j.type === "read" ? Mic : ListChecks); return (
                <li key={j.id} className="flex items-center gap-3 px-3 py-2">
                  <Icon className="text-muted-foreground size-4 shrink-0" />
                  <button type="button" className="min-w-0 flex-1 text-left text-sm font-medium hover:underline" onClick={() => go(j.path)}>{j.group} · {j.short}</button>
                  <span className="text-muted-foreground hidden shrink-0 text-xs @md/main:block">{j.sub}</span>
                </li>) })}
            </ul>
          ) : <div className="text-success flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium"><CheckCircle2 className="size-4" /> {t("今天没有欠着的了。", "Nothing hanging over today.")}</div>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t(`第${lesson.no}课`, `Lesson ${lesson.no}`)} · {t(lesson.title, lesson.title_en)}</CardTitle>
          <CardDescription>{t(`${D.zh.manifest.volume} · ${D.zh.manifest.edition}`, `${D.zh.manifest.volume_en} · ${D.zh.manifest.edition_en}`)}</CardDescription>
          <CardAction><Button size="sm" variant="outline" onClick={() => go(`/chinese/l/${lesson.id}`)}><BookOpen /> {t("生字词语", "The lesson")}</Button></CardAction>
        </CardHeader>
        {/* Her real state, and nothing she cannot act on. This line used to say
            "10 生字 · 7 词语 · 没有待复习的题" — two facts of the book and a sentence
            about an absence — and the owner asked why it was there (2 October).
            Now: the lesson's cats at the brightness her own writing has given
            them (docs/chinese.md § 10), how many she can write from memory by the
            judge's rule, and a way into 复习 exactly when something is due — red,
            which on this site means due now, and never a sentence saying nothing is. */}
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1" data-testid="zh-home-cats">
            {chars.map((ch) => { const st = charStatus(ch); return (
              <figure key={ch} className="flex w-11 flex-col items-center" data-testid="zh-home-cat" data-char={ch} data-stage={st.stage}>
                <button {...hearProps(ch, { aria: t(`听 ${ch}`, `Hear ${ch}`) })}><Glim word={ch} stage={st.stage} className="size-10" title={ch} /></button>
                <figcaption className={cn("text-xs leading-none", st.stage === "Unseen" ? "text-muted-foreground" : "font-semibold")}>{ch}</figcaption>
              </figure>
            ) })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="tabular-nums" data-testid="zh-can-write">{t(`能默写 ${can.written} / ${can.total} 个生字`, `${can.written} of ${can.total} characters written from memory`)}</span>
            {q.due.length ? <Button size="sm" variant="outline" onClick={() => go("/chinese/review")} data-testid="zh-review-due"><RotateCcw /> {t("复习", "Review")} <Badge variant="destructive" className="rounded-full tabular-nums">{q.due.length}</Badge></Button> : null}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-2 py-4" data-testid="zh-subjects">
        <CardHeader className="px-4">
          <CardTitle className="text-base">{t("科目", "Subjects")}</CardTitle>
          <CardDescription>{t("这一课的四样：课本、练习册、听写、阅读。", "The four parts of a lesson: the textbook, the workbook, dictation and reading.")}</CardDescription>
        </CardHeader>
        <CardContent className="px-0"><SubjectRows lesson={lesson} items={items} /></CardContent>
      </Card>
      <ReviewCards set={note.set} />
    </div>
  )
}

/** The workbook as its own page: the lesson's exercises in the book's order, a
 *  card per weekday, each row the checklist's row — the owner asked why the
 *  workbook did not look like the checklist. */
export function WorkbookPage({ lesson: lessonId }) {
  useStore(); useLang()
  const lesson = D.zh.lessons[lessonId], note = noteFor(lessonId)
  if (!lesson || !note) return <ChineseHome />
  const items = zhWeekItems(note).filter((i) => i.kind === "workbook"), done = items.filter((i) => i.done).length
  const task = note.tasks.find((x) => x.kind === "workbook") || {}
  const days = []
  for (const it of items) { const d = days[days.length - 1]; if (d && d.day === it.day) d.items.push(it); else days.push({ day: it.day, items: [it] }) }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-workbook">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><PenLine className="size-4" /> {t("练习册", "Workbook")}</CardDescription>
          <CardTitle className="text-xl">{t(task.what, task.what_en)}</CardTitle>
          <CardDescription>{t(task.pages, task.pages_en)} · {t(`${done} / ${items.length} 项`, `${done} of ${items.length} done`)}</CardDescription>
          <CardAction><Badge variant={done === items.length ? "success" : "outline"} className="tabular-nums">{done}/{items.length}</Badge></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3"><Progress value={items.length ? (done / items.length) * 100 : 0} className="h-1.5" /><LessonTabs lesson={lessonId} path={(id) => `/chinese/workbook/${id}`} /></CardContent>
      </Card>
      {days.map((d) => { const dDone = d.items.filter((i) => i.done).length; return (
        <Card key={d.day} className="gap-2 py-4" data-testid="zh-day-card" data-day={d.day}>
          <CardHeader className="px-5"><CardTitle className="text-base" data-testid="zh-day">{zhDay(d.day)}</CardTitle><CardAction><Badge variant={dDone === d.items.length ? "success" : "outline"} className="tabular-nums">{dDone}/{d.items.length}</Badge></CardAction></CardHeader>
          <CardContent className="px-2"><ul className="divide-y">{d.items.map((it) => <Row key={it.id} item={it} testId={it.isBlock ? "zh-sitting" : "zh-exercise"} labels={rowLabels()} attrs={{ "data-id": it.id }} />)}</ul></CardContent>
        </Card>) })}
      {task.on_paper && task.on_paper.length ? <details className="text-sm">
        <summary className="text-muted-foreground cursor-pointer">{t(`纸上作业 — ${task.on_paper.length} 项`, `On paper — ${task.on_paper.length} exercises the book sets by hand`)}</summary>
        <ul className="mt-2 flex flex-col gap-1 pl-1">{task.on_paper.map((e, i) => <li key={i} className="text-muted-foreground">{zhDay(e.day)} · p.{e.page} · {e.ex} · {t(e.what, e.what_en)}</li>)}</ul>
      </details> : null}
    </div>
  )
}

/** 清单: the week's homework as the checklist the ISEE half has — every row ticks
 *  itself from her work; nothing here is ticked by hand. */
export function ZhChecklist() {
  useStore(); useLang()
  const lesson = currentZhLesson(), note = lesson ? noteFor(lesson.id) : null
  if (!lesson || !note) return <ChineseHome />
  const items = zhWeekItems(note), left = items.filter((i) => !i.done).length
  const groups = []
  for (const it of items) { let g = groups.find((x) => x.name === it.group); if (!g) { g = { name: it.group, items: [] }; groups.push(g) } g.items.push(it) }
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-checklist">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><ListChecks className="size-4" /> {t("清单", "Checklist")}</CardDescription>
          <CardTitle className="text-xl">{note.synthetic ? t(`第${lesson.no}课 · 自己练`, `Lesson ${lesson.no} · practice`) : t(`${note.set} 老师布置的`, `What the teacher set on ${note.set}`)}</CardTitle>
          <CardDescription>{left ? t(`还剩 ${left} / ${items.length} 项；做完会自动打勾。`, `${left} of ${items.length} left; each ticks itself when done.`) : t("都做完了。", "All done.")}</CardDescription>
        </CardHeader>
      </Card>
      {groups.map((g) => (
        <Card key={g.name} className="gap-2 py-4" data-testid="zh-ck-group">
          <CardHeader className="px-5"><CardTitle className="text-base">{g.name}</CardTitle></CardHeader>
          <CardContent className="px-2"><ul className="divide-y">{g.items.map((it) => <Row key={it.id} item={it} testId="zh-ck-item" labels={rowLabels()} attrs={{ "data-id": it.id }} />)}</ul></CardContent>
        </Card>
      ))}
      <ReviewCards set={note.set} />
    </div>
  )
}

function Stat({ label, value, sub, testid }) {
  return (
    <Card className="gap-2 py-5" data-testid={testid}>
      <CardHeader className="px-5"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>{sub ? <CardDescription>{sub}</CardDescription> : null}</CardHeader>
    </Card>
  )
}
/** 成绩: the numbers her work has produced, each its own — never folded into one,
 *  and never into the ISEE readiness number (docs/chinese.md § 3). */
export function ZhScore() {
  useStore(); useLang()
  const lesson = currentZhLesson(), note = lesson ? noteFor(lesson.id) : null
  if (!lesson || !note) return <ChineseHome />
  const items = zhWeekItems(note), can = writtenCount(lesson.id)
  const wb = items.filter((i) => i.kind === "workbook"), wbDone = wb.filter((i) => i.done).length, marked = wb.filter((i) => i.n != null)
  const right = marked.reduce((a, i) => a + i.right, 0), n = marked.reduce((a, i) => a + i.n, 0)
  const d = items.find((i) => i.kind === "dictation"), r = items.find((i) => i.kind === "read")
  const att = ((hwState(note.set).read || {}).attempts || []), evaluated = !!zhNotes(note.set).read
  const q = reviewQueue(null, "chinese"), learned = Object.keys(Store.s.items || {}).filter((k) => /^zc?:/.test(k)).length
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4" data-testid="zh-score">
      <Card className="from-primary/5 to-card bg-gradient-to-t gap-3">
        <CardHeader>
          <CardDescription className="flex items-center gap-2"><Trophy className="size-4" /> {t("成绩", "Score")}</CardDescription>
          <CardTitle className="text-xl">{t(`第${lesson.no}课 · ${lesson.title}`, `Lesson ${lesson.no} · ${lesson.title_en}`)}</CardTitle>
          <CardDescription>{t("几个数各算各的，不合成一个总分；中文作业不进 ISEE 的准备度。", "Each number stands on its own; nothing is folded into one score, and none of it touches the ISEE readiness number.")}</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 gap-4 @2xl/main:grid-cols-2">
        <Stat testid="zh-score-write" label={t("能默写的生字", "Characters from memory")} value={`${can.written} / ${can.total}`} sub={t("按笔顺判定；两天各写对一次才算记住。", "Judged stroke by stroke; written right on two different days counts as remembered.")} />
        <Stat testid="zh-score-workbook" label={t("练习册", "Workbook")} value={`${wbDone} / ${wb.length}`} sub={marked.length ? t(`按规则判的 ${marked.length} 项里，${right} / ${n} 题对。`, `Of the ${marked.length} marked by rule, ${right} of ${n} right.`) : t("还没有按规则判的项。", "Nothing marked by rule yet.")} />
        {d ? <Stat testid="zh-score-dictation" label={t("听写", "Dictation")} value={`${d.right} / ${d.total}`} sub={t(`已评 ${d.rated} 个词。`, `${d.rated} words rated.`)} /> : null}
        {r ? <Stat testid="zh-score-read" label={t("阅读", "Reading")} value={String(att.length)} sub={att.length ? (evaluated ? t("读过，已批改。", "Read, and evaluated.") : t("读过，等批改。", "Read, awaiting evaluation.")) : t("还没读。", "Not read yet.")} /> : null}
        <Stat testid="zh-score-review" label={t("复习", "Review")} value={String(q.due.length)} sub={t(`今天该复习的题 · 一共记过 ${learned} 题。`, `due today · ${learned} questions in the record.`)} />
      </div>
      <ReviewCards set={note.set} />
    </div>
  )
}

/* ---------- the lesson's own pages ---------- */
/** The book's section headings, said in English when the page is. */
const SECTION_EN = { "读一读": "Read aloud", "用一用": "Use it" }
/* The lesson page is where she meets the lesson's cats (docs/chinese.md § 10.3):
 * each 生字 tile carries its cat at the brightness her own writing has earned —
 * a shadow and two eyes until she has written it from memory — and a 写 opens a
 * 米字格 under the grid with the pinyin and the meaning as the cue, the
 * character itself hidden on its tile while the box is open, because written
 * from memory is the whole point and the character is otherwise right there.
 * This is the precision review's job in the Chinese half: optional practice
 * outside the teacher's homework, as the Wordwood is outside the plan. */
export function Lesson({ id }) {
  useStore(); useLang()
  const l = D.zh.lessons[id]
  const [writing, setWriting] = useState(null)   // { ch, done }: the character open under the grid, and whether its box has been judged
  const [blink, setBlink] = useState({})         // a seed per character; bumped once when the judge first accepts it this sitting
  if (!l) return <ChineseHome />
  const onWritten = (ch, r) => {
    const ok = recordWrite(ch, r)
    setWriting({ ch, done: true })
    // The slow blink is the cat coming to know her, on the one event that means
    // it — the judge accepting the character — and never on a render or a tap.
    if (ok) setBlink((b) => ({ ...b, [ch]: (b[ch] || 0) + 1 }))
  }
  const cue = writing ? l["生字"].items.find((z) => z.zi === writing.ch) : null
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
        <CardHeader><CardTitle>{t("生字", "New characters")}</CardTitle><CardDescription>{tf(l["生字"].where)} · {t("会写的字会来找你——点「写」，默写一个试试。", "A character you can write comes to you — tap Write and write one from memory.")}</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {l["生字"].items.map((z) => {
              const st = charStatus(z.zi), here = !!(writing && writing.ch === z.zi), hidden = here && !writing.done
              return (
                <div key={z.zi} className={cn("flex flex-col items-center gap-0.5 rounded-xl border p-3", here && "border-primary")} data-testid="zh-char">
                  <span data-testid="zh-zi" data-char={z.zi} data-stage={st.stage}>
                    <button {...hearProps(z.zi, { aria: t(`听 ${z.zi}`, `Hear ${z.zi}`) })}>
                      <Glim word={z.zi} stage={st.stage} className="size-12" title={z.zi} blink={blink[z.zi] || 0} />
                    </button>
                  </span>
                  <span className="text-muted-foreground text-xs">{z.py}</span>
                  <span className={cn("text-3xl leading-none", hidden && "select-none blur-sm")} aria-hidden={hidden || undefined} data-testid="zh-zi-char">{hidden ? "〇" : z.zi}</span>
                  <span className="text-muted-foreground text-xs">{tf(z.gloss)}</span>
                  <span className="flex items-center gap-0.5">
                    <Speak text={z.zi} />
                    <Button size="sm" variant={here ? "secondary" : "ghost"} className="h-7 px-1.5 text-xs" onClick={() => setWriting({ ch: z.zi, done: false })} data-testid="zh-zi-write"><PenLine className="size-4" /> {t("写", "Write")}</Button>
                  </span>
                </div>
              )
            })}
          </div>
          {writing && cue ? (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border p-3" data-testid="zh-zi-panel" data-char={writing.ch}>
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm" data-testid="zh-zi-cue"><span className="font-medium">{cue.py}</span> · {tf(cue.gloss)}</span>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => setWriting(null)} data-testid="zh-zi-close">{t("收起", "Close")}</Button>
              </div>
              <p className="text-muted-foreground text-xs">{t("看着拼音和意思，把字写出来。", "From the pinyin and the meaning, write the character.")}</p>
              <HanziBox key={writing.ch} ch={writing.ch} size={160} cat={false} onDone={(r) => onWritten(writing.ch, r)} onReset={() => setWriting({ ch: writing.ch, done: false })} />
            </div>
          ) : null}
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
  const note = noteFor(set)
  const task = note && note.tasks.find((x) => x.kind === "dictation")
  const [shown, setShown] = useState({})
  const [writing, setWriting] = useState(null)      // the word being written with the Pencil
  const [judged, setJudged] = useState(null)        // the word whose boxes have all been judged and are still open to look at
  const boxes = useRef({})
  if (!task) return <ChineseHome />
  const st = hwState(set).dictation || {}
  const writable = (w) => [...w].every((ch) => !/[\p{Script=Han}]/u.test(ch) || hasStrokes(ch))
  const startWrite = (w) => { boxes.current = {}; setWriting(w); setJudged(null); speak(w) }
  const close = () => { setWriting(null); setJudged(null) }
  const boxDone = (w, ch, i, r) => {
    boxes.current[i] = r
    const chars = [...w].filter((c) => /\p{Script=Han}/u.test(c))
    if (Object.keys(boxes.current).length < chars.length) return
    const mistakes = Object.values(boxes.current).reduce((n, x) => n + x.mistakes, 0)
    const nStrokes = chars.reduce((n, c) => n + ((strokeData(c) || { strokes: [] }).strokes.length), 0)
    Store.setSlice("zh", hwKey(set), (cur) => ({ ...cur, dictation: { ...(cur.dictation || {}), [w]: { ok: writtenWell(mistakes, nStrokes), at: new Date().toISOString(), mode: "pencil", mistakes, strokes: Object.values(boxes.current).map((x) => ({ ch: x.ch, strokes: x.strokes })) } } }))
    // The boxes stay open once the last one is judged, until she closes them.
    // They used to vanish the instant the verdict landed, which hid the last
    // character's verdict, the layer swap, and now the cat that came.
    setJudged(w)
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
                  <div className="flex items-center gap-2"><Speak text={w} /><span className="text-muted-foreground text-sm">{judged === w && r && r.mode === "pencil" ? (r.mistakes ? t(`错 ${r.mistakes} 笔`, `${r.mistakes} wrong strokes`) : t("一笔没错", "every stroke right")) : t(`听一听，写 ${[...w].filter((c) => /\p{Script=Han}/u.test(c)).length} 个字`, `Listen, then write ${[...w].filter((c) => /\p{Script=Han}/u.test(c)).length} characters`)}</span><Button size="sm" variant="ghost" className="ml-auto h-7" onClick={close} data-testid={judged === w ? "zh-dict-close" : undefined}>{judged === w ? t("收起", "Close") : t("取消", "Cancel")}</Button></div>
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
  const note = noteFor(set)
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
/* And the cat (docs/chinese.md § 10.3). A 生字 — a character the lesson is
 * teaching her to write, and no other — is a Glim whose name is the character,
 * and writing it from memory is calling it by hand. So when the judge accepts
 * the character, its cat answers: it arrives beside the verdict and calls in
 * its own voice. Not accepted: the standard form appears beneath her strokes
 * and the verdict line names the strokes, and nothing else happens — no cat
 * and no sound, not even the runner's soft note, because nobody came and the
 * standard form appearing is already the whole of the acknowledgement. `cat`
 * false is for the lesson page, whose cat is on the tile and brightens there
 * instead of arriving twice; the call still comes from here, so a character
 * answers in one place only. */
function HanziBox({ ch, size = 140, onDone, onReset, label, cat = true }) {
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
    const came = isGlimChar(ch) && writtenWell(j.mistakes, j.n)
    if (came) sfx("call", ch)
    setRes({ ...r, came }); onDone && onDone(r)
  }
  const swap = () => { if (res) setFront((f) => (f === "ink" ? "ref" : "ink")) }
  const refFront = !!res && front === "ref"
  const nRef = (strokeData(ch) || { strokes: [] }).strokes.length
  const wrong = res ? res.strokes.filter((x) => !x.ok) : []
  const verdictText = res ? (res.mistakes === 0 ? t("一笔没错", "every stroke right")
    : [wrong.length ? t(`第 ${wrong.map((x) => x.n + 1).join("、")} 笔${wrong.every((x) => x.verdict === "backwards") ? "方向反了" : "不像"}`, `stroke ${wrong.map((x) => x.n + 1).join(", ")} ${wrong.every((x) => x.verdict === "backwards") ? "backwards" : "off"}`) : "",
       res.missing ? t(`少写了 ${res.missing} 笔`, `${res.missing} missing`) : "", res.strokes.length > res.n ? t(`多写了 ${res.strokes.length - res.n} 笔`, `${res.strokes.length - res.n} extra`) : ""].filter(Boolean).join(" · ")) : null
  return (
    <div className="flex flex-col items-center gap-1" data-testid="zh-hanzi" data-char={ch} data-done={res ? "1" : "0"} data-mistakes={res ? res.mistakes : 0} data-strokes={n} data-front={res ? front : undefined} data-came={res ? (res.came ? "1" : "0") : undefined}>
      {label ? <span className="text-muted-foreground text-xs">{label}</span> : null}
      <div className={cn("relative rounded-lg bg-white", res && "cursor-pointer")} style={{ width: size, height: size }} onClick={swap} role={res ? "button" : undefined} aria-label={res ? t("点一下，换前后", "Tap to swap front and back") : undefined} data-testid="zh-hanzi-box">
        <MiGrid size={size} />
        <div ref={ref} className="absolute inset-0" style={{ opacity: res ? (refFront ? 1 : 0.45) : 0, zIndex: refFront ? 2 : 1, pointerEvents: "none" }} data-testid="zh-reference" />
        <canvas ref={cv} width={size * 4} height={size * 4} className="absolute inset-0" style={{ width: size, height: size, touchAction: "none", opacity: refFront ? 0.45 : 1, zIndex: refFront ? 1 : 2 }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} data-testid="zh-ink-box" />
      </div>
      <span className={cn("flex items-center gap-1.5 text-xs tabular-nums", res ? (res.mistakes ? "text-muted-foreground" : "text-success") : "text-muted-foreground")}>
        {/* the cat that came, walking in from its own side; drawn no dimmer
            than Steady, because a cat she has just called right is never faint */}
        {res && res.came && cat ? <Glim word={ch} stage={atLeast(charStatus(ch).stage)} className="size-10" title={ch} arrive /> : null}
        <span>{res ? verdictText : t(`${n}/${nRef} 笔`, `${n}/${nRef} strokes`)}</span>
      </span>
      {res ? <span className="text-muted-foreground text-center text-[11px] leading-tight" style={{ maxWidth: size }} data-testid="zh-hanzi-swap-hint">{refFront ? t("再点一下换回来", "Tap again: yours in front") : t("点一下看标准写法", "Tap: standard form in front")}</span> : null}
      <span className="flex gap-1">
        {!res ? <Button size="sm" variant={n ? "default" : "outline"} className="h-6 px-2 text-xs" disabled={!n} onClick={finish} data-testid="zh-hanzi-done">{t("写好了", "Done")}</Button> : null}
        {n || res ? <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => { setGen((g) => g + 1); onReset && onReset() }} data-testid="zh-hanzi-redo">{t("重写", "Write again")}</Button> : null}
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
/** Grid paper. Free writing goes into 米字格 cells, one character each — the way
 *  the workbook's own lines are ruled — rather than onto a blank canvas: a word
 *  is a run of two cells, a sentence a strip of them that wraps. Each cell keeps
 *  its strokes as point sequences (for the review skill, and for a stroke-order
 *  question later), and the item hands in one picture of the whole grid, as
 *  before. The owner's ask, 2 October: "why not several rows for each word? and
 *  why not 米 grid". A mechanic: the cells are how Chinese is written. */
const GridInk = React.forwardRef(function GridInk({ blanks = 1, cells = 16, size = 56, onChange }, ref) {
  useLang()
  const cv = useRef([]), strokes = useRef({}), cur = useRef(null)
  const [n, setN] = useState(0)
  const total = blanks * cells, k = 4
  const at = (e, c) => { const r = c.getBoundingClientRect(); return [+((e.clientX - r.left) * (size / r.width)).toFixed(1), +((e.clientY - r.top) * (size / r.height)).toFixed(1), +(e.pressure || 0.5).toFixed(2), Date.now()] }
  const pen = (g) => { g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#1f1b3a"; g.lineWidth = 3 * k }
  const count = () => Object.values(strokes.current).reduce((a, ss) => a + ss.length, 0)
  const down = (i) => (e) => {
    e.preventDefault(); const c = cv.current[i]; try { c.setPointerCapture(e.pointerId) } catch { /* no-op */ }
    const p = at(e, c); cur.current = { i, pts: [p] }
    const g = c.getContext("2d"); pen(g); g.beginPath(); g.moveTo(p[0] * k, p[1] * k); g.lineTo(p[0] * k + 0.1, p[1] * k); g.stroke()
  }
  const move = (e) => { const d = cur.current; if (!d) return; const c = cv.current[d.i]; const p = at(e, c), q = d.pts[d.pts.length - 1]; d.pts.push(p); const g = c.getContext("2d"); g.beginPath(); g.moveTo(q[0] * k, q[1] * k); g.lineTo(p[0] * k, p[1] * k); g.stroke() }
  const up = () => { const d = cur.current; if (!d) return; cur.current = null; (strokes.current[d.i] = strokes.current[d.i] || []).push(d.pts); const m = count(); setN(m); onChange && onChange(m) }
  const clear = () => { strokes.current = {}; for (const c of cv.current) if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height); setN(0); onChange && onChange(0) }
  React.useImperativeHandle(ref, () => ({
    count, clear,
    export: async () => {
      // one picture of the grid, the cells in rows of ten at most, plus every cell's strokes
      const perRow = Math.min(total, 10), rows = Math.ceil(total / perRow), gap = 6
      const W = perRow * size + (perRow - 1) * gap, H = rows * size + (rows - 1) * gap
      const out = document.createElement("canvas"); out.width = W * 2; out.height = H * 2
      const g = out.getContext("2d"); g.scale(2, 2); g.fillStyle = "#fff"; g.fillRect(0, 0, W, H)
      for (let i = 0; i < total; i++) {
        const x = (i % perRow) * (size + gap), y = Math.floor(i / perRow) * (size + gap)
        g.strokeStyle = "#c9c7e8"; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
        const c = cv.current[i]; if (c) g.drawImage(c, x, y, size, size)
      }
      const blob = await new Promise((r) => out.toBlob(r, "image/png"))
      const all = []; for (const [i, ss] of Object.entries(strokes.current)) for (const pts of ss) all.push({ blank: Math.floor(+i / cells), cell: +i % cells, pts })
      return { blob, strokes: all, width: W, height: H, cells: total }
    },
  }))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-x-4 gap-y-2" data-testid="zh-grid" data-strokes={n}>
        {Array.from({ length: blanks }, (_, b) => (
          <div key={b} className="flex flex-wrap gap-1" data-testid="zh-blank">
            {Array.from({ length: cells }, (_, c) => { const i = b * cells + c; return (
              <div key={c} className="relative rounded-md bg-white" style={{ width: size, height: size }}>
                <MiGrid size={size} />
                <canvas ref={(el) => { cv.current[i] = el }} width={size * k} height={size * k} className="absolute inset-0" style={{ width: size, height: size, touchAction: "none" }} onPointerDown={down(i)} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} data-testid="zh-cell" />
              </div>) })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs tabular-nums">{t(`${n} 笔`, `${n} strokes`)}</span><Button size="sm" variant="ghost" onClick={clear} data-testid="zh-ink-clear"><Eraser /> {t("清除", "Clear")}</Button></div>
    </div>
  )
})
/** Free writing: on grid paper, kept as a PNG and as strokes in her Drive, and
 *  judged by the review skill — there is no key to mark it against here. An
 *  item with a `key` writes that character first, in a judged 米字格 box, and
 *  then the word beside it. */
function FreeWidget({ ex, ans, set1, done, onSaved, set }) {
  const refs = useRef({}), judged = useRef({})
  const notes = zhNotes(set)
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    const out = {}
    for (const it of ex.items) {
      const r = refs.current[it.id]; if (!r) continue
      const { blob, strokes, width, height, cells } = await r.export()
      const base = `zh-ink-${set}-${it.id.replace(/[^\w-]/g, "_")}-${Date.now()}`
      const png = await Store.uploadMedia(`${base}.png`, blob, "image/png")
      const sj = await Store.uploadMedia(`${base}.json`, new Blob([JSON.stringify({ item: it.id, width, height, cells, blanks: it.blanks || 1, strokes })], { type: "application/json" }), "application/json")
      out[it.id] = { png, strokes: sj, n: strokes.length, at: new Date().toISOString(), ...(judged.current[it.id] ? { judged: judged.current[it.id] } : {}) }
    }
    setBusy(false); onSaved(out)
  }
  const any = ex.items.some((it) => (ans[it.id] || 0) > 0)
  return (
    <div className="flex flex-col gap-3">
      {ex.items.map((it) => (
        <div key={it.id} className="flex flex-col gap-2 rounded-lg border p-3" data-testid="zh-free-item">
          <p className="text-lg">{t(it.prompt, it.prompt_en)}</p>
          {done ? <p className="text-muted-foreground text-sm">{t("已交。", "Handed in.")}</p> : (
            <div className="flex flex-wrap items-start gap-4">
              {/* the judged box is evidence the character was written (lib/zi.js), so it carries its moment */}
              {it.key ? <HanziBox ch={it.key} size={112} onDone={(r) => { judged.current[it.id] = { mistakes: r.mistakes, n: r.n, missing: r.missing, at: new Date().toISOString() } }} /> : null}
              <GridInk ref={(r) => { refs.current[it.id] = r }} blanks={it.blanks || 1} cells={it.cells || 16} onChange={(n) => set1(it.id, n)} />
            </div>
          )}
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
  const note = noteFor(set)
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
  const note = noteFor(set)
  const block = zhBlock(note.lesson, id)
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
  if (top === "checklist") return <ZhChecklist />
  if (top === "score") return <ZhScore />
  if (top === "workbook" && n) return <WorkbookPage key={n.lesson} lesson={n.lesson} />
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
  else if (top === "block" && a) { const id = b || a, n = noteFor(a), bl = n && zhBlock(n.lesson, id); out.push({ label: bl ? `${t(bl.title, bl.title_en)} · ${zhDay(bl.day)}` : t("练习", "Exercise"), path: `/chinese/block/${id}` }) }
  else if (top === "review") out.push({ label: t("复习", "Review"), path: "/chinese/review" })
  else if (top === "checklist") out.push({ label: t("清单", "Checklist"), path: "/chinese/checklist" })
  else if (top === "score") out.push({ label: t("成绩", "Score"), path: "/chinese/score" })
  else if (top === "workbook" && a) out.push({ label: t("练习册", "Workbook"), path: `/chinese/workbook/${a}` })
  return out
}
