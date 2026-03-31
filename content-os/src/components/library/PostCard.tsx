'use client';

import type { Post } from '@/lib/types';
import { usePillars } from '@/hooks/usePillars';
import StatusBadge from '@/components/ui/StatusBadge';
import PillarBadge from '@/components/ui/PillarBadge';
import { formatDateShort, truncate } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (post: Post) => void;
}

export default function PostCard({ post, selected, onSelect, onClick }: PostCardProps) {
  const { getColor } = usePillars();
  const borderColor = getColor(post.pillar);

  return (
    <div
      className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] cursor-pointer hover:border-[#FAFAFA]/25 transition-colors relative overflow-hidden"
      onClick={() => onClick(post)}
    >
      {/* Pillar left accent - 3px bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-[2px]"
        style={{ backgroundColor: borderColor }}
      />

      <div className="p-[13px_14px] pl-[18px]">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(post.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 w-4 h-4 accent-[#6366F1]"
        />

        {/* Title */}
        <h3 className="font-[500] text-[#FAFAFA] text-[13px] truncate pr-6 mb-2 leading-[1.3]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {post.title}
        </h3>

        {/* Badges */}
        <div className="flex items-center gap-[6px] mb-3">
          <PillarBadge pillar={post.pillar} />
          <StatusBadge status={post.status} />
        </div>

        {/* Script preview */}
        {post.script && (
          <p className="text-[13px] text-[#A1A1AA] leading-[1.55] mb-3 line-clamp-2">
            {truncate(post.script, 120)}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#71717A]">
          <span>{formatDateShort(post.scheduled_date)}</span>
          {post.status === 'posted' && (post.views !== null || post.saves !== null) && (
            <span className="flex gap-2">
              {post.views !== null && <span>{post.views} views</span>}
              {post.saves !== null && <span>{post.saves} saves</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
