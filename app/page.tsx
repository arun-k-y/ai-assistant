"use client"
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Bot, 
  Sparkles, 
  Code, 
  MessageSquare, 
  Zap,
  Shield,
  Globe,
  Star
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    {
      id: 1,
      title: "Advanced AI Conversations",
      description:
        "Powered by GPT-4o and latest OpenAI models for intelligent, context-aware responses.",
      icon: <Bot className="h-6 w-6" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 2,
      title: "Real-time Streaming",
      description:
        "Watch responses appear in real-time with smooth streaming for instant feedback.",
      icon: <Zap className="h-6 w-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      title: "Code Syntax Highlighting",
      description:
        "Beautiful code blocks with support for 180+ programming languages.",
      icon: <Code className="h-6 w-6" />,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 4,
      title: "Prompt Library",
      description:
        "Access 10+ pre-built templates for common tasks and workflows.",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "from-orange-500 to-red-500"
    },
    {
      id: 5,
      title: "Markdown Support",
      description:
        "Full GitHub Flavored Markdown with tables, lists, and formatting.",
      icon: <Sparkles className="h-6 w-6" />,
      color: "from-indigo-500 to-blue-500"
    },
    {
      id: 6,
      title: "Conversation Management",
      description:
        "Save, export, and manage your chat history effortlessly.",
      icon: <Shield className="h-6 w-6" />,
      color: "from-yellow-500 to-orange-500"
    },
  ];

  const stats = [
    { label: "AI Models", value: "6+" },
    { label: "Languages", value: "180+" },
    { label: "Prompts", value: "10+" },
    { label: "Response Time", value: "<1s" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Assistant
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
            >
              About
            </Link>
            <Link
              href="/chat"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Start Chatting
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-8"
            >
              <Star className="h-4 w-4" />
              <span>The Best AI Assistant Experience</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl"
            >
              Your Advanced
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-slate-600"
            >
              Experience the power of GPT-4o with a beautiful, feature-rich interface.
              Stream responses in real-time, highlight code, and manage conversations
              like never before.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href="/chat"
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-base font-medium text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Start Chatting Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="rounded-full border-2 border-slate-300 px-8 py-4 text-base font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                Learn More
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-6 shadow-lg border border-slate-200"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-medium text-slate-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                Packed with Features
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Everything you need for an amazing AI chat experience
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative rounded-2xl bg-white p-8 shadow-lg border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg text-white mb-6`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-20 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 shadow-2xl"
          >
            <div className="text-center">
              <Globe className="h-16 w-16 mx-auto text-white mb-6" />
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Ready to Experience the Future?
              </h2>
              <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
                Join thousands of users already enjoying the most advanced AI chat interface.
                Start your conversation today.
              </p>
              <Link
                href="/chat"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-purple-600 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900">AI Assistant</span>
            </div>
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} AI Assistant. Built with Next.js and OpenAI.
            </p>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="/chat" className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                Chat
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
