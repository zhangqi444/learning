/* The workbook done on paper, marked from photos.
 *
 * The owner, 8 October 2026: "to the practice book, mostly the students will do it offline and
 * post picture, we need such feature. similar to how we support isee offline taken mock test".
 * So the shape is the offline paper's (lib/engine.js, addPaperAttachment; the paper-results
 * skill; the results link): she photographs the pages she did, the photos go into her own
 * Drive folder, the workbook-results skill reads them against the keys the lesson's exercises
 * file already holds, and one link brings the marks back:
 *  - an exercise marked by item → its record in the week, as if she had done it on the site
 *    (`right`/`n`, `via: "photo"`, each item's mark), and an evidence record per item;
 *  - a four-choice block → its sitting's result, and each item answered as in a sitting, so a
 *    wrong one joins the Chinese review pile the way a miss on the site does;
 *  - and, optionally, a review in the shape docs/review.md gives a Chinese week — the notes on
 *    her free writing, shown beside each item — carried in the same link.
 * The photos are hers and stay in her Drive; nothing of the book is copied anywhere. */
import { D, exItems, setId, zhBlock, zhExercises, zhHomework } from "./content"
import { recordAttempts } from "./engine"
import { Store, ts } from "./store"
import { decodePayload } from "./reviews"

/** Where a lesson's workbook photos are kept: the zh slice, one record per lesson. The Drive merge
 *  takes its files one by one (lib/store.js), so photos added on two devices both stay. */
export const photoKey = (lesson) => "wbp:" + lesson
const rec = (lesson) => (Store.s.zh || {})[photoKey(lesson)] || {}
export function workbookPhotos(lesson) {
  return Object.values(rec(lesson).files || {}).filter((f) => f && f.id && !f.removed).sort((a, b) => ts(a.addedAt) - ts(b.addedAt))
}
export function addWorkbookPhoto(lesson, file) {
  const at = new Date().toISOString()
  Store.setSlice("zh", photoKey(lesson), (c) => ({ ...c, files: { ...(c.files || {}), [file.id]: { id: file.id, name: String(file.name || "photo").slice(0, 120), size: file.size || 0, mime: file.mime || "", addedAt: at, at } } }))
}
export function removeWorkbookPhoto(lesson, fid) {
  const at = new Date().toISOString()
  Store.setSlice("zh", photoKey(lesson), (c) => ({ ...c, files: { ...(c.files || {}), [fid]: { ...((c.files || {})[fid] || { id: fid }), removed: at, at } } }))
}
/** When the photos were last marked, and by whom. A photo added after it is still to be marked. */
export function photosMarked(lesson) { const r = rec(lesson); return r.markedAt ? { at: r.markedAt, by: r.markedBy || "" } : null }

/** The week a lesson's marks belong to: its newest note's, or the lesson itself when no note
 *  has assigned it (the synthetic note pages/chinese.jsx makes, whose set is the lesson id). */
export function lessonSet(lesson) { const n = zhHomework().find((x) => x.lesson === lesson); return n ? n.set : lesson }
const blockSetId = (b) => setId("zh-block", b.id.replace(/^zb:/, ""), 0)

/** A marking link's payload, checked against the lesson's own exercises file:
 *  {zhwork: {lesson, by, marks: {<exercise or block id>: {<item id>: true | false | {ok, pick}}}, review?}}.
 *  Throws with a plain message; null when the payload is not a workbook marking. */
export function zhWorkFromPayload(obj) {
  const w = obj && obj.zhwork
  if (!w || typeof w !== "object") return null
  const lesson = (D.zh || {}).lessons ? D.zh.lessons[w.lesson] : null
  if (!lesson) throw new Error(`No lesson called ${w.lesson || "(none)"} is on the site.`)
  const exs = zhExercises(w.lesson), exercises = [], blocks = []
  for (const [id, marks] of Object.entries(w.marks || {})) {
    if (!marks || typeof marks !== "object") throw new Error(`The marks for ${id} are not a list of items.`)
    const ex = exs.find((e) => e.id === id), block = ex ? null : zhBlock(w.lesson, id)
    if (!ex && !block) throw new Error(`${id} is not an exercise of 第${lesson.no}课.`)
    const ids = ex ? exItems(ex).map((it) => it.id) : block.items
    const out = {}
    for (const [itemId, m] of Object.entries(marks)) {
      if (!ids.includes(itemId)) throw new Error(`${itemId} is not in ${id}.`)
      const ok = typeof m === "boolean" ? m : m && typeof m.ok === "boolean" ? m.ok : null
      if (ok === null) throw new Error(`The mark on ${itemId} must be true or false.`)
      const pick = m && typeof m === "object" && /^[A-D]$/.test(m.pick || "") ? m.pick : null
      out[itemId] = { ok, ...(pick ? { pick } : {}) }
    }
    if (!Object.keys(out).length) continue
    if (ex) exercises.push({ ex, marks: out }); else blocks.push({ block, marks: out })
  }
  if (!exercises.length && !blocks.length && !w.review) throw new Error("The link names the lesson but marks nothing.")
  // The same marking opened twice must not count her answers twice: the id is made from the marks.
  const key = JSON.stringify({ lesson: w.lesson, marks: w.marks || {} })
  let h = 0; for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  return { lesson: w.lesson, set: lessonSet(w.lesson), by: typeof w.by === "string" ? w.by.slice(0, 80) : "", exercises, blocks, review: w.review || null, id: `wbm:${w.lesson}:${(h >>> 0).toString(36)}` }
}

/** Put the marks in her record. Opening the same link again changes nothing. */
export function applyZhWork(w) {
  if ((rec(w.lesson).applied || {})[w.id]) return false
  const at = new Date().toISOString(), patch = {}
  for (const { ex, marks } of w.exercises) {
    const items = exItems(ex).filter((it) => marks[it.id])
    patch[ex.id] = { at, right: items.filter((it) => marks[it.id].ok).length, n: items.length, via: "photo", marks: Object.fromEntries(items.map((it) => [it.id, marks[it.id].ok])) }
    recordAttempts(items.map((it) => ({ id: it.id, ok: marks[it.id].ok, ms: 0, pick: "photo" })), "exercise")
  }
  if (Object.keys(patch).length) Store.setSlice("zh", "hw:" + w.set, (cur) => ({ ...cur, exercises: { ...(cur.exercises || {}), ...patch } }))
  for (const { block, marks } of w.blocks) {
    const ids = block.items.filter((i) => marks[i])
    const picks = Object.fromEntries(ids.filter((i) => marks[i].pick).map((i) => [i, marks[i].pick]))
    Store.recordSet(blockSetId(block), { n: ids.length, right: ids.filter((i) => marks[i].ok).length, at, wrong: ids.filter((i) => !marks[i].ok), picks, via: "photo" })
    // as a sitting records them, so a wrong one is due in the Chinese review tomorrow
    recordAttempts(ids.map((i) => ({ id: i, ok: marks[i].ok, ms: 0, pick: marks[i].pick || null })), "set")
  }
  Store.setSlice("zh", photoKey(w.lesson), (c) => ({ ...c, markedAt: at, markedBy: w.by, applied: { ...(c.applied || {}), [w.id]: at } }))
  return true
}

/** The workbook marking in a pasted link or JSON, or null if it is not one. */
export function parseZhWork(text) {
  const t = (text || "").trim()
  if (!t) return null
  let obj
  try {
    if (t.startsWith("{")) obj = JSON.parse(t)
    else { const m = t.match(/(?:#\/import\/)?([A-Za-z0-9_-]{16,})\s*$/); if (!m) return null; obj = decodePayload(m[1]) }
  } catch { return null }
  return zhWorkFromPayload(obj)
}
