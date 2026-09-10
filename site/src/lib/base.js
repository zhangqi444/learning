/* The Base — rooms bought with Sparks.
 *
 * Two rules hold this together, and both are structural rather than a matter of
 * remembering to be careful.
 *
 * 1. HONEST NUMBERS (hard rule 4). A room's light level is NEVER stored. It is
 *    read live from the same engine the score page reads, so the game cannot
 *    drift from the truth, cannot be edited, and cannot survive work being
 *    undone. A room with no evidence behind it reports null, and the UI says
 *    "—", not 0%.
 * 2. NOTHING IS LOST (hard rules 1 and 3). The slice is an append-only ledger of
 *    purchases. Which rooms exist is derived from it; the balance is derived
 *    from it. There is no mutable "owned rooms" list to disagree with itself
 *    across two devices, and nothing built can ever be taken away — the last
 *    thing a child should meet is a game that repossesses her work.
 */
import { D, ORDER } from "./content"
import { Store } from "./store"
import { allWordEntries, masteryOf, skillsFor, wordStatus } from "./engine"
import { finishedBooks, readingDays } from "./books"

/* Fixed, published prices. No randomness anywhere: she can see what a thing
 * costs from across the room, and it is the same price for everyone forever.
 *
 * These were seven abstract rooms — Word Lab, Number Works, Rehearsal Hall —
 * and Sheila said plainly that she did not understand why she was building
 * them, and asked whether they could be things a cat needs instead. She is
 * right: "Number Works" is a filing cabinet with a name, and nobody builds a
 * filing cabinet for a cat. They are the same seven things underneath, lit by
 * exactly the same seven real numbers; only what they ARE has changed.
 *
 * THE IDS MUST NOT CHANGE. The ledger in Store.s.base records what was bought
 * by id, and an id this file no longer knows is silently dropped — which would
 * un-build something she has already paid for and break hard rule 1. Rename
 * freely; renumber never. */
const COSTS = [
  ["word-lab", 60, () => subjectLight("vr")],
  ["reading-den", 120, () => subjectLight("rc")],
  ["number-works", 200, () => subjectLight("qr")],
  ["math-shop", 260, () => subjectLight("ma")],
  ["writing-studio", 340, () => essayLight()],
  ["library", 420, () => libraryLight()],
  ["rehearsal-hall", 560, () => mockLight()],
]
/* Price and light are structural and live here. The name, the guidance and the
 * question come from content/catcare.json, so advice about a real animal sits
 * with the rest of the content and carries its source — never hard-coded here
 * and never made up (see Content rules).
 *
 * Read lazily, not at import: `D` is the bundle and it is not set until
 * setBundle() runs, so anything computed at module load would see null. */
const care = (id) => (((D && D.catcare) || {}).items || {})[id] || {}
/** Real cats, and what actually helps them — the advocacy half of the Den. Same
 *  rule as the care guidance: every line carries a named source, none of it is
 *  invented, and nothing here asks anybody for money. */
export function catHelp() { return ((D && D.catcare) || {}).help || null }
export const PRICES = Object.fromEntries(COSTS.map(([id, cost]) => [id, cost]))
export function roomList() {
  return COSTS.map(([id, cost, lit]) => {
    const c = care(id)
    return { id, cost, lit, name: c.thing || id, need: c.need || "", check: c.check || null, source: c.source || null }
  })
}

/* ---------- light: derived live, never stored ----------
 * Each returns 0..1, or null for "no data yet" so the UI can say "—". */

function subjectLight(sub) {
  const m = masteryOf(sub)
  // `score` is the skill-weighted mastery the score page already reports, 0..1.
  // No practice means no evidence, which is "—" rather than a dark room she has
  // done nothing wrong to deserve.
  if (!m || !m.practiced || m.score == null) return null
  return Math.max(0, Math.min(1, m.score))
}
function essayLight() {
  const done = Object.values(Store.s.essays || {}).filter((e) => e && e.completedAt).length
  return done ? Math.min(1, done / D.weeks.length) : null
}
function libraryLight() {
  const books = finishedBooks().length, days = readingDays().size
  if (!books && !days) return null
  // six books is the top reading badge; reading days carry it before any book lands
  return Math.min(1, (books / 6) * 0.7 + Math.min(1, days / 30) * 0.3)
}
function mockLight() {
  const forms = Object.values(Store.s.mocks || {})
  const sat = forms.filter((m) => m && m.sections && Object.values(m.sections).some((s) => s && s.submittedAt)).length
  return sat ? Math.min(1, sat / 4) : null
}

/** Every room with its live state. `light` is null when there is no evidence. */
export function rooms() {
  const owned = built()
  return roomList().map((r) => {
    let light = null
    try { light = r.lit() } catch { light = null }
    return { ...r, built: owned.has(r.id), light }
  })
}

/* ---------- the ledger ---------- */
const rows = () => Store.s.base || {}
export function spends() {
  return Object.keys(rows())
    .filter((k) => k.startsWith("spend:"))
    .map((k) => ({ key: k, ...rows()[k] }))
    // an id this file no longer knows is dropped, which is why the ids in COSTS
    // are permanent: renaming a thing is free, re-keying one un-builds it
    .filter((s) => s && PRICES[s.item] != null)
}
/** Which rooms exist. Derived, so two devices can never disagree about it. */
export function built() { return new Set(spends().map((s) => s.item)) }
export function spentOnBase() { return spends().reduce((n, s) => n + (PRICES[s.item] || 0), 0) }

const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)

/** Buy a room. Append-only: the same room is never bought twice, and nothing
 *  here can remove one. Returns false when it is unaffordable or already built. */
export function buildRoom(id, balance) {
  const cost = PRICES[id]
  if (cost == null || built().has(id) || balance < cost) return false
  Store.setSlice("base", "spend:" + newId(), () => ({ item: id, cost, at: new Date().toISOString() }))
  return true
}

/** The next room she could buy, for the nudge on the Base page. */
export function nextRoom(balance) {
  const open = rooms().filter((r) => !r.built)
  return open.find((r) => r.cost <= balance) || open[0] || null
}
export function baseCounts() { const all = rooms(); return { built: all.filter((r) => r.built).length, total: all.length } }

/* ---------- collections ----------
 * Nothing here is stored either, and nothing here is bought. A card exists
 * because she genuinely knows the word; a crest exists because the skill is
 * genuinely Mastered. That makes the collection an honest readout rather than
 * a shop, and it is why there are no duplicates, no rarities and no trading:
 * scarcity would turn knowing a word into a lottery ticket. */
export function wordCards() {
  return allWordEntries()
    .map((e) => ({ word: e.word, meaning: e.meaning, status: wordStatus(e.word).status }))
    .sort((a, b) => a.word.localeCompare(b.word))
}
/** Every skill she has actually practised, with the level the engine reports.
 *  Not only the finished ones: a skill halfway there is a cat halfway into the
 *  light, and seeing it is the reason to go back to it. The Mastered count is
 *  still counted separately — being drawn is not the same as being earned. */
export function skillCrests() {
  const out = []
  for (const sub of ORDER) {
    for (const L of skillsFor(sub)) if (L && L.attempted) out.push({ sub, sk: L.sk, acc: L.acc, level: L.level })
  }
  return out
}
export function collectionCounts() {
  const cards = wordCards()
  return {
    words: cards.filter((c) => c.status === "known").length,
    wordsTotal: cards.length,
    crests: skillCrests().filter((c) => c.level === "Mastered").length,
  }
}
