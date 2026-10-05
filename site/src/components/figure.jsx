import * as React from "react"

import { cn } from "@/lib/utils"

/* The picture a question is read off.
 *
 * About half of the real Quantitative Reasoning items and four in ten of the
 * Mathematics Achievement items work from something drawn — a bar graph, a
 * table, a number line, a spinner, a figure with its sides labelled — and until
 * 4 October 2026 the site could draw none of them, so none were asked
 * (docs/mock-review-2026-10-04.md). An item carries a small declarative
 * `figure` (the schema is tools/itemspec.py, which also validates it) and this
 * draws it: plain black-on-white SVG in the page's own colours, because on the
 * day it counts the figure is ink on paper and nothing here should teach her to
 * read anything more decorated than that.
 *
 * Every type is drawn from numbers, never from an image file, so the same
 * figure is crisp at phone width and in dark mode, and a test can read the
 * values back out of the DOM (`data-figure`, `data-type`). */

const FONT = 13
const INK = "currentColor"
const SOFT = "var(--muted-foreground)"
const FILL = "var(--primary)"

function Frame({ type, title, children, viewBox, max = 440, className }) {
  return (
    <figure className={cn("mx-auto my-1 flex w-full flex-col items-center gap-1.5", className)} style={{ maxWidth: max }} data-testid="figure" data-type={type}>
      {title ? <figcaption className="text-sm font-medium">{title}</figcaption> : null}
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label={title || type} style={{ fontFamily: "inherit", fontSize: FONT }}>
        {children}
      </svg>
    </figure>
  )
}

const T = ({ x, y, children, anchor = "middle", size = FONT, weight, fill = INK, dy }) => (
  <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill} dy={dy} dominantBaseline="middle">{children}</text>
)

/* ---- table: plain HTML, the way a price list is printed ---- */
function Table({ f }) {
  return (
    <figure className="mx-auto my-1 w-full max-w-md" data-testid="figure" data-type="table">
      {f.caption ? <figcaption className="mb-1 text-sm font-medium">{f.caption}</figcaption> : null}
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr>{f.head.map((h, i) => <th key={i} className="border-foreground/60 border px-3 py-1.5 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {f.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-foreground/60 border px-3 py-1.5 tabular-nums">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </figure>
  )
}

/* ---- bar and line graphs share one set of axes ---- */
function niceStep(max) {
  if (max <= 5) return 1
  if (max <= 10) return 2
  if (max <= 25) return 5
  if (max <= 50) return 10
  if (max <= 100) return 20
  if (max <= 250) return 50
  if (max <= 500) return 100
  return Math.pow(10, Math.floor(Math.log10(max)))
}

function Axes({ f, series, kind }) {
  const W = 440, H = 300, L = 56, R = 16, Tp = 20, B = 56
  const maxV = Math.max(...series.map((s) => s.value), 1)
  const step = f.step || niceStep(maxV)
  const top = f.max || Math.ceil(maxV / step) * step || step
  const n = series.length
  const plotW = W - L - R, plotH = H - Tp - B
  const x = (i) => L + (plotW / n) * (i + 0.5)
  const y = (v) => Tp + plotH - (v / top) * plotH
  const ticks = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(+v.toFixed(6))
  return (
    <Frame type={kind} title={f.title} viewBox={`0 0 ${W} ${H}`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={SOFT} strokeWidth={v === 0 ? 1.5 : 0.6} strokeDasharray={v === 0 ? undefined : "3 3"} />
          <T x={L - 8} y={y(v)} anchor="end" size={12}>{v}</T>
        </g>
      ))}
      <line x1={L} x2={L} y1={Tp} y2={Tp + plotH} stroke={INK} strokeWidth={1.5} />
      {kind === "bar"
        ? series.map((s, i) => {
            const bw = Math.min(48, (plotW / n) * 0.6)
            return <rect key={i} x={x(i) - bw / 2} y={y(s.value)} width={bw} height={Tp + plotH - y(s.value)} fill={FILL} fillOpacity={0.85} data-value={s.value} />
          })
        : (
          <g>
            <polyline points={series.map((s, i) => `${x(i)},${y(s.value)}`).join(" ")} fill="none" stroke={FILL} strokeWidth={2.5} />
            {series.map((s, i) => <circle key={i} cx={x(i)} cy={y(s.value)} r={4.5} fill={FILL} data-value={s.value} />)}
          </g>
        )}
      {series.map((s, i) => <T key={i} x={x(i)} y={Tp + plotH + 16} size={12}>{s.label}</T>)}
      {f.x ? <T x={L + plotW / 2} y={H - 10} size={12} fill={SOFT}>{f.x}</T> : null}
      {f.y ? <text transform={`translate(12 ${Tp + plotH / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill={SOFT}>{f.y}</text> : null}
    </Frame>
  )
}

/* ---- pictograph: a row of discs per label, half a disc for a half ---- */
function Pictograph({ f }) {
  const rowH = 34, labelW = 110, W = 440, maxC = Math.max(...f.rows.map((r) => r.count), 1)
  const H = f.rows.length * rowH + 44
  const r = 11, gap = 30
  return (
    <Frame type="pictograph" title={f.title} viewBox={`0 0 ${W} ${H}`}>
      {f.rows.map((row, i) => {
        const cy = 12 + i * rowH + rowH / 2
        const full = Math.floor(row.count), half = row.count - full >= 0.5
        return (
          <g key={i} data-count={row.count}>
            <T x={labelW - 10} y={cy} anchor="end">{row.label}</T>
            {Array.from({ length: full }).map((_, k) => <circle key={k} cx={labelW + 6 + r + k * gap} cy={cy} r={r} fill={FILL} />)}
            {half ? <path d={`M ${labelW + 6 + full * gap} ${cy - r} A ${r} ${r} 0 0 0 ${labelW + 6 + full * gap} ${cy + r} Z`} fill={FILL} /> : null}
          </g>
        )
      })}
      <circle cx={labelW + 6 + r} cy={H - 16} r={r} fill={FILL} />
      <T x={labelW + 6 + 2 * r + 8} y={H - 16} anchor="start" size={12}>{f.unit}</T>
      {maxC > 0 ? null : null}
    </Frame>
  )
}

/* ---- number line ---- */
function NumberLine({ f }) {
  const W = 440, H = 84, L = 24, R = 24, yl = 44
  const n = Math.round((f.max - f.min) / f.step)
  const x = (v) => L + ((v - f.min) / (f.max - f.min)) * (W - L - R)
  const every = f.labelEvery || (n > 20 ? 5 : n > 10 ? 2 : 1)
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(3)))
  return (
    <Frame type="numberline" viewBox={`0 0 ${W} ${H}`}>
      <line x1={L - 12} x2={W - R + 12} y1={yl} y2={yl} stroke={INK} strokeWidth={1.5} markerEnd="url(#nl-arrow)" />
      <defs><marker id="nl-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={INK} /></marker></defs>
      {Array.from({ length: n + 1 }).map((_, k) => {
        const v = f.min + k * f.step, big = k % every === 0
        return (
          <g key={k}>
            <line x1={x(v)} x2={x(v)} y1={yl - (big ? 8 : 5)} y2={yl + (big ? 8 : 5)} stroke={INK} strokeWidth={big ? 1.5 : 1} />
            {big ? <T x={x(v)} y={yl + 20} size={12}>{fmt(v)}</T> : null}
          </g>
        )
      })}
      {(f.points || []).map((p, k) => (
        <g key={k} data-at={p.at}>
          <circle cx={x(p.at)} cy={yl} r={5} fill={FILL} />
          <T x={x(p.at)} y={yl - 20} weight={600}>{p.label || "P"}</T>
        </g>
      ))}
    </Frame>
  )
}

/* ---- coordinate grid (first quadrant, or all four) ---- */
function Grid({ f }) {
  const q4 = f.quadrants === 4
  const xmax = f.xmax, ymax = f.ymax, xmin = q4 ? -xmax : 0, ymin = q4 ? -ymax : 0
  const cell = Math.min(36, 360 / (xmax - xmin))
  const W = (xmax - xmin) * cell + 48, H = (ymax - ymin) * cell + 48
  const x = (v) => 24 + (v - xmin) * cell, y = (v) => 24 + (ymax - v) * cell
  const pts = f.polygon || []
  return (
    <Frame type="grid" title={f.title} viewBox={`0 0 ${W} ${H}`} max={Math.min(440, W)}>
      {Array.from({ length: xmax - xmin + 1 }).map((_, k) => <line key={"v" + k} x1={x(xmin + k)} x2={x(xmin + k)} y1={y(ymax)} y2={y(ymin)} stroke={SOFT} strokeWidth={0.5} />)}
      {Array.from({ length: ymax - ymin + 1 }).map((_, k) => <line key={"h" + k} x1={x(xmin)} x2={x(xmax)} y1={y(ymin + k)} y2={y(ymin + k)} stroke={SOFT} strokeWidth={0.5} />)}
      <line x1={x(xmin)} x2={x(xmax)} y1={y(0)} y2={y(0)} stroke={INK} strokeWidth={1.5} />
      <line x1={x(0)} x2={x(0)} y1={y(ymax)} y2={y(ymin)} stroke={INK} strokeWidth={1.5} />
      {Array.from({ length: xmax - xmin + 1 }).map((_, k) => { const v = xmin + k; return v === 0 ? null : <T key={"xl" + k} x={x(v)} y={y(0) + 12} size={10} fill={SOFT}>{v}</T> })}
      {Array.from({ length: ymax - ymin + 1 }).map((_, k) => { const v = ymin + k; return v === 0 ? null : <T key={"yl" + k} x={x(0) - 10} y={y(v)} size={10} fill={SOFT} anchor="end">{v}</T> })}
      <T x={x(0) - 8} y={y(0) + 10} size={10} fill={SOFT} anchor="end">0</T>
      {pts.length ? <polygon points={pts.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")} fill={FILL} fillOpacity={0.18} stroke={FILL} strokeWidth={2} /> : null}
      {(f.points || []).map((p, k) => (
        <g key={k} data-x={p.x} data-y={p.y}>
          <circle cx={x(p.x)} cy={y(p.y)} r={4.5} fill={FILL} />
          <T x={x(p.x) + 9} y={y(p.y) - 9} weight={600} size={12}>{p.label || "P"}</T>
        </g>
      ))}
    </Frame>
  )
}

/* ---- a plane figure with its sides labelled (not to scale is the norm on paper too) ---- */
function Polygon({ f }) {
  const pts = f.points
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const S = 300 / span, pad = 48
  const W = (maxX - minX) * S + pad * 2, H = (maxY - minY) * S + pad * 2
  const x = (v) => pad + (v - minX) * S, y = (v) => pad + (maxY - v) * S
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  return (
    <Frame type="polygon" title={f.title} viewBox={`0 0 ${W} ${H}`} max={Math.min(440, W)}>
      {f.grid ? Array.from({ length: span + 1 }).map((_, k) => (
        <g key={k}>
          <line x1={x(minX + k)} x2={x(minX + k)} y1={y(minY)} y2={y(maxY)} stroke={SOFT} strokeWidth={0.4} />
          <line x1={x(minX)} x2={x(maxX)} y1={y(minY + k)} y2={y(minY + k)} stroke={SOFT} strokeWidth={0.4} />
        </g>
      )) : null}
      <polygon points={pts.map(([px, py]) => `${x(px)},${y(py)}`).join(" ")} fill={f.shade ? FILL : "none"} fillOpacity={f.shade ? 0.18 : 0} stroke={INK} strokeWidth={2} />
      {(f.right || []).map((vi) => {
        const a = pts[(vi + pts.length - 1) % pts.length], b = pts[vi], c = pts[(vi + 1) % pts.length]
        const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]]
        const nu = Math.hypot(...u) || 1, nv = Math.hypot(...v) || 1, d = 0.5 * Math.min(span / 8, 1.2)
        const p1 = [b[0] + (u[0] / nu) * d, b[1] + (u[1] / nu) * d], p2 = [b[0] + (v[0] / nv) * d, b[1] + (v[1] / nv) * d], p3 = [p1[0] + p2[0] - b[0], p1[1] + p2[1] - b[1]]
        return <polyline key={vi} points={`${x(p1[0])},${y(p1[1])} ${x(p3[0])},${y(p3[1])} ${x(p2[0])},${y(p2[1])}`} fill="none" stroke={INK} strokeWidth={1.2} />
      })}
      {(f.labels || []).map((lb, k) => {
        const a = pts[lb.side % pts.length], b = pts[(lb.side + 1) % pts.length]
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2
        // push the label outward from the figure's centre
        const ox = mx - cx, oy = my - cy, n = Math.hypot(ox, oy) || 1
        return <T key={k} x={x(mx) + (ox / n) * 22} y={y(my) - (oy / n) * 22} weight={500}>{lb.text}</T>
      })}
    </Frame>
  )
}

/* ---- two overlapping circles, with counts or the items themselves inside ---- */
function Venn({ f }) {
  const W = 440, H = 260, r = 92, c1 = [160, 130], c2 = [280, 130]
  const items = f.items || {}, counts = f.counts || {}
  const cell = (k) => (items[k] ? items[k] : counts[k] != null ? [String(counts[k])] : [])
  const stack = (arr, x, y, size) => arr.map((s, i) => <T key={i} x={x} y={y + (i - (arr.length - 1) / 2) * 16} size={size}>{s}</T>)
  const left = cell("left"), both = cell("both"), right = cell("right"), outside = cell("outside")
  const big = (arr) => (arr.length === 1 && /^\d+$/.test(arr[0]) ? 20 : 12)
  return (
    <Frame type="venn" title={f.title} viewBox={`0 0 ${W} ${H}`}>
      <rect x={16} y={16} width={W - 32} height={H - 32} fill="none" stroke={SOFT} strokeWidth={1} />
      <circle cx={c1[0]} cy={c1[1]} r={r} fill={FILL} fillOpacity={0.12} stroke={INK} strokeWidth={1.5} />
      <circle cx={c2[0]} cy={c2[1]} r={r} fill={FILL} fillOpacity={0.12} stroke={INK} strokeWidth={1.5} />
      <T x={c1[0] - 40} y={c1[1] - r - 12} weight={600} size={12}>{f.left}</T>
      <T x={c2[0] + 40} y={c2[1] - r - 12} weight={600} size={12}>{f.right}</T>
      {stack(left, c1[0] - 40, c1[1], big(left))}
      {stack(both, (c1[0] + c2[0]) / 2, c1[1], big(both))}
      {stack(right, c2[0] + 40, c2[1], big(right))}
      {outside.length ? stack(outside, 70, H - 36, big(outside)) : null}
    </Frame>
  )
}

/* ---- spinner: sectors proportional to `size`, equal when sizes are equal ---- */
function Spinner({ f }) {
  const W = 300, H = 300, cx = 150, cy = 150, r = 120
  const total = f.sectors.reduce((a, s) => a + (s.size || 1), 0)
  let acc = -Math.PI / 2
  const arcs = f.sectors.map((s) => {
    const a0 = acc, a1 = acc + ((s.size || 1) / total) * Math.PI * 2; acc = a1
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    const [x0, y0] = p(a0), [x1, y1] = p(a1), mid = (a0 + a1) / 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    return { s, d: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`, lx: cx + r * 0.62 * Math.cos(mid), ly: cy + r * 0.62 * Math.sin(mid) }
  })
  return (
    <Frame type="spinner" title={f.title} viewBox={`0 0 ${W} ${H}`} max={300}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill={FILL} fillOpacity={0.08 + (i % 3) * 0.1} stroke={INK} strokeWidth={1.5} data-size={a.s.size || 1} />)}
      {arcs.map((a, i) => <T key={"l" + i} x={a.lx} y={a.ly} weight={500}>{a.s.label}</T>)}
      <line x1={cx} y1={cy} x2={cx + r * 0.75} y2={cy - r * 0.35} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill={INK} />
    </Frame>
  )
}

/* ---- an analog clock ---- */
function Clock({ f }) {
  const W = 260, cx = 130, cy = 130, r = 110
  const mA = (f.m / 60) * Math.PI * 2 - Math.PI / 2, hA = (((f.h % 12) + f.m / 60) / 12) * Math.PI * 2 - Math.PI / 2
  return (
    <Frame type="clock" title={f.title} viewBox={`0 0 ${W} ${W}`} max={260}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={2} />
      {Array.from({ length: 60 }).map((_, k) => {
        const a = (k / 60) * Math.PI * 2, big = k % 5 === 0
        return <line key={k} x1={cx + (r - (big ? 12 : 6)) * Math.cos(a)} y1={cy + (r - (big ? 12 : 6)) * Math.sin(a)} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={INK} strokeWidth={big ? 2 : 1} />
      })}
      {Array.from({ length: 12 }).map((_, k) => {
        const a = ((k + 1) / 12) * Math.PI * 2 - Math.PI / 2
        return <T key={k} x={cx + (r - 26) * Math.cos(a)} y={cy + (r - 26) * Math.sin(a)} weight={600}>{k + 1}</T>
      })}
      <line x1={cx} y1={cy} x2={cx + r * 0.52 * Math.cos(hA)} y2={cy + r * 0.52 * Math.sin(hA)} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + r * 0.78 * Math.cos(mA)} y2={cy + r * 0.78 * Math.sin(mA)} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={5} fill={INK} />
    </Frame>
  )
}

/* ---- a whole divided into parts, some shaded ---- */
function Shaded({ f }) {
  if (f.shape === "circle") {
    const W = 240, cx = 120, cy = 120, r = 100
    return (
      <Frame type="shaded" title={f.title} viewBox={`0 0 ${W} ${W}`} max={240}>
        {Array.from({ length: f.parts }).map((_, k) => {
          const a0 = (k / f.parts) * Math.PI * 2 - Math.PI / 2, a1 = ((k + 1) / f.parts) * Math.PI * 2 - Math.PI / 2
          const large = a1 - a0 > Math.PI ? 1 : 0
          const d = `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`
          return <path key={k} d={d} fill={k < f.shaded ? FILL : "none"} fillOpacity={k < f.shaded ? 0.6 : 0} stroke={INK} strokeWidth={1.5} />
        })}
      </Frame>
    )
  }
  const cols = f.shape === "grid" ? (f.cols || Math.ceil(Math.sqrt(f.parts))) : f.parts
  const rows = Math.ceil(f.parts / cols), cw = Math.min(44, 400 / cols), ch = f.shape === "grid" ? cw : 60
  const W = cols * cw + 4, H = rows * ch + 4
  return (
    <Frame type="shaded" title={f.title} viewBox={`0 0 ${W} ${H}`} max={Math.min(440, W)}>
      {Array.from({ length: f.parts }).map((_, k) => (
        <rect key={k} x={2 + (k % cols) * cw} y={2 + Math.floor(k / cols) * ch} width={cw} height={ch} fill={k < f.shaded ? FILL : "none"} fillOpacity={k < f.shaded ? 0.6 : 0} stroke={INK} strokeWidth={1.5} />
      ))}
    </Frame>
  )
}

/* ---- a block of unit cubes, drawn in cabinet projection ---- */
function Cubes({ f }) {
  const u = 36, dx = 0.5 * u, dy = -0.35 * u
  const W = f.w * u + f.d * dx + 24, H = f.h * u + f.d * -dy + 24
  const X = (x, z) => 12 + x * u + z * dx, Y = (y, z) => H - 12 - y * u + z * dy
  const faces = []
  for (let z = f.d - 1; z >= 0; z--) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    const front = `${X(x, z)},${Y(y, z)} ${X(x + 1, z)},${Y(y, z)} ${X(x + 1, z)},${Y(y + 1, z)} ${X(x, z)},${Y(y + 1, z)}`
    const top = `${X(x, z)},${Y(y + 1, z)} ${X(x + 1, z)},${Y(y + 1, z)} ${X(x + 1, z + 1)},${Y(y + 1, z + 1)} ${X(x, z + 1)},${Y(y + 1, z + 1)}`
    const side = `${X(x + 1, z)},${Y(y, z)} ${X(x + 1, z + 1)},${Y(y, z + 1)} ${X(x + 1, z + 1)},${Y(y + 1, z + 1)} ${X(x + 1, z)},${Y(y + 1, z)}`
    faces.push(<g key={`${x}-${y}-${z}`}>
      <polygon points={top} fill={FILL} fillOpacity={0.1} stroke={INK} strokeWidth={1} />
      <polygon points={side} fill={FILL} fillOpacity={0.3} stroke={INK} strokeWidth={1} />
      <polygon points={front} fill="var(--card)" stroke={INK} strokeWidth={1} />
    </g>)
  }
  return <Frame type="cubes" title={f.title} viewBox={`0 0 ${W} ${H}`} max={Math.min(360, W)}>{faces}</Frame>
}

export function Figure({ f, className }) {
  if (!f || typeof f !== "object") return null
  switch (f.type) {
    case "table": return <Table f={f} />
    case "bar": return <Axes f={f} series={f.bars} kind="bar" />
    case "line": return <Axes f={f} series={f.points} kind="line" />
    case "pictograph": return <Pictograph f={f} />
    case "numberline": return <NumberLine f={f} />
    case "grid": return <Grid f={f} />
    case "polygon": return <Polygon f={f} />
    case "venn": return <Venn f={f} />
    case "spinner": return <Spinner f={f} />
    case "clock": return <Clock f={f} />
    case "shaded": return <Shaded f={f} />
    case "cubes": return <Cubes f={f} />
    default: return null
  }
}
