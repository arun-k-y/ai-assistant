// components/PromptLibrary.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, X, Search } from "lucide-react";

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
      "Help me brainstorm creative ideas for [project/problem]. Think outside the box and provide at least 10 unique suggestions.",
    category: "Creative",
  },
  {
    id: "6",
    title: "Summarize Article",
    content:
      "Please summarize this article in 3-5 bullet points, highlighting the key takeaways:\n\n[Paste article text]",
    category: "Productivity",
  },
  {
    id: "7",
    title: "Learning Path",
    content:
      "Create a comprehensive learning path for [skill/topic]. Include resources, estimated time, and milestones.",
    category: "Learning",
  },
  {
    id: "8",
    title: "SQL Query Writer",
    content:
      "Write a SQL query to [describe what you need]. The database has these tables: [describe schema].",
    category: "Development",
  },
  {
    id: "9",
    title: "Business Plan Helper",
    content:
      "Help me create a business plan for [business idea]. Include market analysis, revenue model, and key metrics.",
    category: "Business",
  },
  {
    id: "10",
    title: "Interview Preparation",
    content:
      "Generate interview questions and answers for a [position] role, focusing on [specific skills/topics].",
    category: "Career",
  },
];

interface PromptLibraryProps {
  onSelectPrompt: (content: string) => void;
}

export default function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(defaultPrompts.map((p) => p.category))),
  ];

  const filteredPrompts = defaultPrompts.filter((prompt) => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSelectPrompt = (content: string) => {
    onSelectPrompt(content);
    setIsOpen(false);
  };

  const modalContent =
    isOpen && mounted ? (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
        <div
          ref={modalRef}
          className="w-full max-w-4xl my-8 rounded-xl bg-white shadow-2xl flex flex-col max-h-[90vh] relative z-[10000]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900">
                Prompt Library
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Select a template to get started
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 border-b border-slate-200 flex-shrink-0">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt.content)}
                  className="text-left p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all w-full h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h4 className="font-semibold text-slate-900 flex-1">
                      {prompt.title}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full whitespace-nowrap flex-shrink-0">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3 break-words">
                    {prompt.content}
                  </p>
                </button>
              ))}
            </div>

            {filteredPrompts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">
                  No prompts found matching your search.
                </p>
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
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
        title="Prompt Library"
      >
        <Lightbulb className="h-5 w-5" />
      </button>

      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}
