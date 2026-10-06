/* A paper's own PDF, drawn in her browser: one question cut out of its page
 * (components/paper-question.jsx). Loaded only when a question is opened, and never
 * in the artifact, which has no Drive to read a PDF from (vite.config.js). pdf.js's
 * legacy build, so an older iPad's Safari draws it too. */
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.min.mjs"
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

const docs = new Map()
/** The document behind a Drive file, opened once per visit. `bytes` fetches it. */
export function openPdf(key, bytes) {
  if (!docs.has(key)) {
    const p = bytes().then((data) => {
      if (!data) throw new Error("The PDF could not be read from her Drive.")
      return pdfjs.getDocument({ data: new Uint8Array(data) }).promise
    })
    p.catch(() => docs.delete(key))   // a failed read is tried again next time
    docs.set(key, p)
  }
  return docs.get(key)
}

/** Draw one box of one page — [page, x0, y0, x1, y1], fractions of the page, y from
 *  the top — into `canvas`: at about the size the book prints it, and no wider than
 *  `room` CSS pixels. `done` resolves to the size drawn, in CSS pixels; `cancel`
 *  stops a draw the page no longer wants. */
export function drawBox(doc, canvas, box, room) {
  let task = null, dead = false
  const done = (async () => {
    const [n, x0, y0, x1, y1] = box
    const page = await doc.getPage(n)
    if (dead) return null
    const base = page.getViewport({ scale: 1 })
    const css = Math.max(120, Math.min(room, (x1 - x0) * base.width * 1.6))   // 1.6 px a point: book type at a readable size
    const ratio = Math.min(window.devicePixelRatio || 1, 3)
    const vp = page.getViewport({ scale: (css * ratio) / ((x1 - x0) * base.width) })
    canvas.width = Math.max(1, Math.round((x1 - x0) * vp.width))
    canvas.height = Math.max(1, Math.round((y1 - y0) * vp.height))
    task = page.render({ canvas, viewport: vp, transform: [1, 0, 0, 1, -x0 * vp.width, -y0 * vp.height], background: "#ffffff" })
    await task.promise
    return { w: canvas.width / ratio, h: canvas.height / ratio }
  })()
  return { done, cancel: () => { dead = true; if (task) task.cancel() } }
}
