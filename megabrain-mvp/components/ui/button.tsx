import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-100 text-slate-900 shadow hover:bg-slate-200": variant === "default",
            "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30": variant === "destructive",
            "border border-slate-700 bg-transparent shadow-sm hover:bg-slate-800 text-slate-100": variant === "outline",
            "bg-slate-800 text-slate-100 hover:bg-slate-700": variant === "secondary",
            "hover:bg-slate-800 hover:text-slate-100": variant === "ghost",
            "text-slate-100 underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };