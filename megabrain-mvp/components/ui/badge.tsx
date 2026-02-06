import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80": variant === "default",
          "border-transparent bg-slate-800 text-slate-100 hover:bg-slate-800/80": variant === "secondary",
          "border-transparent bg-rose-500/20 text-rose-400 hover:bg-rose-500/30": variant === "destructive",
          "border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800": variant === "outline",
          "border-transparent bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30": variant === "success",
          "border-transparent bg-amber-500/20 text-amber-400 hover:bg-amber-500/30": variant === "warning",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };