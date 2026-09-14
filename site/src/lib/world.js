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
  // The other three places. Only the Wordwood has a mechanic of its own, and
  // that is settled (AGENTS.md § The game, "Why the numbers are not a game
  // yet"); these three name where the work happens and do nothing else. Naming
  // a place is not giving it a game — it was the absence of the names that made
  // the site read as four subjects beside a world rather than one world.
  deepShelf: "the Deep Shelf",
  weighbridge: "the Weighbridge",
  workyard: "the Workyard",
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

/** Where a subject happens. Keyed by the same ids `SUBJ` uses, so the two cannot
 *  drift; a subject with no place named here simply has none, and the page says
 *  nothing rather than inventing one. */
export const PLACE = {
  vr: W.wood,
  rc: W.deepShelf,
  qr: W.weighbridge,
  ma: W.workyard,
}
