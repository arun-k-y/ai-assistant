"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
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
  id?: string;
  error?: boolean;
}

interface ChatSettings {
  temperature: number;
  maxTokens: number;
  modelName: string;
  stream: boolean;
}

export default function ChatPage() {
  /* -------------------------
     State & refs
  ------------------------- */
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      role: "assistant",
      content:
        "👋 Hi there! I'm your advanced AI assistant. How can I help you today?",
      timestamp: Date.now(),
      id: `m-${Date.now()}`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // indicates request in-flight
  const [isTyping, setIsTyping] = useState(false); // indicates assistant typing animation
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(() => ({
    temperature: 0.7,
    maxTokens: 2000,
    modelName: "gpt-4o-mini",
    stream: true,
  }));

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  /* -------------------------
     Load saved state on mount
  ------------------------- */
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem("chatMessages");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
    } catch {
      /* ignore parse errors */
    }

    try {
      const savedSettings = localStorage.getItem("chatSettings");
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {
      /* ignore parse errors */
    }

    // autofocus
    inputRef.current?.focus();
  }, []);

  /* -------------------------
     Persist messages & settings
  ------------------------- */
  useEffect(() => {
    try {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("chatSettings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  /* -------------------------
     Listen for settings changes from Settings component
  ------------------------- */
  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const savedSettings = localStorage.getItem("chatSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch {
        // ignore parse errors
      }
    };

    window.addEventListener("settingsUpdated", handleSettingsChange);

    // Also listen for storage events (for changes from other tabs)
    window.addEventListener("storage", (e) => {
      if (e.key === "chatSettings" && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    });

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsChange);
    };
  }, []);

  /* -------------------------
     Smart scroll behavior
  ------------------------- */
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const bottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const nearBottom = bottom < 120;
      setAutoScroll(nearBottom);
      if (!nearBottom) {
        // compute unread messages (assistant messages after viewport bottom)
        const unread = messages
          .slice()
          .reverse()
          .findIndex((m) => m.role === "assistant");
        setUnreadCount(unread === -1 ? 0 : unread + 1);
      } else {
        setUnreadCount(0);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [messages]);

  // whenever messages change, scroll if autoScroll enabled
  useEffect(() => {
    if (autoScroll) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  /* -------------------------
     Regenerate / retry helpers
  ------------------------- */
  const regenerateResponse = useCallback(async () => {
    if (messages.length < 2) return;
    // remove last assistant message (if any) and re-send the last user message
    const last = messages[messages.length - 1];
    let lastUserIndex = messages
      .slice(0, -1)
      .map((m) => m.role)
      .lastIndexOf("user");
    if (last.role === "user") {
      lastUserIndex = messages.length - 1;
    }
    if (lastUserIndex === -1) return;
    const lastUser = messages[lastUserIndex];
    // restore input and submit
    setInput(lastUser.content);
    setMessages((prev) => prev.filter((_, idx) => idx <= lastUserIndex));
    setTimeout(() => {
      // submit programmatically
      (
        document.querySelector("#chat-submit") as HTMLButtonElement | null
      )?.click();
    }, 80);
  }, [messages]);

  /* -------------------------
     Keyboard shortcuts + focus behavior
  ------------------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ignore if user typing in any input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Cmd/Ctrl + K -> open Prompt Library (click the button)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const btn = document.querySelector(
          '[title="Prompt Library"]'
        ) as HTMLElement | null;
        btn?.click();
        return;
      }

      // Cmd/Ctrl + Shift + R -> regenerate response
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "r"
      ) {
        e.preventDefault();
        regenerateResponse();
        return;
      }

      // Escape -> blur input
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement | null)?.blur();
        return;
      }

      // otherwise focus input
      if (inputRef?.current) inputRef.current.focus();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [regenerateResponse]);

  /* -------------------------
     Helpers: copy, export, clear
  ------------------------- */
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2_000);
    } catch {
      // ignore clipboard failures
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
      /* ignore */
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "👋 Chat history cleared. How can I help you?",
        timestamp: Date.now(),
        id: `m-${Date.now()}`,
      },
    ]);
    setAutoScroll(true);
  };

  /* -------------------------
     Main submit (send message)
     Handles streaming & non-streaming responses
  ------------------------- */
  const submitMessage = async (
    userText: string,
    currentMessages: Message[]
  ) => {
    // Add user message
    const userMessage: Message = {
      role: "user",
      content: userText,
      timestamp: Date.now(),
      id: `m-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...currentMessages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          settings,
          stream: settings.stream,
        }),
      });

      if (!res.ok) {
        // try parse body
        let errorData: { message?: string; error?: string } | null = null;
        try {
          errorData = await res.json();
        } catch {}
        const msg =
          errorData?.message ||
          errorData?.error ||
          `Server error: ${res.status}`;
        const formatted = `## ⚠️ Error\n\n${msg}\n\n---\n\n*Check your API keys or model settings.*`;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: formatted,
            timestamp: Date.now(),
            id: `m-${Date.now()}`,
            error: true,
          },
        ]);
        setIsTyping(false);
        setIsLoading(false);
        return;
      }

      if (settings.stream) {
        // streaming reader
        const reader = res.body?.getReader();
        if (!reader) {
          const data = await res.json();
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.message || "No response",
              timestamp: Date.now(),
              id: `m-${Date.now()}`,
            },
          ]);
          setIsTyping(false);
          setIsLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let accumulated = "";
        // add placeholder assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            timestamp: Date.now(),
            id: `m-${Date.now()}`,
          },
        ]);
        const assistantIndex = messages.length + 1;

        // read loop
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // server may stream SSE-like "data: {..}\n\n" chunks or raw text; attempt reasonable parsing
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line) continue;
            let textChunk = line;
            // if server uses "data: " prefix
            if (line.startsWith("data: ")) textChunk = line.slice(6);
            try {
              // try JSON parse if possible
              const parsed = JSON.parse(textChunk);
              if (parsed.error) {
                const errMsg = parsed.message || "Streaming error";
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[assistantIndex] = {
                    role: "assistant",
                    content: `## ⚠️ Error\n\n${errMsg}`,
                    timestamp: Date.now(),
                    id: `m-${Date.now()}`,
                    error: true,
                  };
                  return copy;
                });
                setIsTyping(false);
                setIsLoading(false);
                return;
              }
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) => {
                  const copy = [...prev];
                  // if assistantIndex out of bounds, append
                  if (assistantIndex >= copy.length)
                    copy.push({
                      role: "assistant",
                      content: accumulated,
                      timestamp: Date.now(),
                      id: `m-${Date.now()}`,
                    });
                  else
                    copy[assistantIndex] = {
                      ...copy[assistantIndex],
                      content: accumulated,
                      timestamp: Date.now(),
                    };
                  return copy;
                });
              }
            } catch {
              // not JSON, append raw text
              accumulated += textChunk;
              setMessages((prev) => {
                const copy = [...prev];
                if (assistantIndex >= copy.length)
                  copy.push({
                    role: "assistant",
                    content: accumulated,
                    timestamp: Date.now(),
                    id: `m-${Date.now()}`,
                  });
                else
                  copy[assistantIndex] = {
                    ...copy[assistantIndex],
                    content: accumulated,
                    timestamp: Date.now(),
                  };
                return copy;
              });
            }
          }
        } // end read
      } else {
        // non-streaming
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "No response",
            timestamp: Date.now(),
            id: `m-${Date.now()}`,
          },
        ]);
      }

      setIsTyping(false);
      setIsLoading(false);
    } catch (err) {
      console.error("Chat error:", err);
      const msg =
        err instanceof Error && err.message ? err.message : "Network error";
      const formatted = `## ⚠️ Error\n\n${msg}\n\n---\n\n*If this persists, check API keys.*`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: formatted,
          timestamp: Date.now(),
          id: `m-${Date.now()}`,
          error: true,
        },
      ]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  /* -------------------------
     Form submit handler (wired to UI)
     uses autosize behavior and supports Enter/Shift+Enter
  ------------------------- */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    // capture snapshot of messages to include in request
    const snapshot = [...messages];
    setInput("");
    // reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
    }

    await submitMessage(text, snapshot);
  };

  /* -------------------------
     UI helpers
  ------------------------- */
  const formatTime = (ts?: number) =>
    new Date(ts ?? Date.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    setInput(ta.value);
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 400) + "px";
  };

  const retryMessage = async (index: number) => {
    // find previous user message near this assistant message
    const msg = messages[index];
    if (!msg || msg.role !== "assistant") return;
    // find last user message before this assistant
    const userIndex = [...messages]
      .slice(0, index)
      .reverse()
      .findIndex((m) => m.role === "user");
    if (userIndex === -1) return;
    const lastUser = [...messages]
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUser) return;
    // trim messages up to that user and re-submit
    const upTo = messages.indexOf(lastUser) + 1;
    const snapshot = messages.slice(0, upTo);
    setMessages(snapshot);
    setInput(lastUser.content);
    setTimeout(() => {
      (
        document.querySelector("#chat-submit") as HTMLButtonElement | null
      )?.click();
    }, 90);
  };

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div
      className="flex h-screen flex-col antialiased"
      style={{
        background:
          "radial-gradient(600px 300px at 10% 10%, rgba(46, 48, 72, 0.55), transparent), " +
          "radial-gradient(500px 220px at 90% 85%, rgba(124, 58, 237, 0.18), transparent), " +
          "linear-gradient(180deg, #060617 0%, #071029 45%, #0b1220 100%)",
        color: "var(--tw-prose-body, #e6eef8)",
      }}
    >
      {/* Header */}
      <header className="border-b border-white/6 backdrop-blur-md bg-black/20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
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
            {/* PromptLibrary includes its own button with title "Prompt Library" */}
            <PromptLibrary onSelectPrompt={(content) => setInput(content)} />
            <button
              onClick={exportChat}
              title="Export chat"
              className="rounded-md px-2 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/4 transition"
              aria-label="Export chat"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Settings component opens its own side panel */}
            <Settings />

            <button
              onClick={clearChat}
              className="rounded-md px-3 py-2 text-sm font-medium bg-white/3 text-slate-200 hover:bg-white/6 transition"
              aria-label="Clear chat"
              title="Clear chat"
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
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-8"
          >
            <div className="mx-auto max-w-3xl space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const isError =
                    !!message.error ||
                    (typeof message.content === "string" &&
                      message.content.startsWith("## ⚠️ Error"));
                  return (
                    <motion.div
                      key={message.id ?? index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.22 }}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex max-w-[86%] ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        } items-start gap-3`}
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
                          className={`group relative rounded-2xl px-5 py-3 border transition-all duration-200 select-text ${
                            isError
                              ? "border-red-400/30 bg-rose-50/5 text-rose-200"
                              : isUser
                              ? "bg-gradient-to-br from-[#04102a]/80 to-[#05243a]/70 text-slate-100 border-white/6"
                              : "bg-[#071029]/80 text-slate-200 border-white/6"
                          }`}
                          style={{
                            boxShadow: isUser
                              ? "0 12px 30px rgba(59,130,246,0.07), inset 0 1px 0 rgba(255,255,255,0.02)"
                              : "0 12px 30px rgba(124,58,237,0.06), inset 0 1px 0 rgba(255,255,255,0.02)",
                            backdropFilter: "saturate(120%) blur(6px)",
                          }}
                        >
                          {/* Message content (markdown for assistant) */}
                          {message.role === "assistant" ? (
                            <div className="prose prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:overflow-x-auto prose-pre:max-w-full">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({
                                    className,
                                    children,
                                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    ref: _ref,
                                    ...props
                                  }) {
                                    const match = /language-(\w+)/.exec(
                                      className || ""
                                    );
                                    if (match) {
                                      return (
                                        <div className="overflow-x-auto max-w-full rounded-lg my-4">
                                          <SyntaxHighlighter
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            style={oneDark as any}
                                            language={match[1]}
                                            PreTag="div"
                                            customStyle={{
                                              margin: 0,
                                              borderRadius: "0.5rem",
                                              fontSize: "0.875rem",
                                            }}
                                          >
                                            {String(children).replace(
                                              /\n$/,
                                              ""
                                            )}
                                          </SyntaxHighlighter>
                                        </div>
                                      );
                                    }
                                    return (
                                      <code
                                        className="rounded px-1.5 py-0.5 bg-slate-800/80 text-purple-300 border border-purple-500/20 text-sm font-mono"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
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

                          {/* Action buttons (copy / retry) */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            {message.role === "assistant" && (
                              <>
                                <button
                                  onClick={() =>
                                    copyToClipboard(message.content, index)
                                  }
                                  title="Copy message"
                                  className="rounded p-1 hover:bg-white/4 transition"
                                  aria-label={`Copy message ${index}`}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-slate-300" />
                                  )}
                                </button>

                                {message.error && (
                                  <button
                                    onClick={() => retryMessage(index)}
                                    title="Retry message"
                                    className="rounded p-1 hover:bg-white/4 transition"
                                    aria-label={`Retry message ${index}`}
                                  >
                                    <RefreshCw className="h-4 w-4 text-slate-300" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* timestamp on hover */}
                          <div className="absolute -bottom-5 left-3 opacity-0 group-hover:opacity-100 transition text-[11px] text-slate-400">
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex"
                >
                  <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] shadow">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="rounded-2xl bg-[#071029]/80 p-3 border border-white/6 shadow">
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                        style={{ animationDelay: "120ms" }}
                      />
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-[#a78bfa]"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={endOfMessagesRef} />
            </div>
          </div>

          {/* Scroll-to-bottom floating button */}
          {!autoScroll && (
            <button
              onClick={() => {
                endOfMessagesRef.current?.scrollIntoView({
                  behavior: "smooth",
                });
                setAutoScroll(true);
                setUnreadCount(0);
              }}
              className="fixed bottom-28 right-6 z-50 flex items-center gap-2 rounded-full px-3 py-2 bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] text-white shadow-lg hover:scale-105 transition"
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
            >
              <span className="text-sm">↓</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Footer / input */}
          <footer className="border-t border-white/6 bg-gradient-to-t from-transparent to-black/20 px-6 py-4">
            {messages.length > 1 &&
              messages[messages.length - 1].role === "assistant" && (
                <div className="flex justify-center mb-3">
                  <button
                    onClick={regenerateResponse}
                    disabled={isLoading}
                    className="flex items-center text-xs text-slate-300 hover:text-white disabled:opacity-50 transition"
                    aria-label="Regenerate response"
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Regenerate
                  </button>
                </div>
              )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="max-w-3xl mx-auto flex items-end gap-3"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  rows={1}
                  placeholder="Type your message — Shift+Enter for a new line"
                  className="w-full resize-none overflow-hidden rounded-2xl border border-white/8 bg-[#041022]/70 px-5 py-3 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 transition"
                  disabled={isLoading}
                  aria-label="Chat input"
                />

                {/* small helper / hint */}
                <div className="absolute right-3 bottom-2 text-[11px] text-slate-400 select-none">
                  Shift+Enter ↵ for newline
                </div>
              </div>

              <button
                id="chat-submit"
                type="submit"
                disabled={isLoading || input.trim() === ""}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#fb7185] text-white shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                aria-label="Send message"
                title="Send"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            <div className="flex items-center justify-between max-w-3xl mx-auto mt-3">
              <p className="text-xs text-slate-400">
                Press Enter to send • {messages.length} messages
              </p>
              <div className="flex gap-2">
                <button
                  onClick={exportChat}
                  className="text-xs text-slate-300 hover:text-white"
                  aria-label="Export chat small"
                >
                  Export
                </button>
                <button
                  onClick={clearChat}
                  className="text-xs text-slate-300 hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
