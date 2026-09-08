/* The world's vocabulary, in one place.
 *
 * docs/world.md decides what things are called; this file is the only place the
 * app says them. Sheila has been asked to name the world, the cats and her home,
 * and several of these are explicitly placeholders until she does — so when she
 * answers, renaming the whole site is editing this object, not sweeping thirty
 * files for a string.
 *
 * Rule: no component writes a world noun as a literal. If a word belongs to the
 * fiction, it belongs here. */
export const W = {
  // placeholders — Sheila's to replace
  world: "Wildlight",
  cat: "Glim",
  cats: "Glims",
  home: "the Hearth",
  homeTitle: "Hearth",
  currency: "Hum",

  // settled
  role: "Lampwright",
  book: "Glimbook",
  wood: "the Wordwood",
  woodTitle: "Wordwood",
  longNight: "Long Night",
  telling: "the Telling",
  beacon: "the Beacon",
  reach: "Reach",

  // the six brightnesses, in the order skillLevel() reports them. Index by the
  // engine's own level name so the two can never drift apart.
  glow: {
    "Not started": "Unseen",
    Started: "Glimpsed",
    "Needs work": "Flickering",
    Familiar: "Steady",
    Proficient: "Bright",
    Mastered: "Radiant",
  },
}

/** "3 Glims" / "1 Glim" — the plural is a fiction word, so it lives here too. */
export const nCats = (n) => `${n} ${n === 1 ? W.cat : W.cats}`
