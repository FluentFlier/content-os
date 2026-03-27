"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";
import {
  ALL_PILLARS,
  ALL_PLATFORMS,
  PILLAR_COLORS,
  PILLAR_LABELS,
  type Pillar,
  type Platform,
  type ContentPillarConfig,
  type HashtagSet,
} from "@/types/database";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

type TabId =
  | "script"
  | "story-mine"
  | "caption"
  | "hooks"
  | "repurpose"
  | "trend"
  | "comments"
  | "series";

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: "script", label: "Script Generator" },
  { id: "story-mine", label: "Story Mine" },
  { id: "caption", label: "Caption + Hashtags" },
  { id: "hooks", label: "Hook Generator" },
  { id: "repurpose", label: "Repurpose" },
  { id: "trend", label: "Trend Catcher" },
  { id: "comments", label: "Comment Replies" },
  { id: "series", label: "Series Planner" },
];

const PILLAR_PROMPTS: Record<Pillar, string> = {
  "hot-take": `Generate a hot take Reel script.
HOOK: One bold controversial sentence. Stop-scrolling.
ARGUMENT: The actual claim, one sentence.
EVIDENCE: Specific proof or real example, one sentence.
FLIP: What they should do/think instead, one sentence.
CTA: One direct question.
Under 60 seconds. No em dashes.`,
  hackathon: `Generate a hackathon story Reel script. Pick a specific, realistic, dramatic story.
HOOK: Drop into the most intense moment. No setup.
SETUP: 2 bullets -- challenge, stakes.
TURN: 1 bullet -- what changed under pressure.
LESSON: 1 bullet -- what this teaches about building.
CTA: Ask viewers about their own experience.`,
  founder: `Generate a founder-in-public script about building a startup.
HOOK: One honest vulnerable sentence. Real energy, no spin.
REALITY: 2 bullets -- what was hard or went wrong.
PROGRESS: 1 bullet -- one thing that moved.
LESSON: 1 bullet -- what this is teaching about startups.
CTA: Invite builders to share their week.
Sound like Tuesday at 11pm, not a success story.`,
  explainer: `Generate a concept explainer about AI or startups. Under 60 seconds.
HOOK: A question that makes them feel dumb for not knowing.
SIMPLE VERSION: 2 bullets, zero jargon. 16-year-old readable.
WHY IT MATTERS: 1 bullet.
MISCONCEPTION: 1 bullet.
CTA: Ask what to explain next.`,
  origin: `Generate an origin/arc video script.
HOOK: One specific detail that makes someone lean in.
THE PATH: 2 bullets -- the unexpected parts.
THROUGH LINE: 1 bullet -- what actually connects it all.
NOW: 1 bullet -- where it's heading.
CTA: Invite non-linear paths in comments.`,
  research: `Generate a 'research unlocked' video script that makes ML/neuroscience research feel accessible and interesting.
HOOK: One line that makes someone who hates science want to keep watching.
THE WEIRD PART: 2 bullets -- what's genuinely surprising about the research.
WHY IT MATTERS: 1 bullet -- real-world stakes.
THE META LESSON: 1 bullet -- what doing research teaches you that classes don't.
CTA: Ask if they knew this kind of research existed.`,
};

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-text-primary inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="px-3 py-1 text-sm rounded bg-border text-text-primary hover:bg-text-muted/30 transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function OutputBox({
  text,
  loading,
  children,
}: {
  text: string;
  loading: boolean;
  children?: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-3 text-text-muted">
        <Spinner /> Generating...
      </div>
    );
  }
  if (!text) return null;
  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <pre className="whitespace-pre-wrap text-text-primary font-body text-sm leading-relaxed">
        {text}
      </pre>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-coral text-sm mt-2">{msg}</p>;
}

async function callGenerate(prompt: string): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Generation failed");
  }
  const { text } = await res.json();
  return text;
}

/* ------------------------------------------------------------------ */
/*  Save to Library modal                                              */
/* ------------------------------------------------------------------ */

function SaveToLibraryModal({
  open,
  onClose,
  script,
  defaultTitle,
  defaultPillar,
}: {
  open: boolean;
  onClose: () => void;
  script: string;
  defaultTitle?: string;
  defaultPillar?: Pillar;
}) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [pillar, setPillar] = useState<Pillar>(defaultPillar || "hot-take");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle || "");
      setPillar(defaultPillar || "hot-take");
      setError("");
    }
  }, [open, defaultTitle, defaultPillar]);

  if (!open) return null;

  const save = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error("Not logged in");
      const { error: dbError } = await insforge.database
        .from("posts")
        .insert({
          user_id: userData.user.id,
          title: title.trim(),
          pillar,
          script,
          status: "scripted",
          platform,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="font-heading text-lg font-bold text-text-primary">
          Save to Library
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral"
        />
        <div className="flex gap-3">
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value as Pillar)}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-coral"
          >
            {ALL_PILLARS.map((p) => (
              <option key={p} value={p}>
                {PILLAR_LABELS[p]}
              </option>
            ))}
          </select>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-coral"
          >
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 1: Script Generator                                            */
/* ------------------------------------------------------------------ */

function ScriptGeneratorTab() {
  const [pillar, setPillar] = useState<Pillar>("hot-take");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [customPillars, setCustomPillars] = useState<ContentPillarConfig[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const insforge = getInsforge();
        const { data: userData } = await insforge.auth.getCurrentUser();
        if (!userData?.user) return;
        const { data: profile } = await insforge.database
          .from("creator_profiles")
          .select("content_pillars")
          .eq("user_id", userData.user.id)
          .single();
        if (profile?.content_pillars) {
          const pillars =
            typeof profile.content_pillars === "string"
              ? JSON.parse(profile.content_pillars)
              : profile.content_pillars;
          if (Array.isArray(pillars) && pillars.length > 0) {
            setCustomPillars(pillars);
          }
        }
      } catch {
        // fall back to defaults
      }
    })();
  }, []);

  const generate = async () => {
    setLoading(true);
    setError("");
    setOutput("");
    try {
      let prompt: string;
      if (customPillars) {
        const cp = customPillars.find(
          (c) => c.name.toLowerCase().replace(/\s+/g, "-") === pillar
        );
        if (cp?.promptTemplate) {
          prompt = cp.promptTemplate;
        } else {
          prompt = PILLAR_PROMPTS[pillar] || `Write a script for a "${PILLAR_LABELS[pillar]}" post.`;
        }
      } else {
        prompt = PILLAR_PROMPTS[pillar];
      }
      if (topic.trim()) {
        prompt += `\n\nTopic: ${topic.trim()}`;
      }
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Content Pillar
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_PILLARS.map((p) => (
            <button
              key={p}
              onClick={() => setPillar(p)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor:
                  pillar === p ? PILLAR_COLORS[p] : "transparent",
                color: pillar === p ? "#fff" : PILLAR_COLORS[p],
                border: `2px solid ${PILLAR_COLORS[p]}`,
              }}
            >
              {PILLAR_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-text-muted text-sm mb-2">
          Topic (optional)
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          placeholder="Enter a specific topic or leave blank for a general script..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Script"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        <CopyButton text={output} />
        <button
          onClick={() => setShowSave(true)}
          className="px-3 py-1 text-sm rounded bg-border text-text-primary hover:bg-text-muted/30 transition-colors"
        >
          Save to Library
        </button>
      </OutputBox>

      <SaveToLibraryModal
        open={showSave}
        onClose={() => setShowSave(false)}
        script={output}
        defaultPillar={pillar}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 2: Story Mine                                                  */
/* ------------------------------------------------------------------ */

function StoryMineTab() {
  const [memory, setMemory] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [savingStory, setSavingStory] = useState(false);
  const [storySaved, setStorySaved] = useState(false);

  const generate = async () => {
    if (!memory.trim()) {
      setError("Describe a memory first");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    const prompt = `Mine this memory for the strongest Instagram content angle.
MEMORY: ${memory.trim()}
Return exactly:
PILLAR: (hot-take / hackathon / founder / explainer / origin / research)
ANGLE: One sentence -- what makes this interesting to a stranger.
HOOK: Exact first line to say on camera. No setup. Drop in.
SCRIPT:
- (beat 1)
- (beat 2)
- (beat 3)
- (beat 4)
CTA: Closing question.
CAPTION LINE: Just the first line of the Instagram caption (before 'more').
PLATFORM FIT: Best platform for this specific story and why (one sentence).

Use every specific detail from the memory. Never genericize. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
      setStorySaved(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveToStoryBank = async () => {
    setSavingStory(true);
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error("Not logged in");

      // Parse structured output
      const angleMatch = output.match(/ANGLE:\s*(.+)/i);
      const hookMatch = output.match(/HOOK:\s*(.+)/i);
      const captionMatch = output.match(/CAPTION LINE:\s*(.+)/i);
      const pillarMatch = output.match(/PILLAR:\s*(.+)/i);
      const scriptMatch = output.match(/SCRIPT:\s*([\s\S]*?)(?=CTA:|CAPTION|PLATFORM|$)/i);

      const pillarRaw = pillarMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, "-") || null;
      const validPillar = ALL_PILLARS.includes(pillarRaw as Pillar) ? pillarRaw : null;

      const { error: dbError } = await insforge.database
        .from("story_bank")
        .insert({
          user_id: userData.user.id,
          raw_memory: memory.trim(),
          mined_angle: angleMatch?.[1]?.trim() || null,
          mined_hook: hookMatch?.[1]?.trim() || null,
          mined_script: scriptMatch?.[1]?.trim() || null,
          mined_caption_line: captionMatch?.[1]?.trim() || null,
          pillar: validPillar,
          used: false,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      setStorySaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingStory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Describe any memory or experience.
        </label>
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          rows={6}
          placeholder="A hackathon moment. Something that happened while building. The day you almost quit. Anything that felt real."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
        <p className="text-text-muted text-xs mt-1">
          A hackathon moment. Something that happened while building. The day
          you almost quit. Anything that felt real.
        </p>
      </div>

      <button
        onClick={generate}
        disabled={loading || !memory.trim()}
        className="px-6 py-2.5 rounded-lg bg-yellow text-bg font-semibold hover:bg-yellow/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Mining..." : "Mine It"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        <CopyButton text={output} />
        <button
          onClick={saveToStoryBank}
          disabled={savingStory || storySaved}
          className="px-3 py-1 text-sm rounded bg-border text-text-primary hover:bg-text-muted/30 transition-colors disabled:opacity-50"
        >
          {storySaved
            ? "Saved to Story Bank"
            : savingStory
              ? "Saving..."
              : "Save to Story Bank"}
        </button>
        <button
          onClick={() => setShowSave(true)}
          className="px-3 py-1 text-sm rounded bg-border text-text-primary hover:bg-text-muted/30 transition-colors"
        >
          Convert to Post
        </button>
      </OutputBox>

      <SaveToLibraryModal
        open={showSave}
        onClose={() => setShowSave(false)}
        script={output}
        defaultTitle=""
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 3: Caption + Hashtags                                          */
/* ------------------------------------------------------------------ */

function CaptionHashtagsTab() {
  const [script, setScript] = useState("");
  const [useSaved, setUseSaved] = useState(false);
  const [savedSets, setSavedSets] = useState<HashtagSet[]>([]);
  const [selectedSet, setSelectedSet] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveSetName, setSaveSetName] = useState("");
  const [savingSet, setSavingSet] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const insforge = getInsforge();
        const { data: userData } = await insforge.auth.getCurrentUser();
        if (!userData?.user) return;
        const { data } = await insforge.database
          .from("hashtag_sets")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });
        if (data) setSavedSets(data);
      } catch {
        // ignore
      }
    })();
  }, []);

  const generate = async () => {
    if (!script.trim()) {
      setError("Enter a script or video idea");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");

    let prompt: string;
    if (useSaved && selectedSet) {
      const set = savedSets.find((s) => s.id === selectedSet);
      prompt = `Write an Instagram caption for this video.
VIDEO: ${script.trim()}
CAPTION: 2-4 sentences. First line is the hook shown before 'more'. Raw, honest voice. No em dashes. Direct question at the end to drive comments.

Use these hashtags: ${set?.tags || ""}

Return caption, then blank line, then hashtags.`;
    } else {
      prompt = `Write an Instagram caption and hashtag set.
VIDEO: ${script.trim()}
CAPTION: 2-4 sentences. First line is the hook shown before 'more'. Raw, honest voice. No em dashes. Direct question at the end to drive comments.
HASHTAGS: 20-25 hashtags. Mix niche (hackathons, startups, AI, founder, research, accessibility), personal brand, and broad reach. One line, space-separated.
No labels. Just caption, blank line, hashtags.`;
    }

    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // Split output into caption and hashtags
  const parts = output.split(/\n\s*\n/);
  const caption = parts.length > 1 ? parts.slice(0, -1).join("\n\n") : output;
  const hashtags =
    parts.length > 1
      ? parts[parts.length - 1]
      : "";

  const saveHashtagSet = async () => {
    if (!saveSetName.trim() || !hashtags.trim()) return;
    setSavingSet(true);
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error("Not logged in");
      const { error: dbError } = await insforge.database
        .from("hashtag_sets")
        .insert({
          user_id: userData.user.id,
          name: saveSetName.trim(),
          tags: hashtags.trim(),
          use_count: 0,
        })
        .select()
        .single();
      if (dbError) throw dbError;
      setSaveSetName("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save set");
    } finally {
      setSavingSet(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Script or video idea
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={5}
          placeholder="Paste your script or describe the video idea..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-text-primary text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={useSaved}
            onChange={(e) => setUseSaved(e.target.checked)}
            className="accent-coral"
          />
          Use saved hashtag set
        </label>
        {useSaved && savedSets.length > 0 && (
          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-coral"
          >
            <option value="">Select a set</option>
            {savedSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={generate}
        disabled={loading || !script.trim()}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        {caption && <CopyButton text={caption} />}
        {hashtags && (
          <CopyButton text={hashtags} />
        )}
      </OutputBox>

      {hashtags && (
        <div className="flex gap-2 items-center">
          <input
            value={saveSetName}
            onChange={(e) => setSaveSetName(e.target.value)}
            placeholder="Set name"
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-coral"
          />
          <button
            onClick={saveHashtagSet}
            disabled={savingSet || !saveSetName.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-border text-text-primary hover:bg-text-muted/30 transition-colors disabled:opacity-50"
          >
            {savingSet ? "Saving..." : "Save Hashtag Set"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 4: Hook Generator                                              */
/* ------------------------------------------------------------------ */

function HookGeneratorTab() {
  const [topic, setTopic] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    setHooks([]);
    const topicStr = topic.trim() || "hackathons, AI, startups, building, research";
    const prompt = `Generate 8 Instagram hooks for: ${topicStr}.
One sentence each. First word must stop the scroll.
Mix styles:
- Stat-based: 'I've won 15 hackathons. Here's the one thing that never changes.'
- Contrarian: 'The job market isn't broken. You are.'
- Story-drop: 'At 3am during my 20th hackathon I realized I'd been building wrong.'
- Challenge: 'You're not struggling to get hired because of AI.'
- Curiosity: 'Nobody told me undergrad research would feel like this.'
- Vulnerability: 'I shipped to 250 people and almost shut it down the same week.'
Numbered 1-8. One per line. No explanation. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      const lines = text
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => /^\d/.test(l))
        .map((l: string) => l.replace(/^\d+[\.\)]\s*/, ""));
      setHooks(lines.length > 0 ? lines : [text]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Topic (optional)
        </label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Leave blank for general hooks or enter a topic..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate 8 Hooks"}
      </button>

      <ErrorMsg msg={error} />

      {loading && (
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-3 text-text-muted">
          <Spinner /> Generating...
        </div>
      )}

      {hooks.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
          {hooks.map((hook, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
            >
              <p className="text-text-primary text-sm flex-1">
                <span className="text-text-muted font-semibold mr-2">
                  {i + 1}.
                </span>
                {hook}
              </p>
              <CopyButton text={hook} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 5: Repurpose                                                   */
/* ------------------------------------------------------------------ */

function RepurposeTab() {
  const [script, setScript] = useState("");
  const [fromPlatform, setFromPlatform] = useState<Platform>("instagram");
  const [toPlatform, setToPlatform] = useState<Platform>("linkedin");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!script.trim()) {
      setError("Paste a script first");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    const prompt = `Repurpose this ${fromPlatform} content for ${toPlatform}.

ORIGINAL SCRIPT:
${script.trim()}

Adapt the length, format, tone, CTA style, and structure for ${toPlatform}.
${toPlatform === "linkedin" ? "LinkedIn: longer, more reflective, professional but still raw." : ""}
${toPlatform === "twitter" ? "Twitter/X: punchy, thread-structured if needed, strong opening." : ""}
${toPlatform === "threads" ? "Threads: conversational, relatable, personal." : ""}
${toPlatform === "instagram" ? "Instagram: short, visual, hook-first, strong CTA." : ""}
No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Paste script
        </label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={6}
          placeholder="Paste the script you want to repurpose..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-text-muted text-xs mb-1">From</label>
          <select
            value={fromPlatform}
            onChange={(e) => setFromPlatform(e.target.value as Platform)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-coral"
          >
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-text-muted text-xs mb-1">To</label>
          <select
            value={toPlatform}
            onChange={(e) => setToPlatform(e.target.value as Platform)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-coral"
          >
            {ALL_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={generate}
        disabled={loading || !script.trim()}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Repurposing..." : "Repurpose"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        <CopyButton text={output} />
      </OutputBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 6: Trend Catcher                                               */
/* ------------------------------------------------------------------ */

function TrendCatcherTab() {
  const [trend, setTrend] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!trend.trim()) {
      setError("Describe the trending topic first");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    const prompt = `A trend or topic is happening: ${trend.trim()}.
Find the creator's specific, earned angle on it. They should not comment on trends without a personal connection.
Return:
ANGLE: Their specific POV on this (one sentence)
CONNECTION: What from their actual experience gives them the right to speak on this
HOOK: First line on camera
SCRIPT OUTLINE:
- (beat 1)
- (beat 2)
- (beat 3)
CTA: Closing question
AVOID: What would make this feel generic or unearned

No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Trending topic or moment
        </label>
        <textarea
          value={trend}
          onChange={(e) => setTrend(e.target.value)}
          rows={4}
          placeholder="Paste or describe a trending topic in tech or culture..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading || !trend.trim()}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Finding angle..." : "Find My Angle"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        <CopyButton text={output} />
      </OutputBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 7: Comment Replies                                             */
/* ------------------------------------------------------------------ */

function CommentRepliesTab() {
  const [comments, setComments] = useState("");
  const [replies, setReplies] = useState<string[]>([]);
  const [rawOutput, setRawOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!comments.trim()) {
      setError("Paste some comments first");
      return;
    }
    setLoading(true);
    setError("");
    setReplies([]);
    setRawOutput("");
    const prompt = `Write replies to these Instagram comments in the creator's voice. Raw, direct, like texting a friend. Short. Engage genuinely. Ask a follow-up question when natural. No em dashes. Never sound like a brand.
COMMENTS: ${comments.trim()}
Return each reply labeled Comment 1 Reply, Comment 2 Reply, etc.`;
    try {
      const text = await callGenerate(prompt);
      setRawOutput(text);
      // Parse replies
      const replyBlocks = text
        .split(/Comment\s*\d+\s*Reply[:\s]*/i)
        .filter((b: string) => b.trim());
      setReplies(replyBlocks.map((b: string) => b.trim()));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Paste 5-10 comments
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={8}
          placeholder="Paste comments from your post, one per line..."
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral resize-none"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading || !comments.trim()}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Replies"}
      </button>

      <ErrorMsg msg={error} />

      {loading && (
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-3 text-text-muted">
          <Spinner /> Generating...
        </div>
      )}

      {replies.length > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-3">
          {replies.map((reply, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
            >
              <p className="text-text-primary text-sm flex-1">
                <span className="text-text-muted font-semibold mr-2">
                  Reply {i + 1}:
                </span>
                {reply}
              </p>
              <CopyButton text={reply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TAB 8: Series Planner                                              */
/* ------------------------------------------------------------------ */

function SeriesPlannerTab() {
  const [concept, setConcept] = useState("");
  const [numParts, setNumParts] = useState(5);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!concept.trim()) {
      setError("Enter a series concept");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    setSaved(false);
    const prompt = `Plan a ${numParts}-part Instagram content series on: ${concept.trim()}.
For each part:
PART [n]:
TITLE: (punchy episode title)
HOOK: (first line on camera)
CORE POINT: (what this part establishes -- one sentence)
CLIFFHANGER/BRIDGE: (how this part makes them want the next one)

Series rules: each part works standalone but rewards watching all. Part 1 must be the strongest hook. Build toward a payoff. No em dashes.`;
    try {
      const text = await callGenerate(prompt);
      setOutput(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveSeries = async () => {
    if (!output) return;
    setSaving(true);
    setError("");
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) throw new Error("Not logged in");

      // Insert series
      const { data: series, error: seriesErr } = await insforge.database
        .from("series")
        .insert({
          user_id: userData.user.id,
          name: concept.trim(),
          description: output,
          pillar: "explainer" as Pillar,
          total_parts: numParts,
        })
        .select()
        .single();
      if (seriesErr) throw seriesErr;

      // Parse parts and create post entries
      const partRegex = /PART\s*\[?(\d+)\]?[:\s]*\n?TITLE:\s*(.+)/gi;
      let match;
      const posts: Array<{
        user_id: string;
        title: string;
        pillar: Pillar;
        status: string;
        platform: Platform;
        script: string;
        series_id: string;
        series_position: number;
      }> = [];

      while ((match = partRegex.exec(output)) !== null) {
        const partNum = parseInt(match[1], 10);
        const title = match[2].trim();
        // Extract the full part section
        const partStart = match.index;
        const nextPartIdx = output.indexOf("PART", partStart + 5);
        const partText =
          nextPartIdx > 0
            ? output.slice(partStart, nextPartIdx).trim()
            : output.slice(partStart).trim();

        posts.push({
          user_id: userData.user.id,
          title: `${concept.trim()} - ${title}`,
          pillar: "explainer",
          status: "idea",
          platform: "instagram",
          script: partText,
          series_id: series.id,
          series_position: partNum,
        });
      }

      if (posts.length > 0) {
        const { error: postsErr } = await insforge.database
          .from("posts")
          .insert(posts);
        if (postsErr) throw postsErr;
      }

      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save series");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-text-muted text-sm mb-2">
          Series concept
        </label>
        <input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="What is this series about?"
          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-coral"
        />
      </div>

      <div>
        <label className="block text-text-muted text-sm mb-2">
          Number of parts
        </label>
        <input
          type="number"
          min={2}
          max={10}
          value={numParts}
          onChange={(e) =>
            setNumParts(
              Math.min(10, Math.max(2, parseInt(e.target.value, 10) || 2))
            )
          }
          className="w-24 bg-bg border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-coral"
        />
      </div>

      <button
        onClick={generate}
        disabled={loading || !concept.trim()}
        className="px-6 py-2.5 rounded-lg bg-coral text-white font-semibold hover:bg-coral/80 transition-colors disabled:opacity-50"
      >
        {loading ? "Planning..." : "Plan Series"}
      </button>

      <ErrorMsg msg={error} />

      <OutputBox text={output} loading={loading}>
        <CopyButton text={output} />
        <button
          onClick={saveSeries}
          disabled={saving || saved}
          className="px-3 py-1 text-sm rounded bg-border text-text-primary hover:bg-text-muted/30 transition-colors disabled:opacity-50"
        >
          {saved ? "Series Saved" : saving ? "Saving..." : "Save Series"}
        </button>
      </OutputBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Generate page                                                 */
/* ------------------------------------------------------------------ */

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Generate
          </h1>
          <div className="bg-surface border border-border rounded-xl p-6 text-text-muted">
            Loading...
          </div>
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const tabParam = searchParams.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.find((t) => t.id === tabParam)?.id || "script"
  );

  // Sync URL with active tab
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", activeTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [activeTab, searchParams, router]);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabBarRef.current) return;
    const activeEl = tabBarRef.current.querySelector(
      `[data-tab="${activeTab}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const renderTab = () => {
    switch (activeTab) {
      case "script":
        return <ScriptGeneratorTab />;
      case "story-mine":
        return <StoryMineTab />;
      case "caption":
        return <CaptionHashtagsTab />;
      case "hooks":
        return <HookGeneratorTab />;
      case "repurpose":
        return <RepurposeTab />;
      case "trend":
        return <TrendCatcherTab />;
      case "comments":
        return <CommentRepliesTab />;
      case "series":
        return <SeriesPlannerTab />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">
        Generate
      </h1>

      {/* Tab bar */}
      <div
        ref={tabBarRef}
        className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors shrink-0 ${
              activeTab === tab.id
                ? "border-coral text-coral"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-surface border border-border rounded-xl p-4 md:p-6">
        {renderTab()}
      </div>
    </div>
  );
}
