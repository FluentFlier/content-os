'use client';

import { Plus, ArrowUp, ArrowDown } from 'lucide-react';
import type { Post, Series } from '@/lib/types';
import PillarDot from '@/components/PillarDot';
import StatusBadge from '@/components/StatusBadge';

interface SeriesPostListProps {
  series: Series;
  posts: Post[];
  loading: boolean;
  reordering: boolean;
  onSwap: (postA: Post, postB: Post) => void;
  onAddPart: (position: number) => void;
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

export default function SeriesPostList({
  series,
  posts,
  loading,
  reordering,
  onSwap,
  onAddPart,
}: SeriesPostListProps) {
  if (loading) {
    return (
      <div className="text-[#71717A] text-[11px] py-4 text-center">
        Loading posts...
      </div>
    );
  }

  const slots = buildSlots(series, posts);

  return (
    <div className="space-y-1.5">
      {slots.map((post, idx) => {
        const position = idx + 1;

        if (!post) {
          return (
            <div
              key={`empty-${position}`}
              className="flex items-center justify-between px-3 py-2.5 rounded-[7px] border-[0.5px] border-dashed border-[#FAFAFA]/12"
            >
              <span className="text-[13px] text-[#71717A]">
                Part {position} - Not started
              </span>
              <button
                onClick={() => onAddPart(position)}
                className="flex items-center gap-1 text-[11px] text-[#6366F1] hover:opacity-80 transition-opacity"
              >
                <Plus size={14} />
                Add Post to Part
              </button>
            </div>
          );
        }

        const prevPost = idx > 0 ? slots[idx - 1] : null;
        const nextPost = idx < slots.length - 1 ? slots[idx + 1] : null;

        return (
          <div
            key={post.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[7px] bg-[#18181B] hover:bg-[#27272A] transition-colors"
          >
            {/* Position number */}
            <span className="text-[11px] font-medium text-[#71717A] w-6 text-center shrink-0">
              {position}
            </span>

            {/* Post info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#FAFAFA] truncate">{post.title}</p>
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
                  if (prevPost) onSwap(post, prevPost);
                }}
                disabled={!prevPost || reordering}
                className="p-0.5 rounded text-[#71717A] hover:text-[#FAFAFA] disabled:opacity-20 transition-colors"
                title="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => {
                  if (nextPost) onSwap(post, nextPost);
                }}
                disabled={!nextPost || reordering}
                className="p-0.5 rounded text-[#71717A] hover:text-[#FAFAFA] disabled:opacity-20 transition-colors"
                title="Move down"
              >
                <ArrowDown size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
