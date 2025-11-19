
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Menu,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User,
  Settings as SettingsIcon,
  Image as ImageIcon,
  Mic,
  Check,
  Copy,
  Sparkles,
  Code,
  Zap,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import Settings from "@/components/Settings";

/* -------------------------
   Types
------------------------- */
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export default function ChatPage() {
  /* -------------------------
     State & refs
  ------------------------- */
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    model: "gemini-pro",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* -------------------------
     Effects
  ------------------------- */
  useEffect(() => {
    const saved = localStorage.getItem("luminaConversations");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        if (parsed.length > 0) {
          const mostRecent = parsed.sort((a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt)[0];
          setCurrentConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error("Failed to load conversations", e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (currentConversationId && conversations.length > 0) {
      const updatedConversations = conversations.map((c) =>
        c.id === currentConversationId ? { ...c, messages, updatedAt: Date.now() } : c
      );
      // Only update if messages actually changed to avoid loops
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv && JSON.stringify(currentConv.messages) !== JSON.stringify(messages)) {
        setConversations(updatedConversations);
        localStorage.setItem("luminaConversations", JSON.stringify(updatedConversations));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* -------------------------
     Helpers
  ------------------------- */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewChat = () => {
    const newId = crypto.randomUUID();
    const newConversation: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const switchConversation = (id: string) => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      setMessages(conversation.messages);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const deleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newConversations = conversations.filter((c) => c.id !== id);
    setConversations(newConversations);
    localStorage.setItem("luminaConversations", JSON.stringify(newConversations));

    if (currentConversationId === id) {
      if (newConversations.length > 0) {
        setCurrentConversationId(newConversations[0].id);
        setMessages(newConversations[0].messages);
      } else {
        createNewChat();
      }
    }
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  /* -------------------------
     Handlers
  ------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    // Add user message AND empty assistant message (placeholder for loader) immediately
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" }
    ]);
    setInput("");
    setIsLoading(true);

    // Prepare messages for API (exclude the empty assistant placeholder)
    const apiMessages = [...messages, userMessage];

    // Auto-title if first message
    if (messages.length === 0 && currentConversationId) {
      const title = input.slice(0, 30) + (input.length > 30 ? "..." : "");
      updateConversationTitle(currentConversationId, title);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          systemPrompt: settings.systemPrompt,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Note: We already added the empty assistant message, so we just update it now.

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE data
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.trim() === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMessage;
                  return updated;
                });
              } else if (parsed.error) {
                console.error("Stream error:", parsed.message);
                assistantMessage += `\n\n ** Error:** ${parsed.message} `;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantMessage;
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Code block component for ReactMarkdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const [copied, setCopied] = useState(false);
    const codeString = String(children).replace(/\n$/, "");

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (!inline && match) {
      return (
        <div className="my-4 overflow-hidden rounded-lg border border-[#303134] bg-[#1e1f20]">
          <div className="flex items-center justify-between bg-[#2d2e30] px-4 py-2 border-b border-[#303134]">
            <span className="text-xs font-medium text-[#9aa0a6] uppercase">
              {match[1]}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              customStyle={{ margin: 0, background: "transparent" }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }

    return (
      <code className="bg-[#303134] text-[#f28b82] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className="flex h-[100dvh] bg-[#131314] text-[#e3e3e3] font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-[#1e1f20] flex-shrink-0 flex flex-col border-r border-[#303134] overflow-hidden"
      >
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="flex items-center gap-3 w-full px-4 py-3 bg-[#303134] hover:bg-[#3c4043] rounded-xl transition-colors text-[#e3e3e3] font-medium text-sm"
          >
            <Plus className="h-5 w-5" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="px-3 py-2 text-xs font-medium text-[#9aa0a6]">Recent</div>
          <div className="space-y-1">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => switchConversation(chat.id)}
                className={`group flex items - center gap - 3 px - 3 py - 2 rounded - full cursor - pointer text - sm transition - colors ${currentConversationId === chat.id
                  ? "bg-[#004a77] text-[#c2e7ff] font-medium"
                  : "text-[#e3e3e3] hover:bg-[#303134]"
                  } `}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => deleteConversation(e, chat.id)}
                  className={`opacity - 0 group - hover: opacity - 100 p - 1 hover: bg - black / 20 rounded - full transition - opacity ${currentConversationId === chat.id ? "opacity-100" : ""
                    } `}
                >
                  <Trash2 className="h-3.5 w-3.5 text-[#9aa0a6]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#303134]">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 text-[#e3e3e3] hover:bg-[#303134] rounded-full transition-colors text-sm"
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </button>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 flex-shrink-0 bg-[#131314]/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#303134] rounded-full text-[#9aa0a6] transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center gap-2 text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors">
              <span className="font-medium text-xl">Lumina</span>
              <span className="px-2 py-0.5 rounded bg-[#303134] text-[#8ab4f8] text-xs font-medium">2.0</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#8ab4f8] flex items-center justify-center text-[#202124] font-medium text-sm">
              A
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-4">
          <div className="max-w-3xl mx-auto py-6 space-y-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <div className="h-16 w-16 bg-gradient-to-br from-[#8ab4f8] to-[#81c995] rounded-2xl flex items-center justify-center mb-6 shadow-sm opacity-80">
                  <Sparkles className="h-8 w-8 text-[#202124]" />
                </div>
                <h1 className="text-4xl font-medium text-[#e3e3e3] mb-2">Hello, Arun</h1>
                <p className="text-[#9aa0a6] text-lg mb-8">How can I help you today?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    { icon: <Code className="h-5 w-5 text-[#f28b82]" />, text: "Write a Python script" },
                    { icon: <Zap className="h-5 w-5 text-[#fdd663]" />, text: "Explain quantum physics" },
                    { icon: <ImageIcon className="h-5 w-5 text-[#81c995]" />, text: "Generate an image prompt" },
                    { icon: <Bot className="h-5 w-5 text-[#8ab4f8]" />, text: "Debug my code" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(item.text)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-[#1e1f20] hover:bg-[#303134] text-left transition-colors border border-[#303134]"
                    >
                      <div className="p-2 bg-[#303134] rounded-full shadow-sm">{item.icon}</div>
                      <span className="text-[#e3e3e3] font-medium">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap - 4 ${msg.role === "user" ? "flex-row-reverse" : ""} `}>
                  <div className={`flex - shrink - 0 h - 8 w - 8 rounded - full flex items - center justify - center ${msg.role === "user" ? "bg-[#8ab4f8] text-[#202124]" : "bg-gradient-to-br from-[#8ab4f8] to-[#81c995] text-[#202124]"
                    } `}>
                    {msg.role === "user" ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  </div>

                  <div className={`flex - 1 max - w - [85 %] min - w - 0 ${msg.role === "user" ? "text-right" : "text-left"} `}>
                    <div className={`${msg.role === "user"
                      ? "inline-block text-left bg-[#303134] text-[#e3e3e3] px-5 py-3 rounded-2xl rounded-tr-sm"
                      : "block w-full text-[#e3e3e3] px-0 py-0"
                      } `}>
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        msg.content ? (
                          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: CodeBlock,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 h-6 py-2 text-[#9aa0a6]">
                            <Sparkles className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">Thinking...</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-[#131314] p-4 md:pb-6">
          <div className="max-w-3xl mx-auto relative">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 bg-[#1e1f20] rounded-[28px] p-2 pl-6 transition-colors focus-within:bg-[#303134] border border-[#303134]"
            >
              <div className="flex-1 py-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a prompt here"
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 text-[#e3e3e3] placeholder:text-[#9aa0a6] resize-none max-h-[200px] overflow-y-auto"
                  rows={1}
                  style={{ minHeight: "24px" }}
                />
              </div>

              <div className="flex items-center gap-1 pb-1.5 pr-2">
                <button
                  type="button"
                  className="p-2 text-[#9aa0a6] hover:bg-[#3c4043] rounded-full transition-colors"
                >
                  <ImageIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-[#9aa0a6] hover:bg-[#3c4043] rounded-full transition-colors"
                >
                  <Mic className="h-5 w-5" />
                </button>
                {input.trim() && (
                  <button
                    id="chat-submit"
                    type="submit"
                    disabled={isLoading}
                    className="p-2 bg-[#8ab4f8] text-[#202124] rounded-full hover:bg-[#aecbfa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                  >
                    {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </form>
            <div className="text-center mt-2">
              <p className="text-xs text-[#9aa0a6]">
                Lumina may display inaccurate info, including about people, so double-check its responses.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
