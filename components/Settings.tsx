"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Settings as SettingsIcon,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";

/* ----------------------------
    Types
----------------------------- */
interface Model {
  name: string;
  displayName?: string;
}

interface ModelGroup {
  label: string;
  models: Model[];
}

/* ----------------------------
    Custom Model Dropdown (Google Dark)
----------------------------- */
function ModelDropdown({
  value,
  groups,
  loading,
  onChange,
}: {
  value: string;
  groups: ModelGroup[];
  loading: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    groups.flatMap((g) => g.models).find((m) => m.name === value)
      ?.displayName || value;

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 rounded-[4px] bg-[#303134] hover:bg-[#3c4043] text-[#e3e3e3] transition-colors text-left border border-[#303134]"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
      >
        <span className="truncate font-medium text-[14px]">
          {loading ? "Loading models..." : selectedLabel}
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#9aa0a6]" />
        ) : (
          <ChevronDown className={`h-5 w-5 text-[#9aa0a6] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1e1f20] rounded-lg shadow-lg border border-[#303134] z-50 max-h-60 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 text-xs font-semibold text-[#9aa0a6] uppercase tracking-wider">
                {group.label}
              </div>
              {group.models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => {
                    onChange(model.name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[14px] hover:bg-[#303134] transition-colors ${value === model.name ? "text-[#8ab4f8] font-medium bg-[#303134]" : "text-[#e3e3e3]"
                    }`}
                >
                  {model.displayName || model.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------
    Settings Component
----------------------------- */
interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSettingsChange: (newSettings: ChatSettings) => void;
}

export default function Settings({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SettingsProps) {
  const [mounted, setMounted] = useState(false);
  const [models, setModels] = useState<ModelGroup[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch models (mock or real)
    setLoadingModels(true);
    // Simulate fetch
    setTimeout(() => {
      setModels([
        {
          label: "Google Gemini",
          models: [
            { name: "gemini-pro", displayName: "Gemini Pro" },
            { name: "gemini-ultra", displayName: "Gemini Ultra" },
          ],
        },
        {
          label: "OpenAI",
          models: [
            { name: "gpt-4", displayName: "GPT-4" },
            { name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo" },
          ],
        },
      ]);
      setLoadingModels(false);
    }, 500);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[#1e1f20] h-full shadow-2xl flex flex-col animate-slideLeft border-l border-[#303134]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#303134]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#303134] rounded-full">
              <SettingsIcon className="h-5 w-5 text-[#8ab4f8]" />
            </div>
            <h2 className="text-xl font-medium text-[#e3e3e3]">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9aa0a6] hover:bg-[#303134] rounded-full transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Model Selection */}
          <section>
            <label className="block text-sm font-medium text-[#e3e3e3] mb-2">
              AI Model
            </label>
            <ModelDropdown
              value={settings.model}
              groups={models}
              loading={loadingModels}
              onChange={(val) => onSettingsChange({ ...settings, model: val })}
            />
            <p className="mt-2 text-xs text-[#9aa0a6]">
              Choose the intelligence engine for your conversation.
            </p>
          </section>

          {/* Temperature */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#e3e3e3]">
                Creativity (Temperature)
              </label>
              <span className="text-sm font-medium text-[#8ab4f8] bg-[#303134] px-2 py-0.5 rounded">
                {settings.temperature}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-[#303134] rounded-lg appearance-none cursor-pointer accent-[#8ab4f8]"
            />
            <div className="flex justify-between mt-2 text-xs text-[#9aa0a6]">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </section>

          {/* Max Tokens */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-[#e3e3e3]">
                Response Length
              </label>
              <span className="text-sm font-medium text-[#8ab4f8] bg-[#303134] px-2 py-0.5 rounded">
                {settings.maxTokens} tokens
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={4000}
              step={100}
              value={settings.maxTokens}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  maxTokens: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-[#303134] rounded-lg appearance-none cursor-pointer accent-[#8ab4f8]"
            />
          </section>

          {/* System Instructions */}
          <section>
            <label className="block text-sm font-medium text-[#e3e3e3] mb-2">
              System Instructions
            </label>
            <textarea
              value={settings.systemPrompt || ""}
              onChange={(e) =>
                onSettingsChange({ ...settings, systemPrompt: e.target.value })
              }
              placeholder="You are a helpful AI assistant..."
              className="w-full h-32 p-3 rounded-[4px] bg-[#303134] border border-[#303134] text-[#e3e3e3] placeholder:text-[#9aa0a6] focus:ring-2 focus:ring-[#8ab4f8] resize-none text-sm"
            />
            <p className="mt-2 text-xs text-[#9aa0a6]">
              Define the AI's persona and behavior constraints.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#303134] bg-[#1e1f20]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-[4px] bg-[#8ab4f8] text-[#202124] font-medium hover:bg-[#aecbfa] hover:shadow transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
