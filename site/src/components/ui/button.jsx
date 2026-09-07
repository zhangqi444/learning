import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* A solid button carries a hard offset shadow in its own hue, darker — the
 * "sticker" look. Pressing it shortens the shadow and drops the face onto it,
 * so the control behaves like a physical key rather than a rectangle that
 * changes colour. The recipe is spelled out per variant on purpose: Tailwind
 * scans source text for class names, so a helper that builds them at runtime
 * would produce classes it never generates the CSS for. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-100 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_var(--lift)_0_0_var(--primary-press)] active:translate-y-[3px] active:shadow-[0_var(--lift-press)_0_0_var(--primary-press)] disabled:translate-y-0 disabled:shadow-none",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-[0_var(--lift)_0_0_var(--destructive-press)] active:translate-y-[3px] active:shadow-[0_var(--lift-press)_0_0_var(--destructive-press)] disabled:translate-y-0 disabled:shadow-none",
        outline:
          "border-2 bg-card hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 shadow-[0_var(--lift)_0_0_var(--outline-press)] active:translate-y-[3px] active:shadow-[0_var(--lift-press)_0_0_var(--outline-press)] disabled:translate-y-0 disabled:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-[0_var(--lift)_0_0_var(--secondary-press)] active:translate-y-[3px] active:shadow-[0_var(--lift-press)_0_0_var(--secondary-press)] disabled:translate-y-0 disabled:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
