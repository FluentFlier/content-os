"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Plus } from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type { Series, Post } from "@/lib/types";
import SeriesCard from "@/components/series/SeriesCard";
import SeriesPostList from "@/components/series/SeriesPostList";

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

    setSeriesList((prev) => prev.filter((s) => s.id !== seriesId));
    setConfirmDeleteId(null);
    if (expandedId === seriesId) {
      setExpandedId(null);
      setSeriesPosts([]);
    }

    try {
      const insforge = getInsforge();
      await insforge.database
        .from("posts")
        .update({ series_id: null, series_position: null })
        .eq("series_id", seriesId);
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

  // Post counts per series
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
        <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">
          Series
        </h1>
        <button
          onClick={() => router.push("/generate?tab=series")}
          className="flex items-center gap-1.5 bg-[#6366F1] hover:opacity-90 text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] transition-opacity"
        >
          <Plus size={16} />
          Create Series
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#18181B] rounded-[12px] p-4 animate-pulse space-y-3">
              <div className="h-5 w-2/3 bg-[#27272A] rounded" />
              <div className="h-4 w-1/2 bg-[#27272A] rounded" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-[#27272A] rounded" />
                <div className="h-6 w-16 bg-[#27272A] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-12 h-12 text-[#71717A] mb-4" />
          <h2 className="font-heading text-[16px] font-[700] text-[#FAFAFA] mb-1">
            No series yet
          </h2>
          <p className="text-[#71717A] text-[13px] mb-4">
            Organize your content into multi-part series.
          </p>
          <button
            onClick={() => router.push("/generate?tab=series")}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:opacity-90 text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] transition-opacity"
          >
            <Plus size={16} />
            Plan a New Series
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
          {seriesList.map((series) => {
            const completed = postCounts[series.id] || 0;
            const isExpanded = expandedId === series.id;

            return (
              <SeriesCard
                key={series.id}
                series={series}
                completedParts={completed}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpand(series.id)}
                onDelete={() => deleteSeries(series.id)}
                confirmingDelete={confirmDeleteId === series.id}
                onConfirmDelete={() => setConfirmDeleteId(series.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
              >
                <SeriesPostList
                  series={series}
                  posts={seriesPosts}
                  loading={postsLoading}
                  reordering={reordering}
                  onSwap={swapPositions}
                  onAddPart={(position) => addPostToPart(series, position)}
                />
              </SeriesCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
