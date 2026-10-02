/* A 生字 is a Glim (docs/chinese.md § 10, docs/world.md § 12).
 *
 * Its name is the character, so `traits(ch)` seeds the same cat on every device
 * forever, exactly as `benign` does — FNV-1a over charCodeAt is defined on CJK
 * code points. What this file adds is the HONEST part: which characters are
 * cats at all, and how bright each one is, read live from every attempt the
 * stroke judge has seen and never stored (world.md § 8, rule 3).
 *
 * Which characters: the 生字 of the lessons in the bundle — what the book is
 * teaching her to write — and no others. A dictation phrase like 突然站了起来
 * brings the cat for 突 and none for 站, an old character; the population is
 * what the book teaches, which is `met()`'s rule from the Wordwood carried over.
 *
 * What counts as evidence: only strokes judged by rule. Four sources — the
 * lesson page's own 写 (recorded under zi:<character>), the workbook's `write`
 * items whose key is the character (zx: records, ctx "exercise"), the judged
 * box a free-writing item carries when the book asks for the character first
 * (kept with the hand-in), and dictation words written with the Pencil,
 * re-judged per character from the strokes the zh slice already keeps (each
 * stroke's verdict is stored, so nothing new is written). Deliberately NOT
 * evidence: a reading aloud (a recogniser's estimate must never drive a
 * light), a dictation word shown and rated by hand (a tick on a five-character
 * phrase says nothing about which characters), and the zh-char bank's
 * questions (they ask about tone and stroke count, not for the character). */
import { D } from "./content"
import { dayKey, rec, recordAttempts } from "./engine"
import { Store, ts } from "./store"
import { strokeData, writtenWell } from "./strokes"

/** The record id of a character written from memory on the lesson page. */
export const ziId = (ch) => "zi:" + ch

/** Every 生字 of every lesson in the bundle, in lesson order. */
export function glimChars() {
  const out = []
  for (const l of Object.values((D.zh || {}).lessons || {}).sort((a, b) => a.no - b.no)) {
    for (const z of ((l["生字"] || {}).items || [])) if (z && z.zi && !out.includes(z.zi)) out.push(z.zi)
  }
  return out
}
export const isGlimChar = (ch) => glimChars().includes(ch)
export function lessonChars(lesson) {
  const l = ((D.zh || {}).lessons || {})[lesson]
  return l ? ((l["生字"] || {}).items || []).map((z) => z.zi) : []
}

/** Where the workbook asks for a character by name: `write` items keyed by it,
 *  and free-writing items that carry a judged box for it. Built once per bundle. */
let ASKS = null, ASKS_FOR = null
function asks() {
  if (ASKS && ASKS_FOR === D) return ASKS
  ASKS = { write: {}, free: {} }; ASKS_FOR = D
  for (const L of Object.values((D.zh || {}).exercises || {})) {
    for (const ex of L.exercises || []) {
      for (const it of ex.items || []) {
        if (!it.key) continue
        if (ex.type === "write") (ASKS.write[it.key] = ASKS.write[it.key] || []).push(it.id)
        else if (ex.type === "free") (ASKS.free[it.key] = ASKS.free[it.key] || []).push({ ex: ex.id, id: it.id })
      }
    }
  }
  return ASKS
}

/** A dictation character's verdict, re-read from the strokes kept with the word:
 *  the same count judgeStrokes made — a stroke not accepted, and each one short. */
function dictationOk(ch, kept) {
  const strokes = Array.isArray(kept) ? kept : []
  const nRef = ((strokeData(ch) || {}).strokes || []).length
  const mistakes = strokes.filter((s) => !s || !s.ok).length + Math.max(0, nRef - strokes.length)
  return writtenWell(mistakes, nRef)
}

/** Every time the judge saw this character, oldest first: [{at, ok, src}]. */
export function charAttempts(ch) {
  const out = []
  const r = rec(ziId(ch))
  for (const h of (r && r.hist) || []) if (h && h.ctx === "exercise") out.push({ at: h.at, ok: !!h.ok, src: "lesson" })
  const a = asks()
  for (const id of a.write[ch] || []) {
    const x = rec(id)
    for (const h of (x && x.hist) || []) if (h && h.ctx === "exercise") out.push({ at: h.at, ok: !!h.ok, src: "workbook" })
  }
  const zh = Store.s.zh || {}
  for (const k of Object.keys(zh)) {
    if (!k.startsWith("hw:")) continue
    const hw = zh[k] || {}
    for (const f of a.free[ch] || []) {
      const it = (((hw.exercises || {})[f.ex] || {}).items || {})[f.id]
      const j = it && it.judged
      if (j && typeof j.mistakes === "number") out.push({ at: j.at || it.at, ok: writtenWell(j.mistakes, j.n), src: "workbook" })
    }
    const dict = hw.dictation || {}
    for (const w of Object.keys(dict)) {
      const d = dict[w]
      if (!d || d.mode !== "pencil" || !Array.isArray(d.strokes)) continue
      for (const box of d.strokes) if (box && box.ch === ch) out.push({ at: d.at, ok: dictationOk(ch, box.strokes), src: "dictation" })
    }
  }
  return out.sort((a, b) => ts(a.at) - ts(b.at))
}

/** How well she can write it, as the six stage names (docs/chinese.md § 10.3).
 *  never written → Unseen · written, never accepted → Glimpsed · accepted once
 *  and last time → Steady · accepted on two different days → Radiant ·
 *  accepted before, last attempt not → Flickering (the light not lying — the
 *  same meaning a due word has). Bright is not used, as it is not for words. */
export function charStatus(ch) {
  const hs = charAttempts(ch)
  if (!hs.length) return { stage: "Unseen", attempts: 0, okDays: 0 }
  const okDays = new Set(hs.filter((h) => h.ok).map((h) => dayKey(ts(h.at)))).size
  const last = hs[hs.length - 1]
  let stage
  if (!okDays) stage = "Glimpsed"
  else if (!last.ok) stage = "Flickering"
  else stage = okDays >= 2 ? "Radiant" : "Steady"
  return { stage, attempts: hs.length, okDays, last }
}
/** Can she write it from memory, by the judge: the last time she wrote it, it was written. */
export const canWrite = (ch) => { const s = charStatus(ch).stage; return s === "Steady" || s === "Radiant" }
export function writtenCount(lesson) {
  const chars = lessonChars(lesson)
  return { written: chars.filter(canWrite).length, total: chars.length }
}

/** The shelf: every character she has met (written at least once, anywhere), at its brightness. */
export function metChars() {
  return glimChars().map((ch) => ({ ch, ...charStatus(ch) })).filter((c) => c.attempts > 0)
}

/** One write on the lesson page. The record is the attempt; the strokes — her
 *  input — are kept beside it in the zh slice, as the workbook keeps them. ctx
 *  "exercise" is evidence LEARN_CTX never admits, so it schedules nothing and
 *  reaches no number; findItem does not resolve a zi: id and nothing needs it to. */
export function recordWrite(ch, r) {
  const ok = writtenWell(r.mistakes, r.n)
  recordAttempts([{ id: ziId(ch), ok, ms: 0, pick: String(r.mistakes) }], "exercise")
  Store.setSlice("zh", ziId(ch), (cur) => ({ ...cur, last: { mistakes: r.mistakes, n: r.n, strokes: r.strokes } }))
  return ok
}
