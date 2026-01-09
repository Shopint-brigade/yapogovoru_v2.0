import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-none border border-input bg-accent px-2 py-2 font-mono text-base text-foreground transition-all placeholder:text-muted-foreground placeholder:opacity-50 focus-visible:outline-none focus-visible:border-2 focus-visible:border-success hover:border-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:border-none resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
