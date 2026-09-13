/* Where a weak ISEE maths skill is taught in the AoPS material.
 * Reference only — a pointer into books the family already owns, plus the two
 * free things (Alcumus, the Prealgebra videos). Verbal and Reading have no
 * honest AoPS equivalent, so they get nothing rather than something vague. */
import { D } from "./content"

export const AOPS_SUBJECTS = ["ma", "qr"]
export function aopsFor(sub, skill) {
  if (!D.aops || !AOPS_SUBJECTS.includes(sub)) return null
  return D.aops.skills[skill] || null
}
export const aopsFree = () => (D.aops && D.aops.free) || []
/** Alcumus has no per-topic deep link, so we send her to Alcumus and name the topic to pick. */
export const ALCUMUS_URL = "https://artofproblemsolving.com/alcumus"
export const VIDEO_URL = "https://artofproblemsolving.com/videos"


/** Where to go to actually learn the thing she just got wrong.
 *
 *  Deliberately NOT the question. Searching an ISEE stem verbatim finds
 *  homework-answer sites, which teach nothing and hand her the key; searching
 *  the idea behind it finds the people who explain it. The link only ever
 *  appears after the answer has been revealed, so it cannot shortcut the
 *  question she is on. Nothing is fetched — it is a link the reader clicks, so
 *  the artifact still makes no external request of its own. */
export function learnQuery(sub, it) {
  if (!it) return ""
  const caps = String(it.q || "").match(/\b[A-Z]{3,}(?:\s[A-Z]{3,})?\b/)
  if (sub === "vr" && caps) return `${caps[0].toLowerCase()} meaning and example sentence`
  const sk = String(it.sk || "").trim()
  if (sub === "rc") return `${sk || "reading comprehension"} reading comprehension how to answer`
  if (sub === "vr") return `${sk || "vocabulary"} vocabulary explained`
  return `${sk || "math"} explained with examples`
}
export function learnUrl(sub, it) {
  const q = learnQuery(sub, it)
  return q ? "https://www.google.com/search?q=" + encodeURIComponent(q) : null
}
