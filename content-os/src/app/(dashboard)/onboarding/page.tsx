'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getInsforgeClient } from '@/lib/insforge/client';
import { invalidatePillarCache } from '@/hooks/usePillars';
import type { ContentPillarConfig } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 4;

const PRESET_COLORS = [
  '#6366F1',
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
  '#6366F1',
  '#5A5047',
];

const DEFAULT_PILLARS: ContentPillarConfig[] = [
  { name: '', color: PRESET_COLORS[0], description: '' },
];

/* ------------------------------------------------------------------ */
/*  Step indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-200 ${
            i < current
              ? 'bg-[#6366F1] flex-[2]'
              : i === current
              ? 'bg-[#6366F1]/40 flex-[2]'
              : 'bg-[#27272A] flex-1'
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Profile basics
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Step 2: Content pillars
  const [pillars, setPillars] = useState<ContentPillarConfig[]>(DEFAULT_PILLARS);

  // Step 3: Voice
  const [voiceDescription, setVoiceDescription] = useState('');
  const [voiceRules, setVoiceRules] = useState('');

  // Step 4: Context / background
  const [contextAdditions, setContextAdditions] = useState('');

  /* ---- Pillar helpers ---- */

  const addPillar = useCallback(() => {
    if (pillars.length >= 6) return;
    setPillars((prev) => [
      ...prev,
      { name: '', color: PRESET_COLORS[prev.length % PRESET_COLORS.length], description: '' },
    ]);
  }, [pillars.length]);

  const removePillar = useCallback((index: number) => {
    setPillars((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePillar = useCallback(
    (index: number, field: keyof ContentPillarConfig, value: string) => {
      setPillars((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  /* ---- Navigation ---- */

  const canProceed = (): boolean => {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return pillars.some((p) => p.name.trim().length > 0);
    return true; // Steps 3 and 4 are optional
  };

  const handleNext = () => {
    setError('');
    if (!canProceed()) {
      if (step === 0) setError('Please enter your display name');
      if (step === 1) setError('Add at least one content pillar');
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  /* ---- Final save ---- */

  const handleFinish = async () => {
    setLoading(true);
    setError('');

    try {
      const insforge = getInsforgeClient();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error('Not logged in');
      const userId = userData.user.id;

      // Filter out empty pillars
      const validPillars = pillars.filter((p) => p.name.trim().length > 0);

      // Upsert creator_profile
      const { error: profileError } = await insforge.database
        .from('creator_profile')
        .upsert(
          {
            user_id: userId,
            display_name: displayName.trim(),
            bio: bio.trim() || null,
            bio_facts: bio.trim(),
            voice_description: voiceDescription.trim(),
            voice_rules: voiceRules.trim(),
            content_pillars: JSON.stringify(validPillars),
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      if (profileError) throw profileError;

      // Bust the pillar cache so the first dashboard load uses fresh custom pillars
      invalidatePillarCache();

      // Seed user_settings with context_additions
      if (contextAdditions.trim()) {
        const { error: settingsError } = await insforge.database
          .from('user_settings')
          .upsert(
            {
              user_id: userId,
              key: 'context_additions',
              value: contextAdditions.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,key' }
          );
        if (settingsError) throw settingsError;
      }

      router.push('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  /* ---- Shared input classes ---- */

  const inputCls =
    'w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-4 py-3 font-body text-[13px] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors';
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = 'block font-body text-[13px] text-[#A1A1AA] mb-2';

  /* ---- Step renderers ---- */

  const renderStep = () => {
    switch (step) {
      /* ---- Step 1: Profile Basics ---- */
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-[700] text-[20px] text-[#FAFAFA] mb-1">
                {"Let's start with the basics"}
              </h2>
              <p className="font-body text-[13px] text-[#71717A]">
                What should we call you?
              </p>
            </div>

            <div>
              <label className={labelCls}>Display name *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name or brand"
                className={inputCls}
                autoFocus
              />
            </div>

            <div>
              <label className={labelCls}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="A short bio about who you are and what you do..."
                className={textareaCls}
              />
            </div>
          </div>
        );

      /* ---- Step 2: Content Pillars ---- */
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-[700] text-[20px] text-[#FAFAFA] mb-1">
                Define your content pillars
              </h2>
              <p className="font-body text-[13px] text-[#71717A]">
                These are the core topics you create content about. Add at least one.
              </p>
            </div>

            <div className="space-y-4">
              {pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4 space-y-3"
                  style={{ borderLeftColor: pillar.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-[12px] font-medium text-[#71717A]">
                      Pillar {i + 1}
                    </span>
                    {pillars.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePillar(i)}
                        className="text-[11px] text-[#71717A] hover:text-[#6366F1] transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={pillar.name}
                      onChange={(e) => updatePillar(i, 'name', e.target.value)}
                      placeholder="Pillar name (e.g. Tech Takes)"
                      className={`flex-1 ${inputCls}`}
                    />
                    <div className="flex gap-1.5 items-center">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updatePillar(i, 'color', color)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            pillar.color === color
                              ? 'ring-2 ring-[#FAFAFA] ring-offset-1 ring-offset-[#09090B] scale-110'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={pillar.description || ''}
                    onChange={(e) => updatePillar(i, 'description', e.target.value)}
                    placeholder="What this pillar covers..."
                    rows={2}
                    className={textareaCls}
                  />
                </div>
              ))}

              {pillars.length < 6 && (
                <button
                  type="button"
                  onClick={addPillar}
                  className="w-full border-[0.5px] border-dashed border-[#FAFAFA]/12 rounded-[12px] py-3 text-[13px] text-[#71717A] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                >
                  + Add pillar
                </button>
              )}
            </div>
          </div>
        );

      /* ---- Step 3: Voice ---- */
      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-[700] text-[20px] text-[#FAFAFA] mb-1">
                Describe your voice
              </h2>
              <p className="font-body text-[13px] text-[#71717A]">
                Help the AI match how you talk. Both fields are optional but recommended.
              </p>
            </div>

            <div>
              <label className={labelCls}>How do you talk?</label>
              <textarea
                value={voiceDescription}
                onChange={(e) => setVoiceDescription(e.target.value)}
                rows={5}
                placeholder="e.g. Casual, direct, like explaining something cool to a friend. Use short sentences. Lots of analogies."
                className={textareaCls}
              />
            </div>

            <div>
              <label className={labelCls}>What should the AI avoid?</label>
              <textarea
                value={voiceRules}
                onChange={(e) => setVoiceRules(e.target.value)}
                rows={4}
                placeholder="e.g. Never use emoji. No corporate jargon. Don't start sentences with 'So...'"
                className={textareaCls}
              />
            </div>
          </div>
        );

      /* ---- Step 4: Context / Background ---- */
      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-[700] text-[20px] text-[#FAFAFA] mb-1">
                Add your context
              </h2>
              <p className="font-body text-[13px] text-[#71717A]">
                Tell the AI about your background, current projects, anything it should always know.
                You can update this later in Settings.
              </p>
            </div>

            <div>
              <label className={labelCls}>Background and context</label>
              <textarea
                value={contextAdditions}
                onChange={(e) => setContextAdditions(e.target.value)}
                rows={10}
                placeholder={"I'm a [role] who [what you do]. Currently working on [projects]. My audience is [who they are]."}
                className={textareaCls}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---- Main render ---- */

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="font-display font-[800] text-[18px] text-[#FAFAFA] tracking-[0.16em] mb-2">
        DISPATCH
      </h1>
      <p className="font-body text-[13px] text-[#71717A] mb-6">
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      <StepIndicator current={step} total={TOTAL_STEPS} />

      {renderStep()}

      {error && (
        <p className="font-body text-[13px] text-[#6366F1] mt-4">{error}</p>
      )}

      <div className="flex items-center justify-between mt-8">
        {step > 0 ? (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-[7px] py-[10px] px-[20px] font-body text-[13px] font-medium text-[#A1A1AA] border-[0.5px] border-[#FAFAFA]/12 hover:border-[#FAFAFA]/25 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="rounded-[7px] py-[10px] px-[24px] text-white font-body text-[13px] font-medium bg-[#6366F1] hover:opacity-90 transition-all duration-100 disabled:opacity-40"
          >
            {loading ? 'Setting up...' : 'Finish setup'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="rounded-[7px] py-[10px] px-[24px] text-white font-body text-[13px] font-medium bg-[#6366F1] hover:opacity-90 transition-all duration-100 disabled:opacity-40"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
