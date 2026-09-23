/* Question-bank helpers. `D` is the bundle (window.__LEARNING__ or content/bundle.json). */
import { Store, ts } from "./store"

export const SUBJ = {
  vr: { name: "Verbal Reasoning", short: "Verbal", blurb: "Vocabulary and sentence completion", color: "var(--chart-1)" },
  qr: { name: "Quantitative Reasoning", short: "Quantitative", blurb: "Reasoning with numbers, no calculator", color: "var(--chart-2)" },
  ma: { name: "Mathematics", short: "Math", blurb: "Arithmetic, geometry, data", color: "var(--chart-3)" },
  rc: { name: "Reading Comprehension", short: "Reading", blurb: "Passages and comprehension", color: "var(--chart-4)" },
}
export const ORDER = ["vr", "qr", "ma", "rc"]
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
export function setsFor(sub, wk) { return chunk(itemsFor(sub, wk)) }
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
export function fmtDate(iso) {
  const t = ts(iso)
  if (!t) return ""
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
