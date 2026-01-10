"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "warning" | "error" | "info"
  showValue?: boolean
  segmented?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", showValue = false, segmented = false, ...props }, ref) => {
  const getVariantColor = () => {
    switch (variant) {
      case "success": return "bg-success"
      case "warning": return "bg-warning"
      case "error": return "bg-error"
      case "info": return "bg-info"
      default: return "bg-primary"
    }
  }

  const getGlowColor = () => {
    switch (variant) {
      case "success": return "shadow-[0_0_10px_hsl(var(--success)/0.5)]"
      case "warning": return "shadow-[0_0_10px_hsl(var(--warning)/0.5)]"
      case "error": return "shadow-[0_0_10px_hsl(var(--error)/0.5)]"
      case "info": return "shadow-[0_0_10px_hsl(var(--info)/0.5)]"
      default: return "shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
    }
  }

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          // Base pixel progress styling
          "relative h-4 w-full overflow-hidden bg-background",
          // Pixel border with inset shadow
          "border-2 border-border",
          "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300",
            getVariantColor(),
            getGlowColor(),
            // Segmented pixel effect
            segmented && "bg-[length:8px_100%] bg-[linear-gradient(90deg,currentColor_6px,transparent_6px)]"
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>

      {/* Optional value display */}
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-pixel text-[8px] text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            {Math.round(value || 0)}%
          </span>
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
