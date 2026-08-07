import { useRef, useState } from "react";
import { Check, CheckCheck, Paperclip, Send, Smile } from "lucide-react";

const CONVERSATIONS = [
  { id: 1, name: "Daniel T. (Client)", project: "Event Web App", online: true },
  { id: 2, name: "Hanna K. (Student)", project: "Analytics Dashboard", online: false },
];

const INITIAL_MESSAGES = [
  { id: 1, mine: false, text: "Hi! The milestone 2 design looks great 🎉", time: "10:02" },
  { id: 2, mine: true, text: "Thanks! I'll push the checkout flow today.", time: "10:05", read: true },
];

export default function MessagesPanel() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), mine: true, text: draft.trim(), time: "now", read: false }]);
    setDraft("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="grid h-96 grid-cols-[130px_1fr] overflow-hidden rounded-xl border border-slate-100 dark:border-white/5 sm:grid-cols-[180px_1fr]">
      <div className="border-r border-slate-100 p-2 dark:border-white/5">
        {CONVERSATIONS.map((c) => (
          <div key={c.id} className="mb-1 w-full rounded-xl px-2.5 py-2 text-left">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${c.online ? "bg-emerald-500" : "bg-slate-300 dark:bg-zinc-600"}`} />
              <p className="truncate text-xs font-bold text-slate-800 dark:text-zinc-200">{c.name}</p>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">{c.project}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${m.mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-zinc-200"}`}>
                <p>{m.text}</p>
                <p className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${m.mine ? "text-blue-100" : "text-slate-400"}`}>
                  {m.time} {m.mine && (m.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-slate-100 p-2 dark:border-white/5">
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400"><Paperclip className="h-4 w-4" /></button>
            <button className="p-2 text-slate-400"><Smile className="h-4 w-4" /></button>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message…" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
            <button onClick={send} className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}