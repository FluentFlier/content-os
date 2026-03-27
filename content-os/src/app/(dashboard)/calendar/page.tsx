"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { getInsforge } from "@/lib/insforge/client";
import type { Post, Pillar } from "@/types/database";
import { PILLAR_COLORS, PILLAR_LABELS } from "@/types/database";
import PillarDot from "@/components/PillarDot";
import StatusBadge from "@/components/StatusBadge";

type ViewMode = "month" | "week";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= lastDay || days.length % 7 !== 0) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  return days;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [weekBase, setWeekBase] = useState(today);

  // Modals
  const [scheduleModalDate, setScheduleModalDate] = useState<Date | null>(null);
  const [backlogPickPost, setBacklogPickPost] = useState<Post | null>(null);
  const [fillWeekOpen, setFillWeekOpen] = useState(false);
  const [fillSuggestions, setFillSuggestions] = useState<
    { postId: string; date: string; title: string; pillar: Pillar }[]
  >([]);
  const [fillLoading, setFillLoading] = useState(false);

  /* ---- Data fetching ---- */

  const fetchPosts = useCallback(async () => {
    try {
      const insforge = getInsforge();
      const { data: userData } = await insforge.auth.getCurrentUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const { data } = await insforge.database
        .from("posts")
        .select("*")
        .eq("user_id", uid)
        .order("scheduled_date", { ascending: true });

      setPosts((data as Post[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch posts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  /* ---- Derived data ---- */

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const p of posts) {
      if (p.scheduled_date) {
        const key = p.scheduled_date.slice(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    }
    return map;
  }, [posts]);

  const backlog = useMemo(
    () =>
      posts.filter((p) => !p.scheduled_date && p.status !== "posted"),
    [posts]
  );

  /* ---- Navigation ---- */

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToPrevWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() - 7);
    setWeekBase(d);
  };

  const goToNextWeek = () => {
    const d = new Date(weekBase);
    d.setDate(d.getDate() + 7);
    setWeekBase(d);
  };

  /* ---- Schedule a post ---- */

  const schedulePost = async (postId: string, date: Date) => {
    if (!userId) return;
    const insforge = getInsforge();
    await insforge.database
      .from("posts")
      .update({
        scheduled_date: toDateKey(date),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", userId);
    await fetchPosts();
  };

  /* ---- Backlog click-to-assign flow ---- */

  const handleBacklogClick = (post: Post) => {
    setBacklogPickPost(post);
  };

  const handleDayCellClick = (day: Date) => {
    if (backlogPickPost) {
      schedulePost(backlogPickPost.id, day);
      setBacklogPickPost(null);
    } else {
      setScheduleModalDate(day);
    }
  };

  /* ---- Fill This Week ---- */

  const handleFillWeek = async () => {
    if (!userId || backlog.length === 0) return;
    setFillLoading(true);
    setFillWeekOpen(true);

    try {
      const weekDays = getWeekDays(
        viewMode === "week" ? weekBase : today
      );
      const weekStart = toDateKey(weekDays[0]);
      const weekEnd = toDateKey(weekDays[6]);

      const scheduledThisWeek = posts.filter((p) => {
        if (!p.scheduled_date) return false;
        const d = p.scheduled_date.slice(0, 10);
        return d >= weekStart && d <= weekEnd;
      });

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `You are a content scheduling assistant. Given the following context, suggest which unscheduled posts should be placed on which days this week (${weekStart} to ${weekEnd}). Aim for pillar balance and even spacing.

Already scheduled this week:
${scheduledThisWeek.map((p) => `- ${p.title} (${p.pillar}) on ${p.scheduled_date}`).join("\n") || "None"}

Unscheduled backlog:
${backlog.map((p) => `- id:${p.id} "${p.title}" (${p.pillar}, status: ${p.status})`).join("\n")}

Available days: ${weekDays.map((d) => toDateKey(d)).join(", ")}

Respond ONLY with a JSON array of objects: [{"postId":"...","date":"YYYY-MM-DD"}]. No explanation.`,
        }),
      });

      const result = await res.json();
      const raw = result.text || result.content || "";
      const jsonMatch = raw.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]) as {
          postId: string;
          date: string;
        }[];
        const enriched = suggestions
          .map((s) => {
            const post = backlog.find((p) => p.id === s.postId);
            if (!post) return null;
            return {
              postId: s.postId,
              date: s.date,
              title: post.title,
              pillar: post.pillar,
            };
          })
          .filter(Boolean) as {
          postId: string;
          date: string;
          title: string;
          pillar: Pillar;
        }[];
        setFillSuggestions(enriched);
      }
    } catch (err) {
      console.error("Fill week failed", err);
    } finally {
      setFillLoading(false);
    }
  };

  const confirmFillWeek = async () => {
    if (!userId) return;
    const insforge = getInsforge();
    for (const s of fillSuggestions) {
      await insforge.database
        .from("posts")
        .update({
          scheduled_date: s.date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", s.postId)
        .eq("user_id", userId);
    }
    setFillWeekOpen(false);
    setFillSuggestions([]);
    await fetchPosts();
  };

  /* ---- Render helpers ---- */

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  /* ---- Loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-surface rounded animate-pulse" />
          <div className="h-9 w-28 bg-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-20 bg-surface rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-0">
      {/* ---- Main calendar area ---- */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Calendar
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Nav arrows + month/year */}
            <div className="flex items-center gap-1">
              <button
                onClick={viewMode === "month" ? goToPrevMonth : goToPrevWeek}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-text-primary font-medium min-w-[140px] text-center">
                {viewMode === "month"
                  ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
                  : `Week of ${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
              </span>
              <button
                onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
                className="p-1.5 rounded border border-border text-text-muted hover:text-text-primary hover:border-text-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex border border-border rounded overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "month"
                    ? "bg-coral text-white"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "week"
                    ? "bg-coral text-white"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Week
              </button>
            </div>

            {/* Fill This Week */}
            <button
              onClick={handleFillWeek}
              disabled={backlog.length === 0}
              className="flex items-center gap-1.5 bg-coral text-white text-sm font-medium px-3 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Fill This Week
            </button>
          </div>
        </div>

        {/* Backlog pick banner */}
        {backlogPickPost && (
          <div className="flex items-center gap-2 bg-surface border border-coral/40 rounded-lg px-4 py-2 text-sm text-text-primary">
            <CalendarIcon className="w-4 h-4 text-coral shrink-0" />
            Click a day to schedule{" "}
            <span className="font-medium">
              &quot;{truncate(backlogPickPost.title, 30)}&quot;
            </span>
            <button
              onClick={() => setBacklogPickPost(null)}
              className="ml-auto text-text-muted hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---- MONTH VIEW ---- */}
        {viewMode === "month" && (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-px">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-text-muted py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {calendarDays.map((day, i) => {
                const key = toDateKey(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = isSameDay(day, today);
                const dayPosts = postsByDate[key] || [];

                return (
                  <div
                    key={i}
                    onClick={() => handleDayCellClick(day)}
                    className={`bg-surface min-h-[80px] p-1.5 cursor-pointer transition-colors hover:bg-bg/60 ${
                      isToday ? "ring-1 ring-inset ring-coral" : ""
                    } ${backlogPickPost ? "hover:ring-1 hover:ring-coral/60" : ""}`}
                  >
                    <span
                      className={`text-xs font-medium ${
                        isCurrentMonth
                          ? "text-text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayPosts.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = "/library";
                          }}
                          className="rounded px-1 py-0.5 text-[10px] leading-tight font-medium truncate cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: `${PILLAR_COLORS[p.pillar]}25`,
                            color: PILLAR_COLORS[p.pillar],
                          }}
                          title={`${p.title} (${PILLAR_LABELS[p.pillar]})`}
                        >
                          {truncate(p.title, 15)}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-text-muted">
                          +{dayPosts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- WEEK VIEW ---- */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {weekDays.map((day, i) => {
              const key = toDateKey(day);
              const isToday = isSameDay(day, today);
              const dayPosts = postsByDate[key] || [];

              return (
                <div
                  key={i}
                  onClick={() => handleDayCellClick(day)}
                  className={`bg-surface min-h-[200px] p-2 cursor-pointer transition-colors hover:bg-bg/60 ${
                    isToday ? "ring-1 ring-inset ring-coral" : ""
                  } ${backlogPickPost ? "hover:ring-1 hover:ring-coral/60" : ""}`}
                >
                  <div className="mb-2">
                    <span className="text-[11px] text-text-muted font-medium">
                      {DAY_HEADERS[i]}
                    </span>
                    <span
                      className={`ml-1 text-sm font-medium ${
                        isToday ? "text-coral" : "text-text-primary"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {dayPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = "/library";
                        }}
                        className="rounded-md border border-border bg-bg p-1.5 cursor-pointer hover:border-text-muted transition-colors"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <PillarDot pillar={p.pillar} />
                          <span className="text-xs text-text-primary font-medium truncate">
                            {truncate(p.title, 20)}
                          </span>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Backlog sidebar ---- */}
      <div className="lg:w-64 lg:border-l lg:border-border lg:pl-4 shrink-0">
        <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
          Backlog
        </h2>
        {backlog.length === 0 ? (
          <p className="text-sm text-text-muted">
            No unscheduled posts.
          </p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {backlog.map((p) => (
              <div
                key={p.id}
                onClick={() => handleBacklogClick(p)}
                className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${
                  backlogPickPost?.id === p.id
                    ? "border-coral bg-coral/5"
                    : "border-border bg-surface hover:border-text-muted"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <PillarDot pillar={p.pillar} />
                  <span className="text-sm text-text-primary font-medium truncate">
                    {p.title}
                  </span>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Schedule modal (click empty day) ---- */}
      {scheduleModalDate && !backlogPickPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading text-lg font-semibold text-text-primary">
                Schedule for{" "}
                {scheduleModalDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setScheduleModalDate(null)}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {backlog.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  No unscheduled posts available.
                </p>
              ) : (
                <div className="space-y-2">
                  {backlog.map((p) => (
                    <button
                      key={p.id}
                      onClick={async () => {
                        await schedulePost(p.id, scheduleModalDate);
                        setScheduleModalDate(null);
                      }}
                      className="w-full text-left rounded-lg border border-border bg-bg p-3 hover:border-text-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <PillarDot pillar={p.pillar} showLabel />
                        <span className="text-sm text-text-primary font-medium truncate">
                          {p.title}
                        </span>
                      </div>
                      <StatusBadge status={p.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Fill This Week modal ---- */}
      {fillWeekOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface border border-border rounded-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading text-lg font-semibold text-text-primary">
                Fill This Week
              </h3>
              <button
                onClick={() => {
                  setFillWeekOpen(false);
                  setFillSuggestions([]);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {fillLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Sparkles className="w-6 h-6 text-coral animate-pulse" />
                  <p className="text-sm text-text-muted">
                    AI is suggesting a schedule...
                  </p>
                </div>
              ) : fillSuggestions.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">
                  No suggestions generated. Try again or schedule manually.
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {fillSuggestions.map((s) => (
                    <div
                      key={s.postId}
                      className="flex items-center gap-3 rounded-lg border border-border bg-bg p-3"
                    >
                      <PillarDot pillar={s.pillar} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary font-medium truncate">
                          {s.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          {PILLAR_LABELS[s.pillar]}
                        </p>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(s.date + "T12:00:00").toLocaleDateString(
                          "en-US",
                          { weekday: "short", month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {fillSuggestions.length > 0 && !fillLoading && (
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
                <button
                  onClick={() => {
                    setFillWeekOpen(false);
                    setFillSuggestions([]);
                  }}
                  className="px-4 py-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFillWeek}
                  className="px-4 py-1.5 text-sm font-medium bg-coral text-white rounded hover:opacity-90 transition-opacity"
                >
                  Apply Schedule
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
