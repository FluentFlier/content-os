'use client';

import type { StoryBankEntry } from '@/lib/types';
import StoryCard from './StoryCard';

interface StoryGridProps {
  stories: StoryBankEntry[];
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
  onConvert: (story: StoryBankEntry) => void;
  onRemine: (story: StoryBankEntry) => void;
  onDelete: (story: StoryBankEntry) => void;
  convertingId: string | null;
  reminingId: string | null;
  deletingId: string | null;
}

export default function StoryGrid({
  stories,
  expandedId,
  onToggleExpand,
  onConvert,
  onRemine,
  onDelete,
  convertingId,
  reminingId,
  deletingId,
}: StoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          isExpanded={expandedId === story.id}
          onToggleExpand={() => onToggleExpand(story.id)}
          onConvert={() => onConvert(story)}
          onRemine={() => onRemine(story)}
          onDelete={() => onDelete(story)}
          converting={convertingId === story.id}
          remining={reminingId === story.id}
          deleting={deletingId === story.id}
        />
      ))}
    </div>
  );
}
