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
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Google Brand Colors (Dark Mode)
  const colors = {
    blue: "text-[#8ab4f8]",
    red: "text-[#f28b82]",
    yellow: "text-[#fdd663]",
    green: "text-[#81c995]",
    gray: "text-[#9aa0a6]",
  };

  const features = [
    {
      id: 1,
      title: "Advanced AI",
      description: "Powered by the latest models for superior understanding.",
      icon: <Bot className={`h-6 w-6 ${colors.blue}`} />,
    },
    {
      id: 2,
      title: "Fast Streaming",
      description: "Real-time responses with zero latency.",
      icon: <Zap className={`h-6 w-6 ${colors.yellow}`} />,
    },
    {
      id: 3,
      title: "Code Expert",
      description: "Syntax highlighting for over 180 languages.",
      icon: <Code className={`h-6 w-6 ${colors.green}`} />,
    },
    {
      id: 4,
      title: "Templates",
      description: "Curated prompts to help you get started.",
      icon: <MessageSquare className={`h-6 w-6 ${colors.red}`} />,
    },
    {
      id: 5,
      title: "Markdown",
      description: "Full support for rich text formatting.",
      icon: <Sparkles className={`h-6 w-6 ${colors.blue}`} />,
    },
    {
      id: 6,
      title: "Secure",
      description: "Your conversations are private and safe.",
      icon: <Shield className={`h-6 w-6 ${colors.green}`} />,
    },
  ];

  const stats = [
    { label: "Active Users", value: "10k+" },
    { label: "Messages Sent", value: "1M+" },
    { label: "Uptime", value: "99.9%" },
  ];

  return (
    <div className="min-h-screen bg-[#131314] text-[#e3e3e3] font-sans antialiased selection:bg-[#8ab4f8] selection:text-[#202124]">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#131314]/95 backdrop-blur-sm border-b border-[#303134] transition-all">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-medium text-2xl tracking-tight text-[#e3e3e3] transition-colors">
                Lumina
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/about"
              className="text-[15px] font-medium text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="text-[15px] font-medium text-[#9aa0a6] hover:text-[#e3e3e3] transition-colors"
            >
              Pricing
            </Link>
            <div className="flex items-center gap-4 ml-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center h-10 px-6 rounded-[4px] bg-[#8ab4f8] text-[#202124] text-[14px] font-medium hover:bg-[#aecbfa] hover:shadow-md transition-all duration-200"
              >
                Go to Chat
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-[#9aa0a6] hover:bg-[#303134] rounded-full transition"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
              className="md:hidden bg-[#1e1f20] border-t border-[#303134] overflow-hidden shadow-lg"
            >
              <div className="px-6 py-4 space-y-2 flex flex-col">
                <Link
                  href="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-[15px] font-medium text-[#e3e3e3] hover:bg-[#303134] rounded-lg"
                >
                  About
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 text-[15px] font-medium text-[#e3e3e3] hover:bg-[#303134] rounded-lg"
                >
                  Pricing
                </Link>
                <div className="pt-2 px-4 pb-2">
                  <Link
                    href="/chat"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center h-10 rounded-[4px] bg-[#8ab4f8] text-[#202124] text-[14px] font-medium hover:bg-[#aecbfa] shadow-sm"
                  >
                    Go to Chat
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl px-6 py-32 md:py-40 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-[#e3e3e3] mb-6">
              Lumina
            </h1>
            <p className="text-xl md:text-2xl text-[#9aa0a6] max-w-2xl mb-10 leading-relaxed">
              Illuminating intelligence. A smarter way to chat, code, and create.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <Link
                href="/chat"
                className="h-12 px-8 rounded-[4px] bg-[#8ab4f8] text-[#202124] text-[15px] font-medium hover:bg-[#aecbfa] hover:shadow-md transition-all duration-200 flex items-center gap-2 min-w-[160px] justify-center"
              >
                Try Lumina
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="h-12 px-8 rounded-[4px] bg-transparent border border-[#5f6368] text-[#8ab4f8] text-[15px] font-medium hover:bg-[#303134] hover:border-[#8ab4f8] transition-all duration-200 min-w-[160px] flex items-center justify-center"
              >
                Learn more
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="bg-[#1e1f20] py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-medium text-[#e3e3e3] mb-4">
                Why use Lumina?
              </h2>
              <p className="text-[#9aa0a6] max-w-2xl mx-auto text-lg">
                Built with precision and speed in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-[#131314] p-8 rounded-xl border border-[#303134] hover:border-[#5f6368] transition-all duration-300 group"
                >
                  <div className="mb-6 p-3 bg-[#303134] rounded-full w-fit group-hover:bg-[#3c4043] transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium text-[#e3e3e3] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#9aa0a6] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-t border-[#303134]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {stats.map((stat, idx) => (
                <div key={idx}>
                  <div className="text-4xl font-medium text-[#8ab4f8] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[#9aa0a6] font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-[#131314] text-center">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-3xl md:text-4xl font-medium text-[#e3e3e3] mb-8">
              Ready to get started?
            </h2>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center h-12 px-8 rounded-[4px] bg-[#8ab4f8] text-[#202124] text-[16px] font-medium hover:bg-[#aecbfa] hover:shadow-md transition-all duration-200"
            >
              Launch Lumina
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e1f20] border-t border-[#303134] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[#9aa0a6] text-2xl font-medium">
              Lumina
            </div>
            <div className="flex gap-8 text-[#9aa0a6] text-sm">
              <Link href="#" className="hover:text-[#e3e3e3]">Privacy</Link>
              <Link href="#" className="hover:text-[#e3e3e3]">Terms</Link>
              <Link href="#" className="hover:text-[#e3e3e3]">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
