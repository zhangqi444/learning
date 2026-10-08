/* 写字复习 — what she could not write comes back on later days, until she can.
 *
 * The owner, 8 October 2026: what the site does that the book cannot is the writing, the
 * reading and the 听写. Until now a character she failed to write was recorded and never asked
 * again, and a 听写 word she got wrong was rated and left there. This puts both back in front
 * of her on the review's own ladder (INTERVALS, 1·3·7·21 days): the day after a miss, then
 * three, seven and twenty-one days after each later day she writes it right; a fourth such
 * day retires it. A character written right the first time rides the same ladder from its
 * first rung, because writing from memory a few days on is the whole of 默写.
 *
 * Nothing is stored for the schedule. It is read off the judged attempts already kept — for a
 * 生字, charAttempts (the lesson page, the workbook, the judged boxes, the Pencil 听写); for a
 * 听写 word, its ratings in each week's record and this page's own attempts under zw:<word>, a
 * learning record with ctx "exercise", which merges answer by answer and which the engine never
 * schedules. So two devices agree without a schedule to merge. */
import { D, zhHomework } from "./content"
import { INTERVALS, dayKey, rec } from "./engine"
import { Store, ts } from "./store"
import { charAttempts, taughtChars } from "./zi"
import { hasStrokes } from "./strokes"

/** The record id of a 听写 word written again on the review page. */
export const zwId = (w) => "zw:" + w
const HAN = /\p{Script=Han}/u
/** The characters of a word she writes: its Han characters, in order. */
export const hanOf = (w) => [...w].filter((c) => HAN.test(c))

function addDays(day, n) { const [y, m, d] = day.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n).getTime()) }

/** Where an item stands on the ladder, from its attempts [{at, ok}]: the day it is next due,
 *  or null once it is retired (or was never tried). One day counts once — the last attempt of
 *  a day is that day's — so writing a character five times in a row is one day's evidence. */
export function nextDue(attempts) {
  if (!attempts.length) return null
  const byDay = new Map()
  for (const h of [...attempts].sort((a, b) => ts(a.at) - ts(b.at))) byDay.set(dayKey(h.at), h)
  const days = [...byDay.entries()]
  let right = 0
  for (let i = days.length - 1; i >= 0 && days[i][1].ok; i--) right++
  const last = days[days.length - 1][0]
  if (!right) return { due: addDays(last, INTERVALS[0]), right, last }
  if (right >= INTERVALS.length) return null
  return { due: addDays(last, INTERVALS[right]), right, last }
}

/** Every 听写 word she has been rated on, with its attempts: each week's rating (by hand or by
 *  the Pencil) and every rewrite on the review page. A word in two weeks' lists is one word. */
export function dictationAttempts() {
  const out = new Map()
  const add = (w, a) => { if (!out.has(w)) out.set(w, []); if (a) out.get(w).push(a) }
  for (const note of zhHomework()) {
    const task = (note.tasks || []).find((x) => x.kind === "dictation")
    if (!task) continue
    const st = ((Store.s.zh || {})[`hw:${note.set}`] || {}).dictation || {}
    for (const w of Object.values(task.words || {}).flat()) {
      const d = st[w]
      if (d && typeof d.ok === "boolean") add(w, { at: d.at, ok: d.ok })
    }
  }
  for (const w of [...out.keys()]) for (const h of ((rec(zwId(w)) || {}).hist || [])) if (h && h.ctx === "exercise") out.get(w).push({ at: h.at, ok: !!h.ok })
  return out
}
/** What is due today: the 生字 taught so far that she has written, and the 听写 words she has
 *  been rated on, whose next day on the ladder has come. Oldest due first; a 生字 before a word
 *  on the same day. `today` is a local day key, for the tests. */
export function writeReview(today = dayKey(Date.now())) {
  const out = []
  for (const ch of taughtChars()) {
    const n = nextDue(charAttempts(ch))
    if (n && n.due <= today) out.push({ kind: "char", id: ch, ch, ...n, entry: lessonEntry(ch) })
  }
  for (const [w, hs] of dictationAttempts()) {
    if (!hanOf(w).length || !hanOf(w).every(hasStrokes)) continue
    const n = nextDue(hs)
    if (n && n.due <= today) out.push({ kind: "word", id: zwId(w), word: w, ...n })
  }
  return out.sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.kind === b.kind ? 0 : a.kind === "char" ? -1 : 1))
}

/** A 生字's own line in its lesson: the pinyin and the gloss the lesson page shows. */
function lessonEntry(ch) {
  for (const l of Object.values((D.zh || {}).lessons || {}).sort((a, b) => a.no - b.no)) {
    const z = ((l["生字"] || {}).items || []).find((x) => x.zi === ch)
    if (z) return { ...z, lesson: l.id }
  }
  return null
}
