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
  Link2,
  AlertCircle,
} from 'lucide-react';
import { getServerClient, getAuthenticatedUser } from '@/lib/insforge/server';
import type { Post, ContentIdea } from '@/lib/types';
import type { Pillar, Priority, Status } from '@/lib/constants';
import { PILLAR_COLORS, STATUS_BADGE, STATUS_LABELS } from '@/lib/constants';

/** Resolve a pillar color with graceful fallback for custom pillars. */
function getPillarColor(pillar: string): string {
  return PILLAR_COLORS[pillar as Pillar] ?? '#71717A';
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
  const uid = user?.id;

  if (!uid) {
    // No server-side auth -- show welcome state
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="font-display font-[700] text-[20px] text-text-primary mb-2">Welcome to Dispatch</h2>
        <p className="text-[14px] text-text-secondary mb-6 max-w-md">Your dashboard will populate once you start creating content. Use the Generate tab to get started.</p>
        <a href="/generate" className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white bg-coral hover:bg-coral-dark transition-all">Start Generating</a>
      </div>
    );
  }

  const client = await getServerClient();
  const { start, end } = getWeekBounds();
  const today = new Date().toISOString().slice(0, 10);

  // Fire all queries in parallel
  const [weekPostsRes, pipelineRes, postedRes, streakRes, upNextRes, recentRes, ideasRes, weekScheduleRes, profileRes, socialRes] =
    await Promise.all([
      client.database.from('posts').select('id').eq('user_id', uid).eq('status', 'posted').gte('posted_date', start).lte('posted_date', end),
      client.database.from('posts').select('id').eq('user_id', uid).neq('status', 'posted').neq('status', 'idea'),
      client.database.from('posts').select('id').eq('user_id', uid).eq('status', 'posted'),
      client.database.from('posts').select('posted_date').eq('user_id', uid).not('posted_date', 'is', null).order('posted_date', { ascending: false }),
      client.database.from('posts').select('*').eq('user_id', uid).gte('scheduled_date', today).neq('status', 'posted').order('scheduled_date', { ascending: true }).limit(3),
      client.database.from('posts').select('*').eq('user_id', uid).order('updated_at', { ascending: false }).limit(5),
      client.database.from('content_ideas').select('*').eq('user_id', uid).eq('converted', false).order('created_at', { ascending: false }).limit(20),
      client.database.from('posts').select('title, pillar, status').eq('user_id', uid).gte('scheduled_date', start).lte('scheduled_date', end),
      client.database.from('creator_profile').select('display_name, content_pillars, voice_description, onboarding_complete').eq('user_id', uid).maybeSingle(),
      client.database.from('social_accounts').select('platform, connection_method').eq('user_id', uid),
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
  const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const backlog = ((ideasRes.data as ContentIdea[]) ?? [])
    .slice()
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99))
    .slice(0, 3);

  // Setup progress
  const creatorProfile = profileRes.data;
  const connectedPlatforms = (socialRes.data ?? []).map((s: { platform: string }) => s.platform);
  const hasProfile = Boolean(creatorProfile?.display_name && creatorProfile?.content_pillars);
  const hasVoice = Boolean(creatorProfile?.voice_description);
  const hasConnections = connectedPlatforms.length > 0;
  const allPlatforms = ['twitter', 'linkedin', 'instagram', 'threads'];
  const setupComplete = hasProfile && hasVoice && hasConnections;

  // Build summary for AI prompt
  const weekPosts = weekScheduleRes.data ?? [];
  const postsSummary =
    weekPosts.length > 0
      ? weekPosts
          .map((p: { title: string; pillar: string; status: string }) => `"${p.title}" (${p.pillar}, ${p.status})`)
          .join(', ')
      : 'No posts this week yet.';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <h1 className="font-display font-[800] text-[21px] text-[#FAFAFA] tracking-[-0.02em] leading-[1.2] pt-2">
        {creatorProfile?.display_name ? `Hey ${creatorProfile.display_name.split(' ')[0]}, what are we shipping?` : 'What are we building today?'}
      </h1>

      {/* Setup checklist -- only show if setup is incomplete */}
      {!setupComplete && (
        <section className="bg-[#09090B] border-[0.5px] border-[rgba(129,140,248,0.25)] rounded-[12px] p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#818CF8]" />
            <span className="text-[12px] font-medium text-[#FAFAFA]">Finish setting up to unlock publishing</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <SetupStep done={hasProfile} label="Set up profile" href="/settings" />
            <SetupStep done={hasVoice} label="Define your voice" href="/voice-lab" />
            <SetupStep done={hasConnections} label="Connect a platform" href="/settings" />
          </div>
        </section>
      )}

      {/* Connection status */}
      {hasConnections && (
        <div className="flex items-center gap-2 flex-wrap">
          <Link2 size={12} className="text-[#52525B]" />
          {allPlatforms.map((p) => {
            const connected = connectedPlatforms.includes(p);
            return (
              <span key={p} className={`text-[10px] font-medium px-2 py-0.5 rounded-[3px] capitalize ${
                connected
                  ? 'bg-[rgba(16,185,129,0.12)] text-[#10B981]'
                  : 'bg-[#18181B] text-[#52525B]'
              }`}>
                {p === 'twitter' ? 'X' : p}
              </span>
            );
          })}
          {connectedPlatforms.length < 4 && (
            <Link href="/settings" className="text-[10px] text-[#818CF8] hover:text-[#A5B4FC] transition-colors">+ connect more</Link>
          )}
        </div>
      )}

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
        <section className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px]">
          <SectionLabel>UP NEXT</SectionLabel>
          {upNext.length === 0 ? (
            <p className="font-body text-[13px] text-[#71717A]">Nothing scheduled. Time to plan some content.</p>
          ) : (
            <ul className="space-y-2">
              {upNext.map((post) => (
                <li key={post.id}>
                  <Link href="/library" className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 group min-h-[44px] py-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="inline-block w-[3px] h-8 rounded-r-[2px] shrink-0"
                        style={{ backgroundColor: getPillarColor(post.pillar) }}
                      />
                      <span className="font-body text-[13px] font-medium text-[#FAFAFA] truncate group-hover:text-[#6366F1] transition-colors duration-100">
                        {post.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-6 sm:ml-0">
                      <span className="font-body text-[10px] font-medium text-[#71717A] bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[3px] px-[7px] py-[2px] capitalize tracking-[0.05em]">
                        {post.platform}
                      </span>
                      <span className={`inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-body text-[10px] font-medium tracking-[0.01em] ${STATUS_BADGE[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                      {post.scheduled_date && (
                        <span className="font-body text-[11px] text-[#71717A]">{formatDateShort(post.scheduled_date)}</span>
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
      <section className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px]">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel className="mb-0">BACKLOG</SectionLabel>
          <Link href="/ideas" className="font-body text-[11px] text-[#71717A] hover:text-[#6366F1] transition-colors duration-100 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {backlog.length === 0 ? (
          <p className="font-body text-[13px] text-[#71717A]">Nothing queued. Add an idea before you forget it.</p>
        ) : (
          <ul className="space-y-2">
            {backlog.map((idea) => (
              <li key={idea.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: getPillarColor(idea.pillar) }}
                  />
                  <span className="font-body text-[13px] text-[#FAFAFA] truncate">{idea.idea}</span>
                </div>
                <span
                  className="inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-body text-[10px] font-medium capitalize shrink-0 tracking-[0.01em]"
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
      <section className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px]">
        <SectionLabel>RECENT ACTIVITY</SectionLabel>
        {recentActivity.length === 0 ? (
          <p className="font-body text-[13px] text-[#71717A]">No recent activity.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="inline-block w-[6px] h-[6px] rounded-full shrink-0"
                    style={{ backgroundColor: getPillarColor(post.pillar) }}
                  />
                  <span className="font-body text-[13px] text-[#FAFAFA] truncate">{post.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-[7px] py-[2px] rounded-[3px] font-body text-[10px] font-medium tracking-[0.01em] ${STATUS_BADGE[post.status]}`}>
                    {STATUS_LABELS[post.status]}
                  </span>
                  <span className="font-body text-[11px] text-[#71717A]">{formatRelative(post.updated_at)}</span>
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
    <p className={`font-body font-medium text-[10px] uppercase tracking-[0.10em] text-[#71717A] mb-3 ${className}`}>
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
    <div className="bg-[#09090B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[12px] p-[13px_14px]">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={16} className="text-[#71717A]" />
        <span className={`font-body text-[22px] font-medium ${accent ? 'text-[#6366F1]' : 'text-[#FAFAFA]'}`}>{value}</span>
      </div>
      <p className="font-body text-[11px] text-[#71717A]">{label}</p>
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
      className="flex flex-col items-center justify-center gap-2 bg-[#18181B] border-[0.5px] border-[rgba(255,255,255,0.12)] rounded-[7px] p-[10px_14px] min-h-[56px] hover:border-[rgba(255,255,255,0.25)] transition-colors duration-100 group"
    >
      <Icon size={18} className="text-[#71717A] group-hover:text-[#A1A1AA] transition-colors duration-100" />
      <span className="font-body text-[11px] text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors duration-100 text-center">
        {label}
      </span>
    </Link>
  );
}

function SetupStep({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-[7px] text-[12px] transition-colors ${
        done
          ? 'bg-[rgba(16,185,129,0.08)] text-[#10B981]'
          : 'bg-[#18181B] text-[#A1A1AA] hover:bg-[#27272A]'
      }`}
    >
      {done ? (
        <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border border-[#52525B] shrink-0" />
      )}
      <span className={done ? 'line-through opacity-60' : ''}>{label}</span>
      {!done && <ArrowRight size={12} className="ml-auto text-[#52525B]" />}
    </Link>
  );
}
