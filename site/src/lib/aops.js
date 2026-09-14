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

/* ---------- our own explainer ---------- */
/** What we teach about a skill ourselves.
 *
 *  The AoPS pointer assumes a subscription: Beast Academy and the Prealgebra
 *  book both cost money, and only Alcumus and the videos are free. A child whose
 *  family does not buy those had no way back into a question she got wrong. This
 *  is first-party, bundled and offline — it costs nothing, needs no account, and
 *  works in the single-file artifact where no request can be made at all. The
 *  chapter and the outside links sit beside it as extras, each marked free or
 *  paid so nobody finds out by hitting a paywall. */
export function learnCard(skill) { return (D.learn && D.learn.skills && D.learn.skills[skill]) || null }

/** Site-scoped searches rather than deep links. A deep link that 404s in two
 *  years is worse than a search that always lands on the right page, and these
 *  cannot be verified from the environment that writes them. */
const HOSTS = { "Khan Academy": "khanacademy.org", "Math is Fun": "mathsisfun.com", "BBC Bitesize": "bbc.co.uk/bitesize", "ReadWriteThink": "readwritethink.org" }
export function learnLinkUrl(link) {
  const host = HOSTS[link.name]
  const q = host ? `site:${host} ${link.q}` : link.q
  return "https://www.google.com/search?q=" + encodeURIComponent(q)
}
