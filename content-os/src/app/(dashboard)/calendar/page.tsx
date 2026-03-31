"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  DragDropContext,
  type DropResult,
} from "@hello-pangea/dnd";
import { getInsforge } from "@/lib/insforge/client";
import type { Post } from "@/lib/types";
import { usePillars } from "@/hooks/usePillars";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarBacklog from "@/components/calendar/CalendarBacklog";
import { ScheduleModal, FillWeekModal } from "@/components/calendar/CalendarModals";

type ViewMode = "month" | "week";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - diff);
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

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "..." : s;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const { getLabel } = usePillars();
  const today = useMemo(() => new Date(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) return "week";
    return "month";
  });
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [weekBase, setWeekBase] = useState(today);

  // Modals
  const [scheduleModalDate, setScheduleModalDate] = useState<Date | null>(null);
  const [backlogPickPost, setBacklogPickPost] = useState<Post | null>(null);
  const [fillWeekOpen, setFillWeekOpen] = useState(false);
  const [fillSuggestions, setFillSuggestions] = useState<
    { postId: string; date: string; title: string; pillar: string }[]
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

  const backlog = useMemo(
    () => posts.filter((p) => !p.scheduled_date && p.status !== "posted"),
    [posts]
  );

  const hasScheduledPosts = useMemo(
    () => posts.some((p) => p.scheduled_date),
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

  /* ---- Drag and drop ---- */

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const droppableId = destination.droppableId;
    if (!droppableId.startsWith("day-") && !droppableId.startsWith("mday-")) return;

    const dateStr = droppableId.replace("day-", "").replace("mday-", "");
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);

    await schedulePost(draggableId, targetDate);
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

  const handlePostClick = (_post: Post) => {
    window.location.href = "/library";
  };

  /* ---- Fill This Week ---- */

  const handleFillWeek = async () => {
    if (!userId || backlog.length === 0) return;
    setFillLoading(true);
    setFillWeekOpen(true);

    try {
      const weekDays = getWeekDays(viewMode === "week" ? weekBase : today);
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
          pillar: string;
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

  const closeFillWeek = () => {
    setFillWeekOpen(false);
    setFillSuggestions([]);
  };

  /* ---- Loading skeleton ---- */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-[#18181B] rounded-[7px] animate-pulse" />
          <div className="h-9 w-28 bg-[#18181B] rounded-[7px] animate-pulse" />
        </div>
        <div className="grid grid-cols-7 gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#18181B] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const weekDaysForLabel = getWeekDays(weekBase);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Main calendar area */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="font-heading text-[22px] font-[800] text-[#FAFAFA] leading-[1.2] tracking-[-0.02em]">
              Calendar
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  onClick={viewMode === "month" ? goToPrevMonth : goToPrevWeek}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] border-[0.5px] border-[#FAFAFA]/12 text-[#71717A] hover:text-[#FAFAFA] hover:border-[#FAFAFA]/25 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] text-[#FAFAFA] font-medium min-w-[140px] text-center">
                  {viewMode === "month"
                    ? `${MONTH_NAMES[currentMonth]} ${currentYear}`
                    : `Week of ${weekDaysForLabel[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                </span>
                <button
                  onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
                  className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] border-[0.5px] border-[#FAFAFA]/12 text-[#71717A] hover:text-[#FAFAFA] hover:border-[#FAFAFA]/25 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] overflow-hidden">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-2 min-h-[44px] text-[11px] font-medium transition-colors ${
                    viewMode === "month"
                      ? "bg-[#6366F1] text-white"
                      : "text-[#71717A] hover:text-[#FAFAFA]"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-2 min-h-[44px] text-[11px] font-medium transition-colors ${
                    viewMode === "week"
                      ? "bg-[#6366F1] text-white"
                      : "text-[#71717A] hover:text-[#FAFAFA]"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>

          {/* Empty state guidance */}
          {!hasScheduledPosts && !backlogPickPost && (
            <div className="flex items-center gap-3 bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] px-4 py-3 text-[13px]">
              <CalendarDays className="w-5 h-5 text-[#6366F1] shrink-0" />
              <div>
                <p className="text-[#FAFAFA] font-medium">No content scheduled yet</p>
                <p className="text-[#71717A] text-[12px]">
                  Drag posts from the backlog onto a day, or click a day to schedule content.
                </p>
              </div>
            </div>
          )}

          {/* Backlog pick banner */}
          {backlogPickPost && (
            <div className="flex items-center gap-2 bg-[#09090B] border-[0.5px] border-[#6366F1]/40 rounded-[12px] px-4 py-2 text-[13px] text-[#FAFAFA]">
              <CalendarIcon className="w-4 h-4 text-[#6366F1] shrink-0" />
              Click a day to schedule{" "}
              <span className="font-medium">
                &quot;{truncate(backlogPickPost.title, 30)}&quot;
              </span>
              <button
                onClick={() => setBacklogPickPost(null)}
                className="ml-auto text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <CalendarGrid
            viewMode={viewMode}
            currentYear={currentYear}
            currentMonth={currentMonth}
            weekBase={weekBase}
            posts={posts}
            today={today}
            isPickMode={!!backlogPickPost}
            onDayCellClick={handleDayCellClick}
            onPostClick={handlePostClick}
          />
        </div>

        <CalendarBacklog
          backlog={backlog}
          selectedPostId={backlogPickPost?.id ?? null}
          onPostClick={handleBacklogClick}
          onFillWeek={handleFillWeek}
          fillDisabled={backlog.length === 0}
        />

        {scheduleModalDate && !backlogPickPost && (
          <ScheduleModal
            date={scheduleModalDate}
            backlog={backlog}
            onSchedule={async (postId) => {
              await schedulePost(postId, scheduleModalDate);
              setScheduleModalDate(null);
            }}
            onClose={() => setScheduleModalDate(null)}
          />
        )}

        {fillWeekOpen && (
          <FillWeekModal
            loading={fillLoading}
            suggestions={fillSuggestions}
            getLabel={getLabel}
            onConfirm={confirmFillWeek}
            onClose={closeFillWeek}
          />
        )}
      </div>
    </DragDropContext>
  );
}
