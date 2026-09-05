import { Classic } from "../loading-ui/classic.jsx";

export default function InitialAppLoader() {
  return (
    <main
      className="grid min-h-screen place-items-center bg-ink px-6 text-slate"
      role="status"
      aria-live="polite"
      aria-label="Loading NexusWork"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-brass/30 bg-brass/10 shadow-elevated">
          <span className="font-display text-2xl font-bold text-brass" aria-hidden="true">N</span>
        </div>
        <div>
          <p className="font-display text-xl font-semibold text-slate">NexusWork</p>
          <p className="mt-2 text-sm text-slate-300">Loading your workspace…</p>
        </div>
        <Classic className="size-9 text-brass" aria-label="Loading NexusWork" />
      </div>
    </main>
  );
}
