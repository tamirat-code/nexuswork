import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageSquare, Paperclip, Send } from "lucide-react";
import { listMessages, sendMessage } from "../../services/api/messages.api.js";
import { downloadFile, openFilePreview, uploadFile } from "../../services/api/files.api.js";
import { listMyContracts } from "../../services/api/contracts.api.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useSocket } from "../../hooks/useSocket.js";
import { Card, Button, Input, PageHeader, Skeleton } from "../../components/ui/index.js";
import { formatTimeAgo } from "../../utils/date.utils.js";
import { displayFilename } from "../../utils/filename.utils.js";
import { ALL_FILE_ACCEPT, ALL_FILE_RULES } from "../../utils/file-rules.js";

export default function ChatPage() {
  const { t } = useTranslation();
  const { conversationId } = useParams();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);

  const contractId = conversationId || null;

  const contractsQuery = useQuery({
    queryKey: ["my-contracts"],
    queryFn: () => listMyContracts(token),
    enabled: !!token,
  });
  const contracts = contractsQuery.data?.data ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["messages", contractId],
    queryFn: () => listMessages(contractId, token),
    enabled: !!contractId && !!token,
  });

  const messages = data?.data?.messages ?? [];

  const { contractSocket } = useSocket() || {};
  const [isLive, setIsLive] = useState(false);

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
      sendMessage(contractId, { body: draft.trim(), attachments: attachment ? [attachment._id] : [] }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", contractId] });
      setDraft("");
      setAttachment(null);
    },
    onError: (err) => toast.error(err.message || "That message couldn't be sent"),
  });

  const partnerName =
    activeContract?.client_id?.name || activeContract?.student_id?.name || "Partner";

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-6xl flex-col animate-fade-up">
      <PageHeader
        eyebrow={t("chat.eyebrow")}
        title={t("chat.title")}
        description={t("chat.subtitle")}
        className="mb-4"
      />

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Contract picker */}
        <Card padded={false} className="hidden w-64 shrink-0 overflow-y-auto p-3 md:block">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            {t("chat.conversations")}
          </p>
          {contractsQuery.isLoading && (
            <div className="space-y-2 p-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}
          {!contractsQuery.isLoading && contracts.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-slate-300">
              {t("chat.noContracts")}
            </p>
          )}
          <div className="space-y-0.5">
            {contracts.map((c) => {
              const isActive = String(c._id) === String(contractId);
              const title = c.project_id?.title || "Contract";
              return (
                <Link
                  key={c._id}
                  to={`/chat/${c._id}`}
                  className={`flex items-center gap-2.5 rounded-control px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-brass/12 font-semibold text-brass border-l-2 border-brass"
                      : "text-slate-300 hover:bg-ink-50 hover:text-slate"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                </Link>
              );
            })}
          </div>
        </Card>

        {!contractId ? (
          <Card padded={false} className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full border border-ink-300 bg-ink-100 text-brass">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-slate">{t("chat.pickContractTitle")}</h3>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-300">
                {t("chat.pickContractDesc")}
              </p>
              {contracts.length === 0 && (
                <Link to="/contracts" className="mt-5 inline-block">
                  <Button variant="secondary" size="sm">{t("chat.goToContracts")}</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <Card padded={false} className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-ink-300 px-4 py-3">
              <MessageSquare className="h-4 w-4 text-brass" />
              <span className="truncate text-xs font-semibold text-slate">
                {activeContract?.project_id?.title || "Contract"}
              </span>
              <span className="ml-auto shrink-0 text-xs text-slate-300">{t("chat.withPartner", { name: partnerName })}</span>
              <span
                className={`ml-2 flex shrink-0 items-center gap-1.5 text-[11px] ${isLive ? "text-escrow" : "text-slate-300"}`}
                title={isLive ? t("chat.live") : t("chat.reconnecting")}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-escrow" : "bg-slate-300"}`} />
                {isLive ? t("chat.live") : t("chat.reconnecting")}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {isLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-10 w-3/5" />
                </div>
              )}
              {!isLoading && messages.length === 0 && (
                <p className="py-10 text-center text-xs text-slate-300">
                  {t("chat.noMessages")}
                </p>
              )}
              {messages.map((m) => {
                const mine =
                  m.sender_id?._id && user && String(m.sender_id._id) === String(user.id);
                return (
                  <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-card border px-3.5 py-2 text-xs ${
                        mine
                          ? "border-brass/30 bg-brass/10 text-slate"
                          : "border-ink-300 bg-ink-100 text-slate"
                      }`}
                    >
                      <p className="text-[11px] font-semibold text-brass">
                        {mine ? t("chat.you") : m.sender_id?.name || "User"}
                      </p>
                      {m.body && (
                        <p className="mt-0.5 leading-relaxed text-slate">{m.body}</p>
                      )}
                      {m.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1.5 border-t border-current/10 pt-2">
                          {m.attachments.map((file) => (
                            <div key={file._id} className="flex items-center gap-2 text-[11px]">
                              <Paperclip className="h-3.5 w-3.5 shrink-0 text-brass" />
                              <span className="min-w-0 flex-1 truncate" title={displayFilename(file.original_name)}>{displayFilename(file.original_name)}</span>
                              <button type="button" className="shrink-0 font-semibold text-brass hover:underline" onClick={async () => {
                                try { await openFilePreview(file._id, token); } catch (error) { toast.error(error.message || "Could not preview file"); }
                              }}>View</button>
                              <button type="button" className="shrink-0 font-semibold text-brass hover:underline" onClick={async () => {
                                try { await downloadFile(file._id, token, displayFilename(file.original_name)); } catch (error) { toast.error(error.message || "Could not download file"); }
                              }}>Download</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="mt-1 text-[10px] text-slate-300">{formatTimeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="flex items-center gap-2 border-t border-ink-300 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                sendMutation.mutate();
              }}
            >
              {attachment && <span className="max-w-28 truncate text-xs text-brass" title={displayFilename(attachment.original_name)}>{displayFilename(attachment.original_name)}</span>}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                aria-label={t("chat.attachFile")}
                onClick={() => document.getElementById("chat-attachment")?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input id="chat-attachment" type="file" accept={ALL_FILE_ACCEPT} className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; if (!file.size || file.size > 10 * 1024 * 1024) { toast.error("Attachment must be between 1 byte and 10 MB."); return; } try { const response = await uploadFile(file, { relatedType: "message_attachment", token }); setAttachment(response.data); } catch (error) { toast.error(error.message || "Could not upload attachment"); } }} />
              <p className="mb-1 text-[11px] text-slate-400">Allowed: {ALL_FILE_RULES} · up to 10 MB</p>
              <Input
                maxLength={5000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("chat.typeMessagePlaceholder")}
                className="flex-1"
                wrapperClassName="flex-1"
              />
              <span className="sr-only">{draft.length}/5000 characters</span>
              <Button
                type="submit"
                size="sm"
                iconOnly
                aria-label={t("chat.sendMessage")}
                loading={sendMutation.isPending}
                disabled={!draft.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
