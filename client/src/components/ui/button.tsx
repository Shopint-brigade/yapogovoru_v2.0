import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Pixel Art Button
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-pixel text-[10px] uppercase tracking-wider transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary Red Button with double-border hover effect
        default:
          "bg-primary text-primary-foreground border-2 border-primary shadow-pixel-sm hover:shadow-pixel hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",

        // Destructive with glow effect
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive shadow-pixel-sm hover:shadow-[0_0_15px_hsl(var(--destructive)/0.5),4px_4px_0px_rgba(0,0,0,0.8)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",

        // Outline with inner border on hover
        outline:
          "bg-transparent text-foreground border-2 border-border hover:border-primary hover:text-primary hover:shadow-[inset_0_0_0_2px_hsl(var(--primary)/0.2)] active:bg-primary/10",

        // Outline Secondary - muted style
        "outline-secondary":
          "bg-transparent text-muted-foreground border-2 border-muted-foreground/30 hover:border-foreground hover:text-foreground hover:bg-accent",

        // Secondary (White) with invert effect
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-secondary shadow-pixel-sm hover:shadow-pixel hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",

        // Ghost - minimal with pixel hover
        ghost:
          "bg-transparent text-muted-foreground border-2 border-transparent hover:text-foreground hover:bg-accent hover:border-border",

        // Link style
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline border-0 p-0 h-auto",

        // Success variant
        success:
          "bg-success text-white border-2 border-success shadow-pixel-sm hover:shadow-[0_0_15px_hsl(var(--success)/0.5),4px_4px_0px_rgba(0,0,0,0.8)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1 text-[8px]",
        lg: "h-12 px-6 py-3 text-[11px]",
        icon: "h-8 w-8 p-0",
        "icon-md": "h-10 w-10 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
