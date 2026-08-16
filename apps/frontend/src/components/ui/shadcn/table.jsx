import * as React from "react";
import { cn } from "../../../lib/cn.js";

const Table = React.forwardRef(function Table({ className, ...props }, ref) {
  return (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
});
Table.displayName = "Table";

const TableHeader = React.forwardRef(function TableHeader({ className, ...props }, ref) {
  return <thead ref={ref} className={cn("border-b border-ink-300 [&_tr]:border-b-0", className)} {...props} />;
});
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(function TableBody({ className, ...props }, ref) {
  return <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
});
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef(function TableRow({ className, ...props }, ref) {
  return <tr ref={ref} className={cn("border-b border-ink-300 transition-colors hover:bg-ink-100/60 data-[state=selected]:bg-ink-100", className)} {...props} />;
});
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(function TableHead({ className, ...props }, ref) {
  return <th ref={ref} className={cn("h-11 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-300", className)} {...props} />;
});
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(function TableCell({ className, ...props }, ref) {
  return <td ref={ref} className={cn("px-3 py-3 align-middle", className)} {...props} />;
});
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(function TableCaption({ className, ...props }, ref) {
  return <caption ref={ref} className={cn("mt-4 text-sm text-slate-300", className)} {...props} />;
});
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
