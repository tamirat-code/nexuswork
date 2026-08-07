import { Link } from "react-router-dom";
import { Hammer, ArrowLeft } from "lucide-react";

export default function ModulePlaceholder({ name }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
          <Hammer className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          This module is next in the build order.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}