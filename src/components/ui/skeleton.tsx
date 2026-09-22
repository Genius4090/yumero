import * as React from "react"

import { cn } from "@/lib/utils"

/** Shimmering placeholder. Size it exactly like the content it stands in for. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-shimmer rounded-xl bg-[linear-gradient(100deg,#232323_35%,#333232_50%,#232323_65%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
