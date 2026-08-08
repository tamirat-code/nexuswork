export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-shimmer rounded-control bg-[length:200%_100%] bg-gradient-to-r from-ink-50 via-ink-300 to-ink-50 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}