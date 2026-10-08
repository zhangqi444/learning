/* Essay reviews: feedback on one of her essays, written outside the app (by Claude,
 * asked by a parent) and carried into her progress.json so every device shows it.
 *
 * Why it goes through the app and not straight into Drive: the site only holds
 * the drive.file scope, so it can only see files it created itself. A review has
 * to enter through the app — pasted or opened as an import link — and from there
 * it syncs like everything else. The contract is docs/review.md. */
import { D } from "@/lib/content"
import { t as pick } from "@/lib/lang"
import { Store, ts } from "@/lib/store"
import { offlinePaper, paperSkillOptions } from "@/lib/engine"

export const REVIEW_VERSION = 1
const LIST = ["strengths", "suggestions"]

function str(v) { return typeof v === "string" ? v.trim() : "" }
function list(v) { return Array.isArray(v) ? v.map(str).filter(Boolean) : [] }

const planWeeks = () => (D.weeks || []).map((w) => w.w)

/** Normalise one review from the outside world. Returns null when it cannot be one. */
export function normalizeReview(raw) {
  if (!raw || typeof raw !== "object") return null
  const t = raw.target || {}
  let target = null
  if (t.kind === "essay" && D.essay && D.essay.weeks[t.wk]) target = { kind: "essay", wk: t.wk }
  if (t.kind === "mock" && D.mocks.some((m) => m.id === t.form)) target = { kind: "mock", form: t.form }
  if (t.kind === "week" && planWeeks().includes(t.wk)) target = { kind: "week", wk: t.wk }
  if (t.kind === "month" && /^\d{4}-\d{2}$/.test(t.m || "")) target = { kind: "month", m: t.m }
  // One week of Chinese homework, by the date of the teacher's note (docs/chinese.md § 8).
  // the date of a homework note, or a lesson id for a lesson she practises without one
  if (t.kind === "zh" && D.zh && ((D.zh.homework || {})[t.set] || (D.zh.lessons || {})[t.set])) target = { kind: "zh", set: t.set }
  if (!target) return null
  const summary = str(raw.summary)
  if (!summary) return null
  const at = ts(raw.at) ? new Date(ts(raw.at)).toISOString() : new Date().toISOString()
  const key = target.wk || target.form || target.m || target.set
  const id = str(raw.id) || `${target.kind}:${key}:${at.slice(0, 10)}`
  const out = { id, v: REVIEW_VERSION, target, at, reviewer: str(raw.reviewer) || "Reviewer", summary, next: str(raw.next) }
  for (const k of LIST) out[k] = list(raw[k])
  if (str(raw.source)) out.source = str(raw.source)     // where the reviewer read it, e.g. "the Essay workbook"
  // Follow-ups: things to do in a named plan week. They land on that week's checklist,
  // ticked by hand like a parent to-do. A week digest's actions default to its own week.
  out.actions = (Array.isArray(raw.actions) ? raw.actions : []).map((a) => {
    const text = str(a && a.text)
    const wk = planWeeks().includes(a && a.wk) ? a.wk : target.kind === "week" ? target.wk : null
    return text && wk ? { text, wk, path: str(a && a.path) || null } : null
  }).filter(Boolean).slice(0, 8)
  // A Chinese review speaks to the items no rule could mark: a note each, to her,
  // shown beside the exercise. ok is true, false, or null when it is not a yes/no.
  if (target.kind === "zh") out.items = (Array.isArray(raw.items) ? raw.items : []).map((it) => {
    const id = str(it && it.id), note = str(it && it.note), ok = it && (it.ok === true || it.ok === false) ? it.ok : null
    if (!id || !note) return null
    const o = { id, ok, note }
    // A read item may bring the text she was to read and what the reviewer
    // heard (docs/review.md): the site holds no passage of its own to compare
    // against, so the comparison on her page is drawn from these two.
    const passage = str(it.passage).slice(0, 600), heard = str(it.heard).slice(0, 600)
    if (passage) o.passage = passage
    if (heard) o.heard = heard
    return o
  }).filter(Boolean).slice(0, 20)
  if (raw.draftAt && ts(raw.draftAt)) out.draftAt = new Date(ts(raw.draftAt)).toISOString()
  if (typeof raw.words === "number" && raw.words >= 0) out.words = Math.round(raw.words)
  const dims = ((D.essay && D.essay.rubric && D.essay.rubric.dimensions) || []).map((d) => d.name)
  const rubric = {}
  for (const k of Object.keys(raw.rubric || {})) { const n = Math.round(+raw.rubric[k]); if (dims.includes(k) && n >= 1 && n <= 4) rubric[k] = n }
  if (Object.keys(rubric).length) out.rubric = rubric
  return out
}

/** A payload is either one review, an array of them, or {reviews: {id: review}}. */
export function reviewsFromPayload(obj) {
  const raws = Array.isArray(obj) ? obj : obj && obj.reviews && typeof obj.reviews === "object" ? Object.values(obj.reviews) : [obj]
  const out = {}
  for (const r of raws) { const n = normalizeReview(r); if (n) out[n.id] = n }
  return out
}

/* base64url ⇄ UTF-8 JSON, so a review fits in a link: #/import/<payload> */
export function encodePayload(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
export function decodePayload(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return JSON.parse(new TextDecoder().decode(bytes))
}
/** A paper sat on paper, marked, in a link: `{ "paper": { "form": "TPR", "sat":
 *  "2026-10-04", "scores": { "VR": 24, … }, "missed": { "VR": [5, 7, …], … } } }`,
 *  and optionally `notes` and `analysis` — what went wrong, per miss and across them.
 *  Made by tools/paper_link.py from the marked sheet, so the scores and the circled
 *  numbers reach her record without being typed in, and checked here against the
 *  paper's own sections so a mistyped link cannot store a score above its size.
 *  Returns null when the text is not a paper result; throws with a plain message
 *  when it is one but something in it is wrong. */
export function paperFromPayload(obj) {
  const p = obj && obj.paper
  if (!p || typeof p !== "object") return null
  const form = offlinePaper(p.form)
  if (!form) throw new Error(`No paper called ${p.form || "(none)"} is on her list. Add it on the Mock exams page first.`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.sat || "")) throw new Error("The paper's date must be written as YYYY-MM-DD.")
  const scores = {}, missed = {}
  for (const s of form.sections.filter((x) => x.n)) {
    const v = (p.scores || {})[s.id]
    if (v != null) { if (!Number.isInteger(v) || v < 0 || v > s.n) throw new Error(`${s.name} must be a whole number from 0 to ${s.n}.`); scores[s.id] = v }
    const m = (p.missed || {})[s.id]
    if (m != null) {
      if (!Array.isArray(m) || m.some((k) => !Number.isInteger(k) || k < 1 || k > s.n)) throw new Error(`${s.name} missed questions must be numbers from 1 to ${s.n}.`)
      missed[s.id] = [...new Set(m)].sort((a, b) => a - b)
    }
  }
  // `tags`: a skill for a missed question, by section and number — {"QR": {"12": "Data reasoning"}}.
  // Only the bank's own skill names are taken, so each one has questions to ask.
  const tags = {}
  for (const [sec, m] of Object.entries(p.tags || {})) {
    const s = form.sections.find((x) => x.id === sec)
    if (!s || !m || typeof m !== "object") throw new Error(`The link tags a section the paper does not have: ${sec}.`)
    const ok = new Set(paperSkillOptions(sec))
    for (const [n, sk] of Object.entries(m)) {
      const k = Number(n)
      if (!Number.isInteger(k) || k < 1 || k > s.n) throw new Error(`${s.name} has no question ${n}.`)
      if (!ok.has(sk)) throw new Error(`"${sk}" is not a skill the practice bank has for ${s.name}.`)
      tags[`${sec}:${k}`] = sk
    }
  }
  // `notes`: what went wrong on a miss, in the marker's own words, with the letter she
  // chose and the right one — {"QR": {"23": {"pick": "C", "key": "B", "why": "…"}}}.
  // `analysis`: a few lines on what the misses have in common. Neither carries the
  // book's text; both stay in her record (lib/engine.js, setPaperNotes).
  const notes = {}
  for (const [sec, m] of Object.entries(p.notes || {})) {
    const s = form.sections.find((x) => x.id === sec)
    if (!s || !m || typeof m !== "object") throw new Error(`The link has notes on a section the paper does not have: ${sec}.`)
    for (const [n, v] of Object.entries(m)) {
      const k = Number(n)
      if (!Number.isInteger(k) || k < 1 || k > s.n) throw new Error(`${s.name} has no question ${n}.`)
      if (!v || typeof v !== "object" || typeof v.why !== "string" || !v.why.trim()) throw new Error(`The note on ${s.name} question ${n} says nothing.`)
      for (const f of ["pick", "key"]) if (v[f] != null && !/^[A-E]$/.test(v[f])) throw new Error(`The note on ${s.name} question ${n} gives "${v[f]}" as a choice; a choice is a letter from A to E.`)
      // `where` and `ctx`: where the question, and the figure or passage it refers to, sit on
      // the paper's own PDF — [page, x0, y0, x1, y1], fractions of the page — so its page can
      // show it cut out of that PDF (components/paper-question.jsx). Positions, not words.
      const box = (b, what) => {
        if (b == null) return null
        const okBox = Array.isArray(b) && b.length === 5 && Number.isInteger(b[0]) && b[0] >= 1 && b.slice(1).every((x) => typeof x === "number" && x >= 0 && x <= 1) && b[1] < b[3] && b[2] < b[4]
        if (!okBox) throw new Error(`The note on ${s.name} question ${n} gives a ${what} that is not [page, x0, y0, x1, y1] on the page.`)
        return b
      }
      const where = box(v.where, "place"), ctx = box(v.ctx, "figure")
      // `word`: the word a Verbal miss turned on ("adorn"), so review asks that word's own
      // questions in its place (lib/engine.js, reviewStandIns). One word or a short phrase.
      if (v.word != null && !(typeof v.word === "string" && /^[A-Za-z][A-Za-z' -]{0,38}[A-Za-z]$/.test(v.word.trim()))) throw new Error(`The note on ${s.name} question ${n} names "${v.word}" as its word; a word is letters, at most 40.`)
      const word = v.word ? v.word.trim().toLowerCase() : null
      notes[`${sec}:${k}`] = { why: v.why.trim().slice(0, 400), ...(v.pick ? { pick: v.pick } : {}), ...(v.key ? { key: v.key } : {}), ...(where ? { where } : {}), ...(ctx ? { ctx } : {}), ...(word ? { word } : {}) }
    }
  }
  if (p.analysis != null && !Array.isArray(p.analysis)) throw new Error("The link's analysis must be a list of lines.")
  const analysis = (p.analysis || []).filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().slice(0, 500)).slice(0, 10)
  if (!Object.keys(scores).length && !Object.keys(missed).length && !Object.keys(tags).length && !Object.keys(notes).length && !analysis.length) throw new Error("The link names the paper but carries no scores.")
  // The entry's id is made from the results alone, so the same results arriving again
  // with notes — a second link from the same marking — add the notes, not a second entry.
  const key = JSON.stringify({ form: form.id, sat: p.sat, scores, missed, tags })
  let h = 0; for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  return { form, sat: p.sat, scores, missed, tags, notes, analysis, by: typeof p.by === "string" ? p.by.slice(0, 80) : "", id: `link:${form.id}:${p.sat}:${(h >>> 0).toString(36)}` }
}
/** The paper result in a pasted link or JSON, or null if it is not one. */
export function parsePaperImport(text) {
  const t = (text || "").trim()
  if (!t) return null
  let obj
  try {
    if (t.startsWith("{")) obj = JSON.parse(t)
    else { const m = t.match(/(?:#\/import\/)?([A-Za-z0-9_-]{16,})\s*$/); if (!m) return null; obj = decodePayload(m[1]) }
  } catch { return null }
  return paperFromPayload(obj)
}
/** Accepts pasted JSON or a pasted import link / payload. Throws with a plain message. */
export function parseImport(text) {
  const t = (text || "").trim()
  if (!t) throw new Error("Nothing to import yet.")
  let obj
  if (t.startsWith("{") || t.startsWith("[")) obj = JSON.parse(t)
  else {
    const m = t.match(/(?:#\/import\/)?([A-Za-z0-9_-]{16,})\s*$/)
    if (!m) throw new Error("That does not look like a review link or review JSON.")
    obj = decodePayload(m[1])
  }
  const map = reviewsFromPayload(obj)
  if (!Object.keys(map).length) throw new Error("No review found in it. A review needs a target (essay week or mock form) and a summary.")
  return map
}

/* ---------- reading ---------- */
export function allReviews() { return Object.values(Store.s.reviews || {}).filter((r) => r && r.target).sort((a, b) => ts(b.at) - ts(a.at)) }
export function reviewsFor(target) {
  const same = (a, b) => a.kind === b.kind && a.wk === b.wk && a.form === b.form && a.m === b.m && a.set === b.set
  return allReviews().filter((r) => same(r.target, target))
}
/** Follow-ups any review asked for in week `wk`, with a stable id so a tick sticks. */
export function actionsForWeek(wk) {
  const out = []
  for (const r of allReviews()) (r.actions || []).forEach((a, i) => {
    if (a.wk === wk) out.push({ id: `act:${r.id}:${i}`, text: a.text, path: a.path, from: reviewTargetLabel(r) })
  })
  return out
}
export function isSeen(id) { return !!(Store.s.reviewsSeen || {})[id] }
export function unseenReviews() { return allReviews().filter((r) => !isSeen(r.id)) }
export function markSeen(id) {
  if (isSeen(id)) return
  Store.setMany("reviewsSeen", { [id]: { at: new Date().toISOString() } })
}
/** Store reviews that arrived by link or paste. Existing ids are kept unless the new copy is newer. */
export function addReviews(map) {
  const cur = Store.s.reviews || {}, add = {}
  for (const id of Object.keys(map)) { if (!cur[id] || ts(map[id].at) > ts(cur[id].at)) add[id] = map[id] }
  if (Object.keys(add).length) Store.setMany("reviews", add, { stamp: false })
  return Object.keys(add).length
}
const monthName = (m) => new Date(m + "-01T00:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" })
export function reviewTargetLabel(r) {
  const t = r.target
  if (t.kind === "essay") return `Essay · ${t.wk}`
  if (t.kind === "week") return `${t.wk} · the week`
  if (t.kind === "month") return monthName(t.m)
  if (t.kind === "zh") { const l = D.zh && D.zh.lessons && D.zh.lessons[t.set]; return `${pick("中文", "Chinese")} · ${l ? pick(`第${l.no}课`, `Lesson ${l.no}`) : t.set}` }
  const m = D.mocks.find((x) => x.id === t.form)
  return `${m ? m.name : t.form} · essay`
}
/** Does an import link carry Chinese reviews and nothing else? Then the import
 *  page is a Chinese page: its chrome in the page's language, the toggle in the
 *  header. A link that does not parse is not one, and is not an error here —
 *  the import page says what is wrong with it. */
export function importIsZh(payload) {
  // a workbook marking (lib/zhwork.js) is Chinese too
  try { const m = String(payload || "").match(/([A-Za-z0-9_-]{16,})\s*$/); if (m && (decodePayload(m[1]) || {}).zhwork) return true } catch { /* not one */ }
  try { const list = Object.values(parseImport(payload)); return list.length > 0 && list.every((r) => r.target.kind === "zh") } catch { return false }
}
export function reviewPath(r) {
  const t = r.target
  if (t.kind === "essay") return `/essay/${t.wk}`
  if (t.kind === "week") return `/checklist/${t.wk}`
  if (t.kind === "month") return `/checklist/month/${t.m}`
  if (t.kind === "zh") return "/chinese"
  return `/mock/${t.form}/ESSAY`
}
