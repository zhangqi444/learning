/* Where a weak ISEE maths skill is taught in the AoPS material.
 * Reference only — a pointer into books the family already owns, plus the two
 * free things (Alcumus, the Prealgebra videos). Verbal and Reading have no
 * honest AoPS equivalent, so they get nothing rather than something vague. */
import { D } from "./content"

export const AOPS_SUBJECTS = ["ma", "qr"]
export function aopsFor(sub, skill) {
  if (!D.aops || !AOPS_SUBJECTS.includes(sub)) return null
  return D.aops.skills[skill] || D.aops.skills[learnName(skill)] || null
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
/** The card for a skill, under whatever name the question happens to use.
 *
 *  The practice bank is written against a tidy list of 53 skill names. The mock
 *  papers are not: they were written as real papers, so a question is tagged
 *  "percent reasoning—reverse discount" or "main idea—central idea". Those are
 *  better labels for a paper than "Percent" is, and rewriting them to match a
 *  lookup table would throw away what they say. So the names stay and the
 *  lookup widens: exact name, then the whole name lowercased, then the part
 *  before the dash. Without this every one of the 508 mock questions asked for a
 *  card, got null, and rendered nothing at all — the lesson looked present in
 *  the code and was absent from the page. */
export function learnName(skill) {
  if (!D.learn || !skill) return null
  const s = D.learn.skills, a = D.learn.aliases || {}
  if (s[skill]) return skill
  const low = String(skill).trim().toLowerCase()
  const head = low.split(/[\u2014\u2013]/)[0].trim()
  const hit = a[low] || a[head]
  return hit && s[hit] ? hit : null
}
export function learnCard(skill) { const n = learnName(skill); return n ? D.learn.skills[n] : null }

/** The lesson page itself where we have one, a site-scoped search where we do not.
 *  Khan Academy is free and its course structure is stable, so every card carries
 *  the exact unit, article or video for its skill — one tap from the mistake to the
 *  thing that teaches it, rather than a search page a ten-year-old has to read
 *  first. Math is Fun's pages are the same deal. Those URLs are the sites' own,
 *  taken from their indexed pages and not composed here, which is exactly why the
 *  four that remain are still searches: bbc.co.uk turns away the crawler that
 *  would have confirmed them, and a deep link nobody has ever opened is worse
 *  than a search that always lands somewhere. */
const HOSTS = { "Khan Academy": "khanacademy.org", "Math is Fun": "mathsisfun.com", "BBC Bitesize": "bbc.co.uk/bitesize", "ReadWriteThink": "readwritethink.org" }
export function learnLinkUrl(link) {
  if (link.url) return link.url
  const host = HOSTS[link.name]
  const q = host ? `site:${host} ${link.q}` : link.q
  return "https://www.google.com/search?q=" + encodeURIComponent(q)
}
