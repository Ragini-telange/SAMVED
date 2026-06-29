import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, MessageSquare, Sparkles, AlertCircle, Compass, HelpCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICityAssistantProps {
  onPointsEarned?: (points: number) => void;
}

export default function AICityAssistant({ onPointsEarned }: AICityAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Namaskar! 🙏 I am **Samved AI**, your hyperlocal virtual assistant. I am ready to help you track and manage citizen issues, municipal routing, and localized hazards in Pune, Mumbai, Bengaluru, Delhi, or any other city you choose on the map! Ask me anything about currently reported issues or checking regional safety scores. How can I help you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Convert messages list to Gemini API history format
      const history = messages.slice(1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        content: m.content
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history })
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
      if (onPointsEarned) {
        onPointsEarned(10);
      }
    } catch (error) {
      console.error("Failed to chat with AI:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oops! I encountered an error. Please try again. If you don't have a Gemini API key configured in **Settings > Secrets**, I am running in local offline demo mode."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const suggestions = [
    "What potholes are reported in Shivajinagar?",
    "Show municipal departments and their contacts",
    "Where is the water leakage flooding issue?",
    "How can I earn Community Hero points?"
  ];

  return (
    <div className="flex flex-col h-[520px] bg-[#0D0F13] border border-white/10 rounded-lg overflow-hidden shadow-xl shadow-black/40">
      {/* Header */}
      <div className="bg-[#0F1116] border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Bot className="w-4 h-4" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0F1116]" />
          </div>
          <div>
            <h3 className="font-serif italic text-sm text-white tracking-wide flex items-center gap-1">
              SAMVED AI CITY COACH <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
            </h3>
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Hyperlocal Virtual Civic Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          ACTIVE DEEP GROUNDING
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          return (
            <div key={i} className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              {/* Avatar */}
              <div className={`flex items-center justify-center w-7 h-7 rounded shrink-0 border select-none text-xs font-bold ${
                isUser ? "bg-blue-600 border-blue-500 text-white" : "bg-[#0A0B0E] border-white/10 text-blue-400"
              }`}>
                {isUser ? "C" : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                isUser 
                  ? "bg-blue-600/10 border border-blue-500/20 text-white rounded-tr-none" 
                  : "bg-[#0A0B0E]/80 border border-white/5 text-white/80 rounded-tl-none"
              }`}>
                {/* Custom basic formatting helper */}
                <div className="space-y-1">
                  {message.content.split("\n").map((line, idx) => {
                    // Check for lists or bold
                    let formattedLine = line;
                    
                    // Simple bold replacement (**text**)
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIndex = 0;
                    let match;
                    while ((match = boldRegex.exec(formattedLine)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(formattedLine.substring(lastIndex, match.index));
                      }
                      parts.push(<strong key={match.index} className="text-white font-semibold">{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    if (lastIndex < formattedLine.length) {
                      parts.push(formattedLine.substring(lastIndex));
                    }

                    const finalLine = parts.length > 0 ? parts : formattedLine;

                    if (line.startsWith("- ")) {
                      return <li key={idx} className="ml-4 list-disc mt-0.5">{finalLine}</li>;
                    }
                    if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") || line.startsWith("4. ")) {
                      return <p key={idx} className="pl-4 mt-1 font-sans">{finalLine}</p>;
                    }
                    return <p key={idx} className="mt-0.5">{finalLine}</p>;
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-[#0A0B0E] border border-white/10 text-blue-400">
              <Bot className="w-3.5 h-3.5 animate-bounce" />
            </div>
            <div className="p-3 bg-[#0A0B0E]/80 border border-white/5 text-white/60 rounded-lg rounded-tl-none text-xs flex items-center gap-1.5">
              <span>Samved AI is analyzing complaints & weather indicators</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !isLoading && (
        <div className="px-4 pb-2 pt-0.5">
          <p className="text-[10px] text-white/30 font-bold mb-1 flex items-center gap-1 uppercase tracking-widest"><HelpCircle className="w-3 h-3 text-blue-400" /> SUGGESTED CIVIC QUESTIONS:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                className="bg-[#0A0B0E] hover:bg-white/5 border border-white/10 hover:border-white/20 text-white/80 text-[10px] px-2.5 py-1 rounded transition select-none cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSendMessage} className="bg-[#0F1116] border-t border-white/10 p-3 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Samved AI about municipal complaints..."
          className="flex-1 bg-[#0A0B0E] border border-white/10 hover:border-white/20 focus:border-white/30 focus:outline-none rounded text-xs text-white px-3.5 py-2.5 transition"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded transition disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
