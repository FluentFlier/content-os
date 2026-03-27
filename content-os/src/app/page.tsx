"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Models                                                             */
/* ------------------------------------------------------------------ */

const MODELS = [
  { id: "anthropic/claude-sonnet-4.5", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { id: "google/gemini-3-pro-image-preview", label: "Gemini 3 Pro", provider: "Google" },
  { id: "deepseek/deepseek-v3.2", label: "DeepSeek V3.2", provider: "DeepSeek" },
  { id: "x-ai/grok-4.1-fast", label: "Grok 4.1 Fast", provider: "xAI" },
  { id: "minimax/minimax-m2.1", label: "MiniMax M2.1", provider: "MiniMax" },
];

/* ------------------------------------------------------------------ */
/*  Content Modes                                                      */
/* ------------------------------------------------------------------ */

type ContentMode = "freeform" | "script" | "caption" | "hooks" | "thread" | "repurpose";

interface ModeDef {
  id: ContentMode;
  label: string;
  placeholder: string;
  systemPrompt: string;
}

const MODES: ModeDef[] = [
  {
    id: "freeform",
    label: "Freeform",
    placeholder: "What content do you need?",
    systemPrompt:
      "You are a content strategist. Help create engaging, authentic content. No em dashes anywhere. Ever.",
  },
  {
    id: "script",
    label: "Script",
    placeholder: "Topic, angle, or rough idea for a short-form video...",
    systemPrompt: `Generate a short-form video script (under 60 seconds).
HOOK: One bold opening line.
BODY: 3-4 punchy bullet points.
CTA: One direct question or call to action.
No em dashes. Conversational founder voice.`,
  },
  {
    id: "caption",
    label: "Caption",
    placeholder: "Describe the post or core message...",
    systemPrompt: `Write an Instagram caption. Hook-first. 2-4 sentences. Direct question at end. No em dashes. Authentic, not salesy.`,
  },
  {
    id: "hooks",
    label: "Hooks",
    placeholder: "Topic to generate hooks for...",
    systemPrompt: `Generate 8 scroll-stopping hooks for short-form video. One sentence each. Mix styles: controversial, curiosity gap, personal story, bold claim, question, confession, statistic, contrarian. Number them. No em dashes.`,
  },
  {
    id: "thread",
    label: "Thread",
    placeholder: "Topic for the thread...",
    systemPrompt: `Write an X/Twitter thread (5-8 tweets). First tweet is the hook. Each under 280 chars. End with CTA. Number each tweet. No em dashes.`,
  },
  {
    id: "repurpose",
    label: "Repurpose",
    placeholder: "Paste content to repurpose...",
    systemPrompt: `Take this content and repurpose into 3 formats:
1. A tweet (under 280 chars)
2. A LinkedIn post (professional, 3-4 paragraphs)
3. An Instagram caption (hook-first, question CTA, hashtags)
Label each clearly. No em dashes.`,
  },
];

/* ------------------------------------------------------------------ */
/*  Platforms                                                          */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
  { id: "twitter", label: "X", color: "#000000" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ContentStudio() {
  const [mode, setMode] = useState<ContentMode>("freeform");
  const [model, setModel] = useState(MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [optimizedResults, setOptimizedResults] = useState<Record<string, string>>({});
  const outputRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find((m) => m.id === mode)!;
  const currentModel = MODELS.find((m) => m.id === model)!;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setOutput("");
    setOptimizedResults({});

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          systemOverride: currentMode.systemPrompt,
          model,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutput(data.text);
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setOutput(`Error: ${err instanceof Error ? err.message : "Generation failed"}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleOptimize(platform: string) {
    if (!output || optimizing) return;
    setOptimizing(platform);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: output, caption: "", platforms: [platform], model }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOptimizedResults((prev) => ({ ...prev, ...data.results }));
    } catch {
      // silent
    } finally {
      setOptimizing(null);
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault();
      handleGenerate();
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-text-primary italic">
            Content OS
          </h1>

          <div className="relative" ref={modelPickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-border-bright text-sm transition-colors"
            >
              <span className="text-text-secondary">{currentModel.label}</span>
              <ChevronDown size={12} className="text-text-muted" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface border border-border rounded-xl shadow-lg shadow-black/5 py-1 z-50 animate-fade-in">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setShowModelPicker(false); }}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-surface-hover transition-colors ${
                      model === m.id ? "text-text-primary" : "text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="text-sm">{m.label}</div>
                      <div className="text-[11px] text-text-muted">{m.provider}</div>
                    </div>
                    {model === m.id && <Check size={14} className="text-text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-5 pt-12 pb-20">
        {/* Title */}
        <div className="mb-10">
          <h2 className="font-display text-4xl sm:text-5xl text-text-primary italic leading-[1.1] tracking-tight">
            What do you want<br />to say today?
          </h2>
        </div>

        {/* Mode pills */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                mode === m.id
                  ? "bg-text-primary text-white"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-hover"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="bg-surface border border-border rounded-xl focus-within:border-border-bright focus-within:shadow-sm transition-all mb-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            rows={4}
            className="w-full bg-transparent px-4 pt-4 pb-2 text-text-primary placeholder:text-text-muted resize-none text-[15px] leading-relaxed"
          />
          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-[11px] text-text-muted">
              {prompt.length > 0 ? `${prompt.length} chars` : "\u2318+Enter"}
            </span>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-text-primary hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all active:scale-[0.97]"
            >
              {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isGenerating ? "Generating" : "Generate"}
            </button>
          </div>
        </div>

        {/* Output */}
        {(output || isGenerating) && (
          <div ref={outputRef} className="animate-slide-up">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {/* Output header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                <span className="text-[11px] text-text-muted font-mono">
                  {currentModel.label}
                </span>
                {output && (
                  <button
                    onClick={() => handleCopy(output)}
                    className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {/* Output body */}
              <div className="px-4 py-4">
                {isGenerating && !output ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-text-muted">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <div className="text-text-secondary text-[14px] leading-[1.7] whitespace-pre-wrap">
                    {output}
                  </div>
                )}
              </div>

              {/* Platform optimize */}
              {output && (
                <div className="border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-muted mr-1">Adapt for</span>
                    {PLATFORMS.map((p) => {
                      const isOptimized = !!optimizedResults[p.id];
                      const isLoading = optimizing === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleOptimize(p.id)}
                          disabled={isLoading}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all ${
                            isOptimized
                              ? "bg-green/5 text-green border border-green/15"
                              : "border border-border text-text-muted hover:text-text-secondary hover:border-border-bright"
                          }`}
                        >
                          {isLoading && <Loader2 size={10} className="animate-spin" />}
                          {p.label}
                          {isOptimized && <Check size={10} />}
                        </button>
                      );
                    })}
                  </div>

                  {Object.keys(optimizedResults).length > 0 && (
                    <div className="mt-3 space-y-2.5">
                      {Object.entries(optimizedResults).map(([platform, text]) => {
                        const plat = PLATFORMS.find((pp) => pp.id === platform);
                        if (!plat) return null;
                        return (
                          <div key={platform} className="border border-border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-medium text-text-muted">{plat.label}</span>
                              <button onClick={() => handleCopy(text)} className="text-text-muted hover:text-text-secondary">
                                <Copy size={10} />
                              </button>
                            </div>
                            <p className="text-text-secondary text-[13px] leading-relaxed whitespace-pre-wrap">{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 border-t border-border bg-bg/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center justify-between text-[11px] text-text-muted">
          <span>Powered by InsForge</span>
          <a href="/dashboard" className="flex items-center gap-1 hover:text-text-secondary transition-colors">
            Dashboard <ArrowRight size={10} />
          </a>
        </div>
      </footer>
    </div>
  );
}
