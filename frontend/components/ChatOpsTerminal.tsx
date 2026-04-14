"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/lib/api";
import { sendChatMessage } from "@/lib/api";

const QUICK_ASKS = [
  { label: "System Status", query: "Give me a quick system health summary" },
  { label: "Top Failures", query: "What are the most common failure types right now?" },
  { label: "Region Analysis", query: "Which region is performing the worst and why?" },
  { label: "SLA Risk", query: "Are we at risk of an SLA breach? What's the trend?" },
];

export default function ChatOpsTerminal() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "Kairos AI online. Ask me anything about the live system.\n\nExamples:\n• \"Why did the success rate drop?\"\n• \"Which region has the most failures?\"\n• \"What error codes are trending?\"",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text);
      const aiMsg: ChatMessage = {
        role: "ai",
        content: result.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: "ai",
        content: "⚠ Failed to reach Kairos AI. Check backend connectivity.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div id="chatops" className="sentinel-card p-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-s-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-s-cyan" />
          <h2 className="font-display font-semibold text-sm uppercase tracking-[0.15em]">
            ChatOps Terminal
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-s-green">
          <Sparkles className="w-3 h-3" />
          Gemini AI
        </div>
      </div>

      {/* Quick Ask Buttons */}
      <div className="flex gap-2 px-4 py-2 border-b border-s-border/50 overflow-x-auto">
        {QUICK_ASKS.map((qa) => (
          <button
            key={qa.label}
            onClick={() => handleSend(qa.query)}
            disabled={isLoading}
            className="flex-shrink-0 px-3 py-1 text-[10px] font-mono bg-s-surface/60 text-s-muted border border-s-border/50 rounded-full hover:text-s-cyan hover:border-s-cyan/30 transition-all duration-200 disabled:opacity-50"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 max-h-[280px] p-4 space-y-3 font-mono text-[12px]"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-5 h-5 rounded bg-s-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-s-cyan" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-s-cyan/10 text-s-cyan border border-s-cyan/20"
                    : "bg-s-surface/80 text-s-text/90 border border-s-border/50"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-s-cyan text-[11px]"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="animate-pulse">Kairos AI is thinking...</span>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-s-border px-4 py-3 flex gap-2 items-center">
        <span className="text-s-cyan text-sm font-mono">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Kairos AI about the system..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-s-text text-[12px] font-mono outline-none placeholder:text-s-muted/50 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          className="p-1.5 rounded bg-s-cyan/10 text-s-cyan border border-s-cyan/20 hover:bg-s-cyan/20 transition-all duration-200 disabled:opacity-30"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
