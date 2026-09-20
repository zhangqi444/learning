import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border-2 py-6 shadow-[0_2px_0_0_var(--border)]", className)}
      {...props}
    />
  )
}

/* The action sits beside the title on a wide screen and under it on a narrow
 * one, and that is a fix rather than a preference. The second column was `auto`
 * — max-content — so a header with a wide action gave the action whatever it
 * asked for and left the title the rest: on a 390px phone the Long Night page
 * put "Start Verbal Reasoning" in half the card and broke "Split diagnostic"
 * across two lines with "Baseline, split across two sittings" running down a
 * column four words wide. A `min-w-0` on the action fixes the overflow and not
 * this, because the track can then shrink but still takes what it wants first.
 *
 * Keyed on @md/main rather than a media query, because what has run out is the
 * card's room and not the window's — the same card is narrow beside an open
 * sidebar and wide without one. No CardAction in this codebase is authored
 * before its CardTitle, so stacking puts it under the text every time; if one
 * ever is, it will appear above the title and look like a header that lost its
 * heading. */
function CardHeader({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-1.5 px-6 @md/main:has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }) {
  return <div data-slot="card-title" className={cn("leading-none font-bold tracking-tight", className)} {...props} />
}

function CardDescription({ className, ...props }) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardAction({ className, ...props }) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-1 self-start justify-self-start @md/main:col-start-2 @md/main:row-span-2 @md/main:row-start-1 @md/main:justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
