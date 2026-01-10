import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Base pixel textarea styling
        "flex min-h-[120px] w-full bg-background font-mono text-sm text-foreground",
        // Pixel border with inset shadow effect
        "border-2 border-border",
        "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-1px_-1px_0_rgba(255,255,255,0.05)]",
        // Padding
        "px-3 py-2",
        // Placeholder
        "placeholder:text-muted-foreground placeholder:opacity-60",
        // Transitions
        "transition-all duration-150",
        // Hover state
        "hover:border-foreground/30",
        // Focus state - green glow
        "focus-visible:outline-none focus-visible:border-success focus-visible:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),0_0_0_2px_hsl(var(--success)/0.2)]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-muted",
        // Resize behavior
        "resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
