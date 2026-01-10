import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Base pixel switch styling
      "peer inline-flex h-6 w-12 shrink-0 cursor-pointer items-center",
      // Pixel border
      "border-2 border-border",
      // Background and shadow
      "bg-background shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]",
      // Transitions
      "transition-all duration-100",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-40",
      // Checked state - primary red with glow
      "data-[state=checked]:bg-primary/20 data-[state=checked]:border-primary data-[state=checked]:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),0_0_10px_hsl(var(--primary)/0.3)]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Pixel thumb styling
        "pointer-events-none block h-4 w-4 bg-foreground/50",
        // Pixel shadow effect
        "shadow-pixel-sm",
        // Transition
        "transition-transform duration-100",
        // Position
        "data-[state=unchecked]:translate-x-0.5",
        "data-[state=checked]:translate-x-[26px] data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary)/0.5),2px_2px_0px_rgba(0,0,0,0.8)]"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
