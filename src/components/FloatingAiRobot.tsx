import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { askTaskFlowAssistant } from "@/lib/ai";
import { useAppStore } from "@/lib/app-store";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

type ChatMessage = {
  role: "assistant" | "user";
  body: string;
};

export function FloatingAiRobot() {
  const { activeProject, projects, tasks, members, columns, generateAiTasks } = useAppStore();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      body: "Hi, I can chat normally, but I will keep things useful for this project. Ask me about progress, deadlines, meetings, priorities, or any idea you want to turn into tasks.",
    },
  ]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || loading) return;
    const userMessage = message.trim();
    setMessage("");
    setChat((current) => [...current, { role: "user", body: userMessage }]);
    setLoading(true);
    try {
      const answer = await askTaskFlowAssistant(userMessage, { currentProject: activeProject, projects, tasks, members, columns });
      setChat((current) => [...current, { role: "assistant", body: answer }]);
      if (/(generate|break down|create|plan|suggest).*(task|tasks)|idea/i.test(userMessage)) {
        generateAiTasks(userMessage.replace(/generate|break|create|plan|tasks|for/gi, "").trim() || userMessage);
      }
    } catch (error) {
      setChat((current) => [...current, { role: "assistant", body: error instanceof Error ? error.message : "AI request failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="glass-panel mb-3 flex h-[min(480px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-xl sm:mb-4 sm:rounded-2xl">
          <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#172033] via-[#123c3a] to-[#0f766e] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/14 shadow-inner">
                <span className="absolute -top-2 size-2 rounded-full bg-[#f59e0b] shadow-[0_0_14px_rgba(245,158,11,0.9)]" />
                <span className="relative flex size-7 items-center justify-center rounded-lg bg-[#d9fffb]">
                  <span className="absolute left-1.5 top-2 size-1 rounded-full bg-[#172033]" />
                  <span className="absolute right-1.5 top-2 size-1 rounded-full bg-[#172033]" />
                  <span className="absolute bottom-1.5 h-1 w-3 rounded-b-full border-b-2 border-[#172033]" />
                </span>
              </span>
              <div>
                <p className="text-sm font-black">TaskFlow AI</p>
                <p className="text-xs text-white/65">Grok with free fallback</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto bg-gradient-to-b from-[#f8fafc] to-[#eef7f5] p-4">
            <div className="flex flex-col gap-3">
              {chat.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`max-w-[86%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-6 ${
                    item.role === "assistant"
                      ? "self-start border border-[#dfe5ee] bg-white text-[#344054]"
                      : "self-end bg-[#0f766e] text-white"
                  }`}
                >
                  {item.body}
                </div>
              ))}
              {loading ? (
                <div className="flex max-w-[86%] items-center gap-2 self-start rounded-lg border border-[#dfe5ee] bg-white px-3 py-2 text-sm text-[#667085]">
                  <Loader2 className="size-4 animate-spin" />
                  Thinking
                </div>
              ) : null}
            </div>
          </div>
          <form className="flex gap-2 border-t border-[#e5ebf2] p-3" onSubmit={sendMessage}>
            <TextField value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about project progress..." />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="size-4" />
            </Button>
          </form>
        </section>
      ) : null}
      <button
        className="robot-float robot-glow relative flex size-16 items-center justify-center rounded-[1.1rem] border border-[#b7e3dc] bg-gradient-to-br from-[#10b3a5] via-[#0f766e] to-[#16423f] text-white transition hover:-translate-y-1 sm:size-20 sm:rounded-[1.35rem]"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open TaskFlow AI assistant"
      >
        <span className="absolute -top-3 left-1/2 h-4 w-0.5 -translate-x-1/2 rounded-full bg-[#d9fffb]" />
        <span className="absolute -top-5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-[#f59e0b] shadow-[0_0_18px_rgba(245,158,11,0.95)]" />
        <span className="relative flex size-10 items-center justify-center rounded-xl bg-[#d9fffb] shadow-inner sm:size-12 sm:rounded-2xl">
          <span className="absolute left-3 top-4 size-1.5 rounded-full bg-[#172033]" />
          <span className="absolute right-3 top-4 size-1.5 rounded-full bg-[#172033]" />
          <span className="absolute bottom-3 h-2 w-5 rounded-b-full border-b-[3px] border-[#172033]" />
          <span className="absolute -left-1 top-5 size-2 rounded-full bg-[#f59e0b]" />
          <span className="absolute -right-1 top-5 size-2 rounded-full bg-[#f59e0b]" />
        </span>
        <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-[#f59e0b] text-white shadow-[0_0_16px_rgba(245,158,11,0.65)]">
          <Sparkles className="size-3.5" />
        </span>
      </button>
    </div>
  );
}
