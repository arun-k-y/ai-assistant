

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Trash2,
  User,
  Bot,
  Copy,
  Check,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import PromptLibrary from "@/components/PromptLibrary";
import Settings from "@/components/Settings";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface ChatSettings {
  temperature: number;
  maxTokens: number;
  modelName: string;
  stream: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi there! I'm your advanced AI assistant. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 2000,
    modelName: "gpt-4o-mini",
    stream: true,
  });

  // Background preset B: deep navy neon (used across UI classes)
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch {
        // ignore parse error
      }
    }

    const savedSettings = localStorage.getItem("chatSettings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // ignore parse error
      }
    }

    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    } catch {
      // ignore
    }
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem("chatSettings");
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("settingsUpdated", handleSettingsChange);

    window.addEventListener("storage", (e) => {
      if (e.key === "chatSettings" && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsChange);
    };
  }, []);

  const scrollToBottom = () => {
    try {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't focus if user is already typing in another input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (inputRef?.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() === "") return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          settings,
          stream: settings.stream,
        }),
      });

      if (!response.ok) {
        // Try to parse error response
        let errorData: { message?: string; error?: string; details?: string } | null = null;
        let errorMessage = "Failed to get response from the server";

        try {
          errorData = await response.json();
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        } catch {
          console.error("Failed to parse server error response");
        }

        const errorDetails = errorData?.details
          ? `\n\n**Details:** ${errorData.details}`
          : "";
        const formattedError = `## ⚠️ Error\n\n${errorMessage}${errorDetails}\n\n---\n\n*If this issue persists, please check your API keys in Settings or try a different model.*`;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: formattedError,
            timestamp: Date.now(),
          },
        ]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      if (settings.stream) {
        // Streaming response handling
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          setIsTyping(false);
          // Add an empty assistant message to update progressively
          const assistantMessageIndex = messages.length + 1;
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", timestamp: Date.now() },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  break;
                }
                try {
                  const parsed = JSON.parse(data);

                  if (parsed.error) {
                    const errorMessage =
                      parsed.message || "An error occurred during streaming";
                    const errorDetails = parsed.details
                      ? `\n\n**Details:** ${parsed.details}`
                      : "";
                    const formattedError = `## ⚠️ Error\n\n${errorMessage}${errorDetails}\n\n---\n\n*If this issue persists, please check your API keys in Settings or try a different model.*`;

                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[assistantMessageIndex] = {
                        role: "assistant",
                        content: formattedError,
                        timestamp: Date.now(),
                      };
                      return newMessages;
                    });
                    setIsTyping(false);
                    setIsLoading(false);
                    return;
                  }

                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      newMessages[assistantMessageIndex] = {
                        role: "assistant",
                        content: accumulatedContent,
                        timestamp: Date.now(),
                      };
                      return newMessages;
                    });
                  }
                } catch (err) {
                  // Non-blocking parse errors for streaming chunks
                  console.debug("Streaming parse error (non-critical):", err);
                }
              }
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, timestamp: Date.now() },
        ]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Chat request error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      const formattedError = `## ⚠️ Error\n\n${errorMessage}\n\n---\n\n*If this issue persists, please check your API keys in Settings or try a different model.*`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formattedError, timestamp: Date.now() },
      ]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Chat history cleared. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  const copyToClipboard = (text: string, index: number) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  const exportChat = () => {
    try {
      const chatContent = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");
      const blob = new Blob([chatContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${new Date().toISOString()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;

    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);

    const lastUserMessage = newMessages[newMessages.length - 1];
    if (lastUserMessage?.role === "user") {
      setInput(lastUserMessage.content);
      setTimeout(() => {
        const form = document.querySelector("form");
        form?.requestSubmit();
      }, 100);
    }
  };

  return (
    <div
      className="flex h-screen flex-col antialiased"
      style={{
        // Deep Navy Neon background (preset B)
        background:
          "radial-gradient(600px 300px at 10% 10%, rgba(46, 48, 72, 0.55), transparent), " +
          "radial-gradient(500px 220px at 90% 85%, rgba(124, 58, 237, 0.18), transparent), " +
          "linear-gradient(180deg, #060617 0%, #071029 45%, #0b1220 100%)",
        color: "var(--tw-prose-body, #e6eef8)",
      }}
    >
      {/* Top header - glossy neon bar */}
      <header className="border-b border-white/6 backdrop-blur-md bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full p-1 hover:bg-white/3 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]">
                  NeonAI
                </div>
                <div className="text-xs text-slate-300">
                  {settings.modelName}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <PromptLibrary onSelectPrompt={(content) => setInput(content)} />
            <button
              onClick={exportChat}
              title="Export chat"
              className="rounded-md px-2 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/4 transition"
            >
              <Download className="h-4 w-4" />
            </button>

            <Settings />

            <button
              onClick={clearChat}
              className="rounded-md px-3 py-2 text-sm font-medium bg-white/3 text-slate-200 hover:bg-white/6 transition"
            >
              <Trash2 className="inline-block h-4 w-4 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isError = message.content.startsWith("## ⚠️ Error");
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.28 }}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[86%] ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow ${
                            isUser
                              ? "bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]"
                              : "bg-gradient-to-br from-[#7c3aed] to-[#06b6d4]"
                          }`}
                        >
                          {isUser ? (
                            <User className="h-5 w-5 text-white" />
                          ) : (
                            <Bot className="h-5 w-5 text-white" />
                          )}
                        </div>

                        <div
                          className={`group relative rounded-2xl px-5 py-3 shadow-lg border ${
                            isError
                              ? "border-red-400/30 bg-rose-50/5 text-rose-200"
                              : isUser
                              ? "bg-gradient-to-br from-[#04102a]/80 to-[#05243a]/70 text-slate-100 border-white/6"
                              : "bg-[#071029]/80 text-slate-200 border-white/6"
                          }`}
                          style={{
                            boxShadow: isUser
                              ? "0 10px 30px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.02)"
                              : "0 10px 30px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.02)",
                            backdropFilter: "saturate(120%) blur(6px)",
                          }}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code(props) {
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    const { children, className, ref, ...rest } =
                                      props;
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    return match ? (
                                      <SyntaxHighlighter
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        style={oneDark as any}
                                        language={match[1]}
                                        PreTag="div"
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </SyntaxHighlighter>
                                    ) : (
                                      <code
                                        className={`${className} rounded px-1 py-[2px] bg-white/6`}
                                        {...rest}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                  // style other elements minimally for dark mode
                                  p: ({ ...props }) => (
                                    <p
                                      className="text-sm leading-relaxed text-slate-200"
                                      {...props}
                                    />
                                  ),
                                  a: ({ ...props }) => (
                                    <a
                                      className="underline text-sky-300 hover:text-sky-200"
                                      {...props}
                                    />
                                  ),
                                  li: ({ ...props }) => (
                                    <li
                                      className="text-sm text-slate-200"
                                      {...props}
                                    />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-sm text-slate-100">
                              {message.content}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {message.role === "assistant" && (
                              <button
                                onClick={() =>
                                  copyToClipboard(message.content, index)
                                }
                                title="Copy assistant message"
                                className="rounded p-1 hover:bg-white/4 transition"
                              >
                                {copiedIndex === index ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-300" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-start"
                >
                  <div className="flex">
                    <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] shadow">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="rounded-2xl bg-[#071029]/80 p-3 border border-white/6 shadow">
                      <div className="flex items-center space-x-2">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                          style={{ animationDelay: "120ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                          style={{ animationDelay: "240ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={endOfMessagesRef} />
            </div>
          </div>

          {/* Footer / input */}
          <footer className="border-t border-white/6 bg-gradient-to-t from-transparent to-black/20 px-6 py-4">
            {messages.length > 1 &&
              messages[messages.length - 1].role === "assistant" && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={regenerateResponse}
                    disabled={isLoading}
                    className="flex items-center text-xs text-slate-300 hover:text-white disabled:opacity-50 transition"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Regenerate response
                  </button>
                </div>
              )}

            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto flex items-center gap-3"
            >
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-full border border-white/8 bg-[#041022]/70 px-5 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 transition"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || input.trim() === ""}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#fb7185] text-white shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-3">
              Press Enter to send • {messages.length} messages
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
