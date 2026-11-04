import * as React from "react"
import { Eraser, Pencil, Trash2, Undo2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@zhangqi444/ui/ui/button"

/* Scratch paper, under the choices.
 *
 * The real test hands her blank paper for the maths sections — the mock-day
 * checklist on this site even says "gather scratch paper" — and nothing here
 * did, so the working for a Quantitative item happened on whatever was lying
 * about or in her head. This is a sheet per question: strokes are kept per
 * `pageKey` for as long as the page is open, so Back shows the working she did
 * on the question she is going back to, and Next gives a clean sheet.
 *
 * It is paper, not a record. Nothing drawn here is saved to her progress or to
 * Drive — a reload is a fresh pad — and the only thing remembered is whether
 * she wants it open, which is a device preference (Store.s.scratch, not in
 * body(), because the laptop and the iPad can reasonably differ about it).
 *
 * Strokes are stored as points in CSS pixels and redrawn from scratch after
 * any resize, theme change or undo. That is simpler than editing a bitmap, it
 * is what makes undo a one-liner, and a few hundred points redraw in well
 * under a frame.
 */
const PAGES = new Map()
const PEN = 2.5, RUBBER = 22, HEIGHT = 240
const L = {
  en: { title: "Scratch paper", pen: "Pen", rubber: "Rubber", undo: "Undo", clear: "Clear", on: "Scratch on", off: "Scratch off", undoLabel: "Undo the last stroke", clearLabel: "Clear the scratch paper", canvas: "Scratch paper — draw your working here with a finger, a pencil or the mouse" },
  zh: { title: "草稿纸", pen: "笔", rubber: "橡皮", undo: "撤销", clear: "清除", on: "草稿 开", off: "草稿 关", undoLabel: "撤销上一笔", clearLabel: "清空草稿纸", canvas: "草稿纸——用手指、触控笔或鼠标在这里演算" },
}

function page(key) {
  if (!PAGES.has(key)) PAGES.set(key, { strokes: [] })
  return PAGES.get(key)
}

function paint(canvas, strokes) {
  const ctx = canvas.getContext("2d")
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth, h = canvas.clientHeight
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)
  const ink = getComputedStyle(canvas).color || "#000"
  ctx.lineCap = "round"; ctx.lineJoin = "round"
  for (const s of strokes) {
    ctx.globalCompositeOperation = s.tool === "eraser" ? "destination-out" : "source-over"
    ctx.strokeStyle = ink
    ctx.lineWidth = s.tool === "eraser" ? RUBBER : PEN
    ctx.beginPath()
    const p = s.pts
    if (p.length === 1) { ctx.moveTo(p[0][0], p[0][1]); ctx.lineTo(p[0][0] + 0.01, p[0][1]) }
    else { ctx.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) ctx.lineTo(p[k][0], p[k][1]) }
    ctx.stroke()
  }
  ctx.globalCompositeOperation = "source-over"
}

/** The toolbar button that opens and closes the pad. Same in a practice set and a mock. */
export function ScratchToggle({ on, onToggle, zh }) {
  const t = zh ? L.zh : L.en
  const label = on ? t.on : t.off
  /* Icon-only on a phone. The runner's toolbar is a row that does not shrink,
     and a third labelled button in it ran the row to 504px on a 390px screen —
     the sheet itself fitted; its switch did not. The name stays on the button
     for a screen reader and comes back as text from `sm` up. */
  return (
    <Button size="sm" variant={on ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={onToggle} aria-pressed={on} aria-label={label} data-testid="scratch-toggle">
      <Pencil /><span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

export function ScratchPad({ pageKey, zh, className }) {
  const t = zh ? L.zh : L.en
  const canvasRef = React.useRef(null)
  const live = React.useRef(null)                   // the stroke being drawn
  const [tool, setTool] = React.useState("pen")
  const [, bump] = React.useReducer((n) => n + 1, 0)  // after a stroke, undo or clear, to refresh the toolbar

  const redraw = React.useCallback(() => { const c = canvasRef.current; if (c) paint(c, page(pageKey).strokes) }, [pageKey])

  React.useEffect(() => {
    redraw()
    const c = canvasRef.current
    const ro = new ResizeObserver(redraw); ro.observe(c)
    // the ink colour follows the theme, so a theme switch repaints
    const mo = new MutationObserver(redraw); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => { ro.disconnect(); mo.disconnect() }
  }, [redraw])

  const at = (e) => { const r = canvasRef.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  function down(e) {
    if (e.button != null && e.button !== 0 && e.pointerType === "mouse") return
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    live.current = { tool, pts: [at(e)] }
    page(pageKey).strokes.push(live.current)
    redraw()
  }
  function move(e) {
    if (!live.current) return
    const evs = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [e]
    for (const ev of evs) live.current.pts.push(at(ev))
    // draw just the new tail rather than everything, so a long stroke stays smooth
    const c = canvasRef.current, ctx = c.getContext("2d"), p = live.current.pts, n = p.length
    ctx.globalCompositeOperation = live.current.tool === "eraser" ? "destination-out" : "source-over"
    ctx.strokeStyle = getComputedStyle(c).color || "#000"; ctx.lineWidth = live.current.tool === "eraser" ? RUBBER : PEN
    ctx.lineCap = "round"; ctx.lineJoin = "round"
    const from = Math.max(0, n - evs.length - 1)
    ctx.beginPath(); ctx.moveTo(p[from][0], p[from][1])
    for (let k = from + 1; k < n; k++) ctx.lineTo(p[k][0], p[k][1])
    ctx.stroke(); ctx.globalCompositeOperation = "source-over"
  }
  function up(e) {
    if (!live.current) return
    try { canvasRef.current.releasePointerCapture(e.pointerId) } catch {}
    live.current = null
    bump()
  }
  function undo() { page(pageKey).strokes.pop(); redraw(); bump() }
  function clear() { page(pageKey).strokes.length = 0; redraw(); bump() }
  const n = page(pageKey).strokes.length

  return (
    <div className={cn("flex flex-col gap-2", className)} data-testid="scratch-pad">
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-muted-foreground mr-1 text-xs">{t.title}</span>
        <Button size="sm" variant={tool === "pen" ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setTool("pen")} aria-pressed={tool === "pen"} data-testid="scratch-pen"><Pencil /> {t.pen}</Button>
        <Button size="sm" variant={tool === "eraser" ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"} data-testid="scratch-eraser"><Eraser /> {t.rubber}</Button>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={undo} disabled={!n} aria-label={t.undoLabel} data-testid="scratch-undo"><Undo2 /> {t.undo}</Button>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clear} disabled={!n} aria-label={t.clearLabel} data-testid="scratch-clear"><Trash2 /> {t.clear}</Button>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={t.canvas}
        className="bg-muted/40 text-foreground w-full touch-none rounded-lg border border-dashed"
        style={{ height: HEIGHT, cursor: tool === "eraser" ? "cell" : "crosshair" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up}
        data-testid="scratch-canvas" data-strokes={n}
      />
    </div>
  )
}
