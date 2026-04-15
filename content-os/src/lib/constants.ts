// Generic starter pillars shown before a user completes onboarding.
// Once onboarding is done, the usePillars hook reads from creator_profile
// and these are only used as fallback for any legacy posts.
export const PILLARS = [
  'hot-take',
  'tips',
  'story',
  'explainer',
  'behind-the-scenes',
  'research',
] as const;

export type Pillar = typeof PILLARS[number];

export const PILLAR_LABELS: Record<Pillar, string> = {
  'hot-take': 'Hot Take',
  tips: 'Tips',
  story: 'Story',
  explainer: 'Explainer',
  'behind-the-scenes': 'Behind the Scenes',
  research: 'Research',
};

export const PILLAR_COLORS: Record<Pillar, string> = {
  'hot-take': '#EF4444',
  tips: '#F59E0B',
  story: '#818CF8',
  explainer: '#A78BFA',
  'behind-the-scenes': '#34D399',
  research: '#22D3EE',
};

export const PILLAR_BADGE_BG: Record<Pillar, string> = {
  'hot-take': 'bg-[rgba(239,68,68,0.12)] text-[#FCA5A5]',
  tips: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
  story: 'bg-[rgba(129,140,248,0.12)] text-[#A5B4FC]',
  explainer: 'bg-[rgba(167,139,250,0.12)] text-[#C4B5FD]',
  'behind-the-scenes': 'bg-[rgba(52,211,153,0.12)] text-[#6EE7B7]',
  research: 'bg-[rgba(34,211,238,0.12)] text-[#67E8F9]',
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
  idea: 'bg-[rgba(255,255,255,0.06)] text-[#A1A1AA]',
  scripted: 'bg-[rgba(129,140,248,0.12)] text-[#A5B4FC]',
  filmed: 'bg-[rgba(245,158,11,0.12)] text-[#FCD34D]',
  edited: 'bg-[rgba(249,115,22,0.12)] text-[#FDBA74]',
  posted: 'bg-[rgba(52,211,153,0.12)] text-[#6EE7B7]',
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
