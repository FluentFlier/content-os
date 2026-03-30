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

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {DAY_HEADERS_MON.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-[#8C857D] py-2 uppercase tracking-[0.1em]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-[0.5px] border-[#1A1714]/12 rounded-[12px] overflow-hidden">
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
            'border-[#1A1714]/12',
          ].join(' ');

          return (
            <Droppable key={i} droppableId={`day-${key}`}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  onClick={() => onDayCellClick(day)}
                  className={`bg-[#FAFAF8] cursor-pointer transition-colors ${borderClasses} ${
                    isWeekView ? 'min-h-[200px] p-2' : 'min-h-[80px] p-1.5'
                  } ${isToday ? 'ring-1 ring-inset ring-[#EB5E55]' : ''} ${
                    isPickMode ? 'hover:ring-1 hover:ring-[#EB5E55]/60' : ''
                  } ${
                    snapshot.isDraggingOver
                      ? 'bg-[#FAECE7] ring-2 ring-inset ring-[#EB5E55]/50'
                      : 'hover:bg-[#EDECEA]'
                  }`}
                >
                  {isWeekView ? (
                    <div className="mb-2">
                      <span className="text-[11px] text-[#8C857D] font-medium">
                        {DAY_HEADERS_MON[i]}
                      </span>
                      <span
                        className={`ml-1 text-[13px] font-medium ${
                          isToday ? 'text-[#EB5E55]' : 'text-[#1A1714]'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-[11px] font-medium ${
                        isCurrentMonth ? 'text-[#1A1714]' : 'text-[#8C857D]'
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
                          className="rounded-[7px] border-[0.5px] border-[#1A1714]/12 bg-[#FAFAF8] p-1.5 cursor-pointer hover:border-[#1A1714]/25 transition-colors"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <PillarDot pillar={p.pillar} />
                            <span className="text-[11px] text-[#1A1714] font-medium truncate">
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
                      <span className="text-[10px] text-[#8C857D]">
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
  );
}
