export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatTimeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatTimeLeft(deadline) {
  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return "Deadline passed";
  const days = Math.ceil(diffMs / 86400000);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}