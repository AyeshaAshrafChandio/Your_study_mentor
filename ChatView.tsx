import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatViewProps {
  documentText: string;
  chatHistory: ChatMessage[];
  onAddMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
}

const CONTEXT_QUESTIONS = [
  "Can you list the 3 most important takeaways from this material?",
  "Explain the core concept in simple terms, as if I am 10 years old.",
  "Create a short mock question based on this material to test me.",
  "Summarize the main arguments or facts presented in this document."
];

export default function ChatView({
  documentText,
  chatHistory,
  onAddMessage,
  onClearHistory
}: ChatViewProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    setError(null);
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddMessage(userMsg);
    setInputText("");
    setIsTyping(true);

    try {
      // Build full chat payload including previous history for context
      const chatPayload = [...chatHistory, userMsg].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText,
          messages: chatPayload
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to contact study mentor (Status ${res.status})`);
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onAddMessage(assistantMsg);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while waiting for the mentor.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[500px]" id="chat-view-container">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Study Mentor AI Chat</h2>
            <p className="text-xs text-slate-400">Ask questions, request summaries, or ask to be quizzed on your document.</p>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 font-medium transition-colors"
          >
            Reset Chat
          </button>
        )}
      </div>

      {/* Main Dark Terminal Body */}
      <div className="flex-1 bg-slate-900 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden text-white border border-slate-800">
        <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3 shrink-0">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-bold text-sm">Ask Lumina AI</h3>
        </div>

        {/* Messages Window */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[180px]">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="p-3.5 bg-white/5 text-blue-400 rounded-full mb-4 border border-white/10">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Your Personal Study Assistant</h3>
              <p className="text-slate-400 text-xs max-w-sm mt-1 leading-relaxed">
                I can explain difficult passages, define vocabulary, generate test questions, or walk you through specific concepts.
              </p>
              
              <div className="mt-6 max-w-xl w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3 text-center">Suggested Starting Questions</span>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CONTEXT_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="p-3 bg-white/5 border border-white/10 hover:border-blue-500 hover:bg-blue-600/10 text-slate-300 text-left rounded-xl text-xs font-medium transition-all duration-200"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white/10 text-white/90 border border-white/10 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto">
                  <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">Mentor is thinking...</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-900/40 border border-rose-800/50 text-rose-200 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                  <button 
                    onClick={() => handleSend(chatHistory[chatHistory.length - 1]?.content || "")} 
                    className="ml-auto underline flex items-center gap-1 font-semibold hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form with inside send button */}
        <div className="mt-4 relative shrink-0">
          <input
            type="text"
            placeholder={isTyping ? "Please wait for reply..." : "Type a question..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isTyping}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pr-12 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 disabled:bg-white/10 disabled:text-white/20 hover:bg-blue-500 p-2 rounded-xl text-white transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
