import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base pixel badge styling
  "inline-flex items-center whitespace-nowrap font-pixel text-[8px] uppercase tracking-wider transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-success",
  {
    variants: {
      variant: {
        // Primary red badge with pixel border
        default:
          "bg-primary text-primary-foreground border-2 border-primary px-2 py-1 shadow-pixel-sm",

        // Secondary white badge
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-secondary px-2 py-1 shadow-pixel-sm",

        // Destructive/Error badge
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive px-2 py-1 shadow-pixel-sm",

        // Outline badge with pixel border
        outline:
          "bg-transparent border-2 border-border text-foreground px-2 py-1 hover:border-primary hover:text-primary",

        // Success badge
        success:
          "bg-success text-white border-2 border-success px-2 py-1 shadow-[0_0_10px_hsl(var(--success)/0.3)]",

        // Warning badge
        warning:
          "bg-warning text-black border-2 border-warning px-2 py-1 shadow-[0_0_10px_hsl(var(--warning)/0.3)]",

        // Error badge
        error:
          "bg-error text-white border-2 border-error px-2 py-1 shadow-[0_0_10px_hsl(var(--error)/0.3)]",

        // Info badge
        info:
          "bg-info text-white border-2 border-info px-2 py-1 shadow-[0_0_10px_hsl(var(--info)/0.3)]",

        // Muted/subtle badge
        muted:
          "bg-muted text-muted-foreground border-2 border-border px-2 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
