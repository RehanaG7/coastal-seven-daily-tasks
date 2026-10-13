import React from "react";
import { cn } from "../../lib/utils";

export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const base = "inline-flex items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
  const variants = {
    default: "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 active:scale-95",
    destructive: "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/30 active:scale-95",
    outline: "border border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800/60 active:scale-95",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95",
    ghost: "text-slate-400 hover:bg-slate-800/40 hover:text-white",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-[11px]",
    lg: "h-12 rounded-xl px-8 text-sm",
    icon: "h-9 w-9",
  };
  return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
});
Button.displayName = "Button";
