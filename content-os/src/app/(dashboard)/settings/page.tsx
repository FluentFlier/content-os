"use client";

import { useEffect, useState, useCallback } from "react";
import { getInsforge } from "@/lib/insforge/client";
import type {
  ContentPillarConfig,
  PlatformConfig,
  CreatorProfile,
  UserSetting,
  Platform,
} from "@/types/database";
import { Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
  "#EB5E55",
  "#F5C842",
  "#5CB85C",
  "#C77DFF",
  "#4D96FF",
  "#5A5047",
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const ALL_PLATFORMS: Platform[] = ["instagram", "linkedin", "twitter", "threads"];

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  threads: "Threads",
};

interface BioCard {
  platform: string;
  bio: string;
  limit: number;
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Password input with show/hide
// ---------------------------------------------------------------------------

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs text-text-muted mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 pr-10 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save confirmation message
// ---------------------------------------------------------------------------

function SaveButton({
  onClick,
  loading,
  saved,
  label = "Save",
}: {
  onClick: () => void;
  loading: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="px-5 py-2 rounded-lg bg-coral text-white font-medium text-sm hover:bg-coral/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : label}
      </button>
      {saved && (
        <span className="text-sm text-green animate-fade-in">Saved!</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="font-heading text-lg text-text-primary mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Section 1: Context
  const [contextAdditions, setContextAdditions] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);

  // Section 2: Pillar weights
  const [pillarWeights, setPillarWeights] = useState<Record<string, number>>(
    {}
  );
  const [weightsSaving, setWeightsSaving] = useState(false);
  const [weightsSaved, setWeightsSaved] = useState(false);

  // Section 3: Weekly schedule
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>(
    () => {
      const schedule: Record<string, string> = {};
      DAYS_OF_WEEK.forEach((d) => (schedule[d] = "Rest"));
      return schedule;
    }
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  // Section 4: Platform defaults
  const [defaultPlatform, setDefaultPlatform] = useState<Platform>("instagram");
  const [crossPostReminders, setCrossPostReminders] = useState(false);
  const [platformDefaultsSaving, setPlatformDefaultsSaving] = useState(false);
  const [platformDefaultsSaved, setPlatformDefaultsSaved] = useState(false);

  // Section 5: Bio generator
  const [bioGenerating, setBioGenerating] = useState(false);
  const [bios, setBios] = useState<BioCard[]>([]);
  const [copiedBio, setCopiedBio] = useState<string | null>(null);

  // Section 6: Platform connections
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
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);

  // Section 7: Profile editor
  const [displayName, setDisplayName] = useState("");
  const [bioFacts, setBioFacts] = useState("");
  const [voiceDescription, setVoiceDescription] = useState("");
  const [voiceRules, setVoiceRules] = useState("");
  const [pillars, setPillars] = useState<ContentPillarConfig[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const flashSaved = useCallback(
    (setter: (v: boolean) => void) => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    },
    []
  );

  async function upsertSetting(key: string, value: string) {
    if (!userId) return;
    const insforge = getInsforge();
    await insforge.database.from("user_settings").upsert(
      {
        user_id: userId,
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,key" }
    );
  }

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      try {
        const insforge = getInsforge();
        const { data: userData } = await insforge.auth.getCurrentUser();
        const uid = userData?.user?.id;
        if (!uid) return;
        setUserId(uid);

        const [settingsRes, profileRes] = await Promise.all([
          insforge.database
            .from("user_settings")
            .select("*")
            .eq("user_id", uid),
          insforge.database
            .from("creator_profile")
            .select("*")
            .eq("user_id", uid)
            .single(),
        ]);

        const settings: UserSetting[] = settingsRes.data ?? [];
        const prof: CreatorProfile | null = profileRes.data;

        // Populate settings
        for (const s of settings) {
          if (s.key === "context_additions") {
            setContextAdditions(s.value);
          } else if (s.key === "pillar_weights") {
            try {
              setPillarWeights(JSON.parse(s.value));
            } catch {}
          } else if (s.key === "weekly_schedule") {
            try {
              setWeeklySchedule((prev) => ({ ...prev, ...JSON.parse(s.value) }));
            } catch {}
          } else if (s.key === "platform_defaults") {
            try {
              const parsed = JSON.parse(s.value);
              if (parsed.defaultPlatform)
                setDefaultPlatform(parsed.defaultPlatform);
              if (parsed.crossPostReminders !== undefined)
                setCrossPostReminders(parsed.crossPostReminders);
            } catch {}
          }
        }

        // Populate profile
        if (prof) {
          setProfile(prof);
          setDisplayName(prof.display_name);
          setBioFacts(prof.bio_facts);
          setVoiceDescription(prof.voice_description);
          setVoiceRules(prof.voice_rules);

          const parsedPillars: ContentPillarConfig[] =
            typeof prof.content_pillars === "string"
              ? JSON.parse(prof.content_pillars)
              : prof.content_pillars;
          setPillars(parsedPillars);

          // Initialize pillar weights for any pillars that don't have a weight yet
          const existingWeights: Record<string, number> = {};
          for (const p of parsedPillars) {
            existingWeights[p.name] = pillarWeights[p.name] ?? 3;
          }
          setPillarWeights((prev) => ({ ...existingWeights, ...prev }));

          const parsedPlatformConfig: PlatformConfig =
            typeof prof.platform_config === "string"
              ? JSON.parse(prof.platform_config)
              : prof.platform_config;
          setPlatformConfig((prev) => ({
            ...prev,
            ...parsedPlatformConfig,
          }));
        }
      } catch (err) {
        console.error("[Settings] Load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Section save handlers
  // ---------------------------------------------------------------------------

  async function saveContext() {
    setContextSaving(true);
    await upsertSetting("context_additions", contextAdditions);
    setContextSaving(false);
    flashSaved(setContextSaved);
  }

  async function savePillarWeights() {
    setWeightsSaving(true);
    await upsertSetting("pillar_weights", JSON.stringify(pillarWeights));
    setWeightsSaving(false);
    flashSaved(setWeightsSaved);
  }

  async function saveWeeklySchedule() {
    setScheduleSaving(true);
    await upsertSetting("weekly_schedule", JSON.stringify(weeklySchedule));
    setScheduleSaving(false);
    flashSaved(setScheduleSaved);
  }

  async function savePlatformDefaults() {
    setPlatformDefaultsSaving(true);
    await upsertSetting(
      "platform_defaults",
      JSON.stringify({ defaultPlatform, crossPostReminders })
    );
    setPlatformDefaultsSaving(false);
    flashSaved(setPlatformDefaultsSaved);
  }

  async function savePlatformConfig() {
    if (!userId) return;
    setPlatformSaving(true);
    const insforge = getInsforge();
    await insforge.database
      .from("creator_profile")
      .update({
        platform_config: JSON.stringify(platformConfig),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setPlatformSaving(false);
    flashSaved(setPlatformSaved);
  }

  async function saveProfile() {
    if (!userId) return;
    setProfileSaving(true);
    const insforge = getInsforge();
    await insforge.database
      .from("creator_profile")
      .update({
        display_name: displayName,
        bio_facts: bioFacts,
        voice_description: voiceDescription,
        voice_rules: voiceRules,
        content_pillars: JSON.stringify(pillars),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    setProfileSaving(false);
    flashSaved(setProfileSaved);
  }

  // ---------------------------------------------------------------------------
  // Bio generator
  // ---------------------------------------------------------------------------

  async function generateBios() {
    setBioGenerating(true);
    setBios([]);

    try {
      const name = profile?.display_name ?? displayName;
      const prompt = `Write optimized profile bios for ${name} for Instagram, LinkedIn, X (Twitter), and Threads. Character limits: Instagram 150, LinkedIn 220, X 160, Threads 150. Bio must convey the key facts from their profile. Voice: punchy, specific, no fluff, no em dashes.\n\nProfile facts: ${bioFacts}\n\nReturn ONLY a JSON array with objects like: [{"platform":"Instagram","bio":"...","limit":150},{"platform":"LinkedIn","bio":"...","limit":220},{"platform":"X (Twitter)","bio":"...","limit":160},{"platform":"Threads","bio":"...","limit":150}]`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { text } = await res.json();

      // Parse JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed: BioCard[] = JSON.parse(jsonMatch[0]);
        setBios(parsed);
      }
    } catch (err) {
      console.error("[Settings] Bio generation error:", err);
    } finally {
      setBioGenerating(false);
    }
  }

  function copyBio(platform: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedBio(platform);
    setTimeout(() => setCopiedBio(null), 2000);
  }

  // ---------------------------------------------------------------------------
  // Pillar editor helpers
  // ---------------------------------------------------------------------------

  function addPillar() {
    if (pillars.length >= 6) return;
    setPillars([
      ...pillars,
      { name: "", color: PRESET_COLORS[0], description: "", promptTemplate: "" },
    ]);
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  const pillarOptions = pillars.map((p) => p.name).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-heading text-2xl text-text-primary">Settings</h1>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Context Editor */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Personal Context">
        <p className="text-sm text-text-muted mb-3">
          Update this when something big changes. This text is appended to every
          AI call to keep the AI current.
        </p>
        <textarea
          value={contextAdditions}
          onChange={(e) => setContextAdditions(e.target.value)}
          placeholder="Add context the AI should always know about you..."
          rows={6}
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none mb-4"
        />
        <SaveButton
          onClick={saveContext}
          loading={contextSaving}
          saved={contextSaved}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Pillar Weights */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Pillar Weights">
        <p className="text-sm text-text-muted mb-4">
          Set how many posts per week for each content pillar.
        </p>
        <div className="space-y-4 mb-4">
          {pillars.map((pillar) => {
            if (!pillar.name) return null;
            const weight = pillarWeights[pillar.name] ?? 3;
            return (
              <div key={pillar.name} className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pillar.color }}
                  />
                  <span className="text-sm text-text-primary truncate">
                    {pillar.name}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={weight}
                  onChange={(e) =>
                    setPillarWeights({
                      ...pillarWeights,
                      [pillar.name]: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 accent-coral h-2 cursor-pointer"
                />
                <span className="text-sm text-text-muted w-16 text-right">
                  {weight}/week
                </span>
              </div>
            );
          })}
        </div>
        <SaveButton
          onClick={savePillarWeights}
          loading={weightsSaving}
          saved={weightsSaved}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Weekly Schedule Template */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Weekly Schedule Template">
        <div className="space-y-3 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <span className="text-sm text-text-primary w-24">{day}</span>
              <select
                value={weeklySchedule[day] ?? "Rest"}
                onChange={(e) =>
                  setWeeklySchedule({
                    ...weeklySchedule,
                    [day]: e.target.value,
                  })
                }
                className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
              >
                <option value="Rest">Rest</option>
                {pillarOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <SaveButton
          onClick={saveWeeklySchedule}
          loading={scheduleSaving}
          saved={scheduleSaved}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 4: Platform Defaults */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Platform Defaults">
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Default platform
            </label>
            <select
              value={defaultPlatform}
              onChange={(e) => setDefaultPlatform(e.target.value as Platform)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors"
            >
              {ALL_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">
              Cross-post reminders
            </span>
            <Toggle
              enabled={crossPostReminders}
              onChange={setCrossPostReminders}
            />
          </div>
        </div>
        <SaveButton
          onClick={savePlatformDefaults}
          loading={platformDefaultsSaving}
          saved={platformDefaultsSaved}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 5: Profile Bio Generator */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Profile Bio Generator">
        <button
          type="button"
          disabled={bioGenerating}
          onClick={generateBios}
          className="px-5 py-2 rounded-lg bg-coral text-white font-medium text-sm hover:bg-coral/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {bioGenerating && <Loader2 size={16} className="animate-spin" />}
          {bioGenerating ? "Generating..." : "Generate Platform Bios"}
        </button>

        {bios.length > 0 && (
          <div className="mt-4 space-y-3">
            {bios.map((card) => (
              <div
                key={card.platform}
                className="bg-bg border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    {card.platform}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        card.bio.length > card.limit
                          ? "text-coral"
                          : "text-text-muted"
                      }`}
                    >
                      {card.bio.length}/{card.limit}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyBio(card.platform, card.bio)}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      {copiedBio === card.platform ? (
                        <Check size={16} className="text-green" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={card.bio}
                  onChange={(e) => {
                    setBios((prev) =>
                      prev.map((b) =>
                        b.platform === card.platform
                          ? { ...b, bio: e.target.value }
                          : b
                      )
                    );
                  }}
                  rows={3}
                  className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 6: Platform Connections */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Platform Connections">
        {/* X / Twitter */}
        <div className="border border-border rounded-xl p-5 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">X / Twitter</span>
              <ConnectionStatus
                connected={
                  !!(
                    platformConfig.x?.apiKey &&
                    platformConfig.x?.accessToken &&
                    platformConfig.x?.enabled
                  )
                }
              />
            </div>
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
                <PasswordField
                  key={field}
                  label={label}
                  value={
                    (
                      platformConfig.x as unknown as Record<string, string>
                    )?.[field] ?? ""
                  }
                  onChange={(v) =>
                    setPlatformConfig({
                      ...platformConfig,
                      x: { ...platformConfig.x!, [field]: v },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* LinkedIn */}
        <div className="border border-border rounded-xl p-5 space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">LinkedIn</span>
              <ConnectionStatus
                connected={
                  !!(
                    platformConfig.linkedin?.clientId &&
                    platformConfig.linkedin?.accessToken &&
                    platformConfig.linkedin?.enabled
                  )
                }
              />
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ["clientId", "Client ID"],
                  ["clientSecret", "Client Secret"],
                  ["accessToken", "Access Token"],
                  ["refreshToken", "Refresh Token"],
                  ["personId", "Person ID"],
                ] as const
              ).map(([field, label]) => (
                <PasswordField
                  key={field}
                  label={label}
                  value={
                    (
                      platformConfig.linkedin as unknown as Record<
                        string,
                        string
                      >
                    )?.[field] ?? ""
                  }
                  onChange={(v) =>
                    setPlatformConfig({
                      ...platformConfig,
                      linkedin: { ...platformConfig.linkedin!, [field]: v },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Instagram */}
        <div className="border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">Instagram</span>
              <ConnectionStatus
                connected={platformConfig.instagram?.enabled ?? false}
              />
            </div>
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
              Manual posting mode. Content will be prepared and ready to copy.
            </p>
          )}
        </div>

        <SaveButton
          onClick={savePlatformConfig}
          loading={platformSaving}
          saved={platformSaved}
        />
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/* Section 7: Profile Editor */}
      {/* ------------------------------------------------------------------ */}
      <Section title="Profile Editor">
        <div className="space-y-5 mb-4">
          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Display name
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
              Bio facts
            </label>
            <textarea
              value={bioFacts}
              onChange={(e) => setBioFacts(e.target.value)}
              placeholder="Key facts about you..."
              rows={4}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Voice description
            </label>
            <textarea
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="How your content should sound..."
              rows={4}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-text-muted mb-1.5">
              Voice rules
            </label>
            <textarea
              value={voiceRules}
              onChange={(e) => setVoiceRules(e.target.value)}
              placeholder="Hard rules for the AI..."
              rows={3}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-colors resize-none"
            />
          </div>

          {/* Content Pillars */}
          <div>
            <label className="block text-sm text-text-muted mb-3">
              Content pillars
            </label>
            <div className="space-y-4">
              {pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="border border-border rounded-xl p-5 space-y-4"
                  style={{
                    borderLeftColor: pillar.color,
                    borderLeftWidth: 3,
                  }}
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
                    placeholder="AI prompt template for this pillar..."
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
          </div>
        </div>

        <SaveButton
          onClick={saveProfile}
          loading={profileSaving}
          saved={profileSaved}
        />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connection status indicator
// ---------------------------------------------------------------------------

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${
        connected
          ? "bg-green/20 text-green"
          : "bg-surface text-text-muted"
      }`}
    >
      {connected ? "Connected" : "Not configured"}
    </span>
  );
}
