import * as React from "react"

import { describe, traits } from "@/lib/glim"
import { sfx } from "@/lib/sfx"
import { cn } from "@/lib/utils"

/* A cat you can ask to speak. The behaviour is shared, the markup is not: the
 * review pile wraps a caption with its cat and the Glimbook does not, so each
 * place keeps its own layout and takes only the part that must be identical —
 * what the click does, what a screen reader is told, and that it is reachable by
 * keyboard. Cats that are *controls* (the hand of names in the Wordwood, where
 * clicking casts) deliberately do not get this: one click, one meaning. */
export const hearProps = (word, { label, className } = {}) => ({
  type: "button",
  onClick: () => sfx("call", word),
  "aria-label": `Hear ${label || word}`,
  "data-testid": "hear-glim",
  className: cn(
    // `glim-hear` is what index.css hangs the tail on: a cat you can tap looks
    // exactly like a cat you cannot, so it answers the cursor before the click.
    "glim-hear focus-visible:ring-ring/50 rounded-lg transition-transform outline-none hover:scale-110 focus-visible:ring-[3px]",
    className,
  ),
})

/* Drawing one cat.
 *
 * The build decides the silhouette and the coat decides the colours and the
 * markings, both out of lib/glim.js. The stage is the only thing that is not
 * about identity: it is how much of the cat is there, which is how well she
 * knows the word. An Unseen cat is two eyes and a shadow; a Radiant one is lit
 * from inside. She can read the whole Glimbook at a glance without a legend.
 *
 * Animation is inline `animation`, not a Tailwind class, because index.css kills
 * every animation under prefers-reduced-motion with `!important` — which beats a
 * non-important inline style. Each animation is written so that its resting
 * frame is the correct picture, so a still cat is never a wrong cat. */

/* Three silhouettes. Shorthair is round and low, longhair is the same cat with a
 * ruff and a plume of a tail, oriental is taller and leaner with bigger ears. */
const BUILD = {
  short: { body: "M32 30 C19 30 13.5 43 12.5 55.5 C12.2 57.6 13.3 58.8 15.6 58.8 L48.4 58.8 C50.7 58.8 51.8 57.6 51.5 55.5 C50.5 43 45 30 32 30 Z", headRx: 14.2, headRy: 12.4, ear: 1, tailW: 5.5, ruff: false },
  long: { body: "M32 30 C18 30 11.5 43.5 10.8 56 C10.6 58 11.8 59 14 59 L50 59 C52.2 59 53.4 58 53.2 56 C52.5 43.5 46 30 32 30 Z", headRx: 13.6, headRy: 12.2, ear: 1.15, tailW: 9, ruff: true },
  slim: { body: "M32 31 C22 31 17 44 16 56 C15.8 58 16.8 59 19 59 L45 59 C47.2 59 48.2 58 48 56 C47 44 42 31 32 31 Z", headRx: 12.2, headRy: 11.4, ear: 1.35, tailW: 4, ruff: false },
}
const TAIL = { short: "M47 57 C58.5 57.5 61 44 53.5 38.5", long: "M48 57 C61 57.5 63 42 53 36.5", slim: "M45 57.5 C57 58 60 43 52 37" }

/* body: how much of the cat is drawn · glow: the halo · eyes: always the last
 * thing to go, because a cat in the dark is a pair of eyes.
 *
 * near: how close it has come. The world bible's own first line about cats is
 * that one which does not know you "keeps its distance and watches from
 * somewhere high", and until now that was said only in opacity — nothing was
 * ever actually far away. So the same honest number is read twice: a cat she
 * does not know yet draws small and high in its box, and each stage brings it
 * lower, nearer and larger until a Radiant one fills the frame. Derived from the
 * stage every time, never stored, exactly as brightness is (rule 3), and
 * `atLeast` still floors a cat she has just called right — being correct is
 * never drawn as distant any more than it is drawn as faint. The box itself does
 * not move: distance happens inside the cat's own square, so a shelf of them
 * stays a grid. */
const STAGE = {
  Unseen: { body: 0.09, glow: 0, eyes: 0.4, anim: null, near: 0.56, lift: -9 },
  Glimpsed: { body: 0.38, glow: 0.05, eyes: 0.8, anim: null, near: 0.7, lift: -6 },
  Flickering: { body: 0.66, glow: 0.1, eyes: 0.95, anim: "glim-flicker 2.6s ease-in-out infinite", near: 0.82, lift: -3.5 },
  Steady: { body: 1, glow: 0.12, eyes: 1, anim: null, near: 0.92, lift: -1.5 },
  Bright: { body: 1, glow: 0.3, eyes: 1, anim: "glim-breathe 4.4s ease-in-out infinite", near: 0.98, lift: -0.5 },
  Radiant: { body: 1, glow: 0.55, eyes: 1, anim: "glim-breathe 3.6s ease-in-out infinite", near: 1, lift: 0 },
}
export const STAGES = Object.keys(STAGE)

/** Everything drawn on top of the body, clipped to it. */
function Coat({ t, b }) {
  const c = t.coat
  const out = []
  if (c.pattern === "tabby") {
    out.push(<path key="s" d="M20 38 q12 4 24 0 M18.5 45 q13.5 4.5 27 0 M20 52 q12 4 24 0" stroke={c.mark} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.8" />)
  }
  if (c.pattern === "shaded") {
    // colour sits on the back and fades down the sides, the way tipping looks
    out.push(<path key="sh" d="M32 30 C18 30 12 46 12 60 h40 C52 46 46 30 32 30 Z" fill={c.mark} opacity="0.28" />)
  }
  if (c.pattern === "point") {
    // the dark points: chest stays pale, legs go dark at the bottom
    out.push(<path key="p" d="M12 52 h40 v10 h-40 Z" fill={c.mark} opacity="0.85" />)
  }
  if (c.pattern === "patched") {
    out.push(<ellipse key="p1" cx="23" cy="42" rx="10" ry="8" fill={c.patch} opacity="0.9" />)
    out.push(<ellipse key="p2" cx="42" cy="52" rx="9" ry="7" fill={c.patch} opacity="0.9" />)
    if (c.id === "calico") out.push(<ellipse key="p3" cx="38" cy="38" rx="7" ry="6" fill={c.mark} opacity="0.85" />)
  }
  // a white bib is the commonest marking there is, and it is what stops two
  // brown tabbies from being the same brown tabby
  if (t.bib || c.pattern === "tuxedo") {
    out.push(<path key="b" d="M32 30 C27 39 25.5 50 26.5 59 L37.5 59 C38.5 50 37 39 32 30 Z" fill={c.belly} opacity={c.pattern === "tuxedo" ? 1 : 0.85} />)
  }
  return <g>{out}</g>
}

/**
 * @param word  which cat — the word itself, so the same word is the same cat
 * @param stage one of STAGES; how much of it is there
 */
/* `blink` is a seed, not a boolean: change it and the cat blinks once. A cat's
 * slow blink is how it says it trusts you, so it is this app's acknowledgement —
 * fired when something has genuinely happened, never on a timer. Passing the
 * same value twice does nothing, which is what keeps it honest. */
/* `arrive` is for a cat that is *entering* — the gate, a reveal, a door. It
 * walks in from the edge of its own square instead of appearing in the middle of
 * it. Off by default, and it should stay off anywhere a cat is simply present:
 * a Glimbook of forty cats all walking in on load is a stampede, and the
 * primitive means "somebody came", which is only true in a few places. */
export function Glim({ word, stage = "Steady", className, title, blink = 0, arrive = false }) {
  const t = traits(word)
  const c = t.coat
  const b = BUILD[t.build] || BUILD.short
  const s = STAGE[stage] || STAGE.Steady
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const clip = "glim-c-" + uid
  const halo = "glim-h-" + uid
  /* Every cat says what it is, everywhere, without each caller having to
     remember to ask: the label it is known by, then its coat and build, then how
     well she knows it. Composed here rather than passed in because "what kind of
     cat is that" should never depend on which page you are looking at. */
  const name = `${title || word} · ${describe(word)} · ${stage}`
  // a black cat on a dark page needs an edge, or it is a hole in the screen
  const rim = c.dark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.16)"
  const pawFill = t.socks ? c.belly : c.pattern === "point" ? c.mark : c.base
  const earIn = c.pattern === "point" ? c.mark : c.nose

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={name}
      data-testid="glim"
      data-word={word}
      data-stage={stage}
      data-marking={c.id}
      data-build={t.build}
      data-coat={c.base}
      data-near={s.near}
    >
      <defs>
        <radialGradient id={halo}>
          <stop offset="0%" stopColor={c.dark ? c.belly : c.base} stopOpacity="0.85" />
          <stop offset="100%" stopColor={c.dark ? c.belly : c.base} stopOpacity="0" />
        </radialGradient>
        <clipPath id={clip}><path d={b.body} /></clipPath>
      </defs>

      {/* Walking in. Its own wrapper, outside the distance group rather than
          inside it, for two reasons: distance is a transform as well and one
          element cannot carry both, and a cat that is far away should still
          cross the same ground to get here. `key` restarts the walk when a
          different cat comes to the same gate. */}
      <g
        key={`arrive-${arrive ? word : ""}`}
        data-testid={arrive ? "glim-arrive" : undefined}
        style={arrive ? { animation: "glim-arrive 760ms cubic-bezier(.22,.68,.3,1)", "--glim-in": t.tail } : undefined}
      >

      {/* How far off she is. Scaled about the cat's own middle and lifted, so a
          distant one sits small and high in its square rather than shrinking
          into the corner of it. A plain attribute, not a CSS transform: the
          animations below already use `transform`, and two of them on one
          element would have the breathing replace the distance. */}
      <g transform={`translate(32 ${34 + s.lift}) scale(${s.near}) translate(-32 -34)`}>

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
          {/* the lift on hover rides its own wrapper: the mirror above is a
              transform, and an animation on the same element would flip half the
              cats back the right way round for the length of it. */}
          <g className="glim-tail">
            <path d={TAIL[t.build]} fill="none" stroke={c.pattern === "point" ? c.mark : c.base} strokeWidth={b.tailW} strokeLinecap="round" />
            {c.pattern === "tabby" ? <path d={TAIL[t.build]} fill="none" stroke={c.mark} strokeWidth={b.tailW} strokeLinecap="round" strokeDasharray="2.5 5" opacity="0.75" /> : null}
          </g>
        </g>

        <g opacity={s.body}>
          <path d={b.body} fill={c.base} stroke={rim} strokeWidth="0.8" />
          <g clipPath={`url(#${clip})`}><Coat t={t} b={b} /></g>
          {/* a longhair's ruff, drawn over the body edge so it reads as fur */}
          {b.ruff ? <path d="M20 33 q12 11 24 0 q-3 9 -12 10 q-9 -1 -12 -10 Z" fill={c.belly} opacity="0.55" /> : null}
          <ellipse cx="23.5" cy="56.2" rx="5.2" ry="3" fill={pawFill} stroke={rim} strokeWidth="0.7" />
          <ellipse cx="40.5" cy="56.2" rx="5.2" ry="3" fill={pawFill} stroke={rim} strokeWidth="0.7" />
        </g>

        <g transform={`rotate(${t.tilt} 32 30)`}>
          <g opacity={s.body}>
            {/* ears scale with the build: a shorthair's are small and round, an
                oriental's are tall — it is the fastest way to read a breed */}
            <g transform={`translate(32 16) scale(${b.ear}) translate(-32 -16)`}>
              {/* One ear turns now and then. Its own wrapper again, because the
                  scale above is a transform; and its own delay, taken from the
                  same tilt the hash already chose, so a shelf of cats does not
                  twitch in unison like a row of clockwork. */}
              <g style={{ animation: "glim-ear 11s ease-in-out infinite", animationDelay: `${((t.tilt + 4) * 1.3).toFixed(1)}s`, transformOrigin: "22px 16px" }}>
                <path d="M21 17 L18.5 4.5 L30.5 12 Z" fill={c.pattern === "point" ? c.mark : c.base} stroke={rim} strokeWidth="0.8" strokeLinejoin="round" />
                <path d="M22.6 15.4 L21 8.6 L28.8 13 Z" fill={earIn} opacity="0.85" />
              </g>
              <path d="M43 17 L45.5 4.5 L33.5 12 Z" fill={c.pattern === "point" ? c.mark : c.base} stroke={rim} strokeWidth="0.8" strokeLinejoin="round" />
              <path d="M41.4 15.4 L43 8.6 L35.2 13 Z" fill={earIn} opacity="0.85" />
            </g>
            <ellipse cx="32" cy="23" rx={b.headRx} ry={b.headRy} fill={c.base} stroke={rim} strokeWidth="0.8" />
            {/* a seal point's mask, the darkest thing on the whole cat */}
            {c.pattern === "point" ? <ellipse cx="32" cy="26" rx="10.5" ry="8.5" fill={c.mark} opacity="0.9" /> : null}
            {c.pattern === "tabby" ? <path d="M26 11.5 v5 M32 10.5 v6 M38 11.5 v5" stroke={c.mark} strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.85" /> : null}
            {c.pattern === "shaded" ? <path d="M32 11 C24 11 20 17 20 22 h24 C44 17 40 11 32 11 Z" fill={c.mark} opacity="0.22" /> : null}
            {c.pattern === "patched" ? <ellipse cx="24" cy="19" rx="8" ry="7" fill={c.patch} opacity="0.85" /> : null}
            {/* a white muzzle, which nearly every marked cat has */}
            {t.bib || c.pattern === "tuxedo" ? <ellipse cx="32" cy="29" rx="7.5" ry="5" fill={c.belly} opacity="0.9" /> : null}
            <path d="M29.4 27.3 L34.6 27.3 L32 30.6 Z" fill={c.nose} stroke={rim} strokeWidth="0.4" />
            <path d="M32 30.2 v1.3 M32 31.5 q-2.2 1.7 -3.9 0 M32 31.5 q2.2 1.7 3.9 0" fill="none" stroke={c.mark} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
            {/* whiskers have to contrast with the CAT, not match it: drawn in
                the belly colour a cream cat's whiskers vanished entirely */}
            <path d="M20 28 L9.5 26 M20 30 L9 30.5 M44 28 L54.5 26 M44 30 L55 30.5" fill="none" stroke={c.dark ? c.belly : c.mark} strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
          </g>
          {/* the eyes outlast the cat: at Unseen this is all there is */}
          <g opacity={s.eyes}>
            {/* the blink rides its own wrapper, for the reason at the top of the
                file: the stage's opacity lives on the group above and an
                animation must never be in a position to replace it. `key`
                restarts the run when the seed changes. */}
            <g
              key={`blink-${blink}`}
              data-testid={blink ? "glim-blink" : undefined}
              style={blink ? { animation: "glim-blink 620ms ease-in-out", transformOrigin: "32px 23px" } : undefined}
            >
              <ellipse cx="26.4" cy="23" rx="3.8" ry="4.4" fill={t.eye} />
              <ellipse cx="37.6" cy="23" rx="3.8" ry="4.4" fill={t.eye} />
              <ellipse cx="26.4" cy="23" rx="1.3" ry="3.6" fill="#16161c" />
              <ellipse cx="37.6" cy="23" rx="1.3" ry="3.6" fill="#16161c" />
              <circle cx="25.2" cy="21.2" r="1" fill="#fff" opacity="0.95" />
              <circle cx="36.4" cy="21.2" r="1" fill="#fff" opacity="0.95" />
            </g>
          </g>
        </g>
      </g>
      </g>
      </g>
    </svg>
  )
}
