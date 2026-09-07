import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({ className, value, indicatorClassName, ...props }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("bg-primary/20 relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          // a sheen along the top edge so the bar reads as a filling tube, not a flat rectangle
          "bg-primary relative h-full w-full flex-1 rounded-full transition-all duration-300 ease-out before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-full before:bg-white/25 before:content-['']",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
