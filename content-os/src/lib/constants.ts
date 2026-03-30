export const PILLARS = [
  'hot-take',
  'hackathon',
  'founder',
  'explainer',
  'origin',
  'research',
] as const;

export type Pillar = typeof PILLARS[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  'hot-take': 'Hot Take',
  hackathon: 'Hackathon',
  founder: 'Founder',
  explainer: 'Explainer',
  origin: 'Origin',
  research: 'Research',
};

export const PILLAR_COLORS: Record<Pillar, string> = {
  'hot-take': '#EF4444',
  hackathon: '#F59E0B',
  founder: '#6366F1',
  explainer: '#8B5CF6',
  origin: '#10B981',
  research: '#06B6D4',
};

export const PILLAR_BADGE_BG: Record<Pillar, string> = {
  'hot-take': 'bg-[#FEF2F2] text-[#991B1B]',
  hackathon: 'bg-[#FFFBEB] text-[#92400E]',
  founder: 'bg-[#EEF2FF] text-[#3730A3]',
  explainer: 'bg-[#F5F3FF] text-[#5B21B6]',
  origin: 'bg-[#ECFDF5] text-[#065F46]',
  research: 'bg-[#ECFEFF] text-[#155E75]',
};

export const STATUSES = ['idea', 'scripted', 'filmed', 'edited', 'posted'] as const;
export type Status = typeof STATUSES[number];

export const STATUS_LABELS: Record<Status, string> = {
  idea: 'Idea',
  scripted: 'Scripted',
  filmed: 'Filmed',
  edited: 'Edited',
  posted: 'Posted',
};

export const STATUS_BADGE: Record<Status, string> = {
  idea: 'bg-[#F1F5F9] text-[#64748B]',
  scripted: 'bg-[#EEF2FF] text-[#3730A3]',
  filmed: 'bg-[#FFFBEB] text-[#92400E]',
  edited: 'bg-[#FFF7ED] text-[#9A3412]',
  posted: 'bg-[#ECFDF5] text-[#065F46]',
};

export const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'threads'] as const;
export type Platform = typeof PLATFORMS[number];

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export type Priority = typeof PRIORITIES[number];

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: 'home' },
  { label: 'Generate', href: '/generate', icon: 'wand' },
  { label: 'Library', href: '/library', icon: 'grid' },
  { label: 'Calendar', href: '/calendar', icon: 'calendar' },
  { label: 'Story Bank', href: '/story-bank', icon: 'archive' },
  { label: 'Ideas', href: '/ideas', icon: 'lightbulb' },
  { label: 'Series', href: '/series', icon: 'layers' },
  { label: 'Analytics', href: '/analytics', icon: 'bar-chart' },
  { label: 'Settings', href: '/settings', icon: 'gear' },
] as const;
