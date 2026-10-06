/* Question-bank helpers. `D` is the bundle (window.__LEARNING__ or content/bundle.json). */
import { Store, ts } from "./store"
import { t, tf } from "./lang"

export const SUBJ = {
  vr: { name: "Verbal Reasoning", short: "Verbal", blurb: "Vocabulary and sentence completion", color: "var(--chart-1)" },
  qr: { name: "Quantitative Reasoning", short: "Quantitative", blurb: "Reasoning with numbers, no calculator", color: "var(--chart-2)" },
  ma: { name: "Mathematics", short: "Math", blurb: "Arithmetic, geometry, data", color: "var(--chart-3)" },
  rc: { name: "Reading Comprehension", short: "Reading", blurb: "Passages and comprehension", color: "var(--chart-4)" },
}
export const ORDER = ["vr", "qr", "ma", "rc"]
/* The Chinese half (docs/chinese.md § 3–4). Two subjects, keyed by bank, and never
 * in ORDER: readiness() walks ORDER, and a subject there is a subject inside the
 * ISEE number. The spine is the lesson, L05, not the plan week, so nothing here
 * asks currentWeek() or spans() a question. */
export const ZH = {
  "zh-char": { name: "汉字", name_en: "Characters", short: "汉字", blurb: "Characters — pinyin, strokes, radicals", color: "var(--chart-2)" },
  "zh-word": { name: "词语", name_en: "Words", short: "词语", blurb: "The lesson's words in a sentence with one gap", color: "var(--chart-1)" },
  "zh-ex": { name: "练习", name_en: "Exercises", short: "练习", blurb: "The workbook's own exercises, marked by rule", color: "var(--chart-3)" },
}
export const ZH_ORDER = ["zh-char", "zh-word"]
export const isZh = (sub) => typeof sub === "string" && sub.startsWith("zh-")
export function subName(sub) { return (SUBJ[sub] || ZH[sub] || {}).name || sub }
/* The Chinese half's chrome in the page's language (lib/lang.js): a subject's
 * name, a weekday heading, a skill's name. The content keeps the book's own
 * Chinese — 星期一, the skill id — and these say it in whichever language the
 * header's toggle has chosen. A skill with no entry in content/chinese/skills.json
 * would print its id, which is why the validator refuses one. */
export const zhSubName = (sub) => (ZH[sub] ? t(ZH[sub].name, ZH[sub].name_en) : sub)
export const ZH_DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
export const zhDay = (day) => { const i = ZH_DAYS.indexOf(day); return i < 0 ? day : t(day, ZH_DAYS_EN[i]) }
export const zhSkillName = (sk) => tf((((D || {}).zh || {}).skills || {})[sk]) || sk
/** "第5课 小马过河" on the Chinese page, "Lesson 5 · A Pony Crosses the River" on the English one. */
export const zhLessonLabel = (l) => t(`第${l.no}课 ${l.title}`, `Lesson ${l.no} · ${l.title_en}`)
export function zhItems(sub, lesson) { return (((D.zh || {}).banks || {})[sub] || []).filter((i) => i.l === lesson) }
export function zhSets(sub, lesson) { return chunk(zhItems(sub, lesson)) }
export function zhLessons() { return Object.values((D.zh || {}).lessons || {}).sort((a, b) => a.no - b.no) }
/** The workbook's closed exercises for a lesson, and their markable items flattened:
 *  a match exercise is one item per left-hand part plus its fills; the rest are
 *  their items. Ids carry the zx: prefix beside z: and zc:. */
export function zhExercises(lesson) { return ((((D.zh || {}).exercises || {})[lesson]) || {}).exercises || [] }
/** The workbook, in the book's order: a lesson's four-choice blocks (one per
 *  weekday, the book's own division — no chunk()) and its exercises, both from
 *  content/chinese/exercises/<lesson>.json, merged and sorted by day, then
 *  exercise number, then the part: the writing half of an exercise before its
 *  sort, a matching before its words. The blocks used to live in the homework
 *  note, which tied a lesson's workbook to the week it was assigned; a lesson
 *  she practises without a note (第三课, 第四课) has a workbook all the same. */
export const ZH_DAYS = ["星期一", "星期二", "星期三", "星期四", "星期五"]
const partRank = (id) => (/w$/.test(id) ? 1 : /s$/.test(id) ? 2 : 0)
export function zhBlocks(lesson) { return ((((D.zh || {}).exercises || {})[lesson]) || {}).blocks || [] }
export function zhWorkbook(lesson) {
  const rows = [...zhBlocks(lesson).map((b) => ({ ...b, kind: "block" })), ...zhExercises(lesson).map((e) => ({ ...e, kind: "exercise" }))]
  return rows.sort((a, b) => (ZH_DAYS.indexOf(a.day) - ZH_DAYS.indexOf(b.day)) || (a.ex - b.ex) || (partRank(a.id) - partRank(b.id)))
}
export function zhBlock(lesson, id) { return zhBlocks(lesson).find((b) => b.id === id) || null }
/** The lesson an exercise or block id belongs to (zx:L05-D1-01 → L05); a lesson id is its own. */
export const zhLessonOf = (key) => { const m = /^z[xb]:(L\d+)/.exec(key || ""); return m ? m[1] : key }
export function exItems(ex) { return [...(ex.items || []), ...((ex.fills || {}).items || [])] }
export function zhHomework() { return Object.values((D.zh || {}).homework || {}).sort((a, b) => (a.set < b.set ? 1 : -1)) }
export const SETSIZE = 12
export const LTR = ["A", "B", "C", "D"]

export let D = null
export function setBundle(b) { D = b }

export const keyOf = (q) => q.k || q.correct

export function itemsFor(sub, wk) { return D.subjects[sub].filter((i) => i.w === wk) }
/** Split a week's items into near-equal sets of at most SETSIZE (37 -> 10/9/9/9,
 *  never 12/12/12/1). build_seed.py mirrors this so migrated results line up. */
export function chunk(all) {
  const k = Math.ceil(all.length / SETSIZE)
  if (!k) return []
  const base = Math.floor(all.length / k), extra = all.length % k
  const out = []
  for (let i = 0, at = 0; i < k; i++) { const n = base + (i < extra ? 1 : 0); out.push(all.slice(at, at + n)); at += n }
  return out
}
/** A week's sittings: its planned questions first, then each layer added to it later in
 *  sittings of its own — `x` 1, the owner's doubling of 5 October 2026; `x` 2, the questions
 *  that ask every list word three ways (6 October). Adding to a week she has started never
 *  moves a question between the sittings she has done. */
export function setsFor(sub, wk) {
  const all = itemsFor(sub, wk)
  const layers = [...new Set(all.map((i) => i.x || 0))].sort((a, b) => a - b)
  return layers.flatMap((x) => chunk(all.filter((i) => (i.x || 0) === x)))
}
/** When a set's questions arrived, if they all arrived after the week was first
 *  finished — otherwise null, because then there is nothing to explain.
 *
 *  Reading was one set of twelve a week until the 15th of September. It doubled
 *  that day and again on the 19th, and weeks she had already finished grew a
 *  second set: the card went from 2/2 to 1/2, the new set said "Not started",
 *  and nothing said why. That is indistinguishable from the site losing her
 *  work, which is exactly what it got reported as — twice.
 *
 *  Only a set that is entirely new counts. A set with one new question in it is
 *  a set she has largely met, and calling that "added" would be the opposite
 *  mistake. And it is measured against the day she finished something else in
 *  the same week, so a set added before she ever started says nothing: it was
 *  there when she arrived. */
export function setAddedAfter(sub, wk, n) {
  const since = (D && D.since) || null
  if (!since) return null
  const set = setsFor(sub, wk)[n]
  if (!set || !set.length) return null
  let newest = null
  for (const it of set) {
    const day = since[it.id]
    if (!day) return null                       // one question of unknown age is enough to say nothing
    if (!newest || day > newest) newest = day
  }
  let doneBefore = null
  setsFor(sub, wk).forEach((_, i) => {
    if (i === n) return
    const r = Store.s.results[setId(sub, wk, i)]
    const at = r && r.at ? String(r.at).slice(0, 10) : null
    if (at && at < newest && (!doneBefore || at > doneBefore)) doneBefore = at
  })
  return doneBefore ? { added: newest, after: doneBefore } : null
}


export function setId(sub, wk, n) { return `${sub}:${wk}:${n}` }
export function parseSetId(id) { const [sub, wk, n] = id.split(":"); return { sub, wk, n: +n } }
export function weekLabel(w) { const hit = D.weeks.find((x) => x.w === w); return hit ? hit.label : w }
export function currentWeek() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  let best = "W1"
  for (const w of D.weeks) if (new Date(D.starts[w.w] + "T00:00:00") <= today) best = w.w
  return best
}

/* ---------- date helpers for the plan's own spans ----------
 * Local, never UTC. `toISOString()` is UTC, and west of Greenwich that is
 * already tomorrow from late afternoon — the mistake this repo has now found
 * four separate times. Same arithmetic as engine's dayKey, kept here so this
 * module stays free of the engine that imports it. */
const pad2 = (n) => String(n).padStart(2, "0")
const localDay = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
function addDays(s, n) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return localDay(d) }
const shortDay = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 }
/** "Oct 26 – Nov 1" (with the plan's year) -> ISO start date. */
export function parseLabelStart(label, year = 2026) {
  const m = String(label || "").match(/^([A-Z][a-z]{2})\s+(\d{1,2})/)
  if (!m) return null
  const mo = MONTHS[m[1]]
  if (mo == null) return null
  return `${mo === 0 ? year + 1 : year}-${pad2(mo + 1)}-${pad2(+m[2])}`
}

/* ---------- what week it is ----------
 *
 *  The plan is not eight consecutive weeks. Between W3 and W4, and three more
 *  times after that, it names a week of its own: "Sep 21 – 27 · Split baseline
 *  mock", "Oct 26 – Nov 1 · Correction and retest". They are in the content, in
 *  `D.breaks`, and the calendar has always drawn them.
 *
 *  The checklist had no idea they existed. It asked `currentWeek()`, which
 *  answers "the last plan week that has BEGUN" — the right answer for gating
 *  content, and the wrong one for a page whose whole job is to say what to do
 *  today. So from the 21st to the 27th of September it opened on W3, a week that
 *  ended on the 20th, and put a "This week" badge on it. Seven days a time, four
 *  times over the plan, the page told her she was somewhere she was not, and the
 *  one week it was hiding was the week she sits the baseline mock in.
 *
 *  So the sequence the checklist walks is every span the plan actually has, in
 *  date order, whatever kind it is. A break with no dates in it, or one that
 *  overlaps a plan week, is skipped rather than guessed at. */
export function spans() {
  /* `heading` is the only thing any page may put in front of a reader. The id is
     "W3" for a plan week and "B:2026-09-21" for a between-week, and the second
     of those is a key, not a name — it reached the dashboard once, in the line
     that is supposed to say where she is. */
  const out = D.weeks.map((w) => ({ id: w.w, kind: "week", a: D.starts[w.w], b: addDays(D.starts[w.w], 6), title: `${w.w} · ${weekLabel(w.w)}`, heading: `${w.w} · ${weekLabel(w.w)}`, name: w.w }))
  for (const brk of D.breaks || []) {
    const a = parseLabelStart(brk.label)
    if (!a || out.some((s) => a >= s.a && a <= s.b)) continue
    const b = addDays(a, 6)
    out.push({ id: "B:" + a, kind: "break", a, b, title: brk.what, heading: `${brk.what} · ${shortDay(a)} – ${shortDay(b)}`, name: brk.what })
  }
  return out.sort((x, y) => x.a.localeCompare(y.a))
}
/** The span today is actually inside, or null on a day the plan does not cover
 *  at all (before it starts, or after the last week ends). */
export function spanNow(today = localDay()) { return spans().find((s) => today >= s.a && today <= s.b) || null }
/** The span the checklist should open on: where she is, or failing that the last
 *  thing that has begun — never nothing. */
export function spanOpen() {
  const now = spanNow()
  if (now) return now
  const all = spans(), today = localDay()
  const begun = all.filter((s) => s.a <= today)
  return begun.length ? begun[begun.length - 1] : all[0]
}
export function spanById(id) { return spans().find((s) => s.id === id) || null }

export function subjProgress(sub) {
  let done = 0, total = 0, right = 0, answered = 0
  for (const w of D.weeks) {
    setsFor(sub, w.w).forEach((_, n) => {
      total++
      const r = Store.s.results[setId(sub, w.w, n)]
      if (r) { done++; right += r.right; answered += r.n }
    })
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, acc: answered ? Math.round((right / answered) * 100) : null, right, answered }
}
export function overall() {
  let done = 0, total = 0, right = 0, answered = 0
  for (const s of ORDER) { const p = subjProgress(s); done += p.done; total += p.total; right += p.right; answered += p.answered }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, acc: answered ? Math.round((right / answered) * 100) : null, right, answered }
}
/** First set not yet completed in this subject, current week first. */
export function nextSet(sub) {
  const cur = currentWeek()
  const order = [...D.weeks].sort((a, b) => (a.w === cur ? -1 : b.w === cur ? 1 : 0))
  for (const w of order) {
    const sets = setsFor(sub, w.w)
    for (let n = 0; n < sets.length; n++) if (!Store.s.results[setId(sub, w.w, n)]) return { wk: w.w, n }
  }
  return null
}
export function allWrong() {
  const seen = {}, out = []
  for (const k of Object.keys(Store.s.results)) {
    const sub = k.split(":")[0]
    for (const id of Store.s.results[k].wrong || []) {
      if (seen[id] || !D.subjects[sub]) continue
      seen[id] = 1
      const it = D.subjects[sub].find((x) => x.id === id)
      if (it) out.push({ sub, it })
    }
  }
  return out
}
export function recentSets(limit = 8) {
  return Object.keys(Store.s.results)
    .map((k) => { const p = parseSetId(k); return { id: k, sub: p.sub, wk: p.wk, set: p.n, ...Store.s.results[k] } })
    .sort((a, b) => ts(b.at) - ts(a.at))
    .slice(0, limit)
}
/** Accuracy per subject per week, for the dashboard chart. */
export function accuracyByWeek() {
  return D.weeks.map((w) => {
    const row = { week: w.w, label: w.label }
    for (const s of ORDER) {
      let right = 0, n = 0
      setsFor(s, w.w).forEach((_, i) => { const r = Store.s.results[setId(s, w.w, i)]; if (r) { right += r.right; n += r.n } })
      row[s] = n ? Math.round((right / n) * 100) : null
    }
    return row
  })
}
/** `locale` is for the Chinese pages, which pass zh-CN in Chinese mode; left
 *  out, the device's own locale decides, as every ISEE page has always had it. */
export function fmtDate(iso, locale) {
  const ms = ts(iso)
  if (!ms) return ""
  return new Date(ms).toLocaleDateString(locale || undefined, { month: "short", day: "numeric" })
}
