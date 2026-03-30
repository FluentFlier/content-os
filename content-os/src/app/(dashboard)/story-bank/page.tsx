"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pickaxe } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getInsforge } from "@/lib/insforge/client";
import type { StoryBankEntry } from "@/lib/types";
import { usePillars } from "@/hooks/usePillars";
import StoryGrid from "@/components/story-bank/StoryGrid";

type UsedFilter = "all" | "unused" | "used";

export default function StoryBankPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { pillars: pillarList, pillarValues } = usePillars();
  const [stories, setStories] = useState<StoryBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filters
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");
  const [pillarFilter, setPillarFilter] = useState<string | "all">("all");

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

  // Convert to post via API routes
  const handleConvert = async (story: StoryBankEntry) => {
    if (!userId) return;
    setConvertingId(story.id);
    try {
      // Create post via API route
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: story.mined_angle || "From Story Bank",
          pillar: story.pillar || "hot-take",
          script: story.mined_script,
          hook: story.mined_hook,
          caption: story.mined_caption_line,
          status: "scripted",
          platform: "instagram",
        }),
      });

      if (!postRes.ok) {
        const body = await postRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create post");
      }

      const { post: newPost } = await postRes.json();

      // Mark story as used via API route
      if (newPost?.id) {
        const patchRes = await fetch(`/api/story-bank/${story.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ used: true, used_post_id: newPost.id }),
        });

        if (!patchRes.ok) {
          const patchBody = await patchRes.json().catch(() => ({}));
          toast(patchBody.error || "Failed to mark story as used", "error");
          return;
        }
      }

      toast("Post created");
      await fetchStories();
    } catch (err) {
      console.error("Failed to convert story", err);
      toast("Failed to convert story", "error");
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

      const pillarMatch = text.match(/PILLAR:\s*(.+)/i);
      const angleMatch = text.match(/ANGLE:\s*(.+)/i);
      const hookMatch = text.match(/HOOK:\s*(.+)/i);
      const captionMatch = text.match(/CAPTION LINE:\s*(.+)/i);
      const scriptMatch = text.match(
        /SCRIPT:\s*([\s\S]*?)(?=CTA:|CAPTION LINE:|PLATFORM FIT:|$)/i
      );

      const parsedPillar = pillarMatch
        ? pillarMatch[1].trim().toLowerCase().replace(/\s+/g, "-")
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
          pillar: parsedPillar && pillarValues.includes(parsedPillar)
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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-[#F4F2EF] rounded-[7px] animate-pulse" />
          <div className="h-9 w-48 bg-[#F4F2EF] rounded-[7px] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-[#F4F2EF] rounded-[12px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-[22px] font-[800] text-[#1A1714] leading-[1.2] tracking-[-0.02em]">
          Story Bank
        </h1>
        <a
          href="/generate?tab=story-mine"
          className="flex items-center gap-1.5 bg-[#EB5E55] text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] hover:opacity-90 transition-opacity"
        >
          <Pickaxe className="w-4 h-4" />
          Mine a Story
        </a>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] overflow-hidden">
          {(["all", "unused", "used"] as UsedFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setUsedFilter(tab)}
              className={`px-3 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                usedFilter === tab
                  ? "bg-[#FAFAF8] text-[#1A1714]"
                  : "text-[#8C857D] hover:text-[#1A1714]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value)}
            className="appearance-none bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] pl-3 pr-7 py-1.5 text-[13px] text-[#1A1714] focus:outline-none focus:border-[#1A1714]/40 cursor-pointer transition-colors"
          >
            <option value="all">Pillar: All</option>
            {pillarList.map((p) => (
              <option key={p.value} value={p.value}>
                Pillar: {p.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C857D] pointer-events-none" />
        </div>

        <span className="text-[13px] text-[#8C857D] ml-auto">
          {filtered.length} {filtered.length === 1 ? "story" : "stories"}
        </span>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Pickaxe className="w-12 h-12 text-[#8C857D] mb-4" />
          <p className="text-[#8C857D] text-[13px] mb-2">
            {stories.length === 0
              ? "Mine your first memory. The best content comes from real moments."
              : "No stories match your filters."}
          </p>
        </div>
      ) : (
        <StoryGrid
          stories={filtered}
          expandedId={expandedId}
          onToggleExpand={(id) =>
            setExpandedId(expandedId === id ? null : id)
          }
          onConvert={handleConvert}
          onRemine={handleRemine}
          onDelete={handleDelete}
          convertingId={convertingId}
          reminingId={reminingId}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
