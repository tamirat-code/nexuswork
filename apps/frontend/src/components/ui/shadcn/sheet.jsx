import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../../lib/cn.js";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(function SheetOverlay({ className, ...props }, ref) {
  return <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm", className)} {...props} ref={ref} />;
});
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef(function SheetContent({ className, children, side = "right", ...props }, ref) {
  const sideClasses = {
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
    left: "inset-y-0 left-0 h-full w-72 border-r",
    right: "inset-y-0 right-0 h-full w-72 border-l",
  };
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn("fixed z-50 bg-ink-700 shadow-elevated transition ease-in-out", sideClasses[side], className)}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-control p-1 text-slate-300 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

function SheetHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />;
}
function SheetFooter({ className, ...props }) {
  return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
const SheetTitle = React.forwardRef(function SheetTitle({ className, ...props }, ref) {
  return <SheetPrimitive.Title ref={ref} className={cn("font-display text-lg font-semibold text-slate", className)} {...props} />;
});
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(function SheetDescription({ className, ...props }, ref) {
  return <SheetPrimitive.Description ref={ref} className={cn("text-sm text-slate-300", className)} {...props} />;
});
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
