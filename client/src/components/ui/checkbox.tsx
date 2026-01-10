import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base pixel checkbox styling
      "peer h-6 w-6 shrink-0 bg-background",
      // Pixel border with inset shadow
      "border-2 border-border",
      "shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]",
      // Transitions
      "transition-all duration-100",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Hover state
      "hover:border-foreground/50",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-40",
      // Checked state - primary red with pixel shadow
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      {/* Pixel-style checkmark */}
      <Check className="h-4 w-4" strokeWidth={4} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
