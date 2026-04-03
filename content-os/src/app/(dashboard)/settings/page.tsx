"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";
import type { ContentPillarConfig, PlatformConfig, CreatorProfile, UserSetting } from "@/types/database";
import type { Platform } from "@/lib/constants";
import { Loader2 } from "lucide-react";

import ContextEditor from "@/components/settings/ContextEditor";
import PillarWeights from "@/components/settings/PillarWeights";
import WeeklySchedule from "@/components/settings/WeeklySchedule";
import PlatformDefaults from "@/components/settings/PlatformDefaults";
import BioGenerator from "@/components/settings/BioGenerator";
import PlatformConnections from "@/components/settings/PlatformConnections";
import ProfileEditor from "@/components/settings/ProfileEditor";
import AutoOptimizeToggle from "@/components/settings/AutoOptimizeToggle";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface BioCard {
  platform: string;
  bio: string;
  limit: number;
}

interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  connected_at: string;
  connection_method?: string | null;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6">
      <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA] mb-4">{title}</h2>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main settings page                                                 */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'connections', label: 'Connections' },
  { id: 'profile', label: 'Profile' },
  { id: 'content', label: 'Content' },
  { id: 'tools', label: 'Tools' },
] as const;

type SettingsTab = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'connections';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Section 1: Context
  const [contextAdditions, setContextAdditions] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);

  // Section 2: Pillar weights
  const [pillarWeights, setPillarWeights] = useState<Record<string, number>>({});
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

  // Section 6: Platform connections
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    instagram: { accessToken: "", igUserId: "", enabled: false },
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
    threads: { accessToken: "", threadsUserId: "", enabled: false },
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

  // Section 8: Auto-Optimize
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [autoOptimizeSaving, setAutoOptimizeSaving] = useState(false);
  const [autoOptimizeSaved, setAutoOptimizeSaved] = useState(false);

  // Connected Accounts (OAuth)
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  /* ---- Helpers ---- */

  const flashSaved = useCallback((setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }, []);

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

  /* ---- Load data ---- */

  useEffect(() => {
    async function load() {
      try {
        const insforge = getInsforge();
        const { data: userData } = await insforge.auth.getCurrentUser();
        const uid = userData?.user?.id;
        if (!uid) return;
        setUserId(uid);

        const [settingsRes, profileRes, socialRes] = await Promise.all([
          insforge.database
            .from("user_settings")
            .select("*")
            .eq("user_id", uid),
          insforge.database
            .from("creator_profile")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle(),
          fetch("/api/social-accounts").then((r) => r.ok ? r.json() : { accounts: [] }),
        ]);

        setConnectedAccounts(socialRes.accounts ?? []);

        const settings: UserSetting[] = settingsRes.data ?? [];
        const prof: CreatorProfile | null = profileRes.data;

        for (const s of settings) {
          if (s.key === "context_additions") {
            setContextAdditions(s.value);
          } else if (s.key === "pillar_weights") {
            try {
              setPillarWeights(JSON.parse(s.value));
            } catch { /* ignore parse errors */ }
          } else if (s.key === "weekly_schedule") {
            try {
              setWeeklySchedule((prev) => ({ ...prev, ...JSON.parse(s.value) }));
            } catch { /* ignore parse errors */ }
          } else if (s.key === "platform_defaults") {
            try {
              const parsed = JSON.parse(s.value);
              if (parsed.defaultPlatform) setDefaultPlatform(parsed.defaultPlatform);
              if (parsed.crossPostReminders !== undefined)
                setCrossPostReminders(parsed.crossPostReminders);
            } catch { /* ignore parse errors */ }
          } else if (s.key === "auto_optimize_on_save") {
            setAutoOptimize(s.value === "true");
          }
        }

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

  /* ---- Save handlers ---- */

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

  async function saveAutoOptimize() {
    setAutoOptimizeSaving(true);
    await upsertSetting("auto_optimize_on_save", String(autoOptimize));
    setAutoOptimizeSaving(false);
    flashSaved(setAutoOptimizeSaved);
  }

  async function savePlatformConfig() {
    if (!userId) return;
    setPlatformSaving(true);
    const insforge = getInsforge();
    await insforge.database
      .from("creator_profile")
      .upsert(
        {
          user_id: userId,
          display_name: displayName || "Creator",
          platform_config: JSON.stringify(platformConfig),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    setPlatformSaving(false);
    flashSaved(setPlatformSaved);
  }

  async function saveProfile() {
    if (!userId) return;
    setProfileSaving(true);
    const insforge = getInsforge();
    await insforge.database
      .from("creator_profile")
      .upsert(
        {
          user_id: userId,
          display_name: displayName || "Creator",
          bio_facts: bioFacts,
          voice_description: voiceDescription,
          voice_rules: voiceRules,
          content_pillars: JSON.stringify(pillars),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    setProfileSaving(false);
    flashSaved(setProfileSaved);
  }

  /* ---- Connected accounts ---- */

  async function refreshAccounts() {
    try {
      const res = await fetch("/api/social-accounts");
      if (res.ok) {
        const data = await res.json();
        setConnectedAccounts(data.accounts ?? []);
      }
    } catch {
      // silently fail
    }
  }

  async function disconnectAccount(platform: string) {
    setDisconnecting(platform);
    try {
      const res = await fetch(`/api/social-accounts/${platform}`, { method: "DELETE" });
      if (res.ok) {
        setConnectedAccounts((prev) => prev.filter((a) => a.platform !== platform));
      }
    } catch {
      // silently fail
    } finally {
      setDisconnecting(null);
    }
  }

  function connectAccount(platform: string) {
    const w = 600;
    const h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      `/api/social-accounts/connect/${platform}`,
      `connect_${platform}`,
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (popup) {
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          fetch("/api/social-accounts")
            .then((r) => r.ok ? r.json() : { accounts: [] })
            .then((data) => setConnectedAccounts(data.accounts ?? []));
        }
      }, 500);
    }
  }

  /* ---- Bio generator ---- */

  async function generateBios() {
    setBioGenerating(true);
    setBios([]);

    try {
      const name = profile?.display_name ?? displayName;
      const prompt = `Write optimized profile bios for ${name} for Instagram, LinkedIn, X (Twitter), and Threads. Character limits: Instagram 150, LinkedIn 220, X 160, Threads 150. Bio must convey the key facts from their profile. Voice: punchy, specific, no fluff.\n\nProfile facts: ${bioFacts}\n\nReturn ONLY a JSON array with objects like: [{"platform":"Instagram","bio":"...","limit":150},{"platform":"LinkedIn","bio":"...","limit":220},{"platform":"X (Twitter)","bio":"...","limit":160},{"platform":"Threads","bio":"...","limit":150}]`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const { text } = await res.json();
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

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[#71717A]" />
      </div>
    );
  }

  const pillarOptions = pillars.map((p) => p.name).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-0 sm:px-4 py-8 space-y-6">
      <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">
        Settings
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#18181B] rounded-[10px] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-[7px] text-[13px] font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#27272A] text-[#FAFAFA]'
                : 'text-[#71717A] hover:text-[#A1A1AA]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'connections' && (
        <>
          <Section title="Platform Connections">
            <PlatformConnections
              connectedAccounts={connectedAccounts}
              onConnect={connectAccount}
              onDisconnect={disconnectAccount}
              disconnecting={disconnecting}
              onAccountsRefresh={refreshAccounts}
            />
          </Section>

          <Section title="Platform Defaults">
            <PlatformDefaults
              defaultPlatform={defaultPlatform}
              onDefaultPlatformChange={setDefaultPlatform}
              crossPostReminders={crossPostReminders}
              onCrossPostRemindersChange={setCrossPostReminders}
              onSave={savePlatformDefaults}
              saving={platformDefaultsSaving}
              saved={platformDefaultsSaved}
            />
          </Section>
        </>
      )}

      {activeTab === 'profile' && (
        <>
          <Section title="Profile Editor">
            <ProfileEditor
              displayName={displayName}
              onDisplayNameChange={setDisplayName}
              bioFacts={bioFacts}
              onBioFactsChange={setBioFacts}
              voiceDescription={voiceDescription}
              onVoiceDescriptionChange={setVoiceDescription}
              voiceRules={voiceRules}
              onVoiceRulesChange={setVoiceRules}
              pillars={pillars}
              onPillarsChange={setPillars}
              onSave={saveProfile}
              saving={profileSaving}
              saved={profileSaved}
            />
          </Section>

          <Section title="Personal Context">
            <ContextEditor
              contextAdditions={contextAdditions}
              onContextChange={setContextAdditions}
              onSave={saveContext}
              saving={contextSaving}
              saved={contextSaved}
            />
          </Section>
        </>
      )}

      {activeTab === 'content' && (
        <>
          <Section title="Pillar Weights">
            <PillarWeights
              pillars={pillars}
              pillarWeights={pillarWeights}
              onWeightChange={setPillarWeights}
              onSave={savePillarWeights}
              saving={weightsSaving}
              saved={weightsSaved}
            />
          </Section>

          <Section title="Weekly Schedule Template">
            <WeeklySchedule
              weeklySchedule={weeklySchedule}
              onScheduleChange={setWeeklySchedule}
              pillarOptions={pillarOptions}
              onSave={saveWeeklySchedule}
              saving={scheduleSaving}
              saved={scheduleSaved}
            />
          </Section>

          <Section title="Auto-Optimize">
            <AutoOptimizeToggle
              enabled={autoOptimize}
              onChange={setAutoOptimize}
              onSave={saveAutoOptimize}
              saving={autoOptimizeSaving}
              saved={autoOptimizeSaved}
            />
          </Section>
        </>
      )}

      {activeTab === 'tools' && (
        <Section title="Profile Bio Generator">
          <BioGenerator
            bioGenerating={bioGenerating}
            bios={bios}
            onGenerate={generateBios}
            onBiosChange={setBios}
          />
        </Section>
      )}
    </div>
  );
}
