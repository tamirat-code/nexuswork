import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "../../../lib/cn.js";

const Command = React.forwardRef(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn("flex h-full w-full flex-col overflow-hidden rounded-card bg-ink-700 text-slate", className)}
      {...props}
    />
  );
});
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }) => {
  return (
    <CommandPrimitive.Dialog className={cn("rounded-card", "")} {...props}>
      {children}
    </CommandPrimitive.Dialog>
  );
};

const CommandInput = React.forwardRef(function CommandInput({ className, ...props }, ref) {
  return (
    <div className="flex items-center border-b border-ink-300 px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        className={cn("flex h-11 w-full rounded-none bg-transparent py-3 text-sm text-slate outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-45", className)}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef(function CommandList({ className, ...props }, ref) {
  return <CommandPrimitive.List ref={ref} className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)} {...props} />;
});
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef(function CommandEmpty({ className, ...props }, ref) {
  return <CommandPrimitive.Empty ref={ref} className={cn("py-6 text-center text-sm text-slate-300", className)} {...props} />;
});
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef(function CommandGroup({ className, ...props }, ref) {
  return <CommandPrimitive.Group ref={ref} className={cn("overflow-hidden p-1 text-slate", className)} {...props} />;
});
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-[8px] px-2 py-1.5 text-sm text-slate outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-45 data-[selected=true]:bg-brass/10 data-[selected=true]:text-brass",
        className
      )}
      {...props}
    />
  );
});
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandSeparator = React.forwardRef(function CommandSeparator({ className, ...props }, ref) {
  return <CommandPrimitive.Separator ref={ref} className={cn("-mx-1 h-px bg-ink-300", className)} {...props} />;
});
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator };
