'use client';

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

export default function TemplateSelector() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-heading text-[15px] font-[700] text-[#FAFAFA]">
          Templates
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#27272A] text-[10px] font-body font-medium text-[#71717A] tracking-[0.05em] uppercase">
          Coming Soon
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50 pointer-events-none">
        {TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="text-left rounded-lg p-4 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12"
          >
            {/* Thumbnail placeholder */}
            <div className="flex items-center justify-center w-full h-24 rounded-md mb-3 bg-[#27272A] text-[#71717A]">
              {template.icon}
            </div>
            <p className="font-body text-[13px] font-medium text-[#FAFAFA]">
              {template.title}
            </p>
            <p className="font-body text-[11px] text-[#71717A] mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
