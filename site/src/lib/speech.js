/* A word read aloud in the device's own voice.
 *
 * Dictation means writing a character from hearing it, so the one thing the
 * site must be able to do is say the word. The browser can: `speechSynthesis`
 * speaks with the voices the operating system ships, and Apple ships half a
 * dozen zh_CN ones on a Mac and the same family on an iPad. No server, no
 * third party, nothing leaves the device — which is what AGENTS.md's "no
 * backend, ever" requires. It can only start from a tap (the same gesture rule
 * that bites the Google popup), so every caller is a button.
 *
 * Nothing here throws. A browser with no Chinese voice says the word in whatever
 * voice it has, and a headless one with none at all does nothing — the page
 * must not go quiet with an error attached, which is also why the test stubs
 * `speechSynthesis.speak` rather than the whole object. */
const PREFER = ["Tingting", "Ting-Ting", "Flo", "Eddy", "Reed", "Grandma", "Grandpa", "Rocko", "Meijia"]
let voices = []
function load() { try { voices = speechSynthesis.getVoices() || [] } catch { voices = [] } }
if (typeof speechSynthesis !== "undefined") {
  load()
  try { speechSynthesis.addEventListener("voiceschanged", load) } catch { /* older WebKit: getVoices() is synchronous there */ }
}
export function canSpeak() { return typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined" }
/** The best Chinese voice present: mainland first, then any zh, by a short preference list. */
export function zhVoice() {
  if (!voices.length) load()
  const zh = voices.filter((v) => /^zh([-_]|$)/i.test(v.lang || ""))
  const cn = zh.filter((v) => /zh[-_]CN/i.test(v.lang || ""))
  const pool = cn.length ? cn : zh
  for (const n of PREFER) { const hit = pool.find((v) => (v.name || "").startsWith(n)); if (hit) return hit }
  return pool[0] || null
}
/** Say `text` in Chinese. Returns whether it was handed to the synthesizer. */
export function speak(text, { rate = 0.85 } = {}) {
  if (!canSpeak() || !text) return false
  try {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(String(text))
    u.lang = "zh-CN"
    const v = zhVoice(); if (v) u.voice = v
    u.rate = rate
    speechSynthesis.speak(u)
    return true
  } catch { return false }
}
