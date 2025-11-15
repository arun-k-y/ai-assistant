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
    Custom Model Dropdown (NEON)
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

  const selectedLabel =
    groups.flatMap((g) => g.models).find((m) => m.name === value)
      ?.displayName || value;

  return (
    <div className="relative">
      <button
        className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-[#0b1020]/80 border border-white/10 text-slate-200 hover:bg-white/5 transition"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
      >
        <span className="truncate text-sm">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-slate-300" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-[#060a18]/95 border border-white/10 rounded-lg shadow-xl backdrop-blur-md max-h-64 overflow-y-auto animate-slideUp p-1">
          {groups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="text-xs font-semibold text-slate-400 px-2 py-1">
                {group.label}
              </div>

              {group.models.map((m) => (
                <div
                  key={m.name}
                  className={`px-3 py-2 rounded text-sm text-slate-200 cursor-pointer hover:bg-white/5 transition ${
                    value === m.name ? "bg-white/10" : ""
                  }`}
                  onClick={() => {
                    onChange(m.name);
                    setOpen(false);
                  }}
                >
                  {m.displayName || m.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------
    MAIN SETTINGS COMPONENT
----------------------------- */
export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    modelName: "gpt-4o-mini",
    stream: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Load saved settings */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatSettings");
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  /* --------------------------
      Model Groups
  --------------------------- */
  const getOpenAIModelGroups = useCallback((): ModelGroup[] => [], []);

  const getFallbackModelGroups = useCallback(
    (): ModelGroup[] => [
      {
        label: "🆓 Google Gemini (Free Tier)",
        models: [
          { name: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash (Free)" },
          { name: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro (Free)" },
          { name: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash (Free)" },
          { name: "gemini-pro", displayName: "Gemini Pro Latest (Free)" },
          { name: "gemini-flash", displayName: "Gemini Flash Latest (Free)" },
        ],
      },
      ...getOpenAIModelGroups(),
    ],
    [getOpenAIModelGroups]
  );

  const organizeModels = useCallback(
    (models: Model[]): ModelGroup[] => {
      const gemini: Model[] = [];
      const other: Model[] = [];

      for (const m of models) {
        const name = m.name.replace("models/", "");
        if (name.includes("gemini")) gemini.push({ ...m, name });
        else other.push({ ...m, name });
      }

      gemini.sort((a, b) => a.name.localeCompare(b.name));

      const groups: ModelGroup[] = [];
      if (gemini.length)
        groups.push({ label: "🆓 Google Gemini (Free Tier)", models: gemini });
      if (other.length) groups.push({ label: "Other Models", models: other });

      return [...groups, ...getOpenAIModelGroups()];
    },
    [getOpenAIModelGroups]
  );

  /* --------------------------
      Fetch models when panel opens
  --------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await fetch("/api/models");
        if (!res.ok) {
          setModelGroups(getFallbackModelGroups());
          return;
        }
        const data = await res.json();
        setModelGroups(organizeModels(data.models || []));
      } catch {
        setModelGroups(getFallbackModelGroups());
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [isOpen, organizeModels, getFallbackModelGroups]);

  /* --------------------------
      Save settings
  --------------------------- */
  useEffect(() => {
    localStorage.setItem("chatSettings", JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("settingsUpdated"));
  }, [settings]);

  /* --------------------------
      Close on outside click
  --------------------------- */
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

  /* --------------------------
      The right-side sliding panel
  --------------------------- */
  const panel = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex justify-end bg-black/50 backdrop-blur-sm">
      {/* SLIDING GLASS PANEL */}
      <div
        ref={panelRef}
        className="w-full sm:w-[420px] h-full bg-[#060a18]/95 border-l border-white/10 shadow-2xl backdrop-blur-xl
                   animate-slideLeft flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-slate-100">Settings</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-2 hover:bg-white/10 transition"
          >
            <X className="h-5 w-5 text-slate-300" />
          </button>
        </div>

        {/* Panel content */}
        <div className="p-6 space-y-6 overflow-auto">
          {/* MODEL */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-slate-300">
                Model
              </label>

              {isLoadingModels && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            <ModelDropdown
              value={settings.modelName}
              loading={isLoadingModels}
              groups={modelGroups}
              onChange={(name) =>
                setSettings((prev) => ({ ...prev, modelName: name }))
              }
            />
          </div>

          {/* TEMPERATURE */}
          <div>
            <label className="text-sm font-medium text-slate-300">
              Temperature: {settings.temperature}
            </label>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  temperature: Number(e.target.value),
                }))
              }
              className="w-full accent-[#7c3aed]"
            />
          </div>

          {/* MAX TOKENS */}
          <div>
            <label className="text-sm font-medium text-slate-300">
              Max Tokens: {settings.maxTokens}
            </label>

            <input
              type="range"
              min="500"
              max="8000"
              step="100"
              value={settings.maxTokens}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  maxTokens: Number(e.target.value),
                }))
              }
              className="w-full accent-[#7c3aed]"
            />
          </div>

          {/* STREAM */}
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-300">
              Stream Responses
            </label>

            <input
              type="checkbox"
              checked={settings.stream}
              onChange={(e) =>
                setSettings((p) => ({ ...p, stream: e.target.checked }))
              }
              className="h-5 w-5 accent-[#7c3aed]"
            />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-center rounded-lg text-white font-semibold 
                       bg-gradient-to-br from-[#7c3aed] via-[#d946ef] to-[#fb7185] 
                       hover:scale-[1.02] transition shadow-lg"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  ) : null;

  /* --------------------------
      Render
  --------------------------- */
  return (
    <>
      <button
        className="p-2 text-slate-300 hover:bg-white/5 rounded transition"
        onClick={() => setIsOpen(true)}
      >
        <SettingsIcon className="h-5 w-5" />
      </button>

      {mounted && createPortal(panel, document.body)}
    </>
  );
}

/* ----------------------------
    Animation classes
----------------------------- */
/*
Add this to globals.css:

@keyframes slideLeft {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slideLeft {
  animation: slideLeft 0.25s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.2s ease-out;
}
*/
