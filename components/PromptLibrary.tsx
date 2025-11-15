

"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, X, Search } from "lucide-react";

/* --------------------------
    Default Prompts
--------------------------- */
interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
}

const defaultPrompts: Prompt[] = [
  {
    id: "1",
    title: "Code Review",
    content:
      "Please review this code and suggest improvements for readability, performance, and best practices:\n\n[Paste your code here]",
    category: "Development",
  },
  {
    id: "2",
    title: "Explain Like I'm 5",
    content:
      "Explain [topic] in simple terms that a 5-year-old could understand.",
    category: "Learning",
  },
  {
    id: "3",
    title: "Debug Helper",
    content:
      "I'm getting this error: [paste error]. Here's my code: [paste code]. Can you help me debug and explain what's wrong?",
    category: "Development",
  },
  {
    id: "4",
    title: "Write Professional Email",
    content:
      "Write a professional email about [topic] to [recipient]. Tone should be [formal/casual/friendly].",
    category: "Writing",
  },
  {
    id: "5",
    title: "Brainstorm Ideas",
    content:
      "Help me brainstorm creative ideas for [project/problem]. Provide at least 10 unique suggestions.",
    category: "Creative",
  },
  {
    id: "6",
    title: "Summarize Article",
    content:
      "Please summarize this article in 3-5 bullet points:\n\n[Paste article text]",
    category: "Productivity",
  },
  {
    id: "7",
    title: "Learning Path",
    content:
      "Create a complete learning path for [skill/topic], including milestones and resources.",
    category: "Learning",
  },
  {
    id: "8",
    title: "SQL Query Writer",
    content:
      "Write a SQL query to [describe what you need]. The database tables are: [describe schema].",
    category: "Development",
  },
  {
    id: "9",
    title: "Business Plan Helper",
    content:
      "Help me create a business plan for [business idea], including revenue model and market analysis.",
    category: "Business",
  },
  {
    id: "10",
    title: "Interview Preparation",
    content:
      "Generate interview questions and answers for a [position] role, focusing on [skills/topics].",
    category: "Career",
  },
];

/* ---------------------------------
    COMPONENT
---------------------------------- */
interface PromptLibraryProps {
  onSelectPrompt: (content: string) => void;
}

export default function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const categories = [
    "All",
    ...Array.from(new Set(defaultPrompts.map((p) => p.category))),
  ];

  const filtered = defaultPrompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  /* Close on outside click */
  useEffect(() => {
    if (!isOpen) return;

    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handle);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handle);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  /* Handle prompt selection */
  const selectPrompt = (content: string) => {
    onSelectPrompt(content);
    setIsOpen(false);
  };

  /* ------------------------------
      Right Slide Panel
  ------------------------------ */
  const panel =
    isOpen && mounted ? (
      <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40 backdrop-blur-sm">
        {/* PANEL */}
        <div
          ref={panelRef}
          className="w-full sm:w-[550px] h-full bg-[#060a18]/95 border-l border-white/10 shadow-2xl backdrop-blur-xl 
                   animate-slideLeft flex flex-col"
        >
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-100">
                Prompt Library
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">Select a template</p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-2 hover:bg-white/10 transition"
            >
              <X className="h-5 w-5 text-slate-300" />
            </button>
          </div>

          {/* SEARCH */}
          <div className="p-6 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />

              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0b1020]/70 border border-white/10 
                         text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-[#7c3aed]/40"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-[#7c3aed] to-[#d946ef] text-white shadow"
                      : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* PROMPTS LIST */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPrompt(p.content)}
                className="w-full text-left p-4 rounded-lg bg-[#0b1020]/50 border border-white/5 
                         hover:bg-white/5 hover:border-white/10 transition shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-slate-100 font-semibold text-base">
                    {p.title}
                  </h4>

                  <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
                    {p.category}
                  </span>
                </div>

                <p className="text-sm text-slate-400 line-clamp-3">
                  {p.content}
                </p>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                No prompts match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 transition"
        title="Prompt Library"
      >
        <Lightbulb className="h-5 w-5" />
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
}

/* ----------------------------
⚠️ Add to globals.css:

@keyframes slideLeft {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.animate-slideLeft { animation: slideLeft 0.25s ease-out; }

----------------------------- */
