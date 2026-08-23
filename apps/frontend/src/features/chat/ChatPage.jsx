import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { listMessages, sendMessage } from "../../services/api/messages.api.js";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useSocket } from "../../hooks/useSocket.js";
import { Card, CardContent } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Input } from "../../components/ui/shadcn/input.jsx";
import { Skeleton } from "../../components/ui/shadcn/skeleton.jsx";
import { formatTimeAgo } from "../../utils/date.utils.js";

export default function ChatPage() {
  const { conversationId } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  // The URL param (e.g. /chat/:contractId) is the contract-scoped conversation.
  const contractId = conversationId || null;

  // Fetch the user's contracts so they can pick which conversation to open.
  const contractsQuery = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => listMyContracts(token),
    enabled: !!token,
  });
  // GET /contracts responds with { success, data: contracts[] } — array, no unwrap needed.
  const contracts = contractsQuery.data?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
    enabled: !!contractId && !!token,
  });

  // GET /messaging/contract/:id responds with { messages, total, limit, skip }.
  const messages = data?.data?.messages ?? [];

  const { contractSocket } = useSocket() || {};
  const [isLive, setIsLive] = useState(false);

  // Join this contract's realtime room and merge in messages the other party
  // sends while we're here. The socket connection is shared/app-wide (see
  // SocketProvider) and stays joined to every contract room visited this
  // session, so updates always target the message's own contract_id — not
  // just whichever thread happens to be open — keeping every cached thread
  // fresh even if you're not currently looking at it.
  useEffect(() => {
    if (!contractSocket || !contractId) {
      setIsLive(false);
      return undefined;
    }

    const join = () => contractSocket.emit("join", contractId);
    const handleConnect = () => {
      setIsLive(true);
      join();
    };
    const handleDisconnect = () => setIsLive(false);
    const handleJoinError = (err) => toast.error(err?.message || "Couldn't open live chat for this conversation");

    const handleNewMessage = (message) => {
      const key = ["messages", String(message.contract_id)];
      queryClient.setQueryData(key, (prev) => {
        if (!prev) return prev;
        const existing = prev.data?.messages ?? [];
        if (existing.some((m) => String(m._id) === String(message._id))) return prev;
        return { ...prev, data: { ...prev.data, messages: [...existing, message] } };
      });
    };

    if (contractSocket.connected) {
      setIsLive(true);
      join();
    }
    contractSocket.on("connect", handleConnect);
    contractSocket.on("disconnect", handleDisconnect);
    contractSocket.on("message:new", handleNewMessage);
    contractSocket.on("join:error", handleJoinError);

    return () => {
      contractSocket.off("connect", handleConnect);
      contractSocket.off("disconnect", handleDisconnect);
      contractSocket.off("message:new", handleNewMessage);
      contractSocket.off("join:error", handleJoinError);
    };
  }, [contractSocket, contractId, queryClient]);

  const activeContract =
    contracts.find((c) => String(c._id) === String(contractId)) || null;

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [contractId, messages.length]);

  const sendMutation = useMutation({
    mutationFn: () =>
      sendMessage(contractId, { body: draft.trim(), attachments: [] }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", contractId] });
      setDraft("");
    },
    onError: (err) => toast.error(err.message || "That message couldn't be sent"),
  });

  const partnerName =
    activeContract?.client_id?.name || activeContract?.student_id?.name || "Partner";

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl flex-col animate-fade-up">
      <header className="border-b border-ink-300 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass">Messages</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight text-slate">Contract chat</h1>
        <p className="mt-2 text-sm text-slate-300">
          Every conversation is scoped to a contract — both parties stay in context.
        </p>
      </header>

      <div className="mt-4 flex flex-1 gap-4 overflow-hidden">
        {/* Contract picker */}
        <Card className="hidden w-64 shrink-0 overflow-y-auto md:block">
          <CardContent className="p-2">
            <p className="px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-slate-300/70">
              Conversations
            </p>
            {contractsQuery.isLoading && (
              <div className="space-y-2 p-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            )}
            {!contractsQuery.isLoading && contracts.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-slate-300">
                No contracts yet.
              </p>
            )}
            {contracts.map((c) => {
              const isActive = String(c._id) === String(contractId);
              const title = c.project_id?.title || "Contract";
              return (
                <Link
                  key={c._id}
                  to={`/chat/${c._id}`}
                  className={`flex items-center gap-2 rounded-control px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-brass/12 font-semibold text-brass"
                      : "text-slate-300 hover:bg-ink-50 hover:text-slate"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {!contractId ? (
          <Card className="flex-1">
            <CardContent className="flex h-full flex-col items-center justify-center p-10 text-center">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <h3 className="mt-4 font-display text-lg text-slate">Pick a contract</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-300">
                Select a contract from the list to open its chat thread.
              </p>
              {contracts.length === 0 && (
                <Link to="/contracts" className="mt-6">
                  <Button variant="secondary">Go to contracts</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <CardContent className="flex h-full flex-col p-0">
              <div className="flex items-center gap-2 border-b border-ink-300 px-4 py-2.5">
                <MessageSquare className="h-4 w-4 text-brass" />
                <span className="truncate text-sm font-semibold text-slate">
                  {activeContract?.project_id?.title || "Contract"}
                </span>
                <span className="ml-auto shrink-0 text-xs text-slate-300">with {partnerName}</span>
                <span
                  className={`ml-2 flex shrink-0 items-center gap-1.5 text-[11px] ${isLive ? "text-emerald-400" : "text-slate-500"}`}
                  title={isLive ? "Live — new messages arrive instantly" : "Reconnecting…"}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-slate-500"}`} />
                  {isLive ? "Live" : "Reconnecting…"}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {isLoading && (
                  <>
                    <Skeleton className="h-12 w-2/3" />
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-12 w-3/5" />
                  </>
                )}
                {!isLoading && messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-slate-300">
                    No messages yet. Say hello and confirm the first milestone.
                  </p>
                )}
                {messages.map((m) => {
                  const mine =
                    m.sender_id?._id && user && String(m.sender_id._id) === String(user.id);
                  return (
                    <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-card border px-4 py-2.5 ${
                          mine ? "border-brass/30 bg-brass/10" : "border-ink-300 bg-ink-700"
                        }`}
                      >
                        <p className="text-xs font-semibold text-brass">
                          {mine ? "You" : m.sender_id?.name || "User"}
                        </p>
                        {m.body && (
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{m.body}</p>
                        )}
                        <p className="mt-1 text-[11px] text-slate-300">{formatTimeAgo(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                className="flex gap-2 border-t border-ink-300 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  sendMutation.mutate();
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  aria-label="Send message"
                  loading={sendMutation.isPending}
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}