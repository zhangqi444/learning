import * as React from "react"

/** The gate: shut, or swung open. Inline SVG and one gradient, so the
 *  single-file artifact stays self-contained.
 *
 *  Shared by the Wordkeep and by Verbal Reasoning practice, because they are
 *  the same act: 178 of the 330 VR items are a sentence with a word taken out,
 *  which is exactly what a gate inscription is. VR does not need a separate
 *  game bolted beside it — it needs to be drawn as the one it already is.
 *
 *  And by 选词填空 in the Chinese half (docs/chinese.md § 10.4): a sentence from
 *  the book with one 词语 taken out is the same gate in a second language, so
 *  it is drawn through this component rather than given one of its own. */
/** `glow` is the disc of light in the doorway. It stands in for "something came
 *  through" — so turn it off when an actual cat is being drawn in the opening,
 *  or the cat sits on a coloured plate. `zh`: the page is Chinese, so the
 *  gate's own name is (AGENTS.md § UI conventions). */
export function Gate({ open, className, glow = true, zh = false }) {
  const swing = (deg) => ({
    transition: "transform 500ms cubic-bezier(.34,1.56,.64,1)",
    transformOrigin: deg < 0 ? "44px 145px" : "196px 145px",
    transform: open ? `perspective(300px) rotateY(${deg}deg)` : "none",
  })
  const name = open ? (zh ? "门开了" : "The gate is open") : (zh ? "门关着" : "A shut gate")
  return (
    <svg viewBox="0 0 240 150" className={className} role="img" aria-label={name} data-testid="gate" data-open={open ? "1" : "0"}>
      <defs>
        <linearGradient id="gate-arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path d="M40 145 L40 60 A80 80 0 0 1 200 60 L200 145 Z" fill="url(#gate-arch)" stroke="var(--border)" strokeWidth="3" />
      {open && glow ? <circle cx="120" cy="105" r="30" fill="var(--primary)" opacity="0.45" /> : null}
      <g style={swing(-72)}>
        <path d="M48 143 L48 66 A72 72 0 0 1 118 62 L118 143 Z" fill="var(--card)" stroke="var(--border)" strokeWidth="2.5" />
      </g>
      <g style={swing(72)}>
        <path d="M192 143 L192 66 A72 72 0 0 0 122 62 L122 143 Z" fill="var(--card)" stroke="var(--border)" strokeWidth="2.5" />
      </g>
    </svg>
  )
}

/** How a Verbal Reasoning item reads as an inscription.
 *  - a sentence with a blank is already one, verbatim
 *  - "RESOLUTE most nearly means:" becomes a rune bearing the word
 *  - anything else is left exactly as written rather than mangled to fit
 *  `zh` says the lead line in Chinese, for a Chinese gate on a Chinese page. */
export function inscribe(q, { zh = false } = {}) {
  const text = String(q || "")
  const lead = zh ? "门上刻着" : "The gate is inscribed"
  if (/_{3,}|…{2,}/.test(text)) return { kind: "sentence", lead, text }
  const syn = /^([A-Z][A-Z\-' ]+?)\s+most nearly means[:.]?$/.exec(text.trim())
  if (syn) return { kind: "rune", lead: "The rune reads", text: syn[1].trim(), tail: "Cast the spell that means the same." }
  return { kind: "plain", lead, text }
}

/** A 选词填空 prompt is the book's instruction and then its sentence; the gate is
 *  inscribed with the sentence, and the instruction is what the lead line says.
 *  The English twin's "Fill the blank:" goes the same way, so the inscription
 *  is the material and reads the same in both languages. */
export const strip = (q) => String(q || "").replace(/^(选词填空|Fill the blank)[:：]\s*/, "")
