/* A cat, generated from its word.
 *
 * There are 115 distinct precision words and there will never be 115 hand-drawn
 * cats, so every cat is derived: the word is hashed, and the hash decides the
 * coat, the build, the markings, the eyes — and the call. Look and voice come
 * out of the same seed on purpose. `benign` is always the same cat, on every
 * device, forever, and it always answers in the same two notes. After a
 * fortnight she does not recognise "a cat", she recognises *that* one, and
 * recognising it is recognising the word.
 *
 * The coats are REAL CATS, not hues. The first version picked a hue off a
 * 24-step wheel, which gave plenty of variety and produced lilac and mint-green
 * cats that exist nowhere. These are the coats you actually meet: brown and
 * ginger and silver tabbies, a golden-shaded British shorthair (Sheila's uncle
 * has one), a seal point (the very large, very relaxed cat in the photograph she
 * sent), tuxedo, black, blue, cream, calico, tortoiseshell, white. Variety comes
 * from combining coat with build, white socks, a bib and the eyes instead — so
 * there are still hundreds of cats and every one of them is a cat you could
 * meet.
 *
 * Nothing here is a file. The coats are hex and the call is two oscillators,
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

/* `pattern` is how the coat is drawn; `dark` marks coats that need a light rim
 * so the cat does not vanish into a dark background. Eye colours are the ones
 * that really go with that coat — a seal point has blue eyes, a silver tabby
 * green — because a cat with the wrong eyes stops looking like a real cat. */
export const COATS = [
  { id: "brown-tabby", base: "#a97d4e", mark: "#6d4a2b", belly: "#e2c99e", nose: "#cf8d84", pattern: "tabby", eyes: ["#7cc26a", "#e0a23c"] },
  { id: "ginger-tabby", base: "#e2894a", mark: "#b8592a", belly: "#f7d8ae", nose: "#e39a92", pattern: "tabby", eyes: ["#e0a23c", "#7cc26a"] },
  { id: "silver-tabby", base: "#b5bcc3", mark: "#7b848d", belly: "#e8ebee", nose: "#d99a92", pattern: "tabby", eyes: ["#7cc26a"] },
  // Sheila's uncle's cat
  { id: "golden-shaded", base: "#e6bd77", mark: "#bb8b3f", belly: "#f9ecc9", nose: "#cf8d84", pattern: "shaded", eyes: ["#7cc26a"] },
  { id: "tuxedo", base: "#33343c", mark: "#212229", belly: "#ffffff", nose: "#4f4f58", pattern: "tuxedo", dark: true, eyes: ["#e0a23c"] },
  { id: "black", base: "#3a3b43", mark: "#26272e", belly: "#484951", nose: "#4f4f58", pattern: "solid", dark: true, eyes: ["#e0a23c", "#cf7a2e"] },
  { id: "blue", base: "#8f99a8", mark: "#6e7787", belly: "#bcc4cf", nose: "#b98d8d", pattern: "solid", eyes: ["#e0a23c", "#7cc26a"] },
  { id: "cream", base: "#f0dcc0", mark: "#d6b992", belly: "#fdf4e6", nose: "#e6a79e", pattern: "solid", eyes: ["#e0a23c", "#6bb7e8"] },
  // the cat in the photograph she sent
  { id: "seal-point", base: "#efe3d2", mark: "#4c3d39", belly: "#fbf4ea", nose: "#5e4b46", pattern: "point", eyes: ["#6bb7e8"] },
  { id: "calico", base: "#f7f3ec", mark: "#33343c", patch: "#e2894a", belly: "#ffffff", nose: "#e6a79e", pattern: "patched", eyes: ["#e0a23c"] },
  { id: "tortoiseshell", base: "#3a3b43", mark: "#26272e", patch: "#d2762f", belly: "#4a4b54", nose: "#4f4f58", pattern: "patched", dark: true, eyes: ["#e0a23c"] },
  { id: "white", base: "#f8f6f2", mark: "#ded8ce", belly: "#ffffff", nose: "#eba8a0", pattern: "solid", eyes: ["#6bb7e8", "#7cc26a"] },
]

/** Shorthair round, longhair fluffy, oriental lean. Changes the silhouette, not
 *  the colours, so a build and a coat combine into a cat you could point at. */
export const BUILDS = ["short", "long", "slim"]

/* Major pentatonic. Every cat's call is built from it, so two cats calling over
 * each other are still in tune — which matters, because a run of five gates is
 * five calls in a row and a wrong note in a game about being right is cruel. */
const PENT = [0, 2, 4, 7, 9]
/* Registers are OCTAVES, not arbitrary transpositions. A register of, say, -5
 * would move a cat's whole scale off the shared one, and two cats a semitone
 * apart is exactly the sour interval this scale was chosen to make impossible.
 * Three octaves × five starting degrees × two leaps is thirty distinct calls,
 * all of them members of the same pentatonic set. */
const REGISTERS = [-12, 0, 12]
/** Degree `d` of the pentatonic, continuing up into the next octave. */
const semis = (d) => PENT[d % 5] + 12 * Math.floor(d / 5)

/** Everything about one cat. Pure: the same word gives the same cat, always. */
export function traits(word) {
  const w = String(word || "").toLowerCase().trim()
  const h = (salt) => hash(salt + ":" + w)
  const coat = COATS[h("coat") % COATS.length]
  const build = BUILDS[h("build") % BUILDS.length]
  const root = REGISTERS[h("register") % REGISTERS.length]
  const low = h("call") % 5
  // always rising: a cat answering is "mrrp?", not a sigh
  const high = low + 2 + (h("leap") % 2)
  return {
    word: w,
    coat,
    build,
    // a white bib and white socks are common and make two cats of one coat
    // obviously different cats. A tuxedo already has both; a white cat cannot.
    bib: coat.pattern !== "tuxedo" && coat.id !== "white" && h("bib") % 3 === 0,
    socks: coat.pattern !== "tuxedo" && coat.id !== "white" && h("socks") % 3 === 0,
    eye: coat.eyes[h("eye") % coat.eyes.length],
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
