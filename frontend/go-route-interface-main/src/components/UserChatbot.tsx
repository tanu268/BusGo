import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Minimize2 } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How do I search for buses?",
  "How do I book a seat?",
  "How do I cancel my booking?",
  "What payment methods are accepted?",
  "How do I choose my seat?",
  "Can I book for someone else?",
];

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function UserChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        body: JSON.stringify({ message: userMsg, is_admin: false }),
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
        { role: "ai", text: "Error connecting. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* ✅ Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-semibold text-sm">BusGo Assistant</span>
              <span className="text-xs bg-green-400 text-green-900 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpen(false)}
                className="hover:opacity-70 transition-opacity"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setOpen(false); setMessages([]); }}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm mt-6">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Hi! I'm BusGo Assistant 👋</p>
                <p className="text-xs mt-1">
                  I can help you search buses, book tickets, and more.
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
                  className={`max-w-[80%] text-sm px-3 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-none">
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
          {messages.length === 0 && (
            <div className="px-3 py-2 border-t flex flex-wrap gap-1.5 bg-background">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="text-xs px-2.5 py-1 rounded-full border hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex gap-2 bg-background">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-full border bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !chatInput.trim()}
              className="bg-primary text-primary-foreground rounded-full p-2 disabled:opacity-50 hover:scale-105 transition-transform"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}