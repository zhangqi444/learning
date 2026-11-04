/* Every question she can be shown, as one list that can be narrowed any way at once.
 *
 * The owner, 4 November 2026: "I need a centralized or easier way to double check the wrong
 * questions … filter at the skill page not work because e.g. to ma it has 10s of skills", and of
 * a subject page, "we should build this page as a long list, and allow me to use skill or status
 * practiced/missed/not yet or any other dimension to filter the result". The wrong questions
 * could be reached one skill at a time, one plan week at a time, or one paper at a time, and
 * Maths alone has thirty-odd skills. This is the list those pages were each a slice of.
 *
 * Her answers are counted by lib/tally.js, as every other page counts them, so a number here and
 * the same number on a skill's page cannot disagree. What this file adds is the redo.
 *
 * A REDO is the question she got wrong, asked again as itself. The owner, the same day: "I need
 * to redo the wrong questions, first, then is the similar questions." Review asks two different
 * questions on the skill in a miss's place and never the miss (AGENTS.md, the owner's ruling of
 * 4 October), so until now the one question she actually got wrong could only be met again by
 * redoing its whole set. A redo is written to her record under its own context, `redo`, which
 * is deliberately not evidence (LEARN_CTX): she has usually seen its key by then — on the score
 * card, in instant mode, on this very list — so a right redo proves about as much as a
 * corrections pass does. It moves no level, no accuracy and no review date; the review keeps
 * deciding when a skill is known, from questions she has not seen answered. What a redo does
 * decide is whether the question still needs one: a question waits "to redo" until she answers it
 * — that question, not a stand-in for it — right after her latest wrong answer to it. */
import { D, ORDER, SUBJ, setsFor } from "@/lib/content"
import { LEARN_CTX, bankSkill, dayKey, findItem, rec, reviewItems, skillOf } from "@/lib/engine"
import { questionResult } from "@/lib/tally"
import { ts } from "@/lib/store"

const SEC2SUB = { VR: "vr", QR: "qr", RC: "rc", MA: "ma" }

/** How a question stands on redo: the latest redo answer, and whether it still needs one. It does
 *  when she answered it wrong and has not answered IT right since — on a redo, or anywhere else the
 *  question itself came back: a second attempt at its set, a mixed set, a mock. Never a stand-in's
 *  answer (`via`), which was given to a different question. A guess that landed is right on the
 *  paper and is taken as right here too; the Guessed button is how to find those. */
export function redoState(id) {
  const hs = ((rec(id) || {}).hist || []).filter(Boolean)
  let lastWrong = null, lastRedo = null, lastRight = null
  // By time, not by position: a history merged from two devices is a union, not a replay.
  const later = (a, b) => !a || ts(b.at) >= ts(a.at)
  for (const h of hs) {
    if (h.ctx === "redo" && later(lastRedo, h)) lastRedo = h
    if (h.via || !(h.ctx === "redo" || LEARN_CTX[h.ctx])) continue
    if (h.ok) { if (later(lastRight, h)) lastRight = h } else if (later(lastWrong, h)) lastWrong = h
  }
  const need = !!lastWrong && !(lastRight && ts(lastRight.at) >= ts(lastWrong.at))
  return { need, last: lastRedo, lastWrongAt: lastWrong ? lastWrong.at : null }
}

/** Whether a row is a question from a plan week or from a paper she sat here. */
const placeName = (p) => (p.mock ? `${p.name} · ${p.sec} ${p.n}` : `${p.w} · sitting ${p.set + 1}`)

let PLACES = null, PLACES_FOR = null
/** Each plan question's week, sitting and position, in plan order — built once per bundle. */
function places() {
  if (PLACES && PLACES_FOR === D) return PLACES
  PLACES = {}; PLACES_FOR = D
  let order = 0
  for (const sub of ORDER) for (const w of D.weeks || []) setsFor(sub, w.w).forEach((set, n) => set.forEach((q, j) => { PLACES[q.id] = { w: w.w, set: n, j, order: order++ } }))
  return PLACES
}

/** Every question in `subs` she could be shown: all of the plan's, and of the papers sat here only
 *  the ones she has answered — a paper she has not sat is not a list to read through beforehand.
 *  A paper's question is filed under the bank skill its paper-style tag resolves to, the skill the
 *  mastery ladder counts it under, so one skill filter finds both. */
export function questionRows(subs = ORDER) {
  const P = places(), out = []
  for (const sub of subs) {
    for (const it of D.subjects[sub] || []) {
      const p = P[it.id]
      if (!p) continue
      out.push({ id: it.id, sub, it, sk: skillOf(sub, it), wk: p.w, place: p, where: placeName(p), order: p.order })
    }
  }
  const mocks = D.mocks || []
  mocks.forEach((m, mi) => {
    Object.keys((D.mockItems || {})[m.id] || {}).forEach((sec, si) => {
      const sub = SEC2SUB[sec] || "vr"
      if (!subs.includes(sub)) return
      D.mockItems[m.id][sec].forEach((it, j) => {
        if (!questionResult(it.id).done) return
        const b = bankSkill(sub, it)
        const p = { mock: m.id, name: m.name, sec, n: j + 1 }
        out.push({ id: it.id, sub, it, sk: b && b.sub === sub ? b.sk : skillOf(sub, it), wk: m.id, place: p, where: placeName(p), order: 1e6 + mi * 1e4 + si * 100 + j })
      })
    })
  })
  return out
}

/** The ways the list can be narrowed by her answers, in the order the buttons show them. Each
 *  reads a row's `res` (questionResult) and `redo` (redoState). */
export const STATUS = [
  { id: "missed", label: "Missed", keep: (r) => r.res.wrong > 0 },
  { id: "redo", label: "To redo", keep: (r) => r.redo.need },
  { id: "twice", label: "Missed 2+ times", keep: (r) => r.res.wrong >= 2 },
  { id: "guessed", label: "Guessed", keep: (r) => r.res.guessed > 0 },
  { id: "tried", label: "Tried", keep: (r) => r.res.done > 0 },
  { id: "untried", label: "Not tried yet", keep: (r) => r.res.done === 0 },
  { id: "all", label: "All", keep: () => true },
]
export const statusKeep = (id) => (STATUS.find((s) => s.id === id) || STATUS[STATUS.length - 1]).keep

export const SORTS = [
  { id: "plan", label: "Plan order" },
  { id: "recent", label: "Latest answer first" },
  { id: "most", label: "Most missed first" },
]
const lastAt = (r) => (r.res.last ? ts(r.res.last.at) : 0)
export function sortRows(rows, sort) {
  const out = [...rows]
  if (sort === "recent") out.sort((a, b) => lastAt(b) - lastAt(a) || a.order - b.order)
  else if (sort === "most") out.sort((a, b) => b.res.wrong - a.res.wrong || lastAt(b) - lastAt(a) || a.order - b.order)
  else out.sort((a, b) => a.order - b.order)
  return out
}

/** Her answers on each row, read once: the list, its counts and every filter use the same reading. */
export function withResults(rows) {
  return rows.map((r) => ({ ...r, res: questionResult(r.id), redo: redoState(r.id) }))
}

/** The filters a list can take, read from or written to its address. `sub` is "" for every
 *  subject; `sk` and `wk` are "" for any. */
export const FILTER_KEYS = ["sub", "status", "sk", "wk", "sort"]
export function applyFilters(rows, f, { skip } = {}) {
  return rows.filter((r) =>
    (skip === "sub" || !f.sub || r.sub === f.sub) &&
    (skip === "status" || statusKeep(f.status || "all")(r)) &&
    (skip === "sk" || !f.sk || r.sk === f.sk) &&
    (skip === "wk" || !f.wk || r.wk === f.wk))
}

/** The places a list can be narrowed to, in plan order: the weeks, then the papers sat here. */
export function placeOptions(rows) {
  const seen = new Set(rows.map((r) => r.wk))
  const weeks = (D.weeks || []).map((w) => w.w).filter((w) => seen.has(w)).map((w) => ({ id: w, label: w }))
  const mocks = (D.mocks || []).filter((m) => seen.has(m.id)).map((m) => ({ id: m.id, label: m.name }))
  return [...weeks, ...mocks]
}

/** One sitting's worth of redo: the questions waiting to redo among the filtered rows, in the
 *  list's order. A sitting, because a redo run has the same reason to stop that a review has. */
export const REDO_SITTING = 24
export function redoItems(f, cap = REDO_SITTING) {
  const subs = f.sub ? [f.sub] : ORDER
  const rows = applyFilters(withResults(questionRows(subs)), { ...f, status: "redo" })
  return sortRows(rows, f.sort).slice(0, cap).map((r) => r.it)
}

/** The questions behind the misses the next review sitting lets in, as themselves: the redo the
 *  Review page offers before "Let N in", so the wrong ones come first and the similar ones after.
 *  Read off the sitting reviewItems would serve, so it covers exactly the misses that sitting
 *  does. A paper's miss has no question of ours to show and a precision word is asked as itself
 *  by the review already, so neither is here. */
export function doorRedo(sub) { return redoOf(reviewItems(sub)) }
/** The same, from a review sitting already built — the Review page has one in hand. */
export function redoOf(run) {
  const ids = []
  for (const it of run || []) { const id = it.standsFor || it.id; if (!ids.includes(id)) ids.push(id) }
  return ids.map((id) => findItem(id)).filter((h) => h && h.it && (h.src === "set" || h.src === "mock") && (h.it.c || []).length).map((h) => h.it)
}
/** Whether every question in `items` has been redone today — the Review page's tick. */
export function redoneToday(items) {
  const today = dayKey()
  return items.length > 0 && items.every((it) => { const l = redoState(it.id).last; return !!l && dayKey(l.at) === today })
}

export const subjectName = (sub) => (SUBJ[sub] ? SUBJ[sub].name : sub)
