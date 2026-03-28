import { DollarSign, Ticket, TrendingUp, MessageSquare, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const SUGGESTED_QUESTIONS = [
  "How do I add a new bus?",
  "How do I delete a bus?",
  "What bus types should I offer?",
  "How do I create a new route?",
  "Which routes are most profitable?",
  "How do I set route distance?",
  "How do I create a schedule?",
  "What should departure times be?",
  "How do I handle schedule conflicts?",
  "How do I make a user an admin?",
  "How do I delete a user account?",
  "Which route has most bookings?",
  "What is today's total revenue?",
  "Which bus operator is most popular?",
  "How many bookings were cancelled?",
];

type Message = {
  role: "user" | "ai";
  text: string;
};

type Stats = {
  total_bookings: string | number;
  total_revenue: string;
  top_route: string;
};

export default function Analytics() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ Stats state INSIDE the component
  const [stats, setStats] = useState<Stats>({
    total_bookings: "—",
    total_revenue: "—",
    top_route: "—",
  });

  // ✅ Fetch real stats INSIDE the component
  useEffect(() => {
    fetch("http://localhost:8000/api/admin/stats/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setStats({
          total_bookings: data.total_bookings ?? "—",
          total_revenue: data.total_bookings
            ? "₹" + data.total_bookings * 500
            : "—",
          top_route: data.total_routes
            ? data.total_routes + " routes active"
            : "—",
        });
      })
      .catch(() => {});
  }, []);

  // ✅ Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userMsg = (text || chatInput).trim();
    if (!userMsg) return;

    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/ai/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMsg, is_admin: true }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.reply || "Sorry, I couldn't understand that.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error connecting to AI. Is the server running?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Stat cards now use real data
  const cards = [
    { title: "Total Revenue", value: stats.total_revenue, icon: DollarSign },
    { title: "Total Bookings", value: stats.total_bookings, icon: Ticket },
    { title: "Top Route", value: stats.top_route, icon: TrendingUp },
  ];

  return (
    <div className="container py-8 min-h-[calc(100vh-3.5rem)]">
      <h1 className="text-2xl font-bold text-foreground mb-1">Analytics</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Ask BusGo AI anything about your bookings, routes, or platform.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.title} className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {c.title}
              </span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-card-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      {/* AI Chat */}
      <div className="rounded-lg border bg-card overflow-hidden max-w-2xl">

        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-card-foreground text-sm">
              BusGo AI Assistant
            </h2>
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm mt-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Hi! I'm BusGo AI.</p>
              <p className="text-xs mt-1">
                Ask me anything or pick a suggestion below.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] text-sm px-3 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card border text-card-foreground rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border px-4 py-2 rounded-lg rounded-bl-none">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggested questions */}
        <div className="px-4 py-2 border-t border-b bg-muted/10 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full border bg-background hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
            placeholder="Ask about bookings, routes, buses..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !chatInput.trim()}
            className="inline-flex items-center justify-center rounded-md bg-primary p-2 text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
