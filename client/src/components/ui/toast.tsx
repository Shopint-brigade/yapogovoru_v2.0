import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  // Base pixel toast styling
  cn(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden p-4 pr-8",
    // Pixel border and shadow
    "border-2 border-border",
    "shadow-[4px_4px_0px_rgba(0,0,0,0.8),inset_1px_1px_0_rgba(255,255,255,0.05)]",
    // Animations
    "transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full"
  ),
  {
    variants: {
      variant: {
        // Default toast
        default:
          "bg-card text-card-foreground border-border",

        // Destructive/Error toast with red glow
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-[4px_4px_0px_rgba(0,0,0,0.8),0_0_20px_hsl(var(--destructive)/0.3)]",

        // Success toast with green glow
        success:
          "bg-success/10 text-success border-success shadow-[4px_4px_0px_rgba(0,0,0,0.8),0_0_20px_hsl(var(--success)/0.3)]",

        // Warning toast with yellow glow
        warning:
          "bg-warning/10 text-warning border-warning shadow-[4px_4px_0px_rgba(0,0,0,0.8),0_0_20px_hsl(var(--warning)/0.3)]",

        // Info toast with blue glow
        info:
          "bg-info/10 text-info border-info shadow-[4px_4px_0px_rgba(0,0,0,0.8),0_0_20px_hsl(var(--info)/0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // Pixel action button
      "inline-flex h-8 shrink-0 items-center justify-center px-3",
      "font-pixel text-[8px] uppercase tracking-wider",
      "bg-transparent border-2 border-current",
      // Transitions
      "transition-all duration-100",
      // Hover state
      "hover:bg-current hover:text-background",
      // Focus state
      "focus:outline-none focus:ring-2 focus:ring-success",
      // Disabled state
      "disabled:pointer-events-none disabled:opacity-40",
      // Destructive group styling
      "group-[.destructive]:border-destructive-foreground/50 group-[.destructive]:hover:border-destructive-foreground",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // Pixel close button
      "absolute right-2 top-2 p-1",
      "text-foreground/50",
      // Transitions
      "transition-all duration-100",
      // Hover/focus states
      "opacity-0 group-hover:opacity-100",
      "hover:text-foreground",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-success",
      // Destructive group styling
      "group-[.destructive]:text-destructive-foreground/50 group-[.destructive]:hover:text-destructive-foreground",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" strokeWidth={3} />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("font-pixel text-[10px] uppercase tracking-wider", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("font-mono text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
