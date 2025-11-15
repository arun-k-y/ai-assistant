
import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col text-slate-200"
      style={{
        background:
          "radial-gradient(600px 300px at 10% 10%, rgba(46, 48, 72, 0.55), transparent), " +
          "radial-gradient(500px 220px at 90% 85%, rgba(124,58,237,0.18), transparent), " +
          "linear-gradient(180deg, #060617 0%, #071029 45%, #0b1220 100%)",
      }}
    >
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-black/20 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-lg p-2 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </Link>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] shadow">
            <Bot className="h-4 w-4 text-white" />
          </div>

          <h1 className="text-xl font-semibold text-slate-100">About</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl bg-[#060a18]/50 border border-white/10 rounded-2xl p-8 shadow-xl backdrop-blur-xl">
          <h1 className="text-3xl font-bold text-slate-100 bg-clip-text text-transparent bg-gradient-to-r from-[#A78BFA] to-[#60A5FA]">
            About AI Assistant
          </h1>

          <div className="mt-6 space-y-8 text-slate-300 text-[15px] leading-relaxed">
            <p>
              This AI Assistant is powered by modern Next.js architecture and
              the latest OpenAI + Gemini models to deliver a beautifully
              designed, fast, and intelligent conversational experience.
            </p>

            {/* Features Section */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                Features
              </h2>

              <ul className="list-disc pl-6 space-y-2 text-slate-400">
                <li>Advanced AI conversation with real-time streaming</li>
                <li>Ultra-dark neon UI inspired by Linear & Vercel</li>
                <li>Markdown & syntax-highlighted code responses</li>
                <li>Persistent chat history stored locally</li>
                <li>Rich settings, prompt library & customization</li>
                <li>Fully responsive & mobile-friendly UI</li>
              </ul>
            </div>

            {/* Tech Section */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-3">
                Technology Stack
              </h2>

              <p className="text-slate-300 mb-3">
                Built with production-grade modern web technologies:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-slate-400">
                <li>Next.js 14 with App Router</li>
                <li>React 18 with server actions & streaming</li>
                <li>Tailwind CSS for utility-first styling</li>
                <li>OpenAI + Gemini APIs for intelligence</li>
                <li>Framer Motion for smooth micro-animations</li>
                <li>LocalStorage for offline chat persistence</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-4 flex justify-center">
              <Link
                href="/chat"
                className="rounded-full bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#fb7185] 
                           px-8 py-3 text-white shadow-lg hover:scale-[1.03] hover:shadow-2xl 
                           transition-all font-medium"
              >
                Start Chatting
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md py-6">
        <div className="mx-auto max-w-3xl text-center text-sm text-slate-400">
          © {new Date().getFullYear()} AI Assistant · Built with Next.js · All
          rights reserved.
        </div>
      </footer>
    </div>
  );
}
