import * as React from "react"

import { cn } from "@/lib/utils"

/* A one-shot particle burst, hand-rolled. No library and no asset: each spark
 * is a span whose direction is baked into two CSS custom properties, and the
 * keyframes in index.css do the rest. The global prefers-reduced-motion rule
 * already disables the animation, in which case this renders as nothing
 * visible and costs nothing.
 *
 * `seed` restarts it: change the value and a fresh set of sparks is thrown. */
export function Burst({ seed = 0, n = 20, className }) {
  const sparks = React.useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2 + Math.random() * 0.4
        const dist = 70 + Math.random() * 90
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          delay: `${Math.random() * 90}ms`,
          size: 5 + Math.round(Math.random() * 5),
          tone: i % 3,
        }
      }),
    // a new seed means a new burst, so the shape is not identical every time
    [seed, n]
  )
  const tone = ["bg-primary", "bg-chart-3", "bg-chart-2"]
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10 overflow-visible", className)} aria-hidden="true" data-testid="burst">
      {sparks.map((s, i) => (
        <span
          key={`${seed}-${i}`}
          // opacity-0 is the resting state and the animation lights it up. Under
          // prefers-reduced-motion the animation never runs, so the sparks stay
          // invisible instead of piling up at the centre forever.
          className={cn("absolute top-1/2 left-1/2 block rounded-full opacity-0 motion-safe:animate-[spark_700ms_ease-out_forwards]", tone[s.tone])}
          style={{ "--dx": s.dx, "--dy": s.dy, width: s.size, height: s.size, animationDelay: s.delay }}
        />
      ))}
    </div>
  )
}

/** Counts up to `to` once, so a score lands rather than simply being there. */
export function useCountUp(to, ms = 650) {
  const [n, setN] = React.useState(to)
  React.useEffect(() => {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms)
      // ease-out, so it decelerates into the final number
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms])
  return n
}
