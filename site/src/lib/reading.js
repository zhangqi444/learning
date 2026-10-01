/* Reading aloud: her voice in, a transcript beside the passage, the two aligned.
 *
 * Three browser facilities, each wrapped so the page never has to know which is
 * missing: the microphone (getUserMedia + MediaRecorder, for the recording that
 * is kept), the speech recogniser (SpeechRecognition, zh-CN, for the transcript),
 * and the alignment, which is plain code. The recogniser is the one exception
 * this site makes to "nothing leaves the device" — in Chrome the audio goes to
 * Google, in Safari to Apple unless the iPad does Chinese dictation on-device —
 * and it is the owner's decision, recorded in AGENTS.md § Hard rules. The
 * transcript is therefore an estimate and is shown as one: what the recogniser
 * heard, not what she said. */

export const canRecord = () => typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof MediaRecorder !== "undefined"
const Recog = () => (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null
export const canRecognize = () => !!Recog()

/** Start the microphone. Resolves to { stop(): Promise<{ blob, mime, ms }> }. */
export async function startRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((m) => { try { return MediaRecorder.isTypeSupported(m) } catch { return false } }) || ""
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
  const chunks = [], t0 = Date.now()
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
  const done = new Promise((res) => { rec.onstop = () => res() })
  rec.start(1000)
  return {
    stop: async () => {
      try { rec.stop() } catch { /* already stopped */ }
      await done
      for (const t of stream.getTracks()) { try { t.stop() } catch { /* no-op */ } }
      return { blob: new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }), mime: rec.mimeType || mime, ms: Date.now() - t0 }
    },
  }
}

/** Start the recogniser. `onText(final, interim)` fires as words arrive. Resolves
 *  to { stop() }. iOS Safari ends a continuous session at the first silence, so
 *  it is restarted until stop() is called. */
export function startRecognition(onText) {
  const R = Recog()
  if (!R) return { stop() {} }
  let active = true, finals = ""
  const make = () => {
    const r = new R()
    r.lang = "zh-CN"; r.continuous = true; r.interimResults = true
    r.onresult = (e) => {
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = (e.results[i][0] && e.results[i][0].transcript) || ""
        if (e.results[i].isFinal) finals += t; else interim += t
      }
      onText(finals, interim)
    }
    r.onend = () => { if (active) { try { make() } catch { /* give up quietly */ } } }
    r.onerror = () => { /* "no-speech" and friends: onend follows and restarts */ }
    try { r.start() } catch { active = false }
    cur = r
  }
  let cur = null
  make()
  return { stop() { active = false; try { cur && cur.stop() } catch { /* already stopped */ } } }
}

/** Only the characters that can be read aloud: CJK, letters, digits. */
export const readable = (t) => (String(t || "").match(/[\p{Script=Han}\p{L}\p{N}]/gu) || [])
/** Align the passage against the transcript, character by character (longest
 *  common subsequence). Returns the passage as { ch, hit } plus the counts; a
 *  miss is a character the recogniser did not hear in order, which is either
 *  her or the recogniser, and the page says so. */
export function alignChars(passage, transcript) {
  const a = readable(passage), b = readable(transcript)
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const hit = new Array(n).fill(false)
  for (let i = 0, j = 0; i < n && j < m;) {
    if (a[i] === b[j]) { hit[i] = true; i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  const matched = hit.filter(Boolean).length
  return { chars: a.map((ch, i) => ({ ch, hit: hit[i] })), matched, total: n, heard: m, pct: n ? Math.round((100 * matched) / n) : null }
}
/** Lay the alignment back over the original text, punctuation and all. */
export function markPassage(passage, align) {
  const out = []; let k = 0
  for (const ch of String(passage || "")) {
    if (/[\p{Script=Han}\p{L}\p{N}]/u.test(ch)) { out.push({ ch, hit: align.chars[k] ? align.chars[k].hit : true, read: true }); k++ }
    else out.push({ ch, hit: true, read: false })
  }
  return out
}
/** Characters per minute over the recording — or null under ten seconds, because a
 *  pace from a tap-and-stop is not a pace, and "1700 字/分钟" teaches nothing. */
export const pace = (chars, ms) => (ms >= 10000 ? Math.round((chars * 60000) / ms) : null)
