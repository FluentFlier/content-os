'use client';

import { useState } from 'react';
import { Wand2, Trash2 } from 'lucide-react';
import type { ContentIdea } from '@/lib/types';
import type { Priority } from '@/lib/constants';
import { usePillars } from '@/hooks/usePillars';

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string }> = {
  high: { bg: 'rgba(99,102,241,0.12)', text: '#4338CA' },
  medium: { bg: '#FAEEDA', text: '#854F0B' },
  low: { bg: '#18181B', text: '#71717A' },
};

interface IdeaRowProps {
  idea: ContentIdea;
  onToggleConverted: () => void;
  onUpdateText: (newText: string) => void;
  onConvertToScript: () => void;
  onDelete: () => void;
  converting: boolean;
}

export default function IdeaRow({
  idea,
  onToggleConverted,
  onUpdateText,
  onConvertToScript,
  onDelete,
  converting,
}: IdeaRowProps) {
  const { getColor, getLabel } = usePillars();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(idea.idea);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    const trimmed = editText.trim();
    if (trimmed) {
      onUpdateText(trimmed);
    }
    setEditing(false);
  }

  const pillarColor = getColor(idea.pillar);
  const priorityStyle = PRIORITY_STYLES[idea.priority];

  return (
    <div
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-[7px] hover:bg-[#18181B] transition-colors ${
        idea.converted ? 'opacity-50' : ''
      }`}
    >
      {/* Priority dot */}
      <span
        className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
        style={{
          backgroundColor:
            idea.priority === 'high'
              ? '#6366F1'
              : idea.priority === 'medium'
              ? '#F59E0B'
              : '#71717A',
        }}
      />

      {/* Converted toggle */}
      <button
        onClick={onToggleConverted}
        className={`mt-0.5 w-4 h-4 rounded border-[0.5px] shrink-0 transition-colors ${
          idea.converted
            ? 'bg-[#10B981] border-[#10B981]'
            : 'border-[#FAFAFA]/12 hover:border-[#FAFAFA]/25'
        }`}
        title={idea.converted ? 'Mark unconverted' : 'Mark converted'}
      >
        {idea.converted && (
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M3.5 8.5l3 3 6-6" />
          </svg>
        )}
      </button>

      {/* Idea text */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-full bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[7px] px-2 py-0.5 text-[13px] text-[#FAFAFA] focus:outline-none focus:border-[#FAFAFA]/40 transition-colors"
          />
        ) : (
          <p
            onClick={() => {
              setEditing(true);
              setEditText(idea.idea);
            }}
            className={`text-[13px] text-[#FAFAFA] cursor-text leading-[1.55] ${
              idea.converted ? 'line-through' : ''
            }`}
          >
            {idea.idea}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center gap-[6px] mt-1">
          <span
            className="inline-flex items-center px-[7px] py-[2px] rounded-[3px] text-[10px] font-medium tracking-[0.01em]"
            style={{
              backgroundColor: `${pillarColor}20`,
              color: pillarColor,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {getLabel(idea.pillar)}
          </span>
          <span
            className="inline-flex items-center px-[7px] py-[2px] rounded-[3px] text-[10px] font-medium capitalize tracking-[0.01em]"
            style={{
              backgroundColor: priorityStyle.bg,
              color: priorityStyle.text,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {idea.priority}
          </span>
        </div>
      </div>

      {/* Actions - always visible on mobile, hover on desktop */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onConvertToScript}
          disabled={converting}
          title="Convert to Script"
          className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] text-[#71717A] hover:text-[#534AB7] hover:bg-[#EEEDFE] transition-colors disabled:animate-pulse"
        >
          <Wand2 size={15} />
        </button>

        {confirmDelete ? (
          <button
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            className="px-3 py-2 min-h-[44px] rounded-[3px] text-[10px] font-medium bg-[rgba(99,102,241,0.12)] text-[#6366F1] hover:opacity-80 transition-opacity"
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[7px] text-[#71717A] hover:text-[#6366F1] hover:bg-[rgba(99,102,241,0.12)] transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
