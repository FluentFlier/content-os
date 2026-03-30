import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, startOfWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '--';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateShort(date: string | Date | null): string {
  if (!date) return '--';
  return format(new Date(date), 'MMM d');
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

type StatusType = 'idea' | 'scripted' | 'filmed' | 'edited' | 'posted';

export function nextStatus(current: StatusType): StatusType {
  const pipeline = ['idea', 'scripted', 'filmed', 'edited', 'posted'] as const;
  const idx = pipeline.indexOf(current as typeof pipeline[number]);
  if (idx === pipeline.length - 1) return current;
  return pipeline[idx + 1] as StatusType;
}
