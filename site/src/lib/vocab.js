/* The word bank. The owner, 6 October 2026: "you need to build vocabulary. each words i
 * need to how its covered by questions. and also you need to track the result, so we know
 * to each words how well we covered, if covered, done how many times, right/wrong".
 *
 * Every word is read off the questions themselves, never off a list kept beside them, so
 * the bank cannot drift from what she is actually asked. A question covers a word in one of
 * three ways:
 *  - asked:  it tests the word — a synonym's capitalised headword ("RESOLUTE most nearly
 *            means"), a words-in-context headword ("CAPITAL means:"), the right answer of a
 *            sentence completion, the list word a phrase completion's sentence turns on
 *            ("Since arguing with the referee was futile, the coach ____"), or the word a
 *            reading question quotes for its meaning;
 *  - quiz:   the four-choice question the site builds from her weekly list (`w:<word>`),
 *            which the Wordwood's gates answer too;
 *  - choice: a wrong answer of a sentence completion — a word she has to know well enough
 *            to turn down. Choosing it is a miss that names the word, and is counted apart.
 * A synonym's choices are meanings ("determined"), not words being taught, so they are not
 * indexed. Inflections fold onto a word when the plain form is in the bank too ("stifled"
 * onto "stifle"), and each half of a paired list entry ("imply / infer") onto the entry, the
 * way the Wordwood files them. Nothing else is guessed: "hasty" and "hastily" stay two words.
 *
 * Her results come from the record the review runs on and count the answers it counts
 * (LEARN_CTX). A corrections pass re-asks a question whose answer she has just been shown,
 * and an answer written onto a question by the stand-in that asked in its place (`via`) was
 * given to a different question, with different words in it — neither is counted here. */
import { D, LTR, keyOf } from "@/lib/content"
import { LEARN_CTX, rec } from "@/lib/engine"

const SYN = /^\s*([A-Z][A-Z'’\- ]*[A-Z])\s+most nearly means/
const CTX = /\b([A-Z][A-Z'’-]{2,})\s+means\s*:/
const BLANK = /_{3,}/
const RC_ASKS = /most nearly means|closest in meaning|best understood as|\bmeans\b/i
const RC_WORD = /\*([^*]{2,40})\*|[“"]([^”"]{2,40})[”"]/

export const vocabPath = (w) => `/vocab/${encodeURIComponent(w)}`

/** The plain forms an inflected word may come from: -s, -es, -ies, -ed, -ied, -ing, and a
 *  doubled last consonant ("regretted"). Only ever used to find a form already in the bank. */
function plainForms(s) {
  const out = []
  if (s.endsWith("ies") || s.endsWith("ied")) out.push(s.slice(0, -3) + "y")
  if (s.endsWith("es")) out.push(s.slice(0, -2))
  if (s.endsWith("s") && !s.endsWith("ss")) out.push(s.slice(0, -1))
  if (s.endsWith("ed")) {
    out.push(s.slice(0, -2), s.slice(0, -1))
    if (s.length > 5 && s[s.length - 3] === s[s.length - 4]) out.push(s.slice(0, -3))
  }
  if (s.endsWith("ing")) {
    out.push(s.slice(0, -3), s.slice(0, -3) + "e")
    if (s.length > 6 && s[s.length - 4] === s[s.length - 5]) out.push(s.slice(0, -4))
  }
  return out.filter((c) => c.length >= 3)
}

let IDX = null, FOR = null
/** { list, by }: every word, A–Z, and the same keyed by its lower-case form. A word is
 *  { key, word, entry, lists, refs }: `entry` and `lists` when it is on a weekly list, and
 *  `refs` [{ id, role, sub, src, form, n, it, letter }] — every question that covers it. */
export function vocabIndex() {
  if (IDX && FOR === D) return IDX
  FOR = D
  // her weekly lists: a word on two lists ("domestic", W3 and W6) is one word on both
  const entries = {}, partOf = {}
  for (const wk of Object.keys(D.precision || {})) for (const e of D.precision[wk].words || []) {
    const key = String(e.word).toLowerCase().trim()
    if (!entries[key]) entries[key] = { entry: e, lists: [] }
    if (!entries[key].lists.includes(wk)) entries[key].lists.push(wk)
    partOf[key] = key
  }
  for (const key of Object.keys(entries)) for (const p of key.split("/").map((x) => x.trim()).filter(Boolean)) if (!partOf[p]) partOf[p] = key
  const listWordIn = (t) => [t, ...plainForms(t)].find((c) => partOf[c])
  const raw = []
  const add = (surface, ref) => {
    const s = String(surface || "").toLowerCase().replace(/\s+/g, " ").trim()
    if (/[a-z]/.test(s)) raw.push([s, ref])
  }
  const pools = [["vr", D.subjects.vr || [], "set"], ["rc", D.subjects.rc || [], "set"]]
  for (const form of Object.keys(D.mockItems || {})) {
    pools.push(["vr", (D.mockItems[form] || {}).VR || [], "mock", form], ["rc", (D.mockItems[form] || {}).RC || [], "mock", form])
  }
  for (const [sub, items, src, form] of pools) {
    items.forEach((it, i) => {
      const q = it.q || "", ref = (role, letter) => ({ id: it.id, role, sub, src, form, n: i + 1, it, letter })
      if (sub === "vr") {
        const m = SYN.exec(q) || CTX.exec(q)
        if (m) add(m[1], ref("asked"))
        else if (BLANK.test(q) && (it.c || []).some((c) => String(c).trim().split(/\s+/).length >= 3)) {
          // a phrase completion: the choices are what happened next, and the word is in the
          // sentence — the one its author named (`vw`), and any word on her lists
          if (it.vw) add(it.vw, ref("asked"))
          for (const t of q.toLowerCase().match(/[a-z][a-z'’-]*/g) || []) { const w = listWordIn(t); if (w) add(w, ref("asked")) }
        } else if (BLANK.test(q)) { const k = keyOf(it); (it.c || []).forEach((c, j) => add(c, ref(LTR[j] === k ? "asked" : "choice", LTR[j]))) }
      } else if (it.sk === "Vocabulary in context" || RC_ASKS.test(q)) {
        const m = RC_WORD.exec(q), w = m && (m[1] || m[2])
        if (w && w.trim().split(/\s+/).length <= 3) add(w.replace(/[.,;:!?]+$/, ""), ref("asked"))
      }
    })
  }
  const surfaces = new Set(raw.map(([s]) => s))
  const lemma = (s) => {
    if (partOf[s]) return partOf[s]
    for (const c of plainForms(s)) if (partOf[c] || surfaces.has(c)) return partOf[c] || c
    return s
  }
  const by = new Map()
  const get = (key) => {
    if (!by.has(key)) {
      const en = entries[key]
      by.set(key, { key, word: en ? en.entry.word : key, entry: en ? en.entry : null, lists: en ? en.lists : [], refs: [] })
    }
    return by.get(key)
  }
  for (const key of Object.keys(entries)) get(key).refs.push({ id: "w:" + entries[key].entry.word, role: "quiz", sub: "vr", src: "word" })
  for (const [s, ref] of raw) {
    const v = get(lemma(s))
    if (!v.refs.some((r) => r.id === ref.id)) v.refs.push(ref)
  }
  const list = [...by.values()].sort((a, b) => a.key.localeCompare(b.key))
  IDX = { list, by }
  return IDX
}
/** A word by name, as typed: its own form, or the form it folds onto. */
export function vocabWord(name) {
  const { by } = vocabIndex(), s = String(name || "").toLowerCase().trim()
  if (by.has(s)) return by.get(s)
  for (const c of plainForms(s)) if (by.has(c)) return by.get(c)
  for (const v of by.values()) if (v.key.includes("/") && v.key.split("/").map((x) => x.trim()).includes(s)) return v
  return null
}

const ts = (a) => (typeof a === "number" ? a : Date.parse(a) || 0)
/** The answers that count, on one question: given to it, and in a context that is evidence. */
function evidence(id) { return ((rec(id) || {}).hist || []).filter((h) => h && LEARN_CTX[h.ctx] && !h.via) }

/** One question's part in a word: answered how often, how, and — for a wrong choice — how
 *  often she chose this word. */
export function refResult(ref) {
  const hs = evidence(ref.id)
  if (ref.role === "choice") return { seen: hs.length, chose: hs.filter((h) => !h.ok && h.pick === ref.letter).length }
  const right = hs.filter((h) => h.ok).length
  return { done: hs.length, right, wrong: hs.length - right, last: hs.length ? hs[hs.length - 1] : null }
}
/** A word's whole record: how many questions test it, and her answers on them. */
export function wordResult(v) {
  const out = { tests: 0, choices: 0, done: 0, right: 0, wrong: 0, chose: 0, last: null }
  for (const r of v.refs) {
    const x = refResult(r)
    if (r.role === "choice") { out.choices++; out.chose += x.chose; continue }
    out.tests++; out.done += x.done; out.right += x.right; out.wrong += x.wrong
    if (x.last && (!out.last || ts(x.last.at) > ts(out.last.at))) out.last = x.last
  }
  return out
}
/** What a word means, as far as the site says: its list entry, or the answer of the first
 *  synonym question that asks it. */
export function meaningOf(v) {
  if (v.entry) return v.entry.meaning || ""
  const syn = v.refs.find((r) => r.role === "asked" && r.sub === "vr" && r.it && (SYN.test(r.it.q) || CTX.test(r.it.q)))
  if (!syn) return ""
  const k = LTR.indexOf(keyOf(syn.it))
  return k >= 0 ? syn.it.c[k] : ""
}
