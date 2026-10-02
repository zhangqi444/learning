import * as React from "react"
import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { Eraser } from "lucide-react"
import { t } from "@/lib/lang"
import { Button } from "@zhangqi444/ui/ui/button"

/* Free handwriting: a canvas that keeps what she wrote two ways — the pixels, as
 * a PNG, and the strokes, as point sequences with pressure and time — so a
 * reviewer can see the page and a later rule can read the strokes. Pointer
 * events, so the Pencil, a finger and a mouse all draw; touch-action none, so a
 * stroke does not scroll the page. Paper is white in both themes. */
export const Ink = forwardRef(function Ink({ height = 300, onChange }, ref) {
  const cv = useRef(null), strokes = useRef([]), cur = useRef(null)
  const [n, setN] = useState(0)
  const ctx = () => cv.current.getContext("2d")
  const at = (e) => { const r = cv.current.getBoundingClientRect(); return [Math.round(((e.clientX - r.left) * cv.current.width) / r.width), Math.round(((e.clientY - r.top) * cv.current.height) / r.height), +(e.pressure || 0.5).toFixed(2), Date.now()] }
  const down = (e) => { e.preventDefault(); try { cv.current.setPointerCapture(e.pointerId) } catch { /* no-op */ } const p = at(e); cur.current = { type: e.pointerType || "mouse", pts: [p] }; const c = ctx(); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = "#2b2a55"; c.lineWidth = 3 + 3 * p[2]; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 0.1, p[1]); c.stroke() }
  const move = (e) => { if (!cur.current) return; const p = at(e); const q = cur.current.pts[cur.current.pts.length - 1]; cur.current.pts.push(p); const c = ctx(); c.lineWidth = 3 + 3 * p[2]; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(p[0], p[1]); c.stroke() }
  const up = () => { if (!cur.current) return; strokes.current.push(cur.current); cur.current = null; setN(strokes.current.length); onChange && onChange(strokes.current.length) }
  const clear = () => { strokes.current = []; ctx().clearRect(0, 0, cv.current.width, cv.current.height); setN(0); onChange && onChange(0) }
  useImperativeHandle(ref, () => ({
    clear,
    count: () => strokes.current.length,
    export: () => new Promise((res) => cv.current.toBlob((blob) => res({ blob, strokes: strokes.current.slice(), width: cv.current.width, height: cv.current.height }), "image/png")),
  }))
  return (
    <div className="flex flex-col gap-1.5">
      <canvas ref={cv} width={1200} height={Math.round((1200 * height) / 600)} className="w-full rounded-lg border bg-white" style={{ touchAction: "none", height }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={up} data-testid="zh-ink" data-strokes={n} />
      <div className="flex items-center justify-between"><span className="text-muted-foreground text-xs tabular-nums">{t(`${n} 笔`, `${n} strokes`)}</span><Button size="sm" variant="ghost" onClick={clear} data-testid="zh-ink-clear"><Eraser /> {t("清除", "Clear")}</Button></div>
    </div>
  )
})
