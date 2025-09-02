import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-white shadow-lg shadow-slate-900/25 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/30 border-0 font-semibold",
      outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold shadow-md hover:shadow-lg",
      ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600 font-medium"
    }

    const sizes = {
      default: "h-12 px-6 py-3 text-base",
      sm: "h-10 px-4 py-2 text-sm",
      lg: "h-14 px-8 py-4 text-lg"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }