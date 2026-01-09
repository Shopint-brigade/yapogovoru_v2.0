import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-none border-0 px-2 py-1 font-mono text-xs font-normal transition-colors focus:outline-none focus:ring-2 focus:ring-success",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive text-destructive-foreground",
        outline: "bg-transparent border border-border text-foreground",
        success: "bg-success text-white",
        warning: "bg-warning text-black",
        error: "bg-error text-white",
        info: "bg-info text-white",
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
