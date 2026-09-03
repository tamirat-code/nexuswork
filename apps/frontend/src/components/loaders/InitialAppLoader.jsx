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
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-ink-300" aria-hidden="true">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-brass" />
        </div>
      </div>
    </main>
  );
}
