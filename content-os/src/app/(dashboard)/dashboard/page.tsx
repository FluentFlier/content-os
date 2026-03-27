"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  RefreshCw,
  Wand2,
  BookOpen,
  PlusCircle,
  Lightbulb,
  ArrowRight,
  Flame,
  CalendarClock,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type { Post, ContentIdea, Priority } from "@/types/database";
import StatusBadge from "@/components/StatusBadge";
import PillarDot from "@/components/PillarDot";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function computeStreak(postedDates: string[]): number {
  if (postedDates.length === 0) return 0;

  const unique = Array.from(new Set(postedDates)).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (unique.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}

function formatScheduledDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#EB5E55",
  medium: "#F5C842",
  low: "#5A5047",
};

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface rounded ${className ?? ""}`} />
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Data
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [inPipeline, setInPipeline] = useState(0);
  const [totalPosted, setTotalPosted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [upNext, setUpNext] = useState<Post[]>([]);
  const [recentActivity, setRecentActivity] = useState<Post[]>([]);
  const [backlog, setBacklog] = useState<ContentIdea[]>([]);

  // AI prompt
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // --------------------------------------------------
  // Fetch all dashboard data
  // --------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const { start, end } = getWeekBounds();
      const today = todayISO();

      // Fire all queries in parallel
      const [
        weekPostsRes,
        pipelineRes,
        postedRes,
        streakRes,
        upNextRes,
        recentRes,
        ideasRes,
      ] = await Promise.all([
        // Posts this week
        insforge.database
          .from("posts")
          .select("id")
          .eq("user_id", uid)
          .eq("status", "posted")
          .gte("posted_date", start)
          .lte("posted_date", end),

        // In pipeline
        insforge.database
          .from("posts")
          .select("id")
          .eq("user_id", uid)
          .neq("status", "posted")
          .neq("status", "idea"),

        // Total posted
        insforge.database
          .from("posts")
          .select("id")
          .eq("user_id", uid)
          .eq("status", "posted"),

        // All posted dates for streak
        insforge.database
          .from("posts")
          .select("posted_date")
          .eq("user_id", uid)
          .not("posted_date", "is", null)
          .order("posted_date", { ascending: false }),

        // Up next
        insforge.database
          .from("posts")
          .select("*")
          .eq("user_id", uid)
          .gte("scheduled_date", today)
          .neq("status", "posted")
          .order("scheduled_date", { ascending: true })
          .limit(3),

        // Recent activity
        insforge.database
          .from("posts")
          .select("*")
          .eq("user_id", uid)
          .order("updated_at", { ascending: false })
          .limit(5),

        // Backlog ideas
        insforge.database
          .from("content_ideas")
          .select("*")
          .eq("user_id", uid)
          .eq("converted", false)
          .order("priority", { ascending: true })
          .limit(3),
      ]);

      setPostsThisWeek(weekPostsRes.data?.length ?? 0);
      setInPipeline(pipelineRes.data?.length ?? 0);
      setTotalPosted(postedRes.data?.length ?? 0);

      const dates = (streakRes.data ?? [])
        .map((r: { posted_date: string | null }) => r.posted_date)
        .filter(Boolean) as string[];
      setStreak(computeStreak(dates));

      setUpNext((upNextRes.data as Post[]) ?? []);
      setRecentActivity((recentRes.data as Post[]) ?? []);
      setBacklog((ideasRes.data as ContentIdea[]) ?? []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // Fetch AI suggestion
  // --------------------------------------------------
  const fetchAiSuggestion = useCallback(async () => {
    setAiLoading(true);
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const { start, end } = getWeekBounds();

      const { data: weekPosts } = await insforge.database
        .from("posts")
        .select("title, pillar, status")
        .eq("user_id", uid)
        .gte("created_at", start)
        .lte("created_at", end);

      const postsSummary =
        weekPosts && weekPosts.length > 0
          ? weekPosts
              .map(
                (p: { title: string; pillar: string; status: string }) =>
                  `- "${p.title}" (${p.pillar}, ${p.status})`
              )
              .join("\n")
          : "No posts this week yet.";

      const prompt = `Here are my posts this week:\n${postsSummary}\n\nWhich content pillar or angle am I missing? Suggest one specific content idea I should create next. Be concise (2-3 sentences max). Do not use em dashes.`;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.text ?? "Could not generate a suggestion.");
      } else {
        setAiSuggestion("Could not generate a suggestion right now. Try again later.");
      }
    } catch {
      setAiSuggestion("Could not generate a suggestion right now. Try again later.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // Mount
  // --------------------------------------------------
  useEffect(() => {
    fetchData();
    fetchAiSuggestion();
  }, [fetchData, fetchAiSuggestion]);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting */}
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary pt-2">
        What are we building today?
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard icon={CalendarClock} value={postsThisWeek} label="Posts this week" />
            <StatCard icon={Layers} value={inPipeline} label="In pipeline" />
            <StatCard icon={CheckCircle2} value={totalPosted} label="Total posted" />
            <StatCard icon={Flame} value={streak} label="Day streak" />
          </>
        )}
      </div>

      {/* Middle row: Up Next + Today's Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Up Next */}
        <section className="bg-surface border border-border rounded-lg p-5">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Up Next
          </h2>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : upNext.length === 0 ? (
            <p className="text-text-muted text-sm">
              Nothing scheduled. Time to plan some content!
            </p>
          ) : (
            <ul className="space-y-3">
              {upNext.map((post) => (
                <li key={post.id}>
                  <Link
                    href="/library"
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PillarDot pillar={post.pillar} />
                      <span className="text-sm text-text-primary truncate group-hover:text-coral transition-colors">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={post.status} />
                      {post.scheduled_date && (
                        <span className="text-xs text-text-muted">
                          {formatScheduledDate(post.scheduled_date)}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's Prompt */}
        <section className="bg-surface border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-text-primary">
              Today&apos;s Prompt
            </h2>
            <button
              onClick={fetchAiSuggestion}
              disabled={aiLoading}
              className="text-text-muted hover:text-coral transition-colors disabled:opacity-50"
              aria-label="Refresh suggestion"
            >
              <RefreshCw
                size={16}
                className={aiLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
          {aiLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <p className="text-sm text-text-primary leading-relaxed">
              {aiSuggestion || "Click refresh to generate a content idea."}
            </p>
          )}
        </section>
      </div>

      {/* Backlog */}
      <section className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-text-primary">
            Backlog
          </h2>
          <Link
            href="/ideas"
            className="text-xs text-text-muted hover:text-coral transition-colors flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : backlog.length === 0 ? (
          <p className="text-text-muted text-sm">No ideas in the backlog yet.</p>
        ) : (
          <ul className="space-y-3">
            {backlog.map((idea) => (
              <li
                key={idea.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PillarDot pillar={idea.pillar} />
                  <span className="text-sm text-text-primary truncate">
                    {idea.idea}
                  </span>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize shrink-0"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[idea.priority]}20`,
                    color: PRIORITY_COLORS[idea.priority],
                  }}
                >
                  {idea.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction
            href="/generate"
            icon={Wand2}
            label="Generate Script"
          />
          <QuickAction
            href="/generate?tab=story-mine"
            icon={BookOpen}
            label="Mine a Story"
          />
          <QuickAction
            href="/library?action=new"
            icon={PlusCircle}
            label="Log a Post"
          />
          <QuickAction
            href="/ideas"
            icon={Lightbulb}
            label="Add Idea"
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-surface border border-border rounded-lg p-5">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
          Recent Activity
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-text-muted text-sm">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PillarDot pillar={post.pillar} />
                  <span className="text-sm text-text-primary truncate">
                    {post.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={post.status} />
                  <span className="text-xs text-text-muted">
                    {timeAgo(post.updated_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={18} className="text-text-muted" />
        <span className="text-3xl font-bold text-text-primary">{value}</span>
      </div>
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 bg-surface border border-border rounded-lg p-4 hover:border-coral/50 hover:bg-coral/5 transition-colors group"
    >
      <Icon
        size={22}
        className="text-text-muted group-hover:text-coral transition-colors"
      />
      <span className="text-xs text-text-muted group-hover:text-text-primary transition-colors text-center">
        {label}
      </span>
    </Link>
  );
}
