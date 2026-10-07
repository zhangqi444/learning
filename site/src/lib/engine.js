/* Learning engine: per-question records, spaced review, error tags, pacing,
 * skill mastery, mixed sets, vocabulary mastery, mock next steps, streaks and
 * the readiness score. Pure functions over Store.s + the bundle, except the
 * few writers at the top. Nothing here ever deletes a result. */
import { D, ORDER, SUBJ, LTR, keyOf, setId, setsFor, currentWeek, isZh, exItems } from "./content"
import { Store, ts } from "./store"
import { aopsFor, learnName } from "./aops"
import { W, atLeast } from "./world"
import { vocabWord } from "./wordindex"

/* ---------- constants ---------- */
/* The four reasons a question went wrong, and the one colour each of them wears.
 *
 * `dot` and `chip` live here beside the label because the reasons are shown in
 * three places now and they have to mean the same colour in all of them: the
 * stacked bar on the Review page, its legend, and the chips under a set's score
 * on the checklist. The bar had these hues written into it as a private literal;
 * a second copy in another file is how two pages come to disagree about what
 * blue means.
 *
 * They are the chart palette, which is four distinct hues and no red. That is
 * deliberate: these are KINDS of miss, not a ladder from bad to worse, and the
 * one that would attract red — "Didn't know it" — is the most blameless of the
 * four. Nobody has taught it to her yet. It wears the same indigo as the
 * lessons, because a lesson is exactly what it asks for. */
export const CAUSES = [
  { id: "know", label: "Didn't know it", hint: "The word or the method was new or forgotten", dot: "bg-chart-1", chip: "border-chart-1/30 bg-chart-1/12 text-chart-1" },
  { id: "misread", label: "Misread it", hint: "Skipped a word like NOT or EXCEPT, or a unit", dot: "bg-chart-2", chip: "border-chart-2/30 bg-chart-2/12 text-chart-2" },
  { id: "careless", label: "Careless slip", hint: "Knew it, made a small error", dot: "bg-chart-3", chip: "border-chart-3/35 bg-chart-3/15 text-chart-3" },
  { id: "rushed", label: "Ran out of time", hint: "Hurried or guessed to keep moving", dot: "bg-chart-4", chip: "border-chart-4/30 bg-chart-4/12 text-chart-4" },
]
export const CAUSE_TONE = Object.fromEntries(CAUSES.map((c) => [c.id, c.dot]))
export const CAUSE_CHIP = Object.fromEntries(CAUSES.map((c) => [c.id, c.chip]))
export const CAUSE_LABEL = Object.fromEntries(CAUSES.map((c) => [c.id, c.label]))
/** Seconds per question on the real Lower Level: 20 min/34, 35/38, 25/25, 30/30. */
export const BUDGET = { vr: 35, qr: 55, rc: 60, ma: 60 }
export const INTERVALS = [1, 3, 7, 21]                  // days: after a miss, then after each spaced correct answer
const CHECKIN_DAYS = 21, WORD_BRUSHUP_DAYS = 7
export const LEARN_CTX = { set: 1, review: 1, mixed: 1, mock: 1, vocab: 1, again: 1 }   // 'corr' (right after seeing the answers) is not evidence
// 'again' is evidence and 'corr' is not, and the difference is the whole rule:
// corrections re-ask the question whose answer she has just been shown, while
// 'again' asks a DIFFERENT question on the same skill. She has seen no key for
// it, so getting it right means something and getting it wrong should schedule
// it — exactly as it would inside a set.
export const LEVELS = ["Not started", "Started", "Needs work", "Familiar", "Proficient", "Mastered"]
/** How many of a skill's questions have to come back right in a mixed set or a
 *  mock, each on a later day than she first met that question, before the skill
 *  is Mastered. Named because it is now said out loud on the page, and a number
 *  the page quotes and the engine enforces must be one number. */
export const PROMOTE_AT = 2
const LEVEL_SCORE = { "Not started": 0, Started: 0.2, "Needs work": 0.35, Familiar: 0.6, Proficient: 0.85, Mastered: 1 }
const SEC2SUB = { VR: "vr", QR: "qr", RC: "rc", MA: "ma" }
const DAY = 86400000

/* ---------- small helpers ---------- */
const pad = (n) => String(n).padStart(2, "0")
export function dayKey(t) { const d = new Date(typeof t === "number" ? t : ts(t) || Date.now()); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export function plusDays(iso, n) { return new Date(ts(iso) + n * DAY).toISOString() }
export function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967296 }
function todayKey() { return dayKey(Date.now()) }
function nowIso() { return new Date().toISOString() }
export function rec(id) { return (Store.s.items || {})[id] || null }
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))

/* ---------- item index ---------- */
let IDX = null, IDX_FOR = null
function index() {
  if (IDX && IDX_FOR === D) return IDX
  IDX = {}; IDX_FOR = D
  for (const s of ORDER) for (const it of D.subjects[s] || []) IDX[it.id] = { sub: s, it, src: "set" }
  // The Chinese banks index by their own subject keys (zh-char, zh-word) and the
  // z:/zc: ids are real ids in them — no generation step, unlike w: words.
  for (const s of Object.keys((D.zh || {}).banks || {})) for (const it of D.zh.banks[s]) IDX[it.id] = { sub: s, it, src: "set" }
  // The workbook's closed exercises: recorded as evidence (ctx "exercise", which
  // LEARN_CTX does not admit), never scheduled — the review runner is four-choice.
  for (const L of Object.keys((D.zh || {}).exercises || {})) for (const ex of (D.zh.exercises[L].exercises || [])) for (const it of exItems(ex)) IDX[it.id] = { sub: "zh-ex", it, src: "exercise", ex }
  for (const form of Object.keys(D.mockItems || {})) for (const sec of Object.keys(D.mockItems[form])) for (const it of D.mockItems[form][sec]) IDX[it.id] = { sub: SEC2SUB[sec] || "vr", it, src: "mock", form }
  return IDX
}
/** Where a question id lives: its subject and the question itself (sets, mocks, or a generated word question). */
/* A miss on a paper sat on paper (pages/mock.jsx, OfflineMock). No question of
 * ours exists for it — only its number, and the skill it is filed under
 * (paperSkill). The pseudo item carries that skill and no choices: a review asks
 * two questions of ours in its place and can never serve it (reviewItems). A miss
 * with no skill yet, or on a paper that has been removed, resolves to nothing, so
 * its anchor waits out of sight with its schedule intact until it has one again. */
function offlineItem(id) {
  const m = /^off:([^:]+):([A-Z]{2}):(\d+)$/.exec(id)
  if (!m) return null
  const p = offlinePaper(m[1])
  if (!p || p.removed) return null
  const sec = (p.sections || []).find((x) => x.id === m[2])
  const n = Number(m[3]), sk = sec ? paperSkill(p, m[2], n) : null
  if (!sk) return null
  return { sub: SEC2SUB[m[2]] || "vr", src: "offline", form: m[1], word: paperWord(p, m[2], n), it: { id, sk, q: `${p.name} · ${sec.name} question ${n}`, c: [], k: null } }
}
/** The bank's questions that test a word (lib/wordindex.js): the synonym, the completion and
 *  the phrase completion that turns on it. Practice-set questions only; a mock's stay its own. */
function wordAsks(word) {
  const v = word ? vocabWord(word) : null
  return v ? [...new Set(v.refs.filter((r) => r.role === "asked" && r.src === "set").map((r) => r.id))] : []
}
export function findItem(id) {
  if (typeof id !== "string") return null
  if (id.startsWith("w:")) { const q = wordQuestion(id.slice(2)); return q ? { sub: "vr", it: q, src: "word" } : null }
  if (id.startsWith("off:")) return offlineItem(id)
  return index()[id] || null
}

/* ---------- writers ---------- */
/** Record a batch of answers. entries: [{id, ok, ms, pick, for}]. ctx: set | review | mixed | mock | vocab | corr.
 *
 *  `for` is what makes the review pile teach instead of drill. A question she
 *  missed comes back as a DIFFERENT question on the same skill (see
 *  `reviewStandIn`), so one answer has to land in two places: on the question she
 *  actually answered, under this run's ctx, and on the one it stood in for, as an
 *  `again` — already this file's word for a different question on the same skill
 *  whose key she has not been shown. The schedule moves on both.
 *
 *  Without that second write the stand-in was a detour. `recordAttempts` advances
 *  the item that was answered, so a sibling answered right left the original
 *  holding its due date, and the pile served the identical question on day 1,
 *  day 4 and at the check-in — both of the correct answers that retire a miss
 *  given from memory of the key she had just been shown. */
export function recordAttempts(entries, ctx) {
  const now = nowIso(), map = {}
  const take = (id) => map[id] || rec(id) || { hist: [] }   // one batch may touch an id twice
  function write(id, entry, kctx) {
    const prev = take(id)
    const r = { ...prev, hist: [...(prev.hist || []), entry].slice(-40) }
    if (LEARN_CTX[kctx]) {
      const last = (prev.hist || [])[prev.hist.length - 1]
      const sameDay = last && dayKey(last.at) === dayKey(now)
      const inPile = !!(prev.due && !prev.cleared)
      if (!entry.ok) {
        r.step = 0; r.streak = 0; r.due = plusDays(now, INTERVALS[0]); r.cleared = null; r.lastMiss = now
        r.misses = (prev.misses || 0) + 1
      } else if (inPile) {
        if (!sameDay) {                                  // two answers on one day are one piece of evidence
          r.step = (prev.step || 0) + 1; r.streak = (prev.streak || 0) + 1
          if (r.step >= 2) { r.cleared = now; r.due = plusDays(now, CHECKIN_DAYS) }   // out of the pile; one check-in later
          else r.due = plusDays(now, INTERVALS[Math.min(r.step, INTERVALS.length - 1)])
        }
      } else if (prev.cleared && prev.due) {
        r.due = null; r.checkins = (prev.checkins || 0) + 1   // passed the check-in
      } else if (kctx === "vocab" && !prev.cleared) {
        r.cleared = now; r.due = plusDays(now, WORD_BRUSHUP_DAYS)   // a word answered right gets one brush-up
      }
    }
    map[id] = r
  }
  for (const e of entries) {
    if (!e || !e.id) continue
    const base = { at: now, ok: !!e.ok, ms: Math.round(e.ms || 0), pick: e.pick || null }
    write(e.id, { ...base, ctx }, ctx)
    if (e.for && e.for !== e.id) write(e.for, { ...base, ctx: "again", via: e.id }, "again")
  }
  if (Object.keys(map).length) Store.setMany("items", map)
}
/** Cause + confidence for a miss (or clear them with nulls). */
export function setTag(id, patch) {
  const prev = rec(id) || { hist: [] }
  const next = { ...prev, ...patch }
  const hist = [...(prev.hist || [])]
  for (let i = hist.length - 1; i >= 0; i--) if (!hist[i].ok) { hist[i] = { ...hist[i], ...(patch.tag !== undefined ? { tag: patch.tag } : {}), ...(patch.sure !== undefined ? { sure: patch.sure } : {}) }; break }
  next.hist = hist
  Store.setMany("items", { [id]: next })
}
/** She says a right answer was a guess, or takes that back. The owner, 6 October 2026: "need
 *  to allow the kids to mark the right answered question as guess or not". A guess that lands
 *  is right on the paper, so the set keeps it as right; but it is no evidence she knows the
 *  question, so it raises no level (`known`) and the question goes into the review pile for
 *  tomorrow as a miss would — where, by the review's rule, two others on its skill are asked
 *  in its place. The schedule the right answer had earned is kept beside it (`beforeGuess`),
 *  so taking the mark back restores exactly that. `via`: the stand-in that answered for this
 *  question in a review, whose answer was written here too and is marked with it. */
export function markGuess(id, on, via = null) {
  const prev = rec(id)
  if (!prev || !prev.hist) return false
  const hist = [...prev.hist]
  let k = -1
  for (let i = hist.length - 1; i >= 0; i--) { const h = hist[i]; if (h && h.ok && LEARN_CTX[h.ctx] && (via ? h.via === via : !h.via)) { k = i; break } }
  if (k < 0 || !!hist[k].guess === !!on) return false
  const h = { ...hist[k] }
  if (on) h.guess = true; else delete h.guess
  hist[k] = h
  const r = { ...prev, hist }
  if (on) {
    r.beforeGuess = { step: prev.step ?? null, streak: prev.streak ?? null, due: prev.due ?? null, cleared: prev.cleared ?? null }
    const t = plusDays(h.at, INTERVALS[0])
    r.step = 0; r.streak = 0; r.cleared = null
    r.due = prev.due && !prev.cleared && ts(prev.due) < ts(t) ? prev.due : t   // never later than it already was
    r.guesses = (prev.guesses || 0) + 1
  } else {
    const b = prev.beforeGuess
    if (b) { r.step = b.step; r.streak = b.streak; r.due = b.due; r.cleared = b.cleared }
    delete r.beforeGuess
    r.guesses = Math.max(0, (prev.guesses || 1) - 1)
  }
  Store.setMany("items", { [id]: r })
  return true
}
/** The latest right answer on a question, as markGuess finds it: for the score card's toggle. */
export function lastRight(id, via = null) {
  const hs = ((rec(id) || {}).hist || [])
  for (let i = hs.length - 1; i >= 0; i--) { const h = hs[i]; if (h && h.ok && LEARN_CTX[h.ctx] && (via ? h.via === via : !h.via)) return h }
  return null
}
/** A precision word was rated: 1 → review tomorrow, 2 → in three days, 3 → only the quiz. */
export function scheduleWord(word, conf, when = nowIso()) {
  const id = "w:" + word, prev = rec(id) || { hist: [] }
  const r = { ...prev, explain: { at: when, conf } }
  if (conf <= 2 && !r.cleared) { r.step = 0; r.due = plusDays(when, conf === 1 ? 1 : 3) }
  Store.setMany("items", { [id]: r })
}
/** A finished mock form feeds the engine once: misses join the review pile, times feed pacing. */
export function recordMockForm(form) {
  const d = mockDone(form)
  if (!d || d.st.recorded) return false
  const entries = []
  for (const { s: def, r } of d.rows) {
    const qs = ((D.mockItems || {})[form] || {})[def.id] || []
    qs.forEach((q, i) => { const pick = (r.picks || {})[i] || null; entries.push({ id: q.id, ok: pick === keyOf(q), ms: ((r.times || {})[i]) || 0, pick }) })
  }
  recordAttempts(entries, "mock")
  Store.setSlice("mocks", form, (cur) => ({ ...cur, recorded: true }))
  return true
}
/** Create learning records for everything answered before the engine existed
 *  (migrated Sheets results, older site results, mock sections, rated words).
 *  Idempotent; never touches a record that already exists. */
export function backfill() {
  const items = Store.s.items || {}, add = {}
  const has = (id) => items[id] || add[id]
  for (const k of Object.keys(Store.s.results)) {
    const r = Store.s.results[k]
    if (!r || typeof r !== "object") continue
    const wrong = new Set(r.wrong || [])
    const ids = r.picks && Object.keys(r.picks).length ? Object.keys(r.picks) : [...wrong]
    const at = r.at || nowIso()
    for (const id of ids) {
      if (has(id)) continue
      const ok = !wrong.has(id)
      const rr = { hist: [{ at, ok, ms: 0, ctx: "set", pick: r.picks ? r.picks[id] || null : null }], at }
      if (!ok) { rr.step = 0; rr.streak = 0; rr.due = plusDays(at, 1); rr.lastMiss = at; rr.misses = 1 }
      add[id] = rr
    }
  }
  for (const form of Object.keys(Store.s.mocks || {})) {
    const d = mockDone(form)
    if (!d) continue
    for (const { s: def, r } of d.rows) {
      const qs = ((D.mockItems || {})[form] || {})[def.id] || []
      qs.forEach((q, i) => {
        if (has(q.id)) return
        const pick = (r.picks || {})[i] || null, ok = pick === keyOf(q), at = r.submittedAt
        const rr = { hist: [{ at, ok, ms: Math.round(((r.times || {})[i]) || 0), ctx: "mock", pick }], at }
        if (!ok) { rr.step = 0; rr.streak = 0; rr.due = plusDays(at, 1); rr.lastMiss = at; rr.misses = 1 }
        add[q.id] = rr
      })
    }
  }
  for (const wk of Object.keys(Store.s.precision || {})) {
    const st = Store.s.precision[wk]
    for (const w of Object.keys(st.words || {})) {
      const id = "w:" + w, e = st.words[w]
      if (has(id) || !e || !e.conf) continue
      const at = e.at || st.at || nowIso()
      const rr = { hist: [], explain: { at, conf: e.conf }, at }
      if (e.conf <= 2) { rr.step = 0; rr.due = plusDays(at, e.conf === 1 ? 1 : 3) }
      add[id] = rr
    }
  }
  if (Object.keys(add).length) Store.setMany("items", add, { stamp: false })
  let n = Object.keys(add).length + rescueWordSides()
  // A paper's misses typed in on another device arrive through the merge; the
  // review anchors for them are made here, so both devices hold the same pile.
  for (const f of offlinePapers({ removed: true })) n += recordOfflineMisses(f.id)
  return n
}

/** Sides of a cluster entry that have no entry of their own — "elaborate" out of
 *  "elaborate / intricate", but not "dubious", which is also a word in its own
 *  right. These are exactly the ids the Wordwood used to write and nothing could
 *  read. */
function orphanSides() {
  const out = {}
  for (const e of allWordEntries()) {
    const parts = String(e.word).split("/").map((x) => x.trim()).filter(Boolean)
    if (parts.length < 2) continue
    for (const p of parts) if (!wordEntry(p)) out[p] = e.word
  }
  return out
}

/** Move Wordwood evidence that landed on a name onto the entry it belongs to.
 *
 *  A gate for "elaborate / intricate" used to record `w:elaborate`. `findItem`
 *  cannot resolve a bare side, and `reviewQueue` skips anything it cannot
 *  resolve, so a cluster word she got WRONG was quietly dropped instead of
 *  coming back — and the precision card, the week's word summary and the
 *  checklist all stayed blank because they key on the entry. Nine of W2's
 *  twenty gates were in that state.
 *
 *  The attempts are moved, not rebuilt: same timestamps, same outcomes, with the
 *  name she actually called kept on each attempt. They are deduped on (at, ctx)
 *  as the Drive merge does (its third key, `via`, a word's attempts never carry), so a second run — or a run after another
 *  device pushes its old copy back — folds nothing in twice. The old key is only
 *  removed once its contents are safely under the new one. */
export function rescueWordSides() {
  const items = Store.s.items || {}, sides = orphanSides()
  const patch = {}, gone = []
  for (const id of Object.keys(items)) {
    if (!id.startsWith("w:")) continue
    const side = id.slice(2), entry = sides[side]
    if (!entry) continue
    const src = items[id] || {}, tid = "w:" + entry
    const cur = patch[tid] || items[tid] || { hist: [] }
    const seen = {}, hist = []
    for (const h of [...(cur.hist || []), ...(src.hist || [])]) {
      if (!h) continue
      const key = (h.at || "") + "|" + (h.ctx || "")
      if (seen[key]) continue
      seen[key] = 1
      hist.push(h.pick ? h : { ...h, pick: side })
    }
    hist.sort((a, b) => ts(a.at) - ts(b.at))
    const next = { ...cur, hist: hist.slice(-40) }
    if (src.explain && (!next.explain || ts(src.explain.at) > ts(next.explain.at))) next.explain = src.explain
    if (src.lastMiss && (!next.lastMiss || src.lastMiss > next.lastMiss)) next.lastMiss = src.lastMiss
    if (src.misses) next.misses = (next.misses || 0) + src.misses
    // a word she got wrong has to come back: the sooner date wins, and an
    // uncleared miss outranks a cleared record, the same way recordAttempts does
    if (src.due && (!next.due || ts(src.due) < ts(next.due))) {
      next.due = src.due
      next.step = src.step || 0
      next.cleared = src.cleared || null
    }
    if (src.at && (!next.at || src.at > next.at)) next.at = src.at
    patch[tid] = next
    gone.push(id)
  }
  if (!gone.length) return 0
  Store.setMany("items", patch, { stamp: false })
  Store.dropMany("items", gone)
  return gone.length
}

/* ---------- review queue ---------- */
/** Everything with a date on it. due: needs a go now · scheduled: later · checkin: cleared, but time to make sure it stuck. */
export function reviewQueue(sub, cat = "isee") {
  const now = Date.now(), out = { due: [], scheduled: [], checkin: [] }
  const items = Store.s.items || {}
  for (const id of Object.keys(items)) {
    const r = items[id]
    if (!r || !r.due) continue
    const f = findItem(id)
    if (!f || (sub && f.sub !== sub)) continue
    // No subject named: the caller is a category surface. The ISEE review page,
    // its sidebar badge and readiness's review-health part all read this with no
    // subject, and a Chinese miss arriving there would be the number scoring
    // homework that is not ISEE — the thing docs/chinese.md § 3 exists to stop.
    if (!sub && isZh(f.sub) !== (cat === "chinese")) continue
    const row = { id, sub: f.sub, it: f.it, rec: r, due: ts(r.due), src: f.src }
    if (r.cleared) { if (row.due <= now) out.checkin.push(row) }
    else if (row.due <= now) out.due.push(row)
    else out.scheduled.push(row)
  }
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.due - b.due)
  return out
}
/** How many different questions a review asks for each miss. The owner, 4 October
 *  2026: "to the wrong questions, you should add more in the future review. and the
 *  review should not do the same questions. should do different questions. you
 *  should double the workload." */
export const REVIEW_PER_MISS = 2
/** Up to `n` questions to ask in place of a missed one: the same skill, never the
 *  missed question itself.
 *
 *  The pile used to hand back the stored item, so a missed question came round
 *  verbatim on day 1, day 4 and at the check-in — same stem, same four options,
 *  the key in the same position — and both of the correct answers that retire a
 *  miss could be given from memory of the reveal she had just read. Precision
 *  words never had the fault, because `wordQuestion` rebuilds from the day's seed.
 *
 *  Unseen questions first, in an order keyed to the day, so a run is stable while
 *  she is in it — `sigOf` throws away a resumed draft whose questions changed
 *  underneath it — and fresh the next day; then the ones she has not touched for
 *  longest. Nothing already waiting in the pile is borrowed, nor anything in
 *  `exclude` (the rest of the queue, and what this run has already chosen), so
 *  working the pile cannot plant a second entry in it. The skill is looked up the
 *  way Try another does: its own subject's name first, then the lesson name a
 *  paper's tag maps to, then the same name in another subject's bank — the papers
 *  file exponents and multiples under Mathematics, the bank under Quantitative. */
export function reviewStandIns(id, n = REVIEW_PER_MISS, exclude = [], seed = todayKey()) {
  const hit = findItem(id)
  if (!hit || !hit.it || hit.src === "word") return []
  const raw = skillOf(hit.sub, hit.it)
  const names = [...new Set([skillTable(hit.sub)[raw] ? raw : null, learnName(raw), raw].filter(Boolean))]
  const items = Store.s.items || {}, skip = new Set([id, ...exclude])
  const free = (x) => { if (skip.has(x)) return false; const o = items[x]; return !(o && o.due && !o.cleared) }
  let pool = []
  for (const nm of names) {
    const where = [hit.sub, ...ORDER.filter((x) => x !== hit.sub)].find((x) => ((skillTable(x)[nm] || {}).ids || []).some(free))
    if (where) { pool = skillTable(where)[nm].ids.filter(free); break }
  }
  // A paper's miss whose note names the word it turned on ("adorn"): that word's own questions
  // come first and the skill's after them. Two random synonyms were practising some other
  // word — "tenaciously" for a missed "adorn" — while adorn's three questions sat in Week 5
  // (the owner, 7 October 2026).
  const own = wordAsks(hit.word).filter(free)
  if (!pool.length && !own.length) return []
  const at = (x) => { const o = items[x]; const h = (o && o.hist) || []; return h.length ? ts(h[h.length - 1].at) : 0 }
  const order = (ids) => [
    ...ids.filter((x) => !at(x)).map((x) => [hash(seed + id + x), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]),
    ...ids.filter((x) => at(x)).sort((p, q) => at(p) - at(q)),
  ]
  const byId = index()
  return [...order(own), ...order(pool.filter((x) => !own.includes(x)))].slice(0, n).map((x) => (byId[x] && byId[x].it ? { ...byId[x].it, standsFor: id } : null)).filter(Boolean)
}
export function reviewStandIn(id, seed = todayKey()) { return reviewStandIns(id, 1, [], seed)[0] || null }

/** What a review run serves: for every question in the queue, REVIEW_PER_MISS
 *  different questions on its skill, each carrying `standsFor` so the answer also
 *  moves the miss (recordAttempts, `for`). Both have to be right for the miss to
 *  step forward — one right and one wrong on the same day is a miss, by the
 *  same-day rule recordAttempts already keeps — and a wrong one is recorded as a
 *  miss of its own, which is where the extra work comes from. The check-in asks
 *  two different questions too: by the owner's rule the question she got wrong is
 *  not asked again, at any point, unless the bank holds nothing else on its skill.
 *  A paper's miss with nothing to stand in for it is left out rather than shown,
 *  because there is no question of ours behind it to show. Precision words keep
 *  their own rebuilt question, and a Chinese miss is its own page's business. */
export function reviewItems(sub, mode, cat = "isee") {
  const q = reviewQueue(sub, cat)
  const rows = mode === "checkin" ? q.checkin : mode === "all" ? [...q.due, ...q.scheduled] : q.due
  const inQueue = [...q.due, ...q.scheduled, ...q.checkin].map((x) => x.id)
  const out = [], used = new Set()
  for (const row of rows) {
    if (row.src === "word" || isZh(row.sub)) { out.push(row.it); continue }
    const sibs = reviewStandIns(row.id, REVIEW_PER_MISS, [...inQueue, ...used])
    if (!sibs.length) { if (row.src !== "offline") out.push(row.it); continue }
    for (const sb of sibs) { used.add(sb.id); out.push(sb) }
  }
  return out
}
/** Misses in the queue broken down by cause (untagged counted separately). */
export function causeBreakdown(rows) {
  const out = { know: 0, misread: 0, careless: 0, rushed: 0, untagged: 0 }
  for (const x of rows) { const t = x.rec && x.rec.tag; if (t && out[t] != null) out[t]++; else out.untagged++ }
  return out
}
/** All misses ever (latest record state), by cause — for the dashboard. */
export function missProfile(sub) {
  const items = Store.s.items || {}, out = { know: 0, misread: 0, careless: 0, rushed: 0, untagged: 0, total: 0, sure: 0, unsure: 0 }
  for (const id of Object.keys(items)) {
    const r = items[id]
    if (!r || !r.lastMiss) continue
    if (sub) { const f = findItem(id); if (!f || f.sub !== sub) continue }
    out.total++
    if (r.tag && out[r.tag] != null) out[r.tag]++; else out.untagged++
    if (r.sure === true) out.sure++; else if (r.sure === false) out.unsure++
  }
  return out
}

/* ---------- skills & mastery ---------- */
export function skillOf(sub, it) {
  if (sub !== "vr") return it.sk || "General"
  if (it.sk === "Synonyms" || it.sk === "Sentence completion") return it.sk   // a paper's miss names its skill; it has no prompt to read it from
  const q = it.q || ""
  return /most nearly means/i.test(q) ? "Synonyms" : /_{3,}/.test(q) ? "Sentence completion" : "Words in context"
}
let SK_CACHE = null, SK_FOR = null
/** Another question on the same skill as `id` — the thing to try when the
 *  lesson has just been read and the question it was read for is spent.
 *
 *  Unseen first, walked in bank order, so "try another" keeps moving forward
 *  through the material rather than circling three questions she can now recite.
 *  When there is nothing unseen left it takes the one she has not touched for
 *  longest, which is the next most useful thing and is still not the one in
 *  front of her: the question just answered is excluded outright. */
export function anotherLike(id) {
  const hit = findItem(id)
  if (!hit || !hit.it) return null
  const sub = hit.sub
  const raw = skillOf(sub, hit.it)
  /* A mock question is tagged the way a paper tags it — "whole-number addition",
   * "percent reasoning—reverse discount" — and the practice bank is indexed by
   * the tidy name. Without this every question on a Long Night report was a dead
   * end: the lesson was there to reteach it and there was nothing to redo it
   * with, on the one page whose own instructions say classify, reteach, redo. */
  const sk = skillTable(sub)[raw] ? raw : (learnName(raw) || raw)
  /* And the skill may not live in this question's own subject. The mock papers
     file exponents, factors and multiples under Mathematics; the practice bank
     keeps every one of them under Quantitative. Staying inside `sub` made those
     a dead end for no reason a ten-year-old would recognise — a question about
     exponents is a question about exponents — so the search widens to the other
     subjects rather than giving up. Its own subject is always tried first. */
  const where = [sub, ...ORDER.filter((x) => x !== sub)].find((x) => ((skillTable(x)[sk] || {}).ids || []).length > (x === sub ? 1 : 0))
  // A paper's miss that names its word is tried again on that word first, as review asks it.
  const own = wordAsks(hit.word).filter((x) => x !== id)
  const pool = own.length ? own : where ? ((skillTable(where)[sk] || {}).ids || []).filter((x) => x !== id) : []
  if (!pool.length) return null
  const byId = index()
  const at = (x) => { const r = rec(x); const h = (r && r.hist) || []; return h.length ? ts(h[h.length - 1].at) : 0 }
  const unseen = pool.filter((x) => !at(x))
  const pick = unseen.length ? unseen[0] : pool.slice().sort((a, b) => at(a) - at(b))[0]
  const row = byId[pick]
  return row && row.it ? { sub: byId[pick].sub, sk: own.length ? skillOf(byId[pick].sub, row.it) : sk, it: row.it, left: unseen.length } : null
}

/** How far a miss has been worked, and nothing about how far it should have been.
 *
 *  The mock page has told her the loop since it was written — "classify each
 *  miss, reteach, redo" — and then reported a score out of nine, which says how
 *  many went wrong and nothing about whether any of them were dealt with. The
 *  three steps all leave evidence already, so none of this asks her to tick
 *  anything: the cause tag is a tap she takes anyway, "Try another" records its
 *  attempts under `again`, and the review pile brings the question itself back
 *  until she gets it right.
 *
 *  The middle step is named for the evidence rather than for the intention, and
 *  that is deliberate. It is not "reteached", because a lesson read at the
 *  kitchen table leaves nothing here and this page must not claim to know it did
 *  not happen; and it is not "the lesson was opened", because on a score card
 *  the lesson for a miss is already open before she has done anything, so every
 *  miss would arrive pre-reteached and the whole column would mean nothing. It
 *  is "practised": a question of that skill answered through Try another, after
 *  the miss, which is an act she cannot perform by accident.
 *
 *  `missAt` is the most recent wrong answer and not the first. A question she
 *  missed in March, fixed, and missed again last night is a miss that is not
 *  dealt with, whatever happened in March. */
/** The reasons behind a set's misses, counted, in the order the buttons offer them.
 *
 *  "6 of 9" says three went wrong and stops. The reason each one went wrong is
 *  already recorded — she taps it herself on the score card — and then had
 *  nowhere to be read back except by reopening the set and scrolling through the
 *  questions one at a time. Three misread words and three methods she has never
 *  been taught are the same 6/9 and not remotely the same week.
 *
 *  Untagged is carried separately rather than folded in as a fifth reason,
 *  because "we have not said yet" is not a kind of mistake. */
export function tagTally(ids) {
  const n = { untagged: 0 }
  for (const id of ids || []) {
    const t = (rec(id) || {}).tag
    if (t && CAUSE_LABEL[t]) n[t] = (n[t] || 0) + 1
    else n.untagged++
  }
  return { rows: CAUSES.filter((c) => n[c.id]).map((c) => ({ id: c.id, label: c.label, n: n[c.id] })), untagged: n.untagged, n: (ids || []).length }
}

export function missStage(id) {
  const r = rec(id)
  const hs = attemptsOf(r)
  let missAt = null
  for (let i = hs.length - 1; i >= 0; i--) if (!hs[i].ok) { missAt = ts(hs[i].at); break }
  if (missAt == null) return null
  const after = (h) => known(h) && ts(h.at) > missAt
  const redone = hs.some(after)
  let practised = hs.some((h) => h.ctx === "again" && after(h))
  if (!practised) {
    const hit = findItem(id)
    if (hit && hit.it) {
      /* Through the same alias `anotherLike` uses, and it has to be: a mock
         tags its questions the way a paper does, "percent reasoning—reverse
         discount", and the bank calls that skill "Percent". Try another on a
         mock miss resolves the name and hands back a BANK question, so the
         practice is recorded against the bank's skill. Looking it up under the
         paper's own wording finds an empty table and reports that nothing has
         been practised — quietly, and only for mock misses, which is the half
         of the report this number exists for. */
      const raw = skillOf(hit.sub, hit.it)
      const sk = skillTable(hit.sub)[raw] ? raw : (learnName(raw) || raw)
      for (const other of ((skillTable(hit.sub)[sk] || {}).ids || [])) {
        if (other !== id && attemptsOf(rec(other)).some((h) => h.ctx === "again" && after(h))) { practised = true; break }
      }
    }
  }
  const classified = !!(r && r.tag)
  return { classified, practised, redone, missAt, stage: redone ? "redone" : practised ? "practised" : classified ? "classified" : "new" }
}

/** The same thing for a set or a paper: how many of its misses have been worked. */
export function missProgress(ids) {
  const rows = (ids || []).map((id) => ({ id, ...(missStage(id) || { classified: false, practised: false, redone: false, stage: "new" }) }))
  return {
    n: rows.length,
    classified: rows.filter((x) => x.classified).length,
    practised: rows.filter((x) => x.practised).length,
    redone: rows.filter((x) => x.redone).length,
    untouched: rows.filter((x) => x.stage === "new").length,
    rows,
  }
}

export function skillTable(sub) {
  if (!SK_CACHE || SK_FOR !== D) { SK_CACHE = {}; SK_FOR = D }
  if (SK_CACHE[sub]) return SK_CACHE[sub]
  const t = {}
  // The Chinese banks index by their own subject keys (zh-char, zh-word) beside
  // `subjects`, never inside it (docs/chinese.md § 4). Without them here a
  // Chinese skill had no table, `skillLevel` answered null, and the skill's cat
  // on a Chinese score card was drawn at the floor however she had done —
  // honest in the sense of never flattering, and still a number nobody read.
  // ORDER is unchanged, so nothing here reaches readiness, mastery or the Den.
  const bank = D.subjects[sub] || ((D.zh || {}).banks || {})[sub] || []
  for (const it of bank) { const sk = skillOf(sub, it); (t[sk] = t[sk] || { sk, ids: [], weeks: new Set() }); t[sk].ids.push(it.id); t[sk].weeks.add(it.w || it.l) }
  return (SK_CACHE[sub] = t)
}
function attemptsOf(r, asOf) { return (r && r.hist ? r.hist : []).filter((h) => LEARN_CTX[h.ctx] && (!asOf || ts(h.at) <= asOf)) }
/** A right answer she did not mark as a guess — the only kind that says she knows it.
 *  A guess that lands is right on the paper and stays right in the set, but it raises
 *  no level, promotes nothing and redoes no miss (markGuess). */
export const known = (h) => !!(h && h.ok && !h.guess)
/** Level of one skill, from the latest learning attempt on each of its questions.
 *  Mastered needs Proficient plus two correct answers in a mixed set or a mock on a later day. */
/** The skill's own cat: the same animal the Glimbook holds, at the brightness
 *  the engine really reports for that skill. Derived on every render and never
 *  stored, exactly as every other brightness is, and floored at Steady — being
 *  wrong about percent has never been drawn as a dimmer Percent cat and never
 *  will be. `sub` null means the surface gets no cat at all: Verbal has the cat
 *  at its gate, and a Long Night gets nothing from the first question to the
 *  last (docs/cats.md §6). */
export function skillCat(sub, sk) {
  if (!sub || !sk) return null
  let level = "Not started"
  try { level = (skillLevel(sub, sk) || {}).level || level } catch { /* an unknown skill is drawn at the floor */ }
  return { word: sub + ":" + sk, sk, stage: atLeast(W.glow[level], "Steady") }
}
export function skillLevel(sub, sk, asOf) {
  const info = skillTable(sub)[sk]
  if (!info) return null
  let attempted = 0, cur = 0, overdue = 0, promoted = 0
  const now = asOf || Date.now()
  for (const id of info.ids) {
    const r = rec(id)
    const hs = attemptsOf(r, asOf)
    if (!hs.length) continue
    attempted++
    if (known(hs[hs.length - 1])) cur++
    if (r.due && !r.cleared && ts(r.due) <= now) overdue++
    const firstDay = dayKey(hs[0].at)
    if (hs.some((h) => known(h) && (h.ctx === "mixed" || h.ctx === "mock") && dayKey(h.at) !== firstDay)) promoted++
  }
  const acc = attempted ? cur / attempted : null
  let level = "Not started"
  if (attempted && attempted < 3) level = "Started"
  else if (attempted) level = acc < 0.7 ? "Needs work" : acc < 0.85 ? "Familiar" : overdue ? "Familiar" : promoted >= PROMOTE_AT ? "Mastered" : "Proficient"
  return { sk, level, acc, attempted, total: info.ids.length, overdue, promoted, weeks: [...info.weeks].sort(), score: LEVEL_SCORE[level] }
}
export function skillsFor(sub, asOf) {
  return Object.keys(skillTable(sub)).map((sk) => skillLevel(sub, sk, asOf)).sort((a, b) => (a.acc == null) - (b.acc == null) || (a.acc || 0) - (b.acc || 0) || b.total - a.total)
}
/** Mastery score of a subject: item-weighted level score over practiced skills. */
export function masteryOf(sub, asOf) {
  let w = 0, s = 0, mastered = 0, proficient = 0, practiced = 0
  for (const L of skillsFor(sub, asOf)) {
    if (!L.attempted) continue
    practiced++; w += L.total; s += L.total * L.score
    if (L.level === "Mastered") mastered++; else if (L.level === "Proficient") proficient++
  }
  return { score: w ? s / w : null, mastered, proficient, practiced, total: Object.keys(skillTable(sub)).length }
}

/* ---------- mixed sets ---------- */
/** An interleaved set from weeks already reached: skills sitting at Proficient (to promote) and weak
 *  skills first, nothing that is due for review, nothing seen today. Deterministic for the day. */
export function buildMixedSet(n = 12, seed = todayKey()) {
  const cur = currentWeek()
  const weeks = D.weeks.map((w) => w.w).filter((w) => w <= cur)
  const per = Math.ceil(n / ORDER.length), out = []
  for (const s of ORDER) {
    const levels = {}
    for (const sk of Object.keys(skillTable(s))) levels[sk] = skillLevel(s, sk)
    const pool = []
    for (const it of D.subjects[s] || []) {
      if (!weeks.includes(it.w)) continue
      const r = rec(it.id)
      if (r && r.due && !r.cleared) continue
      const hs = r && r.hist ? r.hist : []
      if (hs.length && dayKey(hs[hs.length - 1].at) === seed) continue
      const L = levels[skillOf(s, it)] || {}
      const prio = !hs.length ? 1 : L.level === "Proficient" ? 3 : L.level === "Needs work" || L.level === "Familiar" ? 2 : L.level === "Mastered" ? 0.5 : 1
      pool.push({ it, sub: s, prio, rnd: hash(seed + it.id) })
    }
    pool.sort((a, b) => b.prio - a.prio || a.rnd - b.rnd)
    out.push(...pool.slice(0, per))
  }
  return out.sort((a, b) => a.rnd - b.rnd).slice(0, n).map((x) => x.it)
}
/** What a set can actually move, skill by skill — the promotion rule, counted.
 *
 *  `skillLevel` has always promoted on PROMOTE_AT, and the rule has always been
 *  invisible. The page described it in prose and the set itself said nothing
 *  about which skills were even in play, so the most consequential thing a mixed
 *  set does was the one thing she could not see it doing. Khan Academy's Mastery
 *  Challenge states its terms before it starts — six questions, three skills,
 *  two each, both right and the skill levels up — and being told the deal is
 *  what makes the deal worth taking.
 *
 *  Counted here and not in the page because it IS the engine's rule. A second
 *  copy of it in JSX is a second copy that will disagree, which is exactly how
 *  the mixed page came to promise promotion on one right answer when the engine
 *  had never accepted fewer than two.
 *
 *  `eligible` is the honest part and the part a page would get wrong. A question
 *  can only promote if she met it on an earlier day: answering one for the first
 *  time today moves nothing, and that is the rule working rather than an edge of
 *  it, because what is being measured is remembering. So a skill can be sitting
 *  at Proficient, have four questions in today's set, and still have nothing
 *  today that can lift it. Saying "up for Mastered" in that case would be a
 *  promise the set cannot keep. */
export function promotionsIn(items, asOf) {
  const by = new Map()
  for (const q of items || []) {
    const id = q && q.id ? q.id : q
    const hit = findItem(id)
    if (!hit || !hit.it) continue
    const sub = hit.sub, sk = skillOf(sub, hit.it)
    const key = sub + "\u0000" + sk
    let g = by.get(key)
    if (!g) by.set(key, (g = { sub, sk, n: 0, eligible: 0 }))
    g.n++
    const hs = attemptsOf(rec(id), asOf)
    if (!hs.length) continue
    const firstDay = dayKey(hs[0].at)
    if (firstDay === todayKey()) continue
    const already = hs.some((h) => known(h) && (h.ctx === "mixed" || h.ctx === "mock") && dayKey(h.at) !== firstDay)
    if (!already) g.eligible++
  }
  return [...by.values()].map((g) => {
    const L = skillLevel(g.sub, g.sk, asOf) || {}
    const promoted = L.promoted || 0
    const needs = Math.max(0, PROMOTE_AT - promoted)
    return { ...g, level: L.level || "Not started", promoted, needs, canReach: L.level === "Proficient" && needs > 0 && g.eligible >= needs }
  }).sort((a, b) => (b.canReach - a.canReach) || (a.needs - b.needs) || a.sk.localeCompare(b.sk))
}

export function mixedResults() {
  return Object.keys(Store.s.mixed || {}).map((k) => ({ id: k, ...Store.s.mixed[k] })).sort((a, b) => ts(b.at) - ts(a.at))
}

/* ---------- pacing ---------- */
/** Timed answers for a subject: median seconds, share inside the budget, slow-but-right and fast-but-wrong counts. */
export function pacingFor(sub, asOf) {
  const items = Store.s.items || {}, times = []
  let slowRight = 0, fastWrong = 0, within = 0
  const budget = BUDGET[sub]
  for (const id of Object.keys(items)) {
    const f = findItem(id)
    if (!f || f.sub !== sub) continue
    for (const h of items[id].hist || []) {
      if (!h.ms || !LEARN_CTX[h.ctx] || h.ctx === "vocab" || (asOf && ts(h.at) > asOf)) continue
      const sec = h.ms / 1000
      times.push(sec)
      if (sec <= budget * 1.25) within++
      if (h.ok && sec > budget * 1.5) slowRight++
      if (!h.ok && sec < budget * 0.5) fastWrong++
    }
  }
  times.sort((a, b) => a - b)
  const median = times.length ? times[Math.floor(times.length / 2)] : null
  return { n: times.length, median, budget, within: times.length ? within / times.length : null, slowRight, fastWrong }
}
/** How long this question physically takes to read, in ms.
 *
 *  `paceFlag` already says "fast and wrong" at half the section budget, but for
 *  Verbal that is still seventeen seconds — far too generous to catch the thing
 *  Sheila actually does, which is pick a choice before she has finished the
 *  sentence. This is a much harder floor: the words in the stem and the four
 *  choices at 210 a minute, which is quick silent reading for a ten-year-old.
 *  Under it she did not read the question; there is no other explanation. Set
 *  deliberately high so it under-reports — telling her she did not read
 *  something she did read would be worse than missing a few. */
const WORDS_PER_SEC = 3.5
export function words(t) { return String(t || "").trim().split(/\s+/).filter(Boolean).length }

/** How many words a Reading Comprehension passage is, or 0 for an item without one. */
export function passageWords(it) {
  const p = it && it.p && D.passages[it.p]
  return p ? words(p.x) : 0
}

/**
 * The least time this question could honestly have taken, in milliseconds.
 *
 * `withPassage` is the whole of the Reading Comprehension story. This counted
 * the stem and the choices and nothing else, which is right for the three
 * subjects where that *is* the question — and blind on the fourth, where the
 * question is a 142-word passage and then eight words asking about it. The
 * floor came out at a median of 14 seconds on items whose passage alone takes
 * about 41 to read, so there was no answer fast enough to trip it: on 27
 * September two Reading sets went by at medians of 14 and 21 seconds a
 * question with the check silent throughout, and every miss in them was tagged
 * "careless" by the one person the check exists to tell otherwise.
 *
 * The passage is charged once, not six times. Every passage in the bundle
 * carries exactly six questions, and she reads it at the first of them; adding
 * 41 seconds to all six would call her rushed for answering the second one in
 * twenty, which is not rushing, and a check that cries wolf on five questions
 * out of six is one she will learn to ignore on the sixth. The caller says
 * which question is the first.
 */
export function readFloor(it, withPassage = false) {
  if (!it) return 0
  if (/^zc?:/.test(it.id || "")) return 0      // untimed: there is no honest floor for a prompt words() counts as 1
  let n = words(it.q)
  for (const c of it.c || []) n += Math.max(1, words(c))
  if (withPassage) n += passageWords(it)
  return Math.max(2000, Math.round((n / WORDS_PER_SEC) * 1000))
}
/** Answered faster than the question can be read. */
export function tooFast(it, ms, withPassage = false) { return !!ms && !!it && ms < readFloor(it, withPassage) }

export function paceFlag(sub, ms, ok) {
  if (!ms || isZh(sub)) return null            // Chinese practice is untimed (docs/chinese.md § 3)
  const b = BUDGET[sub] || 50, sec = ms / 1000
  if (ok && sec > b * 1.5) return { id: "slow", label: "Slow but right", tone: "warning" }
  if (!ok && sec < b * 0.5) return { id: "fast", label: "Fast and wrong", tone: "destructive" }
  if (sec > b * 1.25) return { id: "over", label: "Over budget", tone: "outline" }
  return null
}

/* ---------- vocabulary ---------- */
let WORD_IDX = null, WORD_FOR = null
function wordIndex() {
  if (WORD_IDX && WORD_FOR === D) return WORD_IDX
  WORD_IDX = {}; WORD_FOR = D
  for (const wk of Object.keys(D.precision || {})) for (const e of D.precision[wk].words || []) if (!WORD_IDX[e.word]) WORD_IDX[e.word] = { ...e, wk }
  return WORD_IDX
}
export function wordEntry(word) { return wordIndex()[word] || null }
/** Every distinct precision word (a word repeated across weeks appears once). */
export function allWordEntries() { return Object.values(wordIndex()) }
/** "harmless, gentle, kind" / "(noun) city, funds; (adj) …" / "IMPLY = to suggest…" → one short answer phrase per sense. */
function senses(entry) {
  const m = entry.meaning || ""
  const parts = entry.word.split("/").map((x) => x.trim())
  const out = []
  if (parts.length > 1) {
    for (const w of parts) {
      // "WORD = …" or "WORD (noun) = …", up to the first sentence break
      const re = new RegExp(w.toUpperCase().replace(/[^A-Z]/g, "") + "\\s*(?:\\([^)]*\\))?\\s*=\\s*([^.;]+)")
      const hit = m.match(re)
      if (hit) out.push({ word: w, answer: shorten(hit[1]) })
    }
  }
  if (!out.length) {
    const first = m.split(";")[0]
      .replace(/^\([^)]*\)\s*/, "")                       // "(noun) city, funds"
      .replace(/^[A-Z][A-Za-z]*\s*(?:\([^)]*\))?\s*=\s*/, "")   // "PREJUDICE (noun) = an unfair opinion…"
    out.push({ word: parts[0], answer: shorten(first) })
  }
  return out.filter((x) => x.answer)
}
function shorten(s) {
  let t = (s || "").trim().replace(/\s+/g, " ")
  t = t.replace(/\s*\(.*$/, "")
  const bits = t.split(",").map((x) => x.trim()).filter(Boolean)
  if (!bits.length) return ""
  let a = bits[0]
  if (a.length < 10 && bits[1] && bits[1].length < 16) a = bits[0] + ", " + bits[1]
  if (a.length > 44) a = a.slice(0, 41).replace(/\s\S*$/, "") + "…"
  return /^[A-Z][a-z]/.test(a) ? a.charAt(0).toLowerCase() + a.slice(1) : a
}
const STOP = new Set("that this with from when what some they them then than very more most over into onto upon been being have having does doing thing things often usually sometimes especially without about because while which other another person people someone something said says make makes take takes their there like your")
/** Content stems (first four letters) of a phrase — the near-synonym test for distractors. */
function stems(str, keep) {
  const out = new Set()
  for (const w of (str || "").toLowerCase().split(/[^a-z]+/)) {
    if (w.length < 4 || (!keep && STOP.has(w))) continue
    out.add(w.slice(0, 4))
  }
  return out
}
const overlaps = (a, b) => [...a].some((x) => b.has(x))
/** A four-choice synonym question for a precision word; distractors are other words' meanings,
 *  filtered so none of them is a near-synonym of the key (whole meanings compared, not just the
 *  short phrases — "rigorous" must never be offered beside "painstaking"). */
export function wordQuestion(word, seed = todayKey()) {
  const e = wordEntry(word)
  if (!e) return null
  const ss = senses(e)
  if (!ss.length) return null
  const pick = ss[Math.floor(hash(seed + word) * ss.length)]
  const mineStrict = stems(e.word + " " + e.meaning)
  const mineLoose = stems(pick.answer + " " + e.word, true)
  const pos = (s) => (s || "").split(/[^a-z]+/i)[0].toLowerCase()
  const cands = Object.values(wordIndex()).filter((o) => o.word !== e.word).map((o) => ({ o, s: senses(o)[0] })).filter((x) => x.s && x.s.answer)
    .map((x) => ({ ...x, same: pos(x.o.pos) === pos(e.pos), rnd: hash(seed + word + x.o.word) }))
    .sort((a, b) => (b.same - a.same) || a.rnd - b.rnd)
  function collect(test, spread) {
    const seen = new Set([pick.answer]), ds = [], taken = []
    for (const x of cands) {
      if (ds.length >= 3) break
      if (seen.has(x.s.answer) || !test(x)) continue
      const st = stems(x.o.word + " " + x.o.meaning)
      if (spread && taken.some((t) => overlaps(t, st))) continue     // keep the wrong answers apart from each other too
      seen.add(x.s.answer); ds.push(x.s.answer); taken.push(st)
    }
    return ds
  }
  // strict: no shared idea anywhere in the two entries; fall back to the answer-phrase test if too few
  const notMine = (x) => !overlaps(stems(x.o.word + " " + x.o.meaning), mineStrict)
  let ds = collect(notMine, true)
  if (ds.length < 3) ds = collect(notMine, false)
  if (ds.length < 3) ds = collect((x) => !overlaps(stems(x.s.answer + " " + x.o.word, true), mineLoose), false)
  if (ds.length < 3) return null
  const choices = [pick.answer, ...ds].map((c, i) => ({ c, r: hash(seed + word + i) })).sort((a, b) => a.r - b.r)
  const k = LTR[choices.findIndex((x) => x.c === pick.answer)]
  return { id: "w:" + word, w: e.wk, sk: "Precision words", d: "M", q: `${pick.word.toUpperCase()} most nearly means:`, c: choices.map((x) => x.c), k, e: `${e.word}: ${e.meaning}${e.example ? " — " + e.example : ""}`, p: "" }
}
/** known · learning · due · new. Known = explained (rated 2–3) on one day and a synonym question right on another. */
export function wordStatus(word) {
  const r = rec("w:" + word)
  if (!r) return { status: "new" }
  const now = Date.now()
  const quiz = (r.hist || []).filter((h) => h.ctx === "vocab" || h.ctx === "review")
  const lastQuiz = quiz[quiz.length - 1]
  const explained = r.explain && r.explain.conf >= 2
  const quizRight = known(lastQuiz) && quiz.some((h) => known(h) && (!r.explain || dayKey(h.at) !== dayKey(r.explain.at)))
  if (r.due && !r.cleared && ts(r.due) <= now) return { status: "due", rec: r }
  if (r.due && r.cleared && ts(r.due) <= now) return { status: "brushup", rec: r }
  if (explained && quizRight) return { status: "known", rec: r }
  return { status: "learning", rec: r, explained: !!explained, quizzed: quiz.length > 0 }
}
export function wordSummary(wk) {
  const out = { known: 0, learning: 0, due: 0, new: 0, brushup: 0, total: 0 }
  for (const e of (D.precision[wk] || { words: [] }).words) { out.total++; const s = wordStatus(e.word).status; out[s] = (out[s] || 0) + 1 }
  return out
}
export function wordQuizItems(wk, onlyDue = false) {
  const list = (D.precision[wk] || { words: [] }).words
  const rows = list.map((e) => ({ e, st: wordStatus(e.word).status })).filter((x) => !onlyDue || x.st === "due" || x.st === "brushup" || x.st === "learning" || x.st === "new")
  return rows.map((x) => wordQuestion(x.e.word)).filter(Boolean)
}

/* ---------- a paper sat on paper ---------- */
/** The newest score per section of a paper sat offline (pages/mock.jsx,
 *  OfflineMock), the question numbers she missed where a parent typed them in,
 *  and whether every section is in. Entries are an append-only log; the newest
 *  word on a section wins. */
/** The ISEE Lower Level layout a paper added by a parent starts from: the real
 *  paper's four scored sections and their times (ERB; the same shape as
 *  content/offline_mocks.json), with Verbal's synonyms as questions 1–17. The
 *  counts can be changed when the paper is added, for a paper that differs. */
export const ISEE_LOWER_SECTIONS = [
  { id: "VR", name: "Verbal Reasoning", n: 34, min: 20 },
  { id: "QR", name: "Quantitative Reasoning", n: 38, min: 35 },
  { id: "RC", name: "Reading Comprehension", n: 25, min: 25 },
  { id: "MA", name: "Mathematics Achievement", n: 30, min: 30 },
]
/** Every paper sat on paper: the ones the site ships (content/offline_mocks.json,
 *  with a question→skill map read off the paper) and the ones a parent added from
 *  the Mock exams page, whose shape lives in her own record (`mocks[id].def`) and
 *  never in the site's content — a published paper is a copyrighted book, and her
 *  record is private to her Google account. A removed paper is left out unless
 *  asked for; its results stay in her record either way. */
export function offlinePapers({ removed = false } = {}) {
  const recs = (Store.s && Store.s.mocks) || {}, out = []
  for (const f of D.offlineMocks || []) out.push({ ...f, own: false, rec: recs[f.id] || {} })
  for (const [id, r] of Object.entries(recs)) {
    if (!r || !r.offline || !r.def || typeof r.def !== "object" || out.some((x) => x.id === id)) continue
    if (r.def.removed && !removed) continue
    out.push({ ...r.def, id, own: true, essay: r.def.essay || { min: 30 }, rec: r })
  }
  return out
}
export function offlinePaper(id) { return offlinePapers({ removed: true }).find((p) => p.id === id) || null }
/** The skill a missed question on a paper is filed under: a parent's choice on the
 *  paper's page first, then the paper's own question map, then — for Verbal, whose
 *  two parts are fixed by position — Synonyms up to the paper's split and Sentence
 *  completion after it. Null when nobody has said; the miss then waits, listed on
 *  the paper's page as needing a skill, and is never dropped. */
export function paperSkill(p, secId, n) {
  if (!p) return null
  const tag = ((p.rec && p.rec.tags) || {})[`${secId}:${n}`]
  if (tag && tag.sk) return tag.sk
  const sec = (p.sections || []).find((x) => x.id === secId)
  if (!sec) return null
  if (Array.isArray(sec.skills) && sec.skills[n - 1]) return sec.skills[n - 1]
  if (secId === "VR" && Number.isInteger(sec.synonyms)) return n <= sec.synonyms ? "Synonyms" : "Sentence completion"
  return null
}
/** The skills a miss in a section can be filed under: the practice bank's own,
 *  so every one of them has questions for a review to ask. */
export function paperSkillOptions(secId) {
  if (secId === "VR") return ["Synonyms", "Sentence completion"]
  const sub = SEC2SUB[secId]
  return sub ? Object.keys(skillTable(sub)).sort((a, b) => a.localeCompare(b)) : []
}
/** A paper a parent adds. Returns its id. The id is the moment it was made, so two
 *  devices adding papers at once cannot collide, and it never looks like a form
 *  the site ships. */
export function createOfflinePaper({ name, source = "", sections = ISEE_LOWER_SECTIONS, synonyms = 17, link = null }) {
  const at = nowIso(), id = "P" + Date.now().toString(36).toUpperCase()
  const def = {
    name: String(name || "").trim().slice(0, 80) || "A paper sat on paper",
    source: String(source || "").trim().slice(0, 200),
    sections: sections.map((s) => ({ id: s.id, name: s.name, n: s.n, min: s.min, ...(s.id === "VR" ? { synonyms: Math.max(0, Math.min(s.n, synonyms)) } : {}) })),
    essay: { min: 30 }, createdAt: at, at,
  }
  Store.setSlice("mocks", id, () => ({ offline: true, def, entries: [], ...(link ? { link: { url: link, at } } : {}) }))
  return id
}
/** Attach a paper's PDF (a file in her Drive folder, by id) or a link to it, or take
 *  either off with null. Each carries its own `at`, so an attachment made on one
 *  device is not lost to an unrelated edit made on another (Store.merge). */
export function setPaperFile(id, file) {
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, offline: true, file: file ? { id: file.id, name: String(file.name || "paper.pdf").slice(0, 120), size: file.size || 0, at } : { id: null, at } }))
}
export function setPaperLink(id, url) {
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, offline: true, link: { url: url || null, at } }))
}
/** File one missed question under a skill (or clear it with null), and make its
 *  review anchor now that it has one. */
export function tagPaperMiss(id, secId, n, sk) {
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, offline: true, tags: { ...(c.tags || {}), [`${secId}:${n}`]: { sk: sk || null, at } } }))
  return recordOfflineMisses(id)
}
/** She redid a missed question from the booklet itself — the one thing the site
 *  cannot ask her, because the question is not on the site. Her work, so each tick
 *  keeps its own time and merges per question. */
export function markRedone(id, secId, n, done) {
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, offline: true, redone: { ...(c.redone || {}), [`${secId}:${n}`]: { done: !!done, at } } }))
}
export function paperRedone(p, secId, n) { const r = ((p && p.rec && p.rec.redone) || {})[`${secId}:${n}`]; return !!(r && r.done) }
/** What went wrong on a paper, from whoever marked it — the paper-results skill,
 *  through the results link. Per missed question a line on the mistake, with the
 *  letter she chose and the right one (`notes`, "QR:23" → {pick, key, why}); for the
 *  paper, a few lines on what the misses have in common (`analysis`). Always in the
 *  marker's own words, never the book's: the question itself stays in the booklet.
 *  Kept in her record only, like the rest of the paper; each note keeps its own time
 *  and merges per question (Store.merge). */
export function setPaperNotes(id, { notes = {}, analysis = [], by = "" } = {}) {
  const at = nowIso()
  const stamped = Object.fromEntries(Object.entries(notes).map(([k, v]) => [k, { ...v, at }]))
  Store.setSlice("mocks", id, (c) => ({
    ...c, offline: true,
    ...(Object.keys(stamped).length ? { notes: { ...(c.notes || {}), ...stamped } } : {}),
    ...(analysis.length ? { analysis: { points: analysis, by: by || "", at } } : {}),
  }))
}
export function paperNote(p, secId, n) { const r = ((p && p.rec && p.rec.notes) || {})[`${secId}:${n}`]; return r && r.why ? r : null }
/** The word a Verbal miss turned on, when the marker's note names it ("adorn"). Review then
 *  asks that word's own questions in its place (reviewStandIns), not any synonym's. */
export function paperWord(p, secId, n) { const r = ((p && p.rec && p.rec.notes) || {})[`${secId}:${n}`]; return r && typeof r.word === "string" && r.word.trim() ? r.word.trim().toLowerCase() : null }
export function paperAnalysis(p) { const a = p && p.rec && p.rec.analysis; return a && Array.isArray(a.points) && a.points.length ? a : null }
/** Where a question sits on the paper's own PDF, so its page can show it cut out of
 *  the family's copy (components/paper-question.jsx): `q` the question, `ctx` the
 *  figure or passage it refers to — each [page, x0, y0, x1, y1], fractions of the
 *  page. A marker's note can carry them for a paper a parent added; a paper the site
 *  ships carries its own map (content/offline_mocks.json). Positions only: the
 *  question's words stay in the PDF, in her Drive. */
export function paperBoxes(p, secId, n) {
  const note = paperNote(p, secId, n) || {}, sec = ((p && p.sections) || []).find((x) => x.id === secId) || {}
  const ok = (b) => (Array.isArray(b) && b.length === 5 && b.every((v) => typeof v === "number") ? b : null)
  return { q: ok(note.where) || ok((sec.where || [])[n - 1]), ctx: ok(note.ctx) || ok((sec.ctx || {})[String(n)]) }
}
/** The paper's PDF in her Drive, if one is attached: the file a question is cut from. */
export function paperPdf(p) {
  return paperAttachments(p, "pages").find((x) => x.mime === "application/pdf" || /\.pdf$/i.test(x.name || "")) || null
}
/** What is attached to a paper, each a PDF or a photo, kept in her Drive folder:
 *  the paper itself (`pages` — a PDF, or a photo of each page of a booklet) and
 *  the marked answer sheet (`sheets` — a scan, or photos once it is marked). The
 *  site shows them and cannot read them: it has no server, and a browser cannot be
 *  trusted to read circled bubbles. They are there for a parent to look back at
 *  and for Claude to read — the paper-results skill takes the scores and the
 *  circled numbers off a sheet and hands them back as one import link. Each file
 *  merges on its own (Store.merge), so two devices adding files keep both. */
export const PAPER_FIELDS = ["pages", "sheets"]
export function addPaperAttachment(id, field, file) {
  if (!PAPER_FIELDS.includes(field)) return
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, offline: true, [field]: { ...(c[field] || {}), [file.id]: { id: file.id, name: String(file.name || "file").slice(0, 120), size: file.size || 0, mime: file.mime || "", addedAt: at, at } } }))
}
export function removePaperAttachment(id, field, fid) {
  const rec = (Store.s.mocks || {})[id] || {}
  if (field === "pages" && rec.file && rec.file.id === fid) return setPaperFile(id, null)   // the single PDF the first version kept
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => ({ ...c, [field]: { ...(c[field] || {}), [fid]: { ...((c[field] || {})[fid] || { id: fid }), removed: at, at } } }))
}
export function paperAttachments(p, field) {
  const rec = (p && p.rec) || {}
  const out = Object.values(rec[field] || {}).filter((x) => x && x.id && !x.removed)
  // The first version of this page kept one PDF as `file`; it is listed with the paper's own files.
  if (field === "pages" && rec.file && rec.file.id && !out.some((x) => x.id === rec.file.id)) out.push({ ...rec.file, mime: "application/pdf", addedAt: rec.file.at })
  return out.sort((x, y) => ts(x.addedAt) - ts(y.addedAt))
}
/** Take a paper a parent added off the list and out of the score band, or put it
 *  back. Nothing she did on it is deleted: the results stay in her record and the
 *  anchors for its misses wait, out of sight, in case it comes back. */
export function removePaper(id, removed = true) {
  const at = nowIso()
  Store.setSlice("mocks", id, (c) => (c.def ? { ...c, def: { ...c.def, removed: removed ? at : null, at } } : c))
}

export function offlineResult(form) {
  const m = offlinePaper(form), st = (Store.s.mocks || {})[form] || {}
  if (!m) return null
  const entries = Array.isArray(st.entries) ? [...st.entries].sort((a, b) => String(a.at).localeCompare(String(b.at))) : []
  const by = {}, missed = {}
  for (const e of entries) {
    for (const [sec, right] of Object.entries(e.scores || {})) if (Number.isInteger(right)) by[sec] = { right, at: e.at, sat: e.sat }
    for (const [sec, nums] of Object.entries(e.missed || {})) if (Array.isArray(nums)) missed[sec] = { nums: nums.map(Number).filter(Number.isInteger), at: e.at, sat: e.sat }
  }
  const secs = m.sections.filter((x) => x.n)
  let right = 0, n = 0
  for (const x of secs) if (by[x.id]) { right += by[x.id].right; n += x.n }
  const last = entries[entries.length - 1]
  return { m, by, missed, right, n, entries, sat: last ? last.sat : null, at: last ? last.at : null, complete: secs.every((x) => by[x.id]) }
}
/** The misses typed in from a paper sat on paper become anchors in the review
 *  pile — one per question number, on the skill the paper's map gives it, due the
 *  day after she sat it — so each one sends REVIEW_PER_MISS questions of ours into
 *  her review. Idempotent and additive: the same numbers again change nothing; a
 *  number dropped from a later entry takes its anchor out of the pile; a skill
 *  with no question of ours to ask makes no anchor at all. */
export function recordOfflineMisses(form) {
  const o = offlineResult(form)
  if (!o) return 0
  const items = Store.s.items || {}, map = {}
  for (const sec of o.m.sections.filter((x) => x.n)) {
    const got = o.missed[sec.id]
    if (!got) continue
    const want = new Set(got.nums.filter((k) => k >= 1 && k <= sec.n))
    const at = got.sat ? got.sat + "T12:00:00.000Z" : got.at || nowIso()
    const prefix = `off:${form}:${sec.id}:`
    for (const k of want) {
      const id = prefix + k
      if (items[id] || map[id] || !findItem(id) || !reviewStandIns(id, 1).length) continue
      map[id] = { hist: [{ at, ok: false, ms: 0, ctx: "mock", pick: null }], at, step: 0, streak: 0, due: plusDays(at, 1), lastMiss: at, misses: 1 }
    }
    for (const id of Object.keys(items)) {
      if (!id.startsWith(prefix) || want.has(Number(id.slice(prefix.length)))) continue
      if (items[id] && items[id].due) map[id] = { ...items[id], due: null, cleared: items[id].cleared || nowIso() }
    }
  }
  if (Object.keys(map).length) Store.setMany("items", map)
  return Object.keys(map).length
}

/** Add one entry to a paper's log — the scores and the missed question numbers
 *  marked on the sheet — and make the review anchors for its misses. Shared by the
 *  results page and an import link (pages/import.jsx), so a result arrives the same
 *  way whichever door it came in by. An entry that carries an `id` already in the
 *  log is not added twice: opening the same link again changes nothing. */
export function addOfflineEntry(form, { sat, scores = {}, missed = {}, id, via, tags = null } = {}) {
  if (!offlinePaper(form)) return { added: false, anchors: 0 }
  const cur = (Store.s.mocks || {})[form] || {}
  if (id && Array.isArray(cur.entries) && cur.entries.some((e) => e && e.id === id)) return { added: false, anchors: recordOfflineMisses(form) }
  const at = nowIso()
  const entry = { id: id || at + ":" + Math.random().toString(36).slice(2, 8), at, sat, scores, ...(Object.keys(missed).length ? { missed } : {}), ...(via ? { via } : {}) }
  // `tags`: "QR:12" → a skill, for a link that files the misses as it adds them
  const tagged = tags && Object.keys(tags).length ? Object.fromEntries(Object.entries(tags).map(([k, sk]) => [k, { sk, at }])) : null
  Store.setSlice("mocks", form, (c) => ({ ...c, offline: true, entries: [...(Array.isArray(c.entries) ? c.entries : []), entry], ...(tagged ? { tags: { ...(c.tags || {}), ...tagged } } : {}) }))
  return { added: true, anchors: recordOfflineMisses(form) }
}

/* ---------- mocks: next steps & score band ---------- */
export const STANINE = (pct) => pct >= 92 ? 9 : pct >= 85 ? 8 : pct >= 76 ? 7 : pct >= 66 ? 6 : pct >= 55 ? 5 : pct >= 44 ? 4 : pct >= 33 ? 3 : pct >= 22 ? 2 : 1
function mockDone(form) {
  const m = D.mocks.find((x) => x.id === form), st = (Store.s.mocks || {})[form]
  if (!m || !st) return null
  const secs = m.sections.filter((s) => s.n)
  const rows = secs.map((s) => ({ s, r: (st.sections || {})[s.id] })).filter((x) => x.r && x.r.submittedAt)
  if (rows.length < secs.length) return null
  return { m, st, rows }
}
/** Estimated stanine per section and overall for every finished mock, and the band across the last three. */
export function mockBand(asOf) {
  const mocks = []
  for (const m of D.mocks) {
    const d = mockDone(m.id)
    if (!d) continue
    const at = d.st.finishedAt || d.rows[d.rows.length - 1].r.submittedAt
    if (asOf && ts(at) > asOf) continue
    const sections = {}
    let right = 0, n = 0, stSum = 0
    for (const { s, r } of d.rows) { const pct = Math.round((r.right / s.n) * 100); sections[s.id] = { pct, st: STANINE(pct), right: r.right, n: s.n, blank: s.n - Object.keys(r.picks || {}).length, timeUsed: r.timeUsed || 0, min: s.min }; right += r.right; n += s.n; stSum += STANINE(pct) }
    mocks.push({ form: m.id, name: m.name, at, pct: Math.round((right / n) * 100), st: Math.round(stSum / d.rows.length), sections })
  }
  // A paper sat on paper counts once every section is in — the owner's decision of
  // 4 October 2026 (AGENTS.md, "A paper sat on paper"). It is dated by the day she
  // sat it (by the moment of entry, when that is the same day) and read through
  // the same stanine table; it has no blanks or times to report. `offline` marks it
  // for the readers that count only the papers sat here (lib/rewards.js).
  for (const f of offlinePapers()) {
    const o = offlineResult(f.id)
    if (!o || !o.complete) continue
    const at = o.sat && o.at && dayKey(o.at) === o.sat ? o.at : o.sat ? o.sat + "T12:00:00" : o.at
    if (asOf && ts(at) > asOf) continue
    const sections = {}
    let right = 0, n = 0, stSum = 0, k = 0
    for (const x of f.sections.filter((y) => y.n)) {
      const r = o.by[x.id], pct = Math.round((r.right / x.n) * 100)
      sections[x.id] = { pct, st: STANINE(pct), right: r.right, n: x.n, blank: 0, timeUsed: 0 }
      right += r.right; n += x.n; stSum += STANINE(pct); k++
    }
    mocks.push({ form: f.id, name: f.name, at, pct: Math.round((right / n) * 100), st: Math.round(stSum / k), sections, offline: true })
  }
  mocks.sort((a, b) => ts(a.at) - ts(b.at))
  const recent = mocks.slice(-3)
  const lo = recent.length >= 2 ? Math.min(...recent.map((x) => x.st)) : null, hi = recent.length >= 2 ? Math.max(...recent.map((x) => x.st)) : null
  return { n: mocks.length, mocks, latest: mocks[mocks.length - 1] || null, lo, hi }
}
const baseSkill = (sk) => (sk || "").split("—")[0].trim().toLowerCase()
/** Three concrete things to do after a mock, from its misses, blanks, timing and tags. */
export function mockNextSteps(form) {
  const d = mockDone(form)
  if (!d) return []
  const steps = [], cur = currentWeek()
  const clusters = {}, causes = { know: 0, misread: 0, careless: 0, rushed: 0 }
  let untagged = 0, missTotal = 0
  for (const { s, r } of d.rows) {
    const sub = SEC2SUB[s.id]
    const qs = D.mockItems[form][s.id]
    qs.forEach((q, i) => {
      if ((r.picks || {})[i] === keyOf(q)) return
      missTotal++
      const key = sub + "|" + baseSkill(q.sk)
      clusters[key] = clusters[key] || { sub, sk: baseSkill(q.sk), n: 0 }
      clusters[key].n++
      const t = rec(q.id) && rec(q.id).tag
      if (t && causes[t] != null) causes[t]++; else untagged++
    })
    const blank = s.n - Object.keys(r.picks || {}).length
    const late = r.autoSubmitted || (r.timeUsed || 0) >= s.min * 60000 * 0.98
    if (blank >= 3 || (late && blank > 0)) steps.push({ kind: "time", text: `${s.name}: ${blank} left blank${late ? " and the clock ran out" : ""} — turn on pacing mode for this week's ${SUBJ[sub].short} sets and answer every question, guessing if needed`, path: `/s/${sub}/${cur}`, sub })
  }
  const top = Object.values(clusters).sort((a, b) => b.n - a.n).filter((c) => c.n >= 2).slice(0, 2)
  for (const c of top) {
    // the practice set with the most questions on that skill, from weeks already reached
    let best = null
    for (const w of D.weeks) { if (w.w > cur) break; setsFor(c.sub, w.w).forEach((set, n) => { const k = set.filter((q) => baseSkill(skillOf(c.sub, q)) === c.sk || baseSkill(q.sk) === c.sk).length; if (k && (!best || k > best.k)) best = { k, path: `/run/${c.sub}/${w.w}/${n}`, label: `${w.w} set ${n + 1}` } }) }
    const a = aopsFor(c.sub, c.sk) || aopsFor(c.sub, c.sk.charAt(0).toUpperCase() + c.sk.slice(1))
    steps.push({ kind: "skill", text: `${SUBJ[c.sub].short} · ${c.sk}: ${c.n} missed — the review pile has them now; ${best ? `redo ${best.label} (${best.k} on this skill)` : "reteach it before the next set"}${a ? `. AoPS: ${a.ba}, or Prealgebra “${a.pa}”` : ""}`, path: best ? best.path : `/review/${c.sub}`, sub: c.sub })
  }
  const tagged = missTotal - untagged
  if (tagged >= 3) {
    const [cause, n] = Object.entries(causes).sort((a, b) => b[1] - a[1])[0]
    const advice = { know: `start the next precision quiz and read every explanation in the review pile`, misread: `underline the question's key word (NOT, EXCEPT, units) before reading the choices`, careless: `check the answer against the question once before pressing Next`, rushed: `practice with pacing mode on so the budget becomes familiar` }[cause]
    if (n >= 2) steps.push({ kind: "cause", text: `${n} of ${tagged} tagged misses were "${CAUSE_LABEL[cause]}" — ${advice}`, path: cause === "know" ? `/precision/${cur}/quiz` : "/review" })
  }
  if (untagged) steps.push({ kind: "tag", text: `Tag the ${untagged} untagged miss${untagged === 1 ? "" : "es"} below (why did it go wrong?) so these steps get sharper`, path: `/mock/${form}` })
  return steps.slice(0, 4)
}

/* ---------- activity, streaks, effort ---------- */
function eachTimestamp(fn) {
  const s = Store.s
  for (const k of Object.keys(s.results)) { const r = s.results[k]; if (r && r.at) fn(r.at, "set", r); if (r && r.first && r.first.at) fn(r.first.at, "set", r.first) }
  for (const k of Object.keys(s.mixed || {})) { const r = s.mixed[k]; if (r && r.at) fn(r.at, "mixed", r) }
  /* Review and vocabulary answers pay once per question per day. Every other
   * source here is already self-limiting — a set replaces its own timestamp, a
   * reading day replaces its own entry — but these two append to `hist`, and
   * "Everything" in the review pile serves questions that are merely scheduled,
   * not due. Without this cap the cheapest way to earn is to re-run work she
   * has already done, which is the failure mode that turns a metric into
   * something to farm instead of something to learn from.
   * Deduping by day, not outright, keeps `activityDays` honest: a day with work
   * on it still emits a timestamp. */
  const paid = {}
  for (const id of Object.keys(s.items || {})) {
    for (const h of s.items[id].hist || []) {
      if (h.ctx !== "review" && h.ctx !== "vocab") continue
      const once = id + "|" + h.ctx + "|" + dayKey(ts(h.at))
      if (paid[once]) continue
      paid[once] = 1
      fn(h.at, h.ctx, h)
    }
  }
  for (const wk of Object.keys(s.precision || {})) { const st = s.precision[wk]; for (const w of Object.keys(st.words || {})) { const e = st.words[w]; if (e && e.text && e.at) fn(e.at, "word", e) } }
  for (const wk of Object.keys(s.essays || {})) { const e = s.essays[wk]; if (e && e.at) fn(e.at, "essay", e); if (e && e.completedAt) fn(e.completedAt, "essay-done", e) }
  for (const id of Object.keys(s.books || {})) {
    const b = s.books[id]
    if (!b || b.removed) continue
    for (const ses of b.sessions || []) if (ses.at) fn(ses.at, "read", ses)
    if (b.finishedAt) fn(b.finishedAt, "book", b)
  }
  for (const f of Object.keys(s.mocks || {})) { const st = s.mocks[f]; for (const sec of Object.keys(st.sections || {})) { const r = st.sections[sec]; if (r && r.submittedAt) fn(r.submittedAt, "mock", r) } if (st.essay && st.essay.submittedAt) fn(st.essay.submittedAt, "mock-essay", st.essay) }
}
export function activityDays() { const days = new Set(); eachTimestamp((at) => { const t = ts(at); if (t) days.add(dayKey(t)) }); return days }
function weekOf(key) { const d = new Date(key + "T00:00:00"); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dayKey(d.getTime()) }
/** "Did anything today" streak; up to two missed days a week are frozen instead of breaking it. */
export function streakInfo() {
  const days = activityDays()
  const today = todayKey(), activeToday = days.has(today)
  let cursor = new Date(); cursor.setHours(0, 0, 0, 0)
  if (!activeToday) cursor.setDate(cursor.getDate() - 1)
  let current = 0, frozen = 0
  const used = {}
  for (let guard = 0; guard < 400; guard++) {
    const k = dayKey(cursor.getTime())
    if (days.has(k)) current++
    else if (current || activeToday) { const w = weekOf(k); if ((used[w] || 0) < 2) { used[w] = (used[w] || 0) + 1; frozen++ } else break }
    else break
    cursor.setDate(cursor.getDate() - 1)
  }
  // best streak ever, same freeze rule, forward from the first active day
  const sorted = [...days].sort()
  let best = 0
  if (sorted.length) {
    const start = new Date(sorted[0] + "T00:00:00"), end = new Date(today + "T00:00:00")
    let run = 0; const fz = {}
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d.getTime())
      if (days.has(k)) run++
      else { const w = weekOf(k); if (run && (fz[w] || 0) < 2) fz[w] = (fz[w] || 0) + 1; else run = 0 }
      best = Math.max(best, run)
    }
  }
  return { current, frozen, activeToday, best: Math.max(best, current), activeDays: days.size }
}
const POINTS = { set: 10, mixed: 12, review: 1, vocab: 1, word: 2, "essay-done": 15, mock: 25, "mock-essay": 15, read: 4, book: 40 }
/** Effort points, for attempts not accuracy. range: [fromKey, toKey] inclusive day keys.
 *  `asOf` (ms) winds the clock back to what she had made by that moment — what the
 *  wallet needs when it settles a purchase she made in the past against the Hum that
 *  actually existed then. */
export function effortPoints(range, asOf) {
  let total = 0
  eachTimestamp((at, kind) => {
    const t = ts(at)
    if (asOf && t > asOf) return
    const k = dayKey(t)
    if (range && (k < range[0] || k > range[1])) return
    total += POINTS[kind] || 0
  })
  // tagging a miss is effort too
  for (const id of Object.keys(Store.s.items || {})) {
    const r = Store.s.items[id]
    if (!r || !r.tag) continue
    const t = ts(r.at)
    if (asOf && t > asOf) continue
    const k = dayKey(t)
    if (!range || (k >= range[0] && k <= range[1])) total += 3
  }
  return total
}
export function thisWeekRange() { const w = weekOf(todayKey()); const d = new Date(w + "T00:00:00"); d.setDate(d.getDate() + 6); return [w, dayKey(d.getTime())] }

/** What a plan week actually held, computed from her own record.
 *
 *  The written digest has two halves and only one of them needs a person. The
 *  numbers — sets, accuracy, what came off the review pile, which skills slipped
 *  — are all sitting in `Store.s` on the device already; asking a Routine to
 *  read them out of Drive, mail them, and wait for someone to tap an import link
 *  is a long way round to say something the browser can work out in a
 *  millisecond. So it says it here, always current, and the digest that arrives
 *  by mail carries only the judgement: "you picked 30, and 30 is the area."
 *
 *  Everything here is counted, never estimated. A week with no sets in it
 *  reports `null` accuracy, which the card prints as "—" rather than 0%. */
export function weekRecap(wk) {
  const start = D.starts[wk]
  if (!start) return null
  const end = dayKey(ts(start + "T00:00:00") + 6 * DAY)
  const inWeek = (at) => { const k = at && dayKey(ts(at)); return k && k >= start && k <= end }

  const subs = {}
  let done = 0, total = 0, right = 0, answered = 0
  for (const s of ORDER) {
    let sd = 0, st = 0, sr = 0, sa = 0
    setsFor(s, wk).forEach((_, n) => {
      st++
      const r = Store.s.results[setId(s, wk, n)]
      if (!r) return
      sd++; sr += r.right; sa += r.n
    })
    subs[s] = { done: sd, total: st, right: sr, n: sa, pct: sa ? Math.round((sr / sa) * 100) : null }
    done += sd; total += st; right += sr; answered += sa
  }

  // review and vocabulary answers given inside the week, and the misses that
  // happened on new set work — the second is the honest "what slipped" list,
  // because a miss during review is the pile doing its job, not a new problem
  let reviewed = 0, reviewedOk = 0, vocab = 0
  const slipped = {}
  for (const id of Object.keys(Store.s.items || {})) {
    for (const h of (Store.s.items[id].hist || [])) {
      if (!inWeek(h.at)) continue
      if (h.ctx === "review") { reviewed++; if (h.ok) reviewedOk++ }
      else if (h.ctx === "vocab") vocab++
      else if (h.ctx === "set" && !h.ok) {
        const f = findItem(id)
        if (f && f.it && f.it.sk) { const k = f.sub + "\u0000" + f.it.sk; slipped[k] = (slipped[k] || 0) + 1 }
      }
    }
  }
  // answers that came in faster than the question can be read — the pattern is
  // only visible once a week of them is counted in one place
  let rushed = 0
  for (const id of Object.keys(Store.s.items || {})) {
    for (const h of (Store.s.items[id].hist || [])) {
      if (!inWeek(h.at) || h.ctx !== "set" || h.ok) continue
      const f = findItem(id)
      if (f && tooFast(f.it, h.ms)) rushed++
    }
  }
  const q = reviewQueue()

  const pst = (Store.s.precision || {})[wk] || {}
  const pwords = Object.values(pst.words || {})
  const words = {
    total: ((D.precision || {})[wk] || { words: [] }).words.length,
    written: pwords.filter((w) => String(w.text || "").trim()).length,
    rated: pwords.filter((w) => w.conf).length,
    submitted: !!pst.submittedAt,
  }

  const es = (Store.s.essays || {})[wk] || {}
  const et = es.time || {}
  const mins = ["plan", "draft", "revise"].map((k) => et[k]).filter((m) => m != null)
  const essay = { done: !!es.completedAt, started: !!(es.completedAt || es.at), minutes: mins.length ? mins.reduce((a, b) => a + b, 0) : null }

  let reading = 0
  for (const b of Object.values(Store.s.books || {})) {
    if (!b || b.removed) continue
    for (const x of b.sessions || []) if (x && x.on >= start && x.on <= end) reading++
  }

  const days = new Set()
  for (const d of activityDays()) if (d >= start && d <= end) days.add(d)

  return {
    wk, start, end, ended: end < todayKey(),
    sets: { done, total }, right, answered,
    pct: answered ? Math.round((right / answered) * 100) : null,
    subs, reviewed, reviewedOk, vocab, dueNow: q.due.length, rushed,
    words, essay, reading, activeDays: days.size,
    slipped: Object.keys(slipped)
      .map((k) => ({ sub: k.split("\u0000")[0], sk: k.split("\u0000")[1], n: slipped[k] }))
      .sort((a, b) => b.n - a.n),
  }
}

/* ---------- readiness ---------- */
const accScore = (pct) => pct == null ? null : clamp((pct - 40) / 50)
/** Recent accuracy: sets from the last three plan weeks reached, plus mock sections, weighted 2:1 recent:older. */
function recentAccuracy(sub, asOf) {
  const cur = currentWeek(), weeks = D.weeks.map((w) => w.w), ci = weeks.indexOf(cur)
  let rw = 0, rn = 0, ow = 0, on = 0
  weeks.forEach((w, i) => {
    setsFor(sub, w).forEach((_, n) => {
      const r = Store.s.results[setId(sub, w, n)]
      if (!r || (asOf && ts(r.at) > asOf)) return
      if (i >= ci - 2) { rw += r.right; rn += r.n } else { ow += r.right; on += r.n }
    })
  })
  for (const k of Object.keys(Store.s.mixed || {})) { const r = Store.s.mixed[k]; if (!r || (asOf && ts(r.at) > asOf)) continue; const bs = (r.bySub || {})[sub]; if (bs) { rw += bs.right; rn += bs.n } }
  const band = mockBand(asOf)
  for (const m of band.mocks) { const sec = m.sections[sub.toUpperCase()]; if (sec) { rw += sec.right; rn += sec.n } }
  const recent = rn ? rw / rn : null, older = on ? ow / on : null
  const pct = recent != null && older != null ? (2 * recent + older) / 3 : recent != null ? recent : older
  return { pct: pct == null ? null : Math.round(pct * 100), n: rn + on }
}
/** Per-subject score (0–100) with its parts. */
export function subjectScore(sub, asOf) {
  const acc = recentAccuracy(sub, asOf), mas = masteryOf(sub, asOf), pace = pacingFor(sub, asOf)
  const q = reviewQueue(sub)
  const pile = q.due.length + q.scheduled.length
  const parts = [
    { id: "accuracy", label: "Accuracy", weight: 50, score: accScore(acc.pct), note: acc.pct == null ? "no sets yet" : `${acc.pct}% recently` },
    { id: "mastery", label: "Mastery", weight: 25, score: mas.score, note: mas.practiced ? `${mas.mastered} mastered · ${mas.proficient} proficient of ${mas.practiced} practiced skills` : "no skills practiced yet" },
    { id: "pacing", label: "Pacing", weight: 10, score: pace.n >= 8 ? pace.within : null, note: pace.n >= 8 ? `median ${Math.round(pace.median)} s vs ${pace.budget} s budget` : "needs timed answers" },
    { id: "review", label: "Review health", weight: 15, score: asOf ? null : pile ? 1 - q.due.length / pile : 1, note: asOf ? "" : q.due.length ? `${q.due.length} overdue of ${pile}` : pile ? `${pile} scheduled, none overdue` : "pile is empty" },
  ]
  return { sub, score: combine(parts), parts, acc, mastery: mas, pacing: pace, queue: q }
}
function combine(parts) {
  let w = 0, s = 0
  for (const p of parts) if (p.score != null) { w += p.weight; s += p.weight * p.score }
  return w ? Math.round((s / w) * 100) : null
}
export const READINESS_LABEL = (score) => score == null ? "Not started" : score >= 85 ? "Test-ready" : score >= 70 ? "On track" : score >= 50 ? "Building" : "Early days"
/** Overall readiness 0–100 with a transparent breakdown. asOf (ms) recomputes it as it stood on that day. */
export function readiness(asOf) {
  const subs = {}
  for (const s of ORDER) subs[s] = subjectScore(s, asOf)
  // accuracy across subjects, weighted by questions answered
  let aw = 0, as = 0, mw = 0, ms = 0, pn = 0, pw = 0
  for (const s of ORDER) {
    const x = subs[s]
    if (x.acc.pct != null) { aw += x.acc.n; as += x.acc.n * accScore(x.acc.pct) }
    if (x.mastery.score != null) { mw += x.mastery.practiced; ms += x.mastery.practiced * x.mastery.score }
    if (x.pacing.n) { pn += x.pacing.n; pw += x.pacing.n * (x.pacing.within || 0) }
  }
  const band = mockBand(asOf)
  const q = asOf ? null : reviewQueue()
  const pile = q ? q.due.length + q.scheduled.length : 0
  const days = activityDays()
  const end = asOf ? new Date(asOf) : new Date()
  let active14 = 0
  for (let i = 0; i < 14; i++) { const d = new Date(end); d.setDate(d.getDate() - i); if (days.has(dayKey(d.getTime()))) active14++ }
  const parts = [
    { id: "accuracy", label: "Accuracy", weight: 30, score: aw ? as / aw : null, note: aw ? "recent sets, mixed sets and mock sections" : "finish a set to start" },
    { id: "mock", label: "Mock exams", weight: 20, score: band.latest ? accScore(band.latest.pct) : null, note: band.latest ? `${band.latest.name}: ${band.latest.pct}% · stanine ≈${band.latest.st}` : "no finished mock yet" },
    { id: "mastery", label: "Skill mastery", weight: 20, score: mw ? ms / mw : null, note: mw ? `${ORDER.reduce((n, s) => n + subs[s].mastery.mastered, 0)} mastered · ${ORDER.reduce((n, s) => n + subs[s].mastery.proficient, 0)} proficient` : "no skills practiced yet" },
    { id: "pacing", label: "Pacing", weight: 10, score: pn >= 8 ? pw / pn : null, note: pn >= 8 ? `${Math.round((pw / pn) * 100)}% of timed answers inside the budget` : "timed answers arrive as sets are done on the site" },
    { id: "review", label: "Review health", weight: 10, score: q ? (pile ? 1 - q.due.length / pile : 1) : null, note: q ? (q.due.length ? `${q.due.length} due now` : "nothing overdue") : "" },
    { id: "consistency", label: "Consistency", weight: 10, score: clamp(active14 / 8), note: `${active14} active days in the last 14` },
  ]
  const score = combine(parts)
  // what would move the number most: the largest weighted shortfall
  let advice = null, gap = 0
  for (const p of parts) { const g = p.weight * (1 - (p.score == null ? 0.5 : p.score)); if (g > gap) { gap = g; advice = p } }
  // an overdue pile is the one lever that works today, so it goes first once half of it is late
  const rv = parts.find((p) => p.id === "review")
  if (rv && rv.score != null && rv.score < 0.5) advice = rv
  const ADVICE = {
    accuracy: { text: "Accuracy moves the score most — do the next set slowly and read every explanation.", path: "/" },
    mock: { text: band.n ? "A stronger mock is the biggest lever now." : "Finishing the first mock will add the missing piece.", path: "/mock" },
    mastery: { text: "Promote skills: a mixed set is where Proficient becomes Mastered.", path: "/mixed" },
    pacing: { text: "Pacing is the drag — try a set with pacing mode on.", path: "/s/" + ORDER.reduce((b, s) => (subs[s].pacing.within != null && (b == null || subs[s].pacing.within < subs[b].pacing.within) ? s : b), null) },
    review: { text: q && q.due.length ? `${q.due.length} questions are due for review — clearing them lifts the score today.` : "Keep the review pile clear.", path: "/review" },
    consistency: { text: "Short sessions on more days count more than one long one.", path: "/checklist" },
  }
  return { score, label: READINESS_LABEL(score), parts, subjects: subs, band, streak: asOf ? null : streakInfo(), advice: advice ? ADVICE[advice.id] : null }
}
/** Readiness at the end of each plan week reached so far, for the trend line. */
export function readinessHistory() {
  const out = [], now = Date.now()
  for (const w of D.weeks) {
    const start = ts(D.starts[w.w] + "T00:00:00")
    if (start > now) break
    const end = Math.min(now, start + 7 * DAY - 1)
    out.push({ week: w.w, label: w.label, score: readiness(end).score })
  }
  return out
}
