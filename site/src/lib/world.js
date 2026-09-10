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
  world: "Wildlight",
  cat: "Glim",
  cats: "Glims",
  // Sheila's note, verbatim: "very confused here why we have hearth. Can it be
  // something cat related? Can we build things the cat need?" — so it is a den
  // now, and what you build in it is what a cat actually needs.
  home: "the Den",
  homeTitle: "Den",
  currency: "Hum",
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

/** The same six, dimmest first, for anywhere that needs to compare them. */
export const GLOW_ORDER = ["Unseen", "Glimpsed", "Flickering", "Steady", "Bright", "Radiant"]

/** Never draw a cat that just came when called as barely-there. Being right is
 *  allowed to look like something, even the first time — the honest number is on
 *  the score page, and dimming a cat she just called correctly would read as the
 *  game arguing with her. */
export const atLeast = (stage, floor = "Steady") =>
  GLOW_ORDER.indexOf(stage) < GLOW_ORDER.indexOf(floor) ? floor : stage

/** "3 Glims" / "1 Glim" — the plural is a fiction word, so it lives here too. */
export const nCats = (n) => `${n} ${n === 1 ? W.cat : W.cats}`
