import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-pixel text-sm font-normal tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success disabled:pointer-events-none disabled:bg-[rgba(255,255,255,0.15)] disabled:text-[rgba(255,255,255,0.5)] disabled:border-[rgba(255,255,255,0.15)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-0 hover:shadow-[inset_0_0_0_3px_hsl(var(--background)),0_0_0_2px_hsl(var(--primary))]",
        destructive:
          "bg-destructive text-destructive-foreground border-0 hover:shadow-[inset_0_0_0_3px_hsl(var(--background)),0_0_0_2px_hsl(var(--destructive))]",
        outline:
          "bg-transparent text-foreground border border-border hover:shadow-[inset_0_0_0_3px_hsl(var(--background)),0_0_0_2px_hsl(var(--primary))]",
        "outline-secondary":
          "bg-transparent text-muted-foreground border border-[rgba(255,255,255,0.5)] hover:bg-secondary hover:text-secondary-foreground hover:border-secondary",
        secondary:
          "bg-secondary text-secondary-foreground border-0 hover:shadow-[inset_0_0_0_3px_hsl(var(--secondary-foreground)),0_0_0_2px_hsl(var(--secondary))]",
        ghost:
          "bg-transparent text-muted-foreground border-0 hover:text-foreground",
        link:
          "bg-transparent text-primary underline-offset-4 hover:underline border-0",
      },
      size: {
        default: "h-[34px] px-2 text-[14px]",
        sm: "h-6 px-1 text-[12px]",
        lg: "h-[42px] px-3 text-[14px]",
        icon: "h-6 w-6 p-0",
        "icon-md": "h-[34px] w-[34px] p-0",
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
