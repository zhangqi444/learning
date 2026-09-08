import * as React from "react"

import { traits } from "@/lib/glim"
import { cn } from "@/lib/utils"

/* Drawing one cat.
 *
 * The shape is fixed — a sitting cat, facing you — and everything that makes it
 * *this* cat comes out of lib/glim.js. The stage is the only thing that is not
 * about identity: it is how much of the cat is there, which is how well she
 * knows the word. An Unseen cat is two eyes and a shadow; a Radiant one is lit
 * from inside. She can read the whole Glimbook at a glance without a legend.
 *
 * Animation is inline `animation`, not a Tailwind class, because index.css kills
 * every animation under prefers-reduced-motion with `!important` — which beats a
 * non-important inline style. Each animation is written so that its resting
 * frame is the correct picture, so a still cat is never a wrong cat. */

const BODY = "M32 31 C21 31 15 43 13.5 55 C13.2 57.2 14.2 58.5 16.4 58.5 L47.6 58.5 C49.8 58.5 50.8 57.2 50.5 55 C49 43 43 31 32 31 Z"
const EAR_L = "M21 16 L18.5 4.5 L30.5 11.5 Z"
const EAR_R = "M43 16 L45.5 4.5 L33.5 11.5 Z"
const IN_L = "M22.4 14.8 L20.8 8.2 L28.6 12.6 Z"
const IN_R = "M41.6 14.8 L43.2 8.2 L35.4 12.6 Z"
const TAIL = "M47 57 C58.5 57.5 61 44 53.5 38.5"

/* body: how much of the cat is drawn · glow: the halo · eyes: always the last
 * thing to go, because a cat in the dark is a pair of eyes. */
const STAGE = {
  Unseen: { body: 0.09, glow: 0, eyes: 0.4, anim: null },
  Glimpsed: { body: 0.38, glow: 0.05, eyes: 0.8, anim: null },
  Flickering: { body: 0.66, glow: 0.1, eyes: 0.95, anim: "glim-flicker 2.6s ease-in-out infinite" },
  Steady: { body: 1, glow: 0.12, eyes: 1, anim: null },
  Bright: { body: 1, glow: 0.3, eyes: 1, anim: "glim-breathe 4.4s ease-in-out infinite" },
  Radiant: { body: 1, glow: 0.55, eyes: 1, anim: "glim-breathe 3.6s ease-in-out infinite" },
}
export const STAGES = Object.keys(STAGE)

function Markings({ t }) {
  const stroke = { stroke: t.mark, strokeWidth: 1.8, strokeLinecap: "round", fill: "none", opacity: 0.75 }
  if (t.marking === "tabby") return <path d="M22 40 q10 3 20 0 M20.5 47 q11.5 3.5 23 0" {...stroke} strokeWidth={2.2} />
  // the head's own tabby stripes are drawn with the head: this group is clipped
  // to the body, and anything above the neck would be clipped away
  if (t.marking === "patch") {
    return (
      <g fill={t.mark} opacity={0.55}>
        <ellipse cx="24" cy="19" rx="8.5" ry="7.5" />
        <ellipse cx="41" cy="47" rx="9" ry="7" />
      </g>
    )
  }
  if (t.marking === "spots") {
    return (
      <g fill={t.mark} opacity={0.5}>
        {[[24, 40], [33, 44], [41, 39], [28, 50], [39, 51]].map(([x, y]) => <circle key={x + "-" + y} cx={x} cy={y} r="2.6" />)}
      </g>
    )
  }
  if (t.marking === "bib") {
    return <path d="M32 31 C27 40 25.5 50 26.5 58.5 L37.5 58.5 C38.5 50 37 40 32 31 Z" fill="#fff" opacity={0.55} />
  }
  return null
}

/**
 * @param word  which cat — the word itself, so the same word is the same cat
 * @param stage one of STAGES; how much of it is there
 */
export function Glim({ word, stage = "Steady", className, title }) {
  const t = traits(word)
  const s = STAGE[stage] || STAGE.Steady
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const clip = "glim-c-" + uid
  const halo = "glim-h-" + uid
  const name = title || `${word} — ${stage}`

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={name}
      data-testid="glim"
      data-word={word}
      data-stage={stage}
      data-marking={t.marking}
      data-coat={t.coat}
    >
      <defs>
        <radialGradient id={halo}>
          <stop offset="0%" stopColor={t.coat} stopOpacity="0.85" />
          <stop offset="100%" stopColor={t.coat} stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}><path d={BODY} /></clipPath>
      </defs>

      {/* the animation goes on a wrapper, never on the element carrying the
          stage's own opacity: SVG multiplies nested group opacity, but a CSS
          animation on `opacity` would replace the attribute outright and a
          Flickering cat would flare to full brightness. */}
      {s.glow ? (
        <g style={s.anim ? { animation: s.anim, transformOrigin: "32px 34px" } : undefined}>
          <circle cx="32" cy="34" r="31" fill={`url(#${halo})`} opacity={s.glow} />
        </g>
      ) : null}

      <g style={s.anim ? { animation: s.anim, transformOrigin: "32px 46px" } : undefined}>
        {/* tail first, so it sits behind the body; mirrored for half the cats */}
        <g opacity={s.body} transform={t.tail < 0 ? "translate(64,0) scale(-1,1)" : undefined}>
          <path d={TAIL} fill="none" stroke={t.coat} strokeWidth="5.5" strokeLinecap="round" />
        </g>

        <g opacity={s.body}>
          <path d={BODY} fill={t.coat} />
          <g clipPath={`url(#${clip})`}><Markings t={t} /></g>
          {/* front paws */}
          <ellipse cx="23.5" cy="56" rx="5.2" ry="3" fill={t.coat} stroke={t.mark} strokeWidth="0.6" strokeOpacity="0.35" />
          <ellipse cx="40.5" cy="56" rx="5.2" ry="3" fill={t.coat} stroke={t.mark} strokeWidth="0.6" strokeOpacity="0.35" />
        </g>

        <g transform={`rotate(${t.tilt} 32 30)`}>
          <g opacity={s.body}>
            <path d={EAR_L} fill={t.coat} />
            <path d={EAR_R} fill={t.coat} />
            <path d={IN_L} fill={t.nose} opacity="0.8" />
            <path d={IN_R} fill={t.nose} opacity="0.8" />
            <ellipse cx="32" cy="23" rx="13.5" ry="11.8" fill={t.coat} />
            {t.marking === "tabby" ? <path d="M26 11.5 v4.5 M32 10.5 v5.5 M38 11.5 v4.5" stroke={t.mark} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.75" /> : null}
            {t.marking === "patch" ? <ellipse cx="24" cy="19" rx="8.5" ry="7.5" fill={t.mark} opacity="0.45" /> : null}
            <path d="M30 27.6 L34 27.6 L32 30.2 Z" fill={t.nose} />
            <path d="M32 30.2 v1.3 M32 31.5 q-2.2 1.7 -3.9 0 M32 31.5 q2.2 1.7 3.9 0" fill="none" stroke={t.mark} strokeWidth="1" strokeLinecap="round" opacity="0.65" />
            <path d="M20 28 L9.5 26 M20 30 L9 30.5 M44 28 L54.5 26 M44 30 L55 30.5" fill="none" stroke={t.coat} strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
          </g>
          {/* the eyes outlast the cat: at Unseen this is all there is */}
          <g opacity={s.eyes}>
            <ellipse cx="26.4" cy="23" rx="3.7" ry="4.3" fill={t.eye} />
            <ellipse cx="37.6" cy="23" rx="3.7" ry="4.3" fill={t.eye} />
            <ellipse cx="26.4" cy="23" rx="1.25" ry="3.5" fill="#1a1a24" />
            <ellipse cx="37.6" cy="23" rx="1.25" ry="3.5" fill="#1a1a24" />
            <circle cx="25.3" cy="21.3" r="0.95" fill="#fff" opacity="0.9" />
            <circle cx="36.5" cy="21.3" r="0.95" fill="#fff" opacity="0.9" />
          </g>
        </g>
      </g>
    </svg>
  )
}
