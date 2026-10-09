/* The word bank. The owner, 6 October 2026: "you need to build vocabulary. each words i
 * need to how its covered by questions. and also you need to track the result, so we know
 * to each words how well we covered, if covered, done how many times, right/wrong".
 *
 * Which questions cover which word is lib/wordindex.js; this file counts her answers on them.
 *
 * Her results come from the record the review runs on, counted by lib/tally.js — the same
 * counting the skill pages use, so a word and a skill can never disagree about an answer. A
 * corrections pass re-asks a question whose answer she has just been shown, and an answer
 * written onto a question by the stand-in that asked in its place (`via`) was given to a
 * different question, with different words in it — neither is counted. */
import { D, LTR, keyOf } from "@/lib/content"
import { wordStatus } from "@/lib/engine"
import { Store } from "@/lib/store"
import { answersOn, questionResult, tally } from "@/lib/tally"
import { CTX, SYN, vocabIndex, vocabWord } from "@/lib/wordindex"

export { vocabIndex, vocabWord }
export const vocabPath = (w) => `/vocab/${encodeURIComponent(w)}`

/** One question's part in a word: her answers on it (`questionResult`) — and, for a wrong
 *  choice, how often she answered the question and how often she chose this word. */
export function refResult(ref) {
  if (ref.role === "choice") {
    const hs = answersOn(ref.id)
    return { seen: hs.length, chose: hs.filter((h) => !h.ok && h.pick === ref.letter).length }
  }
  return questionResult(ref.id)
}
/** A word's whole record: the questions that test it, tallied as a skill's are (`questions`,
 *  `tried`, `done`, `right`, `wrong`, `last`; `tests` is `questions` under its older name), and
 *  the completions that offer it as a wrong answer, with how often she chose it there. */
export function wordResult(v) {
  const t = tally(v.refs.filter((r) => r.role !== "choice").map((r) => r.id))
  const out = { ...t, tests: t.questions, choices: 0, chose: 0 }
  for (const r of v.refs) if (r.role === "choice") { out.choices++; out.chose += refResult(r).chose }
  return out
}

/** The ways the word bank can be narrowed, in the order its buttons show them. "Tested" first:
 *  a word that is only ever a wrong answer ("above", "absorbs") is in a question without being
 *  taught by it, and 537 of them ahead of the real list buried it. `r` is `wordResult(v)`.
 *
 *  `tested` is also the SCOPE — the vocabulary this page is accountable for. A word is in it when
 *  the plan teaches it (on a weekly list, so the word quiz asks it) or a question examines it: a
 *  synonym stem, a reading question asking what a word means, or the right answer to a sentence
 *  completion, which she cannot choose without knowing it. Everything else is a foil, and
 *  `inScope` is what the page counts against. See the note on `foilsNote` for why. */
export const inScope = (v, r) => r.tests > 0
export const WORD_SHOWS = [
  { id: "tested", label: "Tested", keep: inScope },
  { id: "lists", label: "On her lists", keep: (v) => v.lists.length > 0 },
  { id: "untaught", label: "Tested, not on a list", keep: (v, r) => r.tests > 0 && v.lists.length === 0 },
  { id: "missed", label: "Missed", keep: (v, r) => r.wrong > 0 || r.chose > 0 },
  { id: "untried", label: "Not tried yet", keep: (v, r) => r.tests > 0 && r.done === 0 },
  { id: "choice", label: "Only a wrong answer", keep: (v, r) => r.tests === 0 },
  { id: "all", label: "All", keep: () => true },
]
const wordShow = (id) => WORD_SHOWS.find((s) => s.id === id).keep

/** Her own explanation of a list word, from the precision page of any list it is on. */
export function ownWords(v) {
  if (!v || !v.entry) return null
  const mine = v.lists.map((w) => (((Store.s.precision || {})[w] || {}).words || {})[v.entry.word])
  return mine.find((x) => x && x.text && String(x.text).trim()) || null
}

/** How her words stand, for the Score page. The words on her lists by how far along each is —
 *  explained in her own words, its quiz answered right the last time it was asked, known (the
 *  precision page's own rule, `wordStatus`) — and the words the questions test, by her answers on
 *  them. Each count is made by the word bank's own rules (WORD_SHOWS), so it is the number on the
 *  button that lists those words; the answers are tallied once per question, so a question that
 *  tests two words is not counted twice. */
export function vocabStanding() {
  const rows = vocabIndex().list.map((v) => ({ v, r: wordResult(v) }))
  const lists = rows.filter(({ v, r }) => wordShow("lists")(v, r))
  const tested = rows.filter(({ v, r }) => wordShow("tested")(v, r))
  const quizRight = (v) => { const q = questionResult("w:" + v.entry.word); return !!(q.last && q.last.ok) }
  return {
    lists: {
      words: lists.length,
      explained: lists.filter(({ v }) => ownWords(v)).length,
      quizRight: lists.filter(({ v }) => quizRight(v)).length,
      known: lists.filter(({ v }) => wordStatus(v.entry.word).status === "known").length,
    },
    tested: {
      ...tally(tested.flatMap(({ v }) => v.refs.filter((x) => x.role !== "choice").map((x) => x.id))),
      words: tested.length,
      answered: tested.filter(({ r }) => r.done > 0).length,
    },
    missed: rows.filter(({ v, r }) => wordShow("missed")(v, r)).length,
  }
}
/** What a word means, as far as the site says: its list entry, the answer of the first synonym
 *  question that asks it, or `content/glossary.json`.
 *
 *  The glossary exists because 210 of the 530 words this page is accountable for had no meaning
 *  anywhere. A word that is only ever the right answer to a sentence completion is examined
 *  without being defined — "abolish", "acclaim", "meager" — so the page listed the word, said
 *  nothing about it, and left the one row she might have learned from blank. The plan weeks are
 *  the other way to fix that, and they only reach the weeks still ahead of her; a meaning reaches
 *  her the moment she meets the word, whichever week it came from. */
export function meaningOf(v) {
  if (v.entry) return v.entry.meaning || ""
  const syn = v.refs.find((r) => r.role === "asked" && r.sub === "vr" && r.it && (SYN.test(r.it.q) || CTX.test(r.it.q)))
  if (syn) { const k = LTR.indexOf(keyOf(syn.it)); if (k >= 0) return syn.it.c[k] }
  const g = (D.glossary || {})[v.key]
  return g ? g.meaning || "" : ""
}
/** Part of speech, where the site knows it: a list entry's, or the glossary's. */
export function posOf(v) {
  if (v.entry) return v.entry.pos || ""
  const g = (D.glossary || {})[v.key]
  return g ? g.pos || "" : ""
}
