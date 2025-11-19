import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314] text-[#e3e3e3] font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#131314]/95 backdrop-blur-sm border-b border-[#303134]">
        <div className="mx-auto max-w-3xl px-6 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-[#9aa0a6] hover:bg-[#303134] rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-medium text-xl text-[#e3e3e3]">About Lumina</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-24 pb-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-medium text-[#e3e3e3] mb-4">
              Illuminating Intelligence
            </h1>
            <p className="text-xl text-[#9aa0a6] leading-relaxed max-w-2xl mx-auto">
              Lumina is designed to be your intelligent creative partner, helping you code, write, and solve problems faster.
            </p>
          </div>

          <div className="grid gap-8">
            {/* Mission Section */}
            <section>
              <h2 className="text-2xl font-medium text-[#e3e3e3] mb-4">
                Our Mission
              </h2>
              <p className="text-[#9aa0a6] leading-relaxed text-lg">
                We believe AI should be accessible, fast, and beautiful. Lumina combines state-of-the-art language models with a refined, distraction-free interface inspired by the tools you use every day.
              </p>
            </section>

            {/* Features Section */}
            <section className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="p-6 rounded-xl border border-[#303134] bg-[#1e1f20] hover:border-[#5f6368] transition-all">
                <h3 className="text-lg font-medium text-[#e3e3e3] mb-2">
                  Advanced AI
                </h3>
                <p className="text-[#9aa0a6]">
                  Powered by the latest Gemini and OpenAI models for superior reasoning and coding capabilities.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-[#303134] bg-[#1e1f20] hover:border-[#5f6368] transition-all">
                <h3 className="text-lg font-medium text-[#e3e3e3] mb-2">
                  Real-time Speed
                </h3>
                <p className="text-[#9aa0a6]">
                  Optimized streaming architecture ensures you never have to wait for a response.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-[#303134] bg-[#1e1f20] hover:border-[#5f6368] transition-all">
                <h3 className="text-lg font-medium text-[#e3e3e3] mb-2">
                  Privacy First
                </h3>
                <p className="text-[#9aa0a6]">
                  Your conversations are stored locally on your device. We prioritize your data security.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-[#303134] bg-[#1e1f20] hover:border-[#5f6368] transition-all">
                <h3 className="text-lg font-medium text-[#e3e3e3] mb-2">
                  Developer Friendly
                </h3>
                <p className="text-[#9aa0a6]">
                  First-class support for code syntax highlighting, markdown, and technical workflows.
                </p>
              </div>
            </section>

            {/* Tech Stack */}
            <section className="mt-8 pt-8 border-t border-[#303134]">
              <h2 className="text-xl font-medium text-[#e3e3e3] mb-6">
                Built with modern tech
              </h2>
              <div className="flex flex-wrap gap-3">
                {["Next.js 14", "React 18", "Tailwind CSS", "Gemini API", "OpenAI API", "Framer Motion"].map((tech) => (
                  <span key={tech} className="px-4 py-2 rounded-full bg-[#303134] text-[#e3e3e3] text-sm font-medium border border-[#303134]">
                    {tech}
                  </span>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center h-12 px-8 rounded-[4px] bg-[#8ab4f8] text-[#202124] text-[16px] font-medium hover:bg-[#aecbfa] hover:shadow-md transition-all duration-200"
              >
                Start Chatting
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#303134] bg-[#1e1f20] py-8 mt-auto">
        <div className="mx-auto max-w-3xl px-6 text-center text-sm text-[#9aa0a6]">
          © {new Date().getFullYear()} Lumina AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
