import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  Layers,
  CheckCircle2,
  Flame,
  Wand2,
  BookOpen,
  PlusCircle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { getServerClient, getAuthenticatedUser } from '@/lib/insforge/server';
import type { Post, ContentIdea } from '@/lib/types';
import type { Pillar, Priority, Status } from '@/lib/constants';
import { PILLAR_COLORS, STATUS_BADGE, STATUS_LABELS } from '@/lib/constants';

/** Resolve a pillar color with graceful fallback for custom pillars. */
function getPillarColor(pillar: string): string {
  return PILLAR_COLORS[pillar as Pillar] ?? '#94A3B8';
}
import { formatDateShort, formatRelative } from '@/lib/utils';
import TodaysPrompt from '@/components/dashboard/TodaysPrompt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekBounds(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function computeStreak(postedDates: string[]): number {
  if (postedDates.length === 0) return 0;
  const unique = Array.from(new Set(postedDates)).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (unique.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#6366F1',
  medium: '#F59E0B',
  low: '#5A5047',
};

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-['Space_Grotesk'] text-[13px] text-[#94A3B8]">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const client = getServerClient();
  const uid = user.id;
  const { start, end } = getWeekBounds();
  const today = new Date().toISOString().slice(0, 10);

  // Fire all queries in parallel
  const [weekPostsRes, pipelineRes, postedRes, streakRes, upNextRes, recentRes, ideasRes, weekScheduleRes] =
    await Promise.all([
      client.database.from('posts').select('id').eq('user_id', uid).eq('status', 'posted').gte('posted_date', start).lte('posted_date', end),
      client.database.from('posts').select('id').eq('user_id', uid).neq('status', 'posted').neq('status', 'idea'),
      client.database.from('posts').select('id').eq('user_id', uid).eq('status', 'posted'),
      client.database.from('posts').select('posted_date').eq('user_id', uid).not('posted_date', 'is', null).order('posted_date', { ascending: false }),
      client.database.from('posts').select('*').eq('user_id', uid).gte('scheduled_date', today).neq('status', 'posted').order('scheduled_date', { ascending: true }).limit(3),
      client.database.from('posts').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(5),
      client.database.from('content_ideas').select('*').eq('user_id', uid).eq('converted', false).order('priority', { ascending: true }).limit(3),
      client.database.from('posts').select('title, pillar, status').eq('user_id', uid).gte('scheduled_date', start).lte('scheduled_date', end),
    ]);

  const postsThisWeek = weekPostsRes.data?.length ?? 0;
  const inPipeline = pipelineRes.data?.length ?? 0;
  const totalPosted = postedRes.data?.length ?? 0;

  const dates = (streakRes.data ?? [])
    .map((r: { posted_date: string | null }) => r.posted_date)
    .filter(Boolean) as string[];
  const streak = computeStreak(dates);

  const upNext = (upNextRes.data as Post[]) ?? [];
  const recentActivity = (recentRes.data as Post[]) ?? [];
  const backlog = (ideasRes.data as ContentIdea[]) ?? [];

  // Build summary for AI prompt
  const weekPosts = weekScheduleRes.data ?? [];
  const postsSummary =
    weekPosts.length > 0
      ? weekPosts
          .map((p: { title: string; pillar: string; status: string }) => `"${p.title}" (${p.pillar}, ${p.status})`)
          .join(', ')
      : 'No posts this week yet.';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting */}
      <h1 className="font-display font-[800] text-[21px] text-[#0F172A] tracking-[-0.02em] leading-[1.2] pt-2">
        What are we building today?
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CalendarClock} value={postsThisWeek} label="Posts this week" accent={false} />
        <StatCard icon={Layers} value={inPipeline} label="In pipeline" accent={false} />
        <StatCard icon={CheckCircle2} value={totalPosted} label="Total posted" accent={false} />
        <StatCard icon={Flame} value={streak} label="Day streak" accent />
      </div>

      {/* Middle row: Up Next + Today's Prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Up Next */}
        <section className="bg-[#FFFFFF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
          <SectionLabel>UP NEXT</SectionLabel>
          {upNext.length === 0 ? (
            <p className="font-['Space_Grotesk'] text-[13px] text-[#94A3B8]">Nothing scheduled. Time to plan some content.</p>
          ) : (
            <ul className="space-y-2">
              {upNext.map((post) => (
                <li key={post.id}>
                  <Link href="/library" className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-block w-[3px] h-8 rounded-r-[2px] shrink-0"
                        style={{ backgroundColor: getPillarColor(post.pillar) }}
                      />
                      <span className="font-['Space_Grotesk'] text-[13px] font-medium text-[#0F172A] truncate group-hover:text-[#6366F1] transition-colors duration-100">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-['Space_Grotesk'] text-[10px] font-medium text-[#94A3B8] bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[3px] px-[7px] py-[2px] capitalize tracking-[0.05em]">
                        {post.platform}
                      </span>
                      <span className={`inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-['Space_Grotesk'] text-[10px] font-medium tracking-[0.01em] ${STATUS_BADGE[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                      {post.scheduled_date && (
                        <span className="font-['Space_Grotesk'] text-[11px] text-[#94A3B8]">{formatDateShort(post.scheduled_date)}</span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's Prompt (Client Component) */}
        <TodaysPrompt postsSummary={postsSummary} />
      </div>

      {/* Backlog */}
      <section className="bg-[#FFFFFF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">BACKLOG</SectionLabel>
          <Link href="/ideas" className="font-['Space_Grotesk'] text-[11px] text-[#94A3B8] hover:text-[#6366F1] transition-colors duration-100 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {backlog.length === 0 ? (
          <p className="font-['Space_Grotesk'] text-[13px] text-[#94A3B8]">Nothing queued. Add an idea before you forget it.</p>
        ) : (
          <ul className="space-y-2">
            {backlog.map((idea) => (
              <li key={idea.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: getPillarColor(idea.pillar) }}
                  />
                  <span className="font-['Space_Grotesk'] text-[13px] text-[#0F172A] truncate">{idea.idea}</span>
                </div>
                <span
                  className="inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-['Space_Grotesk'] text-[10px] font-medium capitalize shrink-0 tracking-[0.01em]"
                  style={{
                    backgroundColor: `${PRIORITY_COLORS[idea.priority]}20`,
                    color: PRIORITY_COLORS[idea.priority],
                  }}
                >
                  {idea.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <SectionLabel>QUICK ACTIONS</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/generate" icon={Wand2} label="Generate Script" />
          <QuickAction href="/generate?tab=story-mine" icon={BookOpen} label="Mine a Story" />
          <QuickAction href="/library?action=new" icon={PlusCircle} label="Log a Post" />
          <QuickAction href="/ideas" icon={Lightbulb} label="Add Idea" />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="bg-[#FFFFFF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
        <SectionLabel>RECENT ACTIVITY</SectionLabel>
        {recentActivity.length === 0 ? (
          <p className="font-['Space_Grotesk'] text-[13px] text-[#94A3B8]">No recent activity.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: getPillarColor(post.pillar) }}
                  />
                  <span className="font-['Space_Grotesk'] text-[13px] text-[#0F172A] truncate">{post.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-['Space_Grotesk'] text-[10px] font-medium tracking-[0.01em] ${STATUS_BADGE[post.status]}`}>
                    {STATUS_LABELS[post.status]}
                  </span>
                  <span className="font-['Space_Grotesk'] text-[11px] text-[#94A3B8]">{formatRelative(post.updated_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-['Space_Grotesk'] font-medium text-[10px] uppercase tracking-[0.10em] text-[#94A3B8] mb-3 ${className}`}>
      {children}
    </p>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#FFFFFF] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[12px] p-[13px_14px]">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={16} className="text-[#94A3B8]" />
        <span className={`font-['Space_Grotesk'] text-[22px] font-medium ${accent ? 'text-[#6366F1]' : 'text-[#0F172A]'}`}>{value}</span>
      </div>
      <p className="font-['Space_Grotesk'] text-[11px] text-[#94A3B8]">{label}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 bg-[#F8FAFC] border-[0.5px] border-[rgba(26,23,20,0.12)] rounded-[7px] p-[10px_14px] hover:border-[rgba(26,23,20,0.25)] transition-colors duration-100 group"
    >
      <Icon size={18} className="text-[#94A3B8] group-hover:text-[#475569] transition-colors duration-100" />
      <span className="font-['Space_Grotesk'] text-[11px] text-[#475569] group-hover:text-[#0F172A] transition-colors duration-100 text-center">
        {label}
      </span>
    </Link>
  );
}
