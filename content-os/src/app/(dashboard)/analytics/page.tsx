"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Hash,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type { Post, HashtagSet, WeeklyReview } from "@/lib/types";
import { usePillars } from "@/hooks/usePillars";
import PillarDot from "@/components/PillarDot";

/* ------------------------------------------------------------------ */
/*  Dynamic recharts imports (prevent SSR issues)                     */
/* ------------------------------------------------------------------ */

// @ts-ignore recharts types incompatible with next/dynamic
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const BarChartComponent = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const LineChartComponent = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
// @ts-ignore recharts types incompatible with next/dynamic
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + "..." : s;
}

const CHART_TOOLTIP = {
  backgroundColor: "#18181B",
  border: "0.5px solid rgba(255,255,255,0.12)",
  color: "#FAFAFA",
};

const CHART_COLORS = {
  coral: "#6366F1",
  yellow: "#F59E0B",
  green: "#10B981",
  grid: "rgba(255,255,255,0.08)",
  text: "#71717A",
  muted: "#71717A",
};

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const { pillars: pillarList, getLabel, getColor } = usePillars();
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>([]);
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const [postsRes, setsRes, reviewsRes] = await Promise.all([
        insforge.database
          .from("posts")
          .select("*")
          .eq("user_id", uid)
          .eq("status", "posted")
          .order("posted_date", { ascending: false })
          .limit(30),
        insforge.database
          .from("hashtag_sets")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        insforge.database
          .from("weekly_reviews")
          .select("*")
          .eq("user_id", uid)
          .order("week_start", { ascending: false }),
      ]);

      setPosts(postsRes.data ?? []);
      setHashtagSets(setsRes.data ?? []);
      setReviews(reviewsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-10 pb-20">
        <div className="h-7 w-32 bg-[#18181B] rounded-[7px] animate-pulse" />
        {/* Log Performance skeleton */}
        <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-4">
          <div className="h-5 w-40 bg-[#27272A] rounded animate-pulse" />
          <div className="h-10 w-full bg-[#27272A] rounded-[7px] animate-pulse" />
        </div>
        {/* Performance Overview skeleton */}
        <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-4">
          <div className="h-5 w-48 bg-[#27272A] rounded animate-pulse" />
          <div className="h-[300px] bg-[#27272A] rounded-[12px] animate-pulse" />
        </div>
        {/* Weekly Review skeleton */}
        <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-4">
          <div className="h-5 w-36 bg-[#27272A] rounded animate-pulse" />
          <div className="h-20 bg-[#27272A] rounded-[12px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">Analytics</h1>

      {/* Section 1 */}
      <LogPerformanceSection posts={posts} userId={userId} onSaved={fetchData} />

      {/* Section 2 */}
      <PerformanceOverviewSection posts={posts} getLabel={getLabel} getColor={getColor} />

      {/* Section 3 */}
      <WeeklyReviewSection
        posts={posts}
        reviews={reviews}
        userId={userId}
        onSaved={fetchData}
      />

      {/* Section 4 */}
      <HashtagVaultSection
        sets={hashtagSets}
        userId={userId}
        onSaved={fetchData}
        pillarList={pillarList}
      />
    </div>
  );
}

/* ================================================================== */
/*  SECTION 1: Log Performance                                        */
/* ================================================================== */

function LogPerformanceSection({
  posts,
  userId,
  onSaved,
}: {
  posts: Post[];
  userId: string | null;
  onSaved: () => void;
}) {
  const [selectedPostId, setSelectedPostId] = useState("");
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [saves, setSaves] = useState(0);
  const [comments, setComments] = useState(0);
  const [shares, setShares] = useState(0);
  const [followsGained, setFollowsGained] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const post = posts.find((p) => p.id === selectedPostId);
    if (post) {
      setViews(post.views ?? 0);
      setLikes(post.likes ?? 0);
      setSaves(post.saves ?? 0);
      setComments(post.comments ?? 0);
      setShares(post.shares ?? 0);
      setFollowsGained(post.follows_gained ?? 0);
    }
  }, [selectedPostId, posts]);

  async function handleSave() {
    if (!selectedPostId || !userId) return;
    setSaving(true);
    setMessage("");
    try {
      const insforge = getInsforge();
      const { error } = await insforge.database
        .from("posts")
        .update({
          views,
          likes,
          saves,
          comments,
          shares,
          follows_gained: followsGained,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPostId)
        .eq("user_id", userId);

      if (error) throw error;
      setMessage("Stats saved successfully!");
      onSaved();
    } catch {
      setMessage("Failed to save stats.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6">
      <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA] mb-4 flex items-center gap-2">
        <BarChart3 size={20} /> Log Performance
      </h2>

      <div className="mb-4">
        <label className="block text-sm text-[#71717A] mb-1">Select a posted post</label>
        <select
          className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA]"
          value={selectedPostId}
          onChange={(e) => setSelectedPostId(e.target.value)}
        >
          <option value="">-- Choose a post --</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>
              {truncate(p.title, 50)}
            </option>
          ))}
        </select>
      </div>

      {selectedPostId && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-4">
            {[
              { label: "Views", value: views, set: setViews },
              { label: "Likes", value: likes, set: setLikes },
              { label: "Saves", value: saves, set: setSaves },
              { label: "Comments", value: comments, set: setComments },
              { label: "Shares", value: shares, set: setShares },
              { label: "Follows", value: followsGained, set: setFollowsGained },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-xs text-[#71717A] mb-1">
                  {field.label}
                </label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2 py-2 min-h-[44px] text-[#FAFAFA]"
                  value={field.value}
                  onChange={(e) => field.set(Number(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#6366F1] text-white px-4 py-2 min-h-[44px] rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save"}
          </button>

          {message && (
            <p className="mt-2 text-sm text-[#3B6D11]">{message}</p>
          )}
        </>
      )}
    </section>
  );
}

/* ================================================================== */
/*  SECTION 2: Performance Overview                                   */
/* ================================================================== */

function PerformanceOverviewSection({
  posts,
  getLabel,
  getColor,
}: {
  posts: Post[];
  getLabel: (v: string) => string;
  getColor: (v: string) => string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* Views by post */
  const viewsData = posts.map((p) => ({
    name: truncate(p.title, 20),
    views: p.views ?? 0,
  }));

  /* Saves by post */
  const savesData = posts.map((p) => ({
    name: truncate(p.title, 20),
    saves: p.saves ?? 0,
  }));

  /* Follows gained over time (chronological) */
  const followsData = [...posts]
    .filter((p) => p.posted_date)
    .sort(
      (a, b) =>
        new Date(a.posted_date!).getTime() - new Date(b.posted_date!).getTime()
    )
    .map((p) => ({
      date: new Date(p.posted_date!).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      follows: p.follows_gained ?? 0,
    }));

  /* Avg views per pillar */
  const pillarMap: Record<string, { total: number; count: number }> = {};
  posts.forEach((p) => {
    if (!pillarMap[p.pillar]) pillarMap[p.pillar] = { total: 0, count: 0 };
    pillarMap[p.pillar].total += p.views ?? 0;
    pillarMap[p.pillar].count += 1;
  });
  const pillarData = Object.entries(pillarMap)
    .map(([pillar, { total, count }]) => ({
      pillar: getLabel(pillar),
      avg: Math.round(total / count),
      color: getColor(pillar),
    }))
    .sort((a, b) => b.avg - a.avg);

  /* Top 5 by saves */
  const topBySaves = [...posts]
    .sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0))
    .slice(0, 5);

  if (!mounted) return null;

  return (
    <section className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-8">
      <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA] flex items-center gap-2">
        <TrendingUp size={20} /> Performance Overview
      </h2>

      {posts.length === 0 ? (
        <p className="text-[#71717A] text-sm">
          No posted posts with stats yet. Log performance above to see charts.
        </p>
      ) : (
        <>
          {/* Views by post */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">
              Views by Post
            </h3>
            <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChartComponent data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="views" fill={CHART_COLORS.coral} radius={[4, 4, 0, 0]} />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saves by post */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">
              Saves by Post
            </h3>
            <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChartComponent data={savesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="saves" fill={CHART_COLORS.yellow} radius={[4, 4, 0, 0]} />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Follows gained over time */}
          {followsData.length > 0 && (
            <div>
              <h3 className="text-sm text-[#71717A] mb-2 font-heading">
                Follows Gained Over Time
              </h3>
              <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChartComponent data={followsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Line
                      type="monotone"
                      dataKey="follows"
                      stroke={CHART_COLORS.green}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.green }}
                    />
                  </LineChartComponent>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pillar breakdown table */}
          {pillarData.length > 0 && (
            <div>
              <h3 className="text-sm text-[#71717A] mb-2 font-heading">
                Pillar Breakdown
              </h3>
              <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="border-b-[0.5px] border-[#FAFAFA]/12">
                      <th className="text-left px-4 py-2.5 text-[#71717A] font-medium">Pillar</th>
                      <th className="text-right px-4 py-2.5 text-[#71717A] font-medium">Posts</th>
                      <th className="text-right px-4 py-2.5 text-[#71717A] font-medium">Avg Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pillarMap).map(([pillar, { total, count }]) => (
                      <tr key={pillar} className="border-b-[0.5px] border-[#FAFAFA]/12/50">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: getColor(pillar) }}
                            />
                            <span className="text-[#FAFAFA]">
                              {getLabel(pillar)}
                            </span>
                          </span>
                        </td>
                        <td className="text-right px-4 py-2.5 text-[#FAFAFA]">{count}</td>
                        <td className="text-right px-4 py-2.5 text-[#FAFAFA]">{Math.round(total / count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 5 by saves */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">
              Best Performers (Top 5 by Saves)
            </h3>
            <div className="space-y-2">
              {topBySaves.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] px-4 py-3"
                >
                  <span className="text-[#6366F1] font-heading text-lg w-6">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FAFAFA] text-sm truncate">
                      {p.title}
                    </p>
                    <p className="text-[#71717A] text-xs">
                      {p.views ?? 0} views / {p.saves ?? 0} saves
                    </p>
                  </div>
                  <PillarDot pillar={p.pillar} showLabel />
                </div>
              ))}
              {topBySaves.length === 0 && (
                <p className="text-[#71717A] text-sm">No data yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

/* ================================================================== */
/*  SECTION 3: Weekly Review                                          */
/* ================================================================== */

function WeeklyReviewSection({
  posts,
  reviews,
  userId,
  onSaved,
}: {
  posts: Post[];
  reviews: WeeklyReview[];
  userId: string | null;
  onSaved: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [postsPublished, setPostsPublished] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [topPostId, setTopPostId] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [doublDown, setDoublDown] = useState("");
  const [whatToCut, setWhatToCut] = useState("");
  const [nextWeek, setNextWeek] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setAiOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Here is my weekly content performance data:
- Posts published: ${postsPublished}
- Total views: ${totalViews}
- Total followers gained: ${totalFollowers}
- What worked: ${whatWorked}
- What to double down on: ${doublDown}
- What to cut: ${whatToCut}
- Next week focus: ${nextWeek}

Give me exactly 3 blunt, actionable recommendations for next week. Be direct and specific. No fluff.`,
          systemOverride:
            "You are a blunt content strategist. Give exactly 3 short, specific recommendations. Number them 1-3. No intros or outros.",
        }),
      });
      const data = await res.json();
      setAiOutput(data.text ?? "No response.");
    } catch {
      setAiOutput("Failed to analyze. Try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveReview() {
    if (!userId || !weekStart) return;
    setSaving(true);
    setMessage("");
    try {
      const insforge = getInsforge();
      const { error } = await insforge.database
        .from("weekly_reviews")
        .insert({
          user_id: userId,
          week_start: weekStart,
          posts_published: postsPublished,
          total_views: totalViews,
          total_followers_gained: totalFollowers,
          top_post_id: topPostId || null,
          what_worked: whatWorked || null,
          what_to_double_down: doublDown || null,
          what_to_cut: whatToCut || null,
          next_week_focus: nextWeek || null,
        });
      if (error) throw error;
      setMessage("Review saved!");
      setShowForm(false);
      resetForm();
      onSaved();
    } catch {
      setMessage("Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setWeekStart("");
    setPostsPublished(0);
    setTotalViews(0);
    setTotalFollowers(0);
    setTopPostId("");
    setWhatWorked("");
    setDoublDown("");
    setWhatToCut("");
    setNextWeek("");
    setAiOutput("");
    setMessage("");
  }

  return (
    <section className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA] flex items-center gap-2">
          <Sparkles size={20} /> Weekly Review
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#6366F1] text-white px-4 py-2 rounded hover:opacity-90 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> New Weekly Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-4 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#71717A] mb-1">Week Start</label>
              <input
                type="date"
                className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA]"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#71717A] mb-1">Posts Published</label>
              <input
                type="number"
                min={0}
                className="w-24 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2 py-1 text-[#FAFAFA]"
                value={postsPublished}
                onChange={(e) => setPostsPublished(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#71717A] mb-1">Total Views</label>
              <input
                type="number"
                min={0}
                className="w-24 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2 py-1 text-[#FAFAFA]"
                value={totalViews}
                onChange={(e) => setTotalViews(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs text-[#71717A] mb-1">Total Followers Gained</label>
              <input
                type="number"
                min={0}
                className="w-24 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2 py-1 text-[#FAFAFA]"
                value={totalFollowers}
                onChange={(e) => setTotalFollowers(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#71717A] mb-1">Top Post</label>
            <select
              className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA]"
              value={topPostId}
              onChange={(e) => setTopPostId(e.target.value)}
            >
              <option value="">-- Select top post --</option>
              {posts.map((p) => (
                <option key={p.id} value={p.id}>
                  {truncate(p.title, 50)}
                </option>
              ))}
            </select>
          </div>

          {[
            { label: "What Worked", value: whatWorked, set: setWhatWorked },
            { label: "What to Double Down On", value: doublDown, set: setDoublDown },
            { label: "What to Cut", value: whatToCut, set: setWhatToCut },
            { label: "Next Week Focus", value: nextWeek, set: setNextWeek },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs text-[#71717A] mb-1">{field.label}</label>
              <textarea
                className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA] text-sm min-h-[60px]"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="bg-[#F59E0B] text-[#FAFAFA] px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              <Sparkles size={16} />{" "}
              {analyzing ? "Analyzing..." : "Analyze My Week"}
            </button>
            <button
              onClick={handleSaveReview}
              disabled={saving || !weekStart}
              className="bg-[#6366F1] text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} /> {saving ? "Saving..." : "Save Review"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-[#71717A] hover:text-[#FAFAFA] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>

          {aiOutput && (
            <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4 mt-2">
              <h4 className="text-sm font-heading text-[#854F0B] mb-2">
                AI Recommendations
              </h4>
              <p className="text-[#FAFAFA] text-sm whitespace-pre-wrap">
                {aiOutput}
              </p>
            </div>
          )}

          {message && (
            <p className="text-sm text-[#3B6D11]">{message}</p>
          )}
        </div>
      )}

      {/* Past reviews */}
      {reviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm text-[#71717A] font-heading">Past Reviews</h3>
          {reviews.map((r) => {
            const expanded = expandedReview === r.id;
            return (
              <div key={r.id} className="bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px]">
                <button
                  onClick={() => setExpandedReview(expanded ? null : r.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-[#FAFAFA] text-sm">
                    Week of{" "}
                    {new Date(r.week_start).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[#71717A] flex items-center gap-2 text-xs">
                    {r.posts_published} posts / {r.total_views} views
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 space-y-2 text-sm">
                    <p className="text-[#71717A]">
                      Followers gained:{" "}
                      <span className="text-[#FAFAFA]">{r.total_followers_gained}</span>
                    </p>
                    {r.what_worked && (
                      <div>
                        <span className="text-[#71717A]">What worked: </span>
                        <span className="text-[#FAFAFA]">{r.what_worked}</span>
                      </div>
                    )}
                    {r.what_to_double_down && (
                      <div>
                        <span className="text-[#71717A]">Double down: </span>
                        <span className="text-[#FAFAFA]">{r.what_to_double_down}</span>
                      </div>
                    )}
                    {r.what_to_cut && (
                      <div>
                        <span className="text-[#71717A]">Cut: </span>
                        <span className="text-[#FAFAFA]">{r.what_to_cut}</span>
                      </div>
                    )}
                    {r.next_week_focus && (
                      <div>
                        <span className="text-[#71717A]">Next week focus: </span>
                        <span className="text-[#FAFAFA]">{r.next_week_focus}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ================================================================== */
/*  SECTION 4: Hashtag Vault                                          */
/* ================================================================== */

function HashtagVaultSection({
  sets,
  userId,
  onSaved,
  pillarList,
}: {
  sets: HashtagSet[];
  userId: string | null;
  onSaved: () => void;
  pillarList: { value: string; label: string }[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [pillar, setPillar] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [analyzeOutput, setAnalyzeOutput] = useState<Record<string, string>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  function startEdit(set: HashtagSet) {
    setEditingId(set.id);
    setName(set.name);
    setTags(set.tags);
    setPillar(set.pillar ?? "");
    setShowCreate(false);
  }

  function resetForm() {
    setName("");
    setTags("");
    setPillar("");
    setEditingId(null);
    setShowCreate(false);
    setMessage("");
  }

  async function handleSave() {
    if (!userId || !name.trim() || !tags.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      const insforge = getInsforge();
      const payload = {
        name: name.trim(),
        tags: tags.trim(),
        pillar: pillar || null,
      };

      if (editingId) {
        const { error } = await insforge.database
          .from("hashtag_sets")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await insforge.database
          .from("hashtag_sets")
          .insert({ ...payload, user_id: userId, use_count: 0 });
        if (error) throw error;
      }

      setMessage(editingId ? "Set updated!" : "Set created!");
      resetForm();
      onSaved();
    } catch {
      setMessage("Failed to save hashtag set.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    try {
      const insforge = getInsforge();
      await insforge.database
        .from("hashtag_sets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      onSaved();
    } catch {
      /* silent */
    }
  }

  async function handleCopy(tagsStr: string, id: string) {
    await navigator.clipboard.writeText(tagsStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleAnalyze(set: HashtagSet) {
    setAnalyzingId(set.id);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze these hashtags for an Instagram content creator:
Set name: "${set.name}"
Tags: ${set.tags}
Pillar: ${set.pillar ?? "general"}

Which tags should I keep and which should I cut? Be specific and blunt. Suggest 2-3 replacements for any tags you recommend cutting.`,
          systemOverride:
            "You are a blunt social media strategist. Analyze hashtags and say which to keep and which to cut. Be specific. Suggest replacements.",
        }),
      });
      const data = await res.json();
      setAnalyzeOutput((prev) => ({ ...prev, [set.id]: data.text ?? "" }));
    } catch {
      setAnalyzeOutput((prev) => ({
        ...prev,
        [set.id]: "Failed to analyze.",
      }));
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <section className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA] flex items-center gap-2">
          <Hash size={20} /> Hashtag Vault
        </h2>
        {!showCreate && !editingId && (
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#6366F1] text-white px-4 py-2 rounded hover:opacity-90 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Create Set
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {(showCreate || editingId) && (
        <div className="bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4 space-y-3">
          <div>
            <label className="block text-xs text-[#71717A] mb-1">Name</label>
            <input
              className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA] text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Founder hashtags"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71717A] mb-1">
              Tags (space or comma separated)
            </label>
            <textarea
              className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA] text-sm min-h-[60px]"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#founder #startup #buildinpublic"
            />
          </div>
          <div>
            <label className="block text-xs text-[#71717A] mb-1">Pillar (optional)</label>
            <select
              className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-3 py-2 text-[#FAFAFA] text-sm"
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
            >
              <option value="">-- None --</option>
              {pillarList.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !tags.trim()}
              className="bg-[#6366F1] text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <Save size={16} />{" "}
              {saving ? "Saving..." : editingId ? "Update Set" : "Create Set"}
            </button>
            <button
              onClick={resetForm}
              className="text-[#71717A] hover:text-[#FAFAFA] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
          {message && <p className="text-sm text-[#3B6D11]">{message}</p>}
        </div>
      )}

      {/* List */}
      {sets.length === 0 && !showCreate && (
        <p className="text-[#71717A] text-sm">
          No hashtag sets yet. Create one to get started.
        </p>
      )}

      <div className="space-y-3">
        {sets.map((s) => (
          <div key={s.id} className="bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#FAFAFA] text-sm font-medium truncate">
                  {s.name}
                </span>
                {s.pillar && <PillarDot pillar={s.pillar} showLabel />}
                <span className="text-[#71717A] text-xs shrink-0">
                  Used {s.use_count}x
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(s.tags, s.id)}
                  className="text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-[7px]"
                  title="Copy tags"
                >
                  <ClipboardCopy size={14} />
                </button>
                <button
                  onClick={() => handleAnalyze(s)}
                  disabled={analyzingId === s.id}
                  className="text-[#71717A] hover:text-[#854F0B] p-1.5 rounded-[7px] disabled:opacity-50"
                  title="Analyze"
                >
                  <Sparkles size={14} />
                </button>
                <button
                  onClick={() => startEdit(s)}
                  className="text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-[7px]"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-[#71717A] hover:text-[#6366F1] p-1.5 rounded-[7px]"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-[#71717A] text-xs truncate">{s.tags}</p>
            {copiedId === s.id && (
              <p className="text-xs text-[#3B6D11]">Copied!</p>
            )}
            {analyzeOutput[s.id] && (
              <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-3 mt-2">
                <h4 className="text-xs font-heading text-[#854F0B] mb-1">Analysis</h4>
                <p className="text-[#FAFAFA] text-xs whitespace-pre-wrap">
                  {analyzeOutput[s.id]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
