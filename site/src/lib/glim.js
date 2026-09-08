/* A cat, generated from its word.
 *
 * There are 160 precision words and there will never be 160 hand-drawn cats, so
 * every cat is derived: the word is hashed, and the hash decides the coat, the
 * markings, the eyes, the set of the tail — and the call. Look and voice come
 * out of the same seed on purpose. `benign` is always the same cat, on every
 * device, forever, and it always answers in the same two notes. That is the
 * whole point: after a fortnight she does not recognise "a cat", she recognises
 * *that* one, and recognising it is recognising the word.
 *
 * Nothing here is a file. The coat is `hsl()` and the call is two oscillators,
 * which is what keeps the single-file artifact at zero external requests.
 *
 * Deliberately NOT here: rarity, duplicates, shininess, anything a cat could be
 * traded for. A cat is a word she knows, so its only currency is knowing it. */

/** FNV-1a, salted per field so two traits of the same cat are not correlated. */
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** 24 hues, a step apart, rather than 360. Two cats fifteen degrees apart are
 *  two cats; two cats two degrees apart are one cat drawn twice. */
const HUE_STEPS = 24
export const MARKINGS = ["plain", "tabby", "patch", "spots", "bib"]
const EYES = ["#f5c04a", "#5fd08a", "#5fb8e8", "#c98af0"]

/* Major pentatonic. Every cat's call is built from it, so two cats calling over
 * each other are still in tune — which matters, because a run of five gates is
 * five calls in a row and a wrong note in a game about being right is cruel. */
const PENT = [0, 2, 4, 7, 9]
const REGISTERS = [-12, -5, 0, 7]
/** Degree `d` of the pentatonic, continuing up into the next octave. */
const semis = (d) => PENT[d % 5] + 12 * Math.floor(d / 5)

/** Everything about one cat. Pure: the same word gives the same cat, always. */
export function traits(word) {
  const w = String(word || "").toLowerCase().trim()
  const h = (salt) => hash(salt + ":" + w)
  const hue = (h("coat") % HUE_STEPS) * (360 / HUE_STEPS)
  const root = REGISTERS[h("register") % REGISTERS.length]
  const low = h("call") % 5
  // always rising: a cat answering is "mrrp?", not a sigh
  const high = low + 2 + (h("leap") % 2)
  return {
    word: w,
    hue,
    coat: `hsl(${hue} 58% 60%)`,
    mark: `hsl(${(hue + 16) % 360} 60% 38%)`,
    nose: `hsl(${(hue + 340) % 360} 55% 74%)`,
    eye: EYES[h("eye") % EYES.length],
    marking: MARKINGS[h("marking") % MARKINGS.length],
    tail: h("tail") % 2 ? 1 : -1,
    tilt: (h("tilt") % 9) - 4,
    call: [root + semis(low), root + semis(high)],
  }
}

/** The call as frequencies, in hertz, off C5. */
export function callHz(word) {
  return traits(word).call.map((s) => 523.25 * Math.pow(2, s / 12))
}

/** Engine word status → the six brightnesses in docs/world.md. A word she has
 *  never opened is a cat that has not shown itself; a word she owns is Radiant.
 *  `brushup` is a cat she knows whose light has dimmed a little, not a failure. */
export const WORD_GLOW = {
  new: "Unseen",
  learning: "Glimpsed",
  due: "Flickering",
  brushup: "Steady",
  known: "Radiant",
}
