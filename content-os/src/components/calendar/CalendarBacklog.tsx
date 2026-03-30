'use client';

import { Sparkles } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Post } from '@/lib/types';
import PillarDot from '@/components/PillarDot';
import StatusBadge from '@/components/StatusBadge';

interface CalendarBacklogProps {
  backlog: Post[];
  selectedPostId: string | null;
  onPostClick: (post: Post) => void;
  onFillWeek: () => void;
  fillDisabled: boolean;
}

export default function CalendarBacklog({
  backlog,
  selectedPostId,
  onPostClick,
  onFillWeek,
  fillDisabled,
}: CalendarBacklogProps) {
  return (
    <div className="lg:w-[280px] lg:border-l-[0.5px] lg:border-[#1A1714]/12 lg:pl-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-[16px] font-[700] text-[#1A1714]">
          Unscheduled
        </h2>
        <button
          onClick={onFillWeek}
          disabled={fillDisabled}
          className="flex items-center gap-1.5 bg-[#EB5E55] text-white text-[11px] font-medium px-2.5 py-1.5 rounded-[7px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Fill This Week
        </button>
      </div>

      {backlog.length === 0 ? (
        <p className="text-[13px] text-[#8C857D]">No unscheduled posts.</p>
      ) : (
        <Droppable droppableId="backlog" isDropDisabled>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 max-h-[60vh] overflow-y-auto pr-1"
            >
              {backlog.map((p, index) => (
                <Draggable key={p.id} draggableId={p.id} index={index}>
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      onClick={() => onPostClick(p)}
                      className={`rounded-[12px] border-[0.5px] p-2.5 cursor-grab transition-colors ${
                        dragSnapshot.isDragging
                          ? 'border-[#EB5E55] bg-[#FAECE7] shadow-lg rotate-2'
                          : selectedPostId === p.id
                          ? 'border-[#EB5E55] bg-[#FAECE7]'
                          : 'border-[#1A1714]/12 bg-[#FAFAF8] hover:border-[#1A1714]/25'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PillarDot pillar={p.pillar} />
                        <span className="text-[13px] text-[#1A1714] font-medium truncate">
                          {p.title}
                        </span>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}
