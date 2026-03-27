"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import StatusBadge from "@/components/StatusBadge";
import PillarDot from "@/components/PillarDot";
import {
  type Series,
  type Post,
  type Pillar,
  PILLAR_COLORS,
  PILLAR_LABELS,
} from "@/types/database";

export default function SeriesPage() {
  const router = useRouter();

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Expanded series
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seriesPosts, setSeriesPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reordering state
  const [reordering, setReordering] = useState(false);

  // --- Data fetching ---

  const fetchSeries = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { data } = await insforge.database
        .from("series")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (data) setSeriesList(data as Series[]);
    } catch (err) {
      console.error("Failed to fetch series", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const fetchSeriesPosts = useCallback(
    async (seriesId: string) => {
      if (!userId) return;
      setPostsLoading(true);
      try {
        const insforge = getInsforge();
        const { data } = await insforge.database
          .from("posts")
          .select("*")
          .eq("series_id", seriesId)
          .eq("user_id", userId)
          .order("series_position", { ascending: true });

        if (data) setSeriesPosts(data as Post[]);
      } catch (err) {
        console.error("Failed to fetch series posts", err);
      } finally {
        setPostsLoading(false);
      }
    },
    [userId]
  );

  // --- Actions ---

  function toggleExpand(seriesId: string) {
    if (expandedId === seriesId) {
      setExpandedId(null);
      setSeriesPosts([]);
    } else {
      setExpandedId(seriesId);
      fetchSeriesPosts(seriesId);
    }
  }

  async function swapPositions(postA: Post, postB: Post) {
    if (!userId || reordering) return;
    setReordering(true);

    const posA = postA.series_position ?? 0;
    const posB = postB.series_position ?? 0;

    // Optimistic update
    setSeriesPosts((prev) =>
      prev
        .map((p) => {
          if (p.id === postA.id) return { ...p, series_position: posB };
          if (p.id === postB.id) return { ...p, series_position: posA };
          return p;
        })
        .sort((a, b) => (a.series_position ?? 0) - (b.series_position ?? 0))
    );

    try {
      const insforge = getInsforge();
      await Promise.all([
        insforge.database
          .from("posts")
          .update({ series_position: posB })
          .eq("id", postA.id)
          .eq("user_id", userId),
        insforge.database
          .from("posts")
          .update({ series_position: posA })
          .eq("id", postB.id)
          .eq("user_id", userId),
      ]);
    } catch (err) {
      console.error("Failed to reorder posts", err);
      if (expandedId) fetchSeriesPosts(expandedId);
    } finally {
      setReordering(false);
    }
  }

  async function deleteSeries(seriesId: string) {
    if (!userId) return;

    // Optimistic removal
    setSeriesList((prev) => prev.filter((s) => s.id !== seriesId));
    setConfirmDeleteId(null);
    if (expandedId === seriesId) {
      setExpandedId(null);
      setSeriesPosts([]);
    }

    try {
      const insforge = getInsforge();
      // Unlink all posts first
      await insforge.database
        .from("posts")
        .update({ series_id: null, series_position: null })
        .eq("series_id", seriesId);
      // Then delete the series
      await insforge.database
        .from("series")
        .delete()
        .eq("id", seriesId)
        .eq("user_id", userId);
    } catch (err) {
      console.error("Failed to delete series", err);
      await fetchSeries();
    }
  }

  function addPostToPart(series: Series, position: number) {
    const params = new URLSearchParams({
      series_id: series.id,
      series_position: String(position),
      pillar: series.pillar,
    });
    router.push(`/generate?${params.toString()}`);
  }

  // --- Helpers ---

  function getCompletedParts(series: Series, posts: Post[] | null): number {
    if (!posts) return 0;
    return posts.filter((p) => p.series_id === series.id).length;
  }

  function buildSlots(series: Series, posts: Post[]): (Post | null)[] {
    const slots: (Post | null)[] = Array.from(
      { length: series.total_parts },
      () => null
    );
    for (const post of posts) {
      const pos = post.series_position;
      if (pos !== null && pos >= 1 && pos <= series.total_parts) {
        slots[pos - 1] = post;
      }
    }
    return slots;
  }

  // We need post counts per series for the cards
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});

  const fetchPostCounts = useCallback(async () => {
    if (!userId || seriesList.length === 0) return;
    try {
      const insforge = getInsforge();
      const seriesIds = seriesList.map((s) => s.id);
      const { data } = await insforge.database
        .from("posts")
        .select("series_id")
        .eq("user_id", userId)
        .in("series_id", seriesIds);

      if (data) {
        const counts: Record<string, number> = {};
        for (const row of data as { series_id: string }[]) {
          counts[row.series_id] = (counts[row.series_id] || 0) + 1;
        }
        setPostCounts(counts);
      }
    } catch (err) {
      console.error("Failed to fetch post counts", err);
    }
  }, [userId, seriesList]);

  useEffect(() => {
    fetchPostCounts();
  }, [fetchPostCounts]);

  // --- Render ---

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Series
        </h1>
        <button
          onClick={() => router.push("/generate?tab=series-planner")}
          className="flex items-center gap-1.5 bg-coral hover:bg-coral/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Create Series
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-text-muted text-sm py-12 text-center">
          Loading series...
        </div>
      ) : seriesList.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <p className="text-text-muted text-sm">
            No series yet. Plan your first multi-part series!
          </p>
          <button
            onClick={() => router.push("/generate?tab=series-planner")}
            className="flex items-center gap-1.5 bg-coral hover:bg-coral/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Plan a Series
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seriesList.map((series) => {
            const completed = postCounts[series.id] || 0;
            const total = series.total_parts;
            const progress = total > 0 ? (completed / total) * 100 : 0;
            const isExpanded = expandedId === series.id;

            return (
              <div
                key={series.id}
                className={`bg-surface border border-border rounded-xl transition-all ${
                  isExpanded ? "md:col-span-2" : ""
                }`}
              >
                {/* Card header - clickable */}
                <button
                  onClick={() => toggleExpand(series.id)}
                  className="w-full text-left p-4 hover:bg-white/[0.02] rounded-t-xl transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading text-lg font-semibold text-text-primary truncate">
                          {series.name}
                        </h3>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                          style={{
                            backgroundColor: `${PILLAR_COLORS[series.pillar]}20`,
                            color: PILLAR_COLORS[series.pillar],
                          }}
                        >
                          {PILLAR_LABELS[series.pillar]}
                        </span>
                      </div>

                      {series.description && (
                        <p className="text-sm text-text-muted line-clamp-2 mb-3">
                          {series.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-coral rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-muted">
                          {completed} of {total} parts complete
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 mt-1 text-text-muted">
                      {isExpanded ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Full description */}
                    {series.description && (
                      <p className="text-sm text-text-muted">
                        {series.description}
                      </p>
                    )}

                    {/* Posts list */}
                    {postsLoading ? (
                      <div className="text-text-muted text-xs py-4 text-center">
                        Loading posts...
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {buildSlots(series, seriesPosts).map((post, idx) => {
                          const position = idx + 1;

                          if (!post) {
                            return (
                              <div
                                key={`empty-${position}`}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-dashed border-border"
                              >
                                <span className="text-sm text-text-muted">
                                  Part {position} - Not started
                                </span>
                                <button
                                  onClick={() =>
                                    addPostToPart(series, position)
                                  }
                                  className="flex items-center gap-1 text-xs text-coral hover:text-coral/80 transition-colors"
                                >
                                  <Plus size={14} />
                                  Add Post to Part
                                </button>
                              </div>
                            );
                          }

                          // Find adjacent posts for swap
                          const slots = buildSlots(series, seriesPosts);
                          const prevPost =
                            idx > 0 ? slots[idx - 1] : null;
                          const nextPost =
                            idx < slots.length - 1
                              ? slots[idx + 1]
                              : null;

                          return (
                            <div
                              key={post.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg/50 hover:bg-bg transition-colors"
                            >
                              {/* Position number */}
                              <span className="text-xs font-medium text-text-muted w-6 text-center shrink-0">
                                {position}
                              </span>

                              {/* Post info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">
                                  {post.title}
                                </p>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 shrink-0">
                                <PillarDot pillar={post.pillar} />
                                <StatusBadge status={post.status} />
                              </div>

                              {/* Reorder buttons */}
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button
                                  onClick={() => {
                                    if (prevPost)
                                      swapPositions(post, prevPost);
                                  }}
                                  disabled={!prevPost || reordering}
                                  className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                                  title="Move up"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (nextPost)
                                      swapPositions(post, nextPost);
                                  }}
                                  disabled={!nextPost || reordering}
                                  className="p-0.5 rounded text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                                  title="Move down"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Delete series */}
                    <div className="flex justify-end pt-2">
                      {confirmDeleteId === series.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-muted">
                            Delete this series?
                          </span>
                          <button
                            onClick={() => deleteSeries(series.id)}
                            className="px-3 py-1 rounded-md text-xs font-medium bg-coral/20 text-coral hover:bg-coral/30 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1 rounded-md text-xs font-medium text-text-muted hover:text-text-primary transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(series.id)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-coral transition-colors"
                        >
                          <Trash2 size={13} />
                          Delete Series
                        </button>
                      )}
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
