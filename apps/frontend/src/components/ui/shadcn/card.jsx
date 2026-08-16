import * as React from "react";
import { cn } from "../../../lib/cn.js";

function Card({ className, ...props }) {
  return <div className={cn("rounded-card border border-ink-300 bg-ink-50 text-slate shadow-card", className)} {...props} />;
}
function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}
function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-display text-lg leading-none tracking-tight text-slate", className)} {...props} />;
}
function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-300", className)} {...props} />;
}
function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}
function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
