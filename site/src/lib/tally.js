/* Her answers, counted one way. The word bank (lib/vocab.js, pages/vocab.jsx) and the skill
 * pages (pages/skill.jsx, the skills card in pages/subject.jsx) all count from here. The owner,
 * 6 October 2026: "to the skills, should follow the vocabulary list, to see more statistic
 * data? or can you make the two features more consistent". They had each counted for
 * themselves: the word page added up her evidence, and the skill page read the last line of a
 * question's history, corrections and stand-in answers included, so one answer could be "right
 * last time" on a skill and not counted at all on the word it tests. One function each now.
 *
 * An answer counts when it was given to this question, in a context that is evidence
 * (LEARN_CTX: a set, a review, a mixed set, a mock, the word quiz or the Wordwood, Try another).
 * Two kinds of entry in her record are left out:
 *  - a corrections pass (`corr`): she had just been shown the key, so it proves nothing;
 *  - an answer a review stand-in wrote onto the question it stood in for (`via`): it was given
 *    to a different question, with different words in it, and is counted there, on the question
 *    she actually answered. Counting it on both would count one answer twice within a skill.
 * The mastery ladder (`skillLevel` in lib/engine.js) reads the same record for a different
 * question — where each question stands now — and is not counted here. */
import { LEARN_CTX, rec } from "@/lib/engine"
import { ts } from "@/lib/store"

/** The answers that count on one question, oldest first. */
export function answersOn(id) {
  return ((rec(id) || {}).hist || []).filter((h) => h && LEARN_CTX[h.ctx] && !h.via)
}

/** One question: how many answers she gave it, how many were right and wrong, the latest, and
 *  how many of the right ones she marked as a guess (counted right, and not taken for knowing). */
export function questionResult(id) {
  const hs = answersOn(id)
  const right = hs.filter((h) => h.ok).length
  return { done: hs.length, right, wrong: hs.length - right, guessed: hs.filter((h) => h.ok && h.guess).length, last: hs.length ? hs[hs.length - 1] : null }
}

/** Questions taken together — a skill, a part of one, the questions that test a word. Each id is
 *  counted once however often it is passed. `tried`: questions with an answer; `missed`: questions
 *  with a wrong one; `last`: the latest answer on any of them. */
export function tally(ids) {
  const out = { questions: 0, tried: 0, missed: 0, done: 0, right: 0, wrong: 0, guessed: 0, last: null }
  for (const id of new Set(ids)) {
    const x = questionResult(id)
    out.questions++
    if (x.done) out.tried++
    if (x.wrong) out.missed++
    out.done += x.done; out.right += x.right; out.wrong += x.wrong; out.guessed += x.guessed
    if (x.last && (!out.last || ts(x.last.at) > ts(out.last.at))) out.last = x.last
  }
  return out
}

/** The ways a skill's questions can be narrowed, by her answers on each (`questionResult`). */
export const QUESTION_SHOWS = [
  { id: "all", label: "All", keep: () => true },
  { id: "tried", label: "Tried", keep: (x) => x.done > 0 },
  { id: "missed", label: "Missed", keep: (x) => x.wrong > 0 },
  { id: "guessed", label: "Guessed", keep: (x) => x.guessed > 0 },
  { id: "untried", label: "Not tried yet", keep: (x) => x.done === 0 },
]
/** And a subject's skills, by her answers on each skill's questions (`tally`) — the word bank's
 *  Tested · Missed · Not tried yet · All, said of skills. */
export const SKILL_SHOWS = [
  { id: "practiced", label: "Practiced", keep: (t) => t.tried > 0 },
  { id: "missed", label: "Missed", keep: (t) => t.wrong > 0 },
  { id: "untried", label: "Not tried yet", keep: (t) => t.tried === 0 },
  { id: "all", label: "All skills", keep: () => true },
]
