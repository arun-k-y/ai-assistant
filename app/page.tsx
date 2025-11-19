"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Sparkles,
  Code,
  MessageSquare,
  Zap,
  Shield,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Features and stats (kept from your original structure but tuned)
  const features = [
    {
      id: 1,
      title: "Advanced AI Conversations",
      description:
        "GPT-4o & latest models — context-aware, persistent, and tuned for clarity.",
      icon: <Bot className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#6EE7B7] via-[#3B82F6] to-[#8B5CF6]",
    },
    {
      id: 2,
      title: "Real-time Streaming",
      description:
        "Low-latency streaming with elegant typing and progressive reveal.",
      icon: <Zap className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#7C3AED] via-[#D946EF] to-[#FB7185]",
    },
    {
      id: 3,
      title: "Code Syntax Highlighting",
      description:
        "Beautiful code blocks for 180+ languages with copy + run UX.",
      icon: <Code className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#10B981] via-[#06B6D4] to-[#3B82F6]",
    },
    {
      id: 4,
      title: "Prompt Library",
      description: "Curated templates to accelerate workflows and ship faster.",
      icon: <MessageSquare className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#F59E0B] via-[#F97316] to-[#EF4444]",
    },
    {
      id: 5,
      title: "Markdown Support",
      description: "Full GitHub-Flavored Markdown — tables, tasks, and math.",
      icon: <Sparkles className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#6366F1] via-[#60A5FA] to-[#7DD3FC]",
    },
    {
      id: 6,
      title: "Conversation Management",
      description: "Organize, export, and restore chat sessions—privacy-first.",
      icon: <Shield className="h-5 w-5" />,
      gradient: "bg-gradient-to-br from-[#FBBF24] via-[#F97316] to-[#FB7185]",
    },
  ];

  const stats = [
    { label: "AI Models", value: "6+" },
    { label: "Languages", value: "180+" },
    { label: "Prompts", value: "10+" },
    { label: "Response Time", value: "<1s" },
  ];

  useEffect(() => {
    // subtle mount animation trigger for background lights (optional)
    document.documentElement.style.setProperty("--neon-glow", "12px");
    return () => {
      document.documentElement.style.removeProperty("--neon-glow");
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-900 text-slate-100 antialiased">
      {/* Layered glossy background */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 overflow-hidden"
        style={{ pointerEvents: "none" }}
      >
        {/* subtle noise + radial glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#060617] via-[#071029] to-[#0b1220] opacity-95" />
        <div className="absolute -left-40 -top-40 h-[640px] w-[640px] rounded-full blur-3xl opacity-30 bg-gradient-to-br from-[#6EE7B7] to-[#06B6D4] mix-blend-screen" />
        <div className="absolute -right-40 bottom-[-120px] h-[520px] w-[520px] rounded-full blur-2xl opacity-25 bg-gradient-to-br from-[#7C3AED] to-[#FB7185] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.00))]" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-black/30 border-b border-white/6">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]">
                  Lumina
                </span>
              </span>
              <div className="text-xs text-slate-400">
                Illuminating Intelligence
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/about"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/3 transition"
            >
              About
            </Link>

            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/3 transition"
            >
              Pricing
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#D946EF] to-[#FB7185] px-4 py-2 text-sm font-semibold shadow-[0_8px_30px_rgba(124,58,237,0.18)] hover:scale-[1.02] transition-transform"
            >
              Start Chat
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-300 hover:bg-white/5 rounded-lg transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/6 bg-[#0b1220]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-6 space-y-4 flex flex-col">
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-300 hover:text-white transition"
                >
                  About
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-300 hover:text-white transition"
                >
                  Pricing
                </Link>
                <div className="pt-2">
                  <Link
                    href="/chat"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#D946EF] to-[#FB7185] px-4 py-3 text-base font-semibold shadow-lg"
                  >
                    Start Chat
                    <ArrowRight className="h-4 w-4 text-white" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero left */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-white/6 to-white/3 px-4 py-2 text-sm text-slate-200"
              >
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">Next-gen AI Workspace</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
              >
                Lumina: Clarity in every conversation.
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-[#A78BFA] via-[#60A5FA] to-[#F472B6]">
                  Multi-session · Custom Personas · Instant
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-6 max-w-2xl text-lg text-slate-300"
              >
                Built for creators and teams who want both beauty and
                productivity. Real-time streaming, lightning-fast responses, and
                a prompt library shaped by real workflows.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#7C3AED] via-[#D946EF] to-[#FB7185] px-6 py-3 text-base font-semibold shadow-lg hover:scale-[1.02] transition transform"
                  aria-label="Start chatting"
                >
                  Start Chatting
                  <ArrowRight className="h-4 w-4 text-white" />
                </Link>

                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-full border border-white/6 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/2 transition"
                >
                  Documentation
                </Link>
              </motion.div>

              {/* light feature chips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex flex-wrap gap-3"
              >
                <div className="rounded-full bg-white/4 px-3 py-2 text-sm text-slate-200">
                  Lumina UI
                </div>
                <div className="rounded-full bg-white/4 px-3 py-2 text-sm text-slate-200">
                  Streaming
                </div>
                <div className="rounded-full bg-white/4 px-3 py-2 text-sm text-slate-200">
                  Secure by default
                </div>
                <div className="rounded-full bg-white/4 px-3 py-2 text-sm text-slate-200">
                  Enterprise
                </div>
              </motion.div>
            </div>

            {/* Hero right - glossy card with mock chat feed */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="relative overflow-hidden rounded-2xl border border-white/6 bg-gradient-to-tl from-[#07102b]/80 to-[#0b1020]/60 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
              >
                {/* Neon frame */}
                <div
                  className="absolute -inset-px rounded-2xl pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.18), rgba(217,70,239,0.12), rgba(251,113,133,0.14))",
                    WebkitMask:
                      "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                    padding: "1px",
                  }}
                />

                {/* mock header */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        Lumina Assistant
                      </div>
                      <div className="text-xs text-slate-400">
                        Active • streaming
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">GPT-4o</div>
                    <div className="rounded-full bg-white/6 px-2 py-1 text-xs font-medium">
                      Beta
                    </div>
                  </div>
                </div>

                {/* mock messages */}
                <div className="mt-4 space-y-4 relative z-10">
                  <div className="rounded-xl bg-gradient-to-br from-white/3 to-white/2 p-4 text-sm text-slate-900 max-w-[78%]">
                    <div className="font-medium mb-1">You</div>
                    <div className="text-[13px]">
                      Show me a concise webpack config for React + Tailwind.
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-[#0f1724]/70 to-[#07102b]/60 p-4 text-sm text-slate-200 max-w-[90%] ml-auto border border-white/4">
                    <div className="font-medium mb-1 text-slate-100">
                      Lumina
                    </div>
                    <div className="text-[13px] leading-relaxed">
                      Here&apos;s a minimal config — uses PostCSS and Tailwind.{" "}
                      <span className="text-slate-300">Streaming…</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-gradient-to-br from-white/3 to-white/2 p-3 text-xs text-slate-700 max-w-[60%]">
                    <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap">
                      {`// webpack.config.js (concise)
module.exports = {
  module: {
    rules: [{ test: /\\.css$/, use: ['style-loader','css-loader','postcss-loader'] }]
  }
};`}
                    </pre>
                  </div>
                </div>

                {/* footer */}
                <div className="mt-6 flex items-center gap-3">
                  <input
                    className="flex-1 rounded-full bg-white/3 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#7C3AED]/40"
                    placeholder="Ask something..."
                    aria-label="Ask something"
                  />
                  <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#FB7185] px-4 py-2 text-sm font-semibold shadow-md hover:scale-[1.02] transition">
                    Send
                    <ArrowRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/6 bg-gradient-to-br from-white/3 to-white/2 p-4"
              >
                <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-slate-300">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Features */}
          <div className="mt-14">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Packed with features</h3>
                <p className="mt-2 text-slate-400 max-w-xl">
                  Everything teams and creators need — fast, secure, and
                  delightful.
                </p>
              </div>
              <Link
                href="/features"
                className="text-sm font-medium text-slate-300 hover:text-white"
              >
                See all features →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  whileHover={{ y: -6 }}
                  className="relative rounded-2xl border border-white/6 bg-[radial-gradient(1000px_400px_at_10%_0%,rgba(255,255,255,0.02),transparent)] p-6 shadow-lg"
                >
                  <div
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-lg ${f.gradient} text-white shadow-md`}
                  >
                    {f.icon}
                  </div>
                  <h4 className="mt-4 text-lg font-semibold text-slate-100">
                    {f.title}
                  </h4>
                  <p className="mt-2 text-sm text-slate-300">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 rounded-2xl border border-white/6 bg-gradient-to-r from-[#07102b]/80 to-[#07102b]/60 p-8 shadow-[0_30px_80px_rgba(3,7,18,0.6)]"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">
                  Ready to experience Lumina?
                </h3>
                <p className="mt-1 text-slate-400">
                  Start for free — upgrade when you&apos;re ready. Enterprise plans
                  available.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-[#7C3AED] via-[#D946EF] to-[#FB7185] px-6 py-3 font-semibold shadow hover:scale-[1.02] transition"
                >
                  Get started — it&apos;s free
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-white/6 px-5 py-3 text-sm text-slate-300 hover:bg-white/2 transition"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/6 bg-black/25">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">Lumina</div>
              <div className="text-xs text-slate-400">
                © {new Date().getFullYear()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/status" className="hover:text-white">
              Status
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
