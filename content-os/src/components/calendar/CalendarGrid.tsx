'use client';

import { useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Post } from '@/lib/types';
import { usePillars } from '@/hooks/usePillars';
import PillarDot from '@/components/PillarDot';
import StatusBadge from '@/components/StatusBadge';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startDate.setDate(startDate.getDate() - diff);
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
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function truncateText(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

const DAY_HEADERS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ViewMode = 'month' | 'week';

interface CalendarGridProps {
  viewMode: ViewMode;
  currentYear: number;
  currentMonth: number;
  weekBase: Date;
  posts: Post[];
  today: Date;
  isPickMode: boolean;
  onDayCellClick: (day: Date) => void;
  onPostClick: (post: Post) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CalendarGrid({
  viewMode,
  currentYear,
  currentMonth,
  weekBase,
  posts,
  today,
  isPickMode,
  onDayCellClick,
  onPostClick,
}: CalendarGridProps) {
  const { getColor, getLabel } = usePillars();

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

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const days = viewMode === 'month' ? calendarDays : weekDays;

  /* Mobile list view - shows days as a list on small screens.
     For month view: only show days with posts (and today) to avoid a huge list.
     For week view: show all 7 days. */
  const mobileDays = viewMode === 'week'
    ? days
    : days.filter((day) => {
        const key = toDateKey(day);
        return (postsByDate[key]?.length ?? 0) > 0 || isSameDay(day, today);
      });

  const mobileListView = (
    <div className="sm:hidden space-y-2">
      {viewMode === 'month' && mobileDays.length === 0 && (
        <p className="text-[13px] text-[#71717A] text-center py-4">No scheduled posts this month.</p>
      )}
      {mobileDays.map((day, i) => {
        const key = toDateKey(day);
        const isToday = isSameDay(day, today);
        const dayPosts = postsByDate[key] || [];
        const dayOfWeek = day.getDay();
        const dayLabel = DAY_HEADERS_MON[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

        return (
          <Droppable key={`mobile-${key}`} droppableId={`mday-${key}`}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                onClick={() => onDayCellClick(day)}
                className={`rounded-[12px] border-[0.5px] border-[#FAFAFA]/12 bg-[#09090B] p-3 cursor-pointer transition-colors ${
                  isToday ? 'ring-1 ring-inset ring-[#6366F1]' : ''
                } ${isPickMode ? 'hover:ring-1 hover:ring-[#6366F1]/60' : ''} ${
                  snapshot.isDraggingOver
                    ? 'bg-[rgba(99,102,241,0.12)] ring-2 ring-inset ring-[#6366F1]/50'
                    : 'hover:bg-[#18181B]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] text-[#71717A] font-medium">
                    {dayLabel}
                  </span>
                  <span
                    className={`text-[14px] font-medium ${
                      isToday ? 'text-[#6366F1]' : 'text-[#FAFAFA]'
                    }`}
                  >
                    {viewMode === 'month'
                      ? `${day.toLocaleDateString('en-US', { month: 'short' })} ${day.getDate()}`
                      : day.getDate()}
                  </span>
                  {dayPosts.length === 0 && (
                    <span className="text-[11px] text-[#71717A] ml-auto">No posts</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {dayPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick(p);
                      }}
                      className="rounded-[7px] border-[0.5px] border-[#FAFAFA]/12 bg-[#18181B] p-2.5 min-h-[44px] cursor-pointer hover:border-[#FAFAFA]/25 transition-colors flex items-center gap-2"
                    >
                      <PillarDot pillar={p.pillar} />
                      <span className="text-[13px] text-[#FAFAFA] font-medium truncate flex-1">
                        {truncateText(p.title, 30)}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Mobile list view for week mode */}
      {mobileListView}

      {/* Desktop grid view - hidden on mobile */}
      <div className="hidden sm:block">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {DAY_HEADERS_MON.map((d) => (
            <div
              key={d}
              className="font-body text-center text-[10px] font-medium text-[#71717A] py-2 uppercase tracking-[0.1em]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] overflow-hidden">
          {days.map((day, i) => {
            const key = toDateKey(day);
            const isCurrentMonth =
              viewMode === 'month' ? day.getMonth() === currentMonth : true;
            const isToday = isSameDay(day, today);
            const dayPosts = postsByDate[key] || [];
            const isWeekView = viewMode === 'week';

            const col = i % 7;
            const row = Math.floor(i / 7);
            const totalRows = Math.ceil(days.length / 7);
            const borderClasses = [
              col < 6 ? 'border-r-[0.5px]' : '',
              row < totalRows - 1 ? 'border-b-[0.5px]' : '',
              'border-[#FAFAFA]/12',
            ].join(' ');

            return (
              <Droppable key={i} droppableId={`day-${key}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => onDayCellClick(day)}
                    className={`bg-[#09090B] cursor-pointer transition-colors ${borderClasses} ${
                      isWeekView ? 'min-h-[200px] p-2' : 'min-h-[80px] p-1.5'
                    } ${isToday ? 'ring-1 ring-inset ring-[#6366F1]' : ''} ${
                      isPickMode ? 'hover:ring-1 hover:ring-[#6366F1]/60' : ''
                    } ${
                      snapshot.isDraggingOver
                        ? 'bg-[rgba(99,102,241,0.12)] ring-2 ring-inset ring-[#6366F1]/50'
                        : 'hover:bg-[#27272A]'
                    }`}
                  >
                    {isWeekView ? (
                      <div className="mb-2">
                        <span className="text-[11px] text-[#71717A] font-medium">
                          {DAY_HEADERS_MON[i]}
                        </span>
                        <span
                          className={`ml-1 text-[13px] font-medium ${
                            isToday ? 'text-[#6366F1]' : 'text-[#FAFAFA]'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`text-[11px] font-medium ${
                          isCurrentMonth ? 'text-[#FAFAFA]' : 'text-[#71717A]'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    )}

                    <div className={isWeekView ? 'space-y-1.5' : 'mt-0.5 space-y-0.5'}>
                      {(isWeekView ? dayPosts : dayPosts.slice(0, 3)).map((p) =>
                        isWeekView ? (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPostClick(p);
                            }}
                            className="rounded-[7px] border-[0.5px] border-[#FAFAFA]/12 bg-[#09090B] p-1.5 cursor-pointer hover:border-[#FAFAFA]/25 transition-colors"
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <PillarDot pillar={p.pillar} />
                              <span className="text-[11px] text-[#FAFAFA] font-medium truncate">
                                {truncateText(p.title, 20)}
                              </span>
                            </div>
                            <StatusBadge status={p.status} />
                          </div>
                        ) : (
                          <div
                            key={p.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPostClick(p);
                            }}
                            className="rounded-[3px] px-1 py-0.5 text-[10px] leading-tight font-medium truncate cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: `${getColor(p.pillar)}25`,
                              color: getColor(p.pillar),
                            }}
                            title={`${p.title} (${getLabel(p.pillar)})`}
                          >
                            {truncateText(p.title, 15)}
                          </div>
                        )
                      )}
                      {!isWeekView && dayPosts.length > 3 && (
                        <span className="text-[10px] text-[#71717A]">
                          +{dayPosts.length - 3} more
                        </span>
                      )}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </div>
    </div>
  );
}
