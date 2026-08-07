// ============================================================================
// A persistent floating chat bubble + panel for asking the FortiSim Tutor
// general firewall/networking questions. Mounted once in AppShell so it's
// available on every page. Conversation is kept in memory only (resets on
// reload), matching the rest of the app's session model.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import { sendChatMessage, ChatMessage } from "../api/client";

const WELCOME: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm the FortiSim Tutor. Ask me anything about firewall or networking concepts — zones, NAT, ACLs, subnetting, rule ordering, and so on.",
};

export function ChatTutorWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text } as ChatMessage];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendChatMessage(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-5 w-[340px] h-[440px] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
          <div className="bg-forti-red text-white px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-semibold">FortiSim Tutor</span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-[16px] leading-none">
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                    m.role === "user" ? "bg-forti-red text-white" : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12.5px] text-gray-400">
                  Thinking…
                </div>
              </div>
            )}
            {error && <div className="text-[11.5px] text-red-600 px-1">{error}</div>}
          </div>

          <div className="border-t border-gray-200 p-2 flex gap-2 shrink-0 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about firewalls, NAT, subnetting…"
              className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:border-forti-red"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-3 py-1.5 bg-forti-red text-white rounded text-[12.5px] hover:bg-forti-red/90 disabled:opacity-40 shrink-0"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-forti-red text-white shadow-lg flex items-center justify-center text-[20px] hover:bg-forti-red/90 transition-colors z-50"
        aria-label="Open FortiSim Tutor chat"
      >
        {open ? "×" : "💬"}
      </button>
    </>
  );
}
