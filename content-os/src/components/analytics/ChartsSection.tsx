'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import type { Post } from '@/lib/types';
import PillarDot from '@/components/PillarDot';

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + '...' : s;
}

const CHART_TOOLTIP = {
  backgroundColor: '#18181B',
  border: '0.5px solid rgba(255,255,255,0.12)',
  color: '#FAFAFA',
};

const CHART_COLORS = {
  coral: '#6366F1',
  yellow: '#F59E0B',
  green: '#10B981',
  grid: 'rgba(255,255,255,0.08)',
  text: '#71717A',
};

interface ChartsSectionProps {
  posts: Post[];
  getLabel: (v: string) => string;
  getColor: (v: string) => string;
}

export default function ChartsSection({ posts, getLabel, getColor }: ChartsSectionProps) {
  const viewsData = posts.map((p) => ({ name: truncate(p.title, 20), views: p.views ?? 0 }));
  const savesData = posts.map((p) => ({ name: truncate(p.title, 20), saves: p.saves ?? 0 }));

  const followsData = [...posts]
    .filter((p) => p.posted_date)
    .sort((a, b) => new Date(a.posted_date!).getTime() - new Date(b.posted_date!).getTime())
    .map((p) => ({
      date: new Date(p.posted_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      follows: p.follows_gained ?? 0,
    }));

  const pillarMap: Record<string, { total: number; count: number }> = {};
  posts.forEach((p) => {
    if (!pillarMap[p.pillar]) pillarMap[p.pillar] = { total: 0, count: 0 };
    pillarMap[p.pillar].total += p.views ?? 0;
    pillarMap[p.pillar].count += 1;
  });

  const topBySaves = [...posts].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0)).slice(0, 5);

  return (
    <section className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-6 space-y-8">
      <h2 className="font-heading text-[18px] font-[700] text-[#FAFAFA] flex items-center gap-2">
        <TrendingUp size={20} /> Performance Overview
      </h2>

      {posts.length === 0 ? (
        <p className="text-[#71717A] text-sm">No posted posts with stats yet. Log performance above to see charts.</p>
      ) : (
        <>
          {/* Views by post */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">Views by Post</h3>
            <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={viewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="views" fill={CHART_COLORS.coral} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saves by post */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">Saves by Post</h3>
            <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={savesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="name" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                  <Bar dataKey="saves" fill={CHART_COLORS.yellow} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Follows gained */}
          {followsData.length > 0 && (
            <div>
              <h3 className="text-sm text-[#71717A] mb-2 font-heading">Follows Gained Over Time</h3>
              <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={followsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                    <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                    <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Line type="monotone" dataKey="follows" stroke={CHART_COLORS.green} strokeWidth={2} dot={{ fill: CHART_COLORS.green }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pillar breakdown */}
          {Object.keys(pillarMap).length > 0 && (
            <div>
              <h3 className="text-sm text-[#71717A] mb-2 font-heading">Pillar Breakdown</h3>
              <div className="bg-[#09090B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                  <thead>
                    <tr className="border-b-[0.5px] border-[#FAFAFA]/12">
                      <th className="text-left px-4 py-2.5 text-[#71717A] font-medium">Pillar</th>
                      <th className="text-right px-4 py-2.5 text-[#71717A] font-medium">Posts</th>
                      <th className="text-right px-4 py-2.5 text-[#71717A] font-medium">Avg Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pillarMap).map(([pillar, { total, count }]) => (
                      <tr key={pillar} className="border-b-[0.5px] border-[#FAFAFA]/12/50">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(pillar) }} />
                            <span className="text-[#FAFAFA]">{getLabel(pillar)}</span>
                          </span>
                        </td>
                        <td className="text-right px-4 py-2.5 text-[#FAFAFA]">{count}</td>
                        <td className="text-right px-4 py-2.5 text-[#FAFAFA]">{Math.round(total / count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top 5 by saves */}
          <div>
            <h3 className="text-sm text-[#71717A] mb-2 font-heading">Best Performers (Top 5 by Saves)</h3>
            <div className="space-y-2">
              {topBySaves.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-[#18181B] border-[0.5px] border-[#FAFAFA]/12 rounded-[12px] px-4 py-3">
                  <span className="text-[#6366F1] font-heading text-lg w-6">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#FAFAFA] text-sm truncate">{p.title}</p>
                    <p className="text-[#71717A] text-xs">{p.views ?? 0} views / {p.saves ?? 0} saves</p>
                  </div>
                  <PillarDot pillar={p.pillar} showLabel />
                </div>
              ))}
              {topBySaves.length === 0 && <p className="text-[#71717A] text-sm">No data yet.</p>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
