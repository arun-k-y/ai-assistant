// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
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

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    const savedSettings = localStorage.getItem("chatSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    if (inputRef?.current) {
      inputRef?.current?.focus();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Listen for settings changes from Settings component
    const handleSettingsChange = () => {
      const savedSettings = localStorage.getItem("chatSettings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    };

    // Listen for custom event (same tab)
    window.addEventListener("settingsUpdated", handleSettingsChange);
    
    // Listen for storage event (other tabs)
    window.addEventListener("storage", (e) => {
      if (e.key === "chatSettings" && e.newValue) {
        setSettings(JSON.parse(e.newValue));
      }
    });

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsChange);
    };
  }, []);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleKeyDown = () => {
      if (inputRef?.current) {
        inputRef?.current?.focus();
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
        let errorData;
        let errorMessage = "Failed to get response from the server";
        
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || "Failed to get response";
        } catch {
          console.error("Failed to parse error response");
        }
        
        // Create a detailed error message
        const errorDetails = errorData?.details ? `\n\n**Details:** ${errorData.details}` : "";
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
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          setIsTyping(false);
          // Add empty assistant message that we'll update
          const assistantMessageIndex = messages.length + 1;
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "",
              timestamp: Date.now(),
            },
          ]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  break;
                }
                try {
                  const parsed = JSON.parse(data);
                  
                  // Check for streaming errors
                  if (parsed.error) {
                    const errorMessage = parsed.message || "An error occurred during streaming";
                    const errorDetails = parsed.details ? `\n\n**Details:** ${parsed.details}` : "";
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
                  // Silently ignore JSON parse errors for streaming chunks
                  console.debug("Streaming parse error (non-critical):", err);
                }
              }
            }
          }
        }
      } else {
        // Handle non-streaming response
        const data = await response.json();
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: Date.now(),
          },
        ]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      
      // Format error message with icon and details
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      const formattedError = `## ⚠️ Error\n\n${errorMessage}\n\n---\n\n*If this issue persists, please check your API keys in Settings or try a different model.*`;
      
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
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportChat = () => {
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
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;

    // Remove last assistant message
    const newMessages = messages.slice(0, -1);
    setMessages(newMessages);

    // Get the last user message
    const lastUserMessage = newMessages[newMessages.length - 1];
    if (lastUserMessage.role === "user") {
      setInput(lastUserMessage.content);
      // Trigger form submit
      setTimeout(() => {
        const form = document.querySelector("form");
        form?.requestSubmit();
      }, 100);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="mr-4 rounded-full p-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-semibold text-slate-800">
                AI Assistant
              </h1>
              <p className="text-xs text-slate-500">{settings.modelName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PromptLibrary onSelectPrompt={(content) => setInput(content)} />
            <button
              onClick={exportChat}
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              title="Export chat"
            >
              <Download className="h-4 w-4" />
            </button>
           <Settings />
            <button
              onClick={clearChat}
              className="flex items-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[85%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 ml-3"
                          : "bg-gradient-to-br from-purple-500 to-purple-600 mr-3"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Bot className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div
                      className={`group relative rounded-2xl px-5 py-3 shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                          : message.content.startsWith("## ⚠️ Error")
                          ? "bg-red-50 text-slate-800 border-2 border-red-200"
                          : "bg-white text-slate-800 border border-slate-200"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-slate max-w-none prose-pre:bg-slate-900 prose-pre:text-slate-100">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code(props) {
                                const { children, className, ...rest } = props;
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                return match ? (
                                  <SyntaxHighlighter
                                    // @ts-expect-error - Type mismatch in react-syntax-highlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className={className} {...rest}>
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {message.role === "assistant" && (
                        <button
                          onClick={() =>
                            copyToClipboard(message.content, index)
                          }
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-100"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex justify-start"
                >
                  <div className="flex flex-row">
                    <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="rounded-2xl bg-white px-5 py-3 shadow-md border border-slate-200">
                      <div className="flex space-x-1.5">
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endOfMessagesRef} />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md py-4 px-6 shadow-lg">
        {messages.length > 1 &&
          messages[messages.length - 1].role === "assistant" && (
            <div className="flex justify-center mb-3">
              <button
                onClick={regenerateResponse}
                disabled={isLoading}
                className="flex items-center text-xs text-slate-600 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Regenerate response
              </button>
            </div>
          )}
        <form
          onSubmit={handleSubmit}
          className="flex items-center max-w-4xl mx-auto"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border border-slate-300 bg-white px-5 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || input.trim() === ""}
            className="ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-3">
          Press Enter to send • {messages.length} messages
        </p>
      </footer>
    </div>
  );
}


