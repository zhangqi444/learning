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
import { D } from "./content"
import { Store } from "./store"
import { masteryOf } from "./engine"
import { finishedBooks, readingDays } from "./books"

/** Fixed, published prices. No randomness anywhere: she can see what a room
 *  costs from across the room, and it is the same price for everyone forever. */
export const ROOMS = [
  { id: "word-lab", name: "Word Lab", cost: 60, blurb: "Where the vocabulary lives", lit: () => subjectLight("vr") },
  { id: "reading-den", name: "Reading Den", cost: 120, blurb: "Armchairs and passages", lit: () => subjectLight("rc") },
  { id: "number-works", name: "Number Works", cost: 200, blurb: "Reasoning without a calculator", lit: () => subjectLight("qr") },
  { id: "math-shop", name: "Math Shop", cost: 260, blurb: "Arithmetic, shapes and data", lit: () => subjectLight("ma") },
  { id: "writing-studio", name: "Writing Studio", cost: 340, blurb: "One desk, one lamp, eight essays", lit: () => essayLight() },
  { id: "library", name: "Library", cost: 420, blurb: "The books she has actually finished", lit: () => libraryLight() },
  { id: "rehearsal-hall", name: "Rehearsal Hall", cost: 560, blurb: "Where the mocks are sat", lit: () => mockLight() },
]
const BY_ID = Object.fromEntries(ROOMS.map((r) => [r.id, r]))

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
  return ROOMS.map((r) => {
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
    .filter((s) => s && BY_ID[s.item])
}
/** Which rooms exist. Derived, so two devices can never disagree about it. */
export function built() { return new Set(spends().map((s) => s.item)) }
export function spentOnBase() { return spends().reduce((n, s) => n + (BY_ID[s.item] ? BY_ID[s.item].cost : 0), 0) }

const newId = () => Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)

/** Buy a room. Append-only: the same room is never bought twice, and nothing
 *  here can remove one. Returns false when it is unaffordable or already built. */
export function buildRoom(id, balance) {
  const room = BY_ID[id]
  if (!room || built().has(id) || balance < room.cost) return false
  Store.setSlice("base", "spend:" + newId(), () => ({ item: id, cost: room.cost, at: new Date().toISOString() }))
  return true
}

/** The next room she could buy, for the nudge on the Base page. */
export function nextRoom(balance) {
  const open = rooms().filter((r) => !r.built)
  return open.find((r) => r.cost <= balance) || open[0] || null
}
export function baseCounts() { const all = rooms(); return { built: all.filter((r) => r.built).length, total: all.length } }
