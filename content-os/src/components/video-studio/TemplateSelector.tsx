'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Zap,
  Film,
  BarChart3,
  Columns2,
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  {
    id: 'talking-head-captions',
    title: 'Talking Head with Captions',
    description: 'Auto-generated captions overlaid on your talking head video with animated styling.',
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    id: 'hook-content',
    title: 'Hook + Content',
    description: 'Eye-catching animated text intro followed by your main video content.',
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: 'story-highlights',
    title: 'Story Highlights',
    description: 'Compile multiple clips into a polished story highlights reel.',
    icon: <Film className="w-6 h-6" />,
  },
  {
    id: 'stats-overlay',
    title: 'Stats Overlay',
    description: 'Animated statistics and data points overlaid on your video.',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: 'before-after',
    title: 'Before/After',
    description: 'Split-screen comparison with smooth transition between two clips.',
    icon: <Columns2 className="w-6 h-6" />,
  },
];

interface TemplateSelectorProps {
  onSelect?: (templateId: string) => void;
}

export default function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-[15px] font-[700] text-[#1A1714]">
        Templates
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.id;
          return (
            <button
              key={template.id}
              onClick={() => handleSelect(template.id)}
              className={`text-left rounded-lg p-4 transition-all duration-150 ${
                isSelected
                  ? 'bg-[#FAECE7] border-[1.5px] border-[#EB5E55]'
                  : 'bg-[#F4F2EF] border-[0.5px] border-[#1A1714]/12 hover:border-[#1A1714]/25'
              }`}
            >
              {/* Thumbnail placeholder */}
              <div
                className={`flex items-center justify-center w-full h-24 rounded-md mb-3 ${
                  isSelected ? 'bg-[#EB5E55]/10 text-[#EB5E55]' : 'bg-[#EDECEA] text-[#8C857D]'
                }`}
              >
                {template.icon}
              </div>
              <p
                className={`font-body text-[13px] font-medium ${
                  isSelected ? 'text-[#EB5E55]' : 'text-[#1A1714]'
                }`}
              >
                {template.title}
              </p>
              <p className="font-body text-[11px] text-[#8C857D] mt-1 line-clamp-2">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
