import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/api/notifications.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Badge } from "../../components/ui/shadcn/badge.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { formatTimeAgo } from "../../utils/date.utils.js";

export default function NotificationsPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: () => listMyNotifications(token), enabled: !!token });
 const items = Array.isArray(data?.data)
  ? data.data
  : Array.isArray(data?.data?.notifications)
    ? data.data.notifications
    : [];
  const markOne = useMutation({
    mutationFn: (id) => markNotificationRead(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(token),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("All caught up"); },
  });

  const unread = items.filter((n) => !n.read).length;

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-300 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Inbox</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Notifications</h1>
          <p className="mt-2 text-sm text-slate-300">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAll.mutate()}><CheckCheck className="h-4 w-4" /> Mark all read</Button>
        )}
      </header>

      {items.length === 0 && (
        <Card className="mt-8 p-14 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 font-display text-lg text-slate">Nothing here yet</h3>
          <p className="mt-2 text-sm text-slate-300">Proposal received, milestone funded, and dispute updates will land here.</p>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {items.map((n) => (
          <button
            key={n._id}
            onClick={() => !n.read && markOne.mutate(n._id)}
            className={`w-full cursor-pointer rounded-card border p-4 text-left transition-colors hover:border-brass/40 ${n.read ? "border-ink-300 bg-ink-50" : "border-brass/30 bg-brass/5"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate">{n.title}</p>
                <p className="mt-1 text-sm text-slate-300">{n.message}</p>
              </div>
              {!n.read && <Badge variant="default" className="shrink-0">New</Badge>}
            </div>
            <p className="mt-2 text-xs text-slate-300">{formatTimeAgo(n.createdAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
