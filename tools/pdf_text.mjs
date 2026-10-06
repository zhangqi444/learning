// Every text item of a PDF with its place on the page, as fractions of the page (y from
// the top): the input tools/paper_boxes.py reads a paper's question boxes from.
//   node tools/pdf_text.mjs paper.pdf > items.json
// Uses the site's own pdf.js (site/node_modules), so run `npm ci` in site/ first.
import { getDocument } from '../site/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(process.argv[2])), verbosity: 0 }).promise
const items = []
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p), vp = page.getViewport({ scale: 1 })
  for (const it of (await page.getTextContent()).items) {
    if (!it.str || !it.str.trim()) continue
    const [, , c, d, e, f] = it.transform, h = Math.hypot(c, d) || it.height
    items.push({ p, W: vp.width, H: vp.height, s: it.str, x: e / vp.width, y: 1 - (f + h * 0.8) / vp.height, w: it.width / vp.width, h: h / vp.height })
  }
}
process.stdout.write(JSON.stringify({ pages: doc.numPages, items }))
