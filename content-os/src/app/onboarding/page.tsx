"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";
import type { ContentPillarConfig, PlatformConfig } from "@/types/database";

const PRESET_COLORS = [
  "#EB5E55",
  "#F5C842",
  "#5CB85C",
  "#C77DFF",
  "#4D96FF",
  "#5A5047",
];

const VOICE_PRESETS: Record<string, string> = {
  "Raw & Direct":
    "Blunt, punchy, no fluff. Short sentences. Say what you mean. Use strong opinions. Conversational but confident. Like texting a smart friend who doesn't sugarcoat anything.",
  Professional:
    "Polished and clear. Well-structured sentences. Authoritative but approachable. Data-driven where possible. Avoids slang but never stiff or corporate.",
  "Casual & Fun":
    "Lighthearted, emoji-friendly, relatable. Uses humor and pop culture references. Feels like a conversation over coffee. Engaging and easy to read.",
  Academic:
    "Thoughtful and precise. Uses domain-specific terminology when appropriate. Structured arguments with evidence. Measured tone that invites intellectual curiosity.",
};

const STEPS = [
  "Who are you?",
  "Your voice",
  "Content pillars",
  "Platforms",
];

function emptyPillar(): ContentPillarConfig {
  return {
    name: "",
    color: PRESET_COLORS[0],
    description: "",
    promptTemplate: "",
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [bioFacts, setBioFacts] = useState("");

  // Step 2
  const [voiceDescription, setVoiceDescription] = useState("");
  const [voiceRules, setVoiceRules] = useState("");

  // Step 3
  const [pillars, setPillars] = useState<ContentPillarConfig[]>([
    emptyPillar(),
  ]);

  // Step 4
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    instagram: { enabled: false },
    x: {
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      accessSecret: "",
      enabled: false,
    },
    linkedin: {
      clientId: "",
      clientSecret: "",
      accessToken: "",
      refreshToken: "",
      personId: "",
      enabled: false,
    },
  });

  function canProceed(): boolean {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) {
      return pillars.every((p) => p.name.trim().length > 0);
    }
    return true;
  }

  function addPillar() {
    if (pillars.length >= 6) return;
    setPillars([...pillars, emptyPillar()]);
  }

  function removePillar(index: number) {
    if (pillars.length <= 1) return;
    setPillars(pillars.filter((_, i) => i !== index));
  }

  function updatePillar(
    index: number,
    field: keyof ContentPillarConfig,
    value: string
  ) {
    const updated = [...pillars];
    updated[index] = { ...updated[index], [field]: value };
    setPillars(updated);
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);

    try {
      const insforge = getInsforge();
      const {
        data: { user },
      } = await insforge.auth.getCurrentUser();

      if (!user) {
        setError("Not authenticated. Please log in again.");
        setSaving(false);
        return;
      }

      const { error: insertError } = await insforge.database
        .from("creator_profile")
        .insert({
          user_id: user.id,
          display_name: displayName.trim(),
          bio_facts: bioFacts.trim(),
          voice_description: voiceDescription.trim(),
          voice_rules: voiceRules.trim(),
          content_pillars: JSON.stringify(pillars),
          platform_config: JSON.stringify(platformConfig),
          onboarding_complete: true,
        });

      if (insertError) {
        setError(insertError.message ?? "Failed to save profile.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i <= step
                      ? "bg-coral text-white"
                      : "bg-surface text-text-muted border border-border"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`hidden sm:block w-12 md:w-20 h-0.5 transition-colors ${
                      i < step ? "bg-coral" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-border rounded-full h-1">
            <div
              className="bg-coral h-1 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="font-heading text-2xl mb-1">{STEPS[step]}</h1>

          {/* Step 1: Who are you? */}
          {step === 0 && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Display name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or brand"
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Key facts about you that the AI should know
                </label>
                <textarea
                  value={bioFacts}
                  onChange={(e) => setBioFacts(e.target.value)}
                  placeholder="Your background, achievements, what you're building, where you're based..."
                  rows={5}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  Your background, achievements, what you are building, where
                  you are based. Be specific.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Your voice */}
          {step === 1 && (
            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  How do you talk?
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(VOICE_PRESETS).map(([label, text]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setVoiceDescription(text)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        voiceDescription === text
                          ? "bg-coral/20 border-coral text-coral"
                          : "bg-surface border-border text-text-muted hover:border-text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={voiceDescription}
                  onChange={(e) => setVoiceDescription(e.target.value)}
                  placeholder="Describe how your content should sound..."
                  rows={4}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1.5">
                  Hard rules for your content
                </label>
                <textarea
                  value={voiceRules}
                  onChange={(e) => setVoiceRules(e.target.value)}
                  placeholder="Things the AI must always or never do..."
                  rows={4}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  Example: Never use em dashes. Always say secretary, not
                  assistant.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Content pillars */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              {pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="border border-border rounded-xl p-5 space-y-4"
                  style={{ borderLeftColor: pillar.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-muted">
                      Pillar {i + 1}
                    </span>
                    {pillars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePillar(i)}
                        className="text-xs text-text-muted hover:text-coral transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={pillar.name}
                      onChange={(e) => updatePillar(i, "name", e.target.value)}
                      placeholder="Pillar name"
                      className="flex-1 bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
                    />
                    <div className="flex gap-1.5 items-center">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updatePillar(i, "color", color)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            pillar.color === color
                              ? "ring-2 ring-white ring-offset-2 ring-offset-surface scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={pillar.description}
                    onChange={(e) =>
                      updatePillar(i, "description", e.target.value)
                    }
                    placeholder="What this pillar covers..."
                    rows={2}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                  />

                  <textarea
                    value={pillar.promptTemplate}
                    onChange={(e) =>
                      updatePillar(i, "promptTemplate", e.target.value)
                    }
                    placeholder="AI prompt template for generating scripts in this pillar..."
                    rows={3}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                  />
                </div>
              ))}

              {pillars.length < 6 && (
                <button
                  type="button"
                  onClick={addPillar}
                  className="w-full border border-dashed border-border rounded-xl py-3 text-sm text-text-muted hover:border-coral hover:text-coral transition-colors"
                >
                  + Add Pillar
                </button>
              )}
            </div>
          )}

          {/* Step 4: Platforms */}
          {step === 3 && (
            <div className="mt-6 space-y-6">
              <p className="text-sm text-text-muted">
                You can always change these in Settings later.
              </p>

              {/* Instagram */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Instagram</span>
                  <Toggle
                    enabled={platformConfig.instagram?.enabled ?? false}
                    onChange={(v) =>
                      setPlatformConfig({
                        ...platformConfig,
                        instagram: { enabled: v },
                      })
                    }
                  />
                </div>
                {platformConfig.instagram?.enabled && (
                  <p className="text-xs text-text-muted mt-2">
                    Manual posting. Content will be prepared and ready to copy.
                  </p>
                )}
              </div>

              {/* X / Twitter */}
              <div className="border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">X / Twitter</span>
                  <Toggle
                    enabled={platformConfig.x?.enabled ?? false}
                    onChange={(v) =>
                      setPlatformConfig({
                        ...platformConfig,
                        x: { ...platformConfig.x!, enabled: v },
                      })
                    }
                  />
                </div>
                {platformConfig.x?.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        ["apiKey", "API Key"],
                        ["apiSecret", "API Secret"],
                        ["accessToken", "Access Token"],
                        ["accessSecret", "Access Secret"],
                      ] as const
                    ).map(([field, label]) => (
                      <div key={field}>
                        <label className="block text-xs text-text-muted mb-1">
                          {label}
                        </label>
                        <input
                          type="password"
                          value={
                            (platformConfig.x as unknown as Record<string, string>)?.[
                              field
                            ] ?? ""
                          }
                          onChange={(e) =>
                            setPlatformConfig({
                              ...platformConfig,
                              x: {
                                ...platformConfig.x!,
                                [field]: e.target.value,
                              },
                            })
                          }
                          placeholder={label}
                          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* LinkedIn */}
              <div className="border border-border rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-medium">LinkedIn</span>
                  <Toggle
                    enabled={platformConfig.linkedin?.enabled ?? false}
                    onChange={(v) =>
                      setPlatformConfig({
                        ...platformConfig,
                        linkedin: { ...platformConfig.linkedin!, enabled: v },
                      })
                    }
                  />
                </div>
                {platformConfig.linkedin?.enabled && (
                  <p className="text-xs text-text-muted mt-2">
                    OAuth setup required. Configure in Settings after
                    onboarding.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 text-sm text-coral bg-coral/10 border border-coral/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 rounded-lg bg-surface border border-border text-text-primary hover:bg-border/30 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-lg bg-coral text-white font-medium hover:bg-coral/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleComplete}
                className="px-6 py-2.5 rounded-lg bg-coral text-white font-medium hover:bg-coral/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch component                                            */
/* ------------------------------------------------------------------ */

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-coral" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
