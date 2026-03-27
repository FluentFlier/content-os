"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Wand2, Trash2, Plus } from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import {
  type ContentIdea,
  type Pillar,
  type Priority,
  ALL_PILLARS,
  PILLAR_COLORS,
  PILLAR_LABELS,
} from "@/types/database";

type FilterMode = "all" | "unconverted" | "converted";

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-coral/20 text-coral",
  medium: "bg-yellow/20 text-yellow",
  low: "bg-text-muted/20 text-text-muted",
};

export default function IdeasPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Quick-add form state
  const [newIdea, setNewIdea] = useState("");
  const [newPillar, setNewPillar] = useState<Pillar>("hot-take");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [adding, setAdding] = useState(false);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [filterPillar, setFilterPillar] = useState<Pillar | "all">("all");

  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

    // Optimistic insert
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
    inputRef.current?.focus();

    try {
      const insforge = getInsforge();
      await insforge.database.from("content_ideas").insert({
        user_id: userId,
        idea: text,
        pillar: newPillar,
        priority: newPriority,
      });
      // Re-fetch to get real id
      await fetchIdeas();
    } catch (err) {
      console.error("Failed to add idea", err);
      // Roll back optimistic insert
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
    setEditingId(null);

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
    setConfirmDeleteId(null);

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
      const pillarLabel = PILLAR_LABELS[idea.pillar];
      const prompt = `Write a short-form video script about: ${idea.idea}\n\nContent pillar: ${pillarLabel}`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Generate request failed");

      const { text } = await res.json();

      // Mark as converted
      const insforge = getInsforge();
      await insforge.database
        .from("content_ideas")
        .update({ converted: true })
        .eq("id", idea.id);

      setIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, converted: true } : i))
      );

      // Navigate to generate page with result
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
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Ideas
        </h1>
        {!loading && ideas.length > 0 && (
          <span className="text-sm text-text-muted">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""} ({unconvertedCount} unconverted)
          </span>
        )}
      </div>

      {/* Quick add form */}
      <div className="sticky top-0 z-10 bg-surface border border-border rounded-xl p-4 space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                addIdea();
              }
            }}
            placeholder="Capture an idea..."
            className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-coral"
          />
          <button
            onClick={addIdea}
            disabled={adding || !newIdea.trim()}
            className="flex items-center gap-1.5 bg-coral hover:bg-coral/90 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pillar selector */}
          <select
            value={newPillar}
            onChange={(e) => setNewPillar(e.target.value as Pillar)}
            className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
          >
            {ALL_PILLARS.map((p) => (
              <option key={p} value={p}>
                {PILLAR_LABELS[p]}
              </option>
            ))}
          </select>

          {/* Priority pills */}
          <div className="flex gap-1">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  newPriority === p
                    ? PRIORITY_STYLES[p]
                    : "bg-bg text-text-muted hover:text-text-primary"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-surface border border-border rounded-lg overflow-hidden">
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
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterMode === mode
                  ? "bg-coral/20 text-coral"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value as Pillar | "all")}
          className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
        >
          <option value="all">All pillars</option>
          {ALL_PILLARS.map((p) => (
            <option key={p} value={p}>
              {PILLAR_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {/* Ideas list */}
      {loading ? (
        <div className="text-text-muted text-sm py-12 text-center">
          Loading ideas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-text-muted text-sm py-12 text-center">
          {ideas.length === 0
            ? "No ideas yet. Start capturing!"
            : "No ideas match your filters."}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((idea) => (
            <div
              key={idea.id}
              className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors ${
                idea.converted ? "opacity-50" : ""
              }`}
            >
              {/* Converted toggle */}
              <button
                onClick={() => toggleConverted(idea)}
                className={`mt-0.5 w-4 h-4 rounded border shrink-0 transition-colors ${
                  idea.converted
                    ? "bg-green border-green"
                    : "border-border hover:border-text-muted"
                }`}
                title={idea.converted ? "Mark unconverted" : "Mark converted"}
              >
                {idea.converted && (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M3.5 8.5l3 3 6-6" />
                  </svg>
                )}
              </button>

              {/* Idea text */}
              <div className="flex-1 min-w-0">
                {editingId === idea.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => updateIdeaText(idea.id, editText)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        updateIdeaText(idea.id, editText);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full bg-bg border border-border rounded px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-coral"
                  />
                ) : (
                  <p
                    onClick={() => {
                      setEditingId(idea.id);
                      setEditText(idea.idea);
                    }}
                    className={`text-sm text-text-primary cursor-text ${
                      idea.converted ? "line-through" : ""
                    }`}
                  >
                    {idea.idea}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: `${PILLAR_COLORS[idea.pillar]}20`,
                      color: PILLAR_COLORS[idea.pillar],
                    }}
                  >
                    {PILLAR_LABELS[idea.pillar]}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${PRIORITY_STYLES[idea.priority]}`}
                  >
                    {idea.priority}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => convertToScript(idea)}
                  disabled={convertingId === idea.id}
                  title="Convert to Script"
                  className="p-1.5 rounded-md text-text-muted hover:text-purple hover:bg-purple/10 transition-colors disabled:animate-pulse"
                >
                  <Wand2 size={15} />
                </button>

                {confirmDeleteId === idea.id ? (
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="px-2 py-1 rounded-md text-[11px] font-medium bg-coral/20 text-coral hover:bg-coral/30 transition-colors"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(idea.id)}
                    title="Delete"
                    className="p-1.5 rounded-md text-text-muted hover:text-coral hover:bg-coral/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
