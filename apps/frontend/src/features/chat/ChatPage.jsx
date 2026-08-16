import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { listMessages } from "../../services/api/messages.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { formatTimeAgo } from "../../utils/date.utils.js";

export default function ChatPage() {
  const { conversationId } = useParams();
  const { token, user } = useAuth();
  const [draft, setDraft] = useState("");
  const contractId = conversationId || user?.active_contract_id;

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
    enabled: !!contractId && !!token,
  });
  const messages = data?.data ?? [];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col animate-fade-up">
      <header className="border-b border-ink-300 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Messages</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Contract chat</h1>
        <p className="mt-2 text-sm text-slate-300">Every conversation is scoped to a contract — both parties stay in context.</p>
      </header>

      {!contractId ? (
        <Card className="mt-8 flex-1">
          <CardContent className="flex h-full flex-col items-center justify-center p-10 text-center">
            <MessageSquare className="h-10 w-10 text-slate-300" />
            <h3 className="mt-4 font-display text-lg text-slate">Pick a contract</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-300">Open a contract from your dashboard to start its chat thread.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 flex flex-1 flex-col overflow-hidden">
          <CardContent className="flex h-full flex-col p-0">
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {isLoading && <><Skeleton className="h-12 w-2/3" /><Skeleton className="h-12 w-1/2" /><Skeleton className="h-12 w-3/5" /></>}
              {!isLoading && messages.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-300">No messages yet. Say hello and confirm the first milestone.</p>
              )}
              {messages.map((m) => {
                const mine = m.sender_id?._id && user && String(m.sender_id._id) === String(user._id);
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-card border px-4 py-2.5 ${mine ? "border-brass/30 bg-brass/10" : "border-ink-300 bg-ink-700"}`}>
                      <p className="text-xs font-semibold text-brass">{mine ? "You" : (m.sender_id?.name || "Client")}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{m.body}</p>
                      <p className="mt-1 text-[11px] text-slate-300">{formatTimeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              className="flex gap-2 border-t border-ink-300 p-4"
              onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setDraft(""); } }}
            >
              <Button type="button" variant="secondary" size="icon" className="h-11 w-11 shrink-0" aria-label="Attach file"><Paperclip className="h-4 w-4" /></Button>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message…" className="flex-1" />
              <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Send message"><Send className="h-4 w-4" /></Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
