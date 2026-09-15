/* Sound, synthesised. No audio files anywhere: the single-file artifact build
 * asserts zero external requests, and a handful of oscillators costs nothing to
 * ship. The AudioContext is built lazily on the first play — which always comes
 * after a click — so the browser's autoplay policy never has anything to block.
 *
 * Hard rule 3 applies to sound as much as to colour. `wrong` is a soft, low,
 * consonant note, not a buzzer: it marks the moment without making it feel like
 * a failure. Nothing here plays unprompted, and `muted` silences all of it. */
import { Store } from "./store"
import { callHz, traits } from "./glim"

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

/* ---------- a cat's mouth ----------
 * A meow is a pitch contour pushed through moving vowel formants, and a formant
 * is a bandpass filter. So a cat's call is built the way a voice is: a buzzy
 * source at the pitch it already had, shaped by two filters that glide along a
 * vowel path. Nothing here touches pitch, which is the whole point — the
 * pentatonic guarantee is a guarantee about *pitch*, so it survives untouched
 * while the timbre stops being a beep. Timbre is free; pitch is load-bearing.
 *
 * The path is chosen by the cat's own build, which the same hash already picked,
 * so a cat's accent is as fixed as its coat. It is also true of real cats: an
 * oriental is the one that will not stop telling you things, in a brighter and
 * more nasal voice than a shorthair, and a longhair is softer than both. */
const VOWELS = {
  // "mrrp?" — open, closing gently
  short: [[720, 1150], [520, 940], [420, 820]],
  // softer and rounder, and it closes further
  long: [[640, 1020], [470, 860], [380, 740]],
  // Siamese: starts nearly "ee", opens wide, stays bright
  slim: [[430, 2150], [820, 1520], [640, 1180]],
}

/* The mouth shut, which is the whole of what an `m` is.
 *
 * docs/cats.md §3 left this open and named the instrument: "a noise burst at the
 * onset". That was wrong about the phonetics, and following it would have made
 * the cat worse. A burst is a plosive — the sound of a closure being released,
 * which is a `p` or a `t`. An `m` is a *nasal*: the voicing never stops, the
 * lips stay shut, the sound leaves through the nose, and what you hear is the
 * same note with everything above the nasal murmur taken away and most of the
 * level with it. White noise in front of a meow does not read as "m", it reads
 * as a "ts" — a cat with a lisp.
 *
 * So there is no noise here, and the happy consequence is that the audio stub
 * needs nothing added to it: this is two filter frequencies and a gain ramp,
 * every one of which the fake context already records. The pentatonic guarantee
 * is a guarantee about pitch, and the pitch count does not move — a call is
 * still exactly two notes. */
const NASAL = [250, 420]

/** One voiced note: the same pitch as `note()` would play, through a mouth.
 *  `onset` is how long the mouth stays shut before the vowel opens — the `m`. */
function voiced(a, freq, at, dur, { gain = 0.09, slide = null, vowel = "short", q = 7, onset = 0 } = {}) {
  const osc = a.createOscillator(), vol = a.createGain()
  const f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter()
  const t0 = a.currentTime + at
  // sawtooth, not triangle: formants can only shape harmonics that are there.
  osc.type = "sawtooth"
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur)
  const path = VOWELS[vowel] || VOWELS.short
  f1.type = "bandpass"; f2.type = "bandpass"
  f1.Q.value = q; f2.Q.value = q
  // where the vowel starts, and when: with an onset the filters begin shut and
  // travel to the first vowel frame, which IS the mouth opening.
  const open = t0 + onset
  const span = Math.max(dur - onset, 0.04)
  f1.frequency.setValueAtTime(onset ? NASAL[0] : path[0][0], t0)
  f2.frequency.setValueAtTime(onset ? NASAL[1] : path[0][1], t0)
  if (onset) {
    f1.frequency.linearRampToValueAtTime(path[0][0], open)
    f2.frequency.linearRampToValueAtTime(path[0][1], open)
  }
  for (let i = 1; i < path.length; i++) {
    const t = open + (span * i) / (path.length - 1)
    f1.frequency.linearRampToValueAtTime(path[i][0], t)
    f2.frequency.linearRampToValueAtTime(path[i][1], t)
  }
  vol.gain.setValueAtTime(0.0001, t0)
  if (onset) {
    // a closed mouth is quiet: up to the murmur, hold there while it is shut,
    // then open. The hold is what makes it a sound rather than a click.
    vol.gain.exponentialRampToValueAtTime(gain * 0.34, t0 + Math.min(0.015, onset * 0.4))
    vol.gain.setValueAtTime(gain * 0.34, open)
    vol.gain.exponentialRampToValueAtTime(gain, open + 0.03)
  } else {
    vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  }
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  // The two formants sit in parallel across the source, which is what a vowel
  // is; in series they would cancel to a whistle.
  osc.connect(f1); osc.connect(f2)
  f1.connect(vol); f2.connect(vol)
  vol.connect(a.destination)
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

/** The cat you called, arriving: its two notes, up, bright — in its own mouth.
 *  The first note starts with the mouth shut, which is the `m`: the note is
 *  already sounding before the vowel opens, so what she hears begins as a cat
 *  rather than as a tone that a cat is later applied to. */
VOICES.call = (a, word) => {
  const [lo, hi] = callHz(word)
  const v = traits(word).build
  voiced(a, lo, 0, 0.13, { gain: 0.075, vowel: v, onset: 0.045 })
  voiced(a, hi, 0.105, 0.26, { gain: 0.08, vowel: v, slide: hi * 1.03 })
}

/** Somebody else's cat, arriving. The same shape, so it is unmistakably a cat
 *  answering — just not the one she wanted. Softer and lower, with one quiet
 *  note underneath. Never a buzzer (hard rule 3). */
VOICES.miscall = (a, word) => {
  const [lo, hi] = callHz(word)
  const v = traits(word).build
  note(a, lo * 0.5, 0, 0.2, { type: "sine", gain: 0.05 })
  voiced(a, lo, 0.06, 0.18, { gain: 0.05, vowel: v, onset: 0.04 })
  voiced(a, hi * 0.5, 0.17, 0.28, { gain: 0.048, vowel: v })
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
    const v = traits(w).build
    // every cat in the phrase opens its own mouth, or the chorus is a tune
    // with cats painted on it rather than cats singing
    voiced(a, lo, i * 0.155, 0.19, { gain: 0.07, vowel: v, onset: 0.028 })
    // the last cat gets its full rising call, so the phrase lands rather than stops
    if (i === list.length - 1) voiced(a, hi, i * 0.155 + 0.14, 0.36, { gain: 0.08, vowel: v })
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
