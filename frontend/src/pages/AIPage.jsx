import { useEffect, useRef, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { Spinner } from "../components/Spinner";
import { useAuth } from "../hooks/useAuth";
import { chatWithAI, getAIInsight } from "../services/aiService";
import { getErrorMessage } from "../utils/getErrorMessage";

const QUICK_INSIGHTS = [
  { type: "daily_plan", label: "Today's Plan", icon: "📋", desc: "Get a personalized action plan for today" },
  { type: "weak_areas", label: "Weak Areas", icon: "🎯", desc: "Identify what needs the most attention" },
  { type: "career_roadmap", label: "4-Week Roadmap", icon: "🗺️", desc: "A structured plan to placement" },
  { type: "interview_questions", label: "Practice Questions", icon: "💬", desc: "Questions based on your target role" },
  { type: "recommendations", label: "Top 5 Actions", icon: "⚡", desc: "Your highest-impact next steps" },
];

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-600 text-white text-sm mr-2 self-end">🤖</div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-violet-600 text-white rounded-br-sm"
          : "bg-slate-100 text-slate-700 rounded-bl-sm"
      }`}>
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={line.startsWith("**") ? "font-bold" : ""}>{line.replace(/\*\*/g, "")}</p>
        ))}
        {message.source === "fallback" && (
          <p className="text-xs opacity-60 mt-1">💡 Personalized based on your data</p>
        )}
      </div>
      {isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600 text-sm ml-2 self-end">👤</div>
      )}
    </div>
  );
}

export default function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your CareerTrack AI Career Assistant.\n\nI know your progress — DSA, SQL, study hours, goals, streaks, and more. Ask me anything, or tap a quick insight below.`,
      source: "system"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text, type = "chat") => {
    if (!text.trim()) return;
    const userMsg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const r = await chatWithAI(text, type);
      setMessages((m) => [...m, { role: "assistant", content: r.response, source: r.source }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, I ran into an issue: ${getErrorMessage(e)}`, source: "error" }]);
    } finally {
      setLoading(false);
    }
  };

  const loadInsight = async (type, label) => {
    setLoadingInsight(type);
    const userMsg = { role: "user", content: `Give me: ${label}` };
    setMessages((m) => [...m, userMsg]);
    try {
      const r = await getAIInsight(type);
      setMessages((m) => [...m, { role: "assistant", content: r.response, source: r.source }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: getErrorMessage(e), source: "error" }]);
    } finally {
      setLoadingInsight(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <PageHeader
        eyebrow="AI-Powered"
        title="Career Assistant"
        description="Personalized guidance based on your actual CareerTrack data."
      />

      {/* Quick Insights */}
      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_INSIGHTS.map(({ type, label, icon }) => (
          <button key={type} onClick={() => loadInsight(type, label)} disabled={loadingInsight === type || loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-violet-400 hover:text-violet-600 disabled:opacity-50 transition">
            {loadingInsight === type ? <Spinner size="xs" /> : icon} {label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
          {loading && (
            <div className="flex justify-start mb-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-violet-600 text-white text-sm mr-2">🤖</div>
              <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4">
          <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your preparation, weak areas, interview tips..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              disabled={loading}
            />
            <Button type="submit" loading={loading} disabled={!input.trim()}>Send</Button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            Responses are personalized using your real CareerTrack activity data.
          </p>
        </div>
      </Card>
    </div>
  );
}
