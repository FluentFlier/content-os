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
  'hot-take': '#EB5E55',
  hackathon: '#F5C842',
  founder: '#4D96FF',
  explainer: '#C77DFF',
  origin: '#5CB85C',
  research: '#F5C842',
};

export const PILLAR_BADGE_BG: Record<Pillar, string> = {
  'hot-take': 'bg-[#FAECE7] text-[#993C1D]',
  hackathon: 'bg-[#FAEEDA] text-[#854F0B]',
  founder: 'bg-[#E6F1FB] text-[#185FA5]',
  explainer: 'bg-[#EEEDFE] text-[#534AB7]',
  origin: 'bg-[#EAF3DE] text-[#3B6D11]',
  research: 'bg-[#FAEEDA] text-[#854F0B]',
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
  idea: 'bg-[#F4F2EF] text-[#8C857D]',
  scripted: 'bg-[#E6F1FB] text-[#185FA5]',
  filmed: 'bg-[#FAEEDA] text-[#854F0B]',
  edited: 'bg-[#FAECE7] text-[#993C1D]',
  posted: 'bg-[#EAF3DE] text-[#3B6D11]',
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
