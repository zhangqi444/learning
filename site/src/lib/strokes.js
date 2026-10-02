/* Handwriting of a known character, judged stroke by stroke on the device.
 *
 * hanzi-writer (MIT) draws the quiz and matches each stroke she draws against
 * the reference data for that character — Make Me a Hanzi via hanzi-writer-data,
 * Arphic Public License, vendored under content/chinese/strokes with its licence
 * and inlined in the bundle, so nothing is fetched and it works offline and in
 * the artifact. The owner's point about the Pencil was the stroke sequence: the
 * quiz's callbacks hand back each drawn path, so what she wrote is kept, in
 * order, with whether each stroke matched — a rule-based judge of handwriting
 * that needs no network and no model. A character with no data cannot be
 * judged, and the validator refuses to ask for one. */
import HanziWriter from "hanzi-writer"
import { D } from "./content"

export const strokeData = (ch) => ((D.zh || {}).strokes || {})[ch] || null
export const hasStrokes = (ch) => !!strokeData(ch)
const pack = (p) => (p && p.points ? p.points.map((q) => [Math.round(q.x), Math.round(q.y)]) : [])

/** Mount a quiz for `ch` into `el`. `outline` shows a faint outline to trace (for
 *  copying); dictation and pinyin-to-character leave it off. Resolves nothing;
 *  `onDone({ ch, mistakes, strokes })` fires when every stroke has been matched. */
export function makeQuiz(el, ch, { size = 112, outline = false, onProgress, onDone } = {}) {
  if (!strokeData(ch) || !el) return null
  const strokes = []
  const w = HanziWriter.create(el, ch, {
    width: size, height: size, padding: 8,
    showCharacter: false, showOutline: outline, showHintAfterMisses: 3,
    strokeColor: "#6b63e6", outlineColor: "#d8d8e8", drawingColor: "#2b2a55", drawingWidth: 5, highlightColor: "#8ed6a8",
    charDataLoader: (c, onLoad) => onLoad(strokeData(c)),
  })
  w.quiz({
    leniency: 1.1, showHintAfterMisses: 3, highlightOnComplete: true,
    onCorrectStroke: (s) => { strokes.push({ n: s.strokeNum, ok: true, pts: pack(s.drawnPath) }); onProgress && onProgress({ ...s, ok: true }) },
    onMistake: (s) => { strokes.push({ n: s.strokeNum, ok: false, pts: pack(s.drawnPath) }); onProgress && onProgress({ ...s, ok: false }) },
    onComplete: (s) => onDone && onDone({ ch, mistakes: s.totalMistakes, strokes: strokes.slice() }),
  })
  return { cancel() { try { w.cancelQuiz() } catch { /* already gone */ } }, writer: w }
}
/** A slip or two on a character is a character written; more is one to write again.
 *  The threshold is a decision, not a measurement: a ten-year-old with a Pencil
 *  will mis-start a stroke, and the quiz already makes her redo it. */
export const writtenWell = (mistakes, nStrokes) => mistakes <= Math.max(2, Math.ceil((nStrokes || 0) / 4))
