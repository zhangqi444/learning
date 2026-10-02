/* Handwriting of a known character: she writes it freely into a 米字格, then the
 * standard form appears beneath her strokes and each of hers is judged against
 * the reference — 描红 after the fact, which is what the owner asked for.
 *
 * The reference is Make Me a Hanzi via hanzi-writer-data (Arphic Public License;
 * the characters a lesson needs are vendored under content/chinese/strokes with
 * the licence file and inlined in the bundle, so nothing is fetched and it works
 * offline and in the artifact). hanzi-writer (MIT) is kept for one thing: drawing
 * that reference, animated once in stroke order so she sees the order. The judge
 * is ours, over the strokes she drew, in character space: her k-th stroke against
 * the k-th reference median — mean distance along the stroke, where it starts and
 * ends, its length, and its direction — with thresholds close to the library's
 * own leniency. A missing or extra stroke counts as a mistake each. Position
 * matters more than beauty: a stroke in the right place drawn a little
 * crookedly is right. A character with no data cannot be judged, and the
 * validator refuses to ask for one. */
import HanziWriter from "hanzi-writer"
import { D } from "./content"

export const strokeData = (ch) => ((D.zh || {}).strokes || {})[ch] || null
export const hasStrokes = (ch) => !!strokeData(ch)

/** Draw the reference into `el` at `size` px, visible, with no interaction. */
export function drawReference(el, ch, size) {
  if (!strokeData(ch) || !el) return null
  return HanziWriter.create(el, ch, {
    width: size, height: size, padding: Math.round(size * 0.08),
    showCharacter: true, showOutline: false, strokeColor: "#6b63e6", strokeAnimationSpeed: 1.2, delayBetweenStrokes: 180,
    charDataLoader: (c, onLoad) => onLoad(strokeData(c)),
  })
}
/** The transform hanzi-writer rendered with, read back from its SVG, so a point in
 *  the box (CSS px, relative to the box) maps into character space exactly. */
export function boxToChar(el) {
  const g = el && el.querySelector("svg g[transform]")
  const m = g && /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)\s*scale\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(g.getAttribute("transform"))
  if (!m) return null
  const tx = +m[1], ty = +m[2], sx = +m[3], sy = +m[4]
  return (x, y) => [(x - tx) / sx, (y - ty) / sy]
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const length = (pts) => pts.reduce((n, p, i) => (i ? n + dist(pts[i - 1], p) : 0), 0)
/** `n` points evenly spaced along the stroke, so two strokes compare point to point. */
export function resample(pts, n = 24) {
  if (!pts.length) return []
  if (pts.length === 1) return Array.from({ length: n }, () => pts[0])
  const total = length(pts), step = total / (n - 1), out = [pts[0]]
  let acc = 0, i = 1, prev = pts[0]
  while (out.length < n && i < pts.length) {
    const d = dist(prev, pts[i])
    if (acc + d >= step) { const r = (step - acc) / d; const q = [prev[0] + (pts[i][0] - prev[0]) * r, prev[1] + (pts[i][1] - prev[1]) * r]; out.push(q); prev = q; acc = 0 }
    else { acc += d; prev = pts[i]; i++ }
  }
  while (out.length < n) out.push(pts[pts.length - 1])
  return out
}
const AVG = 300, ENDS = 300, MIN_LEN = 0.35, MAX_LEN = 3
function compare(user, ref) {
  const u = resample(user), r = resample(ref)
  const avg = u.reduce((n, p, i) => n + dist(p, r[i]), 0) / u.length
  const ends = Math.max(dist(u[0], r[0]), dist(u[u.length - 1], r[r.length - 1]))
  const lr = length(ref) ? length(user) / length(ref) : 1
  return { avg, ends, lr, ok: avg <= AVG && ends <= ENDS && lr >= MIN_LEN && lr <= MAX_LEN }
}
/** Judge her strokes (arrays of [x, y] in character space, in the order drawn)
 *  against the character's reference. Returns one verdict per stroke she drew,
 *  plus the count of mistakes: a stroke not in its place, a stroke drawn
 *  backwards, a stroke missing, a stroke too many. */
export function judgeStrokes(ch, drawn) {
  const data = strokeData(ch)
  if (!data) return null
  const refs = data.medians, out = []
  let mistakes = 0
  drawn.forEach((pts, k) => {
    const ref = refs[k]
    if (!ref) { out.push({ n: k, ok: false, verdict: "extra" }); mistakes++; return }
    const fwd = compare(pts, ref)
    if (fwd.ok) { out.push({ n: k, ok: true, verdict: "ok" }); return }
    const back = compare(pts, ref.slice().reverse())
    out.push({ n: k, ok: false, verdict: back.ok ? "backwards" : "off" }); mistakes++
  })
  const missing = Math.max(0, refs.length - drawn.length)
  mistakes += missing
  return { ch, n: refs.length, drawn: drawn.length, missing, mistakes, strokes: out }
}
/** A slip or two on a character is a character written; more is one to write again.
 *  The threshold is a decision, not a measurement: a ten-year-old with a Pencil
 *  will mis-start a stroke, and the standard form is right there to compare. */
export const writtenWell = (mistakes, nStrokes) => mistakes <= Math.max(2, Math.ceil((nStrokes || 0) / 4))
