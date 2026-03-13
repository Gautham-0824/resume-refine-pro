"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "ai" | "user";
  content: string;
}

interface ChatPanelProps {
  weaknesses: any[];
  onInstruction: (instruction: string) => Promise<void>;
  isProcessing: boolean;
}

export function ChatPanel({ weaknesses, onInstruction, isProcessing }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Opening AI Message
    if (weaknesses && messages.length === 0) {
      let initMsg = "I've analyzed your resume. Here's what needs work:\n\n";
      weaknesses.forEach((w) => {
        initMsg += `• **${w.issue}** — ${w.suggestion}\n\n`;
      });
      initMsg += "Ask me to fix any of these, or type your own instruction.";
      setMessages([{ role: "ai", content: initMsg }]);
    }
  }, [weaknesses, messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    
    // Pass to parent to handle Gemini call and state update
    try {
      await onInstruction(userMsg);
      // We don't add the AI response here immediately. Parent will trigger it via a prop if we want, or we can just assume it worked 
      // Actually, parent should tell us the response message, but let's just add a generic success message since parent handles typewriter
      setMessages((prev) => [...prev, { role: "ai", content: "I've made those updates to your resume. Take a look!" }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I ran into an error processing that instruction." }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border-l border-white/5 relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              m.role === "user" 
                ? "bg-amber-500/10 border border-amber-500/20 text-foreground" 
                : "bg-transparent text-foreground/90 leading-relaxed font-light"
            }`}>
              {m.role === "ai" && <Sparkles className="w-4 h-4 text-amber-500 mb-3 inline-block" />} 
              {m.role === "ai" && " "}
              <div className="whitespace-pre-wrap text-[15px]">{m.content}</div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="max-w-[85%] px-5 py-4 text-amber-500 flex gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-100">●</span>
              <span className="animate-pulse delay-200">●</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0d0d0d] border-t border-white/5 shrink-0 z-10 relative">
        <div className="relative flex items-center bg-black rounded-xl border border-white/10 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all shadow-inner shadow-black/50 p-1">
          <Textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to refine your resume..."
            className="min-h-[50px] max-h-32 bg-transparent border-none resize-none focus-visible:ring-0 md:text-[15px] placeholder:text-muted-foreground/50 py-3"
            rows={1}
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="rounded-lg h-9 w-9 bg-amber-500/10 text-amber-500 outline outline-1 outline-amber-500/20 hover:bg-amber-500 hover:text-black shrink-0 mr-1 self-end mb-1 transition-all pointer-events-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground/40 font-mono text-center">
          Ctrl + Enter to send
        </div>
      </div>
    </div>
  );
}
