import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth.js";
import { getPreContractConversation, sendPreContractMessage } from "../../services/api/messages.api.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/shadcn/card.jsx";
import { Button } from "../../components/ui/shadcn/button.jsx";
import { Textarea } from "../../components/ui/shadcn/textarea.jsx";

export default function PreContractPage() {
  const { t } = useTranslation();
  const { conversationId } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const query = useQuery({ queryKey: ["pre-contract-page", conversationId], queryFn: () => getPreContractConversation(conversationId, token), enabled: !!token && !!conversationId });
  const send = useMutation({ mutationFn: () => sendPreContractMessage(conversationId, body, token), onSuccess: () => { setBody(""); query.refetch(); } });
  const data = query.data?.data;
  const messages = data?.messages || [];
  const partner = String(data?.conversation?.client_id?._id) === String(user?._id) ? data?.conversation?.student_id : data?.conversation?.client_id;

  if (query.isLoading) return <div className="p-8 text-sm text-content-muted">{t("common.loading", { defaultValue: "Loading…" })}</div>;
  if (query.isError) return <Card><CardContent className="p-8 text-center text-sm text-danger">{query.error?.message || t("chat.loadError", { defaultValue: "Could not load this interview." })}</CardContent></Card>;

  return <div className="mx-auto w-full max-w-3xl"><button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm font-semibold text-brand">← {t("common.back", { defaultValue: "Back" })}</button><Card><CardHeader><CardTitle>{partner?.name || t("projects.interview", { defaultValue: "Project interview" })}</CardTitle><p className="text-sm text-content-secondary">{data?.conversation?.project_id?.title || t("projects.project", { defaultValue: "Project" })} · {t("projects.preContractLabel", { defaultValue: "Before contract" })}</p></CardHeader><CardContent><div className="min-h-72 space-y-3 rounded-xl border border-border-subtle bg-surface-soft p-4">{messages.length ? messages.map((message) => <div key={message._id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${String(message.sender_id?._id) === String(user?._id) ? "ml-auto bg-brand text-brand-foreground" : "bg-surface text-content-primary"}`}>{message.body}</div>) : <p className="py-20 text-center text-sm text-content-muted">{t("projects.noInterviewMessages", { defaultValue: "Start the conversation by introducing the project." })}</p>}</div><div className="mt-4 flex gap-2"><Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={t("projects.interviewPlaceholder", { defaultValue: "Ask about availability, approach, or relevant experience…" })} /><Button onClick={() => send.mutate()} disabled={!body.trim() || send.isPending}><Send className="mr-2 h-4 w-4" />{t("common.send", { defaultValue: "Send" })}</Button></div></CardContent></Card></div>;
}
