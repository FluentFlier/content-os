"use client";

import { useState, useCallback } from "react";
import { Loader2, Plus, X, Copy, Check, ChevronRight, Sparkles, Mic, FileText, Download } from "lucide-react";

type Step = "samples" | "analyzing" | "interview" | "synthesizing" | "result";

interface Sample {
  content: string;
  platform: string;
}

interface GapQuestion {
  id: string;
  question: string;
  why: string;
}

interface Analysis {
  analysis: Record<string, unknown>;
  voice_summary: string;
  voice_rules: string[];
  gap_questions: GapQuestion[];
}

interface Persona {
  voice_description: string;
  voice_rules: string;
  vocabulary_fingerprint: {
    uses_often: string[];
    never_uses: string[];
    signature_phrases: string[];
  };
  structural_patterns: {
    avg_sentence_length: string;
    paragraph_style: string;
    hook_pattern: string;
    closing_pattern: string;
  };
  exportable_prompt: string;
}

const PLATFORMS = ["Twitter/X", "LinkedIn", "Instagram", "Threads", "Other"];

export default function VoiceLabPage() {
  const [step, setStep] = useState<Step>("samples");
  const [samples, setSamples] = useState<Sample[]>([{ content: "", platform: "Twitter/X" }]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [persona, setPersona] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addSample = useCallback(() => {
    if (samples.length >= 20) return;
    setSamples((prev) => [...prev, { content: "", platform: "Twitter/X" }]);
  }, [samples.length]);

  const removeSample = useCallback((index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateSample = useCallback((index: number, field: keyof Sample, value: string) => {
    setSamples((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }, []);

  const validSamples = samples.filter((s) => s.content.trim().length > 10);

  async function analyzeSamples() {
    if (validSamples.length < 3) {
      setError("Add at least 3 content samples for accurate analysis");
      return;
    }
    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/voice-lab/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: validSamples }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: Analysis = await res.json();
      setAnalysis(data);

      const initial: Record<string, string> = {};
      data.gap_questions.forEach((q) => { initial[q.id] = ""; });
      setAnswers(initial);

      setStep("interview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("samples");
    }
  }

  async function synthesizePersona() {
    if (!analysis) return;
    setStep("synthesizing");
    setError(null);

    const answeredQuestions = analysis.gap_questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: answers[q.id],
      }));

    try {
      const res = await fetch("/api/voice-lab/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: analysis.analysis,
          answers: answeredQuestions,
        }),
      });

      if (!res.ok) throw new Error("Synthesis failed");

      const data: Persona = await res.json();
      setPersona(data);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synthesis failed");
      setStep("interview");
    }
  }

  async function savePersona() {
    if (!persona) return;
    setSaving(true);

    try {
      const res = await fetch("/api/voice-lab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...persona,
          sample_posts: validSamples,
        }),
      });

      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function copyExportPrompt() {
    if (!persona) return;
    navigator.clipboard.writeText(persona.exportable_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(129,140,248,0.15)] flex items-center justify-center">
          <Mic className="w-4 h-4 text-[#818CF8]" />
        </div>
        <div>
          <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">
            Voice Lab
          </h1>
          <p className="text-[13px] text-[#71717A]">Extract and craft your unique content voice</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-[12px]">
        {(["samples", "interview", "result"] as const).map((s, i) => {
          const labels = ["1. Paste Content", "2. Voice Interview", "3. Your Persona"];
          const isActive = step === s || (s === "samples" && step === "analyzing") || (s === "interview" && step === "synthesizing");
          const isDone =
            (s === "samples" && ["interview", "synthesizing", "result"].includes(step)) ||
            (s === "interview" && step === "result");
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-3 h-3 text-[#3F3F46]" />}
              <span className={`px-2.5 py-1 rounded-full ${
                isDone
                  ? "bg-[rgba(52,211,153,0.12)] text-[#6EE7B7]"
                  : isActive
                    ? "bg-[rgba(129,140,248,0.12)] text-[#A5B4FC]"
                    : "bg-[rgba(255,255,255,0.04)] text-[#52525B]"
              }`}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-3 text-[13px] text-[#FCA5A5]">
          {error}
        </div>
      )}

      {/* Step 1: Paste Samples */}
      {step === "samples" && (
        <div className="space-y-4">
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">
                Paste your best content
              </h2>
              <span className="text-[12px] text-[#52525B]">{validSamples.length} valid samples</span>
            </div>
            <p className="text-[13px] text-[#71717A]">
              Add 5-15 posts that represent your voice at its best. Mix platforms for a richer profile.
            </p>

            {samples.map((sample, index) => (
              <div key={index} className="space-y-2 p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => updateSample(index, "platform", p)}
                        className={`text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                          sample.platform === p
                            ? "bg-[rgba(129,140,248,0.15)] text-[#A5B4FC]"
                            : "bg-[rgba(255,255,255,0.04)] text-[#52525B] hover:text-[#71717A]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {samples.length > 1 && (
                    <button onClick={() => removeSample(index)} className="text-[#52525B] hover:text-[#A1A1AA]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  value={sample.content}
                  onChange={(e) => updateSample(index, "content", e.target.value)}
                  placeholder="Paste a post, tweet, or caption..."
                  rows={3}
                  className="w-full bg-transparent text-[13px] text-[#FAFAFA] placeholder-[#3F3F46] resize-none focus:outline-none"
                />
              </div>
            ))}

            <button
              onClick={addSample}
              disabled={samples.length >= 20}
              className="flex items-center gap-1.5 text-[12px] text-[#71717A] hover:text-[#A1A1AA] disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" /> Add another sample
            </button>
          </div>

          <button
            onClick={analyzeSamples}
            disabled={validSamples.length < 3}
            className="w-full py-3 rounded-lg font-medium text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#818CF8] text-white hover:bg-[#6366F1]"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Analyze Voice ({validSamples.length} samples)
            </span>
          </button>
        </div>
      )}

      {/* Analyzing spinner */}
      {step === "analyzing" && (
        <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#818CF8]" />
          <p className="text-[14px] text-[#A1A1AA]">Analyzing your voice patterns...</p>
          <p className="text-[12px] text-[#52525B]">Reading sentence structure, tone, vocabulary, and quirks</p>
        </div>
      )}

      {/* Step 2: Voice Interview */}
      {step === "interview" && analysis && (
        <div className="space-y-4">
          {/* Analysis Summary */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-3">
            <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Voice Snapshot</h2>
            <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{analysis.voice_summary}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {analysis.voice_rules.slice(0, 6).map((rule, i) => (
                <span key={i} className={`text-[11px] px-2.5 py-1 rounded-full ${
                  rule.startsWith("DO")
                    ? "bg-[rgba(52,211,153,0.1)] text-[#6EE7B7]"
                    : "bg-[rgba(239,68,68,0.1)] text-[#FCA5A5]"
                }`}>
                  {rule}
                </span>
              ))}
            </div>
          </div>

          {/* Gap Questions */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-4">
            <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Quick Voice Interview</h2>
            <p className="text-[13px] text-[#71717A]">
              Answer these to fill in what the AI could not tell from your writing alone. Skip any you want.
            </p>

            {analysis.gap_questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="text-[13px] text-[#FAFAFA] font-medium">{q.question}</label>
                <p className="text-[11px] text-[#52525B]">{q.why}</p>
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder="Your answer..."
                  rows={2}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-[13px] text-[#FAFAFA] placeholder-[#3F3F46] resize-none focus:outline-none focus:border-[rgba(129,140,248,0.3)]"
                />
              </div>
            ))}
          </div>

          <button
            onClick={synthesizePersona}
            className="w-full py-3 rounded-lg font-medium text-[14px] bg-[#818CF8] text-white hover:bg-[#6366F1] transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Build My Persona
            </span>
          </button>
        </div>
      )}

      {/* Synthesizing spinner */}
      {step === "synthesizing" && (
        <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#818CF8]" />
          <p className="text-[14px] text-[#A1A1AA]">Crafting your persona...</p>
          <p className="text-[12px] text-[#52525B]">Merging analysis with your interview answers</p>
        </div>
      )}

      {/* Step 3: Persona Result */}
      {step === "result" && persona && (
        <div className="space-y-4">
          {/* Voice Description */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-3">
            <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Your Voice</h2>
            <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{persona.voice_description}</p>
          </div>

          {/* Voice Rules */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-3">
            <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Voice Rules</h2>
            <pre className="text-[12px] text-[#A1A1AA] whitespace-pre-wrap leading-relaxed font-mono bg-[rgba(255,255,255,0.02)] rounded-lg p-4">
              {persona.voice_rules}
            </pre>
          </div>

          {/* Vocabulary */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-3">
            <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Vocabulary Fingerprint</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-[#52525B] mb-1.5 uppercase tracking-wider">Uses Often</p>
                <div className="flex flex-wrap gap-1">
                  {persona.vocabulary_fingerprint.uses_often?.map((w) => (
                    <span key={w} className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(129,140,248,0.1)] text-[#A5B4FC]">{w}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#52525B] mb-1.5 uppercase tracking-wider">Never Uses</p>
                <div className="flex flex-wrap gap-1">
                  {persona.vocabulary_fingerprint.never_uses?.map((w) => (
                    <span key={w} className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-[#FCA5A5]">{w}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#52525B] mb-1.5 uppercase tracking-wider">Signature Phrases</p>
                <div className="flex flex-wrap gap-1">
                  {persona.vocabulary_fingerprint.signature_phrases?.map((w) => (
                    <span key={w} className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.1)] text-[#6EE7B7]">{w}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Exportable Prompt */}
          <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA]">Exportable Persona Prompt</h2>
              <button
                onClick={copyExportPrompt}
                className="flex items-center gap-1.5 text-[12px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#6EE7B7]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-[#52525B]">Use this in Claude, ChatGPT, or any LLM to write in your voice</p>
            <pre className="text-[12px] text-[#A1A1AA] whitespace-pre-wrap leading-relaxed font-mono bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {persona.exportable_prompt}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={savePersona}
              disabled={saving}
              className="flex-1 py-3 rounded-lg font-medium text-[14px] transition-all bg-[#818CF8] text-white hover:bg-[#6366F1] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {saved ? "Saved to Profile!" : saving ? "Saving..." : "Save to Profile"}
            </button>
            <button
              onClick={copyExportPrompt}
              className="px-6 py-3 rounded-lg font-medium text-[14px] transition-all bg-[rgba(255,255,255,0.06)] text-[#FAFAFA] hover:bg-[rgba(255,255,255,0.1)] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Start Over */}
          <button
            onClick={() => { setStep("samples"); setAnalysis(null); setPersona(null); setError(null); }}
            className="text-[12px] text-[#52525B] hover:text-[#71717A] transition-colors"
          >
            Start over with new samples
          </button>
        </div>
      )}
    </div>
  );
}
