/* Sound, synthesised. No audio files anywhere: the single-file artifact build
 * asserts zero external requests, and a handful of oscillators costs nothing to
 * ship. The AudioContext is built lazily on the first play — which always comes
 * after a click — so the browser's autoplay policy never has anything to block.
 *
 * Hard rule 3 applies to sound as much as to colour. `wrong` is a soft, low,
 * consonant note, not a buzzer: it marks the moment without making it feel like
 * a failure. Nothing here plays unprompted, and `muted` silences all of it. */
import { Store } from "./store"
import { callHz } from "./glim"

let ctx = null

function audio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume()
    return ctx
  }
  const C = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)
  if (!C) return null
  try { ctx = new C() } catch { return null }
  return ctx
}

/** One note. `at` is seconds from now; `slide` bends to a second frequency. */
function note(a, freq, at, dur, { type = "sine", gain = 0.09, slide = null } = {}) {
  const osc = a.createOscillator(), vol = a.createGain()
  const t0 = a.currentTime + at
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur)
  // A short fade at each end: a square-edged gate is what makes synthesised
  // blips click and sound cheap.
  vol.gain.setValueAtTime(0.0001, t0)
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(vol).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

const VOICES = {
  pick: (a) => note(a, 520, 0, 0.05, { type: "triangle", gain: 0.045 }),
  right: (a) => { note(a, 660, 0, 0.09, { type: "triangle" }); note(a, 990, 0.07, 0.12, { type: "triangle" }) },
  // Deliberately gentle: low, short, and in tune. It says "noted", not "wrong".
  wrong: (a) => note(a, 300, 0, 0.16, { type: "sine", gain: 0.06, slide: 240 }),
  finish: (a) => [523, 659, 784, 1047].forEach((f, i) => note(a, f, i * 0.075, 0.2, { type: "triangle", gain: 0.08 })),
  badge: (a) => [784, 1047, 1319].forEach((f, i) => note(a, f, i * 0.06, 0.3, { type: "triangle", gain: 0.1 })),
}

/* ---------- the cats' own voices ----------
 * Every cat's call comes out of the same hash as its coat (lib/glim.js), so
 * `benign` sounds like `benign` on every device forever. It is two rising notes
 * from a pentatonic scale, which is why five gates in a row never produce a sour
 * interval. She stops hearing "a correct-answer noise" and starts hearing which
 * cat arrived — and on a wrong call she hears that it is the wrong one before
 * she has read a word of the explanation. That is the lesson, delivered in
 * 300 milliseconds. */

/** The cat you called, arriving: its two notes, up, bright. */
VOICES.call = (a, word) => {
  const [lo, hi] = callHz(word)
  note(a, lo, 0, 0.13, { type: "triangle", gain: 0.08 })
  note(a, hi, 0.105, 0.24, { type: "triangle", gain: 0.085, slide: hi * 1.03 })
}

/** Somebody else's cat, arriving. The same shape, so it is unmistakably a cat
 *  answering — just not the one she wanted. Softer and lower, with one quiet
 *  note underneath. Never a buzzer (hard rule 3). */
VOICES.miscall = (a, word) => {
  const [lo, hi] = callHz(word)
  note(a, lo * 0.5, 0, 0.2, { type: "sine", gain: 0.05 })
  note(a, lo, 0.06, 0.16, { type: "triangle", gain: 0.055 })
  note(a, hi * 0.5, 0.17, 0.26, { type: "triangle", gain: 0.05 })
}

/** The end of a run, sung by the cats that came — in the order they came.
 *  Every call is drawn from the same pentatonic scale, so whichever five words
 *  she got right, the phrase is in tune; and because the phrase is built only
 *  from the ones that answered, a run of two is a short tune rather than a tune
 *  with three wrong notes in it. Nothing is added for a miss (rule 4). */
VOICES.chorus = (a, words) => {
  const list = (words || []).slice(0, 8)
  if (!list.length) return VOICES.finish(a)
  list.forEach((w, i) => {
    const [lo, hi] = callHz(w)
    note(a, lo, i * 0.155, 0.19, { type: "triangle", gain: 0.075 })
    // the last cat gets its full rising call, so the phrase lands rather than stops
    if (i === list.length - 1) note(a, hi, i * 0.155 + 0.14, 0.34, { type: "triangle", gain: 0.085 })
  })
}

export function sfx(name, arg) {
  if (Store.s && Store.s.muted) return
  const voice = VOICES[name]
  if (!voice) return
  const a = audio()
  if (!a) return
  try { voice(a, arg) } catch { /* an audio failure must never break the page */ }
}

export const muted = () => !!(Store.s && Store.s.muted)
export const toggleMuted = () => Store.setPref("muted", !muted())
