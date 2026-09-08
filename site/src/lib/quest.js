/* Wordkeep — the vocabulary content AS the game mechanic.
 *
 * The point of CodeCombat is not that a game sits around the lesson. It is that
 * the thing you are learning IS the control language: you write code, the code
 * runs, the world visibly does what you actually said. Wrong code is not "wrong
 * answer, try again" — it is a hero walking into a pit, which teaches you what
 * the instruction really meant.
 *
 * A four-choice question cannot do that. Picking A can gate an action but it
 * cannot BE one, which is why wrapping quiz items in combat (Prodigy's model)
 * leaves the maths a toll booth between the fun parts.
 *
 * Vocabulary can do it. A word with a part of speech and a meaning is a typed
 * function: `benign` does something specific to whatever it is aimed at. So her
 * words are spells, the gate's inscription is a sentence with the spell missing,
 * and casting the wrong word visibly does what THAT word means instead. She is
 * not eliminating three distractors; she is choosing from everything she knows.
 *
 * Every cast is recorded through the ordinary engine as a `vocab` attempt, so
 * this is not a side activity that happens to be fun — it is the same practice,
 * feeding the same mastery and the same review pile.
 */
import { D } from "./content"
import { recordAttempts } from "./engine"

/** Small deterministic PRNG. The day's gates are fixed, so reloading cannot
 *  reroll a hard one into an easy one. */
function rng(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function shuffle(arr, rand) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/** Every precision word, flattened. This is the spellbook. */
export function spells() {
  const out = []
  for (const wk of Object.keys(D.precision || {})) {
    for (const e of (D.precision[wk].words || [])) if (e && e.word) out.push({ ...e, wk })
  }
  return out
}

/** The example sentence with the word taken out — the gate's inscription.
 *  Entries like "imply / infer" hold two words; whichever one the sentence
 *  actually uses is the one the gate is about. Returns null when the sentence
 *  does not contain the word, so a broken entry is skipped rather than shown
 *  as an unanswerable gate. */
export function inscription(entry) {
  const ex = entry.example || ""
  for (const raw of String(entry.word).split("/").map((s) => s.trim()).filter(Boolean)) {
    // match inflections: "reminisce" catches "reminisced", "reminiscing"
    const stem = raw.length > 5 ? raw.slice(0, raw.length - 2) : raw
    const re = new RegExp("\\b" + stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*", "i")
    const m = ex.match(re)
    if (m) return { text: ex.replace(m[0], " _____ "), form: m[0], word: raw }
  }
  return null
}

const HAND = 6

const head = (w) => String(w).split("/")[0].trim()

/** One gate: an inscription, and a hand of spells to choose from. The decoys
 *  share a part of speech where possible, so it is a test of meaning rather
 *  than of grammar.
 *
 *  Two traps here, both found by playing it. Decoys have to be deduped by the
 *  word actually shown, or the same spell appears twice in one hand. And a
 *  cluster entry like "imply / infer" must show the side the SENTENCE uses:
 *  labelling that chip "imply" when the gate wants "infer" makes the gate
 *  unwinnable, which is the worst possible bug in a game about being right. */
function gate(entry, pool, rand) {
  const ins = inscription(entry)
  if (!ins) return null
  const answerWord = ins.word
  const taken = new Set([answerWord.toLowerCase()])
  const others = pool.filter((s) => s.word !== entry.word)
  const ranked = [
    ...shuffle(others.filter((s) => s.pos === entry.pos), rand),
    ...shuffle(others.filter((s) => s.pos !== entry.pos), rand),
  ]
  const decoys = []
  for (const s of ranked) {
    const w = head(s.word)
    if (taken.has(w.toLowerCase())) continue
    taken.add(w.toLowerCase())
    decoys.push({ word: w, meaning: s.meaning, pos: s.pos })
    if (decoys.length >= HAND - 1) break
  }
  const answerChip = { word: answerWord, meaning: entry.meaning, pos: entry.pos }
  return {
    id: "w:" + answerWord,
    word: answerWord,
    answer: entry,
    text: ins.text,
    hand: shuffle([answerChip, ...decoys], rand),
  }
}

/** A run of gates for a day. `weeks` limits it to the vocabulary she has met. */
export function buildRun(dayKeyStr, n = 5, weeks = null) {
  const pool = spells().filter((s) => !weeks || weeks.includes(s.wk))
  if (pool.length < HAND) return []
  const rand = rng("wordkeep:" + dayKeyStr)
  const order = shuffle(pool, rand)
  const out = []
  for (const e of order) {
    const g = gate(e, pool, rand)
    if (g) out.push(g)
    if (out.length >= n) break
  }
  return out
}

/** Cast a spell at a gate. Records the attempt as ordinary vocab practice —
 *  the same evidence a word quiz produces, feeding the same mastery and the
 *  same review pile, so playing IS practising. */
export function cast(g, chosenWord, ms) {
  const ok = chosenWord.toLowerCase() === g.word.toLowerCase()
  recordAttempts([{ id: g.id, ok, ms: Math.round(ms || 0), pick: null }], "vocab")
  const chosen = g.hand.find((h) => h.word === chosenWord)
  return { ok, chosen, meaning: chosen ? chosen.meaning : "", answer: g.answer }
}
