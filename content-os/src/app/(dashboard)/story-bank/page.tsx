"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  X,
  Trash2,
  RefreshCw,
  ArrowRightCircle,
  Pickaxe,
} from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type { Pillar, StoryBankEntry } from "@/types/database";
import {
  ALL_PILLARS,
  PILLAR_COLORS,
  PILLAR_LABELS,
} from "@/types/database";

type UsedFilter = "all" | "unused" | "used";

export default function StoryBankPage() {
  const [stories, setStories] = useState<StoryBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");
  const [pillarFilter, setPillarFilter] = useState<Pillar | "all">("all");

  // Expanded card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Action loading states
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [reminingId, setReminingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const { data } = await insforge.database
        .from("story_bank")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      setStories((data as StoryBankEntry[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch story bank", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Filtering
  const filtered = useMemo(() => {
    let result = stories;

    if (usedFilter === "used") result = result.filter((s) => s.used);
    if (usedFilter === "unused") result = result.filter((s) => !s.used);
    if (pillarFilter !== "all")
      result = result.filter((s) => s.pillar === pillarFilter);

    return result;
  }, [stories, usedFilter, pillarFilter]);

  // Convert to post
  const handleConvert = async (story: StoryBankEntry) => {
    if (!userId) return;
    setConvertingId(story.id);
    try {
      const insforge = getInsforge();
      const { data: newPost, error } = await insforge.database
        .from("posts")
        .insert({
          user_id: userId,
          title: story.mined_angle || "From Story Bank",
          pillar: story.pillar || "hot-take",
          script: story.mined_script,
          hook: story.mined_hook,
          caption: story.mined_caption_line,
          status: "scripted",
          platform: "instagram",
        })
        .select()
        .single();

      if (!error && newPost) {
        await insforge.database
          .from("story_bank")
          .update({ used: true, used_post_id: newPost.id })
          .eq("id", story.id);
        await fetchStories();
      }
    } catch (err) {
      console.error("Failed to convert story", err);
    } finally {
      setConvertingId(null);
    }
  };

  // Re-mine
  const handleRemine = async (story: StoryBankEntry) => {
    setReminingId(story.id);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Mine this memory for the strongest Instagram content angle.\nMEMORY: ${story.raw_memory}\nReturn exactly:\nPILLAR: ...\nANGLE: ...\nHOOK: ...\nSCRIPT:\n- (beat 1)\n...\nCTA: ...\nCAPTION LINE: ...\nPLATFORM FIT: ...`,
        }),
      });

      if (!res.ok) throw new Error("Generate API failed");

      const json = await res.json();
      const text: string = json.result || json.text || "";

      // Parse the structured response
      const pillarMatch = text.match(/PILLAR:\s*(.+)/i);
      const angleMatch = text.match(/ANGLE:\s*(.+)/i);
      const hookMatch = text.match(/HOOK:\s*(.+)/i);
      const captionMatch = text.match(/CAPTION LINE:\s*(.+)/i);
      const scriptMatch = text.match(
        /SCRIPT:\s*([\s\S]*?)(?=CTA:|CAPTION LINE:|PLATFORM FIT:|$)/i
      );

      const parsedPillar = pillarMatch
        ? (pillarMatch[1].trim().toLowerCase().replace(/\s+/g, "-") as Pillar)
        : story.pillar;

      const insforge = getInsforge();
      await insforge.database
        .from("story_bank")
        .update({
          mined_angle: angleMatch ? angleMatch[1].trim() : story.mined_angle,
          mined_hook: hookMatch ? hookMatch[1].trim() : story.mined_hook,
          mined_script: scriptMatch
            ? scriptMatch[1].trim()
            : story.mined_script,
          mined_caption_line: captionMatch
            ? captionMatch[1].trim()
            : story.mined_caption_line,
          pillar: ALL_PILLARS.includes(parsedPillar as Pillar)
            ? parsedPillar
            : story.pillar,
        })
        .eq("id", story.id);

      await fetchStories();
    } catch (err) {
      console.error("Failed to re-mine story", err);
    } finally {
      setReminingId(null);
    }
  };

  // Delete
  const handleDelete = async (story: StoryBankEntry) => {
    if (!userId) return;
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeletingId(story.id);
    try {
      const insforge = getInsforge();
      await insforge.database
        .from("story_bank")
        .delete()
        .eq("id", story.id)
        .eq("user_id", userId);
      if (expandedId === story.id) setExpandedId(null);
      await fetchStories();
    } catch (err) {
      console.error("Failed to delete story", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Pillar badge component
  const PillarBadge = ({ pillar }: { pillar: Pillar }) => (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: PILLAR_COLORS[pillar] + "20",
        color: PILLAR_COLORS[pillar],
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: PILLAR_COLORS[pillar] }}
      />
      {PILLAR_LABELS[pillar]}
    </span>
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-surface rounded animate-pulse" />
          <div className="h-9 w-48 bg-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Story Bank
        </h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Used/Unused tabs */}
        <div className="flex items-center bg-bg border border-border rounded-lg overflow-hidden">
          {(["all", "unused", "used"] as UsedFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setUsedFilter(tab)}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                usedFilter === tab
                  ? "bg-surface text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Pillar filter */}
        <div className="relative">
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value as Pillar | "all")}
            className="appearance-none bg-bg border border-border rounded pl-3 pr-7 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral cursor-pointer"
          >
            <option value="all">Pillar: All</option>
            {ALL_PILLARS.map((p) => (
              <option key={p} value={p}>
                Pillar: {PILLAR_LABELS[p]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        </div>

        {/* Count */}
        <span className="text-sm text-text-muted ml-auto">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </span>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Pickaxe className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-muted text-lg mb-2">
            {stories.length === 0
              ? "No stories mined yet."
              : "No stories match your filters."}
          </p>
          {stories.length === 0 && (
            <p className="text-text-muted text-sm">
              Head to Generate &gt; Story Mine to start.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((story) => {
            const isExpanded = expandedId === story.id;
            return (
              <div
                key={story.id}
                className={`bg-surface border border-border rounded-lg transition-all ${
                  story.used ? "opacity-75" : ""
                } ${
                  isExpanded
                    ? "col-span-1 md:col-span-2 lg:col-span-3"
                    : "hover:border-text-muted cursor-pointer"
                }`}
              >
                {/* Card header - always visible */}
                <div
                  className="p-4"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : story.id)
                  }
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-text-muted leading-relaxed">
                      {isExpanded
                        ? story.raw_memory
                        : story.raw_memory.length > 100
                        ? story.raw_memory.slice(0, 100) + "..."
                        : story.raw_memory}
                    </p>
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(null);
                        }}
                        className="shrink-0 p-1 text-text-muted hover:text-text-primary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Mined angle */}
                  {story.mined_angle && (
                    <p className="text-sm font-medium text-coral mb-2">
                      {story.mined_angle}
                    </p>
                  )}

                  {/* Bottom row: pillar + status */}
                  <div className="flex items-center gap-2">
                    {story.pillar && <PillarBadge pillar={story.pillar} />}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        story.used
                          ? "border-green/30 text-green bg-green/10"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {story.used ? "Used" : "Unused"}
                    </span>
                  </div>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full raw memory */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Raw Memory
                        </h4>
                        <p className="text-sm text-text-primary leading-relaxed">
                          {story.raw_memory}
                        </p>
                      </div>

                      {/* Mined angle */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Mined Angle
                        </h4>
                        <p className="text-sm text-coral font-medium">
                          {story.mined_angle || "Not yet mined"}
                        </p>
                      </div>

                      {/* Mined hook */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Mined Hook
                        </h4>
                        <p className="text-sm text-text-primary">
                          {story.mined_hook || "Not yet mined"}
                        </p>
                      </div>

                      {/* Caption line */}
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Caption Line
                        </h4>
                        <p className="text-sm text-text-primary">
                          {story.mined_caption_line || "Not yet mined"}
                        </p>
                      </div>
                    </div>

                    {/* Script - full width */}
                    {story.mined_script && (
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Mined Script
                        </h4>
                        <div className="bg-bg border border-border rounded-lg p-3">
                          {story.mined_script.split("\n").map((line, i) => (
                            <p
                              key={i}
                              className="text-sm text-text-primary leading-relaxed"
                            >
                              {line || "\u00A0"}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pillar badge in expanded */}
                    {story.pillar && (
                      <div>
                        <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Pillar
                        </h4>
                        <PillarBadge pillar={story.pillar} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => handleConvert(story)}
                        disabled={
                          convertingId === story.id || story.used
                        }
                        className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-3 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowRightCircle className="w-4 h-4" />
                        {convertingId === story.id
                          ? "Converting..."
                          : story.used
                          ? "Already Converted"
                          : "Convert to Post"}
                      </button>
                      <button
                        onClick={() => handleRemine(story)}
                        disabled={reminingId === story.id}
                        className="flex items-center gap-1.5 bg-bg border border-border text-text-primary text-sm font-medium px-3 py-1.5 rounded hover:border-text-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            reminingId === story.id ? "animate-spin" : ""
                          }`}
                        />
                        {reminingId === story.id ? "Re-mining..." : "Re-mine"}
                      </button>
                      <button
                        onClick={() => handleDelete(story)}
                        disabled={deletingId === story.id}
                        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1.5 rounded border border-transparent hover:border-red-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === story.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
