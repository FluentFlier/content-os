"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  Loader2,
  Zap,
  ArrowRight,
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

type ContentMode = "script" | "caption" | "hooks" | "thread" | "repurpose" | "freeform";

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
    placeholder: "Write anything. What content do you need?",
    systemPrompt:
      "You are a content strategist. Help create engaging, authentic content based on the creator's prompt. No em dashes anywhere. Ever.",
  },
  {
    id: "script",
    label: "Script",
    placeholder: "What's the topic? Give context, angle, or a rough idea...",
    systemPrompt: `Generate a short-form video script (under 60 seconds). Structure it as:
HOOK: One bold opening line that stops scrolling.
BODY: 3-4 punchy bullet points with the core message.
CTA: One direct question or call to action.
No em dashes. Write in a natural, conversational founder voice.`,
  },
  {
    id: "caption",
    label: "Caption",
    placeholder: "Describe the post or share the core message...",
    systemPrompt: `Write an Instagram caption. Hook-first (shown before 'more'). 2-4 sentences of substance. Direct question at end for engagement. No em dashes. Authentic, not salesy.`,
  },
  {
    id: "hooks",
    label: "Hooks",
    placeholder: "Topic or idea to generate hooks for...",
    systemPrompt: `Generate 8 scroll-stopping hooks for short-form video. Each hook should be one sentence max. Mix styles: controversial, curiosity gap, personal story opener, bold claim, question, confession, statistic, contrarian. Number them. No em dashes.`,
  },
  {
    id: "thread",
    label: "Thread",
    placeholder: "Topic for the thread. What insight are you sharing?",
    systemPrompt: `Write an X/Twitter thread (5-8 tweets). First tweet is the hook - must stand alone and make people click. Each tweet under 280 chars. End with a CTA. Use line breaks between tweets. Number each tweet. No em dashes.`,
  },
  {
    id: "repurpose",
    label: "Repurpose",
    placeholder: "Paste content to repurpose into other formats...",
    systemPrompt: `Take this content and repurpose it into 3 formats:
1. A tweet (under 280 chars)
2. A LinkedIn post (professional, reflective, 3-4 paragraphs)
3. An Instagram caption (hook-first, question CTA, hashtags)
Label each clearly. No em dashes.`,
  },
];

/* ------------------------------------------------------------------ */
/*  Platform Optimize                                                  */
/* ------------------------------------------------------------------ */

const PLATFORMS = [
  { id: "twitter", label: "X / Twitter", icon: Twitter, color: "#1DA1F2" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E4405F" },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
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

  // Close model picker on outside click
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

      // Scroll to output
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
        body: JSON.stringify({
          script: output,
          caption: "",
          platforms: [platform],
          model,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOptimizedResults((prev) => ({ ...prev, ...data.results }));
    } catch {
      // silent fail for optimize
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
    <div className="min-h-screen bg-bg relative noise">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* ---- Header ---- */}
      <header className="relative z-10 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
              <Zap size={16} className="text-amber" />
            </div>
            <h1 className="font-display text-xl text-text-primary italic">
              Content OS
            </h1>
          </div>

          {/* Model Picker */}
          <div className="relative" ref={modelPickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border hover:border-border-bright transition-colors text-sm"
            >
              <span className="text-text-muted text-xs">{currentModel.provider}</span>
              <span className="text-text-secondary font-medium">{currentModel.label}</span>
              <ChevronDown size={14} className="text-text-muted" />
            </button>

            {showModelPicker && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 py-1 z-50 animate-fade-in">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m.id);
                      setShowModelPicker(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-surface-hover transition-colors ${
                      model === m.id ? "text-amber" : "text-text-secondary"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs text-text-muted">{m.provider}</div>
                    </div>
                    {model === m.id && (
                      <Check size={14} className="text-amber" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <h2 className="font-display text-4xl sm:text-5xl text-text-primary italic leading-tight">
          Your content,
          <br />
          <span className="text-amber">any model.</span>
        </h2>
        <p className="mt-3 text-text-muted text-lg max-w-xl">
          Generate scripts, captions, hooks, and threads. Optimize for every platform.
          Pick the AI that fits your voice.
        </p>
      </section>

      {/* ---- Mode Selector ---- */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                mode === m.id
                  ? "bg-amber text-bg"
                  : "bg-surface border border-border text-text-muted hover:text-text-secondary hover:border-border-bright"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* ---- Input Area ---- */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-6">
        <div className="bg-surface border border-border rounded-2xl overflow-hidden focus-within:border-amber/40 focus-within:glow-amber transition-all">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentMode.placeholder}
            rows={5}
            className="w-full bg-transparent px-5 pt-5 pb-3 text-text-primary placeholder:text-text-muted/60 resize-none text-[15px] leading-relaxed focus:outline-none"
          />
          <div className="flex items-center justify-between px-5 pb-4">
            <span className="text-xs text-text-muted">
              {prompt.length > 0 ? `${prompt.length} chars` : "\u2318 + Enter to generate"}
            </span>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber hover:bg-amber-hover disabled:opacity-40 disabled:cursor-not-allowed text-bg font-semibold text-sm transition-all active:scale-[0.97]"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ---- Output ---- */}
      {(output || isGenerating) && (
        <section ref={outputRef} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-8 animate-slide-up">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            {/* Output Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green animate-pulse-slow" />
                <span className="text-xs text-text-muted font-mono">
                  {currentModel.label}
                </span>
              </div>
              {output && (
                <button
                  onClick={() => handleCopy(output)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {/* Output Body */}
            <div className="px-5 py-4">
              {isGenerating && !output ? (
                <div className="flex items-center gap-3 py-8 justify-center text-text-muted">
                  <Loader2 size={20} className="animate-spin text-amber" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="text-text-secondary text-[15px] leading-relaxed whitespace-pre-wrap font-body">
                  {output}
                </div>
              )}
            </div>

            {/* Platform Optimizers */}
            {output && (
              <div className="border-t border-border px-5 py-4">
                <p className="text-xs text-text-muted mb-3 font-medium uppercase tracking-wider">
                  Optimize for platform
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const isOptimized = !!optimizedResults[p.id];
                    const isLoading = optimizing === p.id;

                    return (
                      <button
                        key={p.id}
                        onClick={() => handleOptimize(p.id)}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          isOptimized
                            ? "bg-green/10 text-green border border-green/20"
                            : "bg-surface-hover border border-border text-text-muted hover:text-text-secondary hover:border-border-bright"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Icon size={14} />
                        )}
                        {p.label}
                        {isOptimized && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>

                {/* Optimized Results */}
                {Object.keys(optimizedResults).length > 0 && (
                  <div className="mt-4 space-y-3">
                    {Object.entries(optimizedResults).map(([platform, text]) => {
                      const plat = PLATFORMS.find((p) => p.id === platform);
                      if (!plat) return null;
                      const Icon = plat.icon;

                      return (
                        <div
                          key={platform}
                          className="bg-bg border border-border rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon size={14} style={{ color: plat.color }} />
                              <span className="text-xs font-medium text-text-muted">
                                {plat.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopy(text)}
                              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                            {text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- Footer ---- */}
      <footer className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-border/30">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Powered by InsForge</span>
          <a
            href="/dashboard"
            className="flex items-center gap-1 hover:text-amber transition-colors"
          >
            Full dashboard <ArrowRight size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
