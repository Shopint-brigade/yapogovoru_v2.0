import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        // Base pixel radio styling - square instead of round for pixel art
        "peer h-6 w-6 shrink-0 bg-background",
        // Pixel border with inset shadow
        "border-2 border-border",
        "shadow-[inset_1px_1px_2px_rgba(0,0,0,0.4)]",
        // Transitions
        "transition-all duration-100",
        // Focus state
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        // Hover state
        "hover:border-foreground/50",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-40",
        // Checked state
        "data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        {/* Pixel-style filled indicator */}
        <div className="h-3 w-3 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
