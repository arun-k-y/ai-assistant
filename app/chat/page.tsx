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
  MessageSquare,
  Plus,
  Menu,
  X,
  Sparkles,
  Zap,
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

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatSettings {
  temperature: number;
  maxTokens: number;
  modelName: string;
  stream: boolean;
  systemPrompt?: string;
}

type AuraMode = "default" | "coding" | "creative" | "error" | "success";

const auraThemes: Record<AuraMode, {
  bg: string;
  aurora: string;
  accent: string;
  userBubble: string;
  button: string;
  glow: string;
}> = {
  default: {
    bg: "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 100%)",
    aurora: "from-indigo-500/10 via-purple-500/5 to-transparent",
    accent: "from-indigo-600 to-purple-600",
    userBubble: "bg-gradient-to-br from-indigo-500 to-blue-600",
    button: "bg-gradient-to-tr from-indigo-600 to-purple-600",
    glow: "from-indigo-500 via-purple-500 to-pink-500",
  },
  coding: {
    bg: "radial-gradient(circle at 50% 0%, #0f172a 0%, #020617 100%)",
    aurora: "from-cyan-500/10 via-blue-500/5 to-transparent",
    accent: "from-cyan-600 to-blue-600",
    userBubble: "bg-gradient-to-br from-cyan-500 to-blue-600",
    button: "bg-gradient-to-tr from-cyan-600 to-blue-600",
    glow: "from-cyan-500 via-blue-500 to-indigo-500",
  },
  creative: {
    bg: "radial-gradient(circle at 50% 0%, #2a0a18 0%, #020617 100%)",
    aurora: "from-pink-500/10 via-rose-500/5 to-transparent",
    accent: "from-pink-600 to-rose-600",
    userBubble: "bg-gradient-to-br from-pink-500 to-rose-600",
    button: "bg-gradient-to-tr from-pink-600 to-rose-600",
    glow: "from-pink-500 via-rose-500 to-orange-500",
  },
  error: {
    bg: "radial-gradient(circle at 50% 0%, #2a0a0a 0%, #020617 100%)",
    aurora: "from-red-500/10 via-orange-500/5 to-transparent",
    accent: "from-red-600 to-orange-600",
    userBubble: "bg-gradient-to-br from-red-500 to-orange-600",
    button: "bg-gradient-to-tr from-red-600 to-orange-600",
    glow: "from-red-500 via-orange-500 to-yellow-500",
  },
  success: {
    bg: "radial-gradient(circle at 50% 0%, #062c18 0%, #020617 100%)",
    aurora: "from-emerald-500/10 via-green-500/5 to-transparent",
    accent: "from-emerald-600 to-teal-600",
    userBubble: "bg-gradient-to-br from-emerald-500 to-teal-600",
    button: "bg-gradient-to-tr from-emerald-600 to-teal-600",
    glow: "from-emerald-500 via-green-500 to-teal-500",
  },
};

const analyzeAura = (text: string): AuraMode => {
  const lower = text.toLowerCase();
  if (lower.includes("error") || lower.includes("fail") || lower.includes("crash") || lower.includes("exception") || lower.includes("bug")) return "error";
  if (lower.includes("success") || lower.includes("great") || lower.includes("working") || lower.includes("thank") || lower.includes("perfect")) return "success";
  if (lower.includes("code") || lower.includes("function") || lower.includes("api") || lower.includes("component") || lower.includes("react") || lower.includes("typescript")) return "coding";
  if (lower.includes("create") || lower.includes("design") || lower.includes("story") || lower.includes("imagine") || lower.includes("write")) return "creative";
  return "default";
};

export default function ChatPage() {
  /* -------------------------
     State & refs
  ------------------------- */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Derived state for current messages
  const messages = conversations.find((c) => c.id === currentId)?.messages || [];

  const setMessages = (
    fn: ((prev: Message[]) => Message[]) | Message[]
  ) => {
    setConversations((prev) => {
      const copy = [...prev];
      const index = copy.findIndex((c) => c.id === currentId);
      if (index === -1) return prev;

      const newMessages = typeof fn === "function" ? fn(copy[index].messages) : fn;

      // Auto-title if first user message
      let newTitle = copy[index].title;
      if (copy[index].messages.length <= 1 && newMessages.length > 1) {
        const firstUserMsg = newMessages.find(m => m.role === "user");
        if (firstUserMsg) {
          newTitle = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "");
        }
      }

      copy[index] = {
        ...copy[index],
        messages: newMessages,
        title: newTitle,
        updatedAt: Date.now(),
      };
      // Sort by updated
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  };

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // indicates request in-flight
  const [isTyping, setIsTyping] = useState(false); // indicates assistant typing animation
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(() => ({
    temperature: 0.7,
    maxTokens: 2000,
    modelName: "gpt-4o-mini",
    stream: true,
    systemPrompt: "",
  }));

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [aura, setAura] = useState<AuraMode>("default");

  /* -------------------------
     Aura Effect
  ------------------------- */
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const newAura = analyzeAura(lastMsg.content);
      setAura(newAura);
    } else {
      setAura("default");
    }
  }, [messages]);

  /* -------------------------
     Load saved state on mount
  ------------------------- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("luminaConversations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          setConversations(parsed);
          setCurrentId(parsed[0].id);
        } else {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    } catch {
      createNewChat();
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
      localStorage.setItem("luminaConversations", JSON.stringify(conversations));
    } catch { }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem("chatSettings", JSON.stringify(settings));
    } catch { }

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
    setMessages((prev) => prev.filter((_, idx) => idx < lastUserIndex));
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

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    const newConv: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [
        {
          role: "assistant",
          content: "👋 Hi! I'm Lumina. How can I help you today?",
          timestamp: Date.now(),
          id: `m-${Date.now()}`,
        },
      ],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentId(newId);
    setIsSidebarOpen(false);
    setAutoScroll(true);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        // If deleted last one, create new
        setTimeout(createNewChat, 0);
        return [];
      }
      if (id === currentId) {
        setCurrentId(filtered[0].id);
      }
      return filtered;
    });
  };

  const clearChat = () => {
    setMessages(() => [
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
          systemPrompt: settings.systemPrompt,
        }),
      });

      if (!res.ok) {
        // try parse body
        let errorData: { message?: string; error?: string } | null = null;
        try {
          errorData = await res.json();
        } catch { }
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
            if (!line || line.includes("[DONE]")) continue;
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
    const upTo = messages.indexOf(lastUser);
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
      className="flex h-[100dvh] flex-col antialiased overflow-hidden relative transition-colors duration-1000 ease-in-out"
      style={{
        background: auraThemes[aura].bg,
        color: "var(--tw-prose-body, #e6eef8)",
      }}
    >
      {/* Aurora Background Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${auraThemes[aura].aurora} animate-aurora opacity-50 blur-3xl transition-all duration-1000`}></div>
      </div>

      {/* Sidebar (Desktop & Mobile Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex flex-1 h-full relative z-10">
        {/* Floating Glass Sidebar */}
        <motion.div
          className={`fixed inset-y-4 left-4 z-50 w-72 rounded-2xl glass-panel transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:inset-y-0 md:left-0 md:rounded-none md:border-r md:border-white/5 md:bg-black/20 flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-[110%] md:translate-x-0"
            }`}
        >
          <div className="p-5 flex items-center justify-between border-b border-white/5">
            <Link href="/" className="flex items-center gap-3 group">
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${auraThemes[aura].accent} flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-500`}>
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Lumina</span>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <button
              onClick={createNewChat}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r ${auraThemes[aura].button} text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all active:scale-95 duration-500`}
            >
              <Plus className="h-5 w-5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent</div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setCurrentId(conv.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${conv.id === currentId
                  ? "bg-white/10 text-white shadow-inner"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`h-4 w-4 flex-shrink-0 ${conv.id === currentId ? "text-indigo-400" : "text-slate-500"}`} />
                  <span className="text-sm truncate font-medium">{conv.title}</span>
                </div>

                <button
                  onClick={(e) => deleteChat(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                <User className="h-4 w-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">User</div>
                <div className="text-xs text-slate-500 truncate">Pro Plan</div>
              </div>
              <Settings />
            </div>
          </div>
        </motion.div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative">
          {/* Floating Header */}
          <header className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto md:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-slate-300 hover:text-white transition shadow-lg"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="pointer-events-auto ml-auto flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5 text-xs font-medium text-slate-400">
                <Zap className="h-3 w-3 text-yellow-400" />
                {settings.modelName}
              </div>

              <PromptLibrary onSelectPrompt={(content) => setInput(content)} />

              <button
                onClick={exportChat}
                className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition shadow-lg"
                title="Export chat"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={clearChat}
                className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition shadow-lg"
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Chat Messages */}
          <main className="flex-1 overflow-hidden relative flex flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 md:px-8 pt-24 pb-32 scroll-smooth"
            >
              <div className="mx-auto max-w-3xl space-y-8">
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
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex max-w-[90%] md:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-4`}>
                          <div
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full shadow-lg transition-all duration-500 ${isUser
                              ? `bg-gradient-to-br ${auraThemes[aura].accent} ring-2 ring-white/10`
                              : `bg-gradient-to-br ${auraThemes[aura].accent} ring-2 ring-white/10`
                              }`}
                          >
                            {isUser ? (
                              <User className="h-5 w-5 text-white" />
                            ) : (
                              <Bot className="h-5 w-5 text-white" />
                            )}
                          </div>

                          <div
                            className={`group relative rounded-2xl px-6 py-4 shadow-xl backdrop-blur-md transition-all duration-500 min-w-0 ${isError
                              ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                              : isUser
                                ? `${auraThemes[aura].userBubble} border border-white/10 text-white rounded-tr-sm`
                                : "bg-slate-900/40 border border-white/10 text-slate-200 rounded-tl-sm"
                              }`}
                          >
                            {/* Message content */}
                            {message.role === "assistant" ? (
                              <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    pre: ({ children }) => <>{children}</>,
                                    code({
                                      className,
                                      children,
                                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                      ref: _ref,
                                      ...props
                                    }) {
                                      const match = /language-(\w+)/.exec(className || "");
                                      const isBlock = match || String(children).includes("\n");

                                      if (isBlock) {
                                        return (
                                          <div className="w-full max-w-full my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-2xl">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-white/5">
                                              <div className="flex items-center gap-2">
                                                <div className="flex gap-1.5">
                                                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 lowercase ml-2">
                                                  {match ? match[1] : "text"}
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => copyToClipboard(String(children), index)}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md"
                                              >
                                                {copiedIndex === index ? (
                                                  <>
                                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                                    <span className="text-emerald-400">Copied!</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="h-3.5 w-3.5" />
                                                    <span>Copy</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                            <div className="overflow-x-auto">
                                              <SyntaxHighlighter
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                style={oneDark as any}
                                                language={match ? match[1] : "text"}
                                                PreTag="div"
                                                customStyle={{
                                                  margin: 0,
                                                  padding: "1.5rem",
                                                  background: "#1e1e1e",
                                                  fontSize: "0.9rem",
                                                  lineHeight: "1.6",
                                                }}
                                                wrapLongLines={true}
                                              >
                                                {String(children).replace(/\n$/, "")}
                                              </SyntaxHighlighter>
                                            </div>
                                          </div>
                                        );
                                      }
                                      return (
                                        <code
                                          className="rounded-md px-1.5 py-0.5 bg-white/10 text-slate-200 border border-white/10 text-sm font-mono"
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    },
                                    p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                    a: ({ ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 underline-offset-2 transition-colors" {...props} />,
                                    ul: ({ ...props }) => <ul className="list-disc pl-4 mb-4 space-y-1 marker:text-indigo-500" {...props} />,
                                    ol: ({ ...props }) => <ol className="list-decimal pl-4 mb-4 space-y-1 marker:text-indigo-500" {...props} />,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
                                {message.content}
                              </p>
                            )}

                            {/* Action buttons */}
                            <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              {message.role === "assistant" && (
                                <>
                                  <button
                                    onClick={() => copyToClipboard(message.content, index)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                    title="Copy"
                                  >
                                    {copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => retryMessage(index)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                    title="Retry"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition text-[10px] text-slate-500 font-medium">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${auraThemes[aura].accent} flex items-center justify-center shadow-lg ring-2 ring-white/10 transition-all duration-500`}>
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-900/40 border border-white/10 px-5 py-4 backdrop-blur-md">
                      <div className="flex items-center space-x-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "0ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "150ms" }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-white/50" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={endOfMessagesRef} />
              </div>
            </div>

            {/* Floating Command Bar (Footer) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent z-20">
              <div className="max-w-3xl mx-auto relative">
                {/* Scroll to bottom button */}
                {!autoScroll && (
                  <button
                    onClick={() => {
                      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
                      setAutoScroll(true);
                      setUnreadCount(0);
                    }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-2 bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform z-30"
                  >
                    <span className="text-sm font-medium">New messages</span>
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${auraThemes[aura].glow} rounded-3xl opacity-30 group-hover:opacity-60 transition-all duration-1000 blur`}></div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmit();
                    }}
                    className="relative flex items-end gap-2 bg-[#0f172a]/90 backdrop-blur-xl rounded-3xl border border-white/10 p-2 shadow-2xl"
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={handleTextareaInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      rows={1}
                      placeholder="Ask Lumina anything..."
                      className="flex-1 max-h-40 min-h-[44px] py-3 px-4 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none text-[15px] leading-relaxed scrollbar-hide"
                      disabled={isLoading}
                    />
                    <button
                      id="chat-submit"
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className={`h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-tr ${auraThemes[aura].button} text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 duration-500`}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5 ml-0.5" />
                      )}
                    </button>
                  </form>
                </div>
                <div className="text-center mt-3 text-[11px] text-slate-500 font-medium">
                  Lumina can make mistakes. Check important info.
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
