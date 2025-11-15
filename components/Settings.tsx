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
    Custom Model Dropdown
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
        className="w-full flex items-center justify-between border px-3 py-2 rounded bg-white shadow-sm hover:bg-gray-50"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto p-1">
          {groups.map((group) => (
            <div key={group.label} className="mb-2">
              <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                {group.label}
              </div>
              {group.models.map((m) => (
                <div
                  key={m.name}
                  className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-100 ${
                    value === m.name ? "bg-blue-100" : ""
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
    Main Component
----------------------------- */
export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  /* --------------------------
      Settings State
  --------------------------- */
  const [settings, setSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    modelName: "gpt-4o-mini",
    stream: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chatSettings");
      if (saved) setSettings(JSON.parse(saved));
    } catch (err) {
      console.error("Error parsing saved settings", err);
    }
  }, []);

  /* --------------------------
      Model Groups
  --------------------------- */
  const getOpenAIModelGroups = useCallback(
    (): ModelGroup[] => [
      // {
      //   label: "OpenAI GPT-4o",
      //   models: [
      //     { name: "gpt-4o", displayName: "GPT-4o (Most Capable)" },
      //     {
      //       name: "gpt-4o-mini",
      //       displayName: "GPT-4o Mini (Fast & Affordable)",
      //     },
      //   ],
      // },
      // {
      //   label: "OpenAI GPT-4",
      //   models: [
      //     { name: "gpt-4-turbo", displayName: "GPT-4 Turbo" },
      //     { name: "gpt-4", displayName: "GPT-4" },
      //   ],
      // },
      // {
      //   label: "OpenAI GPT-3.5",
      //   models: [{ name: "gpt-3.5-turbo", displayName: "GPT-3.5 Turbo" }],
      // },
    ],
    []
  );

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
      Fetch Models on Open
  --------------------------- */
  useEffect(() => {
    if (!isOpen) return;

    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const res = await fetch("/api/models");
        if (!res.ok) {
          console.warn("Failed to fetch models, using fallback");
          setModelGroups(getFallbackModelGroups());
          return;
        }

        const data = await res.json();
        const rawModels = data.models || [];
        setModelGroups(organizeModels(rawModels));
      } catch (error) {
        console.error("Error fetching models:", error);
        setModelGroups(getFallbackModelGroups());
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [isOpen, organizeModels, getFallbackModelGroups]);

  /* --------------------------
      Save to Local Storage
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

    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  /* --------------------------
      Modal UI
  --------------------------- */
  const modal = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Settings</h3>
          <button onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Model Selector */}
          <div>
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Model</label>
              {isLoadingModels && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            <div className="mt-1">
              <ModelDropdown
                value={settings.modelName}
                loading={isLoadingModels}
                groups={modelGroups}
                onChange={(name) =>
                  setSettings((prev) => ({ ...prev, modelName: name }))
                }
              />
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="text-sm font-medium">
              Temperature: {settings.temperature}
            </label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          {/* Max Tokens */}
          <div>
            <label className="text-sm font-medium">
              Max Tokens: {settings.maxTokens}
            </label>
            <input
              type="range"
              name="maxTokens"
              min="500"
              max="8000"
              step="100"
              value={settings.maxTokens}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maxTokens: Number(e.target.value),
                }))
              }
              className="w-full"
            />
          </div>

          {/* Stream Toggle */}
          <div className="flex justify-between">
            <label className="text-sm font-medium">Stream Responses</label>
            <input
              type="checkbox"
              checked={settings.stream}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  stream: e.target.checked,
                }))
              }
            />
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
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
      <button className="p-2" onClick={() => setIsOpen(true)}>
        <SettingsIcon className="h-5 w-5" />
      </button>

      {createPortal(modal, document.body)}
    </>
  );
}
