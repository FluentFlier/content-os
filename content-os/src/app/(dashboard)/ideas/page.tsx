"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getInsforge } from "@/lib/insforge/client";
import type { ContentIdea } from "@/lib/types";
import type { Priority } from "@/lib/constants";
import { usePillars } from "@/hooks/usePillars";
import IdeaForm from "@/components/ideas/IdeaForm";
import IdeaRow from "@/components/ideas/IdeaRow";

type FilterMode = "all" | "unconverted" | "converted";

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function IdeasPage() {
  const router = useRouter();
  const { pillars: pillarList, getLabel } = usePillars();

  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Quick-add form state
  const [newIdea, setNewIdea] = useState("");
  const [newPillar, setNewPillar] = useState<string>(pillarList[0]?.value ?? "hot-take");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [adding, setAdding] = useState(false);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterPillar, setFilterPillar] = useState<string | "all">("all");

  // Converting state
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // --- Data fetching ---

  const fetchIdeas = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { data } = await insforge.database
        .from("content_ideas")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (data) setIdeas(data as ContentIdea[]);
    } catch (err) {
      console.error("Failed to fetch ideas", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // --- Sorting and filtering ---

  const filtered = useMemo(() => {
    let list = [...ideas];

    if (filterMode === "unconverted") list = list.filter((i) => !i.converted);
    if (filterMode === "converted") list = list.filter((i) => i.converted);
    if (filterPillar !== "all") list = list.filter((i) => i.pillar === filterPillar);

    list.sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [ideas, filterMode, filterPillar]);

  const unconvertedCount = ideas.filter((i) => !i.converted).length;

  // --- Actions ---

  async function addIdea() {
    const text = newIdea.trim();
    if (!text || !userId) return;

    setAdding(true);

    const optimistic: ContentIdea = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      idea: text,
      pillar: newPillar,
      priority: newPriority,
      notes: null,
      converted: false,
      created_at: new Date().toISOString(),
    };
    setIdeas((prev) => [optimistic, ...prev]);
    setNewIdea("");

    try {
      const insforge = getInsforge();
      await insforge.database.from("content_ideas").insert({
        user_id: userId,
        idea: text,
        pillar: newPillar,
        priority: newPriority,
      });
      await fetchIdeas();
    } catch (err) {
      console.error("Failed to add idea", err);
      setIdeas((prev) => prev.filter((i) => i.id !== optimistic.id));
    } finally {
      setAdding(false);
    }
  }

  async function updateIdeaText(ideaId: string, newText: string) {
    const trimmed = newText.trim();
    if (!trimmed || !userId) return;

    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, idea: trimmed } : i))
    );

    try {
      const insforge = getInsforge();
      await insforge.database
        .from("content_ideas")
        .update({ idea: trimmed, updated_at: new Date().toISOString() })
        .eq("id", ideaId)
        .eq("user_id", userId);
    } catch (err) {
      console.error("Failed to update idea", err);
      await fetchIdeas();
    }
  }

  async function toggleConverted(idea: ContentIdea) {
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === idea.id ? { ...i, converted: !i.converted } : i
      )
    );

    try {
      const insforge = getInsforge();
      await insforge.database
        .from("content_ideas")
        .update({ converted: !idea.converted })
        .eq("id", idea.id);
    } catch (err) {
      console.error("Failed to toggle converted", err);
      await fetchIdeas();
    }
  }

  async function deleteIdea(ideaId: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));

    try {
      const insforge = getInsforge();
      await insforge.database
        .from("content_ideas")
        .delete()
        .eq("id", ideaId)
        .eq("user_id", userId);
    } catch (err) {
      console.error("Failed to delete idea", err);
      await fetchIdeas();
    }
  }

  async function convertToScript(idea: ContentIdea) {
    setConvertingId(idea.id);

    try {
      const pillarLabel = getLabel(idea.pillar);
      const prompt = `Write a short-form video script about: ${idea.idea}\n\nContent pillar: ${pillarLabel}`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generate request failed");

      const { text } = await res.json();

      const insforge = getInsforge();
      await insforge.database
        .from("content_ideas")
        .update({ converted: true })
        .eq("id", idea.id);

      setIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, converted: true } : i))
      );

      const params = new URLSearchParams({
        result: text,
        topic: idea.idea,
        pillar: idea.pillar,
      });
      router.push(`/generate?${params.toString()}`);
    } catch (err) {
      console.error("Failed to convert idea", err);
    } finally {
      setConvertingId(null);
    }
  }

  // --- Render ---

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="font-heading text-[22px] font-[800] text-[#1A1714] leading-[1.2] tracking-[-0.02em]">
          Ideas
        </h1>
        {!loading && ideas.length > 0 && (
          <span className="text-[13px] text-[#8C857D]">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} ({unconvertedCount} unconverted)
          </span>
        )}
      </div>

      {/* Quick add form */}
      <IdeaForm
        value={newIdea}
        pillar={newPillar}
        priority={newPriority}
        adding={adding}
        pillarOptions={pillarList}
        onValueChange={setNewIdea}
        onPillarChange={setNewPillar}
        onPriorityChange={setNewPriority}
        onSubmit={addIdea}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] overflow-hidden">
          {(
            [
              ["all", "All"],
              ["unconverted", "Unconverted"],
              ["converted", "Converted"],
            ] as [FilterMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                filterMode === mode
                  ? "bg-[#FAECE7] text-[#EB5E55]"
                  : "text-[#8C857D] hover:text-[#1A1714]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value)}
          className="bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 rounded-[7px] px-2.5 py-1.5 text-[11px] text-[#1A1714] focus:outline-none focus:border-[#1A1714]/40 transition-colors"
        >
          <option value="all">All pillars</option>
          {pillarList.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ideas list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 bg-[#F4F2EF] rounded-[7px] animate-pulse">
              <div className="w-4 h-4 rounded bg-[#EDECEA] shrink-0" />
              <div className="flex-1 h-4 bg-[#EDECEA] rounded" />
              <div className="w-16 h-5 bg-[#EDECEA] rounded shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-[#8C857D] text-[13px] py-12 text-center">
          {ideas.length === 0
            ? "Nothing queued. Add an idea before you forget it."
            : "No ideas match your filters."}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((idea) => (
            <IdeaRow
              key={idea.id}
              idea={idea}
              onToggleConverted={() => toggleConverted(idea)}
              onUpdateText={(newText) => updateIdeaText(idea.id, newText)}
              onConvertToScript={() => convertToScript(idea)}
              onDelete={() => deleteIdea(idea.id)}
              converting={convertingId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
